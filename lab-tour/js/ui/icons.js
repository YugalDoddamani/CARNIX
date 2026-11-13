// Stroke icons on a 24 × 24 grid. One visual language everywhere: 1.8 px line,
// round caps and joins, no fills. They inherit the text colour.
//
//   ICONS[name]   rooms (the `icon` of a room in layout.js) and kinds of
//                 machine (the `icon` of an entry in catalogue.js)
//   UI[name]      arrows, close, check… used by the interface itself
const svg = (paths, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const MONITOR = '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20 H16 M12 16 V20"/>';
const CUBE = '<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z"/><path d="M4 7.5 L12 12 L20 7.5 M12 12 V21"/>';
const FLAME = '<path d="M12 3 C13 6.4 16.5 8.2 16.5 12.5 A4.5 4.5 0 0 1 7.5 12.5 C7.5 10.9 8.1 9.6 9.1 8.5 C9.5 9.9 10.2 10.6 11.1 10.8 C10.7 8.2 11 5.5 12 3 Z"/>';
const TOOTH =
  '<path d="M7.5 3.5 C5.2 3.5 3.5 5.4 3.5 8 C3.5 10 4.3 11.2 4.8 13 C5.3 14.9 5.4 20.5 7.5 20.5 C9.3 20.5 9 15.5 12 15.5 C15 15.5 14.7 20.5 16.5 20.5 C18.6 20.5 18.7 14.9 19.2 13 C19.7 11.2 20.5 10 20.5 8 C20.5 5.4 18.8 3.5 16.5 3.5 C14.8 3.5 13.5 4.5 12 4.5 C10.5 4.5 9.2 3.5 7.5 3.5 Z"/>';
const SCAN =
  '<path d="M4 8 V6.5 A2.5 2.5 0 0 1 6.5 4 H8 M16 4 H17.5 A2.5 2.5 0 0 1 20 6.5 V8 M20 16 V17.5 A2.5 2.5 0 0 1 17.5 20 H16 M8 20 H6.5 A2.5 2.5 0 0 1 4 17.5 V16"/><path d="M3 12 H21"/>';
const DROPLET = '<path d="M12 3.5 C12 3.5 6 10 6 14.2 A6 6 0 0 0 18 14.2 C18 10 12 3.5 12 3.5 Z"/>';
const WAVES = '<path d="M3 9 C5 7 7 7 9 9 S13 11 15 9 S19 7 21 9"/><path d="M3 15 C5 13 7 13 9 15 S13 17 15 15 S19 13 21 15"/>';
const DISC = '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.5 V6.4 M20.5 12 H17.6 M12 20.5 V17.6 M3.5 12 H6.4"/>';

export const ICONS = {
  // ── Rooms ──────────────────────────────────────────────────────────────────
  lab: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 11.5 H20.5 M10.5 4.5 V11.5 M14.5 11.5 V19.5"/>'), // floor plan
  design: svg(MONITOR),
  printing: svg(CUBE),
  clinic: svg('<circle cx="9" cy="8" r="3"/><path d="M3 20 A6 6 0 0 1 15 20"/><circle cx="17.2" cy="9" r="2.4"/><path d="M16.5 14.2 A5.4 5.4 0 0 1 21 19.6"/>'), // two people
  plaster: svg('<path d="M12 3 L21 7.8 L12 12.6 L3 7.8 Z"/><path d="M3 12.2 L12 17 L21 12.2 M3 16.4 L12 21.2 L21 16.4"/>'), // stacked layers
  ceramic: svg(FLAME),
  acrylic: svg(TOOTH),

  // ── Kinds of machine ───────────────────────────────────────────────────────
  scanner: svg(SCAN),
  computer: svg('<rect x="2.5" y="5" width="12.5" height="9" rx="1.6"/><path d="M6.2 18 H11.3 M8.75 14 V18"/><rect x="17.5" y="5" width="4" height="13" rx="1.2"/><path d="M19.5 8 V8.1"/>'),
  furnace: svg('<path d="M10 13.6 V5.5 A2 2 0 0 1 14 5.5 V13.6 A4 4 0 1 1 10 13.6 Z"/><path d="M12 9 V15.6"/>'), // thermometer
  printer: svg(CUBE),
  mill: svg('<path d="M9.4 2.8 H14.6 V11.4 L12 14.2 L9.4 11.4 Z"/><path d="M9.4 5.8 L14.6 8 M9.4 8.8 L14.6 11"/><path d="M3.5 14.6 H7.8 V17.4 H16.2 V14.6 H20.5 V20.6 H3.5 Z"/>'), // a fluted cutter in the slot it has cut into a block
  droplet: svg(DROPLET),
  light: svg('<circle cx="12" cy="12" r="3.6"/><path d="M12 3.5 V5.5 M12 18.5 V20.5 M3.5 12 H5.5 M18.5 12 H20.5 M6 6 L7.4 7.4 M16.6 16.6 L18 18 M18 6 L16.6 7.4 M7.4 16.6 L6 18"/>'),
  disc: svg(DISC),
  beaker: svg('<path d="M8.5 3.5 H15.5 M10 3.5 V9 L5.3 17.9 A1.8 1.8 0 0 0 6.9 20.5 H17.1 A1.8 1.8 0 0 0 18.7 17.9 L14 9 V3.5"/><path d="M7.6 14.5 H16.4"/>'),
  waves: svg(WAVES),
  target: svg('<circle cx="12" cy="12" r="6.5"/><path d="M12 2.8 V7 M12 17 V21.2 M2.8 12 H7 M17 12 H21.2 M12 12 V12.1"/>'),
  spray: svg('<path d="M3 10 H9.5 L12.5 8 V16 L9.5 14 H3 Z"/><path d="M16 9.2 V9.3 M16 12 V12.1 M16 14.8 V14.9 M19.6 7.4 V7.5 M19.6 12 V12.1 M19.6 16.6 V16.7"/>'),
  tool: svg('<path d="M5 19 L6.2 14.8 L16.4 4.6 A2.1 2.1 0 0 1 19.4 7.6 L9.2 17.8 Z"/><path d="M14.4 6.6 L17.4 9.6"/>'),
  press: svg('<path d="M5 4.5 H19 M5 19.5 H19"/><rect x="7.5" y="12.5" width="9" height="4.5" rx="1"/><path d="M12 4.5 V9.6 M9.8 7.6 L12 9.8 L14.2 7.6"/>'),
  gauge: svg('<path d="M5 16.5 A8 8 0 1 1 19 16.5"/><path d="M12 13.6 L15.4 9.2 M12 13.6 V13.7"/><path d="M5 20 H19"/>'),
  sheet: svg('<path d="M3 16.5 H6.6 C8.4 16.5 8.6 9.5 12 9.5 S15.6 16.5 17.4 16.5 H21"/><path d="M3 20 H21 M12 3.5 V6.3 M8 4.4 L9 6.6 M16 4.4 L15 6.6"/>'),
  air: svg('<path d="M3 8.5 H13.5 A2.5 2.5 0 1 0 11 6"/><path d="M3 12.5 H18 A2.5 2.5 0 1 1 15.5 15"/><path d="M3 16.5 H10.5 A2 2 0 1 1 8.5 18.5"/>'),
  machine: svg('<rect x="4.5" y="6" width="15" height="13" rx="2.2"/><path d="M8 3.5 V6 M16 3.5 V6 M8.5 10.5 H15.5 M8.5 14.5 H12"/>'),
};

export const UI = {
  back: svg('<path d="M15 5 L8 12 L15 19"/>', 18),
  chevron: svg('<path d="M9 5 L16 12 L9 19"/>', 18),
  arrow: svg('<path d="M5 12 H19 M13 6 L19 12 L13 18"/>', 18),
  close: svg('<path d="M6 6 L18 18 M18 6 L6 18"/>', 20),
  check: svg('<path d="M5 12.5 L10 17.5 L19 7.5"/>', 16),
  help: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.6 A2.4 2.4 0 1 1 13.3 11.7 C12.4 12.2 12 12.8 12 13.7"/><path d="M12 16.8 V16.9"/>', 20),
  rotate: svg('<path d="M20 12 A8 8 0 1 1 17.2 5.9"/><path d="M17.6 2.8 V6.4 H14"/>', 18),
  tap: svg('<path d="M9 11.6 V5.9 A1.8 1.8 0 0 1 12.6 5.9 V10.6 L16.7 11.5 A2.4 2.4 0 0 1 18.6 14.2 L17.9 18 A3 3 0 0 1 15 20.5 H12.5 A3 3 0 0 1 10.1 19.3 L6.4 14.4 A1.6 1.6 0 0 1 8.9 12.4 Z"/>'),
  book: svg('<path d="M12 6.5 C10 5 7 4.6 4 5.2 V18.2 C7 17.6 10 18 12 19.5 C14 18 17 17.6 20 18.2 V5.2 C17 4.6 14 5 12 6.5 Z"/><path d="M12 6.5 V19.5"/>'),
  pin: svg('<path d="M12 21 C12 21 5.5 15 5.5 10 A6.5 6.5 0 0 1 18.5 10 C18.5 15 12 21 12 21 Z"/><circle cx="12" cy="10" r="2.3"/>', 16),
  external: svg('<path d="M14 5 H19 V10 M19 5 L11 13 M17 14 V18 A1 1 0 0 1 16 19 H6 A1 1 0 0 1 5 18 V8 A1 1 0 0 1 6 7 H10"/>', 14),
};
