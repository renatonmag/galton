import { useCreateSession, useDeleteSession, useSessions } from "@/hooks/queries/use-sessions";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Text as ShadcnText } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { FileText, SquarePen, Trash } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

export default function SessionsScreen() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);

  const { data: sessions, isLoading, isError, refetch } = useSessions();
  useRefreshOnFocus(refetch);
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete session", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSession.mutate(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <YStack flex={1} px="$5" pt="$3">
        <XStack alignItems="center" justifyContent="space-between" mb="$4">
          <Text fontSize={22} fontWeight="700" color="$blue12">
            Sessions
          </Text>
          <XStack alignItems="center" gap="$3">
            <Button chromeless p="$1" onPress={() => router.push("/(tabs)/sessions/reports")}>
              <FileText color="#1A3A5C" size={20} />
            </Button>
            <Button chromeless p="$1" onPress={() => setEditMode((v) => !v)}>
              <SquarePen color={editMode ? "#6FA8DC" : "#1A3A5C"} size={20} />
            </Button>
          </XStack>
        </XStack>

        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" />
          </YStack>
        ) : isError ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Text color="$color10">Failed to load sessions</Text>
            <Button onPress={() => refetch()}>Retry</Button>
          </YStack>
        ) : (
          <FlatList
            data={sessions ?? []}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <XStack
                backgroundColor="$blue3"
                borderRadius={12}
                px="$4"
                py="$3.5"
                alignItems="center"
                pressStyle={{ opacity: 0.8 }}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/sessions/[id]",
                    params: { id: item.id, name: item.name },
                  })
                }
              >
                <Text flex={1} fontSize="$5" color="$blue12">
                  {item.name}
                </Text>
                {editMode ? (
                  <Button
                    chromeless
                    p="$1"
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Trash color="#E57373" size={18} />
                  </Button>
                ) : (
                  <Text fontSize="$3" color="$color10" fontWeight="500">
                    {item.tradeCount} trades
                  </Text>
                )}
              </XStack>
            )}
          />
        )}
      </YStack>

      <YStack px="$5" pb="$3">
        <ShadcnButton
          variant="default"
          disabled={createSession.isPending}
          onPress={() => createSession.mutate()}
        >
          <ShadcnText>New session</ShadcnText>
        </ShadcnButton>
      </YStack>
    </SafeAreaView>
  );
}
