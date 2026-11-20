/* ================= BANANA CITY — entities ================= */
/* ---------- vehicle specs ---------- */
const VT = {
  cab:   { name: 'بانانا کَب (تاکسی)', kind: 'car', price: 0,     max: 31, acc: 13, len: 4.5, wid: 1.9,  bodyH: 0.75, cabL: 2.3, cabH: 0.7,  cabZ: -0.2,  taxi: true,   grip: 7,   steer: 1.0,  pts: [-1.3, 0, 1.3] },
  sport: { name: 'RX اسپرت',           kind: 'car', price: 18000, max: 43, acc: 19, len: 4.4, wid: 1.95, bodyH: 0.6,  cabL: 1.9, cabH: 0.55, cabZ: -0.35, spoiler: true, grip: 6.5, steer: 1.15, pts: [-1.3, 0, 1.3] },
  super: { name: 'V12 سوپراسپرت',      kind: 'car', price: 90000, max: 58, acc: 26, len: 4.6, wid: 2.05, bodyH: 0.5,  cabL: 1.7, cabH: 0.48, cabZ: -0.3,  spoiler: true, grip: 6,   steer: 1.1,  pts: [-1.4, 0, 1.4] },
  suv:   { name: 'X5 شاسی‌بلند',       kind: 'car', price: 34000, max: 37, acc: 15, len: 4.9, wid: 2.1,  bodyH: 1.0,  cabL: 3.0, cabH: 0.85, cabZ: -0.45, grip: 6.5, steer: 0.95, pts: [-1.5, 0, 1.5] },
  bike:  { name: 'موتور رِیدر',        kind: 'bike', price: 6000,  max: 40, acc: 22, len: 2.1, wid: 0.8,  grip: 7,   steer: 1.3,  pts: [-0.6, 0.6] }
};
function buildVehicleMeshProc(type, color) {
  const sp = VT[type], g = new THREE.Group(), wheels = [], head = [], tail = [];
  const box = (x, y, z, sx, sy, sz, mat) => { const m = new THREE.Mesh(G.box, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  const body = lam(color), glass = lam(0x172233), dark = lam(0x15171b);
  const mkWheel = (x, z, front) => { const w = new THREE.Group(); w.position.set(x, 0.38, z); w.rotation.order = 'YXZ'; const me = new THREE.Mesh(G.wheel, dark); w.add(me); const rim = new THREE.Mesh(G.wheel, lam(0xb8bec7)); rim.scale.set(1.02, 0.7, 0.7); w.add(rim); g.add(w); wheels.push({ g: w, front }); };
  const hm = () => new THREE.MeshLambertMaterial({ color: 0xfff4c0, emissive: 0xfff4c0, emissiveIntensity: 0.15 });
  const tm = () => new THREE.MeshLambertMaterial({ color: 0x8a1111, emissive: 0xff2222, emissiveIntensity: 0.25 });
  if (sp.kind === 'bike') {
    mkWheel(0, 0.75, true); mkWheel(0, -0.75, false);
    box(0, 0.75, 0, 0.3, 0.4, 1.0, body); box(0, 0.98, -0.2, 0.3, 0.12, 0.7, dark); box(0, 1.25, 0.6, 0.9, 0.06, 0.06, dark);
    box(0, 0.95, 0.72, 0.12, 0.5, 0.12, dark);
    const h1 = hm(); box(0, 1.1, 0.88, 0.3, 0.2, 0.12, h1); head.push(h1); const t1 = tm(); box(0, 0.95, -0.95, 0.25, 0.12, 0.1, t1); tail.push(t1);
    g.userData.seat = new THREE.Vector3(0, 0.55, -0.25);
  } else {
    const hw = sp.wid / 2, by = 0.35 + sp.bodyH / 2;
    mkWheel(-hw + 0.1, sp.len * 0.32, true); mkWheel(hw - 0.1, sp.len * 0.32, true); mkWheel(-hw + 0.1, -sp.len * 0.32, false); mkWheel(hw - 0.1, -sp.len * 0.32, false);
    box(0, by, 0, sp.wid, sp.bodyH, sp.len, body);
    box(0, 0.35 + sp.bodyH + sp.cabH / 2, sp.cabZ, sp.wid * 0.88, sp.cabH, sp.cabL, glass);
    box(0, 0.35 + sp.bodyH + sp.cabH + 0.03, sp.cabZ, sp.wid * 0.9, 0.08, sp.cabL * 0.98, body);
    box(0, 0.5, sp.len / 2, sp.wid * 1.01, 0.22, 0.12, dark); box(0, 0.5, -sp.len / 2, sp.wid * 1.01, 0.22, 0.12, dark);
    [-1, 1].forEach(s => { const h1 = hm(); box(s * (hw - 0.4), by + 0.05, sp.len / 2 + 0.02, 0.4, 0.18, 0.1, h1); head.push(h1); const t1 = tm(); box(s * (hw - 0.4), by + 0.05, -sp.len / 2 - 0.02, 0.42, 0.18, 0.1, t1); tail.push(t1); });
    if (sp.spoiler) { box(0, 0.35 + sp.bodyH + 0.45, -sp.len / 2 + 0.25, sp.wid * 0.95, 0.07, 0.4, dark); [-1, 1].forEach(s => box(s * hw * 0.6, 0.35 + sp.bodyH + 0.22, -sp.len / 2 + 0.25, 0.08, 0.4, 0.2, dark)); }
    if (sp.taxi) { box(0, 0.35 + sp.bodyH + sp.cabH + 0.25, sp.cabZ, 0.7, 0.28, 0.35, lam(0x0b0e14)); box(0, 0.35 + sp.bodyH + sp.cabH + 0.25, sp.cabZ, 0.6, 0.18, 0.37, bas(0xffd21f)); box(0, by, 0, sp.wid * 1.005, 0.12, sp.len * 0.9, lam(0x0b0e14)); }
    g.userData.seat = null;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { group: g, wheels, head, tail };
}

const vehicles = [];
function makeVehicle(type, color, opt) {
  const b = buildVehicleMesh(type, color, (opt && (opt.traffic || opt.parked)) ? 'lo' : 'hi'); scene.add(b.group);
  const v = Object.assign({ type, spec: VT[type], color, mesh: b.group, wheels: b.wheels, headM: b.head, tailM: b.tail, x: 0, z: 0, h: 0, vx: 0, vz: 0, speed: 0, steer: 0, fuel: 50, lights: false, driver: false, traffic: false, spin: 0, own: false, id: null, stun: 0 }, opt || {});
  const bm = new THREE.Mesh(BEAMG, BEAMM); bm.visible = false; bm.frustumCulled = false; b.group.add(bm); v.beam = bm;
  if (v.spec.kind === 'car') v.flames = [-0.45, 0.45].map(x => { const f = new THREE.Mesh(FLAMEG, FLAMEM); f.position.set(x, 0.45, -v.spec.len / 2 - 0.05); f.visible = false; b.group.add(f); return f; });
  vehicles.push(v); return v;
}
function removeVehicle(v) { scene.remove(v.mesh); const i = vehicles.indexOf(v); if (i >= 0) vehicles.splice(i, 1); }
function syncVehicle(v, dt) {
  v.mesh.position.set(v.x + (v.ex || 0), v.on ? 0.12 : 0, v.z + (v.ez || 0)); v.mesh.rotation.y = v.h;
  const roll = v.speed * dt / 0.38; v.spin = (v.spin + roll) % (Math.PI * 2);
  for (let k = 0; k < v.wheels.length; k++) { const w = v.wheels[k]; w.g.rotation.x = v.spin; w.g.rotation.y = w.front ? v.steer * 0.45 : 0; }
  const night = ENV.night > 0.4, on = v.lights || ((v.traffic || v.driver) && night);
  for (let k = 0; k < v.headM.length; k++) { v.headM[k].emissiveIntensity = on ? 1.2 : 0.1; }
  if (v.beam) v.beam.visible = on && (ENV.night > 0.3 || ENV.dark > 0.35);
  if (v.flames) { const nv = !!v.nitro; v.flames.forEach(f => { f.visible = nv; if (nv) f.scale.set(1, 1, 0.8 + Math.random() * 0.8); }); }
  const brake = v.braking ? 1.6 : (on ? 0.7 : 0.15); for (let k = 0; k < v.tailM.length; k++) v.tailM[k].emissiveIntensity = brake;
}
function setShadowCasting(v, on) { v.mesh.traverse(o => { if (o.isMesh) o.castShadow = on; }); }

/* ---------- player-driven vehicle physics ---------- */
function driveVehicle(v, dt, thr, brk, steer, hand, rain) {
  const sp = v.spec; v.steer = lerp(v.steer, steer, Math.min(1, dt * 8));
  const sv = Math.abs(v.speed), yaw = v.steer * sp.steer / (1 + sv / 16) * clamp(v.speed / 2.5, -1, 1) * 2.3 * (hand ? 1.35 : 1);
  v.h += yaw * dt;
  const sh = Math.sin(v.h), ch = Math.cos(v.h);
  let vf = v.vx * sh + v.vz * ch, vl = v.vx * ch - v.vz * sh;
  const fuelOk = v.fuel > 0;
  const ACC = sp.acc * (v.nitro ? 2.4 : 1), MAXS = sp.max * (v.nitro ? 1.3 : 1);
  if (thr > 0 && fuelOk) { if (vf < -0.5) vf += sp.acc * 1.8 * dt; else vf += ACC * thr * (1 - clamp(vf / MAXS, 0, 1)) * dt; }
  if (brk > 0) { if (vf > 0.5) { vf -= sp.acc * 2.0 * brk * dt; if (vf < 0) vf = 0; } else if (fuelOk) { vf -= sp.acc * 0.55 * brk * dt * (1 + Math.abs(vf) / (sp.max * 0.35)); vf = Math.max(vf, -sp.max * 0.3); } }
  v.braking = brk > 0.1 && vf > 0.5 || hand;
  const dragc = (thr === 0 && brk === 0) ? 2.4 : 0.5;
  vf -= Math.sign(vf) * Math.min(Math.abs(vf), (dragc + 0.0035 * vf * vf) * dt);
  if (hand) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 12 * dt);
  if (v.on) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 5 * dt);
  vl *= Math.exp(-(hand ? 1.6 : sp.grip) * (rain ? 0.75 : 1) * dt);
  v.vx = sh * vf + ch * vl; v.vz = ch * vf - sh * vl; v.speed = vf;
  v.x += v.vx * dt; v.z += v.vz * dt;
  const worst = collideVehicle(v);
  v.on = groundY(v.x, v.z) > 0;
  const lim = EDGE + 30; if (Math.abs(v.x) > lim) { v.x = Math.sign(v.x) * lim; v.vx *= -0.3; } if (Math.abs(v.z) > lim) { v.z = Math.sign(v.z) * lim; v.vz *= -0.3; }
  v.fuel = Math.max(0, v.fuel - (0.02 + 0.0016 * Math.abs(vf)) * dt);
  return worst;
}
function collideVehicle(v) {
  let worst = 0; const sh = Math.sin(v.h), ch = Math.cos(v.h), r = v.spec.wid * 0.52;
  for (let k = 0; k < v.spec.pts.length; k++) {
    const off = v.spec.pts[k], px = v.x + sh * off, pz = v.z + ch * off, p = { x: px, z: pz }, hit = resolveCircle(p, r);
    if (hit) {
      v.x += p.x - px; v.z += p.z - pz; const vn = v.vx * hit.nx + v.vz * hit.nz;
      if (vn < 0) { v.vx -= hit.nx * vn * 1.35; v.vz -= hit.nz * vn * 1.35; v.vx *= 0.9; v.vz *= 0.9; worst = Math.max(worst, -vn); }
    }
  }
  return worst;
}

/* ---------- AI traffic ---------- */
const traffic = [];
function placeTraffic(t) {
  t.axis = irand(0, 1); t.dir = Math.random() < 0.5 ? 1 : -1;
  const line = -EDGE + irand(0, NB) * CELL; let a; do { a = rand(-EDGE + 20, EDGE - 20); } while (Math.abs((((a + EDGE) % CELL) + CELL + 50) % CELL - 50) < 24);
  const dx = t.axis === 0 ? t.dir : 0, dz = t.axis === 1 ? t.dir : 0, th = Math.atan2(dx, dz), rx = -Math.cos(th), rz = Math.sin(th);
  if (t.axis === 0) { t.x = a; t.z = line + rz * 5; } else { t.x = line + rx * 5; t.z = a; }
  t.h = th; t.speed = 0; t.ex = 0; t.ez = 0; t.cruise = rand(9, 15); t.stun = 0; t.passed = false;
}
function initTraffic() {
  const types = ['pride', 'pride', 'samand', 'p206', 'pars', 'dena', 'samand', 'pride', 'p206', 'dena', 'pars', 'cab', 'sport', 'pride'];
  for (let k = 0; k < 20; k++) { const tp = pick(types), t = makeVehicle(tp, VT[tp].iran ? pick(IRAN_COLORS) : pick([0xe5242b, 0x1e5bd6, 0xf2f2f2, 0x2fa84f, 0x333840, 0xff7a1a, 0xffd21f, 0x8b5cf6]), { traffic: true }); placeTraffic(t); traffic.push(t); syncVehicle(t, 0); }
  window.__applyTraffic();
}
window.__applyTraffic = function () {
  const n = (PRESETS[S.set.quality] || PRESETS.med).traffic; traffic.forEach((t, k) => { t.mesh.visible = k < n; t.active = k < n; });
};
function updateTraffic(dt, px, pz) {
  for (let q = 0; q < traffic.length; q++) {
    const t = traffic[q]; if (!t.active) continue;
    if (Math.abs(t.x - px) > 420 || Math.abs(t.z - pz) > 420) { /* far away: still simulate cheaply */ }
    const dx = t.axis === 0 ? t.dir : 0, dz = t.axis === 1 ? t.dir : 0, along = t.axis === 0 ? t.x : t.z;
    const L = t.dir > 0 ? Math.ceil((along + 0.5) / CELL) * CELL : Math.floor((along - 0.5) / CELL) * CELL;
    let target = t.cruise;
    if (Math.abs(L) <= EDGE) {
      const stopD = Math.abs(L - along) - 13, st = lightState(t.axis), need = t.speed * t.speed / 9;
      if ((st === 'r' || (st === 'y' && stopD > need)) && stopD > -1) target = Math.min(target, stopD < 1 ? 0 : Math.sqrt(2 * 3 * Math.max(stopD - 1, 0)));
    }
    for (let k = 0; k < vehicles.length; k++) {
      const o = vehicles[k]; if (o === t || (o.traffic && !o.active)) continue;
      const rx = o.x - t.x, rz = o.z - t.z, ahead = rx * dx + rz * dz, lat = Math.abs(rx * dz - rz * dx);
      if (ahead > 0 && ahead < 18 && lat < 2.6) { const gap = ahead - 4.5; target = Math.min(target, gap < 3 ? 0 : Math.max(0, (gap - 3) * 1.2 + Math.max(o.speed, 0) * 0.9)); }
    }
    if (t.stun > 0) { t.stun -= dt; target = 0; }
    t.speed += clamp(target - t.speed, -10 * dt, 4 * dt); t.braking = target < t.speed - 0.5;
    const prev = along, step = t.dir * t.speed * dt; if (t.axis === 0) t.x += step; else t.z += step;
    const now = t.axis === 0 ? t.x : t.z;
    if (Math.abs(L) <= EDGE && (prev - L) * (now - L) <= 0 && prev !== now) {
      // crossing the intersection centre: choose a direction
      const th = Math.atan2(dx, dz), rvx = -Math.cos(th), rvz = Math.sin(th), M = Math.round((t.axis === 0 ? t.z : t.x) / CELL) * CELL;
      const cxp = t.axis === 0 ? L : M, czp = t.axis === 0 ? M : L;
      const opts = [[dx, dz, 6], [rvx, rvz, 2], [-rvx, -rvz, 2]].map(o => [Math.round(o[0]), Math.round(o[1]), o[2]]);
      const valid = opts.filter(o => { const ax = o[0] !== 0 ? 0 : 1, nd = o[0] + o[1], c = ax === 0 ? cxp : czp; return nd > 0 ? c < EDGE : c > -EDGE; });
      const tot = valid.reduce((s, o) => s + o[2], 0); let r = Math.random() * tot, ch = valid[0] || [-dx, -dz, 1];
      for (const o of valid) { r -= o[2]; if (r <= 0) { ch = o; break; } }
      if (ch[0] !== dx || ch[1] !== dz) {
        const nax = ch[0] !== 0 ? 0 : 1, nd = ch[0] + ch[1], nth = Math.atan2(ch[0], ch[1]), nrx = -Math.cos(nth), nrz = Math.sin(nth), ox = t.x, oz = t.z;
        if (nax === 1) { t.x = cxp + nrx * 5; t.z = czp; } else { t.x = cxp; t.z = czp + nrz * 5; }
        t.ex = ox - t.x; t.ez = oz - t.z; t.axis = nax; t.dir = nd;
      }
    }
    { // keep the car centred in its lane (it may have been shoved)
      const nth0 = Math.atan2(t.axis === 0 ? t.dir : 0, t.axis === 1 ? t.dir : 0), lr = Math.min(1, dt * 2);
      if (t.axis === 0) { const Ml = Math.round(t.z / CELL) * CELL; t.z += (Ml + Math.sin(nth0) * 5 - t.z) * lr; } else { const Ml = Math.round(t.x / CELL) * CELL; t.x += (Ml - Math.cos(nth0) * 5 - t.x) * lr; }
      t.vx = (t.axis === 0 ? t.dir : 0) * t.speed; t.vz = (t.axis === 1 ? t.dir : 0) * t.speed;
    }
    t.ex = (t.ex || 0) * Math.exp(-4 * dt); t.ez = (t.ez || 0) * Math.exp(-4 * dt);
    const ndx = t.axis === 0 ? t.dir : 0, ndz = t.axis === 1 ? t.dir : 0, tth = Math.atan2(ndx, ndz);
    t.h += angDiff(t.h, tth) * Math.min(1, dt * 5);
    if (Math.abs(t.x) > EDGE + 40 || Math.abs(t.z) > EDGE + 40) placeTraffic(t);
    syncVehicle(t, dt);
  }
}

/* ---------- pedestrians ---------- */
const peds = [];
const PED_LINES = ['سلام! امروز هوا عالیه.', 'شنیدی؟ نمایشگاه ماشین‌های جدید آورده.', 'پمپ‌بنزین سر چهارراهه، باکت رو پر کن.', 'اگه کار می‌خوای برو مرکز کار.', 'مواظب باش، خیابون‌ها شلوغه!', 'بانک امروز تا شب بازه.', 'خونه‌ها گرون شدن ولی ارزششو داره.', 'تاکسی بانانا بهترین ماشین شهره 😄', 'یه ساندویچ از فروشگاه بگیر، خوشمزه‌ست.', 'شب‌ها شهر قشنگ‌تر میشه.'];
function initPeds() {
  for (let k = 0; k < 20; k++) {
    const h = buildHuman({ kind: Math.random() < 0.5 ? 'soldier' : 'cesium', tint: irand(0, 7), npc: true });
    scene.add(h.g);
    const bi = irand(0, NB - 1), bj = irand(0, NB - 1), { cx, cz } = bpos(bi, bj);
    const p = { h, cx, cz, half: BLOCK_TYPES[bj][bi] === 'park' ? 30 : 38.5, s: rand(0, 300), dir: Math.random() < 0.5 ? 1 : -1, sp: rand(1.1, 1.7), ph: rand(0, 6), x: 0, z: 0, state: 'walk', down: 0, off: rand(-0.8, 0.8), talk: 0 };
    peds.push(p);
  }
}
function ringPos(p) {
  const L = p.half * 2, tot = 4 * L; let s = ((p.s % tot) + tot) % tot, x, z;
  if (s < L) { x = -p.half + s; z = -p.half + p.off; } else if (s < 2 * L) { x = p.half - p.off; z = -p.half + (s - L); } else if (s < 3 * L) { x = p.half - (s - 2 * L); z = p.half - p.off; } else { x = -p.half + p.off; z = p.half - (s - 3 * L); }
  return [p.cx + x, p.cz + z];
}
function updatePeds(dt, px, pz, pveh, onHit) {
  const n = (PRESETS[S.set.quality] || PRESETS.med).peds;
  for (let k = 0; k < peds.length; k++) {
    const p = peds[k], g = p.h.g;
    if (k >= n) { g.visible = false; continue; }
    if (p.state === 'walk') {
      const a = ringPos(p); const lx = p.x, lz = p.z; p.s += p.dir * p.sp * dt * (p.talk > 0 ? 0 : 1); const b = ringPos(p); p.x = b[0]; p.z = b[1];
      if (p.talk > 0) { p.talk -= dt; } else { const hd = Math.atan2(b[0] - a[0], b[1] - a[1]); if (b[0] !== a[0] || b[1] !== a[1]) g.rotation.y += angDiff(g.rotation.y, hd) * Math.min(1, dt * 8); }
      if (!p.init) { p.init = true; g.position.set(p.x, 0.15, p.z); }
    }
    const far = Math.hypot(p.x - px, p.z - pz) > 170; g.visible = !far; if (far) continue;
    g.position.set(p.x, 0.15, p.z);
    if (p.state === 'walk') { p.ph += dt * p.sp * 5; animHuman(p.h, p.ph, p.talk > 0 ? 0 : p.sp * 1.4, false); updateHuman(p.h, dt); g.rotation.x = 0; }
    else if (p.state === 'down') { p.down -= dt; g.rotation.x = lerp(g.rotation.x, -1.4, Math.min(1, dt * 10)); g.position.y = 0.3; if (p.down <= 0) { p.state = 'walk'; g.rotation.x = 0; } }
    if (pveh && p.state === 'walk' && Math.abs(pveh.speed) > 4) {
      const sh = Math.sin(pveh.h), ch = Math.cos(pveh.h);
      for (let q = -1; q <= 1; q++) { const cx = pveh.x + sh * q * 1.4, cz = pveh.z + ch * q * 1.4; if (Math.hypot(p.x - cx, p.z - cz) < 1.6) { p.state = 'down'; p.down = 3.5; onHit && onHit(p); break; } }
    }
  }
}
function nearestPed(px, pz, r) {
  let best = null, bd = r; for (const p of peds) { if (!p.h.g.visible || p.state !== 'walk') continue; const d = Math.hypot(p.x - px, p.z - pz); if (d < bd) { bd = d; best = p; } } return best;
}

/* ---------- fx: headlight beams, nitro flames, tyre smoke ---------- */
let BEAMG = null, BEAMM = null, FLAMEG = null, FLAMEM = null;
function initFx() {
  BEAMG = new THREE.BufferGeometry(); BEAMG.setAttribute('position', new THREE.Float32BufferAttribute([-0.8, 0.07, 2.4, 0.8, 0.07, 2.4, 3.6, 0.07, 18, -3.6, 0.07, 18], 3));
  BEAMG.setAttribute('color', new THREE.Float32BufferAttribute([0.95, 0.8, 0.4, 0.95, 0.8, 0.4, 0.1, 0.08, 0.03, 0.1, 0.08, 0.03], 3)); BEAMG.setIndex([0, 2, 1, 0, 3, 2]);
  BEAMM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  FLAMEG = new THREE.ConeGeometry(0.28, 2.2, 8); FLAMEG.rotateX(-Math.PI / 2); FLAMEG.translate(0, 0, -1.1);
  FLAMEM = new THREE.MeshBasicMaterial({ color: 0xff9a1f, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
}
const SM = { n: 90, i: 0, pts: null };
function initSmoke() {
  SM.pos = new Float32Array(SM.n * 3).fill(-999); SM.col = new Float32Array(SM.n * 3); SM.life = new Float32Array(SM.n); SM.vel = new Float32Array(SM.n * 3);
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(SM.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(SM.col, 3));
  SM.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 3.4, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); SM.pts.frustumCulled = false; scene.add(SM.pts);
}
function emitSmoke(x, y, z) { const k = SM.i++ % SM.n; SM.pos[k * 3] = x; SM.pos[k * 3 + 1] = y; SM.pos[k * 3 + 2] = z; SM.vel[k * 3] = rand(-0.7, 0.7); SM.vel[k * 3 + 1] = rand(0.6, 1.3); SM.vel[k * 3 + 2] = rand(-0.7, 0.7); SM.life[k] = 1; }
function updateSmoke(dt) {
  if (!SM.pts) return;
  for (let k = 0; k < SM.n; k++) {
    if (SM.life[k] <= 0) { SM.col[k * 3] = SM.col[k * 3 + 1] = SM.col[k * 3 + 2] = 0; continue; }
    SM.life[k] -= dt * 1.1; SM.pos[k * 3] += SM.vel[k * 3] * dt; SM.pos[k * 3 + 1] += SM.vel[k * 3 + 1] * dt; SM.pos[k * 3 + 2] += SM.vel[k * 3 + 2] * dt;
    const c = Math.max(0, SM.life[k]) * 0.5; SM.col[k * 3] = SM.col[k * 3 + 1] = SM.col[k * 3 + 2] = c;
  }
  SM.pts.geometry.attributes.position.needsUpdate = true; SM.pts.geometry.attributes.color.needsUpdate = true;
}
/* ---------- parked cars (dense city) ---------- */
function initParked() {
  const rng = seeded(4242), types = ['pride', 'samand', 'p206', 'pars', 'dena', 'pride', 'pride', 'samand', 'cab', 'sport'], cols = IRAN_COLORS, placed = []; let tries = 0;
  while (placed.length < 22 && tries++ < 500) {
    const i = Math.floor(rng() * NB), j = Math.floor(rng() * NB), { cx, cz } = bpos(i, j), side = Math.floor(rng() * 4), a = (rng() - 0.5) * 56; let x, z, h;
    if (side < 2) { z = cz + (side ? 42 : -42); x = cx + a; h = rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2; } else { x = cx + (side === 3 ? 42 : -42); z = cz + a; h = rng() < 0.5 ? 0 : Math.PI; }
    if (Math.hypot(x, z - 20) < 14 || placed.some(p => Math.hypot(p[0] - x, p[1] - z) < 7)) continue;
    placed.push([x, z]); const v = makeVehicle(types[Math.floor(rng() * types.length)], cols[Math.floor(rng() * cols.length)], { parked: true }); v.x = x; v.z = z; v.h = h; v.active = true; syncVehicle(v, 0);
  }
}
