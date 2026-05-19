import { AppError } from '../../../src/utils/AppError.js';

describe('AppError', () => {
  test('crea error con message y statusCode', () => {
    const error = new AppError('Error controlado', 400);

    expect(error.message).toBe('Error controlado');
    expect(error.statusCode).toBe(400);
  });

  test('isOperational es true', () => {
    const error = new AppError('Error controlado');

    expect(error.isOperational).toBe(true);
  });
});
