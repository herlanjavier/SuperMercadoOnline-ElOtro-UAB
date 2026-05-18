import { createOrderSchema } from '../../../src/validators/order.validators.js';

describe('order validators', () => {
  test('create order valido con items', () => {
    const payload = createOrderSchema.parse({
      items: [{ productId: '00000000-0000-4000-8000-000000000010', quantity: 2 }],
    });

    expect(payload.items[0].quantity).toBe(2);
  });

  test('create order falla sin items', () => {
    expect(() => createOrderSchema.parse({ items: [] })).toThrow();
  });

  test('create order falla con quantity 0', () => {
    expect(() =>
      createOrderSchema.parse({
        items: [{ productId: '00000000-0000-4000-8000-000000000010', quantity: 0 }],
      }),
    ).toThrow();
  });

  test('create order falla con productId invalido', () => {
    expect(() => createOrderSchema.parse({ items: [{ productId: 'bad-id', quantity: 1 }] })).toThrow();
  });
});
