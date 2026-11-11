// HTML labels pinned to points in the 3D scene.
//
// Labels are real DOM elements (buttons), not textures: the text stays crisp at
// any zoom, they are styled with ordinary CSS, and they work with the keyboard
// and screen readers. Each frame that is actually drawn, every visible label is
// moved to where its anchor point lands on screen.
import * as THREE from 'three';

const _projected = new THREE.Vector3();

export function createLabelLayer(container, camera) {
  const layer = document.createElement('div');
  layer.className = 'label-layer';
  container.appendChild(layer);

  const labels = new Set();

  /**
   * @param {object} options
   * @param {HTMLElement} options.element   what to show
   * @param {THREE.Vector3} options.anchor  world position it is pinned to
   */
  function add({ element, anchor }) {
    const label = { element, anchor, shown: true, onScreen: false };
    element.classList.add('label');
    layer.appendChild(element);
    labels.add(label);
    return {
      setShown(shown) {
        label.shown = shown;
        element.classList.toggle('is-hidden', !shown);
        // Hidden labels must not be reachable with the keyboard either.
        element.toggleAttribute('inert', !shown);
      },
      remove() {
        labels.delete(label);
        element.remove();
      },
    };
  }

  /** Reposition every visible label. Call after the camera has been updated. */
  function update() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    for (const label of labels) {
      if (!label.shown) continue;
      _projected.copy(label.anchor).project(camera);
      const inFront = _projected.z > -1 && _projected.z < 1;
      label.element.classList.toggle('is-offscreen', !inFront);
      if (!inFront) continue;
      const x = (_projected.x * 0.5 + 0.5) * width;
      const y = (-_projected.y * 0.5 + 0.5) * height;
      label.element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }

  return { add, update };
}
