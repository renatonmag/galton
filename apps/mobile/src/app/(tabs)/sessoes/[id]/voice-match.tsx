import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";
import type { VoicePrefill } from "@/lib/api";

export default function VoiceMatchScreen() {
  const router = useRouter();
  const { name, prefill: prefillJson } = useLocalSearchParams<{ name: string; prefill: string }>();
  const prefill: VoicePrefill = JSON.parse(prefillJson ?? "{}");

  const confidenceColor = prefill.confidence === "high" ? "#38A169" : "#DD6B20";

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
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              // TODO: navigate to log-entry form (Phase 1)
              router.back();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Confirmar</Text>
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
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 50,
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
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
