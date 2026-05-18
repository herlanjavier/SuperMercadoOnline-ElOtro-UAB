import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .refine((value) => value === undefined || value.length > 0, {
    message: 'No debe estar vacio',
  });

export const registerCustomerSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
  ci: optionalText,
  phone: optionalText,
  address: optionalText,
  addressReference: optionalText,
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
});
