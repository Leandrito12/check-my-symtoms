import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeHarbor } from '@/constants/SafeHarbor';
import { AccessManagementScreen } from '@/src/features/access-management';

export default function AccessScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Accesos al historial',
          headerStyle: { backgroundColor: SafeHarbor.colors.primary },
          headerTintColor: SafeHarbor.colors.white,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, padding: 12 })}
            >
              <Text style={styles.headerBack}>Volver</Text>
            </Pressable>
          ),
        }}
      />
      <AccessManagementScreen />
    </>
  );
}

const styles = StyleSheet.create({
  headerBack: {
    color: SafeHarbor.colors.white,
    fontSize: 16,
  },
});
