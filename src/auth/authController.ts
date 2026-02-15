import { Request, Response } from 'express';
import {
  loginUser,
  verifyOTP,
  getRoles as getRolesService,
  changePassword as changePasswordService,
  requestForgotPasswordOtp as requestForgotPasswordOtpService,
  resetForgotPassword as resetForgotPasswordService,
} from './authService';
import { any } from 'joi';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

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
    const { otp } = req.body;
    const user = (req as any).user;

    const result = await verifyOTP(user.id, otp);

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

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roleId = (req as any)?.user?.role_id;
    const result = await getRolesService(roleId);
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get roles controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = parseInt(String((req as any).user?.id), 10);

    if (Number.isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await changePasswordService(userId, current_password, new_password);
    if (!result.success) {
      if (result.message === 'User not found') return res.status(404).json(result);
      if (
        result.message === 'Current password is incorrect' ||
        result.message === 'New password must be different from current password'
      ) {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Change password controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const requestForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    const result = await requestForgotPasswordOtpService(mobile);

    if (!result.success) {
      if (result.message === 'User not found') return res.status(404).json(result);
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Request forgot password OTP controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const resetForgotPassword = async (req: Request, res: Response) => {
  try {
    const { mobile, otp, password } = req.body;
    const result = await resetForgotPasswordService(mobile, otp, password);

    if (!result.success) {
      if (result.message === 'User not found') return res.status(404).json(result);
      if (result.message === 'Invalid OTP') return res.status(400).json(result);
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Reset forgot password controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
