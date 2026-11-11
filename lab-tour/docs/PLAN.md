# Lab Tour — plan

## Whole floor first, or room by room?

**Both, in that order: the whole floor as a light skeleton first, then the
detail room by room inside it.**

Why not start with one finished room:

1. **The rooms share decisions that can only be made once.** Scale, wall
   heights, door positions, the corridor, camera angle, lighting, labels,
   navigation, how much the scene may cost to draw. Six rooms built separately
   make those decisions six times, and they do not match when put together.
2. **The first thing a visitor sees is the whole floor.** That view needs all
   six rooms to exist, even if most of them are sparse. A complete but simple
   lab can be shown to people; one perfect room on its own cannot.
3. **Placeholders are cheap and useful.** A blue volume of the right size shows
   whether a machine fits its bench and leaves the door clear before any time is
   spent modelling it, and it keeps the remaining work visible.
4. **The expensive part is the machine models,** and that part really is done
   room by room — in any order, without touching the building again.

So the floor is built once, as data that is easy to change, and each room is
then filled in by editing a list.

## Where it stands

| Phase | What | State |
|---|---|---|
| 0 | Foundations: one unit system, importer for the asset library, furniture kit, floor plan as data, automatic checks | ✅ done |
| 1 | The whole floor, walkable: building, six furnished rooms, overview → room → machine, shareable links, phone layout | ✅ done |
| 2 | Make it true: real floor plan, real equipment list, real name | ⏳ needs your input |
| 3 | Room by room: replace placeholders with models | next |
| 4 | The rest of the concept's interface | later |
| 5 | Atmosphere | later |
| 6 | Launch | later |

### Phase 2 — make it true

Two things in the tour are educated guesses and are marked as such in the files:

- **The floor plan** (13.8 × 10.2 m, two rows of rooms 4 m deep, a 2.2 m
  corridor) was read off the concept image. → `js/shell/layout.js`
- **Every "planned" machine** — its name, its size and which room it is in — is
  what a lab with these six rooms typically runs, not your equipment list.
  → `js/rooms/catalogue.js`, `js/rooms/content.js`

Needed from you: room sizes (a sketch with dimensions is enough), and for each
room the machines in it with make and model. Sizes can be looked up from the
datasheets.

### Phase 3 — room by room

For each room: confirm its equipment list → model the machines in the asset
library → import → switch the catalogue entry from `planned` to `built` → add
the room's own touches. A room is done when it has no blue volumes left.

Suggested order:

1. **Printing Room** — one printer model fills three places, and the room sits
   in the middle of the picture. Best result for the least modelling.
2. **Ceramic Room** — its three furnaces are done; four small bench units
   finish the room.
3. **Plaster Room** — five machines, all simple shapes.
4. **Acrylic & Prosthodontic Room** — the largest backlog (six types).
5. **Clinic Reception** — mostly furniture and atmosphere; one scanner cart.

The Design Room already has all four of its machines.

### Phase 4 — the rest of the concept's interface

In the concept image and not built yet:

- **Equipment list** — every machine in one searchable list (the data exists).
- **Workflow** — the path of a case through the rooms, drawn on the floor.
- **Per-machine content** — "Explore features" and "See how it works". Needs
  text (and optionally steps tied to the exploded parts) for each machine.
- Compass, "About", and the left-hand navigation that ties these together.

### Phase 5 — atmosphere

Technicians, the skyline behind the clinic windows, surface textures, glowing
ring markers. Deliberately last: these make the picture richer but do not
change what the tour can do, and people in particular are costly to do well.

### Phase 6 — launch

A link from wherever the tour should be reached, the real name in the header,
a preview image for sharing, a test on real phones (so far it has only been
tested in an emulated phone browser), and the header rules described in the
README.

## Inventory

30 machines are placed: **7 are 3D models, 23 are placeholders** (19 different
types to model). Sizes are width × depth × height in mm.

### Design Room — CAD Design & Planning · 5.2 × 4.0 m

| Machine | State | Size |
|---|---|---|
| SHINING 3D AutoScan DS-EX Pro | ✅ 3D model | 394 × 527 × 360 as placed |
| DS-EX Post-Processing PC | ✅ 3D model | 597 × 343 × 410 |
| 3Shape E4 | ✅ 3D model | 374 × 337 × 336 |
| 3Shape Design & Post-Processing PC | ✅ 3D model | 597 × 343 × 410 |

Furniture: the library's scanner table, three CAD desks with two monitors each,
eight chairs, wall display, shelf rack, plant.

### Printing Room — 3D Printing · 4.0 × 4.0 m

| Machine | State | Size (draft) |
|---|---|---|
| Resin 3D printer × 3 | ◻ placeholder | 400 × 400 × 580 |
| Print wash station | ◻ placeholder | 270 × 300 × 360 |
| UV post-curing unit | ◻ placeholder | 270 × 270 × 350 |

Furniture: 3.0 m and 1.8 m benches, island bench, shelf rack.

### Clinic Reception — Patient Care · 4.6 × 4.0 m

| Machine | State | Size (draft) |
|---|---|---|
| Intraoral scanner cart | ◻ placeholder | 480 × 480 × 1250 |

Furniture: reception desk, chair, sofa, shelf rack, two plants.

### Plaster Room — Model Preparation · 5.2 × 4.0 m

| Machine | State | Size (draft) |
|---|---|---|
| Model trimmer | ◻ placeholder | 330 × 420 × 340 |
| Vacuum mixer | ◻ placeholder | 200 × 260 × 560 |
| Plaster vibrator | ◻ placeholder | 260 × 190 × 120 |
| Pin drilling unit | ◻ placeholder | 200 × 250 × 320 |
| Sink with plaster trap | ◻ placeholder | 800 × 600 × 900 |

Furniture: 2.8 m bench, island bench, three racks of models.

### Ceramic Room — Ceramic Work · 3.6 × 4.0 m

| Machine | State | Size |
|---|---|---|
| Zubler Vario 200 | ✅ 3D model | 356 × 467 × 588 |
| UPCERA A7+ | ✅ 3D model | 398 × 423 × 600 |
| Ivoclar Programat P300 | ✅ 3D model | 396 × 382 × 323 |
| Micromotor & handpiece | ◻ placeholder | 120 × 240 × 90 (draft) |
| Steam cleaner | ◻ placeholder | 260 × 320 × 420 (draft) |
| Fine blasting unit | ◻ placeholder | 400 × 300 × 450 (draft) |
| Ultrasonic cleaner | ◻ placeholder | 270 × 180 × 230 (draft) |

Furniture: the library's furnace table, technician's bench with chair, 1.8 m bench.

### Acrylic & Prosthodontic Room — Final Prosthesis · 5.0 × 4.0 m

| Machine | State | Size (draft) |
|---|---|---|
| Boil-out / dewaxing unit | ◻ placeholder | 460 × 400 × 420 |
| Hydraulic flask press | ◻ placeholder | 260 × 260 × 520 |
| Pressure polymerisation unit | ◻ placeholder | 330 × 330 × 400 |
| Vacuum / pressure former | ◻ placeholder | 320 × 360 × 480 |
| Polishing lathe with dust hood | ◻ placeholder | 620 × 420 × 460 |
| Dust extractor | ◻ placeholder | 230 × 560 × 580 |
| Micromotor & handpiece × 2 | ◻ placeholder | 120 × 240 × 90 |

Furniture: 3.4 m bench, technicians' benches with chairs.

## What was found in the asset library

The seven machines and the workbench were imported unchanged; the importer
measures each one. Three things worth knowing:

1. **DS-EX Pro is about twice as wide and deep as stated.** The library gives
   the real machine as 260 × 270 × 420 mm; the model measures 470 × 627 × 429 mm,
   and 394 × 527 × 360 at the 0.84 scale the library places it with. The height
   is right, the width and depth are not. It looks fine on the bench; it matters
   only if true scale matters. The other six are within about a fifth of their
   stated sizes: the 3Shape E4 is the closest (within 4 mm), the Zubler Vario
   200 (61 mm wider) and the Programat P300 (83 mm shallower) the furthest.
2. **The part names listed for the three furnaces do not match their actual
   parts.** Harmless: the tour reads the real parts, so the exploded view works.
3. **The lighting differs slightly from the library viewer.** The main light
   comes more from the side, so that walls and furniture cast visible shadows
   across the floor. Machine fronts are lit a little more softly as a result.

## Open decisions

1. **Where the tour lives and who may see it.** It is built as a public page at
   `/lab-tour/` on the CARNIX site, with no login. Right place?
2. **The wording.** The header says "Dental Lab — Digital. Precise. Reliable.",
   as in the concept image; the real name can go there. The Acrylic room's
   subtitle is spelled "Final Prosthesis" (the image has "Prothesis").
3. **DS-EX Pro:** re-proportion the model to its datasheet, or leave it.
4. **How much phones matter.** The tour works on a phone and adapts its layout,
   but on a narrow screen the overview is small. If most visitors arrive on
   phones, that view deserves a design of its own.
