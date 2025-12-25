import { Calendar, Droplets, Trash2 } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHydration } from "@/context/HydrationContext";
import HistoryChart from "@/components/HistoryChart";
import { rescheduleHydration } from "@/utils/hydrationScheduler"

export default function HistoryScreen() {
  const { drinkLogs, addDrinkLog, deleteDrinkLog, colors } = useHydration();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [volume, setVolume] = useState<string>("250");

  const handleAddLog = async () => {
    const v = parseFloat(volume);
    if (v > 0 && v <= 2000) {
      await addDrinkLog(v, true);
      await rescheduleHydration();

      setShowAddModal(false);
      setVolume("250");
    }
  };

  const handleDeleteLog = (logId: string, volume: number) => {
    Alert.alert(
      "Delete Log",
      `Remove ${volume}ml entry from history?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDrinkLog(logId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const groupedLogs = drinkLogs.reduce(
    (acc, log) => {
      const date = new Date(log.timestamp);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    },
    {} as Record<string, typeof drinkLogs>
  );

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {drinkLogs.length > 0 && <HistoryChart logs={drinkLogs} />}
        {sortedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Droplets size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>
              Start logging your water intake to see your history here
            </Text>
          </View>
        ) : (
          sortedDates.map((date) => {
            const logs = groupedLogs[date];
            const totalVolume = logs.reduce((sum, log) => sum + log.volume, 0);

            return (
              <View key={date} style={styles.dateSection}>
                <View style={styles.dateHeader}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={styles.dateText}>{date}</Text>
                  <Text style={styles.dateTotalText}>{totalVolume}ml total</Text>
                </View>

                <View style={styles.logsList}>
                  {logs
                    .slice()
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((log) => (
                      <View key={log.id} style={styles.logItem}>
                        <View style={styles.logIcon}>
                          <Droplets size={16} color={colors.primary} />
                        </View>
                        <View style={styles.logInfo}>
                          <Text style={styles.logVolume}>{log.volume}ml</Text>
                          <Text style={styles.logTime}>
                            {new Date(log.timestamp).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                        {log.manualLog && (
                          <View style={styles.manualBadge}>
                            <Text style={styles.manualBadgeText}>Manual</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => handleDeleteLog(log.id, log.volume)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              </View>
            );
          })
        )}
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
            <Text style={styles.modalTitle}>Log Water Intake</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Amount (ml)</Text>
              <TextInput
                style={styles.modalInput}
                value={volume}
                onChangeText={setVolume}
                keyboardType="numeric"
                placeholder="250"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
            </View>

            <View style={styles.quickSelectContainer}>
              <Text style={styles.quickSelectLabel}>Quick Select</Text>
              <View style={styles.quickSelectButtons}>
                {[250, 500, 750, 1000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickSelectButton}
                    onPress={() => setVolume(amount.toString())}
                  >
                    <Text style={styles.quickSelectText}>{amount}ml</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleAddLog}
              >
                <Text style={styles.modalButtonPrimaryText}>Add Log</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
  },
  dateSection: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    flex: 1,
  },
  dateTotalText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  logsList: {
    gap: 8,
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logInfo: {
    flex: 1,
  },
  logVolume: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  logTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  manualBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  manualBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: colors.textTertiary,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
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
    marginBottom: 20,
    textAlign: "center",
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  quickSelectContainer: {
    marginBottom: 20,
  },
  quickSelectLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  quickSelectButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textPrimary,
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
