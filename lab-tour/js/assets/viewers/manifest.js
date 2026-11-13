// GENERATED FILE — do not edit. Re-create with: npm run import-viewer -- <Viewer.html> --id <asset-id>
//
// Facts about the machines imported from single-machine viewer files, one entry
// per viewer, measured by building each machine once (three.js r160).
// "datasheetMm" is the maker's size as given at import; "measured.mm" is what the
// geometry actually spans at scale 1 (1 unit = 80 mm): w = x, d = z, h = y.
// "source" names the file a machine came from, with its checksums.

export const VIEWER_ASSETS = [
  {
    "id": "medit-t500",
    "module": "./medit-t500.js",
    "component": "component-2-product-model",
    "meta": {
      "id": "medit-t500",
      "name": "Medit Identica T500",
      "realDimensionsMm": "290 × 290 × 340 mm"
    },
    "datasheetMm": [
      290,
      290,
      340
    ],
    "instanceKeys": [
      "productRoot",
      "setExplodeFactor",
      "setScanPoseFactor",
      "setLiveScanCycle",
      "dispose"
    ],
    "partsKey": null,
    "parts": [
      "baseAssembly",
      "lWallChassis",
      "upperCanopyAssembly",
      "swingArmAssembly"
    ],
    "measured": {
      "box": {
        "min": [
          -1.83,
          0,
          -1.886
        ],
        "max": [
          1.813,
          4.258,
          1.834
        ]
      },
      "mm": {
        "w": 291,
        "d": 298,
        "h": 341
      },
      "meshes": 150,
      "drawCalls": 150,
      "triangles": 13307,
      "vertices": 21353,
      "materials": 22,
      "geometries": 106,
      "shadowCasters": 150,
      "textures": [
        [
          512,
          220
        ],
        [
          512,
          256
        ],
        [
          512,
          160
        ],
        [
          256,
          384
        ],
        [
          1024,
          1024
        ]
      ],
      "textureMB": 7.5,
      "lights": 1
    },
    "source": {
      "file": "Medit_T500_Scanner_Viewer.html",
      "bytes": 761681,
      "md5": "afbd1bce3b5f6c229a09cda4b58469e6",
      "sha256": "fe55590a9772622d5f855035a4060088f546850430f979e66c7e2f7235c56aa5",
      "componentSha256": "1c47453446e9c64b4a509180c86a1cf0f69ab20e86f09edd585092348fab94eb"
    }
  }
];
