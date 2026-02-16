/**
 * Modal para nueva nota clínica. S01: tags predefinidos + personalizados. S02: optimistic updates.
 */
import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button, StyledText, Tag } from '@/src/components/ui';
import { manageClinicalRecord } from '@/src/useCases';
import type { ClinicalRecordType } from '@/src/domain/ClinicalRecord';
import type { ClinicalRecord } from '@/src/domain/ClinicalRecord';

const PREDEFINED_TAGS = ['Medicacion', 'Control', 'Urgencia'];

const RECORD_TYPES: ClinicalRecordType[] = ['evolucion', 'estudio', 'diagnostico', 'medicacion'];

interface AddClinicalRecordModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  accessToken: string;
  doctorName: string;
}

export function AddClinicalRecordModal({
  visible,
  onClose,
  patientId,
  patientName,
  accessToken,
  doctorName,
}: AddClinicalRecordModalProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<ClinicalRecordType>('evolucion');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [is_urgent, setIsUrgent] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof manageClinicalRecord>[0]) =>
      manageClinicalRecord(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['clinical-history', patientId, accessToken] });
      const previous = queryClient.getQueryData<ClinicalRecord[]>([
        'clinical-history',
        patientId,
        accessToken,
      ]);
      const optimisticRecord: ClinicalRecord = {
        id: `opt-${Date.now()}`,
        patient_id: patientId,
        doctor_name: payload.doctor_name,
        note_content: payload.content,
        record_type: payload.record_type,
        tags: payload.tags,
        is_urgent: payload.is_urgent,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<ClinicalRecord[]>(
        ['clinical-history', patientId, accessToken],
        (old) => [optimisticRecord, ...(old ?? [])]
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(
          ['clinical-history', patientId, accessToken],
          context.previous
        );
      }
      Alert.alert('Error', 'No se pudo guardar la nota. Revisa tu conexión.');
    },
    onSuccess: () => {
      Alert.alert('Éxito', 'Registro guardado correctamente.');
      handleClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-history', patientId, accessToken] });
    },
  });

  const handleClose = () => {
    setContent('');
    setType('evolucion');
    setTags([]);
    setCustomTag('');
    setIsUrgent(false);
    onClose();
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setCustomTag('');
    }
  };

  const handleSave = () => {
    if (!content.trim()) return;
    Alert.alert(
      'Confirmar',
      '¿Guardar esta nota clínica?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: () => {
            mutation.mutate({
              access_token: accessToken,
              patient_id: patientId,
              doctor_name: doctorName,
              content: content.trim(),
              record_type: type,
              tags,
              is_urgent,
            });
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <StyledText variant="h2">Nueva Nota Clínica</StyledText>
          <StyledText variant="caption">Paciente: {patientName}</StyledText>
        </View>
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <StyledText style={styles.label}>Tipo de registro</StyledText>
          <View style={styles.typeRow}>
            {RECORD_TYPES.map((t) => (
              <Button
                key={t}
                title={t.toUpperCase()}
                variant={type === t ? 'primary' : 'outline'}
                onPress={() => setType(t)}
                style={styles.typeButton}
              />
            ))}
          </View>
          <StyledText style={styles.label}>Observaciones y notas</StyledText>
          <TextInput
            multiline
            placeholder="Escriba aquí los detalles de la consulta..."
            placeholderTextColor={SafeHarbor.colors.textSecondary}
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
          <StyledText style={styles.label}>Etiquetas (S01)</StyledText>
          <View style={styles.tagRow}>
            {PREDEFINED_TAGS.map((t) => (
              <Pressable
                key={t}
                onPress={() => toggleTag(t)}
                style={[
                  styles.tagChip,
                  tags.includes(t) && styles.tagChipSelected,
                ]}
              >
                <StyledText
                  variant="caption"
                  style={tags.includes(t) ? styles.tagChipTextSelected : undefined}
                >
                  #{t}
                </StyledText>
              </Pressable>
            ))}
          </View>
          <View style={styles.customTagRow}>
            <TextInput
              placeholder="Añadir etiqueta..."
              placeholderTextColor={SafeHarbor.colors.textSecondary}
              style={styles.customTagInput}
              value={customTag}
              onChangeText={setCustomTag}
              onSubmitEditing={addCustomTag}
            />
            <Button title="Añadir" variant="outline" onPress={addCustomTag} />
          </View>
          {tags.length > 0 && (
            <View style={styles.selectedTags}>
              {tags.map((t) => (
                <Tag key={t} label={`#${t}`} />
              ))}
            </View>
          )}
          <Pressable
            style={styles.urgentRow}
            onPress={() => setIsUrgent((x) => !x)}
          >
            <View style={[styles.checkbox, is_urgent && styles.checkboxChecked]} />
            <StyledText variant="body">Urgente</StyledText>
          </Pressable>
        </ScrollView>
        <View style={styles.footer}>
          <Button variant="ghost" title="Cancelar" onPress={handleClose} />
          <Button
            variant="primary"
            title="Guardar en Historia"
            disabled={!content.trim() || mutation.isPending}
            onPress={handleSave}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SafeHarbor.colors.border,
  },
  form: { flex: 1, padding: 20 },
  label: {
    marginBottom: 8,
    marginTop: 16,
    color: SafeHarbor.colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  typeButton: { marginRight: 0 },
  textArea: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 15,
    minHeight: 150,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    color: SafeHarbor.colors.text,
    fontSize: 16,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: SafeHarbor.colors.commentBg,
  },
  tagChipSelected: { backgroundColor: SafeHarbor.colors.primary },
  tagChipTextSelected: { color: SafeHarbor.colors.white, fontWeight: '600' },
  customTagRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: SafeHarbor.colors.text,
  },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  urgentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: SafeHarbor.colors.border,
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: SafeHarbor.colors.primary, borderColor: SafeHarbor.colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: SafeHarbor.colors.border,
  },
});
