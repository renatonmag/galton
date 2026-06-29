import { Stack } from "expo-router";

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="voice-match" options={{ headerShown: false }} />
    </Stack>
  );
}
