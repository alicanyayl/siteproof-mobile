import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { z } from 'zod';

export const notificationPayloadSchema = z.object({
  conflictId: z.string().optional(),
  targetScreen: z.enum(['sync', 'conflict']),
});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      priority: Notifications.AndroidNotificationPriority.HIGH,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function scheduleSyncReminder(): Promise<boolean> {
  setupNotificationHandler();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('siteproof-sync', {
      importance: Notifications.AndroidImportance.HIGH,
      name: 'SiteProof Sync Alerts',
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      body: 'Some inspection changes still need review.',
      data: { targetScreen: 'sync' },
      title: 'SiteProof needs attention',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    },
  });

  return true;
}

export function parseNotificationData(data: unknown): NotificationPayload | null {
  if (data == null || typeof data !== 'object') {
    return null;
  }
  const result = notificationPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}
