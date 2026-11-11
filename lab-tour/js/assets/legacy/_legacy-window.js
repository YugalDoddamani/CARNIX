// Stand-in for the `window` object the asset-library components were written
// against. Each imported component is evaluated with this object bound to the
// name `window`, so its source can stay byte-for-byte identical to the original
// while living in an ES module (no globals leak onto the real window).
//
// The components only ever touch two things on `window`:
//   window.__THREE_BUNDLE__      → { THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry }
//   window.DentalAssetLibrary    → { assets: {}, LabWorkbench?, … }
// (the importer refuses to import a component that touches anything else).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const window = {
  __THREE_BUNDLE__: { THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry },
  DentalAssetLibrary: { assets: {} },
};
