import { api } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function NovaEstrategiaScreen() {
  const router = useRouter();
  const { count } = useLocalSearchParams<{ count: string }>();
  const placeholder = `Estratégia #${Number(count ?? 0) + 1}`;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const strategyName = name.trim() || placeholder;
    setLoading(true);
    try {
      await api.strategies.$post({ json: { name: strategyName } });
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#6B9FD4"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Criar</Text>
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
    paddingTop: 24,
  },
  input: {
    backgroundColor: "#D6E8FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: DARK_BLUE,
    marginBottom: 12,
  },
  button: {
    backgroundColor: BLUE,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
