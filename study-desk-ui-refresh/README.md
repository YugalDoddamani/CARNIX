# Study Desk — interactive 3D edition

A static multipage study library: five study guides, five chapters, a 174-question revision bank, lab-practice guides on diagnostic wax-up types, colour-coded dental waxes and biomedical waste management, and the interactive dental lab tour. Original study materials and models were not edited.

## Run or publish

Download and **extract the complete ZIP**, keeping the folders together, then open `index.html`. The learning pages and the bundled tour work as local files in tested Chromium. Alternatively serve this folder with `python3 -m http.server 8000` and visit http://localhost:8000/. Upload the contents of this folder to the root or a subfolder of a GitHub Pages repository; paths are relative. No server API, build step or CDN is required at runtime. Manufacturer references and textbook links need internet access and appropriate permissions.

`styles.css` is the common design system; `guides.css`, `chapters.css` and `lab.css` style categories. `app.js` is the single shared JavaScript, including the embedded tour and its models; the tour runs only in `tour-view.html`. The lab page embeds that document and offers a larger-view link. The self-contained bundle avoids module and local-file CORS problems but adds to the JS download for every page. The tour needs JavaScript, WebGL and a reasonably capable device. WebGL or GPU limitations can prevent it running. Quality is selected by the device; add `?q=low` to the tour-view URL for a lower-quality mode.

The tour is adapted from the CARNIX lab-tour project at commit `8c1ade86c4264f6b151264b543a61323e20e468b` (15 Nov 2026). It includes a six-room guided route, 13 modelled equipment types, planned placeholders and selected machine guides. The floor plan, room descriptions, equipment placements and planned types are drafts—not a verified lab inventory. Model depictions and procedural guides are educational; check the actual device, manufacturer instructions, materials, safety procedures and qualified supervision before operation. The source tour documents known uncertainties and source references, and its machine panels link to supporting references. The UPCERA guide is explicitly basic and has not been verified against a manufacturer manual.

The tour uses three.js r160 under the MIT licence, included in `THREE-LICENSE.txt`; local font licences are in `fonts/`. The original tour's own code and models have no repository-wide licence identified in this audit: obtain confirmation of rights before public redistribution. Before public release, also confirm rights for book-derived content, illustrations and other third-party material. This is a study aid, not an official marking scheme.

## Progress and privacy

Revision answers, ratings and the current set are stored best-effort in browser localStorage under `naylor-short-answer-v1`; they are not sent to a server. Storage can be blocked or cleared, and is origin-specific, so progress does not automatically move between hosts, previews and local files. The tour also remembers whether its welcome guide has been seen, where browser storage permits.

## Attribution

The earlier notebook direction drew on [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky, CC BY 4.0. Font licences are in `fonts/`; the three.js MIT notice is in `THREE-LICENSE.txt`. No attribution footer is displayed on the site.
