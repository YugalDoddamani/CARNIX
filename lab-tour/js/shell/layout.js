// THE FLOOR PLAN — the single source of truth for the building.
//
// Everything here is plain data in METRES, looking down on the plan:
//   x runs west → east, z runs north → south, (0, 0) is the north-west corner.
// The default camera stands to the south-east, so the north and west walls are
// the backdrop you see, and the south and east walls are in front of the rooms
// (those are glass or low, so they never hide anything).
//
// Changing a room size, moving a door or re-styling a wall is an edit to this
// file only: walls, floors, labels, tap targets and camera framing all follow.
// Run `npm run check` afterwards — it reports furniture that no longer fits.
//
// ⚠ These dimensions are a DRAFT read off the concept image, not a survey.
// Replace them with the real floor plan when it is available.

const ROW = 4; // depth of both room rows
const CORRIDOR_D = 2.2;
const SOUTH_Z = ROW + CORRIDOR_D; // where the south row starts

export const BUILDING = { w: 13.8, d: ROW * 2 + CORRIDOR_D };

export const WALL = {
  thickness: 0.14,
  doorWidth: 0.95,
  doorHeight: 2.05,
};

// How a wall is built, bottom to top: `solid` metres of opaque wall, then glass
// up to `glassTop` (0 = no glass).
export const WALL_STYLES = {
  back: { solid: 2.3, glassTop: 0 }, //        full-height backdrop wall
  window: { solid: 0.75, glassTop: 2.3 }, //   backdrop wall with a window band
  partition: { solid: 0.9, glassTop: 2.1 }, // half-glazed room divider
  glazed: { solid: 0.1, glassTop: 2.1 }, //    floor-to-head glass (corridor fronts)
  front: { solid: 0.1, glassTop: 1.05 }, //    low glass on the camera side
};

export const CORRIDOR = { x: 0, z: ROW, w: BUILDING.w, d: CORRIDOR_D };

// `lightStrip`: which wall of the room carries a light strip ('north', 'west' or none).
export const ROOMS = [
  { id: 'design', name: 'Design Room', subtitle: 'CAD Design & Planning', icon: 'design', x: 0, z: 0, w: 5.2, d: ROW, lightStrip: 'north' },
  { id: 'printing', name: 'Printing Room', subtitle: '3D Printing', icon: 'printing', x: 5.2, z: 0, w: 4, d: ROW, lightStrip: 'north' },
  { id: 'clinic', name: 'Clinic Reception', subtitle: 'Patient Care', icon: 'clinic', x: 9.2, z: 0, w: 4.6, d: ROW },
  { id: 'plaster', name: 'Plaster Room', subtitle: 'Model Preparation', icon: 'plaster', x: 0, z: SOUTH_Z, w: 5.2, d: ROW, lightStrip: 'west' },
  { id: 'ceramic', name: 'Ceramic Room', subtitle: 'Ceramic Work', icon: 'ceramic', x: 5.2, z: SOUTH_Z, w: 3.6, d: ROW },
  { id: 'acrylic', name: 'Acrylic & Prosthodontic Room', shortName: 'Acrylic & Prostho', subtitle: 'Final Prosthesis', icon: 'acrylic', x: 8.8, z: SOUTH_Z, w: 5, d: ROW },
];

// Walls run in the +x or +z direction from (x1, z1) to (x2, z2).
// A door's `at` is the distance in metres from the wall's start to the door's centre.
export const WALLS = [
  // Exterior
  { line: [0, 0, 9.2, 0], style: 'back' }, //                          north, behind Design + Printing
  { line: [9.2, 0, BUILDING.w, 0], style: 'window' }, //               north, the clinic's window wall
  { line: [0, 0, 0, BUILDING.d], style: 'back' }, //                   west
  { line: [0, BUILDING.d, BUILDING.w, BUILDING.d], style: 'front' }, // south
  { line: [BUILDING.w, 0, BUILDING.w, BUILDING.d], style: 'front', doors: [{ at: 2, width: 1.5 }, { at: ROW + CORRIDOR_D / 2, width: 1.3 }] }, // east: clinic entrance + staff entrance

  // Corridor, north side (fronts of Design / Printing / Clinic)
  { line: [0, ROW, BUILDING.w, ROW], style: 'glazed', doors: [{ at: 4.55 }, { at: 8.6 }, { at: 9.9 }] },
  // Corridor, south side (Plaster / Ceramic / Acrylic). Half-glazed so the
  // corridor stays visible from the default camera.
  { line: [0, SOUTH_Z, BUILDING.w, SOUTH_Z], style: 'partition', doors: [{ at: 4.55 }, { at: 8.2 }, { at: 9.5 }] },

  // Room dividers
  { line: [5.2, 0, 5.2, ROW], style: 'partition' }, //            Design | Printing
  { line: [9.2, 0, 9.2, ROW], style: 'partition' }, //            Printing | Clinic
  { line: [5.2, SOUTH_Z, 5.2, BUILDING.d], style: 'partition' }, // Plaster | Ceramic
  { line: [8.8, SOUTH_Z, 8.8, BUILDING.d], style: 'partition' }, // Ceramic | Acrylic
];

// Where the camera sits, as compass-style angles:
//   azimuth   degrees east of due south (0 = looking north from the south)
//   elevation degrees above the horizon
//   fov       vertical field of view; a narrow lens gives the "isometric" feel
//   padding   share of the free screen area left empty around the subject
export const VIEWS = {
  overview: { azimuth: 30, elevation: 38, fov: 20, padding: 0.05 },
  // Upright screens (phones): the building is wider than the screen, so its
  // width sets the size. Stand further round to the east and look down more
  // steeply, which turns the spare height into bigger, less hidden rooms.
  overviewPortrait: { azimuth: 64, elevation: 52, fov: 20, padding: 0.04 },
  room: { azimuth: 24, elevation: 38, fov: 26, padding: 0.08 },
  item: { azimuthOffset: 14, elevation: 17, fov: 30, padding: 0.38 },
};
