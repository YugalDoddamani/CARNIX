// WHAT THE VISITOR READS — every sentence and every number the tour teaches.
//
// The tour is for people learning about dental technology, so this file is
// held to a higher standard than the rest:
//
//   · Every figure about a real machine comes from its maker's own manual or
//     product page (or a dealer's copy of the maker's data sheet) and is listed
//     under `sources`. If a figure cannot be traced, leave it out.
//   · `confirm` is a note to ourselves, never shown to visitors: something the
//     lab should check before trusting the entry. `npm run check` lists them.
//     (The tour does not display it, but this file is as public as the page
//     itself. Nothing private belongs in a note.)
//   · Plain words. A first-year student should understand every line.
//
// To add a machine: add an entry to MACHINE_INFO under the same id it has in
// catalogue.js. Only `summary` is required; each of `brand`, `features` and
// `capabilities` adds one pill to the machine's panel.

/** The welcome guide, and the introduction on the overview. */
export const GUIDE = {
  eyebrow: 'Lab tour',
  title: 'Explore our digital dental lab',
  lead: 'A dental lab makes the crowns, bridges and dentures that dentists order for their patients. This tour takes you through ours, room by room, and shows what each machine does.',
  steps: [
    { icon: 'lab', title: 'Pick a room', text: 'Use the bar at the bottom, or tap a room in the 3D lab.' },
    { icon: 'tap', title: 'Tap a machine', text: 'It comes forward on its own. Drag to turn it; pinch or scroll to zoom.' },
    { icon: 'book', title: 'Learn what it does', text: 'Each machine tells you who makes it, its key figures and what sets it apart.' },
  ],
  start: 'Start the tour',
  skip: 'Explore on my own',
  reopen: 'You can open this guide again with the Guide button at the top.',
};

/**
 * The order in which the guided tour visits the rooms: roughly the way a case
 * moves through a lab, from arrival to the finished prosthesis.
 * ⚠ DRAFT ORDER — rearrange this one line to match how your lab really works.
 */
export const ROUTE = ['clinic', 'plaster', 'design', 'printing', 'ceramic', 'acrylic'];

/** One short paragraph per room: what happens there. */
export const ROOM_INFO = {
  clinic: {
    about: 'Where patients are received, and where every case starts its way through the lab: as an impression, or as a digital scan of the teeth.',
  },
  plaster: {
    about: 'Where impressions become models. Plaster is mixed under vacuum, poured into the impression, then trimmed and pinned so that single teeth can be lifted out of the model.',
  },
  design: {
    about: 'Where models become digital. Lab scanners capture a model in 3D, and technicians design crowns, bridges and other restorations on screen.',
  },
  printing: {
    about: 'Where designs become objects. 3D printers build models, guides and try-ins from liquid resin, layer by layer. The parts are then washed and cured with light.',
  },
  ceramic: {
    about: 'Where restorations get their final material and colour. Ceramic is fired and glazed in furnaces at up to about 1,200 °C, then finished by hand.',
  },
  acrylic: {
    about: 'Where removable prostheses are made. Dentures are processed in acrylic, cured under pressure, then trimmed and polished.',
  },
};

/** Who makes the machines. Shown under the "About" pill. */
export const BRANDS = {
  shining3d: {
    name: 'SHINING 3D',
    place: 'Hangzhou, China',
    since: 2004,
    about:
      'SHINING 3D builds 3D scanners and 3D printers. Its dental range covers intraoral scanners for the clinic, desktop scanners for the lab such as this one, and dental 3D printers.',
    sources: [{ label: 'SHINING 3D Dental, company profile', url: 'https://www.shining3ddental.com/news-post/aoralscan-elf-by-shining-3d-dental-a-new-era-of-smart-intraoral-scanning-for-digital-dentistry' }],
  },
  '3shape': {
    name: '3Shape',
    place: 'Copenhagen, Denmark',
    since: 2000,
    about:
      '3Shape develops 3D scanners and design software for dentistry: the TRIOS intraoral scanners used in clinics, lab scanners such as the E4, and the Dental System software in which restorations are designed.',
    sources: [{ label: 'CB Insights, 3Shape company profile', url: 'https://www.cbinsights.com/company/3shape' }],
  },
  zubler: {
    name: 'Zubler',
    place: 'Ulm, Germany',
    about: 'Zubler Gerätebau builds equipment for dental laboratories: ceramic furnaces and press furnaces, dust-extraction systems and grinding units.',
    sources: [{ label: 'Chamber of Commerce Ulm, company profile', url: 'https://www.topunternehmen.ulm.ihk24.de/en/top-unternehmen/unternehmen/?id=9' }],
  },
  upcera: {
    name: 'UPCERA',
    place: 'China',
    since: 2001,
    about:
      'UPCERA is a dental materials company that grew out of the ceramics laboratory of Tsinghua University. It is best known for zirconia blanks and glass ceramics for crowns and bridges, and also builds equipment to process them, such as furnaces and milling machines.',
    sources: [{ label: 'UPCERA, company page', url: 'https://upcera.com/en/company' }],
  },
  ivoclar: {
    name: 'Ivoclar',
    place: 'Schaan, Liechtenstein',
    since: 1923,
    about:
      'Ivoclar is one of the large dental manufacturers. It makes materials for dentists and dental technicians, among them the IPS e.max ceramics, and equipment such as the Programat furnaces. It was formerly called Ivoclar Vivadent, the name printed on this furnace.',
    sources: [{ label: 'Ivoclar, company history', url: 'https://www.ivoclar.com/en_li/media-release/2023/a-tour-through-the-company-s-history' }],
  },
};

export const MACHINE_INFO = {
  // ── Design Room ────────────────────────────────────────────────────────────
  'dsex-pro': {
    brand: 'shining3d',
    summary: 'A desktop 3D scanner. It turns a plaster model, a single die or an impression into a precise digital 3D model that a technician can design on.',
    how: 'The model stands on a small turntable under an open arm. The scanner projects patterns of blue light onto it while cameras record how the patterns fall on the surface; software turns those pictures into 3D.',
    features: [
      { label: 'Camera resolution', value: '1.3 – 5 MP', note: 'by version' },
      { label: 'Accuracy', value: '8 – 10 µm', note: 'by version' },
      { label: 'One jaw scanned in', value: '9.5 – 14 s', note: 'by version' },
      { label: 'Light', value: 'Blue light' },
      { label: 'File formats', value: 'STL · OBJ · PLY' },
      { label: 'Weight', value: '5 kg', note: 'Pro and Pro(C)' },
    ],
    featuresNote:
      'The DS-EX Pro exists in three versions. The first has 1.3 MP cameras and 10 µm accuracy; the Pro(C) has 2.4 MP cameras and also records colour; the Pro(H) has two 5 MP cameras and 8 µm accuracy.',
    capabilities: [
      'Scans plaster models, single dies and impressions.',
      'Articulator scan: records how the upper and lower jaw meet.',
      'All-in-one scan: a quadrant model and its dies are scanned at the same time.',
      'Open design with no door, so different models are easy to place.',
      'Fills gaps by itself: it plans a second pass over the areas it missed.',
      'Saves open file formats that other design programs can read.',
    ],
    sources: [
      { label: 'SHINING 3D Dental, AutoScan-DS-EX Pro(C)', url: 'https://www.shining3ddental.com/solution/ds-ex-pro-lab-sacnner/' },
      { label: 'Data sheet, DS-EX Pro (via Crea3D)', url: 'https://www.crea3d.com/en/shining3d/721-autoscan-ds-ex-pro-dental-scanner.html' },
      { label: 'Data sheet, DS-EX Pro(C) (via 3D Dental)', url: 'https://3ddental.sk/wp-content/uploads/2025/04/AutoScan-DS-EX-ProC-EN-20240529-V0.6.pdf' },
      { label: 'Data sheet, DS-EX Pro(H) (via Crea3D)', url: 'https://www.crea3d.com/en/shining3d/1091-autoscan-ds-ex-pro-h-dental-scanner.html' },
    ],
    confirm:
      'Which version is in the lab: DS-EX Pro, Pro(C) or Pro(H)? Camera resolution, accuracy and scan times differ; the panel shows ranges until this is known. The 5 kg weight is published for the Pro and the Pro(C) only.',
  },
  'pc-dsex': {
    summary: 'The computer the DS-EX Pro scanner is plugged into. A scanner only records what it sees; this PC turns the recordings into a 3D model.',
    capabilities: [
      'Controls the scanner and shows the scan as it builds up.',
      'Joins the separate scans (upper jaw, lower jaw, bite, dies) into one model.',
      'Saves the result as an STL, OBJ or PLY file for the design software.',
    ],
  },
  '3shape-e4': {
    brand: '3shape',
    summary: 'A high-speed desktop 3D scanner for dental labs. Four cameras capture a full-arch model in about nine seconds.',
    how: 'The model is placed inside, on a plate that moves it under the cameras. Lines of blue LED light sweep over it, and four cameras record the surface from different angles.',
    features: [
      { label: 'Cameras', value: '4 × 5 MP' },
      { label: 'Accuracy', value: '4 µm', note: 'ISO 12836' },
      { label: 'Full arch scanned in', value: '9 s' },
      { label: 'Full-arch impression', value: '45 s' },
      { label: 'Light', value: 'Blue LED, multi-line' },
      { label: 'Texture', value: 'Colour' },
    ],
    capabilities: [
      'Die-in-model scanning: the prepared teeth are scanned while still in the model, not one by one.',
      'Scans an impression directly, without pouring a plaster model first.',
      'Colour texture: the scan keeps the colours of the surface, so lines a technician has drawn on the model show up on screen.',
      'Auto-start: scanning begins by itself as soon as a model is placed inside.',
      'Articulator support: models can be scanned mounted in an articulator, to record the bite.',
    ],
    sources: [
      { label: '3Shape, E4 lab scanner', url: 'https://www.3shape.com/en-gb/scanners/e4' },
      { label: '3Shape Dental System product catalogue', url: 'https://manuals.plus/m/655d2a77c0b7ff1e931b63ea31fac44f1a627a91d9d5183679982e3d647801a9' },
      { label: '3Shape, E scanners press release (auto-start)', url: 'https://www.3shape.com/en/press/2017/superior-and-more-affordable-solutions-for-dental-labs-from-3shape' },
    ],
    confirm:
      "Auto-start and articulator support are described by 3Shape for the E1 to E3 and listed by dealers as carried over to the E4; 3Shape's own E4 page does not mention them. What colour texture is used for (drawn lines) is the general purpose of texture scanning, not a sentence from the E4 page.",
  },
  'pc-3shape': {
    summary: 'The design workstation beside the 3Shape E4. It receives the scan and runs the software in which the restoration is designed.',
    capabilities: [
      'Runs the 3Shape design software (CAD).',
      'Used to design crowns, bridges, implant restorations and splints on screen.',
      'Sends the finished design on as a file, to be printed or milled.',
    ],
  },

  // ── Ceramic Room ───────────────────────────────────────────────────────────
  'zubler-vario-200': {
    brand: 'zubler',
    summary: 'A ceramic furnace. It fires dental porcelain: the ceramic a technician builds up on a crown fuses into a dense, tooth-like material as the chamber heats under vacuum.',
    how: 'The work stands on a firing tray on a lift. The lift raises it into the round firing chamber above, where it is heated to a programmed schedule.',
    features: [
      { label: 'Maximum temperature', value: '1,200 °C' },
      { label: 'Programs', value: '500' },
      { label: 'Firing chamber', value: '120 mm', note: 'inner diameter' },
      { label: 'Stand-by temperature', value: '20 – 700 °C' },
      { label: 'Size (W × D × H)', value: '320 × 460 × 540 mm' },
      { label: 'Weight', value: '23 kg' },
    ],
    featuresNote: 'The vacuum comes from a separate pump. Above 1,075 °C the heating muffle wears faster, the manual notes.',
    capabilities: [
      'A wide chamber, 120 mm across, designed to keep the temperature even over the whole firing tray.',
      'Programs with two heating stages and two holding times, used for example to crystallise lithium-disilicate blocks.',
      'Pre-drying: an optional first step that dries the ceramic evenly before it is fired.',
      'Controlled cooling (TTC), on the ZR version of this furnace: the work cools at a set rate after firing, which protects ceramic on zirconia from cracks and chipping.',
      'Programs can be saved to a USB stick and loaded from it.',
    ],
    sources: [
      { label: 'Zubler, VARIO 200 operating instructions', url: 'https://zublerusa.com/wp-content/uploads/2023/01/vario200-user-manua.pdf' },
      { label: 'Zubler USA, VARIO 200 / 200ZR', url: 'https://zublerusa.com/legacy-ceramic-ovens/' },
    ],
    confirm:
      "(1) The asset library calls this a 'Pressing & Ceramic Furnace'. Zubler's manual says the VARIO 200 is for firing dental ceramics only (the press furnace is the VARIO PRESS 300). The tour says 'ceramic furnace'. Confirm which machine the lab has. (2) Is it a VARIO 200 or a VARIO 200ZR? Zubler lists controlled cooling (TTC) for the 200ZR only; the tour says so.",
  },
  'upcera-a7-plus': {
    brand: 'upcera',
    summary: 'A porcelain furnace. It fires and glazes the ceramic layers of crowns and bridges under vacuum.',
    how: 'The work is placed on the platform, which rises by itself into the chamber. The furnace then follows a programmed heating schedule.',
    features: [
      { label: 'Maximum temperature', value: '1,150 °C' },
      { label: 'Heating rate', value: '10 – 100 °C/min' },
      { label: 'Holding time', value: '0:30 – 30:00 min' },
      { label: 'Vacuum', value: '< 35 mmHg' },
      { label: 'Firing chamber', value: '85 × 55 mm' },
      { label: 'Size (W × D × H)', value: '330 × 420 × 560 mm' },
      { label: 'Weight', value: '26.5 kg' },
    ],
    capabilities: [
      'Two-stage programs, for materials that need two different heating steps.',
      'Built-in programs for vacuum testing, cleaning and drying the chamber.',
      'Temperature compensation, to calibrate the furnace.',
      'Double-layer metal protection around the chamber.',
      'Warns of errors by itself.',
    ],
    sources: [{ label: 'UPCERA, FLNTOven A7+ product page', url: 'http://dental.upcera.com/en/products/identity/29/30/en-a7-plus-41' }],
    confirm: "UPCERA's page gives the heating rate as '10-100 ℃' with no unit of time; the tour reads it as per minute, the usual unit. It gives the vacuum as < 35 mmHg; some dealers quote < 30 mmHg.",
  },
  'ivoclar-programat-p300': {
    brand: 'ivoclar',
    summary: 'A ceramic furnace with a hinged head. It fires dental ceramics under vacuum.',
    how: 'The furnace head tips open, the work is placed on the firing plate, and the head closes over it. Heating and vacuum then follow the chosen program.',
    features: [
      { label: 'Maximum temperature', value: '1,200 °C' },
      { label: 'Heating rate', value: '30 – 140 °C/min' },
      { label: 'Programs', value: '100' },
      { label: 'Firing chamber', value: 'Ø 80 × 48 mm', note: 'usable size' },
      { label: 'Stand-by temperature', value: '100 – 700 °C' },
      { label: 'Weight', value: '16.8 kg', note: 'base 12.3 + head 4.5' },
    ],
    featuresNote: 'The vacuum comes from a separate pump.',
    capabilities: [
      'Vacuum firing: each program sets the temperatures at which the vacuum switches on and off.',
      'Two-stage programs: a second heating rate and holding temperature in one firing.',
      'Long-term cooling: lets the work cool slowly, at a set rate, down to a chosen temperature.',
      'Checks every program before it starts and stops if the settings contradict each other.',
      'Test programs for the vacuum, the heating muffle and the keys, plus cleaning and drying programs.',
    ],
    sources: [{ label: 'Ivoclar Vivadent, Programat P300 operating instructions', url: 'https://www.prodonsa.com/ivoclarvivadent/pdf/P300-e-BA-0306.pdf' }],
    confirm: "Figures are from the first P300 manual (2006). The later P300/G2 holds more programs. The asset library's note says 'QTK2'; the P300 manual says 'QTK heating muffle'.",
  },

  // ── Not modelled yet: what this kind of machine is for ─────────────────────
  // (General descriptions of the type. Brand, figures and capabilities are
  // added when the lab's real machine is known.)
  'resin-printer': { summary: 'Builds an object layer by layer from liquid resin that hardens where light hits it. Labs print models, surgical guides, splints and try-ins this way.' },
  'wash-station': { summary: 'Rinses freshly printed parts in a solvent to remove the liquid resin still clinging to them.' },
  'cure-unit': { summary: 'Finishes a printed part with light, bringing the resin to its final strength.' },
  'model-trimmer': { summary: 'Grinds the base and sides of a plaster model flat and to shape on a rotating abrasive disc.' },
  'vacuum-mixer': { summary: 'Mixes plaster or investment with water under vacuum, so the mix sets without air bubbles.' },
  vibrator: { summary: 'A vibrating plate. It makes freshly mixed plaster flow into every detail of an impression and shakes out trapped air.' },
  'pin-drill': { summary: 'Drills holes into the base of a model for the pins that let single teeth be lifted out and put back in exactly the same place.' },
  'plaster-sink': { summary: 'A sink whose trap catches plaster before it reaches the drain, where it would set and block the pipes.' },
  'steam-cleaner': { summary: 'Cleans restorations with a jet of pressurised steam, removing wax, polishing paste and grinding dust.' },
  sandblaster: { summary: 'Blasts a surface with a fine jet of abrasive particles, to clean it or to roughen it so that ceramic or cement grips.' },
  'ultrasonic-cleaner': { summary: 'Cleans small parts in a liquid bath shaken by ultrasound, which loosens dirt from places a brush cannot reach.' },
  micromotor: { summary: 'The technician’s hand tool: a small motor with a handpiece that spins burs and polishers for trimming, shaping and finishing.' },
  'boil-out-unit': { summary: 'Flushes the wax out of a denture mould with hot water, leaving the space that acrylic will fill.' },
  'flask-press': { summary: 'Presses the two halves of a denture flask together while the acrylic is packed in.' },
  'pressure-polymeriser': { summary: 'Cures acrylic in warm water under air pressure, which gives a denser result with fewer pores.' },
  thermoformer: { summary: 'Heats a plastic sheet and pulls or presses it over a model, to make splints, aligners and mouthguards.' },
  'polishing-lathe': { summary: 'A motor with spindles for brushes and buffing wheels, used to polish dentures. The hood collects the dust.' },
  'dust-extractor': { summary: 'Draws grinding dust away from the workplace so that the technician does not breathe it in.' },
  'intraoral-scanner': { summary: 'A hand-held scanner that records the teeth directly in the patient’s mouth: a digital impression, without impression material.' },
};
