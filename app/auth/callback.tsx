import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { supabase } from '@/src/infrastructure/supabase';

function parseSessionFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

const OAUTH_MESSAGE_TYPE = 'CHECK_MY_SINTOMS_OAUTH';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    // Web: si estamos en la ventana emergente del OAuth, enviamos los tokens a la ventana original y cerramos
    if (typeof window !== 'undefined' && window.opener != null) {
      const href = window.location?.href;
      if (href) {
        const tokens = parseSessionFromUrl(href);
        if (tokens) {
          try {
            const origin = window.location?.origin ?? '';
            window.opener.postMessage({ type: OAUTH_MESSAGE_TYPE, tokens }, origin);
          } catch {
            // Opener cerrado o postMessage no permitido
          }
        }
      }
      window.close();
      return;
    }

    let cancelled = false;
    (async () => {
      let url: string | null = null;
      try {
        url = await Linking.getInitialURL();
      } catch {
        setStatus('error');
        router.replace('/(auth)/login');
        return;
      }
      if (cancelled || !url || typeof url !== 'string' || !url.includes('auth/callback')) {
        if (!cancelled) {
          setStatus('error');
          router.replace('/(auth)/login');
        }
        return;
      }
      const tokens = parseSessionFromUrl(url);
      if (!tokens) {
        if (!cancelled) {
          setStatus('error');
          router.replace('/(auth)/login');
        }
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      if (cancelled) return;
      if (error) {
        setStatus('error');
        router.replace('/(auth)/login');
        return;
      }
      setStatus('ok');
      try {
        router.replace('/(tabs)');
      } catch {
        router.replace('/(auth)/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={SafeHarbor.colors.primary} />
          <Text style={styles.text}>Completando inicio de sesión…</Text>
        </>
      )}
      {status === 'error' && (
        <Text style={styles.error}>No se pudo completar el acceso. Redirigiendo…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SafeHarbor.colors.background,
    gap: 16,
  },
  text: { fontSize: 16, color: SafeHarbor.colors.text },
  error: { fontSize: 14, color: SafeHarbor.colors.alert },
});
