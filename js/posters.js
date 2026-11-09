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

  /* ---------- games ---------- */

  // The Usual Suspects: a police lineup of notes against a height chart. Which one is it?
  suspects: {
    tagline: 'Кто такая эта нота?',
    cutTitle: true,
    art: () => {
      let chart = '';
      for (let i = 0; i < 9; i++) {
        const y = 40 + i * 34;
        chart += `<rect x="420" y="${y}" width="380" height="2" fill="#e6e1d5" opacity="0.35"/>` +
                 `<text x="790" y="${y - 6}" text-anchor="end" fill="#e6e1d5" opacity="0.5" font-family="Oswald" font-size="12">${200 - i * 10}</text>`;
      }
      const suspect = (x, h, color, mark) => `
        <g transform="translate(${x} ${318 - h})" fill="${color}">
          <rect x="22" y="0" width="7" height="${h - 30}"/>
          <path d="M29 0 C 44 14 52 22 46 42 L 40 40 C 44 26 38 18 29 12 Z"/>
          <ellipse cx="14" cy="${h - 26}" rx="18" ry="13" transform="rotate(-22 14 ${h - 26})"/>
          ${mark ? `<text x="14" y="${h - 60}" text-anchor="middle" fill="#20272e" font-family="Oswald" font-weight="700" font-size="22">${mark}</text>` : ''}
        </g>`;
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        ${chart}
        ${suspect(460, 230, '#e6e1d5')}${suspect(530, 290, '#e6e1d5')}${suspect(600, 250, '#e3a33c', '')}${suspect(670, 310, '#e6e1d5')}${suspect(740, 220, '#e6e1d5')}
        <text x="614" y="70" text-anchor="middle" fill="#e3a33c" font-family="Oswald" font-weight="700" font-size="54">?</text>
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><g fill="#e6e1d5" opacity="0.35">
      <rect x="100" y="30" width="140" height="2"/><rect x="100" y="60" width="140" height="2"/><rect x="100" y="90" width="140" height="2"/><rect x="100" y="120" width="140" height="2"/></g>
      <g fill="#e3a33c"><rect x="186" y="40" width="5" height="90"/><ellipse cx="178" cy="132" rx="12" ry="9"/></g></svg>`,
  },

  // North by Northwest: Bass's title grid — slanted lines like a fretboard seen in perspective.
  nxnw: {
    tagline: 'Ищи по струнам: на север, на северо-запад',
    cutTitle: true,
    art: () => {
      let grid = '';
      for (let i = 0; i < 14; i++) grid += `<line x1="${380 + i * 34}" y1="0" x2="${300 + i * 34}" y2="380" stroke="#eaf2ea" stroke-width="2" opacity="0.55"/>`;
      for (let i = 0; i < 6; i++) grid += `<line x1="380" y1="${50 + i * 52}" x2="800" y2="${20 + i * 52}" stroke="#eaf2ea" stroke-width="${i === 2 ? 5 : 2}" opacity="${i === 2 ? 0.95 : 0.55}"/>`;
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <polygon points="430,0 800,0 800,380 350,380" fill="#246f56"/>
        ${grid}
        <polygon points="640,140 700,158 640,176" fill="#141210"/>
        <polygon points="700,130 760,112 744,96 800,92 776,146 762,128" fill="#141210"/>
        <circle cx="584" cy="155" r="13" fill="#e0572a"/>
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMin slice" aria-hidden="true"><g stroke="#eaf2ea" stroke-width="2" opacity="0.5">
      <line x1="120" y1="0" x2="90" y2="230"/><line x1="150" y1="0" x2="120" y2="230"/><line x1="180" y1="0" x2="150" y2="230"/><line x1="210" y1="0" x2="180" y2="230"/>
      <line x1="80" y1="60" x2="240" y2="44"/><line x1="80" y1="100" x2="240" y2="84"/></g><circle cx="166" cy="78" r="8" fill="#e0572a"/></svg>`,
  },

  // Metropolis: Art Deco — gold sunburst and a city whose towers grow out of the staff.
  metropolis: {
    tagline: 'Между нотой и пальцами должно быть сердце',
    cutTitle: false,
    art: () => {
      let rays = '';
      for (let i = 0; i < 13; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        rays += `<polygon points="620,380 ${(620 + Math.cos(a - 0.05) * 520).toFixed(0)},${(380 + Math.sin(a - 0.05) * 520).toFixed(0)} ${(620 + Math.cos(a + 0.05) * 520).toFixed(0)},${(380 + Math.sin(a + 0.05) * 520).toFixed(0)}" fill="#d4a64a" opacity="0.18"/>`;
      }
      const tower = (x, w, h) => `<polygon points="${x},380 ${x},${380 - h} ${x + w * 0.2},${380 - h} ${x + w * 0.2},${370 - h - 20} ${x + w * 0.8},${370 - h - 20} ${x + w * 0.8},${380 - h} ${x + w},${380 - h} ${x + w},380" fill="#0b0906" stroke="#d4a64a" stroke-width="2"/>`;
      let lines = '';
      for (let i = 0; i < 5; i++) lines += `<rect x="430" y="${300 + i * 12}" width="370" height="2" fill="#d4a64a" opacity="0.7"/>`;
      return `
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        ${rays}
        <circle cx="620" cy="380" r="70" fill="none" stroke="#d4a64a" stroke-width="3"/>
        ${tower(470, 50, 180)}${tower(530, 60, 250)}${tower(600, 44, 300)}${tower(654, 64, 220)}${tower(728, 50, 160)}
        ${lines}
      </svg>`;
    },
    mini: () => `<svg viewBox="0 0 240 230" preserveAspectRatio="xMaxYMax slice" aria-hidden="true"><g fill="none" stroke="#d4a64a" stroke-width="2">
      <polygon points="140,230 140,120 150,120 150,100 166,100 166,120 176,120 176,230"/><polygon points="184,230 184,80 194,80 194,60 214,60 214,80 224,80 224,230"/></g></svg>`,
  },
};

/* ==========================================================
   Backdrops: film graphics in the side margins of a page,
   left and right of the content column (viewBox 200 × 900).
   ========================================================== */
const BACKDROPS = {
  psycho: () => {
    const bars = (mirror, rnd) => {
      let out = '';
      [90, 470].forEach(top => {
        for (let i = 0; i < 5; i++) {
          const w = 90 + rnd() * 110;
          out += `<rect x="${mirror ? 200 - w : 0}" y="${top + i * 26}" width="${w.toFixed(0)}" height="13" fill="#d8d3c6" opacity="0.22"/>`;
        }
      });
      return out;
    };
    const rnd = seededRandom('psycho-bg');
    return { left: bars(false, rnd), right: bars(true, rnd) };
  },

  alien: () => {
    const rnd = seededRandom('alien-bg');
    const stars = () => {
      let s = '';
      for (let i = 0; i < 70; i++) s += `<circle cx="${(rnd() * 200).toFixed(0)}" cy="${(rnd() * 900).toFixed(0)}" r="${(rnd() * 1.4 + 0.3).toFixed(1)}" fill="#cdd8cf" opacity="${(rnd() * 0.5 + 0.15).toFixed(2)}"/>`;
      return s;
    };
    return {
      left: stars() + '<circle cx="40" cy="640" r="7" fill="#9be8b9" opacity="0.5"/>',
      right: stars() + '<polygon points="120,0 126,180 116,360 128,540 118,720 124,900 128,900 122,720 132,540 120,360 130,180 124,0" fill="#9be8b9" opacity="0.35"/>',
    };
  },

  clockwork: () => {
    let keys = '';
    for (let i = 0; i < 16; i++) keys += `<rect x="110" y="${120 + i * 30}" width="80" height="29" fill="#f4f1ea" stroke="#111" stroke-width="2"/>`;
    [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14].forEach(i => { keys += `<rect x="110" y="${140 + i * 30}" width="46" height="18" fill="#111"/>`; });
    return {
      left: '<polygon points="0,480 200,900 0,900" fill="#111"/><circle cx="60" cy="230" r="44" fill="none" stroke="#111" stroke-width="3"/>',
      right: keys + '<circle cx="200" cy="760" r="90" fill="#f26a1b"/>',
    };
  },

  whiplash: () => ({
    left: '<circle cx="40" cy="300" r="130" fill="none" stroke="#f2c40f" stroke-width="3" opacity="0.4"/><circle cx="40" cy="300" r="100" fill="none" stroke="#f2c40f" stroke-width="1.5" opacity="0.3"/><circle cx="60" cy="720" r="70" fill="#f2c40f" opacity="0.12"/>',
    right: `<rect x="90" y="120" width="8" height="300" fill="#f4ecd2" opacity="0.5" transform="rotate(-20 94 270)"/>
            <rect x="130" y="120" width="8" height="300" fill="#f4ecd2" opacity="0.5" transform="rotate(16 134 270)"/>
            <g fill="#f2c40f" opacity="0.6"><rect class="beat" x="90" y="620" width="26" height="34"/><rect class="beat" x="90" y="664" width="26" height="34" style="animation-delay:.5s"/>
            <rect class="beat" x="90" y="708" width="26" height="34" style="animation-delay:1s"/><rect class="beat" x="90" y="752" width="26" height="34" style="animation-delay:1.5s"/></g>`,
  }),

  shining: () => {
    const carpet = id => `<defs><pattern id="${id}" width="60" height="104" patternUnits="userSpaceOnUse"><g id="${id}c">
      <path d="M30 0 L60 17 L60 52 L30 69 L0 52 L0 17Z" fill="#d6532a"/><path d="M30 13 L49 24 L49 45 L30 56 L11 45 L11 24Z" fill="#6d2414"/>
      <path d="M30 25 L39 30 L39 39 L30 44 L21 39 L21 30Z" fill="#f1e6cf"/></g><use href="#${id}c" x="-30" y="52"/><use href="#${id}c" x="30" y="52"/></pattern></defs>`;
    return {
      left: carpet('carpetL') + '<polygon points="0,0 120,0 70,900 0,900" fill="url(#carpetL)" opacity="0.55"/>',
      right: carpet('carpetR') + '<polygon points="130,0 200,0 200,900 80,900" fill="url(#carpetR)" opacity="0.55"/>',
    };
  },

  anatomy: () => ({
    left: `<g fill="#141210" opacity="0.85">
      <polygon points="40,120 56,118 58,220 42,222" transform="rotate(8 50 170)"/><polygon points="44,240 60,238 62,320 46,322" transform="rotate(-6 52 280)"/>
      <polygon points="20,400 60,380 104,388 112,412 84,434 42,436 14,420"/><polygon points="40,520 76,500 120,508 128,532 100,554 58,556 30,540" transform="rotate(10 80 528)"/></g>`,
    right: `<rect x="100" y="0" width="100" height="900" fill="#e0572a"/><g fill="#141210">
      <polygon points="120,260 168,300 162,336 148,310 122,292"/><polygon points="110,640 146,620 190,628 198,652 170,674 128,676 100,660"/></g>`,
  }),

  odyssey: () => ({
    left: '<circle cx="80" cy="-60" r="160" fill="#111" opacity="0.9"/><circle cx="80" cy="150" r="14" fill="#111"/><circle cx="80" cy="118" r="7" fill="#111"/><rect x="0" y="860" width="200" height="40" fill="#111"/>',
    right: `<rect x="110" y="340" width="56" height="560" fill="#0b0b0b"/>${[...Array(14).keys()].map(i => `<rect x="110" y="${370 + i * 34}" width="56" height="2" fill="#3a3a3a"/>`).join('')}`,
  }),

  suspects: () => {
    const chart = mirror => {
      let s = '';
      for (let i = 0; i < 24; i++) {
        const y = 40 + i * 36;
        s += `<rect x="0" y="${y}" width="200" height="2" fill="#e6e1d5" opacity="0.18"/>`;
        if (i % 2 === 0) s += `<text x="${mirror ? 10 : 190}" y="${y - 6}" text-anchor="${mirror ? 'start' : 'end'}" fill="#e6e1d5" opacity="0.35" font-family="Oswald" font-size="13">${210 - i * 5}</text>`;
      }
      return s;
    };
    return { left: chart(false), right: chart(true) };
  },

  nxnw: () => {
    const grid = () => {
      let s = '';
      for (let i = -4; i < 10; i++) s += `<line x1="${i * 34 + 90}" y1="0" x2="${i * 34}" y2="900" stroke="#eaf2ea" stroke-width="2" opacity="0.18"/>`;
      for (let i = 0; i < 16; i++) s += `<line x1="0" y1="${40 + i * 58}" x2="200" y2="${20 + i * 58}" stroke="#eaf2ea" stroke-width="2" opacity="0.18"/>`;
      return s;
    };
    return { left: grid(), right: grid() + '<polygon points="80,400 150,420 80,440" fill="#e0572a" opacity="0.8"/>' };
  },

  metropolis: () => {
    const rays = (cx, cy) => {
      let s = '';
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.18;
        s += `<polygon points="${cx},${cy} ${(cx + Math.cos(a - 0.03) * 700).toFixed(0)},${(cy + Math.sin(a - 0.03) * 700).toFixed(0)} ${(cx + Math.cos(a + 0.03) * 700).toFixed(0)},${(cy + Math.sin(a + 0.03) * 700).toFixed(0)}" fill="#d4a64a" opacity="0.1"/>`;
      }
      return s;
    };
    const tower = (x, w, h) => `<polygon points="${x},900 ${x},${900 - h} ${x + w * 0.25},${900 - h} ${x + w * 0.25},${880 - h - 30} ${x + w * 0.75},${880 - h - 30} ${x + w * 0.75},${900 - h} ${x + w},${900 - h} ${x + w},900" fill="#0b0906" stroke="#d4a64a" stroke-width="2" opacity="0.6"/>`;
    return {
      left: rays(100, 900) + tower(20, 50, 300) + tower(90, 60, 420),
      right: rays(100, 900) + tower(40, 56, 380) + tower(120, 50, 260),
    };
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
