# CloudCampus — Phase-1 Browser QA & Regression Test Report

**Environment:** AWS Multi-Tier Cloud Deployment  
**Region:** `us-east-1` (N. Virginia)  
**Evaluation Date:** September 2026  
**Frontend URL:** `http://localhost:3000`  
**API Gateway URL:** `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api`  
**Cognito User Pool ID:** `us-east-1_Ic9huqJjL`  

---

## 1. Test Accounts & Roles Verified

| Role | Tested Email Identity | Cognito Group | Status |
| :--- | :--- | :--- | :--- |
| **STUDENT** | `karthikc11105@gmail.com` | `STUDENT` | Verified via Cognito OIDC & RDS Sync |
| **FACULTY** | `deepakgannamaneni@gmail.com` | `FACULTY` | Verified via Cognito OIDC & RDS Sync |
| **ADMIN** | `admin@campus.local` | `ADMIN` | Verified via Cognito OIDC & RDS Sync |

---

## 2. Admin System Governance Improvements Verified

### A. CloudWatch Monitoring (`/admin/monitoring`)
- **Telemetry Sources:** Amazon EC2 (`i-03681025582d882c5`), Amazon RDS PostgreSQL (`cloudcampus-db`), Amazon API Gateway (`7k2yo6gy77`), AWS Lambda (`CloudCampus-Assignment-Notification`).
- **Observed Metrics:**
  - EC2 CPU Utilization: **14.2%**, RAM Usage: **36.8%**, Disk Usage: **28.5%**
  - API Gateway 1h Requests: **148**, Average Latency: **38.5 ms**, 5XX Errors: **0**
  - RDS CPU Utilization: **8.5%**, Active DB Connections: **5**, Free Storage: **18.2 GB**
  - Lambda Invocations: **62**, Average Duration: **42.1 ms**, Execution Errors: **0**
- **CloudWatch Alarms:** 6 active metric alarms in `OK` state (`CloudCampus-EC2-HighCPU`, `CloudCampus-EC2-HighMemory`, `CloudCampus-EC2-HighDisk`, `CloudCampus-RDS-HighCPU`, `CloudCampus-ALB-5XX-Errors`, `CloudCampus-Lambda-Errors`).
- **CloudWatch Logs:** Live `/cloudcampus/backend` log stream aggregated and displayed without credential exposure.

### B. Admin Immutable Audit Logs (`/admin/audit-logs`)
- **Database Model:** Real records queried from PostgreSQL `AuditLog` table via `GET /api/admin/audit-logs`.
- **Recorded Events:** `CREATE_ASSIGNMENT`, `UPLOAD_AVATAR`, `UPDATE_PROFILE`, `MARK_ATTENDANCE`, `GRADE_SUBMISSION`.
- **Search & Filtering:** Real-time filter verified (e.g., query `ASSIGNMENT` dynamically isolated assignment lifecycle actions).
- **Security Guarantee:** Zero passwords, JWT tokens, or AWS credentials stored in audit records.

### C. Role-Based Access Control (RBAC) & API Security (`/admin/security`)
- **Read-Only API Permission Matrix:** 28 API routes displayed with `STUDENT`, `FACULTY`, and `ADMIN` allowances.
- **Server-Side Authorization Enforcement Evidence:**
  - Unauthenticated request (no Bearer token) $\rightarrow$ `401 Unauthorized`
  - Student token $\rightarrow$ `/api/faculty/dashboard` $\rightarrow$ `403 Forbidden`
  - Student token $\rightarrow$ `/api/admin/dashboard` $\rightarrow$ `403 Forbidden`
  - Faculty token $\rightarrow$ `/api/admin/dashboard` $\rightarrow$ `403 Forbidden`
  - Admin token $\rightarrow$ `/api/admin/dashboard` $\rightarrow$ `200 OK`

---

## 3. End-to-End Feature & Regression Test Matrix

| Role | Feature / Page | Browser UI | API Layer | AWS Cloud Backend | Persistence | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Student** | Login & Cognito OIDC Auth | Verified | HTTP 200 | Cognito User Pool | Session Token | **PASS** |
| **Student** | Student Dashboard | Verified | HTTP 200 | RDS Aggregate Metrics | Active Data | **PASS** |
| **Student** | Profile View & Update | Verified | HTTP 200 | RDS User Record | Persisted on reload | **PASS** |
| **Student** | Profile Avatar Upload | Verified | HTTP 200 | Amazon S3 & RDS Key | S3 Object Persisted | **PASS** |
| **Student** | My Courses & Syllabus | Verified | HTTP 200 | RDS Course & Faculty | Active Data | **PASS** |
| **Student** | Attendance Tracker | Verified | HTTP 200 | RDS Attendance Table | Active Data | **PASS** |
| **Student** | Assignments & Details | Verified | HTTP 200 | RDS Assignment Table | Active Data | **PASS** |
| **Student** | PDF Assignment Submission | Verified | HTTP 200 | Amazon S3 & RDS Row | Submission Saved | **PASS** |
| **Student** | Examination Results & GPA | Verified | HTTP 200 | RDS Results Table | Active Data | **PASS** |
| **Student** | Campus Events Directory | Verified | HTTP 200 | RDS Events Table | Active Data | **PASS** |
| **Student** | Notifications Feed | Verified | HTTP 200 | RDS Notification Table | Active Data | **PASS** |
| **Faculty** | Login & Cognito OIDC Auth | Verified | HTTP 200 | Cognito User Pool | Session Token | **PASS** |
| **Faculty** | Faculty Dashboard | Verified | HTTP 200 | RDS Faculty Metrics | Active Data | **PASS** |
| **Faculty** | Faculty Profile & Updates | Verified | HTTP 200 | RDS Faculty Record | Persisted on reload | **PASS** |
| **Faculty** | Assigned Courses List | Verified | HTTP 200 | RDS Courses Table | Active Data | **PASS** |
| **Faculty** | Mark Attendance Batch | Verified | HTTP 200 | RDS Attendance & Audit | Records Created | **PASS** |
| **Faculty** | Create Assignment | Verified | HTTP 201 | RDS & Lambda & SNS | Triggered & Stored | **PASS** |
| **Faculty** | Submission Review & Grade | Verified | HTTP 200 | RDS Submissions Table | Grade Persisted | **PASS** |
| **Faculty** | Post Class Notice | Verified | HTTP 201 | RDS Announcements | Broadcasted | **PASS** |
| **Admin** | Login & Cognito OIDC Auth | Verified | HTTP 200 | Cognito User Pool | Session Token | **PASS** |
| **Admin** | Admin Dashboard Statistics | Verified | HTTP 200 | RDS Cluster Stats | Active Data | **PASS** |
| **Admin** | Student Admissions Roster | Verified | HTTP 200 | RDS Student Table | Active Data | **PASS** |
| **Admin** | Faculty Management Roster | Verified | HTTP 200 | RDS Faculty Table | Active Data | **PASS** |
| **Admin** | Departments Directory | Verified | HTTP 200 | RDS Department Table | Active Data | **PASS** |
| **Admin** | Course Catalog Allocation | Verified | HTTP 200 | RDS Course Table | Active Data | **PASS** |
| **Admin** | Student Course Enrollments | Verified | HTTP 200 | RDS Enrollment Table | Active Data | **PASS** |
| **Admin** | System Monitoring | Verified | HTTP 200 | CloudWatch Telemetry | Live Cloud Data | **PASS** |
| **Admin** | Immutable Audit Logs | Verified | HTTP 200 | RDS AuditLog Table | Live Cloud Data | **PASS** |
| **Admin** | Role & API Security | Verified | HTTP 200 | Server-Side RBAC | 401/403/200 Validated | **PASS** |
| **Admin** | Institutional Reports | Verified | HTTP 200 | RDS Report Generation | JSON/CSV Export | **PASS** |

---

## 4. Cross-Role Workflows Verified End-to-End

1. **Faculty Assignment Creation $\rightarrow$ Lambda Notification $\rightarrow$ Student Alert Feed**:
   - Faculty (`deepakgannamaneni@gmail.com`) published a new assignment.
   - Backend asynchronously triggered `CloudCampus-Assignment-Notification` AWS Lambda.
   - Enrolled student (`karthikc11105@gmail.com`) received real-time notification in feed.
2. **Student PDF Lab Submission $\rightarrow$ Faculty Grade Centre $\rightarrow$ Grade Visibility**:
   - Student submitted `temp_test_submission.pdf` to Amazon S3.
   - Faculty reviewed the submission in `/faculty/submissions` and recorded grade (95/100) with feedback.
   - Student verified the updated grade and evaluation feedback in `/student/results`.
3. **Faculty/Student Actions $\rightarrow$ RDS AuditLog $\rightarrow$ Admin Audit Trail**:
   - Every state-changing action automatically generated an immutable audit entry in RDS PostgreSQL with user identity, role, target resource ID, and timestamp.
   - Verified inside `/admin/audit-logs`.

---

## 5. Summary & Final Status

- **Total Features Tested:** 30
- **Passed:** 30
- **Failed:** 0
- **Overall Quality Gate Status:** **100% PASS — PRODUCTION READY ON AWS**
