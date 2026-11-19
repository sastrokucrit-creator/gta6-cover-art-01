// Vice Cover Studio — the render engine. Draws a multi-panel GTA-style poster
// (photos, colour grade, bold caption) onto any canvas at any export size.
// Pure canvas 2D, no libraries, no network. Fonts: Anton (OFL, vendored).

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

export const LAYOUTS = {
  showcase: { panels: 5, band: 0.2, label: 'Showcase — hero left, four small, title strip' },
  poster: { panels: 4, band: 0.2, label: 'Poster — big top, three below, title strip' },
  keyart: { panels: 6, band: 0, label: 'Key art — two heroes, three stacked, bottom strip' },
  hero: { panels: 1, band: 0, label: 'Hero — one full photo' },
  duo: { panels: 2, band: 0, label: 'Duo — two tall panels' },
  trio: { panels: 3, band: 0, label: 'Trio — one big, two stacked' },
  quad: { panels: 4, band: 0, label: 'Quad — four equal panels' },
};

export const GRADES = {
  original: { label: 'Original — no grade' },
  sunset: { label: 'Sunset — warm dusk grade' },
  neon: { label: 'Neon — magenta and cyan night' },
  noir: { label: 'Noir — black and white, hard contrast' },
};

// The title band: the fraction of the cover height reserved at the foot for
// the full-width title strip. Layouts with band 0 draw the title over the
// photos instead, on a dark scrim.
export function titleBand(layout, H) {
  const f = (LAYOUTS[layout] || LAYOUTS.hero).band || 0;
  const h = Math.round(H * f);
  return h > 0 ? { x: 0, y: H - h, w: 0, h } : null;
}

// Panel rectangles for a layout, in fractions of the canvas, with a gutter
// between them. Panels are numbered in reading order. The photo area is the
// cover minus the title band.
export function layoutPanels(layout, W, H) {
  const band = titleBand(layout, H);
  const photoH = band ? band.y : H;
  const g = Math.max(6, Math.round(Math.min(W, H) * 0.012));
  const x0 = g, y0 = g, x1 = W - g, y1 = photoH - g;
  const w = x1 - x0, h = y1 - y0;
  const midX = x0 + Math.round(w * 0.56);
  const midY = y0 + Math.round(h * 0.62);
  switch (layout) {
    case 'showcase': {
      const leftW = Math.round(w * 0.55);
      const rightX = x0 + leftW + g;
      const rightW = x1 - rightX;
      const cw = Math.round((rightW - g) / 2);
      const rh = Math.round((h - g) / 2);
      return [
        { x: x0, y: y0, w: leftW, h },
        { x: rightX, y: y0, w: cw, h: rh },
        { x: rightX + cw + g, y: y0, w: rightW - cw - g, h: rh },
        { x: rightX, y: y0 + rh + g, w: cw, h: h - rh - g },
        { x: rightX + cw + g, y: y0 + rh + g, w: rightW - cw - g, h: h - rh - g },
      ];
    }
    case 'keyart': {
      const leftW = Math.round(w * 0.28);
      const midW = Math.round(w * 0.3);
      const stripH = Math.round(h * 0.16);
      const topH = h - stripH - g;
      const third = Math.round((topH - 2 * g) / 3);
      const midX2 = x0 + leftW + g;
      const rightX = midX2 + midW + g;
      return [
        { x: x0, y: y0, w: leftW, h: topH },
        { x: midX2, y: y0, w: midW, h: third },
        { x: midX2, y: y0 + third + g, w: midW, h: third },
        { x: midX2, y: y0 + 2 * (third + g), w: midW, h: topH - 2 * (third + g) },
        { x: rightX, y: y0, w: x1 - rightX, h: topH },
        { x: x0, y: y0 + topH + g, w, h: stripH },
      ];
    }
    case 'duo':
      return [
        { x: x0, y: y0, w: midX - x0 - g / 2, h },
        { x: midX + g / 2, y: y0, w: x1 - midX - g / 2, h },
      ];
    case 'trio':
      return [
        { x: x0, y: y0, w: midX - x0 - g / 2, h },
        { x: midX + g / 2, y: y0, w: x1 - midX - g / 2, h: Math.round((h - g) / 2) },
        { x: midX + g / 2, y: y0 + Math.round((h - g) / 2) + g, w: x1 - midX - g / 2, h: h - Math.round((h - g) / 2) - g },
      ];
    case 'quad': {
      const hw = Math.round((w - g) / 2), hh = Math.round((h - g) / 2);
      return [
        { x: x0, y: y0, w: hw, h: hh },
        { x: x0 + hw + g, y: y0, w: w - hw - g, h: hh },
        { x: x0, y: y0 + hh + g, w: hw, h: h - hh - g },
        { x: x0 + hw + g, y: y0 + hh + g, w: w - hw - g, h: h - hh - g },
      ];
    }
    case 'poster': {
      const tw = Math.round((w - 2 * g) / 3);
      return [
        { x: x0, y: y0, w, h: midY - y0 - g / 2 },
        { x: x0, y: midY + g / 2, w: tw, h: y1 - midY - g / 2 },
        { x: x0 + tw + g, y: midY + g / 2, w: tw, h: y1 - midY - g / 2 },
        { x: x0 + 2 * (tw + g), y: midY + g / 2, w: w - 2 * (tw + g), h: y1 - midY - g / 2 },
      ];
    }
    case 'hero':
    default:
      return [{ x: x0, y: y0, w, h }];
  }
}

// Draws one photo into a rectangle, cover-fit, with a zoom factor (>= 1) and a
// pan offset in panel pixels. The offset is clamped so the photo always covers.
export function drawPhotoInto(ctx, img, rect, zoom, ox, oy) {
  const z = Math.max(1, zoom || 1);
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const pw = img.naturalWidth * base * z;
  const ph = img.naturalHeight * base * z;
  const maxOx = Math.max(0, (pw - rect.w) / 2);
  const maxOy = Math.max(0, (ph - rect.h) / 2);
  const cx = rect.x + rect.w / 2 + Math.max(-maxOx, Math.min(maxOx, ox || 0));
  const cy = rect.y + rect.h / 2 + Math.max(-maxOy, Math.min(maxOy, oy || 0));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
  return { maxOx, maxOy };
}

// A soft dark vignette over the whole cover, so the caption reads anywhere.
function vignette(ctx, W, H) {
  const r = Math.hypot(W, H) / 2;
  const v = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// The colour grade, painted over the photos. Each grade is two gradients:
// a warm or cool wash from the top, and a stronger tint rising from the foot.
function gradeWash(ctx, W, H, grade) {
  if (grade === 'original') return;
  let top, bottom;
  if (grade === 'sunset') {
    top = ['rgba(255,150,60,0.10)', 'rgba(255,90,40,0.05)'];
    bottom = ['rgba(255,60,120,0.00)', 'rgba(255,40,110,0.30)'];
  } else if (grade === 'neon') {
    top = ['rgba(40,200,255,0.12)', 'rgba(120,60,255,0.06)'];
    bottom = ['rgba(255,0,160,0.00)', 'rgba(255,0,160,0.28)'];
  } else if (grade === 'noir') {
    top = ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)'];
    bottom = ['rgba(0,0,0,0.00)', 'rgba(0,0,0,0.34)'];
  }
  const g1 = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  g1.addColorStop(0, top[0]);
  g1.addColorStop(1, top[1]);
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createLinearGradient(0, H * 0.4, 0, H);
  g2.addColorStop(0, bottom[0]);
  g2.addColorStop(1, bottom[1]);
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
}

// Splits a caption into lines that fit maxWidth at the given font string.
export function wrapCaption(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// The title block: the dominant element of the cover. A giant Anton title
// with a gradient fill and a thick dark outline, a white script subtitle
// (Pacifico) beneath it, and a yellow caps tagline. In band layouts the block
// sits in the full-width title strip at the foot; otherwise it sits over the
// photos on a dark scrim, at the foot or the top.
export function drawTitleBlock(ctx, W, H, state, band) {
  const text = (state.caption || '').trim().toUpperCase();
  const script = (state.subtitle || '').trim();
  const tag = (state.tagline || '').trim();
  if (!text && !script && !tag) return;
  const maxW = W * 0.92;
  // Title size: the band's height sets it in strip layouts, the cover's
  // smaller side in overlay layouts. The title is the largest element.
  const areaH = band ? band.h : Math.min(W, H);
  let size = Math.round(areaH * (band ? 0.4 : 0.13) * (state.captionScale || 1));
  const font = (s) => `900 ${s}px Anton, 'Arial Narrow', sans-serif`;
  let lines = [];
  if (text) {
    while (size > 18) {
      lines = wrapCaption(ctx, text, maxW, font(size));
      if (lines.length <= 2) break;
      size = Math.round(size * 0.92);
    }
    lines = wrapCaption(ctx, text, maxW, font(size));
  }
  const lineH = Math.round(size * 1.0);
  const scriptSize = Math.round(size * 0.34);
  const tagSize = Math.round(size * 0.22);
  const pad = Math.round(H * 0.02);
  const blockH = lines.length * lineH + (script ? Math.round(scriptSize * 1.5) : 0) + (tag ? Math.round(tagSize * 1.9) : 0);
  let topY;
  if (band) {
    topY = band.y + Math.round((band.h - blockH) / 2);
    // The strip itself: near-black with a hot gradient rule on top.
    ctx.fillStyle = '#0d0714';
    ctx.fillRect(0, band.y, W, band.h);
    const rule = ctx.createLinearGradient(0, 0, W, 0);
    rule.addColorStop(0, '#ffb347');
    rule.addColorStop(0.5, '#ff2e88');
    rule.addColorStop(1, '#7df9ff');
    ctx.fillStyle = rule;
    ctx.fillRect(0, band.y, W, Math.max(3, Math.round(H * 0.004)));
  } else {
    const pos = state.captionPos === 'top' ? 'top' : 'bottom';
    topY = pos === 'top' ? pad : H - pad - blockH;
    const scrim = ctx.createLinearGradient(0, topY - pad, 0, topY + blockH + pad);
    if (pos === 'top') {
      scrim.addColorStop(0, 'rgba(5,2,10,0.75)');
      scrim.addColorStop(1, 'rgba(5,2,10,0)');
    } else {
      scrim.addColorStop(0, 'rgba(5,2,10,0)');
      scrim.addColorStop(1, 'rgba(5,2,10,0.75)');
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(0, topY - pad, W, blockH + pad * 2);
  }
  // Title lines.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const outlineW = Math.max(2, Math.round(size * (state.outline ?? 0.07)));
  let fill;
  if (state.textStyle === 'sunset') {
    fill = ctx.createLinearGradient(0, topY, 0, topY + lines.length * lineH);
    fill.addColorStop(0, '#ffe9a8');
    fill.addColorStop(0.45, '#ff9a3c');
    fill.addColorStop(1, '#ff2e88');
  } else if (state.textStyle === 'neon') {
    fill = ctx.createLinearGradient(0, topY, 0, topY + lines.length * lineH);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.5, '#aef3ff');
    fill.addColorStop(1, '#ff4fd8');
  } else {
    fill = '#ffffff';
  }
  let y = topY + lineH * 0.9;
  for (const line of lines) {
    ctx.font = font(size);
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = Math.round(size * 0.14);
    ctx.shadowOffsetY = Math.round(size * 0.05);
    ctx.strokeStyle = '#14060f';
    ctx.lineWidth = outlineW * 2;
    ctx.strokeText(line, W / 2, y);
    ctx.fillStyle = fill;
    ctx.fillText(line, W / 2, y);
    y += lineH;
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Cursor at the foot of the title block (y above is one line past the last
  // baseline, so step back to the block's bottom edge).
  let cursor = topY + lines.length * lineH;
  // Script subtitle in white, just under the title.
  if (script) {
    ctx.font = `${scriptSize}px Pacifico, cursive`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.round(scriptSize * 0.25);
    ctx.fillText(script, W / 2, cursor + Math.round(scriptSize * 0.85));
    ctx.shadowBlur = 0;
    cursor += Math.round(scriptSize * 1.5);
  }
  // Tagline: yellow caps, letterspaced, on its own line.
  if (tag) {
    ctx.font = `700 ${tagSize}px 'Arial Narrow', sans-serif`;
    const spaced = tag.toUpperCase().split('').join('\u2009');
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(spaced, W / 2, cursor + Math.round(tagSize * 0.85));
  }
}

// A yellow starburst badge with dark text, tilted, in the cover's top-right
// corner. Pure canvas path, no image.
export function drawBadge(ctx, W, H, text) {
  const label = (text || '').trim().toUpperCase();
  if (!label) return;
  const r = Math.round(Math.min(W, H) * 0.085);
  const cx = W - r - Math.round(W * 0.02);
  const cy = r + Math.round(H * 0.025);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.14);
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23e';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = Math.round(r * 0.18);
  ctx.shadowOffsetY = Math.round(r * 0.05);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(2, Math.round(r * 0.05));
  ctx.strokeStyle = '#14060f';
  ctx.stroke();
  ctx.fillStyle = '#14060f';
  ctx.font = `900 ${Math.round(r * 0.34)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

// Comic halftone dots over the photo area: a repeating dot screen at low
// alpha, the print texture of classic poster art.
let halftonePattern = null;
export function halftone(ctx, W, H, band) {
  if (!halftonePattern) {
    const tile = document.createElement('canvas');
    tile.width = 12;
    tile.height = 12;
    const t = tile.getContext('2d');
    t.fillStyle = '#000000';
    t.beginPath();
    t.arc(6, 6, 2.4, 0, Math.PI * 2);
    t.fill();
    halftonePattern = ctx.createPattern(tile, 'repeat');
  }
  const photoH = band ? band.y : H;
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = halftonePattern;
  ctx.fillRect(0, 0, W, photoH);
  ctx.restore();
}

// Renders the whole cover. `state` carries layout, grade, size, caption,
// subtitle, tagline, badgeText, showBadge, halftone, captionPos,
// captionScale, outline, textStyle, and panels: an array of
// { photo, zoom, ox, oy } where photo is an image element or null.
// A panel with no photo gets a deep purple placeholder with its number.
export function renderCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const W = size.w, H = size.h;
  ctx.fillStyle = '#0d0b12';
  ctx.fillRect(0, 0, W, H);
  const band = titleBand(state.layout, H);
  const rects = layoutPanels(state.layout, W, H);
  const noir = state.grade === 'noir';
  rects.forEach((rect, i) => {
    const panel = (state.panels || [])[i] || {};
    if (panel.photo) {
      if (noir) ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.04)';
      drawPhotoInto(ctx, panel.photo, rect, panel.zoom, panel.ox, panel.oy);
      ctx.filter = 'none';
    } else {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      g.addColorStop(0, '#3a2350');
      g.addColorStop(1, '#160f22');
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.font = `900 ${Math.round(Math.min(rect.w, rect.h) * 0.22)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
  });
  gradeWash(ctx, W, H, state.grade || 'sunset');
  if (state.halftone) halftone(ctx, W, H, band);
  vignette(ctx, W, H);
  drawTitleBlock(ctx, W, H, state, band);
  if (state.showBadge) drawBadge(ctx, W, H, state.badgeText);
}
