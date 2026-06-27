import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView name="house.fill" tintColor={color} />
          ),
        }}
      />
    </Tabs>
  );
}
