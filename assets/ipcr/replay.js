// IPCR project page: browser replay of logged Gazebo runs (joint angles from the controller log, forward kinematics here).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const ROOT = document.querySelector('[data-ipcr-assets]').dataset.ipcrAssets;
const C = { np: '#d55e00', ipcr: '#0072b2', yaw: '#009e73', ref: '#7a7a7a' };

const MESHES = ['Link0', 'Link1', 'Link2', 'Link3', 'Link4', 'Link5', 'Link6', 'bracket'];
let meshCache = null;
async function loadMeshes() {
  if (meshCache) return meshCache;
  const loader = new GLTFLoader();
  const out = {};
  await Promise.all(MESHES.map(n => new Promise((res, rej) => loader.load(ROOT + 'mesh/' + n + '.glb', g => {
    let geo = null; g.scene.traverse(o => { if (o.isMesh && !geo) geo = o.geometry; });
    geo.computeVertexNormals(); out[n + '.STL'] = geo; res();
  }, undefined, rej))));
  meshCache = out; return out;
}

const mat = {
  clay: new THREE.MeshStandardMaterial({ color: 0xc4c7cd, roughness: 0.55, metalness: 0.05 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.5, metalness: 0.1 }),
  board: new THREE.MeshStandardMaterial({ color: 0xe2d8c6, roughness: 0.9 }),
  table: new THREE.MeshStandardMaterial({ color: 0xf1f1ef, roughness: 1.0 }),
  box: new THREE.MeshStandardMaterial({ color: 0xc9a46c, roughness: 0.8 }),
  pen: new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.4 }),
};

function setT(o, T) { o.position.set(T[0], T[1], T[2]); o.quaternion.set(T[3], T[4], T[5], T[6]); }

// one robot + scene per panel; the kinematic chain is the URDF's (pinocchio export): parent * placement * Rz(q)
function buildScene(model, meshes, opt) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b4ac, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(0.6, -0.8, 1.6); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-1, 0.6, 0.4); scene.add(fill);
  const rots = [scene];
  for (const j of model.joints) {
    const fix = new THREE.Object3D(); setT(fix, j.T);
    const rot = new THREE.Object3D(); fix.add(rot);
    rots[j.parent].add(fix); rots.push(rot);
  }
  let wallT = null, wallSize = null;
  for (const g of model.geoms) {
    let m = null;
    if (g.kind === 'Box') {
      let size = g.size.slice(), T = g.T.slice();
      if (g.name.startsWith('wall') && opt.wallCrop) {   // the drawing board is 1 m wide in the model; show a crop around the figure
        const q = new THREE.Quaternion(T[3], T[4], T[5], T[6]);
        const local = new THREE.Vector3(...opt.wallCrop.c).sub(new THREE.Vector3(T[0], T[1], T[2])).applyQuaternion(q.clone().invert());
        local.y = 0; const w = local.applyQuaternion(q).add(new THREE.Vector3(T[0], T[1], T[2]));
        T = [w.x, w.y, w.z, T[3], T[4], T[5], T[6]]; size = [opt.wallCrop.w, size[1], opt.wallCrop.h];
      }
      if (g.name.startsWith('table')) { size = [0.9, 0.9, 0.05]; }
      const material = g.name.startsWith('wall') ? mat.board : g.name.startsWith('table') ? mat.table : mat.box;
      m = new THREE.Mesh(new THREE.BoxGeometry(...size), material); setT(m, T);
      if (g.name.startsWith('wall')) { wallT = T; wallSize = size; }
    } else if (g.kind === 'Sphere') {
      m = new THREE.Mesh(new THREE.SphereGeometry(g.radius, 16, 12), mat.pen); setT(m, g.T);
    } else if (g.kind === 'Cylinder') {
      const geo = new THREE.CylinderGeometry(g.radius * 1.4, g.radius * 1.4, g.length, 14); geo.rotateX(Math.PI / 2);
      m = new THREE.Mesh(geo, mat.pen); setT(m, g.T);
    } else if (meshes[g.mesh]) {
      const dark = g.mesh === 'Link6.STL' || g.mesh === 'bracket.STL';
      m = new THREE.Mesh(meshes[g.mesh], dark ? mat.dark : mat.clay); setT(m, g.T); m.scale.set(...g.scale);
    }
    if (m) rots[g.joint].add(m);
  }
  return { scene, rots, wallT, wallSize };
}

function segLine(color, width, dashed = false) {
  const material = new LineMaterial({ color, linewidth: width, dashed, dashSize: 0.004, gapSize: 0.003, worldUnits: false });
  return material;
}

// polyline from points, drawn only between consecutive frames that are both "on"; returns {obj, countAt(frame)}
function trail(points, on, material) {
  const pos = [], cum = new Int32Array(points.length);
  let n = 0;
  for (let i = 1; i < points.length; i++) {
    if (on[i] && on[i - 1]) { pos.push(...points[i - 1], ...points[i]); n++; }
    cum[i] = n;
  }
  const geo = new LineSegmentsGeometry(); geo.setPositions(pos.length ? pos : [0, 0, 0, 0, 0, 0]);
  const obj = new LineSegments2(geo, material); obj.computeLineDistances();
  geo.instanceCount = 0;
  return { obj, set(i) { geo.instanceCount = pos.length ? cum[i] : 0; } };
}

function frameAt(t, ts) {           // last frame with time <= t
  let lo = 0, hi = ts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ts[mid] <= t) lo = mid; else hi = mid - 1; }
  return lo;
}

class Replay {
  constructor(el, cfg) {
    this.el = el; this.cfg = cfg; this.speed = cfg.speed; this.playing = true; this.t = cfg.t0; this.visible = false;
    const qt = new URLSearchParams(location.search).get('replay_t'); if (qt) { this.t = +qt; this.playing = false; }
    this.canvas = el.querySelector('canvas.ipcr-gl');
    this.panels = [...el.querySelectorAll('.ipcr-panel')];
    this.slider = el.querySelector('input.ipcr-time');
    this.clock = el.querySelector('.ipcr-clock');
    this.phase = el.querySelector('.ipcr-phase');
    this.btn = el.querySelector('button.ipcr-play');
    el.querySelectorAll('button.ipcr-speed').forEach(b => b.addEventListener('click', () => {
      this.speed = +b.dataset.speed; el.querySelectorAll('button.ipcr-speed').forEach(x => x.classList.toggle('on', x === b));
    }));
    this.btn.addEventListener('click', () => { this.playing = !this.playing; this.btn.textContent = this.playing ? 'Pause' : 'Play'; });
    this.slider.addEventListener('input', () => { this.t = +this.slider.value; this.draw(); });
    el.querySelector('button.ipcr-reset').addEventListener('click', () => { this.controls.reset(); });
  }

  async init() {
    const [model, meshes] = await Promise.all([fetch(ROOT + 'replay/' + this.cfg.data).then(r => r.json()), loadMeshes()]);
    this.model = model;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera = new THREE.PerspectiveCamera(this.cfg.fov, 1, 0.01, 10); this.camera.up.set(0, 0, 1);
    this.camera.position.set(...this.cfg.eye);
    this.controls = new OrbitControls(this.camera, this.el.querySelector('.ipcr-stage'));
    this.controls.target.set(...this.cfg.target); this.controls.enableDamping = true; this.controls.enablePan = false;
    this.controls.minDistance = 0.25; this.controls.maxDistance = 2.5; this.controls.update(); this.controls.saveState();
    this.views = this.panels.map(p => {
      const run = model.runs[p.dataset.run], color = C[p.dataset.color];
      const s = buildScene(model, meshes, this.cfg);
      const v = { p, run, s, mats: [], inset: p.querySelector('canvas.ipcr-inset') };
      if (run.ink) {                                    // pen: ink where the tip touches the board
        const m = segLine(color, 3); v.mats.push(m); v.ink = trail(run.ink, run.c, m); s.scene.add(v.ink.obj);
        const rm = segLine(C.ref, 1.4, true); v.mats.push(rm);       // reference circle carried along the yield direction onto the face
        const ref = refOnFace(this.cfg.refCircle, s.wallT, s.wallSize, model.joints[0].T), on = ref.map(() => 1);
        const r = trail(ref, on, rm); r.set(ref.length - 1); s.scene.add(r.obj);
      } else {                                          // transport: path of the box centre
        const ground = run.p.map(z => [z[0], z[1], 0.0445]);       // box-centre path drawn on the table, under the box
        const m = segLine(color, 3); v.mats.push(m); v.ink = trail(ground, run.p.map(() => 1), m); s.scene.add(v.ink.obj);
      }
      v.readout = p.querySelector('.ipcr-readout');
      return v;
    });
    this.T1 = this.cfg.t1; this.slider.min = this.cfg.t0; this.slider.max = this.T1; this.slider.step = 0.05;
    new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.loop(); }, { threshold: 0.05 }).observe(this.el);
    window.addEventListener('resize', () => this.draw());
    this.last = performance.now(); this.el.classList.add('ready'); this.draw();
  }

  loop() {
    if (this.raf) return;
    const step = now => {
      this.raf = null;
      if (!this.visible) return;
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      if (this.playing) { this.t += dt * this.speed; if (this.t > this.T1) this.t = this.cfg.t0; }
      this.controls.update(); this.draw();
      this.raf = requestAnimationFrame(step);
    };
    this.last = performance.now(); this.raf = requestAnimationFrame(step);
  }

  draw() {
    if (!this.renderer) return;
    const r = this.renderer, cv = this.canvas, W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.floor(W * r.getPixelRatio()) || cv.height !== Math.floor(H * r.getPixelRatio())) r.setSize(W, H, false);
    r.setScissorTest(false); r.clear(); r.setScissorTest(true);
    const cr = cv.getBoundingClientRect();
    this.slider.value = this.t; this.clock.textContent = `t = ${this.t.toFixed(1)} s`;
    this.phase.textContent = this.cfg.phaseName(this.t, this.views[0].run.Eb);
    for (const v of this.views) {
      const run = v.run, i = frameAt(this.t, run.t), q = run.q[i];
      for (let j = 0; j < 6; j++) v.s.rots[j + 1].rotation.z = q[j];
      v.ink.set(i);
      const pr = v.p.querySelector('.ipcr-view').getBoundingClientRect();
      const x = pr.left - cr.left, y = cr.bottom - pr.bottom, w = pr.width, h = pr.height;
      for (const m of v.mats) m.resolution.set(w, h);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      r.setViewport(x, y, w, h); r.setScissor(x, y, w, h); r.render(v.s.scene, this.camera);
      this.cfg.inset(v, i, this);
    }
  }
}

function refOnFace(rc, T, size, base) {
  // reference circle (frontal x,z) moved along the world y axis (the yield direction d) onto the board face facing the robot
  const q = new THREE.Quaternion(T[3], T[4], T[5], T[6]), o = new THREE.Vector3(T[0], T[1], T[2]);
  const n = new THREE.Vector3(0, 1, 0).applyQuaternion(q);        // the face whose normal points toward the robot base
  if (n.dot(new THREE.Vector3(base[0], base[1], base[2]).sub(o)) < 0) n.negate();
  const f0 = o.clone().add(n.clone().multiplyScalar(size[1] / 2 + 0.0009));
  const pts = [];
  for (let k = 0; k <= 120; k++) {
    const a = 2 * Math.PI * k / 120, x = rc.c[0] + rc.r * Math.cos(a), z = rc.c[1] + rc.r * Math.sin(a);
    const y = f0.y - (n.x * (x - f0.x) + n.z * (z - f0.z)) / n.y;
    pts.push([x, y, z]);
  }
  return pts;
}

function hidpi(cv) {
  const r = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * r)) { cv.width = Math.round(w * r); cv.height = Math.round(h * r); }
  const g = cv.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); return [g, w, h];
}

// ---- drawing: frontal-plane inset (the preserved coordinates) ----
const PEN_REF = { c: [-0.21815, 0.4500], r: 0.031831 };
function penInset(v, i) {
  const cv = v.inset; if (!cv) return;
  const [g, w, h] = hidpi(cv); g.clearRect(0, 0, w, h);
  const S = (w - 16) / 0.09, cx = w / 2, cy = h / 2 + 4;
  const X = x => cx + (x - PEN_REF.c[0]) * S, Y = z => cy - (z - PEN_REF.c[1]) * S;
  g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = C.ref; g.setLineDash([4, 3]); g.lineWidth = 1.2;
  g.beginPath(); g.arc(X(PEN_REF.c[0]), Y(PEN_REF.c[1]), PEN_REF.r * S, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
  g.strokeStyle = C[v.p.dataset.color]; g.lineWidth = 1.6; g.beginPath();
  const ink = v.run.ink, c = v.run.c; let pen = false;
  for (let k = 0; k <= i; k++) {
    if (!c[k]) { pen = false; continue; }
    const px = X(ink[k][0]), py = Y(ink[k][2]);
    if (pen) g.lineTo(px, py); else g.moveTo(px, py); pen = true;
  }
  g.stroke();
  g.fillStyle = '#555'; g.font = '11px system-ui, sans-serif'; g.fillText('front view', 6, 13);
}

// ---- transport: top-view inset of the box centre, live sideways yield and yaw ----
function boxInset(v, i) {
  const run = v.run, p = run.p, cv = v.inset;
  const i0 = frameAt(run.Eb[3], run.t), y0 = p[i0][1];
  if (v.readout) v.readout.innerHTML = `sideways <b>${Math.max(0, (y0 - p[i][1]) * 1000).toFixed(1)}</b> mm · yaw <b>${run.yaw[i].toFixed(1)}°</b>`;
  if (!cv) return;
  const [g, w, h] = hidpi(cv); g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(0, 0, w, h);
  const xs = [-0.375, -0.145], S = (w - 16) / (xs[1] - xs[0]), X = x => 8 + (x - xs[0]) * S, Y = y => h / 2 + 6 - (y - y0) * S * 3;
  g.strokeStyle = C.ref; g.setLineDash([4, 3]); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(X(p[i0][0]), Y(y0)); g.lineTo(X(p[i0][0] + 0.2), Y(y0)); g.stroke(); g.setLineDash([]);
  g.strokeStyle = C[v.p.dataset.color]; g.lineWidth = 1.8; g.beginPath();
  for (let k = 0; k <= i; k++) { const px = X(p[k][0]), py = Y(p[k][1]); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
  g.stroke();
  g.fillStyle = '#555'; g.font = '11px system-ui, sans-serif';
  g.fillText('top view (sideways ×3)', 6, 13);
}

const PHASE_PEN = (t, E) => t < E[1] ? 'free move' : t < E[2] ? 'approach' : t < E[3] ? 'touch' : t < E[4] ? 'stroke 1 of 2' : t < E[5] ? 'turn' : t < E[6] ? 'stroke 2 of 2' : 'done';
const PHASE_BOX = (t, E) => t < E[2] ? 'move to start' : t < E[3] ? 'settle' : t < E[4] ? 'carry 200 mm past the board' : t < E[5] ? 'pause' : t < E[6] ? 'carry back' : 'done';

const CONFIGS = {
  pen: { data: 'pen.json', t0: 2, t1: 103, speed: 8, fov: 30, target: [-0.16, 0.64, 0.42], eye: [0.48, -0.08, 0.86],
         wallCrop: { c: [-0.21, 0.78, 0.45], w: 0.30, h: 0.26 }, refCircle: PEN_REF, inset: penInset, phaseName: PHASE_PEN },
  box: { data: 'box.json', t0: 4, t1: 98, speed: 8, fov: 30, target: [-0.20, 0.60, 0.25], eye: [-0.10, 0.30, 1.30],
         inset: boxInset, phaseName: PHASE_BOX },
};

document.querySelectorAll('.ipcr-replay').forEach(el => {
  const r = new Replay(el, CONFIGS[el.dataset.cfg]);
  r.init().catch(e => { el.classList.add('failed'); console.error(e); });
});
