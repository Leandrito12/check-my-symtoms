/**
 * Envuelve la navegación: en desktop muestra Sidebar + área de contenido; en mobile solo hijos.
 * En login/registro no se muestra el sidebar para que el formulario quede centrado.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { useBreakpointContext } from '@/src/contexts/BreakpointContext';
import { Sidebar } from './Sidebar';

function isAuthRoute(pathname: string): boolean {
  return pathname.includes('login') || pathname.includes('register') || pathname.includes('(auth)');
}

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useBreakpointContext();
  const pathname = usePathname();

  if (!isDesktop || isAuthRoute(pathname)) {
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
