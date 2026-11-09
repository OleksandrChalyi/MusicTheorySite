/* ==========================================================
   Lesson posters: each film homage is drawn in Saul Bass's
   flat cut-paper language. Original compositions only —
   no logos, characters or copied poster art.

   POSTERS[film] = {
     tagline,           // small caps line under the lead
     cutTitle,          // jitter the title letters (hand-cut look)?
     art(),             // full poster background (HTML/SVG string)
     mini(),            // small art for the lesson list card
   }
   ========================================================== */

const POSTERS = {
  bass: {
    tagline: 'Сеанс теории',
    cutTitle: true,
    art: () => `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <circle cx="660" cy="90" r="150" fill="#141210"/>
        <polygon points="520,250 800,215 800,262 532,290" fill="#f1e6cf"/>
        <g fill="#141210"><rect x="0" y="40" width="430" height="5"/><rect x="0" y="58" width="400" height="5"/>
          <rect x="0" y="76" width="445" height="5"/><rect x="0" y="94" width="415" height="5"/><rect x="0" y="112" width="435" height="5"/></g>
      </svg>`,
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><circle cx="210" cy="30" r="70" fill="currentColor" opacity="0.18"/></svg>`,
  },

  // Psycho: grey bars slide in from both sides, settle as the five staff lines
  // and slice the title (mix-blend-mode: difference). Then a cut-paper note drops on.
  psycho: {
    tagline: 'Пять линеек. Один ключ. Никакой пощады.',
    cutTitle: true,
    art: () => {
      const bars = [0, 1, 2, 3, 4].map(i =>
        `<div class="psycho-bar${i % 2 ? ' r' : ''}" style="top:calc(42% + ${i * 27}px);animation-delay:${(i * 0.15).toFixed(2)}s"></div>`).join('');
      return bars + `
        <svg class="psycho-note" style="top:calc(42% - 104px)" viewBox="0 0 76 160" aria-hidden="true">
          <polygon points="48,4 58,2 60,128 50,130" fill="#ece8df"/>
          <polygon points="58,4 76,30 73,56 66,38 59,32" fill="#ece8df"/>
          <polygon points="6,126 28,110 54,116 60,132 44,150 16,152 2,142" fill="#ece8df"/>
        </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="none" aria-hidden="true"><g fill="#d8d3c6" opacity="0.35">
      <rect x="0" y="40" width="240" height="7"/><rect x="40" y="56" width="200" height="7"/><rect x="0" y="72" width="210" height="7"/>
      <rect x="60" y="88" width="180" height="7"/><rect x="0" y="104" width="240" height="7"/></g></svg>`,
  },

  // Alien: black void, a cold crack of light, two notes far apart = an interval as distance.
  alien: {
    tagline: 'В космосе никто не услышит фальшивую ноту',
    cutTitle: false,
    art: () => {
      const rnd = seededRandom('alien');
      let stars = '';
      for (let i = 0; i < 70; i++) {
        stars += `<circle cx="${(rnd() * 800).toFixed(0)}" cy="${(rnd() * 380).toFixed(0)}" r="${(rnd() * 1.3 + 0.3).toFixed(1)}" fill="#cdd8cf" opacity="${(rnd() * 0.6 + 0.2).toFixed(2)}"/>`;
      }
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <defs><filter id="glow" x="-200%" y="-10%" width="500%" height="120%"><feGaussianBlur stdDeviation="9"/></filter></defs>
        <g class="alien-stars">${stars}</g>
        <g class="alien-crack">
          <polygon points="590,0 598,70 586,130 600,200 588,270 597,380 603,380 594,270 606,200 592,130 604,70 596,0" fill="#9be8b9" filter="url(#glow)"/>
          <polygon points="592,0 598,70 588,130 600,200 590,270 598,380 600,380 592,270 603,200 591,130 601,70 594,0" fill="#eafff1"/>
        </g>
        <line x1="482" y1="292" x2="712" y2="96" stroke="#cdd8cf" stroke-width="1.2" stroke-dasharray="3 7" opacity="0.6"/>
        <ellipse cx="476" cy="296" rx="15" ry="11" transform="rotate(-22 476 296)" fill="#cdd8cf"/>
        <ellipse cx="718" cy="92" rx="15" ry="11" transform="rotate(-22 718 92)" fill="#9be8b9"/>
        <text class="alien-label" x="640" y="214" fill="#9be8b9" font-family="Oswald" font-size="13" letter-spacing="5" opacity="0.8">7 ПОЛУТОНОВ</text>
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="176,0 180,60 174,120 181,230 183,230 177,120 183,60 178,0" fill="#9be8b9" opacity="0.8"/>
      <circle cx="140" cy="150" r="5" fill="#cdd8cf"/><circle cx="214" cy="44" r="5" fill="#9be8b9"/></svg>`,
  },

  // A Clockwork Orange: Beethoven, stark white, an orange disc, a black wedge, piano keys cut at an angle.
  clockwork: {
    tagline: 'Немного старого доброго Людвига ван',
    cutTitle: true,
    art: () => {
      let keys = '';
      for (let i = 0; i < 15; i++) keys += `<rect x="${i * 30}" y="0" width="29" height="110" fill="#f4f1ea" stroke="#111" stroke-width="2"/>`;
      [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].forEach(i => { keys += `<rect x="${i * 30 + 20}" y="0" width="18" height="66" fill="#111"/>`; });
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <circle cx="640" cy="140" r="150" fill="#f26a1b"/>
        <polygon points="800,40 800,380 470,380" fill="#111"/>
        <g transform="translate(470 -40) rotate(28)">${keys}</g>
        <text x="770" y="350" text-anchor="end" fill="#f4f1ea" font-family="Oswald" font-weight="500" font-size="14" letter-spacing="6">LUDWIG VAN</text>
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><circle cx="200" cy="40" r="70" fill="#f26a1b"/><polygon points="240,90 240,230 120,230" fill="#111"/></svg>`,
  },

  // Whiplash: yellow, a black drum head, crossed sticks, four beats flashing in tempo.
  whiplash: {
    tagline: 'Не в моём темпе. Ещё раз.',
    cutTitle: true,
    art: () => `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <circle cx="640" cy="150" r="128" fill="#111"/>
        <circle cx="640" cy="150" r="104" fill="none" stroke="#f2c40f" stroke-width="3" opacity="0.5"/>
        <rect x="560" y="-30" width="11" height="260" fill="#f4ecd2" transform="rotate(-32 565 100)"/>
        <rect x="700" y="-30" width="11" height="260" fill="#f4ecd2" transform="rotate(28 705 100)"/>
        <g fill="#111">
          <rect class="beat" x="520" y="310" width="34" height="46"/>
          <rect class="beat" x="572" y="310" width="34" height="46" style="animation-delay:.5s"/>
          <rect class="beat" x="624" y="310" width="34" height="46" style="animation-delay:1s"/>
          <rect class="beat" x="676" y="310" width="34" height="46" style="animation-delay:1.5s"/>
        </g>
        <g fill="#f2c40f" font-family="Oswald" font-weight="700" font-size="22" text-anchor="middle">
          <text x="537" y="341">1</text><text x="589" y="341">2</text><text x="641" y="341">3</text><text x="693" y="341">4</text>
        </g>
      </svg>`,
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><circle cx="190" cy="60" r="60" fill="#111"/>
      <rect x="150" y="0" width="6" height="130" fill="#f4ecd2" transform="rotate(-30 153 65)"/><rect x="220" y="0" width="6" height="130" fill="#f4ecd2" transform="rotate(28 223 65)"/></svg>`,
  },

  // The Shining: hexagonal carpet, and the scale typed over and over like on a typewriter.
  shining: {
    tagline: 'Одни гаммы и никакой игры — и Джек заскучает',
    cutTitle: true,
    art: () => {
      const line = 'до ре ми фа соль ля си до · '.repeat(6);
      let typed = '';
      for (let i = 0; i < 16; i++) typed += `<text x="${(i % 3) * -40}" y="${24 + i * 23}">${line}</text>`;
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <defs>
          <pattern id="carpet" width="60" height="104" patternUnits="userSpaceOnUse">
            <g id="hexcell">
              <path d="M30 0 L60 17 L60 52 L30 69 L0 52 L0 17Z" fill="#d6532a"/>
              <path d="M30 13 L49 24 L49 45 L30 56 L11 45 L11 24Z" fill="#6d2414"/>
              <path d="M30 25 L39 30 L39 39 L30 44 L21 39 L21 30Z" fill="#f1e6cf"/>
            </g>
            <use href="#hexcell" x="-30" y="52"/><use href="#hexcell" x="30" y="52"/>
          </pattern>
        </defs>
        <g fill="#f1e6cf" opacity="0.08" font-family="Courier New, monospace" font-size="17">${typed}</g>
        <polygon points="520,0 800,0 800,380 440,380" fill="url(#carpet)"/>
        <polygon points="520,0 532,0 452,380 440,380" fill="#1d0f0b"/>
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
      <defs><pattern id="carpetMini" width="30" height="52" patternUnits="userSpaceOnUse"><g id="hm"><path d="M15 0 L30 8.5 L30 26 L15 34.5 L0 26 L0 8.5Z" fill="#d6532a"/><path d="M15 9 L22 13 L22 22 L15 26 L8 22 L8 13Z" fill="#6d2414"/></g><use href="#hm" x="-15" y="26"/><use href="#hm" x="15" y="26"/></pattern></defs>
      <polygon points="150,0 240,0 240,230 110,230" fill="url(#carpetMini)"/></svg>`,
  },

  // Anatomy of a Murder: a chord (three notes on one stem) cut into separate pieces.
  anatomy: {
    tagline: 'Разбери аккорд на части — и собери снова',
    cutTitle: true,
    art: () => `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <rect x="430" y="0" width="370" height="380" fill="#e0572a"/>
        <g fill="#141210">
          <polygon points="680,30 696,28 697,96 681,98" transform="rotate(4 690 60)"/>
          <polygon points="681,112 697,110 698,176 682,178" transform="rotate(-3 690 140)"/>
          <polygon points="696,30 744,72 738,108 724,82 698,64"/>
          <polygon points="590,196 626,176 668,184 676,206 650,226 610,228 584,214" transform="translate(-6 10) rotate(-8 630 205)"/>
          <polygon points="606,250 642,230 684,238 692,260 666,280 626,282 600,268" transform="translate(10 4)"/>
          <polygon points="590,304 626,284 668,292 676,314 650,334 610,336 584,322" transform="translate(-14 14) rotate(6 630 312)"/>
        </g>
        <polygon points="0,330 330,316 340,338 4,352" fill="#141210" opacity="0.12"/>
      </svg>`,
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><g fill="currentColor" opacity="0.85">
      <polygon points="196,10 204,10 204,60 196,60"/><polygon points="196,70 204,70 204,110 196,110"/>
      <polygon points="150,118 172,106 196,112 200,124 186,136 160,138 146,130"/><polygon points="160,150 182,138 206,144 210,156 196,168 170,170 156,162"/></g></svg>`,
  },

  // 2001: the guitar neck as a monolith in a white void, planets in alignment, a red eye.
  odyssey: {
    tagline: 'Гриф: одиссея на двенадцать ладов',
    cutTitle: false,
    art: () => {
      let frets = '';
      for (let i = 1; i <= 12; i++) frets += `<rect x="606" y="${62 + i * 21}" width="64" height="2" fill="#3a3a3a"/>`;
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <circle cx="638" cy="-210" r="250" fill="#111"/>
        <circle cx="638" cy="52" r="12" fill="#111"/>
        <circle cx="638" cy="18" r="6" fill="#111"/>
        <rect x="604" y="80" width="68" height="300" fill="#0b0b0b"/>
        ${frets}
        <rect x="430" y="372" width="370" height="8" fill="#111"/>
        <circle cx="770" cy="330" r="9" fill="#c8201b"/>
        <circle cx="770" cy="330" r="18" fill="#c8201b" opacity="0.18"/>
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><circle cx="190" cy="-60" r="90" fill="#111"/><circle cx="190" cy="42" r="6" fill="#111"/><rect x="172" y="60" width="36" height="170" fill="#111"/></svg>`,
  },
};

/** Small deterministic random generator, so cut shapes look the same on every visit. */
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
