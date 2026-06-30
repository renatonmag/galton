import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";

console.log(process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  },
);
