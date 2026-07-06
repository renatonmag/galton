import { useCreateTradeEntry } from "@/hooks/queries/use-trade-entries";
import { usePendingDecision } from "@/hooks/use-pending-decision";
import { useCallback, useState } from "react";
import { Modal } from "react-native";
import { Check, Plus, X } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";

export function AddTradeSheet({ sessionId }: { sessionId: string }) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const pendingDecision = usePendingDecision();
  const createTradeEntry = useCreateTradeEntry(sessionId);

  const openAddSheet = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const saveNewTrade = useCallback(() => {
    createTradeEntry.mutate();
    setSheetVisible(false);
  }, [createTradeEntry]);

  return (
    <>
      <YStack
        position="absolute"
        bottom={32}
        right={24}
        width={64}
        height={64}
        borderRadius={32}
        backgroundColor="$blue8"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={openAddSheet}
      >
        <Plus color="#fff" size={28} />
      </YStack>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0,0,0,0.4)"
          onPress={() => setSheetVisible(false)}
        />
        <YStack
          backgroundColor="#fff"
          borderTopLeftRadius={20}
          borderTopRightRadius={20}
          px="$5"
          pt="$5"
          pb="$10"
        >
          {sheetVisible && (
            <DecisionStep
              decision={pendingDecision.decision}
              ratio={pendingDecision.ratio}
              onPress={saveNewTrade}
            />
          )}
        </YStack>
      </Modal>
    </>
  );
}

function DecisionStep({
  decision,
  ratio,
  onPress,
}: {
  decision: "TRADE" | "NO_TRADE";
  ratio: number;
  onPress: () => void;
}) {
  const isTrade = decision === "TRADE";
  const bg = isTrade ? "#C6F6D5" : "#FED7D7";
  const color = isTrade ? "#276749" : "#9B2C2C";
  const pct = `${Math.round(ratio * 100)}%`;

  return (
    <YStack gap="$3">
      <XStack
        borderRadius={16}
        px="$5"
        py="$5"
        backgroundColor={bg}
        alignItems="center"
        justifyContent="space-between"
        pressStyle={{ opacity: 0.85 }}
        onPress={onPress}
      >
        <XStack alignItems="center" gap="$2.5">
          {isTrade ? (
            <Check color={color} size={22} />
          ) : (
            <X color={color} size={22} />
          )}
          <Text fontSize={22} fontWeight="800" color={color}>
            {isTrade ? "TRADE" : "NO TRADE"}
          </Text>
        </XStack>
        <Text fontSize={28} fontWeight="800" color={color}>
          {pct}
        </Text>
      </XStack>
      <Text textAlign="center" color="$color8" fontSize="$3">
        Tap to add
      </Text>
    </YStack>
  );
}
