import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import upload from '../middleware/upload.middleware';
import {
  getStudentDashboard,
  updateProfile,
  updateStudentProfileSchema,
  getEnrolledCourses,
  getAttendance,
  getAssignments,
  submitAssignment,
  getExams,
  getResults,
  registerForEvent,
  cancelEventRegistration,
} from '../controllers/student.controller';

const router = Router();

// Guard all student routes
router.use(authenticate);
router.use(authorize(['STUDENT']));

router.get('/dashboard', getStudentDashboard);
router.put('/profile', validate(updateStudentProfileSchema), updateProfile);
router.get('/courses', getEnrolledCourses);
router.get('/attendance', getAttendance);
router.get('/assignments', getAssignments);
router.post('/submit', upload.single('file'), submitAssignment);
router.get('/exams', getExams);
router.get('/results', getResults);
router.post('/events/register', registerForEvent);
router.delete('/events/cancel/:id', cancelEventRegistration);

export default router;
