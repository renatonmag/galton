import { supabase } from "./supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type Strategy = { id: string; name: string; createdAt: string };

export const strategiesApi = {
  list: async (): Promise<{ strategies: Strategy[] }> => {
    const res = await fetch(`${BASE_URL}/strategies`, {
      headers: await authHeaders(),
    });
    return res.json();
  },
  create: async (name: string): Promise<{ strategy: Strategy }> => {
    const res = await fetch(`${BASE_URL}/strategies`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
};
