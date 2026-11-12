// Shared plumbing for the browser checks in this folder (e2e.mjs, shots.mjs,
// film.mjs).
//
// They drive the tour in a real, headless Chromium. That browser is NOT part of
// the repository. Install it once, anywhere outside the repo, and say where:
//
//   mkdir -p /tmp/lab-tour-browser && cd /tmp/lab-tour-browser
//   npm init -y && npm install puppeteer-core @sparticuz/chromium
//   export LAB_TOUR_BROWSER=/tmp/lab-tour-browser      (this path is the default)
//
// The browser draws 3D in software: a frame of the lab can take seconds, so its
// speed says nothing about a real phone. The checks therefore never wait for
// the tour's animations in real time. They stop the tour's clock (`holdClock`)
// and move it by hand (`pass`): the same result on any machine, and quick,
// because time can pass without every frame being drawn.
// (The opening, where the lab comes up part by part, is the browser's own
// fading of page elements and runs on the browser's clock. `openTour` waits
// until it is over; to look INSIDE it, open with `intro=hold` and move it with
// `labTour.motion.seek(ms)`.)
// What this proves is behaviour: what is on screen, what a tap does, that
// nothing throws.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BROWSER_DIR = process.env.LAB_TOUR_BROWSER || '/tmp/lab-tour-browser';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function launchBrowser() {
  let puppeteer;
  let chromium;
  try {
    puppeteer = createRequire(path.join(BROWSER_DIR, 'index.js'))('puppeteer-core');
    // The packaged Chromium only unpacks its own system libraries when it
    // believes it is running in the environment it was built for.
    process.env.AWS_EXECUTION_ENV ??= 'AWS_Lambda_nodejs22.x';
    ({ default: chromium } = await import(pathToFileURL(path.join(BROWSER_DIR, 'node_modules/@sparticuz/chromium/build/index.js')).href));
  } catch (error) {
    throw new Error(`No headless browser found in ${BROWSER_DIR}. See the top of tools/browser/lib.mjs for the one-time install.\n(${error.message})`);
  }
  return puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: 'shell' });
}

/**
 * Open the tour and wait until it has finished loading.
 * options: { width, height, dpr, touch, reducedMotion, query, hash, storage, forget, until }
 *   storage   localStorage entries to set before the page starts, e.g.
 *             { 'lab-tour:welcomed': '1' } for a returning visitor
 *   forget    true for a first-time visitor: whatever earlier pages of this
 *             browser remembered is wiped first. (A private window would be the
 *             obvious way, but the packaged Chromium cannot open one.)
 *   until     'ready' (default): every model is in and the opening is over.
 *             'started': the tour's script has run; the lab may still be coming
 *             up. With `query: 'intro=hold'` the opening stands still at its
 *             first moment until `labTour.motion.release()`.
 * Returns { page, problems, state, loadMs } — `problems` collects console
 * errors and warnings, page errors and failed requests as they happen.
 */
export async function openTour(browser, baseUrl, options = {}) {
  const { width = 1280, height = 800, dpr = 1, touch = false, reducedMotion = false, query = '', hash = '', storage = null, forget = false, until = 'ready', init = null } = options;
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: dpr, isMobile: touch, hasTouch: touch });
  if (reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (storage) {
    await page.evaluateOnNewDocument((entries) => {
      for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    }, storage);
  }
  // `init` runs in the page before any of its own scripts (to take a browser feature away, for example).
  if (init) await page.evaluateOnNewDocument(init);
  const problems = [];
  page.on('console', (message) => {
    // console.warn() is 'warn' to newer versions of Puppeteer and 'warning' to older ones.
    const type = message.type() === 'warning' ? 'warn' : message.type();
    if (type !== 'error' && type !== 'warn') return;
    // Not the tour's doing: the graphics driver remarks that the picture was
    // read back, which only the checks do (to compare pictures).
    if (/GPU stall due to ReadPixels/.test(message.text())) return;
    problems.push(`console.${type}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`request failed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  if (forget) {
    // Any small file of the same site will do: storage belongs to the site.
    await page.goto(new URL('css/tour.css', baseUrl).href, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => localStorage.clear());
  }

  const url = `${baseUrl}${query ? `?${query}` : ''}${hash}`;
  const started = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  if (until === 'started') await page.waitForFunction(() => Boolean(window.labTour) || document.documentElement.dataset.tour === 'failed', { timeout: 180000, polling: 50 });
  else await waitReady(page);
  const state = await page.evaluate(() => document.documentElement.dataset.tour);
  return { page, problems, state, loadMs: Date.now() - started };
}

/**
 * Wait until the tour has loaded every model (or given up) and nothing is
 * arriving any more: the opening is over and the last model has faded in.
 * Those fades run on the browser's clock, not the tour's, so they cannot be
 * stepped by hand (see `pass`); the checks start once they are done.
 */
export function waitReady(page) {
  return page.waitForFunction(
    () => {
      const tour = document.documentElement.dataset.tour || '';
      return /^failed/.test(tour) || (/^ready/.test(tour) && !window.labTour.motion.busy);
    },
    { timeout: 180000, polling: 250 },
  );
}

/** Stop the tour's own clock. From here on its animations move only when `pass` says so. */
export function holdClock(page) {
  return page.evaluate(() => window.labTour.stage.clock.pause());
}

/**
 * Let tour time pass, then draw one frame. Needs the clock held.
 *   pass(page, 0.4)   exactly 0.4 seconds
 *   pass(page)        as long as it takes for everything to come to rest: the
 *                     camera has arrived, the fade has finished, and a turn
 *                     the visitor gave the camera has run out
 * Returns the seconds of tour time that passed.
 */
export function pass(page, seconds = null) {
  return page.evaluate((wanted) => {
    const tour = window.labTour;
    const step = 1 / 60;
    const quiet = { draw: false };
    const where = () => {
      const pose = tour.rig.pose;
      return [pose.azimuth, pose.elevation, pose.distance, pose.target.x, pose.target.y, pose.target.z];
    };
    let elapsed = 0;
    if (wanted !== null) {
      while (elapsed < wanted - 1e-9) {
        const dt = Math.min(step, wanted - elapsed);
        tour.stage.clock.step(dt, quiet);
        elapsed += dt;
      }
    } else {
      let last = where();
      let still = 0;
      while (elapsed < 30 && still < 12) {
        tour.stage.clock.step(step, quiet);
        elapsed += step;
        const now = where();
        const moved = now.some((value, index) => Math.abs(value - last[index]) > 1e-5);
        last = now;
        still = tour.busy || moved ? 0 : still + 1;
      }
    }
    tour.stage.clock.step(0); // draw what all that came to
    return elapsed;
  }, seconds);
}

/** Go somewhere by its address ('#/ceramic/upcera-a7-plus'), as a link would, and let everything come to rest. */
export async function go(page, hash) {
  await page.evaluate(
    (to) =>
      new Promise((resolve) => {
        if (location.hash === to) return resolve();
        // The tour listens for the same event and was there first, so it has
        // already reacted by the time this resolves.
        addEventListener('hashchange', () => resolve(), { once: true });
        location.hash = to;
      }),
    hash,
  );
  return pass(page);
}

/** Wait for the browser to have shown `count` more frames (for the interface's own, real-time animations). */
export function frames(page, count = 2) {
  return page.evaluate(
    (wanted) =>
      new Promise((resolve) => {
        const next = (left) => (left > 0 ? requestAnimationFrame(() => next(left - 1)) : resolve());
        next(wanted);
      }),
    count,
  );
}

export function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (const arg of argv) {
    const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (match) flags[match[1]] = match[2] ?? true;
    else rest.push(arg);
  }
  return { flags, rest };
}
