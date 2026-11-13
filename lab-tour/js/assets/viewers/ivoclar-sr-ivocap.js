// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-viewer -- <Viewer.html> --id ivoclar-sr-ivocap
//
// Source    : Ivoclar_SR_Ivocap_Viewer.html  (732,568 bytes)
//             md5 ae3f047dab8f17111f247bcc54747df8 · sha256 1c8b14a67bb98e87924742d089b1f7cb28623103fb39e881871b23254e94aefb
// Component : script 2 of 2, from its start to the viewer app (its line 1100: "(function initStudioViewer() {")
// sha256    : fe59061a0410cf5e8e49719df16c1d45a16e80819fa40eeafdf6179047144b87
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer version
// of the viewer can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { createViewerWindow } from './_viewer-window.js';

const window = createViewerWindow();

// ── BEGIN original source ────────────────────────────────────────────────────

// ============================================================================
// Ivoclar Vivadent SR Ivocap System — BPS Pneumatic Denture Injection Press
// Official Components:
//   - Clamping Frame JS4 (REF 530612, 2.3 kg, 3 tons / 30 kN via 12 Belleville springs)
//   - SR Ivocap Flask (REF 530613, 1.3 kg, split cast-aluminum denture cuvette)
//   - Pressure Apparatus ID2/ID3 (REF 530610, 2.0 kg, 6.0 bar pneumatic injector)
// Calibrated Scale: 1 scene unit = 80 mm (unified portfolio scale)
//   => Footprint: 165 mm (W) x 186 mm (D) => 2.0625 u x 2.3250 u
//   => Total Height (incl. coiled air hose): 520 mm => 6.5000 u, seated at Y = 0.0000
// ============================================================================

function sampleRoundedRectXZ(w, d, r, segsPerCorner, cx = 0, cz = 0) {
  const hw = w * 0.5, hd = d * 0.5;
  const rc = Math.min(r, hw - 0.002, hd - 0.002);
  const corners = [
    [cx + hw - rc, cz + hd - rc, 0.0],
    [cx - hw + rc, cz + hd - rc, Math.PI * 0.5],
    [cx - hw + rc, cz - hd + rc, Math.PI],
    [cx + hw - rc, cz - hd + rc, Math.PI * 1.5]
  ];
  const pts = [];
  for (const [ox, oz, a0] of corners) {
    for (let s = 0; s <= segsPerCorner; s++) {
      const a = a0 + (s / segsPerCorner) * (Math.PI * 0.5);
      pts.push([ox + Math.cos(a) * rc, oz - Math.sin(a) * rc]);
    }
  }
  return pts;
}

// Hollow Rounded Rectangular Collar (used for the smooth-cornered black Safety Loop A4!)
function createRoundedCollarGeo(THREE, outerW, outerD, outerR, wallT, height) {
  const shape = new THREE.Shape();
  const oPts = sampleRoundedRectXZ(outerW, outerD, outerR, 8);
  oPts.forEach(([x, z], idx) => {
    if (idx === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();

  const hole = new THREE.Path();
  const iPts = sampleRoundedRectXZ(outerW - 2 * wallT, outerD - 2 * wallT, Math.max(0.03, outerR - wallT * 0.7), 8);
  iPts.forEach(([x, z], idx) => {
    if (idx === 0) hole.moveTo(x, z);
    else hole.lineTo(x, z);
  });
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.018,
    bevelSegments: 2
  });
  geo.rotateX(-Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

// Lofted open-top hollow cast-metal basket (Clamping Frame JS4 with upward-crowned front & rear rim!)
function createTaperedCrownedBasket(THREE, wBot, dBot, wTop, dTop, rCorner, wallT, yBot, yTop, crownH, nSlices = 10) {
  const segsCorner = 6;
  const outerRings = [];
  const innerRings = [];

  const evalCrown = (xNorm, zNorm, tY) => {
    const archX = Math.max(0, 1.0 - xNorm * xNorm);
    return crownH * Math.pow(tY, 1.6) * archX * (0.35 + 0.65 * Math.abs(zNorm));
  };

  for (let j = 0; j <= nSlices; j++) {
    const t = j / nSlices;
    const w = wBot + (wTop - wBot) * t;
    const d = dBot + (dTop - dBot) * t;
    const yBase = yBot + (yTop - yBot) * t;

    const oLoop = sampleRoundedRectXZ(w, d, rCorner, segsCorner);
    const iLoop = sampleRoundedRectXZ(w - 2 * wallT, d - 2 * wallT, Math.max(0.05, rCorner - wallT * 0.7), segsCorner);

    const o3 = oLoop.map(([x, z]) => [x, yBase + evalCrown(x / (w * 0.5), z / (d * 0.5), t), z]);
    const i3 = iLoop.map(([x, z]) => [x, Math.max(yBot + 0.22, yBase + evalCrown(x / (w * 0.5), z / (d * 0.5), t)), z]);
    outerRings.push(o3);
    innerRings.push(i3);
  }

  const M = outerRings[0].length;
  const pos = [];
  const uvs = [];

  function pushOrientedTri(A, B, C, outHint) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    if (nx * outHint[0] + ny * outHint[1] + nz * outHint[2] >= 0) {
      pos.push(...A, ...B, ...C);
    } else {
      pos.push(...A, ...C, ...B);
    }
    uvs.push(0, 0, 1, 0, 1, 1);
  }

  for (let j = 0; j < nSlices; j++) {
    for (let i = 0; i < M; i++) {
      const iNext = (i + 1) % M;
      const oA = outerRings[j][i], oB = outerRings[j][iNext];
      const oC = outerRings[j + 1][iNext], oD = outerRings[j + 1][i];
      const outDir = [0.5 * (oA[0] + oB[0]), -0.18, 0.5 * (oA[2] + oB[2])];
      pushOrientedTri(oA, oB, oC, outDir);
      pushOrientedTri(oA, oC, oD, outDir);

      if (j >= 1) {
        const iA = innerRings[j][i], iB = innerRings[j][iNext];
        const iC = innerRings[j + 1][iNext], iD = innerRings[j + 1][i];
        const inDir = [-0.5 * (iA[0] + iB[0]), 0.18, -0.5 * (iA[2] + iB[2])];
        pushOrientedTri(iA, iB, iC, inDir);
        pushOrientedTri(iA, iC, iD, inDir);
      }
    }
  }

  for (let i = 0; i < M; i++) {
    const iNext = (i + 1) % M;
    const oA = outerRings[nSlices][i], oB = outerRings[nSlices][iNext];
    const iA = innerRings[nSlices][i], iB = innerRings[nSlices][iNext];
    pushOrientedTri(oA, oB, iB, [0, 1, 0]);
    pushOrientedTri(oA, iB, iA, [0, 1, 0]);
  }

  const botCenter = [0, yBot, 0];
  const inFloorY = innerRings[1][0][1];
  const inCenter = [0, inFloorY, 0];
  for (let i = 0; i < M; i++) {
    const iNext = (i + 1) % M;
    pushOrientedTri(botCenter, outerRings[0][i], outerRings[0][iNext], [0, -1, 0]);
    pushOrientedTri(inCenter, innerRings[1][i], innerRings[1][iNext], [0, 1, 0]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// Fluted Rounded-Square Extruded Pneumatic Cylinder Profile
function createFlutedCylinderGeo(THREE, width, height, cornerR, fluteDepth = 0.018) {
  const shape = new THREE.Shape();
  const hw = width * 0.5;
  const pts = sampleRoundedRectXZ(width, width, cornerR, 10);
  pts.forEach(([x, z], idx) => {
    const ang = Math.atan2(z, x);
    const diag = Math.pow(Math.abs(Math.sin(2 * ang)), 6);
    const scale = 1.0 - fluteDepth * diag / hw;
    const px = x * scale, py = z * scale;
    if (idx === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 2
  });
  geo.rotateX(-Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

// D-Shaped Scalloped Denture Flask Half Profile extruded along +Y (matching organic cast-aluminum SR Ivocap Flask!)
function createDentureFlaskHalfGeo(THREE, width, depth, height, bevel = 0.025, waistIndent = 0.06) {
  const shape = new THREE.Shape();
  const hw = width * 0.5, hd = depth * 0.5;
  shape.moveTo(-hw + 0.12, -hd);
  shape.lineTo(hw - 0.12, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + 0.14);
  // Subtle ergonomic cast waist scallop along left & right sides!
  shape.bezierCurveTo(hw - waistIndent, -hd * 0.30, hw - waistIndent, hd * 0.10, hw, hd * 0.28);
  shape.bezierCurveTo(hw, hd * 0.88, hw * 0.46, hd, 0, hd);
  shape.bezierCurveTo(-hw * 0.46, hd, -hw, hd * 0.88, -hw, hd * 0.28);
  shape.bezierCurveTo(-hw + waistIndent, hd * 0.10, -hw + waistIndent, -hd * 0.30, -hw, -hd + 0.14);
  shape.quadraticCurveTo(-hw, -hd, -hw + 0.12, -hd);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 20
  });
  geo.rotateX(-Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

// ==================== HIGH-DPI PROCEDURAL CANVAS TEXTURES ====================

function createManometerDialTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(256, 256, 246, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 236, 0, Math.PI * 2);
  ctx.stroke();

  const startAng = Math.PI * 0.75;
  const totalSweep = Math.PI * 1.5;

  for (let i = 0; i <= 50; i++) {
    const barVal = i * 0.2;
    const ang = startAng + (barVal / 10.0) * totalSweep;
    const isMajor = (i % 10 === 0);
    const isMid   = (i % 5 === 0);
    const isSixBar = Math.abs(barVal - 6.0) < 0.01;

    const rOut = 216;
    const rIn  = isMajor ? 182 : (isMid ? 194 : 203);
    ctx.strokeStyle = isSixBar ? '#dc2626' : '#0f172a';
    ctx.lineWidth = isSixBar ? 7 : (isMajor ? 5 : 2.5);

    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(ang) * rIn, 256 + Math.sin(ang) * rIn);
    ctx.lineTo(256 + Math.cos(ang) * rOut, 256 + Math.sin(ang) * rOut);
    ctx.stroke();

    if (isMajor) {
      const rTxt = 148;
      ctx.fillStyle = isSixBar ? '#dc2626' : '#0f172a';
      ctx.font = '700 30px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(barVal)), 256 + Math.cos(ang) * rTxt, 256 + Math.sin(ang) * rTxt);
    }
  }

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 108, startAng, startAng + totalSweep);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('bar', 256, 342);
  ctx.fillStyle = '#dc2626';
  ctx.font = '700 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('6 bar BPS', 256, 374);
  ctx.fillStyle = '#475569';
  ctx.font = '600 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('EN 837-1 · KL 1.6', 256, 198);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createIvoclarCylinderLogoTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);

  ctx.fillStyle = '#64748b';
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 1.12 + (i / 10) * (Math.PI * 0.76);
    const dx = 256 + Math.cos(a) * 124;
    const dy = 132 + Math.sin(a) * 86;
    ctx.beginPath();
    ctx.arc(dx, dy, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '600 44px "Segoe UI", Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ivoclar', 250, 126);
  ctx.fillText('vivadent:', 256, 168);
  ctx.font = '600 22px "Segoe UI", Inter, Arial, sans-serif';
  ctx.fillText('technical', 292, 198);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createIvocapCapsuleLabelTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f4f6f9';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#eee0e5';
  ctx.fillRect(0, 220, 512, 292);

  ctx.fillStyle = '#9f1d35';
  ctx.font = '700 34px "Segoe UI", Arial, sans-serif';
  ctx.fillText('SR Ivocap®', 110, 96);
  ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('High Impact', 110, 130);
  ctx.font = '700 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText('ivoclar', 230, 172);

  ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Polymer: 20 g  ·  Monomer: 30 ml', 110, 232);
  ctx.fillText('BPS Prosthetic System · ↑ TOP', 110, 264);

  ctx.fillStyle = 'rgba(168, 28, 56, 0.85)';
  ctx.fillRect(0, 320, 512, 86);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CE 0123 · EN ISO 20795-1', 118, 370);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createSrIvocapCastBadgeTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 112;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 112);

  ctx.fillStyle = '#334155';
  ctx.font = '800 52px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SR-IVOCAP', 256, 56);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ==================== MAIN PRODUCT FACTORY ====================

function createSrIvocapProduct(THREE) {
  const geos = [];
  const mats = [];
  const texs = [];
  const trackGeo = (g) => { geos.push(g); return g; };
  const trackMat = (m) => { mats.push(m); return m; };
  const trackTex = (t) => { texs.push(t); return t; };

  const productRoot = new THREE.Group();
  productRoot.name = 'srIvocapSystemRoot';

  // ==================== CALIBRATED PBR MATERIALS ====================
  const matClampingCast = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapClampingFrameCast',
    color: 0x1d3044,
    roughness: 0.45,
    metalness: 0.34,
    envMapIntensity: 1.15
  }));

  const matPressingPlate = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapPressingPlate',
    color: 0xb2bcc8,
    roughness: 0.28,
    metalness: 0.72,
    envMapIntensity: 1.38
  }));

  const matCastFlaskAlu = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapFlaskCastAlu',
    color: 0xa6b1be,
    roughness: 0.35,
    metalness: 0.68,
    envMapIntensity: 1.32
  }));

  const matWhiteCylinder = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapWhiteCylinder',
    color: 0xf2f6fa,
    roughness: 0.22,
    metalness: 0.06,
    envMapIntensity: 1.15
  }));

  const matBlackYoke = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapBlackYoke',
    color: 0x141820,
    roughness: 0.32,
    metalness: 0.28,
    envMapIntensity: 1.22
  }));

  const matStainless = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapStainless',
    color: 0xd8dee6,
    roughness: 0.20,
    metalness: 0.85,
    envMapIntensity: 1.50
  }));

  const matSpringSteel = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapSpringSteel',
    color: 0x7c8591,
    roughness: 0.30,
    metalness: 0.82,
    envMapIntensity: 1.38
  }));

  const matBrassFitting = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapBrassFitting',
    color: 0xc8b678,
    roughness: 0.25,
    metalness: 0.82,
    envMapIntensity: 1.42
  }));

  const matSkyBlueValve = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapSkyBlueValve',
    color: 0x3b9ae1,
    roughness: 0.28,
    metalness: 0.08,
    envMapIntensity: 1.15
  }));

  const matCoiledAirHose = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapCoiledBlueHose',
    color: 0x2684d4,
    roughness: 0.24,
    metalness: 0.06,
    envMapIntensity: 1.25
  }));

  const matRedMark = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapRedIndicator',
    color: 0xdc2626,
    roughness: 0.32,
    metalness: 0.08
  }));

  const matGypsum = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapGypsumStone',
    color: 0xf1eee4,
    roughness: 0.78,
    metalness: 0.0
  }));

  const matPinkGingiva = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapPinkGingiva',
    color: 0xd96b82,
    roughness: 0.24,
    metalness: 0.04
  }));

  const matIvoryTeeth = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapIvoryTeeth',
    color: 0xfaf6ea,
    roughness: 0.18,
    metalness: 0.02
  }));

  const matGaugeGlass = trackMat(new THREE.MeshPhysicalMaterial({
    name: 'ivocapGaugeCrystal',
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.06,
    metalness: 0.05,
    clearcoat: 1.0
  }));

  const matGaugeDial = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapManometerDial',
    map: trackTex(createManometerDialTexture(THREE)),
    roughness: 0.26,
    metalness: 0.04
  }));

  const matCapsuleBody = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapCapsuleWrap',
    map: trackTex(createIvocapCapsuleLabelTexture(THREE)),
    roughness: 0.24,
    metalness: 0.04
  }));

  const matCylinderLogo = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapWhiteCylLogo',
    map: trackTex(createIvoclarCylinderLogoTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.26
  }));

  const matFlaskCastLogo = trackMat(new THREE.MeshStandardMaterial({
    name: 'ivocapFlaskCastLogo',
    map: trackTex(createSrIvocapCastBadgeTexture(THREE)),
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.35
  }));

  // ==================== 1. CLAMPING FRAME JS4 (REF 530612, Y = 0.000 .. 1.845 u) ====================
  const clampingFrameAssembly = new THREE.Group();
  clampingFrameAssembly.name = 'clampingFrameAssembly';

  const footGeo = trackGeo(new THREE.CylinderGeometry(0.135, 0.105, 0.32, 20));
  for (const [fx, fz] of [[-0.66, +0.72], [+0.66, +0.72], [-0.66, -0.72], [+0.66, -0.72]]) {
    const ft = new THREE.Mesh(footGeo, matClampingCast);
    ft.position.set(fx, 0.16, fz);
    clampingFrameAssembly.add(ft);
  }

  const basketGeo = trackGeo(createTaperedCrownedBasket(
    THREE,
    1.72, 1.94,
    2.0625, 2.3250,
    0.11, 0.165,
    0.30, 1.73, 0.115,
    10
  ));
  clampingFrameAssembly.add(new THREE.Mesh(basketGeo, matClampingCast));

  const frontFaceGroup = new THREE.Group();
  frontFaceGroup.position.set(0, 1.04, 1.064);
  frontFaceGroup.rotation.x = 0.124;

  const pressPlateDisc = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.41, 0.41, 0.052, 36)),
    matPressingPlate
  );
  pressPlateDisc.rotation.x = Math.PI * 0.5;
  pressPlateDisc.position.set(0, 0, 0.024);
  frontFaceGroup.add(pressPlateDisc);

  const centerBore = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.082, 0.082, 0.060, 20)),
    matBlackYoke
  );
  centerBore.rotation.x = Math.PI * 0.5;
  centerBore.position.set(0, 0, 0.025);
  frontFaceGroup.add(centerBore);

  const allenScrewGeo = trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.024, 14));
  const allenHexGeo   = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.028, 6));
  for (const deg of [180, 55, -55]) {
    const rad = (deg * Math.PI) / 180;
    const sx = Math.cos(rad) * 0.25, sy = Math.sin(rad) * 0.25;
    const sc = new THREE.Mesh(allenScrewGeo, matStainless);
    sc.rotation.x = Math.PI * 0.5;
    sc.position.set(sx, sy, 0.046);
    frontFaceGroup.add(sc);
    const hx = new THREE.Mesh(allenHexGeo, matBlackYoke);
    hx.rotation.x = Math.PI * 0.5;
    hx.position.set(sx, sy, 0.048);
    frontFaceGroup.add(hx);
  }

  for (const deg of [112, -4, -112]) {
    const rad = (deg * Math.PI) / 180;
    const sx = Math.cos(rad) * 0.485, sy = Math.sin(rad) * 0.485;
    const sc = new THREE.Mesh(allenScrewGeo, matStainless);
    sc.rotation.x = Math.PI * 0.5;
    sc.position.set(sx, sy, 0.012);
    frontFaceGroup.add(sc);
  }

  const redBar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.36, 0.036, 0.022)),
    matRedMark
  );
  redBar.position.set(0.62, 0.34, 0.012);
  frontFaceGroup.add(redBar);

  const redPin = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.028, 12, 10)),
    matStainless
  );
  redPin.position.set(0.68, 0.44, 0.014);
  frontFaceGroup.add(redPin);

  clampingFrameAssembly.add(frontFaceGroup);
  productRoot.add(clampingFrameAssembly);

  // ==================== 2. INTERNAL 12-BELLEVILLE SPRING STACK & RATCHET THRUST RING ====================
  const springAndRatchetAssembly = new THREE.Group();
  springAndRatchetAssembly.name = 'springAndRatchetAssembly';

  // Seated cleanly inside the front internal pocket of Clamping Frame (Z = 0.42 .. 0.78, ZERO protrusion past outer wall!)
  const bellevilleGeo = trackGeo(new THREE.TorusGeometry(0.32, 0.038, 10, 28));
  for (let w = 0; w < 8; w++) {
    const washer = new THREE.Mesh(bellevilleGeo, matSpringSteel);
    washer.position.set(0, 1.15, 0.40 + w * 0.046);
    springAndRatchetAssembly.add(washer);
  }

  const thrustCollar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.47, 0.47, 0.18, 32)),
    matStainless
  );
  thrustCollar.rotation.x = Math.PI * 0.5;
  thrustCollar.position.set(0, 1.34, 0.62);
  springAndRatchetAssembly.add(thrustCollar);

  // Pivoting Stainless Ratchet Lever B1 rising cleanly above front thrust ring (matching IMG_8147224f!)
  const ratchetPivot = new THREE.Group();
  ratchetPivot.position.set(0, 1.34, 0.64);
  ratchetPivot.rotation.z = -0.06;

  const leverB1 = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.68, 14)),
    matStainless
  );
  leverB1.position.set(0, 0.48, 0.04);
  leverB1.rotation.x = 0.08;
  ratchetPivot.add(leverB1);
  springAndRatchetAssembly.add(ratchetPivot);

  productRoot.add(springAndRatchetAssembly);

  // ==================== 3. SR IVOCAP FLASK LOWER HALF (M) + BPS DENTURE ARCH ====================
  const flaskLowerHalfAssembly = new THREE.Group();
  flaskLowerHalfAssembly.name = 'flaskLowerHalfAssembly';

  const flaskM = new THREE.Mesh(
    trackGeo(createDentureFlaskHalfGeo(THREE, 1.44, 1.42, 0.86, 0.028, 0.06)),
    matCastFlaskAlu
  );
  flaskM.position.set(0, 0.96, -0.14);
  flaskLowerHalfAssembly.add(flaskM);

  const stoneBed = new THREE.Mesh(
    trackGeo(createDentureFlaskHalfGeo(THREE, 1.20, 1.18, 0.10, 0.01, 0.03)),
    matGypsum
  );
  stoneBed.position.set(0, 1.80, -0.14);
  flaskLowerHalfAssembly.add(stoneBed);

  const gingivaArch = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.33, 0.085, 14, 28, Math.PI * 1.18)),
    matPinkGingiva
  );
  gingivaArch.rotation.x = Math.PI * 0.5;
  gingivaArch.rotation.z = -Math.PI * 0.09;
  gingivaArch.position.set(0, 1.90, -0.12);
  flaskLowerHalfAssembly.add(gingivaArch);

  const palatePlate = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.29, 0.31, 0.05, 24, 1, false, 0, Math.PI)),
    matPinkGingiva
  );
  palatePlate.rotation.y = -Math.PI * 0.5;
  palatePlate.position.set(0, 1.88, -0.10);
  flaskLowerHalfAssembly.add(palatePlate);

  const toothGeo = trackGeo(new THREE.BoxGeometry(0.056, 0.072, 0.046));
  for (let t = 0; t < 14; t++) {
    const frac = (t / 13) - 0.5;
    const ang = frac * Math.PI * 1.06;
    const tx = Math.sin(ang) * 0.335;
    const tz = -0.12 + Math.cos(ang) * 0.335;
    const tooth = new THREE.Mesh(toothGeo, matIvoryTeeth);
    tooth.position.set(tx, 1.955, tz);
    tooth.rotation.y = ang;
    flaskLowerHalfAssembly.add(tooth);
  }

  const spruePost = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 12)),
    matPinkGingiva
  );
  spruePost.rotation.x = Math.PI * 0.5;
  spruePost.position.set(0, 1.89, -0.42);
  flaskLowerHalfAssembly.add(spruePost);

  productRoot.add(flaskLowerHalfAssembly);

  // ==================== 4. SR IVOCAP FLASK UPPER HALF (W) + SCALLOPED INJECTION NECK ====================
  const flaskUpperHalfAssembly = new THREE.Group();
  flaskUpperHalfAssembly.name = 'flaskUpperHalfAssembly';

  // Lower flared shoulder of Flask Half W rising out of Clamping Frame (Y = 1.84 .. 2.22)
  const flaskW = new THREE.Mesh(
    trackGeo(createDentureFlaskHalfGeo(THREE, 1.44, 1.42, 0.38, 0.032, 0.07)),
    matCastFlaskAlu
  );
  flaskW.position.set(0, 1.84, -0.14);
  flaskUpperHalfAssembly.add(flaskW);

  // Cast "SR-IVOCAP" Shoulder Boss on front of Flask
  const flaskFrontBoss = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.88, 0.20, 0.14)),
    matCastFlaskAlu
  );
  flaskFrontBoss.position.set(0, 2.02, 0.50);
  flaskUpperHalfAssembly.add(flaskFrontBoss);

  const flaskWordmark = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.74, 0.15)),
    matFlaskCastLogo
  );
  flaskWordmark.position.set(0, 2.02, 0.574);
  flaskUpperHalfAssembly.add(flaskWordmark);

  // Sculpted Waisted Upper Flask Neck (Y = 2.22 .. 2.70) with deep side stirrup channels at X = ±0.43..±0.56
  // so the black Safety Loop Collar (A4) sits directly on top at Y = 2.66 and the black Vise Shank jaws
  // lock down into the side channels down to Y = 2.18 (100% matching IMG_8147224f!)
  const flaskNeckCore = new THREE.Mesh(
    trackGeo(createDentureFlaskHalfGeo(THREE, 0.86, 1.12, 0.46, 0.025, 0.04)),
    matCastFlaskAlu
  );
  flaskNeckCore.position.set(0, 2.22, -0.06);
  flaskUpperHalfAssembly.add(flaskNeckCore);

  // Front & Rear raised cast cheek ribs flanking the two side stirrup pockets (matching sculpted silver ribs in IMG_8147224f!)
  for (const cz of [-0.46, +0.34]) {
    const cheekRib = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.16, 0.44, 0.22)),
      matCastFlaskAlu
    );
    cheekRib.position.set(0, 2.44, cz);
    flaskUpperHalfAssembly.add(cheekRib);
  }

  // White Polyethylene Injection Funnel C4 seated flush in top neck bore
  const funnelRim = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.28, 0.23, 0.12, 28)),
    matWhiteCylinder
  );
  funnelRim.position.set(0, 2.70, -0.04);
  flaskUpperHalfAssembly.add(funnelRim);

  productRoot.add(flaskUpperHalfAssembly);

  // ==================== 5. SR IVOCAP MONOMER/POLYMER CAPSULE (C4, Y = 2.74 .. 3.68 u) ====================
  const ivocapCapsuleAssembly = new THREE.Group();
  ivocapCapsuleAssembly.name = 'ivocapCapsuleAssembly';

  const capsuleBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.265, 0.255, 0.88, 32)),
    matCapsuleBody
  );
  capsuleBody.rotation.y = -Math.PI * 0.42; // Rotated so red/magenta text faces the front-left 3/4 hero camera!
  capsuleBody.position.set(0, 3.18, -0.04);
  ivocapCapsuleAssembly.add(capsuleBody);

  const capsuleTopLip = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.305, 0.268, 0.068, 32)),
    matWhiteCylinder
  );
  capsuleTopLip.position.set(0, 3.64, -0.04);
  ivocapCapsuleAssembly.add(capsuleTopLip);

  productRoot.add(ivocapCapsuleAssembly);

  // ==================== 6. BLACK A-FRAME VISE SHANK YOKE (A3), ROUNDED SAFETY LOOP (A4) & PISTON (A2) ====================
  const viseShankAssembly = new THREE.Group();
  viseShankAssembly.name = 'viseShankAssembly';

  // Stepped Black Base Flange directly under White Pneumatic Cylinder (Y = 3.74 .. 3.90, matching IMG_8147224f!)
  const yokeCrownPlate = new THREE.Mesh(
    trackGeo(createFlutedCylinderGeo(THREE, 1.24, 0.15, 0.18, 0.015)),
    matBlackYoke
  );
  yokeCrownPlate.position.set(0, 3.75, -0.04);
  viseShankAssembly.add(yokeCrownPlate);

  // Two A-Frame Outward-Flared Black Vise Shank Legs (A3):
  // Narrower at top throat (X = ±0.40 at Y = 3.75), flaring OUTWARD to X = ±0.49 at Safety Loop (Y = 2.72),
  // and continuing DOWN into the Flask side channels to Y = 2.22 (100% matching user photo IMG_8147224f!)
  for (const side of [-1, +1]) {
    const legUpper = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.18, 1.22, 0.50)),
      matBlackYoke
    );
    legUpper.position.set(side * 0.445, 3.20, -0.04);
    // Outward A-frame flare: left leg (-1) tilts top-right (-0.075 rad), right leg (+1) tilts top-left (+0.075 rad)!
    legUpper.rotation.z = side * 0.075;
    viseShankAssembly.add(legUpper);

    // Lower hooked jaw extending below Safety Loop down to Y = 2.22 inside the Flask side channel!
    const hookJaw = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.22, 0.52, 0.44)),
      matBlackYoke
    );
    hookJaw.position.set(side * 0.46, 2.46, -0.04);
    viseShankAssembly.add(hookJaw);
  }

  // Smooth Rounded-Rectangle Black Safety Loop Collar (A4) seated cleanly at Y = 2.66 .. 2.92!
  const safetyLoopGroup = new THREE.Group();
  safetyLoopGroup.name = 'safetyLoopCollar';
  safetyLoopGroup.position.set(0, 2.66, -0.04);

  const smoothCollarMesh = new THREE.Mesh(
    trackGeo(createRoundedCollarGeo(THREE, 1.34, 0.84, 0.15, 0.15, 0.24)),
    matBlackYoke
  );
  safetyLoopGroup.add(smoothCollarMesh);
  viseShankAssembly.add(safetyLoopGroup);

  // Pneumatic Extrusion Piston A2 + White Capsule Plunger
  const extrusionPistonGroup = new THREE.Group();
  extrusionPistonGroup.name = 'extrusionPistonGroup';
  extrusionPistonGroup.position.set(0, 3.74, -0.04);

  const pistonRod = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.105, 0.105, 0.55, 20)),
    matStainless
  );
  pistonRod.position.set(0, 0.15, 0);
  extrusionPistonGroup.add(pistonRod);

  const plungerHead = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.225, 0.225, 0.22, 24)),
    matWhiteCylinder
  );
  plungerHead.position.set(0, -0.04, 0);
  extrusionPistonGroup.add(plungerHead);

  viseShankAssembly.add(extrusionPistonGroup);
  productRoot.add(viseShankAssembly);

  // ==================== 7. PURE WHITE FLUTED PNEUMATIC CYLINDER ("ID2", REF 530610, Y = 3.90 .. 5.48 u) ====================
  const pneumaticCylinderAssembly = new THREE.Group();
  pneumaticCylinderAssembly.name = 'pneumaticCylinderAssembly';

  const whiteCylMesh = new THREE.Mesh(
    trackGeo(createFlutedCylinderGeo(THREE, 1.24, 1.45, 0.18, 0.020)),
    matWhiteCylinder
  );
  whiteCylMesh.position.set(0, 3.90, -0.04);
  pneumaticCylinderAssembly.add(whiteCylMesh);

  const whiteTopCap = new THREE.Mesh(
    trackGeo(createFlutedCylinderGeo(THREE, 1.27, 0.13, 0.18, 0.012)),
    matWhiteCylinder
  );
  whiteTopCap.position.set(0, 5.35, -0.04);
  pneumaticCylinderAssembly.add(whiteTopCap);

  const cylLogoPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.76, 0.38)),
    matCylinderLogo
  );
  cylLogoPlane.position.set(0.14, 4.22, 0.586);
  pneumaticCylinderAssembly.add(cylLogoPlane);

  productRoot.add(pneumaticCylinderAssembly);

  // ==================== 8. TOP CROWN: 0–10 BAR MANOMETER (A1), BLUE SHUT-OFF VALVE & SEAMLESS COILED HOSE ====================
  const manometerAndHoseAssembly = new THREE.Group();
  manometerAndHoseAssembly.name = 'manometerAndHoseAssembly';

  // 8A. Analog 0–10 bar Manometer (A1) on Top-Left (angled toward front-left 3/4 viewer just like IMG_8147224f!)
  const gaugeStem = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.095, 0.18, 6)),
    matBrassFitting
  );
  gaugeStem.position.set(-0.22, 5.54, 0.10);
  manometerAndHoseAssembly.add(gaugeStem);

  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(-0.22, 5.82, 0.10);
  gaugeGroup.rotation.y = -0.18; // Angled gracefully toward front-left 3/4 camera!

  const gaugeCan = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 32)),
    matBlackYoke
  );
  gaugeCan.rotation.x = Math.PI * 0.5;
  gaugeGroup.add(gaugeCan);

  const gaugeBezel = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.305, 0.026, 12, 32)),
    matBlackYoke
  );
  gaugeBezel.position.set(0, 0, 0.118);
  gaugeGroup.add(gaugeBezel);

  const dialMesh = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.29, 32)),
    matGaugeDial
  );
  dialMesh.position.set(0, 0, 0.122);
  gaugeGroup.add(dialMesh);

  const gaugeNeedlePivot = new THREE.Group();
  gaugeNeedlePivot.position.set(0, 0, 0.128);

  const needleBar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.020, 0.010)),
    matBlackYoke
  );
  needleBar.position.set(0.07, 0, 0);
  gaugeNeedlePivot.add(needleBar);

  const needleHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.018, 16)),
    matBlackYoke
  );
  needleHub.rotation.x = Math.PI * 0.5;
  gaugeNeedlePivot.add(needleHub);
  gaugeGroup.add(gaugeNeedlePivot);

  const crystalMesh = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.295, 32)),
    matGaugeGlass
  );
  crystalMesh.position.set(0, 0, 0.136);
  gaugeGroup.add(crystalMesh);

  manometerAndHoseAssembly.add(gaugeGroup);

  // 8B. Top-Right Air Inlet Manifold + Sky-Blue Shut-Off Ball Valve + Quick Coupling
  const manifoldBlock = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.32, 0.26)),
    matStainless
  );
  manifoldBlock.position.set(0.22, 5.62, 0.04);
  manometerAndHoseAssembly.add(manifoldBlock);

  const valveLeverPivot = new THREE.Group();
  valveLeverPivot.position.set(0.32, 5.64, 0.18);

  const blueValveBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.15, 0.36, 0.14)),
    matSkyBlueValve
  );
  blueValveBody.position.set(0.04, 0.02, 0.02);
  valveLeverPivot.add(blueValveBody);

  const valvePin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.030, 0.030, 0.16, 12)),
    matBlackYoke
  );
  valvePin.rotation.z = Math.PI * 0.5;
  valvePin.position.set(0.05, -0.06, 0.03);
  valveLeverPivot.add(valvePin);

  manometerAndHoseAssembly.add(valveLeverPivot);

  const quickCoupler = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.092, 0.082, 0.34, 20)),
    matStainless
  );
  quickCoupler.position.set(0.20, 5.94, -0.02);
  manometerAndHoseAssembly.add(quickCoupler);

  // 8C. Seamless Curved Ribbed Stainless Anti-Kink Spring Guard + Vertical-Loop Coiled Sky-Blue Air Hose
  //     (0.000 mm gap — hose emerges directly out of the ribbed stainless spring guard, coiling behind/above the gauge
  //     just like user's photo IMG_8147224f!)
  const springPts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const ang = t * Math.PI * 0.62;
    const sx = 0.20 - (1 - Math.cos(ang)) * 0.24;
    const sy = 6.08 + Math.sin(ang) * 0.34;
    const sz = -0.02 - t * 0.14;
    springPts.push(new THREE.Vector3(sx, sy, sz));
  }
  const springCurve = new THREE.CatmullRomCurve3(springPts);
  const springGuard = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(springCurve, 24, 0.052, 12, false)),
    matStainless
  );
  manometerAndHoseAssembly.add(springGuard);

  // Subtle stainless coil rings along the strain-relief guard
  const ringTorusGeo = trackGeo(new THREE.TorusGeometry(0.054, 0.010, 8, 16));
  for (let r = 1; r <= 8; r++) {
    const u = r / 9;
    const pt = springCurve.getPoint(u);
    const tg = springCurve.getTangent(u);
    const ring = new THREE.Mesh(ringTorusGeo, matSpringSteel);
    ring.position.copy(pt);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg);
    manometerAndHoseAssembly.add(ring);
  }

  // Continuous Coiled Blue Polyurethane Hose starting EXACTLY inside the spring guard at springPts[0]
  // and looping in 4.5 tight vertical/oblique coils behind and above the Manometer (peaking at Y = 6.49 u)!
  const hosePts = [...springPts];
  const pEnd = springPts[springPts.length - 1]; // (-0.01, 6.40, -0.16)
  const nCoils = 4.5;
  const hoseSteps = 120;
  for (let i = 1; i <= hoseSteps; i++) {
    const t = i / hoseSteps;
    const theta = Math.PI * 0.35 + t * nCoils * Math.PI * 2.0;
    const rXY = 0.24 * (1 - 0.12 * t);
    // Vertical-plane loops standing behind the gauge (matching the blue loops visible in IMG_8147224f!)
    const blend = Math.min(1, t * 5.0);
    const targetX = -0.08 + Math.cos(theta) * rXY;
    const targetY = 6.20 + Math.sin(theta) * rXY - t * 0.28;
    const targetZ = -0.18 - t * 0.26;
    hosePts.push(new THREE.Vector3(
      pEnd.x * (1 - blend) + targetX * blend,
      pEnd.y * (1 - blend) + targetY * blend,
      pEnd.z * (1 - blend) + targetZ * blend
    ));
  }
  const hoseCurve = new THREE.CatmullRomCurve3(hosePts);
  const hoseGeo = trackGeo(new THREE.TubeGeometry(hoseCurve, 160, 0.038, 10, false));
  manometerAndHoseAssembly.add(new THREE.Mesh(hoseGeo, matCoiledAirHose));

  productRoot.add(manometerAndHoseAssembly);

  productRoot.traverse((obj) => {
    if (obj.isMesh && !obj.material.transparent) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // ==================== INTERACTIVE UNCOUPLE, 6-BAR INJECTION & 8-PART EXPLODE API ====================
  let uncoupleVal = 0;
  let explodeVal = 0;
  let injectBlend = 0;
  let injectSec = 0;

  function applyState() {
    const eu = uncoupleVal * uncoupleVal * (3 - 2 * uncoupleVal);
    const ee = explodeVal * explodeVal * (3 - 2 * explodeVal);
    const ib = injectBlend;

    // 1. Release Clamp & Yoke (C key):
    safetyLoopGroup.position.set(0, 2.66 + 0.56 * eu + 0.30 * ee, -0.04);
    ratchetPivot.rotation.z = -0.06 + 0.48 * eu;

    // 2. Live 6.0 Bar Pneumatic BPS Injection Cycle (M key):
    const pWave = 0.5 - 0.5 * Math.cos(injectSec * 1.4);
    const flutter = Math.sin(injectSec * 14.0) * 0.018 * ib;
    valveLeverPivot.rotation.x = -0.85 * ib;
    gaugeNeedlePivot.rotation.z = 3.927 - (2.827 * ib) + flutter;
    extrusionPistonGroup.position.set(0, 3.74 - (0.42 * pWave) * ib, -0.04);

    // 3. Collision-Free, Frustum-Framed 8-Subassembly BPS Exploded View (E key):
    clampingFrameAssembly.position.set(0, -0.85 * ee, 0);
    springAndRatchetAssembly.position.set(-1.62 * ee, -0.45 * ee, 0.35 * ee);
    flaskLowerHalfAssembly.position.set(0, -0.05 * ee, 0);
    flaskUpperHalfAssembly.position.set(0, 0.62 * ee, 0);
    ivocapCapsuleAssembly.position.set(1.22 * ee, 0.98 * ee, 0.25 * ee);

    const liftInjector = 0.48 * eu * (1 - ee);
    viseShankAssembly.position.set(0, liftInjector + 1.28 * ee, 0);
    pneumaticCylinderAssembly.position.set(0, liftInjector + 1.88 * ee, 0);
    manometerAndHoseAssembly.position.set(0, liftInjector + 2.42 * ee, 0);
  }

  function setCoverOpenFactor(t) {
    uncoupleVal = Math.max(0, Math.min(1, t));
    applyState();
  }

  function setExplodeFactor(t) {
    explodeVal = Math.max(0, Math.min(1, t));
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

const __factory = () => createSrIvocapProduct(window.__THREE_BUNDLE__.THREE);

/** The machine's record, in the shape the asset library gives its machines. */
export const assets = {
  "ivoclar-sr-ivocap": { id: "ivoclar-sr-ivocap", name: "Ivoclar SR Ivocap", createAsset: () => __factory() },
};

/** A viewer holds one machine and nothing else. */
export const extras = {};
