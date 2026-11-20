/* ================= BANANA CITY — enterable interiors =================
   Original code. Each interior is a small separate room built far away from the
   city (IO origin); entering teleports the player there with a fade, exiting
   returns him to the street. Colliders/lighting switch while inside.        */
const INT = { active: null, busy: false, ret: null, cur: null, built: {} };
const IO = { x: 3000, z: 3000 };
const IDIM = { bank: { w: 26, d: 20, h: 5.5 }, hosp: { w: 30, d: 22, h: 5 }, police: { w: 24, d: 18, h: 4.6 }, shop: { w: 28, d: 20, h: 4.8 }, boutique: { w: 20, d: 16, h: 4.4 }, house: { w: 18, d: 14, h: 4 } };
const IKINDS = Object.keys(IDIM);
const ENTERABLE = { bank: 1, hosp: 1, police: 1, shop: 1, boutique: 1, house: 1 };

function mkInterior(kind) {
  const D = IDIM[kind], ox = IO.x + IKINDS.indexOf(kind) * 60, oz = IO.z, g = new THREE.Group(), cols = [], pois = [], npcs = [];
  const glass = new THREE.MeshLambertMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.35 });
  const B = (x, y, z, w, h, d, col, solid, mat) => { const m = new THREE.Mesh(G.box, mat || lam(col)); m.scale.set(w, h, d); m.position.set(ox + x, y, oz + z); m.receiveShadow = true; g.add(m); if (solid) cols.push({ x0: ox + x - w / 2, x1: ox + x + w / 2, z0: oz + z - d / 2, z1: oz + z + d / 2 }); return m; };
  const sign = (l1, l2, w, h, x, y, z, bg, fg) => { const s = makeSign(l1, l2, w, h, bg || '#1b64f2', fg || '#ffffff'); s.position.set(ox + x, y, oz + z); g.add(s); return s; };
  const npc = (x, z, ry, tint) => { const n = buildHuman({ kind: Math.random() < 0.5 ? 'soldier' : 'cesium', tint: irand(0, 7) }); n.g.position.set(ox + x, 0, oz + z); n.g.rotation.y = ry; g.add(n.g); animHuman(n, 0, 0, false); updateHuman(n, 0.05); npcs.push(n); return n; };
  const poi = (x, z, r, label, fn) => { const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 24), new THREE.MeshBasicMaterial({ color: 0xffd21f, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(ox + x, 0.06, oz + z); g.add(ring); pois.push({ x: ox + x, z: oz + z, r, label, fn, ring }); };
  const { w, d, h } = D, T = 0.4;
  const pal = { bank: [0xe9e4d8, 0xf4efe3], hosp: [0xdfeaf2, 0xf7fbff], police: [0xb9bec7, 0xdde6f5], shop: [0xe8e1d0, 0xfff6dc], boutique: [0xd9d2e4, 0xf6eef8], house: [0xb98a5a, 0xf1e6d2] }[kind];
  // shell
  B(0, -0.05, 0, w, 0.1, d, pal[0]); B(0, h + 0.05, 0, w, 0.1, d, 0xf5f5f5);
  B(0, h / 2, -d / 2 - T / 2, w + 2 * T, h, T, pal[1], true); B(-w / 2 - T / 2, h / 2, 0, T, h, d, pal[1], true); B(w / 2 + T / 2, h / 2, 0, T, h, d, pal[1], true);
  const sw = (w - 4.4) / 2; B(-(2.2 + sw / 2), h / 2, d / 2 + T / 2, sw, h, T, pal[1], true); B(2.2 + sw / 2, h / 2, d / 2 + T / 2, sw, h, T, pal[1], true); B(0, h - 0.6, d / 2 + T / 2, 4.4, 1.2, T, pal[1]);
  B(0, 0.02, d / 2 - 0.6, 4.2, 0.06, 1.2, 0x1b64f2);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) B(i * (w / 3), h - 0.05, j * (d / 3), 2.6, 0.08, 0.7, 0xfffbe6, false, new THREE.MeshBasicMaterial({ color: 0xfffbe6 }));
  for (let i = 0; i < 3; i++) { const L = new THREE.PointLight(0xfff1d8, 0.55, Math.max(w, d) * 1.1, 1.6); L.position.set(ox + (i - 1) * w / 3.2, h - 0.8, oz); g.add(L); }
  poi(0, d / 2 - 1.5, 2.2, 'خروج از ساختمان', () => exitBuilding());

  if (kind === 'bank') {
    B(0, 0.55, -4, 16, 1.1, 1.2, 0x6b4a2e, true); B(0, 1.2, -4, 16.4, 0.12, 1.5, 0xd8c9a8); [-6, 0, 6].forEach(x => B(x, 1.9, -4, 0.1, 1.6, 1.2, 0, false, glass));
    npc(-3, -5.4, 0, 0x1b64f2); npc(3, -5.4, 0, 0x1b64f2);
    sign('BANK', 'بانک بانانا', 10, 2.6, 0, 3.6, -d / 2 + 0.1, '#0b2a6b', '#ffd21f');
    for (let i = 0; i < 3; i++) { B(-9 + i * 1.8, 1.1, -d / 2 + 0.5, 1.3, 2.2, 0.8, 0x1b64f2, true); B(-9 + i * 1.8, 1.5, -d / 2 + 0.95, 0.9, 0.7, 0.05, 0xffd21f); }
    const vault = new THREE.Mesh(G.cyl16, lam(0x8e949e)); vault.scale.set(1.8, 0.4, 1.8); vault.rotation.x = Math.PI / 2; vault.position.set(ox + 8.5, 2, oz - d / 2 + 0.4); g.add(vault);
    B(8.5, 2, -d / 2 + 0.5, 0.5, 0.5, 0.3, 0xffd21f);
    [-8, 8].forEach(x => { B(x, 0.4, 6, 3, 0.8, 0.9, 0x6b4a2e, true); B(x, 1.0, 5.8, 3, 0.15, 0.9, 0x6b4a2e); });
    [-11, 11].forEach(x => { B(x, 0.5, -2, 0.7, 1, 0.7, 0x6d4a2a); B(x, 1.4, -2, 1.1, 1.1, 1.1, 0x2f8f4a); });
    for (let i = 0; i < 5; i++) { B(-4 + i * 2, 0.5, 1.5, 0.12, 1, 0.12, 0xd4af37); }
    poi(0, -2.4, 2.4, 'باجه‌ی بانک', () => openBank()); poi(-7.2, -7.8, 1.8, 'خودپرداز (ATM)', () => openBank());
  } else if (kind === 'hosp') {
    B(-8, 0.55, -5, 8, 1.1, 1.4, 0xf2f6fa, true); B(-8, 1.15, -5, 8.2, 0.1, 1.6, 0x1b64f2); npc(-8, -6.3, 0, 0xffffff); npc(-5, -6.3, 0, 0xffffff);
    B(0, 2.6, -d / 2 + 0.1, 3, 0.7, 0.1, 0xe5242b); B(0, 2.6, -d / 2 + 0.1, 0.7, 3, 0.1, 0xe5242b);
    sign('HOSPITAL', 'بیمارستان بانانا', 12, 2.6, 6, 3.4, -d / 2 + 0.1, '#ffffff', '#c1121f');
    for (let i = 0; i < 4; i++) { const bx = 12 - 0, bz = -7 + i * 4.5; B(bx, 0.45, bz, 2.4, 0.5, 1.2, 0xe9eef3, true); B(bx, 0.8, bz, 2.2, 0.18, 1.0, 0xffffff); B(bx + 1.3, 1.0, bz - 0.0, 0.1, 1.8, 1.6, 0x7fc4ff); }
    for (let i = 0; i < 5; i++) B(-12 + i * 1.5, 0.45, 5.5, 1.0, 0.9, 1.0, 0x1b64f2, true);
    B(-4, 0.5, 2.5, 1.2, 1.0, 1.2, 0xffffff, true); npc(4, 2, Math.PI, 0x2fa84f);
    poi(-8, -3.2, 2.4, 'پذیرش بیمارستان', () => openHospital()); poi(10.2, -2.5, 2.2, 'تخت استراحت (۴ ساعت)', () => restBed());
  } else if (kind === 'police') {
    B(0, 0.55, -1, 7, 1.1, 1.3, 0x1b3a8a, true); B(0, 1.15, -1, 7.2, 0.1, 1.5, 0xdde6f5); npc(0, -2.3, 0, 0x1b3a8a); B(-2, 1.4, -1.2, 0.8, 0.5, 0.05, 0x111111);
    sign('POLICE', 'کلانتری بانانا', 10, 2.4, 0, 3.4, -d / 2 + 0.1, '#0b2a6b', '#ffffff');
    for (let i = 0; i < 8; i++) B(-9.5 + i * 0.5, 1.4, -4.5, 0.08, 2.8, 0.08, 0x333333, false); B(-7.5, 2.85, -4.5, 4.2, 0.1, 0.1, 0x333333); B(-7.5, 0.05, -4.5, 4.2, 0.1, 0.1, 0x333333);
    cols.push({ x0: ox - 9.7, x1: ox - 5.3, z0: oz - 4.7, z1: oz - 4.3 }); B(-9.2, 0.4, -7, 1.6, 0.4, 3, 0x6b6f77); npc(-8, -6.5, 0.8, 0xe08a1a);
    sign('WANTED', 'اطلاعیه', 3, 2.2, 7.5, 2.3, -d / 2 + 0.1, '#e8d7a8', '#5a2d0c');
    B(8, 0.5, 3.5, 2.8, 0.1, 1.4, 0x6b4a2e, true); B(8, 0.25, 3.5, 2.6, 0.5, 1.2, 0x4a3320); B(8, 1.0, 3.3, 0.9, 0.5, 0.05, 0x111111);
    poi(0, 1.6, 2.4, 'میز کلانتری', () => openPolice());
  } else if (kind === 'shop') {
    [-6, -2, 2].forEach(z => { B(-3, 0.9, z, 14, 1.8, 0.8, 0xc9ccd3, true); for (let k = 0; k < 18; k++) B(-9.5 + k * 0.78, 1.95, z + (k % 2 ? 0.15 : -0.15), 0.5, 0.4 + (k % 3) * 0.1, 0.4, pick([0xe5242b, 0xffd21f, 0x1b64f2, 0x2fa84f, 0xff7a1a, 0xf2f2f2])); });
    for (let i = 0; i < 5; i++) { B(-11 + i * 2.2, 1.1, -d / 2 + 0.6, 2, 2.2, 0.9, 0xf2f6fa, true); B(-11 + i * 2.2, 1.2, -d / 2 + 1.07, 1.7, 1.8, 0.05, 0x7fc4ff); }
    B(9, 0.55, 4, 4, 1.1, 1.4, 0x1b64f2, true); B(9, 1.15, 4, 4.2, 0.1, 1.6, 0xffd21f); npc(9, 2.6, Math.PI, 0xffd21f); B(9.5, 1.4, 4, 0.7, 0.5, 0.05, 0x111111);
    sign('MARKET', 'فروشگاه بانانا', 9, 2.2, 0, 3.7, -d / 2 + 0.1, '#0b0e14', '#ffd21f');
    for (let i = 0; i < 3; i++) B(-10 + i * 1.2, 0.2, 7, 0.9, 0.4, 0.7, 0x1b64f2);
    poi(9, 6.1, 2.4, 'صندوق فروشگاه (خرید)', () => openShop()); poi(11.8, 2.2, 1.8, 'پشت صندوق (کار فروشنده)', () => doSeller());
  } else if (kind === 'boutique') {
    for (let i = 0; i < 4; i++) { B(-6 + i * 3.6, 1.0, -5, 0.1, 2, 0.1, 0x333333); B(-6 + i * 3.6, 1.8, -5, 2.6, 0.08, 0.08, 0x333333, true); for (let k = 0; k < 6; k++) B(-7.1 + i * 3.6 + k * 0.42, 1.2, -5, 0.2, 1.1, 0.5, pick(SHIRT)); }
    B(6, 1.3, -d / 2 + 0.2, 3.4, 2.6, 0.1, 0xbfe3ff); B(6, 1.3, -d / 2 + 0.12, 3.7, 2.9, 0.06, 0xd4af37);
    B(-6, 0.5, 3, 3, 1, 1.2, 0xf6eef8, true); npc(-6, 2, Math.PI, 0xec4899);
    sign('BOUTIQUE', 'پوشاک بانانا', 8, 2.2, -3, 3.4, -d / 2 + 0.1, '#0b0e14', '#ffd21f');
    B(3, 0.3, 4.5, 3.4, 0.6, 1.8, 0x1b64f2, true);
    poi(6, -5.5, 2.4, 'آینه و تغییر لباس', () => openLook());
  } else if (kind === 'house') {
    B(-5.5, 0.35, -4.3, 2.4, 0.5, 4.4, 0x8b5a2b, true); B(-5.5, 0.7, -4.3, 2.2, 0.25, 4.2, 0xf2f6fa); B(-5.5, 0.95, -5.9, 1.8, 0.25, 0.9, 0x1b64f2);
    B(6.5, 1.5, -d / 2 + 0.7, 2.2, 3, 1.0, 0x6b4a2e, true); B(5.9, 1.5, -d / 2 + 1.22, 0.9, 2.8, 0.05, 0x8a6a42); B(7.1, 1.5, -d / 2 + 1.22, 0.9, 2.8, 0.05, 0x8a6a42);
    B(3, 0.4, 3, 4, 0.8, 1.4, 0x1b64f2, true); B(3, 0.95, 3.5, 4, 0.9, 0.35, 0x1b64f2); B(3, 1.2, -1.2, 3.2, 1.8, 0.15, 0x111111, true); B(3, 1.2, -1.12, 3.0, 1.6, 0.05, 0x4a7fd0, false, new THREE.MeshBasicMaterial({ color: 0x4a7fd0 }));
    B(-6.5, 0.5, 4, 2, 1, 5, 0xf2f2f2, true); B(-6.5, 1.05, 4, 2.1, 0.1, 5.1, 0x6b4a2e); B(0, 0.02, 0, 5, 0.03, 4, 0xe5242b);
    B(-2.5, 1.6, -d / 2 + 0.06, 3, 1.6, 0.05, 0xbfe3ff); B(-8.7, 1.6, 0, 0.05, 1.6, 3, 0xbfe3ff);
    B(8, 0.4, 5, 1, 0.8, 1, 0x6d4a2a); B(8, 1.2, 5, 1.2, 1.2, 1.2, 0x2f8f4a);
    poi(-5.5, -1.3, 2.2, 'تخت: خواب / ذخیره', () => { const k = INT.houseK; if (k != null) openHouse(k); else toast('اینجا خونه‌ی توئه'); }); poi(6.5, -4.3, 2.0, 'کمد لباس', () => openLook());
  }
  g.visible = false; scene.add(g);
  return { kind, group: g, cols, pois, npcs, ox, oz, w, d, h };
}

function fadeThen(fn) { INT.busy = true; $('fade').classList.add('on'); setTimeout(() => { fn(); $('fade').classList.remove('on'); INT.busy = false; }, 380); }
function enterBuilding(kind, opts) {
  if (INT.busy || INT.active || P.dead) return;
  if (P.veh) { toast('اول از ماشین پیاده شو (F)', 'bad'); return; }
  fadeThen(() => {
    const r = INT.built[kind] || (INT.built[kind] = mkInterior(kind));
    INT.ret = { x: P.x, z: P.z, h: P.h }; INT.houseK = opts && opts.k != null ? opts.k : null; INT.active = kind; INT.cur = r; INTCOLS = r.cols; r.group.visible = true;
    P.x = r.ox; P.z = r.oz + r.d / 2 - 3.2; P.y = 0; P.vx = P.vz = 0; P.h = Math.PI; cam.yaw = Math.PI; cam.pitch = 0.28; cam.dist = Math.min(cam.dist, 4.6);
    notify('🚪 وارد ' + ({ bank: 'بانک', hosp: 'بیمارستان', police: 'کلانتری', shop: 'فروشگاه', boutique: 'پوشاک', house: 'خانه' }[kind]) + ' شدی', 'good');
  });
}
function exitBuilding() {
  if (INT.busy || !INT.active) return;
  fadeThen(() => {
    const r = INT.cur; r.group.visible = false; INTCOLS = null; INT.active = null; INT.cur = null;
    const rt = INT.ret; P.x = rt.x; P.z = rt.z; P.y = groundY(P.x, P.z); P.vx = P.vz = 0; P.h = rt.h + Math.PI; cam.yaw = P.h; cam.pitch = 0.32; cam.dist = 6;
    saveGame();
  });
}
function restBed() {
  fadeThen(() => { const t = S.time + 4; if (t >= 24) { S.time = t - 24; S.day++; genDaily(); } else S.time = t; if (S.time >= 6 && t - 4 < 6) payday(); S.health = Math.min(100, S.health + 40); S.hunger = Math.max(10, S.hunger - 12); toast('😴 ۴ ساعت استراحت کردی (+۴۰ سلامتی)', 'good'); });
}
function openPolice() {
  const f = Math.round(S.fines || 0);
  openMenu('🚓 کلانتری بانانا', cashLine() + '<br>جریمه‌های پرداخت‌نشده: <b>' + fm(f) + '</b>', [
    { t: 'پرداخت همه‌ی جریمه‌ها', r: fm(f), dis: f <= 0 || S.money + S.bank < f, fn: () => { if (!pay(f)) return; logTx('پرداخت جریمه', f); S.fines = 0; notify('✅ جریمه‌ها پرداخت شد', 'good'); sfxOk(); openPolice(); } },
    { t: '🚗 کلاس آموزش رانندگی', s: '+۱۵ امتیاز مهارت رانندگی', r: fm(400), dis: S.money + S.bank < 400, fn: () => { if (!pay(400)) return; addSkill('drive', 15); logTx('کلاس رانندگی', 400); toast('📈 مهارت رانندگیت بالا رفت', 'good'); sfxOk(); openPolice(); } },
    { t: 'بستن', fn: closeMenu }]);
}
