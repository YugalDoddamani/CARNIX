// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2).html
// Component : <script id="component-3-asset-upcera-a7-plus">
// sha256    : 1a253e21f9fdf1c0ce8c0da7f7693cf6f4cf07172235a907155e302e6eba5216
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────



    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetUpceraA7Plus = function () {
      const { THREE, RoundedBoxGeometry } = window.__THREE_BUNDLE__;

      /**
       * 5-facet chamfered octagonal-front plan profile of the UPCERA A7+ chamber & crown.
       */
      function buildChamberPlanPoints(inset = 0) {
        const hw = 1.76 - inset;
        const zRear = -1.62 + inset;
        const zFront = 1.46 - inset;
        const diagC = 2.48 - inset * Math.SQRT2;
        const zCorner = diagC - hw;
        const fw = diagC - zFront;
        return [
          { x: -hw, z: zRear   },
          { x: -hw, z: zCorner },
          { x: -fw, z: zFront  },
          { x:  fw, z: zFront  },
          { x:  hw, z: zCorner },
          { x:  hw, z: zRear   }
        ];
      }

      /**
       * Lofts crisp faceted sheet-metal slices along Y with flat per-face normals.
       */
      function createFacetedLoft(slices, capBottom = true, capTop = true) {
        const rings = slices.map(s => buildChamberPlanPoints(s.inset || 0));
        const N = rings[0].length;
        const pos = [];
        const nrm = [];
        const idx = [];

        function addQuad(a, b, c, d) {
          const base = pos.length / 3;
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
          const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
          let nx = uy * vz - uz * vy;
          let ny = uz * vx - ux * vz;
          let nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len; ny /= len; nz /= len;
          for (const p of [a, b, c, d]) {
            pos.push(p[0], p[1], p[2]);
            nrm.push(nx, ny, nz);
          }
          idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }

        for (let s = 0; s < slices.length - 1; s++) {
          const y0 = slices[s].y;
          const y1 = slices[s + 1].y;
          const r0 = rings[s];
          const r1 = rings[s + 1];
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            addQuad(
              [r0[i].x,  y0, r0[i].z],
              [r0[iN].x, y0, r0[iN].z],
              [r1[iN].x, y1, r1[iN].z],
              [r1[i].x,  y1, r1[i].z]
            );
          }
        }

        if (capBottom) {
          const y0 = slices[0].y;
          const r0 = rings[0];
          const base = pos.length / 3;
          pos.push(0, y0, -0.1);
          nrm.push(0, -1, 0);
          for (let i = 0; i < N; i++) {
            pos.push(r0[i].x, y0, r0[i].z);
            nrm.push(0, -1, 0);
          }
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            idx.push(base, base + 1 + iN, base + 1 + i);
          }
        }

        if (capTop) {
          const yL = slices[slices.length - 1].y;
          const rL = rings[rings.length - 1];
          const base = pos.length / 3;
          pos.push(0, yL, -0.1);
          nrm.push(0, 1, 0);
          for (let i = 0; i < N; i++) {
            pos.push(rL[i].x, yL, rL[i].z);
            nrm.push(0, 1, 0);
          }
          for (let i = 0; i < N; i++) {
            const iN = (i + 1) % N;
            idx.push(base, base + 1 + i, base + 1 + iN);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        geo.setIndex(idx);
        return geo;
      }

      function extrudeAlongX(shape, xMin, xMax, bevel = 0.03, bevelSegments = 3, curveSegments = 20) {
        const thickness = Math.max(0.01, (xMax - xMin) - 2 * bevel);
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: thickness,
          bevelEnabled: bevel > 0,
          bevelThickness: bevel,
          bevelSize: bevel,
          bevelSegments,
          curveSegments,
          steps: 1
        });
        geo.translate(0, 0, -thickness * 0.5);
        geo.rotateY(-Math.PI * 0.5);
        geo.translate((xMin + xMax) * 0.5, 0, 0);
        geo.computeVertexNormals();
        return geo;
      }

      /**
       * High-DPI ice-blue backlit graphic LCD texture (`P01 | 50°C` + firing ramp curve).
       */
      function createUpceraLcdTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');

        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#96cbf4');
        bg.addColorStop(1, '#79b5e7');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Outer subtle LCD pixel frame
        ctx.strokeStyle = '#1b3552';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Header divider & vertical split
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, 128);
        ctx.lineTo(canvas.width - 10, 128);
        ctx.moveTo(470, 10);
        ctx.lineTo(470, 128);
        ctx.moveTo(10, 540);
        ctx.lineTo(canvas.width - 10, 540);
        ctx.stroke();

        ctx.fillStyle = '#132a46';
        ctx.font = '700 66px "Courier New", Consolas, monospace';
        ctx.fillText('P01', 90, 92);
        ctx.fillText('50°C', 640, 92);

        // Multi-stage porcelain firing ramp graph (480 -> 60 -> 980 -> cool)
        ctx.strokeStyle = '#163252';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(52, 468);
        ctx.lineTo(278, 468);
        ctx.lineTo(548, 256);
        ctx.lineTo(682, 256);
        ctx.lineTo(862, 372);
        ctx.lineTo(932, 492);
        ctx.stroke();

        // Dashed vertical stage drop lines
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(22, 50, 82, 0.55)';
        for (const [vx, vy] of [[278, 468], [548, 256], [682, 256], [862, 372]]) {
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(vx, 525);
          ctx.stroke();
        }
        ctx.restore();

        ctx.font = '700 32px "Courier New", Consolas, monospace';
        ctx.fillText('480', 145, 452);
        ctx.fillText('60', 362, 355);
        ctx.fillText('980', 575, 240);

        // Footer status bar: STOP | 760 mm | 00:00
        ctx.beginPath();
        ctx.moveTo(260, 540);
        ctx.lineTo(260, canvas.height - 10);
        ctx.moveTo(590, 540);
        ctx.lineTo(590, canvas.height - 10);
        ctx.stroke();

        ctx.font = '700 34px "Courier New", Consolas, monospace';
        ctx.fillText('STOP', 78, 602);
        ctx.fillText('760 mm', 348, 602);
        ctx.fillText('00:00', 690, 602);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Brushed silver-grey membrane keypad background with `UPCERA A7+` red-crescent
       * emblem and swooping dual navy/silver ribbon arcs.
       */
      function createKeypadOverlayTexture() {
        const W = 1360;
        const H = 688; // Exact 400 px per Three.js unit (3.40 x 1.72)
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#b5bcc8');
        grad.addColorStop(0.55, '#a8b0bd');
        grad.addColorStop(1, '#9ca5b4');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Subtle inset perimeter border line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, W - 20, H - 20);

        // Dynamic swooping navy & pale-silver arcs across lower-left/bottom-center
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(16, 560);
        ctx.quadraticCurveTo(360, 665, 810, 505);
        ctx.quadraticCurveTo(410, 632, 16, 595);
        ctx.closePath();
        ctx.fillStyle = '#253a5a';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(180, 645);
        ctx.quadraticCurveTo(510, 622, 835, 512);
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#1b2c46';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(45, 540);
        ctx.quadraticCurveTo(380, 635, 760, 500);
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(245, 248, 252, 0.72)';
        ctx.stroke();
        ctx.restore();

        // Red crescent-C emblem + bold `UPCERA A7+` on lower-left
        const cx = 104;
        const cy = 492;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0.45, Math.PI * 2 - 0.45, false);
        ctx.arc(cx + 9, cy - 2, 18, Math.PI * 2 - 0.65, 0.65, true);
        ctx.closePath();
        ctx.fillStyle = '#d3202c';
        ctx.fill();

        ctx.fillStyle = '#151920';
        ctx.font = '800 44px "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.fillText('UPCERA', 140, 508);

        ctx.font = '800 54px "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.fillText('A', 332, 510);
        ctx.font = '700 32px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('7+', 372, 488);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Single sub-pixel-aligned transparent legend sheet (400 px/unit) placing crisp
       * white legends onto every 3D tactile key cap.
       */
      function createKeyLegendsTexture() {
        const W = 1360;
        const H = 688; // 400 px per unit for kpW = 3.40, kpH = 1.72
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        const toPxX = (x) => (x + 1.70) * 400;
        const toPxY = (y) => (0.86 - y) * 400;

        ctx.fillStyle = '#f5f8fc';
        ctx.strokeStyle = '#f5f8fc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Left 3 keys: [^] at (-1.36, +0.36), [v] at (-1.02, +0.36), [gear] at (-1.02, -0.02)
        // Up chevron
        let kx = toPxX(-1.36), ky = toPxY(0.36);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(kx - 14, ky + 12);
        ctx.lineTo(kx, ky - 14);
        ctx.lineTo(kx + 14, ky + 12);
        ctx.stroke();

        // Down chevron
        kx = toPxX(-1.02); ky = toPxY(0.36);
        ctx.beginPath();
        ctx.moveTo(kx - 14, ky - 12);
        ctx.lineTo(kx, ky + 14);
        ctx.lineTo(kx + 14, ky - 12);
        ctx.stroke();

        // Gear icon at (-1.02, -0.02)
        kx = toPxX(-1.02); ky = toPxY(-0.02);
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(kx - 3, ky + 3, 13, 0, Math.PI * 2);
        ctx.stroke();
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(kx - 3 + Math.cos(ang) * 13, ky + 3 + Math.sin(ang) * 13);
          ctx.lineTo(kx - 3 + Math.cos(ang) * 19, ky + 3 + Math.sin(ang) * 19);
          ctx.stroke();
        }

        // Split [ START | STOP ] key at x = 0.22 & x = 0.47, y = -0.58
        ctx.font = '700 22px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('START', toPxX(0.22), toPxY(-0.58));
        ctx.fillStyle = '#24181c';
        ctx.fillText('STOP', toPxX(0.47), toPxY(-0.58));
        ctx.fillStyle = '#f5f8fc';

        // Right 6-row matrix keypad
        const padLeft = 0.84;
        const colStep = 0.26;
        const rowTop = 0.48;
        const rowStep = 0.21;
        const gridLabels = [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['+', '0', '-']
        ];
        ctx.font = '600 30px "Segoe UI", Inter, Arial, sans-serif';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillText(
              gridLabels[r][c],
              toPxX(padLeft + c * colStep),
              toPxY(rowTop - r * rowStep)
            );
          }
        }

        // Row 5: wide [ ▲ ] and [ ▼ ]
        ctx.font = '700 26px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('▲', toPxX(padLeft + 0.065), toPxY(rowTop - 4 * rowStep));
        ctx.fillText('▼', toPxX(padLeft + 0.455), toPxY(rowTop - 4 * rowStep));

        // Row 6: [Esc], [P], [Enter]
        ctx.font = '600 22px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('Esc', toPxX(padLeft - 0.02), toPxY(rowTop - 5.05 * rowStep));
        ctx.fillText('Enter', toPxX(padLeft + 2 * colStep + 0.02), toPxY(rowTop - 5.05 * rowStep));

        ctx.font = '700 44px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('P', toPxX(padLeft + colStep), toPxY(rowTop - 5.08 * rowStep));

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Yellow ISO hot-surface caution triangle + subtle `UPCERA` front muffle decal.
       */
      function createFrontMuffleDecalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Subtle crisp `UPCERA` wordmark on upper front facet
        ctx.fillStyle = '#252a32';
        ctx.font = '700 46px "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('U P C E R A', 256, 92);

        // Yellow-and-black ISO 7010 W017 Hot Surface warning triangle below
        const cx = 256;
        const tyTop = 258;
        const tyBot = 442;
        const hw = 108;

        ctx.beginPath();
        ctx.moveTo(cx, tyTop);
        ctx.lineTo(cx + hw, tyBot);
        ctx.lineTo(cx - hw, tyBot);
        ctx.closePath();
        ctx.fillStyle = '#ebd028';
        ctx.fill();
        ctx.lineWidth = 14;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#181a1e';
        ctx.stroke();

        // Horizontal hot-surface bar + 3 wavy heat lines inside triangle
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 52, tyBot - 24);
        ctx.lineTo(cx + 52, tyBot - 24);
        ctx.stroke();

        for (const dx of [-24, 0, 24]) {
          ctx.beginPath();
          ctx.moveTo(cx + dx, tyBot - 38);
          ctx.bezierCurveTo(cx + dx - 12, tyBot - 62, cx + dx + 12, tyBot - 82, cx + dx - 3, tyBot - 106);
          ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createUpceraA7PlusProduct() {
        const geometries = [];
        const materials = [];
        const textures = [];

        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        // Calibrated PBR materials matching UPCERA A7+ studio references
        const matWhiteBody = trackMat(new THREE.MeshStandardMaterial({
          color: 0xf2f4f7,
          metalness: 0.06,
          roughness: 0.33
        }));
        const matWhiteRecess = trackMat(new THREE.MeshStandardMaterial({
          color: 0xe3e7ee,
          metalness: 0.08,
          roughness: 0.40
        }));
        const matStainlessCrown = trackMat(new THREE.MeshStandardMaterial({
          color: 0xd4d9e0,
          metalness: 0.80,
          roughness: 0.20
        }));
        const matStainlessDeck = trackMat(new THREE.MeshStandardMaterial({
          color: 0xcbd0d8,
          metalness: 0.74,
          roughness: 0.25
        }));
        const matCharcoalSpine = trackMat(new THREE.MeshStandardMaterial({
          color: 0x3b4048,
          metalness: 0.22,
          roughness: 0.46
        }));
        const matCavityBlack = trackMat(new THREE.MeshStandardMaterial({
          color: 0x0b0d11,
          metalness: 0.10,
          roughness: 0.58
        }));
        const matKeyDark = trackMat(new THREE.MeshStandardMaterial({
          color: 0x2b3646,
          metalness: 0.12,
          roughness: 0.34
        }));
        const matKeyNavy = trackMat(new THREE.MeshStandardMaterial({
          color: 0x162233,
          metalness: 0.14,
          roughness: 0.30
        }));
        const matKeyRed = trackMat(new THREE.MeshStandardMaterial({
          color: 0xd3222e,
          metalness: 0.10,
          roughness: 0.30
        }));
        const matCeramicWhite = trackMat(new THREE.MeshStandardMaterial({
          color: 0xf4f2ed,
          metalness: 0.02,
          roughness: 0.84
        }));
        const matMuffleWarm = trackMat(new THREE.MeshStandardMaterial({
          color: 0xc99c84,
          metalness: 0.05,
          roughness: 0.72
        }));

        const productRoot = new THREE.Group();
        productRoot.name = 'productRoot';
        const dummy = new THREE.Object3D();

        /* ====================================================================
           1. BASE ASSEMBLY + STAINLESS DECK + SYMMETRIC COOLING WINGS
           ==================================================================== */
        const baseAssembly = new THREE.Group();
        baseAssembly.name = 'baseAssembly';

        const footGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.24, 0.09, 24));
        for (const [fx, fz] of [[-1.44, -1.96], [1.44, -1.96], [-1.44, 1.12], [1.44, 1.12]]) {
          const foot = new THREE.Mesh(footGeo, matCavityBlack);
          foot.position.set(fx, 0.045, fz);
          baseAssembly.add(foot);
        }

        // Angled-front dark charcoal lower chassis with 15 vertical cooling slots per side
        const chasShape = new THREE.Shape();
        chasShape.moveTo(-1.62, 0.09);
        chasShape.lineTo( 2.42, 0.09);
        chasShape.lineTo( 1.56, 1.26);
        chasShape.lineTo(-1.62, 1.26);
        chasShape.closePath();

        const lowerChassis = new THREE.Mesh(
          trackGeo(extrudeAlongX(chasShape, -1.74, 1.74, 0.025, 2, 12)),
          matCharcoalSpine
        );
        lowerChassis.name = 'lowerChassis';
        baseAssembly.add(lowerChassis);

        const sideSlotCount = 15;
        const sideSlotGeo = trackGeo(new THREE.BoxGeometry(0.028, 0.44, 0.042));
        const leftSideSlots = new THREE.InstancedMesh(sideSlotGeo, matCavityBlack, sideSlotCount);
        const rightSideSlots = new THREE.InstancedMesh(sideSlotGeo, matCavityBlack, sideSlotCount);
        for (let i = 0; i < sideSlotCount; i++) {
          const sz = -1.28 + i * (1.82 / (sideSlotCount - 1));
          dummy.position.set(-1.742, 0.56, sz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          leftSideSlots.setMatrixAt(i, dummy.matrix);

          dummy.position.set(1.742, 0.56, sz);
          dummy.updateMatrix();
          rightSideSlots.setMatrixAt(i, dummy.matrix);
        }
        leftSideSlots.instanceMatrix.needsUpdate = true;
        rightSideSlots.instanceMatrix.needsUpdate = true;
        baseAssembly.add(leftSideSlots, rightSideSlots);

        // Brushed stainless-steel top deck plate
        const deckShape = new THREE.Shape();
        deckShape.moveTo(-1.77, -1.36);
        deckShape.lineTo( 1.77, -1.36);
        deckShape.lineTo( 1.77,  1.42);
        deckShape.lineTo( 1.62,  1.58);
        deckShape.lineTo(-1.62,  1.58);
        deckShape.lineTo(-1.77,  1.42);
        deckShape.closePath();

        const deckGeo = trackGeo(new THREE.ExtrudeGeometry(deckShape, {
          depth: 0.045,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.008,
          bevelSegments: 2,
          steps: 1
        }));
        deckGeo.rotateX(Math.PI * 0.5);
        deckGeo.translate(0, 1.305, 0);
        deckGeo.computeVertexNormals();
        const stainlessDeck = new THREE.Mesh(deckGeo, matStainlessDeck);
        stainlessDeck.name = 'stainlessTopDeck';
        baseAssembly.add(stainlessDeck);

        // Twin cantilevered stainless-steel side cooling tray wings
        const coolingWings = new THREE.Group();
        coolingWings.name = 'coolingWings';

        function createCoolingWing(sgn) {
          const wShape = new THREE.Shape();
          const xIn = sgn * 1.68;
          const xOut = sgn * 2.48;
          const xTip = sgn * 2.36;
          wShape.moveTo(xIn, -0.58);
          wShape.lineTo(xTip, -0.58);
          wShape.quadraticCurveTo(xOut, -0.58, xOut, -0.44);
          wShape.lineTo(xOut,  0.54);
          wShape.quadraticCurveTo(xOut,  0.68, xTip,  0.68);
          wShape.lineTo(xIn,  0.68);
          wShape.closePath();

          const wGeo = trackGeo(new THREE.ExtrudeGeometry(wShape, {
            depth: 0.036,
            bevelEnabled: true,
            bevelThickness: 0.007,
            bevelSize: 0.007,
            bevelSegments: 2,
            steps: 1
          }));
          wGeo.rotateX(Math.PI * 0.5);
          wGeo.translate(0, 1.275, 0);
          wGeo.computeVertexNormals();
          return new THREE.Mesh(wGeo, matStainlessDeck);
        }

        const leftWing = createCoolingWing(-1);
        leftWing.name = 'leftCoolingWing';
        const rightWing = createCoolingWing(1);
        rightWing.name = 'rightCoolingWing';
        coolingWings.add(leftWing, rightWing);
        baseAssembly.add(coolingWings);

        productRoot.add(baseAssembly);

        /* ====================================================================
           2. LIFT COLUMN & DETAILED REAR SERVICE / I/O PANEL
           ==================================================================== */
        const liftColumn = new THREE.Group();
        liftColumn.name = 'liftColumn';

        const rearDarkSpine = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(3.50, 7.12, 0.68, 3, 0.025)),
          matCharcoalSpine
        );
        rearDarkSpine.name = 'rearCharcoalSpine';
        rearDarkSpine.position.set(0, 3.65, -1.95);
        liftColumn.add(rearDarkSpine);

        // Bent dark sheet-metal top cap lid with side overhang ears (matching rear photo)
        const topCapFlange = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(3.62, 0.045, 0.76)),
          matCharcoalSpine
        );
        topCapFlange.position.set(0, 7.235, -1.98);
        liftColumn.add(topCapFlange);

        const earGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.18, 0.76));
        for (const sgn of [-1, 1]) {
          const ear = new THREE.Mesh(earGeo, matCharcoalSpine);
          ear.position.set(sgn * 1.795, 7.16, -1.98);
          liftColumn.add(ear);
        }

        // Full-height white rear service cover & I/O panel
        const rearOuterFrame = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(3.52, 7.13, 0.06, 2, 0.015)),
          matWhiteBody
        );
        rearOuterFrame.name = 'rearServiceFrame';
        rearOuterFrame.position.set(0, 3.655, -2.30);
        liftColumn.add(rearOuterFrame);

        const upperRearPlate = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(3.26, 5.76, 0.022, 2, 0.01)),
          matWhiteRecess
        );
        upperRearPlate.position.set(0, 4.26, -2.336);
        liftColumn.add(upperRearPlate);

        const rearHorizSeam = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(3.30, 0.022, 0.026)),
          matCharcoalSpine
        );
        rearHorizSeam.position.set(0, 1.35, -2.338);
        liftColumn.add(rearHorizSeam);

        const screwCoords = [
          [-1.54, 7.04], [0.0, 7.04], [1.54, 7.04],
          [-1.54, 5.18],              [1.54, 5.18],
          [-1.54, 1.44],              [1.54, 1.44],
          [-1.54, 1.26],              [1.54, 1.26]
        ];
        const screwGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 14));
        screwGeo.rotateX(Math.PI * 0.5);
        const rearScrews = new THREE.InstancedMesh(screwGeo, matStainlessCrown, screwCoords.length);
        for (let i = 0; i < screwCoords.length; i++) {
          dummy.position.set(screwCoords[i][0], screwCoords[i][1], -2.350);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          rearScrews.setMatrixAt(i, dummy.matrix);
        }
        rearScrews.instanceMatrix.needsUpdate = true;
        liftColumn.add(rearScrews);

        // Rear horizontal louver vent clusters (2 upper 2x5 + 1 lower 3x5)
        const louverCoords = [];
        for (const cx of [-0.90, 0.90]) {
          for (const dx of [-0.21, 0.21]) {
            for (let r = 0; r < 5; r++) {
              louverCoords.push([cx + dx, 6.78 - r * 0.135]);
            }
          }
        }
        for (const dx of [-1.06, -0.68, -0.30]) {
          for (let r = 0; r < 5; r++) {
            louverCoords.push([dx, 1.12 - r * 0.105]);
          }
        }
        const rearLouverGeo = trackGeo(new THREE.BoxGeometry(0.30, 0.036, 0.02));
        const rearLouvers = new THREE.InstancedMesh(rearLouverGeo, matCavityBlack, louverCoords.length);
        for (let i = 0; i < louverCoords.length; i++) {
          dummy.position.set(louverCoords[i][0], louverCoords[i][1], -2.350);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          rearLouvers.setMatrixAt(i, dummy.matrix);
        }
        rearLouvers.instanceMatrix.needsUpdate = true;
        liftColumn.add(rearLouvers);

        // Pointed hexagonal-flange IEC C14 AC power inlet with side mounting screws
        const iecGroup = new THREE.Group();
        iecGroup.position.set(1.04, 0.56, -2.340);

        const iecShape = new THREE.Shape();
        iecShape.moveTo(-0.24,  0.22);
        iecShape.lineTo( 0.24,  0.22);
        iecShape.lineTo( 0.42,  0.00);
        iecShape.lineTo( 0.24, -0.22);
        iecShape.lineTo(-0.24, -0.22);
        iecShape.lineTo(-0.42,  0.00);
        iecShape.closePath();
        const iecFlangeGeo = trackGeo(new THREE.ExtrudeGeometry(iecShape, {
          depth: 0.026,
          bevelEnabled: true,
          bevelThickness: 0.006,
          bevelSize: 0.006,
          bevelSegments: 2,
          steps: 1
        }));
        const iecFlange = new THREE.Mesh(iecFlangeGeo, matCavityBlack);
        iecFlange.position.z = -0.020;
        iecGroup.add(iecFlange);

        const iecWell = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(0.42, 0.28, 0.03, 2, 0.03)),
          matCharcoalSpine
        );
        iecWell.position.z = -0.016;
        iecGroup.add(iecWell);

        const prongGeo = trackGeo(new THREE.BoxGeometry(0.028, 0.075, 0.03));
        for (const [px, py] of [[-0.11, -0.04], [0.11, -0.04], [0.0, 0.06]]) {
          const prong = new THREE.Mesh(prongGeo, matStainlessCrown);
          prong.position.set(px, py, -0.022);
          iecGroup.add(prong);
        }
        for (const sx of [-0.32, 0.32]) {
          const iScrew = new THREE.Mesh(screwGeo, matStainlessCrown);
          iScrew.position.set(sx, 0, -0.024);
          iecGroup.add(iScrew);
        }
        liftColumn.add(iecGroup);

        const fuseCap = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20)),
          matCavityBlack
        );
        fuseCap.rotation.x = Math.PI * 0.5;
        fuseCap.position.set(-0.28, 0.34, -2.345);
        liftColumn.add(fuseCap);

        const rearUsb = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(0.28, 0.14, 0.03, 2, 0.02)),
          matCavityBlack
        );
        rearUsb.position.set(-0.68, 0.34, -2.345);
        liftColumn.add(rearUsb);

        const rockerSwitch = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(0.22, 0.32, 0.04, 2, 0.02)),
          matCavityBlack
        );
        rockerSwitch.position.set(-1.12, 0.38, -2.348);
        liftColumn.add(rockerSwitch);

        // White recessed U-channel front column piers + central vertical black lift track
        const pierGeo = trackGeo(new RoundedBoxGeometry(0.46, 3.16, 0.80, 3, 0.025));
        const backPanelGeo = trackGeo(new THREE.BoxGeometry(1.12, 3.16, 0.24));
        for (const sgn of [-1, 1]) {
          const pier = new THREE.Mesh(pierGeo, matWhiteBody);
          pier.position.set(sgn * 1.53, 2.88, -1.22);
          liftColumn.add(pier);

          const backPanel = new THREE.Mesh(backPanelGeo, matWhiteRecess);
          backPanel.position.set(sgn * 0.65, 2.88, -1.50);
          liftColumn.add(backPanel);
        }

        const centerLiftSlot = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.20, 5.40, 0.28)),
          matCavityBlack
        );
        centerLiftSlot.position.set(0, 4.00, -1.52);
        liftColumn.add(centerLiftSlot);

        productRoot.add(liftColumn);

        /* ====================================================================
           3. COAXIAL STAINLESS DISH & CERAMIC REFRACTORY FIRING PEDESTAL
           ==================================================================== */
        const firingPedestal = new THREE.Group();
        firingPedestal.name = 'firingPedestal';
        const pedestalRestPos = new THREE.Vector3(0, 1.30, 0.24);
        firingPedestal.position.copy(pedestalRestPos);

        const pedStem = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.58, 0.32, 0.30, 44)),
          matStainlessCrown
        );
        pedStem.position.y = 0.15;
        firingPedestal.add(pedStem);

        const dishProfile = [
          new THREE.Vector2(0.0,  0.30),
          new THREE.Vector2(1.02, 0.30),
          new THREE.Vector2(1.08, 0.34),
          new THREE.Vector2(1.08, 0.40),
          new THREE.Vector2(1.03, 0.40),
          new THREE.Vector2(1.00, 0.33),
          new THREE.Vector2(0.0,  0.33)
        ];
        const pedDish = new THREE.Mesh(
          trackGeo(new THREE.LatheGeometry(dishProfile, 56)),
          matStainlessCrown
        );
        firingPedestal.add(pedDish);

        const ceramicCollar = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.86, 0.88, 0.18, 48)),
          matCeramicWhite
        );
        ceramicCollar.position.y = 0.42;
        firingPedestal.add(ceramicCollar);

        const ceramicCone = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.56, 0.66, 0.76, 48)),
          matCeramicWhite
        );
        ceramicCone.position.y = 0.89;
        firingPedestal.add(ceramicCone);

        productRoot.add(firingPedestal);

        /* ====================================================================
           4. FACETED OCTAGONAL-FRONT FIRING CHAMBER + STAINLESS TOP CROWN
           ==================================================================== */
        const chamberHead = new THREE.Group();
        chamberHead.name = 'chamberHead';
        const chamberRestPos = new THREE.Vector3(0, 4.44, 0);
        chamberHead.position.copy(chamberRestPos);

        const chamberShell = new THREE.Mesh(
          trackGeo(createFacetedLoft([
            { y: 0.00, inset: 0.02 },
            { y: 0.03, inset: 0.00 },
            { y: 2.74, inset: 0.00 },
            { y: 2.76, inset: 0.02 }
          ], true, true)),
          matWhiteBody
        );
        chamberShell.name = 'chamberFacetedShell';
        chamberHead.add(chamberShell);

        const crownReveal = new THREE.Mesh(
          trackGeo(createFacetedLoft([
            { y: 2.76, inset: 0.03 },
            { y: 2.79, inset: 0.03 }
          ], false, false)),
          matCavityBlack
        );
        chamberHead.add(crownReveal);

        const stainlessCrown = new THREE.Mesh(
          trackGeo(createFacetedLoft([
            { y: 2.79, inset: -0.025 },
            { y: 3.04, inset: -0.025 },
            { y: 3.06, inset:  0.00  }
          ], true, true)),
          matStainlessCrown
        );
        stainlessCrown.name = 'stainlessTopCrown';
        chamberHead.add(stainlessCrown);

        // Double-row horizontal cooling slots across all 5 front/corner/side facets
        const facetDefs = [
          { p0: [-1.76, -0.78], p1: [-1.76,  0.56], cols: 3, slotW: 0.26, yaw: -Math.PI * 0.5 },
          { p0: [-1.68,  0.80], p1: [-1.10,  1.38], cols: 2, slotW: 0.30, yaw: -Math.PI * 0.25 },
          { p0: [-0.88,  1.46], p1: [ 0.88,  1.46], cols: 3, slotW: 0.36, yaw:  0.0 },
          { p0: [ 1.10,  1.38], p1: [ 1.68,  0.80], cols: 2, slotW: 0.30, yaw:  Math.PI * 0.25 },
          { p0: [ 1.76,  0.56], p1: [ 1.76, -0.78], cols: 3, slotW: 0.26, yaw:  Math.PI * 0.5 }
        ];
        const slotInstances = [];
        for (const fd of facetDefs) {
          for (let c = 0; c < fd.cols; c++) {
            const t = (c + 0.5) / fd.cols;
            const sx = fd.p0[0] + (fd.p1[0] - fd.p0[0]) * t;
            const sz = fd.p0[1] + (fd.p1[1] - fd.p0[1]) * t;
            const nx = Math.sin(fd.yaw);
            const nz = Math.cos(fd.yaw);
            for (const sy of [2.56, 2.45]) {
              slotInstances.push({
                x: sx + nx * 0.004,
                y: sy,
                z: sz + nz * 0.004,
                yaw: fd.yaw,
                w: fd.slotW
              });
            }
          }
        }
        const hSlotGeo = trackGeo(new THREE.BoxGeometry(1.0, 0.036, 0.016));
        const chamberVentSlots = new THREE.InstancedMesh(hSlotGeo, matCavityBlack, slotInstances.length);
        for (let i = 0; i < slotInstances.length; i++) {
          const s = slotInstances[i];
          dummy.position.set(s.x, s.y, s.z);
          dummy.rotation.set(0, s.yaw, 0);
          dummy.scale.set(s.w, 1, 1);
          dummy.updateMatrix();
          chamberVentSlots.setMatrixAt(i, dummy.matrix);
        }
        chamberVentSlots.instanceMatrix.needsUpdate = true;
        chamberHead.add(chamberVentSlots);

        // Front facet ISO hot-surface triangle + subtle `UPCERA` wordmark decal
        const frontDecalTex = trackTex(createFrontMuffleDecalTexture());
        const frontDecalMat = trackMat(new THREE.MeshBasicMaterial({
          map: frontDecalTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const frontDecalPlane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(1.48, 1.48)),
          frontDecalMat
        );
        frontDecalPlane.name = 'frontMuffleDecal';
        frontDecalPlane.position.set(0, 1.54, 1.464);
        frontDecalPlane.castShadow = false;
        frontDecalPlane.receiveShadow = false;
        chamberHead.add(frontDecalPlane);

        // Detailed underside stainless heat-shield ring & concentric ceramic muffle opening
        const underRecessPan = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(1.44, 1.44, 0.024, 56)),
          matCavityBlack
        );
        underRecessPan.position.set(0, -0.016, 0.14);
        chamberHead.add(underRecessPan);

        const shieldShape = new THREE.Shape();
        shieldShape.absarc(0, 0, 1.36, 0, Math.PI * 2, false);
        const shieldHole = new THREE.Path();
        shieldHole.absarc(0, 0, 0.84, 0, Math.PI * 2, true);
        shieldShape.holes.push(shieldHole);
        const shieldGeo = trackGeo(new THREE.ExtrudeGeometry(shieldShape, {
          depth: 0.022,
          bevelEnabled: false,
          curveSegments: 48
        }));
        shieldGeo.rotateX(Math.PI * 0.5);
        const underHeatShield = new THREE.Mesh(shieldGeo, matStainlessCrown);
        underHeatShield.position.set(0, -0.028, 0.14);
        chamberHead.add(underHeatShield);

        const muffleRing = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.76, 0.065, 16, 48)),
          matMuffleWarm
        );
        muffleRing.rotation.x = Math.PI * 0.5;
        muffleRing.position.set(0, -0.038, 0.14);
        chamberHead.add(muffleRing);

        const muffleCavity = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.69, 0.69, 0.026, 44)),
          matCeramicWhite
        );
        muffleCavity.position.set(0, -0.032, 0.14);
        chamberHead.add(muffleCavity);

        productRoot.add(chamberHead);

        /* ====================================================================
           5. SYMMETRIC WHITE-FRAMED SLOPED CONTROL CONSOLE
           ==================================================================== */
        const controlConsole = new THREE.Group();
        controlConsole.name = 'controlConsole';
        const consoleRestPos = new THREE.Vector3(0, 0, 0);

        const conW = 3.76;
        const conTilt = Math.atan2(1.08, 1.56);

        const faceGroup = new THREE.Group();
        faceGroup.name = 'consoleFaceGroup';
        faceGroup.position.set(0, 0.98, 2.18);
        faceGroup.rotation.x = -conTilt;

        const consoleBody = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(conW, 1.98, 0.48, 4, 0.065)),
          matWhiteBody
        );
        consoleBody.name = 'consoleWhiteHousing';
        faceGroup.add(consoleBody);

        const kpOffsetGroup = new THREE.Group();
        kpOffsetGroup.position.z = 0.214;
        faceGroup.add(kpOffsetGroup);

        // Brushed silver-grey keypad overlay with `UPCERA A7+` & ribbon swoosh graphics
        const kpW = 3.40;
        const kpH = 1.72;
        const kpTex = trackTex(createKeypadOverlayTexture());
        const kpMat = trackMat(new THREE.MeshStandardMaterial({
          map: kpTex,
          metalness: 0.14,
          roughness: 0.36
        }));
        const keypadOverlay = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(kpW, kpH, 0.024, 3, 0.025)),
          kpMat
        );
        keypadOverlay.name = 'keypadOverlayPlane';
        keypadOverlay.position.z = 0.042;
        kpOffsetGroup.add(keypadOverlay);

        // Center Blue-Backlit Graphic LCD + Hollow 4-Bar Dark Bezel
        const lcdX = -0.10;
        const lcdY = 0.06;
        const lcdW = 1.38;
        const lcdH = 0.88;
        const bT = 0.036;

        for (const [bx, by, bw, bh] of [
          [lcdX, lcdY + lcdH * 0.5 + bT * 0.5, lcdW + bT * 2, bT],
          [lcdX, lcdY - lcdH * 0.5 - bT * 0.5, lcdW + bT * 2, bT],
          [lcdX - lcdW * 0.5 - bT * 0.5, lcdY, bT, lcdH],
          [lcdX + lcdW * 0.5 + bT * 0.5, lcdY, bT, lcdH]
        ]) {
          const bar = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(bw, bh, 0.020)),
            matKeyDark
          );
          bar.position.set(bx, by, 0.062);
          kpOffsetGroup.add(bar);
        }

        const lcdTex = trackTex(createUpceraLcdTexture());
        const lcdMat = trackMat(new THREE.MeshPhysicalMaterial({
          map: lcdTex,
          roughness: 0.15,
          metalness: 0.02,
          clearcoat: 0.70,
          clearcoatRoughness: 0.12
        }));
        const lcdPane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(lcdW, lcdH)),
          lcdMat
        );
        lcdPane.name = 'lcdDisplayPane';
        lcdPane.position.set(lcdX, lcdY, 0.060);
        lcdPane.castShadow = false;
        lcdPane.receiveShadow = false;
        kpOffsetGroup.add(lcdPane);

        // 3D Tactile Keys (all sharing top face z = 0.072 so legend sheet sits flush on top)
        const keyZ = 0.062;
        const keyDepth = 0.020;

        // Left 3 dark square keys: [^], [v], [gear]
        const sqKeyGeo = trackGeo(new RoundedBoxGeometry(0.22, 0.22, keyDepth, 2, 0.02));
        for (const [kx, ky] of [[-1.36, 0.36], [-1.02, 0.36], [-1.02, -0.02]]) {
          const km = new THREE.Mesh(sqKeyGeo, matKeyDark);
          km.position.set(kx, ky, keyZ);
          kpOffsetGroup.add(km);
        }

        // Bottom-center split [ START | STOP ] key
        const halfKeyGeo = trackGeo(new RoundedBoxGeometry(0.24, 0.19, keyDepth, 2, 0.02));
        const startHalf = new THREE.Mesh(halfKeyGeo, matKeyNavy);
        startHalf.position.set(0.22, -0.58, keyZ);
        kpOffsetGroup.add(startHalf);

        const stopHalf = new THREE.Mesh(halfKeyGeo, matKeyRed);
        stopHalf.position.set(0.47, -0.58, keyZ);
        kpOffsetGroup.add(stopHalf);

        // Right 6-row matrix keypad
        const padLeft = 0.84;
        const colStep = 0.26;
        const rowTop = 0.48;
        const rowStep = 0.21;

        const numKeyGeo = trackGeo(new RoundedBoxGeometry(0.23, 0.18, keyDepth, 2, 0.02));
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            const km = new THREE.Mesh(numKeyGeo, matKeyDark);
            km.position.set(padLeft + c * colStep, rowTop - r * rowStep, keyZ);
            kpOffsetGroup.add(km);
          }
        }

        const wideArrowGeo = trackGeo(new RoundedBoxGeometry(0.36, 0.18, keyDepth, 2, 0.02));
        for (let c = 0; c < 2; c++) {
          const km = new THREE.Mesh(wideArrowGeo, matKeyDark);
          km.position.set(padLeft + 0.065 + c * 0.39, rowTop - 4 * rowStep, keyZ);
          kpOffsetGroup.add(km);
        }

        const smallSideKeyGeo = trackGeo(new RoundedBoxGeometry(0.19, 0.18, keyDepth, 2, 0.02));
        const escKey = new THREE.Mesh(smallSideKeyGeo, matKeyDark);
        escKey.position.set(padLeft - 0.02, rowTop - 5.05 * rowStep, keyZ);
        kpOffsetGroup.add(escKey);

        const pKey = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(0.32, 0.24, keyDepth, 2, 0.025)),
          matKeyNavy
        );
        pKey.position.set(padLeft + colStep, rowTop - 5.08 * rowStep, keyZ);
        kpOffsetGroup.add(pKey);

        const entKey = new THREE.Mesh(smallSideKeyGeo, matKeyDark);
        entKey.position.set(padLeft + 2 * colStep + 0.02, rowTop - 5.05 * rowStep, keyZ);
        kpOffsetGroup.add(entKey);

        // Sub-pixel-aligned white key legends plane sitting flush over top of 3D keys
        const legendsTex = trackTex(createKeyLegendsTexture());
        const legendsMat = trackMat(new THREE.MeshBasicMaterial({
          map: legendsTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const keyLegendsPlane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(kpW, kpH)),
          legendsMat
        );
        keyLegendsPlane.name = 'keyLegendsDecal';
        keyLegendsPlane.position.z = keyZ + keyDepth * 0.5 + 0.002;
        keyLegendsPlane.castShadow = false;
        keyLegendsPlane.receiveShadow = false;
        kpOffsetGroup.add(keyLegendsPlane);

        controlConsole.add(faceGroup);
        productRoot.add(controlConsole);

        // Enable shadows on solid geometry (excluding flat decal/LCD planes)
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

        // Mechanically authentic exploded-view vectors
        const chamberExplodeOffset = new THREE.Vector3(0, 1.35, 0);
        const pedestalExplodeOffset = new THREE.Vector3(0, 0.62, 0);
        const consoleExplodeOffset = new THREE.Vector3(0, 0, 0.68);
        const wingSlideDist = 0.55;

        function setExplodeFactor(t) {
          const clamped = Math.max(0, Math.min(1, t));
          chamberHead.position.copy(chamberRestPos).addScaledVector(chamberExplodeOffset, clamped);
          firingPedestal.position.copy(pedestalRestPos).addScaledVector(pedestalExplodeOffset, clamped);
          controlConsole.position.copy(consoleRestPos).addScaledVector(consoleExplodeOffset, clamped);
          leftWing.position.x = -wingSlideDist * clamped;
          rightWing.position.x = wingSlideDist * clamped;
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
            liftColumn,
            firingPedestal,
            chamberHead,
            controlConsole
          },
          setExplodeFactor,
          dispose
        };
      }

      window.DentalAssetLibrary.assets['upcera-a7-plus'] = {
        id: 'upcera-a7-plus',
        code: 'FURNACE-02',
        name: 'UPCERA A7+',
        category: 'Programmable Porcelain Vacuum Furnace (Table 1 · Furnace Bench)',
        capabilityNote: 'Center station on Table 1 (Thermal Furnace Bench) for programmable vacuum porcelain sintering and glazing cycles.',
        tableId: 'table-furnaces',
        realDimensionsMm: '380 × 420 × 600 mm',
        benchScale: 1.00,
        benchPosition: [-18.90, 0.0, 0.00],
        subAssemblies: ['lowerBaseChassis', 'rearLiftColumn', 'upperMuffleHead', 'frontTouchConsole', 'firingStageTray', 'coolingSideTray', 'rearConnectionsIO'],
        createAsset: createUpceraA7PlusProduct
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetUpceraA7Plus();

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
