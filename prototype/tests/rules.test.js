"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../rules.js");

test("relaxed time never raises the standard time bonus ceiling", () => {
  const standard = rules.scoreShift({ timeRemaining: 600 });
  const relaxed = rules.scoreShift({ timeRemaining: 720 });
  assert.equal(standard.lines.find(([name]) => name === "Time remaining")[1], 1200);
  assert.equal(relaxed.lines.find(([name]) => name === "Time remaining")[1], 1200);
  assert.equal(standard.score, relaxed.score);
});

test("shift score floors at zero and ignores invalid numeric input", () => {
  const result = rules.scoreShift({ missed: 10, damage: 5, timeRemaining: "bad" });
  assert.equal(result.score, 0);
  assert.equal(result.lines.find(([name]) => name === "Time remaining")[1], 0);
});

test("scoring keeps every auditable ledger category", () => {
  const result = rules.scoreShift({
    collected: 2, correctTags: 1, familiarityBonus: 15, compactions: 2,
    cleanedSpills: 1, loadedBags: 1, loadedBulk: 1, timeRemaining: 30,
    wrongTagPenalty: 60, badLoads: 1, missed: 2, handlingDrops: 1,
    spills: 1, damage: 1, workerStumbles: 1
  });
  assert.equal(result.lines.length, 15);
  assert.equal(result.score, 95);
});

test("address history distinguishes clean service, correct tags, complaints, and misses", () => {
  let history = rules.updateAddressHistory(null, { state: "collected", contaminated: false });
  assert.deepEqual(history, { scheduled: 1, visits: 1, complaints: 0, cleanStreak: 1, lastOutcome: "collected-clean" });
  history = rules.updateAddressHistory(history, { state: "tagged", contaminated: true });
  assert.equal(history.cleanStreak, 2);
  assert.equal(history.lastOutcome, "tagged-correct");
  history = rules.updateAddressHistory(history, { state: "tagged", contaminated: false });
  assert.equal(history.complaints, 1);
  assert.equal(history.cleanStreak, 0);
  history = rules.updateAddressHistory(history, { state: "waiting", contaminated: false });
  assert.equal(history.scheduled, 4);
  assert.equal(history.visits, 3);
  assert.equal(history.complaints, 2);
  assert.equal(history.lastOutcome, "missed");
});

test("campaign rewards and trust remain bounded", () => {
  assert.equal(rules.calculateEarnings(0), 75);
  assert.equal(rules.calculateEarnings(1000), 280);
  assert.equal(rules.calculateEarnings(1000, 1.2), 336);
  assert.equal(rules.calculateEarnings(1000, 99), 350);
  assert.equal(rules.calculateEarnings(999999), 900);
  assert.equal(rules.calculateTrust(99, 0), 100);
  assert.equal(rules.calculateTrust(5, 20), 0);
  assert.equal(rules.calculateTrust(50, 3), 44);
});

test("early closure preview makes every new complaint explicit", () => {
  assert.deepEqual(rules.earlyClosurePreview({ unresolved: 7, uncleanedSpills: 2, currentComplaints: 1 }), {
    unresolved: 7,
    uncleanedSpills: 2,
    currentComplaints: 1,
    addedComplaints: 9,
    totalComplaints: 10
  });
  assert.deepEqual(rules.earlyClosurePreview({ unresolved: -3, uncleanedSpills: "bad", currentComplaints: 2 }), {
    unresolved: 0,
    uncleanedSpills: 0,
    currentComplaints: 2,
    addedComplaints: 0,
    totalComplaints: 2
  });
});

test("stop transition graph permits the service path and rejects terminal mutations", () => {
  const path = ["waiting", "authorized", "loading", "empty", "awaiting-waste", "collected"];
  for (let index = 0; index < path.length - 1; index += 1) {
    assert.equal(rules.canTransitionStop(path[index], path[index + 1]), true);
  }
  assert.equal(rules.canTransitionStop("waiting", "tagged"), true);
  assert.equal(rules.canTransitionStop("collected", "waiting"), false);
  assert.equal(rules.canTransitionStop("tagged", "authorized"), false);
  assert.equal(rules.canTransitionStop("authorized", "collected"), false);
});
