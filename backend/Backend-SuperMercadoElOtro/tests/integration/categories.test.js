import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/config/supabase.js', async () => import('../setup/mockSupabase.js'));

const { mockState, resetMockSupabase, setMockRole } = await import('../setup/mockSupabase.js');
const { default: app } = await import('../../src/app.js');

describe('categories integration', () => {
  beforeEach(() => resetMockSupabase());

  test('GET /api/categories sin token responde 200 y no devuelve inactivas aunque pidan includeInactive', async () => {
    mockState.tables.categories = [
      { id: 'cat-active', name: 'Alimentos', description: null, is_active: true },
      { id: 'cat-inactive', name: 'Oculta', description: null, is_active: false },
    ];

    const response = await request(app).get('/api/categories?includeInactive=true');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.map((category) => category.id)).toEqual(['cat-active']);
  });

  test('GET /api/categories con admin puede usar includeInactive', async () => {
    setMockRole('admin');
    mockState.tables.categories = [
      { id: 'cat-active', name: 'Alimentos', description: null, is_active: true },
      { id: 'cat-inactive', name: 'Oculta', description: null, is_active: false },
    ];

    const response = await request(app).get('/api/categories?includeInactive=true').set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.data.map((category) => category.id)).toEqual(['cat-active', 'cat-inactive']);
  });
});
