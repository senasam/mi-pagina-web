import test from "node:test";
import assert from "node:assert/strict";
import { formatNumericInput, normalizeNumericInput } from "../src/chileanNumberInput.js";

test("muestra puntos de miles y coma decimal sin cambiar el valor", () => {
  assert.equal(formatNumericInput(80000000), "80.000.000");
  assert.equal(formatNumericInput("4000.25"), "4.000,25");
  assert.equal(formatNumericInput("-12345.6"), "-12.345,6");
  assert.equal(formatNumericInput(""), "");
});

test("normaliza entradas chilenas y acepta punto decimal cuando no parece millar", () => {
  assert.equal(normalizeNumericInput("80.000.000"), "80000000");
  assert.equal(normalizeNumericInput("4.000,25"), "4000.25");
  assert.equal(normalizeNumericInput("1.5"), "1.5");
  assert.equal(normalizeNumericInput("-12.345,6"), "-12345.6");
  assert.equal(normalizeNumericInput(""), "");
});
