// The shared material palette.
//
// Everything that is not a branded machine (walls, glass, benches, chairs,
// shelves, placeholders…) is painted from this short list. That is what lets a
// whole room of furniture collapse into a handful of draw calls: geometry can
// only be merged when it shares a material.
//
// Rule for new assets: take materials from here. Create a private material only
// for something genuinely unique to one machine (a screen, a printed decal).
import * as THREE from 'three';

// `env` scales how much of the soft all-round studio light a surface picks up.
// Large flat surfaces take less of it than the machines do, so that the one
// directional key light — the one that casts shadows — reads clearly on them.
const solid = (color, roughness, { metalness = 0, env = 1 } = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: env });

const glow = (color, emissive, intensity) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.4, metalness: 0 });

export const PALETTE = {
  // ── Architecture ───────────────────────────────────────────────────────────
  // The colours are darker than they look on screen: the lighting is the bright
  // studio rig the machines were designed under, and it lifts everything.
  wall: solid(0xf0f2f5, 0.92, { env: 0.7 }),
  wallCap: solid(0x3f4c66, 0.62),
  plinth: solid(0x4f5c77, 0.7, { env: 0.6 }),
  floor: solid(0x99a1b0, 0.45, { env: 0.3 }),
  floorCorridor: solid(0x868f9f, 0.5, { env: 0.3 }),
  frame: solid(0x6f7c93, 0.38, { metalness: 0.65 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x8fc7f2,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  }),
  lightStrip: glow(0xffffff, 0xeaf3ff, 1.4),

  // ── Furniture ──────────────────────────────────────────────────────────────
  laminate: solid(0xf1f3f6, 0.5, { env: 0.5 }),
  cabinet: solid(0xcfd5df, 0.6, { env: 0.5 }),
  steel: solid(0x9da7b8, 0.36, { metalness: 0.7 }),
  charcoal: solid(0x333843, 0.62),
  fabricDark: solid(0x414857, 0.95),
  fabricLight: solid(0x8e96a6, 0.95, { env: 0.5 }),
  screen: glow(0x16327a, 0x3d7bf0, 0.9),
  leaf: solid(0x3f8f58, 0.82, { env: 0.6 }),
  pot: solid(0xe3e6eb, 0.62, { env: 0.5 }),
  plaster: solid(0xe2d9c6, 0.88, { env: 0.5 }),
  accent: solid(0x2a62f0, 0.5),

  // ── Planning aids ──────────────────────────────────────────────────────────
  ghost: new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  }),
  ghostEdge: new THREE.LineBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0.9 }),
};

for (const [key, material] of Object.entries(PALETTE)) material.name = `palette:${key}`;
