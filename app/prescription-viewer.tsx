import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { usePrescriptionViewer } from '@/src/contexts/PrescriptionViewerContext';

export default function PrescriptionViewerScreen() {
  const router = useRouter();
  const { url, urlRef, setPrescriptionUrl } = usePrescriptionViewer();
  const displayUrl = url ?? urlRef.current;

  useEffect(() => {
    return () => setPrescriptionUrl(null);
  }, [setPrescriptionUrl]);

  const handleClose = () => {
    setPrescriptionUrl(null);
    router.back();
  };

  if (!displayUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Receta</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={SafeHarbor.colors.primary} />
          <Text style={styles.message}>Cargando receta…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>Cerrar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Receta</Text>
      </View>
      <WebView
        source={{ uri: displayUrl }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={SafeHarbor.colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: SafeHarbor.colors.primary,
  },
  closeBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  closeText: { fontSize: 16, color: SafeHarbor.colors.white, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: SafeHarbor.colors.white },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SafeHarbor.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  message: { fontSize: 16, color: SafeHarbor.colors.text },
});
