-- 06-indexes.sql

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
