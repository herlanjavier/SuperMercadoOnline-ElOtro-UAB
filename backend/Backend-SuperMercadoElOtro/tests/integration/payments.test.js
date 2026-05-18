import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/config/supabase.js', async () => import('../setup/mockSupabase.js'));

const { resetMockSupabase, setMockRole } = await import('../setup/mockSupabase.js');
const { default: app } = await import('../../src/app.js');

describe('payments integration', () => {
  beforeEach(() => resetMockSupabase());

  test('PATCH confirm-qr sin token responde 401', async () => {
    const response = await request(app).patch('/api/payments/orders/order-1/confirm-qr').send({});

    expect(response.status).toBe(401);
  });

  test('PATCH confirm-qr con rol customer responde 403', async () => {
    setMockRole('customer');
    const response = await request(app)
      .patch('/api/payments/orders/order-1/confirm-qr')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(403);
  });

  test('PATCH confirm-qr con admin y pedido invalido responde error controlado', async () => {
    setMockRole('admin');
    const response = await request(app)
      .patch('/api/payments/orders/order-1/confirm-qr')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
  });
});
