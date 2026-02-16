/**
 * Vista del historial compartido (médico). Guard: validar token; si inválido, redirigir a expired.
 * Plan P5+P6: filtros, tabla desktop, drawer de notas, export CSV/PDF.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { fetchSharedHistory } from '@/src/useCases';
import type { SharedHistoryRange, SharedHistoryLog } from '@/src/useCases';
import { mapSharedHistoryToPressure, mapSharedHistoryToSymptomFrequency } from '@/src/features/health-dashboard/adapters/sharedHistoryToCharts';
import { PressureMapChart } from '@/src/features/health-dashboard/PressureMapChart';
import { SymptomFrequencyBarChart } from '@/src/features/health-dashboard/SymptomFrequencyBarChart';
import { AnomalyAlert } from '@/src/components/AnomalyAlert';
import {
  applyFilters,
  mapLogToTableRow,
} from '@/src/features/shared-history/adapters/sharedHistoryTable';
import { SharedHistoryTable } from '@/src/features/shared-history/SharedHistoryTable';
import { ClinicalNoteDrawer } from '@/src/features/shared-history/ClinicalNoteDrawer';
import { generatePdfTemplate } from '@/src/features/shared-history/utils/generatePdfTemplate';
import { buildCsvFromLogs } from '@/src/features/shared-history/utils/exportCsv';

const RANGE_OPTIONS: { key: SharedHistoryRange; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

const MAP_TOOLTIP_MSG = 'Presión Arterial Media (MAP) = (S + 2D) / 3';

export default function SharedHistoryScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const token = params.token ?? '';
  const [range, setRange] = useState<SharedHistoryRange>('7d');
  const [filterEmergencyOnly, setFilterEmergencyOnly] = useState(false);
  const [filterSymptomSearch, setFilterSymptomSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SharedHistoryLog | null>(null);
  const [justSavedLogId, setJustSavedLogId] = useState<string | null>(null);
  const isDesktop = width >= 600;

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['shared-history', token, range],
    queryFn: () => fetchSharedHistory(token, range),
    enabled: !!token,
    retry: false,
  });

  const bloodPressurePoints = useMemo(
    () => (data ? mapSharedHistoryToPressure(data) : []),
    [data]
  );
  const symptomFrequency = useMemo(
    () => (data ? mapSharedHistoryToSymptomFrequency(data) : []),
    [data]
  );

  const filteredLogs = useMemo(
    () =>
      data?.logs
        ? applyFilters(data.logs, filterEmergencyOnly, filterSymptomSearch)
        : [],
    [data?.logs, filterEmergencyOnly, filterSymptomSearch]
  );

  const sortedLogs = useMemo(
    () =>
      [...filteredLogs].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [filteredLogs]
  );

  const tableRows = useMemo(
    () => sortedLogs.map(mapLogToTableRow),
    [sortedLogs]
  );

  const handleDrawerSaved = useCallback((logId: string | null) => {
    setJustSavedLogId(logId);
  }, []);

  useEffect(() => {
    if (justSavedLogId) {
      const t = setTimeout(() => setJustSavedLogId(null), 2500);
      return () => clearTimeout(t);
    }
  }, [justSavedLogId]);

  useEffect(() => {
    if (!token) {
      (router.replace as (p: string) => void)('/shared/expired');
      return;
    }
    if (isError && error) {
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) {
        (router.replace as (p: string) => void)('/shared/expired');
      }
    }
  }, [token, isError, error, router]);

  const openAnnotate = useCallback((log: SharedHistoryLog | null) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  }, []);

  const handleExportCsv = useCallback(() => {
    const csv = buildCsvFromLogs(sortedLogs);
    Share.share({
      message: csv,
      title: 'Historial clínico.csv',
    }).catch(() => {
      Alert.alert('Error', 'No se pudo compartir el CSV.');
    });
  }, [sortedLogs]);

  const handleExportPdf = useCallback(async () => {
    if (!data) return;
    const rangeLabel =
      range === '7d'
        ? 'Últimos 7 días'
        : range === '30d'
          ? 'Últimos 30 días'
          : 'Últimos 90 días';
    const html = generatePdfTemplate(
      {
        name: data.patient_info.name,
        age: data.patient_info.age,
        id: data.patient_info.id ?? data.logs[0]?.patient_id,
      },
      data.metadata?.doctor_name ?? '',
      sortedLogs,
      rangeLabel
    );
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar PDF',
        });
      } else {
        Alert.alert('PDF generado', 'El PDF se ha generado. Usa el menú de compartir de tu dispositivo.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    }
  }, [data, range, sortedLogs]);

  const showMapTooltip = useCallback(() => {
    Alert.alert('MAP', MAP_TOOLTIP_MSG);
  }, []);

  if (!token) return null;

  // Estado de carga a pantalla completa para no mostrar flash de (tabs) ni contenido del paciente.
  if (isLoading) {
    return (
      <View style={[styles.centered, styles.loadingFullScreen]}>
        <ActivityIndicator size="large" color={SafeHarbor.colors.primary} />
        <Text style={styles.hint}>Cargando historial…</Text>
      </View>
    );
  }

  if (isError || !data) {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) return null;
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          No se pudo cargar el historial. Comprueba el enlace o la conexión.
        </Text>
      </View>
    );
  }

  const { patient_info, analytics, logs } = data;
  const expiresIn = data.expires_in_seconds;
  const patientId = data.logs[0]?.patient_id ?? (patient_info as { id?: string }).id ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {patient_info.name}
          {patient_info.age != null ? `, ${patient_info.age} años` : ''}
        </Text>
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.rangeChip, range === key && styles.rangeChipSelected]}
              onPress={() => setRange(key)}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  range === key && styles.rangeChipTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {typeof expiresIn === 'number' &&
          expiresIn > 0 &&
          expiresIn <= 3600 && (
            <Text style={styles.expiryBanner}>
              Esta sesión expirará en {Math.ceil(expiresIn / 60)} minutos
            </Text>
          )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AnomalyAlert isAnomaly={analytics?.anomaly} />

        {isDesktop ? (
          <View style={styles.desktopRow}>
            <View style={styles.desktopCol60}>
              <PressureMapChart
                data={bloodPressurePoints}
                emptyMessage="Sin datos de presión en este periodo."
              />
            </View>
            <View style={styles.desktopCol40}>
              <SymptomFrequencyBarChart
                data={symptomFrequency}
                emptyMessage="Sin registros de síntomas en este periodo."
              />
            </View>
          </View>
        ) : (
          <>
            <PressureMapChart
              data={bloodPressurePoints}
              emptyMessage="Sin datos de presión en este periodo."
            />
            <SymptomFrequencyBarChart
              data={symptomFrequency}
              emptyMessage="Sin registros de síntomas en este periodo."
            />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Registros</Text>
          <View style={styles.exportRow}>
            <Pressable style={styles.exportBtn} onPress={handleExportCsv}>
              <Text style={styles.exportBtnText}>Exportar CSV</Text>
            </Pressable>
            <Pressable style={styles.exportBtn} onPress={handleExportPdf}>
              <Text style={styles.exportBtnText}>Exportar PDF</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.counterText}>
          Mostrando {filteredLogs.length} de {logs.length} registros
        </Text>

        <View style={styles.filtersRow}>
          <Pressable
            style={[
              styles.filterChip,
              filterEmergencyOnly && styles.filterChipActive,
            ]}
            onPress={() => setFilterEmergencyOnly((x) => !x)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterEmergencyOnly && styles.filterChipTextActive,
              ]}
            >
              Solo urgencias
            </Text>
          </Pressable>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por síntoma o comentario..."
            placeholderTextColor={SafeHarbor.colors.textSecondary}
            value={filterSymptomSearch}
            onChangeText={setFilterSymptomSearch}
          />
        </View>

        {isDesktop ? (
          <SharedHistoryTable
            rows={tableRows}
            justSavedLogId={justSavedLogId}
            onAnnotate={openAnnotate}
            onMapInfoPress={showMapTooltip}
          />
        ) : (
          <>
            {sortedLogs.length === 0 ? (
              <Text style={styles.empty}>No hay registros en este periodo.</Text>
            ) : (
              sortedLogs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logRow}>
                    <Text style={styles.logSymptom}>
                      {log.primary_symptom_name ?? log.symptom_name ?? 'Síntoma'}
                    </Text>
                    <View style={styles.logBadges}>
                      {(log.is_reviewed || (log.clinical_record != null && typeof log.clinical_record === 'object')) && (
                        <Text style={styles.noteIndicator}>📎</Text>
                      )}
                      {log.emergency ? (
                        <View style={styles.urgencyBadge}>
                          <Text style={styles.urgencyText}>Urgencia</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {log.context ? (
                    <Text style={styles.logContext} numberOfLines={2}>
                      {log.context}
                    </Text>
                  ) : null}
                  <Text style={styles.logDate}>
                    {new Date(log.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Pressable
                    style={styles.cardAnnotateBtn}
                    onPress={() => openAnnotate(log)}
                  >
                    <Text style={styles.cardAnnotateText}>Anotar</Text>
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => openAnnotate(null)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <ClinicalNoteDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLog(null);
        }}
        selectedLog={selectedLog}
        patientId={patientId}
        patientName={patient_info.name}
        accessToken={token}
        doctorName=""
        onSaved={handleDrawerSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingFullScreen: { minHeight: '100%' },
  hint: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    marginTop: 12,
  },
  error: {
    fontSize: 16,
    color: SafeHarbor.colors.alert,
    textAlign: 'center',
  },
  header: {
    backgroundColor: SafeHarbor.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SafeHarbor.colors.white,
  },
  rangeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  rangeChipSelected: { backgroundColor: SafeHarbor.colors.white },
  rangeChipText: { fontSize: 13, color: SafeHarbor.colors.white },
  rangeChipTextSelected: {
    color: SafeHarbor.colors.primary,
    fontWeight: '600',
  },
  expiryBanner: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 80 },
  desktopRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  desktopCol60: { flex: 0.6 },
  desktopCol40: { flex: 0.4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
  },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: SafeHarbor.colors.commentBg,
  },
  exportBtnText: { fontSize: 12, color: SafeHarbor.colors.primary, fontWeight: '600' },
  counterText: {
    fontSize: 13,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: SafeHarbor.colors.commentBg,
  },
  filterChipActive: { backgroundColor: SafeHarbor.colors.primary },
  filterChipText: { fontSize: 13, color: SafeHarbor.colors.text },
  filterChipTextActive: { fontSize: 13, color: SafeHarbor.colors.white, fontWeight: '600' },
  searchInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: SafeHarbor.colors.text,
  },
  empty: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 16,
  },
  logCard: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logSymptom: {
    fontSize: 16,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
  },
  logBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteIndicator: { fontSize: 14 },
  urgencyBadge: {
    backgroundColor: SafeHarbor.colors.alert,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
    color: SafeHarbor.colors.white,
  },
  logContext: { fontSize: 14, color: SafeHarbor.colors.text, marginTop: 6 },
  logDate: {
    fontSize: 12,
    color: SafeHarbor.colors.textSecondary,
    marginTop: 6,
  },
  cardAnnotateBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: SafeHarbor.colors.primary,
    borderRadius: 8,
  },
  cardAnnotateText: {
    fontSize: 13,
    fontWeight: '600',
    color: SafeHarbor.colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SafeHarbor.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: { fontSize: 28, color: SafeHarbor.colors.white, fontWeight: '300' },
});
