// HOW TO USE IT — short guides to working a machine, step by step.
//
// What knowledge.js is to a machine's description, this file is to its guides.
// It is held to the same standard, and to one rule more:
//
//   · A guide retells the maker's own instructions for use, in the maker's
//     order and in plain words. Nothing is added from experience or from other
//     machines. Where the instructions leave something open, the guide leaves
//     it out. A warning that belongs to a step is part of that step.
//   · `source` names those instructions. The panel prints it under every guide,
//     and says that a guide does not replace the manual or training.
//   · One machine has no such instructions to be had: the lab has no manual for
//     its UPCERA A7+, and UPCERA publishes none. At the lab's wish it has a
//     BASIC guide all the same. `basic` says so, on every page of it, and a
//     label "Basic guide" stands over it. Such a guide rests on what there is
//     (here a dealer's directions for use, the maker's product sheet and photos,
//     and how furnaces of its build are worked). It names a key only by what is
//     printed on it, gives no settings and no keystrokes it cannot show, and
//     says where it does not know. `confirm` lists what it takes for granted.
//     It is the exception, not a second way of writing guides: a machine with
//     instructions gets its guides from those.
//   · `confirm` is a note to ourselves, as in knowledge.js: never shown, listed
//     by `npm run check`, and as public as the page itself.
//
// A machine gets its guides by an entry here under the id it has in
// catalogue.js. Its panel then shows a card "How to use it" on the first pill.
//
//   source   { label, url }: "A short guide from <label>."
//   basic    only for a basic guide (above): one sentence saying that it is
//            one and what else it rests on, printed right after the source
//   note     optional: one sentence about the 3D model that the reader of a
//            guide should know, printed after the source
//   places   where on the machine a step can point (see below)
//   guides   [{ id, title, steps: [{ title, text, at?, open?, without? }] }]
//            id        the guide's name in the address: lower case and hyphens
//            at        the name of a place: the model turns to it and marks it
//            open      true: the machine stands open in this step: its lid or
//                      cover, a furnace's head, a furnace's lift down. Left out:
//                      it stands shut. (With no step open, a machine stands as
//                      its model is built; one furnace is built open.)
//            without   parts of the model that are not there yet in this step
//
// PLACES. A place is written in the terms of the machine's 3D model, with the
// numbers of the model's own file (js/assets/viewers/ or legacy/): x from its
// left to its right as one stands in front of it, y up, z towards the front,
// 80 mm to a unit.
//
//   part   the name of a group in the model. The marks belong to it and move
//          with it. With nothing else given, its middle is marked and the
//          camera frames it whole.
//   at     a point [x, y, z] on the part's surface, or several: each gets a ring
//   size   the diameter of a ring, in the model's units (left out: a small ring).
//          A point with a fourth number has a ring of that diameter instead.
//   from   [turn, tilt] in degrees: the side the camera looks from. Turn 0 is
//          straight in front, 90 the machine's right-hand end, −90 its left,
//          180 its back; tilt is the height above the horizon (2 to 85).
//   show   what the camera frames: a number (a cube that wide around the
//          marks), or a name: another part, one mesh of the model, or the
//          model's own id for the whole machine. It is framed where it lies
//          at that step: a furnace's head is elsewhere open than shut.
//
// `npm run check` builds the model and tries every step: the parts must exist,
// and from the side a step looks from, each mark must be in plain sight (the
// first thing the eye meets there is the part it belongs to). It cannot tell
// whether a mark sits on the RIGHT key or screw: look at it in the tour.

// ── bredent thermopress 400 ──────────────────────────────────────────────────
// Its keypad is one flat picture on the sloped top of the housing: a display,
// and under it two rows of seven keys. bredent numbers them (03) to (16), odd
// numbers along the top row and even ones along the bottom. `key(column, row)`
// is the middle of a key: the first key of the top row, plus so much for every
// key further right and for the row below. (Read from the model's file: the
// picture is 768 × 440 px on a plane 1.82 × 1.04 units, tilted with the deck.)
const key = (column, row) => [-2.864 + 0.204 * column, 2.423 - 0.117 * row, 0.941 + 0.216 * row];
const KEYS = { part: 'controlPanelAssembly', size: 0.25, from: [0, 50], show: 'controlPanelAssembly' };
const K = {
  startHeating: key(0, 0), // (03)
  heatingTime1: key(1, 0), // (05)
  heatingTime2: key(2, 0), // (07)
  startInjecting: key(3, 0), // (09)
  menuUp: key(4, 0), // (11), yellow
  inputUp: key(5, 0), // (13), blue
  ce: key(6, 0), // (15)
  pistonForward: key(2, 1), // (08), blue: also "Eject cartridge" and, in manual mode, "Manual mode key"
  buzzerOff: key(3, 1), // (10)
  menuDown: key(4, 1), // (12), yellow
  inputDown: key(5, 1), // (14), blue
  enter: key(6, 1), // (16)
};
// In the flask chamber, under the lid. The two clamping screws: number 1 in the
// front wall, number 2 in the right-hand end (the model shows its T-handle key
// on that one while the lid is open).
const SCREW_1 = [1.42, 0.98, 1.86];
const SCREW_2 = [4.64, 1.04, 1.03];
const BRACKET = [3.56, 2.04, 0.22];

// ── Zubler Vario 200 ─────────────────────────────────────────────────────────
// Its console is a flat plate that leans back by about 32°, with a display, a
// dialer and six keys: green, red and two yellow ones under the display, two
// yellow ones under the dialer. `onVario(x, y)` is a point on that plate, with
// the numbers of the model's file: x and y from the plate's middle, to the
// right and up along the plate. (The plate's own group stands at
// [0.44, 1.09, 2.61] and is turned by atan(1.18 / 1.90); the keys' tops are
// about 0.09 in front of its origin, the group itself another 0.018.)
const VARIO_LEAN = Math.atan2(1.18, 1.9);
const onVario = (x, y, out = 0.108) => [0.44 + x, 1.09 + y * Math.cos(VARIO_LEAN) + out * Math.sin(VARIO_LEAN), 2.61 - y * Math.sin(VARIO_LEAN) + out * Math.cos(VARIO_LEAN)];
// It is looked at from well above: seen square on, the glossy plate mirrors the
// room's light, and the display and the keys' colours wash out.
const VARIO_CONSOLE = { part: 'controlConsole', size: 0.44, from: [0, 58], show: 'controlConsole' };
const V = {
  display: [...onVario(-0.68, 0.17, 0.088), 0.95],
  dialer: [...onVario(1.04, 0.24, 0.1), 0.72],
  enter: onVario(-1.32, -0.7), // green
  esc: onVario(-0.9, -0.7), // red
  soft1: onVario(-0.48, -0.7), // yellow: the display writes above it what it does
  soft2: onVario(-0.06, -0.7), // yellow, the same
  minus: onVario(0.82, -0.7), // yellow, under the dialer
  plus: onVario(1.26, -0.7), // yellow, under the dialer
};
// The firing table: a metal collar with a white ceramic cone on it. The model
// is drawn with the lift down; the collar's top is at 1.42 and the cone's at
// 2.385. Both places on it share one view of the whole furnace, so that between
// two steps only the lift moves.
const VARIO_TABLE_TOP = [-0.36, 2.385, 0.4];
const VARIO_COLLAR = [-0.36, 1.12, 1.313];
const VARIO_WHOLE = { part: 'firingPedestal', from: [24, 12], show: 'zubler-vario-200' };

// ── Ivoclar Programat P300 ───────────────────────────────────────────────────
// Its keypad is a flat plate on the front of the base, leaning back by about
// 14°. `onP300(x, y)` is a point on it, with the numbers of the model's file: x
// and y from the middle of the plate's group, which stands at [0, 1.12, 1.72]
// and is turned by 0.25. The keys' legends lie 0.062 in front of it.
const onP300 = (x, y, out = 0.064) => [x, 1.12 + y * Math.cos(0.25) + out * Math.sin(0.25), 1.72 - y * Math.sin(0.25) + out * Math.cos(0.25)];
// What is framed is the keypad's membrane, not the housing around it: on a phone the keys are half as large again.
const P300_KEYPAD = { part: 'controlConsole', size: 0.24, from: [0, 18], show: 'keypadMembranePane' };
const P = {
  display: [...onP300(-0.2, 0.44, 0.05), 0.5],
  openHead: onP300(0.72, 0.46), // the upper of the two keys right of the display
  closeHead: onP300(0.72, 0.27), // the lower one
  stop: [...onP300(0.72, -0.02), 0.3],
  start: [...onP300(0.72, -0.28), 0.36],
  cursor: [...onP300(-0.52, -0.62), 0.38], // two keys, left and right
  program: onP300(-0.11, -0.62), // "P"
  plusMinus: [...onP300(0.3, -0.62), 0.38], // two keys, − and +
  // Printed on the plate: the firing curve with a key at each of its points, and the block of number keys beside it.
  curve: [...onP300(-0.414, -0.13, 0.042), 0.74],
  numbers: [...onP300(0.168, -0.134, 0.042), 0.58],
  // On the real keypad the bottom row of that block reads ESC, 0, ENTER.
  escape: [...onP300(0.032, -0.308, 0.042), 0.16],
  enter: [...onP300(0.304, -0.308, 0.042), 0.16],
};

// ── UPCERA A7+ ───────────────────────────────────────────────────────────────
// Its console is a flat plate that leans back by about 35°: a display in the
// middle, three keys left of it, a two-part key START | STOP under it, and a
// block of keys on the right. UPCERA's photos of the furnace show the same
// plate, key for key. `onA7(x, y)` is a point on it, with the numbers of the
// model's file: x and y from the plate's middle, to the right and up along the
// plate. (The plate's group stands at [0, 0.98, 2.18] and is turned by
// atan(1.08 / 1.56); the keys' tops are 0.286 in front of it, the display 0.274.)
const A7_LEAN = Math.atan2(1.08, 1.56);
const onA7 = (x, y, out = 0.29) => [x, 0.98 + y * Math.cos(A7_LEAN) + out * Math.sin(A7_LEAN), 2.18 - y * Math.sin(A7_LEAN) + out * Math.cos(A7_LEAN)];
// Looked at from well above, like the Vario's: the display is glossy. What is
// framed is the keypad's plate, not the housing around it.
const A7_CONSOLE = { part: 'controlConsole', size: 0.34, from: [0, 58], show: 'keypadOverlayPlane' };
const A7 = {
  display: [...onA7(-0.1, 0.06, 0.276), 0.9],
  leftKeys: [...onA7(-1.19, 0.17), 0.82], // two arrows, and a cogwheel under the second
  startStop: [...onA7(0.345, -0.58), 0.56], // one key in two halves
  block: [...onA7(1.1, -0.05), 1.34], // 1 to 9, "+ 0 −", two arrows, Esc P Enter
  start: onA7(0.22, -0.58), // the dark half
  stop: onA7(0.47, -0.58), // the red half
};
// The firing platform: a stainless dish with a white ceramic table on it. The
// model is drawn with the lift down, as UPCERA's photos show the furnace: the
// table's top is at 2.57 and the dish's rim at 1.70. Both places on it share
// one view of the whole furnace, so that between two steps only the lift moves.
// (With the lift down the console hides the dish; the mark on it is for a step
// in which it shuts the chamber, and sits on its lower edge: seen from a little
// above, the chamber's underside hides the rim itself.)
const A7_TABLE_TOP = [0, 2.57, 0.4];
const A7_DISH = [0, 1.62, 1.29];
const A7_WHOLE = { part: 'firingPedestal', from: [24, 12], show: 'upcera-a7-plus' };

export const HOW_TO = {
  'bredent-thermopress-400': {
    source: {
      label: 'bredent’s instructions for use (2025)',
      url: 'https://bredent-group.com/wp-content/uploads/2025/07/Thermopress-400-Verarbeitungsanleitung_009830GB_20250314_web.pdf',
    },
    note: 'On the 3D model some keys are drawn differently from the real ones. The rings mark the right key by its place on the keypad.',
    places: {
      mainSwitch: { part: 'lowerChassisAssembly', at: [4.167, 1.02, -1.42], size: 0.5, from: [68, 14], show: 3 },
      // On the keypad. Every step there shares one view, so only the rings move.
      choose: { ...KEYS, at: [K.menuUp, K.menuDown, K.enter] },
      heatUp: { ...KEYS, at: [K.startHeating, K.buzzerOff] },
      heatingTime: { ...KEYS, at: [K.heatingTime1, K.heatingTime2, K.buzzerOff] },
      inject: { ...KEYS, at: K.startInjecting },
      eject: { ...KEYS, at: K.pistonForward },
      goOn: { ...KEYS, at: [K.heatingTime1, K.heatingTime2, K.ce] },
      finish: { ...KEYS, at: K.ce },
      change: { ...KEYS, at: [K.inputUp, K.inputDown, K.enter] },
      nextValue: { ...KEYS, at: [K.menuUp, K.menuDown] },
      // The lever on top, and the two heating chambers that it chooses between: one ring around both their mouths.
      chambers: { part: 'dualHeaterAndPlungerAssembly', at: [[-0.435, 3.142, 0.376, 0.4], [1.66, 1.98, 0.42, 0.95]], from: [52, 40], show: 3.6 },
      flask: { part: 'dentalFlaskAssembly', size: 0.9, from: [38, 42], show: 3.8 },
      screw1: { part: 'flaskPressCradleAssembly', at: SCREW_1, size: 0.45, from: [24, 14], show: 3.4 },
      screw2: { part: 'flaskPressCradleAssembly', at: SCREW_2, size: 0.45, from: [62, 16], show: 3.4 },
      release: { part: 'flaskPressCradleAssembly', at: [BRACKET, SCREW_1, SCREW_2], size: 0.45, from: [46, 32], show: 4.4 },
    },
    guides: [
      {
        id: 'run-a-program',
        title: 'Run a program',
        steps: [
          {
            title: 'Switch on',
            text: 'Set the main switch to On. It is on the right-hand end of the unit, towards the back. The bredent logo shows for about 7 seconds, then the menu.',
            at: 'mainSwitch',
          },
          {
            title: 'Pick the program',
            text: 'With the yellow keys, go to “Select program” and press Enter. Pick the program for your plastic the same way and press Enter again: the display shows its name and temperature.',
            at: 'choose',
          },
          {
            title: 'Heat up',
            text: 'Press Start heating, the first key of the top row. A buzzer sounds when the set temperature is reached; 260 °C takes about 10 minutes. Switch the buzzer off with its key.',
            at: 'heatUp',
          },
          {
            title: 'Put in the cartridge',
            text: 'Spread a pea-sized amount of thermopaste 400 on the cartridge’s wall, not near its lid. Slide it into the heating chamber that the lever is set to, 1 or 2: 1 mm deeper than flush, so that the plastic melts evenly.',
            at: 'chambers',
            open: true,
            without: ['dentalFlaskAssembly'],
          },
          {
            title: 'Start the heating time',
            text: 'Press Start heating time 1 or 2, for the chamber that holds the cartridge. The plastic melts for the time the program sets; then the buzzer sounds again. Switch it off.',
            at: 'heatingTime',
            open: true,
            without: ['dentalFlaskAssembly'],
          },
          {
            title: 'Put the flask in',
            text: 'Only now place the flask in the flask chamber, its injection opening towards the cartridge. Put in earlier, the metal flask would draw heat from the heating cylinder, and the plastic might not melt.',
            at: 'flask',
            open: true,
          },
          {
            title: 'Fix the flask',
            text: 'With clamping screw 1, at the front, press the flask lightly against the wall of the unit.',
            at: 'screw1',
            open: true,
          },
          {
            title: 'Clamp the flask',
            text: 'With clamping screw 2, at the right-hand end, clamp the flask against the heating cylinder. It must not push the cylinder out of place: that would block the injection.',
            at: 'screw2',
            open: true,
          },
          {
            title: 'Close the lid and inject',
            text: 'Close the protective lid: the unit injects only when it is closed. Then press Start injecting. The time runs down on the display.',
            at: 'inject',
          },
          {
            title: 'Open and release',
            text: 'After the injection, open the lid. Loosen both clamping screws and move the bracket up.',
            at: 'release',
            open: true,
          },
          {
            title: 'Eject the cartridge',
            text: 'Wait until the piston has moved all the way back. Then press Eject cartridge, the blue key with the arrow to the right.',
            at: 'eject',
            open: true,
          },
          {
            title: 'Take the flask out',
            text: 'The unit pushes the cartridge out of the heating cylinder; it need not be taken off the flask first. Then take the flask out of the flask chamber.',
            at: 'flask',
            open: true,
          },
          {
            title: 'Go on or finish',
            text: 'The unit keeps its temperature until a heating time is started again or CE ends the program.',
            at: 'goOn',
            open: true,
            without: ['dentalFlaskAssembly'],
          },
        ],
      },
      {
        id: 'set-a-program',
        title: 'Set a program',
        steps: [
          {
            title: 'Switch on',
            text: 'Set the main switch to On. It is on the right-hand end of the unit, towards the back. The bredent logo shows for about 7 seconds, then the menu.',
            at: 'mainSwitch',
          },
          {
            title: 'Open the program',
            text: 'With the yellow keys, go to “Create/change data” and press Enter. Pick the program’s number the same way and press Enter again: its first value appears, the set temperature.',
            at: 'choose',
          },
          {
            title: 'Change a value',
            text: 'Press Enter twice: the value starts to flash. Change it with the blue keys beside the yellow ones, then press Enter once. Without that Enter the unit does not keep the new value.',
            at: 'change',
          },
          {
            title: 'Go through the values',
            text: 'The yellow keys lead to the next value; change each the same way: set temperature, heating time, pressure time, speed, force and the program’s name. bredent advises only small changes to the values it has stored.',
            at: 'nextValue',
          },
          {
            title: 'Save',
            text: 'Press CE once: only this stores the entries for good. Press CE again to return to the start menu. Keep to this order of steps, or the values are not stored correctly.',
            at: 'finish',
          },
        ],
      },
      {
        id: 'eject-by-hand',
        title: 'Eject a cartridge by hand',
        steps: [
          {
            title: 'Go to manual mode',
            text: 'In the start menu, go to “Manual mode” with the yellow keys and press Enter. Use it only to eject a cartridge and for cleaning: it ignores a program’s settings, so nothing may be injected in it.',
            at: 'choose',
          },
          {
            title: 'Push the cartridge out',
            text: 'Press the blue key with the arrow to the right. It ejects a cartridge that was put in by mistake. After about 6 seconds the piston moves back.',
            at: 'eject',
          },
        ],
      },
    ],
    confirm:
      "(1) The guides retell the unit's operation manual as bredent reprints it in its 2025 instructions for use (the tables 'Selecting - starting a program' and 'Changing - creating a program', and 'Manual mode'). The manual that came with the lab's own unit was not read: is its software the same (the tables are for version 2.61 and later)? (2) The model's keypad is not the real one: it has the same fourteen keys in the same places, but it writes 'P1', 'P2', 'Temp' and 'Time' on the four start keys, 'Menu' and 'Cool' on the two blue input keys, and draws 'Start injecting' in blue where the real key is green. The rings go by the key's place, which was checked against bredent's numbered drawing and a product photo. (3) Which clamping screw is number 1 and which number 2 was read from that drawing and from what each does (1 presses towards the wall, 2 towards the heating cylinder): 1 in the front wall, 2 in the right-hand end. (4) The manual does not say when the lid is opened to put in the cartridge. The model's lid stands open from that step until the injection, because the heating chambers can be seen only then. (5) Left out: working with both heating chambers at once ('parallel mode'), the key 'Previous program', the error messages, cleaning.",
  },
  'zubler-vario-200': {
    source: {
      label: 'Zubler’s operating instructions for the VARIO 200',
      url: 'https://zublerusa.com/wp-content/uploads/2023/01/vario200-user-manua.pdf',
    },
    note: 'On the 3D model the lift table rises on its own: what carries it on the real furnace is not drawn. Its display shows one fixed picture.',
    places: {
      // On the console. Every step there shares one view, so only the rings move.
      menu: { ...VARIO_CONSOLE, at: V.display },
      choose: { ...VARIO_CONSOLE, at: [V.dialer, V.minus, V.plus, V.enter, V.esc] },
      change: { ...VARIO_CONSOLE, at: [V.dialer, V.minus, V.plus] },
      confirm: { ...VARIO_CONSOLE, at: V.enter },
      otherGroup: { ...VARIO_CONSOLE, at: [V.esc, V.soft1, V.soft2] },
      softKeys: { ...VARIO_CONSOLE, at: [V.soft1, V.soft2] },
      // The top of the firing table, for a step in which the lift is down; and
      // the lift table's collar, for a step in which it shuts the chamber (with
      // the lift down, the console hides the collar).
      table: { ...VARIO_WHOLE, at: VARIO_TABLE_TOP, size: 1.1 },
      lift: { ...VARIO_WHOLE, at: VARIO_COLLAR, size: 1.6 },
    },
    guides: [
      {
        id: 'run-a-program',
        title: 'Run a firing program',
        steps: [
          {
            title: 'Switch on',
            text: 'Have the firing tray ready and switch the furnace on. After a short self-test the lift lowers all the way. Put the firing tray on the lift table at once: the furnace must never be without it.',
            at: 'table',
            open: true,
          },
          {
            title: 'Find your way in the menu',
            text: 'The main menu appears. Choose an entry with the dialer or, step by step, with the two yellow keys under it, − and +. The green key confirms; the red key goes back.',
            at: 'choose',
            open: true,
          },
          {
            title: 'Open “Run Programs”',
            text: 'Choose “Run Programs” and confirm. The display lists a group of programs, the one used last highlighted. The furnace holds 500 programs: 25 groups, called brands, of 20 each.',
            at: 'menu',
            open: true,
          },
          {
            title: 'Change the group',
            text: 'For a program of another group, touch the red key. Pick the group with the yellow key that the display labels “Next”, with − and + or with the dialer, and confirm with the green key.',
            at: 'otherGroup',
            open: true,
          },
          {
            title: 'Start the program',
            text: 'Highlight the program with the dialer or − and +. The work stands on the firing tray. Touch the green key: the program starts. With preview mode on, the display first shows the program’s values.',
            at: 'confirm',
            open: true,
          },
          {
            title: 'Keep clear of the lift',
            text: 'If the program pre-dries, the lift first holds the work below the chamber, in its heat, then carries it in, in ten steps. Never reach between the lift table and the chamber, or under the table: it crushes and burns.',
            at: 'lift',
          },
          {
            title: 'Change a value on the way',
            text: 'While the program runs, the yellow key labelled “Edit Prog” opens its values: set one and confirm. That works once in a firing, only for what has not begun yet, and only for this firing.',
            at: 'softKeys',
          },
          {
            title: 'Close the lift afterwards',
            text: 'At the end the lift lowers: do not block it. Once the work is off, close the lift with the yellow key labelled “Up”, never by hand. Closed, the furnace keeps its idle temperature for 4 hours, then goes to stand-by.',
            at: 'softKeys',
          },
        ],
      },
      {
        id: 'write-a-program',
        title: 'Write or change a program',
        steps: [
          {
            title: 'Open the program',
            text: 'In the main menu choose “Edit Programs”, then “New/change program”, then the group and the program’s place in it. Confirm each choice with the green key.',
            at: 'choose',
          },
          {
            title: 'Give it a name',
            text: 'One letter or digit of the name is highlighted in grey: change it with − and + or the dialer. The yellow keys labelled “Left” and “Right” move to its neighbours. The green key ends the name.',
            at: 'softKeys',
          },
          {
            title: 'Choose the type',
            text: 'Pick the type of program and confirm. Zubler recommends “Professional” for all firings. “Special” has two holding times; “TTC Prof.” adds a controlled cooling, for ceramics on zirconia frameworks.',
            at: 'change',
          },
          {
            title: 'Set the values',
            text: 'Set each value with − and + or the dialer; the green key leads to the next. The yellow key “Back” returns to the line before, “Last Line” jumps to the end. Above 1075 °C the heating muffle wears out sooner.',
            at: 'change',
          },
          {
            title: 'Save',
            text: 'At the end the furnace asks whether to save the program. Choose “Yes” or “No” with the dialer or − and +, and confirm with the green key. Two programs cannot have the same name.',
            at: 'confirm',
          },
        ],
      },
      {
        id: 'through-the-day',
        title: 'Through the working day',
        steps: [
          {
            title: 'Warm up in the morning',
            text: 'Before the first firing of the day, always run the warm-up program: “Run warm-up program” in the main menu. It heats the chamber evenly.',
            at: 'menu',
          },
          {
            title: 'Keep it closed',
            text: 'Between firings, and whenever the furnace is not in use, keep the chamber closed, the lift up. That saves energy and keeps dirt and moisture out of the chamber.',
            at: 'lift',
          },
          {
            title: 'If it is left open',
            text: 'Left open after a firing, the furnace cools to 400 °C and waits 30 minutes. Then it goes to stand-by: it cools to 100 °C, closes the lift by itself and stays closed. A touch on a key brings it back.',
            at: 'table',
            open: true,
          },
          {
            title: 'Night mode in the evening',
            text: 'In the evening, choose “Start night mode” and touch the green key, instead of switching off: moisture and dirt stay out of the chamber. An open furnace first cools to its night temperature, then closes by itself.',
            at: 'confirm',
          },
        ],
      },
    ],
    confirm:
      "(1) The guides retell Zubler's operating instructions for the VARIO 200 as Zubler USA publishes them (sections 0.4 and 0.5, 1.0 to 1.2.1, 1.4, 1.5 and 2.5). They are in English for 120 V units and carry no date; the manual that came with the lab's own furnace was not read. Is it a VARIO 200 or a 200ZR, and is its software the same? (2) The instructions do not describe loading and unloading. The guide says only that the work stands on the firing tray, and 'once the work is off'. They call what stands on the lift table a 'firing tray' in one place and a 'firing brick' in another; the guide takes these as one thing. (3) Which keys are which was read from the legend of the instructions' drawing of the console (section 1.0): green confirms, red cancels, the two yellow keys beside them move the lift, the two yellow keys under the dialer are − and +. The display writes above the yellow keys beside the red one what they do in each menu ('Next', 'Left', 'Right', 'Back', 'Last Line', 'Edit Prog'), so the rings mark both of them. (4) The drawings of the main menu write 'Enter', 'Esc', 'Up' and 'Down' above the four keys under the display, and the legend calls the last two 'Lift movement Up / Down'; elsewhere the instructions call them the 'Open' and 'Close' keys. The guide takes 'Up' as the key that closes the lift. Is that what the lab's furnace shows once a program has ended? (5) The model is drawn with its lift down and has no part that carries the lift table; for a step in which the furnace is shut the tour moves the table up under the chamber (assets/registry.js). (6) Left out: copying, moving and erasing programs, brands, the USB transfer, the settings ('Setup Oven'), the purge program, the fuses and the vacuum pump's filter.",
  },

  'ivoclar-programat-p300': {
    source: {
      label: 'Ivoclar Vivadent’s operating instructions for the Programat P300 (2006)',
      url: 'https://www.prodonsa.com/ivoclarvivadent/pdf/P300-e-BA-0306.pdf',
    },
    note: 'On the 3D model some keys are drawn differently from the real ones. The rings mark the right key by its place on the keypad.',
    places: {
      mainSwitch: { part: 'baseAssembly', at: [0.88, 1.16, -2.646], size: 0.6, from: [168, 12], show: 3.2 },
      // On the keypad. Every step there shares one view, so only the rings move.
      pickProgram: { ...P300_KEYPAD, at: [P.display, P.plusMinus, P.numbers] },
      openKey: { ...P300_KEYPAD, at: P.openHead },
      closeKey: { ...P300_KEYPAD, at: P.closeHead },
      start: { ...P300_KEYPAD, at: P.start },
      stopStart: { ...P300_KEYPAD, at: [P.stop, P.start] },
      curve: { ...P300_KEYPAD, at: P.curve },
      enterValue: { ...P300_KEYPAD, at: [P.numbers, P.plusMinus, P.escape, P.enter] },
      stages: { ...P300_KEYPAD, at: [P.program, P.cursor, P.plusMinus] },
      // The keypad as a whole, on the furnace as a whole: close up, a ring around all of it would be larger than a ring may be.
      keypad: { part: 'controlConsole', at: [...onP300(0, 0.02), 1.5], from: [16, 16], show: 'ivoclar-programat-p300' },
      // Under the head: the firing plate in the middle of the base, with the sealing surface around it.
      plate: { part: 'firingPedestal', at: [0, 2.395, 0.18], size: 1.0, from: [18, 30], show: 4.2 },
      // The sealing surface: the dark ring around the firing plate, on which the head comes down (top at 2.125, 0.98 to 1.53 from the middle).
      rims: { part: 'firingPedestal', at: [[-0.9, 2.125, 1.08], [0.9, 2.125, 1.08]], size: 0.5, from: [18, 30], show: 4.2 },
      tray: { part: 'coolingTray', at: [1.9, 2.045, 0.9], size: 1.1, from: [40, 34], show: 'coolingTray' },
      head: { part: 'clamshellHead', size: 1.2, from: [30, 16], show: 'clamshellHead' },
      // Under the head, seen once it has tipped open: the heating muffle in the middle (its face at 2.05), the white
      // insulation around it. Looked at from low in front: the underside then faces the eye.
      insulation: { part: 'clamshellHead', at: [0, 2.05, 0.18], size: 1.0, from: [0, 6], show: 'clamshellHead' },
    },
    guides: [
      {
        id: 'run-a-program',
        title: 'Run a firing program',
        steps: [
          {
            title: 'Switch on',
            text: 'Set the On/Off switch at the back of the furnace to “I”. The furnace tests itself, and a bar on the display shows how far it is. Leave it alone until the stand-by view appears.',
            at: 'mainSwitch',
          },
          {
            title: 'Pick the program',
            text: 'The stand-by view shows the program’s number. Change it with − and +, or type it on the number keys. Programs 1 to 50 hold Ivoclar’s settings for its own ceramics: its table of programs says which to take.',
            at: 'pickProgram',
          },
          {
            title: 'Open the head',
            text: 'Press the upper of the two keys right of the display: the head tips open. A motor moves it. Never open it by hand: that damages the mechanism. It cannot be opened while a program runs.',
            at: 'openKey',
            open: true,
          },
          {
            title: 'Put the work in',
            text: 'Set the work, on its firing tray, on the firing plate. Use the firing tongs, never a hand: the chamber burns. Keep trays off the surface around the plate, or the head cannot close.',
            at: 'plate',
            open: true,
          },
          {
            title: 'Start',
            text: 'Press START. The head closes over the program’s closing time, and the display draws the firing curve with the time left, the temperature and the vacuum. Never reach under the head while the furnace works.',
            at: 'start',
          },
          {
            title: 'Pause or stop',
            text: 'STOP, pressed once, pauses the program: the green light in the START key blinks, and START goes on with it. STOP pressed a second time ends the program and lets air into the chamber.',
            at: 'stopStart',
          },
          {
            title: 'Take the work out',
            text: 'After the firing the head opens and a signal sounds; STOP silences it. The work can now come out and cool on the cooling tray.',
            at: 'tray',
            open: true,
          },
          {
            title: 'Close the head again',
            text: 'Close the head with the lower of the two keys. Ivoclar advises keeping it closed below 150 °C and while the furnace is switched off: an open chamber takes up moisture, which weakens the vacuum.',
            at: 'closeKey',
          },
        ],
      },
      {
        id: 'set-a-program',
        title: 'Set a program of your own',
        steps: [
          {
            title: 'Pick a free program',
            text: 'Choose a program by its number, as for a firing. The numbers go up to 100. Programs 1 to 50 come with Ivoclar’s settings, but any program can be changed: what is entered replaces them.',
            at: 'pickProgram',
          },
          {
            title: 'Choose a value',
            text: 'Under the display a firing curve is printed, with a key at each of its points. Press the key of the value to change. The display asks for it and shows the lowest and the highest value allowed.',
            at: 'curve',
          },
          {
            title: 'What the keys stand for',
            text: 'B is the stand-by temperature, S the time the head takes to close, t the heating per minute. T and H are the holding temperature and time, V1 and V2 where the vacuum starts and ends, L how far it cools slowly.',
            at: 'curve',
          },
          {
            title: 'Enter the value',
            text: 'Type the value on the number keys and confirm with ENTER. Or change it with − and +, which count at once. A value outside the range keeps blinking; ESC brings the old one back.',
            at: 'enterValue',
          },
          {
            title: 'One stage or two',
            text: 'The P key lists all values of the program. A symbol there shows one stage or two; with the cursor on it, − or + changes it. A two-stage program has a second page of values, and P switches between them.',
            at: 'stages',
          },
          {
            title: 'Start it',
            text: 'With the work in the furnace, press START. The furnace first checks whether the values fit together. If they contradict each other, the program stops and the display shows an error number.',
            at: 'start',
          },
        ],
      },
      {
        id: 'look-after-it',
        title: 'Check and clean it',
        steps: [
          {
            title: 'Only when it is cold',
            text: 'Clean the furnace only when it has cooled down. Use no cleaning liquids, and never compressed air: the insulation holds ceramic fibres, and their dust must not be blown about.',
            at: 'head',
          },
          {
            title: 'Every day',
            text: 'Brush the cooling tray and the insulation clean. Clean both sealing rims, on the head and on the base, with brush and soft cloth. Look at the quartz glass tube in the chamber: damaged, the furnace must not be used.',
            at: 'rims',
            open: true,
          },
          {
            title: 'Every week',
            text: 'Wipe the keypad with a soft, dry cloth and look for damage. Check that all plugs sit firmly, that the thermocouple in the chamber is straight, and that both sealing rims are clean and whole.',
            at: 'keypad',
          },
          {
            title: 'Every month, twice a year',
            text: 'Each month, see that the head opens smoothly and quietly, and look at the insulation: fine cracks do no harm, worn insulation is for Ivoclar’s service. Twice a year, test the temperature with Ivoclar’s checking set.',
            at: 'insulation',
            open: true,
          },
        ],
      },
    ],
    confirm:
      "(1) The guides retell Ivoclar Vivadent's operating instructions for the Programat P300 of 2006 (chapters 2, 5, 6 and 7), the first P300; a dealer hosts the file. The later P300/G2 differs. Which one does the lab have, and what does its own manual say? (2) The model's keypad is not the real one. The real keypad was compared on a photo of a P300 and on a photo of its membrane: display top left, right of it the two keys for the head (upper: open, lower: close), STOP above START, a bottom row of cursor keys, P, − and +, the firing curve with eight keys (V2, V1, B, S, t, T, L, H) and a block of number keys whose rows read 1 2 3, 4 5 6, 7 8 9, ESC 0 ENTER. The model draws five letters on the curve (B, t, T, H, C), turns the number block upside down (7 8 9 at the top, '. 0 C' at the bottom), adds three keys left of the display that the furnace does not have, and leaves out the key with the cogwheels beside the display. The rings go by a key's place. That the upper of the two head keys opens was read from its symbol on those photos, not from the instructions. (3) What the instructions say about the signal at the end of a firing is a table whose columns were read with difficulty: the guide keeps to what is certain in it (the head is open, a signal sounds, STOP silences it, the work can be taken out and cooled on the cooling tray). (4) The instructions name two intervals for checking the temperature: twice a year, with the temperature checking set, in the table of chapter 7.1; at least once a year, with the silver test, under 'Calibration'. The guide follows the table, which is what that step retells. (5) The model has no function that opens its head; the tour tips the head back on its hinge by as much as the model's own exploded view does (assets/registry.js). (6) Left out: the settings and test programs behind the key with the cogwheels (calibration, vacuum test, cleaning and dehumidification programs), error messages, quick opening of the head, write protection.",
  },

  'upcera-a7-plus': {
    source: {
      label: 'the dealer Oralkart’s directions for use for the A7+',
      url: 'https://oralkart.com/products/upcera-a7-porcelain-furnace',
    },
    basic: 'A basic one: UPCERA’s own instructions for use could not be had, so it also leans on UPCERA’s product sheet and on how furnaces with a lift are worked, and it names no settings.',
    note: 'On the 3D model the platform rises on its own: what carries it on the real furnace is not drawn. Its display shows one fixed picture.',
    places: {
      // At the back, low down, as the model has it (see `confirm`).
      mainSwitch: { part: 'liftColumn', at: [-1.12, 0.38, -2.37], size: 0.5, from: [192, 12], show: 4.5 },
      // On the console. Every step there shares one view, so only the rings move.
      console: { ...A7_CONSOLE, at: [A7.display, A7.leftKeys, A7.startStop, A7.block] },
      display: { ...A7_CONSOLE, at: A7.display },
      start: { ...A7_CONSOLE, at: A7.start },
      stop: { ...A7_CONSOLE, at: A7.stop },
      // The top of the firing platform, for a step in which the lift is down;
      // and its dish, for a step in which it shuts the chamber.
      platform: { ...A7_WHOLE, at: A7_TABLE_TOP, size: 1.2 },
      lift: { ...A7_WHOLE, at: A7_DISH, size: 1.6 },
      // The chamber's front, in the same view.
      chamber: { part: 'chamberHead', at: [0, 5.98, 1.47], size: 1.6, from: [24, 12], show: 'upcera-a7-plus' },
      // The two metal trays that stand out at the sides, seen from as high up
      // as the console is (lower down, its display mirrors the room's light).
      trays: { part: 'baseAssembly', at: [[-2.08, 1.285, 0.05], [2.08, 1.285, 0.05]], size: 0.9, from: [0, 58], show: 'upcera-a7-plus' },
    },
    guides: [
      {
        id: 'run-a-program',
        title: 'Run a firing program',
        steps: [
          {
            title: 'Switch on',
            text: 'Switch the furnace on at its mains switch. The 3D model has it at the back, at the bottom: that is where to look on the lab’s furnace.',
            at: 'mainSwitch',
            open: true,
          },
          {
            title: 'Know the console',
            text: 'In the middle is the display. Left of it are two arrow keys and a key with a cogwheel, under it the two-part key START | STOP. On the right: the number keys, + and −, two more arrows, Esc, P and Enter.',
            at: 'console',
            open: true,
          },
          {
            title: 'Choose the program',
            text: 'Choose the program for the ceramic and the kind of firing: its values come from the ceramic maker’s firing chart. Top left, the display names it: P01 on UPCERA’s photos. Let the technician show you the keys for it.',
            at: 'display',
            open: true,
          },
          {
            title: 'Load the platform',
            text: 'The platform must be down. Stand the work on its firing tray and set the tray on the middle of the white ceramic table. The furnace moves the platform itself: UPCERA calls that an automatic platform lift.',
            at: 'platform',
            open: true,
          },
          {
            title: 'Start the program',
            text: 'Press START, the dark half of the two-part key under the display. From here the furnace follows the program.',
            at: 'start',
            open: true,
          },
          {
            title: 'Keep clear of the lift',
            text: 'The platform rises and shuts the chamber from below. Never reach between the platform and the chamber, or under the platform. The chamber gets very hot: the yellow sign on its front warns of it.',
            at: 'lift',
          },
          {
            title: 'While it fires',
            text: 'The furnace heats and holds as the program says, under vacuum if the program asks for it. It warns of errors by itself. STOP, the red half of the two-part key, breaks a firing off.',
            at: 'stop',
          },
          {
            title: 'Unload',
            text: 'When the firing is over and the platform is down again, everything on it is very hot. Lift the firing tray off with furnace tongs, never by hand. Set it on one of the metal trays at the sides and let the work cool.',
            at: 'trays',
            open: true,
          },
        ],
      },
      {
        id: 'look-after-it',
        title: 'Look after it',
        steps: [
          {
            title: 'Keep it closed',
            text: 'A porcelain furnace is kept closed while not in use: Zubler and Ivoclar both ask that of theirs, to keep moisture and dirt out of the chamber. Do the same with the A7+, platform up, unless its manual says otherwise.',
            at: 'lift',
          },
          {
            title: 'Its maintenance procedures',
            text: 'UPCERA lists maintenance procedures built into the furnace: vacuum testing, cleaning and drying. It has a temperature compensation as well. When and how to use them is in the furnace’s manual: ask the technician.',
            at: 'chamber',
          },
          {
            title: 'If it warns of an error',
            text: 'UPCERA builds an error warning into the furnace. If one comes up, do not carry on firing: note what the display says and call the technician. What each warning means is in the furnace’s manual.',
            at: 'display',
          },
        ],
      },
    ],
    confirm:
      "(1) A BASIC GUIDE, at the lab's wish: the lab has no manual for its A7+, and UPCERA publishes none (its download centre lists nothing under 'Equipment Manual'; the one download on the product page, A7+-2025.pdf, is a product sheet of two pages). The steps follow the dealer Oralkart's 'Direction to use', UPCERA's product page and product sheet (the list of features, the photos of the console) and the usual way a furnace with a lift is worked. No step was checked against the furnace or its manual: the lab's technician should read the guides through. (2) Keys are named by what UPCERA's photos show printed on them. What a key does is said of START and STOP alone, by their names. Not known: how a program is called up (the key P and the number keys?), what the two arrow keys and the cogwheel key left of the display do, whether a key moves the lift, what an error warning looks like. (3) Taken from the furnace's build, not from a source: that the mains switch is at the back (the model has it there; no photo of the back was found), that the two metal trays at the sides are for the fired work to cool on, and that the platform comes down again after a firing without a key. (4) 'Keep it closed' is what Zubler and Ivoclar ask for their furnaces; what UPCERA asks for the A7+ is not known. Nor is how the A7+ is shut down in the evening (the dealer says only 'following the recommended shutdown procedure'): the guides leave that out. (5) The guides name none of UPCERA's figures: its web page and its product sheet of 2025 disagree (see the A7+ in knowledge.js).",
  },
};
