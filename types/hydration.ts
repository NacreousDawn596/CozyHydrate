import { ThemeName } from "@/constants/colors";

export interface UserProfile {
  height: number;
  weight: number;
  dailyGoal: number;
  onboardingComplete: boolean;
  theme?: ThemeName;
}

export interface DrinkLog {
  id: string;
  timestamp: number;
  volume: number;
  manualLog: boolean;
}

export interface ReminderResponse {
  id: string;
  timestamp: number;
  responded: boolean;
  responseDone: boolean;
}

export interface NeuralNetworkInput {
  currentDate: number;
  currentHour: number;
  height: number;
  weight: number;
  recentDrinks: DrinkLog[];
  recentResponses: ReminderResponse[];
  activityLevel: number; // 0-1, 0 = sedentary, 1 = very active
  temperature: number; // in Celsius
  humidity: number; // 0-1
}

export interface NeuralNetworkOutput {
  nextReminderDelay: number;
  drinkProbability: number;
  goalAdjustmentFactor: number; // e.g., 0.9 to 1.1
}

export interface HydrationStats {
  currentStreak: number;
  longestStreak: number;
  todayProgress: number;
  todayGoal: number;
  todayLogs: DrinkLog[];
}
