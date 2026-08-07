import { SQLiteProvider } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DATABASE_NAME, initializeDatabase } from '@/db/migrations';
import { getColors, radii, spacing, typography } from '@/theme';

type DatabaseProviderProps = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const colors = getColors(useColorScheme());
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState(false);

  const handleInit = useCallback(async (database: Parameters<typeof initializeDatabase>[0]) => {
    await initializeDatabase(database);
    setReady(true);
  }, []);

  const handleError = useCallback((nextError: Error) => {
    setError(nextError);
    setReady(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setReady(false);
    setAttempt((value) => value + 1);
  }, []);

  if (error != null) {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.stateTitle, { color: colors.text }]}>
            Local records unavailable
          </Text>
          <Text style={[styles.stateCopy, { color: colors.textMuted }]}>
            SiteProof could not open its on-device task database. Your existing local records have not been deleted.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Text style={[styles.retryButtonText, { color: colors.onPrimary }]}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.provider, { backgroundColor: colors.background }]}>
      {!ready ? (
        <SafeAreaView style={styles.stateScreen}>
          <ActivityIndicator accessibilityLabel="Opening local task database" color={colors.primary} size="large" />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Opening local records</Text>
          <Text style={[styles.stateCopy, { color: colors.textMuted }]}>Preparing assigned tasks stored on this device.</Text>
        </SafeAreaView>
      ) : null}

      <SQLiteProvider
        databaseName={DATABASE_NAME}
        key={attempt}
        onError={handleError}
        onInit={handleInit}
      >
        {children}
      </SQLiteProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 520,
    padding: spacing.lg,
    width: '100%',
  },
  provider: {
    flex: 1,
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  stateCopy: {
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 480,
    textAlign: 'center',
  },
  stateScreen: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  stateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
});
