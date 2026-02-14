import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';
import { getSharedViewUrl } from '@/src/utils/sharedViewUrl';
import { fetchHealthLogsForPatient, sharedLogGet } from '@/src/useCases';

const MAX_LOGS_FOR_PRESCRIPTION_CHECK = 20;

/** Longitudes típicas para partir nombre+apellidos pegados (sin mayúsculas en medio). Se usa la primera que toque según tamaño del string. */
const FALLBACK_FIRST_LEN = 7;
const FALLBACK_NEXT_LENS = [6, 5, 4];
const FALLBACK_THRESHOLD = 9;

function splitPastedName(s: string, firstLen: number, nextLens: number[]): string {
  if (s.length <= FALLBACK_THRESHOLD) return s;
  const len = firstLen;
  const first = s.slice(0, len);
  const rest = s.slice(len);
  const nextLen = nextLens[0] ?? 4;
  const restFormatted = splitPastedName(rest, nextLen, nextLens.slice(1));
  return restFormatted ? `${first} ${restFormatted}` : first;
}

/** Separa nombre y apellidos cuando vienen juntos: mayúsculas, guiones bajos, o fallback si todo junto sin mayúsculas. */
function formatDisplayName(name: string): string {
  if (!name || typeof name !== 'string') return name;
  let s = name.replace(/_/g, ' ');
  s = s.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
  s = s.replace(/([A-ZÁÉÍÓÚÑ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g, '$1 $2');
  if (!/ /.test(s) && s.length > FALLBACK_THRESHOLD) {
    const firstLen = s.length > 14 ? FALLBACK_FIRST_LEN : 4;
    s = splitPastedName(s, firstLen, FALLBACK_NEXT_LENS);
  }
  return s.trim();
}

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();
  const rawName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Paciente';
  const displayName = formatDisplayName(rawName);
  const userId = user?.id ?? '';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['health-logs', userId],
    queryFn: () => fetchHealthLogsForPatient(userId),
    enabled: !!userId,
  });

  const logIdsToCheck = useMemo(
    () => logs.slice(0, MAX_LOGS_FOR_PRESCRIPTION_CHECK).map((log) => log.id),
    [logs]
  );

  const sharedLogResults = useQueries({
    queries: logIdsToCheck.map((logId) => ({
      queryKey: ['shared-log', logId],
      queryFn: () => sharedLogGet(logId),
      enabled: !!logId && logs.length > 0,
    })),
  });

  const logIdsWithPrescription = useMemo(() => {
    const set = new Set<string>();
    sharedLogResults.forEach((result, i) => {
      const logId = logIdsToCheck[i];
      if (logId && result.data?.comments?.some((c) => c.attachment_path)) set.add(logId);
    });
    return set;
  }, [sharedLogResults, logIdsToCheck]);

  const shareLog = useCallback(async (logId: string) => {
    const url = getSharedViewUrl(logId);
    try {
      await Share.share({
        message: url,
        title: 'Ver mi síntoma',
        url: url,
      });
    } catch {
      // Usuario canceló o error del sistema
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {displayName}</Text>
      <Text style={styles.subtitle}>Tu historial de síntomas</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={SafeHarbor.colors.primary} style={styles.loader} />
      ) : logs.length === 0 ? (
        <Text style={styles.empty}>Aún no tienes registros. Añade uno con el botón +.</Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Pressable
                style={({ pressed }) => [styles.logRowMain, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/log/${log.id}`)}
              >
                <View style={styles.logNameBlock}>
                  <Text style={styles.logName} numberOfLines={1}>{log.symptom_name}</Text>
                  {logIdsWithPrescription.has(log.id) && (
                    <View style={styles.recetaBadge}>
                      <Text style={styles.recetaBadgeText}>Receta</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.painBadge, { backgroundColor: log.pain_level != null && log.pain_level >= 6 ? SafeHarbor.painLevelColors.alert : SafeHarbor.colors.border }]}>
                  <Text style={styles.painText}>{log.pain_level ?? '–'}</Text>
                </View>
                <Text style={styles.logDate}>
                  {new Date(log.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => shareLog(log.id)}
              >
                <Text style={styles.shareBtnText}>Compartir</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
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
    marginBottom: 16,
  },
  loader: { marginTop: 16 },
  empty: { fontSize: 14, color: SafeHarbor.colors.text, opacity: 0.7, marginTop: 8 },
  list: { flex: 1 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    overflow: 'hidden',
  },
  logRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14 },
  shareBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: SafeHarbor.colors.border,
  },
  shareBtnText: { fontSize: 12, fontWeight: '600', color: SafeHarbor.colors.primary },
  logNameBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  logName: { flex: 1, fontSize: 16, color: SafeHarbor.colors.text, fontWeight: '500' },
  recetaBadge: {
    backgroundColor: SafeHarbor.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recetaBadgeText: { fontSize: 11, fontWeight: '600', color: SafeHarbor.colors.white },
  painBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  painText: { fontSize: 12, fontWeight: '700', color: SafeHarbor.colors.white },
  logDate: { fontSize: 12, color: SafeHarbor.colors.text, opacity: 0.7 },
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
