import { inventoryReportQuerySchema, salesReportQuerySchema } from '../../../src/validators/report.validators.js';

describe('report validators', () => {
  test('query con date valido', () => {
    expect(salesReportQuerySchema.parse({ date: '2026-05-13' }).date).toBe('2026-05-13');
  });

  test('query con month valido', () => {
    expect(salesReportQuerySchema.parse({ month: '2026-05' }).month).toBe('2026-05');
  });

  test('query con from/to valido', () => {
    const query = salesReportQuerySchema.parse({ from: '2026-05-01', to: '2026-05-31' });
    expect(query.from).toBe('2026-05-01');
  });

  test('falla si mezcla date y month', () => {
    expect(() => salesReportQuerySchema.parse({ date: '2026-05-13', month: '2026-05' })).toThrow();
  });

  test('falla si from > to', () => {
    expect(() => salesReportQuerySchema.parse({ from: '2026-06-01', to: '2026-05-01' })).toThrow();
  });

  test('falla si stockStatus invalido', () => {
    expect(() => inventoryReportQuerySchema.parse({ stockStatus: 'bad' })).toThrow();
  });
});
