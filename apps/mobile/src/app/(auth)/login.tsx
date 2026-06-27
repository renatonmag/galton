import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Input, Text, View, YStack } from "tamagui";
import { useEmailOtp } from "../../hooks/useEmailOtp";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";

export default function LoginScreen() {
  const { signInWithGoogle } = useGoogleAuth();
  const { sendOtp } = useEmailOtp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      await sendOtp(email.trim());
      router.push({ pathname: "/(auth)/verify", params: { email: email.trim() } });
    } catch (e: any) {
      setError(e.message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <YStack gap="$3">
        <Input
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          size="$5"
        />
        {error && (
          <Text color="$red10" fontSize="$3">
            {error}
          </Text>
        )}
        <Button
          onPress={handleSendCode}
          theme="blue"
          size="$5"
          disabled={loading || !email}
        >
          {loading ? "Sending…" : "Send code"}
        </Button>
        <Text textAlign="center" color="$color10">
          or
        </Text>
        <Button onPress={signInWithGoogle} theme="blue" size="$5">
          Sign in with Google
        </Button>
      </YStack>
    </View>
  );
}
