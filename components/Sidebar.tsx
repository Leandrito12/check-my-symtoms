/**
 * Sidebar para desktop: logo, enlaces de tabs y perfil. Plan arquitectura universal.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, usePathname } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { useAuth } from '@/src/hooks/useAuth';

const SIDEBAR_WIDTH = 260;

const NAV_ITEMS: { href: string; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { href: '/(tabs)', label: 'Inicio', icon: 'home' },
  { href: '/(tabs)/dashboard', label: 'Dashboard', icon: 'bar-chart' },
  { href: '/(tabs)/symptom-entry', label: 'Registrar', icon: 'plus-circle' },
  { href: '/(tabs)/two', label: 'Más', icon: 'ellipsis-h' },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/(tabs)') {
    const onOtherTab =
      pathname.includes('dashboard') ||
      pathname.includes('symptom-entry') ||
      pathname.includes('two');
    return (pathname === '/' || pathname.startsWith('/(tabs)')) && !onOtherTab;
  }
  return pathname.includes(href);
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <View style={[styles.sidebar, Platform.OS === 'web' && styles.sidebarWeb]}>
      <View style={styles.logoBlock}>
        <Text style={styles.logoText}>Check my síntomas</Text>
      </View>
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Pressable
              key={item.href}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                { opacity: pressed ? 0.85 : 1 },
                Platform.OS === 'web' && { cursor: 'pointer' },
              ]}
              onPress={() => router.push(item.href as never)}
            >
              <FontAwesome name={item.icon} size={20} color={active ? SafeHarbor.colors.primary : SafeHarbor.colors.textSecondary} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.footer}>
        {user ? (
          <>
            <Text style={styles.userName} numberOfLines={1}>
              {user.user_metadata?.full_name ?? user.email ?? 'Usuario'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.accessLink, { opacity: pressed ? 0.9 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
              onPress={() => router.push('/access' as never)}
            >
              <Text style={styles.accessLinkText}>Gestión de accesos</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.accessLink, { opacity: pressed ? 0.9 : 1 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
            onPress={() => router.push('/(auth)/login' as never)}
          >
            <Text style={styles.accessLinkText}>Iniciar sesión</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: SafeHarbor.colors.white,
    borderRightWidth: 1,
    borderRightColor: SafeHarbor.colors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  sidebarWeb: {
    cursor: 'default',
  },
  logoBlock: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: SafeHarbor.colors.primary,
  },
  nav: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: SafeHarbor.colors.backgroundSecondary,
  },
  navLabel: {
    fontSize: 15,
    color: SafeHarbor.colors.textSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: SafeHarbor.colors.primary,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: SafeHarbor.colors.border,
    paddingTop: 16,
  },
  userName: {
    fontSize: 13,
    color: SafeHarbor.colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  accessLink: {
    paddingVertical: 6,
  },
  accessLinkText: {
    fontSize: 13,
    color: SafeHarbor.colors.primary,
    fontWeight: '600',
  },
});
