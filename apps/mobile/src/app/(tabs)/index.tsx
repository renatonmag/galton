import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Button, Text, YStack } from "tamagui";

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
      <Text fontSize="$8" fontWeight="bold">Hello World</Text>
      {session?.user.email && (
        <Text fontSize="$4" color="$color10">{session.user.email}</Text>
      )}
      <Button onPress={() => console.log("pressed")}>Press me</Button>
    </YStack>
  );
}
