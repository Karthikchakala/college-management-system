import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { notificationService } from '../services/notification.service';
import { z } from 'zod';

export const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    dueDate: z.string().datetime().or(z.string().transform(val => new Date(val))),
    points: z.number().int().min(1),
    courseId: z.string().uuid(),
  }),
});

export const gradeSubmissionSchema = z.object({
  body: z.object({
    submissionId: z.string().uuid(),
    grade: z.string().min(1),
    feedback: z.string().optional().nullable(),
  }),
});

export const markAttendanceSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    date: z.string().transform(val => new Date(val)),
    records: z.array(z.object({
      studentId: z.string().uuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
      remarks: z.string().optional().nullable(),
    })),
  }),
});

export const enterResultSchema = z.object({
  body: z.object({
    examId: z.string().uuid(),
    results: z.array(z.object({
      studentId: z.string().uuid(),
      marksObtained: z.number().min(0),
      remarks: z.string().optional().nullable(),
    })),
  }),
});

// Helper for Grade Calculation
const calculateGrade = (marks: number, maxMarks: number): string => {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export const getFacultyDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: { department: true },
    });

    if (!faculty) throw new AppError('Faculty profile not found', 404, 'NOT_FOUND');

    // 1. Assigned Courses
    const courses = await prisma.course.findMany({
      where: { facultyId: faculty.id, status: 'ACTIVE' },
    });
    const courseIds = courses.map(c => c.id);

    // 2. Student Counts
    const enrollmentsCount = await prisma.enrollment.count({
      where: { courseId: { in: courseIds }, status: 'ACTIVE' },
    });

    // 3. Pending Submissions Count
    const pendingSubmissionsCount = await prisma.assignmentSubmission.count({
      where: {
        assignment: { courseId: { in: courseIds } },
        status: 'SUBMITTED',
      },
    });

    // 4. Upcoming Exams
    const upcomingExams = await prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
        examDate: { gte: new Date() },
      },
      include: { course: true },
      orderBy: { examDate: 'asc' },
      take: 5,
    });

    // 5. Recent Course Announcements
    const announcements = await prisma.announcement.findMany({
      where: { authorId: faculty.userId, courseId: { in: courseIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return res.status(200).json({
      success: true,
      data: {
        profile: faculty,
        courses,
        studentsCount: enrollmentsCount,
        pendingSubmissionsCount,
        upcomingExams,
        announcements,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignedCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty not found', 404, 'NOT_FOUND');

    const courses = await prisma.course.findMany({
      where: { facultyId: faculty.id },
      include: { department: true },
    });

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      include: {
        student: {
          include: { user: { select: { email: true } } },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: enrollments.map(e => e.student),
    });
  } catch (error) {
    next(error);
  }
};

// ATTENDANCE
export const markAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, date, records } = req.body;
    const inputDate = new Date(date);

    // Verify course assigned to faculty
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    const course = await prisma.course.findFirst({
      where: { id: courseId, facultyId: faculty?.id },
    });
    if (!course) throw new AppError('Unauthorized course management', 403, 'FORBIDDEN');

    const updatedRecords = [];

    // Run transaction
    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        const attendance = await tx.attendance.upsert({
          where: {
            studentId_courseId_date: {
              studentId: rec.studentId,
              courseId,
              date: inputDate,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks,
          },
          create: {
            studentId: rec.studentId,
            courseId,
            date: inputDate,
            status: rec.status,
            remarks: rec.remarks,
          },
        });
        updatedRecords.push(attendance);
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'MARK_ATTENDANCE',
          resource: 'Attendance',
          resourceId: courseId,
          metadata: { date, count: records.length },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: updatedRecords,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseAttendanceHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

    const course = await prisma.course.findFirst({
      where: { id: courseId, facultyId: faculty.id },
    });
    if (!course) throw new AppError('Unauthorized course access or course not found', 403, 'FORBIDDEN');

    const records = await prisma.attendance.findMany({
      where: { courseId },
      include: {
        student: true,
      },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// ASSIGNMENTS
export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueDate, points, courseId } = req.body;
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      const upload = await storageService.uploadFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      });
      fileUrl = upload.url;
      fileName = req.file.originalname;
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        points,
        courseId,
        facultyId: faculty.id,
        fileUrl,
        fileName,
      },
    });

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      include: { student: true },
    });

    for (const e of enrollments) {
      await notificationService.sendNotification(
        e.student.userId,
        'New Assignment Published',
        `Professor published: ${title} for course. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        'ACADEMIC'
      );
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ASSIGNMENT',
        resource: 'Assignment',
        resourceId: assignment.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: true,
      },
      orderBy: { submissionDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

export const gradeSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignment: {
          facultyId: faculty.id,
        },
      },
    });
    if (!submission) throw new AppError('Unauthorized submission grading or submission not found', 403, 'FORBIDDEN');

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'GRADED',
        grade,
        feedback,
        gradedById: faculty.id,
        gradedAt: new Date(),
      },
      include: {
        student: true,
        assignment: true,
      },
    });

    // Send notification
    await notificationService.sendNotification(
      updated.student.userId,
      'Assignment Graded',
      `Your submission for "${updated.assignment.title}" has been graded. Grade: ${grade}`,
      'ACADEMIC'
    );

    return res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// EXAMS & RESULTS
export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, name, examDate, startTime, endTime, location, maxMarks } = req.body;
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        facultyId: faculty.id,
      },
    });
    if (!course) throw new AppError('Unauthorized course access or course not found', 403, 'FORBIDDEN');

    const exam = await prisma.exam.create({
      data: {
        courseId,
        name,
        examDate: new Date(examDate),
        startTime,
        endTime,
        location,
        maxMarks,
      },
    });

    return res.status(201).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

export const enterResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { examId, results } = req.body;
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        course: {
          facultyId: faculty.id,
        },
      },
    });
    if (!exam) throw new AppError('Unauthorized exam access or exam not found', 403, 'FORBIDDEN');

    const updatedResults = [];

    await prisma.$transaction(async (tx) => {
      for (const res of results) {
        const grade = calculateGrade(res.marksObtained, exam.maxMarks);
        const resultRecord = await tx.result.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: res.studentId,
            },
          },
          update: {
            marksObtained: res.marksObtained,
            grade,
            remarks: res.remarks,
            status: 'DRAFT', // Saved as Draft first
          },
          create: {
            examId,
            studentId: res.studentId,
            marksObtained: res.marksObtained,
            grade,
            remarks: res.remarks,
            status: 'DRAFT',
          },
        });
        updatedResults.push(resultRecord);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Exam results saved as draft',
      data: updatedResults,
    });
  } catch (error) {
    next(error);
  }
};

export const publishResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.body;
    const userId = req.user?.userId;
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        course: {
          facultyId: faculty.id,
        },
      },
    });
    if (!exam) throw new AppError('Unauthorized exam access or exam not found', 403, 'FORBIDDEN');

    const updated = await prisma.result.updateMany({
      where: { examId },
      data: { status: 'PUBLISHED' },
    });

    // Notify students
    const results = await prisma.result.findMany({
      where: { examId, status: 'PUBLISHED' },
      include: { student: true, exam: { include: { course: true } } },
    });

    for (const r of results) {
      await notificationService.sendNotification(
        r.student.userId,
        'Exam Results Published',
        `Your results for exam "${r.exam.name}" in course "${r.exam.course.name}" are out. Grade: ${r.grade}`,
        'EXAM'
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Exam results published successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ANNOUNCEMENTS
export const createCourseAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, courseId } = req.body;
    const userId = req.user?.userId || '';

    if (courseId) {
      const faculty = await prisma.faculty.findUnique({ where: { userId } });
      if (!faculty) throw new AppError('Faculty profile required', 404, 'NOT_FOUND');

      const course = await prisma.course.findFirst({
        where: { id: courseId, facultyId: faculty.id },
      });
      if (!course) throw new AppError('Unauthorized course management or course not found', 403, 'FORBIDDEN');
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: 'ACADEMIC',
        courseId,
        authorId: userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};
