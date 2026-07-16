import { Stack } from "expo-router";

export default function BehaviorsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Behaviors" }} />
      <Stack.Screen name="new" options={{ title: "New behavior" }} />
      <Stack.Screen name="[id]/index" options={{ title: "Edit behavior" }} />
    </Stack>
  );
}
