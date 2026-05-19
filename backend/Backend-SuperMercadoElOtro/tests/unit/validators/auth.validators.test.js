import { loginSchema, registerCustomerSchema } from '../../../src/validators/auth.validators.js';

const validCustomer = {
  email: 'cliente@test.com',
  password: 'Password123',
  firstName: 'Juan',
  lastName: 'Perez',
  ci: '1234567',
  phone: '70000000',
  address: 'Zona Central',
  addressReference: 'Referencia',
};

describe('auth validators', () => {
  test('register customer valido', () => {
    expect(registerCustomerSchema.parse(validCustomer)).toMatchObject({ email: validCustomer.email });
  });

  test('register customer invalido por email incorrecto', () => {
    expect(() => registerCustomerSchema.parse({ ...validCustomer, email: 'mal' })).toThrow();
  });

  test('password menor a 8 caracteres falla', () => {
    expect(() => registerCustomerSchema.parse({ ...validCustomer, password: '1234567' })).toThrow();
  });

  test('login valido', () => {
    expect(loginSchema.parse({ email: 'user@test.com', password: 'Password123' })).toMatchObject({
      email: 'user@test.com',
    });
  });

  test('login invalido si falta password', () => {
    expect(() => loginSchema.parse({ email: 'user@test.com' })).toThrow();
  });
});
