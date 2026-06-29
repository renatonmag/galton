import { api, type Characteristic } from "@/lib/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, SquarePen, Trash } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function SetupDetailScreen() {
  const router = useRouter();
  const { id: strategyId, setupId } = useLocalSearchParams<{
    id: string;
    setupId: string;
  }>();

  const isNew = setupId === "novo";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [charEditMode, setCharEditMode] = useState(false);

  const savedName = useRef("");
  const savedDescription = useRef("");

  const dirty =
    name !== savedName.current || description !== savedDescription.current;

  useEffect(() => {
    if (isNew) return;
    api.strategies[":strategyId"]
      .setups[":id"]
      .$get({ param: { strategyId, id: setupId } })
      .then((r) => r.json())
      .then(({ setup }) => {
        if (!setup) return;
        setName(setup.name);
        setDescription(setup.description ?? "");
        savedName.current = setup.name;
        savedDescription.current = setup.description ?? "";
      });
  }, [setupId, strategyId, isNew]);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      api.strategies[":strategyId"].setups[":setupId"].characteristics
        .$get({ param: { strategyId, setupId } })
        .then((r) => r.json())
        .then(({ characteristics }) => setCharacteristics(characteristics));
    }, [setupId, strategyId, isNew])
  );

  function deleteCharacteristic(charId: string, charName: string) {
    Alert.alert("Excluir característica", `Deseja excluir "${charName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await api.strategies[":strategyId"].setups[":setupId"].characteristics[":id"].$delete({
            param: { strategyId, setupId, id: charId },
          });
          setCharacteristics((prev) => prev.filter((c) => c.id !== charId));
        },
      },
    ]);
  }

  async function handleSave() {
    setLoading(true);
    try {
      if (isNew) {
        const res = await api.strategies[":strategyId"].setups.$post({
          param: { strategyId },
          json: { name: name.trim() || "Novo setup", description },
        });
        const { setup } = await res.json();
        savedName.current = setup.name;
        savedDescription.current = setup.description ?? "";
        router.replace({
          pathname: "/(tabs)/estrategias/[id]/[setupId]",
          params: { id: strategyId, setupId: setup.id },
        });
      } else {
        await api.strategies[":strategyId"].setups[":id"].$patch({
          param: { strategyId, id: setupId },
          json: { name, description },
        });
        savedName.current = name;
        savedDescription.current = description;
      }
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
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome do setup"
          placeholderTextColor="#6B9FD4"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descrição do setup"
          placeholderTextColor="#6B9FD4"
          multiline
          textAlignVertical="top"
        />

        <View style={styles.charTitleRow}>
          <Text style={styles.sectionTitle}>Caracteristicas</Text>
          {characteristics.length > 0 && (
            <TouchableOpacity onPress={() => setCharEditMode((v) => !v)} activeOpacity={0.7}>
              <SquarePen color={charEditMode ? BLUE : DARK_BLUE} size={20} />
            </TouchableOpacity>
          )}
        </View>

        {characteristics.map((c) =>
          c.type === "multiple_choice" ? (
            <View key={c.id}>
              <View style={styles.charTitleRow}>
                <Text style={styles.characteristicTitle}>{c.name}</Text>
                {charEditMode && (
                  <TouchableOpacity
                    onPress={() => deleteCharacteristic(c.id, c.name)}
                    hitSlop={8}
                    activeOpacity={0.7}
                  >
                    <Trash color="#E57373" size={18} />
                  </TouchableOpacity>
                )}
              </View>
              {(c.options ?? []).map((opt, i) => (
                <View key={i} style={styles.optionRow}>
                  <View style={styles.radioIcon} />
                  <Text style={styles.optionText}>{opt}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View key={c.id} style={styles.optionRow}>
              <View style={styles.checkboxIcon} />
              <Text style={[styles.optionText, { flex: 1 }]}>{c.name}</Text>
              {charEditMode && (
                <TouchableOpacity
                  onPress={() => deleteCharacteristic(c.id, c.name)}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Trash color="#E57373" size={18} />
                </TouchableOpacity>
              )}
            </View>
          )
        )}

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/estrategias/[id]/nova-caracteristica",
              params: { id: strategyId, setupId, setupName: name },
            })
          }
        >
          <Text style={styles.addButtonText}>Adicionar caracteristica</Text>
        </TouchableOpacity>
      </ScrollView>

      {dirty && (
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
      )}
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
  textarea: {
    height: 120,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: DARK_BLUE,
    marginTop: 8,
    marginBottom: 4,
  },
  charTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  characteristicTitle: {
    fontSize: 13,
    color: DARK_BLUE,
    fontWeight: "500",
    marginTop: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  radioIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BLUE,
  },
  checkboxIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  optionText: {
    fontSize: 14,
    color: DARK_BLUE,
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
