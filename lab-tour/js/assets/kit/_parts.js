// Building blocks for kit furniture. Sizes are real millimetres; (x, z) is the
// centre of the part on the floor plan and y is its BOTTOM, so parts stack the
// way you would describe them out loud: "a 30 mm top sitting at 820".
//
// Asset space (same as the equipment library): origin at the bottom centre,
// +Z is the side a person stands or sits at, +Y up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mm } from '../../core/units.js';
import { PALETTE } from '../../core/palette.js';

const material = (mat) => (typeof mat === 'string' ? PALETTE[mat] : mat);

function finish(mesh, { x = 0, y = 0, z = 0, h, rotY = 0, rotX = 0, rotZ = 0, shadow = true }) {
  mesh.position.set(mm(x), mm(y + h / 2), mm(z));
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  return mesh;
}

/** Box. `r` rounds the edges (mm). */
export function box({ w, h, d, mat, r = 0, ...place }) {
  const geometry =
    r > 0
      ? new RoundedBoxGeometry(mm(w), mm(h), mm(d), 2, mm(Math.min(r, w / 2, h / 2, d / 2)))
      : new THREE.BoxGeometry(mm(w), mm(h), mm(d));
  return finish(new THREE.Mesh(geometry, material(mat)), { h, ...place });
}

/** Upright cylinder (or cone/taper when rTop differs). */
export function cyl({ r, rTop = r, h, mat, seg = 20, ...place }) {
  const geometry = new THREE.CylinderGeometry(mm(rTop), mm(r), mm(h), seg);
  return finish(new THREE.Mesh(geometry, material(mat)), { h, ...place });
}

/** Squashed sphere, for foliage and soft shapes. `h` is the full height. */
export function blob({ r, h = r * 2, mat, seg = 12, ...place }) {
  const geometry = new THREE.SphereGeometry(mm(r), seg, Math.max(6, Math.round(seg * 0.7)));
  geometry.scale(1, h / (r * 2), 1);
  return finish(new THREE.Mesh(geometry, material(mat)), { h, ...place });
}

/** Group helper: `group('name', part, part, …)`; falsy parts are skipped. */
export function group(name, ...parts) {
  const g = new THREE.Group();
  g.name = name;
  for (const part of parts.flat(Infinity)) if (part) g.add(part);
  return g;
}
