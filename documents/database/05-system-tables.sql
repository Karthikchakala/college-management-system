-- 05-system-tables.sql

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
