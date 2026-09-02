# CloudCampus — Comprehensive AWS Production Deployment Guide

This document is the authoritative runbook and operational architecture specification for deploying, managing, and maintaining the **CloudCampus College Campus Management System** on Amazon Web Services (AWS) in region `us-east-1`.

---

## 1. Architecture Overview

The system uses a highly available, decoupled cloud architecture separating static frontend edge delivery from secured application APIs and private data tiers.

```
                                [ USERS ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  │ HTTPS (Port 443)                  │ HTTPS (Port 443)
                  ▼                                   ▼
      [ Amazon CloudFront CDN ]           [ Amazon API Gateway (HTTP API) ]
      (dXXXXXXXX.cloudfront.net)          (ID: 7k2yo6gy77 / Stage: prod)
      • SPA Routing: index.html Fallback  • Cognito JWT Authorizer
      • SSL/TLS Termination               • CORS Policy Enforcement
                  │                                   │
                  ▼                                   │ Cognito Bearer Token
        [ Amazon S3 Bucket ]                          ▼
    (cloudcampus-frontend-prod)           [ Amazon EC2 Instance ]
    • React/Vite Compiled Assets          (CloudCampus-EC2 / Port 5000)
    • Private Origin (OAC)                • Node.js 20 / Express / TypeScript
                                          • PM2 Cluster Process Manager
                                          • Role: CloudCampus-EC2-Role
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
            [ Amazon RDS PostgreSQL ]       [ Amazon S3 Private ]          [ AWS Secrets Manager ]
            (cloudcampus-db / Port 5432)    (cloudcampus-511225358997)     (cloudcampus/rds)
            • Database: campusadmin         • Encrypted Document Store     • Dynamic Database Credentials
            • Private Subnet Security       • 15-Min Presigned URLs        • Keyless In-Memory Resolution
```

---

## 2. AWS Services & Resource Specifications

| AWS Service | Resource Name / ID | Purpose | Security & Exposure |
|---|---|---|---|
| **Amazon CloudFront** | Production Distribution | CDN edge caching, SSL, SPA routing | Public HTTPS (Origin restricted to S3) |
| **Amazon S3 (Frontend)** | `cloudcampus-frontend-production` | Static build hosting (`frontend/dist/`) | Private (Origin Access Control) |
| **Amazon API Gateway** | `CloudCampus-API` (`7k2yo6gy77`) | Public API ingress and JWT validation | Public HTTPS (`/prod/api`, `/health`) |
| **Amazon Cognito** | User Pool: `us-east-1_Ic9huqJjL`<br>Client: `3kv2vgpkklqtlpfom2t72dn29n` | Identity provider, user auth, OAuth 2.0 PKCE | Public HTTPS Auth Domain |
| **Amazon EC2** | `CloudCampus-EC2` | Express application runtime | Private Security Group (Port 5000) |
| **Amazon RDS** | `cloudcampus-db` (`campusadmin`) | Relational database (Prisma ORM) | Private Subnet (Port 5432) |
| **Amazon S3 (Storage)** | `cloudcampus-511225358997` | Assignment & student document storage | Private (Block Public Access ON) |
| **AWS Secrets Manager** | `cloudcampus/rds` | PostgreSQL master credentials | Private (IAM instance profile) |
| **AWS Lambda** | `CloudCampus-Health-Function` | Serverless health & S3 diagnostic probe | Triggered via API Gateway `/health` |
| **Amazon CloudWatch** | Agent & Log Groups | System telemetry, metrics, and alarms | CloudWatch Agent & SDK |

---

## 3. Environment Variables Configuration

### 3.1. Backend Production (`backend/.env`)
```bash
NODE_ENV=production
PORT=5000
AWS_REGION=us-east-1
AWS_SECRET_NAME=cloudcampus/rds
AWS_S3_BUCKET=cloudcampus-511225358997
COGNITO_USER_POOL_ID=us-east-1_Ic9huqJjL
COGNITO_CLIENT_ID=3kv2vgpkklqtlpfom2t72dn29n
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL
COGNITO_DOMAIN=https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net
```

### 3.2. Frontend Production (`frontend/.env.production`)
```bash
VITE_API_BASE_URL=https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api
VITE_COGNITO_USER_POOL_ID=us-east-1_Ic9huqJjL
VITE_COGNITO_CLIENT_ID=3kv2vgpkklqtlpfom2t72dn29n
VITE_COGNITO_DOMAIN=https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=
```

---

## 4. Deployment Runbooks

### 4.1. Frontend Build & S3/CloudFront Deployment
```bash
# 1. Build the production React/Vite bundle
cd frontend
npm ci
npm run build

# 2. Sync distribution bundle to S3 Frontend Bucket
aws s3 sync dist/ s3://cloudcampus-frontend-production/ --delete

# 3. Invalidate CloudFront CDN Cache
aws cloudfront create-invalidation --distribution-id <YOUR_DISTRIBUTION_ID> --paths "/*"
```

### 4.2. Backend EC2 Deployment & PM2 Process Management
```bash
# 1. SSH into EC2 Server
ssh -i your-ec2-key.pem ec2-user@<EC2_PRIVATE_OR_PUBLIC_IP>

# 2. Clone/pull latest repository
cd /var/www/cloudcampus/backend
git pull origin main
npm ci

# 3. Prisma Client Generation & Migration Status Check
npx prisma generate
node scripts/prisma-with-secrets.js migrate status
node scripts/prisma-with-secrets.js migrate deploy

# 4. Build TypeScript application
npm run build

# 5. Start / Reload with PM2 Cluster
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
```

---

## 5. Security & Identity Mapping

1. **Zero Secret Footprint**: No database passwords or secret keys are stored in Git or environment files on disk. Database credentials are encrypted in AWS Secrets Manager and fetched directly into Node.js process memory.
2. **Cryptographic Token Verification**: The backend verifies incoming Cognito JWTs using JWKS signature keys (`aws-jwt-verify`). Local JWT bypass is strictly forbidden in production.
3. **Identity Federation**: When a user logs in via Cognito SSO, `User.cognitoSub` is linked to their database record securely using their verified email address.

---

## 6. CloudWatch Observability & Monitoring

The system monitors infrastructure health using Amazon CloudWatch:
- **EC2 Health**: CPU, memory utilization (`mem_used_percent`), disk usage (`disk_used_percent`).
- **API Gateway Metrics**: Request count, 4XX/5XX error rates, latency.
- **Lambda Function**: Invocations, duration, errors.
- **RDS PostgreSQL**: Database connections, free storage space, CPU.
- **Alarms**: Real-time evaluation against production thresholds.

---

## 7. Troubleshooting & Diagnostics

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| **401 Unauthorized on API** | Missing or expired Cognito token | Refresh session or verify user pool client ID |
| **CORS Blocked Error in Browser** | Origin not in `FRONTEND_URL` | Add origin to `FRONTEND_URL` in `backend/.env` |
| **Database Connection Error** | IAM role missing Secrets Manager permission | Verify `CloudCampus-EC2-Role` has `secretsmanager:GetSecretValue` on `cloudcampus/rds` |
| **S3 Upload Failure** | Missing IAM S3 write permission | Verify IAM role has `s3:PutObject` on `cloudcampus-511225358997/*` |
| **404 on Refreshing SPA Route** | CloudFront SPA error response missing | Set CloudFront Error Pages: 403 & 404 → `/index.html` (HTTP 200) |
