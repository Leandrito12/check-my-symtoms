import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { SafeHarbor } from '@/constants/SafeHarbor';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SafeHarbor.colors.primary,
        tabBarInactiveTintColor: SafeHarbor.colors.border,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: SafeHarbor.colors.primary },
        headerTintColor: SafeHarbor.colors.white,
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
