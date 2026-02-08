import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
  } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeHarbor } from '@/constants/SafeHarbor';
import type { PainLevel } from '@/src/domain/types';
import type { SymptomMaster } from '@/src/domain/types';
import { shouldShowEmergencyAlert } from '@/src/domain/emergencyStrategy';
import {
  processHealthLog,
  fetchSymptoms,
  createSymptom,
  createHealthLog,
  compressImageForSymptom,
  uploadSymptomPhoto,
  updateHealthLogImagePath,
} from '@/src/useCases';
import { useAuth } from '@/src/hooks/useAuth';
import { Button, Input, Card, SymptomDropdown, PainSlider, EmergencyAlert } from '@/src/components/ui';

export default function SymptomEntryScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [symptom, setSymptom] = useState<SymptomMaster | null>(null);
  const [context, setContext] = useState('');
  const [painLevel, setPainLevel] = useState<PainLevel>(0);
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: symptoms = [] } = useQuery({
    queryKey: ['symptoms'],
    queryFn: fetchSymptoms,
    enabled: !!user,
  });

  const validateMutation = useMutation({
    mutationFn: processHealthLog,
  });

  const handleCreateSymptom = async (name: string): Promise<SymptomMaster | null> => {
    if (!user?.id) return null;
    const created = await createSymptom(name, user.id);
    queryClient.invalidateQueries({ queryKey: ['symptoms'] });
    return created;
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Se necesita acceso a la galería para adjuntar una foto del síntoma.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!symptom) {
      Alert.alert('Campo requerido', 'Selecciona o agrega un síntoma.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Sesión', 'Debes iniciar sesión para guardar.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await validateMutation.mutateAsync({
        symptom_id: symptom.id,
        pain_level: painLevel,
        context: context.trim() || undefined,
        blood_pressure: bloodPressure.trim() || undefined,
        heart_rate: heartRate ? parseInt(heartRate, 10) : undefined,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat, 10) : undefined,
      });
      if (result.emergency) {
        Alert.alert(
          'Posible urgencia',
          result.message ?? 'Los signos indican posible urgencia. Considera contactar emergencias.',
          [{ text: 'Entendido' }]
        );
        return;
      }
      const log = await createHealthLog({
        patient_id: user.id,
        symptom_id: symptom.id,
        pain_level: painLevel,
        context: context.trim() || null,
        blood_pressure: bloodPressure.trim() || null,
        heart_rate: heartRate ? parseInt(heartRate, 10) : null,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat, 10) : null,
        image_path: null,
      });

      if (photoUri) {
        const { uri: compressedUri } = await compressImageForSymptom(photoUri);
        const imagePath = await uploadSymptomPhoto(compressedUri, user.id, log.id);
        await updateHealthLogImagePath(log.id, imagePath);
      }

      setPhotoUri(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al validar o guardar. Revisa tu conexión.';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const showEmergency = shouldShowEmergencyAlert(painLevel);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Registra tu Síntoma</Text>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Síntoma Principal</Text>
          <SymptomDropdown
            options={symptoms}
            value={symptom}
            onChange={setSymptom}
            onCreateOption={handleCreateSymptom}
            placeholder="Escribe o selecciona..."
          />

          <Input
            label="Contexto (opcional)"
            placeholder="¿Desde cuándo? ¿Qué empeora o mejora?"
            value={context}
            onChangeText={setContext}
            multiline
          />

          <PainSlider value={painLevel} onChange={setPainLevel} />

          {showEmergency && <EmergencyAlert />}

          <Text style={styles.fieldLabel}>Datos fisiológicos (opcionales)</Text>
          <View style={styles.row}>
            <Input
              placeholder="Presión"
              value={bloodPressure}
              onChangeText={setBloodPressure}
              keyboardType="numbers-and-punctuation"
              style={styles.halfInput}
            />
            <Input
              placeholder="FC"
              value={heartRate}
              onChangeText={setHeartRate}
              keyboardType="number-pad"
              style={styles.halfInput}
            />
          </View>
          <Input
            placeholder="Saturación O2 %"
            value={oxygenSat}
            onChangeText={setOxygenSat}
            keyboardType="number-pad"
          />

          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoThumb} resizeMode="cover" />
                <Pressable
                  style={({ pressed }) => [styles.removePhoto, pressed && styles.removePhotoPressed]}
                  onPress={() => setPhotoUri(null)}
                >
                  <Text style={styles.removePhotoText}>Quitar foto</Text>
                </Pressable>
              </View>
            ) : (
              <Button
                title="Adjuntar Foto (Opcional)"
                variant="outline"
                fullWidth
                onPress={handlePickPhoto}
                style={styles.attachButton}
              />
            )}
          </View>

          <Button
            title={saveSuccess ? '✓ Guardado' : 'Guardar Síntoma'}
            onPress={handleSave}
            fullWidth
            disabled={validateMutation.isPending || isSaving}
            style={[styles.saveButton, saveSuccess && styles.saveButtonSuccess]}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  scroll: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 16,
  },
  card: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  photoSection: { marginBottom: 12 },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.border,
  },
  removePhoto: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  removePhotoPressed: { opacity: 0.7 },
  removePhotoText: {
    fontSize: 14,
    color: SafeHarbor.colors.alert,
    fontWeight: '500',
  },
  attachButton: { marginBottom: 0 },
  saveButton: { marginTop: 8 },
  saveButtonSuccess: {
    backgroundColor: SafeHarbor.colors.secondary,
  },
});
