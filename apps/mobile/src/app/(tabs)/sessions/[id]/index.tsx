import { api, type TradeEntry } from "@/lib/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Check,
  ChevronLeft,
  Plus,
  SquarePen,
  Trash,
  X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Modal, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Text, XStack, YStack } from "tamagui";

type Result = "open" | "profit" | "loss" | "breakeven";

function computeLocalDecision(entries: TradeEntry[]): {
  ratio: number;
  decision: "TRADE" | "NO_TRADE";
} {
  let profit = 0,
    loss = 0,
    breakeven = 0;
  for (const e of entries) {
    if (e.result === "profit") profit++;
    else if (e.result === "loss") loss++;
    else if (e.result === "breakeven") breakeven++;
  }
  const denominator = profit + loss + breakeven;
  if (denominator === 0) return { ratio: 0, decision: "TRADE" };
  const ratio = (profit + breakeven) / denominator;
  return { ratio, decision: ratio >= 0.5 ? "TRADE" : "NO_TRADE" };
}

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

export default function SessionScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [editMode, setEditMode] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<{
    ratio: number;
    decision: "TRADE" | "NO_TRADE";
  } | null>(null);

  const [editingEntry, setEditingEntry] = useState<TradeEntry | null>(null);
  const [editResult, setEditResult] = useState<Result>("open");
  const [editR, setEditR] = useState("");
  const [editEntryAt, setEditEntryAt] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.sessions[":sessionId"]["trade-entries"]
        .$get({ param: { sessionId: id } })
        .then((r) => r.json())
        .then((data) => {
          if ("tradeEntries" in data)
            setEntries(data.tradeEntries as TradeEntry[]);
        })
        .catch(() => {});
    }, [id]),
  );

  const openAddSheet = useCallback(() => {
    const dec = computeLocalDecision(entries);
    setPendingDecision(dec);
    setSheetVisible(true);
  }, [entries]);

  const saveNewTrade = useCallback(async () => {
    const res = await api.sessions[":sessionId"]["trade-entries"].$post({
      param: { sessionId: id },
      json: {},
    });
    const data = await res.json();
    if ("tradeEntry" in data) {
      setEntries((prev) => [...prev, data.tradeEntry as TradeEntry]);
    }
    setSheetVisible(false);
  }, [id]);

  const deleteEntry = useCallback((entryId: string) => {
    Alert.alert("Delete trade", "Delete this trade entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api["trade-entries"][":id"].$delete({ param: { id: entryId } });
          setEntries((prev) => prev.filter((e) => e.id !== entryId));
        },
      },
    ]);
  }, []);

  const openEditDialog = useCallback((entry: TradeEntry) => {
    setEditingEntry(entry);
    setEditResult(entry.result);
    setEditR(entry.r);
    setEditEntryAt(entry.entryAt ? new Date(entry.entryAt) : null);
    setShowTimePicker(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingEntry) return;
    const res = await api["trade-entries"][":id"].$patch({
      param: { id: editingEntry.id },
      json: {
        result: editResult,
        r: editR.trim() || editingEntry.r,
        entryAt: editEntryAt?.toISOString() ?? null,
      },
    });
    const data = await res.json();
    if ("tradeEntry" in data) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id ? (data.tradeEntry as TradeEntry) : e,
        ),
      );
    }
    setEditingEntry(null);
  }, [editingEntry, editResult, editR, editEntryAt]);

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
            {(() => {
              const { ratio, decision } = computeLocalDecision(entries);
              if (entries.filter((e) => e.result !== "open").length === 0)
                return null;
              return (
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  color={decision === "TRADE" ? "#276749" : "#9B2C2C"}
                >
                  {Math.round(ratio * 100)}%
                </Text>
              );
            })()}
          </XStack>
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
                onTap={() => openEditDialog(entry)}
              />
            ))}
          </ScrollView>
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

      <Modal
        visible={editingEntry != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingEntry(null)}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0,0,0,0.4)"
          justifyContent="center"
          px="$6"
        >
          <YStack backgroundColor="#fff" borderRadius={20} p="$6" gap="$3.5">
            <Text fontSize="$6" fontWeight="700" color="$blue12">
              Edit Trade
            </Text>
            <ResultSegment value={editResult} onChange={setEditResult} />
            <Text fontSize="$3" fontWeight="600" color="$blue12">
              R
            </Text>
            <Input
              size="$4"
              borderRadius={10}
              value={editR}
              onChangeText={setEditR}
              placeholder="e.g. 1/2"
              placeholderTextColor="#aaa"
            />
            <Text fontSize="$3" fontWeight="600" color="$blue12">
              Entry Time
            </Text>
            <XStack
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius={10}
              px="$3.5"
              py="$2.5"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setShowTimePicker(true)}
            >
              <Text color={editEntryAt ? "$blue12" : "$color7"} fontSize="$5">
                {editEntryAt
                  ? editEntryAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not set"}
              </Text>
            </XStack>
            {showTimePicker && (
              <DateTimePicker
                value={editEntryAt ?? new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  if (Platform.OS !== "ios") setShowTimePicker(false);
                  if (date) setEditEntryAt(date);
                }}
              />
            )}
            <XStack gap="$2.5" mt="$1">
              <YStack
                flex={1}
                py="$3"
                borderRadius={10}
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                pressStyle={{ opacity: 0.8 }}
                onPress={() => setEditingEntry(null)}
              >
                <Text color="$color10" fontWeight="600">
                  Cancel
                </Text>
              </YStack>
              <Button
                flex={1}
                theme="blue"
                borderRadius={10}
                size="$4"
                onPress={saveEdit}
              >
                Save
              </Button>
            </XStack>
          </YStack>
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

const RESULTS: { value: Result; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "profit", label: "Profit" },
  { value: "loss", label: "Loss" },
  { value: "breakeven", label: "BE" },
];

function ResultSegment({
  value,
  onChange,
}: {
  value: Result;
  onChange: (v: Result) => void;
}) {
  return (
    <XStack
      borderRadius={10}
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
    >
      {RESULTS.map((r) => (
        <YStack
          key={r.value}
          flex={1}
          py="$2.5"
          alignItems="center"
          backgroundColor={value === r.value ? "$blue12" : "#fff"}
          pressStyle={{ opacity: 0.8 }}
          onPress={() => onChange(r.value)}
        >
          <Text
            fontSize="$3"
            fontWeight="600"
            color={value === r.value ? "#fff" : "$color8"}
          >
            {r.label}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}
