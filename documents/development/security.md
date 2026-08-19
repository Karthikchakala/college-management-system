# Security Engineering Document

This document outlines the security measures, policies, and practices implemented within the College Campus Management System to defend against security risks and prepare the platform for compliance in the cloud.

## Defensive Controls

### 1. HTTP Security Headers (Helmet)
We integrate `helmet` middleware to set essential security headers, mitigating risks such as Cross-Site Scripting (XSS), Clickjacking, MIME sniffing, and Clickjacking:
* `Content-Security-Policy`: Restricts allowed sources for script execution, style loading, and frame sources.
* `X-Frame-Options`: Blocks framing to prevent clickjacking exploits.
* `X-Content-Type-Options`: Blocks sniffing by requesting that browsers adhere strictly to MIME types.

### 2. Cross-Origin Resource Sharing (CORS)
CORS is explicitly configured in `backend/src/app.ts` to block unauthorized web clients from interacting with the APIs:
* **Allowed Origin**: Locked to the frontend URL `http://localhost:3000`.
* **Credentials Support**: Allowed, so session state tokens and cross-origin cookies can be passed securely when needed.

### 3. API Rate Limiting
To protect backend routes from automated denial-of-service (DoS) or brute-force requests, we employ rate limiting:
* **Policy**: Limit each IP address to a maximum of 200 API requests within a 15-minute sliding window.
* **Fallback Response**: Returns a `429 Too Many Requests` status code with a JSON payload warning of rate limits.

### 4. Input Schema Validation (Zod)
All client payloads (body, query parameter lists, path parameters) are strictly parsed and validated against schema objects. Malformed requests are rejected with a `400 Bad Request` prior to reaching database models, eliminating common attack vectors like buffer overflows, type coercion exploits, and malformed payload injection.

---

## Data Security & Access Controls

### 1. Cryptographic Password Hashing (Bcrypt)
Plaintext passwords are never stored in the database.
* **Mechanism**: Hashed using `bcryptjs` with a work factor (salt rounds) of 10.
* **Authentication**: Password checks are performed inside `AuthenticationService` using side-channel-resistant comparison algorithms.

### 2. Role-Based Access Control (RBAC)
Role authorization is validated on both levels (frontend visual toggle + backend route guards).
* Backend route middleware inspects the user payload on the verified JWT and compares roles against allowed scopes (e.g. `authorize(['FACULTY'])`).
* Handlers for students block edit commands on core credentials (e.g. department ID, student ID) to prevent privilege escalation.

### 3. Parameterized Database Queries (SQL Injection Protection)
Prisma ORM automatically executes parameterized query plans under the hood. User-supplied inputs are treated strictly as query variables rather than executable instructions, preventing SQL injection (SQLi) attacks.

---

## File Upload Security Policy

Arbitrary file execution is prevented through strict security controls:
1. **Size Limit**: Restricts uploaded files (assignments, submissions) to a maximum of 10MB.
2. **Extension Restriction**: Validates the file extension via the Multer filter, rejecting files other than `.pdf, .docx, .png, .jpg, .jpeg`. Executable scripts (e.g. `.exe, .sh, .js, .php`) are blocked.
3. **Memory Buffering**: Uploads are initially loaded into a memory buffer instead of writing directly to temporary filesystem paths.
4. **Unique Filename Randomization**: Filenames are overwritten and renamed with a random UUIDv4 key (e.g. `daac65ea-3792-44c6-9542-06b0b08f75d4.pdf`) preventing path traversal attacks (e.g. `../../etc/passwd` injection).
