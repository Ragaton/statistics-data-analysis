"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseValues, parsePairs, describe, binomialRange, regress } = require("./statistics");

function closeTo(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be close to ${expected}`);
}

test("Excel paste supports both decimal formats and preserves row pairing", () => {
  assert.deepEqual(parseValues("1,25\r\n2,5; 3", ","), [1.25, 2.5, 3]);
  assert.deepEqual(parsePairs("1.25\t3\r\n2.5\t4", "."), [[1.25, 3], [2.5, 4]]);
  assert.throws(() => parsePairs("1\t\t3\n2\t4", "."), /Row 1/);
  assert.throws(() => parseValues("1,25", "."), /decimal point/);
});

test("descriptive statistics use the selected quartile method and both variance denominators", () => {
  const values = [1, 2, 3, 4, 12];
  const result = describe(values, "inc");
  assert.equal(result.average, 4.4);
  closeTo(result.sampleVariance, 19.3);
  closeTo(result.populationVariance, 15.44);
  assert.deepEqual([result.q1, result.q3, result.outliers], [2, 4, [12]]);
  const halves = describe(values, "halves");
  assert.deepEqual([halves.q1, halves.q3, halves.outliers], [1.5, 8, []]);
  assert.deepEqual(describe([1, 1, 2, 2, 3]).modes, [1, 2]);
  assert.equal(describe([3]).sampleVariance, null);
});

test("binomial probabilities handle inclusive ranges, small tails, and boundary events", () => {
  closeTo(binomialRange(10, 0.5, 7, 10), 176 / 1024);
  assert.equal(binomialRange(60, 0.75, 45, 50).toFixed(3), "0.524");
  closeTo(binomialRange(100, 0.5, 100, 100) / (0.5 ** 100), 1);
  assert.equal(binomialRange(10, 0, 0, 0), 1);
  assert.equal(binomialRange(10, 1, 0, 9), 0);
  assert.equal(binomialRange(0, 0.5, 0, 0), 1);
  assert.equal(binomialRange(10, 0.5, 0, -1), 0);
  assert.equal(binomialRange(10, 0.5, 11, 10), 0);
  assert.throws(() => binomialRange(10, 1.1, 11, 10), /probability/);
});

test("linear regression reports coefficients, correlation, and extrapolation", () => {
  const result = regress([[1, 1], [2, 3], [3, 2]], 4);
  closeTo(result.slope, 0.5);
  closeTo(result.intercept, 1);
  closeTo(result.correlation, 0.5);
  closeTo(result.rSquared, 0.25);
  closeTo(result.prediction, 3);
  assert.equal(result.extrapolation, true);
  assert.equal(regress([[1, 2], [2, 2]]).correlation, null);
  assert.throws(() => regress([[1, 2], [1, 3]]), /different X values/);
});
