import { useCreateTradeEntry } from "@/hooks/queries/use-trade-entries";
import { useCreateVoiceNote } from "@/hooks/queries/use-voice-notes";
import { usePendingDecision } from "@/hooks/use-pending-decision";
import { requestRecordingPermissionsAsync, RecordingPresets, useAudioRecorder } from "expo-audio";
import { AudioLines, Check, Plus, Square, X } from "lucide-react-native";
import { type ReactNode, useCallback, useState } from "react";
import { ActivityIndicator, Alert, Modal } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text, XStack, YStack } from "tamagui";

type RecordingState = "idle" | "recording" | "uploading";

export function AddSessionItemFab({ sessionId }: { sessionId: string }) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const pendingDecision = usePendingDecision();
  const createTradeEntry = useCreateTradeEntry(sessionId);
  const createVoiceNote = useCreateVoiceNote(sessionId);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const toggleExpanded = useCallback(() => {
    if (recordingState !== "idle") return;
    setExpanded((v) => !v);
  }, [recordingState]);

  const openAddSheet = useCallback(() => {
    setExpanded(false);
    setSheetVisible(true);
  }, []);

  const saveNewTrade = useCallback(() => {
    createTradeEntry.mutate();
    setSheetVisible(false);
  }, [createTradeEntry]);

  const startRecording = useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Enable microphone access in settings.");
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordingState("recording");
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    await recorder.stop();
    setRecordingState("idle");
    setExpanded(false);
  }, [recorder]);

  const stopAndUpload = useCallback(async () => {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setRecordingState("idle");
      setExpanded(false);
      return;
    }
    setRecordingState("uploading");
    try {
      await createVoiceNote.mutateAsync({ audioUri: uri, mimeType: "audio/m4a" });
    } catch (err) {
      const message =
        err instanceof Error && err.message === "No speech detected"
          ? "Couldn't hear anything. Try again."
          : "Could not transcribe audio. Try again.";
      Alert.alert("Error", message);
    } finally {
      setRecordingState("idle");
      setExpanded(false);
    }
  }, [recorder, createVoiceNote]);

  return (
    <>
      {expanded && recordingState === "idle" && (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={{ position: "absolute", bottom: 108, right: 24 }}
        >
          <YStack gap="$3">
            <FabAction
              icon={<AudioLines color="#fff" size={20} />}
              label="Record Note"
              onPress={startRecording}
            />
            <FabAction icon={<Plus color="#fff" size={20} />} label="Add Trade" onPress={openAddSheet} />
          </YStack>
        </Animated.View>
      )}

      {recordingState === "recording" && (
        <YStack
          position="absolute"
          bottom={40}
          right={100}
          width={48}
          height={48}
          borderRadius={24}
          backgroundColor="#fff"
          borderWidth={1}
          borderColor="$borderColor"
          alignItems="center"
          justifyContent="center"
          pressStyle={{ opacity: 0.8 }}
          onPress={cancelRecording}
        >
          <X color="#9B2C2C" size={20} />
        </YStack>
      )}

      <YStack
        position="absolute"
        bottom={32}
        right={24}
        width={64}
        height={64}
        borderRadius={32}
        backgroundColor={recordingState === "recording" ? "#E53E3E" : "$blue8"}
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={
          recordingState === "recording"
            ? stopAndUpload
            : recordingState === "uploading"
              ? undefined
              : toggleExpanded
        }
      >
        {recordingState === "uploading" ? (
          <ActivityIndicator color="#fff" />
        ) : recordingState === "recording" ? (
          <Square color="#fff" size={22} fill="#fff" />
        ) : expanded ? (
          <X color="#fff" size={28} />
        ) : (
          <Plus color="#fff" size={28} />
        )}
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
          {sheetVisible && (
            <DecisionStep
              decision={pendingDecision.decision}
              ratio={pendingDecision.ratio}
              onPress={saveNewTrade}
            />
          )}
        </YStack>
      </Modal>
    </>
  );
}

function FabAction({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <XStack
      alignItems="center"
      gap="$2.5"
      backgroundColor="$blue8"
      borderRadius={28}
      pl="$4"
      pr="$4"
      py="$2.5"
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      {icon}
      <Text color="#fff" fontWeight="600" fontSize="$3">
        {label}
      </Text>
    </XStack>
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
