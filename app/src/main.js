// Vice Cover Studio — the editor. Wires the controls to the render engine:
// photo tray, panel picking, drag-to-pan and wheel zoom, caption and grade
// controls, and PNG export in the three post sizes. A `?shot=` query sets up
// a fixed scene for a screenshot instead (./shots.js).

import { SIZES, LAYOUTS, GRADES, BADGE_STYLES, FACE_ANCHORS, layoutPanels, renderCover, defaultPanelLabel } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const trayEl = document.getElementById('tray');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');

// The working state. A panel holds { photo, zoom, ox, oy } where photo is an
// index into state.tray (or null for an empty panel).
export const state = {
  layout: 'keyart',
  grade: 'sunset',
  size: 'wide',
  caption: 'Sunset Heist',
  subtitle: 'a sun-soaked getaway',
  tagline: 'Every street hides a fortune',
  badgeText: 'Fresh',
  badgeStyle: 'starburst',
  showBadge: true,
  showPanelLabels: true,
  halftone: true,
  captionPos: 'center',
  captionScale: 1,
  outline: 0.07,
  textStyle: 'sunset',
  quote: 'A sunset that steals the whole show',
  quoteSource: 'The Coast Review',
  showQuote: true,
  footer: 'A Vice Cover Studio picture · In association with Palm & Sunset',
  footer2: 'Starring you and your crew · Directed by you · Written at the beach · Music by the neon',
  showFooter: true,
  // Face-aware crop is on by default: a bundled cast portrait keeps its
  // face centred in its panel until the user drags it by hand.
  faceAware: true,
  tray: [],
  panels: [],
  selectedPanel: 0,
  selectedTray: 0,
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function ensurePanels() {
  while (state.panels.length < panelCount()) {
    const first = state.tray[0];
    state.panels.push({
      photo: first ? 0 : null,
      zoom: 1, ox: 0, oy: 0,
      caption: first ? defaultPanelLabel(first.name) : '',
    });
  }
  state.panels.length = panelCount();
  if (state.selectedPanel >= panelCount()) state.selectedPanel = 0;
}

function renderState() {
  ensurePanels();
  const panels = state.panels.map((p) => ({
    photo: p.photo === null ? null : state.tray[p.photo]?.img ?? null,
    zoom: p.zoom,
    ox: p.ox,
    oy: p.oy,
    caption: p.caption || '',
  }));
  renderCover(canvas, { ...state, panels });
  const n = panelCount();
  const cap = state.panels[state.selectedPanel]?.caption || '';
  panelLabel.textContent = `Panel ${state.selectedPanel + 1} of ${n} — ${LAYOUTS[state.layout].label.split(' — ')[0]} · ${GRADES[state.grade].label.split(' — ')[0]}`;
  const capInput = document.getElementById('panelCaption');
  if (capInput && document.activeElement !== capInput) capInput.value = cap;
}

let renderQueued = false;
function redraw() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderState();
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

function refreshTray() {
  trayEl.innerHTML = '';
  state.tray.forEach((item, i) => {
    const thumb = document.createElement('img');
    thumb.src = item.url;
    thumb.alt = item.name;
    thumb.title = item.name;
    if (i === state.selectedTray) thumb.classList.add('selected');
    if (state.panels.some((p) => p.photo === i)) thumb.classList.add('assigned');
    thumb.addEventListener('click', () => {
      state.selectedTray = i;
      const panel = state.panels[state.selectedPanel];
      if (panel) {
        panel.photo = i;
        panel.zoom = 1;
        panel.ox = 0;
        panel.oy = 0;
        panel.caption = defaultPanelLabel(state.tray[i].name);
      }
      refreshTray();
      redraw();
    });
    trayEl.appendChild(thumb);
  });
}

export async function loadSamples() {
  // Portraits first: the default cover is led by people, the way the top
  // covers are — the hero panel takes the first photo in the tray.
  // Six cast portraits, then the places.
  const names = ['driver', 'rider', 'woman', 'fixer', 'mechanic', 'captain', 'sunset', 'neon', 'pier', 'boulevard', 'lifeguard'];
  for (const name of names) {
    if (state.tray.some((t) => t.name === name)) continue;
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      // The face anchor rides on the image itself, so the render engine
      // can centre it without the panels having to know any names.
      img._face = FACE_ANCHORS[name] || null;
      state.tray.push({ img, name, url: `samples/${name}.jpg` });
    } catch {
      // A missing sample is not fatal; the tray just holds fewer photos.
    }
  }
  if (state.panels.every((p) => p.photo === null) && state.tray.length) {
    state.panels.forEach((p) => {
      p.photo = 0;
      p.caption = defaultPanelLabel(state.tray[0].name);
    });
  }
  refreshTray();
  redraw();
}

// --- Chips (layout / grade / size) ---------------------------------------
function buildChips(el, options, current, onPick) {
  el.innerHTML = '';
  for (const [key, opt] of Object.entries(options)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = opt.label.split(' — ')[0];
    b.title = opt.label;
    if (key === current) b.classList.add('active');
    b.addEventListener('click', () => {
      onPick(key);
      buildChips(el, options, key, onPick);
    });
    el.appendChild(b);
  }
}

buildChips(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  ensurePanels();
  redraw();
});
buildChips(document.getElementById('grades'), GRADES, state.grade, (key) => {
  state.grade = key;
  redraw();
});
buildChips(document.getElementById('sizes'), SIZES, state.size, (key) => {
  state.size = key;
  redraw();
});

// --- Title block controls --------------------------------------------------
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const taglineInput = document.getElementById('tagline');
const badgeInput = document.getElementById('badgeText');
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badgeText = badgeInput.value; redraw(); });
document.getElementById('badgeStyle').addEventListener('change', (e) => {
  state.badgeStyle = e.target.value;
  redraw();
});
document.getElementById('showPanelLabels').addEventListener('change', (e) => {
  state.showPanelLabels = e.target.checked;
  redraw();
});
document.getElementById('faceAware').addEventListener('change', (e) => {
  state.faceAware = e.target.checked;
  redraw();
});
document.getElementById('panelCaption').addEventListener('input', (e) => {
  const panel = state.panels[state.selectedPanel];
  if (panel) {
    panel.caption = e.target.value;
    redraw();
  }
});
document.getElementById('showBadge').addEventListener('change', (e) => {
  state.showBadge = e.target.checked;
  redraw();
});
document.getElementById('halftone').addEventListener('change', (e) => {
  state.halftone = e.target.checked;
  redraw();
});
document.getElementById('captionPos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});
document.getElementById('textStyle').addEventListener('change', (e) => {
  state.textStyle = e.target.value;
  redraw();
});
const quoteInput = document.getElementById('quote');
const quoteSourceInput = document.getElementById('quoteSource');
const footerInput = document.getElementById('footer');
const footer2Input = document.getElementById('footer2');
quoteInput.addEventListener('input', () => { state.quote = quoteInput.value; redraw(); });
quoteSourceInput.addEventListener('input', () => { state.quoteSource = quoteSourceInput.value; redraw(); });
footerInput.addEventListener('input', () => { state.footer = footerInput.value; redraw(); });
footer2Input.addEventListener('input', () => { state.footer2 = footer2Input.value; redraw(); });
document.getElementById('showQuote').addEventListener('change', (e) => {
  state.showQuote = e.target.checked;
  redraw();
});
document.getElementById('showFooter').addEventListener('change', (e) => {
  state.showFooter = e.target.checked;
  redraw();
});
const sizeRange = document.getElementById('captionSize');
sizeRange.addEventListener('input', () => {
  state.captionScale = Number(sizeRange.value) / 100;
  document.getElementById('captionSizeVal').textContent = sizeRange.value + '%';
  redraw();
});
const outlineRange = document.getElementById('outline');
outlineRange.addEventListener('input', () => {
  state.outline = Number(outlineRange.value) / 100;
  document.getElementById('outlineVal').textContent = outlineRange.value + '%';
  redraw();
});

// --- Photo upload ----------------------------------------------------------
document.getElementById('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.tray.push({ img, name: file.name, url });
      state.selectedTray = state.tray.length - 1;
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  e.target.value = '';
  refreshTray();
  redraw();
});

document.getElementById('samples').addEventListener('click', loadSamples);
document.getElementById('fillAll').addEventListener('click', () => {
  const photo = state.selectedTray;
  if (state.tray[photo] === undefined) return;
  state.panels.forEach((p) => {
    p.photo = photo;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
    p.caption = defaultPanelLabel(state.tray[photo].name);
  });
  refreshTray();
  redraw();
});

// --- Panel picking, panning, zooming ---------------------------------------
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function panelAt(x, y) {
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selectedPanel = i;
  refreshTray();
  redraw();
  drag = { x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = p.x - drag.x, dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const panel = state.panels[state.selectedPanel];
  if (panel && panel.photo !== null) {
    panel.ox += dx;
    panel.oy += dy;
    redraw();
  }
  drag.x = p.x;
  drag.y = p.y;
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selectedPanel = i;
  const panel = state.panels[i];
  if (panel && panel.photo !== null) {
    panel.zoom = Math.max(1, Math.min(4, panel.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    redraw();
  }
}, { passive: false });

// --- Export ------------------------------------------------------------------
function exportCanvas(sizeName) {
  const size = SIZES[sizeName] || SIZES[state.size];
  const off = document.createElement('canvas');
  const panels = state.panels.map((p) => ({
    photo: p.photo === null ? null : state.tray[p.photo]?.img ?? null,
    zoom: p.zoom,
    ox: p.ox,
    oy: p.oy,
    caption: p.caption || '',
  }));
  renderCover(off, { ...state, panels, size: sizeName });
  return new Promise((resolve) => {
    off.toBlob((blob) => resolve({ blob, w: size.w, h: size.h }), 'image/png');
  });
}

export async function exportPNG(sizeName) {
  const name = sizeName || state.size;
  const { blob, w, h } = await exportCanvas(name);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${w}x${h}.png`;
  a.click();
  statusEl.textContent = `Saved vice-cover-${w}x${h}.png (${Math.round(blob.size / 1024)} KiB)`;
  return { blob, w, h };
}

document.getElementById('export').addEventListener('click', () => exportPNG());

// --- Shot scenes and the test API --------------------------------------------
window.__vice = {
  state,
  render: redraw,
  loadSamples,
  exportPNG,
  setLayout: (key) => { state.layout = key; ensurePanels(); redraw(); },
  setGrade: (key) => { state.grade = key; redraw(); },
  setSize: (key) => { state.size = key; redraw(); },
  setCaption: (text) => { state.caption = text; captionInput.value = text; redraw(); },
  setSubtitle: (text) => { state.subtitle = text; subtitleInput.value = text; redraw(); },
  setTagline: (text) => { state.tagline = text; taglineInput.value = text; redraw(); },
  setBadge: (text) => { state.badgeText = text; badgeInput.value = text; redraw(); },
  setBadgeStyle: (style) => {
    state.badgeStyle = style;
    const sel = document.getElementById('badgeStyle');
    if (sel) sel.value = style;
    redraw();
  },
  setPanelCaption: (text, panelIdx) => {
    const panel = state.panels[panelIdx ?? state.selectedPanel];
    if (panel) { panel.caption = text; redraw(); }
  },
  setShowPanelLabels: (on) => { state.showPanelLabels = !!on; redraw(); },
  setFaceAware: (on) => { state.faceAware = !!on; const el = document.getElementById('faceAware'); if (el) el.checked = !!on; redraw(); },
  setHalftone: (on) => { state.halftone = !!on; redraw(); },
  setQuote: (text) => { state.quote = text; const el = document.getElementById('quote'); if (el) el.value = text; redraw(); },
  setQuoteSource: (text) => { state.quoteSource = text; const el = document.getElementById('quoteSource'); if (el) el.value = text; redraw(); },
  setShowQuote: (on) => { state.showQuote = !!on; const el = document.getElementById('showQuote'); if (el) el.checked = !!on; redraw(); },
  setFooter: (text) => { state.footer = text; const el = document.getElementById('footer'); if (el) el.value = text; redraw(); },
  setFooter2: (text) => { state.footer2 = text; const el = document.getElementById('footer2'); if (el) el.value = text; redraw(); },
  setShowFooter: (on) => { state.showFooter = !!on; const el = document.getElementById('showFooter'); if (el) el.checked = !!on; redraw(); },
  setCaptionPos: (pos) => { state.captionPos = pos; const el = document.getElementById('captionPos'); if (el) el.value = pos; redraw(); },
};

const shot = new URLSearchParams(location.search).get('shot');
const fontsReady = (async () => {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px Pacifico');
    await document.fonts.ready;
  } catch {
    // The title falls back to a narrow sans if the fonts fail to load.
  }
})();

if (shot) {
  await runShot(shot, new URLSearchParams(location.search));
} else {
  ensurePanels();
  await fontsReady;
  await loadSamples();
  redraw();
}
window.__vice.ready = true;
