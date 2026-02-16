import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { LoginScreen } from '@/src/features/auth';
import { AUTH_RETURN_TO_KEY, isAllowedReturnTo } from '@/src/constants/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  useEffect(() => {
    const raw = Array.isArray(returnTo) ? returnTo[0] : returnTo;
    if (Platform.OS === 'web' && typeof raw === 'string' && raw && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(AUTH_RETURN_TO_KEY, raw);
    }
  }, [returnTo]);

  const handleSuccess = () => {
    const raw = Array.isArray(returnTo) ? returnTo[0] : returnTo;
    const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : '';
    if (decoded && isAllowedReturnTo(decoded)) {
      router.replace(decoded as never);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <LoginScreen
      onGoRegister={() => router.replace('/(auth)/register')}
      onSuccess={handleSuccess}
    />
  );
}
