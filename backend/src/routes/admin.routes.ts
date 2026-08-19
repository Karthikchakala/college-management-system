import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  getStudents,
  createStudent,
  updateStudent,
  createStudentSchema,
  getFaculty,
  createFaculty,
  updateFaculty,
  createFacultySchema,
  getDepartments,
  createDepartment,
  updateDepartment,
  getCourses,
  createCourse,
  updateCourse,
  createCourseSchema,
  enrollStudent,
  removeEnrollment,
  createEnrollmentSchema,
  createEvent,
  createAnnouncement,
  getAuditLogs,
  getDashboardStats,
  exportReport,
} from '../controllers/admin.controller';

const router = Router();

// Guard all admin routes with authentication and ADMIN role check
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Student Management
router.get('/students', getStudents);
router.post('/students', validate(createStudentSchema), createStudent);
router.put('/students/:id', updateStudent);

// Faculty Management
router.get('/faculty', getFaculty);
router.post('/faculty', validate(createFacultySchema), createFaculty);
router.put('/faculty/:id', updateFaculty);

// Department Management
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);

// Course Management
router.get('/courses', getCourses);
router.post('/courses', validate(createCourseSchema), createCourse);
router.put('/courses/:id', updateCourse);

// Enrollment Management
router.post('/enrollments', validate(createEnrollmentSchema), enrollStudent);
router.delete('/enrollments/:id', removeEnrollment);

// Events & Announcements (Admin triggers)
router.post('/events', createEvent);
router.post('/announcements', createAnnouncement);

// Audit Logging
router.get('/audit-logs', getAuditLogs);

// Dashboard Analytics & CSV Reports
router.get('/dashboard-stats', getDashboardStats);
router.get('/reports/export/:type', exportReport);

export default router;
