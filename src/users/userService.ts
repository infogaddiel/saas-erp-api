import { User, Company, Role, Permission, Menu, Item, Customer, Ticket, TicketStatus } from '../models';
import { hashPassword } from '../auth/authService';
import { Op } from 'sequelize';

interface CreateUserInput {
  name: string;
  mobile: string;
  email?: string | null;
  password: string;
  company_id?: number | null;
  role_id?: number | null;
  blocked?: boolean;
  menu_ids?: number[];
}

const fetchUserWithRelations = async (userId: number) => {
  return User.findByPk(userId, {
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name'] },
      { model: Role, as: 'role', attributes: ['id', 'type'] },
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'menu_id'],
        include: [{ model: Menu, as: 'menu', attributes: ['id', 'name'] }],
      },
    ],
    attributes: { exclude: ['password'] },
  });
};

export const createUser = async (data: CreateUserInput) => {
  try {
    // Check for a soft-deleted user with same mobile + company_id — restore instead of creating
    const deletedUser = await User.unscoped().findOne({
      where: {
        mobile: data.mobile,
        company_id: data.company_id ?? null,
        deleted_at: { [Op.ne]: null },
      },
    });

    if (deletedUser) {
      const hashed = await hashPassword(data.password);
      await deletedUser.update({
        name: data.name,
        email: data.email ?? null,
        password: hashed,
        role_id: data.role_id ?? null,
        blocked: false,
        deleted_at: null,
      } as any);

      // Replace permissions
      await Permission.update({ deleted_at: new Date() } as any, {
        where: { user_id: deletedUser.id, deleted_at: null },
      });
      if (data.menu_ids && data.menu_ids.length > 0) {
        await Permission.bulkCreate(
          data.menu_ids.map((menu_id) => ({ user_id: deletedUser.id, menu_id }))
        );
      }

      const restored = await fetchUserWithRelations(deletedUser.id);
      return { success: true, data: restored };
    }

    // Check active user with same mobile in the same company
    const existingMobile = await User.findOne({
      where: { mobile: data.mobile, company_id: data.company_id ?? null },
    });
    if (existingMobile) return { success: false, message: 'Mobile number already in use within this company' };

    // Check email uniqueness (active users only)
    if (data.email) {
      const existingEmail = await User.findOne({
        where: { email: data.email, company_id: data.company_id ?? null },
      });
      if (existingEmail) return { success: false, message: 'Email already in use within this company' };
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

    if (data.menu_ids && Array.isArray(data.menu_ids) && data.menu_ids.length > 0) {
      await Permission.bulkCreate(
        data.menu_ids.map((menu_id) => ({ user_id: user.id, menu_id }))
      );
    }

    const userWithPermissions = await fetchUserWithRelations(user.id);
    return { success: true, data: userWithPermissions };
  } catch (error) {
    console.error('createUser error:', error);
    return { success: false, message: 'Error creating user' };
  }
};

export const getUsers = async (page = 1, limit = 20, userId?: number, roleId: number = 1) => {
  try {
    const offset = (page - 1) * limit;
    const roleData: any = await getRoleDetails(roleId);
    console.log(roleData.data);
    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      distinct: true,
      order: [['id', 'DESC']],
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Role, as: 'role', attributes: ['id', 'type'], where: { level: { [Op.gt]: Number(roleData.data.level) } } },
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'menu_id'],
          include: [{ model: Menu, as: 'menu', attributes: ['id', 'name'] }],
        },
      ],
      attributes: { exclude: ['password'] },
      where: { role_id: { [Op.ne]: 1 }, id: { [Op.ne]: userId } }, // Exclude users without a role
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
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'menu_id'],
          include: [{ model: Menu, as: 'menu', attributes: ['id', 'name'] }],
        },
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

    // Prevent updating to a mobile that is already active on another user in the same company
    if (updates.mobile) {
      const other = await User.findOne({
        where: { mobile: updates.mobile, company_id: user.company_id },
      });
      if (other && other.id !== id) return { success: false, message: 'Mobile already in use within this company' };
    }

    if (updates.email) {
      const other = await User.findOne({
        where: { email: updates.email, company_id: user.company_id },
      });
      if (other && other.id !== id) return { success: false, message: 'Email already in use within this company' };
    }

    // Handle permissions update if menu_ids provided
    if (updates.menu_ids !== undefined) {
      // Soft-delete existing permissions for this user
      await Permission.update({ deleted_at: new Date() } as any, { where: { user_id: id, deleted_at: null } });

      // Add new permissions if menu_ids array is not empty
      if (Array.isArray(updates.menu_ids) && updates.menu_ids.length > 0) {
        const permissions = updates.menu_ids.map((menu_id) => ({
          user_id: id,
          menu_id,
        }));
        await Permission.bulkCreate(permissions);
      }
    }

    // Remove menu_ids from updates object before updating user
    const { menu_ids, ...userUpdates } = updates;

    await user.update(userUpdates as any);

    const updatedUser = await fetchUserWithRelations(id);
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('updateUser error:', error);
    return { success: false, message: 'Error updating user' };
  }
};

export const deleteUser = async (id: number) => {
  try {
    const user = await User.findByPk(id);
    if (!user) return { success: false, message: 'User not found' };

    await user.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'User deleted' };
  } catch (error) {
    console.error('deleteUser error:', error);
    return { success: false, message: 'Error deleting user' };
  }
};

export const getUsersForDropdown = async (companyId: number, roleId?: number) => {
  try {
    const where: any = { company_id: companyId };
    if (typeof roleId !== 'undefined') {
      where.role_id = roleId;
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'role_id'],
      where,
      order: [['name', 'ASC']],
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('getUsersForDropdown error:', error);
    return { success: false, message: 'Error fetching users for dropdown' };
  }
};

export const getDashboardSummary = async (companyId: number) => {
  try {
    const userCompanyInclude = [
      {
        model: User,
        as: 'createdBy',
        attributes: [],
        where: { company_id: companyId },
        required: true,
      },
    ];

    const [totalItems, totalCustomers, statuses, ticketCountByStatusRaw] = await Promise.all([
      Item.count({ include: userCompanyInclude as any }),
      Customer.count({ include: userCompanyInclude as any }),
      TicketStatus.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']],
      }),
      Ticket.count({
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: [],
            required: true,
            include: [
              {
                model: User,
                as: 'createdBy',
                attributes: [],
                where: { company_id: companyId },
                required: true,
              },
            ],
          },
        ],
        group: ['status_id'],
      }),
    ]);

    const countsMap = new Map<number, number>();
    for (const row of ticketCountByStatusRaw as any[]) {
      const statusId = Number(row.status_id);
      const count = Number(row.count ?? 0);
      countsMap.set(statusId, count);
    }

    const ticketCountsByStatus = statuses.map((status: any) => ({
      status_id: status.id,
      status_name: status.name,
      count: countsMap.get(status.id) ?? 0,
    }));

    return {
      success: true,
      data: {
        total_items: totalItems,
        total_customers: totalCustomers,
        ticket_counts_by_status: ticketCountsByStatus,
      },
    };
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return { success: false, message: 'Error fetching dashboard summary' };
  }
};

export const getRoleDetails = async (roleId: number) => {
  try {
    const role = await Role.findByPk(roleId);
    return { success: true, data: role };
  } catch (e) {
    console.error('getUserById error:', e);
    return { success: false, message: 'Error fetching role' };
  }
};
