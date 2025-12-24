import { Platform } from "react-native";
import { sendTelemetry } from "./telemetry";
import type * as NotificationsType from "expo-notifications";

let Notifications: typeof NotificationsType | null = null;
let Device: any = null;

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NotificationsModule = require("expo-notifications");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Device = require("expo-device");
  Notifications = NotificationsModule;

  NotificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web" || !Notifications || !Device) {
    return null;
  }

  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  return finalStatus;
}

export async function scheduleHydrationReminder(
  delayInMs: number
): Promise<string | null> {
  if (Platform.OS === "web" || !Notifications) {
    return null;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to hydrate! 💧",
        body: "Your body could use some water right now",
        data: { type: "hydration_reminder" },
        categoryIdentifier: "hydration",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.floor(delayInMs / 1000)),
      },
    });

    sendTelemetry({
      timestamp: Date.now(),
      reminderSent: true,
      eventType: "reminder_sent",
    });

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web" || !Notifications) {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling notifications:", error);
  }
}

export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === "web" || !Notifications) {
    return;
  }

  if (Platform.OS === "ios") {
    await Notifications.setNotificationCategoryAsync("hydration", [
      {
        identifier: "done",
        buttonTitle: "Done 💧",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "not_yet",
        buttonTitle: "Not yet 😴",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }
}

export function addNotificationResponseListener(
  callback: (response: NotificationsType.NotificationResponse) => void
): NotificationsType.Subscription | null {
  if (!Notifications) return null;
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export function addNotificationReceivedListener(
  callback: (notification: NotificationsType.Notification) => void
): NotificationsType.Subscription | null {
  if (!Notifications) return null;
  return Notifications.addNotificationReceivedListener(callback);
}
