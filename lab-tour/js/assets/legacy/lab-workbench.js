// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2) + GK3 component.html
// Component : <script id="component-7-lab-workbench">
// sha256    : beae4b0dbc86cb688ca4a37b98c5d8f02eeddb0495e6049dbbad6273c2eb3f0c
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────

    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerLabWorkbench = function () {
      const { THREE, RoundedBoxGeometry } = window.__THREE_BUNDLE__;

      function createOakBenchtopTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const baseGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        baseGrad.addColorStop(0, '#ddd0be');
        baseGrad.addColorStop(0.5, '#d5c6b2');
        baseGrad.addColorStop(1, '#cbbba4');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 220; i++) {
          const y = ((i * 73) % 512);
          const h = 1 + (i % 3);
          const alpha = 0.022 + ((i * 19) % 10) * 0.003;
          ctx.fillStyle = (i % 2 === 0)
            ? `rgba(128, 102, 74, ${alpha})`
            : `rgba(248, 240, 228, ${alpha})`;
          ctx.fillRect(0, y, canvas.width, h);
        }

        ctx.strokeStyle = 'rgba(115, 92, 68, 0.08)';
        ctx.lineWidth = 1.5;
        for (let row = 1; row < 6; row++) {
          const py = (row / 6) * canvas.height;
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(canvas.width, py);
          ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createStationPlaqueTexture(code, title, subtitle, accentHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 176;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#181d26';
        ctx.fillRect(0, 0, 640, 176);

        ctx.strokeStyle = accentHex || '#475569';
        ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, 630, 166);

        ctx.fillStyle = accentHex || '#60a5fa';
        ctx.font = '700 22px "SFMono-Regular", Consolas, monospace';
        ctx.fillText(code, 24, 42);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 32px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(title, 24, 92);

        if (subtitle) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '600 21px "Inter", -apple-system, sans-serif';
          ctx.fillText(subtitle, 24, 138);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createTableFrontSignTexture(label, sublabel, accentHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#141922';
        ctx.fillRect(0, 0, 1024, 128);

        ctx.fillStyle = accentHex;
        ctx.fillRect(0, 0, 18, 128);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 38px "Inter", -apple-system, sans-serif';
        ctx.fillText(label, 42, 56);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 25px "Inter", -apple-system, sans-serif';
        ctx.fillText(sublabel, 42, 98);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createLabWorkbench() {
        const geometries = [];
        const materials = [];
        const textures = [];
        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        const workbenchGroup = new THREE.Group();
        workbenchGroup.name = 'TwoTableDentalLabWorkbench';

        const floorY = -8.20;
        const topThick = 0.42;
        const D = 9.80;

        const oakTex = trackTex(createOakBenchtopTexture());
        const matOakTop = trackMat(new THREE.MeshStandardMaterial({
          map: oakTex,
          roughness: 0.62,
          metalness: 0.03
        }));
        const matSteelFrame = trackMat(new THREE.MeshStandardMaterial({
          color: 0x262c36,
          roughness: 0.46,
          metalness: 0.66
        }));
        const matBrushedAlum = trackMat(new THREE.MeshStandardMaterial({
          color: 0xc2cad6,
          roughness: 0.30,
          metalness: 0.82
        }));
        const matRubberPad = trackMat(new THREE.MeshStandardMaterial({
          color: 0x111317,
          roughness: 0.88,
          metalness: 0.04
        }));
        const matDataCable = trackMat(new THREE.MeshStandardMaterial({
          color: 0x1c2129,
          roughness: 0.55,
          metalness: 0.15
        }));

        // Helper that builds one complete architectural oak-and-steel lab table centered at centerX
        function buildSingleTable({
          name,
          centerX,
          widthW,
          legOffsetsX,
          crossOffsetsX,
          frontBannerTitle,
          frontBannerSub,
          bannerAccent,
          plaques
        }) {
          const tblGroup = new THREE.Group();
          tblGroup.name = name;
          tblGroup.position.set(centerX, 0, 0);

          // 1. Butcher-block oak tabletop slab (top face at exact Y = 0.000)
          const topGeo = trackGeo(new RoundedBoxGeometry(widthW, topThick, D, 4, 0.055));
          const topSlab = new THREE.Mesh(topGeo, matOakTop);
          topSlab.name = 'benchtopSlab';
          topSlab.position.set(0, -topThick * 0.5, 0);
          topSlab.receiveShadow = true;
          topSlab.castShadow = true;
          tblGroup.add(topSlab);

          // Front brushed aluminum bullnose trim
          const frontTrim = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(widthW + 0.04, 0.14, 0.08, 2, 0.02)),
            matBrushedAlum
          );
          frontTrim.position.set(0, -0.16, D * 0.5 + 0.01);
          tblGroup.add(frontTrim);

          // Low-profile rear aluminum cable-management lip (height 0.22 so Rear I/O views remain unobstructed)
          const rearRiser = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(widthW - 0.2, 0.22, 0.16, 2, 0.03)),
            matBrushedAlum
          );
          rearRiser.position.set(0, 0.11, -D * 0.5 + 0.12);
          rearRiser.castShadow = true;
          rearRiser.receiveShadow = true;
          tblGroup.add(rearRiser);

          // Under-bench steel structural apron rails + front zone nameplate
          const apronW = widthW - 1.5;
          const apronD = D - 1.4;
          const longBeamGeo = trackGeo(new THREE.BoxGeometry(apronW, 0.36, 0.22));
          for (const sz of [-apronD * 0.5, apronD * 0.5]) {
            const beam = new THREE.Mesh(longBeamGeo, matSteelFrame);
            beam.position.set(0, -topThick - 0.195, sz);
            beam.castShadow = true;
            tblGroup.add(beam);
          }

          // Front Apron Table Zone Sign (clearly labels Table 1: Furnaces Only vs Table 2: Scanners + PCs)
          const signTex = trackTex(createTableFrontSignTexture(frontBannerTitle, frontBannerSub, bannerAccent));
          const signMesh = new THREE.Mesh(
            trackGeo(new THREE.PlaneGeometry(5.6, 0.70)),
            trackMat(new THREE.MeshBasicMaterial({ map: signTex }))
          );
          signMesh.position.set(0, -topThick - 0.22, apronD * 0.5 + 0.12);
          tblGroup.add(signMesh);

          const signBack = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(5.72, 0.78, 0.04, 2, 0.01)),
            matSteelFrame
          );
          signBack.position.set(0, -topThick - 0.22, apronD * 0.5 + 0.095);
          tblGroup.add(signBack);

          const crossBeamGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.36, apronD));
          for (const sx of crossOffsetsX) {
            const cbeam = new THREE.Mesh(crossBeamGeo, matSteelFrame);
            cbeam.position.set(sx, -topThick - 0.195, 0);
            cbeam.castShadow = true;
            tblGroup.add(cbeam);
          }

          // H-frame tubular steel legs + leveling feet
          const legH = Math.abs(floorY) - topThick - 0.18;
          const legGeo = trackGeo(new RoundedBoxGeometry(0.38, legH, 0.38, 3, 0.04));
          const footStemGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16));
          const footPadGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.26, 0.08, 24));
          const legZList = [-apronD * 0.5 + 0.12, apronD * 0.5 - 0.12];

          for (const lx of legOffsetsX) {
            for (const lz of legZList) {
              const leg = new THREE.Mesh(legGeo, matSteelFrame);
              leg.position.set(lx, -topThick - 0.015 - legH * 0.5, lz);
              leg.castShadow = true;
              leg.receiveShadow = true;
              tblGroup.add(leg);

              const stem = new THREE.Mesh(footStemGeo, matBrushedAlum);
              stem.position.set(lx, floorY + 0.13, lz);
              tblGroup.add(stem);

              const pad = new THREE.Mesh(footPadGeo, matRubberPad);
              pad.position.set(lx, floorY + 0.04, lz);
              tblGroup.add(pad);
            }

            const sideBar = new THREE.Mesh(
              trackGeo(new RoundedBoxGeometry(0.26, 0.24, apronD - 0.3, 2, 0.03)),
              matSteelFrame
            );
            sideBar.position.set(lx, floorY + 1.55, 0);
            sideBar.castShadow = true;
            tblGroup.add(sideBar);
          }

          const rearStretcher = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(apronW - 0.24, 0.26, 0.26, 2, 0.03)),
            matSteelFrame
          );
          rearStretcher.position.set(0, floorY + 1.55, -apronD * 0.5 + 0.12);
          rearStretcher.castShadow = true;
          tblGroup.add(rearStretcher);

          // Front-edge Station Plaques (world X converted to local X relative to centerX)
          const plaqueBaseGeo = trackGeo(new RoundedBoxGeometry(2.86, 0.026, 0.78, 2, 0.01));
          const plaqueTopGeo = trackGeo(new THREE.PlaneGeometry(2.76, 0.70));
          plaqueTopGeo.rotateX(-Math.PI * 0.5);

          for (const p of plaques) {
            const localX = p.worldX - centerX;
            const pBase = new THREE.Mesh(plaqueBaseGeo, matBrushedAlum);
            pBase.position.set(localX, 0.013, 4.18);
            pBase.receiveShadow = true;
            tblGroup.add(pBase);

            const pTex = trackTex(createStationPlaqueTexture(p.code, p.title, p.subtitle, p.accent));
            const pMat = trackMat(new THREE.MeshBasicMaterial({ map: pTex }));
            const pTop = new THREE.Mesh(plaqueTopGeo, pMat);
            pTop.position.set(localX, 0.027, 4.18);
            tblGroup.add(pTop);
          }

          workbenchGroup.add(tblGroup);
          return tblGroup;
        }

        // =====================================================================
        // TABLE 1 (LEFT): DEDICATED FURNACE TABLE (Zubler Vario 200, UPCERA A7+, Programat P300)
        // Spans X = [-30.30, -7.50], Width = 22.80 units (1.82 m), Center X = -18.90
        // =====================================================================
        const furnaceTableGroup = buildSingleTable({
          name: 'furnaceTableGroup',
          centerX: -18.90,
          widthW: 22.80,
          legOffsetsX: [-10.50, 0.0, 10.50],
          crossOffsetsX: [-10.65, -3.55, 3.55, 10.65],
          frontBannerTitle: 'TABLE 01 · THERMAL FURNACE BENCH',
          frontBannerSub: 'Dedicated Ceramic Pressing & Vacuum Sintering Zone (3 Furnaces)',
          bannerAccent: '#f59e0b',
          plaques: [
            { worldX: -26.00, code: 'FURNACE 01 · PRESSING', title: 'Zubler Vario 200', subtitle: 'Ceramic & Press Furnace', accent: '#f59e0b' },
            { worldX: -18.90, code: 'FURNACE 02 · VACUUM', title: 'UPCERA A7+', subtitle: 'Porcelain Vacuum Furnace', accent: '#f59e0b' },
            { worldX: -11.80, code: 'FURNACE 03 · CLAMSHELL', title: 'Programat P300', subtitle: 'Ivoclar QTK2 Furnace', accent: '#f59e0b' }
          ]
        });

        // =====================================================================
        // TABLE 2 (RIGHT): DIGITAL SCANNERS & DEDICATED POST-PROCESSING PCs
        // Spans X = [-3.30, +30.30], Width = 33.60 units (2.69 m), Center X = +13.50
        // - Pair 1: SHINING 3D DS-EX Pro (X = +0.80) + Dedicated Post-Proc PC on right (X = +8.45)
        // - Pair 2: 3Shape E4 (X = +17.30) + Dedicated 3Shape Post-Proc & CAD Design PC on right (X = +24.95)
        // =====================================================================
        const scannerTableGroup = buildSingleTable({
          name: 'scannerTableGroup',
          centerX: 13.50,
          widthW: 33.60,
          legOffsetsX: [-15.90, -5.30, 5.30, 15.90],
          crossOffsetsX: [-16.05, -8.00, 0.0, 8.00, 16.05],
          frontBannerTitle: 'TABLE 02 · SCANNERS & POST-PROCESSING PCs',
          frontBannerSub: 'Each Scanner Paired with Dedicated Right-Side Workstation · 3Shape PC Design-Capable',
          bannerAccent: '#e11d2e',
          plaques: [
            { worldX:  0.80, code: 'SCANNER 01 · OPTICAL', title: 'SHINING 3D DS-EX Pro', subtitle: 'Paired -> Right-Side PC-01', accent: '#3b82f6' },
            { worldX:  8.45, code: 'PC 01 · POST-PROCESSING', title: 'DS-EX Workstation PC', subtitle: 'Mesh Alignment & Export', accent: '#3b82f6' },
            { worldX: 17.30, code: 'SCANNER 02 · 4×5MP RED', title: '3Shape E4 Scanner', subtitle: 'Paired -> Right-Side PC-02', accent: '#e11d2e' },
            { worldX: 24.95, code: 'PC 02 · 3SHAPE CAD + POST', title: '3Shape Design PC', subtitle: 'Same-Brand 3Shape Design Capable', accent: '#e11d2e' }
          ]
        });

        // Neat Rear USB 3.0 High-Speed Data Umbilicals linking each Scanner directly into the PC Tower on its right!
        function addScannerToPcCable(scannerWorldX, scannerRearZ, towerWorldX, towerRearZ) {
          const x0 = scannerWorldX - 13.50;
          const x1 = towerWorldX - 13.50;
          const midX = (x0 + x1) * 0.5;
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x0, 0.65, scannerRearZ),
            new THREE.Vector3(x0 + 0.5, 0.08, -3.55),
            new THREE.Vector3(midX, 0.05, -3.75),
            new THREE.Vector3(x1 - 0.4, 0.08, -3.45),
            new THREE.Vector3(x1, 0.95, towerRearZ)
          ]);
          const cableGeo = trackGeo(new THREE.TubeGeometry(curve, 32, 0.036, 10, false));
          const cableMesh = new THREE.Mesh(cableGeo, matDataCable);
          cableMesh.castShadow = true;
          scannerTableGroup.add(cableMesh);
        }

        // Connect DS-EX Pro (X=0.80) -> PC-01 Tower (X = 8.45 + 2.68 = 11.13)
        addScannerToPcCable(0.80, -3.20, 11.13, -1.96);
        // Connect 3Shape E4 (X=17.30) -> PC-02 Tower (X = 24.95 + 2.68 = 27.63)
        addScannerToPcCable(17.30, -2.02, 27.63, -1.96);

        function dispose() {
          for (const g of geometries) g.dispose();
          for (const m of materials) m.dispose();
          for (const t of textures) t.dispose();
        }

        return {
          workbenchGroup,
          furnaceTableGroup,
          scannerTableGroup,
          floorY,
          dispose
        };
      }

      window.DentalAssetLibrary.LabWorkbench = { createLabWorkbench };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerLabWorkbench();

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
