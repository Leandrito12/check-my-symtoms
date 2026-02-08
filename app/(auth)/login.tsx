import { useRouter } from 'expo-router';
import { LoginScreen } from '@/src/features/auth';

export default function LoginRoute() {
  const router = useRouter();
  return (
    <LoginScreen
      onGoRegister={() => router.replace('/(auth)/register')}
      onSuccess={() => router.replace('/(tabs)')}
    />
  );
}
