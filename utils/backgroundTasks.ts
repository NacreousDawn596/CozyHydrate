import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_WEIGHTS, type NetworkWeights, predictReminderBatch } from './neuralNetwork';
import { scheduleHydrationBatch } from "./notifications"
import type { UserProfile as OriginalUserProfile, DrinkLog, ReminderResponse } from '@/types/hydration';

// Extend UserProfile to include activityLevel, temperature, and humidity if not present
type UserProfile = OriginalUserProfile & {
    activityLevel?: number;
    temperature?: number;
    humidity?: number;
};

export const HYDRATION_REMINDER_TASK = 'BACKGROUND_HYDRATION_REMINDER';

const STORAGE_KEYS = {
    PROFILE: 'hydration_profile',
    LOGS: 'hydration_logs',
    RESPONSES: 'hydration_responses',
    WEIGHTS: 'neural_weights',
};

TaskManager.defineTask(HYDRATION_REMINDER_TASK, async () => {
    try {
        const [profileStr, logsStr, responsesStr, weightsStr] =
            await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
                AsyncStorage.getItem(STORAGE_KEYS.LOGS),
                AsyncStorage.getItem(STORAGE_KEYS.RESPONSES),
                AsyncStorage.getItem(STORAGE_KEYS.WEIGHTS),
            ]);

        const profile = profileStr
            ? (JSON.parse(profileStr) as UserProfile)
            : null;

        if (!profile || !profile.onboardingComplete) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const drinkLogs = logsStr ? JSON.parse(logsStr) : [];
        const reminderResponses = responsesStr
            ? JSON.parse(responsesStr)
            : [];

        const weights = weightsStr
            ? JSON.parse(weightsStr)
            : DEFAULT_WEIGHTS;

        const batch = predictReminderBatch(
            {
                currentDate: Date.now(),
                currentHour: new Date().getHours(),
                height: profile.height,
                weight: profile.weight,
                recentDrinks: drinkLogs.slice(-20),
                recentResponses: reminderResponses.slice(-20),
                activityLevel: profile.activityLevel ?? 0.5,
                temperature: profile.temperature ?? 22,
                humidity: profile.humidity ?? 0.5,
            },
            weights,
            12
        );

        await scheduleHydrationBatch(batch);

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
        console.error('Background task failed:', err);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});


export async function registerBackgroundTasks() {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(HYDRATION_REMINDER_TASK);
        if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(HYDRATION_REMINDER_TASK, {
                minimumInterval: 60 * 15, // 15 minutes
                stopOnTerminate: false,
                startOnBoot: true,
            });
            console.log('Background task registered');
        }
    } catch (error) {
        console.error('Task registration failed:', error);
    }
}

export async function unregisterBackgroundTasks() {
    try {
        await BackgroundFetch.unregisterTaskAsync(HYDRATION_REMINDER_TASK);
        console.log('Background task unregistered');
    } catch (error) {
        console.error('Task unregistration failed:', error);
    }
}
