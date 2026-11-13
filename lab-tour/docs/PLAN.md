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
| 0 | Foundations: one unit system, importers for the asset library and for single-machine viewer files, furniture kit, floor plan as data, automatic checks | ✅ done |
| 1 | The whole floor, walkable: building, six furnished rooms, overview → room → machine, shareable links, phone layout | ✅ done |
| 1b | A tour that teaches: navigation bar, guided route, welcome guide, machines that come forward and turn on their own, a page of facts per machine | ✅ done |
| 1c | Text on a phone: one scale of sizes for the phone layout, nothing under 12 px | ✅ done |
| 2 | Make it true: real floor plan, real equipment list, real name, the lab's own words | ⏳ needs your input |
| 3 | Room by room: replace placeholders with models, and write each machine's page | next |
| 4 | The rest of the concept's interface | "How to use it" is built, for one machine; the rest later |
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
  The eleven real machines have all four; the two workstation PCs have a
  description and capabilities; placeholders have a description of their kind.
- **An opening** (added later): when the page opens, the lab comes up part by
  part in about two seconds. See "The opening" under phase 5.

How it is checked: `npm run e2e` walks through all of this in a headless
browser as a desktop visitor, a phone visitor, a first-time visitor and one who
asked for reduced motion (README, "Testing").

### Phase 1c — text on a phone (done)

Asked for after the tour was tried on a phone: the text was too small there.
It had mostly the desktop's sizes, 11.5 to 14.5 px, and 10.5 px on the bar.

What was done: the phone layout (below 900 px) has a scale of its own, five
sizes and one for the bar (README, "Change the size of the text on a phone").

| | Before | Now |
|---|---|---|
| Descriptions, capability points | 14 | 16 |
| Machine names in lists | 14.5 | 16 |
| Buttons | 14 | 15 |
| The four pills | 13 | 15 |
| Facts, notes, the maker's details | 12.5 – 13.5 | 14 – 15 |
| Small labels, sources, badges | 11.5 – 12 | 12.5 – 14 |
| The bar | 10.5 | 12 |
| Headings, large figures | 18 – 27 | unchanged |

The faintest grey, used for four kinds of small text, gave way to the darker
one. "Printing" reads "Print" on the bar of a phone narrower than 380 px,
where the full name would touch "Ceramic". A desktop is unchanged, element for
element (compared at four window sizes).

Where it departs from what was proposed: **a room's sheet did not get
taller.** The proposal was 40 px more, to keep the first machine of the list
in view under the longer paragraph. On the screen it was tried on, 360 × 800,
that cost four rooms nothing and the other two 4 and 8 % of their size. But a
browser's own bars leave a common phone about 670 px of height, not 800, and
there every room above the sheet is as large as the height allows. Measured at
390 × 664 and 360 × 672: 40 px more sheet draws the room a sixth smaller
(232 px high becomes 195) and brings its markers closer together. Of the three
rooms measured, the first machine of the list comes into view in one, a third
of it in another, and none of it in the last. The list is one scroll away as
it is, and the markers lead to the same machines.

What larger text cost:

- On phones that leave the page about 670 px of height, the whole lab is drawn
  5 to 7 % smaller, because the paragraph on the first sheet is taller. Rooms
  and machines are drawn as large as before.
- The row of pills scrolls sideways more often: on a phone 360 px wide for
  five of the thirteen modelled machines, where it was two. The margins beside
  each pill's name were narrowed for it; with the old ones it would be ten.
  (Measured in Roboto, the font of most Android phones.)

What was found and fixed on the way, all on phones. The first was there
before this work; the others came with the larger text:

- The note beside the lab's name pushed the page wider than the screen. The
  sentence shown when a model fails ("3 of 14 3D models could not be loaded")
  did so on every phone it was measured on, 320 to 430 px wide: on a screen of
  390 px the page was 399 px wide. The note shown while the models load did
  on a phone 320 px wide. The first now breaks into lines; the second reads
  "Loading 3/14" on a phone.
- The welcome guide is taller than a short screen. It scrolls, and its two
  buttons stay in view.
- On a short phone (an iPhone SE in Safari leaves 375 × 553) the first sheet
  is shorter than its words, and "Start the tour" was pushed partly out of
  sight. On a phone 320 px wide it had been cut off before. The words scroll
  now, and the two buttons stay in view.
- On tall phones the taller first sheet tipped the lab from its upright view
  into the view across, which draws the rooms a third smaller there. The
  phone layout now chooses between the two by its own measure.
- The longest names in a room's list pushed the list past the sheet's edge on
  a phone 320 px wide. They wrap now.

How it is checked: the phone visitor of `npm run e2e` went from 66 checks to
112. It reads every piece of text in each kind of view at 390 × 844, goes on
at 360 × 640 and 320 × 568, and lets one model fail to arrive. Each fix above
has a check that was seen to fail with the fix taken out.

Not checked: a real phone. The sizes are set in px and are the same in any
font. How many lines a paragraph takes and whether a row fits are not, and the
test browser has none of a phone's fonts.

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

| Medit Identica T500 | Medit's T-Series brochures (2018 and 2019 editions, dealers' copies) and a dealer's page | **The name:** Medit's brochures say "Medit T500"; dealers and the badge on the 3D model say "Identica T500". **The accessories:** the 2019 brochure lists the multi-die, colour texture and articulator modules as included and the 3-axis arm for impressions as optional; which does the lab have? What the texture and articulator modules are for is described from general use; the brochure only lists them. |
| imes-icore CORiTEC 350i PRO | imes-icore's product page for the 350i series and its brochure for the 350i PRO series | **PRO, PRO+ or a Loader?** The same body is sold with a 2.6 kW water-cooled spindle (PRO+) and with a changer for 12 blanks (Loader, 300 mm wider); the figures shown are for the PRO. imes-icore's two documents differ on the weight (205 kg, or 180 to 210 kg), on the air pressure and on the size of the screen; the page gives what both agree on, and the brochure's 205 kg. **What it stands on:** imes-icore sells machine tables for it; in the tour it shares a table with the other mill. |
| DGSHAPE DWX-52Di Plus | DGSHAPE's product page and brochure for the DWX-52Di Plus; its Setup Guide for the DWX-52Di | **Which model exactly:** DWX-52Di Plus (2025), or the earlier DWX-52Di or DWX-52D Plus? **The ionizer and the dust collector** are taken from the Setup Guide of the DWX-52Di, which names the spindle of the Plus but not the name "Plus"; DGSHAPE's page for the Plus does not mention an ionizer. The 3D model has a drawer that its file calls a dust drawer; DGSHAPE shows a storage compartment there. |
| Ivoclar SR Ivocap | Ivoclar Vivadent's operating instructions for the SR Ivocap equipment (2009), its instructions for use of the SR Ivocap system (2016) and its BPS brochure, all three read as copies on a dealer's site; Ivoclar's own product page | **Is this the machine that "Ivoclar BPS" meant?** BPS is Ivoclar's system for dentures as a whole (teeth, base materials, articulators); the SR Ivocap is the equipment that injects one of its base materials, and the Drive holds a viewer of that name and none called BPS. **Which pressure apparatus:** the 2009 document calls it ID3, the 2016 one ID2; the page names no type. **Its size:** Ivoclar's documents give weights and no dimensions, so the page shows none. **What a capsule holds** (20 g, 30 ml) stands on dealers' pages and on the model's label only; the page leaves it out. **What stands around it:** in use it needs a hydraulic press, a polymerisation bath and a capsule vibrator; the room has a placeholder for the press and none for the other two. |
| bredent thermopress 400 | bredent's brochure for the thermopress 400 (2021) and its instructions for use of the thermopress 400 system (2025) | **Which plastics the lab injects.** The brochure offers five; the 2025 instructions describe three (Polyan IC, bre.flex 2nd Edition, Bio Dentaplast) and mark others as discontinued; the page names the three. The two documents differ on the settings for Bio Dentaplast (220 °C and force level 80; 195 °C and force level 100), so the page gives a range of temperatures and no setting per material. The operation manual of the unit itself (REF 009183EX) was not found online: what the page says about working the unit comes from the part of it that bredent reprints in the 2025 instructions. The model's type plate and display were not checked (a REF number other than the brochure's; a program at 265 °C where bredent's table has 280 °C). |

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
   printer, a **UniFormation GK3**, is in as a 3D model (see "The GK3's 3D
   model" below for how it got there and what is left to confirm). Open: are
   the other two printer places also GK3s, other printers, or empty? And what
   are the wash and curing units? The two milling machines stand in this room
   too, for want of a milling room (see "The two milling machines' 3D models").
2. **Ceramic Room** — its three furnaces are done; four small bench units
   finish the room.
3. **Plaster Room** — five machines, all simple shapes.
4. **Acrylic & Prosthodontic Room** — its two injection units, an **Ivoclar SR
   Ivocap** and a **bredent thermopress 400**, are in as 3D models (see "The
   two injection units' 3D models" below). It still has the largest backlog:
   six types of its own, among them the flask press that the SR Ivocap needs.
   Open: which of those the lab really has, and where the two units stand.
5. **Clinic Reception** — mostly furniture and atmosphere; one scanner cart.

The Design Room already has all its machines.

### Phase 4 — the rest of the concept's interface

Built in phase 1b: per-machine content ("Explore features") and the route
through the rooms, as numbered stops. Built since: **"How to use it"**, guides
to working a machine, for one machine so far. See below.

In the concept image and not built yet:

- **Equipment list** — every machine in one searchable list (the data exists).
- **Workflow on the floor** — the path of a case through the rooms, drawn as a
  line on the floor plan. The order exists (`ROUTE`); the drawing does not.
- Compass, "About" the lab, and the left-hand navigation of the concept (the
  bar at the bottom does that job now).

#### "How to use it" (built, for one machine)

The concept's "See how it works": steps tied to the parts of a machine. Built
as it was sketched and approved:

- **The way in** is a card on the machine's first pill: "How to use it", with
  the number of guides.
- **The guides** of that machine, each with its number of steps. The
  thermopress 400 has three: "Run a program" (13 steps), "Set a program" (5)
  and "Eject a cartridge by hand" (2).
- **One step at a time** on a phone: a title, two or three sentences, Back and
  Next, and a row of dashes showing how far along. On a desktop all the steps
  are a list, with the current one open.
- **The model shows the step.** The camera goes to the part the step is about,
  and rings mark the keys or screws to use. The machine is shown as it is at
  that point of the work: its lid open or shut, the flask in or not yet.
- **Every step comes from the maker's instructions for use**, named and linked
  under the guide, with a sentence saying that the guide does not replace the
  manual that came with the machine, or training on it. The rule of
  `knowledge.js` holds here too: nothing without a source.

Where it differs from the sketch:

- The guides have 13, 5 and 2 steps where the sketch had 9, 6 and 3. The steps
  follow bredent's tables, and a step too long for a phone was split: there is
  one for each clamping screw, for example.
- On a phone a guide's sheet is taller than a machine's own: 56 % of the
  picture's height against 48 %. With less, a step had to be scrolled.
- The open step has a button, "Show it on the machine again". It brings the
  step's view back after the visitor has turned the machine. Turned so far
  that the part is out of sight, the rings go and the button stands out.
- Under each step, after the source, a sentence says that the model's keypad
  is drawn differently from the real one and that the rings go by a key's
  place.
- "Done" on the last step leads back to the list of the guides.

How it is made: the guides are data, in `js/rooms/how-to.js` (README, "Write a
guide to working a machine"). `npm run check` builds the model and tries every
step on it. `npm run e2e` walks through every step of every guide, beside the
lab and on a phone (README, "Testing").

What is left:

- **Guides for the other machines**: one entry in `how-to.js` each, from the
  maker's instructions for use. Five models have a lid or cover that a step
  can open.
- **To confirm with the lab** (`npm run check` lists it): the guides retell the
  part of the unit's manual that bredent reprints in its 2025 instructions for
  use. The manual that came with the lab's own unit was not read. Which
  clamping screw is number 1 and which number 2 was read from bredent's
  drawing.
- Left out of the thermopress's guides: working with both heating chambers at
  once, the error messages, cleaning.
- Not tried on a real phone, nor in Safari or Firefox.

### Phase 5 — atmosphere

Technicians, the skyline behind the clinic windows, surface textures, glowing
ring markers. Deliberately last: these make the picture richer but do not
change what the tour can do, and people in particular are costly to do well.

#### The opening

Built, in its basic form: when the page opens, the lab comes up part by part —
the floor, the walls, the glass, the furniture, the machines, then the room
names and the controls — in 2.2 seconds. A link straight to a machine brings
everything up as one, in under a second. A tap or a resize during it ends it at
once; a device that asks for reduced motion gets the finished lab without it.
A model that finishes loading afterwards fades into its place instead of
popping in.

How it is done: before anything is shown the lab is drawn four times, each time
with more of it switched on, and each picture is kept. The pictures lie over
the live one and the browser fades them away in turn. Nothing in the scene is
moved or made see-through for it (the walls of all six rooms are one mesh and
the furniture shares eleven materials, so fading the real thing would show
every piece's inside).

It cannot cost a visitor the tour. The opening runs while the tour is being
started, so everything in it is fenced in: if the browser will not hand out a
picture of the lab (each is as large as the picture on screen, and a browser
short of memory may refuse), or anything else in it fails, the lab is simply
there and no further pictures are asked for on that visit. On a picture of
more than six megapixels no copies are kept at all: the lab comes up in one
plain fade.

It follows the timetable of the animation brief
(`lab-tour-interaction-animation-spec.md`, section 3) in its plain form: the
walls come up as one group and the furniture as one, where the brief staggers
them by kind of wall and by room, and nothing moves into place — the brief's
settling movements of 8–15 mm would be half a pixel on a desktop screen and
less on a phone.

Not built: everything in the brief outside the first load. The opening was
asked for on its own ("a basic in animation for all"). The brief's proposals
for moving between places (its section 5), for hovering over and selecting
machines (6), for the panel and the controls (7), for loading and failure
states (8) and for stepping the quality down on slow devices (11) were not
started. Where the tour already did something there — the camera journeys, the
spotlight, the take-apart slider — it does what it did before.

### Phase 6 — launch

A link from wherever the tour should be reached, the real name in the header,
a preview image for sharing, a test on real phones (so far it has only been
tested in an emulated phone browser, where speed cannot be judged), and the
header rules described in the README.

## Inventory

35 machines are placed: **13 are 3D models, 22 are placeholders** (19 different
types still to identify and model). Sizes are width × depth × height in mm.

### Design Room — CAD Design & Planning · 5.2 × 4.0 m

| Machine | State | Size |
|---|---|---|
| SHINING 3D AutoScan DS-EX Pro | ✅ 3D model | 394 × 527 × 360 as placed |
| DS-EX Post-Processing PC | ✅ 3D model | 597 × 343 × 410 |
| 3Shape E4 | ✅ 3D model | 374 × 337 × 336 |
| 3Shape Design & Post-Processing PC | ✅ 3D model | 597 × 343 × 410 |
| Medit Identica T500 | ✅ 3D model | 291 × 298 × 341 (maker: 290 × 290 × 340) |

Furniture: the library's scanner table, three CAD desks with two monitors each,
eight chairs, wall display, shelf rack, plant. The Medit scanner stands on the
desk under the wall display, between its two monitors: along the same wall as
the library's scanner table, so the three lab scanners are in one row. (One
line in `js/rooms/content.js` moves it.)

#### The Medit T500's 3D model

The scanner is not in the asset library. Its model lies in Google Drive as a
viewer of its own, `Medit Identica T500 — Three.js Viewer /
Medit_T500_Scanner_Viewer.html` (761,681 bytes), and was imported from that
file with `npm run import-viewer` (README, "Add a machine from its own viewer
file").

**The copy the tour was built from is the file in Drive, byte for byte.** The
connection to Drive does not put a file on disk. It shows a file's text to the
assistant, and of a long file only the start and the last few thousand
characters before a chosen cut. (It also has a plain download. That was not
tried then; it was used for the two milling machines later, and it works: see
"The two milling machines' 3D models". The scanner's file was fetched again
that way afterwards. It is the same file, and importing it again changed
nothing in the tour.) So the file was put
together again here:

- its first 81,700 characters (the page, the viewer's own code and the model's
  55,841 characters) were read in 22 readings, each cut a little further on,
  and typed across;
- the 679,874 characters of three.js that follow were not read. They were
  taken from the asset library file that was attached to this chat earlier, on
  the guess that both files carry the same three.js;
- the last 79 characters were read like the first. (The line break that ends
  the file does not show in a reading; the file's size called for it.)

Drive keeps a checksum (MD5) of every file. The rebuilt file has Drive's own:
`afbd1bce3b5f6c229a09cda4b58469e6`, and the same 761,681 bytes. A single wrong
character anywhere, typed or guessed, would have given a different one. The
checksum is written into `js/assets/viewers/manifest.js` and at the top of
`js/assets/viewers/medit-t500.js`.

The model has 150 meshes, as its README says, 13,307 triangles and 22
materials. Its body is 290 × 290 × 340 mm as stated; the vents, the sockets at
the back, a badge and a tag on the roof stand out by up to 6 mm, which gives
the measured 291 × 298 × 341.

Two things differ from the stand-alone viewer:

- **Its blue lamp is off.** The model holds a point light in its scan bay,
  lit all the time in the viewer. The tour lights everything itself and
  switches off any light inside a machine (`js/assets/registry.js`). For this
  one the choice was measured, in the test browser:
  - What the lamp adds to the picture is a faint blue cast on the bay's inner
    walls (5 of 255 steps of blue on average, 18 at most); the dies on the
    plate look the same.
  - The first time the scanner is opened, four shader programs are built
    instead of two. Nothing more on leaving or on coming back.
  - A machine on show is drawn in a pass of its own, so the lamp would be
    there in one pass and not in the other. three.js then looks up the shader
    program of every lit material again on every frame: 40 look-ups a frame in
    the scanner's view, none with the lamp off. A frame took about 1 ms more
    of script time there (2.1 and 2.9 ms against 1.2 and 2.0 ms). That is two
    runs with software rendering: it shows the direction, not what a phone
    would lose.

  It is three lines in `createEquipment()`, and one check in
  `tools/browser/e2e.mjs` that expects the lamp to be off.
- **It does not scan.** The viewer can tilt the arm and turn the plate ("Active
  Scan"). The tour has no such button for any machine yet; the model's function
  for it is imported and unused.

The GK3 (below) could be settled the same way, and with the download in one
step: its own viewer file is in Drive with its checksums, so it can be fetched,
proven and imported in place of the hand copy. That has not been done: nobody
asked for it, and it would swap the printer's model for another file's.

### Printing Room — 3D Printing · 4.0 × 4.0 m

| Machine | State | Size |
|---|---|---|
| UniFormation GK3 | ✅ 3D model | 400 × 363 × 522 (maker: 392 × 332 × 520) |
| Resin 3D printer × 2 | ◻ placeholder | 400 × 400 × 580 (draft) |
| Print wash station | ◻ placeholder | 270 × 300 × 360 (draft) |
| UV post-curing unit | ◻ placeholder | 270 × 270 × 350 (draft) |
| imes-icore CORiTEC 350i PRO | ✅ 3D model | 759 × 823 × 857 (maker: 758 × 790 × 857) |
| DGSHAPE DWX-52Di Plus | ✅ 3D model | 495 × 693 × 600 (maker: 495 × 660 × 600) |

Furniture: 3.0 m and 1.8 m benches, shelf rack, and a machine table in the
middle of the room (1.6 × 0.9 m, 900 mm high) that carries the two milling
machines. It stands where an empty island bench stood (1.4 × 0.7 m).

#### The two milling machines' 3D models

Neither machine is in the asset library. Each lies in Google Drive as a viewer
of its own, and was imported from that file with `npm run import-viewer`, as
the Medit scanner was:

| | imes-icore CORiTEC 350i PRO | DGSHAPE DWX-52Di Plus |
|---|---|---|
| Folder in Drive | imes-icore CORiTEC 350i PRO — Three.js Viewer | DGSHAPE DWX-52Di Plus — Three.js Viewer |
| File | `Imes_Icore_CORiTEC_350i_Viewer.html` | `DGSHAPE_DWX_52Di_Plus_Viewer.html` |
| Size | 770,459 bytes | 761,507 bytes |
| MD5 in Drive | `c8ba37b9d304323ead54821f743533ce` | `40d86751d9356817182d3d501f236666` |
| In the tour as | `imes-icore-350i-pro` | `dgshape-dwx-52di-plus` |
| Meshes, triangles, materials | 168 · 9,238 · 29 | 213 · 16,788 · 22 |
| Parts it comes apart into | 7 | 7 |
| Body as modelled | 758 × 790 × 857 mm | 495 × 660 × 600 mm |

**The copies the tour was built from are the files in Drive, byte for byte.**
This time the files were downloaded whole. They did not arrive as they are in
Drive: something between Drive and this workspace had rewritten the page (a
service that speeds up web pages by loading their scripts late; Cloudflare's
Rocket Loader, going by the file it adds). Each file was 382 bytes longer:

- every one of its five `<script>` tags had been given a `type` attribute
  (48 bytes each), and
- one more `<script>` tag, loading a file of that service, stood before
  `</body>` (142 bytes).

Both additions were taken out again, and the result was compared with what
Drive lists for the file: the size, the MD5 and the SHA-256 are Drive's, for
both files. Those checksums are in `js/assets/viewers/manifest.js` and at the
top of each model's module. (A README, which is not a web page, arrived
untouched. The files in Drive were only read.)

The importer now does both by itself. It takes out exactly these two
additions, and, given the checksum Drive lists (`--md5`, `--sha256`), it stops
unless the file has it. Tried on the two downloads just as they arrived: the
modules it wrote are the same, byte for byte, as those from the copies cleaned
by hand. Tried with a wrong checksum, and with a copy in which one digit of the
model was changed: it refused both and wrote nothing.

The importer needed one more change. It used to look for the model by the name on
its `<script>` tag (`id="component-2-product-model"`, as in the scanner's
file). These two files name their scripts in a comment above each one and leave
the tag bare. The importer now goes by what a script does: the model is the one
that sets `window.__ProductModel`. To be sure that the scanner was not touched
by this, its file was fetched again and imported again: not one byte of
`medit-t500.js` or of its entry in the manifest changed.

Each body has the maker's size exactly. What sticks out is measured with it,
hence 823 and 693 mm of depth: on the DGSHAPE the suction port at the back
(33 mm); on the imes-icore machine the port and the air unit at the back
(23 mm) and the emergency stop button at the front (10 mm).

**Where they stand is a choice made here.** The floor plan has no milling room
and none was named. They stand in the Printing Room: both rooms' machines turn
a design into an object, and the room's text now says so in one more sentence.
One entry in `js/rooms/content.js` moves them.

- They share a table 900 mm high, the height of the room's benches. imes-icore
  sells machine tables for the 350i PRO that are 930 mm high and exactly as deep
  as the machine (790 mm); the tour's table is 900 mm deep so that the ports at
  the back stand on it too. A real table has to carry the imes-icore's 205 kg.
- Walking room around the table: 0.75 m to the bench on the west wall, 0.80 m
  to the east wall, 1.2 m to the printers' bench, 1.0 m to the corridor wall
  and its door.
- On its table the imes-icore machine reaches 1.76 m, nearly as high as the
  shelf rack, and it stands in the middle of the room. Every other machine
  there can still be seen and tapped from where the visitor stands
  (`npm run e2e` checks it).

Two things differ from the stand-alone viewers:

- **The chamber lights are off.** Each model holds a point light in its milling
  chamber, lit all the time in the viewer. The tour switches off any light
  inside a machine (`js/assets/registry.js`; the reasons were measured on the
  scanner, see above). The chambers are lit by the tour's own lights through
  their windows; the tools, the disc and the spindle can be seen.
- **The cover does not open and nothing mills.** The viewers have a button for
  each ("Open Cover", "5-Axis Mill"). The tour has no such buttons for any
  machine yet; the models' functions for it are imported and unused.

**What the makers' documents say, against the notes in Drive.** The figures on
the two pages were taken from the makers' own documents, not from the READMEs
that lie beside the viewers. Where the two disagree:

| | Note in Drive | Maker |
|---|---|---|
| imes-icore, B axis | "±30°..115°" | "B-axis 115°", no range given |
| imes-icore, screen | 15 inch | 15 inch (web page) or 15.6 inch (brochure) |
| imes-icore, weight | 205 kg | 205 kg (brochure); 180 to 210 kg for PRO and PRO+ (web page) |
| DGSHAPE, ionizer | built in | not on the page or in the brochure of the Plus; in the Setup Guide of the DWX-52Di |
| DGSHAPE, drawer at the bottom | a dust drawer | a cover with storage behind it; the dust leaves through the port at the back, to a separate dust collector |

Everything else in the notes that was checked agrees with the makers: sizes,
weights, spindle speeds, the 20 and 15 tools, the 4.8 litre coolant tank, the
98.5 mm disc.

What they cost to draw is in the README ("How it stays fast"). In short: the
DGSHAPE is now the costliest model in the tour to show on its own, with 213
separate parts, and the frame of the whole lab that also redoes the shadows
went from 400 to 493 draw calls.

#### The GK3's 3D model

The model lies in Google Drive, twice:

- `UniFormation GK3 — Three.js Viewer / UniFormation_GK3_Viewer.html` — the
  printer on its own (178 meshes, 23,184 triangles by its README);
- `Dental Lab Equipment — 3D Asset Library / Dental_Lab_Equipment_Asset_Library.html`,
  the version of 11 Nov 2026, 18:58 — the whole library, now with three tables
  and the printer as asset `uniformation-gk3` (component 6B).

**It is in the tour, but it was copied across, not imported from the file.**
The importer needs the file itself, and the connection to Drive this was built
with cannot copy a file into the project: it reads out a file's text, and of a
long file only the start and the last 3,400 or so characters before a chosen
cut.
So the printer's component (47 KB in the middle of the library file) was read
in fifteen such windows, each overlapping the one before, typed across and put
together. It was then set into the library file the tour already used
(`Dental_Lab_Equipment_Asset_Library (2).html`), where the newer library has
it, and that combined file was imported. The seven older machines and the two
benches are therefore exactly what they were.

What was checked:

- every window agrees with the one before it where they overlap, and each has
  the length its place in the file requires (a dropped or added character
  would have shown);
- the 1.8 KB that follow the component in the newer file were typed across the
  same way; they are the same in the older library file, which is on disk, and
  the typed copy is identical to it;
- the component is valid code, builds, and gives 178 meshes, 23,176 triangles
  and 4.99 × 4.53 × 6.52 units, that is 400 × 363 × 522 mm (width × depth ×
  height), with the library's own three.js as well as the tour's. The viewer's
  README gives the same 178 meshes and the same three lengths; the library's
  README gives 718 meshes for all eight machines, which is what the eight
  imported ones add up to;
- it was looked at in the tour from eight sides and from above, closed and
  taken apart: nothing is out of place.

What was not:

- **It is not proven identical to the file.** A slip that keeps the length,
  such as one wrong digit, would not show in any of the checks above unless it
  moved something visibly.
- **One figure does not agree.** The viewer's README gives 23,184 triangles;
  the tour's copy has 23,176, eight fewer. Why is not known. The README
  belongs to the stand-alone viewer, whose model may differ a little from the
  library's copy; or one number that sets how finely a round part is divided
  is wrong in the copy (on a single cylinder, 24 where the file says 26 would
  do it).
- **Whatever else the newer library changed is not in.** It has three tables
  instead of two, and its other machines may have changed too.

To settle all three: attach the library file to the chat (or put it anywhere on
disk) and run `npm run import-assets -- <that file>`. The importer writes a
`sha256` of each component at the top of its module; if the one in
`js/assets/legacy/uniformation-gk3.js` is unchanged after that import, the copy
was exact. The two library benches the tour uses have to be checked after it.

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

| Machine | State | Size |
|---|---|---|
| Ivoclar SR Ivocap | ✅ 3D model | 165 × 177 × 519 (the maker gives no size) |
| bredent thermopress 400 | ✅ 3D model | 658 × 314 × 263 (maker: 650 × 300 × 250) |
| Boil-out / dewaxing unit | ◻ placeholder | 460 × 400 × 420 (draft) |
| Hydraulic flask press | ◻ placeholder | 260 × 260 × 520 (draft) |
| Pressure polymerisation unit | ◻ placeholder | 330 × 330 × 400 (draft) |
| Vacuum / pressure former | ◻ placeholder | 320 × 360 × 480 (draft) |
| Polishing lathe with dust hood | ◻ placeholder | 620 × 420 × 460 (draft) |
| Dust extractor | ◻ placeholder | 230 × 560 × 580 (draft) |
| Micromotor & handpiece × 2 | ◻ placeholder | 120 × 240 × 90 (draft) |

Furniture: a 3.4 m bench on the corridor wall, a technicians' bench with two
chairs on the west wall, and an island bench in the middle of the room (2.4 m
long, 780 mm high). The island bench was a technicians' bench with two seats.
Now the two injection units stand on its east half, side by side, fronts to
the south, and its two seats are on the west half.

#### The two injection units' 3D models

Neither machine is in the asset library. Each lies in Google Drive as a viewer
of its own, and was imported from that file with `npm run import-viewer`, as
the Medit scanner and the two milling machines were:

| | Ivoclar SR Ivocap | bredent thermopress 400 |
|---|---|---|
| Folder in Drive | Ivoclar SR Ivocap — Three.js Viewer | bredent thermopress 400 — Three.js Viewer |
| File | `Ivoclar_SR_Ivocap_Viewer.html` | `Bredent_Thermopress_400_Viewer.html` |
| Size | 732,568 bytes | 740,001 bytes |
| MD5 in Drive | `ae3f047dab8f17111f247bcc54747df8` | `2f7c1e3d367d0467703d226903479a5e` |
| In the tour as | `ivoclar-sr-ivocap` | `bredent-thermopress-400` |
| Meshes, triangles, materials | 88 · 24,004 · 19 | 77 · 11,284 · 19 |
| Parts it comes apart into | 8 | 7 |
| As modelled | 165 × 177 × 519 mm | body 650 × 300 × 250 mm |

**"Ivoclar BPS" was read as the SR Ivocap.** The request named "the ivoclar
bps". BPS, the Biofunctional Prosthetic System, is Ivoclar's name for its way
of making dentures as a whole: teeth, denture base materials, articulators.
The machine in it is the SR Ivocap, which injects one of those base materials.
The Drive holds a viewer called SR Ivocap and none called BPS, and the notes
beside that viewer are headed "SR Ivocap System — 3D Three.js BPS Denture
Injection Viewer". The machine's page says in its first paragraph how the two
names belong together.

**The copies the tour was built from are the files in Drive, byte for byte.**
Both files were downloaded whole, and arrived changed in the way the milling
machines' files had (see above): each was 238 bytes longer, with a `type`
attribute on both of its `<script>` tags (48 bytes each) and one added tag
before `</body>` (142 bytes). With those taken out, the size, the MD5 and the
SHA-256 are the ones Drive lists, for both files. They are in
`js/assets/viewers/manifest.js` and at the top of each model's module. The
two files were fetched a second time at the end and imported just as they
arrived: the importer took the additions out by itself, and wrote the same
modules and the same manifest, byte for byte. (The two READMEs arrived
untouched. The files in Drive were only read.)

**These two files are laid out differently, and the importer learned a second
way to cut.** In the three earlier files the model is a script of its own,
which sets `window.__ProductModel`. Here a file has two scripts: three.js, and
one that holds the model's functions first and the viewer's own page after
them (its buttons, its camera, its render loop). Nothing registers the model;
it is a plain function, `createSrIvocapProduct(THREE)` or
`createThermopress400Product(THREE)`. So the importer

- looks for the script that declares a `function create…Product(THREE)`,
- takes that script from its start up to the line on which the page's code
  starts: the first line, after the model, that opens a function which is
  called on the spot (`(function initStudioViewer() {`), and before which the
  text is complete code,
- loads the part it took in a place with no page, no three.js and nothing
  else: declaring functions works there, doing anything fails. The import
  stops unless that part loads cleanly and declares exactly one
  `create…Product(THREE)`.

What it took is written byte for byte, as before: the first 1,099 lines of
the SR Ivocap's script (37,486 bytes) and the first 1,333 of the thermopress's
(44,932 bytes). Each was compared afterwards with the file from Drive, apart
from the importer: what stands in the module is the start of that script, and
the script goes on with `(function initStudioViewer() {`. The module then
calls the function with the tour's three.js.

How that was tried:

- **The three earlier files must come out as before.** The scanner's and the
  two milling machines' viewers were fetched from Drive again, proven against
  Drive's checksums, and imported again with the changed importer: not one
  byte of their three modules or of their entries in the manifest changed.
- **Files that must be refused.** Copies of the SR Ivocap's file, each changed
  in one way: a statement between the model and the page that sets something
  on `window`, or one that reads `document`; a second `create…Product(THREE)`,
  once at the start of a line and twice indented; the function renamed, so
  that none is left; the page's code turned into a function that is not called
  on the spot, so that there is nowhere to cut. And the true file with a wrong
  MD5, and with a wrong SHA-256. The importer refused all nine, said why, and
  wrote nothing. (An indented second factory went through at first: the
  importer looked for the function at the start of a line only. It now counts
  the functions that loading the script really declares.)
- **Files that must still go through.** A copy with a function of the same
  shape nested inside another, one with a `create…Product` that takes
  something other than `THREE`, and one that ends where the model ends: all
  three were imported, with the same model.

**The thermopress keeps two parts out of sight while it is closed:** the tool
that tightens its flask, and the stay that props its lid open (4 meshes, 104
triangles). No model before it did that, and `npm run check` failed on it:
the baked form that stands in the lab leaves out what is hidden, so it had
fewer triangles than the model. The check now measures a model as it stands,
says how much is hidden, and fails only if a hidden part reaches outside the
closed machine. In the tour the tool appears when the machine is taken apart.
The stay does not; it is seen, with the tool, when a step of a guide opens the
lid ("How to use it", under phase 4). `npm run e2e` checks both, and that the
tool is gone again when the machine is put together.

**Sizes.** The thermopress's body has the maker's size exactly. What sticks
out is measured with it, hence 658 × 314 × 263 mm: the knob of the lever on
top (13 mm), the handle of the lid at the front (14 mm) and the mains switch on
the right (8 mm). For the SR Ivocap, Ivoclar's documents give weights and no
dimensions; the model stands 519 mm high to the top of its coiled air hose.
(The READMEs give 24,000 and 11,278 triangles; the importer counts 24,004 and
11,284.)

**Where they stand is a choice made here.** No room was named. Both machines
make dentures, so they stand in the Acrylic & Prosthodontic Room, and the
room's paragraph now mentions both ways of working (acrylic that hardens under
pressure, plastic that is melted and injected). One entry in
`js/rooms/content.js` moves them.

- They stand on the island bench, which was there already, at sitting height
  (780 mm). The bench's two seats moved to its west half; the drawers under
  its west end went, so that there is room for knees. A real bench has to
  carry the thermopress's 40 kg.
- The wall bench with its five placeholders is as it was. Every machine in
  the room can be seen and tapped from where the visitor stands (`npm run
  e2e` checks it). The two new ones head the room's list.
- The two markers touched each other on a phone at first (27 pixels apart,
  each 28 across). The SR Ivocap now stands 650 mm from the thermopress
  instead of 500, and the markers are clear of each other.
- The SR Ivocap stands on the bench assembled, as in its viewer. At work it
  stands in a bath of boiling water.

Three things differ from the stand-alone viewers:

- **The thermopress's two lights are off:** an orange one at its heater and a
  white one in its flask chamber. The tour switches off any light inside a
  machine (`js/assets/registry.js`). The heater's orange glow is its
  material's own and stays. The SR Ivocap holds no light.
- **No button opens them and nothing is injected.** The viewers have a button
  for each ("Release Yoke" and "6-Bar Inject"; "Open Press Lid" and "400 °C
  Inject"). The tour has no such buttons for any machine. Since "How to use
  it" (phase 4) the thermopress's lid opens at the steps of its guides that
  have it open; the models' other functions are imported and unused.
- **The name on the first pill is "thermopress", without the 400.** The full
  name is in the heading. With "thermopress 400" there, the fourth pill,
  "Capabilities", was pushed out of the row: 14 letters fit, and `npm run
  check` now warns about a longer one.

**What the makers' documents say, against the notes in Drive.** The figures on
the two pages were taken from the makers' own documents, not from the READMEs
that lie beside the viewers. Ivoclar's two instructions and its BPS brochure
were read as copies on a dealer's site (ivodent.hu), its product page on
ivoclar.com; bredent's two documents on bredent-group.com. Where the notes (or
the model) and the makers disagree, or the makers say nothing:

| | Note in Drive, or the model | Maker |
|---|---|---|
| SR Ivocap, size | 165 × 177 × 520 mm, listed as an official specification | weights only (5.6 kg in three parts), no dimensions |
| SR Ivocap, pressure apparatus | "ID2" | "ID3" in the instructions of 2009, "ID2" in those of 2016 |
| SR Ivocap, clamping load | 3 tons (30 kN / 6,000 lbs) | "3 tons / 6000 lbs"; no figure in kN |
| SR Ivocap, what a capsule holds | 20 g of polymer, 30 ml of monomer | not in the documents read; on dealers' pages |
| SR Ivocap, springs in the frame | twelve disc springs | a set of spring washers, no number |
| thermopress, injection force | 5, 10 or 17 kN | a table of force levels that ends at 17.0 kN |
| thermopress, height | 260 mm with the lever's knob | 250 mm (the model: 263 mm with the knob) |
| thermopress, display | program 04, "bre.flex 2nd", at 265 °C | 280 °C for bre.flex 2nd Edition in bredent's table |
| thermopress, type plate (model only) | REF 540 0000 5 | REF 11000400 for the unit in the brochure |

Everything else in the notes that was checked agrees with the makers: 6 bar
(6.5 at most), 35 minutes in boiling water, the SR Ivocap's three weights;
650 × 300 × 250 mm, 40 kg, 400 °C, the power figures and the two flask sizes
of the thermopress.

What they cost: the lab's frame went from 270 to 307 draw calls (the budget is
400) and from 283,000 to 317,000 triangles (450,000); the frame that also
redoes the shadows from 493 to 560 draw calls; the download from 400 to 428 KB.
The SR Ivocap has 24,004 triangles, just under the 25,000 the README asks a
machine to stay under. The views of the other eleven machines cost what they
did before, to the draw call.

## What was found in the asset library

The first seven machines and the workbench were imported unchanged; the
importer measures each one. (The eighth, the UniFormation GK3, came later: see
"The GK3's 3D model" above. The Medit T500, the two milling machines and the
two injection units are not from the library but from viewer files of their
own: see "The Medit T500's 3D model", "The two milling machines' 3D models" and
"The two injection units' 3D models".) Things worth knowing:

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
4. **The GK3 is the costliest of the library's models to show on its own.** It
   is 178 separate parts, where the README asks for under 100 per machine (the
   3Shape E4, the next, has 114). In the lab it is baked down to 22 like the
   others; in its own view a frame that redoes the shadows takes 392 draw
   calls. Its triangle count (23,176) is within the aim. (Two of the models
   from viewer files are in the same class: the DGSHAPE milling machine with
   213 parts and 518 draw calls on such a frame, the imes-icore with 168 and
   446.)
   The picture its touch screen shows is drawn with a canvas call that browsers
   older than Chrome 99 and Firefox 112 lack; `js/assets/registry.js` supplies
   it there.

## Open decisions

1. **Where the tour lives and who may see it.** It is built as a public page at
   `/lab-tour/` on the CARNIX site, with no login. Right place?
2. **The wording.** The header says "Dental Lab — Digital. Precise. Reliable.",
   as in the concept image; the real name can go there. The Acrylic room's
   subtitle is spelled "Final Prosthesis" (the image has "Prothesis").
3. **DS-EX Pro:** re-proportion the model to its datasheet, or leave it. And
   which version is it (see the table under phase 2)?
4. **How much phones matter.** The tour works on a phone and adapts its layout,
   and its text there is now set larger (phase 1c). Two things remain small on
   a narrow screen: the overview, which larger text made 5 to 7 % smaller
   still, and the room above a room's sheet, which is why the list of machines
   starts below the fold. If most visitors arrive on phones, those two views
   deserve a design of their own: a sheet that can be pulled up and pushed
   down, for one.
5. **The order of the tour.** Reception → plaster → design → printing →
   ceramic → acrylic is a guess at how a case travels. One line to change.
6. **Who the reader is.** The texts are written for somebody with no dental
   training (a student, a patient, a visitor). If the audience is dentists or
   technicians, they should say more and explain less.
7. **The printers.** One UniFormation GK3 stands in the Printing Room, as a
   3D model. Which version is it (GK3 T, GK3 B or GK3 Pro), and what stands in
   the other two printer places? The model was copied out of the library file
   rather than imported from it: see "The GK3's 3D model" in the inventory for
   how to confirm it.
8. **The milling machines.** Two stand in the Printing Room, on a table of
   their own, because the floor plan has no milling room. Is that where they
   are? Which models exactly (CORiTEC 350i PRO or PRO+; DWX-52Di Plus or an
   earlier DWX-52)? And should the tour show them at work, with the cover open
   and the spindle moving, as their own viewers can?
9. **The injection units.** "Ivoclar BPS" was read as the SR Ivocap; is that
   the machine? It and the thermopress 400 stand on the island bench of the
   Acrylic & Prosthodontic Room: is that where they are? Which plastics does
   the lab inject with the thermopress? And the SR Ivocap works with a
   hydraulic press, a polymerisation bath and a capsule vibrator: does the lab
   have them, and should they be modelled next?
