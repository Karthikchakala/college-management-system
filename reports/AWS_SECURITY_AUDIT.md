# CloudCampus — AWS Security & IAM Audit Report

**Date**: September 2, 2026  
**Auditor**: Senior AWS Security & Compliance Engineer  
**Scope**: AWS IAM, Cognito Authentication, API Gateway, S3, Secrets Manager, CORS, and Git Repository  

---

## 1. IAM Permissions & Role Security

### 1.1. EC2 Instance Profile (`CloudCampus-EC2-Role`)
- **Principle of Least Privilege Assessment**:
  - **Secrets Manager**: Restricted to `arn:aws:secretsmanager:us-east-1:*:secret:cloudcampus/rds*` with action `secretsmanager:GetSecretValue`.
  - **S3 Bucket**: Restricted to `arn:aws:s3:::cloudcampus-511225358997/*` with actions `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`.
  - **CloudWatch Logs**: Permissions scoped to `/aws/ec2/cloudcampus-backend` for log streaming via CloudWatch agent.
- **Audit Finding**: **PASS**. No `AdministratorAccess` or `PowerUserAccess` policies are attached. Static IAM access keys (`AKIA...`) are completely eliminated in favor of AWS SDK v3 Default Credential Provider Chain.

### 1.2. Lambda Execution Role (`CloudCampus-Health-Role`)
- Scoped to read access on test objects in `cloudcampus-511225358997` and standard CloudWatch logging.

---

## 2. Authentication & Cryptographic Token Verification

| Security Control | Implementation | Audit Verdict |
|---|---|---|
| **Identity Provider** | Amazon Cognito User Pool `us-east-1_Ic9huqJjL` | **SECURE** |
| **Client Authentication Flow** | OAuth 2.0 PKCE Authorization Code Grant (S256 code challenge) | **SECURE** |
| **Token Verification** | `aws-jwt-verify` against Cognito JWKS public key set | **SECURE** |
| **Local JWT Bypass Protection** | In production (`NODE_ENV=production`), local fallback is strictly forbidden | **ENFORCED** |
| **Identity Linking** | Verified email and unique `cognitoSub` matching; prevents profile hijacking | **ENFORCED** |

---

## 3. Storage Security (Amazon S3)

- **Bucket**: `cloudcampus-511225358997`
- **Public Access**: **Block Public Access** is fully enabled. Bucket ACLs are disabled.
- **Encryption**: Server-side encryption with Amazon S3 managed keys (SSE-S3) enabled by default.
- **Object Access Model**: Objects are private. Secure access is provided exclusively via server-generated, short-lived presigned URLs (15-minute expiration).

---

## 4. API Gateway & Network Security

- **Ingress Point**: `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`
- **Cognito Authorizer**: Actively enforces valid JWT tokens on protected routes (`/api/*`).
- **Negative Testing Verification**:
  - Unauthenticated `GET /api/test` returns `HTTP 401 Unauthorized`.
  - Verified live via HTTPS request.
- **Rate Limiting**: Express middleware enforces a rate limit of 300 requests per 15-minute window per IP.

---

## 5. Role-Based Access Control (RBAC) & Ownership Enforcement

| Negative Test Case | Expected Behavior | Actual Behavior | Status |
|---|---|---|---|
| **Unauthenticated API Access** | HTTP 401 Unauthorized | HTTP 401 | **PASS** |
| **Student Access to Admin API** (`/api/admin/*`) | HTTP 403 Forbidden | HTTP 403 | **PASS** |
| **Student Access to Faculty API** (`/api/faculty/*`) | HTTP 403 Forbidden | HTTP 403 | **PASS** |
| **Faculty A modifying Faculty B Exam** | HTTP 403 Forbidden | HTTP 403 | **PASS** |
| **Faculty A publishing Faculty B Results** | HTTP 403 Forbidden | HTTP 403 | **PASS** |
| **Faculty A grading Faculty B Submissions** | HTTP 403 Forbidden | HTTP 403 | **PASS** |

---

## 6. Secrets & Git Repository Hygiene

- **Tracked Files Audit**: Complete scan of `git ls-files` confirmed 0 `.env` or credential files committed.
- **Entropy & Pattern Scanning**: 0 AWS Access Keys (`AKIA...`), 0 Private Keys, and 0 production database connection strings in tracked files.
- **Prisma Tooling**: All database migration and seeding scripts use `scripts/prisma-with-secrets.js` to dynamically fetch credentials from AWS Secrets Manager directly into memory without writing passwords to disk.
