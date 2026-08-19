# Comprehensive Test Plan

This document outlines the testing strategy, test suites, integration workflows, and manual test scripts for the College Campus Management System local version.

---

## 1. Automated Testing Strategy

We employ a multi-layered testing strategy to guarantee regression-free releases:

```text
Unit/Service Tests (Verify StorageService, NotificationService abstractions in isolation)
      ↓
API Integration Tests (Supertest checks on router status codes, JWT rejections, validations)
      ↓
E2E Journey Simulation (Simulating Student, Faculty, and Admin flows in order)
```

### Test Runner
* **Vitest**: Used as the fast test executor and assertions library on the backend.
* **Supertest**: Used to make virtual HTTP requests against the Express server to assert status codes.

---

## 2. API Test Suites (Automated)

API tests are stored under `backend/tests/` and can be run via `npm test`.

### Test Coverage Targets

#### 1. Authentication & Security
* Login using correct demo student, faculty, and admin credentials.
* Rejection on invalid credentials (e.g. incorrect password, unregistered email).
* Rejection on profile access requests lacking a JWT token.
* Validation of CORS and rate limiter headers.

#### 2. Student Dashboard & Academics
* Fetch dashboard statistics (present count, courses count).
* Retrieve enrolled courses and detailed attendance lists.
* Retrieve exam schedules and published grades (draft grades must be invisible).

#### 3. Faculty Workflows
* Record and update attendance (verify composite uniques prevent duplicates).
* Grade assignment submissions and verify notifications trigger.
* Enter exam marks (verify auto-calculation of grades: A, B, etc.).

#### 4. Admin CRUD Operations
* Add and update departments.
* Create courses and assign faculty.
* Transactional user creation (Student, Faculty) and state toggles (active/inactive).

---

## 3. End-to-End User Journeys (Manual verification)

### Student Journey
1. **Login**: Login using `student@campus.local` / `password123`.
2. **Dashboard**: Verify attendance percentage widget renders.
3. **Courses**: View enrolled courses list.
4. **Assignments**: View assignment details, upload a PDF assignment document, and verify submission status changes to `SUBMITTED`.
5. **Results**: View published marks (Midterm DBMS should show Grade `A`).
6. **Events**: Register for a Hackathon and check registration status.
7. **Logout**: Exit session.

### Faculty Journey
1. **Login**: Login using `faculty@campus.local` / `password123`.
2. **Attendance**: Select DBMS course, date, mark students present/absent, and save.
3. **Assignments**: Create an assignment, download student submission PDF, assign grade `A+`, and give feedback.
4. **Results**: Enter exam marks, click calculate grades, and publish the results.
5. **Announcements**: Publish announcement on DBMS course.
6. **Logout**: Exit.

### Admin Journey
1. **Login**: Login using `admin@campus.local` / `password123`.
2. **Users**: Search, filter, and create a new student and faculty account.
3. **Courses**: Create CS402 (Advanced DBMS) course, assign faculty, and enroll the student.
4. **Reports**: Run the CSV reports generator for courses, attendance, and results. Verify CSV downloads work.
5. **Audit Logs**: Verify recent actions appear in logs.
6. **Logout**: Exit.
