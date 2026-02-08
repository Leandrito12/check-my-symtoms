import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
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
    const redirectUrl = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (!data.url) throw new Error('No se pudo obtener la URL de Google.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== 'success' || !result.url) return;
    const tokens = parseSessionFromUrl(result.url);
    if (!tokens) throw new Error('No se recibió la sesión de Google.');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    if (sessionError) throw sessionError;
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
