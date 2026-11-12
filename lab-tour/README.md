# Lab Tour

An interactive 3D walk-through of the lab, made for people who want to learn
what a dental lab does: the whole floor → a room → a machine, with a short
explanation at every step.

It is one static page. There is no build step, nothing to install and no CDN:
three.js is served from `vendor/`, and everything else is plain ES modules.

**Status:** the building, six furnished rooms, the 7 machines from the asset
library, and 23 placeholders for machines that are not modelled yet; on top of
that a guided route through the rooms and a page that explains each machine,
with sourced figures for the five real ones.
What comes next, and why it is built in this order, is in
[`docs/PLAN.md`](docs/PLAN.md).

## What a visitor gets

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

The page itself needs nothing but a static file server. `check` and
`import-assets` need Node 20.6 or newer and have no dependencies.

Useful addresses while working:

| Address | What it does |
|---|---|
| `#/ceramic` | opens a room directly |
| `#/ceramic/zubler-vario-200` | opens a machine directly (these are shareable links) |
| `?q=low` · `?q=medium` · `?q=high` | forces a quality tier (normally chosen per device) |

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

> ⚠ **Drafts.** The floor-plan dimensions and all 19 "planned" machine types
> (read off the concept image and typical for these rooms), the order of the
> tour and the paragraph about each room are drafts. They are marked as such in
> the files and are meant to be replaced with the real plan, the real equipment
> list and the lab's own words. The figures for the five real machines are
> taken from their makers' documents; what is still uncertain about them is
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

### Replace a placeholder with a real model

1. Model the machine in the asset library, following the same contract as the
   existing seven (below).
2. Re-import the library:
   `npm run import-assets -- "path/to/Dental_Lab_Equipment_Asset_Library.html"`
3. In `catalogue.js`, change the entry to
   `'<asset id>': { status: 'built', shortName: '…', kind: '…' }`.
   If the id changed, use the new id where the machine is placed in `content.js`.
4. `npm run check`, then look at it in the browser.

Nothing else changes: the marker turns solid, the panel says "3D model", and
the machine gets the close-up and exploded view automatically.

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

Change it in the asset library and re-run the import. Never edit the files in
`js/assets/legacy/` — they are generated and will be overwritten. If an imported
model needs a correction on the tour's side, it belongs in
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
  (same geometry, merged by material: 11–24 draw calls instead of 49–114). Only
  the machine being inspected is swapped to its full "hero" form with separate,
  explodable parts.
- **Furniture is merged per room**, placeholders into a single mesh.
- **Frames are drawn on demand.** When nothing moves, nothing is rendered, so
  an open tab does not drain a phone battery. Shadows are re-rendered only when
  the scene changes.
- **Machine code is loaded lazily**, after the building is on screen.
- **Budget:** 400 draw calls and 450,000 triangles for the overview, enforced
  by `npm run check`. Current use: 175 draw calls, 218,000 triangles.
- **A machine view** draws the picture in three passes. Measured for the seven
  models: 84–219 draw calls per frame while a machine is turned, 150–323 on the
  frames that also redo the shadows (arriving, and each step of the take-apart
  slider).
- **Download:** about 320 KB compressed in total (three.js 178 KB, machine
  models 66 KB, tour code and texts 77 KB). No images, no fonts.

## Folder map

```text
index.html              page shell + import map
css/tour.css            all styling (light theme; card on wide screens, sheet on phones)
js/main.js              the app: where the visitor is (lab / room / machine), links, the route, loading
js/shell/               layout.js (floor-plan DATA) · build-shell.js (walls, floors from it)
js/rooms/               catalogue.js, content.js, knowledge.js (DATA) · build-rooms.js (places everything)
js/assets/registry.js   one contract over all machine models
js/assets/legacy/       GENERATED from the asset library — do not edit
js/assets/kit/          furniture: bench, shelves, chair, sofa, monitor, display, desk, plant
js/core/                units, stage (renderer, lights, spotlight), camera, picking, baking, palette
js/ui/                  panel (rooms, machines, pills) · dock (the bar) · guide · labels · icons
tools/                  serve.mjs · check.mjs · import-asset-library.mjs
tools/browser/          e2e.mjs (the walk-through test) · shots.mjs · film.mjs · lib.mjs
vendor/three-r160/      three.js 0.160.0, unmodified (see its README for why this version)
```

## Testing

`npm run check` needs nothing and is quick; run it after every edit.

`npm run e2e` walks through the tour the way four visitors would — on a desktop
with a mouse, on a 390 × 844 phone with a finger, on a first visit, and with
"reduce motion" switched on — with real clicks, taps, drags and key presses,
and checks what happens (about 270 checks, 6–7 minutes). Among them: a drag
turns the machine about its own middle and leaves the lab behind it unchanged,
pixel for pixel; a machine fits the area the panel leaves free, in a wide
window, a small one and on a phone; leaving a machine clears the spotlight;
Back, Forward, Escape and shared links work.

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
and move it by hand (`labTour.stage.clock`). They prove behaviour; they say
nothing about speed on a real device.

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
- See `docs/PLAN.md` for everything in the concept image that is not built yet.
