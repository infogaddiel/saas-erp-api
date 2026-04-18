import { UserFeedback, User, Question } from '../models';

interface CreateUserFeedbackInput {
  user_id: number;
  question_id: number;
  feedback: string;
}

interface UpdateUserFeedbackInput extends Partial<CreateUserFeedbackInput> {}

const feedbackInclude = [
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'mobile'] },
  { model: Question, as: 'question', attributes: ['id', 'question', 'type'] },
];

export const createUserFeedback = async (data: CreateUserFeedbackInput) => {
  try {
    const user = await User.findByPk(data.user_id, { attributes: ['id'] });
    if (!user) return { success: false, message: 'User not found', statusCode: 404 };

    const question = await Question.findByPk(data.question_id, { attributes: ['id'] });
    if (!question) return { success: false, message: 'Question not found', statusCode: 404 };

    const created = await UserFeedback.create({
      user_id: data.user_id,
      question_id: data.question_id,
      feedback: data.feedback.trim(),
    });

    const withAssociations = await UserFeedback.findByPk(created.id, { include: feedbackInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createUserFeedback error:', error);
    return { success: false, message: 'Error creating user feedback' };
  }
};

export const getUserFeedbacks = async (
  page = 1,
  limit = 20,
  filters?: { user_id?: number; question_id?: number }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.user_id != null) where.user_id = filters.user_id;
    if (filters?.question_id != null) where.question_id = filters.question_id;

    const { count, rows } = await UserFeedback.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: feedbackInclude,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: {
        userFeedbacks: rows,
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
    console.error('getUserFeedbacks error:', error);
    return { success: false, message: 'Error fetching user feedbacks' };
  }
};

export const updateUserFeedback = async (id: number, updates: UpdateUserFeedbackInput) => {
  try {
    const record = await UserFeedback.findByPk(id);
    if (!record) return { success: false, message: 'User feedback not found' };

    if (updates.user_id != null) {
      const user = await User.findByPk(updates.user_id, { attributes: ['id'] });
      if (!user) return { success: false, message: 'User not found', statusCode: 404 };
    }

    if (updates.question_id != null) {
      const question = await Question.findByPk(updates.question_id, { attributes: ['id'] });
      if (!question) return { success: false, message: 'Question not found', statusCode: 404 };
    }

    const payload: any = { ...updates };
    if (payload.feedback !== undefined) payload.feedback = String(payload.feedback).trim();

    await record.update(payload);
    const withAssociations = await UserFeedback.findByPk(id, { include: feedbackInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updateUserFeedback error:', error);
    return { success: false, message: 'Error updating user feedback' };
  }
};

export const deleteUserFeedback = async (id: number) => {
  try {
    const record = await UserFeedback.findByPk(id);
    if (!record) return { success: false, message: 'User feedback not found' };

    await record.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'User feedback deleted' };
  } catch (error) {
    console.error('deleteUserFeedback error:', error);
    return { success: false, message: 'Error deleting user feedback' };
  }
};
