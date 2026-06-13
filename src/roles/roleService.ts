import { Role, User } from '../models';

const isSuperAdmin = async (userId: number, companyId: number): Promise<boolean> => {
  const user = await User.findOne({
    where: { id: userId, company_id: companyId },
    include: [{ model: Role, as: 'role', attributes: ['level'] }],
    attributes: ['id'],
  });
  const role = (user as any)?.role;
  return role?.level === 1;
};

export const createDefaultRoles = async (companyId: number) => {
  const defaults = [
    { type: 'Super Admin', level: 1 },
    { type: 'Admin', level: 2 },
    { type: 'Staff', level: 3 },
  ];

  const created: Role[] = [];
  for (const r of defaults) {
    const [role] = await Role.findOrCreate({
      where: { type: r.type, company_id: companyId },
      defaults: { ...r, company_id: companyId, is_active: true },
    });
    created.push(role);
  }
  return created;
};

export const getRoles = async (companyId: number) => {
  try {
    const roles = await Role.findAll({
      where: { company_id: companyId },
      order: [['level', 'ASC']],
    });
    return { success: true, data: roles };
  } catch (error) {
    console.error('getRoles error:', error);
    return { success: false, message: 'Error fetching roles' };
  }
};

export const createRole = async (
  data: { type: string; level: number; is_active?: boolean },
  userId: number,
  companyId: number
) => {
  try {
    const superAdmin = await isSuperAdmin(userId, companyId);
    if (!superAdmin) return { success: false, message: 'Only Super Admin can create roles' };

    const existing = await Role.findOne({ where: { type: data.type, company_id: companyId } });
    if (existing) return { success: false, message: 'Role with this name already exists' };

    const role = await Role.create({
      type: data.type,
      level: data.level,
      is_active: data.is_active ?? true,
      company_id: companyId,
    } as any);

    return { success: true, data: role };
  } catch (error) {
    console.error('createRole error:', error);
    return { success: false, message: 'Error creating role' };
  }
};

export const updateRole = async (
  id: number,
  updates: { type?: string; level?: number; is_active?: boolean },
  userId: number,
  companyId: number
) => {
  try {
    const superAdmin = await isSuperAdmin(userId, companyId);
    if (!superAdmin) return { success: false, message: 'Only Super Admin can update roles' };

    const role = await Role.findOne({ where: { id, company_id: companyId } });
    if (!role) return { success: false, message: 'Role not found' };

    if (role.level === 1) return { success: false, message: 'Super Admin role cannot be modified' };

    await role.update(updates as any);
    return { success: true, data: role };
  } catch (error) {
    console.error('updateRole error:', error);
    return { success: false, message: 'Error updating role' };
  }
};

export const deleteRole = async (id: number, userId: number, companyId: number) => {
  try {
    const superAdmin = await isSuperAdmin(userId, companyId);
    if (!superAdmin) return { success: false, message: 'Only Super Admin can delete roles' };

    const role = await Role.findOne({ where: { id, company_id: companyId } });
    if (!role) return { success: false, message: 'Role not found' };

    if (role.level === 1) return { success: false, message: 'Super Admin role cannot be deleted' };

    const usersWithRole = await User.count({ where: { role_id: id } });
    if (usersWithRole > 0) return { success: false, message: 'Cannot delete role assigned to users' };

    await role.destroy();
    return { success: true, message: 'Role deleted' };
  } catch (error) {
    console.error('deleteRole error:', error);
    return { success: false, message: 'Error deleting role' };
  }
};
