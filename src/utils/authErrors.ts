/**
 * Mensajes amigables para errores de auth (registro, login, Google).
 * "Network request failed" suele indicar .env incorrecto o sin reiniciar el bundler.
 * Google en página en blanco suele ser Redirect URL no configurada en Supabase.
 */
export function getAuthErrorMessage(
  e: unknown,
  context: 'signIn' | 'signUp' | 'google'
): string {
  const message = e instanceof Error ? e.message : String(e);

  if (
    message === 'Network request failed' ||
    message.toLowerCase().includes('network request failed')
  ) {
    return (
      'No se pudo conectar al servidor. Comprueba tu conexión a internet y que en .env tengas ' +
      'EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY correctos (Supabase → Settings → API). ' +
      'Después reinicia la app con: npx expo start --clear'
    );
  }

  if (context === 'google') {
    if (
      message.includes('No se pudo completar') ||
      message.includes('inicio de sesión con Google')
    ) {
      return (
        message +
        ' Si viste una página en blanco tras elegir tu cuenta de Google, en Supabase añade esta URL: ' +
        'Authentication → URL Configuration → Redirect URLs → checkmysintoms://auth/callback'
      );
    }
  }

  return message;
}
