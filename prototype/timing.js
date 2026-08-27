(function exposeMunicipalGarbageTiming(root, factory) {
  const timing = factory();
  if (typeof module === "object" && module.exports) module.exports = timing;
  else root.MGCTiming = timing;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMunicipalGarbageTiming() {
  "use strict";

  function createFixedStepper(stepSeconds = 1 / 60, maxElapsedSeconds = .25) {
    if (!(stepSeconds > 0) || !(maxElapsedSeconds >= stepSeconds)) throw new RangeError("Invalid fixed-step timing configuration.");
    let accumulator = 0;
    let totalSteps = 0;

    function advance(elapsedSeconds, update) {
      if (typeof update !== "function") throw new TypeError("Fixed-step advance requires an update callback.");
      const elapsed = Number.isFinite(Number(elapsedSeconds)) ? Math.max(0, Number(elapsedSeconds)) : 0;
      const accepted = Math.min(maxElapsedSeconds, elapsed);
      accumulator = Math.min(maxElapsedSeconds, accumulator + accepted);
      let steps = 0;
      while (accumulator + Number.EPSILON >= stepSeconds) {
        update(stepSeconds);
        accumulator -= stepSeconds;
        if (accumulator < Number.EPSILON) accumulator = 0;
        steps += 1;
        totalSteps += 1;
      }
      return Object.freeze({ steps, alpha: accumulator / stepSeconds, acceptedSeconds: accepted, droppedSeconds: Math.max(0, elapsed - accepted) });
    }

    function reset() {
      accumulator = 0;
      totalSteps = 0;
    }

    function snapshot() {
      return Object.freeze({ stepSeconds, maxElapsedSeconds, accumulator, totalSteps });
    }

    return Object.freeze({ advance, reset, snapshot });
  }

  return Object.freeze({ createFixedStepper });
});
