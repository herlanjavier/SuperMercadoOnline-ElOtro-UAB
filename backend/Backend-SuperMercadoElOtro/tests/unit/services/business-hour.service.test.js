import { isBusinessOpenNow } from '../../../src/utils/businessHours.js';

describe('business hour helper', () => {
  test('abierto si hora actual esta entre opensAt y closesAt', () => {
    expect(isBusinessOpenNow({ currentTime: '12:00', opensAt: '06:00', closesAt: '22:00', isOpen: true })).toBe(true);
  });

  test('cerrado si esta antes de opensAt', () => {
    expect(isBusinessOpenNow({ currentTime: '05:59', opensAt: '06:00', closesAt: '22:00', isOpen: true })).toBe(false);
  });

  test('cerrado si esta despues de closesAt', () => {
    expect(isBusinessOpenNow({ currentTime: '22:01', opensAt: '06:00', closesAt: '22:00', isOpen: true })).toBe(false);
  });

  test('cerrado si isOpen=false', () => {
    expect(isBusinessOpenNow({ currentTime: '12:00', opensAt: '06:00', closesAt: '22:00', isOpen: false })).toBe(false);
  });
});
