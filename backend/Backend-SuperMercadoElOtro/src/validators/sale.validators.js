import { z } from 'zod';

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), 'La fecha no es valida');

export const saleQuerySchema = z.object({
  from: optionalDate,
  to: optionalDate,
  customerId: z.string().uuid('El cliente no es valido').optional(),
  soldBy: z.string().uuid('El vendedor no es valido').optional(),
  search: z.string().trim().optional(),
});
