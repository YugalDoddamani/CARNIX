// Turning pointer input into "the user tapped this" / "the pointer is over this".
//
// A tap is a press and release that barely moved — anything else is the user
// dragging the camera. Hit-testing is done against simple invisible boxes (one
// per room, one per machine) rather than the detailed meshes: it is cheap enough
// to run on every mouse move, and it gives small machines a finger-sized target.
import * as THREE from 'three';

const TAP_MAX_MOVE = 7; // px
const TAP_MAX_TIME = 600; // ms

export function createPicker({ domElement, camera, getTargets, onTap, onHover }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let press = null;
  let hoverQueued = null;
  let lastHover = undefined;

  /** The front-most tap target under a screen point, or null. */
  function pick(clientX, clientY) {
    const rect = domElement.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    // Target lists are in priority order: a machine wins over the room behind it.
    for (const list of getTargets()) {
      const hit = raycaster.intersectObjects(list, false)[0];
      if (hit) return hit.object.userData;
    }
    return null;
  }

  domElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    press = { x: event.clientX, y: event.clientY, time: performance.now(), id: event.pointerId };
  });

  domElement.addEventListener('pointerup', (event) => {
    if (!press || press.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    const held = performance.now() - press.time;
    press = null;
    if (moved <= TAP_MAX_MOVE && held <= TAP_MAX_TIME) onTap(pick(event.clientX, event.clientY));
  });

  domElement.addEventListener('pointercancel', () => {
    press = null;
  });

  // Hover is a mouse-only nicety; at most one hit-test per animation frame.
  domElement.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || event.buttons !== 0) return;
    const point = { x: event.clientX, y: event.clientY };
    if (hoverQueued) {
      hoverQueued = point;
      return;
    }
    hoverQueued = point;
    requestAnimationFrame(() => {
      const { x, y } = hoverQueued;
      hoverQueued = null;
      const hit = pick(x, y);
      const key = hit ? `${hit.type}:${hit.itemId ?? hit.roomId}` : null;
      if (key !== lastHover) {
        lastHover = key;
        onHover(hit, x, y);
      } else if (hit) {
        onHover(hit, x, y, true);
      }
    });
  });

  domElement.addEventListener('pointerleave', () => {
    if (lastHover !== null) {
      lastHover = null;
      onHover(null);
    }
  });

  return { pick };
}
