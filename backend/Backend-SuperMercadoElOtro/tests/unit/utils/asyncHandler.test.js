import { jest } from '@jest/globals';
import { asyncHandler } from '../../../src/utils/asyncHandler.js';

describe('asyncHandler', () => {
  test('ejecuta funcion async correctamente', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    const handler = jest.fn().mockResolvedValue(undefined);

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('pasa errores a next', async () => {
    const error = new Error('boom');
    const next = jest.fn();

    await asyncHandler(async () => {
      throw error;
    })({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
