import { AddSessionItemFab } from "@/components/add-session-item-fab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text as UiText } from "@/components/ui/text";
import {
  useDeleteTradeEntry,
  useTradeEntries,
} from "@/hooks/queries/use-trade-entries";
import {
  useMarkSessionReviewed,
  useReopenSessionReview,
  useSessions,
} from "@/hooks/queries/use-sessions";
import { useDeleteVoiceNote, useVoiceNotes } from "@/hooks/queries/use-voice-notes";
import { useStats } from "@/hooks/queries/use-stats";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { type TradeEntry, type VoiceNote } from "@/lib/api";
import { computeLocalDecision } from "@/lib/decision";
import { TRADE_THRESHOLD } from "@galton/api/lib/successRatio";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Clipboard,
  ClipboardCheck,
  Sparkles,
  StickyNote,
  SquarePen,
  Trash,
  TriangleAlert,
  X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
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
          <XStack alignItems="center" gap="$1">
            <Text fontSize="$3" color="$color10">
              {entry.r}
            </Text>
            {entry.direction &&
              (entry.direction === "buy" ? (
                <ArrowUp color="#276749" size={12} />
              ) : (
                <ArrowDown color="#9B2C2C" size={12} />
              ))}
          </XStack>
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

function VoiceNoteCard({
  note,
  editMode,
  onDelete,
}: {
  note: VoiceNote;
  editMode: boolean;
  onDelete: () => void;
}) {
  return (
    <YStack backgroundColor="#F1F1F1" borderRadius={12} px="$4" py="$3.5">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$2.5">
        <XStack flex={1} alignItems="flex-start" gap="$2">
          <StickyNote color="#718096" size={16} style={{ marginTop: 2 }} />
          <Text flex={1} fontSize="$3.5" color="$color12">
            {note.transcript}
          </Text>
        </XStack>
        {editMode && (
          <Button chromeless p="$1" onPress={onDelete}>
            <Trash color="#E57373" size={18} />
          </Button>
        )}
      </XStack>
      {note.coachInsight && <CoachBubble insight={note.coachInsight} />}
      <Text fontSize={11} color="$color8" mt="$1.5">
        {fmtTime(note.createdAt)}
      </Text>
    </YStack>
  );
}

function CoachBubble({ insight }: { insight: NonNullable<VoiceNote["coachInsight"]> }) {
  const isDo = insight.type === "do";
  const accent = isDo ? "#276749" : "#9B2C2C";
  const background = isDo ? "#EBF5EF" : "#FBEBEB";
  return (
    <XStack
      mt="$2.5"
      gap="$2"
      alignItems="flex-start"
      backgroundColor={background}
      borderRadius={10}
      borderLeftWidth={3}
      borderLeftColor={accent}
      px="$3"
      py="$2.5"
    >
      {isDo ? (
        <Sparkles color={accent} size={16} style={{ marginTop: 1 }} />
      ) : (
        <TriangleAlert color={accent} size={16} style={{ marginTop: 1 }} />
      )}
      <Text flex={1} fontSize="$3.5" fontWeight="600" color={accent}>
        {insight.text}
      </Text>
    </XStack>
  );
}

function HeaderStat({ label, ratio }: { label: string; ratio: number }) {
  return (
    <XStack alignItems="baseline" gap="$1">
      <Text
        fontSize="$4"
        fontWeight="700"
        color={ratio >= TRADE_THRESHOLD ? "#276749" : "#9B2C2C"}
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
  const [tab, setTab] = useState<"trades" | "notes">("trades");

  const { data: entries = [], isLoading, isError, refetch } = useTradeEntries(id);
  const { data: voiceNotes = [] } = useVoiceNotes(id);
  const { data: stats } = useStats();
  const { data: sessions } = useSessions();
  const session = sessions?.find((s) => s.id === id);
  useRefreshOnFocus(refetch);
  const deleteTradeEntry = useDeleteTradeEntry(id);
  const deleteVoiceNote = useDeleteVoiceNote(id);
  const markReviewed = useMarkSessionReviewed();
  const reopenReview = useReopenSessionReview();

  const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const sortedEntries = [...entries].sort(byCreatedAt);
  const sortedNotes = [...voiceNotes].sort(byCreatedAt);

  const toggleReview = useCallback(() => {
    if (session?.reviewedAt) {
      Alert.alert("Reopen review", "Reopen review for this session?", [
        { text: "Cancel", style: "cancel" },
        { text: "Reopen", onPress: () => reopenReview.mutate(id) },
      ]);
    } else {
      Alert.alert("Mark as reviewed", "Mark this session as reviewed?", [
        { text: "Cancel", style: "cancel" },
        { text: "Mark reviewed", onPress: () => markReviewed.mutate(id) },
      ]);
    }
  }, [session?.reviewedAt, id, markReviewed, reopenReview]);

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

  const deleteNote = useCallback(
    (noteId: string) => {
      Alert.alert("Delete note", "Delete this voice note?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteVoiceNote.mutate(noteId),
        },
      ]);
    },
    [deleteVoiceNote],
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
          <XStack alignItems="center" gap="$3">
            {entries.length > 0 && (
              <Button chromeless p="$1" onPress={toggleReview}>
                {session?.reviewedAt ? (
                  <ClipboardCheck color="#276749" size={20} />
                ) : (
                  <Clipboard color="#1A3A5C" size={20} />
                )}
              </Button>
            )}
            <Button chromeless p="$1" onPress={() => setEditMode((v) => !v)}>
              <SquarePen color={editMode ? "#6FA8DC" : "#1A3A5C"} size={20} />
            </Button>
          </XStack>
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
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "trades" | "notes")}
              style={{ flex: 1 }}
            >
              <TabsList>
                <TabsTrigger value="trades">
                  <UiText>Trades</UiText>
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <UiText>Notes</UiText>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trades" style={{ flex: 1 }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 96 }}
                >
                  {sortedEntries.map((entry) => (
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
              </TabsContent>

              <TabsContent value="notes" style={{ flex: 1 }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 96 }}
                >
                  {sortedNotes.map((note) => (
                    <VoiceNoteCard
                      key={note.id}
                      note={note}
                      editMode={editMode}
                      onDelete={() => deleteNote(note.id)}
                    />
                  ))}
                </ScrollView>
              </TabsContent>
            </Tabs>
          )}
        </YStack>
      </SafeAreaView>

      <AddSessionItemFab sessionId={id} />
    </YStack>
  );
}
