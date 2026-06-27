import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export function useGoogleAuth() {
  const redirectTo = Linking.createURL("/");

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      showInRecents: true,
      preferEphemeralSession: false, // ← add this
    });

    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }
  };

  const signOut = () => supabase.auth.signOut();

  return { signInWithGoogle, signOut };
}
