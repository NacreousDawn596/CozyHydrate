import { useRouter } from "expo-router";
import { Droplets } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useHydration } from "@/context/HydrationContext";

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, profile, isLoading: hydrationLoading } = useHydration();
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!hydrationLoading && profile?.onboardingComplete) {
      router.replace("/(tabs)");
    }
  }, [hydrationLoading, profile, router]);

  React.useEffect(() => {
    if (profile) {
      setHeight(profile.height.toString());
      setWeight(profile.weight.toString());
    }
  }, [profile]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleComplete = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (!h || !w || h < 100 || h > 250 || w < 30 || w > 300) {
      return;
    }

    setIsLoading(true);
    try {
      await completeOnboarding(h, w);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Onboarding error:", error);
      setIsLoading(false);
    }
  };

  const isValid =
    height &&
    weight &&
    parseFloat(height) >= 100 &&
    parseFloat(height) <= 250 &&
    parseFloat(weight) >= 30 &&
    parseFloat(weight) <= 300;

  if (hydrationLoading || profile?.onboardingComplete) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>
            <Droplets size={64} color={Colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Welcome to Hydrate</Text>
          <Text style={styles.subtitle}>
            Let&apos;s personalize your hydration journey
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="170"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              !isValid && styles.buttonDisabled,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Setting up..." : "Get Started 💧"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            We&apos;ll use this to calculate your daily water goal
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  footer: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 16,
  },
});