// Rings on a machine: the spots that a step of a guide is about ("press this
// key", "this screw").
//
// Like the labels over the lab they are elements of the page, drawn over the 3D
// picture, and main.js puts them in place after every frame that is drawn. A
// ring is only a mark: it takes no taps, so a finger that lands on one turns
// the machine under it, and it says nothing to a screen reader, because the
// step's text already names the part.
export function createMarker(container) {
  const layer = document.createElement('div');
  layer.className = 'marker-layer';
  layer.setAttribute('aria-hidden', 'true');
  container.appendChild(layer);

  let shownFor = null; // the step whose rings are up
  let rings = [];

  return {
    /**
     * Put a ring on each spot: [{ x, y, size }] in CSS pixels of the container,
     * `size` being the ring's diameter. `key` says whose rings these are: for
     * a new one they arrive afresh (they appear, and pulse once); for the same
     * one they are only moved. `away`: the part is turned away from the
     * visitor, so the rings are not shown (they keep their places meanwhile).
     */
    show(spots, { key = '', away = false } = {}) {
      if (key !== shownFor || rings.length !== spots.length) {
        layer.replaceChildren();
        rings = spots.map((_, index) => {
          const ring = document.createElement('span');
          ring.className = 'marker';
          ring.style.setProperty('--i', index);
          layer.appendChild(ring);
          return ring;
        });
        shownFor = key;
      }
      spots.forEach((spot, index) => {
        const { style } = rings[index];
        style.transform = `translate3d(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px, 0)`;
        style.setProperty('--size', `${spot.size.toFixed(1)}px`);
      });
      layer.classList.toggle('is-away', away);
    },
    /** Take every ring away. */
    clear() {
      if (!rings.length && shownFor === null) return;
      layer.replaceChildren();
      layer.classList.remove('is-away');
      rings = [];
      shownFor = null;
    },
    /** How many rings are up. */
    get count() {
      return rings.length;
    },
  };
}
