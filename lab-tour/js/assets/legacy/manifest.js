// GENERATED FILE — do not edit. Re-create with: npm run import-assets -- <library.html>
//
// Facts about the imported asset library, measured by building every asset once
// (three.js r160). "datasheetMm" is what the library declares; "measured.mm" is
// what the geometry actually spans at scale 1 (1 unit = 80 mm): w = x, d = z, h = y.

export const LEGACY_SOURCE = {
  "file": "Dental_Lab_Equipment_Asset_Library (2).html",
  "sha256": "98dd36af64f4131c8203ff1a912ad67b436929835c5438391e80d9cd4761a3d1",
  "threeRevision": "160"
};

export const LEGACY_ASSETS = [
  {
    "id": "dsex-pro",
    "module": "./dsex-pro.js",
    "component": "component-1-asset-dsex-pro",
    "meta": {
      "id": "dsex-pro",
      "code": "SCANNER-01",
      "name": "SHINING 3D AutoScan DS-EX Pro",
      "category": "Desktop 3D Dental Lab Scanner (Table 2 · Paired with Right-Side PC-01)",
      "capabilityNote": "Structured-light desktop scanner on Table 2, paired directly with the Desktop PC on its right (PC-01) for scan alignment and mesh post-processing.",
      "tableId": "table-scanners",
      "realDimensionsMm": "260 × 270 × 420 mm",
      "benchScale": 0.84,
      "benchPosition": [
        0.8,
        0,
        -0.32
      ],
      "subAssemblies": [
        "baseAssembly",
        "uprightSupport",
        "scannerHead",
        "turntableAssembly"
      ]
    },
    "datasheetMm": [
      260,
      270,
      420
    ],
    "instanceKeys": [
      "productRoot",
      "assemblies",
      "setExplodeFactor",
      "dispose"
    ],
    "partsKey": "assemblies",
    "parts": [
      "baseAssembly",
      "uprightSupport",
      "scannerHead",
      "turntableAssembly"
    ],
    "declaredPartsMatch": true,
    "measured": {
      "box": {
        "min": [
          -2.935,
          0,
          -3.948
        ],
        "max": [
          2.935,
          5.364,
          3.892
        ]
      },
      "mm": {
        "w": 470,
        "d": 627,
        "h": 429
      },
      "meshes": 49,
      "drawCalls": 49,
      "triangles": 22701,
      "vertices": 59873,
      "materials": 11,
      "geometries": 37,
      "shadowCasters": 46,
      "textures": [
        [
          1024,
          192
        ],
        [
          1024,
          192
        ]
      ],
      "textureMB": 2
    }
  },
  {
    "id": "zubler-vario-200",
    "module": "./zubler-vario-200.js",
    "component": "component-2-asset-zubler-vario-200",
    "meta": {
      "id": "zubler-vario-200",
      "code": "FURNACE-01",
      "name": "Zubler Vario 200",
      "category": "Dental Pressing & Ceramic Furnace (Table 1 · Furnace Bench)",
      "capabilityNote": "Dedicated pressing & ceramic firing station on Table 1 (Thermal Furnace Bench), isolated from digital optical scanning hardware.",
      "tableId": "table-furnaces",
      "realDimensionsMm": "295 × 430 × 590 mm",
      "benchScale": 1,
      "benchPosition": [
        -26,
        0,
        -0.22
      ],
      "subAssemblies": [
        "baseChassis",
        "verticalColumn",
        "firingHood",
        "controlConsole",
        "firingPedestal",
        "rearManifoldIO"
      ]
    },
    "datasheetMm": [
      295,
      430,
      590
    ],
    "instanceKeys": [
      "productRoot",
      "assemblies",
      "setExplodeFactor",
      "dispose"
    ],
    "partsKey": "assemblies",
    "parts": [
      "baseAssembly",
      "liftColumn",
      "firingPedestal",
      "chamberHead",
      "controlConsole"
    ],
    "declaredPartsMatch": false,
    "measured": {
      "box": {
        "min": [
          -2.09,
          0,
          -2.598
        ],
        "max": [
          2.36,
          7.349,
          3.243
        ]
      },
      "mm": {
        "w": 356,
        "d": 467,
        "h": 588
      },
      "meshes": 89,
      "drawCalls": 89,
      "triangles": 16312,
      "vertices": 35033,
      "materials": 15,
      "geometries": 73,
      "shadowCasters": 86,
      "textures": [
        [
          256,
          128
        ],
        [
          1024,
          640
        ],
        [
          512,
          160
        ]
      ],
      "textureMB": 3.9
    }
  },
  {
    "id": "upcera-a7-plus",
    "module": "./upcera-a7-plus.js",
    "component": "component-3-asset-upcera-a7-plus",
    "meta": {
      "id": "upcera-a7-plus",
      "code": "FURNACE-02",
      "name": "UPCERA A7+",
      "category": "Programmable Porcelain Vacuum Furnace (Table 1 · Furnace Bench)",
      "capabilityNote": "Center station on Table 1 (Thermal Furnace Bench) for programmable vacuum porcelain sintering and glazing cycles.",
      "tableId": "table-furnaces",
      "realDimensionsMm": "380 × 420 × 600 mm",
      "benchScale": 1,
      "benchPosition": [
        -18.9,
        0,
        0
      ],
      "subAssemblies": [
        "lowerBaseChassis",
        "rearLiftColumn",
        "upperMuffleHead",
        "frontTouchConsole",
        "firingStageTray",
        "coolingSideTray",
        "rearConnectionsIO"
      ]
    },
    "datasheetMm": [
      380,
      420,
      600
    ],
    "instanceKeys": [
      "productRoot",
      "assemblies",
      "setExplodeFactor",
      "dispose"
    ],
    "partsKey": "assemblies",
    "parts": [
      "baseAssembly",
      "liftColumn",
      "firingPedestal",
      "chamberHead",
      "controlConsole"
    ],
    "declaredPartsMatch": false,
    "measured": {
      "box": {
        "min": [
          -2.487,
          0,
          -2.377
        ],
        "max": [
          2.487,
          7.5,
          2.915
        ]
      },
      "mm": {
        "w": 398,
        "d": 423,
        "h": 600
      },
      "meshes": 77,
      "drawCalls": 77,
      "triangles": 18654,
      "vertices": 46212,
      "materials": 15,
      "geometries": 50,
      "shadowCasters": 74,
      "textures": [
        [
          512,
          512
        ],
        [
          1360,
          688
        ],
        [
          1024,
          640
        ],
        [
          1360,
          688
        ]
      ],
      "textureMB": 14.2
    }
  },
  {
    "id": "ivoclar-programat-p300",
    "module": "./programat-p300.js",
    "component": "component-4-asset-programat-p300",
    "meta": {
      "id": "ivoclar-programat-p300",
      "code": "FURNACE-03",
      "name": "Ivoclar Programat P300",
      "category": "Clamshell Porcelain Furnace (Table 1 · Furnace Bench)",
      "capabilityNote": "Right-hand station on Table 1 (Thermal Furnace Bench) featuring QTK2 muffle technology and OSD optical status display.",
      "tableId": "table-furnaces",
      "realDimensionsMm": "395 × 465 × 320 mm",
      "benchScale": 1,
      "benchPosition": [
        -11.8,
        0,
        0.92
      ],
      "subAssemblies": [
        "lowerChassis",
        "frontControlPanel",
        "rearHingeHousing",
        "tiltingClamshellHead",
        "firingChamberTable",
        "coolingTrayWings",
        "rearPanelIO"
      ]
    },
    "datasheetMm": [
      395,
      465,
      320
    ],
    "instanceKeys": [
      "productRoot",
      "assemblies",
      "setExplodeFactor",
      "dispose"
    ],
    "partsKey": "assemblies",
    "parts": [
      "baseAssembly",
      "coolingTray",
      "firingPedestal",
      "clamshellHead",
      "controlConsole"
    ],
    "declaredPartsMatch": false,
    "measured": {
      "box": {
        "min": [
          -2.478,
          0,
          -2.76
        ],
        "max": [
          2.476,
          4.032,
          2.018
        ]
      },
      "mm": {
        "w": 396,
        "d": 382,
        "h": 323
      },
      "meshes": 77,
      "drawCalls": 77,
      "triangles": 14548,
      "vertices": 24701,
      "materials": 16,
      "geometries": 45,
      "shadowCasters": 72,
      "textures": [
        [
          256,
          512
        ],
        [
          512,
          256
        ],
        [
          1024,
          840
        ],
        [
          880,
          460
        ],
        [
          1024,
          840
        ]
      ],
      "textureMB": 12.1
    }
  },
  {
    "id": "3shape-e4",
    "module": "./3shape-e4.js",
    "component": "component-5-asset-3shape-e4",
    "meta": {
      "id": "3shape-e4",
      "code": "SCANNER-02",
      "name": "3Shape E4",
      "category": "Ultra-Speed 4×5MP Scanner (Table 2 · Paired with 3Shape CAD PC-02)",
      "capabilityNote": "Paired directly with the dedicated 3Shape Workstation PC on its right (PC-02), which performs both scan post-processing and same-brand 3Shape CAD design.",
      "tableId": "table-scanners",
      "realDimensionsMm": "378 × 337 × 335 mm",
      "benchScale": 1,
      "benchPosition": [
        17.3,
        0,
        0.05
      ],
      "subAssemblies": [
        "baseAssembly",
        "cFrameColumn",
        "opticalHead",
        "rotaryTiltStage",
        "dentalCastFixture",
        "rearServiceCover"
      ]
    },
    "datasheetMm": [
      378,
      337,
      335
    ],
    "instanceKeys": [
      "productRoot",
      "subAssemblies",
      "setExplodeFactor",
      "setScanSpinAngle",
      "dispose"
    ],
    "partsKey": "subAssemblies",
    "parts": [
      "baseAssembly",
      "cFrameColumn",
      "opticalHead",
      "rotaryTiltStage",
      "dentalCastFixture",
      "rearServiceCover"
    ],
    "declaredPartsMatch": true,
    "measured": {
      "box": {
        "min": [
          -2.34,
          0,
          -2.118
        ],
        "max": [
          2.34,
          4.2,
          2.09
        ]
      },
      "mm": {
        "w": 374,
        "d": 337,
        "h": 336
      },
      "meshes": 114,
      "drawCalls": 114,
      "triangles": 48862,
      "vertices": 38292,
      "materials": 24,
      "geometries": 79,
      "shadowCasters": 114,
      "textures": [
        [
          256,
          128
        ],
        [
          1024,
          256
        ],
        [
          1024,
          512
        ]
      ],
      "textureMB": 4.2
    }
  },
  {
    "id": "pc-dsex",
    "module": "./workstation-pc.js",
    "component": "component-6-asset-workstation-pc",
    "meta": {
      "id": "pc-dsex",
      "code": "PC-01",
      "name": "DS-EX Post-Processing PC",
      "category": "Dedicated Scanner Post-Processing Desktop Workstation (Right of DS-EX Pro)",
      "capabilityNote": "Dedicated desktop PC positioned beside the SHINING 3D DS-EX Pro for 3D scan alignment, mesh post-processing, and STL/PLY export.",
      "tableId": "table-scanners",
      "realDimensionsMm": "590 × 305 × 422 mm",
      "benchScale": 1,
      "benchPosition": [
        8.45,
        0,
        -0.05
      ],
      "subAssemblies": [
        "workstationTower",
        "displayMonitor",
        "peripheralsKit"
      ]
    },
    "datasheetMm": [
      590,
      305,
      422
    ],
    "instanceKeys": [
      "productRoot",
      "subAssemblies",
      "setExplodeFactor",
      "dispose"
    ],
    "partsKey": "subAssemblies",
    "parts": [
      "workstationTower",
      "displayMonitor",
      "peripheralsKit"
    ],
    "declaredPartsMatch": true,
    "measured": {
      "box": {
        "min": [
          -3.77,
          0,
          -1.964
        ],
        "max": [
          3.69,
          5.121,
          2.32
        ]
      },
      "mm": {
        "w": 597,
        "d": 343,
        "h": 410
      },
      "meshes": 67,
      "drawCalls": 67,
      "triangles": 8438,
      "vertices": 18284,
      "materials": 13,
      "geometries": 33,
      "shadowCasters": 67,
      "textures": [
        [
          512,
          192
        ],
        [
          512,
          64
        ]
      ],
      "textureMB": 0.7
    }
  },
  {
    "id": "pc-3shape",
    "module": "./workstation-pc.js",
    "component": "component-6-asset-workstation-pc",
    "meta": {
      "id": "pc-3shape",
      "code": "PC-02",
      "name": "3Shape Design & Post-Processing PC",
      "category": "3Shape E4 Post-Processing + Same-Brand 3Shape CAD Design Workstation",
      "capabilityNote": "Dedicated desktop PC beside the 3Shape E4 — handles scan post-processing AND is certified capable of full same-brand 3Shape CAD restoration design.",
      "tableId": "table-scanners",
      "realDimensionsMm": "590 × 305 × 422 mm",
      "benchScale": 1,
      "benchPosition": [
        24.95,
        0,
        -0.05
      ],
      "subAssemblies": [
        "workstationTower",
        "displayMonitor",
        "peripheralsKit"
      ]
    },
    "datasheetMm": [
      590,
      305,
      422
    ],
    "instanceKeys": [
      "productRoot",
      "subAssemblies",
      "setExplodeFactor",
      "dispose"
    ],
    "partsKey": "subAssemblies",
    "parts": [
      "workstationTower",
      "displayMonitor",
      "peripheralsKit"
    ],
    "declaredPartsMatch": true,
    "measured": {
      "box": {
        "min": [
          -3.77,
          0,
          -1.964
        ],
        "max": [
          3.69,
          5.121,
          2.32
        ]
      },
      "mm": {
        "w": 597,
        "d": 343,
        "h": 410
      },
      "meshes": 67,
      "drawCalls": 67,
      "triangles": 8438,
      "vertices": 18284,
      "materials": 13,
      "geometries": 33,
      "shadowCasters": 67,
      "textures": [
        [
          512,
          192
        ],
        [
          512,
          64
        ]
      ],
      "textureMB": 0.7
    }
  }
];

export const LEGACY_WORKBENCH = {
  "module": "./lab-workbench.js",
  "component": "component-7-lab-workbench",
  "floorY": -8.2,
  "box": {
    "min": [
      -30.32,
      -8.2,
      -4.9
    ],
    "max": [
      30.32,
      0.98,
      4.95
    ]
  },
  "meshes": 90,
  "drawCalls": 90,
  "triangles": 20470,
  "vertices": 54874,
  "materials": 14,
  "geometries": 35,
  "shadowCasters": 42,
  "textures": [
    [
      1024,
      512
    ],
    [
      1024,
      128
    ],
    [
      640,
      176
    ],
    [
      640,
      176
    ],
    [
      640,
      176
    ],
    [
      1024,
      128
    ],
    [
      640,
      176
    ],
    [
      640,
      176
    ],
    [
      640,
      176
    ],
    [
      640,
      176
    ]
  ],
  "textureMB": 8,
  "tables": {
    "furnaceTableGroup": {
      "box": {
        "min": [
          -30.32,
          -8.2,
          -4.9
        ],
        "max": [
          -7.48,
          0.22,
          4.95
        ]
      },
      "benchtopTopY": 0,
      "meshes": 39,
      "drawCalls": 39,
      "triangles": 8540,
      "vertices": 24148,
      "materials": 8,
      "geometries": 16,
      "shadowCasters": 18,
      "textures": [
        [
          1024,
          512
        ],
        [
          1024,
          128
        ],
        [
          640,
          176
        ],
        [
          640,
          176
        ],
        [
          640,
          176
        ]
      ],
      "textureMB": 5.1
    },
    "scannerTableGroup": {
      "box": {
        "min": [
          -3.32,
          -8.2,
          -4.9
        ],
        "max": [
          30.32,
          0.98,
          4.95
        ]
      },
      "benchtopTopY": 0,
      "meshes": 51,
      "drawCalls": 51,
      "triangles": 11930,
      "vertices": 30726,
      "materials": 10,
      "geometries": 19,
      "shadowCasters": 24,
      "textures": [
        [
          1024,
          512
        ],
        [
          1024,
          128
        ],
        [
          640,
          176
        ],
        [
          640,
          176
        ],
        [
          640,
          176
        ],
        [
          640,
          176
        ]
      ],
      "textureMB": 5.6
    }
  }
};
