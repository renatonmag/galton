import { BehaviorTypeSegment } from "@/components/behavior-type-segment";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Text as ShadcnText } from "@/components/ui/text";
import {
  useBehaviorInsights,
  useDeleteBehaviorInsight,
  useUpdateBehaviorInsight,
} from "@/hooks/queries/use-behavior-insights";
import { type BehaviorInsight } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input, Text, YStack } from "tamagui";

export default function EditBehaviorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: insights, isLoading } = useBehaviorInsights();
  const insight = insights?.find((i) => i.id === id);

  useEffect(() => {
    if (!isLoading && !insight) router.back();
  }, [isLoading, insight, router]);

  if (isLoading || !insight) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" />
        </YStack>
      </SafeAreaView>
    );
  }

  return <EditBehaviorForm insight={insight} />;
}

function EditBehaviorForm({ insight }: { insight: BehaviorInsight }) {
  const router = useRouter();
  const updateBehavior = useUpdateBehaviorInsight();
  const deleteBehavior = useDeleteBehaviorInsight();
  const [text, setText] = useState(insight.text);
  const [type, setType] = useState<"do" | "dont">(insight.type);

  const canSave =
    text.trim().length > 0 &&
    (text.trim() !== insight.text || type !== insight.type) &&
    !updateBehavior.isPending;

  const save = async () => {
    if (!canSave) return;
    await updateBehavior.mutateAsync({ id: insight.id, text: text.trim(), type });
    router.back();
  };

  const remove = () => {
    Alert.alert("Delete behavior", `Delete "${insight.text}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBehavior.mutateAsync(insight.id);
          router.back();
        },
      },
    ]);
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
          />
          <Text fontSize="$3" fontWeight="600" color="$blue12">
            Type
          </Text>
          <BehaviorTypeSegment value={type} onChange={setType} />
        </YStack>

        <YStack px="$5" pb="$3" gap="$2.5">
          <ShadcnButton variant="default" disabled={!canSave} onPress={save}>
            <ShadcnText>Save</ShadcnText>
          </ShadcnButton>
          <ShadcnButton variant="destructive" onPress={remove}>
            <ShadcnText>Delete</ShadcnText>
          </ShadcnButton>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
