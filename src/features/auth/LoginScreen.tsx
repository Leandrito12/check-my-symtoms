import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button, Input } from '@/src/components/ui';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/utils/authErrors';

interface LoginScreenProps {
  onGoRegister: () => void;
  onSuccess?: () => void;
}

export default function LoginScreen({ onGoRegister, onSuccess }: LoginScreenProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      setError(getAuthErrorMessage(e, 'signIn') || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, 'google') || 'No se pudo iniciar sesión con Google.');
    } finally {
      setGoogleLoading(false);
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
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>
        <Button
          title={googleLoading ? 'Conectando...' : 'Continuar con Google'}
          variant="outline"
          onPress={handleGoogle}
          disabled={googleLoading || loading}
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SafeHarbor.colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
    opacity: 0.7,
  },
});
