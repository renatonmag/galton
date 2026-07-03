import { useTradeEntries, useTranscribeTradeEntryComment, useUpdateTradeEntry } from "@/hooks/queries/use-trade-entries";
import { type TradeEntry } from "@/lib/api";
import { type Result } from "@/lib/decision";
import DateTimePicker from "@react-native-community/datetimepicker";
import { requestRecordingPermissionsAsync, RecordingPresets, useAudioRecorder } from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AudioLines, ChevronLeft, Square } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Text, XStack, YStack } from "tamagui";

export default function EditTradeScreen() {
  const router = useRouter();
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId: string }>();
  const { data: entries = [], isLoading } = useTradeEntries(id);
  const entry = entries.find((e) => e.id === entryId);

  useEffect(() => {
    if (!isLoading && !entry) {
      router.back();
    }
  }, [isLoading, entry, router]);

  if (isLoading || !entry) {
    return (
      <YStack flex={1} backgroundColor="#fff">
        <SafeAreaView style={{ flex: 1 }}>
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" />
          </YStack>
        </SafeAreaView>
      </YStack>
    );
  }

  return <EditTradeForm sessionId={id} entry={entry} />;
}

function EditTradeForm({ sessionId, entry }: { sessionId: string; entry: TradeEntry }) {
  const router = useRouter();
  const updateTradeEntry = useUpdateTradeEntry(sessionId);
  const transcribeComment = useTranscribeTradeEntryComment(sessionId);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [editResult, setEditResult] = useState<Result>(entry.result);
  const [editR, setEditR] = useState(entry.r);
  const [editEntryAt, setEditEntryAt] = useState<Date | null>(
    entry.entryAt ? new Date(entry.entryAt) : null,
  );
  const [editComment, setEditComment] = useState(entry.comment ?? "");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "uploading">(
    "idle",
  );

  const saveEdit = useCallback(() => {
    updateTradeEntry.mutate({
      id: entry.id,
      result: editResult,
      r: editR.trim() || entry.r,
      entryAt: editEntryAt?.toISOString() ?? null,
      comment: editComment.trim() || null,
    });
    router.back();
  }, [entry, editResult, editR, editEntryAt, editComment, updateTradeEntry, router]);

  const handleMicPress = useCallback(async () => {
    if (recordingState === "uploading") return;

    if (recordingState === "idle") {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Enable microphone access in settings.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingState("recording");
      return;
    }

    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setRecordingState("idle");
      return;
    }
    setRecordingState("uploading");
    try {
      const tradeEntry = await transcribeComment.mutateAsync({
        id: entry.id,
        audioUri: uri,
        mimeType: "audio/m4a",
      });
      setEditComment(tradeEntry.comment ?? "");
    } catch (err) {
      console.error("[Comment] transcription error:", err);
      Alert.alert("Error", "Could not transcribe audio. Try again.");
    } finally {
      setRecordingState("idle");
    }
  }, [entry.id, recordingState, recorder, transcribeComment]);

  return (
    <YStack flex={1} backgroundColor="#fff">
      <SafeAreaView style={{ flex: 1 }}>
        <XStack px="$5" pt="$2" alignItems="center" justifyContent="space-between">
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
          <Text fontSize="$5" fontWeight="700" color="$blue12">
            Edit Trade
          </Text>
          <YStack width={44} height={44} />
        </XStack>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
            <Text fontSize="$3" fontWeight="600" color="$blue12">
              Comment
            </Text>
            <XStack gap="$2.5" alignItems="flex-end">
              <Input
                flex={1}
                multiline
                minHeight={44}
                size="$4"
                borderRadius={10}
                value={editComment}
                onChangeText={setEditComment}
                placeholder="Add a comment..."
                placeholderTextColor="#aaa"
              />
              <YStack
                width={44}
                height={44}
                borderRadius={22}
                alignItems="center"
                justifyContent="center"
                backgroundColor={recordingState === "recording" ? "#E53E3E" : "$blue8"}
                pressStyle={{ opacity: 0.8 }}
                onPress={handleMicPress}
              >
                {recordingState === "uploading" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : recordingState === "recording" ? (
                  <Square color="#fff" size={18} fill="#fff" />
                ) : (
                  <AudioLines color="#fff" size={20} />
                )}
              </YStack>
            </XStack>
            <XStack gap="$2.5" mt="$1">
              <YStack
                flex={1}
                py="$3"
                borderRadius={10}
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                pressStyle={{ opacity: 0.8 }}
                onPress={() => router.back()}
              >
                <Text color="$color10" fontWeight="600">
                  Cancel
                </Text>
              </YStack>
              <Button flex={1} theme="blue" borderRadius={10} size="$4" onPress={saveEdit}>
                Save
              </Button>
            </XStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
