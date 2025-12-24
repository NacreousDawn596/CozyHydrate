import { useRouter } from "expo-router";
import { Droplets, Plus, TrendingUp, Flame, Thermometer, Wind } from "lucide-react-native";
import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHydration } from "@/context/HydrationContext";

export default function HomeScreen() {
  const router = useRouter();
  const { profile, stats, isLoading, addDrinkLog, colors, weather } = useHydration();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customVolume, setCustomVolume] = useState<string>("250");
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && !profile?.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    const progress = Math.min(stats.todayProgress / stats.todayGoal, 1);
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start();
  }, [stats.todayProgress, stats.todayGoal, progressAnim]);

  const handleQuickAdd = async (volume: number) => {
    await addDrinkLog(volume, true);
  };

  const handleCustomAdd = async () => {
    const volume = parseFloat(customVolume);
    if (volume > 0 && volume <= 2000) {
      await addDrinkLog(volume, true);
      setShowAddModal(false);
      setCustomVolume("250");
    }
  };

  const progressPercentage = Math.min(
    (stats.todayProgress / stats.todayGoal) * 100,
    100
  );

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Stay Hydrated</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          {weather && (
            <View style={styles.weatherContainer}>
              <View style={styles.weatherItem}>
                <Thermometer size={16} color={colors.textSecondary} />
                <Text style={styles.weatherText}>{weather.temp}°C</Text>
              </View>
              <View style={styles.weatherItem}>
                <Wind size={16} color={colors.textSecondary} />
                <Text style={styles.weatherText}>{Math.round(weather.humidity * 100)}%</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Droplets size={32} color={colors.primary} strokeWidth={2} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressAmount}>
                {stats.todayProgress}ml
                <Text style={styles.progressGoal}> / {stats.todayGoal}ml</Text>
              </Text>
              <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>

        {/* <DehydrationScale /> */}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Flame size={24} color={colors.warning} />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color={colors.success} />
            <Text style={styles.statValue}>{stats.todayLogs.length}</Text>
            <Text style={styles.statLabel}>Times Today</Text>
          </View>
        </View>

        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => handleQuickAdd(250)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAddEmoji}>🥤</Text>
              <Text style={styles.quickAddText}>250ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => handleQuickAdd(500)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAddEmoji}>💧</Text>
              <Text style={styles.quickAddText}>500ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => handleQuickAdd(750)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAddEmoji}>🍶</Text>
              <Text style={styles.quickAddText}>750ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={24} color={colors.primary} />
              <Text style={styles.quickAddText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {stats.todayLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No drinks logged yet today</Text>
              <Text style={styles.emptySubtext}>
                Tap a quick add button to start!
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {stats.todayLogs
                .slice()
                .reverse()
                .slice(0, 5)
                .map((log) => (
                  <View key={log.id} style={styles.recentItem}>
                    <View style={styles.recentIcon}>
                      <Droplets size={16} color={colors.primary} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentVolume}>{log.volume}ml</Text>
                      <Text style={styles.recentTime}>
                        {new Date(log.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Amount</Text>
            <TextInput
              style={styles.modalInput}
              value={customVolume}
              onChangeText={setCustomVolume}
              keyboardType="numeric"
              placeholder="Enter amount in ml"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleCustomAdd}
              >
                <Text style={styles.modalButtonPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weatherContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  weatherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weatherText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressCard: {
    marginHorizontal: 24,
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressAmount: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  progressGoal: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickAddSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickAddEmoji: {
    fontSize: 24,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  recentSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: {
    flex: 1,
  },
  recentVolume: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  recentTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  modalButtonPrimary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
});
