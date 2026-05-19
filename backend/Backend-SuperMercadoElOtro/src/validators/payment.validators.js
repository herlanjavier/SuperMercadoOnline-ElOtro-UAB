import { z } from 'zod';

export const confirmQrPaymentSchema = z.object({
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});
