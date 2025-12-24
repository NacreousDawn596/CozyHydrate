import React, { useMemo, useState } from "react";
import { View, Text, Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useHydration } from "@/context/HydrationContext";
import { DrinkLog } from "@/types/hydration";

type TimePeriod = 3 | 7 | 10 | 15 | 30;

const TIME_PERIODS: TimePeriod[] = [3, 7, 10, 15, 30];

const HistoryChart = ({ logs }: { logs: DrinkLog[] }) => {
  const { colors } = useHydration();
  const [periodIndex, setPeriodIndex] = useState(1); // Start with 7 days
  const currentPeriod = TIME_PERIODS[periodIndex];

  const handleChartPress = () => {
    setPeriodIndex((prev) => (prev + 1) % TIME_PERIODS.length);
  };

  const filteredLogs = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - currentPeriod);
    cutoffDate.setHours(0, 0, 0, 0);

    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });
  }, [logs, currentPeriod]);

  const groupedData = useMemo(() => {
    // Create a map for all dates in the period
    const dailyTotals: { [key: string]: number } = {};

    // Fill in all dates in the period with 0
    const today = new Date();
    for (let i = currentPeriod - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      dailyTotals[dateKey] = 0;
    }

    // Add actual log data
    filteredLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      if (dailyTotals.hasOwnProperty(dateKey)) {
        dailyTotals[dateKey] += log.volume;
      }
    });

    // Sort dates and prepare data
    const sortedDates = Object.keys(dailyTotals).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return {
      labels: sortedDates.map((dateKey) => {
        const d = new Date(dateKey);
        return `${d.getMonth() + 1}/${d.getDate()}`; // Format as MM/DD
      }),
      volumes: sortedDates.map((dateKey) => dailyTotals[dateKey]),
    };
  }, [filteredLogs, currentPeriod]);

  const data = {
    labels: groupedData.labels,
    datasets: [
      {
        data: groupedData.volumes.length > 0 ? groupedData.volumes : [0],
      },
    ],
  };

  if (logs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Water Intake History
        </Text>
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
          <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
            No data available yet. Start logging your water intake!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Water Intake History
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Last {currentPeriod} days • Tap to change period
      </Text>
      <TouchableOpacity onPress={handleChartPress} activeOpacity={0.8}>
        <LineChart
          data={data}
          width={Dimensions.get("window").width - 48}
          height={220}
          chartConfig={{
            backgroundColor: colors.cardBackground,
            backgroundGradientFrom: colors.cardBackground,
            backgroundGradientTo: colors.cardBackground,
            decimalPlaces: 0,
            color: (opacity = 1) => {
              const hex = colors.primary.replace("#", "");
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            },
            labelColor: (opacity = 1) => {
              const hex = colors.textSecondary.replace("#", "");
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            },
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: colors.primary,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyState: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
});

export default HistoryChart;