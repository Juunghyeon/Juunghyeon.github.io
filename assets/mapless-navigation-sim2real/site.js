/* Sim-to-Real Dynamics Tuning: real-run LiDAR replay, result panels, comparison charts.
   Data: data.js (window.MAPLESS: mean paths, metrics) and replay/<target>-<u|t>.json (one recorded run each). */
(() => {
  const D = window.MAPLESS;
  if (!D) return;
  const BASE = new URL('.', document.currentScript.src).href;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = /[?&]still\b/.test(location.search);
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const NAMES = { u: 'untuned sim', t: 'tuned sim', t1: 'Target 1', t2: 'Target 2', avg: 'Average' };
  const pct = (u, t) => (u - t) / u * 100;
  // one decimal via two, as the manuscript rounds (11.349 -> 11.35 -> 11.4)
  const pct1 = v => (Math.round(Math.round(v * 100) / 10) / 10).toFixed(1);
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------- tooltip (enhances; every value is also in the table) ---------- */
  const tip = document.getElementById('tip');
  function showTip(html, target) {
    tip.innerHTML = html; tip.classList.add('on');
    const r = target.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = r.left + r.width / 2 - w / 2, y = r.top - h - 10;
    if (y < 8) y = r.bottom + 10;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x)) + 'px'; tip.style.top = y + 'px';
  }
  const hideTip = () => tip.classList.remove('on');
  function hoverable(node, html) {
    node.setAttribute('tabindex', '0');
    node.addEventListener('mouseenter', () => showTip(html(), node));
    node.addEventListener('focus', () => showTip(html(), node));
    node.addEventListener('mouseleave', hideTip);
    node.addEventListener('blur', hideTip);
  }
  addEventListener('scroll', hideTip, { passive: true });

  /* ================= real-run replay (canvas) ================= */
  const cv = document.getElementById('rp-canvas');
  // margins around the arena (walls at x -0.6..4.9, y +-1.5) hold the HUD and the scale bar
  const RV = { x0: -0.95, x1: 5.25, y0: -2.05, y1: 2.05 };
  const cache = {};
  const load = key => cache[key] || (cache[key] = fetch(BASE + 'replay/' + key + '.json').then(r => r.json()).then(prep));
  function prep(d) {
    d.mx = Float32Array.from(d.map, p => p[0]); d.my = Float32Array.from(d.map, p => p[1]);
    d.first = Float32Array.from(d.first); d.ft = d.frames.map(f => f[0]); d.pt = d.path.map(p => p[0]); d.ct = d.cmd.map(c => c[0]);
    return d;
  }
  const lastLE = (arr, t) => { let lo = 0, hi = arr.length - 1; if (t < arr[0]) return -1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= t) lo = m; else hi = m - 1; } return lo; };
  const RP = { tg: 't1', c: 'u', d: null, t: 0, playing: false, speed: 3, last: 0, raf: 0, hold: 0, visible: true, drag: false, W: 0, H: 0, k: 1, col: {} };

  function rpSize() {
    const w = cv.parentElement.clientWidth || 760, dpr = Math.min(2, devicePixelRatio || 1);
    RP.k = w / (RV.x1 - RV.x0); RP.W = w; RP.H = Math.round((RV.y1 - RV.y0) * RP.k);
    cv.width = Math.round(w * dpr); cv.height = Math.round(RP.H * dpr); cv.style.height = RP.H + 'px';
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    RP.col = { floor: css('--floor'), grid: css('--grid'), map: css('--map'), scan: css('--scan'), ink: css('--ink'), u: css('--u'), t: css('--t'), bg: css('--panel') };
  }
  const X = x => (x - RV.x0) * RP.k, Y = y => (RV.y1 - y) * RP.k;
  function pose(d, t) {
    const i = Math.max(0, lastLE(d.pt, t)), a = d.path[i], b = d.path[Math.min(i + 1, d.path.length - 1)];
    const f = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0;
    let dy = b[3] - a[3]; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + dy * f, i];
  }
  function draw() {
    const g = cv.getContext('2d'), C = RP.col, d = RP.d, t = RP.t;
    g.fillStyle = C.floor; g.fillRect(0, 0, RP.W, RP.H);
    g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath();
    for (let x = Math.ceil(RV.x0 * 2) / 2; x <= RV.x1; x += 0.5) { g.moveTo(Math.round(X(x)) + .5, 0); g.lineTo(Math.round(X(x)) + .5, RP.H); }
    for (let y = Math.ceil(RV.y0 * 2) / 2; y <= RV.y1; y += 0.5) { g.moveTo(0, Math.round(Y(y)) + .5); g.lineTo(RP.W, Math.round(Y(y)) + .5); }
    g.stroke();
    if (!d) return;
    const s = Math.max(1.6, RP.k * 0.016);
    // everything scanned so far; points first seen in the last 0.8 s fade from scan colour into the map colour
    for (let i = 0; i < d.mx.length; i++) {
      const age = t - d.first[i];
      if (age < 0) continue;
      g.fillStyle = age < 0.8 ? C.scan : C.map; g.globalAlpha = age < 0.8 ? 1 - age / 0.8 * 0.6 : 1;
      g.fillRect(X(d.mx[i]) - s / 2, Y(d.my[i]) - s / 2, s, s);
    }
    g.globalAlpha = 1;
    // the scan at this moment: free-space fan and its returns
    const fi = lastLE(d.ft, t);
    if (fi >= 0) {
      const [, fx, fy, , ids] = d.frames[fi];
      g.beginPath(); g.moveTo(X(fx), Y(fy));
      for (const j of ids) g.lineTo(X(d.mx[j]), Y(d.my[j]));
      g.closePath(); g.fillStyle = C.scan; g.globalAlpha = 0.05; g.fill(); g.globalAlpha = 1;
      g.fillStyle = C.scan;
      for (const j of ids) g.fillRect(X(d.mx[j]) - s * .65, Y(d.my[j]) - s * .65, s * 1.3, s * 1.3);
    }
    // same policy in simulation
    const sim = D.paths[`${RP.tg}-${RP.c}`].sim;
    g.setLineDash([6, 5]); g.strokeStyle = C.ink; g.globalAlpha = .8; g.lineWidth = 1.6; g.beginPath();
    sim.forEach(([x, y], i) => i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))); g.stroke();
    g.setLineDash([]); g.globalAlpha = 1;
    // real path so far
    const [px, py, pyaw, pi] = pose(d, t), col = RP.c === 'u' ? C.u : C.t;
    g.strokeStyle = col; g.lineWidth = 2.6; g.lineJoin = g.lineCap = 'round'; g.beginPath(); g.moveTo(X(d.path[0][1]), Y(d.path[0][2]));
    for (let i = 1; i <= pi; i++) g.lineTo(X(d.path[i][1]), Y(d.path[i][2]));
    g.lineTo(X(px), Y(py)); g.stroke();
    // start and target
    g.strokeStyle = C.ink; g.lineWidth = 1.8; g.beginPath(); g.arc(X(0), Y(0), 5, 0, 7); g.fillStyle = C.bg; g.fill(); g.stroke();
    const [gx, gy] = D.goals[RP.tg]; g.lineWidth = 2.2; g.beginPath();
    g.moveTo(X(gx) - 6, Y(gy) - 6); g.lineTo(X(gx) + 6, Y(gy) + 6); g.moveTo(X(gx) + 6, Y(gy) - 6); g.lineTo(X(gx) - 6, Y(gy) + 6); g.stroke();
    g.fillStyle = C.ink; g.font = '600 11px "JetBrains Mono", monospace'; g.fillText(NAMES[RP.tg].toUpperCase(), X(gx) + 11, Y(gy) + 4);
    // the robot (a heading marker, not to scale)
    g.save(); g.translate(X(px), Y(py)); g.rotate(-pyaw);
    g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, 7); g.lineTo(-3, 0); g.lineTo(-7, -7); g.closePath();
    g.fillStyle = col; g.strokeStyle = C.bg; g.lineWidth = 2; g.stroke(); g.fill(); g.restore();
    // scale bar
    const sx = X(-0.8), sy = Y(-1.9);
    g.strokeStyle = C.ink; g.globalAlpha = .55; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx, sy - 4); g.lineTo(sx, sy); g.lineTo(sx + RP.k, sy); g.lineTo(sx + RP.k, sy - 4); g.stroke();
    g.globalAlpha = 1; g.fillStyle = C.ink; g.font = '11px "JetBrains Mono", monospace'; g.fillText('1 m', sx + RP.k / 2 - 10, sy - 7);
    hud();
  }
  const hudTL = document.getElementById('rp-hud-tl');
  const scrub = document.getElementById('rp-scrub'), timeEl = document.getElementById('rp-time'), playBtn = document.getElementById('rp-play');
  function hud() {
    const d = RP.d, t = RP.t;
    if (!d) return;
    hudTL.innerHTML = `<span class="chip ${RP.c}">${NAMES[RP.c].toUpperCase()}</span> RUN ${d.run}/${d.of}`;
    timeEl.textContent = `${t.toFixed(1)} / ${d.duration.toFixed(1)} s`;
    if (!RP.drag) scrub.value = Math.round(t / d.duration * 1000);
  }
  function loop(now) {
    const dt = Math.min(0.1, (now - (RP.last || now)) / 1000); RP.last = now;
    if (RP.playing && RP.d) {
      if (RP.hold > 0) { RP.hold -= dt; if (RP.hold <= 0) RP.t = 0; }
      else { RP.t += dt * RP.speed; if (RP.t >= RP.d.duration) { RP.t = RP.d.duration; RP.hold = 2.2; } }
    }
    draw();
    RP.raf = RP.playing && RP.visible ? requestAnimationFrame(loop) : 0;
  }
  function kick() { if (!RP.raf && RP.playing && RP.visible) { RP.last = 0; RP.raf = requestAnimationFrame(loop); } }
  function setPlaying(p) {
    RP.playing = p; playBtn.textContent = p ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(p));
    if (p) { if (RP.d && RP.t >= RP.d.duration) RP.t = 0; RP.hold = 0; kick(); } else draw();
  }
  async function select(tg, c) {
    RP.tg = tg; RP.c = c;
    document.querySelectorAll('#rp-target button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.g === tg)));
    document.querySelectorAll('#rp-cond button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.c === c)));
    document.getElementById('rp-sw').className = 'sw ' + c;
    const d = await load(`${tg}-${c}`);
    if (RP.tg !== tg || RP.c !== c) return;
    RP.d = d; RP.hold = 0;
    RP.t = RP.playing ? 0 : d.duration;
    draw(); kick();
  }
  if (cv) {
    rpSize();
    document.getElementById('rp-target').addEventListener('click', e => { const b = e.target.closest('button'); if (b) select(b.dataset.g, RP.c); });
    document.getElementById('rp-cond').addEventListener('click', e => { const b = e.target.closest('button'); if (b) select(RP.tg, b.dataset.c); });
    playBtn.addEventListener('click', () => setPlaying(!RP.playing));
    scrub.addEventListener('pointerdown', () => { RP.drag = true; });
    addEventListener('pointerup', () => { RP.drag = false; });
    scrub.addEventListener('input', () => { if (RP.d) { RP.t = scrub.value / 1000 * RP.d.duration; RP.hold = 0; draw(); } });
    new IntersectionObserver(es => { RP.visible = es[0].isIntersecting; kick(); }, { threshold: .1 }).observe(cv);
    // autoplay unless reduced motion (or ?still for captures); paused, it shows the whole run
    RP.playing = !reduce && !still; playBtn.textContent = RP.playing ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(RP.playing));
    select('t1', 'u').then(() => ['t1-t', 't2-u', 't2-t'].forEach(k => setTimeout(() => load(k), 1500)));
    if (document.fonts) document.fonts.ready.then(() => draw());   // canvas labels use the web font
  }

  /* ================= results: one panel per target and simulator ================= */
  let clipN = 0;
  function makeMap(svg, v) {
    const W = (v.x1 - v.x0) * v.k, H = (v.y1 - v.y0) * v.k;
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    const Xm = x => +((x - v.x0) * v.k).toFixed(1), Ym = y => +((v.y1 - y) * v.k).toFixed(1);
    const A = D.arena, id = 'arena-clip-' + (clipN++);
    const box = { x: Xm(A.x), y: Ym(A.y + A.h), width: +(A.w * v.k).toFixed(1), height: +(A.h * v.k).toFixed(1) };
    el('rect', box, el('clipPath', { id }, el('defs', {}, svg)));
    el('rect', Object.assign({ class: 'm-floor', rx: 3 }, box), svg);
    const inner = el('g', { 'clip-path': `url(#${id})` }, svg);
    for (let x = Math.ceil(A.x * 2) / 2; x <= A.x + A.w; x += 0.5) el('line', { class: 'm-grid', x1: Xm(x), x2: Xm(x), y1: Ym(A.y), y2: Ym(A.y + A.h) }, inner);
    for (let y = Math.ceil(A.y * 2) / 2; y <= A.y + A.h; y += 0.5) el('line', { class: 'm-grid', x1: Xm(A.x), x2: Xm(A.x + A.w), y1: Ym(y), y2: Ym(y) }, inner);
    A.obstacles.forEach(([cx, cy]) => el('rect', { class: 'm-obst', rx: 2, x: Xm(cx - A.ow / 2), y: Ym(cy + A.oh / 2), width: +(A.ow * v.k).toFixed(1), height: +(A.oh * v.k).toFixed(1) }, inner));
    el('rect', Object.assign({ class: 'm-floor', rx: 3, style: 'fill:none' }, box), svg);
    const d = pts => pts.length ? 'M' + pts.map(([x, y]) => Xm(x) + ' ' + Ym(y)).join('L') : '';
    return { svg, X: Xm, Y: Ym, W, H, d };
  }
  function marks(m, tg) {
    const g = el('g', {}, m.svg);
    el('circle', { class: 'm-start', cx: m.X(0), cy: m.Y(0), r: 5 }, g);
    const [gx, gy] = D.goals[tg], x = m.X(gx), y = m.Y(gy), s = 6;
    el('path', { class: 'm-goal', d: `M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}` }, g);
  }
  function scaleBar(m, x, y) {
    const g = el('g', {}, m.svg), x0 = m.X(x), x1 = m.X(x + 1), yy = m.Y(y);
    el('path', { class: 'm-scale', d: `M${x0} ${yy - 4}V${yy}H${x1}V${yy - 4}` }, g);
    el('text', { class: 'm-lbl', x: (x0 + x1) / 2, y: yy - 7, 'text-anchor': 'middle' }, g).textContent = '1 m';
  }
  const gapD = (m, real, sim) => m.d(real) + 'L' + sim.slice().reverse().map(([x, y]) => m.X(x) + ' ' + m.Y(y)).join('L') + 'Z';
  const fitK = (svg, v) => { const w = svg.getBoundingClientRect().width; return w > 0 ? w / (v.x1 - v.x0) : v.k; };
  const PV = { t1: { x0: -0.38, x1: 4.38, y0: -0.42, y1: 1.18, k: 120 }, t2: { x0: -0.38, x1: 4.38, y0: -0.8, y1: 0.8, k: 120 } };
  function panelsBuild() {
    document.querySelectorAll('svg[data-panel]').forEach(svg => {
      const [tg, c] = svg.dataset.panel.split('-'), P = D.paths[`${tg}-${c}`];
      svg.textContent = '';
      const m = makeMap(svg, Object.assign({}, PV[tg], { k: fitK(svg, PV[tg]) }));
      const g = el('g', { class: 'c-' + c }, svg);
      el('path', { class: 'm-gap', d: gapD(m, P.lidar, P.sim) }, g);
      P.runs.forEach(r => el('path', { class: 'm-run', d: m.d(r) }, g));
      el('path', { class: 'm-odom', d: m.d(P.odom) }, g);
      el('path', { class: 'm-sim', d: m.d(P.sim) }, g);
      el('path', { class: 'm-real', d: m.d(P.lidar) }, g);
      marks(m, tg);
      scaleBar(m, PV[tg].x0 + 0.14, PV[tg].y0 + 0.12);
    });
  }
  panelsBuild();
  const odomToggle = document.getElementById('odom-toggle');
  if (odomToggle) odomToggle.addEventListener('change', () => document.getElementById('panels').classList.toggle('no-odom', !odomToggle.checked));

  /* ================= dumbbell charts: untuned vs tuned per target ================= */
  // dot plots encode position, not length, so the axis spans the data range (both sources fit) rather than starting at 0
  const MET = {
    rmse: { scale: 100, unit: 'cm', min: 5, max: 9, ticks: [5, 6, 7, 8, 9], dp: 2 },
    dtw: { scale: 100, unit: 'cm', min: 4, max: 7, ticks: [4, 5, 6, 7], dp: 2 },
    head: { scale: 1, unit: 'rad', min: 0.1, max: 0.35, ticks: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35], dp: 3 },
  };
  const ROWS = ['t1', 't2', 'avg'];
  let src = 'lidar';
  const fmtP = p => p < 0.001 ? 'p < 0.001' : 'p = ' + (p < 0.1 ? p.toFixed(3) : p.toFixed(2));
  function drawChart(fig) {
    const k = fig.dataset.m, cfg = MET[k], svg = fig.querySelector('svg');
    svg.textContent = '';
    const W = 360, L = 70, R = 86, top = 10, rowH = 46, PW = W - L - R, H = top + rowH * 3 + 26;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const xs = t => L + (t - cfg.min) / (cfg.max - cfg.min) * PW, x = v => xs(v * cfg.scale);
    cfg.ticks.forEach(t => {
      const xx = xs(t);
      el('line', { class: 'c-grid', x1: xx, x2: xx, y1: top - 4, y2: top + rowH * 3 }, svg);
      el('text', { class: 'c-axis', x: xx, y: top + rowH * 3 + 16, 'text-anchor': 'middle' }, svg).textContent = cfg.scale === 1 ? t.toFixed(2).replace(/0$/, '') : t;
    });
    el('line', { class: 'c-grid', x1: 4, x2: W - 4, y1: top + rowH * 2 - 1, y2: top + rowH * 2 - 1 }, svg);
    ROWS.forEach((row, i) => {
      const cy = top + rowH * i + rowH / 2 - 4, M = D.metrics[src][k][row], u = M.u[0], t = M.t[0];
      el('text', { class: 'c-row', x: 4, y: cy + 4 }, svg).textContent = NAMES[row];
      el('line', { class: 'c-link', x1: x(u), x2: x(t), y1: cy, y2: cy }, svg);
      ['u', 't'].forEach(c => {
        const hit = el('circle', { class: 'c-hit', cx: x(M[c][0]), cy, r: 13, role: 'img', 'aria-label': `${NAMES[row]}, ${NAMES[c]}: ${(M[c][0] * cfg.scale).toFixed(cfg.dp)} ${cfg.unit}` }, svg);
        el('circle', { class: 'c-dot ' + c, cx: x(M[c][0]), cy, r: 6 }, svg);
        hoverable(hit, () => {
          let h = `<b>${NAMES[row]} · ${NAMES[c]}</b><br>${(M[c][0] * cfg.scale).toFixed(cfg.dp)} ± ${(M[c][1] * cfg.scale).toFixed(cfg.dp)} ${cfg.unit}`;
          const s = src === 'lidar' && D.sig[row] && D.sig[row][k];
          if (c === 't' && s) h += `<br>Welch ${fmtP(s.p)} · Mann–Whitney ${fmtP(s.p_mwu)}`;
          return h;
        });
      });
      const s = src === 'lidar' && D.sig[row] && D.sig[row][k];
      el('text', { class: 'c-pct', x: L + PW + 12, y: cy + (s ? 0 : 4) }, svg).textContent = '−' + pct1(pct(u, t)) + ' %';
      if (s) el('text', { class: 'c-p', x: L + PW + 12, y: cy + 14 }, svg).textContent = s.p < 0.05 ? fmtP(s.p) : 'n.s. (' + s.p.toFixed(2) + ')';
    });
  }
  const charts = document.querySelectorAll('#charts .chart');
  const srcSeg = document.getElementById('src-seg'), note = document.getElementById('charts-note');
  const noteLidar = note ? note.textContent : '';
  function setSrc(s) {
    src = s;
    srcSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.s === s)));
    charts.forEach(drawChart);
    if (note) note.textContent = s === 'lidar' ? noteLidar : 'Percentages: reduction from the untuned to the tuned simulator, with the real path from wheel odometry. Significance was tested on the LiDAR estimate.';
  }
  if (srcSeg) {
    srcSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.s !== src) setSrc(b.dataset.s); });
    setSrc('lidar');
  }

  /* ================= agreement: reduction by each estimate ================= */
  const agree = document.getElementById('agree');
  function agreeBuild() {
    agree.textContent = '';
    const rows = [['rmse', 'Aligned RMSE'], ['dtw', 'Normalized DTW'], ['head', 'Heading RMSE']];
    const W = Math.round(agree.getBoundingClientRect().width) || 460;
    const L = 116, R = 60, top = 6, band = 50, bh = 14, gap = 2, PW = W - L - R, max = 30, H = top + band * 3 + 22;
    agree.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = v => L + v / max * PW;
    [0, 10, 20, 30].forEach(t => {
      el('line', { class: 'c-grid', x1: x(t), x2: x(t), y1: top, y2: top + band * 3 }, agree);
      el('text', { class: 'c-axis', x: x(t), y: top + band * 3 + 16, 'text-anchor': 'middle' }, agree).textContent = t + ' %';
    });
    const bar = (x0, y, w, h) => `M${x0} ${y}H${x0 + w - 3}a3 3 0 0 1 3 3V${y + h - 3}a3 3 0 0 1 -3 3H${x0}Z`;
    rows.forEach(([k, name], i) => {
      const y0 = top + band * i + (band - (2 * bh + gap)) / 2;
      el('text', { class: 'c-row', x: 0, y: y0 + bh + 5 }, agree).textContent = name;
      [['lidar', 'var(--ink)', 'LiDAR scan matching'], ['odom', 'var(--est2)', 'wheel odometry']].forEach(([s, col, label], j) => {
        const a = D.metrics[s][k].avg, v = pct(a.u[0], a.t[0]), y = y0 + j * (bh + gap);
        const p = el('path', { d: bar(L, y, Math.max(6, x(v) - L), bh), style: `fill:${col}` }, agree);
        el('text', { class: 'c-pct', x: x(v) + 6, y: y + bh - 3 }, agree).textContent = pct1(v) + ' %';
        const sc = k === 'head' ? 1 : 100, un = k === 'head' ? 'rad' : 'cm', dp = k === 'head' ? 3 : 2;
        hoverable(p, () => `<b>${name} · ${label}</b><br>−${pct1(v)} % (${(a.u[0] * sc).toFixed(dp)} → ${(a.t[0] * sc).toFixed(dp)} ${un})`);
      });
    });
  }
  if (agree) agreeBuild();

  /* citations open the collapsed reference list, then jump to the entry */
  const refbox = document.getElementById('references');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#ref-"]');
    if (!a || !refbox) return;
    refbox.open = true;
    const li = document.querySelector(a.getAttribute('href'));
    if (li) { e.preventDefault(); li.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); history.replaceState(null, '', a.getAttribute('href')); }
  });
  if (refbox && /^#ref-\d+$/.test(location.hash)) refbox.open = true;

  /* rebuild width-fitted drawings when the width changes */
  let lastW = innerWidth, rt = 0;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth; clearTimeout(rt);
    rt = setTimeout(() => { if (cv) { rpSize(); draw(); } panelsBuild(); if (agree) agreeBuild(); }, 150);
  });
})();
