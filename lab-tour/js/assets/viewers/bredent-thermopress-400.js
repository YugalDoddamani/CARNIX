// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-viewer -- <Viewer.html> --id bredent-thermopress-400
//
// Source    : Bredent_Thermopress_400_Viewer.html  (740,001 bytes)
//             md5 2f7c1e3d367d0467703d226903479a5e · sha256 3cfd9145631757feb57d85431e3b2ba6bfb0f70ed43191bcab2f089a98fbcb77
// Component : script 2 of 2, from its start to the viewer app (its line 1334: "(function initStudioViewer() {")
// sha256    : 513f70c5fd3530f6ee467608dd53262d33e9d0911c67b0df24e04d7cd3944a05
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer version
// of the viewer can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { createViewerWindow } from './_viewer-window.js';

const window = createViewerWindow();

// ── BEGIN original source ────────────────────────────────────────────────────

// ============================================================================
// bredent thermopress 400 — Electro-Mechanical Thermoplastic Injection System
// Calibrated Scale: 1 scene unit = 80 mm (portfolio-consistent scale)
// Official Dimensions: 650 mm (W) x 300 mm (D) x 250 mm (H), 40 kg
//   => W = 8.1250 u, D = 3.7500 u, H = 3.1250 u, seated at Y = 0.0000
// ============================================================================

// Helper: smooth-shaded curved sheet-metal band along X from dense (z, y) profile points!
// Computes smooth interpolated normals along the outer & inner curved walls while keeping
// crisp creases on the 4 perimeter edges and end-caps!
function createCurvedSheetBandX(THREE, outerZY, thickness, x0, x1) {
  const N = outerZY.length;
  const innerZY = [];
  const outerNormalsZY = [];

  for (let i = 0; i < N; i++) {
    const pPrev = outerZY[Math.max(0, i - 1)];
    const pNext = outerZY[Math.min(N - 1, i + 1)];
    let tz = pNext[0] - pPrev[0];
    let ty = pNext[1] - pPrev[1];
    const len = Math.hypot(tz, ty) || 1;
    tz /= len; ty /= len;
    let nz = -ty, ny = tz;
    // Ensure inward normal points toward enclosure interior centroid (z=0.0, y=1.55)
    const toCenterZ = 0.0 - outerZY[i][0];
    const toCenterY = 1.55 - outerZY[i][1];
    if (nz * toCenterZ + ny * toCenterY < 0) {
      nz = -nz; ny = -ny;
    }
    innerZY.push([outerZY[i][0] + nz * thickness, outerZY[i][1] + ny * thickness]);
    outerNormalsZY.push([-nz, -ny]); // outward normal in (z, y)
  }

  const pos = [];
  const nrm = [];
  const uvs = [];

  function pushSmoothQuad(a0, a1, b1, b0, na, nb) {
    // Verify outward winding against average normal (0, ny, nz)
    const ux = a1[0] - a0[0], uy = a1[1] - a0[1], uz = a1[2] - a0[2];
    const vx = b1[0] - a0[0], vy = b1[1] - a0[1], vz = b1[2] - a0[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    const mx = 0.5 * (na[0] + nb[0]), my = 0.5 * (na[1] + nb[1]), mz = 0.5 * (na[2] + nb[2]);
    if (cx * mx + cy * my + cz * mz >= 0) {
      pos.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0);
      nrm.push(...na, ...na, ...nb, ...na, ...nb, ...nb);
    } else {
      pos.push(...a0, ...b1, ...a1, ...a0, ...b0, ...b1);
      nrm.push(...na, ...nb, ...na, ...na, ...nb, ...nb);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }

  function pushFlatTri(A, B, C, fn) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    if (cx * fn[0] + cy * fn[1] + cz * fn[2] >= 0) {
      pos.push(...A, ...B, ...C);
    } else {
      pos.push(...A, ...C, ...B);
    }
    nrm.push(...fn, ...fn, ...fn);
    uvs.push(0, 0, 1, 0, 1, 1);
  }

  // 1. Outer smooth curved skin (unless sharp corner > 42 deg, where we use segment normal)
  for (let i = 0; i < N - 1; i++) {
    const pA = outerZY[i], pB = outerZY[i + 1];
    const nA2 = outerNormalsZY[i], nB2 = outerNormalsZY[i + 1];
    const dot = nA2[0] * nB2[0] + nA2[1] * nB2[1];
    let nA3, nB3;
    if (dot < 0.74) {
      // Sharp bend (e.g. floor to vertical rear wall): use crisp flat segment normal!
      let dz = pB[0] - pA[0], dy = pB[1] - pA[1];
      const l = Math.hypot(dz, dy) || 1;
      dz /= l; dy /= l;
      let sz = -dy, sy = dz;
      if (sz * nA2[0] + sy * nA2[1] < 0) { sz = -sz; sy = -sy; }
      nA3 = [0, sy, sz]; nB3 = [0, sy, sz];
    } else {
      nA3 = [0, nA2[1], nA2[0]];
      nB3 = [0, nB2[1], nB2[0]];
    }
    pushSmoothQuad(
      [x0, pA[1], pA[0]], [x1, pA[1], pA[0]],
      [x1, pB[1], pB[0]], [x0, pB[1], pB[0]],
      nA3, nB3
    );

    // 2. Inner curved skin
    const qA = innerZY[i], qB = innerZY[i + 1];
    pushSmoothQuad(
      [x0, qA[1], qA[0]], [x1, qA[1], qA[0]],
      [x1, qB[1], qB[0]], [x0, qB[1], qB[0]],
      [-nA3[0], -nA3[1], -nA3[2]],
      [-nB3[0], -nB3[1], -nB3[2]]
    );
  }

  // 3. Rim caps at i = 0 and i = N - 1
  for (const [idx, dirSign] of [[0, -1], [N - 1, +1]]) {
    const pO = outerZY[idx], pI = innerZY[idx];
    const tNext = outerZY[Math.min(N - 1, idx + 1)];
    const tPrev = outerZY[Math.max(0, idx - 1)];
    let tz = (tNext[0] - tPrev[0]) * dirSign;
    let ty = (tNext[1] - tPrev[1]) * dirSign;
    const l = Math.hypot(tz, ty) || 1;
    const fn = [0, ty / l, tz / l];
    pushFlatTri([x0, pO[1], pO[0]], [x1, pO[1], pO[0]], [x1, pI[1], pI[0]], fn);
    pushFlatTri([x0, pO[1], pO[0]], [x1, pI[1], pI[0]], [x0, pI[1], pI[0]], fn);
  }

  // 4. Left (x0) & Right (x1) profile end-caps
  const loop = [...outerZY, ...innerZY.slice().reverse()];
  const pts2d = loop.map((p) => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(pts2d, []);
  for (const [i0, i1, i2] of tris) {
    const a = loop[i0], b = loop[i1], c = loop[i2];
    pushFlatTri([x0, a[1], a[0]], [x0, b[1], b[0]], [x0, c[1], c[0]], [-1, 0, 0]);
    pushFlatTri([x1, a[1], a[0]], [x1, b[1], b[0]], [x1, c[1], c[0]], [+1, 0, 0]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

// Helper: solid side end-cap plate in (z, y) with optional rectangular holes
function createEndCapPlateX(THREE, outerZY, holesZY, x0, x1) {
  const shape = new THREE.Shape();
  outerZY.forEach((p, idx) => {
    if (idx === 0) shape.moveTo(p[0], p[1]);
    else shape.lineTo(p[0], p[1]);
  });
  shape.closePath();

  if (holesZY) {
    for (const h of holesZY) {
      const path = new THREE.Path();
      h.forEach((p, idx) => {
        if (idx === 0) path.moveTo(p[0], p[1]);
        else path.lineTo(p[0], p[1]);
      });
      path.closePath();
      shape.holes.push(path);
    }
  }

  const depth = x1 - x0;
  const raw = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const posAttr = raw.attributes.position;
  const idx = raw.index;
  const outPos = [];
  const getV = (i) => [x0 + posAttr.getZ(i), posAttr.getY(i), posAttr.getX(i)];
  const triCount = idx ? idx.count / 3 : posAttr.count / 3;
  for (let t = 0; t < triCount; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    const A = getV(i0), B = getV(i2), C = getV(i1);
    outPos.push(...A, ...B, ...C);
  }
  raw.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
  geo.computeVertexNormals();
  return geo;
}

// Helper: planar sheet panel in local (x, u) extruded along local thickness w in [0..thickness] with holes
function createPerforatedSheetPanel(THREE, x0, x1, u0, u1, holesXU, thickness) {
  const shape = new THREE.Shape();
  shape.moveTo(x0, u0);
  shape.lineTo(x1, u0);
  shape.lineTo(x1, u1);
  shape.lineTo(x0, u1);
  shape.closePath();

  if (holesXU) {
    for (const [hx0, hy0, hx1, hy1] of holesXU) {
      const h = new THREE.Path();
      h.moveTo(hx0, hy0);
      h.lineTo(hx0, hy1);
      h.lineTo(hx1, hy1);
      h.lineTo(hx1, hy0);
      h.closePath();
      shape.holes.push(h);
    }
  }

  return new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false
  });
}

// ==================== PROCEDURAL HIGH-DPI CANVAS TEXTURES ====================

function createThermopressKeypadTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 440;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#48505a';
  ctx.fillRect(0, 0, 768, 440);
  ctx.strokeStyle = '#262b31';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 758, 430);

  ctx.strokeStyle = '#9aa3ae';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 732, 404);

  // Illuminated Emerald-Lime 2-Line Backlit LCD Window
  ctx.fillStyle = '#1f2822';
  ctx.fillRect(108, 38, 496, 128);
  const lcdGrad = ctx.createLinearGradient(116, 46, 116, 158);
  lcdGrad.addColorStop(0, '#4be368');
  lcdGrad.addColorStop(1, '#34c752');
  ctx.fillStyle = lcdGrad;
  ctx.fillRect(116, 46, 480, 112);

  ctx.fillStyle = '#0f2916';
  ctx.font = '700 28px "Courier New", monospace';
  ctx.fillText('Prog 04  bre.flex 2nd', 134, 88);
  ctx.fillText('Soll:265°C  Ist:265°C', 134, 136);

  ctx.fillStyle = '#cfd6df';
  ctx.font = '300 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText('bredent', 622, 108);

  const row1 = [
    { bg: '#67b894', fg: '#163024', txt: 'P1' },
    { bg: '#67b894', fg: '#163024', txt: 'P2' },
    { bg: '#67b894', fg: '#163024', txt: 'Temp' },
    { bg: '#8bb8d9', fg: '#152838', txt: 'Time' },
    { bg: '#f2dc6d', fg: '#2b250c', txt: '▲' },
    { bg: '#dce4ec', fg: '#1e2630', txt: 'Menu' },
    { bg: '#f8fafc', fg: '#dc2626', txt: 'CE' }
  ];
  const row2 = [
    { bg: '#f1f5f9', fg: '#1e293b', txt: '↵' },
    { bg: '#6eb4e6', fg: '#0f2537', txt: '◄' },
    { bg: '#6eb4e6', fg: '#0f2537', txt: '►' },
    { bg: '#f1f5f9', fg: '#dc2626', txt: '⊗' },
    { bg: '#f2dc6d', fg: '#2b250c', txt: '▼' },
    { bg: '#6eb4e6', fg: '#0f2537', txt: 'Cool' },
    { bg: '#f8fafc', fg: '#15803d', txt: 'Enter' }
  ];

  const drawRow = (keys, ry) => {
    for (let i = 0; i < keys.length; i++) {
      const kx = 88 + i * 86;
      ctx.fillStyle = keys[i].bg;
      ctx.fillRect(kx, ry, 74, 86);
      ctx.strokeStyle = '#2d343d';
      ctx.lineWidth = 3;
      ctx.strokeRect(kx, ry, 74, 86);

      ctx.fillStyle = keys[i].fg;
      ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(keys[i].txt, kx + 37, ry + 44);
    }
  };
  drawRow(row1, 198);
  drawRow(row2, 302);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createThermopressTitleTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 640, 128);

  ctx.fillStyle = '#332d24';
  ctx.font = 'italic 600 52px "Segoe UI", Inter, Arial, sans-serif';
  ctx.fillText('thermopress 400', 24, 72);

  ctx.fillStyle = '#c97a2b';
  ctx.fillRect(24, 88, 468, 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createBredentLidLogoTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);

  ctx.fillStyle = '#3a352c';
  ctx.font = '300 66px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('bredent', 256, 86);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createHotSurfaceTriangleTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 220;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 220);

  ctx.beginPath();
  ctx.moveTo(128, 16);
  ctx.lineTo(240, 204);
  ctx.lineTo(16, 204);
  ctx.closePath();
  ctx.fillStyle = '#f5d126';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#1e1b15';
  ctx.stroke();

  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(78, 178); ctx.lineTo(178, 178); ctx.stroke();
  for (const wx of [98, 128, 158]) {
    ctx.beginPath();
    ctx.moveTo(wx, 162);
    ctx.quadraticCurveTo(wx - 10, 142, wx, 124);
    ctx.quadraticCurveTo(wx + 10, 106, wx, 88);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLeverNumbersTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 256);

  ctx.fillStyle = '#332d24';
  ctx.font = '700 40px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1', 64, 58);
  ctx.fillText('2', 64, 218);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRearBredentPlateTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#d4dae2';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#2d333b';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.fillStyle = '#181c22';
  ctx.font = '700 32px "Segoe UI", Arial, sans-serif';
  ctx.fillText('bredent GmbH & Co. KG', 24, 50);
  ctx.font = '500 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Weissenhorner Str. 2 · D-89250 Senden · Made in Germany', 24, 78);

  ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Type :  thermopress 400   |   REF 540 0000 5', 24, 118);
  ctx.fillText('Mains:  220–230 V ~ 50/60 Hz   |   max. 2.2 kW', 24, 150);
  ctx.fillText('Temp :  max. 400 °C   |   Force : up to 17 kN', 24, 182);
  ctx.font = '800 42px Arial, sans-serif';
  ctx.fillText('CE', 24, 232);
  ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('S/N : TP4-094812   ·   Weight : 40 kg', 110, 226);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ==================== MAIN PRODUCT FACTORY ====================

function createThermopress400Product(THREE) {
  const geos = [];
  const mats = [];
  const texs = [];
  const trackGeo = (g) => { geos.push(g); return g; };
  const trackMat = (m) => { mats.push(m); return m; };
  const trackTex = (t) => { texs.push(t); return t; };

  const productRoot = new THREE.Group();
  productRoot.name = 'thermopress400Root';

  const halfW = 4.0625; // 650 mm => 8.1250 u
  const halfD = 1.8750; // 300 mm => 3.7500 u
  const xLidSeam = 1.520;
  const wallT = 0.044;

  // ==================== DENSE SMOOTH CROSS-SECTION PROFILES ====================
  // 1) Lower Belly Curve: 24 dense samples from (z=1.36, y=0.11) up convex arc to (z=1.838, y=1.54)
  const lowerBellyCurveZY = [];
  const NB = 24;
  for (let i = 0; i <= NB; i++) {
    const t = i / NB;
    const y = 0.11 + t * (1.54 - 0.11);
    const z = 1.36 + Math.sin(t * Math.PI * 0.50) * (1.838 - 1.36);
    lowerBellyCurveZY.push([z, y]);
  }
  const lowerFullTroughZY = [
    ...lowerBellyCurveZY.slice().reverse(),
    [-halfD, 0.11],
    [-halfD, 1.64]
  ];

  // 2) Upper Hood Profile Split into 3 Tangential Zones:
  const P_deck0 = [1.680, 1.980];
  const P_deck1 = [-0.280, 3.040];
  const deckVecZ = P_deck1[0] - P_deck0[0];
  const deckVecY = P_deck1[1] - P_deck0[1];
  const deckLen  = Math.hypot(deckVecZ, deckVecY);
  const deckPitch = Math.atan2(deckVecY, -deckVecZ);
  const deckRotX = -(Math.PI * 0.5 - deckPitch);

  // Smooth 14-sample Bezier Front Bullnose from (1.862, 1.360) -> apex (1.875, 1.630) -> tangent P_deck0 (1.680, 1.980)
  const bullnoseZY = [
    [1.860, 1.360],
    [1.870, 1.460]
  ];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const u = 1 - t;
    // Quadratic Bezier: B0=(1.873, 1.540), B1=(1.895, 1.863), B2=(1.680, 1.980)
    // Tangent at t=1 is B2 - B1 = (-0.215, +0.117) -> slope = -0.544, matching deckVec (-1.96, +1.06) slope -0.541 TO 3 DECIMALS!!
    const bz = u * u * 1.873 + 2 * u * t * 1.895 + t * t * P_deck0[0];
    const by = u * u * 1.540 + 2 * u * t * 1.863 + t * t * P_deck0[1];
    bullnoseZY.push([bz, by]);
  }

  // Smooth 18-sample Crown + Flat Top Roof (Y = 3.125) + Quarter-Circle Rear-Top Bend (R = 0.265) + Rear Wall
  const crownAndRearZY = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const u = 1 - t;
    // Quadratic Bezier from P_deck1=(-0.280, 3.040), ctrl=(-0.437, 3.125), end=(-0.620, 3.125) -> tangent exact at both ends!
    const cz = u * u * P_deck1[0] + 2 * u * t * (-0.437) + t * t * (-0.620);
    const cy = u * u * P_deck1[1] + 2 * u * t * 3.125 + t * t * 3.125;
    crownAndRearZY.push([cz, cy]);
  }
  for (let i = 0; i <= 8; i++) {
    const ang = (i / 8) * (Math.PI * 0.5);
    const r = 0.265;
    const rz = (-halfD + r) - Math.sin(ang) * r;
    const ry = (3.125 - r) + Math.cos(ang) * r;
    crownAndRearZY.push([rz, ry]);
  }
  crownAndRearZY.push([-halfD, 1.600]);

  const fullEndCapPolygonZY = [
    ...lowerBellyCurveZY,
    ...bullnoseZY.slice(1),
    ...crownAndRearZY.slice(1),
    [-halfD, 0.110]
  ];

  // ==================== PBR MATERIALS ====================
  const matBredentCream = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentCreamEnamel',
    color: 0xf3e4a6,
    roughness: 0.28,
    metalness: 0.05,
    envMapIntensity: 1.12
  }));

  const matFootCream = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentPolymerFoot',
    color: 0xe6d9a2,
    roughness: 0.48,
    metalness: 0.02
  }));

  const matDarkChamberInterior = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentDarkBaffle',
    color: 0x12151a,
    roughness: 0.96,
    metalness: 0.02
  }));

  const matStainlessBrush = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentStainlessSteel',
    color: 0xd4dae2,
    roughness: 0.22,
    metalness: 0.80,
    envMapIntensity: 1.48
  }));

  const matMachinedFlaskAlu = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentMachinedFlask',
    color: 0xcbd2dc,
    roughness: 0.26,
    metalness: 0.76,
    envMapIntensity: 1.40
  }));

  const matCradleSteel = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentCradleSteel',
    color: 0x9aa3ae,
    roughness: 0.36,
    metalness: 0.68,
    envMapIntensity: 1.25
  }));

  const matBlackPhenolic = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentBlackPhenolic',
    color: 0x16191e,
    roughness: 0.18,
    metalness: 0.10,
    envMapIntensity: 1.35
  }));

  const matKeypadFrame = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentKeypadBezel',
    color: 0x3b424c,
    roughness: 0.40,
    metalness: 0.25
  }));

  const matRoseGoldCartridge = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentCartridgeAnodized',
    color: 0xd89c7a,
    roughness: 0.25,
    metalness: 0.78,
    envMapIntensity: 1.42
  }));

  const matHeaterGlow = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentHeater400Glow',
    color: 0xb85d1e,
    emissive: 0xff5500,
    emissiveIntensity: 0.48,
    roughness: 0.42,
    metalness: 0.35
  }));

  const matDriverBlue = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentToolBlue',
    color: 0x1d63b8,
    roughness: 0.36,
    metalness: 0.06
  }));

  const matGypsumStone = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentDentalStone',
    color: 0xebe7dc,
    roughness: 0.78,
    metalness: 0.0
  }));

  const matPinkDenture = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentBreflexPink',
    color: 0xe07a8c,
    roughness: 0.26,
    metalness: 0.04
  }));

  const matKeypadUi = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentKeypadUi',
    map: trackTex(createThermopressKeypadTexture(THREE)),
    emissive: 0xffffff,
    emissiveIntensity: 0.14,
    roughness: 0.28,
    metalness: 0.08
  }));
  matKeypadUi.emissiveMap = matKeypadUi.map;

  const matTitleDecal = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentThermopressTitle',
    map: trackTex(createThermopressTitleTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.28
  }));

  const matLidLogoDecal = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentLidWordmark',
    map: trackTex(createBredentLidLogoTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.28
  }));

  const matHotWarning = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentHotTriangle',
    map: trackTex(createHotSurfaceTriangleTexture(THREE)),
    transparent: true,
    alphaTest: 0.12,
    roughness: 0.32
  }));

  const matLeverNums = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentLeverNums',
    map: trackTex(createLeverNumbersTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.30
  }));

  const matRearPlate = trackMat(new THREE.MeshStandardMaterial({
    name: 'bredentRearRatingPlate',
    map: trackTex(createRearBredentPlateTexture(THREE)),
    roughness: 0.36,
    metalness: 0.28
  }));

  // ==================== 1. LOWER BELLY CHASSIS, REAL 2x13 VENTS, END-CAPS & FEET ====================
  const lowerChassisAssembly = new THREE.Group();
  lowerChassisAssembly.name = 'lowerChassisAssembly';

  const footGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.15, 0.12, 24));
  for (const [fx, fz] of [[-3.35, +1.08], [+3.35, +1.08], [-3.35, -1.48], [+3.35, -1.48]]) {
    const ft = new THREE.Mesh(footGeo, matFootCream);
    ft.position.set(fx, 0.06, fz);
    lowerChassisAssembly.add(ft);
  }

  // Lower Curved Belly Trough with tight real 2x13 through-hole strip at indices [9..15] (Y = 0.646 .. 1.004)
  lowerChassisAssembly.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, lowerFullTroughZY, wallT, -4.02, -0.64)),
    matBredentCream
  ));
  lowerChassisAssembly.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, lowerFullTroughZY, wallT, +1.20, +4.02)),
    matBredentCream
  ));

  const lowerSubBottomZY = [
    ...lowerBellyCurveZY.slice(0, 10).reverse(),
    [-halfD, 0.11],
    [-halfD, 1.64]
  ];
  lowerChassisAssembly.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, lowerSubBottomZY, wallT, -0.64, +1.20)),
    matBredentCream
  ));
  const lowerSubUpperZY = lowerBellyCurveZY.slice(15);
  lowerChassisAssembly.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, lowerSubUpperZY, wallT, -0.64, +1.20)),
    matBredentCream
  ));

  // Real 3D Perforated 2x13 Lower Front Vent Strip bridging exact indices [9] -> [15]!
  const pLv0 = lowerBellyCurveZY[9], pLv1 = lowerBellyCurveZY[15];
  const lvLen = Math.hypot(pLv1[0] - pLv0[0], pLv1[1] - pLv0[1]);
  const lvPitch = Math.atan2(pLv1[1] - pLv0[1], -(pLv1[0] - pLv0[0]));
  const lowerVentHoles = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 13; c++) {
      const hx = -0.58 + c * 0.135;
      const hu = 0.055 + r * 0.145;
      lowerVentHoles.push([hx, hu, hx + 0.088, hu + 0.092]);
    }
  }
  const lowerVentGeo = trackGeo(createPerforatedSheetPanel(THREE, -0.64, +1.20, 0, lvLen, lowerVentHoles, wallT));
  const lowerVentMesh = new THREE.Mesh(lowerVentGeo, matBredentCream);
  lowerVentMesh.position.set(0, pLv0[1], pLv0[0]);
  lowerVentMesh.rotation.x = -(Math.PI * 0.5 - lvPitch);
  lowerVentMesh.translateZ(-wallT);
  lowerChassisAssembly.add(lowerVentMesh);

  // Dark internal acoustic/thermal chassis liner box inside lower belly
  const innerDarkBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.70, 1.38, 3.15)),
    matDarkChamberInterior
  );
  innerDarkBase.position.set(0, 0.84, -0.12);
  lowerChassisAssembly.add(innerDarkBase);

  // Left Solid End-Cap Plate (X = [-4.0625, -4.015])
  lowerChassisAssembly.add(new THREE.Mesh(
    trackGeo(createEndCapPlateX(THREE, fullEndCapPolygonZY, null, -halfW, -4.015)),
    matBredentCream
  ));

  // Right End-Cap Plate (X = [+4.015, +4.0625]) — faithful to machine-4.jpg & machine-5.jpg:
  // Continuous lower & rear-chamber cheek rising to Y = 2.08 at the rear so the chamber stay-rod anchors to it,
  // stepping cleanly to Y = 1.48 at the front nose where the curved press lid overlaps!
  const rightLowerEndCapZY = [
    ...lowerBellyCurveZY,
    [1.45, 1.54],
    [0.85, 1.54],
    [-0.95, 2.06],
    [-halfD, 2.06],
    [-halfD, 0.11]
  ];
  const rightEndCapHoles = [];
  for (let cz = 0; cz < 6; cz++) {
    for (let cy = 0; cy < 5; cy++) {
      const hz = -0.85 + cz * 0.24;
      const hy = 0.42 + cy * 0.19;
      rightEndCapHoles.push([
        [hz, hy], [hz + 0.14, hy], [hz + 0.14, hy + 0.11], [hz, hy + 0.11]
      ]);
    }
  }
  rightEndCapHoles.push([
    [0.88, 0.86], [1.18, 0.86], [1.18, 1.44], [0.88, 1.44]
  ]);

  lowerChassisAssembly.add(new THREE.Mesh(
    trackGeo(createEndCapPlateX(THREE, rightLowerEndCapZY, rightEndCapHoles, +4.015, +halfW)),
    matBredentCream
  ));

  // 4 Signature Stainless Perimeter Screws on Right End-Cap (visible in machine-5.jpg!)
  const sideScrewGeo = trackGeo(new THREE.SphereGeometry(0.036, 14, 10));
  for (const [sz, sy] of [[+1.38, 1.36], [+0.45, 1.42], [-0.55, 1.62], [-1.42, 1.82]]) {
    const ss = new THREE.Mesh(sideScrewGeo, matStainlessBrush);
    ss.scale.set(0.45, 1, 1);
    ss.position.set(halfW + 0.004, sy, sz);
    lowerChassisAssembly.add(ss);
  }

  // Black IEC 230V Mains Inlet + Dual-Fuse & Rocker Switch Module (item 01)
  const iecModule = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.14, 0.68, 0.48)),
    matBlackPhenolic
  );
  iecModule.position.set(halfW + 0.015, 0.82, -1.42);
  lowerChassisAssembly.add(iecModule);

  const iecSwitch = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.16, 0.22, 0.26)),
    matKeypadFrame
  );
  iecSwitch.position.set(halfW + 0.025, 1.02, -1.42);
  lowerChassisAssembly.add(iecSwitch);

  const rearPlateMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.95, 0.98)),
    matRearPlate
  );
  rearPlateMesh.rotation.y = Math.PI;
  rearPlateMesh.position.set(-1.65, 1.15, -halfD - 0.004);
  lowerChassisAssembly.add(rearPlateMesh);

  productRoot.add(lowerChassisAssembly);

  // ==================== 2. UPPER MAIN CREAM HOOD (REAL 8x10 HEATER GRILLE, LEVER SLOT & LCD POCKET) ====================
  const upperMainHoodAssembly = new THREE.Group();
  upperMainHoodAssembly.name = 'upperMainHoodAssembly';

  upperMainHoodAssembly.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, bullnoseZY, wallT, -4.035, xLidSeam)),
    matBredentCream
  ));

  upperMainHoodAssembly.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, crownAndRearZY, wallT, -4.035, xLidSeam)),
    matBredentCream
  ));

  const deckCutouts = [
    [-3.16, 0.38, -1.34, 1.44],
    [-0.50, 0.54, -0.37, 1.68]
  ];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 8; col++) {
      const hx = -0.06 + col * 0.168;
      const hu = 0.22 + row * 0.156;
      deckCutouts.push([hx, hu, hx + 0.108, hu + 0.102]);
    }
  }

  const slopedDeckGeo = trackGeo(createPerforatedSheetPanel(THREE, -4.035, xLidSeam, 0, deckLen, deckCutouts, wallT));
  const slopedDeckGroup = new THREE.Group();
  slopedDeckGroup.position.set(0, P_deck0[1], P_deck0[0]);
  slopedDeckGroup.rotation.x = deckRotX;

  const slopedDeckMesh = new THREE.Mesh(slopedDeckGeo, matBredentCream);
  slopedDeckMesh.position.z = -wallT;
  slopedDeckGroup.add(slopedDeckMesh);

  // Dark recessed interior baffle parallel to the 8x10 top grille (8 mm below outer skin)
  // so ALL 80 square perforations have crisp, uniform dark interior depth from every viewing angle!
  const grilleDarkBaffle = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.52, 1.72)),
    matDarkChamberInterior
  );
  grilleDarkBaffle.position.set(0.60, 0.99, -0.14);
  slopedDeckGroup.add(grilleDarkBaffle);

  const titlePlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.62, 0.32)),
    matTitleDecal
  );
  titlePlane.position.set(-2.22, 1.82, 0.004);
  slopedDeckGroup.add(titlePlane);

  const leverNumPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.24, 0.96)),
    matLeverNums
  );
  leverNumPlane.position.set(-0.66, 1.12, 0.004);
  slopedDeckGroup.add(leverNumPlane);

  const hotWarnPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.38, 0.33)),
    matHotWarning
  );
  hotWarnPlane.position.set(0.60, 1.98, 0.004);
  slopedDeckGroup.add(hotWarnPlane);

  upperMainHoodAssembly.add(slopedDeckGroup);

  // 4 Stainless Button-Head Screws along Front Beltline Overlap Skirt
  const screwDomedGeo = trackGeo(new THREE.SphereGeometry(0.042, 16, 12));
  for (const sx of [-3.74, -2.52, -1.28, -0.02]) {
    const sc = new THREE.Mesh(screwDomedGeo, matStainlessBrush);
    sc.scale.set(1, 1, 0.55);
    sc.position.set(sx, 1.48, 1.872);
    upperMainHoodAssembly.add(sc);
  }

  const centerBulkheadZY = [
    [ 1.65, 1.45],
    [ 1.65, 1.95],
    [-0.28, 3.02],
    [-1.82, 3.02],
    [-1.82, 1.45]
  ];
  upperMainHoodAssembly.add(new THREE.Mesh(
    trackGeo(createEndCapPlateX(THREE, centerBulkheadZY, null, 1.47, 1.51)),
    matCradleSteel
  ));

  productRoot.add(upperMainHoodAssembly);

  // ==================== 3. LCD DISPLAY & 14-KEY TACTILE MEMBRANE CONTROL MODULE ====================
  const controlPanelAssembly = new THREE.Group();
  controlPanelAssembly.name = 'controlPanelAssembly';

  const keypadMount = new THREE.Group();
  keypadMount.position.set(0, P_deck0[1], P_deck0[0]);
  keypadMount.rotation.x = deckRotX;

  const kpHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.88, 1.10, 0.14)),
    matKeypadFrame
  );
  kpHousing.position.set(-2.25, 0.91, -0.035);
  keypadMount.add(kpHousing);

  const kpFace = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.82, 1.04)),
    matKeypadUi
  );
  kpFace.position.set(-2.25, 0.91, 0.038);
  keypadMount.add(kpFace);

  const pcbBoard = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.15, 1.32, 0.06)),
    matDarkChamberInterior
  );
  pcbBoard.position.set(-2.25, 0.91, -0.22);
  keypadMount.add(pcbBoard);

  controlPanelAssembly.add(keypadMount);
  productRoot.add(controlPanelAssembly);

  // ==================== 4. DUAL 400°C CARTRIDGE HEATING DRUM, BALL LEVER & 17 kN PLUNGER ====================
  const dualHeaterAndPlungerAssembly = new THREE.Group();
  dualHeaterAndPlungerAssembly.name = 'dualHeaterAndPlungerAssembly';

  const heaterWellTray = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.82, 0.12, 2.25)),
    matDarkChamberInterior
  );
  heaterWellTray.position.set(0.45, 1.48, 0.32);
  dualHeaterAndPlungerAssembly.add(heaterWellTray);

  const heaterDrumGroup = new THREE.Group();
  heaterDrumGroup.name = 'dualCartridgeHeaterDrum';
  heaterDrumGroup.position.set(0.62, 1.98, 0.42);

  const drumShell = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.52, 0.52, 1.62, 32)),
    matCradleSteel
  );
  drumShell.rotation.z = Math.PI * 0.5;
  drumShell.position.set(0.15, 0, 0);
  heaterDrumGroup.add(drumShell);

  for (const [bz, by] of [[-0.19, +0.08], [+0.19, -0.08]]) {
    const heaterTube = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 1.72, 24)),
      matHeaterGlow
    );
    heaterTube.rotation.z = Math.PI * 0.5;
    heaterTube.position.set(0.18, by, bz);
    heaterDrumGroup.add(heaterTube);
  }

  const cartridgeTube = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.135, 0.135, 1.15, 24)),
    matRoseGoldCartridge
  );
  cartridgeTube.rotation.z = Math.PI * 0.5;
  cartridgeTube.position.set(0.56, -0.08, 0.19);
  heaterDrumGroup.add(cartridgeTube);

  dualHeaterAndPlungerAssembly.add(heaterDrumGroup);

  const leverPivotGroup = new THREE.Group();
  leverPivotGroup.name = 'cartridgeSelectorLever';
  leverPivotGroup.position.set(-0.435, 2.02, 0.58);
  leverPivotGroup.rotation.x = -0.18;

  const leverShaft = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.042, 0.048, 1.12, 18)),
    matBlackPhenolic
  );
  leverShaft.position.set(0, 0.56, 0);
  leverPivotGroup.add(leverShaft);

  const leverBallKnob = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.145, 24, 20)),
    matBlackPhenolic
  );
  leverBallKnob.position.set(0, 1.14, 0);
  leverPivotGroup.add(leverBallKnob);

  dualHeaterAndPlungerAssembly.add(leverPivotGroup);

  const driveMotor = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 1.35, 24)),
    matDarkChamberInterior
  );
  driveMotor.rotation.z = Math.PI * 0.5;
  driveMotor.position.set(-2.55, 1.62, 0.42);
  dualHeaterAndPlungerAssembly.add(driveMotor);

  const injectionRam = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 1.65, 20)),
    matStainlessBrush
  );
  injectionRam.rotation.z = Math.PI * 0.5;
  injectionRam.position.set(-1.15, 1.90, 0.61);
  dualHeaterAndPlungerAssembly.add(injectionRam);

  const heaterLight = new THREE.PointLight(0xff6a1a, 0.45, 3.2, 1.6);
  heaterLight.position.set(0.55, 2.25, 0.45);
  dualHeaterAndPlungerAssembly.add(heaterLight);

  productRoot.add(dualHeaterAndPlungerAssembly);

  // ==================== 5. REAR-HINGED FLASK PRESS SAFETY LID ("bredent" + UPWARD-ARCHED BOW HANDLE) ====================
  const hingedPressLidAssembly = new THREE.Group();
  hingedPressLidAssembly.name = 'hingedPressLidAssembly';

  const lidHingeY = 3.02, lidHingeZ = -1.78;
  const lidPivotGroup = new THREE.Group();
  lidPivotGroup.name = 'pressLidPivotGroup';
  lidPivotGroup.position.set(0, lidHingeY, lidHingeZ);

  const lidContent = new THREE.Group();
  lidContent.position.set(0, -lidHingeY, -lidHingeZ);

  const lidBullnoseZY = bullnoseZY.slice(2); // starts cleanly at Y = 1.540 above lower belly seam!
  lidContent.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, lidBullnoseZY, wallT, xLidSeam + 0.015, +4.045)),
    matBredentCream
  ));

  const lidCrownZY = crownAndRearZY.slice(0, 17); // stops cleanly at rear hinge Y = 2.86
  lidContent.add(new THREE.Mesh(
    trackGeo(createCurvedSheetBandX(THREE, lidCrownZY, wallT, xLidSeam + 0.015, +4.045)),
    matBredentCream
  ));

  const lidDeckGroup = new THREE.Group();
  lidDeckGroup.position.set(0, P_deck0[1], P_deck0[0]);
  lidDeckGroup.rotation.x = deckRotX;

  const lidDeckGeo = trackGeo(createPerforatedSheetPanel(THREE, xLidSeam + 0.015, +4.045, 0, deckLen, null, wallT));
  const lidDeckMesh = new THREE.Mesh(lidDeckGeo, matBredentCream);
  lidDeckMesh.position.z = -wallT;
  lidDeckGroup.add(lidDeckMesh);

  const bredentPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.18, 0.30)),
    matLidLogoDecal
  );
  bredentPlane.position.set(2.79, 0.72, 0.005);
  lidDeckGroup.add(bredentPlane);

  lidContent.add(lidDeckGroup);

  // Upper-Right Side Cheek on Lid matching the exact stepped chamber line from rightLowerEndCapZY!
  const lidRightCheekZY = [
    ...lidBullnoseZY,
    ...lidCrownZY.slice(1),
    [-halfD, 2.06],
    [-0.95, 2.06],
    [0.85, 1.54]
  ];
  lidContent.add(new THREE.Mesh(
    trackGeo(createEndCapPlateX(THREE, lidRightCheekZY, null, +4.015, +halfW)),
    matBredentCream
  ));

  // Signature Upward-Arched Brushed-Stainless Bow Handle (matching exact arch in machine-5.jpg!)
  const handlePts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const hx = 1.80 + t * (3.78 - 1.80);
    const arch = Math.sin(t * Math.PI);
    const hy = 1.82 + arch * 0.145; // pronounced upward arch in Y matching machine-5.jpg!
    const hz = 1.81 + arch * 0.195;
    handlePts.push(new THREE.Vector3(hx, hy, hz));
  }
  const handleCurve = new THREE.CatmullRomCurve3(handlePts);
  const handleGeo = trackGeo(new THREE.TubeGeometry(handleCurve, 32, 0.042, 16, false));
  lidContent.add(new THREE.Mesh(handleGeo, matStainlessBrush));

  for (const hx of [1.82, 3.76]) {
    const fer = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.050, 0.055, 0.11, 16)),
      matStainlessBrush
    );
    fer.rotation.x = Math.PI * 0.38;
    fer.position.set(hx, 1.83, 1.80);
    lidContent.add(fer);
  }

  lidPivotGroup.add(lidContent);
  hingedPressLidAssembly.add(lidPivotGroup);

  const stayRodMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 1.45, 12)),
    matStainlessBrush
  );
  stayRodMesh.position.set(3.92, 2.15, -0.35);
  stayRodMesh.rotation.x = 0.55;
  hingedPressLidAssembly.add(stayRodMesh);

  productRoot.add(hingedPressLidAssembly);

  // ==================== 6. FLASK PRESS V-CRADLE, CLAMPING YOKE & TENSION BOLTS ====================
  const flaskPressCradleAssembly = new THREE.Group();
  flaskPressCradleAssembly.name = 'flaskPressCradleAssembly';

  const rearChamberBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.38, 0.85, 0.92)),
    matCradleSteel
  );
  rearChamberBox.position.set(2.76, 1.92, -1.26);
  flaskPressCradleAssembly.add(rearChamberBox);

  const safetySwitch = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 14)),
    matBlackPhenolic
  );
  safetySwitch.position.set(3.82, 2.38, -0.95);
  flaskPressCradleAssembly.add(safetySwitch);

  const cradleBed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.18, 0.18, 1.68)),
    matCradleSteel
  );
  cradleBed.position.set(2.72, 1.38, 0.25);
  flaskPressCradleAssembly.add(cradleBed);

  for (const rz of [-0.48, +0.92]) {
    const rail = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.12, 0.48, 0.14)),
      matCradleSteel
    );
    rail.position.set(2.72, 1.70, rz);
    flaskPressCradleAssembly.add(rail);
  }

  const clampingYoke = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.44, 1.56)),
    matStainlessBrush
  );
  clampingYoke.position.set(3.56, 1.82, 0.22);
  flaskPressCradleAssembly.add(clampingYoke);

  const frontBoltCollar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.115, 0.125, 0.18, 24)),
    matBlackPhenolic
  );
  frontBoltCollar.rotation.x = Math.PI * 0.42;
  frontBoltCollar.position.set(1.42, 0.98, 1.73);
  flaskPressCradleAssembly.add(frontBoltCollar);

  const frontBoltHex = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.068, 0.068, 0.22, 6)),
    matStainlessBrush
  );
  frontBoltHex.rotation.x = Math.PI * 0.42;
  frontBoltHex.position.set(1.42, 0.98, 1.74);
  flaskPressCradleAssembly.add(frontBoltHex);

  const sideBoltCollar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.28, 20)),
    matBlackPhenolic
  );
  sideBoltCollar.rotation.z = Math.PI * 0.5;
  sideBoltCollar.position.set(3.98, 1.04, 1.03);
  flaskPressCradleAssembly.add(sideBoltCollar);

  const sideBoltHex = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.32, 6)),
    matStainlessBrush
  );
  sideBoltHex.rotation.z = Math.PI * 0.5;
  sideBoltHex.position.set(3.99, 1.04, 1.03);
  flaskPressCradleAssembly.add(sideBoltHex);

  // Removable Ergonomic Blue/Black T-Handle Hex Driver (from machine-3.jpg & machine-4.jpg, visible when lid opens!)
  const tHandleToolGroup = new THREE.Group();
  tHandleToolGroup.name = 'ergonomicTHandleHexDriver';
  tHandleToolGroup.position.set(4.36, 1.04, 1.03);

  const hexShaft = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.56, 8)),
    matStainlessBrush
  );
  hexShaft.rotation.z = Math.PI * 0.5;
  hexShaft.position.set(-0.12, 0, 0);
  tHandleToolGroup.add(hexShaft);

  const tGripMain = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.78, 0.22)),
    matDriverBlue
  );
  tGripMain.position.set(0.18, 0, 0);
  tHandleToolGroup.add(tGripMain);

  const tGripInsert = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.20, 0.52, 0.14)),
    matBlackPhenolic
  );
  tGripInsert.position.set(0.18, 0, 0);
  tHandleToolGroup.add(tGripInsert);

  tHandleToolGroup.visible = false; // Hidden in closed hero state to match user's photo 100%, appears when Open Lid or Exploded!
  flaskPressCradleAssembly.add(tHandleToolGroup);

  productRoot.add(flaskPressCradleAssembly);

  // ==================== 7. TWO-PART CNC ALUMINUM DENTAL INJECTION FLASK (KÜVETTE) ====================
  const dentalFlaskAssembly = new THREE.Group();
  dentalFlaskAssembly.name = 'dentalFlaskAssembly';
  dentalFlaskAssembly.position.set(2.56, 1.90, 0.22);
  dentalFlaskAssembly.rotation.x = 0.36;

  const flaskBottomGroup = new THREE.Group();
  const flBotBlock = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.52, 0.44, 1.24)),
    matMachinedFlaskAlu
  );
  flBotBlock.position.set(0, -0.22, 0);
  flaskBottomGroup.add(flBotBlock);

  const gypsumCore = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.46, 0.48, 0.08, 28)),
    matGypsumStone
  );
  gypsumCore.position.set(0, 0.02, 0);
  flaskBottomGroup.add(gypsumCore);

  const pinkDentureArch = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.26, 0.065, 12, 28, Math.PI * 1.28)),
    matPinkDenture
  );
  pinkDentureArch.rotation.x = Math.PI * 0.5;
  pinkDentureArch.rotation.z = Math.PI * 0.35;
  pinkDentureArch.position.set(0.02, 0.065, 0);
  flaskBottomGroup.add(pinkDentureArch);

  const pinkSprue = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.48, 12)),
    matPinkDenture
  );
  pinkSprue.rotation.z = Math.PI * 0.5;
  pinkSprue.position.set(-0.48, 0.05, 0);
  flaskBottomGroup.add(pinkSprue);

  dentalFlaskAssembly.add(flaskBottomGroup);

  const flaskTopGroup = new THREE.Group();
  const flTopBlock = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.52, 0.44, 1.24)),
    matMachinedFlaskAlu
  );
  flTopBlock.position.set(0, 0.23, 0);
  flaskTopGroup.add(flTopBlock);

  const flTopRidge = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.52, 0.08, 0.72)),
    matStainlessBrush
  );
  flTopRidge.position.set(0, 0.47, 0);
  flaskTopGroup.add(flTopRidge);

  const flBoltGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 16));
  for (const [bx, bz] of [[-0.60, -0.46], [+0.60, -0.46], [-0.60, +0.46], [+0.60, +0.46]]) {
    const fb = new THREE.Mesh(flBoltGeo, matBlackPhenolic);
    fb.position.set(bx, 0.44, bz);
    flaskTopGroup.add(fb);
  }

  for (const sx of [-0.82, +0.82]) {
    const boss = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.20, 0.20, 0.14, 24)),
      matCradleSteel
    );
    boss.rotation.z = Math.PI * 0.5;
    boss.position.set(sx, 0.0, 0);
    flaskBottomGroup.add(boss);
  }

  dentalFlaskAssembly.add(flaskTopGroup);
  productRoot.add(dentalFlaskAssembly);

  const pressChamberLight = new THREE.PointLight(0xfff9ee, 0.25, 4.5, 1.4);
  pressChamberLight.position.set(2.65, 2.75, 0.35);
  flaskPressCradleAssembly.add(pressChamberLight);

  productRoot.traverse((obj) => {
    if (obj.isMesh && !obj.material.transparent) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // ==================== INTERACTIVE LID, 400°C INJECTION CYCLE & EXPLODE API ====================
  let lidOpen = 0;
  let explodeFactor = 0;
  let injectBlend = 0;
  let injectSec = 0;

  function applyState() {
    const el = lidOpen * lidOpen * (3 - 2 * lidOpen);
    const ee = explodeFactor * explodeFactor * (3 - 2 * explodeFactor);
    const ib = injectBlend;

    // 1. Rear-Hinged Press Safety Lid swings open ~68 deg (and tilts open in Exploded View so zero collision with Küvette!)
    lidPivotGroup.rotation.x = -1.18 * el - 0.52 * ee * (1 - el);
    stayRodMesh.visible = (el > 0.06) && (ee < 0.25);
    stayRodMesh.position.set(3.92, 1.85 + 0.55 * el, 0.25 - 0.35 * el);
    stayRodMesh.rotation.x = -0.38 * el;
    const showTool = (el > 0.25) || (ee > 0.25);
    tHandleToolGroup.visible = showTool;
    tHandleToolGroup.traverse((c) => { c.visible = showTool; });
    tHandleToolGroup.scale.setScalar(showTool ? 1.0 : 0.0001);
    tHandleToolGroup.position.set(showTool ? (4.36 + 0.45 * ee) : 2.50, 1.04, 1.03);
    pressChamberLight.intensity = 0.25 + 1.35 * Math.max(el, ee);

    // 2. Live 400°C Thermoplastic Injection Cycle
    const cycleWave = 0.5 - 0.5 * Math.cos(injectSec * 1.6);
    leverPivotGroup.rotation.x = -0.18 + 0.52 * ib;
    heaterDrumGroup.rotation.x = 0.22 * ib;
    injectionRam.position.x = -1.15 + (0.88 * cycleWave) * ib;
    matHeaterGlow.emissiveIntensity = 0.48 + (1.50 + 0.40 * Math.sin(injectSec * 3.2)) * ib;
    heaterLight.intensity = 0.45 + 1.85 * ib;

    // 3. Collision-Free 7-Subassembly Exploded View (with separated Küvette halves revealing pink bre.flex denture!):
    lowerChassisAssembly.position.set(0, -0.75 * ee, 0);
    upperMainHoodAssembly.position.set(-0.42 * ee, 1.08 * ee, -0.15 * ee);
    controlPanelAssembly.position.set(-0.62 * ee, 1.72 * ee, 0.42 * ee);
    dualHeaterAndPlungerAssembly.position.set(-0.28 * ee, 0.14 * ee, 0.05 * ee);
    hingedPressLidAssembly.position.set(0.95 * ee, 1.55 * ee, -0.68 * ee);
    flaskPressCradleAssembly.position.set(0.28 * ee, -0.15 * ee, 0.08 * ee);
    dentalFlaskAssembly.position.set(2.56 + 0.52 * ee, 1.90 + 0.62 * ee, 0.22 + 0.68 * ee);
    flaskTopGroup.position.set(0, 0.58 * ee, 0);
  }

  function setCoverOpenFactor(t) {
    lidOpen = Math.max(0, Math.min(1, t));
    applyState();
  }

  function setExplodeFactor(t) {
    explodeFactor = Math.max(0, Math.min(1, t));
    applyState();
  }

  function setLiveInjectionCycle(elapsedSec, blend) {
    injectSec = elapsedSec;
    injectBlend = Math.max(0, Math.min(1, blend));
    applyState();
  }

  applyState();

  function dispose() {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    texs.forEach((t) => t.dispose());
  }

  return {
    productRoot,
    setCoverOpenFactor,
    setExplodeFactor,
    setLiveInjectionCycle,
    dispose
  };
}



// ── END original source ──────────────────────────────────────────────────────

const __factory = () => createThermopress400Product(window.__THREE_BUNDLE__.THREE);

/** The machine's record, in the shape the asset library gives its machines. */
export const assets = {
  "bredent-thermopress-400": { id: "bredent-thermopress-400", name: "bredent thermopress 400", realDimensionsMm: "650 × 300 × 250 mm", createAsset: () => __factory() },
};

/** A viewer holds one machine and nothing else. */
export const extras = {};
