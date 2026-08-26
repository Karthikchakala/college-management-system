# CloudCampus — AWS Migration Architecture Guide

This document outlines the complete architectural design, AWS integrations, data flows, and security model for the **CloudCampus** College Campus Management System.

---

## 1. Architecture Overview

```
                          [ USERS ]
                              |
                              v
                    [ React Frontend (Vite) ]
                              |
                            HTTPS
                              |
                              v
                    [ AWS API Gateway ]
                   (HTTP API: CloudCampus-API)
                              |
                      Cognito JWT Bearer
                              |
                              v
                  [ EC2 Backend Server ]
                 (Express + TS + Prisma)
                   Process: PM2 Cluster
                 Role: CloudCampus-EC2-Role
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
   [ RDS PostgreSQL ]   [ Private S3 ]     [ Secrets Manager ]
   (cloudcampus-db)    (cloudcampus-       (cloudcampus/rds)
   db: campusadmin      511225358997)     Database Credentials
```

---

## 2. AWS Services Used & Resource Mapping

| Service | Resource Name / ID | Purpose |
|---|---|---|
| **Amazon EC2** | `CloudCampus-EC2` | Hosts production Node.js/Express backend managed via PM2 |
| **IAM Role** | `CloudCampus-EC2-Role` | Attached to EC2 for keyless access to Secrets Manager and S3 |
| **Amazon RDS** | `cloudcampus-db` (`campusadmin`) | PostgreSQL relational database for application models |
| **AWS Secrets Manager** | `cloudcampus/rds` | Stores dynamic RDS username, password, host, and port |
| **Amazon S3** | `cloudcampus-511225358997` | Private object storage with presigned GET URLs |
| **Amazon Cognito** | Pool: `us-east-1_lC9huqjL`<br>Client: `3kv2vgpkklqtlpfom2t72dn29n` | Identity provider, user authentication, and JWT issuer |
| **Amazon API Gateway** | `CloudCampus-API` (`prod`) | Public HTTPS entry point with Cognito Authorizer |
| **Amazon CloudWatch** | CloudWatch Logs Agent | Ingests structured JSON logs from EC2 instance |

---

## 3. Security Design

1. **No Static AWS Access Keys**: The backend uses the AWS SDK v3 Default Credential Provider Chain to automatically authenticate via `CloudCampus-EC2-Role`.
2. **Private S3 Bucket**: All S3 objects are stored privately without public ACLs. Access is authorized via short-lived (15-minute) presigned URLs generated server-side.
3. **Cryptographic JWT Verification**: In production, backend validates incoming Cognito JWTs using JWKS signature checking (`aws-jwt-verify`). Local JWT fallback is disabled in production.
4. **Credential Isolation**: Database credentials are never committed to version control, logged to standard output, or returned via API responses.

---

## 4. Cognito User Identity Mapping

- Cognito handles authentication; the application database handles role-based authorization (`ADMIN`, `FACULTY`, `STUDENT`).
- `User.cognitoSub` uniquely links the Cognito identity (`sub` claim) to the application database record.
- If a user signs in for the first time with an existing verified email, the backend securely links `cognitoSub` to the existing profile without creating duplicate records.

---

## 5. Environment Variables Reference

### Backend (`.env`)
```bash
NODE_ENV=production
PORT=5000
AWS_REGION=us-east-1
AWS_SECRET_NAME=cloudcampus/rds
AWS_S3_BUCKET=cloudcampus-511225358997
COGNITO_USER_POOL_ID=us-east-1_lC9huqjL
COGNITO_CLIENT_ID=3kv2vgpkklqtlpfom2t72dn29n
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lC9huqjL
COGNITO_DOMAIN=https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (`.env`)
```bash
VITE_API_BASE_URL=https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api
VITE_COGNITO_USER_POOL_ID=us-east-1_lC9huqjL
VITE_COGNITO_CLIENT_ID=3kv2vgpkklqtlpfom2t72dn29n
VITE_COGNITO_DOMAIN=https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=https://your-frontend-domain.com
```
