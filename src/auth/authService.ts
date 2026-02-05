import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyOTP = async (userId: number, otp: string) => {
  try {
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'mobile_otp'],
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.mobile_otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // Clear OTP after verification
    await User.update({ mobile_otp: null }, { where: { id: userId } });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return { success: false, message: 'Server configuration error' };
    }

    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1d' });

    return { success: true, message: 'OTP verified successfully', token };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, message: 'An error occurred during OTP verification' };
  }
};

export const loginUser = async (mobile: string, password: string) => {
  try {
    // Find user by mobile number using Sequelize
    const user = await User.findOne({
      where: { mobile },
      attributes: ['id', 'name', 'email', 'profile_image', 'mobile', 'password', 'company_id'],
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { success: false, message: 'Invalid password' };
    }

    // Generate OTP
    const otp = generateOTP();

    // Update user with OTP
    await User.update({ mobile_otp: otp }, { where: { id: user.id } });

    return {
      success: true,
      message: 'Login successful',
      otp,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile_image: user.profile_image,
        company_id: user.company_id,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
};
