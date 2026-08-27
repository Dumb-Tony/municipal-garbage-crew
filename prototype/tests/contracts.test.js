"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const contracts = require("../contracts.js");

test("the solo slice exposes exactly three distinct contracts", () => {
  assert.deepEqual(contracts.CONTRACT_ORDER, ["regular", "bulk", "storm"]);
  assert.equal(new Set(contracts.CONTRACT_ORDER.map(id => contracts.getContract(id).name)).size, 3);
  assert.equal(contracts.getContract("missing").id, "regular");
});

test("regular contract preserves authored route content", () => {
  const stops = contracts.prepareStops([{ id: 1, weight: 1.7 }], "regular");
  const waste = contracts.prepareWaste([{ id: "bag" }], "regular");
  assert.equal(stops[0].weight, 1.7);
  assert.deepEqual(waste, [{ id: "bag" }]);
  assert.deepEqual(contracts.prepareSpills("regular"), []);
});

test("bulk amnesty adds required oversized work and heavier carts", () => {
  const stops = contracts.prepareStops([{ id: 1, weight: 2 }], "bulk");
  const waste = contracts.prepareWaste([{ id: "bag", type: "bag" }], "bulk");
  assert.equal(stops[0].weight, 2.16);
  assert.equal(waste.length, 3);
  assert.equal(waste.filter(item => item.type === "bulk").length, 2);
  assert.equal(contracts.getContract("bulk").extraSeconds, 90);
  assert.equal(contracts.getContract("bulk").payoutMultiplier, 1.2);
});

test("after-storm sweep creates three independent assigned cleanup zones", () => {
  const first = contracts.prepareSpills("storm");
  const second = contracts.prepareSpills("storm");
  assert.equal(first.length, 3);
  assert.equal(first.every(spill => spill.job && !spill.cleaned), true);
  first[0].cleaned = true;
  assert.equal(second[0].cleaned, false);
});

test("traffic preparation scales either movement axis without mutating templates", () => {
  const base = [{ x: 1, vx: 100 }, { x: 2, vy: -50 }];
  const storm = contracts.prepareTraffic(base, "storm");
  assert.equal(storm[0].vx, 84);
  assert.equal(storm[1].vy, -42);
  assert.equal(base[0].vx, 100);
  assert.equal(base[1].vy, -50);
});

test("contract modifiers remain positive and progression-safe", () => {
  for (const id of contracts.CONTRACT_ORDER) {
    const contract = contracts.getContract(id);
    assert.ok(contract.payoutMultiplier >= 1 && contract.payoutMultiplier <= 1.25);
    assert.ok(contract.binWeightMultiplier >= 1);
    assert.ok(contract.trafficSpeedMultiplier > 0);
    assert.ok(contract.extraSeconds >= 0);
  }
});
