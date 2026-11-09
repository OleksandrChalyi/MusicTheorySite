/* ==========================================================
   Shared game helpers: score bar, feedback, answer buttons.
   ========================================================== */

class Score {
  /** gameId is used to store the best streak; el gets the stats markup. */
  constructor(gameId, el) {
    this.gameId = gameId;
    this.el = el;
    this.streak = 0;
    this.total = 0;
    this.correct = 0;
    this.render();
  }

  record(ok) {
    this.total++;
    if (ok) {
      this.correct++;
      this.streak++;
      if (this.streak > (store.best[this.gameId] || 0)) store.best[this.gameId] = this.streak;
    } else {
      this.streak = 0;
    }
    saveStore();
    this.render();
  }

  render() {
    const acc = this.total ? Math.round((this.correct / this.total) * 100) + '%' : '—';
    this.el.innerHTML = `
      <div class="stat"><b>${this.streak}</b><small>серия</small></div>
      <div class="stat"><b>${store.best[this.gameId] || 0}</b><small>рекорд</small></div>
      <div class="stat"><b>${acc}</b><small>точность</small></div>`;
  }
}

/** Feedback markup after an answer. */
function verdictHtml(ok, text, showNext) {
  return `<span class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'Верно!' : 'Мимо'}</span>` +
    `<p>${text}</p>` +
    (showNext ? '<button class="next-btn" data-next>Дальше →</button>' : '');
}

/**
 * Answer buttons. options: [{ value, label, sharp? }].
 * After an answer pass state { correct, picked } to colour them.
 */
function answerButtons(options, state) {
  return options.map(o => {
    let cls = 'answer' + (o.sharp ? ' sharp' : '');
    if (state) {
      if (o.value === state.correct) cls += ' right';
      else if (o.value === state.picked) cls += ' wrong';
    }
    return `<button class="${cls}" data-answer="${o.value}" ${state ? 'disabled' : ''}><span>${o.label}</span></button>`;
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

/** Candidate fret positions according to the game settings. */
function fretCandidates() {
  const out = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= settings.maxFret; f++) {
      const pc = (OPEN_STRINGS[s] + f) % 12;
      if (settings.natural && !NATURAL_PCS.includes(pc)) continue;
      out.push({ s, f, pc });
    }
  }
  return out;
}

/** Pick the next fret position, avoiding a repeat and preferring weak spots. */
function nextFretPosition(prev) {
  let c = fretCandidates();
  if (prev && c.length > 1) c = c.filter(x => !(x.s === prev.s && x.f === prev.f));
  return weightedPick(c, x => itemWeight(store.fret[x.s + '-' + x.f]));
}
