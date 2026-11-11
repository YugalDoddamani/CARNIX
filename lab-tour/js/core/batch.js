// Static batching: collapse many meshes into one mesh per material.
//
// A detailed machine is 50–115 separate meshes (one draw call each). Seen from
// across the lab nobody needs the parts to be separate objects, so we bake them
// into as many meshes as there are materials. The pixels are the same; the
// draw-call count drops by roughly 5×. The same class batches all the furniture
// of a room and all the walls of the building.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TEXTURE_SLOTS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'aoMap'];
const _instanceMatrix = new THREE.Matrix4();
const _matrix = new THREE.Matrix4();
const IDENTITY = new THREE.Matrix4();

function usesUv(material) {
  return TEXTURE_SLOTS.some((slot) => material[slot]);
}

/** Copy of `source` reduced to position/normal(/uv), indexed, transformed by `matrix`. */
function prepareGeometry(source, matrix, keepUv) {
  const geometry = new THREE.BufferGeometry();
  const position = source.attributes.position;
  geometry.setAttribute('position', position.clone());

  if (source.attributes.normal) {
    geometry.setAttribute('normal', source.attributes.normal.clone());
  }
  if (keepUv) {
    geometry.setAttribute(
      'uv',
      source.attributes.uv
        ? source.attributes.uv.clone()
        : new THREE.BufferAttribute(new Float32Array(position.count * 2), 2),
    );
  }

  if (source.index) {
    geometry.setIndex(source.index.clone());
  } else {
    const index = new (position.count > 65535 ? Uint32Array : Uint16Array)(position.count);
    for (let i = 0; i < index.length; i++) index[i] = i;
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
  }
  if (!geometry.attributes.normal) geometry.computeVertexNormals();

  geometry.applyMatrix4(matrix);

  // A mirrored transform (negative scale) reverses triangle winding. three.js
  // compensates per object at draw time; once baked we must do it ourselves or
  // the mirrored part renders inside-out.
  if (matrix.determinant() < 0) {
    const index = geometry.index.array;
    for (let i = 0; i < index.length; i += 3) {
      const swap = index[i + 1];
      index[i + 1] = index[i + 2];
      index[i + 2] = swap;
    }
  }
  return geometry;
}

export class GeometryBatch {
  constructor() {
    /** @type {Map<string, {material: THREE.Material, renderOrder: number, geometries: THREE.BufferGeometry[], castShadow: boolean, receiveShadow: boolean}>} */
    this.buckets = new Map();
    /** Meshes that cannot be merged (multi-material); kept as individual clones. */
    this.loose = [];
  }

  /** Add one geometry with a material. `matrix` maps geometry space → batch space. */
  addGeometry(geometry, material, matrix = IDENTITY, { castShadow = true, receiveShadow = true, renderOrder = 0 } = {}) {
    const key = `${material.uuid}|${renderOrder}`;
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { material, renderOrder, geometries: [], castShadow: false, receiveShadow: false };
      this.buckets.set(key, bucket);
    }
    bucket.geometries.push(prepareGeometry(geometry, matrix, usesUv(material)));
    bucket.castShadow ||= castShadow;
    bucket.receiveShadow ||= receiveShadow;
    return this;
  }

  /**
   * Add every visible mesh under `root`. `matrix` is applied on top of each
   * mesh's transform relative to `root` (root's own transform is ignored, so the
   * caller decides where the baked copy goes).
   */
  addObject(root, matrix = IDENTITY) {
    root.updateWorldMatrix(true, true);
    const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();

    const visit = (obj) => {
      if (!obj.visible) return;
      if (obj.isMesh && obj.geometry?.attributes?.position) {
        const relative = new THREE.Matrix4().multiplyMatrices(rootInverse, obj.matrixWorld).premultiply(matrix);
        const flags = { castShadow: obj.castShadow, receiveShadow: obj.receiveShadow, renderOrder: obj.renderOrder };
        if (Array.isArray(obj.material)) {
          const clone = obj.clone(false);
          clone.matrixAutoUpdate = false;
          clone.matrix.copy(relative);
          this.loose.push(clone);
        } else if (obj.isInstancedMesh) {
          for (let i = 0; i < obj.count; i++) {
            obj.getMatrixAt(i, _instanceMatrix);
            _matrix.multiplyMatrices(relative, _instanceMatrix);
            this.addGeometry(obj.geometry, obj.material, _matrix, flags);
          }
        } else {
          this.addGeometry(obj.geometry, obj.material, relative, flags);
        }
      }
      for (const child of obj.children) visit(child);
    };
    visit(root);
    return this;
  }

  get isEmpty() {
    return this.buckets.size === 0 && this.loose.length === 0;
  }

  /** Produce the merged group. The batch must not be reused afterwards. */
  build(name = 'batch') {
    const group = new THREE.Group();
    group.name = name;
    for (const bucket of this.buckets.values()) {
      const merged = bucket.geometries.length === 1 ? bucket.geometries[0] : mergeGeometries(bucket.geometries, false);
      if (!merged) throw new Error(`GeometryBatch: could not merge geometries for material "${bucket.material.name}"`);
      if (bucket.geometries.length > 1) for (const geometry of bucket.geometries) geometry.dispose();
      const mesh = new THREE.Mesh(merged, bucket.material);
      mesh.name = bucket.material.name || 'merged';
      mesh.castShadow = bucket.castShadow;
      mesh.receiveShadow = bucket.receiveShadow;
      mesh.renderOrder = bucket.renderOrder;
      group.add(mesh);
    }
    for (const mesh of this.loose) group.add(mesh);
    this.buckets.clear();
    this.loose = [];
    return group;
  }
}

/**
 * Bake a detailed asset into its "lite" form: one mesh per material, placed
 * exactly where `root` is (same position / rotation / scale). Materials are
 * shared with the original, so the two can be swapped without any visual pop.
 */
export function bakeLite(root, name = `${root.name || 'asset'}:lite`) {
  const lite = new GeometryBatch().addObject(root).build(name);
  lite.position.copy(root.position);
  lite.quaternion.copy(root.quaternion);
  lite.scale.copy(root.scale);
  return lite;
}

/** Dispose the geometries of a baked group (materials are shared — left alone). */
export function disposeBaked(group) {
  group.traverse((obj) => {
    if (obj.isMesh) obj.geometry.dispose();
  });
}
