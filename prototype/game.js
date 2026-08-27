(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const ui = {
    start: document.querySelector("#startPanel"),
    decision: document.querySelector("#decisionPanel"),
    result: document.querySelector("#resultPanel"),
    decisionTitle: document.querySelector("#decisionTitle"),
    decisionText: document.querySelector("#decisionText"),
    inspect: document.querySelector("#inspectButton"),
    pause: document.querySelector("#pausePanel"),
    resultTitle: document.querySelector("#resultTitle"),
    resultSummary: document.querySelector("#resultSummary"),
    resultStats: document.querySelector("#resultStats"),
    resultLedger: document.querySelector("#resultLedger"),
    status: document.querySelector("#statusText"),
    mute: document.querySelector("#muteButton")
  };

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();
  let audio = null;
  let muted = false;
  let last = 0;
  let game;
  const SHIFT_DURATION = 300;
  const SHIFT_SEED = 4040712;

  const stopsTemplate = [
    { id: 1, x: 188, y: 190, label: "12 Maple", kind: "Household", weight: 1.7, contaminated: false },
    { id: 2, x: 350, y: 190, label: "18 Maple", kind: "Sealed contractor bags", weight: 1.1, contaminated: true, ambiguous: true },
    { id: 3, x: 565, y: 190, label: "24 Maple", kind: "Heavy household", weight: 2.4, contaminated: false },
    { id: 4, x: 774, y: 405, label: "Corner Market", kind: "Bagged commercial", weight: 2.7, contaminated: false },
    { id: 5, x: 544, y: 405, label: "31 Maple", kind: "Loose electronics", weight: 1.4, contaminated: true },
    { id: 6, x: 280, y: 405, label: "27 Maple", kind: "Household", weight: 2.2, contaminated: false }
  ];

  const trafficTemplate = [
    { x: 430, y: 270, vx: 72, color: "#a64f3f" },
    { x: 820, y: 340, vx: -62, color: "#4f7193" }
  ];

  function resetGame() {
    game = {
      phase: "READY",
      seed: SHIFT_SEED,
      rngState: SHIFT_SEED,
      events: [],
      time: SHIFT_DURATION,
      score: 0,
      complaints: 0,
      spills: 0,
      cleanedSpills: 0,
      handlingDrops: 0,
      damage: 0,
      workerStumbles: 0,
      badLoads: 0,
      collected: 0,
      tagged: 0,
      loose: 0,
      compacted: 0,
      compactorCooldown: 0,
      message: "",
      messageTime: 0,
      activeStop: null,
      loading: null,
      particles: [],
      spillZones: [],
      phaseBeforePause: "DRIVE",
      mode: "truck",
      shake: 0,
      truck: { x: 112, y: 305, angle: 0, speed: 0, stun: 0, collisionCooldown: 0 },
      worker: { x: 64, y: 305, angle: 0, grabbedStop: null, stumble: 0, collisionCooldown: 0 },
      stops: stopsTemplate.map(s => ({ ...s, binX: s.x, binY: s.y, state: "waiting", authorized: false, revealed: false, wobble: randomSeeded(s.id) * 6 })),
      traffic: trafficTemplate.map(t => ({ ...t }))
    };
    ui.start.classList.remove("hidden");
    ui.decision.classList.add("hidden");
    ui.result.classList.add("hidden");
    ui.pause.classList.add("hidden");
    setStatus("Click “Clock in” to begin.");
  }

  function usedCapacity() { return game.loose + game.compacted; }
  function unresolved() { return game.stops.filter(s => !["collected", "tagged"].includes(s.state)).length; }
  function uncleanedSpills() { return game.spillZones.filter(s => !s.cleaned).length; }
  function randomSeeded(offset) { return ((Math.imul(1103515245, SHIFT_SEED + offset) + 12345) >>> 0) / 4294967296; }
  function setStatus(text) { ui.status.textContent = text; }
  function random() {
    game.rngState = (Math.imul(1664525, game.rngState) + 1013904223) >>> 0;
    return game.rngState / 4294967296;
  }
  function recordEvent(type, details = {}) {
    game.events.push({ type, at: Number((SHIFT_DURATION - game.time).toFixed(2)), ...details });
  }

  function beep(frequency = 220, duration = .08, type = "square", volume = .035) {
    if (muted) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch (_) { /* Audio is optional. */ }
  }

  function startGame() {
    if (game.phase !== "READY") return;
    game.phase = "DRIVE";
    recordEvent("shift_started", { seed: game.seed });
    ui.start.classList.add("hidden");
    setStatus("Follow the amber arrow. Stop near a curb and press F to exit the cab.");
    canvas.focus();
    beep(440, .12, "sawtooth");
  }

  function showMessage(text, seconds = 2.5) {
    game.message = text;
    game.messageTime = seconds;
    setStatus(text);
  }

  function actorPosition() { return game.mode === "foot" ? game.worker : game.truck; }

  function hopperPosition() {
    return {
      x: game.truck.x - Math.cos(game.truck.angle) * 51,
      y: game.truck.y - Math.sin(game.truck.angle) * 51
    };
  }

  function nearestStop(origin = actorPosition()) {
    let best = null;
    let bestDistance = Infinity;
    for (const stop of game.stops) {
      if (["collected", "tagged", "loading"].includes(stop.state)) continue;
      const distance = Math.hypot(stop.binX - origin.x, stop.binY - origin.y);
      if (distance < bestDistance) { best = stop; bestDistance = distance; }
    }
    return { stop: best, distance: bestDistance };
  }

  function inspectStop() {
    if (game.phase !== "DRIVE") return;
    if (game.mode !== "foot") { showMessage("Stop the truck and press F to step out at the curb."); return; }
    if (game.worker.grabbedStop) { showMessage("Set the bin down with E before inspecting another stop."); return; }
    const { stop, distance } = nearestStop();
    if (!stop || stop.state !== "waiting" || distance > 40) { showMessage("Walk closer to a waiting curb bin."); return; }
    game.phase = "INSPECT";
    game.activeStop = stop;
    recordEvent("stop_inspected", { stopId: stop.id });
    renderDecision(stop);
    ui.decision.classList.remove("hidden");
    setStatus("Choose: E to collect or R to tag and leave.");
    beep(330, .08, "sine");
  }

  function renderDecision(stop) {
    ui.decisionTitle.textContent = `${stop.label} · ${stop.kind}`;
    const uncertain = stop.ambiguous && !stop.revealed;
    ui.decisionText.textContent = uncertain
      ? "The bags are sealed and unusually rigid. You can make the call now, or spend five seconds checking beneath the top bag."
      : stop.contaminated
        ? "Prohibited material is visible. Collecting saves the stop but causes a contamination violation."
        : "Contents look acceptable. Load it, or leave it behind and take a missed-pickup complaint.";
    ui.inspect.classList.toggle("hidden", !uncertain);
  }

  function inspectCloser() {
    const stop = game.activeStop;
    if (game.phase !== "INSPECT" || !stop?.ambiguous || stop.revealed) return;
    stop.revealed = true;
    game.time = Math.max(0, game.time - 5);
    recordEvent("contents_revealed", { stopId: stop.id, timeCost: 5 });
    renderDecision(stop);
    showMessage("Paint cans found under the top bag. Five seconds used.");
    beep(410, .1, "triangle");
    if (game.time <= 0) finishGame(true);
  }

  function collectActive() {
    const stop = game.activeStop;
    if (game.phase !== "INSPECT" || !stop) return;
    ui.decision.classList.add("hidden");
    stop.authorized = true;
    stop.state = "authorized";
    game.phase = "DRIVE";
    game.activeStop = null;
    recordEvent("service_authorized", { stopId: stop.id });
    showMessage("Pickup approved. Press E to grab the bin and wheel it to the rear hopper.", 3.2);
    beep(150, .14, "square");
  }

  function beginBinLoad(stop) {
    if (usedCapacity() + stop.weight > 8) {
      showMessage("Hopper is full. Drop the bin and compact before loading.");
      beep(110, .18, "sawtooth");
      return;
    }
    game.worker.grabbedStop = null;
    stop.state = "loading";
    game.phase = "LOAD";
    game.loading = { stop, progress: 0, balance: (random() - .5) * .2, drift: (random() - .5) * .5, driftTimer: .7, drops: 0 };
    game.truck.speed = 0;
    beep(150, .14, "square");
  }

  function finishLoad() {
    const stop = game.loading.stop;
    const hopper = hopperPosition();
    stop.state = "empty";
    stop.binX = hopper.x;
    stop.binY = hopper.y;
    game.loose += stop.weight;
    recordEvent("bin_emptied", { stopId: stop.id, weight: stop.weight, contaminated: stop.contaminated, handlingDrops: game.loading.drops });
    if (stop.contaminated) {
      game.badLoads += 1;
      game.complaints += 1;
      game.score -= 90;
      showMessage("Contaminated load accepted. Violation logged—now return the empty bin.");
    } else {
      showMessage("Bin emptied. Return it to the marked curb to finish the stop.");
    }
    game.loading = null;
    game.activeStop = null;
    game.phase = "DRIVE";
    beep(260, .09, "square");
  }

  function returnBin(stop) {
    stop.state = "collected";
    stop.binX = stop.x;
    stop.binY = stop.y;
    game.worker.grabbedStop = null;
    game.collected += 1;
    game.score += 120;
    recordEvent("stop_collected", { stopId: stop.id });
    showMessage(`${stop.label} serviced and bin returned. +120`);
    beep(420, .1, "sine");
    checkRouteEnd();
  }

  function tagActive() {
    const stop = game.activeStop;
    if (game.phase !== "INSPECT" || !stop) return;
    stop.state = "tagged";
    game.tagged += 1;
    recordEvent("stop_tagged", { stopId: stop.id, contaminated: stop.contaminated });
    if (stop.contaminated) {
      game.score += 70;
      showMessage("Correctly tagged contamination. +70");
      beep(520, .09, "sine");
    } else {
      game.complaints += 1;
      game.score -= 60;
      showMessage("Valid pickup skipped. Resident complaint filed.");
      beep(120, .15, "sawtooth");
    }
    ui.decision.classList.add("hidden");
    game.activeStop = null;
    game.phase = "DRIVE";
    checkRouteEnd();
  }

  function compact() {
    if (game.phase !== "DRIVE") return;
    if (Math.abs(game.truck.speed) > 18) { showMessage("Compactor interlock: stop the truck first."); return; }
    if (game.mode === "foot") {
      const hopper = hopperPosition();
      if (Math.hypot(game.worker.x - hopper.x, game.worker.y - hopper.y) > 58) { showMessage("Walk to the rear controls before cycling the compactor."); return; }
      if (game.worker.grabbedStop) { showMessage("Drop the bin before using the compactor controls."); return; }
    }
    if (game.compactorCooldown > 0) { showMessage("Compactor is cycling. Give it a moment."); return; }
    if (game.loose < .3) { showMessage("Nothing loose in the hopper."); return; }
    const before = game.loose;
    const packed = before * .42;
    game.compacted += packed;
    game.loose = 0;
    game.compactorCooldown = 5;
    game.phase = "COMPACT";
    game.shake = .7;
    game.score += 25;
    recordEvent("compactor_cycled", { looseBefore: Number(before.toFixed(2)), compactedAdded: Number(packed.toFixed(2)) });
    showMessage(`Compacted ${before.toFixed(1)} units into ${packed.toFixed(1)}. +25`);
    beep(82, .42, "sawtooth", .055);
    setTimeout(() => { if (game.phase === "COMPACT") game.phase = "DRIVE"; }, 850);
  }

  function checkRouteEnd() {
    if (unresolved() === 0 && uncleanedSpills() === 0) finishGame(false);
    else if (unresolved() === 0) showMessage(`Stops cleared. Clean ${uncleanedSpills()} spill${uncleanedSpills() === 1 ? "" : "s"} with X to close the route.`);
  }

  function nearestSpill() {
    let best = null, bestDistance = Infinity;
    const actor = actorPosition();
    for (const spill of game.spillZones) {
      if (spill.cleaned) continue;
      const distance = Math.hypot(spill.x - actor.x, spill.y - actor.y);
      if (distance < bestDistance) { best = spill; bestDistance = distance; }
    }
    return { spill: best, distance: bestDistance };
  }

  function cleanSpill() {
    if (game.phase !== "DRIVE") return;
    if (game.mode !== "foot") { showMessage("Stop nearby and press F—the cleanup kit is worked on foot."); return; }
    if (game.worker.grabbedStop) { showMessage("Set the bin down before opening the cleanup kit."); return; }
    const { spill, distance } = nearestSpill();
    if (!spill || distance > 48) { showMessage("Walk closer to the spill before using the cleanup kit."); return; }
    spill.cleaned = true;
    game.cleanedSpills += 1;
    game.time = Math.max(0, game.time - 3);
    game.score += 40;
    recordEvent("spill_cleaned", { timeCost: 3 });
    showMessage("Street cleared with the spill kit. +40 · 3 seconds used");
    beep(470, .12, "sine");
    if (game.time <= 0) finishGame(true); else checkRouteEnd();
  }

  function finishGame(timedOut) {
    if (game.phase === "RESULT") return;
    const missed = unresolved();
    const dirtyStreet = uncleanedSpills();
    game.complaints += missed + dirtyStreet;
    const correctTags = game.stops.filter(s => s.state === "tagged" && s.contaminated).length;
    const wrongTags = game.stops.filter(s => s.state === "tagged" && !s.contaminated).length;
    const compactions = game.events.filter(e => e.type === "compactor_cycled").length;
    const scoreLines = [
      ["Collected service", game.collected * 120], ["Correct contamination tags", correctTags * 70],
      ["Compactor operation", compactions * 25], ["Spill recovery", game.cleanedSpills * 40],
      ["Time remaining", Math.floor(game.time) * 2], ["Incorrect tags", wrongTags * -60],
      ["Contaminated loads", game.badLoads * -90], ["Missed stops", missed * -80],
      ["Handling slips", game.handlingDrops * -20], ["Spills created", game.spills * -70],
      ["Truck damage", game.damage * -45], ["Traffic stumbles", game.workerStumbles * -25]
    ];
    game.score = Math.max(0, scoreLines.reduce((sum, line) => sum + line[1], 0));
    game.phase = "RESULT";
    recordEvent("shift_finished", { timedOut, score: game.score, complaints: game.complaints });
    ui.decision.classList.add("hidden");
    ui.resultTitle.textContent = timedOut ? "Shift clock expired" : (game.complaints === 0 ? "Clean route" : "Route closed");
    ui.resultSummary.textContent = game.complaints === 0
      ? "Maple Street is clear, the hopper is under control, and dispatch has nothing to complain about."
      : `The route is closed with ${game.complaints} complaint${game.complaints === 1 ? "" : "s"}. The town will remember what happened here.`;
    ui.resultStats.innerHTML = [
      ["Score", game.score], ["Collected", `${game.collected}/6`],
      ["Correct tags", game.stops.filter(s => s.state === "tagged" && s.contaminated).length],
      ["Handling slips", game.handlingDrops], ["Traffic stumbles", game.workerStumbles], ["Spills cleaned", `${game.cleanedSpills}/${game.spills}`], ["Truck damage", game.damage], ["Time left", `${Math.ceil(game.time)}s`],
      ["Shift seed", game.seed], ["Events logged", game.events.length]
    ].map(([a, b]) => `<span><b>${a}</b><br>${b}</span>`).join("");
    ui.resultLedger.innerHTML = scoreLines.filter(line => line[1] !== 0).map(([label, value]) =>
      `<div class="${value < 0 ? "negative" : "positive"}"><span>${label}</span><b>${value > 0 ? "+" : ""}${value}</b></div>`
    ).join("");
    ui.result.classList.remove("hidden");
    setStatus("Shift complete. Press Enter to run it again.");
    beep(game.complaints ? 170 : 560, .35, "triangle", .06);
  }

  function update(dt) {
    if (!game || game.phase === "READY" || game.phase === "RESULT" || game.phase === "PAUSED") return;
    game.time = Math.max(0, game.time - dt);
    game.messageTime = Math.max(0, game.messageTime - dt);
    game.compactorCooldown = Math.max(0, game.compactorCooldown - dt);
    game.shake = Math.max(0, game.shake - dt);
    if (game.time <= 0) { finishGame(true); return; }

    updateTraffic(dt);
    updateParticles(dt);
    if (game.phase === "LOAD") {
      updateHandling(dt);
      return;
    }
    if (game.phase !== "DRIVE") return;
    if (game.mode === "truck") {
      updateTruck(dt);
      checkCollisions();
    } else {
      updateWorker(dt);
      checkWorkerTraffic();
    }
  }

  function exitEnterTruck() {
    if (game.phase !== "DRIVE") return;
    const t = game.truck;
    const w = game.worker;
    if (game.mode === "truck") {
      if (Math.abs(t.speed) > 10) { showMessage("Brake before leaving the cab."); return; }
      const hopper = hopperPosition();
      w.x = Math.max(24, Math.min(W - 24, hopper.x));
      w.y = Math.max(158, Math.min(442, hopper.y + 26));
      w.angle = t.angle;
      game.mode = "foot";
      t.speed = 0;
      recordEvent("cab_exited");
      showMessage("On foot. Walk to a bin and press Space to inspect it.");
      beep(260, .06, "square");
      return;
    }
    if (w.grabbedStop) { showMessage("Release the bin with E before entering the cab."); return; }
    if (Math.hypot(w.x - t.x, w.y - t.y) > 60) { showMessage("Walk closer to the cab to get in."); return; }
    game.mode = "truck";
    recordEvent("cab_entered");
    showMessage("Back in the cab. Follow the amber route arrow.");
    beep(310, .06, "square");
  }

  function toggleGrab() {
    if (game.phase !== "DRIVE" || game.mode !== "foot") return;
    const w = game.worker;
    if (w.grabbedStop) {
      const stop = game.stops.find(s => s.id === w.grabbedStop);
      w.grabbedStop = null;
      recordEvent("bin_released", { stopId: stop?.id });
      showMessage("Bin released.", 1.2);
      return;
    }
    const { stop, distance } = nearestStop(w);
    if (!stop || distance > 38) { showMessage("No serviceable bin within reach."); return; }
    if (stop.state === "waiting") { showMessage("Inspect this stop with Space before moving its bin."); return; }
    if (!["authorized", "empty"].includes(stop.state)) return;
    w.grabbedStop = stop.id;
    recordEvent("bin_grabbed", { stopId: stop.id, state: stop.state });
    showMessage(stop.state === "empty" ? "Wheel the empty bin back to its amber curb marker." : "Wheel the bin to the rear hopper.", 2.4);
    beep(205, .05, "square");
  }

  function handleSpaceAction() {
    if (game.phase !== "DRIVE") return;
    if (game.mode === "truck") { inspectStop(); return; }
    const w = game.worker;
    if (!w.grabbedStop) { inspectStop(); return; }
    const stop = game.stops.find(s => s.id === w.grabbedStop);
    if (!stop) return;
    if (stop.state === "authorized") {
      const hopper = hopperPosition();
      if (Math.hypot(stop.binX - hopper.x, stop.binY - hopper.y) <= 48) beginBinLoad(stop);
      else showMessage("Wheel the bin closer to the truck's rear hopper.");
      return;
    }
    if (stop.state === "empty") {
      if (Math.hypot(stop.binX - stop.x, stop.binY - stop.y) <= 42) returnBin(stop);
      else showMessage("Return the empty bin to its amber curb marker.");
    }
  }

  function updateWorker(dt) {
    const w = game.worker;
    w.stumble = Math.max(0, w.stumble - dt);
    w.collisionCooldown = Math.max(0, w.collisionCooldown - dt);
    if (w.stumble > 0) return;
    const dx = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
    const dy = (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1;
    const speed = w.grabbedStop ? 62 : 82;
    if (dx || dy) {
      w.angle = Math.atan2(dy, dx);
      w.x = Math.max(22, Math.min(W - 22, w.x + dx / length * speed * dt));
      w.y = Math.max(157, Math.min(443, w.y + dy / length * speed * dt));
    }
    if (w.grabbedStop) {
      const stop = game.stops.find(s => s.id === w.grabbedStop);
      if (stop) {
        const targetX = w.x - Math.cos(w.angle) * 22;
        const targetY = w.y - Math.sin(w.angle) * 22;
        const follow = 1 - Math.pow(.0008, dt);
        stop.binX += (targetX - stop.binX) * follow;
        stop.binY += (targetY - stop.binY) * follow;
      }
    }
  }

  function checkWorkerTraffic() {
    const w = game.worker;
    if (w.collisionCooldown > 0) return;
    for (const car of game.traffic) {
      if (Math.hypot(w.x - car.x, w.y - car.y) < 21) {
        w.collisionCooldown = 1.4;
        w.stumble = .55;
        w.x = Math.max(24, Math.min(W - 24, w.x - Math.sign(car.vx) * 30));
        if (w.grabbedStop) {
          recordEvent("bin_dropped_in_traffic", { stopId: w.grabbedStop });
          w.grabbedStop = null;
        }
        game.workerStumbles += 1;
        game.score -= 25;
        game.time = Math.max(0, game.time - 2);
        game.shake = .5;
        recordEvent("worker_stumbled", { trafficX: Number(car.x.toFixed(1)) });
        showMessage("Traffic clipped the crew—bin dropped, but you're still working. -2 seconds");
        beep(92, .2, "sawtooth", .06);
        break;
      }
    }
  }

  function updateHandling(dt) {
    const load = game.loading;
    if (!load) return;
    load.driftTimer -= dt;
    if (load.driftTimer <= 0) {
      load.drift = (random() - .5) * 1.15;
      load.driftTimer = .55 + random() * .65;
    }
    const control = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    load.balance += (load.drift + control * 1.75) * dt;
    load.balance *= Math.pow(.985, dt * 60);
    if (keys.has("Space")) {
      const stability = Math.max(.18, 1 - Math.abs(load.balance) * .72);
      load.progress = Math.min(1, load.progress + dt * .48 * stability);
    }
    if (Math.abs(load.balance) > 1.05) {
      load.drops += 1;
      game.handlingDrops += 1;
      game.score -= 20;
      load.progress = Math.max(0, load.progress - .18);
      load.balance = -Math.sign(load.balance) * .24;
      load.drift *= -.35;
      game.shake = .32;
      recordEvent("bin_slipped", { stopId: load.stop.id, progress: Number(load.progress.toFixed(2)) });
      showMessage("Bin slipped—counter the sway with A/D and keep holding Space.", 1.7);
      beep(105, .16, "sawtooth");
    }
    if (load.progress >= 1) finishLoad();
  }

  function updateTruck(dt) {
    const t = game.truck;
    t.stun = Math.max(0, t.stun - dt);
    t.collisionCooldown = Math.max(0, t.collisionCooldown - dt);
    if (t.stun > 0) { t.speed *= Math.pow(.1, dt); return; }
    const forward = keys.has("ArrowUp") || keys.has("KeyW");
    const reverse = keys.has("ArrowDown") || keys.has("KeyS");
    const left = keys.has("ArrowLeft") || keys.has("KeyA");
    const right = keys.has("ArrowRight") || keys.has("KeyD");
    if (forward) t.speed += 115 * dt;
    if (reverse) t.speed -= 92 * dt;
    if (!forward && !reverse) t.speed *= Math.pow(.16, dt);
    t.speed = Math.max(-58, Math.min(112, t.speed));
    const steer = (right ? 1 : 0) - (left ? 1 : 0);
    if (Math.abs(t.speed) > 3) t.angle += steer * 1.85 * dt * Math.sign(t.speed) * Math.min(1, Math.abs(t.speed) / 40);
    const nx = t.x + Math.cos(t.angle) * t.speed * dt;
    const ny = t.y + Math.sin(t.angle) * t.speed * dt;
    if (nx > 52 && nx < W - 52 && ny > 225 && ny < 375) { t.x = nx; t.y = ny; }
    else { t.speed *= -.18; game.shake = .16; }
  }

  function updateTraffic(dt) {
    for (const car of game.traffic) {
      car.x += car.vx * dt;
      if (car.vx > 0 && car.x > W + 45) car.x = -45;
      if (car.vx < 0 && car.x < -45) car.x = W + 45;
    }
  }

  function checkCollisions() {
    const t = game.truck;
    if (t.collisionCooldown > 0) return;
    const obstacles = [
      ...game.traffic.map(c => ({ x: c.x, y: c.y, r: 10, moving: true })),
      { x: 455, y: 205, r: 22, moving: false }
    ];
    for (const o of obstacles) {
      if (Math.hypot(t.x - o.x, t.y - o.y) < o.r + 24) {
        t.collisionCooldown = 1.2;
        t.stun = .45;
        t.speed *= -.25;
        game.damage += 1;
        recordEvent("collision", { movingTraffic: o.moving, looseLoad: Number(game.loose.toFixed(2)) });
        game.score -= 45;
        game.shake = .45;
        showMessage(o.moving ? "Traffic collision! Truck damage recorded." : "Blocked curb clipped. Back out carefully.");
        beep(72, .3, "sawtooth", .07);
        if (game.loose > 1 && random() < .48) createSpill();
        break;
      }
    }
  }

  function createSpill() {
    game.spills += 1;
    game.loose = Math.max(0, game.loose - .45);
    game.spillZones.push({ x: game.truck.x, y: game.truck.y, cleaned: false });
    game.score -= 70;
    recordEvent("spill_created", { remainingLoose: Number(game.loose.toFixed(2)) });
    for (let i = 0; i < 10; i++) game.particles.push({
      x: game.truck.x, y: game.truck.y,
      vx: (Math.random() - .5) * 75, vy: (Math.random() - .5) * 75,
      life: 3 + Math.random() * 2, size: 3 + Math.random() * 5
    });
    showMessage("Loose load spilled. Stop nearby and press X to deploy the cleanup kit.");
  }

  function updateParticles(dt) {
    for (const p of game.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; p.life -= dt; }
    game.particles = game.particles.filter(p => p.life > 0);
  }

  function draw() {
    ctx.save();
    const shakeX = game?.shake ? (Math.random() - .5) * game.shake * 12 : 0;
    const shakeY = game?.shake ? (Math.random() - .5) * game.shake * 12 : 0;
    ctx.translate(shakeX, shakeY);
    drawWorld();
    if (game) {
      drawStops();
      drawObstacles();
      drawSpills();
      drawParticles();
      drawTruck();
      drawWorker();
      drawWeather();
      drawNoirPass();
      drawHUD();
      if (game.phase !== "READY" && game.phase !== "RESULT") drawRouteArrow();
    }
    ctx.restore();
  }

  function drawWorld() {
    ctx.fillStyle="#090d12"; ctx.fillRect(0,0,W,H);

    drawBrickBlock(0,0,214,145,"#442c28",[42,108,170]);
    drawBrickBlock(218,0,176,145,"#342b2b",[250,316,362]);
    drawBrickBlock(401,0,235,145,"#503126",[438,504,578]);
    drawBrickBlock(643,0,168,145,"#282b2f",[676,742]);
    drawBrickBlock(818,0,142,145,"#3b2725",[846,908]);
    drawBrickBlock(0,458,176,142,"#2e2829",[32,92,146],true);
    drawBrickBlock(182,458,222,142,"#452b27",[214,286,360],true);
    drawBrickBlock(411,458,190,142,"#292e30",[448,518,568],true);
    drawBrickBlock(608,458,210,142,"#4b302a",[642,710,780],true);
    drawBrickBlock(825,458,135,142,"#272a2d",[854,916],true);

    ctx.fillStyle="#43413d"; ctx.fillRect(0,145,W,67); ctx.fillRect(0,390,W,68);
    ctx.fillStyle="#54504a"; ctx.fillRect(0,145,W,5); ctx.fillRect(0,453,W,5);
    ctx.fillStyle="#16191d"; ctx.fillRect(0,212,W,178);
    const roadGradient=ctx.createLinearGradient(0,212,0,390); roadGradient.addColorStop(0,"#14191e"); roadGradient.addColorStop(.5,"#0d1217"); roadGradient.addColorStop(1,"#171b1f"); ctx.fillStyle=roadGradient; ctx.fillRect(0,212,W,178);

    ctx.fillStyle="rgba(112,126,132,.13)";
    [[80,245,160,11],[286,344,120,8],[510,256,210,9],[746,350,142,7],[610,305,80,5]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
    ctx.fillStyle="rgba(228,150,52,.09)"; ctx.fillRect(40,279,160,5); ctx.fillRect(690,323,180,6);
    ctx.fillStyle="#6f746f";
    for(let x=10;x<W;x+=104){ctx.fillRect(x,299,44,3);ctx.fillStyle="#282d30";ctx.fillRect(x+44,299,60,3);ctx.fillStyle="#6f746f";}

    drawSlushBank(0,207,1); drawSlushBank(0,390,-1);
    drawStreetLamp(112,206,-1); drawStreetLamp(742,396,1);
    drawHydrant(865,188); drawHydrant(76,414);

    ctx.fillStyle="#07090b"; ctx.fillRect(375,145,30,67); ctx.fillRect(641,390,36,68);
    ctx.fillStyle="#65615a"; for(let y=153;y<208;y+=13)ctx.fillRect(381,y,18,2); for(let y=399;y<453;y+=13)ctx.fillRect(648,y,22,2);
    ctx.fillStyle="#809255"; ctx.fillRect(16,112,126,24); ctx.fillStyle="#101510"; ctx.font="bold 11px Courier New"; ctx.fillText("NIGHT OWL DELI",24,128);
    ctx.fillStyle="#854532"; ctx.fillRect(692,112,96,23); ctx.fillStyle="#e7c68b"; ctx.fillText("BELLWETHER",701,127);
  }

  function drawBrickBlock(x,y,w,h,color,windows,bottom=false){
    ctx.fillStyle="#08090b";ctx.fillRect(x+5,y+6,w-3,h);
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
    ctx.strokeStyle="rgba(12,13,15,.35)";ctx.lineWidth=1;
    for(let row=y+12;row<y+h;row+=10){ctx.beginPath();ctx.moveTo(x,row);ctx.lineTo(x+w,row);ctx.stroke();}
    for(let col=x+20;col<x+w;col+=40){ctx.beginPath();ctx.moveTo(col,y);ctx.lineTo(col,y+h);ctx.stroke();}
    const wy=bottom?y+27:y+28;
    windows.forEach((wx,i)=>{ctx.fillStyle=i%3===1?"#826638":"#11171b";ctx.fillRect(wx,wy,22,31);ctx.fillStyle="rgba(233,155,50,.12)";ctx.fillRect(wx+3,wy+3,7,24);ctx.strokeStyle="#0a0c0e";ctx.strokeRect(wx,wy,22,31);});
    ctx.fillStyle="#111316";ctx.fillRect(x+8,bottom?y:y+h-10,w-16,10);
    if(w>180){const fx=x+w*.58,fy=bottom?y+12:y+18;ctx.strokeStyle="#171a1d";ctx.lineWidth=4;ctx.strokeRect(fx,fy,52,52);ctx.lineWidth=2;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(fx-8+n*22,fy+8);ctx.lineTo(fx+16+n*22,fy+52);ctx.stroke();}}
  }

  function drawSlushBank(x,y,direction){
    ctx.fillStyle="#777a75";ctx.beginPath();ctx.moveTo(x,y);for(let px=0;px<=W;px+=36){ctx.lineTo(px,y+direction*(5+(px%72===0?5:0)));}ctx.lineTo(W,y+direction*14);ctx.lineTo(x,y+direction*14);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(173,180,177,.36)";for(let px=18;px<W;px+=58){ctx.fillRect(px,y+direction*3,22,2);}
  }

  function drawStreetLamp(x,y,direction){
    const glow=ctx.createRadialGradient(x,y-direction*18,2,x,y-direction*18,84);glow.addColorStop(0,"rgba(238,156,49,.27)");glow.addColorStop(1,"rgba(238,156,49,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y-direction*18,84,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#1d2123";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-direction*58);ctx.lineTo(x+direction*18,y-direction*58);ctx.stroke();ctx.fillStyle="#e99b32";ctx.fillRect(x+direction*22-10,y-direction*60-4,20,8);
  }

  function drawHydrant(x,y){ctx.fillStyle="#6f2e28";ctx.fillRect(x-5,y-8,10,19);ctx.fillRect(x-10,y-4,20,5);ctx.fillStyle="#a86043";ctx.fillRect(x-7,y-12,14,5);ctx.fillStyle="#191b1c";ctx.fillRect(x-9,y+10,18,3);}

  function drawStops() {
    for (const stop of game.stops) {
      if (["collected", "tagged"].includes(stop.state)) continue;
      if (stop.state === "empty") {
        ctx.save();ctx.translate(stop.x,stop.y);ctx.strokeStyle="#e99b32";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(-17,-21,34,42);ctx.setLineDash([]);ctx.fillStyle="rgba(8,10,12,.82)";ctx.fillRect(-37,-36,74,12);ctx.fillStyle="#e5ad58";ctx.font="bold 8px Courier New";ctx.textAlign="center";ctx.fillText("RETURN BIN",0,-27);ctx.restore();
      }
      let x = stop.binX, y = stop.binY;
      if (stop.state === "loading" && game.loading) {
        const p = Math.min(1, game.loading.progress);
        const lift = Math.sin(p * Math.PI) * 60;
        const hopper = hopperPosition();
        x += (hopper.x - stop.binX) * p + game.loading.balance * 24;
        y += (hopper.y - stop.binY) * p - lift;
      }
      ctx.save(); ctx.translate(x, y);
      const actor = actorPosition();
      const near = game.mode === "foot" && Math.hypot(stop.binX-actor.x, stop.binY-actor.y) < 42;
      ctx.fillStyle="rgba(0,0,0,.48)";ctx.beginPath();ctx.ellipse(3,17,18,7,0,0,Math.PI*2);ctx.fill();
      if(near){ctx.strokeStyle="#e99b32";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(0,0,22+Math.sin(performance.now()/160)*2,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      ctx.fillStyle=stop.state==="empty"?"#34463d":stop.state==="authorized"?"#365744":"#283d35";ctx.fillRect(-12,-14,24,29);
      ctx.fillStyle="#121917";ctx.fillRect(-15,-18,30,6);ctx.fillStyle="#526356";ctx.fillRect(-10,-11,3,20);
      ctx.fillStyle="#080a0b";ctx.beginPath();ctx.arc(-9,17,4,0,Math.PI*2);ctx.arc(9,17,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#8b8c80";ctx.fillRect(-5,-5,10,8);ctx.fillStyle="#333832";ctx.fillRect(-3,-3,6,4);
      if(near){ctx.fillStyle="rgba(8,10,12,.9)";ctx.fillRect(-43,-34,86,14);ctx.strokeStyle="#78562f";ctx.strokeRect(-43,-34,86,14);ctx.fillStyle="#e5ad58";ctx.font="bold 9px Courier New";ctx.textAlign="center";ctx.fillText(stop.label.toUpperCase(),0,-24);ctx.textAlign="left";}
      ctx.restore();
    }
  }

  function drawObstacles() {
    ctx.save();ctx.translate(455,205);ctx.rotate(.05);drawCar("#746f61",1.15);ctx.restore();
    ctx.fillStyle="rgba(8,10,12,.88)";ctx.fillRect(407,164,96,14);ctx.fillStyle="#d29035";ctx.font="bold 9px Courier New";ctx.fillText("NO ACCESS // PARKED",414,174);
    for (const car of game.traffic) { ctx.save(); ctx.translate(car.x, car.y); drawCar(car.color, 1); ctx.restore(); }
  }

  function drawCar(color, scale) {
    ctx.scale(scale,scale);ctx.fillStyle="rgba(0,0,0,.52)";ctx.fillRect(-27,-10,56,26);ctx.fillStyle="#090b0d";ctx.fillRect(-20,-16,11,5);ctx.fillRect(10,-16,11,5);ctx.fillRect(-20,11,11,5);ctx.fillRect(10,11,11,5);
    ctx.fillStyle=color;ctx.fillRect(-27,-12,54,24);ctx.fillStyle="#181e22";ctx.fillRect(-11,-10,25,20);ctx.fillStyle="#596267";ctx.fillRect(-8,-8,8,16);ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(-24,-9,5,18);ctx.fillStyle="#a94934";ctx.fillRect(-27,-8,3,6);ctx.fillRect(-27,3,3,6);ctx.fillStyle="#d6bb75";ctx.fillRect(24,-8,3,6);ctx.fillRect(24,3,3,6);
  }

  function drawTruck() {
    const t=game.truck;ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.angle);
    ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(-43,-22,91,50);
    ctx.fillStyle="#07090a";ctx.fillRect(-32,-28,16,7);ctx.fillRect(15,-27,16,7);ctx.fillRect(-32,20,16,7);ctx.fillRect(15,20,16,7);
    const body=ctx.createLinearGradient(-40,-22,12,22);body.addColorStop(0,"#1d332b");body.addColorStop(.5,"#344b3b");body.addColorStop(1,"#17251f");ctx.fillStyle=body;ctx.fillRect(-42,-23,54,46);
    ctx.fillStyle="#101a16";ctx.fillRect(-38,-18,7,36);ctx.fillStyle="#697462";ctx.fillRect(-28,-18,2,36);ctx.fillRect(-13,-18,2,36);ctx.fillRect(2,-18,2,36);
    ctx.fillStyle="#bdbaa7";ctx.fillRect(12,-21,32,42);ctx.fillStyle="#8b897c";ctx.fillRect(15,-18,8,36);ctx.fillStyle="#172027";ctx.fillRect(25,-16,15,32);ctx.fillStyle="#69757a";ctx.fillRect(33,-13,6,26);
    ctx.fillStyle="#121514";ctx.fillRect(11,-2,33,4);ctx.fillStyle="#9a4a2f";ctx.fillRect(-42,-20,6,40);
    for(let sy=-17;sy<18;sy+=8){ctx.fillStyle=sy%16===-1?"#18130c":"#d29431";ctx.fillRect(-41,sy,5,5);}
    const beacon=Math.sin(performance.now()/110)>.2?"#ffb13e":"#70451f";ctx.fillStyle=beacon;ctx.fillRect(17,-25,6,4);ctx.fillRect(30,-25,6,4);
    ctx.fillStyle="#ffe19a";ctx.fillRect(41,-15,4,7);ctx.fillRect(41,8,4,7);ctx.fillStyle="#e99b32";ctx.beginPath();ctx.moveTo(51,0);ctx.lineTo(44,-6);ctx.lineTo(44,6);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(226,156,59,.11)";ctx.beginPath();ctx.moveTo(45,-18);ctx.lineTo(112,-38);ctx.lineTo(112,38);ctx.lineTo(45,18);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawWorker() {
    if (game.mode !== "foot") return;
    const w=game.worker;ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
    if(w.stumble>0)ctx.rotate(Math.sin(performance.now()/45)*.55);
    ctx.fillStyle="rgba(0,0,0,.55)";ctx.beginPath();ctx.ellipse(-2,10,12,6,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#101614";ctx.fillRect(-8,5,6,12);ctx.fillRect(3,5,6,12);
    ctx.fillStyle="#294036";ctx.fillRect(-10,-12,20,21);ctx.fillStyle="#c48b32";ctx.fillRect(-10,-3,20,3);ctx.fillStyle="#b8b29c";ctx.fillRect(-8,-8,16,2);
    ctx.fillStyle="#76503b";ctx.beginPath();ctx.arc(0,-18,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#1a2420";ctx.fillRect(-7,-23,14,5);
    ctx.fillStyle="#d39a3b";ctx.fillRect(6,-22,6,2);
    if(w.grabbedStop){ctx.strokeStyle="#b7b09c";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,-4);ctx.lineTo(-18,2);ctx.moveTo(7,-4);ctx.lineTo(-18,7);ctx.stroke();}
    ctx.restore();
  }

  function drawParticles() { ctx.fillStyle="#352f25"; for (const p of game.particles) ctx.fillRect(p.x,p.y,p.size,p.size); }

  function drawSpills() {
    for (const spill of game.spillZones) {
      if (spill.cleaned) continue;
      ctx.save(); ctx.translate(spill.x, spill.y);
      ctx.fillStyle="rgba(28,24,20,.9)";
      [[-18,-8,8],[0,3,10],[15,-6,6],[-5,-15,5],[20,10,4]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); });
      const actor=actorPosition();const near = game.mode==="foot"&&Math.hypot(spill.x-actor.x, spill.y-actor.y) < 48;
      ctx.strokeStyle=near?"#e99b32":"#8e3e31";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(0,0,31,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="rgba(8,10,12,.9)";ctx.fillRect(-35,-47,70,14);ctx.fillStyle=near?"#e9ad53":"#a85b4b";ctx.font="bold 9px Courier New";ctx.textAlign="center";ctx.fillText(near?"X // CLEAN":"ROAD HAZARD",0,-37);ctx.textAlign="left";ctx.restore();
    }
  }

  function drawWeather(){
    const time=performance.now()*.045;
    ctx.strokeStyle="rgba(190,202,203,.22)";ctx.lineWidth=1;
    for(let i=0;i<52;i++){const x=(i*83+time*1.7)%1040-40;const y=(i*47+time*(.8+i%3*.18))%660-30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+12);ctx.stroke();}
    ctx.fillStyle="rgba(214,219,211,.28)";
    for(let i=0;i<18;i++){const x=(i*139+time*.23)%1000-20;const y=(i*71+time*.31)%630-15;ctx.fillRect(x,y,2,2);}
    const steam=Math.sin(performance.now()/520)*4;
    ctx.strokeStyle="rgba(174,181,177,.13)";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(390,205);ctx.bezierCurveTo(384+steam,188,402-steam,177,394+steam,159);ctx.stroke();
    ctx.beginPath();ctx.moveTo(658,416);ctx.bezierCurveTo(670-steam,399,649+steam,386,661-steam,369);ctx.stroke();
  }

  function drawNoirPass(){
    const vignette=ctx.createRadialGradient(W/2,H/2,170,W/2,H/2,610);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(.72,"rgba(0,0,0,.12)");vignette.addColorStop(1,"rgba(0,0,0,.62)");ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(7,11,14,.045)";for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);
  }

  function contextualPrompt() {
    if (game.phase === "COMPACT") return "COMPACTOR CYCLING — HOLD";
    if (game.phase === "LOAD") return "HOLD SPACE · A/D BALANCE THE BIN";
    if (game.phase !== "DRIVE") return "";
    const nearbySpill = nearestSpill();
    if(game.mode==="truck") return Math.abs(game.truck.speed)>10?"BRAKE · F TO EXIT CAB":"F · EXIT CAB   C · COMPACT";
    const w=game.worker;
    if(nearbySpill.spill&&nearbySpill.distance<=48&&!w.grabbedStop)return"X · CLEAN SPILL";
    if(w.grabbedStop){const stop=game.stops.find(s=>s.id===w.grabbedStop);if(stop?.state==="authorized"){const h=hopperPosition();return Math.hypot(stop.binX-h.x,stop.binY-h.y)<=48?"SPACE · LOAD HOPPER":"WHEEL BIN TO REAR HOPPER";}if(stop?.state==="empty")return Math.hypot(stop.binX-stop.x,stop.binY-stop.y)<=42?"SPACE · RETURN BIN":"WHEEL BIN TO AMBER MARKER";}
    if(Math.hypot(w.x-game.truck.x,w.y-game.truck.y)<=60)return"F · ENTER CAB";
    const nearbyStop = nearestStop(w);
    if(nearbyStop.stop&&nearbyStop.distance<=40)return nearbyStop.stop.state==="waiting"?`SPACE · INSPECT ${nearbyStop.stop.label.toUpperCase()}`:"E · GRAB BIN";
    if (game.loose >= 3 && Math.abs(game.truck.speed) <= 18) return "C · COMPACT LOOSE LOAD";
    return "WASD / ARROWS · WALK   E · GRAB/DROP";
  }

  function drawHUD() {
    ctx.fillStyle="rgba(7,10,13,.91)";ctx.fillRect(18,16,924,72);ctx.strokeStyle="#4d4a42";ctx.lineWidth=1;ctx.strokeRect(18,16,924,72);ctx.fillStyle="#9a6128";ctx.fillRect(18,16,4,72);
    ctx.fillStyle="#6d726e";ctx.font="bold 9px Courier New";ctx.fillText("BSA // ROUTE 04",32,33);ctx.fillText("STOPS",179,33);ctx.fillText("HOPPER PRESSURE",300,33);ctx.fillText("SERVICE SCORE",716,33);ctx.fillText("CALLS",858,33);
    ctx.font="bold 26px Arial Narrow, Arial";ctx.fillStyle=game.time<30?"#c5523d":"#e9a040";ctx.fillText(`${Math.ceil(game.time)}`,32,66);ctx.font="bold 9px Courier New";ctx.fillStyle="#777b77";ctx.fillText("SECONDS",82,66);
    ctx.font="bold 23px Arial Narrow, Arial";ctx.fillStyle="#ddd8ca";ctx.fillText(`${6-unresolved()}/6`,179,66);ctx.fillText(`${game.score}`,716,66);ctx.fillText(`${game.complaints}`,858,66);
    ctx.fillStyle="#24292b";ctx.fillRect(300,49,360,20);ctx.strokeStyle="#535751";ctx.strokeRect(300,49,360,20);ctx.fillStyle=usedCapacity()>6.8?"#a54131":"#7d8b4d";ctx.fillRect(303,52,354*Math.min(1,usedCapacity()/8),14);
    for(let x=306;x<654;x+=22){ctx.fillStyle="rgba(8,10,12,.22)";ctx.fillRect(x,52,2,14);}
    ctx.fillStyle="#d8d3c5";ctx.font="bold 9px Courier New";ctx.fillText(`${usedCapacity().toFixed(1)} / 8.0 CU  //  LOOSE ${game.loose.toFixed(1)}`,312,64);
    if(game.compactorCooldown>0){ctx.fillStyle="#e99b32";ctx.fillText(`CYCLE ${game.compactorCooldown.toFixed(1)}S`,555,82);}
    const prompt = contextualPrompt();
    if(prompt){ctx.fillStyle="rgba(7,10,13,.9)";ctx.fillRect(310,100,340,28);ctx.strokeStyle="#5d4a32";ctx.strokeRect(310,100,340,28);ctx.fillStyle="#e2a34c";ctx.font="bold 10px Courier New";ctx.textAlign="center";ctx.fillText(prompt,480,118);ctx.textAlign="left";}
    if (game.phase === "LOAD" && game.loading) drawHandlingMeter();
    if(game.messageTime>0){ctx.fillStyle="rgba(7,10,13,.94)";ctx.fillRect(175,532,610,38);ctx.fillStyle="#8e5e31";ctx.fillRect(175,532,4,38);ctx.strokeStyle="#403d37";ctx.strokeRect(175,532,610,38);ctx.fillStyle="#d9d4c6";ctx.font="bold 11px Courier New";ctx.textAlign="center";ctx.fillText(`DISPATCH // ${game.message.toUpperCase()}`,480,555);ctx.textAlign="left";}
  }

  function drawHandlingMeter() {
    const load = game.loading;
    ctx.fillStyle="rgba(7,10,13,.95)";ctx.fillRect(275,468,410,52);ctx.strokeStyle="#514838";ctx.strokeRect(275,468,410,52);
    ctx.fillStyle="#8e9189";ctx.font="bold 9px Courier New";ctx.fillText("HYDRAULIC LIFT // LOAD BALANCE",290,485);ctx.fillText(`${Math.round(load.progress*100)}%`,642,485);
    ctx.fillStyle="#282d2e";ctx.fillRect(290,494,380,12);ctx.fillStyle=Math.abs(load.balance)>.78?"#b74534":"#7d8b4d";ctx.fillRect(478+load.balance*160,492,9,16);ctx.fillStyle="#e9a040";ctx.fillRect(480,494,3,12);
  }

  function drawRouteArrow() {
    const { stop } = nearestStop();
    const { spill } = nearestSpill();
    const target = stop || spill;
    if (!target) return;
    const actor=actorPosition();const tx=stop?stop.binX:target.x;const ty=stop?stop.binY:target.y;
    const angle = Math.atan2(ty-actor.y, tx-actor.x);
    ctx.save();ctx.translate(900,113);ctx.rotate(angle);ctx.fillStyle="#e99b32";ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-8);ctx.lineTo(-4,0);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle="#9a682f";ctx.font="bold 9px Courier New";ctx.textAlign="right";ctx.fillText(stop?stop.label.toUpperCase():"SPILL CLEANUP",870,116);ctx.textAlign="left";
  }

  function frame(now) {
    const dt = Math.min(.033, (now-last)/1000 || 0); last=now;
    update(dt); draw(); requestAnimationFrame(frame);
  }

  function togglePause(forcePause = false) {
    if (!game || game.phase === "READY" || game.phase === "RESULT") return;
    if (game.phase === "PAUSED" && !forcePause) {
      game.phase = game.phaseBeforePause;
      ui.pause.classList.add("hidden");
      setStatus("Shift resumed.");
      canvas.focus();
      return;
    }
    if (game.phase !== "PAUSED") {
      game.phaseBeforePause = game.phase;
      game.phase = "PAUSED";
      keys.clear();
      ui.pause.classList.remove("hidden");
      setStatus("Shift paused. Press P or Resume.");
    }
  }

  addEventListener("keydown", event => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.repeat) return;
    if (event.code === "Space") handleSpaceAction();
    if (event.code === "KeyE") game.phase === "INSPECT" ? collectActive() : toggleGrab();
    if (event.code === "KeyF") exitEnterTruck();
    if (event.code === "KeyR") tagActive();
    if (event.code === "KeyQ") inspectCloser();
    if (event.code === "KeyC") compact();
    if (event.code === "KeyX") cleanSpill();
    if (event.code === "KeyP") togglePause();
    if (event.code === "Enter" && game.phase === "RESULT") { resetGame(); startGame(); }
    if (event.code === "KeyM") toggleMute();
  });
  addEventListener("keyup", event => keys.delete(event.code));
  addEventListener("blur", () => { keys.clear(); if (game && !["READY","RESULT","PAUSED"].includes(game.phase)) togglePause(true); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && game && !["READY","RESULT","PAUSED"].includes(game.phase)) togglePause(true); });
  document.querySelector("#startButton").addEventListener("click", startGame);
  document.querySelector("#collectButton").addEventListener("click", collectActive);
  document.querySelector("#tagButton").addEventListener("click", tagActive);
  document.querySelector("#inspectButton").addEventListener("click", inspectCloser);
  document.querySelector("#pauseButton").addEventListener("click", () => togglePause());
  document.querySelector("#resumeButton").addEventListener("click", () => togglePause());
  document.querySelector("#restartButton").addEventListener("click", () => { resetGame(); startGame(); });
  function toggleMute() { muted=!muted; ui.mute.textContent=`Sound: ${muted?"off":"on"}`; ui.mute.setAttribute("aria-pressed", String(muted)); }
  ui.mute.addEventListener("click", toggleMute);

  resetGame();
  requestAnimationFrame(frame);
})();
