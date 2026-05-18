import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'sales_manager', 'customer']);

const optionalText = z
  .string()
  .trim()
  .optional()
  .refine((value) => value === undefined || value.length > 0, {
    message: 'No debe estar vacio',
  });

export const createSalesManagerSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  ci: optionalText,
  phone: optionalText,
  address: optionalText,
});

export const listUsersQuerySchema = z.object({
  role: userRoleSchema.optional(),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === 'true';
    }),
});

export const updateUserSchema = z
  .object({
    firstName: optionalText,
    lastName: optionalText,
    ci: optionalText,
    phone: optionalText,
    address: optionalText,
    addressReference: optionalText,
    role: userRoleSchema.optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });
