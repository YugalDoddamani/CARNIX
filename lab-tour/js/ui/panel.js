// The information panel: a card beside the lab on wide screens, a sheet under it
// on phones. It is a plain function of "where the visitor is" (overview, a room,
// a machine), drawn afresh on every navigation.
//
// A machine's panel has up to four pills: its own name (what it is), About (who
// makes it), Features (its key figures) and Capabilities (what sets it apart).
// A pill only appears when knowledge.js has something to put under it.
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
              ${item.status === 'planned' ? '<span class="chip chip--planned">Planned</span>' : ''}
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

function overviewTab({ item, room, info, modelState }) {
  const built = item.status === 'built';
  let model = '';
  if (!built) {
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
    ${info?.summary ? `<p class="lead">${esc(info.summary)}</p>` : ''}
    ${info?.how ? `<p class="body">${esc(info.how)}</p>` : ''}
    ${model}
    <dl class="facts">
      <div><dt>Where</dt><dd>${esc(room.name)}</dd></div>
      <div><dt>${built ? 'Size of the model' : 'Rough size'}</dt><dd>${sizeText(item.sizeMm)}</dd></div>
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

/**
 * @param {HTMLElement} element
 * @param {object} handlers
 *   onRoom(id) onItem(id) onBack() onLab() onStart() onGuide() onExplode(0…1) onTab(id)
 */
export function createPanel(element, handlers) {
  let shown = null; // which place the panel currently describes ("item:design/3shape-e4")
  let tab = 'overview';

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
  });

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
     * Drawing the same place again (a model finished loading) keeps the open
     * pill and the take-apart slider where they were.
     */
    render(view) {
      const key = `${view.mode}:${view.item?.id ?? view.room?.id ?? ''}`;
      const same = key === shown;
      const explode = same ? element.querySelector('[data-explode]')?.value : null;
      if (!same) tab = 'overview';
      shown = key;

      element.innerHTML = view.mode === 'item' ? itemView(view, tab) : view.mode === 'room' ? roomView(view) : overviewView(view);
      element.dataset.mode = view.mode;
      element.dataset.tabs = String(element.querySelectorAll('[role="tab"]').length);

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
      }
    },
    /** The open pill of the machine being shown ('overview', 'about', …). */
    get tab() {
      return tab;
    },
    selectTab,
  };
}
