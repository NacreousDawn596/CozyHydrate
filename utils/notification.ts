import * as Notifications from 'expo-notifications';

export async function scheduleHydrationBatch(
  batch: { delayMs: number; confidence: number }[]
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  let accSeconds = 0;
  for (const [i, r] of batch.entries()) {
    accSeconds += Math.round(r.delayMs / 1000);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration check 💧',
        body:
          r.confidence > 0.7
            ? 'You are probably dehydrated. Drink now.'
            : "Small sip won't hurt.",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: accSeconds,
        repeats: false,
      },
    });
  }
}