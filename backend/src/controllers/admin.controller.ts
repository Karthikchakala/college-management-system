import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// --- ZOD SCHEMAS FOR ADMIN OPERATIONS ---
export const createStudentSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    enrollmentNumber: z.string().min(3),
    dateOfBirth: z.string().datetime().or(z.string().transform(val => new Date(val))),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    departmentId: z.string().uuid(),
  }),
});

export const createFacultySchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    employeeId: z.string().min(3),
    phone: z.string().optional().nullable(),
    designation: z.string().min(2),
    departmentId: z.string().uuid(),
  }),
});

export const createCourseSchema = z.object({
  body: z.object({
    code: z.string().min(2),
    name: z.string().min(1),
    description: z.string().optional().nullable(),
    credits: z.number().int().min(1).max(10),
    departmentId: z.string().uuid(),
    facultyId: z.string().uuid().optional().nullable(),
  }),
});

export const createEnrollmentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    courseId: z.string().uuid(),
  }),
});

// --- HELPER FOR CSV EXPORT ---
const generateCsv = (data: any[], headers: { label: string; key: string }[]): string => {
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item => {
    return headers.map(h => {
      // Handle nested keys like 'user.email'
      const keys = h.key.split('.');
      let val = item;
      for (const k of keys) {
        val = val?.[k];
      }
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [headerRow, ...rows].join('\n');
};

// --- CONTROLLER ACTIONS ---

// STUDENTS
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', departmentId = '', status = '', page = '1', limit = '10' } = req.query;
    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    const where: any = {
      OR: [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { enrollmentNumber: { contains: search as string, mode: 'insensitive' } },
      ],
    };

    if (departmentId) where.departmentId = departmentId as string;
    if (status) where.status = status as 'ACTIVE' | 'INACTIVE';

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { department: true, user: { select: { email: true, status: true } } },
        skip: (p - 1) * l,
        take: l,
        orderBy: { enrollmentNumber: 'asc' },
      }),
      prisma.student.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { students, total, page: p, limit: l },
    });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, enrollmentNumber, dateOfBirth, phone, address, departmentId } = req.body;

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already registered', 400, 'DUPLICATE_EMAIL');

    // Check duplicate enrollment number
    const existingStudent = await prisma.student.findUnique({ where: { enrollmentNumber } });
    if (existingStudent) throw new AppError('Enrollment number already exists', 400, 'DUPLICATE_ENROLLMENT');

    const passwordHash = await bcrypt.hash('password123', 10); // default password for new students

    const newStudent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'STUDENT',
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          enrollmentNumber,
          dateOfBirth: new Date(dateOfBirth),
          phone,
          address,
          departmentId,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_STUDENT',
          resource: 'Student',
          resourceId: student.id,
        },
      });

      return student;
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, address, status, departmentId } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.student.update({
        where: { id },
        data: { firstName, lastName, phone, address, status, departmentId },
      });

      if (status) {
        await tx.user.update({
          where: { id: student.userId },
          data: { status },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_STUDENT',
          resource: 'Student',
          resourceId: id,
        },
      });

      return s;
    });

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// FACULTY
export const getFaculty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', departmentId = '', status = '', page = '1', limit = '10' } = req.query;
    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    const where: any = {
      OR: [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } },
      ],
    };

    if (departmentId) where.departmentId = departmentId as string;
    if (status) where.status = status as 'ACTIVE' | 'INACTIVE';

    const [faculty, total] = await Promise.all([
      prisma.faculty.findMany({
        where,
        include: { department: true, user: { select: { email: true } } },
        skip: (p - 1) * l,
        take: l,
        orderBy: { employeeId: 'asc' },
      }),
      prisma.faculty.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { faculty, total, page: p, limit: l },
    });
  } catch (error) {
    next(error);
  }
};

export const createFaculty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, employeeId, phone, designation, departmentId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already registered', 400, 'DUPLICATE_EMAIL');

    const existingFaculty = await prisma.faculty.findUnique({ where: { employeeId } });
    if (existingFaculty) throw new AppError('Employee ID already exists', 400, 'DUPLICATE_EMPLOYEE_ID');

    const passwordHash = await bcrypt.hash('password123', 10);

    const newFaculty = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'FACULTY',
        },
      });

      const faculty = await tx.faculty.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          employeeId,
          phone,
          designation,
          departmentId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_FACULTY',
          resource: 'Faculty',
          resourceId: faculty.id,
        },
      });

      return faculty;
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty member created successfully',
      data: newFaculty,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaculty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, designation, status, departmentId } = req.body;

    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) throw new AppError('Faculty member not found', 404, 'NOT_FOUND');

    const updated = await prisma.$transaction(async (tx) => {
      const f = await tx.faculty.update({
        where: { id },
        data: { firstName, lastName, phone, designation, status, departmentId },
      });

      if (status) {
        await tx.user.update({
          where: { id: faculty.userId },
          data: { status },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_FACULTY',
          resource: 'Faculty',
          resourceId: id,
        },
      });

      return f;
    });

    return res.status(200).json({
      success: true,
      message: 'Faculty member updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DEPARTMENTS
export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code } = req.body;

    const existingCode = await prisma.department.findUnique({ where: { code } });
    if (existingCode) throw new AppError('Department code already exists', 400, 'DUPLICATE_CODE');

    const existingName = await prisma.department.findUnique({ where: { name } });
    if (existingName) throw new AppError('Department name already exists', 400, 'DUPLICATE_NAME');

    const department = await prisma.department.create({
      data: { name, code },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_DEPARTMENT',
        resource: 'Department',
        resourceId: department.id,
      },
    });

    return res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new AppError('Department not found', 404, 'NOT_FOUND');

    const updated = await prisma.department.update({
      where: { id },
      data: { name, status },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// COURSES
export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', departmentId = '' } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (departmentId) {
      where.departmentId = departmentId as string;
    }

    const courses = await prisma.course.findMany({
      where,
      include: { department: true, faculty: true },
      orderBy: { code: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, description, credits, departmentId, facultyId } = req.body;

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) throw new AppError('Course code already exists', 400, 'DUPLICATE_COURSE_CODE');

    const course = await prisma.course.create({
      data: { code, name, description, credits, departmentId, facultyId },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_COURSE',
        resource: 'Course',
        resourceId: course.id,
      },
    });

    return res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, credits, facultyId, status } = req.body;

    const updated = await prisma.course.update({
      where: { id },
      data: { name, description, credits, facultyId, status },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ENROLLMENTS
export const enrollStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, courseId } = req.body;

    // Check duplicate enrollment
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (existing) throw new AppError('Student is already enrolled in this course', 400, 'DUPLICATE_ENROLLMENT');

    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'ENROLL_STUDENT',
        resource: 'Enrollment',
        resourceId: enrollment.id,
      },
    });

    return res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const removeEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.enrollment.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'REMOVE_ENROLLMENT',
        resource: 'Enrollment',
        resourceId: id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Student unenrolled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// EVENTS
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, eventDate, time, location } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        time,
        location,
        organizerId: req.user?.userId || '',
      },
    });

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// ANNOUNCEMENTS
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, type } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        authorId: req.user?.userId || '',
      },
    });

    return res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

// AUDIT LOGS
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', page = '1', limit = '20' } = req.query;
    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    const where = search
      ? {
          OR: [
            { action: { contains: search as string, mode: 'insensitive' as any } },
            { resource: { contains: search as string, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, role: true } } },
        skip: (p - 1) * l,
        take: l,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { logs, total, page: p, limit: l },
    });
  } catch (error) {
    next(error);
  }
};

// REPORTS
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [students, faculty, courses, departments, activeEvents, recentAnnouncements] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.faculty.count({ where: { status: 'ACTIVE' } }),
      prisma.course.count({ where: { status: 'ACTIVE' } }),
      prisma.department.count({ where: { status: 'ACTIVE' } }),
      prisma.event.count({ where: { status: 'ACTIVE', eventDate: { gte: new Date() } } }),
      prisma.announcement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { email: true } } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        students,
        faculty,
        courses,
        departments,
        activeEvents,
        recentAnnouncements,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;

    let csvContent = '';
    let fileName = `report-${type}-${Date.now()}.csv`;

    switch (type) {
      case 'students': {
        const data = await prisma.student.findMany({ include: { department: true, user: true } });
        csvContent = generateCsv(data, [
          { label: 'Enrollment Number', key: 'enrollmentNumber' },
          { label: 'First Name', key: 'firstName' },
          { label: 'Last Name', key: 'lastName' },
          { label: 'Email', key: 'user.email' },
          { label: 'Department', key: 'department.name' },
          { label: 'Phone', key: 'phone' },
          { label: 'Address', key: 'address' },
          { label: 'Status', key: 'status' },
          { label: 'Admission Date', key: 'admissionDate' },
        ]);
        break;
      }
      case 'faculty': {
        const data = await prisma.faculty.findMany({ include: { department: true, user: true } });
        csvContent = generateCsv(data, [
          { label: 'Employee ID', key: 'employeeId' },
          { label: 'First Name', key: 'firstName' },
          { label: 'Last Name', key: 'lastName' },
          { label: 'Email', key: 'user.email' },
          { label: 'Designation', key: 'designation' },
          { label: 'Department', key: 'department.name' },
          { label: 'Phone', key: 'phone' },
          { label: 'Status', key: 'status' },
        ]);
        break;
      }
      case 'courses': {
        const data = await prisma.course.findMany({ include: { department: true, faculty: true } });
        csvContent = generateCsv(data, [
          { label: 'Course Code', key: 'code' },
          { label: 'Course Name', key: 'name' },
          { label: 'Credits', key: 'credits' },
          { label: 'Department', key: 'department.name' },
          { label: 'Instructor Employee ID', key: 'faculty.employeeId' },
          { label: 'Instructor Name', key: 'faculty.firstName' },
          { label: 'Status', key: 'status' },
        ]);
        break;
      }
      case 'attendance': {
        const data = await prisma.attendance.findMany({
          include: {
            student: { include: { department: true } },
            course: true,
          },
        });
        csvContent = generateCsv(data, [
          { label: 'Student ID', key: 'student.enrollmentNumber' },
          { label: 'Student Name', key: 'student.firstName' },
          { label: 'Course Code', key: 'course.code' },
          { label: 'Course Name', key: 'course.name' },
          { label: 'Date', key: 'date' },
          { label: 'Status', key: 'status' },
          { label: 'Remarks', key: 'remarks' },
        ]);
        break;
      }
      case 'results': {
        const data = await prisma.result.findMany({
          include: {
            student: true,
            exam: { include: { course: true } },
          },
        });
        csvContent = generateCsv(data, [
          { label: 'Student ID', key: 'student.enrollmentNumber' },
          { label: 'Student Name', key: 'student.firstName' },
          { label: 'Exam Name', key: 'exam.name' },
          { label: 'Course Code', key: 'exam.course.code' },
          { label: 'Marks Obtained', key: 'marksObtained' },
          { label: 'Grade', key: 'grade' },
          { label: 'Status', key: 'status' },
          { label: 'Remarks', key: 'remarks' },
        ]);
        break;
      }
      default:
        throw new AppError(`Report type ${type} is not supported`, 400, 'UNSUPPORTED_REPORT');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
