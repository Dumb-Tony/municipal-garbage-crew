# Municipal Garbage Crew

A living design package and standalone browser vertical slice for a tactile, systemic sanitation-route game.

> **Play online:** [Launch Municipal Garbage Crew](https://dumb-tony.github.io/municipal-garbage-crew/)

## Play

Open `prototype/index.html` in a modern desktop browser. No install, server, or build step is required.

Drive and walk with **WASD** or **arrow keys**. Stop near a curb and press **F** to exit the truck. On foot, press **Space** to inspect or load and **E** to grab/release bins, bags, and oversized waste. Hold **Space** with **A/D** to balance a bin lift; hold **Shift** to brace an awkward oversized item. Return empty bins to their amber markers. Use **R** to tag contamination, **Q** to check uncertain waste, **C** to compact, **X** to recover spills or ruptured bags, and **P** to pause.

## Project map

- `prototype/` — playable Canvas prototype
- `docs/GDD.md` — living game design document and decision log
- `docs/ART_DIRECTION.md` — canonical visual language, palette, lighting, UI, and asset rules
- `docs/BUILD_PREP.md` — backlog, milestones, specifications, acceptance criteria, and QA
- `docs/PLAYTEST.md` — lightweight playtest form

## Current slice

Version `0.8.0` expands the hands-on route into three scrolling Maple District blocks with ten freely ordered stops, a camera-following world, an always-visible route strip, two drivable cross streets, cross traffic, several blocked curbs, and a lane-blocking utility chicane. The fragile bag, soaked mattress, physical bin work, contamination, capacity, compaction, and recoverable chaos remain integrated across the longer route. The game remains browser-first; Unity is not part of the plan.

## Repository and publishing policy

- Canonical local checkout: `C:\Dev\municipal-garbage-crew`
- Primary branch: `main`
- Public repository name: `municipal-garbage-crew`
- The browser prototype is published with GitHub Pages from the `main` branch root; the root page forwards directly into `prototype/`.
- The living GDD and implementation plans remain versioned with the source.
- Secrets, credentials, machine-specific files, dependencies, and generated junk must not be committed.
