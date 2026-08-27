(function exposeMunicipalGarbageInput(root, factory) {
  const input = factory();
  if (typeof module === "object" && module.exports) module.exports = input;
  else root.MGCInput = input;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMunicipalGarbageInput() {
  "use strict";

  const ACTIONS = Object.freeze({
    forward: Object.freeze({ label: "Forward / up", defaultCode: "KeyW", fallbacks: ["ArrowUp"] }),
    reverse: Object.freeze({ label: "Reverse / down", defaultCode: "KeyS", fallbacks: ["ArrowDown"] }),
    left: Object.freeze({ label: "Steer / move left", defaultCode: "KeyA", fallbacks: ["ArrowLeft"] }),
    right: Object.freeze({ label: "Steer / move right", defaultCode: "KeyD", fallbacks: ["ArrowRight"] }),
    work: Object.freeze({ label: "Inspect / load / return", defaultCode: "Space", fallbacks: [] }),
    grab: Object.freeze({ label: "Grab / release", defaultCode: "KeyE", fallbacks: [] }),
    cab: Object.freeze({ label: "Exit / enter truck", defaultCode: "KeyF", fallbacks: [] }),
    tag: Object.freeze({ label: "Tag contamination", defaultCode: "KeyR", fallbacks: [] }),
    inspect: Object.freeze({ label: "Check uncertain waste", defaultCode: "KeyQ", fallbacks: [] }),
    compact: Object.freeze({ label: "Run compactor", defaultCode: "KeyC", fallbacks: [] }),
    cleanup: Object.freeze({ label: "Clean / re-bag spill", defaultCode: "KeyX", fallbacks: [] }),
    brace: Object.freeze({ label: "Brace oversized item", defaultCode: "ShiftLeft", fallbacks: ["ShiftRight"] }),
    pause: Object.freeze({ label: "Pause", defaultCode: "KeyP", fallbacks: [] }),
    mute: Object.freeze({ label: "Mute", defaultCode: "KeyM", fallbacks: [] })
  });
  const ACTION_ORDER = Object.freeze(Object.keys(ACTIONS));
  const RESERVED = new Set(["Escape", "Enter", "Tab", "Backspace", "F5", "F11", "F12", "MetaLeft", "MetaRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight"]);
  const FRIENDLY_KEYS = Object.freeze({ Space: "Space", ShiftLeft: "Left Shift", ShiftRight: "Right Shift", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" });

  function defaultBindings() {
    return Object.fromEntries(ACTION_ORDER.map(action => [action, ACTIONS[action].defaultCode]));
  }

  function normalizeBindings(saved) {
    const defaults = defaultBindings();
    if (!saved || typeof saved !== "object") return defaults;
    for (const action of ACTION_ORDER) {
      const code = saved[action];
      if (typeof code !== "string" || !isBindable(code)) continue;
      const conflict = ACTION_ORDER.some(candidate => candidate !== action && (defaults[candidate] === code || ACTIONS[candidate].fallbacks.includes(code)));
      if (!conflict) defaults[action] = code;
    }
    return defaults;
  }

  function effectiveCodes(action, bindings) {
    const definition = ACTIONS[action];
    if (!definition) return [];
    const normalized = normalizeBindings(bindings);
    return [normalized[action], ...definition.fallbacks];
  }

  function isActionDown(action, pressedCodes, bindings) {
    return effectiveCodes(action, bindings).some(code => pressedCodes.has(code));
  }

  function actionForCode(code, bindings) {
    const normalized = normalizeBindings(bindings);
    const primary = ACTION_ORDER.find(action => normalized[action] === code);
    if (primary) return primary;
    return ACTION_ORDER.find(action => ACTIONS[action].fallbacks.includes(code)) || null;
  }

  function conflictFor(action, code, bindings) {
    const normalized = normalizeBindings(bindings);
    return ACTION_ORDER.find(candidate => candidate !== action && effectiveCodes(candidate, normalized).includes(code)) || null;
  }

  function isBindable(code) {
    return typeof code === "string" && code.length > 0 && !RESERVED.has(code);
  }

  function formatCode(code) {
    if (FRIENDLY_KEYS[code]) return FRIENDLY_KEYS[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return `Num ${code.slice(6)}`;
    return code.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  return Object.freeze({ ACTIONS, ACTION_ORDER, defaultBindings, normalizeBindings, effectiveCodes, isActionDown, actionForCode, conflictFor, isBindable, formatCode });
});
