// A journey in stills: go from one place to another and save a frame for every
// tenth of a second of the journey. For looking at what happens BETWEEN two
// places — the camera's path, the surroundings fading.
//
//   node tools/browser/film.mjs <outDir> --from=#/ceramic --to=#/ceramic/zubler-vario-200
//        [--step=0.1] [--max=20] [--turn=120] [--size=1280x800] [--touch] [--q=low]
//        [--base=http://127.0.0.1:4173/]
//
//   --turn=120   before leaving, drag 120 px sideways across what is shown (a
//                visitor turning a machine), to see how the journey starts
//                from a turned view
//
// The tour's clock is stopped and moved by hand, so the frames are the same on
// every computer however slowly it draws.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { go, holdClock, launchBrowser, openTour, parseArgs, pass } from './lib.mjs';

const { flags, rest } = parseArgs(process.argv.slice(2));
const [outDir] = rest;
if (!outDir || !flags.to) {
  console.error('usage: node tools/browser/film.mjs <outDir> --from=#/room --to=#/room/machine [--step=0.1] [--turn=120]');
  process.exit(2);
}
const base = flags.base || 'http://127.0.0.1:4173/';
const [width, height] = String(flags.size || '1280x800').split('x').map(Number);
const step = Number(flags.step || 0.1);
const max = Number(flags.max || 20);
await mkdir(outDir, { recursive: true });

const browser = await launchBrowser();
try {
  const { page, problems } = await openTour(browser, base, {
    width,
    height,
    touch: Boolean(flags.touch),
    dpr: flags.touch ? 2 : 1,
    query: flags.q ? `q=${flags.q}` : '',
    storage: { 'lab-tour:welcomed': '1' },
  });
  await holdClock(page);
  await go(page, flags.from || '#/');

  if (flags.turn) {
    const stage = await page.evaluate(() => {
      const rect = document.getElementById('stage').getBoundingClientRect();
      const { right, top, bottom } = window.labTour.insets;
      return { x: rect.left + (rect.width - right) / 2, y: rect.top + top + (rect.height - top - bottom) / 2 };
    });
    const distance = Number(flags.turn);
    if (flags.touch) {
      const finger = await page.touchscreen.touchStart(stage.x, stage.y);
      for (let moved = 10; moved <= Math.abs(distance); moved += 10) await finger.move(stage.x - Math.sign(distance) * moved, stage.y);
      await finger.end();
    } else {
      await page.mouse.move(stage.x, stage.y);
      await page.mouse.down();
      await page.mouse.move(stage.x - distance, stage.y, { steps: Math.max(2, Math.round(Math.abs(distance) / 10)) });
      await page.mouse.up();
    }
    await pass(page);
    await page.screenshot({ path: path.join(outDir, 'turned.png') });
  }

  await page.evaluate((to) => {
    location.hash = to;
  }, flags.to);
  await page.waitForFunction(() => window.labTour.busy, { timeout: 5000 }).catch(() => {});
  for (let index = 0; index <= max; index++) {
    const now = await page.evaluate((dt) => {
      const tour = window.labTour;
      tour.stage.clock.step(dt);
      const spot = tour.stage.spotlightState;
      return { busy: tour.busy, veil: Number(spot.veil.toFixed(2)), lit: spot.key, roomCameraLag: Number(tour.rig.lag.toFixed(1)) };
    }, index === 0 ? 0 : step);
    const file = path.join(outDir, `frame-${String(index).padStart(2, '0')}.png`);
    await page.screenshot({ path: file });
    console.log(`${file}  t=${(index * step).toFixed(1)}s  ${JSON.stringify(now)}`);
    if (!now.busy && index > 0) break;
  }
  console.log(problems.length ? `PROBLEMS:\n  ${problems.join('\n  ')}` : '(no console output)');
} finally {
  await browser.close();
}
