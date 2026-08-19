# Database Design Document

This document outlines the schema, tables, relationships, integrity constraints, and indexes of the relational database for the College Campus Management System.

## Database System Choice

The application is built using **PostgreSQL** locally, which is directly replaceable by **Amazon RDS PostgreSQL** in Phase 2.

## Entity Relationship Summary

The design features a set of normalized tables representing actors (Students, Faculty, Admins) and academic entities (Departments, Courses, Enrollments, Attendance, Assignments, Submissions, Exams, Results, Events, Registrations, Notifications, Audit logs).

### Relationship Structure

* **Department**: A central organization containing multiple `Students`, `Faculty`, and `Courses`.
* **User**: Parent table for credentials. Both `Student` and `Faculty` possess a one-to-one relationship with `User` via `userId`.
* **Course**: Linked to a `Department` and assigned a single `Faculty` member as the instructor (nullable if not assigned).
* **Enrollment**: A many-to-many bridge linking `Student` and `Course`. A composite unique constraint ensures a student can enroll in a course only once.
* **Attendance**: Tracks student class presence. A composite unique constraint guarantees that only one attendance record can exist for a `student + course + date`.
* **Assignment**: Created for a specific `Course` by a `Faculty` member. Enforces one-to-many relationship.
* **AssignmentSubmission**: Stores student work. Enforces a composite unique key on `assignmentId + studentId` (limit to one submission per student per assignment, which they can update / overwrite).
* **Exam & Result**: Exams are created for a specific `Course`. The `Result` table maps exam grades to individual students. Unique index prevents duplicate grades for a `student + exam`.
* **Event & Registration**: Campus events are organized by administrative users. Students can register for events. A unique key on `eventId + studentId` prevents duplicate registration.
* **AuditLog**: Independent tracker recording critical API invocations (e.g. user creation, attendance updates) with structural JSON metadata for future CloudWatch pipeline parsing.

## Table Structures

### User
* `id` (UUID, Primary Key)
* `email` (VARCHAR, Unique Index)
* `passwordHash` (VARCHAR)
* `role` (ENUM: STUDENT, FACULTY, ADMIN)
* `status` (ENUM: ACTIVE, INACTIVE)
* `createdAt` / `updatedAt` (TIMESTAMP)

### Student
* `id` (UUID, Primary Key)
* `userId` (UUID, Foreign Key referencing User, On Delete Cascade)
* `firstName` / `lastName` (VARCHAR)
* `enrollmentNumber` (VARCHAR, Unique Index)
* `departmentId` (UUID, Foreign Key referencing Department, On Delete Restrict)
* `phone` / `address` / `dateOfBirth` / `admissionDate` / `status`

### Faculty
* `id` (UUID, Primary Key)
* `userId` (UUID, Foreign Key referencing User, On Delete Cascade)
* `firstName` / `lastName` (VARCHAR)
* `employeeId` (VARCHAR, Unique Index)
* `designation` (VARCHAR)
* `departmentId` (UUID, Foreign Key referencing Department, On Delete Restrict)
* `phone` / `status`

### Course
* `id` (UUID, Primary Key)
* `code` (VARCHAR, Unique Index)
* `name` (VARCHAR)
* `description` (TEXT, Nullable)
* `credits` (INTEGER, CHECK credits > 0)
* `departmentId` (UUID, Foreign Key referencing Department)
* `facultyId` (UUID, Foreign Key referencing Faculty, On Delete Set Null)

### Attendance
* `id` (UUID, Primary Key)
* `studentId` (UUID, Foreign Key referencing Student, On Delete Cascade)
* `courseId` (UUID, Foreign Key referencing Course, On Delete Cascade)
* `date` (DATE)
* `status` (ENUM: PRESENT, ABSENT, LATE)
* `remarks` (TEXT, Nullable)
* **Constraints**: `@@unique([studentId, courseId, date])`

### AssignmentSubmission
* `id` (UUID, Primary Key)
* `assignmentId` (UUID, Foreign Key referencing Assignment, On Delete Cascade)
* `studentId` (UUID, Foreign Key referencing Student, On Delete Cascade)
* `submissionDate` (TIMESTAMP)
* `fileUrl` (VARCHAR)
* `fileName` (VARCHAR)
* `status` (ENUM: SUBMITTED, GRADED)
* `grade` (VARCHAR, Nullable)
* `feedback` (TEXT, Nullable)
* `gradedById` (UUID, Foreign Key referencing Faculty, On Delete Set Null)
* **Constraints**: `@@unique([assignmentId, studentId])`

## Database Indexing

For faster query performance under high load (simulating thousands of campus records):
* Single-column indexes are added on all primary lookup keys (e.g. `User.email`, `Student.enrollmentNumber`, `Faculty.employeeId`, `Course.code`).
* Foreign key columns (e.g. `Enrollment.studentId`, `Attendance.courseId`, `Result.examId`, etc.) are indexed to optimize SQL join queries.
* Composite index on `Notification(userId, isRead)` optimizes loading the unread notice drawer.
