import { useDailyReport } from "@/hooks/queries/use-daily-reports";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

function formatReportDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatRatio(ratio: string | null): string {
  if (ratio == null) return "—";
  return `${Math.round(Number(ratio) * 100)}%`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <YStack
      flex={1}
      backgroundColor="$blue3"
      borderRadius={12}
      px="$3"
      py="$3"
      alignItems="center"
      gap="$1"
    >
      <Text fontSize="$6" fontWeight="800" color="$blue12">
        {value}
      </Text>
      <Text fontSize={11} color="$color10" textAlign="center">
        {label}
      </Text>
    </YStack>
  );
}

function PointCard({
  pattern,
  description,
  footer,
  accent,
}: {
  pattern: string;
  description: string;
  footer: string;
  accent: string;
}) {
  return (
    <YStack backgroundColor="$blue2" borderRadius={12} px="$4" py="$3.5" gap="$1.5">
      <Text fontSize="$4" fontWeight="700" color={accent}>
        {pattern}
      </Text>
      <Text fontSize="$3.5" color="$color11">
        {description}
      </Text>
      <Text fontSize="$3" color="$color9">
        {footer}
      </Text>
    </YStack>
  );
}

export default function ReportDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { data, isLoading, isError, refetch } = useDailyReport(date);
  const report = data?.report;
  const windowStart = data?.windowStart;

  return (
    <YStack flex={1} backgroundColor="#fff">
      <SafeAreaView style={{ flex: 1 }}>
        <XStack px="$5" pt="$2" alignItems="center" gap="$3">
          <YStack
            width={44}
            height={44}
            borderRadius={22}
            backgroundColor="$blue8"
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.8 }}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#fff" size={22} />
          </YStack>
          <YStack>
            <Text fontSize={20} fontWeight="700" color="$blue12">
              {formatReportDate(date)}
            </Text>
            {windowStart && (
              <Text fontSize={13} color="$color10">
                Accounting since {formatReportDate(windowStart)}
              </Text>
            )}
          </YStack>
        </XStack>

        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" />
          </YStack>
        ) : isError || !report ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Text color="$color10">Failed to load report</Text>
            <Button onPress={() => refetch()}>Retry</Button>
          </YStack>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <XStack gap="$3">
              <StatTile label="This week" value={formatRatio(report.weekRatio)} />
              <StatTile label="All-time before" value={formatRatio(report.historicRatio)} />
              <StatTile label="Still open" value={String(report.openCount)} />
            </XStack>

            {report.improvements.length === 0 && report.strengths.length === 0 ? (
              <Text color="$color10" textAlign="center" mt="$4">
                Not enough commented trades this week for a narrative report — add comments to
                your trade entries to unlock it.
              </Text>
            ) : (
              <>
                {report.improvements.length > 0 && (
                  <YStack gap="$2.5">
                    <Text fontSize="$5" fontWeight="700" color="$blue12">
                      Pontos de melhoria
                    </Text>
                    {report.improvements.map((point, i) => (
                      <PointCard
                        key={i}
                        pattern={point.pattern}
                        description={point.description}
                        footer={`→ ${point.action}`}
                        accent="#9B2C2C"
                      />
                    ))}
                  </YStack>
                )}

                {report.strengths.length > 0 && (
                  <YStack gap="$2.5">
                    <Text fontSize="$5" fontWeight="700" color="$blue12">
                      Pontos fortes
                    </Text>
                    {report.strengths.map((point, i) => (
                      <PointCard
                        key={i}
                        pattern={point.pattern}
                        description={point.description}
                        footer={`→ ${point.whyItMatters}`}
                        accent="#276749"
                      />
                    ))}
                  </YStack>
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </YStack>
  );
}
