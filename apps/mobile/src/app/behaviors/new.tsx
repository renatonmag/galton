import { BehaviorTypeSegment } from "@/components/behavior-type-segment";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Text as ShadcnText } from "@/components/ui/text";
import { useCreateBehaviorInsight } from "@/hooks/queries/use-behavior-insights";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input, Text, YStack } from "tamagui";

export default function NewBehaviorScreen() {
  const router = useRouter();
  const createBehavior = useCreateBehaviorInsight();
  const [text, setText] = useState("");
  const [type, setType] = useState<"do" | "dont" | null>(null);

  const canSave = text.trim().length > 0 && type !== null && !createBehavior.isPending;

  const save = async () => {
    if (!canSave || type === null) return;
    await createBehavior.mutateAsync({ text: text.trim(), type });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <YStack flex={1} px="$5" pt="$4" gap="$3.5">
          <Text fontSize="$3" fontWeight="600" color="$blue12">
            Behavior
          </Text>
          <Input
            size="$4"
            borderRadius={10}
            value={text}
            onChangeText={setText}
            placeholder="e.g. Exit at target"
            autoFocus
          />
          <Text fontSize="$3" fontWeight="600" color="$blue12">
            Type
          </Text>
          <BehaviorTypeSegment value={type} onChange={setType} />
        </YStack>

        <YStack px="$5" pb="$3">
          <ShadcnButton variant="default" disabled={!canSave} onPress={save}>
            <ShadcnText>Save</ShadcnText>
          </ShadcnButton>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
