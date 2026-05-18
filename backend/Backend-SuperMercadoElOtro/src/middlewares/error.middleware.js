import { env } from '../config/env.js';

const getMulterMessage = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return 'El archivo no debe superar el tamano maximo permitido.';
  }

  return 'No se pudo procesar el archivo.';
};

export const errorMiddleware = (err, _req, res, _next) => {
  const isZodError = err.name === 'ZodError';
  const isMulterError = err.name === 'MulterError';
  const statusCode = isZodError || isMulterError ? 400 : err.statusCode || 500;
  const message = isZodError
    ? err.errors.map((error) => error.message).join(', ')
    : isMulterError
      ? getMulterMessage(err)
    : err.isOperational
      ? err.message
      : 'Error interno del servidor';

  if (env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    ok: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
