import { parseReportPeriod } from '../../../src/services/report.service.js';

describe('report service helpers', () => {
  test('parseReportPeriod con date crea periodo del dia', () => {
    const period = parseReportPeriod({ date: '2026-05-13' });

    expect(period.from).toContain('2026-05-13');
    expect(period.label).toBe('2026-05-13');
  });

  test('parseReportPeriod con month usa etiqueta del mes', () => {
    const period = parseReportPeriod({ month: '2026-05' });

    expect(period.label).toBe('2026-05');
  });
});
