import { Router } from 'express';
import { login, verifyOtp } from './authController';
import validateRequest from '../middlewares/validateRequest';
import { loginSchema, verifyOtpSchema } from './authValidator';

const router = Router();

router.post('/login', validateRequest(loginSchema, 'body'), login);
router.post('/verify-otp', validateRequest(verifyOtpSchema, 'body'), verifyOtp);

export default router;
