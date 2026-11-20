/* ================= BANANA CITY — main ================= */
let lastT = 0, saveT = 0, hudT = 0, mmT = 0, fpsC = 0, fpsT = 0, fpsV = 0, interactCache = null, jumpReq = false;
const beams = {};
const D = { score: 0, idle: 0, on: false };

/* ---------- input ---------- */
const K = IN.keys;
function getMove() {
  let mx = 0, mz = 0; const k = K;
  if (k.KeyW || k.ArrowUp) mz += 1; if (k.KeyS || k.ArrowDown) mz -= 1; if (k.KeyD || k.ArrowRight) mx += 1; if (k.KeyA || k.ArrowLeft) mx -= 1;
  mx += IN.jx; mz += IN.jy; const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; } return { x: mx, z: mz };
}
function onKey(e, down) {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  K[e.code] = down;
  if (!down) return; audioInit();
  if (!running) return;
  if (e.code === 'Escape') { if (phoneOpen) closePhone(); else if (mapOpen) closeMap(); else if (menuOpen) closeMenu(); else openPauseMenu(); return; }
  if (e.code === 'KeyP' || e.code === 'Tab') { e.preventDefault(); if (phoneOpen) closePhone(); else if (!uiLock()) openPhone(); return; }
  if (e.code === 'KeyM') { if (mapOpen) closeMap(); else if (!uiLock()) openMap(); return; }
  if (uiLock()) return;
  if (e.code === 'Space') { if (!P.veh) jumpReq = true; e.preventDefault(); }
  if (e.code === 'KeyE') pressInteract();
  if (e.code === 'KeyF') pressEnter();
  if (e.code === 'KeyV') toggleCam();
  if (e.code === 'KeyH') sfxHorn();
  if (e.code === 'KeyR') cycleRadio();
  if (e.code === 'KeyL' && P.veh) { P.veh.lights = !P.veh.lights; toast(P.veh.lights ? 'چراغ‌ها روشن' : 'چراغ‌ها خاموش'); }
}
addEventListener('keydown', e => onKey(e, true)); addEventListener('keyup', e => onKey(e, false));
addEventListener('blur', () => { for (const k in K) K[k] = false; });
addEventListener('mousemove', e => { if (document.pointerLockElement && !uiLock()) look(e.movementX, e.movementY, 0.0022); });
addEventListener('wheel', e => { if (running && !uiLock()) cam.dist = clamp(cam.dist + e.deltaY * 0.005, 3, 14); }, { passive: true });
function look(dx, dy, k) { cam.yaw -= dx * k * S.set.sens; cam.pitch = clamp(cam.pitch + dy * k * S.set.sens, cam.fp ? -1.3 : -0.15, cam.fp ? 1.3 : 1.2); cam.lastLook = curTime; }
$('c').addEventListener('click', () => { if (!IS_TOUCH && running && !uiLock() && !document.pointerLockElement) $('c').requestPointerLock && $('c').requestPointerLock(); });
function cycleRadio() { if (!P.veh) return; S.radio = ((S.radio || 0) + 1) % 3; audioInit(); setRadio(S.radio); toast('📻 ' + RADIO.names[S.radio]); }
function toggleCam() { cam.fp = !cam.fp; cam.pitch = cam.fp ? 0 : 0.32; toast(cam.fp ? 'دوربین اول‌شخص' : 'دوربین سوم‌شخص'); }
window.addEventListener('pointerlockchange', () => { });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && running && !uiLock()) openPauseMenu(); });

/* touch controls */
(function touchSetup() {
  const root = $('touch'), joy = $('joy'), knob = $('knob'); let joyId = null, lookId = null, lx = 0, ly = 0, jcx = 0, jcy = 0; const R = 55;
  const btnState = { nitro: 'nitro', run: 'run', use: 'use', gas: 'gas', brake: 'brake', hand: 'hand' };
  const tapAct = { jump: () => { if (!P.veh) jumpReq = true; }, car: () => pressEnter(), horn: () => sfxHorn(), lights: () => { if (P.veh) { P.veh.lights = !P.veh.lights; toast(P.veh.lights ? 'چراغ‌ها روشن' : 'چراغ‌ها خاموش'); } }, radio: () => cycleRadio(), cam: toggleCam, phone: () => (phoneOpen ? closePhone() : openPhone()), map: () => (mapOpen ? closeMap() : openMap()), pause: () => openPauseMenu() };
  const held = {};
  function setJoy(x, y) { const dx = x - jcx, dy = y - jcy, d = Math.hypot(dx, dy), k = d > R ? R / d : 1; knob.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)'; IN.jx = clamp(dx / R, -1, 1); IN.jy = clamp(-dy / R, -1, 1); }
  root.addEventListener('pointerdown', e => {
    audioInit(); if (!running) return; const b = e.target.closest('[data-b]');
    if (b) { const n = b.dataset.b; e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); b.classList.add('down');
      if (btnState[n]) { if (n === 'run') IN.run = !IN.run, b.classList.toggle('on', IN.run); else { IN[btnState[n]] = true; held[e.pointerId] = [n, b]; if (n === 'use') { if (!uiLock()) pressInteract(); } } }
      else if (tapAct[n]) { if (n === 'phone' || n === 'map' || n === 'pause' || !uiLock()) tapAct[n](); } return; }
    if (uiLock()) return;
    if (e.target.closest('#joyzone') && joyId === null) { joyId = e.pointerId; const r = joy.getBoundingClientRect(); jcx = r.left + r.width / 2; jcy = r.top + r.height / 2; root.setPointerCapture && 0; setJoy(e.clientX, e.clientY); return; }
    if (lookId === null && e.clientX > innerWidth * 0.3) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; }
  });
  root.addEventListener('pointermove', e => {
    if (e.pointerId === joyId) setJoy(e.clientX, e.clientY);
    else if (e.pointerId === lookId) { look(e.clientX - lx, e.clientY - ly, 0.0042); lx = e.clientX; ly = e.clientY; }
  });
  const up = e => {
    if (e.pointerId === joyId) { joyId = null; IN.jx = IN.jy = 0; knob.style.transform = ''; }
    if (e.pointerId === lookId) lookId = null;
    const h = held[e.pointerId]; if (h) { IN[btnState[h[0]]] = false; delete held[e.pointerId]; }
    document.querySelectorAll('.tb.down').forEach(b => b.classList.remove('down'));
  };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('contextmenu', e => e.preventDefault());
  if (IS_TOUCH) document.body.classList.add('touch');
})();

/* ---------- interaction ---------- */
function interactTarget() {
  if (INT.active) { const me = curPos(); let b = null, bd = 1e9; INT.cur.pois.forEach(p => { const d = dist2(me.x, me.z, p.x, p.z); if (d < p.r && d < bd) { bd = d; b = p; } }); return b ? { kind: 'ipoi', ipoi: b, label: b.label } : null; }
  const me = curPos(), poi = pois.find(p => dist2(me.x, me.z, p.x, p.z) < p.r && p.type !== 'house' || (p.type === 'house' && dist2(me.x, me.z, p.x, p.z) < p.r));
  let best = null, bd = 1e9; pois.forEach(p => { const d = dist2(me.x, me.z, p.x, p.z); if (d < p.r && d < bd) { bd = d; best = p; } });
  if (best) { const p = best; return { kind: 'poi', poi: p, label: p.type === 'house' ? (S.houses.includes(p.sale) ? 'ورود به ' + p.label + ' (مال توئه)' : p.label + ' — ' + fm(SALE[p.sale].price)) : (ENTERABLE[p.type] ? 'ورود به ' : '') + p.label }; }
  if (!P.veh) {
    if (jt && jt.type === 'mechanic' && dist2(P.x, P.z, jt.from.x, jt.from.z) < 5) return { kind: 'repair', label: 'نگه دار: تعمیر ماشین' };
    const ped = nearestPed(P.x, P.z, 2.6); if (ped) return { kind: 'ped', ped, label: 'صحبت با عابر' };
  }
  return null;
}
function pressInteract() {
  if (uiLock()) return; const t = interactTarget(); if (!t) return;
  if (t.kind === 'ipoi') { sfxClick(); t.ipoi.fn(); return; }
  if (t.kind === 'poi') { if (P.veh && Math.abs(P.veh.speed) > 6 && t.poi.type !== 'gas') { toast('اول نگه دار', 'bad'); return; } usePoi(t.poi); }
  else if (t.kind === 'ped') { t.ped.talk = 3.5; toast('💬 ' + pick(PED_LINES)); sfxClick(); }
}
function nearestOwn(r) { let b = null, bd = r; vehicles.forEach(v => { if (v.traffic || v.parked || !v.id) return; const d = dist2(P.x, P.z, v.x, v.z); if (d < bd) { bd = d; b = v; } }); return b; }
function pressEnter() {
  if (uiLock()) return;
  if (P.veh) exitVeh(); else { const v = nearestOwn(5); if (v) enterVeh(v); else toast('ماشینی نزدیک نیست', 'bad'); }
}
function enterVeh(v) {
  P.veh = v; v.driver = true; setShadowCasting(v, true);
  if (v.spec.kind === 'bike') { v.mesh.add(P.hum.g); P.hum.g.position.copy(v.mesh.userData.seat); P.hum.g.position.y -= 0.35; P.hum.g.rotation.set(0, 0, 0); P.hum.g.visible = true; animHuman(P.hum, 0, 0, true); }
  else P.hum.g.visible = false;
  cam.yaw = v.h; applyUpg(v); sfxClick(); audioInit(); if (S.radio) setRadio(S.radio);
}
function exitVeh() {
  const v = P.veh; if (!v) return; const sh = Math.sin(v.h), ch = Math.cos(v.h);
  const tries = [[-ch, sh], [ch, -sh], [sh, ch], [-sh, -ch]]; let pos = null;
  for (const t of tries) { const p = { x: v.x + t[0] * 2.3, z: v.z + t[1] * 2.3 }; const before = { x: p.x, z: p.z }; resolveCircle(p, 0.5); if (Math.hypot(p.x - before.x, p.z - before.z) < 0.05) { pos = p; break; } }
  if (!pos) pos = { x: v.x - ch * 2.5, z: v.z + sh * 2.5 };
  if (v.spec.kind === 'bike') { v.mesh.remove(P.hum.g); scene.add(P.hum.g); }
  P.x = pos.x; P.z = pos.z; P.y = groundY(P.x, P.z); P.h = v.h; P.vx = P.vz = 0; P.hum.g.visible = !cam.fp; P.hum.g.rotation.set(0, P.h, 0);
  v.driver = false; v.braking = false; v.nitro = false; D.on = false; D.score = 0; setShadowCasting(v, false); P.veh = null; audioEngine(false, 0, 0); setRadio(0);
  if (cam.fp) { /* stay */ } cam.yaw = v.h;
}

/* ---------- player ---------- */
function damage(n, why) {
  if (P.dead) return; S.health -= n; cam.shake = Math.min(1, cam.shake + n * 0.05);
  if (S.health <= 0) die(why);
}
function die(why) {
  P.dead = true; S.health = 0; if (P.veh) exitVeh(); $('fade').classList.add('on'); setUI(); notify('😵 بیهوش شدی' + (why ? ' (' + why + ')' : '') + ' و به بیمارستان منتقل شدی', 'bad');
  setTimeout(() => {
    const h = poiById('hosp'), fee = Math.min(500, Math.round(S.money * 0.1)); S.money -= fee; S.health = 50; S.hunger = Math.max(S.hunger, 40);
    P.x = h.x; P.z = h.z + 5; P.y = 0; P.vx = P.vz = 0; P.dead = false; setUI(); $('fade').classList.remove('on'); notify('هزینه بیمارستان: ' + fm(fee));
  }, 1800);
}
function updatePlayer(dt) {
  const mv = uiLock() ? { x: 0, z: 0 } : getMove();
  if (P.veh) {
    const v = P.veh, locked = uiLock();
    let thr = 0, brk = 0, steer = 0, hand = false;
    if (!locked) {
      if (K.KeyW || K.ArrowUp || IN.gas) thr = 1; if (K.KeyS || K.ArrowDown || IN.brake) brk = 1; if (IN.jy > 0.45) thr = Math.max(thr, IN.jy); if (IN.jy < -0.45) brk = Math.max(brk, -IN.jy);
      steer = (K.KeyA || K.ArrowLeft ? 1 : 0) - (K.KeyD || K.ArrowRight ? 1 : 0) - IN.jx; steer = clamp(steer, -1, 1); hand = !!(K.Space || IN.hand);
    } else { brk = 0.7; }
    const wantN = !locked && (K.ShiftLeft || K.ShiftRight || IN.nitro) && thr > 0 && P.nitro > 2 && v.speed > 3 && v.fuel > 0; v.nitro = wantN; P.nitro = wantN ? Math.max(0, P.nitro - 30 * dt) : Math.min(100, P.nitro + 7 * dt); if (wantN) cam.shake = Math.max(cam.shake, 0.12);
    const wasFuel = v.fuel;
    const worst = driveVehicle(v, dt, thr, brk, steer, hand, ENV.rain > 0.5);
    const w2 = vehVsVeh(v), wmax = Math.max(worst, w2);
    { const s2 = Math.sin(v.h), c2 = Math.cos(v.h), vl = v.vx * c2 - v.vz * s2;
      if (Math.abs(vl) > 3.2 && Math.abs(v.speed) > 8) { D.on = true; D.idle = 0; D.score += Math.abs(vl) * dt * 14; }
      else if (D.on) { D.idle += dt; if (D.idle > 0.9) { D.on = false; if (D.score > 120) { const rw = Math.round(D.score / 6); S.money += rw; addXP(Math.round(D.score / 40)); addSkill('drive', D.score / 150); notify('🌀 دریفت ' + Math.round(D.score) + ' امتیاز! +' + fm(rw), 'good'); sfxOk(); } D.score = 0; } }
      if ((D.on || hand) && Math.abs(v.speed) > 7) for (const o of [-0.85, 0.85]) if (Math.random() < 0.6) emitSmoke(v.x - s2 * 1.5 - c2 * o, 0.3, v.z - c2 * 1.5 + s2 * o);
      if ((D.on || hand) && Math.abs(v.speed) > 7 && curTime - (D.skT || 0) > 0.045) { D.skT = curTime; for (const o of [-0.8, 0.8]) addSkid(v.x - s2 * 1.4 - c2 * o, v.z - c2 * 1.4 + s2 * o, v.h); } }
    { const ax = Math.abs(Math.sin(v.h)) > Math.abs(Math.cos(v.h)) ? 0 : 1, ix = Math.round(v.x / CELL) * CELL, iz = Math.round(v.z / CELL) * CELL;
      if (Math.abs(v.x - ix) < 8 && Math.abs(v.z - iz) < 8 && Math.abs(ix) <= EDGE && Math.abs(iz) <= EDGE && Math.abs(v.speed) > 6 && lightState(ax) === 'r' && curTime - (D.red || -99) > 6) { D.red = curTime; S.fines = (S.fines || 0) + 150; notify('🚦 رد شدن از چراغ قرمز! جریمه ۱۵۰$ ثبت شد', 'bad'); sfxCrash(); } }
    if (wmax > 6) { D.score = 0; D.on = false; sfxCrash(); damage((wmax - 6) * 1.7 * (v.spec.kind === 'bike' ? 1.8 : 1), 'تصادف'); }
    if (wasFuel > 0 && v.fuel <= 0) toast('⛽ بنزین تموم شد!', 'bad');
    const dKm = Math.abs(v.speed) * dt / 1000; S.stats.km += dKm; ev('km', dKm); addSkill('drive', dKm * 3);
    P.x = v.x; P.z = v.z; P.y = 0; P.h = v.h;
    if (v.spec.kind === 'bike') { P.hum.g.rotation.set(0, 0, 0); }
    audioEngine(true, Math.abs(v.speed), thr);
    if (curTime - cam.lastLook > 1.6) { const tgt = v.speed < -3 ? v.h + Math.PI : v.h; cam.yaw += angDiff(cam.yaw, tgt) * Math.min(1, dt * 2.2); if (!cam.fp) cam.pitch += (0.22 - cam.pitch) * Math.min(1, dt * 1.5); }
  } else {
    const run = (K.ShiftLeft || K.ShiftRight || IN.run) && Math.hypot(mv.x, mv.z) > 0.1 && P.stam > 3;
    const spd = run ? 6.4 : 3.4, f = { x: Math.sin(cam.yaw), z: Math.cos(cam.yaw) }, r = { x: -Math.cos(cam.yaw), z: Math.sin(cam.yaw) };
    const tx = (f.x * mv.z + r.x * mv.x) * spd, tz = (f.z * mv.z + r.z * mv.x) * spd, k = Math.min(1, dt * 11);
    P.vx += (tx - P.vx) * k; P.vz += (tz - P.vz) * k;
    const ox = P.x, oz = P.z; P.x += P.vx * dt; P.z += P.vz * dt;
    const pp = { x: P.x, z: P.z }; resolveCircle(pp, 0.45); P.x = pp.x; P.z = pp.z;
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i]; if (v.traffic && !v.active) continue; if (Math.abs(v.x - P.x) > 5 || Math.abs(v.z - P.z) > 5) continue;
      const sh = Math.sin(v.h), ch = Math.cos(v.h); for (const off of v.spec.pts) { const cx = v.x + sh * off, cz = v.z + ch * off, R = v.spec.wid * 0.5 + 0.45, dx = P.x - cx, dz = P.z - cz, d = Math.hypot(dx, dz); if (d < R && d > 1e-4) { P.x = cx + dx / d * R; P.z = cz + dz / d * R; } }
    }
    if (!INT.active) { const lim = EDGE + 30; P.x = clamp(P.x, -lim, lim); P.z = clamp(P.z, -lim, lim); }
    const moved = Math.hypot(P.x - ox, P.z - oz); S.stats.walk += moved; ev('walk', moved);
    if (run) { P.stam = Math.max(0, P.stam - 16 * (1 - 0.04 * skillLv('stam')) * dt); addSkill('stam', dt * 0.2); } else P.stam = Math.min(100, P.stam + 14 * dt);
    const gy = groundY(P.x, P.z);
    if (jumpReq && P.y <= gy + 0.05 && !locked()) { P.vy = 7.2; } jumpReq = false;
    P.vy -= 22 * dt; P.y += P.vy * dt; if (P.y <= gy) { P.y = lerp(P.y, gy, Math.min(1, dt * 25)); if (P.vy < 0) P.vy = 0; }
    const sp = Math.hypot(P.vx, P.vz);
    if (cam.fp) P.h = cam.yaw; else if (sp > 0.4) P.h += angDiff(P.h, Math.atan2(P.vx, P.vz)) * Math.min(1, dt * 12);
    P.ph += sp * dt * 2.3; animHuman(P.hum, P.ph, sp, false);
    P.hum.g.position.set(P.x, P.y, P.z); P.hum.g.rotation.y = P.h; P.hum.g.visible = !cam.fp;
    audioEngine(false, 0, 0);
  }
  // survival
  S.hunger = Math.max(0, S.hunger - dt * 0.035);
  if (S.hunger <= 0) { S.health -= dt * 0.35; if (S.health <= 0) die('گرسنگی'); } else if (S.hunger > 50 && S.health < 100) S.health = Math.min(100, S.health + dt * 0.06);
}
const locked = () => uiLock();
function vehVsVeh(v) {
  let worst = 0; const sh = Math.sin(v.h), ch = Math.cos(v.h);
  for (let i = 0; i < vehicles.length; i++) {
    const o = vehicles[i]; if (o === v || (o.traffic && !o.active)) continue; if (Math.abs(o.x - v.x) > 6.5 || Math.abs(o.z - v.z) > 6.5) continue;
    const osh = Math.sin(o.h), och = Math.cos(o.h);
    for (const a of v.spec.pts) for (const b of o.spec.pts) {
      const ax = v.x + sh * a, az = v.z + ch * a, bx = o.x + osh * b, bz = o.z + och * b, dx = ax - bx, dz = az - bz, d = Math.hypot(dx, dz), R = (v.spec.wid + o.spec.wid) * 0.5 * 0.92;
      if (d < R && d > 1e-4) {
        const nx = dx / d, nz = dz / d, pen = R - d, pf = (o.traffic || (o.id && !o.driver)) ? 0.5 : 1; v.x += nx * pen * pf; v.z += nz * pen * pf;
        if (o.traffic || (o.id && !o.driver)) { o.x -= nx * pen * 0.5; o.z -= nz * pen * 0.5; if (o.traffic) { o.stun = 2.2; o.speed *= 0.2; } }
        const rel = (v.vx - (o.vx || 0)) * nx + (v.vz - (o.vz || 0)) * nz; if (rel < 0) { v.vx -= nx * rel * 1.15; v.vz -= nz * rel * 1.15; worst = Math.max(worst, -rel); }
      }
    }
  }
  return worst;
}

/* ---------- camera ---------- */
const _v = new THREE.Vector3();
function updateCamera(dt) {
  const v = P.veh; let tx, ty, tz;
  cam.shake = Math.max(0, cam.shake - dt * 2.5); const sh = (Math.random() - 0.5) * cam.shake * 0.35;
  const base = camera.aspect < 1 ? Math.min(92, S.set.fov + (1 - camera.aspect) * 40) : S.set.fov;
  const fov = base + (v ? clamp(Math.abs(v.speed) * 0.25, 0, 14) + (v.nitro ? 9 : 0) : 0); if (Math.abs(camera.fov - fov) > 0.2) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
  const dirx = Math.sin(cam.yaw), dirz = Math.cos(cam.yaw);
  if (cam.fp) {
    if (v) { const s = Math.sin(v.h), c = Math.cos(v.h), lx = v.spec.kind === 'bike' ? 0 : 0.4, ly = v.spec.kind === 'bike' ? 1.75 : 1.2 + (v.spec.bodyH || 0) * 0.3, lz = v.spec.kind === 'bike' ? -0.2 : 0.05; camera.position.set(v.x + lx * c + lz * s, ly, v.z - lx * s + lz * c); }
    else camera.position.set(P.x, P.y + 1.68, P.z);
    camera.position.y += sh; const cp = Math.cos(cam.pitch);
    _v.set(camera.position.x + dirx * cp, camera.position.y - Math.sin(cam.pitch), camera.position.z + dirz * cp); camera.lookAt(_v);
  } else {
    tx = v ? v.x : P.x; tz = v ? v.z : P.z; ty = v ? 1.3 : P.y + 1.55;
    let dist = cam.dist * (v ? (v.spec.kind === 'bike' ? 1.1 : 1.35) : 1); const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const bx = -dirx * cp, by = sp, bz = -dirz * cp;
    for (let s = 0.6; s < dist; s += 0.6) { const px = tx + bx * s, pz = tz + bz * s, py = ty + by * s; if (py < 0.3) { dist = Math.max(1, s - 0.6); break; } const list = nearCols(px, pz); let hit = false; for (let k = 0; k < list.length; k++) { const b = list[k]; if (px > b.x0 - 0.25 && px < b.x1 + 0.25 && pz > b.z0 - 0.25 && pz < b.z1 + 0.25 && py < 60) { hit = true; break; } } if (hit) { dist = Math.max(1, s - 0.8); break; } }
    camera.position.set(tx + bx * dist, Math.min(Math.max(0.35, ty + by * dist) + sh, INT.active ? INT.cur.h - 0.35 : 1e9), tz + bz * dist); camera.lookAt(tx, ty, tz);
  }
}

/* ---------- HUD ---------- */
const bar = (id, p) => { $(id).style.width = clamp(p, 0, 100) + '%'; };
function updateHud(dt) {
  $('hMoney').textContent = fm(S.money); $('hBank').textContent = fm(S.bank); $('hLevel').textContent = 'سطح ' + S.level;
  bar('hXp', S.xp / xpNeed() * 100); bar('hHp', S.health); bar('hHunger', S.hunger); bar('hStam', P.stam);
  $('hClock').textContent = fmtClock(); $('hWeather').textContent = ({ clear: S.time > 6 && S.time < 18.5 ? '☀️' : '🌙', cloudy: '☁️', rain: '🌧', fog: '🌫' })[S.weather];
  const t = getTargets(), me = curPos(); let tr = '';
  const st = STORY[S.story]; tr += st ? '<div class="tr story"><b>🎯 ' + st.t + '</b><span>' + st.d + (st.need > 1 ? ' (' + Math.min(st.need, Math.floor(S.storyProg || 0)) + '/' + st.need + ')' : '') + '</span></div>' : '';
  if (S.job && jt && jt.text) tr += '<div class="tr job"><b>' + JOBS[S.job].i + ' ' + JOBS[S.job].n + '</b><span>' + jt.text + (jt.type === 'seller' ? ' (' + jt.cnt + '/5)' : '') + (jt.limit ? ' · ' + Math.max(0, Math.ceil(jt.limit - jt.t0)) + 's' : '') + '</span></div>';
  if (race) tr = '<div class="tr job" style="border-color:#22c55e"><b>🏁 مسابقه</b><span>چک‌پوینت ' + (race.i + 1) + '/' + race.cps.length + ' · ' + Math.max(0, Math.ceil(race.t)) + ' ثانیه</span></div>' + tr;
  if (S.daily) { const d = S.daily.list.find(x => !x.done); if (d) tr += '<div class="tr daily"><b>📅 ' + d.t + '</b><span>' + Math.min(d.need, Math.floor(d.have)) + '/' + d.need + '</span></div>'; }
  $('tracker').innerHTML = tr;
  const prim = t[0]; const ar = $('arrow'); if (prim && !INT.active) { const dx = prim.x - me.x, dz = prim.z - me.z, a = Math.atan2(dx, dz), rel = cam.yaw - a; ar.classList.remove('hidden'); ar.querySelector('i').style.transform = 'rotate(' + rel + 'rad)'; ar.querySelector('b').textContent = Math.round(Math.hypot(dx, dz)) + 'm'; } else ar.classList.add('hidden');
  const sp = $('speedo'); if (P.veh) { sp.classList.remove('hidden'); const kmh = Math.abs(P.veh.speed) * 3.6; $('kmh').textContent = Math.round(kmh); $('gear').textContent = Math.abs(P.veh.speed) < 0.6 ? 'N' : (P.veh.speed < 0 ? 'R' : Math.min(5, 1 + Math.floor(Math.abs(P.veh.speed) / P.veh.spec.max * 5))); bar('fuel', P.veh.fuel); bar('nitro', P.nitro); $('fuel').parentNode.classList.toggle('low', P.veh.fuel < 15); } else sp.classList.add('hidden');
  // prompt
  const it = uiLock() ? null : interactTarget(); const pr = $('prompt');
  if (it) { pr.classList.remove('hidden'); pr.innerHTML = (IS_TOUCH ? '' : '<kbd>E</kbd> ') + it.label; } else if (!uiLock() && !P.veh && nearestOwn(5)) { pr.classList.remove('hidden'); pr.innerHTML = (IS_TOUCH ? '🚗 ' : '<kbd>F</kbd> ') + 'سوار شدن به ' + VT[nearestOwn(5).type].name; } else pr.classList.add('hidden');
  document.querySelector('[data-b=use]').classList.toggle('ready', !!it); document.querySelector('[data-b=use] small').textContent = it ? it.label.slice(0, 12) : '';
  const dr = $('drift'); if (D.on && D.score > 20) { dr.classList.remove('hidden'); dr.textContent = '🌀 ' + Math.round(D.score); } else dr.classList.add('hidden');
  const rp = $('repair'); if (jt && jt.type === 'mechanic' && jt.prog > 0) { rp.classList.remove('hidden'); rp.firstElementChild.style.width = jt.prog * 100 + '%'; } else rp.classList.add('hidden');
  document.body.classList.toggle('invehicle', !!P.veh);
  if (S.set.fps) { $('fps').classList.remove('hidden'); $('fps').textContent = fpsV + ' FPS'; } else $('fps').classList.add('hidden');
}
function drawMinimap() {
  if (INT.active) { $('mm').style.visibility = 'hidden'; return; } $('mm').style.visibility = '';
  const c = $('mm'), g = c.getContext('2d'), W = c.width, d = W / 150, me = curPos(), yaw = cam.yaw;
  g.clearRect(0, 0, W, W); g.save(); g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 2, 0, 7); g.clip(); g.fillStyle = '#0f1724'; g.fillRect(0, 0, W, W);
  g.translate(W / 2, W / 2); g.scale(d * 1.15, d * 1.15); g.rotate(yaw + Math.PI);
  g.drawImage(mapLayer, -mapT(me.x) / MAPK, -mapT(me.z) / MAPK, mapLayer.width / MAPK, mapLayer.height / MAPK);
  if (route) { g.strokeStyle = '#ffd21f'; g.lineWidth = 3; g.beginPath(); route.forEach((p, i) => i ? g.lineTo(p[0] - me.x, p[1] - me.z) : g.moveTo(p[0] - me.x, p[1] - me.z)); g.stroke(); }
  getTargets().forEach(t => { let dx = t.x - me.x, dz = t.z - me.z; const l = Math.hypot(dx, dz), lim = 62; if (l > lim) { dx *= lim / l; dz *= lim / l; } g.fillStyle = hex(t.c); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.arc(dx, dz, 5, 0, 7); g.fill(); g.stroke(); });
  bananaObjs.forEach(b => { const dx = b.x - me.x, dz = b.z - me.z; if (Math.abs(dx) < 70 && Math.abs(dz) < 70) { g.fillStyle = '#ffd21f'; g.beginPath(); g.arc(dx, dz, 2.6, 0, 7); g.fill(); } });
  vehicles.forEach(v => { if (v.own && v !== P.veh) { g.fillStyle = '#22c55e'; g.fillRect(v.x - me.x - 2.5, v.z - me.z - 2.5, 5, 5); } });
  g.restore();
  g.save(); g.translate(W / 2, W / 2); g.rotate(yaw - (P.veh ? P.veh.h : P.h)); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -9); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill(); g.stroke(); g.restore();
  g.strokeStyle = '#ffd21f'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 2, 0, 7); g.stroke();
}
function updateBeams() {
  if (INT.active) { for (const k in beams) beams[k].visible = false; return; }
  const t = getTargets(), used = {};
  t.forEach(tg => {
    let b = beams[tg.k]; if (!b) { b = beams[tg.k] = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 90, 14, 1, true), new THREE.MeshBasicMaterial({ color: tg.c, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, fog: false })); scene.add(b); }
    b.position.set(tg.x, 45, tg.z); b.visible = true; used[tg.k] = 1;
  });
  for (const k in beams) if (!used[k]) beams[k].visible = false;
}

/* ---------- pause / help ---------- */
function openPauseMenu() {
  if (menuOpen) return;
  openMenu('⏸ منو', 'BANANA CITY', [
    { t: '▶ ادامه بازی', fn: closeMenu }, { t: '💾 ذخیره بازی', fn: () => { saveGame(); toast('ذخیره شد 💾', 'good'); } },
    { t: '⚙️ تنظیمات', fn: () => { closeMenu(); openPhone(); phonePage('set'); } }, { t: '🎮 راهنمای کنترل', fn: openHelp },
    { t: 'ℹ️ مجوزها و سازندگان', fn: openCredits },
    { t: '🏠 خروج به منوی اصلی', fn: () => { saveGame(); location.reload(); } }]);
}
function openHelp() {
  openMenu('🎮 راهنمای کنترل', IS_TOUCH ? 'گوشی: جوی‌استیک چپ = حرکت (در ماشین: فرمان) · کشیدن روی صفحه = چرخش دوربین' : 'کامپیوتر: برای فعال شدن ماوس روی بازی کلیک کن', [
    { t: 'حرکت', r: 'W A S D', dis: true }, { t: 'دویدن / پرش', r: 'Shift / Space', dis: true }, { t: 'تعامل (بانک، فروشگاه، گفتگو...)', r: 'E', dis: true }, { t: 'سوار / پیاده شدن از ماشین', r: 'F', dis: true },
    { t: 'رانندگی: گاز / ترمز / فرمان', r: 'W / S / A D', dis: true }, { t: 'ترمز دستی', r: 'Space', dis: true }, { t: 'بوق / چراغ / رادیو ماشین', r: 'H / L / R', dis: true }, { t: 'نیترو (در ماشین، نگه دار)', r: 'Shift', dis: true },
    { t: 'دوربین اول‌شخص / سوم‌شخص', r: 'V', dis: true }, { t: 'گوشی / نقشه / منو', r: 'P / M / Esc', dis: true }, { t: 'بازگشت', fn: openPauseMenu }]);
}

/* ---------- main loop ---------- */
function frame(ts) {
  requestAnimationFrame(frame); const raw = Math.min(0.05, (ts - lastT) / 1000 || 0.016); lastT = ts; const dt = raw; curTime += dt;
  fpsC++; fpsT += dt; if (fpsT >= 0.5) { fpsV = Math.round(fpsC / fpsT); fpsC = 0; fpsT = 0; }
  if (!running) { // title orbit
    const a = ts * 0.00006; camera.position.set(Math.cos(a) * 260, 90, Math.sin(a) * 260); camera.lookAt(0, 20, 0); updateEnv(dt * 0.3, { x: 0, z: 0 }); updateLights(dt); updateTraffic(dt, 0, 0); updatePeds(dt, 0, 0, null); renderer.render(scene, camera); return;
  }
  const prevT = S.time;
  updateEnv(dt, { x: P.x, z: P.z }); updateLights(dt);
  if (prevT < 6 && S.time >= 6) payday();
  updatePlayer(dt);
  vehicles.forEach(v => { if (v.id && v !== P.veh && !v.driver) { if (Math.abs(v.speed) > 0.05 || Math.hypot(v.vx, v.vz) > 0.05) { driveVehicle(v, dt, 0, 0.8, 0, false, false); } syncVehicle(v, dt); } });
  if (P.veh) syncVehicle(P.veh, dt);
  updateTraffic(dt, P.x, P.z);
  updatePeds(dt, P.x, P.z, P.veh, p => { if (P.veh) { sfxCrash(); S.fines = (S.fines || 0) + 200; notify('🚑 با عابر برخورد کردی! جریمه ۲۰۰$ ثبت شد (کلانتری)', 'bad'); cam.shake = 0.6; } });
  if (P.hum.g.visible) updateHuman(P.hum, dt);
  if (INT.active) INT.cur.npcs.forEach(n => updateHuman(n, dt));
  updateSmoke(dt); updateSkids(dt); updatePads(dt); updateJob(dt); updateBananas(dt); updateRace(dt); updateCamera(dt); updateBeams();
  pois.forEach(p => { const s = 1 + Math.sin(curTime * 3) * 0.08; p.ring.scale.set(s, s, s); p.ring.visible = dist2(P.x, P.z, p.x, p.z) < 160; });
  if (jt && jt.type === 'taxi' && jt.stage === 0 && jt.ped) { jt.ped.g.rotation.y = Math.sin(curTime) * 0.3; animHuman(jt.ped, 0, 0, false); updateHuman(jt.ped, dt); }
  hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(dt); updateEnvInt(); }
  mmT -= dt; if (mmT <= 0) { mmT = 0.066; drawMinimap(); if (mapOpen) drawFullMap(); }
  routeT -= dt; if (routeT <= 0) { routeT = 1; const t = getTargets()[0], me = curPos(); route = t ? computeRoute(me.x, me.z, t.x, t.z) : null; }
  saveT += dt; if (saveT > 20) { saveT = 0; saveGame(); }
  renderer.render(scene, camera);
}

/* ---------- boot ---------- */
function setLoad(p, t) { $('loadBar').style.width = Math.round(p * 100) + '%'; $('loadTxt').textContent = t || ''; }
async function boot() {
  try {
    initGeoms(); initRenderer(); initFx(); initSmoke(); const sv = loadSave(); if (sv) S = sv; else S = defaultState();
    applyQuality();
    await loadAssets(p => setLoad(p * 0.3, 'مدل‌های سه‌بعدی...')); makeEnv();
    await buildCity((p, t) => setLoad(0.3 + p * 0.7, t)); initSpots(); initTraffic(); initParked(); initPeds(); initSkids(); initPads(); applyQuality();
    rebuildPlayer(); scene.add(P.hum.g);
    $('loading').classList.add('hidden'); $('title').classList.remove('hidden');
    $('btnContinue').style.display = hasSave() ? '' : 'none'; $('nameIn').value = (sv && sv.name) || 'Elvin';
    window.__bc = { P, cam, camera, scene, vehicles, makeVehicle, syncVehicle, pois, jtGet: () => jt, getS: () => S, STORY }; $('btnContinue').onclick = () => startGame(false); $('btnNew').onclick = () => { if (hasSave() && !confirm('ذخیره‌ی قبلی پاک میشه. شروع بازی جدید؟')) return; startGame(true); };
    $('btnHelp').onclick = () => { $('title').classList.add('hidden'); running = false; openHelpTitle(); };
    requestAnimationFrame(frame);
  } catch (e) { $('loadTxt').textContent = 'خطا: ' + e.message; console.error(e); }
}
function openHelpTitle() { openMenu('🎮 راهنمای کنترل', 'برای برگشت «بازگشت» رو بزن', [{ t: 'حرکت: WASD · پرش: Space · دویدن: Shift', dis: true }, { t: 'تعامل: E · ماشین: F · بوق: H · چراغ: L', dis: true }, { t: 'دوربین: V · گوشی: P · نقشه: M', dis: true }, { t: 'گوشی: جوی‌استیک و دکمه‌های روی صفحه', dis: true }, { t: 'بازگشت', fn: () => { closeMenu(); $('title').classList.remove('hidden'); } }]); }
function startGame(isNew) {
  audioInit(); try { const el = document.documentElement; if (IS_TOUCH && el.requestFullscreen) el.requestFullscreen().then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => { }); }).catch(() => { }); } catch (e) { } const nm = ($('nameIn').value || 'Elvin').trim().slice(0, 14);
  vehicles.filter(v => v.id).forEach(removeVehicle);
  if (isNew) { S = defaultState(); S.name = nm; S.cars.push({ id: uid(), type: 'cab', color: 0xffd21f, fuel: 45, plate: '۱۲ ب ۳۴۵'.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), loc: 'world', x: -4.6, z: 14, h: 0 }); S.pos = { x: 0, z: 24, h: 0 }; }
  S.name = nm; S.set.quality = S.set.quality || 'med'; S.storyProg = S.storyProg || 0; S.log = S.log || []; S.tx = S.tx || [];
  S.skill = S.skill || { drive: 0, stam: 0 }; S.bn = S.bn || []; race = null;
  S.cars.forEach(c => { if (c.loc === 'world') spawnOwned(c, null, null, c.h || 0); });
  initBananas();
  S.houses.forEach(paintSale);
  if (!S.daily || S.daily.day !== S.day) genDaily();
  const pp = S.pos || { x: 0, z: 24, h: 0 }; P.x = pp.x; P.z = pp.z; P.y = 0; P.h = pp.h || 0; P.veh = null; P.dead = false; P.stam = 100; P.nitro = 100; cam.yaw = P.h; cam.pitch = 0.32; cam.fp = false;
  rebuildPlayer(); P.hum.g.visible = true; P.hum.g.position.set(P.x, 0, P.z);
  if (jt) { jt = null; } S.health = Math.max(S.health, 20); applyQuality();
  $('title').classList.add('hidden'); $('hud').classList.remove('hidden'); $('touch').classList.remove('hidden'); running = true; saveGame();
  if (isNew) setTimeout(() => notify('👋 خوش اومدی ' + S.name + '! ماشین زردت (بانانا کَب) کنارته — با F سوار شو. گوشی: 📱', 'good'), 600);
  if (S.curCar) { const v = vehicles.find(x => x.id === S.curCar); if (v && Math.hypot(v.x - P.x, v.z - P.z) < 6) enterVeh(v); }
}
window.addEventListener('load', boot);
