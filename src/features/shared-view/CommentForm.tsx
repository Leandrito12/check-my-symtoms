import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Button, Input } from '@/src/components/ui';
import { sharedLogPost, uploadPrescription } from '@/src/useCases';

const MIN_TAP = SafeHarbor.spacing.minTapTarget;

interface CommentFormProps {
  logId: string;
}

export function CommentForm({ logId }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [attachment, setAttachment] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Escribe el comentario.');
      if (attachment) {
        return uploadPrescription({
          log_id: logId,
          content: trimmed,
          author_name: authorName.trim() || undefined,
          fileUri: attachment.uri,
          fileName: attachment.name,
          fileType: attachment.mimeType ?? 'application/pdf',
        });
      }
      return sharedLogPost({
        log_id: logId,
        content: trimmed,
        author_name: authorName.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-log', logId] });
      setContent('');
      setAuthorName('');
      setAttachment(null);
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message);
    },
  });

  const handleAttach = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setAttachment({
        uri: file.uri,
        name: file.name ?? 'archivo',
        mimeType: file.mimeType ?? undefined,
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo seleccionar el archivo.');
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const canSubmit = content.trim().length > 0 && !submitMutation.isPending;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Añadir comentario o prescripción</Text>
      <Input
        label="Tu nombre (opcional)"
        placeholder="Ej. Dr. García"
        value={authorName}
        onChangeText={setAuthorName}
        editable={!submitMutation.isPending}
      />
      <Input
        label="Comentario"
        placeholder="Escribe el comentario o indicación..."
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={3}
        style={styles.contentInput}
        editable={!submitMutation.isPending}
      />
      <View style={styles.attachRow}>
        <Pressable
          onPress={handleAttach}
          style={({ pressed }) => [
            styles.attachBtn,
            { opacity: submitMutation.isPending ? 0.6 : pressed ? 0.8 : 1 },
          ]}
          disabled={submitMutation.isPending}
          hitSlop={8}
        >
          <Text style={styles.attachBtnText}>
            {attachment ? `Adjunto: ${attachment.name}` : 'Adjuntar PDF o imagen'}
          </Text>
        </Pressable>
        {attachment ? (
          <Pressable
            onPress={() => setAttachment(null)}
            style={styles.removeAttach}
            hitSlop={8}
          >
            <Text style={styles.removeAttachText}>Quitar</Text>
          </Pressable>
        ) : null}
      </View>
      <Button
        title={submitMutation.isPending ? 'Enviando…' : 'Enviar comentario'}
        onPress={handleSubmit}
        disabled={!canSubmit}
        fullWidth
        style={{ minHeight: MIN_TAP }}
      />
      {submitMutation.isPending ? (
        <ActivityIndicator size="small" color={SafeHarbor.colors.primary} style={styles.loader} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: SafeHarbor.colors.commentBg,
    borderRadius: SafeHarbor.spacing.cardRadius,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
    marginBottom: 12,
  },
  contentInput: { minHeight: 80 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  attachBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: SafeHarbor.spacing.cardRadius,
    borderWidth: 1,
    borderColor: SafeHarbor.colors.border,
    backgroundColor: SafeHarbor.colors.white,
  },
  attachBtnText: { fontSize: 14, color: SafeHarbor.colors.primary, fontWeight: '500' },
  removeAttach: { paddingVertical: 8, paddingHorizontal: 4 },
  removeAttachText: { fontSize: 13, color: SafeHarbor.colors.alert },
  loader: { marginTop: 8 },
});
