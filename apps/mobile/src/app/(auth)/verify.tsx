import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Text, View, YStack } from "tamagui";
import { useEmailOtp } from "../../hooks/useEmailOtp";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { sendOtp } = useEmailOtp();
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResent(false);
    await sendOtp(email);
    setResent(true);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="bold">
          Check your email
        </Text>
        <Text color="$color10">
          We sent a sign-in link to {email}. Tap it to continue.
        </Text>
        <Button onPress={handleResend} chromeless size="$4">
          {resent ? "Link resent" : "Resend link"}
        </Button>
      </YStack>
    </View>
  );
}
