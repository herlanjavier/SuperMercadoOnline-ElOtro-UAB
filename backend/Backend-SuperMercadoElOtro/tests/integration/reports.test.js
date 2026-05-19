import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/config/supabase.js', async () => import('../setup/mockSupabase.js'));

const { resetMockSupabase, setMockRole } = await import('../setup/mockSupabase.js');
const { default: app } = await import('../../src/app.js');

describe('reports integration', () => {
  beforeEach(() => resetMockSupabase());

  test('GET /api/reports/sales sin token responde 401', async () => {
    const response = await request(app).get('/api/reports/sales');

    expect(response.status).toBe(401);
  });

  test('GET /api/reports/sales con customer responde 403', async () => {
    setMockRole('customer');
    const response = await request(app).get('/api/reports/sales').set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
  });

  test('GET /api/reports/sales con admin responde 200', async () => {
    setMockRole('admin');
    const response = await request(app).get('/api/reports/sales').set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
