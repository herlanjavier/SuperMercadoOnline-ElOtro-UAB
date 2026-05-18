import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? null : value));

const requiredText = (message) => z.string().trim().min(1, message);

const numberFromForm = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
}, z.number().finite());

const integerFromForm = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
}, z.number().int());

const booleanFromForm = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? null : value))
  .refine((value) => {
    if (value === undefined || value === null) return true;
    return !Number.isNaN(Date.parse(value));
  }, 'La fecha de vencimiento no es valida');

export const productQuerySchema = z.object({
  categoryId: z.string().trim().min(1).optional(),
  search: z.string().trim().optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  onlyAvailable: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  lowStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  criticalStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const createProductSchema = z.object({
  name: requiredText('El nombre es requerido'),
  description: optionalText,
  categoryId: z.string().uuid('La categoria no es valida'),
  price: numberFromForm.refine((value) => value >= 0, 'El precio debe ser mayor o igual a 0'),
  stock: integerFromForm.refine((value) => value >= 0, 'El stock debe ser mayor o igual a 0'),
  minStock: integerFromForm.refine((value) => value >= 0, 'El stock minimo debe ser mayor o igual a 0'),
  criticalStock: integerFromForm.refine((value) => value >= 0, 'El stock critico debe ser mayor o igual a 0'),
  expirationDate: optionalDate,
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre no puede estar vacio').optional(),
    description: optionalText,
    categoryId: z.string().uuid('La categoria no es valida').optional(),
    price: numberFromForm.refine((value) => value >= 0, 'El precio debe ser mayor o igual a 0').optional(),
    stock: integerFromForm.refine((value) => value >= 0, 'El stock debe ser mayor o igual a 0').optional(),
    minStock: integerFromForm.refine((value) => value >= 0, 'El stock minimo debe ser mayor o igual a 0').optional(),
    criticalStock: integerFromForm
      .refine((value) => value >= 0, 'El stock critico debe ser mayor o igual a 0')
      .optional(),
    expirationDate: optionalDate,
    isActive: booleanFromForm.optional(),
  });
