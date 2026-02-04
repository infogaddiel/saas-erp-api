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

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return { success: false, message: 'Server configuration error' };
    }

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1d' });

    return {
      success: true,
      message: 'Login successful',
      token,
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
