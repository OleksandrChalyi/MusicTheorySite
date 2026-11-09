/* ==========================================================
   Games: session engine + shared helpers.

   A game is played in sessions of 20 questions. Every answer is timed:
   fast correct answers earn more points. A note is "mastered" after
   3 fast correct answers in a row; master every note of a level and
   the next level opens (e.g. frets 0–4 → 0–7 → 0–12).
   At the end of a session the results screen ("credits") shows the score,
   accuracy, time, slowest notes, mistakes and progress over sessions.
   ========================================================== */

const SESSION_LENGTH = 20;
const FAST_MS = 2000;       // a "fast" answer: counts towards mastery
const MASTERED = 3;         // fast correct answers in a row to master a note

const fmtTime = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' с';

/** 100 points up to 1 s, then −25 per extra second, at least 20 for a correct answer. */
const pointsFor = (ok, ms) => (ok ? Math.max(20, Math.round(100 - Math.max(0, ms - 1000) / 40)) : 0);

class Session {
  /**
   * opts: {
   *   gameId, hud, stage, resultsEl, progressEl,
   *   levels: { setting, values, label(value), keysFor(value) },
   *   onQuestion(focus)   // game shows a new question; focus = Set of keys to train or null
   * }
   */
  constructor(opts) {
    Object.assign(this, { length: SESSION_LENGTH }, opts);
    store.mastery = store.mastery || {};
    store.unlocked = store.unlocked || {};
    store.history = store.history || {};
    store.bestScore = store.bestScore || {};
    this.applyLocks();
  }

  get mastery() { return (store.mastery[this.gameId] = store.mastery[this.gameId] || {}); }
  get history() { return (store.history[this.gameId] = store.history[this.gameId] || []); }
  isMastered(key) { return (this.mastery[key] || 0) >= MASTERED; }

  // ---------- flow ----------
  start(focus = null) {
    this.focus = focus && focus.size ? focus : null;
    this.results = [];
    this.over = false;
    this.points = 0;
    this.lastMs = null;
    this.stage.hidden = false;
    this.resultsEl.hidden = true;
    this.renderHud();
    this.renderProgress();
    this.next();
  }

  next() {
    if (this.over) return; // late auto-advance after the session already ended
    if (this.results.length >= this.length) { this.finish(); return; }
    this.onQuestion(this.focus);
  }

  /** Call when a question is on screen: starts its clock. */
  ask() { this.t0 = performance.now(); }

  /** Record an answer. r: { key, ok, label, given }. Returns { ms, points }. */
  record(r) {
    const ms = Math.round(performance.now() - this.t0);
    const pts = pointsFor(r.ok, ms);
    this.results.push({ ...r, ms, pts });
    this.points += pts;
    this.lastMs = ms;
    const m = this.mastery;
    m[r.key] = r.ok && ms < FAST_MS ? Math.min(MASTERED, (m[r.key] || 0) + 1) : 0;
    saveStore();
    this.renderHud();
    this.renderProgress();
    return { ms, points: pts };
  }

  get finished() { return this.results.length >= this.length; }

  finish() {
    this.over = true;
    const res = this.results;
    const correct = res.filter(r => r.ok);
    const acc = Math.round((correct.length / res.length) * 100);
    const avg = Math.round(res.reduce((a, r) => a + r.ms, 0) / res.length);
    const best = correct.length ? Math.min(...correct.map(r => r.ms)) : null;
    const prevBest = store.bestScore[this.gameId] || 0;
    const isRecord = this.points > prevBest;
    if (isRecord) store.bestScore[this.gameId] = this.points;

    this.history.push({ t: Date.now(), score: this.points, acc, avg });
    if (this.history.length > 30) this.history.splice(0, this.history.length - 30);

    const levelUp = this.checkLevelUp();
    saveStore();
    this.applyLocks();
    this.renderProgress();
    this.renderResults({ acc, avg, best, prevBest, isRecord, levelUp });
  }

  // ---------- levels ----------
  unlockedIndex() {
    const { values } = this.levels;
    const i = values.indexOf(store.unlocked[this.gameId]);
    return i < 0 ? 0 : i;
  }

  /** Every note of the highest open level mastered → open the next level. */
  checkLevelUp() {
    const { values, keysFor, label } = this.levels;
    const i = this.unlockedIndex();
    if (i >= values.length - 1) return null;
    if (!keysFor(values[i]).every(k => this.isMastered(k))) return null;
    store.unlocked[this.gameId] = values[i + 1];
    return label(values[i + 1]);
  }

  /** Lock level buttons that are not open yet; keep the setting inside the open range. */
  applyLocks() {
    const { setting, values } = this.levels;
    const open = this.unlockedIndex();
    if (values.indexOf(settings[setting]) > open) { settings[setting] = values[open]; saveStore(); }
    $$(`.seg[data-key="${setting}"] button`).forEach(b => {
      const idx = values.map(String).indexOf(b.dataset.val);
      const locked = idx > open;
      b.disabled = locked;
      b.classList.toggle('locked', locked);
      b.title = locked ? 'Откроется, когда выучишь все ноты предыдущего уровня' : '';
    });
    syncControls();
  }

  // ---------- rendering ----------
  renderHud() {
    const last = this.lastMs == null ? '—' : fmtTime(this.lastMs);
    this.hud.innerHTML = `
      <div class="stat"><b>${Math.min(this.results.length + (this.finished ? 0 : 1), this.length)}/${this.length}</b><small>сеанс</small></div>
      <div class="stat"><b>${this.points}</b><small>очки</small></div>
      <div class="stat"><b>${last}</b><small>ответ</small></div>`;
  }

  renderProgress() {
    if (!this.progressEl) return;
    const { setting, values, label, keysFor } = this.levels;
    const keys = keysFor(settings[setting]);
    const done = keys.filter(k => this.isMastered(k)).length;
    const open = this.unlockedIndex();
    const nextLabel = values[open + 1] != null ? label(values[open + 1]) : null;
    const goal = done === keys.length
      ? (nextLabel ? `Уровень пройден — новый откроется после сеанса.` : 'Всё выучено. Теперь — на скорость!')
      : (nextLabel ? `Выучи все — дальше откроется: ${nextLabel}.` : 'Выучи все ноты на скорость.');
    this.progressEl.innerHTML = `
      <div class="mastery-text"><b>Выучено ${done} из ${keys.length}</b> · ${label(settings[setting])} · <span class="muted">${goal}</span></div>
      <div class="mastery-bar"><span style="width:${keys.length ? (done / keys.length) * 100 : 0}%"></span></div>
      <div class="mastery-hint">Нота выучена, когда ответишь верно ${MASTERED} раза подряд быстрее ${FAST_MS / 1000} секунд.</div>`;
  }

  renderResults({ acc, avg, best, prevBest, isRecord, levelUp }) {
    const res = this.results;
    const slow = [...res].filter(r => r.ok).sort((a, b) => b.ms - a.ms).slice(0, 5);
    const wrong = res.filter(r => !r.ok);
    const weak = new Set([...wrong, ...res.filter(r => r.ok && r.ms >= FAST_MS)].map(r => r.key));

    const recordLine = isRecord
      ? (prevBest ? `Новый рекорд! +${this.points - prevBest} к прошлому` : 'Первый рекорд поставлен!')
      : `До рекорда ${prevBest - this.points} очков`;

    this.stage.hidden = true;
    const el = this.resultsEl;
    el.hidden = false;
    el.innerHTML = `
      <div class="credits-head">
        <span class="credits-tag">Конец сеанса</span>
        <div class="big-score">${this.points}<small>очков из ${this.length * 100}</small></div>
        <p class="record-line${isRecord ? ' is-record' : ''}">${recordLine}</p>
        ${levelUp ? `<p class="level-up">Новый уровень открыт: ${levelUp}</p>` : ''}
      </div>
      <div class="tiles">
        <div class="tile"><b>${acc}%</b><small>точность</small></div>
        <div class="tile"><b>${fmtTime(avg)}</b><small>среднее время</small></div>
        <div class="tile"><b>${best == null ? '—' : fmtTime(best)}</b><small>самый быстрый</small></div>
      </div>
      <div class="credits-cols">
        <div>
          <h3>Самые медленные</h3>
          ${slow.length ? `<ol class="credit-list">${slow.map(r => `<li><span>${r.label}</span><b>${fmtTime(r.ms)}</b></li>`).join('')}</ol>` : '<p class="muted">Нет верных ответов.</p>'}
        </div>
        <div>
          <h3>Ошибки</h3>
          ${wrong.length ? `<ul class="credit-list">${wrong.map(r => `<li><span>${r.label}</span><b>ты: ${r.given}</b></li>`).join('')}</ul>` : '<p class="muted">Ни одной. Чисто!</p>'}
        </div>
      </div>
      <div class="trend">
        <h3>Последние сеансы</h3>
        ${sparkline(this.history.slice(-10))}
      </div>
      <div class="credits-actions">
        <button class="next-btn" data-restart>Ещё сеанс</button>
        ${weak.size ? `<button class="ghost-btn" data-weak>Тренировать слабые (${weak.size})</button>` : ''}
      </div>`;
    $('[data-restart]', el).onclick = () => this.start();
    const weakBtn = $('[data-weak]', el);
    if (weakBtn) weakBtn.onclick = () => this.start(weak);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Forget mastery, levels and history of this game. */
  resetProgress() {
    store.mastery[this.gameId] = {};
    delete store.unlocked[this.gameId];
    store.history[this.gameId] = [];
    delete store.bestScore[this.gameId];
    saveStore();
    this.applyLocks();
    this.start();
  }
}

/** Score of the last sessions as a small line chart. */
function sparkline(hist) {
  if (hist.length < 2) return '<p class="muted">График появится после второго сеанса.</p>';
  const w = 300, h = 70, pad = 8;
  // Scale between the worst and best session so small improvements are visible.
  const scores = hist.map(x => x.score);
  const lo = Math.max(0, Math.min(...scores) - 50);
  const hi = Math.max(...scores) + 50;
  const pts = hist.map((x, i) => [pad + (i / (hist.length - 1)) * (w - pad * 2), h - pad - ((x.score - lo) / (hi - lo)) * (h - pad * 2)]);
  const line = pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3}"/>`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Очки за последние сеансы"><polyline points="${line}"/>${dots}</svg>
    <p class="muted spark-cap">Очки: от ${Math.min(...hist.map(x => x.score))} до ${Math.max(...hist.map(x => x.score))}. Последняя точка — этот сеанс.</p>`;
}

/** Feedback markup after an answer, with the answer time. */
function verdictHtml(ok, text, showNext, ms) {
  const time = ms == null ? '' : `<span class="time-chip${ok && ms < FAST_MS ? ' fast' : ''}">${fmtTime(ms)}</span>`;
  return `<span class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'Верно!' : 'Мимо'}</span>${time}` +
    `<p>${text}</p>` +
    (showNext ? '<button class="next-btn" data-next>Дальше →</button>' : '');
}

/**
 * Answer buttons. options: [{ value, label, alt?, sharp? }] — alt is the other note name.
 * After an answer pass state { correct, picked } to colour them.
 */
function answerButtons(options, state) {
  return options.map(o => {
    let cls = 'answer' + (o.sharp ? ' sharp' : '');
    if (state) {
      if (o.value === state.correct) cls += ' right';
      else if (o.value === state.picked) cls += ' wrong';
    }
    const altTag = o.alt && settings.dual ? `<span class="alt">${o.alt}</span>` : '';
    return `<button class="${cls}" data-answer="${o.value}" ${state ? 'disabled' : ''}><span>${o.label}</span>${altTag}</button>`;
  }).join('');
}

/** "Reset statistics" with a confirm click. */
function bindReset(btn, onReset) {
  let armed = false;
  const label = btn.textContent;
  btn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      btn.textContent = 'Точно сбросить? Нажми ещё раз';
      setTimeout(() => { armed = false; btn.textContent = label; }, 4000);
      return;
    }
    armed = false;
    onReset();
    saveStore();
    btn.textContent = 'Статистика сброшена';
  });
}

/** Walk-through hint for a missed fret: count from the open string or back from the 12th fret. */
function countPath(s, f) {
  const names = [];
  if (f <= 7) {
    for (let i = 0; i <= f; i++) names.push(pcName(OPEN_STRINGS[s] + i));
    return 'Считай от открытой: ' + names.join(' → ');
  }
  for (let i = 12; i >= f; i--) names.push(pcName(OPEN_STRINGS[s] + i));
  return '12-й лад = открытая струна, назад: ' + names.join(' → ');
}

/* ---------- fretboard games ---------- */

/** Candidate fret positions up to maxFret (respects "only naturals"). */
function fretCandidates(maxFret = settings.maxFret) {
  const out = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const pc = (OPEN_STRINGS[s] + f) % 12;
      if (settings.natural && !NATURAL_PCS.includes(pc)) continue;
      out.push({ s, f, pc });
    }
  }
  return out;
}

const fretKey = x => x.s + '-' + x.f;

/** Levels for fretboard games: frets 0–4, then 0–7, then 0–12. */
const FRET_LEVELS = {
  setting: 'maxFret',
  values: [4, 7, 12],
  label: v => `лады 0–${v}`,
  keysFor: v => fretCandidates(v).map(fretKey),
};

/** Next fret position: no repeat, weak spots more often, only `focus` keys when training weak notes. */
function nextFretPosition(prev, focus) {
  let c = fretCandidates();
  if (focus) {
    const f = c.filter(x => focus.has(fretKey(x)));
    if (f.length) c = f;
  }
  if (prev && c.length > 1) c = c.filter(x => !(x.s === prev.s && x.f === prev.f));
  return weightedPick(c, x => itemWeight(store.fret[fretKey(x)]));
}
