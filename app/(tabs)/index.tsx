import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Share, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo, useCallback, useState } from 'react';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';
import { useBreakpointContext } from '@/src/contexts/BreakpointContext';
import { ResponsiveContainer } from '@/src/components/ResponsiveContainer';
import { getSharedViewUrl, getBundleShareUrl } from '@/src/utils/sharedViewUrl';
import type { HealthLogForPatient } from '@/src/useCases';
import { fetchHealthLogsForPatient, sharedLogGet, createBundleShare } from '@/src/useCases';
import { type DateRange, DATE_RANGES, DATE_RANGE_LABELS, dateRangeTitle, rangeBounds, filterByRange } from '@/src/utils/dateRange';

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

function LogCard({
  log,
  hasPrescription,
  onPress,
  onShare,
}: {
  log: HealthLogForPatient;
  hasPrescription: boolean;
  onPress: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.gridCard}>
      <Pressable
        style={({ pressed }) => [styles.gridCardMain, { opacity: pressed ? 0.8 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
        onPress={onPress}
      >
        <View style={styles.gridCardTopRow}>
          <View style={styles.gridCardHeader}>
            <Text style={styles.gridCardName} numberOfLines={2}>{log.symptom_name}</Text>
            {hasPrescription && (
              <View style={styles.recetaBadge}>
                <Text style={styles.recetaBadgeText}>Receta</Text>
              </View>
            )}
          </View>
          <View style={[styles.painBadge, { backgroundColor: log.pain_level != null && log.pain_level >= 6 ? SafeHarbor.painLevelColors.alert : SafeHarbor.colors.border }]}>
            <Text style={styles.painText}>{log.pain_level ?? '–'}</Text>
          </View>
        </View>
        <Text style={styles.logDate}>
          {new Date(log.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.gridShareBtn, { opacity: pressed ? 0.8 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
        onPress={onShare}
      >
        <Text style={styles.shareBtnText}>Compartir</Text>
      </Pressable>
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDesktop } = useBreakpointContext();
  const rawName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Paciente';
  const displayName = formatDisplayName(rawName);
  const userId = user?.id ?? '';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['health-logs', userId],
    queryFn: () => fetchHealthLogsForPatient(userId),
    enabled: !!userId,
  });

  const [range, setRange] = useState<DateRange>('30d');
  const [sharingRange, setSharingRange] = useState(false);
  const filteredLogs = useMemo(() => filterByRange(logs, range), [logs, range]);

  const shareRange = useCallback(async () => {
    setSharingRange(true);
    try {
      const { from, to } = rangeBounds(range);
      const { token } = await createBundleShare(from, to);
      const url = getBundleShareUrl(token);
      await Share.share({ message: url, title: 'Mi historial para el médico', url });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo generar el link.');
    } finally {
      setSharingRange(false);
    }
  }, [range]);

  const logIdsToCheck = useMemo(
    () => filteredLogs.slice(0, MAX_LOGS_FOR_PRESCRIPTION_CHECK).map((log) => log.id),
    [filteredLogs]
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
    <ResponsiveContainer style={styles.container}>
      <Text style={styles.greeting}>Hola, {displayName}</Text>
      <Text style={styles.subtitle}>Tu historial de síntomas</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={SafeHarbor.colors.primary} style={styles.loader} />
      ) : logs.length === 0 ? (
        <Text style={styles.empty}>Aún no tienes registros. Añade uno con el botón +.</Text>
      ) : (
        <>
          <View style={styles.rangeChips}>
            {DATE_RANGES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={({ pressed }) => [
                  styles.rangeChip,
                  range === r && styles.rangeChipActive,
                  { opacity: pressed ? 0.8 : 1 },
                  Platform.OS === 'web' && { cursor: 'pointer' },
                ]}
              >
                <Text style={[styles.rangeChipText, range === r && styles.rangeChipTextActive]}>
                  {DATE_RANGE_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.rangeHeader}>
            <Text style={styles.rangeTitle}>
              {dateRangeTitle(range)} · {filteredLogs.length}{' '}
              {filteredLogs.length === 1 ? 'registro' : 'registros'}
            </Text>
            {filteredLogs.length > 0 && (
              <Pressable
                onPress={shareRange}
                disabled={sharingRange}
                style={({ pressed }) => [
                  styles.shareRangeBtn,
                  { opacity: pressed || sharingRange ? 0.7 : 1 },
                  Platform.OS === 'web' && { cursor: 'pointer' },
                ]}
              >
                <Text style={styles.shareRangeBtnText}>
                  {sharingRange ? 'Generando…' : 'Compartir rango'}
                </Text>
              </Pressable>
            )}
          </View>
          {filteredLogs.length === 0 ? (
            <Text style={styles.empty}>No hay registros en este rango. Probá uno más amplio.</Text>
          ) : isDesktop ? (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                {filteredLogs.map((log) => (
                  <LogCard
                    key={log.id}
                    log={log}
                    hasPrescription={logIdsWithPrescription.has(log.id)}
                    onPress={() => router.push(`/log/${log.id}`)}
                    onShare={() => shareLog(log.id)}
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {filteredLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Pressable
                style={({ pressed }) => [styles.logRowMain, { opacity: pressed ? 0.8 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
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
                <View style={[styles.painBadge, { backgroundColor: log.pain_level != null && log.pain_level >= 6 ? SafeHarbor.painLevelColors.alert : SafeHarbor.colors.border, marginRight: 10 }]}>
                  <Text style={styles.painText}>{log.pain_level ?? '–'}</Text>
                </View>
                <Text style={styles.logDate}>
                  {new Date(log.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.8 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
                onPress={() => shareLog(log.id)}
              >
                <Text style={styles.shareBtnText}>Compartir</Text>
              </Pressable>
            </View>
          ))}
            </ScrollView>
          )}
        </>
      )}
      <Pressable
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.9 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
        onPress={() => router.push('/(tabs)/symptom-entry')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SafeHarbor.colors.background,
    paddingTop: 16,
    paddingBottom: 24,
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
  rangeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  rangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.commentBg,
  },
  rangeChipActive: { backgroundColor: SafeHarbor.colors.primary },
  rangeChipText: { fontSize: 13, fontWeight: '600', color: SafeHarbor.colors.text },
  rangeChipTextActive: { color: SafeHarbor.colors.white },
  rangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  rangeTitle: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.text, flexShrink: 1 },
  shareRangeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.primary,
  },
  shareRangeBtnText: { fontSize: 13, fontWeight: '600', color: SafeHarbor.colors.white },
  list: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '31%',
    minWidth: 140,
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    overflow: 'hidden',
  },
  gridCardMain: {
    padding: 14,
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  gridCardName: {
    flex: 1,
    fontSize: 15,
    color: SafeHarbor.colors.text,
    fontWeight: '500',
    minWidth: 0,
  },
  gridShareBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: SafeHarbor.colors.border,
    alignItems: 'center',
  },
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
    lineHeight: 56,
    textAlign: 'center',
    width: 56,
  },
});
