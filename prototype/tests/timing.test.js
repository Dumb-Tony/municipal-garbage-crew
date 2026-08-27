"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createFixedStepper } = require("../timing.js");

test("sixty display frames produce sixty identical simulation steps", () => {
  const stepper = createFixedStepper();
  const steps = [];
  for (let frame = 0; frame < 60; frame += 1) stepper.advance(1 / 60, dt => steps.push(dt));
  assert.equal(steps.length, 60);
  assert.equal(steps.every(dt => dt === 1 / 60), true);
  assert.equal(stepper.snapshot().totalSteps, 60);
});

test("different display pacing produces the same simulated second", () => {
  const fast = createFixedStepper();
  const slow = createFixedStepper();
  let fastTime = 0;
  let slowTime = 0;
  for (let frame = 0; frame < 120; frame += 1) fast.advance(1 / 120, dt => { fastTime += dt; });
  for (let frame = 0; frame < 30; frame += 1) slow.advance(1 / 30, dt => { slowTime += dt; });
  assert.ok(Math.abs(fastTime - 1) < 1e-9);
  assert.ok(Math.abs(slowTime - 1) < 1e-9);
});

test("sub-step frame time accumulates without advancing early", () => {
  const stepper = createFixedStepper(.02, .2);
  let calls = 0;
  assert.equal(stepper.advance(.007, () => { calls += 1; }).steps, 0);
  assert.equal(stepper.advance(.007, () => { calls += 1; }).steps, 0);
  assert.equal(stepper.advance(.006, () => { calls += 1; }).steps, 1);
  assert.equal(calls, 1);
});

test("long stalls are clamped instead of creating a spiral of death", () => {
  const stepper = createFixedStepper(1 / 60, .25);
  let simulated = 0;
  const result = stepper.advance(2, dt => { simulated += dt; });
  assert.equal(result.steps, 15);
  assert.ok(Math.abs(simulated - .25) < 1e-9);
  assert.equal(result.droppedSeconds, 1.75);
});

test("reset clears accumulated time and step count", () => {
  const stepper = createFixedStepper();
  stepper.advance(.1, () => {});
  stepper.reset();
  assert.deepEqual(stepper.snapshot(), { stepSeconds: 1 / 60, maxElapsedSeconds: .25, accumulator: 0, totalSteps: 0 });
});

test("invalid configuration and missing callbacks fail clearly", () => {
  assert.throws(() => createFixedStepper(0, .25), RangeError);
  assert.throws(() => createFixedStepper(.5, .25), RangeError);
  assert.throws(() => createFixedStepper().advance(.1), TypeError);
});
