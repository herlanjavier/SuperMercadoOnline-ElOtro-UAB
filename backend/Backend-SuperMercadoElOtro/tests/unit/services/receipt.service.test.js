import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/supabase.js', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        gte: () => ({
          lt: () => ({
            like: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

const { buildReceiptData, generateReceiptNumber } = await import('../../../src/services/receipt.service.js');

describe('receipt service', () => {
  test('genera formato de receipt number correcto', async () => {
    const receiptNumber = await generateReceiptNumber();

    expect(receiptNumber).toMatch(/^REC-\d{8}-0001$/);
  });

  test('prepara datos de recibo con titulo y nota', () => {
    const receipt = buildReceiptData({
      receiptNumber: 'REC-20260513-0001',
      soldAt: '2026-05-13T10:00:00.000Z',
      customer: {},
      seller: {},
      items: [],
      total: 100,
    });

    expect(receipt.title).toBe('Recibo / Nota de venta');
    expect(receipt.note).toBe('No válido como factura');
  });
});
