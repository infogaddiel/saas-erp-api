import { Request } from 'express';
export const getCompanyCode = (req: Request): string | null => {
  const code = req.user?.company_code;
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z0-9]{3}$/.test(normalized) ? normalized : null;
};
