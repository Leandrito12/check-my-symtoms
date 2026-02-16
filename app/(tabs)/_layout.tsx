import React from 'react';
import { Pressable, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';

import { SafeHarbor } from '@/constants/SafeHarbor';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useBreakpointContext } from '@/src/contexts/BreakpointContext';
import { useAuth } from '@/src/hooks/useAuth';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

function HeaderLogoutButton() {
  const router = useRouter();
  const { signOut } = useAuth();
  const handlePress = async () => {
    await signOut();
    router.replace('/(auth)/login' as never);
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { padding: 12, marginRight: 8, opacity: pressed ? 0.8 : 1 },
        Platform.OS === 'web' && { cursor: 'pointer' },
      ]}
      accessibilityLabel="Cerrar sesión"
    >
      <FontAwesome name="power-off" size={22} color={SafeHarbor.colors.white} />
    </Pressable>
  );
}

export default function TabLayout() {
  const { isDesktop } = useBreakpointContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SafeHarbor.colors.primary,
        tabBarInactiveTintColor: SafeHarbor.colors.border,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: SafeHarbor.colors.primary },
        headerTintColor: SafeHarbor.colors.white,
        headerRight: () => <HeaderLogoutButton />,
        tabBarStyle: isDesktop ? { display: 'none' } : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="symptom-entry"
        options={{
          title: 'Registrar',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Más',
          tabBarIcon: ({ color }) => <TabBarIcon name="ellipsis-h" color={color} />,
        }}
      />
    </Tabs>
  );
}
