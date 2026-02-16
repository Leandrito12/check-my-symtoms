/**
 * Card de una nota de historia clínica. Borde lateral por tipo.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { Card, StyledText, Badge, Tag } from '@/src/components/ui';
import type { ClinicalRecord } from '@/src/domain/ClinicalRecord';
import type { ClinicalRecordType } from '@/src/domain/ClinicalRecord';

function getTypeColor(recordType: ClinicalRecordType): string {
  switch (recordType) {
    case 'evolucion':
      return SafeHarbor.colors.secondary;
    case 'estudio':
      return SafeHarbor.colors.primary;
    case 'diagnostico':
      return SafeHarbor.painLevelColors.attention;
    case 'medicacion':
      return SafeHarbor.colors.primary;
    default:
      return SafeHarbor.colors.border;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ClinicalRecordItemProps {
  record: ClinicalRecord;
}

export function ClinicalRecordItem({ record }: ClinicalRecordItemProps) {
  const borderColor = getTypeColor(record.record_type);
  return (
    <Card
      style={[
        styles.card,
        { borderLeftWidth: 4, borderLeftColor: borderColor },
      ]}
    >
      <View style={styles.header}>
        <View>
          <StyledText variant="h4" style={styles.doctorName}>
            Dr/a. {record.doctor_name}
          </StyledText>
          <StyledText variant="caption" style={styles.date}>
            {formatDate(record.created_at)}
          </StyledText>
        </View>
        <Badge label={record.record_type} color={borderColor} />
      </View>
      <StyledText variant="body" style={styles.content}>
        {record.note_content}
      </StyledText>
      {record.tags && record.tags.length > 0 && (
        <View style={styles.tagContainer}>
          {record.tags.map((tag) => (
            <Tag key={tag} label={`#${tag}`} />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SafeHarbor.colors.backgroundSecondary,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  doctorName: { marginBottom: 2 },
  date: { marginTop: 0 },
  content: { marginBottom: 8 },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
});
