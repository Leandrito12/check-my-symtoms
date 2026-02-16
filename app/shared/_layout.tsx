import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

class SharedErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={sharedErrorStyles.container}>
          <Text style={sharedErrorStyles.title}>Algo ha fallado en esta vista</Text>
          <Text style={sharedErrorStyles.message}>
            Puedes volver atrás o reintentar.
          </Text>
          <View style={sharedErrorStyles.actions}>
            <Pressable
              style={sharedErrorStyles.btn}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={sharedErrorStyles.btnText}>Reintentar</Text>
            </Pressable>
            <SharedErrorBoundaryBackBtn />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

function SharedErrorBoundaryBackBtn() {
  const router = useRouter();
  return (
    <Pressable
      style={[sharedErrorStyles.btn, sharedErrorStyles.btnSecondary]}
      onPress={() => router.back()}
    >
      <Text style={sharedErrorStyles.btnTextSecondary}>Volver</Text>
    </Pressable>
  );
}

const sharedErrorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: SafeHarbor.colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 24,
  },
  actions: { flexDirection: 'row', gap: 12 },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: SafeHarbor.colors.primary,
  },
  btnSecondary: { backgroundColor: SafeHarbor.colors.commentBg },
  btnText: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.white },
  btnTextSecondary: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.text },
});

export default function SharedLayout() {
  return (
    <SharedErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="history" />
        <Stack.Screen name="expired" />
      </Stack>
    </SharedErrorBoundary>
  );
}
