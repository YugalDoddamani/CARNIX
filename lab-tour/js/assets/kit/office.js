// Office and front-of-house pieces: generic monitor seat, wall display,
// reception counter, plant.
import { mm } from '../../core/units.js';
import { blob, box, cyl, group } from './_parts.js';

export const monitorMeta = {
  id: 'desk-monitor',
  name: 'Monitor, keyboard & mouse',
  kind: 'furniture',
  mount: 'bench',
  sizeMm: { w: 610, d: 355, h: 440 },
};

/** Generic monitor + keyboard + mouse. The screen faces +Z. */
export function createDeskMonitor() {
  return group(
    'desk-monitor',
    box({ w: 230, h: 12, d: 170, y: 0, z: -60, mat: 'charcoal', r: 5 }),
    box({ w: 44, h: 150, d: 26, y: 12, z: -90, mat: 'charcoal' }),
    box({ w: 560, h: 330, d: 24, y: 110, z: -70, mat: 'charcoal', r: 8 }),
    box({ w: 536, h: 306, d: 4, y: 122, z: -56, mat: 'screen', shadow: false }),
    box({ w: 430, h: 16, d: 135, y: 0, z: 140, mat: 'charcoal', r: 5 }),
    box({ w: 62, h: 28, d: 104, x: 300, y: 0, z: 150, mat: 'charcoal', r: 12 }),
  );
}

export const displayMeta = {
  id: 'wall-display',
  name: 'Wall display',
  kind: 'furniture',
  mount: 'wall',
  sizeMm: { w: 1500, d: 50, h: 850 },
};

/** Large review screen. Origin on the wall plane at the bottom edge; faces +Z. */
export function createWallDisplay({ width = 1500, height = 850 } = {}) {
  return group(
    'wall-display',
    box({ w: width, h: height, d: 46, y: 0, z: 23, mat: 'charcoal', r: 10 }),
    box({ w: width - 44, h: height - 44, d: 4, y: 22, z: 47, mat: 'screen', shadow: false }),
  );
}

export const receptionMeta = {
  id: 'reception-desk',
  name: 'Reception counter',
  kind: 'furniture',
  mount: 'floor',
  sizeMm: { w: 2240, d: 805, h: 1180 },
};

/** Reception counter. Visitors stand at +Z; staff sit behind it (−Z). */
export function createReceptionDesk({ width = 2200 } = {}) {
  const monitor = createDeskMonitor();
  monitor.rotation.y = Math.PI;
  monitor.position.set(mm(-width / 2 + 720), mm(740), mm(-100));
  return group(
    'reception-desk',
    box({ w: width, h: 1100, d: 70, y: 0, z: 345, mat: 'laminate', r: 6 }),
    box({ w: width + 6, h: 46, d: 10, y: 820, z: 384, mat: 'accent', shadow: false }),
    box({ w: width + 40, h: 30, d: 290, y: 1100, z: 280, mat: 'laminate', r: 6 }),
    box({ w: width - 60, h: 30, d: 660, y: 710, z: -20, mat: 'laminate', r: 5 }),
    box({ w: 50, h: 1100, d: 760, x: width / 2 - 25, y: 0, z: 0, mat: 'laminate', r: 6 }),
    box({ w: 40, h: 710, d: 660, x: -width / 2 + 50, y: 0, z: -20, mat: 'cabinet' }),
    monitor,
  );
}

export const plantMeta = {
  id: 'plant',
  name: 'Plant',
  kind: 'furniture',
  mount: 'floor',
  sizeMm: { w: 720, d: 725, h: 1320 },
};

/** Stylised potted plant. */
export function createPlant({ height = 1350 } = {}) {
  const s = height / 1350;
  const leaves = [
    [0, 620, 0, 250, 520],
    [170, 560, 60, 190, 420],
    [-160, 600, -70, 200, 440],
    [40, 520, -180, 180, 380],
    [-60, 540, 180, 185, 390],
    [0, 900, 0, 190, 420],
  ];
  return group(
    'plant',
    cyl({ r: 140, rTop: 190, h: 330, y: 0, mat: 'pot', seg: 20 }),
    cyl({ r: 172, h: 14, y: 308, mat: 'charcoal', seg: 20, shadow: false }),
    cyl({ r: 16, h: 420 * s, y: 320, mat: 'leaf', seg: 8, shadow: false }),
    leaves.map(([x, y, z, r, h]) => blob({ r: r * s, h: h * s, x: x * s, y: 330 + (y - 330) * s, z: z * s, mat: 'leaf' })),
  );
}
