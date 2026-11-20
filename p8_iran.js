/* ================= BANANA CITY — Iranian cars (original models) =================
   Built from side-profile polygons extruded across the car width. These are our own
   stylised models (no third-party model files), tuned to resemble the popular
   Iranian cars: Samand, Peugeot 206, Peugeot Pars, Pride and Dena.            */
Object.assign(VT, {
  samand: { name: 'سمند LX', kind: 'car', iran: 'samand', price: 14000, max: 39, acc: 14, len: 4.5, wid: 1.72, grip: 6.8, steer: 1.0, pts: [-1.3, 0, 1.3] },
  p206:   { name: 'پژو ۲۰۶', kind: 'car', iran: 'p206',   price: 11000, max: 38, acc: 15, len: 3.85, wid: 1.66, grip: 7.2, steer: 1.1, pts: [-1.1, 0, 1.1] },
  pars:   { name: 'پژو پارس', kind: 'car', iran: 'pars',  price: 13500, max: 37, acc: 13.5, len: 4.5, wid: 1.72, grip: 6.8, steer: 1.0, pts: [-1.3, 0, 1.3] },
  pride:  { name: 'پراید', kind: 'car', iran: 'pride',    price: 6000,  max: 32, acc: 12, len: 3.95, wid: 1.56, grip: 7, steer: 1.05, pts: [-1.1, 0, 1.1] },
  dena:   { name: 'دنا پلاس', kind: 'car', iran: 'dena',  price: 17000, max: 41, acc: 15, len: 4.5, wid: 1.74, grip: 6.8, steer: 1.0, pts: [-1.3, 0, 1.3] }
});
const IRAN_COLORS = [0xf2f2f2, 0xf2f2f2, 0xc9ced6, 0x8e949e, 0x1a1c20, 0x1b3a8a, 0xb3202a, 0xe8dcc0, 0x2f5d3a, 0xffd21f];
/* profiles: x = along the car (front = +), y = height. */
const IRAN_DEF = {
  samand: { body: [[-2.25, 0.32], [2.22, 0.32], [2.29, 0.52], [2.22, 0.8], [1.7, 0.9], [1.15, 0.95], [-1.5, 0.99], [-2.12, 0.97], [-2.28, 0.72]], cab: [[1.18, 0.95], [0.52, 1.45], [-0.92, 1.45], [-1.58, 0.99]], grill: 0.12 },
  pars:   { body: [[-2.25, 0.32], [2.22, 0.32], [2.29, 0.55], [2.2, 0.82], [1.55, 0.92], [1.0, 0.96], [-1.55, 1.0], [-2.14, 0.98], [-2.28, 0.72]], cab: [[1.05, 0.96], [0.4, 1.46], [-1.0, 1.46], [-1.6, 1.0]], grill: 0.18 },
  dena:   { body: [[-2.25, 0.32], [2.22, 0.32], [2.3, 0.52], [2.2, 0.78], [1.6, 0.9], [1.1, 0.94], [-1.5, 0.98], [-2.16, 0.96], [-2.29, 0.7]], cab: [[1.2, 0.94], [0.35, 1.44], [-0.95, 1.44], [-1.65, 0.98]], grill: 0.1 },
  p206:   { body: [[-1.92, 0.3], [1.9, 0.3], [1.96, 0.5], [1.9, 0.76], [1.35, 0.88], [0.85, 0.92], [-1.25, 0.96], [-1.88, 0.9], [-1.97, 0.62]], cab: [[0.9, 0.92], [0.32, 1.43], [-1.15, 1.42], [-1.88, 0.92]], grill: 0.1 },
  pride:  { body: [[-1.98, 0.34], [1.95, 0.34], [2.02, 0.54], [1.94, 0.8], [1.35, 0.9], [0.9, 0.94], [-1.55, 0.97], [-1.95, 0.94], [-2.03, 0.66]], cab: [[1.0, 0.94], [0.62, 1.46], [-1.05, 1.46], [-1.62, 0.97]], grill: 0.08 }
};
const iranPaint = {};
function iranBodyMat(c) { return iranPaint[c] || (iranPaint[c] = regEnv(new THREE.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.34, envMapIntensity: 1 }))); }
let iranGlass = null;
function extrudeProfile(pts, width, bevel) {
  const sh = new THREE.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); sh.closePath();
  const depth = Math.max(0.05, width - bevel * 2), g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 1 });
  g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0); return g;
}
function buildIranCar(type, color) {
  const sp = VT[type], def = IRAN_DEF[sp.iran], g = new THREE.Group(), wheels = [], head = [], tail = [];
  const sx = sp.len / (type === 'p206' ? 3.9 : (type === 'pride' ? 4.05 : 4.55)), W = sp.wid;
  const body = iranBodyMat(color), dark = lam(0x15171b);
  iranGlass = iranGlass || regEnv(new THREE.MeshStandardMaterial({ color: 0x0f1a26, metalness: 0.85, roughness: 0.12, envMapIntensity: 1.2 }));
  const sc = pts => pts.map(p => [p[0] * sx, p[1]]);
  const mb = new THREE.Mesh(extrudeProfile(sc(def.body), W, 0.07), body); g.add(mb);
  const mc = new THREE.Mesh(extrudeProfile(sc(def.cab), W * 0.86, 0.03), iranGlass); g.add(mc);
  // roof slab (body colour) and pillars
  const cabPts = sc(def.cab), top = cabPts[1][1], rx0 = cabPts[2][0], rx1 = cabPts[1][0];
  const roof = new THREE.Mesh(G.box, body); roof.scale.set(W * 0.88, 0.06, rx1 - rx0); roof.position.set(0, top + 0.02, (rx0 + rx1) / 2); g.add(roof);
  const L2 = sp.len / 2, by = 0.62;
  const box = (x, y, z, w, h, d, mat) => { const m = new THREE.Mesh(G.box, mat); m.position.set(x, y, z); m.scale.set(w, h, d); g.add(m); return m; };
  // bumpers, grille, plates, mirrors
  box(0, 0.46, L2 + 0.02, W * 1.0, 0.2, 0.12, dark); box(0, 0.46, -L2 - 0.02, W * 1.0, 0.2, 0.12, dark);
  box(0, 0.68, L2 + 0.04, W * 0.38, 0.16, 0.06, lam(0x2a2d33)); box(0, 0.36, L2 + 0.1, 0.5, 0.12, 0.03, lam(0xf2f2f2)); box(0, 0.5, -L2 - 0.1, 0.5, 0.12, 0.03, lam(0xf2f2f2));
  [-1, 1].forEach(s => {
    const hm = new THREE.MeshLambertMaterial({ color: 0xfff4c0, emissive: 0xfff4c0, emissiveIntensity: 0.15 }); box(s * (W / 2 - 0.3), 0.7, L2 + 0.03, 0.4, 0.17, 0.08, hm); head.push(hm);
    const tm = new THREE.MeshLambertMaterial({ color: 0x8a1111, emissive: 0xff2222, emissiveIntensity: 0.25 }); box(s * (W / 2 - 0.28), 0.74, -L2 - 0.03, 0.38, 0.16, 0.08, tm); tail.push(tm);
    box(s * (W / 2 + 0.06), 0.97, cabPts[0][0] - 0.15, 0.12, 0.12, 0.18, body);
  });
  // wheels
  const wr = 0.3 / 0.38;
  [[-1, 0.31], [1, 0.31], [-1, -0.31], [1, -0.31]].forEach(([s, zf], i) => {
    const w = new THREE.Group(); w.position.set(s * (W / 2 - 0.1), 0.3, zf * sp.len); w.rotation.order = 'YXZ';
    const t = new THREE.Mesh(G.wheel, dark); t.scale.set(1, wr, wr); w.add(t); const rim = new THREE.Mesh(G.wheel, lam(0xc7ccd4)); rim.scale.set(1.03, wr * 0.68, wr * 0.68); w.add(rim); g.add(w); wheels.push({ g: w, front: zf > 0 });
  });
  box(0, 0.3, 0, W * 0.92, 0.1, sp.len * 0.8, dark);
  g.userData.seat = null; return { group: g, wheels, head, tail };
}
