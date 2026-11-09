/* ==========================================================
   Layout: header, lesson posters, hand-cut titles, pager.
   Every page sets <body data-root="../" data-section="theory" data-lesson="staff">.
   Lesson pages load js/posters.js before this file.
   ========================================================== */

const LESSONS = [
  { slug: 'staff', title: 'Нотный стан и ключи', desc: 'Пять линеек, скрипичный и басовый ключ, где записывается гитара.', film: 'psycho', filmName: 'в духе «Психо»' },
  { slug: 'notes', title: 'Названия нот', desc: 'Семь нот, октавы, тон и полутон, диезы и бемоли.', film: 'clockwork', filmName: 'в духе «Заводного апельсина»' },
  { slug: 'rhythm', title: 'Длительности и ритм', desc: 'Целые, половинные, четверти, восьмые. Такт и размер.', film: 'whiplash', filmName: 'в духе «Одержимости»' },
  { slug: 'intervals', title: 'Интервалы', desc: 'Расстояние между двумя нотами: от секунды до октавы.', film: 'alien', filmName: 'в духе «Чужого»' },
  { slug: 'scales', title: 'Гаммы', desc: 'Мажор, минор, пентатоника — из чего они строятся.', film: 'shining', filmName: 'в духе «Сияния»' },
  { slug: 'chords', title: 'Аккорды', desc: 'Трезвучия, септаккорды и аккорды тональности.', film: 'anatomy', filmName: 'в духе «Анатомии убийства»' },
  { slug: 'fretboard', title: 'Ноты на грифе', desc: 'Как быстро находить любую ноту, гаммы и аккорды на гитаре.', film: 'odyssey', filmName: 'в духе «Космической одиссеи 2001»' },
];

const GAMES = [
  { slug: 'guess-note', title: 'Угадай ноту', desc: 'На грифе отмечен лад — назови ноту.', film: 'suspects', filmName: 'в духе «Подозрительных лиц»' },
  { slug: 'find-note', title: 'Найди на грифе', desc: 'Дана нота и струна — нажми нужный лад.', film: 'nxnw', filmName: 'в духе «К северу через северо-запад»' },
  { slug: 'read-staff', title: 'Читай ноты', desc: 'Нота на нотном стане — назови её и найди на гитаре.', film: 'metropolis', filmName: 'в духе «Метрополиса»' },
];

/** Colour theme for a list card: film theme, or one of three Bass colourways. */
const reelTheme = (film, i) => (film ? 't-' + film : 't-bass' + ((i % 3) + 1));

/**
 * Hand-cut lettering: every letter slightly rotated and shifted, like Saul Bass titles.
 * Seeded by the text, so a title always looks the same. Keeps child elements (e.g. <span class="dark">).
 */
function cutLetters(el, strength = 1) {
  const rnd = seededRandom(el.textContent);
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) { walk(child); return; }
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const word = document.createElement('span');
        word.className = 'cutword';
        [...part].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'cutletter';
          s.textContent = ch;
          const rot = ((rnd() - 0.5) * 9 * strength).toFixed(1);
          const dy = ((rnd() - 0.5) * 0.08 * strength).toFixed(3);
          s.style.transform = `rotate(${rot}deg) translateY(${dy}em)`;
          word.append(s);
        });
        frag.append(word);
      });
      child.replaceWith(frag);
    });
  };
  el.setAttribute('aria-label', el.textContent.trim());
  walk(el);
}

function renderHeader() {
  const root = document.body.dataset.root || '';
  const section = document.body.dataset.section || '';
  const current = name => (section === name ? ' aria-current="true"' : '');
  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `
    <div class="topbar-inner">
      <a class="brand" href="${root}index.html"><span class="brand-mark">♪</span>Гриф и ноты</a>
      <nav class="mainnav">
        <a href="${root}theory/index.html"${current('theory')}>Теория</a>
        <a href="${root}games/index.html"${current('games')}>Игры</a>
      </nav>
      <div class="topbar-tools">
        <div class="seg" data-key="notation" title="Главные названия нот">
          <button data-val="ru">До Ре Ми</button><button data-val="en">C D E</button>
        </div>
        <button class="toggle" data-key="dual" title="Показывать второе название мелко рядом">Оба</button>
        <button class="toggle" data-key="sound">♪ Звук</button>
      </div>
    </div>`;
  document.body.prepend(header);
  bindControls(header);
}

/** Wrap the lesson's crumbs, title and lead into its film poster. */
function renderLessonPoster() {
  const slug = document.body.dataset.lesson;
  if (!slug || typeof POSTERS === 'undefined') return;
  const i = LESSONS.findIndex(l => l.slug === slug);
  const lesson = LESSONS[i];
  const film = lesson.film || 'bass';
  const def = POSTERS[film];
  if (lesson.film) setFilm(lesson.film);

  const crumbs = $('.crumbs');
  if (crumbs) crumbs.innerHTML = `<a href="index.html">Теория</a> · Урок ${i + 1} из ${LESSONS.length}`;

  const poster = document.createElement('section');
  poster.className = `poster poster--${film}`;
  poster.innerHTML = `<div class="poster-art">${def.art()}</div>`;
  [crumbs, $('main > h1'), $('main > .lead')].forEach(el => el && poster.append(el));
  const tag = document.createElement('p');
  tag.className = 'tagline';
  tag.textContent = (lesson.filmName ? lesson.filmName + ' · ' : '') + def.tagline;
  poster.append(tag);
  $('main').prepend(poster);
  if (def.cutTitle) cutLetters($('h1', poster));
}

/** Same idea for a game page (<body data-game="guess-note">): crumbs + title + stats go into the poster. */
function renderGamePoster() {
  const slug = document.body.dataset.game;
  if (!slug || typeof POSTERS === 'undefined') return;
  const game = GAMES.find(g => g.slug === slug);
  const def = POSTERS[game.film];
  setFilm(game.film);

  const poster = document.createElement('section');
  poster.className = `poster poster--game poster--${game.film}`;
  poster.innerHTML = `<div class="poster-art">${def.art()}</div>`;
  // Title goes into the poster; the score stays below it, next to the settings.
  [$('main > .crumbs'), $('.game-head h1')].forEach(el => el && poster.append(el));
  const tag = document.createElement('p');
  tag.className = 'tagline';
  tag.textContent = `${game.filmName} · ${def.tagline}`;
  poster.append(tag);
  $('main').prepend(poster);
  if (def.cutTitle) cutLetters($('h1', poster), 0.8);
}

/** Switch the page to a film's colours and draw its graphics in the side margins. */
function setFilm(film) {
  document.documentElement.dataset.film = film;
  const backdrop = typeof BACKDROPS !== 'undefined' && BACKDROPS[film];
  if (!backdrop) return;
  const { left, right } = backdrop();
  const bg = document.createElement('div');
  bg.className = 'film-bg';
  bg.setAttribute('aria-hidden', 'true');
  const side = (cls, inner) =>
    `<svg class="${cls}" viewBox="0 0 200 900" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  bg.innerHTML = side('bg-left', left) + side('bg-right', right);
  document.body.prepend(bg);

  // Gentle parallax: the side graphics drift slower than the page.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const svgs = $$('svg', bg);
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = -window.scrollY * 0.12;
      svgs.forEach((s, i) => { s.style.transform = `translateY(${(i ? y * 1.4 : y).toFixed(1)}px)`; });
      ticking = false;
    });
  }, { passive: true });
}

/** Prev / next links at the bottom of a lesson; also marks the lesson as visited. */
function renderLessonPager() {
  const slug = document.body.dataset.lesson;
  if (!slug) return;
  const i = LESSONS.findIndex(l => l.slug === slug);
  store.visited[slug] = true;
  saveStore();

  const prev = LESSONS[i - 1];
  const next = LESSONS[i + 1];
  const pager = document.createElement('nav');
  pager.className = 'pager';
  pager.innerHTML =
    (prev ? `<a href="${prev.slug}.html"><small>← Урок ${i}</small>${prev.title}</a>` : '') +
    (next ? `<a class="next" href="${next.slug}.html"><small>Урок ${i + 2} →</small>${next.title}</a>`
          : `<a class="next" href="../games/index.html"><small>Дальше →</small>Закрепить в играх</a>`);
  $('main').append(pager);
}

renderHeader();
renderLessonPoster();
renderGamePoster();
renderLessonPager();
$$('.page > h1').forEach(h => cutLetters(h, 0.7));
