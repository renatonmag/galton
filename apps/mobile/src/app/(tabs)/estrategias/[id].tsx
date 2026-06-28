import { useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

const PLACEHOLDER_SETUPS = [
  { id: "1", name: "Retorno a méda" },
  { id: "2", name: "Barra especial" },
  { id: "3", name: "Reversão" },
];

export default function EstrategiaDetailScreen() {
  const { name } = useLocalSearchParams<{ id: string; name: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.sectionLabel}>Setups</Text>

        <FlatList
          data={PLACEHOLDER_SETUPS}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.setupCard}>
              <Text style={styles.setupCardText}>{item.name}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} activeOpacity={0.8}>
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
    marginBottom: 16,
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
