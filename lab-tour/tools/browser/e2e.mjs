// npm run e2e — a visitor's walk through the tour, checked step by step in a
// real (headless) browser. Five visitors, and the way the lab arrives:
//
//   desktop   a wide window and a mouse
//   phone     a 390 × 844 phone and a finger; then 360 × 640 and 320 × 568,
//             and a phone on which one model's file never arrives
//   first     somebody who has never been here (the welcome guide)
//   reduced   somebody who has asked their device for less motion
//   entrance  the opening: the lab coming up part by part, a model fading in
//   howto     somebody who follows the guides to working a machine ("How to
//             use it"), every step of every guide of every machine that has
//             them: beside the lab, on a phone and on smaller ones, with
//             reduced motion, and by a link straight to a step
//   older     a browser that cannot draw rounded rectangles
//
//   node tools/browser/e2e.mjs [--only=desktop,phone] [--base=http://127.0.0.1:4173/]
//        [--guided=room/machine] [--q=low] [--verbose]
//
// The tour must be running (npm run serve) and a headless browser installed
// (see lib.mjs). Everything is done the way a visitor does it: real clicks and
// taps at the place where the thing is on screen, real drags, real key presses.
// Exit code 1 if any check fails.
//
// What this cannot tell: how fast the tour runs on a real phone, and how it
// looks. For looks there are shots.mjs and film.mjs.
import { HOW_TO } from '../../js/rooms/how-to.js';
import { ROOMS, SPOTLIGHT, VIEWS } from '../../js/shell/layout.js';
import { frames, go, holdClock, launchBrowser, openTour, parseArgs, pass, sleep, waitReady } from './lib.mjs';

const { flags } = parseArgs(process.argv.slice(2));
const base = flags.base || 'http://127.0.0.1:4173/';
const only = flags.only ? String(flags.only).split(',') : null;
const quality = flags.q || 'low';
const WELCOMED = { 'lab-tour:welcomed': '1' };

// The machines the walk visits. Change them if the lab's contents change.
const MACHINE = flags.machine || 'ceramic/zubler-vario-200'; // modelled, has all four pills
const NEIGHBOUR = flags.neighbour || 'ceramic/upcera-a7-plus'; // the next machine in the same room
const PLANNED = flags.planned || 'plaster/model-trimmer'; // not modelled yet
const PRINTER = flags.printer || 'printing/uniformation-gk3'; // modelled; the last machine to come out of the asset library
const SCANNER = flags.scanner || 'design/medit-t500'; // modelled; came out of a single-machine viewer file, not out of the library
// The two milling machines: from viewer files as well, and the largest and heaviest machines in the lab.
const MILLS = [
  { id: flags.mill || 'printing/imes-icore-350i-pro', apart: 'its shell, front, door, coolant drawer and chamber move away from each other' },
  { id: flags.drymill || 'printing/dgshape-dwx-52di-plus', apart: 'its cabinet, cover, drawer, chamber and tool changer move away from each other' },
];
// The two injection units of the Acrylic room: from viewer files too. `lamps` is the number of lights that the
// model brings along (the tour keeps them switched off); `hides` is the number of meshes that the model keeps out
// of sight while it is closed, `shows` how many of those appear once it is taken apart.
const INJECTORS = [
  { id: flags.ivocap || 'acrylic/ivoclar-sr-ivocap', lamps: 0, hides: 0, shows: 0, apart: 'its clamping frame, flask halves, capsule, vise shank and pressure apparatus move away from each other' },
  { id: flags.thermopress || 'acrylic/bredent-thermopress-400', lamps: 2, hides: 4, shows: 3, apart: 'its housing, lid, heating cylinder, flask and clamping tool move away from each other' },
];
// The machine whose guides ("How to use it") the walk follows in full: any machine with an entry in rooms/how-to.js.
// Every other machine with guides is then walked through as well, step by step; `--guided=room/machine` walks
// through that one alone, in full.
const GUIDED = flags.guided || 'acrylic/bredent-thermopress-400';
// A machine without guides: it has no card for them, and no pages.
const UNGUIDED = [NEIGHBOUR, MACHINE, SCANNER, PRINTER].find((id) => !HOW_TO[id.split('/')[1]]) ?? null;
const roomOf = (id) => id.split('/')[0];
// The file one walk goes without, to see what the tour says when a model fails to arrive: the scanner's.
const LOST_MODEL = new RegExp(`/viewers/${SCANNER.split('/')[1]}\\.js`);

// What layout.js asks for, in the terms the checks measure.
const FADED = 1 - SPOTLIGHT.rest; // how far the lab is faded around a spotlit machine
const PASSING = 1 - SPOTLIGHT.passing; // and on the way from one machine to the next
const FILL = 1 - VIEWS.item.padding; // the share of the free area a machine fills

// ── Reporting ────────────────────────────────────────────────────────────────
const failures = [];
let checks = 0;
let current = '';

function check(what, ok, detail = '') {
  checks++;
  if (ok) {
    if (flags.verbose) console.log(`      ✓ ${what}`);
    return true;
  }
  failures.push(`${current} › ${what}${detail === '' ? '' : ` — ${detail}`}`);
  console.log(`      ✗ ${what}${detail === '' ? '' : ` — ${detail}`}`);
  return false;
}

async function step(title, run) {
  const visitor = current.split(' › ')[0];
  current = `${visitor} › ${title}`;
  const before = failures.length;
  try {
    await run();
  } catch (error) {
    failures.push(`${current} › could not finish: ${error.message}`);
    console.log(`      ✗ could not finish: ${error.message}`);
  }
  console.log(`  ${failures.length === before ? '✓' : '✗'} ${title}`);
  current = visitor;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
const round = (value, digits = 2) => Number(value.toFixed(digits));
const turnBetween = (a, b) => Math.abs(((b - a + 540) % 360) - 180); // degrees, the short way round
const inside = (rect, area, tolerance = 2) =>
  rect.left >= area.left - tolerance && rect.right <= area.right + tolerance && rect.top >= area.top - tolerance && rect.bottom <= area.bottom + tolerance;
const middle = (rect) => ({ x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 });
const centred = (rect, area, tolerance = 2) => near(middle(rect).x, middle(area).x, tolerance) && near(middle(rect).y, middle(area).y, tolerance);
const box = (rect) => `${Math.round(rect.left)},${Math.round(rect.top)} → ${Math.round(rect.right)},${Math.round(rect.bottom)}`;
/** The share of the free area a framed thing takes up, along whichever side is the tighter fit. */
const fill = (rect, area) => Math.max((rect.right - rect.left) / (area.right - area.left), (rect.bottom - rect.top) / (area.bottom - area.top));
const moved = (a, b) => Math.max(...a.map((value, index) => Math.abs(value - b[index])));
const overlaps = (a, b, margin = 0) => a.left < b.right + margin && a.right > b.left - margin && a.top < b.bottom + margin && a.bottom > b.top - margin;

// ── What runs inside the page ────────────────────────────────────────────────
function install() {
  const rect = (element) => {
    const r = element.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  };
  const describe = (element) => {
    if (!element) return 'nothing';
    const classes = typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : '';
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes}`;
  };
  const canvas = () => window.labTour.stage.renderer.domElement;

  // When the "drag to turn" hint came and went, for the message of a check that
  // misses it. (It hides itself nine seconds of real time after it appears,
  // whatever the tour's clock is doing. Those seconds once counted from the
  // moment it was asked for: when the next frame came later than that, as it
  // twice did here with the picture drawn in software, the hint went as soon
  // as it had come.)
  const hintLog = [];
  {
    const hint = document.getElementById('gesture-hint');
    const note = () => hintLog.push(`${hint.hidden ? 'hidden' : hint.classList.contains('is-shown') ? 'shown' : 'on its way'} at ${Math.round(performance.now())}`);
    new MutationObserver(note).observe(hint, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }

  window.__t = {
    /** The part of the stage that no panel or bar covers. */
    free() {
      const stage = rect(document.getElementById('stage'));
      const { top, right, bottom, left } = window.labTour.insets;
      return { left: stage.left + left, top: stage.top + top, right: stage.right - right, bottom: stage.bottom - bottom };
    },

    /** Everything a check might want to know about the moment. */
    see() {
      const tour = window.labTour;
      const pose = tour.rig.pose;
      const spot = tour.stage.spotlightState;
      const controls = tour.rig.controls;
      const panel = document.getElementById('panel');
      const hint = document.getElementById('gesture-hint');
      const shown = (selector) => [...document.querySelectorAll(selector)].filter((element) => !element.classList.contains('is-hidden'));
      return {
        place: tour.state.itemId ?? tour.state.roomId ?? 'lab',
        mode: tour.state.mode,
        htmlMode: document.documentElement.dataset.mode,
        hash: location.hash,
        title: document.title,
        busy: tour.busy,
        azimuth: pose.azimuth,
        elevation: pose.elevation,
        distance: pose.distance,
        target: [pose.target.x, pose.target.y, pose.target.z],
        lag: tour.rig.lag,
        roomHolds: tour.rig.roomHolds,
        roomDistance: tour.rig.roomCamera.position.distanceTo(controls.target),
        minDistance: controls.minDistance,
        maxDistance: controls.maxDistance,
        lit: spot.key,
        veil: spot.veil,
        dock: [...document.querySelectorAll('.dock__item[aria-current="page"]')].map((button) => button.dataset.id),
        panelMode: panel.dataset.mode,
        heading: panel.querySelector('h1')?.textContent ?? '',
        eyebrow: panel.querySelector('.eyebrow')?.textContent ?? '',
        tabs: [...panel.querySelectorAll('[role="tab"]')].map((tab) => tab.dataset.tab),
        tab: tour.panel.tab,
        hotspots: shown('.hotspot').length,
        roomNames: shown('.room-pill').length,
        guide: tour.guide.isOpen,
        hint: hint.classList.contains('is-shown'),
        hintText: hint.textContent.trim(),
        hintLog: [...hintLog, `looked at ${Math.round(performance.now())}`].join(', '),
        hintRect: rect(hint),
        focus: describe(document.activeElement),
        calls: tour.renderInfo().calls,
        free: this.free(),
        stage: rect(document.getElementById('stage')),
        panelRect: rect(panel),
        dockRect: rect(document.getElementById('dock')),
        window: { width: innerWidth, height: innerHeight },
      };
    },

    /**
     * The text a visitor can read right now, piece by piece, with the size it
     * is set in. Counted: everything that is drawn (not switched off, clipped
     * away or faded out); in the panel and the welcome guide also what is
     * scrolled out of sight. Where the stylesheet swaps a name for a shorter
     * one, `::after` draws the shorter one, so that is what is reported.
     * `read` marks running text: descriptions, points, the names in a list.
     */
    type() {
      const pieces = [];
      const drawn = (element) => {
        for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.05 || /inset\(50%\)/.test(style.clipPath)) return false;
        }
        return true;
      };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        const element = node.parentElement;
        if (!text || !element || element.closest('script, style') || !drawn(element)) continue;
        const style = getComputedStyle(element);
        if (parseFloat(style.fontSize) === 0) {
          const after = getComputedStyle(element, '::after');
          const shown = after.content.replace(/^"|"$/g, '');
          if (after.content !== 'none' && shown) pieces.push({ what: `${describe(element)}::after`, px: parseFloat(after.fontSize), text: shown, read: false });
          continue;
        }
        const range = document.createRange();
        range.selectNodeContents(node);
        const boxes = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
        if (!boxes.length) continue;
        const scrolls = Boolean(element.closest('#panel, dialog.guide'));
        if (!scrolls && !boxes.some((r) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth)) continue;
        const read = Boolean(element.closest('.lead, .body, .points li, .row__text strong, .howto-step__text, .guide__steps strong'));
        pieces.push({ what: describe(element), px: parseFloat(style.fontSize), text: text.slice(0, 40), read });
      }
      return pieces;
    },

    /**
     * The pages of a machine's guides ("How to use it"), as a visitor has them
     * in front of them: what the panel shows, where the rings are, how the
     * machine is shown. Rectangles are in CSS pixels of the page.
     */
    howTo() {
      const tour = window.labTour;
      const panel = document.getElementById('panel');
      const text = (element) => (element ? element.textContent.replace(/\s+/g, ' ').trim() : '');
      const shownText = (element) => (element ? element.innerText.replace(/\s+/g, ' ').trim() : ''); // as it is drawn: capitals where the stylesheet sets them
      const rectOf = (selector) => {
        const element = panel.querySelector(selector);
        return element && element.getClientRects().length ? rect(element) : null;
      };
      const entry = tour.items().find((item) => item.id === tour.state.itemId) ?? {};
      const layer = document.querySelector('.marker-layer');
      // A ring is drawn around the place of its element, which itself has no size.
      const rings = [...document.querySelectorAll('.marker-layer .marker')].map((ring) => {
        const at = ring.getBoundingClientRect();
        const half = parseFloat(ring.style.getPropertyValue('--size')) / 2 || 0;
        return { left: at.left - half, top: at.top - half, right: at.left + half, bottom: at.top + half };
      });
      const note = panel.querySelector('.howto-note');
      const current = panel.querySelector('.howto-step.is-current');
      const next = panel.querySelector('[data-focus="next"]');
      const focused = document.activeElement;
      return {
        page: panel.dataset.howto ?? null,
        card: shownText(panel.querySelector('[data-howto]')),
        rows: [...panel.querySelectorAll('.howto-guides [data-howto-guide]')].map((row) => ({ id: row.dataset.howtoGuide, text: text(row) })),
        said: document.getElementById('announcer').textContent,
        note: note ? { text: text(note), links: [...note.querySelectorAll('a')].map((link) => ({ href: link.getAttribute('href'), target: link.target, rel: link.rel })) } : null,
        focus: focused === panel ? 'panel' : (focused?.dataset?.focus ?? describe(focused)),
        rings,
        ringsShown: rings.length > 0 && !layer.classList.contains('is-away') && Number(getComputedStyle(layer).opacity) > 0.95,
        awayFlag: panel.hasAttribute('data-mark-away'),
        ringsTakeTaps: rings.some((ring) => Boolean(document.elementFromPoint((ring.left + ring.right) / 2, (ring.top + ring.bottom) / 2)?.closest('.marker-layer'))),
        marks: tour.marks,
        state: tour.state.howTo,
        lid: entry.open ?? 0,
        without: entry.without ?? [],
        tier: entry.tier ?? null,
        apart: entry.apart ?? 0,
        count: text(panel.querySelector('.howto-count')),
        heading: shownText(panel.querySelector('.howto-title')),
        nameShown: Boolean(panel.querySelector('.howto-machine')?.getClientRects().length),
        back: text(panel.querySelector('.back')),
        open: current
          ? {
              title: text(current.querySelector('.howto-step__title')),
              text: text(current.querySelector('.howto-step__text')),
              rect: rect(current),
              titleRect: rect(current.querySelector('.howto-step__title')),
              aim: Boolean(current.querySelector('[data-howto-aim]')),
            }
          : null,
        progress: [...panel.querySelectorAll('.howto-progress i')].map((dash) => dash.classList.contains('is-done')),
        listed: [...panel.querySelectorAll('.howto-step')].filter((row) => row.getClientRects().length > 0).length,
        total: panel.querySelectorAll('.howto-step').length,
        head: rectOf('.howto-head'),
        bar: rectOf('.howto-nav'),
        sheet: rect(panel),
        next: next ? text(next) : null,
        nextRect: rectOf('[data-focus="next"]'),
        backRect: rectOf('[data-focus="back"]'),
        scrolled: panel.scrollTop,
        scrolls: panel.scrollHeight - panel.clientHeight,
      };
    },

    /**
     * Every corner of every mesh under `object`, one by one: `use(x, y, z)`.
     * In the world's coordinates, or taken on through `toSpace`. Each copy of
     * an instanced mesh counts (a furnace's vent slots are one mesh, drawn
     * many times; without this they would all lie at the mesh's own origin).
     */
    eachCorner(object, toSpace, use) {
      const point = window.labTour.stage.camera.position.clone();
      const copy = object.matrixWorld.clone();
      const lies = object.matrixWorld.clone();
      object.traverse((mesh) => {
        const corners = mesh.isMesh ? mesh.geometry.attributes.position : null;
        if (!corners) return;
        for (let index = 0; index < (mesh.isInstancedMesh ? mesh.count : 1); index++) {
          lies.copy(mesh.matrixWorld);
          if (mesh.isInstancedMesh) {
            mesh.getMatrixAt(index, copy);
            lies.multiply(copy);
          }
          if (toSpace) lies.premultiply(toSpace);
          for (let corner = 0; corner < corners.count; corner++) {
            point.fromBufferAttribute(corners, corner).applyMatrix4(lies);
            use(point.x, point.y, point.z);
          }
        }
      });
    },

    /**
     * A machine's model as it is built: a second copy of it, made here and
     * never shown, since the one in the tour may stand open at this moment.
     * `lies` says where each named thing in it lies, in the model's own
     * coordinates (the first thing of each name, as getObjectByName finds it).
     */
    async builtModel(typeId) {
      this.built ??= new Map();
      if (!this.built.has(typeId)) {
        const { createEquipment } = await import(new URL('js/assets/registry.js', document.baseURI).href);
        const twin = await createEquipment(typeId);
        twin.root.updateWorldMatrix(true, true);
        const toModel = twin.root.matrixWorld.clone().invert();
        const lies = new Map();
        twin.root.traverse((node) => {
          if (node.name && !lies.has(node.name)) lies.set(node.name, toModel.clone().multiply(node.matrixWorld));
        });
        this.built.set(typeId, { root: twin.root, toModel, lies });
      }
      return this.built.get(typeId);
    },

    /**
     * The named things in a machine's model that lie elsewhere at this moment
     * than in the model as it is built: a lid that stands open, with all that
     * is on it. An empty list: every part lies as built.
     */
    async movedParts(itemId) {
      const typeId = itemId.split('/')[1];
      const root = window.labTour.stage.scene.getObjectByName(itemId)?.getObjectByName(typeId);
      if (!root) return null;
      const built = await this.builtModel(typeId);
      root.updateWorldMatrix(true, true);
      const toModel = root.matrixWorld.clone().invert();
      const lies = toModel.clone();
      const met = new Set();
      const moved = [];
      root.traverse((node) => {
        if (!node.name || met.has(node.name)) return;
        met.add(node.name);
        const was = built.lies.get(node.name);
        if (!was) return;
        lies.multiplyMatrices(toModel, node.matrixWorld);
        if (lies.elements.some((value, index) => Math.abs(value - was.elements[index]) > 1e-4)) moved.push(node.name);
      });
      return moved;
    },

    /**
     * A named part of the machine in the spotlight, on screen: the rectangle
     * around every corner of its meshes, in CSS pixels of the page. Read from
     * the 3D scene as it stands at this moment.
     */
    partOnScreen(name) {
      const tour = window.labTour;
      const id = tour.state.itemId;
      const root = id ? tour.stage.scene.getObjectByName(id)?.getObjectByName(id.split('/')[1]) : null;
      const part = root?.getObjectByName(name);
      if (!part) return null;
      const camera = tour.stage.camera;
      camera.updateMatrixWorld();
      root.updateWorldMatrix(true, true);
      const bounds = canvas().getBoundingClientRect();
      const point = camera.position.clone();
      const seen = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      this.eachCorner(part, null, (x, y, z) => {
        point.set(x, y, z).project(camera);
        const px = bounds.left + (point.x * 0.5 + 0.5) * bounds.width;
        const py = bounds.top + (-point.y * 0.5 + 0.5) * bounds.height;
        seen.left = Math.min(seen.left, px);
        seen.right = Math.max(seen.right, px);
        seen.top = Math.min(seen.top, py);
        seen.bottom = Math.max(seen.bottom, py);
      });
      return Number.isFinite(seen.left) ? seen : null;
    },

    /**
     * A place of a guide on screen, in CSS pixels of the page: the rectangle
     * that it frames, and `spots`, where each of its points is. `place` is
     * the place as rooms/how-to.js writes it down ({ part, at, show }), in
     * the coordinates of the machine's model. Worked out here from that and
     * from the 3D scene, not by the tour's own code: a stretch of the machine
     * around its points (`show` as a number), or the box of a part as it lies
     * at this moment, and in any case its points.
     * A point is written down where the model's file has it, and belongs to
     * its part: when the part moves (a furnace's head tips open, its lift
     * carries the firing table up), the point goes with it. So it is taken
     * from where the part lies in the model as built (`builtModel`) to where
     * the same part lies in the scene now. A place without points marks the
     * middle of its part, as built, and that goes with the part likewise.
     */
    async placeOnScreen(itemId, place) {
      const tour = window.labTour;
      const typeId = itemId.split('/')[1];
      const root = tour.stage.scene.getObjectByName(itemId)?.getObjectByName(typeId);
      const part = root?.getObjectByName(place.part);
      if (!part) return null;
      const built = await this.builtModel(typeId);
      const builtPart = built.root.getObjectByName(place.part);
      if (!builtPart) return null;
      const camera = tour.stage.camera;
      camera.updateMatrixWorld();
      root.updateWorldMatrix(true, true);
      const point = camera.position.clone();
      const toModel = root.matrixWorld.clone().invert();
      const span = () => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
      const grow = (into, x, y, z) => {
        [x, y, z].forEach((value, axis) => {
          into.min[axis] = Math.min(into.min[axis], value);
          into.max[axis] = Math.max(into.max[axis], value);
        });
      };
      // The points of the place as the model's file has them; without any it points at the middle of its part.
      let points = Array.isArray(place.at?.[0]) ? place.at : place.at ? [place.at] : [];
      if (!points.length) {
        const whole = span();
        this.eachCorner(builtPart, built.toModel, (x, y, z) => grow(whole, x, y, z));
        if (!whole.min.every(Number.isFinite)) return null;
        points = [[0, 1, 2].map((axis) => (whole.min[axis] + whole.max[axis]) / 2)];
      }
      // From the model as built to the model as it stands: with the part.
      const carry = toModel.clone().multiply(part.matrixWorld).multiply(built.lies.get(place.part).clone().invert());
      const now = points.map((at) => {
        point.set(at[0], at[1], at[2]).applyMatrix4(carry);
        return [point.x, point.y, point.z];
      });
      const frame = span();
      if (typeof place.show === 'number') {
        const mean = [0, 1, 2].map((axis) => now.reduce((sum, at) => sum + at[axis], 0) / now.length);
        grow(frame, ...mean.map((value) => value - place.show / 2));
        grow(frame, ...mean.map((value) => value + place.show / 2));
      } else {
        const shown = typeof place.show === 'string' ? root.getObjectByName(place.show) : part;
        if (shown) this.eachCorner(shown, toModel, (x, y, z) => grow(frame, x, y, z));
      }
      for (const at of now) grow(frame, ...at);
      if (!frame.min.every(Number.isFinite)) return null;
      const bounds = canvas().getBoundingClientRect();
      const onScreen = (x, y, z) => {
        point.set(x, y, z).applyMatrix4(root.matrixWorld).project(camera);
        return { x: bounds.left + (point.x * 0.5 + 0.5) * bounds.width, y: bounds.top + (-point.y * 0.5 + 0.5) * bounds.height };
      };
      const seen = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity, spots: now.map((at) => onScreen(at[0], at[1], at[2])) };
      for (const x of [frame.min[0], frame.max[0]]) {
        for (const y of [frame.min[1], frame.max[1]]) {
          for (const z of [frame.min[2], frame.max[2]]) {
            const corner = onScreen(x, y, z);
            seen.left = Math.min(seen.left, corner.x);
            seen.right = Math.max(seen.right, corner.x);
            seen.top = Math.min(seen.top, corner.y);
            seen.bottom = Math.max(seen.bottom, corner.y);
          }
        }
      }
      return seen;
    },

    /** The stops of the navigation bar: the name each one shows, and where that name and the stop are. */
    bar() {
      return [...document.querySelectorAll('.dock__item')].map((button) => {
        const label = button.querySelector('.dock__label');
        const swapped = parseFloat(getComputedStyle(label).fontSize) === 0;
        return { id: button.dataset.id, text: swapped ? getComputedStyle(label, '::after').content.replace(/^"|"$/g, '') : label.textContent, label: rect(label), stop: rect(button) };
      });
    },

    /** Where to click a control, and what (if anything) is in the way. */
    point(selector) {
      const element = document.querySelector(selector);
      if (!element) return null;
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      const r = element.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      const reachable = top && (top === element || element.contains(top));
      return { x, y, width: r.width, height: r.height, inTheWay: reachable ? null : describe(top) };
    },

    /**
     * A point on the 3D picture where a tap hits this room or machine: on the
     * picture itself (no label over it) and with nothing nearer in front.
     */
    tapPoint(id) {
      const tour = window.labTour;
      const where = tour.whereIs(id);
      if (!where) return null;
      const wanted = id.includes('/') ? { type: 'item', key: 'itemId' } : { type: 'room', key: 'roomId' };
      const tries = [[0.5, 0.5]];
      for (const fy of [0.6, 0.4, 0.7, 0.3, 0.8, 0.2]) for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) tries.push([fx, fy]);
      for (const [fx, fy] of tries) {
        const x = where.left + (where.right - where.left) * fx;
        const y = where.top + (where.bottom - where.top) * fy;
        if (document.elementFromPoint(x, y) !== canvas()) continue;
        const hit = tour.pick(x, y);
        if (hit && hit.type === wanted.type && hit[wanted.key] === id) return { x, y };
      }
      return null;
    },

    /**
     * Draw a frame now and read back part of the 3D picture: every other pixel
     * of `area` (CSS pixels of the page), as a flat list of colour values.
     * `share`: draw the surroundings of a spotlit machine at this share of
     * their full strength, so that they show clearly in the numbers.
     */
    pixels(area, share = null) {
      const tour = window.labTour;
      if (share === null) {
        tour.stage.invalidate();
        tour.stage.clock.step(0);
      } else {
        tour.stage.drawWithSurroundingsAt(share);
      }
      const element = canvas();
      const bounds = element.getBoundingClientRect();
      const scale = element.width / bounds.width;
      const width = Math.max(2, Math.round((area.right - area.left) * scale));
      const height = Math.max(2, Math.round((area.bottom - area.top) * scale));
      const x = Math.round((area.left - bounds.left) * scale);
      const y = element.height - Math.round((area.top - bounds.top) * scale) - height; // rows are counted from the bottom
      const gl = tour.stage.renderer.getContext();
      const data = new Uint8Array(width * height * 4);
      gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      const values = [];
      for (let row = 0; row < height; row += 2) {
        for (let column = 0; column < width; column += 2) {
          const at = (row * width + column) * 4;
          values.push(data[at], data[at + 1], data[at + 2]);
        }
      }
      return values;
    },
  };
}

// ── What a visitor can do ────────────────────────────────────────────────────
function visitor(page, { touch = false } = {}) {
  const see = () => page.evaluate(() => window.__t.see());
  const whereIs = (id) => page.evaluate((key) => window.labTour.whereIs(key), id);
  const item = (id) => page.evaluate((key) => window.labTour.items().find((entry) => entry.id === key), id);
  const pixels = (area, share = null) => page.evaluate((a, s) => window.__t.pixels(a, s), area, share);

  /** Let everything come to rest: the tour's own motion, then the interface's. */
  async function rest() {
    await pass(page);
    await frames(page, 2);
  }

  /** Click or tap a control where it is on screen. Fails if something covers it. */
  async function press(selector) {
    let spot = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      spot = await page.evaluate((sel) => window.__t.point(sel), selector);
      if (spot && !spot.inTheWay && spot.width > 0) break;
      await sleep(100); // labels fade in; panels slide
    }
    if (!spot) throw new Error(`nothing on the page matches ${selector}`);
    if (spot.inTheWay) throw new Error(`${selector} cannot be reached: ${spot.inTheWay} is in the way`);
    if (touch) await page.touchscreen.tap(spot.x, spot.y);
    else await page.mouse.click(spot.x, spot.y);
    return spot;
  }

  /** Tap a room or a machine in the 3D picture itself. */
  async function tapScene(id) {
    const spot = await page.evaluate((key) => window.__t.tapPoint(key), id);
    if (!spot) throw new Error(`found no free point on the picture to tap "${id}"`);
    if (touch) await page.touchscreen.tap(spot.x, spot.y);
    else await page.mouse.click(spot.x, spot.y);
    return spot;
  }

  /** Press at `from`, move by (dx, dy), let go. */
  async function drag(from, dx, dy) {
    const steps = Math.max(4, Math.ceil(Math.hypot(dx, dy) / 12));
    if (touch) {
      const finger = await page.touchscreen.touchStart(from.x, from.y);
      for (let i = 1; i <= steps; i++) await finger.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
      await finger.end();
    } else {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let i = 1; i <= steps; i++) await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
      await page.mouse.up();
    }
  }

  /** Two fingers, moving apart (spread > 0) or together (spread < 0) across `centre`. */
  async function pinch(centre, startGap, endGap) {
    const a = await page.touchscreen.touchStart(centre.x - startGap / 2, centre.y);
    const b = await page.touchscreen.touchStart(centre.x + startGap / 2, centre.y);
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const gap = startGap + ((endGap - startGap) * i) / steps;
      await a.move(centre.x - gap / 2, centre.y);
      await b.move(centre.x + gap / 2, centre.y);
    }
    await a.end();
    await b.end();
  }

  /** Follow a journey in steps of tour time; returns what was seen at each. */
  async function watch(seconds, every = 0.05) {
    const seen = [];
    for (let t = 0; t < seconds - 1e-9; t += every) {
      await pass(page, every);
      const now = await page.evaluate(() => {
        const tour = window.labTour;
        const spot = tour.stage.spotlightState;
        return { lag: tour.rig.lag, veil: spot.veil, lit: spot.key, busy: tour.busy };
      });
      seen.push({ t: round(t + every), ...now });
    }
    return seen;
  }

  return { see, whereIs, item, pixels, rest, press, tapScene, drag, pinch, watch, go: (hash) => go(page, hash).then(() => frames(page, 2)) };
}

/** How different two readings of the same patch are: mean difference per colour value, 0 – 255. */
function difference(a, b) {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}
const contrast = (values) => Math.max(...values) - Math.min(...values);

/** A patch of the picture in the top left corner of the free area, away from whatever is framed. */
function cornerPatch(free, size) {
  return { left: free.left + 8, top: free.top + 8, right: free.left + 8 + size.width, bottom: free.top + 8 + size.height };
}

async function open(browser, options) {
  const tour = await openTour(browser, base, { query: `q=${quality}`, ...options });
  if (/^failed/.test(tour.state)) throw new Error('the tour did not start');
  await tour.page.evaluate(install);
  await holdClock(tour.page);
  return tour;
}

function noProblems(problems) {
  check('nothing was reported in the browser console, and no file failed to load', problems.length === 0, problems.slice(0, 5).join(' | '));
}

// ── Checks shared by the desktop and the phone ───────────────────────────────

/** Arrived at a machine: it is the only thing lit, and it sits in the middle of the free area. */
async function checkMachineInView(v, id, { tolerance = 2 } = {}) {
  const s = await v.see();
  const where = await v.whereIs(id);
  const entry = await v.item(id);
  check('the address, the page title and the navigation bar agree', s.place === id && s.mode === 'item' && s.htmlMode === 'item' && s.hash === `#/${id}` && same(s.dock, [roomOf(id)]), `${s.place} ${s.hash} ${s.dock}`);
  check('the machine is in the spotlight and the lab around it is faded', s.lit === id && near(s.veil, FADED, 0.001), `lit ${s.lit}, lab faded by ${round(s.veil)}`);
  check('no markers or room names in front of it', s.hotspots === 0 && s.roomNames === 0, `${s.hotspots} markers, ${s.roomNames} names`);
  check('it fits in the area that the panel and the bar leave free', inside(where, s.free, tolerance), `machine ${box(where)}, free ${box(s.free)}`);
  check('it sits in the middle of that area', centred(where, s.free, tolerance), `machine middle ${round(middle(where).x, 1)},${round(middle(where).y, 1)}; free middle ${round(middle(s.free).x, 1)},${round(middle(s.free).y, 1)}`);
  check(`and is as large as the margin allows (${Math.round(FILL * 100)}% of it)`, near(fill(where, s.free), FILL, 0.01), `${round(fill(where, s.free) * 100, 1)}%`);
  if (entry.status === 'built') check('its detailed model is the one on show', entry.tier === 'hero' && entry.modelState === 'ready', `${entry.tier}, ${entry.modelState}`);
  return { s, where };
}

/** Drag across a spotlit machine: it turns about its own middle and the lab behind it does not move. */
async function checkTurning(v, id, { dx, patchSize }) {
  const before = await v.see();
  const whereBefore = await v.whereIs(id);
  const patch = cornerPatch(before.free, patchSize);
  const centre = { left: whereBefore.x - 14, top: whereBefore.y - 14, right: whereBefore.x + 14, bottom: whereBefore.y + 14 };
  const labBefore = await v.pixels(patch, 0.9);
  const machineBefore = await v.pixels(centre);

  await v.drag({ x: whereBefore.x, y: whereBefore.y }, dx, 0);
  await v.rest();

  const after = await v.see();
  const whereAfter = await v.whereIs(id);
  const labAfter = await v.pixels(patch, 0.9);
  const machineAfter = await v.pixels(centre);
  const turned = turnBetween(before.azimuth, after.azimuth);

  check('the machine turned', turned > 20, `${round(turned, 1)}°`);
  check('about its own middle: the point the camera looks at did not move', moved(after.target, before.target) < 1e-6);
  check('its middle stayed at the same place on screen', near(whereAfter.x, whereBefore.x, 0.5) && near(whereAfter.y, whereBefore.y, 0.5), `moved ${round(whereAfter.x - whereBefore.x)}, ${round(whereAfter.y - whereBefore.y)} px`);
  check('and at the same distance', near(after.distance / before.distance, 1, 0.001));
  check('the test patch is clear of the machine', !overlaps(patch, whereBefore, 12) && !overlaps(patch, whereAfter, 12), `patch ${box(patch)}, machine ${box(whereBefore)} / ${box(whereAfter)}`);
  check('the test patch shows part of the lab (it is not blank)', contrast(labBefore) >= 8, `contrast ${contrast(labBefore)}`);
  check('the lab behind it did not move: that patch is the same, pixel for pixel', difference(labBefore, labAfter) < 0.02, `mean difference ${round(difference(labBefore, labAfter), 3)}`);
  check('the lab camera held its direction', after.roomHolds && near(after.lag, turned, 1), `${round(after.lag, 1)}° behind after a ${round(turned, 1)}° turn`);
  check('the machine itself looks different from its new side', difference(machineBefore, machineAfter) > 1, `mean difference ${round(difference(machineBefore, machineAfter), 2)}`);
  check('the lab is still faded and the same machine is lit', near(after.veil, FADED, 0.001) && after.lit === id && after.place === id);
  check('the "drag to turn" hint has gone', !after.hint);
  return { before, after, patch };
}

/** A journey away from a turned machine: the faded lab swings round to match before it is brought back. */
function checkCatchUp(seen, label) {
  const mismatched = seen.filter((moment) => moment.lag > 1);
  check(`${label}: the lab started out turned differently from the machine`, mismatched.length > 0, `${seen.length} moments, none mismatched`);
  const shown = mismatched.filter((moment) => moment.veil < FADED - 0.001);
  check(`${label}: the lab stays fully faded until it matches the machine again`, shown.length === 0, shown.map((moment) => `t=${moment.t}s ${round(moment.lag, 1)}° at ${round(moment.veil)}`).join(', '));
  const matchedAt = seen.find((moment) => moment.lag <= 1);
  check(`${label}: it matches again within the first third of the journey`, Boolean(matchedAt) && matchedAt.t <= seen[seen.length - 1].t * 0.4, matchedAt ? `at ${matchedAt.t} s of ${seen[seen.length - 1].t} s` : 'never');
}

/**
 * What a phone has to get right wherever the visitor is. Nothing is wider than
 * the screen, and what scrolls up and down does not scroll sideways as well.
 * No text is set under 12 px, and running text not under 16 (tour.css,
 * section 9: the phone's scale); `reads: false` for a place that holds figures
 * and labels only, `bar: false` on a screen 320 px wide, where the names on
 * the bar are the one thing that is set smaller.
 */
async function checkOnPhone(page, where, { reads = true, bar = true } = {}) {
  await atRest(page); // what is still fading in does not count as on show
  const wide = await page.evaluate(() => {
    const sideways = (element) => (element ? element.scrollWidth - element.clientWidth : 0);
    return { page: document.documentElement.scrollWidth, screen: document.documentElement.clientWidth, sheet: sideways(document.getElementById('panel')), guide: sideways(document.querySelector('dialog.guide[open]')) };
  });
  check(`${where}: nothing is wider than the screen, and neither the sheet nor the guide scrolls sideways`, wide.page <= wide.screen && wide.sheet <= 1 && wide.guide <= 1, `page ${wide.page} px on a screen of ${wide.screen}; sideways: sheet ${wide.sheet} px, guide ${wide.guide} px`);
  const pieces = (await page.evaluate(() => window.__t.type())).filter((piece) => bar || !/dock__label/.test(piece.what));
  const small = pieces.filter((piece) => piece.px < 12);
  check(`${where}: no text is set smaller than 12 px${bar ? '' : ' (but for the names on the bar, which give way on a screen this narrow)'}`, pieces.length > 0 && small.length === 0, pieces.length ? small.slice(0, 4).map((piece) => `${piece.px} px ${piece.what} "${piece.text}"`).join(', ') : 'found no text at all');
  if (!reads) return;
  const read = pieces.filter((piece) => piece.read);
  const off = read.filter((piece) => piece.px < 16);
  check(`${where}: what is read is set in 16 px or larger`, read.length > 0 && off.length === 0, read.length ? off.slice(0, 4).map((piece) => `${piece.px} px ${piece.what} "${piece.text}"`).join(', ') : 'found no running text');
}

/**
 * Wait until the interface has come to rest: the sheet and its strip of pills
 * have stopped scrolling, and whatever was sliding or fading in has arrived.
 * All of that runs on the browser's clock, which `pass` does not move.
 */
async function atRest(page) {
  let last = '';
  for (let still = 0, tries = 0; still < 3 && tries < 80; tries++) {
    await sleep(50);
    const now = await page.evaluate(() => {
      const panel = document.getElementById('panel');
      const arriving = document.getAnimations().filter((animation) => animation.playState === 'running' && Number.isFinite(animation.effect?.getComputedTiming().endTime)).length;
      return arriving ? `arriving ${performance.now()}` : `${panel.scrollTop} ${panel.querySelector('.tabs')?.scrollLeft ?? 0} ${document.querySelector('dialog.guide')?.scrollTop ?? 0}`;
    });
    still = now === last ? still + 1 : 0;
    last = now;
  }
}

/** The names on the navigation bar: none runs out of its stop, and neighbours stay a space apart. Returns the stops. */
async function checkBar(page, where) {
  const stops = await page.evaluate(() => window.__t.bar());
  const gaps = stops.slice(1).map((stop, index) => stop.label.left - stops[index].label.right);
  const names = stops.map((stop, index) => `${stop.text}${index < gaps.length ? ` (${round(gaps[index], 1)})` : ''}`).join(' ');
  check(`${where}: the names on the bar stay clear of each other`, stops.length > 1 && Math.min(...gaps) >= 3, `the gaps in px: ${names}`);
  check(`${where}: and each fits its stop`, stops.every((stop) => stop.label.left >= stop.stop.left - 0.5 && stop.label.right <= stop.stop.right + 0.5), stops.map((stop) => `${stop.text} ${round(stop.label.width, 1)} in ${round(stop.stop.width, 1)}`).join(', '));
  return stops;
}

/**
 * Runs in the page before the tour does: keeps what the note beside the name
 * ("Loading 3D models 3/14") said while it was on show, and how wide the page
 * was at that moment. `innerText` is the text as drawn, without what the
 * stylesheet leaves out. The screen's width is `clientWidth` here and wherever
 * a page is held against it: on a phone `innerWidth` grows along with whatever
 * is too wide (the browser makes room to zoom out), and would never tell.
 */
function watchLoadingNote() {
  window.__loadingNotes = [];
  new MutationObserver((_, finder) => {
    const note = document.getElementById('loading');
    if (!note) return;
    finder.disconnect();
    const keep = () => {
      if (!note.hidden && note.textContent) window.__loadingNotes.push({ text: note.innerText.replace(/\s+/g, ' ').trim(), px: parseFloat(getComputedStyle(note).fontSize), page: document.documentElement.scrollWidth, screen: document.documentElement.clientWidth });
    };
    new MutationObserver(keep).observe(note, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }).observe(document, { childList: true, subtree: true });
}

// ── Desktop ──────────────────────────────────────────────────────────────────
async function desktop(browser) {
  current = 'desktop';
  console.log('\nDesktop — 1280 × 800, mouse');
  const { page, problems, state } = await open(browser, { width: 1280, height: 800, storage: WELCOMED });
  const v = visitor(page);
  const facts = await page.evaluate(() => ({ route: window.labTour.route, items: window.labTour.items() }));
  const { route } = facts;
  const inRoom = (roomId) => facts.items.filter((entry) => roomOf(entry.id) === roomId);
  const room = roomOf(MACHINE);

  await step('The lab opens', async () => {
    const s = await v.see();
    check('every model loaded', state === 'ready', state);
    check('it starts at the whole lab', s.place === 'lab' && s.mode === 'overview' && s.htmlMode === 'overview' && s.hash === '#/', `${s.place} ${s.hash}`);
    const dock = await page.evaluate(() => [...document.querySelectorAll('.dock__item')].map((button) => button.dataset.id));
    check('the navigation bar lists the lab, then the rooms in tour order', same(dock, ['lab', ...route]), dock.join(' '));
    check('"Lab" is marked as the current stop', same(s.dock, ['lab']), s.dock.join(' '));
    check('a name floats over each room, and no machine markers yet', s.roomNames === route.length && s.hotspots === 0, `${s.roomNames} names, ${s.hotspots} markers`);
    check('no welcome guide for a returning visitor', !s.guide);
    // The drawing budget (README, `npm run check`) is for a frame of the whole
    // lab as it is drawn while a visitor looks around. The frame the tour
    // opens with is dearer: it also redraws the shadow map, which draws every
    // part that casts a shadow a second time. That one is reported, not
    // limited (560 draw calls with thirteen machines; it was 493 with eleven
    // and 400 with nine).
    const cost = await page.evaluate(() => {
      const { stage } = window.labTour;
      const read = () => {
        const info = window.labTour.renderInfo();
        return { calls: info.calls, triangles: info.triangles };
      };
      const opened = read();
      stage.invalidate();
      stage.clock.step(0);
      return { opened, looking: read() };
    });
    check('a frame of the whole lab costs no more than the drawing budget', cost.looking.calls > 0 && cost.looking.calls <= 400 && cost.looking.triangles <= 450000, `${cost.looking.calls} draw calls, ${cost.looking.triangles} triangles`);
    console.log(`      (the whole lab: ${cost.looking.calls} draw calls and ${cost.looking.triangles} triangles a frame; ${cost.opened.calls} and ${cost.opened.triangles} on a frame that redraws the shadows)`);
    for (const id of route) {
      const where = await v.whereIs(id);
      check(`room "${id}" is in view, clear of the panel and the bar`, inside(where, s.free, 2), `room ${box(where)}, free ${box(s.free)}`);
    }
    const names = await page.$$eval('.room-pill', (pills) => pills.map((pill) => ({ name: pill.querySelector('strong').textContent, right: pill.getBoundingClientRect().right })));
    const under = names.filter((name) => name.right > s.panelRect.left);
    check('no room name is under the panel', under.length === 0, under.map((name) => `"${name.name}" ends at ${Math.round(name.right)}, the panel starts at ${Math.round(s.panelRect.left)}`).join('; '));
  });

  await step('Start the tour and walk the route with "Next"', async () => {
    await v.press('#panel [data-start]');
    await v.rest();
    for (let index = 0; index < route.length; index++) {
      const s = await v.see();
      const where = await v.whereIs(route[index]);
      check(`stop ${index + 1} is "${route[index]}"`, s.place === route[index] && s.hash === `#/${route[index]}` && same(s.dock, [route[index]]), `${s.place} ${s.hash} ${s.dock}`);
      check(`its panel says "Stop ${index + 1} of ${route.length}"`, s.panelMode === 'room' && s.eyebrow.startsWith(`Stop ${index + 1} of ${route.length}`), s.eyebrow);
      check('one marker per machine in the room, and the room in view', s.hotspots === inRoom(route[index]).length && inside(where, s.free, 2), `${s.hotspots} markers for ${inRoom(route[index]).length} machines; room ${box(where)}, free ${box(s.free)}`);
      if (index < route.length - 1) {
        await v.press('#panel .route-nav .button--primary');
        await v.rest();
      }
    }
    await v.press('#panel .route-nav [data-go-lab]');
    await v.rest();
    check('"Finish the tour" at the last stop returns to the whole lab', (await v.see()).place === 'lab');
    await v.go(`#/${route[2]}`);
    await v.press('#panel .route-nav .button--quiet');
    await v.rest();
    check('the "previous" button goes one stop back', (await v.see()).place === route[1]);
  });

  await step('Tap a room on the floor, then a machine in it', async () => {
    await v.go('#/');
    await v.tapScene(room);
    await v.rest();
    check(`tapping the ${room} room opens it`, (await v.see()).place === room, (await v.see()).place);
    const spot = await page.evaluate((key) => window.__t.tapPoint(key), MACHINE);
    if (!check('the machine can be tapped in the picture', Boolean(spot))) return;
    await page.mouse.move(spot.x, spot.y);
    await frames(page, 3);
    const hover = await page.evaluate(() => ({ cursor: window.labTour.stage.renderer.domElement.style.cursor, marked: [...document.querySelectorAll('.hotspot.is-hover')].length }));
    check('pointing at it shows a hand cursor and lights its marker', hover.cursor === 'pointer' && hover.marked === 1, `cursor "${hover.cursor}", ${hover.marked} markers lit`);
    await page.mouse.click(spot.x, spot.y);
    const immediately = await v.see();
    check('the panel changes at once, while the camera is still on its way', immediately.place === MACHINE && immediately.panelMode === 'item' && immediately.busy, `${immediately.place}, busy ${immediately.busy}`);
    await v.rest();
  });

  await step('The machine comes forward', async () => {
    const { s } = await checkMachineInView(v, MACHINE);
    check('the hint says how to turn and zoom with a mouse', s.hint && /drag to turn/i.test(s.hintText) && /scroll to zoom/i.test(s.hintText), `shown ${s.hint}: "${s.hintText}" (${s.hintLog})`);
    check('keyboard focus has moved to the panel', s.focus.startsWith('aside#panel'), s.focus);
    check('the panel names the machine and offers its four pills', s.heading.length > 0 && same(s.tabs, ['overview', 'about', 'features', 'capabilities']), `"${s.heading}" ${s.tabs}`);
    check('the lab camera holds its direction from here on', s.roomHolds && s.lag < 0.01, `holds ${s.roomHolds}, ${round(s.lag, 2)}° apart`);
    console.log(`      (machine view: ${s.calls} draw calls)`);
  });

  await step('Dragging turns the machine, and only the machine', async () => {
    await checkTurning(v, MACHINE, { dx: -220, patchSize: { width: 150, height: 100 } });
    const where = await v.whereIs(MACHINE);
    const from = { x: where.x, y: where.y };
    await v.drag(from, 0, 260);
    await v.drag(from, 0, 260);
    await v.rest();
    const above = await v.see();
    check('it can be looked at from above, up to 85° and no further', above.elevation > 60 && above.elevation <= 85.01, `${round(above.elevation, 1)}°`);
    await v.drag(from, 0, -260);
    await v.drag(from, 0, -260);
    await v.drag(from, 0, -260);
    await v.rest();
    const level = await v.see();
    check('and from the side, down to 2° and no further', level.elevation < 10 && level.elevation >= 1.99, `${round(level.elevation, 1)}°`);
    check('still about its own middle', moved(level.target, above.target) < 1e-6);
  });

  await step('A plain tap in machine view changes nothing', async () => {
    const before = await v.see();
    const where = await v.whereIs(MACHINE);
    await page.mouse.click(where.x, where.y);
    await page.mouse.click(before.free.left + 30, before.free.top + 30);
    await v.rest();
    const after = await v.see();
    check('still the same machine, seen from the same side', after.place === MACHINE && near(after.azimuth, before.azimuth, 0.01) && near(after.distance, before.distance, 1e-6));
  });

  await step('Zoom', async () => {
    const start = await v.see();
    const where = await v.whereIs(MACHINE);
    await page.mouse.move(where.x, where.y);
    await page.mouse.wheel({ deltaY: -240 });
    await v.rest();
    const closer = await v.see();
    check('scrolling comes closer', closer.distance < start.distance * 0.97, `${round(start.distance)} → ${round(closer.distance)}`);
    check('toward the machine, not past it', moved(closer.target, start.target) < 1e-6);
    check('the lab behind zooms with it, so the machine keeps its size against the room', near(closer.roomDistance / closer.distance, 1, 1e-6), `${round(closer.roomDistance)} vs ${round(closer.distance)}`);
    for (let i = 0; i < 12; i++) await page.mouse.wheel({ deltaY: -400 });
    await v.rest();
    const nearest = await v.see();
    check('zooming in stops at the limit', near(nearest.distance / nearest.minDistance, 1, 0.01), `${round(nearest.distance)}, limit ${round(nearest.minDistance)}`);
    for (let i = 0; i < 24; i++) await page.mouse.wheel({ deltaY: 400 });
    await v.rest();
    const farthest = await v.see();
    check('zooming out stops at the limit', near(farthest.distance / farthest.maxDistance, 1, 0.01), `${round(farthest.distance)}, limit ${round(farthest.maxDistance)}`);
    check('the range is the one set for machines (0.5× to 1.9×)', near(farthest.maxDistance / nearest.minDistance, 1.9 / 0.5, 0.02), `${round(farthest.maxDistance / nearest.minDistance)}`);
    await v.press('#zoom-in');
    await v.rest();
    const stepped = await v.see();
    check('the + button comes closer by a fifth', near(stepped.distance / farthest.distance, 0.8, 0.01), `${round(stepped.distance / farthest.distance, 3)}`);
    await v.press('#zoom-out');
    await v.rest();
    check('the − button goes back', near((await v.see()).distance / farthest.distance, 1, 0.01));
  });

  await step('Take it apart', async () => {
    // Start from a fresh arrival, then turn it: the machine must come apart on the side the visitor chose.
    await v.go(`#/${room}`);
    await v.go(`#/${MACHINE}`);
    const arrived = await v.whereIs(MACHINE);
    await v.drag({ x: arrived.x, y: arrived.y }, 160, -30);
    await v.rest();
    const before = await v.see();
    const slider = '#panel [data-explode]';
    check('the panel has a "Take it apart" slider at 0', (await page.$eval(slider, (input) => input.value)) === '0');

    await page.focus(slider);
    await page.keyboard.press('End');
    await v.rest();
    const apart = await v.see();
    const where = await v.whereIs(MACHINE);
    const entry = await v.item(MACHINE);
    check('the slider and its label say 100%', (await page.$eval(slider, (input) => input.value)) === '100' && (await page.$eval('#panel [data-explode-value]', (output) => output.textContent)) === '100%');
    check('the machine is fully apart', entry.apart === 1, `${entry.apart}`);
    check('the camera stepped back', apart.distance > before.distance * 1.05, `${round(before.distance)} → ${round(apart.distance)}`);
    check('just far enough: every part is in view, as large as the margin allows', inside(where, apart.free, 2) && near(fill(where, apart.free), FILL, 0.01), `parts ${box(where)}, free ${box(apart.free)}, ${round(fill(where, apart.free) * 100, 1)}%`);
    check('seen from the side the visitor had turned to', near(apart.azimuth, before.azimuth, 0.05) && near(apart.elevation, before.elevation, 0.05), `${round(before.azimuth, 1)}° → ${round(apart.azimuth, 1)}°`);
    check('the lab behind did not swing round', apart.roomHolds && near(apart.lag, before.lag, 0.05), `${round(before.lag, 1)}° → ${round(apart.lag, 1)}°`);

    // A hand on the slider sends many small changes, each while the camera is still adjusting to the last.
    await page.keyboard.press('Home');
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    await pass(page, 0.05);
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    await v.rest();
    const nudged = await v.see();
    check('moving the slider in many small steps leaves the lab where it was', nudged.roomHolds && near(nudged.lag, before.lag, 0.05) && near(nudged.azimuth, before.azimuth, 0.05), `${round(nudged.lag, 1)}° (was ${round(before.lag, 1)}°)`);

    await page.keyboard.press('Home');
    await v.rest();
    const together = await v.see();
    const whole = await v.whereIs(MACHINE);
    check('back at 0 the camera comes close again, to fit the whole machine', (await v.item(MACHINE)).apart === 0 && together.distance < apart.distance * 0.95 && near(fill(whole, together.free), FILL, 0.01), `${round(apart.distance)} → ${round(together.distance)}, ${round(fill(whole, together.free) * 100, 1)}%`);

    await page.keyboard.press('End');
    await v.rest();
    await v.press('#panel [data-go-back]');
    await v.rest();
    const left = await v.item(MACHINE);
    check('leaving puts the machine back together', left.apart === 0 && left.tier === 'lite', `apart ${left.apart}, ${left.tier}`);
    await v.go(`#/${MACHINE}`);
    check('and coming back finds the slider at 0', (await page.$eval(slider, (input) => input.value)) === '0');
  });

  await step('The four pills', async () => {
    const before = await v.see();
    await v.press('#panel [data-tab="features"]');
    await frames(page, 2);
    const features = await page.evaluate(() => ({
      tab: window.labTour.panel.tab,
      open: [...document.querySelectorAll('#panel [data-panel]')].filter((section) => !section.hidden).map((section) => section.dataset.panel),
      cards: document.querySelectorAll('#panel [data-panel="features"] .spec').length,
      lead: document.querySelectorAll('#panel [data-panel="features"] .spec--lead').length,
      emptyCards: [...document.querySelectorAll('#panel [data-panel="features"] .spec')].filter((card) => !card.querySelector('dt').textContent.trim() || !card.querySelector('dd').textContent.trim()).length,
      links: [...document.querySelectorAll('#panel [data-panel="features"] .sources a')].map((link) => ({ href: link.href, target: link.target, rel: link.rel })),
      selected: [...document.querySelectorAll('#panel [role="tab"]')].filter((tab) => tab.getAttribute('aria-selected') === 'true').map((tab) => tab.dataset.tab),
      reachable: [...document.querySelectorAll('#panel [role="tab"]')].filter((tab) => tab.tabIndex === 0).map((tab) => tab.dataset.tab),
    }));
    check('"Features" opens, and only it', features.tab === 'features' && same(features.open, ['features']) && same(features.selected, ['features']), `${features.open}`);
    check('it shows figure cards, the first one large, none empty', features.cards >= 3 && features.lead === 1 && features.emptyCards === 0, `${features.cards} cards, ${features.lead} large, ${features.emptyCards} empty`);
    check('its figures name their sources, as links that open in a new tab', features.links.length > 0 && features.links.every((link) => /^https?:\/\//.test(link.href) && link.target === '_blank' && /noopener/.test(link.rel)), JSON.stringify(features.links));
    check('only the open pill is a Tab stop', same(features.reachable, ['features']), `${features.reachable}`);

    const key = async (name) => {
      await page.keyboard.press(name);
      return page.evaluate(() => ({ tab: window.labTour.panel.tab, focus: document.activeElement?.dataset?.tab ?? null }));
    };
    const right = await key('ArrowRight');
    check('→ moves to the next pill and takes the focus along', right.tab === 'capabilities' && right.focus === 'capabilities', JSON.stringify(right));
    const wrapped = await key('ArrowRight');
    check('→ on the last pill wraps round to the first', wrapped.tab === 'overview' && wrapped.focus === 'overview', JSON.stringify(wrapped));
    const back = await key('ArrowLeft');
    check('← on the first wraps to the last', back.tab === 'capabilities', JSON.stringify(back));
    const home = await key('Home');
    const end = await key('End');
    check('Home and End jump to the first and the last', home.tab === 'overview' && end.tab === 'capabilities', `${home.tab} ${end.tab}`);
    const points = await page.$$eval('#panel [data-panel="capabilities"] .points li', (list) => list.map((point) => point.textContent.trim().length));
    check('"Capabilities" lists what the machine can do', points.length >= 2 && points.every((length) => length > 10), `${points.length} points`);

    await v.press('#panel [data-tab="about"]');
    const maker = await page.evaluate(() => ({ name: document.querySelector('#panel [data-panel="about"] .brand-card__name')?.textContent.trim() ?? '', text: document.querySelector('#panel [data-panel="about"] .body')?.textContent.trim() ?? '', links: document.querySelectorAll('#panel [data-panel="about"] .sources a').length }));
    check('"About" names the maker, says something about it and gives a source', maker.name.length > 1 && maker.text.length > 40 && maker.links > 0, JSON.stringify(maker).slice(0, 120));

    await v.rest();
    const after = await v.see();
    check('changing pills does not move the camera', near(after.azimuth, before.azimuth, 1e-6) && near(after.distance, before.distance, 1e-6) && after.place === before.place);
  });

  await step('On to the next machine in the room', async () => {
    const where = await v.whereIs(MACHINE);
    await v.drag({ x: where.x, y: where.y }, -200, 0);
    await v.rest();
    await v.press('#panel .stepper button:last-of-type');
    const seen = await v.watch(0.95);
    checkCatchUp(seen, 'on the way');
    const swaps = seen.filter((moment, index) => index > 0 && moment.lit !== seen[index - 1].lit);
    const lowest = Math.min(...seen.map((moment) => moment.veil));
    check('the spotlight changes machine once, when the lab is closest to its normal look', swaps.length === 1 && near(swaps[0].veil, lowest, 0.08), `${swaps.length} changes; at ${swaps[0] ? round(swaps[0].veil) : '—'}, lowest ${round(lowest)}`);
    check('on the way the lab comes most of the way back, so the move makes sense', near(lowest, PASSING, 0.05), `faded by ${round(lowest)} at its clearest`);
    await v.rest();
    const { s } = await checkMachineInView(v, NEIGHBOUR);
    const previous = await v.item(MACHINE);
    check('the machine left behind is back in its place, whole', previous.tier === 'lite' && previous.apart === 0, `${previous.tier}, apart ${previous.apart}`);
    check('the panel starts again at the first pill', s.tab === 'overview' && (await page.$eval('#panel [role="tab"][aria-selected="true"]', (tab) => tab.dataset.tab)) === 'overview', s.tab);
    check('the lab camera holds again, from the new direction', s.roomHolds && s.lag < 0.01, `${round(s.lag, 2)}°`);
    const position = await page.$eval('#panel .stepper span', (label) => label.textContent.trim());
    check('the stepper counts the machines of the room', position === `2 / ${inRoom(room).length}`, position);
  });

  await step('Leaving a machine', async () => {
    const where = await v.whereIs(NEIGHBOUR);
    await v.drag({ x: where.x, y: where.y }, 240, 0);
    await v.rest();
    check('(the machine was turned first)', (await v.see()).lag > 20, `${round((await v.see()).lag, 1)}°`);
    await v.press('#panel [data-go-back]');
    const seen = await v.watch(1.05);
    checkCatchUp(seen, 'on the way out');
    await v.rest();
    const s = await v.see();
    const entry = await v.item(NEIGHBOUR);
    const whereRoom = await v.whereIs(room);
    check('back in the room', s.place === room && s.mode === 'room' && s.hash === `#/${room}`, `${s.place} ${s.hash}`);
    check('the spotlight is off and the lab is back at full strength', s.lit === null && s.veil === 0 && !s.roomHolds, `lit ${s.lit}, faded by ${s.veil}`);
    check('the machine is an ordinary part of the room again', entry.tier === 'lite' && entry.apart === 0);
    check('the markers are back and the room is in view', s.hotspots === inRoom(room).length && inside(whereRoom, s.free, 2), `${s.hotspots} markers`);

    // The other half of "only the machine turns": in a room, a drag does move the lab.
    const patch = cornerPatch(s.free, { width: 150, height: 100 });
    const labBefore = await v.pixels(patch);
    await v.drag({ x: middle(s.free).x, y: middle(s.free).y }, -160, 0);
    await v.rest();
    const turned = await v.see();
    const labAfter = await v.pixels(patch);
    check('in a room, dragging turns the whole room', turnBetween(s.azimuth, turned.azimuth) > 10 && difference(labBefore, labAfter) > 1, `${round(turnBetween(s.azimuth, turned.azimuth), 1)}°, patch differs by ${round(difference(labBefore, labAfter), 2)}`);
    check('with one camera for everything', turned.lag === 0 && !turned.roomHolds);
    for (let i = 0; i < 4; i++) await v.drag({ x: middle(s.free).x, y: middle(s.free).y }, -260, 0);
    await v.rest();
    const far = await v.see();
    check('a room cannot be turned past its open side (55° either way)', turnBetween(s.azimuth, far.azimuth) <= 55.5, `${round(turnBetween(s.azimuth, far.azimuth), 1)}°`);
  });

  await step('Escape, Back and Forward', async () => {
    await v.go(`#/${MACHINE}`);
    await page.keyboard.press('Escape');
    await v.rest();
    check('Escape steps back from the machine to its room', (await v.see()).place === room);
    await page.keyboard.press('Escape');
    await v.rest();
    check('and from the room to the whole lab', (await v.see()).place === 'lab');
    await page.keyboard.press('Escape');
    await v.rest();
    check('and then does nothing more', (await v.see()).place === 'lab');

    await v.press(`.dock__item[data-id="${room}"]`);
    await v.rest();
    await v.press(`#panel [data-go-item="${MACHINE}"]`);
    await v.rest();
    const travel = async (direction) => {
      const from = await page.evaluate(() => location.hash);
      await page.evaluate((way) => history[way](), direction);
      await page.waitForFunction((was) => location.hash !== was, { timeout: 5000 }, from);
      await v.rest();
      const s = await v.see();
      return `${s.place} ${s.hash} ${s.lit ?? 'none'}`;
    };
    check("the browser's Back goes from the machine to the room", (await travel('back')) === `${room} #/${room} none`);
    check('and on to the whole lab', (await travel('back')) === 'lab #/ none');
    check('Forward returns to the room', (await travel('forward')) === `${room} #/${room} none`);
    check('and to the machine, lit again', (await travel('forward')) === `${MACHINE} #/${MACHINE} ${MACHINE}`);

    await v.go('#/no-such-room');
    const lost = await v.see();
    check('an address that names no room shows the whole lab, and is corrected', lost.place === 'lab' && lost.hash === '#/', `${lost.place} ${lost.hash}`);
    await v.go(`#/${room}/no-such-machine`);
    const half = await v.see();
    check('an address that names no machine shows the room, and is corrected', half.place === room && half.hash === `#/${room}`, `${half.place} ${half.hash}`);
  });

  await step('The navigation bar', async () => {
    await v.go(`#/${MACHINE}`);
    const other = route.find((id) => id !== room);
    await v.press(`.dock__item[data-id="${other}"]`);
    await v.rest();
    const jumped = await v.see();
    check('from a machine, a stop on the bar goes straight to that room', jumped.place === other && jumped.lit === null && jumped.veil === 0, `${jumped.place}, lit ${jumped.lit}`);
    for (const id of ['lab', ...route]) {
      await v.press(`.dock__item[data-id="${id}"]`);
      await v.rest();
      const s = await v.see();
      const highlight = await page.evaluate((key) => {
        const dock = document.getElementById('dock');
        const button = dock.querySelector(`.dock__item[data-id="${key}"]`);
        return { x: parseFloat(dock.style.getPropertyValue('--x')), w: parseFloat(dock.style.getPropertyValue('--w')), left: button.offsetLeft, width: button.offsetWidth };
      }, id);
      check(`"${id}" on the bar goes there, and the highlight follows`, s.place === id && same(s.dock, [id]) && near(highlight.x, highlight.left, 0.5) && near(highlight.w, highlight.width, 0.5), `${s.place}; highlight at ${highlight.x} (${highlight.w} wide), button at ${highlight.left} (${highlight.width})`);
    }
    await v.go(`#/${MACHINE}`);
    await v.press(`.dock__item[data-id="${room}"]`);
    await v.rest();
    check("from a machine, its own room's stop steps back to the room", (await v.see()).place === room);
    await v.press('#brand');
    await v.rest();
    check('the name in the header returns to the whole lab', (await v.see()).place === 'lab');
  });

  await step('A machine that is not modelled yet', async () => {
    await v.go(`#/${roomOf(PLANNED)}`);
    await v.press(`#panel [data-go-item="${PLANNED}"]`);
    await v.rest();
    await checkMachineInView(v, PLANNED);
    const panel = await page.evaluate(() => ({
      note: document.querySelector('#panel .note')?.textContent ?? '',
      lead: document.querySelector('#panel .lead')?.textContent.trim() ?? '',
      slider: Boolean(document.querySelector('#panel [data-explode]')),
      figures: document.querySelectorAll('#panel .spec').length,
      maker: Boolean(document.querySelector('#panel .brand-card')),
    }));
    check('the panel says what kind of machine it is', panel.lead.length > 30, `"${panel.lead.slice(0, 60)}"`);
    check('and says plainly that it is not modelled yet', /not modelled yet/i.test(panel.note), panel.note.slice(0, 60));
    check('it invents no maker and no figures, and offers nothing to take apart', !panel.maker && panel.figures === 0 && !panel.slider, JSON.stringify(panel).slice(0, 100));
    const where = await v.whereIs(PLANNED);
    const before = await v.see();
    await v.drag({ x: where.x, y: where.y }, -180, 0);
    await v.rest();
    const after = await v.see();
    check('its stand-in turns about its own middle like any machine', turnBetween(before.azimuth, after.azimuth) > 20 && moved(after.target, before.target) < 1e-6 && after.roomHolds);
    await page.keyboard.press('Escape');
    await v.rest();
    const left = await v.see();
    check('leaving it clears the spotlight', left.place === roomOf(PLANNED) && left.lit === null && left.veil === 0);
  });

  // One of the lab's real machines whose 3D model has not been imported yet
  // (catalogue.js `known: true`). There may be none; then there is nothing to check.
  const known = facts.items.find((entry) => entry.known);
  if (known) {
    await step('A known machine whose 3D model is still to come', async () => {
      await v.go(`#/${roomOf(known.id)}`);
      const chip = await page.$eval(`#panel [data-go-item="${known.id}"] .chip`, (element) => element.textContent.trim()).catch(() => '');
      check('the room list says its model is coming, not that the machine is planned', chip === 'Model coming', `"${chip}"`);
      await v.press(`#panel [data-go-item="${known.id}"]`);
      await v.rest();
      await checkMachineInView(v, known.id);
      const overview = await page.evaluate(() => ({
        note: document.querySelector('#panel .note')?.textContent ?? '',
        lead: document.querySelector('#panel .lead')?.textContent.trim() ?? '',
        slider: Boolean(document.querySelector('#panel [data-explode]')),
        sizeLabel: [...document.querySelectorAll('#panel .facts dt')].map((term) => term.textContent.trim()),
        tabs: [...document.querySelectorAll('#panel [role="tab"]')].map((tab) => tab.dataset.tab),
      }));
      check('the panel says what it is, and that only its 3D model is missing', overview.lead.length > 30 && /3D model is not in the tour yet/i.test(overview.note) && !/not modelled yet/i.test(overview.note), overview.note.slice(0, 70));
      check('its size is given as its size, not as a rough one', overview.sizeLabel.includes('Size') && !overview.sizeLabel.includes('Rough size'), overview.sizeLabel.join(', '));
      check('there is nothing to take apart yet', !overview.slider);
      check('it has its maker and its figures all the same', overview.tabs.includes('about') && overview.tabs.includes('features'), overview.tabs.join(' '));
      await v.press('#panel [data-tab="features"]');
      await frames(page, 2);
      const features = await page.evaluate(() => ({
        cards: document.querySelectorAll('#panel [data-panel="features"] .spec').length,
        links: [...document.querySelectorAll('#panel [data-panel="features"] .sources a')].map((link) => link.href),
      }));
      check('the figures are there, with a link to where they come from', features.cards >= 3 && features.links.length > 0 && features.links.every((href) => /^https?:\/\//.test(href)), `${features.cards} cards, ${features.links.length} links`);
      await v.press('#panel [data-tab="about"]');
      await frames(page, 2);
      const maker = await page.$eval('#panel [data-panel="about"] .brand-card__name', (element) => element.textContent.trim()).catch(() => '');
      check('"About" names the maker', maker.length > 1, `"${maker}"`);
      await page.keyboard.press('Escape');
      await v.rest();
      const left = await v.see();
      check('leaving it clears the spotlight', left.place === roomOf(known.id) && left.lit === null && left.veil === 0);
    });
  }

  // A machine whose model was imported after the rest must behave like every
  // other modelled machine: listed without a "Planned" beside it, a panel with
  // its maker and figures, a slider that takes it apart, and all of it in view.
  const likeTheOthers = async (id, apartMeans) => {
    await v.go(`#/${roomOf(id)}`);
    const chip = await page.$eval(`#panel [data-go-item="${id}"]`, (element) => element.querySelector('.chip')?.textContent.trim() ?? '');
    check('the room list has it as a machine, with no "Planned" or "Model coming" beside it', chip === '', `"${chip}"`);
    await v.press(`#panel [data-go-item="${id}"]`);
    await v.rest();
    await checkMachineInView(v, id);
    const panel = await page.evaluate(() => ({
      note: document.querySelector('#panel .note')?.textContent ?? '',
      sizeLabel: [...document.querySelectorAll('#panel .facts dt')].map((term) => term.textContent.trim()),
      tabs: [...document.querySelectorAll('#panel [role="tab"]')].map((tab) => tab.dataset.tab),
    }));
    check('the panel does not say that its model is missing', !/3D model is not in the tour yet|not modelled yet/i.test(panel.note), panel.note.slice(0, 60));
    check('it gives the size of the model, and its maker and figures', panel.sizeLabel.includes('Size of the model') && panel.tabs.includes('about') && panel.tabs.includes('features'), `${panel.sizeLabel.join(', ')}; ${panel.tabs.join(' ')}`);

    const before = await v.see();
    const closed = await v.whereIs(id);
    const slider = '#panel [data-explode]';
    check('it has a "Take it apart" slider at 0', (await page.$eval(slider, (input) => input.value).catch(() => null)) === '0');
    await page.focus(slider);
    await page.keyboard.press('End');
    await v.rest();
    const apart = await v.see();
    const open = await v.whereIs(id);
    const entry = await v.item(id);
    check(`taken apart, ${apartMeans}: it needs more room`, entry.apart === 1 && apart.distance > before.distance * 1.05, `apart ${entry.apart}, camera ${round(before.distance)} → ${round(apart.distance)}`);
    check('and all of it is still in view', inside(open, apart.free, 2), `parts ${box(open)}, free ${box(apart.free)}; closed ${box(closed)}`);
    await page.keyboard.press('Home');
    await v.rest();
  };
  const leave = async (id) => {
    await page.keyboard.press('Escape');
    await v.rest();
    const left = await v.see();
    check('leaving it clears the spotlight', left.place === roomOf(id) && left.lit === null && left.veil === 0);
  };

  // The resin printer stood in the Printing Room as a plain volume until its
  // model was imported.
  if (facts.items.some((entry) => entry.id === PRINTER && entry.status === 'built')) {
    await step('The resin printer, a model like the other machines', async () => {
      await likeTheOthers(PRINTER, 'its hood swings open and its parts come out');
      await leave(PRINTER);
    });
  }

  // Lamps in the picture: all of them, and those that are switched on.
  const lamps = () =>
    page.evaluate(() => {
      let all = 0;
      let on = 0;
      window.labTour.stage.scene.traverse((node) => {
        if (!node.isLight) return;
        all++;
        let shown = true;
        for (let at = node; at; at = at.parent) shown = shown && at.visible;
        if (shown) on++;
      });
      return { all, on };
    });

  // The Medit scanner is not in the asset library: its model was imported from
  // the viewer file of that one machine (tools/import-viewer.mjs). That model
  // holds a lamp of its own, which the tour switches off (assets/registry.js
  // says why).
  if (facts.items.some((entry) => entry.id === SCANNER && entry.status === 'built')) {
    await step('The lab scanner from a viewer file, a model like the other machines', async () => {
      await v.go(`#/${roomOf(SCANNER)}`);
      const inRoomView = await lamps();
      await likeTheOthers(SCANNER, 'its roof, walls, arm and plate move away from each other');
      const opened = await lamps();
      check('the model brings a lamp of its own, and the tour keeps it switched off: the lab is lit as before', opened.all === inRoomView.all + 1 && opened.on === inRoomView.on, `in the room ${inRoomView.on} of ${inRoomView.all} lamps on; with the scanner open ${opened.on} of ${opened.all}`);
      await leave(SCANNER);
    });
  }

  // The two milling machines came from viewer files of their own as well. They
  // share one table, and each holds a light in its milling chamber, which stays
  // off like the scanner's.
  const mills = MILLS.filter((mill) => facts.items.some((entry) => entry.id === mill.id && entry.status === 'built'));
  if (mills.length) {
    await step(`The milling machine${mills.length > 1 ? 's' : ''} from viewer files, models like the other machines`, async () => {
      for (const mill of mills) {
        await v.go(`#/${roomOf(mill.id)}`);
        const inRoomView = await lamps();
        await likeTheOthers(mill.id, mill.apart);
        const opened = await lamps();
        const kind = await page.$eval('#panel .eyebrow', (element) => element.textContent.trim()).catch(() => '');
        check('the panel calls it a milling machine', /milling machine/i.test(kind), `"${kind}"`);
        check('its chamber light stays off: the lab is lit as before', opened.all === inRoomView.all + 1 && opened.on === inRoomView.on, `in the room ${inRoomView.on} of ${inRoomView.all} lamps on; with the machine open ${opened.on} of ${opened.all}`);
        await leave(mill.id);
      }
      // They are large and stand in the middle of their room: nothing behind
      // them may end up out of a visitor's reach.
      for (const roomId of new Set(mills.map((mill) => roomOf(mill.id)))) {
        await v.go(`#/${roomId}`);
        const hidden = await page.evaluate((ids) => ids.filter((id) => !window.__t.tapPoint(id)), inRoom(roomId).map((entry) => entry.id));
        check(`every machine in the ${roomId} room can still be tapped in the picture`, hidden.length === 0, hidden.length ? `out of reach: ${hidden.join(', ')}` : `${inRoom(roomId).length} machines`);
      }
    });
  }

  // The two injection units of the Acrylic room came from viewer files as well,
  // of a second make: the model and the viewer's own page share one script
  // there (tools/import-viewer.mjs cuts the two apart). They stand side by side
  // on the island bench. The thermopress holds two lights, a glow at its heater
  // and a light in its flask chamber; they stay off like the other machines'.
  // The SR Ivocap holds none.
  //
  // The thermopress is also the first model that keeps parts out of sight
  // while it is closed: the tool that tightens its flask, which appears when
  // the machine is taken apart, and the stay that props its lid open, which
  // is seen only when a step of a guide opens the lid (the `howto` walk).
  const meshesOf = (id) =>
    page.evaluate((key) => {
      const holder = window.labTour.stage.scene.getObjectByName(key);
      if (!holder) return null;
      let all = 0;
      let shown = 0;
      holder.traverse((node) => {
        if (!node.isMesh) return;
        all++;
        let visible = true;
        for (let at = node; at && at !== holder.parent; at = at.parent) visible = visible && at.visible;
        if (visible) shown++;
      });
      return { all, shown };
    }, id);
  const injectors = INJECTORS.filter((unit) => facts.items.some((entry) => entry.id === unit.id && entry.status === 'built'));
  if (injectors.length) {
    await step(`The injection unit${injectors.length > 1 ? 's' : ''} from viewer files, models like the other machines`, async () => {
      for (const unit of injectors) {
        await v.go(`#/${roomOf(unit.id)}`);
        const inRoomView = await lamps();
        await likeTheOthers(unit.id, unit.apart);
        const opened = await lamps();
        const kind = await page.$eval('#panel .eyebrow', (element) => element.textContent.trim()).catch(() => '');
        check('the panel says that it injects', /injection/i.test(kind), `"${kind}"`);
        check(
          unit.lamps ? `the ${unit.lamps} lights inside it stay off: the lab is lit as before` : 'it brings no light of its own: the lab is lit as before',
          opened.all === inRoomView.all + unit.lamps && opened.on === inRoomView.on,
          `in the room ${inRoomView.on} of ${inRoomView.all} lamps on; with the machine open ${opened.on} of ${opened.all}`,
        );

        const closed = await meshesOf(unit.id);
        await page.focus('#panel [data-explode]');
        await page.keyboard.press('End');
        await v.rest();
        const apart = await meshesOf(unit.id);
        await page.keyboard.press('Home');
        await v.rest();
        const again = await meshesOf(unit.id);
        const told = `closed ${closed?.shown} of ${closed?.all} meshes shown, apart ${apart?.shown}, closed again ${again?.shown}`;
        if (unit.hides) {
          check(`closed, the ${unit.hides} meshes that the model hides are not drawn`, closed && closed.all - closed.shown === unit.hides, told);
          check(`taken apart, ${unit.shows} of them appear; put together again, they are gone`, apart && again && apart.shown - closed.shown === unit.shows && again.shown === closed.shown, told);
        } else {
          check('it hides nothing: every part is drawn, closed or apart', closed && apart && again && closed.shown === closed.all && apart.shown === apart.all && again.shown === again.all, told);
        }
        await leave(unit.id);
      }
      // Two more machines in a room that held only placeholders: none of them
      // may end up out of a visitor's reach.
      for (const roomId of new Set(injectors.map((unit) => roomOf(unit.id)))) {
        await v.go(`#/${roomId}`);
        const hidden = await page.evaluate((ids) => ids.filter((id) => !window.__t.tapPoint(id)), inRoom(roomId).map((entry) => entry.id));
        check(`every machine in the ${roomId} room can still be tapped in the picture`, hidden.length === 0, hidden.length ? `out of reach: ${hidden.join(', ')}` : `${inRoom(roomId).length} machines`);
      }
    });
  }

  await step('The guide, opened from the header', async () => {
    await v.go(`#/${room}`);
    await v.press('#open-guide');
    await frames(page, 2);
    const opened = await page.evaluate(() => ({ open: window.labTour.guide.isOpen, focus: document.activeElement?.className ?? '', steps: document.querySelectorAll('dialog.guide .guide__steps li').length, behind: document.elementFromPoint(40, innerHeight - 20)?.closest('dialog.guide') !== null }));
    check('it opens with its three steps and takes the keyboard focus', opened.open && opened.steps === 3 && /guide__card/.test(opened.focus), JSON.stringify(opened));
    check('the page behind cannot be clicked while it is open', opened.behind);
    await page.keyboard.press('Escape');
    await sleep(350);
    const closed = await page.evaluate(() => ({ open: window.labTour.guide.isOpen, focus: document.activeElement?.id ?? '' }));
    await v.rest();
    check('Escape closes it', !closed.open);
    check('and only it: the visitor is still in the room', (await v.see()).place === room, (await v.see()).place);
    check('focus returns to the button that opened it', closed.focus === 'open-guide', closed.focus);
    await v.press('#open-guide');
    await frames(page, 2);
    await page.mouse.click(6, 6);
    await sleep(350);
    check('a click on the dimmed page around it closes it too', !(await page.evaluate(() => window.labTour.guide.isOpen)));
    await v.press('#open-guide');
    await frames(page, 2);
    await v.press('dialog.guide [data-start]');
    await sleep(350);
    await v.rest();
    const started = await v.see();
    check('"Start the tour" closes it and goes to the first stop', !started.guide && started.place === route[0], `${started.place}, open ${started.guide}`);
  });

  await step('With the keyboard only', async () => {
    await v.go(`#/${room}`);
    const index = inRoom(room).findIndex((entry) => entry.id === MACHINE);
    await page.evaluate((n) => document.querySelectorAll('.hotspot:not(.is-hidden)')[n].focus(), index);
    const label = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
    check("a machine's marker can take the focus and says what it is", /3D model|planned/.test(label ?? ''), label);
    await page.keyboard.press('Enter');
    await v.rest();
    const s = await v.see();
    check('Enter on it opens the machine', s.place === MACHINE);
    check('the focus moves to the panel, since the marker has gone', s.focus.startsWith('aside#panel'), s.focus);
    await page.keyboard.press('Tab');
    const next = await page.evaluate(() => Boolean(document.activeElement.closest('#panel')) && document.activeElement.id !== 'panel');
    check('and the next Tab lands on a control inside the panel', next);
    const announced = await page.$eval('#announcer', (element) => element.textContent);
    check('screen readers are told where the visitor is', announced.length > 3 && s.title.includes(announced), `"${announced}" / "${s.title}"`);
  });

  await step('A smaller window', async () => {
    await v.go(`#/${MACHINE}`);
    await page.setViewport({ width: 1000, height: 700 });
    await frames(page, 3);
    await v.rest();
    const compact = await v.see();
    const where = await v.whereIs(MACHINE);
    check('at 1000 × 700 the panel still sits beside the lab', compact.free.right < compact.stage.right - 300, `free area ends at ${Math.round(compact.free.right)}`);
    check('and the machine still fits the smaller free area', inside(where, compact.free, 2), `machine ${box(where)}, free ${box(compact.free)}`);
    await page.setViewport({ width: 800, height: 900 });
    await frames(page, 3);
    await v.rest();
    const narrow = await v.see();
    const whereNarrow = await v.whereIs(MACHINE);
    check('below 900 px wide the panel becomes a sheet under the lab', near(narrow.free.right, narrow.stage.right, 1) && narrow.panelRect.top > narrow.stage.top + narrow.stage.height * 0.3, `panel top ${Math.round(narrow.panelRect.top)}`);
    check('the bar moves to the bottom edge', near(narrow.dockRect.bottom, narrow.window.height, 1) && near(narrow.dockRect.width, narrow.window.width, 1), `bar ${box(narrow.dockRect)}`);
    check('and the machine fits above the sheet', inside(whereNarrow, narrow.free, 2) && narrow.place === MACHINE && narrow.lit === MACHINE, `machine ${box(whereNarrow)}, free ${box(narrow.free)}`);
    await page.setViewport({ width: 1280, height: 800 });
    await frames(page, 3);
    await v.rest();
    const wide = await v.see();
    const whereWide = await v.whereIs(MACHINE);
    check('back at full size everything is where it was', inside(whereWide, wide.free, 2) && wide.free.right < wide.stage.right - 300);
  });

  noProblems(problems);
  await page.close();
}

// ── Phone ────────────────────────────────────────────────────────────────────
async function phone(browser) {
  current = 'phone';
  console.log('\nPhone — 390 × 844, touch');
  const { page, problems, state } = await open(browser, { width: 390, height: 844, dpr: 2, touch: true, storage: WELCOMED, init: watchLoadingNote });
  const v = visitor(page, { touch: true });
  const facts = await page.evaluate(() => ({ route: window.labTour.route, items: window.labTour.items() }));
  const { route } = facts;
  const room = roomOf(MACHINE);

  await step('The lab opens', async () => {
    const s = await v.see();
    check('every model loaded', state === 'ready', state);
    check('the navigation bar is a tab bar across the bottom edge', near(s.dockRect.bottom, s.window.height, 1) && near(s.dockRect.left, 0, 1) && near(s.dockRect.width, s.window.width, 1), `bar ${box(s.dockRect)} in ${s.window.width} × ${s.window.height}`);
    check('the panel is a sheet between the lab and the bar', s.panelRect.top > s.stage.top + s.stage.height * 0.3 && s.panelRect.bottom <= s.dockRect.top + 1 && near(s.panelRect.width, s.window.width, 20), `sheet ${box(s.panelRect)}`);
    const wide = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, screen: document.documentElement.clientWidth }));
    check('nothing is wider than the screen', wide.screen === 390 && wide.page <= wide.screen, `${wide.page} px on a screen of ${wide.screen}`);
    const stops = await page.$$eval('.dock__item', (buttons) => buttons.map((button) => ({ id: button.dataset.id, ...button.getBoundingClientRect().toJSON() })));
    check('all seven stops are on screen and big enough for a finger', stops.length === route.length + 1 && stops.every((stop) => stop.left >= -0.5 && stop.right <= s.window.width + 0.5 && stop.height >= 44 && stop.width >= 44), stops.map((stop) => `${stop.id} ${Math.round(stop.width)}×${Math.round(stop.height)}`).join(', '));
    for (const id of route) {
      const where = await v.whereIs(id);
      check(`room "${id}" is in view above the sheet`, inside(where, s.free, 2), `room ${box(where)}, free ${box(s.free)}`);
    }
    // The area above the sheet is about as high as it is wide here. The upright
    // view draws the rooms a third larger in it than the view across would.
    check('the lab is shown upright, the view that draws it larger on a screen this shape', near(s.azimuth, VIEWS.overviewPortrait.azimuth, 0.5), `seen from ${round(s.azimuth, 1)}° (upright ${VIEWS.overviewPortrait.azimuth}°, across ${VIEWS.overview.azimuth}°), free area ${Math.round(s.free.right - s.free.left)} × ${Math.round(s.free.bottom - s.free.top)}`);
    const notes = await page.evaluate(() => window.__loadingNotes);
    check(
      'while the models loaded, the note beside the name was short ("Loading 3/14"), large enough, and never pushed the page wider than the screen',
      notes.length > 1 && notes.every((note) => /^Loading \d+\/\d+$/.test(note.text) && note.px >= 12 && note.page <= note.screen),
      notes.length ? `${notes.length} notes; ${[...new Set(notes.filter((note) => !/^Loading \d+\/\d+$/.test(note.text) || note.px < 12 || note.page > note.screen).map((note) => `"${note.text}" at ${note.px} px, page ${note.page} of ${note.screen}`))].slice(0, 3).join(' | ')}` : 'the note was never seen',
    );
  });

  await step('Tap a room, then a machine', async () => {
    await v.tapScene(room);
    await v.rest();
    const s = await v.see();
    const where = await v.whereIs(room);
    check('a tap on the room in the picture opens it', s.place === room && same(s.dock, [room]), s.place);
    check('the room is in view above the sheet', inside(where, s.free, 2), `room ${box(where)}, free ${box(s.free)}`);
    await v.press(`.hotspot[aria-label^="${(facts.items.find((entry) => entry.id === MACHINE)).name}"]`);
    await v.rest();
  });

  await step('The machine comes forward', async () => {
    const { s, where } = await checkMachineInView(v, MACHINE);
    check('the hint speaks of fingers, not of a mouse', s.hint && /pinch to zoom/i.test(s.hintText), `shown ${s.hint}: "${s.hintText}" (${s.hintLog})`);
    check('the hint sits between the machine and the sheet, covering neither', s.hintRect.top >= where.bottom - 1 && s.hintRect.bottom <= s.panelRect.top + 1, `machine ends ${Math.round(where.bottom)}, hint ${Math.round(s.hintRect.top)} → ${Math.round(s.hintRect.bottom)}, sheet starts ${Math.round(s.panelRect.top)}`);
    check('the sheet leaves at least 45% of the stage to the machine', (s.panelRect.top - s.stage.top) / s.stage.height >= 0.45, `${round(((s.panelRect.top - s.stage.top) / s.stage.height) * 100, 0)}%`);
    console.log(`      (machine view: ${s.calls} draw calls)`);
  });

  await step('One finger turns the machine, and only the machine', async () => {
    await checkTurning(v, MACHINE, { dx: -140, patchSize: { width: 70, height: 46 } });
  });

  await step('Two fingers zoom', async () => {
    const before = await v.see();
    const where = await v.whereIs(MACHINE);
    await v.pinch({ x: where.x, y: where.y }, 60, 180);
    await v.rest();
    const closer = await v.see();
    check('spreading two fingers comes closer', closer.distance < before.distance * 0.9, `${round(before.distance)} → ${round(closer.distance)}`);
    check('toward the machine', moved(closer.target, before.target) < 1e-6);
    await v.pinch({ x: where.x, y: where.y }, 180, 60);
    await v.rest();
    check('pinching goes back out', (await v.see()).distance > closer.distance * 1.1);
  });

  await step('The pills and the sheet', async () => {
    const before = await v.see();
    const strip = await page.$eval('#panel .tabs', (tabs) => ({ scroll: tabs.scrollWidth, width: tabs.clientWidth }));
    await v.press('#panel [data-tab="features"]');
    await sleep(500); // the strip of pills scrolls along
    const features = await page.evaluate(() => ({ tab: window.labTour.panel.tab, cards: document.querySelectorAll('#panel [data-panel="features"] .spec').length, tooWide: document.getElementById('panel').scrollWidth > document.getElementById('panel').clientWidth + 1 }));
    check('a tap on "Features" opens it', features.tab === 'features' && features.cards >= 3, JSON.stringify(features));
    check('the sheet does not scroll sideways', !features.tooWide);
    await page.$eval('#panel .tabs', (tabs) => tabs.scrollTo({ left: tabs.scrollWidth, behavior: 'instant' }));
    await v.press('#panel [data-tab="capabilities"]');
    await sleep(500);
    const last = await page.evaluate(() => {
      const tabs = document.querySelector('#panel .tabs').getBoundingClientRect();
      const pill = document.querySelector('#panel [data-tab="capabilities"]').getBoundingClientRect();
      return { tab: window.labTour.panel.tab, left: pill.left - tabs.left, right: tabs.right - pill.right };
    });
    check(`the last pill can be reached (the strip ${strip.scroll > strip.width ? 'scrolls sideways' : 'fits'}) and ends up fully in view`, last.tab === 'capabilities' && last.left >= -1 && last.right >= -1, JSON.stringify(last));
    await v.rest();
    const after = await v.see();
    const where = await v.whereIs(MACHINE);
    check('the machine is still in view above the sheet', inside(where, after.free, 2), `machine ${box(where)}, free ${box(after.free)}`);
    check('the sheet keeps its height, so the machine does not jump about', near(after.panelRect.top, before.panelRect.top, 1), `${Math.round(before.panelRect.top)} → ${Math.round(after.panelRect.top)}`);

    // A finger that scrolls the sheet must not turn the lab.
    const pose = await v.see();
    await v.drag({ x: middle(pose.panelRect).x, y: pose.panelRect.bottom - 30 }, 0, -120);
    await v.rest();
    const scrolled = await v.see();
    check('scrolling the sheet with a finger does not turn the machine', near(scrolled.azimuth, pose.azimuth, 1e-6) && near(scrolled.elevation, pose.elevation, 1e-6));
    // The finger left the sheet moving, and it runs on for a moment by the
    // browser's clock, not the tour's. A tap that lands meanwhile stops the
    // sheet instead of pressing what is under it, as on any page.
    await atRest(page);
  });

  await step('Take it apart', async () => {
    await v.press('#panel [data-tab="overview"]');
    await sleep(400);
    const before = await v.see();
    const slider = await page.evaluate(() => {
      const input = document.querySelector('#panel [data-explode]');
      input.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = input.getBoundingClientRect();
      return { left: r.left, right: r.right, y: r.top + r.height / 2 };
    });
    await page.touchscreen.tap(slider.right - 3, slider.y);
    await v.rest();
    const value = Number(await page.$eval('#panel [data-explode]', (input) => input.value));
    const entry = await v.item(MACHINE);
    const after = await v.see();
    const where = await v.whereIs(MACHINE);
    check('a tap at the far end of the slider takes the machine apart', value >= 90 && entry.apart >= 0.9, `slider ${value}, apart ${entry.apart}`);
    check('every part is in view above the sheet, as large as the margin allows', inside(where, after.free, 2) && near(fill(where, after.free), FILL, 0.01), `parts ${box(where)}, free ${box(after.free)}, ${round(fill(where, after.free) * 100, 1)}%`);
    check('from the side the visitor had turned to, with the lab still', near(after.azimuth, before.azimuth, 0.05) && near(after.lag, before.lag, 0.05));
  });

  await step('Back to the room, and round the bar', async () => {
    await page.$eval('#panel', (panel) => panel.scrollTo({ top: 0, behavior: 'instant' }));
    await v.press('#panel [data-go-back]');
    const seen = await v.watch(1.05);
    checkCatchUp(seen, 'on the way out');
    await v.rest();
    const s = await v.see();
    const entry = await v.item(MACHINE);
    check('back in the room, spotlight off, machine whole', s.place === room && s.lit === null && s.veil === 0 && entry.apart === 0 && entry.tier === 'lite', `${s.place}, lit ${s.lit}, apart ${entry.apart}`);
    for (const id of [...route, 'lab']) {
      await v.press(`.dock__item[data-id="${id}"]`);
      await v.rest();
      const now = await v.see();
      check(`a tap on "${id}" in the bar goes there`, now.place === id && same(now.dock, [id]), now.place);
    }
    await v.press('#panel [data-start]');
    await v.rest();
    check('"Start the tour" in the sheet goes to the first stop', (await v.see()).place === route[0]);
  });

  await step('A machine that is not modelled yet', async () => {
    await v.go(`#/${roomOf(PLANNED)}`);
    await v.press(`#panel [data-go-item="${PLANNED}"]`);
    await v.rest();
    await checkMachineInView(v, PLANNED);
    check('the sheet says so', /not modelled yet/i.test(await page.$eval('#panel .note', (note) => note.textContent)));
  });

  await step('Text large enough to read, and nothing wider than the screen', async () => {
    await checkOnPhone(page, 'a machine that is not modelled yet', { reads: false }); // its sheet holds a note and figures
    await v.go('#/');
    await v.rest();
    await checkOnPhone(page, 'the whole lab');
    await checkBar(page, 'at 390 px');
    await v.go(`#/${room}`);
    await v.rest();
    await checkOnPhone(page, 'a room');
    await v.go(`#/${MACHINE}`);
    await v.rest();
    await checkOnPhone(page, 'a machine');
    for (const tab of ['about', 'features', 'capabilities']) {
      await atRest(page); // the strip of pills is still sliding to the last one pressed
      await v.press(`#panel [data-tab="${tab}"]`);
      await atRest(page);
      const now = (await v.see()).tab;
      if (now !== tab) throw new Error(`the tap on "${tab}" opened "${now}"`);
      await checkOnPhone(page, `a machine's "${tab}"`, { reads: tab !== 'features' }); // "Features" holds figures
    }
    await v.go('#/');
    await v.rest();
    await v.press('#open-guide');
    await atRest(page);
    await checkOnPhone(page, 'the welcome guide');
    await v.press('dialog.guide .guide__close');
    await atRest(page);
  });

  // A phone 360 px wide whose browser has taken its share of the height, then
  // the narrowest phone there is. The size changes; the touch screen stays.
  const resize = async (width, height) => {
    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await frames(page, 3);
    await v.rest();
  };
  const guideButtons = async () => {
    await v.press('#open-guide');
    await atRest(page);
    const seen = await page.evaluate(() => {
      const dialog = document.querySelector('dialog.guide');
      const d = dialog.getBoundingClientRect();
      const buttons = [...dialog.querySelectorAll('.guide__actions .button')].map((button) => button.getBoundingClientRect());
      return { scrolls: dialog.scrollHeight > dialog.clientHeight + 1, card: Math.round(dialog.scrollHeight), window: Math.round(d.height), inView: buttons.length === 2 && buttons.every((b) => b.top >= d.top && b.bottom <= d.bottom + 0.5 && b.bottom <= innerHeight) };
    });
    await v.press('dialog.guide [data-start]');
    await atRest(page);
    await v.rest();
    return { ...seen, started: (await v.see()).place === route[0] };
  };

  await step('A smaller phone, 360 × 640', async () => {
    await v.go('#/');
    await resize(360, 640);
    const stops = await checkBar(page, 'at 360 px');
    const short = ROOMS.filter((entry) => entry.tabShort);
    check(`where the full name would touch its neighbour the bar shows the short one (${short.map((entry) => `"${entry.tabShort}" for "${entry.tab}"`).join(', ')})`, short.length > 0 && short.every((entry) => stops.find((stop) => stop.id === entry.id)?.text === entry.tabShort), stops.map((stop) => stop.text).join(' '));
    await checkOnPhone(page, 'at 360 px, the whole lab');
    const guide = await guideButtons();
    check('the welcome guide is taller than this screen and scrolls, with both its buttons in view all the same', guide.scrolls && guide.inView, `card ${guide.card} px in ${guide.window} px, buttons in view: ${guide.inView}`);
    check('"Start the tour" in it goes to the first stop', guide.started);
  });

  await step('The narrowest phone, 320 × 568', async () => {
    await v.go('#/');
    await resize(320, 568);
    // The first sheet says more than fits here. What has to stay in view is its two buttons.
    const first = await page.evaluate(() => {
      const panel = document.getElementById('panel');
      const sheet = panel.getBoundingClientRect();
      const buttons = [...panel.querySelectorAll('.actions .button')].map((button) => button.getBoundingClientRect());
      return {
        buttons: buttons.length,
        inView: buttons.every((b) => b.top >= sheet.top && b.bottom <= sheet.bottom + 0.5),
        oneRow: buttons.length === 2 && Math.abs(buttons[0].top - buttons[1].top) < 1,
        words: panel.scrollHeight,
        sheet: Math.round(sheet.height),
        scrolled: panel.scrollTop,
      };
    });
    check(
      'the first sheet is too short for its words, which scroll; "Start the tour" and "How it works" are in view without scrolling, side by side',
      first.buttons === 2 && first.words > first.sheet && first.scrolled === 0 && first.inView && first.oneRow,
      `${first.words} px of words in a sheet of ${first.sheet} px, buttons in view: ${first.inView}, in one row: ${first.oneRow}`,
    );
    for (const id of route) {
      await v.go(`#/${id}`);
      await v.rest();
      const list = await page.evaluate(() => {
        const panel = document.getElementById('panel');
        const edge = panel.getBoundingClientRect().right;
        const rows = [...panel.querySelectorAll('.row')].map((row) => row.getBoundingClientRect().right);
        return { rows: rows.length, past: rows.length ? Math.max(...rows) - edge : 0, sideways: panel.scrollWidth - panel.clientWidth, page: document.documentElement.scrollWidth };
      });
      check(`room "${id}": the list of machines stays inside the sheet, however long a name`, list.past <= 0.5 && list.sideways <= 1 && list.page <= 320, `${list.rows} rows, ${round(list.past, 1)} px past the edge, sheet scrolls ${list.sideways} px sideways, page ${list.page} px`);
    }
    await v.go('#/');
    await v.rest();
    const guide = await guideButtons();
    check('the welcome guide keeps both its buttons in view here too', guide.inView && guide.started, `card ${guide.card} px in ${guide.window} px, buttons in view: ${guide.inView}, started: ${guide.started}`);
  });

  noProblems(problems);
  await page.close();

  // One model's file is kept from arriving. The tour says so beside its name,
  // in a sentence, and on a phone there is little room for a sentence there.
  await step('A model that does not arrive', async () => {
    const lost = await open(browser, { width: 360, height: 640, dpr: 2, touch: true, storage: WELCOMED, block: LOST_MODEL });
    const seen = await lost.page.evaluate(() => {
      const note = document.getElementById('loading');
      const n = note.getBoundingClientRect();
      return {
        text: note.hidden ? '' : note.innerText.replace(/\s+/g, ' ').trim(),
        px: parseFloat(getComputedStyle(note).fontSize),
        left: n.left,
        right: n.right,
        name: document.querySelector('.brand').getBoundingClientRect().right,
        guide: document.getElementById('open-guide').getBoundingClientRect().left,
        page: document.documentElement.scrollWidth,
        screen: document.documentElement.clientWidth,
        plain: window.labTour.items().filter((item) => item.modelState === 'failed').map((item) => item.id),
      };
    });
    check('the tour starts all the same; the machine without its model stays a plain volume', lost.state === 'ready-with-errors' && seen.plain.length > 0, `${lost.state}, without a model: ${seen.plain.join(', ') || 'none'}`);
    check('the note beside the name says how many models are missing, in text large enough to read', /^\d+ of \d+ models could not be loaded$/.test(seen.text) && seen.px >= 12, `"${seen.text}" at ${seen.px} px`);
    check('it keeps between the name and the Guide button, and the page is no wider than the screen', seen.left >= seen.name - 0.5 && seen.right <= seen.guide + 0.5 && seen.page <= seen.screen, `name ends at ${round(seen.name, 1)}, note ${round(seen.left, 1)} → ${round(seen.right, 1)}, Guide from ${round(seen.guide, 1)}, page ${seen.page} of ${seen.screen}`);
    check('the browser console names the model', lost.problems.some((problem) => /Could not build/.test(problem)), lost.problems.slice(0, 3).join(' | '));
    await lost.page.close();
  });
}

// ── A first visit ────────────────────────────────────────────────────────────
async function firstVisit(browser) {
  current = 'first visit';
  console.log('\nFirst visit — nothing remembered yet');
  const { page, problems } = await open(browser, { width: 1280, height: 800, forget: true });
  const v = visitor(page);
  const route = await page.evaluate(() => window.labTour.route);

  await step('The welcome guide', async () => {
    const opened = await page.evaluate(() => ({ open: window.labTour.guide.isOpen, focus: document.activeElement?.className ?? '', title: document.querySelector('#guide-title')?.textContent ?? '' }));
    check('it is shown on arrival, with the focus on it', opened.open && /guide__card/.test(opened.focus) && opened.title.length > 3, JSON.stringify(opened));
    const card = await page.$eval('dialog.guide .guide__card', (element) => element.getBoundingClientRect().toJSON());
    check('it fits the window', card.left >= 0 && card.top >= 0 && card.right <= 1280 && card.bottom <= 800, box(card));
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    check('Tab moves between its buttons', await page.evaluate(() => document.activeElement.tagName === 'BUTTON' && Boolean(document.activeElement.closest('dialog.guide'))));
    const behind = await page.evaluate(() => {
      const button = document.querySelector('#panel [data-start]');
      button.focus();
      return { tookFocus: document.activeElement === button, onTop: document.elementFromPoint(40, innerHeight - 20)?.closest('dialog.guide') !== null };
    });
    check('the page behind can be neither focused nor clicked', !behind.tookFocus && behind.onTop, JSON.stringify(behind));
    await v.press('dialog.guide .guide__actions [data-close]');
    await sleep(350);
    await v.rest();
    const s = await v.see();
    check('its second button closes it and leaves the visitor at the whole lab', !s.guide && s.place === 'lab', `${s.place}, open ${s.guide}`);
  });

  await step('It is shown once', async () => {
    await page.reload({ waitUntil: 'load' });
    await waitReady(page);
    check('after a reload it stays away', !(await page.evaluate(() => window.labTour.guide.isOpen)));
    check(
      'the Guide button in the header brings it back',
      await page.evaluate(() => {
        document.getElementById('open-guide').click();
        return window.labTour.guide.isOpen;
      }),
    );
  });
  noProblems(problems);
  await page.close();

  // Somebody who follows a link to a machine has come to see that machine.
  const linked = await open(browser, { width: 1280, height: 800, forget: true, hash: `#/${MACHINE}` });
  const w = visitor(linked.page);
  await step('Arriving by a link to a machine', async () => {
    await w.rest();
    const { s } = await checkMachineInView(w, MACHINE);
    check('no welcome guide stands in the way', !s.guide);
    check('the lab camera already holds, so the first drag turns the machine only', s.roomHolds && s.lag < 0.01);
    await w.press('#panel [data-go-back]');
    await w.rest();
    await w.press('#brand');
    await w.rest();
    const lab = await w.see();
    check('nor does it appear later, on the way to the whole lab', lab.place === 'lab' && !lab.guide, `${lab.place}, open ${lab.guide}`);
    check(`the route starts at "${route[0]}" all the same`, (await linked.page.$eval('#panel .route-list [data-go-room]', (button) => button.dataset.goRoom)) === route[0]);
  });
  noProblems(linked.problems);
  await linked.page.close();

  // The address bar is the one thing a stranger can write into.
  const odd = await open(browser, { width: 900, height: 600, storage: WELCOMED, query: 'q=constructor', hash: '#/<b>/"x' });
  await step('A link with settings and places that do not exist', async () => {
    const s = await visitor(odd.page).see();
    const picture = await odd.page.evaluate(() => {
      const canvas = document.querySelector('#stage canvas');
      return { width: canvas?.width ?? 0, height: canvas?.height ?? 0, quality: window.labTour.renderInfo().quality };
    });
    check('a quality that does not exist is ignored, and the lab is drawn', ['low', 'medium', 'high'].includes(picture.quality) && picture.width > 0 && picture.height > 0 && s.calls > 0, `quality "${picture.quality}", picture ${picture.width} × ${picture.height}, ${s.calls} draw calls`);
    check('a place that does not exist opens the whole lab, and the address is put right', s.place === 'lab' && s.hash === '#/', `${s.place} ${s.hash}`);
    check('nothing from the address ends up on the page', !(await odd.page.evaluate(() => document.body.innerHTML.includes('<b>/"x') || document.querySelector('#panel b, .dock b') !== null)));
  });
  noProblems(odd.problems);
  await odd.page.close();
}

// ── Reduced motion ───────────────────────────────────────────────────────────
async function reducedMotion(browser) {
  current = 'reduced motion';
  console.log('\nReduced motion — the device asks for less movement');
  const { page, problems } = await open(browser, { width: 1280, height: 800, reducedMotion: true, storage: WELCOMED });
  const v = visitor(page);
  const room = roomOf(MACHINE);

  await step('Places change at once, without a journey', async () => {
    await v.press(`.dock__item[data-id="${room}"]`);
    const atOnce = await v.see();
    await v.rest();
    const settled = await v.see();
    check('a room is simply there: nothing is on its way', atOnce.place === room && !atOnce.busy && near(atOnce.azimuth, settled.azimuth, 1e-9) && near(atOnce.distance, settled.distance, 1e-9), `busy ${atOnce.busy}`);
    await v.press(`#panel [data-go-item="${MACHINE}"]`);
    const lit = await v.see();
    check('a machine is lit and the lab faded at once', lit.place === MACHINE && lit.lit === MACHINE && near(lit.veil, FADED, 0.001) && !lit.busy && lit.roomHolds, `faded by ${round(lit.veil)}, busy ${lit.busy}`);
    await v.rest();
    await checkMachineInView(v, MACHINE);
  });

  await step('Turning, taking apart and leaving still work', async () => {
    const where = await v.whereIs(MACHINE);
    const before = await v.see();
    await v.drag({ x: where.x, y: where.y }, -200, 0);
    await v.rest();
    const turned = await v.see();
    check('a drag still turns the machine about its middle', turnBetween(before.azimuth, turned.azimuth) > 20 && moved(turned.target, before.target) < 1e-6);
    await page.focus('#panel [data-explode]');
    await page.keyboard.press('End');
    const apart = await v.see();
    check('taking it apart re-frames at once', !apart.busy && apart.distance > turned.distance * 1.05 && near(apart.azimuth, turned.azimuth, 0.05), `busy ${apart.busy}`);
    await page.keyboard.press('Escape');
    const left = await v.see();
    check('leaving clears the spotlight at once, with the two views as one', left.place === room && left.lit === null && left.veil === 0 && !left.busy && left.lag === 0, `lit ${left.lit}, faded by ${left.veil}, busy ${left.busy}`);
    await v.rest();
  });

  noProblems(problems);
  await page.close();
}

// ── The entrance ─────────────────────────────────────────────────────────────
// When the tour opens the lab comes up part by part (motion.js). That is the
// browser fading stills of the picture, on the browser's own clock, so here it
// is opened standing still at its first moment (?intro=hold) and moved by hand.
async function entrance(browser) {
  current = 'entrance';
  console.log('\nEntrance — the lab coming up when the tour opens');
  const room = roomOf(MACHINE);
  const PARTS = ['nothing', 'floor', 'walls', 'glazing', 'furniture']; // what each still shows, top first

  const openHeld = async (options = {}) => {
    const tour = await openTour(browser, base, { width: 1280, height: 800, storage: WELCOMED, query: `q=${quality}&intro=hold`, until: 'started', ...options });
    if (/^failed/.test(tour.state)) throw new Error('the tour did not start');
    await tour.page.evaluate(install);
    return tour;
  };
  /** What stands where in the opening right now. */
  const look = (page) =>
    page.evaluate(() => {
      const tour = window.labTour;
      const seen = (selector) =>
        [...document.querySelectorAll(selector)].map((element) => {
          const style = getComputedStyle(element);
          return style.visibility === 'hidden' ? 0 : Number(style.opacity);
        });
      const stage = document.getElementById('stage').getBoundingClientRect();
      return {
        intro: document.documentElement.dataset.intro,
        motion: tour.motion.state,
        busy: tour.motion.busy,
        // Lowest first in the page, so the last one is on top.
        stills: [...document.querySelectorAll('.reveal__still')].map((still) => {
          const box = still.getBoundingClientRect();
          return { shows: still.dataset.still, opacity: Number(getComputedStyle(still).opacity), fills: Math.abs(box.left - stage.left) < 0.5 && Math.abs(box.top - stage.top) < 0.5 && Math.abs(box.width - stage.width) < 0.5 && Math.abs(box.height - stage.height) < 0.5, backed: getComputedStyle(still).backgroundImage !== 'none' };
        }),
        names: seen('.room-pill:not(.is-hidden)'),
        markers: seen('.hotspot:not(.is-hidden)'),
        panel: seen('#panel')[0],
        bar: seen('#dock')[0],
        guide: tour.guide.isOpen,
        place: tour.state.itemId ?? tour.state.roomId ?? 'lab',
        tour: document.documentElement.dataset.tour,
      };
    });
  const seek = async (page, ms) => {
    await page.evaluate((to) => window.labTour.motion.seek(to), ms);
    await frames(page, 2);
  };
  const waitFor = (page, test, timeout = 60000) => page.waitForFunction(test, { timeout, polling: 50 });
  const over = () => document.documentElement.dataset.intro === 'done' && !window.labTour.motion.busy;
  const loaded = () => /^ready/.test(document.documentElement.dataset.tour || '');

  // ── A returning visitor, at the whole lab ──
  const { page, problems } = await openHeld();
  const v = visitor(page);
  let patch = null;
  let afterOpening = null;

  await step('At the first moment', async () => {
    const s = await look(page);
    check('the opening is running', s.intro === 'playing' && s.motion.intro === 'held' && s.busy, `${s.intro}, ${s.motion.intro}`);
    check('the lab is covered by stills of itself: nothing, then one part more each', same(s.motion.stills, PARTS), s.motion.stills.join(' › '));
    check('each still lies exactly over the stage, on its piece of the page background, and is opaque', s.stills.length === PARTS.length && s.stills.every((still) => still.fills && still.backed && still.opacity === 1), JSON.stringify(s.stills));
    const added = await page.evaluate(() => {
      // How many points of the picture differ between one still and the next.
      const pictures = [...document.querySelectorAll('.reveal__still')].reverse().map((still) => still.querySelector('canvas'));
      const data = pictures.map((picture) => (picture ? picture.getContext('2d').getImageData(0, 0, picture.width, picture.height).data : null));
      const counts = [];
      for (let k = 1; k < data.length; k++) {
        let differing = 0;
        for (let i = 0; i < data[k].length; i += 4) {
          const before = data[k - 1] ? Math.abs(data[k][i] - data[k - 1][i]) + Math.abs(data[k][i + 1] - data[k - 1][i + 1]) + Math.abs(data[k][i + 2] - data[k - 1][i + 2]) + Math.abs(data[k][i + 3] - data[k - 1][i + 3]) : data[k][i + 3];
          if (before > 24) differing++;
        }
        counts.push(differing);
      }
      return { counts, blank: pictures[0] === null };
    });
    check('the first still is the empty page, and every later one adds to the picture', added.blank && added.counts.length === PARTS.length - 1 && added.counts.every((count) => count > 400), `points added: ${added.counts.join(', ')}`);
    check('no names over the rooms yet, no panel, no bar', s.names.length === 6 && s.names.every((opacity) => opacity === 0) && s.panel === 0 && s.bar === 0, `names ${s.names.join(',')}, panel ${s.panel}, bar ${s.bar}`);
    const spot = await page.evaluate((id) => {
      const point = window.__t.tapPoint(id);
      return point ? { ...point, top: document.elementFromPoint(point.x, point.y) === window.labTour.stage.renderer.domElement } : null;
    }, room);
    check('yet the lab can be tapped already: a still lets everything through', Boolean(spot) && spot.top, JSON.stringify(spot));
    check('and no welcome guide for a returning visitor', !s.guide);
  });

  await step('The models load behind it', async () => {
    await waitFor(page, loaded, 180000);
    const s = await look(page);
    const models = await page.evaluate(() => window.labTour.items().filter((entry) => entry.status === 'built'));
    check('every model has taken its place, unseen', s.tour === 'ready' && models.every((entry) => entry.modelState === 'ready' && entry.tier === 'lite'), `${s.tour}; ${models.filter((entry) => entry.modelState !== 'ready').map((entry) => entry.id).join(', ')}`);
    check('without ending the opening or starting it again', s.intro === 'playing' && same(s.motion.stills, PARTS) && s.stills.every((still) => still.opacity === 1), `${s.intro}; ${s.motion.stills.join(' › ')}`);
  });

  await step('Part by part', async () => {
    const opacity = (s, shows) => s.stills.find((still) => still.shows === shows)?.opacity;
    await seek(page, 430);
    let s = await look(page);
    check('first the floor: the empty page is fading away over it', opacity(s, 'nothing') > 0 && opacity(s, 'nothing') < 1 && opacity(s, 'furniture') === 1, `empty page at ${round(opacity(s, 'nothing'))}`);
    await seek(page, 1000);
    s = await look(page);
    check('then the walls and the glass, and the furniture after them', opacity(s, 'nothing') === 0 && opacity(s, 'floor') === 0 && opacity(s, 'walls') > 0 && opacity(s, 'glazing') > 0 && opacity(s, 'glazing') < 1 && opacity(s, 'furniture') === 1, s.stills.map((still) => `${still.shows} ${round(still.opacity)}`).join(', '));
    await seek(page, 1425);
    s = await look(page);
    check('the machines last: only the still without them is left, and it is going', ['nothing', 'floor', 'walls', 'glazing'].every((shows) => opacity(s, shows) === 0) && opacity(s, 'furniture') > 0 && opacity(s, 'furniture') < 1, s.stills.map((still) => `${still.shows} ${round(still.opacity)}`).join(', '));
    check('still no names and no panel', s.names.every((value) => value === 0) && s.panel === 0);
    await seek(page, 1760);
    s = await look(page);
    check('the lab is all there; the names come in one after the other', s.stills.every((still) => still.opacity === 0) && s.names.filter((value) => value > 0).length >= 2 && s.names.filter((value) => value < 1).length >= 2, `names ${s.names.map((value) => round(value)).join(', ')}`);
    check('and the panel and the bar after them', s.panel > 0 && s.panel < 1 && s.bar > 0 && s.bar < 1, `panel ${round(s.panel)}, bar ${round(s.bar)}`);
  });

  await step('When it is over', async () => {
    await page.evaluate(() => window.labTour.motion.release());
    await waitFor(page, over);
    await frames(page, 3);
    const s = await look(page);
    check('nothing of it is left on the page', s.intro === 'done' && s.stills.length === 0 && !s.busy && (await page.evaluate(() => document.querySelector('.reveal').getAnimations({ subtree: true }).length)) === 0, `${s.intro}, ${s.stills.length} stills`);
    check('every name, the panel and the bar are there', s.names.length === 6 && s.names.every((value) => value === 1) && s.panel === 1 && s.bar === 1, `names ${s.names.join(',')}, panel ${s.panel}, bar ${s.bar}`);
    const before = await page.evaluate(() => window.labTour.stage.framesDrawn);
    await sleep(1200);
    const drawn = (await page.evaluate(() => window.labTour.stage.framesDrawn)) - before;
    check('and the tour is at rest: no frame is drawn while nothing happens', drawn === 0, `${drawn} frames in 1.2 s`);
    const free = (await v.see()).free;
    patch = { left: Math.round(free.left + (free.right - free.left) * 0.25), top: Math.round(free.top + (free.bottom - free.top) * 0.25), right: Math.round(free.left + (free.right - free.left) * 0.75), bottom: Math.round(free.top + (free.bottom - free.top) * 0.75) };
    afterOpening = await v.pixels(patch);
    check('the test patch shows the lab', contrast(afterOpening) >= 8, `contrast ${contrast(afterOpening)}`);
  });

  await step('Something that arrives later', async () => {
    const before = await v.see();
    const laid = await page.evaluate(() => {
      const tour = window.labTour;
      let ran = false;
      tour.motion.change(() => {
        ran = true;
        tour.stage.invalidate();
      });
      const still = document.querySelector('.reveal__still');
      return { ran, stills: tour.motion.state.stills, pictured: Boolean(still?.querySelector('canvas')?.width) };
    });
    check('is put in place at once, under a still of the picture as it was', laid.ran && same(laid.stills, ['before']) && laid.pictured, JSON.stringify(laid));
    await waitFor(page, () => !window.labTour.motion.busy, 20000);
    const after = await v.see();
    const s = await look(page);
    check('the still fades away and leaves nothing behind', s.stills.length === 0 && !s.busy);
    check('the camera did not move for it', near(after.azimuth, before.azimuth, 1e-9) && near(after.distance, before.distance, 1e-9) && moved(after.target, before.target) < 1e-9);
    // While the picture is moving a still would be out of date at once.
    await page.evaluate(
      (to) =>
        new Promise((resolve) => {
          addEventListener('hashchange', () => resolve(), { once: true }); // the tour hears it first
          location.hash = to;
        }),
      `#/${room}`,
    );
    const onTheWay = await page.evaluate(() => {
      const tour = window.labTour;
      let ran = false;
      tour.motion.change(() => {
        ran = true;
      });
      return { ran, busy: tour.busy, stills: tour.motion.state.stills.length };
    });
    check('while the camera is on its way it is simply put in place, with no still', onTheWay.ran && onTheWay.busy && onTheWay.stills === 0, JSON.stringify(onTheWay));
  });
  noProblems(problems);
  await page.close();

  // ── The same lab, opened without the opening: the picture must be the same ──
  const plain = await open(browser, { width: 1280, height: 800, storage: WELCOMED, query: `q=${quality}&intro=off` });
  await step('It leaves the lab as it would have been without it', async () => {
    const s = await look(plain.page);
    check('?intro=off opens the tour without the opening', s.intro === 'done' && s.stills.length === 0);
    const without = await visitor(plain.page).pixels(patch);
    check('the picture after the opening is the picture without one, point for point', difference(afterOpening, without) < 0.02, `mean difference ${round(difference(afterOpening, without), 3)}`);
  });
  noProblems(plain.problems);
  await plain.page.close();

  // ── Tapping a room while the lab is still coming up ──
  const eager = await openHeld();
  await step('A tap during the opening', async () => {
    await seek(eager.page, 600);
    await visitor(eager.page).tapScene(room);
    const s = await look(eager.page);
    check('takes the visitor to the room at once', s.place === room, s.place);
    check('and ends the opening: the lab is simply all there', s.intro === 'done' && s.stills.length === 0 && s.motion.intro === 'none', `${s.intro}, ${s.stills.length} stills`);
    await frames(eager.page, 3);
    const later = await look(eager.page);
    check('with the room\'s markers and the panel in place', later.markers.length > 0 && later.panel === 1, `${later.markers.length} markers, panel ${later.panel}`);
  });
  noProblems(eager.problems);
  await eager.page.close();

  // ── A model that gets ready just while the machines are coming up ──
  const midway = await openHeld();
  await step('A model that gets ready while the machines come up', async () => {
    await seek(midway.page, 1300);
    const half = await look(midway.page);
    const shown = Object.fromEntries(half.stills.map((still) => [still.shows, still.opacity]));
    check('at 1.3 s the machines are half there: only the last still is left, partly faded', shown.nothing === 0 && shown.floor === 0 && shown.walls === 0 && shown.furniture > 0.05 && shown.furniture < 0.95, JSON.stringify(shown));
    const waiting = await midway.page.evaluate(() => {
      const tour = window.labTour;
      window.__late = null;
      tour.motion.change(() => {
        window.__late = { stills: [...tour.motion.state.stills] };
      });
      return { ran: window.__late !== null, waiting: tour.motion.state.waiting };
    });
    check('a model that gets ready now waits: nothing changes in a lab that is half there', !waiting.ran && waiting.waiting >= 1, JSON.stringify(waiting));
    await midway.page.evaluate(() => window.labTour.motion.release());
    await waitFor(midway.page, () => window.__late !== null);
    const late = await midway.page.evaluate(() => window.__late);
    check('and takes its place once the machines are all there, under a still of its own', same(late.stills, ['before']), JSON.stringify(late));
    await waitFor(midway.page, over);
    const s = await look(midway.page);
    check('after which nothing is left over the picture', s.stills.length === 0 && s.motion.waiting === 0, `${s.stills.length} stills, ${s.motion.waiting} waiting`);
  });
  noProblems(midway.problems);
  await midway.page.close();

  // ── The window changes size while the lab is still coming up ──
  const resized = await openHeld();
  await step('The window changes size during the opening', async () => {
    await seek(resized.page, 600);
    const during = await look(resized.page);
    await resized.page.setViewport({ width: 1040, height: 700, deviceScaleFactor: 1 });
    await resized.page.waitForFunction(() => window.innerWidth === 1040, { timeout: 20000, polling: 50 });
    await frames(resized.page, 4);
    const s = await look(resized.page);
    // (A model that gets ready just now may lay a still of its own, 'before': that one is of the new size.)
    const stale = s.stills.filter((still) => still.shows !== 'before');
    check('the stills, made for the old size, are dropped and the lab is simply all there', during.stills.length === PARTS.length && stale.length === 0 && s.intro === 'done' && s.motion.intro === 'none', `${during.stills.length} stills → ${s.stills.map((still) => still.shows).join(', ') || 'none'}; ${s.intro}`);
    check('whatever lies over the picture now has its new size', s.stills.every((still) => still.fills), `${s.stills.length} stills`);
    const fit = await resized.page.evaluate(() => {
      const canvas = document.querySelector('#stage canvas');
      const stage = document.getElementById('stage').getBoundingClientRect();
      const box = canvas.getBoundingClientRect();
      return { fills: Math.abs(box.width - stage.width) < 1 && Math.abs(box.height - stage.height) < 1, picture: `${canvas.width}×${canvas.height}`, stage: `${Math.round(stage.width)}×${Math.round(stage.height)}` };
    });
    check('the picture has the new size', fit.fills && fit.picture === fit.stage, `picture ${fit.picture}, stage ${fit.stage}`);
    await frames(resized.page, 3);
    const later = await look(resized.page);
    check('with the room names, the panel and the bar in place', later.names.length === 6 && later.names.every((value) => value === 1) && later.panel === 1 && later.bar === 1, `names ${later.names.join(' ')}, panel ${later.panel}, bar ${later.bar}`);
  });
  noProblems(resized.problems);
  await resized.page.close();

  // ── A link straight to a machine ──
  const linked = await openHeld({ hash: `#/${MACHINE}` });
  await step('A link to a machine', async () => {
    const s = await look(linked.page);
    check('opens on the machine, and everything comes up as one', s.place === MACHINE && s.intro === 'playing' && same(s.motion.stills, ['nothing']), `${s.place}; ${s.motion.stills.join(' › ')}`);
    await linked.page.evaluate(() => window.labTour.motion.release());
    await waitFor(linked.page, over);
    await waitFor(linked.page, loaded, 180000);
    const entry = await visitor(linked.page).item(MACHINE);
    check('its detailed model is the one on show when everything is in', entry.tier === 'hero' && entry.modelState === 'ready', `${entry.tier}, ${entry.modelState}`);
  });
  noProblems(linked.problems);
  await linked.page.close();

  // ── Somebody who has never been here ──
  const first = await openHeld({ forget: true, storage: null });
  await step('The welcome guide waits for it', async () => {
    const during = await look(first.page);
    check('no guide over the lab while it is coming up', during.intro === 'playing' && !during.guide);
    await first.page.evaluate(() => window.labTour.motion.release());
    await waitFor(first.page, over);
    await frames(first.page, 2);
    const after = await look(first.page);
    check('it opens when the lab is there', after.guide && after.place === 'lab');
  });
  noProblems(first.problems);
  await first.page.close();

  // ── Somebody who asked for less motion ──
  const calm = await openTour(browser, base, { width: 1280, height: 800, reducedMotion: true, forget: true, query: `q=${quality}`, until: 'started' });
  await step('With reduced motion there is none', async () => {
    const s = await look(calm.page);
    check('no opening: the lab, its names and the panel are simply there', s.intro === 'done' && s.stills.length === 0 && !s.busy && s.names.length === 6 && s.names.every((value) => value === 1) && s.panel === 1 && s.bar === 1, `${s.intro}; names ${s.names.join(',')}; panel ${s.panel}`);
    check('and the guide for a first visit is there at once', s.guide);
    await waitFor(calm.page, loaded, 180000);
    const laid = await calm.page.evaluate(() => {
      const tour = window.labTour;
      let ran = false;
      tour.motion.change(() => {
        ran = true;
      });
      return { ran, stills: tour.motion.state.stills.length, everStill: document.querySelectorAll('.reveal__still').length };
    });
    check('a model that arrives is simply put in place', laid.ran && laid.stills === 0 && laid.everStill === 0, JSON.stringify(laid));
  });
  noProblems(calm.problems);
  await calm.page.close();

  // ── A picture too large to keep four copies of ──
  // Above six megapixels (MAX_STILL_PIXELS in motion.js; a large window on a
  // high-density screen) the lab comes up as one, with no stills of it.
  const large = await openHeld({ width: 2800, height: 2400 });
  await step('A very large picture', async () => {
    const size = await large.page.evaluate(() => {
      const picture = window.labTour.stage.renderer.domElement;
      return { pixels: picture.width * picture.height, pictures: document.querySelectorAll('.reveal__still canvas').length };
    });
    const s = await look(large.page);
    check('of more than six megapixels gets one plain fade: the empty page over the lab, and no copy of the picture', size.pixels > 6e6 && s.intro === 'playing' && same(s.motion.stills, ['nothing']) && size.pictures === 0, `${round(size.pixels / 1e6, 2)} megapixels; ${s.motion.stills.join(' › ')}; ${size.pictures} copies`);
    await seek(large.page, 400);
    const half = await look(large.page);
    check('the lab comes up through it as one', half.stills.length === 1 && half.stills[0].opacity > 0 && half.stills[0].opacity < 1, half.stills.map((still) => `${still.shows} ${round(still.opacity)}`).join(', '));
    await large.page.evaluate(() => window.labTour.motion.release());
    await waitFor(large.page, over);
    await frames(large.page, 2);
    const after = await look(large.page);
    check('and it ends like any other, with names, panel and bar in place', after.intro === 'done' && after.stills.length === 0 && after.names.every((value) => value === 1) && after.panel === 1 && after.bar === 1, `${after.intro}; names ${after.names.join(' ')}; panel ${after.panel}`);
  });
  noProblems(large.problems);
  await large.page.close();

  // ── The opening must never cost a visitor the tour ──
  // It runs while the tour is being started. Two browsers in which a still
  // cannot be had: one that will not hand out a canvas as large as the picture
  // (a browser short of memory for canvases may answer a request for another
  // with nothing; Safari has done so), and one in which copying the picture
  // fails outright, for whatever reason.
  const whenStillsFail = async (init, query = `q=${quality}`) => {
    const tour = await open(browser, { width: 1280, height: 800, storage: WELCOMED, query, init });
    const s = await look(tour.page);
    const seen = await tour.page.evaluate(() => {
      const lab = window.labTour;
      let ran = false;
      lab.motion.change(() => {
        ran = true;
      });
      return { asked: window.__stillsAsked, models: lab.items().filter((entry) => entry.status === 'built' && entry.modelState !== 'ready').map((entry) => entry.id), ran, stills: lab.motion.state.stills.length };
    });
    check('the tour opens all the same, without the opening', tour.state === 'ready' && s.intro === 'done' && s.stills.length === 0 && !s.busy, `${tour.state}; ${s.intro}; ${s.stills.length} stills`);
    check('with every name, the panel and the bar in place, and every model loaded', s.names.length === 6 && s.names.every((value) => value === 1) && s.panel === 1 && s.bar === 1 && seen.models.length === 0, `names ${s.names.join(' ')}; panel ${s.panel}; bar ${s.bar}; not loaded: ${seen.models.join(', ') || 'none'}`);
    const picture = await visitor(tour.page).pixels(patch);
    check('and the whole lab on show: the picture is that of a visit with the opening, point for point', difference(afterOpening, picture) < 0.02, `mean difference ${round(difference(afterOpening, picture), 3)}`);
    check('it asked for one still, and for no other after that; what arrives later is simply put in place', seen.asked === 1 && seen.ran && seen.stills === 0, `asked ${seen.asked} times; put in place ${seen.ran}; ${seen.stills} stills`);
    return tour;
  };

  let tight = null;
  await step('A browser that cannot spare the memory for stills', async () => {
    tight = await whenStillsFail(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      let picture = null;
      window.__stillsAsked = 0;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === '2d' && picture && this !== picture && this.width === picture.width && this.height === picture.height) {
          window.__stillsAsked++;
          return null;
        }
        const context = getContext.call(this, type, ...rest);
        if (context && /^webgl/.test(String(type))) picture = this;
        return context;
      };
    });
    noProblems(tight.problems);
  });
  await tight?.page.close();

  const copyingFails = () => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    let picture = null;
    window.__stillsAsked = 0;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      const context = getContext.call(this, type, ...rest);
      if (context && /^webgl/.test(String(type))) picture = this;
      return context;
    };
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...rest) {
      if (picture && source === picture) {
        window.__stillsAsked++;
        throw new DOMException('The picture cannot be copied', 'InvalidStateError');
      }
      return drawImage.call(this, source, ...rest);
    };
  };
  const saidOnce = (problems) => {
    const said = problems.filter((problem) => /without fading in/.test(problem));
    check('it says so once in the console, as a warning, and reports nothing else', said.length === 1 && problems.length === 1 && said[0].startsWith('console.warn'), problems.slice(0, 5).join(' | ') || 'nothing reported');
  };

  let faulty = null;
  await step('A browser in which copying the picture fails', async () => {
    faulty = await whenStillsFail(copyingFails);
    saidOnce(faulty.problems);
  });
  await faulty?.page.close();

  // Without an opening (?intro=off here; a tab opened in the background is the
  // same) the first still is asked for by the first model that arrives.
  let later = null;
  await step('The same, when the first still is for a model that arrives', async () => {
    later = await whenStillsFail(copyingFails, `q=${quality}&intro=off`);
    saidOnce(later.problems);
  });
  await later?.page.close();
}

// ── How to use it ────────────────────────────────────────────────────────────
// A machine's guides: the card on its first pill, the list of the guides, and
// every step of every guide. What is checked at a step is what a reader of the
// guide relies on: the text is the one from how-to.js, the camera has gone to
// the part, each ring sits on the very point that how-to.js names (worked out
// here from the 3D scene, not by the tour's own code), and the machine is shown
// as the step has it.
async function howTo(browser) {
  const items = await guidesOf(browser, GUIDED);
  if (flags.guided || !items) return; // one machine was asked for: that one alone
  // Then every other machine that has guides: each step of each guide, beside
  // the lab and on a phone, and what depends on how that machine opens. What
  // is the same for all of them (Escape and Back, addresses, smaller phones,
  // reduced motion) was seen on the first.
  const met = new Set([GUIDED.split('/')[1]]);
  for (const item of items) {
    const typeId = item.id.split('/')[1];
    if (item.status !== 'built' || met.has(typeId) || !HOW_TO[typeId]?.guides?.length) continue;
    met.add(typeId);
    await guidesOf(browser, item.id, { whole: false });
  }
}

/** The guides of one machine. Returns the lab's machines as the tour lists them, or null if there was nothing to walk through. */
async function guidesOf(browser, guided, { whole = true } = {}) {
  current = whole ? 'how to use it' : `how to use it, ${guided.split('/')[1]}`;
  console.log(whole ? "\nHow to use it — a machine's guides: beside the lab, on a phone, by a link" : `\nHow to use it — the guides of ${guided}: every step, beside the lab and on a phone`);
  const info = HOW_TO[guided.split('/')[1]];
  if (!info?.guides?.length) {
    console.log(`  (rooms/how-to.js has no guides for "${guided}": nothing to walk through)`);
    return null;
  }
  const guides = info.guides;
  const guide = guides[0];
  const steps = guide.steps;
  const total = steps.length;
  const norm = (text) => String(text).replace(/\s+/g, ' ').trim();
  const ringsOf = (place) => (Array.isArray(place.at?.[0]) ? place.at.length : 1);
  const placeOf = (entry) => (entry.at ? info.places[entry.at] : null);
  const hashOf = (entry, index = 0) => `#/${guided}/how-to/${entry.id}${index ? `/${index + 1}` : ''}`;
  const tell = (list) => list.slice(0, 4).join('; ');
  let rest = 0; // how far open the machine stands in the lab: read from the tour below
  const sorted = (list) => [...list].sort();
  // Steps of the first guide that the checks single out.
  const swings = steps.findIndex((entry, index) => index > 0 && Boolean(entry.open) !== Boolean(steps[index - 1].open)); // the machine opens, or shuts, on the way into this one
  const bare = steps.findIndex((entry) => entry.open && entry.without?.length); // open, and with a part taken out
  const sided = steps.findIndex((entry) => placeOf(entry) && Math.abs(placeOf(entry).from[0]) >= 30); // looks at the machine from one side
  // The step whose part gets turned out of sight: that one, or else any that looks from low enough for a turn of the
  // machine to hide its part. (Seen from steeply above, a part stays in sight however the machine is turned.)
  const turnAt = sided >= 0 ? sided : steps.findIndex((entry) => placeOf(entry) && placeOf(entry).from[1] <= 30);
  const longest = steps.reduce((best, entry, index) => (entry.text.length > steps[best].text.length ? index : best), 0);
  const how = (page) => page.evaluate(() => window.__t.howTo());
  const partOnScreen = (page, name) => page.evaluate((part) => window.__t.partOnScreen(part), name);
  const placeOnScreen = (page, place) => page.evaluate((id, definition) => window.__t.placeOnScreen(id, definition), guided, { part: place.part, at: place.at ?? null, show: place.show ?? null });
  const movedParts = (page) => page.evaluate((id) => window.__t.movedParts(id), guided);

  /** Go through a guide from its first step with "Next"; what there is to see at each step. */
  async function walk(page, v, entry) {
    const seen = [];
    for (let index = 0; index < entry.steps.length; index++) {
      if (index > 0) {
        await v.press('#panel [data-focus="next"]');
        await v.rest();
      }
      await atRest(page);
      const place = placeOf(entry.steps[index]);
      seen.push({ n: index + 1, step: entry.steps[index], place, s: await v.see(), h: await how(page), part: place ? await partOnScreen(page, place.part) : null, framed: place ? await placeOnScreen(page, place) : null, moved: await movedParts(page) });
    }
    return seen;
  }
  const centres = (at) => at.h.rings.map(middle);
  const within = (point, area, margin = 0) => point.x >= area.left - margin && point.x <= area.right + margin && point.y >= area.top - margin && point.y <= area.bottom + margin;

  /**
   * What holds at every step of a walk, on a desktop and on a phone alike.
   * `margin` is the share of the free area that a step leaves empty around
   * what it frames (layout.js); `whole` is how far the camera stands on the
   * machine's own page, where that page has the same free area as the guide.
   */
  function checkWalk(seen, entry, { name, margin, whole = null }) {
    const count = entry.steps.length;
    const off = (holds, say) => seen.filter((at) => !holds(at)).map((at) => `step ${at.n}: ${say(at)}`);
    let wrong = off(
      (at) => at.s.hash === hashOf(entry, at.n - 1) && at.s.title === `${entry.title} · ${name} — Lab Tour` && at.h.count === `Step ${at.n} of ${count}` && at.s.place === guided && at.s.lit === guided,
      (at) => `${at.s.hash}, "${at.s.title}", "${at.h.count}"`,
    );
    check(`"Next" leads through all ${count} steps: each has its own address, the guide's name in the page title and its number in the top row`, seen.length === count && wrong.length === 0, tell(wrong));
    wrong = off(
      (at) => at.h.open && at.h.open.title === norm(at.step.title) && at.h.open.text === norm(at.step.text) && same(at.h.progress, entry.steps.map((_, index) => index < at.n)),
      (at) => `"${at.h.open?.title}", ${at.h.progress.filter(Boolean).length} dashes filled`,
    );
    check('each shows its title and its text as how-to.js has them, and the row of dashes fills up to it', wrong.length === 0, tell(wrong));
    wrong = off((at) => at.h.said === `Step ${at.n} of ${count}: ${at.step.title}`, (at) => `"${at.h.said}"`);
    check('screen readers are told the number and the title of each', wrong.length === 0, tell(wrong));

    const open = entry.steps.filter((step) => step.open).length;
    const less = entry.steps.filter((step) => step.without?.length).length;
    wrong = off(
      (at) => at.h.lid === (at.step.open ? 1 : 0) && same(sorted(at.h.without), sorted(at.step.without ?? [])) && at.h.tier === 'hero' && at.h.apart === 0,
      (at) => `lid ${at.h.lid}, without [${at.h.without}], ${at.h.tier}`,
    );
    check(`the machine is shown as each step has it: its lid open in ${open} of them and shut in the rest, a part out of the picture in ${less}`, wrong.length === 0, tell(wrong));
    // The model itself, not the number the tour keeps: where it is not as it is built, something in it lies elsewhere.
    const otherwise = seen.filter((at) => (at.step.open ? 1 : 0) !== rest);
    wrong = off((at) => Array.isArray(at.moved) && ((at.step.open ? 1 : 0) !== rest ? at.moved.length > 0 : at.moved.length === 0), (at) => (at.moved?.length ? `${at.moved.slice(0, 3).join(', ')} moved` : 'nothing has moved'));
    check(
      otherwise.length
        ? `and so does its model: in the ${otherwise.length} steps that have it ${rest ? 'shut' : 'open'}, "${otherwise[0].moved?.[0] ?? '?'}" lies elsewhere than it is built; in the others every part lies as built`
        : 'and so does its model: every part lies as it is built, at every step',
      wrong.length === 0,
      tell(wrong),
    );

    const pointing = seen.filter((at) => at.place);
    wrong = off(
      (at) => (at.place ? at.h.rings.length === ringsOf(at.place) && at.h.marks.step === `${entry.id}/${at.n - 1}` && !at.h.marks.away && at.h.ringsShown && !at.h.awayFlag && centres(at).every((point) => within(point, at.s.free)) : at.h.rings.length === 0),
      (at) => `${at.h.rings.length} rings at ${centres(at).map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(' ')} (free ${box(at.s.free)}), shown ${at.h.ringsShown}`,
    );
    check(`${pointing.length} steps point at the machine: each has one ring for every spot it marks, on show in the free part of the picture`, pointing.length > 0 && wrong.length === 0, tell(wrong));
    wrong = off(
      (at) => !at.place || (at.part && centres(at).every((point) => within(point, at.part, 2))),
      (at) => `rings at ${centres(at).map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(' ')}, "${at.place.part}" at ${at.part ? box(at.part) : 'nowhere'}`,
    );
    check('every ring lies on the part it belongs to, as the 3D scene itself has that part on screen', wrong.length === 0, tell(wrong));
    // On the right key, not just on the keypad: the middle of a ring is the point that how-to.js names.
    const onSpot = (at) => at.framed && at.framed.spots.length === at.h.rings.length && centres(at).every((point, index) => Math.hypot(point.x - at.framed.spots[index].x, point.y - at.framed.spots[index].y) <= 1.5);
    wrong = off(
      (at) => !at.place || onSpot(at),
      (at) => `rings at ${centres(at).map((point) => `${round(point.x, 1)},${round(point.y, 1)}`).join(' ')}, the points at ${(at.framed?.spots ?? []).map((point) => `${round(point.x, 1)},${round(point.y, 1)}`).join(' ')}`,
    );
    check("and its middle is the very point that how-to.js names, where the 3D scene has that point of the model on screen", wrong.length === 0, tell(wrong));
    wrong = off((at) => !at.h.ringsTakeTaps, () => 'a ring is the topmost thing at its own middle');
    check('the rings take no taps: a finger on one lands on the machine under it', wrong.length === 0, tell(wrong));

    wrong = off((at) => !at.place || near(at.s.elevation, at.place.from[1], 0.5), (at) => `${round(at.s.elevation, 1)}° up (wanted ${at.place.from[1]}°)`);
    check('the camera has gone to each part: it looks from the height that its place names', wrong.length === 0, tell(wrong));
    // What a place frames fills the free area as far as the margin allows. One
    // thing overrules a wide margin: a place that takes in much of the machine
    // is not framed from further away than the machine's own page is. The
    // camera then comes closer, and the place fills more of the area: at most
    // what the small margin allows.
    const most = 1 - VIEWS.step.padding;
    const held = (at) => whole !== null && near(at.s.distance / whole, 1, 0.005);
    const share = (at) => fill(at.framed, at.s.free);
    wrong = off(
      (at) => !at.place || (at.framed && centred(at.framed, at.s.free, 2) && (near(share(at), 1 - margin, 0.015) || (held(at) && share(at) > 1 - margin && share(at) <= most + 0.015))),
      (at) => (at.framed ? `fills ${round(share(at) * 100, 1)}%, middle ${Math.round(middle(at.framed).x)},${Math.round(middle(at.framed).y)} in ${box(at.s.free)}${whole === null ? '' : `, ${round(at.s.distance / whole, 3)} of the distance on the machine's own page`}` : 'frames nothing'),
    );
    const closer = pointing.filter((at) => held(at) && share(at) > 1 - margin + 0.015);
    check(
      `what the place frames sits in the middle of the free area and fills ${Math.round((1 - margin) * 100)}% of it${closer.length ? `; in ${closer.length} steps more, up to ${Math.round(Math.max(...closer.map(share)) * 100)}%, where it would otherwise be framed from further away than the machine's own page is` : ''}`,
      wrong.length === 0,
      tell(wrong),
    );
    if (whole !== null) {
      // (Further away only where the place would not fit the free area otherwise.)
      wrong = off((at) => !at.place || at.s.distance <= whole * 1.005 || near(share(at), most, 0.015), (at) => `${round(at.s.distance / whole, 3)} of that distance`);
      check('no step shows the machine smaller than its own page does', wrong.length === 0, tell(wrong));
    }
    const turns = pointing.slice(1).map((at, index) => ({ n: at.n, turned: turnBetween(pointing[index].s.azimuth, at.s.azimuth), wanted: turnBetween(pointing[index].place.from[0], at.place.from[0]) }));
    const misturned = turns.filter((turn) => !near(turn.turned, turn.wanted, 0.5));
    check('and from one step to the next it turns round the machine by as much as their two places differ', misturned.length === 0, tell(misturned.map((turn) => `into step ${turn.n}: ${round(turn.turned, 1)}° (wanted ${turn.wanted}°)`)));
    return pointing;
  }

  // ── Beside the lab ─────────────────────────────────────────────────────────
  const desk = await open(browser, { width: 1280, height: 800, storage: WELCOMED });
  const { page } = desk;
  const v = visitor(page);
  const facts = await page.evaluate(() => ({ items: window.labTour.items() }));
  const entry = facts.items.find((item) => item.id === guided);
  if (!entry || entry.status !== 'built') {
    console.log(`  ("${guided}" is not a modelled machine of the lab: nothing to walk through)`);
    await page.close();
    return null;
  }
  const { name } = entry;
  rest = entry.openAtRest ?? 0;
  // How the machine stands in the lab, in words; a step that has it otherwise; another machine to leave it for.
  const asInTheLab = rest ? 'stands open and whole, as in the lab,' : 'is shut and whole';
  const changed = steps.findIndex((one) => (one.open ? 1 : 0) !== rest);
  const other = guided === MACHINE ? NEIGHBOUR : MACHINE;
  let home = null;

  await step("The card on the machine's first pill, and the list of its guides", async () => {
    if (UNGUIDED) {
      await v.go(`#/${UNGUIDED}`);
      await v.rest();
      check('a machine without guides has no such card', (await page.$('#panel [data-howto]')) === null);
    }
    await v.go(`#/${guided}`);
    await v.rest();
    home = await v.see();
    let h = await how(page);
    check('the machine with guides has a card "How to use it" on its first pill, which says how many there are', h.card.startsWith('How to use it') && h.card.includes(guides.length === 1 ? 'A short guide' : `${guides.length} short guides`) && home.tab === 'overview', `"${h.card}"`);
    await v.press('#panel [data-howto]');
    await v.rest();
    await atRest(page);
    const list = await v.see();
    h = await how(page);
    check('a click on it opens the list of the guides, each with the number of its steps', h.page === 'list' && same(h.rows.map((row) => row.id), guides.map((one) => one.id)) && h.rows.every((row, index) => row.text.includes(guides[index].title) && row.text.includes(`${guides[index].steps.length} step`)), h.rows.map((row) => row.text).join(' | '));
    check('the address, the page title and the heading say where the visitor is', list.hash === `#/${guided}/how-to` && list.title === `How to use it · ${name} — Lab Tour` && list.heading === 'How to use it' && h.said === `How to use it: ${name}`, `${list.hash}, "${list.title}", "${list.heading}", "${h.said}"`);
    check('the machine stays in the spotlight and is seen as before: the list is a page of the machine', list.place === guided && list.lit === guided && near(list.veil, FADED, 0.001) && near(list.azimuth, home.azimuth, 1e-6) && near(list.distance, home.distance, 1e-6) && same(list.dock, [roomOf(guided)]), `${list.place}, lit ${list.lit}`);
    check(
      'under the list: where the guides come from, as a link that opens in a new tab, and that they do not replace the manual',
      h.note && h.note.links.length === 1 && h.note.links[0].href === info.source.url && h.note.links[0].target === '_blank' && /noopener/.test(h.note.links[0].rel) && h.note.text.includes(info.source.label) && /not replace the manual/.test(h.note.text),
      JSON.stringify(h.note),
    );
    check('the keyboard focus has moved to the panel, since the card has gone', h.focus === 'panel', h.focus);
    check(rest ? 'nothing is marked yet, and the machine stands open, as it does in the lab' : 'nothing is marked and nothing is opened yet', h.rings.length === 0 && h.lid === rest && h.without.length === 0, `${h.rings.length} rings, lid ${h.lid}`);
  });

  // Every guide of the machine, from the list of the guides to its last step.
  for (const [number, entry] of guides.entries()) {
    await step(`The guide "${entry.title}", step by step`, async () => {
      const count = entry.steps.length;
      if (number > 0) {
        await v.go(`#/${guided}/how-to`);
        await v.rest();
      }
      await v.press(`#panel .howto-guides [data-howto-guide="${entry.id}"]`);
      await v.rest();
      const seen = await walk(page, v, entry);
      checkWalk(seen, entry, { name, margin: VIEWS.step.paddingWide, whole: home.distance });
      const off = (holds, say) => seen.filter((at) => !holds(at)).map((at) => `step ${at.n}: ${say(at)}`);
      let wrong = off((at) => at.h.listed === count && at.h.total === count && at.h.nameShown && at.h.heading === entry.title, (at) => `${at.h.listed} of ${at.h.total} listed, heading "${at.h.heading}"`);
      check(`beside the lab all ${count} steps are listed under the guide's name, and the open one is unfolded`, wrong.length === 0, tell(wrong));
      wrong = off((at) => at.h.open && at.h.head && at.h.bar && at.h.open.rect.top >= at.h.head.bottom - 14 && at.h.open.rect.bottom <= at.h.bar.top + 14, (at) => `step ${Math.round(at.h.open?.rect.top)} → ${Math.round(at.h.open?.rect.bottom)}, head ends ${Math.round(at.h.head?.bottom)}, bar starts ${Math.round(at.h.bar?.top)}`);
      check('the open step can always be read whole: the list scrolls it out from under the head and from under "Back · Next", which both stay put', wrong.length === 0 && seen.every((at) => near(at.h.head.top, seen[0].h.head.top, 1) && near(at.h.bar.bottom, at.h.sheet.bottom, 2)), tell(wrong));
      wrong = off((at) => at.n === 1 || at.h.focus === 'next', (at) => at.h.focus);
      check('the keyboard focus stays on "Next" from step to step, though every step is drawn afresh', wrong.length === 0, tell(wrong));
      wrong = off((at) => at.h.note && at.h.note.links[0]?.href === info.source.url && /not replace the manual/.test(at.h.note.text) && (!info.note || at.h.note.text.includes(norm(info.note))), () => 'no source');
      check(`the source and the reminder about the manual stand under every step${info.note ? ', with the remark about the 3D model' : ''}`, wrong.length === 0, tell(wrong));
      check('on the last step "Next" has become "Done"', seen[seen.length - 1].h.next === 'Done' && seen.slice(0, -1).every((at) => at.h.next === 'Next'), seen.map((at) => at.h.next).join(' '));
    });
  }

  if (swings > 0) {
    // Into this step the machine opens, or shuts: a lid swings, a furnace's head tips, its lift runs.
    const to = steps[swings].open ? 1 : 0;
    await step(to ? 'A lid swings open; it does not jump' : 'A machine shuts; it does not jump', async () => {
      await v.go(hashOf(guide, swings - 1));
      await v.rest();
      const before = await how(page);
      await v.press('#panel [data-focus="next"]');
      const swing = [];
      for (let moment = 0; moment < 14; moment++) {
        await pass(page, 0.1);
        swing.push(await page.evaluate((id) => ({ lid: window.labTour.items().find((item) => item.id === id).open, busy: window.labTour.busy }), guided));
      }
      await v.rest();
      const there = await how(page);
      const partWay = swing.filter((moment) => moment.lid > 0.02 && moment.lid < 0.98);
      check(`into step ${swings + 1} the lid is seen part-way ${to ? 'open' : 'shut'}, and the tour counts as moving until it has arrived`, before.lid === 1 - to && partWay.length >= 2 && partWay.every((moment) => moment.busy) && there.lid === to, `lid: ${swing.map((moment) => round(moment.lid)).join(' ')}`);
      check(`it only ever ${to ? 'opens' : 'shuts'} further on the way`, swing.every((moment, index) => index === 0 || (to ? moment.lid >= swing[index - 1].lid - 1e-9 : moment.lid <= swing[index - 1].lid + 1e-9)));
      await v.press('#panel [data-focus="back"]');
      await v.rest();
      check(`one step back it is ${to ? 'shut' : 'open'} again`, (await how(page)).lid === 1 - to);
    });
  }

  await step('"Back", a step picked from the list, "Done"', async () => {
    await v.go(hashOf(guide, total - 1));
    await v.rest();
    await v.press('#panel [data-focus="back"]');
    await v.rest();
    await atRest(page);
    let h = await how(page);
    check('"Back" goes one step back, and the keyboard focus stays on it', h.state.step === total - 2 && h.count === `Step ${total - 1} of ${total}` && h.focus === 'back', `step ${h.state.step + 1}, focus ${h.focus}`);
    const picked = total > 3 ? 1 : 0;
    await v.press(`#panel .howto-step [data-howto-step="${picked}"]`);
    await v.rest();
    await atRest(page);
    h = await how(page);
    const s = await v.see();
    check(`a click on step ${picked + 1} in the list opens that step`, h.state.step === picked && h.open?.title === norm(steps[picked].title) && s.hash === hashOf(guide, picked), `step ${h.state.step + 1}, ${s.hash}`);
    if (picked === 0) check('the first step has no "Back"', h.backRect === null);
    await v.go(hashOf(guide, total - 1));
    await v.rest();
    await v.press('#panel [data-focus="next"]');
    await v.rest();
    await atRest(page);
    const done = await v.see();
    h = await how(page);
    const where = await v.whereIs(guided);
    check('"Done" on the last step leads back to the list of the guides', h.page === 'list' && done.hash === `#/${guided}/how-to`, `${h.page}, ${done.hash}`);
    check(`the machine ${asInTheLab} again, and nothing is marked`, h.lid === rest && h.without.length === 0 && h.rings.length === 0 && !h.awayFlag, `lid ${h.lid}, without [${h.without}], ${h.rings.length} rings`);
    check('and it is back in full view, as on arrival', inside(where, done.free, 2) && near(fill(where, done.free), FILL, 0.01) && near(done.elevation, VIEWS.item.elevation, 0.5), `machine ${box(where)}, free ${box(done.free)}, ${round(fill(where, done.free) * 100, 1)}%, ${round(done.elevation, 1)}° up`);
  });

  if (whole) await step("Escape, and the browser's Back", async () => {
    const from = Math.min(2, total - 1);
    await v.go(`#/${guided}/how-to`);
    await v.rest();
    await v.press(`#panel .howto-guides [data-howto-guide="${guide.id}"]`);
    await v.rest();
    for (let index = 0; index < from; index++) {
      await v.press('#panel [data-focus="next"]');
      await v.rest();
    }
    const at = await v.see();
    check(`on step ${from + 1}`, at.hash === hashOf(guide, from), at.hash);
    await page.keyboard.press('Escape');
    await v.rest();
    const list = await v.see();
    check('Escape leaves the step for the list of the guides', list.hash === `#/${guided}/how-to` && (await how(page)).page === 'list', list.hash);
    await page.keyboard.press('Escape');
    await v.rest();
    const machine = await v.see();
    check("again, for the machine's own page", machine.hash === `#/${guided}` && machine.place === guided && (await how(page)).page === null && machine.tabs.length > 0, machine.hash);
    await page.keyboard.press('Escape');
    await v.rest();
    const room = await v.see();
    check('and again, for the room', room.place === roomOf(guided) && room.lit === null, room.place);
    const back = [];
    for (let presses = 0; presses < 3; presses++) {
      await page.goBack();
      await v.rest();
      back.push((await v.see()).hash);
    }
    await atRest(page);
    const h = await how(page);
    check("the browser's Back goes the same way in reverse: the machine, the list, the step", same(back, [`#/${guided}`, `#/${guided}/how-to`, hashOf(guide, from)]), back.join(' '));
    const place = placeOf(steps[from]);
    check('and the step is as it was left: its rings, its lid', h.state?.step === from && h.rings.length === (place ? ringsOf(place) : 0) && h.lid === (steps[from].open ? 1 : 0) && h.ringsShown, `step ${(h.state?.step ?? -1) + 1}, ${h.rings.length} rings, lid ${h.lid}`);
    await page.goBack();
    await v.rest();
    const earlier = await v.see();
    check(`once more: step ${from}, the way "Next" came`, earlier.hash === hashOf(guide, from - 1), earlier.hash);
  });

  if (whole && turnAt >= 0) {
    await step('A part turned out of sight, and "Show it on the machine again"', async () => {
      const place = placeOf(steps[turnAt]);
      await v.go(hashOf(guide, turnAt));
      await v.rest();
      await atRest(page);
      const before = await v.see();
      const shown = await how(page);
      check(`step ${turnAt + 1} marks its part and has the button`, shown.rings.length === ringsOf(place) && shown.ringsShown && shown.open?.aim && !shown.awayFlag, `${shown.rings.length} rings, button ${shown.open?.aim}`);
      // Drag across the free area, from its right-hand side to its left: far enough to bring the machine's other side round.
      await v.drag({ x: before.free.right - 40, y: middle(before.free).y }, -(before.free.right - before.free.left - 80), 0);
      await v.rest();
      await atRest(page);
      const turned = await v.see();
      const gone = await how(page);
      check('dragged round to its other side, the rings go rather than float over the wrong side of the machine', turnBetween(before.azimuth, turned.azimuth) > 100 && gone.marks.away && !gone.ringsShown && gone.rings.length === shown.rings.length, `turned ${round(turnBetween(before.azimuth, turned.azimuth), 1)}°, away ${gone.marks.away}, shown ${gone.ringsShown}`);
      check('the button that brings the view back stands out meanwhile', gone.awayFlag);
      check('the step, its address and the machine are as they were', turned.hash === before.hash && gone.state.step === turnAt && gone.lid === shown.lid && same(gone.without, shown.without));
      await v.press('#panel [data-howto-aim]');
      await v.rest();
      await atRest(page);
      const again = await v.see();
      const back = await how(page);
      check(
        'a click on it turns the machine back to the part: the same view, and the rings where they were',
        turnBetween(again.azimuth, before.azimuth) < 0.5 && near(again.elevation, before.elevation, 0.5) && near(again.distance / before.distance, 1, 0.01) && back.ringsShown && !back.awayFlag && back.rings.length === shown.rings.length && back.rings.every((ring, index) => near(middle(ring).x, middle(shown.rings[index]).x, 1.5) && near(middle(ring).y, middle(shown.rings[index]).y, 1.5)),
        `turned ${round(turnBetween(again.azimuth, before.azimuth), 2)}° off, shown ${back.ringsShown}`,
      );
      // A small turn keeps them: they stay on the part as it turns.
      await v.drag(middle(again.free), 60, 0);
      await v.rest();
      await atRest(page);
      const nudged = await v.see();
      const kept = await how(page);
      const part = await partOnScreen(page, place.part);
      check('a small turn keeps the rings, and they stay on their part as it turns', turnBetween(nudged.azimuth, again.azimuth) > 5 && turnBetween(nudged.azimuth, again.azimuth) < 60 && kept.ringsShown && !kept.marks.away && !kept.awayFlag && kept.rings.length === shown.rings.length && kept.rings.every((ring) => within(middle(ring), part, 2)), `turned ${round(turnBetween(nudged.azimuth, again.azimuth), 1)}°, shown ${kept.ringsShown}`);
    });
  }

  await step('Taken apart before, another machine after', async () => {
    await v.go(`#/${guided}`);
    await v.rest();
    await page.focus('#panel [data-explode]');
    await page.keyboard.press('End');
    await v.rest();
    const apart = await v.item(guided);
    await v.press('#panel [data-howto]');
    await v.rest();
    const together = await v.item(guided);
    check('a machine that was taken apart is put together when its guides are opened: they show it whole', apart.apart === 1 && together.apart === 0, `apart ${apart.apart} → ${together.apart}`);
    await page.keyboard.press('Escape');
    await v.rest();
    check("back on its own page the slider is at 0, as the machine is", (await page.$eval('#panel [data-explode]', (input) => input.value).catch(() => null)) === '0');
    // A step that has the machine otherwise than it stands in the lab, if the guide has one.
    const pick = bare >= 0 ? bare : Math.max(changed, 0);
    await v.go(hashOf(guide, pick));
    await v.rest();
    const dressed = await how(page);
    await v.go(`#/${other}`);
    await v.rest();
    await atRest(page);
    const left = await v.item(guided);
    const rings = await page.evaluate(() => document.querySelectorAll('.marker-layer .marker').length);
    check(
      `leaving step ${pick + 1} for another machine: the one with the guide ${asInTheLab} again, and no ring is left behind`,
      (dressed.lid !== rest || dressed.without.length > 0 || (bare < 0 && changed < 0)) && left.open === rest && left.without.length === 0 && left.tier === 'lite' && rings === 0,
      `before: lid ${dressed.lid}, without [${dressed.without}]; after: lid ${left.open}, without [${left.without}], ${left.tier}, ${rings} rings`,
    );
    await checkMachineInView(v, other);
  });

  if (whole) await step('Addresses that do not quite exist', async () => {
    const tries = [
      [`#/${guided}/how-to/no-such-guide`, `#/${guided}/how-to`, 'a guide that does not exist opens the list of the guides'],
      [`#/${guided}/how-to/${guide.id}/${total + 50}`, hashOf(guide, total - 1), 'a step past the end opens the last step'],
      [`#/${guided}/how-to/${guide.id}/x`, hashOf(guide, 0), 'a step that is not a number opens the first'],
      [`#/${guided}/how-to/${guide.id}/1`, hashOf(guide, 0), 'the first step is written without its number'],
    ];
    if (UNGUIDED) tries.push([`#/${UNGUIDED}/how-to`, `#/${UNGUIDED}`, "the guides of a machine that has none open the machine's own page"]);
    for (const [typed, shown, what] of tries) {
      await v.go(typed);
      await v.rest();
      const s = await v.see();
      check(`${what}, and the address is put right`, s.hash === shown, `${typed} → ${s.hash}`);
    }
  });

  noProblems(desk.problems);
  await page.close();

  // ── On a phone ─────────────────────────────────────────────────────────────
  const hand = await open(browser, { width: 390, height: 844, dpr: 2, touch: true, storage: WELCOMED });
  const p = hand.page;
  const t = visitor(p, { touch: true });
  await step('On a phone: one step at a time', async () => {
    await t.go(`#/${guided}`);
    await t.rest();
    const own = await t.see();
    await checkOnPhone(p, "the machine's own sheet, with the card");
    await t.press('#panel [data-howto]');
    await t.rest();
    const list = await how(p);
    check('a tap on the card opens the list of the guides', list.page === 'list' && list.rows.length === guides.length, `${list.page}, ${list.rows.length} rows`);
    await checkOnPhone(p, 'the list of the guides');
    await t.press(`#panel .howto-guides [data-howto-guide="${guide.id}"]`);
    await t.rest();
    const seen = await walk(p, t, guide);
    checkWalk(seen, guide, { name, margin: VIEWS.step.padding });
    const off = (holds, say) => seen.filter((at) => !holds(at)).map((at) => `step ${at.n}: ${say(at)}`);
    let wrong = off((at) => at.h.listed === 1 && at.h.total === total, (at) => `${at.h.listed} steps on the sheet`);
    check(`the sheet holds one step at a time: the open one, of ${total}`, wrong.length === 0, tell(wrong));
    wrong = off((at) => at.h.heading.toLowerCase() === guide.title.toLowerCase() && !at.h.nameShown && at.h.back.length > 0, (at) => `heading "${at.h.heading}", machine's name shown: ${at.h.nameShown}`);
    check("over it: the way back, the step's number, and the guide's name; the machine's name is left out", wrong.length === 0, tell(wrong));
    const first = seen[0].h.sheet;
    wrong = off((at) => near(at.h.sheet.top, first.top, 0.5) && near(at.h.sheet.height, first.height, 0.5), (at) => `sheet from ${round(at.h.sheet.top, 1)}`);
    check('the sheet has one height for every step, so the machine does not jump about', wrong.length === 0, tell(wrong));
    const left = (first.top - own.stage.top) / own.stage.height;
    check("it is taller than the machine's own sheet, to fit a step, and leaves the machine two fifths of the picture's height all the same", first.height > own.panelRect.height + 20 && left >= 0.4, `${Math.round(first.height)} px against ${Math.round(own.panelRect.height)} px; ${Math.round(left * 100)}% of the picture is left above it`);
    wrong = off(
      (at) => at.h.nextRect && at.h.bar && at.h.nextRect.bottom <= at.h.sheet.bottom + 0.5 && at.h.nextRect.top >= at.h.sheet.top && (at.n === 1 ? at.h.backRect === null : at.h.backRect && at.h.backRect.bottom <= at.h.sheet.bottom + 0.5) && at.h.nextRect.height >= 40,
      (at) => `"Next" ${at.h.nextRect ? box(at.h.nextRect) : 'missing'}, sheet ${box(at.h.sheet)}`,
    );
    check('"Back" and "Next" are in reach at every step without scrolling, and tall enough for a finger', wrong.length === 0, tell(wrong));
    wrong = off((at) => near(at.h.bar.bottom, at.h.sheet.bottom, 2) && near(at.h.nextRect.top, seen[0].h.nextRect.top, 0.5), (at) => `"Next" starts at ${round(at.h.nextRect.top, 1)}, the bar ends at ${round(at.h.bar.bottom, 1)}, the sheet at ${round(at.h.sheet.bottom, 1)}`);
    check('and they stay at the bottom edge of the sheet however short the step is: "Next" is where the last "Next" was', wrong.length === 0, tell(wrong));
    wrong = off((at) => at.h.scrolled === 0 && at.h.open && at.h.open.rect.top >= at.h.sheet.top && at.h.open.rect.bottom <= at.h.bar.top + 14, (at) => `scrolled ${at.h.scrolled}, text ends ${Math.round(at.h.open?.rect.bottom)}, bar starts ${Math.round(at.h.bar?.top)}`);
    check('every step starts at its first line and can be read whole without scrolling', wrong.length === 0, tell(wrong));
    await checkOnPhone(p, 'the last step of a guide');
    await t.go(hashOf(guide, longest));
    await t.rest();
    await checkOnPhone(p, 'the step with the most words');
  });

  for (const entry of guides.slice(1)) {
    await step(`On a phone: the guide "${entry.title}"`, async () => {
      const count = entry.steps.length;
      await t.go(`#/${guided}/how-to`);
      await t.rest();
      await t.press(`#panel .howto-guides [data-howto-guide="${entry.id}"]`);
      await t.rest();
      const seen = await walk(p, t, entry);
      checkWalk(seen, entry, { name, margin: VIEWS.step.padding });
      const off = (holds, say) => seen.filter((at) => !holds(at)).map((at) => `step ${at.n}: ${say(at)}`);
      let wrong = off((at) => at.h.listed === 1 && at.h.total === count && at.h.heading.toLowerCase() === entry.title.toLowerCase(), (at) => `${at.h.listed} steps on the sheet, heading "${at.h.heading}"`);
      check(`the sheet holds one step at a time, of ${count}, under the guide's name`, wrong.length === 0, tell(wrong));
      wrong = off(
        (at) => at.h.nextRect && at.h.nextRect.bottom <= at.h.sheet.bottom + 0.5 && at.h.scrolled === 0 && at.h.open && at.h.open.rect.top >= at.h.sheet.top && at.h.open.rect.bottom <= at.h.bar.top + 14,
        (at) => `scrolled ${at.h.scrolled}, text ends ${Math.round(at.h.open?.rect.bottom)}, bar starts ${Math.round(at.h.bar?.top)}`,
      );
      check('every step starts at its first line and can be read whole without scrolling, with "Next" in reach', wrong.length === 0, tell(wrong));
      const most = entry.steps.reduce((best, one, index) => (one.text.length > entry.steps[best].text.length ? index : best), 0);
      await t.go(hashOf(entry, most));
      await t.rest();
      await checkOnPhone(p, 'its step with the most words');
    });
  }

  const resize = async (width, height) => {
    await p.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await frames(p, 3);
    await t.rest();
  };
  const smaller = [
    [360, 640],
    [320, 568],
  ];
  for (const [width, height] of whole ? smaller : []) {
    await step(`A smaller phone, ${width} × ${height}`, async () => {
      await resize(width, height);
      const tried = [...new Set([longest, sided >= 0 ? sided : 0, total - 1])];
      let readOn = false;
      for (const index of tried) {
        await t.go(hashOf(guide, index));
        await t.rest();
        await atRest(p);
        const s = await t.see();
        const h = await how(p);
        const place = placeOf(steps[index]);
        const part = place ? await partOnScreen(p, place.part) : null;
        const fits = h.open.rect.bottom <= h.bar.top + 14;
        check(
          `step ${index + 1}: its title and "Back · Next" are in view at once${fits ? ', and so is all of its text' : '; its text is longer than the sheet and scrolls'}`,
          h.scrolled === 0 && h.open.titleRect.top >= h.sheet.top && h.open.titleRect.bottom <= h.bar.top && h.nextRect.bottom <= h.sheet.bottom + 0.5 && h.nextRect.right <= width && (fits || h.scrolls > 0),
          `title ${box(h.open.titleRect)}, "Next" ${box(h.nextRect)}, sheet ${box(h.sheet)}`,
        );
        if (place) check(`step ${index + 1}: its rings are on their part, in the picture above the sheet`, h.rings.length === ringsOf(place) && h.ringsShown && h.rings.every((ring) => within(middle(ring), s.free) && within(middle(ring), part, 2)), `${h.rings.length} rings, free ${box(s.free)}`);
        await checkOnPhone(p, `at ${width} px, step ${index + 1}`, { bar: width > 320 });
        if (!fits && index < total - 1 && !readOn) {
          // Read to the end of a long step, then on: the next one starts at its first line, not where the last one was left.
          readOn = true;
          await p.evaluate(() => {
            const sheet = document.getElementById('panel');
            sheet.scrollTop = sheet.scrollHeight;
          });
          await frames(p, 2);
          const read = await how(p);
          await t.press('#panel [data-focus="next"]');
          await t.rest();
          const next = await how(p);
          check(
            `step ${index + 1} read to its end, then "Next": step ${index + 2} starts at its first line`,
            read.scrolled > 0 && next.state.step === index + 1 && next.scrolled === 0 && next.open.titleRect.top >= next.sheet.top && next.open.titleRect.bottom <= next.bar.top,
            `scrolled ${read.scrolled} before, ${next.scrolled} after`,
          );
        }
      }
      await t.go(`#/${guided}/how-to`);
      await t.rest();
      await checkOnPhone(p, `at ${width} px, the list of the guides`, { bar: width > 320 });
      await t.go(`#/${guided}`);
      await t.rest();
      const card = await p.evaluate(() => {
        const element = document.querySelector('#panel [data-howto]');
        const r = element.getBoundingClientRect();
        const sheet = document.getElementById('panel').getBoundingClientRect();
        return { left: r.left - sheet.left, right: sheet.right - r.right, height: r.height, oneLine: [...element.querySelectorAll('strong, small')].every((line) => line.getClientRects().length === 1) };
      });
      check('the card keeps inside the sheet, each of its two lines on one line', card.left >= 0 && card.right >= 0 && card.oneLine && card.height >= 44, JSON.stringify(card));
    });
  }
  noProblems(hand.problems);
  await p.close();

  // ── With reduced motion ────────────────────────────────────────────────────
  if (whole && swings > 0) {
    const to = steps[swings].open ? 1 : 0;
    const calm = await open(browser, { width: 1280, height: 800, reducedMotion: true, storage: WELCOMED });
    const c = visitor(calm.page);
    await step('With reduced motion a step is simply there', async () => {
      await c.go(hashOf(guide, swings - 1));
      await c.rest();
      const before = await c.see();
      await c.press('#panel [data-focus="next"]');
      const atOnce = await c.see();
      const lid = (await c.item(guided)).open;
      await c.rest();
      await atRest(calm.page);
      const settled = await c.see();
      const h = await how(calm.page);
      const place = placeOf(steps[swings]);
      const from = placeOf(steps[swings - 1]);
      // Two steps on one keypad share one view: the camera then has nowhere to go, and is there at once all the same.
      const sameView = Boolean(place && from) && place.part === from.part && same(place.from, from.from) && typeof place.show === 'string' && place.show === from.show;
      check(
        `step ${swings + 1}: the lid is ${to ? 'open' : 'shut'} and the camera at the part at once, with nothing on its way`,
        lid === to && !atOnce.busy && near(atOnce.azimuth, settled.azimuth, 1e-9) && near(atOnce.distance, settled.distance, 1e-9) && (!place || sameView || turnBetween(before.azimuth, atOnce.azimuth) > 1 || near(before.distance, atOnce.distance, 1e-9) === false),
        `lid ${lid}, busy ${atOnce.busy}`,
      );
      check('its rings are in place', h.rings.length === (place ? ringsOf(place) : 0) && (h.rings.length === 0 || h.ringsShown), `${h.rings.length} rings`);
    });
    noProblems(calm.problems);
    await calm.page.close();
  }

  // ── By a link ──────────────────────────────────────────────────────────────
  // Somebody is sent a link to a step. The tour opens on it, before the
  // machine's model has arrived: the step has to be put right when it does.
  const linkTo = bare >= 0 ? bare : Math.max(changed, 0);
  const linked = await open(browser, { width: 1280, height: 800, forget: true, hash: hashOf(guide, linkTo) });
  const w = visitor(linked.page);
  await step('Arriving by a link to a step', async () => {
    await w.rest();
    await atRest(linked.page);
    const s = await w.see();
    const h = await how(linked.page);
    const linkedStep = steps[linkTo];
    const place = placeOf(linkedStep);
    check(`the tour opens on step ${linkTo + 1} of the guide, with no welcome guide in the way`, s.hash === hashOf(guide, linkTo) && s.place === guided && h.page === 'guide' && h.state?.step === linkTo && h.count === `Step ${linkTo + 1} of ${total}` && !s.guide, `${s.hash}, "${h.count}", welcome guide open: ${s.guide}`);
    check(
      'the machine is shown as that step has it, though its model arrived after the page',
      h.tier === 'hero' && h.lid === (linkedStep.open ? 1 : 0) && same(sorted(h.without), sorted(linkedStep.without ?? [])),
      `${h.tier}, lid ${h.lid}, without [${h.without}]`,
    );
    if (place) {
      const framed = await placeOnScreen(linked.page, place);
      check(
        'the camera is at the part and the rings are on it',
        near(s.elevation, place.from[1], 0.5) && h.rings.length === ringsOf(place) && h.ringsShown && Boolean(framed) && h.rings.every((ring, index) => Math.hypot(middle(ring).x - framed.spots[index].x, middle(ring).y - framed.spots[index].y) <= 1.5),
        `${round(s.elevation, 1)}° up (wanted ${place.from[1]}°), ${h.rings.length} rings, shown ${h.ringsShown}`,
      );
    }
    check('the open step is in view in the list, between the head and "Back · Next"', h.open && h.head && h.bar && h.open.rect.top >= h.head.bottom - 14 && h.open.rect.bottom <= h.bar.top + 14, `step ${Math.round(h.open?.rect.top)} → ${Math.round(h.open?.rect.bottom)}, head ends ${Math.round(h.head?.bottom)}, bar starts ${Math.round(h.bar?.top)}`);
    await linked.page.keyboard.press('Escape');
    await w.rest();
    const list = await w.see();
    check('Escape leads to the list of the guides', list.hash === `#/${guided}/how-to` && (await how(linked.page)).page === 'list', list.hash);
    await linked.page.keyboard.press('Escape');
    await w.rest();
    await atRest(linked.page);
    const after = await how(linked.page);
    check(`and again to the machine's own page: ${rest ? 'open as it stands in the lab' : 'shut'}, whole, with nothing marked`, after.page === null && after.lid === rest && after.without.length === 0 && after.rings.length === 0, `${after.page}, lid ${after.lid}, ${after.rings.length} rings`);
    await checkMachineInView(w, guided);
  });
  noProblems(linked.problems);
  await linked.page.close();
  return facts.items;
}

// ── An older browser ─────────────────────────────────────────────────────────
// The resin printer draws its touch screen with ctx.roundRect(). The tour runs
// from Chrome 89 and Firefox 108 on; roundRect() came with Chrome 99 and Firefox
// 112. assets/registry.js fills the gap for the versions between; without that
// the printer would stay a plain volume there.
async function olderBrowser(browser) {
  current = 'older';
  console.log('\nOlder browser — one that cannot draw rounded rectangles');
  const { page, problems, state } = await open(browser, {
    width: 1280,
    height: 800,
    storage: WELCOMED,
    query: `q=${quality}`,
    hash: `#/${PRINTER}`,
    init: () => {
      delete CanvasRenderingContext2D.prototype.roundRect;
    },
  });
  const v = visitor(page);
  await step('The resin printer still gets its model', async () => {
    const own = await page.evaluate(() => {
      const fn = CanvasRenderingContext2D.prototype.roundRect;
      return { there: typeof fn === 'function', native: typeof fn === 'function' && /\[native code\]/.test(Function.prototype.toString.call(fn)) };
    });
    check("the browser's own roundRect() is gone and the tour's stands in", own.there && !own.native, JSON.stringify(own));
    check('every model loaded', state === 'ready', state);
    const entry = await v.item(PRINTER);
    check("the printer's detailed model is the one on show", entry.status === 'built' && entry.tier === 'hero' && entry.modelState === 'ready', `${entry.status}, ${entry.tier}, ${entry.modelState}`);
  });
  noProblems(problems);
  await page.close();
}

// ── Run ──────────────────────────────────────────────────────────────────────
const VISITORS = { desktop, phone, first: firstVisit, reduced: reducedMotion, entrance, howto: howTo, older: olderBrowser };
const started = Date.now();
const browser = await launchBrowser();
try {
  for (const [name, run] of Object.entries(VISITORS)) {
    if (only && !only.includes(name)) continue;
    try {
      await run(browser);
    } catch (error) {
      failures.push(`${name} › could not run: ${error.message}`);
      console.log(`  ✗ could not run: ${error.message}`);
    }
  }
} finally {
  await browser.close();
}

const seconds = Math.round((Date.now() - started) / 1000);
if (failures.length) {
  console.log(`\nFAILED: ${failures.length} of ${checks} checks (${seconds} s)`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`\nAll ${checks} checks passed (${seconds} s).`);
