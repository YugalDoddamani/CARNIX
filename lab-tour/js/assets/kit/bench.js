// Parametric lab bench / desk. One factory covers every worktop in the lab, so
// the rooms stay visually consistent and a change of style is a one-file edit.
import { box, group } from './_parts.js';

export const meta = {
  id: 'bench',
  name: 'Lab bench',
  kind: 'furniture',
  mount: 'floor',
  sizeMm: { w: 1800, d: 700, h: 850 },
};

const TOP = 30; // worktop thickness
const LEG = 40; // steel leg section

function pedestal({ x, depth, height }) {
  const bodyH = height - TOP - 110;
  const bodyD = depth - 90;
  const z = 15; // sits slightly toward the front, clear of the rear legs
  const parts = [
    box({ w: 400, h: 100, d: bodyD - 60, x, y: 0, z: z - 20, mat: 'charcoal' }),
    box({ w: 430, h: bodyH, d: bodyD, x, y: 100, z, mat: 'cabinet' }),
  ];
  const drawers = 3;
  const gap = 8;
  const frontH = (bodyH - gap * (drawers + 1)) / drawers;
  for (let i = 0; i < drawers; i++) {
    const y = 100 + gap + i * (frontH + gap);
    const frontZ = z + bodyD / 2 + 8;
    parts.push(
      box({ w: 414, h: frontH, d: 16, x, y, z: frontZ, mat: 'laminate', r: 3 }),
      box({ w: 150, h: 10, d: 14, x, y: y + frontH - 34, z: frontZ + 14, mat: 'steel', shadow: false }),
    );
  }
  return parts;
}

/**
 * @param {object} p
 * @param {number} [p.length=1800]   along X
 * @param {number} [p.depth=700]     along Z (front edge at +Z)
 * @param {number} [p.height=850]    worktop surface height; ~740 for a seated desk
 * @param {'none'|'left'|'right'|'both'} [p.pedestals='right'] drawer units under the top
 * @param {'frame'|'panel'} [p.legs='frame'] steel frame (lab) or white end panels (office)
 * @param {boolean} [p.upstand=false] splash-back along the rear edge (wet benches)
 */
export function create({ length = 1800, depth = 700, height = 850, pedestals = 'right', legs = 'frame', upstand = false } = {}) {
  const under = height - TOP;
  const hx = length / 2;
  const hz = depth / 2;
  const parts = [box({ w: length, h: TOP, d: depth, y: under, mat: 'laminate', r: 6 })];

  if (upstand) parts.push(box({ w: length, h: 110, d: 18, y: height, z: -hz + 9, mat: 'laminate', r: 3 }));

  if (legs === 'panel') {
    for (const side of [-1, 1]) parts.push(box({ w: 25, h: under, d: depth - 40, x: side * (hx - 30), y: 0, mat: 'laminate' }));
    parts.push(box({ w: length - 110, h: 380, d: 18, y: under - 400, z: -hz + 60, mat: 'cabinet' }));
  } else {
    const ix = hx - 30 - LEG / 2;
    const iz = hz - 30 - LEG / 2;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) parts.push(box({ w: LEG, h: under, d: LEG, x: sx * ix, y: 0, z: sz * iz, mat: 'steel' }));
      // side rails, top and low
      parts.push(box({ w: 24, h: LEG, d: iz * 2 - LEG, x: sx * ix, y: under - LEG, mat: 'steel', shadow: false }));
      parts.push(box({ w: 24, h: 24, d: iz * 2 - LEG, x: sx * ix, y: 140, mat: 'steel', shadow: false }));
    }
    // rear rails, top and low; front top rail
    parts.push(box({ w: ix * 2 - LEG, h: LEG, d: 24, y: under - LEG, z: -iz, mat: 'steel', shadow: false }));
    parts.push(box({ w: ix * 2 - LEG, h: 24, d: 24, y: 140, z: -iz, mat: 'steel', shadow: false }));
    parts.push(box({ w: ix * 2 - LEG, h: LEG, d: 24, y: under - LEG, z: iz, mat: 'steel', shadow: false }));
  }

  const inset = legs === 'panel' ? 60 : 30 + LEG + 12;
  if (pedestals === 'left' || pedestals === 'both') parts.push(pedestal({ x: -hx + inset + 215, depth, height }));
  if (pedestals === 'right' || pedestals === 'both') parts.push(pedestal({ x: hx - inset - 215, depth, height }));

  return group('bench', parts);
}
