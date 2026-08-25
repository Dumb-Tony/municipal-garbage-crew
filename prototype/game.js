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
    resultTitle: document.querySelector("#resultTitle"),
    resultSummary: document.querySelector("#resultSummary"),
    resultStats: document.querySelector("#resultStats"),
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

  const stopsTemplate = [
    { id: 1, x: 188, y: 190, label: "12 Maple", kind: "Household", weight: 1.7, contaminated: false },
    { id: 2, x: 350, y: 190, label: "18 Maple", kind: "Paint cans visible", weight: 1.1, contaminated: true },
    { id: 3, x: 565, y: 190, label: "24 Maple", kind: "Heavy household", weight: 2.4, contaminated: false },
    { id: 4, x: 774, y: 405, label: "Corner Market", kind: "Bagged commercial", weight: 2.7, contaminated: false },
    { id: 5, x: 544, y: 405, label: "31 Maple", kind: "Loose electronics", weight: 1.4, contaminated: true },
    { id: 6, x: 280, y: 405, label: "27 Maple", kind: "Household", weight: 2.2, contaminated: false }
  ];

  const trafficTemplate = [
    { x: 80, y: 292, vx: 82, color: "#a64f3f" },
    { x: 860, y: 348, vx: -68, color: "#4f7193" }
  ];

  function resetGame() {
    game = {
      phase: "READY",
      time: 150,
      score: 0,
      complaints: 0,
      spills: 0,
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
      shake: 0,
      truck: { x: 112, y: 330, angle: 0, speed: 0, stun: 0, collisionCooldown: 0 },
      stops: stopsTemplate.map(s => ({ ...s, state: "waiting", wobble: Math.random() * 6 })),
      traffic: trafficTemplate.map(t => ({ ...t }))
    };
    ui.start.classList.remove("hidden");
    ui.decision.classList.add("hidden");
    ui.result.classList.add("hidden");
    setStatus("Click “Clock in” to begin.");
  }

  function usedCapacity() { return game.loose + game.compacted; }
  function unresolved() { return game.stops.filter(s => s.state === "waiting").length; }
  function setStatus(text) { ui.status.textContent = text; }

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
    ui.decisionTitle.textContent = `${stop.label} · ${stop.kind}`;
    ui.decisionText.textContent = stop.contaminated
      ? "The load contains prohibited material. Collecting is faster, but risks a contamination complaint and a costly spill."
      : "Contents look acceptable. Load it, or leave it behind and take a missed-pickup complaint.";
    ui.decision.classList.remove("hidden");
    setStatus("Choose: E to collect or R to tag and leave.");
    beep(330, .08, "sine");
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
    game.loading = { stop, t: 0 };
    game.truck.speed = 0;
    beep(150, .14, "square");
  }

  function finishLoad() {
    const stop = game.loading.stop;
    stop.state = "collected";
    game.loose += stop.weight;
    game.collected += 1;
    game.score += 120;
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
    showMessage(`Compacted ${before.toFixed(1)} units into ${packed.toFixed(1)}. +25`);
    beep(82, .42, "sawtooth", .055);
    setTimeout(() => { if (game.phase === "COMPACT") game.phase = "DRIVE"; }, 850);
  }

  function checkRouteEnd() {
    if (unresolved() === 0) finishGame(false);
  }

  function finishGame(timedOut) {
    if (game.phase === "RESULT") return;
    const missed = unresolved();
    game.complaints += missed;
    game.score -= missed * 80;
    game.score += Math.floor(game.time) * 2;
    game.score -= game.spills * 70 + game.damage * 45;
    game.score = Math.max(0, Math.round(game.score));
    game.phase = "RESULT";
    ui.decision.classList.add("hidden");
    ui.resultTitle.textContent = timedOut ? "Shift clock expired" : (game.complaints === 0 ? "Clean route" : "Route closed");
    ui.resultSummary.textContent = game.complaints === 0
      ? "Maple Street is clear, the hopper is under control, and dispatch has nothing to complain about."
      : `The route is closed with ${game.complaints} complaint${game.complaints === 1 ? "" : "s"}. The town will remember what happened here.`;
    ui.resultStats.innerHTML = [
      ["Score", game.score], ["Collected", `${game.collected}/6`],
      ["Correct tags", game.stops.filter(s => s.state === "tagged" && s.contaminated).length],
      ["Spills", game.spills], ["Truck damage", game.damage], ["Time left", `${Math.ceil(game.time)}s`]
    ].map(([a, b]) => `<span><b>${a}</b><br>${b}</span>`).join("");
    ui.result.classList.remove("hidden");
    setStatus("Shift complete. Press Enter to run it again.");
    beep(game.complaints ? 170 : 560, .35, "triangle", .06);
  }

  function update(dt) {
    if (!game || game.phase === "READY" || game.phase === "RESULT") return;
    game.time = Math.max(0, game.time - dt);
    game.messageTime = Math.max(0, game.messageTime - dt);
    game.compactorCooldown = Math.max(0, game.compactorCooldown - dt);
    game.shake = Math.max(0, game.shake - dt);
    if (game.time <= 0) { finishGame(true); return; }

    updateTraffic(dt);
    updateParticles(dt);
    if (game.phase === "LOAD") {
      game.loading.t += dt / 1.05;
      if (game.loading.t >= 1) finishLoad();
      return;
    }
    if (game.phase !== "DRIVE") return;
    updateTruck(dt);
    checkCollisions();
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
    if (nx > 52 && nx < W - 52 && ny > 150 && ny < H - 90) { t.x = nx; t.y = ny; }
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
      ...game.traffic.map(c => ({ x: c.x, y: c.y, r: 31, moving: true })),
      { x: 455, y: 205, r: 34, moving: false }
    ];
    for (const o of obstacles) {
      if (Math.hypot(t.x - o.x, t.y - o.y) < o.r + 24) {
        t.collisionCooldown = 1.2;
        t.stun = .45;
        t.speed *= -.25;
        game.damage += 1;
        game.score -= 25;
        game.shake = .45;
        showMessage(o.moving ? "Traffic collision! Truck damage recorded." : "Blocked curb clipped. Back out carefully.");
        beep(72, .3, "sawtooth", .07);
        if (game.loose > 1 && Math.random() < .48) createSpill();
        break;
      }
    }
  }

  function createSpill() {
    game.spills += 1;
    game.loose = Math.max(0, game.loose - .45);
    for (let i = 0; i < 10; i++) game.particles.push({
      x: game.truck.x, y: game.truck.y,
      vx: (Math.random() - .5) * 75, vy: (Math.random() - .5) * 75,
      life: 3 + Math.random() * 2, size: 3 + Math.random() * 5
    });
    showMessage("Loose load spilled into the street. Cleanup penalty applied.");
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
        const p = Math.min(1, game.loading.t);
        const lift = Math.sin(p * Math.PI) * 60;
        x += (game.truck.x - stop.x) * p;
        y += (game.truck.y - stop.y) * p - lift;
      }
      ctx.save(); ctx.translate(x, y);
      const near = stop.state === "waiting" && Math.hypot(stop.x-game.truck.x, stop.y-game.truck.y) < 74;
      if (near) { ctx.strokeStyle = "#f2b84b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0,20+Math.sin(performance.now()/150)*2,0,Math.PI*2); ctx.stroke(); }
      ctx.fillStyle = stop.state === "tagged" ? "#c86b52" : "#3e6752";
      ctx.fillRect(-10, -13, 20, 26); ctx.fillStyle = "#18251e"; ctx.fillRect(-13, -16, 26, 5);
      ctx.fillStyle = "#101613"; ctx.beginPath(); ctx.arc(-8, 15, 3, 0, Math.PI*2); ctx.arc(8,15,3,0,Math.PI*2); ctx.fill();
      if (stop.state === "tagged") { ctx.fillStyle = "#f4d46a"; ctx.fillRect(10,-9,7,12); }
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
    ctx.fillStyle="#d9e0d4"; ctx.fillRect(-36,-21,31,42); ctx.fillStyle="#86aa73"; ctx.fillRect(-5,-23,48,46); ctx.fillStyle="#27332d"; ctx.fillRect(-31,-16,17,32); ctx.fillStyle="#f2b84b"; ctx.fillRect(34,-20,6,40);
    ctx.strokeStyle="#17211c"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(8,-17); ctx.lineTo(8,17); ctx.moveTo(22,-17); ctx.lineTo(22,17); ctx.stroke();
    ctx.restore();
  }

  function drawParticles() { ctx.fillStyle="#352f25"; for (const p of game.particles) ctx.fillRect(p.x,p.y,p.size,p.size); }

  function drawHUD() {
    ctx.fillStyle="rgba(15,22,18,.91)"; ctx.fillRect(18,16,924,74);
    ctx.fillStyle="#f0ead8"; ctx.font="800 13px Arial"; ctx.fillText("SHIFT CLOCK",34,39); ctx.fillText("ROUTE",185,39); ctx.fillText("HOPPER",316,39); ctx.fillText("SCORE",715,39); ctx.fillText("COMPLAINTS",820,39);
    ctx.font="900 25px Arial"; ctx.fillStyle=game.time<30?"#e07055":"#f2b84b"; ctx.fillText(`${Math.ceil(game.time)}s`,34,70);
    ctx.fillStyle="#f0ead8"; ctx.fillText(`${6-unresolved()}/6`,185,70); ctx.fillText(`${game.score}`,715,70); ctx.fillText(`${game.complaints}`,820,70);
    ctx.fillStyle="#3c4941"; ctx.fillRect(316,52,340,18); ctx.fillStyle=usedCapacity()>6.8?"#d8684f":"#87ad70"; ctx.fillRect(316,52,340*Math.min(1,usedCapacity()/8),18);
    ctx.fillStyle="#f0ead8"; ctx.font="bold 11px Arial"; ctx.fillText(`${usedCapacity().toFixed(1)} / 8  ·  loose ${game.loose.toFixed(1)}`,326,65);
    if (game.compactorCooldown>0) { ctx.fillStyle="#f2b84b"; ctx.fillText(`COMPACTOR ${game.compactorCooldown.toFixed(1)}s`,530,65); }
    if (game.messageTime>0) { ctx.fillStyle="rgba(15,22,18,.9)"; ctx.fillRect(195,530,570,42); ctx.fillStyle="#f0ead8"; ctx.font="bold 14px Arial"; ctx.textAlign="center"; ctx.fillText(game.message,480,556); ctx.textAlign="left"; }
  }

  function drawRouteArrow() {
    const { stop } = nearestStop(); if (!stop) return;
    const angle = Math.atan2(stop.y-game.truck.y, stop.x-game.truck.x);
    ctx.save(); ctx.translate(900,118); ctx.rotate(angle); ctx.fillStyle="#f2b84b"; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-12,-10); ctx.lineTo(-5,0); ctx.lineTo(-12,10); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle="#17211c"; ctx.font="bold 11px Arial"; ctx.textAlign="right"; ctx.fillText(stop.label.toUpperCase(),864,122); ctx.textAlign="left";
  }

  function frame(now) {
    const dt = Math.min(.033, (now-last)/1000 || 0); last=now;
    update(dt); draw(); requestAnimationFrame(frame);
  }

  addEventListener("keydown", event => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.repeat) return;
    if (event.code === "Space") inspectStop();
    if (event.code === "KeyE") collectActive();
    if (event.code === "KeyR") tagActive();
    if (event.code === "KeyC") compact();
    if (event.code === "Enter" && game.phase === "RESULT") { resetGame(); startGame(); }
    if (event.code === "KeyM") toggleMute();
  });
  addEventListener("keyup", event => keys.delete(event.code));
  addEventListener("blur", () => keys.clear());
  document.querySelector("#startButton").addEventListener("click", startGame);
  document.querySelector("#collectButton").addEventListener("click", collectActive);
  document.querySelector("#tagButton").addEventListener("click", tagActive);
  document.querySelector("#restartButton").addEventListener("click", () => { resetGame(); startGame(); });
  function toggleMute() { muted=!muted; ui.mute.textContent=`Sound: ${muted?"off":"on"}`; ui.mute.setAttribute("aria-pressed", String(muted)); }
  ui.mute.addEventListener("click", toggleMute);

  resetGame();
  requestAnimationFrame(frame);
})();
