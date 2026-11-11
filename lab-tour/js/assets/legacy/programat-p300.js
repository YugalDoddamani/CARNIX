// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2).html
// Component : <script id="component-4-asset-programat-p300">
// sha256    : 81eaaec52ca0c820b347491767fc6cc62daf452e68dcd03e4871668dc5708cdf
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────

    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetProgramatP300 = function () {
      const { THREE, RoundedBoxGeometry } = window.__THREE_BUNDLE__;

      function sampleUPlanform(r = 1.54, zCenter = 0.18, zRear = -1.60, rRear = 1.44, arcSegs = 36, sideSegs = 8) {
        const pts = [];
        for (let i = 0; i <= arcSegs; i++) {
          const theta = (i / arcSegs) * Math.PI;
          pts.push({
            x: Math.cos(theta) * r,
            z: zCenter + Math.sin(theta) * r
          });
        }
        const cornerR = 0.16;
        for (let i = 1; i <= sideSegs; i++) {
          const t = i / sideSegs;
          pts.push({
            x: -(r + (rRear - r) * t),
            z: zCenter + ((zRear + cornerR) - zCenter) * t
          });
        }
        for (let i = 1; i <= 4; i++) {
          const a = Math.PI + (i / 4) * (Math.PI * 0.5);
          pts.push({
            x: -(rRear - cornerR) + Math.cos(a) * cornerR,
            z: (zRear + cornerR) + Math.sin(a) * cornerR
          });
        }
        for (let i = 0; i <= 4; i++) {
          const a = -Math.PI * 0.5 + (i / 4) * (Math.PI * 0.5);
          pts.push({
            x: (rRear - cornerR) + Math.cos(a) * cornerR,
            z: (zRear + cornerR) + Math.sin(a) * cornerR
          });
        }
        for (let i = 1; i < sideSegs; i++) {
          const t = 1 - i / sideSegs;
          pts.push({
            x: r + (rRear - r) * t,
            z: zCenter + ((zRear + cornerR) - zCenter) * t
          });
        }
        return pts;
      }

      function createSmoothULoft(slices, capBottom = true, capTop = true) {
        const rings = slices.map((s) => sampleUPlanform(s.r, s.zCenter, s.zRear, s.rRear));
        const N = rings[0].length;
        const S = slices.length;
        const pos = [];
        const idx = [];

        for (let s = 0; s < S; s++) {
          const yBase = slices[s].y;
          const rearDrop = slices[s].rearDrop || 0;
          const ring = rings[s];
          for (let i = 0; i < N; i++) {
            let yv = yBase;
            if (rearDrop > 0 && ring[i].z < -0.30) {
              const tz = Math.min(1, (-0.30 - ring[i].z) / 1.32);
              yv -= rearDrop * (tz * tz * (3 - 2 * tz));
            }
            pos.push(ring[i].x, yv, ring[i].z);
          }
        }

        for (let s = 0; s < S - 1; s++) {
          const r0 = s * N;
          const r1 = (s + 1) * N;
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            idx.push(r0 + i, r1 + i, r1 + iN, r0 + i, r1 + iN, r0 + iN);
          }
        }

        if (capBottom) {
          const base = pos.length / 3;
          const y0 = slices[0].y;
          pos.push(0, y0, slices[0].zCenter - 0.3);
          for (let i = 0; i < N; i++) pos.push(rings[0][i].x, y0, rings[0][i].z);
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            idx.push(base, base + 1 + i, base + 1 + iN);
          }
        }

        if (capTop) {
          const base = pos.length / 3;
          const yL = slices[S - 1].y;
          const rearDrop = slices[S - 1].rearDrop || 0;
          pos.push(0, yL, slices[S - 1].zCenter);
          for (let i = 0; i < N; i++) {
            let yv = yL;
            if (rearDrop > 0 && rings[S - 1][i].z < -0.30) {
              const tz = Math.min(1, (-0.30 - rings[S - 1][i].z) / 1.32);
              yv -= rearDrop * (tz * tz * (3 - 2 * tz));
            }
            pos.push(rings[S - 1][i].x, yv, rings[S - 1][i].z);
          }
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            idx.push(base, base + 1 + iN, base + 1 + i);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
      }

      function buildCoolingTrayPoints(offset = 0) {
        const hwRear = 1.66 + offset;
        const hwMax = 2.34 + offset;
        const zBack = -1.24 - offset * 0.4;
        const zWide = 0.56;
        const zFront = 1.88 + offset;

        const shape = new THREE.Shape();
        shape.moveTo(-hwRear, zBack);
        shape.bezierCurveTo(-hwMax * 0.96, zBack + 0.45, -hwMax, zWide - 0.45, -hwMax, zWide);
        shape.bezierCurveTo(-hwMax, zWide + 0.78, -1.62 - offset * 0.7, zFront, 0, zFront);
        shape.bezierCurveTo(1.62 + offset * 0.7, zFront, hwMax, zWide + 0.78, hwMax, zWide);
        shape.bezierCurveTo(hwMax, zWide - 0.45, hwMax * 0.96, zBack + 0.45, hwRear, zBack);
        shape.lineTo(-hwRear, zBack);
        return shape;
      }

      function buildRearYokeGeo() {
        const zSlices = [
          { z: -1.40, hw: 1.50, yBot: 0.16, ySide: 2.94, yPeak: 3.30 },
          { z: -1.62, hw: 1.58, yBot: 0.15, ySide: 2.92, yPeak: 3.28 },
          { z: -2.05, hw: 1.58, yBot: 0.15, ySide: 2.72, yPeak: 3.08 },
          { z: -2.48, hw: 1.54, yBot: 0.16, ySide: 2.48, yPeak: 2.84 },
          { z: -2.56, hw: 1.50, yBot: 0.18, ySide: 2.42, yPeak: 2.78 }
        ];
        const ringPts = (sl) => {
          const pts = [];
          const topSteps = 18;
          pts.push([sl.hw, sl.yBot]);
          pts.push([sl.hw, sl.ySide - 0.12]);
          for (let i = 0; i <= topSteps; i++) {
            const u = 1 - (2 * i) / topSteps;
            const x = u * sl.hw;
            const y = sl.ySide + (sl.yPeak - sl.ySide) * (1 - u * u);
            pts.push([x, y]);
          }
          pts.push([-sl.hw, sl.ySide - 0.12]);
          pts.push([-sl.hw, sl.yBot]);
          return pts;
        };

        const rings = zSlices.map(ringPts);
        const N = rings[0].length;
        const S = zSlices.length;
        const pos = [];
        const idx = [];

        for (let s = 0; s < S; s++) {
          for (let i = 0; i < N; i++) {
            pos.push(rings[s][i][0], rings[s][i][1], zSlices[s].z);
          }
        }
        for (let s = 0; s < S - 1; s++) {
          const r0 = s * N;
          const r1 = (s + 1) * N;
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            idx.push(r0 + i, r1 + i, r1 + iN, r0 + i, r1 + iN, r0 + iN);
          }
        }
        const fBase = pos.length / 3;
        pos.push(0, 1.5, zSlices[0].z);
        for (let i = 0; i < N; i++) pos.push(rings[0][i][0], rings[0][i][1], zSlices[0].z);
        for (let i = 0; i < N; i++) idx.push(fBase, fBase + 1 + i, fBase + 1 + ((i + 1) % N));

        const bBase = pos.length / 3;
        pos.push(0, 1.4, zSlices[S - 1].z);
        for (let i = 0; i < N; i++) pos.push(rings[S - 1][i][0], rings[S - 1][i][1], zSlices[S - 1].z);
        for (let i = 0; i < N; i++) idx.push(bBase, bBase + 1 + ((i + 1) % N), bBase + 1 + i);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
      }

      /**
       * Vibrant yellow-green backlit Programat P300 LCD texture (`Individual | 20°C`, `P 10`).
       */
      function createP300GreenLcdTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 880;
        canvas.height = 460;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, 460);
        grad.addColorStop(0, '#98ea2f');
        grad.addColorStop(1, '#79cf1e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 880, 460);

        ctx.strokeStyle = '#1e3c0a';
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, 864, 444);

        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(8, 96);
        ctx.lineTo(872, 96);
        ctx.moveTo(210, 96);
        ctx.lineTo(210, 452);
        ctx.stroke();

        ctx.fillStyle = '#193508';
        ctx.font = '700 44px "Courier New", Consolas, monospace';
        ctx.fillText('Individual', 34, 66);
        ctx.fillText('20°C', 690, 66);

        // Left muffle status icon
        ctx.strokeRect(52, 140, 106, 150);
        ctx.fillRect(74, 250, 62, 22);

        // Main program number + ramp step glyph
        ctx.font = '700 56px "Courier New", Consolas, monospace';
        ctx.fillText('P 10', 250, 178);

        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(255, 365);
        ctx.lineTo(365, 365);
        ctx.lineTo(435, 315);
        ctx.stroke();

        ctx.font = '700 36px "Courier New", Consolas, monospace';
        ctx.fillText('11:52', 710, 418);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Programat P300 front membrane graphic overlay (firing curve graph, 4x3 numeric pad,
       * `Programat P300` header, and `ivoclar vivadent` sunburst mark).
       */
      function createP300MembraneTexture() {
        const W = 1024;
        const H = 840; // Maps to membrane plane 2.04 x 1.68 (501.96 px/unit)
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Clean off-white membrane background
        ctx.fillStyle = '#eceef2';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#cfd5df';
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, W - 20, H - 20);

        // Central cool-grey functional zone
        ctx.fillStyle = '#bfc5ce';
        ctx.fillRect(46, 44, 690, 616);

        // Right-top `Programat P300` branding
        ctx.fillStyle = '#262d38';
        ctx.font = '700 28px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('Programat', 762, 82);
        ctx.font = '600 24px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('P300', 816, 112);

        // Below-LCD Red/Blue Firing Curve Graph (x: 145..465, y: 385..625)
        ctx.strokeStyle = '#6c7482';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(155, 610);
        ctx.lineTo(465, 610);
        ctx.moveTo(155, 610);
        ctx.lineTo(155, 400);
        ctx.stroke();

        // Red heating slope
        ctx.strokeStyle = '#c9262e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(175, 595);
        ctx.lineTo(235, 595);
        ctx.lineTo(315, 435);
        ctx.lineTo(378, 435);
        ctx.stroke();

        // Blue cooling slope
        ctx.strokeStyle = '#2555a8';
        ctx.beginPath();
        ctx.moveTo(378, 435);
        ctx.lineTo(440, 545);
        ctx.stroke();

        // Small parameter circles along curve (B, S, t, T, H)
        ctx.fillStyle = '#9aa2ae';
        ctx.strokeStyle = '#59616e';
        ctx.lineWidth = 2.5;
        for (const [px, py, lbl] of [
          [205, 595, 'B'], [265, 525, 't'], [315, 435, 'T'], [378, 435, 'H'], [425, 520, 'C']
        ]) {
          ctx.beginPath();
          ctx.arc(px, py, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#1f252e';
          ctx.font = '700 16px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lbl, px, py);
          ctx.fillStyle = '#9aa2ae';
        }

        // 4x3 circular membrane numeric keypad on right half of grey zone (x: 515..695, y: 410..625)
        const numRows = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['.', '0', 'C']];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            const nx = 528 + c * 68;
            const ny = 420 + r * 58;
            ctx.beginPath();
            ctx.arc(nx, ny, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#aeb5c0';
            ctx.fill();
            ctx.strokeStyle = '#7b8390';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#232934';
            ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(numRows[r][c], nx, ny);
          }
        }

        // Bottom-right `ivoclar vivadent` sunburst dot arc + wordmark
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const lx = 835, ly = 720;
        for (let a = 0; a < 9; a++) {
          const ang = Math.PI + (a / 8) * Math.PI;
          ctx.beginPath();
          ctx.arc(lx + Math.cos(ang) * 34, ly + Math.sin(ang) * 20, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#2d63b8';
          ctx.fill();
        }
        ctx.fillStyle = '#1f2938';
        ctx.font = '700 22px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('ivoclar', 782, 742);
        ctx.fillText('vivadent', 775, 766);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Sub-pixel-aligned legend sheet sitting cleanly on top of the raised 3D round/pill keys.
       */
      function createP300KeyLegendsTexture() {
        const W = 1024;
        const H = 840; // Plane size: 2.048 x 1.680 -> exact 500 px per unit!
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        const toX = (x) => (x + 1.024) * 500;
        const toY = (y) => (0.840 - y) * 500;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Left 3 soft keys at x = -0.78, y = 0.60, 0.42, 0.24
        ctx.fillStyle = '#1e242e';
        ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
        ctx.fillText('0', toX(-0.78), toY(0.60));
        ctx.fillText('i', toX(-0.78), toY(0.42));
        ctx.fillText('♪', toX(-0.78), toY(0.24));

        // Right 2 clamshell open/close keys at x = +0.72, y = 0.46, 0.27
        ctx.fillText('◿', toX(0.72), toY(0.46));
        ctx.fillText('◺', toX(0.72), toY(0.27));

        // STOP (red, y = -0.02) & START (green, y = -0.28 + glowing LED dot!)
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
        ctx.fillText('STOP', toX(0.72), toY(-0.02));
        ctx.font = '700 24px "Segoe UI", Arial, sans-serif';
        ctx.fillText('START', toX(0.72), toY(-0.26));

        // Glowing green status LED dot inside bottom of START key (Photo 3!)
        ctx.beginPath();
        ctx.arc(toX(0.72), toY(-0.34), 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#7dff6b';
        ctx.fill();

        // Bottom row pills: [ <  > ] at (-0.52, -0.62), [ P ] at (-0.11, -0.62), [ -  + ] at (0.30, -0.62)
        ctx.fillStyle = '#1b2029';
        ctx.font = '700 24px "Segoe UI", Arial, sans-serif';
        ctx.fillText('◄     ►', toX(-0.52), toY(-0.62));
        ctx.fillText('P', toX(-0.11), toY(-0.62));
        ctx.fillText('−     +', toX(0.30), toY(-0.62));

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Twin side-by-side ISO yellow caution triangles (`!` + `SSS` hot surface) on front clamshell.
       */
      function createDualWarnDecalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 256);

        function drawTri(cx) {
          ctx.beginPath();
          ctx.moveTo(cx, 38);
          ctx.lineTo(cx + 88, 206);
          ctx.lineTo(cx - 88, 206);
          ctx.closePath();
          ctx.fillStyle = '#ecd026';
          ctx.fill();
          ctx.lineWidth = 12;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#181a1f';
          ctx.stroke();
        }

        // Left `!` warning triangle
        drawTri(142);
        ctx.fillStyle = '#181a1f';
        ctx.font = '900 104px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 142, 188);

        // Right `SSS` hot-surface triangle
        drawTri(370);
        ctx.strokeStyle = '#181a1f';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(328, 184);
        ctx.lineTo(412, 184);
        ctx.stroke();
        for (const dx of [-20, 0, 20]) {
          ctx.beginPath();
          ctx.moveTo(370 + dx, 170);
          ctx.bezierCurveTo(370 + dx - 9, 150, 370 + dx + 9, 134, 370 + dx - 2, 114);
          ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Rear `Programat P300` CE / serial rating plate texture (matching IMG_da510e85).
       */
      function createRearSpecLabelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f3f5f8';
        ctx.fillRect(0, 0, 256, 512);
        ctx.strokeStyle = '#363c46';
        ctx.lineWidth = 5;
        ctx.strokeRect(6, 6, 244, 500);

        ctx.fillStyle = '#171b22';
        ctx.font = '700 26px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Programat P300', 18, 46);
        ctx.font = '600 17px "Courier New", monospace';
        ctx.fillText('200-240V 50/60Hz', 18, 84);
        ctx.fillText('Max 1200°C  8.5A', 18, 112);
        ctx.fillText('Ivoclar Vivadent', 18, 150);

        ctx.font = '800 44px "Segoe UI", Arial, sans-serif';
        ctx.fillText('CE', 168, 225);

        // Barcode stripes at bottom
        for (let i = 0; i < 34; i++) {
          const x = 22 + i * 6.2;
          const w = (i % 3 === 0) ? 3.6 : 1.8;
          ctx.fillRect(x, 360, w, 56);
          ctx.fillRect(x, 435, w, 46);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createProgramatP300Product() {
        const geometries = [];
        const materials = [];
        const textures = [];
        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        const matWhiteEnamel = trackMat(new THREE.MeshStandardMaterial({
          color: 0xf2f3f5,
          metalness: 0.05,
          roughness: 0.30
        }));
        const matDarkGraphite = trackMat(new THREE.MeshStandardMaterial({
          color: 0x353941,
          metalness: 0.24,
          roughness: 0.44
        }));
        const matTrayGraphite = trackMat(new THREE.MeshStandardMaterial({
          color: 0x2e3239,
          metalness: 0.28,
          roughness: 0.42
        }));
        const matChromeRail = trackMat(new THREE.MeshStandardMaterial({
          color: 0xdce2ea,
          metalness: 0.88,
          roughness: 0.14
        }));
        const matRearMetal = trackMat(new THREE.MeshStandardMaterial({
          color: 0xbac0c9,
          metalness: 0.56,
          roughness: 0.34
        }));
        const matCavityBlack = trackMat(new THREE.MeshStandardMaterial({
          color: 0x0d1015,
          metalness: 0.10,
          roughness: 0.58
        }));
        const matCeramicWhite = trackMat(new THREE.MeshStandardMaterial({
          color: 0xf5f3ee,
          metalness: 0.02,
          roughness: 0.84
        }));
        const matMuffleWarm = trackMat(new THREE.MeshStandardMaterial({
          color: 0xc99c82,
          metalness: 0.05,
          roughness: 0.72
        }));
        const matKeyPillGrey = trackMat(new THREE.MeshStandardMaterial({
          color: 0x9098a4,
          metalness: 0.12,
          roughness: 0.38
        }));
        const matKeyStartGreen = trackMat(new THREE.MeshStandardMaterial({
          color: 0x1e8b4d,
          metalness: 0.10,
          roughness: 0.32
        }));
        const matKeyStopRed = trackMat(new THREE.MeshStandardMaterial({
          color: 0xc8282f,
          metalness: 0.10,
          roughness: 0.32
        }));

        const productRoot = new THREE.Group();
        productRoot.name = 'productRoot';
        const dummy = new THREE.Object3D();

        /* ====================================================================
           1. BASE ASSEMBLY + SCULPTED REAR HINGE SPINE & I/O PANEL
           ==================================================================== */
        const baseAssembly = new THREE.Group();
        baseAssembly.name = 'baseAssembly';

        const footGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.34, 0.16, 28));
        for (const [fx, fz] of [[-1.02, 0.65], [1.02, 0.65], [-1.12, -1.95], [1.12, -1.95]]) {
          const foot = new THREE.Mesh(footGeo, matCavityBlack);
          foot.position.set(fx, 0.08, fz);
          baseAssembly.add(foot);
        }

        const lowerWhiteBody = new THREE.Mesh(
          trackGeo(createSmoothULoft([
            { y: 0.16, r: 1.40, zCenter: 0.12, zRear: -1.44, rRear: 1.34 },
            { y: 0.24, r: 1.46, zCenter: 0.14, zRear: -1.46, rRear: 1.40 },
            { y: 1.94, r: 1.48, zCenter: 0.16, zRear: -1.46, rRear: 1.42 },
            { y: 1.98, r: 1.45, zCenter: 0.16, zRear: -1.46, rRear: 1.40 }
          ], true, true)),
          matWhiteEnamel
        );
        lowerWhiteBody.name = 'lowerWhiteBody';
        baseAssembly.add(lowerWhiteBody);

        const flankLouvers = [];
        for (const sgn of [-1, 1]) {
          for (let col = 0; col < 6; col++) {
            const zc = -1.12 + col * 0.24;
            const tSide = Math.max(0, Math.min(1, (0.15 - zc) / 1.60));
            const xc = sgn * (1.475 - 0.055 * tSide);
            const rowsHere = col < 2 ? 3 : (col < 4 ? 4 : 5);
            for (let row = 0; row < rowsHere; row++) {
              flankLouvers.push({ x: xc, y: 1.85 - row * 0.072, z: zc });
            }
          }
        }
        const flankSlotGeo = trackGeo(new THREE.BoxGeometry(0.03, 0.036, 0.19));
        const flankSlotsMesh = new THREE.InstancedMesh(flankSlotGeo, matCavityBlack, flankLouvers.length);
        for (let i = 0; i < flankLouvers.length; i++) {
          const s = flankLouvers[i];
          dummy.position.set(s.x, s.y, s.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          flankSlotsMesh.setMatrixAt(i, dummy.matrix);
        }
        flankSlotsMesh.instanceMatrix.needsUpdate = true;
        baseAssembly.add(flankSlotsMesh);

        // Rear Hinge Column & Brushed-Metal I/O Panel
        const rearHingeColumn = new THREE.Group();
        rearHingeColumn.name = 'rearHingeColumn';

        const rearDarkYoke = new THREE.Mesh(trackGeo(buildRearYokeGeo()), matDarkGraphite);
        rearDarkYoke.name = 'rearDarkYoke';
        rearHingeColumn.add(rearDarkYoke);

        const throatPlateGeo = trackGeo(new THREE.BoxGeometry(0.84, 0.70, 0.06));
        const hingeArmGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.84, 0.28));
        for (const sgn of [-1, 1]) {
          const throatPlate = new THREE.Mesh(throatPlateGeo, matRearMetal);
          throatPlate.position.set(sgn * 0.74, 2.48, -1.36);
          rearHingeColumn.add(throatPlate);

          const hingeArm = new THREE.Mesh(hingeArmGeo, matCavityBlack);
          hingeArm.position.set(sgn * 0.22, 2.52, -1.42);
          rearHingeColumn.add(hingeArm);
        }

        const ioShape = new THREE.Shape();
        ioShape.moveTo(-1.18, 0.20);
        ioShape.lineTo(1.18, 0.20);
        ioShape.lineTo(1.18, 2.28);
        ioShape.quadraticCurveTo(0.0, 2.62, -1.18, 2.28);
        ioShape.closePath();

        const ioPlateGeo = trackGeo(new THREE.ExtrudeGeometry(ioShape, {
          depth: 0.024,
          bevelEnabled: false,
          curveSegments: 24
        }));
        ioPlateGeo.translate(0, 0, -2.602);
        const rearIoPlate = new THREE.Mesh(ioPlateGeo, matRearMetal);
        rearIoPlate.name = 'rearIoPlate';
        rearHingeColumn.add(rearIoPlate);

        const rearSlots = [];
        for (const sgn of [-1, 1]) {
          for (let i = 0; i < 10; i++) {
            const sx = sgn * (0.28 + i * 0.080);
            const archDrop = (sx * sx) * 0.13;
            rearSlots.push({ x: sx, y: 2.26 - archDrop });
            rearSlots.push({ x: sx, y: 1.96 - archDrop });
          }
        }
        const rSlotGeo = trackGeo(new THREE.BoxGeometry(0.036, 0.20, 0.018));
        const rearSlotsMesh = new THREE.InstancedMesh(rSlotGeo, matCavityBlack, rearSlots.length);
        for (let i = 0; i < rearSlots.length; i++) {
          dummy.position.set(rearSlots[i].x, rearSlots[i].y, -2.612);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          rearSlotsMesh.setMatrixAt(i, dummy.matrix);
        }
        rearSlotsMesh.instanceMatrix.needsUpdate = true;
        rearHingeColumn.add(rearSlotsMesh);

        const rScrewGeo = trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 12));
        rScrewGeo.rotateX(Math.PI * 0.5);
        for (const [sx, sy] of [[-1.26, 2.02], [-1.26, 1.18], [-1.26, 0.34], [1.26, 2.02], [1.26, 1.18], [1.26, 0.34], [0, 2.54]]) {
          const sc = new THREE.Mesh(rScrewGeo, matChromeRail);
          sc.position.set(sx, sy, -2.610);
          rearHingeColumn.add(sc);
        }

        const rocker = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(0.22, 0.36, 0.045, 2, 0.02)),
          matCavityBlack
        );
        rocker.position.set(0.88, 1.16, -2.622);
        rearHingeColumn.add(rocker);

        const fuseGeo = trackGeo(new THREE.CylinderGeometry(0.080, 0.080, 0.03, 18));
        fuseGeo.rotateX(Math.PI * 0.5);
        for (const [fx, fy] of [[0.76, 0.42], [0.54, 0.42]]) {
          const fc = new THREE.Mesh(fuseGeo, matCavityBlack);
          fc.position.set(fx, fy, -2.618);
          rearHingeColumn.add(fc);
        }

        const rearSpecTex = trackTex(createRearSpecLabelTexture());
        const rearSpecMat = trackMat(new THREE.MeshBasicMaterial({ map: rearSpecTex }));
        const specSticker = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(0.54, 0.96)),
          rearSpecMat
        );
        specSticker.name = 'rearSpecDecal';
        specSticker.rotation.y = Math.PI;
        specSticker.position.set(-0.14, 1.14, -2.606);
        rearHingeColumn.add(specSticker);

        const serialTag = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.40, 0.20, 0.012)),
          matWhiteEnamel
        );
        serialTag.position.set(0.0, 2.18, -2.610);
        rearHingeColumn.add(serialTag);

        const connBayFrame = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.58, 1.32, 0.024)),
          matDarkGraphite
        );
        connBayFrame.position.set(-0.80, 1.00, -2.612);
        rearHingeColumn.add(connBayFrame);

        const iecGeo = trackGeo(new RoundedBoxGeometry(0.40, 0.28, 0.045, 2, 0.02));
        for (const iy of [1.12, 0.62]) {
          const iec = new THREE.Mesh(iecGeo, matCavityBlack);
          iec.position.set(-0.80, iy, -2.624);
          rearHingeColumn.add(iec);
        }

        const vacBarb = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 0.20, 16)),
          matChromeRail
        );
        vacBarb.rotation.x = Math.PI * 0.5;
        vacBarb.position.set(-0.68, 1.48, -2.66);
        rearHingeColumn.add(vacBarb);

        baseAssembly.add(rearHingeColumn);
        productRoot.add(baseAssembly);

        /* ====================================================================
           2. SWEPT DARK-GRAPHITE COOLING TRAY & CHROME WIRE GUARD RAIL
           ==================================================================== */
        const coolingTray = new THREE.Group();
        coolingTray.name = 'coolingTray';
        const trayRestPos = new THREE.Vector3(0, 1.99, 0);
        coolingTray.position.copy(trayRestPos);

        const trayGeo = trackGeo(new THREE.ExtrudeGeometry(buildCoolingTrayPoints(0), {
          depth: 0.046,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.008,
          bevelSegments: 2,
          curveSegments: 28,
          steps: 1
        }));
        trayGeo.rotateX(Math.PI * 0.5);
        trayGeo.translate(0, 0.046, 0);
        trayGeo.computeVertexNormals();
        const trayPlate = new THREE.Mesh(trayGeo, matTrayGraphite);
        trayPlate.name = 'coolingTrayPlate';
        coolingTray.add(trayPlate);

        const railShapePts = buildCoolingTrayPoints(0.115).getPoints(72);
        const railCurvePts = [];
        for (const p of railShapePts) {
          if (p.y <= -1.25 && Math.abs(p.x) < 1.65) continue;
          railCurvePts.push(new THREE.Vector3(p.x, 0.025, p.y));
        }
        const railCurve = new THREE.CatmullRomCurve3(railCurvePts, false);
        const wireRail = new THREE.Mesh(
          trackGeo(new THREE.TubeGeometry(railCurve, 84, 0.024, 10, false)),
          matChromeRail
        );
        wireRail.name = 'chromeWireGuardRail';
        coolingTray.add(wireRail);

        const clipGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.022, 0.05));
        for (const [cx, cz, ang] of [
          [-2.39, 0.56, 0], [2.39, 0.56, 0],
          [-1.35, 1.72, 0.55], [1.35, 1.72, -0.55],
          [-1.85, -0.75, -0.25], [1.85, -0.75, 0.25]
        ]) {
          const clip = new THREE.Mesh(clipGeo, matChromeRail);
          clip.position.set(cx, 0.025, cz);
          clip.rotation.y = ang;
          coolingTray.add(clip);
        }

        productRoot.add(coolingTray);

        /* ====================================================================
           3. COAXIAL REFRACTORY FIRING HEARTH & CERAMIC PEDESTAL
           ==================================================================== */
        const firingPedestal = new THREE.Group();
        firingPedestal.name = 'firingPedestal';
        const pedRestPos = new THREE.Vector3(0, 2.035, 0.18);
        firingPedestal.position.copy(pedRestPos);

        const baseSealRing = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(1.50, 1.53, 0.09, 56)),
          matCavityBlack
        );
        baseSealRing.position.y = 0.045;
        firingPedestal.add(baseSealRing);

        const hearthDisc = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.94, 0.98, 0.08, 48)),
          matCeramicWhite
        );
        hearthDisc.position.y = 0.095;
        firingPedestal.add(hearthDisc);

        const centerPedestal = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.42, 0.44, 0.24, 44)),
          matCeramicWhite
        );
        centerPedestal.position.y = 0.24;
        firingPedestal.add(centerPedestal);

        const pedGrooveRing = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.42, 0.012, 10, 40)),
          matMuffleWarm
        );
        pedGrooveRing.rotation.x = Math.PI * 0.5;
        pedGrooveRing.position.y = 0.29;
        firingPedestal.add(pedGrooveRing);

        productRoot.add(firingPedestal);

        /* ====================================================================
           4. HINGED CLAMSHELL FURNACE HEAD (Pivots Backward on Explode!)
           ==================================================================== */
        const clamshellHead = new THREE.Group();
        clamshellHead.name = 'clamshellHead';
        const hingePivotPos = new THREE.Vector3(0, 2.76, -1.68);
        clamshellHead.position.copy(hingePivotPos);

        const headBodyGroup = new THREE.Group();
        headBodyGroup.position.set(-hingePivotPos.x, -hingePivotPos.y, -hingePivotPos.z);
        clamshellHead.add(headBodyGroup);

        const headShell = new THREE.Mesh(
          trackGeo(createSmoothULoft([
            { y: 2.11, r: 1.50, zCenter: 0.18, zRear: -1.64, rRear: 1.44 },
            { y: 2.16, r: 1.54, zCenter: 0.18, zRear: -1.68, rRear: 1.46 },
            { y: 3.24, r: 1.53, zCenter: 0.18, zRear: -1.76, rRear: 1.44 },
            { y: 3.30, r: 1.50, zCenter: 0.18, zRear: -1.64, rRear: 1.42, rearDrop: 0.08 },
            { y: 3.88, r: 1.42, zCenter: 0.18, zRear: -1.62, rRear: 1.36, rearDrop: 0.56 },
            { y: 3.98, r: 1.33, zCenter: 0.18, zRear: -1.58, rRear: 1.28, rearDrop: 0.64 },
            { y: 4.02, r: 1.22, zCenter: 0.18, zRear: -1.52, rRear: 1.20, rearDrop: 0.68 }
          ], true, true)),
          matWhiteEnamel
        );
        headShell.name = 'clamshellWhiteShell';
        headBodyGroup.add(headShell);

        const topSeamRing = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.56, 0.011, 10, 56)),
          matDarkGraphite
        );
        topSeamRing.rotation.x = Math.PI * 0.5;
        topSeamRing.position.set(0, 4.022, 0.18);
        headBodyGroup.add(topSeamRing);

        const radialSlotCount = 44;
        const innerRadGeo = trackGeo(new THREE.BoxGeometry(0.026, 0.012, 0.13));
        const outerRadGeo = trackGeo(new THREE.BoxGeometry(0.028, 0.012, 0.17));
        const innerRadMesh = new THREE.InstancedMesh(innerRadGeo, matCavityBlack, radialSlotCount);
        const outerRadMesh = new THREE.InstancedMesh(outerRadGeo, matCavityBlack, radialSlotCount);
        for (let i = 0; i < radialSlotCount; i++) {
          const a = (i / radialSlotCount) * Math.PI * 2;
          const zOff = Math.cos(a);
          // Follow subtle rear slope if slot is behind z = -0.30
          const calcSlotY = (rad) => {
            const zv = 0.18 + zOff * rad;
            if (zv >= -0.30) return 4.022;
            const tz = Math.min(1, (-0.30 - zv) / 1.32);
            return 4.022 - 0.68 * (tz * tz * (3 - 2 * tz));
          };
          dummy.position.set(Math.sin(a) * 0.72, calcSlotY(0.72), 0.18 + zOff * 0.72);
          dummy.rotation.set(0, a, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          innerRadMesh.setMatrixAt(i, dummy.matrix);

          dummy.position.set(Math.sin(a) * 0.94, calcSlotY(0.94), 0.18 + zOff * 0.94);
          dummy.updateMatrix();
          outerRadMesh.setMatrixAt(i, dummy.matrix);
        }
        innerRadMesh.instanceMatrix.needsUpdate = true;
        outerRadMesh.instanceMatrix.needsUpdate = true;
        headBodyGroup.add(innerRadMesh, outerRadMesh);

        // Curved front dual-warning triangle decal (`!` + `SSS`) wrapping nose of clamshellHead
        const warnTex = trackTex(createDualWarnDecalTexture());
        const warnMat = trackMat(new THREE.MeshBasicMaterial({
          map: warnTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const warnCylGeo = trackGeo(new THREE.CylinderGeometry(
          1.544, 1.544, 0.34, 24, 1, true, -0.22, 0.44
        ));
        const warnDecalMesh = new THREE.Mesh(warnCylGeo, warnMat);
        warnDecalMesh.name = 'frontWarnDecal';
        warnDecalMesh.position.set(0, 2.38, 0.18);
        warnDecalMesh.castShadow = false;
        warnDecalMesh.receiveShadow = false;
        headBodyGroup.add(warnDecalMesh);

        // Underside of clamshellHead (visible when hinged open!)
        const headUnderFlange = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(1.46, 1.46, 0.03, 56)),
          matCavityBlack
        );
        headUnderFlange.position.set(0, 2.085, 0.18);
        headBodyGroup.add(headUnderFlange);

        const muffleInsulShape = new THREE.Shape();
        muffleInsulShape.absarc(0, 0, 1.16, 0, Math.PI * 2, false);
        const muffleHole = new THREE.Path();
        muffleHole.absarc(0, 0, 0.56, 0, Math.PI * 2, true);
        muffleInsulShape.holes.push(muffleHole);
        const muffleInsulGeo = trackGeo(new THREE.ExtrudeGeometry(muffleInsulShape, {
          depth: 0.035,
          bevelEnabled: false,
          curveSegments: 48
        }));
        muffleInsulGeo.rotateX(Math.PI * 0.5);
        const headUnderRefractory = new THREE.Mesh(muffleInsulGeo, matCeramicWhite);
        headUnderRefractory.position.set(0, 2.052, 0.18);
        headBodyGroup.add(headUnderRefractory);

        const headMuffleCore = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.03, 44)),
          matMuffleWarm
        );
        headMuffleCore.position.set(0, 2.065, 0.18);
        headBodyGroup.add(headMuffleCore);

        productRoot.add(clamshellHead);

        /* ====================================================================
           5. SLOPED FRONT WHITE CONTROL CONSOLE & GREEN-LCD MEMBRANE KEYPAD
           ==================================================================== */
        const controlConsole = new THREE.Group();
        controlConsole.name = 'controlConsole';
        const consoleRestPos = new THREE.Vector3(0, 0, 0);

        const conTilt = 0.25;
        const conGroup = new THREE.Group();
        conGroup.position.set(0, 1.12, 1.72);
        conGroup.rotation.x = -conTilt;

        const cBoxShape = new THREE.Shape();
        const cw = 1.13;
        cBoxShape.moveTo(-cw, 0.94);
        cBoxShape.lineTo(cw, 0.94);
        cBoxShape.lineTo(cw, -0.78);
        cBoxShape.quadraticCurveTo(0, -0.90, -cw, -0.78);
        cBoxShape.closePath();

        const cBoxGeo = trackGeo(new THREE.ExtrudeGeometry(cBoxShape, {
          depth: 0.62,
          bevelEnabled: true,
          bevelThickness: 0.026,
          bevelSize: 0.026,
          bevelSegments: 3,
          curveSegments: 24,
          steps: 1
        }));
        cBoxGeo.translate(0, 0, -0.62);
        cBoxGeo.computeVertexNormals();
        const consoleHousing = new THREE.Mesh(cBoxGeo, matWhiteEnamel);
        consoleHousing.name = 'consoleWhiteHousing';
        conGroup.add(consoleHousing);

        // 5 horizontal vent slots on both angled side cheeks of consoleHousing
        const cSlotGeo = trackGeo(new THREE.BoxGeometry(0.025, 0.035, 0.26));
        for (const sgn of [-1, 1]) {
          for (let r = 0; r < 5; r++) {
            const cSlot = new THREE.Mesh(cSlotGeo, matCavityBlack);
            cSlot.position.set(sgn * (cw + 0.028), 0.74 - r * 0.075, -0.22);
            conGroup.add(cSlot);
          }
        }

        const faceZ = 0.040;
        const memTex = trackTex(createP300MembraneTexture());
        const memMat = trackMat(new THREE.MeshStandardMaterial({
          map: memTex,
          roughness: 0.36,
          metalness: 0.05
        }));
        const membranePlane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(2.048, 1.680)),
          memMat
        );
        membranePlane.name = 'keypadMembranePane';
        membranePlane.position.set(0, 0.04, faceZ);
        membranePlane.castShadow = false;
        membranePlane.receiveShadow = false;
        conGroup.add(membranePlane);

        // 4-bar recessed dark LCD bezel + vibrant green backlit LCD
        const lcdX = -0.20, lcdY = 0.44, lcdW = 0.88, lcdH = 0.46, bT = 0.024;
        for (const [bx, by, bw, bh] of [
          [lcdX, lcdY + lcdH * 0.5 + bT * 0.5, lcdW + bT * 2, bT],
          [lcdX, lcdY - lcdH * 0.5 - bT * 0.5, lcdW + bT * 2, bT],
          [lcdX - lcdW * 0.5 - bT * 0.5, lcdY, bT, lcdH],
          [lcdX + lcdW * 0.5 + bT * 0.5, lcdY, bT, lcdH]
        ]) {
          const bar = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(bw, bh, 0.016)),
            matCavityBlack
          );
          bar.position.set(bx, by, faceZ + 0.010);
          conGroup.add(bar);
        }

        const lcdTex = trackTex(createP300GreenLcdTexture());
        const lcdMat = trackMat(new THREE.MeshPhysicalMaterial({
          map: lcdTex,
          roughness: 0.14,
          metalness: 0.02,
          clearcoat: 0.72,
          clearcoatRoughness: 0.12
        }));
        const lcdPane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(lcdW, lcdH)),
          lcdMat
        );
        lcdPane.name = 'lcdGreenPane';
        lcdPane.position.set(lcdX, lcdY, faceZ + 0.009);
        lcdPane.castShadow = false;
        lcdPane.receiveShadow = false;
        conGroup.add(lcdPane);

        // Raised 3D tactile round/pill keys (all sharing top plane z = faceZ + 0.020)
        const keyDepth = 0.016;
        const kz = faceZ + 0.012;

        const roundBtnGeo = trackGeo(new THREE.CylinderGeometry(0.068, 0.072, keyDepth, 22));
        roundBtnGeo.rotateX(Math.PI * 0.5);
        for (const ky of [0.60, 0.42, 0.24]) {
          const b = new THREE.Mesh(roundBtnGeo, matKeyPillGrey);
          b.position.set(-0.78, ky, kz);
          conGroup.add(b);
        }
        for (const ky of [0.46, 0.27]) {
          const b = new THREE.Mesh(roundBtnGeo, matKeyPillGrey);
          b.position.set(0.72, ky, kz);
          conGroup.add(b);
        }

        const stopBtnGeo = trackGeo(new THREE.CylinderGeometry(0.095, 0.10, keyDepth, 26));
        stopBtnGeo.rotateX(Math.PI * 0.5);
        const stopBtn = new THREE.Mesh(stopBtnGeo, matKeyStopRed);
        stopBtn.position.set(0.72, -0.02, kz);
        conGroup.add(stopBtn);

        const startBtnGeo = trackGeo(new THREE.CylinderGeometry(0.125, 0.13, keyDepth, 28));
        startBtnGeo.rotateX(Math.PI * 0.5);
        const startBtn = new THREE.Mesh(startBtnGeo, matKeyStartGreen);
        startBtn.position.set(0.72, -0.28, kz);
        conGroup.add(startBtn);

        const widePillGeo = trackGeo(new RoundedBoxGeometry(0.28, 0.13, keyDepth, 2, 0.05));
        for (const px of [-0.52, 0.30]) {
          const pill = new THREE.Mesh(widePillGeo, matKeyPillGrey);
          pill.position.set(px, -0.62, kz);
          conGroup.add(pill);
        }
        const pBtnGeo = trackGeo(new THREE.CylinderGeometry(0.085, 0.090, keyDepth, 24));
        pBtnGeo.rotateX(Math.PI * 0.5);
        const pBtn = new THREE.Mesh(pBtnGeo, matKeyPillGrey);
        pBtn.position.set(-0.11, -0.62, kz);
        conGroup.add(pBtn);

        // Sub-pixel-aligned legend sheet sitting cleanly on top of the 3D round/pill keys
        const keyLegTex = trackTex(createP300KeyLegendsTexture());
        const keyLegMat = trackMat(new THREE.MeshBasicMaterial({
          map: keyLegTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const keyLegPlane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(2.048, 1.680)),
          keyLegMat
        );
        keyLegPlane.name = 'keyLegendsDecal';
        keyLegPlane.position.set(0, 0.04, kz + keyDepth * 0.5 + 0.002);
        keyLegPlane.castShadow = false;
        keyLegPlane.receiveShadow = false;
        conGroup.add(keyLegPlane);

        controlConsole.add(conGroup);
        productRoot.add(controlConsole);

        productRoot.traverse((child) => {
          if (
            child.isMesh &&
            !child.name.includes('Decal') &&
            !child.name.includes('Pane')
          ) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Mechanically authentic hinged clamshell opening (matching Photo 2!) + component separation
        function setExplodeFactor(t) {
          const c = Math.max(0, Math.min(1, t));
          clamshellHead.rotation.x = -0.58 * c;
          clamshellHead.position.set(hingePivotPos.x, hingePivotPos.y + 0.14 * c, hingePivotPos.z);
          firingPedestal.position.set(pedRestPos.x, pedRestPos.y + 0.26 * c, pedRestPos.z);
          coolingTray.position.set(trayRestPos.x, trayRestPos.y + 0.08 * c, trayRestPos.z);
          controlConsole.position.set(consoleRestPos.x, consoleRestPos.y, consoleRestPos.z + 0.42 * c);
        }

        function dispose() {
          for (const g of geometries) g.dispose();
          for (const m of materials) m.dispose();
          for (const t of textures) t.dispose();
        }

        return {
          productRoot,
          assemblies: {
            baseAssembly,
            coolingTray,
            firingPedestal,
            clamshellHead,
            controlConsole
          },
          setExplodeFactor,
          dispose
        };
      }

      window.DentalAssetLibrary.assets['ivoclar-programat-p300'] = {
        id: 'ivoclar-programat-p300',
        code: 'FURNACE-03',
        name: 'Ivoclar Programat P300',
        category: 'Clamshell Porcelain Furnace (Table 1 · Furnace Bench)',
        capabilityNote: 'Right-hand station on Table 1 (Thermal Furnace Bench) featuring QTK2 muffle technology and OSD optical status display.',
        tableId: 'table-furnaces',
        realDimensionsMm: '395 × 465 × 320 mm',
        benchScale: 1.00,
        benchPosition: [-11.80, 0.0, 0.92],
        subAssemblies: ['lowerChassis', 'frontControlPanel', 'rearHingeHousing', 'tiltingClamshellHead', 'firingChamberTable', 'coolingTrayWings', 'rearPanelIO'],
        createAsset: createProgramatP300Product
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetProgramatP300();

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
