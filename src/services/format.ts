import { appConfig } from '../config/appConfig';
export function formatCurrency(amount: number, code?: string): string {
  const currency = code || appConfig.localCurrencyCode;
  if (!currency) return `${new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} LCY`;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function lineSubtotal(quantity: number, cost: number, discount: number) {
  return money(quantity * cost - money(quantity * cost * discount / 100));
}

export const isVendorBlocked = (value: string) => !['', '_x0020_'].includes(value.trim());
