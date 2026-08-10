import {
  calculateNextAttemptAtIso,
  calculateRetryDelaySeconds,
} from '@/features/sync/services/retryPolicy';

describe('retryPolicy', () => {
  it('calculates expected exponential backoff delays', () => {
    expect(calculateRetryDelaySeconds(1)).toBe(2);
    expect(calculateRetryDelaySeconds(2)).toBe(5);
    expect(calculateRetryDelaySeconds(3)).toBe(15);
    expect(calculateRetryDelaySeconds(4)).toBe(60);
    expect(calculateRetryDelaySeconds(10)).toBe(60);
  });

  it('formats nextAttemptAt timestamp correctly', () => {
    const baseTime = new Date('2026-08-10T12:00:00.000Z');
    const nextIso = calculateNextAttemptAtIso(1, baseTime);
    expect(nextIso).toBe('2026-08-10T12:00:02.000Z');
  });
});
