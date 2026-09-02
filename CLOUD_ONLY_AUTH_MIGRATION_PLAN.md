# Cloud-Only Authentication Migration Plan & Architectural Design

**Target File**: `CLOUD_ONLY_AUTH_MIGRATION_PLAN.md`  
**Application**: CloudCampus — College Campus Management System  
**AWS Region**: `us-east-1`  
**Cognito User Pool ID**: `us-east-1_Ic9huqJjL`  
**Cognito App Client ID**: `3kv2vgpkklqtlpfom2t72dn29n`  
**API Gateway**: `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`  
**RDS Database**: `cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com:5432/campusadmin`  
**Document Status**: Proposal & Architecture Design (Read-Only Audit Phase)  

---

## 1. Executive Summary & Architectural Motivation

The CloudCampus application currently maintains two distinct authentication mechanisms:
1. **Legacy Direct Form**: Submits plaintext credentials to `/api/auth/login` and compares against PostgreSQL `User.passwordHash` using `bcrypt`.
2. **AWS Cognito Managed Login (SSO)**: Uses OAuth 2.0 Authorization Code Grant with PKCE to authenticate against Amazon Cognito and issue cryptographically verifiable JWTs.

### Architectural Decision
**The production environment must be 100% cloud-native.**  
- **Amazon Cognito** will serve as the **sole production identity provider and authentication authority** for all three user roles: **Student**, **Faculty**, and **Admin**.
- **Amazon RDS PostgreSQL** will store relational, academic, departmental, and profile data, but will **not** be the production password authority.
- The legacy local database password path (`password123` / `127.0.0.1:5433`) is completely eliminated from the production user flow.

---

## 2. Current vs. Target Cloud-Only Architecture

### Current Mixed Architecture
```
                                     [ CloudCampus User ]
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       │                                             │
             [Cognito SSO Button]                           [Legacy Password Form]
                       │                                             │
                       ▼                                             ▼
             AWS Cognito Hosted UI                           POST /api/auth/login
                       │                                             │
                       ▼                                             ▼
               Cognito User Pool                              Express Backend
                       │                                             │
                       ▼                                             ▼
                 Cognito JWTs                                PostgreSQL User Table
                       │                                             │
                       ▼                                             ▼
               API Gateway (7k2yo6gy77)                  bcrypt.compare(passwordHash)
```

### Target Cloud-Only Architecture
```
                                 [ CloudCampus User ]
                                          │
                                          ▼
                                S3 Static Frontend SPA
                                          │
                                          ▼
                           AWS Cognito Managed Login / Hosted UI
                           (OAuth 2.0 Authorization Code + PKCE)
                                          │
                                          ▼
                        AWS Cognito User Pool (us-east-1_Ic9huqJjL)
                      ┌───────────────────┼───────────────────┐
                      ▼                   ▼                   ▼
                 [Group: STUDENT]    [Group: FACULTY]    [Group: ADMIN]
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                     Tokens Emitted (RS256 ID Token & Access Token)
                                          │
                                          ▼
                             Frontend State (AuthContext)
                 - Extracts `cognito:groups` -> STUDENT / FACULTY / ADMIN
                 - Routes to /student/dashboard, /faculty/dashboard, /admin/dashboard
                                          │
                                          ▼ (Bearer ID Token in Authorization Header)
                            Amazon API Gateway HTTP API v2
                                 (7k2yo6gy77 /prod)
                                          │
                                          ▼
                         AWS Application Load Balancer (ALB)
                                          │
                                          ▼
                           Amazon EC2 Instance (Express PM2)
                 - `authenticate` Middleware validates JWT with `aws-jwt-verify`
                 - Verifies Signature against Cognito JWKS
                 - Validates Issuer: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL
                 - Validates Audience/Client ID: 3kv2vgpkklqtlpfom2t72dn29n
                 - Links/Matches `cognitoSub` -> PostgreSQL `User` Record
                                          │
                                          ▼
                             Amazon RDS PostgreSQL
                 - Retrieves Academic, Departmental & Profile Details
                 - Executes Role-Based Queries (Attendance, Courses, Grades)
```

---

## 3. Current Code Audit & Gap Analysis

| Component | Current State | Target State | Changes Required |
| :--- | :--- | :--- | :---: |
| **Frontend Login Page** (`Login.tsx`) | Displays both Cognito SSO button and legacy Email/Password form with demo box. | Clean, modern UI with a single primary action: **"Sign In with AWS Cognito SSO"** (or "Sign In to CloudCampus"). | **Minimal** (Remove/hide legacy form) |
| **Frontend Auth Context** (`AuthContext.tsx`) | Handles both Cognito OAuth code exchange and `api.post('/auth/login')`. | Uses `loginWithCognitoCode()` as primary auth method. Stores `id_token` as Bearer token for JWKS verification. | **None / Already Done** |
| **Cognito Token Service** (`cognito.service.ts`) | Validates Cognito JWTs with `CognitoJwtVerifier`. | Validates signature, issuer, audience, and extracts `cognito:groups`. | **Minimal** (Helper enhancements) |
| **Backend Auth Middleware** (`auth.middleware.ts`) | Cryptographically validates Cognito tokens via JWKS and links `cognitoSub`. In production, local JWT fallback is already disabled. | Identical. Native JWKS validation is already active. | **None** |
| **Prisma Schema** (`schema.prisma`) | `passwordHash String?` is nullable; `cognitoSub String? @unique` is already present. | No schema changes needed. `passwordHash` remains optional for local unit testing. | **None** |
| **API Gateway** (`7k2yo6gy77`) | HTTP API v2 with route `ANY /{proxy+}` forwarding to backend ALB. | Maintains standard reverse proxy forwarding to ALB. | **None** |

---

## 4. User Identity & Database Mapping

### Dynamic Identity Linking Flow
When a user logs in through Amazon Cognito for the first time:
1. Cognito returns an **ID Token** containing:
   - `sub`: Unique, immutable Cognito user identifier (UUID).
   - `email`: User's email address.
   - `email_verified`: `true`.
   - `cognito:groups`: `["STUDENT"]`, `["FACULTY"]`, or `["ADMIN"]`.
2. On the first API call to `GET /api/auth/profile`:
   - Backend `authenticate` middleware (`backend/src/middleware/auth.middleware.ts`) verifies the RS256 signature using Cognito's live JWKS.
   - **Step A**: Looks up `prisma.user.findUnique({ where: { cognitoSub: cognitoUser.sub } })`.
   - **Step B**: If `cognitoSub` is not yet linked, searches `prisma.user.findMany({ where: { email: cognitoUser.email } })`.
   - Upon finding the matching active user record, executes:
     ```typescript
     await prisma.user.update({
       where: { id: targetUser.id },
       data: { cognitoSub: cognitoUser.sub },
     });
     ```
   - On all subsequent requests, Step A finds the linked user profile instantly via the unique `cognitoSub` index.

---

## 5. Role Mapping Strategy

Amazon Cognito groups map 1-to-1 with PostgreSQL database roles:

| Cognito Group | Database Role (`User.role`) | Frontend Route Guard | Target Dashboard | Permitted API Endpoints |
| :--- | :---: | :---: | :---: | :--- |
| **`STUDENT`** | `Role.STUDENT` | `<ProtectedRoute allowedRoles={['STUDENT']}>` | `/student/dashboard` | `/api/student/*`, `/api/courses`, `/api/announcements` |
| **`FACULTY`** | `Role.FACULTY` | `<ProtectedRoute allowedRoles={['FACULTY']}>` | `/faculty/dashboard` | `/api/faculty/*`, `/api/courses`, `/api/attendance` |
| **`ADMIN`** | `Role.ADMIN` | `<ProtectedRoute allowedRoles={['ADMIN']}>` | `/admin/dashboard` | `/api/admin/*`, `/api/admin/monitoring/*`, all APIs |

### Conflict Resolution
If a token has `cognito:groups = ["FACULTY"]` and the database has `role = FACULTY`, authorization is unanimously granted. If a mismatch ever occurs, the backend enforces authorization based on the verified database record while logging a security audit event.

---

## 6. Verification of Existing Cognito Test Accounts

The following test accounts have been verified in the live AWS Cognito User Pool `us-east-1_Ic9huqJjL`:

| Role | Email | Cognito Status | Email Verified | Cognito Group | Profile Record |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Student** | `karthikc11105@gmail.com` | `CONFIRMED` | `true` | `STUDENT` | Linked (`STU001`) |
| **Student** | `manoj23iiitk27@gmail.com` | `CONFIRMED` | `true` | `STUDENT` | Linked (`CSE2026S001`) |
| **Student** | `boggavarapupraveen2036@gmail.com` | `CONFIRMED` | `true` | `STUDENT` | Linked (`CSE2026S002`) |
| **Student** | `student@campus.local` | `CONFIRMED` | `true` | `STUDENT` | Linked (`STU_DEMO`) |
| **Faculty** | `shaikvenkat17@gmail.com` | `CONFIRMED` | `true` | `FACULTY` | Linked (`FAC_CSE03`) |
| **Faculty** | `deepakgannamaneni@gmail.com` | `CONFIRMED` | `true` | `FACULTY` | Linked (`FAC_CSE01`) |
| **Faculty** | `bhargavreddynarra2605@gmail.com` | `CONFIRMED` | `true` | `FACULTY` | Linked (`FAC_CSE02`) |
| **Faculty** | `ur4207546@gmail.com` | `CONFIRMED` | `true` | `FACULTY` | Linked (`FAC_CSE04`) |
| **Faculty** | `faculty@campus.local` | `CONFIRMED` | `true` | `FACULTY` | Linked (`FAC_DEMO`) |
| **Admin** | `admin@campus.edu` | `CONFIRMED` | `true` | `ADMIN` | Linked (`ADM_PROD`) |
| **Admin** | `admin@campus.local` | `CONFIRMED` | `true` | `ADMIN` | Linked (`ADM_DEMO`) |

---

## 7. Required Code Changes (Minimal Scope)

### A. Frontend (`frontend/src/pages/Login.tsx`)
- **Modification**: Remove or comment out the legacy `<form onSubmit={handleSubmit}>` (Email/Password inputs) and the `"or sign in with credentials"` divider.
- **Result**: The login card features a single prominent button:
  ```tsx
  <button
    type="button"
    onClick={handleCognitoLogin}
    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-base shadow-lg shadow-amber-950/20 flex items-center justify-center gap-3 transition-all"
  >
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">...</svg>
    Sign In to CloudCampus (AWS Cognito SSO)
  </button>
  ```

### B. Frontend (`frontend/src/context/AuthContext.tsx`)
- Ensure `primaryToken = tokens.id_token || tokens.access_token` is stored as `token` in `localStorage`.
- Extract `cognito:groups` from the payload to resolve the initial UI role before making profile API requests.

### C. Backend (`backend/src/controllers/auth.controller.ts`)
- `/api/auth/profile` and `/api/auth/cognito/link` remain active and fully functional.
- `/api/auth/login` is preserved for offline unit testing (`vitest`), but is unused by the production frontend.

---

## 8. What Should NOT Change

1. **Do NOT delete `User.passwordHash` column from PostgreSQL**: Keeping it nullable allows existing database unit tests to run in local offline CI without needing an AWS connection.
2. **Do NOT recreate the Cognito User Pool or App Client**: The existing `us-east-1_Ic9huqJjL` and `3kv2vgpkklqtlpfom2t72dn29n` are already fully configured with verified users and groups.
3. **Do NOT modify RDS production tables or truncate data**: All student, course, department, and faculty records are preserved intact.
4. **Do NOT change API Gateway routing**: The HTTP proxy integration to ALB (`ANY /{proxy+}`) correctly routes all `/api/*` traffic to the Express backend.

---

## 9. Security Review

| Security Control | Implementation Mechanism | Verification Status |
| :--- | :--- | :---: |
| **Cryptographic Signature Validation** | Backend uses `aws-jwt-verify` against Cognito's RS256 JWKS public key set. | **VERIFIED** |
| **Token Expiration & Issuer Verification** | Strict check that `iss === https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL` and `exp > currentTime`. | **VERIFIED** |
| **Audience / Client ID Protection** | Strict check that `client_id === 3kv2vgpkklqtlpfom2t72dn29n`. Tokens from other pools/clients are rejected. | **VERIFIED** |
| **PKCE Replay Attack Prevention** | High-entropy random `code_verifier` stored in client session storage prevents interception of authorization codes. | **VERIFIED** |
| **Role Escalation Prevention** | `authorize(['ADMIN'])` and `authorize(['FACULTY'])` middleware enforce role gates on backend endpoints independently of client state. | **VERIFIED** |
| **Credential Storage Elimination** | Passwords are never stored or handled by the Express backend in production; AWS Cognito manages hashing (SRP / PBKDF2) and account security policies. | **VERIFIED** |

---

## 10. Risk Assessment & Rollback Plan

### Risks & Mitigations
- **Risk**: User attempts to use direct form if cached by browser.  
  **Mitigation**: Cache-control headers on S3 static build ensure users receive the updated `index.html` bundle immediately.
- **Risk**: Cognito token lacks email claim if user logs in with an unverified email.  
  **Mitigation**: All provisioned test accounts in the User Pool have `email_verified = true`.

### Rollback Plan
If any unforeseen issue arises, reverting the frontend commit re-enables the legacy login form immediately without touching the backend or database.

---

## 11. Proposed Step-by-Step Implementation Procedure

*(To be executed only after formal user review and approval)*

1. **Step 1: Frontend UI Streamlining**
   - Update `frontend/src/pages/Login.tsx` to streamline the UI to a single, clear "Sign In to CloudCampus (AWS Cognito SSO)" entry point.
2. **Step 2: Frontend Bundle Rebuild**
   - Run `npm run build` in `frontend/` to produce the production bundle in `frontend/dist/`.
3. **Step 3: Deploy Frontend to S3**
   - Synchronize the updated bundle to `cloudcampus-frontend-production` via `node scripts/deploy-s3-frontend.js`.
4. **Step 4: End-to-End Live Browser Verification**
   - Test Cognito SSO for Student (`karthikc11105@gmail.com` / `manoj23iiitk27@gmail.com`), Faculty (`deepakgannamaneni@gmail.com` / `shaikvenkat17@gmail.com`), and Admin (`admin@campus.edu`).
   - Confirm successful navigation to `/student/dashboard`, `/faculty/dashboard`, and `/admin/dashboard`.
   - Verify protected API calls succeed with HTTP 200.
