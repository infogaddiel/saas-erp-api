import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Permission, Menu, Role } from '../models';

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
