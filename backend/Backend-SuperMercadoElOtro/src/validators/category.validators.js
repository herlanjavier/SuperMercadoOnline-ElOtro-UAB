import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? null : value));

const booleanFromForm = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: optionalText,
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre no puede estar vacio').optional(),
    description: optionalText,
    isActive: booleanFromForm.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });
