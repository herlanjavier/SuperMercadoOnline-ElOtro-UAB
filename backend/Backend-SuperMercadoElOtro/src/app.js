import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.routes.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  env.FRONTEND_URL,
  ...env.FRONTEND_URLS.split(',').map((origin) => origin.trim()).filter(Boolean),
];

const rateLimitMessage = {
  ok: false,
  message: 'Demasiadas peticiones. Espera unos segundos e intenta nuevamente.',
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
}));
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(express.json());
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register-customer', authLimiter);
app.use('/api', apiLimiter);

app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
