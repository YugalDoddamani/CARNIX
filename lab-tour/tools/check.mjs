// npm run check — builds the whole lab without a browser and verifies the
// things that are easy to get wrong when editing the data files:
//
//   • every kit piece measures what its `meta.sizeMm` says, and stands on the floor
//   • the catalogue and the room contents refer to things that exist
//   • nothing pokes through a wall, blocks a door, or overlaps its neighbour
//   • machines fit on the bench they are placed on
//   • every imported machine builds, and its baked ("lite") form is identical in size
//   • the scene stays inside its drawing budget
//
// Exit code 1 if any check fails. Warnings do not fail the run.
import './lib/node-env.mjs';

const js = (path) => new URL(`../js/${path}`, import.meta.url).href;
const THREE = await import('three');
const { KIT } = await import(js('assets/kit/index.js'));
const { createEquipment, createWorkbench, describeEquipment } = await import(js('assets/registry.js'));
const { LEGACY_ASSETS } = await import(js('assets/legacy/manifest.js'));
const { bakeLite } = await import(js('core/batch.js'));
const { preciseBox, sceneStats } = await import(js('core/measure.js'));
const { m, toM, toMm } = await import(js('core/units.js'));
const { EQUIPMENT } = await import(js('rooms/catalogue.js'));
const { ROOM_CONTENT, STATIONS } = await import(js('rooms/content.js'));
const { buildRooms } = await import(js('rooms/build-rooms.js'));
const { buildShell, planX, planZ } = await import(js('shell/build-shell.js'));
const { BUILDING, ROOMS, WALL, WALLS } = await import(js('shell/layout.js'));

// What the tour is allowed to cost. Deliberately generous for now; tighten as
// real content arrives and phones are tested.
const BUDGET = { drawCalls: 400, triangles: 450_000 };
const SIZE_TOLERANCE_MM = 15;
const DOOR_CLEARANCE_M = 0.8;
const EPS = m(0.005);

const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);
const section = (title) => console.log(`\n${title}`);
const fmt = (n) => Math.round(n).toLocaleString('en-US');

// ── 1. Kit pieces ────────────────────────────────────────────────────────────
section('Kit furniture');
for (const [id, piece] of Object.entries(KIT)) {
  const box = preciseBox(piece.create());
  const size = box.getSize(new THREE.Vector3());
  const measured = { w: toMm(size.x), d: toMm(size.z), h: toMm(size.y) };
  const declared = piece.meta.sizeMm;
  const off = ['w', 'd', 'h'].filter((axis) => Math.abs(measured[axis] - declared[axis]) > SIZE_TOLERANCE_MM);
  if (off.length) fail(`kit "${id}": meta.sizeMm says ${declared.w}×${declared.d}×${declared.h} but the model measures ${fmt(measured.w)}×${fmt(measured.d)}×${fmt(measured.h)} mm`);
  if (piece.meta.mount !== 'wall' && Math.abs(toMm(box.min.y)) > 1) fail(`kit "${id}": does not stand on y = 0 (lowest point ${toMm(box.min.y).toFixed(1)} mm)`);
  console.log(`  ${id.padEnd(16)} ${`${fmt(measured.w)} × ${fmt(measured.d)} × ${fmt(measured.h)} mm`.padEnd(24)} ${off.length ? '✗' : '✓'}`);
}

// ── 2. Catalogue and content references ──────────────────────────────────────
section('Catalogue');
const libraryIds = new Set(LEGACY_ASSETS.map((asset) => asset.id));
for (const [id, entry] of Object.entries(EQUIPMENT)) {
  if (entry.status === 'built') {
    if (!libraryIds.has(id)) fail(`catalogue "${id}" is marked built but is not in the imported asset library`);
  } else if (entry.status === 'planned') {
    if (!entry.name || !entry.kind) fail(`catalogue "${id}" needs a name and a kind`);
    if (!entry.sizeMm || !(entry.sizeMm.w > 0 && entry.sizeMm.d > 0 && entry.sizeMm.h > 0)) fail(`catalogue "${id}" needs sizeMm { w, d, h }`);
    if (!['bench', 'floor'].includes(entry.mount)) fail(`catalogue "${id}" needs mount: 'bench' or 'floor'`);
  } else {
    fail(`catalogue "${id}" has unknown status "${entry.status}"`);
  }
}
for (const id of libraryIds) if (!EQUIPMENT[id]) warn(`library asset "${id}" is not in the catalogue, so it cannot be placed`);

const used = new Set();
const roomIds = new Set(ROOMS.map((room) => room.id));
for (const [roomId, entries] of Object.entries(ROOM_CONTENT)) {
  if (!roomIds.has(roomId)) fail(`content.js has contents for "${roomId}", which is not a room in layout.js`);
  for (const entry of entries) {
    if (entry.station) {
      if (!STATIONS[entry.station]) fail(`${roomId}: unknown station "${entry.station}"`);
      else STATIONS[entry.station].equipment.forEach((id) => used.add(id));
    } else if (entry.equipment) {
      used.add(entry.equipment);
      if (!EQUIPMENT[entry.equipment]) fail(`${roomId}: "${entry.equipment}" is not in catalogue.js`);
      else if (EQUIPMENT[entry.equipment].mount === 'bench') fail(`${roomId}: "${entry.equipment}" is a bench-top machine but is placed on the floor`);
    } else if (!KIT[entry.kit]) {
      fail(`${roomId}: unknown kit piece "${entry.kit}"`);
    }

    // Things standing on a bench: must fit on the worktop and not overlap.
    if (entry.kit === 'bench' && entry.on) {
      const length = entry.params?.length ?? 1800;
      const depth = entry.params?.depth ?? 700;
      const spans = [];
      for (const thing of entry.on) {
        let width;
        if (thing.equipment) {
          used.add(thing.equipment);
          const type = EQUIPMENT[thing.equipment];
          if (!type) {
            fail(`${roomId}: "${thing.equipment}" is not in catalogue.js`);
            continue;
          }
          if (type.mount === 'floor') fail(`${roomId}: "${thing.equipment}" is floor-standing but is placed on a bench`);
          const size = type.sizeMm ?? describeEquipment(thing.equipment).sizeMm;
          width = size.w;
          if (size.d > depth) fail(`${roomId}: "${thing.equipment}" (${size.d} mm deep) is deeper than its bench (${depth} mm)`);
        } else if (KIT[thing.kit]) {
          width = KIT[thing.kit].meta.sizeMm.w;
        } else {
          fail(`${roomId}: unknown kit piece "${thing.kit}" on a bench`);
          continue;
        }
        const name = thing.equipment ?? thing.kit;
        const x = thing.x ?? 0;
        if (Math.abs(x) + width / 2 > length / 2) fail(`${roomId}: "${name}" at x = ${x} overhangs the end of its ${length} mm bench`);
        spans.push({ name, from: x - width / 2, to: x + width / 2 });
      }
      spans.sort((a, b) => a.from - b.from);
      for (let i = 1; i < spans.length; i++) {
        if (spans[i].from < spans[i - 1].to) fail(`${roomId}: "${spans[i - 1].name}" and "${spans[i].name}" overlap on their bench by ${fmt(spans[i - 1].to - spans[i].from)} mm`);
      }
    }
  }
}
for (const id of Object.keys(EQUIPMENT)) if (!used.has(id)) warn(`catalogue "${id}" is not placed in any room`);
const builtCount = Object.values(EQUIPMENT).filter((entry) => entry.status === 'built').length;
console.log(`  ${Object.keys(EQUIPMENT).length} machine types: ${builtCount} built, ${Object.keys(EQUIPMENT).length - builtCount} planned`);

// ── 3. Floor plan ────────────────────────────────────────────────────────────
section('Floor plan');
for (const room of ROOMS) {
  if (room.x < 0 || room.z < 0 || room.x + room.w > BUILDING.w + 1e-9 || room.z + room.d > BUILDING.d + 1e-9) fail(`room "${room.id}" extends outside the building`);
  for (const other of ROOMS) {
    if (other === room || other.id < room.id) continue;
    const overlapX = Math.min(room.x + room.w, other.x + other.w) - Math.max(room.x, other.x);
    const overlapZ = Math.min(room.z + room.d, other.z + other.d) - Math.max(room.z, other.z);
    if (overlapX > 1e-9 && overlapZ > 1e-9) fail(`rooms "${room.id}" and "${other.id}" overlap`);
  }
}
for (const wall of WALLS) {
  const [x1, z1, x2, z2] = wall.line;
  if (x1 !== x2 && z1 !== z2) fail(`wall ${wall.line} is diagonal; walls must run along x or z`);
  const length = x1 === x2 ? z2 - z1 : x2 - x1;
  if (!(length > 0)) fail(`wall ${wall.line} must run in the +x or +z direction`);
  const doors = (wall.doors ?? []).map((door) => ({ from: door.at - (door.width ?? WALL.doorWidth) / 2, to: door.at + (door.width ?? WALL.doorWidth) / 2 })).sort((a, b) => a.from - b.from);
  doors.forEach((door, i) => {
    if (door.from < 0 || door.to > length) fail(`a door on wall ${wall.line} falls off the end of the wall`);
    if (i && door.from < doors[i - 1].to) fail(`two doors on wall ${wall.line} overlap`);
  });
}
console.log(`  ${ROOMS.length} rooms, ${WALLS.length} walls, ${WALLS.reduce((n, wall) => n + (wall.doors?.length ?? 0), 0)} doors in a ${BUILDING.w} × ${BUILDING.d} m building`);

// Sections 4–6 need the lab to actually build. If the data is too broken for
// that, say why and still print the report instead of a stack trace.
async function checkBuiltLab() {
  // ── 4. Placement ─────────────────────────────────────────────────────────────
  section('Placement');
  const shell = buildShell();
  const lab = buildRooms(shell);
  const half = m(WALL.thickness / 2);
  const describe = (print) => `${print.roomId}: "${print.what}"`;

  for (const print of lab.footprints) {
    const room = shell.rooms.get(print.roomId).box;
    const out = Math.max(room.min.x + half - print.box.min.x, print.box.max.x - (room.max.x - half), room.min.z + half - print.box.min.z, print.box.max.z - (room.max.z - half));
    if (out > EPS) fail(`${describe(print)} is ${fmt(toMm(out))} mm into a wall or outside its room`);
    if (print.level === 'floor' && Math.abs(print.box.min.y) > EPS) fail(`${describe(print)} should stand on the floor but its base is at ${fmt(toMm(print.box.min.y))} mm`);
  }

  // Solid things must not occupy the same space. Chairs are skipped (they tuck
  // under worktops); bench-top things are checked against each other only.
  const overlapVolume = (a, b) => {
    const dx = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const dy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    const dz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
    return dx > EPS && dy > EPS && dz > EPS ? toMm(Math.min(dx, dy, dz)) : 0;
  };
  for (const level of ['floor', 'worktop']) {
    const group = lab.footprints.filter((print) => print.level === level);
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].roomId !== group[j].roomId) continue;
        const depth = overlapVolume(group[i].box, group[j].box);
        if (depth) fail(`${describe(group[i])} and "${group[j].what}" overlap by ${fmt(depth)} mm`);
      }
    }
  }
  const chairs = lab.footprints.filter((print) => print.level === 'chair');
  for (let i = 0; i < chairs.length; i++) {
    for (let j = i + 1; j < chairs.length; j++) {
      if (chairs[i].roomId === chairs[j].roomId && overlapVolume(chairs[i].box, chairs[j].box) > 60) fail(`${chairs[i].roomId}: two chairs overlap`);
    }
  }

  // Doors need a clear path on both sides.
  let doorCount = 0;
  for (const wall of WALLS) {
    const [x1, z1, x2, z2] = wall.line;
    const alongX = z1 === z2;
    for (const door of wall.doors ?? []) {
      doorCount++;
      const width = door.width ?? WALL.doorWidth;
      const zone = new THREE.Box3();
      if (alongX) {
        zone.min.set(planX(x1 + door.at - width / 2), 0, planZ(z1 - DOOR_CLEARANCE_M));
        zone.max.set(planX(x1 + door.at + width / 2), m(WALL.doorHeight), planZ(z1 + DOOR_CLEARANCE_M));
      } else {
        zone.min.set(planX(x1 - DOOR_CLEARANCE_M), 0, planZ(z1 + door.at - width / 2));
        zone.max.set(planX(x1 + DOOR_CLEARANCE_M), m(WALL.doorHeight), planZ(z1 + door.at + width / 2));
      }
      for (const print of lab.footprints) {
        if (overlapVolume(zone, print.box)) fail(`${describe(print)} blocks the door at ${door.at} m on wall [${wall.line}]`);
      }
    }
  }
  console.log(`  ${lab.footprints.length} placed objects, ${lab.items.size} machines, ${doorCount} doors checked`);

  // ── 5. Imported machines ─────────────────────────────────────────────────────
  section('Imported machines (hero → lite)');
  let liteDraws = 0;
  let machineTriangles = 0;
  const builtInstances = [...lab.items.values()].filter((item) => item.status === 'built');
  for (const item of builtInstances) {
    const asset = await createEquipment(item.typeId);
    const lite = bakeLite(asset.root);
    const hero = sceneStats(asset.root);
    const baked = sceneStats(lite);
    const sizeDelta = preciseBox(asset.root).getSize(new THREE.Vector3()).sub(preciseBox(lite).getSize(new THREE.Vector3())).length();
    if (hero.triangles !== baked.triangles) fail(`"${item.typeId}": baking changed the triangle count (${hero.triangles} → ${baked.triangles})`);
    if (sizeDelta > 1e-4) fail(`"${item.typeId}": baked form is a different size from the original`);
    if (Object.keys(asset.parts).length === 0) fail(`"${item.typeId}": no sub-assemblies found`);
    liteDraws += baked.drawCalls;
    machineTriangles += baked.triangles;
    console.log(`  ${item.typeId.padEnd(24)} ${String(hero.drawCalls).padStart(3)} → ${String(baked.drawCalls).padStart(2)} draw calls   ${fmt(baked.triangles).padStart(7)} triangles`);
    asset.dispose();
  }
  let tableDraws = 0;
  let tableTriangles = 0;
  if (lab.stations.length) {
    const bench = await createWorkbench();
    for (const station of lab.stations) {
      const stats = sceneStats(bakeLite(bench.tables[station.tableKey]));
      tableDraws += stats.drawCalls;
      tableTriangles += stats.triangles;
    }
    bench.dispose();
  }

  // ── 6. Budget ────────────────────────────────────────────────────────────────
  section('Drawing budget (overview, everything visible)');
  const shellStats = sceneStats(shell.group);
  const furnitureStats = sceneStats(lab.furniture);
  const ghostStats = sceneStats(lab.ghosts);
  const rows = [
    ['Building shell', shellStats.drawCalls, shellStats.triangles],
    ['Furniture (6 rooms)', furnitureStats.drawCalls, furnitureStats.triangles],
    ['Planned placeholders', ghostStats.drawCalls + 1, ghostStats.triangles],
    ['Library benches', tableDraws, tableTriangles],
    [`Machines, lite (${builtInstances.length})`, liteDraws, machineTriangles],
  ];
  const total = rows.reduce((sum, row) => [sum[0] + row[1], sum[1] + row[2]], [0, 0]);
  for (const [name, draws, triangles] of rows) console.log(`  ${name.padEnd(24)} ${String(draws).padStart(4)} draw calls ${fmt(triangles).padStart(9)} triangles`);
  console.log(`  ${'TOTAL'.padEnd(24)} ${String(total[0]).padStart(4)} draw calls ${fmt(total[1]).padStart(9)} triangles   (budget ${BUDGET.drawCalls} / ${fmt(BUDGET.triangles)})`);
  if (total[0] > BUDGET.drawCalls) fail(`draw calls ${total[0]} exceed the budget of ${BUDGET.drawCalls}`);
  if (total[1] > BUDGET.triangles) fail(`triangles ${fmt(total[1])} exceed the budget of ${fmt(BUDGET.triangles)}`);
  const building = preciseBox(shell.group).getSize(new THREE.Vector3());
  console.log(`  Building as built: ${toM(building.x).toFixed(2)} × ${toM(building.z).toFixed(2)} m, ${toM(building.y).toFixed(2)} m tall`);
}

try {
  await checkBuiltLab();
} catch (error) {
  fail(`the lab could not be built, so placement and budget were not checked: ${error.message}`);
}

// ── Result ───────────────────────────────────────────────────────────────────
if (warnings.length) {
  section(`Warnings (${warnings.length})`);
  for (const message of warnings) console.log(`  ! ${message}`);
}
if (failures.length) {
  section(`FAILED (${failures.length})`);
  for (const message of failures) console.log(`  ✗ ${message}`);
  process.exit(1);
}
console.log('\nAll checks passed.');
