import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button, Input } from '@/src/components/ui';
import { useAuth } from '@/src/hooks/useAuth';

interface LoginScreenProps {
  onGoRegister: () => void;
  onSuccess?: () => void;
}

export default function LoginScreen({ onGoRegister, onSuccess }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Email y contraseña son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      onSuccess?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al iniciar sesión.';
      setError(message);
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
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Accede a tu historial de síntomas</Text>

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
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={loading ? 'Entrando...' : 'Entrar'}
          onPress={handleSubmit}
          disabled={loading}
          fullWidth
          style={styles.button}
        />
        <Button title="Crear cuenta" variant="outline" onPress={onGoRegister} fullWidth />
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
