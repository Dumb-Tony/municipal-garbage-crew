# Build Preparation Package

This document translates the living GDD into an executable plan. Priority means: **P0** required to validate the current hypothesis, **P1** next proof, **P2** supports the long-term game.

## Prioritized prototype backlog

| Priority | Item | Outcome | Size | Dependency |
|---|---|---|---|---|
| Done | Ten-stop scrolling Canvas route | Three blocks, free-order inspect/load/tag/finish loop | L | — |
| Done | Drivable truck and hazards | Positioning, traffic, damage, blocked curb | M | — |
| Done | Capacity and compactor | Stop interlock, loose/packed volume, cooldown | S | Route loop |
| Done | Results and consequences | Score, misses, complaints, spills, damage | S | Route loop |
| Done | Deterministic shift seed + event ledger | Reproducible route decisions and structured event history | S | Current slice |
| Done | Itemized result ledger | Auditable end-of-shift score | S | Event ledger |
| Done | Copyable solo playtest report | Comparable seed, timing, route, consequence, and assist evidence | S | Event ledger |
| Done | Shared pure rules module + native tests | One tested source for final score, progression bounds, history, and stop invariants | M | Event ledger |
| P0 | Event-driven score reducer | Replay-safe score mutations and rule tests | M | Event ledger |
| Done | Spill recovery interaction | Mistake becomes new work, not only penalty | M | Event ledger |
| Done | Ambiguous contamination inspection | Genuine time-versus-certainty decision | M | Event ledger |
| Done | Pause/focus safety | Fair standalone play when focus changes | S | Current input |
| Done | Hands-on bin handling | Hold-to-lift, counter-sway, slip recovery and penalty | M | Route loop |
| Done | Safe route spawn/collision pass | No immediate traffic damage; road-constrained driving | S | Truck movement |
| Done | PS2-era urban-noir presentation target | Cohesive title, world, weather, vehicle, HUD, overlay, and social-preview art direction | L | Current slice |
| Done | Named action + remappable keyboard layer | Persistent conflict-safe bindings and dynamic prompts | M | Current input |
| P1 | Gamepad action adapter | Feed the same named actions from controller input | M | Named action layer |
| P0 | Five-person usability playtest | Evidence for M0 decision | S | Current slice |
| Done | On-foot loader foundation | Exit/enter, walk, grab/release, wheel, load, return | L | Current input |
| Done | Selective container/waste physics | Bin wheels, grip stress, bag integrity, carry/drop/load states | L | Loader greybox |
| Done | One bag and rupture/cleanup | Hard drops, traffic/truck rupture, debris, re-bag recovery | M | Container physics |
| Done | Oversized-item proof | Mattress carry offset, stress, brace, slip, vehicle shove | M | Container physics |
| Done | Scrolling district route | Multi-screen navigation, intersections, route order and access obstacles | XL | Tactile proof |
| Done | Layered Web Audio mix | Responsive truck, work, traffic, weather and neighborhood buses | L | Scrolling district |
| P1 | Truck safe-move interlock | Driver/loader coordination | M | Loader greybox |
| P1 | Two-player browser/network test scene | Validate role interplay and authority | XL | Browser handling proof |
| Done | Accessibility settings baseline | Persistent shake, contrast, clock, traffic, and handling options | M | Input/camera/audio |
| P2 | Variable stop definitions and seeds | Replayable authored route envelope | M | Event ledger |
| Done | Persistent address history | Versioned outcomes, complaints, clean streaks and familiarity | L | Save versioning |
| Done | Depot/upgrades slice | Credits, trust, rank, three upgrades and shift return loop | L | Route outcomes |
| P2 | 2–5 player session flow | Lobby, join, reconnect, role hints | XL | Network proof |

## Milestone plan and exit gates

### M0 — Route proof (1–3 days; current build candidate)

Hypothesis: positioning, rules, truck capacity, and time create a replayable route even before direct physics handling.

Exit when five fresh players can start without instruction, at least four finish, at least three use the compactor intentionally, and players can explain the cause of 80% of score penalties. At least two should voluntarily retry or state a specific improvement plan.

### M1 — Tactile proof (2–3 weeks)

One browser sandbox/block, one loader, one wheeled cart, one bag, rear hopper, grab/brace/tip, rupture, cleanup, and accessibility toggles. Exit when a novice can move and empty a cart within 60 seconds; weight differences are correctly ranked in 4/5 blind comparisons; failed handling remains attributable; and the same inputs support mouse/keyboard and controller.

### M2 — Browser route expansion (3–5 weeks)

One Maple district, 8–12 variable stops, basic traffic, contamination, capacity, results, deterministic seed. Exit at stable target performance on minimum-spec PC, <1 blocking defect per five sessions, and evidence that route knowledge improves the second run.

### M3 — Layered audio proof (1–2 weeks)

Engine load, idle, reversing, brakes, bins, compactor, wind, traffic, distant residents, and street ambience respond to authoritative state. Exit when sound clarifies nearby hazards and machine condition without becoming fatiguing, and vehicle/neighborhood categories can be independently adjusted or muted.

### M4 — Progression proof (4–6 weeks)

Depot plus three shifts, address history, complaints/trust, one truck and one tool upgrade choice. Exit when consequences persist understandably, weak shifts remain recoverable, and upgrade choices change tactics without deleting core work.

### M5 — Solo validation and production vertical slice (8–12 weeks after M4)

One polished solo district, three job variants, complete accessibility baseline, downloadable web shell, and final-quality representative art/audio. Exit requires performance matrices, external playtest retention signals, content production estimates, and evidence that failures remain legible and recoverable.

### M6 — Multiplayer go/no-go gate

Only after M5 passes: two players, driver/loader handoff, safe-move call, shared grab, hopper control, and latency simulation. Ten 12-minute sessions must show meaningful coordination, acceptable role activity, and recoverable behavior at 150 ms simulated latency before multiplayer enters the production plan.

## Browser vertical-slice acceptance criteria

### Functional

- Opens from `prototype/index.html` in a current Chromium, Firefox, or Edge browser without install/build/server.
- Start, complete, results, and restart loops function without reload.
- Ten stops across three scrolling blocks can each resolve as collected or tagged in any order.
- Truck can move, reverse, steer, brake, collide, and remain inside play bounds.
- Collection requires proximity and low speed and shows an identifiable loading motion.
- Two contaminated stops clearly signal a collect/tag consequence decision.
- Hopper prevents loads above 8 units; compaction reduces occupied capacity only while nearly stopped.
- Moving traffic and blocked curb affect positioning; collision records damage.
- Collision with a sufficiently loose load can create a visible spill and penalty.
- Timer, score, route progress, capacity, complaint count, result summary, and restart are present.
- Every filed shift produces a selectable/copyable report containing its seed, active assists, key onboarding times, route order, failures, recovery, and outcome.

### Experience

- A new player identifies the next stop and core control within 15 seconds after starting.
- Every blocked interaction states why it failed.
- A score penalty is paired with immediate visual/text/audio feedback.
- A clean route with correct contamination calls is achievable with at least 20 seconds remaining after one practice run.
- The player encounters capacity pressure but can finish without a forced bad load.
- Screen remains legible at 960×600 internal resolution and at 680 CSS pixels wide.
- Decision actions work by key and clickable button; sound can be muted; reduced-motion preference removes overlay rotation.
- Relaxed clock adds two minutes without increasing the time-bonus ceiling; handling assist and light traffic reduce difficulty without removing hazards.
- Reduced shake and high contrast apply visibly, persist across reloads, and do not change the route score.

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
| Drive / walk | W/S/A/D or arrows | Controls the truck in cab mode and the worker in street mode |
| Exit / enter truck | F | Truck must be nearly stopped; worker must be near cab and not holding a bin |
| Contextual work | Space | On foot: inspect nearby waiting bin, load at hopper, or return empty bin at curb |
| Check uncertain contents | Q or button | Inspection open on obscured load; costs five route seconds |
| Authorize collection | E or button | Inspection open; closes the decision and enables physical bin handling |
| Grab / release bin | E | On foot within reach; waiting bins must be inspected first |
| Lift and balance bin | Hold Space + A/D or Left/Right | Load phase; holding advances lift, steering keys counter lateral sway; excessive sway causes a recoverable slip |
| Tag and leave | R or button | Inspection open; correct for contamination, complaint otherwise |
| Compact | C | Drive phase, speed ≤18, loose load present, cooldown clear |
| Brace oversized waste | Hold Shift | Reduces grip-stress growth and movement speed while carrying bulky items |
| Clean / re-bag spill | X | On foot within 48 px; costs three seconds and creates a recoverable replacement bag when linked to a rupture |
| Pause/resume | P or button | Freezes route clock and traffic; focus loss pauses automatically |
| Restart | Enter or button | Results only |
| Mute | M or button | Any phase; Web Audio remains optional |
| Audio mix | Footer sliders | Independently adjusts Truck, Street, and Effects buses |
| End shift | Footer button | Files unresolved stops as missed pickups, persists consequences, and opens results |

The current keyboard layer emits named actions independent of key codes, supports persistent remapping, ignores repeats for discrete actions, clears held state on focus loss, rejects conflicts/reserved keys, and preserves movement/brace fallbacks. The next device step is a gamepad adapter feeding the same actions plus explicit hold/toggle policies for accessibility.

## State-machine specification

### Shift state

```text
READY --ClockIn--> DRIVE
DRIVE/truck --F(stopped)--> DRIVE/foot
DRIVE/foot --F(near cab, empty hands)--> DRIVE/truck
DRIVE/foot --Inspect(valid proximity)--> INSPECT
INSPECT --Authorize--> DRIVE/foot
DRIVE/foot --Grab + move to hopper + Space(capacity available)--> LOAD
LOAD --animation complete--> DRIVE/foot
DRIVE/foot --Grab empty + return + Space--> resolved
INSPECT --Tag--> DRIVE
DRIVE --Compact(valid interlocks)--> COMPACT --cycle complete--> DRIVE
Any active state --time zero--> RESULT
DRIVE --all stops resolved--> RESULT
RESULT --Restart--> READY/DRIVE
```

Only `DRIVE/truck` updates truck input; `DRIVE/foot` updates worker movement and bin following. Traffic and shift time update during all active phases, so pressure continues while deciding and handling. Results and ready states freeze the simulation.

### Stop state

```text
waiting --inspect/authorize--> authorized
authorized --grab/move/load--> loading --complete--> empty
empty --grab/return--> collected
waiting --tag--> tagged
```

`collected` and `tagged` are terminal within a shift. Persistent campaign resolution later maps these to address outcomes.

### Truck substate/data

Truck movement is data-driven by position, angle, speed, stun time, and collision cooldown. Hopper is `loose + compacted ≤ capacity`; compaction transfers `loose × 0.42` to compacted and clears loose. A collision may add damage and, when loose load exceeds one unit, probabilistically spill 0.45 units. Replace that random check with a seeded roll/event in the next iteration.

### Interaction invariants

- One active stop and one physically grabbed bin maximum.
- One load animation maximum.
- A collected/tagged stop never re-enters inspection; an emptied bin remains unresolved until returned.
- Cargo never exceeds capacity through collection.
- Results execute once and own final score calculation.
- Presentation effects never authoritatively change route state.

## Suggested folder/module structure

Current zero-build slice remains deliberately compact:

```text
prototype/
  index.html
  styles.css
  rules.js
  input.js
  game.js
  tests/input.test.js
  tests/rules.test.js
docs/
  GDD.md
  BUILD_PREP.md
  PLAYTEST.md
package.json
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

Suggested expanded browser structure:

```text
prototype/
  assets/art/ audio/ textures/
  src/content/ simulation/ interactions/ vehicles/ waste/ routes/
  src/networking/ presentation/ ui/ persistence/ accessibility/
  tests/unit/ integration/ browser/
```

Module boundaries should separate pure simulation, Canvas presentation, networking, persistence, and tests.

## Test and QA checklist

### Smoke pass

- [ ] Open directly from disk; title/start card appear.
- [ ] Clock in by click; Canvas receives focus.
- [ ] Drive with both WASD and arrow controls.
- [ ] Stop, press F, and confirm the worker appears safely at the truck rear; walk with both key sets.
- [ ] Try Space from the cab and while far from a bin; the next step is stated.
- [ ] Inspect and authorize a valid stop; confirm it remains unresolved until physically serviced.
- [ ] Grab/release with E; wheel the bin to the hopper; loading begins only within range.
- [ ] Empty a valid bin; grab it again, return it to its amber marker, and confirm the stop resolves exactly once.
- [ ] Authorize Corner Market; load its bin and fragile bag in either order; verify the stop resolves only after both plus bin return.
- [ ] Release the market bag while moving; verify it ruptures, creates debris, and blocks route completion until X re-bags it and the replacement is loaded.
- [ ] Carry the mattress without Shift through sharp turns; verify grip stress rises and a slip remains recoverable.
- [ ] Carry the mattress with Shift and wide turns; verify stress falls and loading succeeds.
- [ ] Drive over the bag and into the mattress; verify rupture/shove consequences are visible and neither creates an impossible state.
- [ ] Release Space during loading; progress waits. Counter sway in both directions and complete the lift.
- [ ] Allow the balance marker to escape the safe range; one slip and one penalty are recorded, then handling remains recoverable.
- [ ] Start a fresh shift and remain stationary for five seconds; no spawn collision or damage occurs.
- [ ] Correctly tag one contaminated stop.
- [ ] Incorrectly collect one contaminated stop; complaint and score respond.
- [ ] Fill near capacity; attempt over-capacity load; compact while stopped; retry successfully.
- [ ] Attempt compaction while moving and during cooldown.
- [ ] Hit traffic and blocked car; damage increments once per impact, not every frame.
- [ ] Let traffic touch the on-foot worker; confirm a brief stumble/drop and time penalty occur without death or reset.
- [ ] Cause/observe spill across repeated collisions with loose load; return, stop, and clean it with X.
- [ ] Resolve all stops; results match counters.
- [ ] Let timer expire with unresolved stops; each becomes a complaint in results.
- [ ] Restart by button and Enter; all state resets.
- [ ] Mute by button and M; setting and label agree.
- [ ] Drive, reverse, brake, exit, walk with and without waste, and compact; each expected responsive layer is audible.
- [ ] Approach and leave moving traffic; proximity cue appears and recedes without masking dispatch cues.
- [ ] Set Truck, Street, and Effects sliders independently to zero and maximum; only the selected bus changes.
- [ ] Pause and finish a shift; continuous engine, wind, and hum layers ramp down rather than stopping with a click.
- [ ] End a partial shift; verify missed stops, credits, trust, address outcomes, shift number, and result summary agree.
- [ ] Return to depot and reload; verify the same crew file, last-shift report, audio mix, and address ledger remain.
- [ ] Accumulate credits and buy each upgrade in separate test saves; verify cost, installed state, rank, reload persistence, and advertised mechanical effect.
- [ ] Verify Hydraulic Assist changes lift rate, Hopper Baffles changes both limit and HUD, and Winter Tires changes handling and spill probability without removing risk.
- [ ] Toggle every shift-setup option, reload, and verify its checked state and visible/mechanical effect persist.
- [ ] Rebind every keyboard action, reload, and verify held/discrete behavior, start-card controls, HUD prompts, status messages, canvas label, and report all use the new primary keys.
- [ ] Attempt duplicate, Escape, Enter, Tab, modifier-only, F5, F11, and F12 bindings; verify conflicts/reserved keys are rejected without losing the prior binding.
- [ ] Reset bindings; verify defaults return while movement arrows and right Shift work before and after custom remaps.
- [ ] Compare identical early closures with and without Relaxed Clock; duration changes from 600 to 720 seconds while the maximum time bonus remains +1200.
- [ ] File a complete, partial, and timed-out route; expand and copy each playtest report, verifying seed, assists, timings, route order, outcome, and progression values against the results screen.

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

### Playtest telemetry (generated in 0.14.0)

The results screen generates a copyable report containing the shift seed, active assists, active primary bindings, elapsed time, first movement from either control mode, cab-exit/inspection/resolution times, resolution order, compactions, collisions, handling slips, spills and cleanup, stumbles, damage, score, complaints, credits, trust, installed upgrades, average frame rate, worst frame, slow-frame count, viewport, and display pixel ratio. The observer still records confusion, voluntary retry, audio clarity/fatigue, and the player's causal account because runtime telemetry cannot infer those judgments.

## Explicit next implementation tasks

1. Run at least five fresh external solo sessions on build 0.14.0, collecting the generated report plus observer notes for each.
2. Tune clarity, pacing, economy, accessibility, and audio fatigue from that evidence, then repeat any failed M5 exit checks.
3. Build a narrowly scoped two-player driver/loader test only after the solo exit gate, then record a multiplayer go/no-go decision.
4. Alongside these milestones, extract event reducers and named input actions and add rule tests for cargo, persistence migrations, and stop-state invariants.
