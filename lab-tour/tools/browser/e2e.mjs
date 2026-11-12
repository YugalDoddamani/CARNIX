// npm run e2e — a visitor's walk through the tour, checked step by step in a
// real (headless) browser. Four visitors:
//
//   desktop   a wide window and a mouse
//   phone     a 390 × 844 phone and a finger
//   first     somebody who has never been here (the welcome guide)
//   reduced   somebody who has asked their device for less motion
//
//   node tools/browser/e2e.mjs [--only=desktop,phone] [--base=http://127.0.0.1:4173/]
//        [--q=low] [--verbose]
//
// The tour must be running (npm run serve) and a headless browser installed
// (see lib.mjs). Everything is done the way a visitor does it: real clicks and
// taps at the place where the thing is on screen, real drags, real key presses.
// Exit code 1 if any check fails.
//
// What this cannot tell: how fast the tour runs on a real phone, and how it
// looks. For looks there are shots.mjs and film.mjs.
import { SPOTLIGHT, VIEWS } from '../../js/shell/layout.js';
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
const roomOf = (id) => id.split('/')[0];

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
    check('the whole lab costs no more than the drawing budget', s.calls > 0 && s.calls <= 400, `${s.calls} draw calls`);
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
    check('the hint says how to turn and zoom with a mouse', s.hint && /drag to turn/i.test(s.hintText) && /scroll to zoom/i.test(s.hintText), `shown ${s.hint}: "${s.hintText}"`);
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
  const { page, problems, state } = await open(browser, { width: 390, height: 844, dpr: 2, touch: true, storage: WELCOMED });
  const v = visitor(page, { touch: true });
  const facts = await page.evaluate(() => ({ route: window.labTour.route, items: window.labTour.items() }));
  const { route } = facts;
  const room = roomOf(MACHINE);

  await step('The lab opens', async () => {
    const s = await v.see();
    check('every model loaded', state === 'ready', state);
    check('the navigation bar is a tab bar across the bottom edge', near(s.dockRect.bottom, s.window.height, 1) && near(s.dockRect.left, 0, 1) && near(s.dockRect.width, s.window.width, 1), `bar ${box(s.dockRect)} in ${s.window.width} × ${s.window.height}`);
    check('the panel is a sheet between the lab and the bar', s.panelRect.top > s.stage.top + s.stage.height * 0.3 && s.panelRect.bottom <= s.dockRect.top + 1 && near(s.panelRect.width, s.window.width, 20), `sheet ${box(s.panelRect)}`);
    check('nothing is wider than the screen', (await page.evaluate(() => document.documentElement.scrollWidth)) <= s.window.width, `${await page.evaluate(() => document.documentElement.scrollWidth)} px`);
    const stops = await page.$$eval('.dock__item', (buttons) => buttons.map((button) => ({ id: button.dataset.id, ...button.getBoundingClientRect().toJSON() })));
    check('all seven stops are on screen and big enough for a finger', stops.length === route.length + 1 && stops.every((stop) => stop.left >= -0.5 && stop.right <= s.window.width + 0.5 && stop.height >= 44 && stop.width >= 44), stops.map((stop) => `${stop.id} ${Math.round(stop.width)}×${Math.round(stop.height)}`).join(', '));
    for (const id of route) {
      const where = await v.whereIs(id);
      check(`room "${id}" is in view above the sheet`, inside(where, s.free, 2), `room ${box(where)}, free ${box(s.free)}`);
    }
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
    check('the hint speaks of fingers, not of a mouse', s.hint && /pinch to zoom/i.test(s.hintText), `shown ${s.hint}: "${s.hintText}"`);
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

  noProblems(problems);
  await page.close();
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

// ── Run ──────────────────────────────────────────────────────────────────────
const VISITORS = { desktop, phone, first: firstVisit, reduced: reducedMotion };
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
