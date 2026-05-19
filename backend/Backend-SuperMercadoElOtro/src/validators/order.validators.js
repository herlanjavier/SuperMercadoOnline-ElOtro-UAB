import { z } from 'zod';

export const orderStatuses = ['pending_payment', 'confirmed', 'ready_for_pickup', 'delivered', 'cancelled'];

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), 'La fecha no es valida');

const hourSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:mm');

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('El producto no es valido'),
        quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
      }),
    )
    .min(1, 'Debes agregar al menos un producto'),
  deliveryAddress: optionalText,
  deliveryReference: optionalText,
});

export const orderQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  from: optionalDate,
  to: optionalDate,
});

export const adminOrderQuerySchema = orderQuerySchema.extend({
  customerId: z.string().uuid('El cliente no es valido').optional(),
  search: z.string().trim().optional(),
});

export const updateBusinessHourSchema = z
  .object({
    opensAt: hourSchema,
    closesAt: hourSchema,
    isOpen: z.boolean(),
  })
  .refine((data) => data.opensAt < data.closesAt, {
    message: 'opensAt debe ser menor que closesAt',
  });

export const dayOfWeekSchema = z.coerce.number().int().min(0).max(6);

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
});

const optionalTextKeepNull = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? null : value));

export const deliveryPersonSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre del repartidor es requerido'),
  lastName: z.string().trim().min(1, 'El apellido del repartidor es requerido'),
  ci: optionalTextKeepNull,
  vehicleType: optionalTextKeepNull,
  plate: optionalTextKeepNull,
  phone: optionalTextKeepNull,
});
