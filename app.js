"use strict";

function format(value, decimalMark) {
  if (value === null) return "Unavailable";
  if (typeof value !== "number") return value;
  if (!Number.isFinite(value)) throw new Error("The result exceeds the numeric range of the calculator.");
  const magnitude = Math.abs(value);
  const scientific = magnitude >= 1e12 || (magnitude > 0 && magnitude < 1e-6);
  const locale = decimalMark === "," ? "da-DK" : "en-US";
  return new Intl.NumberFormat(locale, {
    maximumSignificantDigits: 10,
    useGrouping: false,
    notation: scientific ? "scientific" : "standard",
  }).format(value === 0 ? 0 : value);
}

function descriptiveResults(fields) {
  const values = statistics.parseValues(fields.values.value, fields.decimal.value);
  const result = statistics.describe(values, fields.quartiles.value);
  const excelQuartiles = fields.quartiles.value === "inc";
  const lowerQuartile = excelQuartiles ? "QUARTILE.INC(data, 1)" : "Median of lower half";
  const upperQuartile = excelQuartiles ? "QUARTILE.INC(data, 3)" : "Median of upper half";
  const list = values => values.map(value => format(value, fields.decimal.value)).join(" · ");
  const rows = [
    ["Count", result.n, "COUNT(data)"],
    ["Mean", result.average, "AVERAGE(data)"],
    ["Median", result.median, "MEDIAN(data)"],
    ["Mode", list(result.modes) || "None", "MODE.MULT(data)"],
    ["Minimum", result.min, "MIN(data)"],
    ["Maximum", result.max, "MAX(data)"],
    ["Range", result.range, "Maximum − minimum"],
    ["Midrange", result.midrange, "(Minimum + maximum) / 2"],
    ["Sample variance", result.sampleVariance, "VAR.S(data)"],
    ["Sample standard deviation", result.sampleSd, "STDEV.S(data)"],
    ["Population variance", result.populationVariance, "VAR.P(data)"],
    ["Population standard deviation", result.populationSd, "STDEV.P(data)"],
    ["First quartile (Q1)", result.q1, lowerQuartile],
    ["Third quartile (Q3)", result.q3, upperQuartile],
    ["Interquartile range", result.iqr, "Q3 − Q1"],
    ["Lower outlier fence", result.lowerFence, "Q1 − 1.5 × IQR"],
    ["Upper outlier fence", result.upperFence, "Q3 + 1.5 × IQR"],
    ["Outliers", result.outliers === null ? null : list(result.outliers) || "None", "Values outside the fences"],
  ];
  return { rows };
}

function binomialResults(fields) {
  const decimalMark = fields.decimal.value;
  const n = statistics.parseNumber(fields.trials.value, decimalMark);
  const p = statistics.parseNumber(fields.probability.value, decimalMark);
  const k = statistics.parseNumber(fields.successes.value, decimalMark);
  const event = fields.event.value;
  if (!Number.isInteger(k) || k < 0 || k > n) {
    throw new Error("The success count k must be a whole number from 0 to the number of trials.");
  }
  const m = event === "between" ? statistics.parseNumber(fields.upper.value, decimalMark) : k;
  if (m < k) throw new Error("The upper count m must be at least as large as k.");
  const events = {
    exact: [k, k, `P(X = ${k})`, "BINOM.DIST(k, n, p, FALSE)"],
    atMost: [0, k, `P(X ≤ ${k})`, "BINOM.DIST(k, n, p, TRUE)"],
    less: [0, k - 1, `P(X < ${k})`, k === 0 ? "Empty event" : "BINOM.DIST(k−1, n, p, TRUE)"],
    atLeast: [k, n, `P(X ≥ ${k})`, "BINOM.DIST.RANGE(n, p, k, n)"],
    greater: [k + 1, n, `P(X > ${k})`, k === n ? "Empty event" : "BINOM.DIST.RANGE(n, p, k+1, n)"],
    between: [k, m, `P(${k} ≤ X ≤ ${m})`, "BINOM.DIST.RANGE(n, p, k, m)"],
  };
  const [lower, upper, eventLabel, formula] = events[event];
  const probability = statistics.binomialRange(n, p, lower, upper);
  return { rows: [
    [eventLabel, probability, formula],
    ["Percentage", `${format(100 * probability, decimalMark)}%`, "Probability × 100"],
  ] };
}

function regressionResults(fields) {
  const decimalMark = fields.decimal.value;
  const predictAt = fields.prediction.value.trim() ? statistics.parseNumber(fields.prediction.value, decimalMark) : null;
  const pairs = statistics.parsePairs(fields.pairs.value, decimalMark);
  const result = statistics.regress(pairs, predictAt);
  const rows = [
    ["Pairs", result.n, "Count of complete rows"],
    ["Slope", result.slope, "SLOPE(y, x)"],
    ["Intercept", result.intercept, "INTERCEPT(y, x)"],
    ["Pearson correlation (r)", result.correlation, "CORREL(x, y)"],
    ["R²", result.rSquared, "RSQ(y, x)"],
  ];
  if (predictAt !== null) {
    rows.push([`Predicted Y at X = ${format(predictAt, decimalMark)}`, result.prediction, "FORECAST.LINEAR(new_x, y, x)"]);
  }
  const note = result.extrapolation ? "This prediction is outside the observed X range." : "";
  return { rows, note };
}

function createCell(tag, text, className = "") {
  const cell = document.createElement(tag);
  cell.textContent = text;
  cell.className = className;
  return cell;
}

function renderTable(rows, decimalMark) {
  const table = document.createElement("table");
  const header = table.createTHead().insertRow();
  for (const label of ["Measure", "Value", "Excel / method"]) {
    const cell = createCell("th", label);
    cell.scope = "col";
    header.append(cell);
  }
  const body = table.createTBody();
  for (const [label, value, formula] of rows) {
    const row = body.insertRow();
    const name = createCell("th", label);
    name.scope = "row";
    row.append(name, createCell("td", format(value, decimalMark), "value"), createCell("td", formula, "formula"));
  }
  return table;
}

const calculators = {
  descriptive: {
    calculate: descriptiveResults,
    example: { values: "4\n6\n7\n7\n9\n10\n13\n24", quartiles: "inc" },
  },
  binomial: {
    calculate: binomialResults,
    example: { trials: "10", probability: "0.5", event: "atLeast", successes: "7", upper: "" },
  },
  regression: {
    calculate: regressionResults,
    example: { pairs: "1\t3\n2\t5\n3\t7\n4\t9", prediction: "2.5" },
  },
};

const navButtons = document.querySelectorAll("[data-view]");
for (const button of navButtons) {
  button.addEventListener("click", () => {
    for (const navButton of navButtons) {
      const active = button === navButton;
      navButton.setAttribute("aria-pressed", String(active));
      document.getElementById(navButton.dataset.view).hidden = !active;
    }
  });
}

for (const [id, calculator] of Object.entries(calculators)) {
  const section = document.getElementById(id);
  const form = section.querySelector("form");
  const fields = form.elements;
  const content = section.querySelector(".result-content");
  const status = section.querySelector(".status");
  const upperLabel = section.querySelector("#upper-label");
  let exampleLoaded = false;

  function updateUpperField() {
    if (upperLabel) upperLabel.hidden = fields.event.value !== "between";
  }

  function calculate() {
    try {
      const { rows, note } = calculator.calculate(fields);
      content.replaceChildren(renderTable(rows, fields.decimal.value));
      if (note) content.append(createCell("p", note));
      status.textContent = exampleLoaded ? "Example results" : "Calculated";
    } catch (error) {
      content.replaceChildren(createCell("p", error.message, "error"));
      status.textContent = "Check inputs";
      content.firstElementChild.setAttribute("role", "alert");
    }
  }

  function loadExample() {
    for (const [name, value] of Object.entries(calculator.example)) fields.namedItem(name).value = value;
    fields.decimal.value = ".";
    exampleLoaded = true;
    updateUpperField();
    calculate();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("input", () => {
    exampleLoaded = false;
    updateUpperField();
    content.replaceChildren(createCell("p", "Calculate to see results for the current inputs."));
    status.textContent = "Inputs changed";
  });
  section.querySelector(".example").addEventListener("click", loadExample);
  loadExample();
}
