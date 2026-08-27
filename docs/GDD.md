# Municipal Garbage Crew — Living Game Design Document

**Status:** Active preproduction / browser slice 0.9.0
**Last updated:** 2026-08-27
**Product direction:** browser-first stylized game; solo now, cooperative expansion evaluated after the core route is proven
**Current proof:** standalone 2D Canvas prototype, solo, no build step

### Repository and deployment policy

The canonical project checkout is `C:\Dev\municipal-garbage-crew`, maintained as a Git repository with `main` as its primary branch. The public GitHub repository is named `municipal-garbage-crew`. The standalone prototype must remain playable through a verified public GitHub Pages URL, linked prominently from the README. Design documents, plans, prototype source, and useful assets are versioned together; secrets, credentials, machine-specific files, dependencies, and generated junk are excluded. Canonical edits belong in that checkout rather than temporary projectless workspaces.

## 1. High concept

Municipal Garbage Crew turns an ordinary small-town sanitation route into a tactile cooperative systems game. A crew drives an aging truck, wrestles awkward waste into the hopper, interprets collection rules under time pressure, navigates curb access, and contains the consequences when equipment, traffic, residents, weather, and the crew's own shortcuts collide.

The comedy is never a joke button. It comes from a couch wedged sideways in the hopper, a rushed driver creeping forward while a loader still has hold of a bin, a contaminated bag bursting at the exact moment the compactor cycles, and the crew realizing together how their chain of reasonable decisions became a very public mess.

### Player fantasy

“We are the crew that knows this town.” Players should feel blue-collar competence, physical exertion, procedural judgment, and the camaraderie of making a difficult route look easy—until it is not. Mastery is expressed through route knowledge, communication, tool handling, safe improvisation, and knowing when a shortcut is worth its risk.

### Audience and session shape

- Players who enjoy cooperative work games, readable physics, light simulation, and stories created by mistakes.
- Accessible to casual groups; enough route planning and mechanical optimization for repeat crews.
- Target full-game session: 20–35 minute route, with 2–4 routes forming a 60–120 minute town shift.
- Solo remains supported through quick role switching and modest task simplification, but the long-term center is 2–5 player co-op.
- Tone: affectionate toward the work and workers; residents and municipal bureaucracy may be absurd, never contemptuous.

## 2. Design pillars

1. **Awkward, readable handling.** Waste has mass, shape, friction, swing, and bad grab points. The player understands why it moved even when it moved badly.
2. **Cooperation through interlocking responsibilities.** Driving, spotting, handling, sorting, operating the hopper, and navigating compete for attention without becoming rigid character classes.
3. **Legible cascading consequences.** A spill has a visible cause, gives a recovery window, creates a new task, and affects the town afterward.
4. **The route becomes knowledge.** Repeated streets reveal pickup patterns, access quirks, residents, shortcuts, and risks. Learning the town is a durable form of progression.
5. **Pressure with judgment, not pure speed.** The clock matters, but so do safety, truck condition, contamination, public trust, and whether the crew can finish what it starts.

## 3. Core gameplay

### Shift loop

1. Review route forecast, truck assignment, known exceptions, and town events.
2. Choose a route order and limited equipment.
3. Drive to a collection point and establish safe curb access.
4. Inspect, move, load, reject, or escalate the waste.
5. Manage hopper space, compaction, vehicle condition, spills, and traffic.
6. Adapt route plan as time and town conditions change.
7. Return, weigh out, review complaints/damage/misses, and spend earned budget.
8. Observe persistent town changes and prepare the next shift.

### Moment-to-moment interactions

- Walk, jog, brace, climb a step, enter/exit seats, point/ping, and call a hold.
- Grab bins at handles or body, tilt onto wheels, drag, push, lift, tip, shake, and release.
- Grab bags with variable integrity; dragging or crushing weak bags increases rupture chance.
- Use truck rails, bin lifter, hopper controls, compactor, warning lights, horn, broom, shovel, grabber, absorbent, cones, tags, and camera.
- Inspect a load visually; identify prohibited, hazardous, recyclable, or ambiguous items.
- Choose to collect, reject/tag, photograph/escalate, or separate contamination.
- Spot the driver around children, pets, cyclists, parked cars, low branches, and blind approaches.
- Recover from dropped waste, jammed mechanisms, blocked streets, truck damage, and angry residents.

Direct manipulation should use a small input vocabulary: look/aim, grab/release, primary tool action, secondary/bracing action, and contextual interact. Animation, audio, outline weight, and controller vibration communicate load and danger.

## 4. Systemic simulation

The simulation should be selective rather than exhaustive. Each modeled property must produce decisions or readable consequences.

### Waste objects

Core properties: mass, bulk, material family, contamination class, container integrity, wetness, sharpness, compressibility, grip points, and ownership/stop. Objects may nest inside containers. Bags obscure contents until torn or inspected closely. Oversized items have awkward centers of mass and collision shapes.

### Containers and collection points

Bins track lid state, wheel condition, fill, contamination visibility, and municipal ownership. Dumpsters track access clearance and lift compatibility. A stop knows its schedule, resident tolerance, curb geometry, access state, service rule, and history.

### Truck and hopper

- Capacity distinguishes loose volume from compacted volume; compaction trades time and noise for capacity.
- Hopper contents can jam, bridge, spill, leak, or contaminate an otherwise clean stream.
- Moving with an unsecured load raises spill and injury risk.
- Damage is localized enough to be understandable: mirror, lifter, warning light, tire, hopper, compactor.
- Fuel/charge is a route-scale constraint in the full game, not a second-to-second chore.

### World pressure

Traffic agents follow simple lanes and react to cones, the truck, and blocked sightlines. Residents and animals are lightweight event actors, not full life simulations. Weather changes grip, bag integrity, visibility, and weight. The route clock uses soft thresholds: late pickups increase traffic, resident impatience, disposal-site risk, and overtime cost rather than simply ending play.

### Consequence ladder

**Tell → threaten → occur → recover → persist.** Example: a hopper overfill gauge flashes; loose trash visibly rides high; a hard turn ejects a bag; the crew can cone and clean the street; the route loses time and the address gains complaint sensitivity. Catastrophic outcomes require multiple ignored warnings whenever possible.

## 5. Tools and vehicles

### Launch truck

A rear-loader with two rear riding steps, hopper, manual bin tip bar, compactor, warning lights, horn, camera, and limited cab seating. It is maneuverable enough for residential streets but has blind zones, overhang, braking distance, and a wide turn.

### Later vehicle families

- Side-loader: fast carts, driver-centric, poor with loose bags and bulky waste.
- Mini packer: tight alleys and old-town lanes, low capacity.
- Grapple/bulk truck: oversized collection, crane coordination, property-damage risk.
- Roll-off: dumpster delivery and pickup, clearance planning.
- Sweeper/support pickup: spill recovery, illegal-dumping investigation, special events.

### Crew tools

Gloves and tags are baseline. Unlockable or assignable tools include grabber, broom/shovel set, spill kit, cones, hand truck, straps, bolt cutters under policy, portable scale, inspection camera, and radio/tablet upgrades. Tools solve distinct problems and occupy limited truck storage.

## 6. Job and route types

- Residential cart route: the systemic baseline.
- Mixed bag-and-cart district: higher handling and rupture risk.
- Commercial alley route: dumpsters, clearance, locks, delivery conflicts.
- Bulky pickup day: couches, mattresses, appliances, improvised rigging.
- Recycling/organics: stricter contamination and public-trust stakes.
- Illegal dumping response: investigate, photograph, classify, then remove safely.
- Event cleanup: dense waste, pedestrians, hard closure time.
- Storm recovery: branches, soaked waste, blocked streets, dynamic priorities.

Routes combine authored street topology and rule sets with seeded stop conditions, traffic, items, resident quirks, and municipal events. Pure procedural streets would undermine town recognition, so geometry remains authored.

## 7. Progression, economy, and persistent town state

The crew earns a municipal operating budget from completed service, safety, cleanliness, diversion compliance, and overtime control. Money represents departmental allocation rather than personal extraction from residents.

### Unlocks

- Truck reliability, turning, capacity, work lights, camera, warning system, lifter, and compactor upgrades.
- Crew equipment and storage configurations.
- Dispatch intelligence: better route forecasts, known gate codes, resident notes, contamination history.
- Depot facilities: faster repairs, larger tool pool, training bay.
- Cosmetic truck liveries, patches, cab clutter, uniforms, horns, and depot decoration.

### Persistent consequences

Stops remember misses, damage, correct service, illegal dumping, and unresolved hazards. Neighborhood trust changes complaint tolerance and resident helpfulness. Repeated contamination can trigger education tags or enforcement; repeated good service can make access easier. Construction and business schedules change temporarily. Persistence should create context and repair opportunities, not permanent failure spirals.

No power upgrade should eliminate the need for handling or cooperation. Upgrades reduce friction, expose information, or widen recovery margins.

## 8. Multiplayer structure

Players are not locked to classes. The truck presents roles that can be claimed and left dynamically:

- **Driver:** positions, watches mirrors/camera, controls warning systems, calls movement.
- **Lead loader:** handles curbside waste and makes first collection call.
- **Hopper operator:** arranges loads, checks clearance, cycles compactor, catches jams.
- **Spotter/sorter:** manages traffic safety, contamination, tags, tools, and awkward lifts.
- **Route lead/floater:** reads the map and exceptions, handles residents, supports bottlenecks.

At two players, automation reduces control burden and both players handle waste. At three, driving/loading/hopper emerge naturally. Four and five players increase street safety, parallel handling, and route planning rather than raw object counts alone.

Coordination verbs: point/ping, “hold truck,” “clear,” contextual countdown, request tool, mark stop, and radio call. Critical calls have icon and light feedback so voice chat is helpful but not mandatory. Late joiners arrive at the next safe stop or depot transfer.

## 9. Failure and chaos states

Most failures are recoverable and scored, not run-ending:

- Dropped or burst bag → cone area, retrieve pieces, clean spill.
- Bin falls into hopper → emergency stop, reverse mechanism, retrieve/damage report.
- Compactor jam → lock out, inspect, reposition or call maintenance.
- Blocked curb → hand-carry, approach from another angle, defer, or document no access.
- Collision/property damage → secure scene, report, lose time/budget/trust.
- Contaminated collection → contamination meter, disposal penalty, possible cleanup.
- Skipped or late stop → complaint and persistent sensitivity.
- Over-capacity → re-plan disposal run or accept spill/jam risk.
- Crew separation → truck cannot move safely unless riders are clear or override risk is accepted.

Hard failure is reserved for severe unsafe operation, disabled truck, shift abandonment, or accessibility-selected strict clock modes. The result screen should tell the story of what happened and offer a clear rematch goal.

## 10. Town and shared universe

The launch town, **Bellwether**, is a compact municipal patchwork: Maple residential loop, Old Foundry alleys, downtown square, lakefront park, strip commercial road, school hill, transfer station, public works yard, and fringe roads prone to dumping. Each district has recognizable curb language, traversal constraints, residents, ambient sound, and waste patterns.

Bellwether can support other work-focused games through recurring places and departments: Department of Public Works green-and-amber markings, the Corner Market, Bellwether Hardware, school district vehicles, local radio WBLW, town council notices, and familiar residents. Lore appears through work orders, posted notices, environmental details, and radio chatter—never at the expense of route clarity.

## 11. Art direction

The visual target is an original early-2000s-console urban noir, using the working-class winter streets and oppressive nighttime mood associated with period crime games without copying their characters, assets, maps, branding, or exact compositions. Bellwether is dense, frozen, damp, and municipal: soot-dark brick walk-ups, metal fire escapes, narrow storefronts, alley steam, dirty snowbanks, salt-stained curbs, black wet asphalt, sodium-orange streetlights, and isolated fluorescent shop light.

Forms are chunky and deliberately low-detail, with strong silhouettes and low-resolution texture logic rather than clean modern vector minimalism. Color gradients are compressed; edges are hard; selective dithering, scanlines, grain, and imperfect reflections sell the period. The palette is asphalt navy, soot black, brick rust, dirty-snow gray, sodium amber, muted sanitation green, and sparse fluorescent lime. Warm color is reserved for work lights, route guidance, hazards, and occupied windows.

The truck must remain the most readable moving shape: cream cab at the true forward end, deep municipal-green body, amber beacons, red-and-amber rear hazard striping, hard shadow, and a broad headlight cone. Bins are dark green with pale municipal plates; tagged stops add rust red and amber paper. Traffic uses muted, era-appropriate sedan silhouettes. Interactions use restrained amber brackets, labels, and dashed safety rings that feel issued by the Bellwether Sanitation Authority.

The interface resembles aging dispatch hardware and municipal forms: black-green panels, stamped amber rules, condensed display type, monospaced procedural copy, clipped corners, numbered forms, radio language, and visible equipment state. It must feel diegetic without sacrificing instant readability. The title/menu uses original generated Bellwether key art; the playable route remains code-rendered Canvas art so weather, light, objects, and consequences stay responsive.

Atmosphere supports play rather than obscuring it. Sleet, steam, vignette, scanlines, slush, reflection streaks, and darkness sit behind or around critical silhouettes. Gameplay cues always outrank the noir grade. Reduced-motion mode suppresses scanlines and nonessential presentation motion.

## 12. Audio direction

The truck is an instrument: diesel idle/load, air brake, reverse alarm, hydraulic whine, metal resonance, compactor strain, body rattle, tire surfaces, and warning clicks. Waste materials have distinct impacts and scrapes. Audio telegraphs mass, grip failure, unsafe pressure, approaching traffic, and mechanical state before UI does.

Sparse regional radio, early-morning ambience, dogs, bins, residents, and birds ground the town. Music is light at depot/results and restrained during work; escalating systems provide the rhythm. Repetitive mandated alarms need independent volume control without removing their visual equivalents.

## 13. UI, UX, and accessibility

- Diegetic lights, gauges, controls, tags, and tablet first; minimal HUD reinforces what the world already shows.
- Always show route progress, clock pressure, truck capacity state, and current safety interlock.
- Prompts name the action and reason when unavailable (“Stop truck to compact”).
- Input remapping, controller support, hold/toggle options, aim assist, camera sensitivity/FOV, and left-handed layouts.
- Color-independent icons/patterns for waste class and hazards; high-contrast interaction mode.
- Scalable UI/subtitles, speaker labels, reduced camera shake, motion-blur off, reduced physics jitter, photosensitivity-safe warning lights.
- Audio category controls, alarm attenuation, visual sound indicators, and text/radial communication.
- Difficulty assists: relaxed clock, lower handling force, stronger grab stability, simplified contamination, traffic density, and solo automation. Assists are visible in score context but do not block progression.
- Browser slice supports keyboard and clickable decisions, responsive presentation, mute, reduced-motion preference, and descriptive canvas labeling. Gamepad/touch driving are post-slice.

## 14. Replayability and content generation

Replay comes from route mastery plus changing conditions, not randomized clutter alone. Authored stops expose variable envelopes: container mix, weight, contamination, blockage, resident event, access rule, and time window. Daily seeds combine these with traffic/weather/town events. Persistent address history weights future events.

Scoring has independent service, safety, cleanliness, compliance, and time dimensions so crews can pursue different mastery. Optional municipal contracts add constraints (“zero contamination,” “no overtime,” “training truck”). Weekly community scenarios can share a seed without requiring live-service infrastructure at launch.

## 15. First playable browser vertical slice

### Purpose

Test whether one route creates meaningful tension between safe handling, contamination judgment, capacity, positioning, and time—and whether mistakes remain legible and funny enough to invite a retry.

### Included through 0.9.0

- Three-screen, camera-tracked Maple District route with ten stops distributed across West Maple, Maple Crossing, and East Maple.
- Stops may be serviced in any order; the route strip shows district position and every unresolved/resolved stop without forcing a waypoint sequence.
- Two actual cross streets accept truck movement and introduce perpendicular traffic at district boundaries.
- Top-down drivable rear-loader with momentum, steering, boundaries, and damage collisions.
- Keyboard-controlled cab/street switching, on-foot walking, physical bin grabbing/releasing, curb-to-hopper transport, and empty-bin return.
- Stop inspection requires approaching on foot; a service decision authorizes the physical work instead of instantly collecting the stop.
- Player-controlled bin loading requires holding the lift and countering deterministic lateral sway; a stop resolves only after the empty bin returns to its address.
- Forgiving traffic impacts make the worker stumble, drop the bin, and lose a little time without death, reset, or an unrecoverable state.
- Two authored loose-waste proofs: a fragile commercial bag and an awkward soaked mattress, each tied to an address and required for full service.
- Unified grab/drop input for bins and loose waste; bag integrity reacts to hard moving drops, traffic, and truck contact.
- Bag rupture creates visible debris and a linked cleanup zone; cleanup produces a replacement bag so the route remains recoverable.
- Oversized-item grip stress rises while moving and turning, falls while still or braced with Shift, and causes a recoverable handling slip at its limit.
- Street waste reacts to the truck: bags can be crushed and oversized objects can be shoved with bodywork damage.
- Two contaminated loads: one obvious and one uncertain until a five-second closer inspection.
- Loose and compacted capacity, compactor stop interlock, cooldown, and capacity pressure.
- Four lane-traffic cars, two cross-street cars, three blocked-curb vehicles, and a utility-cut barrier that forces a readable lane chicane.
- Loose-load spill chance on collision, persistent cleanup zones, time-cost recovery action, damage and score penalties.
- 600-second shift tuned for the three-block physical route, mode-aware next-action guidance, scoring, missed-stop/complaint consequences, itemized results, pause, and restart.
- Dependency-free Web Audio soundscape: speed-responsive engine and filter, persistent idle, reverse alarm, compactor rumble, weight-sensitive footsteps, proximity traffic cues, winter wind, electrical hum, and existing consequence cues.
- Independent Truck, Street, and Effects gain buses with accessible range controls plus global mute; continuous layers ramp down in ready, result, and pause states.
- Deterministic shift seed, deterministic spill checks, and a structured event ledger covering route decisions and consequences.
- Corrected front-facing truck silhouette with cab, windshield, headlights, and explicit forward marker.
- Safe road-aligned spawn, road-only movement bounds, and lane-sensitive collision envelopes verified against the initial traffic positions.
- Original urban-noir title art and a complete PS2-era presentation pass across the page, route environment, weather, vehicles, bins, overlays, HUD, messaging, and social-preview metadata.

### Explicitly deferred

Multi-object bin contents, multiplayer/networking, procedural layouts, persistence, upgrades, resident actors, and touch/gamepad controls remain deferred. The next implementation milestone adds persistent address history, depot return, and a small upgrade economy.

## 16. Technical approach

### Browser slice

Plain HTML/CSS/JavaScript with a single Canvas 2D playfield, `requestAnimationFrame`, fixed design resolution scaled by CSS, keyboard/button input, generated Web Audio cues, and no dependencies or build step. The simulation currently uses variable timestep capped at 33 ms; move to a fixed 60 Hz simulation step before object physics grows.

The current implementation is intentionally one script for frictionless delivery. The extraction boundary is documented in `BUILD_PREP.md`; split modules only when the second route or automated tests begin. Runtime configuration should move from hard-coded templates into JSON after mechanics stabilize.

### Data and state architecture

The authoritative shift state contains phase, control mode, worker and truck state, horizontal camera position, route clock, score ledger, cargo, stop/bin positions and states, loose-waste position/type/integrity/stress state, traffic axes, static access obstacles, deterministic seed/RNG state, a structured event ledger, transient effects, and outcome counters. Stops progress through `waiting → authorized → loading → empty → awaiting-waste → collected`, with `tagged` as the alternate terminal state; loose waste progresses independently through `waiting → ready → carried/dropped → loaded`, with a recoverable `ruptured` branch. Audio reads authoritative state but never mutates simulation: continuous node parameters follow phase, mode, speed and proximity, while event cues use category buses. The 0.9.0 prototype records movement handoffs, handling events, waste failures, route decisions, and consequences; remaining live score mutations should move behind named commands/events so replays, networking, analytics, and tests can observe the same decisions.

Long-term persistence layers:

1. Profile: accessibility, cosmetics, unlocks.
2. Campaign town: route ratings, address histories, truck/tool condition, budget, events.
3. Shift snapshot: route seed, truck load, stop resolution, clock, consequences.
4. Ephemeral presentation: particles, audio, camera shake, prompts.

Save files should be versioned, migrated, and never store scene object references. Seeded variation plus an event log makes bugs and challenge routes reproducible.

### Browser-first production architecture

- Plain HTML/CSS/Canvas remains the canonical runtime. No Unity migration is planned.
- Split the current script into pure simulation, content definitions, input actions, Canvas presentation, DOM UI, audio, persistence, and tests once the visual pass stabilizes.
- Keep simulation at a fixed step and render independently so handling remains deterministic across refresh rates.
- Use low-resolution procedural texture tiles, small authored raster assets, and code-drawn dynamic objects; establish an asset budget before adding additional districts.
- Use Web Audio for layered vehicle and neighborhood sound, IndexedDB or versioned local storage for saves, and a service worker only when offline installation is a proven need.
- If multiplayer remains desirable after the solo route succeeds, evaluate authoritative WebSocket hosting with event/state snapshots. Do not let networking requirements delay the core tactile route.
- A future downloadable release may wrap the web build, but the browser version remains the source of truth.

## 17. Milestones

- **M0 — Route proof (complete foundation):** solo browser loop, route decisions, capacity, hazards, and scoring.
- **M1 — Tactile proof (implemented foundation):** on-foot loader, full bin service, physical bag and mattress, rupture/recovery, grip stress, and traffic/truck interference.
- **M2 — Browser route expansion (implemented foundation):** three scrolling Bellwether blocks, ten stops, route-order choice, drivable intersections, richer traffic, and access obstacles.
- **M3 — Atmosphere proof (implemented foundation):** responsive vehicle, footstep, traffic, weather, and neighborhood audio with independent category controls.
- **M4 — Progression proof (current):** depot, three shifts, persistent addresses, truck/tool upgrade, and complaint recovery.
- **M5 — Solo validation:** polish, accessibility baseline, performance validation, and observed evidence that the forgiving solo route is understandable and worth replaying.
- **M6 — Multiplayer gate:** only after M5 passes, build a narrow driver/loader authority test and record a multiplayer go/no-go decision.

Exit criteria and task ordering are in `BUILD_PREP.md`.

## 18. Risks and mitigations

| Risk | Why it matters | Mitigation / earliest test |
|---|---|---|
| Physics feels random | Unreadable failure kills mastery | Constrain degrees of freedom, strong contact audio, slow-motion debug capture; M1 |
| Driver waits while others have fun | Role imbalance harms co-op | Frequent positioning choices, spotting tools, cab controls, quick seat exit; M2 |
| Loader work becomes repetitive | Core loop lacks variation | Waste shape/material, access, coordination and judgment—not more button timing; M1/M2 |
| Networked physics cost/instability | Central technical threat | Two-player latency greybox before content; object aggregation and host authority; M2 |
| Chaos overwhelms objectives | Players cannot learn | One new hazard at a time, causal feedback, recovery windows, intensity budget |
| Simulation scope explodes | Delays playable quality | Every property must support a decision; cut invisible realism |
| Solo design distorts co-op | Prototype optimizes wrong fantasy | Treat solo as input testing; begin two-player proof early |
| Tone mocks workers or residents | Undermines setting | Humor from systems; consult sanitation workers during M1–M3 |
| Motion/audio discomfort | Truck, weather, scanlines, and alarms can fatigue | Reduced-motion/noise options and layered audio controls |

## 19. Decisions and open questions

### Decisions made

- Rear-loader residential route is the launch baseline.
- Bellwether and DPW green/amber form the shared-universe anchor.
- Roles are stations/responsibilities, not locked classes.
- Persistence records address relationships and consequences but offers repair paths.
- Time is usually soft pressure; severe safety failures, not ordinary lateness, create hard stops.
- The browser slice uses a drivable top-down truck rather than nodes to test positioning and collisions.
- Contamination is a readable choice in the first slice, not a hidden trivia test.
- No build step or third-party assets for the first browser deliverable.

### Open questions to test

1. Does exiting the cab and returning every empty bin add satisfying work rhythm, or too much repetition?
2. Does contamination produce judgment or merely an obvious correct answer? Test ambiguous/mixed cases next.
3. How much capacity information should be exact versus physical/approximate?
4. Can the driver remain engaged during longer loading and cleanup tasks?
5. Which consequences are funniest without feeling punitive or disrespectful?
6. Does free role switching create clarity, or should crews choose recommended stations at route start?
7. How much small debris can be simulated/networked before aggregation becomes necessary?
8. Is a 20–35 minute route right for repeat co-op sessions?

## 20. Next implementation tasks

The active sequence is intentionally solo-first and will be completed in this order:

1. Add versioned local persistence for address history, complaints, depot return, and a small truck/tool upgrade choice.
2. Run and tune repeated solo playtests for interaction clarity, forgiving chaos, route duration, audio fatigue, and voluntary retry.
3. Only after the solo loop passes, build a minimal two-player authority/role test and make an evidence-based multiplayer go/no-go decision.

Cross-cutting work: move score mutations into event reducers, add named input actions/remapping, split simulation/render/audio/persistence modules when route expansion begins, and schedule sanitation-worker interviews before locking handling or consequence tone.
