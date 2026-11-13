// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-viewer -- <Viewer.html> --id medit-t500
//
// Source    : Medit_T500_Scanner_Viewer.html  (761,681 bytes)
//             md5 afbd1bce3b5f6c229a09cda4b58469e6 · sha256 fe55590a9772622d5f855035a4060088f546850430f979e66c7e2f7235c56aa5
// Component : <script id="component-2-product-model">
// sha256    : 1c47453446e9c64b4a509180c86a1cf0f69ab20e86f09edd585092348fab94eb
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
// Medit Identica T500 — High-Precision Desktop 3D Dental Lab Scanner
// Calibrated Scale: 1 scene unit = 80 mm
// Official Dimensions: 290 mm (W) x 290 mm (D) x 340 mm (H)
//   => W = 3.625 u, D = 3.625 u, H = 4.250 u, seated at Y = 0.0000
// ============================================================================

function createT500PlanformShape(THREE, halfSpan, cornerCut, rSmall, rChamfer, inset = 0) {
  // 5-sided planform in (x, y_shape = -z_world) so ExtrudeGeometry rotated X = -PI/2 maps:
  //   x_shape -> +X_world (left - to right +)
  //   y_shape -> -Z_world (Wait: when rotated rx = -PI/2:
  //     local (x, y, z) -> world (x, z, -y) !!
  //     So local y = -Z_world => front (+Z_world) is local y = -halfSpan, rear (-Z_world) is local y = +halfSpan!
  //   Let's instead build our own exact outward-normal prism/bevel builder in world (X, Y, Z) so there is ZERO coordinate-flip confusion and 100% crisp split-crease normals!
  return null;
}

// Sample the exact 5-sided rounded-chamfer Medit T500 perimeter in (x, z) counter-clockwise when viewed from +Y (top):
// Corners in (x, z):
//   C0 Back-Left:    (-hw, -hd), radius rSmall
//   C1 Front-Left:   (-hw, +hd), radius rSmall
//   C2 Front-Chamf1: (+hw - cut, +hd), radius rChamf
//   C3 Right-Chamf2: (+hw, +hd - cut), radius rChamf
//   C4 Back-Right:   (+hw, -hd), radius rSmall
// Check CCW winding in (x, z) where outward normals point away from origin:
//   C0(-,-) -> C1(-,+): dx=0, dz=+ -> outward normal (-1, 0): (dz, -dx)? Wait:
//   For edge P_i -> P_{i+1} with tangent (tx, tz):
//     From C0(-1.8,-1.8) to C1(-1.8,+1.8): t = (0, +1). Outward is (-1, 0) = (-tz, tx)!
//     From C1(-1.8,+1.8) to C2(+0.8,+1.8): t = (+1, 0). (-tz, tx) = (0, +1) = +Z (Front)!
//     From C2(+0.8,+1.8) to C3(+1.8,+0.8): t = (+0.707, -0.707). (-tz, tx) = (+0.707, +0.707) = Front-Right!
//     From C3(+1.8,+0.8) to C4(+1.8,-1.8): t = (0, -1). (-tz, tx) = (+1, 0) = +X (Right)!
//     From C4(+1.8,-1.8) to C0(-1.8,-1.8): t = (-1, 0). (-tz, tx) = (0, -1) = -Z (Rear)!
// EVERY SINGLE OUTWARD NORMAL IS (-tz, tx)!!

function buildFilletedPolygon2D(verts, radii, segsPerCorner = 10) {
  const n = verts.length;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const pPrev = verts[(i - 1 + n) % n];
    const pCurr = verts[i];
    const pNext = verts[(i + 1) % n];
    const r = radii[i];

    let v1x = pPrev[0] - pCurr[0], v1z = pPrev[1] - pCurr[1];
    let v2x = pNext[0] - pCurr[0], v2z = pNext[1] - pCurr[1];
    const l1 = Math.hypot(v1x, v1z), l2 = Math.hypot(v2x, v2z);
    v1x /= l1; v1z /= l1;
    v2x /= l2; v2z /= l2;

    const dot = Math.max(-0.999, Math.min(0.999, v1x * v2x + v1z * v2z));
    const halfAng = 0.5 * Math.acos(dot);
    const tanDist = r / Math.tan(halfAng);
    const d = Math.min(tanDist, l1 * 0.45, l2 * 0.45);
    const effR = d * Math.tan(halfAng);

    const t1x = pCurr[0] + v1x * d, t1z = pCurr[1] + v1z * d;
    const t2x = pCurr[0] + v2x * d, t2z = pCurr[1] + v2z * d;

    let bx = v1x + v2x, bz = v1z + v2z;
    const bl = Math.hypot(bx, bz);
    bx /= bl; bz /= bl;
    const centerDist = effR / Math.sin(halfAng);
    const cx = pCurr[0] + bx * centerDist;
    const cz = pCurr[1] + bz * centerDist;

    const a1 = Math.atan2(t1z - cz, t1x - cx);
    let a2 = Math.atan2(t2z - cz, t2x - cx);
    // Ensure shortest angular sweep
    let da = a2 - a1;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;

    const steps = Math.max(2, segsPerCorner);
    for (let s = 0; s <= steps; s++) {
      const a = a1 + da * (s / steps);
      pts.push([cx + Math.cos(a) * effR, cz + Math.sin(a) * effR]);
    }
  }
  return pts;
}

function getT500OuterLoop(offset = 0.0) {
  // Exact 290 x 290 mm = 3.625 x 3.625 u with 77 mm (0.9625 u) front-right chamfer
  // Offset > 0 shrinks inward uniformly along each plane normal!
  const hw = 1.8125 - offset;
  const hd = 1.8125 - offset;
  // Original chamfer line: x + z = (1.8125) + (1.8125 - 0.9625) = 2.6625
  // Shrunk inward along (1/sqrt2, 1/sqrt2) by offset => x + z = 2.6625 - offset * Math.SQRT2
  const cSum = 2.6625 - offset * Math.SQRT2;
  const c1x = cSum - hd; // where z = +hd
  const c2z = cSum - hw; // where x = +hw

  const verts = [
    [-hw, -hd],   // Back-Left
    [-hw, +hd],   // Front-Left
    [c1x, +hd],   // Front-Chamfer start
    [+hw, c2z],   // Chamfer-Right end
    [+hw, -hd],   // Back-Right
  ];
  const rSmall = Math.max(0.015, 0.075 - offset * 0.5);
  const rChamf = Math.max(0.030, 0.280 - offset * 0.7);
  return buildFilletedPolygon2D(verts, [rSmall, rSmall, rChamf, rChamf, rSmall], 10);
}

// Build a crisp split-crease lofted prism from slices: [{ y, loop }] where each loop has equal vertex count M
// Winding of loop: CCW in (x, z) as defined above => P_i -> P_{i+1} has outward 2D normal (-dz, dx)
function createLoftedPolygonGeometry(THREE, slices, capBottom = true, capTop = true) {
  const pos = [];
  const uvs = [];
  const M = slices[0].loop.length;

  function pushTriOutward(ax, ay, az, bx, by, bz, cx, cy, cz, ox, oy, oz) {
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    if (nx * ox + ny * oy + nz * oz >= 0) {
      pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    } else {
      pos.push(ax, ay, az, cx, cy, cz, bx, by, bz);
    }
    uvs.push(0, 0, 1, 0, 1, 1);
  }

  for (let s = 0; s < slices.length - 1; s++) {
    const s0 = slices[s], s1 = slices[s + 1];
    const dy = s1.y - s0.y;
    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M;
      const p00 = s0.loop[i], p01 = s0.loop[j];
      const p10 = s1.loop[i], p11 = s1.loop[j];
      const tx = p01[0] - p00[0], tz = p01[1] - p00[1];
      // Outward 2D normal is (-tz, tx); if shrinking inward as y rises, ny > 0
      const shrink = (Math.hypot(p00[0], p00[1]) - Math.hypot(p10[0], p10[1]));
      const oy = Math.abs(dy) < 1e-6 ? (shrink >= 0 ? 1 : -1) : shrink * 0.5;
      const ox = -tz, oz = tx;
      pushTriOutward(p00[0], s0.y, p00[1], p01[0], s0.y, p01[1], p11[0], s1.y, p11[1], ox, oy, oz);
      pushTriOutward(p00[0], s0.y, p00[1], p11[0], s1.y, p11[1], p10[0], s1.y, p10[1], ox, oy, oz);
    }
  }

  // Caps via Earcut / ShapeGeometry triangulation (supports convex & concave polygons!)
  function addCap(loop, y, ny) {
    const pts2d = loop.map(p => new THREE.Vector2(p[0], p[1]));
    const tris = THREE.ShapeUtils.triangulateShape(pts2d, []);
    for (const [i0, i1, i2] of tris) {
      const a = loop[i0], b = loop[i1], c = loop[i2];
      pushTriOutward(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1], 0, ny, 0);
    }
  }

  if (capBottom) addCap(slices[0].loop, slices[0].y, -1);
  if (capTop) addCap(slices[slices.length - 1].loop, slices[slices.length - 1].y, +1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// L-shaped structural wall loop in (x, z) for the Medit T500 lower/mid body:
// Outer left wall: x = -1.8125 (z from -1.8125 to +1.8125)
// Front of left pillar: z = +1.8125 (x from -1.8125 to -1.0375) -> width = 0.775 u (62 mm)
// Inner left wall: x = -1.0375 (z from +1.8125 back to -1.1875)
// Inner rear wall: z = -1.1875 (x from -1.0375 right to +1.8125)
// Right of rear pillar: x = +1.8125 (z from -1.1875 back to -1.8125) -> depth = 0.625 u (50 mm)
// Outer rear wall: z = -1.8125 (x from +1.8125 left to -1.8125)
function getT500LWallLoop() {
  const hw = 1.8125, hd = 1.8125;
  const inX = -1.0375; // 62 mm left column
  const inZ = -1.1875; // 50 mm rear wall
  const verts = [
    [-hw, -hd],   // 0: Outer Back-Left
    [-hw, +hd],   // 1: Outer Front-Left
    [inX, +hd],   // 2: Front-Left white pillar inner-front corner
    [inX, inZ],   // 3: Inner Bay 90-deg concave corner
    [+hw, inZ],   // 4: Rear-Right white pillar inner-right corner
    [+hw, -hd],   // 5: Outer Back-Right
  ];
  const radii = [0.075, 0.075, 0.032, 0.022, 0.032, 0.075];
  return buildFilletedPolygon2D(verts, radii, 8);
}

// Procedural Canvas Textures
function createIdenticaBadgeTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const ctx = c.getContext('2d');
  // Brushed anodized aluminum plaque background
  const grad = ctx.createLinearGradient(0, 0, 512, 160);
  grad.addColorStop(0, '#d7dce3');
  grad.addColorStop(0.5, '#e6ebf1');
  grad.addColorStop(1, '#c8cfd8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  // Subtle horizontal brush grain
  ctx.strokeStyle = 'rgba(90,100,115,0.08)';
  ctx.lineWidth = 1;
  for (let y = 4; y < 156; y += 3) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }

  // Crisp inner chamfer border
  ctx.strokeStyle = '#7e8692';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  // Authentic Medit "Identica" geometric wordmark
  ctx.fillStyle = '#1f252e';
  ctx.font = '700 76px "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Identica', 256, 83);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createDangerStickerTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 220;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 220);
  ctx.strokeStyle = '#222831';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 502, 210);

  // Left half: Yellow hazard warning panel
  ctx.fillStyle = '#f5cb22';
  ctx.fillRect(14, 14, 186, 192);
  ctx.strokeStyle = '#181c22';
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 14, 186, 192);

  // Warning triangle
  ctx.beginPath();
  ctx.moveTo(107, 38);
  ctx.lineTo(176, 174);
  ctx.lineTo(38, 174);
  ctx.closePath();
  ctx.fillStyle = '#f5cb22';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#15181e';
  ctx.stroke();

  // Moving stage / hand pinch glyph inside triangle
  ctx.fillStyle = '#15181e';
  ctx.fillRect(78, 142, 58, 13);
  ctx.beginPath();
  ctx.arc(107, 114, 15, 0, Math.PI * 2);
  ctx.fill();

  // Right half: Red DANGER header + safety message
  ctx.fillStyle = '#cc2229';
  ctx.fillRect(210, 14, 288, 62);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('! DANGER', 354, 46);

  ctx.fillStyle = '#181d24';
  ctx.font = '700 25px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Hand Hazard', 354, 108);
  ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Keep hands off', 354, 144);
  ctx.fillText('while running', 354, 176);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createMultiDiePlateTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  const cx = 512, cy = 512;

  // Matte anti-slip dark rubberized surface
  ctx.fillStyle = '#1c2026';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle micro-pebble anti-slip grain + structured-light dot matrix shimmer
  for (let i = 0; i < 6000; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 1024;
    const y = (Math.sin(i * 78.233) * 29432.1234 % 1 + 1) % 1 * 1024;
    ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle projected blue structured-light calibration dots near center
  for (let gx = -12; gx <= 12; gx++) {
    for (let gy = -12; gy <= 12; gy++) {
      const px = cx + gx * 26, py = cy + gy * 26;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < 350) {
        const a = (1.0 - dist / 350) * 0.24;
        ctx.fillStyle = `rgba(85, 165, 255, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Outer machined rim highlight
  ctx.strokeStyle = '#323842';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, 488, 0, Math.PI * 2);
  ctx.stroke();

  // Crisp white circular "SCAN CAPTURE AREA" calibration ring (matching real Medit T500 plate!)
  ctx.strokeStyle = 'rgba(226, 234, 244, 0.85)';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 405, 0, Math.PI * 2);
  ctx.stroke();

  // Curved text "SCAN CAPTURE AREA" at back (-Z -> top of texture)
  ctx.save();
  ctx.fillStyle = 'rgba(232, 238, 246, 0.90)';
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = 'SCAN CAPTURE AREA';
  const startAng = -Math.PI / 2 - (label.length - 1) * 0.032 * 0.5;
  for (let i = 0; i < label.length; i++) {
    const ang = startAng + i * 0.032;
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * 380, cy + Math.sin(ang) * 380);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Authentic red index dot at front (+Z -> bottom of texture, y = cy + 452)
  ctx.fillStyle = '#e5252c';
  ctx.beginPath();
  ctx.arc(cx, cy + 452, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a1216';
  ctx.lineWidth = 3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createTouchSensorTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 384;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(0, 0, 256, 384);

  ctx.strokeStyle = '#6c7583';
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 14, 228, 356);

  // Header box "TOUCH HERE"
  ctx.fillStyle = '#454e5c';
  ctx.fillRect(24, 24, 208, 54);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOUCH HERE', 128, 52);

  // Capacitive target concentric rings + stylized finger tap line art
  ctx.strokeStyle = '#2d7ff9';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(128, 175, 42, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(128, 175, 64, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();

  ctx.fillStyle = '#2d7ff9';
  ctx.beginPath(); ctx.arc(128, 175, 14, 0, Math.PI * 2); ctx.fill();

  // Finger silhouette below tapping center
  ctx.strokeStyle = '#485260';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 330);
  ctx.lineTo(128, 200);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(128, 200, 16, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#5c6675';
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('SCAN START', 128, 350);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createRearNameplateTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#242932';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#8b94a3';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '800 34px "Segoe UI", Arial, sans-serif';
  ctx.fillText('MEDIT', 28, 52);
  ctx.font = '600 26px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#9ec5ff';
  ctx.fillText('Identica T500', 165, 52);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 19px "Segoe UI", Arial, sans-serif';
  ctx.fillText('3D Dental Lab Scanner · Blue LED Structured Light', 28, 92);
  ctx.fillText('Input: DC 24V / 6.25A (AC 100-240V, 50/60Hz, 150W)', 28, 126);
  ctx.fillText('Interface: USB 3.0 Type-B   |   Accuracy: < 7 um (ISO 12836)', 28, 158);
  ctx.fillText('S/N: T500-KR-209481        |   Made in Korea · MEDIT Corp.', 28, 190);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText('CE   KC   RoHS   FC', 28, 228);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createMeditT500Product(THREE) {
  const geos = [];
  const mats = [];
  const texs = [];
  const trackGeo = (g) => { geos.push(g); return g; };
  const trackMat = (m) => { mats.push(m); return m; };
  const trackTex = (t) => { texs.push(t); return t; };

  const productRoot = new THREE.Group();
  productRoot.name = 'meditT500Root';

  // ==================== CALIBRATED PBR MATERIALS ====================
  const matWhiteEnclosure = trackMat(new THREE.MeshStandardMaterial({
    name: 't500MatteWhite',
    color: 0xf5f7fa,
    roughness: 0.34,
    metalness: 0.03,
    envMapIntensity: 1.05
  }));

  const matSilverCapAndBase = trackMat(new THREE.MeshStandardMaterial({
    name: 't500SilverBevel',
    color: 0xb2bac6,
    roughness: 0.28,
    metalness: 0.52,
    envMapIntensity: 1.28
  }));

  const matAnodizedArm = trackMat(new THREE.MeshStandardMaterial({
    name: 't500AnodizedSilverArm',
    color: 0xd2d8e2,
    roughness: 0.25,
    metalness: 0.68,
    envMapIntensity: 1.38
  }));

  const matPewterBadgeRim = trackMat(new THREE.MeshStandardMaterial({
    name: 't500PewterBadgeRim',
    color: 0x8e97a6,
    roughness: 0.28,
    metalness: 0.62,
    envMapIntensity: 1.30
  }));

  const matBayGreyWall = trackMat(new THREE.MeshStandardMaterial({
    name: 't500BayInnerGrey',
    color: 0x7d848f,
    roughness: 0.58,
    metalness: 0.08,
    envMapIntensity: 1.0
  }));

  const matBayFloorGrey = trackMat(new THREE.MeshStandardMaterial({
    name: 't500BayFloorGrey',
    color: 0x888f9a,
    roughness: 0.52,
    metalness: 0.12,
    envMapIntensity: 1.05
  }));

  const matDarkMetal = trackMat(new THREE.MeshStandardMaterial({
    name: 't500DarkAnodized',
    color: 0x262b34,
    roughness: 0.38,
    metalness: 0.55,
    envMapIntensity: 1.2
  }));

  const matRubberFoot = trackMat(new THREE.MeshStandardMaterial({
    name: 't500RubberFoot',
    color: 0x23272f,
    roughness: 0.82,
    metalness: 0.05
  }));

  const matBrightChrome = trackMat(new THREE.MeshStandardMaterial({
    name: 't500StainlessFastener',
    color: 0xdce2ea,
    roughness: 0.18,
    metalness: 0.86,
    envMapIntensity: 1.45
  }));

  const matFirstSurfaceMirror = trackMat(new THREE.MeshStandardMaterial({
    name: 't500OpticalMirror',
    color: 0xeef4ff,
    roughness: 0.04,
    metalness: 0.96,
    envMapIntensity: 1.8
  }));

  const matBlueProjectorOptic = trackMat(new THREE.MeshStandardMaterial({
    name: 't500BlueLedLens',
    color: 0x2563eb,
    emissive: 0x1d5eff,
    emissiveIntensity: 1.35,
    roughness: 0.10,
    metalness: 0.20
  }));

  const matCameraLensGlass = trackMat(new THREE.MeshStandardMaterial({
    name: 't500CameraGlass',
    color: 0x18263a,
    emissive: 0x0b1f3a,
    emissiveIntensity: 0.25,
    roughness: 0.08,
    metalness: 0.35,
    envMapIntensity: 1.6
  }));

  const matBlackPlateRim = trackMat(new THREE.MeshStandardMaterial({
    name: 't500BlackMultiDieRim',
    color: 0x232830,
    roughness: 0.34,
    metalness: 0.42,
    envMapIntensity: 1.2
  }));

  const texMultiDieTop = trackTex(createMultiDiePlateTexture(THREE));
  const matMultiDieTop = trackMat(new THREE.MeshStandardMaterial({
    name: 't500MultiDieTopSurface',
    map: texMultiDieTop,
    roughness: 0.58,
    metalness: 0.12
  }));

  const matDentalStone = trackMat(new THREE.MeshStandardMaterial({
    name: 't500GypsumDentalStone',
    color: 0xeadbc8,
    roughness: 0.66,
    metalness: 0.02
  }));

  const matDentalStoneCrown = trackMat(new THREE.MeshStandardMaterial({
    name: 't500GypsumPreparedDie',
    color: 0xf1e5d4,
    roughness: 0.54,
    metalness: 0.03
  }));

  const texIdenticaBadge = trackTex(createIdenticaBadgeTexture(THREE));
  const matIdenticaBadge = trackMat(new THREE.MeshStandardMaterial({
    name: 't500IdenticaBadgeFace',
    map: texIdenticaBadge,
    roughness: 0.28,
    metalness: 0.62
  }));

  const texDangerSticker = trackTex(createDangerStickerTexture(THREE));
  const matDangerSticker = trackMat(new THREE.MeshStandardMaterial({
    name: 't500DangerDecal',
    map: texDangerSticker,
    roughness: 0.42,
    metalness: 0.04
  }));

  const texTouchSensor = trackTex(createTouchSensorTexture(THREE));
  const matTouchSensor = trackMat(new THREE.MeshStandardMaterial({
    name: 't500TouchSensorDecal',
    map: texTouchSensor,
    roughness: 0.38,
    metalness: 0.05
  }));

  const texRearNameplate = trackTex(createRearNameplateTexture(THREE));
  const matRearNameplate = trackMat(new THREE.MeshStandardMaterial({
    name: 't500RearNameplate',
    map: texRearNameplate,
    roughness: 0.42,
    metalness: 0.28
  }));

  const matUsbBlue = trackMat(new THREE.MeshStandardMaterial({
    name: 't500Usb3Blue',
    color: 0x1d6fe8,
    roughness: 0.35,
    metalness: 0.15
  }));

  const matPowerGreen = trackMat(new THREE.MeshStandardMaterial({
    name: 't500PowerSwitchLed',
    color: 0x16a34a,
    emissive: 0x16a34a,
    emissiveIntensity: 0.75,
    roughness: 0.30,
    metalness: 0.10
  }));

  // ==================== 1. BASE PLINTH & SCAN-BAY DECK ====================
  const baseAssembly = new THREE.Group();
  baseAssembly.name = 'baseAssembly';

  // 4 Anti-vibration rubber feet (Y = 0.0000 .. 0.0400)
  const footGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.04, 24));
  const footCoords = [
    [-1.32, -1.32],
    [-1.32, +1.28],
    [+0.68, +1.18],
    [+1.32, -1.32]
  ];
  for (const [fx, fz] of footCoords) {
    const foot = new THREE.Mesh(footGeo, matRubberFoot);
    foot.position.set(fx, 0.02, fz);
    baseAssembly.add(foot);
  }

  // Anodized silver 5-sided chamfered base plinth (Y = 0.040 .. 0.165)
  const baseOuter0 = getT500OuterLoop(0.015);
  const baseOuter1 = getT500OuterLoop(0.000);
  const baseOuter2 = getT500OuterLoop(0.012);
  const basePlinthGeo = trackGeo(createLoftedPolygonGeometry(THREE, [
    { y: 0.040, loop: baseOuter0 },
    { y: 0.055, loop: baseOuter1 },
    { y: 0.150, loop: baseOuter1 },
    { y: 0.165, loop: baseOuter2 }
  ], true, true));
  baseAssembly.add(new THREE.Mesh(basePlinthGeo, matSilverCapAndBase));

  // White perimeter floor rim framing the recessed grey scan-bay deck (Y = 0.165 .. 0.206)
  // Built as a true hollow ring (outer loop minus inner loop) so grey floor sits recessed inside with zero overlap!
  const rimOuter = getT500OuterLoop(0.002);
  const rimInner = getT500OuterLoop(0.115);
  {
    const pos = [], uvs = [];
    const M = rimOuter.length;
    const y0 = 0.165, y1 = 0.206;
    function pushT(ax,ay,az, bx,by,bz, cx,cy,cz, ox,oy,oz) {
      const ux=bx-ax, uy=by-ay, uz=bz-az, vx=cx-ax, vy=cy-ay, vz=cz-az;
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      if (nx*ox+ny*oy+nz*oz >= 0) pos.push(ax,ay,az, bx,by,bz, cx,cy,cz);
      else pos.push(ax,ay,az, cx,cy,cz, bx,by,bz);
      uvs.push(0,0,1,0,1,1);
    }
    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M;
      const o0 = rimOuter[i], o1 = rimOuter[j];
      const n0 = rimInner[i], n1 = rimInner[j];
      const tx = o1[0] - o0[0], tz = o1[1] - o0[1];
      // Outer vertical wall
      pushT(o0[0],y0,o0[1], o1[0],y0,o1[1], o1[0],y1,o1[1], -tz,0,tx);
      pushT(o0[0],y0,o0[1], o1[0],y1,o1[1], o0[0],y1,o0[1], -tz,0,tx);
      // Inner vertical step wall (facing inward: +tz, 0, -tx)
      pushT(n0[0],y0,n0[1], n1[0],y0,n1[1], n1[0],y1,n1[1], +tz,0,-tx);
      pushT(n0[0],y0,n0[1], n1[0],y1,n1[1], n0[0],y1,n0[1], +tz,0,-tx);
      // Top annular rim cap (ny = +1)
      pushT(o0[0],y1,o0[1], o1[0],y1,o1[1], n1[0],y1,n1[1], 0,1,0);
      pushT(o0[0],y1,o0[1], n1[0],y1,n1[1], n0[0],y1,n0[1], 0,1,0);
    }
    const rimRingGeo = trackGeo(new THREE.BufferGeometry());
    rimRingGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    rimRingGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    rimRingGeo.computeVertexNormals();
    baseAssembly.add(new THREE.Mesh(rimRingGeo, matWhiteEnclosure));
  }

  // Recessed Matte Neutral-Grey Scan-Bay Floor Deck (Y = 0.165 .. 0.200, cleanly inside rimInner!)
  const deckLoop = getT500OuterLoop(0.117);
  const deckGeo = trackGeo(createLoftedPolygonGeometry(THREE, [
    { y: 0.165, loop: deckLoop },
    { y: 0.200, loop: deckLoop }
  ], false, true));
  baseAssembly.add(new THREE.Mesh(deckGeo, matBayFloorGrey));

  // Authentic DANGER Hand Hazard Warning Decal on front-right chamfer corner of scan floor
  const dangerDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.66, 0.28)),
    matDangerSticker
  );
  dangerDecal.rotation.x = -Math.PI * 0.5;
  dangerDecal.rotation.z = Math.PI * 0.25; // aligned with 45-deg front-right chamfer!
  dangerDecal.position.set(1.06, 0.207, 1.06);
  baseAssembly.add(dangerDecal);

  productRoot.add(baseAssembly);

  // ==================== 2. L-SHAPED STRUCTURAL BODY & REAR I/O ====================
  const lWallChassis = new THREE.Group();
  lWallChassis.name = 'lWallChassis';

  // Single Watertight 2-Material L-Monocoque Wall (Y = 0.206 .. 3.120):
  // Outer faces + front-left & rear-right pillar faces -> matWhiteEnclosure (group 0)
  // Inner scan-bay left & rear faces -> matBayGreyWall (group 1) -> ZERO double walls!
  {
    const lLoop = getT500LWallLoop();
    const M = lLoop.length;
    const y0 = 0.206, y1 = 3.120;
    const whitePos = [], greyPos = [];

    function pushArr(arr, ax,ay,az, bx,by,bz, cx,cy,cz, ox,oy,oz) {
      const ux=bx-ax, uy=by-ay, uz=bz-az, vx=cx-ax, vy=cy-ay, vz=cz-az;
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      if (nx*ox+ny*oy+nz*oz >= 0) arr.push(ax,ay,az, bx,by,bz, cx,cy,cz);
      else arr.push(ax,ay,az, cx,cy,cz, bx,by,bz);
    }

    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M;
      const p0 = lLoop[i], p1 = lLoop[j];
      const mx = (p0[0] + p1[0]) * 0.5, mz = (p0[1] + p1[1]) * 0.5;
      const tx = p1[0] - p0[0], tz = p1[1] - p0[1];
      // Segment is inside the open scan bay if midpoint is near inner left wall (x ~ -1.0375, z < 1.76)
      // or inner rear wall (z ~ -1.1875, x < 1.76)
      const isInnerBay = (mx > -1.06 && mz < 1.76 && mx < 1.76 && mz > -1.21);
      const target = isInnerBay ? greyPos : whitePos;
      pushArr(target, p0[0],y0,p0[1], p1[0],y0,p1[1], p1[0],y1,p1[1], -tz,0,tx);
      pushArr(target, p0[0],y0,p0[1], p1[0],y1,p1[1], p0[0],y1,p0[1], -tz,0,tx);
    }

    const whiteMeshGeo = trackGeo(new THREE.BufferGeometry());
    whiteMeshGeo.setAttribute('position', new THREE.Float32BufferAttribute(whitePos, 3));
    whiteMeshGeo.computeVertexNormals();
    lWallChassis.add(new THREE.Mesh(whiteMeshGeo, matWhiteEnclosure));

    const greyMeshGeo = trackGeo(new THREE.BufferGeometry());
    greyMeshGeo.setAttribute('position', new THREE.Float32BufferAttribute(greyPos, 3));
    greyMeshGeo.computeVertexNormals();
    lWallChassis.add(new THREE.Mesh(greyMeshGeo, matBayGreyWall));
  }

  const cornerSeam = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.010, 2.914, 0.010)),
    matDarkMetal
  );
  cornerSeam.position.set(-1.032, (0.206 + 3.120) * 0.5, -1.182);
  lWallChassis.add(cornerSeam);

  // Concave corner gusset fillets at top of front-left pillar & rear-right pillar where arch meets canopy
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(0, 0);
  gussetShape.lineTo(0.11, 0);
  gussetShape.quadraticCurveTo(0.015, 0.015, 0, 0.11);
  gussetShape.closePath();
  const gussetFrontGeo = trackGeo(new THREE.ExtrudeGeometry(gussetShape, { depth: 0.075, bevelEnabled: false }));
  // Rotate so X goes +X (into bay from -1.035), Y goes -Y (down from 3.120)
  const frontGusset = new THREE.Mesh(gussetFrontGeo, matWhiteEnclosure);
  frontGusset.scale.set(1, -1, 1);
  frontGusset.position.set(-1.0375, 3.120, 1.736);
  lWallChassis.add(frontGusset);

  const rightGusset = new THREE.Mesh(gussetFrontGeo, matWhiteEnclosure);
  rightGusset.rotation.y = -Math.PI * 0.5;
  rightGusset.scale.set(1, -1, 1);
  rightGusset.position.set(1.811, 3.120, -1.1875);
  lWallChassis.add(rightGusset);

  //Rear I/O Panel on Z = -1.8125 (USB 3.0 Type-B blue port, Rocker Power Switch, DC/AC Power, Serial Nameplate, Vents)
  const rearIoGroup = new THREE.Group();
  rearIoGroup.name = 'rearIoPanel';

  const ioPlate = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.52, 0.68, 0.022)),
    matDarkMetal
  );
  ioPlate.position.set(0.26, 0.64, -1.824);
  rearIoGroup.add(ioPlate);

  // 4 stainless M3 corner screws on rear I/O plate
  const m3ScrewGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.016, 14));
  for (const [sx, sy] of [[-0.68, -0.26], [0.68, -0.26], [-0.68, 0.26], [0.68, 0.26]]) {
    const sc = new THREE.Mesh(m3ScrewGeo, matBrightChrome);
    sc.rotation.x = Math.PI * 0.5;
    sc.position.set(0.26 + sx, 0.64 + sy, -1.838);
    rearIoGroup.add(sc);
  }

  // Rocker power switch (per Medit T500 manual: "Turn on the power switch on the back of Medit 3D scanner")
  const swBezel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.30, 0.032)), matRubberFoot);
  swBezel.position.set(-0.20, 0.64, -1.838);
  rearIoGroup.add(swBezel);

  const swRocker = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.21, 0.035)), matPowerGreen);
  swRocker.rotation.x = -0.16;
  swRocker.position.set(-0.20, 0.64, -1.852);
  rearIoGroup.add(swRocker);

  // DC 24V / Power barrel / DIN socket
  const dcBarrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.035, 20)), matBrightChrome);
  dcBarrel.rotation.x = Math.PI * 0.5;
  dcBarrel.position.set(0.22, 0.64, -1.840);
  rearIoGroup.add(dcBarrel);

  const dcHole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.062, 0.062, 0.038, 18)), matRubberFoot);
  dcHole.rotation.x = Math.PI * 0.5;
  dcHole.position.set(0.22, 0.64, -1.844);
  rearIoGroup.add(dcHole);

  const dcPin = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.042, 12)), matBrightChrome);
  dcPin.rotation.x = Math.PI * 0.5;
  dcPin.position.set(0.22, 0.64, -1.848);
  rearIoGroup.add(dcPin);

  // USB 3.0 Type-B port (blue insulator tongue per Medit T500 spec!)
  const usbBShell = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.20, 0.22, 0.034)), matBrightChrome);
  usbBShell.position.set(0.64, 0.64, -1.840);
  rearIoGroup.add(usbBShell);

  const usbBCavity = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.17, 0.037)), matRubberFoot);
  usbBCavity.position.set(0.64, 0.64, -1.844);
  rearIoGroup.add(usbBCavity);

  const usbBBlueCore = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.095, 0.095, 0.040)), matUsbBlue);
  usbBBlueCore.position.set(0.64, 0.65, -1.848);
  rearIoGroup.add(usbBBlueCore);

  // Rear Serial & Rating Nameplate
  const rearNameplate = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.16, 0.58)), matRearNameplate);
  rearNameplate.rotation.y = Math.PI;
  rearNameplate.position.set(-1.08, 0.64, -1.825);
  rearIoGroup.add(rearNameplate);

  // Upper Rear Thermal Exhaust Louvers (10 precision horizontal slots for optical projector heat dissipation)
  const louverGeo = trackGeo(new THREE.BoxGeometry(1.48, 0.026, 0.016));
  for (let i = 0; i < 9; i++) {
    const lv = new THREE.Mesh(louverGeo, matDarkMetal);
    lv.position.set(0.0, 2.38 + i * 0.068, -1.822);
    rearIoGroup.add(lv);
  }

  // Exterior Left Wall subtle vertical service panel seam & lower cooling slots
  const leftVentGeo = trackGeo(new THREE.BoxGeometry(0.016, 0.024, 0.88));
  for (let i = 0; i < 6; i++) {
    const lv = new THREE.Mesh(leftVentGeo, matDarkMetal);
    lv.position.set(-1.822, 0.48 + i * 0.062, 0.0);
    rearIoGroup.add(lv);
  }

  lWallChassis.add(rearIoGroup);
  productRoot.add(lWallChassis);

  // ==================== 3. CANTILEVERED UPPER CANOPY, SILVER TOP CAP & OPTICAL ENGINE ====================
  const upperCanopyAssembly = new THREE.Group();
  upperCanopyAssembly.name = 'upperCanopyAssembly';

  // Cantilevered Matte-White 5-Sided Upper Canopy (Y = 3.120 .. 4.075, 76.4 mm tall)
  // Built with capBottom = false + clean annular underside border rim so recessed grey ceiling (Y = 3.140) has ZERO coplanar overlap!
  const canopyLoop0 = getT500OuterLoop(0.000);
  const canopyLoopIn = getT500OuterLoop(0.115);
  const canopyLoopTop = getT500OuterLoop(0.010);
  const canopyGeo = trackGeo(createLoftedPolygonGeometry(THREE, [
    { y: 3.120, loop: canopyLoop0 },
    { y: 3.600, loop: canopyLoop0 },
    { y: 4.060, loop: canopyLoop0 },
    { y: 4.075, loop: canopyLoopTop }
  ], false, true));
  upperCanopyAssembly.add(new THREE.Mesh(canopyGeo, matWhiteEnclosure));

  // Underside white perimeter rim + 1.6 mm upward step into recessed grey optical ceiling
  {
    const pos = [], uvs = [];
    const M = canopyLoop0.length;
    const y0 = 3.120, y1 = 3.140;
    function pushC(ax,ay,az, bx,by,bz, cx,cy,cz, ox,oy,oz) {
      const ux=bx-ax, uy=by-ay, uz=bz-az, vx=cx-ax, vy=cy-ay, vz=cz-az;
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      if (nx*ox+ny*oy+nz*oz >= 0) pos.push(ax,ay,az, bx,by,bz, cx,cy,cz);
      else pos.push(ax,ay,az, cx,cy,cz, bx,by,bz);
      uvs.push(0,0,1,0,1,1);
    }
    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M;
      const o0 = canopyLoop0[i], o1 = canopyLoop0[j];
      const n0 = canopyLoopIn[i], n1 = canopyLoopIn[j];
      const tx = o1[0] - o0[0], tz = o1[1] - o0[1];
      // Bottom annular white cap (facing -Y)
      pushC(o0[0],y0,o0[1], o1[0],y0,o1[1], n1[0],y0,n1[1], 0,-1,0);
      pushC(o0[0],y0,o0[1], n1[0],y0,n1[1], n0[0],y0,n0[1], 0,-1,0);
      // Inner vertical step wall from y0=3.120 up to y1=3.140 (facing inward: +tz, 0, -tx)
      pushC(n0[0],y0,n0[1], n1[0],y0,n1[1], n1[0],y1,n1[1], +tz,0,-tx);
      pushC(n0[0],y0,n0[1], n1[0],y1,n1[1], n0[0],y1,n0[1], +tz,0,-tx);
    }
    const uRimGeo = trackGeo(new THREE.BufferGeometry());
    uRimGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    uRimGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    uRimGeo.computeVertexNormals();
    upperCanopyAssembly.add(new THREE.Mesh(uRimGeo, matWhiteEnclosure));
  }

  // Brushed Aluminum "Identica" Rectangular Badge on Upper-Left Front Fascia (X = -1.41, Y = 3.56, Z = +1.818)
  const badgeBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.58, 0.185, 0.032)),
    matPewterBadgeRim
  );
  badgeBody.position.set(-1.38, 3.56, 1.818);
  upperCanopyAssembly.add(badgeBody);

  const badgeFace = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.545, 0.162)),
    matIdenticaBadge
  );
  badgeFace.position.set(-1.38, 3.56, 1.834);
  upperCanopyAssembly.add(badgeFace);

  // Capacitive Touch Sensor Zone ("TOUCH HERE") on Right-Front Chamfer/Side Fascia (matching real T500!)
  const touchSticker = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.28, 0.42)),
    matTouchSensor
  );
  // Place flush on the diagonal chamfer face: midpoint of chamfer (1.331, 1.331), normal (+1/sqrt2, +1/sqrt2)
  touchSticker.rotation.y = Math.PI * 0.25;
  touchSticker.position.set(1.334, 3.58, 1.334);
  upperCanopyAssembly.add(touchSticker);

  // Top Cap Assembly (separates upward cleanly during Explode!)
  const silverTopCapGroup = new THREE.Group();
  silverTopCapGroup.name = 'silverTopCapGroup';

  // Crisp dark shadow-gap reveal collar (Y = 4.075 .. 4.098)
  const revealLoop = getT500OuterLoop(0.026);
  const revealGeo = trackGeo(createLoftedPolygonGeometry(THREE, [
    { y: 4.075, loop: revealLoop },
    { y: 4.098, loop: revealLoop }
  ], false, false));
  silverTopCapGroup.add(new THREE.Mesh(revealGeo, matDarkMetal));

  // Beveled Metallic Silver Top Cap Plate (Y = 4.098 .. 4.250, 12.2 mm thick with signature 45-deg perimeter bevel!)
  const capLoopBase = getT500OuterLoop(0.004);
  const capLoopMid  = getT500OuterLoop(0.016);
  const capLoopTop  = getT500OuterLoop(0.125);
  const topCapGeo = trackGeo(createLoftedPolygonGeometry(THREE, [
    { y: 4.098, loop: capLoopBase },
    { y: 4.135, loop: capLoopMid },
    { y: 4.250, loop: capLoopTop }
  ], true, true));
  silverTopCapGroup.add(new THREE.Mesh(topCapGeo, matSilverCapAndBase));

  // Small dark calibration/model badge recessed near back-left of top cap (visible in front ortho & fr-1.jpg!)
  const topDarkTag = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.012, 0.24)),
    matDarkMetal
  );
  topDarkTag.position.set(-1.12, 4.252, -1.22);
  silverTopCapGroup.add(topDarkTag);

  upperCanopyAssembly.add(silverTopCapGroup);

  // Underside Optical Engine (modeled directly from upward-looking photo iden-4.jpg + fr-3.jpg!)
  const opticalEngineGroup = new THREE.Group();
  opticalEngineGroup.name = 'opticalEngineGroup';

  // Recessed Matte-Grey Ceiling Plate under the open bay (Y = 3.140 .. 3.155, cleanly above white lip!)
  const ceilLoop = getT500OuterLoop(0.116);
  const ceilGeo = trackGeo(createLoftedPolygonGeometry(THREE, [
    { y: 3.140, loop: ceilLoop },
    { y: 3.155, loop: ceilLoop }
  ], true, false));
  opticalEngineGroup.add(new THREE.Mesh(ceilGeo, matBayGreyWall));

  // Perimeter stainless countersunk screws along underside ceiling edge (visible in iden-4.jpg!)
  const ceilScrewGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 14));
  const ceilScrews = [
    [-0.55, 1.58], [0.22, 1.58], [0.92, 1.44], [1.46, 0.90], [1.58, 0.15], [1.58, -0.65]
  ];
  for (const [sx, sz] of ceilScrews) {
    const cs = new THREE.Mesh(ceilScrewGeo, matBrightChrome);
    cs.position.set(sx, 3.136, sz);
    opticalEngineGroup.add(cs);
  }

  // Flush dark sensor/status window near front-right ceiling (visible in iden-4.jpg!)
  const ceilWindow = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.014, 0.56)),
    matDarkMetal
  );
  ceilWindow.rotation.y = -Math.PI * 0.25;
  ceilWindow.position.set(1.14, 3.136, 1.10);
  opticalEngineGroup.add(ceilWindow);

  // Recessed Optical Triangulation Pod & Angled First-Surface Folding Mirror Bracket (X = +0.36, Z = -0.06)
  const podBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.96, 0.06, 0.52)),
    matDarkMetal
  );
  podBase.position.set(0.36, 3.118, -0.06);
  opticalEngineGroup.add(podBase);

  // Central 150 ANSI-lumen Blue LED Structured-Light Projector Lens
  const projBarrel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.115, 0.125, 0.08, 28)),
    matDarkMetal
  );
  projBarrel.position.set(0.36, 3.055, -0.06);
  opticalEngineGroup.add(projBarrel);

  const projGlass = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.088, 0.088, 0.02, 28)),
    matBlueProjectorOptic
  );
  projGlass.position.set(0.36, 3.012, -0.06);
  opticalEngineGroup.add(projGlass);

  // Dual 2.0 MP Phase-Shifting Cameras flanking the projector along stereo baseline
  for (const side of [-1, 1]) {
    const camPod = new THREE.Group();
    camPod.position.set(0.36 + side * 0.32, 3.055, -0.06);
    camPod.rotation.z = -side * 0.18; // stereo convergence toward rotary turntable!

    const barrel = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.085, 0.092, 0.09, 24)),
      matDarkMetal
    );
    camPod.add(barrel);

    const trimRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.076, 0.008, 10, 24)),
      matAnodizedArm
    );
    trimRing.rotation.x = Math.PI * 0.5;
    trimRing.position.y = -0.045;
    camPod.add(trimRing);

    const lens = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.065, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45)),
      matCameraLensGlass
    );
    lens.rotation.x = Math.PI;
    lens.position.y = -0.032;
    camPod.add(lens);

    opticalEngineGroup.add(camPod);
  }

  // Signature Protruding First-Surface Folding Mirror Assembly (visible in fr-3.jpg, iden-4.jpg, --5.jpg, s-5.jpg!)
  const mirrorBracketGroup = new THREE.Group();
  mirrorBracketGroup.position.set(0.56, 3.06, -0.18);

  const mirrorYoke = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.58, 0.06, 0.20)),
    matDarkMetal
  );
  mirrorBracketGroup.add(mirrorYoke);

  const mirrorCarrier = new THREE.Group();
  mirrorCarrier.position.set(0, -0.13, 0.02);
  mirrorCarrier.rotation.x = 0.42; // angled toward multi-die rotary stage
  mirrorCarrier.rotation.z = 0.12;

  const mirrorBacking = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.26, 0.25, 0.028)),
    matDarkMetal
  );
  mirrorCarrier.add(mirrorBacking);

  const mirrorGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.235, 0.225, 0.012)),
    matFirstSurfaceMirror
  );
  mirrorGlass.position.z = 0.018;
  mirrorCarrier.add(mirrorGlass);

  mirrorBracketGroup.add(mirrorCarrier);
  opticalEngineGroup.add(mirrorBracketGroup);

  upperCanopyAssembly.add(opticalEngineGroup);
  productRoot.add(upperCanopyAssembly);

  // ==================== 4. 2-AXIS ANODIZED SILVER SWING ARM & 4-RING ROTARY STAGE ====================
  const swingArmAssembly = new THREE.Group();
  swingArmAssembly.name = 'swingArmAssembly';
  // Pivot axis on inner left wall: X = -1.030, Y = 1.48, Z = -0.08
  const pivotY = 1.48, pivotZ = -0.08;

  // Wall-mounted rotary tilt bearing flange at X = -1.030 .. -0.965
  const wallBearingFlange = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.065, 32)),
    matDarkMetal
  );
  wallBearingFlange.rotation.z = Math.PI * 0.5;
  wallBearingFlange.position.set(-0.998, pivotY, pivotZ);
  swingArmAssembly.add(wallBearingFlange);

  // Pivoting L-Arm Group (rotates around X axis at (0, pivotY, pivotZ) during Scan Pose!)
  const swingPivotGroup = new THREE.Group();
  swingPivotGroup.name = 'swingPivotGroup';
  swingPivotGroup.position.set(0, pivotY, pivotZ);

  // Build Vertical Limb of L-Arm: X = [-0.965, -0.635] (thickness 0.33u = 26.4 mm),
  // Z = [pivotZ - 0.38, pivotZ + 0.38] (depth 0.76u = 60.8 mm),
  // Y_world = 0.35 up to semicircular arch top at Y_world = 1.84 (arch center at Y_world = 1.46, R = 0.38)
  const armR = 0.38;
  const vShape = new THREE.Shape();
  // Vertical limb starts cleanly at top of horizontal limb (Y_world = 0.672) -> zero coplanar Z overlap!
  const yBotLocal = 0.35 - pivotY;      // -1.13 (bottom of horizontal limb)
  const yVertBase = 0.672 - pivotY;     // -0.808 (top of horizontal limb)
  const yArchCtr  = 1.46 - pivotY;      // -0.02
  vShape.moveTo(-armR, yVertBase);
  vShape.lineTo(+armR, yVertBase);
  vShape.lineTo(+armR, yArchCtr);
  vShape.absarc(0, yArchCtr, armR, 0, Math.PI, false);
  vShape.closePath();

  const vertArmGeo = trackGeo(new THREE.ExtrudeGeometry(vShape, {
    depth: 0.31,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 3
  }));
  vertArmGeo.rotateY(Math.PI * 0.5);
  const vertArmMesh = new THREE.Mesh(vertArmGeo, matAnodizedArm);
  vertArmMesh.position.set(-0.946, 0, 0);
  swingPivotGroup.add(vertArmMesh);

  // Iconic 3 Countersunk Socket-Head Cap Screws on inner (+X) face of Vertical Arm Arch!
  // (Verified in fr-1.jpg, --5.jpg, iden-4.jpg: 1 top-center + 2 lower symmetric!)
  const socketRecessGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.016, 20));
  const socketHeadGeo   = trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.018, 6));
  const triScrewOffsets = [
    [0.00, +0.16],   // top center screw
    [-0.14, -0.08],  // bottom rear screw
    [+0.14, -0.08],  // bottom front screw
  ];
  for (const [dz, dy] of triScrewOffsets) {
    const rec = new THREE.Mesh(socketRecessGeo, matDarkMetal);
    rec.rotation.z = Math.PI * 0.5;
    rec.position.set(-0.633, dy, dz);
    swingPivotGroup.add(rec);

    const hex = new THREE.Mesh(socketHeadGeo, matBrightChrome);
    hex.rotation.z = Math.PI * 0.5;
    hex.position.set(-0.630, dy, dz);
    swingPivotGroup.add(hex);
  }

  // Horizontal Cantilevered Limb of L-Arm:
  // Runs in X from -0.945 out to semicircular drum center at X = +0.34 (drum outer tip X = +0.72),
  // Y_world = 0.35 .. 0.67 (height 0.32u = 25.6 mm), width in Z = 2 * armR = 0.76u
  const stageCenterX = 0.34;
  const hShape = new THREE.Shape();
  // Shape in (x_world, z_local), then extrude along Y!
  hShape.moveTo(-0.945, -armR);
  hShape.lineTo(stageCenterX, -armR);
  hShape.absarc(stageCenterX, 0, armR, -Math.PI * 0.5, +Math.PI * 0.5, false);
  hShape.lineTo(-0.945, +armR);
  hShape.closePath();

  const horizArmGeo = trackGeo(new THREE.ExtrudeGeometry(hShape, {
    depth: 0.29,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3
  }));
  horizArmGeo.rotateX(-Math.PI * 0.5);
  // After rotateX(-PI/2): local (x, y, z) -> (x, z, -y); symmetric in y so Z_local unchanged!
  const horizArmMesh = new THREE.Mesh(horizArmGeo, matAnodizedArm);
  horizArmMesh.position.set(0, yBotLocal + 0.015, 0);
  swingPivotGroup.add(horizArmMesh);

  // Lower Rotary Motor Boss Drum under stage end (Y_world = 0.275 .. 0.355, hovering cleanly above floor Y=0.204!)
  const motorBoss = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.365, 0.345, 0.085, 36)),
    matAnodizedArm
  );
  motorBoss.position.set(stageCenterX, (0.315 - pivotY), 0);
  swingPivotGroup.add(motorBoss);

  // Turntable Rotary Group (rotates 360 deg around Y axis at stageCenterX during Scan Pose!)
  const rotaryTurntableGroup = new THREE.Group();
  rotaryTurntableGroup.name = 'rotaryTurntableGroup';
  rotaryTurntableGroup.position.set(stageCenterX, 0.67 - pivotY, 0);

  // 4-Tier Ribbed Anodized Silver Height-Adapter Rings + 3 Right-Side Release Latches!
  // Total stack height: Y_local = 0.00 .. 0.54 (Y_world = 0.67 .. 1.21)
  const ringRadius = 0.435; // Ø 69.6 mm
  const tierH = 0.122;
  const tierPitch = 0.135;
  const ringGeo = trackGeo(new THREE.CylinderGeometry(ringRadius, ringRadius, tierH, 40));
  const grooveGeo = trackGeo(new THREE.CylinderGeometry(ringRadius * 0.965, ringRadius * 0.965, 0.016, 36));
  const latchTabGeo = trackGeo(new THREE.BoxGeometry(0.115, 0.072, 0.088));
  const latchSlotGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.022, 0.094));

  for (let t = 0; t < 4; t++) {
    const cy = 0.065 + t * tierPitch;
    const ring = new THREE.Mesh(ringGeo, matAnodizedArm);
    ring.position.y = cy;
    rotaryTurntableGroup.add(ring);

    if (t < 3) {
      const grv = new THREE.Mesh(grooveGeo, matDarkMetal);
      grv.position.y = cy + tierPitch * 0.5;
      rotaryTurntableGroup.add(grv);

      // Authentic right-side (+X) protruding silver latch tab on lower 3 rings!
      const tab = new THREE.Mesh(latchTabGeo, matAnodizedArm);
      tab.position.set(ringRadius + 0.038, cy, 0.05);
      rotaryTurntableGroup.add(tab);

      const slot = new THREE.Mesh(latchSlotGeo, matDarkMetal);
      slot.position.set(ringRadius + 0.048, cy + 0.025, 0.05);
      rotaryTurntableGroup.add(slot);
    }
  }

  // ==================== 5. FLEXIBLE MULTI-DIE PLATE & GYPSUM DENTAL ARCH ====================
  const multiDieGroup = new THREE.Group();
  multiDieGroup.name = 'multiDieAndModelAssembly';
  multiDieGroup.position.set(0, 0.545, 0); // Y_world = 1.215

  // Magnetic collar beneath multi-die plate
  const magCollar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.45, 0.435, 0.045, 36)),
    matBlackPlateRim
  );
  magCollar.position.y = 0.022;
  multiDieGroup.add(magCollar);

  // Black Anodized Beveled Multi-Die Plate (Ø 106 mm => radius 0.662 u, Y_plate = 0.045 .. 0.135)
  const plateR = 0.662;
  const plateProfile = [
    new THREE.Vector2(0.0, 0.045),
    new THREE.Vector2(plateR - 0.035, 0.045),
    new THREE.Vector2(plateR, 0.072),
    new THREE.Vector2(plateR, 0.118),
    new THREE.Vector2(plateR - 0.022, 0.135),
    new THREE.Vector2(0.0, 0.135)
  ];
  const plateRimGeo = trackGeo(new THREE.LatheGeometry(plateProfile, 48));
  multiDieGroup.add(new THREE.Mesh(plateRimGeo, matBlackPlateRim));

  // Textured Top Calibration Disc ("SCAN CAPTURE AREA" + red index dot at front +Z)
  const plateTopDisc = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(plateR - 0.024, 48)),
    matMultiDieTop
  );
  plateTopDisc.rotation.x = -Math.PI * 0.5;
  plateTopDisc.position.y = 0.137;
  multiDieGroup.add(plateTopDisc);

  // Authentic Medit T500 Simultaneous Scan Specimen (matching fr-1.jpg & user's uploaded photo!):
  // 1) Horseshoe Gypsum Dental Stone Arch Model seated toward rear/sides of plate
  const stoneArchGroup = new THREE.Group();
  stoneArchGroup.position.set(0, 0.137, -0.05);

  // Carved U-shaped gypsum base plinth
  const archPts = [];
  const archCount = 14;
  for (let i = 0; i <= archCount; i++) {
    const u = i / archCount; // 0 = right molar (+X, +Z), 0.5 = anterior (-Z), 1 = left molar (-X, +Z)
    const ang = Math.PI * (0.12 + 0.76 * u); // sweeps across -Z horseshoe
    const rx = Math.cos(ang) * 0.34;
    const rz = -Math.sin(ang) * 0.32 + 0.08;
    archPts.push([rx, rz, ang]);
  }

  // Build segmented stone base blocks along the horseshoe arch
  for (let i = 0; i < archPts.length - 1; i++) {
    const [x0, z0] = archPts[i];
    const [x1, z1] = archPts[i + 1];
    const mx = (x0 + x1) * 0.5, mz = (z0 + z1) * 0.5;
    const segLen = Math.hypot(x1 - x0, z1 - z0) + 0.065;
    const yaw = Math.atan2(x1 - x0, z1 - z0);
    // Leave a neat prepared edentulous/die gap in front-center for visual realism (just like fr-1.jpg!)
    const baseH = (i >= 5 && i <= 8) ? 0.115 : 0.165;
    const seg = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.155, baseH, segLen)),
      matDentalStone
    );
    seg.position.set(mx, baseH * 0.5, mz);
    seg.rotation.y = yaw;
    stoneArchGroup.add(seg);
  }

  // Sculpted anatomical molars, premolars & incisors on left & right posterior arch segments
  const toothSpecs = [
    { idx: 0, w: 0.115, h: 0.145, molar: true },
    { idx: 1, w: 0.110, h: 0.148, molar: true },
    { idx: 2, w: 0.095, h: 0.138, molar: false },
    { idx: 3, w: 0.088, h: 0.132, molar: false },
    { idx: 10, w: 0.088, h: 0.132, molar: false },
    { idx: 11, w: 0.095, h: 0.138, molar: false },
    { idx: 12, w: 0.110, h: 0.148, molar: true },
    { idx: 13, w: 0.115, h: 0.145, molar: true },
  ];
  for (const ts of toothSpecs) {
    const [tx, tz, ang] = archPts[ts.idx];
    const crown = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(ts.w * 0.46, ts.w * 0.52, ts.h, 14)),
      matDentalStoneCrown
    );
    crown.position.set(tx, 0.165 + ts.h * 0.46, tz);
    crown.rotation.y = -ang;
    stoneArchGroup.add(crown);

    if (ts.molar) {
      for (const [cx, cz] of [[-0.024, -0.022], [0.024, -0.022], [-0.024, 0.022], [0.024, 0.022]]) {
        const cusp = new THREE.Mesh(
          trackGeo(new THREE.SphereGeometry(0.026, 10, 8)),
          matDentalStoneCrown
        );
        cusp.position.set(tx + cx, 0.165 + ts.h * 0.90, tz + cz);
        stoneArchGroup.add(cusp);
      }
    }
  }
  multiDieGroup.add(stoneArchGroup);

  // 2) 4 Individual Black Multi-Die Holder Pins + Prepared Crown Stump Dies in the Front Arc!
  // (Visible right in front on both the user's attached T500 photo and fr-1.jpg!)
  const diePinBarrelGeo = trackGeo(new THREE.CylinderGeometry(0.068, 0.072, 0.135, 20));
  const diePinStemGeo   = trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.065, 14));
  const dieLocations = [
    [-0.25, +0.30, 0.115],
    [-0.08, +0.36, 0.105],
    [+0.09, +0.36, 0.108],
    [+0.26, +0.29, 0.118]
  ];
  for (const [dx, dz, dh] of dieLocations) {
    const pinBarrel = new THREE.Mesh(diePinBarrelGeo, matBlackPlateRim);
    pinBarrel.position.set(dx, 0.137 + 0.0675, dz);
    multiDieGroup.add(pinBarrel);

    const pinStem = new THREE.Mesh(diePinStemGeo, matBrightChrome);
    pinStem.position.set(dx, 0.137 + 0.155, dz);
    multiDieGroup.add(pinStem);

    // Prepared tapered crown abutment die with chamfer margin collar
    const dieCollar = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.056, 0.048, 0.045, 16)),
      matDentalStone
    );
    dieCollar.position.set(dx, 0.137 + 0.195, dz);
    multiDieGroup.add(dieCollar);

    const diePrep = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.034, 0.052, dh, 16)),
      matDentalStoneCrown
    );
    diePrep.position.set(dx, 0.137 + 0.215 + dh * 0.45, dz);
    multiDieGroup.add(diePrep);
  }

  rotaryTurntableGroup.add(multiDieGroup);
  swingPivotGroup.add(rotaryTurntableGroup);
  swingArmAssembly.add(swingPivotGroup);
  productRoot.add(swingArmAssembly);

  // Subtle Blue LED Structured-Light PointLight inside Optical Pod casting realistic blue scan tint onto model!
  const blueScanLight = new THREE.PointLight(0x2b6fff, 0.85, 3.8, 1.6);
  blueScanLight.position.set(0.36, 2.92, -0.06);
  upperCanopyAssembly.add(blueScanLight);

  // Enable castShadow / receiveShadow on all product meshes
  productRoot.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // ==================== INTERACTIVE SCAN POSE & EXPLODE API ====================
  let currentScanPose = 0;
  let currentExplode = 0;

  function applyTransforms() {
    const e = currentExplode;
    const s = currentScanPose;

    // Smooth ease
    const ee = e * e * (3 - 2 * e);

    // Explode vectors (zero overlap, clean axial separation):
    baseAssembly.position.set(0, -0.55 * ee, 0);
    lWallChassis.position.set(-0.35 * ee, 0, -0.35 * ee);
    upperCanopyAssembly.position.set(0, 0.62 * ee, 0);
    silverTopCapGroup.position.set(0, 0.48 * ee, 0);
    opticalEngineGroup.position.set(0, -0.28 * ee, 0);
    swingArmAssembly.position.set(0.45 * ee, 0, 0.25 * ee);
    multiDieGroup.position.set(0, 0.545 + 0.52 * ee, 0);

    // 2-axis scan pose: tilts the L-arm smoothly up to 24 deg around its wall pivot & rotates turntable 360 deg
    const tiltRad = Math.sin(s * Math.PI) * 0.31; // up to ~23 deg tilt forward/back
    swingPivotGroup.rotation.x = tiltRad;
    rotaryTurntableGroup.rotation.y = s * Math.PI * 2.0;

    // Modulate structured blue LED intensity slightly when scanning
    const activeBoost = s > 0.005 ? 1.0 : 0.0;
    blueScanLight.intensity = 0.85 + activeBoost * 0.75;
    matBlueProjectorOptic.emissiveIntensity = 1.35 + activeBoost * 0.85;
  }

  function setExplodeFactor(t) {
    currentExplode = Math.max(0, Math.min(1, t));
    applyTransforms();
  }

  function setScanPoseFactor(t) {
    currentScanPose = Math.max(0, Math.min(1, t));
    applyTransforms();
  }

  function setLiveScanCycle(elapsedSec, blend) {
    const b = Math.max(0, Math.min(1, blend));
    const ee = currentExplode * currentExplode * (3 - 2 * currentExplode);
    baseAssembly.position.set(0, -0.55 * ee, 0);
    lWallChassis.position.set(-0.35 * ee, 0, -0.35 * ee);
    upperCanopyAssembly.position.set(0, 0.62 * ee, 0);
    silverTopCapGroup.position.set(0, 0.48 * ee, 0);
    opticalEngineGroup.position.set(0, -0.28 * ee, 0);
    swingArmAssembly.position.set(0.45 * ee, 0, 0.25 * ee);
    multiDieGroup.position.set(0, 0.545 + 0.52 * ee, 0);

    swingPivotGroup.rotation.x = Math.sin(elapsedSec * 1.35) * 0.30 * b;
    rotaryTurntableGroup.rotation.y = (elapsedSec * 0.95) * b;
    blueScanLight.intensity = 0.85 + 0.95 * b;
    matBlueProjectorOptic.emissiveIntensity = 1.35 + 1.05 * b;
  }

  function dispose() {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    texs.forEach((t) => t.dispose());
  }

  return {
    productRoot,
    setExplodeFactor,
    setScanPoseFactor,
    setLiveScanCycle,
    dispose
  };
}

      window.__ProductModel = {
        createMeditT500Product: () => createMeditT500Product(THREE)
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

window.__registerProductModel();
const __factory = Object.values(window.__ProductModel).find((value) => typeof value === 'function');

/** The machine's record, in the shape the asset library gives its machines. */
export const assets = {
  "medit-t500": { id: "medit-t500", name: "Medit Identica T500", realDimensionsMm: "290 × 290 × 340 mm", createAsset: () => __factory() },
};

/** A viewer holds one machine and nothing else. */
export const extras = {};
