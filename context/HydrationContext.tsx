import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import type {
  UserProfile,
  DrinkLog,
  ReminderResponse,
  HydrationStats,
} from "@/types/hydration";
import { themes, ThemeName, Theme } from "@/constants/colors";
import { calculateDailyGoal, getStreakDays, getTodayLogs, calculateDynamicGoal } from "@/utils/hydrationCalculator";
import {
  predictNextReminder,
  updateWeights,
  DEFAULT_WEIGHTS,
  type NetworkWeights,
} from "@/utils/neuralNetwork";
import { sendTelemetry } from "@/utils/telemetry";
import { web_fetch } from "@/utils/web_fetch";

interface HydrationContextValue {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  drinkLogs: DrinkLog[];
  reminderResponses: ReminderResponse[];
  stats: HydrationStats;
  isLoading: boolean;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  colors: Theme;
  weather: { temp: number; humidity: number } | null;
  completeOnboarding: (height: number, weight: number) => Promise<void>;
  addDrinkLog: (volume: number, manualLog: boolean) => Promise<void>;
  deleteDrinkLog: (id: string) => Promise<void>;
  recordReminderResponse: (responded: boolean, done: boolean) => Promise<void>;
  getNextReminderTime: () => number;
}

const STORAGE_KEYS = {
  PROFILE: "hydration_profile",
  LOGS: "hydration_logs",
  RESPONSES: "hydration_responses",
  WEIGHTS: "neural_weights",
};

export const [HydrationProvider, useHydration] =
  createContextHook((): HydrationContextValue => {
    const queryClient = useQueryClient();
    const [profile, setProfileState] = useState<UserProfile | null>(null);
    const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
    const [reminderResponses, setReminderResponses] = useState<
      ReminderResponse[]
    >([]);
    const [weights, setWeights] = useState<NetworkWeights>(DEFAULT_WEIGHTS);
    const [theme, setThemeState] = useState<ThemeName>("light");
    const [activityLevel, setActivityLevel] = useState(0.5); // Simulated activity level
    const [dynamicGoal, setDynamicGoal] = useState<number | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [weather, setWeather] = useState<{ temp: number; humidity: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      })();
    }, []);

    useEffect(() => {
      if (location) {
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        const url = `https://wttr.in/${lat},${lon}?format=j1`;
        web_fetch(url).then((res) => {
          if (res.current_condition) {
            setWeather({ temp: parseFloat(res.current_condition[0].temp_C), humidity: parseFloat(res.current_condition[0].humidity) / 100 });
          }
        });
      }
    }, [location]);

    const profileQuery = useQuery({
      queryKey: ["profile"],
      queryFn: async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
        return stored ? (JSON.parse(stored) as UserProfile) : null;
      },
    });

    const logsQuery = useQuery({
      queryKey: ["logs"],
      queryFn: async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
        return stored ? (JSON.parse(stored) as DrinkLog[]) : [];
      },
    });

    const responsesQuery = useQuery({
      queryKey: ["responses"],
      queryFn: async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.RESPONSES);
        return stored ? (JSON.parse(stored) as ReminderResponse[]) : [];
      },
    });

    const weightsQuery = useQuery({
      queryKey: ["weights"],
      queryFn: async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHTS);
        return stored
          ? (JSON.parse(stored) as NetworkWeights)
          : DEFAULT_WEIGHTS;
      },
    });

    useEffect(() => {
      if (profileQuery.data !== undefined) {
        setProfileState(profileQuery.data);
        if (profileQuery.data?.theme) {
          setThemeState(profileQuery.data.theme);
        }
        if (profileQuery.data) {
          setDynamicGoal(profileQuery.data.dailyGoal);
        }
      }
    }, [profileQuery.data]);

    useEffect(() => {
      if (logsQuery.data) {
        setDrinkLogs(logsQuery.data);
      }
    }, [logsQuery.data]);

    useEffect(() => {
      if (responsesQuery.data) {
        setReminderResponses(responsesQuery.data);
      }
    }, [responsesQuery.data]);

    useEffect(() => {
      if (weightsQuery.data) {
        setWeights(weightsQuery.data);
      }
    }, [weightsQuery.data]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (profile) {
          const { goalAdjustmentFactor } = predictNextReminder(
            {
              currentDate: Date.now(),
              currentHour: new Date().getHours(),
              height: profile.height,
              weight: profile.weight,
              recentDrinks: drinkLogs.slice(-20),
              recentResponses: reminderResponses.slice(-20),
              activityLevel,
              temperature: weather?.temp || 20,
              humidity: weather?.humidity || 0.5,
            },
            weights
          );
          const newGoal = calculateDynamicGoal(profile.dailyGoal, goalAdjustmentFactor);
          setDynamicGoal(newGoal);
        }
      }, 60 * 60 * 1000); // Adjust goal every hour
      return () => clearInterval(interval);
    }, [profile, drinkLogs, reminderResponses, weights, activityLevel, weather]);


    const setProfile = async (newProfile: UserProfile) => {
      setProfileState(newProfile);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    };

    const setTheme = (newTheme: ThemeName) => {
      setThemeState(newTheme);
      if (profile) {
        setProfile({ ...profile, theme: newTheme });
      }
    };

    const onboardingMutation = useMutation({
      mutationFn: async ({
        height,
        weight,
      }: {
        height: number;
        weight: number;
      }) => {
        const dailyGoal = calculateDailyGoal(weight, height);
        const newProfile: UserProfile = {
          height,
          weight,
          dailyGoal,
          onboardingComplete: true,
          theme: "light",
        };
        await AsyncStorage.setItem(
          STORAGE_KEYS.PROFILE,
          JSON.stringify(newProfile)
        );
        return newProfile;
      },
      onSuccess: (data) => {
        setProfileState(data);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
    });

    const addLogMutation = useMutation({
      mutationFn: async ({
        volume,
        manualLog,
      }: {
        volume: number;
        manualLog: boolean;
      }) => {
        const newLog: DrinkLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          volume,
          manualLog,
        };
        const updated = [...drinkLogs, newLog];
        await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));

        sendTelemetry({
          timestamp: Date.now(),
          waterVolume: volume,
          eventType: "manual_log",
        });

        return updated;
      },
      onSuccess: (data) => {
        setDrinkLogs(data);
        queryClient.invalidateQueries({ queryKey: ["logs"] });
      },
    });

    const deleteLogMutation = useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        const updated = drinkLogs.filter((log) => log.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
        return updated;
      },
      onSuccess: (data) => {
        setDrinkLogs(data);
        queryClient.invalidateQueries({ queryKey: ["logs"] });
      },
    });

    const responseMutation = useMutation({
      mutationFn: async ({
        responded,
        done,
      }: {
        responded: boolean;
        done: boolean;
      }) => {
        const newResponse: ReminderResponse = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          responded,
          responseDone: done,
        };
        const updatedResponses = [...reminderResponses, newResponse];
        await AsyncStorage.setItem(
          STORAGE_KEYS.RESPONSES,
          JSON.stringify(updatedResponses)
        );

        if (profile) {
          const newWeights = updateWeights(
            weights,
            {
              currentDate: Date.now(),
              currentHour: new Date().getHours(),
              height: profile.height,
              weight: profile.weight,
              recentDrinks: drinkLogs.slice(-20),
              recentResponses: reminderResponses.slice(-20),
              activityLevel,
              temperature: weather?.temp || 20,
              humidity: weather?.humidity || 0.5,
            },
            done
          );
          await AsyncStorage.setItem(
            STORAGE_KEYS.WEIGHTS,
            JSON.stringify(newWeights)
          );
          setWeights(newWeights);
        }

        sendTelemetry({
          timestamp: Date.now(),
          response: done ? "done" : "not_yet",
          eventType: "reminder_response",
        });

        return updatedResponses;
      },
      onSuccess: (data) => {
        setReminderResponses(data);
        queryClient.invalidateQueries({ queryKey: ["responses"] });
      },
    });

    const { mutateAsync: completeOnboardingAsync } = onboardingMutation;

    const completeOnboarding = useCallback(
      async (height: number, weight: number) => {
        await completeOnboardingAsync({ height, weight });
      },
      [completeOnboardingAsync]
    );

    const { mutateAsync: addLogAsync } = addLogMutation;

    const addDrinkLog = useCallback(
      async (volume: number, manualLog: boolean) => {
        await addLogAsync({ volume, manualLog });
      },
      [addLogAsync]
    );

    const { mutateAsync: deleteLogAsync } = deleteLogMutation;

    const deleteDrinkLog = useCallback(
      async (id: string) => {
        await deleteLogAsync({ id });
      },
      [deleteLogAsync]
    );

    const { mutateAsync: recordResponseAsync } = responseMutation;

    const recordReminderResponse = useCallback(
      async (responded: boolean, done: boolean) => {
        await recordResponseAsync({ responded, done });
      },
      [recordResponseAsync]
    );

    const getNextReminderTime = useCallback((): number => {
      if (!profile) return 3 * 60 * 60 * 1000;

      const prediction = predictNextReminder(
        {
          currentDate: Date.now(),
          currentHour: new Date().getHours(),
          height: profile.height,
          weight: profile.weight,
          recentDrinks: drinkLogs.slice(-20),
          recentResponses: reminderResponses.slice(-20),
          activityLevel,
          temperature: weather?.temp || 20,
          humidity: weather?.humidity || 0.5,
        },
        weights
      );

      return prediction.nextReminderDelay;
    }, [profile, drinkLogs, reminderResponses, weights, activityLevel, weather]);

    const stats: HydrationStats = {
      currentStreak: getStreakDays(drinkLogs),
      longestStreak: getStreakDays(drinkLogs),
      todayProgress: getTodayLogs(drinkLogs).reduce(
        (sum, log) => sum + (log as DrinkLog).volume,
        0
      ),
      todayGoal: dynamicGoal || profile?.dailyGoal || 2000,
      todayLogs: getTodayLogs(drinkLogs) as DrinkLog[],
    };

    const colors = themes[theme];

    return {
      profile,
      setProfile,
      drinkLogs,
      reminderResponses,
      stats,
      isLoading:
        profileQuery.isLoading ||
        logsQuery.isLoading ||
        responsesQuery.isLoading,
      theme,
      setTheme,
      colors,
      weather,
      completeOnboarding,
      addDrinkLog,
      deleteDrinkLog,
      recordReminderResponse,
      getNextReminderTime,
    };
  });
