import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseProvider } from '@/db/DatabaseProvider';
import { getColors } from '@/theme';

export default function RootLayout() {
  const colors = getColors(useColorScheme());

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
          }}
        />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
