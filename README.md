# Municipal Garbage Crew

A living design package and standalone browser vertical slice for a tactile, systemic sanitation-route game.

> **Play online:** [Launch Municipal Garbage Crew](https://dumb-tony.github.io/municipal-garbage-crew/)

## Play

Open `prototype/index.html` in a modern desktop browser. No install, server, or build step is required.

Drive with **WASD** or **arrow keys**. Stop beside a highlighted curb bin and press **Space** to inspect it. Press **E** to collect, **R** to tag and skip contaminated waste, and **Q** to examine uncertain contents. While loading, hold **Space** and counter the bin's sway with **A/D** or the arrow keys. Press **C** to compact while stopped, **X** to clean a nearby spill, and **P** to pause. Press **M** to mute and **Enter** to restart after a shift.

## Project map

- `prototype/` — playable Canvas prototype
- `docs/GDD.md` — living game design document and decision log
- `docs/ART_DIRECTION.md` — canonical visual language, palette, lighting, UI, and asset rules
- `docs/BUILD_PREP.md` — backlog, milestones, specifications, acceptance criteria, and QA
- `docs/PLAYTEST.md` — lightweight playtest form

## Current slice

Version `0.5.0` establishes the production visual target: an original early-2000s-console urban-noir Bellwether with a cinematic title screen, frozen brick district, wet-road reflections, slush, fire escapes, storefront light, steam, sleet, chunky vehicles, and a diegetic sanitation-authority HUD. The game remains browser-first; Unity is no longer part of the plan.

## Repository and publishing policy

- Canonical local checkout: `C:\Dev\municipal-garbage-crew`
- Primary branch: `main`
- Public repository name: `municipal-garbage-crew`
- The browser prototype is published with GitHub Pages from the `main` branch root; the root page forwards directly into `prototype/`.
- The living GDD and implementation plans remain versioned with the source.
- Secrets, credentials, machine-specific files, dependencies, and generated junk must not be committed.
