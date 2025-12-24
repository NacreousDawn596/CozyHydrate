
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useHydration } from "@/context/HydrationContext";
import { LinearGradient } from "expo-linear-gradient";

const DehydrationScale = () => {
  const { stats, colors } = useHydration();
  const { todayProgress, todayGoal } = stats;

  const getHydrationInfo = () => {
    if (todayGoal === 0) {
      return {
        level: "Unknown",
        color: [colors.textTertiary, colors.textTertiary],
        percentage: 0,
      };
    }

    const percentage = Math.min((todayProgress / todayGoal) * 100, 100);

    if (percentage < 25) {
      return {
        level: "Very Dehydrated",
        color: [colors.error, colors.warning],
        percentage,
      };
    }
    if (percentage < 50) {
      return {
        level: "Dehydrated",
        color: [colors.warning, colors.secondary],
        percentage,
      };
    }
    if (percentage < 75) {
      return {
        level: "Slightly Dehydrated",
        color: [colors.secondary, colors.primary],
        percentage,
      };
    }
    if (percentage < 100) {
      return {
        level: "Hydrated",
        color: [colors.primary, colors.success],
        percentage,
      };
    }
    return {
      level: "Well Hydrated",
      color: [colors.success, colors.success],
      percentage,
    };
  };

  const { level, color, percentage } = getHydrationInfo();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Hydration Level:{" "}
        <Text style={{ color: color[0] }}>{level}</Text>
      </Text>
      <View style={[styles.scaleContainer, { backgroundColor: colors.cardBackground }]}>
        <LinearGradient
          colors={color}
          style={[styles.indicator, { width: `${percentage}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  scaleContainer: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  indicator: {
    height: "100%",
  },
});

export default DehydrationScale;
