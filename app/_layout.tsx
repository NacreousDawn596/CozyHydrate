import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HydrationProvider, useHydration } from "@/context/HydrationContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function NotificationManager() {
  const { recordReminderResponse, addDrinkLog, getNextReminderTime, profile } =
    useHydration();

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    if (!profile?.onboardingComplete) {
      return;
    }

    let mounted = true;

    const setupNotifications = async () => {
      try {
        const {
          registerForPushNotifications,
          setupNotificationCategories,
          addNotificationResponseListener,
          scheduleHydrationReminder,
        } = await import("@/utils/notifications");

        if (!mounted) return;

        await registerForPushNotifications();
        await setupNotificationCategories();

        const delay = getNextReminderTime();
        await scheduleHydrationReminder(delay);

        const subscription = addNotificationResponseListener(async (response) => {
          const actionId = response.actionIdentifier;

          if (actionId === "done") {
            await recordReminderResponse(true, true);
            await addDrinkLog(250, false);

            const delay = getNextReminderTime();
            await scheduleHydrationReminder(delay);
          } else if (actionId === "not_yet") {
            await recordReminderResponse(true, false);

            const delay = getNextReminderTime();
            await scheduleHydrationReminder(delay);
          } else if (
            actionId === "DEFAULT" ||
            actionId === "expo.modules.notifications.actions.DEFAULT"
          ) {
            const delay = getNextReminderTime();
            await scheduleHydrationReminder(delay);
          }
        });

        return subscription;
      } catch (error) {
        console.log("Notifications not available:", error);
        return null;
      }
    };

    const subscriptionPromise = setupNotifications();

    return () => {
      mounted = false;
      subscriptionPromise.then((subscription) => {
        subscription?.remove();
      });
    };
  }, [profile, recordReminderResponse, addDrinkLog, getNextReminderTime]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    if (Platform.OS !== "web") {
      import("@/utils/backgroundTasks").then((mod) => {
        mod.registerBackgroundTasks();
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationProvider>
        <NotificationManager />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </HydrationProvider>
    </QueryClientProvider>
  );
}
