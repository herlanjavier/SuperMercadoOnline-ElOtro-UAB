import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const pad = (value) => String(value).padStart(2, '0');

const getDateKey = (date = new Date()) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

export const generateReceiptNumber = async () => {
  const now = new Date();
  const dateKey = getDateKey(now);
  const prefix = `REC-${dateKey}-`;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabaseAdmin
    .from('sales')
    .select('receipt_number')
    .gte('sold_at', start.toISOString())
    .lt('sold_at', end.toISOString())
    .like('receipt_number', `${prefix}%`)
    .order('receipt_number', { ascending: false })
    .limit(1);

  if (error) {
    throw new AppError(error.message, 400);
  }

  const lastNumber = data[0]?.receipt_number?.split('-').at(-1);
  const nextNumber = Number(lastNumber || 0) + 1;

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

export const buildReceiptData = (sale) => ({
  title: 'Recibo / Nota de venta',
  note: 'No válido como factura',
  receiptNumber: sale.receiptNumber,
  soldAt: sale.soldAt,
  customer: sale.customer,
  seller: sale.seller,
  items: sale.items,
  total: sale.total,
});
