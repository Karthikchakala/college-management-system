# CloudCampus — AWS Pre-Deployment Audit Report

**Date**: September 2, 2026  
**Auditor**: Senior AWS DevOps & Cloud Solutions Architect  
**Repository**: `Karthikchakala/college-management-system`  
**Target AWS Region**: `us-east-1`  

---

## 1. Executive Summary

This pre-deployment audit establishes the technical baseline of the **College Campus Management System (CloudCampus)** codebase, examining build pipelines, framework configurations, environment variables, authentication flows, data layers, and security posture prior to finalizing production deployment on AWS.

---

## 2. Technical Stack & Build Specifications

| Component | Technology | Version | Build Command | Start Command | Output Directory |
|---|---|---|---|---|---|
| **Frontend** | React + Vite + TypeScript + TailwindCSS | React 18.3.1, Vite 5.4.0, TS 5.5.4 | `npm run build` (`tsc && vite build`) | `npx vite preview` / Static Hosting | `frontend/dist/` |
| **Backend** | Node.js + Express + TypeScript | Node.js 20/22, Express 4.19.2, TS 5.5.4 | `npm run build` (`tsc`) | `pm2 start ecosystem.config.js` | `backend/dist/` |
| **ORM / Data** | Prisma ORM | Prisma 5.18.0 / PostgreSQL | `npx prisma generate` | `node dist/app.js` | `@prisma/client` |

---

## 3. Architecture & Integration Audit

### 3.1. Frontend Architecture
- **Framework**: React single-page application (SPA) bundled via Vite.
- **Routing**: Client-side routing with `react-router-dom` v6 (`/student/*`, `/faculty/*`, `/admin/*`).
- **State Management & Auth**: Context API (`AuthContext.tsx`, `NotificationContext.tsx`) with automatic token injection via Axios interceptors.
- **AWS Cognito Integration**: PKCE OAuth 2.0 authorization code flow pointing to Hosted UI (`https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com`).

### 3.2. Backend Architecture
- **Process Management**: PM2 cluster mode on Amazon EC2 (`CloudCampus-EC2`), listening on port `5000`.
- **Database Connection Mechanism**: Dynamic credentials resolution via AWS Secrets Manager (`cloudcampus/rds`) using the attached EC2 IAM Role (`CloudCampus-EC2-Role`). In-memory SSL connection string generation prevents credential exposure.
- **Cognito JWT Validation**: In production (`NODE_ENV=production`), incoming Bearer tokens are validated cryptographically via JWKS signature verification (`aws-jwt-verify`). Local JWT fallback is strictly rejected.
- **Storage Layer**: Amazon S3 bucket `cloudcampus-511225358997` used for private document storage (assignments, submissions). Short-lived (15-minute) presigned URLs provide access without public ACLs.
- **Monitoring Layer**: Native AWS CloudWatch integration via `@aws-sdk/client-cloudwatch` and `@aws-sdk/client-cloudwatch-logs`. Real-time telemetry exposed to Admin Monitoring.

---

## 4. CORS & Network Configuration Audit

- **CORS Posture**: Backend strictly validates `Origin` headers against:
  1. Configured `FRONTEND_URL` entries
  2. Amazon CloudFront distributions (`*.cloudfront.net`)
  3. Local development origins (`localhost:3000`, `localhost:5173`) in non-production environments.
- **No Wildcard Exposure**: `Access-Control-Allow-Origin: *` is disabled for all authenticated routes with credentials.
- **Supported Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH`.
- **Allowed Headers**: `Content-Type`, `Authorization`, `X-Requested-With`, `Accept`, `X-Request-Id`.

---

## 5. Security & Secret Exposure Audit

| Check | Target | Status | Detail |
|---|---|---|---|
| **Git Status** | Tracked Files | **PASS** | No `.env` files tracked in Git history (only `.env.example` templates exist). |
| **Hardcoded AWS Keys** | `AKIA...` pattern | **PASS** | 0 static access keys found in source code. |
| **Database Passwords** | Source Code & Configs | **PASS** | DB credentials retrieved exclusively at runtime from Secrets Manager. |
| **S3 Access Control** | S3 Bucket Policy | **PASS** | Bucket is private; objects accessed only via signed URLs. |
| **JWT Verification** | Auth Middleware | **PASS** | Production mode strictly enforces cryptographic Cognito JWKS verification. |

---

## 6. Pre-Deployment Configuration Remediation

1. **Fixed Frontend Production User Pool ID Typo**:
   - In `frontend/.env.production`, corrected `VITE_COGNITO_USER_POOL_ID` from `us-east-1_Ic9huqjL` to `us-east-1_Ic9huqJjL`.
2. **Dynamic Redirect URI Support**:
   - Allowed `VITE_COGNITO_REDIRECT_URI` to fallback dynamically to `window.location.origin` for CloudFront / HTTPS origins.
3. **Enhanced CORS Origin Handling**:
   - Added automated support for `*.cloudfront.net` origins alongside explicit `FRONTEND_URL` values.
