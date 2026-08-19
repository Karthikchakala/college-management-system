# Local Setup Guide

This guide details instructions for launching the College Campus Management System locally.

## Prerequisites

* **Node.js**: v18 or later is recommended.
* **npm**: v9 or later.
* **PostgreSQL**: An active instance running locally on port 5432.
  * Username: `postgres`
  * Password: `postgres`
  * Database: `cloudcampus`
  *(Note: Portable PostgreSQL binaries are automatically managed inside the workspace under `pgsql/` during setup).*

---

## 1. Setup Backend Server

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Verify or create the `.env` file from `.env.example`:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cloudcampus?schema=public
   JWT_SECRET=super_secret_key_for_local_development_jwt_token_auth
   UPLOAD_DIR=uploads
   ```

3. Ensure dependencies are installed (this is pre-installed in Step 1):
   ```bash
   npm install
   ```

4. Generate the Prisma client interface mapping:
   ```bash
   npx prisma generate
   ```

5. Run database migrations to compile schemas onto PostgreSQL:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Run the database seed script to populate demo datasets:
   ```bash
   npm run prisma:seed
   ```

7. Start the backend development hot-reloader:
   ```bash
   npm run dev
   ```
   *The server starts listening on `http://localhost:5000`*.

---

## 2. Setup Frontend Application

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Ensure dependencies are installed:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The web interface loads locally on `http://localhost:3000` (or proxy redirects queries to the backend automatically).*

---

## 3. Demo User Accounts

Use the following seeded accounts to manually test the workflows in Chrome:

* **Administrator**:
  * Email: `admin@campus.local`
  * Password: `password123`
* **Faculty Professor**:
  * Email: `faculty@campus.local`
  * Password: `password123`
* **Student**:
  * Email: `student@campus.local`
  * Password: `password123`
