# Municipal Garbage Crew

A living design package and standalone browser vertical slice for a tactile, systemic sanitation-route game.

> **Play online:** The public GitHub Pages link is added here immediately after the repository is created and its account-owned URL is known.

## Play

Open `prototype/index.html` in a modern desktop browser. No install, server, or build step is required.

Drive with **WASD** or **arrow keys**. Stop beside a highlighted curb bin and press **Space** to inspect it. Press **E** to collect, **R** to tag and skip contaminated waste, and **C** to compact while nearly stopped. Press **M** to mute and **Enter** to restart after a shift.

## Project map

- `prototype/` — playable Canvas prototype
- `docs/GDD.md` — living game design document and decision log
- `docs/BUILD_PREP.md` — backlog, milestones, specifications, acceptance criteria, and QA
- `docs/PLAYTEST.md` — lightweight playtest form

## Current slice

Version `0.2.0` implements a single-player, one-screen neighborhood route. It is intentionally small: six stops, two contamination decisions, moving traffic, a blocked curb, truck capacity/compaction management, spills and collision penalties, route-time scoring, complaints, deterministic shift events, and a results screen.

## Repository and publishing policy

- Canonical local checkout: `C:\Dev\municipal-garbage-crew`
- Primary branch: `main`
- Public repository name: `municipal-garbage-crew`
- The browser prototype is published with GitHub Pages from the `main` branch root; the root page forwards directly into `prototype/`.
- The living GDD and implementation plans remain versioned with the source.
- Secrets, credentials, machine-specific files, dependencies, and generated junk must not be committed.
