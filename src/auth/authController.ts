import { Request, Response } from 'express';
import { loginUser, verifyOTP } from './authService';

export const login = async (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;

    const result = await loginUser(mobile, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { user_id, otp } = req.body;

    const result = await verifyOTP(user_id, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify OTP controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};