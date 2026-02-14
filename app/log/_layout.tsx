import { Stack } from 'expo-router';

export default function LogLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="[log_id]" />
    </Stack>
  );
}
