import { getStockStatus } from '../../../src/utils/stockStatus.js';

describe('stockStatus', () => {
  test('stock <= 0 => out_of_stock', () => {
    expect(getStockStatus({ stock: 0, criticalStock: 2, minStock: 5 })).toBe('out_of_stock');
  });

  test('stock <= criticalStock => critical', () => {
    expect(getStockStatus({ stock: 2, criticalStock: 2, minStock: 5 })).toBe('critical');
  });

  test('stock <= minStock => low', () => {
    expect(getStockStatus({ stock: 5, criticalStock: 2, minStock: 5 })).toBe('low');
  });

  test('stock normal => normal', () => {
    expect(getStockStatus({ stock: 10, criticalStock: 2, minStock: 5 })).toBe('normal');
  });
});
