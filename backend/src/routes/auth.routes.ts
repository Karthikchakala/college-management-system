import { Router } from 'express';
import { login, getProfile, linkCognitoAccount, loginSchema, linkCognitoSchema } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/cognito/link', validate(linkCognitoSchema), linkCognitoAccount);
router.get('/profile', authenticate, getProfile);

export default router;
