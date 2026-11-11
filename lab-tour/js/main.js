// The tour itself: builds the lab, then moves the visitor between three places —
// the whole floor ("overview"), one room, one machine. Everything on screen is a
// function of that location; the address bar (#/room/machine) mirrors it, so the
// browser's Back button and shared links work.
import * as THREE from 'three';
import { createEquipment, createWorkbench } from './assets/registry.js';
import { bakeLite } from './core/batch.js';
import { createCameraRig } from './core/camera-rig.js';
import { createPicker } from './core/picking.js';
import { chooseQuality, createStage } from './core/stage.js';
import { m } from './core/units.js';
import { buildRooms } from './rooms/build-rooms.js';
import { buildShell, GROUND_Y } from './shell/build-shell.js';
import { ROOMS, VIEWS } from './shell/layout.js';
import { ICONS } from './ui/icons.js';
import { createLabelLayer } from './ui/labels.js';
import { createPanel } from './ui/panel.js';

const DEG = 180 / Math.PI;
const WIDE_LAYOUT = window.matchMedia('(min-width: 900px)');
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const stageElement = document.getElementById('stage');
const panelElement = document.getElementById('panel');
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

  /** Where the visitor is. */
  let state = { mode: null, roomId: null, itemId: null };
  const itemOf = (id) => (id ? rooms.items.get(id) : null);
  const roomOf = (id) => (id ? shell.rooms.get(id) : null);

  // ── Labels pinned to the scene ─────────────────────────────────────────────
  const labels = createLabelLayer(stageElement, stage.camera);
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

  // ── Panel ──────────────────────────────────────────────────────────────────
  const panel = createPanel(panelElement, {
    onRoom: (roomId) => navigate({ roomId }),
    onItem: (itemId) => navigate({ roomId: itemOf(itemId)?.roomId, itemId }),
    onBack: goBack,
    onExplode(amount) {
      const item = itemOf(state.itemId);
      if (!item?.asset) return;
      item.asset.setExplode(amount);
      stage.shadowsDirty();
    },
  });

  function renderPanel() {
    if (state.mode === 'item') {
      const item = itemOf(state.itemId);
      panel.render({ mode: 'item', room: roomOf(state.roomId).def, item, modelState: item.modelState });
    } else if (state.mode === 'room') {
      panel.render({ mode: 'room', room: roomOf(state.roomId).def, items: rooms.itemsByRoom.get(state.roomId) ?? [] });
    } else {
      panel.render({ mode: 'overview', rooms: ROOMS, itemsByRoom: rooms.itemsByRoom });
    }
  }

  // ── Detail levels ──────────────────────────────────────────────────────────
  // A machine is shown baked ("lite", one mesh per material) until it is the one
  // being looked at; then its original parts ("hero") are swapped in so it can
  // be taken apart. Both share materials, so the swap is invisible.
  function showTier(item, tier) {
    if (!item?.asset || item.tier === tier) return;
    const { hero, lite } = item.asset;
    if (tier === 'lite') item.asset.setExplode(0);
    item.holder.remove(tier === 'hero' ? lite : hero);
    item.holder.add(tier === 'hero' ? hero : lite);
    item.tier = tier;
    stage.shadowsDirty();
  }

  // ── Camera ─────────────────────────────────────────────────────────────────
  /** Keep the subject clear of the panel (beside the lab on wide screens, under it on phones). */
  let freeArea = { width: 1, height: 1 };
  function updateInsets() {
    const stageRect = stageElement.getBoundingClientRect();
    const panelRect = panelElement.getBoundingClientRect();
    const wide = WIDE_LAYOUT.matches;
    const right = wide ? Math.max(0, stageRect.right - panelRect.left) : 0;
    const bottom = wide ? 0 : Math.max(0, stageRect.bottom - panelRect.top);
    const top = state.mode === 'overview' ? 64 : 24; // room for the room names above the lab
    freeArea = { width: stageRect.width - right, height: stageRect.height - top - bottom };
    // Six full name cards need about 900 px; below that they shrink to icon +
    // short name, and on a phone to the icon alone (the panel lists the names).
    stageElement.classList.toggle('is-compact', stageRect.width - right < 900);
    stageElement.classList.toggle('is-tiny', stageRect.width - right < 560);
    rig.setInsets({ top, right, bottom, left: 0 });
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

  function frameCurrent({ instant = false } = {}) {
    updateInsets();
    const duration = instant ? 0 : 1.1;
    if (state.mode === 'item') {
      const item = itemOf(state.itemId);
      return rig.frame(item.box, itemView(item), { duration, limits: { orbit: 180, minElevation: 4, maxElevation: 80, zoomIn: 0.4, zoomOut: 2.6 } });
    }
    if (state.mode === 'room') {
      return rig.frame(roomOf(state.roomId).focusBox, VIEWS.room, { duration, limits: { orbit: 55, minElevation: 14, maxElevation: 78, zoomIn: 0.3, zoomOut: 1.5 } });
    }
    const view = freeArea.height > freeArea.width * 1.05 ? VIEWS.overviewPortrait : VIEWS.overview;
    return rig.frame(shell.frameBox, view, { duration, limits: { orbit: 25, minElevation: 18, maxElevation: 80, zoomIn: 0.3, zoomOut: 1.25 } });
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

  function navigate(target, { instant = false, history: historyMode = 'push' } = {}) {
    const room = roomOf(target.roomId);
    const item = room ? itemOf(target.itemId) : null;
    const next = {
      mode: item && item.roomId === room.def.id ? 'item' : room ? 'room' : 'overview',
      roomId: room ? room.def.id : null,
      itemId: item && item.roomId === room.def.id ? item.id : null,
    };
    if (next.mode === state.mode && next.roomId === state.roomId && next.itemId === state.itemId) return;

    const previous = state;
    state = next;

    if (previous.itemId && previous.itemId !== next.itemId) showTier(itemOf(previous.itemId), 'lite');
    if (next.itemId) showTier(itemOf(next.itemId), 'hero');

    // Room names over the whole floor; machine markers inside a room; nothing
    // in front of a machine being inspected.
    for (const label of roomLabels.values()) label.handle.setShown(next.mode === 'overview');
    for (const other of rooms.items.values()) other.label.setShown(next.mode === 'room' && other.roomId === next.roomId);
    setHover(null);

    renderPanel();
    root.dataset.mode = next.mode;

    const hash = hashFor(next);
    if (historyMode !== 'none' && location.hash !== hash) {
      if (historyMode === 'replace') history.replaceState(null, '', hash);
      else history.pushState(null, '', hash);
    }

    const title = next.itemId ? itemOf(next.itemId).name : next.roomId ? room.def.name : 'Lab overview';
    announcer.textContent = title;

    // The label that was just activated has gone; carry keyboard focus over to
    // the panel so the next Tab lands on what is now on offer.
    const focused = document.activeElement;
    if (previous.mode && (!focused || focused === document.body || focused.closest('[inert]'))) panelElement.focus({ preventScroll: true });

    frameCurrent({ instant });
  }

  function goBack() {
    if (state.mode === 'item') navigate({ roomId: state.roomId });
    else if (state.mode === 'room') navigate({});
  }

  window.addEventListener('popstate', () => navigate(locationFromHash(), { history: 'none' }));
  window.addEventListener('hashchange', () => navigate(locationFromHash(), { history: 'none' }));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !event.defaultPrevented) goBack();
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
    if (!hit) return null;
    if (hit.type === 'item') return { roomId: hit.roomId, itemId: hit.itemId };
    if (hit.roomId !== state.roomId) return { roomId: hit.roomId };
    if (state.mode === 'item') return { roomId: hit.roomId }; // tap the room to step back from the machine
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

  createPicker({
    domElement: stage.renderer.domElement,
    camera: stage.camera,
    getTargets: () => (state.mode === 'overview' ? [roomTargets] : [itemTargets.get(state.roomId) ?? [], roomTargets]),
    onTap(hit) {
      const action = actionFor(hit);
      if (action) navigate(action);
    },
    onHover: (hit) => setHover(hit),
  });

  // ── Buttons on the stage ───────────────────────────────────────────────────
  document.getElementById('zoom-in').addEventListener('click', () => rig.zoomBy(0.8));
  document.getElementById('zoom-out').addEventListener('click', () => rig.zoomBy(1.25));
  document.getElementById('go-home').addEventListener('click', () => navigate({}));
  document.getElementById('brand').addEventListener('click', (event) => {
    event.preventDefault();
    navigate({});
  });

  stage.onResize(() => {
    updateInsets();
    rig.refit();
  });
  WIDE_LAYOUT.addEventListener('change', () => frameCurrent({ instant: true }));

  // ── Go ─────────────────────────────────────────────────────────────────────
  navigate(locationFromHash(), { instant: true, history: 'replace' });
  root.dataset.tour = 'loading';

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
        done < total ? `Loading 3D models… ${done} of ${total}` : `${failed} of ${total} 3D models could not be loaded`;
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
    rooms: ROOMS.map((room) => room.id),
    items: () => [...rooms.items.values()].map(({ id, status, name, modelState, tier }) => ({ id, status, name, modelState, tier })),
    renderInfo: () => ({ ...stage.renderer.info.render, ...stage.renderer.info.memory, framesDrawn: stage.framesDrawn, quality: stage.quality }),
    stage,
    rig,
  };
}

try {
  start();
} catch (error) {
  fail(error);
}
