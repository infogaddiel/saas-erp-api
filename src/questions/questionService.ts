import { Question } from '../models';

interface CreateQuestionInput {
  question: string;
  type?: string | null;
}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

export const createQuestion = async (data: CreateQuestionInput) => {
  try {
    const created = await Question.create({
      question: data.question.trim(),
      type: normalizeOptionalText(data.type),
    });

    return { success: true, data: created };
  } catch (error) {
    console.error('createQuestion error:', error);
    return { success: false, message: 'Error creating question' };
  }
};

export const updateQuestion = async (id: number, data: { question: string; type?: string | null; }) => {
  try {
    // 1. Find the question by its primary key
    const questionToUpdate = await Question.findByPk(id);

    if (!questionToUpdate) {
      return { success: false, message: 'Question not found' };
    }

    // 2. Perform the update with normalized inputs
    await questionToUpdate.update({
      question: data.question.trim(),
      type: normalizeOptionalText(data.type),
    });

    return { success: true, data: questionToUpdate };
  } catch (error) {
    console.error('updateQuestion error:', error);
    return { success: false, message: 'Error updating question' };
  }
};

export const getQuestions = async () => {
  try {
    const rows = await Question.findAll({
      where: { is_deleted: false },
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error('getQuestions error:', error);
    return { success: false, message: 'Error fetching questions' };
  }
};

export const deleteQuestion = async (id: number) => {
  try {
    const question = await Question.findByPk(id);
    if (!question) return { success: false, message: 'Question not found' };

    await question.update({ is_deleted: true } as any);
    return { success: true, message: 'Question deleted' };
  } catch (error) {
    console.error('deleteQuestion error:', error);
    return { success: false, message: 'Error deleting question' };
  }
};
