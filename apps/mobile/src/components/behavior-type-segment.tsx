import { Text, XStack, YStack } from "tamagui";

const TYPES: { value: "do" | "dont"; label: string }[] = [
  { value: "do", label: "Do" },
  { value: "dont", label: "Don't" },
];

// A do/dont selector matching the segment pattern used on the trade edit screen.
export function BehaviorTypeSegment({
  value,
  onChange,
}: {
  value: "do" | "dont" | null;
  onChange: (v: "do" | "dont") => void;
}) {
  return (
    <XStack borderRadius={10} borderWidth={1} borderColor="$borderColor" overflow="hidden">
      {TYPES.map((t) => (
        <YStack
          key={t.value}
          flex={1}
          py="$2.5"
          alignItems="center"
          backgroundColor={value === t.value ? "$blue12" : "#fff"}
          pressStyle={{ opacity: 0.8 }}
          onPress={() => onChange(t.value)}
        >
          <Text fontSize="$3" fontWeight="600" color={value === t.value ? "#fff" : "$color8"}>
            {t.label}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}
