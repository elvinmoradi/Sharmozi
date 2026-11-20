/* ================= BANANA CITY — extras: skid marks, boost pads, credits =================
   Ideas inspired by TorqueVerse 3D (MIT, Ebinezer) — skid marks & boost pads — written
   from scratch for this engine (no code copied).                                         */
const SK = { n: 260, i: 0, mesh: null, ages: null, t: 0 };
const _sko = new THREE.Object3D();
function initSkids() {
  const g = new THREE.PlaneGeometry(0.32, 1.1); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  SK.mesh = new THREE.InstancedMesh(g, m, SK.n); SK.mesh.frustumCulled = false; SK.ages = new Float32Array(SK.n);
  const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < SK.n; i++) SK.mesh.setMatrixAt(i, z); scene.add(SK.mesh);
}
function addSkid(x, z, h) { if (!SK.mesh) return; const k = SK.i++ % SK.n; _sko.position.set(x, 0.07, z); _sko.rotation.set(0, h, 0); _sko.scale.set(1, 1, 1); _sko.updateMatrix(); SK.mesh.setMatrixAt(k, _sko.matrix); SK.ages[k] = 1; SK.mesh.instanceMatrix.needsUpdate = true; }
function updateSkids(dt) {
  if (!SK.mesh) return; SK.t += dt; if (SK.t < 0.5) return; const step = SK.t; SK.t = 0; let ch = false; const z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let k = 0; k < SK.n; k++) if (SK.ages[k] > 0) { SK.ages[k] -= step / 25; if (SK.ages[k] <= 0) { SK.mesh.setMatrixAt(k, z); ch = true; } }
  if (ch) SK.mesh.instanceMatrix.needsUpdate = true;
}

/* ---- boost pads on the streets ---- */
const PADS = [];
function initPads() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#0b2a6b'; g.fillRect(0, 0, 128, 256); g.strokeStyle = '#4fd0ff'; g.lineWidth = 8; g.strokeRect(4, 4, 120, 248);
  for (let i = 0; i < 3; i++) { g.strokeStyle = i % 2 ? '#ffffff' : '#ffd21f'; g.lineWidth = 14; g.beginPath(); g.moveTo(24, 210 - i * 70); g.lineTo(64, 160 - i * 70); g.lineTo(104, 210 - i * 70); g.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; const geo = new THREE.PlaneGeometry(3.6, 7.2); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const rng = seeded(909);
  for (let k = 0; k < 18; k++) {
    const axis = rng() < 0.5 ? 0 : 1, dir = rng() < 0.5 ? 1 : -1, line = -EDGE + Math.floor(rng() * (NB + 1)) * CELL; let a; do { a = (rng() - 0.5) * (EDGE * 2 - 80); } while (Math.abs((((a + EDGE) % CELL) + CELL + 50) % CELL - 50) < 26);
    const dx = axis === 0 ? dir : 0, dz = axis === 1 ? dir : 0, th = Math.atan2(dx, dz), rx = -Math.cos(th), rz = Math.sin(th);
    const x = axis === 0 ? a : line + rx * 5, z = axis === 0 ? line + rz * 5 : a;
    const m = new THREE.Mesh(geo, mat); m.position.set(x, 0.08, z); m.rotation.y = th; scene.add(m); PADS.push({ x, z, h: th, m, cd: 0 });
  }
}
function updatePads(dt) {
  const v = P.veh; PADS.forEach(p => { if (p.cd > 0) p.cd -= dt; });
  if (!v || INT.active) return;
  for (let i = 0; i < PADS.length; i++) {
    const p = PADS[i]; if (p.cd > 0 || Math.abs(v.x - p.x) > 8 || Math.abs(v.z - p.z) > 8) continue;
    const dx = v.x - p.x, dz = v.z - p.z, s = Math.sin(p.h), c = Math.cos(p.h), along = dx * s + dz * c, lat = dx * c - dz * s;
    if (Math.abs(along) < 3.8 && Math.abs(lat) < 2) {
      p.cd = 2.5; const hs = Math.sin(v.h), hc = Math.cos(v.h); v.vx += hs * 15; v.vz += hc * 15; P.nitro = Math.min(100, P.nitro + 40); cam.shake = Math.max(cam.shake, 0.5);
      toast('🚀 پد سرعت! نیترو +۴۰', 'good'); beep(520, 0.25, 'sawtooth', 0.07); beep(900, 0.3, 'triangle', 0.06);
    }
  }
}

/* ---- credits ---- */
function openCredits() {
  const L = (t, s) => ({ t, s, dis: true });
  openMenu('ℹ️ مجوزها و سازندگان', 'BANANA CITY — شهر تو، قوانین تو!', [
    L('ماشین کانسپت (Car Concept)', 'Eric Chadwick — CC-BY 4.0 — Khronos glTF Sample Assets'),
    L('فراری 458 ایتالیا', 'vicent091036 — CC-BY 4.0 — نمونه‌های three.js'),
    L('شخصیت سرباز (Soldier)', 'Mixamo — نمونه‌های three.js'),
    L('شخصیت مرد شهری (CesiumMan)', 'Cesium — CC-BY 4.0 — Khronos glTF Sample Assets'),
    L('سمند، پژو ۲۰۶، پژو پارس، پراید، دنا', 'مدل‌های اصلی ساخته‌شده برای این پروژه (بدون استفاده از مدل‌های بیرونی)'),
    L('فضای داخلی بانک، بیمارستان، کلانتری، فروشگاه، پوشاک، خانه', 'کد و طراحی اصلی این پروژه'),
    L('ایده‌ی رد لاستیک و پد سرعت', 'الهام از TorqueVerse 3D (MIT — Ebinezer) — کد از نو نوشته شده'),
    L('موتور سه‌بعدی', 'Three.js — MIT'),
    { t: 'بازگشت', fn: openPauseMenu }]);
}
