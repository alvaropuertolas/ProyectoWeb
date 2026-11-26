(() => {
  const canvas = document.querySelector('#grain');
  const ctx = canvas.getContext('2d');
  const cursorEl = document.querySelector('.cursor');
  const soundBtn = document.querySelector('.sound');
  const playCta = document.querySelector('.play-cta');
  const roomEl = document.querySelector('#room');
  const roomBack = document.querySelector('.room__back');
  const yearsEl = document.querySelector('#roomYears');
  const cardEl = document.querySelector('#roomCard');
  const verdictEl = document.querySelector('#verdict');
  const teleZ = document.querySelector('#teleZ');
  const teleHead = document.querySelector('#teleHead');
  const hud = {
    clock: document.querySelector('#hudClock'),
    status: document.querySelector('#hudStatus'),
    gaze: document.querySelector('#hudGaze'),
    count: document.querySelector('#hudCount'),
    panel: document.querySelector('#hudPanel'),
    panelName: document.querySelector('#hudPanelName'),
    ticks: document.querySelector('.hud__ticks'),
    last: ''
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TAU = Math.PI * 2;
  const GRAYS = [
    'rgba(242, 239, 233, 0.05)',
    'rgba(242, 239, 233, 0.07)',
    'rgba(255, 255, 255, 0.045)',
    'rgba(200, 196, 190, 0.06)',
    'rgba(255, 255, 255, 0.1)'
  ];
  const OUTLINE = 'rgba(242, 239, 233, 0.1)';
  const HAZE = 'rgba(242, 239, 233, 0.022)';
  const ACCENT = 'rgba(255, 90, 54, 0.2)';

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const rnd = (a, b) => a + Math.random() * (b - a);

  let vw = 0;
  let vh = 0;
  let blobs = [];
  let haze = [];
  let marks = [];
  let eye = null;
  let play = null;
  let smoothP = 0;
  let blinkOpen = 1;
  let resizeTimer = 0;
  let last = 0;
  let lastScroll = 0;
  let audio = null;
  let soundOn = false;
  let eyeChimed = false;
  let playChimed = false;
  let eyeMixState = 0;
  let playMixState = 0;
  let portalBusy = false;
  let warpActive = false;
  let warpStart = 0;
  let warpT = 0;

  const ROOM_DEPTH = 2400;
  // Datos de Google Takeout (YouTube). Un mismo hilo para todos los años:
  // algo = % de reproducciones sin búsqueda en los 2 min previos, y vídeos por
  // cada búsqueda. 2019–2022 no tienen historial: se reconstruyen con la tendencia
  // de 2023–2025 (est: true). 2023 solo tiene búsquedas desde julio: se anualizan.
  // world = qué se ve en el espacio 3D de ese año.
  const DATA = [
    { year: 2019, level: 0, est: true, algo: 58, world: 'search', beat: 'Buscaba yo. La pantalla obedecía.',
      stats: [['vídeos', 6800, '≈'], ['búsquedas', 4250, '≈'], ['vídeos por búsqueda', 1.6, '≈']] },
    { year: 2020, level: 0, est: true, algo: 66, world: 'orbit', beat: 'Encerrado en casa, dejé que eligiera ella.',
      stats: [['vídeos', 9400, '≈'], ['búsquedas', 4700, '≈'], ['vídeos por búsqueda', 2.0, '≈']] },
    { year: 2021, level: 20, est: true, algo: 71, world: 'clock', beat: 'La página de inicio aprendió mis horas.',
      stats: [['vídeos', 10200, '≈'], ['búsquedas', 4250, '≈'], ['vídeos por búsqueda', 2.4, '≈']] },
    { year: 2022, level: 20, est: true, algo: 76, world: 'feed', beat: 'Ya no buscaba. Solo bajaba.',
      stats: [['vídeos', 11100, '≈'], ['búsquedas', 3830, '≈'], ['vídeos por búsqueda', 2.9, '≈']] },
    { year: 2023, level: 50, algo: 79, world: 'chain', beat: 'Ocho de cada diez vídeos llegaron solos.',
      stats: [['vídeos', 12309], ['búsquedas', 3600, '≈'], ['vídeos por búsqueda', 3.4]] },
    { year: 2024, level: 50, algo: 83, world: 'tunnel', beat: 'El año que más vi. 43 vídeos al día.',
      stats: [['vídeos', 15605], ['búsquedas', 3499], ['vídeos por búsqueda', 4.5]] },
    { year: 2025, level: 100, algo: 86, world: 'vortex', beat: '223 vídeos en un solo día.',
      stats: [['vídeos', 7660], ['búsquedas', 1366], ['vídeos por búsqueda', 5.6]] },
    // Último capítulo: responde a la pregunta del home
    { year: 'fin', verdict: true, algo: 86, world: 'tv' }
  ];
  // Reproducciones por hora del día (00–23), normalizadas: el reloj de 2021
  const HOURS = [0.44, 0.41, 0.32, 0.13, 0.03, 0.01, 0, 0.01, 0.04, 0.04, 0.05, 0.15,
    0.39, 0.7, 0.91, 0.82, 0.84, 0.81, 0.78, 0.88, 0.93, 1, 0.77, 0.66];
  const YEARS = DATA.map((d) => d.year);
  const CHAPTER_GAP = 900;
  const ROOM_MAX_Z = CHAPTER_GAP * (YEARS.length - 1);
  const room = {
    pts: [],
    chapters: [],
    z: 0,
    tz: 0,
    yaw: 0,
    tyaw: 0,
    pitch: 0,
    tpitch: 0,
    lastInput: 0,
    snapPending: false,
    railIndex: -1,
    built: false
  };
  let roomMode = false;
  let roomDrag = null;
  let touchLookUntil = 0;
  let gyroOn = false;
  let gyroPrev = null;
  let gyroAccX = 0;
  let gyroAccY = 0;
  let gyroYaw = 0;
  let gyroPitch = 0;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, seen: false };
  const gaze = { x: 0, y: 0 };
  const intro = { active: !reduceMotion, start: performance.now(), mix: 0 };
  const blink = { start: -1, next: 0, cooldownUntil: 0 };

  const FORM_START = 250;
  const FORM_END = 1100;
  const HOLD_END = 1800;
  const INTRO_END = 2500;

  if (intro.active) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  } else {
    document.body.classList.remove('is-intro');
  }
  lastScroll = window.scrollY;

  function skipIntro() {
    if (!intro.active) return;
    intro.active = false;
    intro.mix = 0;
    document.body.classList.remove('is-intro');
  }

  if (intro.active) {
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => {
      window.addEventListener(ev, skipIntro, { passive: true, once: true });
    });

    // La salida de la entrada no depende del bucle de animación
    setTimeout(() => document.body.classList.remove('is-intro'), HOLD_END);
    setTimeout(() => {
      intro.active = false;
      intro.mix = 0;
    }, INTRO_END);
  }

  window.addEventListener('pointermove', (e) => {
    pointer.tx = e.clientX;
    pointer.ty = e.clientY;

    if (e.pointerType === 'mouse') {
      document.documentElement.classList.add('cursor-hidden');
    }

    if (!pointer.seen) {
      pointer.seen = true;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (cursorEl) cursorEl.classList.add('is-on');
    }
  });

  /* Clic sobre el ojo: parpadeo y pequeño sonido */
  window.addEventListener('pointerdown', (e) => {
    if (!eye || eyeMixState < 0.5 || playMixState > 0.4) return;

    const dx = e.clientX - vw / 2;
    const dy = e.clientY - vh / 2;
    const nx = dx / (eye.w * 0.45);
    const ny = dy / (eye.h * 0.42);
    if (nx * nx + ny * ny > 1) return;

    blink.start = performance.now();
    winkSound();
  });

  function makeShape(n) {
    return Array.from({ length: n }, (_, i) => ({
      a: (i / n) * TAU + rnd(-0.22, 0.22),
      r: rnd(0.42, 1)
    }));
  }

  function wrap(o, m) {
    if (o.x < -m) o.x = vw + m;
    else if (o.x > vw + m) o.x = -m;
    if (o.y < -m) o.y = vh + m;
    else if (o.y > vh + m) o.y = -m;
  }

  /* Silueta del ojo: dos curvas quadráticas (párpado superior e inferior) */
  function lidY(t, control) {
    const y0 = eye.y + eye.h * 0.5;
    const y1 = eye.y + eye.h * 0.5;
    const u = 1 - t;
    return u * u * y0 + 2 * u * t * (eye.y + control * eye.h) + t * t * y1;
  }

  function edgePoint() {
    const t = rnd(0.04, 0.96);
    return {
      x: eye.x + t * eye.w,
      y: lidY(t, Math.random() < 0.5 ? -0.22 : 1.22)
    };
  }

  function fillPoint() {
    const t = rnd(0.07, 0.93);
    const top = lidY(t, -0.22);
    const bottom = lidY(t, 1.22);
    return {
      x: eye.x + t * eye.w,
      y: top + (bottom - top) * Math.random()
    };
  }

  function pupilPoint() {
    const r = Math.sqrt(Math.random()) * eye.h * 0.16;
    const a = Math.random() * TAU;
    return {
      x: eye.x + eye.w * 0.5 + Math.cos(a) * r,
      y: eye.y + eye.h * 0.5 + Math.sin(a) * r
    };
  }

  /* Triángulo de play para la tercera pantalla */
  function playPoint() {
    const { a, b, c } = play;

    if (Math.random() < 0.6) {
      const edges = [
        [a, b],
        [b, c],
        [c, a]
      ];
      const lens = edges.map(([p, q]) => Math.hypot(q.x - p.x, q.y - p.y));
      let r = Math.random() * (lens[0] + lens[1] + lens[2]);
      let i = 0;
      while (r > lens[i]) {
        r -= lens[i];
        i++;
      }
      const [p, q] = edges[i];
      const t = Math.random();
      return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
    }

    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    return {
      x: a.x + u * (b.x - a.x) + v * (c.x - a.x),
      y: a.y + u * (b.y - a.y) + v * (c.y - a.y)
    };
  }

  function makeBlob() {
    const roll = Math.random();
    const outline = roll < 0.14;
    const speck = !outline && roll < 0.34;

    return {
      shape: makeShape(5 + Math.floor(rnd(0, 4))),
      size: outline ? rnd(18, 60) : speck ? rnd(2, 7) : rnd(9, 46),
      outline,
      x: rnd(-40, vw + 40),
      y: rnd(-40, vh + 40),
      vx: rnd(-0.1, 0.1),
      vy: rnd(-0.1, 0.1),
      rot: rnd(0, TAU),
      vr: rnd(-0.002, 0.002),
      color: outline ? OUTLINE : GRAYS[Math.floor(rnd(0, GRAYS.length))],
      delay: rnd(0, 0.5),
      wp: rnd(0, TAU),
      ws: rnd(0.3, 0.9),
      arc: rnd(-1, 1),
      wang: rnd(0, TAU),
      pupil: false,
      target: { x: 0, y: 0 },
      play: { x: 0, y: 0 },
      name: null
    };
  }

  function makeHaze() {
    return {
      shape: makeShape(7 + Math.floor(rnd(0, 4))),
      size: rnd(120, 300),
      x: rnd(-100, vw + 100),
      y: rnd(-100, vh + 100),
      vx: rnd(-0.04, 0.04),
      vy: rnd(-0.04, 0.04),
      rot: rnd(0, TAU),
      vr: rnd(-0.0004, 0.0004),
      color: HAZE
    };
  }

  function makeMark() {
    return {
      x: rnd(0, vw),
      y: rnd(0, vh),
      size: rnd(3, 8),
      vx: rnd(-0.03, 0.03),
      vy: rnd(-0.03, 0.03),
      rot: rnd(0, TAU),
      vr: rnd(-0.0008, 0.0008),
      alpha: rnd(0.05, 0.1)
    };
  }

  function assignTargets() {
    const order = blobs.map((_, i) => i).sort(() => Math.random() - 0.5);
    const pupilCount = Math.max(6, Math.round(blobs.length * 0.14));

    order.forEach((index, rank) => {
      const b = blobs[index];
      if (rank < pupilCount) {
        b.pupil = true;
        b.color = ACCENT;
        b.size = rnd(5, 15);
        b.target = pupilPoint();
      } else if (Math.random() < 0.62) {
        b.target = edgePoint();
      } else {
        b.target = fillPoint();
      }
      b.play = playPoint();
    });
  }

  /* Puntos del nombre para la entrada: se dibuja el nombre en un canvas oculto y se muestrean sus píxeles */
  function buildNameTargets() {
    const off = document.createElement('canvas');
    off.width = vw;
    off.height = vh;
    const o = off.getContext('2d', { willReadFrequently: true });
    if (!o) return false;

    // El nombre ya no es el titular: la entrada lo dibuja grande por su cuenta (firma)
    const size = Math.min(vw * 0.13, 240);
    o.font = `400 ${size}px Helvetica, "Helvetica Neue", Arial, sans-serif`;
    if ('letterSpacing' in o) o.letterSpacing = `${-0.07 * size}px`;
    o.textBaseline = 'middle';
    o.textAlign = 'center';
    o.fillStyle = '#fff';
    o.fillText('alvaropuertolas', vw / 2, vh / 2);

    let data;
    try {
      data = o.getImageData(0, 0, vw, vh).data;
    } catch (e) {
      return false;
    }

    const pts = [];
    for (let y = 0; y < vh; y += 2) {
      for (let x = 0; x < vw; x += 2) {
        if (data[(y * vw + x) * 4 + 3] > 100) pts.push({ x, y });
      }
    }
    if (!pts.length) return false;

    pts.sort((a, b) => a.x - b.x);
    const ordered = [...blobs].sort((a, b) => a.x - b.x);
    const n = ordered.length;

    ordered.forEach((b, i) => {
      const p = pts[Math.min(pts.length - 1, Math.floor((i / n) * pts.length))];
      b.name = { x: p.x, y: p.y };
      b.introDelay = (p.x / vw) * 0.4;
    });
    return true;
  }

  function setup() {
    vw = window.innerWidth;
    vh = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, vw < 700 ? 1.25 : 1.5);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ew = Math.min(vw * 0.9, vh * 1.4);
    const eh = ew * 0.52;
    eye = { w: ew, h: eh, x: (vw - ew) / 2, y: vh * 0.5 - eh / 2 };

    const ph = Math.min(vh * 0.44, vw * 0.6);
    const pw = ph * 1.15;
    play = {
      a: { x: vw / 2 - pw / 2, y: vh / 2 - ph / 2 },
      b: { x: vw / 2 - pw / 2, y: vh / 2 + ph / 2 },
      c: { x: vw / 2 + pw / 2, y: vh / 2 },
      pad: ph * 0.16
    };

    document.documentElement.style.setProperty('--play-w', pw + 'px');
    document.documentElement.style.setProperty('--play-h', ph + 'px');

    const count = Math.max(vw < 700 ? 180 : 260, Math.min(480, Math.round((vw * vh) / 3600)));
    blobs = Array.from({ length: count }, makeBlob);
    haze = Array.from({ length: vw < 640 ? 5 : 7 }, makeHaze);
    marks = Array.from({ length: vw < 640 ? 8 : 14 }, makeMark);
    assignTargets();

    if (!pointer.seen) {
      pointer.x = pointer.tx = vw / 2;
      pointer.y = pointer.ty = vh / 2;
    }

    if (intro.active && !buildNameTargets()) {
      intro.active = false;
      document.body.classList.remove('is-intro');
    }

    room.built = false;
  }

  function paintShape(shape, size, x, y, rot, color, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < shape.length; i++) {
      const p = shape[i];
      const px = Math.cos(p.a) * size * p.r;
      const py = Math.sin(p.a) * size * p.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (stroke) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGrid() {
    const step = 44;
    ctx.strokeStyle = 'rgba(242, 239, 233, 0.028)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < vw; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, vh);
    }
    for (let y = step; y < vh; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(vw, y + 0.5);
    }
    ctx.stroke();
  }

  function drawMarks(px, py) {
    ctx.lineWidth = 1;
    for (const m of marks) {
      ctx.save();
      ctx.translate(m.x + px * 14, m.y + py * 10 + smoothP * 18);
      ctx.rotate(m.rot);
      ctx.strokeStyle = `rgba(242, 239, 233, ${m.alpha})`;
      ctx.beginPath();
      ctx.moveTo(-m.size, 0);
      ctx.lineTo(m.size, 0);
      ctx.moveTo(0, -m.size);
      ctx.lineTo(0, m.size);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* Estructura del ojo: contorno, iris, pupila y anillo exterior */
  function drawEyeOverlay(alpha, open) {
    const cx = vw / 2;
    const cy = vh / 2;
    const hw = eye.w / 2;
    const lid = eye.h * 0.72;

    ctx.save();
    ctx.lineWidth = 1;

    ctx.strokeStyle = `rgba(242, 239, 233, ${0.22 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);
    ctx.quadraticCurveTo(cx, cy - lid * open, cx + hw, cy);
    ctx.quadraticCurveTo(cx, cy + lid * open, cx - hw, cy);
    ctx.closePath();
    ctx.stroke();

    ctx.save();
    ctx.translate(cx + gaze.x, cy + gaze.y * open);
    ctx.scale(1, Math.max(0.05, open));

    const iris = eye.h * 0.3;
    ctx.strokeStyle = `rgba(242, 239, 233, ${0.16 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, iris, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = `rgba(242, 239, 233, ${0.1 * alpha})`;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * iris, Math.sin(a) * iris);
      ctx.lineTo(Math.cos(a) * (iris + 5), Math.sin(a) * (iris + 5));
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 90, 54, ${0.16 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, eye.h * 0.17, 0, TAU);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
    ctx.beginPath();
    ctx.arc(-eye.h * 0.06, -eye.h * 0.07, Math.max(2, eye.h * 0.016), 0, TAU);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = `rgba(242, 239, 233, ${0.05 * alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, eye.w * 0.68, eye.h * 0.92, 0, 0, TAU);
    ctx.stroke();

    ctx.restore();
  }

  function drawPlayOverlay(alpha) {
    const { a, b, c, pad } = play;
    const minX = Math.min(a.x, b.x, c.x) - pad;
    const minY = Math.min(a.y, b.y, c.y) - pad;
    const w = Math.max(a.x, b.x, c.x) - Math.min(a.x, b.x, c.x) + pad * 2;
    const h = Math.max(a.y, b.y, c.y) - Math.min(a.y, b.y, c.y) + pad * 2;

    ctx.save();
    ctx.lineWidth = 1;

    ctx.strokeStyle = `rgba(242, 239, 233, ${0.1 * alpha})`;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(minX, minY, w, h, Math.min(w, h) * 0.12);
    else ctx.rect(minX, minY, w, h);
    ctx.stroke();

    ctx.strokeStyle = `rgba(242, 239, 233, ${0.22 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  /* Anillo de lente alrededor del ojo */
  function drawRing(now, alpha) {
    const rx = eye.w * 0.58;
    const ry = eye.h * 0.78;

    ctx.save();
    ctx.translate(vw / 2, vh / 2);
    ctx.rotate(now * 0.00003);
    ctx.strokeStyle = `rgba(242, 239, 233, ${0.09 * alpha})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.stroke();

    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rx, Math.sin(a) * ry);
      ctx.lineTo(Math.cos(a) * (rx + 9), Math.sin(a) * (ry + 9));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBlob(b, now, eyeMix, playMix) {
    const d = b.delay * 0.7;
    const eyeLocal = smooth((eyeMix - d) / (1 - d));
    const d2 = (1 - b.delay) * 0.5;
    const playLocal = smooth((playMix - d2) / (1 - d2));
    const nd = b.introDelay || 0;
    const nameLocal = smooth((intro.mix - nd) / (1 - nd));

    const wob = reduceMotion ? 0 : 1;

    let x = b.x;
    let y = b.y;

    const arc = Math.sin(eyeLocal * Math.PI) * b.arc * 18;
    const eyeTX = b.target.x + (b.pupil ? gaze.x : 0);
    const eyeTY = vh / 2 + (b.target.y + (b.pupil ? gaze.y : 0) - vh / 2) * blinkOpen;

    x += (eyeTX - x) * eyeLocal + arc;
    y += (eyeTY - y) * eyeLocal - arc * 0.6;

    x += (b.play.x - x) * playLocal;
    y += (b.play.y - y) * playLocal;

    if (intro.mix > 0.001 && b.name) {
      x += (b.name.x - x) * nameLocal;
      y += (b.name.y - y) * nameLocal;
    }

    // Micro-movimiento también con el ojo y el play ya formados
    const amp = (3 + 2 * (1 - eyeLocal)) * wob;
    x += Math.sin(now * 0.0011 * b.ws + b.wp) * amp;
    y += Math.cos(now * 0.0009 * b.ws + b.wp * 1.3) * amp;

    if (!reduceMotion) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const dist2 = dx * dx + dy * dy;
      const R = 190;
      if (dist2 < R * R) {
        const dist = Math.sqrt(dist2) || 1;
        const k = 1 - dist / R;
        const f = k * 26 * (1 - eyeLocal * 0.85) * (1 - playLocal) * (1 - nameLocal);
        x += (dx / dist) * f;
        y += (dy / dist) * f;
        x += (dy / dist) * f * 0.9;
        y -= (dx / dist) * f * 0.9;
      }
    }

    let size = b.size * (1 - nameLocal * 0.35);

    if (warpT > 0.001) {
      const wdx = x - vw / 2;
      const wdy = y - vh / 2;
      const wd = Math.hypot(wdx, wdy);
      const ux = wd < 1 ? Math.cos(b.wang) : wdx / wd;
      const uy = wd < 1 ? Math.sin(b.wang) : wdy / wd;
      const push = warpT * Math.min(vw, vh) * 1.15;
      x += ux * push;
      y += uy * push;
      size *= 1 + warpT * 2.4;
    }

    paintShape(b.shape, size, x, y, b.rot, b.color, b.outline);
  }

  function updateIntro(now) {
    if (!intro.active) {
      intro.mix = 0;
      return;
    }

    const t = now - intro.start;
    if (t < FORM_START) intro.mix = 0;
    else if (t < FORM_END) intro.mix = smooth((t - FORM_START) / (FORM_END - FORM_START));
    else if (t < HOLD_END) intro.mix = 1;
    else intro.mix = 1 - smooth((t - HOLD_END) / (INTRO_END - HOLD_END));

    if (t >= HOLD_END) document.body.classList.remove('is-intro');
    if (t >= INTRO_END) {
      intro.active = false;
      intro.mix = 0;
    }
  }

  function buildRoom() {
    const count = vw < 700 ? 190 : 360;

    room.pts = Array.from({ length: count }, () => {
      const a = rnd(0, TAU);
      const r = rnd(80, 720);
      return {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r * 0.65,
        z: rnd(0, ROOM_DEPTH),
        size: rnd(3, 14),
        shape: makeShape(5 + Math.floor(rnd(0, 4))),
        rot: rnd(0, TAU),
        vr: rnd(-0.0015, 0.0015),
        phase: rnd(0, TAU),
        ws: rnd(0.3, 0.9),
        wob: rnd(3, 12),
        color: Math.random() < 0.08 ? ACCENT : GRAYS[Math.floor(rnd(0, GRAYS.length))]
      };
    });

    room.chapters = DATA.map((d, i) => ({
      year: d.year,
      algo: d.algo / 100,
      verdict: !!d.verdict,
      z: 600 + i * CHAPTER_GAP
    }));

    // Cada año construye su propio mundo con su dato
    const small = vw < 700;
    for (const c of room.chapters) {
      c.world = DATA[room.chapters.indexOf(c)].world;
      const n = (big, little) => (small ? little : big);
      c.items = [];
      if (c.world === 'orbit') {
        for (let k = 0; k < n(120, 60); k++) {
          c.items.push({ a: rnd(0, TAU), r: rnd(160, 480), dz: rnd(-220, 220), size: rnd(4, 11), shape: makeShape(6), hot: Math.random() < c.algo * 0.5 });
        }
      } else if (c.world === 'feed') {
        for (let col = -1; col <= 1; col++) {
          for (let row = 0; row < 7; row++) c.items.push({ x: col * 300, y: row * 190, hot: Math.random() < 0.2 });
        }
      } else if (c.world === 'chain') {
        for (let k = 0; k < n(48, 30); k++) {
          const t = k / n(48, 30);
          c.items.push({ x: Math.cos(t * TAU * 2.2) * (180 + t * 220), y: Math.sin(t * TAU * 2.2) * (140 + t * 160), dz: -320 + t * 640 });
        }
      } else if (c.world === 'tunnel') {
        for (let k = 0; k < n(150, 80); k++) {
          c.items.push({ a: rnd(0, TAU), r: rnd(420, 640), dz: rnd(-450, 450), hot: Math.random() < c.algo * 0.35 });
        }
      } else if (c.world === 'vortex') {
        // 223: los vídeos de su peor día
        for (let k = 0; k < n(223, 120); k++) c.items.push({ a: rnd(0, TAU), r: rnd(60, 560), dz: rnd(-300, 300), sp: rnd(0.6, 1.4) });
      } else if (c.world === 'search') {
        for (let k = 0; k < n(28, 16); k++) {
          c.items.push({ a: rnd(0, TAU), r: rnd(200, 520), dz: rnd(-200, 200), size: rnd(2, 5), shape: makeShape(5) });
        }
      }
    }

    if (yearsEl) {
      yearsEl.innerHTML = '';
      room.chapters.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'room__year';
        b.textContent = c.year;
        b.addEventListener('click', () => {
          room.tz = i * CHAPTER_GAP;
          room.snapPending = false;
          room.lastInput = performance.now();
        });
        b.addEventListener('pointerenter', () => {
          if (cursorEl) cursorEl.classList.add('is-link');
          decode(b, String(c.year), 320);
        });
        b.addEventListener('pointerleave', () => {
          if (cursorEl) cursorEl.classList.remove('is-link');
        });
        yearsEl.appendChild(b);
      });
      room.railIndex = -1;
    }

    room.built = true;
  }

  // es-ES no agrupa los números de 4 cifras; aquí sí (6.800)
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let cardMix = 0;

  // Texto que se descifra: los caracteres giran y se asientan de izquierda a derecha
  const GLYPHS = '▓▒░#/<>_—01';
  function decode(el, text, dur = 600) {
    if (reduceMotion) {
      el.textContent = text;
      return;
    }
    const t0 = performance.now();
    el._decode = t0;
    const step = (now) => {
      if (el._decode !== t0) return;
      const k = (now - t0) / dur;
      let out = '';
      for (let j = 0; j < text.length; j++) {
        const settle = j / text.length;
        out += k > settle || text[j] === ' ' ? text[j] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Cada texto marcado se descifra la primera vez que entra en pantalla
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || document.body.classList.contains('is-intro')) continue;
        decode(e.target, e.target.dataset.text, 900);
        io.unobserve(e.target);
      }
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-decode]').forEach((el) => {
      el.dataset.text = el.textContent;
      io.observe(el);
    });
    // La portada se descifra al terminar la entrada
    setTimeout(() => {
      document.querySelectorAll('.panel--cover [data-decode]').forEach((el) => {
        decode(el, el.dataset.text, 900);
        io.unobserve(el);
      });
    }, intro.active ? HOLD_END : 0);
  }
  let cardTimer = 0;

  // Cuenta hacia arriba cada cifra de la ficha
  function countUp(el, to, pre, suf, dec = !Number.isInteger(to)) {
    const t0 = performance.now();
    const dur = reduceMotion ? 0 : 900;
    const step = (now) => {
      const k = dur ? smooth((now - t0) / dur) : 1;
      const v = dec ? (to * k).toFixed(1).replace('.', ',') : fmt(Math.round(to * k));
      el.textContent = pre + v + suf;
      if (k < 1 && roomMode) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function showCard(i) {
    const d = DATA[i];
    if (!d || !cardEl) return;

    roomEl.classList.toggle('is-verdict', !!d.verdict);
    // Cada año entra con una nota más grave y más sucia
    if (d.verdict) {
      blip(70, 2.2, 'sine', 0.22, 38);
      setTimeout(() => blip(41, 2.5, 'triangle', 0.12), 120);
    } else {
      blip(660 - i * 55, 0.7, i > 3 ? 'triangle' : 'sine', 0.05);
    }
    if (audio && audio.noiseGain && soundOn) {
      // En el veredicto el ruido se corta: silencio antes del golpe
      audio.master.gain.setTargetAtTime(d.verdict ? 0.04 : 0.16, audio.ctx.currentTime, 0.3);
    }
    if (verdictEl) verdictEl.classList.toggle('is-on', !!d.verdict);
    room.verdictAt = d.verdict ? performance.now() : 0;
    // La TV se enciende: chasquido, pitido agudo y un golpe de estática
    if (d.verdict) {
      setTimeout(() => {
        if (!room.verdictAt) return;
        blip(140, 0.25, 'square', 0.05, 60);
        blip(7800, 1.6, 'sine', 0.008);
        if (audio && soundOn) {
          const t = audio.ctx.currentTime;
          audio.noiseGain.gain.setTargetAtTime(0.16, t, 0.02);
          audio.noiseGain.gain.setTargetAtTime(0.012, t + 0.35, 0.25);
        }
      }, reduceMotion ? 0 : 1950);
    }
    if (d.verdict) return;

    cardEl.classList.add('is-swapping');
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => {
      cardMix = 0;
      cardEl.querySelector('#cardYear').textContent = d.year;
      const beat = cardEl.querySelector('#cardBeat');
      beat.dataset.level = d.level;
      decode(beat, d.beat, 700);

      const stats = cardEl.querySelector('#cardStats');
      stats.innerHTML = '';
      for (const [label, value, pre = '', suf = ''] of d.stats) {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = label;
        stats.append(dt, dd);
        countUp(dd, value, pre ? pre + ' ' : '', suf, label === 'vídeos por búsqueda');
      }

      cardEl.querySelector('#splitAlgo').style.width = '0%';
      requestAnimationFrame(() => {
        cardEl.querySelector('#splitAlgo').style.width = d.algo + '%';
      });
      countUp(cardEl.querySelector('#splitA'), d.algo, '', '%');
      countUp(cardEl.querySelector('#splitV'), 100 - d.algo, '', '%');
      cardEl.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 250);
  }

  function enterRoom() {
    if (roomMode || !roomEl) return;

    roomMode = true;
    if (!room.built) buildRoom();

    room.z = 0;
    room.tz = 0;
    room.yaw = 0;
    room.tyaw = 0;
    room.pitch = 0;
    room.tpitch = 0;
    room.lastInput = 0;
    room.snapPending = false;
    room.railIndex = -1;
    roomDrag = null;
    touchLookUntil = 0;

    document.body.classList.add('room-mode');
    roomEl.hidden = false;
    requestAnimationFrame(() => roomEl.classList.add('is-visible'));
  }

  function exitRoom() {
    if (!roomMode) return;

    roomMode = false;
    roomDrag = null;
    if (cursorEl) cursorEl.classList.remove('is-link');
    document.body.classList.remove('room-mode');

    if (roomEl) {
      roomEl.classList.remove('is-visible');
      setTimeout(() => {
        if (!roomMode) roomEl.hidden = true;
      }, 500);
    }

    smoothP = 1;
    lastScroll = window.scrollY;
  }

  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;

    // Cerca del límite del sensor, los ángulos saltan; se ignoran esos valores
    if (Math.abs(e.gamma) > 85 || Math.abs(e.beta) > 170) return;

    if (!gyroPrev) {
      gyroPrev = { gamma: e.gamma, beta: e.beta };
      return;
    }

    let dg = e.gamma - gyroPrev.gamma;
    let db = e.beta - gyroPrev.beta;
    if (dg > 180) dg -= 360;
    if (dg < -180) dg += 360;
    if (db > 180) db -= 360;
    if (db < -180) db += 360;

    // Ningún evento puede mover la vista de golpe
    dg = Math.max(-10, Math.min(10, dg));
    db = Math.max(-10, Math.min(10, db));
    gyroPrev = { gamma: e.gamma, beta: e.beta };

    // Acumulado y limitado: el gesto extremo no dispara la vista
    gyroAccX = Math.max(-32, Math.min(32, gyroAccX + dg * 0.75));
    gyroAccY = Math.max(-26, Math.min(26, gyroAccY + db * 0.75));

    const targetYaw = -(gyroAccX / 36) * 0.5;
    const targetPitch = (gyroAccY / 30) * 0.3;

    // Suavizado extra para que no se sienta nervioso
    gyroYaw += (targetYaw - gyroYaw) * 0.12;
    gyroPitch += (targetPitch - gyroPitch) * 0.12;
  }

  function startGyro() {
    if (gyroOn) return;
    gyroPrev = null;
    gyroAccX = 0;
    gyroAccY = 0;
    gyroYaw = 0;
    gyroPitch = 0;
    window.addEventListener('deviceorientation', onOrient);
    gyroOn = true;
  }

  function requestGyro() {
    if (gyroOn) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((res) => {
          if (res === 'granted') startGyro();
        })
        .catch(() => {});
    } else {
      startGyro();
    }
  }

  // Pantalla de la TV: se pinta en un canvas aparte y se proyecta sobre el cristal
  const tvCanvas = document.createElement('canvas');
  tvCanvas.width = 640;
  tvCanvas.height = 552;
  const tv = tvCanvas.getContext('2d');

  function paintScreen(on, num, now) {
    const W = tvCanvas.width;
    const H = tvCanvas.height;
    tv.fillStyle = '#0f0f10';
    tv.fillRect(0, 0, W, H);

    if (on < 1) {
      // Encendido de tele antigua: una raya que se abre en horizontal y luego en vertical
      const w = W * Math.min(1, on * 2);
      const h = on < 0.5 ? 3 : 3 + (H - 3) * ((on - 0.5) * 2);
      tv.fillStyle = `rgba(242, 239, 233, ${0.9 - on * 0.6})`;
      tv.fillRect((W - w) / 2, (H - h) / 2, w, h);
      return;
    }

    const jump = Math.sin(now * 0.0021) > 0.985 ? (Math.random() - 0.5) * 30 : 0;
    tv.save();
    tv.translate(0, jump);
    tv.textBaseline = 'alphabetic';
    tv.textAlign = 'left';
    tv.fillStyle = '#ff5a36';
    tv.font = '400 18px ui-monospace, Menlo, monospace';
    tv.fillText('VEREDICTO · 2025', 40, 58);
    tv.textAlign = 'right';
    tv.fillText('CH ' + String(Math.round(num)).padStart(2, '0'), W - 40, 58);

    tv.textAlign = 'left';
    tv.fillStyle = '#f2efe9';
    tv.font = '400 230px Helvetica, "Helvetica Neue", Arial, sans-serif';
    tv.fillText(String(Math.round(num)), 30, 300);
    tv.fillStyle = '#ff5a36';
    tv.font = '400 80px Helvetica, "Helvetica Neue", Arial, sans-serif';
    tv.fillText('%', 285, 300);

    tv.fillStyle = '#f2efe9';
    tv.font = 'italic 400 38px "Kuronuri 100", Georgia, serif';
    tv.fillText('de lo que vi', 40, 380);
    tv.fillText('no lo elegí yo.', 40, 425);

    // 10 × 10: cada casilla un 1 %, naranja las que eligió el algoritmo
    const cell = 18;
    const gap = 5;
    const ox = W - 40 - (cell + gap) * 10 + gap;
    const oy = 140;
    for (let k = 0; k < 100; k++) {
      const x = ox + (k % 10) * (cell + gap);
      const y = oy + Math.floor(k / 10) * (cell + gap);
      if (k < num) {
        tv.fillStyle = '#ff5a36';
        tv.fillRect(x, y, cell, cell);
      } else if (num >= 86) {
        tv.fillStyle = '#f2efe9';
        tv.fillRect(x, y, cell, cell);
      } else {
        tv.strokeStyle = 'rgba(242, 239, 233, 0.3)';
        tv.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }
    }
    tv.restore();

    // Líneas de barrido, estática y viñeta
    tv.fillStyle = 'rgba(0, 0, 0, 0.28)';
    for (let y = 0; y < H; y += 4) tv.fillRect(0, y, W, 1.5);
    tv.fillStyle = 'rgba(242, 239, 233, 0.07)';
    for (let k = 0; k < 160; k++) tv.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    const vg = tv.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    tv.fillStyle = vg;
    tv.fillRect(0, 0, W, H);
  }

  // Sala final: suelo, paredes y una tele antigua que se construyen línea a línea
  function drawTV(zc, P, now, fog) {
    const el = room.verdictAt ? now - room.verdictAt : 0;
    const bt = reduceMotion ? 1 : clamp01(el / 2600);
    if (bt <= 0) return;
    const seg = (a, b) => clamp01((bt - a) / (b - a));
    const B = (a) => `rgba(242, 239, 233, ${a * fog})`;
    const L = (a, b, k, col) => {
      if (k <= 0) return;
      const p = P(a[0], a[1], a[2]);
      const q = P(b[0], b[1], b[2]);
      if (!p || !q) return;
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k);
      ctx.stroke();
    };
    const poly = (pts, fill, stroke) => {
      const q = pts.map((v) => P(v[0], v[1], v[2]));
      if (q.some((v) => !v)) return null;
      ctx.beginPath();
      q.forEach((v, k) => (k ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
      return q;
    };

    const X = 950;
    const FY = 330;
    const CY = -650;
    const z0 = zc - 300;
    const z1 = zc + 1150;
    ctx.lineWidth = 1;

    // La tele: girada tres cuartos para que se vea su volumen
    const mid = zc + 700;
    const ang = 0.38 + Math.sin(now * 0.00025) * 0.03;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const tw = (v) => [v[0] * ca - v[2] * sa, v[1], mid + v[0] * sa + v[2] * ca];
    const LT = (a2, b2, k, col) => L(tw(a2), tw(b2), k, col);
    const PT = (v) => { const w = tw(v); return P(w[0], w[1], w[2]); };
    const tx = 320;
    const ty = 230;
    const fz = -150;
    const bz = 150;
    const on = seg(0.72, 0.9);

    // La única luz es la pantalla: parpadea con ella y cae con la distancia
    const flick = on * (0.82 + 0.18 * Math.random() * (Math.sin(now * 0.013) > 0.6 ? 1 : 0.3));
    const LP = tw([-60, 0, fz - 40]);
    const lit = (v) => {
      const dx = v[0] - LP[0];
      const dy = v[1] - LP[1];
      const dz = v[2] - LP[2];
      return 1 / (1 + (dx * dx + dy * dy + dz * dz) / (430 * 430));
    };
    // Línea iluminada: casi invisible lejos de la tele
    // En tramos: cada trozo recibe su propia luz y la línea se apaga hacia la oscuridad
    const LL = (a2, b2, k, base) => {
      const n2 = 8;
      for (let j = 0; j < n2 && j / n2 < k; j++) {
        const t0 = j / n2;
        const t1 = Math.min(k, (j + 1) / n2);
        const pA = [0, 1, 2].map((d) => a2[d] + (b2[d] - a2[d]) * t0);
        const pB = [0, 1, 2].map((d) => a2[d] + (b2[d] - a2[d]) * t1);
        const l = lit([(pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2, (pA[2] + pB[2]) / 2]);
        L(pA, pB, 1, B(Math.min(0.85, base * (0.01 + l * l * 2.2 * (0.2 + flick)))));
      }
    };

    // Todo lo demás se hunde en negro alrededor de la tele
    const lpP = P(LP[0], LP[1], LP[2]);
    if (lpP) {
      const R = Math.max(vw, vh);
      const dark = ctx.createRadialGradient(lpP.x, lpP.y, R * 0.08, lpP.x, lpP.y, R * 0.8);
      dark.addColorStop(0, 'rgba(6, 6, 7, 0)');
      dark.addColorStop(1, `rgba(6, 6, 7, ${0.94 * bt})`);
      ctx.fillStyle = dark;
      ctx.fillRect(-vw, -vh, vw * 3, vh * 3);
      ctx.fillStyle = `rgba(6, 6, 7, ${0.72 * bt})`;
      ctx.fillRect(-vw, -vh, vw * 3, vh * 3);
    }

    // Suelo de baldosas
    let n = 0;
    for (let x = -X; x <= X; x += 160, n++) LL([x, FY, z0], [x, FY, z1], seg(n * 0.012, 0.25 + n * 0.012), 0.5);
    n = 0;
    for (let z = z0; z <= z1; z += 160, n++) LL([-X, FY, z], [X, FY, z], seg(0.05 + n * 0.015, 0.3 + n * 0.015), 0.4);

    // Paredes alicatadas: aristas, juntas horizontales y verticales
    const kw = seg(0.15, 0.5);
    LL([-X, FY, z1], [-X, CY, z1], kw, 0.7);
    LL([X, FY, z1], [X, CY, z1], kw, 0.7);
    LL([-X, CY, z1], [X, CY, z1], kw, 0.6);
    LL([-X, CY, z0], [-X, CY, z1], kw, 0.5);
    LL([X, CY, z0], [X, CY, z1], kw, 0.5);
    const kt = seg(0.3, 0.6);
    for (let y = FY - 90; y > CY; y -= 90) {
      LL([-X, y, z1], [X, y, z1], kt, 0.35);
      LL([-X, y, z0], [-X, y, z1], kt, 0.3);
      LL([X, y, z0], [X, y, z1], kt, 0.3);
    }
    for (let x = -X + 180; x < X; x += 180) LL([x, FY, z1], [x, CY, z1], kt, 0.25);
    for (let z = z0 + 180; z < z1; z += 180) {
      LL([-X, FY, z], [-X, CY, z], kt, 0.2);
      LL([X, FY, z], [X, CY, z], kt, 0.2);
    }
    // Zócalo
    LL([-X, FY - 30, z0], [-X, FY - 30, z1], kt, 0.6);
    LL([X, FY - 30, z0], [X, FY - 30, z1], kt, 0.6);
    LL([-X, FY - 30, z1], [X, FY - 30, z1], kt, 0.6);

    // Puerta cerrada en la pared derecha, con luz por debajo
    const kd = seg(0.4, 0.65);
    const dz0 = zc + 250;
    const dz1 = zc + 560;
    const dy = -260;
    LL([X - 1, FY, dz0], [X - 1, dy, dz0], kd, 1);
    LL([X - 1, dy, dz0], [X - 1, dy, dz1], kd, 1);
    LL([X - 1, dy, dz1], [X - 1, FY, dz1], kd, 1);
    LL([X - 1, -120, dz0 + 40], [X - 1, -120, dz0 + 110], kd, 0.8);
    const u0 = P(X - 2, FY - 2, dz0 + 10);
    const u1 = P(X - 2, FY - 2, dz1 - 10);
    if (u0 && u1 && kd >= 1) {
      ctx.strokeStyle = `rgba(255, 150, 110, ${(0.55 + 0.1 * Math.sin(now * 0.002)) * fog})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(u0.x, u0.y);
      ctx.lineTo(u1.x, u1.y);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // Cable de la tele serpenteando por el suelo hasta la pared
    const kc = seg(0.45, 0.75);
    const c0 = tw([200, FY, bz - 20]);
    let prevC = c0;
    for (let k = 1; k <= 24; k++) {
      const t = k / 24;
      const pt = [
        c0[0] + (X - c0[0]) * t,
        FY,
        c0[2] + Math.sin(t * Math.PI * 2.5) * 160 + t * 200
      ];
      if (k === 24) pt[0] = X - 1;
      LL(prevC, pt, kc >= t ? 1 : 0, 0.8);
      prevC = pt;
    }
    LL(prevC, [X - 1, FY - 60, prevC[2]], kc >= 1 ? 1 : 0, 0.8);

    // Charco de luz de la pantalla en el suelo
    const gp = PT([0, FY, fz - 300]);
    if (gp && on > 0) {
      const r = 1000 * gp.s;
      const g = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, r);
      g.addColorStop(0, `rgba(255, 120, 80, ${0.22 * flick * fog})`);
      g.addColorStop(1, 'rgba(255, 120, 80, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(gp.x, gp.y, r, r * 0.3, 0, 0, TAU);
      ctx.fill();
    }

    // Patas
    const kl = seg(0.3, 0.5);
    for (const [lx, lz] of [[-250, fz + 40], [250, fz + 40], [-250, bz - 40], [250, bz - 40]]) {
      LT([lx, ty, lz], [lx * 1.12, FY, lz], kl, B(0.5));
    }

    // Cuerpo: primero se trazan las aristas; luego las caras, de la más lejana a la más cercana
    const ke = seg(0.35, 0.7);
    const kf = seg(0.55, 0.75);
    const Fc = [[-tx, -ty, fz], [tx, -ty, fz], [tx, ty, fz], [-tx, ty, fz]];
    const Bc = Fc.map((v) => [v[0] * 0.88, v[1] * 0.88, bz]);
    if (kf <= 0) {
      for (let k = 0; k < 4; k++) {
        LT(Fc[k], Fc[(k + 1) % 4], ke, B(0.75));
        LT(Bc[k], Bc[(k + 1) % 4], ke, B(0.3));
        LT(Fc[k], Bc[k], ke, B(0.45));
      }
    } else {
      const faces = [
        Fc,
        [Bc[1], Bc[0], Bc[3], Bc[2]],
        [Fc[0], Fc[1], Bc[1], Bc[0]],
        [Fc[3], Fc[2], Bc[2], Bc[3]],
        [Fc[0], Fc[3], Bc[3], Bc[0]],
        [Fc[1], Fc[2], Bc[2], Bc[1]]
      ]
        .map((f3) => {
          const w = f3.map(tw);
          return { w, d: w.reduce((t, v) => t + v[2], 0) / 4, front: f3 === Fc };
        })
        .sort((x, y) => y.d - x.d);
      for (const face of faces) {
        poly(face.w, `rgba(${face.front ? 30 : 22}, ${face.front ? 30 : 22}, ${face.front ? 31 : 23}, ${kf * fog})`, B(face.front ? 0.75 : 0.4));
      }
    }

    // Antenas en V con bola en la punta
    const ka = seg(0.55, 0.78);
    const base = [0, -ty, 0];
    for (const tip of [[-280, -600, 0], [250, -620, 0]]) {
      LT(base, tip, ka, B(0.6));
      const pt = PT(tip);
      if (pt && ka >= 1) {
        ctx.fillStyle = B(0.7);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(2, 9 * pt.s), 0, TAU);
        ctx.fill();
      }
    }
    const pb = PT(base);
    if (pb && ka > 0) {
      ctx.strokeStyle = B(0.5);
      ctx.beginPath();
      ctx.arc(pb.x, pb.y, 40 * pb.s * ka, Math.PI, TAU);
      ctx.stroke();
    }

    // Botones (giran despacio) y rejilla del altavoz
    const kk = seg(0.6, 0.8);
    for (const ky of [-120, -20]) {
      if (kk <= 0) continue;
      const ring = [];
      for (let k = 0; k <= 24 * kk; k++) {
        const a3 = (k / 24) * TAU;
        ring.push(PT([240 + Math.cos(a3) * 30, ky + Math.sin(a3) * 30, fz - 1]));
      }
      if (ring.some((v) => !v)) continue;
      ctx.strokeStyle = B(0.6);
      ctx.beginPath();
      ring.forEach((v, k) => (k ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
      ctx.stroke();
      const a4 = now * 0.0005 + ky;
      LT([240, ky, fz - 1], [240 + Math.cos(a4) * 22, ky + Math.sin(a4) * 22, fz - 1], kk, B(0.6));
    }
    for (let y = 70; y <= 190; y += 20) LT([205, y, fz - 1], [275, y, fz - 1], kk, B(0.3));

    // Pantalla
    const S = [[-280, -190, fz - 2], [160, -190, fz - 2], [160, 190, fz - 2], [-280, 190, fz - 2]];
    const q = poly(S.map(tw), null, ke > 0.5 ? B(0.6) : null);
    if (q && on > 0) {
    const num = reduceMotion ? 86 : Math.min(86, Math.max(0, (el - 2400) / 1300) * 86);
    paintScreen(on, num, now);
    ctx.save();
    ctx.beginPath();
    q.forEach((v, k) => (k ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
    ctx.closePath();
    ctx.clip();
    const W = tvCanvas.width;
    const H = tvCanvas.height;
    ctx.globalAlpha = fog * (0.93 + Math.random() * 0.07);
    // Afín a partir de tres esquinas: aproximación suficiente con este giro
    ctx.transform((q[1].x - q[0].x) / W, (q[1].y - q[0].y) / W, (q[3].x - q[0].x) / H, (q[3].y - q[0].y) / H, q[0].x, q[0].y);
    ctx.drawImage(tvCanvas, 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
    }

    // Resplandor de la pantalla: la luz que lo baña todo
    const sc = PT([-60, 0, fz - 2]);
    if (sc && on > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const r = 520 * sc.s;
      const g = ctx.createRadialGradient(sc.x, sc.y, r * 0.1, sc.x, sc.y, r);
      g.addColorStop(0, `rgba(255, 140, 100, ${0.16 * flick * fog})`);
      g.addColorStop(1, 'rgba(255, 140, 100, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(sc.x - r, sc.y - r, r * 2, r * 2);
      ctx.restore();

      // Polvo suspendido, solo visible dentro del haz
      for (let k = 0; k < 40; k++) {
        const ph = k * 12.9898;
        const v = tw([
          -60 + Math.sin(ph) * 260 + Math.sin(now * 0.0002 + ph) * 30,
          Math.cos(ph * 1.7) * 160 + Math.sin(now * 0.00015 + ph) * 40,
          fz - 80 - ((ph * 37 + now * 0.01) % 500)
        ]);
        const p = P(v[0], v[1], v[2]);
        if (!p) continue;
        ctx.fillStyle = `rgba(255, 210, 190, ${0.5 * lit(v) * flick * fog})`;
        ctx.fillRect(p.x, p.y, Math.max(1, 2 * p.s), Math.max(1, 2 * p.s));
      }
    }

    // Bombilla apagada colgando del techo, balanceándose
    const kb = seg(0.5, 0.8);
    const sw = Math.sin(now * 0.0009) * 40;
    const top = [0, CY, zc + 350];
    const bulb = [sw, -380, zc + 350];
    LL(top, bulb, kb, 1.2);
    const pbulb = P(bulb[0], bulb[1] + 26, bulb[2]);
    if (pbulb && kb >= 1) {
      ctx.fillStyle = `rgba(12, 12, 13, ${fog})`;
      ctx.strokeStyle = B(Math.min(0.9, 0.2 + lit(bulb) * 1.4 * flick));
      ctx.beginPath();
      ctx.ellipse(pbulb.x, pbulb.y, 20 * pbulb.s, 26 * pbulb.s, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(pbulb.x - 9 * pbulb.s, pbulb.y - 38 * pbulb.s, 18 * pbulb.s, 14 * pbulb.s);
      ctx.strokeRect(pbulb.x - 9 * pbulb.s, pbulb.y - 38 * pbulb.s, 18 * pbulb.s, 14 * pbulb.s);
    }

  }

  // Un mundo distinto por año. P proyecta (x, y, z relativo a la cámara).
  function drawWorld(c, zc, P, now, fog) {
    const A = 'rgba(255, 90, 54, ';
    const B = 'rgba(242, 239, 233, ';
    ctx.lineWidth = 1;

    if (c.world === 'search') {
      // Voluntad: una barra de búsqueda que escribe sola lo que yo quiero
      const p = P(0, -250, zc);
      if (p) {
        const w = 560 * p.s;
        const h = 64 * p.s;
        ctx.strokeStyle = B + 0.5 * fog + ')';
        ctx.strokeRect(p.x - w / 2, p.y - h / 2, w, h);
        const txt = 'lo que yo quiera';
        const shown = txt.slice(0, Math.floor((now / 140) % (txt.length + 14)));
        ctx.fillStyle = B + 0.8 * fog + ')';
        ctx.textAlign = 'left';
        ctx.font = `400 ${Math.max(9, 22 * p.s)}px ui-monospace, Menlo, monospace`;
        ctx.fillText(shown + ((now / 450) % 2 < 1 ? '▍' : ''), p.x - w / 2 + 18 * p.s, p.y);
      }
      for (const it of c.items) {
        const q = P(Math.cos(it.a) * it.r, Math.sin(it.a) * it.r * 0.7, zc + it.dz);
        if (q) paintShape(it.shape, it.size * q.s, q.x, q.y, it.a, B + 0.35 * fog + ')', false);
      }
    } else if (c.world === 'orbit') {
      // Empieza a girar alrededor de ti
      for (const it of c.items) {
        const a = it.a + now * 0.00035 * (520 / it.r);
        const q = P(Math.cos(a) * it.r, Math.sin(a) * it.r * 0.75, zc + it.dz);
        // Estela: el giro deja rastro
        const t = P(Math.cos(a - 0.35) * it.r, Math.sin(a - 0.35) * it.r * 0.75, zc + it.dz);
        if (q && t) {
          ctx.strokeStyle = (it.hot ? A + 0.35 * fog : B + 0.14 * fog) + ')';
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        if (q) paintShape(it.shape, it.size * q.s, q.x, q.y, a, (it.hot ? A + 0.55 * fog : B + 0.25 * fog) + ')', false);
      }
    } else if (c.world === 'clock') {
      // Mis horas reales: 24 barras, cuanto más larga más vídeos a esa hora
      for (let h = 0; h < 24; h++) {
        const a = (h / 24) * TAU - Math.PI / 2;
        const r0 = 300;
        const r1 = r0 + 20 + HOURS[h] * 260;
        const q0 = P(Math.cos(a) * r0, Math.sin(a) * r0, zc);
        const q1 = P(Math.cos(a) * r1, Math.sin(a) * r1, zc);
        if (!q0 || !q1) continue;
        ctx.strokeStyle = (HOURS[h] > 0.85 ? A + 0.9 * fog : B + 0.35 * fog) + ')';
        ctx.lineWidth = Math.max(1, 10 * q0.s);
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y);
        ctx.lineTo(q1.x, q1.y);
        ctx.stroke();
        if (h % 6 === 0) {
          const ql = P(Math.cos(a) * (r0 - 40), Math.sin(a) * (r0 - 40), zc);
          if (!ql) continue;
          ctx.fillStyle = B + 0.5 * fog + ')';
          ctx.textAlign = 'center';
          ctx.font = `400 ${Math.max(8, 14 * ql.s)}px ui-monospace, Menlo, monospace`;
          ctx.fillText(String(h).padStart(2, '0') + 'h', ql.x, ql.y);
        }
      }
      ctx.lineWidth = 1;
    } else if (c.world === 'feed') {
      // Scroll infinito: columnas de miniaturas que no paran de bajar
      const off = (now * 0.12) % 190;
      for (const it of c.items) {
        const y = it.y - 600 + off;
        const q = P(it.x, y, zc + 120);
        if (!q) continue;
        const w = 240 * q.s;
        const h = 135 * q.s;
        const edge = clamp01(1 - Math.abs(y) / 600);
        const flick = it.hot && Math.sin(now * 0.02 + it.x) > 0.3;
        ctx.fillStyle = (flick ? A + 0.5 * fog * edge : B + 0.05 * fog * edge) + ')';
        ctx.fillRect(q.x - w / 2, q.y - h / 2, w, h);
        ctx.strokeStyle = B + 0.25 * fog * edge + ')';
        ctx.strokeRect(q.x - w / 2, q.y - h / 2, w, h);
      }
    } else if (c.world === 'chain') {
      // Autoplay: cada vídeo enlaza con el siguiente y un pulso recorre la cadena
      let prev = null;
      const pulse = (now * 0.012) % c.items.length;
      c.items.forEach((it, k) => {
        const q = P(it.x, it.y, zc + it.dz);
        if (!q) { prev = null; return; }
        if (prev) {
          ctx.strokeStyle = B + 0.3 * fog + ')';
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        const lit = Math.abs(k - pulse) < 2.5;
        ctx.fillStyle = (lit ? A + 0.95 * fog : B + 0.5 * fog) + ')';
        const r = (lit ? 9 : 5) * q.s;
        ctx.fillRect(q.x - r, q.y - r * 0.56, r * 2, r * 1.12);
        prev = q;
      });
    } else if (c.world === 'tunnel') {
      // Lo que más vi: un túnel de miniaturas que viene hacia ti
      for (const it of c.items) {
        const dz = ((it.dz - now * 0.35) % 900 + 900) % 900 - 450;
        const q = P(Math.cos(it.a) * it.r, Math.sin(it.a) * it.r, zc + dz);
        if (!q) continue;
        const w = 90 * q.s;
        const h = 50 * q.s;
        const qb = P(Math.cos(it.a) * it.r, Math.sin(it.a) * it.r, zc + dz + 120);
        if (qb) {
          ctx.strokeStyle = B + 0.12 * fog + ')';
          ctx.beginPath();
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(qb.x, qb.y);
          ctx.stroke();
        }
        ctx.fillStyle = (it.hot ? A + 0.6 * fog : B + 0.16 * fog) + ')';
        ctx.fillRect(q.x - w / 2, q.y - h / 2, w, h);
      }
    } else if (c.world === 'tv') {
      drawTV(zc, P, now, fog);
    } else if (c.world === 'vortex') {
      // 223 vídeos en un día: un remolino que te traga, ya pixelado
      const grid = 6;
      for (const it of c.items) {
        const a = it.a + now * 0.0009 * it.sp * (300 / it.r);
        const r = it.r * (0.85 + 0.15 * Math.sin(now * 0.001 + it.a));
        const q = P(Math.cos(a) * r, Math.sin(a) * r, zc + it.dz);
        if (!q) continue;
        const sz = Math.max(grid, Math.round((8 * q.s) / grid) * grid);
        ctx.fillStyle = (it.sp > 1.15 ? B + 0.5 * fog : A + 0.7 * fog) + ')';
        ctx.fillRect(Math.round(q.x / grid) * grid, Math.round(q.y / grid) * grid, sz, sz);
      }
    }
  }

  function renderRoom(now) {
    if (room.snapPending && performance.now() - room.lastInput > 450) {
      room.tz = Math.max(0, Math.min(ROOM_MAX_Z, Math.round(room.tz / CHAPTER_GAP) * CHAPTER_GAP));
      room.snapPending = false;
    }

    const chapterIndex = Math.max(
      0,
      Math.min(room.chapters.length - 1, Math.round(room.z / CHAPTER_GAP))
    );

    if (chapterIndex !== room.railIndex) showCard(chapterIndex);
    cardMix += (1 - cardMix) * 0.04;
    if (teleZ) {
      teleZ.textContent = 'PROFUNDIDAD ' + String(Math.round(room.z)).padStart(4, '0');
      teleHead.textContent = 'TU CONTROL ' + String(Math.round((room.ctrl ?? 1) * 100)).padStart(3, '0') + '%';
    }

    if (yearsEl && chapterIndex !== room.railIndex) {
      room.railIndex = chapterIndex;
      Array.from(yearsEl.children).forEach((b, i) => {
        b.classList.toggle('is-current', i === chapterIndex);
        if (i === chapterIndex) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    }

    const gyroLook = gyroOn && gyroPrev && now >= touchLookUntil;

    // Cuanto más manda el algoritmo, menos manda el ratón: la cámara deriva sola
    const fz = Math.min(DATA.length - 2, room.z / CHAPTER_GAP);
    const i0 = Math.floor(fz);
    const aNow = (DATA[i0].algo + (DATA[Math.min(i0 + 1, DATA.length - 2)].algo - DATA[i0].algo) * (fz - i0)) / 100;
    room.ctrl = clamp01(1 - ((aNow - 0.58) / 0.28) * 0.85);
    // Sentado frente a la tele, la cámara se calma
    const drift = reduceMotion ? 0 : (1 - room.ctrl) * (room.verdictAt ? 0.3 : 1);
    const dYaw = Math.sin(now * 0.00031) * 0.26 + Math.sin(now * 0.00077) * 0.06;
    const dPitch = Math.cos(now * 0.00023) * 0.13;
    const baseYaw = gyroLook ? gyroYaw : (pointer.tx / vw - 0.5) * 0.6;
    const basePitch = gyroLook ? gyroPitch : (pointer.ty / vh - 0.5) * 0.4;
    room.tyaw = baseYaw * room.ctrl + dYaw * drift;
    room.tpitch = basePitch * room.ctrl + dPitch * drift;
    const roll = Math.sin(now * 0.00033) * 0.05 * drift;
    if (audio && audio.filter && soundOn) {
      const t = audio.ctx.currentTime;
      audio.filter.frequency.setTargetAtTime(320 + drift * 900, t, 0.4);
      audio.noiseGain.gain.setTargetAtTime(0.018 + drift * 0.05, t, 0.4);
    }

    const lookEase = gyroLook ? 0.05 : 0.08;
    room.yaw += (room.tyaw - room.yaw) * lookEase;
    room.pitch += (room.tpitch - room.pitch) * lookEase;
    room.z += (room.tz - room.z) * 0.09;

    const focal = Math.min(vw, vh) * 0.95;
    const cx = vw / 2;
    const cy = vh / 2;
    const cyaw = Math.cos(room.yaw);
    const syaw = Math.sin(room.yaw);
    const cp = Math.cos(room.pitch);
    const sp = Math.sin(room.pitch);

    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = '#141415';
    ctx.fillRect(0, 0, vw, vh);
    drawGrid();

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(vw, vh) * 0.55);
    glow.addColorStop(0, 'rgba(255, 90, 54, 0.05)');
    glow.addColorStop(1, 'rgba(255, 90, 54, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, vw, vh);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(roll);
    ctx.translate(-cx, -cy);

    const P = (x, y, z) => {
      const x1 = x * cyaw - z * syaw;
      const z1 = x * syaw + z * cyaw;
      const y1 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      if (z2 < 40 || z2 > ROOM_DEPTH) return null;
      const s = focal / z2;
      return { x: cx + x1 * s, y: cy + y1 * s, s, z: z2 };
    };

    for (let i = room.chapters.length - 1; i >= 0; i--) {
      const c = room.chapters[i];
      const zc = c.z - room.z;
      if (zc < -500 || zc > ROOM_DEPTH) continue;
      drawWorld(c, zc, P, now, clamp01(1 - Math.abs(zc - 600) / 750));
      if (i === room.railIndex && Math.abs(zc - 600) < 200) worldSound(c, now);
    }

    for (const p of room.pts) {
      let z = p.z - room.z;

      // Reciclado en ambos sentidos: el polvo siempre rodea la cámara,
      // también al retroceder hacia años anteriores.
      if (z < 40 || z > ROOM_DEPTH) {
        const span = ROOM_DEPTH - 40;
        const wrapped = 40 + (((z - 40) % span) + span) % span;
        p.z += wrapped - z;
        z = wrapped;
      }

      const px = p.x + Math.sin(now * 0.0011 * p.ws + p.phase) * p.wob;
      const py = p.y + Math.cos(now * 0.0009 * p.ws + p.phase * 1.3) * p.wob;
      const x1 = px * cyaw - z * syaw;
      const z1 = px * syaw + z * cyaw;
      const y1 = py * cp - z1 * sp;
      const z2 = py * sp + z1 * cp;
      if (z2 < 40 || z2 > ROOM_DEPTH) continue;

      const s = focal / z2;
      const sx = cx + x1 * s;
      const sy = cy + y1 * s;
      if (sx < -220 || sx > vw + 220 || sy < -220 || sy > vh + 220) continue;

      p.rot += p.vr;
      ctx.globalAlpha = clamp01(1 - z2 / ROOM_DEPTH);
      paintShape(p.shape, p.size * s, sx, sy, p.rot, p.color, false);
    }

    ctx.globalAlpha = 1;
    ctx.textBaseline = 'middle';

    for (let i = room.chapters.length - 1; i >= 0; i--) {
      const c = room.chapters[i];
      if (c.verdict) continue;
      const z = c.z - room.z;
      if (z < 60 || z > ROOM_DEPTH) continue;

      const x1 = -z * syaw;
      const z1 = z * cyaw;
      const y1 = -z1 * sp;
      const z2 = z1 * cp;
      if (z2 < 60) continue;

      const s = focal / z2;
      const sx = cx + x1 * s;
      const sy = cy + y1 * s;
      if (sx < -vw * 0.5 || sx > vw * 1.5 || sy < -vh * 0.5 || sy > vh * 1.5) continue;

      const fog = clamp01(1 - z2 / ROOM_DEPTH);
      const near = clamp01((z2 - 160) / 480);
      const current = i === chapterIndex;
      const fs = Math.max(18, Math.min(120, 46 * s));

      // Aro de paso: se agranda y lo atraviesas
      ctx.globalAlpha = Math.max(0.06, fog) * (0.35 + 0.65 * near);
      ctx.strokeStyle = current ? 'rgba(242, 239, 233, 0.28)' : 'rgba(242, 239, 233, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 240 * s, 0, TAU);
      ctx.stroke();

      // Arco del algoritmo: la parte del año que no elegí
      ctx.strokeStyle = 'rgba(255, 90, 54, 0.9)';
      ctx.lineWidth = Math.max(1.5, Math.min(6, 2.2 * s));
      ctx.beginPath();
      ctx.arc(sx, sy, 240 * s, -Math.PI / 2, -Math.PI / 2 + TAU * c.algo * (current ? cardMix : 1));
      ctx.stroke();

      // Año en contorno: no tapa el fondo ni se vuelve un muro blanco
      ctx.globalAlpha = Math.max(0.06, fog) * near;
      ctx.textAlign = 'center';
      ctx.strokeStyle = current ? 'rgba(255, 90, 54, 0.95)' : 'rgba(242, 239, 233, 0.6)';
      ctx.lineWidth = Math.max(0.8, Math.min(2, 0.5 * s));
      ctx.font = `400 ${fs}px Helvetica, "Helvetica Neue", Arial, sans-serif`;
      ctx.strokeText(String(c.year), sx, sy);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(48, now - last || 16);
    last = now;

    if (roomMode) {
      if (!room.built) buildRoom();
      renderRoom(now);
      if (cursorEl && pointer.seen) {
        cursorEl.style.transform = `translate3d(${pointer.tx}px, ${pointer.ty}px, 0)`;
      }
      requestAnimationFrame(frame);
      return;
    }

    updateIntro(now);

    if (warpActive) {
      const wt = now - warpStart;
      if (wt < 600) warpT = smooth(wt / 600);
      else if (wt < 900) warpT = 1;
      else if (wt < 1600) warpT = 1 - smooth((wt - 900) / 700);
      else {
        warpT = 0;
        warpActive = false;
      }
    } else {
      warpT = 0;
    }

    if (!reduceMotion) {
      for (const b of blobs) {
        b.x += b.vx * dt * 0.06;
        b.y += b.vy * dt * 0.06;
        b.rot += b.vr * dt * 0.06;
        wrap(b, 60);
      }
      for (const h of haze) {
        h.x += h.vx * dt * 0.06;
        h.y += h.vy * dt * 0.06;
        h.rot += h.vr * dt * 0.06;
        wrap(h, h.size * 2);
      }
      for (const m of marks) {
        m.x += m.vx * dt * 0.06;
        m.y += m.vy * dt * 0.06;
        m.rot += m.vr * dt * 0.06;
        wrap(m, 20);
      }
    }

    const follow = reduceMotion ? 1 : 0.12;
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;

    const sy = window.scrollY;
    const scrollDelta = sy - lastScroll;
    lastScroll = sy;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetP = maxScroll > 0 ? clamp01(sy / maxScroll) : 0;
    smoothP += (targetP - smoothP) * (reduceMotion ? 0.35 : 0.09);

    const gnx = Math.max(-1, Math.min(1, (pointer.x - vw / 2) / (vw / 2)));
    const gny = Math.max(-1, Math.min(1, (pointer.y - vh / 2) / (vh / 2)));
    gaze.x = gnx * eye.h * 0.08;
    gaze.y = gny * eye.h * 0.08;

    const eyeMix = smooth(smoothP / 0.22);
    const playMix = smooth((smoothP - 0.52) / 0.12);
    const eyeAlpha = eyeMix * (1 - playMix) * (1 - warpT);
    eyeMixState = eyeMix;
    playMixState = playMix;

    if (eyeMix > 0.92 && !eyeChimed) {
      eyeChimed = true;
      chime(196);
    } else if (eyeMix < 0.5) {
      eyeChimed = false;
    }

    if (playMix > 0.92 && !playChimed) {
      playChimed = true;
      chime(293.66);
    } else if (playMix < 0.4) {
      playChimed = false;
    }

    if (!reduceMotion && eyeMix > 0.5 && playMix < 0.3) {
      if (now > blink.next) {
        blink.next = now + 5000 + Math.random() * 5000;
        if (blink.start < 0) blink.start = now;
      }
      if (Math.abs(scrollDelta) > 35 && now > blink.cooldownUntil) {
        blink.start = now;
        blink.cooldownUntil = now + 900;
      }
    }

    if (blink.start >= 0) {
      const bt = now - blink.start;
      if (bt < 70) blinkOpen = 1 - bt / 70;
      else if (bt < 240) blinkOpen = smooth((bt - 70) / 170);
      else {
        blinkOpen = 1;
        blink.start = -1;
      }
    } else {
      blinkOpen = 1;
    }

    ctx.clearRect(0, 0, vw, vh);
    drawGrid();

    const parX = pointer.x / vw - 0.5;
    const parY = pointer.y / vh - 0.5;

    for (const h of haze) {
      paintShape(h.shape, h.size, h.x + parX * 26, h.y + parY * 18 + smoothP * 26, h.rot, h.color, false);
    }
    drawMarks(parX, parY);

    if (eyeAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = eyeAlpha;
      ctx.translate(vw / 2 + gaze.x, vh / 2 + gaze.y * blinkOpen);
      ctx.scale(1, Math.max(0.12, blinkOpen));
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, eye.h * 0.34);
      grad.addColorStop(0, 'rgba(255, 90, 54, 0.14)');
      grad.addColorStop(1, 'rgba(255, 90, 54, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, eye.h * 0.34, 0, TAU);
      ctx.fill();
      ctx.restore();

      drawEyeOverlay(eyeAlpha, blinkOpen);
      drawRing(now, eyeAlpha);
    }

    if (playMix > 0.01 && warpT < 1) {
      drawPlayOverlay(playMix * (1 - warpT));
    }

    for (const b of blobs) if (!b.pupil) drawBlob(b, now, eyeMix, playMix);
    for (const b of blobs) if (b.pupil) drawBlob(b, now, eyeMix, playMix);

    updateHud(now, eyeMix, playMix);

    if (cursorEl && pointer.seen) {
      cursorEl.style.transform = `translate3d(${pointer.tx}px, ${pointer.ty}px, 0)`;
    }

    requestAnimationFrame(frame);
  }

  const HUD_PANELS = ['PORTADA', 'PREGUNTA', 'ENTRADA'];

  function updateHud(now, eyeMix, playMix) {
    if (!hud.gaze) return;
    const sign = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1).padStart(5, '0');
    const gx = ((pointer.x / vw) - 0.5) * 200;
    const gy = (0.5 - (pointer.y / vh)) * 200;
    const status = intro.active ? 'ADQUIRIENDO'
      : playMix > 0.8 ? 'ESPERANDO ORDEN'
      : eyeMix > 0.8 ? 'TE OBSERVA'
      : 'OBSERVANDO';
    const pi = Math.min(2, Math.round(smoothP * 2));
    // Los registros se cargan durante la entrada
    const loaded = intro.active ? Math.round(60850 * smooth((now - intro.start) / INTRO_END)) : 60850;
    const key = status + pi + loaded + Math.round(gx * 10) + Math.round(gy * 10);
    hud.ticks.style.setProperty('--p', smoothP.toFixed(3));
    if (key === hud.last) return;
    hud.last = key;
    hud.gaze.textContent = 'MIRADA X ' + sign(gx) + ' / Y ' + sign(gy);
    hud.status.textContent = status;
    hud.count.textContent = 'REGISTROS ' + fmt(loaded);
    hud.panel.textContent = '[0' + (pi + 1) + ' / 03]';
    hud.panelName.textContent = HUD_PANELS[pi];
  }

  if (hud.clock) {
    const tick = () => {
      hud.clock.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false }) + ' CET';
    };
    tick();
    setInterval(tick, 1000);
  }

  function makeFilm() {
    const film = document.querySelector('.film');
    if (!film) return;

    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tctx = tile.getContext('2d');
    const img = tctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
    film.style.backgroundImage = `url("${tile.toDataURL()}")`;
  }

  /* Sonido: pad grave continuo generado con Web Audio y campanas suaves */
  function initAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    const a = new AC();
    const master = a.createGain();
    master.gain.value = 0;
    master.connect(a.destination);

    // Las campanas van por su propio canal: el pad puede bajar sin apagarlas
    const chimeBus = a.createGain();
    chimeBus.gain.value = 1;
    chimeBus.connect(a.destination);

    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.6;
    filter.connect(master);

    [
      [55, 'sine', 0.35],
      [82.4, 'triangle', 0.08],
      [110.3, 'triangle', 0.08]
    ].forEach(([freq, type, gain]) => {
      const osc = a.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = a.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    });

    const lfo = a.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = a.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const len = Math.floor(a.sampleRate * 2);
    const buffer = a.createBuffer(1, len, a.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const noise = a.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const band = a.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 0.5;
    const noiseGain = a.createGain();
    noiseGain.gain.value = 0.018;
    noise.connect(band);
    band.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();

    // filter y noiseGain se exponen para que la sala los tense año a año
    return { ctx: a, master, chimeBus, filter, noiseGain };
  }

  function chime(freq) {
    if (!audio || !soundOn) return;

    const a = audio.ctx;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    osc.connect(gain);
    gain.connect(audio.chimeBus);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  // Sonido corto para los mundos de la sala
  function blip(freq, dur, type = 'sine', vol = 0.05, slideTo = 0) {
    if (!audio || !soundOn) return;
    const a = audio.ctx;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(audio.chimeBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Un ritmo propio por mundo: cada año suena distinto y más nervioso
  function worldSound(c, now) {
    const beat = (ms) => {
      const k = Math.floor(now / ms);
      if (k === c.lastBeat) return false;
      c.lastBeat = k;
      return true;
    };
    switch (c.world) {
      case 'search': if (beat(140) && (now / 140) % 30 < 16) blip(1900, 0.025, 'square', 0.012); break;
      case 'orbit': if (beat(1100)) blip([392, 440, 523, 587][Math.floor(now / 1100) % 4], 0.9, 'sine', 0.035); break;
      case 'clock': if (beat(500)) blip(Math.floor(now / 500) % 2 ? 1400 : 1000, 0.03, 'triangle', 0.025); break;
      case 'feed': if (beat(1583)) blip(260, 0.12, 'triangle', 0.04, 140); break;
      case 'chain': if (beat(83)) { const k = Math.floor(now * 0.012) % c.items.length; if (k % 4 === 0) blip(300 + k * 14, 0.08, 'sine', 0.03); } break;
      case 'tunnel': if (beat(420)) blip(110, 0.35, 'sawtooth', 0.03, 45); break;
      case 'vortex': if (beat(90) && Math.random() < 0.6) blip(200 + Math.random() * 1800, 0.035, 'square', 0.014); break;
    }
  }

  function winkSound() {
    if (!audio || !soundOn) return;

    const a = audio.ctx;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain);
    gain.connect(audio.chimeBus);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  function setSound(on) {
    soundOn = on;
    if (!audio) audio = initAudio();
    if (!audio) return;

    if (audio.ctx.state === 'suspended') audio.ctx.resume();

    const g = audio.master.gain;
    const t = audio.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 0.16 : 0, t + (on ? 1.8 : 0.5));

    if (soundBtn) {
      soundBtn.classList.toggle('is-on', on);
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.setAttribute('aria-label', on ? 'Desactivar sonido' : 'Activar sonido');
    }

    if (on) chime(392);
  }

  if (soundBtn) {
    soundBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    soundBtn.addEventListener('keydown', (e) => e.stopPropagation());
    soundBtn.addEventListener('click', () => setSound(!soundOn));

    soundBtn.addEventListener('pointerenter', () => {
      if (cursorEl) cursorEl.classList.add('is-link');
    });
    soundBtn.addEventListener('pointerleave', () => {
      if (cursorEl) cursorEl.classList.remove('is-link');
    });
  }

  if (playCta) {
    playCta.addEventListener('pointerenter', () => {
      if (cursorEl) cursorEl.classList.add('is-link');
    });
    playCta.addEventListener('pointerleave', () => {
      if (cursorEl) cursorEl.classList.remove('is-link');
    });

    playCta.addEventListener('click', () => {
      if (portalBusy || playMixState < 0.8) return;

      // En iOS el permiso debe pedirse dentro del gesto del play
      requestGyro();

      portalBusy = true;
      if (cursorEl) cursorEl.classList.remove('is-link');

      if (!reduceMotion) {
        warpActive = true;
        warpStart = performance.now();
      }

      if (soundOn) {
        chime(196);
        setTimeout(() => chime(294), 160);
        setTimeout(() => chime(392), 320);
      }

      setTimeout(() => {
        warpActive = false;
        warpT = 0;
        enterRoom();
        portalBusy = false;
      }, reduceMotion ? 80 : 600);
    });
  }

  if (roomBack) {
    roomBack.addEventListener('click', exitRoom);
    roomBack.addEventListener('pointerenter', () => {
      if (cursorEl) cursorEl.classList.add('is-link');
    });
    roomBack.addEventListener('pointerleave', () => {
      if (cursorEl) cursorEl.classList.remove('is-link');
    });
  }


  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && roomMode) exitRoom();
  });

  window.addEventListener(
    'wheel',
    (e) => {
      if (!roomMode) return;
      e.preventDefault();
      room.tz = Math.min(ROOM_MAX_Z, Math.max(0, room.tz + e.deltaY * 1.2));
      room.lastInput = performance.now();
      room.snapPending = true;
    },
    { passive: false }
  );

  window.addEventListener('pointerdown', (e) => {
    if (!roomMode) return;
    roomDrag = { x: e.clientX, y: e.clientY };
    if (e.pointerType !== 'mouse') touchLookUntil = performance.now() + 1500;
  });

  window.addEventListener('pointermove', (e) => {
    if (!roomMode || !roomDrag) return;
    const dy = roomDrag.y - e.clientY;
    room.tz = Math.min(ROOM_MAX_Z, Math.max(0, room.tz + dy * 2.2));
    room.lastInput = performance.now();
    room.snapPending = true;
    if (e.pointerType !== 'mouse') touchLookUntil = performance.now() + 1500;
    roomDrag.x = e.clientX;
    roomDrag.y = e.clientY;
  });

  window.addEventListener('pointerup', () => {
    roomDrag = null;
  });

  window.addEventListener('pointercancel', () => {
    roomDrag = null;
  });

  window.addEventListener('resize', () => {
    // La barra de Safari cambia solo la altura: no se reconstruye nada
    if (Math.abs(window.innerWidth - vw) < 2) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 200);
  });

  makeFilm();
  setup();
  requestAnimationFrame(frame);
})();
