// Stand-in for the `window` object that the model component of a single-machine
// viewer was written against. Each imported model is evaluated with an object of
// its own bound to the name `window`, so its source can stay byte-for-byte
// identical to the original while living in an ES module (no globals leak onto
// the real window, and two viewers never see each other's model).
//
// A model component only ever touches three things on `window`:
//   window.__THREE_BUNDLE__          → { THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry }
//   window.__register…               → the function it defines
//   window.__ProductModel            → { create…Product }, which that function sets
// (the importer, tools/import-viewer.mjs, refuses a component that touches anything else).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createViewerWindow() {
  return { __THREE_BUNDLE__: { THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry } };
}
