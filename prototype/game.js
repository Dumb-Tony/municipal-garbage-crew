(() => {
  "use strict";

  const Rules = window.MGCRules;
  const Input = window.MGCInput;
  const Timing = window.MGCTiming;
  const Contracts = window.MGCContracts;
  if (!Rules) throw new Error("Municipal Garbage Crew rules failed to load.");
  if (!Input) throw new Error("Municipal Garbage Crew input map failed to load.");
  if (!Timing) throw new Error("Municipal Garbage Crew timing system failed to load.");
  if (!Contracts) throw new Error("Municipal Garbage Crew contracts failed to load.");
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
    depotStats: document.querySelector("#depotStats"),
    lastShiftNote: document.querySelector("#lastShiftNote"),
    upgradeList: document.querySelector("#upgradeList"),
    addressHistory: document.querySelector("#addressHistory"),
    resetCareer: document.querySelector("#resetCareerButton"),
    endShift: document.querySelector("#endShiftButton"),
    relaxedClock: document.querySelector("#relaxedClock"),
    handlingAssist: document.querySelector("#handlingAssist"),
    lightTraffic: document.querySelector("#lightTraffic"),
    reducedShake: document.querySelector("#reducedShake"),
    highContrast: document.querySelector("#highContrast"),
    contractList: document.querySelector("#contractList"),
    routeBriefTitle: document.querySelector("#routeBriefTitle"),
    routeBriefText: document.querySelector("#routeBriefText"),
    controlSummary: document.querySelector("#controlSummary"),
    bindingList: document.querySelector("#bindingList"),
    resetBindings: document.querySelector("#resetBindingsButton"),
    playtestReport: document.querySelector("#playtestReport"),
    copyReport: document.querySelector("#copyReportButton"),
    status: document.querySelector("#statusText"),
    mute: document.querySelector("#muteButton"),
    audioStatus: document.querySelector("#audioStatus"),
    vehicleVolume: document.querySelector("#vehicleVolume"),
    streetVolume: document.querySelector("#streetVolume"),
    effectsVolume: document.querySelector("#effectsVolume")
  };

  const W = canvas.width;
  const H = canvas.height;
  const WORLD_W = W * 3;
  const keys = new Set();
  let audio = null;
  let muted = false;
  let last = 0;
  const simulation = Timing.createFixedStepper(1 / 60, .25);
  let game;
  let rebindingAction = null;
  const SHIFT_DURATION = Rules.STANDARD_SHIFT_DURATION;
  const SHIFT_SEED = 4040712;

  const stopsTemplate = [
    { id: 1, x: 188, y: 190, label: "12 Maple", kind: "Household", weight: 1.7, contaminated: false },
    { id: 2, x: 350, y: 190, label: "18 Maple", kind: "Sealed contractor bags", weight: 1.1, contaminated: true, ambiguous: true },
    { id: 3, x: 565, y: 190, label: "24 Maple", kind: "Heavy household", weight: 2.4, contaminated: false },
    { id: 4, x: 774, y: 405, label: "Corner Market", kind: "Bagged commercial", weight: 2.7, contaminated: false },
    { id: 5, x: 1040, y: 190, label: "42 Maple", kind: "Household", weight: 1.4, contaminated: false },
    { id: 6, x: 1210, y: 405, label: "47 Maple", kind: "Loose electronics", weight: 1.4, contaminated: true },
    { id: 7, x: 1450, y: 190, label: "50 Maple", kind: "Heavy household", weight: 2.1, contaminated: false },
    { id: 8, x: 1715, y: 405, label: "Bellwether Arms", kind: "Shared carts", weight: 2.5, contaminated: false },
    { id: 9, x: 2170, y: 190, label: "72 Maple", kind: "Yard waste", weight: 1.6, contaminated: false },
    { id: 10, x: 2530, y: 405, label: "East End Laundromat", kind: "Bagged commercial", weight: 2.3, contaminated: false }
  ];
  const TOTAL_STOPS = stopsTemplate.length;

  const trafficTemplate = [
    { x: 430, y: 270, vx: 72, axis: "x", color: "#a64f3f" },
    { x: 820, y: 340, vx: -62, axis: "x", color: "#4f7193" },
    { x: 1510, y: 270, vx: 66, axis: "x", color: "#78644c" },
    { x: 2430, y: 340, vx: -74, axis: "x", color: "#536b5c" },
    { x: 960, y: 150, vy: 76, axis: "y", color: "#805449" },
    { x: 1920, y: 450, vy: -69, axis: "y", color: "#4e647b" }
  ];

  const obstacleTemplate = [
    { x: 455, y: 205, r: 22, type: "parked", label: "BLOCKED CURB" },
    { x: 1325, y: 395, r: 23, type: "parked", label: "DOUBLE PARKED" },
    { x: 1605, y: 300, r: 25, type: "barrier", label: "UTILITY CUT" },
    { x: 2365, y: 205, r: 22, type: "parked", label: "DELIVERY ZONE" }
  ];

  const wasteTemplate = [
    { id: "bag-market", stopId: 4, x: 808, y: 404, type: "bag", label: "MARKET BAG", weight: .7, fragile: true },
    { id: "mattress-24", stopId: 3, x: 602, y: 184, type: "bulk", label: "SOAKED MATTRESS", weight: 1.5, fragile: false }
  ];

  const SAVE_KEY="municipal-garbage-crew.campaign";
  const SAVE_VERSION=1;
  const UPGRADES=[
    {id:"hydraulicAssist",name:"Hydraulic Assist",cost:450,description:"Bin lifts fill 28% faster."},
    {id:"hopperBaffles",name:"Hopper Baffles",cost:650,description:"Capacity increases from 8.0 to 10.0."},
    {id:"winterTires",name:"Winter Tires",cost:500,description:"Sharper control and fewer collision spills."}
  ];

  function defaultCampaign(){return{version:SAVE_VERSION,shifts:0,credits:0,trust:50,bestScore:0,addressHistory:{},upgrades:{},lastShift:null,settings:{vehicle:72,street:55,effects:78,relaxedClock:true,handlingAssist:true,lightTraffic:false,reducedShake:false,highContrast:false,contractId:"regular",bindings:Input.defaultBindings()}};}
  function loadCampaign(){try{const parsed=JSON.parse(localStorage.getItem(SAVE_KEY));if(!parsed||parsed.version!==SAVE_VERSION)return defaultCampaign();const base=defaultCampaign();const loaded={...base,...parsed,addressHistory:{...base.addressHistory,...parsed.addressHistory},upgrades:{...base.upgrades,...parsed.upgrades},settings:{...base.settings,...parsed.settings}};loaded.settings.bindings=Input.normalizeBindings(loaded.settings.bindings);return loaded;}catch(_){return defaultCampaign();}}
  let campaign=loadCampaign();
  function saveCampaign(){try{campaign.settings={vehicle:Number(ui.vehicleVolume.value),street:Number(ui.streetVolume.value),effects:Number(ui.effectsVolume.value),relaxedClock:ui.relaxedClock.checked,handlingAssist:ui.handlingAssist.checked,lightTraffic:ui.lightTraffic.checked,reducedShake:ui.reducedShake.checked,highContrast:ui.highContrast.checked,contractId:Contracts.getContract(campaign.settings.contractId).id,bindings:Input.normalizeBindings(campaign.settings.bindings)};localStorage.setItem(SAVE_KEY,JSON.stringify(campaign));}catch(_){/* Persistence is optional on restricted origins. */}}
  function applyCampaignSettings(){ui.vehicleVolume.value=campaign.settings.vehicle;ui.streetVolume.value=campaign.settings.street;ui.effectsVolume.value=campaign.settings.effects;ui.relaxedClock.checked=campaign.settings.relaxedClock;ui.handlingAssist.checked=campaign.settings.handlingAssist;ui.lightTraffic.checked=campaign.settings.lightTraffic;ui.reducedShake.checked=campaign.settings.reducedShake;ui.highContrast.checked=campaign.settings.highContrast;document.body.classList.toggle("high-contrast",ui.highContrast.checked);renderBindings();}
  function held(action){return Input.isActionDown(action,keys,campaign.settings.bindings);}
  function escapeHTML(value){return String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);}
  function keyLabel(action){return Input.formatCode(campaign.settings.bindings[action]);}
  function renderControlSummary(){const move=["forward","left","reverse","right"].map(keyLabel).join("/");ui.controlSummary.innerHTML=`<span><b>${escapeHTML(move)} / Arrows</b> Drive / walk</span><span><b>${escapeHTML(keyLabel("cab"))}</b> Exit / enter truck</span><span><b>${escapeHTML(keyLabel("work"))}</b> Inspect / load / return</span><span><b>${escapeHTML(keyLabel("grab"))} / ${escapeHTML(keyLabel("tag"))} / ${escapeHTML(keyLabel("inspect"))}</b> Grab / tag / check</span><span><b>Hold ${escapeHTML(keyLabel("brace"))}</b> Brace oversized waste</span><span><b>${escapeHTML(keyLabel("compact"))} / ${escapeHTML(keyLabel("cleanup"))}</b> Compact / clean spill</span><span><b>Hold ${escapeHTML(keyLabel("work"))} + ${escapeHTML(keyLabel("left"))}/${escapeHTML(keyLabel("right"))}</b> Lift / balance bin</span>`;canvas.setAttribute("aria-label",`Top-down sanitation game. Current primary movement keys are ${move}; arrow keys remain available. ${keyLabel("cab")} enters or exits the truck, ${keyLabel("work")} performs contextual work, ${keyLabel("grab")} grabs or releases objects, ${keyLabel("brace")} braces oversized items, ${keyLabel("tag")} tags contamination, ${keyLabel("inspect")} checks uncertain waste, ${keyLabel("cleanup")} cleans spills, and ${keyLabel("compact")} runs the compactor.`);}
  function renderBindings(){ui.bindingList.innerHTML=Input.ACTION_ORDER.map(action=>`<label class="binding-row"><span>${Input.ACTIONS[action].label}</span><button type="button" data-bind-action="${action}" class="${rebindingAction===action?"listening":""}" aria-label="Rebind ${Input.ACTIONS[action].label}">${rebindingAction===action?"Press key…":escapeHTML(keyLabel(action))}</button></label>`).join("");renderControlSummary();}
  function renderContracts(){const selected=Contracts.getContract(campaign.settings.contractId);ui.contractList.innerHTML=Contracts.CONTRACT_ORDER.map(id=>{const contract=Contracts.getContract(id);const timing=contract.extraSeconds?`+${contract.extraSeconds}s`:`baseline time`;return`<label class="contract-card"><input type="radio" name="contract" value="${id}" ${id===selected.id?"checked":""}><b>${contract.name}</b><small>${contract.description}</small><i>Pay ×${contract.payoutMultiplier.toFixed(2)} · ${timing}</i></label>`;}).join("");const headline=selected.id==="bulk"?"Three blocks.\nFour loose items.\nOne compactor.":selected.id==="storm"?"Three blocks.\nThree debris fields.\nTen stops.":"Three blocks.\nTen stops.\nOne working compactor.";ui.routeBriefTitle.innerHTML=headline.split("\n").map(escapeHTML).join("<br>");ui.routeBriefText.textContent=`${selected.stamp}. ${selected.description}`;}
  function activeAssistNames(){return Object.entries({"Relaxed clock":game.assists.relaxedClock,"Handling assist":game.assists.handlingAssist,"Light traffic":game.assists.lightTraffic,"Reduced shake":game.assists.reducedShake,"High contrast":game.assists.highContrast}).filter(([,on])=>on).map(([name])=>name);}
  function capacityLimit(){return campaign.upgrades.hopperBaffles?10:8;}
  function renderDepot(){
    const owned=UPGRADES.filter(u=>campaign.upgrades[u.id]).length;const rank=1+Math.floor(campaign.shifts/3)+owned;
    ui.depotStats.innerHTML=`<span>Credits<br><b>$${campaign.credits}</b></span><span>Town trust<br><b>${campaign.trust}</b></span><span>Crew rank<br><b>${rank}</b></span>`;
    ui.lastShiftNote.textContent=campaign.lastShift?`Last shift: ${campaign.lastShift.contract||"Maple Regular"} · ${campaign.lastShift.score} points · $${campaign.lastShift.earned} earned · ${campaign.lastShift.complaints} complaint${campaign.lastShift.complaints===1?"":"s"}. Best: ${campaign.bestScore}.`:`No completed shifts on file. First route earns the garage budget.`;
    renderContracts();
    ui.upgradeList.innerHTML=UPGRADES.map(upgrade=>{const owned=campaign.upgrades[upgrade.id];const disabled=owned||campaign.credits<upgrade.cost;return`<div class="upgrade-card ${owned?"owned":""}"><b>${upgrade.name}</b><small>${upgrade.description}</small><button type="button" data-upgrade="${upgrade.id}" ${disabled?"disabled":""}>${owned?"Installed":`$${upgrade.cost}`}</button></div>`;}).join("");
    const history=stopsTemplate.map(stop=>({stop,entry:campaign.addressHistory[stop.id]})).filter(item=>item.entry).sort((a,b)=>b.entry.visits-a.entry.visits);
    ui.addressHistory.innerHTML=history.length?history.map(({stop,entry})=>`<span><b>${stop.label}</b><i>${entry.lastOutcome.replaceAll("-"," ")} · ${entry.visits}×</i></span>`).join(""):`<span>No address notes yet.</span>`;
    document.querySelector("#startButton").innerHTML=`Begin ${Contracts.getContract(campaign.settings.contractId).name} <span>›</span>`;
  }

  function buyUpgrade(id){const upgrade=UPGRADES.find(item=>item.id===id);if(!upgrade||campaign.upgrades[id]||campaign.credits<upgrade.cost)return;campaign.credits-=upgrade.cost;campaign.upgrades[id]=true;saveCampaign();renderDepot();showMessage(`${upgrade.name} installed for the next shift.`);beep(530,.16,"triangle",.05);}

  function resetGame() {
    simulation.reset();
    const contract=Contracts.getContract(campaign.settings.contractId);
    const shiftSeed=SHIFT_SEED+campaign.shifts*7919+contract.seedOffset;
    const assists={relaxedClock:campaign.settings.relaxedClock,handlingAssist:campaign.settings.handlingAssist,lightTraffic:campaign.settings.lightTraffic,reducedShake:campaign.settings.reducedShake,highContrast:campaign.settings.highContrast};
    const duration=SHIFT_DURATION+(assists.relaxedClock?120:0)+contract.extraSeconds;
    game = {
      phase: "READY",
      seed: shiftSeed,
      rngState: shiftSeed,
      persisted: false,
      events: [],
      metrics: { firstMovement: null, frameCount: 0, totalFrameMs: 0, worstFrameMs: 0, longFrames: 0, simulationSteps: 0, droppedSimulationMs: 0 },
      time: duration,
      duration,
      assists,
      contract,
      score: 0,
      complaints: 0,
      spills: 0,
      jobSpills: contract.initialSpills.length,
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
      spillZones: Contracts.prepareSpills(contract.id),
      phaseBeforePause: "DRIVE",
      mode: "truck",
      cameraX: 0,
      shake: 0,
      truck: { x: 112, y: 305, angle: 0, speed: 0, stun: 0, collisionCooldown: 0 },
      worker: { x: 64, y: 305, angle: 0, grabbedStop: null, grabbedWaste: null, carryStress: 0, lastMoveAngle: 0, stumble: 0, collisionCooldown: 0 },
      stops: Contracts.prepareStops(stopsTemplate,contract.id).map(s => ({ ...s, history: campaign.addressHistory[s.id]||null, binX: s.x, binY: s.y, binReturned: false, state: "waiting", authorized: false, revealed: false, wobble: randomSeeded(s.id+campaign.shifts*13+contract.seedOffset) * 6 })),
      waste: Contracts.prepareWaste(wasteTemplate,contract.id).map(w => ({ ...w, state: "waiting", integrity: 1, angle: w.type === "bulk" ? -.08 : 0 })),
      traffic: Contracts.prepareTraffic(trafficTemplate,contract.id).filter((_,index)=>!assists.lightTraffic||index%2===0),
      obstacles: obstacleTemplate.map(o => ({ ...o }))
    };
    ui.start.classList.remove("hidden");
    ui.decision.classList.add("hidden");
    ui.result.classList.add("hidden");
    ui.pause.classList.add("hidden");
    renderDepot();
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
    game.events.push({ type, at: Number((game.duration - game.time).toFixed(2)), ...details });
  }
  function transitionStop(stop, nextState) {
    if (Rules.canTransitionStop(stop.state, nextState)) {
      const previousState = stop.state;
      stop.state = nextState;
      recordEvent("stop_state_changed", { stopId: stop.id, from: previousState, to: nextState });
      return true;
    }
    recordEvent("invalid_stop_transition", { stopId: stop.id, from: stop.state, to: nextState });
    showMessage(`Dispatch blocked an invalid ${stop.state} → ${nextState} stop update.`);
    return false;
  }

  function ensureAudio() {
    if (audio) { if (audio.context.state === "suspended") audio.context.resume().catch(()=>{}); return audio; }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      const context = new AudioContext();
      const master = context.createGain();
      const vehicle = context.createGain();
      const street = context.createGain();
      const effects = context.createGain();
      vehicle.connect(master); street.connect(master); effects.connect(master); master.connect(context.destination);

      const engineGain = context.createGain();
      const engineFilter = context.createBiquadFilter();
      engineFilter.type = "lowpass"; engineFilter.frequency.value = 230;
      const engine = context.createOscillator(); engine.type = "sawtooth"; engine.frequency.value = 42;
      const engineSub = context.createOscillator(); engineSub.type = "triangle"; engineSub.frequency.value = 21;
      engine.connect(engineFilter); engineSub.connect(engineFilter); engineFilter.connect(engineGain).connect(vehicle); engineGain.gain.value = 0;
      engine.start(); engineSub.start();

      const compactorGain = context.createGain();
      const compactorFilter = context.createBiquadFilter(); compactorFilter.type="lowpass";compactorFilter.frequency.value=150;
      const compactor = context.createOscillator(); compactor.type="square";compactor.frequency.value=31;
      compactor.connect(compactorFilter).connect(compactorGain).connect(vehicle);compactorGain.gain.value=0;compactor.start();

      const noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const noise=noiseBuffer.getChannelData(0);for(let i=0;i<noise.length;i++)noise[i]=(Math.random()*2-1)*.55;
      const wind=context.createBufferSource();wind.buffer=noiseBuffer;wind.loop=true;
      const windFilter=context.createBiquadFilter();windFilter.type="bandpass";windFilter.frequency.value=520;windFilter.Q.value=.45;
      const windGain=context.createGain();windGain.gain.value=0;wind.connect(windFilter).connect(windGain).connect(street);wind.start();
      const hum=context.createOscillator();hum.type="sine";hum.frequency.value=58;
      const humGain=context.createGain();humGain.gain.value=0;hum.connect(humGain).connect(street);hum.start();

      audio={context,buses:{master,vehicle,street,effects},nodes:{engine,engineSub,engineFilter,engineGain,compactorGain,windGain,humGain},reverseTimer:0,brakeTimer:0,footstepTimer:0,trafficTimer:0,neighborhoodTimer:7};
      ui.audioStatus.textContent="Active // 3 buses";
      syncAudioMix();
      return audio;
    } catch (_) { ui.audioStatus.textContent="Audio unavailable // game unaffected";return null; }
  }

  function syncAudioMix() {
    if (!audio) return;
    const now=audio.context.currentTime;
    audio.buses.master.gain.setTargetAtTime(muted?0:1,now,.025);
    audio.buses.vehicle.gain.setTargetAtTime(Number(ui.vehicleVolume.value)/100,now,.025);
    audio.buses.street.gain.setTargetAtTime(Number(ui.streetVolume.value)/100,now,.025);
    audio.buses.effects.gain.setTargetAtTime(Number(ui.effectsVolume.value)/100,now,.025);
  }

  function beep(frequency = 220, duration = .08, type = "square", volume = .035, bus = "effects") {
    if (muted) return;
    const system=ensureAudio();if(!system)return;
    try {
      const oscillator = system.context.createOscillator();
      const gain = system.context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(Math.max(.0001,volume), system.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, system.context.currentTime + duration);
      oscillator.connect(gain).connect(system.buses[bus]||system.buses.effects);
      oscillator.start(); oscillator.stop(system.context.currentTime + duration);
    } catch (_) { /* Audio remains optional. */ }
  }

  function updateAudio(dt){
    if(!audio||!game)return;
    const now=audio.context.currentTime;const active=!["READY","RESULT","PAUSED"].includes(game.phase);const speed=Math.abs(game.truck.speed);
    audio.nodes.engine.frequency.setTargetAtTime(40+speed*.72,now,.06);audio.nodes.engineSub.frequency.setTargetAtTime(20+speed*.34,now,.08);audio.nodes.engineFilter.frequency.setTargetAtTime(175+speed*2.3,now,.08);
    audio.nodes.engineGain.gain.setTargetAtTime(active?(.018+speed*.00022):0,now,.12);
    audio.nodes.compactorGain.gain.setTargetAtTime(game.phase==="COMPACT"?.055:0,now,.035);
    audio.nodes.windGain.gain.setTargetAtTime(active?.038:0,now,.35);audio.nodes.humGain.gain.setTargetAtTime(active?.006:0,now,.4);

    audio.reverseTimer-=dt;if(active&&game.mode==="truck"&&game.truck.speed<-8&&audio.reverseTimer<=0){beep(860,.09,"square",.045,"vehicle");audio.reverseTimer=.52;}
    audio.brakeTimer-=dt;const braking=game.mode==="truck"&&((game.truck.speed>18&&held("reverse"))||(game.truck.speed<-18&&held("forward")));if(active&&braking&&audio.brakeTimer<=0){beep(118,.11,"sawtooth",.018,"vehicle");audio.brakeTimer=.28;}
    const walking=game.mode==="foot"&&game.phase==="DRIVE"&&(held("forward")||held("reverse")||held("left")||held("right"));
    audio.footstepTimer-=dt;if(walking&&audio.footstepTimer<=0){beep(game.worker.grabbedWaste?82:96,.045,"triangle",.012,"effects");audio.footstepTimer=game.worker.grabbedWaste?.42:.31;}
    audio.trafficTimer-=dt;if(active&&audio.trafficTimer<=0){const near=game.traffic.some(car=>Math.hypot(car.x-actorPosition().x,car.y-actorPosition().y)<105);if(near){beep(72,.18,"sine",.011,"street");audio.trafficTimer=.7;}}
    audio.neighborhoodTimer-=dt;if(active&&audio.neighborhoodTimer<=0){beep(245,.28,"sine",.006,"street");setTimeout(()=>beep(205,.32,"sine",.005,"street"),170);audio.neighborhoodTimer=9+Math.random()*7;}
  }

  function startGame() {
    if (game.phase !== "READY") return;
    ensureAudio();
    simulation.reset();
    last = performance.now();
    game.phase = "DRIVE";
    recordEvent("shift_started", { seed: game.seed, contract: game.contract.id });
    ui.start.classList.add("hidden");
    setStatus(`${game.contract.name}: follow the amber arrow, stop near a curb, and press ${keyLabel("cab")} to exit.`);
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
      if (["collected", "tagged", "loading", "awaiting-waste"].includes(stop.state) || stop.binReturned) continue;
      const distance = Math.hypot(stop.binX - origin.x, stop.binY - origin.y);
      if (distance < bestDistance) { best = stop; bestDistance = distance; }
    }
    return { stop: best, distance: bestDistance };
  }

  function nearestWaste(origin = actorPosition()) {
    let best = null, bestDistance = Infinity;
    for (const waste of game.waste) {
      if (!["ready", "dropped"].includes(waste.state)) continue;
      const distance = Math.hypot(waste.x - origin.x, waste.y - origin.y);
      if (distance < bestDistance) { best = waste; bestDistance = distance; }
    }
    return { waste: best, distance: bestDistance };
  }

  function inspectStop() {
    if (game.phase !== "DRIVE") return;
    if (game.mode !== "foot") { showMessage(`Stop the truck and press ${keyLabel("cab")} to step out at the curb.`); return; }
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
    const contents = uncertain
      ? "The bags are sealed and unusually rigid. You can make the call now, or spend five seconds checking beneath the top bag."
      : stop.contaminated
        ? "Prohibited material is visible. Collecting saves the stop but causes a contamination violation."
        : "Contents look acceptable. Load it, or leave it behind and take a missed-pickup complaint.";
    const history=stop.history;const note=history?(history.lastOutcome.includes("complaint")||history.lastOutcome==="missed"?` Depot note: this address has ${history.complaints} prior complaint${history.complaints===1?"":"s"}; document the outcome.`:` Crew memory: ${history.visits} prior visit${history.visits===1?"":"s"}, last outcome ${history.lastOutcome.replaceAll("-"," ")}.`):" First recorded visit for this crew.";
    ui.decisionText.textContent=contents+note;
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
    if (!transitionStop(stop, "authorized")) return;
    ui.decision.classList.add("hidden");
    stop.authorized = true;
    for (const waste of game.waste.filter(w => w.stopId === stop.id)) waste.state = "ready";
    game.phase = "DRIVE";
    game.activeStop = null;
    recordEvent("service_authorized", { stopId: stop.id });
    showMessage(`Pickup approved. Press ${keyLabel("grab")} to grab the bin and wheel it to the rear hopper.`, 3.2);
    beep(150, .14, "square");
  }

  function beginBinLoad(stop) {
    if (usedCapacity() + stop.weight > capacityLimit()) {
      showMessage("Hopper is full. Drop the bin and compact before loading.");
      beep(110, .18, "sawtooth");
      return;
    }
    if (!transitionStop(stop, "loading")) return;
    game.worker.grabbedStop = null;
    game.phase = "LOAD";
    game.loading = { stop, progress: 0, balance: (random() - .5) * .2, drift: (random() - .5) * .5, driftTimer: .7, drops: 0 };
    game.truck.speed = 0;
    beep(150, .14, "square");
  }

  function finishLoad() {
    const stop = game.loading.stop;
    const hopper = hopperPosition();
    if (!transitionStop(stop, "empty")) return;
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
    if (!transitionStop(stop, "awaiting-waste")) return;
    stop.binReturned = true;
    stop.binX = stop.x;
    stop.binY = stop.y;
    game.worker.grabbedStop = null;
    recordEvent("bin_returned", { stopId: stop.id });
    finalizeStopIfComplete(stop);
  }

  function finalizeStopIfComplete(stop) {
    const remaining = game.waste.filter(w => w.stopId === stop.id && !["loaded", "tagged"].includes(w.state));
    if (!stop.binReturned) {
      showMessage("Extra curb waste handled. Empty and return this address's bin to finish service.");
      return;
    }
    if (remaining.length) {
      showMessage(`Bin returned. ${remaining.map(w => w.label.toLowerCase()).join(" and ")} still waiting at this address.`);
      return;
    }
    if (!transitionStop(stop, "collected")) return;
    game.collected += 1;
    const familiarityBonus=Math.min(30,(stop.history?.cleanStreak||0)*5);game.score += 120+familiarityBonus;
    recordEvent("stop_collected", { stopId: stop.id });
    showMessage(`${stop.label} fully serviced. +${120+familiarityBonus}${familiarityBonus?" familiarity":""}`);
    beep(420, .1, "sine");
    checkRouteEnd();
  }

  function tagActive() {
    const stop = game.activeStop;
    if (game.phase !== "INSPECT" || !stop) return;
    if (!transitionStop(stop, "tagged")) return;
    for (const waste of game.waste.filter(w => w.stopId === stop.id)) waste.state = "tagged";
    game.tagged += 1;
    recordEvent("stop_tagged", { stopId: stop.id, contaminated: stop.contaminated });
    if (stop.contaminated) {
      game.score += 70;
      showMessage("Correctly tagged contamination. +70");
      beep(520, .09, "sine");
    } else {
      game.complaints += 1;
      const repeatPenalty=Math.min(30,(stop.history?.complaints||0)*10);game.score -= 60+repeatPenalty;
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
      if (game.worker.grabbedStop || game.worker.grabbedWaste) { showMessage("Set down what you're carrying before using the compactor controls."); return; }
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
    else if (unresolved() === 0) showMessage(`Stops cleared. Clean ${uncleanedSpills()} spill${uncleanedSpills() === 1 ? "" : "s"} with ${keyLabel("cleanup")} to close the route.`);
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
    if (game.mode !== "foot") { showMessage(`Stop nearby and press ${keyLabel("cab")}—the cleanup kit is worked on foot.`); return; }
    if (game.worker.grabbedStop || game.worker.grabbedWaste) { showMessage("Set down what you're carrying before opening the cleanup kit."); return; }
    const { spill, distance } = nearestSpill();
    if (!spill || distance > 48) { showMessage("Walk closer to the spill before using the cleanup kit."); return; }
    spill.cleaned = true;
    game.cleanedSpills += 1;
    game.time = Math.max(0, game.time - 3);
    game.score += 40;
    const rupturedWaste = spill.wasteId ? game.waste.find(w => w.id === spill.wasteId) : null;
    if (rupturedWaste) {
      rupturedWaste.state = "dropped";
      rupturedWaste.integrity = 1;
      rupturedWaste.x = spill.x + 8;
      rupturedWaste.y = spill.y;
      recordEvent("bag_recovered", { wasteId: rupturedWaste.id, timeCost: 3 });
      showMessage(`Debris gathered into a replacement bag. Pick it up with ${keyLabel("grab")}. +40 · 3 seconds used`);
    } else {
      recordEvent("spill_cleaned", { timeCost: 3 });
      showMessage("Street cleared with the spill kit. +40 · 3 seconds used");
    }
    beep(470, .12, "sine");
    if (game.time <= 0) finishGame(true); else checkRouteEnd();
  }

  function finishGame(timedOut) {
    if (game.phase === "RESULT") return;
    const missed = unresolved();
    const dirtyStreet = uncleanedSpills();
    game.complaints += missed + dirtyStreet;
    const correctTags = game.stops.filter(s => s.state === "tagged" && s.contaminated).length;
    const compactions = game.events.filter(e => e.type === "compactor_cycled").length;
    const loadedBags = game.waste.filter(w => w.state === "loaded" && w.type === "bag").length;
    const loadedBulk = game.waste.filter(w => w.state === "loaded" && w.type === "bulk").length;
    const familiarityBonus=game.stops.filter(s=>s.state==="collected").reduce((sum,s)=>sum+Math.min(30,(s.history?.cleanStreak||0)*5),0);
    const wrongTagPenalty=game.stops.filter(s=>s.state==="tagged"&&!s.contaminated).reduce((sum,s)=>sum+60+Math.min(30,(s.history?.complaints||0)*10),0);
    const scored=Rules.scoreShift({collected:game.collected,correctTags,familiarityBonus,compactions,cleanedSpills:game.cleanedSpills,loadedBags,loadedBulk,timeRemaining:game.time,wrongTagPenalty,badLoads:game.badLoads,missed,handlingDrops:game.handlingDrops,spills:game.spills,damage:game.damage,workerStumbles:game.workerStumbles});
    const scoreLines=scored.lines;
    game.score=scored.score;
    game.phase = "RESULT";
    recordEvent("shift_finished", { timedOut, score: game.score, complaints: game.complaints });
    persistShift();
    ui.decision.classList.add("hidden");
    ui.resultTitle.textContent = timedOut ? "Shift clock expired" : (game.complaints === 0 ? "Clean route" : "Route closed");
    ui.resultSummary.textContent = game.complaints === 0
      ? "Maple Street is clear, the hopper is under control, and dispatch has nothing to complain about."
      : `The route is closed with ${game.complaints} complaint${game.complaints === 1 ? "" : "s"}. The town will remember what happened here.`;
    ui.resultSummary.textContent+=` Depot credited $${game.earnings} to the crew budget.`;
    ui.resultStats.innerHTML = [
      ["Score", game.score], ["Collected", `${game.collected}/${TOTAL_STOPS}`],
      ["Correct tags", game.stops.filter(s => s.state === "tagged" && s.contaminated).length],
      ["Handling slips", game.handlingDrops], ["Waste loaded", `${loadedBags+loadedBulk}/${game.waste.length}`], ["Traffic stumbles", game.workerStumbles], ["Spills cleaned", `${game.cleanedSpills}/${game.spills+game.jobSpills}`], ["Truck damage", game.damage], ["Time left", `${Math.ceil(game.time)}s`],
      ["Contract", game.contract.name], ["Credits earned", `$${game.earnings}`], ["Town trust", campaign.trust], ["Assists", activeAssistNames().length], ["Shift seed", game.seed], ["Events logged", game.events.length]
    ].map(([a, b]) => `<span><b>${a}</b><br>${b}</span>`).join("");
    ui.resultLedger.innerHTML = scoreLines.filter(line => line[1] !== 0).map(([label, value]) =>
      `<div class="${value < 0 ? "negative" : "positive"}"><span>${label}</span><b>${value > 0 ? "+" : ""}${value}</b></div>`
    ).join("");
    ui.playtestReport.textContent=buildPlaytestReport(timedOut);
    ui.result.classList.remove("hidden");
    setStatus("Shift filed. Press Enter or Return to depot.");
    beep(game.complaints ? 170 : 560, .35, "triangle", .06);
  }

  function endShiftEarly(){if(!game||["READY","RESULT"].includes(game.phase))return;keys.clear();ui.pause.classList.add("hidden");finishGame(false);}

  function persistShift(){
    if(game.persisted)return;game.persisted=true;
    for(const stop of game.stops){
      campaign.addressHistory[stop.id]=Rules.updateAddressHistory(campaign.addressHistory[stop.id],stop);
    }
    const earned=Rules.calculateEarnings(game.score,game.contract.payoutMultiplier);game.earnings=earned;campaign.credits+=earned;campaign.shifts+=1;campaign.bestScore=Math.max(campaign.bestScore,game.score);campaign.trust=Rules.calculateTrust(campaign.trust,game.complaints);campaign.lastShift={contract:game.contract.name,contractId:game.contract.id,score:game.score,earned,complaints:game.complaints,at:new Date().toISOString()};saveCampaign();renderDepot();
  }

  function buildPlaytestReport(timedOut){
    const first=type=>{const event=game.events.find(item=>item.type===type);return event?`${event.at}s`:"—";};
    const resolved=game.events.filter(event=>["stop_collected","stop_tagged"].includes(event.type));
    const order=resolved.map(event=>stopsTemplate.find(stop=>stop.id===event.stopId)?.label||event.stopId).join(" → ")||"none";
    const averageFrame=game.metrics.frameCount?game.metrics.totalFrameMs/game.metrics.frameCount:0;
    const averageFps=averageFrame?Math.round(1000/averageFrame):0;
    const lines=[
      "MUNICIPAL GARBAGE CREW // PLAYTEST REPORT // BUILD 0.17.0",
      `Shift ${campaign.shifts} · ${game.contract.name} · pay ×${game.contract.payoutMultiplier.toFixed(2)} · seed ${game.seed} · ${timedOut?"clock expired":unresolved()?"ended early":"route complete"}`,
      `Assists: ${activeAssistNames().join(", ")||"none"}`,
      `Bindings: move ${["forward","left","reverse","right"].map(keyLabel).join("/")} · work ${keyLabel("work")} · grab ${keyLabel("grab")} · cab ${keyLabel("cab")} · tag ${keyLabel("tag")} · check ${keyLabel("inspect")} · compact ${keyLabel("compact")} · clean ${keyLabel("cleanup")} · brace ${keyLabel("brace")}`,
      `Elapsed: ${(game.duration-game.time).toFixed(1)}s / ${game.duration}s · score ${game.score} · complaints ${game.complaints}`,
      `First movement ${first("first_movement")} · cab exit ${first("cab_exited")} · inspection ${first("stop_inspected")} · resolution ${resolved[0]?`${resolved[0].at}s`:"—"}`,
      `Resolved ${TOTAL_STOPS-unresolved()}/${TOTAL_STOPS} · order: ${order}`,
      `Compactions ${game.events.filter(e=>e.type==="compactor_cycled").length} · collisions ${game.events.filter(e=>e.type==="collision").length} · handling slips ${game.handlingDrops}`,
      `Spills caused ${game.spills} · assigned ${game.jobSpills} · cleaned ${game.cleanedSpills}/${game.spills+game.jobSpills} · traffic stumbles ${game.workerStumbles} · truck damage ${game.damage}`,
      `Performance ${averageFps||"—"} fps avg · worst ${Math.round(game.metrics.worstFrameMs)}ms · slow frames ${game.metrics.longFrames}/${game.metrics.frameCount} · sim 60Hz/${game.metrics.simulationSteps} steps · dropped ${Math.round(game.metrics.droppedSimulationMs)}ms · view ${innerWidth}×${innerHeight}@${devicePixelRatio}`,
      `Credits +$${game.earnings} · trust ${campaign.trust} · upgrades ${UPGRADES.filter(u=>campaign.upgrades[u.id]).map(u=>u.name).join(", ")||"none"}`
    ];return lines.join("\n");
  }

  function update(dt) {
    if (!game) return;
    updateAudio(dt);
    if (game.phase === "READY" || game.phase === "RESULT" || game.phase === "PAUSED") return;
    game.time = Math.max(0, game.time - dt);
    game.messageTime = Math.max(0, game.messageTime - dt);
    game.compactorCooldown = Math.max(0, game.compactorCooldown - dt);
    game.shake = Math.max(0, game.shake - dt);
    if (game.time <= 0) { finishGame(true); return; }

    updateTraffic(dt);
    updateParticles(dt);
    updateCamera(dt);
    if (game.phase === "LOAD") {
      updateHandling(dt);
      return;
    }
    if (game.phase !== "DRIVE") return;
    if (game.mode === "truck") {
      updateTruck(dt);
      checkCollisions();
      checkWasteCollisions();
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
      w.x = Math.max(24, Math.min(WORLD_W - 24, hopper.x));
      w.y = Math.max(158, Math.min(442, hopper.y + 26));
      w.angle = t.angle;
      game.mode = "foot";
      t.speed = 0;
      recordEvent("cab_exited");
      showMessage(`On foot. Walk to a bin and press ${keyLabel("work")} to inspect it.`);
      beep(260, .06, "square");
      return;
    }
    if (w.grabbedStop || w.grabbedWaste) { showMessage("Set down what you're carrying with E before entering the cab."); return; }
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
    if (w.grabbedWaste) {
      const waste = game.waste.find(item => item.id === w.grabbedWaste);
      w.grabbedWaste = null;
      w.carryStress = 0;
      if (waste) {
        waste.state = "dropped";
        const moving = held("forward") || held("reverse") || held("left") || held("right");
        if (waste.fragile && moving) waste.integrity -= .62;
        recordEvent("waste_dropped", { wasteId: waste.id, hard: moving, integrity: Number(waste.integrity.toFixed(2)) });
        if (waste.integrity <= .45) ruptureWaste(waste);
        else showMessage(`${waste.label} set down${moving ? " hard" : ""}.`, 1.4);
      }
      return;
    }
    const nearbyWaste = nearestWaste(w);
    if (nearbyWaste.waste && nearbyWaste.distance <= 42) {
      const waste = nearbyWaste.waste;
      w.grabbedWaste = waste.id;
      w.carryStress = waste.type === "bulk" ? .18 : 0;
      waste.state = "carried";
      recordEvent("waste_grabbed", { wasteId: waste.id, type: waste.type });
      showMessage(waste.type === "bulk" ? `Awkward load—hold ${keyLabel("brace")} to brace it while moving.` : "Fragile bag—stop moving before you set it down.", 2.8);
      beep(waste.type === "bulk" ? 135 : 190, .08, "square");
      return;
    }
    const { stop, distance } = nearestStop(w);
    if (!stop || distance > 38) { showMessage("No serviceable bin within reach."); return; }
    if (stop.state === "waiting") { showMessage(`Inspect this stop with ${keyLabel("work")} before moving its bin.`); return; }
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
    if (w.grabbedWaste) {
      const waste = game.waste.find(item => item.id === w.grabbedWaste);
      const hopper = hopperPosition();
      if (waste && Math.hypot(waste.x - hopper.x, waste.y - hopper.y) <= 58) loadWaste(waste);
      else showMessage("Carry the item closer to the rear hopper.");
      return;
    }
    if (!w.grabbedStop) {
      const nearbyWaste = nearestWaste(w);
      if (nearbyWaste.waste && nearbyWaste.distance <= 42) { showMessage(`Press ${keyLabel("grab")} to pick up this curbside item.`); return; }
      inspectStop(); return;
    }
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

  function loadWaste(waste) {
    if (usedCapacity() + waste.weight > capacityLimit()) { showMessage("Hopper is full. Set this down and compact first."); beep(110,.18,"sawtooth"); return; }
    waste.state = "loaded";
    game.worker.grabbedWaste = null;
    game.worker.carryStress = 0;
    game.loose += waste.weight;
    game.score += waste.type === "bulk" ? 55 : 35;
    recordEvent("waste_loaded", { wasteId: waste.id, type: waste.type, weight: waste.weight });
    showMessage(`${waste.label} loaded. +${waste.type === "bulk" ? 55 : 35}`);
    beep(waste.type === "bulk" ? 115 : 240, .14, "square");
    const stop = game.stops.find(s => s.id === waste.stopId);
    if (stop) finalizeStopIfComplete(stop);
  }

  function ruptureWaste(waste) {
    waste.state = "ruptured";
    game.worker.grabbedWaste = null;
    game.worker.carryStress = 0;
    game.spills += 1;
    game.score -= 70;
    game.spillZones.push({ x: waste.x, y: waste.y, cleaned: false, wasteId: waste.id });
    recordEvent("bag_ruptured", { wasteId: waste.id });
    for (let i=0;i<12;i++) game.particles.push({x:waste.x,y:waste.y,vx:(random()-.5)*90,vy:(random()-.5)*90,life:4+random()*2,size:3+random()*5});
    game.shake=.35;
    showMessage("The bag split open. Use X nearby to gather and re-bag the debris.",3.2);
    beep(88,.24,"sawtooth",.06);
  }

  function updateWorker(dt) {
    const w = game.worker;
    w.stumble = Math.max(0, w.stumble - dt);
    w.collisionCooldown = Math.max(0, w.collisionCooldown - dt);
    if (w.stumble > 0) return;
    const dx = (held("right") ? 1 : 0) - (held("left") ? 1 : 0);
    const dy = (held("reverse") ? 1 : 0) - (held("forward") ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1;
    const carriedWaste = game.waste.find(item => item.id === w.grabbedWaste);
    const braced = held("brace");
    const speed = w.grabbedStop ? 62 : carriedWaste?.type === "bulk" ? (braced ? 34 : 46) : carriedWaste ? 60 : 82;
    if (dx || dy) {
      if(game.metrics.firstMovement===null){game.metrics.firstMovement=Number((game.duration-game.time).toFixed(2));recordEvent("first_movement",{mode:"foot"});}
      const nextAngle = Math.atan2(dy, dx);
      if (carriedWaste?.type === "bulk") {
        let turn = Math.abs(nextAngle - w.lastMoveAngle);
        if (turn > Math.PI) turn = Math.PI * 2 - turn;
        if (turn > 1.7) w.carryStress += braced ? .05 : (game.assists.handlingAssist ? .15 : .24);
        w.carryStress += dt * (braced ? -.22 : (game.assists.handlingAssist ? .15 : .23));
      }
      w.angle = nextAngle;
      w.lastMoveAngle = nextAngle;
      w.x = Math.max(22, Math.min(WORLD_W - 22, w.x + dx / length * speed * dt));
      w.y = Math.max(157, Math.min(443, w.y + dy / length * speed * dt));
    } else if (carriedWaste?.type === "bulk") w.carryStress -= dt * .38;
    w.carryStress = Math.max(0, Math.min(1.08, w.carryStress));
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
    if (carriedWaste) {
      const reach = carriedWaste.type === "bulk" ? 34 : 20;
      const sway = carriedWaste.type === "bulk" ? Math.sin(performance.now()/105) * w.carryStress * 13 : 0;
      const targetX = w.x + Math.cos(w.angle) * reach - Math.sin(w.angle) * sway;
      const targetY = w.y + Math.sin(w.angle) * reach + Math.cos(w.angle) * sway;
      const follow = 1 - Math.pow(carriedWaste.type === "bulk" ? .02 : .001, dt);
      carriedWaste.x += (targetX - carriedWaste.x) * follow;
      carriedWaste.y += (targetY - carriedWaste.y) * follow;
      carriedWaste.angle = w.angle + (carriedWaste.type === "bulk" ? Math.sin(performance.now()/105) * w.carryStress * .35 : 0);
      if (carriedWaste.type === "bulk" && w.carryStress >= 1) {
        carriedWaste.state = "dropped";
        w.grabbedWaste = null;
        w.carryStress = 0;
        game.handlingDrops += 1;
        game.score -= 20;
        game.time = Math.max(0, game.time - 1);
        recordEvent("bulk_slipped", { wasteId: carriedWaste.id });
        showMessage(`${carriedWaste.label} twisted out of your hands. Brace with ${keyLabel("brace")} and take wider turns.`);
        beep(105,.16,"sawtooth");
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
        w.x = Math.max(24, Math.min(WORLD_W - 24, w.x - Math.sign(car.vx || 0) * 30));
        w.y = Math.max(157, Math.min(443, w.y - Math.sign(car.vy || 0) * 30));
        if (w.grabbedStop) {
          recordEvent("bin_dropped_in_traffic", { stopId: w.grabbedStop });
          w.grabbedStop = null;
        }
        if (w.grabbedWaste) {
          const waste = game.waste.find(item => item.id === w.grabbedWaste);
          w.grabbedWaste = null;
          w.carryStress = 0;
          if (waste) {
            waste.state = "dropped";
            if (waste.fragile) { waste.integrity = 0; ruptureWaste(waste); }
            else recordEvent("bulk_dropped_in_traffic", { wasteId: waste.id });
          }
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

  function checkWasteCollisions() {
    const t=game.truck;
    if(t.collisionCooldown>0||Math.abs(t.speed)<14)return;
    for(const waste of game.waste){
      if(!["ready","dropped"].includes(waste.state))continue;
      const radius=waste.type==="bulk"?38:22;
      if(Math.hypot(t.x-waste.x,t.y-waste.y)>=radius+22)continue;
      t.collisionCooldown=1.1;t.speed*=.22;game.shake=.4;
      if(waste.fragile){
        waste.integrity=0;recordEvent("bag_run_over",{wasteId:waste.id});ruptureWaste(waste);
        showMessage("The truck crushed a curbside bag. Get out and clean up the debris.");
      }else{
        waste.x=Math.max(30,Math.min(WORLD_W-30,waste.x+Math.cos(t.angle)*48));
        waste.y=Math.max(165,Math.min(435,waste.y+Math.sin(t.angle)*48));
        game.damage+=1;game.score-=45;
        recordEvent("bulk_item_struck",{wasteId:waste.id});
        showMessage(`${waste.label} caught under the truck. It moved, and the bodywork did not enjoy it.`);
        beep(70,.28,"sawtooth",.065);
      }
      break;
    }
  }

  function updateHandling(dt) {
    const load = game.loading;
    if (!load) return;
    load.driftTimer -= dt;
    if (load.driftTimer <= 0) {
      load.drift = (random() - .5) * 1.15 * (game.assists.handlingAssist ? .72 : 1);
      load.driftTimer = .55 + random() * .65;
    }
    const control = (held("right") ? 1 : 0) - (held("left") ? 1 : 0);
    load.balance += (load.drift + control * (game.assists.handlingAssist?1.95:1.75)) * dt;
    load.balance *= Math.pow(.985, dt * 60);
    if (held("work")) {
      const stability = Math.max(game.assists.handlingAssist ? .28 : .18, 1 - Math.abs(load.balance) * .72);
      load.progress = Math.min(1, load.progress + dt * .48 * (campaign.upgrades.hydraulicAssist?1.28:1) * stability);
    }
    if (Math.abs(load.balance) > (game.assists.handlingAssist?1.18:1.05)) {
      load.drops += 1;
      game.handlingDrops += 1;
      game.score -= 20;
      load.progress = Math.max(0, load.progress - .18);
      load.balance = -Math.sign(load.balance) * .24;
      load.drift *= -.35;
      game.shake = .32;
      recordEvent("bin_slipped", { stopId: load.stop.id, progress: Number(load.progress.toFixed(2)) });
      showMessage(`Bin slipped—counter with ${keyLabel("left")}/${keyLabel("right")} and keep holding ${keyLabel("work")}.`, 1.7);
      beep(105, .16, "sawtooth");
    }
    if (load.progress >= 1) finishLoad();
  }

  function updateTruck(dt) {
    const t = game.truck;
    t.stun = Math.max(0, t.stun - dt);
    t.collisionCooldown = Math.max(0, t.collisionCooldown - dt);
    if (t.stun > 0) { t.speed *= Math.pow(.1, dt); return; }
    const forward = held("forward");
    const reverse = held("reverse");
    const left = held("left");
    const right = held("right");
    if((forward||reverse)&&game.metrics.firstMovement===null){game.metrics.firstMovement=Number((game.duration-game.time).toFixed(2));recordEvent("first_movement",{mode:"truck"});}
    if (forward) t.speed += 115 * (campaign.upgrades.winterTires?1.1:1) * dt;
    if (reverse) t.speed -= 92 * dt;
    if (!forward && !reverse) t.speed *= Math.pow(.16, dt);
    t.speed = Math.max(-58, Math.min(112, t.speed));
    const steer = (right ? 1 : 0) - (left ? 1 : 0);
    if (Math.abs(t.speed) > 3) t.angle += steer * 1.85 * (campaign.upgrades.winterTires?1.12:1) * dt * Math.sign(t.speed) * Math.min(1, Math.abs(t.speed) / 40);
    const nx = t.x + Math.cos(t.angle) * t.speed * dt;
    const ny = t.y + Math.sin(t.angle) * t.speed * dt;
    if (isTruckRoad(nx,ny)) { t.x = nx; t.y = ny; }
    else { t.speed *= -.18; game.shake = .16; }
  }

  function isTruckRoad(x,y){if(x<=52||x>=WORLD_W-52||y<=52||y>=H-52)return false;const horizontal=y>225&&y<375;const cross=Math.abs(x-W)<40||Math.abs(x-W*2)<40;return horizontal||cross;}

  function updateTraffic(dt) {
    for (const car of game.traffic) {
      if(car.axis==="y"){
        car.y += car.vy * dt;
        if(car.vy>0&&car.y>H+45)car.y=-45;
        if(car.vy<0&&car.y<-45)car.y=H+45;
      }else{
        car.x += car.vx * dt;
        if (car.vx > 0 && car.x > WORLD_W + 45) car.x = -45;
        if (car.vx < 0 && car.x < -45) car.x = WORLD_W + 45;
      }
    }
  }

  function updateCamera(dt){const target=Math.max(0,Math.min(WORLD_W-W,actorPosition().x-W*.5));const follow=1-Math.pow(.00004,dt);game.cameraX+=(target-game.cameraX)*follow;}

  function checkCollisions() {
    const t = game.truck;
    if (t.collisionCooldown > 0) return;
    const obstacles = [
      ...game.traffic.map(c => ({ x: c.x, y: c.y, r: 10, moving: true })),
      ...game.obstacles.map(o=>({x:o.x,y:o.y,r:o.r,moving:false,type:o.type}))
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
        showMessage(o.moving ? "Traffic collision! Truck damage recorded." : o.type==="barrier" ? "Roadwork barrier clipped. Change lanes through the chicane." : "Blocked curb clipped. Back out carefully.");
        beep(72, .3, "sawtooth", .07);
        if (game.loose > 1 && random() < (campaign.upgrades.winterTires?.28:.48)) createSpill();
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
    showMessage(`Loose load spilled. Stop nearby and press ${keyLabel("cleanup")} to deploy the cleanup kit.`);
  }

  function updateParticles(dt) {
    for (const p of game.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; p.life -= dt; }
    game.particles = game.particles.filter(p => p.life > 0);
  }

  function draw() {
    ctx.save();
    const shakeScale=game?.assists?.reducedShake ? .22 : 1;
    const shakeX = game?.shake ? (Math.random() - .5) * game.shake * 12 * shakeScale : 0;
    const shakeY = game?.shake ? (Math.random() - .5) * game.shake * 12 * shakeScale : 0;
    ctx.translate(shakeX, shakeY);
    ctx.save();
    ctx.translate(-(game?.cameraX||0),0);
    drawWorld();
    if (game) {
      drawStops();
      drawWaste();
      drawObstacles();
      drawSpills();
      drawParticles();
      drawTruck();
      drawWorker();
    }
    ctx.restore();
    if(game){
      drawWeather();
      drawNoirPass();
      drawHUD();
      drawRouteStrip();
      if (game.phase !== "READY" && game.phase !== "RESULT") drawRouteArrow();
    }
    ctx.restore();
  }

  function drawWorld() {
    ctx.fillStyle="#090d12";ctx.fillRect(0,0,WORLD_W,H);
    for(let block=0;block<3;block++){ctx.save();ctx.translate(block*W,0);drawWorldBlock(block);ctx.restore();}
    drawCrossStreet(W);drawCrossStreet(W*2);
    drawStreetSteam();
  }

  function drawWorldBlock(blockIndex) {
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
    const leftSigns=["NIGHT OWL DELI","MAPLE PAWN & LOAN","EAST END LAUNDRY"];
    const rightSigns=["BELLWETHER","BELLWETHER ARMS","24 HOUR MARKET"];
    ctx.fillStyle="#809255"; ctx.fillRect(16,112,150,24); ctx.fillStyle="#101510"; ctx.font="bold 11px Courier New"; ctx.fillText(leftSigns[blockIndex],24,128);
    ctx.fillStyle="#854532"; ctx.fillRect(692,112,126,23); ctx.fillStyle="#e7c68b"; ctx.fillText(rightSigns[blockIndex],701,127);
    ctx.fillStyle="rgba(7,10,13,.88)";ctx.fillRect(405,433,150,18);ctx.fillStyle="#a87637";ctx.font="bold 9px Courier New";ctx.textAlign="center";ctx.fillText(["WEST MAPLE","MAPLE CROSSING","EAST MAPLE"][blockIndex],480,445);ctx.textAlign="left";
  }

  function drawCrossStreet(x){ctx.fillStyle="#292d30";ctx.fillRect(x-52,0,104,H);ctx.fillStyle="#54504a";ctx.fillRect(x-52,0,5,H);ctx.fillRect(x+47,0,5,H);ctx.fillStyle="#11161b";ctx.fillRect(x-41,0,82,H);ctx.fillStyle="#74756f";for(let y=18;y<H;y+=74)ctx.fillRect(x-2,y,4,30);ctx.fillStyle="#aaa79b";for(let stripe=-35;stripe<=35;stripe+=14){ctx.fillRect(x+stripe,205,8,19);ctx.fillRect(x+stripe,378,8,19);}ctx.fillStyle="rgba(200,143,56,.12)";ctx.fillRect(x-38,240,76,7);}

  function drawStreetSteam(){const wave=Math.sin(performance.now()/520)*4;ctx.strokeStyle="rgba(174,181,177,.13)";ctx.lineWidth=7;for(let block=0;block<3;block++){for(const point of [[390+block*W,205],[658+block*W,416]]){const x=point[0],y=point[1];ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-6+wave,y-17,x+8-wave,y-28,x+4+wave,y-46);ctx.stroke();}}}

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

  function drawWaste() {
    const actor=actorPosition();
    for(const waste of game.waste){
      if(["waiting","loaded","tagged","ruptured"].includes(waste.state))continue;
      const near=game.mode==="foot"&&![game.worker.grabbedStop,game.worker.grabbedWaste].some(Boolean)&&Math.hypot(waste.x-actor.x,waste.y-actor.y)<=42;
      ctx.save();ctx.translate(waste.x,waste.y);ctx.rotate(waste.angle||0);
      if(near){ctx.strokeStyle="#e99b32";ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(0,0,waste.type==="bulk"?34:19,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      ctx.fillStyle="rgba(0,0,0,.5)";ctx.beginPath();ctx.ellipse(3,waste.type==="bulk"?13:9,waste.type==="bulk"?34:15,6,0,0,Math.PI*2);ctx.fill();
      if(waste.type==="bag"){
        ctx.fillStyle=waste.integrity<.7?"#72453a":"#252a2b";ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(-9,-8);ctx.lineTo(-4,-14);ctx.lineTo(0,-10);ctx.lineTo(5,-14);ctx.lineTo(10,-7);ctx.lineTo(13,10);ctx.closePath();ctx.fill();ctx.strokeStyle="#60615b";ctx.stroke();ctx.fillStyle="#9b6335";ctx.fillRect(-2,-14,5,4);
      }else if(waste.label.includes("SOFA")){
        ctx.fillStyle="#5b5148";ctx.fillRect(-34,-8,68,21);ctx.fillStyle="#76695c";ctx.fillRect(-25,-17,50,16);ctx.fillRect(-38,-12,12,25);ctx.fillRect(26,-12,12,25);ctx.fillStyle="#2d2b29";ctx.fillRect(-28,13,6,5);ctx.fillRect(22,13,6,5);ctx.strokeStyle="#a59a87";ctx.strokeRect(-34,-8,68,21);
      }else if(waste.label.includes("RADIATOR")){
        ctx.fillStyle="#4b504f";ctx.fillRect(-31,-12,62,24);ctx.strokeStyle="#969b94";ctx.lineWidth=2;ctx.strokeRect(-31,-12,62,24);for(let x=-25;x<29;x+=9){ctx.beginPath();ctx.moveTo(x,-9);ctx.lineTo(x,9);ctx.stroke();}ctx.fillStyle="#272b2a";ctx.fillRect(-27,12,8,5);ctx.fillRect(19,12,8,5);
      }else{
        ctx.fillStyle="#777269";ctx.fillRect(-34,-13,68,26);ctx.fillStyle="#4a4a47";ctx.fillRect(-30,-9,60,18);ctx.strokeStyle="#aaa392";ctx.lineWidth=2;ctx.strokeRect(-34,-13,68,26);ctx.strokeStyle="#6d685f";for(let x=-24;x<30;x+=12){ctx.beginPath();ctx.moveTo(x,-8);ctx.lineTo(x+7,8);ctx.stroke();}
      }
      if(near){ctx.rotate(-(waste.angle||0));ctx.fillStyle="rgba(8,10,12,.92)";ctx.fillRect(-48,-38,96,14);ctx.fillStyle="#e5ad58";ctx.font="bold 8px Courier New";ctx.textAlign="center";ctx.fillText(`${keyLabel("grab")} // ${waste.label}`,0,-28);ctx.textAlign="left";}
      ctx.restore();
    }
  }

  function drawObstacles() {
    for(const obstacle of game.obstacles){
      ctx.save();ctx.translate(obstacle.x,obstacle.y);
      if(obstacle.type==="barrier")drawRoadBarrier();else{ctx.rotate(obstacle.y<300?.05:-.04);drawCar("#746f61",1.15);}
      ctx.restore();
      ctx.fillStyle="rgba(8,10,12,.88)";ctx.fillRect(obstacle.x-48,obstacle.y-41,96,14);ctx.fillStyle="#d29035";ctx.font="bold 8px Courier New";ctx.textAlign="center";ctx.fillText(obstacle.label,obstacle.x,obstacle.y-31);ctx.textAlign="left";
    }
    for (const car of game.traffic) { ctx.save(); ctx.translate(car.x, car.y);if(car.axis==="y")ctx.rotate(Math.PI/2); drawCar(car.color, 1); ctx.restore(); }
  }

  function drawRoadBarrier(){ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(-30,12,60,8);ctx.fillStyle="#d0c6a7";ctx.fillRect(-30,-8,60,14);ctx.fillStyle="#a34d32";for(let x=-28;x<30;x+=18){ctx.beginPath();ctx.moveTo(x,-8);ctx.lineTo(x+10,-8);ctx.lineTo(x+2,6);ctx.lineTo(x-8,6);ctx.closePath();ctx.fill();}ctx.fillStyle="#232526";ctx.fillRect(-24,6,5,14);ctx.fillRect(19,6,5,14);ctx.fillStyle="#e79a31";ctx.fillRect(-4,-14,8,6);}

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
    if(w.grabbedStop||w.grabbedWaste){ctx.strokeStyle="#b7b09c";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,-4);ctx.lineTo(16,-1);ctx.moveTo(7,-4);ctx.lineTo(17,5);ctx.stroke();}
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
      ctx.fillStyle="rgba(8,10,12,.9)";ctx.fillRect(-35,-47,70,14);ctx.fillStyle=near?"#e9ad53":"#a85b4b";ctx.font="bold 9px Courier New";ctx.textAlign="center";ctx.fillText(near?`${keyLabel("cleanup")} // CLEAN`:(spill.job?"ASSIGNED DEBRIS":"ROAD HAZARD"),0,-37);ctx.textAlign="left";ctx.restore();
    }
  }

  function drawWeather(){
    const time=performance.now()*.045;
    ctx.strokeStyle="rgba(190,202,203,.22)";ctx.lineWidth=1;
    for(let i=0;i<52;i++){const x=(i*83+time*1.7)%1040-40;const y=(i*47+time*(.8+i%3*.18))%660-30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+12);ctx.stroke();}
    ctx.fillStyle="rgba(214,219,211,.28)";
    for(let i=0;i<18;i++){const x=(i*139+time*.23)%1000-20;const y=(i*71+time*.31)%630-15;ctx.fillRect(x,y,2,2);}
  }

  function drawNoirPass(){
    const vignette=ctx.createRadialGradient(W/2,H/2,170,W/2,H/2,610);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(.72,"rgba(0,0,0,.12)");vignette.addColorStop(1,"rgba(0,0,0,.62)");ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(7,11,14,.045)";for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);
  }

  function contextualPrompt() {
    if (game.phase === "COMPACT") return "COMPACTOR CYCLING — HOLD";
    if (game.phase === "LOAD") return `HOLD ${keyLabel("work")} · ${keyLabel("left")}/${keyLabel("right")} BALANCE THE BIN`;
    if (game.phase !== "DRIVE") return "";
    const nearbySpill = nearestSpill();
    if(game.mode==="truck") return Math.abs(game.truck.speed)>10?`BRAKE · ${keyLabel("cab")} TO EXIT CAB`:`${keyLabel("cab")} · EXIT CAB   ${keyLabel("compact")} · COMPACT`;
    const w=game.worker;
    if(nearbySpill.spill&&nearbySpill.distance<=48&&!w.grabbedStop&&!w.grabbedWaste)return`${keyLabel("cleanup")} · CLEAN SPILL`;
    if(w.grabbedWaste){const waste=game.waste.find(item=>item.id===w.grabbedWaste);const h=hopperPosition();if(waste&&Math.hypot(waste.x-h.x,waste.y-h.y)<=58)return`${keyLabel("work")} · LOAD ITEM`;return waste?.type==="bulk"?`HOLD ${keyLabel("brace")} · BRACE  /  TAKE WIDE TURNS`:"CARRY BAG TO REAR HOPPER";}
    if(w.grabbedStop){const stop=game.stops.find(s=>s.id===w.grabbedStop);if(stop?.state==="authorized"){const h=hopperPosition();return Math.hypot(stop.binX-h.x,stop.binY-h.y)<=48?`${keyLabel("work")} · LOAD HOPPER`:"WHEEL BIN TO REAR HOPPER";}if(stop?.state==="empty")return Math.hypot(stop.binX-stop.x,stop.binY-stop.y)<=42?`${keyLabel("work")} · RETURN BIN`:"WHEEL BIN TO AMBER MARKER";}
    const nearbyWaste=nearestWaste(w);if(nearbyWaste.waste&&nearbyWaste.distance<=42)return`${keyLabel("grab")} · GRAB ${nearbyWaste.waste.label}`;
    if(Math.hypot(w.x-game.truck.x,w.y-game.truck.y)<=60)return`${keyLabel("cab")} · ENTER CAB`;
    const nearbyStop = nearestStop(w);
    if(nearbyStop.stop&&nearbyStop.distance<=40)return nearbyStop.stop.state==="waiting"?`${keyLabel("work")} · INSPECT ${nearbyStop.stop.label.toUpperCase()}`:`${keyLabel("grab")} · GRAB BIN`;
    if (game.loose >= 3 && Math.abs(game.truck.speed) <= 18) return `${keyLabel("compact")} · COMPACT LOOSE LOAD`;
    return `${keyLabel("forward")}/${keyLabel("left")}/${keyLabel("reverse")}/${keyLabel("right")} / ARROWS · WALK   ${keyLabel("grab")} · GRAB/DROP`;
  }

  function drawHUD() {
    ctx.fillStyle="rgba(7,10,13,.91)";ctx.fillRect(18,16,924,72);ctx.strokeStyle="#4d4a42";ctx.lineWidth=1;ctx.strokeRect(18,16,924,72);ctx.fillStyle="#9a6128";ctx.fillRect(18,16,4,72);
    ctx.fillStyle="#6d726e";ctx.font="bold 9px Courier New";ctx.fillText("BSA // ROUTE 04",32,33);ctx.fillText("STOPS",179,33);ctx.fillText("HOPPER PRESSURE",300,33);ctx.fillText("SERVICE SCORE",716,33);ctx.fillText("CALLS",858,33);
    ctx.font="bold 26px Arial Narrow, Arial";ctx.fillStyle=game.time<30?"#c5523d":"#e9a040";ctx.fillText(`${Math.ceil(game.time)}`,32,66);ctx.font="bold 9px Courier New";ctx.fillStyle="#777b77";ctx.fillText("SECONDS",82,66);
    ctx.font="bold 23px Arial Narrow, Arial";ctx.fillStyle="#ddd8ca";ctx.fillText(`${TOTAL_STOPS-unresolved()}/${TOTAL_STOPS}`,179,66);ctx.fillText(`${game.score}`,716,66);ctx.fillText(`${game.complaints}`,858,66);
    const capacity=capacityLimit();ctx.fillStyle="#24292b";ctx.fillRect(300,49,360,20);ctx.strokeStyle="#535751";ctx.strokeRect(300,49,360,20);ctx.fillStyle=usedCapacity()>capacity*.85?"#a54131":"#7d8b4d";ctx.fillRect(303,52,354*Math.min(1,usedCapacity()/capacity),14);
    for(let x=306;x<654;x+=22){ctx.fillStyle="rgba(8,10,12,.22)";ctx.fillRect(x,52,2,14);}
    ctx.fillStyle="#d8d3c5";ctx.font="bold 9px Courier New";ctx.fillText(`${usedCapacity().toFixed(1)} / ${capacity.toFixed(1)} CU  //  LOOSE ${game.loose.toFixed(1)}`,312,64);
    if(game.compactorCooldown>0){ctx.fillStyle="#e99b32";ctx.fillText(`CYCLE ${game.compactorCooldown.toFixed(1)}S`,555,82);}
    const prompt = contextualPrompt();
    if(prompt){ctx.fillStyle="rgba(7,10,13,.9)";ctx.fillRect(310,100,340,28);ctx.strokeStyle="#5d4a32";ctx.strokeRect(310,100,340,28);ctx.fillStyle="#e2a34c";ctx.font="bold 10px Courier New";ctx.textAlign="center";ctx.fillText(prompt,480,118);ctx.textAlign="left";}
    if (game.phase === "LOAD" && game.loading) drawHandlingMeter();
    if(game.mode==="foot"&&game.worker.grabbedWaste&&game.waste.find(w=>w.id===game.worker.grabbedWaste)?.type==="bulk")drawCarryMeter();
    if(game.messageTime>0){ctx.fillStyle="rgba(7,10,13,.94)";ctx.fillRect(175,532,610,38);ctx.fillStyle="#8e5e31";ctx.fillRect(175,532,4,38);ctx.strokeStyle="#403d37";ctx.strokeRect(175,532,610,38);ctx.fillStyle="#d9d4c6";ctx.font="bold 11px Courier New";ctx.textAlign="center";ctx.fillText(`DISPATCH // ${game.message.toUpperCase()}`,480,555);ctx.textAlign="left";}
  }

  function drawHandlingMeter() {
    const load = game.loading;
    ctx.fillStyle="rgba(7,10,13,.95)";ctx.fillRect(275,468,410,52);ctx.strokeStyle="#514838";ctx.strokeRect(275,468,410,52);
    ctx.fillStyle="#8e9189";ctx.font="bold 9px Courier New";ctx.fillText("HYDRAULIC LIFT // LOAD BALANCE",290,485);ctx.fillText(`${Math.round(load.progress*100)}%`,642,485);
    ctx.fillStyle="#282d2e";ctx.fillRect(290,494,380,12);ctx.fillStyle=Math.abs(load.balance)>.78?"#b74534":"#7d8b4d";ctx.fillRect(478+load.balance*160,492,9,16);ctx.fillStyle="#e9a040";ctx.fillRect(480,494,3,12);
  }

  function drawCarryMeter(){const stress=game.worker.carryStress;ctx.fillStyle="rgba(7,10,13,.92)";ctx.fillRect(354,136,252,29);ctx.strokeStyle="#514838";ctx.strokeRect(354,136,252,29);ctx.fillStyle="#282d2e";ctx.fillRect(365,148,230,7);ctx.fillStyle=stress>.75?"#b74534":"#7d8b4d";ctx.fillRect(365,148,230*stress,7);ctx.fillStyle="#d9d4c6";ctx.font="bold 8px Courier New";ctx.fillText(`GRIP STRESS // ${keyLabel("brace").toUpperCase()} TO BRACE`,365,145);}

  function drawRouteStrip(){
    const x=24,y=101,w=250,h=28;ctx.fillStyle="rgba(7,10,13,.9)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#4e493f";ctx.strokeRect(x,y,w,h);ctx.fillStyle="#262b2d";ctx.fillRect(x+12,y+18,w-24,2);
    for(const stop of game.stops){const sx=x+12+(stop.x/WORLD_W)*(w-24);ctx.fillStyle=stop.state==="collected"?"#73855b":stop.state==="tagged"?"#a26738":"#a9a397";ctx.beginPath();ctx.arc(sx,y+19,3,0,Math.PI*2);ctx.fill();}
    const actor=x+12+(actorPosition().x/WORLD_W)*(w-24);ctx.fillStyle="#e99b32";ctx.beginPath();ctx.moveTo(actor,y+10);ctx.lineTo(actor-4,y+4);ctx.lineTo(actor+4,y+4);ctx.closePath();ctx.fill();ctx.fillStyle="#8e9189";ctx.font="bold 8px Courier New";ctx.fillText(`DISTRICT MAP // ${Math.min(3,Math.floor(actorPosition().x/W)+1)}/3`,x+10,y+10);
  }

  function drawRouteArrow() {
    const { stop } = nearestStop();
    const { waste } = nearestWaste();
    const { spill } = nearestSpill();
    const target = waste || stop || spill;
    if (!target) return;
    const actor=actorPosition();const tx=waste?waste.x:stop?stop.binX:target.x;const ty=waste?waste.y:stop?stop.binY:target.y;
    const angle = Math.atan2(ty-actor.y, tx-actor.x);
    ctx.save();ctx.translate(900,113);ctx.rotate(angle);ctx.fillStyle="#e99b32";ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-8);ctx.lineTo(-4,0);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle="#9a682f";ctx.font="bold 9px Courier New";ctx.textAlign="right";ctx.fillText(waste?waste.label:stop?stop.label.toUpperCase():"SPILL CLEANUP",870,116);ctx.textAlign="left";
  }

  function frame(now) {
    const rawFrameMs=last?now-last:0;last=now;
    const activeFrame=rawFrameMs>0&&game&&!['READY','RESULT','PAUSED'].includes(game.phase);
    if(activeFrame){
      game.metrics.frameCount+=1;game.metrics.totalFrameMs+=rawFrameMs;game.metrics.worstFrameMs=Math.max(game.metrics.worstFrameMs,rawFrameMs);if(rawFrameMs>34)game.metrics.longFrames+=1;
    }
    const timing=simulation.advance(rawFrameMs/1000||0,update);
    if(activeFrame){game.metrics.simulationSteps+=timing.steps;game.metrics.droppedSimulationMs+=timing.droppedSeconds*1000;}
    draw(); requestAnimationFrame(frame);
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
      setStatus(`Shift paused. Press ${keyLabel("pause")} or Resume.`);
    }
  }

  function beginRebind(action) {
    if (!Input.ACTIONS[action] || game.phase !== "READY") return;
    rebindingAction = action;
    renderBindings();
    setStatus(`Press a new key for ${Input.ACTIONS[action].label}. Escape cancels.`);
  }

  function captureBinding(code) {
    if (!rebindingAction) return false;
    const action = rebindingAction;
    if (code === "Escape") {
      rebindingAction = null;
      renderBindings();
      setStatus("Keyboard binding unchanged.");
      return true;
    }
    if (!Input.isBindable(code)) {
      setStatus(`${Input.formatCode(code)} is reserved. Press another key or Escape.`);
      return true;
    }
    const conflict = Input.conflictFor(action, code, campaign.settings.bindings);
    if (conflict) {
      setStatus(`${Input.formatCode(code)} is already used by ${Input.ACTIONS[conflict].label}. Press another key.`);
      return true;
    }
    campaign.settings.bindings[action] = code;
    rebindingAction = null;
    saveCampaign();
    renderBindings();
    setStatus(`${Input.ACTIONS[action].label} is now ${Input.formatCode(code)}.`);
    return true;
  }

  addEventListener("keydown", event => {
    if (rebindingAction) { event.preventDefault(); captureBinding(event.code); return; }
    const action = Input.actionForCode(event.code, campaign.settings.bindings);
    if (action || ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.repeat) return;
    if (action === "work") handleSpaceAction();
    if (action === "grab") game.phase === "INSPECT" ? collectActive() : toggleGrab();
    if (action === "cab") exitEnterTruck();
    if (action === "tag") tagActive();
    if (action === "inspect") inspectCloser();
    if (action === "compact") compact();
    if (action === "cleanup") cleanSpill();
    if (action === "pause") togglePause();
    if (event.code === "Enter" && game.phase === "RESULT") resetGame();
    if (action === "mute") toggleMute();
  });
  addEventListener("keyup", event => keys.delete(event.code));
  addEventListener("blur", () => { keys.clear(); if (game && !["READY","RESULT","PAUSED"].includes(game.phase)) togglePause(true); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && game && !["READY","RESULT","PAUSED"].includes(game.phase)) togglePause(true); });
  document.querySelector("#startButton").addEventListener("click", startGame);
  document.querySelector("#collectButton").addEventListener("click", collectActive);
  document.querySelector("#tagButton").addEventListener("click", tagActive);
  document.querySelector("#inspectButton").addEventListener("click", inspectCloser);
  document.querySelector("#pauseButton").addEventListener("click", () => togglePause());
  ui.endShift.addEventListener("click",endShiftEarly);
  document.querySelector("#resumeButton").addEventListener("click", () => togglePause());
  document.querySelector("#restartButton").addEventListener("click", resetGame);
  ui.upgradeList.addEventListener("click",event=>{const button=event.target.closest("[data-upgrade]");if(button)buyUpgrade(button.dataset.upgrade);});
  ui.contractList.addEventListener("change",event=>{const input=event.target.closest('input[name="contract"]');if(!input||game.phase!=="READY")return;campaign.settings.contractId=Contracts.getContract(input.value).id;saveCampaign();resetGame();setStatus(`${Contracts.getContract(input.value).name} selected for this shift.`);});
  ui.bindingList.addEventListener("click",event=>{const button=event.target.closest("[data-bind-action]");if(button)beginRebind(button.dataset.bindAction);});
  ui.resetBindings.addEventListener("click",()=>{rebindingAction=null;campaign.settings.bindings=Input.defaultBindings();saveCampaign();renderBindings();setStatus("Keyboard bindings reset to defaults.");});
  ui.resetCareer.addEventListener("click",()=>{if(!confirm("Reset all local crew history, credits, trust, upgrades, and settings?"))return;campaign=defaultCampaign();try{localStorage.removeItem(SAVE_KEY);}catch(_){}applyCampaignSettings();resetGame();syncAudioMix();});
  function toggleMute() { muted=!muted;if(!muted)ensureAudio();syncAudioMix();ui.mute.textContent=`Sound: ${muted?"off":"on"}`;ui.mute.setAttribute("aria-pressed", String(muted));if(audio)ui.audioStatus.textContent=muted?"Muted // mix preserved":"Active // 3 buses"; }
  ui.mute.addEventListener("click", toggleMute);
  for(const slider of [ui.vehicleVolume,ui.streetVolume,ui.effectsVolume])slider.addEventListener("input",()=>{ensureAudio();syncAudioMix();saveCampaign();});
  for(const option of [ui.relaxedClock,ui.handlingAssist,ui.lightTraffic,ui.reducedShake,ui.highContrast])option.addEventListener("change",()=>{document.body.classList.toggle("high-contrast",ui.highContrast.checked);saveCampaign();if(game.phase==="READY")resetGame();setStatus("Shift setup saved and applied.");});
  ui.copyReport.addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(ui.playtestReport.textContent);
      ui.copyReport.textContent="Copied";
      setTimeout(()=>{ui.copyReport.textContent="Copy report";},1400);
    }catch(_){
      const selection=getSelection();const range=document.createRange();range.selectNodeContents(ui.playtestReport);selection.removeAllRanges();selection.addRange(range);ui.copyReport.textContent="Report selected";
      setTimeout(()=>{ui.copyReport.textContent="Copy report";},1800);
    }
  });

  applyCampaignSettings();
  resetGame();
  requestAnimationFrame(frame);
})();
