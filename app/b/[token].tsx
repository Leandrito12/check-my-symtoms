import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { fetchSharedBundle } from '@/src/useCases';
import { SkeletonLog } from '@/src/components/ui/SkeletonLog';

function getPainColor(level: number | null): string {
  if (level == null) return SafeHarbor.colors.border;
  if (level <= 3) return SafeHarbor.painLevelColors.calm;
  if (level <= 5) return SafeHarbor.painLevelColors.attention;
  return SafeHarbor.painLevelColors.alert;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Vista del médico: historial del paciente en el rango del bundle (1 link). */
export default function SharedBundleScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const headerStyle = [styles.header, { paddingTop: Math.max(insets.top, 16) }];

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-bundle', token],
    queryFn: () => fetchSharedBundle(token!),
    enabled: !!token,
  });

  if (!token) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Link inválido.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={headerStyle} />
        <SkeletonLog />
      </View>
    );
  }

  if (error || !data) {
    const expired = (error as { status?: number } | null)?.status === 410;
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.errorText}>
          {expired
            ? 'Este enlace expiró. Pedile al paciente uno nuevo.'
            : error instanceof Error
              ? error.message
              : 'No se pudo cargar el historial.'}
        </Text>
      </View>
    );
  }

  const { range, logs } = data;

  return (
    <View style={styles.container}>
      <View style={headerStyle}>
        <Text style={styles.headerTitle}>Historial compartido</Text>
        <Text style={styles.headerSub}>
          {fmtDate(range.from_date)} – {fmtDate(range.to_date)} · {logs.length}{' '}
          {logs.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {logs.length === 0 ? (
          <Text style={styles.empty}>No hay registros en este período.</Text>
        ) : (
          logs.map((log) => (
            <Pressable
              key={log.id}
              onPress={() => router.push(`/v/${log.id}`)}
              style={({ pressed }) => [
                styles.logCard,
                { opacity: pressed ? 0.85 : 1 },
                Platform.OS === 'web' && { cursor: 'pointer' },
              ]}
            >
              <View style={styles.logTop}>
                <Text style={styles.symptomName} numberOfLines={1}>
                  {log.symptom_name}
                </Text>
                <View style={[styles.painBadge, { backgroundColor: getPainColor(log.pain_level) }]}>
                  <Text style={styles.painText}>{log.pain_level ?? '–'}</Text>
                </View>
              </View>
              {log.context ? (
                <Text style={styles.context} numberOfLines={2}>
                  {log.context}
                </Text>
              ) : null}
              {log.blood_pressure || log.heart_rate != null || log.oxygen_saturation != null ? (
                <View style={styles.vitals}>
                  {log.blood_pressure ? (
                    <Text style={styles.vital}>Presión: {log.blood_pressure}</Text>
                  ) : null}
                  {log.heart_rate != null ? (
                    <Text style={styles.vital}>FC: {log.heart_rate} lpm</Text>
                  ) : null}
                  {log.oxygen_saturation != null ? (
                    <Text style={styles.vital}>Sat O2: {log.oxygen_saturation}%</Text>
                  ) : null}
                </View>
              ) : null}
              <Text style={styles.date}>{fmtDate(log.created_at)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  header: {
    backgroundColor: SafeHarbor.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 64,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: SafeHarbor.colors.white },
  headerSub: { fontSize: 13, color: SafeHarbor.colors.white, opacity: 0.9, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  empty: { fontSize: 14, color: SafeHarbor.colors.text, opacity: 0.7 },
  logCard: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  symptomName: { flex: 1, fontSize: 16, fontWeight: '600', color: SafeHarbor.colors.text },
  painBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  painText: { fontSize: 14, fontWeight: '700', color: SafeHarbor.colors.white },
  context: { fontSize: 13, color: SafeHarbor.colors.text, marginTop: 6 },
  vitals: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  vital: { fontSize: 13, color: SafeHarbor.colors.text, opacity: 0.9 },
  date: { fontSize: 12, color: SafeHarbor.colors.text, opacity: 0.6, marginTop: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: SafeHarbor.colors.alert, textAlign: 'center' },
});
