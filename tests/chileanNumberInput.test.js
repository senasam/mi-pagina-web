import test from "node:test";
import assert from "node:assert/strict";
import { formatNumericInput, normalizeNumericInput, parseDisplayedNumber } from "../src/chileanNumberInput.js";

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

test("lee montos tecleados sobre el valor formateado sin convertir miles en decimales", () => {
  let value = "";
  for (const digit of "1000000") value = parseDisplayedNumber(`${formatNumericInput(value)}${digit}`, true);
  assert.equal(value, "1000000");
  assert.equal(formatNumericInput(value), "1.000.000");
  assert.equal(parseDisplayedNumber("41.173,33"), "41173.33");
  assert.equal(parseDisplayedNumber("1.0000"), "10000");
  assert.equal(parseDisplayedNumber("1.000,5", true), "1000");
  assert.equal(parseDisplayedNumber(""), "");
});
