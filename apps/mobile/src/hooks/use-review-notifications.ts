import { useSessions } from "@/hooks/queries/use-sessions";
import { useUserPreferences } from "@/hooks/queries/use-user-preferences";
import { isReviewNotificationsSupported, scheduleReviewNotificationIfNeeded } from "@/lib/notifications";
import { queryKeys } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useReviewNotificationsSync() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: sessions } = useSessions();
  const { data: preferences } = useUserPreferences();

  useEffect(() => {
    if (sessions === undefined || preferences === undefined) return;
    scheduleReviewNotificationIfNeeded(sessions, preferences ?? null);
  }, [sessions, preferences]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        queryClient.refetchQueries({ queryKey: queryKeys.sessions });
        queryClient.refetchQueries({ queryKey: queryKeys.userPreferences });
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!isReviewNotificationsSupported()) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      routerRef.current.push("/(tabs)/sessions");
    });
    return () => subscription.remove();
  }, []);
}
