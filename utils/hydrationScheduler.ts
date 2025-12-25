import AsyncStorage from '@react-native-async-storage/async-storage';
import { predictReminderBatch } from './neuralNetwork';
import { scheduleHydrationBatch } from './notification';
import type { NeuralNetworkInput } from '@/types/hydration';
import { DEFAULT_WEIGHTS } from './neuralNetwork';

const STORAGE_KEYS = {
  PROFILE: 'hydration_profile',
  LOGS: 'hydration_logs',
  RESPONSES: 'hydration_responses',
  WEIGHTS: 'neural_weights',
};

export async function rescheduleHydration() {
  const [profileStr, logsStr, responsesStr, weightsStr] =
    await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
      AsyncStorage.getItem(STORAGE_KEYS.LOGS),
      AsyncStorage.getItem(STORAGE_KEYS.RESPONSES),
      AsyncStorage.getItem(STORAGE_KEYS.WEIGHTS),
    ]);

  if (!profileStr) return;

  const profile = JSON.parse(profileStr);
  if (!profile.onboardingComplete) return;

  const input: NeuralNetworkInput = {
    currentDate: Date.now(),
    currentHour: new Date().getHours(),
    height: profile.height,
    weight: profile.weight,
    activityLevel: profile.activityLevel ?? 0.5,
    temperature: profile.temperature ?? 22,
    humidity: profile.humidity ?? 0.4,
    recentDrinks: logsStr ? JSON.parse(logsStr) : [],
    recentResponses: responsesStr ? JSON.parse(responsesStr) : [],
  };

  const weights = weightsStr
    ? JSON.parse(weightsStr)
    : DEFAULT_WEIGHTS;

  const batch = predictReminderBatch(input, weights, 16);

  await scheduleHydrationBatch(batch);
}
