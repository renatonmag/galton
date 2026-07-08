import {
  useExtractBehaviorInsights,
  usePendingBehaviorInsightsCount,
  useReinforceBehaviorInsights,
} from "@/hooks/queries/use-behavior-insights";
import { useStats } from "@/hooks/queries/use-stats";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useCallback } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

export default function HomeScreen() {
  const router = useRouter();
  const { data: stats, isLoading, isError, refetch } = useStats();
  const { data: pendingCount, refetch: refetchPendingCount } = usePendingBehaviorInsightsCount();
  useRefreshOnFocus(refetch);
  useRefreshOnFocus(refetchPendingCount);

  const extractInsights = useExtractBehaviorInsights();
  const reinforceInsights = useReinforceBehaviorInsights();

  const handleAnalyzePatterns = useCallback(async () => {
    try {
      const result = await extractInsights.mutateAsync();

      if (result.skipped) {
        if (result.reason === "already_extracted") {
          Alert.alert(
            "Padrões já analisados",
            "Você já tem padrões de comportamento identificados.",
          );
        } else {
          Alert.alert(
            "Sem comentários suficientes",
            "Adicione comentários aos seus trades para analisar padrões de comportamento.",
          );
        }
        return;
      }

      if (result.noticedNothing) {
        Alert.alert(
          "Nenhum padrão identificado",
          "Não encontramos padrões repetitivos nos seus comentários ainda.",
        );
        return;
      }

      const count = result.insights.length;
      Alert.alert(
        "Padrões identificados",
        `${count} novo${count > 1 ? "s" : ""} padrão${count > 1 ? "ões" : ""} de comportamento identificado${count > 1 ? "s" : ""}.`,
      );
    } catch {
      Alert.alert("Erro", "Não foi possível analisar os padrões agora. Tente novamente.");
    }
  }, [extractInsights]);

  const handleAnalyzeDays = useCallback(async () => {
    try {
      const result = await reinforceInsights.mutateAsync();

      if (result.skipped) {
        Alert.alert(
          "Nada para analisar",
          result.reason === "not_bootstrapped"
            ? "Analise seus padrões de comportamento primeiro."
            : "Não há dias novos para analisar no momento.",
        );
        return;
      }

      if (result.error) {
        Alert.alert(
          "Análise parcial",
          `${result.sessionsProcessed} dia${result.sessionsProcessed === 1 ? "" : "s"} processado${result.sessionsProcessed === 1 ? "" : "s"} antes de um erro interromper a análise. Tente novamente mais tarde.`,
        );
        return;
      }

      Alert.alert(
        "Dias analisados",
        `${result.sessionsProcessed} dia${result.sessionsProcessed === 1 ? "" : "s"} analisado${result.sessionsProcessed === 1 ? "" : "s"}, ${result.reinforcementsApplied} padrão${result.reinforcementsApplied === 1 ? "" : "ões"} reforçado${result.reinforcementsApplied === 1 ? "" : "s"}.`,
      );
    } catch {
      Alert.alert("Erro", "Não foi possível analisar os dias agora. Tente novamente.");
    }
  }, [reinforceInsights]);

  const ratio =
    stats?.successRatio != null
      ? `${Math.round(Number(stats.successRatio) * 100)}%`
      : "–";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Performance</Text>
          <View style={styles.titleRowActions}>
            <TouchableOpacity onPress={() => router.push("/settings")} hitSlop={8}>
              <Settings color="#888" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => supabase.auth.signOut()} hitSlop={8}>
              <Text style={styles.signOut}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ratioContainer}>
          <Text style={styles.ratioLabel}>Success Ratio</Text>
          {isLoading ? (
            <ActivityIndicator color={BLUE} size="large" style={{ marginTop: 12 }} />
          ) : isError ? (
            <TouchableOpacity onPress={() => refetch()} hitSlop={8}>
              <Text style={styles.errorText}>Failed to load — tap to retry</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.ratioValue}>{ratio}</Text>
          )}
        </View>

        {stats != null && (
          <View style={styles.breakdown}>
            <BreakdownItem label="Total" value={stats.total} color={DARK_BLUE} />
            <BreakdownItem label="Profit" value={stats.profit} color="#276749" />
            <BreakdownItem label="Loss" value={stats.loss} color="#9B2C2C" />
            <BreakdownItem label="Breakeven" value={stats.breakeven} color="#888" />
            <BreakdownItem label="Open" value={stats.open} color={BLUE} />
          </View>
        )}

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={handleAnalyzePatterns}
          disabled={extractInsights.isPending}
          hitSlop={8}
        >
          {extractInsights.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analisar padrões</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            styles.reinforceButton,
            (!pendingCount || reinforceInsights.isPending) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyzeDays}
          disabled={!pendingCount || reinforceInsights.isPending}
          hitSlop={8}
        >
          {reinforceInsights.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.analyzeButtonText}>
              Analisar {pendingCount ?? 0} dia{pendingCount === 1 ? "" : "s"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BreakdownItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.breakdownItem}>
      <Text style={[styles.breakdownValue, { color }]}>{value}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
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
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  titleRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK_BLUE,
  },
  signOut: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  ratioContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  ratioLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
    marginBottom: 8,
  },
  ratioValue: {
    fontSize: 72,
    fontWeight: "800",
    color: DARK_BLUE,
    lineHeight: 80,
  },
  errorText: {
    fontSize: 16,
    color: "#9B2C2C",
    fontWeight: "600",
    marginTop: 12,
  },
  breakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  breakdownItem: {
    alignItems: "center",
    gap: 4,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  breakdownLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  analyzeButton: {
    marginTop: 20,
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  reinforceButton: {
    marginTop: 12,
  },
  analyzeButtonDisabled: {
    opacity: 0.4,
  },
});
