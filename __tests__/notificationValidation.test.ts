import { parseNotificationData } from '@/features/sync/services/notificationService';

describe('notificationValidation', () => {
  it('parses valid sync target notification payload', () => {
    const payload = parseNotificationData({ targetScreen: 'sync' });
    expect(payload).toEqual({ targetScreen: 'sync' });
  });

  it('parses valid conflict target notification payload', () => {
    const payload = parseNotificationData({
      conflictId: 'CNF-123',
      targetScreen: 'conflict',
    });
    expect(payload).toEqual({
      conflictId: 'CNF-123',
      targetScreen: 'conflict',
    });
  });

  it('returns null for invalid notification payloads', () => {
    expect(parseNotificationData(null)).toBeNull();
    expect(parseNotificationData({})).toBeNull();
    expect(parseNotificationData({ targetScreen: 'unknown_screen' })).toBeNull();
  });
});
