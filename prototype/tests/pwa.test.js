"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const shell = require("../pwa.js");

test("app shell cache is versioned with the build", () => {
  assert.equal(shell.BUILD_VERSION, "0.19.0");
  assert.equal(shell.CACHE_NAME, "municipal-garbage-crew-0.19.0");
});

test("offline shell includes every executable runtime module", () => {
  for (const asset of ["styles.css", "rules.js", "input.js", "timing.js", "contracts.js", "game.js", "pwa.js"]) {
    assert.equal(shell.SHELL_ASSETS.some(path => path.includes(`${asset}?v=0.19.0`)), true, asset);
  }
});

test("offline shell includes entry, manifest, install icons, and title art", () => {
  for (const asset of ["./", "./index.html", "./manifest.webmanifest", "./assets/bsa-icon.svg", "./assets/bsa-icon-192.png", "./assets/bsa-icon-512.png", "./assets/bellwether-noir-title-v2.png"]) {
    assert.equal(shell.SHELL_ASSETS.includes(asset), true, asset);
  }
});

test("offline shell has unique relative same-scope paths", () => {
  assert.equal(new Set(shell.SHELL_ASSETS).size, shell.SHELL_ASSETS.length);
  assert.equal(shell.SHELL_ASSETS.every(path => path.startsWith("./")), true);
  assert.equal(shell.SHELL_ASSETS.every(path => !path.includes("..")), true);
});
