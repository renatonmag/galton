import { api, type Session } from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { SquarePen, Trash } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editMode, setEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.sessions
        .$get()
        .then((r) => r.json())
        .then(({ sessions }) => setSessions(sessions));
    }, []),
  );

  const createSession = useCallback(async () => {
    const res = await api.sessions.$post({ json: {} });
    const { session } = await res.json();
    setSessions((prev) => [session, ...prev]);
  }, []);

  const deleteSession = useCallback((id: string, name: string) => {
    Alert.alert("Delete session", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.sessions[":id"].$delete({ param: { id } });
          setSessions((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <YStack flex={1} px="$5" pt="$3">
        <XStack alignItems="center" justifyContent="space-between" mb="$4">
          <Text fontSize={22} fontWeight="700" color="$blue12">
            Sessions
          </Text>
          <Button chromeless p="$1" onPress={() => setEditMode((v) => !v)}>
            <SquarePen color={editMode ? "#6FA8DC" : "#1A3A5C"} size={20} />
          </Button>
        </XStack>

        <FlatList
          data={sessions}
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
                  onPress={() => deleteSession(item.id, item.name)}
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
      </YStack>

      <YStack px="$5" pb="$3">
        <Button
          theme="blue"
          size="$5"
          borderRadius={12}
          onPress={createSession}
        >
          New session
        </Button>
      </YStack>
    </SafeAreaView>
  );
}
