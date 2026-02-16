import { useLocalSearchParams } from 'expo-router';
import { SharedViewScreen } from '@/src/features/shared-view';

export default function SharedViewRoute() {
  const params = useLocalSearchParams<{ log_id: string; access_token?: string }>();
  return (
    <SharedViewScreen
      logId={params.log_id ?? ''}
      accessToken={params.access_token ?? undefined}
    />
  );
}
