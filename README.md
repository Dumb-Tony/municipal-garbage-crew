# Municipal Garbage Crew

A living design package and standalone browser vertical slice for a tactile, systemic sanitation-route game.

> **Play online:** [Launch Municipal Garbage Crew](https://dumb-tony.github.io/municipal-garbage-crew/)

## Play

Open `prototype/index.html` in a modern desktop browser. No install, server, or build step is required.

Drive with **WASD** or **arrow keys**. Stop beside a highlighted curb bin and press **Space** to inspect it. Press **E** to collect, **R** to tag and skip contaminated waste, and **Q** to examine uncertain contents. Press **C** to compact while stopped, **X** to clean a nearby spill, and **P** to pause. Press **M** to mute and **Enter** to restart after a shift.

## Project map

- `prototype/` — playable Canvas prototype
- `docs/GDD.md` — living game design document and decision log
- `docs/BUILD_PREP.md` — backlog, milestones, specifications, acceptance criteria, and QA
- `docs/PLAYTEST.md` — lightweight playtest form

## Current slice

Version `0.3.0` implements a single-player, one-screen neighborhood route. It adds corrected truck orientation, contextual action guidance, an uncertain contamination inspection, recoverable spill cleanup, pause/focus safety, deterministic shift events, and an itemized score report to the existing six-stop driving, capacity, compaction, traffic, collision, and consequence loop.

## Repository and publishing policy

- Canonical local checkout: `C:\Dev\municipal-garbage-crew`
- Primary branch: `main`
- Public repository name: `municipal-garbage-crew`
- The browser prototype is published with GitHub Pages from the `main` branch root; the root page forwards directly into `prototype/`.
- The living GDD and implementation plans remain versioned with the source.
- Secrets, credentials, machine-specific files, dependencies, and generated junk must not be committed.
