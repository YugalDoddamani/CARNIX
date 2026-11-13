# Lab Tour

An interactive 3D walk-through of the lab, made for people who want to learn
what a dental lab does: the whole floor → a room → a machine, with a short
explanation at every step.

It is one static page. There is no build step, nothing to install and no CDN:
three.js is served from `vendor/`, and everything else is plain ES modules.

**Status:** the building, six furnished rooms, 11 machines as 3D models (8 from
the asset library; three from viewer files of their own: the Medit Identica
T500 lab scanner and the two milling machines, imes-icore CORiTEC 350i PRO and
DGSHAPE DWX-52Di Plus), and 22 placeholders for machines that are not modelled
yet; on top of that a guided route through the rooms, a page that explains each
machine, with sourced figures for the nine real ones, and an opening in which
the lab comes up part by part.
What comes next, and why it is built in this order, is in
[`docs/PLAN.md`](docs/PLAN.md).

## What a visitor gets

- **An opening** — when the page opens, the lab comes up part by part in about
  two seconds: the floor, the walls, the glass, the furniture, the machines,
  then the room names and the controls. A tap during it goes straight on.
  A device set to "reduce motion" gets the finished lab at once.
- **A bar to move around with** — the whole lab, then one stop per room in tour
  order. It floats over the lab on wide screens and is a tab bar on phones.
- **A guided route** — every room is "Stop n of 6" with a paragraph on what
  happens there, the machines in it, and a button to the next stop.
- **A welcome guide** — three steps on how to use the page, shown once on a
  first visit and any time from the Guide button.
- **Machines that come forward** — tap one and the lab around it fades. Drag
  and the machine turns about its own middle while the faded lab stands still;
  pinch or scroll to zoom; a slider takes it apart.
- **Up to four pills per machine** — what it is, who makes it (About), its key
  figures (Features) and what sets it apart (Capabilities). Figures carry links
  to the maker's documents they were taken from.

## Run it

```bash
cd lab-tour
npm run serve     # http://localhost:4173
npm run check     # validates the data and the texts, and the drawing budget (no browser needed)
npm run e2e       # walks through the tour in a headless browser (see "Testing")
```

The page itself needs nothing but a static file server. `check`,
`import-assets` and `import-viewer` need Node 20.6 or newer and have no
dependencies.

Useful addresses while working:

| Address | What it does |
|---|---|
| `#/ceramic` | opens a room directly |
| `#/ceramic/zubler-vario-200` | opens a machine directly (these are shareable links) |
| `?q=low` · `?q=medium` · `?q=high` | forces a quality tier (normally chosen per device) |
| `?intro=off` | opens without the opening (the lab is simply there) |

## The four files you will edit

Everything specific to *this* lab is data. The 3D scene and the panels are
generated from it.

| File | What it holds |
|---|---|
| [`js/shell/layout.js`](js/shell/layout.js) | The floor plan in metres: rooms, walls, doors, wall styles, camera angles |
| [`js/rooms/catalogue.js`](js/rooms/catalogue.js) | Every machine: built (has a 3D model) or planned (shown as a blue volume) |
| [`js/rooms/content.js`](js/rooms/content.js) | What stands where in each room: benches, chairs, shelves, machines |
| [`js/rooms/knowledge.js`](js/rooms/knowledge.js) | Everything the visitor reads: the welcome guide, the tour order, what happens in each room, the makers, and each machine's description, figures and sources |

After any edit run `npm run check`. It builds the whole lab without a browser
and reports, in plain words, anything in a wall, in front of a door, overlapping
its neighbour, hanging off its bench, missing from the catalogue, or over the
drawing budget — and any machine without a description, figure without a
source, or icon that does not exist. It ends with the list of things that
still need the lab's confirmation.

> ⚠ **Drafts.** The floor-plan dimensions and the 19 generic "planned" machine
> types (read off the concept image and typical for these rooms), the order of
> the tour and the paragraph about each room are drafts. They are marked as such
> in the files and are meant to be replaced with the real plan, the real
> equipment list and the lab's own words. The figures for the nine real machines
> are taken from their makers' documents; what is still uncertain about them is
> listed by `npm run check` and in `docs/PLAN.md`.

## Recipes

### Change the floor plan

Edit `ROOMS` and `WALLS` in `layout.js` (metres, origin at the north-west
corner, x → east, z → south). Walls, floors, labels, tap areas and camera
framing follow. Furniture is positioned relative to its own room, so a room
that moves takes its contents with it; a room that shrinks may need its
contents re-arranged (`check` tells you which pieces no longer fit).

### Furnish a room

Add entries to that room's list in `content.js`:

```js
{ kit: 'bench', at: [1.6, 0.43], params: { length: 2800, height: 900 },   // metres from the room's NW corner
  seats: [-600, 600],                                                    // chairs, mm from the bench centre
  on: [{ equipment: 'model-trimmer', x: -1050 }] },                      // things on the worktop
{ kit: 'shelf-rack', at: [0.31, 1.9], face: 'E', params: { fill: 'models' } },
{ equipment: 'plaster-sink', at: [3.55, 0.38] },                         // a floor-standing machine
```

Furniture kit (`js/assets/kit/`): `bench` (length, depth, height, pedestals,
legs, upstand), `shelf-rack` (width, depth, height, shelves, fill, seed),
`task-chair`, `sofa`, `desk-monitor`, `wall-display`, `reception-desk`, `plant`.
All sizes in millimetres.

### Add a machine that has no model yet

Add it to `catalogue.js` with `status: 'planned'`, its real name and its
datasheet size, then place it in `content.js`. It appears as a blue volume of
exactly that size, with a marker and an entry in the panel — so the room can be
laid out, and the backlog stays visible, before any modelling is done.

### Add a real machine whose 3D model is not ready yet

When the lab's actual machine is known but not modelled, say so instead of
leaving a generic placeholder:

1. In `catalogue.js`, give it its real name, its size from the maker's data
   sheet, and `known: true`:
   `'uniformation-gk3': { status: 'planned', known: true, icon: 'printer', name: 'UniFormation GK3', shortName: 'GK3', kind: 'Resin 3D printer', mount: 'bench', sizeMm: { w: 392, d: 332, h: 520 } }`.
   Use the id the model will have in the asset library, so nothing has to be
   renamed later. (This is how the UniFormation GK3 was listed until its model
   was imported; no machine is in this state at the moment.)
2. Place it in `content.js`, and write its page in `knowledge.js` (below). A
   known machine must name its maker and its sources; `npm run check` insists.

It still stands in the lab as a blue volume, now at its real size, but the tour
says "Model coming" instead of "Planned" and shows its maker and figures.

### Replace a placeholder with a real model

1. Model the machine in the asset library, following the same contract as the
   existing ones (below).
2. Re-import the library:
   `npm run import-assets -- "path/to/Dental_Lab_Equipment_Asset_Library.html"`
   The importer reads a file on disk. A library that lives in Google Drive has
   to be downloaded (or attached to the chat) first.
   If the machine exists only as its own viewer file so far, import that
   instead: see the next recipe.
3. In `catalogue.js`, change the entry to
   `'<asset id>': { status: 'built', icon: '…', shortName: '…', kind: '…' }`
   (drop `name`, `sizeMm`, `mount` and `known`: a built machine takes its name
   and size from the library).
   If the id changed, use the new id where the machine is placed in `content.js`.
4. `npm run check`, then look at it in the browser.

Nothing else changes: the marker turns solid, the panel says "3D model", and
the machine gets the close-up and exploded view automatically.

### Add a machine from its own viewer file

A machine that is not in the asset library yet usually exists as a viewer of
its own: one HTML file that shows that machine alone
(`<Machine>_Viewer.html`). Its model can be imported straight from that file.

1. `npm run import-viewer -- "path/to/Machine_Viewer.html" --id <asset id> [--size <w>x<d>x<h>] [--name "<name>"] [--md5 <hex>]`
   `--id` is the id the machine will have in the tour (and, later, in the
   library). `--size` is the maker's size in mm; it is kept in the manifest
   beside the size the importer measures. `--name` overrides the name, which
   is otherwise the viewer's own title. `--md5` (or `--sha256`) is the
   checksum Google Drive lists for the file: the import stops unless the file
   on disk is that file. The importer takes the model component
   out of the file (not the viewer's camera, lights and buttons), writes
   `js/assets/viewers/<id>.js`, measures the model and adds it to
   `js/assets/viewers/manifest.js`, together with the checksums of the file.
   Machines imported earlier are left alone. Like the library's importer it
   reads a file on disk.
   It finds the model by what the script does (it is the one that sets
   `window.__ProductModel`), so it does not matter how a viewer names its
   scripts: the scanner's file names them on the tag, the milling machines'
   files in a comment above each.
   **Give it the checksum from Drive.** A file can arrive changed: fetched
   through a proxy that rewrites web pages, each of the two milling machines'
   files came with five script tags altered and one added. The importer knows
   that particular change and takes it out again before it compares; whatever
   else may have happened to a file, the checksum stops the import.
   `docs/PLAN.md` ("The two milling machines' 3D models") has the details.
2. Add it to `catalogue.js` as `status: 'built'`, place it in `content.js` and
   describe it in `knowledge.js`, as for any other machine.
3. `npm run check`, then look at it in the browser.

When the machine later arrives in the asset library under the same id, the
library's copy is used, and `npm run check` fails until the viewer's copy is
removed.

### Write about a machine

Add or edit its entry in `MACHINE_INFO` in `knowledge.js`, under the same id it
has in `catalogue.js`:

```js
'upcera-a7-plus': {
  summary: 'What it is and what it is for, in one or two sentences.',     // required
  how: 'How it works, in two or three.',
  brand: 'upcera',                                   // adds the "About" pill; the maker is described once, in BRANDS
  features: [                                        // adds "Features"; the first figure is shown large
    { label: 'Highest temperature', value: '1,150 °C' },
    { label: 'Chamber', value: '85 × 55 mm', note: 'width × height' },
  ],
  featuresNote: 'An optional sentence under the figures.',
  capabilities: ['What sets it apart, one sentence per point.'],          // adds "Capabilities"
  sources: [{ label: 'UPCERA, product page', url: 'https://…' }],         // required as soon as there are figures
  confirm: 'A note to ourselves about anything unverified. Never shown to visitors.',
},
```

Only `summary` is required; a pill appears only if there is something to put
under it. The rule for this file: **no figure without a source.** If a number
cannot be traced to the maker's manual, data sheet or product page, leave it
out — the tour is for teaching, and a wrong figure is worse than a missing one.
`npm run check` refuses figures that have no source and prints every `confirm`
note. The tour never displays those notes, but the file is as public as the
page itself, so nothing private belongs in one.

### Change the tour order, the room texts or the welcome guide

All in `knowledge.js`: `ROUTE` is one line listing the rooms in tour order (the
bar, "Stop n of 6" and the Next buttons follow it), `ROOM_INFO` has one
paragraph per room, `GUIDE` the welcome text. A room's one-word name on the bar
is its `tab` in `layout.js`; icons are picked by name from
[`js/ui/icons.js`](js/ui/icons.js).

### Update an existing model

Change it in the asset library (or in the machine's viewer file) and re-run
the import. Never edit the files in `js/assets/legacy/` and
`js/assets/viewers/` — they are generated and will be overwritten. If an
imported model needs a correction on the tour's side, it belongs in
[`js/assets/registry.js`](js/assets/registry.js).

## The asset contract

Every machine model, whatever its origin, is used through one shape
(`createEquipment(id)` in `registry.js`):

```text
asset.root            THREE.Object3D · origin at bottom-centre · +Z is the operator side
asset.parts           { name → Object3D } sub-assemblies
asset.setExplode(f)   0 = assembled … 1 = exploded
asset.dispose()
```

Rules for new models, so they drop in without adjustment:

- **Scale:** 1 unit = 80 mm (the library's existing scale). Model to the
  datasheet size; the importer measures every asset and prints both numbers.
- **No lights, cameras or scene setup inside an asset.** The tour owns those.
  A light that a model brings anyway is switched off (`registry.js`). The Medit
  scanner has one, a blue lamp in its scan bay; each milling machine has one in
  its milling chamber.
- **Budget per machine:** aim for under 25,000 triangles and 100 draw calls in
  full detail. The tour bakes each machine down to a few draw calls when it is
  not the one being inspected, but triangles are drawn either way.

## How a machine is shown on its own

Two things make a machine view feel like holding the machine rather than
flying around a room, and both are easy to break:

- **The spotlight** ([`js/core/stage.js`](js/core/stage.js)). The lab is drawn,
  faded to a tenth of its strength, and the machine is drawn again on top,
  untouched, with a soft shade under it. Nothing in the scene is changed to do
  this, so it costs the same for any machine. How faded: `SPOTLIGHT` in
  `layout.js`.
- **Two cameras** ([`js/core/camera-rig.js`](js/core/camera-rig.js)). The
  camera always looks at, and turns about, the middle of the machine; the panel
  is avoided by sliding the picture inside the lens, not by aiming beside the
  machine. While a machine is lit, a second camera draws the lab and keeps the
  direction the visitor arrived from, so a drag turns the machine only. When
  the visitor leaves, the faded lab first swings round to match, then returns
  to full strength.

## How it stays fast

- **Two forms per machine.** Seen from afar, a machine is a baked "lite" copy
  (same geometry, merged by material: 11–29 draw calls instead of 49–213). Only
  the machine being inspected is swapped to its full "hero" form with separate,
  explodable parts.
- **Furniture is merged per room**, placeholders into a single mesh.
- **Frames are drawn on demand.** When nothing moves, nothing is rendered, so
  an open tab does not drain a phone battery. Shadows are re-rendered only when
  the scene changes.
- **Machine code is loaded lazily**, after the building is on screen.
- **Budget:** 400 draw calls and 450,000 triangles for the overview, enforced
  by `npm run check`. Current use: 270 draw calls, 283,000 triangles. That is
  a frame as it is drawn while a visitor looks around. A frame that also
  redoes the shadows (when a model arrives, when a machine is opened, left or
  taken apart) draws every part that casts a shadow a second time: 493 draw
  calls and 555,000 triangles for the whole lab. That frame is over 400 since
  the two milling machines came (with nine machines it was exactly 400); the
  budget was never defined for it, and `npm run e2e` reports it without
  limiting it. Each further machine adds 10 to 30 draw calls to a frame, and
  nearly as many again to a frame with shadows.
- **A machine view** draws the picture in three passes. Measured for the eleven
  models: 90–287 draw calls per frame while a machine is turned, 156–518 on the
  frames that also redo the shadows (arriving, and each step of the take-apart
  slider); a little more once a machine is taken apart, up to 294 and 529.
  With nine machines the ranges were 90–242 and 156–384. The DGSHAPE milling
  machine is the costliest on those frames (518): its model has 213 separate
  parts. Then come the imes-icore milling machine (446; 168 parts) and the
  resin printer (392; 178 parts). A machine that stands behind the one on show
  is drawn too, faded: the two milling machines added 10 to 34 draw calls to
  the views of the three furnaces in the room in front of them.
- **The opening costs four extra frames, once.** Before anything is shown the
  lab is drawn four times with more and more of it switched on, and each
  picture is kept; the browser then fades those pictures away over the live
  one ([`js/core/motion.js`](js/core/motion.js)). Nothing is drawn per frame
  for it, and the pictures are thrown away when it ends. Each is as large as the
  picture on screen: a few megabytes in an ordinary window, never more than
  24 MB (above six megapixels the lab comes up in one plain fade, with no
  pictures kept). If the browser will not hand one out, or anything else in
  the opening fails, the tour opens without it.
- **Download:** about 399 KB compressed in total (three.js 177.8 KB, machine
  models 128.5 KB, tour code and texts 93.0 KB). No images, no fonts.

## Folder map

```text
index.html              page shell + import map
css/tour.css            all styling (light theme; card on wide screens, sheet on phones)
js/main.js              the app: where the visitor is (lab / room / machine), links, the route, loading
js/shell/               layout.js (floor-plan DATA) · build-shell.js (walls, floors from it)
js/rooms/               catalogue.js, content.js, knowledge.js (DATA) · build-rooms.js (places everything)
js/assets/registry.js   one contract over all machine models
js/assets/legacy/       GENERATED from the asset library — do not edit
js/assets/viewers/      GENERATED from single-machine viewer files — do not edit
                        (except _viewer-window.js, which is written by hand)
js/assets/kit/          furniture: bench, shelves, chair, sofa, monitor, display, desk, plant
js/core/                units, stage (renderer, lights, spotlight), camera, picking, baking, palette,
                        motion (the opening; a model fading in when it is ready)
js/ui/                  panel (rooms, machines, pills) · dock (the bar) · guide · labels · icons
tools/                  serve.mjs · check.mjs · import-asset-library.mjs · import-viewer.mjs
tools/browser/          e2e.mjs (the walk-through test) · shots.mjs · film.mjs · lib.mjs
vendor/three-r160/      three.js 0.160.0, unmodified (see its README for why this version)
```

## Testing

`npm run check` needs nothing and is quick; run it after every edit.

`npm run e2e` walks through the tour the way six visitors would — on a desktop
with a mouse, on a 390 × 844 phone with a finger, on a first visit, with
"reduce motion" switched on, one who watches the opening, and one with a
browser from 2021–22 — with real clicks, taps, drags and key presses, and
checks what happens (409 checks, 10 to 13 minutes; `--only=entrance,older` runs
some of them). Among them: a drag turns the machine about its own middle and
leaves the lab behind it unchanged, pixel for pixel; a machine fits the area
the panel leaves free, in a wide window, a small one and on a phone; leaving a
machine clears the spotlight; Back, Forward, Escape and shared links work; the
opening shows the lab's parts in order, ends at once on a tap or a resize,
leaves the same picture as opening without it, and never costs a visitor the
tour: in a browser that cannot supply the pictures it is made of, the tour
opens without it; the four models that came later (the resin printer; the lab
scanner and the two milling machines from their viewer files) are shown, fill
the view and come apart like the first seven; the lamps that the scanner and
the milling machines bring stay off; and no machine in the Printing Room is
out of reach behind the milling machines.

It needs the tour running (`npm run serve`) and a headless Chromium, which is
not part of the repository. Install it once, anywhere outside the repo:

```bash
mkdir -p /tmp/lab-tour-browser && cd /tmp/lab-tour-browser
npm init -y && npm install puppeteer-core @sparticuz/chromium
export LAB_TOUR_BROWSER=/tmp/lab-tour-browser     # this path is the default
```

Two more tools for looking rather than checking:

```bash
# stills of any address; add ~<javascript> to run something first
npm run shots -- /tmp/tour-shots --size=390x844 --touch 'room=#/ceramic' 'features=#/design/3shape-e4~labTour.panel.selectTab("features")'
# a journey as one still per tenth of a second
npm run film -- /tmp/tour-film --from='#/ceramic/zubler-vario-200' --to='#/ceramic' --turn=200
```

The headless browser draws 3D in software, so the tests stop the tour's clock
and move it by hand (`labTour.stage.clock`). The opening runs on the browser's
own clock instead, so for the tests it is held with `?intro=hold` and moved
with `labTour.motion.seek(ms)` and `labTour.motion.release()`. The tests prove
behaviour; they say nothing about speed, or about how smooth the opening is,
on a real device.

## Deploying with CARNIX

The folder is self-contained and uses only relative paths, so it works from any
location. Inside this repository it is served at **`/lab-tour/`** once merged to
`main` (Cloudflare Pages deploys `main` automatically).

Things to know — none of the existing CARNIX files have been changed:

- **It is public.** The tour does not go through the dashboard login and reads
  no data. Anyone with the address can open it.
- **Nothing links to it yet.** Add a link wherever it should be reachable from.
- **It links out, and loads nothing from outside.** The sources under a
  machine's figures are links to the makers' websites; they open in a new tab.
  The page itself requests files from its own folder only.
- **It remembers one thing** in the browser: that the welcome guide has been
  seen (`lab-tour:welcomed` in localStorage). No cookies, no tracking.
- **Headers.** The security headers in `/_headers` are attached to `/*.html`
  and `/`, so they do not cover `/lab-tour/`. The tour works without them. To
  give it the same protection, add a block such as:

  ```text
  /lab-tour/*
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
  ```

  (`'unsafe-inline'` is needed for the import map, for the script that
  `functions/_middleware.js` adds to every page, and for a few `style`
  attributes in the panel. The browser tests have been run with exactly this
  block in place.) Leave `X-Frame-Options` out if the tour should be
  embeddable in another website.
- **The middleware** adds `window.__ENV__` (Supabase URL and publishable key) to
  every HTML page, this one included. The tour does not use it; it is the same
  public information the login page already carries.

## Known limits

- The page needs WebGL and a browser with import maps (Chrome 89, Firefox 108,
  Safari 16.4 — in practice anything updated since early 2023). On anything
  older, without WebGL, or if a file fails to download, a message is shown
  instead of an empty page.
- It has been tested in an automated desktop browser and an emulated phone, with
  software rendering. It has not been run on real phones yet, so real-device
  speed and feel are unmeasured.
- The welcome guide is remembered per device (in the browser's storage); a
  visitor in a private window sees it every time.
- A machine that is not modelled yet shows a description of its kind only: no
  maker, no figures.
- The resin printer's model was copied out of the asset library in Google
  Drive by hand, because the file itself could not be fetched. It builds, has
  the size and the number of parts its own description gives, and was looked
  at from every side; it is not proven to be identical to the file, character
  for character. `docs/PLAN.md` ("The GK3's 3D model") says how to settle that.
- The Medit scanner's model has a blue lamp of its own in its scan bay, lit
  in the scanner's own viewer. The tour switches it off, as it does with any
  light inside a machine; with it, the bay's inner walls would have a faint
  blue cast. `docs/PLAN.md` ("The Medit T500's 3D model") has the measurements
  behind that choice.
- The two milling machines do less in the tour than in their own viewers.
  There, a button opens the cover and another lets the machine mill: the
  spindle, the disc and the axes move, and the DGSHAPE's chamber light turns
  blue. The tour has no such buttons for any machine yet; the models'
  functions for it are imported and unused, and the light in each milling
  chamber is off. Both models also show details that were not checked against
  the makers' documents (type plates, stickers, a drawer); `npm run check`
  lists them, and `docs/PLAN.md` ("The two milling machines' 3D models").
- There is no milling room in the floor plan. The two milling machines stand
  in the Printing Room, on a table of their own: a choice made here, and one
  entry in `js/rooms/content.js` to change.
- The opening plays on every visit, not only the first.
- See `docs/PLAN.md` for everything in the concept image that is not built yet.
