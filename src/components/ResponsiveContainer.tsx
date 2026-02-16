/**
 * Contenedor con max-width y padding horizontal adaptativo. Centra el contenido en pantallas grandes.
 * Plan arquitectura universal.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpointContext } from '@/src/contexts/BreakpointContext';

const DEFAULT_MAX_WIDTH = 1200;
const FORM_MAX_WIDTH = 800;
const PADDING_MOBILE = 16;
const PADDING_DESKTOP = 40;

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  forForm?: boolean;
  style?: ViewStyle;
}

export function ResponsiveContainer({
  children,
  maxWidth,
  forForm = false,
  style,
}: ResponsiveContainerProps) {
  const { isDesktop } = useBreakpointContext();
  const effectiveMaxWidth = maxWidth ?? (forForm ? FORM_MAX_WIDTH : DEFAULT_MAX_WIDTH);
  const paddingHorizontal = isDesktop ? PADDING_DESKTOP : PADDING_MOBILE;

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: effectiveMaxWidth,
          paddingHorizontal,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
});
