import { Router, Request, Response } from 'express';
import { loginUser, hashPassword, verifyOTP } from '../services/authService';
import authenticate from '../middlewares/authenticate';

const router = Router();

interface LoginRequest extends Request {
  body: {
    mobile: string;
    password: string;
  };
}

interface VerifyOTPRequest extends Request {
  body: {
    otp: string;
  };
}

router.post('/login', async (req: LoginRequest, res: Response) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required',
      });
    }

    const result = await loginUser(mobile, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
});

router.post('/verify-otp', authenticate, async (req: VerifyOTPRequest, res: Response) => {
  try {
    const { otp } = req.body;
    const user = (req as any).user;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    const result = await verifyOTP(user.id, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify OTP route error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
});

export default router;
