(() => {
  const canvas = document.querySelector('#grain');
  const ctx = canvas.getContext('2d');
  const h1 = document.querySelector('h1');
  const cursorEl = document.querySelector('.cursor');
  const soundBtn = document.querySelector('.sound');
  const playCta = document.querySelector('.play-cta');
  const roomEl = document.querySelector('#room');
  const roomBack = document.querySelector('.room__back');
  const yearsEl = document.querySelector('#roomYears');
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
  const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
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

  /* Puntos del nombre para la entrada: se dibuja el h1 en un canvas oculto y se muestrean sus píxeles */
  function buildNameTargets() {
    const off = document.createElement('canvas');
    off.width = vw;
    off.height = vh;
    const o = off.getContext('2d', { willReadFrequently: true });
    if (!o) return false;

    const cs = getComputedStyle(h1);
    const rect = h1.getBoundingClientRect();
    o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing;
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    o.fillText('alvaropuertolas', rect.left, rect.top + rect.height / 2);

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

    room.chapters = YEARS.map((year, i) => ({
      year,
      z: 600 + i * CHAPTER_GAP,
      labels: [
        { name: 'horas', dx: -250, dy: 170 },
        { name: 'vídeos', dx: 20, dy: 210 },
        { name: 'canales', dx: 270, dy: 180 }
      ]
    }));

    // Nube propia alrededor de cada año
    const cluster = vw < 700 ? 14 : 26;

    for (const c of room.chapters) {
      for (let k = 0; k < cluster; k++) {
        const a = rnd(0, TAU);
        const r = rnd(120, 420);
        room.pts.push({
          x: Math.cos(a) * r,
          y: Math.sin(a) * r * 0.7,
          z: c.z + rnd(-180, 180),
          size: rnd(2, 8),
          shape: makeShape(5 + Math.floor(rnd(0, 4))),
          rot: rnd(0, TAU),
          vr: rnd(-0.0015, 0.0015),
          phase: rnd(0, TAU),
          ws: rnd(0.3, 0.9),
          wob: rnd(2, 8),
          color: Math.random() < 0.2 ? ACCENT : GRAYS[Math.floor(rnd(0, GRAYS.length))]
        });
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

  function renderRoom(now) {
    if (room.snapPending && performance.now() - room.lastInput > 450) {
      room.tz = Math.max(0, Math.min(ROOM_MAX_Z, Math.round(room.tz / CHAPTER_GAP) * CHAPTER_GAP));
      room.snapPending = false;
    }

    const chapterIndex = Math.max(
      0,
      Math.min(room.chapters.length - 1, Math.round(room.z / CHAPTER_GAP))
    );

    if (yearsEl && chapterIndex !== room.railIndex) {
      room.railIndex = chapterIndex;
      Array.from(yearsEl.children).forEach((b, i) => {
        b.classList.toggle('is-current', i === chapterIndex);
        if (i === chapterIndex) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    }

    const gyroLook = gyroOn && gyroPrev;

    if (gyroLook) {
      room.tyaw = gyroYaw;
      room.tpitch = gyroPitch;
    } else {
      room.tyaw = (pointer.tx / vw - 0.5) * 0.6;
      room.tpitch = (pointer.ty / vh - 0.5) * 0.4;
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
      ctx.strokeStyle = current ? 'rgba(255, 90, 54, 0.5)' : 'rgba(242, 239, 233, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 240 * s, 0, TAU);
      ctx.stroke();

      // Año en contorno: no tapa el fondo ni se vuelve un muro blanco
      ctx.globalAlpha = Math.max(0.06, fog) * near;
      ctx.textAlign = 'center';
      ctx.strokeStyle = current ? 'rgba(255, 90, 54, 0.95)' : 'rgba(242, 239, 233, 0.6)';
      ctx.lineWidth = Math.max(0.8, Math.min(2, 0.5 * s));
      ctx.font = `400 ${fs}px Helvetica, "Helvetica Neue", Arial, sans-serif`;
      ctx.strokeText(String(c.year), sx, sy);

      const dfs = Math.max(10, Math.min(30, 14 * s));
      ctx.globalAlpha = Math.max(0.05, fog) * near;
      ctx.textAlign = 'left';
      ctx.font = `400 ${dfs}px Helvetica, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(242, 239, 233, 0.55)';

      for (const d of c.labels) {
        const lx1 = d.dx * cyaw - z * syaw;
        const lz1 = d.dx * syaw + z * cyaw;
        const ly1 = d.dy * cp - lz1 * sp;
        const lz2 = d.dy * sp + lz1 * cp;
        if (lz2 < 60) continue;

        const ls = focal / lz2;
        ctx.fillText(d.name + ' —', cx + lx1 * ls + 8, cy + ly1 * ls);
      }
    }

    ctx.globalAlpha = 1;
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

    if (cursorEl && pointer.seen) {
      cursorEl.style.transform = `translate3d(${pointer.tx}px, ${pointer.ty}px, 0)`;
    }

    requestAnimationFrame(frame);
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

    return { ctx: a, master, chimeBus };
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
  });

  window.addEventListener('pointermove', (e) => {
    if (!roomMode || !roomDrag) return;
    const dy = roomDrag.y - e.clientY;
    room.tz = Math.min(ROOM_MAX_Z, Math.max(0, room.tz + dy * 2.2));
    room.lastInput = performance.now();
    room.snapPending = true;
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
