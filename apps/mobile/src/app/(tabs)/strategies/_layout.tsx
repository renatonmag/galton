import { Stack } from "expo-router";

export default function StrategiesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: "Nova Estratégia" }} />
    </Stack>
  );
}
