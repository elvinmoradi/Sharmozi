/* ================= BANANA CITY — logic & UI ================= */
const P = { x: 0, z: 0, y: 0, h: 0, vx: 0, vz: 0, vy: 0, hum: null, veh: null, ph: 0, stam: 100, dead: false };
const cam = { yaw: 0, pitch: 0.32, dist: 6, fp: false, shake: 0, lastLook: -9 };
const IN = { keys: {}, jx: 0, jy: 0, gas: false, brake: false, hand: false, run: false, use: false };
let running = false, menuOpen = false, phoneOpen = false, mapOpen = false, gps = null, route = null, routeT = 0, curTime = 0;
const uiLock = () => menuOpen || phoneOpen || mapOpen || P.dead || INT.busy;
let uidN = Date.now(); const uid = () => 'c' + (uidN++);
const poiById = id => pois.find(p => p.id === id);
const COLNAMES = ['زرد', 'آبی', 'مشکی', 'قرمز', 'سفید', 'سبز', 'بنفش', 'نارنجی'];
const hex = c => '#' + c.toString(16).padStart(6, '0');
const dot = c => '<i class="dot" style="background:' + hex(c) + '"></i>';

/* ---------- toasts / log ---------- */
function toast(msg, cls) { const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.textContent = msg; const w = $('toasts'); w.appendChild(d); while (w.children.length > 4) w.firstChild.remove(); setTimeout(() => d.remove(), 3800); }
function notify(msg, cls) { toast(msg, cls); S.log.unshift(msg); if (S.log.length > 25) S.log.pop(); }
function logTx(l, n) { S.tx = S.tx || []; S.tx.unshift(l + ' ' + fm(n)); if (S.tx.length > 12) S.tx.pop(); }

/* ---------- economy ---------- */
function xpNeed() { return 100 + S.level * 60; }
function addXP(n) { S.xp += n; while (S.xp >= xpNeed()) { S.xp -= xpNeed(); S.level++; const b = 500 * S.level; S.money += b; notify('🎉 سطح ' + S.level + '! جایزه ' + fm(b), 'good'); sfxOk(); } }
function pay(n) { if (S.money + S.bank < n) return false; const c = Math.min(S.money, n); S.money -= c; S.bank -= (n - c); return true; }
function completeTask(p, xp, label) {
  p = Math.round(p); const cash = Math.round(p * 0.25); S.money += cash; S.salary += p - cash; S.stats.earned += p; S.stats.tasks++; addXP(xp);
  notify(label + ' ✓ ' + fm(p) + ' (نقد ' + fm(cash) + ' + حقوق ' + fm(p - cash) + ')', 'good'); sfxOk(); ev('task', 1); ev('earn', p);
}
function payday() { if (S.salary > 0) { S.bank += S.salary; logTx('حقوق', S.salary); notify('💰 حقوق ' + fm(S.salary) + ' به حساب بانکی‌ات واریز شد', 'good'); S.salary = 0; sfxOk(); } }
window.__newDay = () => { genDaily(); saveGame(); };

/* ---------- missions ---------- */
const STORY = [
  { t: 'اولین قدم', d: 'برو مرکز کار و یک شغل انتخاب کن', tg: () => poiById('jobs'), ev: 'job', need: 1, rw: [500, 60] },
  { t: 'سوخت‌گیری', d: 'با ماشین به پمپ‌بنزین برو و باک رو پر کن', tg: () => poiById('gas'), ev: 'refuel', need: 1, rw: [300, 60] },
  { t: 'حساب بانکی', d: 'حداقل ۵۰۰ دلار توی بانک واریز کن', tg: () => poiById('bank'), ev: 'deposit', need: 500, rw: [400, 70] },
  { t: 'شکم گرسنه', d: 'از فروشگاه یه غذا بخر', tg: () => poiById('shop'), ev: 'food', need: 1, rw: [200, 50] },
  { t: 'اولین کارها', d: '۳ کار شغلی انجام بده', tg: null, ev: 'task', need: 3, rw: [1500, 120] },
  { t: 'ماشین رویایی', d: 'از نمایشگاه یه ماشین بخر', tg: () => poiById('dealer'), ev: 'buycar', need: 1, rw: [3000, 200] },
  { t: 'صاحب‌خونه', d: 'یه خونه بخر (علامت FOR SALE)', tg: () => poiById('house0'), ev: 'buyhouse', need: 1, rw: [10000, 400] }
];
const DAILY = [
  { id: 'km', t: n => 'رانندگی ' + n + ' کیلومتر', ev: 'km', need: () => pick([2, 3, 4]), rw: n => [400 * n, 40 * n] },
  { id: 'tasks', t: n => 'انجام ' + n + ' کار شغلی', ev: 'task', need: () => pick([2, 3, 4]), rw: n => [500 * n, 50 * n] },
  { id: 'earn', t: n => 'کسب ' + fm(n) + ' درآمد از کار', ev: 'earn', need: () => pick([800, 1200, 1800]), rw: n => [Math.round(n * 0.6), 80] },
  { id: 'food', t: n => 'خرید ' + n + ' بار غذا', ev: 'food', need: () => 2, rw: n => [300, 40] },
  { id: 'walk', t: n => 'پیاده‌روی ' + n + ' متر', ev: 'walk', need: () => pick([500, 800]), rw: n => [350, 40] },
  { id: 'dep', t: n => 'واریز ' + fm(n) + ' به بانک', ev: 'deposit', need: () => pick([500, 1000]), rw: n => [300, 40] }
];
function genDaily() {
  const pool = DAILY.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  S.daily = { day: S.day, list: pool.map(d => { const n = d.need(); return { id: d.id, t: d.t(n), ev: d.ev, need: n, have: 0, rw: d.rw(n), done: false }; }) };
}
function ev(name, val) {
  const st = STORY[S.story];
  if (st && st.ev === name) { S.storyProg = (S.storyProg || 0) + val; if (S.storyProg >= st.need) { S.money += st.rw[0]; addXP(st.rw[1]); notify('✅ ماموریت «' + st.t + '» تمام شد! +' + fm(st.rw[0]), 'good'); sfxOk(); S.story++; S.storyProg = 0; saveGame(); } }
  if (S.daily) S.daily.list.forEach(d => { if (!d.done && d.ev === name) { d.have += val; if (d.have >= d.need) { d.done = true; S.money += d.rw[0]; addXP(d.rw[1]); notify('📅 ماموریت روزانه تمام شد: ' + d.t + ' +' + fm(d.rw[0]), 'good'); sfxOk(); } } });
}

/* ---------- places / spots ---------- */
let SPOTS = [];
function initSpots() { SPOTS = []; for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) { const { cx, cz } = bpos(i, j); [[0, -38.5], [0, 38.5], [-38.5, 0], [38.5, 0]].forEach(o => SPOTS.push({ x: cx + o[0], z: cz + o[1], bi: i, bj: j })); } }
function placeName(x, z) {
  const i = cellIdx(x), j = cellIdx(z), t = BLOCK_TYPES[j][i];
  return t === 'down' ? 'مرکز شهر' : t === 'res' ? 'محله مسکونی' : t === 'park' ? 'پارک شهر' : POI_INFO[t][0];
}

/* ---------- jobs ---------- */
const JOBS = {
  taxi: { n: 'راننده تاکسی', i: '🚕', d: 'مسافر سوار کن و به مقصد برسون (با هر ماشینی)' },
  courier: { n: 'پیک', i: '📦', d: 'بسته‌ها رو از فروشگاه‌ها به خونه‌ها برسون' },
  mechanic: { n: 'مکانیک', i: '🔧', d: 'ماشین‌های خراب خیابون رو تعمیر کن' },
  seller: { n: 'فروشنده', i: '🧾', d: 'پشت صندوق فروشگاه مشتری‌ها رو راه بنداز' },
  medic: { n: 'امدادگر', i: '🚑', d: 'مجروح‌ها رو از خیابون سریع به بیمارستان برسون' }
};
let jt = null;
function curPos() { return P.veh ? { x: P.veh.x, z: P.veh.z } : { x: P.x, z: P.z }; }
function startJobTask() {
  if (jt && jt.ped) { scene.remove(jt.ped.g); } if (jt && jt.car) { removeVehicle(jt.car); }
  jt = null; if (!S.job) return;
  const me = curPos();
  if (S.job === 'taxi') {
    const far = SPOTS.filter(s => dist2(s.x, s.z, me.x, me.z) > 60 && dist2(s.x, s.z, me.x, me.z) < 420), from = pick(far);
    const ped = buildHuman({ kind: 'cesium', tint: irand(0, 7) }); ped.g.position.set(from.x, 0.15, from.z); scene.add(ped.g);
    jt = { type: 'taxi', stage: 0, from, ped, t0: 0, text: 'مسافر منتظر توئه در «' + placeName(from.x, from.z) + '»' };
  } else if (S.job === 'medic') {
    const far = SPOTS.filter(s => dist2(s.x, s.z, me.x, me.z) > 60 && dist2(s.x, s.z, me.x, me.z) < 420), from = pick(far);
    const ped = buildHuman({ kind: 'cesium', tint: irand(0, 7) }); ped.g.position.set(from.x, 0.4, from.z); ped.g.rotation.x = -1.45; scene.add(ped.g);
    jt = { type: 'medic', stage: 0, from, ped, t0: 0, text: 'مجروح در «' + placeName(from.x, from.z) + '» منتظر آمبولانسه' };
  } else if (S.job === 'courier') {
    const shops = pois.filter(p => ['shop', 'boutique', 'dealer', 'bank'].includes(p.type)), from = pick(shops);
    jt = { type: 'courier', stage: 0, from: { x: from.x, z: from.z, name: from.label }, t0: 0, text: 'بسته رو از «' + from.label + '» بردار' };
  } else if (S.job === 'mechanic') {
    const sp = pick(SPOTS), ax = sp.x + (Math.abs(sp.x - (-EDGE + 100 * Math.round((sp.x + EDGE) / 100))) < 1 ? 0 : 0);
    const car = makeVehicle(pick(['sport', 'suv', 'cab']), pick(CAR_COLORS), { traffic: false }); car.x = sp.x + (sp.x === 0 ? 0 : (BLK / 2 - 38.5 >= 0 ? 0 : 0)); car.z = sp.z; car.h = Math.random() * 6; car.active = true; car.parked = true;
    // park the broken car just off the sidewalk (on the road)
    const out = Math.abs(sp.x - bpos(sp.bi, sp.bj).cx) > 1 ? Math.sign(sp.x - bpos(sp.bi, sp.bj).cx) : 0, outz = Math.abs(sp.z - bpos(sp.bi, sp.bj).cz) > 1 ? Math.sign(sp.z - bpos(sp.bi, sp.bj).cz) : 0;
    car.x = sp.x + out * 7; car.z = sp.z + outz * 7; car.h = out !== 0 ? Math.PI / 2 * 0 : Math.PI / 2; car.h = out !== 0 ? 0 : Math.PI / 2; syncVehicle(car, 0);
    jt = { type: 'mechanic', stage: 0, from: { x: car.x, z: car.z }, car, prog: 0, text: 'ماشین خراب در «' + placeName(sp.x, sp.z) + '»' };
  } else if (S.job === 'seller') {
    const sp = poiById('seller'); jt = { type: 'seller', stage: 0, from: { x: sp.x, z: sp.z }, cnt: 0, cd: 0, text: 'برو پشت صندوق فروشگاه' };
  }
}
function updateJob(dt) {
  if (!jt) { if (S.job && running) { jt = { type: 'wait', t: 2 }; } return; }
  if (jt.type === 'wait') { jt.t -= dt; if (jt.t <= 0) { jt = null; startJobTask(); } return; }
  const me = curPos(), spd = P.veh ? Math.abs(P.veh.speed) : 0; jt.t0 += dt;
  if (jt.type === 'taxi') {
    const tgt = jt.stage === 0 ? jt.from : jt.to, d = dist2(me.x, me.z, tgt.x, tgt.z);
    if (P.veh && P.veh.spec.kind === 'car' && d < 9 && spd < 5) {
      if (jt.stage === 0) { scene.remove(jt.ped.g); const far = SPOTS.filter(s => { const q = dist2(s.x, s.z, me.x, me.z); return q > 150 && q < 460; }); jt.to = pick(far); jt.stage = 1; jt.dist = dist2(jt.from.x, jt.from.z, jt.to.x, jt.to.z); jt.t0 = 0; jt.limit = jt.dist / 10 + 25; jt.text = 'مسافر رو به «' + placeName(jt.to.x, jt.to.z) + '» برسون'; notify('🚕 مسافر سوار شد! مقصد: ' + placeName(jt.to.x, jt.to.z)); sfxOk(); }
      else { const base = 60 + jt.dist * 0.5, bonus = jt.t0 < jt.limit ? 1.4 : 1, cab = P.veh.type === 'cab' ? 1.2 : 1; completeTask(base * bonus * cab, 25, 'سفر تاکسی'); jt = { type: 'wait', t: 2.5 }; }
    }
  } else if (jt.type === 'medic') {
    const tgt = jt.stage === 0 ? jt.from : jt.to, d = dist2(me.x, me.z, tgt.x, tgt.z);
    if (P.veh && P.veh.spec.kind === 'car' && d < 9 && spd < 5) {
      if (jt.stage === 0) { scene.remove(jt.ped.g); const h = poiById('hosp'); jt.to = { x: h.x, z: h.z + 5 }; jt.stage = 1; jt.dist = dist2(jt.from.x, jt.from.z, jt.to.x, jt.to.z); jt.t0 = 0; jt.limit = jt.dist / 12 + 20; jt.text = 'مجروح رو سریع به بیمارستان برسون!'; notify('🚑 مجروح سوار شد!'); sfxOk(); }
      else { const base = 120 + jt.dist * 0.7, bonus = jt.t0 < jt.limit ? 1.6 : 1; completeTask(base * bonus, 30, 'نجات مجروح'); jt = { type: 'wait', t: 2.5 }; }
    }
  } else if (jt.type === 'courier') {
    const tgt = jt.stage === 0 ? jt.from : jt.to, d = dist2(me.x, me.z, tgt.x, tgt.z);
    if (d < 6) {
      if (jt.stage === 0) { const res = SPOTS.filter(s => BLOCK_TYPES[s.bj][s.bi] === 'res' && dist2(s.x, s.z, me.x, me.z) > 120); jt.to = pick(res); jt.stage = 1; jt.dist = dist2(jt.from.x, jt.from.z, jt.to.x, jt.to.z); jt.t0 = 0; jt.limit = jt.dist / 5 + 25; jt.text = 'بسته رو به «' + placeName(jt.to.x, jt.to.z) + '» برسون'; notify('📦 بسته رو برداشتی'); sfxOk(); }
      else { const base = 50 + jt.dist * 0.35, bonus = jt.t0 < jt.limit ? 1.4 : 1; completeTask(base * bonus, 20, 'تحویل بسته'); jt = { type: 'wait', t: 2.5 }; }
    }
  } else if (jt.type === 'mechanic') {
    const d = dist2(P.x, P.z, jt.from.x, jt.from.z);
    if (!P.veh && d < 5) { if (IN.use || IN.keys.KeyE) { jt.prog += dt / 3; } else jt.prog = Math.max(0, jt.prog - dt * 0.4); if (jt.prog >= 1) { const p = 110 + irand(0, 50); removeVehicle(jt.car); completeTask(p, 22, 'تعمیر ماشین'); jt = { type: 'wait', t: 2.5 }; } }
    else jt.prog = Math.max(0, jt.prog - dt * 0.4);
  } else if (jt.type === 'seller') { jt.cd = Math.max(0, jt.cd - dt); }
}

/* ---------- targets (waypoints) ---------- */
function getTargets() {
  const t = [];
  if (gps) t.push({ x: gps.x, z: gps.z, c: 0xffffff, k: 'gps', text: 'مقصد دلخواه' });
  if (jt && jt.type !== 'wait') { const tg = (jt.type === 'taxi' || jt.type === 'medic' || jt.type === 'courier') ? (jt.stage === 0 ? jt.from : jt.to) : jt.from; if (tg) t.push({ x: tg.x, z: tg.z, c: 0xffd21f, k: 'job', text: jt.text }); }
  const st = STORY[S.story]; if (st && st.tg) { const p = st.tg(); if (p) t.push({ x: p.x, z: p.z, c: 0x3b82f6, k: 'story', text: st.d }); }
  if (race && race.cps[race.i]) t.unshift({ x: race.cps[race.i].x, z: race.cps[race.i].z, c: 0x22c55e, k: 'race', text: 'چک‌پوینت مسابقه' });
  return t;
}

/* ---------- menu system ---------- */
function setUI() { if (uiLock() && document.pointerLockElement) document.exitPointerLock(); $('hud').classList.toggle('dim', uiLock()); }
function openMenu(title, sub, items) {
  $('menuTitle').textContent = title; $('menuSub').innerHTML = sub || ''; const l = $('menuList'); l.innerHTML = '';
  items.forEach(it => { const b = document.createElement('button'); b.className = 'mi' + (it.dis ? ' dis' : ''); b.innerHTML = '<span class="mt">' + it.t + (it.s ? '<small>' + it.s + '</small>' : '') + '</span><span class="mr">' + (it.r || '') + '</span>'; if (!it.dis) b.onclick = () => { sfxClick(); it.fn && it.fn(); }; l.appendChild(b); });
  $('menu').classList.remove('hidden'); menuOpen = true; setUI();
}
function closeMenu() { $('menu').classList.add('hidden'); menuOpen = false; setUI(); }
const cashLine = () => 'نقد: <b>' + fm(S.money) + '</b> &nbsp;|&nbsp; بانک: <b>' + fm(S.bank) + '</b>';

/* ---------- POI actions ---------- */
function usePoi(p) {
  switch (p.type) {
    case 'bank': return enterBuilding('bank');
    case 'shop': return enterBuilding('shop');
    case 'hosp': return enterBuilding('hosp');
    case 'boutique': return enterBuilding('boutique');
    case 'police': return enterBuilding('police');
    case 'garage': return openGarage();
    case 'dealer': return openDealer();
    case 'gas': return openGas(p);
    case 'jobs': return openJobs();
    case 'house': return S.houses.includes(p.sale) ? enterBuilding('house', { k: p.sale }) : openHouse(p.sale);
    case 'seller': return doSeller();
  }
}
function openBank() {
  const dep = n => { n = Math.min(n, S.money); if (n <= 0) { toast('پول نقد کافی نداری', 'bad'); return; } S.money -= n; S.bank += n; logTx('واریز', n); sfxOk(); ev('deposit', n); openBank(); };
  const wd = n => { n = Math.min(n, S.bank); if (n <= 0) { toast('موجودی بانک کافی نیست', 'bad'); return; } S.bank -= n; S.money += n; logTx('برداشت', n); sfxOk(); openBank(); };
  openMenu('🏦 بانک بانانا', cashLine() + (S.salary ? '<br>حقوق در انتظار واریز: <b>' + fm(S.salary) + '</b>' : ''), [
    { t: 'واریز ۵۰۰$', fn: () => dep(500) }, { t: 'واریز ۲٬۰۰۰$', fn: () => dep(2000) }, { t: 'واریز همه نقد', fn: () => dep(S.money) },
    { t: 'برداشت ۵۰۰$', fn: () => wd(500) }, { t: 'برداشت ۲٬۰۰۰$', fn: () => wd(2000) }, { t: 'برداشت همه', fn: () => wd(S.bank) },
    { t: 'دریافت حقوق معوق', r: fm(S.salary), dis: S.salary <= 0, fn: () => { payday(); openBank(); } },
    { t: 'بستن', fn: closeMenu }]);
}
const FOODS = [{ n: '🥤 آب معدنی', p: 5, h: 8, hp: 0 }, { n: '🥪 ساندویچ', p: 15, h: 30, hp: 0 }, { n: '🍔 همبرگر', p: 30, h: 55, hp: 5 }, { n: '🩹 کیت کمک‌های اولیه', p: 60, h: 0, hp: 40 }];
function openShop() {
  openMenu('🛒 فروشگاه بانانا', cashLine() + '<br>گرسنگی: ' + Math.round(S.hunger) + '٪ — سلامتی: ' + Math.round(S.health) + '٪',
    FOODS.map(f => ({ t: f.n, s: f.h ? '+' + f.h + ' سیری' : '+' + f.hp + ' سلامتی', r: fm(f.p), dis: S.money < f.p, fn: () => { S.money -= f.p; S.hunger = Math.min(100, S.hunger + f.h); S.health = Math.min(100, S.health + f.hp); if (f.h >= 30) ev('food', 1); sfxOk(); openShop(); } })).concat([{ t: 'بستن', fn: closeMenu }]));
}
function openHospital() {
  const cost = 200, need = S.health < 100;
  openMenu('🏥 بیمارستان', cashLine() + '<br>سلامتی: ' + Math.round(S.health) + '٪', [
    { t: 'درمان کامل', s: 'سلامتی ۱۰۰٪', r: fm(cost), dis: !need || S.money < cost, fn: () => { S.money -= cost; S.health = 100; toast('درمان شدی 💚', 'good'); sfxOk(); openHospital(); } }, { t: 'بستن', fn: closeMenu }]);
}
function openLook() {
  openMenu('👕 پوشاک بانانا', 'کاراکتر و رنگ لباس رو عوض کن (رایگان)', [
    { t: 'کاراکتر', r: CHARS[S.app.char || 0].n, fn: () => { S.app.char = ((S.app.char || 0) + 1) % CHARS.length; rebuildPlayer(); openLook(); } },
    { t: 'رنگ لباس', r: dot(TINTS[S.app.tint || 0]), fn: () => { S.app.tint = ((S.app.tint || 0) + 1) % TINTS.length; applyTint(P.hum, S.app.tint); openLook(); } },
    { t: 'تمام', fn: () => { saveGame(); closeMenu(); } }]);
}
function ownedVehicle(c) { return vehicles.find(v => v.id === c.id); }
function openGarage() {
  const p = poiById('garage'), items = [];
  S.cars.forEach(c => {
    const nm = VT[c.type].name + ' ' + dot(c.color);
    if (c.loc === 'garage') items.push({ t: '🚗 بیرون آوردن: ' + nm, s: 'پلاک ' + c.plate, fn: () => { spawnOwned(c, p.x + (S.cars.indexOf(c) % 3 - 1) * 4, p.z + 12, 0); c.loc = 'world'; toast('ماشین بیرون آمد', 'good'); closeMenu(); } });
    else { const v = ownedVehicle(c); items.push({ t: '🅿️ ذخیره در گاراژ: ' + nm, s: 'پلاک ' + c.plate + ' — ' + (v ? Math.round(dist2(v.x, v.z, p.x, p.z)) + ' متر دورتر' : ''), dis: !v || (P.veh === v), fn: () => { removeVehicle(v); c.loc = 'garage'; toast('ماشین در گاراژ ذخیره شد', 'good'); sfxOk(); openGarage(); } }); }
  });
  if (!items.length) items.push({ t: 'ماشینی نداری', s: 'از نمایشگاه خودرو بخر', dis: true });
  items.push({ t: '🛠 تیونینگ و رنگ', s: 'ارتقای موتور و رنگ جدید', fn: openTuning }); items.push({ t: 'بستن', fn: closeMenu }); openMenu('🔧 گاراژ شخصی', 'ماشین‌هات رو اینجا نگه دار یا بیرون بیار', items);
}
function openDealer() {
  openMenu('🚗 نمایشگاه خودرو', cashLine() + '<br>پرداخت از نقد و بعد بانک', Object.keys(VT).filter(k => k !== 'cab').map(k => ({ t: VT[k].name, s: 'سرعت حداکثر ' + Math.round(VT[k].max * 3.6) + ' km/h', r: fm(VT[k].price), dis: S.money + S.bank < VT[k].price, fn: () => pickColor(k) })).concat([{ t: 'بستن', fn: closeMenu }]));
}
function pickColor(k) {
  openMenu('رنگ ' + VT[k].name, 'رنگ ماشین رو انتخاب کن', CAR_COLORS.map((c, i) => ({ t: COLNAMES[i], r: dot(c), fn: () => {
    if (!pay(VT[k].price)) { toast('پول کافی نیست', 'bad'); return; }
    const p = poiById('dealer'), c2 = { id: uid(), type: k, color: c, fuel: 60, plate: irand(10, 99) + ' ب ' + irand(100, 999), loc: 'world' }; S.cars.push(c2);
    spawnOwned(c2, p.x + 18, p.z + 14, 0); logTx('خرید ' + VT[k].name, VT[k].price); notify('🎉 ' + VT[k].name + ' مال توئه!', 'good'); sfxOk(); ev('buycar', 1); addXP(40); saveGame(); closeMenu();
  } })).concat([{ t: 'بازگشت', fn: openDealer }]));
}
function openGas(p) {
  const near = vehicles.filter(v => !v.traffic && v.id && dist2(v.x, v.z, p.x, p.z) < 14).sort((a, b) => (b === P.veh) - (a === P.veh))[0];
  if (!near) { toast('اول ماشینت رو بیار کنار پمپ', 'bad'); return; }
  const price = 2, fill = n => { n = Math.min(n, 100 - near.fuel); if (n <= 0.5) { toast('باک پره', 'bad'); return; } const cost = Math.ceil(n * price); if (S.money < cost) { toast('پول نقد کافی نیست', 'bad'); return; } S.money -= cost; near.fuel += n; sfxOk(); ev('refuel', 1); openGas(p); };
  openMenu('⛽ پمپ‌بنزین', cashLine() + '<br>' + VT[near.type].name + ' — باک: <b>' + Math.round(near.fuel) + '٪</b> (هر واحد ' + fm(price) + ')', [
    { t: 'پر کردن ۱۰ واحد', r: fm(20), fn: () => fill(10) }, { t: 'پر کردن ۲۵ واحد', r: fm(50), fn: () => fill(25) }, { t: 'پر کردن کامل', r: fm(Math.ceil((100 - near.fuel) * price)), fn: () => fill(100) }, { t: 'بستن', fn: closeMenu }]);
}
function openJobs() {
  const items = Object.keys(JOBS).map(k => ({ t: JOBS[k].i + ' ' + JOBS[k].n, s: JOBS[k].d, r: S.job === k ? '✔ فعال' : '', fn: () => { S.job = k; jt = null; startJobTask(); notify('شغل جدید: ' + JOBS[k].n, 'good'); ev('job', 1); sfxOk(); openJobs(); } }));
  items.push({ t: 'دریافت حقوق معوق', r: fm(S.salary), dis: S.salary <= 0, fn: () => { payday(); openJobs(); } });
  if (S.job) items.push({ t: 'استعفا', fn: () => { S.job = null; if (jt && jt.ped) scene.remove(jt.ped.g); if (jt && jt.car) removeVehicle(jt.car); jt = null; toast('استعفا دادی'); openJobs(); } });
  items.push({ t: 'بستن', fn: closeMenu });
  openMenu('💼 مرکز کار بانانا', 'هر کار: ۲۵٪ نقد + ۷۵٪ حقوق (ساعت ۶ صبح به بانک واریز میشه)<br>' + cashLine(), items);
}
function openHouse(k) {
  const h = SALE[k], owned = S.houses.includes(k);
  if (!owned) return openMenu('🏠 ' + h.name, 'برای فروش — قیمت ' + fm(h.price) + '<br>' + cashLine(), [
    { t: 'خرید خانه', r: fm(h.price), dis: S.money + S.bank < h.price, fn: () => { if (!pay(h.price)) return; S.houses.push(k); logTx('خرید ' + h.name, h.price); notify('🏠 ' + h.name + ' رو خریدی!', 'good'); sfxOk(); ev('buyhouse', 1); addXP(100); paintSale(k); saveGame(); openHouse(k); } }, { t: 'بستن', fn: closeMenu }]);
  openMenu('🏠 ' + h.name + ' (مال توئه)', 'اینجا می‌تونی استراحت کنی و بازی رو ذخیره کنی', [
    { t: '😴 خواب تا صبح', s: 'سلامتی کامل + حقوق واریز', fn: () => { closeMenu(); sleepNow(); } }, { t: '💾 ذخیره بازی', fn: () => { saveGame(); toast('ذخیره شد 💾', 'good'); } }, { t: 'بستن', fn: closeMenu }]);
}
function paintSale(k) { const s = saleHouses[k]; if (!s) return; const owned = S.houses.includes(k); paintSign(s.sign.userData.canvas, owned ? 'SOLD' : 'FOR SALE', owned ? 'مال توئه' : 'برای فروش', owned ? '#16a34a' : '#ffd21f', owned ? '#fff' : '#0b0e14'); s.sign.material.map.needsUpdate = true; }
function sleepNow() {
  const f = $('fade'); f.classList.add('on');
  setTimeout(() => { if (S.time > 6) S.day++; S.time = 7; S.health = 100; S.hunger = Math.max(S.hunger, 60); payday(); genDaily(); saveGame(); f.classList.remove('on'); toast('صبح بخیر! ☀️', 'good'); }, 1200);
}
function doSeller() {
  if (S.job !== 'seller' || !jt || jt.type !== 'seller') { toast('اول از مرکز کار، شغل «فروشنده» رو انتخاب کن', 'bad'); return; }
  if (jt.cd > 0) return; jt.cd = 1.2; jt.cnt++; S.salary += 28; S.stats.earned += 28; addXP(3); sfxClick(); toast('فروش به مشتری ' + jt.cnt + '/5 (+$28)');
  if (jt.cnt >= 5) { completeTask(60, 20, 'پایان شیفت'); jt = { type: 'wait', t: 1.5 }; }
}

/* ---------- owned vehicles ---------- */
function spawnOwned(c, x, z, h) {
  const v = makeVehicle(c.type, c.color, { own: true, id: c.id, fuel: c.fuel });
  v.x = c.x != null && x == null ? c.x : x; v.z = c.z != null && z == null ? c.z : z; v.h = h || 0; c.loc = 'world'; applyUpg(v); syncVehicle(v, 0); return v;
}
function summonCar(c) {
  const v = ownedVehicle(c); if (!v) return toast('ماشین توی گاراژه', 'bad'); if (P.veh === v) return;
  if (!pay(150)) return toast('۱۵۰$ لازمه', 'bad');
  const f = { x: Math.sin(cam.yaw), z: Math.cos(cam.yaw) }; let x = P.x + f.x * 7, z = P.z + f.z * 7;
  const p = { x, z }; resolveCircle(p, 2.4); v.x = p.x; v.z = p.z; v.h = cam.yaw; v.vx = v.vz = v.speed = 0; syncVehicle(v, 0); toast('🚗 ماشین اومد', 'good'); logTx('احضار ماشین', 150);
}

/* ---------- phone ---------- */
const APPS = [['map', '🗺️', 'نقشه'], ['bank', '🏦', 'بانک'], ['miss', '🎯', 'ماموریت'], ['cars', '🚗', 'ماشین‌ها'], ['job', '💼', 'شغل'], ['look', '👕', 'ظاهر'], ['msg', '💬', 'پیام‌ها'], ['race', '🏁', 'مسابقه'], ['set', '⚙️', 'تنظیمات']];
function openPhone() { phoneOpen = true; $('phone').classList.remove('hidden'); phonePage('home'); setUI(); }
function closePhone() { phoneOpen = false; $('phone').classList.add('hidden'); setUI(); }
function mk(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function pbtn(html, fn, cls) { const b = mk('button', 'pb ' + (cls || ''), html); b.onclick = () => { sfxClick(); fn(); }; return b; }
function phonePage(pg) {
  const b = $('phoneBody'); b.innerHTML = ''; const back = $('phoneBack'); back.style.visibility = pg === 'home' ? 'hidden' : 'visible'; back.onclick = () => phonePage('home');
  const T = (t) => { $('phoneTitle').textContent = t; };
  if (pg === 'home') {
    T(fmtClock()); const g = mk('div', 'apps'); APPS.forEach(a => { const t = mk('button', 'app', '<span>' + a[1] + '</span><small>' + a[2] + '</small>'); t.onclick = () => { sfxClick(); if (a[0] === 'map') { closePhone(); openMap(); } else phonePage(a[0]); }; g.appendChild(t); }); b.appendChild(g);
    b.appendChild(mk('div', 'pinfo', '🌤 ' + weatherName() + ' · سطح ' + S.level + ' · ' + S.name));
    b.appendChild(pbtn('✕ بستن گوشی', closePhone, 'ghost'));
  } else if (pg === 'bank') {
    T('🏦 بانک'); b.appendChild(mk('div', 'card', 'نقد: <b>' + fm(S.money) + '</b><br>حساب بانکی: <b>' + fm(S.bank) + '</b><br>حقوق در انتظار: <b>' + fm(S.salary) + '</b><br>جریمه‌های پرداخت‌نشده: <b>' + fm(S.fines || 0) + '</b> <small>(کلانتری)</small>'));
    b.appendChild(mk('div', 'sub', 'تراکنش‌های اخیر')); (S.tx || []).forEach(x => b.appendChild(mk('div', 'row', x))); if (!(S.tx || []).length) b.appendChild(mk('div', 'row dim', 'هنوز تراکنشی نیست'));
  } else if (pg === 'miss') {
    T('🎯 ماموریت‌ها'); const st = STORY[S.story];
    b.appendChild(mk('div', 'card', st ? '<b>داستان ' + (S.story + 1) + '/' + STORY.length + ': ' + st.t + '</b><br>' + st.d + (st.need > 1 ? '<br>پیشرفت: ' + Math.min(st.need, Math.round(S.storyProg || 0)) + '/' + st.need : '') + '<br><small>جایزه ' + fm(st.rw[0]) + ' + ' + st.rw[1] + ' XP</small>' : '<b>فصل ۱ تمام شد 🎉</b><br>ماموریت‌های روزانه ادامه دارن.'));
    b.appendChild(mk('div', 'sub', 'روزانه (روز ' + S.day + ')')); S.daily.list.forEach(d => b.appendChild(mk('div', 'row' + (d.done ? ' ok' : ''), (d.done ? '✅ ' : '▫️ ') + d.t + '<small>' + Math.min(d.need, Math.floor(d.have)) + '/' + d.need + ' · ' + fm(d.rw[0]) + '</small>')));
    b.appendChild(mk('div', 'row', '🍌 موزهای پیدا شده: <b>' + (S.bn || []).length + '/24</b> <small>(هر کدوم $150)</small>'));
    b.appendChild(mk('div', 'row', '📈 مهارت رانندگی: <b>' + skillLv('drive') + '/10</b> · استقامت: <b>' + skillLv('stam') + '/10</b>'));
    b.appendChild(mk('div', 'row', '📊 آمار: ' + S.stats.tasks + ' کار · ' + S.stats.km.toFixed(1) + ' km رانندگی · درآمد ' + fm(S.stats.earned)));
  } else if (pg === 'cars') {
    T('🚗 ماشین‌های من'); if (!S.cars.length) b.appendChild(mk('div', 'row dim', 'ماشینی نداری'));
    S.cars.forEach(c => { const v = ownedVehicle(c); b.appendChild(mk('div', 'card', '<b>' + VT[c.type].name + '</b> ' + dot(c.color) + '<br><small>پلاک ' + c.plate + ' · ' + (c.loc === 'garage' ? 'در گاراژ' : 'در شهر') + ' · باک ' + Math.round(v ? v.fuel : c.fuel) + '٪</small>')); if (c.loc === 'world') b.appendChild(pbtn('📍 احضار ماشین ($150)', () => { summonCar(c); closePhone(); })); });
  } else if (pg === 'job') {
    T('💼 شغل'); b.appendChild(mk('div', 'card', S.job ? '<b>' + JOBS[S.job].i + ' ' + JOBS[S.job].n + '</b><br><small>' + JOBS[S.job].d + '</small>' : 'شغلی نداری. برو مرکز کار 💼'));
    b.appendChild(mk('div', 'row', 'حقوق در انتظار: <b>' + fm(S.salary) + '</b> <small>(ساعت ۶ صبح واریز)</small>')); b.appendChild(mk('div', 'row', 'کل کارها: ' + S.stats.tasks + ' · کل درآمد: ' + fm(S.stats.earned)));
    if (jt && jt.text) b.appendChild(mk('div', 'row', '▶ ' + jt.text));
  } else if (pg === 'look') {
    T('👕 ظاهر'); const r1 = mk('div', 'row', 'کاراکتر<span>' + CHARS[S.app.char || 0].n + '</span>'); r1.onclick = () => { S.app.char = ((S.app.char || 0) + 1) % CHARS.length; rebuildPlayer(); sfxClick(); phonePage('look'); }; b.appendChild(r1);
    const r2 = mk('div', 'row', 'رنگ لباس<span>' + dot(TINTS[S.app.tint || 0]) + '</span>'); r2.onclick = () => { S.app.tint = ((S.app.tint || 0) + 1) % TINTS.length; applyTint(P.hum, S.app.tint); sfxClick(); phonePage('look'); }; b.appendChild(r2);
  } else if (pg === 'msg') {
    T('💬 پیام‌ها'); if (!S.log.length) b.appendChild(mk('div', 'row dim', 'پیامی نیست')); S.log.forEach(m => b.appendChild(mk('div', 'row', m)));
  } else if (pg === 'race') {
    T('🏁 مسابقه'); b.appendChild(mk('div', 'card', 'مسابقه‌ی خیابانی: ۶ چک‌پوینت (دایره‌ی سبز) رو قبل از تموم شدن زمان رد کن.<br>ورودی <b>$200</b> — جایزه از $1,500 به بالا (هرچی سریع‌تر، بیشتر)<br><small>باید سوار ماشین باشی</small>'));
    b.appendChild(pbtn('🏁 شروع مسابقه', startRace)); if (race) b.appendChild(pbtn('✕ لغو مسابقه', () => { race = null; toast('لغو شد'); phonePage('race'); }, 'ghost'));
  } else if (pg === 'set') {
    T('⚙️ تنظیمات'); b.appendChild(mk('div', 'sub', 'کیفیت گرافیک'));
    const q = mk('div', 'seg'); Object.keys(PRESETS).forEach(k => { const x = mk('button', S.set.quality === k ? 'on' : '', PRESETS[k].name); x.onclick = () => { S.set.quality = k; applyQuality(); phonePage('set'); }; q.appendChild(x); }); b.appendChild(q);
    const sl = (name, key, min, max, step, f) => { const r = mk('div', 'row'); r.innerHTML = name + ' <b>' + S.set[key] + '</b><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S.set[key] + '">'; r.querySelector('input').oninput = e => { S.set[key] = parseFloat(e.target.value); r.querySelector('b').textContent = S.set[key]; f && f(); }; return r; };
    b.appendChild(sl('حساسیت دوربین', 'sens', 0.3, 2.5, 0.1)); b.appendChild(sl('میدان دید (FOV)', 'fov', 55, 95, 1));
    const tg = (name, key, f) => { const r = mk('div', 'row', name + '<span>' + (S.set[key] ? 'روشن' : 'خاموش') + '</span>'); r.onclick = () => { S.set[key] = !S.set[key]; f && f(); sfxClick(); phonePage('set'); }; return r; };
    b.appendChild(tg('صدا', 'sound', () => { if (S.set.sound) audioInit(); })); b.appendChild(tg('نمایش FPS', 'fps')); b.appendChild(tg('آب‌وهوای خودکار', 'weatherAuto'));
    const w = mk('div', 'row', 'آب‌وهوا<span>' + weatherName() + '</span>'); w.onclick = () => { const ks = ['clear', 'cloudy', 'rain', 'fog']; S.weather = ks[(ks.indexOf(S.weather) + 1) % 4]; S.set.weatherAuto = false; phonePage('set'); }; b.appendChild(w);
    const tm = mk('div', 'row', 'زمان بازی<span>' + fmtClock() + ' ⏩</span>'); tm.onclick = () => { S.time = (S.time + 3) % 24; phonePage('set'); }; b.appendChild(tm);
    b.appendChild(pbtn('💾 ذخیره بازی', () => { saveGame(); toast('ذخیره شد 💾', 'good'); })); b.appendChild(pbtn('🗑 حذف ذخیره و شروع از اول', () => { if (confirm('همه‌ی پیشرفتت پاک میشه. مطمئنی؟')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); } }, 'danger'));
  }
}
const weatherName = () => ({ clear: 'صاف', cloudy: 'ابری', rain: 'بارانی', fog: 'مه‌آلود' }[S.weather] || 'صاف');
function fmtClock() { const h = Math.floor(S.time), m = Math.floor((S.time - h) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

/* ---------- full map ---------- */
let fmScale = 1, fmOx = 0, fmOy = 0, fmSz = 600;
function openMap() { mapOpen = true; $('fullmap').classList.remove('hidden'); sizeFullMap(); setUI(); drawFullMap(); }
function closeMap() { mapOpen = false; $('fullmap').classList.add('hidden'); setUI(); }
function sizeFullMap() { const c = $('fm'); fmSz = Math.floor(Math.min(innerWidth, innerHeight - 70)); c.width = c.height = fmSz; c.style.width = c.style.height = fmSz + 'px'; }
function drawFullMap() {
  if (!mapOpen) return; const c = $('fm'), g = c.getContext('2d'), k = fmSz / (EDGE * 2 + 60);
  g.drawImage(mapLayer, 0, 0, fmSz, fmSz); const W = (x, z) => [(x + EDGE + 30) * k, (z + EDGE + 30) * k];
  if (route) { g.strokeStyle = '#ffd21f'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); route.forEach((p, i) => { const q = W(p[0], p[1]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); g.setLineDash([]); }
  getTargets().forEach(t => { const q = W(t.x, t.z); g.fillStyle = hex(t.c); g.beginPath(); g.arc(q[0], q[1], 7, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 2; g.stroke(); });
  vehicles.forEach(v => { if (v.own) { const q = W(v.x, v.z); g.fillStyle = '#22c55e'; g.fillRect(q[0] - 4, q[1] - 4, 8, 8); } });
  const pp = curPos(), q = W(pp.x, pp.z); g.save(); g.translate(q[0], q[1]); g.rotate(-(P.veh ? P.veh.h : P.h) + Math.PI); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 9); g.lineTo(0, 5); g.lineTo(-8, 9); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function computeRoute(sx, sz, tx, tz) { const cl = v => clamp(Math.round(v / CELL) * CELL, -EDGE, EDGE), ax = cl(sx), az = cl(sz), bx = cl(tx), bz = cl(tz); return [[sx, sz], [ax, az], [bx, az], [bx, bz], [tx, tz]]; }

/* ---------- save ---------- */
function saveGame() {
  try {
    const pp = INT.active ? INT.ret : curPos(); S.pos = { x: pp.x, z: pp.z, h: INT.active ? INT.ret.h : (P.veh ? P.veh.h : P.h) };
    S.cars.forEach(c => { const v = ownedVehicle(c); if (v) { c.x = v.x; c.z = v.z; c.h = v.h; c.fuel = v.fuel; c.loc = 'world'; } });
    S.curCar = P.veh ? P.veh.id : null; localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (e) { }
}

/* ---------- skills & tuning ---------- */
const skillLv = k => Math.min(10, Math.floor(((S.skill && S.skill[k]) || 0) / 10));
function addSkill(k, n) { S.skill = S.skill || { drive: 0, stam: 0 }; const a = skillLv(k); S.skill[k] = Math.min(100, (S.skill[k] || 0) + n); if (skillLv(k) > a) { notify('📈 مهارت ' + (k === 'drive' ? 'رانندگی' : 'استقامت') + ' به سطح ' + skillLv(k) + ' رسید!', 'good'); if (P.veh) applyUpg(P.veh); } }
function applyUpg(v) { if (!v.id) return; const c = S.cars.find(x => x.id === v.id), base = VT[v.type], e = (c && c.eng) || 0; v.spec = Object.assign({}, base, { max: base.max * (1 + 0.07 * e) * (1 + 0.01 * skillLv('drive')), acc: base.acc * (1 + 0.1 * e) }); }
function openTuning() {
  const items = S.cars.map(c => ({ t: VT[c.type].name + ' ' + dot(c.color), s: 'موتور سطح ' + (c.eng || 0) + '/3', fn: () => openTuneCar(c) }));
  if (!items.length) items.push({ t: 'ماشینی نداری', dis: true }); items.push({ t: 'بازگشت', fn: openGarage });
  openMenu('🛠 تیونینگ', cashLine(), items);
}
function openTuneCar(c) {
  const e = c.eng || 0, cost = 3000 * (e + 1), driving = !!(P.veh && P.veh.id === c.id);
  openMenu(VT[c.type].name + ' ' + dot(c.color), cashLine() + (driving ? '<br>برای رنگ جدید از ماشین پیاده شو' : ''), [
    { t: '⚙️ ارتقای موتور', s: '+۷٪ سرعت، +۱۰٪ شتاب', r: e >= 3 ? 'حداکثر' : fm(cost), dis: e >= 3 || S.money + S.bank < cost, fn: () => { if (!pay(cost)) return; c.eng = e + 1; const v = ownedVehicle(c); if (v) applyUpg(v); logTx('ارتقای موتور', cost); sfxOk(); openTuneCar(c); } },
    { t: '🎨 رنگ جدید', r: fm(500), dis: driving || S.money + S.bank < 500, fn: () => pickRespray(c) }, { t: 'بازگشت', fn: openTuning }]);
}
function pickRespray(c) {
  openMenu('🎨 رنگ جدید', cashLine(), CAR_COLORS.map((col, i) => ({ t: COLNAMES[i], r: dot(col), fn: () => {
    if (!pay(500)) { toast('پول کافی نیست', 'bad'); return; }
    const v = ownedVehicle(c); c.color = col; if (v) { const x = v.x, z = v.z, h = v.h; removeVehicle(v); spawnOwned(c, x, z, h); } sfxOk(); openTuneCar(c);
  } })).concat([{ t: 'بازگشت', fn: () => openTuneCar(c) }]));
}

/* ---------- street race ---------- */
let race = null;
function startRace() {
  if (!P.veh) return toast('اول سوار ماشین شو', 'bad'); if (race) return toast('یه مسابقه فعاله'); if (!pay(200)) return toast('۲۰۰$ ورودی لازمه', 'bad'); closePhone();
  const me = curPos(), cps = []; let px = me.x, pz = me.z, total = 0;
  for (let k = 0; k < 6; k++) { let x, z, g = 0; do { x = -EDGE + irand(0, NB) * CELL; z = -EDGE + irand(0, NB) * CELL; } while (dist2(x, z, px, pz) < 150 && ++g < 40); cps.push({ x, z }); total += dist2(px, pz, x, z); px = x; pz = z; }
  race = { cps, i: 0, t: total / (P.veh.spec.max * 0.5) + 20, out: 0 }; logTx('ورودی مسابقه', 200); notify('🏁 مسابقه شروع شد! ۶ چک‌پوینت — بدو!', 'good'); sfxOk();
}
function updateRace(dt) {
  if (!race) return; race.t -= dt; const v = P.veh;
  if (!v) { race.out += dt; if (race.out > 20) { race = null; toast('مسابقه لغو شد', 'bad'); } return; } race.out = 0;
  const cp = race.cps[race.i];
  if (dist2(v.x, v.z, cp.x, cp.z) < 14) { race.i++; sfxOk(); if (race.i >= race.cps.length) { const rw = 1500 + Math.round(Math.max(0, race.t) * 15); S.money += rw; addXP(90); notify('🏆 برنده شدی! جایزه ' + fm(rw), 'good'); ev('race', 1); race = null; } }
  else if (race.t <= 0) { race = null; notify('⏱ وقت تموم شد، مسابقه رو باختی', 'bad'); }
}

/* ---------- hidden bananas ---------- */
const bananaObjs = []; let BANANAG = null, BANAMAT = null;
function initBananas() {
  bananaObjs.forEach(b => scene.remove(b.m)); bananaObjs.length = 0; S.bn = S.bn || [];
  if (!BANANAG) { BANANAG = new THREE.TorusGeometry(0.45, 0.15, 6, 12, Math.PI * 1.2); BANAMAT = new THREE.MeshLambertMaterial({ color: 0xffd21f, emissive: 0xffb300, emissiveIntensity: 0.7 }); }
  const rng = seeded(777), spots = SPOTS.slice().sort(() => rng() - 0.5).slice(0, 24);
  spots.forEach((s, i) => { if (S.bn.includes(i)) return; const m = new THREE.Mesh(BANANAG, BANAMAT), x = s.x + (rng() - 0.5) * 3; m.position.set(x, 1.3, s.z); m.rotation.z = 0.6; m.scale.set(1.6, 1.6, 1.6); scene.add(m); bananaObjs.push({ m, i, x, z: s.z }); });
}
function updateBananas(dt) {
  const me = curPos();
  for (let k = bananaObjs.length - 1; k >= 0; k--) {
    const b = bananaObjs[k]; b.m.rotation.y += dt * 2; b.m.position.y = 1.3 + Math.sin(curTime * 2 + b.i) * 0.15;
    if (dist2(me.x, me.z, b.x, b.z) < 2.6) { scene.remove(b.m); bananaObjs.splice(k, 1); S.bn.push(b.i); S.money += 150; addXP(15); sfxOk(); notify('🍌 موز ' + S.bn.length + '/24 پیدا شد! +$150', 'good'); if (S.bn.length >= 24) { S.money += 20000; addXP(500); notify('🏆 همه ۲۴ موز رو پیدا کردی! +$20,000', 'good'); } }
  }
}
