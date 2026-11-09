/* ==========================================================
   Staff: sheet music via VexFlow, plus a small piano keyboard.

   Declarative examples in lesson HTML:
     <figure class="example" data-clef="treble" data-notes="c/4 e/4 g/4" data-labels>
       <div class="staff"></div><figcaption>Text</figcaption>
     </figure>

   Token syntax inside data-notes (space separated):
     c/4          note (whole note by default, quarter if data-time is set)
     c#/4:h       note with duration: w h q 8 16, "d" suffix = dotted (hd)
     c/4+e/4+g/4  chord
     r:q          rest
     |            bar line
     c/4=Text     custom label under the note ("_" = no label)
   ========================================================== */

const STAFF_COLORS = { accent: '#d1491f', ok: '#1f6f5c', bad: '#c8261d' };
const VEX_ACC = { 1: '#', '-1': 'b', 2: '##', '-2': 'bb' };
const BEATS = { w: 4, h: 2, q: 1, 8: 0.5, 16: 0.25 };

const vexKey = n => 'cdefgab'[n.letter] + (VEX_ACC[n.acc] || '') + '/' + n.octave;

/** Parse data-notes text into staff items. */
function parseItems(text, defaultDur) {
  return text.trim().split(/\s+/).map(token => {
    if (token === '|') return { bar: true };
    let [body, label] = token.split('=');
    let [pitch, dur] = body.split(':');
    dur = dur || defaultDur;
    if (pitch === 'r') return { rest: true, dur, notes: [] };
    return { dur, label, notes: pitch.split('+').map(parseNote) };
  });
}

/**
 * Draw a staff into el.
 * spec: { clef: 'treble'|'bass'|'treble8'|null, time: '4/4', items: [...], labels: bool }
 * items: { notes: [spelledNote], dur, rest, label, color } or { bar: true }
 */
function drawStaff(el, spec) {
  el._staffSpec = spec;
  watchResize(el);
  const VF = Vex.Flow;
  el.innerHTML = '';

  const scale = spec.scale || 1;
  const width = Math.max(240, Math.floor(el.clientWidth || 320));
  const items0 = spec.items || [];
  const hasLabels = spec.labels || items0.some(i => i.label || i.named);
  const hasDual = settings.dual && (spec.labels || items0.some(i => i.named));
  const height = ((spec.height || 150) + (hasLabels ? 18 : 0) + (hasDual ? 16 : 0)) * scale;
  const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  renderer.resize(width, height);
  const ctx = renderer.getContext();
  ctx.scale(scale, scale);

  const clef = spec.clef === 'treble8' ? 'treble' : spec.clef;
  const stave = new VF.Stave(4, spec.top ?? 10, width / scale - 10);
  if (clef) stave.addClef(clef, 'default', spec.clef === 'treble8' ? '8vb' : undefined);
  if (spec.time) stave.addTimeSignature(spec.time);
  stave.setContext(ctx).draw();

  const items = spec.items || [];
  if (!items.length) return;

  const tickables = items.map(item => (item.bar ? new VF.BarNote() : makeStaveNote(VF, item, clef || 'treble', spec.labels)));

  // Beam eighth/sixteenth notes bar by bar.
  const beams = [];
  let group = [];
  const flush = () => { if (group.length) beams.push(...VF.Beam.generateBeams(group)); group = []; };
  tickables.forEach((t, i) => {
    if (items[i].bar) flush();
    else if (!items[i].rest && /^(8|16)/.test(items[i].dur)) group.push(t);
  });
  flush();

  VF.Formatter.FormatAndDraw(ctx, stave, tickables);
  beams.forEach(b => b.setContext(ctx).draw());
  centerLabels(el, tickables);
}

/**
 * VexFlow guesses text width from its own font metrics, which are off for Oswald and Cyrillic,
 * so labels drift sideways. Re-centre every label exactly under its note head.
 * Labels are drawn as <text> in note order, so we match them in that order.
 */
function centerLabels(el, tickables) {
  const expected = [];
  tickables.forEach(t => (t._labels || []).forEach(text =>
    expected.push({ text, x: t.getAbsoluteX() + t.getGlyphWidth() / 2 })));
  let k = 0;
  el.querySelectorAll('text').forEach(node => {
    if (k < expected.length && node.textContent === expected[k].text) {
      node.setAttribute('x', expected[k].x.toFixed(2));
      node.setAttribute('text-anchor', 'middle');
      k++;
    }
  });
}

function makeStaveNote(VF, item, clef, autoLabels) {
  const dur = item.dur || 'w';
  const dotted = dur.endsWith('d');
  const base = dotted ? dur.slice(0, -1) : dur;
  const keys = item.rest ? [clef === 'bass' ? 'd/3' : 'b/4'] : item.notes.map(vexKey);
  const note = new VF.StaveNote({
    keys,
    duration: base + (dotted ? 'd' : '') + (item.rest ? 'r' : ''),
    clef,
    auto_stem: true,
  });
  if (dotted) VF.Dot.buildAndAttach([note], { all: true });
  if (!item.rest) {
    item.notes.forEach((n, i) => {
      if (n.acc) note.addModifier(new VF.Accidental(VEX_ACC[n.acc]), i);
    });
  }

  // Note names under the note: main name, and the other naming smaller below it ("Соль" / "G").
  const named = !item.rest && (item.named || (item.label === undefined && autoLabels));
  const main = named ? item.notes.map(noteName).join(' ') : item.label;
  note._labels = [];
  if (main && main !== '_') addAnnotation(VF, note, main.replace(/_/g, ' '), 13, 'bold');
  if (named && settings.dual) addAnnotation(VF, note, item.notes.map(altNoteName).join(' '), 11, 'bold', '#c4441c');
  if (item.color) note.setStyle({ fillStyle: item.color, strokeStyle: item.color });
  return note;
}

function addAnnotation(VF, note, text, size, weight, color) {
  const ann = new VF.Annotation(text);
  ann.setFont('Oswald', size, weight);
  ann.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
  if (color) ann.setStyle({ fillStyle: color, strokeStyle: color });
  note.addModifier(ann, 0);
  note._labels.push(text);
}

// Redraw staffs when their width changes (phone rotation, window resize).
const staffResizer = 'ResizeObserver' in window
  ? new ResizeObserver(entries => entries.forEach(e => {
      const el = e.target;
      const w = Math.floor(e.contentRect.width);
      if (el._staffSpec && w && w !== el._staffWidth) { el._staffWidth = w; drawStaff(el, el._staffSpec); }
    }))
  : null;
function watchResize(el) {
  if (staffResizer && !el._watched) { el._watched = true; el._staffWidth = Math.floor(el.clientWidth); staffResizer.observe(el); }
}

/** Play staff items. With a time signature the rhythm is real, otherwise notes go evenly. */
function playItems(items, { clef, time } = {}) {
  const shift = clef === 'treble8' ? -12 : 0; // guitar sounds an octave lower than written
  const secPerBeat = 0.5;
  let t = 0;
  items.forEach(item => {
    if (item.bar) return;
    const midis = item.notes.map(n => n.midi + shift);
    if (midis.length > 1) playChord(midis, t);
    else if (midis.length === 1) pluck(midis[0], t);
    if (time) {
      const dotted = item.dur.endsWith('d');
      t += BEATS[dotted ? item.dur.slice(0, -1) : item.dur] * (dotted ? 1.5 : 1) * secPerBeat;
    } else {
      t += midis.length > 1 ? 0.9 : 0.45;
    }
  });
}

/** Turn every <figure class="example" data-notes> on the page into sheet music with a play button. */
function initExamples(root = document) {
  $$('.example[data-notes]', root).forEach(fig => {
    const time = fig.dataset.time;
    const spec = {
      clef: fig.dataset.clef === 'none' ? null : (fig.dataset.clef || 'treble'),
      time,
      labels: 'labels' in fig.dataset,
      items: parseItems(fig.dataset.notes, time ? 'q' : 'w'),
    };
    const staffEl = $('.staff', fig);
    const draw = () => drawStaff(staffEl, spec);
    draw();
    document.addEventListener('settingschange', draw);

    let cap = $('figcaption', fig);
    if (!cap) { cap = document.createElement('figcaption'); fig.append(cap); }
    if (!('silent' in fig.dataset)) {
      const btn = document.createElement('button');
      btn.className = 'play-btn';
      btn.textContent = '▶ Слушать';
      btn.addEventListener('click', () => playItems(spec.items, spec));
      cap.append(btn);
    }
  });
}

/* ---------- piano keyboard ---------- */

/**
 * SVG piano starting at C of `octave`.
 * opts: { octaves, highlight: [midi], labels: bool, halfSteps: bool }
 */
function drawPiano(opts = {}) {
  const octaves = opts.octaves || 1;
  const startMidi = 12 * ((opts.octave ?? 4) + 1);
  const highlight = new Set(opts.highlight || []);
  const whiteW = 38, whiteH = 130, blackW = 24, blackH = 80;
  const whiteCount = octaves * 7 + 1;
  const width = whiteCount * whiteW + 2;
  const top = opts.halfSteps ? 22 : 2;
  let whites = '', blacks = '', marks = '';

  for (let i = 0; i < whiteCount; i++) {
    const letter = i % 7;
    const midi = startMidi + Math.floor(i / 7) * 12 + LETTER_PC[letter];
    const x = 1 + i * whiteW;
    whites += `<rect class="white${highlight.has(midi) ? ' hl' : ''}" data-midi="${midi}" x="${x}" y="${top}" width="${whiteW}" height="${whiteH}" rx="4"/>`;
    if (opts.labels !== false) {
      whites += `<text x="${x + whiteW / 2}" y="${top + whiteH - (settings.dual ? 24 : 12)}">${letterName(letter)}</text>`;
      if (settings.dual) whites += `<text class="alt-key" x="${x + whiteW / 2}" y="${top + whiteH - 9}">${altLetterName(letter)}</text>`;
    }

    const hasBlack = letter !== 2 && letter !== 6 && i < whiteCount - 1;
    if (hasBlack) {
      const bm = midi + 1;
      blacks += `<rect class="black${highlight.has(bm) ? ' hl' : ''}" data-midi="${bm}" x="${x + whiteW - blackW / 2}" y="${top}" width="${blackW}" height="${blackH}" rx="3"/>`;
    } else if (opts.halfSteps && i < whiteCount - 1) {
      marks += `<text class="step" x="${x + whiteW}" y="14">полутон</text>`;
    }
  }
  return `<svg class="piano" viewBox="0 0 ${width} ${top + whiteH + 2}" role="img" aria-label="Клавиатура фортепиано">${whites}${blacks}${marks}</svg>`;
}

/** Fill every <div class="piano-box" data-highlight="60 62" data-half-steps> and make keys playable. */
function initPianos(root = document) {
  $$('.piano-box', root).forEach(box => {
    const draw = () => {
      box.innerHTML = drawPiano({
        octaves: Number(box.dataset.octaves || 1),
        highlight: (box.dataset.highlight || '').split(/\s+/).filter(Boolean).map(Number),
        halfSteps: 'halfSteps' in box.dataset,
      });
    };
    draw();
    document.addEventListener('settingschange', draw);
    box.addEventListener('click', e => {
      const key = e.target.closest('[data-midi]');
      if (key) pluck(Number(key.dataset.midi));
    });
  });
}
