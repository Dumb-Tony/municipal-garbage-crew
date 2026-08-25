# Municipal Garbage Crew — Living Game Design Document

**Status:** Active preproduction / browser slice 0.4.1
**Last updated:** 2026-08-25  
**Product direction:** 2–5 player cooperative 3D Unity/Steam game  
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

Stylized, chunky 3D with grounded proportions and slightly exaggerated interaction affordances. Surfaces are weathered but colors remain cleanly grouped: DPW green, safety amber, warm residential neutrals, dark asphalt, contamination red. Silhouettes distinguish waste classes at a glance. Hands, handles, hopper danger zones, traffic approach, and interactable controls receive restrained highlights.

Physics animation should feel heavy and imperfect, supported by authored poses and procedural IK. Avoid ragdoll noise as the default joke. Camera: close third-person while handling, wider/context-sensitive near the truck, with aggressive occlusion management and comfort options.

The browser slice translates this into a municipal field-manual graphic style: flat colors, crisp shapes, compact typography, and no external assets.

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

### Included through 0.4.0

- One-screen Maple Street route with six stops.
- Top-down drivable rear-loader with momentum, steering, boundaries, and damage collisions.
- Stop proximity and speed gating; player-controlled bin loading that requires holding the lift and countering deterministic lateral sway.
- Two contaminated loads: one obvious and one uncertain until a five-second closer inspection.
- Loose and compacted capacity, compactor stop interlock, cooldown, and capacity pressure.
- Two moving traffic cars and one blocked-curb obstacle.
- Loose-load spill chance on collision, persistent cleanup zones, time-cost recovery action, damage and score penalties.
- 180-second shift, next-action guidance, scoring, missed-stop/complaint consequences, itemized results, pause, restart, and minimal generated audio.
- Deterministic shift seed, deterministic spill checks, and a structured event ledger covering route decisions and consequences.
- Corrected front-facing truck silhouette with cab, windshield, headlights, and explicit forward marker.
- Safe road-aligned spawn, road-only movement bounds, and lane-sensitive collision envelopes verified against the initial traffic positions.

### Explicitly deferred

On-foot avatar, direct grab physics, multiple waste objects per bin, multiplayer/networking, procedural layouts, persistence, upgrades, resident actors, touch/gamepad controls, and 3D presentation. These are not required to validate the first decision loop.

## 16. Technical approach

### Browser slice

Plain HTML/CSS/JavaScript with a single Canvas 2D playfield, `requestAnimationFrame`, fixed design resolution scaled by CSS, keyboard/button input, generated Web Audio cues, and no dependencies or build step. The simulation currently uses variable timestep capped at 33 ms; move to a fixed 60 Hz simulation step before object physics grows.

The current implementation is intentionally one script for frictionless delivery. The extraction boundary is documented in `BUILD_PREP.md`; split modules only when the second route or automated tests begin. Runtime configuration should move from hard-coded templates into JSON after mechanics stabilize.

### Data and state architecture

The authoritative shift state contains phase, route clock, score ledger, truck state/cargo, stops, hazards, deterministic seed/RNG state, a structured event ledger, transient effects, and outcome counters. Definitions (stop templates, truck tuning, contamination rules) remain separate from runtime instances. The 0.4.0 prototype records major route and handling events and presents an itemized final score; remaining live score mutations should move behind named commands/events (`InspectStop`, `CollectLoad`, `Compact`, `Collision`, `ResolveStop`) so replays, networking, analytics, and tests can observe the same decisions.

Long-term persistence layers:

1. Profile: accessibility, cosmetics, unlocks.
2. Campaign town: route ratings, address histories, truck/tool condition, budget, events.
3. Shift snapshot: route seed, truck load, stop resolution, clock, consequences.
4. Ephemeral presentation: particles, audio, camera shake, prompts.

Save files should be versioned, migrated, and never store scene object references. Seeded variation plus an event log makes bugs and challenge routes reproducible.

### Unity migration

- Use ScriptableObjects for immutable waste, tool, vehicle, stop, and route definitions; plain serializable C# records for runtime/save state.
- Keep authoritative rules in a simulation assembly without MonoBehaviour dependencies. Presentation listens to domain events.
- Start with Unity's Input System, Cinemachine, physics layers, and configurable joints; evaluate Netcode for GameObjects versus an alternative only after a two-player greybox test.
- Server/host authority owns grabs, hopper contents, truck motion, compactor, score, and stop resolution. Clients predict cosmetic hands and local interaction highlighting; do not predict destructive compactor outcomes.
- Network objects at container/large-item granularity. Aggregate settled small debris where possible. Use ownership transfer sparingly and explicit interaction locks for shared grabs.
- Build the truck as coupled systems: locomotion, seats/riders, hopper, cargo volume, controls, damage, audio, and replication. Avoid one monolithic vehicle script.
- Validate 2-player network physics with latency simulation before expanding route content. Browser code is a rules sketch, not code intended for porting line by line.

## 17. Milestones

- **M0 — Route proof (current):** solo browser loop, six stops, decisions, capacity, hazards, scoring.
- **M1 — Tactile proof:** on-foot loader, grab/tilt/tip one bin, individual bag, spill recovery, better collision rules.
- **M2 — Cooperation proof:** two-player greybox, driver/loader handoff, safe-move call, shared bin, hopper operator.
- **M3 — Route proof in Unity:** Maple block in 3D, rear-loader, 8–12 variable stops, traffic, results and replay seed.
- **M4 — Progression proof:** depot, three shifts, persistent addresses, truck/tool upgrade, complaint recovery.
- **M5 — Vertical slice:** polished district, 2–5 players, accessibility baseline, Steam session flow, performance and network validation.

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
| Motion/audio discomfort | Truck and alarms can fatigue | Accessibility settings built alongside first 3D camera/audio |

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

1. Is driving plus contextual curb interaction satisfying enough before on-foot handling exists?
2. Does contamination produce judgment or merely an obvious correct answer? Test ambiguous/mixed cases next.
3. How much capacity information should be exact versus physical/approximate?
4. Can the driver remain engaged during longer loading and cleanup tasks?
5. Which consequences are funniest without feeling punitive or disrespectful?
6. Does free role switching create clarity, or should crews choose recommended stations at route start?
7. How much small debris can be simulated/networked before aggregation becomes necessary?
8. Is a 20–35 minute route right for repeat co-op sessions?

## 20. Next implementation tasks

1. Run five short playtests of 0.4.0; record completion rate, first intentional service, handling slips, first collision, compactor use, decision errors, spill recovery, and whether players retry.
2. Move remaining score mutations into event reducers; the 0.3 report is auditable, but the reducer remains the replay-safe architecture target.
3. Add keyboard remapping and gamepad input abstraction.
4. Add a short animated cleanup state and limited cleanup-kit supply to deepen spill recovery.
5. Split simulation, input, renderer, audio, content, and UI modules; add rule tests.
6. Build the M1 Unity handling sandbox: one avatar, one wheeled bin, one hopper, one bag, one curb.
7. Schedule sanitation-worker interviews before locking handling, terminology, safety procedures, or consequence tone.
