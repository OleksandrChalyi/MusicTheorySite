/* ==========================================================
   Fretboard: SVG guitar neck, frets 0–12.
   ========================================================== */

const FB = {
  nut: 62,          // x of the nut
  fretW: 58,        // width of one fret
  y0: 24,           // y of the 1st string
  stringGap: 30,
  top: 7,
};
FB.bottom = FB.y0 + 5 * FB.stringGap + 17;
FB.width = FB.nut + 12 * FB.fretW + 8;

const stringY = s => FB.y0 + s * FB.stringGap;
const fretCenterX = f => (f === 0 ? 31 : FB.nut + (f - 0.5) * FB.fretW);
const cellX = f => (f === 0 ? 2 : FB.nut + (f - 1) * FB.fretW);
const cellW = f => (f === 0 ? FB.nut - 6 : FB.fretW);

/**
 * Returns SVG markup.
 * opts.marks: [{ s, f, text, kind: 'target'|'ok'|'bad'|'root'|'note' }]
 * opts.maxFret: dim frets above this; opts.activeString: highlight one string;
 * opts.heat: colour cells by past accuracy; opts.clickable: hover cells.
 */
function drawFretboard(opts = {}) {
  const { nut, fretW, top, bottom, width } = FB;
  let h = `<svg class="board${opts.clickable ? ' clickable' : ''}" viewBox="0 0 ${width} 218" role="img" aria-label="Гитарный гриф, лады 0–12">`;
  h += `<rect class="wood" x="${nut}" y="${top}" width="${12 * fretW}" height="${bottom - top}" rx="3"/>`;

  // inlays
  const midY = (stringY(2) + stringY(3)) / 2;
  [3, 5, 7, 9].forEach(f => { h += `<circle class="inlay" cx="${fretCenterX(f)}" cy="${midY}" r="6"/>`; });
  h += `<circle class="inlay" cx="${fretCenterX(12)}" cy="${(stringY(1) + stringY(2)) / 2}" r="6"/>`;
  h += `<circle class="inlay" cx="${fretCenterX(12)}" cy="${(stringY(3) + stringY(4)) / 2}" r="6"/>`;

  if (opts.heat) h += heatCells();

  for (let i = 1; i <= 12; i++) {
    h += `<line class="fret" x1="${nut + i * fretW}" y1="${top}" x2="${nut + i * fretW}" y2="${bottom}"/>`;
  }
  h += `<rect class="nut" x="${nut - 5}" y="${top}" width="6" height="${bottom - top}"/>`;

  if (opts.maxFret != null && opts.maxFret < 12) {
    h += `<rect class="out" x="${nut + opts.maxFret * fretW + 1}" y="${top}" width="${(12 - opts.maxFret) * fretW}" height="${bottom - top}"/>`;
  }

  for (let s = 0; s < 6; s++) {
    const active = opts.activeString === s;
    const w = active ? 3.2 : (0.9 + s * 0.4).toFixed(2);
    h += `<line class="string${active ? ' active' : ''}" x1="6" y1="${stringY(s)}" x2="${width - 4}" y2="${stringY(s)}" stroke-width="${w}"/>`;
  }

  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 12; f++) {
      h += `<rect class="cell" data-s="${s}" data-f="${f}" x="${cellX(f)}" y="${stringY(s) - FB.stringGap / 2}" width="${cellW(f)}" height="${FB.stringGap}"><title>${stringName(s)}, ${fretName(f)}</title></rect>`;
    }
  }

  (opts.marks || []).forEach(m => {
    const text = String(m.text);
    const size = text.length > 4 ? 9 : text.length > 2 ? 11 : 14;
    h += `<g class="mk ${m.kind}"><circle cx="${fretCenterX(m.f)}" cy="${stringY(m.s)}" r="13"/>` +
         `<text x="${fretCenterX(m.f)}" y="${stringY(m.s) + 0.5}" font-size="${size}">${text}</text></g>`;
  });

  for (let f = 0; f <= 12; f++) h += `<text class="fnum" x="${fretCenterX(f)}" y="212">${f}</text>`;
  return h + '</svg>';
}

function heatCells() {
  let h = '';
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 12; f++) {
      const r = store.fret[s + '-' + f];
      if (!r || r[0] + r[1] === 0) continue;
      const acc = r[0] / (r[0] + r[1]);
      const cls = acc >= 0.8 ? 'heat-good' : acc >= 0.5 ? 'heat-mid' : 'heat-bad';
      h += `<rect class="${cls}" x="${cellX(f) + 2}" y="${stringY(s) - FB.stringGap / 2 + 2}" width="${cellW(f) - 4}" height="${FB.stringGap - 4}" rx="4"/>`;
    }
  }
  return h;
}

/** All places (string, fret 0–12) where a MIDI pitch can be played. */
function guitarSpots(midi) {
  const out = [];
  for (let s = 0; s < 6; s++) {
    const f = midi - OPEN_STRINGS[s];
    if (f >= 0 && f <= 12) out.push({ s, f });
  }
  return out;
}

/** Clicking any fret plays it. */
function enableFretSounds(container) {
  container.addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) pluck(OPEN_STRINGS[+cell.dataset.s] + Number(cell.dataset.f));
  });
}
