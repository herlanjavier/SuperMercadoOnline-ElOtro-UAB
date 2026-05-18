import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/config/supabase.js', async () => import('../setup/mockSupabase.js'));

const { resetMockSupabase, setMockRole } = await import('../setup/mockSupabase.js');
const { default: app } = await import('../../src/app.js');

describe('orders integration', () => {
  beforeEach(() => resetMockSupabase());

  test('POST /api/orders sin token responde 401', async () => {
    const response = await request(app).post('/api/orders').send({});

    expect(response.status).toBe(401);
  });

  test('POST /api/orders con body sin items responde 400', async () => {
    setMockRole('customer');
    const response = await request(app).post('/api/orders').set('Authorization', 'Bearer token').send({});

    expect(response.status).toBe(400);
  });

  test('POST /api/orders con rol admin responde 403', async () => {
    setMockRole('admin');
    const response = await request(app).post('/api/orders').set('Authorization', 'Bearer token').send({
      items: [{ productId: '00000000-0000-4000-8000-000000000010', quantity: 1 }],
    });

    expect(response.status).toBe(403);
  });

  test('GET /api/orders/my con customer mock responde 200', async () => {
    setMockRole('customer');
    const response = await request(app).get('/api/orders/my').set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
