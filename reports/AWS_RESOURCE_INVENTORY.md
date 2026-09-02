# CloudCampus — AWS Resource Inventory

**Date**: September 2, 2026  
**AWS Region**: `us-east-1`  
**Deployment Environment**: Production (Active: S3 Static Website Hosting)  

---

## 1. Resource Inventory Matrix

| AWS Service | Resource Name / Identifier | Verification Status | Public / Private | Purpose | Dependencies / Upstream |
|---|---|---|---|---|---|
| **Amazon S3 (Frontend)** | `cloudcampus-frontend-production` | **PASS — VERIFIED LIVE** | Public Static Website (`http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com`) | Static website hosting for compiled React/Vite production build (`dist/`) | S3 Website Hosting & Routing Rules |
| **Amazon API Gateway** | `CloudCampus-API` (`7k2yo6gy77`) | **PASS — VERIFIED LIVE** | Public HTTPS Endpoint (`https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`) | Ingress gateway, CORS handling, Cognito Authorizer enforcement | Route `/health` → Lambda<br>Route `/api/*` → EC2 Backend |
| **Amazon Cognito** | User Pool: `us-east-1_Ic9huqJjL`<br>App Client: `3kv2vgpkklqtlpfom2t72dn29n`<br>Domain: `https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com` | **PASS — VERIFIED LIVE** | Public HTTPS Auth Domain | OAuth 2.0 PKCE authentication provider, user directory, JWT issuer | Frontend OAuth Callback<br>API Gateway Authorizer<br>Express JWKS Validator |
| **AWS Lambda** | `CloudCampus-Health-Function` | **PASS — VERIFIED LIVE** | Invoked via API Gateway | Serverless health validation & S3 integration monitor | Attached to `GET /health`<br>Accesses S3 Data Bucket |
| **Amazon S3 (Data)** | `cloudcampus-511225358997` | **PASS — VERIFIED LIVE** | Private (Block Public Access ON: 100%) | Secure document storage for assignment materials and student submissions | EC2 IAM Role<br>Lambda Health Function |
| **Amazon CloudFront** | Frontend CDN Distribution | **BLOCKED (Account Verification)** | Target: HTTPS CDN | Deferred pending account-level CloudFront verification | Frontend S3 Bucket Origin |
| **Amazon EC2** | `CloudCampus-EC2` (Amazon Linux / Ubuntu) | **CONFIGURED / OBSERVED** | Private Subnet / Port 5000 (Internal SG) | Node.js + Express backend application runtime managed by PM2 | IAM Role: `CloudCampus-EC2-Role`<br>RDS PostgreSQL<br>Secrets Manager |
| **Amazon RDS** | `cloudcampus-db` (`campusadmin`) | **CONFIGURED / PRESERVED** | Private Subnet / Port 5432 | PostgreSQL relational database for academic management models | Security Group from EC2 SG<br>AWS Secrets Manager |
| **AWS Secrets Manager** | `cloudcampus/rds` | **CONFIGURED / OBSERVED** | Private VPC Endpoint / AWS Internal | Secure storage of PostgreSQL credentials (host, port, user, password, db) | IAM instance profile on EC2 |
| **Amazon CloudWatch** | Log Group: `/aws/ec2/cloudcampus-backend`<br>Namespace: `AWS/EC2`, `AWS/ApiGateway`, `AWS/Lambda`, `AWS/RDS`, `CloudCampus/Application` | **PASS — VERIFIED LIVE** | AWS Internal / Admin API | Ingestion of application logs, alarm monitoring, real-time infrastructure telemetry | CloudWatch Agent on EC2<br>Express `requestLogger` middleware |
| **AWS IAM** | `CloudCampus-EC2-Role` | **CONFIGURED / OBSERVED** | IAM Instance Profile | Keyless access for EC2 instance to Secrets Manager, S3, and CloudWatch | EC2 Instance |

---

## 2. Active Deployment Architecture

```
                    [ End Users ]
                          │
            ┌─────────────┴─────────────┐
            │ HTTP                      │ HTTPS
            ▼                           ▼
[ S3 Static Website Hosting ]   [ AWS API Gateway (7k2yo6gy77) ]
(cloudcampus-frontend-          (Cognito JWT Authorizer)
 production)                            │
 (SPA Error Routing Rules)              ▼
                                [ EC2 Backend (Port 5000) ]
                                (Express + PM2 Cluster)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
          [ RDS PostgreSQL ]    [ S3: Documents ]   [ Secrets Manager ]
          (cloudcampus-db)      (cloudcampus-       (cloudcampus/rds)
          db: campusadmin        511225358997)
                                 (STRICTLY PRIVATE)
```
