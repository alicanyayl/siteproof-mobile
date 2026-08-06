import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getColors } from '@/theme';

export default function RootLayout() {
  const colors = getColors(useColorScheme());

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
