import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import upload from '../middleware/upload.middleware';
import {
  getFacultyDashboard,
  getAssignedCourses,
  getCourseStudents,
  markAttendance,
  markAttendanceSchema,
  getCourseAttendanceHistory,
  createAssignment,
  createAssignmentSchema,
  getAssignmentSubmissions,
  gradeSubmission,
  gradeSubmissionSchema,
  createExam,
  enterResults,
  enterResultSchema,
  publishResults,
  createCourseAnnouncement,
} from '../controllers/faculty.controller';

const router = Router();

// Guard all faculty routes
router.use(authenticate);
router.use(authorize(['FACULTY']));

router.get('/dashboard', getFacultyDashboard);
router.get('/courses', getAssignedCourses);
router.get('/courses/:courseId/students', getCourseStudents);

// Attendance Management
router.post('/attendance', validate(markAttendanceSchema), markAttendance);
router.get('/attendance/:courseId', getCourseAttendanceHistory);

// Assignment Creation & Grading
router.post('/assignments', upload.single('file'), (req, res, next) => {
  // Parse points to integer if string (since multer parses multipart body as string)
  if (req.body.points) req.body.points = parseInt(req.body.points);
  next();
}, validate(createAssignmentSchema), createAssignment);

router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.post('/submissions/grade', validate(gradeSubmissionSchema), gradeSubmission);

// Exams & Results
router.post('/exams', createExam);
router.post('/results/enter', validate(enterResultSchema), enterResults);
router.post('/results/publish', publishResults);

// Notice Board
router.post('/announcements', createCourseAnnouncement);

export default router;
