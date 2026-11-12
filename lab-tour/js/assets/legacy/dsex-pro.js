// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Source    : Dental_Lab_Equipment_Asset_Library (2) + GK3 component.html
// Component : <script id="component-1-asset-dsex-pro">
// sha256    : 2a449e973c8cb3870f8f349bc0c13eacb2cbfcbedbdb12d643149ee842aee7c2
//
// Everything between the BEGIN/END markers is the original component source,
// byte for byte. Fixes and overrides belong in ../registry.js, so a newer export
// of the library can be re-imported without losing them.
// ─────────────────────────────────────────────────────────────────────────────
import { window } from './_legacy-window.js';

// ── BEGIN original source ────────────────────────────────────────────────────



    window.DentalAssetLibrary = window.DentalAssetLibrary || { assets: {} };
    window.__registerAssetDSExPro = function () {
      const { THREE, RoundedBoxGeometry } = window.__THREE_BUNDLE__;

      function sampleRoundedRect(w, d, r, segmentsPerCorner = 14, cx = 0, cz = 0) {
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

      /**
       * Smoothly lofts stacked rounded-rectangle cross-sections along Y while
       * preserving razor-sharp industrial bevel creases where `slice.crease === true`.
       */
      function createLoftedRoundedRect(slices, segmentsPerCorner = 14, capBottom = true, capTop = true) {
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

      /**
       * Extrudes a 2D (Z, Y) profile along the X axis from `xMin` to `xMax` with soft bevels.
       */
      function extrudeAlongX(shape, xMin, xMax, bevel = 0.045, bevelSegments = 4, curveSegments = 36) {
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
       * Generates crisp high-DPI procedural canvas wordmark textures (zero external image files).
       */
      function createWordmarkTexture(text, colorCss, fontWeight = 700, letterSpacingPx = 5) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = colorCss;
        ctx.font = `${fontWeight} 76px "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif`;
        ctx.textBaseline = 'middle';

        const chars = text.split('');
        let totalW = 0;
        for (let i = 0; i < chars.length; i++) {
          totalW += ctx.measureText(chars[i]).width + (i < chars.length - 1 ? letterSpacingPx : 0);
        }
        let cursorX = (canvas.width - totalW) * 0.5;
        const centerY = canvas.height * 0.52;
        for (let i = 0; i < chars.length; i++) {
          ctx.fillText(chars[i], cursorX, centerY);
          cursorX += ctx.measureText(chars[i]).width + letterSpacingPx;
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      }

      function createDSExProProduct() {
        const geometries = [];
        const materials = [];
        const textures = [];

        const trackGeo = (g) => { geometries.push(g); return g; };
        const trackMat = (m) => { materials.push(m); return m; };
        const trackTex = (t) => { textures.push(t); return t; };

        // Restrained, realistic SHINING 3D DS-EX Pro dark-graphite & gloss-black palette
        const matGraphite = trackMat(new THREE.MeshStandardMaterial({
          color: 0x353840,
          metalness: 0.34,
          roughness: 0.42
        }));
        const matGraphiteLight = trackMat(new THREE.MeshStandardMaterial({
          color: 0x464a53,
          metalness: 0.30,
          roughness: 0.44
        }));
        const matGlossyBlack = trackMat(new THREE.MeshStandardMaterial({
          color: 0x101216,
          metalness: 0.26,
          roughness: 0.18
        }));
        const matLowerTrim = trackMat(new THREE.MeshStandardMaterial({
          color: 0x17191e,
          metalness: 0.22,
          roughness: 0.36
        }));
        const matBarrelDark = trackMat(new THREE.MeshStandardMaterial({
          color: 0x14161a,
          metalness: 0.18,
          roughness: 0.48
        }));
        const matOpticalGlass = trackMat(new THREE.MeshPhysicalMaterial({
          color: 0x14121c,
          metalness: 0.45,
          roughness: 0.12,
          clearcoat: 0.85,
          clearcoatRoughness: 0.12
        }));
        const matTurntable = trackMat(new THREE.MeshStandardMaterial({
          color: 0x41444c,
          metalness: 0.30,
          roughness: 0.42
        }));
        const matVentDark = trackMat(new THREE.MeshStandardMaterial({
          color: 0x090a0c,
          metalness: 0.10,
          roughness: 0.60
        }));
        const matMetalRing = trackMat(new THREE.MeshStandardMaterial({
          color: 0x8d939e,
          metalness: 0.68,
          roughness: 0.28
        }));

        const productRoot = new THREE.Group();
        productRoot.name = 'productRoot';
        const dummy = new THREE.Object3D();

        // Base shifted forward (+0.35 in Z) so scanner head cantilevers cleanly past -Z rear edge
        const baseCZ = 0.35;

        /* ====================================================================
           1. BASE ASSEMBLY (V-Waist Knife-Edge Profile + Compact 12-Slot Vent)
           ==================================================================== */
        const baseAssembly = new THREE.Group();
        baseAssembly.name = 'baseAssembly';

        const footPad = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.00, w: 5.04, d: 5.44, r: 0.56, cz: baseCZ },
            { y: 0.04, w: 5.18, d: 5.58, r: 0.58, cz: baseCZ }
          ], 12, true, false)),
          matVentDark
        );
        footPad.name = 'footPad';
        baseAssembly.add(footPad);

        // Inward-tapered matte dark lower hull (y: 0.035 .. 0.58)
        const lowerTrim = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.035, w: 5.22, d: 5.62, r: 0.60, cz: baseCZ },
            { y: 0.09,  w: 5.34, d: 5.74, r: 0.62, cz: baseCZ },
            { y: 0.55,  w: 5.84, d: 6.24, r: 0.74, cz: baseCZ },
            { y: 0.58,  w: 5.86, d: 6.26, r: 0.74, cz: baseCZ }
          ], 14, true, false)),
          matLowerTrim
        );
        lowerTrim.name = 'lowerTrim';
        baseAssembly.add(lowerTrim);

        // Outward-flared ~42° glossy black upper perimeter bevel (y: 0.57 .. 0.96)
        const perimeterTrim = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.57,  w: 5.87, d: 6.27, r: 0.74, cz: baseCZ },
            { y: 0.61,  w: 5.86, d: 6.26, r: 0.74, cz: baseCZ },
            { y: 0.92,  w: 5.42, d: 5.82, r: 0.65, cz: baseCZ },
            { y: 0.96,  w: 5.34, d: 5.74, r: 0.63, cz: baseCZ }
          ], 14, false, false)),
          matGlossyBlack
        );
        perimeterTrim.name = 'perimeterTrim';
        baseAssembly.add(perimeterTrim);

        // Flat graphite top deck (y: 0.94 .. 0.98)
        const baseHousing = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.94,  w: 5.34, d: 5.74, r: 0.63, cz: baseCZ },
            { y: 0.98,  w: 5.28, d: 5.68, r: 0.62, cz: baseCZ }
          ], 14, false, true)),
          matGraphite
        );
        baseHousing.name = 'baseHousing';
        baseAssembly.add(baseHousing);

        // Subtle transverse deck seam right behind upright collar
        const deckSeam = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(3.65, 0.010, 0.020)),
          matVentDark
        );
        deckSeam.name = 'deckSeam';
        deckSeam.position.set(0.76, 0.988, 0.72);
        baseAssembly.add(deckSeam);

        // Compact 12-slot vertical ventilation cluster on +Z front-left lower sloped wall
        const slotCount = 12;
        const slotGeo = trackGeo(new THREE.BoxGeometry(0.042, 0.23, 0.030));
        const ventilationSlots = new THREE.InstancedMesh(slotGeo, matVentDark, slotCount);
        ventilationSlots.name = 'ventilationSlots';
        const hullSlope = Math.atan2(0.25, 0.46);
        for (let i = 0; i < slotCount; i++) {
          const sx = -1.45 + i * (0.82 / (slotCount - 1));
          dummy.position.set(sx, 0.32, 3.342);
          dummy.rotation.set(hullSlope, 0, 0);
          dummy.updateMatrix();
          ventilationSlots.setMatrixAt(i, dummy.matrix);
        }
        ventilationSlots.instanceMatrix.needsUpdate = true;
        baseAssembly.add(ventilationSlots);

        // Two tiny subtle unlit recessed dashes on +X lower sloped wall
        const sideDashGeo = trackGeo(new THREE.BoxGeometry(0.028, 0.026, 0.095));
        for (const dz of [0.34, 0.52]) {
          const dash = new THREE.Mesh(sideDashGeo, matVentDark);
          dash.position.set(2.804, 0.33, dz);
          dash.rotation.set(0, 0, -hullSlope);
          baseAssembly.add(dash);
        }

        productRoot.add(baseAssembly);

        /* ====================================================================
           2. UPRIGHT SUPPORT (~11°-Canted C-Spine + Slim Throat + ~15° Boom)
           ==================================================================== */
        const uprightSupport = new THREE.Group();
        uprightSupport.name = 'uprightSupport';

        // Layer 1 (Outermost -X glossy black C-band, x: -2.68 .. -2.34)
        const glossyShape = new THREE.Shape();
        glossyShape.moveTo( 0.80, 0.92);
        glossyShape.lineTo( 2.88, 0.62);
        glossyShape.bezierCurveTo( 3.28, 0.64,  3.46, 0.88,  3.53, 1.25);
        glossyShape.lineTo( 3.84, 2.74);
        glossyShape.bezierCurveTo( 3.91, 3.22,  3.62, 3.48,  3.12, 3.61);
        glossyShape.lineTo(-1.62, 4.86);
        glossyShape.lineTo(-2.05, 4.86);
        glossyShape.lineTo(-2.05, 4.30);
        glossyShape.lineTo(-1.38, 4.08);
        glossyShape.bezierCurveTo(-0.25, 3.74,  0.96, 3.22,  1.16, 2.38);
        glossyShape.bezierCurveTo( 1.26, 1.82,  1.02, 1.24,  0.80, 0.92);
        glossyShape.closePath();

        const glossyInset = new THREE.Mesh(
          trackGeo(extrudeAlongX(glossyShape, -2.68, -2.34, 0.042, 4, 36)),
          matGlossyBlack
        );
        glossyInset.name = 'glossyInset';
        uprightSupport.add(glossyInset);

        // Glossy black upper ridge cap along C-back and boom top (x: -2.36 .. -2.02)
        const topRidgeShape = new THREE.Shape();
        topRidgeShape.moveTo( 2.86, 0.93);
        topRidgeShape.quadraticCurveTo( 3.36, 0.96,  3.50, 1.30);
        topRidgeShape.lineTo( 3.82, 2.74);
        topRidgeShape.bezierCurveTo( 3.89, 3.20,  3.60, 3.46,  3.10, 3.59);
        topRidgeShape.lineTo(-1.62, 4.84);
        topRidgeShape.lineTo(-2.05, 4.84);
        topRidgeShape.lineTo(-2.05, 4.68);
        topRidgeShape.lineTo(-1.62, 4.68);
        topRidgeShape.lineTo( 3.05, 3.44);
        topRidgeShape.bezierCurveTo( 3.46, 3.33,  3.68, 3.12,  3.62, 2.72);
        topRidgeShape.lineTo( 3.32, 1.28);
        topRidgeShape.quadraticCurveTo( 3.22, 0.98,  2.86, 0.95);
        topRidgeShape.closePath();

        const topGlossyRidge = new THREE.Mesh(
          trackGeo(extrudeAlongX(topRidgeShape, -2.36, -2.02, 0.024, 3, 36)),
          matGlossyBlack
        );
        topGlossyRidge.name = 'glossyTopRidge';
        uprightSupport.add(topGlossyRidge);

        // Layer 2 (Dark recessed C-pocket channel behind pill bracket, x: -2.35 .. -2.03)
        const midSpineShape = new THREE.Shape();
        midSpineShape.moveTo( 0.80, 0.96);
        midSpineShape.lineTo( 2.95, 0.96);
        midSpineShape.quadraticCurveTo( 3.22, 0.98,  3.31, 1.28);
        midSpineShape.lineTo( 3.61, 2.72);
        midSpineShape.bezierCurveTo( 3.67, 3.11,  3.45, 3.32,  3.04, 3.43);
        midSpineShape.lineTo(-1.62, 4.67);
        midSpineShape.lineTo(-2.05, 4.67);
        midSpineShape.lineTo(-2.05, 4.30);
        midSpineShape.lineTo(-1.38, 4.08);
        midSpineShape.bezierCurveTo(-0.25, 3.80,  0.98, 3.28,  1.18, 2.40);
        midSpineShape.bezierCurveTo( 1.26, 1.82,  1.02, 1.26,  0.80, 0.96);
        midSpineShape.closePath();

        const outerSpine = new THREE.Mesh(
          trackGeo(extrudeAlongX(midSpineShape, -2.35, -2.03, 0.035, 3, 36)),
          matLowerTrim
        );
        outerSpine.name = 'supportOuterSpine';
        uprightSupport.add(outerSpine);

        // Layer 3 (Inner structural graphite boom & slim forward neck column, x: -2.05 .. -1.64)
        const innerBodyShape = new THREE.Shape();
        innerBodyShape.moveTo( 0.80, 0.96);
        innerBodyShape.lineTo( 1.68, 0.96);
        innerBodyShape.lineTo( 1.98, 2.74);
        innerBodyShape.quadraticCurveTo( 2.08, 3.26,  2.56, 3.40);
        innerBodyShape.lineTo( 2.98, 3.51);
        innerBodyShape.lineTo(-1.62, 4.74);
        innerBodyShape.lineTo(-2.05, 4.74);
        innerBodyShape.lineTo(-2.05, 4.30);
        innerBodyShape.lineTo(-1.38, 4.08);
        innerBodyShape.bezierCurveTo(-0.25, 3.74,  0.96, 3.22,  1.16, 2.38);
        innerBodyShape.bezierCurveTo( 1.26, 1.82,  1.02, 1.26,  0.80, 0.96);
        innerBodyShape.closePath();

        const supportBody = new THREE.Mesh(
          trackGeo(extrudeAlongX(innerBodyShape, -2.05, -1.64, 0.048, 4, 36)),
          matGraphite
        );
        supportBody.name = 'supportBody';
        uprightSupport.add(supportBody);

        // Sculpted base collar flare right behind turntable
        const neckCollarShape = new THREE.Shape();
        neckCollarShape.moveTo( 0.74, 0.97);
        neckCollarShape.lineTo( 1.68, 0.97);
        neckCollarShape.lineTo( 1.62, 1.38);
        neckCollarShape.quadraticCurveTo( 1.12, 1.44,  0.86, 1.20);
        neckCollarShape.closePath();
        const neckCollar = new THREE.Mesh(
          trackGeo(extrudeAlongX(neckCollarShape, -1.70, -1.38, 0.055, 4, 24)),
          matGraphiteLight
        );
        neckCollar.name = 'supportBaseFillet';
        uprightSupport.add(neckCollar);

        // Crisp `SHINING 3D` wordmark along the ~15° upward-raked cantilevered boom (matching ref photo)
        const brandTex = trackTex(createWordmarkTexture('SHINING 3D', 'rgba(232, 236, 242, 0.88)', 700, 6));
        const brandMat = trackMat(new THREE.MeshBasicMaterial({
          map: brandTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const boomSlope = Math.atan2(1.23, 4.60);
        const brandGeo = trackGeo(new THREE.PlaneGeometry(1.48, 0.28));

        // Inner (+X) boom face visible in 3/4 & Side views (exact position in reference photo)
        const innerBrand = new THREE.Mesh(brandGeo, brandMat);
        innerBrand.name = 'shining3DBrandInner';
        innerBrand.position.set(-1.637, 3.86, 0.42);
        innerBrand.rotation.order = 'YXZ';
        innerBrand.rotation.y = Math.PI * 0.5;
        innerBrand.rotation.z = boomSlope;
        innerBrand.castShadow = false;
        innerBrand.receiveShadow = false;
        uprightSupport.add(innerBrand);

        // Outer (-X) glossy boom face
        const outerBrand = new THREE.Mesh(brandGeo, brandMat);
        outerBrand.name = 'shining3DBrandOuter';
        outerBrand.position.set(-2.683, 3.92, 0.42);
        outerBrand.rotation.order = 'YXZ';
        outerBrand.rotation.y = -Math.PI * 0.5;
        outerBrand.rotation.z = -boomSlope;
        outerBrand.castShadow = false;
        outerBrand.receiveShadow = false;
        uprightSupport.add(outerBrand);

        productRoot.add(uprightSupport);

        /* ====================================================================
           3. SCANNER HEAD (Cantilevered Overhang + Recessed Flush Twin Optics)
           ==================================================================== */
        const scannerHead = new THREE.Group();
        scannerHead.name = 'scannerHead';
        const headRestPos = new THREE.Vector3(-0.28, 4.74, -2.66);
        scannerHead.position.copy(headRestPos);
        scannerHead.rotation.x = 0.095; // ~5.4° optical pitch toward turntable

        const headW = 4.12;
        const headD = 2.56;

        // Lower main body + crisp bevelled lower chin
        const lowerHeadBody = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: -0.52, w: headW - 0.36, d: headD - 0.36, r: 0.34 },
            { y: -0.36, w: headW - 0.04, d: headD - 0.04, r: 0.44, crease: true },
            { y:  0.22, w: headW,        d: headD,        r: 0.46 }
          ], 16, true, true)),
          matGraphite
        );
        lowerHeadBody.name = 'mainHousingLower';
        scannerHead.add(lowerHeadBody);

        // Crisp dark horizontal parting seam groove
        const housingSeam = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.22,  w: headW - 0.03, d: headD - 0.03, r: 0.45 },
            { y: 0.252, w: headW - 0.03, d: headD - 0.03, r: 0.45 }
          ], 16, false, false)),
          matVentDark
        );
        housingSeam.name = 'housingSeam';
        scannerHead.add(housingSeam);

        // Sleek overhanging upper cap lid
        const upperHeadCap = new THREE.Mesh(
          trackGeo(createLoftedRoundedRect([
            { y: 0.252, w: headW + 0.03, d: headD + 0.03, r: 0.46 },
            { y: 0.42,  w: headW + 0.01, d: headD + 0.01, r: 0.45, crease: true },
            { y: 0.50,  w: headW - 0.22, d: headD - 0.22, r: 0.38 }
          ], 16, true, true)),
          matGraphiteLight
        );
        upperHeadCap.name = 'mainHousing';
        scannerHead.add(upperHeadCap);

        // Top 3-bay longitudinal ribbed heat-sink / ventilation recess
        const grilleBed = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(3.40, 0.020, 0.96, 3, 0.03)),
          matVentDark
        );
        grilleBed.name = 'topGrilleBed';
        grilleBed.position.set(0, 0.512, -0.44);
        scannerHead.add(grilleBed);

        const ribCount = 12;
        const ribGeo = trackGeo(new THREE.BoxGeometry(3.34, 0.024, 0.038));
        const topVentRibs = new THREE.InstancedMesh(ribGeo, matGraphite, ribCount);
        topVentRibs.name = 'topVentRibs';
        for (let i = 0; i < ribCount; i++) {
          const rz = -0.86 + i * (0.84 / (ribCount - 1));
          dummy.position.set(0, 0.526, rz);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          topVentRibs.setMatrixAt(i, dummy.matrix);
        }
        topVentRibs.instanceMatrix.needsUpdate = true;
        scannerHead.add(topVentRibs);

        const divGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.028, 0.92));
        for (const dx of [-0.96, 0.96]) {
          const div = new THREE.Mesh(divGeo, matGraphiteLight);
          div.position.set(dx, 0.527, -0.44);
          scannerHead.add(div);
        }

        // Subtle `DS-EX Pro` model mark on top-front right corner of upper cap
        const modelTex = trackTex(createWordmarkTexture('DS-EX Pro', 'rgba(218, 223, 232, 0.72)', 600, 4));
        const modelMat = trackMat(new THREE.MeshBasicMaterial({
          map: modelTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        }));
        const modelBadge = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(0.92, 0.17)),
          modelMat
        );
        modelBadge.name = 'modelBadgeTop';
        modelBadge.rotation.x = -Math.PI * 0.5;
        modelBadge.position.set(1.22, 0.503, 0.78);
        modelBadge.castShadow = false;
        modelBadge.receiveShadow = false;
        scannerHead.add(modelBadge);

        // Recessed Optical Bay tucked cleanly inside lower body below upper cap parting seam
        const bayCenterX = -0.10;
        const bayY = -0.07;
        const frontWallZ = headD * 0.5;

        const opticalBayFrame = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(2.24, 0.55, 0.08, 3, 0.02)),
          matVentDark
        );
        opticalBayFrame.name = 'frontOpticalPanel';
        opticalBayFrame.position.set(bayCenterX, bayY, frontWallZ - 0.035);
        scannerHead.add(opticalBayFrame);

        const lensMountGeo = trackGeo(new RoundedBoxGeometry(0.62, 0.50, 0.04, 3, 0.015));
        const lensBezelGeo = trackGeo(new THREE.CylinderGeometry(0.175, 0.195, 0.045, 36));
        const lensGlassGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 36));
        const lensPupilGeo = trackGeo(new THREE.CylinderGeometry(0.068, 0.068, 0.054, 28));

        function createOpticalLensUnit(name, lx, yawInward) {
          const unit = new THREE.Group();
          unit.name = name;
          unit.position.set(bayCenterX + lx, bayY, frontWallZ - 0.035);
          unit.rotation.y = yawInward;

          const mountPlate = new THREE.Mesh(lensMountGeo, matGraphiteLight);
          unit.add(mountPlate);

          const bezel = new THREE.Mesh(lensBezelGeo, matLowerTrim);
          bezel.rotation.x = Math.PI * 0.5;
          bezel.position.z = 0.010;
          unit.add(bezel);

          const glass = new THREE.Mesh(lensGlassGeo, matOpticalGlass);
          glass.rotation.x = Math.PI * 0.5;
          glass.position.z = 0.012;
          unit.add(glass);

          const pupil = new THREE.Mesh(lensPupilGeo, matVentDark);
          pupil.rotation.x = Math.PI * 0.5;
          pupil.position.z = 0.014;
          unit.add(pupil);

          return unit;
        }

        scannerHead.add(createOpticalLensUnit('leftOpticalLens',  -0.74,  0.16));
        scannerHead.add(createOpticalLensUnit('rightOpticalLens',  0.74, -0.16));

        // Deep trapezoidal central structured-light projector recess
        const centralRecess = new THREE.Group();
        centralRecess.name = 'centralRecess';
        centralRecess.position.set(bayCenterX, bayY, frontWallZ - 0.05);

        const recessCavity = new THREE.Mesh(
          trackGeo(new RoundedBoxGeometry(0.78, 0.50, 0.14, 3, 0.02)),
          matVentDark
        );
        centralRecess.add(recessCavity);

        const cheekGeo = trackGeo(new THREE.BoxGeometry(0.045, 0.49, 0.09));
        for (const sgn of [-1, 1]) {
          const cheek = new THREE.Mesh(cheekGeo, matGraphite);
          cheek.position.set(sgn * 0.40, 0, 0.02);
          cheek.rotation.y = -sgn * 0.30;
          centralRecess.add(cheek);
        }

        const projLens = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 28)),
          matOpticalGlass
        );
        projLens.rotation.x = Math.PI * 0.5 + 0.12;
        projLens.position.set(0, 0.09, 0.03);
        centralRecess.add(projLens);

        scannerHead.add(centralRecess);
        productRoot.add(scannerHead);

        /* ====================================================================
           4. TURNTABLE ASSEMBLY (Leaned Pill L-Bracket + Dark Barrel + Plate)
           ==================================================================== */
        const turntableAssembly = new THREE.Group();
        turntableAssembly.name = 'turntableAssembly';

        const ttZ = 2.34;
        const armZ = 2.16;
        const ttCenterX = -0.96;

        const bracketGroup = new THREE.Group();
        bracketGroup.name = 'supportBracketGroup';
        const bracketRestPos = new THREE.Vector3(0, 0, 0);

        // Tilted pill-shaped vertical upright nestled inside C-spine pocket with smooth lower L-fillet
        const tilt = Math.atan2(0.32, 1.56);
        const pw = 0.51;
        const cTopZ = ttZ + 0.32;
        const cTopY = 2.68;
        const pivotShape = new THREE.Shape();
        pivotShape.moveTo(ttZ - pw - 0.16, 0.98);
        pivotShape.lineTo(ttZ + pw, 0.98);
        pivotShape.lineTo(cTopZ + Math.cos(tilt) * pw, cTopY - Math.sin(tilt) * pw);
        pivotShape.absarc(cTopZ, cTopY, pw, -tilt, Math.PI - tilt, false);
        pivotShape.lineTo(ttZ - pw + 0.10, 1.92);
        pivotShape.quadraticCurveTo(ttZ - pw + 0.06, 1.68, ttZ - pw - 0.16, 1.66);
        pivotShape.lineTo(ttZ - pw - 0.16, 0.98);
        pivotShape.closePath();

        const pivot = new THREE.Mesh(
          trackGeo(extrudeAlongX(pivotShape, -2.02, -1.56, 0.045, 4, 30)),
          matGraphiteLight
        );
        pivot.name = 'pivot';
        bracketGroup.add(pivot);

        function sampleStadiumArm(y, inset = 0) {
          const r = 0.62 - inset;
          const xLeft = -2.00 + inset;
          const pts = [{ x: xLeft, z: armZ + r }];
          for (let i = 0; i <= 26; i++) {
            const a = Math.PI * 0.5 - (i / 26) * Math.PI;
            pts.push({ x: ttCenterX + Math.cos(a) * r, z: armZ + Math.sin(a) * r });
          }
          pts.push({ x: xLeft, z: armZ - r });
          return { y, pts };
        }

        function buildStadiumArmGeo(ringDefs) {
          const ringLen = ringDefs[0].pts.length;
          const pos = [];
          const idx = [];
          for (let s = 0; s < ringDefs.length; s++) {
            for (let i = 0; i < ringLen; i++) {
              pos.push(ringDefs[s].pts[i].x, ringDefs[s].y, ringDefs[s].pts[i].z);
            }
          }
          for (let s = 0; s < ringDefs.length - 1; s++) {
            const rA = s * ringLen;
            const rB = (s + 1) * ringLen;
            for (let i = 0; i < ringLen; i++) {
              const iN = (i + 1) % ringLen;
              idx.push(rA + i, rA + iN, rB + iN);
              idx.push(rA + i, rB + iN, rB + i);
            }
          }
          const sideG = new THREE.BufferGeometry();
          sideG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          sideG.setIndex(idx);
          sideG.computeVertexNormals();

          const fPos = Array.from(sideG.attributes.position.array);
          const fNrm = Array.from(sideG.attributes.normal.array);
          const fIdx = Array.from(sideG.index.array);
          sideG.dispose();

          const topR = ringDefs[ringDefs.length - 1];
          const baseV = fPos.length / 3;
          fPos.push((ttCenterX - 1.98) * 0.5, topR.y, armZ);
          fNrm.push(0, 1, 0);
          for (let i = 0; i < ringLen; i++) {
            fPos.push(topR.pts[i].x, topR.y, topR.pts[i].z);
            fNrm.push(0, 1, 0);
          }
          for (let i = 0; i < ringLen; i++) {
            const iN = (i + 1) % ringLen;
            fIdx.push(baseV, baseV + 1 + i, baseV + 1 + iN);
          }

          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(fPos, 3));
          g.setAttribute('normal', new THREE.Float32BufferAttribute(fNrm, 3));
          g.setIndex(fIdx);
          return g;
        }

        const supportHousing = new THREE.Mesh(
          trackGeo(buildStadiumArmGeo([
            sampleStadiumArm(0.98, 0.03),
            sampleStadiumArm(1.03, 0.00),
            sampleStadiumArm(1.62, 0.00),
            sampleStadiumArm(1.68, 0.04)
          ])),
          matGraphite
        );
        supportHousing.name = 'supportHousing';
        bracketGroup.add(supportHousing);

        // Metallic spindle gap ring above supportHousing nose
        const spindleRing = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.46, 0.48, 0.07, 40)),
          matMetalRing
        );
        spindleRing.name = 'spindleRing';
        spindleRing.position.set(ttCenterX, 1.715, armZ);
        bracketGroup.add(spindleRing);

        // Substantial matte-dark cylindrical motor barrel
        const turntableBarrel = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.63, 0.60, 0.42, 48)),
          matBarrelDark
        );
        turntableBarrel.name = 'turntableBarrel';
        turntableBarrel.position.set(ttCenterX, 1.96, armZ);
        bracketGroup.add(turntableBarrel);

        turntableAssembly.add(bracketGroup);

        // Empty horizontal notched circular turntable plate (per brief §3.4 — no dental cast/jig)
        const plateGroup = new THREE.Group();
        plateGroup.name = 'circularPlate';
        const plateRestPos = new THREE.Vector3(ttCenterX, 2.20, armZ);
        plateGroup.position.copy(plateRestPos);

        const plateR = 0.82;
        const notchCount = 6;
        const notchR = 0.070;
        const plateShape = new THREE.Shape();
        const segPerArc = 16;
        for (let n = 0; n < notchCount; n++) {
          const aCenter = (n / notchCount) * Math.PI * 2;
          const aNextCenter = ((n + 1) / notchCount) * Math.PI * 2;
          const dAngle = Math.asin(notchR / plateR);
          const nx2 = Math.cos(aCenter) * plateR;
          const ny2 = Math.sin(aCenter) * plateR;
          for (let j = 0; j <= 10; j++) {
            const phi = (aCenter + Math.PI * 0.5) + (j / 10) * Math.PI;
            const px = nx2 + Math.cos(phi) * notchR;
            const py = ny2 + Math.sin(phi) * notchR;
            if (n === 0 && j === 0) plateShape.moveTo(px, py);
            else plateShape.lineTo(px, py);
          }
          const arcStart = aCenter + dAngle;
          const arcEnd = aNextCenter - dAngle;
          for (let i = 1; i <= segPerArc; i++) {
            const a = arcStart + (arcEnd - arcStart) * (i / segPerArc);
            plateShape.lineTo(Math.cos(a) * plateR, Math.sin(a) * plateR);
          }
        }
        plateShape.closePath();

        const plateGeo = trackGeo(new THREE.ExtrudeGeometry(plateShape, {
          depth: 0.10,
          bevelEnabled: true,
          bevelThickness: 0.020,
          bevelSize: 0.020,
          bevelSegments: 3,
          curveSegments: 16,
          steps: 1
        }));
        plateGeo.rotateX(-Math.PI * 0.5);
        plateGeo.computeVertexNormals();

        const plateDisc = new THREE.Mesh(plateGeo, matTurntable);
        plateDisc.name = 'plateDisc';
        plateGroup.add(plateDisc);

        const lowerPlateRing = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.79, 0.76, 0.06, 48)),
          matGlossyBlack
        );
        lowerPlateRing.position.y = -0.045;
        plateGroup.add(lowerPlateRing);

        const pinGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.085, 14));
        const rimPins = new THREE.InstancedMesh(pinGeo, matMetalRing, notchCount);
        rimPins.name = 'rimFastenerPins';
        for (let n = 0; n < notchCount; n++) {
          const a = (n / notchCount) * Math.PI * 2;
          dummy.position.set(Math.cos(a) * (plateR - 0.02), 0.05, -Math.sin(a) * (plateR - 0.02));
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          rimPins.setMatrixAt(n, dummy.matrix);
        }
        rimPins.instanceMatrix.needsUpdate = true;
        plateGroup.add(rimPins);

        const mountingDetails = new THREE.Group();
        mountingDetails.name = 'mountingDetails';
        const bossGeo = trackGeo(new THREE.RingGeometry(0.038, 0.066, 24));
        const holeGeo = trackGeo(new THREE.CircleGeometry(0.023, 20));
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
          const rx = Math.cos(a) * 0.15;
          const rz = Math.sin(a) * 0.15;

          const outerBoss = new THREE.Mesh(bossGeo, matVentDark);
          outerBoss.rotation.x = -Math.PI * 0.5;
          outerBoss.position.set(rx, 0.125, rz);
          mountingDetails.add(outerBoss);

          const centerHole = new THREE.Mesh(holeGeo, matVentDark);
          centerHole.rotation.x = -Math.PI * 0.5;
          centerHole.position.set(rx, 0.126, rz);
          mountingDetails.add(centerHole);
        }
        plateGroup.add(mountingDetails);

        turntableAssembly.add(plateGroup);
        productRoot.add(turntableAssembly);

        // Enable crisp studio shadows on all solid meshes (skipping flat surface decals)
        productRoot.traverse((child) => {
          if (child.isMesh && !child.name.includes('Brand') && !child.name.includes('Badge')) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Controlled engineering exploded-view vectors
        const headExplodeOffset = new THREE.Vector3(0.32, 0.95, 0.0);
        const bracketExplodeOffset = new THREE.Vector3(0.32, 0.24, 0.0);
        const plateExplodeOffset = new THREE.Vector3(0.32, 0.95, 0.0);

        function setExplodeFactor(t) {
          const clamped = Math.max(0, Math.min(1, t));
          scannerHead.position.copy(headRestPos).addScaledVector(headExplodeOffset, clamped);
          bracketGroup.position.copy(bracketRestPos).addScaledVector(bracketExplodeOffset, clamped);
          plateGroup.position.copy(plateRestPos).addScaledVector(plateExplodeOffset, clamped);
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
            uprightSupport,
            scannerHead,
            turntableAssembly
          },
          setExplodeFactor,
          dispose
        };
      }

      window.DentalAssetLibrary.assets['dsex-pro'] = {
        id: 'dsex-pro',
        code: 'SCANNER-01',
        name: 'SHINING 3D AutoScan DS-EX Pro',
        category: 'Desktop 3D Dental Lab Scanner (Table 2 · Paired with Right-Side PC-01)',
        capabilityNote: 'Structured-light desktop scanner on Table 2, paired directly with the Desktop PC on its right (PC-01) for scan alignment and mesh post-processing.',
        tableId: 'table-scanners',
        realDimensionsMm: '260 × 270 × 420 mm',
        benchScale: 0.84,
        benchPosition: [0.80, 0.0, -0.32],
        subAssemblies: ['baseAssembly', 'uprightSupport', 'scannerHead', 'turntableAssembly'],
        createAsset: createDSExProProduct
      };
    };
  
// ── END original source ──────────────────────────────────────────────────────

const __legacyLib = window.DentalAssetLibrary;
const __assetIdsBefore = new Set(Object.keys(__legacyLib.assets));
const __libKeysBefore = new Set(Object.keys(__legacyLib));
window.__registerAssetDSExPro();

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
