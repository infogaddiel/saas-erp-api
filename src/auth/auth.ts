import { Router } from 'express';
import { login, verifyOtp, getRoles, changePassword, requestForgotPasswordOtp, resetForgotPassword, register } from './authController';
import validateRequest from '../middlewares/validateRequest';
import {
  loginSchema,
  verifyOtpSchema,
  changePasswordSchema,
  forgotPasswordRequestOtpSchema,
  forgotPasswordResetSchema,
  registerSchema,
} from './authValidator';
import authenticate from '../middlewares/authenticate';

const router = Router();

router.post('/register', validateRequest(registerSchema, 'body'), register);
router.post('/login', validateRequest(loginSchema, 'body'), login);
router.post('/verify-otp', authenticate, validateRequest(verifyOtpSchema, 'body'),  verifyOtp);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema, 'body'), changePassword);
router.post('/forgot-password/request-otp', validateRequest(forgotPasswordRequestOtpSchema, 'body'), requestForgotPasswordOtp);
router.post('/forgot-password/reset', validateRequest(forgotPasswordResetSchema, 'body'), resetForgotPassword);
router.get('/roles', authenticate, getRoles);

export default router;
