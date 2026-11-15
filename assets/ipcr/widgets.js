// IPCR project page: interactive geometry (target and execution level) and result charts, plain SVG.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = { np: '#d55e00', ipcr: '#0072b2', yaw: '#009e73', ref: '#8a8a8a', ink: '#222', grid: '#e6e6e6', mute: '#6b6b6b', surf: '#2b2b2b', bel: '#9a9a9a' };
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  };
  const txt = (parent, x, y, s, attrs = {}) => { const t = el('text', Object.assign({ x, y }, attrs), parent); t.textContent = s; return t; };
  const deg = Math.PI / 180;

  function arrowDefs(svg) {
    const defs = el('defs', {}, svg);
    for (const [k, c] of Object.entries(C)) {
      const m = el('marker', { id: 'ah-' + k, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: c }, m);
    }
  }

  // world (frontal u, depth w) in mm -> svg. Depth axis points up (into the board, away from the robot).
  function frame(svg, W, H, scale, ox, oy) { return (u, w) => [ox + u * scale, oy - w * scale]; }

  function hatch(g, P, a, b, n, side) {      // ground hatching along a surface segment
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * side, ny = dx / L * side;
    for (let k = 0; k <= n; k++) {
      const x = a[0] + dx * k / n, y = a[1] + dy * k / n;
      el('line', { x1: x, y1: y, x2: x + nx * 7 + dx / L * 5, y2: y + ny * 7 + dy / L * 5, stroke: '#bbb', 'stroke-width': 1 }, g);
    }
  }

  // ---------- target level: NP vs IPCR target for a reference e mm inside a board tilted by theta ----------
  function targetWidget(root) {
    const svg = root.querySelector('svg'), sT = root.querySelector('input[name=theta]'), sE = root.querySelector('input[name=depth]');
    const out = root.querySelector('.ipcr-w-out');
    const W = 420, H = 300; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); arrowDefs(svg);
    const g = el('g', {}, svg);
    function draw() {
      const th = +sT.value * deg, e = +sE.value; g.innerHTML = '';
      root.querySelector('.v-theta').textContent = (+sT.value).toFixed(1) + '°';
      root.querySelector('.v-depth').textContent = e.toFixed(0) + ' mm';
      const P = frame(svg, W, H, 2.4, W / 2 + 20, 140);
      const n = [-Math.sin(th), Math.cos(th)], t = [Math.cos(th), Math.sin(th)];
      // surface through the origin, normal n (u, w); reference e below it along the normal, at u = 0
      const r = [0, -e / Math.cos(th)];
      const a = P(-t[0] * 75, -t[1] * 75), b = P(t[0] * 75, t[1] * 75);
      hatch(g, P, a, b, 22, -1);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.surf, 'stroke-width': 3 }, g);
      txt(g, b[0] - 4, b[1] - 10, 'board (unknown tilt)', { 'text-anchor': 'end', class: 'w-lab' });
      // preserved coordinate: frontal position u; the task yields only along depth d
      const top = P(0, 52), bot = P(0, -66);
      el('line', { x1: top[0], y1: top[1], x2: bot[0], y2: bot[1], stroke: C.ipcr, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }, g);
      const xd = [0, 0], xe = [r[0] + n[0] * e, r[1] + n[1] * e];
      const R = P(...r), D = P(...xd), E = P(...xe);
      el('line', { x1: R[0], y1: R[1], x2: D[0], y2: D[1] + 6, stroke: C.ipcr, 'stroke-width': 2.4, 'marker-end': 'url(#ah-ipcr)' }, g);
      el('line', { x1: R[0], y1: R[1], x2: E[0] + (R[0] - E[0]) * 0.08, y2: E[1] + (R[1] - E[1]) * 0.08, stroke: C.np, 'stroke-width': 2.4, 'stroke-dasharray': '6 4', 'marker-end': 'url(#ah-np)' }, g);
      el('circle', { cx: R[0], cy: R[1], r: 5.5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, g);
      txt(g, R[0] + 9, R[1] + 5, 'reference r (infeasible)', { class: 'w-lab' });
      el('circle', { cx: D[0], cy: D[1], r: 6, fill: C.ipcr }, g);
      txt(g, D[0] + 10, D[1] + 18, 'IPCR', { class: 'w-lab', fill: C.ipcr, 'font-weight': 700 });
      el('rect', { x: E[0] - 5.5, y: E[1] - 5.5, width: 11, height: 11, fill: C.np }, g);
      txt(g, E[0] - 10, E[1] - 10, 'nearest point', { class: 'w-lab', fill: C.np, 'font-weight': 700, 'text-anchor': 'end' });
      // drift in the preserved coordinate
      const drift = e * Math.sin(th), yb = H - 26, A = P(0, 0)[0], B = P(xe[0], 0)[0];
      if (drift > 0.3) {
        el('line', { x1: B, y1: yb, x2: A, y2: yb, stroke: C.np, 'stroke-width': 2, 'marker-start': 'url(#ah-np)', 'marker-end': 'url(#ah-np)' }, g);
        el('line', { x1: B, y1: E[1], x2: B, y2: yb, stroke: C.np, 'stroke-width': 1, 'stroke-dasharray': '2 3' }, g);
      }
      txt(g, 10, H - 8, 'frontal position (the coordinate the task keeps) →', { class: 'w-axis' });
      txt(g, 10, 16, '↑ depth (the direction the task may yield)', { class: 'w-axis' });
      out.innerHTML = `Nearest point moves the figure by <b style="color:${C.np}">${drift.toFixed(1)} mm</b> (= e·sin θ). ` +
        `IPCR moves it by <b style="color:${C.ipcr}">0 mm</b>, because it corrects only in depth.`;
    }
    sT.addEventListener('input', draw); sE.addEventListener('input', draw); draw();
  }

  // ---------- execution level: a believed plane off by rho; the servo absorbs along N = mix of d and n ----------
  function execWidget(root) {
    const svg = root.querySelector('svg'), sA = root.querySelector('input[name=alpha]'), sR = root.querySelector('input[name=rho]');
    const out = root.querySelector('.ipcr-w-out');
    const W = 420, H = 300; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); arrowDefs(svg);
    const g = el('g', {}, svg), th = 23.2 * deg;
    function draw() {
      const al = +sA.value, rho = +sR.value; g.innerHTML = '';
      root.querySelector('.v-alpha').textContent = al.toFixed(2);
      root.querySelector('.v-rho').textContent = rho.toFixed(0) + ' mm';
      const P = frame(svg, W, H, 3.0, W / 2 - 10, 150);
      const n = [-Math.sin(th), Math.cos(th)], t = [Math.cos(th), Math.sin(th)], d = [0, 1];
      let N = [(1 - al) * d[0] + al * n[0], (1 - al) * d[1] + al * n[1]]; const L = Math.hypot(...N); N = [N[0] / L, N[1] / L];
      // believed plane through the origin (the target sits on it), true surface rho further along n
      const xD = [0, 0], s = rho / (n[0] * N[0] + n[1] * N[1]), xe = [N[0] * s, N[1] * s];
      const seg = (off, len) => [P(off[0] - t[0] * len, off[1] - t[1] * len), P(off[0] + t[0] * len, off[1] + t[1] * len)];
      const [b1, b2] = seg([0, 0], 60);
      el('line', { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], stroke: C.bel, 'stroke-width': 1.6, 'stroke-dasharray': '7 5' }, g);
      txt(g, b1[0] + 2, b1[1] - 8, 'believed plane', { class: 'w-lab', fill: C.mute });
      const [s1, s2] = seg([n[0] * rho, n[1] * rho], 60);
      hatch(g, P, s1, s2, 20, -1);
      el('line', { x1: s1[0], y1: s1[1], x2: s2[0], y2: s2[1], stroke: C.surf, 'stroke-width': 3 }, g);
      txt(g, s2[0] - 4, s2[1] - 10, 'true surface', { 'text-anchor': 'end', class: 'w-lab' });
      const D = P(...xD), E = P(...xe), col = al < 0.02 ? C.ipcr : C.np;
      const top = P(0, 45), bot = P(0, -40);
      el('line', { x1: top[0], y1: top[1], x2: bot[0], y2: bot[1], stroke: C.ipcr, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }, g);
      el('line', { x1: D[0], y1: D[1], x2: E[0] - (E[0] - D[0]) * 0.1, y2: E[1] - (E[1] - D[1]) * 0.1, stroke: col, 'stroke-width': 2.4, 'marker-end': `url(#ah-${al < 0.02 ? 'ipcr' : 'np'})` }, g);
      el('circle', { cx: D[0], cy: D[1], r: 5.5, fill: '#fff', stroke: C.ipcr, 'stroke-width': 2 }, g);
      txt(g, D[0] + 9, D[1] + 16, 'target x_D', { class: 'w-lab', fill: C.ipcr });
      el('circle', { cx: E[0], cy: E[1], r: 6, fill: col }, g);
      txt(g, E[0] + 9, E[1] - 8, 'executed', { class: 'w-lab', fill: col, 'font-weight': 700 });
      const leak = xe[0], yb = H - 26;
      if (Math.abs(leak) > 0.3) {
        el('line', { x1: D[0], y1: yb, x2: E[0], y2: yb, stroke: C.np, 'stroke-width': 2, 'marker-start': 'url(#ah-np)', 'marker-end': 'url(#ah-np)' }, g);
        el('line', { x1: E[0], y1: E[1], x2: E[0], y2: yb, stroke: C.np, 'stroke-width': 1, 'stroke-dasharray': '2 3' }, g);
      }
      txt(g, 10, H - 8, 'frontal position →', { class: 'w-axis' });
      txt(g, 10, 16, 'board tilted 23.2°', { class: 'w-axis' });
      const name = al < 0.02 ? 'along the yield direction d (IPCR)' : al > 0.98 ? 'along the normal' : 'mixed';
      out.innerHTML = `Absorbing ${name}: the figure moves by <b style="color:${col}">${Math.abs(leak).toFixed(2)} mm</b> ` +
        `(= ‖G(N̂)ρ‖). Only absorption inside the yield direction is immune to every residual.`;
    }
    sA.addEventListener('input', draw); sR.addEventListener('input', draw); draw();
  }

  // ---------- charts ----------
  function logDots(root, rows, opt) {
    const W = 640, rowH = opt.rowH || 50, top = 34, H = top + rows.length * rowH + 30, left = opt.left || 150, right = W - 24;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': opt.aria }, root);
    const lo = Math.log10(opt.min), hi = Math.log10(opt.max), X = v => left + (Math.log10(v) - lo) / (hi - lo) * (right - left);
    for (const v of opt.ticks) {
      el('line', { x1: X(v), y1: top - 8, x2: X(v), y2: H - 26, stroke: C.grid }, svg);
      txt(svg, X(v), H - 10, v + (opt.unit || ''), { 'text-anchor': 'middle', class: 'c-tick' });
    }
    rows.forEach((r, k) => {
      const y = top + k * rowH + rowH / 2;
      txt(svg, left - 12, y + 1, r.label, { 'text-anchor': 'end', class: 'c-row' });
      if (r.sub) txt(svg, left - 12, y + 15, r.sub, { 'text-anchor': 'end', class: 'c-sub' });
      const vals = r.vals.map(v => v.v);
      el('line', { x1: X(Math.min(...vals)), y1: y - 3, x2: X(Math.max(...vals)), y2: y - 3, stroke: '#cfcfcf', 'stroke-width': 2 }, svg);
      r.vals.forEach((v, j) => {
        const x = X(v.v), close = r.vals.length > 1 && Math.abs(X(r.vals[0].v) - X(r.vals[1].v)) < 40;
        el(v.shape === 'sq' ? 'rect' : 'circle', v.shape === 'sq' ? { x: x - 6, y: y - 9, width: 12, height: 12, fill: C[v.c] } : { cx: x, cy: y - 3, r: 6.5, fill: C[v.c] }, svg);
        const ly = close && j === 1 ? y + 19 : y - 15;
        txt(svg, x, ly, v.v.toFixed(v.v < 10 ? 2 : 1), { 'text-anchor': 'middle', class: 'c-val', fill: C[v.c] });
      });
    });
    txt(svg, left, 14, opt.title, { class: 'c-title' });
  }

  function barsVsPred(root) {
    const data = [{ b: '8.5°', m: 1.0, p: 2.9 }, { b: '20°', m: 6.7, p: 6.4 }, { b: '30°', m: 9.3, p: 8.7 }];
    const W = 420, H = 250, l = 44, r = W - 16, top = 28, bot = H - 40, max = 10;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Extra progress error of the nearest point vs prediction' }, root);
    const Y = v => bot - v / max * (bot - top);
    for (const v of [0, 2, 4, 6, 8, 10]) {
      el('line', { x1: l, y1: Y(v), x2: r, y2: Y(v), stroke: C.grid }, svg);
      txt(svg, l - 8, Y(v) + 4, v, { 'text-anchor': 'end', class: 'c-tick' });
    }
    const bw = 56, step = (r - l) / data.length;
    data.forEach((d, k) => {
      const cx = l + step * (k + 0.5);
      el('rect', { x: cx - bw / 2, y: Y(d.m), width: bw, height: bot - Y(d.m), fill: C.np, rx: 3 }, svg);
      txt(svg, cx, Y(d.m) - 6, d.m.toFixed(1), { 'text-anchor': 'middle', class: 'c-val', fill: C.np });
      el('line', { x1: cx - bw / 2 - 8, y1: Y(d.p), x2: cx + bw / 2 + 8, y2: Y(d.p), stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '5 3' }, svg);
      txt(svg, cx, bot + 18, d.b, { 'text-anchor': 'middle', class: 'c-row' });
    });
    txt(svg, l, 14, 'Nearest point: extra progress error (mm)', { class: 'c-title' });
    txt(svg, r, H - 4, 'dashed: 20·sinθ·cosθ, predicted before the runs', { 'text-anchor': 'end', class: 'c-sub' });
  }

  document.querySelectorAll('[data-ipcr-widget=target]').forEach(targetWidget);
  document.querySelectorAll('[data-ipcr-widget=exec]').forEach(execWidget);
  const silent = document.querySelector('#ipcr-chart-silent');
  if (silent) logDots(silent, [
    { label: '8.5°', sub: 'coverage .98 / .99', vals: [{ v: 0.48, c: 'ipcr' }, { v: 10.6, c: 'np', shape: 'sq' }] },
    { label: '15.0°', sub: 'coverage 1.0 / 1.0', vals: [{ v: 0.52, c: 'ipcr' }, { v: 14.5, c: 'np', shape: 'sq' }] },
    { label: '15.6°', sub: 'coverage 1.0 / 1.0', vals: [{ v: 0.38, c: 'ipcr' }, { v: 13.7, c: 'np', shape: 'sq' }] },
    { label: '18.8°', sub: 'coverage 1.0 / .99', vals: [{ v: 0.52, c: 'ipcr' }, { v: 18.1, c: 'np', shape: 'sq' }] },
  ], { min: 0.2, max: 40, ticks: [0.2, 0.5, 1, 2, 5, 10, 20, 40], unit: '', left: 120, title: 'Shift of the drawn figure (mm, log scale), 5 mm/s, 3 runs per cell', aria: 'Shift per board' });
  const cmp = document.querySelector('#ipcr-chart-compare');
  if (cmp) logDots(cmp, [
    { label: 'Nearest point', sub: 'true normal', vals: [{ v: 10.2, c: 'np', shape: 'sq' }, { v: 12.4, c: 'np', shape: 'sq' }] },
    { label: 'Motion-stiff', sub: 'true normal + ideal F/T', vals: [{ v: 8.3, c: 'yaw', shape: 'sq' }, { v: 10.4, c: 'yaw', shape: 'sq' }] },
    { label: 'IPCR', sub: 'joint sensing only', vals: [{ v: 0.47, c: 'ipcr' }, { v: 0.82, c: 'ipcr' }] },
  ], { min: 0.2, max: 40, ticks: [0.2, 0.5, 1, 2, 5, 10, 20, 40], left: 150, rowH: 50, title: 'Shift (mm, log scale) at 10 mm/s on the 8.5° and 15.6° boards', aria: 'Comparison with literature structures' });
  const tr = document.querySelector('#ipcr-chart-transport');
  if (tr) barsVsPred(tr);
})();
