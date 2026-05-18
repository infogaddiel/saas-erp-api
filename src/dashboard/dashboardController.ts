import { Request, Response } from 'express';
import { getGeneralOverviewDashboard } from './dashboardService';

const getCompanyId = (req: Request): number | null => {
  const rawCompanyId = req.user?.company_id;
  if (rawCompanyId == null) return null;
  const parsed = parseInt(String(rawCompanyId), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const generalOverview = async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res.status(400).json({ success: false, message: 'User company not found' });
    }

    const result = await getGeneralOverviewDashboard(companyId);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('General overview dashboard controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
