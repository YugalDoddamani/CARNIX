// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-viewer -- <Viewer.html> --id imes-icore-350i-pro
//
// Source    : Imes_Icore_CORiTEC_350i_Viewer.html  (770,459 bytes)
//             md5 c8ba37b9d304323ead54821f743533ce · sha256 ef170392b8957ca90cb9eea00206aadc28545fa369a07d6ee95604149a9df38d
// Component : script 2 of 5, under the comment "COMPONENT 2 OF 3: PRODUCT MODEL (imes-icore CORiTEC 350i PRO — 168 Meshes)"
// sha256    : 2447ea856d73ffa6b05b08ed8916748777e2ab8e1212d69b0beb08613c50b5b0
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
// imes-icore CORiTEC 350i PRO — 5-Axis Wet/Dry Dental CAD/CAM Milling Machine
// Calibrated Scale: 1 scene unit = 80 mm
// Official Dimensions: 758 mm (W) x 790 mm (D) x 857 mm (H)
//   => W = 9.475 u, D = 9.875 u, H = 10.7125 u, seated at Y = 0.0000
// ============================================================================

// Helper: build an extruded prism along X (side-profile polygon in (z, y) extruded from x0 to x1)
// with guaranteed outward-pointing normals & crisp split creases!
function createSideProfilePrismX(THREE, zyLoop, x0, x1, capLeft = true, capRight = true) {
  const pos = [];
  const uvs = [];
  const M = zyLoop.length;
  const cx = (x0 + x1) * 0.5;

  // Compute signed area in (z, y) to know interior vs exterior 2D normal
  let area2 = 0;
  for (let i = 0; i < M; i++) {
    const a = zyLoop[i], b = zyLoop[(i + 1) % M];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area2 >= 0 ? 1 : -1;
  // For CCW in (z, y) [sign = +1], edge (dz, dy) has outward 2D normal (+dy, -dz)!
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
    const oz = sign * (-dy); // wait: test with square (0,0)->(1,0)->(1,1)->(0,1):
    // area2 = +2 (sign=+1). Edge (0,0)->(1,0): dz=+1, dy=0 -> outward is (z=0, y=-1)!
    // Formula: oz = +dy * sign = 0, oy = -dz * sign = -1! Check edge (1,0)->(1,1): dz=0, dy=+1 -> oz = +1, oy = 0!
    // Check edge (1,1)->(0,1): dz=-1, dy=0 -> oz = 0, oy = +1!
    // Check edge (0,1)->(0,0): dz=0, dy=-1 -> oz = -1, oy = 0!
    const outZ = sign * dy;
    const outY = sign * (-dz);
    pushTri(x0, a[1], a[0], x1, a[1], a[0], x1, b[1], b[0], 0, outY, outZ);
    pushTri(x0, a[1], a[0], x1, b[1], b[0], x0, b[1], b[0], 0, outY, outZ);
  }

  const pts2d = zyLoop.map(p => new THREE.Vector2(p[0], p[1]));
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

// Helper: build an extruded front polygon in (x, y) with hole(s) along Z from z0 to z1
function createFrontPanelWithHoleZ(THREE, outerXY, holeXY, z0, z1) {
  const shape = new THREE.Shape();
  outerXY.forEach((p, idx) => {
    if (idx === 0) shape.moveTo(p[0], p[1]);
    else shape.lineTo(p[0], p[1]);
  });
  shape.closePath();

  if (holeXY && holeXY.length > 2) {
    const hole = new THREE.Path();
    holeXY.forEach((p, idx) => {
      if (idx === 0) hole.moveTo(p[0], p[1]);
      else hole.lineTo(p[0], p[1]);
    });
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: z1 - z0,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 2
  });
  geo.translate(0, 0, z0);
  return geo;
}

// ==================== PROCEDURAL HIGH-DPI CANVAS TEXTURES ====================

// 1. 15" Touchscreen UI: "imes-icore Remote DENTAL 3.0" (faithful to user's CORiTEC 350i PRO photo!)
function createRemoteDental3ScreenTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 768;
  const ctx = c.getContext('2d');

  // Crisp light UI background
  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(0, 0, 1024, 768);

  // Top window title & icon toolbar bar
  ctx.fillStyle = '#e4e9f0';
  ctx.fillRect(0, 0, 1024, 68);
  ctx.strokeStyle = '#c5cdd8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 68); ctx.lineTo(1024, 68); ctx.stroke();

  // Colorful toolbar icons along top ribbon (matching Remote DENTAL 3.0!)
  const iconColors = [
    '#d93829', '#2b7de9', '#f29900', '#1e9e54', '#2b7de9', '#6c7582',
    '#1589ee', '#e67c00', '#249c57', '#2b7de9', '#8e44ad', '#16a085',
    '#d93829', '#27ae60', '#2980b9', '#7f8c8d'
  ];
  for (let i = 0; i < iconColors.length; i++) {
    const ix = 18 + i * 58;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix, 12, 46, 44);
    ctx.strokeStyle = '#b8c2cf';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ix, 12, 46, 44);
    ctx.fillStyle = iconColors[i];
    ctx.fillRect(ix + 9, 20, 28, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(ix + 14, 26, 18, 6);
  }

  // Left Column (x = 18 .. 285): imes-icore logo + Remote DENTAL 3.0 + Checklist
  ctx.strokeStyle = '#1b6ec2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(62, 118, 28, Math.PI * 1.08, Math.PI * 1.78);
  ctx.stroke();

  ctx.fillStyle = '#1b222c';
  ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText('imes-icore', 42, 126);
  ctx.fillStyle = '#d93829';
  ctx.fillRect(114, 104, 4, 22);

  ctx.fillStyle = '#1a2028';
  ctx.font = '600 32px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Remote', 28, 178);
  ctx.font = '600 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DENTAL', 28, 210);
  ctx.font = '700 66px "Segoe UI", Arial, sans-serif';
  ctx.fillText('3.0', 145, 208);

  // Checklist section
  ctx.fillStyle = '#1e2530';
  ctx.font = '700 21px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Checklist:', 28, 272);

  const checks = [
    'milling chamber empty & clean?',
    'correct file selected?',
    'correct blank inside?',
    'blank fastened?',
    'all milling tools available?'
  ];
  for (let i = 0; i < checks.length; i++) {
    const cy = 308 + i * 38;
    ctx.fillStyle = '#475261';
    ctx.font = '500 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(checks[i], 28, cy);
    ctx.fillStyle = '#252d38';
    ctx.fillRect(242, cy - 13, 16, 16);
    ctx.strokeStyle = '#38d368';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(245, cy - 5); ctx.lineTo(249, cy - 1); ctx.lineTo(256, cy - 10);
    ctx.stroke();
  }

  // Company service block bottom-left
  ctx.fillStyle = '#687382';
  ctx.font = '500 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText('imes-icore GmbH · D-36132 Eiterfeld', 28, 540);
  ctx.fillText('CORiTEC 350i PRO · 5-Axis Simultaneous', 28, 558);

  // 3 Columns of 20 Tool Changer Stations (Tools 1..8, 9..16, 17..20 + Status Controls!)
  const cols = [
    { start: 1, count: 8, x: 300 },
    { start: 9, count: 8, x: 536 },
    { start: 17, count: 4, x: 772 }
  ];

  for (const col of cols) {
    for (let r = 0; r < col.count; r++) {
      const tNum = col.start + r;
      const ry = 88 + r * 64;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(col.x, ry, 222, 56);
      ctx.strokeStyle = '#d0d7e2';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(col.x, ry, 222, 56);

      // Golden bur icon + tool index
      ctx.fillStyle = '#c6922c';
      ctx.fillRect(col.x + 10, ry + 10, 8, 22);
      ctx.fillStyle = '#333c48';
      ctx.font = '700 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText(String(tNum), col.x + 8, ry + 47);

      // Tool wear green bar + timer "00:00:00"
      ctx.fillStyle = '#5a6575';
      ctx.font = '500 13px monospace';
      ctx.fillText('00:14:20', col.x + 42, ry + 24);

      ctx.fillStyle = '#dce3ec';
      ctx.fillRect(col.x + 42, ry + 34, 118, 11);
      const wear = 0.55 + ((tNum * 37) % 40) / 100;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(col.x + 42, ry + 34, Math.round(118 * wear), 11);

      // Blue info dot
      ctx.fillStyle = '#1d76db';
      ctx.beginPath();
      ctx.arc(col.x + 196, ry + 22, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Right-column temperature badge ("21.6 °C") + 3 circular green action buttons (matching photo!)
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(808, 362, 146, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('21.6 °C', 844, 387);

  for (let b = 0; b < 3; b++) {
    const by = 442 + b * 66;
    ctx.fillStyle = b === 1 ? '#5b6675' : '#22a952';
    ctx.beginPath();
    ctx.arc(880, by, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(880, by, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bottom CNC Coordinate & Spindle Status Bar
  ctx.fillStyle = '#e3e8f0';
  ctx.fillRect(0, 628, 1024, 110);
  ctx.strokeStyle = '#c1cad6';
  ctx.strokeRect(0, 628, 1024, 110);

  const axes = ['X  0.00 mm', 'Y  0.00 mm', 'Z  0.00 mm', 'A  0.00°', 'B  0.00°', 'S  60,000 rpm'];
  for (let i = 0; i < axes.length; i++) {
    const ax = 18 + i * 164;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ax, 644, 150, 36);
    ctx.strokeStyle = '#bac4d2';
    ctx.strokeRect(ax, 644, 150, 36);
    ctx.fillStyle = '#1e2631';
    ctx.font = '600 17px monospace';
    ctx.fillText(axes[i], ax + 12, 668);
  }

  // Dark Windows embedded taskbar strip at very bottom
  ctx.fillStyle = '#1c232d';
  ctx.fillRect(0, 738, 1024, 30);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(12, 745, 22, 16);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CORiTEC Remote DENTAL 3.0 — Ready (Air: 7.2 bar · Coolant: OK · Zero-Point Locked)', 48, 758);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 2. Upper-right "imes-icore® Competence in CNC & DENTAL Solutions" decal on black glass
function createImesIcoreLogoTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 160);

  // Signature blue dynamic arc sweeping across top-left of logo
  ctx.strokeStyle = '#1a75cf';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(135, 92, 95, 52, -0.32, Math.PI * 0.95, Math.PI * 1.78);
  ctx.stroke();

  // White "imes-" + orange "i" + white "core®"
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 64px "Segoe UI", Inter, Arial, sans-serif';
  ctx.fillText('imes-', 68, 98);

  // Orange/red "i" stem & dot
  ctx.fillStyle = '#e8531e';
  ctx.fillRect(245, 62, 12, 36);
  ctx.beginPath();
  ctx.arc(251, 47, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.fillText('core', 264, 98);
  ctx.font = '600 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText('®', 404, 68);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Competence in CNC & DENTAL Solutions', 68, 132);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 3. Mid-right "CORiTEC 350i PRO" + "Power" / "Cover" labels on black glass
function createCoritecModelBadgeTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 640);

  // "CORiTEC" with red 'i'
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 52px "Segoe UI", Arial, sans-serif';
  ctx.fillText('COR', 130, 82);
  ctx.fillStyle = '#dc2626';
  ctx.fillText('i', 248, 82);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('TEC', 268, 82);

  // Large "350i"
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 126px "Segoe UI", Arial, sans-serif';
  ctx.fillText('350i', 124, 198);

  // Bold crimson "PRO" right-aligned below 350i
  ctx.fillStyle = '#dc2626';
  ctx.font = '800 56px "Segoe UI", Arial, sans-serif';
  ctx.fillText('PRO', 262, 258);

  // "Power" and "Cover" labels safely inside the black glass to the left of the diagonal notch
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '600 34px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Power', 330, 442);
  ctx.fillText('Cover', 330, 568);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 4. Bottom-right "Made in Germany" badge with vertical Black-Red-Gold flag bar
function createMadeInGermanyTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eef2f6';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 124);

  // Vertical German flag stripe on left
  ctx.fillStyle = '#111318';
  ctx.fillRect(14, 14, 16, 100);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(30, 14, 16, 100);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(46, 14, 16, 100);

  ctx.fillStyle = '#1e293b';
  ctx.font = '700 24px "Segoe UI", Arial, sans-serif';
  ctx.fillText('MADE IN', 78, 56);
  ctx.font = '800 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText('GERMANY', 78, 92);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 5. Yellow Chamber Axis Direction Decals ("<- - X + ->" and "^ - A + v", matching int-1.jpg!)
function createAxisArrowTexture(THREE, axisChar) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);

  // Double-headed yellow arrow polygon with crisp black outline
  ctx.beginPath();
  ctx.moveTo(16, 64);
  ctx.lineTo(106, 14);
  ctx.lineTo(106, 36);
  ctx.lineTo(406, 36);
  ctx.lineTo(406, 14);
  ctx.lineTo(496, 64);
  ctx.lineTo(406, 114);
  ctx.lineTo(406, 92);
  ctx.lineTo(106, 92);
  ctx.lineTo(106, 114);
  ctx.closePath();

  ctx.fillStyle = '#f5dc14';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#15181e';
  ctx.stroke();

  ctx.fillStyle = '#15181e';
  ctx.font = '800 54px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('−', 112, 65);
  ctx.fillText(axisChar, 256, 66);
  ctx.fillText('+', 400, 65);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 6. Rear Panel CE Type Rating Plate & Yellow "Wartung / Nächster Prüftermin" Sticker (matching pneumati-1.jpg!)
function createRearTypePlateTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 360;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#cfd6df';
  ctx.fillRect(0, 0, 640, 360);
  ctx.strokeStyle = '#333b46';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 620, 340);

  ctx.fillStyle = '#181e26';
  ctx.font = '800 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText('imes-icore®', 30, 62);
  ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Im Leibolzgraben 16 · D-36132 Eiterfeld · Germany', 30, 94);

  ctx.beginPath(); ctx.moveTo(24, 112); ctx.lineTo(616, 112); ctx.lineWidth = 2; ctx.stroke();

  const rows = [
    ['Type :', 'CORiTEC 350i PRO (5-Axis Wet/Dry)'],
    ['Item No. :', '511003-0350    |   S/N : 350i-206184'],
    ['Voltage :', '100–240 V AC   |   50/60 Hz   |   2.2 kW'],
    ['Air Supply :', 'min. 6.5 – 9.0 bar @ 80 L/min (dry, oil-free)'],
    ['Weight :', '205 kg (Polymer Concrete Monoblock)']
  ];
  for (let i = 0; i < rows.length; i++) {
    const ry = 144 + i * 32;
    ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(rows[i][0], 30, ry);
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(rows[i][1], 175, ry);
  }

  ctx.font = '800 50px Arial, sans-serif';
  ctx.fillText('CE', 30, 326);
  ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Indoor Lab Use Only · Read Manual Before Operation · Made in Germany', 125, 320);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createWartungStickerTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 384;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ebd01b';
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = '#1f242c';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 240, 368);

  ctx.fillStyle = '#181c24';
  ctx.font = '800 34px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Wartung', 128, 52);
  ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Nächste Wartung', 128, 84);

  // Purple/navy circular inspection dial
  ctx.fillStyle = '#2d2654';
  ctx.beginPath();
  ctx.arc(128, 192, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 192, 54, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Nächster', 128, 185);
  ctx.fillText('Prüftermin', 128, 207);

  ctx.fillStyle = '#181c24';
  ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('imes-icore GmbH', 128, 314);
  ctx.font = '600 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('D-36132 Eiterfeld', 128, 344);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createPressureGaugeTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(128, 128, 114, 0, Math.PI * 2); ctx.stroke();

  // Green operating zone arc (6.5 - 9 bar)
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(128, 128, 88, -Math.PI * 0.15, Math.PI * 0.25); ctx.stroke();

  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 76, 128 + Math.sin(a) * 76);
    ctx.lineTo(128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98);
    ctx.stroke();
  }

  // Needle pointing to 7.2 bar
  const na = Math.PI * 0.75 + 0.72 * Math.PI * 1.5;
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + Math.cos(na) * 82, 128 + Math.sin(na) * 82);
  ctx.stroke();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.arc(128, 128, 12, 0, Math.PI * 2); ctx.fill();

  ctx.font = '700 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('bar', 128, 188);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ==================== MAIN PRODUCT FACTORY ====================

function createCoritec350iProduct(THREE) {
  const geos = [];
  const mats = [];
  const texs = [];
  const trackGeo = (g) => { geos.push(g); return g; };
  const trackMat = (m) => { mats.push(m); return m; };
  const trackTex = (t) => { texs.push(t); return t; };

  const productRoot = new THREE.Group();
  productRoot.name = 'coritec350iRoot';

  // Exact calibrated envelope: W = 9.475 (758 mm), D = 9.875 (790 mm), H = 10.7125 (857 mm)
  const halfW = 4.7375;
  const halfD = 4.9375;
  const totalH = 10.7125;

  // Front plane is vertical from Y = 0.80 to Y = 10.7125 at Z = +4.82 (with black glass proud to +4.9375),
  // and angled lower chin below Y = 0.80 back to Z = +4.52 at Y = 0.22!
  const zFrontWhite = 4.82;
  const zBack = -halfD; // -4.9375

  // ==================== PBR MATERIALS ====================
  const matWhiteComposite = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecWhiteComposite',
    color: 0xf1f4f8,
    roughness: 0.26,
    metalness: 0.04,
    envMapIntensity: 1.12
  }));

  const matChamberWhite = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecChamberWhite',
    color: 0xe6ebf2,
    roughness: 0.36,
    metalness: 0.08,
    envMapIntensity: 1.05
  }));

  const matBlackGlass = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecFrontBlackGlass',
    color: 0x0e1218,
    roughness: 0.09,
    metalness: 0.16,
    envMapIntensity: 1.55
  }));

  const matMonitorBezel = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecMonitorBezel',
    color: 0x1d222b,
    roughness: 0.42,
    metalness: 0.22,
    envMapIntensity: 1.15
  }));

  const matCoritecBlueBar = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecBlueBar',
    color: 0x0e6eb2,
    emissive: 0x073b6b,
    emissiveIntensity: 0.32,
    roughness: 0.24,
    metalness: 0.36,
    envMapIntensity: 1.30
  }));

  const matDoorHandleBlue = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecDoorHandleBlue',
    color: 0x1548b8,
    roughness: 0.28,
    metalness: 0.48,
    envMapIntensity: 1.35
  }));

  const matClearWindowGlass = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecChamberWindowGlass',
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.22,
    roughness: 0.05,
    metalness: 0.12,
    envMapIntensity: 1.6,
    depthWrite: false
  }));

  const matStainless = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecMachinedStainless',
    color: 0xd2d8e1,
    roughness: 0.22,
    metalness: 0.78,
    envMapIntensity: 1.45
  }));

  const matCastAluminum = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecCastAluminum',
    color: 0xc4ccd6,
    roughness: 0.34,
    metalness: 0.58,
    envMapIntensity: 1.25
  }));

  const matBrassCollet = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecBrassCollet',
    color: 0xd4a446,
    roughness: 0.26,
    metalness: 0.82,
    envMapIntensity: 1.45
  }));

  const matCarbideTool = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecCarbideBur',
    color: 0x8f98a6,
    roughness: 0.18,
    metalness: 0.90,
    envMapIntensity: 1.5
  }));

  const matZirconiaDisc = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecZirconiaBlank',
    color: 0xede6d8,
    roughness: 0.46,
    metalness: 0.03
  }));

  const matBellowsDark = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecAccordionBellows',
    color: 0x222730,
    roughness: 0.68,
    metalness: 0.12
  }));

  const matPolymerBase = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecPolymerConcreteBase',
    color: 0x252a33,
    roughness: 0.65,
    metalness: 0.18
  }));

  const matRearGreySheet = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecRearGreyMetal',
    color: 0x7a828e,
    roughness: 0.46,
    metalness: 0.36,
    envMapIntensity: 1.15
  }));

  const matEstopRed = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecEstopRed',
    color: 0xd62429,
    roughness: 0.32,
    metalness: 0.08
  }));

  const matEstopYellow = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecEstopYellow',
    color: 0xf2c618,
    roughness: 0.36,
    metalness: 0.08
  }));

  const matLedPowerGreen = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecPowerGreenLed',
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 1.15,
    roughness: 0.20
  }));

  const matLedCoverRing = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecCoverRingLed',
    color: 0xd8b4fe,
    emissive: 0x9333ea,
    emissiveIntensity: 0.55,
    roughness: 0.22
  }));

  const matClearBowl = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecPolycarbonateBowl',
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.46,
    roughness: 0.10,
    metalness: 0.10,
    depthWrite: false
  }));

  // Mapped procedural CanvasTextures
  const matScreenUi = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecRemoteDentalScreen',
    map: trackTex(createRemoteDental3ScreenTexture(THREE)),
    emissive: 0xffffff,
    emissiveMap: null,
    roughness: 0.18,
    metalness: 0.04
  }));
  matScreenUi.emissiveMap = matScreenUi.map;
  matScreenUi.emissiveIntensity = 0.24;

  const matLogoDecal = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecImesIcoreLogo',
    map: trackTex(createImesIcoreLogoTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.14,
    metalness: 0.10
  }));

  const matModelDecal = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecModel350iProDecal',
    map: trackTex(createCoritecModelBadgeTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.14,
    metalness: 0.10
  }));

  const matGermanyBadge = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecGermanyBadge',
    map: trackTex(createMadeInGermanyTexture(THREE)),
    roughness: 0.30,
    metalness: 0.12
  }));

  const matAxisXDecal = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecAxisXDecal',
    map: trackTex(createAxisArrowTexture(THREE, 'X')),
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.35
  }));

  const matAxisADecal = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecAxisADecal',
    map: trackTex(createAxisArrowTexture(THREE, 'A')),
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.35
  }));

  const matRearTypePlate = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecRearTypePlate',
    map: trackTex(createRearTypePlateTexture(THREE)),
    roughness: 0.36,
    metalness: 0.30
  }));

  const matWartungSticker = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecWartungSticker',
    map: trackTex(createWartungStickerTexture(THREE)),
    roughness: 0.42
  }));

  const matGaugeFace = trackMat(new THREE.MeshStandardMaterial({
    name: 'coritecGaugeFace',
    map: trackTex(createPressureGaugeTexture(THREE)),
    roughness: 0.25
  }));

  // ==================== 1. POLYMER-CONCRETE BASE, FEET & REAR PNEUMATIC FRL ====================
  const baseAndRearAssembly = new THREE.Group();
  baseAndRearAssembly.name = 'baseAndRearAssembly';

  // 4 Heavy-duty industrial vibration-damping feet (Y = 0.0000 .. 0.2200)
  const footPadGeo = trackGeo(new THREE.CylinderGeometry(0.46, 0.50, 0.14, 28));
  const footStemGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.10, 20));
  for (const [fx, fz] of [[-3.85, +3.75], [+3.85, +3.75], [-3.85, -3.95], [+3.85, -3.95]]) {
    const pad = new THREE.Mesh(footPadGeo, matPolymerBase);
    pad.position.set(fx, 0.07, fz);
    baseAndRearAssembly.add(pad);

    const stem = new THREE.Mesh(footStemGeo, matStainless);
    stem.position.set(fx, 0.17, fz);
    baseAndRearAssembly.add(stem);
  }

  // Lower central under-chassis drip/sump pan visible between front feet (matching user photo!)
  const sumpTray = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.85, 0.12, 7.60)),
    matPolymerBase
  );
  sumpTray.position.set(-0.05, 0.16, 0.10);
  baseAndRearAssembly.add(sumpTray);

  // Massive internal Polymer-Concrete structural chassis block (Y = 0.22 .. 2.75, inset inside white shells)
  const polyBlock = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(8.50, 2.48, 8.20)),
    matPolymerBase
  );
  polyBlock.position.set(0, 1.46, -0.35);
  baseAndRearAssembly.add(polyBlock);

  // Rear Industrial Sheet-Metal Service Panel (Z = -4.92, X = [-4.45, +4.45], Y = [0.24, 7.45])
  const rearSheet = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(8.90, 7.21, 0.08)),
    matRearGreySheet
  );
  rearSheet.position.set(0, (0.24 + 7.45) * 0.5, -4.89);
  baseAndRearAssembly.add(rearSheet);

  // Upper recessed rear bulkhead inside the rear-top pneumatic notch (Y = 7.45 .. 10.48, Z = -3.82)
  const rearUpperStepWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(8.90, 3.03, 0.08)),
    matRearGreySheet
  );
  rearUpperStepWall.position.set(0, (7.45 + 10.48) * 0.5, -3.45);
  baseAndRearAssembly.add(rearUpperStepWall);

  // Horizontal shelf of the rear-top step (Y = 7.45, Z = -4.93 .. -3.82)
  const rearStepShelf = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(9.475, 0.06, 1.50)),
    matWhiteComposite
  );
  rearStepShelf.position.set(0, 7.45, -4.185);
  baseAndRearAssembly.add(rearStepShelf);

  // EXPOSED AIR PREPARATION FRL REGULATOR BLOCK IN UPPER-RIGHT REAR STEP!
  // (Clearly visible peeking out on the upper-right rear in the user's attached photo!)
  const frlGroup = new THREE.Group();
  frlGroup.name = 'pneumaticFrlUnit';
  frlGroup.position.set(4.12, 8.92, -4.22);

  // Mounting bracket to upper-rear bulkhead
  const frlBracket = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.95, 0.14, 0.65)),
    matStainless
  );
  frlBracket.position.set(0, 0.62, 0.22);
  frlGroup.add(frlBracket);

  // Die-cast aluminum regulator manifold block
  const frlBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.68, 0.64, 0.64)),
    matCastAluminum
  );
  frlBody.position.set(0, 0.22, 0);
  frlGroup.add(frlBody);

  // Top black knurled pressure-adjustment knob
  const frlKnob = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.26, 0.34, 24)),
    matPolymerBase
  );
  frlKnob.position.set(0, 0.72, 0);
  frlGroup.add(frlKnob);

  // Red locking ring under regulator knob
  const frlLockRing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 24)),
    matEstopRed
  );
  frlLockRing.position.set(0, 0.56, 0);
  frlGroup.add(frlLockRing);

  // Clear polycarbonate condensate / water-separator bowl + internal sintered brass filter + metal guard cage
  const bowlOuter = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.26, 0.22, 0.92, 24)),
    matClearBowl
  );
  bowlOuter.position.set(0, -0.56, 0);
  frlGroup.add(bowlOuter);

  const brassFilter = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.09, 0.42, 18)),
    matBrassCollet
  );
  brassFilter.position.set(0, -0.36, 0);
  frlGroup.add(brassFilter);

  // Bottom black auto-drain valve nozzle (peeking horizontally on right profile in user photo!)
  const drainCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.28, 24)),
    matPolymerBase
  );
  drainCap.rotation.x = Math.PI * 0.5;
  drainCap.position.set(0.18, -0.86, -0.26);
  frlGroup.add(drainCap);

  // Circular 0-10 bar pressure gauge on side/rear of FRL block
  const gaugeCase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 24)),
    matStainless
  );
  gaugeCase.rotation.z = Math.PI * 0.5;
  gaugeCase.position.set(0.40, 0.22, 0.0);
  frlGroup.add(gaugeCase);

  const gaugeDial = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.21, 24)),
    matGaugeFace
  );
  gaugeDial.rotation.y = Math.PI * 0.5;
  gaugeDial.position.set(0.475, 0.22, 0.0);
  frlGroup.add(gaugeDial);

  // Brass push-in pneumatic fittings
  for (const dz of [-0.22, 0.22]) {
    const fit = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.20, 16)),
      matBrassCollet
    );
    fit.rotation.z = Math.PI * 0.5;
    fit.position.set(-0.42, 0.22, dz);
    frlGroup.add(fit);
  }

  baseAndRearAssembly.add(frlGroup);

  // Rear Panel Labels & Ports (matching eBay real photo pneumati-1.jpg!)
  const rearPlateMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(2.35, 1.32)),
    matRearTypePlate
  );
  rearPlateMesh.rotation.y = Math.PI;
  rearPlateMesh.position.set(-2.35, 3.85, -4.936);
  baseAndRearAssembly.add(rearPlateMesh);

  const wartungMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.92, 1.38)),
    matWartungSticker
  );
  wartungMesh.rotation.y = Math.PI;
  wartungMesh.position.set(-0.48, 3.85, -4.936);
  baseAndRearAssembly.add(wartungMesh);

  // Rear IEC power inlet + red illuminated main rocker switch
  const rearIecBezel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.15, 0.58, 0.08)),
    matPolymerBase
  );
  rearIecBezel.position.set(-1.55, 1.35, -4.95);
  baseAndRearAssembly.add(rearIecBezel);

  const rearRedSwitch = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.32, 0.36, 0.09)),
    matEstopRed
  );
  rearRedSwitch.position.set(-1.26, 1.35, -4.97);
  baseAndRearAssembly.add(rearRedSwitch);

  // Rear Ø 50 mm dust extraction hose flange + pneumatic air/water bulkhead ports + DB9 + USB/LAN
  const suctionFlange = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.38, 0.42, 0.32, 28)),
    matPolymerBase
  );
  suctionFlange.rotation.x = Math.PI * 0.5;
  suctionFlange.position.set(2.55, 1.45, -5.06);
  baseAndRearAssembly.add(suctionFlange);

  for (const [px, col] of [[0.85, matBrassCollet], [1.35, matStainless]]) {
    const port = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 16)),
      col
    );
    port.rotation.x = Math.PI * 0.5;
    port.position.set(px, 0.88, -4.98);
    baseAndRearAssembly.add(port);
  }

  // Rear cooling fan grille
  const rearFanRing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 32)),
    matPolymerBase
  );
  rearFanRing.rotation.x = Math.PI * 0.5;
  rearFanRing.position.set(2.35, 5.15, -4.94);
  baseAndRearAssembly.add(rearFanRing);

  productRoot.add(baseAndRearAssembly);

  // ==================== 2. OUTER WHITE COMPOSITE MONOCOQUE SHELL ====================
  const outerShellAssembly = new THREE.Group();
  outerShellAssembly.name = 'outerShellAssembly';

  // Side-wall profile in (z, y) matching user's CORiTEC 350i PRO photo & milli-5.png!
  // Front edge: bottom chin (4.52, 0.22) -> chin bend (4.82, 0.82) -> top front (4.58, 10.7125)
  // Top roof: (4.58, 10.7125) -> (-4.9375, 10.7125) -> overhang lip (-4.9375, 10.48) -> step (-3.80, 10.48)
  // Rear step notch: (-3.80, 10.48) -> (-3.80, 7.45) -> (-4.9375, 7.45) -> (-4.9375, 0.22)
  const sideWallProfileZY = [
    [ 4.5200,  0.2200],
    [ 4.8200,  0.8200],
    [ 4.5800, 10.7125],
    [-4.9375, 10.7125],
    [-4.9375, 10.4800],
    [-3.4500, 10.4800],
    [-3.4500,  7.4500],
    [-4.9375,  7.4500],
    [-4.9375,  0.2200]
  ];

  // Left white composite side cheek wall: X = [-4.7375, -4.150] (width = 0.5875 u = 47 mm)
  const leftSideGeo = trackGeo(createSideProfilePrismX(THREE, sideWallProfileZY, -halfW, -4.150, true, true));
  outerShellAssembly.add(new THREE.Mesh(leftSideGeo, matWhiteComposite));

  // Right white composite side cheek wall: X = [+4.080, +4.7375] (width = 0.6575 u = 52.6 mm)
  const rightSideGeo = trackGeo(createSideProfilePrismX(THREE, sideWallProfileZY, +4.080, +halfW, true, true));
  outerShellAssembly.add(new THREE.Mesh(rightSideGeo, matWhiteComposite));

  // Top White Roof Span bridging between left & right walls: X = [-4.150, +4.080], Y = [10.48, 10.7125]
  const topRoofGeo = trackGeo(new THREE.BoxGeometry(8.230, 0.2325, 9.52));
  const topRoofMesh = new THREE.Mesh(topRoofGeo, matWhiteComposite);
  topRoofMesh.position.set((-4.150 + 4.080) * 0.5, (10.48 + 10.7125) * 0.5, (-4.9375 + 4.58) * 0.5);
  outerShellAssembly.add(topRoofMesh);

  // Lower White Front Apron bridging between left & right walls below black glass (Y = 0.22 .. 2.34),
  // leaving clean center recess X = [-2.36, +2.24], Y = [0.22, 1.48] for the pull-out Coolant Tank Drawer!
  // Left lower apron block: X = [-4.150, -2.365]
  const lowerApronProfileZY = [
    [4.52, 0.22],
    [4.82, 0.82],
    [4.78, 2.36],
    [3.85, 2.36],
    [3.85, 0.22]
  ];
  outerShellAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, lowerApronProfileZY, -4.150, -2.368, false, true)),
    matWhiteComposite
  ));
  // Right lower apron + diagonal button column block: X = [+2.248, +4.080], rising up to Y = 4.12 behind the diagonal button zone!
  const rightApronProfileZY = [
    [4.52, 0.22],
    [4.82, 0.82],
    [4.74, 4.12],
    [3.85, 4.12],
    [3.85, 0.22]
  ];
  outerShellAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, rightApronProfileZY, +2.248, +4.080, true, false)),
    matWhiteComposite
  ));
  // Upper strip of lower apron above coolant drawer & behind blue bar: X = [-2.368, +2.248], Y = [1.50, 2.36]
  const midBarBacking = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.616, 0.86, 0.94)),
    matWhiteComposite
  );
  midBarBacking.position.set((-2.368 + 2.248) * 0.5, 1.93, 4.32);
  outerShellAssembly.add(midBarBacking);

  // Right-Side Wall Industrial Details (matching milli-1.jpg & milli-5.png!):
  // 1) Dual stacked vertical cooling louver grids near upper-rear of right side wall (X = +4.742)
  const sideSlotGeo = trackGeo(new THREE.BoxGeometry(0.016, 0.68, 0.045));
  for (const vy of [8.25, 9.35]) {
    for (let s = 0; s < 6; s++) {
      const slot = new THREE.Mesh(sideSlotGeo, matRearGreySheet);
      slot.position.set(halfW + 0.004, vy, -3.15 + s * 0.12);
      outerShellAssembly.add(slot);
    }
  }
  // 2) Flush hinged side maintenance access door outline on right side wall (X = +4.742, Y = 1.65..4.85, Z = -0.35..-2.45)
  const accessFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.012, 3.15, 2.05)),
    matRearGreySheet
  );
  accessFrame.position.set(halfW + 0.002, 3.25, -1.40);
  outerShellAssembly.add(accessFrame);

  const accessInner = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.014, 3.09, 1.99)),
    matWhiteComposite
  );
  accessInner.position.set(halfW + 0.004, 3.25, -1.40);
  outerShellAssembly.add(accessInner);

  const fingerNotch = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16)),
    matPolymerBase
  );
  fingerNotch.rotation.z = Math.PI * 0.5;
  fingerNotch.position.set(halfW + 0.008, 4.72, -1.40);
  outerShellAssembly.add(fingerNotch);

  // 3) Right-rear recessed side power socket pocket + 2 circular lifting-rod ports (matching milli-5.png!)
  const sidePwrPocket = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.04, 1.25, 0.68)),
    matPolymerBase
  );
  sidePwrPocket.position.set(halfW - 0.01, 2.35, -3.75);
  outerShellAssembly.add(sidePwrPocket);

  for (const lz of [2.65, -3.95]) {
    const liftPlug = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 18)),
      matRearGreySheet
    );
    liftPlug.rotation.z = Math.PI * 0.5;
    liftPlug.position.set(halfW + 0.004, 0.85, lz);
    outerShellAssembly.add(liftPlug);
  }

  // Bottom-Right "Made in Germany" Flag Badge on white front cheek (matching user's attached photo!)
  const germanyDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.42, 0.21)),
    matGermanyBadge
  );
  germanyDecal.position.set(4.32, 0.94, 4.832);
  outerShellAssembly.add(germanyDecal);

  // Operator Pushbuttons along the Bottom-Right Diagonal Column (Power, Cover, Emergency Stop!)
  const btnColGroup = new THREE.Group();
  btnColGroup.name = 'operatorButtonColumn';
  btnColGroup.rotation.x = -0.023; // matches front 1.3 deg rake

  // Molded trapezoid button-island bezel frame (matching int-4.jpg & milli-5.png)
  const islandOuter = new THREE.Shape();
  islandOuter.moveTo(3.26, 1.62);
  islandOuter.lineTo(4.36, 1.62);
  islandOuter.lineTo(4.36, 4.08);
  islandOuter.lineTo(3.66, 4.08);
  islandOuter.closePath();
  const islandHole = new THREE.Path();
  islandHole.moveTo(3.31, 1.67);
  islandHole.lineTo(4.31, 1.67);
  islandHole.lineTo(4.31, 4.03);
  islandHole.lineTo(3.70, 4.03);
  islandHole.closePath();
  islandOuter.holes.push(islandHole);
  const islandFrameGeo = trackGeo(new THREE.ExtrudeGeometry(islandOuter, { depth: 0.025, bevelEnabled: false }));
  islandFrameGeo.translate(0, 0, 4.865);
  btnColGroup.add(new THREE.Mesh(islandFrameGeo, matRearGreySheet));

  const btnBezelGeo = trackGeo(new THREE.CylinderGeometry(0.155, 0.175, 0.05, 28));
  const btnCoreGeo  = trackGeo(new THREE.CylinderGeometry(0.088, 0.088, 0.058, 24));
  const btnRingGeo  = trackGeo(new THREE.RingGeometry(0.092, 0.128, 28));

  // 1) Green Illuminated "Power" Button (X = 3.74, Y = 3.42)
  const pwrBz = new THREE.Mesh(btnBezelGeo, matStainless);
  pwrBz.rotation.x = Math.PI * 0.5;
  pwrBz.position.set(3.74, 3.42, 4.89);
  btnColGroup.add(pwrBz);

  const pwrRing = new THREE.Mesh(btnRingGeo, matLedPowerGreen);
  pwrRing.position.set(3.74, 3.42, 4.920);
  btnColGroup.add(pwrRing);

  const pwrCenter = new THREE.Mesh(btnCoreGeo, matStainless);
  pwrCenter.rotation.x = Math.PI * 0.5;
  pwrCenter.position.set(3.74, 3.42, 4.892);
  btnColGroup.add(pwrCenter);

  // 2) Illuminated "Cover" Button (X = 3.74, Y = 2.86)
  const covBz = new THREE.Mesh(btnBezelGeo, matStainless);
  covBz.rotation.x = Math.PI * 0.5;
  covBz.position.set(3.74, 2.86, 4.89);
  btnColGroup.add(covBz);

  const covRing = new THREE.Mesh(btnRingGeo, matLedCoverRing);
  covRing.position.set(3.74, 2.86, 4.920);
  btnColGroup.add(covRing);

  const covCenter = new THREE.Mesh(btnCoreGeo, matStainless);
  covCenter.rotation.x = Math.PI * 0.5;
  covCenter.position.set(3.74, 2.86, 4.892);
  btnColGroup.add(covCenter);

  // 3) Red Mushroom "Emergency Stop" Button (X = 3.68, Y = 2.02)
  const estopCollar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.21, 0.22, 0.08, 28)),
    matEstopYellow
  );
  estopCollar.rotation.x = Math.PI * 0.5;
  estopCollar.position.set(3.68, 2.02, 4.89);
  btnColGroup.add(estopCollar);

  const estopHead = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.22, 0.16, 0.20, 28)),
    matEstopRed
  );
  estopHead.rotation.x = Math.PI * 0.5;
  estopHead.position.set(3.68, 2.02, 5.01);
  btnColGroup.add(estopHead);

  outerShellAssembly.add(btnColGroup);
  productRoot.add(outerShellAssembly);

  // ==================== 3. LOWER PULL-OUT 4.8L COOLANT TANK DRAWER ====================
  const coolantDrawerAssembly = new THREE.Group();
  coolantDrawerAssembly.name = 'coolantDrawerAssembly';

  // Matches exact flush front + angled chin profile across X = [-2.345, +2.225], Y = [0.22, 1.48]
  const drawerFrontProfileZY = [
    [4.52, 0.22],
    [4.82, 0.82],
    [4.805, 1.475],
    [4.42, 1.475],
    [4.42, 0.22]
  ];
  coolantDrawerAssembly.add(new THREE.Mesh(
    trackGeo(createSideProfilePrismX(THREE, drawerFrontProfileZY, -2.345, +2.225, true, true)),
    matWhiteComposite
  ));

  // Internal 4.8-liter translucent coolant reservoir + blue cap revealed when drawer slides forward!
  const tankTray = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.20, 0.28, 3.20)),
    matPolymerBase
  );
  tankTray.position.set(-0.06, 0.38, 2.82);
  coolantDrawerAssembly.add(tankTray);

  const coolantJug = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.60, 0.92, 2.40)),
    matClearBowl
  );
  coolantJug.position.set(-0.45, 0.98, 2.75);
  coolantDrawerAssembly.add(coolantJug);

  const coolantCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 20)),
    matCoritecBlueBar
  );
  coolantCap.position.set(-0.45, 1.50, 2.75);
  coolantDrawerAssembly.add(coolantCap);

  productRoot.add(coolantDrawerAssembly);

  // ==================== 4. GLOSS-BLACK GLASS FRONT FASCIA, BLUE BAR & 15" TOUCHSCREEN ====================
  const frontFasciaAssembly = new THREE.Group();
  frontFasciaAssembly.name = 'frontFasciaAssembly';
  // Match exact ~1.39 deg backward rake of side walls from Y = 0.82 (Z = 4.82) to Y = 10.7125 (Z = 4.58)
  const frontRakeAngle = Math.atan2(4.58 - 4.82, 10.7125 - 0.82); // -0.02426 rad
  frontFasciaAssembly.position.set(0, 0.82, 4.825);
  frontFasciaAssembly.rotation.x = frontRakeAngle;
  // Helper: convert world Y to local Y along raked front plane
  const toFrontLocalY = (yw) => (yw - 0.82);

  // Asymmetric Black Tempered-Glass Polygon with bottom-right diagonal notch AND Chamber Window Cutout!
  const glassOuterXY = [
    [-4.145, toFrontLocalY(2.36)],   // Bottom-Left
    [+3.220, toFrontLocalY(2.36)],   // Bottom-Right (left of E-stop diagonal)
    [+3.620, toFrontLocalY(4.12)],   // Top of diagonal button cutout
    [+4.075, toFrontLocalY(4.12)],   // Step right to full glass width
    [+4.075, toFrontLocalY(10.66)],  // Top-Right
    [-4.145, toFrontLocalY(10.66)]   // Top-Left
  ];

  // Chamber Viewing Window Aperture: X = [-2.22, +1.86], Y_world = [2.88, 5.96]
  const winHoleXY = [
    [-2.22, toFrontLocalY(2.88)],
    [+1.86, toFrontLocalY(2.88)],
    [+1.86, toFrontLocalY(5.96)],
    [-2.22, toFrontLocalY(5.96)]
  ];

  const blackGlassGeo = trackGeo(createFrontPanelWithHoleZ(THREE, glassOuterXY, winHoleXY, 0.015, 0.115));
  frontFasciaAssembly.add(new THREE.Mesh(blackGlassGeo, matBlackGlass));

  // Window tunnel black anodized reveal liner (bridges from front black glass back to chamber door plane)
  const winFrameTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.16, 0.08, 0.36)), matMonitorBezel);
  winFrameTop.position.set(-0.18, toFrontLocalY(5.96), -0.04);
  frontFasciaAssembly.add(winFrameTop);

  const winFrameBot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.16, 0.08, 0.36)), matMonitorBezel);
  winFrameBot.position.set(-0.18, toFrontLocalY(2.88), -0.04);
  frontFasciaAssembly.add(winFrameBot);

  for (const wx of [-2.22, +1.86]) {
    const wfSide = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 3.12, 0.36)), matMonitorBezel);
    wfSide.position.set(wx, toFrontLocalY(4.42), -0.04);
    frontFasciaAssembly.add(wfSide);
  }

  // Protruding 15-Inch Industrial Touchscreen Monitor ("Remote DENTAL 3.0", faithful to user's photo!)
  const monitorBezelGroup = new THREE.Group();
  monitorBezelGroup.position.set(-0.16, toFrontLocalY(8.06), 0.155);

  const monHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.10, 3.32, 0.16)),
    matMonitorBezel
  );
  monitorBezelGroup.add(monHousing);

  const monInnerRim = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.78, 2.98, 0.175)),
    matBlackGlass
  );
  monitorBezelGroup.add(monInnerRim);

  const monLcd = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(3.66, 2.86)),
    matScreenUi
  );
  monLcd.position.set(0, 0, 0.092);
  monitorBezelGroup.add(monLcd);

  frontFasciaAssembly.add(monitorBezelGroup);

  // Upper-Right "imes-icore®" Logo Decal on Black Glass (proud at z = 0.136 -> zero Z-fighting!)
  const logoPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.68, 0.52)),
    matLogoDecal
  );
  logoPlane.position.set(3.05, toFrontLocalY(10.08), 0.136);
  frontFasciaAssembly.add(logoPlane);

  // Mid-Right "CORiTEC 350i PRO" + "Power" / "Cover" Label Decal (safely inside black glass!)
  const modelPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.56, 1.95)),
    matModelDecal
  );
  modelPlane.position.set(2.82, toFrontLocalY(3.76), 0.136);
  frontFasciaAssembly.add(modelPlane);

  // Signature Lower Horizontal CORiTEC Blue Bar (X = [-4.12, +3.16], Y_world = [1.62, 2.12])
  const blueBarShape = new THREE.Shape();
  blueBarShape.moveTo(-4.12, toFrontLocalY(1.62));
  blueBarShape.lineTo(+3.10, toFrontLocalY(1.62));
  blueBarShape.lineTo(+3.18, toFrontLocalY(2.12));
  blueBarShape.lineTo(-4.12, toFrontLocalY(2.12));
  blueBarShape.closePath();

  const blueBarGeo = trackGeo(new THREE.ExtrudeGeometry(blueBarShape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 3
  }));
  blueBarGeo.translate(0, 0, 0.01);
  frontFasciaAssembly.add(new THREE.Mesh(blueBarGeo, matCoritecBlueBar));

  productRoot.add(frontFasciaAssembly);

  // ==================== 5. MOTORIZED LIFT-UP SAFETY GLASS CHAMBER DOOR ====================
  const chamberDoorAssembly = new THREE.Group();
  chamberDoorAssembly.name = 'chamberDoorAssembly';
  chamberDoorAssembly.position.set(-0.18, 4.42, 4.56);

  // Framed safety viewing glass
  const doorGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.06, 3.04, 0.06)),
    matClearWindowGlass
  );
  chamberDoorAssembly.add(doorGlass);

  // Royal-Blue Anodized Horizontal Bottom Door Bar (clearly visible along bottom of window in user's photo!)
  const doorBlueLip = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.06, 0.24, 0.22)),
    matDoorHandleBlue
  );
  doorBlueLip.position.set(0, -1.44, 0.10);
  chamberDoorAssembly.add(doorBlueLip);

  productRoot.add(chamberDoorAssembly);

  // ==================== 6. SEALED CNC MILLING CHAMBER, 60k RPM SPINDLE & 20-TOOL CHANGER ====================
  const chamberAndSpindleAssembly = new THREE.Group();
  chamberAndSpindleAssembly.name = 'chamberAndSpindleAssembly';

  // Bright White Powder-Coated Sealed Milling Chamber Box (X = [-3.95, +3.90], Y = [2.65, 7.25], Z = [0.65, 4.50])
  // Floor sloped sump pan
  const chFloor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.85, 0.16, 3.90)),
    matChamberWhite
  );
  chFloor.position.set(-0.02, 2.72, 2.58);
  chamberAndSpindleAssembly.add(chFloor);

  // Chamber Ceiling
  const chCeil = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.85, 0.14, 3.90)),
    matChamberWhite
  );
  chCeil.position.set(-0.02, 7.18, 2.58);
  chamberAndSpindleAssembly.add(chCeil);

  // Chamber Left & Right Walls
  const chLeftWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.14, 4.50, 3.90)),
    matChamberWhite
  );
  chLeftWall.position.set(-3.92, 4.95, 2.58);
  chamberAndSpindleAssembly.add(chLeftWall);

  const chRightWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.14, 4.50, 3.90)),
    matChamberWhite
  );
  chRightWall.position.set(+3.88, 4.95, 2.58);
  chamberAndSpindleAssembly.add(chRightWall);

  // Chamber Rear Machined Gantry Backwall (Z = 0.72)
  const chBackWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.85, 4.50, 0.16)),
    matChamberWhite
  );
  chBackWall.position.set(-0.02, 4.95, 0.72);
  chamberAndSpindleAssembly.add(chBackWall);

  // Upper X-Axis Gantry Beam + Yellow "<- - X + ->" Axis Decal (visible through front window in int-1.jpg!)
  const xGantryBeam = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(6.80, 0.76, 0.55)),
    matChamberWhite
  );
  xGantryBeam.position.set(0.20, 6.25, 1.25);
  chamberAndSpindleAssembly.add(xGantryBeam);

  const axisXPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.18, 0.30)),
    matAxisXDecal
  );
  axisXPlane.position.set(0.85, 6.18, 1.54);
  chamberAndSpindleAssembly.add(axisXPlane);

  // Left Cantilevered 20-Position Automatic Tool Changer ("20-fold tool changer" with 20 brass collets & carbide burs!)
  // Positioned at X = -1.65, Y = 4.05, Z = 2.65 so it is clearly visible in the lower-left of the window just like user's photo!
  const toolChangerGroup = new THREE.Group();
  toolChangerGroup.name = 'twentyFoldToolChanger';
  toolChangerGroup.position.set(-1.55, 3.92, 2.62);

  // Angled white side cover cheek on left of tool changer
  const tcSideGuard = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.28, 1.25, 1.65)),
    matChamberWhite
  );
  tcSideGuard.rotation.z = -0.22;
  tcSideGuard.position.set(-0.78, 0.32, -0.10);
  toolChangerGroup.add(tcSideGuard);

  // Precision CNC-machined silver aluminum 20-pocket magazine plate
  const tcPlate = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.38, 0.18, 1.48)),
    matCastAluminum
  );
  toolChangerGroup.add(tcPlate);

  // Front socket-head bolts on tool changer plate (matching int-1.jpg!)
  const tcBoltGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 16));
  for (const bx of [-0.46, -0.15, 0.25]) {
    const b = new THREE.Mesh(tcBoltGeo, matPolymerBase);
    b.rotation.x = Math.PI * 0.5;
    b.position.set(bx, 0, 0.75);
    toolChangerGroup.add(b);
  }

  // 20 Golden-Brass Slotted Collet Sleeves + 6 mm Tungsten-Carbide Dental Milling Burs (4 cols x 5 rows = 20 tools!)
  const brassSleeveGeo = trackGeo(new THREE.CylinderGeometry(0.095, 0.085, 0.22, 18));
  const burShankGeo    = trackGeo(new THREE.CylinderGeometry(0.026, 0.016, 0.24, 12));
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const tx = -0.45 + col * 0.30;
      const tz = -0.50 + row * 0.26;
      const slv = new THREE.Mesh(brassSleeveGeo, matBrassCollet);
      slv.position.set(tx, 0.18, tz);
      toolChangerGroup.add(slv);

      const bur = new THREE.Mesh(burShankGeo, matCarbideTool);
      bur.position.set(tx, 0.32 + ((row + col) % 3) * 0.03, tz);
      toolChangerGroup.add(bur);
    }
  }

  // Precision Tool-Length Measurement Touch-Off Sensor Pin behind magazine
  const touchSensorBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 20)),
    matStainless
  );
  touchSensorBase.position.set(0.05, 0.20, -0.82);
  toolChangerGroup.add(touchSensorBase);

  const touchPin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.36, 14)),
    matCarbideTool
  );
  touchPin.position.set(0.05, 0.44, -0.82);
  toolChangerGroup.add(touchPin);

  chamberAndSpindleAssembly.add(toolChangerGroup);

  // Moving X/Z Spindle Carriage + 60,000 rpm High-Frequency Spindle + 4 Brass Wet-Coolant Nozzles!
  const spindleCarriageGroup = new THREE.Group();
  spindleCarriageGroup.name = 'spindleCarriageGroup';
  spindleCarriageGroup.position.set(-0.22, 5.85, 2.35);

  // Upper Stainless Z-head shroud + black pleated accordion bellows
  const zShroud = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.25, 0.85, 1.10)),
    matCastAluminum
  );
  zShroud.position.set(0, 0.55, -0.15);
  spindleCarriageGroup.add(zShroud);

  // Pleated Z-axis bellows ribs
  for (let p = 0; p < 5; p++) {
    const pleat = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.88, 0.08, 0.82)),
      matBellowsDark
    );
    pleat.position.set(0, 0.10 + p * 0.13, -0.32);
    spindleCarriageGroup.add(pleat);
  }

  // Brushed Stainless Cylindrical 60,000 rpm Spindle Nose (Jäger / SycoTec)
  const spindleBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.36, 0.34, 0.56, 32)),
    matStainless
  );
  spindleBody.position.set(0, -0.08, 0);
  spindleCarriageGroup.add(spindleBody);

  // Tapered collet chuck + golden brass nut + active 6 mm tungsten-carbide ball-nose milling bur
  const spindleChuck = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.11, 0.28, 24)),
    matStainless
  );
  spindleChuck.position.set(0, -0.46, 0);
  spindleCarriageGroup.add(spindleChuck);

  const colletNut = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.115, 0.105, 0.11, 6)),
    matBrassCollet
  );
  colletNut.position.set(0, -0.62, 0);
  spindleCarriageGroup.add(colletNut);

  const activeBur = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.016, 0.42, 16)),
    matCarbideTool
  );
  activeBur.position.set(0, -0.86, 0);
  spindleCarriageGroup.add(activeBur);

  // 4 Curved Brass Wet-Coolant Spray Nozzles converging on the bur tip (matching int-1.jpg!)
  const nozzleGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.016, 0.34, 12));
  for (let n = 0; n < 4; n++) {
    const ang = (n / 4) * Math.PI * 2 + Math.PI * 0.25;
    const noz = new THREE.Mesh(nozzleGeo, matBrassCollet);
    noz.position.set(Math.cos(ang) * 0.25, -0.48, Math.sin(ang) * 0.25);
    noz.rotation.z = Math.cos(ang) * 0.34;
    noz.rotation.x = -Math.sin(ang) * 0.34;
    spindleCarriageGroup.add(noz);
  }

  chamberAndSpindleAssembly.add(spindleCarriageGroup);

  // Interior Cool-Daylight CNC Chamber LED Illumination
  const chamberLedLight = new THREE.PointLight(0xeef6ff, 1.65, 7.5, 1.4);
  chamberLedLight.position.set(0.0, 6.85, 3.15);
  chamberAndSpindleAssembly.add(chamberLedLight);

  productRoot.add(chamberAndSpindleAssembly);

  // ==================== 7. 5-AXIS SIMULTANEOUS A/B TRUNNION & 98 MM ZIRCONIA BLANK HOLDER ====================
  const fiveAxisTrunnionAssembly = new THREE.Group();
  fiveAxisTrunnionAssembly.name = 'fiveAxisTrunnionAssembly';
  // Positioned at X = +0.58, Y = 4.10, Z = 2.45 so the 98 mm circular ring & yellow "A" decal frame right inside the window!
  const trunnionPivotY = 4.08, trunnionPivotZ = 2.42;

  // Right-side beveled stainless B-axis servo rotary drive housing + yellow "^ - A + v" decal (matching int-1.jpg & user photo!)
  const bDriveHousing = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.72, 1.38, 1.12)),
    matStainless
  );
  bDriveHousing.position.set(2.05, trunnionPivotY, trunnionPivotZ);
  fiveAxisTrunnionAssembly.add(bDriveHousing);

  // Vertical yellow "- A +" decal on front face of right B-axis housing (clearly visible in user's photo!)
  const axisAPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.12, 0.28)),
    matAxisADecal
  );
  axisAPlane.rotation.z = Math.PI * 0.5;
  axisAPlane.position.set(1.92, trunnionPivotY, trunnionPivotZ + 0.57);
  fiveAxisTrunnionAssembly.add(axisAPlane);

  // Pivoting B-Axis Trunnion Yoke (tilts around X axis at (0, trunnionPivotY, trunnionPivotZ)!)
  const bAxisTiltGroup = new THREE.Group();
  bAxisTiltGroup.name = 'bAxisTiltGroup';
  bAxisTiltGroup.position.set(0.56, trunnionPivotY, trunnionPivotZ);
  // Default hero pose matches user's photo: tilted forward ~72 deg so circular blank holder faces the window!
  const defaultBTilt = 1.18;
  bAxisTiltGroup.rotation.x = defaultBTilt;

  // Tapered cast-aluminum trunnion arm connecting right B-axis drive to the circular 98 mm blank ring
  const yokeArm = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.15, 0.34, 1.32)),
    matCastAluminum
  );
  yokeArm.position.set(0.72, 0, 0);
  bAxisTiltGroup.add(yokeArm);

  // Rotating A-Axis 98 mm Stainless Steel C-Clamp / Zero-Point Blank Holder Ring (rotates 360 deg!)
  const aAxisRingGroup = new THREE.Group();
  aAxisRingGroup.name = 'aAxisRingGroup';

  // Outer stainless steel clamp ring (outer R = 0.86 u = Ø 138 mm, inner R = 0.61 u = Ø 98 mm!)
  const ringOuterShape = new THREE.Shape();
  ringOuterShape.absarc(0, 0, 0.86, 0, Math.PI * 2, false);
  const ringInnerHole = new THREE.Path();
  ringInnerHole.absarc(0, 0, 0.615, 0, Math.PI * 2, true);
  ringOuterShape.holes.push(ringInnerHole);

  const clampRingGeo = trackGeo(new THREE.ExtrudeGeometry(ringOuterShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 3
  }));
  clampRingGeo.rotateX(-Math.PI * 0.5);
  clampRingGeo.translate(0, -0.12, 0);
  aAxisRingGroup.add(new THREE.Mesh(clampRingGeo, matStainless));

  // 6 socket-head clamping screws around the 98 mm blank holder ring
  const clampScrewGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 14));
  for (let k = 0; k < 6; k++) {
    const ka = (k / 6) * Math.PI * 2 + 0.3;
    const sc = new THREE.Mesh(clampScrewGeo, matPolymerBase);
    sc.position.set(Math.cos(ka) * 0.74, 0.135, Math.sin(ka) * 0.74);
    aAxisRingGroup.add(sc);
  }

  // 98 mm CAD/CAM Zirconia Blank Disc with Milled Multi-Unit Dental Arch Cutout & Nested Bridges!
  const blankOuterShape = new THREE.Shape();
  blankOuterShape.absarc(0, 0, 0.612, 0, Math.PI * 2, false);
  // Machined horseshoe milling pocket cutout inside disc
  const millPocket = new THREE.Path();
  millPocket.absarc(0, 0.04, 0.42, 0, Math.PI * 2, true);
  blankOuterShape.holes.push(millPocket);

  const zirconiaRingGeo = trackGeo(new THREE.ExtrudeGeometry(blankOuterShape, {
    depth: 0.20,
    bevelEnabled: false
  }));
  zirconiaRingGeo.rotateX(-Math.PI * 0.5);
  zirconiaRingGeo.translate(0, -0.10, 0);
  aAxisRingGroup.add(new THREE.Mesh(zirconiaRingGeo, matZirconiaDisc));

  // Milled 8-unit Zirconia Dental Arch + Sinter Support Pins suspended inside the 98 mm disc!
  const bridgeArch = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.26, 0.058, 12, 28, Math.PI * 1.35)),
    matZirconiaDisc
  );
  bridgeArch.rotation.x = Math.PI * 0.5;
  bridgeArch.rotation.z = -Math.PI * 0.18;
  bridgeArch.position.set(0, 0, 0.04);
  aAxisRingGroup.add(bridgeArch);

  // Support sprues connecting milled dental arch to outer zirconia ring
  const sprueGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8));
  for (const sa of [-1.8, -0.9, 0.0, 0.9, 1.8]) {
    const sp = new THREE.Mesh(sprueGeo, matZirconiaDisc);
    sp.rotation.z = Math.PI * 0.5;
    sp.rotation.y = sa;
    sp.position.set(Math.cos(sa) * 0.34, 0, 0.04 + Math.sin(sa) * 0.34);
    aAxisRingGroup.add(sp);
  }

  bAxisTiltGroup.add(aAxisRingGroup);
  fiveAxisTrunnionAssembly.add(bAxisTiltGroup);
  productRoot.add(fiveAxisTrunnionAssembly);

  // Enable castShadow & receiveShadow across all solid meshes
  productRoot.traverse((obj) => {
    if (obj.isMesh && !obj.material.transparent) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // ==================== INTERACTIVE DOOR, 5-AXIS MILLING & EXPLODE API ====================
  let coverOpen = 0;
  let explodeFactor = 0;
  let millBlend = 0;
  let millSec = 0;

  function applyState() {
    const ec = coverOpen * coverOpen * (3 - 2 * coverOpen);
    const ee = explodeFactor * explodeFactor * (3 - 2 * explodeFactor);

    // Explode vectors (clean non-colliding separation of all 7 sub-assemblies!):
    baseAndRearAssembly.position.set(0, -0.75 * ee, -0.55 * ee);
    outerShellAssembly.position.set(0, 0.65 * ee, -0.15 * ee);
    coolantDrawerAssembly.position.set(0, -0.35 * ee, 1.65 * ee);
    frontFasciaAssembly.position.set(0, 0.82 + 0.25 * ee, 4.825 + 1.55 * ee);

    // Chamber door lifts upward when Open Cover is active, and steps forward during Explode
    chamberDoorAssembly.position.set(
      -0.18,
      4.42 + 3.04 * ec + 0.25 * ee,
      4.56 + 0.95 * ee
    );

    chamberAndSpindleAssembly.position.set(-0.35 * ee, 0.30 * ee, 0);
    fiveAxisTrunnionAssembly.position.set(0.55 * ee, 0, 0.25 * ee);

    // 5-Axis Simultaneous Machining Motion (X/Z spindle + B-axis trunnion tilt + A-axis 360 blank rotation)
    const mb = millBlend;
    const xSweep = Math.sin(millSec * 1.9) * 0.42 * mb;
    const zPlunge = (Math.cos(millSec * 3.8) * 0.14 - 0.12) * mb;
    spindleCarriageGroup.position.set(-0.22 + 0.58 * mb + xSweep, 5.85 + zPlunge, 2.35);

    bAxisTiltGroup.rotation.x = defaultBTilt * (1 - mb) + (0.38 + Math.sin(millSec * 1.25) * 0.36) * mb;
    aAxisRingGroup.rotation.y = (millSec * 1.15) * mb;

    chamberLedLight.intensity = 1.65 + 0.55 * Math.max(ec, mb);
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
        createCoritec350iProduct: () => createCoritec350iProduct(THREE)
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

window.__registerProductModel();
const __factory = Object.values(window.__ProductModel).find((value) => typeof value === 'function');

/** The machine's record, in the shape the asset library gives its machines. */
export const assets = {
  "imes-icore-350i-pro": { id: "imes-icore-350i-pro", name: "imes-icore CORiTEC 350i PRO", realDimensionsMm: "758 × 790 × 857 mm", createAsset: () => __factory() },
};

/** A viewer holds one machine and nothing else. */
export const extras = {};
