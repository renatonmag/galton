import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AudioLines, Check, ChevronDown, ChevronLeft, ChevronUp, Square, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";
import { requestRecordingPermissionsAsync, useAudioRecorder, RecordingPresets } from "expo-audio";
import { api, uploadVoice } from "@/lib/api";

type RecordingState = "idle" | "recording" | "uploading";

type LogEntry = {
  id: string;
  setupId: string;
  setupName: string | null;
  decision: "TRADE" | "NO_TRADE";
  result: "open" | "profit" | "loss" | "breakeven";
  profit: string | null;
  loss: string | null;
  comment: string | null;
  createdAt: string;
  characteristics: { characteristicId: string; characteristicName: string; value: string }[];
};

function LogEntryCard({ entry }: { entry: LogEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profit, setProfit] = useState(entry.profit ?? "");
  const [loss, setLoss] = useState(entry.loss ?? "");
  const [comment, setComment] = useState(entry.comment ?? "");

  const isTrade = entry.decision === "TRADE";
  const accentColor = isTrade ? "#276749" : "#9B2C2C";
  const inputBg = isTrade ? "#2F855A" : "#C53030";

  const saveChanges = useCallback(async () => {
    await api["log-entries"][":id"].$patch({
      param: { id: entry.id },
      json: {
        profit: profit || null,
        loss: loss || null,
        comment: comment || null,
      },
    });
  }, [entry.id, profit, loss, comment]);

  return (
    <View style={[styles.entryCard, isTrade ? styles.tradeCard : styles.noTradeCard]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setIsOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.entryLeft}>
          <Text style={[styles.entryDecision, { color: accentColor }]}>
            {isTrade ? "TRADE" : "NO TRADE"}
          </Text>
          <Text style={styles.entrySetup}>{entry.setupName ?? "–"}</Text>
        </View>
        <View style={styles.entryRight}>
          {isTrade ? (
            <Check color="#276749" size={18} />
          ) : (
            <X color="#9B2C2C" size={18} />
          )}
          <Text style={[styles.entryPct, { color: accentColor }]}>–%</Text>
          {isOpen ? (
            <ChevronUp color={accentColor} size={16} />
          ) : (
            <ChevronDown color={accentColor} size={16} />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.expandedBody}>
          {entry.characteristics.map((c) => (
            <View key={c.characteristicId} style={styles.charRow}>
              <View style={[styles.charSquare, { backgroundColor: accentColor }]} />
              <Text style={[styles.charText, { color: accentColor }]}>{c.characteristicName}</Text>
            </View>
          ))}

          <View style={styles.profitRow}>
            <View style={styles.profitField}>
              <Text style={[styles.fieldLabel, { color: accentColor }]}>Lucro</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg }]}
                value={profit}
                onChangeText={setProfit}
                onBlur={saveChanges}
                keyboardType="numeric"
                placeholderTextColor="rgba(255,255,255,0.5)"
                placeholder="0"
              />
            </View>
            <View style={styles.profitField}>
              <Text style={[styles.fieldLabel, { color: accentColor }]}>Prejuízo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg }]}
                value={loss}
                onChangeText={setLoss}
                onBlur={saveChanges}
                keyboardType="numeric"
                placeholderTextColor="rgba(255,255,255,0.5)"
                placeholder="0"
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: accentColor }]}>Comentário</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: inputBg }]}
            value={comment}
            onChangeText={setComment}
            onBlur={saveChanges}
            multiline
            placeholderTextColor="rgba(255,255,255,0.5)"
            placeholder="Adicione um comentário..."
            textAlignVertical="top"
          />
        </Animated.View>
      )}
    </View>
  );
}

export default function SessionScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (recordingState === "recording") {
      pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true);
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }
  }, [recordingState, pulseOpacity]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      api.sessions[":sessionId"]["log-entries"]["$get"]({ param: { sessionId: id } })
        .then((r) => r.json())
        .then((data) => {
          if ("logEntries" in data) setLogEntries(data.logEntries as LogEntry[]);
        })
        .catch(() => {});
    }, [id]),
  );

  const handleFabPress = useCallback(async () => {
    if (recordingState === "uploading") return;

    if (recordingState === "idle") {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão necessária", "Autorize o acesso ao microfone nas configurações.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingState("recording");
      return;
    }

    // recording → stop and upload
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setRecordingState("idle");
      return;
    }
    setRecordingState("uploading");
    try {
      const prefill = await uploadVoice(id, uri, "audio/m4a");
      router.push({
        pathname: "/(tabs)/sessions/[id]/voice-match",
        params: { id, name, prefill: JSON.stringify(prefill) },
      });
    } catch (err) {
      console.error("[Voice] upload/navigation error:", err);
      Alert.alert("Erro", "Não foi possível processar o áudio. Tente novamente.");
    } finally {
      setRecordingState("idle");
    }
  }, [recordingState, recorder, id, name, router]);

  const fabBg = recordingState === "recording" ? "#E53E3E" : BLUE;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {router.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
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
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {logEntries.map((entry) => (
              <LogEntryCard key={entry.id} entry={entry} />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.fab, { backgroundColor: fabBg }, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={handleFabPress}
          activeOpacity={0.8}
          disabled={recordingState === "uploading"}
        >
          {recordingState === "uploading" ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : recordingState === "recording" ? (
            <Square color="#fff" size={26} fill="#fff" />
          ) : (
            <AudioLines color="#fff" size={28} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const BLUE = "#6FA8DC";
const DARK_BLUE = "#1A3A5C";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
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
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK_BLUE,
  },
  listContent: {
    gap: 10,
    paddingBottom: 96,
  },
  entryCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tradeCard: {
    backgroundColor: "#C6F6D5",
  },
  noTradeCard: {
    backgroundColor: "#FED7D7",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryLeft: {
    gap: 2,
  },
  entryDecision: {
    fontSize: 16,
    fontWeight: "700",
  },
  entrySetup: {
    fontSize: 13,
    color: "#555",
  },
  entryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  entryPct: {
    fontSize: 16,
    fontWeight: "700",
  },
  expandedBody: {
    marginTop: 12,
    gap: 8,
  },
  charRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  charSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  charText: {
    fontSize: 13,
    fontWeight: "500",
  },
  profitRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  profitField: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 14,
  },
  textarea: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
