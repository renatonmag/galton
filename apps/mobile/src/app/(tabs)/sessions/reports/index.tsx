import { useDailyReportsList } from "@/hooks/queries/use-daily-reports";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

function formatReportDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ReportsListScreen() {
  const router = useRouter();
  const { data: reportDates, isLoading, isError, refetch } = useDailyReportsList();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <YStack flex={1} px="$5" pt="$2">
        <XStack alignItems="center" gap="$3" mb="$4">
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
          <Text fontSize={22} fontWeight="700" color="$blue12">
            Reports
          </Text>
        </XStack>

        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" />
          </YStack>
        ) : isError ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Text color="$color10">Failed to load reports</Text>
            <Button onPress={() => refetch()}>Retry</Button>
          </YStack>
        ) : (reportDates ?? []).length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$2" px="$5">
            <Text color="$color10" textAlign="center">
              No reports yet. Add comments to your trade entries to build up a weekly report.
            </Text>
          </YStack>
        ) : (
          <FlatList
            data={reportDates}
            keyExtractor={(item) => item}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <XStack
                backgroundColor="$blue3"
                borderRadius={12}
                px="$4"
                py="$3.5"
                alignItems="center"
                justifyContent="space-between"
                pressStyle={{ opacity: 0.8 }}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/sessions/reports/[date]",
                    params: { date: item },
                  })
                }
              >
                <Text fontSize="$5" color="$blue12">
                  {formatReportDate(item)}
                </Text>
                <ChevronRight color="#1A3A5C" size={18} />
              </XStack>
            )}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
