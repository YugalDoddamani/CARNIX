// Where a step of a guide points on a machine.
//
// rooms/how-to.js names places on a machine in the terms of its 3D model: a
// part (a named group of the model), points on it, the side to look from. This
// file finds them on the model as built: where the rings go and what the camera
// frames. It is plain scene-graph arithmetic, with no page and no renderer in
// it, so `npm run check` can ask the same questions without a browser: is the
// part there, and can the spot be seen from the side that the guide looks from?
//
// Coordinates. A place is written down in the model's own coordinates, the
// numbers of its source file: x from its left to its right as one stands in
// front of it, y up, z towards the front; one unit is 80 mm (core/units.js).
import * as THREE from 'three';
import { isShown, preciseBox } from './measure.js';

const DEG = Math.PI / 180;

/** `at` is one point or a list of points. */
const pointsOf = (at) => (Array.isArray(at?.[0]) ? at : at ? [at] : []);

/**
 * The direction from a place towards the eye, as a unit vector in the model's
 * coordinates. `from` is [turn, tilt] in degrees: how far round from straight
 * in front (positive: towards the machine's right-hand end) and how far above
 * the horizon.
 */
export function directionOf([turn, tilt], out = new THREE.Vector3()) {
  const azimuth = turn * DEG;
  const elevation = tilt * DEG;
  return out.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
}

/**
 * Find a machine's places on its model. Call this while the model stands closed
 * and assembled, as it is built: a point is tied to its part as the part lies
 * at that moment, and moves with it from then on (a lid that swings open).
 *
 * `definitions` is `places` of a machine in how-to.js:
 *   name: { part, at?, size?, from, show? }
 *
 * Returns { places, problems }: a Map from name to
 *   part    the group of the model that the place belongs to
 *   marks   where the rings go: points in that part's own coordinates
 *   sizes   the diameter of each ring in the model's units (0: the smallest
 *           ring): the place's `size`, or a point's own fourth number
 *   exact   were the points given (`at`), or is it the middle of the part?
 *   from    [turn, tilt], see directionOf
 *   box     what the camera frames, in the model's coordinates
 * and a list of what could not be found, in words.
 */
export function findPlaces(root, definitions = {}) {
  root.updateWorldMatrix(true, true);
  const places = new Map();
  const problems = [];
  for (const [name, definition] of Object.entries(definitions)) {
    const part = root.getObjectByName(definition.part);
    if (!part) {
      problems.push(`place "${name}": the model has no part called "${definition.part}"`);
      continue;
    }
    // Where the rings go, in the model's coordinates: the points given, or the middle of the part.
    const points = pointsOf(definition.at);
    const given = points.map((point) => new THREE.Vector3().fromArray(point));
    const sizes = points.length ? points.map((point) => point[3] ?? definition.size ?? 0) : [definition.size ?? 0];
    const partBox = preciseBox(part, { space: root });
    if (!given.length && partBox.isEmpty()) {
      problems.push(`place "${name}": the part "${definition.part}" holds nothing to point at`);
      continue;
    }
    const inModel = given.length ? given : [partBox.getCenter(new THREE.Vector3())];
    // Tie each point to the part: model → world → the part's own coordinates.
    const toPart = new THREE.Matrix4().copy(part.matrixWorld).invert().multiply(root.matrixWorld);
    const marks = inModel.map((point) => point.clone().applyMatrix4(toPart));

    // What the camera frames: a part's box, a cube around the points, or the place's own part.
    let box;
    if (typeof definition.show === 'string') {
      const shown = root.getObjectByName(definition.show);
      if (!shown) {
        problems.push(`place "${name}": the model has no part called "${definition.show}" to show`);
        continue;
      }
      box = preciseBox(shown, { space: root });
    } else if (typeof definition.show === 'number') {
      const middle = inModel.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(inModel.length);
      box = new THREE.Box3().setFromCenterAndSize(middle, new THREE.Vector3().setScalar(definition.show));
    } else {
      box = partBox.clone();
    }
    for (const point of inModel) box.expandByPoint(point);
    if (box.isEmpty()) {
      problems.push(`place "${name}": there is nothing to frame`);
      continue;
    }
    places.set(name, { name, part, marks, sizes, exact: given.length > 0, from: definition.from ?? [0, 30], box });
  }
  return { places, problems };
}

/** Where a place's rings are right now, in world coordinates (the model's matrices must be up to date). */
export function marksInWorld(place) {
  return place.marks.map((mark) => place.part.localToWorld(mark.clone()));
}

const isInside = (object, ancestor) => {
  for (let node = object; node; node = node.parent) if (node === ancestor) return true;
  return false;
};

/** Can one see through this mesh? (A glass cover does not hide what is behind it.) */
const seeThrough = (mesh) => [mesh.material].flat().every((material) => material?.transparent && (material.opacity ?? 1) < 0.6);

/**
 * For the checks: looking at a place from the side it names, what does the eye
 * meet first at each of its marks? One answer per mark:
 *   seen   it meets the place's own part there (and, for a point that was
 *          given, no further than `reach` from that point: the point lies on
 *          the surface, not in the air in front of it or deep inside)
 *   own    is what it meets first a piece of the place's own part?
 *   by     the name of the part it meets first ('' if it meets nothing)
 *   gap    how far from the mark, in the model's units
 * The eye is taken to be far away, so the lines of sight run parallel; in the
 * tour the camera stands closer, which changes little for a part it faces.
 */
export function sightOf(root, place, { reach = 0.15 } = {}) {
  root.updateWorldMatrix(true, true);
  const scale = new THREE.Vector3().setFromMatrixScale(root.matrixWorld).x || 1;
  const towardsEye = directionOf(place.from).transformDirection(root.matrixWorld);
  const far = 60 * scale;
  const raycaster = new THREE.Raycaster();
  return marksInWorld(place).map((mark) => {
    raycaster.set(mark.clone().addScaledVector(towardsEye, far), towardsEye.clone().negate());
    const hit = raycaster.intersectObject(root, true).find((found) => found.object.isMesh && isShown(found.object, root) && !seeThrough(found.object));
    if (!hit) return { seen: false, own: false, by: '', gap: Infinity };
    const gap = Math.abs(far - hit.distance) / scale;
    let by = '';
    for (let node = hit.object; node && node !== root; node = node.parent) if (node.name) by = by || node.name;
    const own = isInside(hit.object, place.part);
    return { seen: own && (!place.exact || gap <= reach), own, by, gap };
  });
}
