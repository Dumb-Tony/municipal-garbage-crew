# Municipal Garbage Crew — Visual Direction

**Target:** original early-2000s-console urban noir  
**Canonical build:** browser / HTML / CSS / Canvas  
**Visual baseline:** 0.5.0

## Visual thesis

Bellwether should look like the city has been awake all night and the sanitation crew is arriving before anyone admits morning has started. The world is cold, wet, salt-stained, underfunded, and still worth taking care of. The presentation borrows broad period qualities from gritty PS2-era crime games—chunky geometry, pre-rendered mood, compressed gradients, low-resolution texture logic, and hard pools of light—without copying any existing characters, locations, assets, layouts, or branding.

The noir is environmental, not criminal cosplay. Work lights, reflective tape, hydraulic machinery, blocked curbs, municipal forms, and the lonely routine of a pre-dawn route provide the drama.

## Bellwether street kit

- Soot-dark brick walk-ups with mismatched windows and external fire escapes.
- Narrow delis, laundromats, bars, hardware stores, and municipal storefronts.
- Dirty snowbanks, gray slush, salt residue, frozen bags, and black wet asphalt.
- Sodium-orange streetlamps, cream truck headlights, isolated warm windows, and sparse fluorescent green storefronts.
- Alley steam, sleet, puddle bands, overhead wires, hydrants, battered signs, and metal shutters.
- Era-neutral municipal vehicles and muted late-1990s/early-2000s sedan silhouettes.

## Palette

| Role | Color | Use |
|---|---|---|
| Soot black | `#080a0d` | page, shadows, deepest panels |
| Asphalt navy | `#0d1217` | roadway and cool environmental shadow |
| Brick rust | `#442c28` | dominant masonry family |
| Dirty snow | `#777a75` | slush banks and cold highlights |
| Sodium amber | `#e99b32` | work lights, prompts, route guidance |
| Municipal green | `#344b3b` | truck body, bins, department identity |
| Fluorescent lime | `#809255` | rare storefront/radio accents |
| Contamination red | `#a54131` | violations, danger, damage |
| Paper cream | `#d9d4c6` | primary readable copy and cab paint |

Amber is the interaction color. Red is reserved for an actual consequence or unsafe state. Green identifies municipal equipment and successful capacity state. Bright cream belongs to text, snow glare, cab paint, and headlights.

## Shape and texture rules

- Build silhouettes from large rectangular or trapezoidal masses before adding detail.
- Prefer four useful surface marks over forty decorative marks.
- Quantize gradients and reflections into hard bands; avoid glossy modern rendering.
- Keep windows, fire escapes, tires, bins, mirrors, and hazard bars slightly oversized for readability.
- Texture should suggest low-resolution baked material: blocky rust, salt lines, soot, faded paint, and ordered dither.
- Vehicles receive a hard offset shadow and one dominant light-facing plane.
- Weather and grain never cover interaction outlines, labels, meters, or the truck cab.

## Lighting hierarchy

1. Truck headlights and amber beacons.
2. Active curb-stop highlight or hazard ring.
3. Streetlamp pool and storefront spill.
4. Occupied windows and wet-road reflections.
5. Ambient blue-black sky and building mass.

No scene should contain more than two competing bright environmental pools. The player truck remains identifiable when converted to grayscale.

## Interface language

The interface is Bellwether Sanitation Authority hardware and paperwork, not a modern game dashboard.

- Condensed uppercase display type for headings and scores.
- Monospaced procedural copy for controls, radio messages, timers, and form labels.
- Black-green panels, worn steel rules, clipped corners, amber status lamps, and rust-red warnings.
- Copy uses dispatch language: `BSA // ROUTE 04`, `NO ACCESS`, `ROAD HAZARD`, `HYDRAULIC LIFT`, `DISPATCH`.
- Prompts remain short, centered, and high contrast. Diegetic flavor never hides the required key.

## Motion and atmosphere

- Sleet moves diagonally at two speeds; a small number of snow flecks drifts more slowly.
- Steam uses broad, translucent shapes and slow lateral distortion.
- Beacon rhythm is strong but not stroboscopic.
- Handling shake is brief and event-driven.
- Scanlines and vignette are subtle framing devices. Reduced-motion mode removes nonessential presentation motion and scanlines.

## Asset policy

Dynamic gameplay objects and the street remain code-rendered so lighting, weather, damage, interaction states, and consequences can change instantly. Raster art is reserved for title/menu presentation, promotional imagery, and later low-resolution texture tiles.

The 0.5.0 title backdrop was generated with the built-in image generator, then style-transformed into blockier PS2-era pre-rendered art. The final asset contains no text, logos, existing game characters, or copied locations; HTML provides all branded typography.

## Do / do not

**Do:** bleak winter dawn, dense urban detail, chunky silhouettes, municipal specificity, readable amber work cues, baked-light atmosphere, visible wear.

**Do not:** photorealistic gameplay, cyberpunk neon overload, modern glass UI, clean suburban lawns, parody police-noir tropes, illegible darkness, copied period-game compositions, or visual noise over objectives.

