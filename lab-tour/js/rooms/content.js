// WHAT STANDS WHERE — the contents of every room, as data.
//
// Positions are room-local METRES from the room's north-west corner:
//   at: [x, z]   x → east, z → south (toward the camera)
//   face         which way the front of the piece points: 'S' (default), 'E', 'N', 'W'
//
// Entry types
//   { kit: 'bench', params, seats, on }   furniture from the kit (never tappable)
//       seats: chair positions along the bench, mm from its centre
//       on:    things standing on the worktop, `x` mm along the bench from its centre
//   { equipment: 'plaster-sink' }         a machine from the catalogue (tappable)
//   { station: 'furnaces' | 'scanners' }  one of the two approved benches from the
//       asset library, exactly as composed there, with its machines
//
// Keep backdrop walls (north, west) for benches and the middle for islands; the
// south and east sides face the camera and should stay low.
// Run `npm run check` after editing: it reports anything in a wall, in front of
// a door, overlapping a neighbour or hanging off its bench.

const desk = { height: 740, legs: 'panel', pedestals: 'none' };
const monitorAt = (x) => ({ kit: 'desk-monitor', x });

export const ROOM_CONTENT = {
  // 5.2 × 4.0 m · door to the corridor at x = 4.55 on the south side
  design: [
    { station: 'scanners', at: [1.6, 0.48], seats: [-404, 916] },
    { kit: 'bench', at: [4.1, 0.43], params: { ...desk, length: 1800 }, seats: [-450, 450], on: [monitorAt(-450), monitorAt(450)] },
    { kit: 'wall-display', at: [4.1, 0.07], y: 1.15, params: { width: 1300, height: 700 } },
    { kit: 'bench', at: [0.43, 2.5], face: 'E', params: { ...desk, length: 1800 }, seats: [-450, 450], on: [monitorAt(-450), monitorAt(450)] },
    { kit: 'bench', at: [3.0, 2.45], params: { ...desk, length: 1800 }, seats: [-450, 450], on: [monitorAt(-450), monitorAt(450)] },
    { kit: 'shelf-rack', at: [4.89, 2.3], face: 'W', params: { fill: 'boxes', seed: 3 } },
    { kit: 'plant', at: [0.38, 3.66], params: { height: 900 } },
  ],

  // 4.0 × 4.0 m · door at x = 3.4 on the south side
  printing: [
    {
      kit: 'bench',
      at: [1.65, 0.43],
      params: { length: 3000, height: 900, pedestals: 'both' },
      on: [
        { equipment: 'uniformation-gk3', x: -950 },
        { equipment: 'resin-printer', x: 0 },
        { equipment: 'resin-printer', x: 950 },
      ],
    },
    { kit: 'shelf-rack', at: [3.56, 0.31], params: { width: 700, fill: 'boxes', seed: 8 } },
    {
      kit: 'bench',
      at: [0.43, 2.4],
      face: 'E',
      params: { length: 1800, height: 900, pedestals: 'right' },
      on: [
        { equipment: 'wash-station', x: 400 },
        { equipment: 'cure-unit', x: -400 },
      ],
    },
    { kit: 'bench', at: [2.4, 2.5], params: { length: 1400, height: 900, pedestals: 'none' } },
  ],

  // 4.6 × 4.0 m · corridor door at x = 0.7 (south side) · street entrance on the east side at z = 2.0
  clinic: [
    { kit: 'reception-desk', at: [2.3, 1.55], face: 'E' },
    { kit: 'task-chair', at: [1.45, 1.75], face: 'E' },
    { kit: 'shelf-rack', at: [0.7, 0.31], params: { fill: 'boxes', seed: 5 } },
    { equipment: 'intraoral-scanner', at: [3.3, 0.5] },
    { kit: 'sofa', at: [2.8, 3.5], face: 'N' },
    { kit: 'plant', at: [4.15, 0.45] },
    { kit: 'plant', at: [4.2, 3.55], params: { height: 1100 } },
  ],

  // 5.2 × 4.0 m · door from the corridor at x = 4.55 on the north side
  plaster: [
    {
      kit: 'bench',
      at: [1.6, 0.43],
      params: { length: 2800, height: 900, pedestals: 'both', upstand: true },
      on: [
        { equipment: 'model-trimmer', x: -1050 },
        { equipment: 'vacuum-mixer', x: -450 },
        { equipment: 'vibrator', x: 150 },
        { equipment: 'pin-drill', x: 800 },
      ],
    },
    { equipment: 'plaster-sink', at: [3.55, 0.38] },
    { kit: 'shelf-rack', at: [0.31, 1.9], face: 'E', params: { fill: 'models', seed: 1 } },
    { kit: 'shelf-rack', at: [0.31, 3.0], face: 'E', params: { fill: 'models', seed: 2 } },
    { kit: 'shelf-rack', at: [4.89, 2.6], face: 'W', params: { fill: 'models', seed: 4 } },
    { kit: 'bench', at: [2.7, 2.5], params: { length: 1800, height: 900, pedestals: 'none' } },
  ],

  // 3.6 × 4.0 m · door from the corridor at x = 3.0 on the north side
  ceramic: [
    { station: 'furnaces', at: [1.15, 0.48] },
    {
      kit: 'bench',
      at: [0.43, 2.6],
      face: 'E',
      params: { length: 1600, height: 780, pedestals: 'right' },
      seats: [-150],
      on: [{ equipment: 'micromotor', x: 450 }],
    },
    {
      kit: 'bench',
      at: [2.4, 3.0],
      params: { length: 1800, height: 900, pedestals: 'left' },
      on: [
        { equipment: 'steam-cleaner', x: -560 },
        { equipment: 'sandblaster', x: 0 },
        { equipment: 'ultrasonic-cleaner', x: 560 },
      ],
    },
  ],

  // 5.0 × 4.0 m · door from the corridor at x = 0.7 on the north side
  acrylic: [
    {
      kit: 'bench',
      at: [3.15, 0.43],
      params: { length: 3400, height: 900, pedestals: 'both' },
      on: [
        { equipment: 'boil-out-unit', x: -1350 },
        { equipment: 'flask-press', x: -800 },
        { equipment: 'pressure-polymeriser', x: -300 },
        { equipment: 'thermoformer', x: 300 },
        { equipment: 'polishing-lathe', x: 1150 },
      ],
    },
    { equipment: 'dust-extractor', at: [4.75, 1.3] },
    {
      kit: 'bench',
      at: [0.43, 2.4],
      face: 'E',
      params: { length: 1800, height: 780, pedestals: 'both' },
      seats: [-300, 300],
      on: [
        { equipment: 'micromotor', x: -700 },
        { equipment: 'micromotor', x: 700 },
      ],
    },
    { kit: 'bench', at: [3.0, 2.6], params: { length: 2400, height: 780, pedestals: 'both' }, seats: [-350, 350] },
  ],
};

// The two benches that come from the asset library, and which machines stand
// on each (positions and scales are the library's own, untouched).
export const STATIONS = {
  furnaces: { table: 'furnaceTableGroup', equipment: ['zubler-vario-200', 'upcera-a7-plus', 'ivoclar-programat-p300'] },
  scanners: { table: 'scannerTableGroup', equipment: ['dsex-pro', 'pc-dsex', '3shape-e4', 'pc-3shape'] },
};
