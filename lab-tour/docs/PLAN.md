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
| 1b | A tour that teaches: navigation bar, guided route, welcome guide, machines that come forward and turn on their own, a page of facts per machine | ✅ done |
| 2 | Make it true: real floor plan, real equipment list, real name, the lab's own words | ⏳ needs your input |
| 3 | Room by room: replace placeholders with models, and write each machine's page | next |
| 4 | The rest of the concept's interface | later |
| 5 | Atmosphere | later |
| 6 | Launch | later |

### Phase 1b — a tour that teaches (done)

The tour is meant for education and awareness, so it now explains itself:

- **Navigation bar** with the lab and one stop per room, in tour order.
- **Guided route**: each room is a numbered stop with a paragraph on what
  happens there and a button to the next one.
- **Welcome guide** on a first visit: what the page is, and how to use it.
- **Machine view**: the machine comes forward, the lab fades; dragging turns
  the machine about its own middle and nothing else; it can be taken apart.
- **A page per machine** with up to four pills: the machine, About (its
  maker), Features (key figures, with links to their sources) and Capabilities.
  The six real machines have all four (one of them, the UniFormation GK3, is
  still waiting for its 3D model); the two workstation PCs have a description
  and capabilities; placeholders have a description of their kind.

How it is checked: `npm run e2e` walks through all of this in a headless
browser as a desktop visitor, a phone visitor, a first-time visitor and one who
asked for reduced motion (README, "Testing").

### Phase 2 — make it true

Three things in the tour are educated guesses and are marked as such in the files:

- **The floor plan** (13.8 × 10.2 m, two rows of rooms 4 m deep, a 2.2 m
  corridor) was read off the concept image. → `js/shell/layout.js`
- **Every "planned" machine** — its name, its size and which room it is in — is
  what a lab with these six rooms typically runs, not your equipment list.
  → `js/rooms/catalogue.js`, `js/rooms/content.js`
- **The words**: the order of the tour (reception → plaster → design →
  printing → ceramic → acrylic), the paragraph about each room and the
  one-line descriptions of the planned machines. → `js/rooms/knowledge.js`

Needed from you: room sizes (a sketch with dimensions is enough), for each room
the machines in it with make and model, the order in which a case really moves
through the rooms, and a read-through of the texts by somebody who works in
the lab. Sizes can be looked up from the datasheets.

#### What the machine pages say, and what still needs confirming

Every figure shown for a real machine was taken from its maker's manual, data
sheet or product page (or a dealer's copy of one) and links to it in the panel.
What could not be settled from documents alone:

| Machine | Taken from | To confirm |
|---|---|---|
| SHINING 3D AutoScan-DS-EX Pro | SHINING 3D's product page and the data sheets of the three versions | **Which version the lab has**: Pro, Pro(C) or Pro(H). They differ in cameras (1.3 to 5 megapixels), accuracy (10 to 8 µm) and scan time, so the panel shows ranges for now. |
| 3Shape E4 | 3Shape's E4 page, Dental System catalogue and E-scanner press release | Auto-start and articulator support are described by 3Shape for the E1–E3 and listed by dealers for the E4; 3Shape's own E4 page does not mention them. |
| Zubler VARIO 200 | Zubler's operating instructions and product table | **VARIO 200 or VARIO 200ZR?** Controlled cooling (TTC) belongs to the ZR only; the panel says so. Also: the asset library calls it a "pressing & ceramic furnace", Zubler's manual says it fires ceramics only (the press furnace is the VARIO PRESS 300), so the tour calls it a ceramic furnace. |
| UPCERA A7+ | UPCERA's product page | Its heating rate is printed without a unit of time (read as per minute); dealers quote a slightly different vacuum figure. |
| Ivoclar Programat P300 | Ivoclar's operating instructions, 2006 | The later P300/G2 holds more programs. Which one is in the lab? |
| UniFormation GK3 | UniFormation's GK3 product page | **GK3 (T), GK3 (B) or GK3 Pro?** T and B differ only in the screw that lifts the platform, and the figures shown hold for both. The GK3 Pro uses 385 nm light instead of 405 nm, and UniFormation's own page points dental work to the Pro. The 3D model shows a ball screw and a 405 nm hood, which would be the GK3 (B). |

`npm run check` prints these notes every time it runs, from the `confirm`
fields in `knowledge.js`; they are never shown to visitors.

**What helps most for each new machine:** its exact model name as printed on
the type plate, and the maker's manual or data sheet (a PDF or a link) in that
machine's folder next to its 3D model. With those, its page can be written
from the source instead of from a search.

### Phase 3 — room by room

For each room: confirm its equipment list → model the machines in the asset
library → import → switch the catalogue entry from `planned` to `built` →
write the machine's page in `knowledge.js` from its manual → add the room's
own touches. A room is done when it has no blue volumes left and every machine
in it has a maker, figures and sources.

Suggested order:

1. **Printing Room** — the room sits in the middle of the picture. Its first
   printer is known: a **UniFormation GK3**. Its 3D model exists (see "The
   GK3's 3D model" below) and only has to be imported. Open: are the other two
   printer places also GK3s, other printers, or empty? And what are the wash
   and curing units?
2. **Ceramic Room** — its three furnaces are done; four small bench units
   finish the room.
3. **Plaster Room** — five machines, all simple shapes.
4. **Acrylic & Prosthodontic Room** — the largest backlog (six types).
5. **Clinic Reception** — mostly furniture and atmosphere; one scanner cart.

The Design Room already has all four of its machines.

### Phase 4 — the rest of the concept's interface

Built in phase 1b: per-machine content ("Explore features") and the route
through the rooms, as numbered stops.

In the concept image and not built yet:

- **Equipment list** — every machine in one searchable list (the data exists).
- **Workflow on the floor** — the path of a case through the rooms, drawn as a
  line on the floor plan. The order exists (`ROUTE`); the drawing does not.
- **"See how it works"** — steps tied to the parts of a machine as it comes
  apart. Needs a short script per machine.
- Compass, "About" the lab, and the left-hand navigation of the concept (the
  bar at the bottom does that job now).

### Phase 5 — atmosphere

Technicians, the skyline behind the clinic windows, surface textures, glowing
ring markers. Deliberately last: these make the picture richer but do not
change what the tour can do, and people in particular are costly to do well.

### Phase 6 — launch

A link from wherever the tour should be reached, the real name in the header,
a preview image for sharing, a test on real phones (so far it has only been
tested in an emulated phone browser, where speed cannot be judged), and the
header rules described in the README.

## Inventory

30 machines are placed: **7 are 3D models, 1 is a known machine waiting for its
3D model, 22 are placeholders** (19 different types still to identify and
model). Sizes are width × depth × height in mm.

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

| Machine | State | Size |
|---|---|---|
| UniFormation GK3 | ◼ known · 3D model not imported yet | 392 × 332 × 520 (maker) |
| Resin 3D printer × 2 | ◻ placeholder | 400 × 400 × 580 (draft) |
| Print wash station | ◻ placeholder | 270 × 300 × 360 (draft) |
| UV post-curing unit | ◻ placeholder | 270 × 270 × 350 (draft) |

Furniture: 3.0 m and 1.8 m benches, island bench, shelf rack.

#### The GK3's 3D model

The model is finished and lies in Google Drive, twice:

- `UniFormation GK3 — Three.js Viewer / UniFormation_GK3_Viewer.html` — the
  printer on its own (178 meshes, 23,184 triangles by its README);
- `Dental Lab Equipment — 3D Asset Library / Dental_Lab_Equipment_Asset_Library.html`,
  the version of 11 Nov 2026, 18:58 — the whole library, now with three tables
  and the printer as asset `uniformation-gk3`. **This is the file the tour
  imports from.**

It is not in the tour yet for one reason: the importer needs the file itself,
and the connection to Drive that this was built with can read out part of a
file's text (a long file comes back with its middle left out) but cannot copy
a file into the project. The printer's code is about 50 KB in the middle of
either file. Typing it across by hand would cost far more than it is worth and
could not be proven identical.

To finish: attach the library file to the chat (or put it anywhere on disk),
run `npm run import-assets -- <that file>`, and change the GK3's line in
`catalogue.js` to `status: 'built'` (the line to use is written next to it).
The new library has three tables instead of two, so the two library benches
the tour already uses have to be checked after that import.

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
3. **DS-EX Pro:** re-proportion the model to its datasheet, or leave it. And
   which version is it (see the table under phase 2)?
4. **How much phones matter.** The tour works on a phone and adapts its layout,
   but on a narrow screen the overview is small. If most visitors arrive on
   phones, that view deserves a design of its own.
5. **The order of the tour.** Reception → plaster → design → printing →
   ceramic → acrylic is a guess at how a case travels. One line to change.
6. **Who the reader is.** The texts are written for somebody with no dental
   training (a student, a patient, a visitor). If the audience is dentists or
   technicians, they should say more and explain less.
7. **The printers.** One UniFormation GK3 stands in the Printing Room. Which
   version is it (GK3 T, GK3 B or GK3 Pro), and what stands in the other two
   printer places? Its 3D model still has to be imported: see "The GK3's 3D
   model" in the inventory.
