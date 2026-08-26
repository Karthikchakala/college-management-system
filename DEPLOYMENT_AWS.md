# CloudCampus — AWS Deployment Guide (EC2 & API Gateway)

This runbook provides the exact steps for deploying the **CloudCampus Backend** on Amazon EC2 and configuring Amazon API Gateway.

---

## 1. Prerequisites Checklist

Ensure the following AWS resources are in `us-east-1`:
- **EC2 Instance**: `CloudCampus-EC2` (Amazon Linux 2023 or Ubuntu 22.04 LTS)
- **IAM Role**: `CloudCampus-EC2-Role` attached to `CloudCampus-EC2` with permissions for:
  - `secretsmanager:GetSecretValue` on `arn:aws:secretsmanager:us-east-1:*:secret:cloudcampus/rds*`
  - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::cloudcampus-511225358997/*`
- **Security Groups**:
  - EC2 Security Group allows Inbound TCP port 5000 (or port 80/443 if using NGINX) from API Gateway / VPC / Load Balancer.
  - RDS Security Group allows Inbound TCP port 5432 from EC2 Security Group.

---

## 2. Server Setup on EC2

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP_OR_DNS>
```

### Install Node.js 20 & PM2
```bash
# Update packages
sudo dnf update -y || sudo apt update -y

# Install Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git || sudo apt install -y nodejs git

# Verify installation
node -v
npm -v

# Install PM2 globally
sudo npm install -g pm2
```

---

## 3. Application Deployment Commands

```bash
# Clone the repository
git clone https://github.com/Karthikchakala/college-management-system.git /var/www/cloudcampus
cd /var/www/cloudcampus/backend

# Install dependencies
npm ci

# Configure environment file (.env)
cat << 'EOF' > .env
NODE_ENV=production
PORT=5000
AWS_REGION=us-east-1
AWS_SECRET_NAME=cloudcampus/rds
AWS_S3_BUCKET=cloudcampus-511225358997
COGNITO_USER_POOL_ID=us-east-1_lC9huqjL
COGNITO_CLIENT_ID=3kv2vgpkklqtlpfom2t72dn29n
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lC9huqjL
COGNITO_DOMAIN=https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com
FRONTEND_URL=https://your-production-frontend-url.com
EOF

# Compile TypeScript
npm run build

# ==============================================================================
# Prisma Migration Procedure with AWS Secrets Manager
# ==============================================================================
# Why: Standalone Prisma CLI does not execute Express application startup code.
# The wrapper `scripts/prisma-with-secrets.js` uses the attached EC2 IAM Role to:
# 1. Fetch credentials from AWS Secrets Manager ("cloudcampus/rds")
# 2. In-memory construct the SSL RDS URL (database: campusadmin, host: cloudcampus-db...rds.amazonaws.com)
# 3. Safely pass DATABASE_URL into Prisma CLI without persisting passwords to .env or disk.

# 1. Inspect migration status against RDS PostgreSQL:
npm run prisma:status
# (Equivalent to: node scripts/prisma-with-secrets.js migrate status)

# 2. Deploy pending migrations safely to RDS PostgreSQL:
npm run prisma:deploy
# (Equivalent to: node scripts/prisma-with-secrets.js migrate deploy)

# Create log directory
sudo mkdir -p /var/log/cloudcampus
sudo chown -R $USER:$USER /var/log/cloudcampus

# Start application via PM2
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup
```

### Verify Deployment on EC2
```bash
# Check PM2 process status
pm2 status

# Test local health endpoint
curl -i http://localhost:5000/health
```

Expected output:
```json
{"status":"ok","service":"cloudcampus-backend","timestamp":"2026-08-26T..."}
```

---

## 4. API Gateway Integration Configuration

### MANUAL AWS ACTION REQUIRED

To route requests from **CloudCampus-API** to the EC2 backend:

1. Open the [AWS API Gateway Console](https://console.aws.amazon.com/apigateway).
2. Select **CloudCampus-API** (`7k2yo6gy77`).
3. Navigate to **Integrations**:
   - Create an **HTTP Integration** pointing to your EC2 backend target: `http://<EC2_PUBLIC_OR_PRIVATE_IP>:5000`.
4. Navigate to **Routes**:
   - **`GET /health`**: Attach the HTTP integration to `GET /health` (Authorization: None).
   - **`ANY /{proxy+}`** (or `/api/{proxy+}`): Attach the HTTP integration with **Cognito Authorizer** (`CloudCampus-Web` / User Pool `us-east-1_lC9huqjL`).
5. Deploy to stage **`prod`**.

---

## 5. CloudWatch Logs Integration

Install the Amazon CloudWatch Agent on EC2 to aggregate logs:

```bash
# Install CloudWatch Agent
sudo dnf install -y amazon-cloudwatch-agent || sudo apt install -y amazon-cloudwatch-agent

# Create CloudWatch Agent configuration
sudo cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/cloudcampus/backend-out.log",
            "log_group_name": "/aws/ec2/cloudcampus-backend",
            "log_stream_name": "{instance_id}/stdout",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/cloudcampus/backend-error.log",
            "log_group_name": "/aws/ec2/cloudcampus-backend",
            "log_stream_name": "{instance_id}/stderr",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

---

## 6. Rollback Procedure

If a deployment needs to be rolled back on EC2:
```bash
cd /var/www/cloudcampus/backend
git checkout <PREVIOUS_COMMIT_OR_TAG>
npm ci
npx prisma generate
npm run build
pm2 restart cloudcampus-backend
```
