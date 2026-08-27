"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const input = require("../input.js");

test("default bindings return a fresh complete map", () => {
  const first = input.defaultBindings();
  const second = input.defaultBindings();
  assert.notEqual(first, second);
  assert.deepEqual(Object.keys(first), input.ACTION_ORDER);
  assert.equal(first.forward, "KeyW");
  assert.equal(first.work, "Space");
});

test("movement arrows and right shift remain accessibility fallbacks", () => {
  const bindings = input.defaultBindings();
  assert.equal(input.actionForCode("ArrowUp", bindings), "forward");
  assert.equal(input.actionForCode("ShiftRight", bindings), "brace");
  assert.equal(input.isActionDown("left", new Set(["ArrowLeft"]), bindings), true);
});

test("remapping replaces the primary key while preserving movement fallback", () => {
  const bindings = input.normalizeBindings({ forward: "KeyI" });
  assert.equal(input.actionForCode("KeyI", bindings), "forward");
  assert.equal(input.actionForCode("KeyW", bindings), null);
  assert.equal(input.isActionDown("forward", new Set(["ArrowUp"]), bindings), true);
});

test("conflicts include primary bindings and fixed fallbacks", () => {
  const bindings = input.defaultBindings();
  assert.equal(input.conflictFor("grab", "KeyF", bindings), "cab");
  assert.equal(input.conflictFor("grab", "ArrowUp", bindings), "forward");
  assert.equal(input.conflictFor("grab", "KeyG", bindings), null);
});

test("normalization repairs persisted conflicts and reserved keys", () => {
  const bindings = input.normalizeBindings({ grab: "KeyF", cab: "F5", tag: "KeyT" });
  assert.equal(bindings.grab, "KeyE");
  assert.equal(bindings.cab, "KeyF");
  assert.equal(bindings.tag, "KeyT");
});

test("unsafe navigation and modifier-only keys cannot be bound", () => {
  for (const code of ["Escape", "Enter", "Tab", "F5", "F11", "F12", "ControlLeft", "AltRight"]) {
    assert.equal(input.isBindable(code), false);
  }
  assert.equal(input.isBindable("KeyG"), true);
  assert.equal(input.isBindable("Slash"), true);
});

test("key labels are concise and player-facing", () => {
  assert.equal(input.formatCode("KeyW"), "W");
  assert.equal(input.formatCode("Digit7"), "7");
  assert.equal(input.formatCode("ShiftLeft"), "Left Shift");
  assert.equal(input.formatCode("ArrowRight"), "→");
});
