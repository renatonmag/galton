import { hc, type InferResponseType } from "hono/client";
import type { AppType } from "@galton/api";
import { supabase } from "./supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

export const api = hc<AppType>(BASE_URL, {
  fetch: async (input, init) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return fetch(input, {
      ...init,
      headers: {
        ...normalizeHeaders(init?.headers),
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
    });
  },
});

export type Session = InferResponseType<typeof api.sessions.$get, 200>["sessions"][number];
export type TradeEntry = InferResponseType<
  (typeof api.sessions)[":sessionId"]["trade-entries"]["$get"],
  200
>["tradeEntries"][number];
export type Stats = InferResponseType<typeof api.stats.$get, 200>;
export type UserPreferences = InferResponseType<
  (typeof api)["user-preferences"]["$get"],
  200
>["userPreferences"];
export type DailyReport = InferResponseType<
  (typeof api.reports)[":date"]["$get"],
  200
>["report"];

export async function uploadTradeEntryComment(
  tradeEntryId: string,
  audioUri: string,
  mimeType: string,
): Promise<{ tradeEntry: TradeEntry }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("audio", {
      uri: audioUri,
      name: "recording.m4a",
      type: mimeType,
    } as unknown as Blob);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/trade-entries/${tradeEntryId}/comment`);
    if (session?.access_token) {
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        reject(new Error(`Transcription failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}
