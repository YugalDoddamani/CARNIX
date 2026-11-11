// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2).html
// Component : <script id="component-2-asset-zubler-vario-200">
// sha256    : 5e14813ba60d0353c81e765190c1b2b4b6d0dbe54115f41fbb34bf7467158688
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────



    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetZublerVario200 = function () {
      const { THREE, RoundedBoxGeometry } = window.__THREE_BUNDLE__;

      function sampleRoundedRect(w, d, r, segmentsPerCorner = 12, cx = 0, cz = 0) {
        const rr = Math.min(r, w * 0.48, d * 0.48);
        const hw = w * 0.5 - rr;
        const hd = d * 0.5 - rr;
        const corners = [
          { x:  hw, z:  hd, a0: 0,               a1: Math.PI * 0.5 },
          { x: -hw, z:  hd, a0: Math.PI * 0.5,   a1: Math.PI       },
          { x: -hw, z: -hd, a0: Math.PI,         a1: Math.PI * 1.5 },
          { x:  hw, z: -hd, a0: Math.PI * 1.5,   a1: Math.PI * 2.0 }
        ];
        const pts = [];
        for (const c of corners) {
          for (let i = 0; i <= segmentsPerCorner; i++) {
            const a = c.a0 + (c.a1 - c.a0) * (i / segmentsPerCorner);
            pts.push({ x: cx + c.x + Math.cos(a) * rr, z: cz + c.z + Math.sin(a) * rr });
          }
        }
        return pts;
      }

      function createLoftedRoundedRect(slices, segmentsPerCorner = 12, capBottom = true, capTop = true) {
        const rings = slices.map(s =>
          sampleRoundedRect(s.w, s.d, s.r, segmentsPerCorner, s.cx || 0, s.cz || 0)
        );
        const ringLen = rings[0].length;
        const finalPos = [];
        const finalNrm = [];
        const finalIdx = [];

        function addBand(startS, endS) {
          const pos = [];
          const idx = [];
          for (let s = startS; s <= endS; s++) {
            const y = slices[s].y;
            for (let i = 0; i < ringLen; i++) {
              pos.push(rings[s][i].x, y, rings[s][i].z);
            }
          }
          const countS = endS - startS + 1;
          for (let s = 0; s < countS - 1; s++) {
            const rA = s * ringLen;
            const rB = (s + 1) * ringLen;
            for (let i = 0; i < ringLen; i++) {
              const iN = (i + 1) % ringLen;
              idx.push(rA + i, rB + iN, rA + iN);
              idx.push(rA + i, rB + i,  rB + iN);
            }
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setIndex(idx);
          g.computeVertexNormals();

          const baseV = finalPos.length / 3;
          const pArr = g.attributes.position.array;
          const nArr = g.attributes.normal.array;
          const iArr = g.index.array;
          for (let k = 0; k < pArr.length; k++) finalPos.push(pArr[k]);
          for (let k = 0; k < nArr.length; k++) finalNrm.push(nArr[k]);
          for (let k = 0; k < iArr.length; k++) finalIdx.push(baseV + iArr[k]);
          g.dispose();
        }

        let bandStart = 0;
        for (let s = 1; s < slices.length; s++) {
          if (slices[s].crease && s < slices.length - 1) {
            addBand(bandStart, s);
            bandStart = s;
          }
        }
        addBand(bandStart, slices.length - 1);

        if (capBottom) {
          const s0 = slices[0];
          const baseV = finalPos.length / 3;
          finalPos.push(s0.cx || 0, s0.y, s0.cz || 0);
          finalNrm.push(0, -1, 0);
          for (let i = 0; i < ringLen; i++) {
            finalPos.push(rings[0][i].x, s0.y, rings[0][i].z);
            finalNrm.push(0, -1, 0);
          }
          for (let i = 0; i < ringLen; i++) {
            const iN = (i + 1) % ringLen;
            finalIdx.push(baseV, baseV + 1 + i, baseV + 1 + iN);
          }
        }

        if (capTop) {
          const sL = slices[slices.length - 1];
          const rL = rings[rings.length - 1];
          const baseV = finalPos.length / 3;
          finalPos.push(sL.cx || 0, sL.y, sL.cz || 0);
          finalNrm.push(0, 1, 0);
          for (let i = 0; i < ringLen; i++) {
            finalPos.push(rL[i].x, sL.y, rL[i].z);
            finalNrm.push(0, 1, 0);
          }
          for (let i = 0; i < ringLen; i++) {
            const iN = (i + 1) % ringLen;
            finalIdx.push(baseV, baseV + 1 + iN, baseV + 1 + i);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(finalPos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(finalNrm, 3));
        geo.setIndex(finalIdx);
        return geo;
      }

      function extrudeAlongX(shape, xMin, xMax, bevel = 0.035, bevelSegments = 3, curveSegments = 28) {
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
       * High-DPI Zubler Vario 200 LCD Firing Program UI texture matching reference photos.
       */
      function createZublerLcdTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');

        // Backlit LCD sage-mint background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#d3e5da');
        grad.addColorStop(1, '#c3dacd');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Top dual amber/yellow program header bars
        ctx.fillStyle = '#e7c635';
        ctx.fillRect(0, 0, canvas.width, 54);
        ctx.fillStyle = '#dec02b';
        ctx.fillRect(0, 58, canvas.width, 48);

        ctx.strokeStyle = 'rgba(28, 36, 32, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 56);
        ctx.lineTo(canvas.width, 56);
        ctx.moveTo(0, 108);
        ctx.lineTo(canvas.width, 108);
        ctx.stroke();

        ctx.fillStyle = '#1b221e';
        ctx.font = '700 26px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('002   VARIO 200          CERAMIC', 220, 36);
        ctx.font = '600 25px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('920°C    Kat. 1    DENTIN FIRING 1', 120, 91);

        // Firing schedule parameter columns
        const leftRows = [
          ['Program Type',     'Professional'],
          ['Start Temperature','450°C'],
          ['Drying',           'Yes'],
          ['Drying Time',      '4:00'],
          ['Closing Time',     '2:00'],
          ['Homogenize Temp',  '450°C'],
          ['Homogenize Time',  '0:30'],
          ['Heating Rate',     '55°C/min'],
          ['Final Temperature','920°C'],
          ['Holding Time',     '1:00']
        ];
        const rightRows = [
          ['Tempering',        'No'],
          ['',                 ''],
          ['Opening Temp',     '700°C'],
          ['Opening Time',     '0:20'],
          ['Vacuum',           'Yes'],
          ['Release Vacuum',   'Normal'],
          ['Vacuum Start',     '550°C'],
          ['Vacuum End',       '915°C']
        ];

        ctx.font = '600 21px "Segoe UI", Inter, monospace';
        for (let i = 0; i < leftRows.length; i++) {
          const y = 148 + i * 42;
          ctx.fillStyle = '#24302a';
          ctx.fillText('· ' + leftRows[i][0], 26, y);
          ctx.fillStyle = '#141c18';
          ctx.textAlign = 'right';
          ctx.fillText(leftRows[i][1], 505, y);
          ctx.textAlign = 'left';
        }
        for (let i = 0; i < rightRows.length; i++) {
          if (!rightRows[i][0]) continue;
          const y = 148 + i * 42;
          ctx.fillStyle = '#24302a';
          ctx.fillText('· ' + rightRows[i][0], 545, y);
          ctx.fillStyle = '#141c18';
          ctx.textAlign = 'right';
          ctx.fillText(rightRows[i][1], 996, y);
          ctx.textAlign = 'left';
        }

        // Bottom-left green OK softkey bar
        ctx.fillStyle = '#4ad658';
        ctx.fillRect(24, 584, 215, 42);
        ctx.fillStyle = '#102414';
        ctx.font = '700 23px "Segoe UI", Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OK', 131, 613);
        ctx.textAlign = 'left';

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Crisp Zubler 4-color square emblem + bold `zubler®` wordmark texture.
       */
      function createZublerBrandTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2x2 color-pixel Zubler icon on left
        const ox = 72;
        const oy = 52;
        const sz = 24;
        const gap = 4;
        ctx.fillStyle = '#1da1db';
        ctx.fillRect(ox, oy, sz, sz);
        ctx.fillStyle = '#f2c318';
        ctx.fillRect(ox + sz + gap, oy, sz, sz);
        ctx.fillStyle = '#38b24a';
        ctx.fillRect(ox, oy + sz + gap, sz, sz);
        ctx.fillStyle = '#d92738';
        ctx.fillRect(ox + sz + gap, oy + sz + gap, sz, sz);

        // Bold `zubler®` wordmark
        ctx.fillStyle = '#15181e';
        ctx.font = '800 68px "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('zubler', 142, 104);

        ctx.font = '600 24px "Segoe UI", Inter, Arial, sans-serif';
        ctx.fillText('®', 362, 72);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      /**
       * Dual yellow ISO hot-surface caution triangles visible on lower-right muffle skirt.
       */
      function createHotWarningTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const cx of [70, 186]) {
          ctx.beginPath();
          ctx.moveTo(cx, 18);
          ctx.lineTo(cx + 46, 102);
          ctx.lineTo(cx - 46, 102);
          ctx.closePath();
          ctx.fillStyle = '#e7be22';
          ctx.fill();
          ctx.lineWidth = 7;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#181a1e';
          ctx.stroke();

          // Simplified hot-surface / caution glyph inside triangle
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(cx - 18, 88);
          ctx.lineTo(cx + 18, 88);
          ctx.moveTo(cx, 48);
          ctx.lineTo(cx, 76);
          ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createZublerVario200Product() {
        const geometries = [];
        const materials = [];
        const textures = [];

        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        // Authentic Zubler Vario 200 satin-white, slate-blue-grey & refractory ceramic PBR materials
        const matWhiteBody = trackMat(new THREE.MeshStandardMaterial({
          color: 0xf0f1f4,
          metalness: 0.06,
          roughness: 0.35
        }));
        const matWhiteWarm = trackMat(new THREE.MeshStandardMaterial({
          color: 0xe3e6ec,
          metalness: 0.08,
          roughness: 0.40
        }));
        const matSlateColumn = trackMat(new THREE.MeshStandardMaterial({
          color: 0x39444e,
          metalness: 0.28,
          roughness: 0.44
        }));
        const matSlateDark = trackMat(new THREE.MeshStandardMaterial({
          color: 0x242b33,
          metalness: 0.24,
          roughness: 0.42
        }));
        const matCapBlack = trackMat(new THREE.MeshStandardMaterial({
          color: 0x171b20,
          metalness: 0.18,
          roughness: 0.35
        }));
        const matCavityBlack = trackMat(new THREE.MeshStandardMaterial({
          color: 0x0a0c0f,
          metalness: 0.10,
          roughness: 0.62
        }));
        const matCoolingTray = trackMat(new THREE.MeshStandardMaterial({
          color: 0xdbe0e7,
          metalness: 0.30,
          roughness: 0.36
        }));
        const matMetalCollar = trackMat(new THREE.MeshStandardMaterial({
          color: 0x8e959f,
          metalness: 0.58,
          roughness: 0.30
        }));
        const matCeramicCone = trackMat(new THREE.MeshStandardMaterial({
          color: 0xe8e3d9,
          metalness: 0.02,
          roughness: 0.80
        }));
        const matBtnGreen = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0x24a645,
          metalness: 0.05,
          roughness: 0.22,
          clearcoat: 0.55,
          clearcoatRoughness: 0.20
        }));
        const matBtnRed = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0xc91e3a,
          metalness: 0.05,
          roughness: 0.22,
          clearcoat: 0.55,
          clearcoatRoughness: 0.20
        }));
        const matBtnYellow = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0xe7be1f,
          metalness: 0.05,
          roughness: 0.22,
          clearcoat: 0.55,
          clearcoatRoughness: 0.20
        }));

        const productRoot = new THREE.Group();
        productRoot.name = 'productRoot';
        const dummy = new THREE.Object3D();

        const coreX = -0.36;
        const coreZ = 0.40;

        /* ====================================================================
           1. BASE ASSEMBLY + OVERHANGING RIBBED COOLING TRAY
           ==================================================================== */
        const baseAssembly = new THREE.Group();
        baseAssembly.name = 'baseAssembly';

        const footGeo = trackGeo(new THREE.CylinderGeometry(0.20, 0.22, 0.05, 20));
        for (const [fx, fz] of [[-1.58, 1.85], [0.86, 1.85], [-1.58, -0.45], [0.86, -0.45]]) {
          const foot = new THREE.Mesh(footGeo, matCavityBlack);
          foot.position.set(fx, 0.025, fz);
          baseAssembly.add(foot);
        }

        const baseFlange = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.05, w: 3.12, d: 3.08, r: 0.09, cx: coreX, cz: 0.86 },
            { y: 0.13, w: 3.12, d: 3.08, r: 0.09, cx: coreX, cz: 0.86 }
          ], 8, true, true)),
          matWhiteWarm
        );
        baseFlange.name = 'baseBottomFlange';
        baseAssembly.add(baseFlange);

        const baseHousing = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.13, w: 3.06, d: 3.02, r: 0.08, cx: coreX, cz: 0.85 },
            { y: 1.02, w: 3.06, d: 3.02, r: 0.08, cx: coreX, cz: 0.85, crease: true },
            { y: 1.06, w: 3.00, d: 2.96, r: 0.07, cx: coreX, cz: 0.85 }
          ], 8, false, true)),
          matWhiteBody
        );
        baseHousing.name = 'baseHousing';
        baseAssembly.add(baseHousing);

        // Right-side (+X) recessed I/O ports visible in side reference (external power cord omitted)
        const rightWallX = coreX + 1.53;
        const usbBezel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.025, 0.16, 0.28)), matMetalCollar);
        usbBezel.position.set(rightWallX + 0.004, 0.40, 1.32);
        baseAssembly.add(usbBezel);

        const usbSlot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.028, 0.08, 0.20)), matCavityBlack);
        usbSlot.position.set(rightWallX + 0.008, 0.40, 1.32);
        baseAssembly.add(usbSlot);

        const auxPort = new THREE.Mesh(trackGeo(new RoundedBoxGeometry(0.028, 0.18, 0.30, 2, 0.03)), matCavityBlack);
        auxPort.position.set(rightWallX + 0.008, 0.38, 0.38);
        baseAssembly.add(auxPort);

        const dinSocket = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.028, 24)), matCavityBlack);
        dinSocket.rotation.z = Math.PI * 0.5;
        dinSocket.position.set(rightWallX + 0.008, 0.40, -0.08);
        baseAssembly.add(dinSocket);

        // Crescent ribbed cooling tray on +X side of base deck
        const coolingTrayGroup = new THREE.Group();
        coolingTrayGroup.name = 'coolingTray';
        const trayRestPos = new THREE.Vector3(0, 0, 0);

        const traySub = new THREE.Group();
        traySub.position.set(coreX + 0.35, 1.24, coreZ + 0.16);
        traySub.rotation.z = -0.055;

        const trayShape = new THREE.Shape();
        const outerR = 1.62;
        const innerR = 0.96;
        trayShape.moveTo(-0.48, 1.46);
        trayShape.lineTo( 0.05, 1.46);
        for (let i = 0; i <= 28; i++) {
          const a = (Math.PI * 0.45) - (i / 28) * (Math.PI * 0.90);
          trayShape.lineTo(0.04 + Math.cos(a) * outerR, Math.sin(a) * 1.46);
        }
        trayShape.lineTo(-0.48, -1.20);
        for (let i = 0; i <= 20; i++) {
          const a = -Math.PI * 0.46 + (i / 20) * (Math.PI * 0.92);
          trayShape.lineTo(-0.35 + Math.cos(a) * innerR, -0.16 + Math.sin(a) * innerR);
        }
        trayShape.closePath();

        const trayPlateGeo = trackGeo(new THREE.ExtrudeGeometry(trayShape, {
          depth: 0.075,
          bevelEnabled: true,
          bevelThickness: 0.022,
          bevelSize: 0.022,
          bevelSegments: 3,
          curveSegments: 24,
          steps: 1
        }));
        trayPlateGeo.rotateX(Math.PI * 0.5);
        trayPlateGeo.computeVertexNormals();
        const trayPlate = new THREE.Mesh(trayPlateGeo, matCoolingTray);
        traySub.add(trayPlate);

        const trayRibCount = 32;
        const trayRibGeo = trackGeo(new THREE.BoxGeometry(0.022, 0.022, 1.0));
        const trayRibs = new THREE.InstancedMesh(trayRibGeo, matWhiteBody, trayRibCount);
        for (let i = 0; i < trayRibCount; i++) {
          const rx = -0.20 + i * (1.76 / (trayRibCount - 1));
          const dx = Math.max(0, (rx - 0.04) / outerR);
          if (dx >= 0.96) {
            dummy.scale.set(0.001, 0.001, 0.001);
          } else {
            const halfZ = Math.sqrt(Math.max(0.02, 1 - dx * dx)) * 1.38;
            if (rx > -0.35 + innerR + 0.04) {
              dummy.position.set(rx, 0.032, 0.0);
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(1, 1, halfZ * 1.88);
            } else {
              dummy.position.set(rx, 0.032, 1.12);
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(1, 1, 0.46);
            }
          }
          dummy.updateMatrix();
          trayRibs.setMatrixAt(i, dummy.matrix);
        }
        trayRibs.instanceMatrix.needsUpdate = true;
        traySub.add(trayRibs);
        coolingTrayGroup.add(traySub);

        const trayStand = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(1.08, 1.12, 0.14, 32)),
          matWhiteWarm
        );
        trayStand.position.set(coreX + 0.52, 1.12, coreZ + 0.16);
        coolingTrayGroup.add(trayStand);

        baseAssembly.add(coolingTrayGroup);
        productRoot.add(baseAssembly);

        /* ====================================================================
           2. LIFT COLUMN (Two-Tier Slate-Grey Tower + Sloped Louvered Cap)
           ==================================================================== */
        const liftColumn = new THREE.Group();
        liftColumn.name = 'liftColumn';

        const colW = 3.06;

        const rearColShape = new THREE.Shape();
        rearColShape.moveTo(-2.56, 0.12);
        rearColShape.lineTo(-1.33, 0.12);
        rearColShape.lineTo(-1.33, 6.52);
        rearColShape.lineTo(-2.56, 6.26);
        rearColShape.closePath();

        const rearColumnMesh = new THREE.Mesh(
          trackGeo(extrudeAlongX(rearColShape, coreX - colW * 0.5, coreX + colW * 0.5, 0.038, 3, 12)),
          matSlateColumn
        );
        rearColumnMesh.name = 'columnRearTower';
        liftColumn.add(rearColumnMesh);

        const leftCheekW = (-0.50) - (coreX - colW * 0.5);
        const leftCheekCenterX = ((coreX - colW * 0.5) + (-0.50)) * 0.5;
        const frontLeftCheek = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(leftCheekW, 4.02, 0.72, 3, 0.035)),
          matSlateColumn
        );
        frontLeftCheek.position.set(leftCheekCenterX, 2.13, -1.00);
        liftColumn.add(frontLeftCheek);

        const rightCheekW = (coreX + colW * 0.5) - (-0.22);
        const rightCheekCenterX = ((-0.22) + (coreX + colW * 0.5)) * 0.5;
        const frontRightCheek = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(rightCheekW, 4.02, 0.72, 3, 0.035)),
          matSlateColumn
        );
        frontRightCheek.position.set(rightCheekCenterX, 2.13, -1.00);
        liftColumn.add(frontRightCheek);

        const liftSlotCavity = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.30, 4.00, 0.68)),
          matCavityBlack
        );
        liftSlotCavity.position.set(coreX, 2.13, -0.98);
        liftColumn.add(liftSlotCavity);

        const midStepCap = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(colW - 0.04, 0.04, 0.70, 2, 0.015)),
          matCapBlack
        );
        midStepCap.position.set(coreX, 4.15, -1.00);
        liftColumn.add(midStepCap);

        const colPlinth = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(colW - 0.16, 0.13, 1.80, 2, 0.02)),
          matCapBlack
        );
        colPlinth.position.set(coreX, 0.065, -1.60);
        liftColumn.add(colPlinth);

        const capShape = new THREE.Shape();
        capShape.moveTo(-2.56, 6.26);
        capShape.lineTo(-1.32, 6.52);
        capShape.lineTo(-1.32, 6.78);
        capShape.quadraticCurveTo(-1.94, 6.68, -2.56, 6.50);
        capShape.closePath();

        const colTopCap = new THREE.Mesh(
          trackGeo(extrudeAlongX(capShape, coreX - colW * 0.5 + 0.01, coreX + colW * 0.5 - 0.01, 0.032, 3, 16)),
          matCapBlack
        );
        colTopCap.name = 'columnTopCap';
        liftColumn.add(colTopCap);

        const capLouvers = new THREE.InstancedMesh(
          trackGeo(new THREE.BoxGeometry(colW - 0.44, 0.024, 0.044)),
          matCavityBlack,
          9
        );
        const capSlope = Math.atan2(6.78 - 6.50, 1.24);
        for (let i = 0; i < 9; i++) {
          const t = i / 8;
          const lz = -1.46 - t * 0.96;
          const ly = 6.77 - t * 0.215;
          dummy.position.set(coreX, ly, lz);
          dummy.rotation.set(capSlope, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          capLouvers.setMatrixAt(i, dummy.matrix);
        }
        capLouvers.instanceMatrix.needsUpdate = true;
        liftColumn.add(capLouvers);

        const seamFrontGeo = trackGeo(new THREE.BoxGeometry(0.012, 3.98, 0.022));
        const seamRearGeo = trackGeo(new THREE.BoxGeometry(0.012, 6.14, 0.022));
        for (const sx of [coreX - colW * 0.5 - 0.008, coreX + colW * 0.5 + 0.008]) {
          const seamFront = new THREE.Mesh(seamFrontGeo, matCapBlack);
          seamFront.position.set(sx, 2.11, -1.34);
          liftColumn.add(seamFront);

          const seamRear = new THREE.Mesh(seamRearGeo, matCapBlack);
          seamRear.position.set(sx, 3.22, -2.32);
          liftColumn.add(seamRear);
        }

        productRoot.add(liftColumn);

        /* ====================================================================
           3. FIRING PEDESTAL (Metallic Collar + Ceramic Refractory Cone)
           ==================================================================== */
        const firingPedestal = new THREE.Group();
        firingPedestal.name = 'firingPedestal';
        const pedestalRestPos = new THREE.Vector3(coreX, 1.06, coreZ);
        firingPedestal.position.copy(pedestalRestPos);

        const pedBaseCollar = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.88, 0.92, 0.36, 48)),
          matMetalCollar
        );
        pedBaseCollar.position.y = 0.18;
        firingPedestal.add(pedBaseCollar);

        const pedInnerDish = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.76, 0.76, 0.04, 44)),
          matSlateDark
        );
        pedInnerDish.position.y = 0.365;
        firingPedestal.add(pedInnerDish);

        const ceramicFlange = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.68, 0.71, 0.16, 44)),
          matCeramicCone
        );
        ceramicFlange.position.y = 0.45;
        firingPedestal.add(ceramicFlange);

        const ceramicFrustum = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.45, 0.58, 0.78, 48)),
          matCeramicCone
        );
        ceramicFrustum.position.y = 0.92;
        firingPedestal.add(ceramicFrustum);

        const hearthTop = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 36)),
          matWhiteWarm
        );
        hearthTop.position.y = 1.315;
        firingPedestal.add(hearthTop);

        productRoot.add(firingPedestal);

        /* ====================================================================
           4. CYLINDRICAL FIRING CHAMBER HEAD
           ==================================================================== */
        const chamberHead = new THREE.Group();
        chamberHead.name = 'chamberHead';
        const chamberRestPos = new THREE.Vector3(coreX, 4.18, coreZ);
        chamberHead.position.copy(chamberRestPos);

        const chamR = 1.73;

        const lowerDrumProfile = [
          new THREE.Vector2(chamR - 0.05, 0.00),
          new THREE.Vector2(chamR,        0.04),
          new THREE.Vector2(chamR,        2.55),
          new THREE.Vector2(chamR - 0.04, 2.57),
          new THREE.Vector2(0.0,          2.57)
        ];
        const lowerDrum = new THREE.Mesh(
          trackGeo(new THREE.LatheGeometry(lowerDrumProfile, 64)),
          matWhiteBody
        );
        lowerDrum.name = 'chamberLowerDrum';
        chamberHead.add(lowerDrum);

        const bottomPlate = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(chamR - 0.06, chamR - 0.06, 0.03, 56)),
          matSlateDark
        );
        bottomPlate.position.y = -0.015;
        chamberHead.add(bottomPlate);

        const underNozzle = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.52, 0.32, 0.24, 40)),
          matMetalCollar
        );
        underNozzle.position.y = -0.13;
        chamberHead.add(underNozzle);

        const nozzleRing = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32)),
          matCavityBlack
        );
        nozzleRing.position.y = -0.255;
        chamberHead.add(nozzleRing);

        // Rear lift-carriage bracket connecting chamber into vertical lift slot
        const carriageArm = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(1.18, 0.20, 1.10, 3, 0.03)),
          matCapBlack
        );
        carriageArm.position.set(0, 0.12, -1.18);
        chamberHead.add(carriageArm);

        // Circumferential horizontal cooling-slot band
        const slotCoreCylinder = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(chamR - 0.09, chamR - 0.09, 0.11, 56)),
          matCavityBlack
        );
        slotCoreCylinder.position.y = 2.605;
        chamberHead.add(slotCoreCylinder);

        const pillarCount = 12;
        const bridgeArc = 0.068;
        for (let i = 0; i < pillarCount; i++) {
          const a0 = (i / pillarCount) * Math.PI * 2 + 0.12;
          const pillarGeo = trackGeo(new THREE.CylinderGeometry(chamR, chamR, 0.075, 6, 1, true, a0, bridgeArc));
          const pillar = new THREE.Mesh(pillarGeo, matWhiteBody);
          pillar.position.y = 2.605;
          chamberHead.add(pillar);
        }

        // Upper white crown + gently domed top cap
        const upperCrownProfile = [
          new THREE.Vector2(0.0,          2.64),
          new THREE.Vector2(chamR - 0.04, 2.64),
          new THREE.Vector2(chamR,        2.66),
          new THREE.Vector2(chamR,        2.98),
          new THREE.Vector2(chamR - 0.05, 3.05),
          new THREE.Vector2(chamR - 0.18, 3.09),
          new THREE.Vector2(0.75,         3.12),
          new THREE.Vector2(0.0,          3.12)
        ];
        const upperCrown = new THREE.Mesh(
          trackGeo(new THREE.LatheGeometry(upperCrownProfile, 64)),
          matWhiteBody
        );
        upperCrown.name = 'chamberUpperCrown';
        chamberHead.add(upperCrown);

        // Top centered circular dark louvered exhaust vent grille
        const topVentR = 0.74;
        const topVentBezel = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(topVentR, topVentR + 0.02, 0.026, 48)),
          matCapBlack
        );
        topVentBezel.position.y = 3.133;
        chamberHead.add(topVentBezel);

        const topVentCavity = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(topVentR - 0.05, topVentR - 0.05, 0.028, 44)),
          matCavityBlack
        );
        topVentCavity.position.y = 3.136;
        chamberHead.add(topVentCavity);

        const topSlatCount = 13;
        for (let i = 0; i < topSlatCount; i++) {
          const dz = -0.58 + i * (1.16 / (topSlatCount - 1));
          const chordW = 2.0 * Math.sqrt(Math.max(0.01, (topVentR - 0.07) ** 2 - dz * dz));
          const slat = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(chordW, 0.022, 0.032)),
            matSlateDark
          );
          slat.position.set(0, 3.155, dz);
          slat.rotation.x = 0.22;
          chamberHead.add(slat);
        }

        // Dual yellow ISO hot-surface caution triangles wrapped onto lower front-right skirt
        const warnTex = trackTex(createHotWarningTexture());
        const warnMat = trackMat(new THREE.MeshBasicMaterial({
          map: warnTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const warnArcGeo = trackGeo(new THREE.CylinderGeometry(
          chamR + 0.004,
          chamR + 0.004,
          0.22,
          14,
          1,
          true,
          0.52,
          0.26
        ));
        const warnPatch = new THREE.Mesh(warnArcGeo, warnMat);
        warnPatch.name = 'hotSurfaceWarningDecal';
        warnPatch.position.y = 0.24;
        warnPatch.castShadow = false;
        warnPatch.receiveShadow = false;
        chamberHead.add(warnPatch);

        productRoot.add(chamberHead);

        /* ====================================================================
           5. ANGLED FRONT-RIGHT CONTROL CONSOLE (LCD + Jog-Dial + 6 Keys)
           ==================================================================== */
        const controlConsole = new THREE.Group();
        controlConsole.name = 'controlConsole';
        const consoleRestPos = new THREE.Vector3(0, 0, 0);

        const conXMin = -1.48;
        const conXMax =  2.36;
        const conCenterX = (conXMin + conXMax) * 0.5;
        const conW = conXMax - conXMin;

        const wedgeShape = new THREE.Shape();
        wedgeShape.moveTo(2.34, 0.05);
        wedgeShape.lineTo(3.16, 0.05);
        wedgeShape.quadraticCurveTo(3.22, 0.07, 3.20, 0.14);
        wedgeShape.lineTo(2.02, 2.04);
        wedgeShape.quadraticCurveTo(1.96, 2.09, 1.86, 2.04);
        wedgeShape.lineTo(1.62, 1.88);
        wedgeShape.lineTo(2.12, 1.06);
        wedgeShape.lineTo(2.34, 1.06);
        wedgeShape.closePath();

        const consoleWedgeMesh = new THREE.Mesh(
          trackGeo(extrudeAlongX(wedgeShape, conXMin, conXMax, 0.038, 3, 20)),
          matSlateColumn
        );
        consoleWedgeMesh.name = 'consoleCasing';
        controlConsole.add(consoleWedgeMesh);

        const panelTilt = Math.atan2(1.18, 1.90);
        const faceGroup = new THREE.Group();
        faceGroup.name = 'consoleFaceGroup';
        faceGroup.position.set(conCenterX, 1.09, 2.61);
        faceGroup.rotation.x = -panelTilt;
        faceGroup.translateZ(0.018);

        const fpW = conW - 0.22;
        const fpH = 2.04;

        const faceplate = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(fpW, fpH, 0.026, 3, 0.02)),
          matWhiteBody
        );
        faceplate.name = 'consoleFaceplate';
        faceplate.position.z = 0.052;
        faceGroup.add(faceplate);

        // Hollow 4-bar recessed LCD bezel + high-DPI backlit Zubler Vario 200 display
        const lcdX = -0.68;
        const lcdY = 0.17;
        const lcdW = 1.74;
        const lcdH = 1.06;
        const bThick = 0.045;

        const topBar = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(lcdW + bThick * 2, bThick, 0.022)),
          matCapBlack
        );
        topBar.position.set(lcdX, lcdY + lcdH * 0.5 + bThick * 0.5, 0.072);
        faceGroup.add(topBar);

        const botBar = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(lcdW + bThick * 2, bThick, 0.022)),
          matCapBlack
        );
        botBar.position.set(lcdX, lcdY - lcdH * 0.5 - bThick * 0.5, 0.072);
        faceGroup.add(botBar);

        const sideBarGeo = trackGeo(new THREE.BoxGeometry(bThick, lcdH, 0.022));
        for (const sgn of [-1, 1]) {
          const sBar = new THREE.Mesh(sideBarGeo, matCapBlack);
          sBar.position.set(lcdX + sgn * (lcdW * 0.5 + bThick * 0.5), lcdY, 0.072);
          faceGroup.add(sBar);
        }

        const lcdTex = trackTex(createZublerLcdTexture());
        const lcdMat = trackMat(new THREE.MeshPhysicalMaterial({
          map: lcdTex,
          roughness: 0.16,
          metalness: 0.02,
          clearcoat: 0.65,
          clearcoatRoughness: 0.14
        }));
        const lcdPane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(lcdW, lcdH)),
          lcdMat
        );
        lcdPane.name = 'lcdDisplayPane';
        lcdPane.position.set(lcdX, lcdY, 0.070);
        lcdPane.castShadow = false;
        lcdPane.receiveShadow = false;
        faceGroup.add(lcdPane);

        // Rotary Jog-Dial / Navigation Ring on right side
        const dialX = 1.04;
        const dialY = 0.24;

        const dialDish = new THREE.Mesh(
          trackGeo(new THREE.RingGeometry(0.29, 0.54, 48)),
          matWhiteWarm
        );
        dialDish.position.set(dialX, dialY, 0.068);
        faceGroup.add(dialDish);

        const dialRing = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.255, 0.024, 16, 48)),
          matCapBlack
        );
        dialRing.position.set(dialX, dialY, 0.076);
        faceGroup.add(dialRing);

        const dialCap = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.23, 0.23, 0.022, 40)),
          matWhiteBody
        );
        dialCap.rotation.x = Math.PI * 0.5;
        dialCap.position.set(dialX, dialY, 0.070);
        faceGroup.add(dialCap);

        const dialTick = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.022, 0.13, 0.014)),
          matCapBlack
        );
        dialTick.position.set(dialX, dialY + 0.13, 0.086);
        faceGroup.add(dialTick);

        // Authentic `zubler®` 4-color pixel mark + wordmark below rotary jog-dial
        const logoTex = trackTex(createZublerBrandTexture());
        const logoMat = trackMat(new THREE.MeshBasicMaterial({
          map: logoTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const logoPlane = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(0.76, 0.24)),
          logoMat
        );
        logoPlane.name = 'zublerBrandLogo';
        logoPlane.position.set(dialX, -0.34, 0.068);
        logoPlane.castShadow = false;
        logoPlane.receiveShadow = false;
        faceGroup.add(logoPlane);

        // 6 Colored Tactile Membrane Keys (Green, Red, Yellow, Yellow | Yellow, Yellow)
        const btnSpecs = [
          { x: -1.32, mat: matBtnGreen  },
          { x: -0.90, mat: matBtnRed    },
          { x: -0.48, mat: matBtnYellow },
          { x: -0.06, mat: matBtnYellow },
          { x:  0.82, mat: matBtnYellow },
          { x:  1.26, mat: matBtnYellow }
        ];
        const btnY = -0.68;
        const keyBaseGeo = trackGeo(new RoundedBoxGeometry(0.265, 0.30, 0.024, 3, 0.035));
        const keyDomeGeo = trackGeo(new THREE.CylinderGeometry(0.078, 0.088, 0.016, 24));
        for (let i = 0; i < btnSpecs.length; i++) {
          const b = btnSpecs[i];
          const keyBase = new THREE.Mesh(keyBaseGeo, b.mat);
          keyBase.position.set(b.x, btnY, 0.072);
          faceGroup.add(keyBase);

          const keyDome = new THREE.Mesh(keyDomeGeo, b.mat);
          keyDome.rotation.x = Math.PI * 0.5;
          keyDome.position.set(b.x, btnY - 0.02, 0.086);
          faceGroup.add(keyDome);
        }

        controlConsole.add(faceGroup);
        productRoot.add(controlConsole);

        // Enable shadows on all solid housing meshes (skipping flat decal/screen planes)
        productRoot.traverse((child) => {
          if (
            child.isMesh &&
            !child.name.includes('Logo') &&
            !child.name.includes('Decal') &&
            !child.name.includes('Pane')
          ) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Mechanically authentic exploded-view vectors (chamber rises along lift axis)
        const chamberExplodeOffset = new THREE.Vector3(0, 1.35, 0);
        const pedestalExplodeOffset = new THREE.Vector3(0, 0.62, 0);
        const trayExplodeOffset = new THREE.Vector3(0.65, 0, 0);
        const consoleExplodeOffset = new THREE.Vector3(0, 0, 0.68);

        function setExplodeFactor(t) {
          const clamped = Math.max(0, Math.min(1, t));
          chamberHead.position.copy(chamberRestPos).addScaledVector(chamberExplodeOffset, clamped);
          firingPedestal.position.copy(pedestalRestPos).addScaledVector(pedestalExplodeOffset, clamped);
          coolingTrayGroup.position.copy(trayRestPos).addScaledVector(trayExplodeOffset, clamped);
          controlConsole.position.copy(consoleRestPos).addScaledVector(consoleExplodeOffset, clamped);
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

      window.DentalAssetLibrary.assets['zubler-vario-200'] = {
        id: 'zubler-vario-200',
        code: 'FURNACE-01',
        name: 'Zubler Vario 200',
        category: 'Dental Pressing & Ceramic Furnace (Table 1 · Furnace Bench)',
        capabilityNote: 'Dedicated pressing & ceramic firing station on Table 1 (Thermal Furnace Bench), isolated from digital optical scanning hardware.',
        tableId: 'table-furnaces',
        realDimensionsMm: '295 × 430 × 590 mm',
        benchScale: 1.00,
        benchPosition: [-26.00, 0.0, -0.22],
        subAssemblies: ['baseChassis', 'verticalColumn', 'firingHood', 'controlConsole', 'firingPedestal', 'rearManifoldIO'],
        createAsset: createZublerVario200Product
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetZublerVario200();

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
