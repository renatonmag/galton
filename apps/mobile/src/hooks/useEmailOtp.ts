import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

export function useEmailOtp() {
  const sendOtp = async (email: string) => {
    const redirectTo = Linking.createURL("/");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
  };

  return { sendOtp };
}
