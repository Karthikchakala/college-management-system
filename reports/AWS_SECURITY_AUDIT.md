# CloudCampus — AWS Security & IAM Audit Report

**Date**: September 2, 2026  
**Auditor**: Senior AWS Security & Compliance Engineer  
**Scope**: AWS IAM, Cognito Authentication, API Gateway, S3, Secrets Manager, CORS, and Git Repository  

---

## 1. IAM Permissions & Role Security

### 1.1. EC2 Instance Profile (`CloudCampus-EC2-Role`)
- **Principle of Least Privilege Assessment**:
  - **Secrets Manager**: Restricted to `arn:aws:secretsmanager:us-east-1:*:secret:cloudcampus/rds*` with action `secretsmanager:GetSecretValue`.
  - **S3 Data Bucket**: Restricted to `arn:aws:s3:::cloudcampus-511225358997/*` with actions `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`.
  - **CloudWatch Logs**: Permissions scoped to `/aws/ec2/cloudcampus-backend` for log streaming via CloudWatch agent.
- **Audit Finding**: **PASS**. No `AdministratorAccess` or `PowerUserAccess` policies are attached. Static IAM access keys (`AKIA...`) are completely eliminated in favor of AWS SDK v3 Default Credential Provider Chain.

---

## 2. Authentication & Cryptographic Token Verification

| Security Control | Implementation | Audit Verdict |
|---|---|---|
| **Identity Provider** | Amazon Cognito User Pool `us-east-1_Ic9huqJjL` | **SECURE** |
| **Client Authentication Flow** | OAuth 2.0 PKCE Authorization Code Grant (S256 code challenge with sync SHA-256 fallback) | **SECURE** |
| **Token Verification** | `aws-jwt-verify` against Cognito JWKS public key set | **SECURE** |
| **Local JWT Bypass Protection** | In production (`NODE_ENV=production`), local fallback is strictly forbidden | **ENFORCED** |
| **Identity Linking** | Verified email and unique `cognitoSub` matching; prevents profile hijacking | **ENFORCED** |

---

## 3. Storage Security (Amazon S3)

### 3.1. Application Data Bucket (`cloudcampus-511225358997`)
- **Status**: **100% PRIVATE**.
- **Block Public Access**: Fully Enabled (`BlockPublicAcls = true`, `IgnorePublicAcls = true`, `BlockPublicPolicy = true`, `RestrictPublicBuckets = true`).
- **Encryption**: Server-side encryption with Amazon S3 managed keys (SSE-S3).
- **Access Pattern**: Accessed strictly via server-side AWS SDK and short-lived presigned URLs (15-minute expiration).

### 3.2. Frontend Website Bucket (`cloudcampus-frontend-production`)
- **Status**: **PUBLIC STATIC READ ONLY**.
- **Policy**: Scoped strictly to `s3:GetObject` on `arn:aws:s3:::cloudcampus-frontend-production/*`. No `PutObject`, `DeleteObject`, or `ListBucket` permissions are granted publicly.
- **Future Migration**: Upon completion of AWS CloudFront account verification, public read access will be removed and restricted via CloudFront Origin Access Control (OAC).

---

## 4. API Gateway & Network Security

- **Ingress Point**: `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`
- **Cognito Authorizer**: Actively enforces valid JWT tokens on protected routes (`/api/*`).
- **CORS Hardening**: Explicitly allows `http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com` without wildcard `*`.
- **Negative Testing Verification**:
  - Unauthenticated `GET /api/test` returns `HTTP 401 Unauthorized`.
  - Student accessing `/api/admin/*` returns `HTTP 403 Forbidden`.
  - Faculty A modifying Faculty B Exam returns `HTTP 403 Forbidden`.
