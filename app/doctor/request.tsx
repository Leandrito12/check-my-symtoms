/**
 * Portal de entrada del médico: ingresar código de paciente y solicitar acceso.
 * Plan Historial Compartido con el Médico (P2).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { requestAccess } from '@/src/useCases';

export default function DoctorRequestScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [shareCode, setShareCode] = useState('');
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    const code = params.code?.trim();
    if (code) setShareCode(code.toUpperCase());
  }, [params.code]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const code = shareCode.trim();
    if (!code) {
      setError('Introduce el código del paciente.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestAccess({
        share_code: code,
        doctor_name: doctorName.trim() || 'Médico',
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Solicitud enviada</Text>
        <Text style={styles.message}>
          El paciente debe autorizarte en su app. Cuando lo haga, te compartirá un
          enlace para ver su historial.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Solicitar historial del paciente</Text>
      <Text style={styles.subtitle}>
        Introduce el código que te dio el paciente.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Código de paciente (ej. X79-B22)"
        placeholderTextColor={SafeHarbor.colors.textSecondary}
        value={shareCode}
        onChangeText={(t) => { setShareCode(t); setError(null); }}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!loading}
      />

      <TextInput
        style={[styles.input, styles.inputSecondary]}
        placeholder="Tu nombre (opcional)"
        placeholderTextColor={SafeHarbor.colors.textSecondary}
        value={doctorName}
        onChangeText={setDoctorName}
        editable={!loading}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { opacity: loading ? 0.7 : pressed ? 0.9 : 1 },
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={SafeHarbor.colors.white} />
        ) : (
          <Text style={styles.buttonText}>Solicitar historial</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: SafeHarbor.colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: SafeHarbor.colors.white,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    fontSize: 18,
    color: SafeHarbor.colors.text,
    marginBottom: 12,
    minHeight: SafeHarbor.spacing.minTapTarget,
  },
  inputSecondary: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: SafeHarbor.colors.alert,
    marginBottom: 12,
  },
  button: {
    backgroundColor: SafeHarbor.colors.primary,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    minHeight: SafeHarbor.spacing.minTapTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SafeHarbor.colors.white,
  },
  message: {
    fontSize: 16,
    color: SafeHarbor.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
