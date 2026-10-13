import { t } from './i18n';

// Conversion rules (from design):
//   Oven → Air fryer:  −25°F (−15°C), −20% time
//   Air fryer → Oven:  +25°F (+15°C), +25% time

export function convertOvenToAirFryer(temp, unit, time) {
  const tempDelta = unit === 'F' ? 25 : 15;
  const minTemp = unit === 'F' ? 200 : 95;
  const newTemp = Math.max(minTemp, Math.round((temp - tempDelta) / 5) * 5);
  const newTime = Math.max(5, Math.round(time * 0.8));
  return { temp: newTemp, time: newTime };
}

export function convertAirFryerToOven(temp, unit, time) {
  const tempDelta = unit === 'F' ? 25 : 15;
  const maxTemp = unit === 'F' ? 500 : 260;
  const newTemp = Math.min(maxTemp, Math.round((temp + tempDelta) / 5) * 5);
  const newTime = Math.max(5, Math.round(time * 1.25));
  return { temp: newTemp, time: newTime };
}

export function convert(temp, unit, time, direction) {
  return direction === 'air-to-oven'
    ? convertAirFryerToOven(temp, unit, time)
    : convertOvenToAirFryer(temp, unit, time);
}

export const fToC = (f) => Math.round(((f - 32) * 5) / 9 / 5) * 5;
export const cToF = (c) => Math.round((c * 9 / 5 + 32) / 5) * 5;

// "20 min" / "1 hr 20 min" / "2 hr"
export function formatMinutes(min) {
  if (min < 60) return `${min} ${t('common.min')}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} ${t('common.hr')}` : `${h} ${t('common.hr')} ${m} ${t('common.min')}`;
}

// Short form for tight chips: "20m" / "1h 20m" / "2h"
export function formatMinutesShort(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const FOOD_PRESETS = [
  { id: 'fries',   emoji: '🍟', tempF: 425, time: 25 },
  { id: 'chicken', emoji: '🍗', tempF: 400, time: 35 },
  { id: 'salmon',  emoji: '🐟', tempF: 400, time: 18 },
  { id: 'veg',     emoji: '🥕', tempF: 425, time: 22 },
  { id: 'bacon',   emoji: '🥓', tempF: 400, time: 12 },
  { id: 'pizza',   emoji: '🍕', tempF: 425, time: 14 },
];

