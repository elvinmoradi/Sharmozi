/* ================= BANANA CITY — world ================= */
let neonMat, poolMat, sunGlow, skyMat, skyDome, renderer, scene, camera, sunLight, hemi, fillLight, bldMat;
const pois = [];
const saleHouses = [];
const BLOCK_TYPES = [
  ['res', 'res', 'park', 'res', 'res', 'res', 'park', 'res'],
  ['res', 'boutique', 'res', 'hosp', 'res', 'police', 'res', 'res'],
  ['gas', 'res', 'down', 'down', 'down', 'bank', 'res', 'res'],
  ['res', 'jobs', 'down', 'down', 'down', 'down', 'shop', 'res'],
  ['res', 'garage', 'down', 'down', 'down', 'down', 'dealer', 'res'],
  ['res', 'res', 'down', 'down', 'down', 'down', 'res', 'res'],
  ['res', 'res', 'res', 'park', 'res', 'res', 'res', 'res'],
  ['res', 'res', 'park', 'res', 'res', 'res', 'res', 'res']
];
const SALE = [
  { bi: 0, bj: 0, price: 30000, name: 'خانه ویلایی ۱' },
  { bi: 7, bj: 2, price: 45000, name: 'خانه ویلایی ۲' },
  { bi: 0, bj: 4, price: 62000, name: 'ویلای شهری ۳' },
  { bi: 7, bj: 6, price: 95000, name: 'ویلای لوکس ۴' }
];
const POI_INFO = {
  bank: ['بانک', '🏦', '#3b82f6'], hosp: ['بیمارستان', '🏥', '#ef4444'], shop: ['فروشگاه', '🛒', '#22c55e'],
  boutique: ['پوشاک', '👕', '#ec4899'], police: ['کلانتری', '🚓', '#3b82f6'], garage: ['گاراژ', '🔧', '#9ca3af'], dealer: ['نمایشگاه خودرو', '🚗', '#f59e0b'],
  gas: ['پمپ‌بنزین', '⛽', '#f97316'], jobs: ['مرکز کار', '💼', '#ffd21f'], house: ['خانه برای فروش', '🏠', '#a78bfa'], seller: ['صندوق فروشگاه', '🧾', '#22c55e']
};
const bpos = (i, j) => ({ cx: (i - (NB - 1) / 2) * CELL, cz: (j - (NB - 1) / 2) * CELL });
const lights = { lx: null, lz: null, t: 0 };
let lampMat, treeInst = [], cloudGroups = [], sunMesh, moonMesh, rainLines, mapLayer;
const wallCols = [0xffe2a8, 0xf5b98a, 0xa9d4f5, 0xf7b5b5, 0xb4e3b4, 0xfff3d6, 0xd9bdf5, 0xffd21f];
const towerCols = [0x6f9bd1, 0x86b4d8, 0x9fb6c8, 0xd2b98a, 0x7fb0b8, 0xb7c7dc, 0x5f84b0, 0xe3a85a];

function addPoi(id, type, x, z, r, label) {
  const info = POI_INFO[type];
  const p = { id, type, x, z, r, label: label || info[0], icon: info[1], color: info[2] };
  pois.push(p);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 28), new THREE.MeshBasicMaterial({ color: 0xffd21f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.3, z); scene.add(ring); p.ring = ring;
  return p;
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !IS_TOUCH, powerPreference: 'high-performance' });
  renderer.shadowMap.type = THREE.PCFShadowMap; renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, 1, 0.5, 2200);
  scene.fog = new THREE.Fog(0x87c8f0, 80, 420);
  skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(0x2a6fd6) }, bot: { value: new THREE.Color(0x9fd8ff) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, pow(clamp(h,0.0,1.0),0.55)), 1.0); }' });
  skyDome = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 14), skyMat); skyDome.renderOrder = -10; skyDome.frustumCulled = false; scene.add(skyDome);
  hemi = new THREE.HemisphereLight(0xbfdcff, 0x445533, 0.7); scene.add(hemi);
  sunLight = new THREE.DirectionalLight(0xfff2d0, 0.9); scene.add(sunLight); scene.add(sunLight.target);
  fillLight = new THREE.DirectionalLight(0x6f8fff, 0); fillLight.position.set(-60, 120, 40); scene.add(fillLight);
  const sc = sunLight.shadow.camera; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 10; sc.far = 400;
  sunLight.shadow.bias = -0.0006;
  window.addEventListener('resize', onResize); onResize();
}
function onResize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
function applyQuality() {
  const q = PRESETS[S.set.quality] || PRESETS.med;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.pr)); onResize();
  const sh = q.shadow > 0;
  if (renderer.shadowMap.enabled !== sh) { renderer.shadowMap.enabled = sh; scene.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); } }); }
  sunLight.castShadow = sh;
  if (sh) { sunLight.shadow.mapSize.set(q.shadow, q.shadow); if (sunLight.shadow.map) { sunLight.shadow.map.dispose(); sunLight.shadow.map = null; } }
  if (window.__applyTraffic) window.__applyTraffic();
}

function makeWindowTextures() {
  const SZ = 512, mk = () => { const c = document.createElement('canvas'); c.width = c.height = SZ; return c; };
  const c = mk(), e = mk(), g = c.getContext('2d'), ge = e.getContext('2d');
  g.fillStyle = '#f2f4f7'; g.fillRect(0, 0, SZ, SZ); ge.fillStyle = '#000'; ge.fillRect(0, 0, SZ, SZ);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const x = q * 128 + 22, y = r * 128 + 26, w = 84, h = 72;
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#9fd0ff'); gr.addColorStop(1, '#3d6f9f'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = '#ffffff66'; g.fillRect(x + 6, y + 6, 22, 8); g.fillStyle = '#d8dde4'; g.fillRect(x - 6, y + h, w + 12, 6);
    if (Math.random() < 0.55) { ge.fillStyle = pick(['#ffd980', '#ffe9b0', '#ffcf66', '#cfe8ff']); ge.fillRect(x, y, w, h); }
  }
  const t1 = new THREE.CanvasTexture(c), t2 = new THREE.CanvasTexture(e);
  [t1, t2].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; });
  return [t1, t2];
}

/* ---------- build whole city ---------- */
async function buildCity(prog) {
  const rng = seeded(20260), rr = (a, b) => a + rng() * (b - a), tick = async (p, t) => { prog && prog(p, t); await new Promise(r => setTimeout(r, 0)); };
  const [wt, et] = makeWindowTextures();
  bldMat = new THREE.MeshStandardMaterial({ map: wt, emissiveMap: et, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, metalness: 0.4, roughness: 0.34 }); regEnv(bldMat);
  const M = new Merger(), P = new Merger(), N = new Merger(), H = new Merger(), Gm = new Merger(), trees = [], lampPos = [];
  // ground
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(EDGE * 2 + 80, EDGE * 2 + 80), lam(0x3b3f4a)); asphalt.rotation.x = -Math.PI / 2; asphalt.receiveShadow = true; scene.add(asphalt);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), lam(0x2f5d3a)); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.5; scene.add(grass);
  await tick(0.05, 'جاده‌ها...');
  // road markings
  for (let k = 0; k <= NB; k++) {
    const c = -EDGE + k * CELL;
    for (let a = -290; a < 290; a += 12) {
      const dx = Math.abs((((a + EDGE) % CELL) + CELL + 50) % CELL - 50); if (dx < 14) continue;
      P.box(a, 0.03, c, 6, 0.02, 0.28, 0xffd21f); P.box(c, 0.03, a, 0.28, 0.02, 6, 0xffd21f);
    }
    for (let m = 0; m <= NB; m++) {
      const ix = -EDGE + m * CELL, iz = c;
      for (let q = 0; q < 6; q++) {
        const o = -8 + q * 3.2;
        P.box(ix - 14, 0.035, iz + o, 3, 0.02, 1.5, 0xf2f2f2); P.box(ix + 14, 0.035, iz + o, 3, 0.02, 1.5, 0xf2f2f2);
        P.box(ix + o, 0.035, iz - 14, 1.5, 0.02, 3, 0xf2f2f2); P.box(ix + o, 0.035, iz + 14, 1.5, 0.02, 3, 0xf2f2f2);
      }
    }
  }
  await tick(0.15, 'بلوک‌ها...');
  let n = 0;
  for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) {
    const { cx, cz } = bpos(i, j), type = BLOCK_TYPES[j][i];
    P.box(cx, 0.075, cz, BLK, 0.15, BLK, 0xb4bac2);
    [[0, -40.4, 80, 0.3], [0, 40.4, 80, 0.3], [-40.4, 0, 0.3, 80], [40.4, 0, 0.3, 80]].forEach(o => P.box(cx + o[0], 0.17, cz + o[1], o[2], 0.04, o[3], 0xf2f2f2));
    if (type !== 'res' && type !== 'park') [[-30, 38], [30, 38], [-30, -38], [30, -38]].forEach(o => trees.push([cx + o[0], cz + o[1], 0.9]));
    // street lamps
    [[-20, -39], [20, -39], [-20, 39], [20, 39], [-39, -20], [-39, 20], [39, -20], [39, 20]].forEach(o => lampPos.push([cx + o[0], cz + o[1]]));
    if (type === 'down') buildDown(cx, cz);
    else if (type === 'res') buildRes(i, j, cx, cz);
    else if (type === 'park') buildPark(cx, cz);
    else buildSpecial(type, cx, cz);
    if (++n % 6 === 0) await tick(0.15 + 0.55 * n / 36, 'ساختمان‌ها...');
  }
  /* --- downtown --- */
  function buildDown(cx, cz) {
    const dist = Math.hypot(cx, cz);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const lx = cx + (a ? 20 : -20), lz = cz + (b ? 20 : -20);
      const w = rr(21, 26), d = rr(21, 26); let h = lerp(135, 48, clamp(dist / 200, 0, 1)) + rr(-12, 18); if (rng() < 0.25) h = rr(22, 38);
      const col = towerCols[Math.floor(rng() * towerCols.length)];
      P.box(lx, 2.1, lz, w + 3, 4.2, d + 3, 0x1d2129);
      let tw = w, td = d;
      if (h > 55) { const h1 = h * 0.62, col2 = towerCols[Math.floor(rng() * towerCols.length)]; M.box(lx, h1 / 2, lz, w, h1, d, col, 0, true); tw = w * 0.74; td = d * 0.74; M.box(lx, h1 + (h - h1) / 2, lz, tw, h - h1, td, col2, 0, true); P.box(lx, h1 + 0.4, lz, w + 0.8, 0.8, d + 0.8, 0x2a2f3a); }
      else M.box(lx, h / 2, lz, w, h, d, col, 0, true);
      P.box(lx, h + 0.5, lz, tw + 0.6, 1, td + 0.6, 0x14171c);
      N.box(lx, 4.6, lz + d / 2 + 0.08, w * 0.9, 0.6, 0.2, 0xffd21f);
      { const nc = [0xff2d95, 0x22e0ff, 0xffd21f, 0x3b82ff][Math.floor(rng() * 4)], y = h + 1.15; N.box(lx, y, lz + td / 2 + 0.3, tw + 0.8, 0.35, 0.35, nc); N.box(lx, y, lz - td / 2 - 0.3, tw + 0.8, 0.35, 0.35, nc); N.box(lx + tw / 2 + 0.3, y, lz, 0.35, 0.35, td + 0.8, nc); N.box(lx - tw / 2 - 0.3, y, lz, 0.35, 0.35, td + 0.8, nc); }
      if (h > 60) { P.box(lx, h + 5, lz, 0.5, 9, 0.5, 0xb0b6bf); P.box(lx, h + 9.6, lz, 1.2, 0.6, 1.2, 0xe5242b); } else { P.box(lx - w * 0.2, h + 1.6, lz, 3, 1.6, 3, 0x8d949e); P.box(lx + w * 0.2, h + 2, lz + 2, 2.4, 2.4, 2.4, 0x6d7480); }
      N.box(lx, Math.min(h * 0.45, 26), lz + d / 2 + 0.08, w * 0.9, 0.5, 0.2, 0x3b82ff);
      if (rng() < 0.35) { const bb = makeSign(pick(['BANANA CITY', 'RUSH', 'MEGA MALL', 'CAFE 24', 'HOTEL']), '', 12, 5, pick(['#1b64f2', '#0b0e14', '#ffd21f']), pick(['#ffd21f', '#fff', '#0b0e14'])); bb.position.set(lx, Math.min(h * 0.55, 30), lz + d / 2 + 0.4); scene.add(bb); }
      addCol(lx - (w + 3) / 2, lx + (w + 3) / 2, lz - (d + 3) / 2, lz + (d + 3) / 2);
    }
  }
  /* --- residential --- */
  function buildRes(bi, bj, cx, cz) {
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const lx = cx + (a ? 20 : -20), lz = cz + (b ? 20 : -20), sz = b ? 1 : -1;
      Gm.box(lx, 0.17, lz, 36, 0.04, 36, 0xd6ffd0, 0, 6);
      const w = rr(13, 17), h = rr(6.5, 8.5), colr = wallCols[Math.floor(rng() * wallCols.length)];
      H.box(lx, h / 2 + 0.19, lz, w, h, w, pick([0xffffff, 0xf3dcc4, 0xdce8f5, 0xf5e4e4, 0xe6f2e0, 0xffe9b0]), 0, 3);
      P.geo(G.cone4, lx, h + 0.19 + 1.8, lz, (w + 1.2) / Math.SQRT2, 3.6, (w + 1.2) / Math.SQRT2, Math.PI / 4, pick([0x8b3a2e, 0x4a4f5c, 0x6b4a2e, 0x2f4a6b]));
      P.box(lx + w * 0.25, h + 3.6, lz, 1.4, 3, 1.4, 0x6d5a4a);
      P.box(lx + 2.5, 1.5 + 0.19, lz + sz * (w / 2 + 0.06), 1.6, 2.6, 0.2, 0x4a2f1b);
      [[-3.5, 2], [3.5, 2], [-3.5, 5.2], [3.5, 5.2], [0, 5.2]].forEach(o => { if (o[0] === 0 && o[1] === 2) return; P.box(lx + o[0] - (o[1] < 3 ? 2.5 * 0 : 0), o[1] + 0.19, lz + sz * (w / 2 + 0.06), 2.2, 1.8, 0.2, 0x34506e); P.box(lx + o[0], o[1] + 0.19, lz - sz * (w / 2 + 0.06), 2.2, 1.8, 0.2, 0x34506e); });
      const L = 18 - w / 2; P.box(lx + 2.5, 0.2, lz + sz * (w / 2 + L / 2), 1.8, 0.03, L, 0xcfcfcf);
      addCol(lx - w / 2, lx + w / 2, lz - w / 2, lz + w / 2);
      trees.push([lx - (a ? 14 : -14) * 1, lz - sz * 14 * (rng() < 0.5 ? 1 : -1), rr(0.9, 1.4)]);
      const k = SALE.findIndex(s => s.bi === bi && s.bj === bj);
      if (k >= 0 && a === 1 && b === 1) {
        const px = lx + 2.5, pz = lz + sz * (w / 2 + 4.5), sg = makeSign('FOR SALE', 'برای فروش', 3.4, 1.7, '#ffd21f', '#0b0e14');
        sg.position.set(px + 2.8, 2.3, pz); scene.add(sg); P.box(px + 2.8, 1.1, pz - 0.1, 0.2, 2.2, 0.2, 0x333333);
        saleHouses[k] = { k, x: px, z: pz, sign: sg, doorX: lx + 2.5, doorZ: lz + sz * (w / 2 + 1) };
        const poi = addPoi('house' + k, 'house', px, pz, 4.5, SALE[k].name); poi.sale = k;
      }
    }
  }
  /* --- park --- */
  function buildPark(cx, cz) {
    Gm.box(cx, 0.17, cz, 74, 0.04, 74, 0xc9ffc0, 0, 6);
    P.box(cx, 0.2, cz, 4, 0.03, 74, 0xd9cfae); P.box(cx, 0.2, cz, 74, 0.03, 4, 0xd9cfae);
    P.geo(G.cyl16, cx + 18, 0.21, cz + 18, 12, 0.03, 12, 0, 0x3a8dde);
    for (let k = 0; k < 7; k++) { const x = cx + rr(-30, 30), z = cz + rr(-30, 30); if (Math.abs(x - cx) < 4 || Math.abs(z - cz) < 4) continue; P.box(x, 0.6, z, 2.2, 0.4, 0.7, 0x6b4a2e); P.box(x, 1.0, z - 0.3, 2.2, 0.6, 0.12, 0x6b4a2e); }
    P.box(cx - 20, 1.2, cz - 22, 6, 0.4, 0.4, 0xe5242b); P.box(cx - 22.5, 1.2, cz - 22, 0.4, 2.4, 0.4, 0xe5242b); P.box(cx - 17.5, 1.2, cz - 22, 0.4, 2.4, 0.4, 0xe5242b);
    P.box(cx - 24, 1.0, cz + 20, 5, 0.5, 5, 0xffd21f); P.box(cx - 24, 2.0, cz + 20, 0.4, 2, 0.4, 0x1e5bd6);
    for (let k = 0; k < 26; k++) { const x = cx + rr(-34, 34), z = cz + rr(-34, 34); if (Math.abs(x - cx) < 5 || Math.abs(z - cz) < 5 || Math.hypot(x - cx - 18, z - cz - 18) < 14) continue; trees.push([x, z, rr(1.1, 1.9)]); }
  }
  /* --- special buildings --- */
  function buildSpecial(type, cx, cz) {
    const info = POI_INFO[type];
    const front = (d, y, l1, l2, w, h, bg, fg) => { const s = makeSign(l1, l2, w, h, bg, fg); s.position.set(cx, y, cz + d / 2 + 0.35); scene.add(s); };
    if (type === 'hosp') {
      M.box(cx, 13, cz, 56, 26, 36, 0xf4f6f8, 0, true); P.box(cx, 26.5, cz, 58, 1, 38, 0xcfd6dd);
      P.box(cx, 19, cz + 18.3, 10, 3, 0.5, 0xe5242b); P.box(cx, 19, cz + 18.3, 3, 10, 0.5, 0xe5242b);
      P.box(cx, 2.6, cz + 18.3, 9, 5.2, 0.5, 0x1b2735); P.box(cx, 6.2, cz + 21, 13, 0.5, 6, 0x2b6cf0);
      P.geo(G.cyl16, cx + 14, 27.2, cz, 8, 0.2, 8, 0, 0xffd21f);
      front(36, 11, 'HOSPITAL', 'بیمارستان', 20, 4.2, '#fff', '#d11a22'); addCol(cx - 28, cx + 28, cz - 18, cz + 18);
      addPoi('hosp', type, cx, cz + 25, 6);
    } else if (type === 'police') {
      M.box(cx, 8, cz, 46, 16, 30, 0xe8eef7, 0, true); P.box(cx, 16.4, cz, 48, 0.8, 32, 0x1b3a8a); P.box(cx, 5, cz + 15.2, 46.4, 1.4, 0.4, 0x1b64f2);
      P.box(cx, 2.6, cz + 15.3, 8, 5.2, 0.5, 0x15233f); P.box(cx - 8, 17.3, cz, 3, 1, 1.2, 0xe5242b); P.box(cx + 8, 17.3, cz, 3, 1, 1.2, 0x1b64f2);
      front(30, 12, 'POLICE', 'کلانتری', 20, 4.2, '#0b2a6b', '#ffffff'); addCol(cx - 23, cx + 23, cz - 15, cz + 15);
      addPoi('police', type, cx, cz + 21, 6);
    } else if (type === 'bank') {
      M.box(cx, 9, cz, 44, 18, 34, 0xe6dfcf, 0, true); P.box(cx, 18.5, cz, 46, 1, 36, 0x9a8f78);
      for (let k = 0; k < 6; k++) P.geo(G.cyl, cx - 18 + k * 7.2, 7, cz + 19.5, 1, 14, 1, 0, 0xf2efe6);
      P.box(cx, 0.4, cz + 21, 40, 0.8, 5, 0xcfc8b8); P.box(cx, 15.2, cz + 19.5, 44, 1.2, 3, 0xcfc8b8);
      P.box(cx + 16, 1.2, cz + 24, 1.4, 2.4, 1.0, 0x1e5bd6); P.box(cx + 16, 1.7, cz + 24.55, 1.0, 0.8, 0.1, 0xffd21f);
      front(40, 12.5, 'BANK', 'بانک', 16, 3.6, '#0b0e14', '#ffd21f'); addCol(cx - 22, cx + 22, cz - 17, cz + 17);
      addPoi('bank', type, cx, cz + 26, 6);
    } else if (type === 'jobs') {
      M.box(cx, 11, cz, 40, 22, 30, 0x1e5bd6, 0, true); P.box(cx, 4.5, cz + 15.2, 40.4, 1.2, 0.4, 0xffd21f); P.box(cx, 2.6, cz + 15.3, 8, 5.2, 0.5, 0x0b0e14);
      P.box(cx, 22.5, cz, 41, 1, 31, 0x0b0e14); front(30, 17, 'JOB CENTER', 'مرکز کار', 24, 5, '#0b0e14', '#ffd21f'); addCol(cx - 20, cx + 20, cz - 15, cz + 15);
      addPoi('jobs', type, cx, cz + 21, 6);
    } else if (type === 'shop' || type === 'boutique') {
      const bo = type === 'boutique', w = bo ? 36 : 40, d = bo ? 26 : 28, h = bo ? 10 : 9;
      P.box(cx, h / 2, cz, w, h, d, bo ? 0x15171c : 0xfff0b3); P.box(cx, h + 0.3, cz, w + 1, 0.6, d + 1, bo ? 0xffd21f : 0x1e5bd6);
      P.box(cx, 3.4, cz + d / 2 + 0.1, w * 0.75, 3.6, 0.3, 0x2b4b73);
      for (let k = 0; k < 10; k++) P.box(cx - w / 2 + 2 + k * (w - 4) / 9, 6.4, cz + d / 2 + 1.6, (w - 4) / 9, 0.4, 3.6, k % 2 ? 0xffd21f : (bo ? 0x111111 : 0x1e5bd6));
      front(d, h - 1.6, bo ? 'BOUTIQUE' : 'MARKET', bo ? 'پوشاک بانانا' : 'فروشگاه', 16, 3, '#0b0e14', '#ffd21f'); addCol(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2);
      addPoi(type, type, cx, cz + d / 2 + 5, 6);
      if (!bo) { P.box(cx + 16, 1.0, cz + d / 2 + 5, 3, 2, 1.2, 0x333b47); addPoi('seller', 'seller', cx + 15, cz + d / 2 + 8, 4, 'صندوق فروشگاه'); }
    } else if (type === 'garage') {
      P.box(cx, 5.5, cz, 44, 11, 30, 0x707887); P.box(cx, 11.3, cz, 45, 0.6, 31, 0x3a4150);
      for (let k = 0; k < 3; k++) { P.box(cx - 13 + k * 13, 3.6, cz + 15.2, 10, 7.2, 0.4, 0x23272f); for (let s = 0; s < 5; s++) P.box(cx - 13 + k * 13, 1 + s * 1.4, cz + 15.45, 10, 0.12, 0.1, 0x9aa0a8); }
      front(30, 9.6, 'GARAGE', 'گاراژ', 14, 2.6, '#0b0e14', '#ffd21f'); addCol(cx - 22, cx + 22, cz - 15, cz + 15);
      addPoi('garage', type, cx, cz + 21, 7);
    } else if (type === 'dealer') {
      P.box(cx, 5, cz - 2, 48, 10, 26, 0xcfe8ff); P.box(cx, 10.3, cz - 2, 49, 0.6, 27, 0x1e5bd6); P.box(cx, 4, cz + 11.2, 42, 5, 0.3, 0x2b5a8f);
      P.box(cx, 0.3, cz + 22, 44, 0.6, 9, 0x2a2f3a);
      front(26, 8.6, 'CAR SHOW', 'نمایشگاه خودرو', 18, 3, '#0b0e14', '#ffd21f'); addCol(cx - 24, cx + 24, cz - 15, cz + 11);
      addPoi('dealer', type, cx, cz + 31, 7);
      window.__dealerSpots = [[cx - 14, cz + 22, 'sport'], [cx, cz + 22, 'super'], [cx + 14, cz + 22, 'suv']];
    } else if (type === 'gas') {
      P.box(cx, 2.6, cz - 20, 16, 5.2, 10, 0xf2f2f2); P.box(cx, 5.4, cz - 20, 17, 0.5, 11, 0xe5242b); P.box(cx, 2.4, cz - 14.9, 12, 2.4, 0.3, 0x2b5a8f);
      P.box(cx, 6.6, cz + 10, 32, 0.8, 18, 0xffd21f); P.box(cx, 6.1, cz + 10, 32.2, 0.4, 18.2, 0x0b0e14);
      [[-14, 3], [14, 3], [-14, 17], [14, 17]].forEach(o => P.box(cx + o[0], 3.2, cz + o[1], 0.7, 6.4, 0.7, 0xdddddd));
      [-8, 8].forEach(x => { P.box(cx + x, 1.1, cz + 10, 1.2, 2.2, 0.8, 0xe5242b); P.box(cx + x, 1.6, cz + 10.45, 0.8, 0.7, 0.1, 0x222222); addCol(cx + x - 0.7, cx + x + 0.7, cz + 9.5, cz + 10.5); });
      front(0, 8.2, 'GAS', 'پمپ‌بنزین', 12, 2.2, '#0b0e14', '#ffd21f'); const gs = scene.children[scene.children.length - 1]; gs.position.set(cx, 8.2, cz + 19.4);
      addCol(cx - 8, cx + 8, cz - 25, cz - 15); [[-14, 3], [14, 3], [-14, 17], [14, 17]].forEach(o => addCol(cx + o[0] - 0.4, cx + o[0] + 0.4, cz + o[1] - 0.4, cz + o[1] + 0.4));
      addPoi('gas', type, cx, cz + 10, 12);
    }
  }
  await tick(0.75, 'نورپردازی...');
  // lanterns (instanced)
  const dummy = new THREE.Object3D();
  const poles = new THREE.InstancedMesh(G.cyl, lam(0x3a3f4a), lampPos.length), heads = new THREE.InstancedMesh(G.box, new THREE.MeshBasicMaterial({ color: 0x666666 }), lampPos.length);
  lampMat = heads.material;
  lampPos.forEach((p, k) => {
    dummy.position.set(p[0], 3.8, p[1]); dummy.scale.set(0.12, 7.6, 0.12); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); poles.setMatrixAt(k, dummy.matrix);
    dummy.position.set(p[0], 7.7, p[1]); dummy.scale.set(0.9, 0.3, 0.6); dummy.updateMatrix(); heads.setMatrixAt(k, dummy.matrix);
  });
  scene.add(poles); scene.add(heads);
  poolMat = new THREE.MeshBasicMaterial({ color: 0xffc870, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const pools = new THREE.InstancedMesh(G.circle, poolMat, lampPos.length); lampPos.forEach((p, k) => { dummy.position.set(p[0], 0.2, p[1]); dummy.scale.set(7, 1, 7); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); pools.setMatrixAt(k, dummy.matrix); }); pools.frustumCulled = false; scene.add(pools);
  // traffic light poles + heads
  const inter = []; for (let a = 0; a <= NB; a++) for (let b = 0; b <= NB; b++) inter.push([-EDGE + a * CELL, -EDGE + b * CELL]);
  const tp = new THREE.InstancedMesh(G.cyl, lam(0x222222), inter.length * 4);
  lights.mx = new THREE.MeshBasicMaterial({ color: 0x22cc44 }); lights.mz = new THREE.MeshBasicMaterial({ color: 0xcc2222 });
  const hx = new THREE.InstancedMesh(G.box, lights.mx, inter.length * 4), hz = new THREE.InstancedMesh(G.box, lights.mz, inter.length * 4);
  let q = 0; inter.forEach(p => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
    const x = p[0] + c[0] * 11.5, z = p[1] + c[1] * 11.5;
    dummy.rotation.set(0, 0, 0); dummy.position.set(x, 3.2, z); dummy.scale.set(0.13, 6.4, 0.13); dummy.updateMatrix(); tp.setMatrixAt(q, dummy.matrix);
    dummy.position.set(x - c[0] * 0.0, 6.4, z); dummy.scale.set(0.9, 0.5, 0.5); dummy.updateMatrix(); hx.setMatrixAt(q, dummy.matrix);
    dummy.position.set(x, 5.6, z); dummy.scale.set(0.5, 0.5, 0.9); dummy.updateMatrix(); hz.setMatrixAt(q, dummy.matrix); q++;
  }));
  scene.add(tp); scene.add(hx); scene.add(hz);
  // hills
  for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2, r = rr(780, 1050); P.geo(G.cone7, Math.cos(a) * r, 40, Math.sin(a) * r, rr(110, 230), rr(80, 170), rr(110, 230), 0, pick([0x3b5b46, 0x34504a, 0x41624d])); }
  const city = M.mesh(bldMat); city.castShadow = true; city.receiveShadow = true; scene.add(city);
  neonMat = new THREE.MeshBasicMaterial({ vertexColors: true }); scene.add(N.mesh(neonMat));
  { const bm = new THREE.MeshStandardMaterial({ map: TEXS.brick, vertexColors: true, roughness: 0.92, metalness: 0 }), gm = new THREE.MeshLambertMaterial({ map: TEXS.grass, vertexColors: true });
    const hb = H.mesh(bm); hb.castShadow = true; hb.receiveShadow = true; scene.add(hb); regEnv(bm); const gr = Gm.mesh(gm); gr.receiveShadow = true; scene.add(gr); }
  const plain = P.mesh(new THREE.MeshLambertMaterial({ vertexColors: true })); plain.castShadow = true; plain.receiveShadow = true; scene.add(plain);
  await tick(0.85, 'درخت‌ها...');
  // trees
  const tcount = trees.length;
  const trunk = new THREE.InstancedMesh(G.cyl, lam(0x5a3d26), tcount), crown = new THREE.InstancedMesh(G.sph, new THREE.MeshLambertMaterial({ color: 0xffffff }), tcount);
  trees.forEach((t, k) => {
    const s = t[2]; dummy.rotation.set(0, 0, 0); dummy.position.set(t[0], 1.1 * s + 0.2, t[1]); dummy.scale.set(0.22 * s, 2.2 * s, 0.22 * s); dummy.updateMatrix(); trunk.setMatrixAt(k, dummy.matrix);
    dummy.position.set(t[0], 3.4 * s + 0.2, t[1]); dummy.scale.set(1.7 * s, 1.9 * s, 1.7 * s); dummy.updateMatrix(); crown.setMatrixAt(k, dummy.matrix);
    crown.setColorAt(k, new THREE.Color().setHSL(0.27 + rr(-0.04, 0.05), 0.5, rr(0.28, 0.4)));
  });
  scene.add(trunk); scene.add(crown);
  // dealership showcase cars
  if (window.__dealerSpots) window.__dealerSpots.forEach(s => { const b = buildVehicleMesh(s[2], s[2] === 'super' ? 0xffd21f : (s[2] === 'sport' ? 0x1e5bd6 : 0x111111)); b.group.position.set(s[0], 0.6, s[1]); b.group.rotation.y = rr(-0.3, 0.3); scene.add(b.group); });
  // sky objects
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false })); scene.add(sunMesh);
  sunGlow = new THREE.Mesh(new THREE.SphereGeometry(80, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.25, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(sunGlow);
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(18, 14, 10), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false })); scene.add(moonMesh);
  for (let k = 0; k < 14; k++) {
    const g = new THREE.Group(), cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false, depthWrite: false });
    for (let s = 0; s < 4; s++) { const m = new THREE.Mesh(G.sph, cm); m.scale.set(rr(25, 45), rr(9, 14), rr(18, 30)); m.position.set(s * 28 - 40, rr(-3, 3), rr(-8, 8)); g.add(m); }
    g.position.set(rr(-700, 700), rr(170, 230), rr(-700, 700)); g.userData.mat = cm; g.userData.sp = rr(2, 6); scene.add(g); cloudGroups.push(g);
  }
  // rain
  const rn = 900, rp = new Float32Array(rn * 6);
  for (let k = 0; k < rn; k++) { const x = rand(-40, 40), y = rand(0, 40), z = rand(-40, 40); rp.set([x, y, z, x - 0.15, y - 1.2, z - 0.1], k * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  rainLines = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xaecbe6, transparent: true, opacity: 0.55, fog: false })); rainLines.frustumCulled = false; rainLines.visible = false; scene.add(rainLines);
  await tick(0.95, 'نقشه...');
  buildMapLayer();
  prog && prog(1, 'آماده!');
}

/* ---------- map layer (pre-rendered) ---------- */
const MAPK = 1.6;
function buildMapLayer() {
  const SZ = Math.round((EDGE * 2 + 60) * MAPK); mapLayer = document.createElement('canvas'); mapLayer.width = mapLayer.height = SZ;
  const g = mapLayer.getContext('2d'), T = v => (v + EDGE + 30) * MAPK;
  g.fillStyle = '#0f1724'; g.fillRect(0, 0, SZ, SZ);
  g.fillStyle = '#2a3447'; for (let k = 0; k <= NB; k++) { const c = -EDGE + k * CELL, LL = (EDGE * 2 + 20) * MAPK; g.fillRect(T(-EDGE - 10), T(c - 10), LL, 20 * MAPK); g.fillRect(T(c - 10), T(-EDGE - 10), 20 * MAPK, LL); }
  const col = { res: '#1f3d2c', park: '#1f6b3a', down: '#3b4a68', hosp: '#5a2b33', bank: '#2b4a7a', jobs: '#6b5a14', police: '#1e3a8a', shop: '#25603a', boutique: '#5a2b55', garage: '#444b56', dealer: '#6b4a14', gas: '#6b3a14' };
  for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) { const { cx, cz } = bpos(i, j); g.fillStyle = col[BLOCK_TYPES[j][i]]; g.fillRect(T(cx - 40), T(cz - 40), 80 * MAPK, 80 * MAPK); }
  g.font = (14 * MAPK / 1.6 * 1.3) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  pois.forEach(p => { if (p.type === 'seller') return; g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(T(p.x), T(p.z), 9 * MAPK / 1.3, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillText(p.icon, T(p.x), T(p.z) + 1); });
}
const mapT = v => (v + EDGE + 30) * MAPK;

/* ---------- traffic signal clock ---------- */
function lightState(axis) {
  const t = lights.t % 32;
  if (axis === 0) return t < 12 ? 'g' : (t < 14 ? 'y' : 'r');
  return (t >= 16 && t < 28) ? 'g' : ((t >= 28 && t < 30) ? 'y' : 'r');
}
const LC = { g: 0x22cc44, y: 0xffc400, r: 0xdd2222 };
function updateLights(dt) {
  lights.t += dt; if (!lights.mx) return;
  lights.mx.color.setHex(LC[lightState(0)]); lights.mz.color.setHex(LC[lightState(1)]);
}

/* ---------- environment: sky / sun / weather ---------- */
const ENV = { lt: 10, flash: 0, night: 0, cloud: 0.2, rain: 0, fog: 1, dark: 0, wt: 'clear', wTimer: 240 };
const WTARGET = { clear: { cloud: 0.2, rain: 0, fog: 1, dark: 0 }, cloudy: { cloud: 0.85, rain: 0, fog: 0.8, dark: 0.18 }, rain: { cloud: 1, rain: 1, fog: 0.5, dark: 0.38 }, fog: { cloud: 0.5, rain: 0, fog: 0.2, dark: 0.12 } };
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function updateEnv(dt, focus) {
  S.time += dt / 45; if (S.time >= 24) { S.time -= 24; S.day++; if (window.__newDay) window.__newDay(); }
  if (S.set.weatherAuto) { ENV.wTimer -= dt; if (ENV.wTimer <= 0) { ENV.wTimer = rand(180, 360); S.weather = pick(['clear', 'clear', 'cloudy', 'rain', 'fog']); } }
  const wt = WTARGET[S.weather] || WTARGET.clear, k = Math.min(1, dt * 0.4);
  ENV.cloud = lerp(ENV.cloud, wt.cloud, k); ENV.rain = lerp(ENV.rain, wt.rain, k); ENV.fog = lerp(ENV.fog, wt.fog, k); ENV.dark = lerp(ENV.dark, wt.dark, k);
  const a = ((S.time - 6) / 12) * Math.PI, sa = Math.sin(a), ca = Math.cos(a);
  const day = smooth(-0.05, 0.35, sa), dusk = Math.max(0, 1 - Math.abs(sa) / 0.3) * (sa > -0.3 ? 1 : 0);
  ENV.night = 1 - day;
  _c1.setRGB(0.02, 0.04, 0.1).lerp(_c2.setRGB(0.62, 0.84, 1.0), day).lerp(_c2.setRGB(1, 0.55, 0.3), dusk * 0.5);
  _c1.lerp(_c2.setRGB(0.45, 0.5, 0.55).multiplyScalar(0.2 + 0.8 * day), ENV.dark * 1.4);
  scene.background = _c1; scene.fog.color.copy(_c1).convertSRGBToLinear();
  skyDome.position.copy(camera.position); skyMat.uniforms.bot.value.copy(_c1);
  skyMat.uniforms.top.value.setRGB(0.1, 0.38, 0.85).lerp(_c2.setRGB(0.0, 0.01, 0.05), 1 - day).lerp(_c2.setRGB(0.4, 0.45, 0.5).multiplyScalar(0.3 + 0.7 * day), clamp(ENV.dark * 1.6, 0, 1));
  const q = PRESETS[S.set.quality] || PRESETS.med;
  scene.fog.near = q.fogN * ENV.fog; scene.fog.far = q.fogF * (0.35 + 0.65 * ENV.fog);
  hemi.intensity = 0.48 + 0.7 * day * (1 - ENV.dark * 0.4); hemi.color.setRGB(0.75, 0.86, 1).lerp(_c2.setRGB(0.16, 0.22, 0.4), 1 - day);
  sunLight.intensity = day * (1 - ENV.dark * 0.7) * 1.15; sunLight.color.setRGB(1, 0.95, 0.82).lerp(_c2.setRGB(1, 0.62, 0.35), dusk);
  fillLight.intensity = (1 - day) * 0.3;
  if (S.weather === 'rain' && ENV.rain > 0.6) { ENV.lt -= dt; if (ENV.lt <= 0) { ENV.lt = rand(8, 20); ENV.flash = 1; setTimeout(() => tone(55, 1.4, 'sawtooth', 0.12, 28), rand(300, 1800)); } }
  ENV.flash = Math.max(0, ENV.flash - dt * 2.5); hemi.intensity += ENV.flash * 1.6;
  poolMat.opacity = clamp(ENV.night * 1.3, 0, 1) * 0.38; const nk = 0.85 + 0.7 * ENV.night; neonMat.color.setRGB(nk, nk, nk);
  const f = focus; sunLight.position.set(f.x + ca * 150, Math.max(30, sa * 150), f.z + 45); sunLight.target.position.set(f.x, 0, f.z);
  bldMat.emissiveIntensity = clamp(ENV.night * 1.1 + ENV.dark * 0.2, 0, 1);
  lampMat.color.setRGB(0.4, 0.4, 0.42).lerp(_c2.setRGB(1, 0.85, 0.45), clamp(ENV.night * 1.3, 0, 1));
  const cp = camera.position, dir = new THREE.Vector3(ca, sa, 0.25).normalize();
  sunMesh.position.copy(cp).addScaledVector(dir, 1500); sunMesh.visible = sa > -0.08 && ENV.cloud < 0.9;
  sunGlow.position.copy(sunMesh.position); sunGlow.visible = sunMesh.visible;
  moonMesh.position.copy(cp).addScaledVector(dir, -1500); moonMesh.visible = sa < 0.1 && ENV.cloud < 0.9;
  cloudGroups.forEach(g => { g.position.x += g.userData.sp * dt; if (g.position.x > 800) g.position.x = -800; g.userData.mat.opacity = 0.25 + ENV.cloud * 0.65; g.userData.mat.color.setRGB(1, 1, 1).multiplyScalar(0.35 + 0.65 * day - ENV.dark * 0.3); });
  // rain
  const rv = ENV.rain > 0.15; rainLines.visible = rv;
  if (rv) {
    rainLines.position.set(cp.x, cp.y - 8, cp.z); rainLines.material.opacity = 0.55 * ENV.rain;
    const arr = rainLines.geometry.attributes.position.array, n = Math.min(900, q.rain);
    rainLines.geometry.setDrawRange(0, n * 2);
    for (let k = 0; k < n; k++) { const o = k * 6; let y = arr[o + 1] - 38 * dt; if (y < -4) y += 44; arr[o + 1] = y; arr[o + 4] = y - 1.2; }
    rainLines.geometry.attributes.position.needsUpdate = true;
  }
  if (INT.active) { hemi.intensity = 1.15; sunLight.intensity = 0; fillLight.intensity = 0; scene.fog.near = 60; scene.fog.far = 260; scene.background.setRGB(0.09, 0.1, 0.14); scene.fog.color.setRGB(0.02, 0.02, 0.03); poolMat.opacity = 0; skyDome.visible = false; sunMesh.visible = moonMesh.visible = sunGlow.visible = false; hemi.groundColor.setRGB(0.75, 0.75, 0.78); hemi.color.setRGB(1, 0.98, 0.95); } else { skyDome.visible = true; hemi.groundColor.setHex(0x445533); }
}
