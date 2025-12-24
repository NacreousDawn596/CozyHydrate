import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { themes, ThemeName } from "@/constants/colors";
import { useHydration } from "@/context/HydrationContext";

export default function SettingsScreen() {
  const { profile, setProfile, colors, setTheme } = useHydration();
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal.toString() || "2000");

  const handleThemeChange = (themeName: ThemeName) => {
    setTheme(themeName);
  };

  const handleGoalChange = () => {
    const newGoal = parseInt(dailyGoal, 10);
    if (!isNaN(newGoal) && newGoal > 0 && profile) {
      setProfile({ ...profile, dailyGoal: newGoal });
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.themeSelector}>
            {(Object.keys(themes) as ThemeName[]).map((themeName) => {
              const theme = themes[themeName];
              return (
                <TouchableOpacity
                  key={themeName}
                  style={[
                    styles.themeOption,
                    { backgroundColor: theme.cardBackground },
                    profile.theme === themeName && {
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => handleThemeChange(themeName)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.primary,
                        borderWidth: 2,
                        borderColor: theme.background,
                      }}
                    />
                    <Text style={[styles.themeName, { color: theme.textPrimary }]}>
                      {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                    </Text>
                  </View>
                  {profile.theme === themeName && (
                    <Feather name="check-circle" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          <View style={styles.goalContainer}>
            <TextInput
              style={styles.goalInput}
              value={dailyGoal}
              onChangeText={setDailyGoal}
              keyboardType="numeric"
              placeholder="e.g., 2500"
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity style={styles.goalButton} onPress={handleGoalChange}>
              <Text style={styles.goalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      marginBottom: 24,
      color: colors.textPrimary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 12,
      color: colors.textPrimary,
    },
    themeSelector: {
      gap: 12,
    },
    themeOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    themeName: {
      fontSize: 16,
      fontWeight: "500",
    },
    goalContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    goalInput: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.textPrimary,
    },
    goalButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
    },
    goalButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
  });