import { Tabs } from "expo-router";
import { Droplets, History, Sliders } from "lucide-react-native";
import React from "react";
import { useHydration } from "@/context/HydrationContext";

export default function TabLayout() {
  const { colors } = useHydration();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <Droplets color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Sliders color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
