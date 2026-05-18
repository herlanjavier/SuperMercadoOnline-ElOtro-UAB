import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? null : value));

const booleanFromQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

const booleanFromBody = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const productIdsSchema = z
  .array(z.string().uuid('Cada producto debe tener un id valido'))
  .optional()
  .transform((value) => (value ? [...new Set(value)] : value));

export const supplierQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeInactive: booleanFromQuery,
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  phone: optionalText,
  description: optionalText,
  productIds: productIdsSchema,
});

export const updateSupplierSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre no puede estar vacio').optional(),
    phone: optionalText,
    description: optionalText,
    isActive: booleanFromBody.optional(),
    productIds: productIdsSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export const supplierProductsSchema = z.object({
  productIds: z
    .array(z.string().uuid('Cada producto debe tener un id valido'))
    .min(1, 'Debes enviar al menos un producto')
    .transform((value) => [...new Set(value)]),
});
