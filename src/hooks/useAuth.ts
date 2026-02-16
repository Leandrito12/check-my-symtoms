import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
import { setSessionWithTimeout, supabase } from '@/src/infrastructure/supabase';
import { devLog } from '@/src/utils/devLog';

/** URL de redirect para OAuth. Scheme = app.json (checkmysintoms); en Supabase añadir checkmysintoms://auth/callback. */
function getOAuthRedirectUrl(): string {
  if (Platform.OS === 'web') {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '';
    if (!url) throw new Error('No se pudo obtener la URL de callback.');
    return url;
  }
  const fromLinking = Linking.createURL('auth/callback');
  if (!fromLinking || fromLinking.includes('localhost')) {
    const scheme = Constants.expoConfig?.scheme ?? 'checkmysintoms';
    return `${scheme}://auth/callback`;
  }
  return fromLinking;
}

function parseSessionFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const redirectUrl = getOAuthRedirectUrl();
    devLog('Auth', 'Google: redirectTo = ' + redirectUrl);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      devLog('Auth', 'Google: error de Supabase', error.message);
      throw error;
    }
    if (!data.url) throw new Error('No se pudo obtener la URL de Google.');
    const isGoogleUrl = data.url.includes('accounts.google.com') || data.url.includes('google.com');
    devLog('Auth', 'Google: abriendo navegador (¿URL de Google?)', isGoogleUrl);
    if (!isGoogleUrl) {
      devLog('Auth', 'Google: la URL no es de Google. ¿Tienes configurado el proveedor Google en Supabase? Authentication → Providers → Google (Client ID y Secret).');
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    devLog('Auth', 'Google: resultado del navegador', {
      type: result.type,
      hasUrl: result.type === 'success' && 'url' in result && !!result.url,
    });
    if (result.type === 'success' && result.url) {
      const tokens = parseSessionFromUrl(result.url);
      if (!tokens) throw new Error('No se recibió la sesión de Google.');
      const { error: sessionError } = await setSessionWithTimeout(tokens);
      if (sessionError) throw sessionError;
      devLog('Auth', 'Google: sesión establecida');
      return;
    }
    // Android (y a veces iOS) puede devolver 'dismiss' aunque el login haya ido por deep link
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (existingSession) {
      devLog('Auth', 'Google: sesión ya existente (dismiss con deep link)');
      return;
    }
    devLog('Auth', 'Google: fallo (type=' + result.type + ', sin sesión)');
    throw new Error('No se pudo completar el inicio de sesión con Google.');
  };

  const signUp = async (email: string, password: string, options?: { displayName?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: options?.displayName ? { data: { display_name: options.displayName } } : undefined,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signIn, signInWithGoogle, signUp, signOut };
}
