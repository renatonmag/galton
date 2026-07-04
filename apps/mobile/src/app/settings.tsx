import {
  useUpdateUserPreferences,
  useUserPreferences,
} from "@/hooks/queries/use-user-preferences";
import { type UserPreferences } from "@/lib/api";
import { ensureNotificationPermission, isReviewNotificationsSupported } from "@/lib/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

function timeStringToDate(time: string): Date {
  const parts = time.split(":");
  const hour = Number(parts[0] ?? 0);
  const minute = Number(parts[1] ?? 0);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { data: preferences, isLoading } = useUserPreferences();

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
            Notifications
          </Text>
          <YStack width={44} height={44} />
        </XStack>

        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" />
          </YStack>
        ) : (
          <SettingsForm preferences={preferences ?? null} />
        )}
      </SafeAreaView>
    </YStack>
  );
}

function SettingsForm({ preferences }: { preferences: UserPreferences | null }) {
  const updatePreferences = useUpdateUserPreferences();
  const [pendingTime, setPendingTime] = useState<Date | null>(
    preferences ? timeStringToDate(preferences.notificationTime) : null,
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = useCallback(async () => {
    if (!pendingTime) return;
    const granted = await ensureNotificationPermission();
    updatePreferences.mutate(dateToTimeString(pendingTime));
    if (!granted) {
      Alert.alert(
        "Notifications disabled",
        "Your review time is saved, but you won't get a reminder until notifications are enabled in system settings.",
      );
    }
  }, [pendingTime, updatePreferences]);

  return (
    <YStack flex={1} px="$5" pt="$4" gap="$4">
      <Text fontSize="$3" color="$color10">
        Get a daily reminder to review any trading sessions you haven&apos;t reviewed yet.
      </Text>

      {!isReviewNotificationsSupported() && (
        <Text fontSize="$3" color="#9B2C2C">
          Reminders require a development build — this won&apos;t fire in Expo Go yet.
        </Text>
      )}

      <Text fontSize="$3" fontWeight="600" color="$blue12">
        Reminder time
      </Text>
      <XStack
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius={10}
        px="$3.5"
        py="$2.5"
        pressStyle={{ opacity: 0.7 }}
        onPress={() => setShowPicker(true)}
      >
        <Text color={pendingTime ? "$blue12" : "$color7"} fontSize="$5">
          {pendingTime
            ? pendingTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Set a time"}
        </Text>
      </XStack>
      {showPicker && (
        <DateTimePicker
          value={pendingTime ?? new Date()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, date) => {
            if (Platform.OS !== "ios") setShowPicker(false);
            if (date) setPendingTime(date);
          }}
        />
      )}

      <Button
        theme="blue"
        borderRadius={10}
        size="$4"
        disabled={!pendingTime || updatePreferences.isPending}
        onPress={handleSave}
      >
        Save
      </Button>
    </YStack>
  );
}
