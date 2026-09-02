import assert from "node:assert/strict";
import test from "node:test";
import { calculatorFunctions, estimateHouseRange } from "../app/lib/calculator-core.mjs";

const closeTo = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

test("construction volume calculators use SI dimensions", () => {
  closeTo(calculatorFunctions.concrete(6, 4, 0.2, 1), 4.8);
  closeTo(calculatorFunctions.slab(10, 8, 0.25, 2), 40);
  closeTo(calculatorFunctions.excavation(12, 7, 2.5, 1), 210);
});

test("backfill never returns a negative volume", () => {
  closeTo(calculatorFunctions.backfill(100, 30, 1.15, 0), 80.5);
  closeTo(calculatorFunctions.backfill(20, 30, 1.1, 0), 0);
});

test("material quantity formulae match documented equations", () => {
  closeTo(calculatorFunctions.block(10, 40, 20, 0), 125);
  closeTo(calculatorFunctions.rebar(12, 12, 10, 0), 106.6666666667, 1e-6);
  closeTo(calculatorFunctions.formwork(4, 3, 2.5, 2), 70);
  closeTo(calculatorFunctions.steel(2, 1, 10, 1), 157);
});

test("house estimate requires a valid user-supplied rate range", () => {
  assert.deepEqual(estimateHouseRange(500, 250, 400), [125000, 200000]);
  assert.equal(estimateHouseRange(500, 400, 250), null);
  assert.equal(estimateHouseRange(0, 250, 400), null);
});
