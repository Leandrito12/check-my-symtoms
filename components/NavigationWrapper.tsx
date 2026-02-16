/**
 * Envuelve la navegación: en desktop muestra Sidebar + área de contenido; en mobile solo hijos.
 * Plan arquitectura universal.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpointContext } from '@/src/contexts/BreakpointContext';
import { Sidebar } from './Sidebar';

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useBreakpointContext();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={styles.row}>
      <Sidebar />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
