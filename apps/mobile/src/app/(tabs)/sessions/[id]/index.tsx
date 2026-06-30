import { useLocalSearchParams, useRouter } from "expo-router";
import { AudioLines, ChevronLeft, Square } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";
import { requestRecordingPermissionsAsync, useAudioRecorder, RecordingPresets } from "expo-audio";
import { uploadVoice } from "@/lib/api";

type RecordingState = "idle" | "recording" | "uploading";

export default function SessionScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (recordingState === "recording") {
      pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true);
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }
  }, [recordingState, pulseOpacity]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleFabPress = useCallback(async () => {
    if (recordingState === "uploading") return;

    if (recordingState === "idle") {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão necessária", "Autorize o acesso ao microfone nas configurações.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingState("recording");
      return;
    }

    // recording → stop and upload
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setRecordingState("idle");
      return;
    }
    setRecordingState("uploading");
    try {
      const prefill = await uploadVoice(id, uri, "audio/m4a");
      router.push({
        pathname: "/(tabs)/sessions/[id]/voice-match",
        params: { id, name, prefill: JSON.stringify(prefill) },
      });
    } catch (err) {
      console.error("[Voice] upload/navigation error:", err);
      Alert.alert("Erro", "Não foi possível processar o áudio. Tente novamente.");
    } finally {
      setRecordingState("idle");
    }
  }, [recordingState, recorder, id, name, router]);

  const fabBg =
    recordingState === "recording" ? "#E53E3E" : BLUE;

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
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>
          </View>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.fab, { backgroundColor: fabBg }, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={handleFabPress}
          activeOpacity={0.8}
          disabled={recordingState === "uploading"}
        >
          {recordingState === "uploading" ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : recordingState === "recording" ? (
            <Square color="#fff" size={26} fill="#fff" />
          ) : (
            <AudioLines color="#fff" size={28} />
          )}
        </TouchableOpacity>
      </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK_BLUE,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
