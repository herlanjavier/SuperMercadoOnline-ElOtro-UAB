import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/config/supabase.js', async () => import('../setup/mockSupabase.js'));

const { mockState, resetMockSupabase, setMockRole } = await import('../setup/mockSupabase.js');
const { default: app } = await import('../../src/app.js');

describe('products integration', () => {
  beforeEach(() => resetMockSupabase());

  test('GET /api/products sin token responde 200 y solo productos activos disponibles', async () => {
    mockState.tables.products = [
      {
        id: 'active-product',
        name: 'Arroz',
        description: 'Grano',
        price: 12,
        stock: 4,
        min_stock: 2,
        critical_stock: 1,
        is_active: true,
        categories: { id: 'cat-1', name: 'Alimentos' },
      },
      {
        id: 'inactive-product',
        name: 'Producto oculto',
        description: null,
        price: 10,
        stock: 5,
        min_stock: 2,
        critical_stock: 1,
        is_active: false,
        categories: { id: 'cat-1', name: 'Alimentos' },
      },
      {
        id: 'empty-product',
        name: 'Sin stock',
        description: null,
        price: 10,
        stock: 0,
        min_stock: 2,
        critical_stock: 1,
        is_active: true,
        categories: { id: 'cat-1', name: 'Alimentos' },
      },
    ];

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.data.map((product) => product.id)).toEqual(['active-product', 'empty-product']);

    const availableResponse = await request(app).get('/api/products?onlyAvailable=true');

    expect(availableResponse.status).toBe(200);
    expect(availableResponse.body.data.map((product) => product.id)).toEqual(['active-product']);
  });

  test('GET /api/products anonimo ignora includeInactive y filtros de stock administrativos', async () => {
    mockState.tables.products = [
      {
        id: 'normal-product',
        name: 'Normal',
        description: null,
        price: 10,
        stock: 10,
        min_stock: 2,
        critical_stock: 1,
        is_active: true,
        categories: null,
      },
      {
        id: 'low-product',
        name: 'Bajo stock',
        description: null,
        price: 10,
        stock: 1,
        min_stock: 2,
        critical_stock: 1,
        is_active: true,
        categories: null,
      },
      {
        id: 'inactive-product',
        name: 'Inactivo',
        description: null,
        price: 10,
        stock: 1,
        min_stock: 2,
        critical_stock: 1,
        is_active: false,
        categories: null,
      },
    ];

    const response = await request(app).get('/api/products?includeInactive=true&lowStock=true&criticalStock=true');

    expect(response.status).toBe(200);
    expect(response.body.data.map((product) => product.id)).toEqual(['normal-product', 'low-product']);
  });

  test('POST /api/products sin token responde 401', async () => {
    const response = await request(app).post('/api/products').send({});

    expect(response.status).toBe(401);
  });

  test('POST /api/products con rol customer responde 403', async () => {
    setMockRole('customer');
    const response = await request(app).post('/api/products').set('Authorization', 'Bearer token').send({});

    expect(response.status).toBe(403);
  });

  test('GET /api/products con token mock valido responde 200', async () => {
    setMockRole('customer');
    const response = await request(app).get('/api/products').set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
