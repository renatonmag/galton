import { api, type Strategy } from "@/lib/api";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { ChevronLeft, SquarePen, Trash } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function StrategiesScreen() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [editMode, setEditMode] = useState(false);

  const deleteStrategy = useCallback((id: string, name: string) => {
    Alert.alert(
      "Excluir estratégia",
      `Deseja excluir "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await api.strategies[":id"].$delete({ param: { id } });
            setStrategies((prev) => prev.filter((s) => s.id !== id));
          },
        },
      ],
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      api.strategies.$get().then((r) => r.json()).then(({ strategies }) => setStrategies(strategies));
    }, []),
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
          <Text style={styles.title}>Estrategias</Text>
          <TouchableOpacity onPress={() => setEditMode((v) => !v)} activeOpacity={0.7}>
            <SquarePen color={editMode ? BLUE : DARK_BLUE} size={20} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={strategies}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.strategyButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/strategies/[id]",
                  params: { id: item.id, name: item.name },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.strategyButtonText, { flex: 1 }]}>{item.name}</Text>
              {editMode && (
                <TouchableOpacity
                  onPress={() => deleteStrategy(item.id, item.name)}
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
              pathname: "/(tabs)/strategies/new",
              params: { count: strategies.length },
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Nova estratégia</Text>
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
    marginBottom: 20,
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
  strategyButton: {
    backgroundColor: "#D6E8FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  strategyButtonText: {
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
