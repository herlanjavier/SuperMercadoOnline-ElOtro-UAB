import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? null : value));

const nullableUuid = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return null;
  return value;
}, z.string().uuid('El id no es valido').nullable());

const numberFromBody = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
}, z.number().finite());

const integerFromBody = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
}, z.number().int());

const booleanFromQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value === 'true';
  });

const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), 'La fecha no es valida');

export const createInventoryEntrySchema = z.object({
  productId: z.string().uuid('El producto es requerido'),
  supplierId: nullableUuid.optional().default(null),
  quantityReceived: integerFromBody.refine((value) => value > 0, 'La cantidad recibida debe ser mayor a 0'),
  expectedQuantity: integerFromBody
    .refine((value) => value >= 0, 'La cantidad esperada debe ser mayor o igual a 0')
    .nullable()
    .optional(),
  totalCost: numberFromBody
    .refine((value) => value >= 0, 'El costo total debe ser mayor o igual a 0')
    .optional()
    .default(0),
  receivedAt: optionalDateTime,
  notes: optionalText,
});

export const inventoryEntryQuerySchema = z.object({
  productId: z.string().uuid('El producto no es valido').optional(),
  supplierId: z.string().uuid('El proveedor no es valido').optional(),
  date: optionalDateTime,
  from: optionalDateTime,
  to: optionalDateTime,
  search: z.string().trim().optional(),
});

export const lowStockQuerySchema = z.object({
  type: z.enum(['low', 'critical']).optional(),
  includeOutOfStock: booleanFromQuery,
});

export const notificationQuerySchema = z.object({
  isRead: booleanFromQuery,
  type: z.enum(['low', 'critical']).optional(),
});
