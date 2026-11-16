import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const container = document.getElementById('lab-canvas-container');
const panel = document.getElementById('lab-panel');
const panelCategory = document.getElementById('lab-panel-category');
const panelTitle = document.getElementById('lab-panel-title');
const panelSummary = document.getElementById('lab-panel-summary');
const panelLink = document.getElementById('lab-panel-link');
const panelClose = document.getElementById('lab-panel-close');
const hint = document.getElementById('lab-hint');
const fallback = document.getElementById('lab-fallback');
const masthead = document.querySelector('.masthead');

const PROJECTS = window.LAB_PROJECTS || {};

function sizeContainer() {
  const headerH = masthead ? masthead.offsetHeight : 0;
  const h = Math.max(window.innerHeight - headerH, 460);
  container.style.height = h + 'px';
}
sizeContainer();

function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function makePlankTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9c9a6';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(120,95,60,0.25)';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  return tex;
}

function makeLabelSprite(text) {
  const c = document.createElement('canvas');
  const pad = 16;
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.font = '600 44px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + pad * 2;
  ctx.fillStyle = 'rgba(30,30,30,0.82)';
  roundRect(ctx, 256 - w / 2, 34, w, 60, 16);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function std(color, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.65, metalness: 0.15 }, extra || {}));
}

function enableShadows(root) {
  root.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
}

// ---------- Avatar ----------
function createAvatar() {
  const group = new THREE.Group();

  const skin = std(0xe8b48c, { roughness: 0.8, metalness: 0 });
  const hairMat = std(0x1b1a1f, { roughness: 0.6, metalness: 0 });
  const shirtMat = std(0x2b2f36, { roughness: 0.75, metalness: 0 });
  const pantsMat = std(0x33425a, { roughness: 0.8, metalness: 0 });
  const shoeMat = std(0x161616, { roughness: 0.7, metalness: 0 });

  const hips = new THREE.Group();
  hips.position.y = 0.78;
  group.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 3, 8), shirtMat);
  torso.position.y = 0.33;
  hips.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skin);
  head.position.y = 0.78;
  hips.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hair.position.y = 0.80;
  hips.add(hair);

  function makeArm() {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 2, 6), shirtMat);
    upper.position.y = -0.16;
    pivot.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin);
    hand.position.y = -0.32;
    pivot.add(hand);
    return pivot;
  }
  const armL = makeArm(); armL.position.set(-0.28, 0.5, 0); hips.add(armL);
  const armR = makeArm(); armR.position.set(0.28, 0.5, 0); hips.add(armR);

  function makeLeg() {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.3, 2, 6), pantsMat);
    upper.position.y = -0.18;
    pivot.add(upper);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), shoeMat);
    shoe.position.set(0, -0.37, 0.04);
    pivot.add(shoe);
    return pivot;
  }
  const legL = makeLeg(); legL.position.set(-0.11, 0.08, 0); hips.add(legL);
  const legR = makeLeg(); legR.position.set(0.11, 0.08, 0); hips.add(legR);

  enableShadows(group);

  let phase = 0;
  function update(dt, moving) {
    if (moving) {
      phase += dt * 7;
      const swing = Math.sin(phase) * 0.55;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armR.rotation.x = swing * 0.8;
      hips.position.y = 0.78 + Math.abs(Math.sin(phase * 2)) * 0.02;
    } else {
      phase = lerpAngle(phase % (Math.PI * 2), 0, 0.1);
      legL.rotation.x = THREE.MathUtils.lerp(legL.rotation.x, 0, 0.15);
      legR.rotation.x = THREE.MathUtils.lerp(legR.rotation.x, 0, 0.15);
      armL.rotation.x = THREE.MathUtils.lerp(armL.rotation.x, 0, 0.15);
      armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, 0, 0.15);
      hips.position.y = 0.78 + Math.sin(performance.now() * 0.002) * 0.006;
    }
  }

  return { group, update };
}

// ---------- Exhibit builders ----------
function addEyeDots(parent, mat, z) {
  const geo = new THREE.SphereGeometry(0.025, 6, 6);
  [-0.07, 0.07].forEach((x) => {
    const e = new THREE.Mesh(geo, mat);
    e.position.set(x, 0, z);
    parent.add(e);
  });
}

function buildHumanoid() {
  const g = new THREE.Group();
  const body = std(0xe6e9ee, { metalness: 0.5, roughness: 0.4 });
  const accent = std(0x3a7bd5, { metalness: 0.4, roughness: 0.4 });
  const dark = std(0x23262b, { metalness: 0.3, roughness: 0.6 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 3, 8), body);
  torso.position.y = 0.95; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), body);
  head.position.y = 1.42; g.add(head);
  addEyeDots(head, dark, 0.17);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 12), accent);
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.68; g.add(belt);

  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 2, 6), dark);
    leg.position.set(s * 0.13, 0.25, 0); g.add(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 2, 6), accent);
    arm.position.set(s * 0.33, 0.95, 0);
    arm.rotation.z = s * 0.35;
    g.add(arm);
  });
  return g;
}

function buildManipulatorArm() {
  const g = new THREE.Group();
  const base = std(0x3a3f47, { metalness: 0.5 });
  const arm = std(0xe0a020, { metalness: 0.4 });
  const board = std(0x8899aa, { metalness: 0.1, roughness: 0.9 });

  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.16, 12), base);
  baseMesh.position.y = 0.08; g.add(baseMesh);

  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 10), arm);
  col.position.y = 0.42; g.add(col);

  const link1 = new THREE.Group();
  link1.position.y = 0.67;
  const l1mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 2, 8), arm);
  l1mesh.rotation.z = Math.PI / 2.4;
  l1mesh.position.set(0.18, 0.1, 0);
  link1.add(l1mesh);
  g.add(link1);

  const link2 = new THREE.Group();
  link2.position.set(0.42, 0.42, 0);
  link2.rotation.z = -0.9;
  const l2mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.32, 2, 8), arm);
  l2mesh.position.set(0.13, 0, 0);
  l2mesh.rotation.z = Math.PI / 2;
  link2.add(l2mesh);
  g.add(link2);

  const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.16), base);
  gripper.position.set(0.56, 0.2, 0);
  g.add(gripper);

  const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), board);
  boardMesh.position.set(0.55, 0.1, 0);
  boardMesh.rotation.z = 0.12;
  g.add(boardMesh);

  return g;
}

function buildWheel(mat) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), mat);
  w.rotation.z = Math.PI / 2;
  return w;
}

function buildMobileRobot() {
  const g = new THREE.Group();
  const body = std(0xf0f0f0, { metalness: 0.2 });
  const dark = std(0x2a2a2a, { metalness: 0.3 });
  const lidarMat = std(0x4caf7d, { metalness: 0.5, roughness: 0.3 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.4), body);
  base.position.y = 0.2; g.add(base);

  [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]].forEach(([x, z]) => {
    const w = buildWheel(dark);
    w.position.set(x, 0.1, z);
    g.add(w);
  });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), dark);
  post.position.y = 0.44; g.add(post);

  const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.09, 14), lidarMat);
  lidar.position.y = 0.6; g.add(lidar);
  g.userData.spin = lidar;

  return g;
}

function buildMobileManipulator() {
  const g = buildMobileRobot();
  g.userData.spin = null;
  const arm = std(0xe0a020, { metalness: 0.4 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 10), arm);
  col.position.y = 0.5; g.add(col);
  const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 2, 8), arm);
  seg.position.set(0.16, 0.66, 0);
  seg.rotation.z = Math.PI / 2.3;
  g.add(seg);
  return g;
}

function buildLeg(mat, x, z) {
  const leg = new THREE.Group();
  leg.position.set(x, 0.3, z);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.2, 2, 6), mat);
  upper.position.y = -0.05;
  upper.rotation.x = 0.25;
  leg.add(upper);
  const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 2, 6), mat);
  lower.position.set(0, -0.23, 0.05);
  lower.rotation.x = -0.5;
  leg.add(lower);
  return leg;
}

function buildQuadrupedChunky() {
  const g = new THREE.Group();
  const body = std(0xd9541f, { metalness: 0.3, roughness: 0.6 });
  const dark = std(0x24262b, { metalness: 0.4 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.28), body);
  torso.position.y = 0.42; g.add(torso);
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), dark);
  cam.position.set(0.28, 0.44, 0); g.add(cam);

  [[-0.18, -0.12], [0.18, -0.12], [-0.18, 0.12], [0.18, 0.12]].forEach(([x, z]) => {
    g.add(buildLeg(dark, x, z));
  });
  return g;
}

function buildQuadrupedSleek() {
  const g = new THREE.Group();
  const body = std(0x1c1c1e, { metalness: 0.5, roughness: 0.4 });
  const accent = std(0xf2c230, { metalness: 0.3 });
  const ball = std(0xd23c3c, { roughness: 0.6 });
  const tag = std(0xffffff, { roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 2, 8), body);
  torso.rotation.z = Math.PI / 2;
  torso.position.y = 0.4; g.add(torso);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.05), accent);
  stripe.position.set(0, 0.46, 0.13); g.add(stripe);

  [[-0.22, -0.13], [0.22, -0.13], [-0.22, 0.13], [0.22, 0.13]].forEach(([x, z]) => {
    g.add(buildLeg(body, x, z));
  });

  const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), ball);
  ballMesh.position.set(0.55, 0.1, 0.3); g.add(ballMesh);

  const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), tag);
  tagMesh.position.set(-0.5, 0.26, -0.35);
  tagMesh.rotation.y = 0.6;
  g.add(tagMesh);

  return g;
}

function buildLadderRig() {
  const g = new THREE.Group();
  const rail = std(0xb08968, { roughness: 0.8 });
  const rung = std(0x8a6a4d, { roughness: 0.8 });
  const bot = std(0x4a6fa5, { metalness: 0.3 });

  [-0.3, 0.3].forEach((z) => {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), rail);
    r.rotation.z = Math.PI / 2;
    r.position.set(0, 0.55, z);
    g.add(r);
  });
  for (let x = -0.4; x <= 0.4; x += 0.2) {
    const ru = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), rung);
    ru.rotation.x = Math.PI / 2;
    ru.position.set(x, 0.55, 0);
    g.add(ru);
  }

  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.12), bot);
  bodyMesh.position.set(0.05, 0.55, 0.05);
  g.add(bodyMesh);
  [-1, 1].forEach((s) => {
    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 2, 6), bot);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0.05 + s * 0.1, 0.6, 0.05);
    g.add(grip);
  });

  return g;
}

function buildParasol() {
  const g = new THREE.Group();
  const leg = std(0x555b63, { metalness: 0.4 });
  const canopy = std(0xf2b03d, { roughness: 0.6 });
  const canopy2 = std(0xe8832c, { roughness: 0.6 });
  const sensor = std(0x2a2a2a, { metalness: 0.4 });

  [0, 2.1, 4.2].forEach((a) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), leg);
    l.position.set(Math.cos(a) * 0.18, 0.27, Math.sin(a) * 0.18);
    l.rotation.z = Math.cos(a) * 0.35;
    l.rotation.x = Math.sin(a) * 0.35;
    g.add(l);
  });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), leg);
  pole.position.y = 0.78; g.add(pole);

  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + Math.PI / 4;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.32), i % 2 ? canopy : canopy2);
    panel.position.set(Math.cos(angle) * 0.2, 1.1, Math.sin(angle) * 0.2);
    panel.rotation.y = angle;
    panel.rotation.x = -0.2;
    g.add(panel);
  }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), sensor);
  cap.position.y = 1.15; g.add(cap);

  return g;
}

// ---------- Room ----------
const EXHIBITS = [
  { key: '/projects/ipcr-manipulation/', label: 'Manipulation', x: -6, z: -4, build: buildManipulatorArm, scale: 1.3 },
  { key: '/projects/humanoid-push-recovery/', label: 'Humanoid', x: -2, z: -4, build: buildHumanoid, scale: 1.1 },
  { key: '/projects/mapless-navigation-sim2real/', label: 'Mobile Nav', x: 2, z: -4, build: buildMobileRobot, scale: 1.5 },
  { key: '/projects/mobile-manipulator-architecture/', label: 'Mobile Manipulator', x: 6, z: -4, build: buildMobileManipulator, scale: 1.5 },
  { key: '/projects/quadruped-latent-motion/', label: 'Quadruped Perception', x: -6, z: 0, build: buildQuadrupedSleek, scale: 1.3 },
  { key: '/projects/ccp-quadruped/', label: 'Quadruped (CCP)', x: -2, z: 0, build: buildQuadrupedChunky, scale: 1.3 },
  { key: '/projects/ladder-crossing/', label: 'Ladder Robot', x: 2, z: 0, build: buildLadderRig, scale: 1.3 },
  { key: '/projects/solar-parasol/', label: 'Solar Parasol', x: 6, z: 0, build: buildParasol, scale: 1.3 }
];

function init() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4efe4);
  scene.fog = new THREE.Fog(0xf4efe4, 14, 30);

  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
  const camTarget = new THREE.Vector3(0, 0.6, -1.5);
  camera.position.set(0, 9.5, 12.5);
  camera.lookAt(camTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcbbfa3, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff4e0, 1.1);
  dir.position.set(6, 10, 6);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -11;
  dir.shadow.camera.right = 11;
  dir.shadow.camera.top = 9;
  dir.shadow.camera.bottom = -9;
  scene.add(dir);

  // Floor
  const floorMat = new THREE.MeshStandardMaterial({ map: makePlankTexture(), roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Zone rugs
  const researchRug = new THREE.Mesh(
    new THREE.PlaneGeometry(17, 3.4),
    new THREE.MeshStandardMaterial({ color: 0xcfe0e8, roughness: 1 })
  );
  researchRug.rotation.x = -Math.PI / 2;
  researchRug.position.set(0, 0.01, -4);
  researchRug.receiveShadow = true;
  scene.add(researchRug);

  const workshopRug = new THREE.Mesh(
    new THREE.PlaneGeometry(17, 3.4),
    new THREE.MeshStandardMaterial({ color: 0xf0ddc2, roughness: 1 })
  );
  workshopRug.rotation.x = -Math.PI / 2;
  workshopRug.position.set(0, 0.01, 0);
  workshopRug.receiveShadow = true;
  scene.add(workshopRug);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 1 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 4.5), wallMat);
  backWall.position.set(0, 2.25, -6.95);
  backWall.receiveShadow = true;
  scene.add(backWall);
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), wallMat);
  sideWall.position.set(-9.95, 2.25, 0);
  sideWall.rotation.y = Math.PI / 2;
  sideWall.receiveShadow = true;
  scene.add(sideWall);

  scene.add(makeLabelSprite('Research').translateX(-7).translateY(2.8).translateZ(-6.6));
  scene.add(makeLabelSprite('Coursework').translateX(-7).translateY(2.8).translateZ(0.4));

  // Exhibits
  const exhibitMeshes = [];
  EXHIBITS.forEach((ex) => {
    const g = ex.build();
    g.scale.setScalar(ex.scale || 1);
    g.position.set(ex.x, 0, ex.z);
    enableShadows(g);
    scene.add(g);
    const label = makeLabelSprite(ex.label);
    label.position.set(ex.x, 1.9, ex.z);
    scene.add(label);
    g.userData.exKey = ex.key;
    g.userData.exX = ex.x;
    g.userData.exZ = ex.z;
    exhibitMeshes.push(g);
  });

  // Avatar
  const avatar = createAvatar();
  avatar.group.position.set(0, 0, 4.5);
  scene.add(avatar.group);

  let target = null;
  let arrivedKey = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointer(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    const cx = ev.clientX !== undefined ? ev.clientX : (ev.changedTouches && ev.changedTouches[0].clientX);
    const cy = ev.clientY !== undefined ? ev.clientY : (ev.changedTouches && ev.changedTouches[0].clientY);
    pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(exhibitMeshes, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData.exKey) obj = obj.parent;
      if (obj) {
        target = new THREE.Vector3(obj.userData.exX, 0, obj.userData.exZ + 1.4);
        target.exKey = obj.userData.exKey;
        target.lookX = obj.userData.exX;
        target.lookZ = obj.userData.exZ;
        arrivedKey = null;
        hidePanel();
        if (hint) hint.classList.add('lab-hint--hidden');
      }
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointer);

  function showPanel(key) {
    const data = PROJECTS[key];
    if (!data || !panel) return;
    panelCategory.textContent = data.category || '';
    panelTitle.textContent = data.title || '';
    panelSummary.textContent = data.summary || '';
    panelLink.href = data.url;
    panel.classList.add('lab-panel--open');
  }
  function hidePanel() {
    if (panel) panel.classList.remove('lab-panel--open');
  }
  if (panelClose) panelClose.addEventListener('click', hidePanel);

  const clock = new THREE.Clock();
  const SPEED = 3.2;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    exhibitMeshes.forEach((g) => {
      if (g.userData.spin) g.userData.spin.rotation.y += dt * 2;
    });

    let moving = false;
    if (target) {
      const pos = avatar.group.position;
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.08) {
        moving = true;
        const step = Math.min(SPEED * dt, dist);
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;
        const angle = Math.atan2(dx, dz);
        avatar.group.rotation.y = lerpAngle(avatar.group.rotation.y, angle, 0.2);
      } else {
        const lookAngle = Math.atan2(target.lookX - pos.x, target.lookZ - pos.z);
        avatar.group.rotation.y = lerpAngle(avatar.group.rotation.y, lookAngle, 0.25);
        if (arrivedKey !== target.exKey) {
          arrivedKey = target.exKey;
          showPanel(target.exKey);
        }
        target = null;
      }
    }
    avatar.update(dt, moving);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, avatar.group.position.x * 0.4, 0.04);
    camTarget.x = THREE.MathUtils.lerp(camTarget.x, avatar.group.position.x * 0.4, 0.04);
    camera.lookAt(camTarget);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    sizeContainer();
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

try {
  if (!window.WebGLRenderingContext) throw new Error('no webgl');
  init();
} catch (e) {
  if (container) container.style.display = 'none';
  if (hint) hint.style.display = 'none';
  if (fallback) fallback.style.display = 'block';
  console.error('Lab scene failed to initialize:', e);
}
