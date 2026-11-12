// Things arriving on screen: the lab when the tour opens, and a machine's
// detailed model when it has loaded.
//
// Nothing in the 3D scene is animated to make that happen. The lab's materials
// are shared (every wall is one mesh; the furniture of all six rooms is painted
// from the same handful of materials), so fading one thing would fade many, and
// a half see-through bench shows its inside. Instead the stage hands out STILLS
// (stage.snapshot): the lab with only its floor, then with its walls, and so
// on. Each still is laid over the live picture as an ordinary page element and
// the browser fades one into the next:
//
//   · every piece stays solid while it fades, and its shadow fades with it;
//   · the whole opening costs a handful of drawn frames, not one per screen
//     refresh, and the tour is as still afterwards as it was before;
//   · the browser fades page elements without the page's script, so the fades
//     keep running while the machine models are being built.
//
// A still is only true for the view it was taken from. The moment the view
// changes (the visitor taps a room, the window changes size) every still is
// dropped and the live picture is simply there. The visitor can use the tour
// from the first frame: stills let every tap through.
//
// The names over the rooms and the interface around the lab come in after it.
// Those are page elements already; the stylesheet brings them in, keyed on
// html[data-intro] (see "Arriving" in tour.css).

/** The opening: what comes in when, in milliseconds after the first picture. */
export const ENTRANCE = {
  /** The lab, part by part: [name, starts fading in, is fully there]. */
  lab: [
    ['floor', 150, 500],
    ['walls', 350, 950],
    ['glazing', 650, 1150],
    ['furniture', 750, 1350],
    ['machines', 1100, 1750],
  ],
  /** The names over the rooms (or a room's machine markers), one after the other. */
  labels: 1550,
  /** Panel, navigation bar, zoom buttons, legend. */
  interface: 1700,
  end: 2200,
};

/**
 * The opening of a link that leads straight to one machine. The lab behind a
 * machine is faded to a tenth anyway; building it up part by part would not
 * read. Everything comes up as one.
 */
export const ENTRANCE_SHORT = { lab: [['all', 100, 600]], labels: 450, interface: 450, end: 950 };

/** How long a model takes to replace the plain volume that stood in for it. */
const SWAP = 260;
/** Gentle at the end, never sudden at the start (ease-out, cubic). */
const EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
/** A still of a larger picture than this takes 24 MB or more; the opening then does without stills. */
const MAX_STILL_PIXELS = 6e6;

function sameView(a, b) {
  return a.length === b.length && a.every((value, index) => (typeof value === 'number' ? Math.abs(value - b[index]) <= 1e-4 * Math.max(1, Math.abs(value)) : value === b[index]));
}

/**
 * @param {object} options
 * @param {object} options.stage           the stage (core/stage.js)
 * @param {() => Array} options.getView    everything the picture depends on besides the scene: camera, picture size, …
 * @param {() => boolean} [options.isBusy] is the picture moving anyway (camera on its way, surroundings fading)?
 * @param {MediaQueryList} [options.reducedMotion]  when it matches, nothing here animates: things are simply there
 */
export function createMotion({ stage, getView, isBusy = () => false, reducedMotion = null, root = document.documentElement }) {
  const canvas = stage.renderer.domElement;
  // Over the lab's picture, under the labels (see "Stacking" in tour.css).
  const layer = document.createElement('div');
  layer.className = 'reveal';
  layer.setAttribute('aria-hidden', 'true');
  canvas.after(layer);

  /** The stills lying over the live picture, lowest first: { element, name, fade }. */
  const stills = [];
  /** The view they were taken from. */
  let view = null;
  /** The opening, while it runs: { last, uncoversAt, clock, timer, held, end }. */
  let intro = null;
  const afterIntro = [];
  /** Changes to the scene that wait for their moment. */
  let waiting = [];
  let dissolving = false;

  /** No still was to be had, or something in here failed (see giveUp): nothing animates for the rest of the visit. */
  let off = false;

  const canAnimate = () => !off && !reducedMotion?.matches && !document.hidden && typeof layer.animate === 'function';

  /**
   * Nothing in this file is needed to use the tour. Should any of it fail, the
   * tour does without for the rest of the visit: every still goes, and whatever
   * was waiting for its moment is simply there.
   */
  function giveUp(error) {
    off = true;
    console.warn('Lab tour: things will appear without fading in.', error);
    cancel();
  }

  /**
   * A still is opaque: behind the lab it carries the slice of the page's
   * background that lies behind the stage, so whatever is under it stays
   * hidden until it fades. Tell the stylesheet where that slice is.
   */
  function placeBackground() {
    const here = layer.getBoundingClientRect();
    const page = root.getBoundingClientRect();
    layer.style.setProperty('--reveal-y', `${(page.top - here.top).toFixed(2)}px`);
    layer.style.setProperty('--reveal-h', `${page.height.toFixed(2)}px`);
  }

  /** Lay a still on top of those already there. `picture` is a canvas, or null for "nothing yet". */
  function lay(picture, name) {
    const element = document.createElement('div');
    element.className = 'reveal__still';
    element.dataset.still = name;
    if (picture) element.append(picture);
    layer.append(element);
    const entry = { element, name, fade: null };
    stills.push(entry);
    return entry;
  }

  function remove(entry) {
    const at = stills.indexOf(entry);
    if (at < 0) return;
    stills.splice(at, 1);
    entry.fade?.cancel();
    const picture = entry.element.querySelector('canvas');
    if (picture) picture.width = picture.height = 0; // hand the memory back now, not whenever the browser tidies up
    entry.element.remove();
  }

  function fadeOut(entry, { delay = 0, duration }) {
    entry.fade = entry.element.animate([{ opacity: 1 }, { opacity: 0 }], { delay, duration, easing: EASE, fill: 'forwards' });
    entry.fade.finished.then(
      () => remove(entry),
      () => {}, // dropped before it had finished
    );
    return entry.fade;
  }

  // ── The opening ────────────────────────────────────────────────────────────
  /**
   * Bring the lab up part by part.
   *   plan     ENTRANCE or ENTRANCE_SHORT
   *   groups   { floor: Object3D[], walls: […], … }: what each part of plan.lab shows
   *   hold     for checks: set everything up, then stand still at the very start
   *            until `release()`
   * Returns false, with the lab as it was, when there is to be no animation:
   * reduced motion, a tab in the background, no stills to be had (see
   * stage.snapshot), or something went wrong. It never throws: the tour is
   * being started when this runs, and an opening is not worth a tour.
   */
  function playIntro(plan, groups, { hold = false } = {}) {
    if (intro || !canAnimate()) return false;
    try {
      return startIntro(plan, groups, hold);
    } catch (error) {
      giveUp(error);
      return false;
    }
  }

  function startIntro(plan, groups, hold) {
    let steps = plan.lab.map(([name, from, to]) => ({ name, from, to, show: groups[name] ?? [] }));
    if (canvas.width * canvas.height > MAX_STILL_PIXELS) steps = [{ name: 'all', from: steps[0].from, to: steps[0].from + 500, show: [] }];

    // pictures[k] is the lab before step k comes in: nothing at all, then with
    // the floor, then with the floor and the walls, … The last step needs no
    // picture: what it brings in is the live picture itself.
    const parts = steps.flatMap((step) => step.show);
    const shown = new Map(parts.map((object) => [object, object.visible]));
    const pictures = [null];
    try {
      for (const object of parts) object.visible = false;
      for (const step of steps.slice(0, -1)) {
        for (const object of step.show) object.visible = shown.get(object);
        stage.shadowsDirty();
        const picture = stage.snapshot();
        pictures.push(picture);
        if (!picture) break; // no still to be had: there will be no more
      }
    } finally {
      // Whatever happened, the lab is whole again before anybody sees it.
      for (const [object, was] of shown) object.visible = was;
      stage.shadowsDirty();
    }
    if (pictures.some((picture, index) => index > 0 && !picture)) {
      for (const picture of pictures) if (picture) picture.width = picture.height = 0;
      off = true; // no stills to be had: none are asked for again on this visit
      return false;
    }

    // The oldest picture goes on top. As each fades it uncovers the next, and
    // the last one uncovers the lab itself.
    placeBackground();
    view = getView();
    for (let k = steps.length - 1; k >= 0; k--) {
      const entry = lay(pictures[k], k === 0 ? 'nothing' : steps[k - 1].name);
      fadeOut(entry, { delay: steps[k].from, duration: steps[k].to - steps[k].from });
    }

    intro = {
      last: stills[0],
      uncoversAt: steps[steps.length - 1].from,
      // A clock that keeps the browser's own time, as the fades do: all of them
      // start with the first frame the browser manages to show.
      clock: layer.animate([{ opacity: 1 }, { opacity: 1 }], { duration: plan.end }),
      timer: 0,
      held: hold,
      end: plan.end,
    };
    intro.clock.finished.then(endIntro, () => {});
    // The lab is all there once the last still has gone, a little before the
    // opening as a whole is over: models that got ready meanwhile come in now.
    intro.last.fade.finished.then(
      () => waiting.length && !dissolving && dissolve(),
      () => {},
    );
    root.style.setProperty('--intro-labels', `${plan.labels}ms`);
    root.style.setProperty('--intro-interface', `${plan.interface}ms`);
    root.dataset.intro = 'playing';
    if (hold) {
      root.dataset.introHold = '';
      intro.clock.pause();
      for (const entry of stills) entry.fade.pause();
    } else {
      // Should the browser's clock never get there (it should), end it anyway.
      intro.timer = setTimeout(endIntro, plan.end + 3000);
    }
    return true;
  }

  function endIntro() {
    if (!intro) return;
    const ended = intro;
    intro = null;
    clearTimeout(ended.timer);
    ended.clock.cancel();
    for (const entry of [...stills]) remove(entry);
    delete root.dataset.introHold;
    root.dataset.intro = 'done';
    if (waiting.length && !dissolving) dissolve();
    for (const callback of afterIntro.splice(0)) callback();
  }

  /** Is the opening's last still (the one right over the live picture) still there? */
  const uncovering = () => Boolean(intro) && stills.includes(intro.last);

  /** Is the live picture still wholly hidden under it? */
  function covered() {
    if (!uncovering()) return false;
    const time = intro.last.fade.currentTime;
    return time !== null && time < intro.uncoversAt;
  }

  // ── Something in the lab changes: a model takes its place ──────────────────
  /**
   * Run `apply` (which changes the scene) so that the change fades in instead
   * of popping. Resolves when `apply` has run. That is at once, except while
   * the opening is fading the machines in: a model that gets ready in those
   * moments waits until the lab is all there. (Before that the lab is still
   * covered and the model simply takes its place unseen.) Changes that come
   * close together share one fade.
   */
  function change(apply) {
    return new Promise((resolve, reject) => {
      const run = () => {
        try {
          apply();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      if (!canAnimate() || isBusy()) return run();
      if (covered()) return run(); // nobody can see it happen
      waiting.push(run);
      if (!uncovering() && !dissolving) dissolve();
    });
  }

  /** A still of the picture as it is, the waiting changes under it, and the still fades away. */
  function dissolve() {
    const runs = waiting;
    waiting = [];
    let picture = null;
    try {
      if (canAnimate() && !isBusy()) {
        picture = stage.snapshot();
        if (!picture) off = true; // none to be had: none are asked for again on this visit
      }
    } catch (error) {
      giveUp(error);
    }
    if (!picture) {
      for (const run of runs) run();
      return;
    }
    placeBackground();
    view = getView();
    const entry = lay(picture, 'before');
    for (const run of runs) run();
    dissolving = true;
    const next = () => {
      dissolving = false;
      if (waiting.length) dissolve();
    };
    fadeOut(entry, { duration: SWAP }).finished.then(next, next);
  }

  /** The view is changing (or about to): no still is true any more. Everything is simply there. */
  function cancel() {
    const runs = waiting;
    waiting = [];
    for (const run of runs) run();
    if (intro) endIntro();
    for (const entry of [...stills]) remove(entry);
  }

  // Whatever moved the camera or resized the picture: a frame drawn from
  // another view than the stills' ends them.
  stage.onAfterRender(() => {
    if (stills.length && view && !sameView(view, getView())) cancel();
  });

  /** For checks: the opening's own animations, the stylesheet's included. */
  const introAnimations = () => [
    ...(intro ? [intro.clock] : []),
    ...stills.map((entry) => entry.fade).filter(Boolean),
    ...document.getAnimations().filter((animation) => String(animation.animationName ?? '').startsWith('intro-')),
  ];

  return {
    playIntro,
    change,
    cancel,
    /** Call `callback` when the opening is over; at once if none is running. */
    whenIntroDone(callback) {
      if (intro) afterIntro.push(callback);
      else callback();
    },
    /** Is anything arriving right now? */
    get busy() {
      return Boolean(intro) || stills.length > 0;
    },
    /** For checks: where things stand. `stills` lists what each still shows, top first. */
    get state() {
      return { intro: intro ? (intro.held ? 'held' : 'playing') : 'none', stills: stills.map((entry) => entry.name).reverse(), waiting: waiting.length, end: intro?.end ?? 0 };
    },
    /** For checks, with a held opening: put it at `ms` after its start. */
    seek(ms) {
      for (const animation of introAnimations()) animation.currentTime = ms;
    },
    /** For checks: let a held opening run on from where it stands. */
    release() {
      if (!intro?.held) return;
      intro.held = false;
      delete root.dataset.introHold;
      intro.timer = setTimeout(endIntro, intro.end + 3000);
      // play() would run an animation that seek() has put past its end all over again.
      const resume = (animation) => {
        if ((animation.currentTime ?? 0) >= animation.effect.getComputedTiming().endTime) animation.finish();
        else animation.play();
      };
      resume(intro.clock);
      for (const entry of [...stills]) if (entry.fade) resume(entry.fade);
    },
  };
}
