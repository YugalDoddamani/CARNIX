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
    about: 'Where designs become objects. 3D printers build models, guides and try-ins from liquid resin, layer by layer. The parts are then washed and cured with light. Milling machines work the other way round: they cut crowns and bridges out of a solid disc.',
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
  medit: {
    name: 'Medit',
    place: 'Seoul, South Korea',
    since: 2000,
    about:
      'Medit has worked on 3D scanning since it was founded in 2000, for industry and for dentistry. Its lab scanners, such as this one, stand in dental laboratories; its intraoral scanners are used by dentists in the clinic, and its Medit Link software connects the two.',
    sources: [
      { label: 'Medit, press release with company profile (2024)', url: 'https://www.prnewswire.com/news-releases/medit-appoints-han-ryu-as-ceo-focusing-on-customer-centric-innovation-302193152.html' },
      { label: 'Medit, T-Series brochure, "About Medit" (via CAD/CAM Lösungen)', url: 'https://cadcam-loesungen.at/website2019/wp-content/uploads/2019/06/medit-t-series-eng-1904.pdf' },
    ],
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
  'imes-icore': {
    name: 'imes-icore',
    place: 'Eiterfeld, Germany',
    since: 2002,
    about:
      'imes-icore builds computer-controlled machines that mill and grind dental restorations, for dental laboratories, clinics and milling centres. It was founded in 2002 as a spin-off from the isel Group and is based in Eiterfeld in Germany. Its dental machines are called CORiTEC; with them it offers the software, the cutting tools and the materials they work with.',
    sources: [
      { label: 'Ardian, press release with a profile of imes-icore (2017)', url: 'https://www.ardian.com/news-insights/press-releases/ardian-takes-majority-stake-cnc-technology-company-imes-icore' },
      { label: 'imes-icore, CORiTEC 350i PRO series brochure', url: 'https://www.imes-icore.com/d67-en/dental/Brochure/coritec-350i-series-brochure-en.pdf' },
    ],
  },
  dgshape: {
    name: 'DGSHAPE',
    place: 'Hamamatsu, Japan',
    since: 2017,
    about:
      'DGSHAPE belongs to the Roland DG group. Roland DG set it up in 2017 as a company of its own, to develop and sell its digital fabrication machines. For dental laboratories and clinics it builds the DWX series of milling machines, which began with the DWX-50 in 2011.',
    sources: [
      { label: 'DGSHAPE, press release on the DWX-52Di Plus (2025)', url: 'https://dgshape.com/dwx-52di-plus-dgshapes-upgraded-dry-dental-mill/' },
      { label: 'DGSHAPE, DWX-52Di Plus brochure', url: 'https://dgshape.com/wp-content/uploads/2026/06/DWX-52Di-Plus-brochure-en-ver.-3_r2.pdf' },
    ],
  },
  uniformation: {
    name: 'UniFormation',
    place: 'Shenzhen, China',
    since: 2016,
    about:
      'UniFormation develops 3D printers that harden liquid resin with light, and the machines that wash and cure the printed parts afterwards. Its GK series of desktop printers is made for makers and professional users.',
    sources: [
      { label: 'UniFormation, own website', url: 'https://uniformation3d.com/' },
      { label: 'UniFormation, company profile (All3DP, 2026)', url: 'https://all3dp.com/4/from-print-to-dry-uniformation-s10-reimagines-resin-3d-printing-ahead-of-kickstarter-launch/' },
      { label: 'UniFormation, company profile (MyMiniFactory)', url: 'https://www.myminifactory.com/stories/uniformation-gktwo' },
    ],
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
  'medit-t500': {
    brand: 'medit',
    summary: 'A desktop 3D scanner for dental labs. It measures a plaster model, single dies or an impression with blue light, and takes about twelve seconds for a full arch.',
    how: 'The model sits on a round plate at the end of an arm, in a bay that is open to the front and to one side. From under the roof a projector casts patterns of blue light onto it, and two cameras record how the patterns fall on the surface. The arm tilts and the plate turns, so that the cameras get to see every side.',
    features: [
      { label: 'Cameras', value: '2 × 2 MP' },
      { label: 'Accuracy', value: '7 µm', note: 'ISO 12836' },
      { label: 'Full arch scanned in', value: '12 s' },
      { label: 'Eight dies scanned in', value: '19 s' },
      { label: 'Light', value: 'Blue LED' },
      { label: 'Largest object', value: '90 × 72 × 60 mm', note: 'scanning volume' },
      { label: 'Size', value: '290 × 290 × 340 mm', note: 'width × depth × height' },
      { label: 'Weight', value: '12 kg' },
    ],
    capabilities: [
      'Flexible multi-die: a full arch or a part of one is scanned together with its single dies, in fewer steps. The plate holds up to 16 dies at once.',
      'With its 3-axis arm it scans an impression directly, both sides in one step, so that no plaster model has to be poured first.',
      'Touch to start: once the case is loaded, a touch on the scanner starts the scan. No reaching for the keyboard or mouse.',
      'Comes with a colour texture module, so that a scan can keep the colours of a surface as well as its shape.',
      'Comes with an articulator module, for scanning the two jaw models as they are mounted together.',
      'An open system: it reads and writes STL files, the format that design programs share.',
    ],
    sources: [
      { label: 'Medit, T-Series brochure, 2019 (via CAD/CAM Lösungen)', url: 'https://cadcam-loesungen.at/website2019/wp-content/uploads/2019/06/medit-t-series-eng-1904.pdf' },
      { label: 'Medit, T-Series brochure, 2018 (via Pearson Dental)', url: 'https://www.pearsondental.com/flyers/MEDIT_T-SERIES_ENG_180608.pdf' },
      { label: 'Medit Identica T500, dealer page (Norton Dental)', url: 'https://www.nortondental.net/medit-identica-t500' },
    ],
    confirm:
      "(1) Medit's brochures call this scanner 'Medit T500'; dealers, and the badge on the 3D model, say 'Identica T500'. The tour uses the model's name, 'Medit Identica T500'. (2) Which accessories does the lab have? The 2019 brochure lists the flexible multi-die, colour texture and articulator modules as included and the 3-axis arm for impressions as optional; dealers' pages describe the arm as part of the T500. Without the arm the T500 does not scan impressions the way its page here says. (3) The brochure only lists the colour texture and articulator modules; what they are for is described here from how such modules are generally used. (4) The back of the 3D model shows a rocker switch, a 24 V socket and a nameplate with a serial number. These were not checked against a Medit document.",
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

  // ── Printing Room ──────────────────────────────────────────────────────────
  'uniformation-gk3': {
    brand: 'uniformation',
    summary: 'A resin 3D printer. It builds an object layer by layer from liquid resin that hardens where light hits it. Labs print models, surgical guides, splints and try-ins this way.',
    how: 'A vat of liquid resin sits on a screen. For each layer the screen works as a mask: light passes only where the part should be solid, and the resin there hardens onto a platform. The platform rises one step per layer and lifts the growing part out of the liquid, upside down.',
    features: [
      { label: 'Size of one pixel', value: '14 × 19 µm' },
      { label: 'Largest print', value: '211 × 118 × 240 mm', note: 'width × depth × height' },
      { label: 'Pixels on the screen', value: '15,120 × 6,230', note: 'sold as "16K"' },
      { label: 'Layer thickness', value: '0.03, 0.05, 0.1 mm', note: 'suggested' },
      { label: 'Light', value: '405 nm', note: 'violet' },
      { label: 'Resin kept at', value: '25 or 30 °C' },
      { label: 'Resin cartridge', value: '1.2 kg' },
    ],
    featuresNote: 'Light of 405 nm is violet, at the very edge of ultraviolet. UniFormation, like other makers of resin printers, calls it UV.',
    capabilities: [
      'Tops up its own resin: a cartridge refills the vat during a print, and sensors keep it from running dry or overflowing.',
      'Warms the resin by itself, so that it flows and hardens the same way whatever the weather.',
      'A built-in camera shows the print in progress and can record a time-lapse.',
      'Takes print files by USB, Wi-Fi or network cable.',
      'The build platform and the resin vat are quick-release, for fast changes between prints.',
    ],
    sources: [{ label: 'UniFormation, GK3 product page', url: 'https://uniformation3d.com/products/uniformation-resin-3d-printer-gk3' }],
    confirm:
      "Which version does the lab have: GK3 (T) with a T-type lead screw, GK3 (B) with a ball screw, or GK3 Pro? The figures shown are UniFormation's for the GK3 (T and B are the same in all of them). The GK3 Pro uses 385 nm light instead of 405 nm, and UniFormation's own page points dental work to the Pro. The 3D model in the Drive shows a ball screw and a 405 nm hood, which would be the GK3 (B).",
  },
  'imes-icore-350i-pro': {
    brand: 'imes-icore',
    summary: 'A 5-axis milling machine. It cuts crowns, bridges, abutments and dentures out of a solid blank, following the design made on screen. It works dry or with a coolant, so it can take plastics, zirconia, glass ceramics and metals.',
    how: 'A blank, usually a round disc, is clamped in a holder inside the chamber. The holder turns the blank and tilts it, while a spindle with the cutting tool moves over it in three directions: five axes in all, moving at the same time. The spindle turns the tool at up to 60,000 turns a minute. Twenty tools stand ready in a changer, so the machine can go from coarse cutting to fine detail without a hand in it.',
    features: [
      { label: 'Spindle speed', value: '60,000 rpm', note: 'at most' },
      { label: 'Spindle power', value: '1.0 kW', note: 'air-cooled' },
      { label: 'Axes', value: '5', note: 'A axis 360° · B axis 115°' },
      { label: 'Tools in the changer', value: '20', note: '6 mm shaft' },
      { label: 'Accuracy of tool measurement', value: '0.002 mm' },
      { label: 'Coolant tank', value: '4.8 litres' },
      { label: 'Size', value: '758 × 790 × 857 mm', note: 'width × depth × height' },
      { label: 'Weight', value: '205 kg' },
    ],
    featuresNote: 'It needs compressed air from the lab’s supply: 80 litres a minute, at up to 9 bar.',
    capabilities: [
      'Wet and dry in one machine. Glass ceramics, composites and titanium are worked wet, with a coolant from the built-in tank; zirconia, PMMA and cobalt-chrome are milled dry.',
      'A wide range of materials: zirconia, glass ceramic, lithium disilicate, hybrid ceramic, composite, PEEK, PMMA and wax, and the metals cobalt-chrome and titanium.',
      'Its base is cast from polymer concrete, a heavy material that damps vibration: for more precise cuts and tools that last longer.',
      'Zero-point clamping: a blank or an adapter is changed with one click, and sits in exactly the same position again.',
      'A control PC and a touchscreen are built in. The machine is run from its own screen, with imes-icore’s Remote Dental software.',
      'Keeps track of how long each tool has run, and can carry on with a spare tool so that a job is not interrupted.',
      'Corrects for changes in temperature, and measures the position of every axis with an absolute measuring system.',
    ],
    sources: [
      { label: 'imes-icore, CORiTEC 350i series product page', url: 'https://www.imes-icore.com/dental/dental-lab/coritec-350i-series' },
      { label: 'imes-icore, CORiTEC 350i PRO series brochure', url: 'https://www.imes-icore.com/d67-en/dental/Brochure/coritec-350i-series-brochure-en.pdf' },
    ],
    confirm:
      "(1) Is the lab's machine the CORiTEC 350i PRO? The same body is sold as the PRO+ (2.6 kW water-cooled spindle, 210 kg) and as Loader versions that change up to 12 blanks by themselves (1,058 mm wide). The figures shown are imes-icore's for the PRO. (2) imes-icore's two documents differ in places: weight 205 kg (brochure) or 180 to 210 kg for PRO and PRO+ together (web page); compressed air from 6.0 bar (brochure) or from 6.5 bar (web page), the tour says 'up to 9 bar'; screen 15.6 inch (brochure) or 15 inch (web page), the tour gives no size. (3) Both give the B axis as '115°' without saying from where to where. (4) What does it stand on? imes-icore sells machine tables for it (T1: 770 × 930 × 790 mm, width × height × depth). In the tour it shares a 900 mm high table with the DGSHAPE mill; a real one has to carry 205 kg. (5) On the 3D model and not checked against an imes-icore document: the type plate (item number 511003-0350, a serial number, '2.2 kW'), a German service sticker ('Wartung'), the 'Made in Germany' badge, the air regulator at the back, the door that lifts, and what the touchscreen shows.",
  },
  'dgshape-dwx-52di-plus': {
    brand: 'dgshape',
    summary: 'A 5-axis dry milling machine. It cuts crowns, bridges and other restorations out of a disc of zirconia, wax or plastic, following the design made on screen. It uses no liquid: a separate dust collector draws the milling dust away.',
    how: 'A disc of material is held in a C-shaped clamp. The clamp turns the disc right round and tilts it by up to 30° either way, while the spindle with the milling bur moves over it in three directions: five axes in all. The spindle turns the bur at 6,000 to 30,000 turns a minute. Fifteen burs wait in a magazine beside the disc, and the machine takes the one that each step needs.',
    features: [
      { label: 'Spindle speed', value: '6,000 – 30,000 rpm' },
      { label: 'Axes', value: '5', note: 'A ±360° · B ±30°' },
      { label: 'Burs in the magazine', value: '15', note: '4 mm shank' },
      { label: 'Disc', value: '98.5 mm', note: 'across; up to 60 mm thick' },
      { label: 'Power drawn', value: 'about 200 W' },
      { label: 'Size', value: '495 × 660 × 600 mm', note: 'width × depth × height' },
      { label: 'Weight', value: '67 kg' },
    ],
    featuresNote: 'It needs compressed air (0.02 to 0.2 MPa) and a dust collector, both from outside the machine.',
    capabilities: [
      'Mills dry only. DGSHAPE builds separate machines for dry and for wet milling, to keep each one easy to use and to look after.',
      'Materials: zirconia, wax, PMMA, composite resin, PEEK, PEKK, gypsum, glass-fibre reinforced resin, sinter metal (cobalt-chrome) and polycarbonate.',
      'The C-shaped clamp lets the bur work right up to the rim of a disc, so that more of the material is used.',
      'With an optional adapter it mills up to eight small pin-type blocks at a time, in place of one disc.',
      'Intelligent Tool Control: when a bur has reached the working life the user has set for it, the machine swaps it for a fresh one by itself.',
      'An ionizer in the chamber takes the static charge off the dust when PMMA is cut.',
      'An open system: it works with the CAD/CAM software the lab prefers.',
    ],
    sources: [
      { label: 'DGSHAPE, DWX-52Di Plus product page', url: 'https://dgshape.com/dwx-52di-plus/' },
      { label: 'DGSHAPE, DWX-52Di Plus brochure', url: 'https://dgshape.com/wp-content/uploads/2026/06/DWX-52Di-Plus-brochure-en-ver.-3_r2.pdf' },
      { label: 'DGSHAPE, DWX-52Di Setup Guide (ionizer, dust collector)', url: 'https://downloadcenter.rolanddg.com/contents/manuals/DWX-52Di_INS_EN.pdf' },
    ],
    confirm:
      "(1) Is the lab's machine the DWX-52Di Plus (released in March 2025), or the earlier DWX-52Di or DWX-52D Plus? The figures shown are DGSHAPE's for the DWX-52Di Plus. (2) The ionizer, and that the machine cannot mill without a dust collector, are taken from DGSHAPE's Setup Guide for the DWX-52Di. That guide names the spindle unit of the Plus (ZS-52D) but not the name 'Plus'; DGSHAPE's page and brochure for the Plus list dust hoses among the included items and do not mention an ionizer. (3) DGSHAPE also advertises a 90-degree milling range for the C-type clamp, with a footnote that this depends on the region; the tour leaves it out. (4) The 3D model in the Drive has a drawer at the bottom front, called a dust drawer in its file. DGSHAPE's Setup Guide shows a bottom cover there with storage behind it, and the dust leaving through a port at the back. The tour's texts do not call it a dust drawer. (5) On the 3D model and not checked against a DGSHAPE document: the type plate (a serial number, an address in Hamamatsu, 'Made in Japan'), and the chamber light that turns blue while milling (the tour shows neither that light nor the milling).",
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
