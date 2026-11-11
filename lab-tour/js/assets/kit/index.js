// The furniture kit: brand-neutral pieces that every room re-uses.
//
// Contract for a kit piece (and for every NEW asset from here on):
//   create(params) → THREE.Object3D
//     · asset space: 1 unit = 80 mm (write sizes with mm()), origin at the
//       bottom centre, +Z is the side a person works at, +Y up
//     · materials come from the shared palette (core/palette.js)
//     · no lights, no animation loops, no DOM access
//   meta.sizeMm → nominal { w, d, h } in real millimetres
import * as bench from './bench.js';
import * as office from './office.js';
import * as seating from './seating.js';
import * as storage from './storage.js';

export const KIT = {
  bench: { meta: bench.meta, create: bench.create },
  'shelf-rack': { meta: storage.meta, create: storage.create },
  'task-chair': { meta: seating.chairMeta, create: seating.createTaskChair },
  sofa: { meta: seating.sofaMeta, create: seating.createSofa },
  'desk-monitor': { meta: office.monitorMeta, create: office.createDeskMonitor },
  'wall-display': { meta: office.displayMeta, create: office.createWallDisplay },
  'reception-desk': { meta: office.receptionMeta, create: office.createReceptionDesk },
  plant: { meta: office.plantMeta, create: office.createPlant },
};

export function createKitPiece(id, params) {
  const piece = KIT[id];
  if (!piece) throw new Error(`Unknown kit piece "${id}"`);
  return piece.create(params);
}
