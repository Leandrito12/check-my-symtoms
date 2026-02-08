import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Paciente';

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {displayName}</Text>
      <Text style={styles.subtitle}>Tu historial de síntomas aparecerá aquí.</Text>
      <Pressable
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.9 : 1 }]}
        onPress={() => router.push('/(tabs)/symptom-entry')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SafeHarbor.colors.background,
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: SafeHarbor.colors.text,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SafeHarbor.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 28,
    fontWeight: '300',
    color: SafeHarbor.colors.white,
  },
});
