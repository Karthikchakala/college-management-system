-- ==========================================
-- COMPLETE SCHEMA FOR COLLEGE CAMPUS MANAGEMENT SYSTEM
-- Compatible with PostgreSQL / Amazon RDS PostgreSQL
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE "Role" AS ENUM ('STUDENT', 'FACULTY', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'GRADED');
CREATE TYPE "ExamStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'ACADEMIC', 'EVENT', 'EXAM', 'URGENT');
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'ACADEMIC', 'EVENT', 'EXAM', 'SYSTEM');

-- TABLES

-- 1. Users
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Departments
CREATE TABLE "Department" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "code" VARCHAR(50) UNIQUE NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Students
CREATE TABLE "Student" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "enrollmentNumber" VARCHAR(100) UNIQUE NOT NULL,
    "dateOfBirth" TIMESTAMP NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "admissionDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" UUID NOT NULL REFERENCES "Department"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Faculty
CREATE TABLE "Faculty" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "employeeId" VARCHAR(100) UNIQUE NOT NULL,
    "phone" VARCHAR(50),
    "designation" VARCHAR(100) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" UUID NOT NULL REFERENCES "Department"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Courses
CREATE TABLE "Course" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL CHECK ("credits" > 0),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "departmentId" UUID NOT NULL REFERENCES "Department"("id") ON DELETE RESTRICT,
    "facultyId" UUID REFERENCES "Faculty"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Enrollments
CREATE TABLE "Enrollment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "enrollmentDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "student_course_unique" UNIQUE ("studentId", "courseId")
);

-- 7. Attendance
CREATE TABLE "Attendance" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "student_course_date_unique" UNIQUE ("studentId", "courseId", "date")
);

-- 8. Assignments
CREATE TABLE "Assignment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    "points" INTEGER NOT NULL CHECK ("points" > 0),
    "fileUrl" VARCHAR(512),
    "fileName" VARCHAR(255),
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "facultyId" UUID NOT NULL REFERENCES "Faculty"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. Assignment Submissions
CREATE TABLE "AssignmentSubmission" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "assignmentId" UUID NOT NULL REFERENCES "Assignment"("id") ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "submissionDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "fileUrl" VARCHAR(512) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "grade" VARCHAR(10),
    "feedback" TEXT,
    "gradedAt" TIMESTAMP,
    "gradedById" UUID REFERENCES "Faculty"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "assignment_student_unique" UNIQUE ("assignmentId", "studentId")
);

-- 10. Exams
CREATE TABLE "Exam" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "courseId" UUID NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "examDate" TIMESTAMP NOT NULL,
    "startTime" VARCHAR(50) NOT NULL,
    "endTime" VARCHAR(50) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "maxMarks" INTEGER NOT NULL CHECK ("maxMarks" > 0),
    "status" "ExamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. Results
CREATE TABLE "Result" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "examId" UUID NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "marksObtained" DOUBLE PRECISION NOT NULL CHECK ("marksObtained" >= 0),
    "grade" VARCHAR(10) NOT NULL,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "exam_student_unique" UNIQUE ("examId", "studentId")
);

-- 12. Events
CREATE TABLE "Event" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP NOT NULL,
    "time" VARCHAR(50) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "organizerId" UUID NOT NULL REFERENCES "User"("id"),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. Event Registrations
CREATE TABLE "EventRegistration" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "eventId" UUID NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
    "registrationDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "event_student_unique" UNIQUE ("eventId", "studentId")
);

-- 14. Announcements
CREATE TABLE "Announcement" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL,
    "courseId" UUID REFERENCES "Course"("id") ON DELETE CASCADE,
    "authorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 15. Notifications
CREATE TABLE "Notification" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "readAt" TIMESTAMP,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 16. Documents
CREATE TABLE "Document" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(512) NOT NULL,
    "fileType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "studentId" UUID REFERENCES "Student"("id") ON DELETE SET NULL,
    "courseId" UUID REFERENCES "Course"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 17. Audit Logs
CREATE TABLE "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resourceId" VARCHAR(255),
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "metadata" JSONB
);

-- INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX "idx_user_email" ON "User" ("email");
CREATE INDEX "idx_student_enrollment" ON "Student" ("enrollmentNumber");
CREATE INDEX "idx_faculty_employee" ON "Faculty" ("employeeId");
CREATE INDEX "idx_enrollment_student" ON "Enrollment" ("studentId");
CREATE INDEX "idx_enrollment_course" ON "Enrollment" ("courseId");
CREATE INDEX "idx_attendance_student" ON "Attendance" ("studentId");
CREATE INDEX "idx_attendance_course" ON "Attendance" ("courseId");
CREATE INDEX "idx_attendance_date" ON "Attendance" ("date");
CREATE INDEX "idx_assignment_course" ON "Assignment" ("courseId");
CREATE INDEX "idx_submission_assignment" ON "AssignmentSubmission" ("assignmentId");
CREATE INDEX "idx_submission_student" ON "AssignmentSubmission" ("studentId");
CREATE INDEX "idx_exam_course" ON "Exam" ("courseId");
CREATE INDEX "idx_result_exam" ON "Result" ("examId");
CREATE INDEX "idx_result_student" ON "Result" ("studentId");
CREATE INDEX "idx_event_reg_event" ON "EventRegistration" ("eventId");
CREATE INDEX "idx_event_reg_student" ON "EventRegistration" ("studentId");
CREATE INDEX "idx_announcement_course" ON "Announcement" ("courseId");
CREATE INDEX "idx_notification_user" ON "Notification" ("userId");
CREATE INDEX "idx_notification_isread" ON "Notification" ("userId", "isRead");
CREATE INDEX "idx_audit_user" ON "AuditLog" ("userId");
CREATE INDEX "idx_audit_action" ON "AuditLog" ("action");
CREATE INDEX "idx_audit_timestamp" ON "AuditLog" ("timestamp");
