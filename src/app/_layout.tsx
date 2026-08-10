import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseProvider } from '@/db/DatabaseProvider';
import {
  parseNotificationData,
  setupNotificationHandler,
} from '@/features/sync/services/notificationService';
import { processSyncQueue } from '@/features/sync/services/syncProcessor';
import { getColors } from '@/theme';

function RootLayoutContent() {
  const db = useSQLiteContext();
  const colors = getColors(useColorScheme());

  useEffect(() => {
    setupNotificationHandler();

    // AppState Active Sync Trigger
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        processSyncQueue(db).catch((err) => {
          console.warn('AppState resume sync failed:', err);
        });
      }
    });

    // Initial sync trigger on startup
    processSyncQueue(db).catch((error) => {
      console.warn('Background sync error on app startup:', error);
    });

    // Notification Response Listener for safe typed navigation
    const notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = parseNotificationData(response.notification.request.content.data);
      if (payload != null) {
        if (payload.targetScreen === 'conflict' && payload.conflictId) {
          router.push({
            pathname: '/sync/conflicts/[conflictId]',
            params: { conflictId: payload.conflictId },
          } as Href);
        } else if (payload.targetScreen === 'sync') {
          router.push('/sync' as Href);
        }
      }
    });

    return () => {
      subscription.remove();
      notifSub.remove();
    };
  }, [db]);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <RootLayoutContent />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
