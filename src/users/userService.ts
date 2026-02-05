import { User, Company, Role } from '../models';
import { hashPassword } from '../auth/authService';

interface CreateUserInput {
  name: string;
  mobile: string;
  email?: string | null;
  password: string;
  company_id?: number | null;
  role_id?: number | null;
  blocked?: boolean;
}

export const createUser = async (data: CreateUserInput) => {
  try {
    // Check unique mobile
    const existingMobile = await User.findOne({ where: { mobile: data.mobile } });
    if (existingMobile) return { success: false, message: 'Mobile already in use' };

    if (data.email) {
      const existingEmail = await User.findOne({ where: { email: data.email } });
      if (existingEmail) return { success: false, message: 'Email already in use' };
    }

    const hashed = await hashPassword(data.password);

    const user = await User.create({
      name: data.name,
      mobile: data.mobile,
      email: data.email ?? null,
      password: hashed,
      company_id: data.company_id ?? null,
      role_id: data.role_id ?? null,
      blocked: data.blocked ?? false,
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('createUser error:', error);
    return { success: false, message: 'Error creating user' };
  }
};

export const getUsers = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Role, as: 'role', attributes: ['id', 'type'] },
      ],
      attributes: { exclude: ['password'] },
    });

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error('getUsers error:', error);
    return { success: false, message: 'Error fetching users' };
  }
};

export const getUserById = async (id: number) => {
  try {
    const user = await User.findByPk(id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Role, as: 'role', attributes: ['id', 'type'] },
      ],
      attributes: { exclude: ['password'] },
    });

    if (!user) return { success: false, message: 'User not found' };

    return { success: true, data: user };
  } catch (error) {
    console.error('getUserById error:', error);
    return { success: false, message: 'Error fetching user' };
  }
};

export const updateUser = async (id: number, updates: Partial<CreateUserInput>) => {
  try {
    const user = await User.findByPk(id);
    if (!user) return { success: false, message: 'User not found' };

    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    // Prevent updating to an email/mobile that already exists on another user
    if (updates.mobile) {
      const other = await User.findOne({ where: { mobile: updates.mobile } });
      if (other && other.id !== id) return { success: false, message: 'Mobile already in use' };
    }

    if (updates.email) {
      const other = await User.findOne({ where: { email: updates.email } });
      if (other && other.id !== id) return { success: false, message: 'Email already in use' };
    }

    await user.update(updates as any);
    return { success: true, data: user };
  } catch (error) {
    console.error('updateUser error:', error);
    return { success: false, message: 'Error updating user' };
  }
};

export const deleteUser = async (id: number) => {
  try {
    const user = await User.findByPk(id);
    if (!user) return { success: false, message: 'User not found' };

    await user.destroy();
    return { success: true, message: 'User deleted' };
  } catch (error) {
    console.error('deleteUser error:', error);
    return { success: false, message: 'Error deleting user' };
  }
};