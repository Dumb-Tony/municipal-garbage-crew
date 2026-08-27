# Municipal Garbage Crew

A living design package and standalone browser vertical slice for a tactile, systemic sanitation-route game.

> **Play online:** [Launch Municipal Garbage Crew](https://dumb-tony.github.io/municipal-garbage-crew/)

## Play

Open `prototype/index.html` in a modern desktop browser. No install, server, or build step is required. The public HTTPS build also installs as a standalone browser app and caches the complete current route for offline play; use **Install game** when the browser exposes it, or the browser’s install-app menu.

Drive and walk with **WASD** or **arrow keys**. Stop near a curb and press **F** to exit the truck. On foot, press **Space** to inspect or load and **E** to grab/release bins, bags, and oversized waste. Hold **Space** with **A/D** to balance a bin lift; hold **Shift** to brace an awkward oversized item. Return empty bins to their amber markers. Use **R** to tag contamination, **Q** to check uncertain waste, **C** to compact, **X** to recover spills or ruptured bags, and **P** to pause.

## Project map

- `prototype/` — playable Canvas prototype
- `docs/GDD.md` — living game design document and decision log
- `docs/ART_DIRECTION.md` — canonical visual language, palette, lighting, UI, and asset rules
- `docs/BUILD_PREP.md` — backlog, milestones, specifications, acceptance criteria, and QA
- `docs/PLAYTEST.md` — lightweight playtest form

## Current slice

Version `0.18.0` makes route recovery safer and more keyboard-first. Enter starts the selected contract from the depot. End Shift now freezes the route behind an explicit consequence preview, defaults focus to Keep Working, cancels with Escape, and only files missed stops after a second deliberate action. The generated report records requested, cancelled, and confirmed early closures. Installable offline play, three contracts, fixed-step handling, progression, and remappable keyboard actions remain intact. The game remains browser-first; Unity is not part of the plan.

Run `npm test` to verify the offline shell manifest, contract content, fixed-step timing, input mapping, scoring, campaign bounds, address history, and stop-state invariants. No install or build step is required.

## Repository and publishing policy

- Canonical local checkout: `C:\Dev\municipal-garbage-crew`
- Primary branch: `main`
- Public repository name: `municipal-garbage-crew`
- The browser prototype is published with GitHub Pages from the `main` branch root; the root page forwards directly into `prototype/`.
- The living GDD and implementation plans remain versioned with the source.
- Secrets, credentials, machine-specific files, dependencies, and generated junk must not be committed.
