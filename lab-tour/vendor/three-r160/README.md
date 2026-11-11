# three.js r160 (vendored)

Unmodified files from the npm package `three@0.160.0`
(tarball integrity `sha512-DLU8lc0zNIPkM7rH5/e1Ks1Z8tWCGRq6g8mPowdDJpw1CFBJMU7UoJjC6PefXW7z//SSl0b2+GCw14LB+uDhng==`).

| File here | Path in the package |
|---|---|
| `three.module.min.js` | `build/three.module.min.js` |
| `addons/controls/OrbitControls.js` | `examples/jsm/controls/OrbitControls.js` |
| `addons/environments/RoomEnvironment.js` | `examples/jsm/environments/RoomEnvironment.js` |
| `addons/geometries/RoundedBoxGeometry.js` | `examples/jsm/geometries/RoundedBoxGeometry.js` |
| `addons/utils/BufferGeometryUtils.js` | `examples/jsm/utils/BufferGeometryUtils.js` |

The page maps `three` and `three/addons/` to this folder with an import map, so
there is no build step and no CDN request.

**Why r160 and not the latest release:** the equipment models were authored and
approved against r160. From r163 on, `material.envMapIntensity` no longer scales
`scene.environment` and `scene.environmentIntensity` starts to apply, so a newer
three.js would change how every existing model is lit. Upgrade deliberately,
with before/after screenshots — not as a side effect.

License: MIT (see `LICENSE`).
