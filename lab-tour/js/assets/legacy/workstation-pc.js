// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2) + GK3 component.html
// Component : <script id="component-6-asset-workstation-pc">
// sha256    : b6b17f4a9ff9f9c3b7d92ff9384fb3423c467b22d9442f1979a7c723960384fc
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────

    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetWorkstationPC = function () {
      const { THREE, RoundedBoxGeometry } = window.__THREE_BUNDLE__;

      function createTowerBadgeTexture(isThreeShape) {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 192;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#1b1f27';
        ctx.fillRect(0, 0, 512, 192);

        ctx.strokeStyle = isThreeShape ? '#c81926' : '#2563eb';
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, 496, 176);

        ctx.fillStyle = isThreeShape ? '#e11d2e' : '#3b82f6';
        ctx.fillRect(24, 26, 12, 140);

        ctx.fillStyle = '#eef2f8';
        ctx.font = '700 36px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(isThreeShape ? '3SHAPE CAD READY' : 'SCAN POST-PROC PC', 54, 74);

        ctx.fillStyle = '#b9c2d0';
        ctx.font = '600 24px "Inter", -apple-system, sans-serif';
        ctx.fillText(
          isThreeShape ? 'Post-Processing + Same-Brand Design' : 'SHINING 3D Mesh Post-Processing',
          54, 118
        );

        ctx.fillStyle = '#8893a4';
        ctx.font = '500 20px "SFMono-Regular", Consolas, monospace';
        ctx.fillText(
          isThreeShape ? 'Xeon / RTX CAD · 64GB ECC · USB 3.2' : 'Core i7 / RTX · 32GB RAM · USB 3.2',
          54, 154
        );

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createMonitorBezelLogoTexture(isThreeShape) {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 64;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 512, 64);
        ctx.fillStyle = '#9aa4b4';
        ctx.font = '600 26px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          isThreeShape ? '3SHAPE CERTIFIED CAD DISPLAY' : 'PRECISION POST-PROCESSING DISPLAY',
          256, 32
        );
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createCadWorkstationPC(options = {}) {
        const variant = options.variant === '3shape' ? '3shape' : 'dsex';
        const isThreeShape = (variant === '3shape');

        const geometries = [];
        const materials = [];
        const textures = [];
        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        const productRoot = new THREE.Group();
        productRoot.name = isThreeShape ? 'ThreeShapeCadWorkstationPC' : 'ShiningPostProcWorkstationPC';

        // Calibrated PBR Studio Materials
        const chassisMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x2b2f37,
          roughness: 0.44,
          metalness: 0.24,
          envMapIntensity: 1.20
        }));
        const bezelDarkMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x1d2026,
          roughness: 0.46,
          metalness: 0.16,
          envMapIntensity: 1.15
        }));
        const grilleRecessMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x12151a,
          roughness: 0.65,
          metalness: 0.10
        }));
        const standAlloyMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x454b56,
          roughness: 0.32,
          metalness: 0.68,
          envMapIntensity: 1.25
        }));
        const brushedMetalMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0xc4ccd8,
          roughness: 0.26,
          metalness: 0.84
        }));
        // Clean dark anti-glare standby IPS panel — NO software UI rendered inside per specification!
        const standbyScreenMat = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0x11151d,
          roughness: 0.24,
          metalness: 0.08,
          clearcoat: 0.55,
          clearcoatRoughness: 0.20,
          envMapIntensity: 1.10
        }));
        const accentMat = trackMat(new THREE.MeshStandardMaterial({
          color: isThreeShape ? 0xc81926 : 0x2563eb,
          emissive: isThreeShape ? 0x45050a : 0x0a2463,
          emissiveIntensity: 0.65,
          roughness: 0.28,
          metalness: 0.30
        }));
        const statusLedMat = trackMat(new THREE.MeshStandardMaterial({
          color: isThreeShape ? 0xef4444 : 0x38bdf8,
          emissive: isThreeShape ? 0xdc2626 : 0x0284c7,
          emissiveIntensity: 1.15,
          roughness: 0.20
        }));
        const deskMatFabric = trackMat(new THREE.MeshStandardMaterial({
          color: 0x20242c,
          roughness: 0.84,
          metalness: 0.02
        }));
        const keycapMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x282d36,
          roughness: 0.52,
          metalness: 0.08
        }));
        const rubberFootMat = trackMat(new THREE.MeshStandardMaterial({
          color: 0x111317,
          roughness: 0.88,
          metalness: 0.02
        }));

        // =====================================================================
        // 1. PRECISION CAD WORKSTATION TOWER (X = +2.68, seated flush at Y = 0.000)
        // =====================================================================
        const workstationTower = new THREE.Group();
        workstationTower.name = 'workstationTower';
        workstationTower.position.set(2.68, 0, -0.05);
        productRoot.add(workstationTower);

        const twW = 2.02, twH = 4.56, twD = 3.76; // ~162 x 365 x 301 mm ThinkStation-class CAD tower
        {
          // 4 Rubber Tower Feet (Y = 0.000 .. 0.06)
          const footGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.14, 0.06, 20));
          for (const [fx, fz] of [
            [-0.74, -1.48], [0.74, -1.48],
            [-0.74,  1.48], [0.74,  1.48]
          ]) {
            const ft = new THREE.Mesh(footGeo, rubberFootMat);
            ft.position.set(fx, 0.03, fz);
            workstationTower.add(ft);
          }

          // Main Steel Enclosure Body (Y = 0.06 .. 4.62)
          const bodyMesh = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(twW, twH, twD, 3, 0.06)),
            chassisMat
          );
          bodyMesh.position.set(0, 0.06 + twH * 0.5, 0);
          workstationTower.add(bodyMesh);

          // Sculpted Architectural Front Bezel (Z = +twD/2 + 0.05)
          const frontBezel = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(twW - 0.04, twH - 0.06, 0.14, 3, 0.04)),
            bezelDarkMat
          );
          frontBezel.position.set(0, 0.06 + twH * 0.5, twD * 0.5 + 0.04);
          workstationTower.add(frontBezel);

          // Recessed Perforated Airflow Grille Cavity + Precision Louver Fins
          const grillePocket = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(1.36, 3.12, 0.06)),
            grilleRecessMat
          );
          grillePocket.position.set(-0.20, 1.98, twD * 0.5 + 0.09);
          workstationTower.add(grillePocket);

          const louverGeo = trackGeo(new THREE.BoxGeometry(1.30, 0.036, 0.04));
          for (let i = 0; i < 24; i++) {
            const fin = new THREE.Mesh(louverGeo, chassisMat);
            fin.position.set(-0.20, 0.54 + i * 0.125, twD * 0.5 + 0.11);
            fin.rotation.x = 0.22;
            workstationTower.add(fin);
          }

          // Brand-Coded Vertical Accent Spine on Front Bezel (ThinkStation Red for 3Shape / Blue for DS-EX)
          const accentBar = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(0.065, 3.88, 0.04, 2, 0.015)),
            accentMat
          );
          accentBar.position.set(0.56, 2.34, twD * 0.5 + 0.115);
          workstationTower.add(accentBar);

          // Front I/O Strip (Power button + LED, USB-A x2, USB-C x2, SD slot)
          const pwrBtn = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 24)),
            brushedMetalMat
          );
          pwrBtn.rotation.x = Math.PI / 2;
          pwrBtn.position.set(0.76, 4.18, twD * 0.5 + 0.115);
          workstationTower.add(pwrBtn);

          const pwrLed = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(0.095, 0.012, 10, 24)),
            statusLedMat
          );
          pwrLed.position.set(0.76, 4.18, twD * 0.5 + 0.122);
          workstationTower.add(pwrLed);

          const usbPortGeo = trackGeo(new THREE.BoxGeometry(0.07, 0.15, 0.03));
          for (let u = 0; u < 3; u++) {
            const up = new THREE.Mesh(usbPortGeo, grilleRecessMat);
            up.position.set(0.76, 3.72 - u * 0.26, twD * 0.5 + 0.115);
            workstationTower.add(up);
          }

          // Front Capability Spec Badge (explicitly identifies 3Shape CAD design capability vs DS-EX post-proc!)
          const badgeTex = trackTex(createTowerBadgeTexture(isThreeShape));
          const badgeMat = trackMat(new THREE.MeshStandardMaterial({
            map: badgeTex,
            roughness: 0.34,
            metalness: 0.25,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          }));
          const frontBadge = new THREE.Mesh(
            trackGeo(new THREE.PlaneGeometry(1.30, 0.49)),
            badgeMat
          );
          frontBadge.position.set(-0.20, 4.02, twD * 0.5 + 0.116);
          workstationTower.add(frontBadge);

          // Rear Workstation I/O Panel (PSU, Exhaust Fan Grille, Motherboard I/O, RTX CAD GPU Ports)
          const zRear = -twD * 0.5 - 0.008;
          const ioShield = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.68, 1.56, 0.02)),
            brushedMetalMat
          );
          ioShield.position.set(-0.46, 3.36, zRear);
          workstationTower.add(ioShield);

          const fanRing = new THREE.Mesh(
            trackGeo(new THREE.RingGeometry(0.18, 0.48, 32)),
            grilleRecessMat
          );
          fanRing.rotation.y = Math.PI;
          fanRing.position.set(0.38, 3.42, zRear - 0.004);
          workstationTower.add(fanRing);

          // Dedicated Dual-Slot CAD GPU Rear Bracket + 4 DisplayPort Connectors
          const gpuBracket = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(1.36, 0.42, 0.025)),
            standAlloyMat
          );
          gpuBracket.position.set(-0.10, 1.92, zRear);
          workstationTower.add(gpuBracket);

          const dpGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.07, 0.03));
          for (let d = 0; d < 4; d++) {
            const dp = new THREE.Mesh(dpGeo, grilleRecessMat);
            dp.position.set(-0.52 + d * 0.28, 1.92, zRear - 0.006);
            workstationTower.add(dp);
          }

          // Bottom ATX Power Supply Bay + C14 Socket
          const psuBay = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(1.62, 0.86, 0.025)),
            bezelDarkMat
          );
          psuBay.position.set(0, 0.68, zRear);
          workstationTower.add(psuBay);

          const c14Inlet = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.34, 0.24, 0.035)),
            grilleRecessMat
          );
          c14Inlet.position.set(-0.46, 0.68, zRear - 0.008);
          workstationTower.add(c14Inlet);
        }

        // =====================================================================
        // 2. WIDESCREEN 24" FRAMELESS CAD MONITOR (X = -1.18, clean dark standby screen)
        // =====================================================================
        const displayMonitor = new THREE.Group();
        displayMonitor.name = 'displayMonitor';
        displayMonitor.position.set(-1.18, 0, -0.42);
        productRoot.add(displayMonitor);

        {
          // Weighted Cast-Aluminum Flat Monitor Stand Base (Y = 0.000 .. 0.08)
          const standPadsGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.016, 0.24));
          for (const [px, pz] of [[-0.86, -0.58], [0.86, -0.58], [-0.86, 0.58], [0.86, 0.58]]) {
            const pad = new THREE.Mesh(standPadsGeo, rubberFootMat);
            pad.position.set(px, 0.008, pz);
            displayMonitor.add(pad);
          }

          const standBase = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(2.06, 0.075, 1.48, 3, 0.025)),
            standAlloyMat
          );
          standBase.position.set(0, 0.052, 0);
          displayMonitor.add(standBase);

          // Angled Ergonomic Riser Column with Cable Pass-Through Ring
          const riserPillar = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(0.46, 3.28, 0.22, 3, 0.04)),
            standAlloyMat
          );
          riserPillar.position.set(0, 1.68, -0.34);
          riserPillar.rotation.x = 0.08;
          displayMonitor.add(riserPillar);

          const cableRing = new THREE.Mesh(
            trackGeo(new THREE.TorusGeometry(0.14, 0.026, 12, 28)),
            accentMat
          );
          cableRing.position.set(0, 1.12, -0.25);
          displayMonitor.add(cableRing);

          // VESA Tilt Hinge Arm
          const vesaArm = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(0.76, 0.56, 0.34, 2, 0.04)),
            bezelDarkMat
          );
          vesaArm.position.set(0, 3.38, -0.08);
          displayMonitor.add(vesaArm);

          // Monitor Head Group (tilted gently -3 deg backward for ergonomic viewing)
          const panelHead = new THREE.Group();
          panelHead.position.set(0, 3.58, 0.14);
          panelHead.rotation.x = -0.05;
          displayMonitor.add(panelHead);

          const monW = 5.18, monH = 3.08, monD = 0.18;

          // Sculpted Rear Housing
          const rearBack = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(monW, monH, monD, 3, 0.04)),
            chassisMat
          );
          panelHead.add(rearBack);

          // Slim Micro-Bezel Perimeter Frame
          const chinBar = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(monW, 0.20, 0.03)),
            bezelDarkMat
          );
          chinBar.position.set(0, -monH * 0.5 + 0.10, monD * 0.5 + 0.008);
          panelHead.add(chinBar);

          // Clean Satin Anti-Glare Standby IPS Glass (NO software UI rendered inside!)
          const screenGlass = new THREE.Mesh(
            trackGeo(new THREE.PlaneGeometry(monW - 0.16, monH - 0.28)),
            standbyScreenMat
          );
          screenGlass.position.set(0, 0.05, monD * 0.5 + 0.012);
          panelHead.add(screenGlass);

          // Subtle Bottom-Chin Display Label + Standby Indicator Dot
          const chinTex = trackTex(createMonitorBezelLogoTexture(isThreeShape));
          const chinLogo = new THREE.Mesh(
            trackGeo(new THREE.PlaneGeometry(1.75, 0.14)),
            trackMat(new THREE.MeshStandardMaterial({
              map: chinTex,
              transparent: true,
              alphaTest: 0.05,
              depthWrite: false,
              roughness: 0.4,
              polygonOffset: true,
              polygonOffsetFactor: -2,
              polygonOffsetUnits: -2
            }))
          );
          chinLogo.position.set(0, -monH * 0.5 + 0.10, monD * 0.5 + 0.026);
          panelHead.add(chinLogo);

          const standbyDot = new THREE.Mesh(
            trackGeo(new THREE.SphereGeometry(0.022, 12, 10)),
            statusLedMat
          );
          standbyDot.position.set(monW * 0.5 - 0.24, -monH * 0.5 + 0.10, monD * 0.5 + 0.024);
          panelHead.add(standbyDot);
        }

        // =====================================================================
        // 3. KEYBOARD, ERGONOMIC CAD MOUSE & DESK MAT (X = -1.05, Z = +1.42)
        // =====================================================================
        const peripheralsKit = new THREE.Group();
        peripheralsKit.name = 'peripheralsKit';
        peripheralsKit.position.set(-1.05, 0, 1.44);
        productRoot.add(peripheralsKit);

        {
          // Stitched Precision Desk Mat (Y = 0.000 .. 0.024)
          const matPad = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(4.86, 0.024, 1.76, 2, 0.008)),
            deskMatFabric
          );
          matPad.position.set(0, 0.012, 0);
          peripheralsKit.add(matPad);

          // Low-Profile Anodized Aluminum Keyboard Deck (on left of mat)
          const kbGroup = new THREE.Group();
          kbGroup.position.set(-0.56, 0.024, 0.04);
          kbGroup.rotation.x = 0.045;
          peripheralsKit.add(kbGroup);

          const kbDeck = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(3.36, 0.085, 1.14, 2, 0.02)),
            standAlloyMat
          );
          kbDeck.position.set(0, 0.045, 0);
          kbGroup.add(kbDeck);

          // Sculpted Keycap Clusters (Main Alphanumeric, Navigation, Numpad)
          const keyBlockMain = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(2.14, 0.045, 0.88, 2, 0.01)),
            keycapMat
          );
          keyBlockMain.position.set(-0.48, 0.098, 0.02);
          kbGroup.add(keyBlockMain);

          const keyBlockNav = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(0.38, 0.045, 0.88, 2, 0.01)),
            keycapMat
          );
          keyBlockNav.position.set(0.84, 0.098, 0.02);
          kbGroup.add(keyBlockNav);

          const keyBlockNum = new THREE.Mesh(
            trackGeo(new RoundedBoxGeometry(0.52, 0.045, 0.88, 2, 0.01)),
            keycapMat
          );
          keyBlockNum.position.set(1.34, 0.098, 0.02);
          kbGroup.add(keyBlockNum);

          // Ergonomic Sculpted CAD Mouse + Metallic Scroll Wheel (on right of keyboard)
          const mouseGroup = new THREE.Group();
          mouseGroup.position.set(1.74, 0.024, 0.06);
          peripheralsKit.add(mouseGroup);

          const mouseShellGeo = trackGeo(new THREE.SphereGeometry(0.28, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.52));
          mouseShellGeo.scale(0.95, 0.68, 1.52);
          const mouseShell = new THREE.Mesh(mouseShellGeo, bezelDarkMat);
          mouseShell.position.y = 0.01;
          mouseGroup.add(mouseShell);

          const scrollWheel = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.032, 18)),
            brushedMetalMat
          );
          scrollWheel.rotation.z = Math.PI / 2;
          scrollWheel.position.set(0, 0.185, -0.16);
          mouseGroup.add(scrollWheel);
        }

        // Enable shadows across all workstation meshes
        productRoot.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        const monBaseY = displayMonitor.position.y;
        const twBaseY = workstationTower.position.y;
        const periphBaseZ = peripheralsKit.position.z;

        function setExplodeFactor(t) {
          const k = Math.max(0, Math.min(1, t));
          const ease = k * k * (3 - 2 * k);
          displayMonitor.position.y = monBaseY + ease * 0.68;
          workstationTower.position.y = twBaseY + ease * 0.45;
          peripheralsKit.position.z = periphBaseZ + ease * 0.52;
        }

        function dispose() {
          geometries.forEach((g) => g.dispose());
          materials.forEach((m) => m.dispose());
          textures.forEach((t) => t.dispose());
        }

        return {
          productRoot,
          subAssemblies: {
            workstationTower,
            displayMonitor,
            peripheralsKit
          },
          setExplodeFactor,
          dispose
        };
      }

      // Register Dedicated Post-Processing PC for SHINING 3D DS-EX Pro (placed immediately to its right on Table 2)
      window.DentalAssetLibrary.assets['pc-dsex'] = {
        id: 'pc-dsex',
        code: 'PC-01',
        name: 'DS-EX Post-Processing PC',
        category: 'Dedicated Scanner Post-Processing Desktop Workstation (Right of DS-EX Pro)',
        capabilityNote: 'Dedicated desktop PC positioned beside the SHINING 3D DS-EX Pro for 3D scan alignment, mesh post-processing, and STL/PLY export.',
        tableId: 'table-scanners',
        realDimensionsMm: '590 × 305 × 422 mm',
        benchScale: 1.00,
        benchPosition: [8.45, 0.0, -0.05],
        subAssemblies: ['workstationTower', 'displayMonitor', 'peripheralsKit'],
        createAsset: () => createCadWorkstationPC({ variant: 'dsex' })
      };

      // Register Dedicated 3Shape Post-Processing & Same-Brand CAD Design PC (placed immediately to the right of 3Shape E4 on Table 2)
      window.DentalAssetLibrary.assets['pc-3shape'] = {
        id: 'pc-3shape',
        code: 'PC-02',
        name: '3Shape Design & Post-Processing PC',
        category: '3Shape E4 Post-Processing + Same-Brand 3Shape CAD Design Workstation',
        capabilityNote: 'Dedicated desktop PC beside the 3Shape E4 — handles scan post-processing AND is certified capable of full same-brand 3Shape CAD restoration design.',
        tableId: 'table-scanners',
        realDimensionsMm: '590 × 305 × 422 mm',
        benchScale: 1.00,
        benchPosition: [24.95, 0.0, -0.05],
        subAssemblies: ['workstationTower', 'displayMonitor', 'peripheralsKit'],
        createAsset: () => createCadWorkstationPC({ variant: '3shape' })
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetWorkstationPC();

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
