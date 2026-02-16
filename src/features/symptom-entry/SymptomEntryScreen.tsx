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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { useBreakpointContext } from '@/src/contexts/BreakpointContext';
import { parsePressureInput } from '@/src/utils/parsePressure';
import { ResponsiveContainer } from '@/src/components/ResponsiveContainer';
import { Button, Input, Card, SymptomDropdown, PainSlider, EmergencyAlert } from '@/src/components/ui';

export default function SymptomEntryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDesktop } = useBreakpointContext();
  const queryClient = useQueryClient();
  const [symptom, setSymptom] = useState<SymptomMaster | null>(null);
  const [subSymptoms, setSubSymptoms] = useState<SymptomMaster[]>([]);
  const [context, setContext] = useState('');
  const [painLevel, setPainLevel] = useState<PainLevel>(0);
  const [bloodPressure, setBloodPressure] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastMapFromBackend, setLastMapFromBackend] = useState<number | null>(null);

  const { data: symptoms = [] } = useQuery({
    queryKey: ['symptoms'],
    queryFn: fetchSymptoms,
    enabled: !!user,
  });

  const validateMutation = useMutation({
    mutationFn: processHealthLog,
  });

  const isBloodPressureSymptom = symptom?.name?.toLowerCase().includes('presión') ?? false;
  const showPressureInputs = isBloodPressureSymptom;
  const systolicNum = systolic.trim() ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic.trim() ? parseInt(diastolic, 10) : null;
  const pressureAlertBorder = showPressureInputs && systolicNum != null && systolicNum > 140;

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
      let effectiveSystolic = systolicNum;
      let effectiveDiastolic = diastolicNum;
      if (!showPressureInputs && bloodPressure.trim()) {
        const parsed = parsePressureInput(bloodPressure);
        if (parsed) {
          effectiveSystolic = parsed.systolic;
          effectiveDiastolic = parsed.diastolic;
        }
      }
      const bpString = showPressureInputs
        ? (systolicNum != null && diastolicNum != null ? `${systolicNum}/${diastolicNum}` : '')
        : effectiveSystolic != null && effectiveDiastolic != null
          ? `${effectiveSystolic}/${effectiveDiastolic}`
          : bloodPressure.trim() || '';
      const result = await validateMutation.mutateAsync({
        symptom_id: symptom.id,
        pain_level: painLevel ?? null,
        context: context.trim() || '',
        blood_pressure: bpString,
        heart_rate: heartRate ? parseInt(heartRate, 10) : null,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat, 10) : null,
      });
      if (result.map != null) setLastMapFromBackend(result.map);
      if (result.emergency) {
        Alert.alert(
          'Posible urgencia',
          result.message ?? 'Los signos indican posible urgencia. Considera contactar emergencias.',
          [{ text: 'Entendido' }]
        );
        return;
      }
      const details =
        (showPressureInputs && systolicNum != null && diastolicNum != null) ||
        (effectiveSystolic != null && effectiveDiastolic != null)
          ? {
              pressure: {
                systolic: effectiveSystolic ?? systolicNum!,
                diastolic: effectiveDiastolic ?? diastolicNum!,
              },
            }
          : undefined;
      const log = await createHealthLog({
        patient_id: user.id,
        symptom_id: symptom.id,
        secondary_symptom_ids: subSymptoms.length > 0 ? subSymptoms.map((s) => s.id) : [],
        pain_level: painLevel,
        context: context.trim() || null,
        details: details ?? null,
        blood_pressure: details ? undefined : (bloodPressure.trim() || undefined),
        heart_rate: heartRate ? parseInt(heartRate, 10) : null,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat, 10) : null,
        image_path: null,
      });

      if (photoUri) {
        const { uri: compressedUri } = await compressImageForSymptom(photoUri);
        const imagePath = await uploadSymptomPhoto(compressedUri, user.id, log.id);
        await updateHealthLogImagePath(log.id, imagePath);
      }

      queryClient.invalidateQueries({ queryKey: ['health-logs', user.id] });
      setPhotoUri(null);
      setSubSymptoms([]);
      setShowSuccessModal(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al validar o guardar. Revisa tu conexión.';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const showEmergency = shouldShowEmergencyAlert(painLevel);

  const goToHome = () => {
    setShowSuccessModal(false);
    setLastMapFromBackend(null);
    setSymptom(null);
    setContext('');
    setPainLevel(0);
    setBloodPressure('');
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setOxygenSat('');
    setSubSymptoms([]);
    setPhotoUri(null);
    router.replace('/(tabs)');
  };

  return (
    <>
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={goToHome}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✓ Síntoma guardado</Text>
            <Text style={styles.modalMessage}>
              El registro se guardó correctamente. Puedes verlo en Inicio.
            </Text>
            {lastMapFromBackend != null && (
              <Text style={styles.modalMapFeedback}>
                MAP: {lastMapFromBackend} mmHg
              </Text>
            )}
            <Button
              title="Volver al inicio"
              onPress={goToHome}
              fullWidth
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ResponsiveContainer forForm maxWidth={isDesktop ? 1000 : undefined} style={styles.responsiveWrap}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Registra tu Síntoma</Text>

        <Card style={styles.card}>
          {isDesktop ? (
            <View style={styles.twoColRow}>
              <View style={styles.twoColCol}>
                <View style={styles.requiredFieldWrapper}>
                  <Text style={styles.fieldLabel}>Síntoma Principal</Text>
                  <SymptomDropdown
                    options={symptoms}
                    value={symptom}
                    onChange={setSymptom}
                    onCreateOption={handleCreateSymptom}
                    placeholder="Escribe o selecciona..."
                    invalid={!symptom}
                  />
                  {!symptom && (
                    <Text style={styles.requiredLegend}>Campo obligatorio</Text>
                  )}
                </View>
                <Text style={styles.fieldLabel}>Otro síntoma</Text>
                <SymptomDropdown
                  options={symptoms}
                  value={null}
                  onChange={() => {}}
                  onCreateOption={handleCreateSymptom}
                  placeholder="Escribe o agrega otro síntoma..."
                  addOnly
                  onAdd={(item) => {
                    if (!subSymptoms.some((s) => s.id === item.id)) {
                      setSubSymptoms((prev) => [...prev, item]);
                    }
                  }}
                />
                {subSymptoms.length > 0 ? (
                  <View style={styles.badgesRow}>
                    {subSymptoms.map((s) => (
                      <View key={s.id} style={styles.badge}>
                        <Text style={styles.badgeText} numberOfLines={1}>{s.name}</Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() => setSubSymptoms((prev) => prev.filter((x) => x.id !== s.id))}
                          style={({ pressed }) => [styles.badgeRemove, pressed && styles.badgeRemovePressed]}
                        >
                          <Text style={styles.badgeRemoveText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.inputWrapDesktop}>
                  <Input
                    label="Contexto (opcional)"
                    placeholder="¿Desde cuándo? ¿Qué empeora o mejora?"
                    value={context}
                    onChangeText={setContext}
                    multiline
                  />
                </View>
              </View>
              <View style={styles.twoColCol}>
                <PainSlider value={painLevel} onChange={setPainLevel} />
                {showEmergency && <EmergencyAlert />}
                <Text style={styles.fieldLabel}>Datos fisiológicos (opcionales)</Text>
                {showPressureInputs ? (
                  <View style={styles.row}>
                    <Input
                      placeholder="Sistólica o 120/80"
                      value={systolic}
                      onChangeText={setSystolic}
                      onBlur={() => {
                        const parsed = parsePressureInput(systolic);
                        if (parsed) {
                          setSystolic(String(parsed.systolic));
                          setDiastolic(String(parsed.diastolic));
                        }
                      }}
                      keyboardType="numbers-and-punctuation"
                      style={[styles.halfInput, pressureAlertBorder && styles.inputAlertBorder]}
                    />
                    <Input
                      placeholder="Diastólica"
                      value={diastolic}
                      onChangeText={setDiastolic}
                      keyboardType="number-pad"
                      style={styles.halfInput}
                    />
                  </View>
                ) : (
                  <View style={styles.row}>
                    <Input
                      placeholder="Presión (ej. 120/80 o 120-80)"
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
                )}
                {showPressureInputs && (
                  <View style={styles.row}>
                    <Input
                      placeholder="FC"
                      value={heartRate}
                      onChangeText={setHeartRate}
                      keyboardType="number-pad"
                      style={styles.halfInput}
                    />
                    <Input
                      placeholder="Saturación O2 %"
                      value={oxygenSat}
                      onChangeText={setOxygenSat}
                      keyboardType="number-pad"
                      style={styles.halfInput}
                    />
                  </View>
                )}
                {!showPressureInputs && (
                  <Input
                    placeholder="Saturación O2 %"
                    value={oxygenSat}
                    onChangeText={setOxygenSat}
                    keyboardType="number-pad"
                  />
                )}
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
                  title="Guardar Síntoma"
                  onPress={handleSave}
                  fullWidth
                  disabled={!symptom || validateMutation.isPending || isSaving}
                  style={styles.saveButton}
                />
              </View>
            </View>
          ) : (
            <>
          <View style={styles.requiredFieldWrapper}>
            <Text style={styles.fieldLabel}>Síntoma Principal</Text>
            <SymptomDropdown
              options={symptoms}
              value={symptom}
              onChange={setSymptom}
              onCreateOption={handleCreateSymptom}
              placeholder="Escribe o selecciona..."
              invalid={!symptom}
            />
            {!symptom && (
              <Text style={styles.requiredLegend}>Campo obligatorio</Text>
            )}
          </View>

          <Text style={styles.fieldLabel}>Otro síntoma</Text>
          <SymptomDropdown
            options={symptoms}
            value={null}
            onChange={() => {}}
            onCreateOption={handleCreateSymptom}
            placeholder="Escribe o agrega otro síntoma..."
            addOnly
            onAdd={(item) => {
              if (!subSymptoms.some((s) => s.id === item.id)) {
                setSubSymptoms((prev) => [...prev, item]);
              }
            }}
          />
          {subSymptoms.length > 0 ? (
            <View style={styles.badgesRow}>
              {subSymptoms.map((s) => (
                <View key={s.id} style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>{s.name}</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setSubSymptoms((prev) => prev.filter((x) => x.id !== s.id))}
                    style={({ pressed }) => [styles.badgeRemove, pressed && styles.badgeRemovePressed]}
                  >
                    <Text style={styles.badgeRemoveText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

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
          {showPressureInputs ? (
            <View style={styles.row}>
              <Input
                placeholder="Sistólica o 120/80"
                value={systolic}
                onChangeText={setSystolic}
                onBlur={() => {
                  const parsed = parsePressureInput(systolic);
                  if (parsed) {
                    setSystolic(String(parsed.systolic));
                    setDiastolic(String(parsed.diastolic));
                  }
                }}
                keyboardType="numbers-and-punctuation"
                style={[styles.halfInput, pressureAlertBorder && styles.inputAlertBorder]}
              />
              <Input
                placeholder="Diastólica"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="number-pad"
                style={styles.halfInput}
              />
            </View>
          ) : (
            <View style={styles.row}>
              <Input
                placeholder="Presión (ej. 120/80 o 120-80)"
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
          )}
          {showPressureInputs && (
            <View style={styles.row}>
              <Input
                placeholder="FC"
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="number-pad"
                style={styles.halfInput}
              />
              <Input
                placeholder="Saturación O2 %"
                value={oxygenSat}
                onChangeText={setOxygenSat}
                keyboardType="number-pad"
                style={styles.halfInput}
              />
            </View>
          )}
          {!showPressureInputs && (
            <Input
              placeholder="Saturación O2 %"
              value={oxygenSat}
              onChangeText={setOxygenSat}
              keyboardType="number-pad"
            />
          )}
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
            title="Guardar Síntoma"
            onPress={handleSave}
            fullWidth
            disabled={!symptom || validateMutation.isPending || isSaving}
            style={styles.saveButton}
          />
            </>
          )}
        </Card>
      </ScrollView>
      </ResponsiveContainer>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  responsiveWrap: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 16,
  },
  card: { marginBottom: 16 },
  twoColRow: {
    flexDirection: 'row',
    gap: 24,
  },
  twoColCol: {
    flex: 1,
    minWidth: 0,
    maxWidth: 580,
  },
  inputWrapDesktop: {
    maxWidth: 580,
  },
  requiredFieldWrapper: {
    marginBottom: 4,
  },
  requiredLegend: {
    fontSize: 12,
    fontWeight: '600',
    color: SafeHarbor.colors.alert,
    marginTop: 6,
    marginLeft: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 12, minWidth: 0 },
  halfInput: { flex: 1, minWidth: 0 },
  inputAlertBorder: { borderColor: SafeHarbor.colors.alert, borderWidth: 2 },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SafeHarbor.colors.commentBg,
    borderRadius: SafeHarbor.spacing.cardRadius,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 4,
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
    marginRight: 4,
    maxWidth: 160,
  },
  badgeRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SafeHarbor.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRemovePressed: { opacity: 0.7 },
  badgeRemoveText: {
    fontSize: 12,
    color: SafeHarbor.colors.text,
    fontWeight: '700',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: SafeHarbor.colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalMapFeedback: {
    fontSize: 14,
    color: SafeHarbor.colors.secondary,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 0,
  },
});
