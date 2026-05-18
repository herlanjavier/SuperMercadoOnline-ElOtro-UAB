import { canTransitionOrderStatus } from '../../../src/utils/orderStatus.js';
import { calculateItemSubtotal, calculateOrderTotal } from '../../../src/utils/orderTotals.js';

describe('order helpers', () => {
  test('calcula subtotal item', () => {
    expect(calculateItemSubtotal({ quantity: 2, unitPrice: 10 })).toBe(20);
  });

  test('calcula total de pedido', () => {
    expect(calculateOrderTotal([{ quantity: 2, unitPrice: 10 }, { quantity: 1, unitPrice: 5 }])).toBe(25);
  });

  test('pending_payment -> confirmed no permitido por endpoint normal', () => {
    expect(canTransitionOrderStatus('pending_payment', 'confirmed')).toBe(false);
  });

  test('confirmed -> ready_for_pickup permitido', () => {
    expect(canTransitionOrderStatus('confirmed', 'ready_for_pickup')).toBe(true);
  });

  test('ready_for_pickup -> delivered permitido', () => {
    expect(canTransitionOrderStatus('ready_for_pickup', 'delivered')).toBe(true);
  });

  test('delivered -> cancelled no permitido', () => {
    expect(canTransitionOrderStatus('delivered', 'cancelled')).toBe(false);
  });

  test('cancelled -> confirmed no permitido', () => {
    expect(canTransitionOrderStatus('cancelled', 'confirmed')).toBe(false);
  });
});
