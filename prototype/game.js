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
  const SHIFT_DURATION = 180;
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
      shake: 0,
      truck: { x: 112, y: 305, angle: 0, speed: 0, stun: 0, collisionCooldown: 0 },
      stops: stopsTemplate.map(s => ({ ...s, state: "waiting", revealed: false, wobble: randomSeeded(s.id) * 6 })),
      traffic: trafficTemplate.map(t => ({ ...t }))
    };
    ui.start.classList.remove("hidden");
    ui.decision.classList.add("hidden");
    ui.result.classList.add("hidden");
    ui.pause.classList.add("hidden");
    setStatus("Click “Clock in” to begin.");
  }

  function usedCapacity() { return game.loose + game.compacted; }
  function unresolved() { return game.stops.filter(s => s.state === "waiting").length; }
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
    setStatus("Follow the amber arrow. Stop beside a bin and press Space.");
    canvas.focus();
    beep(440, .12, "sawtooth");
  }

  function showMessage(text, seconds = 2.5) {
    game.message = text;
    game.messageTime = seconds;
    setStatus(text);
  }

  function nearestStop() {
    let best = null;
    let bestDistance = Infinity;
    for (const stop of game.stops) {
      if (stop.state !== "waiting") continue;
      const distance = Math.hypot(stop.x - game.truck.x, stop.y - game.truck.y);
      if (distance < bestDistance) { best = stop; bestDistance = distance; }
    }
    return { stop: best, distance: bestDistance };
  }

  function inspectStop() {
    if (game.phase !== "DRIVE" || Math.abs(game.truck.speed) > 22) {
      if (game.phase === "DRIVE") showMessage("Brake to a near stop before handling a bin.");
      return;
    }
    const { stop, distance } = nearestStop();
    if (!stop || distance > 74) { showMessage("Pull closer to a waiting curb bin."); return; }
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
    const projected = usedCapacity() + stop.weight;
    if (projected > 8) {
      showMessage("Hopper is full. Close this check and compact before loading.");
      ui.decision.classList.add("hidden");
      game.phase = "DRIVE";
      game.activeStop = null;
      beep(110, .18, "sawtooth");
      return;
    }
    ui.decision.classList.add("hidden");
    game.phase = "LOAD";
    stop.state = "loading";
    game.loading = { stop, progress: 0, balance: (random() - .5) * .2, drift: (random() - .5) * .5, driftTimer: .7, drops: 0 };
    game.truck.speed = 0;
    beep(150, .14, "square");
  }

  function finishLoad() {
    const stop = game.loading.stop;
    stop.state = "collected";
    game.loose += stop.weight;
    game.collected += 1;
    game.score += 120;
    recordEvent("stop_collected", { stopId: stop.id, weight: stop.weight, contaminated: stop.contaminated, handlingDrops: game.loading.drops });
    if (stop.contaminated) {
      game.badLoads += 1;
      game.complaints += 1;
      game.score -= 90;
      showMessage("Contaminated load accepted. Dispatch logged a violation.");
    } else {
      showMessage(`${stop.label} cleared. +120`);
    }
    game.loading = null;
    game.activeStop = null;
    game.phase = "DRIVE";
    beep(260, .09, "square");
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
    for (const spill of game.spillZones) {
      if (spill.cleaned) continue;
      const distance = Math.hypot(spill.x - game.truck.x, spill.y - game.truck.y);
      if (distance < bestDistance) { best = spill; bestDistance = distance; }
    }
    return { spill: best, distance: bestDistance };
  }

  function cleanSpill() {
    if (game.phase !== "DRIVE") return;
    if (Math.abs(game.truck.speed) > 18) { showMessage("Stop beside the spill before deploying the cleanup kit."); return; }
    const { spill, distance } = nearestSpill();
    if (!spill || distance > 68) { showMessage("No spill within cleanup range."); return; }
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
      ["Handling slips", game.handlingDrops * -20], ["Spills created", game.spills * -70], ["Truck damage", game.damage * -45]
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
      ["Handling slips", game.handlingDrops], ["Spills cleaned", `${game.cleanedSpills}/${game.spills}`], ["Truck damage", game.damage], ["Time left", `${Math.ceil(game.time)}s`],
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
    updateTruck(dt);
    checkCollisions();
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
      drawHUD();
      if (game.phase !== "READY" && game.phase !== "RESULT") drawRouteArrow();
    }
    ctx.restore();
  }

  function drawWorld() {
    ctx.fillStyle = "#849268"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#b9af8a"; ctx.fillRect(0, 145, W, 55); ctx.fillRect(0, 400, W, 55);
    ctx.fillStyle = "#323836"; ctx.fillRect(0, 210, W, 180);
    ctx.fillStyle = "rgba(255,255,255,.19)";
    for (let x = 0; x < W; x += 72) { ctx.fillRect(x, 297, 38, 4); }
    ctx.fillStyle = "#6d765c";
    [[70,50,120,76],[235,55,145,70],[500,42,140,84],[720,60,150,72],[85,480,145,82],[330,482,155,76],[575,476,126,85],[755,478,130,78]].forEach(([x,y,w,h]) => {
      ctx.fillRect(x,y,w,h); ctx.fillStyle = "#d5c59d"; ctx.fillRect(x+10,y+10,w-20,h-20); ctx.fillStyle = "#6d765c";
    });
    ctx.fillStyle = "#61704f";
    for (let x = 28; x < W; x += 115) { ctx.beginPath(); ctx.arc(x, 128, 20, 0, Math.PI*2); ctx.fill(); }
  }

  function drawStops() {
    for (const stop of game.stops) {
      if (stop.state === "collected") continue;
      let x = stop.x, y = stop.y;
      if (stop.state === "loading" && game.loading) {
        const p = Math.min(1, game.loading.progress);
        const lift = Math.sin(p * Math.PI) * 60;
        x += (game.truck.x - stop.x) * p + game.loading.balance * 24;
        y += (game.truck.y - stop.y) * p - lift;
      }
      ctx.save(); ctx.translate(x, y);
      const near = stop.state === "waiting" && Math.hypot(stop.x-game.truck.x, stop.y-game.truck.y) < 74;
      if (near) { ctx.strokeStyle = "#f2b84b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0,20+Math.sin(performance.now()/150)*2,0,Math.PI*2); ctx.stroke(); }
      ctx.fillStyle = stop.state === "tagged" ? "#c86b52" : "#3e6752";
      ctx.fillRect(-10, -13, 20, 26); ctx.fillStyle = "#18251e"; ctx.fillRect(-13, -16, 26, 5);
      ctx.fillStyle = "#101613"; ctx.beginPath(); ctx.arc(-8, 15, 3, 0, Math.PI*2); ctx.arc(8,15,3,0,Math.PI*2); ctx.fill();
      if (stop.state === "tagged") { ctx.fillStyle = "#f4d46a"; ctx.fillRect(10,-9,7,12); }
      ctx.fillStyle = near ? "#17211c" : "rgba(23,33,28,.76)"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillText(stop.label.toUpperCase(), 0, -24); ctx.textAlign = "left";
      ctx.restore();
    }
  }

  function drawObstacles() {
    ctx.save(); ctx.translate(455, 205); ctx.rotate(.05); drawCar("#d0c6ac", 1.15); ctx.restore();
    ctx.fillStyle = "#e6d47f"; ctx.font = "bold 11px Arial"; ctx.fillText("BLOCKED CURB", 414, 164);
    for (const car of game.traffic) { ctx.save(); ctx.translate(car.x, car.y); drawCar(car.color, 1); ctx.restore(); }
  }

  function drawCar(color, scale) {
    ctx.scale(scale, scale); ctx.fillStyle = color; ctx.fillRect(-25,-12,50,24); ctx.fillStyle="#202927"; ctx.fillRect(-12,-10,23,20); ctx.fillStyle="#111"; ctx.fillRect(-18,-15,10,4); ctx.fillRect(10,-15,10,4); ctx.fillRect(-18,11,10,4); ctx.fillRect(10,11,10,4);
  }

  function drawTruck() {
    const t = game.truck; ctx.save(); ctx.translate(t.x,t.y); ctx.rotate(t.angle);
    ctx.fillStyle="#111"; ctx.fillRect(-32,-26,15,7); ctx.fillRect(15,-26,15,7); ctx.fillRect(-32,19,15,7); ctx.fillRect(15,19,15,7);
    ctx.fillStyle="#86aa73"; ctx.fillRect(-40,-23,50,46); ctx.fillStyle="#d9e0d4"; ctx.fillRect(10,-21,32,42);
    ctx.fillStyle="#27332d"; ctx.fillRect(22,-16,15,32); ctx.fillStyle="#a8c6ca"; ctx.fillRect(31,-14,7,28);
    ctx.fillStyle="#f2b84b"; ctx.fillRect(-40,-20,6,40); ctx.fillStyle="#fff1b0"; ctx.fillRect(39,-16,4,8); ctx.fillRect(39,8,4,8);
    ctx.strokeStyle="#17211c"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-25,-17); ctx.lineTo(-25,17); ctx.moveTo(-10,-17); ctx.lineTo(-10,17); ctx.stroke();
    ctx.fillStyle="#f2b84b"; ctx.beginPath(); ctx.moveTo(50,0); ctx.lineTo(44,-6); ctx.lineTo(44,6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawParticles() { ctx.fillStyle="#352f25"; for (const p of game.particles) ctx.fillRect(p.x,p.y,p.size,p.size); }

  function drawSpills() {
    for (const spill of game.spillZones) {
      if (spill.cleaned) continue;
      ctx.save(); ctx.translate(spill.x, spill.y);
      ctx.fillStyle="rgba(49,38,29,.78)";
      [[-18,-8,8],[0,3,10],[15,-6,6],[-5,-15,5],[20,10,4]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); });
      const near = Math.hypot(spill.x-game.truck.x, spill.y-game.truck.y) < 68;
      ctx.strokeStyle=near?"#f2b84b":"#d8684f"; ctx.lineWidth=3; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.arc(0,0,31,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle="#17211c"; ctx.font="bold 10px Arial"; ctx.textAlign="center"; ctx.fillText(near?"X · CLEAN":"SPILL",0,-39); ctx.textAlign="left"; ctx.restore();
    }
  }

  function contextualPrompt() {
    if (game.phase === "COMPACT") return "COMPACTOR CYCLING — HOLD";
    if (game.phase === "LOAD") return "HOLD SPACE · A/D BALANCE THE BIN";
    if (game.phase !== "DRIVE") return "";
    const nearbySpill = nearestSpill();
    if (nearbySpill.spill && nearbySpill.distance <= 68) return Math.abs(game.truck.speed) > 18 ? "BRAKE TO CLEAN SPILL" : "X · CLEAN SPILL";
    const nearbyStop = nearestStop();
    if (nearbyStop.stop && nearbyStop.distance <= 74) return Math.abs(game.truck.speed) > 22 ? "BRAKE TO SERVICE STOP" : `SPACE · INSPECT ${nearbyStop.stop.label.toUpperCase()}`;
    if (game.loose >= 3 && Math.abs(game.truck.speed) <= 18) return "C · COMPACT LOOSE LOAD";
    return "WASD / ARROWS · DRIVE   P · PAUSE";
  }

  function drawHUD() {
    ctx.fillStyle="rgba(15,22,18,.91)"; ctx.fillRect(18,16,924,74);
    ctx.fillStyle="#f0ead8"; ctx.font="800 13px Arial"; ctx.fillText("SHIFT CLOCK",34,39); ctx.fillText("ROUTE",185,39); ctx.fillText("HOPPER",316,39); ctx.fillText("SCORE",715,39); ctx.fillText("COMPLAINTS",820,39);
    ctx.font="900 25px Arial"; ctx.fillStyle=game.time<30?"#e07055":"#f2b84b"; ctx.fillText(`${Math.ceil(game.time)}s`,34,70);
    ctx.fillStyle="#f0ead8"; ctx.fillText(`${6-unresolved()}/6`,185,70); ctx.fillText(`${game.score}`,715,70); ctx.fillText(`${game.complaints}`,820,70);
    ctx.fillStyle="#3c4941"; ctx.fillRect(316,52,340,18); ctx.fillStyle=usedCapacity()>6.8?"#d8684f":"#87ad70"; ctx.fillRect(316,52,340*Math.min(1,usedCapacity()/8),18);
    ctx.fillStyle="#f0ead8"; ctx.font="bold 11px Arial"; ctx.fillText(`${usedCapacity().toFixed(1)} / 8  ·  loose ${game.loose.toFixed(1)}`,326,65);
    if (game.compactorCooldown>0) { ctx.fillStyle="#f2b84b"; ctx.fillText(`COMPACTOR ${game.compactorCooldown.toFixed(1)}s`,530,65); }
    const prompt = contextualPrompt();
    if (prompt) { ctx.fillStyle="rgba(15,22,18,.88)"; ctx.fillRect(320,100,320,30); ctx.fillStyle="#f2b84b"; ctx.font="bold 12px Arial"; ctx.textAlign="center"; ctx.fillText(prompt,480,120); ctx.textAlign="left"; }
    if (game.phase === "LOAD" && game.loading) drawHandlingMeter();
    if (game.messageTime>0) { ctx.fillStyle="rgba(15,22,18,.9)"; ctx.fillRect(195,530,570,42); ctx.fillStyle="#f0ead8"; ctx.font="bold 14px Arial"; ctx.textAlign="center"; ctx.fillText(game.message,480,556); ctx.textAlign="left"; }
  }

  function drawHandlingMeter() {
    const load = game.loading;
    ctx.fillStyle="rgba(15,22,18,.94)"; ctx.fillRect(285,468,390,52);
    ctx.fillStyle="#f0ead8"; ctx.font="bold 10px Arial"; ctx.fillText("BIN BALANCE",300,485); ctx.fillText(`${Math.round(load.progress*100)}% LOADED`,568,485);
    ctx.fillStyle="#3c4941"; ctx.fillRect(300,493,360,12);
    ctx.fillStyle=Math.abs(load.balance)>.78?"#d8684f":"#87ad70"; ctx.fillRect(478 + load.balance*150,491,8,16);
    ctx.fillStyle="#f2b84b"; ctx.fillRect(480,493,3,12);
  }

  function drawRouteArrow() {
    const { stop } = nearestStop();
    const { spill } = nearestSpill();
    const target = stop || spill;
    if (!target) return;
    const angle = Math.atan2(target.y-game.truck.y, target.x-game.truck.x);
    ctx.save(); ctx.translate(900,118); ctx.rotate(angle); ctx.fillStyle="#f2b84b"; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-12,-10); ctx.lineTo(-5,0); ctx.lineTo(-12,10); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle="#17211c"; ctx.font="bold 11px Arial"; ctx.textAlign="right"; ctx.fillText(stop ? stop.label.toUpperCase() : "SPILL CLEANUP",864,122); ctx.textAlign="left";
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
    if (event.code === "Space") inspectStop();
    if (event.code === "KeyE") collectActive();
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
