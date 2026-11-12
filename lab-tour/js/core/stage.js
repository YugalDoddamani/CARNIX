// Renderer, lights and the frame loop.
//
// The light rig is the asset library's studio rig — same lights, intensities,
// colours, tone mapping and exposure — with ONE deliberate change: the key light
// (the one that casts shadows) comes from the east instead of the south-east.
// In the library it sat almost behind the viewer, which is right for a product
// on a table; in a room seen from the south-east it would hide every shadow
// behind the object casting it and light all visible faces equally (flat). From
// the east, shadows fall sideways across the floor, the two faces of a box the
// visitor sees get different tones, and the tall north and west walls never
// shade the rooms. Machine fronts are consequently lit a little more softly
// here than in the library viewer.
//
// Two more things differ, because a whole floor is not a tabletop:
//   · frames are drawn only when something changed (a still tour costs no
//     battery), and
//   · the shadow map is rendered once and reused; it is re-rendered only when
//     something in the scene changes.
//
// The stage can also put ONE thing in the spotlight (see `spotlight` below):
// that thing is drawn as it is, everything around it is faded.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const QUALITY = {
  low: { maxPixelRatio: 1, antialias: false, shadowMapSize: 1024 },
  medium: { maxPixelRatio: 1.5, antialias: true, shadowMapSize: 2048 },
  high: { maxPixelRatio: 2, antialias: true, shadowMapSize: 4096 },
};

/** Pick a quality tier for this device unless one was asked for (?q=low|medium|high). */
export function chooseQuality(requested) {
  // "Own" matters: the request comes from the address bar, and names such as
  // "constructor" exist on every object without being a quality tier.
  if (Object.prototype.hasOwnProperty.call(QUALITY, requested)) return requested;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const memory = navigator.deviceMemory || 8;
  if (coarse || memory <= 4) return 'medium';
  return 'high';
}

// Direction TOWARD the key light: compass bearing 78° east of south, 48° up.
// (Library original: 40° east of south, 45° up.) Keep the bearing between 0°
// and 90°, or the north / west walls start casting shadows into the rooms.
const KEY_BEARING = (78 * Math.PI) / 180;
const KEY_HEIGHT = (48 * Math.PI) / 180;
const KEY_DIRECTION = new THREE.Vector3(Math.sin(KEY_BEARING) * Math.cos(KEY_HEIGHT), Math.sin(KEY_HEIGHT), Math.cos(KEY_BEARING) * Math.cos(KEY_HEIGHT));

/** A round patch that is solid in the middle and fades to nothing at the rim. */
function softDiscTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // Close to a bell curve: no visible edge anywhere.
  for (const [stop, alpha] of [[0, 1], [0.25, 0.86], [0.45, 0.55], [0.62, 0.28], [0.78, 0.1], [0.9, 0.025], [1, 0]]) {
    gradient.addColorStop(stop, `rgba(255, 255, 255, ${alpha})`);
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStage(container, qualityName) {
  const quality = QUALITY[qualityName];
  const renderer = new THREE.WebGLRenderer({ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.info.autoReset = false; // a frame can be several passes; count them all
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Soft all-round studio light, generated on the GPU (no image file to load).
  let environment = null;
  function buildEnvironment() {
    environment?.dispose();
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environment.texture;
    pmrem.dispose();
  }
  buildEnvironment();

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);
  // What draws the lab. The same camera, unless the camera rig supplies a twin
  // that stands still while a spotlit machine is turned (see camera-rig.js).
  let labCamera = camera;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd4dce8, 0.82));

  const key = new THREE.DirectionalLight(0xffffff, 1.88);
  key.castShadow = true;
  key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.05;
  key.shadow.radius = 2.6;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xf1f5fc, 0.98);
  fill.position.set(-20, 12, 16);
  const rim = new THREE.DirectionalLight(0xffffff, 1.12);
  rim.position.set(-12, 14, -18);
  const top = new THREE.DirectionalLight(0xffffff, 0.5);
  top.position.set(0, 24, -1);
  scene.add(fill, rim, top);

  // Ground: invisible except for the shadow the building casts on it, so the
  // page background shows through.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ color: 0x1c2740, opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /**
   * Aim the shadow-casting light at `box` and fit its shadow frustum tightly
   * around it: the smaller the area, the crisper the shadows. Anything outside
   * the frustum neither casts nor receives a shadow.
   */
  const _corner = new THREE.Vector3();
  function aimShadow(box, floorY) {
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    key.target.position.copy(center);
    key.position.copy(center).addScaledVector(KEY_DIRECTION, radius * 1.6);
    key.updateMatrixWorld(true);
    key.target.updateMatrixWorld(true);

    const cam = key.shadow.camera;
    cam.position.copy(key.position);
    cam.lookAt(center);
    cam.updateMatrixWorld(true);
    const toLight = new THREE.Matrix4().copy(cam.matrixWorld).invert();
    const fitted = new THREE.Box3();
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [Math.min(box.min.y, floorY), box.max.y]) {
        for (const z of [box.min.z, box.max.z]) fitted.expandByPoint(_corner.set(x, y, z).applyMatrix4(toLight));
      }
    }
    const margin = radius * 0.06;
    cam.left = fitted.min.x - margin;
    cam.right = fitted.max.x + margin;
    cam.bottom = fitted.min.y - margin;
    cam.top = fitted.max.y + margin;
    // Depth range: from the nearest corner to where the farthest top edge's
    // shadow lands on the floor. Kept tight because shadow bias scales with it.
    const height = box.max.y - Math.min(box.min.y, floorY);
    const reach = height * (1 / KEY_DIRECTION.y - KEY_DIRECTION.y);
    cam.near = Math.max(0.1, -fitted.max.z - margin);
    cam.far = -fitted.min.z + reach + margin;
    cam.updateProjectionMatrix();
    shadowsDirty();
    return { center, radius };
  }

  /** The everyday shadow set-up: the whole building, and the ground it stands on. */
  let home = null;
  function fitShadowTo(box, groundY = 0) {
    home = { box: box.clone(), groundY };
    const { center, radius } = aimShadow(box, groundY);
    ground.position.set(center.x, groundY, center.z);
    ground.scale.setScalar(radius * 8);
  }

  // ── Frame loop: draw only when something changed ───────────────────────────
  const tickers = new Set();
  const afterRender = new Set();
  const afterResize = new Set();
  let needsRender = true;
  let last = performance.now();
  let frames = 0;

  function invalidate() {
    needsRender = true;
  }
  function shadowsDirty() {
    renderer.shadowMap.needsUpdate = true;
    needsRender = true;
  }

  function resize() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    // `false`: the canvas is sized by CSS (it fills the container); only the
    // drawing buffer is resized here.
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    needsRender = true;
    for (const callback of afterResize) callback();
  }

  // ── Spotlight: one thing as it is, the rest of the lab faded ───────────────
  //
  // Three passes instead of one:
  //   1. the whole lab, exactly as always;
  //   2. a "veil": one full-screen rectangle that multiplies everything drawn so
  //      far, transparency included, by the share that is to remain. The canvas
  //      is see-through, so the page background shows through where the lab
  //      thins out — the lab really is at 10 %, not painted over with white;
  //   3. the spotlit thing once more, on top, untouched.
  // Fading the materials instead would show every surface through every other
  // (an x-ray), and would need thousands of materials changed and changed back.
  const veilMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor, // what is on the canvas × (1 − veil)
  });
  const veilQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), veilMaterial);
  veilQuad.frustumCulled = false;
  const veilScene = new THREE.Scene();
  veilScene.add(veilQuad);
  const veilCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // With its surroundings gone a machine would float. A soft patch of shade
  // under it — the oldest trick of product photography — puts it back down.
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: softDiscTexture(), color: 0x16233f, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
  );
  shade.name = 'spotlight-shade';
  shade.rotation.x = -Math.PI / 2;
  shade.visible = false; // only ever drawn in pass 3
  shade.renderOrder = -1;
  scene.add(shade);

  // A camera with nothing in front of it. Rendering the scene with it draws no
  // surface, but still refreshes the shadow map when that is due.
  const blindCamera = new THREE.PerspectiveCamera(1, 1, 0.1, 0.2);
  blindCamera.position.set(0, -1e6, 0);
  blindCamera.lookAt(0, -2e6, 0);
  blindCamera.updateMatrixWorld(true);

  const SHADE_STRENGTH = 0.34;
  const TIGHT_SHADOWS_FROM = 0.5; // veil strength from which the shadow map serves the spotlit thing alone
  let rest = 0.9; // veil strength when settled (1 − share of the surroundings that remains)
  let passing = 0.3;
  let spot = null; // { key, object?, only?, box }
  let veil = 0;
  let veilSteps = [];
  let veilStep = null;
  let shadowsFor = null; // key of the spotlit thing the shadow map is fitted to, or null = whole building

  const smooth = (t) => t * t * (3 - 2 * t);

  function placeShade() {
    if (!spot?.box) return;
    const size = spot.box.getSize(new THREE.Vector3());
    const center = spot.box.getCenter(new THREE.Vector3());
    shade.position.set(center.x, spot.box.min.y + 0.012, center.z);
    shade.scale.set(size.x * 1.35 + size.y * 0.55, size.z * 1.35 + size.y * 0.55, 1);
  }

  function setSpot(next) {
    spot = next;
    placeShade();
    needsRender = true;
  }

  /** Fit the shadow map to the spotlit thing while the rest is faded, to the building otherwise. */
  function serveShadows() {
    const want = spot?.box && veil >= TIGHT_SHADOWS_FROM ? spot.key : null;
    if (want === shadowsFor) return;
    shadowsFor = want;
    if (want) aimShadow(spot.box, spot.box.min.y);
    else if (home) aimShadow(home.box, home.groundY);
  }

  /**
   * Put one thing in the spotlight, or none (null).
   *   spec.key     identity: asking for the same key twice does nothing
   *   spec.object  something already in the scene; it is drawn again on top
   *   spec.only    objects (children of the scene, normally invisible) drawn
   *                only in the spotlight — e.g. a stand-in for a placeholder
   *   spec.box     its bounds (world), for the shade under it and the shadows
   * Going from one thing to another lets the surroundings come part of the way
   * back and swaps at that moment, when the difference between "lit" and
   * "faded" is smallest.
   *   hold   seconds, out of `duration`, to wait before anything changes
   */
  function spotlight(spec, { duration = 1, instant = false, hold = 0 } = {}) {
    if ((spec?.key ?? null) === (spot?.key ?? null) && !veilSteps.length && !veilStep) return;
    veilStep = null;
    if (instant || !(duration > 0)) {
      veilSteps = [];
      setSpot(spec);
      veil = spec ? rest : 0;
      serveShadows();
      return;
    }
    const wait = Math.min(Math.max(0, hold), duration * 0.5);
    const run = duration - wait;
    veilSteps = wait > 0 ? [{ to: veil, duration: wait }] : [];
    if (!spec) veilSteps.push({ to: 0, duration: run, after: () => setSpot(null) });
    else if (!spot || veil < 0.02 || spot.key === spec.key) {
      setSpot(spec);
      veilSteps.push({ to: rest, duration: run });
    } else {
      veilSteps.push({ to: Math.min(veil, passing), duration: run * 0.5, after: () => setSpot(spec) }, { to: rest, duration: run * 0.5 });
    }
    needsRender = true;
  }

  tickers.add((dt) => {
    let left = dt;
    let changed = false;
    for (;;) {
      if (!veilStep && veilSteps.length) veilStep = { ...veilSteps.shift(), from: veil, elapsed: 0 };
      if (!veilStep) break;
      changed = true;
      const used = Math.min(left, veilStep.duration - veilStep.elapsed);
      veilStep.elapsed += used;
      left -= used;
      const t = Math.min(1, veilStep.elapsed / veilStep.duration);
      veil = veilStep.from + (veilStep.to - veilStep.from) * smooth(t);
      if (t < 1) break;
      const done = veilStep;
      veilStep = null;
      done.after?.();
      // Time left over in this frame belongs to the next step, or a slow
      // device would lose a frame's worth at every hand-over.
      if (left <= 0) break;
    }
    if (changed) serveShadows();
    return changed;
  });

  /** Hide everything but the lights and the spotlit thing; returns the undo. */
  function isolate() {
    const hidden = [];
    const extras = spot.only ?? [];
    const hide = (node) => {
      if (node.visible && !node.isLight && !extras.includes(node) && node !== shade) {
        node.visible = false;
        hidden.push(node);
      }
    };
    if (spot.object) {
      // Walk up from the thing to the scene, hiding its siblings at every level.
      for (let node = spot.object; node.parent; node = node.parent) {
        for (const sibling of node.parent.children) if (sibling !== node) hide(sibling);
      }
    } else {
      for (const child of scene.children) hide(child);
    }
    for (const extra of extras) extra.visible = true;
    shade.visible = shade.material.opacity > 0.004;
    return () => {
      for (const node of hidden) node.visible = true;
      for (const extra of extras) extra.visible = false;
      shade.visible = false;
    };
  }

  function draw() {
    renderer.info.reset();
    if (!spot || veil < 0.004) {
      renderer.render(scene, labCamera);
      return;
    }
    // 1. The lab around the spotlit thing, and not the thing itself: the lab
    //    camera may be looking from another side (camera-rig.js), and a faint
    //    second copy of the machine would show beside the real one. The shadow
    //    map still has to include it, so when that is due it is refreshed first.
    const lit = spot.object ?? null;
    if (lit && renderer.shadowMap.needsUpdate) renderer.render(scene, blindCamera);
    if (lit) lit.visible = false;
    renderer.render(scene, labCamera);
    if (lit) lit.visible = true;
    renderer.autoClear = false;
    veilMaterial.opacity = veil;
    renderer.render(veilScene, veilCamera); // 2. fade it
    renderer.clearDepth(); // nothing faded may hide the spotlit thing
    shade.material.opacity = SHADE_STRENGTH * smooth(Math.min(1, veil / rest));
    const undo = isolate();
    renderer.render(scene, camera); // 3. the spotlit thing, as it is, from where the visitor has turned to
    undo();
    renderer.autoClear = true;
  }

  /** Move everything that is animated on by `dt` seconds, then draw if anything changed. */
  function advance(dt, now, { draw: wanted = true } = {}) {
    for (const tick of tickers) if (tick(dt, now)) needsRender = true;
    if (!needsRender || !wanted) return;
    needsRender = false;
    draw();
    frames++;
    for (const callback of afterRender) callback();
  }

  let paused = false;
  function frame(now) {
    requestAnimationFrame(frame);
    // Never more than a tenth of a second per frame: on a slow device a glide
    // gets slower, it does not turn into a jump.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) advance(dt, now);
  }

  new ResizeObserver(resize).observe(container);
  resize();
  requestAnimationFrame(frame);

  // Browsers may take the graphics context away (a phone tab left in the
  // background, a driver reset). three.js restores ordinary textures and buffers
  // by itself; what was rendered on the GPU — the environment light and the
  // shadow map — has to be made again, and a frame drawn.
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    environment = null; // its GPU objects went with the old context; nothing left to free
    buildEnvironment();
    shadowsDirty();
  });

  return {
    renderer,
    scene,
    camera,
    quality: qualityName,
    /** Request a redraw. */
    invalidate,
    /** Request a redraw including the shadow map (call after adding/moving objects). */
    shadowsDirty,
    fitShadowTo,
    /** The camera that draws the lab, when it is not `camera` itself (the camera rig's `roomCamera`). */
    setLabCamera(other) {
      labCamera = other ?? camera;
      needsRender = true;
    },
    /** Put one thing in the spotlight and fade the rest; null to end it. See `spotlight` above. */
    spotlight,
    /** The spotlit thing changed shape (it was taken apart): new bounds. */
    spotlightBounds(box) {
      if (!spot) return;
      spot.box = box.clone();
      placeShade();
      if (shadowsFor) aimShadow(spot.box, spot.box.min.y);
      needsRender = true;
    },
    /** How much of the surroundings remains when settled (0.1 = 10 %), and while passing between two things. */
    setSpotlightLevels({ rest: restLevel, passing: passingLevel }) {
      rest = 1 - restLevel;
      passing = 1 - passingLevel;
    },
    /** For checks: what is lit, how strongly the rest is faded (0…1), and whether that is still changing. */
    get spotlightState() {
      return { key: spot?.key ?? null, veil, busy: Boolean(veilStep || veilSteps.length), tightShadows: Boolean(shadowsFor) };
    },
    /**
     * For checks: draw one frame right now with the surroundings at `share` of
     * their full strength (1 = not faded at all), whatever the spotlight says.
     * The next ordinary frame puts things back.
     */
    drawWithSurroundingsAt(share) {
      const kept = veil;
      veil = 1 - share;
      draw();
      veil = kept;
      needsRender = true;
    },
    /** For checks: stop the clock and move it by hand, to look at a glide one step at a time. */
    clock: {
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
      },
      /** `{ draw: false }` moves time on without drawing; the next step that draws shows the result. */
      step(dt, options) {
        advance(dt, performance.now(), options);
      },
    },
    /** fn(dt, now) is called every animation frame; return true to request a redraw. */
    addTicker: (fn) => (tickers.add(fn), () => tickers.delete(fn)),
    /** fn() is called after each drawn frame (used to position HTML labels). */
    onAfterRender: (fn) => (afterRender.add(fn), () => afterRender.delete(fn)),
    /** fn() is called after the canvas has been resized. */
    onResize: (fn) => (afterResize.add(fn), () => afterResize.delete(fn)),
    get framesDrawn() {
      return frames;
    },
  };
}
