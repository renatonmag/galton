import { Stack } from "expo-router";

export default function SetupLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[setupId]" options={{ headerShown: false }} />
      <Stack.Screen name="nova-caracteristica" options={{ headerShown: false }} />
    </Stack>
  );
}
