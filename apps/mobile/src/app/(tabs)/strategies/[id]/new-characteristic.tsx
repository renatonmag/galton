import { api } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

type CharacteristicTypeValue = "multiple_choice" | "boolean";

export default function NewCharacteristicScreen() {
  const router = useRouter();
  const { id: strategyId, setupId, setupName } = useLocalSearchParams<{
    id: string;
    setupId: string;
    setupName: string;
  }>();

  const [title, setTitle] = useState("");
  const [characteristicType, setCharacteristicType] = useState<CharacteristicTypeValue>("multiple_choice");
  const [alternatives, setAlternatives] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  function addAlternative() {
    setAlternatives((prev) => [...prev, ""]);
  }

  function updateAlternative(index: number, value: string) {
    setAlternatives((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await api.strategies[":strategyId"].setups[":setupId"].characteristics.$post({
        param: { strategyId, setupId },
        json: {
          name: title.trim() || "Nova característica",
          type: characteristicType,
          options:
            characteristicType === "multiple_choice"
              ? alternatives.filter((a) => a.trim())
              : undefined,
          position: 0,
        },
      });
      router.back();
    } finally {
      setLoading(false);
    }
  }

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.setupName}>{setupName}</Text>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Título da característica"
          placeholderTextColor="#6B9FD4"
        />

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[
              styles.segmentOption,
              characteristicType === "multiple_choice" && styles.segmentOptionActive,
            ]}
            onPress={() => setCharacteristicType("multiple_choice")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                characteristicType === "multiple_choice" && styles.segmentTextActive,
              ]}
            >
              Múltipla escolha
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentOption,
              characteristicType === "boolean" && styles.segmentOptionActive,
            ]}
            onPress={() => setCharacteristicType("boolean")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                characteristicType === "boolean" && styles.segmentTextActive,
              ]}
            >
              Única
            </Text>
          </TouchableOpacity>
        </View>

        {tipo === "multiple_choice" &&
          alternatives.map((alt, i) => (
            <View key={i}>
              <Text style={styles.label}>Alternativa {i + 1}</Text>
              <TextInput
                style={styles.input}
                value={alt}
                onChangeText={(v) => updateAlternative(i, v)}
                placeholder={`Alternativa ${i + 1}`}
                placeholderTextColor="#6B9FD4"
              />
            </View>
          ))}

        {tipo === "multiple_choice" && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={addAlternative}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Adicionar alternativa</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Salvar</Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  setupName: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK_BLUE,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: DARK_BLUE,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: DARK_BLUE,
    marginBottom: 8,
  },
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  segmentOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentOptionActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  segmentText: {
    fontSize: 14,
    color: BLUE,
    fontWeight: "500",
  },
  segmentTextActive: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  saveButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
