# CloudCampus — College Campus Management System

CloudCampus is an enterprise-grade College Campus Management System built for modern cloud infrastructure on Amazon Web Services (AWS). It features role-based workflows for Students, Faculty, and Administrators.

---

## 🏛️ Architecture Overview

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

## 🚀 Key Features

- **Role-Based Portals**:
  - **Student Portal**: Course enrollment, attendance tracking, assignment submission, exam schedules, and grade reports.
  - **Faculty Portal**: Class management, grading, announcements, course content uploads, and attendance marking.
  - **Admin Console**: Department and user management, course scheduling, audit logs, and institutional reporting.
- **AWS Cloud Native Integration**:
  - **Amazon Cognito**: User authentication, JWT issuance, and secure identity mapping.
  - **Amazon EC2 & PM2**: Clustered Node.js backend with graceful shutdowns and zero-downtime reloads.
  - **Amazon RDS PostgreSQL**: Managed relational persistence via Prisma ORM with SSL enforcement.
  - **AWS Secrets Manager**: Secure, dynamic database credential retrieval without hardcoded secrets.
  - **Amazon S3**: Private file storage with temporary, short-lived presigned URLs for secure asset distribution.
  - **Amazon CloudWatch**: Structured JSON logging with automated redaction of sensitive credentials.

---

## 📁 Repository Structure

```
.
├── backend/                  # Node.js + Express + TypeScript backend
│   ├── src/                  # Controllers, routes, services, middleware, and config
│   ├── prisma/               # Prisma schema and safe migrations
│   ├── tests/                # Unit and integration test suites
│   ├── ecosystem.config.js   # PM2 cluster configuration for EC2
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # React + Vite + Tailwind frontend
│   ├── src/                  # React components, pages, context, and services
│   ├── public/               # Static assets
│   ├── vite.config.ts        # Vite configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Frontend dependencies and scripts
│
├── AWS_MIGRATION.md          # Comprehensive AWS architecture and migration guide
├── DEPLOYMENT_AWS.md         # Step-by-step AWS EC2 & API Gateway deployment runbook
├── AWS_MIGRATION_TEST_REPORT.md # Verification and test results
└── README.md                 # Project documentation
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js 20+ LTS
- PostgreSQL 15+ (or Docker container)
- npm 10+

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure local DATABASE_URL in .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed # Optional: seed sample student, faculty, and admin accounts
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📖 Deployment Documentation

For complete AWS deployment instructions and operational runbooks:
- [AWS Migration Architecture](AWS_MIGRATION.md)
- [EC2 & API Gateway Deployment Runbook](DEPLOYMENT_AWS.md)
- [Migration & Integration Test Report](AWS_MIGRATION_TEST_REPORT.md)
