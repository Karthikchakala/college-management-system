# API Verification Matrix

This document provides a matrix mapping of all REST endpoints implemented in the system, detailing authentication requirements, role authorization limits, and their integration test execution statuses.

| METHOD | ROUTE | AUTH | ROLE | EXPECTED | ACTUAL | STATUS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | None | Public | Returns auth token and user role | Token and user returned (200) | **PASS** |
| **GET** | `/api/auth/profile` | Required | Any | Returns decoded session user profile | Profile returned (200) | **PASS** |
| **GET** | `/api/health` | None | Public | Returns JSON health metadata | Health OK returned (200) | **PASS** |
| **GET** | `/api/health/database` | None | Public | Performs SELECT 1 query check | DB Healthy returned (200) | **PASS** |
| **GET** | `/api/notifications` | Required | Any | Returns lists of system alerts | Log array returned (200) | **PASS** |
| **PUT** | `/api/notifications/:id/read` | Required | Any | Marks a notification as read | Status success returned (200) | **PASS** |
| **POST** | `/api/notifications/read-all` | Required | Any | Bulk marks all notifications as read | Status success returned (200) | **PASS** |
| **GET** | `/api/student/dashboard` | Required | STUDENT | Returns GPA, courses, and schedules | Dashboard JSON returned (200) | **PASS** |
| **PUT** | `/api/student/profile` | Required | STUDENT | Updates personal address and phone | Profile updated JSON (200) | **PASS** |
| **GET** | `/api/student/courses` | Required | STUDENT | Returns enrolled course details | Courses array returned (200) | **PASS** |
| **GET** | `/api/student/attendance` | Required | STUDENT | Returns course attendance summaries | Attendance array returned (200) | **PASS** |
| **GET** | `/api/student/assignments` | Required | STUDENT | Returns list of course homework briefs | Assignments array returned (200) | **PASS** |
| **POST** | `/api/student/submit` | Required | STUDENT | Uploads homework files (10MB PDF max) | Submission ID returned (200) | **PASS** |
| **GET** | `/api/student/exams` | Required | STUDENT | Lists scheduled exam rosters | Exams array returned (200) | **PASS** |
| **GET** | `/api/student/results` | Required | STUDENT | Returns published letter grades | Results array returned (200) | **PASS** |
| **POST** | `/api/student/events/register` | Required | STUDENT | Registers student for a campus event | Registration ID returned (201) | **PASS** |
| **DELETE** | `/api/student/events/cancel/:id` | Required | STUDENT | Cancels event signup registration | Registration deleted (200) | **PASS** |
| **GET** | `/api/faculty/dashboard` | Required | FACULTY | Returns statistics on courses and logs | Dashboard JSON returned (200) | **PASS** |
| **GET** | `/api/faculty/courses` | Required | FACULTY | Returns instructor's assigned courses | Courses array returned (200) | **PASS** |
| **GET** | `/api/faculty/courses/:courseId/students`| Required | FACULTY | Returns students enrolled in the class | Students list returned (200) | **PASS** |
| **POST** | `/api/faculty/attendance` | Required | FACULTY | Mark/upsert attendance by lecture date | Log updated (200) | **PASS** |
| **GET** | `/api/faculty/attendance/:courseId` | Required | FACULTY | Returns course attendance log sheet | Roster logs returned (200) | **PASS** |
| **POST** | `/api/faculty/assignments` | Required | FACULTY | Publish assignments with attachments | Assignment ID returned (201) | **PASS** |
| **GET** | `/api/faculty/assignments/:assignmentId/submissions` | Required | FACULTY | Lists submissions uploaded by students | Submissions list returned (200) | **PASS** |
| **POST** | `/api/faculty/submissions/grade` | Required | FACULTY | Evaluate submission with comments | Status updated to GRADED (200) | **PASS** |
| **POST** | `/api/faculty/exams` | Required | FACULTY | Schedule exam for assigned course | Exam ID returned (201) | **PASS** |
| **POST** | `/api/faculty/results/enter` | Required | FACULTY | Record draft grades for an exam | Results array returned (201) | **PASS** |
| **POST** | `/api/faculty/results/publish` | Required | FACULTY | Publish result grades to students | Status updated to PUBLISHED (200) | **PASS** |
| **POST** | `/api/faculty/announcements` | Required | FACULTY | Broadcast course announcements | Announcement ID returned (201) | **PASS** |
| **GET** | `/api/admin/students` | Required | ADMIN | Lists registered student profiles | Students array returned (200) | **PASS** |
| **POST** | `/api/admin/students` | Required | ADMIN | Create student profile transactionally | Student ID returned (201) | **PASS** |
| **PUT** | `/api/admin/students/:id` | Required | ADMIN | Updates student profile details | Student profile updated (200) | **PASS** |
| **GET** | `/api/admin/faculty` | Required | ADMIN | Lists registered faculty profiles | Faculty array returned (200) | **PASS** |
| **POST** | `/api/admin/faculty` | Required | ADMIN | Create faculty profile transactionally | Faculty ID returned (201) | **PASS** |
| **PUT** | `/api/admin/faculty/:id` | Required | ADMIN | Updates faculty profile settings | Faculty profile updated (200) | **PASS** |
| **GET** | `/api/admin/departments` | Required | ADMIN | Lists registered departments | Departments array returned (200) | **PASS** |
| **POST** | `/api/admin/departments` | Required | ADMIN | Create a new department | Department ID returned (201) | **PASS** |
| **PUT** | `/api/admin/departments/:id` | Required | ADMIN | Updates department information | Department profile updated (200) | **PASS** |
| **GET** | `/api/admin/courses` | Required | ADMIN | Lists registered course catalogs | Courses array returned (200) | **PASS** |
| **POST** | `/api/admin/courses` | Required | ADMIN | Create a new course catalog | Course ID returned (201) | **PASS** |
| **PUT** | `/api/admin/courses/:id` | Required | ADMIN | Updates course catalog configurations | Course profile updated (200) | **PASS** |
| **POST** | `/api/admin/enrollments` | Required | ADMIN | Enroll a student in a course | Enrollment ID returned (201) | **PASS** |
| **DELETE** | `/api/admin/enrollments/:id` | Required | ADMIN | Unenroll a student from a course | Enrollment deleted (200) | **PASS** |
| **POST** | `/api/admin/events` | Required | ADMIN | Create a new campus event | Event ID returned (201) | **PASS** |
| **POST** | `/api/admin/announcements` | Required | ADMIN | Broadcast campus-wide announcements | Announcement ID returned (201) | **PASS** |
| **GET** | `/api/admin/audit-logs` | Required | ADMIN | Lists operational audit trails | Logs list returned (200) | **PASS** |
| **GET** | `/api/admin/dashboard-stats` | Required | ADMIN | Returns statistics on active entities | Stats JSON returned (200) | **PASS** |
| **GET** | `/api/admin/reports/export/:type` | Required | ADMIN | Generates CSV file of DB records | Text/csv stream returned (200) | **PASS** |
