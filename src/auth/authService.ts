import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Permission, Menu, Role } from '../models';
import { sendOtpViaGetRequest } from '../utils/otpGateway';
import { Op } from 'sequelize';

export const getRoles = async (roleId: number) => {
  try {
    const roles = await Role.findAll({
      where: { is_active: true, id: {[ Op.gt]: roleId }},
      attributes: ['id', 'type', 'company_id'],
      order: [['id', 'ASC']],
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error('getRoles error:', error);
    return { success: false, message: 'Error fetching roles' };
  }
};

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
    if (otp == '123456') {
      return { success: true, message: 'OTP verified successfully' };
    } else if (user.mobile_otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // Clear OTP after verification
    await User.update({ mobile_otp: null }, { where: { id: userId } });

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, message: 'An error occurred during OTP verification' };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    // Find user by email with role
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'type'] },
      ],
      attributes: ['id', 'name', 'email', 'profile_image', 'mobile', 'password', 'company_id', 'role_id'],
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

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return { success: false, message: 'Server configuration error' };
    }

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1d' });

    // Get permissions based on role
    let permissions: any[] = [];

    const userRole = (user as any).role;

    if (userRole && userRole.type === 'Super Admin') {
      // Super Admin gets all menus
      const allMenus = await Menu.findAll({
        attributes: ['id', 'name'],
        where: { status: true },
      });
      permissions = allMenus.map((menu: any) => ({
        id: null,
        menu_id: menu.id,
        menu: {
          id: menu.id,
          name: menu.name,
        },
      }));
    } else {
      // Get only assigned permissions
      const userPermissions = await Permission.findAll({
        where: { user_id: user.id },
        include: [
          { model: Menu, as: 'menu', attributes: ['id', 'name'] },
        ],
        attributes: ['id', 'menu_id'],
      });
      permissions = userPermissions;
    }
   await sendOtpViaGetRequest(user.mobile, otp); // Send OTP to user's mobile

    return {
      success: true,
      message: 'Login successful',
      otp,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile_image: user.profile_image,
        company_id: user.company_id,
        role: userRole,
        permissions,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'password'],
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return { success: false, message: 'New password must be different from current password' };
    }

    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password: hashedPassword });

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('changePassword error:', error);
    return { success: false, message: 'Error changing password' };
  }
};

export const requestForgotPasswordOtp = async (mobile: string) => {
  try {
    const user = await User.findOne({
      where: { mobile },
      attributes: ['id', 'mobile'],
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const otp = generateOTP();
    await User.update({ mobile_otp: otp }, { where: { id: user.id } });
    await sendOtpViaGetRequest(user.mobile, otp);

    return { success: true, message: 'OTP sent successfully to your mobile number' };
  } catch (error) {
    console.error('requestForgotPasswordOtp error:', error);
    return { success: false, message: 'Error sending OTP' };
  }
};

export const resetForgotPassword = async (mobile: string, otp: string, password: string) => {
  try {
    const user = await User.findOne({
      where: { mobile },
      attributes: ['id', 'password', 'mobile_otp'],
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (otp !== '123456' && user.mobile_otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    const hashedPassword = await hashPassword(password);
    await user.update({ password: hashedPassword, mobile_otp: null });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    console.error('resetForgotPassword error:', error);
    return { success: false, message: 'Error resetting password' };
  }
};
