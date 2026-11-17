"use strict";

function parseNumber(text, decimalMark) {
  const numberText = text.trim();
  const pattern = decimalMark === ","
    ? /^[+-]?(?:\d+(?:,\d*)?|,\d+)(?:e[+-]?\d+)?$/i
    : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (!pattern.test(numberText)) {
    throw new Error(`Enter a number using a decimal ${decimalMark === "," ? "comma" : "point"} (${decimalMark}). Check “${numberText || "empty value"}”.`);
  }
  const value = Number(numberText.replace(",", "."));
  if (!Number.isFinite(value)) throw new Error("The number is too large.");
  return value;
}

function splitValues(text) {
  return text.trim().split(/[\s;]+/).filter(Boolean);
}

function parseValues(text, decimalMark) {
  return splitValues(text).map(value => parseNumber(value, decimalMark));
}

function parsePairs(text, decimalMark) {
  return text.split(/\r?\n/).filter(row => row.trim()).map((row, index) => {
    const values = /[\t;]/.test(row) ? row.split(/[\t;]/) : splitValues(row);
    if (values.length !== 2) throw new Error(`Row ${index + 1} needs one X value and one Y value.`);
    return values.map(value => parseNumber(value, decimalMark));
  });
}

function mean(values) {
  // Center on the first value to preserve precision when data share a large offset.
  const offset = values[0];
  return offset + values.reduce((sum, value) => sum + (value - offset) / values.length, 0);
}

function percentileInc(sorted, proportion) {
  const rank = (sorted.length - 1) * proportion;
  const lower = Math.floor(rank);
  const fraction = rank - lower;
  if (fraction === 0) return sorted[lower];
  return (1 - fraction) * sorted[lower] + fraction * sorted[lower + 1];
}

function medianOfHalves(sorted) {
  const midpoint = Math.floor(sorted.length / 2);
  if (midpoint === 0) return [null, null];
  return [
    percentileInc(sorted.slice(0, midpoint), 0.5),
    percentileInc(sorted.slice(sorted.length - midpoint), 0.5),
  ];
}

function describe(values, quartileMethod) {
  if (!values.length) throw new Error("Enter at least one observation.");
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const average = mean(sorted);
  const squaredDeviations = sorted.reduce((sum, value) => sum + (value - average) ** 2, 0);
  if (!Number.isFinite(squaredDeviations)) throw new Error("These observations exceed the numeric range of the calculator.");
  const sampleVariance = n > 1 ? squaredDeviations / (n - 1) : null;
  const populationVariance = squaredDeviations / n;
  const [q1, q3] = quartileMethod === "halves"
    ? medianOfHalves(sorted)
    : [percentileInc(sorted, 0.25), percentileInc(sorted, 0.75)];
  const counts = new Map();
  for (const value of sorted) counts.set(value, (counts.get(value) ?? 0) + 1);
  let maxFrequency = 1;
  for (const frequency of counts.values()) maxFrequency = Math.max(maxFrequency, frequency);
  const modes = [...counts].filter(([, frequency]) => frequency === maxFrequency && frequency > 1)
    .map(([value]) => value);
  const iqr = q1 === null ? null : q3 - q1;
  const lowerFence = iqr === null ? null : q1 - 1.5 * iqr;
  const upperFence = iqr === null ? null : q3 + 1.5 * iqr;
  const outliers = iqr === null ? null : sorted.filter(value => value < lowerFence || value > upperFence);
  return {
    n, min, max, average, sampleVariance, populationVariance, modes,
    median: percentileInc(sorted, 0.5),
    midrange: min / 2 + max / 2,
    range: max - min,
    sampleSd: sampleVariance === null ? null : Math.sqrt(sampleVariance),
    populationSd: Math.sqrt(populationVariance),
    q1, q3, iqr, lowerFence, upperFence, outliers,
  };
}

const maxTrials = 100_000;

function binomialRange(n, p, lower, upper) {
  if (!Number.isInteger(n) || n < 0 || n > maxTrials) {
    throw new Error("Trials must be a whole number from 0 to 100,000.");
  }
  if (!(p >= 0 && p <= 1)) throw new Error("Success probability must be between 0 and 1.");
  if (!Number.isInteger(lower) || !Number.isInteger(upper) || lower < 0 || upper > n || lower > upper + 1) {
    throw new Error("Success counts must be whole numbers from 0 to the number of trials, in order.");
  }
  if (lower > upper) return 0;
  if (p === 0 || n === 0) return Number(lower === 0);
  if (p === 1) return Number(upper === n);

  // Scale all probabilities by the probability at the mode, then normalize.
  // Summing the requested range directly avoids cancellation in small tails.
  const mode = Math.min(n, Math.floor((n + 1) * p));
  const q = 1 - p;
  let total = 1;
  let selected = Number(mode >= lower && mode <= upper);
  let weight = 1;
  for (let k = mode; k > 0 && weight > 0; k--) {
    weight *= (k / (n - k + 1)) * (q / p);
    total += weight;
    if (k - 1 >= lower && k - 1 <= upper) selected += weight;
  }
  weight = 1;
  for (let k = mode; k < n && weight > 0; k++) {
    weight *= ((n - k) / (k + 1)) * (p / q);
    total += weight;
    if (k + 1 >= lower && k + 1 <= upper) selected += weight;
  }
  return selected / total;
}

function regress(pairs, predictAt = null) {
  if (pairs.length < 2) throw new Error("Enter at least two X and Y pairs.");
  const xMean = mean(pairs.map(([x]) => x));
  const yMean = mean(pairs.map(([, y]) => y));
  let xx = 0;
  let yy = 0;
  let xy = 0;
  let xMin = Infinity;
  let xMax = -Infinity;
  for (const [x, y] of pairs) {
    const dx = x - xMean;
    const dy = y - yMean;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
  }
  if (![xx, yy, xy].every(Number.isFinite)) throw new Error("These observations exceed the numeric range of the calculator.");
  if (xx === 0) throw new Error("Use at least two different X values to fit a line.");
  const slope = xy / xx;
  const intercept = yMean - slope * xMean;
  const correlation = yy === 0 ? null : Math.max(-1, Math.min(1, xy / Math.sqrt(xx) / Math.sqrt(yy)));
  return {
    n: pairs.length,
    slope,
    intercept,
    correlation,
    rSquared: correlation === null ? null : correlation ** 2,
    prediction: predictAt === null ? null : yMean + slope * (predictAt - xMean),
    extrapolation: predictAt !== null && (predictAt < xMin || predictAt > xMax),
  };
}

const statistics = { parseNumber, parseValues, parsePairs, describe, binomialRange, regress };
if (typeof module !== "undefined") module.exports = statistics;
