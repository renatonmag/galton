import {
  useCreateTradeEntry,
  useDeleteTradeEntry,
  useTradeEntries,
} from "@/hooks/queries/use-trade-entries";
import { useStats } from "@/hooks/queries/use-stats";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { type TradeEntry } from "@/lib/api";
import { computeLocalDecision } from "@/lib/decision";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, Plus, SquarePen, Trash, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

function fmtTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function TradeCard({
  entry,
  editMode,
  onDelete,
  onTap,
}: {
  entry: TradeEntry;
  editMode: boolean;
  onDelete: () => void;
  onTap: () => void;
}) {
  const isTrade = entry.decision === "TRADE";
  const accentColor = isTrade ? "#276749" : "#9B2C2C";
  const pct = `${Math.round(Number(entry.successRatio) * 100)}%`;

  return (
    <YStack
      backgroundColor={isTrade ? "#C6F6D5" : "#FED7D7"}
      borderRadius={12}
      px="$4"
      py="$3.5"
      pressStyle={{ opacity: 0.8 }}
      onPress={editMode ? undefined : onTap}
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <YStack gap="$0.5">
          <XStack alignItems="center" gap="$1.5">
            {entry.result === "open" && (
              <YStack
                width={8}
                height={8}
                borderRadius={4}
                backgroundColor={accentColor}
              />
            )}
            <Text fontSize="$3.5" fontWeight="700" color={accentColor}>
              {isTrade ? "TRADE" : "NO TRADE"}
            </Text>
          </XStack>
          <Text fontSize="$3" color="$color10">
            {entry.r}
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$2.5">
          {isTrade ? (
            <Check color={accentColor} size={18} />
          ) : (
            <X color={accentColor} size={18} />
          )}
          <Text fontSize="$3.5" fontWeight="700" color={accentColor}>
            {pct}
          </Text>
          {editMode && (
            <Button chromeless p="$1" onPress={onDelete}>
              <Trash color="#E57373" size={18} />
            </Button>
          )}
        </XStack>
      </XStack>
      <XStack gap="$2.5" mt="$1.5">
        <Text fontSize={11} color="$color8">
          Created {fmtTime(entry.createdAt)}
        </Text>
        {fmtTime(entry.entryAt) && (
          <Text fontSize={11} color="$color8">
            Entry {fmtTime(entry.entryAt)}
          </Text>
        )}
      </XStack>
    </YStack>
  );
}

function HeaderStat({ label, ratio }: { label: string; ratio: number }) {
  return (
    <XStack alignItems="baseline" gap="$1">
      <Text
        fontSize="$4"
        fontWeight="700"
        color={ratio >= 0.5 ? "#276749" : "#9B2C2C"}
      >
        {Math.round(ratio * 100)}%
      </Text>
      <Text fontSize={11} color="$color8">
        {label}
      </Text>
    </XStack>
  );
}

export default function SessionScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [editMode, setEditMode] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<{
    ratio: number;
    decision: "TRADE" | "NO_TRADE";
  } | null>(null);

  const { data: entries = [], isLoading, isError, refetch } = useTradeEntries(id);
  const { data: stats } = useStats();
  useRefreshOnFocus(refetch);
  const createTradeEntry = useCreateTradeEntry(id);
  const deleteTradeEntry = useDeleteTradeEntry(id);

  const openAddSheet = useCallback(() => {
    const dec = computeLocalDecision(entries);
    setPendingDecision(dec);
    setSheetVisible(true);
  }, [entries]);

  const saveNewTrade = useCallback(() => {
    createTradeEntry.mutate();
    setSheetVisible(false);
  }, [createTradeEntry]);

  const deleteEntry = useCallback(
    (entryId: string) => {
      Alert.alert("Delete trade", "Delete this trade entry?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTradeEntry.mutate(entryId),
        },
      ]);
    },
    [deleteTradeEntry],
  );

  return (
    <YStack flex={1} backgroundColor="#fff">
      <SafeAreaView style={{ flex: 1 }}>
        <XStack
          px="$5"
          pt="$2"
          alignItems="center"
          justifyContent="space-between"
        >
          {router.canGoBack() && (
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
          )}
          <Button chromeless p="$1" onPress={() => setEditMode((v) => !v)}>
            <SquarePen color={editMode ? "#6FA8DC" : "#1A3A5C"} size={20} />
          </Button>
        </XStack>

        <YStack flex={1} px="$5" pt="$3">
          <XStack alignItems="center" justifyContent="space-between" mb="$4">
            <Text fontSize={22} fontWeight="700" color="$blue12">
              {name}
            </Text>
            <XStack alignItems="center" gap="$3">
              {entries.some((e) => e.result !== "open") && (
                <HeaderStat
                  label="session"
                  ratio={computeLocalDecision(entries).ratio}
                />
              )}
              {stats?.noEntryWinRate != null && (
                <HeaderStat label="no entry" ratio={stats.noEntryWinRate} />
              )}
            </XStack>
          </XStack>
          {isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator size="large" />
            </YStack>
          ) : isError ? (
            <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
              <Text color="$color10">Failed to load trade entries</Text>
              <Button onPress={() => refetch()}>Retry</Button>
            </YStack>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 96 }}
            >
              {entries.map((entry) => (
                <TradeCard
                  key={entry.id}
                  entry={entry}
                  editMode={editMode}
                  onDelete={() => deleteEntry(entry.id)}
                  onTap={() =>
                    router.push({
                      pathname: "/(tabs)/sessions/[id]/edit",
                      params: { id, entryId: entry.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          )}
        </YStack>
      </SafeAreaView>

      <YStack
        position="absolute"
        bottom={32}
        right={24}
        width={64}
        height={64}
        borderRadius={32}
        backgroundColor="$blue8"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={openAddSheet}
      >
        <Plus color="#fff" size={28} />
      </YStack>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0,0,0,0.4)"
          onPress={() => setSheetVisible(false)}
        />
        <YStack
          backgroundColor="#fff"
          borderTopLeftRadius={20}
          borderTopRightRadius={20}
          px="$5"
          pt="$5"
          pb="$10"
        >
          {pendingDecision && (
            <DecisionStep
              decision={pendingDecision.decision}
              ratio={pendingDecision.ratio}
              onPress={saveNewTrade}
            />
          )}
        </YStack>
      </Modal>
    </YStack>
  );
}

function DecisionStep({
  decision,
  ratio,
  onPress,
}: {
  decision: "TRADE" | "NO_TRADE";
  ratio: number;
  onPress: () => void;
}) {
  const isTrade = decision === "TRADE";
  const bg = isTrade ? "#C6F6D5" : "#FED7D7";
  const color = isTrade ? "#276749" : "#9B2C2C";
  const pct = `${Math.round(ratio * 100)}%`;

  return (
    <YStack gap="$3">
      <XStack
        borderRadius={16}
        px="$5"
        py="$5"
        backgroundColor={bg}
        alignItems="center"
        justifyContent="space-between"
        pressStyle={{ opacity: 0.85 }}
        onPress={onPress}
      >
        <XStack alignItems="center" gap="$2.5">
          {isTrade ? (
            <Check color={color} size={22} />
          ) : (
            <X color={color} size={22} />
          )}
          <Text fontSize={22} fontWeight="800" color={color}>
            {isTrade ? "TRADE" : "NO TRADE"}
          </Text>
        </XStack>
        <Text fontSize={28} fontWeight="800" color={color}>
          {pct}
        </Text>
      </XStack>
      <Text textAlign="center" color="$color8" fontSize="$3">
        Tap to add
      </Text>
    </YStack>
  );
}
