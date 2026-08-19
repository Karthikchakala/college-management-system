# Terminal Testing Guide

This document lists terminal commands to verify the system directly from the CLI.

---

## 1. Automated Test Execution

Run the backend test suite:
```bash
cd backend
npm test
```

To run tests in watch mode during development:
```bash
cd backend
npm run test:watch
```

To perform TypeScript compilation type-checks:
```bash
cd backend
npm run lint
```

---

## 2. API Verification via Curl / HTTP Requests

### 1. Verify Backend Health
```bash
curl -X GET http://localhost:5000/api/health
```
*Expected Output*:
```json
{"success":true,"message":"Backend service is healthy","timestamp":"..."}
```

### 2. Verify Database Connectivity
```bash
curl -X GET http://localhost:5000/api/health/database
```
*Expected Output*:
```json
{"success":true,"message":"Database connection is healthy"}
```

### 3. Log In via Terminal (Obtain Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"student@campus.local\",\"password\":\"password123\"}"
```
*Expected Output*: Renders the JSON payload containing the Bearer JWT token.

### 4. Fetch Student Dashboard using JWT
```bash
curl -X GET http://localhost:5000/api/student/dashboard \
     -H "Authorization: Bearer <token_copied_from_login_output>"
```

---

## 3. Database Diagnostics

### 1. Open Database Studio (Prisma Visualizer)
To inspect database records inside a beautiful web interface locally:
```bash
cd backend
npx prisma studio
```
*Access interface locally at `http://localhost:5555`*.

### 2. Run Database Seeding
To force re-run seed script and overwrite modifications:
```bash
cd backend
npx prisma db seed
```
