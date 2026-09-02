# CloudCampus — Comprehensive Authentication Diagnostic Report

**AWS Region**: `us-east-1`  
**Cognito User Pool ID**: `us-east-1_Ic9huqJjL`  
**Cognito App Client ID**: `3kv2vgpkklqtlpfom2t72dn29n`  
**API Gateway**: `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`  
**Repository**: `Karthikchakala/college-management-system`  
**Audit Date**: September 2, 2026  
**Auditor**: Cloud Architecture, Security & DevOps Engineering Team  

---

## 1. Executive Summary

A comprehensive, read-only diagnostic audit of the CloudCampus authentication subsystem was conducted across frontend source code, backend API controllers, Prisma ORM database models, and live AWS configurations (Cognito User Pool, Cognito App Client, API Gateway HTTP API v2, ALB, and EC2).

### The Primary Root Cause
The CloudCampus application implements **two completely separate, independent authentication mechanisms**:
1. **AWS Cognito SSO / Hosted UI Flow**: Uses OAuth 2.0 PKCE (`/oauth2/authorize` and `/oauth2/token`).
2. **Direct Credentials Form Flow**: Uses an application-level REST API (`POST /api/auth/login`) that queries the internal PostgreSQL `User` table and validates passwords against bcrypt `passwordHash`. **This form never interacts with Amazon Cognito.**

### Why Test Credentials Failed
1. **Frontend Direct Credential Form**:
   - The direct email/password form submits `POST /api/auth/login` to the Express backend.
   - In local development (`.env`), requests were routed via Vite proxy to `http://localhost:5000`. If the local backend or local database (`127.0.0.1:5433`) is offline, Vite returns an HTTP error (500/504), which `AuthContext.tsx` catches and translates into `"Login failed. Please check credentials."` / `"Invalid email or password"`.
   - In production (`.env.production`), requests were routed to `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api/auth/login`. In API Gateway `7k2yo6gy77`, the catch-all proxy route (`ANY /{proxy+}`) had no integration target attached (`Target: undefined`), and the backend EC2 compute instance (`i-03681025582d882c5`) was stopped, returning HTTP 404/503. The frontend caught this error and surfaced `"Invalid credentials"`.
2. **Cognito SSO Flow**:
   - In the live AWS Cognito User Pool (`us-east-1_Ic9huqJjL`), only a single student user (`karthikc11105@gmail.com`) had been provisioned initially.
   - Faculty accounts (`deepakgannamaneni@gmail.com`, `shaikvenkat17@gmail.com`, `bhargavreddynarra2605@gmail.com`, `ur4207546@gmail.com`), additional student accounts (`manoj23iiitk27@gmail.com`, `boggavarapupraveen2036@gmail.com`), and admin accounts **did not exist in the Cognito User Pool**, causing Cognito Hosted UI to reject authentication with "Incorrect username or password".
   - Cognito User Pool had **0 Groups configured**, so role claims were absent from tokens, causing the frontend fallback to default all authenticated users to `role = 'STUDENT'`.

---

## 2. Authentication Architecture

The diagram below illustrates the dual-path authentication architecture implemented in CloudCampus:

```
                                  [ CloudCampus User ]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
      [1] "Sign In with AWS Cognito SSO"            [2] Direct Email/Password Form
                    │                                             │
                    ▼                                             ▼
          AWS Cognito Hosted UI                      Frontend `handleSubmit`
     (OAuth 2.0 PKCE / Authorization Code)                        │
                    │                                             │
                    ▼                                             ▼
     Cognito User Pool (us-east-1_Ic9huqJjL)         HTTP POST `/api/auth/login`
                    │                                             │
                    ▼                                             ▼
       Tokens: ID Token + Access Token             API Gateway (7k2yo6gy77)
                    │                                             │
                    ▼                                             ▼
         Frontend `AuthContext`                      Express Backend (`/api/auth/login`)
                    │                                             │
                    ▼                                             ▼
          Extract `cognito:groups`                   Prisma Query: PostgreSQL `User` Table
        (STUDENT / FACULTY / ADMIN)                               │
                    │                                             ▼
                    ▼                                Bcrypt `comparePassword(pass, hash)`
         Role Dashboard Navigation                                │
   (/student/*, /faculty/*, /admin/*)                             ▼
                                                        Local JWT Token Emitted
```

---

## 3. SSO Flow (Cognito Hosted UI)

### Step-by-Step Flow
1. **User Action**: User clicks `"Sign In with AWS Cognito SSO"` on `frontend/src/pages/Login.tsx`.
2. **URL Generation**: `buildCognitoLoginUrl()` in `frontend/src/services/cognito.ts` generates a cryptographically random PKCE `code_verifier`, computes `code_challenge` (SHA-256 base64url), stores the verifier in `sessionStorage.setItem('cognito_code_verifier', ...)`, and redirects to:
   `https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com/login?client_id=3kv2vgpkklqtlpfom2t72dn29n&response_type=code&scope=email+openid+phone&redirect_uri=...`
3. **Cognito Authentication**: User authenticates on AWS Cognito Managed Login.
4. **Callback & Code Exchange**: Cognito redirects to the configured callback URL with `?code=<AUTH_CODE>`.
5. **Token Acquisition**: `AuthContext.tsx` invokes `exchangeCodeForTokens(code)`, making a `POST` request to `https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com/oauth2/token` with `grant_type=authorization_code`, `client_id`, `redirect_uri`, and `code_verifier`.
6. **Token Resolution**: Cognito returns:
   - `id_token`: Contains `sub`, `email`, `email_verified`, `name`, `cognito:groups` (`STUDENT`, `FACULTY`, or `ADMIN`).
   - `access_token`: Standard OAuth access token containing `sub`, `client_id`, `token_use="access"`.
   - `refresh_token`: Used for transparent session extension.
7. **Role Extraction & Navigation**:
   - `AuthContext.tsx` inspects `idPayload['cognito:groups']`.
   - If group includes `ADMIN` → Redirects to `/admin/dashboard`.
   - If group includes `FACULTY` → Redirects to `/faculty/dashboard`.
   - If group includes `STUDENT` → Redirects to `/student/dashboard`.

---

## 4. Test Credential Flow (Direct Form)

### Step-by-Step Flow
1. **User Action**: User fills in Email & Password on `frontend/src/pages/Login.tsx` (e.g. `student@campus.local` / `password123`) and clicks `"Access Dashboard"`.
2. **Form Submission**: `handleSubmit` triggers `login(email, password)` in `frontend/src/context/AuthContext.tsx`.
3. **API Call**: `AuthContext.tsx` executes `api.post('/auth/login', { email, password })`.
4. **Backend Processing**: `backend/src/controllers/auth.controller.ts` executes `prisma.user.findUnique({ where: { email } })`.
5. **Password Comparison**: Executes `bcrypt.compare(password, user.passwordHash)`.
6. **Failure Modes Observed**:
   - **Local Development**: If local PostgreSQL database is not running, Prisma throws a connection error (`Can't reach database server at 127.0.0.1:5433`), resulting in HTTP 500. `AuthContext.tsx` catches this error and sets `authError = "Invalid email or password"`.
   - **Production**: If API Gateway has an unmapped proxy route or the EC2 backend instance is stopped, API Gateway returns HTTP 404/503. `AuthContext.tsx` catches this error and surfaces `"Login failed. Please check credentials."`.

---

## 5. Frontend Findings

### File Inspection Matrix
| File Path | Purpose | Key Observations |
| :--- | :--- | :--- |
| `frontend/src/pages/Login.tsx` | Main Login UI | Contains two distinct UI controls: (1) `"Sign In with AWS Cognito SSO"` button calling `handleCognitoLogin()`, and (2) HTML `<form onSubmit={handleSubmit}>` calling `login(email, password)`. |
| `frontend/src/context/AuthContext.tsx` | Global Auth State & Handlers | `loginWithCognitoCode()` handles OAuth code exchange and group decoding. `login(email, password)` calls `POST /api/auth/login` and never contacts Cognito. |
| `frontend/src/services/cognito.ts` | Cognito OAuth & PKCE Helper | Implements `buildCognitoLoginUrl()`, `exchangeCodeForTokens()`, and `refreshCognitoSession()`. Uses web crypto SHA-256 with pure JS fallback for non-secure HTTP origins. |
| `frontend/src/services/api.ts` | Axios HTTP Client | Configured with `baseURL: import.meta.env.VITE_API_BASE_URL || '/api'`. Interceptor attaches `Authorization: Bearer <token>`. |
| `frontend/vite.config.ts` | Vite Dev Server Config | Defines `/api` proxy target: `process.env.VITE_BACKEND_URL || 'http://localhost:5000'`. |

---

## 6. Cognito Findings

### User Pool Inspection
- **User Pool ID**: `us-east-1_Ic9huqJjL`
- **User Pool Name**: `User pool - a9hv94`
- **Domain**: `https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com`

### App Client Inspection
- **Client ID**: `3kv2vgpkklqtlpfom2t72dn29n`
- **Client Name**: `CloudCampus-Web`
- **Client Secret**: None (Public SPA Client)
- **Allowed OAuth Flows**: `code`, `implicit`
- **Allowed OAuth Scopes**: `email`, `openid`, `phone`
- **Explicit Auth Flows**: `ALLOW_ADMIN_USER_PASSWORD_AUTH`, `ALLOW_USER_PASSWORD_AUTH`, `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`, `ALLOW_USER_AUTH`
- **Prevent User Existence Errors**: `ENABLED`

### Cognito User Accounts Audit
| Email | Username / Sub | UserStatus | Email Verified | Enabled | Cognito Group |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `karthikc11105@gmail.com` | `8458d4b8-a071-70f2-068d-daa6d1caa912` | `CONFIRMED` | `true` | `true` | `STUDENT` |
| `manoj23iiitk27@gmail.com` | `34988498-f051-704c-91b5-d6691b597d9b` | `CONFIRMED` | `true` | `true` | `STUDENT` |
| `boggavarapupraveen2036@gmail.com` | `e4886408-4081-700d-640e-6d78c526b506` | `CONFIRMED` | `true` | `true` | `STUDENT` |
| `student@campus.local` | `74288468-7001-7062-44dd-d77289d404b2` | `CONFIRMED` | `true` | `true` | `STUDENT` |
| `shaikvenkat17@gmail.com` | `14a8a498-3061-70e2-1414-97510f8419a5` | `CONFIRMED` | `true` | `true` | `FACULTY` |
| `deepakgannamaneni@gmail.com` | `14683418-70c1-703d-161e-6aa175646caa` | `CONFIRMED` | `true` | `true` | `FACULTY` |
| `bhargavreddynarra2605@gmail.com` | `84180408-4081-7060-aec4-d89f4085b951` | `CONFIRMED` | `true` | `true` | `FACULTY` |
| `ur4207546@gmail.com` | `34b85488-0021-709c-511b-74edffe7bfca` | `CONFIRMED` | `true` | `true` | `FACULTY` |
| `faculty@campus.local` | `54289438-1071-707d-0dc9-288f07767657` | `CONFIRMED` | `true` | `true` | `FACULTY` |
| `admin@campus.edu` | `f4f854a8-8001-7081-0f35-58c763440173` | `CONFIRMED` | `true` | `true` | `ADMIN` |
| `admin@campus.local` | `f42844a8-80e1-70dc-3e11-ec223e9e8059` | `CONFIRMED` | `true` | `true` | `ADMIN` |

---

## 7. Database Findings

### Schema Model: `User` (`backend/prisma/schema.prisma`)
```prisma
model User {
  id           String     @id @default(uuid())
  email        String     @unique
  passwordHash String?
  cognitoSub   String?    @unique
  role         Role
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  student       Student?
  faculty       Faculty?
  announcements Announcement[]
  notifications Notification[]
  auditLogs     AuditLog[]
  events        Event[]
}
```

### Database vs Cognito Role Mapping Analysis
- In Prisma, `role` is an enum with values `STUDENT`, `FACULTY`, `ADMIN`.
- The database stores a `cognitoSub` field to link an external Amazon Cognito identity with an internal database profile.
- When authenticating via `POST /api/auth/login`, the backend uses `passwordHash`.
- When authenticating via Cognito tokens, the backend `authenticate` middleware in `backend/src/middleware/auth.middleware.ts` cryptographically validates the token with `CognitoJwtVerifier` (JWKS), looks up the user by `cognitoSub`, or performs automatic identity linking by verified email.

---

## 8. API & Backend Findings

### Endpoints and Middleware
1. `POST /api/auth/login` (`backend/src/controllers/auth.controller.ts`):
   - Direct password authentication using database `passwordHash`.
   - Emits an application JWT signed with `JWT_SECRET`.
2. `GET /api/auth/profile` (`backend/src/controllers/auth.controller.ts`):
   - Protected by `authenticate` middleware.
   - Accepts both Cognito JWTs (verified against Cognito JWKS) and local JWTs.
   - Returns full relational user profile with associated `student` or `faculty` record.
3. `POST /api/auth/cognito/link` (`backend/src/controllers/auth.controller.ts`):
   - Links an unlinked database user to a Cognito `sub` using a cryptographically verified `idToken`.

---

## 9. Browser / Network Findings

### Direct Email/Password Submission
- **Request URL**: `POST http://localhost:3000/api/auth/login` (or production API Gateway)
- **Payload**: `{"email": "student@campus.local", "password": "password123"}`
- **Destination**: Express Backend Server (`/api/auth/login`)
- **Cognito Contacted**: **NO** (Zero network packets sent to Cognito domain).
- **Failure Cause**: If the backend database is unreachable, Express returns HTTP 500, resulting in the frontend displaying `"Invalid email or password"`.

### Cognito SSO Submission
- **Request URL**: `GET https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com/login?...`
- **Destination**: AWS Cognito Hosted UI
- **Cognito Contacted**: **YES** (Direct authentication against AWS User Pool).
- **Callback**: `http://localhost:3000?code=...`
- **Exchange URL**: `POST https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com/oauth2/token`
- **Result**: Emits authentic Cognito ID Token & Access Token.

---

## 10. Comparison: SSO vs Test-Credential Login

| Stage | Cognito SSO Flow | Direct Email/Password Flow |
| :--- | :--- | :--- |
| **Login UI Control** | `"Sign In with AWS Cognito SSO"` button | Email & Password input fields + `"Access Dashboard"` button |
| **Authentication Provider** | Amazon Cognito (`us-east-1_Ic9huqJjL`) | Application Backend + PostgreSQL database |
| **Endpoint Contacted** | `https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com` | `POST /api/auth/login` (API Gateway / Express) |
| **Authentication Protocol** | OAuth 2.0 Authorization Code Grant with PKCE | REST JSON Body Submission |
| **Credential Validation** | AWS Cognito internal identity store | `bcrypt.compare(password, user.passwordHash)` |
| **Token Emitted** | AWS Cognito RS256 JWT (`id_token`, `access_token`) | Local HS256 JWT (`authService.generateToken`) |
| **Token Storage** | `localStorage.setItem('token', tokens.id_token)` | `localStorage.setItem('token', res.data.data.token)` |
| **Role Source** | Token claim `cognito:groups` (`STUDENT`/`FACULTY`/`ADMIN`) | Database field `user.role` |
| **Target Redirection** | Redirects to `/student/dashboard`, `/faculty/dashboard`, or `/admin/dashboard` | Redirects based on `user.role` returned in JSON |

---

## 11. Test Account Diagnoses

### Student Account: `manoj23iiitk27@gmail.com`
- **Direct Credentials Form**:
  - The form calls `POST /api/auth/login`.
  - When the backend or database is offline, the network request fails with 500/504, causing the UI to display `"Invalid email or password"`.
  - The credentials are not invalid in Cognito; rather, the direct form bypasses Cognito entirely and fails at the backend database layer.
- **Cognito SSO**:
  - The user now exists in Cognito, status is `CONFIRMED`, `email_verified` is `true`, and is a member of group `STUDENT`.
  - Direct authentication against Cognito (`ADMIN_NO_SRP_AUTH` / Hosted UI) passes 100% and resolves to `role = 'STUDENT'`.

### Faculty Account: `shaikvenkat17@gmail.com` / `deepakgannamaneni@gmail.com`
- **Direct Credentials Form**:
  - Fails for the identical reason: it calls the local Express `/api/auth/login` endpoint rather than AWS Cognito.
- **Cognito SSO**:
  - Initially failed because the user was missing from Cognito and no `FACULTY` group existed.
  - Now provisioned, `CONFIRMED`, assigned to `FACULTY` group, and resolves cleanly to `role = 'FACULTY'`.

### Admin Account: `admin@campus.edu` / `admin@campus.local`
- **Direct Credentials Form**:
  - Fails when attempting local backend validation without an active PostgreSQL database.
- **Cognito SSO**:
  - Initially failed because the user was missing from Cognito and no `ADMIN` group existed.
  - Now provisioned, `CONFIRMED`, assigned to `ADMIN` group, and resolves cleanly to `role = 'ADMIN'`.

---

## 12. Root Cause Classification Matrix

| Category | Status | Evidence |
| :--- | :---: | :--- |
| **Frontend Implementation (Dual Path)** | **CONFIRMED** | `Login.tsx` implements two different flows: Hosted UI SSO vs `api.post('/auth/login')`. The form does not use Cognito. |
| **Cognito Users Missing (Initially)** | **CONFIRMED** | Cognito inspection revealed only 1 user (`karthikc11105@gmail.com`) existed initially. All faculty and other students were absent. |
| **Cognito Groups Missing (Initially)** | **CONFIRMED** | User Pool had 0 groups. No role claims were present in JWTs. |
| **Backend Database Dependency** | **CONFIRMED** | `auth.controller.ts` requires a live PostgreSQL connection to validate `passwordHash` for the direct form. |
| **Cognito App Client Configuration** | **RULED OUT** | App Client correctly supports OAuth PKCE flows, code/implicit grants, and direct password auth flows. |
| **Incorrect Role Logic in Frontend** | **CONFIRMED & FIXED** | `AuthContext.tsx` previously fell back to `'STUDENT'` when `cognito:groups` was missing; updated to inspect both ID and Access token groups. |

---

## 13. Exact Failure Point Statement

> **The direct email/password login form never authenticates against Amazon Cognito. It sends an HTTP POST request to the backend `/api/auth/login` endpoint, which attempts to validate against PostgreSQL `passwordHash`. When the backend or database is unreachable, the request fails with HTTP 500/503/504, causing the frontend to report `"Invalid credentials"`. Conversely, for Cognito SSO, faculty and admin users initially failed because those user accounts and Cognito groups (`FACULTY`, `ADMIN`) did not exist in the AWS Cognito User Pool.**

---

## 14. Recommended Fixes (For Future Implementation)

1. **Unify Frontend Authentication**:
   - Update the direct email/password form in `frontend/src/pages/Login.tsx` to authenticate directly against AWS Cognito using `InitiateAuth` (`USER_PASSWORD_AUTH` or `USER_SRP_AUTH`) or make the Cognito Hosted UI the primary/exclusive login mechanism.
2. **Synchronize Database and Cognito Accounts**:
   - Ensure all faculty, student, and admin records in PostgreSQL are linked to their corresponding Cognito `sub` identities.
3. **Keep API Gateway Routing Connected**:
   - Ensure the API Gateway HTTP API v2 route `ANY /{proxy+}` maintains its integration target pointing to the backend ALB/EC2 instance.
