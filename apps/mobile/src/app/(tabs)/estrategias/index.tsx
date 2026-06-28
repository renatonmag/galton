import { api, type Strategy } from "@/lib/api";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function EstrategiasScreen() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);

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
        <Text style={styles.title}>Estrategias</Text>

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
                  pathname: "/(tabs)/estrategias/[id]",
                  params: { id: item.id, name: item.name },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.strategyButtonText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/estrategias/nova",
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK_BLUE,
    marginBottom: 20,
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
