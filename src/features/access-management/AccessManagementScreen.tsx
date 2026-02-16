/**
 * Gestión de Accesos: share_code desde profiles, solicitudes pendientes (Permitir) y médicos autorizados (Revocar).
 * Plan Share Code: lectura/auto-generación en profiles, Copiar y compartir, modal éxito grant.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';
import {
  fetchAccessRequests,
  grantAccess,
  revokeAccess,
  type PendingRequest,
  type AuthorizedDoctor,
} from '@/src/useCases';
import {
  buildSharedHistoryUrl,
  buildDoctorRequestUrl,
  getDoctorRequestShareMessage,
} from '@/src/utils/sharedHistoryUrl';
import { generateShareCode } from '@/src/utils/generateShareCode';
import { supabase } from '@/src/infrastructure/supabase';
import { Button } from '@/src/components/ui';

function formatCodeDisplay(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function AccessManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareCodeLoading, setShareCodeLoading] = useState(true);
  const [shareCodeError, setShareCodeError] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [linkCopiedFeedback, setLinkCopiedFeedback] = useState(false);
  const [grantedLinkCopiedFeedback, setGrantedLinkCopiedFeedback] = useState(false);
  const [showGrantSuccessModal, setShowGrantSuccessModal] = useState(false);
  const [lastGrantedToken, setLastGrantedToken] = useState<string | null>(null);

  const fetchOrGenerateCode = useCallback(async () => {
    if (!user?.id) return;
    setShareCodeLoading(true);
    setShareCodeError(false);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        setShareCodeLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('share_code')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;
      if (data?.share_code) {
        setShareCode(data.share_code);
      } else {
        const newCode = generateShareCode();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ share_code: newCode })
          .eq('id', authUser.id);
        if (updateError) throw updateError;
        setShareCode(newCode);
      }
    } catch {
      setShareCodeError(true);
      setShareCode(null);
    } finally {
      setShareCodeLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrGenerateCode();
  }, [fetchOrGenerateCode]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['access-requests'],
    queryFn: fetchAccessRequests,
    enabled: !!user?.id,
  });

  const grantMutation = useMutation({
    mutationFn: grantAccess,
    onSuccess: (res) => {
      setGrantingId(null);
      setLastGrantedToken(res.access_token);
      setShowGrantSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
    onError: (err) => {
      setGrantingId(null);
      Alert.alert('Error', err.message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
    onError: (err) => {
      Alert.alert('Error', err.message);
    },
  });

  const handleGrant = (req: PendingRequest) => {
    setGrantingId(req.request_id);
    grantMutation.mutate({ request_id: req.request_id });
  };

  const handleRevoke = (doc: AuthorizedDoctor) => {
    Alert.alert(
      'Revocar acceso',
      `¿Quitar el acceso de ${doc.doctor_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: () => revokeMutation.mutate({ doctor_id: doc.doctor_id }),
        },
      ]
    );
  };

  const patientName = user?.user_metadata?.full_name ?? user?.email ?? 'Yo';

  const handleShareAccess = useCallback(async () => {
    if (!shareCode) return;
    const message = getDoctorRequestShareMessage(shareCode);
    if (Platform.OS === 'web') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      try {
        await Share.share({ message, title: 'Acceso a Historial Clínico' });
      } catch {
        if (typeof window !== 'undefined') window.open(whatsappUrl, '_blank');
      }
      return;
    }
    try {
      await Share.share({
        message,
        title: 'Acceso a Historial Clínico',
      });
      Alert.alert('Listo', 'Enlace compartido.');
    } catch {
      Alert.alert('Error', 'No se pudo compartir el enlace.');
    }
  }, [shareCode]);

  const handleCopyLink = useCallback(async () => {
    if (!shareCode) return;
    const url = buildDoctorRequestUrl(shareCode);
    await Clipboard.setStringAsync(url);
    setLinkCopiedFeedback(true);
    setTimeout(() => setLinkCopiedFeedback(false), 2000);
    if (Platform.OS !== 'web') Alert.alert('Listo', 'Link copiado.');
  }, [shareCode]);

  const handleOpenWhatsAppShare = useCallback(() => {
    if (!shareCode) return;
    const message = getDoctorRequestShareMessage(shareCode);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') window.open(whatsappUrl, '_blank');
  }, [shareCode]);

  const handleShareGrantedLink = useCallback(() => {
    if (!lastGrantedToken) return;
    const url = buildSharedHistoryUrl(lastGrantedToken);
    const message = `Enlace para ver mi historial de salud: ${url}`;
    if (Platform.OS === 'web') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      Share.share({ message, title: 'Acceso al historial' }).catch(() => {
        if (typeof window !== 'undefined') window.open(whatsappUrl, '_blank');
      });
      return;
    }
    Share.share({
      message,
      url,
      title: 'Acceso al historial',
    }).catch(() => {
      Alert.alert('Acceso concedido', `Comparte este enlace con el médico:\n\n${url}`, [
        { text: 'Entendido' },
      ]);
    });
  }, [lastGrantedToken]);

  const handleCopyGrantedLink = useCallback(async () => {
    if (!lastGrantedToken) return;
    const url = buildSharedHistoryUrl(lastGrantedToken);
    await Clipboard.setStringAsync(url);
    setGrantedLinkCopiedFeedback(true);
    setTimeout(() => setGrantedLinkCopiedFeedback(false), 2000);
    if (Platform.OS !== 'web') Alert.alert('Listo', 'Link copiado.');
  }, [lastGrantedToken]);

  const closeGrantSuccessModal = useCallback(() => {
    setShowGrantSuccessModal(false);
    setLastGrantedToken(null);
    setGrantedLinkCopiedFeedback(false);
  }, []);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Inicia sesión para gestionar accesos.</Text>
        <Button title="Ir a iniciar sesión" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  const pending = data?.pending_requests ?? [];
  const authorized = data?.authorized_doctors ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Gestión de accesos</Text>
      <Text style={styles.subtitle}>
        Controla quién puede ver tu historial de salud.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tu código para compartir</Text>
        <View style={styles.codeCard}>
          {shareCodeLoading ? (
            <View style={styles.codeLoading}>
              <ActivityIndicator size="small" color={SafeHarbor.colors.primary} />
              <Text style={styles.codeHint}>Cargando código…</Text>
            </View>
          ) : shareCodeError ? (
            <>
              <Text style={styles.codeError}>Error al cargar el código</Text>
              <Button
                title="Reintentar"
                variant="outline"
                onPress={fetchOrGenerateCode}
                style={styles.retryBtn}
              />
            </>
          ) : shareCode ? (
            <>
              <Text style={styles.codeText}>{formatCodeDisplay(shareCode)}</Text>
              <Text style={styles.codeHint}>
                El médico introduce este código en la web para solicitar acceso.
              </Text>
              <View style={styles.codeActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.copyBtn,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(shareCode);
                    setCopiedFeedback(true);
                    setTimeout(() => setCopiedFeedback(false), 2000);
                    Alert.alert('Listo', 'Código copiado y listo para compartir.');
                  }}
                >
                  <Text style={styles.copyBtnText}>
                    {copiedFeedback ? 'Copiado' : 'Copiar'}
                  </Text>
                </Pressable>
                {Platform.OS === 'web' ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.copyBtn,
                        { opacity: pressed ? 0.9 : 1 },
                      ]}
                      onPress={handleCopyLink}
                    >
                      <Text style={styles.copyBtnText}>
                        {linkCopiedFeedback ? 'Link copiado' : 'Copiar Link'}
                      </Text>
                    </Pressable>
                    <Button
                      title="Enviar por WhatsApp"
                      onPress={handleOpenWhatsAppShare}
                      style={styles.shareBtn}
                    />
                  </>
                ) : (
                  <Button
                    title="Copiar y compartir"
                    onPress={handleShareAccess}
                    style={styles.shareBtn}
                  />
                )}
              </View>
            </>
          ) : null}
        </View>
        <Text style={styles.securityNote}>
          Este código es personal. Compártelo solo con tu médico.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Solicitudes pendientes</Text>
        {isLoading ? (
          <Text style={styles.empty}>Cargando…</Text>
        ) : pending.length === 0 ? (
          <Text style={styles.empty}>No hay solicitudes pendientes.</Text>
        ) : (
          pending.map((req) => (
            <View key={req.request_id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{req.doctor_name}</Text>
                {req.requested_at ? (
                  <Text style={styles.rowMeta}>
                    {new Date(req.requested_at).toLocaleDateString('es-ES')}
                  </Text>
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.allowBtn,
                  { opacity: grantingId === req.request_id ? 0.7 : pressed ? 0.9 : 1 },
                ]}
                onPress={() => handleGrant(req)}
                disabled={grantingId !== null}
              >
                {grantingId === req.request_id ? (
                  <ActivityIndicator size="small" color={SafeHarbor.colors.white} />
                ) : (
                  <Text style={styles.allowBtnText}>Permitir</Text>
                )}
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Médicos autorizados</Text>
        {isLoading ? (
          <Text style={styles.empty}>Cargando…</Text>
        ) : authorized.length === 0 ? (
          <Text style={styles.empty}>Ningún médico tiene acceso actualmente.</Text>
        ) : (
          authorized.map((doc) => (
            <View key={doc.doctor_id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{doc.doctor_name}</Text>
                {doc.granted_at ? (
                  <Text style={styles.rowMeta}>
                    Acceso desde {new Date(doc.granted_at).toLocaleDateString('es-ES')}
                  </Text>
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.revokeBtn,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => handleRevoke(doc)}
              >
                <Text style={styles.revokeBtnText}>Revocar</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={showGrantSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={closeGrantSuccessModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeGrantSuccessModal}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Acceso concedido con éxito</Text>
            <Text style={styles.modalMessage}>
              El médico ya puede ver tu historial. Comparte el enlace si no está presente.
            </Text>
            <Button
              title="Compartir enlace con el médico"
              onPress={handleShareGrantedLink}
              style={styles.modalShareBtn}
            />
            {Platform.OS === 'web' && (
              <Button
                title={grantedLinkCopiedFeedback ? 'Link copiado' : 'Copiar link'}
                variant="outline"
                onPress={handleCopyGrantedLink}
                style={styles.modalShareBtn}
              />
            )}
            <Button title="Cerrar" variant="ghost" onPress={closeGrantSuccessModal} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  content: { padding: 24, paddingBottom: 48 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: { fontSize: 16, color: SafeHarbor.colors.text, marginBottom: 16 },
  hint: { fontSize: 14, color: SafeHarbor.colors.textSecondary, marginTop: 12 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 24,
  },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 10,
  },
  codeCard: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
  },
  codeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: SafeHarbor.colors.primary,
    letterSpacing: 2,
  },
  codeError: {
    fontSize: 16,
    color: SafeHarbor.colors.alert,
    marginBottom: 12,
  },
  retryBtn: { alignSelf: 'flex-start' },
  codeHint: {
    fontSize: 12,
    color: SafeHarbor.colors.textSecondary,
    marginTop: 8,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  copyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    justifyContent: 'center',
  },
  copyBtnText: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.text },
  shareBtn: {},
  securityNote: {
    fontSize: 11,
    color: SafeHarbor.colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: SafeHarbor.colors.text },
  rowMeta: { fontSize: 12, color: SafeHarbor.colors.textSecondary, marginTop: 2 },
  allowBtn: {
    backgroundColor: SafeHarbor.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: SafeHarbor.spacing.minTapTarget,
    justifyContent: 'center',
  },
  allowBtnText: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.white },
  revokeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.alert,
    minHeight: SafeHarbor.spacing.minTapTarget,
    justifyContent: 'center',
  },
  revokeBtnText: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.alert },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: SafeHarbor.colors.white,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SafeHarbor.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: SafeHarbor.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalShareBtn: { marginBottom: 12 },
});
