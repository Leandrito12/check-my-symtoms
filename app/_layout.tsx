import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

import { useColorScheme } from '@/components/useColorScheme';
import { PrescriptionViewerProvider } from '@/src/contexts/PrescriptionViewerContext';
import { setSessionWithTimeout, supabase } from '@/src/infrastructure/supabase';

const OAUTH_MESSAGE_TYPE = 'CHECK_MY_SINTOMS_OAUTH';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 h – caché para offline
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'CHECK_MY_SINTOMS_QUERY_CACHE',
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
      onSuccess={() => {
        queryClient.resumePausedMutations();
      }}
    >
      <PrescriptionViewerProvider>
        <RootLayoutNav />
      </PrescriptionViewerProvider>
    </PersistQueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Web: cuando el popup de OAuth envía la sesión, la aplicamos en esta ventana y redirigimos al dashboard
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== OAUTH_MESSAGE_TYPE || !event.data?.tokens) return;
      const { access_token, refresh_token } = event.data.tokens;
      const { error } = await setSessionWithTimeout({ access_token, refresh_token });
      if (!error) router.replace('/(tabs)');
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [router]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="v" options={{ presentation: 'card' }} />
          <Stack.Screen name="log" options={{ presentation: 'card' }} />
          <Stack.Screen name="prescription-viewer" options={{ presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="access" options={{ presentation: 'card' }} />
          <Stack.Screen name="shared" options={{ presentation: 'card' }} />
          <Stack.Screen name="doctor" options={{ presentation: 'card' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
