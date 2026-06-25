/**
 * Frecuencia de síntomas como ranking horizontal (lista de progreso).
 * Cada fila: nombre + total arriba, y una barra de ancho COMPLETO debajo que
 * arranca en 0 (borde izquierdo) para comparar de un vistazo. Orden: más frecuente primero.
 * Nombre truncado a 20 caracteres con "…"; tocar muestra el nombre completo.
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
      <View style={styles.rowTop}>
        <Pressable
          style={styles.nameCell}
          onPress={onNamePress}
          disabled={!isTruncated}
          accessibilityLabel={item.symptomName}
          accessibilityHint={isTruncated ? 'Toca para ver nombre completo' : undefined}
        >
          <Text
            style={[styles.nameText, isTruncated && styles.nameTextTappable]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>
        </Pressable>
        <Text style={styles.countText}>{item.count}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(100, progress * 100)}%` }]} />
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
          <Text style={styles.axisTick}>0</Text>
          <Text style={styles.axisLabel}>Registros</Text>
          <Text style={styles.axisTick}>{maxCount}</Text>
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
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SafeHarbor.colors.border,
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SafeHarbor.colors.textSecondary,
  },
  axisTick: {
    fontSize: 11,
    color: SafeHarbor.colors.textSecondary,
  },
  listScroll: {
    overflow: 'hidden',
  },
  listContent: {
    paddingRight: 4,
  },
  row: {
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
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
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameCell: {
    flex: 1,
    paddingRight: 8,
  },
  nameText: {
    fontSize: 14,
    color: SafeHarbor.colors.text,
  },
  nameTextTappable: {
    color: SafeHarbor.colors.primary,
  },
  barTrack: {
    height: BAR_HEIGHT,
    width: '100%',
    backgroundColor: SafeHarbor.colors.commentBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: SafeHarbor.colors.primary,
    borderRadius: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: SafeHarbor.colors.text,
  },
});
