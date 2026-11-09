/* ==========================================================
   Layout: site header, lesson/game catalogue, lesson pager.
   Every page sets <body data-root="../" data-section="theory" data-lesson="staff">.
   ========================================================== */

const LESSONS = [
  { slug: 'staff', title: 'Нотный стан и ключи', desc: 'Пять линеек, скрипичный и басовый ключ, где записывается гитара.' },
  { slug: 'notes', title: 'Названия нот', desc: 'Семь нот, октавы, тон и полутон, диезы и бемоли.' },
  { slug: 'rhythm', title: 'Длительности и ритм', desc: 'Целые, половинные, четверти, восьмые. Такт и размер.' },
  { slug: 'intervals', title: 'Интервалы', desc: 'Расстояние между двумя нотами: от секунды до октавы.' },
  { slug: 'scales', title: 'Гаммы', desc: 'Мажор, минор, пентатоника — из чего они строятся.' },
  { slug: 'chords', title: 'Аккорды', desc: 'Трезвучия, септаккорды и аккорды тональности.' },
  { slug: 'fretboard', title: 'Ноты на грифе', desc: 'Как быстро находить любую ноту, гаммы и аккорды на гитаре.' },
];

const GAMES = [
  { slug: 'guess-note', title: 'Угадай ноту', desc: 'На грифе отмечен лад — назови ноту.', icon: '🎯' },
  { slug: 'find-note', title: 'Найди на грифе', desc: 'Дана нота и струна — нажми нужный лад.', icon: '🔍' },
  { slug: 'read-staff', title: 'Читай ноты', desc: 'Нота на нотном стане — назови её и найди на гитаре.', icon: '🎼' },
];

/** SVG filters used by CSS (filter: url(#rough)) for painterly, brush-like edges. */
function injectFilters() {
  const defs = document.createElement('div');
  defs.innerHTML = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <filter id="rough" x="-10%" y="-30%" width="120%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="3" seed="7"/>
        <feDisplacementMap in="SourceGraphic" scale="10"/>
      </filter>
    </svg>`;
  document.body.prepend(defs.firstElementChild);
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
        <div class="seg" data-key="notation" title="Как называть ноты">
          <button data-val="ru">До Ре Ми</button><button data-val="en">C D E</button>
        </div>
        <button class="toggle" data-key="sound">♪ Звук</button>
      </div>
    </div>`;
  document.body.prepend(header);
  bindControls(header);
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

  const crumbs = $('.crumbs');
  if (crumbs) crumbs.innerHTML = `<a href="index.html">Теория</a> · Урок ${i + 1} из ${LESSONS.length}`;
}

injectFilters();
renderHeader();
renderLessonPager();
