// Lays out the contents of every room from data (content.js + catalogue.js).
//
//   furniture   kit pieces, merged into one mesh per material per room
//   ghosts      true-size placeholder volumes for machines not modelled yet
//   holders     empty slots, already in position, that the real machines are
//               loaded into after first paint (see main.js)
//   tapTargets  one invisible box per machine: generous, cheap touch targets
//   footprints  the box every placed thing occupies (used by `npm run check` to
//               catch furniture in walls, blocked doors and overlaps)
import * as THREE from 'three';
import { createKitPiece } from '../assets/kit/index.js';
import { describeEquipment, describeWorkbench } from '../assets/registry.js';
import { GeometryBatch } from '../core/batch.js';
import { preciseBox } from '../core/measure.js';
import { PALETTE } from '../core/palette.js';
import { m, mm, toMm } from '../core/units.js';
import { EQUIPMENT } from './catalogue.js';
import { ROOM_CONTENT, STATIONS } from './content.js';

const FACING = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const MIN_TAP_SIZE = m(0.24); // small machines still get a finger-sized target
const CHAIR_GAP = 380; // mm from the bench's front edge to the chair

const _rotation = new THREE.Matrix4();
const _translation = new THREE.Matrix4();
const BOX_EDGES = [0, 1, 1, 3, 3, 2, 2, 0, 4, 5, 5, 7, 7, 6, 6, 4, 0, 4, 1, 5, 2, 6, 3, 7];

/** Deterministic value in [-1, 1]: natural-looking variety that never changes between loads. */
function jitter(n) {
  const x = Math.sin(n * 91.7 + 13.3) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** parent · translate(x, y, z) · rotateY(angle), all in scene units. */
function childMatrix(parent, x, y, z, angle = 0) {
  return new THREE.Matrix4()
    .copy(parent)
    .multiply(_translation.makeTranslation(x, y, z))
    .multiply(_rotation.makeRotationY(angle));
}

function boxCorners(box) {
  const { min, max } = box;
  const corners = [];
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) corners.push(new THREE.Vector3(x, y, z));
  return corners;
}

export function buildRooms(shell) {
  const furniture = new THREE.Group();
  furniture.name = 'furniture';
  const ghosts = new THREE.Group();
  ghosts.name = 'planned-equipment';
  const holders = new THREE.Group();
  holders.name = 'equipment';
  const tapTargets = new THREE.Group();
  tapTargets.name = 'equipment-tap-targets';
  tapTargets.visible = false;

  const items = new Map();
  const itemsByRoom = new Map();
  const stations = [];
  const footprints = [];
  const occupy = (roomId, what, level, localBox, matrix) => {
    const box = new THREE.Box3().setFromPoints(boxCorners(localBox).map((corner) => corner.applyMatrix4(matrix)));
    footprints.push({ roomId, what, level, box });
  };
  const ghostBatch = new GeometryBatch();
  const ghostEdges = [];
  const workbench = describeWorkbench();
  let chairCount = 0;

  /** Register one machine (built or planned) standing at `matrix`; `level` is 'floor' or 'worktop'. */
  function addEquipment(typeId, roomId, matrix, level) {
    const entry = EQUIPMENT[typeId];
    if (!entry) throw new Error(`content.js places "${typeId}", which is not in catalogue.js`);
    const built = entry.status === 'built';
    const library = built ? describeEquipment(typeId) : null;
    if (built && !library) throw new Error(`"${typeId}" is marked built but is not in the imported asset library`);

    const sizeMm = built ? library.sizeMm : entry.sizeMm;
    const localBox = built
      ? library.box.clone()
      : new THREE.Box3(new THREE.Vector3(mm(-sizeMm.w / 2), 0, mm(-sizeMm.d / 2)), new THREE.Vector3(mm(sizeMm.w / 2), mm(sizeMm.h), mm(sizeMm.d / 2)));
    const corners = boxCorners(localBox).map((corner) => corner.applyMatrix4(matrix));
    const worldBox = new THREE.Box3().setFromPoints(corners);
    footprints.push({ roomId, what: typeId, level, box: worldBox });

    const roomItems = itemsByRoom.get(roomId);
    const repeats = roomItems.filter((other) => other.typeId === typeId).length;
    const id = `${roomId}/${typeId}${repeats ? `-${repeats + 1}` : ''}`;

    const item = {
      id,
      typeId,
      roomId,
      status: entry.status,
      /** Not modelled, but the real machine is known (catalogue.js `known`). */
      known: !built && entry.known === true,
      name: built ? library.name : entry.name,
      shortName: entry.shortName ?? (built ? library.name : entry.name),
      kind: entry.kind,
      icon: entry.icon ?? 'machine',
      description: built ? library.description : null,
      sizeMm,
      canExplode: built && library.canExplode,
      matrix,
      box: worldBox,
      /** Unit vector pointing out of the machine's front, on the floor plane. */
      front: new THREE.Vector3(0, 0, 1).transformDirection(matrix),
      holder: null,
      asset: null, // filled in when the model has loaded: { hero, lite, … }
      tier: null,
    };

    // Tap target: the machine's box, padded up to a finger-friendly minimum.
    const size = localBox.getSize(new THREE.Vector3());
    const center = localBox.getCenter(new THREE.Vector3());
    const target = new THREE.Mesh(UNIT_BOX, PALETTE.ghost);
    target.matrixAutoUpdate = false;
    target.matrix
      .copy(matrix)
      .multiply(_translation.makeTranslation(center.x, center.y, center.z))
      .scale(new THREE.Vector3(Math.max(size.x, MIN_TAP_SIZE), Math.max(size.y, MIN_TAP_SIZE), Math.max(size.z, MIN_TAP_SIZE)));
    target.matrixWorldNeedsUpdate = true;
    target.userData = { type: 'item', itemId: id, roomId };
    tapTargets.add(target);

    const volume = new THREE.Matrix4().copy(matrix).multiply(_translation.makeTranslation(center.x, center.y, center.z)).scale(size);
    if (built) {
      // A slot at the right place; main.js loads the model into it. Until then a
      // neutral volume shows where the machine will appear.
      const holder = new THREE.Group();
      holder.name = id;
      holder.matrixAutoUpdate = false;
      holder.matrix.copy(matrix);
      holder.matrixWorldNeedsUpdate = true;
      const loading = new THREE.Mesh(UNIT_BOX, PALETTE.cabinet);
      loading.name = 'loading-volume';
      loading.position.copy(center);
      loading.scale.copy(size);
      loading.castShadow = true;
      holder.add(loading);
      holders.add(holder);
      item.holder = holder;
    } else {
      ghostBatch.addGeometry(UNIT_BOX, PALETTE.ghost, volume, { castShadow: false, receiveShadow: false });
      for (const index of BOX_EDGES) ghostEdges.push(corners[index].x, corners[index].y, corners[index].z);
    }

    items.set(id, item);
    roomItems.push(item);
    return item;
  }

  for (const [roomId, entries] of Object.entries(ROOM_CONTENT)) {
    const room = shell.rooms.get(roomId);
    if (!room) throw new Error(`content.js has contents for "${roomId}", which is not a room in layout.js`);
    itemsByRoom.set(roomId, []);
    const batch = new GeometryBatch();

    const place = (entry) =>
      childMatrix(
        new THREE.Matrix4().makeTranslation(room.origin.x, 0, room.origin.z),
        m(entry.at[0]),
        m(entry.y ?? 0),
        m(entry.at[1]),
        FACING[entry.face ?? 'S'],
      );

    /** Place a kit piece into this room's furniture batch. */
    const addPiece = (kitId, params, matrix, level) => {
      const piece = createKitPiece(kitId, params);
      occupy(roomId, kitId, level, preciseBox(piece), matrix);
      batch.addObject(piece, matrix);
    };

    const addChair = (parent, xMm, frontEdgeMm) => {
      const n = ++chairCount;
      const matrix = childMatrix(parent, mm(xMm + jitter(n) * 40), 0, mm(frontEdgeMm + CHAIR_GAP + jitter(n + 0.5) * 50), Math.PI + jitter(n + 0.25) * 0.35);
      addPiece('task-chair', undefined, matrix, 'chair');
    };

    for (const entry of entries) {
      const matrix = place(entry);

      if (entry.station) {
        // One of the asset library's own benches, composed exactly as approved there.
        const station = STATIONS[entry.station];
        const table = workbench.tables[station.table];
        const cx = (table.box.min[0] + table.box.max[0]) / 2;
        const cz = (table.box.min[2] + table.box.max[2]) / 2;
        // Library bench coordinates → world: centre the table, stand it on the floor.
        const benchMatrix = childMatrix(matrix, -cx, -workbench.floorY, -cz);
        const holder = new THREE.Group();
        holder.name = `station:${entry.station}`;
        holder.matrixAutoUpdate = false;
        holder.matrix.copy(benchMatrix);
        holder.matrixWorldNeedsUpdate = true;
        holders.add(holder);
        stations.push({ key: entry.station, tableKey: station.table, roomId, holder });
        occupy(roomId, `station:${entry.station}`, 'floor', new THREE.Box3(new THREE.Vector3().fromArray(table.box.min), new THREE.Vector3().fromArray(table.box.max)), benchMatrix);
        for (const typeId of station.equipment) {
          const [bx, by, bz] = describeEquipment(typeId).benchPosition;
          addEquipment(typeId, roomId, childMatrix(benchMatrix, bx, by, bz), 'worktop');
        }
        const frontEdge = toMm((table.box.max[2] - table.box.min[2]) / 2);
        for (const x of entry.seats ?? []) addChair(matrix, x, frontEdge);
        continue;
      }

      if (entry.equipment) {
        addEquipment(entry.equipment, roomId, matrix, 'floor');
        continue;
      }

      addPiece(entry.kit, entry.params, matrix, entry.y ? 'wall' : 'floor');
      if (entry.kit !== 'bench') continue;

      const height = entry.params?.height ?? 850;
      const depth = entry.params?.depth ?? 700;
      for (const x of entry.seats ?? []) addChair(matrix, x, depth / 2);
      for (const thing of entry.on ?? []) {
        if (thing.equipment) {
          const size = EQUIPMENT[thing.equipment]?.sizeMm ?? { d: 300 };
          const z = thing.z ?? -depth / 2 + 70 + size.d / 2; // towards the back of the worktop
          addEquipment(thing.equipment, roomId, childMatrix(matrix, mm(thing.x ?? 0), mm(height), mm(z), FACING[thing.face ?? 'S']), 'worktop');
        } else {
          addPiece(thing.kit, thing.params, childMatrix(matrix, mm(thing.x ?? 0), mm(height), mm(thing.z ?? -40), FACING[thing.face ?? 'S']), 'worktop');
        }
      }
    }

    if (!batch.isEmpty) furniture.add(batch.build(`furniture:${roomId}`));
  }

  if (!ghostBatch.isEmpty) {
    const volumes = ghostBatch.build('planned-volumes');
    volumes.traverse((obj) => {
      obj.renderOrder = 2; // after glass, so the tint reads through partitions
    });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ghostEdges, 3));
    const edges = new THREE.LineSegments(edgeGeometry, PALETTE.ghostEdge);
    edges.name = 'planned-edges';
    edges.renderOrder = 3;
    ghosts.add(volumes, edges);
  }

  return { furniture, ghosts, holders, tapTargets, items, itemsByRoom, stations, footprints };
}
