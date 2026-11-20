/* ================= BANANA CITY — core ================= */
const THREE = window.THREE;
/* hex colours are sRGB -> convert to linear so output encoding looks right */
(function () { const sh = THREE.Color.prototype.setHex; THREE.Color.prototype.setHex = function (h) { sh.call(this, h); return this.convertSRGBToLinear(); }; })();
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const fm = n => '$' + Math.round(n).toLocaleString('en-US');
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
function seeded(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const IS_TOUCH = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);

const CELL = 100, NB = 8, EDGE = 400, BLK = 80;
const SKIN = [0xf5d0b5, 0xe0ac82, 0xc68642, 0x8d5524, 0x5c3a21];
const HAIR = [0x1a1410, 0x4a2f1b, 0xc9a24b, 0xb23a2e, 0x888888, 0x2b6cf0];
const SHIRT = [0xffd21f, 0x1e5bd6, 0x111111, 0xe5242b, 0x2fa84f, 0xffffff, 0x8b5cf6, 0xff7a1a];
const PANTS = [0x1b2a4a, 0x111111, 0x6b5b45, 0x3a3f4a, 0x1e5bd6, 0xbbbbbb];
const HATS = ['بدون کلاه', 'کلاه کپ', 'کلاه بافت', 'کلاه لبه‌دار'];
const CAR_COLORS = [0xffd21f, 0x1e5bd6, 0x111111, 0xe5242b, 0xf2f2f2, 0x2fa84f, 0x8b5cf6, 0xff7a1a];

const PRESETS = {
  low:  { name: 'کم',    pr: 0.7, shadow: 0,    traffic: 6,  peds: 6, fogN: 50,  fogF: 280, rain: 250 },
  med:  { name: 'متوسط', pr: 1,   shadow: 1024, traffic: 10, peds: 10, fogN: 80,  fogF: 420, rain: 450 },
  high: { name: 'بالا',  pr: 2,   shadow: 2048, traffic: 16, peds: 18, fogN: 110, fogF: 600, rain: 700 }
};

/* ---------- save state ---------- */
const SAVE_KEY = 'bananacity_save_v1';
function defaultState() {
  return {
    v: 1, name: 'Elvin', money: 1500, bank: 2500, xp: 0, level: 1, health: 100, hunger: 100,
    app: { char: 0, tint: 0 },
    cars: [], houses: [], job: null, salary: 0, time: 8, day: 1, weather: 'clear',
    pos: null, fines: 0, stats: { km: 0, earned: 0, tasks: 0, walk: 0 }, story: 0, daily: null, log: [],
    set: { quality: IS_TOUCH ? 'med' : 'high', sens: 1, fov: 70, sound: true, fps: false, weatherAuto: true }
  };
}
let S = defaultState();
function loadSave() { try { const j = localStorage.getItem(SAVE_KEY); if (!j) return null; const o = JSON.parse(j); return Object.assign(defaultState(), o, { set: Object.assign(defaultState().set, o.set || {}), app: Object.assign(defaultState().app, o.app || {}), stats: Object.assign(defaultState().stats, o.stats || {}) }); } catch (e) { return null; } }
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

/* ---------- materials & geometry templates ---------- */
const matCache = {};
function lam(c) { return matCache['l' + c] || (matCache['l' + c] = new THREE.MeshLambertMaterial({ color: c })); }
function bas(c) { return matCache['b' + c] || (matCache['b' + c] = new THREE.MeshBasicMaterial({ color: c })); }
const G = {};
function initGeoms() {
  G.box = new THREE.BoxGeometry(1, 1, 1);
  G.cone4 = new THREE.ConeGeometry(1, 1, 4, 1);
  G.cone7 = new THREE.ConeGeometry(1, 1, 7, 1);
  G.cyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
  G.cyl16 = new THREE.CylinderGeometry(1, 1, 1, 18, 1);
  G.sph = new THREE.IcosahedronGeometry(1, 0);
  G.circle = new THREE.CircleGeometry(1, 20); G.circle.rotateX(-Math.PI / 2);
  G.wheel = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14); G.wheel.rotateZ(Math.PI / 2);
}

/* ---------- geometry merger (one draw call for whole city) ---------- */
class Merger {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; this.v = 0; }
  box(cx, cy, cz, w, h, d, col, rotY = 0, win = false) {
    const BP = G.box.attributes.position.array, BN = G.box.attributes.normal.array, BU = G.box.attributes.uv.array, BI = G.box.index.array;
    const c = new THREE.Color(col), s = Math.sin(rotY), co = Math.cos(rotY), base = this.v;
    for (let k = 0; k < 24; k++) {
      const x = BP[k * 3] * w, y = BP[k * 3 + 1] * h, z = BP[k * 3 + 2] * d;
      const nx = BN[k * 3], ny = BN[k * 3 + 1], nz = BN[k * 3 + 2];
      this.p.push(cx + x * co + z * s, cy + y, cz - x * s + z * co);
      this.n.push(nx * co + nz * s, ny, -nx * s + nz * co);
      const face = (k / 4) | 0; let uu = BU[k * 2], vv = BU[k * 2 + 1];
      if (win === true) { if (face < 2) { uu *= d / 16; vv *= h / 16; } else if (face > 3) { uu *= w / 16; vv *= h / 16; } else { uu = 0.01; vv = 0.01; } }
      else if (win) { if (face < 2) { uu *= d / win; vv *= h / win; } else if (face > 3) { uu *= w / win; vv *= h / win; } else { uu *= w / win; vv *= d / win; } }
      this.u.push(uu, vv); this.c.push(c.r, c.g, c.b);
    }
    for (let k = 0; k < 36; k++) this.i.push(base + BI[k]);
    this.v += 24;
  }
  geo(g, cx, cy, cz, sx, sy, sz, rotY, col) {
    const P = g.attributes.position.array, N = g.attributes.normal.array, cnt = P.length / 3;
    const c = new THREE.Color(col), s = Math.sin(rotY), co = Math.cos(rotY), base = this.v;
    for (let k = 0; k < cnt; k++) {
      const x = P[k * 3] * sx, y = P[k * 3 + 1] * sy, z = P[k * 3 + 2] * sz;
      const nx = N[k * 3], ny = N[k * 3 + 1], nz = N[k * 3 + 2];
      this.p.push(cx + x * co + z * s, cy + y, cz - x * s + z * co);
      this.n.push(nx * co + nz * s, ny, -nx * s + nz * co);
      this.u.push(0.01, 0.01); this.c.push(c.r, c.g, c.b);
    }
    if (g.index) { const I = g.index.array; for (let k = 0; k < I.length; k++) this.i.push(base + I[k]); }
    else for (let k = 0; k < cnt; k++) this.i.push(base + k);
    this.v += cnt;
  }
  mesh(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(new THREE.Uint32BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  }
}

/* ---------- colliders (static AABBs, bucketed per city cell) ---------- */
let INTCOLS = null;
const colGrid = Array.from({ length: NB * NB }, () => []);
const cellIdx = x => clamp(Math.floor((x + EDGE) / CELL), 0, NB - 1);
function addCol(x0, x1, z0, z1) { colGrid[cellIdx((z0 + z1) / 2) * NB + cellIdx((x0 + x1) / 2)].push({ x0, x1, z0, z1 }); }
const _near = [];
function nearCols(x, z) {
  if (INTCOLS) return INTCOLS;
  _near.length = 0; const i = cellIdx(x), j = cellIdx(z);
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NB || b >= NB) continue;
    const l = colGrid[b * NB + a]; for (let k = 0; k < l.length; k++) _near.push(l[k]);
  }
  return _near;
}
function resolveCircle(p, r) {
  let hit = null; const list = nearCols(p.x, p.z);
  for (let k = 0; k < list.length; k++) {
    const b = list[k];
    const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1);
    let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      const d = Math.sqrt(d2);
      if (d < 1e-5) {
        const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bt = b.z1 - p.z, m = Math.min(l, rr, t, bt);
        if (m === l) { dx = -1; dz = 0; p.x = b.x0 - r; } else if (m === rr) { dx = 1; dz = 0; p.x = b.x1 + r; }
        else if (m === t) { dx = 0; dz = -1; p.z = b.z0 - r; } else { dx = 0; dz = 1; p.z = b.z1 + r; }
        hit = { nx: dx, nz: dz };
      } else { const nx = dx / d, nz = dz / d; p.x = cx + nx * r; p.z = cz + nz * r; hit = { nx, nz }; }
    }
  }
  return hit;
}
function groundY(x, z) {
  if (Math.abs(x) > EDGE || Math.abs(z) > EDGE) return 0;
  const mx = ((x + EDGE) % CELL + CELL) % CELL, mz = ((z + EDGE) % CELL + CELL) % CELL;
  return (mx > 10 && mx < 90 && mz > 10 && mz < 90) ? 0.15 : 0;
}

/* ---------- canvas signs ---------- */
function paintSign(c, l1, l2, bg, fg) {
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#ffd21f'; g.lineWidth = 10; g.strokeRect(5, 5, c.width - 10, c.height - 10);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (l2) {
    g.font = 'bold ' + Math.round(c.height * 0.42) + 'px "Arial Black", Arial, sans-serif'; g.fillText(l1, c.width / 2, c.height * 0.36);
    g.font = 'bold ' + Math.round(c.height * 0.3) + 'px Tahoma, Arial, sans-serif'; g.fillText(l2, c.width / 2, c.height * 0.76);
  } else { g.font = 'bold ' + Math.round(c.height * 0.5) + 'px "Arial Black", Arial, sans-serif'; g.fillText(l1, c.width / 2, c.height / 2); }
}
function makeSign(l1, l2, w, h, bg = '#0b0e14', fg = '#ffd21f') {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.max(64, Math.round(512 * h / w));
  paintSign(c, l1, l2, bg, fg);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
  m.userData.canvas = c; return m;
}

/* ---------- audio (tiny WebAudio synth) ---------- */
const AU = { ctx: null };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return; AU.ctx = new C();
    const o1 = AU.ctx.createOscillator(), o2 = AU.ctx.createOscillator(), g = AU.ctx.createGain(), f = AU.ctx.createBiquadFilter();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(AU.ctx.destination); o1.start(); o2.start();
    Object.assign(AU, { o1, o2, g, f });
  } catch (e) { AU.ctx = null; }
}
function audioEngine(on, spd, thr) {
  if (!AU.ctx || !AU.g) return; const t = AU.ctx.currentTime;
  if (!on || !S.set.sound) { AU.g.gain.setTargetAtTime(0, t, 0.1); return; }
  const f = 42 + spd * 2.4 + thr * 14;
  AU.o1.frequency.setTargetAtTime(f, t, 0.08); AU.o2.frequency.setTargetAtTime(f * 1.5, t, 0.08);
  AU.f.frequency.setTargetAtTime(260 + spd * 16 + thr * 180, t, 0.1); AU.g.gain.setTargetAtTime(0.02 + 0.02 * thr, t, 0.1);
}
function beep(freq = 600, dur = 0.1, type = 'sine', vol = 0.06) {
  if (!AU.ctx || !S.set.sound) return;
  try {
    const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(AU.ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, AU.ctx.currentTime + dur); o.stop(AU.ctx.currentTime + dur + 0.02);
  } catch (e) { }
}
const sfxHorn = () => { beep(392, 0.5, 'square', 0.05); beep(494, 0.5, 'square', 0.04); };
const sfxOk = () => { beep(660, 0.09); setTimeout(() => beep(880, 0.12), 90); };
const sfxClick = () => beep(520, 0.05, 'triangle', 0.05);
const sfxCrash = () => beep(90, 0.25, 'sawtooth', 0.1);

/* ---------- car radio (procedural) ---------- */
const RADIO = { st: 0, tm: null, step: 0, names: ['خاموش', '🎵 Banana FM', '🌙 Night Drive'] };
function tone(f, dur, type, vol, to) {
  if (!AU.ctx || !S.set.sound) return;
  try { const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(), t = AU.ctx.currentTime; o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AU.ctx.destination); o.start(t); o.stop(t + dur + 0.02); } catch (e) { }
}
function radioStep() {
  const s = RADIO.step++ % 16;
  if (RADIO.st === 1) { if (s % 4 === 0) tone(130, 0.18, 'sine', 0.12, 40); if (s % 4 === 2) tone(7000, 0.04, 'square', 0.015); const bass = [55, 55, 82, 73, 55, 55, 98, 82]; if (s % 2 === 0) tone(bass[(s / 2) % 8 | 0], 0.2, 'sawtooth', 0.035); if (s === 0 || s === 8) tone(s ? 554 : 440, 0.35, 'triangle', 0.03); }
  else if (RADIO.st === 2) { if (s % 8 === 0) tone(110, 0.4, 'sine', 0.1, 45); if (s % 4 === 2) tone(6000, 0.05, 'square', 0.012); const ar = [220, 262, 330, 392, 330, 262, 220, 196]; if (s % 2 === 0) tone(ar[(s / 2) % 8 | 0], 0.3, 'triangle', 0.04); if (s === 0) tone(55, 0.9, 'sawtooth', 0.03); }
}
function setRadio(n) { RADIO.st = n; if (RADIO.tm) { clearInterval(RADIO.tm); RADIO.tm = null; } if (n > 0 && AU.ctx) { RADIO.step = 0; RADIO.tm = setInterval(radioStep, n === 1 ? 135 : 170); } }
