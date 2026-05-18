import request from 'supertest';
import app from '../../src/app.js';

describe('health integration', () => {
  test('GET /api/health responde 200 y ok true', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
