import { api, type Session } from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { SquarePen, Trash } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function SessoesScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editMode, setEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.sessions.$get()
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
    Alert.alert(
      "Excluir sessão",
      `Deseja excluir "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await api.sessions[":id"].$delete({ param: { id } });
            setSessions((prev) => prev.filter((s) => s.id !== id));
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Sessões</Text>
          <TouchableOpacity onPress={() => setEditMode((v) => !v)} activeOpacity={0.7}>
            <SquarePen color={editMode ? BLUE : DARK_BLUE} size={20} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/sessoes/[id]",
                  params: { id: item.id, name: item.name },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.sessionCardText, { flex: 1 }]}>{item.name}</Text>
              {editMode ? (
                <TouchableOpacity
                  onPress={() => deleteSession(item.id, item.name)}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Trash color="#E57373" size={18} />
                </TouchableOpacity>
              ) : (
                <View style={item.closedAt === null ? styles.badgeOpen : styles.badgeClosed}>
                  <Text style={item.closedAt === null ? styles.badgeOpenText : styles.badgeClosedText}>
                    {item.closedAt === null ? "Aberta" : "Encerrada"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={createSession} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Nova sessão</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const BLUE = "#6FA8DC";
const DARK_BLUE = "#1A3A5C";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK_BLUE,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: "#D6E8FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  sessionCardText: {
    fontSize: 16,
    color: DARK_BLUE,
  },
  badgeOpen: {
    backgroundColor: "#C8E6C9",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeOpenText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  badgeClosed: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeClosedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#757575",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  button: {
    backgroundColor: BLUE,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
