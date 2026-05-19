import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date debe tener formato YYYY-MM-DD');
const monthOnly = z.string().regex(/^\d{4}-\d{2}$/, 'month debe tener formato YYYY-MM');

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), 'La fecha no es valida');

const includeInactive = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

const periodRules = (schema) =>
  schema
    .refine((data) => !(data.date && data.month), {
      message: 'No puedes combinar date con month',
    })
    .refine((data) => !(data.date && (data.from || data.to)), {
      message: 'No puedes combinar date con from/to',
    })
    .refine((data) => !(data.month && (data.from || data.to)), {
      message: 'No puedes combinar month con from/to',
    })
    .refine((data) => !(data.from && data.to) || new Date(data.from) <= new Date(data.to), {
      message: 'from no puede ser mayor que to',
    });

const basePeriodSchema = z.object({
  date: dateOnly.optional(),
  from: optionalDate,
  to: optionalDate,
  month: monthOnly.optional(),
});

export const salesReportQuerySchema = periodRules(
  basePeriodSchema.extend({
    customerId: z.string().uuid('El cliente no es valido').optional(),
    soldBy: z.string().uuid('El vendedor no es valido').optional(),
  }),
);

export const inventoryReportQuerySchema = periodRules(
  basePeriodSchema.extend({
    categoryId: z.string().uuid('La categoria no es valida').optional(),
    stockStatus: z.enum(['normal', 'low', 'critical', 'out_of_stock']).optional(),
    includeInactive,
  }),
);

export const topProductsQuerySchema = periodRules(
  basePeriodSchema.extend({
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
);

export const salesByDayQuerySchema = periodRules(basePeriodSchema);
