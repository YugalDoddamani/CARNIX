// Turns the floor-plan data (layout.js) into geometry: podium, floors, walls,
// glazing, door openings, light strips — all merged into one mesh per material
// (the whole building is 8 draw calls) — plus an invisible tap target and a
// label anchor per room. `parts` lists those meshes in the order a building
// goes up (floor, walls, glazing), for the entrance.
import * as THREE from 'three';
import { GeometryBatch } from '../core/batch.js';
import { PALETTE } from '../core/palette.js';
import { m } from '../core/units.js';
import { BUILDING, CORRIDOR, ROOMS, WALL, WALLS, WALL_STYLES } from './layout.js';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const _matrix = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _noRotation = new THREE.Quaternion();

const PODIUM = 0.3; // metres the building stands proud of the ground
const PODIUM_LIP = 0.2; // how far the podium sticks out past the walls
const SLAB = 0.04;
const CAP = 0.035; // coloured capping on top of every solid wall
const MULLION_PITCH = 1.25;
const OVERLAP = 0.004; // parts that meet are pushed 4 mm into each other: no coincident faces, no flicker
const NO_SHADOW = { castShadow: false };
const NO_SHADOWS_AT_ALL = { castShadow: false, receiveShadow: false };

/** Plan metres → world units (building centred on the origin). */
export const planX = (x) => m(x - BUILDING.w / 2);
export const planZ = (z) => m(z - BUILDING.d / 2);

/** Ground level in world units (the top of every floor slab is y = 0). */
export const GROUND_Y = m(-(PODIUM + SLAB));

/** Add an axis-aligned box given in plan metres: centre (cx, cz), bottom y0, size (sx, sy, sz). */
function addBox(batch, material, cx, y0, cz, sx, sy, sz, flags) {
  if (sx <= 0 || sy <= 0 || sz <= 0) return;
  _pos.set(planX(cx), m(y0 + sy / 2), planZ(cz));
  _scale.set(m(sx), m(sy), m(sz));
  batch.addGeometry(UNIT_BOX, material, _matrix.compose(_pos, _noRotation, _scale), flags);
}

const near = (a, b) => Math.abs(a - b) < 1e-6;

/** Does `wall` pass through or end at plan point (x, z)? */
function touches(wall, x, z) {
  const [x1, z1, x2, z2] = wall.line;
  return z1 === z2 ? near(z, z1) && x >= x1 - 1e-6 && x <= x2 + 1e-6 : near(x, x1) && z >= z1 - 1e-6 && z <= z2 + 1e-6;
}

/**
 * How far a wall's solid part runs past its end point so junctions close up:
 * the taller wall owns the corner (runs through it); a shorter wall stops at the
 * taller one's face; a free end stops where the plan says.
 */
function endExtension(wall, x, z) {
  const mine = WALL_STYLES[wall.style].solid;
  let tallest = -1;
  for (const other of WALLS) if (other !== wall && touches(other, x, z)) tallest = Math.max(tallest, WALL_STYLES[other.style].solid);
  if (tallest < 0) return 0;
  return tallest > mine ? -WALL.thickness / 2 + OVERLAP : WALL.thickness / 2 + OVERLAP;
}

function buildWall(batch, wall) {
  const [x1, z1, x2, z2] = wall.line;
  const alongX = z1 === z2;
  const length = alongX ? x2 - x1 : z2 - z1;
  const style = WALL_STYLES[wall.style];
  const t = WALL.thickness;
  const isKerb = style.solid < 0.5;
  const hasGlass = style.glassTop > style.solid;
  const glassBase = style.solid + (isKerb ? 0 : CAP);

  // Place a box that spans [a, b] along the wall, `thick` across it.
  const piece = (material, a, b, y0, height, thick, flags) => {
    const mid = (a + b) / 2;
    if (alongX) addBox(batch, material, x1 + mid, y0, z1, b - a, height, thick, flags);
    else addBox(batch, material, x1, y0, z1 + mid, thick, height, b - a, flags);
  };

  const doors = (wall.doors || [])
    .map((door) => {
      const width = door.width ?? WALL.doorWidth;
      return { a: door.at - width / 2, b: door.at + width / 2 };
    })
    .sort((p, q) => p.a - q.a);

  // Solid runs between the doors.
  const runs = [];
  let cursor = -endExtension(wall, x1, z1);
  for (const door of doors) {
    runs.push([cursor, door.a]);
    cursor = door.b;
  }
  runs.push([cursor, length + endExtension(wall, x2, z2)]);

  for (const [a, b] of runs) {
    if (b - a <= 0) continue;
    piece(isKerb ? PALETTE.wallCap : PALETTE.wall, a, b, 0, style.solid, t);
    if (!isKerb) piece(PALETTE.wallCap, a, b, style.solid - OVERLAP, CAP + OVERLAP, t + 0.024, NO_SHADOW);

    if (hasGlass) {
      const ga = Math.max(a, 0);
      const gb = Math.min(b, length);
      piece(PALETTE.glass, ga, gb, glassBase, style.glassTop - glassBase, 0.014, NO_SHADOWS_AT_ALL);
      piece(PALETTE.frame, ga, gb, style.glassTop, 0.05, 0.055, NO_SHADOW);
      const bays = Math.max(1, Math.round((gb - ga) / MULLION_PITCH));
      for (let i = 0; i <= bays; i++) {
        const at = ga + ((gb - ga) * i) / bays;
        piece(PALETTE.frame, at - 0.02, at + 0.02, glassBase, style.glassTop - glassBase, 0.05, NO_SHADOW);
      }
    }
  }

  for (const door of doors) {
    const top = hasGlass ? style.glassTop : style.solid;
    if (top <= WALL.doorHeight) continue; // a low wall simply has a gap
    if (style.solid > WALL.doorHeight) {
      // The wall carries on above the opening.
      piece(PALETTE.wall, door.a - OVERLAP, door.b + OVERLAP, WALL.doorHeight, style.solid - WALL.doorHeight, t - 0.004);
      piece(PALETTE.wallCap, door.a - OVERLAP, door.b + OVERLAP, style.solid - OVERLAP, CAP + OVERLAP, t + 0.02, NO_SHADOW);
    } else {
      piece(PALETTE.frame, door.a, door.b, style.glassTop, 0.05, 0.05, NO_SHADOW);
    }
    // Door frame: two jambs and a head.
    for (const edge of [door.a, door.b]) piece(PALETTE.frame, edge - 0.025, edge + 0.025, 0, WALL.doorHeight, t + 0.03, NO_SHADOW);
    piece(PALETTE.frame, door.a, door.b, WALL.doorHeight - 0.05, 0.05, t + 0.026, NO_SHADOW);
  }
}

export function buildShell() {
  const batch = new GeometryBatch();
  const t = WALL.thickness;

  // Podium and floor slabs (the top of every slab is y = 0).
  addBox(batch, PALETTE.plinth, BUILDING.w / 2, -(PODIUM + SLAB), BUILDING.d / 2, BUILDING.w + PODIUM_LIP * 2, PODIUM, BUILDING.d + PODIUM_LIP * 2);
  addBox(batch, PALETTE.floorCorridor, BUILDING.w / 2, -SLAB, BUILDING.d / 2, BUILDING.w + PODIUM_LIP * 2 - 0.04, SLAB - 0.006, BUILDING.d + PODIUM_LIP * 2 - 0.04, NO_SHADOW);
  addBox(batch, PALETTE.floorCorridor, CORRIDOR.x + CORRIDOR.w / 2, -SLAB, CORRIDOR.z + CORRIDOR.d / 2, CORRIDOR.w, SLAB, CORRIDOR.d, NO_SHADOW);
  for (const room of ROOMS) {
    addBox(batch, PALETTE.floor, room.x + room.w / 2, -SLAB, room.z + room.d / 2, room.w, SLAB, room.d, NO_SHADOW);
  }

  for (const wall of WALLS) buildWall(batch, wall);

  // Light strips on backdrop walls.
  for (const room of ROOMS) {
    if (room.lightStrip === 'north') {
      const length = Math.min(3, room.w * 0.55);
      addBox(batch, PALETTE.lightStrip, room.x + room.w / 2, 1.98, room.z + t / 2 + 0.02, length, 0.05, 0.04, NO_SHADOWS_AT_ALL);
    } else if (room.lightStrip === 'west') {
      const length = Math.min(3, room.d * 0.55);
      addBox(batch, PALETTE.lightStrip, room.x + t / 2 + 0.02, 1.98, room.z + room.d / 2, 0.04, 0.05, length, NO_SHADOWS_AT_ALL);
    }
  }

  const group = batch.build('shell');

  // Shadow catcher: an invisible sheet just above the floors that darkens only
  // where the key light is blocked. The studio lighting is so soft that shadows
  // would otherwise barely register on the floor; this grounds the furniture.
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(m(BUILDING.w), m(BUILDING.d)), new THREE.ShadowMaterial({ color: 0x18233b, opacity: 0.26, depthWrite: false }));
  catcher.name = 'floor-shadow-catcher';
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = m(0.004);
  catcher.receiveShadow = true;
  catcher.renderOrder = -1; // before glass and placeholders
  group.add(catcher);

  // The building in the order it is put up when the tour opens (motion.js):
  // what it stands on, then what divides it, then what encloses it.
  const made = (...materials) => group.children.filter((mesh) => materials.includes(mesh.material));
  const parts = {
    floor: [...made(PALETTE.plinth, PALETTE.floorCorridor, PALETTE.floor), catcher],
    walls: made(PALETTE.wall, PALETTE.wallCap),
    glazing: made(PALETTE.glass, PALETTE.frame, PALETTE.lightStrip),
  };

  // Per-room data used for tapping, labelling and framing.
  const tapTargets = new THREE.Group();
  tapTargets.name = 'room-tap-targets';
  tapTargets.visible = false; // never drawn; hit-testing ignores visibility
  const rooms = new Map();
  const roomHeight = WALL_STYLES.back.solid;
  for (const def of ROOMS) {
    const min = new THREE.Vector3(planX(def.x), 0, planZ(def.z));
    const max = new THREE.Vector3(planX(def.x + def.w), m(roomHeight), planZ(def.z + def.d));
    const box = new THREE.Box3(min, max);
    const center = box.getCenter(new THREE.Vector3());

    const target = new THREE.Mesh(UNIT_BOX, PALETTE.ghost);
    target.position.copy(center);
    box.getSize(target.scale);
    target.userData = { type: 'room', roomId: def.id };
    tapTargets.add(target);

    rooms.set(def.id, {
      def,
      box,
      center,
      // What the camera frames for this room: the floor area with a modest
      // height, so it fits the room rather than the air above it.
      focusBox: new THREE.Box3(min.clone(), new THREE.Vector3(max.x, m(1.5), max.z)),
      labelAnchor: new THREE.Vector3(center.x, m(roomHeight + 0.2), planZ(def.z + def.d * 0.3)),
      origin: new THREE.Vector3(planX(def.x), 0, planZ(def.z)),
      tapTarget: target,
    });
  }

  const bounds = new THREE.Box3(new THREE.Vector3(planX(0), 0, planZ(0)), new THREE.Vector3(planX(BUILDING.w), m(roomHeight), planZ(BUILDING.d)));
  // What the camera frames for the whole lab: the building with its podium.
  const frameBox = new THREE.Box3(
    new THREE.Vector3(planX(-PODIUM_LIP), GROUND_Y, planZ(-PODIUM_LIP)),
    new THREE.Vector3(planX(BUILDING.w + PODIUM_LIP), m(roomHeight), planZ(BUILDING.d + PODIUM_LIP)),
  );

  return { group, parts, tapTargets, rooms, bounds, frameBox };
}
