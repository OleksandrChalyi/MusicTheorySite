/* ==========================================================
   Core: music data, note spelling, settings/storage, sound.
   Loaded first on every page (plain script, no modules,
   so the site also works when opened straight from disk).
   ========================================================== */

// ---------- music data ----------
const OPEN_STRINGS = [64, 59, 55, 50, 45, 40]; // MIDI, 1st (thin) ... 6th (thick) string
const NAMES_EN = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NAMES_RU = ['До', 'До♯', 'Ре', 'Ре♯', 'Ми', 'Фа', 'Фа♯', 'Соль', 'Соль♯', 'Ля', 'Ля♯', 'Си'];
const LETTERS_EN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTERS_RU = ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_PCS = LETTER_PC;

// Preferred spelling of a root note: [letter index, accidental]
const MAJOR_ROOTS = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
const MINOR_ROOTS = [[0, 0], [0, 1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [6, -1], [6, 0]];

const INTERVAL_NAMES = [
  'прима', 'малая секунда', 'большая секунда', 'малая терция', 'большая терция',
  'чистая кварта', 'тритон', 'чистая квинта', 'малая секста', 'большая секста',
  'малая септима', 'большая септима', 'октава',
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const mod = (n, m) => ((n % m) + m) % m;

// ---------- settings & storage ----------
const STORE_KEY = 'grif-noty-v1';
const DEFAULT_SETTINGS = {
  notation: 'ru',   // main note names: 'ru' (До Ре Ми) or 'en' (C D E)
  dual: true,       // also show the other naming, smaller, as a learning hint
  sound: true,
  maxFret: 4,
  natural: true,
  heat: false,
  staffRange: 'staff',
  label: 'name',
};

const store = loadStore();
const settings = Object.assign({}, DEFAULT_SETTINGS, store.settings);

function loadStore() {
  const data = { fret: {}, staff: {}, best: {}, visited: {}, settings: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) Object.assign(data, JSON.parse(raw));
  } catch (e) { /* storage unavailable: work without it */ }
  if (typeof data.best !== 'object' || data.best === null) data.best = {}; // old format was a number
  return data;
}

function saveStore() {
  try {
    store.settings = settings;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) { /* ignore */ }
}

/** Change a setting, persist it and tell the page. */
function setSetting(key, value) {
  settings[key] = value;
  saveStore();
  document.dispatchEvent(new CustomEvent('settingschange', { detail: { key } }));
}

/**
 * Wire up .seg (one of several values) and .toggle (on/off) controls inside root.
 * Markup: <div class="seg" data-key="maxFret" data-num><button data-val="4">…</button></div>
 *         <button class="toggle" data-key="sound">…</button>
 */
function bindControls(root = document) {
  $$('.seg[data-key]', root).forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('button[data-val]');
      if (!btn) return;
      const val = 'num' in group.dataset ? Number(btn.dataset.val) : btn.dataset.val;
      setSetting(group.dataset.key, val);
    });
  });
  $$('.toggle[data-key]', root).forEach(btn => {
    btn.addEventListener('click', () => setSetting(btn.dataset.key, !settings[btn.dataset.key]));
  });
  syncControls(root);
}

function syncControls(root = document) {
  $$('.seg[data-key]', root).forEach(group => {
    $$('button[data-val]', group).forEach(b =>
      b.setAttribute('aria-pressed', String(String(settings[group.dataset.key]) === b.dataset.val)));
  });
  $$('.toggle[data-key]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(Boolean(settings[b.dataset.key]))));
}
document.addEventListener('settingschange', () => syncControls());

// ---------- note names ----------
const pcName = pc => (settings.notation === 'ru' ? NAMES_RU : NAMES_EN)[mod(pc, 12)];
const letterName = li => (settings.notation === 'ru' ? LETTERS_RU : LETTERS_EN)[li];
const accSymbol = acc => ({ 1: '♯', '-1': '♭', 2: '𝄪', '-2': '𝄫' })[acc] || '';
const stringName = s => `${s + 1}-я струна`;
const fretName = f => (f === 0 ? 'открытая' : `${f}-й лад`);

/**
 * A spelled note: { letter: 0..6, acc: -2..2, octave }.
 * Octave numbers are scientific: C4 = middle C (до первой октавы).
 */
function makeNote(letter, acc, octave) {
  return { letter, acc, octave, midi: 12 * (octave + 1) + LETTER_PC[letter] + acc };
}

const noteName = n => letterName(n.letter) + accSymbol(n.acc);

/* The other naming system (English when the main one is Russian and vice versa). */
const altPcName = pc => (settings.notation === 'ru' ? NAMES_EN : NAMES_RU)[mod(pc, 12)];
const altLetterName = li => (settings.notation === 'ru' ? LETTERS_EN : LETTERS_RU)[li];
const altNoteName = n => altLetterName(n.letter) + accSymbol(n.acc);

/** Secondary name as a small cut-paper tag, e.g. "Соль [G]"; empty when "Оба" is off. */
const alt = text => (settings.dual ? ` <span class="alt">${text}</span>` : '');

/** Parse "c#/4", "bb/3", "e/5" into a spelled note. */
function parseNote(text) {
  const m = /^([a-g])(##|bb|#|b|n)?\/(-?\d)$/i.exec(text.trim());
  if (!m) throw new Error('Bad note: ' + text);
  const acc = { '#': 1, '##': 2, b: -1, bb: -2 }[m[2]] || 0;
  return makeNote('cdefgab'.indexOf(m[1].toLowerCase()), acc, Number(m[3]));
}

/**
 * Build a scale or chord from a root.
 * steps: [[semitones, degree], ...] e.g. major third = [4, 3].
 * Each note gets the letter of its degree, so spelling is always correct (E♭ not D♯ in C minor).
 */
function buildNotes(rootPc, steps, { minor = false, octave = 4 } = {}) {
  const [rootLetter, rootAcc] = (minor ? MINOR_ROOTS : MAJOR_ROOTS)[rootPc];
  const rootMidi = 12 * (octave + 1) + LETTER_PC[rootLetter] + rootAcc;
  return steps.map(([semis, degree]) => {
    const letterAbs = rootLetter + degree - 1;
    const letter = letterAbs % 7;
    const oct = octave + Math.floor(letterAbs / 7);
    const natural = 12 * (oct + 1) + LETTER_PC[letter];
    return makeNote(letter, rootMidi + semis - natural, oct);
  });
}

const rootName = (pc, minor) => {
  const [letter, acc] = (minor ? MINOR_ROOTS : MAJOR_ROOTS)[pc];
  return letterName(letter) + accSymbol(acc);
};

// ---------- sound: Karplus–Strong plucked string ----------
let audioCtx = null;
let userActed = false;
document.addEventListener('pointerdown', () => { userActed = true; getAudio(); }, { once: true, capture: true });
document.addEventListener('keydown', () => { userActed = true; }, { once: true, capture: true });

function getAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Play one plucked note. midi: pitch, when: delay in seconds. */
function pluck(midi, when = 0) {
  if (!settings.sound || !userActed) return;
  const ctx = getAudio();
  if (!ctx) return;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * 1.8);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(rate / freq));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0;
  for (let i = 0; i < length; i++) {
    const next = (idx + 1) % period;
    data[i] = ring[idx];
    ring[idx] = 0.497 * (ring[idx] + ring[next]);
    idx = next;
  }
  const fade = Math.floor(rate * 0.08);
  for (let i = 0; i < fade; i++) data[length - 1 - i] *= i / fade;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.3;
  src.buffer = buffer;
  src.connect(gain).connect(ctx.destination);
  src.start(ctx.currentTime + when);
}

const playMelody = (midis, gap = 0.35) => midis.forEach((m, i) => pluck(m, i * gap));
const playChord = (midis, when = 0) => midis.forEach((m, i) => pluck(m, when + i * 0.03));

// ---------- adaptive practice ----------
/** Record a right/wrong answer for an item in a stats map. */
function recordResult(map, key, ok) {
  const r = map[key] || [0, 0];
  if (ok) r[0]++; else r[1]++;
  map[key] = r;
}

/** Items you get wrong more often get a higher weight. */
function itemWeight(r = [0, 0]) {
  const errorRate = (r[1] + 1) / (r[0] + r[1] + 2);
  return 0.25 + errorRate * 3;
}

function weightedPick(items, weightOf) {
  const weights = items.map(weightOf);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
