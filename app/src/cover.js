// Vice Cover Studio — the render engine. Draws a multi-panel GTA-style poster
// (photos, colour grade, bold caption) onto any canvas at any export size.
// Pure canvas 2D, no libraries, no network. Fonts: Anton (OFL, vendored).

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

export const LAYOUTS = {
  showcase: { panels: 5, label: 'Showcase — hero left, four small, title over photos' },
  poster: { panels: 4, label: 'Poster — big top, three below, title over photos' },
  keyart: { panels: 6, label: 'Key art — two heroes, three stacked, bottom strip' },
  hero: { panels: 1, label: 'Hero — one full photo' },
  duo: { panels: 2, label: 'Duo — two tall panels' },
  trio: { panels: 3, label: 'Trio — one big, two stacked' },
  quad: { panels: 4, label: 'Quad — four equal panels' },
};

// Badge styles. The starburst is the classic yellow burst; the others are the
// extra badges the top covers carry: a WANTED poster box, a gold EST. seal,
// a VOL. ticket and a COLLECTOR'S EDITION ribbon.
export const BADGE_STYLES = {
  starburst: { label: 'Starburst badge' },
  wanted: { label: 'WANTED poster' },
  est: { label: 'EST. seal' },
  vol: { label: 'VOL. ticket' },
  ribbon: { label: "Collector's ribbon" },
};

export const GRADES = {
  original: { label: 'Original — no grade' },
  sunset: { label: 'Sunset — warm dusk grade' },
  neon: { label: 'Neon — magenta and cyan night' },
  noir: { label: 'Noir — black and white, hard contrast' },
};

// Panel rectangles for a layout, in fractions of the canvas, with a gutter
// between them. Panels are numbered in reading order. The photos cover the
// FULL height of the canvas: the title block overlaps the foot of the photos
// on a dark scrim (the look the top covers use), it is never confined to a
// separate strip.
export function layoutPanels(layout, W, H) {
  const g = Math.max(6, Math.round(Math.min(W, H) * 0.012));
  const x0 = g, y0 = g, x1 = W - g, y1 = H - g;
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
// The washes are deliberately strong — deep magenta and violet, high
// contrast — because the top covers all use a heavy, unified grade that
// makes the photos feel like one poster, not a pale pastel tint.
function gradeWash(ctx, W, H, grade) {
  if (grade === 'original') return;
  let top, bottom;
  if (grade === 'sunset') {
    top = ['rgba(255,140,40,0.17)', 'rgba(255,80,30,0.08)'];
    bottom = ['rgba(255,60,120,0.00)', 'rgba(255,30,110,0.44)'];
  } else if (grade === 'neon') {
    top = ['rgba(40,200,255,0.19)', 'rgba(140,60,255,0.11)'];
    bottom = ['rgba(255,0,160,0.00)', 'rgba(255,0,160,0.42)'];
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

// The production footer strip along the very bottom edge, when shown.
// Kept small (5% of the height) so the title block still dominates.
export function footerHeight(H, state) {
  return state.showFooter === false ? 0 : Math.round(H * 0.05);
}

// Measures the title block (sizing + wrapping + position) without drawing
// it, so the panel labels can be placed around it. Returns the geometry the
// draw step needs.
export function measureTitleBlock(ctx, W, H, state) {
  const text = (state.caption || '').trim().toUpperCase();
  const script = (state.subtitle || '').trim();
  const tag = (state.tagline || '').trim();
  const maxW = W * 0.92;
  // Title size: ~16% of the cover height at 100%, so the whole block
  // (title + script + tagline) lands at roughly a quarter to a third of the
  // frame. The captionScale slider still scales it.
  let size = Math.round(H * 0.16 * (state.captionScale || 1));
  const font = (s) => `900 ${s}px Anton, 'Arial Narrow', sans-serif`;
  let lines = [];
  if (text) {
    while (size > 18) {
      lines = wrapCaption(ctx, text, maxW, font(size));
      if (lines.length <= 1) break;
      size = Math.round(size * 0.92);
    }
    lines = wrapCaption(ctx, text, maxW, font(size));
  }
  const lineH = Math.round(size * 1.0);
  const scriptSize = Math.round(size * 0.42);
  const tagSize = Math.round(size * 0.22);
  const pad = Math.round(H * 0.02);
  const blockH = lines.length * lineH + (script ? Math.round(scriptSize * 1.5) : 0) + (tag ? Math.round(tagSize * 1.9) : 0);
  const fH = footerHeight(H, state);
  const pos = state.captionPos === 'center' ? 'center' : state.captionPos === 'top' ? 'top' : 'bottom';
  const topY = pos === 'top' ? pad
    : pos === 'center' ? Math.round((H - fH - blockH) / 2)
    : H - pad - fH - blockH;
  return { text, script, tag, size, font, lines, lineH, scriptSize, tagSize, pad, blockH, pos, topY, footerH: fH };
}

// The title block: the dominant element of the cover, and it must READ as
// dominant — about a quarter to a third of the cover height. A giant Anton
// title with a gradient fill and a thick dark outline, overlapping the foot
// of the photos on a dark scrim (never confined to a separate strip), a big
// pink-neon script subtitle beneath it, and a yellow caps tagline. The title
// is kept to ONE line whenever it fits: the wrap loop shrinks the size until
// it does, so the title stays huge in every export size.
export function drawTitleBlock(ctx, W, H, state) {
  const g = measureTitleBlock(ctx, W, H, state);
  const { text, script, tag, size, font, lines, lineH, scriptSize, tagSize, pad, blockH, pos, topY } = g;
  if (!text && !script && !tag) return;
  // Dark scrim behind the block so the giant letters read over any photo.
  const scrim = ctx.createLinearGradient(0, topY - pad, 0, topY + blockH + pad);
  if (pos === 'top') {
    scrim.addColorStop(0, 'rgba(5,2,10,0.78)');
    scrim.addColorStop(1, 'rgba(5,2,10,0)');
  } else if (pos === 'center') {
    // Centre: fade in and out on both sides, dark through the middle, so
    // the title reads as one band across the poster's heart.
    scrim.addColorStop(0, 'rgba(5,2,10,0)');
    scrim.addColorStop(0.22, 'rgba(5,2,10,0.82)');
    scrim.addColorStop(0.78, 'rgba(5,2,10,0.82)');
    scrim.addColorStop(1, 'rgba(5,2,10,0)');
  } else {
    scrim.addColorStop(0, 'rgba(5,2,10,0)');
    scrim.addColorStop(1, 'rgba(5,2,10,0.82)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, topY - pad, W, blockH + pad * 2);
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
  // Script subtitle in big pink neon, just under the title — the top covers
  // all carry a large glowing script line beneath the giant title.
  if (script) {
    ctx.font = `${scriptSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff8ae2';
    ctx.shadowColor = 'rgba(255,47,216,0.85)';
    ctx.shadowBlur = Math.round(scriptSize * 0.45);
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

// A yellow starburst badge with dark text, tilted, in the cover's top-left
// corner. Top-left on purpose: in multi-panel layouts the top-right corner
// can hold a portrait's face (the hero panel), while the top-left sits over
// sky or street in the usual shots. The tilt is mirrored from the old
// top-right placement so the starburst still leans into the cover.
// Pure canvas path, no image. It sits below the quote strip when the strip
// is shown, so it never covers the review line.
function drawStarburst(ctx, W, H, state) {
  const label = (state.badgeText || '').trim().toUpperCase();
  if (!label) return;
  const r = Math.round(Math.min(W, H) * 0.085);
  const cx = r + Math.round(W * 0.02);
  const cy = r + Math.round(H * 0.025) + quoteHeight(H, state);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.14);
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

// A WANTED poster box in the top-right corner: cream paper, black border,
// "WANTED" in big Anton and five red stars beneath. Small enough to sit over
// sky or street, never over the title block. It sits below the quote strip
// when the strip is shown.
function drawWanted(ctx, W, H, state) {
  const m = Math.round(Math.min(W, H) * 0.02);
  const bw = Math.round(Math.min(W, H) * 0.19);
  const bh = Math.round(bw * 0.58);
  const x = W - bw - m, y = m + quoteHeight(H, state);
  ctx.save();
  ctx.fillStyle = '#f5eeda';
  ctx.strokeStyle = '#14060f';
  ctx.lineWidth = Math.max(3, Math.round(bw * 0.02));
  ctx.fillRect(x, y, bw, bh);
  ctx.strokeRect(x, y, bw, bh);
  ctx.strokeStyle = 'rgba(20,6,15,0.55)';
  ctx.lineWidth = Math.max(1, Math.round(bw * 0.006));
  ctx.strokeRect(x + bw * 0.05, y + bh * 0.08, bw * 0.9, bh * 0.84);
  ctx.fillStyle = '#14060f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(bw * 0.21)}px Anton, sans-serif`;
  ctx.fillText('WANTED', x + bw / 2, y + bh * 0.34);
  ctx.fillStyle = '#b3001b';
  ctx.font = `${Math.round(bw * 0.16)}px sans-serif`;
  ctx.fillText('★★★★★', x + bw / 2, y + bh * 0.72);
  ctx.restore();
}

// A gold EST. seal in the top-left corner: a gold ring with a dark centre
// reading EST. / 2026. It sits below the quote strip when the strip is shown.
function drawEstSeal(ctx, W, H, state) {
  const r = Math.round(Math.min(W, H) * 0.075);
  const cx = r + Math.round(W * 0.02);
  const cy = r + Math.round(H * 0.025) + quoteHeight(H, state);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd23e';
  ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(r * 0.06));
  ctx.strokeStyle = '#8a6d00';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = '#14060f';
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(r * 0.3)}px Anton, sans-serif`;
  ctx.fillText('EST.', cx, cy - r * 0.18);
  ctx.font = `900 ${Math.round(r * 0.34)}px Anton, sans-serif`;
  ctx.fillText('2026', cx, cy + r * 0.24);
  ctx.restore();
}

// A black VOL. ticket in the top-right corner: gold text on near-black,
// the volume number taken from the badge text field (default "06").
// It sits below the quote strip when the strip is shown.
function drawVolTicket(ctx, W, H, text, state) {
  const num = (text || '06').trim().toUpperCase() || '06';
  const m = Math.round(Math.min(W, H) * 0.02);
  const bw = Math.round(Math.min(W, H) * 0.16);
  const bh = Math.round(bw * 0.42);
  const x = W - bw - m, y = m + quoteHeight(H, state);
  ctx.save();
  ctx.fillStyle = '#14060f';
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = Math.max(2, Math.round(bw * 0.02));
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, Math.round(bh * 0.25));
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd23e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(bw * 0.2)}px Anton, sans-serif`;
  ctx.fillText('VOL. ' + num, x + bw / 2, y + bh / 2);
  ctx.restore();
}

// A diagonal COLLECTOR'S EDITION ribbon across the top-right corner:
// a hot-pink band at 45 degrees with white Anton text along it. It slides
// below the quote strip when the strip is shown: the band's topmost corner
// must clear the strip's bottom edge, or the ribbon cuts the review line.
function drawRibbon(ctx, W, H, state) {
  const bandH = Math.round(Math.min(W, H) * 0.075);
  const len = Math.round(W * 0.5);
  const qh = quoteHeight(H, state);
  const shift = qh
    ? Math.max(0, qh + Math.round(0.707 * (len / 2 + bandH / 2)) - (len / 2 - bandH))
    : 0;
  ctx.save();
  ctx.translate(W - len / 2, len / 2 - bandH + shift);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ff2e88';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(bandH * 0.2);
  ctx.shadowOffsetY = Math.round(bandH * 0.06);
  ctx.fillRect(-len / 2, -bandH / 2, len, bandH);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(bandH * 0.42)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("COLLECTOR'S EDITION", 0, 0);
  ctx.restore();
}

// Dispatches the badge by style. Starburst and EST. sit top-left (safe over
// sky/street); WANTED, VOL. and the ribbon sit top-right. Every badge sits
// below the quote strip when the strip is shown.
export function drawBadge(ctx, W, H, state) {
  const style = state.badgeStyle || 'starburst';
  if (style === 'wanted') drawWanted(ctx, W, H, state);
  else if (style === 'est') drawEstSeal(ctx, W, H, state);
  else if (style === 'vol') drawVolTicket(ctx, W, H, state.badgeText, state);
  else if (style === 'ribbon') drawRibbon(ctx, W, H, state);
  else drawStarburst(ctx, W, H, state);
}

// Default story label for each bundled sample photo: a character or a place
// plus a time, the way the top covers caption every panel. Uploaded photos
// fall back to their file name, upper-cased; the editor lets the user edit
// any panel's caption.
export const PANEL_LABELS = {
  lifeguard: 'THE LIFEGUARD · 6:12 PM',
  sunset: 'SUNSET BOULEVARD · 7:48 PM',
  neon: 'NEON ROW · 11:42 PM',
  pier: 'THE ANGLER · 5:42 PM',
  boulevard: 'OCEAN DRIVE · 5:42 PM',
  driver: 'THE DRIVER · 9:15 PM',
  rider: 'THE RIDER · 8:03 PM',
  woman: 'THE INSIDER · 7:26 PM',
};

export function defaultPanelLabel(name) {
  if (!name) return '';
  if (PANEL_LABELS[name]) return PANEL_LABELS[name];
  const stem = String(name).replace(/\.[^.]*$/, '').replace(/[_-]+/g, ' ').trim();
  return stem ? stem.toUpperCase().slice(0, 24) : '';
}

// The badge's approximate bounding box, for keeping panel labels clear of
// it. Null when the badge is hidden. The ribbon is a diagonal band, so its
// box is the whole top-right corner zone it crosses.
function badgeRectFor(W, H, state) {
  if (!state.showBadge) return null;
  const min = Math.min(W, H);
  const m = Math.round(min * 0.02);
  const style = state.badgeStyle || 'starburst';
  const qh = quoteHeight(H, state); // every badge sits below the quote strip
  if (style === 'starburst' || style === 'est') {
    const r = Math.round(min * (style === 'est' ? 0.075 : 0.085));
    const cx = r + Math.round(W * 0.02), cy = r + Math.round(H * 0.025) + qh;
    return { x0: 0, y0: qh, x1: cx + r + 8, y1: cy + r + 8 };
  }
  if (style === 'wanted') {
    const bw = Math.round(min * 0.19), bh = Math.round(bw * 0.58);
    return { x0: W - bw - m - 8, y0: qh, x1: W, y1: m + bh + 8 + qh };
  }
  if (style === 'vol') {
    const bw = Math.round(min * 0.16), bh = Math.round(bw * 0.42);
    return { x0: W - bw - m - 8, y0: qh, x1: W, y1: m + bh + 8 + qh };
  }
  if (style === 'ribbon') {
    const qh = quoteHeight(H, state);
    const bandH = Math.round(min * 0.075);
    const len = Math.round(W * 0.5);
    const shift = qh
      ? Math.max(0, qh + Math.round(0.707 * (len / 2 + bandH / 2)) - (len / 2 - bandH))
      : 0;
    return { x0: Math.round(W * 0.5), y0: qh, x1: W, y1: Math.round(min * 0.32) + shift };
  }
  return null;
}

// The quote strip's height, when shown. Shared by the strip, the ribbon
// (which slides below it) and the label-collision zones.
export function quoteHeight(H, state) {
  return (state.showQuote === false || !(state.quote || '').trim())
    ? 0
    : Math.round(H * 0.065);
}

// A five-star review strip across the top of the cover: gold stars, a
// review quote and its source, the way the top covers open with a press
// line. The strip is a dark band so it reads over any photo. Returns its
// zone so panel labels can be pushed below it; null when hidden or empty.
export function drawQuoteStrip(ctx, W, H, state) {
  const quote = (state.quote || '').trim();
  const qh = quoteHeight(H, state);
  if (!qh) return null;
  ctx.save();
  ctx.fillStyle = 'rgba(5,2,10,0.72)';
  ctx.fillRect(0, 0, W, qh);
  ctx.fillStyle = 'rgba(255,210,62,0.6)';
  ctx.fillRect(0, qh - Math.max(2, Math.round(H * 0.002)), W, Math.max(2, Math.round(H * 0.002)));
  const source = (state.quoteSource || '').trim().toUpperCase();
  // Three parts, measured as one centred line: gold stars, the quote in
  // cream italic serif, the source in gold Anton caps.
  let fs = Math.round(qh * 0.4);
  const gap = Math.round(fs * 0.5);
  const totalWidth = (f) => {
    ctx.font = `${Math.round(f * 0.9)}px sans-serif`;
    const starsW = ctx.measureText('★★★★★').width;
    ctx.font = `italic 600 ${f}px Georgia, 'Times New Roman', serif`;
    const quoteW = ctx.measureText(`“${quote}”`).width;
    ctx.font = `900 ${Math.round(f * 0.78)}px Anton, sans-serif`;
    const sourceW = source ? ctx.measureText(`— ${source}`).width : 0;
    return starsW + gap + quoteW + (source ? gap + sourceW : 0);
  };
  while (fs > 10 && totalWidth(fs) > W * 0.92) fs = Math.round(fs * 0.92);
  let x = (W - totalWidth(fs)) / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const cy = qh / 2 + Math.round(fs * 0.05);
  ctx.font = `${Math.round(fs * 0.9)}px sans-serif`;
  ctx.fillStyle = '#ffd23e';
  ctx.fillText('★★★★★', x, cy);
  x += ctx.measureText('★★★★★').width + gap;
  ctx.font = `italic 600 ${fs}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`“${quote}”`, x, cy);
  x += ctx.measureText(`“${quote}”`).width + gap;
  if (source) {
    ctx.font = `900 ${Math.round(fs * 0.78)}px Anton, sans-serif`;
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(`— ${source}`, x, cy);
  }
  ctx.restore();
  return { x0: 0, y0: 0, x1: W, y1: qh };
}

// A production footer along the very bottom edge: an editable credit line
// and a procedural barcode at the right (seeded bars, so every export is
// byte-identical for the same state). The strip sits below the title block,
// which measureTitleBlock already reserves room for.
export function drawFooter(ctx, W, H, state) {
  const fH = footerHeight(H, state);
  if (!fH) return;
  const y0 = H - fH;
  ctx.save();
  ctx.fillStyle = 'rgba(5,2,10,0.78)';
  ctx.fillRect(0, y0, W, fH);
  ctx.fillStyle = 'rgba(255,210,62,0.55)';
  ctx.fillRect(0, y0, W, Math.max(2, Math.round(H * 0.002)));
  const m = Math.round(Math.min(W, H) * 0.02);
  const bw = Math.round(W * 0.085);
  const bh = Math.round(fH * 0.6);
  const bx = W - bw - m;
  const by = y0 + Math.round((fH - bh) / 2);
  // Barcode: white plate, black bars from a seeded generator.
  ctx.fillStyle = '#f5f2e8';
  ctx.fillRect(bx, by, bw, bh);
  let seed = 20261120;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.fillStyle = '#14060f';
  const unit = Math.max(1, bw / 90);
  let x = bx + Math.round(bw * 0.05);
  while (x < bx + bw - Math.round(bw * 0.05)) {
    const wBar = Math.max(1, Math.round((1 + rnd() * 3) * unit));
    const gap = Math.max(1, Math.round((1 + rnd() * 3) * unit));
    if (rnd() > 0.25) ctx.fillRect(x, by + Math.round(bh * 0.06), wBar, Math.round(bh * 0.88));
    x += wBar + gap;
  }
  // Credit line, centred in the space left of the barcode.
  const text = (state.footer || '').trim().toUpperCase();
  if (text) {
    const maxW = bx - m - m;
    let fs = Math.round(fH * 0.34);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    while (fs > 8) {
      ctx.font = `700 ${fs}px 'Arial Narrow', sans-serif`;
      if (ctx.measureText(text.split('').join('\u2009')).width <= maxW) break;
      fs = Math.round(fs * 0.92);
    }
    ctx.font = `700 ${fs}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(text.split('').join('\u2009'), bx / 2, y0 + fH / 2 + Math.round(fs * 0.06));
  }
  ctx.restore();
}

// A small dark pill with white caps text in the top-left corner of a panel
// with a photo. Top-left on purpose: the giant title block covers the foot
// of the photos, so a bottom label would collide with it. Collisions are
// handled by pushing the pill down when it fits in the panel, sliding it
// sideways away from a corner obstacle when it does not, and skipping it
// only when neither works — a half-hidden label is worse than none.
function drawPanelLabels(ctx, rects, panels, opts) {
  const obstacles = [opts?.quoteZone, opts?.badgeRect].filter(Boolean);
  const title = opts?.titleZone || null;
  const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  rects.forEach((rect, i) => {
    const panel = panels[i] || {};
    if (!panel.photo) return;
    const label = (panel.caption || '').trim();
    if (!label) return;
    const fs = Math.max(11, Math.min(26, Math.round(Math.min(rect.w, rect.h) * 0.06)));
    ctx.save();
    ctx.font = `900 ${fs}px Anton, sans-serif`;
    const tw = ctx.measureText(label.toUpperCase()).width;
    const px = Math.round(fs * 0.55), py = Math.round(fs * 0.32);
    const inset = Math.round(Math.min(rect.w, rect.h) * 0.03);
    let x = rect.x + inset;
    let y = rect.y + inset;
    const w = tw + px * 2, h = fs + py * 2;
    const box = () => ({ x0: x, y0: y, x1: x + w, y1: y + h });
    const fitsBelow = (zone) => zone.y1 + 8 + h <= rect.y + rect.h - 4;
    // Clear of the title block's scrim zone: push below it when it fits
    // (this is what lets bottom-row labels survive a centre title), skip
    // when it does not (e.g. the key-art bottom strip under a bottom title).
    if (title && overlaps(box(), title)) {
      if (fitsBelow(title)) y = title.y1 + 8;
      else { ctx.restore(); return; }
    }
    // Clear of each obstacle (quote strip, badge): push below when it fits,
    // otherwise slide sideways away from it.
    for (const ob of obstacles) {
      if (!overlaps(box(), ob)) continue;
      if (fitsBelow(ob)) y = ob.y1 + 8;
      else if (ob.x0 <= 0) x = ob.x1 + 8;
      else x = ob.x0 - 8 - w;
    }
    // A slide may have pushed the pill back into the title zone; skip if
    // it is still colliding.
    if (title && overlaps(box(), title)) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = 'rgba(8,3,12,0.72)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.round(h * 0.3));
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.toUpperCase(), x + px, y + h / 2);
    ctx.restore();
  });
}

// Comic halftone dots over the whole cover: a repeating dot screen at low
// alpha, the print texture of classic poster art.
let halftonePattern = null;
export function halftone(ctx, W, H) {
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
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = halftonePattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Renders the whole cover. `state` carries layout, grade, size, caption,
// subtitle, tagline, badgeText, badgeStyle, showBadge, halftone,
// showPanelLabels, captionPos, captionScale, outline, textStyle, quote,
// quoteSource, showQuote, footer, showFooter, and
// panels: an array of { photo, zoom, ox, oy, caption } where photo is an
// image element or null.
// A panel with no photo gets a deep purple placeholder with its number.
export function renderCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const W = size.w, H = size.h;
  ctx.fillStyle = '#0d0b12';
  ctx.fillRect(0, 0, W, H);
  const rects = layoutPanels(state.layout, W, H);
  const noir = state.grade === 'noir';
  const panels = (state.panels || []).map((p) => p || {});
  rects.forEach((rect, i) => {
    const panel = panels[i] || {};
    if (panel.photo) {
      // A heavy, unified grade: saturate + contrast on the photo itself,
      // on top of the wash painted later, so the panels feel like one poster.
      if (noir) ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.04)';
      else if (state.grade === 'sunset' || state.grade === 'neon') ctx.filter = 'saturate(1.28) contrast(1.07)';
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
  if (state.halftone) halftone(ctx, W, H);
  vignette(ctx, W, H);
  // The quote strip sits at the very top; its zone pushes panel labels
  // below it, the same way the badge does.
  const quoteZone = drawQuoteStrip(ctx, W, H, state);
  // Panel labels go on before the title block (so the scrim never washes
  // them), but they must stay clear of the quote strip, the badge and the
  // title zone.
  const titleGeo = measureTitleBlock(ctx, W, H, state);
  const titleZone = titleGeo.pos === 'top'
    ? { x0: 0, y0: 0, x1: W, y1: titleGeo.topY + titleGeo.blockH + titleGeo.pad }
    : titleGeo.pos === 'center'
    ? { x0: 0, y0: titleGeo.topY - titleGeo.pad, x1: W, y1: titleGeo.topY + titleGeo.blockH + titleGeo.pad }
    : { x0: 0, y0: titleGeo.topY - titleGeo.pad, x1: W, y1: H };
  if (state.showPanelLabels !== false) {
    drawPanelLabels(ctx, rects, panels, { badgeRect: badgeRectFor(W, H, state), titleZone, quoteZone });
  }
  drawTitleBlock(ctx, W, H, state);
  drawFooter(ctx, W, H, state);
  if (state.showBadge) drawBadge(ctx, W, H, state);
}
