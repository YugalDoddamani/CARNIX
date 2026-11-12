// The tour itself: builds the lab, then moves the visitor between three places —
// the whole floor ("overview"), one room, one machine. Everything on screen is a
// function of that location; the address bar (#/room/machine) mirrors it, so the
// browser's Back button and shared links work.
import * as THREE from 'three';
import { createEquipment, createWorkbench } from './assets/registry.js';
import { bakeLite } from './core/batch.js';
import { CATCH_UP, createCameraRig } from './core/camera-rig.js';
import { preciseBox } from './core/measure.js';
import { PALETTE } from './core/palette.js';
import { createPicker } from './core/picking.js';
import { chooseQuality, createStage } from './core/stage.js';
import { m } from './core/units.js';
import { buildRooms } from './rooms/build-rooms.js';
import { BRANDS, GUIDE, MACHINE_INFO, ROOM_INFO, ROUTE } from './rooms/knowledge.js';
import { buildShell, GROUND_Y } from './shell/build-shell.js';
import { ROOMS, SPOTLIGHT, VIEWS } from './shell/layout.js';
import { createDock } from './ui/dock.js';
import { createGuide } from './ui/guide.js';
import { ICONS } from './ui/icons.js';
import { createLabelLayer } from './ui/labels.js';
import { createPanel } from './ui/panel.js';

const DEG = 180 / Math.PI;
const WIDE_LAYOUT = window.matchMedia('(min-width: 900px)');
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
const COARSE_POINTER = window.matchMedia('(pointer: coarse)');
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

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

  /** Where the visitor is. */
  let state = { mode: null, roomId: null, itemId: null };
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
      button.setAttribute('aria-label', `${item.name} (${item.status === 'built' ? '3D model' : 'planned'})`);
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
    items: [{ id: 'lab', label: 'Lab', title: 'The whole lab', icon: 'lab' }, ...route.map((room) => ({ id: room.id, label: room.tab ?? room.name, title: room.name, icon: room.icon }))],
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
  });

  function renderPanel() {
    if (state.mode === 'item') {
      const item = itemOf(state.itemId);
      const list = rooms.itemsByRoom.get(state.roomId) ?? [];
      const index = list.indexOf(item);
      const info = MACHINE_INFO[item.typeId] ?? null;
      panel.render({
        mode: 'item',
        room: roomOf(state.roomId).def,
        item,
        info,
        brand: info?.brand ? (BRANDS[info.brand] ?? null) : null,
        modelState: item.modelState,
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
      // `room: 'stay'`: from here on the visitor turns the machine, not the lab.
      return rig.frame(boundsOf(item), itemView(item), { duration, limits: LIMITS.item, room: 'stay' });
    }
    if (state.mode === 'room') return rig.frame(roomOf(state.roomId).focusBox, VIEWS.room, { duration, limits: LIMITS.room });
    const view = freeArea.height > freeArea.width * 1.05 ? VIEWS.overviewPortrait : VIEWS.overview;
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
    requestAnimationFrame(() => hintElement.classList.add('is-shown'));
    hintTimer = setTimeout(hideHint, 9000);
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
  const hashFor = ({ roomId, itemId }) => (itemId ? `#/${itemId}` : roomId ? `#/${roomId}` : '#/');

  function locationFromHash() {
    let path = location.hash.replace(/^#\/?/, '');
    try {
      path = decodeURIComponent(path);
    } catch {
      // A malformed link is treated as "overview" below.
    }
    const [roomId, machine] = path.split('/').filter(Boolean);
    return { roomId: roomId ?? null, itemId: roomId && machine ? `${roomId}/${machine}` : null };
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
    const next = {
      mode: item && item.roomId === room.def.id ? 'item' : room ? 'room' : 'overview',
      roomId: room ? room.def.id : null,
      itemId: item && item.roomId === room.def.id ? item.id : null,
    };
    if (next.mode === state.mode && next.roomId === state.roomId && next.itemId === state.itemId) {
      showAddress(next, historyMode);
      return;
    }

    const previous = state;
    state = next;
    const still = instant || REDUCED_MOTION.matches;
    const duration = still ? 0 : travelTime(previous, next);

    if (previous.itemId && previous.itemId !== next.itemId) showTier(itemOf(previous.itemId), 'lite');
    if (next.itemId) showTier(itemOf(next.itemId), 'hero');

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

    const title = next.itemId ? itemOf(next.itemId).name : next.roomId ? room.def.name : 'Lab overview';
    announcer.textContent = title;
    document.title = next.mode === 'overview' ? 'Lab Tour — Dental Lab' : `${title} — Lab Tour`;

    // The label that was just activated has gone; carry keyboard focus over to
    // the panel so the next Tab lands on what is now on offer.
    const focused = document.activeElement;
    if (previous.mode && (!focused || focused === document.body || focused.closest('[inert]') || !focused.isConnected)) panelElement.focus({ preventScroll: true });

    frameCurrent({ duration });
  }

  function goBack() {
    if (state.mode === 'item') navigate({ roomId: state.roomId });
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
  // A first-time visitor who arrives at the front door is shown the guide; one
  // who followed a link to a room or a machine is left to look at it.
  if (state.mode === 'overview' && !guide.wasSeen()) guide.open();

  // The furniture and walls are on screen now; the detailed machines follow one
  // by one so the first view never waits for them.
  async function loadModels() {
    const builtItems = [...rooms.items.values()].filter((item) => item.status === 'built');
    const total = builtItems.length + (rooms.stations.length ? 1 : 0);
    let done = 0;
    let failed = 0;
    const report = () => {
      loadingElement.hidden = done >= total && !failed;
      loadingElement.classList.toggle('is-error', failed > 0 && done >= total);
      loadingElement.textContent =
        done < total ? `Loading 3D models ${done}/${total}` : `${failed} of ${total} 3D models could not be loaded`;
    };
    report();
    await nextFrame();

    if (rooms.stations.length) {
      try {
        const bench = await createWorkbench();
        for (const station of rooms.stations) station.holder.add(bakeLite(bench.tables[station.tableKey]));
        stage.shadowsDirty();
      } catch (error) {
        failed++;
        console.error('Could not build the library workbench', error);
      }
      done++;
      report();
      await nextFrame();
    }

    for (const item of builtItems) {
      try {
        const asset = await createEquipment(item.typeId);
        item.asset = { ...asset, hero: asset.root, lite: bakeLite(asset.root) };
        item.modelState = 'ready';
        item.holder.remove(item.holder.getObjectByName('loading-volume'));
        item.tier = state.itemId === item.id ? 'hero' : 'lite';
        item.holder.add(item.asset[item.tier]);
        stage.shadowsDirty();
      } catch (error) {
        failed++;
        item.modelState = 'failed';
        console.error(`Could not build "${item.typeId}"`, error);
      }
      if (state.itemId === item.id) renderPanel();
      done++;
      report();
      await nextFrame();
    }
    root.dataset.tour = failed ? 'ready-with-errors' : 'ready';
  }
  loadModels();

  // For the automated checks and for poking around in the console.
  window.labTour = {
    navigate,
    get state() {
      return { ...state };
    },
    /** Is anything still moving (camera on its way, surroundings fading)? */
    get busy() {
      return rig.busy || stage.spotlightState.busy;
    },
    rooms: ROOMS.map((room) => room.id),
    route: route.map((room) => room.id),
    items: () => [...rooms.items.values()].map(({ id, status, name, modelState, tier, apart }) => ({ id, status, name, modelState, tier, apart: apart ?? 0 })),
    renderInfo: () => ({ ...stage.renderer.info.render, ...stage.renderer.info.memory, framesDrawn: stage.framesDrawn, quality: stage.quality }),
    stage,
    rig,
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
