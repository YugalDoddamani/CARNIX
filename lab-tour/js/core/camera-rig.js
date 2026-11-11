// Camera navigation: "frame this box from this direction", with a smooth glide.
//
// The camera is always described the way a person would: what it looks at, the
// compass direction it looks from (azimuth, degrees east of south), how high it
// is (elevation) and the lens (fov). Distance is never hand-tuned — it is solved
// so the box fits the visible area on any screen shape, clear of UI panels.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

function shortestAngle(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta;
}

/** Unit vector from the target toward the camera. */
function direction(azimuth, elevation, out = new THREE.Vector3()) {
  const cos = Math.cos(elevation);
  return out.set(Math.sin(azimuth) * cos, Math.sin(elevation), Math.cos(azimuth) * cos);
}

export function createCameraRig({ camera, domElement, invalidate, addTicker }) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.9;
  controls.enablePan = false;
  controls.addEventListener('change', invalidate);

  // Pixels of the canvas covered by UI on each side; framing avoids them.
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  let glide = null;
  /** The pose most recently asked for; re-solved when the window is resized. */
  let lastRequest = null;

  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3();
  const _dir = new THREE.Vector3();
  const _offset = new THREE.Vector3();

  /**
   * Solve the pose that fits `box` in the visible part of the canvas: as large
   * as possible, centred in the area not covered by UI.
   * Returns { target, azimuth, elevation, distance, fov } (angles in radians).
   */
  function solve(box, { azimuth, elevation, fov, padding = 0.08 }) {
    const az = azimuth * DEG;
    const el = elevation * DEG;
    const width = domElement.clientWidth || 1;
    const height = domElement.clientHeight || 1;

    // The free rectangle in normalised device coordinates (−1…1 on both axes),
    // shrunk by the padding.
    const centerX = (insets.left - insets.right) / width;
    const centerY = (insets.bottom - insets.top) / height;
    const halfW = Math.max(0.1, 1 - (insets.left + insets.right) / width) * (1 - padding);
    const halfH = Math.max(0.1, 1 - (insets.top + insets.bottom) / height) * (1 - padding);

    const tanV = Math.tan((fov * DEG) / 2);
    const tanH = tanV * (width / height);

    direction(az, el, _dir);
    _right.set(Math.cos(az), 0, -Math.sin(az));
    _up.crossVectors(_dir, _right).normalize();

    const corners = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));

    // With perspective, the near corners spread wider than the far ones, so the
    // best aim point is not the box centre. Start there and refine: project the
    // corners, slide the aim so their outline is centred, scale the distance so
    // the outline just fits. A few rounds settle it.
    const target = box.getCenter(new THREE.Vector3());
    let distance = box.getSize(_offset).length() / (2 * Math.min(tanV, tanH));
    for (let round = 0; round < 6; round++) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const corner of corners) {
        _offset.copy(corner).sub(target);
        const depth = Math.max(distance * 0.05, distance - _offset.dot(_dir));
        const x = _offset.dot(_right) / (depth * tanH);
        const y = _offset.dot(_up) / (depth * tanV);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      target.addScaledVector(_right, ((minX + maxX) / 2 - centerX) * distance * tanH);
      target.addScaledVector(_up, ((minY + maxY) / 2 - centerY) * distance * tanV);
      distance *= Math.max((maxX - minX) / (2 * halfW), (maxY - minY) / (2 * halfH));
    }
    return { target, azimuth: az, elevation: el, distance, fov };
  }

  function currentPose() {
    _offset.copy(camera.position).sub(controls.target);
    const distance = _offset.length();
    return {
      target: controls.target.clone(),
      azimuth: Math.atan2(_offset.x, _offset.z),
      elevation: Math.asin(THREE.MathUtils.clamp(_offset.y / distance, -1, 1)),
      distance,
      fov: camera.fov,
    };
  }

  function apply(pose) {
    controls.target.copy(pose.target);
    camera.position.copy(pose.target).addScaledVector(direction(pose.azimuth, pose.elevation, _dir), pose.distance);
    if (camera.fov !== pose.fov) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
    // Keep the depth range tight around what is being looked at.
    camera.near = Math.max(0.2, pose.distance * 0.02);
    camera.far = pose.distance * 6 + 400;
    camera.updateProjectionMatrix();
    camera.lookAt(pose.target);
  }

  /** How far the user may wander from a solved pose. */
  function setLimits(pose, { orbit = 40, minElevation = 12, maxElevation = 75, zoomIn = 0.45, zoomOut = 1.35 } = {}) {
    controls.minDistance = pose.distance * zoomIn;
    controls.maxDistance = pose.distance * zoomOut;
    if (orbit >= 180) {
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
    } else {
      controls.minAzimuthAngle = pose.azimuth - orbit * DEG;
      controls.maxAzimuthAngle = pose.azimuth + orbit * DEG;
    }
    controls.minPolarAngle = (90 - maxElevation) * DEG;
    controls.maxPolarAngle = (90 - minElevation) * DEG;
  }

  function releaseLimits() {
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
  }

  /**
   * Move the camera so `box` is framed as described by `view`
   * ({ azimuth, elevation, fov, padding } in degrees). Resolves when it arrives.
   */
  function frame(box, view, { duration = 1.1, limits } = {}) {
    lastRequest = { box: box.clone(), view, limits };
    const to = solve(box, view);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (glide) glide.resolve(false);
    glide = null;
    controls.enabled = false;
    releaseLimits();

    const arrive = () => {
      to.azimuth = shortestAngle(0, to.azimuth); // back into −180°…180° after a glide the long way round
      apply(to);
      setLimits(to, limits);
      controls.enabled = true;
      controls.update();
      invalidate();
    };

    if (!(duration > 0) || reduceMotion) {
      arrive();
      return Promise.resolve(true);
    }

    const from = currentPose();
    to.azimuth = shortestAngle(from.azimuth, to.azimuth);
    return new Promise((resolve) => {
      glide = { from, to, elapsed: 0, duration, arrive, resolve };
    });
  }

  addTicker((dt) => {
    if (!glide) return controls.enabled ? controls.update() : false;
    glide.elapsed += dt;
    const t = Math.min(1, glide.elapsed / glide.duration);
    const k = easeInOut(t);
    const { from, to } = glide;
    if (t >= 1) {
      const done = glide;
      glide = null;
      done.arrive();
      done.resolve(true);
      return true;
    }
    apply({
      target: from.target.clone().lerp(to.target, k),
      azimuth: lerp(from.azimuth, to.azimuth, k),
      elevation: lerp(from.elevation, to.elevation, k),
      // Interpolating the logarithm of the distance keeps the zoom speed even.
      distance: Math.exp(lerp(Math.log(from.distance), Math.log(to.distance), k)),
      fov: lerp(from.fov, to.fov, k),
    });
    return true;
  });

  /** Re-fit the current view (after a resize or when UI panels change size). */
  function refit() {
    if (!lastRequest || glide) return;
    const pose = solve(lastRequest.box, lastRequest.view);
    apply(pose);
    setLimits(pose, lastRequest.limits);
    controls.update();
    invalidate();
  }

  /** Zoom by a factor (<1 = closer), respecting the current limits. */
  function zoomBy(factor) {
    if (glide) return;
    const pose = currentPose();
    pose.distance = THREE.MathUtils.clamp(pose.distance * factor, controls.minDistance, controls.maxDistance);
    apply(pose);
    controls.update();
    invalidate();
  }

  return {
    controls,
    frame,
    refit,
    zoomBy,
    setInsets(next) {
      insets = { ...insets, ...next };
    },
    get busy() {
      return Boolean(glide);
    },
  };
}
