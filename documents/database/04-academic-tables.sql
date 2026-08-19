-- 04-academic-tables.sql

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
