import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { usePrescriptionViewer } from '@/src/contexts/PrescriptionViewerContext';
import { getSharedViewUrl } from '@/src/utils/sharedViewUrl';
import { sharedLogGet, prescriptionSignedUrl } from '@/src/useCases';
import { Card } from '@/src/components/ui';
import { SkeletonLog } from '@/src/components/ui/SkeletonLog';

function getPainColor(level: number): string {
  if (level <= 3) return SafeHarbor.painLevelColors.calm;
  if (level <= 5) return SafeHarbor.painLevelColors.attention;
  return SafeHarbor.painLevelColors.alert;
}

export default function PatientLogDetailScreen() {
  const { log_id: logId } = useLocalSearchParams<{ log_id: string }>();
  const router = useRouter();
  const { setPrescriptionUrl } = usePrescriptionViewer();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-log', logId],
    queryFn: () => sharedLogGet(logId!),
    enabled: !!logId,
  });

  const openPrescription = async (commentId: string) => {
    try {
      const { url } = await prescriptionSignedUrl({
        log_id: logId!,
        comment_id: commentId,
      });
      setPrescriptionUrl(url);
      router.push('/prescription-viewer');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir la receta.');
    }
  };

  const shareWithDoctor = useCallback(async () => {
    const url = getSharedViewUrl(logId!);
    try {
      await Share.share({
        message: url,
        title: 'Ver mi síntoma',
        url,
      });
    } catch {
      // Usuario canceló
    }
  }, [logId]);

  if (!logId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Falta el identificador del registro.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header} />
        <SkeletonLog />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'No se pudo cargar el registro.'}
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const { log, comments } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.headerBack}>← Volver</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Detalle del síntoma</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.logCard}>
          <View style={styles.logRow}>
            <Text style={styles.symptomName}>{log.symptom_name}</Text>
            <View style={[styles.painBadge, { backgroundColor: getPainColor(log.pain_level) }]}>
              <Text style={styles.painText}>{log.pain_level}</Text>
            </View>
          </View>
          {log.context ? <Text style={styles.context}>{log.context}</Text> : null}
          <Text style={styles.date}>
            {new Date(log.created_at).toLocaleDateString('es-ES', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </Card>

        <Pressable
          style={({ pressed }) => [styles.shareCardBtn, { opacity: pressed ? 0.9 : 1 }]}
          onPress={shareWithDoctor}
        >
          <Text style={styles.shareCardBtnText}>Compartir con el médico</Text>
        </Pressable>

        <Text style={styles.commentsTitle}>Comentarios y recetas</Text>
        {comments.length === 0 ? (
          <Text style={styles.emptyComments}>Aún no hay comentarios.</Text>
        ) : (
          comments.map((c) => (
            <View key={c.id} style={styles.commentBubble}>
              {c.author_name ? (
                <Text style={styles.commentAuthor}>{c.author_name}</Text>
              ) : null}
              <Text style={styles.commentContent}>{c.content}</Text>
              {c.attachment_path ? (
                <Pressable
                  style={({ pressed }) => [styles.verRecetaBtn, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => openPrescription(c.id)}
                >
                  <Text style={styles.verRecetaText}>Ver receta</Text>
                </Pressable>
              ) : null}
              <Text style={styles.commentDate}>
                {new Date(c.created_at).toLocaleDateString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SafeHarbor.colors.background },
  header: {
    backgroundColor: SafeHarbor.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBack: { fontSize: 16, color: SafeHarbor.colors.white, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: SafeHarbor.colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  logCard: { marginBottom: 24 },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomName: { fontSize: 18, fontWeight: '600', color: SafeHarbor.colors.text },
  painBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  painText: { fontSize: 16, fontWeight: '700', color: SafeHarbor.colors.white },
  context: { fontSize: 14, color: SafeHarbor.colors.text, marginBottom: 8 },
  date: { fontSize: 12, color: SafeHarbor.colors.text, opacity: 0.7 },
  shareCardBtn: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.white,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.primary,
    alignSelf: 'flex-start',
  },
  shareCardBtnText: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.primary },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 12,
  },
  emptyComments: { fontSize: 14, color: SafeHarbor.colors.text, opacity: 0.7 },
  commentBubble: {
    backgroundColor: SafeHarbor.colors.commentBg,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 14,
    marginBottom: 12,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 4,
  },
  commentContent: { fontSize: 14, color: SafeHarbor.colors.text },
  verRecetaBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: SafeHarbor.spacing.cardRadius,
    backgroundColor: SafeHarbor.colors.primary,
  },
  verRecetaText: { fontSize: 14, fontWeight: '600', color: SafeHarbor.colors.white },
  commentDate: {
    fontSize: 11,
    color: SafeHarbor.colors.text,
    opacity: 0.6,
    marginTop: 4,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: SafeHarbor.colors.alert, textAlign: 'center' },
  backBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 },
  backBtnText: { fontSize: 16, color: SafeHarbor.colors.primary, fontWeight: '600' },
});
