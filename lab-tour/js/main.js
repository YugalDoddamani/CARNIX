// The tour itself: builds the lab, then moves the visitor between three places —
// the whole floor ("overview"), one room, one machine. Everything on screen is a
// function of that location; the address bar (#/room/machine) mirrors it, so the
// browser's Back button and shared links work. A machine with guides ("How to
// use it") has pages of its own under it: #/room/machine/how-to/guide/step.
//
// When the tour opens, the lab comes up part by part, then the names over it,
// then the interface around it; a machine's model fades in when it has loaded
// (core/motion.js).
import * as THREE from 'three';
import { createEquipment, createWorkbench } from './assets/registry.js';
import { bakeLite } from './core/batch.js';
import { CATCH_UP, createCameraRig } from './core/camera-rig.js';
import { preciseBox } from './core/measure.js';
import { directionOf, findPlaces, marksInWorld } from './core/places.js';
import { ENTRANCE, ENTRANCE_SHORT, createMotion } from './core/motion.js';
import { PALETTE } from './core/palette.js';
import { createPicker } from './core/picking.js';
import { chooseQuality, createStage } from './core/stage.js';
import { m } from './core/units.js';
import { buildRooms } from './rooms/build-rooms.js';
import { HOW_TO } from './rooms/how-to.js';
import { BRANDS, GUIDE, MACHINE_INFO, ROOM_INFO, ROUTE } from './rooms/knowledge.js';
import { buildShell, GROUND_Y } from './shell/build-shell.js';
import { ROOMS, SPOTLIGHT, VIEWS } from './shell/layout.js';
import { createDock } from './ui/dock.js';
import { createGuide } from './ui/guide.js';
import { ICONS } from './ui/icons.js';
import { createLabelLayer } from './ui/labels.js';
import { createMarker } from './ui/marker.js';
import { createPanel } from './ui/panel.js';

const DEG = 180 / Math.PI;
const WIDE_LAYOUT = window.matchMedia('(min-width: 900px)');
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
const COARSE_POINTER = window.matchMedia('(pointer: coarse)');
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// A step of a "How to use it" guide.
const STEP_TIME = 0.8; // seconds for the camera to go from one step's part to the next
const LID_TIME = 0.6; // seconds for a lid to swing open or shut
const AWAY = 80; // degrees: turned further than this from the side a step looks from, its part counts as out of sight
const RING = { min: 30, max: 160 }; // the smallest and the largest ring, in px across

// How far the visitor may turn and zoom in each kind of place. A machine can be
// walked all the way round; a room and the whole lab only looked at from the
// side the walls are open to.
const LIMITS = {
  overview: { orbit: 25, minElevation: 18, maxElevation: 80, zoomIn: 0.3, zoomOut: 1.25 },
  room: { orbit: 55, minElevation: 14, maxElevation: 78, zoomIn: 0.3, zoomOut: 1.5 },
  item: { orbit: 180, minElevation: 2, maxElevation: 85, zoomIn: 0.5, zoomOut: 1.9 },
};

const stageElement = document.getElementById('stage');
const panelElement = document.getElementById('panel');
const dockElement = document.getElementById('dock');
const hintElement = document.getElementById('gesture-hint');
const loadingElement = document.getElementById('loading');
const announcer = document.getElementById('announcer');
const root = document.documentElement;

function fail(error) {
  console.error(error);
  root.dataset.tour = 'failed';
  const message = document.createElement('div');
  message.className = 'fatal';
  message.setAttribute('role', 'alert');
  const title = document.createElement('strong');
  title.textContent = 'The 3D tour could not start';
  const detail = document.createElement('p');
  detail.textContent = /webgl/i.test(String(error?.message))
    ? 'This device or browser has 3D graphics (WebGL) switched off or unavailable.'
    : 'Something went wrong while building the lab. Reloading the page usually fixes it.';
  message.append(title, detail);
  stageElement.append(message);
}

function start() {
  const query = new URLSearchParams(location.search);
  const stage = createStage(stageElement, chooseQuality(query.get('q')));
  stage.setSpotlightLevels(SPOTLIGHT);

  // ── The lab ────────────────────────────────────────────────────────────────
  const shell = buildShell();
  const rooms = buildRooms(shell);
  stage.scene.add(shell.group, shell.tapTargets, rooms.furniture, rooms.ghosts, rooms.holders, rooms.tapTargets);
  stage.fitShadowTo(shell.frameBox, GROUND_Y);

  // A soft tint on the floor of the room under the pointer.
  const roomHighlight = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false }),
  );
  roomHighlight.rotation.x = -Math.PI / 2;
  roomHighlight.visible = false;
  stage.scene.add(roomHighlight);

  const rig = createCameraRig({
    camera: stage.camera,
    domElement: stage.renderer.domElement,
    invalidate: stage.invalidate,
    addTicker: stage.addTicker,
  });
  // The lab is drawn by the rig's room camera: the visitor's camera's twin,
  // except that it stands still while a spotlit machine is being turned.
  stage.setLabCamera(rig.roomCamera);

  // Things arriving: the lab when the tour opens, a model when it has loaded.
  // They are faded in from stills of the picture, and a still is only true for
  // the view it was taken from, so this says what "the view" is.
  // A lid that a step of a guide is swinging open or shut: { item, from, to, elapsed }.
  let lidMotion = null;
  /**
   * How far open a machine stands: 0 shut … 1 open. Until a step of a guide
   * moves it, that is how its model is built: shut, but for a furnace that is
   * drawn with its lift down (`openAtRest`, assets/registry.js).
   */
  const openOf = (item) => item.open ?? item.asset?.openAtRest ?? 0;
  /** Is the picture still changing on the tour's own clock: the camera on its way, the lab fading, a lid swinging? */
  const pictureBusy = () => rig.busy || stage.spotlightState.busy || Boolean(lidMotion);

  const motion = createMotion({
    stage,
    reducedMotion: REDUCED_MOTION,
    isBusy: pictureBusy,
    getView: () => {
      const pose = rig.pose;
      const lit = stage.spotlightState;
      const picture = stage.renderer.domElement;
      return [pose.target.x, pose.target.y, pose.target.z, pose.azimuth, pose.elevation, pose.distance, pose.fov, pose.shiftX, pose.shiftY, rig.lag, lit.veil, picture.width, picture.height, lit.key];
    },
  });

  /**
   * Where the visitor is. `howTo` is a page of a machine's guides: null (the
   * machine's own page), { guideId: null } (the list of its guides) or
   * { guideId, step } (a step of one, counted from 0).
   */
  let state = { mode: null, roomId: null, itemId: null, howTo: null };
  const itemOf = (id) => (id ? rooms.items.get(id) : null);
  const roomOf = (id) => (id ? shell.rooms.get(id) : null);

  // The tour route: the rooms in the order knowledge.js lists them (any room it
  // forgets is added at the end rather than lost).
  const route = [...ROUTE.map((id) => ROOMS.find((room) => room.id === id)).filter(Boolean), ...ROOMS.filter((room) => !ROUTE.includes(room.id))];

  // ── Labels pinned to the scene ─────────────────────────────────────────────
  const labels = createLabelLayer(stageElement, rig.roomCamera);
  stage.onAfterRender(labels.update);

  const roomLabels = new Map();
  for (const def of ROOMS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-pill';
    // When the tour opens the names come in one after the other, in tour order.
    button.style.setProperty('--i', Math.max(0, route.indexOf(def)));
    const icon = document.createElement('span');
    icon.className = 'room-pill__icon';
    icon.innerHTML = ICONS[def.icon] ?? '';
    const text = document.createElement('span');
    text.className = 'room-pill__text';
    const name = document.createElement('strong');
    name.textContent = def.name;
    if (def.shortName) name.dataset.short = def.shortName;
    const subtitle = document.createElement('small');
    subtitle.textContent = def.subtitle;
    text.append(name, subtitle);
    button.append(icon, text);
    button.addEventListener('click', () => navigate({ roomId: def.id }));
    roomLabels.set(def.id, { button, handle: labels.add({ element: button, anchor: roomOf(def.id).labelAnchor }) });
  }

  for (const items of rooms.itemsByRoom.values()) {
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `hotspot hotspot--${item.status}`;
      button.style.setProperty('--i', index);
      button.setAttribute('aria-label', `${item.name} (${item.status === 'built' ? '3D model' : item.known ? '3D model coming' : 'planned'})`);
      const dot = document.createElement('span');
      dot.className = 'hotspot__dot';
      dot.textContent = String(index + 1);
      const name = document.createElement('span');
      name.className = 'hotspot__name';
      name.textContent = item.shortName;
      button.append(dot, name);
      button.addEventListener('click', () => navigate({ roomId: item.roomId, itemId: item.id }));
      const anchor = item.box.getCenter(new THREE.Vector3());
      anchor.y = item.box.max.y + m(0.05);
      item.button = button;
      item.label = labels.add({ element: button, anchor });
      item.label.setShown(false);
    });
  }

  // ── Navigation bar, guide, panel ───────────────────────────────────────────
  const dock = createDock(dockElement, {
    items: [{ id: 'lab', label: 'Lab', title: 'The whole lab', icon: 'lab' }, ...route.map((room) => ({ id: room.id, label: room.tab ?? room.name, shortLabel: room.tabShort, title: room.name, icon: room.icon }))],
    onSelect: (id) => navigate(id === 'lab' ? {} : { roomId: id }),
  });

  const guide = createGuide({ content: GUIDE, onStart: () => navigate({ roomId: route[0].id }) });
  document.getElementById('open-guide').addEventListener('click', () => guide.open());

  const panel = createPanel(panelElement, {
    onRoom: (roomId) => navigate({ roomId }),
    onItem: (itemId) => navigate({ roomId: itemOf(itemId)?.roomId, itemId }),
    onBack: goBack,
    onLab: () => navigate({}),
    onStart: () => navigate({ roomId: route[0].id }),
    onGuide: () => guide.open(),
    onExplode: takeApart,
    onHowTo: (page) => navigate({ roomId: state.roomId, itemId: state.itemId, howTo: page }),
    onAim: () => frameCurrent({ duration: REDUCED_MOTION.matches ? 0 : STEP_TIME }),
  });

  function renderPanel() {
    if (state.mode === 'item') {
      const item = itemOf(state.itemId);
      const list = rooms.itemsByRoom.get(state.roomId) ?? [];
      const index = list.indexOf(item);
      const info = MACHINE_INFO[item.typeId] ?? null;
      const guides = guidesOf(item);
      panel.render({
        mode: 'item',
        room: roomOf(state.roomId).def,
        item,
        info,
        brand: info?.brand ? (BRANDS[info.brand] ?? null) : null,
        modelState: item.modelState,
        // Its guides, and which page of them is open (null: the machine's own page).
        howTo: guides ? { guides: guides.guides, source: guides.source, basic: guides.basic ?? '', note: guides.note ?? '', page: state.howTo } : null,
        siblings: { index, total: list.length, previous: list[(index - 1 + list.length) % list.length], next: list[(index + 1) % list.length] },
      });
    } else if (state.mode === 'room') {
      const def = roomOf(state.roomId).def;
      const index = route.indexOf(def);
      panel.render({
        mode: 'room',
        room: def,
        about: ROOM_INFO[def.id]?.about ?? '',
        items: rooms.itemsByRoom.get(def.id) ?? [],
        stop: { index, total: route.length, previous: route[index - 1] ?? null, next: route[index + 1] ?? null },
      });
    } else {
      panel.render({ mode: 'overview', guide: GUIDE, route, itemsByRoom: rooms.itemsByRoom });
    }
  }

  // ── Detail levels ──────────────────────────────────────────────────────────
  // A machine is shown baked ("lite", one mesh per material) until it is the one
  // being looked at; then its original parts ("hero") are swapped in so it can
  // be taken apart. Both share materials, so the swap is invisible.
  function showTier(item, tier) {
    if (!item?.asset || item.tier === tier) return;
    const { hero, lite } = item.asset;
    if (tier === 'lite') {
      item.asset.setExplode(0);
      item.apart = 0;
      // Whatever a step of a guide did to it is undone as well: it stands as it is built, and whole again.
      if (lidMotion?.item === item) lidMotion = null;
      if (openOf(item) !== item.asset.openAtRest) item.asset.setOpen(item.asset.openAtRest);
      item.open = item.asset.openAtRest;
      showParts(item, []);
    }
    item.holder.remove(tier === 'hero' ? lite : hero);
    item.holder.add(tier === 'hero' ? hero : lite);
    item.tier = tier;
    stage.shadowsDirty();
  }

  // ── A machine on its own ───────────────────────────────────────────────────
  /** A machine's bounds right now: larger while it is taken apart. */
  function boundsOf(item) {
    if (!item.apart || !item.apartBox) return item.box;
    return new THREE.Box3(item.box.min.clone().lerp(item.apartBox.min, item.apart), item.box.max.clone().lerp(item.apartBox.max, item.apart));
  }

  /** A machine that is not modelled yet has no object of its own; give it one to stand in the spotlight. */
  function standInFor(item) {
    if (item.standIn) return item.standIn;
    const group = new THREE.Group();
    group.name = `stand-in:${item.id}`;
    group.add(new THREE.Mesh(UNIT_BOX, PALETTE.ghost), new THREE.LineSegments(new THREE.EdgesGeometry(UNIT_BOX), PALETTE.ghostEdge));
    item.box.getCenter(group.position);
    item.box.getSize(group.scale);
    group.visible = false; // the stage shows it in the spotlight pass only
    stage.scene.add(group);
    item.standIn = group;
    return group;
  }

  const spotFor = (item) => (item.holder ? { key: item.id, object: item.holder, box: boundsOf(item) } : { key: item.id, only: [standInFor(item)], box: item.box });

  function takeApart(amount) {
    const item = itemOf(state.itemId);
    if (!item?.asset || item.tier !== 'hero') return;
    if (!item.apartBox) {
      // Measure once how much room the machine needs when fully apart.
      item.asset.setExplode(1);
      item.apartBox = preciseBox(item.asset.hero).union(item.box);
    }
    item.apart = amount;
    item.asset.setExplode(amount);
    stage.shadowsDirty();
    // Step back just enough to keep every part in view, from wherever the
    // visitor has turned to.
    const box = boundsOf(item);
    stage.spotlightBounds(box);
    updateInsets();
    rig.frame(box, itemView(item), { duration: Math.max(0.3, rig.remaining), limits: LIMITS.item, keepAngles: true, room: 'stay' });
  }

  // ── "How to use it" ────────────────────────────────────────────────────────
  // A machine with guides (rooms/how-to.js) has more pages than its own: the
  // list of its guides, and every step of each. They are pages of one place:
  // the machine stays in the spotlight throughout. A step can point at the
  // machine. The camera then goes to the part it is about, rings mark the
  // spots, and the machine is shown as it is at that point of the work: its
  // lid open, say, and the flask not in yet.
  const guidesOf = (item) => (item ? (HOW_TO[item.typeId] ?? null) : null);

  /** Turn a page of guides that was asked for into one that exists: null (none), the list, or a step of a guide. */
  function howToFor(item, wanted) {
    const info = guidesOf(item);
    if (!info || !wanted) return null;
    const found = info.guides.find((entry) => entry.id === wanted.guideId);
    if (!found) return { guideId: null, step: 0 };
    return { guideId: found.id, step: clamp(Math.round(Number(wanted.step) || 0), 0, found.steps.length - 1) };
  }
  const sameHowTo = (a, b) => (a && b ? a.guideId === b.guideId && a.step === b.step : a === b);

  /**
   * The step that is open, if one is: its guide, the step, its number from 0,
   * and `place`: where it points on the model. That is null for a step that
   * points nowhere, and until the machine's model is there.
   */
  function openStep() {
    if (!state.howTo?.guideId) return null;
    const item = itemOf(state.itemId);
    const found = guidesOf(item).guides.find((entry) => entry.id === state.howTo.guideId);
    const step = found.steps[state.howTo.step];
    const place = item.asset && item.tier === 'hero' && step.at ? (item.asset.places.get(step.at) ?? null) : null;
    return { item, guide: found, step, index: state.howTo.step, place };
  }

  /** Take these parts of the model out of the picture (by name), and put back whatever was out before. */
  function showParts(item, without) {
    const before = item.without ?? [];
    if (before.length === without.length && before.every((partName) => without.includes(partName))) return;
    for (const partName of before) {
      const part = item.asset.hero.getObjectByName(partName);
      if (part) part.visible = true;
    }
    for (const partName of without) {
      const part = item.asset.hero.getObjectByName(partName);
      if (part) part.visible = false;
    }
    item.without = [...without];
    stage.shadowsDirty();
  }

  /** Swing the machine's lid, or run its lift, to `target` (0 shut … 1 open). */
  function moveLid(item, target, { instant = false } = {}) {
    const now = openOf(item);
    if (lidMotion?.item === item) lidMotion = null;
    if (Math.abs(now - target) < 1e-3) return;
    if (instant || REDUCED_MOTION.matches) {
      item.open = target;
      item.asset.setOpen(target);
      stage.shadowsDirty();
      return;
    }
    lidMotion = { item, from: now, to: target, elapsed: 0 };
  }
  stage.addTicker((dt) => {
    if (!lidMotion) return false;
    lidMotion.elapsed += dt;
    const { item, from, to } = lidMotion;
    const t = Math.min(1, lidMotion.elapsed / LID_TIME);
    // Evenly: the models ease the swing themselves.
    item.open = from + (to - from) * t;
    item.asset.setOpen(item.open);
    if (t >= 1) lidMotion = null;
    stage.shadowsDirty();
    return true;
  });

  /**
   * Show the machine as the open step has it: open or shut, without the parts
   * that are not there yet. With no step open it stands as it is built, and whole.
   */
  function dress({ instant = false } = {}) {
    const item = itemOf(state.itemId);
    if (!item?.asset || item.tier !== 'hero') return;
    const step = openStep()?.step ?? null;
    showParts(item, step?.without ?? []);
    moveLid(item, step ? (step.open ? 1 : 0) : item.asset.openAtRest, { instant });
  }

  // The rings. They are put in place after every frame that is drawn, where the
  // step's spots land in that frame; `marks` keeps what was shown, for the checks.
  const marker = createMarker(stageElement);
  let marks = { step: null, away: false, spots: [] };
  const _point = new THREE.Vector3();
  const _scale = new THREE.Vector3();
  const _eye = new THREE.Vector3();
  const _side = new THREE.Vector3();
  const frontAzimuthOf = (item) => Math.atan2(item.front.x, item.front.z) * DEG;

  function placeMarks() {
    const open = openStep();
    if (!open?.place) {
      marker.clear();
      marks = { step: null, away: false, spots: [] };
      panelElement.removeAttribute('data-mark-away');
      return;
    }
    const { item, place } = open;
    const camera = stage.camera; // a machine in the spotlight is drawn by the visitor's camera
    camera.updateMatrixWorld(); // it may have moved since the last frame was drawn
    item.asset.hero.updateWorldMatrix(true, true);
    const width = stageElement.clientWidth;
    const height = stageElement.clientHeight;
    // A length of 1 at a distance of 1 from the camera covers this many pixels.
    const pixelsPerTan = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const modelScale = item.asset.hero.getWorldScale(_scale).x;
    const spots = [];
    marksInWorld(place).forEach((point, index) => {
      const depth = -_point.copy(point).applyMatrix4(camera.matrixWorldInverse).z;
      if (!(depth > 0)) return; // behind the camera
      _point.copy(point).project(camera);
      spots.push({ x: (_point.x * 0.5 + 0.5) * width, y: (-_point.y * 0.5 + 0.5) * height, size: clamp((place.sizes[index] * modelScale * pixelsPerTan) / depth, RING.min, RING.max) });
    });
    // Has the visitor turned the part away? Then a ring would float over the
    // wrong side of the machine. Compare the side they look from with the side
    // the step looks from, both as the machine sees them.
    const pose = rig.pose;
    const turned = directionOf([pose.azimuth - frontAzimuthOf(item), pose.elevation], _eye).angleTo(directionOf(place.from, _side)) * DEG;
    const away = turned > AWAY;
    marker.show(spots, { key: `${item.id}/${open.guide.id}/${open.index}`, away });
    marks = { step: `${open.guide.id}/${open.index}`, away, spots };
    // The button that brings the step's view back stands out while it is needed.
    panelElement.toggleAttribute('data-mark-away', away);
  }
  stage.onAfterRender(placeMarks);

  // ── Camera ─────────────────────────────────────────────────────────────────
  /** Keep the subject clear of the panel (beside the lab on wide screens, under it on phones) and of the navigation bar. */
  let freeArea = { width: 1, height: 1 };
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  function updateInsets() {
    const stageRect = stageElement.getBoundingClientRect();
    const panelRect = panelElement.getBoundingClientRect();
    const dockRect = dockElement.getBoundingClientRect();
    const wide = WIDE_LAYOUT.matches;
    const right = wide && panelRect.width ? Math.max(0, stageRect.right - panelRect.left) : 0;
    // What covers the bottom of the stage: the floating bar on a wide screen,
    // the sheet on a phone (where the bar sits below the stage).
    const cover = wide ? dockRect : panelRect;
    const covered = cover.height ? Math.max(0, stageRect.bottom - cover.top) + 8 : 0;
    // Under a machine, leave a strip for the "drag to turn" hint.
    const bottom = covered + (state.mode === 'item' ? 34 : 0);
    const top = state.mode === 'overview' ? 64 : state.mode === 'item' ? 20 : 28; // room for the room names above the lab
    freeArea = { width: stageRect.width - right, height: stageRect.height - top - bottom };
    // Six full name cards need about 900 px; below that they shrink to icon +
    // short name, and on a phone to the icon alone (the bar lists the names).
    stageElement.classList.toggle('is-compact', stageRect.width - right < 900);
    stageElement.classList.toggle('is-tiny', stageRect.width - right < 560);
    // Things in the stylesheet that sit in the free area (the "drag to turn" hint).
    stageElement.style.setProperty('--free-right', `${right}px`);
    stageElement.style.setProperty('--free-bottom', `${covered}px`);
    const next = { top, right, bottom, left: 0 };
    const changed = Object.keys(next).some((side) => Math.abs(next[side] - insets[side]) > 1);
    insets = next;
    rig.setInsets(insets);
    return changed;
  }

  function itemView(item) {
    // Look at the machine's front, turned a little toward the side the visitor
    // was already standing on.
    const frontAzimuth = Math.atan2(item.front.x, item.front.z) * DEG;
    const side = [frontAzimuth - VIEWS.item.azimuthOffset, frontAzimuth + VIEWS.item.azimuthOffset];
    const distanceFromOverview = (angle) => Math.abs(((angle - VIEWS.overview.azimuth + 540) % 360) - 180);
    const azimuth = distanceFromOverview(side[0]) < distanceFromOverview(side[1]) ? side[0] : side[1];
    return { ...VIEWS.item, azimuth };
  }

  function frameCurrent({ duration = 1.1 } = {}) {
    updateInsets();
    if (state.mode === 'item') {
      const item = itemOf(state.itemId);
      const open = openStep();
      const place = open?.place;
      if (place) {
        // A step of a guide: what its place frames, from the side its place names.
        // `within`: a place that takes in half the machine, with the margin of a wide screen
        // around it, would be framed from further away than the machine's own page is. A
        // step must not send the visitor backwards: the camera then comes closer, as far
        // as the place still fits with the small margin around it.
        const view = {
          azimuth: frontAzimuthOf(item) + place.from[0],
          elevation: place.from[1],
          fov: VIEWS.item.fov,
          padding: WIDE_LAYOUT.matches ? VIEWS.step.paddingWide : VIEWS.step.padding,
          within: { box: boundsOf(item).clone(), view: itemView(item), padding: VIEWS.step.padding },
        };
        // What the place frames with the machine as this step has it: a furnace's head, say, is
        // elsewhere open than shut. It is written in the model's own coordinates: bring it to
        // where the model stands.
        const frame = open.step.open ? place.frames.open : place.frames.shut;
        item.asset.hero.updateWorldMatrix(true, false);
        return rig.frame(frame.clone().applyMatrix4(item.asset.hero.matrixWorld), view, { duration, limits: LIMITS.item, room: 'stay' });
      }
      // `room: 'stay'`: from here on the visitor turns the machine, not the lab.
      return rig.frame(boundsOf(item), itemView(item), { duration, limits: LIMITS.item, room: 'stay' });
    }
    if (state.mode === 'room') return rig.frame(roomOf(state.roomId).focusBox, VIEWS.room, { duration, limits: LIMITS.room });
    // The whole lab has two views (layout.js): across, and upright for a free
    // area that is not much wider than it is high. On a phone the sheet under
    // the lab takes much of the height, more so since its text was set larger,
    // and a phone 360 × 800 would fall back to the view across, which draws
    // each room a third smaller there. Measured, the upright view shows the
    // rooms larger from an area 0.83 times as high as wide; the phone layout
    // therefore switches at 0.9. The wide layout keeps its 1.05.
    const upright = freeArea.height > freeArea.width * (WIDE_LAYOUT.matches ? 1.05 : 0.9);
    const view = upright ? VIEWS.overviewPortrait : VIEWS.overview;
    return rig.frame(shell.frameBox, view, { duration, limits: LIMITS.overview });
  }

  /** Seconds for the camera to travel between two places: longer for longer journeys. */
  function travelTime(from, to) {
    if (!from.mode) return 0;
    const pair = [from.mode, to.mode].sort().join('>');
    if (pair === 'item>item') return 0.95;
    if (pair === 'item>room') return 1.05;
    if (pair === 'item>overview') return 1.4;
    if (pair === 'room>room') return 1.15;
    return 1.2;
  }

  // ── "Drag to turn" ─────────────────────────────────────────────────────────
  // Shown the first time a machine comes forward, until the visitor does it.
  let hintState = 'unused'; // → 'showing' → 'done'
  let hintTimer = 0;
  function showHint() {
    if (hintState !== 'unused') return;
    hintState = 'showing';
    hintElement.querySelector('span').textContent = COARSE_POINTER.matches ? 'Drag to turn · pinch to zoom' : 'Drag to turn · scroll to zoom';
    hintElement.hidden = false;
    // The nine seconds count from the frame in which the hint appears, not from
    // the moment it was asked for: the machine's first frame comes before it,
    // and on a slow device that frame alone can take longer than that.
    requestAnimationFrame(() => {
      if (hintState !== 'showing') return; // already dismissed
      hintElement.classList.add('is-shown');
      hintTimer = setTimeout(hideHint, 9000);
    });
  }
  function hideHint() {
    if (hintState !== 'showing') return;
    hintState = 'done';
    clearTimeout(hintTimer);
    hintElement.classList.remove('is-shown');
    setTimeout(() => {
      hintElement.hidden = true;
    }, 400);
  }
  for (const type of ['pointerdown', 'wheel']) {
    stage.renderer.domElement.addEventListener(type, () => state.mode === 'item' && hideHint(), { passive: true });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  // "#/acrylic/bredent-thermopress-400/how-to/run-a-program/4": a machine, its
  // guides, one of them, its fourth step (the first is written without a number).
  function hashFor({ roomId, itemId, howTo }) {
    if (!itemId) return roomId ? `#/${roomId}` : '#/';
    if (!howTo) return `#/${itemId}`;
    if (!howTo.guideId) return `#/${itemId}/how-to`;
    return `#/${itemId}/how-to/${howTo.guideId}${howTo.step ? `/${howTo.step + 1}` : ''}`;
  }

  function locationFromHash() {
    let path = location.hash.replace(/^#\/?/, '');
    try {
      path = decodeURIComponent(path);
    } catch {
      // A malformed link is treated as "overview" below.
    }
    const [roomId, machine, page, guideId, step] = path.split('/').filter(Boolean);
    return {
      roomId: roomId ?? null,
      itemId: roomId && machine ? `${roomId}/${machine}` : null,
      howTo: machine && page === 'how-to' ? { guideId: guideId ?? null, step: Number(step) - 1 } : null,
    };
  }

  /**
   * Make the address bar say where the visitor is. 'push' adds a step to the
   * browser's history; anything else corrects the current entry (an address
   * that named a room or machine that does not exist becomes the real one).
   */
  function showAddress(place, historyMode) {
    const hash = hashFor(place);
    if (location.hash === hash) return;
    if (historyMode === 'push') history.pushState(null, '', hash);
    else history.replaceState(null, '', hash);
  }

  function navigate(target, { instant = false, history: historyMode = 'push' } = {}) {
    const room = roomOf(target.roomId);
    const item = room ? itemOf(target.itemId) : null;
    const here = item && item.roomId === room.def.id ? item : null;
    const next = {
      mode: here ? 'item' : room ? 'room' : 'overview',
      roomId: room ? room.def.id : null,
      itemId: here ? here.id : null,
      howTo: howToFor(here, target.howTo),
    };
    if (next.mode === state.mode && next.roomId === state.roomId && next.itemId === state.itemId) {
      if (sameHowTo(next.howTo, state.howTo)) showAddress(next, historyMode);
      else turnPage(next, { instant, historyMode });
      return;
    }

    // The view is about to change: whatever is still fading in is simply there.
    if (state.mode) motion.cancel();

    const previous = state;
    state = next;
    const still = instant || REDUCED_MOTION.matches;
    const duration = still ? 0 : travelTime(previous, next);

    if (previous.itemId && previous.itemId !== next.itemId) showTier(itemOf(previous.itemId), 'lite');
    if (next.itemId) showTier(itemOf(next.itemId), 'hero');
    if (next.howTo) dress({ instant: true }); // a link straight to a step of a guide

    // Room names over the whole floor; machine markers inside a room; nothing
    // in front of a machine being inspected.
    // Coming back from a machine, the lab is still faded when they are asked
    // for; they wait until it has returned (see --label-delay in the stylesheet).
    stageElement.style.setProperty('--label-delay', previous.mode === 'item' && duration > 0 ? `${(duration * 0.55).toFixed(2)}s` : '0s');
    for (const label of roomLabels.values()) label.handle.setShown(next.mode === 'overview');
    for (const other of rooms.items.values()) other.label.setShown(next.mode === 'room' && other.roomId === next.roomId);
    setHover(null);

    // The machine being looked at stays as it is; the lab around it fades.
    // If the visitor has turned a machine, the faded lab behind it first swings
    // round to match (see camera-rig.js); nothing else changes until it has.
    const hold = rig.lag > 1 ? duration * CATCH_UP : 0;
    stage.spotlight(next.itemId ? spotFor(itemOf(next.itemId)) : null, { duration, instant: still, hold });

    renderPanel();
    dock.setActive(next.roomId ?? 'lab');
    root.dataset.mode = next.mode;
    if (next.mode === 'item') showHint();
    else hideHint();

    showAddress(next, historyMode);
    announce();
    if (previous.mode) keepFocus();

    frameCurrent({ duration });
    if (!openStep()) placeMarks(); // the rings of a step that was open go at once, not with the next frame
  }

  /** Say where the visitor is now: to screen readers, and in the title of the page. */
  function announce() {
    const item = itemOf(state.itemId);
    const open = openStep();
    const place = item ? item.name : state.roomId ? roomOf(state.roomId).def.name : 'Lab overview';
    announcer.textContent = open ? `Step ${open.index + 1} of ${open.guide.steps.length}: ${open.step.title}` : state.howTo ? `How to use it: ${place}` : place;
    const title = open ? `${open.guide.title} · ${place}` : state.howTo ? `How to use it · ${place}` : place;
    document.title = state.mode === 'overview' ? 'Lab Tour — Dental Lab' : `${title} — Lab Tour`;
  }

  /**
   * The control that was just used may have gone with the page it was on;
   * carry keyboard focus over to the panel, so the next Tab lands on what is
   * now on offer.
   */
  function keepFocus() {
    const focused = document.activeElement;
    if (!focused || focused === document.body || focused.closest('[inert]') || !focused.isConnected) panelElement.focus({ preventScroll: true });
  }

  /**
   * Another page of the same machine: its own, the list of its guides, a step
   * of a guide. The machine stays in the spotlight; what changes is the panel
   * and, for a step, how the machine is shown and which part the camera is on.
   */
  function turnPage(next, { instant, historyMode }) {
    const leavesStep = Boolean(state.howTo?.guideId);
    // A guide shows the machine whole: put it together if it was taken apart.
    if (!state.howTo && itemOf(next.itemId).apart) takeApart(0);
    state = next;
    const still = instant || REDUCED_MOTION.matches;
    dress({ instant: still });
    renderPanel();
    showAddress(next, historyMode);
    announce();
    keepFocus();
    // The camera goes to the part a step is about, and back to the whole
    // machine when the guide is left. Between the machine's own page and the
    // list of its guides it stays: the visitor keeps the side they turned to.
    if (next.howTo?.guideId || leavesStep) {
      motion.cancel(); // the view is about to change: whatever is still fading in is simply there
      frameCurrent({ duration: still ? 0 : STEP_TIME });
    }
    placeMarks(); // rings that are no longer wanted go at once; new ones are put right by the next frame
  }

  /** One step back: a step of a guide → the list of the guides → the machine → its room → the lab. */
  function goBack() {
    if (state.howTo) navigate({ roomId: state.roomId, itemId: state.itemId, howTo: state.howTo.guideId ? {} : null });
    else if (state.mode === 'item') navigate({ roomId: state.roomId });
    else if (state.mode === 'room') navigate({});
  }

  // The browser has already moved (Back, Forward, an edited address): follow it.
  window.addEventListener('popstate', () => navigate(locationFromHash(), { history: 'follow' }));
  window.addEventListener('hashchange', () => navigate(locationFromHash(), { history: 'follow' }));
  window.addEventListener('keydown', (event) => {
    // The guide closes itself on Escape; everywhere else Escape is "one step back".
    if (event.key === 'Escape' && !event.defaultPrevented && !guide.isOpen) goBack();
  });

  // ── Pointer ────────────────────────────────────────────────────────────────
  const roomTargets = shell.tapTargets.children;
  const itemTargets = new Map();
  for (const target of rooms.tapTargets.children) {
    const { roomId } = target.userData;
    if (!itemTargets.has(roomId)) itemTargets.set(roomId, []);
    itemTargets.get(roomId).push(target);
  }

  /** What a tap on `hit` would do right now, or null if nothing. */
  function actionFor(hit) {
    if (!hit || state.mode === 'item') return null; // a machine on its own is for turning, not for tapping past
    if (hit.type === 'item') return { roomId: hit.roomId, itemId: hit.itemId };
    if (hit.roomId !== state.roomId) return { roomId: hit.roomId };
    return null;
  }

  let hovered = null;
  function setHover(hit) {
    const action = actionFor(hit);
    const key = action ? (action.itemId ?? action.roomId) : null;
    if (key === hovered) return;
    if (hovered) {
      roomLabels.get(hovered)?.button.classList.remove('is-hover');
      itemOf(hovered)?.button.classList.remove('is-hover');
    }
    hovered = key;
    stage.renderer.domElement.style.cursor = action ? 'pointer' : '';
    const room = action && !action.itemId ? roomOf(action.roomId) : null;
    if (action?.itemId) itemOf(action.itemId).button.classList.add('is-hover');
    if (room) {
      roomLabels.get(action.roomId).button.classList.add('is-hover');
      const size = room.box.getSize(new THREE.Vector3());
      roomHighlight.position.set(room.center.x, m(0.008), room.center.z);
      roomHighlight.scale.set(size.x, size.z, 1);
    }
    roomHighlight.visible = Boolean(room);
    stage.invalidate();
  }

  const picker = createPicker({
    domElement: stage.renderer.domElement,
    camera: rig.roomCamera,
    getTargets: () => (state.mode === 'overview' ? [roomTargets] : state.mode === 'room' ? [itemTargets.get(state.roomId) ?? [], roomTargets] : []),
    onTap(hit) {
      const action = actionFor(hit);
      if (action) navigate(action);
    },
    onHover: (hit) => setHover(hit),
  });

  // ── Buttons on the stage ───────────────────────────────────────────────────
  document.getElementById('zoom-in').addEventListener('click', () => rig.zoomBy(0.8));
  document.getElementById('zoom-out').addEventListener('click', () => rig.zoomBy(1.25));
  document.getElementById('brand').addEventListener('click', (event) => {
    event.preventDefault();
    navigate({});
  });

  // The free area changes when the window does, and when the panel or the bar
  // changes size (another pill's worth of text, labels appearing on the bar).
  const refit = () => updateInsets() && rig.refit();
  stage.onResize(() => {
    updateInsets();
    rig.refit();
  });
  const layoutWatcher = new ResizeObserver(refit);
  layoutWatcher.observe(panelElement);
  layoutWatcher.observe(dockElement);
  WIDE_LAYOUT.addEventListener('change', () => frameCurrent({ duration: 0 }));

  // ── Go ─────────────────────────────────────────────────────────────────────
  navigate(locationFromHash(), { instant: true, history: 'replace' });
  root.dataset.tour = 'loading';

  // The lab comes up part by part: what it stands on, its walls, its glass, the
  // furniture, the machines. A link straight to a machine brings everything up
  // as one. (?intro=off opens without any of it; ?intro=hold is for the checks.)
  const introMode = query.get('intro');
  // The stills are taken now, before the browser has had a chance to report
  // that the stage changed size while the page around it was being filled in
  // (on a phone the navigation bar takes its strip from the stage). Fit the
  // picture first, or the stills would be outdated at the very first frame.
  stage.resize();
  const opening =
    introMode !== 'off' &&
    motion.playIntro(
      state.mode === 'item' ? ENTRANCE_SHORT : ENTRANCE,
      { floor: shell.parts.floor, walls: shell.parts.walls, glazing: shell.parts.glazing, furniture: [rooms.furniture], machines: [rooms.ghosts, rooms.holders] },
      { hold: introMode === 'hold' },
    );
  if (!opening) root.dataset.intro = 'done';

  // A first-time visitor who arrives at the front door is shown the guide, once
  // the lab has come up behind it; one who followed a link to a room or a
  // machine, or has already gone on to one, is left to look at it.
  motion.whenIntroDone(() => {
    if (state.mode === 'overview' && !guide.wasSeen()) guide.open();
  });

  // The detailed machines follow one by one, so the first view never waits for
  // them. Each takes the place of its plain volume with a short fade.
  async function loadModels() {
    const builtItems = [...rooms.items.values()].filter((item) => item.status === 'built');
    const total = builtItems.length + (rooms.stations.length ? 1 : 0);
    let done = 0;
    let failed = 0;
    const report = () => {
      loadingElement.hidden = done >= total && !failed;
      loadingElement.classList.toggle('is-error', failed > 0 && done >= total);
      // The middle of the note is left out where the bar is short of room: on a
      // phone it reads "Loading 3/14" (tour.css hides .topbar__status-detail there).
      const detail = document.createElement('span');
      detail.className = 'topbar__status-detail';
      if (done < total) {
        detail.textContent = '3D models ';
        loadingElement.replaceChildren('Loading ', detail, `${done}/${total}`);
      } else {
        detail.textContent = '3D ';
        loadingElement.replaceChildren(`${failed} of ${total} `, detail, 'models could not be loaded');
      }
    };
    // A model is built first and put in place afterwards (see motion.change:
    // not always at once). Either can go wrong.
    const arrivals = [];
    const putInPlace = (place, onFailure) => {
      arrivals.push(
        motion.change(place).catch((error) => {
          failed++;
          onFailure(error);
        }),
      );
    };
    report();
    await nextFrame();

    if (rooms.stations.length) {
      const benchFailed = (error) => console.error('Could not build the library workbench', error);
      try {
        const bench = await createWorkbench();
        const tables = rooms.stations.map((station) => [station.holder, bakeLite(bench.tables[station.tableKey])]);
        putInPlace(() => {
          for (const [holder, table] of tables) holder.add(table);
          stage.shadowsDirty();
        }, benchFailed);
      } catch (error) {
        failed++;
        benchFailed(error);
      }
      done++;
      report();
      await nextFrame();
    }

    for (const item of builtItems) {
      const itemFailed = (error) => {
        item.modelState = 'failed';
        console.error(`Could not build "${item.typeId}"`, error);
        if (state.itemId === item.id) renderPanel();
      };
      try {
        const asset = await createEquipment(item.typeId);
        const model = { ...asset, hero: asset.root, lite: bakeLite(asset.root) };
        // Where the steps of its guides point: found now, while the model stands as it is built, and whole.
        const found = findPlaces(asset.root, HOW_TO[item.typeId]?.places, asset);
        model.places = found.places;
        for (const problem of found.problems) console.warn(`how-to.js "${item.typeId}": ${problem}`);
        putInPlace(() => {
          item.asset = model;
          item.modelState = 'ready';
          item.holder.remove(item.holder.getObjectByName('loading-volume'));
          item.tier = state.itemId === item.id ? 'hero' : 'lite';
          item.holder.add(item.asset[item.tier]);
          stage.shadowsDirty();
          if (state.itemId !== item.id) return;
          renderPanel();
          // A step of a guide was open before its machine had arrived: show it now.
          if (openStep()) {
            dress({ instant: true });
            frameCurrent({ duration: REDUCED_MOTION.matches ? 0 : STEP_TIME });
          }
        }, itemFailed);
      } catch (error) {
        failed++;
        itemFailed(error);
      }
      done++;
      report();
      await nextFrame();
    }
    await Promise.all(arrivals);
    report();
    root.dataset.tour = failed ? 'ready-with-errors' : 'ready';
  }
  loadModels();

  // For the automated checks and for poking around in the console.
  window.labTour = {
    navigate,
    get state() {
      return { ...state, howTo: state.howTo && { ...state.howTo } };
    },
    /** Is anything still moving on the tour's own clock (camera on its way, surroundings fading, a lid swinging)? Things fading in are `motion.busy`. */
    get busy() {
      return pictureBusy();
    },
    /** The rings of the open step as last put in place: { step: 'guide/2', away, spots: [{ x, y, size }] } in CSS pixels of the stage. */
    get marks() {
      return { ...marks, spots: marks.spots.map((spot) => ({ ...spot })) };
    },
    rooms: ROOMS.map((room) => room.id),
    route: route.map((room) => room.id),
    items: () => [...rooms.items.values()].map((item) => ({ id: item.id, status: item.status, known: item.known, name: item.name, modelState: item.modelState, tier: item.tier, apart: item.apart ?? 0, open: openOf(item), openAtRest: item.asset?.openAtRest ?? 0, without: item.without ?? [] })),
    renderInfo: () => ({ ...stage.renderer.info.render, ...stage.renderer.info.memory, framesDrawn: stage.framesDrawn, quality: stage.quality }),
    stage,
    rig,
    motion,
    panel,
    guide,
    dock,
    get insets() {
      return { ...insets };
    },
    /** What a tap at this point of the page would hit: { type: 'room' | 'item', roomId, itemId } or null. */
    pick: (clientX, clientY) => {
      const hit = picker.pick(clientX, clientY);
      return hit ? { type: hit.type, roomId: hit.roomId, itemId: hit.itemId ?? null } : null;
    },
    /**
     * Where a room ('ceramic') or a machine ('ceramic/upcera-a7-plus') is on
     * screen right now: the rectangle its bounds cover and its middle, in CSS
     * pixels of the page.
     */
    whereIs(id) {
      const item = itemOf(id);
      const box = item ? boundsOf(item) : roomOf(id)?.focusBox;
      if (!box) return null;
      // A machine in the spotlight is drawn by the visitor's camera, everything else by the room camera.
      const camera = item && item.id === state.itemId ? stage.camera : rig.roomCamera;
      camera.updateMatrixWorld(); // it may have moved since the last frame was drawn
      const canvas = stage.renderer.domElement.getBoundingClientRect();
      const corner = new THREE.Vector3();
      const onScreen = (x, y, z) => {
        corner.set(x, y, z).project(camera);
        return [canvas.left + (corner.x * 0.5 + 0.5) * canvas.width, canvas.top + (-corner.y * 0.5 + 0.5) * canvas.height];
      };
      const xs = [];
      const ys = [];
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            const [px, py] = onScreen(x, y, z);
            xs.push(px);
            ys.push(py);
          }
        }
      }
      const middle = box.getCenter(new THREE.Vector3());
      const [x, y] = onScreen(middle.x, middle.y, middle.z);
      return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), x, y };
    },
  };
}

try {
  start();
} catch (error) {
  fail(error);
}
