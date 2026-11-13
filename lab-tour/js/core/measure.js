// Measurement helpers shared by the page (debug read-outs) and the Node tools
// (asset import, budget checks). Pure scene-graph maths: no DOM, no renderer.
import * as THREE from 'three';

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

/**
 * Vertex-accurate bounding box of everything under `root`, in the coordinate
 * space of `space` (default: world). Includes every InstancedMesh instance.
 * (Box3.setFromObject only unions per-mesh boxes, which over-estimates rotated
 * parts — not good enough when comparing a model against a datasheet.)
 */
export function preciseBox(root, { space = null, filter = null } = {}) {
  root.updateWorldMatrix(true, true);
  const toSpace = space ? new THREE.Matrix4().copy(space.matrixWorld).invert() : null;
  const box = new THREE.Box3();
  root.traverse((obj) => {
    if (!obj.isMesh || (filter && !filter(obj))) return;
    const pos = obj.geometry.attributes.position;
    if (!pos) return;
    const copies = obj.isInstancedMesh ? obj.count : 1;
    for (let i = 0; i < copies; i++) {
      if (obj.isInstancedMesh) {
        obj.getMatrixAt(i, _m);
        _m.premultiply(obj.matrixWorld);
      } else {
        _m.copy(obj.matrixWorld);
      }
      if (toSpace) _m.premultiply(toSpace);
      for (let k = 0; k < pos.count; k++) {
        box.expandByPoint(_v.fromBufferAttribute(pos, k).applyMatrix4(_m));
      }
    }
  });
  return box;
}

const TEXTURE_SLOTS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'aoMap'];

/**
 * Is `obj` shown when `root` is drawn? Not if it, or anything between it and
 * `root`, is switched off. (A model may keep a part hidden until it is opened:
 * the thermopress 400 holds a tool and a lid stay that way.)
 */
export function isShown(obj, root) {
  for (let node = obj; node; node = node.parent) {
    if (!node.visible) return false;
    if (node === root) break;
  }
  return true;
}

/**
 * What it costs to draw `root`: draw calls, triangles, unique materials and an
 * estimate of GPU texture memory (RGBA8 + mip chain). It counts every mesh that
 * `root` holds; with `visibleOnly`, those that are shown as it stands.
 */
export function sceneStats(root, { visibleOnly = false } = {}) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  let meshes = 0;
  let drawCalls = 0;
  let triangles = 0;
  let vertices = 0;
  let shadowCasters = 0;

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (visibleOnly && !isShown(obj, root)) return;
    const geo = obj.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;
    meshes++;
    const copies = obj.isInstancedMesh ? obj.count : 1;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    drawCalls += Array.isArray(obj.material) ? Math.max(1, geo.groups.length) : 1;
    triangles += ((geo.index ? geo.index.count : pos.count) / 3) * copies;
    vertices += pos.count * copies;
    if (obj.castShadow) shadowCasters++;
    geometries.add(geo);
    for (const mat of mats) {
      if (!mat) continue;
      materials.add(mat);
      for (const slot of TEXTURE_SLOTS) if (mat[slot]) textures.add(mat[slot]);
    }
  });

  let textureBytes = 0;
  const textureSizes = [];
  for (const tex of textures) {
    const w = tex.image?.width || 0;
    const h = tex.image?.height || 0;
    textureSizes.push([w, h]);
    textureBytes += w * h * 4 * (4 / 3);
  }

  return {
    meshes,
    drawCalls,
    triangles: Math.round(triangles),
    vertices,
    materials: materials.size,
    geometries: geometries.size,
    shadowCasters,
    textures: textureSizes,
    textureMB: +(textureBytes / 1048576).toFixed(1),
  };
}

/** [x, y, z] extents of a Box3, rounded for reports. */
export function boxSize(box, digits = 3) {
  const s = box.getSize(new THREE.Vector3());
  return [+s.x.toFixed(digits), +s.y.toFixed(digits), +s.z.toFixed(digits)];
}
