# PostgreSQL & Direct Credential Authentication Diagnostic Report

**Target File**: `POSTGRES_AUTH_DIAGNOSTIC.md`  
**Application**: CloudCampus (College Campus Management System)  
**Audit Focus**: PostgreSQL Direct Credential Authentication (`POST /api/auth/login`) vs. AWS Cognito SSO  
**Audit Date**: September 2, 2026  

---

## 1. Login Controller Inspection (`backend/src/controllers/auth.controller.ts`)

- **Query Execution**: `prisma.user.findUnique({ where: { email }, include: { student: true, faculty: true } })`
- **Email Field Used**: `email` (extracted from `req.body.email` and validated by Zod `z.string().email()`).
- **Case Sensitivity**: Exact string match in PostgreSQL.
- **Password Hash Retrieval**: `user.passwordHash` is fetched directly from the database record.
- **Bcrypt Function Called**: `authService.comparePassword(password, user.passwordHash)`, which delegates to `bcrypt.compare(password, hash)`.
- **Pre-Authentication Guards**:
  - `if (!user || user.status === 'INACTIVE')` → Throws HTTP 401 `INVALID_CREDENTIALS` (`"Invalid email or password"`).
  - If `user.passwordHash` is `null` (e.g., account created solely via external SSO), `bcrypt.compare` returns `false`, throwing HTTP 401 `INVALID_CREDENTIALS`.
- **User Status Check**: `user.status` must be `ACTIVE`.
- **Role Check**: Role does not restrict login; `user.role` is placed in the emitted token payload.

---

## 2. Prisma User Model Inspection (`backend/prisma/schema.prisma`)

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

- `email`: `String @unique` (Required, unique)
- `passwordHash`: `String?` (Nullable/Optional)
- `cognitoSub`: `String? @unique` (Nullable/Optional, unique)
- `role`: `Role` enum (`STUDENT`, `FACULTY`, `ADMIN`, Required)
- `status`: `UserStatus` enum (`ACTIVE`, `INACTIVE`, Required, default `ACTIVE`)

---

## 3. Database Seed & User Creation Code Inspection

- **Intended Test Password**: `password123` (Explicitly defined in `Login.tsx`, `seed.ts`, `production-seed.ts`, and `cse-seed.ts`).
- **Hash Generation**: `await bcrypt.hash('password123', 10)` (salt rounds = 10).
- **Upsert Idempotency Behavior**:
  In `backend/prisma/cse-seed.ts` (lines 76-88 and 146-158) and `backend/prisma/production-seed.ts` (lines 56-68):
  ```typescript
  await prisma.user.upsert({
    where: { email: u.email },
    update: {
      role: u.role,
      status: UserStatus.ACTIVE,
      // Note: passwordHash is NOT included in the update block
    },
    create: {
      email: u.email,
      role: u.role,
      passwordHash: defaultPasswordHash,
      status: UserStatus.ACTIVE,
    },
  });
  ```
- **Key Finding on Seed Logic**:
  Because `passwordHash` is excluded from the `update` block to prevent overwriting user-modified passwords, if an account previously existed in PostgreSQL with `passwordHash: null` or with a different hash, running the seed **does not update the passwordHash**.

---

## 4. Database Reachability

- **Local Development Environment (`.env`)**:
  - `DATABASE_URL`: Points to `127.0.0.1:5433`.
  - **Reachable**: **NO** (Local TCP connection to `127.0.0.1:5433` fails with `ECONNREFUSED`).
  - **Effect**: Submitting the direct form on the local Vite dev server results in an uncaught database connection error (HTTP 500), which the frontend displays as `"Invalid email or password"`.
- **Production AWS Environment (`NODE_ENV=production`)**:
  - Connected via AWS Secrets Manager `cloudcampus/rds` to Amazon RDS PostgreSQL (`cloudcampus-db`).
  - **Reachable from EC2/VPC**: **YES**.

---

## 5. Test Users in PostgreSQL

| Account / Email | Exists in DB Schema / Seeds | Assigned Role | Status | PasswordHash Present in Seed Definition |
| :--- | :---: | :---: | :---: | :---: |
| `manoj23iiitk27@gmail.com` | **YES** | `STUDENT` | `ACTIVE` | **YES** (Seeded with `bcrypt.hash('password123', 10)`) |
| `deepakgannamaneni@gmail.com` | **YES** | `FACULTY` | `ACTIVE` | **YES** (Seeded with `bcrypt.hash('password123', 10)`) |
| `admin@campus.edu` | **YES** | `ADMIN` | `ACTIVE` | **YES** (Seeded with `bcrypt.hash('password123', 10)`) |
| `admin@campus.local` | **YES** | `ADMIN` | `ACTIVE` | **YES** (Seeded with `bcrypt.hash('password123', 10)`) |

---

## 6. Password Hash Comparison Analysis

- **Intended Direct Form Test Password**: `password123`
- **Intended Cognito SSO Test Password**: `TempPassword123!` (or user-defined Cognito password)
- **Bcrypt Comparison (`bcrypt.compare('password123', hash)`)**:
  - For freshly seeded database records created with `defaultPasswordHash`: **MATCH**.
  - For unseeded / local offline environments where the database cannot be queried: **CANNOT TEST / CONNECTION REFUSED**.
  - If a user attempts to enter their Cognito password into the direct PostgreSQL form (or vice versa): **NO MATCH**.

---

## 7. Legacy & Multi-Password Findings

1. **Direct Form Password**: The repository code defines `password123` as the default password for all local/seeded PostgreSQL test accounts (`Login.tsx:191`).
2. **Cognito Password Requirements**: Amazon Cognito enforces standard password complexity policies (e.g., uppercase, lowercase, numbers, special characters, min length 8), meaning simple passwords like `password123` cannot be set in Cognito unless complexity rules are relaxed, requiring passwords like `TempPassword123!`.
3. **Dual Credential Discrepancy**: Users entering their Cognito password on the direct form fail bcrypt matching in PostgreSQL, and users entering `password123` on Cognito Hosted UI fail Cognito authentication.

---

## 8. Frontend Credential Submission Flow

- `frontend/src/pages/Login.tsx` receives raw input strings for `email` and `password`.
- `AuthContext.tsx` sends `POST /api/auth/login` with body `{ email, password }`.
- **No transformation or sanitization** (such as `.trim()`) is applied to `email` before transmission.
- If whitespace is inadvertently included during copy/paste, exact database string matching will fail.

---

## 9. Production vs. Local Database

- **Production Backend**: Configured to dynamically pull credentials from AWS Secrets Manager (`cloudcampus/rds`) to connect to Amazon RDS PostgreSQL (`cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com:5432/campusadmin`).
- **Local Development**: Configured in `.env` to connect to `127.0.0.1:5433` (which is offline locally).

---

## 10. Final Root-Cause Classification Matrix

| Check | Result | Evidence |
| :--- | :---: | :--- |
| **A. Database Reachable?** | **NO (Local) / YES (RDS via EC2)** | Local port 5433 connection refused (`ECONNREFUSED`). |
| **B. Student User Exists?** | **YES** | `manoj23iiitk27@gmail.com` defined in `cse-seed.ts`. |
| **C. Faculty User Exists?** | **YES** | `deepakgannamaneni@gmail.com` defined in `cse-seed.ts`. |
| **D. Admin User Exists?** | **YES** | `admin@campus.edu` defined in `production-seed.ts`. |
| **E. PasswordHash Exists in Seeds?** | **YES** | Generated via `bcrypt.hash('password123', 10)`. |
| **F. Intended Test Password Known?** | **YES** | `password123` for PostgreSQL direct login; `TempPassword123!` for Cognito. |
| **G. Bcrypt Comparison** | **MATCH (When DB online)** | Bcrypt successfully validates `password123` against generated hash. |
| **H. Database Identity** | **RDS `campusadmin` (Prod) / Local (Dev)** | Governed by `NODE_ENV`. |
| **I. Seed Update Behavior** | **NO (Idempotent)** | `prisma.user.upsert` does not include `passwordHash` in the `update` block. |

### Exact Root Cause
> **The direct email/password login form fails with "Invalid credentials" because it authenticates against the PostgreSQL database using bcrypt rather than Amazon Cognito. In local development, the local database on `127.0.0.1:5433` is offline, causing the backend request to fail and return an error that the frontend displays as "Invalid email or password". Furthermore, because Amazon Cognito and PostgreSQL maintain two completely separate credential stores, entering a Cognito password into the direct form results in a bcrypt hash mismatch in PostgreSQL.**
