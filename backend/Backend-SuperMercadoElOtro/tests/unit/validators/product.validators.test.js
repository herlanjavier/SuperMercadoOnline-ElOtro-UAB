import { createProductSchema, updateProductSchema } from '../../../src/validators/product.validators.js';

const product = {
  name: 'Arroz',
  description: 'Arroz premium',
  categoryId: '00000000-0000-4000-8000-000000000010',
  price: '12.50',
  stock: '10',
  minStock: '3',
  criticalStock: '1',
  expirationDate: '2026-12-31',
};

describe('product validators', () => {
  test('create product valido', () => {
    expect(createProductSchema.parse(product)).toMatchObject({ name: 'Arroz', price: 12.5 });
  });

  test('price negativo falla', () => {
    expect(() => createProductSchema.parse({ ...product, price: '-1' })).toThrow();
  });

  test('stock negativo falla', () => {
    expect(() => createProductSchema.parse({ ...product, stock: '-1' })).toThrow();
  });

  test('categoryId invalido falla', () => {
    expect(() => createProductSchema.parse({ ...product, categoryId: 'bad-id' })).toThrow();
  });

  test('update product permite campos parciales', () => {
    expect(updateProductSchema.parse({ price: '15' })).toMatchObject({ price: 15 });
  });
});
