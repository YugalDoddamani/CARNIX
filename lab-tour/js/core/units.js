// One unit system for the whole tour.
//
// The equipment library is modelled at 1 scene unit = 80 mm (its own source says
// so, and five of the six machines measure within a few percent of their
// datasheets at that scale). Rather than rescale approved models, the lab is
// built in the same unit and nobody types the odd number by hand:
//
//   mm(600)  → 7.5 units      for furniture and equipment (datasheet millimetres)
//   m(4.5)   → 56.25 units    for rooms, walls and camera distances (metres)
//
// World axes: +X east, +Z south (toward the default camera), +Y up, floor at Y = 0.
export const UNIT_MM = 80;

/** Millimetres → scene units. */
export const mm = (value) => value / UNIT_MM;

/** Metres → scene units. */
export const m = (value) => (value * 1000) / UNIT_MM;

/** Scene units → millimetres (for read-outs and checks). */
export const toMm = (units) => units * UNIT_MM;

/** Scene units → metres. */
export const toM = (units) => (units * UNIT_MM) / 1000;
