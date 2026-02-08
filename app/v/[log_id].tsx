import { useLocalSearchParams } from 'expo-router';
import { SharedViewScreen } from '@/src/features/shared-view';

export default function SharedViewRoute() {
  const { log_id } = useLocalSearchParams<{ log_id: string }>();
  return <SharedViewScreen logId={log_id ?? ''} />;
}
