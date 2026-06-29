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

export type Strategy = InferResponseType<
  typeof api.strategies.$get
>["strategies"][number];

export type Setup = InferResponseType<
  (typeof api.strategies)[":strategyId"]["setups"]["$get"]
>["setups"][number];

export type Characteristic = InferResponseType<
  (typeof api.strategies)[":strategyId"]["setups"][":setupId"]["characteristics"]["$get"]
>["characteristics"][number];
