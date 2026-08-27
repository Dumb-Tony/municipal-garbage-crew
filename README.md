# Municipal Garbage Crew

A living design package and standalone browser vertical slice for a tactile, systemic sanitation-route game.

> **Play online:** [Launch Municipal Garbage Crew](https://dumb-tony.github.io/municipal-garbage-crew/)

## Play

Open `prototype/index.html` in a modern desktop browser. No install, server, or build step is required.

Drive and walk with **WASD** or **arrow keys**. Stop near a curb and press **F** to exit the truck. On foot, press **Space** to inspect, **E** to grab or release a bin, then wheel it to the rear hopper. Hold **Space** and counter its sway with **A/D** while loading; grab the empty bin and return it to the amber curb marker. Use **R** to tag contamination, **Q** to check uncertain waste, **C** to compact, **X** to clean spills, and **P** to pause.

## Project map

- `prototype/` — playable Canvas prototype
- `docs/GDD.md` — living game design document and decision log
- `docs/ART_DIRECTION.md` — canonical visual language, palette, lighting, UI, and asset rules
- `docs/BUILD_PREP.md` — backlog, milestones, specifications, acceptance criteria, and QA
- `docs/PLAYTEST.md` — lightweight playtest form

## Current slice

Version `0.6.0` adds the first complete hands-on service loop to the established early-2000s-console urban-noir visual target. The player now leaves the cab, walks the street, inspects and wheels physical bins, loads them at the rear hopper, survives recoverable traffic stumbles, and must return each empty bin before the address counts as serviced. The game remains browser-first; Unity is not part of the plan.

## Repository and publishing policy

- Canonical local checkout: `C:\Dev\municipal-garbage-crew`
- Primary branch: `main`
- Public repository name: `municipal-garbage-crew`
- The browser prototype is published with GitHub Pages from the `main` branch root; the root page forwards directly into `prototype/`.
- The living GDD and implementation plans remain versioned with the source.
- Secrets, credentials, machine-specific files, dependencies, and generated junk must not be committed.
