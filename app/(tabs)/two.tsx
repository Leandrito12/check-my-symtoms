import { StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { SafeHarbor } from '@/constants/SafeHarbor';

export default function TabTwoScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Más</Text>
      <Pressable
        style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => router.push('/access' as never)}
      >
        <Text style={styles.menuItemText}>Gestión de accesos al historial</Text>
        <Text style={styles.menuItemHint}>Compartir historial con el médico</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
  },
  menuItemHint: {
    fontSize: 13,
    color: SafeHarbor.colors.textSecondary,
    marginTop: 4,
  },
});
