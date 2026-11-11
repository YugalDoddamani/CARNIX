// Minimal browser stand-ins so the scene-building code can run in Node.
//
// What this is for: counting meshes/triangles/materials, measuring bounding
// boxes and proving that every asset builds without throwing.
// What this is NOT: a renderer. Canvas 2D drawing is a no-op here, so texture
// *contents* and build *timings* are not representative of a real browser.
import { register } from 'node:module';

register('./three-resolve-hooks.mjs', import.meta.url);

export const createdCanvases = [];

function makeContext2d() {
  return new Proxy(function () {}, {
    get(_target, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'measureText') return (text) => ({ width: String(text).length * 10 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') {
        return () => ({ addColorStop() {} });
      }
      if (prop === 'getImageData') {
        return (_x, _y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      }
      return () => undefined;
    },
    set() {
      return true;
    },
  });
}

function makeCanvas() {
  const canvas = {
    width: 300,
    height: 150,
    style: {},
    getContext: () => makeContext2d(),
    addEventListener() {},
    removeEventListener() {},
  };
  createdCanvases.push(canvas);
  return canvas;
}

const inertElement = () => ({ style: {}, appendChild() {}, addEventListener() {}, removeEventListener() {} });

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: (tag) => (String(tag).toLowerCase() === 'canvas' ? makeCanvas() : inertElement()),
    createElementNS: (_ns, tag) => (String(tag).toLowerCase() === 'canvas' ? makeCanvas() : inertElement()),
  };
}
