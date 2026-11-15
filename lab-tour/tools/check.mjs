// npm run check — builds the whole lab without a browser and verifies the
// things that are easy to get wrong when editing the data files:
//
//   • every kit piece measures what its `meta.sizeMm` says, and stands on the floor
//   • the catalogue and the room contents refer to things that exist
//   • what the visitor reads (knowledge.js) is complete: every machine has a
//     description, every figure a source, every icon and brand exists; and it
//     lists the notes that still need the lab's confirmation
//   • a machine's guides (how-to.js) are complete and name their source, and
//     every step that points at the machine points at something: the part is
//     in the model, and each mark is in plain sight from the side the step
//     looks from, with the lid as the step has it
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
const { VIEWER_ASSETS } = await import(js('assets/viewers/manifest.js'));
const { bakeLite } = await import(js('core/batch.js'));
const { isShown, preciseBox, sceneStats } = await import(js('core/measure.js'));
const { findPlaces, sightOf } = await import(js('core/places.js'));
const { m, toM, toMm } = await import(js('core/units.js'));
const { EQUIPMENT } = await import(js('rooms/catalogue.js'));
const { ROOM_CONTENT, STATIONS } = await import(js('rooms/content.js'));
const { HOW_TO } = await import(js('rooms/how-to.js'));
const { BRANDS, GUIDE, MACHINE_INFO, ROOM_INFO, ROUTE } = await import(js('rooms/knowledge.js'));
const { ICONS, UI } = await import(js('ui/icons.js'));
const { buildRooms } = await import(js('rooms/build-rooms.js'));
const { buildShell, planX, planZ } = await import(js('shell/build-shell.js'));
const { BUILDING, ROOMS, WALL, WALLS } = await import(js('shell/layout.js'));

// What the tour is allowed to cost. Deliberately generous for now; tighten as
// real content arrives and phones are tested.
const BUDGET = { drawCalls: 400, triangles: 450_000 };
const SIZE_TOLERANCE_MM = 15;
const DOOR_CLEARANCE_M = 0.8;
const SHORT_NAME_FITS = 14; // letters of a machine's short name that fit on the first pill of its panel
const STEP_TEXT_FITS = 215; // letters of a guide's step that can be read on a phone without scrolling (five lines on a screen 360 px wide)
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
// Models come from the asset library and from single-machine viewer files.
const libraryIds = new Set([...LEGACY_ASSETS, ...VIEWER_ASSETS].map((asset) => asset.id));
for (const asset of VIEWER_ASSETS) {
  if (LEGACY_ASSETS.some((other) => other.id === asset.id)) fail(`"${asset.id}" was imported twice: from the asset library and from the viewer ${asset.source?.file}. The tour uses the library's; remove the entry from js/assets/viewers/manifest.js and delete js/assets/viewers/${asset.id}.js`);
  if (!asset.source?.file || !/^[0-9a-f]{64}$/.test(asset.source?.sha256 ?? '')) fail(`viewer model "${asset.id}" does not say which file it came from`);
}
for (const [id, entry] of Object.entries(EQUIPMENT)) {
  if (entry.known !== undefined && entry.known !== true) fail(`catalogue "${id}": \`known\` is either true or left out`);
  if (entry.status === 'built') {
    if (!libraryIds.has(id)) fail(`catalogue "${id}" is marked built but its 3D model has not been imported (not in the asset library, nor from a viewer file)`);
    if (entry.known) fail(`catalogue "${id}": \`known\` is for machines without a 3D model; a built machine does not need it`);
  } else if (entry.status === 'planned') {
    if (libraryIds.has(id)) warn(`catalogue "${id}" is still marked planned, but its 3D model has been imported: set status: 'built'`);
    if (!entry.name || !entry.kind) fail(`catalogue "${id}" needs a name and a kind`);
    if (!entry.sizeMm || !(entry.sizeMm.w > 0 && entry.sizeMm.d > 0 && entry.sizeMm.h > 0)) fail(`catalogue "${id}" needs sizeMm { w, d, h }`);
    if (!['bench', 'floor'].includes(entry.mount)) fail(`catalogue "${id}" needs mount: 'bench' or 'floor'`);
  } else {
    fail(`catalogue "${id}" has unknown status "${entry.status}"`);
  }
}
for (const id of libraryIds) if (!EQUIPMENT[id]) warn(`imported model "${id}" is not in the catalogue, so it cannot be placed`);

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
          const size = type.sizeMm ?? describeEquipment(thing.equipment)?.sizeMm;
          if (!size) continue; // no size to check with; the catalogue section has reported it
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
const knownIds = Object.keys(EQUIPMENT).filter((id) => EQUIPMENT[id].status === 'planned' && EQUIPMENT[id].known);
console.log(`  ${Object.keys(EQUIPMENT).length} machine types: ${builtCount} built, ${Object.keys(EQUIPMENT).length - builtCount} planned`);
if (knownIds.length) console.log(`  of the planned, known machines waiting for their 3D model: ${knownIds.join(', ')}`);

// ── 3. What the visitor reads ────────────────────────────────────────────────
section('What the visitor reads');
const isText = (value) => typeof value === 'string' && value.trim().length > 0 && value === value.trim() && !/\s{2,}/.test(value);
const needText = (value, where) => isText(value) || fail(`${where} is missing, or has stray spaces`);
function checkSources(sources, where) {
  for (const [index, source] of (sources ?? []).entries()) {
    needText(source?.label, `${where}: source ${index + 1} label`);
    let url = null;
    try {
      url = new URL(source?.url);
    } catch {
      // reported below
    }
    if (!url || !/^https?:$/.test(url.protocol)) fail(`${where}: source ${index + 1} needs a full web address (got "${source?.url}")`);
  }
}

// The guide and the route
for (const field of ['eyebrow', 'title', 'lead', 'start', 'skip', 'reopen']) needText(GUIDE[field], `knowledge.js GUIDE.${field}`);
if (!Array.isArray(GUIDE.steps) || !GUIDE.steps.length) fail('knowledge.js GUIDE.steps needs at least one step');
for (const [index, step] of (GUIDE.steps ?? []).entries()) {
  needText(step.title, `GUIDE step ${index + 1} title`);
  needText(step.text, `GUIDE step ${index + 1} text`);
  if (!ICONS[step.icon] && !UI[step.icon]) fail(`GUIDE step ${index + 1}: no icon called "${step.icon}" in icons.js`);
}
for (const id of ROUTE) if (!roomIds.has(id)) fail(`knowledge.js ROUTE lists "${id}", which is not a room in layout.js`);
if (new Set(ROUTE).size !== ROUTE.length) fail('knowledge.js ROUTE visits a room twice');
for (const room of ROOMS) {
  if (!ROUTE.includes(room.id)) warn(`room "${room.id}" is not on the ROUTE in knowledge.js; it is added as the last stop`);
  if (!ICONS[room.icon]) fail(`room "${room.id}": no icon called "${room.icon}" in icons.js`);
  if (!isText(room.tab)) warn(`room "${room.id}" has no \`tab\` (its one-word name on the navigation bar); the full name is used`);
  else if (room.tab.length > 9) warn(`room "${room.id}": tab "${room.tab}" is long for a phone's navigation bar (9 letters fit)`);
  needText(ROOM_INFO[room.id]?.about, `knowledge.js ROOM_INFO.${room.id}.about (what happens in the room)`);
}
for (const id of Object.keys(ROOM_INFO)) if (!roomIds.has(id)) fail(`knowledge.js ROOM_INFO has "${id}", which is not a room in layout.js`);

// Makers
const usedBrands = new Set();
for (const [id, brand] of Object.entries(BRANDS)) {
  needText(brand.name, `brand "${id}" name`);
  needText(brand.about, `brand "${id}" about`);
  if (brand.place !== undefined) needText(brand.place, `brand "${id}" place`);
  if (brand.since !== undefined && !(Number.isInteger(brand.since) && brand.since > 1800 && brand.since <= new Date().getFullYear())) fail(`brand "${id}": \`since\` should be a year`);
  if (!brand.sources?.length) fail(`brand "${id}" has no source for what is said about it`);
  checkSources(brand.sources, `brand "${id}"`);
}

// Machines
const toConfirm = [];
const pills = { about: 0, features: 0, capabilities: 0 };
for (const id of Object.keys(MACHINE_INFO)) if (!EQUIPMENT[id]) fail(`knowledge.js describes "${id}", which is not in catalogue.js`);
for (const [id, entry] of Object.entries(EQUIPMENT)) {
  if (!ICONS[entry.icon]) fail(`catalogue "${id}": ${entry.icon ? `no icon called "${entry.icon}" in icons.js` : 'needs an icon'}`);
  const info = MACHINE_INFO[id];
  if (!info) {
    fail(`"${id}" has no entry in knowledge.js; a visitor who taps it would learn nothing`);
    continue;
  }
  const where = `knowledge.js "${id}"`;
  needText(info.summary, `${where} summary`);
  if (info.how !== undefined) needText(info.how, `${where} how`);
  if (info.brand !== undefined) {
    if (!BRANDS[info.brand]) fail(`${where}: brand "${info.brand}" is not in BRANDS`);
    else {
      usedBrands.add(info.brand);
      pills.about++;
    }
  }
  if (info.features !== undefined) {
    if (!Array.isArray(info.features) || !info.features.length) fail(`${where}: features should be a list of { label, value }`);
    for (const [index, feature] of (Array.isArray(info.features) ? info.features : []).entries()) {
      needText(feature?.label, `${where} feature ${index + 1} label`);
      needText(feature?.value, `${where} feature ${index + 1} value`);
      if (feature?.note !== undefined) needText(feature.note, `${where} feature ${index + 1} note`);
    }
    // The rule this file exists for: no figure without a source.
    if (!info.sources?.length) fail(`${where} has figures but no source for them`);
    pills.features++;
  }
  if (info.featuresNote !== undefined) needText(info.featuresNote, `${where} featuresNote`);
  if (info.capabilities !== undefined) {
    if (!Array.isArray(info.capabilities) || !info.capabilities.length) fail(`${where}: capabilities should be a list of sentences`);
    for (const [index, point] of (Array.isArray(info.capabilities) ? info.capabilities : []).entries()) needText(point, `${where} capability ${index + 1}`);
    pills.capabilities++;
  }
  checkSources(info.sources, where);
  if (entry.status === 'planned' && entry.known) {
    // "Known" is a claim: this is the lab's real machine. It has to be backed up.
    if (!info.brand) fail(`${where}: catalogue.js says the real machine is known, so name its maker (\`brand\`)`);
    if (!info.sources?.length) fail(`${where}: catalogue.js says the real machine is known, so give the source of its name and size`);
  } else if (entry.status === 'planned' && (info.brand || info.features)) {
    warn(`${where}: a planned machine has a maker or figures; is the real machine known now? Then give it its real name and size in catalogue.js and mark it \`known: true\``);
  }
  if (info.confirm !== undefined) {
    needText(info.confirm, `${where} confirm`);
    toConfirm.push([EQUIPMENT[id].shortName ?? EQUIPMENT[id].name ?? id, info.confirm]);
  }
  // The short name is the first of up to four pills in the machine's panel.
  // Measured in the browser: 14 letters just fit beside the other three; one
  // more and "Capabilities" is cut off.
  if (info.brand && info.features?.length && info.capabilities?.length && (entry.shortName?.length ?? 0) > SHORT_NAME_FITS) {
    warn(`catalogue "${id}": short name "${entry.shortName}" has ${entry.shortName.length} letters; with all four pills in the panel, ${SHORT_NAME_FITS} fit`);
  }
}
for (const id of Object.keys(BRANDS)) if (!usedBrands.has(id)) warn(`brand "${id}" is not used by any machine`);
const types = Object.keys(EQUIPMENT).length;
console.log(`  ${ROOMS.length} rooms described, route: ${ROUTE.join(' → ')}`);
console.log(`  ${types} machine types described · About on ${pills.about} · Features on ${pills.features} · Capabilities on ${pills.capabilities} · ${Object.keys(BRANDS).length} makers`);

// "How to use it": a machine's guides. Here what is written; further down, once
// the models are built, whether each step points at something (section 6).
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isPoint = (value) => Array.isArray(value) && (value.length === 3 || value.length === 4) && value.every(isNumber) && (value[3] === undefined || value[3] > 0);
const guided = { machines: 0, guides: 0, steps: 0, basic: [] };
for (const [id, entry] of Object.entries(HOW_TO)) {
  const where = `how-to.js "${id}"`;
  const type = EQUIPMENT[id];
  if (!type) {
    fail(`${where} is not a machine in catalogue.js`);
    continue;
  }
  guided.machines++;
  const built = type.status === 'built';
  const canOpen = Boolean(built && describeEquipment(id)?.canOpen);
  // The rule this file exists for: a guide retells the maker's instructions, and says which.
  if (!entry.source) fail(`${where} does not name the instructions its guides come from (\`source\`)`);
  else checkSources([entry.source], where);
  if (entry.note !== undefined) needText(entry.note, `${where} note`);
  // A basic guide: written without the maker's instructions, and saying so.
  if (entry.basic !== undefined) {
    needText(entry.basic, `${where} basic`);
    if (!isText(entry.confirm)) fail(`${where} is a basic guide: \`confirm\` has to list what it takes for granted`);
    guided.basic.push(type.shortName ?? type.name ?? id);
  }

  const places = entry.places ?? {};
  for (const [name, place] of Object.entries(places)) {
    const here = `${where} place "${name}"`;
    needText(place?.part, `${here}: \`part\` (the name of a group in the model)`);
    if (place?.at !== undefined && !isPoint(place.at) && !(Array.isArray(place.at) && place.at.length && place.at.every(isPoint))) fail(`${here}: \`at\` is a point [x, y, z] or a list of points (a fourth number is that ring's diameter)`);
    if (place?.size !== undefined && !(isNumber(place.size) && place.size > 0)) fail(`${here}: \`size\` is the diameter of its rings, in the model's units`);
    if (!(Array.isArray(place?.from) && place.from.length === 2 && place.from.every(isNumber))) fail(`${here}: \`from\` is [turn, tilt] in degrees, the side the camera looks from`);
    else if (place.from[1] < 2 || place.from[1] > 85) fail(`${here}: the camera cannot look from a tilt of ${place.from[1]}° (2 to 85)`);
    if (place?.show !== undefined && !isText(place.show) && !(isNumber(place.show) && place.show > 0)) fail(`${here}: \`show\` is a width in the model's units, or the name of a part`);
  }
  if (!built && Object.keys(places).length) fail(`${where} has places, but the machine has no 3D model to find them on`);

  const pointedAt = new Set();
  const guideIds = new Set();
  if (!Array.isArray(entry.guides) || !entry.guides.length) fail(`${where} needs at least one guide`);
  for (const [guideIndex, guide] of (Array.isArray(entry.guides) ? entry.guides : []).entries()) {
    const inGuide = `${where} guide ${guideIndex + 1}`;
    // Its name in the address: #/room/machine/how-to/<id>
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(guide?.id ?? '')) fail(`${inGuide}: \`id\` is its name in the address: lower-case letters, digits and hyphens (got "${guide?.id}")`);
    else if (guideIds.has(guide.id)) fail(`${inGuide}: another guide of this machine is called "${guide.id}" as well`);
    guideIds.add(guide?.id);
    needText(guide?.title, `${inGuide} title`);
    if (!Array.isArray(guide?.steps) || !guide.steps.length) fail(`${inGuide} needs at least one step`);
    guided.guides++;
    for (const [stepIndex, step] of (Array.isArray(guide?.steps) ? guide.steps : []).entries()) {
      const here = `${where} "${guide.id}" step ${stepIndex + 1}`;
      guided.steps++;
      needText(step?.title, `${here} title`);
      needText(step?.text, `${here} text`);
      if (isText(step?.text) && step.text.length > STEP_TEXT_FITS) warn(`${here} ("${step.title}") has ${step.text.length} letters; about ${STEP_TEXT_FITS} can be read on a phone without scrolling`);
      if (step?.at !== undefined) {
        if (!places[step.at]) fail(`${here}: \`at\` names "${step.at}", which is not one of the machine's places`);
        else pointedAt.add(step.at);
      }
      if (step?.open !== undefined && step.open !== true) fail(`${here}: \`open\` is either true or left out`);
      if (step?.open && !canOpen) fail(`${here}: \`open\`, but the machine's model has no lid or cover that opens`);
      if (step?.without !== undefined && !(Array.isArray(step.without) && step.without.length && step.without.every(isText))) fail(`${here}: \`without\` is a list of the names of parts of the model`);
      if (step?.without && !built) fail(`${here}: \`without\`, but the machine has no 3D model`);
    }
  }
  for (const name of Object.keys(places)) if (!pointedAt.has(name)) warn(`${where}: no step points at the place "${name}"`);
  if (entry.confirm !== undefined) {
    needText(entry.confirm, `${where} confirm`);
    toConfirm.push([`${type.shortName ?? type.name ?? id}, how to use it`, entry.confirm]);
  }
}
console.log(`  How to use it: ${guided.guides} guide${guided.guides === 1 ? '' : 's'} with ${guided.steps} steps for ${guided.machines} machine${guided.machines === 1 ? '' : 's'}`);
if (guided.basic.length) console.log(`  Basic guides, written without the maker's instructions for use: ${guided.basic.join(', ')}`);

// ── 4. Floor plan ────────────────────────────────────────────────────────────
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

// Sections 5–7 need the lab to actually build. If the data is too broken for
// that, say why and still print the report instead of a stack trace.
async function checkBuiltLab() {
  // ── 5. Placement ─────────────────────────────────────────────────────────────
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

  // A machine on a bench must stand on it with its whole footprint. (Along the
  // bench that was checked from the data above; this one is measured on the
  // lab as built, so it also holds front to back, for a machine that was given
  // a place of its own on the worktop with `z`, and for one that was turned.)
  const worktops = lab.footprints.filter((print) => print.level === 'floor' && (print.what === 'bench' || print.what.startsWith('station:')));
  let onBenches = 0;
  for (const print of lab.footprints) {
    if (print.level !== 'worktop' || !EQUIPMENT[print.what]) continue;
    const bench = worktops.find(
      (other) => other.roomId === print.roomId && Math.abs(other.box.max.y - print.box.min.y) < m(0.02) && print.box.max.x > other.box.min.x && print.box.min.x < other.box.max.x && print.box.max.z > other.box.min.z && print.box.min.z < other.box.max.z,
    );
    if (!bench) continue; // a worktop that ends below a splash-back or a shelf: nothing to measure against
    onBenches++;
    const over = Math.max(bench.box.min.x - print.box.min.x, print.box.max.x - bench.box.max.x, bench.box.min.z - print.box.min.z, print.box.max.z - bench.box.max.z);
    if (toMm(over) > 1) fail(`${describe(print)} hangs ${fmt(toMm(over))} mm over the edge of its bench`);
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
  console.log(`  ${lab.footprints.length} placed objects, ${lab.items.size} machines (${onBenches} measured on their benches), ${doorCount} doors checked`);

  // ── 6. Imported machines ─────────────────────────────────────────────────────
  section('Imported machines (hero → lite)');
  let liteDraws = 0;
  let machineTriangles = 0;
  const builtInstances = [...lab.items.values()].filter((item) => item.status === 'built');
  for (const item of builtInstances) {
    const asset = await createEquipment(item.typeId);
    const lite = bakeLite(asset.root);
    // The baked form is the machine as it stands. A part that the model keeps
    // hidden until it is opened or taken apart is not in it, and is not counted.
    const whole = sceneStats(asset.root);
    const hero = sceneStats(asset.root, { visibleOnly: true });
    const baked = sceneStats(lite);
    const shownBox = preciseBox(asset.root, { filter: (obj) => isShown(obj, asset.root) });
    const sizeDelta = shownBox.getSize(new THREE.Vector3()).sub(preciseBox(lite).getSize(new THREE.Vector3())).length();
    if (hero.triangles !== baked.triangles) fail(`"${item.typeId}": baking changed the triangle count (${hero.triangles} → ${baked.triangles})`);
    if (sizeDelta > 1e-4) fail(`"${item.typeId}": baked form is a different size from the original`);
    // What stands on the bench is measured over every part, hidden ones too
    // (the manifest's box). A hidden part must not make the machine look larger.
    const stowedDelta = preciseBox(asset.root).getSize(new THREE.Vector3()).sub(shownBox.getSize(new THREE.Vector3())).length();
    if (stowedDelta > 1e-4) fail(`"${item.typeId}": a part that is hidden while the machine is closed reaches outside it, so the size on record is not the size on show`);
    if (Object.keys(asset.parts).length === 0) fail(`"${item.typeId}": no sub-assemblies found`);
    liteDraws += baked.drawCalls;
    machineTriangles += baked.triangles;
    const stowed = whole.meshes - hero.meshes;
    const stowedNote = stowed ? `   (+ ${fmt(whole.triangles - hero.triangles)} in ${stowed} part${stowed === 1 ? '' : 's'} hidden until it is opened)` : '';
    console.log(`  ${item.typeId.padEnd(24)} ${String(hero.drawCalls).padStart(3)} → ${String(baked.drawCalls).padStart(2)} draw calls   ${fmt(baked.triangles).padStart(7)} triangles${stowedNote}`);
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

  // The guides, each step on its model. A step shows the machine as it is at
  // that point of the work (its lid open, a part not in yet) and points at a
  // place on it. From the side the step looks from, the first thing the eye
  // meets at each mark has to be the part the mark belongs to.
  const guidedTypes = Object.keys(HOW_TO).filter((id) => EQUIPMENT[id]?.status === 'built' && Array.isArray(HOW_TO[id].guides));
  if (guidedTypes.length) section('Guides: every step on its model  (✓ a mark in plain sight)');
  for (const id of guidedTypes) {
    const entry = HOW_TO[id];
    const asset = await createEquipment(id);
    // As the tour does it: the places are found while the model stands as it is built, and whole.
    const { places, problems } = findPlaces(asset.root, entry.places, asset);
    for (const problem of problems) fail(`how-to.js "${id}": ${problem}`);
    for (const guide of entry.guides) {
      console.log(`  ${EQUIPMENT[id].shortName ?? id} › ${guide.title}`);
      for (const [index, step] of (guide.steps ?? []).entries()) {
        const here = `how-to.js "${id}" "${guide.id}" step ${index + 1} ("${step.title}")`;
        asset.setOpen(step.open ? 1 : 0);
        const taken = [];
        for (const name of Array.isArray(step.without) ? step.without : []) {
          const part = asset.root.getObjectByName(name);
          if (!part) fail(`${here}: \`without\` names "${name}", which is not a part of the model`);
          else {
            taken.push([part, part.visible]);
            part.visible = false;
          }
        }
        const place = step.at ? places.get(step.at) : null;
        let verdict = step.at ? `${step.at} (not found)` : 'points nowhere';
        if (place) {
          const sights = sightOf(asset.root, place);
          verdict = `${step.at} ${sights.map((sight) => (sight.seen ? '✓' : '✗')).join('')}`;
          sights.forEach((sight, mark) => {
            if (sight.seen) return;
            const why = !sight.by && !sight.own ? 'nothing is there' : sight.own ? `the point is ${sight.gap.toFixed(2)} units off the surface of its part` : `"${sight.by}" is in the way`;
            fail(`${here}: mark ${mark + 1} of "${step.at}" cannot be seen from [${place.from.join(', ')}]${step.open ? ' with the lid open' : ''}: ${why}`);
          });
        }
        for (const [part, was] of taken) part.visible = was;
        const state = `${step.open ? 'open' : 'shut'}${taken.length ? `, without ${taken.map(([part]) => part.name).join(', ')}` : ''}`;
        console.log(`    ${String(index + 1).padStart(2)}. ${String(step.title).padEnd(26)} ${state.padEnd(34)} ${verdict}`);
      }
    }
    asset.setOpen(0);
    asset.dispose();
  }

  // ── 7. Budget ────────────────────────────────────────────────────────────────
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
if (toConfirm.length) {
  section(`To confirm with the lab (${toConfirm.length}) — notes from knowledge.js and how-to.js, never shown to visitors`);
  for (const [name, note] of toConfirm) console.log(`  ? ${name}: ${note}`);
}
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
