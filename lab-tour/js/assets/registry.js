// One uniform way to get any machine, whatever its origin.
//
// Machines come from two places: the asset library (./legacy/, many machines in
// one file) and single-machine viewer files (./viewers/, one machine each, for
// a machine the library does not hold yet). The imported components are also
// inconsistent with each other (some return `assemblies`, some `subAssemblies`,
// a viewer's model returns neither; one needs a 0.84 scale to sit right on the
// bench; four bring lamps of their own). This file hides all that behind a single
// contract, so the rest of the tour — and every future asset — only ever deals
// with this shape:
//
//   const asset = await createEquipment('3shape-e4');
//   asset.root            THREE.Object3D, origin bottom-centre, +Z = operator side
//   asset.parts           { name → Object3D } sub-assemblies
//   asset.setExplode(f)   0 (assembled) … 1 (exploded)
//   asset.dispose()
//
// Fixes and overrides for imported assets belong HERE, never in the generated
// modules under ./legacy/ and ./viewers/ (those are overwritten by the importers).
import * as THREE from 'three';
import { UNIT_MM } from '../core/units.js';
import { LEGACY_ASSETS, LEGACY_WORKBENCH } from './legacy/manifest.js';
import { VIEWER_ASSETS } from './viewers/manifest.js';

// The GK3's touch-screen picture is drawn with ctx.roundRect(). The tour runs
// from Chrome 89 and Firefox 108 on, but roundRect() only came with Chrome 99
// and Firefox 112: in the versions between, the component would throw and the
// printer would stay a plain volume. Give those a simple version of it: one
// radius for all four corners, which is all the library uses.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, radii = 0) {
    const first = Array.isArray(radii) ? radii[0] : radii;
    const wanted = typeof first === 'number' ? first : first?.x ?? 0;
    const r = Math.max(0, Math.min(wanted, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

/** Every imported machine by id, with the folder its module lives in. A library machine wins over a viewer of the same id (`npm run check` reports such a pair). */
const importedById = new Map([
  ...VIEWER_ASSETS.map((entry) => [entry.id, { ...entry, folder: './viewers/' }]),
  ...LEGACY_ASSETS.map((entry) => [entry.id, { ...entry, folder: './legacy/' }]),
]);
const moduleUrl = (relative, folder = './legacy/') => new URL(relative, new URL(folder, import.meta.url)).href;

/** Ids of all imported machines, and where each came from: 'library' or 'viewer'. */
export function listEquipment() {
  return [...importedById.values()].map((entry) => ({ id: entry.id, origin: entry.folder === './viewers/' ? 'viewer' : 'library' }));
}

/** Static facts about an imported machine, available before its code is loaded. */
export function describeEquipment(id) {
  const entry = importedById.get(id);
  if (!entry) return null;
  const scale = entry.meta.benchScale ?? 1;
  const box = new THREE.Box3(
    new THREE.Vector3().fromArray(entry.measured.box.min).multiplyScalar(scale),
    new THREE.Vector3().fromArray(entry.measured.box.max).multiplyScalar(scale),
  );
  const size = box.getSize(new THREE.Vector3());
  return {
    id,
    name: entry.meta.name,
    code: entry.meta.code,
    description: entry.meta.capabilityNote,
    /** Scale the library applies when the machine stands on a bench. */
    placeScale: scale,
    /** Position on its library bench, in that bench's own coordinates. */
    benchPosition: entry.meta.benchPosition,
    /** Bounding box as placed (asset space, scene units). */
    box,
    /** Size as placed, real millimetres. */
    sizeMm: { w: Math.round(size.x * UNIT_MM), d: Math.round(size.z * UNIT_MM), h: Math.round(size.y * UNIT_MM) },
    /** What the library says the real machine measures. */
    datasheetMm: entry.datasheetMm ? { w: entry.datasheetMm[0], d: entry.datasheetMm[1], h: entry.datasheetMm[2] } : null,
    cost: { drawCalls: entry.measured.drawCalls, triangles: entry.measured.triangles, materials: entry.measured.materials },
    canExplode: entry.instanceKeys.includes('setExplodeFactor'),
  };
}

/** A model that returns no map of its sub-assemblies: they are the named groups directly under its root. */
const namedGroups = (root) => Object.fromEntries(root.children.filter((child) => child.isGroup && child.name).map((child) => [child.name, child]));

/** Build an imported machine. Loads its module on first use. */
export async function createEquipment(id) {
  const entry = importedById.get(id);
  if (!entry) throw new Error(`Unknown equipment "${id}"`);
  const mod = await import(moduleUrl(entry.module, entry.folder));
  const instance = mod.assets[id].createAsset();
  const root = instance.productRoot;
  root.name = id;
  root.scale.setScalar(entry.meta.benchScale ?? 1);
  // A machine does not bring its own lamps into the lab: the tour lights
  // everything itself. The Medit T500 holds one, a blue point light in its scan
  // bay. What it would add is a faint blue cast on the bay's inner walls. What
  // it would cost was measured: a machine on show is drawn in a pass of its
  // own (core/stage.js), so the lamp would be there in one pass and not in the
  // other, and three.js then looks up the shader program of every lit material
  // again on every frame (40 look-ups a frame in the scanner's view, none
  // without the lamp); and two more shader programs to build, once.
  // The two milling machines hold one each as well, a white point light in the
  // milling chamber. The same goes for those. (Their models set the strength
  // of that light whenever they are taken apart; a hidden light stays hidden.)
  // The thermopress 400 holds two: an orange one at its heater and a white one
  // in its flask chamber. Its heater keeps its orange colour without them: that
  // is the material's own glow, not light falling on it.
  root.traverse((node) => {
    if (node.isLight) node.visible = false;
  });
  return {
    id,
    root,
    parts: instance.assemblies ?? instance.subAssemblies ?? namedGroups(root),
    setExplode: (factor) => instance.setExplodeFactor?.(factor),
    dispose: () => instance.dispose?.(),
  };
}

/** Facts about the library's two benches (boxes are in the library's bench coordinates). */
export function describeWorkbench() {
  return LEGACY_WORKBENCH;
}

/**
 * Build the library's two benches. Returns each table as its own group, still
 * in the library's bench coordinates (benchtop surface at y = 0).
 */
export async function createWorkbench() {
  if (!LEGACY_WORKBENCH) throw new Error('The imported library has no workbench');
  const mod = await import(moduleUrl(LEGACY_WORKBENCH.module));
  const built = mod.extras.LabWorkbench.createLabWorkbench();
  const tables = {};
  for (const key of Object.keys(LEGACY_WORKBENCH.tables)) tables[key] = built[key];
  return { tables, dispose: () => built.dispose?.() };
}
