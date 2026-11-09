/* ==========================================================
   Shared pieces for interactive lesson tools:
   scale / chord formulas and a pill selector.
   steps = [[semitones from root, scale degree], ...]
   ========================================================== */

const SCALES = [
  { name: 'Мажор', steps: [[0, 1], [2, 2], [4, 3], [5, 4], [7, 5], [9, 6], [11, 7], [12, 8]] },
  { name: 'Натуральный минор', minor: true, steps: [[0, 1], [2, 2], [3, 3], [5, 4], [7, 5], [8, 6], [10, 7], [12, 8]] },
  { name: 'Гармонический минор', minor: true, steps: [[0, 1], [2, 2], [3, 3], [5, 4], [7, 5], [8, 6], [11, 7], [12, 8]] },
  { name: 'Мажорная пентатоника', steps: [[0, 1], [2, 2], [4, 3], [7, 5], [9, 6], [12, 8]] },
  { name: 'Минорная пентатоника', minor: true, steps: [[0, 1], [3, 3], [5, 4], [7, 5], [10, 7], [12, 8]] },
  { name: 'Блюзовая', minor: true, steps: [[0, 1], [3, 3], [5, 4], [6, 5], [7, 5], [10, 7], [12, 8]] },
];

const CHORDS = [
  { name: 'Мажорное', symbol: '', steps: [[0, 1], [4, 3], [7, 5]], formula: '4 + 3 полутона' },
  { name: 'Минорное', symbol: 'm', minor: true, steps: [[0, 1], [3, 3], [7, 5]], formula: '3 + 4 полутона' },
  { name: 'Уменьшённое', symbol: 'dim', minor: true, steps: [[0, 1], [3, 3], [6, 5]], formula: '3 + 3 полутона' },
  { name: 'Увеличенное', symbol: 'aug', steps: [[0, 1], [4, 3], [8, 5]], formula: '4 + 4 полутона' },
  { name: 'Доминантсептаккорд', symbol: '7', steps: [[0, 1], [4, 3], [7, 5], [10, 7]], formula: 'мажор + малая септима' },
  { name: 'Большой мажорный септ.', symbol: 'maj7', steps: [[0, 1], [4, 3], [7, 5], [11, 7]], formula: 'мажор + большая септима' },
  { name: 'Минорный септаккорд', symbol: 'm7', minor: true, steps: [[0, 1], [3, 3], [7, 5], [10, 7]], formula: 'минор + малая септима' },
];

/** Degree label like "♭3" for a step. */
function degreeLabel([semis, degree]) {
  const major = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12 }[degree];
  return accSymbol(semis - major) + (degree === 8 ? 1 : degree);
}

/**
 * Render a row of selectable pills.
 * options: [{ value, label, sharp? }], onPick(value) is called on click.
 */
function renderPills(el, options, current, onPick) {
  el.innerHTML = options
    .map(o => `<button class="pill" data-value="${o.value}" aria-pressed="${String(o.value) === String(current)}">${o.label}</button>`)
    .join('');
  el.onclick = e => {
    const b = e.target.closest('[data-value]');
    if (b) onPick(b.dataset.value);
  };
}

/** Root options C … B, spelled for major or minor. */
const rootOptions = minor => [...Array(12).keys()].map(pc => ({ value: pc, label: rootName(pc, minor) }));

/** Whole tone / half tone pattern between consecutive steps: "Т Т П …". */
function stepPattern(steps) {
  const out = [];
  for (let i = 1; i < steps.length; i++) {
    const d = steps[i][0] - steps[i - 1][0];
    out.push(d === 1 ? 'П' : d === 2 ? 'Т' : d === 3 ? 'Т+П' : d + ' пт');
  }
  return out.join(' ');
}
