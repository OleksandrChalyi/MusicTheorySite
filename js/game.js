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

const ANSWER_KEYS = '1234567890-=';   // keyboard shortcuts for answer buttons 1…12
const STREAK_BONUS_AT = 5; // from this many correct in a row, points ×1.5
const STREAK_MILESTONES = [5, 10, 15, 20];

/** 100 points up to 1 s, then −25 per extra second, at least 20 for a correct answer. */
const pointsFor = (ok, ms) => (ok ? Math.max(20, Math.round(100 - Math.max(0, ms - 1000) / 40)) : 0);

class Session {
  /**
   * opts: {
   *   gameId, hud, stage, resultsEl, progressEl,
   *   levels: { setting, values, label(value), keysFor(value), keyLabel(key) → { name, sub } },
   *   onQuestion(focus)   // game shows a new question; focus = Set of keys to train or null
   * }
   */
  constructor(opts) {
    Object.assign(this, { length: SESSION_LENGTH }, opts);
    store.mastery = store.mastery || {};
    store.unlocked = store.unlocked || {};
    store.history = store.history || {};
    store.bestScore = store.bestScore || {};
    // Top of the play area: strip of 20 rounds + score, always visible while playing.
    this.roundsEl = document.createElement('div');
    this.roundsEl.className = 'rounds';
    this.topEl = document.createElement('div');
    this.topEl.className = 'stage-top';
    this.topEl.append(this.roundsEl, this.hud);
    this.stage.prepend(this.topEl);
    // "Start" card shown before a session: the clock runs only after you press Start.
    this.introEl = document.createElement('div');
    this.introEl.className = 'start-card';
    this.topEl.after(this.introEl);

    document.addEventListener('keydown', e => this.onKey(e));
    // Time spent in another tab does not count.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.hiddenAt = performance.now();
      else if (this.hiddenAt != null) {
        if (this.t0 != null) this.t0 += performance.now() - this.hiddenAt;
        this.hiddenAt = null;
      }
    });
    this.applyLocks();
  }

  get mastery() { return (store.mastery[this.gameId] = store.mastery[this.gameId] || {}); }
  get history() { return (store.history[this.gameId] = store.history[this.gameId] || []); }
  isMastered(key) { return (this.mastery[key] || 0) >= MASTERED; }

  // ---------- flow ----------
  /** New session. With intro: show the Start card first; without: play right away (e.g. "one more"). */
  start(focus = null, { intro = true } = {}) {
    this.focus = focus && focus.size ? focus : null;
    this.results = [];
    this.over = false;
    this.points = 0;
    this.lastMs = null;
    this.streak = 0;
    this.bestStreak = 0;
    this.streakEvent = null;
    this.t0 = null;
    this.stage.hidden = false;
    this.resultsEl.hidden = true;
    this.renderHud();
    this.renderProgress();
    if (intro) {
      this.waiting = true;
      this.stage.classList.add('waiting');
      this.renderIntro();
      this.renderRounds();
    } else {
      this.begin();
    }
  }

  /** Start playing: hide the Start card, bring the whole game into view, first question. */
  begin() {
    this.waiting = false;
    this.stage.classList.remove('waiting');
    this.stage.classList.remove('session-start');
    void this.stage.offsetWidth; // restart the rounds animation
    this.stage.classList.add('session-start');
    clearTimeout(this.introTimer);
    this.introTimer = setTimeout(() => this.stage.classList.remove('session-start'), 1000);
    this.stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.next();
  }

  renderIntro() {
    const keys = this.keysHint || 'Цифры 1–7 на клавиатуре — ответ, пробел — дальше.';
    this.introEl.innerHTML = `
      <span class="credits-tag">${this.focus ? 'Повтор слабых нот' : 'Новый сеанс'}</span>
      <h2>${this.length} нот на время</h2>
      <ul>
        <li>Быстрее ${FAST_MS / 1000} секунд — больше очков и плюс деление ноте.</li>
        <li>${STREAK_BONUS_AT} верных подряд — очки ×1,5.</li>
        <li${this.keysHint ? '' : ' class="keys-hint"'}>${keys}</li>
      </ul>
      <button class="next-btn" data-begin>Старт</button>
      <small>или нажми пробел</small>`;
    $('[data-begin]', this.introEl).onclick = () => this.begin();
  }

  /** Keyboard: Space/Enter = start / next; 1–9, 0, -, = pick the n-th answer button. */
  onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, summary')) return;
    if (this.stage.hidden) return;
    const k = e.key;
    if (this.waiting) {
      if (k === ' ' || k === 'Enter') { e.preventDefault(); this.begin(); }
      return;
    }
    if (k === ' ' || k === 'Enter') {
      const nextBtn = $('[data-next]', this.stage);
      if (nextBtn) { e.preventDefault(); nextBtn.click(); }
      return;
    }
    const idx = ANSWER_KEYS.indexOf(k);
    if (idx < 0) return;
    const btn = $$('.answer', this.stage)[idx];
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  }

  next() {
    if (this.over || this.waiting) return; // late auto-advance after the session already ended
    if (this.results.length >= this.length) { this.finish(); return; }
    this.onQuestion(this.focus);
    this.renderRounds();
  }

  /** Call when a question is on screen: starts its clock. key = the note being asked. */
  ask(key) {
    this.t0 = performance.now();
    this.currentKey = key;
    this.renderProgress();
  }

  /**
   * Record an answer. r: { key, name, ok, label, given }.
   * Returns { ms, points, bonus, ok, fast, name, before, after, streak, milestone } for the feedback.
   */
  record(r) {
    const ms = Math.round(performance.now() - this.t0);
    const fast = r.ok && ms < FAST_MS;

    // streak: correct answers in a row; from 5 in a row points ×1.5
    const prevStreak = this.streak;
    this.streak = r.ok ? this.streak + 1 : 0;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const bonus = this.streak >= STREAK_BONUS_AT;
    const pts = Math.round(pointsFor(r.ok, ms) * (bonus ? 1.5 : 1));
    const milestone = STREAK_MILESTONES.includes(this.streak) ? this.streak : null;
    this.streakEvent = r.ok ? (milestone ? 'milestone' : 'up') : (prevStreak > 0 ? 'broken' : null);

    // mastery of this note: 3 fast correct answers in a row
    const m = this.mastery;
    const before = m[r.key] || 0;
    const after = fast ? Math.min(MASTERED, before + 1) : (before >= MASTERED && r.ok ? before : 0);
    m[r.key] = after;

    this.results.push({ ...r, ms, pts });
    this.points += pts;
    this.lastMs = ms;
    saveStore();
    this.renderHud();
    this.renderRounds();
    this.renderProgress(r.key);
    return { ms, points: pts, bonus, ok: r.ok, fast, name: r.name, before, after, streak: this.streak, milestone };
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
    // Weak-note training only counts for note progress, not for the record and the chart.
    const training = Boolean(this.focus);
    const isRecord = !training && this.points > prevBest;
    if (isRecord) store.bestScore[this.gameId] = this.points;

    if (!training) {
      this.history.push({ t: Date.now(), score: this.points, acc, avg });
      if (this.history.length > 30) this.history.splice(0, this.history.length - 30);
    }

    const levelUp = this.checkLevelUp();
    saveStore();
    this.applyLocks();
    this.renderProgress();
    this.renderResults({ acc, avg, best, prevBest, isRecord, levelUp, bestStreak: this.bestStreak, training });
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
    const ev = this.streakEvent;
    this.streakEvent = null;
    const streakCls = ev === 'milestone' ? ' milestone' : ev === 'up' ? ' bump' : ev === 'broken' ? ' broken' : '';
    const bonus = this.streak >= STREAK_BONUS_AT ? '<em>×1,5</em>' : '';
    this.hud.innerHTML = `
      <div class="stat streak${streakCls}${this.streak >= STREAK_BONUS_AT ? ' hot' : ''}"><b>${this.streak}</b><small>серия ${bonus}</small></div>
      <div class="stat"><b>${this.points}</b><small>очки</small></div>
      <div class="stat"><b>${last}</b><small>ответ</small></div>`;
  }

  /** 20 segments: done (fast / slow / wrong), current, upcoming. */
  renderRounds() {
    const n = this.results.length;
    const segs = [];
    for (let i = 0; i < this.length; i++) {
      const r = this.results[i];
      let cls = 'todo';
      if (r) cls = !r.ok ? 'wrong' : r.ms < FAST_MS ? 'fast' : 'slow';
      else if (i === n && !this.finished) cls = 'current';
      segs.push(`<span class="seg-r ${cls}" style="--d:${i * 25}ms"></span>`);
    }
    const label = this.finished ? 'Сеанс завершён' : `Раунд ${n + 1} из ${this.length}`;
    const mode = this.focus ? `<span class="mode-tag">Повтор слабых нот (${this.focus.size}) · в рекорд не идёт</span>` : '';
    this.roundsEl.innerHTML = `<div class="rounds-label"><b>${label}</b>${mode}</div><div class="rounds-bar">${segs.join('')}</div>`;
  }

  renderProgress(justAnswered) {
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
      <div class="mastery-map">${keys.map(k => this.mapChip(k, k === justAnswered)).join('')}</div>
      <div class="mastery-hint">Каждая нота — три деления. Верно и быстрее ${FAST_MS / 1000} с — плюс деление. Три деления — нота выучена. Ошибка или долгий ответ — деления сгорают.</div>`;
  }

  mapChip(key, flash) {
    const lvl = Math.min(MASTERED, this.mastery[key] || 0);
    const { name, sub } = this.levels.keyLabel(key);
    const pips = [0, 1, 2].map(i => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    const cls = ['map-chip', lvl >= MASTERED ? 'learned' : '', key === this.currentKey && !flash ? 'current' : '', flash ? 'flash' : ''].join(' ');
    return `<span class="${cls}" title="${name} · ${sub}"><b>${name}</b><small>${sub}</small><span class="pips">${pips}</span></span>`;
  }

  renderResults({ acc, avg, best, prevBest, isRecord, levelUp, bestStreak, training }) {
    const res = this.results;
    const slow = [...res].filter(r => r.ok).sort((a, b) => b.ms - a.ms).slice(0, 5);
    const wrong = res.filter(r => !r.ok);
    // weak = notes you got wrong or answered slower than FAST_MS (and haven't mastered)
    const weak = new Set(res.filter(r => (!r.ok || r.ms >= FAST_MS) && !this.isMastered(r.key)).map(r => r.key));

    let recordLine;
    if (training) recordLine = 'Тренировка слабых нот — в рекорд и график не идёт';
    else if (isRecord) recordLine = prevBest ? `Новый рекорд! +${this.points - prevBest} к прошлому` : 'Первый рекорд поставлен!';
    else recordLine = `До рекорда ${prevBest - this.points} очков`;

    this.stage.hidden = true;
    const el = this.resultsEl;
    el.hidden = false;
    el.innerHTML = `
      <div class="credits-head">
        <span class="credits-tag">${training ? 'Конец тренировки' : 'Конец сеанса'}</span>
        <div class="big-score">${this.points}<small>очков</small></div>
        <p class="record-line${isRecord ? ' is-record' : ''}">${recordLine}</p>
        ${levelUp ? `<p class="level-up">Новый уровень открыт: ${levelUp}</p>` : ''}
      </div>
      <div class="tiles">
        <div class="tile"><b>${acc}%</b><small>точность</small></div>
        <div class="tile"><b>${fmtTime(avg)}</b><small>среднее время</small></div>
        <div class="tile"><b>${best == null ? '—' : fmtTime(best)}</b><small>самый быстрый</small></div>
        <div class="tile"><b>${bestStreak}</b><small>лучшая серия</small></div>
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
      <div class="credits-bottom">
        <div class="trend">
          <h3>Последние сеансы</h3>
          ${sparkline(this.history.slice(-10))}
        </div>
        ${this.sessionNotesHtml()}
      </div>
      <div class="credits-actions">
        <div class="action">
          <button class="next-btn" data-restart>Новый сеанс</button>
          <small>20 нот всего уровня. Идёт в рекорд.</small>
        </div>
        ${weak.size ? `
        <div class="action">
          <button class="ghost-btn" data-weak>Повторить слабые ноты (${weak.size})</button>
          <small>Только ноты, где ты ошибся или думал дольше ${FAST_MS / 1000} с. Деления нот растут, в рекорд не идёт.</small>
        </div>` : ''}
      </div>`;
    $('[data-restart]', el).onclick = () => this.start(null, { intro: false });
    const weakBtn = $('[data-weak]', el);
    if (weakBtn) weakBtn.onclick = () => this.start(weak, { intro: false });
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Dark box: every note of this session — how often you got it, its pips, what is left to master it. */
  sessionNotesHtml() {
    const byKey = new Map();
    this.results.forEach(r => {
      const e = byKey.get(r.key) || { key: r.key, total: 0, right: 0 };
      e.total++;
      if (r.ok) e.right++;
      byKey.set(r.key, e);
    });
    // Only notes you got right at least once (mistakes are listed separately); closest to "learned" first.
    const rows = [...byKey.values()]
      .filter(e => e.right > 0)
      .map(e => ({ ...e, lvl: Math.min(MASTERED, this.mastery[e.key] || 0), ...this.levels.keyLabel(e.key) }))
      .sort((a, b) => b.lvl - a.lvl || b.right - a.right);
    const learned = rows.filter(r => r.lvl >= MASTERED).length;
    const items = rows.map(r => {
      const pips = [0, 1, 2].map(i => `<i class="${i < r.lvl ? 'on' : ''}"></i>`).join('');
      const left = MASTERED - r.lvl;
      const status = r.lvl >= MASTERED ? '<em class="ok">выучена</em>' : `<em>ещё ${left} ${left === 1 ? 'быстрый ответ' : 'быстрых ответа'}</em>`;
      return `<li><span class="nm"><b>${r.name}</b><small>${r.sub}</small></span><span class="hit">×${r.right}</span><span class="pips">${pips}</span>${status}</li>`;
    }).join('');
    return `
      <div class="session-notes">
        <h3>Угаданные ноты <span>${learned} из ${rows.length} выучены</span></h3>
        ${rows.length ? `<ul>${items}</ul>` : '<p class="sn-hint">В этом сеансе пока ни одной угаданной ноты.</p>'}
        <p class="sn-hint">«×2» — угадал 2 раза за сеанс. Деления — прогресс ноты: 3 быстрых верных ответа подряд, и она выучена.</p>
      </div>`;
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

/**
 * Feedback after an answer: stamp, time, the note's mastery pips, text.
 * rec = what Session.record() returned (or null).
 */
function verdictHtml(ok, text, showNext, rec) {
  const time = rec ? `<span class="time-chip${rec.fast ? ' fast' : ''}">${fmtTime(rec.ms)}${rec.bonus ? ' · ×1,5' : ''}</span>` : '';
  return `<span class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'Верно!' : 'Мимо'}</span>${time}${rec ? masteryHtml(rec) : ''}` +
    `<p>${text}</p>` +
    (showNext ? '<button class="next-btn" data-next>Дальше →</button>' : '');
}

/** "Соль ●●○" with an animation for what just happened to this note's progress. */
function masteryHtml(rec) {
  const { before, after, name } = rec;
  const pips = [0, 1, 2].map(i => {
    let cls = '';
    if (i < after) cls = i >= before ? 'on new' : 'on';
    else if (i < before) cls = 'lost';
    return `<i class="${cls}"></i>`;
  }).join('');
  let note;
  if (after >= MASTERED && before < MASTERED) note = '<em class="learned-now">Нота выучена!</em>';
  else if (after >= MASTERED) note = '<em>выучена</em>';
  else if (before > 0 && after === 0) note = '<em class="reset">прогресс сгорел</em>';
  else if (rec.ok && !rec.fast) note = `<em>медленно — нужно быстрее ${FAST_MS / 1000} с</em>`;
  else if (after > before) note = `<em>ещё ${MASTERED - after}</em>`;
  else note = '';
  return `<span class="mastery-pips${after >= MASTERED && before < MASTERED ? ' burst' : ''}"><b>${name}</b><span class="pips">${pips}</span>${note}</span>`;
}

/**
 * Answer buttons. options: [{ value, label, alt?, sharp? }] — alt is the other note name.
 * After an answer pass state { correct, picked } to colour them.
 */
function answerButtons(options, state) {
  return options.map((o, i) => {
    let cls = 'answer' + (o.sharp ? ' sharp' : '');
    if (state) {
      if (o.value === state.correct) cls += ' right';
      else if (o.value === state.picked) cls += ' wrong';
    }
    const altTag = o.alt && settings.dual ? `<span class="alt">${o.alt}</span>` : '';
    const key = ANSWER_KEYS[i] ? `<kbd>${ANSWER_KEYS[i]}</kbd>` : '';
    return `<button class="${cls}" data-answer="${o.value}" ${state ? 'disabled' : ''}>${key}<span>${o.label}</span>${altTag}</button>`;
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
  keyLabel: key => {
    const [s, f] = key.split('-').map(Number);
    return { name: pcName(OPEN_STRINGS[s] + f), sub: `${s + 1} стр · ${f}` };
  },
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
