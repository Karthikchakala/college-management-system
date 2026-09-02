# CloudCampus — AWS Resource Inventory

**Date**: September 2, 2026  
**AWS Region**: `us-east-1`  
**Deployment Environment**: Production  

---

## 1. Resource Inventory Matrix

| AWS Service | Resource Name / Identifier | Verification Status | Public / Private | Purpose | Dependencies / Upstream |
|---|---|---|---|---|---|
| **Amazon API Gateway** | `CloudCampus-API` (`7k2yo6gy77`) | **VERIFIED LIVE** | Public HTTPS Endpoint (`https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`) | Ingress gateway, CORS handling, Cognito Authorizer enforcement | Route `/health` → Lambda<br>Route `/api/*` → EC2 Backend |
| **Amazon Cognito** | User Pool: `us-east-1_Ic9huqJjL`<br>App Client: `3kv2vgpkklqtlpfom2t72dn29n`<br>Domain: `https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com` | **VERIFIED LIVE** | Public HTTPS Auth Domain | OAuth 2.0 PKCE authentication provider, user directory, JWT issuer | Frontend OAuth Callback<br>API Gateway Authorizer<br>Express JWKS Validator |
| **AWS Lambda** | `CloudCampus-Health-Function` | **VERIFIED LIVE** | Invoked via API Gateway | Serverless health validation & S3 integration monitor | Attached to `GET /health`<br>Accesses S3 Bucket |
| **Amazon S3 (Data)** | `cloudcampus-511225358997` | **VERIFIED LIVE** | Private (Block Public Access ON) | Secure document storage for assignment materials and student submissions | EC2 IAM Role<br>Lambda Health Function |
| **Amazon S3 (Frontend)** | `cloudcampus-frontend-production` | **CONFIGURED** | Private (OAI / CloudFront Origin Only) | Static website hosting for compiled React/Vite production build (`dist/`) | CloudFront Distribution |
| **Amazon CloudFront** | Frontend CDN Distribution | **CONFIGURED** | Public HTTPS CDN | Global edge delivery, SSL termination, SPA routing fallback (`index.html`) | Frontend S3 Bucket Origin |
| **Amazon EC2** | `CloudCampus-EC2` (Amazon Linux / Ubuntu) | **CONFIGURED / OBSERVED** | Private Subnet / Port 5000 (Internal SG) | Node.js + Express backend application runtime managed by PM2 | IAM Role: `CloudCampus-EC2-Role`<br>RDS PostgreSQL<br>Secrets Manager |
| **Amazon RDS** | `cloudcampus-db` (`campusadmin`) | **CONFIGURED / OBSERVED** | Private Subnet / Port 5432 | PostgreSQL relational database for academic management models | Security Group from EC2 SG<br>AWS Secrets Manager |
| **AWS Secrets Manager** | `cloudcampus/rds` | **CONFIGURED / OBSERVED** | Private VPC Endpoint / AWS Internal | Secure storage of PostgreSQL credentials (host, port, user, password, db) | IAM instance profile on EC2 |
| **Amazon CloudWatch** | Log Group: `/aws/ec2/cloudcampus-backend`<br>Namespace: `AWS/EC2`, `AWS/ApiGateway`, `AWS/Lambda`, `AWS/RDS`, `CloudCampus/Application` | **VERIFIED LIVE / CONFIGURED** | AWS Internal / Admin API | Ingestion of application logs, alarm monitoring, real-time infrastructure telemetry | CloudWatch Agent on EC2<br>Express `requestLogger` middleware |
| **AWS IAM** | `CloudCampus-EC2-Role` | **CONFIGURED / OBSERVED** | IAM Instance Profile | Keyless access for EC2 instance to Secrets Manager, S3, and CloudWatch | EC2 Instance |

---

## 2. Network & Routing Topography

```
                    [ End Users ]
                          │
            ┌─────────────┴─────────────┐
            │ HTTPS                     │ HTTPS
            ▼                           ▼
[ CloudFront Distribution ]     [ AWS API Gateway (7k2yo6gy77) ]
(SPA Routing Fallback)          (Cognito JWT Authorizer)
            │                           │
            ▼                           ▼
[ S3: Frontend Assets ]         [ EC2 Backend (Port 5000) ]
(dist/ bundle)                  (Express + PM2 Cluster)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
          [ RDS PostgreSQL ]    [ S3: Documents ]   [ Secrets Manager ]
          (cloudcampus-db)      (cloudcampus-       (cloudcampus/rds)
          db: campusadmin        511225358997)
```

---

## 3. Resource Reuse & Anti-Duplication Directives

1. **No Duplicate S3 Buckets**: Preserved existing private bucket `cloudcampus-511225358997` for document storage.
2. **No Duplicate Cognito Pools**: Preserved existing User Pool `us-east-1_Ic9huqJjL` and Client `3kv2vgpkklqtlpfom2t72dn29n`.
3. **No Duplicate API Gateways**: Integrated with existing HTTP API `7k2yo6gy77`.
4. **No Destructive Database Operations**: Existing database `campusadmin` and CSE department / course records remain completely preserved.
