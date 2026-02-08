import { useRouter } from 'expo-router';
import { RegisterScreen } from '@/src/features/auth';

export default function RegisterRoute() {
  const router = useRouter();
  return (
    <RegisterScreen
      onGoLogin={() => router.replace('/(auth)/login')}
    />
  );
}
