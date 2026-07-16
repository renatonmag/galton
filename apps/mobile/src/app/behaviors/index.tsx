import { Button as ShadcnButton } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text as ShadcnText } from "@/components/ui/text";
import { useBehaviorInsights, useDeleteBehaviorInsight } from "@/hooks/queries/use-behavior-insights";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { type BehaviorInsight } from "@/lib/api";
import { useRouter } from "expo-router";
import { Plus, Trash } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

export default function BehaviorsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("authored");
  const { data: insights, isLoading, isError, refetch } = useBehaviorInsights();
  useRefreshOnFocus(refetch);
  const deleteInsight = useDeleteBehaviorInsight();

  const authored = (insights ?? []).filter((i) => i.source === "authored");
  const discovered = (insights ?? []).filter((i) => i.source === "discovered");

  const handleDelete = (item: BehaviorInsight) => {
    Alert.alert("Delete behavior", `Delete "${item.text}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInsight.mutate(item.id) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <YStack flex={1} px="$5" pt="$3">
        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" />
          </YStack>
        ) : isError ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Text color="$color10">Failed to load behaviors</Text>
            <Button onPress={() => refetch()}>Retry</Button>
          </YStack>
        ) : (
          <Tabs value={tab} onValueChange={setTab} style={{ flex: 1 }}>
            <TabsList>
              <TabsTrigger value="authored">
                <ShadcnText>Authored ({authored.length})</ShadcnText>
              </TabsTrigger>
              <TabsTrigger value="discovered">
                <ShadcnText>Discovered ({discovered.length})</ShadcnText>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="authored" style={{ flex: 1 }}>
              <BehaviorList
                data={authored}
                emptyText="No hand-authored behaviors yet."
                onPress={(item) =>
                  router.push({ pathname: "/behaviors/[id]", params: { id: item.id } })
                }
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="discovered" style={{ flex: 1 }}>
              <BehaviorList
                data={discovered}
                emptyText="No discovered behaviors yet."
                onPress={(item) =>
                  router.push({ pathname: "/behaviors/[id]", params: { id: item.id } })
                }
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        )}
      </YStack>

      <YStack px="$5" pb="$3" pt="$2">
        <ShadcnButton variant="default" onPress={() => router.push("/behaviors/new")}>
          <Plus color="#fff" size={18} />
          <ShadcnText>New behavior</ShadcnText>
        </ShadcnButton>
      </YStack>
    </SafeAreaView>
  );
}

function BehaviorList({
  data,
  emptyText,
  onPress,
  onDelete,
}: {
  data: BehaviorInsight[];
  emptyText: string;
  onPress: (item: BehaviorInsight) => void;
  onDelete: (item: BehaviorInsight) => void;
}) {
  if (data.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text color="$color9">{emptyText}</Text>
      </YStack>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 10, paddingTop: 12 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <XStack
          backgroundColor="$blue3"
          borderRadius={12}
          px="$4"
          py="$3.5"
          alignItems="center"
          gap="$3"
          pressStyle={{ opacity: 0.8 }}
          onPress={() => onPress(item)}
        >
          <TypePill type={item.type} />
          <Text flex={1} fontSize="$5" color="$blue12">
            {item.text}
          </Text>
          <Button chromeless p="$1" onPress={() => onDelete(item)}>
            <Trash color="#E57373" size={18} />
          </Button>
        </XStack>
      )}
    />
  );
}

function TypePill({ type }: { type: "do" | "dont" }) {
  const isDo = type === "do";
  return (
    <YStack
      px="$2"
      py="$1"
      borderRadius={6}
      backgroundColor={isDo ? "#E6F4EA" : "#FCE8E8"}
    >
      <Text fontSize="$1" fontWeight="700" color={isDo ? "#276749" : "#9B2C2C"}>
        {isDo ? "DO" : "DON'T"}
      </Text>
    </YStack>
  );
}
