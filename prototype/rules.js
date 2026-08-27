(function exposeMunicipalGarbageRules(root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.MGCRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMunicipalGarbageRules() {
  "use strict";

  const STANDARD_SHIFT_DURATION = 600;
  const STOP_TRANSITIONS = Object.freeze({
    waiting: Object.freeze(["authorized", "tagged"]),
    authorized: Object.freeze(["loading"]),
    loading: Object.freeze(["empty"]),
    empty: Object.freeze(["awaiting-waste"]),
    "awaiting-waste": Object.freeze(["collected"]),
    collected: Object.freeze([]),
    tagged: Object.freeze([])
  });

  function finite(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function nonNegative(value) {
    return Math.max(0, finite(value));
  }

  function integer(value) {
    return Math.floor(nonNegative(value));
  }

  function canTransitionStop(from, to) {
    return Boolean(STOP_TRANSITIONS[from]?.includes(to));
  }

  function addressOutcome(stop) {
    if (stop?.state === "collected") {
      return stop.contaminated
        ? { name: "contaminated-load", complaint: true, clean: false }
        : { name: "collected-clean", complaint: false, clean: true };
    }
    if (stop?.state === "tagged") {
      return stop.contaminated
        ? { name: "tagged-correct", complaint: false, clean: true }
        : { name: "tagged-complaint", complaint: true, clean: false };
    }
    return { name: "missed", complaint: true, clean: false };
  }

  function updateAddressHistory(previous, stop) {
    const prior = {
      scheduled: integer(previous?.scheduled),
      visits: integer(previous?.visits),
      complaints: integer(previous?.complaints),
      cleanStreak: integer(previous?.cleanStreak),
      lastOutcome: previous?.lastOutcome || "new"
    };
    const outcome = addressOutcome(stop);
    return {
      scheduled: prior.scheduled + 1,
      visits: prior.visits + (stop?.state !== "waiting" ? 1 : 0),
      complaints: prior.complaints + (outcome.complaint ? 1 : 0),
      cleanStreak: outcome.clean ? prior.cleanStreak + 1 : 0,
      lastOutcome: outcome.name
    };
  }

  function calculateEarnings(score, multiplier = 1) {
    const safeMultiplier = Math.max(1, Math.min(1.25, finite(multiplier, 1)));
    return Math.max(75, Math.min(900, Math.floor(nonNegative(score) * .28 * safeMultiplier)));
  }

  function calculateTrust(currentTrust, complaints) {
    const next = finite(currentTrust, 50) + (integer(complaints) === 0 ? 3 : -Math.min(12, integer(complaints) * 2));
    return Math.max(0, Math.min(100, next));
  }

  function scoreShift(input = {}) {
    const timeRemaining = Math.min(STANDARD_SHIFT_DURATION, nonNegative(input.timeRemaining));
    const lines = [
      ["Collected service", integer(input.collected) * 120],
      ["Correct contamination tags", integer(input.correctTags) * 70],
      ["Route familiarity", integer(input.familiarityBonus)],
      ["Compactor operation", integer(input.compactions) * 25],
      ["Spill recovery", integer(input.cleanedSpills) * 40],
      ["Loose bags loaded", integer(input.loadedBags) * 35],
      ["Oversized items loaded", integer(input.loadedBulk) * 55],
      ["Time remaining", Math.floor(timeRemaining) * 2],
      ["Incorrect tags", -integer(input.wrongTagPenalty)],
      ["Contaminated loads", integer(input.badLoads) * -90],
      ["Missed stops", integer(input.missed) * -80],
      ["Handling slips", integer(input.handlingDrops) * -20],
      ["Spills created", integer(input.spills) * -70],
      ["Truck damage", integer(input.damage) * -45],
      ["Traffic stumbles", integer(input.workerStumbles) * -25]
    ];
    return {
      lines,
      score: Math.max(0, lines.reduce((sum, line) => sum + line[1], 0))
    };
  }

  return Object.freeze({
    STANDARD_SHIFT_DURATION,
    STOP_TRANSITIONS,
    canTransitionStop,
    addressOutcome,
    updateAddressHistory,
    calculateEarnings,
    calculateTrust,
    scoreShift
  });
});
