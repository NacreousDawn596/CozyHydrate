import { Platform } from "react-native";
import { sendTelemetry } from "./telemetry";
import type * as NotificationsType from "expo-notifications";

let Notifications: typeof NotificationsType | null = null;
let Device: any = null;

if (Platform.OS !== "web") {
  const NotificationsModule = require("expo-notifications");
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

/* =======================
   Permissions
======================= */

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web" || !Notifications || !Device) return null;

  if (!Device.isDevice) {
    console.log("Must use physical device for notifications");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted" ? finalStatus : null;
}

/* =======================
   Single Reminder (keep)
======================= */

export async function scheduleHydrationReminder(
  delayInMs: number
): Promise<string | null> {
  if (Platform.OS === "web" || !Notifications) return null;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const id = await Notifications.scheduleNotificationAsync({
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

    return id;
  } catch (e) {
    console.error("Error scheduling reminder:", e);
    return null;
  }
}

/* =======================
   🔥 Batch Scheduling (NEW)
======================= */

export async function scheduleHydrationBatch(
  batch: { delayMs: number; confidence: number }[]
): Promise<void> {
  if (Platform.OS === "web" || !Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  let accSeconds = 0;

  for (const r of batch) {
    accSeconds += Math.max(60, Math.round(r.delayMs / 1000));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hydration check 💧",
        body:
          r.confidence > 0.7
            ? "You are probably dehydrated. Drink now."
            : "Small sip won’t hurt.",
        data: {
          type: "hydration_reminder",
          confidence: r.confidence,
        },
        categoryIdentifier: "hydration",
        priority:
          Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: accSeconds,
        repeats: false,
      },
    });
  }

  sendTelemetry({
    timestamp: Date.now(),
    reminderSent: true,
    count: batch.length,
    eventType: "reminder_sent",
  });
}

/* =======================
   Utils
======================= */

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web" || !Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === "web" || !Notifications) return;

  if (Platform.OS === "ios") {
    await Notifications.setNotificationCategoryAsync(
      "hydration",
      [
        {
          identifier: "done",
          buttonTitle: "Done 💧",
          options: { opensAppToForeground: false },
        },
        {
          identifier: "not_yet",
          buttonTitle: "Not yet 😴",
          options: { opensAppToForeground: false },
        },
      ]
    );
  }
}

export function addNotificationResponseListener(
  callback: (
    response: NotificationsType.NotificationResponse
  ) => void
): NotificationsType.Subscription | null {
  if (!Notifications) return null;
  return Notifications.addNotificationResponseReceivedListener(
    callback
  );
}

export function addNotificationReceivedListener(
  callback: (
    notification: NotificationsType.Notification
  ) => void
): NotificationsType.Subscription | null {
  if (!Notifications) return null;
  return Notifications.addNotificationReceivedListener(
    callback
  );
}
