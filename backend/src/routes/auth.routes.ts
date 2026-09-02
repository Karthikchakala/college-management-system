import { Router } from 'express';
import {
  login,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  linkCognitoAccount,
  loginSchema,
  linkCognitoSchema,
  updateProfileSchema,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/cognito/link', validate(linkCognitoSchema), linkCognitoAccount);

// Universal Profile Management Routes (authenticated)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), uploadProfileAvatar);

export default router;
