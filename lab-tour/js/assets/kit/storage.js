// Open shelving. The plaster room is mostly this, loaded with study models.
import { box, group } from './_parts.js';

export const meta = {
  id: 'shelf-rack',
  name: 'Shelving rack',
  kind: 'furniture',
  mount: 'floor',
  sizeMm: { w: 1000, d: 450, h: 1800 },
};

// Deterministic pseudo-random in [0, 1): the same rack looks the same on every
// load, and no two neighbouring items line up too perfectly.
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * @param {object} p
 * @param {number} [p.width=1000]
 * @param {number} [p.depth=450]
 * @param {number} [p.height=1800]
 * @param {number} [p.shelves=4]
 * @param {'none'|'models'|'boxes'} [p.fill='none'] what is stored on it
 * @param {number} [p.seed=1]
 */
export function create({ width = 1000, depth = 450, height = 1800, shelves = 4, fill = 'none', seed = 1 } = {}) {
  const parts = [];
  const hx = width / 2 - 15;
  const hz = depth / 2 - 15;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(box({ w: 30, h: height, d: 30, x: sx * hx, y: 0, z: sz * hz, mat: 'steel' }));

  const first = 160;
  const pitch = (height - first - 30) / Math.max(1, shelves - 1);
  for (let level = 0; level < shelves; level++) {
    const y = first + level * pitch;
    parts.push(box({ w: width - 8, h: 22, d: depth - 8, y, mat: 'laminate' }));
    const top = y + 22;
    // Storage boxes are not kept on the top board (out of reach); models are.
    if (fill === 'none' || (fill === 'boxes' && level === shelves - 1)) continue;

    if (fill === 'models') {
      // Rows of plaster study models: small squat blocks with a little variety.
      const count = Math.floor((width - 120) / 125);
      const spacing = (width - 120) / count;
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < count; i++) {
          const n = seed * 97 + level * 31 + row * 7 + i;
          if (hash(n + 0.5) < 0.12) continue; // a few gaps
          parts.push(
            box({
              w: 78 + hash(n) * 18,
              h: 42 + hash(n + 1) * 26,
              d: 62 + hash(n + 2) * 12,
              x: -width / 2 + 60 + spacing * (i + 0.5) + (hash(n + 3) - 0.5) * 14,
              y: top,
              z: (row - 0.5) * (depth * 0.42),
              rotY: (hash(n + 4) - 0.5) * 0.3,
              mat: 'plaster',
              shadow: false,
            }),
          );
        }
      }
    } else {
      const count = Math.max(2, Math.floor((width - 80) / 300));
      const spacing = (width - 80) / count;
      for (let i = 0; i < count; i++) {
        const n = seed * 53 + level * 17 + i;
        parts.push(
          box({
            w: 240,
            h: Math.min(pitch - 60, 170 + hash(n) * 90),
            d: depth - 110,
            x: -width / 2 + 40 + spacing * (i + 0.5),
            y: top,
            mat: hash(n + 1) > 0.55 ? 'accent' : 'cabinet',
            r: 6,
            shadow: false,
          }),
        );
      }
    }
  }
  return group('shelf-rack', parts);
}
