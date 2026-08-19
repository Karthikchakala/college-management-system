import { Router } from 'express';
import { login, getProfile, loginSchema } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/profile', authenticate, getProfile);

export default router;
