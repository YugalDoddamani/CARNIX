// THE EQUIPMENT CATALOGUE — every machine the tour knows about.
//
//   status 'built'    the model exists in the asset library; its name and size
//                     come from the library manifest, nothing to maintain here.
//   status 'planned'  not modelled yet. It appears in the lab as a blue
//                     placeholder volume so the room can be laid out, and in the
//                     equipment list so the backlog is visible.
//       known: true   …but the real machine IS known: `name` and `sizeMm` are
//                     the maker's, and knowledge.js gives its maker and figures
//                     with their sources. Only the 3D model is missing. The tour
//                     says "Model coming" instead of "Planned".
//
// ⚠ PLANNED ENTRIES WITHOUT `known` ARE A DRAFT. They are the machines a lab
// with these six rooms typically runs, with ROUGH envelope sizes for a generic
// unit — not your real equipment list. Replace each with the actual make/model
// and its datasheet size (w × d × h, mm) before it is modelled.
//
// mount: 'bench' sits on a worktop · 'floor' stands on the floor.
// icon:  a name from js/ui/icons.js, shown beside the machine's name.
//
// What the visitor READS about a machine (what it does, who makes it, its key
// figures) is not here but in knowledge.js, under the same id.

export const EQUIPMENT = {
  // ── Built (imported from the asset library) ────────────────────────────────
  'dsex-pro': { status: 'built', icon: 'scanner', shortName: 'DS-EX Pro', kind: 'Lab scanner' },
  '3shape-e4': { status: 'built', icon: 'scanner', shortName: '3Shape E4', kind: 'Lab scanner' },
  'pc-dsex': { status: 'built', icon: 'computer', shortName: 'Scan PC', kind: 'Scan workstation' },
  'pc-3shape': { status: 'built', icon: 'computer', shortName: '3Shape CAD PC', kind: 'CAD workstation' },
  'zubler-vario-200': { status: 'built', icon: 'furnace', shortName: 'Vario 200', kind: 'Ceramic furnace' },
  'upcera-a7-plus': { status: 'built', icon: 'furnace', shortName: 'UPCERA A7+', kind: 'Porcelain furnace' },
  'ivoclar-programat-p300': { status: 'built', icon: 'furnace', shortName: 'Programat P300', kind: 'Ceramic furnace' },
  'uniformation-gk3': { status: 'built', icon: 'printer', shortName: 'GK3', kind: 'Resin 3D printer' },

  // ── Planned · Printing Room ────────────────────────────────────────────────
  'resin-printer': { status: 'planned', icon: 'printer', name: 'Resin 3D printer', kind: '3D printer', mount: 'bench', sizeMm: { w: 400, d: 400, h: 580 } },
  'wash-station': { status: 'planned', icon: 'droplet', name: 'Print wash station', kind: 'Post-processing', mount: 'bench', sizeMm: { w: 270, d: 300, h: 360 } },
  'cure-unit': { status: 'planned', icon: 'light', name: 'UV post-curing unit', kind: 'Post-processing', mount: 'bench', sizeMm: { w: 270, d: 270, h: 350 } },

  // ── Planned · Plaster Room ─────────────────────────────────────────────────
  'model-trimmer': { status: 'planned', icon: 'disc', name: 'Model trimmer', kind: 'Model preparation', mount: 'bench', sizeMm: { w: 330, d: 420, h: 340 } },
  'vacuum-mixer': { status: 'planned', icon: 'beaker', name: 'Vacuum mixer', kind: 'Model preparation', mount: 'bench', sizeMm: { w: 200, d: 260, h: 560 } },
  vibrator: { status: 'planned', icon: 'waves', name: 'Plaster vibrator', kind: 'Model preparation', mount: 'bench', sizeMm: { w: 260, d: 190, h: 120 } },
  'pin-drill': { status: 'planned', icon: 'target', name: 'Pin drilling unit', kind: 'Model preparation', mount: 'bench', sizeMm: { w: 200, d: 250, h: 320 } },
  'plaster-sink': { status: 'planned', icon: 'droplet', name: 'Sink with plaster trap', kind: 'Model preparation', mount: 'floor', sizeMm: { w: 800, d: 600, h: 900 } },

  // ── Planned · Ceramic Room ─────────────────────────────────────────────────
  'steam-cleaner': { status: 'planned', icon: 'droplet', name: 'Steam cleaner', kind: 'Cleaning', mount: 'bench', sizeMm: { w: 260, d: 320, h: 420 } },
  sandblaster: { status: 'planned', icon: 'spray', name: 'Fine blasting unit', kind: 'Surface preparation', mount: 'bench', sizeMm: { w: 400, d: 300, h: 450 } },
  'ultrasonic-cleaner': { status: 'planned', icon: 'waves', name: 'Ultrasonic cleaner', kind: 'Cleaning', mount: 'bench', sizeMm: { w: 270, d: 180, h: 230 } },
  micromotor: { status: 'planned', icon: 'tool', name: 'Micromotor & handpiece', kind: 'Finishing', mount: 'bench', sizeMm: { w: 120, d: 240, h: 90 } },

  // ── Planned · Acrylic & Prosthodontic Room ─────────────────────────────────
  'boil-out-unit': { status: 'planned', icon: 'droplet', name: 'Boil-out / dewaxing unit', kind: 'Denture processing', mount: 'bench', sizeMm: { w: 460, d: 400, h: 420 } },
  'flask-press': { status: 'planned', icon: 'press', name: 'Hydraulic flask press', kind: 'Denture processing', mount: 'bench', sizeMm: { w: 260, d: 260, h: 520 } },
  'pressure-polymeriser': { status: 'planned', icon: 'gauge', name: 'Pressure polymerisation unit', kind: 'Denture processing', mount: 'bench', sizeMm: { w: 330, d: 330, h: 400 } },
  thermoformer: { status: 'planned', icon: 'sheet', name: 'Vacuum / pressure former', kind: 'Appliances', mount: 'bench', sizeMm: { w: 320, d: 360, h: 480 } },
  'polishing-lathe': { status: 'planned', icon: 'disc', name: 'Polishing lathe with dust hood', kind: 'Finishing', mount: 'bench', sizeMm: { w: 620, d: 420, h: 460 } },
  'dust-extractor': { status: 'planned', icon: 'air', name: 'Dust extractor', kind: 'Extraction', mount: 'floor', sizeMm: { w: 230, d: 560, h: 580 } },

  // ── Planned · Clinic ───────────────────────────────────────────────────────
  'intraoral-scanner': { status: 'planned', icon: 'scanner', name: 'Intraoral scanner cart', kind: 'Chairside scanning', mount: 'floor', sizeMm: { w: 480, d: 480, h: 1250 } },
};
