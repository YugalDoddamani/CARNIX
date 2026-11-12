// Screenshots of the tour, for looking at.
//
//   node tools/browser/shots.mjs <outDir> [--base=http://127.0.0.1:4173/] [--size=1280x800]
//        [--dpr=1] [--touch] [--motion] [--q=low|medium|high] [--fresh]  name=#/hash …
//
// Each `name=#/hash` opens that address and saves <outDir>/<name>.png.
// Add `~<javascript>` to run something in the page first, for example
//   'features=#/design/3shape-e4~labTour.panel.selectTab("features")'
//   --motion  leave the interface's own animations on (default: reduced motion,
//             so nothing is caught half-way)
//   --fresh   behave like a first-time visitor (shows the welcome guide)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { go, holdClock, launchBrowser, openTour, parseArgs, pass, sleep } from './lib.mjs';

const { flags, rest } = parseArgs(process.argv.slice(2));
const [outDir, ...shots] = rest;
if (!outDir || !shots.length) {
  console.error('usage: node tools/browser/shots.mjs <outDir> [--size=1280x800] [--touch] name=#/hash …');
  process.exit(2);
}
const base = flags.base || 'http://127.0.0.1:4173/';
const [width, height] = String(flags.size || '1280x800').split('x').map(Number);
await mkdir(outDir, { recursive: true });

const browser = await launchBrowser();
let failed = false;
try {
  const { page, problems, state, loadMs } = await openTour(browser, base, {
    width,
    height,
    dpr: Number(flags.dpr || 1),
    touch: Boolean(flags.touch),
    reducedMotion: !flags.motion,
    query: flags.q ? `q=${flags.q}` : '',
    storage: flags.fresh ? null : { 'lab-tour:welcomed': '1' },
  });
  console.log(`tour "${state}" after ${loadMs} ms`);
  await holdClock(page);
  for (const shot of shots) {
    const [target, script] = shot.split('~');
    const [name, hash = '#/'] = target.split('=');
    await go(page, hash);
    if (script) {
      await page.evaluate(script);
      await pass(page);
    }
    await sleep(flags.motion ? 900 : 300); // the interface's own little animations run in real time
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    const info = await page.evaluate(() => ({ state: window.labTour.state, info: window.labTour.renderInfo() }));
    console.log(`shot ${file}  ${JSON.stringify(info)}`);
  }
  if (problems.length) {
    failed = true;
    console.log(`PROBLEMS:\n  ${problems.join('\n  ')}`);
  } else {
    console.log('(no console output)');
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
