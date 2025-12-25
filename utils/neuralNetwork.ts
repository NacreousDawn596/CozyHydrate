import type {
  NeuralNetworkInput,
  NeuralNetworkOutput,
  DrinkLog,
  ReminderResponse,
  BatchPrediction
} from "@/types/hydration";

/* =======================
   Types & Defaults
======================= */

export interface NetworkWeights {
  hourWeights: number[];        // 24h circadian preference
  responseWeight: number;
  volumeWeight: number;
  frequencyWeight: number;
  activityWeight: number;
  temperatureWeight: number;
  humidityWeight: number;
  goalAdjustmentWeight: number;
  hiddenWeight: number;
  bias: number;
  learningRate: number;
}

export const DEFAULT_WEIGHTS: NetworkWeights = {
  hourWeights: Array(24).fill(0.5),
  responseWeight: 1.0,
  volumeWeight: 0.8,
  frequencyWeight: 0.6,
  activityWeight: 0.5,
  temperatureWeight: 0.3,
  humidityWeight: 0.2,
  goalAdjustmentWeight: 0.1,
  hiddenWeight: 1.4,
  bias: -0.3,
  learningRate: 0.02,
};

/* =======================
   Math Utils
======================= */

const clamp = (v: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, v));

const sigmoid = (x: number) =>
  1 / (1 + Math.exp(-x));

const normalize = (v: number, min: number, max: number) =>
  clamp((v - min) / (max - min));

/* =======================
   Feature Extraction
======================= */

function getResponseRate(responses: ReminderResponse[]): number {
  if (!responses.length) return 0.5;
  const done = responses.filter(r => r.responded && r.responseDone).length;
  return done / responses.length;
}

function getRecencyWeightedVolume(drinks: DrinkLog[]): number {
  if (!drinks.length) return 250;

  const now = Date.now();
  let sum = 0;
  let weightSum = 0;

  for (const d of drinks) {
    const ageHours =
      (now - new Date(d.timestamp).getTime()) / 3_600_000;

    const weight = Math.exp(-ageHours / 4); // ~4h half-life
    sum += d.volume * weight;
    weightSum += weight;
  }

  return weightSum === 0 ? 250 : sum / weightSum;
}

function getHourlyPattern(drinks: DrinkLog[]): number[] {
  const pattern = Array(24).fill(0);

  for (const d of drinks) {
    const h = new Date(d.timestamp).getHours();
    pattern[h]++;
  }

  const max = Math.max(...pattern, 1);
  return pattern.map(v => v / max);
}

/* =======================
   Prediction
======================= */

export function predictReminderBatch(
  input: NeuralNetworkInput,
  weights: NetworkWeights = DEFAULT_WEIGHTS,
  count = 12
): BatchPrediction[] {

  const results: BatchPrediction[] = [];

  let virtualTime = Date.now();
  let virtualDrinks = [...input.recentDrinks];
  let virtualResponses = [...input.recentResponses];

  for (let i = 0; i < count; i++) {
    const hour = new Date(virtualTime).getHours();

    const prediction = predictNextReminder(
      {
        ...input,
        currentDate: virtualTime,
        currentHour: hour,
        recentDrinks: virtualDrinks,
        recentResponses: virtualResponses,
      },
      weights
    );

    const confidence = Math.abs(prediction.drinkProbability - 0.5) * 2;

    results.push({
      delayMs: prediction.nextReminderDelay,
      probability: prediction.drinkProbability,
      confidence,
    });

    // ⏩ Advance virtual time
    virtualTime += prediction.nextReminderDelay;

    // 🧠 Simulate behavior (VERY important)
    if (prediction.drinkProbability > 0.6) {
      virtualDrinks.push({
        id: `virtual-${virtualTime}-${i}`,
        timestamp: virtualTime,
        volume: 250,
        manualLog: false,
      });
    }
  }

  return results;
}


export function predictNextReminder(
  input: NeuralNetworkInput,
  weights: NetworkWeights = DEFAULT_WEIGHTS
): NeuralNetworkOutput {

  const { currentHour, recentDrinks, recentResponses, activityLevel, temperature, humidity } = input;

  const responseRate = getResponseRate(recentResponses);
  const avgVolume = getRecencyWeightedVolume(recentDrinks);
  const volumeScore = normalize(avgVolume, 100, 600);

  const hourlyPattern = getHourlyPattern(recentDrinks);
  const patternScore = hourlyPattern[currentHour];

  const hourScore = weights.hourWeights[currentHour];
  const tempScore = normalize(temperature, 0, 40); // Normalize temperature between 0 and 40 C

  /* -------- Hidden Layer -------- */
  const hidden =
    sigmoid(
      hourScore * weights.frequencyWeight +
      responseRate * weights.responseWeight +
      volumeScore * weights.volumeWeight +
      patternScore * 0.5 +
      activityLevel * weights.activityWeight +
      tempScore * weights.temperatureWeight +
      humidity * weights.humidityWeight
    );

  /* -------- Output -------- */
  const probability =
    sigmoid(hidden * weights.hiddenWeight + weights.bias);

  /* -------- Delay Logic -------- */
  const baseDelay =
  2 * 60 * 60 * 1000 *
  (1 - activityLevel * 0.3 - tempScore * 0.2);


  const confidence = Math.abs(probability - 0.5) * 2;
const variability =
  (Math.random() * 2 - 1) *
  (1 - confidence) *
  30 * 60 * 1000;


  const adaptiveDelay =
    baseDelay *
    (probability > 0.65 ? 0.75 :
      probability < 0.35 ? 1.25 : 1.0);

  /* -------- Goal Adjustment -------- */
  const goalAdjustmentFactor = 1.0 + (activityLevel - 0.5) * weights.goalAdjustmentWeight + (tempScore - 0.5) * weights.temperatureWeight;

  return {
    drinkProbability: probability,
    nextReminderDelay: Math.round(adaptiveDelay + variability),
    goalAdjustmentFactor: clamp(goalAdjustmentFactor, 0.8, 1.5),
  };
}

/* =======================
   Learning / Update
======================= */

export function updateWeights(
  weights: NetworkWeights,
  input: NeuralNetworkInput,
  actualResponse: boolean
): NetworkWeights {

  const prediction = predictNextReminder(input, weights);
  const target = actualResponse ? 1 : 0;
  const error = target - prediction.drinkProbability;

  const lr = weights.learningRate;

  const responseRate = getResponseRate(input.recentResponses);
  const avgVolume = getRecencyWeightedVolume(input.recentDrinks);
  const volumeScore = normalize(avgVolume, 100, 600);

  const pattern = getHourlyPattern(input.recentDrinks);
  const patternScore = pattern[input.currentHour];
  const tempScore = normalize(input.temperature, 0, 40);

  const hourWeights = [...weights.hourWeights];
  hourWeights[input.currentHour] =
    clamp(hourWeights[input.currentHour] + error * lr);

  // Goal adjustment learning
  const drinksToday = input.recentDrinks.filter(d => new Date(d.timestamp).toDateString() === new Date().toDateString());
  const totalVolumeToday = drinksToday.reduce((sum, d) => sum + d.volume, 0);
  const goalMet = totalVolumeToday > (input.weight * 33); // Simple goal check
  const goalError = (goalMet ? 1 : 0) - prediction.goalAdjustmentFactor;


  return {
    ...weights,
    hourWeights,

    responseWeight: clamp(
      weights.responseWeight + error * lr * responseRate,
      0,
      2
    ),

    volumeWeight: clamp(
      weights.volumeWeight + error * lr * volumeScore,
      0,
      2
    ),

    frequencyWeight: clamp(
      weights.frequencyWeight + error * lr * patternScore,
      0,
      2
    ),

    activityWeight: clamp(
      weights.activityWeight + error * lr * input.activityLevel,
      0,
      2
    ),

    temperatureWeight: clamp(
      weights.temperatureWeight + error * lr * tempScore,
      0,
      2
    ),

    humidityWeight: clamp(
      weights.humidityWeight + error * lr * input.humidity,
      0,
      2
    ),

    goalAdjustmentWeight: clamp(
      weights.goalAdjustmentWeight + goalError * lr * 0.1,
      0,
      0.5
    ),

    hiddenWeight: clamp(
      weights.hiddenWeight + error * lr * 0.3,
      0.5,
      3
    ),

    bias: clamp(
      weights.bias + error * lr * 0.2,
      -1,
      1
    ),
  };
}
