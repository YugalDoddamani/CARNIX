#!/usr/bin/env node
// Imports the 3D model out of a single-file PRODUCT VIEWER ("<Machine>_Viewer.html":
// the stand-alone page that shows one machine, as it exists before the machine
// has been added to the asset library) into an ES module the tour can lazy-load,
// and measures the model on the way in.
//
//   node tools/import-viewer.mjs <path/to/Machine_Viewer.html> --id medit-t500
//        [--name "Medit Identica T500"]   default: the viewer's own product title
//        [--size 290x290x340]             the maker's size, w × d × h in mm
//        [--md5 <hex>] [--sha256 <hex>]   what Google Drive lists for the file: the
//                                         import stops unless the file on disk is that file
//
// A viewer file holds three components and the inlined three.js:
//   1  scene core      the viewer's own renderer, camera and lights             (left out)
//   2  product model   the machine: window.__registerProductModel() sets
//                      window.__ProductModel = { create…Product }               (imported)
//   3  viewer app      buttons, keyboard, render loop                            (left out)
// Viewer files name these in two ways: on the tag (<script id="component-2-product-model">,
// as in the Medit T500's file) or in a comment above a bare <script> ("COMPONENT 2 OF 3:
// PRODUCT MODEL (…)", as in the two milling machines' files). The importer goes by
// what a script does, not by its name: the model is the one that sets window.__ProductModel.
//
// It writes
//   js/assets/viewers/<id>.js       the model component, byte for byte, in a module wrapper
//   js/assets/viewers/manifest.js   one entry per imported viewer: name, sizes, draw cost,
//                                   and the checksums of the file it came from
// Viewers are imported one at a time: the modules of other machines in that folder
// are left alone, and their manifest entries are carried over. Nothing in the
// model's code is rewritten; what the tour needs changed belongs in
// js/assets/registry.js. (The asset library has its own importer,
// import-asset-library.mjs, and its own folder, js/assets/legacy/.)
import './lib/node-env.mjs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '../js/assets/viewers');
const GENERATED_MARK = '// GENERATED FILE — do not edit.';
const BEGIN_MARK = '// ── BEGIN original source ────────────────────────────────────────────────────';
const END_MARK = '// ── END original source ──────────────────────────────────────────────────────';

// The only properties a model component may touch on `window` and still be imported.
const ALLOWED_WINDOW_PROPS = /^(__THREE_BUNDLE__|__ProductModel|__register[A-Za-z0-9_$]*)$/;

const hash = (algorithm, data) => createHash(algorithm).update(data).digest('hex');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

// ── 0. What was asked for ────────────────────────────────────────────────────
const USAGE = 'Usage: node tools/import-viewer.mjs <path/to/Machine_Viewer.html> --id <asset-id> [--name "<name>"] [--size <w>x<d>x<h>] [--md5 <hex>] [--sha256 <hex>]';
const args = process.argv.slice(2);
const options = {};
let inputArg = null;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const [key, inline] = arg.slice(2).split('=');
    if (!['id', 'name', 'size', 'md5', 'sha256'].includes(key)) fail(`Unknown option --${key}\n  ${USAGE}`);
    options[key] = inline ?? args[++i];
  } else if (inputArg === null) inputArg = arg;
  else fail(`Unexpected argument "${arg}"\n  ${USAGE}`);
}
if (!inputArg || !options.id) fail(USAGE);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(options.id)) fail(`--id "${options.id}": use lower-case letters, digits and hyphens, as in "medit-t500"`);
const id = options.id;

let datasheetMm = null;
if (options.size !== undefined) {
  const numbers = String(options.size).split(/[x×]/i).map(Number);
  if (numbers.length !== 3 || numbers.some((n) => !(n > 0))) fail(`--size "${options.size}": give width x depth x height in millimetres, as in 290x290x340`);
  datasheetMm = numbers;
}

const expected = {};
for (const [algorithm, length] of [['md5', 32], ['sha256', 64]]) {
  if (options[algorithm] === undefined) continue;
  expected[algorithm] = String(options[algorithm]).trim().toLowerCase();
  if (!new RegExp(`^[0-9a-f]{${length}}$`).test(expected[algorithm])) fail(`--${algorithm} "${options[algorithm]}": give the ${length} hexadecimal digits that Google Drive lists for the file`);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const sourceName = path.basename(inputPath);
const onDisk = await readFile(inputPath).catch(() => fail(`Cannot read ${inputPath}`));

// A file that was changed on its way here. A web page fetched through a proxy
// that "speeds pages up" by loading their scripts late (Cloudflare's Rocket
// Loader) does not arrive as it was sent:
//   · every <script> tag has been given  type="<token>-text/javascript", and
//   · one more <script> tag, which loads the proxy's own script, stands before </body>.
// Both are taken out again, so that what is imported, and the checksums that are
// kept, are those of the file as it lies in Drive. Whether they are is for --md5
// or --sha256 to prove. (Bytes are handled as bytes: nothing else may change.)
let bytes = onDisk;
let undone = null;
{
  const text = onDisk.toString('latin1');
  const added = /<script src="[^"<>]*\/rocket-loader\.min\.js" data-cf-settings="([0-9a-f]+)-\|\d+" defer><\/script>/.exec(text);
  if (added) {
    const typeAttribute = ` type="${added[1]}-text/javascript"`;
    const withoutTag = text.slice(0, added.index) + text.slice(added.index + added[0].length);
    const pieces = withoutTag.split(typeAttribute);
    bytes = Buffer.from(pieces.join(''), 'latin1');
    undone = { scriptTypes: pieces.length - 1, bytes: onDisk.length - bytes.length };
  }
}
const html = bytes.toString('utf8');
const source = { file: sourceName, bytes: bytes.length, md5: hash('md5', bytes), sha256: hash('sha256', bytes) };
for (const [algorithm, wanted] of Object.entries(expected)) {
  if (source[algorithm] !== wanted) {
    fail(
      `${sourceName} is not the file that was asked for: its ${algorithm} is ${source[algorithm]}, not ${wanted}` +
        `${undone ? ` (after taking out what a proxy had added: ${undone.scriptTypes} script types and 1 script tag, ${undone.bytes} bytes)` : ''}. Nothing was imported.`,
    );
  }
}

// ── 1. Find the model component ──────────────────────────────────────────────
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const candidates = [];
scripts.forEach((match, index) => {
  if (!/\bwindow\.__ProductModel\s*=(?!=)/.test(match[2])) return;
  const tagId = /\bid="([^"]+)"/.exec(match[1])?.[1];
  if (tagId) {
    candidates.push({ id: tagId, where: `<script id="${tagId}">`, body: match[2] });
    return;
  }
  // A bare <script>: say which one it is, and quote the comment that ends right above it.
  const before = html.slice(0, match.index);
  const open = before.lastIndexOf('<!--');
  const close = before.lastIndexOf('-->');
  const directlyAbove = open !== -1 && close > open && before.slice(close + 3).trim() === '';
  const heading = directlyAbove ? before.slice(open + 4, close).replace(/={4,}/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const nth = `script ${index + 1} of ${scripts.length}`;
  candidates.push({ id: nth, where: `${nth}${heading ? `, under the comment "${heading}"` : ''}`, body: match[2] });
});
if (candidates.length === 0) fail(`${sourceName} has no script that sets window.__ProductModel: is this a single-machine viewer? (The asset library is imported with import-asset-library.mjs.)`);
if (candidates.length > 1) fail(`${sourceName} has ${candidates.length} scripts that set window.__ProductModel (${candidates.map((c) => c.id).join(', ')}); expected one`);
const component = candidates[0];

const registerFns = [...component.body.matchAll(/window\.(__register[A-Za-z0-9_$]+)\s*=\s*function/g)].map((m) => m[1]);
if (registerFns.length !== 1) fail(`${component.id}: expected one window.__register…() function, found ${registerFns.length}`);
const windowProps = [...new Set([...component.body.matchAll(/\bwindow\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((m) => m[1]))];
const foreign = windowProps.filter((prop) => !ALLOWED_WINDOW_PROPS.test(prop));
if (foreign.length > 0) fail(`${component.id} uses browser window state (${foreign.join(', ')}), so it cannot run outside its viewer`);
component.sha = hash('sha256', Buffer.from(component.body, 'utf8'));

const unescapeHtml = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const title = /<h1\b[^>]*class="[^"]*\bproduct-title\b[^"]*"[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1];
const name = (options.name ?? (title ? unescapeHtml(title.replace(/<[^>]+>/g, '')) : '')).replace(/\s+/g, ' ').trim();
if (!name) fail(`${sourceName} has no <h1 class="product-title">: give the machine's name with --name`);

// ── 2. Write its module ──────────────────────────────────────────────────────
const record = { id, name, ...(datasheetMm ? { realDimensionsMm: `${datasheetMm.join(' × ')} mm` } : {}) };
const recordSource = Object.entries(record)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join(', ');
const moduleFile = `${id}.js`;
const moduleSource = `// ─────────────────────────────────────────────────────────────────────────────
${GENERATED_MARK} Re-create with: npm run import-viewer -- <Viewer.html> --id ${id}
//
// Source    : ${source.file}  (${source.bytes.toLocaleString('en-US')} bytes)
//             md5 ${source.md5} · sha256 ${source.sha256}
// Component : ${component.where}
// sha256    : ${component.sha}
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer version
// of the viewer can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { createViewerWindow } from './_viewer-window.js';

const window = createViewerWindow();

${BEGIN_MARK}
${component.body}
${END_MARK}

window.${registerFns[0]}();
const __factory = Object.values(window.__ProductModel).find((value) => typeof value === 'function');

/** The machine's record, in the shape the asset library gives its machines. */
export const assets = {
  ${JSON.stringify(id)}: { ${recordSource}, createAsset: () => __factory() },
};

/** A viewer holds one machine and nothing else. */
export const extras = {};
`;
await mkdir(OUT_DIR, { recursive: true });
await writeFile(path.join(OUT_DIR, moduleFile), moduleSource);

// ── 3. Load what we just wrote, build the machine once and measure it ───────
const THREE = await import('three');
const { preciseBox, sceneStats, boxSize } = await import('../js/core/measure.js');
const { UNIT_MM } = await import('../js/core/units.js');

const round = (n, digits = 3) => +n.toFixed(digits);
const boxJson = (box) => ({ min: box.min.toArray().map((n) => round(n)), max: box.max.toArray().map((n) => round(n)) });

const mod = await import(`${pathToFileURL(path.join(OUT_DIR, moduleFile)).href}?${Date.now()}`);
const instance = mod.assets[id].createAsset();
const root = instance.productRoot;
if (!root?.isObject3D) fail(`${id}: its factory did not return { productRoot }`);
const box = preciseBox(root);
const [sx, sy, sz] = boxSize(box);
const partsKey = instance.assemblies ? 'assemblies' : instance.subAssemblies ? 'subAssemblies' : null;
// A viewer's model usually returns no map of its sub-assemblies: they are the
// named groups directly under its root (registry.js reads them the same way).
const parts = partsKey ? Object.keys(instance[partsKey]) : root.children.filter((child) => child.isGroup && child.name).map((child) => child.name);
let lights = 0;
root.traverse((node) => {
  if (node.isLight) lights++;
});
const entry = {
  id,
  module: `./${moduleFile}`,
  component: component.id,
  meta: record,
  datasheetMm,
  instanceKeys: Object.keys(instance),
  partsKey,
  parts,
  measured: {
    box: boxJson(box),
    // Native model size at scale 1, in millimetres: width (x), depth (z), height (y).
    mm: { w: Math.round(sx * UNIT_MM), d: Math.round(sz * UNIT_MM), h: Math.round(sy * UNIT_MM) },
    ...sceneStats(root),
    lights,
  },
  source: { ...source, componentSha256: component.sha },
};
instance.dispose?.();

// ── 4. Write the manifest: this machine, and those imported before it ───────
const manifestPath = path.join(OUT_DIR, 'manifest.js');
const earlier = await import(`${pathToFileURL(manifestPath).href}?${Date.now()}`).then(
  (module) => module.VIEWER_ASSETS ?? [],
  () => [],
);
const assets = [...earlier.filter((other) => other.id !== id), entry].sort((a, b) => a.id.localeCompare(b.id));
const manifest = `${GENERATED_MARK} Re-create with: npm run import-viewer -- <Viewer.html> --id <asset-id>
//
// Facts about the machines imported from single-machine viewer files, one entry
// per viewer, measured by building each machine once (three.js r${THREE.REVISION}).
// "datasheetMm" is the maker's size as given at import; "measured.mm" is what the
// geometry actually spans at scale 1 (1 unit = ${UNIT_MM} mm): w = x, d = z, h = y.
// "source" names the file a machine came from, with its checksums.

export const VIEWER_ASSETS = ${JSON.stringify(assets, null, 2)};
`;
await writeFile(manifestPath, manifest);

// ── 5. Report ────────────────────────────────────────────────────────────────
console.log(`\nImported "${name}" as ${id} from ${source.file} → ${path.relative(process.cwd(), path.join(OUT_DIR, moduleFile))}\n`);
console.table({
  [id]: {
    'file bytes': source.bytes,
    'file md5': source.md5,
    'datasheet mm': datasheetMm?.join('×') ?? '—',
    'measured w×d×h mm': `${entry.measured.mm.w}×${entry.measured.mm.d}×${entry.measured.mm.h}`,
    draws: entry.measured.drawCalls,
    tris: entry.measured.triangles,
    mats: entry.measured.materials,
    texMB: entry.measured.textureMB,
    parts: parts.length,
    lights,
  },
});
if (undone) console.log(`  note: the file on disk had been changed on its way here: ${undone.scriptTypes} script tags given a type and 1 script tag added (${undone.bytes} bytes). They were taken out; the size and checksums above are those of the file without them.`);
console.log(Object.keys(expected).length ? `  proven: the file has the ${Object.keys(expected).join(' and the ')} given for it` : `  not proven: compare the checksums with those Google Drive lists for the file (md5 ${source.md5}), or give them with --md5 / --sha256`);
if (!instance.setExplodeFactor) console.log('  note: the model has no setExplodeFactor(), so the tour cannot take it apart');
if (lights) console.log(`  note: the model holds ${lights} light${lights === 1 ? '' : 's'}; the tour switches lights inside machines off (js/assets/registry.js)`);
if (earlier.some((other) => other.id !== id)) console.log(`  kept in the manifest: ${earlier.filter((other) => other.id !== id).map((other) => other.id).join(', ')}`);
console.log(`\nNext: add "${id}" to js/rooms/catalogue.js (status: 'built'), place it in js/rooms/content.js, describe it in js/rooms/knowledge.js, then npm run check.\n`);
