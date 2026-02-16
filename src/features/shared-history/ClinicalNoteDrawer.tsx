/**
 * Drawer/Bottom Sheet para nota clínica. Contexto de log opcional. Plan P6-2.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button, StyledText } from '@/src/components/ui';
import { manageClinicalRecord } from '@/src/useCases';
import type { SharedHistoryLog } from '@/src/useCases/fetchSharedHistory';
import type { ClinicalRecordType } from '@/src/domain/ClinicalRecord';
import { getPressureFromLog } from './adapters/sharedHistoryTable';

const RECORD_TYPES: ClinicalRecordType[] = ['evolucion', 'estudio', 'diagnostico', 'medicacion'];

interface ClinicalNoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLog: SharedHistoryLog | null;
  patientId: string;
  patientName: string;
  accessToken: string;
  doctorName: string;
  onSaved?: (logId: string | null) => void;
}

function formatLogSummary(log: SharedHistoryLog): string {
  const parts: string[] = [];
  const pressure = getPressureFromLog(log);
  if (pressure) {
    parts.push(`${pressure.systolic}/${pressure.diastolic} mmHg (MAP ${pressure.map})`);
  }
  if (log.heart_rate != null) parts.push(`${log.heart_rate} lpm`);
  if (log.oxygen_saturation != null) parts.push(`${log.oxygen_saturation}% O2`);
  if (log.context?.trim()) parts.push(`Comentario: ${log.context.trim()}`);
  return parts.join(' · ') || 'Sin signos en este registro.';
}

export function ClinicalNoteDrawer({
  isOpen,
  onClose,
  selectedLog,
  patientId,
  patientName,
  accessToken,
  doctorName,
  onSaved,
}: ClinicalNoteDrawerProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 600;
  const [content, setContent] = useState('');
  const [recordType, setRecordType] = useState<ClinicalRecordType>('evolucion');
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof manageClinicalRecord>[0]) =>
      manageClinicalRecord(payload),
    onSuccess: (_data, variables) => {
      const logId = variables.log_id ?? null;
      queryClient.invalidateQueries({ queryKey: ['shared-history'] });
      onSaved?.(logId);
      handleClose();
      Alert.alert('Nota guardada', 'La nota clínica se ha guardado correctamente.');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo guardar la nota. Revisa tu conexión.');
    },
  });

  const handleClose = () => {
    setContent('');
    setRecordType('evolucion');
    setReviewCompleted(false);
    onClose();
  };

  const handleSave = () => {
    if (!content.trim()) return;
    mutation.mutate({
      access_token: accessToken,
      patient_id: patientId,
      doctor_name: doctorName,
      content: content.trim(),
      record_type: recordType,
      tags: [],
      is_urgent: false,
      log_id: selectedLog?.id,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    setContent('');
    setRecordType('evolucion');
    setReviewCompleted(false);
  }, [isOpen, selectedLog?.id]);

  if (!isOpen) return null;

  const summary = selectedLog ? formatLogSummary(selectedLog) : null;
  const logDate = selectedLog
    ? new Date(selectedLog.created_at).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const panelContent = (
    <>
      <View style={styles.header}>
        <StyledText variant="h2">Nueva Nota Clínica</StyledText>
        {selectedLog && (
          <StyledText variant="caption">
            Registro #{selectedLog.id.slice(0, 8)} · {logDate}
          </StyledText>
        )}
        {!selectedLog && (
          <StyledText variant="caption">Nota general · {patientName}</StyledText>
        )}
        <Pressable hitSlop={16} onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {summary && (
          <View style={styles.summaryBlock}>
            <StyledText variant="caption" style={styles.summaryLabel}>
              Resumen del registro
            </StyledText>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}

        <StyledText style={styles.label}>Tipo</StyledText>
        <View style={styles.typeRow}>
          {RECORD_TYPES.map((t) => (
            <Button
              key={t}
              title={t.slice(0, 4)}
              variant={recordType === t ? 'primary' : 'outline'}
              onPress={() => setRecordType(t)}
              style={styles.typeBtn}
            />
          ))}
        </View>

        <StyledText style={styles.label}>Observaciones</StyledText>
        <TextInput
          multiline
          placeholder="Impresión clínica, ajuste de medicación..."
          placeholderTextColor={SafeHarbor.colors.textSecondary}
          style={styles.textArea}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />

        {selectedLog && (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setReviewCompleted((x) => !x)}
          >
            <View style={[styles.checkbox, reviewCompleted && styles.checkboxChecked]} />
            <StyledText variant="body">Marcar como revisión completada</StyledText>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="ghost" title="Cancelar" onPress={handleClose} />
        <Button
          variant="primary"
          title={mutation.isPending ? 'Guardando…' : 'Guardar Nota'}
          disabled={!content.trim() || mutation.isPending}
          onPress={handleSave}
        />
      </View>
    </>
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable
        style={[styles.overlay, isDesktop ? styles.overlayDesktop : styles.overlayMobile]}
        onPress={handleClose}
      >
        <Pressable
          style={[
            styles.panel,
            isDesktop ? styles.panelDesktop : styles.panelMobile,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {panelContent}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayDesktop: { justifyContent: 'center', alignItems: 'flex-end' },
  overlayMobile: { justifyContent: 'flex-end', alignItems: 'center' },
  panel: {
    backgroundColor: SafeHarbor.colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    minHeight: 300,
  },
  panelDesktop: {
    width: '35%',
    minWidth: 360,
    height: '100%',
    maxHeight: '100%',
    borderTopRightRadius: 0,
  },
  panelMobile: {
    width: '100%',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SafeHarbor.colors.border,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  closeBtnText: { fontSize: 18, color: SafeHarbor.colors.textSecondary },
  body: { flex: 1, padding: 20 },
  summaryBlock: {
    backgroundColor: SafeHarbor.colors.commentBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryLabel: { marginBottom: 4, color: SafeHarbor.colors.textSecondary },
  summaryText: { fontSize: 14, color: SafeHarbor.colors.text },
  label: { marginBottom: 8, marginTop: 12, color: SafeHarbor.colors.text, fontWeight: '600' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeBtn: {},
  textArea: {
    backgroundColor: SafeHarbor.colors.background,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 14,
    minHeight: 120,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    color: SafeHarbor.colors.text,
    fontSize: 16,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: SafeHarbor.colors.border,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: SafeHarbor.colors.primary,
    borderColor: SafeHarbor.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: SafeHarbor.colors.border,
  },
});
