import { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, X } from "lucide-react-native";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";
import { api, type VoicePrefill } from "@/lib/api";

export default function VoiceMatchScreen() {
  const router = useRouter();
  const { id, name, prefill: prefillJson } = useLocalSearchParams<{ id: string; name: string; prefill: string }>();
  const prefill: VoicePrefill = JSON.parse(prefillJson ?? "{}");
  const [submitting, setSubmitting] = useState(false);

  const confidenceColor = prefill.confidence === "high" ? "#38A169" : "#DD6B20";
  const canSubmit = !!prefill.setupId && !submitting;

  const createLogEntry = useCallback(
    async (decision: "TRADE" | "NO_TRADE") => {
      if (!prefill.setupId || submitting) return;
      setSubmitting(true);
      try {
        const res = await api.sessions[":sessionId"]["log-entries"]["$post"]({
          param: { sessionId: id },
          json: {
            setupId: prefill.setupId,
            decision,
            characteristics: prefill.characteristics.map((c) => ({
              characteristicId: c.characteristicId,
              value: String(c.value),
            })),
            ...(prefill.comment ? { comment: prefill.comment } : {}),
          },
        });
        if (res.ok) router.back();
      } finally {
        setSubmitting(false);
      }
    },
    [id, prefill, submitting, router],
  );

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
          <Text style={styles.headerTitle}>{name}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {prefill.setupName ?? "Sem correspondência"}
              </Text>
            </View>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
          </View>

          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Transcrição</Text>
            <Text style={styles.transcriptText}>{prefill.transcription}</Text>
          </View>

          {prefill.characteristics?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Características</Text>
              {prefill.characteristics.map((c) => (
                <View key={c.characteristicId} style={styles.charRow}>
                  <Text style={styles.charValue}>
                    {typeof c.value === "boolean" ? (c.value ? "Sim" : "Não") : c.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {prefill.comment ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Comentário</Text>
              <Text style={styles.commentText}>{prefill.comment}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Saída estruturada</Text>
            <View style={styles.jsonCard}>
              <Text style={styles.jsonText}>{JSON.stringify(prefill, null, 2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.decisionCard, styles.tradeCard, !canSubmit && styles.disabledCard]}
            onPress={() => createLogEntry("TRADE")}
            activeOpacity={0.8}
            disabled={!canSubmit}
          >
            <View style={styles.decisionLeft}>
              <Text style={[styles.decisionLabel, styles.tradeText]}>TRADE</Text>
              <Text style={styles.decisionSetup}>{prefill.setupName ?? "–"}</Text>
            </View>
            <View style={styles.decisionRight}>
              <Check color="#276749" size={18} />
              <Text style={[styles.decisionPct, styles.tradeText]}>–%</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.decisionCard, styles.noTradeCard, !canSubmit && styles.disabledCard]}
            onPress={() => createLogEntry("NO_TRADE")}
            activeOpacity={0.8}
            disabled={!canSubmit}
          >
            <View style={styles.decisionLeft}>
              <Text style={[styles.decisionLabel, styles.noTradeText]}>NO TRADE</Text>
              <Text style={styles.decisionSetup}>{prefill.setupName ?? "–"}</Text>
            </View>
            <View style={styles.decisionRight}>
              <X color="#9B2C2C" size={18} />
              <Text style={[styles.decisionPct, styles.noTradeText]}>–%</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK_BLUE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 20,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pill: {
    backgroundColor: BLUE,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pillText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  transcriptCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  charRow: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  charValue: {
    fontSize: 14,
    color: DARK_BLUE,
  },
  commentText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  jsonCard: {
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    padding: 12,
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: DARK_BLUE,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 10,
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: BLUE,
  },
  decisionCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tradeCard: {
    backgroundColor: "#C6F6D5",
  },
  noTradeCard: {
    backgroundColor: "#FED7D7",
  },
  disabledCard: {
    opacity: 0.5,
  },
  decisionLeft: {
    gap: 2,
  },
  decisionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  decisionSetup: {
    fontSize: 13,
    color: "#555",
  },
  decisionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  decisionPct: {
    fontSize: 16,
    fontWeight: "700",
  },
  tradeText: {
    color: "#276749",
  },
  noTradeText: {
    color: "#9B2C2C",
  },
});
