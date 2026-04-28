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

export const FOOD_PRESETS = [
  { id: 'fries',   name: 'Fries',         emoji: '🍟', tempF: 425, time: 25 },
  { id: 'chicken', name: 'Chicken wings', emoji: '🍗', tempF: 400, time: 35 },
  { id: 'salmon',  name: 'Salmon',        emoji: '🐟', tempF: 400, time: 18 },
  { id: 'veg',     name: 'Roast veg',     emoji: '🥕', tempF: 425, time: 22 },
  { id: 'bacon',   name: 'Bacon',         emoji: '🥓', tempF: 400, time: 12 },
  { id: 'pizza',   name: 'Pizza',         emoji: '🍕', tempF: 425, time: 14 },
];

export const SEED_RECIPES = [
  { id: 's1', name: 'Crispy fries',     emoji: '🍟', unit: 'F', ovenTemp: 425, ovenTime: 25, afTemp: 400, afTime: 20, note: 'Shake at 10 min' },
  { id: 's2', name: 'Chicken wings',    emoji: '🍗', unit: 'F', ovenTemp: 400, ovenTime: 35, afTemp: 375, afTime: 28, note: 'Pat dry first' },
  { id: 's3', name: 'Salmon fillet',    emoji: '🐟', unit: 'F', ovenTemp: 400, ovenTime: 18, afTemp: 375, afTime: 14, note: '' },
  { id: 's4', name: 'Brussels sprouts', emoji: '🥬', unit: 'F', ovenTemp: 425, ovenTime: 20, afTemp: 400, afTime: 16, note: 'Cut in half' },
];
