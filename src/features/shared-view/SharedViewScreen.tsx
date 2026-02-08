import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { sharedLogGet } from '@/src/useCases';
import { Card } from '@/src/components/ui';
import { SkeletonLog } from '@/src/components/ui/SkeletonLog';
import { CommentForm } from './CommentForm';

function getPainColor(level: number): string {
  if (level <= 3) return SafeHarbor.painLevelColors.calm;
  if (level <= 5) return SafeHarbor.painLevelColors.attention;
  return SafeHarbor.painLevelColors.alert;
}

interface SharedViewScreenProps {
  logId: string;
}

export function SharedViewScreen({ logId }: SharedViewScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-log', logId],
    queryFn: () => sharedLogGet(logId),
    enabled: !!logId,
  });

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
        <View style={[styles.header, isDesktop && styles.headerDesktop]} />
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
      </View>
    );
  }

  const { log, comments } = data;

  return (
    <View style={styles.container}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <Text style={styles.headerTitle}>Vista compartida – Síntoma</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.logCard}>
          <View style={styles.logRow}>
            <Text style={styles.symptomName}>{log.symptom_name}</Text>
            <View style={[styles.painBadge, { backgroundColor: getPainColor(log.pain_level) }]}>
              <Text style={styles.painText}>{log.pain_level}</Text>
            </View>
          </View>
          {log.context ? (
            <Text style={styles.context}>{log.context}</Text>
          ) : null}
          <View style={styles.vitals}>
            {log.blood_pressure ? (
              <Text style={styles.vital}>Presión: {log.blood_pressure}</Text>
            ) : null}
            {log.heart_rate != null ? (
              <Text style={styles.vital}>FC: {log.heart_rate}</Text>
            ) : null}
            {log.oxygen_saturation != null ? (
              <Text style={styles.vital}>Sat O2: {log.oxygen_saturation}%</Text>
            ) : null}
          </View>
          <Text style={styles.date}>
            {new Date(log.created_at).toLocaleDateString('es-ES', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </Card>

        <Text style={styles.commentsTitle}>Comentarios y prescripciones</Text>
        <CommentForm logId={logId} />
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
                <Text style={styles.commentAttachment}>Adjunto: archivo</Text>
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
  },
  headerDesktop: { paddingVertical: 20 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SafeHarbor.colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  scrollContentDesktop: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  logCard: { marginBottom: 24 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
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
  vitals: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  vital: { fontSize: 13, color: SafeHarbor.colors.text, opacity: 0.9 },
  date: { fontSize: 12, color: SafeHarbor.colors.text, opacity: 0.7 },
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
  commentAuthor: { fontSize: 13, fontWeight: '600', color: SafeHarbor.colors.text, marginBottom: 4 },
  commentContent: { fontSize: 14, color: SafeHarbor.colors.text },
  commentAttachment: { fontSize: 12, color: SafeHarbor.colors.primary, marginTop: 4 },
  commentDate: { fontSize: 11, color: SafeHarbor.colors.text, opacity: 0.6, marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: SafeHarbor.colors.alert, textAlign: 'center' },
});
