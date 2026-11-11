# Lab Tour

An interactive 3D walk-through of the lab: the whole floor → a room → a machine.

It is one static page. There is no build step, nothing to install and no CDN:
three.js is served from `vendor/`, and everything else is plain ES modules.

**Status:** first working version — the building, six furnished rooms, the 7
machines from the asset library, and 23 placeholders for machines that are not
modelled yet. What comes next, and why it is built in this order, is in
[`docs/PLAN.md`](docs/PLAN.md).

## Run it

```bash
cd lab-tour
npm run serve     # http://localhost:4173
npm run check     # validates the data files and the drawing budget (no browser needed)
```

The page itself needs nothing but a static file server. The two tools
(`check`, `import-assets`) need Node 20.6 or newer and have no dependencies.

Useful addresses while working:

| Address | What it does |
|---|---|
| `#/ceramic` | opens a room directly |
| `#/ceramic/zubler-vario-200` | opens a machine directly (these are shareable links) |
| `?q=low` · `?q=medium` · `?q=high` | forces a quality tier (normally chosen per device) |

## The three files you will edit

Everything specific to *this* lab is data. The 3D scene is generated from it.

| File | What it holds |
|---|---|
| [`js/shell/layout.js`](js/shell/layout.js) | The floor plan in metres: rooms, walls, doors, wall styles, camera angles |
| [`js/rooms/catalogue.js`](js/rooms/catalogue.js) | Every machine: built (has a 3D model) or planned (shown as a blue volume) |
| [`js/rooms/content.js`](js/rooms/content.js) | What stands where in each room: benches, chairs, shelves, machines |

After any edit run `npm run check`. It builds the whole lab without a browser
and reports, in plain words, anything in a wall, in front of a door, overlapping
its neighbour, hanging off its bench, missing from the catalogue, or over the
drawing budget.

> ⚠ The floor-plan dimensions and all 19 "planned" machine types are a **draft**
> (read off the concept image and typical for these rooms). They are marked as
> such in the files and are meant to be replaced with the real plan and the real
> equipment list.

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
- **Download:** about 290 KB compressed in total (three.js 178 KB, machine
  models 67 KB, tour code 47 KB). No images, no fonts.

## Folder map

```text
index.html              page shell + import map
css/tour.css            all styling (light theme; card on wide screens, sheet on phones)
js/main.js              the app: state (overview / room / machine), links, labels, loading
js/shell/               layout.js (floor-plan DATA) · build-shell.js (walls, floors from it)
js/rooms/               catalogue.js, content.js (DATA) · build-rooms.js (places everything)
js/assets/registry.js   one contract over all machine models
js/assets/legacy/       GENERATED from the asset library — do not edit
js/assets/kit/          furniture: bench, shelves, chair, sofa, monitor, display, desk, plant
js/core/                units, stage (renderer + lights), camera, picking, baking, palette
js/ui/                  room and machine labels, icons, the information panel
tools/                  serve.mjs · check.mjs · import-asset-library.mjs
vendor/three-r160/      three.js 0.160.0, unmodified (see its README for why this version)
```

## Deploying with CARNIX

The folder is self-contained and uses only relative paths, so it works from any
location. Inside this repository it is served at **`/lab-tour/`** once merged to
`main` (Cloudflare Pages deploys `main` automatically).

Things to know — none of the existing CARNIX files have been changed:

- **It is public.** The tour does not go through the dashboard login and reads
  no data. Anyone with the address can open it.
- **Nothing links to it yet.** Add a link wherever it should be reachable from.
- **Headers.** The security headers in `/_headers` are attached to `/*.html`
  and `/`, so they do not cover `/lab-tour/`. The tour works without them. To
  give it the same protection, add a block such as:

  ```text
  /lab-tour/*
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
  ```

  (`'unsafe-inline'` is needed for the import map and for the script that
  `functions/_middleware.js` adds to every page.) Leave `X-Frame-Options` out if
  the tour should be embeddable in another website.
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
  speed is unmeasured.
- Browser tests (navigation, deep links, touch, context loss) exist but are not
  in the repository yet, because they need a headless browser to be installed.
- See `docs/PLAN.md` for everything in the concept image that is not built yet.
