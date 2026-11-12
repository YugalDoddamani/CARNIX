// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2) + GK3 component.html
// Component : <script id="component-6b-asset-uniformation-gk3">
// sha256    : 9c88db170a485cba2a02474eb0a2c11123f6a64000873613fbd6183939137b9b
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────

    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetUniformationGK3 = function () {
      const { THREE } = window.__THREE_BUNDLE__;
      function createGk3RoundedRectShape(THREE, w, h, r) {
        const s = new THREE.Shape();
        const hw = w * 0.5, hh = h * 0.5;
        const rr = Math.min(r, hw * 0.95, hh * 0.95);
        s.moveTo(-hw + rr, -hh);
        s.lineTo(hw - rr, -hh);
        s.quadraticCurveTo(hw, -hh, hw, -hh + rr);
        s.lineTo(hw, hh - rr);
        s.quadraticCurveTo(hw, hh, hw - rr, hh);
        s.lineTo(-hw + rr, hh);
        s.quadraticCurveTo(-hw, hh, -hw, hh - rr);
        s.lineTo(-hw, -hh + rr);
        s.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
        return s;
      }

      function createGk3LoftedBox(THREE, slices, segsPerCorner = 10, capBottom = true, capTop = true) {
        // Each slice: { y, w, d, r, cz = 0 }
        // Builds outward-verified split-crease rings so 90-deg horizontal steps never Gouraud-bleed and 0 normals ever invert!
        const ringPts = segsPerCorner * 4;
        const positions = [];
        const indices = [];

        function pushCheckedTri(ax, ay, az, bx, by, bz, cx, cy, cz, ox, oy, oz) {
          const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
          const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
          const nx = e1y * e2z - e1z * e2y;
          const ny = e1z * e2x - e1x * e2z;
          const nz = e1x * e2y - e1y * e2x;
          if (nx * nx + ny * ny + nz * nz < 1e-14) return;
          const base = positions.length / 3;
          positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
          if (nx * ox + ny * oy + nz * oz >= 0) {
            indices.push(base, base + 1, base + 2);
          } else {
            indices.push(base, base + 2, base + 1);
          }
        }

        function sampleSlice(sl) {
          const hw = sl.w * 0.5, hd = sl.d * 0.5;
          const rr = Math.min(sl.r, hw * 0.96, hd * 0.96);
          const slCz = sl.cz || 0;
          const corners = [
            { cx:  hw - rr, cz:  hd - rr, a0: 0,             a1: Math.PI * 0.5 },
            { cx:  hw - rr, cz: -hd + rr, a0: Math.PI * 0.5, a1: Math.PI       },
            { cx: -hw + rr, cz: -hd + rr, a0: Math.PI,       a1: Math.PI * 1.5 },
            { cx: -hw + rr, cz:  hd - rr, a0: Math.PI * 1.5, a1: Math.PI * 2.0 }
          ];
          const pts = [];
          for (let c = 0; c < 4; c++) {
            const cn = corners[c];
            for (let s = 0; s < segsPerCorner; s++) {
              const t = s / (segsPerCorner - 1);
              const ang = cn.a0 + (cn.a1 - cn.a0) * t;
              const ox = Math.sin(ang), oz = Math.cos(ang);
              pts.push([cn.cx + ox * rr, sl.y, slCz + cn.cz + oz * rr, ox, oz]);
            }
          }
          return pts;
        }

        const rings = slices.map(sampleSlice);
        for (let i = 0; i < rings.length - 1; i++) {
          const rA = rings[i], rB = rings[i + 1];
          const czMid = ((slices[i].cz || 0) + (slices[i + 1].cz || 0)) * 0.5;
          const dy = slices[i + 1].y - slices[i].y;
          for (let p = 0; p < ringPts; p++) {
            const pn = (p + 1) % ringPts;
            const A0 = rA[p], A1 = rA[pn], B0 = rB[p], B1 = rB[pn];
            const mx = (A0[0] + A1[0] + B0[0] + B1[0]) * 0.25;
            const mz = (A0[2] + A1[2] + B0[2] + B1[2]) * 0.25 - czMid;
            const oy = Math.abs(dy) < 1e-4 ? (slices[i + 1].w > slices[i].w ? -1 : 1) : 0;
            pushCheckedTri(A0[0], A0[1], A0[2], A1[0], A1[1], A1[2], B1[0], B1[1], B1[2], mx, oy, mz);
            pushCheckedTri(A0[0], A0[1], A0[2], B1[0], B1[1], B1[2], B0[0], B0[1], B0[2], mx, oy, mz);
          }
        }

        if (capBottom) {
          const r0 = rings[0];
          const cy = slices[0].y, cz = slices[0].cz || 0;
          for (let p = 0; p < ringPts; p++) {
            const pn = (p + 1) % ringPts;
            pushCheckedTri(0, cy, cz, r0[p][0], r0[p][1], r0[p][2], r0[pn][0], r0[pn][1], r0[pn][2], 0, -1, 0);
          }
        }

        if (capTop) {
          const last = rings.length - 1;
          const rL = rings[last];
          const cy = slices[last].y, cz = slices[last].cz || 0;
          for (let p = 0; p < ringPts; p++) {
            const pn = (p + 1) % ringPts;
            pushCheckedTri(0, cy, cz, rL[p][0], rL[p][1], rL[p][2], rL[pn][0], rL[pn][1], rL[pn][2], 0, 1, 0);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
      }

      function createGk3VisorTexture(THREE) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Glossy deep obsidian visor background
        const bg = ctx.createLinearGradient(0, 0, 1024, 256);
        bg.addColorStop(0, '#0a0d12');
        bg.addColorStop(0.5, '#10151d');
        bg.addColorStop(1, '#080b10');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1024, 256);

        // Subtle diagonal glass highlight across visor
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.beginPath();
        ctx.moveTo(290, 0);
        ctx.lineTo(490, 0);
        ctx.lineTo(370, 256);
        ctx.lineTo(170, 256);
        ctx.closePath();
        ctx.fill();

        // Left side: GK3 + UNIFORMATION crisp white wordmark (matching official photos)
        ctx.fillStyle = '#f4f7fb';
        ctx.font = '800 34px "Inter", "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('GK3', 52, 166);

        ctx.font = '800 26px "Inter", "Segoe UI", Arial, sans-serif';
        ctx.fillText('UNiFORMATION', 52, 204);
        ctx.fillStyle = '#3898ff';
        ctx.beginPath();
        ctx.arc(105, 178, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Right side: 5-inch Capacitive Color Touchscreen (x=524..956, y=26..230)
        const sx = 524, sy = 26, sw = 432, sh = 204;
        ctx.fillStyle = '#060a12';
        ctx.strokeStyle = '#1f2938';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 8);
        ctx.fill();
        ctx.stroke();

        // Top UI status bar inside touchscreen
        ctx.fillStyle = '#0d1524';
        ctx.fillRect(sx + 4, sy + 4, sw - 8, 28);
        ctx.fillStyle = '#cbd6e6';
        ctx.font = '600 12px "Inter", Arial, sans-serif';
        ctx.fillText('28.5°C  ·  800ml  ·  LAN / Wi-Fi', sx + 16, sy + 22);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px "Inter", Arial, sans-serif';
        ctx.fillText('UNiFORMATION', sx + sw - 16, sy + 22);

        // 4 signature sky-blue rounded square UI tiles (matching GK3 official photos!)
        const labels = ['Print', 'Network', 'Cloud', 'System'];
        const tileW = 66, tileH = 62, gap = 24;
        const startX = sx + (sw - (tileW * 4 + gap * 3)) * 0.5;
        const tileY = sy + 58;
        ctx.textAlign = 'center';
        for (let i = 0; i < 4; i++) {
          const tx = startX + i * (tileW + gap);
          const g = ctx.createLinearGradient(tx, tileY, tx, tileY + tileH);
          g.addColorStop(0, '#369cff');
          g.addColorStop(1, '#196de0');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(tx, tileY, tileW, tileH, 13);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(tx + tileW * 0.5, tileY + tileH * 0.50, 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#7ea4d8';
          ctx.font = '600 11px "Inter", Arial, sans-serif';
          ctx.fillText(labels[i], tx + tileW * 0.5, tileY + tileH + 17);
        }

        // Bottom dark grey dock bar (matching GK3 UI)
        const dockW = 286, dockH = 28;
        const dockX = sx + (sw - dockW) * 0.5, dockY = sy + sh - 38;
        ctx.fillStyle = '#262e3d';
        ctx.beginPath();
        ctx.roundRect(dockX, dockY, dockW, dockH, 6);
        ctx.fill();
        for (let d = 0; d < 4; d++) {
          ctx.fillStyle = '#d6dfec';
          ctx.beginPath();
          ctx.arc(dockX + 44 + d * 66, dockY + 14, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        return tex;
      }

      function createGk3RearPlateTexture(THREE) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#181c22';
        ctx.fillRect(0, 0, 512, 320);
        ctx.strokeStyle = '#5c6574';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 492, 300);

        ctx.fillStyle = '#f2f5fa';
        ctx.font = '800 32px "Inter", Arial, sans-serif';
        ctx.fillText('UNiFORMATION  GK3', 28, 58);

        ctx.fillStyle = '#2dd46f';
        ctx.fillRect(28, 74, 456, 4);

        ctx.fillStyle = '#cbd4e1';
        ctx.font = '600 19px "Inter", Arial, sans-serif';
        ctx.fillText('16K MSLA Dental & Precision Resin 3D Printer', 28, 112);
        ctx.font = '500 17px "Inter", Arial, sans-serif';
        ctx.fillStyle = '#9aa6b8';
        ctx.fillText('Resolution: 15120 × 6230 (14 × 19 µm) · 405 nm COB', 28, 148);
        ctx.fillText('Build Volume: 211 × 118 × 240 mm · PTC Smart Heat', 28, 178);
        ctx.fillText('Auto Feed: 1200 ml Cartridge · Vat: 800 ml nFEP', 28, 208);
        ctx.fillText('Input: 100–240V~ 50/60Hz 120W · LAN / Wi-Fi / USB', 28, 238);

        ctx.fillStyle = '#dfe6f0';
        ctx.font = '800 24px Arial, sans-serif';
        ctx.fillText('CE   FCC   RoHS   S/N: GK3-2026-08419', 28, 284);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
      }

      function createGk3CartridgeLabelTexture(THREE) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#20242c';
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = '#129842';
        ctx.fillRect(36, 48, 440, 86);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 32px "Inter", Arial, sans-serif';
        ctx.fillText('UNiFORMATION', 58, 92);
        ctx.font = '700 20px "Inter", Arial, sans-serif';
        ctx.fillText('AUTO-FEED DENTAL MODEL RESIN', 58, 122);

        ctx.fillStyle = '#dce4f0';
        ctx.font = '700 26px "Inter", Arial, sans-serif';
        ctx.fillText('405 nm Precision Beige · 1.2 kg', 54, 196);
        ctx.fillStyle = '#9aa6b8';
        ctx.font = '500 20px "Inter", Arial, sans-serif';
        ctx.fillText('Low-Shrinkage Dental Arch & Die Formula', 54, 234);
        ctx.fillText('Capacity: 1200 ml Cartridge', 54, 268);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
      }

      function createUniformationGK3Product(THREE_REF) {
        const THREE = THREE_REF || window.__THREE_BUNDLE__.THREE;
        const geometries = [];
        const materials = [];
        const textures = [];
        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        const productRoot = new THREE.Group();
        productRoot.name = 'UniformationGK3Root';

        // ==================== PBR MATERIALS ====================
        const matSilverBody = trackMat(new THREE.MeshStandardMaterial({
          color: 0xdedcd8,
          roughness: 0.34,
          metalness: 0.08,
          envMapIntensity: 1.08
        }));
        const matSilverRecess = trackMat(new THREE.MeshStandardMaterial({
          color: 0xcfcdca,
          roughness: 0.42,
          metalness: 0.08,
          envMapIntensity: 0.96
        }));
        const matDarkPlinth = trackMat(new THREE.MeshStandardMaterial({
          color: 0x20232a,
          roughness: 0.54,
          metalness: 0.18
        }));
        const matRubberFoot = trackMat(new THREE.MeshStandardMaterial({
          color: 0x14161a,
          roughness: 0.85,
          metalness: 0.04
        }));
        const matChamberMetal = trackMat(new THREE.MeshStandardMaterial({
          color: 0x282c34,
          roughness: 0.42,
          metalness: 0.34,
          envMapIntensity: 1.20
        }));
        const matChamberDark = trackMat(new THREE.MeshStandardMaterial({
          color: 0x1b1e24,
          roughness: 0.50,
          metalness: 0.28,
          envMapIntensity: 1.08
        }));
        const matAnodizedVat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x22262e,
          roughness: 0.36,
          metalness: 0.48,
          envMapIntensity: 1.25
        }));
        const matBrightSteel = trackMat(new THREE.MeshStandardMaterial({
          color: 0xd8dfe8,
          roughness: 0.18,
          metalness: 0.88,
          envMapIntensity: 1.45
        }));
        const matBrushedPlate = trackMat(new THREE.MeshStandardMaterial({
          color: 0xbac2cc,
          roughness: 0.28,
          metalness: 0.78,
          envMapIntensity: 1.30
        }));
        const matGlossVisor = trackMat(new THREE.MeshStandardMaterial({
          color: 0x0b0e14,
          roughness: 0.12,
          metalness: 0.10,
          envMapIntensity: 1.45
        }));
        const matScreenTile = trackMat(new THREE.MeshStandardMaterial({
          color: 0x298cff,
          roughness: 0.18,
          metalness: 0.05,
          emissive: 0x1e78eb,
          emissiveIntensity: 0.65
        }));
        const matLcdMask = trackMat(new THREE.MeshStandardMaterial({
          color: 0x151328,
          roughness: 0.10,
          metalness: 0.18,
          emissive: 0x3b1fa8,
          emissiveIntensity: 0.16,
          envMapIntensity: 1.35
        }));
        const matLiquidResin = trackMat(new THREE.MeshStandardMaterial({
          color: 0xd9b37c,
          roughness: 0.08,
          metalness: 0.02,
          envMapIntensity: 1.35
        }));
        const matDentalModel = trackMat(new THREE.MeshStandardMaterial({
          color: 0xe7c89a,
          roughness: 0.30,
          metalness: 0.02,
          envMapIntensity: 1.05
        }));
        const matPowerLed = trackMat(new THREE.MeshStandardMaterial({
          color: 0x6cb8ff,
          roughness: 0.18,
          metalness: 0.10,
          emissive: 0x2a8cff,
          emissiveIntensity: 1.15
        }));
        const matChamberLed = trackMat(new THREE.MeshStandardMaterial({
          color: 0xfff0a6,
          roughness: 0.20,
          metalness: 0.05,
          emissive: 0xffd24c,
          emissiveIntensity: 1.35
        }));
        const matGreenAccent = trackMat(new THREE.MeshStandardMaterial({
          color: 0x16a34a,
          roughness: 0.35,
          metalness: 0.18
        }));
        const matRedSwitch = trackMat(new THREE.MeshStandardMaterial({
          color: 0xd62828,
          roughness: 0.35,
          metalness: 0.08,
          emissive: 0x7a1010,
          emissiveIntensity: 0.25
        }));

        // Signature Translucent Emerald-Green 405nm UV Blocking Acrylic Hood
        const matEmeraldHood = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0x10a838,
          emissive: 0x053812,
          emissiveIntensity: 0.22,
          roughness: 0.08,
          metalness: 0.0,
          ior: 1.49,
          reflectivity: 0.65,
          clearcoat: 0.85,
          clearcoatRoughness: 0.08,
          transparent: true,
          opacity: 0.50,
          depthWrite: false,
          side: THREE.DoubleSide
        }));
        const matEmeraldRim = trackMat(new THREE.MeshStandardMaterial({
          color: 0x0a6e24,
          emissive: 0x042c0e,
          emissiveIntensity: 0.20,
          roughness: 0.20,
          metalness: 0.05,
          transparent: true,
          opacity: 0.78,
          depthWrite: false
        }));

        const visorTex = trackTex(createGk3VisorTexture(THREE));
        const matVisorFace = trackMat(new THREE.MeshStandardMaterial({
          map: visorTex,
          roughness: 0.14,
          metalness: 0.06,
          emissive: 0xffffff,
          emissiveMap: visorTex,
          emissiveIntensity: 0.28,
          envMapIntensity: 1.25
        }));

        const rearPlateTex = trackTex(createGk3RearPlateTexture(THREE));
        const matRearPlate = trackMat(new THREE.MeshStandardMaterial({
          map: rearPlateTex,
          roughness: 0.42,
          metalness: 0.22
        }));

        const cartLabelTex = trackTex(createGk3CartridgeLabelTexture(THREE));
        const matCartLabel = trackMat(new THREE.MeshStandardMaterial({
          map: cartLabelTex,
          roughness: 0.38,
          metalness: 0.08
        }));

        // ==================== 1. LOWER CHASSIS & FRONT TOUCHSCREEN VISOR ====================
        const lowerChassis = new THREE.Group();
        lowerChassis.name = 'lowerChassis';

        // 4 anti-vibration elastomer feet (Y = 0.000 .. 0.10)
        const footGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.25, 0.10, 24));
        const footOffsets = [
          [-1.82, 0.05,  1.48],
          [ 1.82, 0.05,  1.48],
          [-1.82, 0.05, -1.48],
          [ 1.82, 0.05, -1.48]
        ];
        for (const [fx, fy, fz] of footOffsets) {
          const foot = new THREE.Mesh(footGeo, matRubberFoot);
          foot.position.set(fx, fy, fz);
          lowerChassis.add(foot);
        }

        // Stepped dark plinth underbody (Y = 0.08 .. 0.25)
        const plinthGeo = trackGeo(createGk3LoftedBox(THREE, [
          { y: 0.08, w: 4.30, d: 3.58, r: 0.16 },
          { y: 0.23, w: 4.44, d: 3.72, r: 0.18 }
        ], 8));
        lowerChassis.add(new THREE.Mesh(plinthGeo, matDarkPlinth));

        // Main light-silver sculpted lower body (Y = 0.23 .. 1.94, W = 4.90, Z = [-2.075, +1.82], zero coplanar overlap with front U-frame!)
        const baseCoreGeo = trackGeo(createGk3LoftedBox(THREE, [
          { y: 0.23, w: 4.82, d: 3.84, r: 0.18, cz: -0.13 },
          { y: 0.29, w: 4.90, d: 3.90, r: 0.20, cz: -0.125 },
          { y: 1.94, w: 4.90, d: 3.90, r: 0.20, cz: -0.125 }
        ], 10));
        lowerChassis.add(new THREE.Mesh(baseCoreGeo, matSilverBody));

        // Front sculpted U-frame around recessed pocket (Z = +1.825 .. +2.075, abutting cleanly in front of baseCore!):
        const frontChinGeo = trackGeo(createGk3LoftedBox(THREE, [
          { y: 0.23, w: 4.82, d: 0.23, r: 0.08, cz: 1.95 },
          { y: 0.29, w: 4.90, d: 0.25, r: 0.09, cz: 1.95 },
          { y: 0.58, w: 4.90, d: 0.25, r: 0.09, cz: 1.95 }
        ], 8));
        lowerChassis.add(new THREE.Mesh(frontChinGeo, matSilverBody));

        // Left & right front U-pillars (Y = 0.58 .. 1.94, Z = +1.825 .. +2.075, zero overlap with frontChin!)
        const uPillarGeo = trackGeo(createGk3LoftedBox(THREE, [
          { y: 0.58, w: 0.48, d: 0.25, r: 0.08, cz: 1.95 },
          { y: 1.94, w: 0.48, d: 0.25, r: 0.08, cz: 1.95 }
        ], 6));
        for (const sx of [-1, 1]) {
          const pil = new THREE.Mesh(uPillarGeo, matSilverBody);
          pil.position.x = sx * 2.21;
          lowerChassis.add(pil);
        }

        // Recessed front tray backplate (X = [-1.98, +1.98], Y = 0.56 .. 1.94, Z = 1.90)
        const recessBack = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(3.96, 1.38, 0.04)),
          matSilverRecess
        );
        recessBack.position.set(0, 1.25, 1.855);
        lowerChassis.add(recessBack);

        // Front-left illuminated silver/blue circular power button (X = -1.62, Y = 0.96, Z = 1.93)
        const pwrBezel = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 28)),
          matBrightSteel
        );
        pwrBezel.rotation.x = Math.PI * 0.5;
        pwrBezel.position.set(-1.62, 0.96, 1.925);
        lowerChassis.add(pwrBezel);

        const pwrRing = new THREE.Mesh(
          trackGeo(new THREE.RingGeometry(0.072, 0.096, 28)),
          matPowerLed
        );
        pwrRing.position.set(-1.62, 0.96, 1.948);
        lowerChassis.add(pwrRing);

        const pwrCap = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.070, 0.070, 0.045, 24)),
          matSilverBody
        );
        pwrCap.rotation.x = Math.PI * 0.5;
        pwrCap.position.set(-1.62, 0.96, 1.926);
        lowerChassis.add(pwrCap);

        // Front-left USB-A flash drive port (X = -1.62, Y = 0.69, Z = 1.925)
        const usbShell = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.22, 0.10, 0.05)),
          matDarkPlinth
        );
        usbShell.position.set(-1.62, 0.69, 1.915);
        lowerChassis.add(usbShell);

        const usbShield = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.18, 0.072, 0.052)),
          matBrightSteel
        );
        usbShield.position.set(-1.62, 0.69, 1.918);
        lowerChassis.add(usbShield);

        const usbTongue = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.14, 0.022, 0.056)),
          matPowerLed
        );
        usbTongue.position.set(-1.62, 0.70, 1.920);
        lowerChassis.add(usbTongue);

        // Dark upper collar gasket rim around top of base (Y = 1.94 .. 2.04)
        const collarGeo = trackGeo(createGk3LoftedBox(THREE, [
          { y: 1.94, w: 4.94, d: 4.18, r: 0.22, cz: 0.0 },
          { y: 2.04, w: 4.92, d: 4.16, r: 0.22, cz: 0.0 }
        ], 10));
        lowerChassis.add(new THREE.Mesh(collarGeo, matDarkPlinth));

        // Angled Protruding Gloss-Black Front Control Visor (matching GK3's signature tilted front panel!)
        const visorGroup = new THREE.Group();
        visorGroup.name = 'controlVisor';
        visorGroup.position.set(0, 1.54, 2.10);
        visorGroup.rotation.x = -0.34; // ~19.5° upward tilt toward operator

        const visorBodyShape = createGk3RoundedRectShape(THREE, 3.90, 0.80, 0.08);
        const visorExtrude = trackGeo(new THREE.ExtrudeGeometry(visorBodyShape, {
          depth: 0.28,
          bevelEnabled: true,
          bevelThickness: 0.022,
          bevelSize: 0.022,
          bevelSegments: 4
        }));
        visorExtrude.translate(0, 0, -0.24);
        const visorHousing = new THREE.Mesh(visorExtrude, matGlossVisor);
        visorGroup.add(visorHousing);

        const visorGlass = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(3.84, 0.74, 8, 2)),
          matVisorFace
        );
        visorGlass.name = 'visorGlassFace';
        visorGlass.position.set(0, 0, 0.086);
        visorGroup.add(visorGlass);



        lowerChassis.add(visorGroup);
        productRoot.add(lowerChassis);

        // ==================== 2. OPTICAL DECK & QUICK-RELEASE RESIN VAT ====================
        const opticalDeckAndVat = new THREE.Group();
        opticalDeckAndVat.name = 'opticalDeckAndVat';

        const deckBase = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(4.62, 0.10, 2.66)),
          matChamberDark
        );
        deckBase.position.set(0, 2.06, 0.66);
        opticalDeckAndVat.add(deckBase);

        const lcdBezel = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(2.88, 0.04, 1.72)),
          matAnodizedVat
        );
        lcdBezel.position.set(-0.14, 2.12, 0.56);
        opticalDeckAndVat.add(lcdBezel);

        const lcdPanel = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(2.64, 0.025, 1.48)),
          matLcdMask
        );
        lcdPanel.position.set(-0.14, 2.14, 0.56);
        opticalDeckAndVat.add(lcdPanel);

        const resinVatGroup = new THREE.Group();
        resinVatGroup.name = 'resinVatGroup';
        const vatX = -0.14, vatZ = 0.56;

        const vatW = 3.46, vatD = 2.16, vatH = 0.44, wallT = 0.20;
        const vatFrontWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(vatW, vatH, wallT)), matAnodizedVat);
        vatFrontWall.position.set(vatX, 2.34, vatZ + (vatD - wallT) * 0.5);
        resinVatGroup.add(vatFrontWall);

        const vatBackWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(vatW, vatH, wallT)), matAnodizedVat);
        vatBackWall.position.set(vatX, 2.34, vatZ - (vatD - wallT) * 0.5);
        resinVatGroup.add(vatBackWall);

        const vatSideGeo = trackGeo(new THREE.BoxGeometry(wallT, vatH, vatD - wallT * 2));
        for (const sx of [-1, 1]) {
          const sw = new THREE.Mesh(vatSideGeo, matAnodizedVat);
          sw.position.set(vatX + sx * (vatW - wallT) * 0.5, 2.34, vatZ);
          resinVatGroup.add(sw);

          const grip = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.14, 0.14, 1.24)),
            matAnodizedVat
          );
          grip.position.set(vatX + sx * (vatW * 0.5 + 0.06), 2.48, vatZ);
          resinVatGroup.add(grip);
        }

        const nfepBadge = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.30, 0.11, 0.015)),
          matSilverBody
        );
        nfepBadge.position.set(vatX - vatW * 0.5 + 0.28, 2.28, vatZ + vatD * 0.5 + 0.008);
        resinVatGroup.add(nfepBadge);

        const resinPool = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(vatW - wallT * 2 - 0.02, 0.22, vatD - wallT * 2 - 0.02)),
          matLiquidResin
        );
        resinPool.position.set(vatX, 2.26, vatZ);
        resinVatGroup.add(resinPool);

        opticalDeckAndVat.add(resinVatGroup);
        productRoot.add(opticalDeckAndVat);

        // ==================== 3. REAR Z-COLUMN, HEATER/FILTER, CAMERA & AUTO-REFILL ====================
        const zColumnAndChamber = new THREE.Group();
        zColumnAndChamber.name = 'zColumnAndChamber';

        // Rear back slab (Z = -2.07 .. -1.16)
        const rearBackSlab = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(4.86, 4.40, 0.91)),
          matChamberMetal
        );
        rearBackSlab.position.set(0, 4.24, -1.615);
        zColumnAndChamber.add(rearBackSlab);

        // Left interior chamber wall (X = [-2.36, -0.44], Z = -1.16 .. -0.68)
        const leftWall = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(1.92, 4.26, 0.48)),
          matChamberMetal
        );
        leftWall.position.set(-1.40, 4.18, -0.92);
        zColumnAndChamber.add(leftWall);

        // Right interior chamber wall (X = [+0.36, +2.36], Z = -1.16 .. -0.68)
        const rightWall = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(2.00, 4.26, 0.48)),
          matChamberMetal
        );
        rightWall.position.set(1.36, 4.18, -0.92);
        zColumnAndChamber.add(rightWall);

        // Left & right side outer cheeks with tapered diagonal front edge matching GK3's side profile (front--1.jpg)!
        const cheekShape = new THREE.Shape();
        // In (Z, Y) plane: Z from -2.07 (rear) to -0.68 (bottom front) -> angled back to -1.28 (top front)
        cheekShape.moveTo(-2.07, 2.04);
        cheekShape.lineTo(-0.68, 2.04);
        cheekShape.lineTo(-1.28, 6.44);
        cheekShape.lineTo(-2.07, 6.44);
        cheekShape.closePath();
        const cheekExtrude = trackGeo(new THREE.ExtrudeGeometry(cheekShape, { depth: 0.11, bevelEnabled: false }));
        // ExtrudeGeometry builds in (X'=Z, Y'=Y, Z'=depth). Rotate around Y by -PI/2 so X' -> +Z, Z' -> -X!
        // Wait: at rot.y = +PI/2: local (x, y, z) -> world (z, y, -x). If we want world Z = local x, then rot.y = -PI/2 gives world (-z, y, +x)!
        for (const sx of [-1, 1]) {
          const cheek = new THREE.Mesh(cheekExtrude, matChamberMetal);
          cheek.rotation.y = -Math.PI * 0.5;
          // world X spans [-depth, 0] + pos.x => set pos.x so cheek occupies sx * [2.33, 2.44]
          cheek.position.x = sx > 0 ? 2.44 : -2.33;
          zColumnAndChamber.add(cheek);
        }

        // Top header bridge over chamber rear (Y = 6.30 .. 6.46, Z = -2.07 .. -0.68)
        const rearTopCap = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(4.86, 0.16, 1.39)),
          matChamberDark
        );
        rearTopCap.position.set(0, 6.38, -1.375);
        zColumnAndChamber.add(rearTopCap);

        // Warm-amber horizontal chamber LED light strip across upper ceiling
        const ledStrip = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(4.42, 0.045, 0.06)),
          matChamberLed
        );
        ledStrip.position.set(0, 6.24, -0.65);
        zColumnAndChamber.add(ledStrip);

        // Concentric Circular Heater / Carbon Filter Grille on Left Interior Wall
        const fanCenter = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24)),
          matDarkPlinth
        );
        fanCenter.rotation.x = Math.PI * 0.5;
        fanCenter.position.set(-1.28, 5.05, -0.675);
        zColumnAndChamber.add(fanCenter);

        for (let r = 0; r < 4; r++) {
          const rad = 0.20 + r * 0.095;
          for (let seg = 0; seg < 4; seg++) {
            const arcRing = new THREE.Mesh(
              trackGeo(new THREE.RingGeometry(rad - 0.028, rad + 0.028, 12, 1, seg * Math.PI * 0.5 + 0.16, Math.PI * 0.5 - 0.32)),
              matDarkPlinth
            );
            arcRing.position.set(-1.28, 5.05, -0.672);
            zColumnAndChamber.add(arcRing);
          }
        }

        // Row of 13 rectangular heater intake vent slots below circular fan
        const slotGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.14, 0.02));
        for (let s = 0; s < 13; s++) {
          const slot = new THREE.Mesh(slotGeo, matDarkPlinth);
          slot.position.set(-1.82 + s * 0.09, 4.28, -0.675);
          zColumnAndChamber.add(slot);
        }

        // Built-in AI Monitoring Camera Pod in lower-left chamber corner
        const camPod = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.56, 0.42, 0.30)),
          matChamberDark
        );
        camPod.position.set(-1.78, 2.74, -0.54);
        zColumnAndChamber.add(camPod);

        const camBarrel = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 24)),
          matBrightSteel
        );
        camBarrel.rotation.x = Math.PI * 0.5;
        camBarrel.position.set(-1.84, 2.74, -0.38);
        zColumnAndChamber.add(camBarrel);

        const camLens = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.072, 0.072, 0.065, 24)),
          matGlossVisor
        );
        camLens.rotation.x = Math.PI * 0.5;
        camLens.position.set(-1.84, 2.74, -0.378);
        zColumnAndChamber.add(camLens);

        // Precision Z-Axis Channel: EGH20 Linear Rail + 1204 Ball Screw
        const zBackPlate = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.80, 4.18, 0.06)),
          matDarkPlinth
        );
        zBackPlate.position.set(-0.04, 4.18, -1.12);
        zColumnAndChamber.add(zBackPlate);

        const linearRail = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.20, 3.96, 0.12)),
          matBrushedPlate
        );
        linearRail.position.set(-0.04, 4.16, -1.04);
        zColumnAndChamber.add(linearRail);

        const boltCapGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 14));
        for (let b = 0; b < 7; b++) {
          const cap = new THREE.Mesh(boltCapGeo, matGreenAccent);
          cap.rotation.x = Math.PI * 0.5;
          cap.position.set(0.11, 2.52 + b * 0.54, -0.98);
          zColumnAndChamber.add(cap);
        }

        const ballScrew = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.068, 0.068, 3.98, 24)),
          matBrightSteel
        );
        ballScrew.position.set(-0.04, 4.16, -0.88);
        zColumnAndChamber.add(ballScrew);

        const threadRingGeo = trackGeo(new THREE.TorusGeometry(0.073, 0.012, 8, 20));
        for (let t = 0; t < 38; t++) {
          const tr = new THREE.Mesh(threadRingGeo, matBrushedPlate);
          tr.rotation.x = Math.PI * 0.5;
          tr.position.set(-0.04, 2.30 + t * 0.098, -0.88);
          zColumnAndChamber.add(tr);
        }

        // 1200 ml Cuboid Auto-Feeding Resin Cartridge
        const resinCartridgeGroup = new THREE.Group();
        resinCartridgeGroup.name = 'resinCartridgeGroup';

        const cartBody = new THREE.Mesh(
          trackGeo(createGk3LoftedBox(THREE, [
            { y: 2.65, w: 1.34, d: 0.78, r: 0.10, cz: -1.48 },
            { y: 6.26, w: 1.34, d: 0.78, r: 0.10, cz: -1.48 }
          ], 6)),
          matDarkPlinth
        );
        cartBody.position.x = 1.36;
        resinCartridgeGroup.add(cartBody);

        const cartCap = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 24)),
          matDarkPlinth
        );
        cartCap.position.set(1.36, 6.45, -1.48);
        resinCartridgeGroup.add(cartCap);

        const cartLabel = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(1.12, 1.12)),
          matCartLabel
        );
        cartLabel.rotation.y = Math.PI;
        cartLabel.position.set(1.36, 4.70, -1.875);
        resinCartridgeGroup.add(cartLabel);

        const feedNozzle = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.045, 0.038, 0.28, 16)),
          matBrightSteel
        );
        feedNozzle.position.set(1.06, 2.68, -0.54);
        zColumnAndChamber.add(feedNozzle);

        zColumnAndChamber.add(resinCartridgeGroup);

        // Rear Exterior I/O, Exhaust Adapter Flange, Ethernet, Wi-Fi Antenna, IEC Power & Serial Plate
        const rearSpecMesh = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(1.75, 1.10)),
          matRearPlate
        );
        rearSpecMesh.rotation.y = Math.PI;
        rearSpecMesh.position.set(-1.10, 5.10, -2.076);
        zColumnAndChamber.add(rearSpecMesh);

        const exhaustFlange = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 28)),
          matDarkPlinth
        );
        exhaustFlange.rotation.x = Math.PI * 0.5;
        exhaustFlange.position.set(-1.25, 3.25, -2.14);
        zColumnAndChamber.add(exhaustFlange);

        const exhaustCore = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.17, 24)),
          matGlossVisor
        );
        exhaustCore.rotation.x = Math.PI * 0.5;
        exhaustCore.position.set(-1.25, 3.25, -2.145);
        zColumnAndChamber.add(exhaustCore);

        const rj45Housing = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.24, 0.22, 0.06)),
          matBrightSteel
        );
        rj45Housing.position.set(0.55, 1.05, -2.09);
        zColumnAndChamber.add(rj45Housing);

        const wifiBase = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 16)),
          matBrightSteel
        );
        wifiBase.rotation.x = Math.PI * 0.5;
        wifiBase.position.set(1.02, 1.08, -2.12);
        zColumnAndChamber.add(wifiBase);

        const wifiAntenna = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.038, 0.05, 0.92, 16)),
          matDarkPlinth
        );
        wifiAntenna.position.set(1.02, 1.50, -2.18);
        zColumnAndChamber.add(wifiAntenna);

        const iecSocket = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.52, 0.36, 0.06)),
          matDarkPlinth
        );
        iecSocket.position.set(1.68, 0.95, -2.09);
        zColumnAndChamber.add(iecSocket);

        const rockerSwitch = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.18, 0.26, 0.07)),
          matRedSwitch
        );
        rockerSwitch.position.set(1.30, 0.95, -2.095);
        zColumnAndChamber.add(rockerSwitch);

        productRoot.add(zColumnAndChamber);

        // ==================== 4. QUICK-RELEASE BUILD PLATE & PRINTED DENTAL ARCH ====================
        const buildPlateCarriage = new THREE.Group();
        buildPlateCarriage.name = 'buildPlateCarriage';

        const zArm = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.86, 0.44, 1.52)),
          matAnodizedVat
        );
        zArm.position.set(-0.14, 5.50, -0.22);
        buildPlateCarriage.add(zArm);

        const camBase = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(1.04, 0.24, 0.88)),
          matChamberDark
        );
        camBase.position.set(-0.14, 5.76, 0.48);
        buildPlateCarriage.add(camBase);

        const camLever = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.86, 0.10, 0.62)),
          matAnodizedVat
        );
        camLever.position.set(-0.14, 5.92, 0.52);
        buildPlateCarriage.add(camLever);

        const buildPlateHead = new THREE.Group();
        buildPlateHead.name = 'buildPlateHead';

        const bpRoofGeo = trackGeo(createGk3LoftedBox(THREE, [
          { y: 5.18, w: 2.66, d: 1.50, r: 0.08, cz: 0.56 },
          { y: 5.52, w: 2.58, d: 1.42, r: 0.08, cz: 0.56 },
          { y: 5.66, w: 1.32, d: 0.96, r: 0.08, cz: 0.52 }
        ], 6));
        const bpRoof = new THREE.Mesh(bpRoofGeo, matAnodizedVat);
        bpRoof.position.x = -0.14;
        buildPlateHead.add(bpRoof);

        const bpBottom = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(2.66, 0.08, 1.50)),
          matBrushedPlate
        );
        bpBottom.position.set(-0.14, 5.14, 0.56);
        buildPlateHead.add(bpBottom);

        const dentalPrintGroup = new THREE.Group();
        dentalPrintGroup.name = 'printedDentalArch';
        const px = -0.14, pz = 0.56;

        const raft = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.68, 0.72, 0.05, 28)),
          matDentalModel
        );
        raft.position.set(px, 5.075, pz);
        dentalPrintGroup.add(raft);

        const strutGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.014, 0.42, 8));
        for (let i = 0; i < 11; i++) {
          const t = i / 10;
          const ang = -Math.PI * 0.80 + t * Math.PI * 1.60;
          const archX = px + Math.sin(ang) * 0.50;
          const archZ = pz + Math.cos(ang) * 0.42 - 0.06;
          const st = new THREE.Mesh(strutGeo, matDentalModel);
          st.position.set(archX, 4.86, archZ);
          dentalPrintGroup.add(st);
        }

        const archBaseGeo = trackGeo(new THREE.TorusGeometry(0.46, 0.11, 14, 30, Math.PI * 1.25));
        const archBase = new THREE.Mesh(archBaseGeo, matDentalModel);
        archBase.rotation.x = Math.PI * 0.5;
        archBase.rotation.z = -Math.PI * 0.125;
        archBase.position.set(px, 4.62, pz - 0.04);
        dentalPrintGroup.add(archBase);

        const toothGeo = trackGeo(new THREE.SphereGeometry(0.082, 14, 12));
        for (let i = 0; i < 12; i++) {
          const t = i / 11;
          const ang = -Math.PI * 0.60 + t * Math.PI * 1.20;
          const tx = px + Math.sin(ang) * 0.46;
          const tz = pz - Math.cos(ang) * 0.46 - 0.04;
          const tooth = new THREE.Mesh(toothGeo, matDentalModel);
          tooth.scale.set(0.95, 1.35, 0.90);
          tooth.position.set(tx, 4.48, tz);
          dentalPrintGroup.add(tooth);
        }

        buildPlateHead.add(dentalPrintGroup);
        buildPlateCarriage.add(buildPlateHead);
        productRoot.add(buildPlateCarriage);

        // ==================== 5. HINGED EMERALD-GREEN TRANSLUCENT UV HOOD ====================
        // Pivoted around circular side hinge hubs at (Y = 4.88, Z = -1.16) matching GK3's angled side seam!
        const hingeY = 4.88;
        const hingeZ = -1.16;

        const hubDiscGeo = trackGeo(new THREE.CylinderGeometry(0.30, 0.30, 0.06, 28));
        const hubBoltGeo = trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.07, 12));
        for (const sx of [-1, 1]) {
          const hub = new THREE.Mesh(hubDiscGeo, matDarkPlinth);
          hub.rotation.z = Math.PI * 0.5;
          hub.position.set(sx * 2.455, hingeY, hingeZ);
          zColumnAndChamber.add(hub);

          for (let b = 0; b < 4; b++) {
            const ba = (b / 4) * Math.PI * 2 + Math.PI * 0.25;
            const bolt = new THREE.Mesh(hubBoltGeo, matBrightSteel);
            bolt.rotation.z = Math.PI * 0.5;
            bolt.position.set(sx * 2.462, hingeY + Math.sin(ba) * 0.14, hingeZ + Math.cos(ba) * 0.14);
            zColumnAndChamber.add(bolt);
          }
        }

        const hingedUvHood = new THREE.Group();
        hingedUvHood.name = 'hingedUvHood';
        hingedUvHood.position.set(0, hingeY, hingeZ);

        // World bounds when closed: X = [-2.44, +2.44], Y = [2.04, 6.50], front Z = +2.06, rear diagonal Z = -0.68 (bottom) -> -1.28 (top)
        const hoodW = 4.88;
        const hoodY0 = 2.04 - hingeY; // -2.84
        const hoodY1 = 6.50 - hingeY; // +1.62
        const hoodH = hoodY1 - hoodY0;
        const hoodFrontZ = 2.06 - hingeZ; // +3.22
        const hoodRearBottomZ = -0.68 - hingeZ; // +0.48
        const hoodRearTopZ = -1.28 - hingeZ;    // -0.12
        const hoodT = 0.065;

        // Front emerald acrylic window
        const hoodFront = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(hoodW - 0.14, hoodH - 0.08, hoodT)),
          matEmeraldHood
        );
        hoodFront.position.set(0, (hoodY0 + hoodY1) * 0.5, hoodFrontZ - hoodT * 0.5);
        hoodFront.renderOrder = 4;
        hingedUvHood.add(hoodFront);

        // Top emerald acrylic roof (spanning hoodRearTopZ .. hoodFrontZ)
        const topDepth = hoodFrontZ - hoodRearTopZ - 0.06;
        const hoodTop = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(hoodW - 0.14, hoodT, topDepth)),
          matEmeraldHood
        );
        hoodTop.position.set(0, hoodY1 - hoodT * 0.5, (hoodRearTopZ + hoodFrontZ) * 0.5);
        hoodTop.renderOrder = 4;
        hingedUvHood.add(hoodTop);

        // Left & right sculpted trapezoidal emerald side wings with rounded rear hinge ear (matching front--1.jpg!)
        const sideWingShape = new THREE.Shape();
        sideWingShape.moveTo(hoodRearBottomZ, hoodY0 + 0.04);
        sideWingShape.lineTo(hoodFrontZ - 0.04, hoodY0 + 0.04);
        sideWingShape.lineTo(hoodFrontZ - 0.04, hoodY1 - 0.04);
        sideWingShape.lineTo(hoodRearTopZ, hoodY1 - 0.04);
        // Curve smoothly around hinge hub at (0, 0) in local (Z, Y)
        sideWingShape.quadraticCurveTo(-0.34, 0.0, hoodRearBottomZ, hoodY0 + 0.04);

        const sideWingGeo = trackGeo(new THREE.ExtrudeGeometry(sideWingShape, { depth: hoodT, bevelEnabled: false }));
        for (const sx of [-1, 1]) {
          const hs = new THREE.Mesh(sideWingGeo, matEmeraldHood);
          hs.rotation.y = -Math.PI * 0.5;
          hs.position.x = sx > 0 ? (hoodW * 0.5) : -(hoodW * 0.5 - hoodT);
          hs.renderOrder = 4;
          hingedUvHood.add(hs);
        }

        // Rounded optical acrylic corner moldings
        const vCornerGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, hoodH - 0.06, 16, 1, false, 0, Math.PI * 0.5));
        for (const sx of [-1, 1]) {
          const vc = new THREE.Mesh(vCornerGeo, matEmeraldRim);
          vc.position.set(sx * (hoodW * 0.5 - 0.08), (hoodY0 + hoodY1) * 0.5, hoodFrontZ - 0.08);
          vc.rotation.y = sx > 0 ? 0 : -Math.PI * 0.5;
          vc.renderOrder = 5;
          hingedUvHood.add(vc);
        }

        const hCornerGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, hoodW - 0.12, 16));
        const topFrontBeam = new THREE.Mesh(hCornerGeo, matEmeraldRim);
        topFrontBeam.rotation.z = Math.PI * 0.5;
        topFrontBeam.position.set(0, hoodY1 - 0.07, hoodFrontZ - 0.07);
        topFrontBeam.renderOrder = 5;
        hingedUvHood.add(topFrontBeam);

        const bottomFrontLip = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(hoodW - 0.16, 0.07, 0.09)),
          matEmeraldRim
        );
        bottomFrontLip.position.set(0, hoodY0 + 0.035, hoodFrontZ - 0.05);
        bottomFrontLip.renderOrder = 5;
        hingedUvHood.add(bottomFrontLip);

        productRoot.add(hingedUvHood);

        // Enable cast/receive shadows on opaque structural parts
        productRoot.traverse((child) => {
          if (child.isMesh && !child.material.transparent) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // ==================== EXPLODED / HINGED UV HOOD OPEN ANIMATION ====================
        const vatRestPos = resinVatGroup.position.clone();
        const cartRestPos = resinCartridgeGroup.position.clone();
        const plateRestPos = buildPlateHead.position.clone();
        const visorRestPos = visorGroup.position.clone();
        let lidFactor = 0;
        let expFactor = 0;

        function applyPose() {
          const hoodOpen = Math.max(lidFactor, expFactor);
          hingedUvHood.rotation.x = -hoodOpen * 0.88;
          const k = expFactor;
          resinVatGroup.position.set(vatRestPos.x, vatRestPos.y + k * 0.18, vatRestPos.z + k * 1.45);
          resinCartridgeGroup.position.set(cartRestPos.x, cartRestPos.y + k * 1.35, cartRestPos.z);
          buildPlateHead.position.set(plateRestPos.x, plateRestPos.y - k * 0.28, plateRestPos.z + k * 0.85);
          visorGroup.position.set(visorRestPos.x, visorRestPos.y, visorRestPos.z + k * 0.35);
        }

        function setLidOpenFactor(t) {
          lidFactor = Math.max(0, Math.min(1, t));
          applyPose();
        }

        function setExplodeFactor(t) {
          expFactor = Math.max(0, Math.min(1, t));
          applyPose();
        }

        function dispose() {
          for (const g of geometries) g.dispose();
          for (const m of materials) m.dispose();
          for (const tx of textures) tx.dispose();
        }

        return {
          productRoot,
          assemblies: {
            lowerChassis,
            opticalDeckAndVat,
            zColumnAndChamber,
            buildPlateCarriage,
            hingedUvHood
          },
          setLidOpenFactor,
          setExplodeFactor,
          dispose
        };
      }

      window.DentalAssetLibrary.assets['uniformation-gk3'] = {
        id: 'uniformation-gk3',
        code: 'PRINTER-01',
        name: 'UniFormation GK3 Resin 3D Printer',
        category: '16K MSLA Dental Resin 3D Printer (Table 3 · Dedicated Printing Bench)',
        capabilityNote: '9.6" 16K (15120×6230, 14×19 µm) 405 nm COB MSLA printer with smart PTC chamber heating, hinged emerald UV hood, and 1200 ml auto-feeding resin cartridge.',
        tableId: 'table-printers',
        realDimensionsMm: '392 × 332 × 520 mm',
        benchScale: 1.00,
        benchPosition: [32.40, 0.0, -0.10],
        subAssemblies: ['lowerChassis', 'opticalDeckAndVat', 'zColumnAndChamber', 'buildPlateCarriage', 'hingedUvHood'],
        createAsset: () => createUniformationGK3Product(THREE)
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetUniformationGK3();

/** Asset records this component registered, keyed by asset id. */
export const assets = Object.fromEntries(
  Object.keys(__legacyLib.assets)
    .filter((id) => !__assetIdsBefore.has(id))
    .map((id) => [id, __legacyLib.assets[id]]),
);

/** Anything else it attached to the library object (for example LabWorkbench). */
export const extras = Object.fromEntries(
  Object.keys(__legacyLib)
    .filter((key) => !__libKeysBefore.has(key))
    .map((key) => [key, __legacyLib[key]]),
);
