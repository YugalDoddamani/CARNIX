#!/usr/bin/env node
// Imports a single-file "Dental Lab Equipment Asset Library" HTML export into
// ES modules the tour can lazy-load, and measures every asset on the way in.
//
//   node tools/import-asset-library.mjs <path/to/Asset_Library.html>
//
// For every <script id="component-…"> that registers assets it writes
//   js/assets/legacy/<name>.js   the component source, byte for byte, in a module wrapper
// and finally
//   js/assets/legacy/manifest.js names, datasheet sizes, MEASURED sizes and draw cost
//
// Viewer-only components (scene setup, UI controller, the inlined three.js) are
// skipped. Nothing in the original geometry code is rewritten, so re-running
// this on a newer export of the library is always safe.
import './lib/node-env.mjs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '../js/assets/legacy');
const GENERATED_MARK = '// GENERATED FILE — do not edit.';
const BEGIN_MARK = '// ── BEGIN original source ────────────────────────────────────────────────────';
const END_MARK = '// ── END original source ──────────────────────────────────────────────────────';

// The only properties a component may touch on `window` and still be imported.
const ALLOWED_WINDOW_PROPS = /^(DentalAssetLibrary|__THREE_BUNDLE__|__register[A-Za-z0-9_$]*)$/;

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const inputArg = process.argv[2];
if (!inputArg) fail('Usage: node tools/import-asset-library.mjs <path/to/Asset_Library.html>');
const inputPath = path.resolve(process.cwd(), inputArg);
const html = await readFile(inputPath, 'utf8').catch(() => fail(`Cannot read ${inputPath}`));
const sourceName = path.basename(inputPath);

// ── 1. Find the components ───────────────────────────────────────────────────
const components = [];
const skipped = [];
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  const id = /\bid="([^"]+)"/.exec(match[1])?.[1];
  if (!id || !id.startsWith('component-')) continue;
  const body = match[2];
  const registerFns = [...body.matchAll(/window\.(__register[A-Za-z0-9_$]+)\s*=\s*function/g)].map((m) => m[1]);
  const windowProps = [...new Set([...body.matchAll(/\bwindow\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((m) => m[1]))];
  const foreign = windowProps.filter((prop) => !ALLOWED_WINDOW_PROPS.test(prop));
  const registersContent = /DentalAssetLibrary\.assets\[|DentalAssetLibrary\.LabWorkbench\s*=/.test(body);

  if (registerFns.length === 0 || !registersContent) {
    skipped.push({ id, reason: 'does not register assets (viewer code)' });
  } else if (foreign.length > 0) {
    skipped.push({ id, reason: `uses browser window state: ${foreign.join(', ')}` });
  } else {
    const name = id.replace(/^component-\d+-/, '').replace(/^asset-/, '');
    components.push({ id, name, file: `${name}.js`, body, registerFns, sha: sha256(body) });
  }
}
if (components.length === 0) fail(`No importable asset components found in ${sourceName}`);

// ── 2. Write one module per component ────────────────────────────────────────
await mkdir(OUT_DIR, { recursive: true });
for (const entry of await readdir(OUT_DIR)) {
  if (!entry.endsWith('.js')) continue;
  const existing = await readFile(path.join(OUT_DIR, entry), 'utf8');
  if (existing.includes(GENERATED_MARK)) await rm(path.join(OUT_DIR, entry));
}

function moduleSource(component) {
  return `// ─────────────────────────────────────────────────────────────────────────────
${GENERATED_MARK} Re-create with: npm run import-assets -- <library.html>
//
// Source    : ${sourceName}
// Component : <script id="${component.id}">
// sha256    : ${component.sha}
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

${BEGIN_MARK}
${component.body}
${END_MARK}

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
${component.registerFns.map((fn) => `window.${fn}();`).join('\n')}

/** Asset records this component registered, keyed by asset id. */
export const assets = Object.fromEntries(
  Object.keys(__legacyLib.assets)
    .filter((id) => !__assetIdsBefore.has(id))
    .map((id) => [id, __legacyLib.assets[id]]),
);

/** Anything else it attached to the library object (for example LabWorkbench). */
export const extras = Object.fromEntries(
  Object.keys(__legacyLib)
    .filter((key) => !__libKeysBefore.has(key))
    .map((key) => [key, __legacyLib[key]]),
);
`;
}

for (const component of components) {
  await writeFile(path.join(OUT_DIR, component.file), moduleSource(component));
}

// ── 3. Load what we just wrote, build every asset once and measure it ────────
const THREE = await import('three');
const { preciseBox, sceneStats, boxSize } = await import('../js/core/measure.js');
const { UNIT_MM } = await import('../js/core/units.js');

const round = (n, digits = 3) => +n.toFixed(digits);
const boxJson = (box) => ({ min: box.min.toArray().map((n) => round(n)), max: box.max.toArray().map((n) => round(n)) });
const jsonable = (record) => Object.fromEntries(Object.entries(record).filter(([, value]) => typeof value !== 'function'));
const parseMm = (text) => (typeof text === 'string' ? (text.match(/\d+(?:\.\d+)?/g) || []).map(Number) : null);

const assets = [];
let workbench = null;

for (const component of components) {
  const mod = await import(pathToFileURL(path.join(OUT_DIR, component.file)).href);

  for (const [id, record] of Object.entries(mod.assets)) {
    const instance = record.createAsset();
    const root = instance.productRoot;
    if (!root?.isObject3D) fail(`${id}: createAsset() did not return { productRoot }`);
    const box = preciseBox(root);
    const [sx, sy, sz] = boxSize(box);
    const partsKey = instance.assemblies ? 'assemblies' : instance.subAssemblies ? 'subAssemblies' : null;
    const parts = partsKey ? Object.keys(instance[partsKey]) : [];
    const declaredParts = Array.isArray(record.subAssemblies) ? record.subAssemblies : [];
    assets.push({
      id,
      module: `./${component.file}`,
      component: component.id,
      meta: jsonable(record),
      datasheetMm: parseMm(record.realDimensionsMm),
      instanceKeys: Object.keys(instance),
      partsKey,
      parts,
      declaredPartsMatch: declaredParts.length === parts.length && declaredParts.every((name) => parts.includes(name)),
      measured: {
        box: boxJson(box),
        // Native model size at scale 1, in millimetres: width (x), depth (z), height (y).
        mm: { w: Math.round(sx * UNIT_MM), d: Math.round(sz * UNIT_MM), h: Math.round(sy * UNIT_MM) },
        ...sceneStats(root),
      },
    });
    instance.dispose?.();
  }

  const factory = mod.extras.LabWorkbench?.createLabWorkbench;
  if (factory) {
    const built = factory();
    const tables = {};
    for (const [key, value] of Object.entries(built)) {
      if (!value?.isObject3D || key === 'workbenchGroup') continue;
      let topY = -Infinity;
      value.traverse((obj) => {
        if (obj.isMesh && obj.name === 'benchtopSlab') topY = Math.max(topY, preciseBox(obj).max.y);
      });
      tables[key] = { box: boxJson(preciseBox(value)), benchtopTopY: Number.isFinite(topY) ? round(topY) : null, ...sceneStats(value) };
    }
    workbench = {
      module: `./${component.file}`,
      component: component.id,
      floorY: built.floorY,
      box: boxJson(preciseBox(built.workbenchGroup)),
      ...sceneStats(built.workbenchGroup),
      tables,
    };
    built.dispose?.();
  }
}

// ── 4. Write the manifest ────────────────────────────────────────────────────
const manifest = `${GENERATED_MARK} Re-create with: npm run import-assets -- <library.html>
//
// Facts about the imported asset library, measured by building every asset once
// (three.js r${THREE.REVISION}). "datasheetMm" is what the library declares; "measured.mm" is
// what the geometry actually spans at scale 1 (1 unit = ${UNIT_MM} mm): w = x, d = z, h = y.

export const LEGACY_SOURCE = ${JSON.stringify({ file: sourceName, sha256: sha256(html), threeRevision: THREE.REVISION }, null, 2)};

export const LEGACY_ASSETS = ${JSON.stringify(assets, null, 2)};

export const LEGACY_WORKBENCH = ${JSON.stringify(workbench, null, 2)};
`;
await writeFile(path.join(OUT_DIR, 'manifest.js'), manifest);

// ── 5. Report ────────────────────────────────────────────────────────────────
console.log(`\nImported ${components.length} components from ${sourceName} → ${path.relative(process.cwd(), OUT_DIR)}/\n`);
console.table(
  Object.fromEntries(
    assets.map((a) => [
      a.id,
      {
        module: a.module,
        'datasheet mm': a.datasheetMm?.join('×') ?? '—',
        'measured w×d×h mm': `${a.measured.mm.w}×${a.measured.mm.d}×${a.measured.mm.h}`,
        draws: a.measured.drawCalls,
        tris: a.measured.triangles,
        mats: a.measured.materials,
        texMB: a.measured.textureMB,
        partsKey: a.partsKey,
        'declared parts ok': a.declaredPartsMatch,
      },
    ]),
  ),
);
if (workbench) console.log(`Workbench: ${workbench.drawCalls} draw calls, ${workbench.triangles} triangles, tables: ${Object.keys(workbench.tables).join(', ')}`);
for (const item of skipped) console.log(`  skipped ${item.id} — ${item.reason}`);
console.log('');
