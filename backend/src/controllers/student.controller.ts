import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { notificationService } from '../services/notification.service';
import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  body: z.object({
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
});

export const getStudentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { department: true },
    });

    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    // 1. Get Enrolled Courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: {
        course: {
          include: { faculty: true },
        },
      },
    });
    const courseIds = enrollments.map(e => e.courseId);

    // 2. Attendance Summary
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: student.id },
    });
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercentage = totalAttendance > 0 ? parseFloat(((presentCount / totalAttendance) * 100).toFixed(2)) : 100;

    // 3. Pending Assignments
    const now = new Date();
    const pendingAssignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
        dueDate: { gte: now },
        submissions: {
          none: { studentId: student.id },
        },
      },
      include: { course: true },
      orderBy: { dueDate: 'asc' },
    });

    // 4. Upcoming Exams
    const upcomingExams = await prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
        examDate: { gte: now },
        status: 'SCHEDULED',
      },
      include: { course: true },
      orderBy: { examDate: 'asc' },
    });

    // 5. Upcoming registered & unregistered Events
    const upcomingEvents = await prisma.event.findMany({
      where: { eventDate: { gte: now }, status: 'ACTIVE' },
      include: {
        registrations: {
          where: { studentId: student.id },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    // 6. Recent announcements (General and Enrolled courses)
    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { courseId: null },
          { courseId: { in: courseIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 7. Recent unread notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: student.userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return res.status(200).json({
      success: true,
      data: {
        profile: student,
        coursesCount: enrollments.length,
        attendancePercentage,
        pendingAssignments,
        upcomingExams,
        upcomingEvents,
        announcements,
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { phone, address } = req.body;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: { phone, address },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrolledCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: enrollments.map(e => e.course),
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

    // Get attendance details course by course
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: { course: true },
    });

    const summary = [];
    for (const e of enrollments) {
      const records = await prisma.attendance.findMany({
        where: { studentId: student.id, courseId: e.courseId },
      });
      const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const percentage = records.length > 0 ? ((present / records.length) * 100).toFixed(2) : '100.00';

      summary.push({
        courseId: e.courseId,
        courseCode: e.course.code,
        courseName: e.course.name,
        present,
        absent,
        total: records.length,
        percentage: parseFloat(percentage),
        records,
      });
    }

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
    });
    const courseIds = enrollments.map(e => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: true,
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { assignmentId } = req.body;
    const file = req.file;

    if (!file) throw new AppError('No submission file uploaded', 400, 'FILE_REQUIRED');

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });
    if (!assignment) throw new AppError('Assignment not found', 404, 'NOT_FOUND');

    // Verify enrollment
    const enrolled = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: assignment.courseId } },
    });
    if (!enrolled) throw new AppError('You are not enrolled in the course for this assignment', 403, 'FORBIDDEN');

    // Upload using StorageService abstraction
    const { url, key } = await storageService.uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    // Create or update submission (Upsert using unique assignmentId + studentId)
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        submissionDate: new Date(),
        fileUrl: url,
        fileName: file.originalname,
        status: 'SUBMITTED',
        grade: null, // Reset grading if resubmitted
        feedback: null,
        gradedAt: null,
        gradedById: null,
      },
      create: {
        assignmentId,
        studentId: student.id,
        fileUrl: url,
        fileName: file.originalname,
        status: 'SUBMITTED',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMIT_ASSIGNMENT',
        resource: 'AssignmentSubmission',
        resourceId: submission.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
    });
    const courseIds = enrollments.map(e => e.courseId);

    const exams = await prisma.exam.findMany({
      where: { courseId: { in: courseIds } },
      include: { course: true },
      orderBy: { examDate: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

export const getResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const results = await prisma.result.findMany({
      where: { studentId: student.id, status: 'PUBLISHED' },
      include: {
        exam: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.body;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status === 'INACTIVE') throw new AppError('Event not found or inactive', 404, 'NOT_FOUND');

    // Prevent duplicate registrations
    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_studentId: { eventId, studentId: student.id } },
    });
    if (existing) throw new AppError('You are already registered for this event', 400, 'DUPLICATE_REGISTRATION');

    const registration = await prisma.eventRegistration.create({
      data: { eventId, studentId: student.id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REGISTER_EVENT',
        resource: 'EventRegistration',
        resourceId: registration.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registered for event successfully',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelEventRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // registration id

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const reg = await prisma.eventRegistration.findUnique({ where: { id } });
    if (!reg || reg.studentId !== student.id) throw new AppError('Registration not found', 404, 'NOT_FOUND');

    await prisma.eventRegistration.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANCEL_EVENT_REGISTRATION',
        resource: 'EventRegistration',
        resourceId: id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Event registration cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
