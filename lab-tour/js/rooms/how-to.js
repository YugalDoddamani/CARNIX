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
//   · `confirm` is a note to ourselves, as in knowledge.js: never shown, listed
//     by `npm run check`, and as public as the page itself.
//
// A machine gets its guides by an entry here under the id it has in
// catalogue.js. Its panel then shows a card "How to use it" on the first pill.
//
//   source   { label, url }: "A short guide from <label>."
//   note     optional: one sentence about the 3D model that the reader of a
//            guide should know, printed after the source
//   places   where on the machine a step can point (see below)
//   guides   [{ id, title, steps: [{ title, text, at?, open?, without? }] }]
//            id        the guide's name in the address: lower case and hyphens
//            at        the name of a place: the model turns to it and marks it
//            open      true: the machine's lid or cover stands open in this step
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
//          marks) or the name of another part (that part, whole)
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
};
