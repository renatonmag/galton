import { QueryClient } from "@tanstack/react-query";
import { DetailedError } from "hono/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        if (
          error instanceof DetailedError &&
          typeof error.statusCode === "number" &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  sessions: ["sessions"] as const,
  tradeEntries: (sessionId: string) => ["sessions", sessionId, "trade-entries"] as const,
  voiceNotes: (sessionId: string) => ["sessions", sessionId, "voice-notes"] as const,
  stats: ["stats"] as const,
  userPreferences: ["user-preferences"] as const,
  dailyReports: ["daily-reports"] as const,
  dailyReport: (date: string) => ["daily-reports", date] as const,
};
