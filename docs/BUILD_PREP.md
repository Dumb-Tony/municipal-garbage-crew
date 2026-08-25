# Build Preparation Package

This document translates the living GDD into an executable plan. Priority means: **P0** required to validate the current hypothesis, **P1** next proof, **P2** supports the long-term game.

## Prioritized prototype backlog

| Priority | Item | Outcome | Size | Dependency |
|---|---|---|---|---|
| Done | Six-stop Canvas route | Complete inspect/load/tag/finish loop | S | — |
| Done | Drivable truck and hazards | Positioning, traffic, damage, blocked curb | M | — |
| Done | Capacity and compactor | Stop interlock, loose/packed volume, cooldown | S | Route loop |
| Done | Results and consequences | Score, misses, complaints, spills, damage | S | Route loop |
| Done | Deterministic shift seed + event ledger | Reproducible route decisions and structured event history | S | Current slice |
| Done | Itemized result ledger | Auditable end-of-shift score | S | Event ledger |
| P0 | Event-driven score reducer | Replay-safe score mutations and rule tests | M | Event ledger |
| Done | Spill recovery interaction | Mistake becomes new work, not only penalty | M | Event ledger |
| Done | Ambiguous contamination inspection | Genuine time-versus-certainty decision | M | Event ledger |
| Done | Pause/focus safety | Fair standalone play when focus changes | S | Current input |
| Done | Hands-on bin handling | Hold-to-lift, counter-sway, slip recovery and penalty | M | Route loop |
| Done | Safe route spawn/collision pass | No immediate traffic damage; road-constrained driving | S | Truck movement |
| P0 | Remappable input/gamepad layer | Device-independent actions | M | Current input |
| P0 | Five-person usability playtest | Evidence for M0 decision | S | Current slice |
| P1 | On-foot loader greybox | Validate walk/grab/tilt/tip | L | Input abstraction |
| P1 | Container physics model | Mass, wheels, grip, integrity, tip state | L | Loader greybox |
| P1 | One bag and rupture/cleanup | Core systemic comedy/recovery | M | Container physics |
| P1 | Truck safe-move interlock | Driver/loader coordination | M | Loader greybox |
| P1 | Two-player local/network test scene | Validate role interplay and authority | XL | Unity greybox |
| P1 | Accessibility settings baseline | Shake, contrast, holds, clock, alarms | M | Input/camera/audio |
| P2 | Variable stop definitions and seeds | Replayable authored route envelope | M | Event ledger |
| P2 | Persistent address history | Complaints and trust affect later shifts | L | Save versioning |
| P2 | Depot/upgrades slice | Close progression loop | L | Three route outcomes |
| P2 | 2–5 player session flow | Lobby, join, reconnect, role hints | XL | Network proof |

## Milestone plan and exit gates

### M0 — Route proof (1–3 days; current build candidate)

Hypothesis: positioning, rules, truck capacity, and time create a replayable route even before direct physics handling.

Exit when five fresh players can start without instruction, at least four finish, at least three use the compactor intentionally, and players can explain the cause of 80% of score penalties. At least two should voluntarily retry or state a specific improvement plan.

### M1 — Tactile proof (2–3 weeks)

One Unity room/block, one character, one wheeled cart, one bag, rear hopper, grab/brace/tip, rupture, cleanup, and accessibility toggles. Exit when a novice can move and empty a cart within 60 seconds; weight differences are correctly ranked in 4/5 blind comparisons; failed handling remains attributable; and the same inputs support mouse/keyboard and controller.

### M2 — Cooperation proof (3–5 weeks)

Two players, one drives and both may handle; safe-move call, riding position, shared grab, hopper control, latency simulation. Exit when ten 12-minute sessions show meaningful spoken/nonverbal coordination, no role is idle for more than 20% of the route, and 150 ms simulated latency does not create frequent unrecoverable objects.

### M3 — Unity route proof (6–8 weeks)

One Maple district, 8–12 variable stops, basic traffic, contamination, capacity, results, deterministic seed. Exit at stable target performance on minimum-spec PC, <1 blocking defect per five sessions, and evidence that route knowledge improves the second run.

### M4 — Progression proof (4–6 weeks)

Depot plus three shifts, address history, complaints/trust, one truck and one tool upgrade choice. Exit when consequences persist understandably, weak shifts remain recoverable, and upgrade choices change tactics without deleting core work.

### M5 — Production vertical slice (8–12 weeks after M4)

One polished district, three job variants, 2–5 players, join/reconnect, complete accessibility baseline, Steam-ready shell, final-quality representative art/audio. Exit requires performance/network matrices, external playtest retention signals, content production estimates, and production/no-go review.

## Browser vertical-slice acceptance criteria

### Functional

- Opens from `prototype/index.html` in a current Chromium, Firefox, or Edge browser without install/build/server.
- Start, complete, results, and restart loops function without reload.
- Six stops can each resolve as collected or tagged.
- Truck can move, reverse, steer, brake, collide, and remain inside play bounds.
- Collection requires proximity and low speed and shows an identifiable loading motion.
- Two contaminated stops clearly signal a collect/tag consequence decision.
- Hopper prevents loads above 8 units; compaction reduces occupied capacity only while nearly stopped.
- Moving traffic and blocked curb affect positioning; collision records damage.
- Collision with a sufficiently loose load can create a visible spill and penalty.
- Timer, score, route progress, capacity, complaint count, result summary, and restart are present.

### Experience

- A new player identifies the next stop and core control within 15 seconds after starting.
- Every blocked interaction states why it failed.
- A score penalty is paired with immediate visual/text/audio feedback.
- A clean route with correct contamination calls is achievable with at least 20 seconds remaining after one practice run.
- The player encounters capacity pressure but can finish without a forced bad load.
- Screen remains legible at 960×600 internal resolution and at 680 CSS pixels wide.
- Decision actions work by key and clickable button; sound can be muted; reduced-motion preference removes overlay rotation.

### Quality

- No uncaught console errors during two complete runs.
- No route state can become impossible to finish after a collision or full hopper.
- Restart resets stops, traffic, timer, score, cargo, spills, damage, and UI.
- Game clock does not advance before start or after results.

## Controls specification

| Action | Keyboard | Context / behavior |
|---|---|---|
| Accelerate / reverse | W/S or Up/Down | Speed changes gradually; release applies drag |
| Steer | A/D or Left/Right | Steering scales with speed and reverses naturally |
| Inspect nearest stop | Space | Must be within 74 px and moving ≤22 px/s |
| Check uncertain contents | Q or button | Inspection open on obscured load; costs five route seconds |
| Collect | E or button | Inspection open; refuses if projected capacity >8 |
| Lift and balance bin | Hold Space + A/D or Left/Right | Load phase; holding advances lift, steering keys counter lateral sway; excessive sway causes a recoverable slip |
| Tag and leave | R or button | Inspection open; correct for contamination, complaint otherwise |
| Compact | C | Drive phase, speed ≤18, loose load present, cooldown clear |
| Clean spill | X | Within 68 px, speed ≤18; costs three seconds and recovers score |
| Pause/resume | P or button | Freezes route clock and traffic; focus loss pauses automatically |
| Restart | Enter or button | Results only |
| Mute | M or button | Any phase; Web Audio remains optional |

Next input layer should emit named actions independent of devices, support remapping and gamepad, ignore repeats for discrete actions, clear held state on focus loss, and expose hold/toggle policies.

## State-machine specification

### Shift state

```text
READY --ClockIn--> DRIVE
DRIVE --Inspect(valid proximity/speed)--> INSPECT
INSPECT --Collect(capacity available)--> LOAD --animation complete--> DRIVE
INSPECT --Collect(over capacity)--> DRIVE
INSPECT --Tag--> DRIVE
DRIVE --Compact(valid interlocks)--> COMPACT --cycle complete--> DRIVE
Any active state --time zero--> RESULT
DRIVE --all stops resolved--> RESULT
RESULT --Restart--> READY/DRIVE
```

Only `DRIVE` updates truck input. Traffic and shift time update during `DRIVE`, `INSPECT`, `LOAD`, and `COMPACT`; time pressure therefore continues while deciding and handling. Results and ready states freeze the simulation.

### Stop state

```text
waiting --inspect--> waiting (shift enters INSPECT)
waiting --collect--> loading --complete--> collected
waiting --tag--> tagged
```

`collected` and `tagged` are terminal within a shift. Persistent campaign resolution later maps these to address outcomes.

### Truck substate/data

Truck movement is data-driven by position, angle, speed, stun time, and collision cooldown. Hopper is `loose + compacted ≤ capacity`; compaction transfers `loose × 0.42` to compacted and clears loose. A collision may add damage and, when loose load exceeds one unit, probabilistically spill 0.45 units. Replace that random check with a seeded roll/event in the next iteration.

### Interaction invariants

- One active stop maximum.
- One load animation maximum.
- A resolved stop never re-enters inspection.
- Cargo never exceeds capacity through collection.
- Results execute once and own final score calculation.
- Presentation effects never authoritatively change route state.

## Suggested folder/module structure

Current zero-build slice remains deliberately compact:

```text
prototype/
  index.html
  styles.css
  game.js
docs/
  GDD.md
  BUILD_PREP.md
  PLAYTEST.md
```

When the P0 event-ledger task begins, use native browser modules and a tiny local server for development:

```text
prototype/src/
  main.js                 composition + frame loop
  config/tuning.js        speeds, capacities, score constants
  content/maple-route.js  immutable stop/hazard definitions
  sim/shift.js            phase transitions, clock, outcomes
  sim/truck.js            locomotion, cargo, compactor, collision
  sim/stops.js            inspection and resolution rules
  sim/events.js           seeded RNG and append-only event ledger
  input/actions.js        keyboard/gamepad to named actions
  view/canvas-renderer.js world/HUD drawing
  view/dom-ui.js          overlays, decisions, results
  view/audio.js           optional sound cues
prototype/tests/
  shift.test.js
  cargo.test.js
  stops.test.js
```

Do not introduce a framework until multiple screens or tools create a concrete need. A lightweight test runner is justified before simulation extraction; production bundling is justified only when module count/browser deployment warrants it.

Suggested Unity structure:

```text
Assets/Game/
  Art/ Audio/ Prefabs/ Scenes/
  Data/RouteDefinitions/ WasteDefinitions/ VehicleDefinitions/
  Scripts/
    Simulation/ Interactions/ Vehicles/ Waste/ Routes/
    Networking/ Presentation/ UI/ Persistence/ Accessibility/
  Tests/EditMode/ PlayMode/ Network/
```

Assembly definitions should separate pure simulation, Unity presentation, networking, and tests.

## Test and QA checklist

### Smoke pass

- [ ] Open directly from disk; title/start card appear.
- [ ] Clock in by click; Canvas receives focus.
- [ ] Drive with both WASD and arrow controls.
- [ ] Try Space while moving and far away; reason is shown.
- [ ] Collect a valid stop; loading animation completes exactly once.
- [ ] Release Space during loading; progress waits. Counter sway in both directions and complete the lift.
- [ ] Allow the balance marker to escape the safe range; one slip and one penalty are recorded, then handling remains recoverable.
- [ ] Start a fresh shift and remain stationary for five seconds; no spawn collision or damage occurs.
- [ ] Correctly tag one contaminated stop.
- [ ] Incorrectly collect one contaminated stop; complaint and score respond.
- [ ] Fill near capacity; attempt over-capacity load; compact while stopped; retry successfully.
- [ ] Attempt compaction while moving and during cooldown.
- [ ] Hit traffic and blocked car; damage increments once per impact, not every frame.
- [ ] Cause/observe spill across repeated collisions with loose load; return, stop, and clean it with X.
- [ ] Resolve all stops; results match counters.
- [ ] Let timer expire with unresolved stops; each becomes a complaint in results.
- [ ] Restart by button and Enter; all state resets.
- [ ] Mute by button and M; setting and label agree.

### Boundary and state cases

- [ ] Hold opposing movement/steering keys.
- [ ] Lose browser focus while accelerating; truck does not continue on return.
- [ ] Inspect as timer reaches zero; results closes decision UI.
- [ ] Fill to just below and just above capacity threshold.
- [ ] Repeatedly press collect/tag/compact; transitions remain single-fire.
- [ ] Collide during compactor cycle/loading; non-driving phases remain stable.
- [ ] Complete route with 0 complaints, with all valid stops skipped, and with mixed outcomes.
- [ ] Resize from desktop to narrow layout; cards/buttons remain reachable.
- [ ] Enable reduced motion; overlays do not rotate.
- [ ] Run with Web Audio unavailable/blocked; gameplay continues.

### Browser matrix

- [ ] Current Edge/Chrome on Windows.
- [ ] Current Firefox on Windows.
- [ ] Safari on macOS before public distribution.
- [ ] Keyboard-only navigation and visible focus.
- [ ] Screen reader announces start/decision/results controls; canvas has an equivalent concise label.

### Playtest telemetry (manual in 0.4.0)

Record: shift seed, time to first movement, time to first stop, compactor attempts/successes, contamination choices, collision count, spills, completion time, final score, event count, restart choice, and a one-sentence causal account of the worst mistake.

## Explicit next implementation tasks

1. Move remaining live score mutations into event reducers and add rule tests for score idempotence.
2. Add an action-map layer with remapping and gamepad support.
3. Add a short cleanup animation/state and finite spill-kit resource.
4. Extract pure rules into modules and write tests for cargo invariants, stop transitions, timeout, and score idempotence.
5. Tune route time, stop radius, vehicle steering, traffic speed, weights, and score from five observed playtests.
6. Decide M0 pass/revise based on exit gate; only then start the Unity tactile sandbox.
