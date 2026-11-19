// Fixed scenes for screenshots and tests: ?shot=cover shows the cover alone
// (controls hidden), ?shot=editor shows the editor with photos loaded.
// Query params: layout, grade, size, caption, subtitle, tagline, badge,
// badgeStyle, halftone, photo (a comma list of sample names, one per panel,
// the last one repeating), captions (per-panel labels, "|" separated).
// window.__shotReady is set once the scene has painted.

import { defaultPanelLabel } from './cover.js';

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

export async function runShot(shot, query) {
  const vice = window.__vice;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  await vice.loadSamples();
  const layout = query.get('layout');
  if (layout) vice.setLayout(layout);
  const grade = query.get('grade');
  if (grade) vice.setGrade(grade);
  const size = query.get('size');
  if (size) vice.setSize(size);
  const caption = query.get('caption');
  if (caption !== null) vice.setCaption(caption);
  const subtitle = query.get('subtitle');
  if (subtitle !== null) vice.setSubtitle(subtitle);
  const tagline = query.get('tagline');
  if (tagline !== null) vice.setTagline(tagline);
  const badge = query.get('badge');
  if (badge !== null) vice.setBadge(badge);
  const badgeStyle = query.get('badgeStyle');
  if (badgeStyle) vice.setBadgeStyle(badgeStyle);
  const halftone = query.get('halftone');
  if (halftone !== null) vice.setHalftone(halftone !== '0');
  const showBadge = query.get('showBadge');
  if (showBadge !== null) { vice.state.showBadge = showBadge !== '0'; }
  const pos = query.get('captionPos');
  if (pos) { vice.state.captionPos = pos; }
  const style = query.get('textStyle');
  if (style) { vice.state.textStyle = style; }
  const photos = query.get('photo');
  if (photos) {
    const names = photos.split(',');
    vice.state.panels.forEach((p, i) => {
      const name = names[Math.min(i, names.length - 1)];
      const idx = vice.state.tray.findIndex((t) => t.name === name);
      if (idx >= 0) {
        p.photo = idx;
        p.zoom = 1;
        p.ox = 0;
        p.oy = 0;
        // The caption belongs to the photo, not the panel slot: a new photo
        // gets its own default story label.
        p.caption = defaultPanelLabel(name);
      }
    });
  }
  // Per-panel story captions, panels separated by "|". When absent, the
  // default caption for each panel's photo is used.
  const captions = query.get('captions');
  if (captions !== null) {
    const list = captions.split('|');
    vice.state.panels.forEach((p, i) => {
      if (i < list.length) p.caption = list[i];
    });
  }
  try {
    await document.fonts.ready;
  } catch {
    // The caption falls back to a narrow sans if Anton fails to load.
  }
  vice.render();
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  window.__shotReady = true;
}
