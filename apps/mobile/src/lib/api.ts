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
