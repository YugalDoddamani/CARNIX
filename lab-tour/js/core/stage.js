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
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const QUALITY = {
  low: { maxPixelRatio: 1, antialias: false, shadowMapSize: 1024 },
  medium: { maxPixelRatio: 1.5, antialias: true, shadowMapSize: 2048 },
  high: { maxPixelRatio: 2, antialias: true, shadowMapSize: 4096 },
};

/** Pick a quality tier for this device unless one was asked for (?q=low|medium|high). */
export function chooseQuality(requested) {
  if (QUALITY[requested]) return requested;
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
   * around it: the smaller the area, the crisper the shadows.
   */
  const _corner = new THREE.Vector3();
  function fitShadowTo(box, groundY = 0) {
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
      for (const y of [Math.min(box.min.y, groundY), box.max.y]) {
        for (const z of [box.min.z, box.max.z]) fitted.expandByPoint(_corner.set(x, y, z).applyMatrix4(toLight));
      }
    }
    const margin = radius * 0.06;
    cam.left = fitted.min.x - margin;
    cam.right = fitted.max.x + margin;
    cam.bottom = fitted.min.y - margin;
    cam.top = fitted.max.y + margin;
    // Depth range: from the nearest corner to where the farthest top edge's
    // shadow lands on the ground. Kept tight because shadow bias scales with it.
    const height = box.max.y - Math.min(box.min.y, groundY);
    const reach = height * (1 / KEY_DIRECTION.y - KEY_DIRECTION.y);
    cam.near = Math.max(0.1, -fitted.max.z - margin);
    cam.far = -fitted.min.z + reach + margin;
    cam.updateProjectionMatrix();

    ground.position.set(center.x, groundY, center.z);
    ground.scale.setScalar(radius * 8);
    shadowsDirty();
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

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const tick of tickers) if (tick(dt, now)) needsRender = true;
    if (!needsRender) return;
    needsRender = false;
    renderer.render(scene, camera);
    frames++;
    for (const callback of afterRender) callback();
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
