/**
 * Frecuencia de síntomas como ranking horizontal (lista de progreso).
 * Analítica móvil: nombres a la izquierda (más espacio), barra de progreso y total a la derecha.
 * Orden: más frecuente primero. Truncado a 20 caracteres con "…"; tocar muestra nombre completo.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { ChartCard } from './ChartCard';
import { truncateSymptomName } from './utils';
import type { SymptomFrequencyItem } from './utils';

const MAX_NAME_LEN = 20;
const ROW_MIN_HEIGHT = 44;
const BAR_HEIGHT = 20;
const LABEL_LEFT_MIN = 100;

interface SymptomFrequencyBarChartProps {
  data: SymptomFrequencyItem[];
  /** Nombre del síntoma seleccionado en el filtro (lowercase) para resaltar la fila. */
  selectedSymptomName?: string | null;
  emptyMessage?: string;
}

function RankingRow({
  item,
  maxCount,
  isLast,
  isSelected,
}: {
  item: SymptomFrequencyItem;
  maxCount: number;
  isLast: boolean;
  isSelected: boolean;
}) {
  const displayName = truncateSymptomName(item.symptomName, MAX_NAME_LEN);
  const isTruncated = item.symptomName.length > MAX_NAME_LEN;
  const progress = maxCount > 0 ? item.count / maxCount : 0;

  const onNamePress = () => {
    if (isTruncated) {
      Alert.alert(item.symptomName, undefined, [{ text: 'OK' }]);
    }
  };

  return (
    <View style={[styles.row, isLast && styles.rowLast, isSelected && styles.rowSelected]}>
      <Pressable
        style={styles.nameCell}
        onPress={onNamePress}
        disabled={!isTruncated}
        accessibilityLabel={item.symptomName}
        accessibilityHint={isTruncated ? 'Toca para ver nombre completo' : undefined}
      >
        <Text
          style={[styles.nameText, isTruncated && styles.nameTextTappable]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
      </Pressable>
      <View style={styles.barCell}>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, progress * 100)}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.countCell}>
        <Text style={styles.countText}>{item.count}</Text>
      </View>
    </View>
  );
}

const VIEWPORT_HEIGHT_MAX_RATIO = 0.7;

export function SymptomFrequencyBarChart({
  data,
  selectedSymptomName = null,
  emptyMessage,
}: SymptomFrequencyBarChartProps) {
  const { height: viewportHeight } = useWindowDimensions();
  const maxListHeight = Math.round(viewportHeight * VIEWPORT_HEIGHT_MAX_RATIO);

  const maxCount = useMemo(
    () => (data.length > 0 ? Math.max(...data.map((d) => d.count), 1) : 1),
    [data]
  );

  if (data.length === 0) {
    return (
      <ChartCard
        title="Frecuencia de síntomas"
        empty
        emptyMessage={emptyMessage ?? 'Sin registros de síntomas en este periodo.'}
      />
    );
  }

  return (
    <ChartCard title="Frecuencia de síntomas" fullWidth>
      <View style={styles.wrapper}>
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>Registros</Text>
          <View style={styles.axisBarZone}>
            <Text style={styles.axisTick}>0</Text>
            <Text style={[styles.axisTick, styles.axisTickEnd]}>{maxCount}</Text>
          </View>
        </View>
        <ScrollView
          style={[styles.listScroll, { maxHeight: maxListHeight }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {data.map((item, index) => {
            const isSelected =
              !!selectedSymptomName &&
              item.symptomName.trim().toLowerCase() === selectedSymptomName;
            return (
              <RankingRow
                key={`${item.symptomId}-${item.symptomName}`}
                item={item}
                maxCount={maxCount}
                isLast={index === data.length - 1}
                isSelected={isSelected}
              />
            );
          })}
        </ScrollView>
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: 4,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 4,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: SafeHarbor.colors.border,
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SafeHarbor.colors.textSecondary,
    minWidth: LABEL_LEFT_MIN,
  },
  axisBarZone: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 16,
  },
  axisTick: {
    fontSize: 11,
    color: SafeHarbor.colors.textSecondary,
  },
  axisTickEnd: {
    marginLeft: 'auto',
  },
  listScroll: {
    overflow: 'hidden',
  },
  listContent: {
    paddingRight: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: 10,
    paddingLeft: 4,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SafeHarbor.colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowSelected: {
    backgroundColor: `${SafeHarbor.colors.primary}18`,
    borderLeftWidth: 4,
    borderLeftColor: SafeHarbor.colors.primary,
  },
  nameCell: {
    minWidth: LABEL_LEFT_MIN,
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  nameText: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
  },
  nameTextTappable: {
    color: SafeHarbor.colors.primary,
  },
  barCell: {
    flex: 1,
    minWidth: 60,
  },
  barTrack: {
    height: BAR_HEIGHT,
    backgroundColor: SafeHarbor.colors.commentBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: SafeHarbor.colors.primary,
    borderRadius: 4,
  },
  countCell: {
    width: 32,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
  },
});
