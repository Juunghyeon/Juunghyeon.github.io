/* Sim-to-Real Dynamics Tuning: maps, hero replay, comparison charts. Data: data.js (window.MAPLESS). */
(() => {
  const D = window.MAPLESS;
  if (!D) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const NAMES = { u: 'untuned sim', t: 'tuned sim', t1: 'Target 1', t2: 'Target 2', avg: 'Average' };
  const pct = (u, t) => (u - t) / u * 100;

  /* ---------- tooltip (enhances; every value is also in the table) ---------- */
  const tip = document.getElementById('tip');
  function showTip(html, target) {
    tip.innerHTML = html;
    tip.classList.add('on');
    const r = target.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = r.left + r.width / 2 - w / 2, y = r.top - h - 10;
    if (y < 8) y = r.bottom + 10;
    x = Math.max(8, Math.min(innerWidth - w - 8, x));
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
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

  /* ---------- arena map ---------- */
  let clipN = 0;
  function makeMap(svg, v) {
    const W = (v.x1 - v.x0) * v.k, H = (v.y1 - v.y0) * v.k;
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    const X = x => +((x - v.x0) * v.k).toFixed(1), Y = y => +((v.y1 - y) * v.k).toFixed(1);
    const A = D.arena, id = 'arena-clip-' + (clipN++);
    const box = { x: X(A.x), y: Y(A.y + A.h), width: +(A.w * v.k).toFixed(1), height: +(A.h * v.k).toFixed(1) };
    el('rect', box, el('clipPath', { id }, el('defs', {}, svg)));
    el('rect', Object.assign({ class: 'm-floor', rx: 4 }, box), svg);
    const inner = el('g', { 'clip-path': `url(#${id})` }, svg);
    for (let x = Math.ceil(A.x); x <= A.x + A.w; x++) el('line', { class: 'm-grid', x1: X(x), x2: X(x), y1: Y(A.y), y2: Y(A.y + A.h) }, inner);
    for (let y = Math.ceil(A.y); y <= A.y + A.h; y++) el('line', { class: 'm-grid', x1: X(A.x), x2: X(A.x + A.w), y1: Y(y), y2: Y(y) }, inner);
    A.obstacles.forEach(([cx, cy]) => el('rect', { class: 'm-obst', rx: 3, x: X(cx - A.ow / 2), y: Y(cy + A.oh / 2), width: +(A.ow * v.k).toFixed(1), height: +(A.oh * v.k).toFixed(1) }, inner));
    el('rect', Object.assign({ class: 'm-floor', rx: 4, fill: 'none', style: 'fill:none' }, box), svg);
    const d = pts => pts.length ? 'M' + pts.map(([x, y]) => X(x) + ' ' + Y(y)).join('L') : '';
    return { svg, X, Y, W, H, d, v };
  }
  function marks(m, targets, labels) {
    const g = el('g', {}, m.svg);
    el('circle', { class: 'm-start', cx: m.X(0), cy: m.Y(0), r: 6 }, g);
    if (labels) el('text', { class: 'm-lbl', x: m.X(0) - 12, y: m.Y(0) + 4.5, 'text-anchor': 'end' }, g).textContent = 'Start';
    targets.forEach(tg => {
      const [gx, gy] = D.goals[tg], x = m.X(gx), y = m.Y(gy), s = 7;
      el('path', { class: 'm-goal', d: `M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}` }, g);
      if (labels) {
        // right of the mark; on narrow maps, tucked under it so it stays inside the frame
        const fits = x + 13 + 70 < m.W;
        el('text', { class: 'm-tag', x: fits ? x + 13 : Math.min(x + 9, m.W - 4), y: fits ? y + 5 : y + 26, 'text-anchor': fits ? 'start' : 'end' }, g).textContent = NAMES[tg];
      }
    });
    return g;
  }
  function scaleBar(m, x, y) {
    const g = el('g', {}, m.svg), x0 = m.X(x), x1 = m.X(x + 1), yy = m.Y(y);
    el('path', { class: 'm-scale', d: `M${x0} ${yy - 4}V${yy}H${x1}V${yy - 4}` }, g);
    el('text', { class: 'm-lbl', x: (x0 + x1) / 2, y: yy - 8, 'text-anchor': 'middle' }, g).textContent = '1 m';
  }
  const gapD = (m, real, sim) => m.d(real) + 'L' + sim.slice().reverse().map(([x, y]) => m.X(x) + ' ' + m.Y(y)).join('L') + 'Z';
  function prefix(pts, f) {
    if (f >= 1) return pts;
    const i = f * (pts.length - 1), k = Math.floor(i), a = i - k, out = pts.slice(0, k + 1);
    if (k + 1 < pts.length) out.push([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * a, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * a]);
    return out;
  }

  /* Maps are built at their rendered width (1 viewBox unit = 1 CSS px), so labels, strokes and markers
     keep their size on any screen; they are rebuilt when the width changes. */
  const fitK = (svg, v) => { const w = svg.getBoundingClientRect().width; return w > 0 ? w / (v.x1 - v.x0) : v.k; };

  /* ---------- hero: both targets, replayed when the simulator is switched ---------- */
  const heroSvg = document.getElementById('hero-map');
  const hero = { cond: 'u', raf: 0, m: null, layer: null, tracks: [], heads: [] };
  // the robot drives in the upper part of the arena; the strip below y = -0.98 (one obstacle) is cropped
  const HV = { x0: -0.78, x1: 5.08, y0: -0.98, y1: 1.62, k: 200 };
  function heroFrame(f) {
    const { m, tracks, heads, cond } = hero;
    tracks.forEach((tr, i) => {
      const P = D.paths[`${tr.tg}-${cond}`], s = prefix(P.sim, f), r = prefix(P.lidar, f);
      tr.sim.setAttribute('d', m.d(s)); tr.real.setAttribute('d', m.d(r));
      const hs = s[s.length - 1], hr = r[r.length - 1];
      heads[i].s.setAttribute('cx', m.X(hs[0])); heads[i].s.setAttribute('cy', m.Y(hs[1]));
      heads[i].r.setAttribute('cx', m.X(hr[0])); heads[i].r.setAttribute('cy', m.Y(hr[1]));
      const done = f >= 1;
      heads[i].s.style.opacity = heads[i].r.style.opacity = done ? 0 : 1;
      if (done) tr.gap.setAttribute('d', gapD(m, P.lidar, P.sim));
      tr.gap.style.opacity = done ? 1 : 0;
    });
  }
  function heroBuild() {
    cancelAnimationFrame(hero.raf);
    heroSvg.textContent = '';
    const v = Object.assign({}, HV, { k: fitK(heroSvg, HV) });
    hero.m = makeMap(heroSvg, v);
    hero.layer = el('g', { class: 'c-' + hero.cond }, heroSvg);
    hero.tracks = ['t1', 't2'].map(tg => ({
      tg,
      gap: el('path', { class: 'm-gap' }, hero.layer),
      sim: el('path', { class: 'm-sim' }, hero.layer),
      real: el('path', { class: 'm-real' }, hero.layer),
    }));
    hero.heads = hero.tracks.map(() => ({ s: el('circle', { class: 'm-head sim', r: 5 }, hero.layer), r: el('circle', { class: 'm-head', r: 6.5 }, hero.layer) }));
    marks(hero.m, ['t1', 't2'], true);
    scaleBar(hero.m, -0.45, -0.82);
    // soft fade on the cropped lower edge
    const lg = el('linearGradient', { id: 'hero-fade', x1: 0, x2: 0, y1: 0, y2: 1 }, el('defs', {}, heroSvg));
    el('stop', { offset: 0, style: 'stop-color:var(--card);stop-opacity:0' }, lg);
    el('stop', { offset: 1, style: 'stop-color:var(--card);stop-opacity:1' }, lg);
    el('rect', { x: 0, y: hero.m.H - 36, width: hero.m.W, height: 36, fill: 'url(#hero-fade)', 'pointer-events': 'none' }, heroSvg);
    heroFrame(1);
  }
  function heroPlay() {
    cancelAnimationFrame(hero.raf);
    if (reduce) return heroFrame(1);
    const t0 = performance.now(), dur = 3400;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      heroFrame(e);
      if (p < 1) hero.raf = requestAnimationFrame(step);
    };
    hero.raf = requestAnimationFrame(step);
  }
  if (heroSvg) {
    const seg = document.getElementById('hero-seg'), readout = document.getElementById('hero-readout');
    const swReal = document.getElementById('hero-sw-real'), swGap = document.getElementById('hero-sw-gap');
    function setCond(c) {
      hero.cond = c;
      hero.layer.setAttribute('class', 'c-' + c);
      seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.c === c)));
      swReal.className = 'sw ' + c; swGap.className = 'sw gap ' + c;
      const R = D.metrics.lidar.rmse;
      readout.innerHTML = `Aligned RMSE &nbsp; Target 1 <b>${(R.t1[c][0] * 100).toFixed(2)} cm</b> &nbsp;·&nbsp; Target 2 <b>${(R.t2[c][0] * 100).toFixed(2)} cm</b>`;
      heroPlay();
    }
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.c !== hero.cond) setCond(b.dataset.c); });
    seg.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const next = hero.cond === 'u' ? 't' : 'u'; setCond(next); seg.querySelector(`[data-c="${next}"]`).focus(); e.preventDefault();
    });
    document.getElementById('hero-replay').addEventListener('click', heroPlay);
    // finished paths by default (print, screenshots, hidden tabs); the draw-in plays once the map is on screen
    heroBuild();
    if (!/[?&]still\b/.test(location.search) && !reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        if (es[0].isIntersecting && document.visibilityState === 'visible') { io.disconnect(); heroPlay(); }
      }, { threshold: .35 });
      io.observe(heroSvg);
    }
  }

  /* ---------- results: one panel per target and simulator ---------- */
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
      marks(m, [tg], false);
      scaleBar(m, PV[tg].x0 + 0.14, PV[tg].y0 + 0.12);
    });
  }
  panelsBuild();
  let lastW = innerWidth, rt = 0;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth; clearTimeout(rt);
    rt = setTimeout(() => { if (heroSvg) heroBuild(); panelsBuild(); if (agree) agreeBuild(); }, 150);
  });
  const odomToggle = document.getElementById('odom-toggle');
  if (odomToggle) odomToggle.addEventListener('change', () => document.getElementById('panels').classList.toggle('no-odom', !odomToggle.checked));

  /* ---------- dumbbell charts: untuned vs tuned per target ---------- */
  // dot plots encode position, not length, so the axis spans the data range (both sources fit) rather than starting at 0
  const MET = {
    rmse: { scale: 100, unit: 'cm', min: 5, max: 9, ticks: [5, 6, 7, 8, 9], dp: 2, sdp: 2 },
    dtw: { scale: 100, unit: 'cm', min: 4, max: 7, ticks: [4, 5, 6, 7], dp: 2, sdp: 2 },
    head: { scale: 1, unit: 'rad', min: 0.1, max: 0.35, ticks: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35], dp: 3, sdp: 3 },
  };
  const ROWS = ['t1', 't2', 'avg'];
  let src = 'lidar';
  const fmtP = p => p < 0.001 ? 'p < 0.001' : 'p = ' + (p < 0.01 ? p.toFixed(3) : p < 0.1 ? p.toFixed(3) : p.toFixed(2));
  function drawChart(fig) {
    const k = fig.dataset.m, cfg = MET[k], svg = fig.querySelector('svg');
    svg.textContent = '';
    const W = 360, L = 72, R = 84, top = 10, rowH = 46, PW = W - L - R, H = top + rowH * 3 + 26;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const xs = t => L + (t - cfg.min) / (cfg.max - cfg.min) * PW, x = v => xs(v * cfg.scale);
    cfg.ticks.forEach(t => {
      const xx = xs(t);
      el('line', { class: 'c-grid', x1: xx, x2: xx, y1: top - 4, y2: top + rowH * 3 }, svg);
      el('text', { class: 'c-axis', x: xx, y: top + rowH * 3 + 16, 'text-anchor': 'middle' }, svg).textContent = cfg.scale === 1 ? t.toFixed(2).replace(/0$/, '') : t;
    });
    el('line', { class: 'c-grid', x1: 6, x2: W - 4, y1: top + rowH * 2 - 1, y2: top + rowH * 2 - 1 }, svg);
    ROWS.forEach((row, i) => {
      const cy = top + rowH * i + rowH / 2 - 4, M = D.metrics[src][k][row], u = M.u[0], t = M.t[0];
      el('text', { class: 'c-row', x: 6, y: cy + 4.5 }, svg).textContent = NAMES[row];
      el('line', { class: 'c-link', x1: x(u), x2: x(t), y1: cy, y2: cy }, svg);
      ['u', 't'].forEach(c => {
        const hit = el('circle', { class: 'c-hit', cx: x(M[c][0]), cy, r: 13, role: 'img', 'aria-label': `${NAMES[row]}, ${NAMES[c]}: ${(M[c][0] * cfg.scale).toFixed(cfg.dp)} ${cfg.unit}` }, svg);
        el('circle', { class: 'c-dot ' + c, cx: x(M[c][0]), cy, r: 6 }, svg);
        hoverable(hit, () => {
          let h = `<b>${NAMES[row]} · ${NAMES[c]}</b><br>${(M[c][0] * cfg.scale).toFixed(cfg.dp)} ± ${(M[c][1] * cfg.scale).toFixed(cfg.sdp)} ${cfg.unit}`;
          const s = src === 'lidar' && D.sig[row] && D.sig[row][k];
          if (c === 't' && s) h += `<br>Welch ${fmtP(s.p)} · Mann–Whitney ${fmtP(s.p_mwu)}`;
          return h;
        });
      });
      el('text', { class: 'c-pct', x: L + PW + 12, y: cy + (src === 'lidar' && row !== 'avg' ? 0 : 4.5) }, svg).textContent = '−' + pct(u, t).toFixed(1) + ' %';
      const s = src === 'lidar' && D.sig[row] && D.sig[row][k];
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
    srcSeg.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const next = src === 'lidar' ? 'odom' : 'lidar'; setSrc(next); srcSeg.querySelector(`[data-s="${next}"]`).focus(); e.preventDefault();
    });
    setSrc('lidar');
  }

  /* ---------- agreement: reduction by each estimate ---------- */
  const agree = document.getElementById('agree');
  function agreeBuild() {
    agree.textContent = '';
    const rows = [['rmse', 'Aligned RMSE'], ['dtw', 'Normalized DTW'], ['head', 'Heading RMSE']];
    const W = Math.round(agree.getBoundingClientRect().width) || 460;
    const L = 118, R = 56, top = 6, band = 50, bh = 14, gap = 2, PW = W - L - R, max = 30, H = top + band * 3 + 22;
    agree.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const x = v => L + v / max * PW;
    [0, 10, 20, 30].forEach(t => {
      el('line', { class: 'c-grid', x1: x(t), x2: x(t), y1: top, y2: top + band * 3 }, agree);
      el('text', { class: 'c-axis', x: x(t), y: top + band * 3 + 16, 'text-anchor': 'middle' }, agree).textContent = t + ' %';
    });
    const bar = (x0, y, w, h) => `M${x0} ${y}H${x0 + w - 4}a4 4 0 0 1 4 4V${y + h - 4}a4 4 0 0 1 -4 4H${x0}Z`;
    rows.forEach(([k, name], i) => {
      const y0 = top + band * i + (band - (2 * bh + gap)) / 2;
      el('text', { class: 'c-row', x: 0, y: y0 + bh + 5 }, agree).textContent = name;
      [['lidar', 'var(--ink)', 'LiDAR scan matching'], ['odom', 'var(--est2)', 'wheel odometry']].forEach(([s, col, label], j) => {
        const a = D.metrics[s][k].avg, v = pct(a.u[0], a.t[0]), y = y0 + j * (bh + gap);
        const p = el('path', { d: bar(L, y, Math.max(6, x(v) - L), bh), style: `fill:${col}` }, agree);
        el('text', { class: 'c-pct', x: x(v) + 6, y: y + bh - 3 }, agree).textContent = v.toFixed(1) + ' %';
        const sc = k === 'head' ? 1 : 100, un = k === 'head' ? 'rad' : 'cm', dp = k === 'head' ? 3 : 2;
        hoverable(p, () => `<b>${name} · ${label}</b><br>−${v.toFixed(1)} % (${(a.u[0] * sc).toFixed(dp)} → ${(a.t[0] * sc).toFixed(dp)} ${un})`);
      });
    });
  }
  if (agree) agreeBuild();
})();
