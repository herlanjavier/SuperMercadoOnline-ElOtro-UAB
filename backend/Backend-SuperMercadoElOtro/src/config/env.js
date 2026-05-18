import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_PUBLISHABLE_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('product-images'),
  SUPABASE_PAYMENT_PROOFS_BUCKET: z.string().min(1).default('payment-proofs'),
  FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL valida').default('http://localhost:5173'),
  FRONTEND_URLS: z.string().default(''),
  BUSINESS_TIME_ZONE: z.string().min(1).default('America/La_Paz'),
}).superRefine((value, ctx) => {
  if (value.SUPABASE_URL && !z.string().url().safeParse(value.SUPABASE_URL).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SUPABASE_URL'],
      message: 'SUPABASE_URL debe ser una URL valida',
    });
  }

  if (value.NODE_ENV === 'production') {
    for (const key of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
      if (!value[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} es requerida en produccion`,
        });
      }
    }
  }

  if (value.FRONTEND_URLS) {
    const invalidUrl = value.FRONTEND_URLS
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .find((url) => !z.string().url().safeParse(url).success);

    if (invalidUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URLS'],
        message: `FRONTEND_URLS contiene una URL invalida: ${invalidUrl}`,
      });
    }
  }

  try {
    new Intl.DateTimeFormat('es-BO', { timeZone: value.BUSINESS_TIME_ZONE }).format(new Date());
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['BUSINESS_TIME_ZONE'],
      message: 'BUSINESS_TIME_ZONE debe ser una zona horaria valida',
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Variables de entorno invalidas:');
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
