// Camera navigation: "frame this box from this direction", with a smooth glide.
//
// The camera is always described the way a person would: what it looks at, the
// compass direction it looks from (azimuth, degrees east of south), how high it
// is (elevation) and the lens (fov). Distance is never hand-tuned — it is solved
// so the box fits the visible area on any screen shape, clear of UI panels.
//
// The camera always looks at, and turns around, the CENTRE of what it frames.
// When a panel covers part of the screen the subject still has to sit in the
// middle of what is left; that is done by sliding the picture sideways inside
// the lens (an off-centre projection, `shiftX/shiftY` below), not by aiming the
// camera somewhere else. So a machine that is dragged around turns on the spot
// instead of swinging about a point in the empty air beside it.
//
// TWO CAMERAS. `camera` is the one the visitor steers. `roomCamera` draws the
// lab, and is normally its exact twin. The difference shows when a machine is
// in the spotlight (`room: 'stay'`): the room camera then keeps the direction
// the visitor arrived from, so turning the machine turns the machine only and
// the faded lab behind it stands still. Zooming still moves both, so the
// machine keeps its size against the bench it stands on. When the visitor
// leaves, the room camera first swings round to rejoin (while the lab is still
// faded), and from then on the two move as one again.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;
// Starts and stops with no jolt at all (zero speed and zero acceleration at
// both ends), and never rushes in the middle.
const ease = (t) => t * t * t * (t * (6 * t - 15) + 10);
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// How quickly a turn runs out after the visitor lets go: the share of what is
// left that is used up in one frame at 60 frames a second.
const DAMPING = 0.08;

/** The share of a journey, at its start, in which the room camera rejoins the visitor's camera. */
export const CATCH_UP = 0.3;

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
  controls.dampingFactor = DAMPING;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.9;
  controls.enablePan = false;
  controls.addEventListener('change', () => {
    syncRoomCamera();
    invalidate();
  });

  const roomCamera = camera.clone();
  /** The direction the room camera holds ({ azimuth, elevation }, radians), or null while it is the twin of `camera`. */
  let roomAngles = null;

  // Pixels of the canvas covered by UI on each side; framing avoids them.
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  let glide = null;
  /** The pose most recently asked for; re-solved when the window is resized. */
  let lastRequest = null;
  /** How far the picture is currently slid inside the lens, in CSS pixels. */
  const shift = { x: 0, y: 0 };
  /** The distance at which the subject exactly fits; the visitor's zoom is measured against it. */
  let fitted = 0;

  const _right = new THREE.Vector3();
  const _up = new THREE.Vector3();
  const _dir = new THREE.Vector3();
  const _offset = new THREE.Vector3();

  /**
   * Solve the pose that fits `box` in the visible part of the canvas: as large
   * as possible, centred in the area not covered by UI, looking at its centre.
   * `view` angles are in degrees.
   * Returns { target, azimuth, elevation, distance, fov, shiftX, shiftY } (radians, pixels).
   */
  function solve(box, { azimuth, elevation, fov, padding = 0.08 }) {
    const az = azimuth * DEG;
    const el = elevation * DEG;
    const width = domElement.clientWidth || 1;
    const height = domElement.clientHeight || 1;

    // The free rectangle, in pixels measured from the middle of the canvas
    // (x to the right, y downward).
    const freeW = Math.max(48, width - insets.left - insets.right);
    const freeH = Math.max(48, height - insets.top - insets.bottom);
    const freeX = insets.left + freeW / 2 - width / 2;
    const freeY = insets.top + freeH / 2 - height / 2;
    const fitW = freeW * (1 - padding);
    const fitH = freeH * (1 - padding);

    // One unit of "tangent" (sideways distance ÷ depth) covers this many pixels,
    // whatever the distance.
    const pixelsPerTan = height / (2 * Math.tan((fov * DEG) / 2));

    direction(az, el, _dir);
    _right.set(Math.cos(az), 0, -Math.sin(az));
    _up.crossVectors(_dir, _right).normalize();

    const target = box.getCenter(new THREE.Vector3());
    const corners = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z).sub(target));

    // The outline of the box as the lens sees it from `distance`.
    const outline = (distance) => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const corner of corners) {
        const depth = Math.max(distance * 0.05, distance - corner.dot(_dir));
        const x = corner.dot(_right) / depth;
        const y = corner.dot(_up) / depth;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      return { minX, maxX, minY, maxY };
    };

    // With perspective the near corners spread wider than the far ones, so the
    // right distance cannot be written down directly; a few rounds of "measure
    // the outline, scale the distance" settle it.
    let distance = (box.getSize(_offset).length() * pixelsPerTan) / Math.min(fitW, fitH);
    for (let round = 0; round < 8; round++) {
      const o = outline(distance);
      distance *= Math.max(((o.maxX - o.minX) * pixelsPerTan) / fitW, ((o.maxY - o.minY) * pixelsPerTan) / fitH);
    }
    // Slide the picture so the middle of the outline lands on the middle of the
    // free rectangle.
    const o = outline(distance);
    return {
      target,
      azimuth: az,
      elevation: el,
      distance,
      fov,
      shiftX: freeX - ((o.minX + o.maxX) / 2) * pixelsPerTan,
      shiftY: freeY + ((o.minY + o.maxY) / 2) * pixelsPerTan,
    };
  }

  /** Bring the room camera up to date: the same lens and distance as `camera`, from its own direction if it holds one. */
  function syncRoomCamera() {
    roomCamera.copy(camera);
    if (roomAngles) {
      const distance = _offset.copy(camera.position).sub(controls.target).length();
      roomCamera.position.copy(controls.target).addScaledVector(direction(roomAngles.azimuth, roomAngles.elevation, _dir), distance);
      roomCamera.lookAt(controls.target);
    }
    roomCamera.updateMatrixWorld(true);
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
      shiftX: shift.x,
      shiftY: shift.y,
    };
  }

  function apply(pose) {
    controls.target.copy(pose.target);
    camera.position.copy(pose.target).addScaledVector(direction(pose.azimuth, pose.elevation, _dir), pose.distance);
    camera.fov = pose.fov;
    // Keep the depth range tight around what is being looked at.
    camera.near = Math.max(0.2, pose.distance * 0.02);
    camera.far = pose.distance * 6 + 400;

    shift.x = pose.shiftX;
    shift.y = pose.shiftY;
    const width = domElement.clientWidth || 1;
    const height = domElement.clientHeight || 1;
    camera.aspect = width / height;
    if (Math.abs(shift.x) < 0.25 && Math.abs(shift.y) < 0.25) {
      if (camera.view) camera.clearViewOffset(); // also rebuilds the projection
      else camera.updateProjectionMatrix();
    } else {
      // "Show the window that starts (−shift) pixels from the usual corner":
      // the scene appears moved by +shift. This rebuilds the projection.
      camera.setViewOffset(width, height, -shift.x, -shift.y, width, height);
    }
    camera.lookAt(pose.target);
    syncRoomCamera();
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
   *   keepAngles  stay on the side the visitor has turned to; only re-fit the
   *               distance (used while a machine is being taken apart)
   *   room        'join' (default): the room camera moves with the visitor's.
   *               'stay': once arrived, it holds its direction while the
   *               visitor turns what is framed (a machine in the spotlight).
   */
  function frame(box, view, { duration = 1.1, limits, keepAngles = false, room = 'join' } = {}) {
    const from = currentPose();
    const interrupted = glide;
    if (keepAngles) {
      // "Where the visitor has turned to" — or, if the camera is still on its
      // way somewhere, where it was going.
      const basis = interrupted ? interrupted.to : from;
      view = { ...view, azimuth: basis.azimuth / DEG, elevation: basis.elevation / DEG };
    }
    lastRequest = { box: box.clone(), view, limits };
    const to = solve(box, view);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (glide) glide.resolve(false);
    glide = null;
    controls.enabled = false;
    releaseLimits();

    // Re-fitting what is already in the spotlight: the room camera simply keeps
    // holding. Any other journey starts with it rejoining the visitor's camera.
    // (A re-fit that cuts short the journey TO the machine is part of that
    // journey: the room camera is not holding yet.)
    const holding = Boolean(room === 'stay' && keepAngles && roomAngles && (!interrupted || interrupted.holding));
    let lag = null;
    if (roomAngles && !holding) {
      lag = { azimuth: shortestAngle(0, roomAngles.azimuth - from.azimuth), elevation: roomAngles.elevation - from.elevation };
      if (Math.abs(lag.azimuth) < DEG && Math.abs(lag.elevation) < DEG) {
        lag = null;
        roomAngles = null;
      }
    }

    const arrive = (pose) => {
      pose.azimuth = shortestAngle(0, pose.azimuth); // back into −180°…180° after a glide the long way round
      if (room !== 'stay') roomAngles = null;
      else if (!holding) roomAngles = { azimuth: pose.azimuth, elevation: pose.elevation };
      apply(pose);
      fitted = pose.distance;
      setLimits(pose, limits);
      controls.enabled = true;
      controls.update();
      invalidate();
    };

    if (!(duration > 0) || reduceMotion) {
      arrive(to);
      return Promise.resolve(true);
    }

    to.azimuth = shortestAngle(from.azimuth, to.azimuth);
    return new Promise((resolve) => {
      glide = { from, to, elapsed: 0, duration, arrive, resolve, holding, lag, catchUp: duration * CATCH_UP };
    });
  }

  addTicker((dt) => {
    if (!glide) {
      if (!controls.enabled || !(dt > 0)) return false;
      // The controls ease out per frame; scale that to the time the frame took,
      // so a turn runs out equally fast on a slow phone and on a 120 Hz screen.
      controls.dampingFactor = 1 - Math.pow(1 - DAMPING, dt * 60);
      return controls.update();
    }
    glide.elapsed += dt;
    const t = Math.min(1, glide.elapsed / glide.duration);
    const k = ease(t);
    const { from, to } = glide;
    if (t >= 1) {
      const done = glide;
      glide = null;
      done.arrive(done.to);
      done.resolve(true);
      return true;
    }
    const pose = {
      target: from.target.clone().lerp(to.target, k),
      azimuth: lerp(from.azimuth, to.azimuth, k),
      elevation: lerp(from.elevation, to.elevation, k),
      // Interpolating the logarithm of the distance keeps the zoom speed even.
      distance: Math.exp(lerp(Math.log(from.distance), Math.log(to.distance), k)),
      fov: lerp(from.fov, to.fov, k),
      shiftX: lerp(from.shiftX, to.shiftX, k),
      shiftY: lerp(from.shiftY, to.shiftY, k),
    };
    if (glide.lag) {
      // The room camera closes the gap to the visitor's camera early in the
      // journey, while the lab is still faded.
      const left = 1 - smooth(Math.min(1, glide.elapsed / glide.catchUp));
      roomAngles = left > 0 ? { azimuth: pose.azimuth + glide.lag.azimuth * left, elevation: pose.elevation + glide.lag.elevation * left } : null;
      if (!roomAngles) glide.lag = null;
    }
    apply(pose);
    return true;
  });

  /**
   * Re-fit the current view after the window or a UI panel changed size. The
   * visitor keeps the side they turned to and how far they zoomed; only the
   * fit to the new free area is redone. (On phones the window changes height
   * every time the browser's address bar slides away.)
   */
  function refit() {
    if (!lastRequest) return;
    const asked = solve(lastRequest.box, lastRequest.view);
    if (glide) {
      // Still on the way: change where it is going, not where it is.
      asked.azimuth = shortestAngle(glide.from.azimuth, asked.azimuth);
      glide.to = asked;
      return;
    }
    const now = currentPose();
    const zoom = fitted > 0 ? now.distance / fitted : 1;
    const pose = solve(lastRequest.box, { ...lastRequest.view, azimuth: now.azimuth / DEG, elevation: now.elevation / DEG });
    fitted = pose.distance;
    setLimits(asked, lastRequest.limits);
    pose.distance = THREE.MathUtils.clamp(pose.distance * zoom, controls.minDistance, controls.maxDistance);
    apply(pose);
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
    /** Draws the lab; see "Two cameras" at the top of this file. */
    roomCamera,
    frame,
    refit,
    zoomBy,
    setInsets(next) {
      insets = { ...insets, ...next };
    },
    /** Where the camera is now, in the rig's own terms (angles in degrees). For checks. */
    get pose() {
      const pose = currentPose();
      return { ...pose, azimuth: pose.azimuth / DEG, elevation: pose.elevation / DEG };
    },
    /** How far the room camera's direction is from the visitor's, in degrees (0 = they are one). */
    get lag() {
      if (!roomAngles) return 0;
      const pose = currentPose();
      return Math.max(Math.abs(shortestAngle(0, roomAngles.azimuth - pose.azimuth)), Math.abs(roomAngles.elevation - pose.elevation)) / DEG;
    },
    /** Does the room camera hold a direction of its own right now? For checks. */
    get roomHolds() {
      return Boolean(roomAngles);
    },
    get busy() {
      return Boolean(glide);
    },
    /** Seconds until the camera arrives (0 when it is not travelling). */
    get remaining() {
      return glide ? Math.max(0, glide.duration - glide.elapsed) : 0;
    },
  };
}
