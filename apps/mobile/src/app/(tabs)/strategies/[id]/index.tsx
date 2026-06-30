import { api, type Setup } from "@/lib/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, SquarePen, Trash } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function StrategyDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [setups, setSetups] = useState<Setup[]>([]);
  const [editMode, setEditMode] = useState(false);

  const deleteSetup = useCallback((setupId: string, setupName: string) => {
    Alert.alert(
      "Excluir setup",
      `Deseja excluir "${setupName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await api.strategies[":strategyId"].setups[":id"].$delete({
              param: { strategyId: id, id: setupId },
            });
            setSetups((prev) => prev.filter((s) => s.id !== setupId));
          },
        },
      ],
    );
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      api.strategies[":strategyId"].setups
        .$get({ param: { strategyId: id } })
        .then((r) => r.json())
        .then(({ setups }) => setSetups(setups));
    }, [id]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {router.canGoBack() && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ChevronLeft color="#fff" size={22} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{name}</Text>
          <TouchableOpacity onPress={() => setEditMode((v) => !v)} activeOpacity={0.7}>
            <SquarePen color={editMode ? BLUE : DARK_BLUE} size={20} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionLabel}>Setups</Text>

        <FlatList
          data={setups}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.setupCard}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/strategies/[id]/[setupId]",
                  params: { id, setupId: item.id, name },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.setupCardText, { flex: 1 }]}>{item.name}</Text>
              {editMode && (
                <TouchableOpacity
                  onPress={() => deleteSetup(item.id, item.name)}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Trash color="#E57373" size={18} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/strategies/[id]/[setupId]",
              params: { id, setupId: "new", name },
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Novo setup</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
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
  sectionLabel: {
    fontSize: 16,
    color: DARK_BLUE,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
  },
  setupCard: {
    backgroundColor: "#D6E8FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  setupCardText: {
    fontSize: 16,
    color: DARK_BLUE,
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
