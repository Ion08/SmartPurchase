import type { HolidayEvent } from '@/types';
import { getHolidaySignal } from '@/lib/holidayService';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardize(value: number, mean: number, scale: number) {
  return (value - mean) / Math.max(scale, 1);
}

function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildFeatures(historyWindow: number[], targetDate: Date, holidays: HolidayEvent[], mean: number, scale: number) {
  const features: number[] = [];
  const normalizedWindow = historyWindow.map((value) => standardize(value, mean, scale));
  features.push(...normalizedWindow);

  const weekday = targetDate.getDay();
  for (let day = 0; day < 7; day += 1) {
    features.push(day === weekday ? 1 : 0);
  }

  const holidaySignal = getHolidaySignal(targetDate.toISOString().slice(0, 10), holidays);
  features.push(weekday === 0 || weekday === 6 ? 1 : 0);
  features.push(holidaySignal.isHoliday ? 1 : 0);
  features.push(clamp(holidaySignal.proximityDays === Infinity ? 0 : 1 / (Math.abs(holidaySignal.proximityDays) + 1), 0, 1));

  const recent = historyWindow.slice(-4);
  const slope = recent.length > 1 ? (recent.at(-1) ?? 0) - (recent[0] ?? 0) : 0;
  features.push(standardize(slope, 0, scale));

  const rollingMean = average(historyWindow);
  features.push(standardize(rollingMean, mean, scale));

  return { features, holidaySignal };
}

interface NeuralModel {
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
}

function createModel(inputSize: number, hiddenSize: number) {
  const random = seededRandom(inputSize * 17 + hiddenSize * 31);
  const w1 = Array.from({ length: hiddenSize }, () =>
    Array.from({ length: inputSize }, () => (random() - 0.5) * 0.3)
  );
  const b1 = Array.from({ length: hiddenSize }, () => 0);
  const w2 = Array.from({ length: hiddenSize }, () => (random() - 0.5) * 0.3);
  const b2 = 0;
  return { w1, b1, w2, b2 } satisfies NeuralModel;
}

function tanh(value: number) {
  return Math.tanh(value);
}

function tanhDerivative(value: number) {
  const activated = Math.tanh(value);
  return 1 - activated * activated;
}

function forward(model: NeuralModel, input: number[]) {
  const hiddenZ = model.w1.map((weights, index) =>
    weights.reduce((sum, weight, weightIndex) => sum + weight * input[weightIndex], model.b1[index])
  );
  const hiddenA = hiddenZ.map((value) => tanh(value));
  const output = hiddenA.reduce((sum, value, index) => sum + value * model.w2[index], model.b2);
  return { hiddenZ, hiddenA, output };
}

function train(model: NeuralModel, samples: Array<{ input: number[]; target: number }>, epochs = 280, learningRate = 0.025) {
  let loss = 0;
  if (samples.length === 0) {
    return { loss: 0 };
  }

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    loss = 0;
    for (const sample of samples) {
      const { hiddenZ, hiddenA, output } = forward(model, sample.input);
      const error = output - sample.target;
      loss += error ** 2;

      const outputGrad = 2 * error;
      const hiddenGrad = model.w2.map((weight, index) => outputGrad * weight * tanhDerivative(hiddenZ[index]));

      for (let index = 0; index < model.w2.length; index += 1) {
        model.w2[index] -= learningRate * outputGrad * hiddenA[index];
      }
      model.b2 -= learningRate * outputGrad;

      for (let h = 0; h < model.w1.length; h += 1) {
        for (let inputIndex = 0; inputIndex < model.w1[h].length; inputIndex += 1) {
          model.w1[h][inputIndex] -= learningRate * hiddenGrad[h] * sample.input[inputIndex];
        }
        model.b1[h] -= learningRate * hiddenGrad[h];
      }
    }
    loss /= samples.length;
  }

  return { loss };
}

export interface HolidayAwareNeuralForecastResult {
  values: number[];
  confidence: number;
  loss: number;
  notes: string[];
}

export function buildHolidayAwareNeuralForecast(params: {
  historyDates: string[];
  historyValues: number[];
  futureDates: string[];
  holidays: HolidayEvent[];
}): HolidayAwareNeuralForecastResult {
  const { historyDates, historyValues, futureDates, holidays } = params;
  const mean = average(historyValues);
  const scale = Math.max(...historyValues, mean, 1);
  const windowSize = Math.min(7, Math.max(3, historyValues.length - 1));

  const samples: Array<{ input: number[]; target: number }> = [];
  for (let index = windowSize; index < historyValues.length; index += 1) {
    const historyWindow = historyValues.slice(index - windowSize, index);
    const targetDate = new Date(historyDates[index]);
    const { features } = buildFeatures(historyWindow, targetDate, holidays, mean, scale);
    samples.push({ input: features, target: standardize(historyValues[index], mean, scale) });
  }

  const inputSize = windowSize + 12;
  const model = createModel(inputSize, 10);
  const { loss } = train(model, samples);

  const values: number[] = [];
  const workingHistory = historyValues.slice();

  futureDates.forEach((futureDateStr) => {
    const targetDate = new Date(futureDateStr);
    const window = workingHistory.slice(-windowSize);
    while (window.length < windowSize) {
      window.unshift(mean);
    }

    const { features, holidaySignal } = buildFeatures(window, targetDate, holidays, mean, scale);
    const predicted = forward(model, features).output;
    const neuralValue = Math.max(0, (predicted * scale) + mean);
    const holidayAdjusted = neuralValue * holidaySignal.multiplier;
    workingHistory.push(holidayAdjusted);
    values.push(holidayAdjusted);
  });

  const confidence = clamp(92 - loss * 28 - Math.max(0, historyValues.length < 10 ? 6 : 0), 76, 96);

  const notes = [
    `trained samples: ${samples.length}`,
    `loss: ${loss.toFixed(4)}`,
    holidays.length > 0 ? 'holiday-aware' : 'holiday fallback only'
  ];

  return { values, confidence: Math.round(confidence), loss, notes };
}
