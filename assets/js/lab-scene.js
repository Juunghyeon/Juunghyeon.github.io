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

function makeFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9cdd1';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 5);
  return tex;
}

function makeHazardTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#f2c230';
  for (let x = -32; x < 128; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 32); ctx.lineTo(x + 16, 32); ctx.lineTo(x + 32, 0); ctx.lineTo(x + 16, 0);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(8, 1);
  return tex;
}

function makeTagTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#111';
  ctx.fillRect(4, 4, 56, 56);
  ctx.fillStyle = '#fff';
  ctx.fillRect(12, 12, 40, 40);
  const cells = [[0, 0], [1, 0], [2, 1], [0, 2], [2, 2], [1, 2]];
  ctx.fillStyle = '#111';
  cells.forEach(([cx, cy]) => ctx.fillRect(12 + cx * 13.3, 12 + cy * 13.3, 13.3, 13.3));
  return new THREE.CanvasTexture(c);
}

function makeSolarCellTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#132a4a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(180,200,230,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 128; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
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
  return new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: false, roughness: 0.55, metalness: 0.1 }, extra || {}));
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

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.4, 6, 16), shirtMat);
  torso.position.y = 0.34;
  hips.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 12), skin);
  neck.position.y = 0.65;
  hips.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), skin);
  head.position.y = 0.78;
  head.scale.set(1, 1.08, 0.94);
  hips.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.178, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
  hair.position.y = 0.805;
  hair.scale.set(1.04, 1.1, 1.0);
  hips.add(hair);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.175, 20, 16, 0, Math.PI * 2, Math.PI * 0.34, Math.PI * 0.2), hairMat);
  fringe.position.set(0, 0.8, 0.02);
  hips.add(fringe);

  function makeArm() {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.24, 4, 12), shirtMat);
    upper.position.y = -0.15;
    pivot.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), skin);
    hand.position.y = -0.31;
    pivot.add(hand);
    return pivot;
  }
  const armL = makeArm(); armL.position.set(-0.27, 0.5, 0); hips.add(armL);
  const armR = makeArm(); armR.position.set(0.27, 0.5, 0); hips.add(armR);

  function makeLeg() {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 12), pantsMat);
    upper.position.y = -0.17;
    pivot.add(upper);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.21), shoeMat);
    shoe.position.set(0, -0.35, 0.05);
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
function buildHumanoid() {
  const g = new THREE.Group();
  const shell = std(0xd9c3a3, { metalness: 0.15, roughness: 0.55 });
  const dark = std(0x1c1d1f, { metalness: 0.3, roughness: 0.55 });
  const joint = std(0x2a2b2d, { metalness: 0.4, roughness: 0.5 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.3, 6, 16), shell);
  torso.scale.set(1.08, 1, 0.85);
  torso.position.y = 1.08; g.add(torso);

  const hipBlock = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.1, 4, 12), dark);
  hipBlock.position.y = 0.78; g.add(hipBlock);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 12), joint);
  neck.position.y = 1.3; g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), shell);
  head.scale.set(1, 1.1, 1);
  head.position.y = 1.44; g.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.25, Math.PI * 0.45), dark);
  visor.position.set(0, 1.45, 0.08); g.add(visor);

  [-1, 1].forEach((s) => {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), joint);
    shoulder.position.set(s * 0.26, 1.2, 0); g.add(shoulder);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.22, 4, 12), shell);
    upperArm.position.set(s * 0.28, 1.0, 0.01);
    upperArm.rotation.z = s * 0.1;
    g.add(upperArm);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), joint);
    elbow.position.set(s * 0.3, 0.84, 0.02); g.add(elbow);

    const foreArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2, 4, 12), shell);
    foreArm.position.set(s * 0.31, 0.68, 0.04);
    foreArm.rotation.x = -0.15;
    g.add(foreArm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), dark);
    hand.position.set(s * 0.315, 0.55, 0.06); g.add(hand);

    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), joint);
    hip.position.set(s * 0.12, 0.72, 0); g.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.26, 4, 12), shell);
    thigh.position.set(s * 0.12, 0.5, 0); g.add(thigh);

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), joint);
    knee.position.set(s * 0.12, 0.33, 0.01); g.add(knee);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 12), shell);
    shin.position.set(s * 0.12, 0.17, 0); g.add(shin);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.19), dark);
    foot.position.set(s * 0.12, 0.025, 0.03); g.add(foot);
  });
  return g;
}

function buildManipulatorArm() {
  const g = new THREE.Group();
  const base = std(0x383c43, { metalness: 0.6, roughness: 0.4 });
  const arm = std(0xf0f1f3, { metalness: 0.3, roughness: 0.35 });
  const joint = std(0x2a2d32, { metalness: 0.5, roughness: 0.4 });
  const board = std(0x96a0ab, { metalness: 0.1, roughness: 0.85 });

  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.16, 20), base);
  baseMesh.position.y = 0.08; g.add(baseMesh);

  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 16), arm);
  col.position.y = 0.42; g.add(col);
  const joint0 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), joint);
  joint0.position.y = 0.67; g.add(joint0);

  const link1 = new THREE.Group();
  link1.position.y = 0.67;
  const l1mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.4, 4, 14), arm);
  l1mesh.rotation.z = Math.PI / 2.4;
  l1mesh.position.set(0.18, 0.1, 0);
  link1.add(l1mesh);
  g.add(link1);

  const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), joint);
  joint1.position.set(0.42, 0.42, 0); g.add(joint1);

  const link2 = new THREE.Group();
  link2.position.set(0.42, 0.42, 0);
  link2.rotation.z = -0.9;
  const l2mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 14), arm);
  l2mesh.position.set(0.13, 0, 0);
  l2mesh.rotation.z = Math.PI / 2;
  link2.add(l2mesh);
  g.add(link2);

  const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.17), base);
  gripper.position.set(0.56, 0.2, 0);
  g.add(gripper);
  [-1, 1].forEach((s) => {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.06), joint);
    finger.position.set(0.56, 0.14, s * 0.07);
    g.add(finger);
  });

  const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), board);
  boardMesh.position.set(0.55, 0.1, 0);
  boardMesh.rotation.z = 0.12;
  g.add(boardMesh);

  return g;
}

function buildBigWheel(dark, boltMat) {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 24), dark);
  tire.rotation.z = Math.PI / 2;
  wheel.add(tire);
  for (let i = 0; i < 6; i++) {
    const a = ((Math.PI * 2) / 6) * i;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.076, 8), boltMat);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(0, Math.sin(a) * 0.09, Math.cos(a) * 0.09);
    wheel.add(bolt);
  }
  return wheel;
}

function buildMobileRobot() {
  const g = new THREE.Group();
  const frame = std(0xc7cbd0, { metalness: 0.55, roughness: 0.35 });
  const edgeMat = std(0x9aa0a6, { metalness: 0.7, roughness: 0.3 });
  const dark = std(0x26272a, { metalness: 0.3, roughness: 0.55 });
  const blueBox = std(0x3a5f8a, { metalness: 0.3, roughness: 0.45 });
  const boltMat = std(0x55585c, { metalness: 0.7, roughness: 0.3 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.46), frame);
  base.position.y = 0.26; g.add(base);
  [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.035), edgeMat);
    post.position.set(x, 0.26, z); g.add(post);
  });

  const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.26), blueBox);
  topBox.position.y = 0.48; g.add(topBox);

  const wheelL = buildBigWheel(dark, boltMat); wheelL.position.set(-0.27, 0.17, 0); g.add(wheelL);
  const wheelR = buildBigWheel(dark, boltMat); wheelR.position.set(0.27, 0.17, 0); g.add(wheelR);

  [[-0.14, -0.19], [0.14, -0.19]].forEach(([x, z]) => {
    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), dark);
    caster.position.set(x, 0.05, z); g.add(caster);
  });

  g.userData.spinParts = [
    { obj: wheelL, axis: 'x', speed: 2.4 },
    { obj: wheelR, axis: 'x', speed: 2.4 }
  ];
  return g;
}

function buildMobileManipulator() {
  const g = buildMobileRobot();
  const arm = std(0xe0a020, { metalness: 0.35, roughness: 0.4 });
  const joint = std(0x2a2d32, { metalness: 0.5, roughness: 0.4 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 14), arm);
  col.position.y = 0.7; g.add(col);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), joint);
  shoulder.position.y = 0.86; g.add(shoulder);
  const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 4, 12), arm);
  seg.position.set(0.14, 0.9, 0);
  seg.rotation.z = Math.PI / 2.3;
  g.add(seg);
  return g;
}

function buildLeg(mat, x, z) {
  const leg = new THREE.Group();
  leg.position.set(x, 0.3, z);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.2, 4, 12), mat);
  upper.position.y = -0.05;
  upper.rotation.x = 0.25;
  leg.add(upper);
  const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 12), mat);
  lower.position.set(0, -0.23, 0.05);
  lower.rotation.x = -0.5;
  leg.add(lower);
  return leg;
}

function buildMechLeg(metal, dark, x, z) {
  const leg = new THREE.Group();
  leg.position.set(x, 0.34, z);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), dark);
  leg.add(hip);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.035), metal);
  upper.position.y = -0.1;
  upper.rotation.x = 0.3;
  leg.add(upper);
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), dark);
  knee.position.set(0, -0.2, 0.06);
  leg.add(knee);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.14, 0.03), metal);
  lower.position.set(0, -0.27, 0.095);
  lower.rotation.x = -0.55;
  leg.add(lower);
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), dark);
  foot.position.set(0, -0.34, 0.13);
  leg.add(foot);
  return leg;
}

function buildQuadrupedChunky() {
  const g = new THREE.Group();
  const body = std(0x1e1f22, { metalness: 0.3, roughness: 0.5 });
  const metal = std(0x9a9ea3, { metalness: 0.75, roughness: 0.3 });
  const dark = std(0x18191b, { metalness: 0.4, roughness: 0.5 });
  const led = new THREE.MeshStandardMaterial({ color: 0x4caf7d, emissive: 0x2eaf5c, emissiveIntensity: 1.2 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.3), body);
  torso.position.y = 0.46; g.add(torso);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.22), dark);
  vent.position.set(-0.25, 0.46, 0); g.add(vent);
  const ledMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12), led);
  ledMesh.rotation.x = Math.PI / 2;
  ledMesh.position.set(0.1, 0.46, 0.155); g.add(ledMesh);

  [[-0.17, -0.12], [0.17, -0.12], [-0.17, 0.12], [0.17, 0.12]].forEach(([x, z]) => {
    g.add(buildMechLeg(metal, dark, x, z));
  });
  return g;
}

function buildQuadrupedSleek() {
  const g = new THREE.Group();
  const body = std(0x19191b, { metalness: 0.45, roughness: 0.4 });
  const accent = std(0xf2c230, { metalness: 0.3, roughness: 0.4 });
  const ball = std(0xf2b528, { roughness: 0.55 });
  const ballDark = std(0x2a2a2a, { roughness: 0.6 });
  const tagMat = new THREE.MeshStandardMaterial({ map: makeTagTexture(), roughness: 0.9, side: THREE.DoubleSide });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.34, 4, 14), body);
  torso.rotation.z = Math.PI / 2;
  torso.position.y = 0.4; g.add(torso);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.05), accent);
  stripe.position.set(0, 0.45, 0.13); g.add(stripe);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.1), body);
  head.position.set(0.28, 0.42, 0); g.add(head);

  [[-0.21, -0.12], [0.21, -0.12], [-0.21, 0.12], [0.21, 0.12]].forEach(([x, z]) => {
    g.add(buildLeg(body, x, z));
  });

  const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), ball);
  ballMesh.position.set(0.6, 0.1, 0.32); g.add(ballMesh);
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 2 / 4) * i;
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), ballDark);
    patch.position.set(0.6 + Math.cos(a) * 0.095, 0.1 + Math.sin(a) * 0.095, 0.32);
    patch.lookAt(0.6 + Math.cos(a) * 2, 0.1 + Math.sin(a) * 2, 0.32);
    g.add(patch);
  }

  const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), tagMat);
  tagMesh.position.set(-0.55, 0.26, -0.35);
  tagMesh.rotation.y = 0.6;
  g.add(tagMesh);

  return g;
}

function buildLadderRig() {
  const g = new THREE.Group();
  const rail = std(0xc3c7cc, { metalness: 0.6, roughness: 0.35 });
  const rung = std(0xaeb3b8, { metalness: 0.6, roughness: 0.35 });
  const chassis = std(0xf4f3ee, { metalness: 0.05, roughness: 0.8 });
  const servo = std(0x222326, { metalness: 0.2, roughness: 0.55 });
  const pcb = std(0xd9712a, { metalness: 0.2, roughness: 0.5 });
  const gripper = std(0x1f9e86, { metalness: 0.1, roughness: 0.55 });

  [-0.3, 0.3].forEach((z) => {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 14), rail);
    r.rotation.z = Math.PI / 2;
    r.position.set(0, 0.55, z);
    g.add(r);
  });
  for (let x = -0.4; x <= 0.4; x += 0.2) {
    const ru = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.6, 12), rung);
    ru.rotation.x = Math.PI / 2;
    ru.position.set(x, 0.55, 0);
    g.add(ru);
  }

  const sled = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.12), chassis);
  sled.position.set(0.05, 0.47, 0.05);
  g.add(sled);
  [-0.08, 0.08].forEach((x) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.1), servo);
    box.position.set(0.05 + x, 0.53, 0.05);
    g.add(box);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.08), pcb);
  board.position.set(0.05, 0.505, 0.11);
  g.add(board);

  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 10), gripper);
    arm.position.set(0.05 + s * 0.17, 0.62, 0.05);
    g.add(arm);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 14, Math.PI * 1.3), gripper);
    hook.position.set(0.05 + s * 0.17, 0.72, 0.05);
    hook.rotation.y = Math.PI / 2;
    hook.rotation.z = Math.PI * 0.35;
    g.add(hook);
  });

  return g;
}

function buildParasol() {
  const g = new THREE.Group();
  const legMat = std(0xb6bbc0, { metalness: 0.75, roughness: 0.3 });
  const jointMat = std(0x45484d, { metalness: 0.5, roughness: 0.4 });
  const panelFrame = std(0xececeb, { metalness: 0.2, roughness: 0.6 });
  const cellMat = new THREE.MeshStandardMaterial({ map: makeSolarCellTexture(), metalness: 0.3, roughness: 0.45 });
  const boxMat = std(0xf2f2ee, { metalness: 0.05, roughness: 0.7 });
  const wireMat = [std(0x2255cc), std(0xe06a1f), std(0x222222)];

  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 / 3) * i;
    const leg = new THREE.Group();
    leg.rotation.y = a;
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.48, 10), legMat);
    upper.position.set(0.1, 0.64, 0);
    upper.rotation.z = 0.38;
    leg.add(upper);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), jointMat);
    knee.position.set(0.22, 0.42, 0);
    leg.add(knee);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.46, 10), legMat);
    lower.position.set(0.3, 0.2, 0);
    lower.rotation.z = 0.58;
    leg.add(lower);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), jointMat);
    foot.position.set(0.37, 0, 0);
    leg.add(foot);
    g.add(leg);
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.028, 0.74, 12), legMat);
  pole.position.y = 0.78; g.add(pole);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), jointMat);
  head.position.y = 1.2; g.add(head);

  function buildPanel() {
    const panel = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.022), panelFrame);
    frame.position.y = -0.25;
    panel.add(frame);
    const cell = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.42), cellMat);
    cell.position.set(0, -0.25, 0.013);
    panel.add(cell);
    return panel;
  }
  const panelL = buildPanel();
  panelL.position.y = 1.16;
  panelL.rotation.z = 0.3;
  panelL.rotation.y = -0.18;
  g.add(panelL);

  const panelR = buildPanel();
  panelR.position.y = 1.16;
  panelR.rotation.z = -0.3;
  panelR.rotation.y = 0.18;
  g.add(panelR);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.14), boxMat);
  box.position.y = 0.08; g.add(box);
  wireMat.forEach((m, i) => {
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 10, Math.PI), m);
    wire.position.set(-0.04 + i * 0.04, 0.0, 0.08);
    wire.rotation.x = Math.PI / 2;
    g.add(wire);
  });

  return g;
}

// ---------- Lab dressing ----------
function buildCeilingLight() {
  const g = new THREE.Group();
  const housing = std(0xdedede, { metalness: 0.2, roughness: 0.6 });
  const panel = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.9 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.5), housing);
  g.add(frame);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 0.36), panel);
  glow.position.y = -0.05;
  g.add(glow);
  return g;
}

function buildWorkbench() {
  const g = new THREE.Group();
  const topMat = std(0xb9bec4, { metalness: 0.3, roughness: 0.5 });
  const legMat = std(0x454b52, { metalness: 0.5, roughness: 0.4 });
  const screenMat = std(0x1a1d22, { metalness: 0.2, roughness: 0.6 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x8fd3ff, emissive: 0x3a7bd5, emissiveIntensity: 0.6, side: THREE.DoubleSide });

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.7), topMat);
  top.position.y = 0.78;
  g.add(top);
  [[-1.05, -0.28], [1.05, -0.28], [-1.05, 0.28], [1.05, 0.28]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), legMat);
    leg.position.set(x, 0.39, z);
    g.add(leg);
  });
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.03), screenMat);
  monitor.position.set(-0.6, 1.08, -0.15);
  g.add(monitor);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), glowMat);
  screen.position.set(-0.6, 1.08, -0.13);
  g.add(screen);
  const standMon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), legMat);
  standMon.position.set(-0.6, 0.9, -0.15);
  g.add(standMon);

  [[0.3, 0.1], [0.65, -0.05]].forEach(([x, z]) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), legMat);
    box.position.set(x, 0.89, z);
    g.add(box);
  });

  return g;
}

function buildShelfUnit() {
  const g = new THREE.Group();
  const frameMat = std(0x55585e, { metalness: 0.4, roughness: 0.4 });
  const binColors = [0xe0a020, 0x3a7bd5, 0xd23c3c, 0x4caf7d];
  [0, 0.6, 1.2, 1.8].forEach((y, i) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.4), frameMat);
    shelf.position.y = y + 0.3;
    g.add(shelf);
    if (i < 3) {
      for (let b = 0; b < 2; b++) {
        const bin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.32), std(binColors[(i + b) % binColors.length], { roughness: 0.7 }));
        bin.position.set(-0.28 + b * 0.56, y + 0.43, 0);
        g.add(bin);
      }
    }
  });
  [-0.5, 0.5].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.1, 0.05), frameMat);
    post.position.set(x, 1.05, -0.18);
    g.add(post);
  });
  return g;
}

function buildPegboard() {
  const g = new THREE.Group();
  const boardMat = std(0x3b3f45, { roughness: 0.8 });
  const toolMat = std(0xc7cbd1, { metalness: 0.5, roughness: 0.4 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.04), boardMat);
  g.add(board);
  [[-0.5, 0.3], [0, 0.1], [0.5, 0.35], [-0.2, -0.25], [0.3, -0.3]].forEach(([x, y], i) => {
    const tool = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4 + (i % 2) * 0.15, 0.03), toolMat);
    tool.position.set(x, y, 0.05);
    tool.rotation.z = (i % 2 ? 1 : -1) * 0.15;
    g.add(tool);
  });
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

  const UP = new THREE.Vector3(0, 1, 0);
  const CAM_BACK = 3.6;
  const CAM_HEIGHT = 2.0;
  const CAM_LOOK_HEIGHT = 1.05;
  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);

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
  const floorMat = new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.85, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Hazard-stripe zone divider (Research / Coursework)
  const divider = new THREE.Mesh(
    new THREE.PlaneGeometry(17, 0.35),
    new THREE.MeshStandardMaterial({ map: makeHazardTexture(), roughness: 0.8 })
  );
  divider.rotation.x = -Math.PI / 2;
  divider.position.set(0, 0.015, -2);
  scene.add(divider);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe6e9eb, roughness: 0.95 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 4.5), wallMat);
  backWall.position.set(0, 2.25, -6.95);
  backWall.receiveShadow = true;
  scene.add(backWall);
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), wallMat);
  sideWall.position.set(-9.95, 2.25, 0);
  sideWall.rotation.y = Math.PI / 2;
  sideWall.receiveShadow = true;
  scene.add(sideWall);

  const baseboardMat = std(0x2a2d31, { roughness: 0.8 });
  const baseBack = new THREE.Mesh(new THREE.BoxGeometry(20, 0.16, 0.05), baseboardMat);
  baseBack.position.set(0, 0.08, -6.92);
  scene.add(baseBack);
  const baseSide = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 0.05), baseboardMat);
  baseSide.rotation.y = Math.PI / 2;
  baseSide.position.set(-9.92, 0.08, 0);
  scene.add(baseSide);

  // Lab furniture along the side wall
  const pegboard = buildPegboard();
  pegboard.position.set(-9.9, 2.0, -4.5);
  pegboard.rotation.y = Math.PI / 2;
  enableShadows(pegboard);
  scene.add(pegboard);

  const workbench = buildWorkbench();
  workbench.position.set(-9.3, 0, -1.2);
  workbench.rotation.y = Math.PI / 2;
  enableShadows(workbench);
  scene.add(workbench);

  const shelf = buildShelfUnit();
  shelf.position.set(-9.3, 0, 2.6);
  shelf.rotation.y = Math.PI / 2;
  enableShadows(shelf);
  scene.add(shelf);

  [-6, -2, 2, 6].forEach((x) => {
    [-4, 0].forEach((z) => {
      const light = buildCeilingLight();
      light.position.set(x, 4.3, z);
      scene.add(light);
    });
  });

  scene.add(makeLabelSprite('Research Lab').translateX(-7).translateY(2.8).translateZ(-6.6));
  scene.add(makeLabelSprite('Workshop').translateX(-7).translateY(2.8).translateZ(0.4));

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
  avatar.group.rotation.y = Math.PI;
  scene.add(avatar.group);

  const initialOffset = new THREE.Vector3(0, CAM_HEIGHT, -CAM_BACK).applyAxisAngle(UP, avatar.group.rotation.y);
  camera.position.copy(avatar.group.position).add(initialOffset);
  camera.lookAt(avatar.group.position.x, avatar.group.position.y + CAM_LOOK_HEIGHT, avatar.group.position.z);

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
      if (g.userData.spinParts) {
        g.userData.spinParts.forEach((p) => { p.obj.rotation[p.axis] += p.speed * dt; });
      }
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

    const backOffset = new THREE.Vector3(0, CAM_HEIGHT, -CAM_BACK).applyAxisAngle(UP, avatar.group.rotation.y);
    const desiredCamPos = avatar.group.position.clone().add(backOffset);
    camera.position.lerp(desiredCamPos, 0.08);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -8.6, 9.6);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6.5, 7.5);
    camera.lookAt(avatar.group.position.x, avatar.group.position.y + CAM_LOOK_HEIGHT, avatar.group.position.z);

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
