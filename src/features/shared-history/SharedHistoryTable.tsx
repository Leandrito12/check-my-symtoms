/**
 * Tabla desktop del historial compartido. Resaltado clínico, columnas estándar. Plan P5-3.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { SharedHistoryLog } from '@/src/useCases/fetchSharedHistory';
import {
  mapLogToTableRow,
  type SharedHistoryTableRow,
  type PainLevelColor,
} from './adapters/sharedHistoryTable';

const MAP_TOOLTIP = 'Presión Arterial Media (MAP) = (S + 2D) / 3';

const CELL_PADDING = 10;
const COL_WIDTHS = {
  date: 100,
  status: 76,
  symptom: 140,
  pain: 44,
  pressure: 88,
  vitals: 72,
  context: 120,
  note: 40,
  actions: 100,
} as const;
const TOTAL_WIDTH = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0);

interface SharedHistoryTableProps {
  rows: SharedHistoryTableRow[];
  justSavedLogId: string | null;
  onAnnotate: (log: SharedHistoryLog) => void;
  onViewLog?: (log: SharedHistoryLog) => void;
  onMapInfoPress?: () => void;
}

function Cell({
  children,
  width,
  center,
  style,
}: {
  children: React.ReactNode;
  width: number;
  center?: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.cell, { width }, center && styles.cellCenter, style]}>
      {typeof children === 'string' ? (
        <Text style={styles.cellText} numberOfLines={2}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

function PainBadge({ level, color }: { level: number | null; color: PainLevelColor }) {
  const bg =
    color === 'red'
      ? SafeHarbor.colors.alert
      : color === 'orange'
        ? SafeHarbor.painLevelColors.attention
        : SafeHarbor.painLevelColors.calm;
  return (
    <View style={[styles.painBadge, { backgroundColor: bg }]}>
      <Text style={styles.painBadgeText}>{level ?? '—'}/10</Text>
    </View>
  );
}

function NoteIcon({ hasNote, reviewed }: { hasNote: boolean; reviewed?: boolean }) {
  if (!hasNote) {
    return <Text style={styles.noteIconGray}>📄</Text>;
  }
  return (
    <Text style={reviewed ? styles.noteIconGreen : styles.noteIconBlue}>
      📄
    </Text>
  );
}

export function SharedHistoryTable({
  rows,
  justSavedLogId,
  onAnnotate,
  onViewLog,
  onMapInfoPress,
}: SharedHistoryTableProps) {
  const { width } = useWindowDimensions();
  const showMapTooltip = onMapInfoPress != null;

  const header = (
    <View style={styles.row}>
      <Cell width={COL_WIDTHS.date}>
        <Text style={styles.headerText}>Fecha</Text>
      </Cell>
      <Cell width={COL_WIDTHS.status}>
        <Text style={styles.headerText}>Estado</Text>
      </Cell>
      <Cell width={COL_WIDTHS.symptom}>
        <Text style={styles.headerText}>Síntoma</Text>
      </Cell>
      <Cell width={COL_WIDTHS.pain} center>
        <Text style={styles.headerText}>Dolor</Text>
      </Cell>
      <Cell width={COL_WIDTHS.pressure} center>
        <View style={styles.headerWithInfo}>
          <Text style={styles.headerText}>P.A. (MAP)</Text>
          {showMapTooltip && (
            <Pressable
              hitSlop={8}
              onPress={() => {
                if (onMapInfoPress) onMapInfoPress();
                else Alert.alert('MAP', MAP_TOOLTIP);
              }}
            >
              <Text style={styles.infoIcon}>ⓘ</Text>
            </Pressable>
          )}
        </View>
      </Cell>
      <Cell width={COL_WIDTHS.vitals} center>
        <Text style={styles.headerText}>FC / O2</Text>
      </Cell>
      <Cell width={COL_WIDTHS.context}>
        <Text style={styles.headerText}>Comentario</Text>
      </Cell>
      <Cell width={COL_WIDTHS.note} center>
        <Text style={styles.headerText}>Nota</Text>
      </Cell>
      <Cell width={COL_WIDTHS.actions}>
        <Text style={styles.headerText}>Acciones</Text>
      </Cell>
    </View>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.scroll}
      contentContainerStyle={{ minWidth: Math.max(TOTAL_WIDTH, width - 48) }}
    >
      <View style={styles.table}>
        <View style={styles.headerRow}>{header}</View>
        {rows.map((row) => {
          const isJustSaved = row.id === justSavedLogId;
          const pressureStr =
            row.pressure != null
              ? `${row.pressure.systolic}/${row.pressure.diastolic} (${row.pressure.map})`
              : '—';
          const vitalsStr = `${row.heartRate ?? '—'} / ${row.oxygenSaturation ?? '—'}%`;
          const isHighBP =
            row.pressure != null &&
            (row.pressure.systolic > 140 || row.pressure.diastolic > 90);
          const isLowO2 =
            row.oxygenSaturation != null && row.oxygenSaturation < 90;

          return (
            <View
              key={row.id}
              style={[
                styles.row,
                row.isEmergency && styles.rowEmergency,
                isJustSaved && styles.rowJustSaved,
              ]}
            >
              <Cell width={COL_WIDTHS.date}>
                <Text style={styles.cellText}>{row.dateTime}</Text>
              </Cell>
              <Cell width={COL_WIDTHS.status}>
                <Text
                  style={[
                    styles.cellText,
                    row.isEmergency && styles.statusUrgency,
                  ]}
                >
                  {row.isEmergency ? 'Urgencia' : 'Normal'}
                </Text>
              </Cell>
              <Cell width={COL_WIDTHS.symptom}>
                <Text style={styles.symptomPrimary}>{row.symptomPrimary}</Text>
                {row.symptomSecondary ? (
                  <Text style={styles.symptomSecondary} numberOfLines={1}>
                    {row.symptomSecondary}
                  </Text>
                ) : null}
              </Cell>
              <Cell width={COL_WIDTHS.pain} center>
                <PainBadge level={row.painLevel} color={row.painColor} />
              </Cell>
              <Cell width={COL_WIDTHS.pressure} center>
                <Text
                  style={[styles.cellText, isHighBP && styles.cellHighBP]}
                >
                  {pressureStr}
                </Text>
              </Cell>
              <Cell
                width={COL_WIDTHS.vitals}
                center
                style={isLowO2 ? styles.cellLowO2 : undefined}
              >
                <Text style={styles.cellText}>{vitalsStr}</Text>
              </Cell>
              <Cell width={COL_WIDTHS.context}>
                <Text style={styles.cellText} numberOfLines={2}>
                  {row.contextSnippet ?? '—'}
                </Text>
              </Cell>
              <Cell width={COL_WIDTHS.note} center>
                <NoteIcon hasNote={row.hasNote} reviewed={row.noteReviewed} />
              </Cell>
              <Cell width={COL_WIDTHS.actions}>
                <View style={styles.actionsCell}>
                  {onViewLog && (
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => onViewLog(row.log)}
                    >
                      <Text style={styles.actionBtnText}>Ver</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => onAnnotate(row.log)}
                  >
                    <Text style={styles.actionBtnTextPrimary}>Anotar</Text>
                  </Pressable>
                </View>
              </Cell>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 400 },
  table: { borderWidth: 1, borderColor: SafeHarbor.colors.border, borderRadius: 8 },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: SafeHarbor.colors.commentBg,
    borderBottomWidth: 2,
    borderBottomColor: SafeHarbor.colors.border,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SafeHarbor.colors.border,
  },
  rowEmergency: { backgroundColor: '#fff5f5' },
  rowJustSaved: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: SafeHarbor.colors.primary,
  },
  headerWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoIcon: { fontSize: 14, color: SafeHarbor.colors.primary },
  cell: {
    padding: CELL_PADDING,
    justifyContent: 'center',
    minHeight: 40,
  },
  cellCenter: { alignItems: 'center' },
  cellText: { fontSize: 12, color: SafeHarbor.colors.text },
  cellHighBP: { color: SafeHarbor.colors.alert },
  cellLowO2: { backgroundColor: '#ffebee', borderRadius: 4 },
  symptomPrimary: { fontSize: 12, fontWeight: '600', color: SafeHarbor.colors.text },
  symptomSecondary: { fontSize: 11, color: SafeHarbor.colors.textSecondary, marginTop: 2 },
  statusUrgency: { color: SafeHarbor.colors.alert, fontWeight: '600' },
  painBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'center',
  },
  painBadgeText: { fontSize: 11, fontWeight: '600', color: SafeHarbor.colors.white },
  noteIconGray: { fontSize: 16, opacity: 0.5 },
  noteIconBlue: { fontSize: 16, color: SafeHarbor.colors.primary },
  noteIconGreen: { fontSize: 16, color: SafeHarbor.colors.secondary },
  actionsCell: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: SafeHarbor.colors.commentBg,
  },
  actionBtnPrimary: { backgroundColor: SafeHarbor.colors.primary },
  actionBtnText: { fontSize: 11, color: SafeHarbor.colors.text },
  actionBtnTextPrimary: { fontSize: 11, fontWeight: '600', color: SafeHarbor.colors.white },
});
