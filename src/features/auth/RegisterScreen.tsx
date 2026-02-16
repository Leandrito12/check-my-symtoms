import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button, Input } from '@/src/components/ui';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/utils/authErrors';

interface RegisterScreenProps {
  onGoLogin: () => void;
}

export default function RegisterScreen({ onGoLogin }: RegisterScreenProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Email y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, { displayName: displayName.trim() || undefined });
      onGoLogin();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, 'signUp') || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Regístrate para guardar tus síntomas</Text>

        <Input
          label="Nombre (opcional)"
          placeholder="Tu nombre"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Input
          label="Email"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Contraseña"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={loading ? 'Creando...' : 'Registrarme'}
          onPress={handleSubmit}
          disabled={loading}
          fullWidth
          style={styles.button}
        />
        <Button title="Ya tengo cuenta" variant="outline" onPress={onGoLogin} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: SafeHarbor.colors.text,
    opacity: 0.8,
    marginBottom: 24,
  },
  error: {
    color: SafeHarbor.colors.alert,
    fontSize: 14,
    marginBottom: 12,
  },
  button: { marginTop: 8, marginBottom: 12 },
});
