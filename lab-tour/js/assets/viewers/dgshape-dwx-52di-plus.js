// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-viewer -- <Viewer.html> --id dgshape-dwx-52di-plus
//
// Source    : DGSHAPE_DWX_52Di_Plus_Viewer.html  (761,507 bytes)
//             md5 40d86751d9356817182d3d501f236666 · sha256 77392f551b2f6d4c591f89cd516cc0732894f97cf4da3b645d51ff2e7fd18a30
// Component : script 2 of 5, under the comment "COMPONENT 2 OF 3: PRODUCT MODEL (DGSHAPE DWX-52Di Plus — 213 Meshes)"
// sha256    : e987f438aaa8a3b9932d7535c7ece99804041ad57e1453685001727b8c237e8e
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer version
// of the viewer can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { createViewerWindow } from './_viewer-window.js';

const window = createViewerWindow();

// ── BEGIN original source ────────────────────────────────────────────────────

    window.__registerProductModel = function () {
      const { THREE } = window.__THREE_BUNDLE__;
// ============================================================================
// Roland DGSHAPE DWX-52Di Plus — 5-Axis Dry Dental CAD/CAM Milling Machine
// Calibrated Scale: 1 scene unit = 80 mm
// Official Dimensions: 495 mm (W) x 660 mm (D) x 600 mm (H), 67 kg
//   => W = 6.1875 u, D = 8.2500 u, H = 7.5000 u, seated at Y = 0.0000
// ============================================================================

// Helper: Extrude a 2D side-profile loop (z, y) along X from x0 to x1 with outward normals
function createSideProfilePrismX(THREE, zyLoop, x0, x1, capLeft = true, capRight = true) {
  const pos = [];
  const uvs = [];
  const M = zyLoop.length;

  let area2 = 0;
  for (let i = 0; i < M; i++) {
    const a = zyLoop[i], b = zyLoop[(i + 1) % M];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area2 >= 0 ? 1 : -1;

  function pushTri(ax, ay, az, bx, by, bz, dx, dy, dz, ox, oy, oz) {
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = dx - ax, vy = dy - ay, vz = dz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    if (nx * ox + ny * oy + nz * oz >= 0) {
      pos.push(ax, ay, az, bx, by, bz, dx, dy, dz);
    } else {
      pos.push(ax, ay, az, dx, dy, dz, bx, by, bz);
    }
    uvs.push(0, 0, 1, 0, 1, 1);
  }

  for (let i = 0; i < M; i++) {
    const a = zyLoop[i], b = zyLoop[(i + 1) % M];
    const dz = b[0] - a[0], dy = b[1] - a[1];
    const outZ = sign * dy;
    const outY = sign * (-dz);
    pushTri(x0, a[1], a[0], x1, a[1], a[0], x1, b[1], b[0], 0, outY, outZ);
    pushTri(x0, a[1], a[0], x1, b[1], b[0], x0, b[1], b[0], 0, outY, outZ);
  }

  const pts2d = zyLoop.map((p) => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(pts2d, []);
  if (capLeft) {
    for (const [i0, i1, i2] of tris) {
      const a = zyLoop[i0], b = zyLoop[i1], c = zyLoop[i2];
      pushTri(x0, a[1], a[0], x0, b[1], b[0], x0, c[1], c[0], -1, 0, 0);
    }
  }
  if (capRight) {
    for (const [i0, i1, i2] of tris) {
      const a = zyLoop[i0], b = zyLoop[i1], c = zyLoop[i2];
      pushTri(x1, a[1], a[0], x1, b[1], b[0], x1, c[1], c[0], +1, 0, 0);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// Helper: Extrude a front panel in (x, y) with optional rectangular/polygonal holes along Z
function createPanelWithHolesZ(THREE, outerXY, holesArray, z0, z1, bevel = 0.014) {
  const shape = new THREE.Shape();
  outerXY.forEach((p, i) => {
    if (i === 0) shape.moveTo(p[0], p[1]);
    else shape.lineTo(p[0], p[1]);
  });
  shape.closePath();

  if (holesArray) {
    for (const hPts of holesArray) {
      const hole = new THREE.Path();
      hPts.forEach((p, i) => {
        if (i === 0) hole.moveTo(p[0], p[1]);
        else hole.lineTo(p[0], p[1]);
      });
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: z1 - z0,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2
  });
  geo.translate(0, 0, z0);
  return geo;
}

// ==================== PROCEDURAL HIGH-DPI CANVAS TEXTURES ====================

// 1. Upper-Center "DGSHAPE" Prism Logo + Wordmark (transparent background)
function createDgshapeLogoTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);

  // Faceted 3D triangle/prism emblem on left
  ctx.fillStyle = '#9aa3af';
  ctx.beginPath();
  ctx.moveTo(78, 36); ctx.lineTo(132, 42); ctx.lineTo(104, 92); ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(104, 58); ctx.lineTo(132, 42); ctx.lineTo(104, 92); ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#bfc6d0';
  ctx.beginPath();
  ctx.moveTo(78, 36); ctx.lineTo(132, 42); ctx.lineTo(104, 58); ctx.closePath();
  ctx.fill();

  // Crisp sleek "DGSHAPE" geometric wordmark
  ctx.fillStyle = '#7c8593';
  ctx.font = '600 44px "Segoe UI", Inter, Arial, sans-serif';
  ctx.fillText('DGSHAPE', 150, 79);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 2. Bottom-Right "Access to Manual / マニュアルはこちら" QR Code Sticker (matching user photo!)
function createManualQrStickerTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 280;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#fafbfc';
  ctx.fillRect(0, 0, 256, 280);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, 250, 274);

  ctx.fillStyle = '#374151';
  ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Access to Manual', 128, 38);
  ctx.font = '600 17px "Segoe UI", sans-serif';
  ctx.fillText('マニュアルはこちら', 128, 64);

  // Crisp procedural 21x21 QR matrix in center
  const qx = 65, qy = 82, cell = 6;
  ctx.fillStyle = '#1f2937';
  for (let r = 0; r < 21; r++) {
    for (let col = 0; col < 21; col++) {
      const inTL = r < 7 && col < 7;
      const inTR = r < 7 && col >= 14;
      const inBL = r >= 14 && col < 7;
      let dark = false;
      if (inTL || inTR || inBL) {
        const lr = r >= 14 ? r - 14 : r;
        const lc = col >= 14 ? col - 14 : col;
        dark = (lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4));
      } else {
        dark = ((r * 17 + col * 31 + r * col) % 7) < 3;
      }
      if (dark) ctx.fillRect(qx + col * cell, qy + r * cell, cell, cell);
    }
  }

  ctx.fillStyle = '#4b5563';
  ctx.font = '500 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText('https://downloadcenter.', 128, 236);
  ctx.fillText('rolanddg.com/DWX-52Di', 128, 254);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 3. Middle LED Status Control Strip ("ERROR •", "PAUSE •", glowing ring, "• POWER" blue LED, "• CANCEL")
function createControlStripTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 192;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f2f4f5';
  ctx.fillRect(0, 0, 1024, 192);

  // Subtle top & bottom shadow hairlines
  ctx.strokeStyle = '#d4d9df';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 1020, 188);

  // Center glowing white LED halo ring
  const cx = 512, cy = 98;
  const g = ctx.createRadialGradient(cx, cy, 12, cx, cy, 34);
  g.addColorStop(0.0, '#ffffff');
  g.addColorStop(0.55, '#ffffff');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#e5e9ee';
  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();

  // Left labels: ERROR & PAUSE
  ctx.fillStyle = '#6b7280';
  ctx.font = '600 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ERROR', 392, 62);
  ctx.fillText('PAUSE', 392, 138);

  // Unlit indicator dots for ERROR, PAUSE, CANCEL
  ctx.fillStyle = '#b6bec8';
  ctx.beginPath(); ctx.arc(406, 56, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(406, 132, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(618, 132, 5, 0, Math.PI * 2); ctx.fill();

  // Lit cyan-blue POWER LED dot!
  const pg = ctx.createRadialGradient(618, 56, 2, 618, 56, 12);
  pg.addColorStop(0, '#38bdf8');
  pg.addColorStop(0.5, '#0284c7');
  pg.addColorStop(1, 'rgba(2,132,199,0)');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(618, 56, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath(); ctx.arc(618, 56, 5.5, 0, Math.PI * 2); ctx.fill();

  // Right labels: POWER & CANCEL
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'left';
  ctx.fillText('POWER', 632, 62);
  ctx.fillText('CANCEL', 632, 138);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 4. Lower Dust-Collection Drawer Front ("DWX-52Di Plus" + Signature Lime-Green Arc!)
function createDustDrawerFrontTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 280;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, '#f3f5f6');
  grad.addColorStop(1, '#eaeeef');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 280);

  ctx.strokeStyle = '#cfd5dc';
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 1018, 274);

  // Bold geometric "DWX-52Di" + elegant serif/italic "Plus" (matching user photo!)
  ctx.fillStyle = '#3f4956';
  ctx.font = 'italic 800 38px "Segoe UI", Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DWX-52Di', 538, 198);

  ctx.fillStyle = '#4b5563';
  ctx.font = 'italic 500 38px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  ctx.fillText('Plus', 550, 198);

  // Signature DGSHAPE lime-green curved arch sweeping across bottom edge!
  ctx.strokeStyle = '#78be43';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(88, 276);
  ctx.quadraticCurveTo(148, 226, 232, 226);
  ctx.lineTo(792, 226);
  ctx.quadraticCurveTo(876, 226, 936, 276);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 5. Interior Right-Shroud Safety Warning Decal (Yellow Pinch Hazard + Red Do-Not-Touch, matching side-or-1.webp!)
function createSafetyHazardStickerTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 144;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 144);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 140);

  // Left half: yellow caution block with black triangle
  ctx.fillStyle = '#facc15';
  ctx.fillRect(8, 8, 114, 128);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(65, 24); ctx.lineTo(108, 102); ctx.lineTo(22, 102); ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#111827';
  ctx.font = '800 44px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', 65, 92);

  // Right half: red prohibition circle
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(188, 72, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(158, 42); ctx.lineTo(218, 102);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 6. Rear DGSHAPE Hamamatsu Serial & CE Type Plate + Regulator Gauge Face
function createRearRatingPlateTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 280;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#272c35';
  ctx.fillRect(0, 0, 512, 280);
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 264);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DGSHAPE CORPORATION', 24, 48);
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('MODEL :  DWX-52Di Plus  (5-Axis Dental Mill)', 24, 84);
  ctx.fillText('INPUT :  100–240 V AC  50/60 Hz  2.0 A  (200 W)', 24, 116);
  ctx.fillText('AIR   :  0.02 – 0.2 MPa (Auto Volume Switch)', 24, 148);
  ctx.fillText('SERIAL:  Z5P-482910     MADE IN JAPAN', 24, 180);
  ctx.font = '500 15px "Segoe UI", Arial, sans-serif';
  ctx.fillText('1-1-2 Shinmiyakoda, Hamana-ku, Hamamatsu-shi, Shizuoka 431-2103', 24, 214);
  ctx.font = '800 38px Arial, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('CE   FCC   UKCA', 24, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createMpaGaugeTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(128, 128, 110, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(128, 128, 84, -Math.PI * 0.35, Math.PI * 0.15); ctx.stroke();

  const na = -Math.PI * 0.12;
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + Math.cos(na) * 80, 128 + Math.sin(na) * 80);
  ctx.stroke();

  ctx.fillStyle = '#1f2937';
  ctx.beginPath(); ctx.arc(128, 128, 11, 0, Math.PI * 2); ctx.fill();
  ctx.font = '700 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('0.2 MPa', 128, 188);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ==================== MAIN PRODUCT FACTORY ====================

function createDwx52DiPlusProduct(THREE) {
  const geos = [];
  const mats = [];
  const texs = [];
  const trackGeo = (g) => { geos.push(g); return g; };
  const trackMat = (m) => { mats.push(m); return m; };
  const trackTex = (t) => { texs.push(t); return t; };

  const productRoot = new THREE.Group();
  productRoot.name = 'dwx52DiPlusRoot';

  // Exact calibrated dimensions:
  // W = 495 mm (6.1875 u -> X = [-3.0938, +3.0938])
  // D = 660 mm (8.2500 u -> Z = [-4.1250, +4.1250])
  // H = 600 mm (7.5000 u -> Y = [0.0000, +7.5000])
  const halfW = 3.09375;
  const halfD = 4.1250;
  const totalH = 7.5000;

  // Ergonomic front rake: -10.2 deg (-0.17802 rad) anchored at (0, 0.20, +3.96)
  const frontRakeRad = -0.1780236;
  const cosR = Math.cos(-frontRakeRad); // 0.984196
  const sinR = Math.sin(-frontRakeRad); // 0.177085
  // Along local raked coordinate s in [0 .. 7.26]:
  //   world Y(s) = 0.20 + s * cosR
  //   world Z(s) = 3.96 - s * sinR
  // At s = 0:    Y = 0.200, Z = +3.960 (silver column front reaches +4.125!)
  // At s = 7.26: Y = 7.345, Z = +2.674 (main cabinet top crown rises to Y = 7.500 behind it!)
  const sMaxFront = 7.26;

  // ==================== PBR MATERIALS ====================
  const matFrontWhite = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxFrontSatinWhite',
    color: 0xf4f6f8,
    roughness: 0.24,
    metalness: 0.04,
    envMapIntensity: 1.15
  }));

  const matCabinetPearl = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxSidePearlWhite',
    color: 0xeaebea,
    roughness: 0.34,
    metalness: 0.06,
    envMapIntensity: 1.08
  }));

  const matChamberWhite = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxChamberWhite',
    color: 0xe3e8ef,
    roughness: 0.36,
    metalness: 0.05,
    envMapIntensity: 1.05
  }));

  const matSilverColumn = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxAnodizedSilverColumn',
    color: 0xd0d6de,
    roughness: 0.21,
    metalness: 0.76,
    envMapIntensity: 1.48
  }));

  const matBilletAluminum = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxBilletAluminumClamp',
    color: 0xd6dce4,
    roughness: 0.19,
    metalness: 0.82,
    envMapIntensity: 1.50
  }));

  const matAtcStainless = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxAtcStainless',
    color: 0xc5cdd7,
    roughness: 0.26,
    metalness: 0.74,
    envMapIntensity: 1.38
  }));

  const matBronzeCollet = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxBronzeBurCollet',
    color: 0xc9964c,
    roughness: 0.28,
    metalness: 0.80,
    envMapIntensity: 1.40
  }));

  const matCarbideBur = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxCarbideBur',
    color: 0x828b99,
    roughness: 0.20,
    metalness: 0.88,
    envMapIntensity: 1.45
  }));

  const matZirconiaBlank = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxZirconiaDisc',
    color: 0xf1ece1,
    roughness: 0.44,
    metalness: 0.03
  }));

  const matSpiralHose = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxSpiralHoseWhite',
    color: 0xe6eaef,
    roughness: 0.38,
    metalness: 0.04
  }));

  const matRearCharcoal = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxRearCharcoalMetal',
    color: 0x262b33,
    roughness: 0.52,
    metalness: 0.28
  }));

  const matRubberFoot = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxBlackRubber',
    color: 0x171a20,
    roughness: 0.72,
    metalness: 0.08
  }));

  const matClearWindow = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxWindowAcrylic',
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.18,
    roughness: 0.06,
    metalness: 0.10,
    envMapIntensity: 1.55,
    depthWrite: false
  }));

  const matClearBowl = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxRegulatorBowl',
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.48,
    roughness: 0.10,
    metalness: 0.10,
    depthWrite: false
  }));

  const matChamberStatusLeds = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxChamberStatusLeds',
    color: 0xf8fafc,
    emissive: 0xeef6ff,
    emissiveIntensity: 1.15,
    roughness: 0.18
  }));

  // Mapped High-DPI Procedural Textures
  const matDgshapeLogo = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxDgshapeLogo',
    map: trackTex(createDgshapeLogoTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.24,
    metalness: 0.12
  }));

  const matManualQr = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxManualQrSticker',
    map: trackTex(createManualQrStickerTexture(THREE)),
    roughness: 0.30,
    metalness: 0.05
  }));

  const matControlStrip = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxControlStrip',
    map: trackTex(createControlStripTexture(THREE)),
    emissive: 0xffffff,
    emissiveIntensity: 0.16,
    roughness: 0.26,
    metalness: 0.05
  }));
  matControlStrip.emissiveMap = matControlStrip.map;

  const matDrawerFront = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxDustDrawerFront',
    map: trackTex(createDustDrawerFrontTexture(THREE)),
    roughness: 0.26,
    metalness: 0.05
  }));

  const matHazardSticker = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxSafetyHazardSticker',
    map: trackTex(createSafetyHazardStickerTexture(THREE)),
    roughness: 0.35
  }));

  const matRearPlate = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxRearRatingPlate',
    map: trackTex(createRearRatingPlateTexture(THREE)),
    roughness: 0.38,
    metalness: 0.25
  }));

  const matMpaGauge = trackMat(new THREE.MeshStandardMaterial({
    name: 'dwxMpaGauge',
    map: trackTex(createMpaGaugeTexture(THREE)),
    roughness: 0.25
  }));

  // ==================== 1. BASE CHASSIS, RUBBER FEET & REAR REGULATOR/I-O MODULE ====================
  const baseAndRearAssembly = new THREE.Group();
  baseAndRearAssembly.name = 'baseAndRearAssembly';

  // 4 Heavy Black Rubber Leveling Feet seated at Y = 0.0000 .. 0.2000 (matching X_frac = 0.309, 0.694 in user photo!)
  const footPadGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.31, 0.15, 28));
  const footStemGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 18));
  for (const [fx, fz] of [[-1.92, +3.18], [+1.92, +3.18], [-1.92, -3.15], [+1.92, -3.15]]) {
    const pad = new THREE.Mesh(footPadGeo, matRubberFoot);
    pad.position.set(fx, 0.075, fz);
    baseAndRearAssembly.add(pad);

    const stem = new THREE.Mesh(footStemGeo, matAtcStainless);
    stem.position.set(fx, 0.175, fz);
    baseAndRearAssembly.add(stem);
  }

  // Structural Dark-Grey Steel Under-Base Frame Plate (Y = 0.20 .. 0.34)
  const underChassis = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.65, 0.14, 7.35)),
    matRearCharcoal
  );
  underChassis.position.set(0, 0.27, -0.05);
  baseAndRearAssembly.add(underChassis);

  // Lower-Rear Protruding Charcoal Electronics, Vacuum Suction & Power Manifold
  // (Clearly visible peeking behind the white side panel at the back-right in dwx52di_plus_left_3_4.webp & back-2.jpg!)
  const rearLowerBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.56, 3.65, 0.56)),
    matRearCharcoal
  );
  rearLowerBox.position.set(0, 2.08, -3.845); // reaches Z = -4.125 exact!
  baseAndRearAssembly.add(rearLowerBox);

  // Upper-Rear Pearl-White Back Bulkhead (Y = 3.90 .. 7.50, Z = -3.62)
  const rearUpperPanel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.84, 3.60, 0.12)),
    matCabinetPearl
  );
  rearUpperPanel.position.set(0, 5.70, -3.62);
  baseAndRearAssembly.add(rearUpperPanel);

  // Official DGSHAPE Rating Plate on Rear Panel
  const rearPlateMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.95, 1.06)),
    matRearPlate
  );
  rearPlateMesh.rotation.y = Math.PI;
  rearPlateMesh.position.set(-1.35, 2.55, -4.128);
  baseAndRearAssembly.add(rearPlateMesh);

  // Rear Ø 50 mm Dust-Collection Hose Attachment Port (Stepped Black Vacuum Nozzle)
  const dustPortBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.42, 0.46, 0.22, 28)),
    matRubberFoot
  );
  dustPortBase.rotation.x = Math.PI * 0.5;
  dustPortBase.position.set(1.65, 1.35, -4.18);
  baseAndRearAssembly.add(dustPortBase);

  const dustPortNozzle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.31, 0.34, 0.36, 28)),
    matRubberFoot
  );
  dustPortNozzle.rotation.x = Math.PI * 0.5;
  dustPortNozzle.position.set(1.65, 1.35, -4.34);
  baseAndRearAssembly.add(dustPortNozzle);

  // Rear IEC Power Socket + Main Rocker Switch + USB Type-B + Dust-Collector Link Expansion Port
  const iecHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.86, 0.48, 0.08)),
    matRubberFoot
  );
  iecHousing.position.set(-1.85, 1.15, -4.14);
  baseAndRearAssembly.add(iecHousing);

  const usbPort = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.22, 0.22, 0.08)),
    matAtcStainless
  );
  usbPort.position.set(-0.85, 1.15, -4.14);
  baseAndRearAssembly.add(usbPort);

  const linkJack = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.10, 16)),
    matAtcStainless
  );
  linkJack.rotation.x = Math.PI * 0.5;
  linkJack.position.set(-0.45, 1.15, -4.14);
  baseAndRearAssembly.add(linkJack);

  // Rear Bracket-Mounted Air Regulator & Water-Separator Assembly (matching Roland manual diagram du-3.png!)
  const regGroup = new THREE.Group();
  regGroup.name = 'rearAirRegulator';
  regGroup.position.set(1.65, 4.55, -3.92);

  // Sheet-metal U-guard bracket with keyhole slots
  const regBracketBack = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.88, 1.45, 0.05)),
    matAtcStainless
  );
  regBracketBack.position.set(0, -0.15, 0.26);
  regGroup.add(regBracketBack);

  const regBracketFrontGuard = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.88, 0.72, 0.44)),
    matAtcStainless
  );
  regBracketFrontGuard.position.set(0, -0.52, 0.04);
  regGroup.add(regBracketFrontGuard);

  // Regulator square body + top adjustment cap + clear filter bowl + 0.2 MPa gauge + brass hex push-fittings
  const regBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.52, 0.58, 0.48)),
    matRearCharcoal
  );
  regBody.position.set(0, 0.24, 0);
  regGroup.add(regBody);

  const regCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.20, 0.34, 24)),
    matRubberFoot
  );
  regCap.position.set(0, 0.68, 0);
  regGroup.add(regCap);

  const regBowl = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.19, 0.16, 0.55, 22)),
    matClearBowl
  );
  regBowl.position.set(0, -0.32, 0);
  regGroup.add(regBowl);

  const regGaugeBezel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.38, 0.38, 0.08)),
    matRubberFoot
  );
  regGaugeBezel.position.set(0, 0.24, -0.27);
  regGroup.add(regGaugeBezel);

  const regGaugeFace = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.16, 24)),
    matMpaGauge
  );
  regGaugeFace.rotation.y = Math.PI;
  regGaugeFace.position.set(0, 0.24, -0.315);
  regGroup.add(regGaugeFace);

  for (const sx of [-0.32, +0.32]) {
    const pushFit = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 16)),
      matAtcStainless
    );
    pushFit.rotation.z = Math.PI * 0.5;
    pushFit.position.set(sx, 0.24, 0);
    regGroup.add(pushFit);
  }

  baseAndRearAssembly.add(regGroup);
  productRoot.add(baseAndRearAssembly);

  // ==================== 2. OUTER PEARL-WHITE SIDE SHELLS, TOP CROWN & LOWER SILVER COLUMNS ====================
  const outerCabinetAssembly = new THREE.Group();
  outerCabinetAssembly.name = 'outerCabinetAssembly';

  // Side sheet-metal profile in (z, y) matching dwx52di_plus_left_3_4.webp:
  // Front sloped edge sits right behind the silver columns & sliding door rail:
  //   bottom-front: (z = +3.66, y = 0.20) -> top-front: (z = +2.38, y = 7.36) -> top-crown bevel (z = +2.22, y = 7.50)
  //   top-rear:     (z = -3.66, y = 7.50) -> bottom-rear: (z = -3.66, y = 0.20)
  const cabinetSideZY = [
    [ 3.66, 0.20],
    [ 2.38, 7.36],
    [ 2.22, 7.50],
    [-3.66, 7.50],
    [-3.66, 0.20]
  ];

  // Left Pearl-White Side Sheet-Metal Wall: X = [-2.96, -2.59]
  outerCabinetAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, cabinetSideZY, -2.96, -2.59, true, true)),
    matCabinetPearl
  ));

  // Right Pearl-White Side Sheet-Metal Wall: X = [+2.59, +2.96]
  outerCabinetAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, cabinetSideZY, +2.59, +2.96, true, true)),
    matCabinetPearl
  ));

  // Top Pearl-White Roof Crown Span: X = [-2.96, +2.96], Y = [7.34, 7.50], Z = [-3.66, +2.36]
  // (Notice in user's front photo, the beveled white roof crown peeks ~11 mm above the upper cover!)
  const roofCrownZY = [
    [ 2.38, 7.34],
    [ 2.22, 7.50],
    [-3.66, 7.50],
    [-3.66, 7.34]
  ];
  outerCabinetAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, roofCrownZY, -2.96, +2.96, true, true)),
    matCabinetPearl
  ));

  // Two black rail-stop tabs visible at top-left & top-right of the roof crown in user's front photo!
  for (const tx of [-2.42, +2.42]) {
    const stopTab = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.11, 0.08, 0.14)),
      matRubberFoot
    );
    stopTab.position.set(tx, 7.43, 2.32);
    outerCabinetAssembly.add(stopTab);
  }

  // Countersunk Stainless M4 Side-Panel Fasteners (matching dwx52di_plus_left_3_4.webp!)
  const sideScrewGeo = trackGeo(new THREE.CylinderGeometry(0.038, 0.038, 0.016, 14));
  const screwCoords = [
    [6.85, +1.85], [5.40, -2.85], [2.45, +2.65], [1.75, +2.25], [1.52, +2.82], [0.85, -2.85]
  ];
  for (const [sy, sz] of screwCoords) {
    for (const sideSign of [-1, +1]) {
      const sc = new THREE.Mesh(sideScrewGeo, matAtcStainless);
      sc.rotation.z = Math.PI * 0.5;
      sc.position.set(sideSign * 2.966, sy, sz);
      outerCabinetAssembly.add(sc);
    }
  }

  // Internal Upper Counterweight & Rail Guide Tower (revealed behind the window when cover slides open in side-or-1.webp!)
  const railTowerGroup = new THREE.Group();
  railTowerGroup.name = 'internalCounterweightTower';
  railTowerGroup.position.set(-0.28, 7.35, 1.98);
  railTowerGroup.rotation.x = frontRakeRad;

  // Plate with 3 circular lightening cutouts (matching side-or-1.webp & side-or-2.webp!)
  const towerOuterXY = [[-1.95, 0.0], [+1.55, 0.0], [+1.55, 2.35], [-1.95, 2.35]];
  const towerHoles = [];
  for (const hx of [-1.08, -0.20, +0.68]) {
    const circlePts = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      circlePts.push([hx + Math.cos(a) * 0.34, 1.48 + Math.sin(a) * 0.34]);
    }
    towerHoles.push(circlePts.reverse());
  }
  const towerPlateGeo = trackGeo(createPanelWithHolesZ(THREE, towerOuterXY, towerHoles, -0.18, -0.06, 0.008));
  railTowerGroup.add(new THREE.Mesh(towerPlateGeo, matCabinetPearl));

  // Vertical cooling louver slots along base of counterweight tower (visible in side-or-1.webp!)
  const louverBarGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.52, 0.04));
  for (let i = 0; i < 24; i++) {
    const bar = new THREE.Mesh(louverBarGeo, matCabinetPearl);
    bar.position.set(-1.55 + i * 0.12, 0.42, -0.12);
    railTowerGroup.add(bar);
  }
  // Note: railTowerGroup rises dynamically with the sliding cover carriage (hidden inside roof when closed, rises when open!)

  // Lower Raked Front Frame: Lower Silver Cylindrical Columns + Middle Status LED Control Panel
  const lowerRakedGroup = new THREE.Group();
  lowerRakedGroup.name = 'lowerRakedFrontGroup';
  lowerRakedGroup.position.set(0, 0.20, 3.96);
  lowerRakedGroup.rotation.x = frontRakeRad;

  // Lower Left & Right Anodized Brushed-Silver Cylindrical Columns (s = 0.00 .. 2.08, X = ±2.845, R = 0.248 -> reaches X = ±3.093!)
  const lowerColLen = 2.08;
  const colRadius = 0.248;
  const lowerColGeo = trackGeo(new THREE.CylinderGeometry(colRadius, colRadius, lowerColLen, 36));
  const colCapGeo   = trackGeo(new THREE.CylinderGeometry(colRadius * 0.98, colRadius * 0.98, 0.03, 36));

  for (const sx of [-2.845, +2.845]) {
    const col = new THREE.Mesh(lowerColGeo, matSilverColumn);
    col.position.set(sx, lowerColLen * 0.5, -0.06);
    lowerRakedGroup.add(col);

    // Backing cheek block connecting silver cylinder smoothly to side wall
    const cheek = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.36, lowerColLen, 0.34)),
      matSilverColumn
    );
    cheek.position.set(sx - Math.sign(sx) * 0.04, lowerColLen * 0.5, -0.22);
    lowerRakedGroup.add(cheek);

    const topCap = new THREE.Mesh(colCapGeo, matBilletAluminum);
    topCap.position.set(sx, lowerColLen + 0.005, -0.06);
    lowerRakedGroup.add(topCap);
  }

  // Middle Status LED & Halo Power Control Panel (s = 1.32 .. 2.08, X = [-2.59, +2.59])
  const ctrlBacking = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.18, 0.76, 0.24)),
    matFrontWhite
  );
  ctrlBacking.position.set(0, 1.70, -0.02);
  lowerRakedGroup.add(ctrlBacking);

  const ctrlFace = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(5.16, 0.74)),
    matControlStrip
  );
  ctrlFace.position.set(0, 1.70, 0.105);
  lowerRakedGroup.add(ctrlFace);

  outerCabinetAssembly.add(lowerRakedGroup);
  productRoot.add(outerCabinetAssembly);

  // ==================== 3. PULL-OUT DUST COLLECTION DRAWER ("DWX-52Di Plus" + Green Arc) ====================
  const dustDrawerAssembly = new THREE.Group();
  dustDrawerAssembly.name = 'dustDrawerAssembly';

  const drawerRakedGroup = new THREE.Group();
  drawerRakedGroup.position.set(0, 0.20, 3.96);
  drawerRakedGroup.rotation.x = frontRakeRad;

  // Molded front panel of dust drawer: s = 0.01 .. 1.29, X = [-2.58, +2.58]
  const drwBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.15, 1.27, 0.24)),
    matFrontWhite
  );
  drwBody.position.set(0, 0.65, -0.02);
  drawerRakedGroup.add(drwBody);

  const drwFace = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(5.13, 1.25)),
    matDrawerFront
  );
  drwFace.position.set(0, 0.65, 0.105);
  drawerRakedGroup.add(drwFace);

  dustDrawerAssembly.add(drawerRakedGroup);

  // Horizontal internal dust-collection tray pan extending back into base chassis
  const drwTrayBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.85, 0.68, 3.80)),
    matCabinetPearl
  );
  drwTrayBox.position.set(0, 0.68, 1.85);
  dustDrawerAssembly.add(drwTrayBox);

  const drwCavity = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.45, 0.12, 3.40)),
    matRearCharcoal
  );
  drwCavity.position.set(0, 1.03, 1.85);
  dustDrawerAssembly.add(drwCavity);

  productRoot.add(dustDrawerAssembly);

  // ==================== 4. MOTORIZED/SLIDING UPPER FRONT COVER & SILVER COLUMNS ====================
  const slidingCoverAssembly = new THREE.Group();
  slidingCoverAssembly.name = 'slidingCoverAssembly';
  slidingCoverAssembly.position.set(0, 0.20, 3.96);
  slidingCoverAssembly.rotation.x = frontRakeRad;

  // Upper Left & Right Anodized Silver Cylindrical Columns (s = 2.11 .. 7.26, length = 5.15 u)
  // Glides straight up along the 10.2 deg rail WITH the front cover (matching side-or-1.webp & side-or-2.webp!)
  const upperColLen = 5.15;
  const upperColGeo = trackGeo(new THREE.CylinderGeometry(colRadius, colRadius, upperColLen, 36));
  for (const sx of [-2.845, +2.845]) {
    const uCol = new THREE.Mesh(upperColGeo, matSilverColumn);
    uCol.position.set(sx, 2.11 + upperColLen * 0.5, -0.06);
    slidingCoverAssembly.add(uCol);

    const uCheek = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.36, upperColLen, 0.34)),
      matSilverColumn
    );
    uCheek.position.set(sx - Math.sign(sx) * 0.04, 2.11 + upperColLen * 0.5, -0.22);
    slidingCoverAssembly.add(uCheek);

    const topCap = new THREE.Mesh(colCapGeo, matBilletAluminum);
    topCap.position.set(sx, 2.11 + upperColLen + 0.01, -0.06);
    slidingCoverAssembly.add(topCap);

    const botCap = new THREE.Mesh(colCapGeo, matBilletAluminum);
    botCap.position.set(sx, 2.11 - 0.01, -0.06);
    slidingCoverAssembly.add(botCap);
  }

  // White Front Cover Sheet with Authentic Left-Shifted Viewing Window Aperture!
  // Cover X = [-2.60, +2.60], s = [2.11, 7.26]
  // Window Aperture (from exact pixel measurement of user photo): X = [-1.99, +1.35], s = [2.72, 6.02]
  const coverOuterXY = [
    [-2.60, 2.11],
    [+2.60, 2.11],
    [+2.60, 7.26],
    [-2.60, 7.26]
  ];
  const coverWinHoleXY = [
    [-1.99, 2.72],
    [+1.35, 2.72],
    [+1.35, 6.02],
    [-1.99, 6.02]
  ];

  const frontDoorGeo = trackGeo(createPanelWithHolesZ(THREE, coverOuterXY, [coverWinHoleXY], -0.14, +0.095, 0.015));
  slidingCoverAssembly.add(new THREE.Mesh(frontDoorGeo, matFrontWhite));

  // Anti-static clear acrylic viewing window pane inside the cover aperture
  const winPane = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.38, 3.34, 0.04)),
    matClearWindow
  );
  winPane.position.set((-1.99 + 1.35) * 0.5, (2.72 + 6.02) * 0.5, 0.02);
  slidingCoverAssembly.add(winPane);

  // Upper-Center "DGSHAPE" Prism Logo + Wordmark (centered on full cover above window, matching user photo!)
  const dgLogoPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.62, 0.40)),
    matDgshapeLogo
  );
  dgLogoPlane.position.set(-0.12, 6.56, 0.114);
  slidingCoverAssembly.add(dgLogoPlane);

  // Bottom-Right "Access to Manual / マニュアルはこちら" QR Code Sticker (matching user photo!)
  const qrStickerPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.56, 0.62)),
    matManualQr
  );
  qrStickerPlane.position.set(2.02, 2.66, 0.114);
  slidingCoverAssembly.add(qrStickerPlane);

  // Telescoping rear spindle/counterweight tower sits at Z = +1.35 inside upper cabinet when closed,
  // and rises behind the raised window when coverOpen > 0 (matching BOTH closed user photo & open side-or-1.webp!)
  railTowerGroup.position.set(-0.25, 5.05, 1.45);
  railTowerGroup.rotation.set(frontRakeRad, 0, 0);
  outerCabinetAssembly.add(railTowerGroup);

  productRoot.add(slidingCoverAssembly);

  // ==================== 5. SEALED DRY-MILLING CHAMBER, IONIZER, X/Z GANTRY & ZS-52D SPINDLE ====================
  const chamberAndSpindleAssembly = new THREE.Group();
  chamberAndSpindleAssembly.name = 'chamberAndSpindleAssembly';

  // Right-Side Interior Electronics/ATC Shroud Panel (X = [+1.12, +2.58], revealed when cover opens in side-or-1.webp!)
  const rightShroudGroup = new THREE.Group();
  rightShroudGroup.position.set(0, 0.20, 3.96);
  rightShroudGroup.rotation.x = frontRakeRad;

  const rightShroudFace = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.44, 5.12, 0.18)),
    matCabinetPearl
  );
  rightShroudFace.position.set(1.86, 4.66, -0.32);
  rightShroudGroup.add(rightShroudFace);

  // Yellow Triangle Pinch Warning + Red No-Touch Sticker on bottom-left of right shroud (matching side-or-1.webp!)
  const hazardDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.58, 0.33)),
    matHazardSticker
  );
  hazardDecal.position.set(1.52, 2.38, -0.225);
  rightShroudGroup.add(hazardDecal);

  // Vertical dark linear guide track slots on left & right of chamber opening
  for (const rx of [-2.52, +2.54]) {
    const railSlot = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.06, 5.05, 0.08)),
      matRubberFoot
    );
    railSlot.position.set(rx, 4.66, -0.28);
    rightShroudGroup.add(railSlot);
  }
  chamberAndSpindleAssembly.add(rightShroudGroup);

  // Bright White Sealed Dry-Milling Chamber with exact 10.2 deg sloped front doorway edge!
  // At Y = 2.22: Z_front_doorway = 3.52; at Y = 7.18: Z_front_doorway = 2.62; rear wall Z = -0.22
  const chWallProfileZY = [
    [ 3.52, 2.22],
    [ 2.62, 7.18],
    [-0.22, 7.18],
    [-0.22, 2.22]
  ];
  // Left chamber wall
  chamberAndSpindleAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, chWallProfileZY, -2.56, -2.42, true, true)),
    matChamberWhite
  ));
  // Right chamber divider wall (separating chamber from right-hand ATC/electronics bay)
  chamberAndSpindleAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, chWallProfileZY, +1.12, +1.24, true, true)),
    matChamberWhite
  ));
  // Chamber floor
  const chFloor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.76, 0.14, 3.76)),
    matChamberWhite
  );
  chFloor.position.set(-0.68, 2.22, 1.64);
  chamberAndSpindleAssembly.add(chFloor);
  // Chamber ceiling (Z = -0.22 .. +2.62)
  const chCeil = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.76, 0.14, 2.84)),
    matChamberWhite
  );
  chCeil.position.set(-0.68, 7.14, 1.20);
  chamberAndSpindleAssembly.add(chCeil);
  // Chamber rear bulkhead wall
  const chBackWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.76, 4.96, 0.16)),
    matChamberWhite
  );
  chBackWall.position.set(-0.68, 4.68, -0.22);
  chamberAndSpindleAssembly.add(chBackWall);

  // Rear-Chamber 5-Slot Oval Dust-Extraction Vacuum Grille (matching t-3.jpg & t-5.png!)
  const slotWidths = [0.62, 0.88, 0.96, 0.88, 0.62];
  for (let i = 0; i < 5; i++) {
    const vacSlot = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(slotWidths[i], 0.065, 0.04)),
      matRubberFoot
    );
    vacSlot.position.set(-1.12, 2.75 + i * 0.12, -0.125);
    chamberAndSpindleAssembly.add(vacSlot);
  }

  // Left Chamber Wall Details: Black Cylindrical Damper + 6-LED Status Light Strip + White Static Ionizer Nozzle!
  // (Matching dwx52di_plus_left_3_4.webp & side-or-1.webp!)
  const leftDamper = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 20)),
    matRubberFoot
  );
  leftDamper.rotation.z = Math.PI * 0.5;
  leftDamper.position.set(-2.36, 4.02, 2.75);
  chamberAndSpindleAssembly.add(leftDamper);

  // 6-LED Status Light Bar (Standby White -> Active Milling Electric Blue!)
  const ledStripHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.05, 0.12, 0.78)),
    matAtcStainless
  );
  ledStripHousing.position.set(-2.43, 3.68, 2.38);
  chamberAndSpindleAssembly.add(ledStripHousing);

  const ledEmitterGeo = trackGeo(new THREE.SphereGeometry(0.035, 12, 12));
  for (let i = 0; i < 6; i++) {
    const emitter = new THREE.Mesh(ledEmitterGeo, matChamberStatusLeds);
    emitter.position.set(-2.40, 3.68, 2.08 + i * 0.12);
    chamberAndSpindleAssembly.add(emitter);
  }

  // White Static-Eliminating Ionizer Nozzle on Left Wall
  const ionizerNozzle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.08, 0.10, 0.28, 18)),
    matFrontWhite
  );
  ionizerNozzle.rotation.z = Math.PI * 0.5;
  ionizerNozzle.position.set(-2.34, 3.64, 1.58);
  chamberAndSpindleAssembly.add(ionizerNozzle);

  // Upper Stepped White X-Axis Gantry Cover + Dark Slotted Track Strip (visible right through window in user photo!)
  const upperHoodStep = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.64, 1.35, 1.55)),
    matChamberWhite
  );
  upperHoodStep.position.set(-0.68, 5.75, 0.65);
  chamberAndSpindleAssembly.add(upperHoodStep);

  const gantryLip = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.64, 0.42, 1.85)),
    matChamberWhite
  );
  gantryLip.position.set(-0.68, 4.32, 0.85);
  chamberAndSpindleAssembly.add(gantryLip);

  // Iconic horizontal row of dark track teeth across gantry lip (clearly visible in user's front photo!)
  const toothGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.08, 0.04));
  for (let i = 0; i < 22; i++) {
    const tooth = new THREE.Mesh(toothGeo, matRubberFoot);
    tooth.position.set(-1.95 + i * 0.11, 4.18, 1.78);
    chamberAndSpindleAssembly.add(tooth);
  }

  // Moving X/Z Spindle Carriage + User-Replaceable ZS-52D 30,000 rpm Brushless DC Spindle!
  const spindleCarriageGroup = new THREE.Group();
  spindleCarriageGroup.name = 'zs52dSpindleCarriage';
  spindleCarriageGroup.position.set(-0.88, 4.35, 1.55);

  const spindleBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.26, 0.24, 0.62, 28)),
    matBilletAluminum
  );
  spindleBody.position.set(0, 0.08, 0);
  spindleCarriageGroup.add(spindleBody);

  const spindleNose = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.12, 0.095, 0.24, 24)),
    matAtcStainless
  );
  spindleNose.position.set(0, -0.32, 0);
  spindleCarriageGroup.add(spindleNose);

  const activeMillingBur = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.014, 0.44, 14)),
    matCarbideBur
  );
  activeMillingBur.position.set(0, -0.62, 0);
  spindleCarriageGroup.add(activeMillingBur);

  chamberAndSpindleAssembly.add(spindleCarriageGroup);

  // Interior Chamber PointLight (switches smoothly between Standby White and Active Milling Electric Blue!)
  const chamberLight = new THREE.PointLight(0xf4f8ff, 1.55, 6.8, 1.4);
  chamberLight.position.set(-1.15, 5.15, 2.35);
  chamberAndSpindleAssembly.add(chamberLight);

  productRoot.add(chamberAndSpindleAssembly);

  // ==================== 6. 15-STATION AUTOMATIC TOOL CHANGER (ATC) & COILED SPIRAL HOSE ====================
  const atcAndHoseAssembly = new THREE.Group();
  atcAndHoseAssembly.name = 'atcAndHoseAssembly';

  // Positioned at X = +0.58, Y = 3.55, Z = 1.95 so the stainless ATC box with 3x3 front slots + top burs
  // and coiled white hose beneath it match the right side of the window in the user's photo!
  const atcGroup = new THREE.Group();
  atcGroup.name = 'fifteenStationAtc';
  atcGroup.position.set(0.56, 3.66, 1.92);

  // Brushed stainless-steel 15-station magazine housing box
  const atcBox = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.84, 0.56, 1.28)),
    matAtcStainless
  );
  atcGroup.add(atcBox);

  // Raised thin side-guard flanges along left & right of ATC top deck (matching t-3.jpg!)
  for (const fx of [-0.41, +0.41]) {
    const flange = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.025, 0.14, 1.28)),
      matAtcStainless
    );
    flange.position.set(fx, 0.34, 0);
    atcGroup.add(flange);
  }

  // Front horizontal louver vents on ATC face (3 cols x 3 rows, clearly visible in user's front photo!)
  const atcVentGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.025, 0.02));
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) {
      const v = new THREE.Mesh(atcVentGeo, matRubberFoot);
      v.position.set(-0.24 + c * 0.24, -0.18 + r * 0.07, 0.645);
      atcGroup.add(v);
    }
  }

  // 15 Numbered Bur Stations (3 cols x 5 rows) with Golden-Bronze Collet Rings + 4 mm Carbide Burs + Central Calibration Post!
  // (Exact layout from DWX-52Di_photo_inside.jpg t-3.jpg!)
  const colletRingGeo = trackGeo(new THREE.CylinderGeometry(0.082, 0.082, 0.05, 18));
  const burPinGeo     = trackGeo(new THREE.CylinderGeometry(0.024, 0.020, 0.34, 12));

  for (let row = 0; row < 5; row++) {
    // Notice gap in middle for central calibration cylinder (matching t-3.jpg!)
    const rz = 0.50 - row * 0.23 - (row >= 3 ? 0.10 : 0.0);
    for (let col = 0; col < 3; col++) {
      const cx = -0.24 + col * 0.24;
      const ring = new THREE.Mesh(colletRingGeo, matBronzeCollet);
      ring.position.set(cx, 0.305, rz);
      atcGroup.add(ring);

      const bur = new THREE.Mesh(burPinGeo, matCarbideBur);
      bur.position.set(cx, 0.45 + ((row + col) % 3) * 0.03, rz);
      atcGroup.add(bur);
    }
  }

  // Central cylindrical calibration boss + rear conical tool-length touch sensor (matching t-3.jpg!)
  const calBoss = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.14, 20)),
    matBilletAluminum
  );
  calBoss.position.set(0, 0.35, -0.02);
  atcGroup.add(calBoss);

  const burSensorCone = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.085, 0.10, 20)),
    matBilletAluminum
  );
  burSensorCone.position.set(0.11, 0.33, -0.54);
  atcGroup.add(burSensorCone);

  atcAndHoseAssembly.add(atcGroup);

  // Iconic Coiled White Spiral Umbilical Hose hanging in graceful J-curve below right side of ATC into rotary housing!
  // (Clearly visible in user's front photo, side-or-1.webp, and t-3.jpg!)
  const hoseCurvePts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const hx = 1.02 - 0.88 * Math.pow(t, 1.35);
    const hy = 3.52 - 0.92 * Math.sin(t * Math.PI * 0.82) - 0.18 * t;
    const hz = 2.18 + 0.12 * Math.sin(t * Math.PI);
    hoseCurvePts.push(new THREE.Vector3(hx, hy, hz));
  }
  const hoseCurve = new THREE.CatmullRomCurve3(hoseCurvePts);
  const hoseTubeGeo = trackGeo(new THREE.TubeGeometry(hoseCurve, 28, 0.075, 14, false));
  atcAndHoseAssembly.add(new THREE.Mesh(hoseTubeGeo, matSpiralHose));

  // Spiral corrugation rings along the coiled white hose for crisp studio realism!
  const hoseRingGeo = trackGeo(new THREE.TorusGeometry(0.088, 0.024, 10, 18));
  for (let i = 1; i <= 13; i++) {
    const u = i / 14;
    const pt = hoseCurve.getPoint(u);
    const tan = hoseCurve.getTangent(u);
    const ring = new THREE.Mesh(hoseRingGeo, matSpiralHose);
    ring.position.copy(pt);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    atcAndHoseAssembly.add(ring);
  }

  // Black rubber strain-relief boot where spiral hose enters right chamber bulkhead (matching t-3.jpg!)
  const hoseBoot = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.22, 18)),
    matRubberFoot
  );
  hoseBoot.rotation.z = Math.PI * 0.5;
  hoseBoot.position.set(1.06, 3.55, 2.18);
  atcAndHoseAssembly.add(hoseBoot);

  productRoot.add(atcAndHoseAssembly);

  // ==================== 7. 5-AXIS B/A ROTARY BLOCK, BILLET C-CLAMP & 98.5 MM ZIRCONIA DISC ====================
  const fiveAxisClampAssembly = new THREE.Group();
  fiveAxisClampAssembly.name = 'fiveAxisClampAssembly';

  // Positioned at X = -0.62, Y = 3.05, Z = 2.42 so the chamfered white front B/A drive box sits
  // right in the lower-center of the window (100% matching user's front photo & side-or-1.webp!)
  const bTiltGroup = new THREE.Group();
  bTiltGroup.name = 'bAxisRotaryGroup';
  bTiltGroup.position.set(-0.62, 3.08, 2.45);

  // Chamfered White Sheet-Metal Front Rotary Drive Box (visible right through window in user photo!)
  const rotBoxProfileZY = [
    [ 0.52, -0.44],
    [ 0.52,  0.26],
    [ 0.36,  0.42],
    [-0.36,  0.42],
    [-0.36, -0.44]
  ];
  bTiltGroup.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, rotBoxProfileZY, -0.62, +0.62, true, true)),
    matFrontWhite
  ));

  // Machined Silver Aluminum L-Arm & Open C-Clamp extending rearward from rotary box (matching t-3.jpg!)
  const aRotateGroup = new THREE.Group();
  aRotateGroup.name = 'aAxisCClampGroup';
  aRotateGroup.position.set(0, 0.36, -0.92);

  // Right-side machined aluminum support spine connecting front rotary box to C-Clamp
  const clampSpine = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.16, 1.48)),
    matBilletAluminum
  );
  clampSpine.position.set(0.58, 0, 0.12);
  aRotateGroup.add(clampSpine);

  // Precision Billet Aluminum Open C-Clamp Arch (open on left for 90-degree anterior milling — matching t-3.jpg!)
  const cClampOuter = new THREE.Shape();
  cClampOuter.absarc(0, 0, 0.78, -Math.PI * 0.62, Math.PI * 0.62, false);
  cClampOuter.absarc(0, 0, 0.615, Math.PI * 0.62, -Math.PI * 0.62, true);
  cClampOuter.closePath();

  const cClampGeo = trackGeo(new THREE.ExtrudeGeometry(cClampOuter, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2
  }));
  cClampGeo.rotateX(-Math.PI * 0.5);
  cClampGeo.translate(0, -0.09, 0);
  aRotateGroup.add(new THREE.Mesh(cClampGeo, matBilletAluminum));

  // Two M6 stainless socket-head locking screws on the DWX-52Di Plus fixed C-Clamp (matching t-3.jpg!)
  const m6ScrewGeo = trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.06, 16));
  for (const sa of [-1.25, +1.25]) {
    const sc = new THREE.Mesh(m6ScrewGeo, matAtcStainless);
    sc.position.set(Math.cos(sa) * 0.69, 0.12, Math.sin(sa) * 0.69);
    aRotateGroup.add(sc);
  }

  // 98.5 mm Ivory Zirconia CAD/CAM Disc with Milled Multi-Unit Dental Arch & Support Sprues!
  const discOuter = new THREE.Shape();
  discOuter.absarc(0, 0, 0.612, 0, Math.PI * 2, false);
  const discPocket = new THREE.Path();
  discPocket.absarc(-0.04, 0, 0.41, 0, Math.PI * 2, true);
  discOuter.holes.push(discPocket);

  const zircDiscGeo = trackGeo(new THREE.ExtrudeGeometry(discOuter, {
    depth: 0.22,
    bevelEnabled: false
  }));
  zircDiscGeo.rotateX(-Math.PI * 0.5);
  zircDiscGeo.translate(0, -0.11, 0);
  aRotateGroup.add(new THREE.Mesh(zircDiscGeo, matZirconiaBlank));

  // Milled 10-unit Zirconia Bridge Arch + Sinter Support Pins suspended inside the 98.5 mm disc
  const milledBridge = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.25, 0.056, 12, 28, Math.PI * 1.4)),
    matZirconiaBlank
  );
  milledBridge.rotation.x = Math.PI * 0.5;
  milledBridge.rotation.z = Math.PI * 0.30;
  milledBridge.position.set(-0.04, 0, 0);
  aRotateGroup.add(milledBridge);

  const spruePinGeo = trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.20, 8));
  for (const pa of [-1.7, -0.8, 0.1, 1.0, 1.9]) {
    const pin = new THREE.Mesh(spruePinGeo, matZirconiaBlank);
    pin.rotation.z = Math.PI * 0.5;
    pin.rotation.y = pa;
    pin.position.set(-0.04 + Math.cos(pa) * 0.33, 0, Math.sin(pa) * 0.33);
    aRotateGroup.add(pin);
  }

  bTiltGroup.add(aRotateGroup);
  fiveAxisClampAssembly.add(bTiltGroup);
  productRoot.add(fiveAxisClampAssembly);

  // Enable shadows across all opaque meshes
  productRoot.traverse((obj) => {
    if (obj.isMesh && !obj.material.transparent) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // ==================== INTERACTIVE COVER, 5-AXIS MILLING & EXPLODE API ====================
  let coverOpen = 0;
  let explodeFactor = 0;
  let millBlend = 0;
  let millSec = 0;

  const colWhite = new THREE.Color(0xf4f8ff);
  const colElectricBlue = new THREE.Color(0x0ea5e9);

  function applyState() {
    const ec = coverOpen * coverOpen * (3 - 2 * coverOpen);
    const ee = explodeFactor * explodeFactor * (3 - 2 * explodeFactor);
    const mb = millBlend;

    // 1. Sliding Upper Front Cover + Silver Columns glide straight upward along the exact 10.2 deg rail vector!
    // (Matches official open-cover studio photos side-or-1.webp & side-or-2.webp!)
    const slideDist = 3.25 * ec;
    slidingCoverAssembly.position.set(
      0,
      0.20 + slideDist * cosR + 0.45 * ee,
      3.96 - slideDist * sinR + 1.45 * ee
    );
    // Telescoping rear guide tower rises out of roof only when cover slides open!
    railTowerGroup.position.set(
      -0.25,
      4.95 + 2.65 * ec,
      1.45 - 0.46 * ec
    );

    // 2. Clean non-colliding separation of all 7 sub-assemblies in Exploded View:
    baseAndRearAssembly.position.set(0, -0.65 * ee, -0.55 * ee);
    outerCabinetAssembly.position.set(0, 0.45 * ee, -0.15 * ee);
    dustDrawerAssembly.position.set(0, -0.25 * ee, 1.55 * ee);
    chamberAndSpindleAssembly.position.set(-0.35 * ee, 0.25 * ee, 0);
    atcAndHoseAssembly.position.set(0.65 * ee, 0.15 * ee, 0.35 * ee);
    fiveAxisClampAssembly.position.set(-0.15 * ee, -0.05 * ee, 0.55 * ee);

    // 3. Simultaneous 5-Axis Dry Milling Kinematics + Multi-Color Status LED Chamber Lighting!
    // When 5-Axis Mill is active, the 6-LED strip & chamber light transition from Standby White to DGSHAPE Electric Blue!
    chamberLight.color.copy(colWhite).lerp(colElectricBlue, mb);
    chamberLight.intensity = 1.55 + 0.75 * Math.max(ec, mb);
    matChamberStatusLeds.emissive.copy(colWhite).lerp(colElectricBlue, mb);
    matChamberStatusLeds.color.copy(colWhite).lerp(colElectricBlue, mb);

    const xOsc = Math.sin(millSec * 2.1) * 0.34 * mb;
    const zOsc = (Math.cos(millSec * 4.2) * 0.11 - 0.10) * mb;
    spindleCarriageGroup.position.set(-0.66 + xOsc, 4.35 + zOsc, 1.53);

    // B-axis ±30° tilt + A-axis ±360° continuous indexing
    bTiltGroup.rotation.z = Math.sin(millSec * 1.35) * 0.38 * mb;
    aRotateGroup.rotation.y = (millSec * 1.20) * mb;
  }

  function setCoverOpenFactor(t) {
    coverOpen = Math.max(0, Math.min(1, t));
    applyState();
  }

  function setExplodeFactor(t) {
    explodeFactor = Math.max(0, Math.min(1, t));
    applyState();
  }

  function setLiveMillCycle(elapsedSec, blend) {
    millSec = elapsedSec;
    millBlend = Math.max(0, Math.min(1, blend));
    applyState();
  }

  function dispose() {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    texs.forEach((t) => t.dispose());
  }

  return {
    productRoot,
    setCoverOpenFactor,
    setExplodeFactor,
    setLiveMillCycle,
    dispose
  };
}

      window.__ProductModel = {
        createDwx52DiPlusProduct: () => createDwx52DiPlusProduct(THREE)
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

window.__registerProductModel();
const __factory = Object.values(window.__ProductModel).find((value) => typeof value === 'function');

/** The machine's record, in the shape the asset library gives its machines. */
export const assets = {
  "dgshape-dwx-52di-plus": { id: "dgshape-dwx-52di-plus", name: "DGSHAPE DWX-52Di Plus", realDimensionsMm: "495 × 660 × 600 mm", createAsset: () => __factory() },
};

/** A viewer holds one machine and nothing else. */
export const extras = {};
