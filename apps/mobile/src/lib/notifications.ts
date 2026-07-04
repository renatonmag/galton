import { type Session, type UserPreferences } from "@/lib/api";
import { isRunningInExpoGo } from "expo";

function getNotifications(): typeof import("expo-notifications") | null {
  if (isRunningInExpoGo()) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-notifications") as typeof import("expo-notifications");
}

export function isReviewNotificationsSupported(): boolean {
  return !isRunningInExpoGo();
}

export function configureNotificationHandler() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function computeEligibleSessionsToday(sessions: Session[]): Session[] {
  const today = new Date().toDateString();
  return sessions.filter(
    (s) =>
      new Date(s.openedAt).toDateString() === today &&
      s.tradeCount > 0 &&
      s.reviewedAt == null,
  );
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReviewNotificationIfNeeded(
  sessions: Session[],
  preferences: UserPreferences | null,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (preferences == null) return;

  const eligible = computeEligibleSessionsToday(sessions);
  if (eligible.length === 0) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const [hourStr, minuteStr] = preferences.notificationTime.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Review your trading sessions",
      body: "You have sessions to review",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
