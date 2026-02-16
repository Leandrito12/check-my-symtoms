import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '@/src/hooks/useAuth';
import { AUTH_RETURN_TO_KEY, isAllowedReturnTo } from '@/src/constants/auth';
import { SafeHarbor } from '@/constants/SafeHarbor';

function getCurrentPathWeb(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname + window.location.search;
}

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Linking.getInitialURL().then((url) => {
        if (url) {
          try {
            const path = new URL(url).pathname + new URL(url).search;
            setInitialUrl(path);
          } catch {
            setInitialUrl(null);
          }
        } else {
          setInitialUrl(null);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    const pathWeb = Platform.OS === 'web' ? getCurrentPathWeb() : '';
    const currentPath = Platform.OS === 'web' ? pathWeb : (initialUrl ?? '');

    if (user) {
      if (currentPath && isAllowedReturnTo(currentPath)) {
        return;
      }
      router.replace('/(tabs)');
    } else {
      const returnTo =
        currentPath && currentPath !== '/' && !currentPath.startsWith('/(auth)') && isAllowedReturnTo(currentPath)
          ? currentPath
          : '';
      if (returnTo && Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
      }
      const loginHref = returnTo
        ? `/(auth)/login?returnTo=${encodeURIComponent(returnTo)}`
        : '/(auth)/login';
      router.replace(loginHref as never);
    }
  }, [user, loading, router, initialUrl]);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={SafeHarbor.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SafeHarbor.colors.background,
  },
});
