import { Stack } from "expo-router";

export default function EstrategiasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="nova" options={{ title: "Nova Estratégia" }} />
    </Stack>
  );
}
