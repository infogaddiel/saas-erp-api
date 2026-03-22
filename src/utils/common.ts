import { Request } from 'express';
import moment from 'moment';
export const getCompanyCode = (req: Request): string | null => {
  const code = req.user?.company_code;
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z0-9]{3}$/.test(normalized) ? normalized : null;
};

export const formatDateToDMYISO = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;

  // 1. Parse the date. 
  // We provide an array of formats to handle both ISO (from Ionic) 
  // and DD-MM-YYYY (from your Excel logic).
  const date = moment(dateStr, ['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ssZ'], true);

  // 2. Fallback if strict parsing fails
  if (!date.isValid()) {
    const fallback = moment(dateStr); // Try flexible parsing
    return fallback.isValid() ? fallback.format('YYYY-MM-DD') : null;
  }
  // 3. Return the string format the API expects
  return date.format('YYYY-MM-DD');
};
