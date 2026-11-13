// The information panel: a card beside the lab on wide screens, a sheet under it
// on phones. It is a plain function of "where the visitor is" (overview, a room,
// a machine), drawn afresh on every navigation.
//
// A machine's panel has up to four pills: its own name (what it is), About (who
// makes it), Features (its key figures) and Capabilities (what sets it apart).
// A pill only appears when knowledge.js has something to put under it.
//
// A machine with guides (rooms/how-to.js) has a card "How to use it" on its
// first pill. It leads to two more pages of the same machine: the list of its
// guides, and a guide, step by step.
import { ICONS, UI } from './icons.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const sizeText = ({ w, d, h }) => `${w} × ${d} × ${h} mm`;
const icon = (name) => ICONS[name] ?? ICONS.machine;
/** A product name, escaped, with hyphens that will not break across lines ("DS-EX Pro"). */
const name = (value) => esc(value).replace(/-/g, '\u2011');
// A figure longer than this gets a full-width card instead of half a row.
const WIDE_VALUE = 13;
// Beside the lab a guide lists all its steps and unfolds the open one; under
// the lab, on a phone, it shows one step at a time (tour.css, section 9).
const LISTS_ALL_STEPS = window.matchMedia('(min-width: 900px)');

// ── Overview ─────────────────────────────────────────────────────────────────

function overviewView({ guide, route, itemsByRoom }) {
  return `
    <header class="panel__header">
      <p class="eyebrow">${esc(guide.eyebrow)}</p>
      <h1>${esc(guide.title)}</h1>
      <p class="lead">${esc(guide.lead)}</p>
    </header>
    <div class="actions">
      <button type="button" class="button button--primary" data-start>${esc(guide.start)}${UI.arrow}</button>
      <button type="button" class="button" data-guide>How it works</button>
    </div>
    <section class="route-list" aria-label="The rooms, in tour order">
      <h2 class="section-title">The route <span class="count">${plural(route.length, 'room')}</span></h2>
      <ol class="list">
        ${route
          .map(
            (room, index) => `
          <li>
            <button type="button" class="row" data-go-room="${esc(room.id)}">
              <span class="row__icon">${icon(room.icon)}</span>
              <span class="row__text"><strong>${esc(room.name)}</strong><small>${esc(room.subtitle)} · ${plural((itemsByRoom.get(room.id) ?? []).length, 'machine')}</small></span>
              <span class="row__step" aria-hidden="true">${index + 1}</span>
            </button>
          </li>`,
          )
          .join('')}
      </ol>
    </section>`;
}

// ── A room ───────────────────────────────────────────────────────────────────

function roomView({ room, about, items, stop }) {
  const previous = stop.previous
    ? `<button type="button" class="button button--quiet" data-go-room="${esc(stop.previous.id)}" aria-label="Previous stop: ${esc(stop.previous.name)}">${UI.back}<span>${esc(stop.previous.tab ?? stop.previous.name)}</span></button>`
    : '<span></span>';
  const next = stop.next
    ? `<button type="button" class="button button--primary" data-go-room="${esc(stop.next.id)}"><span>Next: ${esc(stop.next.tab ?? stop.next.name)}</span>${UI.arrow}</button>`
    : `<button type="button" class="button button--primary" data-go-lab><span>Finish the tour</span>${UI.arrow}</button>`;
  return `
    <header class="panel__header panel__header--tile">
      <span class="tile" aria-hidden="true">${icon(room.icon)}</span>
      <div>
        <p class="eyebrow">Stop ${stop.index + 1} of ${stop.total} · ${esc(room.subtitle)}</p>
        <h1>${esc(room.name)}</h1>
      </div>
    </header>
    ${about ? `<p class="lead">${esc(about)}</p>` : ''}
    <section aria-label="Machines in this room">
      <h2 class="section-title">${items.length ? 'Tap a machine' : 'No machines here yet'} ${items.length ? `<span class="count">${items.length}</span>` : ''}</h2>
      <ol class="list">
        ${items
          .map(
            (item, index) => `
          <li>
            <button type="button" class="row" data-go-item="${esc(item.id)}">
              <span class="row__number row__number--${item.status}" aria-hidden="true">${index + 1}</span>
              <span class="row__text"><strong>${name(item.name)}</strong><small>${esc(item.kind)}</small></span>
              ${item.status === 'planned' ? `<span class="chip chip--planned">${item.known ? 'Model coming' : 'Planned'}</span>` : ''}
              <span class="row__chevron" aria-hidden="true">${UI.chevron}</span>
            </button>
          </li>`,
          )
          .join('')}
      </ol>
    </section>
    <nav class="route-nav" aria-label="Tour route">${previous}${next}</nav>`;
}

// ── A machine ────────────────────────────────────────────────────────────────

function overviewTab({ item, room, info, modelState, howTo }) {
  const built = item.status === 'built';
  let model = '';
  if (item.known) {
    model = `<p class="note">Its 3D model is not in the tour yet. Until it is, the blue shape stands in for it, at the machine's real size.</p>`;
  } else if (!built) {
    model = `<p class="note">Not modelled yet. The blue shape marks where this machine stands and roughly how big it is; its maker, figures and the 3D model follow.</p>`;
  } else if (modelState === 'failed') {
    model = `<p class="note note--error">The 3D model could not be loaded. Reload the page to try again.</p>`;
  } else if (modelState !== 'ready') {
    model = `<p class="note">Loading the 3D model…</p>`;
  } else if (item.canExplode) {
    model = `
      <label class="slider">
        <span class="slider__label"><span>Take it apart</span><output data-explode-value>0%</output></span>
        <input type="range" min="0" max="100" value="0" step="1" data-explode aria-label="Take the machine apart: 0 is assembled, 100 is fully apart">
        <span class="slider__ends" aria-hidden="true"><span>Assembled</span><span>Apart</span></span>
      </label>`;
  }
  return `
    ${howToCard(howTo)}
    ${info?.summary ? `<p class="lead">${esc(info.summary)}</p>` : ''}
    ${info?.how ? `<p class="body">${esc(info.how)}</p>` : ''}
    ${model}
    <dl class="facts">
      <div><dt>Where</dt><dd>${esc(room.name)}</dd></div>
      <div><dt>${built ? 'Size of the model' : item.known ? 'Size' : 'Rough size'}</dt><dd>${sizeText(item.sizeMm)}</dd></div>
    </dl>`;
}

function aboutTab({ brand }) {
  const facts = [brand.place, brand.since ? `since ${brand.since}` : null].filter(Boolean).join(' · ');
  return `
    <div class="brand-card">
      <p class="brand-card__label">Made by</p>
      <p class="brand-card__name">${esc(brand.name)}</p>
      ${facts ? `<p class="brand-card__facts">${UI.pin}<span>${esc(facts)}</span></p>` : ''}
    </div>
    <p class="body">${esc(brand.about)}</p>
    ${sourcesLine(brand.sources)}`;
}

function featuresTab({ info }) {
  // Cards sit two to a row; the first figure and any long one take a whole row.
  // If that leaves an odd card out, the last one takes a whole row as well, so
  // that no row is left with a hole in it.
  const wide = info.features.map((feature, index) => index === 0 || feature.value.length > WIDE_VALUE);
  if (wide.filter((whole) => !whole).length % 2) wide[wide.lastIndexOf(false)] = true;
  return `
    <dl class="specs">
      ${info.features
        .map(
          (feature, index) => `
        <div class="spec${index === 0 ? ' spec--lead' : wide[index] ? ' spec--wide' : ''}" style="--i:${index}">
          <dt>${esc(feature.label)}${feature.note ? ` <small>${esc(feature.note)}</small>` : ''}</dt>
          <dd>${esc(feature.value)}</dd>
        </div>`,
        )
        .join('')}
    </dl>
    ${info.featuresNote ? `<p class="footnote">${esc(info.featuresNote)}</p>` : ''}
    ${sourcesLine(info.sources)}`;
}

function capabilitiesTab({ info }) {
  return `
    <ul class="points">
      ${info.capabilities.map((point, index) => `<li style="--i:${index}"><span class="points__mark" aria-hidden="true">${UI.check}</span><span>${esc(point)}</span></li>`).join('')}
    </ul>`;
}

function sourcesLine(sources) {
  if (!sources?.length) return '';
  const links = sources.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}${UI.external}</a>`).join('');
  return `<p class="sources"><span>Source${sources.length > 1 ? 's' : ''}</span>${links}</p>`;
}

/** The pills a machine gets, in order; the first is always the machine itself. */
function tabsFor({ item, info, brand }) {
  const tabs = [{ id: 'overview', label: item.shortName, render: overviewTab }];
  if (brand) tabs.push({ id: 'about', label: 'About', render: aboutTab });
  if (info?.features?.length) tabs.push({ id: 'features', label: 'Features', render: featuresTab });
  if (info?.capabilities?.length) tabs.push({ id: 'capabilities', label: 'Capabilities', render: capabilitiesTab });
  return tabs;
}

function itemView(view, activeTab) {
  const { item, room, siblings } = view;
  const tabs = tabsFor(view);
  const active = tabs.some((tab) => tab.id === activeTab) ? activeTab : 'overview';
  const stepper =
    siblings.total > 1
      ? `<div class="stepper" role="group" aria-label="Machines in this room">
          <button type="button" data-go-item="${esc(siblings.previous.id)}" aria-label="Previous machine: ${esc(siblings.previous.name)}">${UI.back}</button>
          <span aria-label="Machine ${siblings.index + 1} of ${siblings.total}">${siblings.index + 1} / ${siblings.total}</span>
          <button type="button" data-go-item="${esc(siblings.next.id)}" aria-label="Next machine: ${esc(siblings.next.name)}">${UI.chevron}</button>
        </div>`
      : '';
  return `
    <div class="panel__top">
      <button type="button" class="back" data-go-back>${UI.back}<span>${esc(room.shortName ?? room.name)}</span></button>
      ${stepper}
    </div>
    <header class="panel__header panel__header--tile">
      <span class="tile" aria-hidden="true">${icon(item.icon)}</span>
      <div>
        <p class="eyebrow">${esc(item.kind)}</p>
        <h1>${name(item.name)}</h1>
      </div>
    </header>
    ${
      tabs.length > 1
        ? `<div class="tabs" role="tablist" aria-label="About this machine">
            <span class="tabs__thumb" aria-hidden="true"></span>
            ${tabs.map((tab) => `<button type="button" role="tab" id="tab-${tab.id}" data-tab="${tab.id}" aria-controls="tabpanel-${tab.id}" aria-selected="${tab.id === active}" tabindex="${tab.id === active ? 0 : -1}">${name(tab.label)}</button>`).join('')}
          </div>`
        : ''
    }
    ${tabs.map((tab) => `<section class="tabpanel" role="tabpanel" id="tabpanel-${tab.id}" data-panel="${tab.id}" ${tabs.length > 1 ? `aria-labelledby="tab-${tab.id}"` : ''} ${tab.id === active ? '' : 'hidden'}>${tab.render(view)}</section>`).join('')}`;
}

// ── A machine's guides: "How to use it" ──────────────────────────────────────

/** The way in: a card on the machine's first pill. */
function howToCard(howTo) {
  if (!howTo?.guides?.length) return '';
  const count = howTo.guides.length;
  return `
    <button type="button" class="howto-entry" data-howto>
      <span class="howto-entry__icon" aria-hidden="true">${UI.play}</span>
      <span class="howto-entry__text"><strong>How to use it</strong><small>${count === 1 ? 'A short guide' : `${count} short guides`}, step by step</small></span>
      <span class="row__chevron" aria-hidden="true">${UI.chevron}</span>
    </button>`;
}

/**
 * Under the guides: where they come from, and what they are not. `about` adds
 * the machine's remark on its 3D model, for a page that points at the model.
 */
function howToNote({ source, note }, about = false) {
  return `<p class="howto-note">A short guide from <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>. It does not replace the manual that came with the machine, or training on it.${about && note ? ` ${esc(note)}` : ''}</p>`;
}

/** The guides of a machine. */
function howToListView({ item, howTo }) {
  return `
    <div class="panel__top">
      <button type="button" class="back" data-howto-close>${UI.back}<span>${name(item.shortName ?? item.name)}</span></button>
    </div>
    <header class="panel__header">
      <p class="eyebrow">${esc(item.kind)}</p>
      <h1>How to use it</h1>
    </header>
    <ol class="list howto-guides">
      ${howTo.guides
        .map(
          (guide, index) => `
        <li>
          <button type="button" class="row" data-howto-guide="${esc(guide.id)}">
            <span class="row__number" aria-hidden="true">${index + 1}</span>
            <span class="row__text"><strong>${esc(guide.title)}</strong><small>${plural(guide.steps.length, 'step')}</small></span>
            <span class="row__chevron" aria-hidden="true">${UI.chevron}</span>
          </button>
        </li>`,
        )
        .join('')}
    </ol>
    ${howToNote(howTo)}`;
}

/**
 * A guide, at one of its steps. Every step is in the list; the open one is
 * unfolded, and the others are buttons that open them. (On a phone the
 * stylesheet shows the open one alone.)
 */
function howToGuideView({ item, howTo }) {
  const guide = howTo.guides.find((entry) => entry.id === howTo.page.guideId);
  const id = esc(guide.id);
  const { step } = howTo.page;
  const total = guide.steps.length;
  const back = step > 0 ? `<button type="button" class="button button--quiet" data-howto-guide="${id}" data-howto-step="${step - 1}" data-focus="back" aria-label="Back to step ${step}">${UI.back}<span>Back</span></button>` : '<span></span>';
  const next =
    step < total - 1
      ? `<button type="button" class="button button--primary" data-howto-guide="${id}" data-howto-step="${step + 1}" data-focus="next" aria-label="Next: step ${step + 2}"><span>Next</span>${UI.chevron}</button>`
      : `<button type="button" class="button button--primary" data-howto-list data-focus="next" aria-label="Done: back to the guides"><span>Done</span>${UI.check}</button>`;
  return `
    <div class="howto-head">
      <div class="panel__top">
        <button type="button" class="back" data-howto-list>${UI.back}<span>How to use</span></button>
        <span class="howto-count">Step ${step + 1} of ${total}</span>
      </div>
      <p class="eyebrow howto-machine">${name(item.name)}</p>
      <h1 class="howto-title">${esc(guide.title)}</h1>
      <div class="howto-progress" aria-hidden="true">${guide.steps.map((_, index) => `<i${index <= step ? ' class="is-done"' : ''}></i>`).join('')}</div>
    </div>
    <ol class="howto-steps">
      ${guide.steps
        .map((entry, index) =>
          index === step
            ? `
        <li class="howto-step is-current" aria-current="step">
          <div class="howto-step__row">
            <span class="howto-step__number" aria-hidden="true">${index + 1}</span>
            <h2 class="howto-step__title">${esc(entry.title)}</h2>
            ${entry.at ? `<button type="button" class="howto-aim" data-howto-aim data-focus="aim" aria-label="Show it on the machine again" title="Show it on the machine again">${UI.aim}</button>` : ''}
          </div>
          <p class="howto-step__text">${esc(entry.text)}</p>
        </li>`
            : `
        <li class="howto-step">
          <button type="button" class="howto-step__row" data-howto-guide="${id}" data-howto-step="${index}" aria-label="Step ${index + 1}: ${esc(entry.title)}">
            <span class="howto-step__number" aria-hidden="true">${index + 1}</span>
            <span class="howto-step__title">${esc(entry.title)}</span>
          </button>
        </li>`,
        )
        .join('')}
    </ol>
    ${howToNote(howTo, true)}
    <nav class="howto-nav" aria-label="Steps of this guide">${back}${next}</nav>`;
}

/**
 * @param {HTMLElement} element
 * @param {object} handlers
 *   onRoom(id) onItem(id) onBack() onLab() onStart() onGuide() onExplode(0…1) onTab(id)
 *   onHowTo(page)   the machine's guides: null (leave them), {} (their list), { guideId, step }
 *   onAim()         show the open step on the machine again
 */
export function createPanel(element, handlers) {
  let shown = null; // which place the panel currently describes ("item:design/3shape-e4")
  let tab = 'overview';
  let step = null; // the open step of a guide, if the panel shows one

  /** Where the pills do not all fit they scroll sideways; fade whichever edge hides more of them. */
  function fadeEdges(tabs) {
    const hidden = tabs.scrollWidth - tabs.clientWidth;
    tabs.classList.toggle('has-more-before', tabs.scrollLeft > 2);
    tabs.classList.toggle('has-more-after', tabs.scrollLeft < hidden - 2);
  }

  function placeThumb() {
    const tabs = element.querySelector('.tabs');
    const active = tabs?.querySelector('[aria-selected="true"]');
    if (!active) return;
    tabs.style.setProperty('--thumb-x', `${active.offsetLeft}px`);
    tabs.style.setProperty('--thumb-w', `${active.offsetWidth}px`);
    fadeEdges(tabs);
  }

  function selectTab(id, { focus = false } = {}) {
    const buttons = [...element.querySelectorAll('[role="tab"]')];
    const target = buttons.find((button) => button.dataset.tab === id);
    if (!target || tab === id) return;
    const forward = buttons.indexOf(target) > buttons.findIndex((button) => button.dataset.tab === tab);
    tab = id;
    for (const button of buttons) {
      const selected = button === target;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    for (const section of element.querySelectorAll('.tabpanel')) {
      const selected = section.dataset.panel === id;
      section.hidden = !selected;
      section.classList.remove('is-entering', 'is-entering-back');
      if (selected) {
        void section.offsetWidth; // restart the entrance animation
        section.classList.add(forward ? 'is-entering' : 'is-entering-back');
      }
    }
    placeThumb();
    // On a phone the pills scroll sideways; keep the chosen one in view.
    target.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    if (focus) target.focus({ preventScroll: true });
    element.querySelector('.tabs')?.classList.add('is-moving');
    handlers.onTab?.(id);
  }

  element.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !element.contains(button)) return;
    const data = button.dataset;
    if (data.tab) selectTab(data.tab);
    else if (data.goRoom) handlers.onRoom(data.goRoom);
    else if (data.goItem) handlers.onItem(data.goItem);
    else if ('goBack' in data) handlers.onBack();
    else if ('goLab' in data) handlers.onLab();
    else if ('start' in data) handlers.onStart();
    else if ('guide' in data) handlers.onGuide();
    else if ('howto' in data || 'howtoList' in data) handlers.onHowTo({});
    else if (data.howtoGuide) handlers.onHowTo({ guideId: data.howtoGuide, step: Number(data.howtoStep ?? 0) });
    else if ('howtoClose' in data) handlers.onHowTo(null);
    else if ('howtoAim' in data) handlers.onAim();
  });

  /**
   * A guide's open step, where it can be read. On a phone it has the sheet to
   * itself and starts at its first line. Where all the steps are listed (a
   * wide screen) the list stays where it is and moves only as far as the open
   * step needs to come out from under the guide's head or from under
   * "Back · Next": both stay put while the list scrolls between them.
   */
  function showOpenStep() {
    const current = element.querySelector('.howto-step.is-current');
    const head = element.querySelector('.howto-head');
    const bar = element.querySelector('.howto-nav');
    if (!current || !head || !bar) return;
    if (!LISTS_ALL_STEPS.matches) {
      element.scrollTop = 0;
      return;
    }
    // Measured in the panel's own layout (offsetTop, summed up to the panel),
    // which an entrance that is still playing does not shift.
    let top = -element.scrollTop;
    for (let node = current; node && node !== element; node = node.offsetParent) top += node.offsetTop;
    const bottom = top + current.offsetHeight;
    const ceiling = head.offsetHeight;
    const floor = element.clientHeight - bar.offsetHeight;
    if (top < ceiling) element.scrollTop -= ceiling - top;
    else if (bottom > floor) element.scrollTop += Math.min(top - ceiling, bottom - floor);
  }
  // The window was made wider or narrower with a guide open: the other layout starts from the open step too.
  LISTS_ALL_STEPS.addEventListener('change', showOpenStep);

  // Arrow keys move between pills, as in any tab list.
  element.addEventListener('keydown', (event) => {
    if (event.target.getAttribute?.('role') !== 'tab') return;
    const buttons = [...element.querySelectorAll('[role="tab"]')];
    const index = buttons.indexOf(event.target);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: buttons.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectTab(buttons[(next + buttons.length) % buttons.length].dataset.tab, { focus: true });
  });

  element.addEventListener('input', (event) => {
    if (!('explode' in event.target.dataset)) return;
    const percent = Number(event.target.value);
    const output = element.querySelector('[data-explode-value]');
    if (output) output.textContent = `${percent}%`;
    event.target.style.setProperty('--fill', `${percent}%`);
    handlers.onExplode(percent / 100);
  });

  new ResizeObserver(placeThumb).observe(element);

  return {
    /**
     * view: { mode: 'overview' | 'room' | 'item', … }
     * Drawing the same place again (a model finished loading, another step of
     * the same guide) keeps the open pill and the take-apart slider where they
     * were, and the keyboard focus on the control that had it.
     */
    render(view) {
      // A machine's guides are places of their own: their list, and each guide (whichever step is open).
      const page = view.mode === 'item' && view.howTo?.page ? (view.howTo.page.guideId ? 'guide' : 'list') : null;
      const key = `${view.mode}:${view.item?.id ?? view.room?.id ?? ''}${page ? `:how-to:${view.howTo.page.guideId ?? ''}` : ''}`;
      const same = key === shown;
      const moved = page === 'guide' && view.howTo.page.step !== step;
      const explode = same ? element.querySelector('[data-explode]')?.value : null;
      // The control that was just used is drawn afresh with everything else ("Next"): which one was it?
      const held = same && element.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
      if (!same) tab = 'overview';
      shown = key;
      step = page === 'guide' ? view.howTo.page.step : null;

      element.innerHTML = page === 'guide' ? howToGuideView(view) : page === 'list' ? howToListView(view) : view.mode === 'item' ? itemView(view, tab) : view.mode === 'room' ? roomView(view) : overviewView(view);
      element.dataset.mode = view.mode;
      element.dataset.tabs = String(element.querySelectorAll('[role="tab"]').length);
      if (page) element.dataset.howto = page;
      else delete element.dataset.howto;
      if (held) (element.querySelector(`[data-focus="${held}"]`) ?? element).focus({ preventScroll: true });

      const slider = element.querySelector('[data-explode]');
      if (slider && explode) {
        slider.value = explode;
        slider.style.setProperty('--fill', `${explode}%`);
        element.querySelector('[data-explode-value]').textContent = `${explode}%`;
      }
      const tabs = element.querySelector('.tabs');
      tabs?.addEventListener('scroll', () => fadeEdges(tabs), { passive: true });
      placeThumb();
      if (!same) {
        element.scrollTop = 0;
        element.classList.remove('is-entering');
        void element.offsetWidth; // restart the entrance animation
        element.classList.add('is-entering');
      } else {
        // The same place, drawn again: its parts are simply there. (With the
        // class left on, every part of every step would rise in again.)
        element.classList.remove('is-entering');
      }
      // How much of the panel the guide's head covers, for the stylesheet (scroll-padding).
      const head = page === 'guide' ? element.querySelector('.howto-head') : null;
      if (head) element.style.setProperty('--howto-head', `${head.offsetHeight}px`);
      else element.style.removeProperty('--howto-head');
      if (page === 'guide' && (moved || !same)) showOpenStep();
    },
    /** The open pill of the machine being shown ('overview', 'about', …). */
    get tab() {
      return tab;
    },
    selectTab,
  };
}
