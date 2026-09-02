# CloudCampus — Complete Faculty ↔ Student Real-Browser Relationship Test Report

**Environment:** AWS Multi-Tier Cloud Deployment  
**AWS Region:** `us-east-1` (N. Virginia)  
**Evaluation Date:** September 2026  
**Frontend URL:** `http://localhost:3000`  
**API Gateway URL:** `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api`  
**Cognito User Pool ID:** `us-east-1_Ic9huqJjL`  

---

## 1. Test Identities & Relationship Discovery

### A. Evaluated Academic Accounts
| Role | Email Identity | Name | Cognito Group | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FACULTY** | `deepakgannamaneni@gmail.com` | Deepak Gannamaneni | `FACULTY` | Verified via Cognito OIDC & RDS Sync |
| **STUDENT** | `karthikc11105@gmail.com` | Karthik Chakala | `STUDENT` | Verified via Cognito OIDC & RDS Sync |

### B. Shared Relational Course
- **Course Code:** `CSE203`
- **Course Name:** `Operating Systems`
- **Course ID:** `51bce239-0fab-4e1f-894e-ef7f0c2ade92`
- **Assigned Faculty:** Deepak Gannamaneni (`deepakgannamaneni@gmail.com`)
- **Enrolled Student:** Karthik Chakala (`karthikc11105@gmail.com`)

---

## 2. End-to-End Relationship Lifecycle Verification

```text
       DEEPAK (FACULTY)                                   KARTHIK (STUDENT)
              │                                                  │
              │── (1) Profile Edit & Persist ────────────────────┤
              │── (2) Broadcast Notice (CSE203) ────────────────>│ (Sees Notice in Feed)
              │── (3) Create Assignment (CSE203) ───────────────>│ (Sees Assignment + Notif)
              │                                                  │
              │                                                  ├── (4) Uploads & Submits PDF
              │<── (5) Views Submission in Grade Center ─────────┤
              │── (6) Grades with Score (85) & Feedback ────────>│
              │                                                  ├── (7) Sees Exact Grade & Feedback
              │── (8) Marks Attendance (PRESENT) ───────────────>│ (Sees Updated Attendance %)
              │                                                  │
              ▼                                                  ▼
                         100% PERSISTED ACROSS RDS & S3
```

---

## 3. Detailed Stage-by-Stage Results

| Stage # | Relationship / Workflow Stage | Faculty Action | Student Action | Cloud / Storage Layer | Persistence | Result |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **1** | **Faculty Profile Persistence** | Updated Specialization (`Cloud Computing & OS`) | N/A | RDS `Faculty` record updated | Persisted on reload & re-login | **PASS** |
| **2** | **Course Roster Alignment** | Views `CSE203` in `/faculty/courses` | Views `CSE203` in `/student/courses` | RDS `Course` & `Enrollment` tables | Persisted across sessions | **PASS** |
| **3** | **Faculty &rarr; Student Notice** | Broadcasts notice for `CSE203` | Sees notice in `/student/notifications` | RDS `Announcement` & `Notification` | Persisted across sessions | **PASS** |
| **4** | **Faculty &rarr; Student Assignment** | Publishes *"Operating Systems Memory Management Lab"* | Receives Lambda alert & sees in `/student/assignments` | RDS `Assignment` + Lambda Invoke | Persisted across sessions | **PASS** |
| **5** | **Student &rarr; Faculty Submission** | Receives submission in `/faculty/submissions` | Uploads `temp_test_submission.pdf` | Amazon S3 bucket + RDS `AssignmentSubmission` | S3 Object + RDS Key Verified | **PASS** |
| **6** | **Faculty &rarr; Student Grading** | Enters score (`85`) and feedback | Views score (`85`) and feedback in `/student/results` | RDS `AssignmentSubmission` (status: `GRADED`) | Persisted across sessions | **PASS** |
| **7** | **Attendance Marking** | Marks Karthik as `PRESENT` in `CSE203` | Views updated attendance % in `/student/attendance` | RDS `Attendance` table + `AuditLog` entry | Persisted across sessions | **PASS** |
| **8** | **RBAC Boundary Enforcement** | Blocked from Admin APIs (403) | Blocked from Faculty (403) & Admin (403) APIs | Express Authorization Middleware | Enforced Server-Side | **PASS** |
| **9** | **Second-Pass Repeat Verification** | Re-authenticates via Cognito | Re-authenticates via Cognito | Live API Gateway & RDS | 100% Consistent | **PASS** |

---

## 4. Role-Based Access Control (RBAC) Test Evidence

```text
[RBAC-1] Unauthenticated -> /api/student/dashboard         => HTTP 401 Unauthorized [PASS]
[RBAC-2] Student Token  -> /api/faculty/dashboard         => HTTP 403 Forbidden    [PASS]
[RBAC-3] Student Token  -> /api/faculty/assignments       => HTTP 403 Forbidden    [PASS]
[RBAC-4] Student Token  -> /api/admin/dashboard           => HTTP 403 Forbidden    [PASS]
[RBAC-5] Faculty Token  -> /api/admin/dashboard           => HTTP 403 Forbidden    [PASS]
[RBAC-6] Faculty Token  -> /api/admin/audit-logs          => HTTP 403 Forbidden    [PASS]
```

---

## 5. Summary & Final Verdict

- **Course Tested:** `CSE203` (Operating Systems)
- **Faculty Tested:** Deepak Gannamaneni (`deepakgannamaneni@gmail.com`)
- **Student Tested:** Karthik Chakala (`karthikc11105@gmail.com`)
- **Total Workflow Stages:** 9
- **Passed Stages:** 9
- **Failed Stages:** 0
- **Overall System Relationship Status:** **100% PASS — FULLY INTEGRATED ON AWS CLOUD**
