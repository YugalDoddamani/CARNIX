// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2) + GK3 component.html
// Component : <script id="component-5-asset-3shape-e4">
// sha256    : f74fa6febfc752f31828e32f95f7a4cbf403726e30a8e12a801767a187c115eb
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────

    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetThreeShapeE4 = function () {
      const { THREE } = window.__THREE_BUNDLE__;

      function createFrontLogoTexture() {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 256;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);

        ctx.fillStyle = '#e6ebf2';
        ctx.font = '600 108px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('3shape', 628, 134);

        ctx.strokeStyle = '#e6ebf2';
        ctx.lineWidth = 14;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(656, 74);
        ctx.lineTo(728, 108);
        ctx.lineTo(664, 150);
        ctx.closePath();
        ctx.stroke();

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createE4FrontBadgeTexture() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 128;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);

        ctx.fillStyle = '#cfd6e0';
        ctx.font = '600 66px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E4', 128, 66);

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createRearSerialTexture() {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 512;
        const ctx = c.getContext('2d');

        const g = ctx.createLinearGradient(0, 0, 1024, 512);
        g.addColorStop(0, '#cfd5de');
        g.addColorStop(0.5, '#dde2ea');
        g.addColorStop(1, '#b8c0cc');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.strokeStyle = '#3b414b';
        ctx.lineWidth = 12;
        ctx.strokeRect(18, 18, 988, 476);

        ctx.fillStyle = '#181b20';
        ctx.font = '700 58px "Inter", -apple-system, sans-serif';
        ctx.fillText('3Shape A/S', 56, 94);

        ctx.font = '600 42px "Inter", -apple-system, sans-serif';
        ctx.fillText('Model: E4 Dental Lab Scanner', 56, 158);

        ctx.font = '500 32px "SFMono-Regular", Consolas, monospace';
        ctx.fillStyle = '#252a32';
        ctx.fillText('P/N: 20007521     S/N: Y4E4-2609418', 56, 220);
        ctx.fillText('Input: 24V DC === 3.75A (90W Max)', 56, 268);
        ctx.fillText('Optics: 4 x 5.0 MP  |  Blue LED Multiline', 56, 316);
        ctx.fillText('Accuracy: 4 um (ISO 12836)  |  Class 1 LED', 56, 364);
        ctx.fillText('Holmens Kanal 7, 1060 Copenhagen, Denmark', 56, 436);

        ctx.font = '700 84px "Inter", sans-serif';
        ctx.fillStyle = '#181b20';
        ctx.fillText('CE', 836, 128);

        ctx.fillStyle = '#14171c';
        for (let i = 0; i < 34; i++) {
          const bw = (i % 3 === 0) ? 7 : ((i % 2 === 0) ? 4 : 2);
          ctx.fillRect(736 + i * 7, 392, bw, 68);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      // Multi-patch BufferGeometry builder with mathematically verified outward winding per patch
      function buildPatchedGeometry(patches) {
        const allPos = [];
        const allIdx = [];
        let vertOffset = 0;

        for (const patch of patches) {
          const { nx, nz, evalPt, outDir } = patch;
          for (let iz = 0; iz <= nz; iz++) {
            const v = iz / nz;
            for (let ix = 0; ix <= nx; ix++) {
              const u = ix / nx;
              const p = evalPt(u, v);
              allPos.push(p[0], p[1], p[2]);
            }
          }
          const p00 = evalPt(0.45, 0.45);
          const p10 = evalPt(0.55, 0.45);
          const p01 = evalPt(0.45, 0.55);
          const ux = p10[0] - p00[0], uy = p10[1] - p00[1], uz = p10[2] - p00[2];
          const vx = p01[0] - p00[0], vy = p01[1] - p00[1], vz = p01[2] - p00[2];
          const cx = uy * vz - uz * vy;
          const cy = uz * vx - ux * vz;
          const cz = ux * vy - uy * vx;
          const useABC = (cx * outDir[0] + cy * outDir[1] + cz * outDir[2]) >= 0;

          const row = nx + 1;
          for (let iz = 0; iz < nz; iz++) {
            for (let ix = 0; ix < nx; ix++) {
              const a = vertOffset + iz * row + ix;
              const b = a + 1;
              const c = a + row + 1;
              const d = a + row;
              if (useABC) {
                allIdx.push(a, b, c, a, c, d);
              } else {
                allIdx.push(a, c, b, a, d, c);
              }
            }
          }
          vertOffset += (nx + 1) * (nz + 1);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(allPos, 3));
        geo.setIndex(allIdx);
        geo.computeVertexNormals();
        return geo;
      }

      function createThreeShapeE4Product() {
        const geometries = [];
        const materials = [];
        const textures = [];
        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        // Core Architectural Dimensions (1 scene unit = 80 mm -> 374 x 336 x 332 mm)
        const halfW = 2.34;
        const cornerR = 0.22;         // Smooth 18 mm vertical fillet on front-left & front-right corners!
        const xCornerPivot = halfW - cornerR; // 2.12
        const zCornerPivot = 1.60;    // Side wall runs straight from zRearOuter (-2.04) to zCornerPivot (1.60)
        const zRearOuter = -2.04;
        const zSpineFront = -1.63;
        const zBackWall = -1.26;

        // Exact front Z boundary at any X (with C1-continuous rounded front corners of radius cornerR - inset)
        function frontMaxZ(x, inset = 0) {
          const ax = Math.abs(x);
          const rEff = Math.max(0.01, cornerR - inset);
          if (ax <= xCornerPivot) {
            const u = ax / xCornerPivot;
            return (zCornerPivot + rEff) + 0.26 * (1 - u * u);
          }
          const dx = Math.min(rEff, ax - xCornerPivot);
          return zCornerPivot + Math.sqrt(Math.max(0, rEff * rEff - dx * dx));
        }

        // Continuous C1 wrap-around U-perimeter curve from Left-Rear -> Rounded Front-Left -> Arched Front -> Rounded Front-Right -> Right-Rear!
        // Returns [x, z, nx, nz] for s in [0, 1]
        function evalUPerimeter(s, inset = 0) {
          const rEff = Math.max(0.01, cornerR - inset);
          const zStart = zRearOuter + inset;
          // 5 smooth arc-length-proportioned segments:
          // [0.00 .. 0.27] Left straight side (zStart -> zCornerPivot)
          // [0.27 .. 0.33] Front-Left 90-deg fillet
          // [0.33 .. 0.67] Arched front fascia (-xCornerPivot -> +xCornerPivot)
          // [0.67 .. 0.73] Front-Right 90-deg fillet
          // [0.73 .. 1.00] Right straight side (zCornerPivot -> zStart)
          if (s <= 0.27) {
            const t = s / 0.27;
            return [-(halfW - inset), zStart + t * (zCornerPivot - zStart), -1, 0];
          } else if (s <= 0.33) {
            const t = (s - 0.27) / 0.06;
            const ang = Math.PI - t * (Math.PI * 0.5); // pi -> pi/2
            return [
              -xCornerPivot + Math.cos(ang) * rEff,
              zCornerPivot + Math.sin(ang) * rEff,
              Math.cos(ang),
              Math.sin(ang)
            ];
          } else if (s <= 0.67) {
            const t = (s - 0.33) / 0.34; // 0 .. 1
            const x = -xCornerPivot + t * (2 * xCornerPivot);
            const u = x / xCornerPivot;
            const z = (zCornerPivot + rEff) + 0.26 * (1 - u * u);
            const dzdx = -0.52 * u / xCornerPivot;
            const len = Math.hypot(-dzdx, 1);
            return [x, z, -dzdx / len, 1 / len];
          } else if (s <= 0.73) {
            const t = (s - 0.67) / 0.06;
            const ang = Math.PI * 0.5 - t * (Math.PI * 0.5); // pi/2 -> 0
            return [
              xCornerPivot + Math.cos(ang) * rEff,
              zCornerPivot + Math.sin(ang) * rEff,
              Math.cos(ang),
              Math.sin(ang)
            ];
          } else {
            const t = (s - 0.73) / 0.27;
            return [halfW - inset, zCornerPivot + t * (zStart - zCornerPivot), 1, 0];
          }
        }

        // Calibrated Anthracite-Graphite Studio Materials (matches official 3Shape E4 render 1:1)
        const canopyShellMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x353941,
          roughness: 0.42,
          metalness: 0.14,
          envMapIntensity: 1.25
        }));
        const spineShellMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x2d3139,
          roughness: 0.45,
          metalness: 0.14,
          envMapIntensity: 1.20
        }));
        const opticalBaffleMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x252931,
          roughness: 0.48,
          metalness: 0.12,
          envMapIntensity: 1.15
        }));
        const backWallMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x23272f,
          roughness: 0.50,
          metalness: 0.10,
          envMapIntensity: 1.15
        }));
        const recessSeamMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x111317,
          roughness: 0.70,
          metalness: 0.04
        }));
        const subPlinthMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x17191e,
          roughness: 0.56,
          metalness: 0.08
        }));
        const rubberFootMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x101215,
          roughness: 0.88,
          metalness: 0.02
        }));
        const genRedRingMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0xbe1a25,
          emissive: 0x3c0408,
          emissiveIntensity: 0.55,
          roughness: 0.28,
          metalness: 0.44,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        }));
        const silverAccentRingMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0xb2bac6,
          roughness: 0.25,
          metalness: 0.78,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        }));
        const stageBowlMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x22262e,
          roughness: 0.32,
          metalness: 0.26,
          envMapIntensity: 1.30
        }));
        const chuckAnodizedMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x2a2f39,
          roughness: 0.30,
          metalness: 0.38,
          envMapIntensity: 1.30
        }));
        const brushedAlloyMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0xc8d0dc,
          roughness: 0.24,
          metalness: 0.84
        }));
        const darkMetalMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x191c22,
          roughness: 0.34,
          metalness: 0.68
        }));
        const cameraLensMat = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0x0b1930,
          emissive: 0x0a1e44,
          emissiveIntensity: 0.45,
          roughness: 0.06,
          metalness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04
        }));
        const blueProjectorMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x2b7fff,
          emissive: 0x1a66ff,
          emissiveIntensity: 1.45,
          roughness: 0.14,
          metalness: 0.10
        }));
        const dentalStoneMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0xe4ddd0,
          roughness: 0.72,
          metalness: 0.02
        }));
        const dentalCrownMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0xf1ece1,
          roughness: 0.44,
          metalness: 0.03
        }));

        const productRoot = new THREE.Group();
        productRoot.name = 'ThreeShapeE4Scanner';

        // =====================================================================
        // 1. BASE ASSEMBLY (Feet at y=0.000 + Rounded Sub-Plinth + Boolean-Arc U-Scoop Base Deck)
        // =====================================================================
        const baseAssembly = new THREE.Group();
        baseAssembly.name = 'baseAssembly';
        productRoot.add(baseAssembly);

        // 4 Elastomer Anti-Vibration Feet (exact y = 0.000 seating)
        const footGeo = trackGeo(new THREE.CylinderGeometry(0.19, 0.16, 0.06, 28));
        for (const [fx, fy, fz] of [
          [-1.72, 0.03, -1.50],
          [ 1.72, 0.03, -1.50],
          [-1.72, 0.03,  1.28],
          [ 1.72, 0.03,  1.28]
        ]) {
          const f = new THREE.Mesh(footGeo, rubberFootMat);
          f.position.set(fx, fy, fz);
          baseAssembly.add(f);
        }

        // Inset Stepped Sub-Plinth (y = 0.045 .. 0.255, inset = 0.28)
        {
          const pInset = 0.28;
          const yBot = 0.045, yTop = 0.255;
          const subPlinthGeo = trackGeo(buildPatchedGeometry([
            // Continuous wrap-around U-wall with rounded front corners
            {
              nx: 96, nz: 2,
              evalPt: (u, v) => {
                const [px, pz] = evalUPerimeter(u, pInset);
                return [px, yBot + v * (yTop - yBot), pz];
              },
              outDir: [0, 0, 1] // at u=0.5 (front center), outward is +Z!
            },
            // Rear sub-plinth wall
            {
              nx: 16, nz: 2,
              evalPt: (u, v) => {
                const wP = halfW - pInset;
                return [wP - u * (2 * wP), yBot + v * (yTop - yBot), zRearOuter + pInset];
              },
              outDir: [0, 0, -1]
            },
            // Bottom cap
            {
              nx: 24, nz: 16,
              evalPt: (u, v) => {
                const wP = halfW - pInset;
                const x = -wP + u * (2 * wP);
                const z0 = zRearOuter + pInset;
                const z1 = frontMaxZ(x, pInset);
                return [x, yBot, z0 + v * (z1 - z0)];
              },
              outDir: [0, -1, 0]
            }
          ]));
          const subPlinthMesh = new THREE.Mesh(subPlinthGeo, subPlinthMat);
          subPlinthMesh.name = 'subPlinth';
          baseAssembly.add(subPlinthMesh);
        }

        // Sculpted Main Base Deck with SolidWorks Circular-Arc Boolean U-Scoop & Rounded Front Corners
        {
          const yBaseBot = 0.24;
          const scoopW = 0.80; // +/- 64 mm crisp circular-arc boolean trough
          const bev = 0.022;

          function wingTopY(x, z) {
            if (z <= zBackWall) return 0.69;
            const zEnd = frontMaxZ(x, 0);
            const t = Math.max(0, Math.min(1, (z - zBackWall) / Math.max(0.1, zEnd - zBackWall)));
            const crown = 0.010 * (1 - Math.pow(Math.min(1, Math.abs(x) / halfW), 2));
            return 0.69 - 0.135 * t + crown;
          }

          // Exact circular-arc cross-section passing through (0, yCenter) and (±scoopW, wingTopY(scoopW, z)) — ZERO gap!
          function scoopTopY(x, z) {
            const zEnd = frontMaxZ(0, 0);
            const tZ = Math.max(0, Math.min(1, (z - zBackWall) / Math.max(0.1, zEnd - zBackWall)));
            const yRim = wingTopY(scoopW, z);
            const yCenter = 0.355 - 0.045 * Math.sin(Math.PI * Math.min(1, tZ * 0.95)) - 0.015 * tZ;
            const D = Math.max(0.06, yRim - yCenter);
            const R = (scoopW * scoopW + D * D) / (2 * D);
            const ax = Math.min(scoopW, Math.abs(x));
            return (yCenter + R) - Math.sqrt(Math.max(0, R * R - ax * ax));
          }

          function deckPerimeterTopY(x, z) {
            if (Math.abs(x) >= scoopW || z <= zBackWall) return wingTopY(x, z);
            return scoopTopY(x, z);
          }

          const basePatches = [
            // 1. Left Wing Top Surface (-halfW+bev .. -scoopW, zBackWall .. frontMaxZ)
            {
              nx: 28, nz: 32,
              evalPt: (u, v) => {
                const x = (-halfW + bev) + u * ((-scoopW) - (-halfW + bev));
                const zEnd = frontMaxZ(x, bev);
                const z = zBackWall + v * (zEnd - zBackWall);
                return [x, wingTopY(x, z), z];
              },
              outDir: [0, 1, 0]
            },
            // 2. Right Wing Top Surface (+scoopW .. +halfW-bev, zBackWall .. frontMaxZ)
            {
              nx: 28, nz: 32,
              evalPt: (u, v) => {
                const x = scoopW + u * ((halfW - bev) - scoopW);
                const zEnd = frontMaxZ(x, bev);
                const z = zBackWall + v * (zEnd - zBackWall);
                return [x, wingTopY(x, z), z];
              },
              outDir: [0, 1, 0]
            },
            // 3. Rear Wrap-Around Base Top Ledge (zRearOuter+bev .. zBackWall)
            {
              nx: 36, nz: 8,
              evalPt: (u, v) => {
                const x = (-halfW + bev) + u * (2 * (halfW - bev));
                const z = (zRearOuter + bev) + v * (zBackWall - (zRearOuter + bev));
                return [x, 0.69, z];
              },
              outDir: [0, 1, 0]
            },
            // 4. Central Circular-Arc Boolean U-Scoop (-scoopW .. +scoopW, zBackWall .. frontMaxZ)
            {
              nx: 48, nz: 32,
              evalPt: (u, v) => {
                const x = (u * 2 - 1) * scoopW;
                const zEnd = frontMaxZ(x, bev);
                const z = zBackWall + v * (zEnd - zBackWall);
                return [x, scoopTopY(x, z), z];
              },
              outDir: [0, 1, 0]
            },
            // 5. Continuous C1 Wrap-Around Top Bevel Ribbon (Left -> Rounded Corner -> Front Scoop & Wings -> Rounded Corner -> Right)
            {
              nx: 140, nz: 2,
              evalPt: (u, v) => {
                const [xIn, zIn] = evalUPerimeter(u, bev);
                const [xOut, zOut] = evalUPerimeter(u, 0);
                const yTop = deckPerimeterTopY(xIn, zIn);
                return [
                  xIn + v * (xOut - xIn),
                  yTop - v * bev,
                  zIn + v * (zOut - zIn)
                ];
              },
              outDir: [0, 0.7, 0.7] // at u=0.5 (front center), bevel points +Y, +Z!
            },
            // 6. Continuous C1 Wrap-Around Outer Skirt Wall (Left -> Rounded Corner -> Front -> Rounded Corner -> Right)
            {
              nx: 140, nz: 8,
              evalPt: (u, v) => {
                const [xOut, zOut] = evalUPerimeter(u, 0);
                const [xIn, zIn] = evalUPerimeter(u, bev);
                const yTop = deckPerimeterTopY(xIn, zIn) - bev;
                return [xOut, yBaseBot + v * (yTop - yBaseBot), zOut];
              },
              outDir: [0, 0, 1] // at u=0.5 (front center), wall normal points +Z!
            },
            // 7. Rear Base Wall (z = zRearOuter, y = 0.24 .. 0.69)
            {
              nx: 28, nz: 4,
              evalPt: (u, v) => {
                const x = (halfW - bev) - u * (2 * (halfW - bev));
                return [x, yBaseBot + v * (0.69 - bev - yBaseBot), zRearOuter];
              },
              outDir: [0, 0, -1]
            },
            // 8. Underside Overhang Cap (y = yBaseBot)
            {
              nx: 36, nz: 24,
              evalPt: (u, v) => {
                const x = -halfW + u * (2 * halfW);
                const zEnd = frontMaxZ(x, 0);
                return [x, yBaseBot, zRearOuter + v * (zEnd - zRearOuter)];
              },
              outDir: [0, -1, 0]
            }
          ];

          const baseDeckGeo = trackGeo(buildPatchedGeometry(basePatches));
          const baseDeckMesh = new THREE.Mesh(baseDeckGeo, canopyShellMat);
          baseDeckMesh.name = 'sculptedBaseDeck';
          baseAssembly.add(baseDeckMesh);
        }

        // Front 'E4' Typography — curved directly onto the front base fascia below the U-scoop
        {
          const e4Tex = trackTex(createE4FrontBadgeTexture());
          const e4Mat = trackMat(new THREE.MeshStandardMaterial({
            map: e4Tex,
            transparent: true,
            alphaTest: 0.05,
            depthWrite: false,
            roughness: 0.38,
            metalness: 0.10,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          }));
          const e4Geo = trackGeo(new THREE.PlaneGeometry(0.18, 0.09, 8, 1));
          const p = e4Geo.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const lx = p.getX(i);
            p.setZ(i, frontMaxZ(lx, 0) + 0.008);
          }
          e4Geo.computeVertexNormals();
          const e4Mesh = new THREE.Mesh(e4Geo, e4Mat);
          e4Mesh.position.set(0, 0.285, 0);
          baseAssembly.add(e4Mesh);
        }

        // =====================================================================
        // 2. C-FRAME COLUMN (Watertight Full-Width Rear Spine + Inset Flat Optical Backboard + Flush Twin Red Rings)
        // =====================================================================
        const cFrameColumn = new THREE.Group();
        cFrameColumn.name = 'cFrameColumn';
        productRoot.add(cFrameColumn);

        // Horizontal Dark Shadow Reveal Grooves (Base <-> Spine at y=0.702, Spine <-> Canopy at y=3.516)
        {
          const lowReveal = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(halfW * 2 - 0.06, 0.026, 0.38)),
            recessSeamMat
          );
          lowReveal.position.set(0, 0.702, -1.835);
          cFrameColumn.add(lowReveal);

          const highReveal = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(halfW * 2 - 0.06, 0.026, 0.38)),
            recessSeamMat
          );
          highReveal.position.set(0, 3.516, -1.835);
          cFrameColumn.add(highReveal);
        }

        // Full-Width Rear Spine Pillar (x = ±2.34, y = 0.715 .. 3.505, z = -2.04 .. -1.63)
        {
          const yLo = 0.715, yHi = 3.505;
          const zLo = zRearOuter, zHi = zSpineFront; // -1.63
          const bev = 0.020;
          const spineGeo = trackGeo(buildPatchedGeometry([
            { nx: 8, nz: 16, evalPt: (u, v) => [-halfW, yLo + v * (yHi - yLo), zLo + u * (zHi - bev - zLo)], outDir: [-1, 0, 0] },
            { nx: 2, nz: 16, evalPt: (u, v) => [-halfW + u * bev, yLo + v * (yHi - yLo), (zHi - bev) + u * bev], outDir: [-0.7, 0, 0.7] },
            { nx: 8, nz: 16, evalPt: (u, v) => [halfW, yLo + v * (yHi - yLo), (zHi - bev) + u * (zLo - (zHi - bev))], outDir: [1, 0, 0] },
            { nx: 2, nz: 16, evalPt: (u, v) => [halfW - u * bev, yLo + v * (yHi - yLo), zHi - u * bev], outDir: [0.7, 0, 0.7] },
            { nx: 24, nz: 16, evalPt: (u, v) => [(-halfW + bev) + u * (2 * (halfW - bev)), yLo + v * (yHi - yLo), zHi], outDir: [0, 0, 1] },
            { nx: 16, nz: 12, evalPt: (u, v) => [halfW - u * (2 * halfW), yLo + v * (yHi - yLo), zLo + 0.04], outDir: [0, 0, -1] }
          ]));
          const spineMesh = new THREE.Mesh(spineGeo, spineShellMat);
          spineMesh.name = 'rearSpinePillar';
          cFrameColumn.add(spineMesh);
        }

        // Inset Recessed Vertical Reveal Neck (x = ±2.15, z = -1.63 .. -1.60 — strictly inside ±2.19 so ZERO side Z-fighting!)
        {
          const neckReveal = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(4.30, 2.79, 0.04)),
            recessSeamMat
          );
          neckReveal.position.set(0, 2.11, -1.615);
          cFrameColumn.add(neckReveal);
        }

        // Inset Flat Optical Backboard (x = ±2.19, y = 0.685 .. 3.52, z = -1.60 .. -1.26)
        {
          const wBack = 2.19;
          const yLo = 0.685, yHi = 3.52;
          const zLo = -1.60, zHi = zBackWall;
          const bev = 0.020;
          const backWallGeo = trackGeo(buildPatchedGeometry([
            { nx: 28, nz: 24, evalPt: (u, v) => [(-wBack + bev) + u * (2 * (wBack - bev)), yLo + v * (yHi - yLo), zHi], outDir: [0, 0, 1] },
            { nx: 2, nz: 20, evalPt: (u, v) => [-wBack + u * bev, yLo + v * (yHi - yLo), (zHi - bev) + u * bev], outDir: [-0.7, 0, 0.7] },
            { nx: 6, nz: 20, evalPt: (u, v) => [-wBack, yLo + v * (yHi - yLo), zLo + u * (zHi - bev - zLo)], outDir: [-1, 0, 0] },
            { nx: 2, nz: 20, evalPt: (u, v) => [(wBack - bev) + u * bev, yLo + v * (yHi - yLo), zHi - u * bev], outDir: [0.7, 0, 0.7] },
            { nx: 6, nz: 20, evalPt: (u, v) => [wBack, yLo + v * (yHi - yLo), (zHi - bev) + u * (zLo - (zHi - bev))], outDir: [1, 0, 0] }
          ]));
          const backWallMesh = new THREE.Mesh(backWallGeo, backWallMat);
          backWallMesh.name = 'opticalBackWall';
          cFrameColumn.add(backWallMesh);
        }

        // Flush Circular Back-Wall Calibration Groove + Signature Twin Generation-Red Rings
        {
          const ringCenterY = 2.02;
          const zFlush = zBackWall + 0.003;

          const outerGroove = new THREE.Mesh(
            trackGeo(new THREE.RingGeometry(1.33, 1.368, 96)),
            trackMat(new THREE.MeshStandardMaterial({
              color: 0x0e1014, roughness: 0.75, metalness: 0.04,
              polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
            }))
          );
          outerGroove.position.set(0, ringCenterY, zFlush);
          cFrameColumn.add(outerGroove);

          const redRingOuter = new THREE.Mesh(
            trackGeo(new THREE.RingGeometry(1.242, 1.274, 96)),
            genRedRingMat
          );
          redRingOuter.position.set(0, ringCenterY, zFlush + 0.001);
          cFrameColumn.add(redRingOuter);

          const redRingInner = new THREE.Mesh(
            trackGeo(new THREE.RingGeometry(1.156, 1.182, 96)),
            genRedRingMat
          );
          redRingInner.position.set(0, ringCenterY, zFlush + 0.001);
          cFrameColumn.add(redRingInner);

          const silverInnerRim = new THREE.Mesh(
            trackGeo(new THREE.RingGeometry(1.132, 1.146, 96)),
            silverAccentRingMat
          );
          silverInnerRim.position.set(0, ringCenterY, zFlush + 0.001);
          cFrameColumn.add(silverInnerRim);
        }

        // =====================================================================
        // 3. OPTICAL HEAD (Arched Domed Canopy with Rounded Front Corners + Wingtip Baffle + Recessed 4x5MP Bay)
        // =====================================================================
        const opticalHead = new THREE.Group();
        opticalHead.name = 'opticalHead';
        productRoot.add(opticalHead);

        function canopySkirtBotY(x, z) {
          // Horizontal y = 3.53 along both sides; smoothly arches up to y = 3.66 across the curved front fascia!
          if (z <= 1.20) return 3.53;
          const zEnd = Math.max(1.25, frontMaxZ(x, 0));
          const tFront = Math.max(0, Math.min(1, (z - 1.20) / (zEnd - 1.20)));
          const arch = 0.13 * (1 - Math.pow(Math.min(1, Math.abs(x) / xCornerPivot), 2));
          return 3.53 + arch * (tFront * tFront);
        }

        function canopyRoofTopY(x, z) {
          const ux = Math.min(1, Math.abs(x) / halfW);
          const archX = 0.23 * (1 - ux * ux);
          const uz = (z + 0.05) / 2.09;
          const archZ = 0.065 * Math.max(0, 1 - uz * uz);
          return 3.905 + archX + archZ;
        }

        {
          const bev = 0.024;
          const lipInset = 0.15; // Canopy underside outer lip stops cleanly at baffle top perimeter (zero overlap!)
          const canopyPatches = [
            // 1. Silky-Smooth Arched Domed Roof Surface (with rounded front corners!)
            {
              nx: 60, nz: 40,
              evalPt: (u, v) => {
                const x = (-halfW + bev) + u * (2 * (halfW - bev));
                const zStart = zRearOuter + bev;
                const zEnd = frontMaxZ(x, bev);
                const z = zStart + v * (zEnd - zStart);
                return [x, canopyRoofTopY(x, z), z];
              },
              outDir: [0, 1, 0]
            },
            // 2. Continuous C1 Wrap-Around Roof Bevel Ribbon (Left -> Rounded Corner -> Arched Front -> Rounded Corner -> Right)
            {
              nx: 140, nz: 2,
              evalPt: (u, v) => {
                const [xIn, zIn] = evalUPerimeter(u, bev);
                const [xOut, zOut] = evalUPerimeter(u, 0);
                const yTop = canopyRoofTopY(xIn, zIn);
                return [
                  xIn + v * (xOut - xIn),
                  yTop - v * bev,
                  zIn + v * (zOut - zIn)
                ];
              },
              outDir: [0, 0.7, 0.7]
            },
            // 3. Continuous C1 Wrap-Around Canopy Fascia & Side Skirt (with liquid-smooth rounded front corners!)
            {
              nx: 140, nz: 8,
              evalPt: (u, v) => {
                const [xOut, zOut] = evalUPerimeter(u, 0);
                const [xIn, zIn] = evalUPerimeter(u, bev);
                const yLo = canopySkirtBotY(xOut, zOut);
                const yHi = canopyRoofTopY(xIn, zIn) - bev;
                return [xOut, yLo + v * (yHi - yLo), zOut];
              },
              outDir: [0, 0, 1]
            },
            // 4. Rear Vertical Canopy Wall (z = zRearOuter = -2.04, flush with rear spine)
            {
              nx: 36, nz: 6,
              evalPt: (u, v) => {
                const x = (halfW - bev) - u * (2 * (halfW - bev));
                const yLo = 3.53;
                const yHi = canopyRoofTopY(x, zRearOuter + bev) - bev;
                return [x, yLo + v * (yHi - yLo), zRearOuter];
              },
              outDir: [0, 0, -1]
            },
            // 5. Clean Non-Overlapping Underside Overhang Rim Strip (outer perimeter -> lipInset = 0.15)
            {
              nx: 120, nz: 2,
              evalPt: (u, v) => {
                const [xOut, zOut] = evalUPerimeter(u, 0);
                const [xIn, zIn] = evalUPerimeter(u, lipInset);
                const x = xOut + v * (xIn - xOut);
                const z = zOut + v * (zIn - zOut);
                return [x, canopySkirtBotY(x, z), z];
              },
              outDir: [0, -1, 0]
            }
          ];

          const canopyGeo = trackGeo(buildPatchedGeometry(canopyPatches));
          const canopyMesh = new THREE.Mesh(canopyGeo, canopyShellMat);
          canopyMesh.name = 'canopyUpper';
          opticalHead.add(canopyMesh);
        }

        // Curved '3shape ▷' Front Fascia Logo
        {
          const frontLogoTex = trackTex(createFrontLogoTexture());
          const frontLogoMat = trackMat(new THREE.MeshStandardMaterial({
            map: frontLogoTex,
            transparent: true,
            alphaTest: 0.04,
            roughness: 0.36,
            metalness: 0.06,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          }));
          const logoW = 0.88, logoH = 0.22;
          const logoGeo = trackGeo(new THREE.PlaneGeometry(logoW, logoH, 32, 2));
          const lp = logoGeo.attributes.position;
          for (let i = 0; i < lp.count; i++) {
            const lx = lp.getX(i);
            const lyLocal = lp.getY(i);
            const zF = frontMaxZ(lx, 0);
            const yMid = 0.5 * (canopySkirtBotY(lx, zF) + canopyRoofTopY(lx, zF - 0.024) - 0.024);
            lp.setY(i, yMid + lyLocal);
            lp.setZ(i, zF + 0.010);
          }
          logoGeo.computeVertexNormals();
          const frontLogoMesh = new THREE.Mesh(logoGeo, frontLogoMat);
          frontLogoMesh.name = 'frontBrandLogo';
          opticalHead.add(frontLogoMesh);
        }

        // Angled Trapezoidal Wingtip Optical Baffle Shroud + Deeply Recessed Optical Bay Ceiling
        // Wingtips drop cleanly to y = 3.16 at x = ±1.82 and arch to y = 3.35 at center;
        // Inner ceiling recesses up to y = 3.60 so the 4x5MP cameras & Blue LED projector sit cleanly INSIDE the bay
        // (zero blue bulbs hanging below the wingtip line in Side View or eye-level 3/4, just like REF 1 & REF 2!)
        {
          const xTop = halfW - 0.14; // 2.20 — meets canopy underside lipInset cleanly!
          const xBot = 1.82;

          function baffleTopZ(s) {
            return frontMaxZ(s * xTop, 0.14);
          }
          function baffleBotZ(s) {
            return frontMaxZ(s * xBot, 0.44);
          }
          function baffleTopY(s) {
            const x = s * xTop;
            return canopySkirtBotY(x, baffleTopZ(s));
          }
          function baffleWingY(s, zNorm) {
            const frontWingY = 3.16 + 0.20 * (1 - s * s); // 3.16 at wingtips -> 3.36 at center!
            return 3.48 + (frontWingY - 3.48) * Math.pow(zNorm, 0.72);
          }

          const bafflePatches = [
            // 1. Sloped Front Arched Brow Bevel
            {
              nx: 52, nz: 6,
              evalPt: (u, v) => {
                const s = u * 2 - 1;
                const x = (s * xTop) * (1 - v) + (s * xBot) * v;
                const z = baffleTopZ(s) * (1 - v) + baffleBotZ(s) * v;
                const y = baffleTopY(s) * (1 - v) + baffleWingY(s, 1.0) * v;
                return [x, y, z];
              },
              outDir: [0, -0.6, 0.8]
            },
            // 2. Left Angled Cheek Wing
            {
              nx: 28, nz: 6,
              evalPt: (u, v) => {
                const zT = zBackWall + u * (baffleTopZ(-1) - zBackWall);
                const zB = zBackWall + u * (baffleBotZ(-1) - zBackWall);
                const x = (-xTop) * (1 - v) + (-xBot) * v;
                const z = zT * (1 - v) + zB * v;
                const y = 3.53 * (1 - v) + baffleWingY(-1, u) * v;
                return [x, y, z];
              },
              outDir: [-0.7, -0.7, 0]
            },
            // 3. Right Angled Cheek Wing
            {
              nx: 28, nz: 6,
              evalPt: (u, v) => {
                const zT = baffleTopZ(1) + u * (zBackWall - baffleTopZ(1));
                const zB = baffleBotZ(1) + u * (zBackWall - baffleBotZ(1));
                const x = xTop * (1 - v) + xBot * v;
                const z = zT * (1 - v) + zB * v;
                const y = 3.53 * (1 - v) + baffleWingY(1, 1 - u) * v;
                return [x, y, z];
              },
              outDir: [0.7, -0.7, 0]
            },
            // 4. Deeply Recessed Inner Optical Bay Ceiling (steps smoothly up to y = 3.60 inside the cavity!)
            {
              nx: 40, nz: 24,
              evalPt: (u, v) => {
                const s = u * 2 - 1;
                const x = s * xBot;
                const zEnd = baffleBotZ(s);
                const z = zBackWall + v * (zEnd - zBackWall);
                const edgeFactor = Math.sin(Math.PI * Math.pow(1 - Math.abs(s), 0.7)) * Math.sin(Math.PI * Math.min(1, (1 - v) * 1.25));
                const y = baffleWingY(s, v) + 0.34 * Math.max(0, edgeFactor);
                return [x, Math.min(3.71, y), z];
              },
              outDir: [0, -1, 0]
            }
          ];

          const baffleGeo = trackGeo(buildPatchedGeometry(bafflePatches));
          const baffleMesh = new THREE.Mesh(baffleGeo, opticalBaffleMat);
          baffleMesh.name = 'opticalWingtipBaffle';
          opticalHead.add(baffleMesh);
        }

        // Recessed Optical Sensor Suite (4 x 5 MP Stereo Cameras + Central Blue LED Multiline Projector)
        // Mounted at y = 3.55 inside the recessed bay so hidden in Side View and revealed in Worm's-Eye Optics View!
        const opticsSuite = new THREE.Group();
        opticsSuite.name = 'opticsSuite';
        opticalHead.add(opticsSuite);

        const scanAimPoint = new THREE.Vector3(0, 1.02, 0.24);

        {
          const projGroup = new THREE.Group();
          projGroup.position.set(0, 3.585, 0.56);
          projGroup.lookAt(scanAimPoint);

          const bezel = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.20, 0.23, 0.09, 32)),
            darkMetalMat
          );
          bezel.rotation.x = Math.PI / 2;
          projGroup.add(bezel);

          const trimRing = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(0.165, 0.014, 14, 36)),
            brushedAlloyMat
          );
          trimRing.position.z = 0.044;
          projGroup.add(trimRing);

          const blueLens = new THREE.Mesh(
            trackGeo(new THREE.SphereGeometry(0.148, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.44)),
            blueProjectorMat
          );
          blueLens.rotation.x = Math.PI / 2;
          blueLens.position.z = 0.018;
          projGroup.add(blueLens);

          opticsSuite.add(projGroup);
        }

        const camSpecs = [
          { x: -1.10, y: 3.56, z: 0.44, r: 0.138 },
          { x: -0.50, y: 3.585, z: 0.54, r: 0.125 },
          { x:  0.50, y: 3.585, z: 0.54, r: 0.125 },
          { x:  1.10, y: 3.56, z: 0.44, r: 0.138 }
        ];
        camSpecs.forEach((cm, idx) => {
          const pod = new THREE.Group();
          pod.name = `camera5MP_${idx + 1}`;
          pod.position.set(cm.x, cm.y, cm.z);
          pod.lookAt(scanAimPoint);

          const housing = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(cm.r, cm.r * 1.12, 0.09, 28)),
            darkMetalMat
          );
          housing.rotation.x = Math.PI / 2;
          pod.add(housing);

          const ring = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(cm.r * 0.80, 0.011, 12, 28)),
            brushedAlloyMat
          );
          ring.position.z = 0.044;
          pod.add(ring);

          const glass = new THREE.Mesh(
            trackGeo(new THREE.SphereGeometry(cm.r * 0.74, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42)),
            cameraLensMat
          );
          glass.rotation.x = Math.PI / 2;
          glass.position.z = 0.020;
          pod.add(glass);

          opticsSuite.add(pod);
        });

        // =====================================================================
        // 4. 2-AXIS ROTARY & TILT STAGE + SWING-ARM + DEEP BLACK BOWL + TALL CHUCK + DENTAL ARCH
        // =====================================================================
        const rotaryTiltStage = new THREE.Group();
        rotaryTiltStage.name = 'rotaryTiltStage';
        productRoot.add(rotaryTiltStage);

        {
          const armShape = new THREE.Shape();
          armShape.moveTo(-0.44, 0);
          armShape.lineTo( 0.44, 0);
          armShape.lineTo( 0.52, 0.90);
          armShape.lineTo(-0.52, 0.90);
          armShape.closePath();

          const armGeo = trackGeo(new THREE.ExtrudeGeometry(armShape, {
            depth: 0.15,
            bevelEnabled: true,
            bevelThickness: 0.018,
            bevelSize: 0.018,
            bevelSegments: 2
          }));
          armGeo.rotateX(Math.PI / 2);
          const swingArm = new THREE.Mesh(armGeo, stageBowlMat);
          swingArm.position.set(0, 0.61, -1.25);
          swingArm.name = 'gimbalSwingArm';
          rotaryTiltStage.add(swingArm);

          const armSlot = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(1.00, 0.22, 0.025)),
            recessSeamMat
          );
          armSlot.position.set(0, 0.58, zBackWall + 0.004);
          rotaryTiltStage.add(armSlot);
        }

        // Poised Studio Gimbal Pivot (matches REF 2 IMG_f21d3972 & REF 1 e4_studio_closeup!)
        const gimbalPivot = new THREE.Group();
        gimbalPivot.name = 'gimbalPivot';
        gimbalPivot.position.set(0, 0.72, 0.24);
        const baseTiltX = 0.16;
        const baseTiltZ = -0.09;
        gimbalPivot.rotation.set(baseTiltX, 0, baseTiltZ);
        rotaryTiltStage.add(gimbalPivot);

        const spinPlatter = new THREE.Group();
        spinPlatter.name = 'spinPlatter';
        gimbalPivot.add(spinPlatter);

        {
          const bowlPts = [
            new THREE.Vector2(0.00, -0.34),
            new THREE.Vector2(0.24, -0.33),
            new THREE.Vector2(0.48, -0.26),
            new THREE.Vector2(0.68, -0.14),
            new THREE.Vector2(0.80, -0.02),
            new THREE.Vector2(0.83,  0.04),
            new THREE.Vector2(0.81,  0.075),
            new THREE.Vector2(0.75,  0.09),
            new THREE.Vector2(0.45,  0.095),
            new THREE.Vector2(0.00,  0.095)
          ];
          const bowlGeo = trackGeo(new THREE.LatheGeometry(bowlPts, 64));
          const bowlMesh = new THREE.Mesh(bowlGeo, stageBowlMat);
          bowlMesh.name = 'hemisphericalStageBowl';
          spinPlatter.add(bowlMesh);

          const mountDisc = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.43, 0.46, 0.045, 48)),
            chuckAnodizedMat
          );
          mountDisc.position.y = 0.112;
          spinPlatter.add(mountDisc);

          const detentGeo = trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.015, 16));
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
            const det = new THREE.Mesh(detentGeo, brushedAlloyMat);
            det.position.set(Math.cos(a) * 0.33, 0.136, Math.sin(a) * 0.33);
            spinPlatter.add(det);
          }
        }

        // =====================================================================
        // 5. DENTAL CAST FIXTURE (Tall Dark-Anodized Cylindrical Holder + Sculpted Ivory Gypsum Arch)
        // =====================================================================
        const dentalCastFixture = new THREE.Group();
        dentalCastFixture.name = 'dentalCastFixture';
        spinPlatter.add(dentalCastFixture);

        {
          const chuckPts = [
            new THREE.Vector2(0.00, 0.13),
            new THREE.Vector2(0.41, 0.13),
            new THREE.Vector2(0.41, 0.19),
            new THREE.Vector2(0.385, 0.21),
            new THREE.Vector2(0.370, 0.53),
            new THREE.Vector2(0.385, 0.545),
            new THREE.Vector2(0.385, 0.575),
            new THREE.Vector2(0.00, 0.575)
          ];
          const chuckGeo = trackGeo(new THREE.LatheGeometry(chuckPts, 56));
          const chuckMesh = new THREE.Mesh(chuckGeo, chuckAnodizedMat);
          chuckMesh.name = 'tallModelHolderChuck';
          dentalCastFixture.add(chuckMesh);

          const topCollar = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(0.382, 0.009, 12, 48)),
            silverAccentRingMat
          );
          topCollar.rotation.x = Math.PI / 2;
          topCollar.position.y = 0.55;
          dentalCastFixture.add(topCollar);
        }

        {
          const stoneShape = new THREE.Shape();
          stoneShape.moveTo(-0.34, -0.24);
          stoneShape.lineTo(-0.36,  0.06);
          stoneShape.quadraticCurveTo(-0.32, 0.33, 0.0, 0.36);
          stoneShape.quadraticCurveTo( 0.32, 0.33, 0.36, 0.06);
          stoneShape.lineTo( 0.34, -0.24);
          stoneShape.lineTo( 0.18, -0.31);
          stoneShape.lineTo(-0.18, -0.31);
          stoneShape.closePath();

          const stoneBaseGeo = trackGeo(new THREE.ExtrudeGeometry(stoneShape, {
            depth: 0.17,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.018,
            bevelSegments: 3,
            curveSegments: 24
          }));
          stoneBaseGeo.rotateX(-Math.PI / 2);
          const stoneBase = new THREE.Mesh(stoneBaseGeo, dentalStoneMat);
          stoneBase.position.y = 0.575;
          dentalCastFixture.add(stoneBase);

          const gingivaShape = new THREE.Shape();
          gingivaShape.absarc(0, 0.02, 0.295, -0.18 * Math.PI, 1.18 * Math.PI, false);
          gingivaShape.absarc(0, 0.02, 0.165,  1.18 * Math.PI, -0.18 * Math.PI, true);
          gingivaShape.closePath();

          const gingivaGeo = trackGeo(new THREE.ExtrudeGeometry(gingivaShape, {
            depth: 0.085,
            bevelEnabled: true,
            bevelThickness: 0.022,
            bevelSize: 0.018,
            bevelSegments: 3,
            curveSegments: 28
          }));
          gingivaGeo.rotateX(-Math.PI / 2);
          const gingiva = new THREE.Mesh(gingivaGeo, dentalStoneMat);
          gingiva.position.y = 0.735;
          dentalCastFixture.add(gingiva);

          const numTeeth = 14;
          for (let i = 0; i < numTeeth; i++) {
            const u = i / (numTeeth - 1);
            const ang = (-0.13 + u * 1.26) * Math.PI;
            const rArch = 0.232;
            const tx = Math.cos(ang) * rArch;
            const tz = -Math.sin(ang) * rArch - 0.02;
            const distFromMid = Math.abs(u - 0.5) * 2;
            const tw = 0.030 + 0.020 * distFromMid;
            const td = 0.026 + 0.022 * distFromMid;
            const th = 0.095 - 0.016 * distFromMid;

            const crownGeo = trackGeo(new THREE.CylinderGeometry(tw * 0.84, tw * 0.96, th, 14));
            crownGeo.scale(1.0, 1.0, td / tw);
            const crown = new THREE.Mesh(crownGeo, dentalCrownMat);
            crown.position.set(tx, 0.835 + th * 0.32, tz);
            crown.rotation.y = -ang + Math.PI * 0.5;
            dentalCastFixture.add(crown);

            if (distFromMid > 0.32) {
              const cuspGeo = trackGeo(new THREE.SphereGeometry(tw * 0.42, 10, 8));
              for (const side of [-1, 1]) {
                const cusp = new THREE.Mesh(cuspGeo, dentalCrownMat);
                cusp.position.set(
                  tx + Math.cos(ang) * side * td * 0.34,
                  0.835 + th * 0.72,
                  tz - Math.sin(ang) * side * td * 0.34
                );
                cusp.scale.set(1, 0.65, 1);
                dentalCastFixture.add(cusp);
              }
            }
          }
        }

        // =====================================================================
        // 6. REAR SERVICE COVER & RECESSED I/O POCKET
        // =====================================================================
        const rearServiceCover = new THREE.Group();
        rearServiceCover.name = 'rearServiceCover';
        productRoot.add(rearServiceCover);

        {
          const rearPanel = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(4.44, 2.72, 0.04)),
            spineShellMat
          );
          rearPanel.position.set(0, 2.11, zRearOuter + 0.01);
          rearServiceCover.add(rearPanel);

          const louverGeo = trackGeo(new THREE.BoxGeometry(0.68, 0.032, 0.03));
          for (const lx of [-1.25, 0, 1.25]) {
            for (let r = 0; r < 5; r++) {
              const slot = new THREE.Mesh(louverGeo, recessSeamMat);
              slot.position.set(lx, 2.86 + r * 0.09, zRearOuter - 0.018);
              rearServiceCover.add(slot);
            }
          }

          const serialTex = trackTex(createRearSerialTexture());
          const serialMat = trackMat(new THREE.MeshStandardMaterial({
            map: serialTex,
            roughness: 0.30,
            metalness: 0.60,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          }));
          const serialPlate = new THREE.Mesh(
            trackGeo(new THREE.PlaneGeometry(1.52, 0.76)),
            serialMat
          );
          serialPlate.rotation.y = Math.PI;
          serialPlate.position.set(0, 2.12, zRearOuter - 0.022);
          rearServiceCover.add(serialPlate);

          const screwHeadGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.016, 18));
          screwHeadGeo.rotateX(Math.PI / 2);
          for (const [sx, sy] of [
            [-2.04, 3.30], [2.04, 3.30],
            [-2.04, 2.11], [2.04, 2.11],
            [-2.04, 0.92], [2.04, 0.92]
          ]) {
            const sc = new THREE.Mesh(screwHeadGeo, darkMetalMat);
            sc.position.set(sx, sy, zRearOuter - 0.018);
            rearServiceCover.add(sc);
          }

          const bayPocket = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(1.96, 0.56, 0.14)),
            recessSeamMat
          );
          bayPocket.position.set(0, 1.18, zRearOuter + 0.045);
          rearServiceCover.add(bayPocket);

          const bayBezel = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(2.04, 0.64, 0.02)),
            darkMetalMat
          );
          bayBezel.position.set(0, 1.18, zRearOuter - 0.016);
          rearServiceCover.add(bayBezel);

          const zPort = zRearOuter - 0.016;

          const rockerHousing = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.28, 0.34, 0.04)),
            darkMetalMat
          );
          rockerHousing.position.set(-0.66, 1.18, zPort);
          rearServiceCover.add(rockerHousing);

          const rockerCap = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.20, 0.24, 0.05)),
            trackMat(new THREE.MeshStandardMaterial({ color: 0x262b33, roughness: 0.42 }))
          );
          rockerCap.position.set(-0.66, 1.18, zPort - 0.018);
          rockerCap.rotation.x = 0.16;
          rearServiceCover.add(rockerCap);

          const pwrLed = new THREE.Mesh(
            trackGeo(new THREE.SphereGeometry(0.030, 14, 12)),
            trackMat(new THREE.MeshStandardMaterial({
              color: 0x22dd66, emissive: 0x16b850, emissiveIntensity: 1.0, roughness: 0.2
            }))
          );
          pwrLed.position.set(-0.38, 1.28, zPort - 0.01);
          rearServiceCover.add(pwrLed);

          const dcShell = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.105, 0.105, 0.05, 24)),
            brushedAlloyMat
          );
          dcShell.rotation.x = Math.PI / 2;
          dcShell.position.set(-0.10, 1.16, zPort - 0.01);
          rearServiceCover.add(dcShell);

          const dcPin = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.030, 0.030, 0.07, 16)),
            brushedAlloyMat
          );
          dcPin.rotation.x = Math.PI / 2;
          dcPin.position.set(-0.10, 1.16, zPort - 0.02);
          rearServiceCover.add(dcPin);

          const usbShell = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.24, 0.22, 0.05)),
            brushedAlloyMat
          );
          usbShell.position.set(0.32, 1.16, zPort - 0.01);
          rearServiceCover.add(usbShell);

          const usbCavity = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.17, 0.15, 0.055)),
            recessSeamMat
          );
          usbCavity.position.set(0.32, 1.16, zPort - 0.014);
          rearServiceCover.add(usbCavity);

          const usbBlueTongue = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.11, 0.05, 0.06)),
            trackMat(new THREE.MeshStandardMaterial({ color: 0x1668e8, roughness: 0.30, metalness: 0.15 }))
          );
          usbBlueTongue.position.set(0.32, 1.18, zPort - 0.016);
          rearServiceCover.add(usbBlueTongue);

          const kensSlot = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.14, 0.07, 0.04)),
            brushedAlloyMat
          );
          kensSlot.position.set(0.74, 1.16, zPort - 0.008);
          rearServiceCover.add(kensSlot);
        }

        productRoot.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        const opticalHeadBaseY = opticalHead.position.y;
        const fixtureBaseY = dentalCastFixture.position.y;
        const rearCoverBaseZ = rearServiceCover.position.z;

        function setExplodeFactor(t) {
          const k = Math.max(0, Math.min(1, t));
          const ease = k * k * (3 - 2 * k);
          opticalHead.position.y = opticalHeadBaseY + ease * 0.78;
          dentalCastFixture.position.y = fixtureBaseY + ease * 0.54;
          rearServiceCover.position.z = rearCoverBaseZ - ease * 0.56;
        }

        function setScanSpinAngle(theta) {
          spinPlatter.rotation.y = theta;
          gimbalPivot.rotation.x = baseTiltX + Math.sin(theta * 0.5) * 0.22;
          gimbalPivot.rotation.z = baseTiltZ + Math.cos(theta * 0.5) * 0.16;
        }

        function dispose() {
          geometries.forEach((g) => g.dispose());
          materials.forEach((m) => m.dispose());
          textures.forEach((t) => t.dispose());
        }

        return {
          productRoot,
          subAssemblies: {
            baseAssembly,
            cFrameColumn,
            opticalHead,
            rotaryTiltStage,
            dentalCastFixture,
            rearServiceCover
          },
          setExplodeFactor,
          setScanSpinAngle,
          dispose
        };
      }


      window.DentalAssetLibrary.assets['3shape-e4'] = {
        id: '3shape-e4',
        code: 'SCANNER-02',
        name: '3Shape E4',
        category: 'Ultra-Speed 4×5MP Scanner (Table 2 · Paired with 3Shape CAD PC-02)',
        capabilityNote: 'Paired directly with the dedicated 3Shape Workstation PC on its right (PC-02), which performs both scan post-processing and same-brand 3Shape CAD design.',
        tableId: 'table-scanners',
        realDimensionsMm: '378 × 337 × 335 mm',
        benchScale: 1.00,
        benchPosition: [17.30, 0.0, 0.05],
        subAssemblies: ['baseAssembly', 'cFrameColumn', 'opticalHead', 'rotaryTiltStage', 'dentalCastFixture', 'rearServiceCover'],
        createAsset: createThreeShapeE4Product
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetThreeShapeE4();

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
