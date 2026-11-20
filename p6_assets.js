/* ================= BANANA CITY — real 3D assets (GLB) ================= */
const MODELS = {}, ENVMATS = [];
const TINTS = [0xffffff, 0xffd21f, 0x3b82f6, 0xe5242b, 0x2fa84f, 0x8b5cf6, 0xff7a1a, 0x4b5563];
const CHARS = [{ n: 'سرباز (آقا)', kind: 'soldier' }, { n: 'مرد شهری', kind: 'cesium' }];
const TEXS = {};
function b64ToBuf(s) { const bin = atob(s), n = bin.length, u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function parseGLB(buf) { return new Promise((res, rej) => new THREE.GLTFLoader().parse(buf, '', res, rej)); }
function loadTexture(url, enc) { return new Promise(res => new THREE.TextureLoader().load(url, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (enc) t.encoding = THREE.sRGBEncoding; res(t); }, undefined, () => res(null))); }
async function loadAssets(prog) {
  const keys = Object.keys(ASSETS); let i = 0;
  for (const k of keys) { try { MODELS[k] = await parseGLB(b64ToBuf(ASSETS[k])); } catch (e) { console.warn('model failed', k, e); } prog && prog(++i / (keys.length + 2), k); await new Promise(r => setTimeout(r, 0)); }
  TEXS.brick = await loadTexture('data:image/jpeg;base64,' + TEX_B64.brick, true); TEXS.grass = await loadTexture('data:image/jpeg;base64,' + TEX_B64.grass, true);
}
/* ---------- environment reflections (sky dome -> PMREM) ---------- */
function makeEnv() {
  try {
    const N = 64, mk = fn => { const c = document.createElement('canvas'); c.width = c.height = N; fn(c.getContext('2d')); return c; };
    const band = g => { const gr = g.createLinearGradient(0, 0, 0, N); gr.addColorStop(0, '#3f86e0'); gr.addColorStop(0.47, '#d6e8fb'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.53, '#8a8f96'); gr.addColorStop(1, '#3a3d44'); g.fillStyle = gr; g.fillRect(0, 0, N, N); };
    const sunny = mk(g => { band(g); const r = g.createRadialGradient(18, 14, 0, 18, 14, 16); r.addColorStop(0, 'rgba(255,248,215,1)'); r.addColorStop(1, 'rgba(255,248,215,0)'); g.fillStyle = r; g.fillRect(0, 0, N, N); });
    const side = mk(band), top = mk(g => { g.fillStyle = '#2f78d8'; g.fillRect(0, 0, N, N); }), bot = mk(g => { g.fillStyle = '#34373d'; g.fillRect(0, 0, N, N); });
    const tex = new THREE.CubeTexture([sunny, side, top, bot, sunny, side]); tex.encoding = THREE.sRGBEncoding; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true;
    scene.environment = tex;
  } catch (e) { console.warn('env failed', e); }
}
function regEnv(m) { if (m && m.isMeshStandardMaterial) ENVMATS.push(m); return m; }
function updateEnvInt() { const k = 0.25 + 0.85 * (1 - ENV.night); for (let i = 0; i < ENVMATS.length; i++) ENVMATS[i].envMapIntensity = k; }

/* ---------- realistic vehicles ---------- */
const VMODEL = { cab: 'concept', sport: 'concept', super: 'ferrari' }, WOUT = { concept: 1, ferrari: -1 };
function buildVehicleMesh(type, color, lod) {
  if (VT[type] && VT[type].iran) return buildIranCar(type, color);
  const mk = VMODEL[type];
  if (!mk || !MODELS[mk + '_hi'] || !MODELS[mk + '_wheel']) return buildVehicleMeshProc(type, color);
  const meta = CAR_META[mk], sp = VT[type], g = new THREE.Group(), wheels = [], head = [], tail = [];
  const body = MODELS[mk + (lod === 'lo' ? '_lo' : '_hi')].scene.clone(true), holder = new THREE.Group(); holder.add(body); if (meta.flip) holder.rotation.y = Math.PI;
  const wpos = meta.wheels.map(w => meta.flip ? [-w.p[0], w.p[1], -w.p[2]] : w.p), zc = (Math.max(...wpos.map(p => p[2])) + Math.min(...wpos.map(p => p[2]))) / 2;
  holder.position.z = -zc; g.add(holder);
  const cm = {}; body.traverse(o => {
    if (!o.isMesh) return; const n = o.material.name;
    if (n === 'paint' || n === 'head' || n === 'tail') { const m = cm[n] || (cm[n] = regEnv(o.material.clone())); if (n === 'paint') m.color.setHex(color); o.material = m; }
    else regEnv(o.material);
  });
  if (cm.head) head.push(cm.head); if (cm.tail) tail.push(cm.tail);
  const wsrc = MODELS[mk + '_wheel'].scene; wsrc.traverse(o => { if (o.isMesh) regEnv(o.material); });
  wpos.forEach(p => { const w = new THREE.Group(); w.position.set(p[0], p[1], p[2] - zc); w.rotation.order = 'YXZ'; const wm = wsrc.clone(true); wm.rotation.y = ((p[0] > 0 ? 1 : -1) === WOUT[mk]) ? 0 : Math.PI; w.add(wm); g.add(w); wheels.push({ g: w, front: p[2] > zc }); });
  if (sp.taxi) { const b = new THREE.Mesh(G.box, bas(0xffd21f)); b.scale.set(0.7, 0.22, 0.34); b.position.set(0, 1.27, -0.1); g.add(b); const bb = new THREE.Mesh(G.box, lam(0x0b0e14)); bb.scale.set(0.74, 0.06, 0.38); bb.position.set(0, 1.14, -0.1); g.add(bb); }
  g.userData.seat = null; return { group: g, wheels, head, tail };
}

/* ---------- realistic characters (animated GLB) ---------- */
const HCFG = { soldier: { rotY: 0, h: 1.8 }, cesium: { rotY: 0, h: 1.75 } }, HMEAS = {};
function buildHuman(o) {
  const kind = (o && o.kind) || 'soldier', mdl = MODELS[kind];
  if (!mdl) { const g = new THREE.Group(); return { g, mixer: null, mats: [], act: {}, w: { idle: 1, walk: 0, run: 0 }, spd: 0, kind }; }
  const root = THREE.SkeletonUtils.clone(mdl.scene), g = new THREE.Group(), cfg = HCFG[kind];
  if (!HMEAS[kind]) { const b = new THREE.Box3().setFromObject(root), hh = Math.max(0.1, b.max.y - b.min.y); HMEAS[kind] = { k: cfg.h / hh, y: -b.min.y }; }
  const me = HMEAS[kind]; root.scale.multiplyScalar(me.k); root.position.y = me.y * me.k; root.rotation.y = cfg.rotY; g.add(root);
  const mats = []; root.traverse(m => { if (m.isMesh) { m.frustumCulled = false; m.castShadow = !!(o && o.own); m.material = regEnv(m.material.clone()); if (!/visor/i.test(m.material.name)) mats.push(m.material); } });
  const mixer = new THREE.AnimationMixer(root), act = {}, clips = mdl.animations;
  const find = n => clips.find(c => c.name.toLowerCase() === n);
  if (kind === 'soldier') { ['idle', 'walk', 'run'].forEach(n => { const c = find(n); if (c) { act[n] = mixer.clipAction(c); act[n].play(); act[n].setEffectiveWeight(n === 'idle' ? 1 : 0); } }); }
  else if (clips[0]) { act.walk = mixer.clipAction(clips[0]); act.walk.play(); act.walk.setEffectiveWeight(1); act.walk.time = Math.random() * clips[0].duration; }
  const h = { g, root, mixer, mats, act, w: { idle: 1, walk: 0, run: 0 }, spd: 0, kind };
  if (o && o.tint) applyTint(h, o.tint);
  return h;
}
function applyTint(h, i) { h.mats.forEach(m => m.color.setHex(TINTS[i])); }
function animHuman(h, ph, spd, sit) { h.spd = spd; h.sit = sit; }
function updateHuman(h, dt) {
  if (!h.mixer) return; const s = h.spd, a = h.act, w = h.w, k = Math.min(1, dt * 9);
  if (h.kind === 'soldier') {
    const ti = s < 0.25 ? 1 : 0, tw = (s >= 0.25 && s < 2.6) ? 1 : 0, tr = s >= 2.6 ? 1 : 0;
    w.idle += (ti - w.idle) * k; w.walk += (tw - w.walk) * k; w.run += (tr - w.run) * k;
    if (a.idle) a.idle.setEffectiveWeight(w.idle); if (a.walk) { a.walk.setEffectiveWeight(w.walk); a.walk.setEffectiveTimeScale(clamp(s / 1.5, 0.6, 1.6)); } if (a.run) { a.run.setEffectiveWeight(w.run); a.run.setEffectiveTimeScale(clamp(s / 4.2, 0.8, 1.4)); }
  } else if (a.walk) { a.walk.setEffectiveTimeScale(s < 0.2 ? 0 : clamp(s / 1.3, 0.6, 2.2)); }
  h.mixer.update(dt);
}
function rebuildPlayer() {
  const par = P.hum && P.hum.g.parent, vis = P.hum ? P.hum.g.visible : true; if (P.hum && par) par.remove(P.hum.g);
  P.hum = buildHuman({ kind: CHARS[S.app.char || 0].kind, tint: S.app.tint || 0, own: true }); P.hum.g.visible = vis; (par || scene).add(P.hum.g);
}
