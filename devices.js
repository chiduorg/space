import * as THREE from 'three';
import {standard as materialStandard} from '/engine/renderer/materials.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const mat = (color, extra = {}) => materialStandard(color, {roughness: .58, ...extra});
const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: opacity === 1});
function mesh(geometry, material, parent, position) {
  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.copy(position);
  if (parent) parent.add(m);
  return m;
}
function box(w, h, d, material, parent, position) { return mesh(new THREE.BoxGeometry(w, h, d), material, parent, position); }
function cone(parent, position, radius, height, material, rotation = V()) {
  const m = mesh(new THREE.ConeGeometry(radius, height, 16), material, parent, position);
  if (rotation) m.rotation.set(rotation.x, rotation.y, rotation.z);
  return m;
}
function round(parent, position, scale, material, detail = 24) {
  const m = mesh(new THREE.SphereGeometry(1, detail, Math.max(10, detail * 2 / 3)), material, parent, position);
  m.scale.set(...scale); return m;
}
function rod(parent, a, b, radius, material, radiusB = radius, segments = 14) {
  const dir = b.clone().sub(a), len = dir.length();
  if (!(len > 0)) return null;
  const m = mesh(new THREE.CylinderGeometry(radiusB, radius, len, segments), material, parent, a.clone().add(b).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(V(0, 1), dir.normalize()); return m;
}
function tube(parent, points, radius, material, segments = 40) {
  const curve = new THREE.CatmullRomCurve3(points);
  return mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material, parent);
}
function wheelStand(parent, x, z, y) {
  rod(parent, V(x, y, z), V(x + .12, y + .16, z), .012, mat('#b8c2c4', {metalness: .7}), 8);
  rod(parent, V(x + .12, y + .16, z), V(x + .18, y + .34, z), .012, mat('#b8c2c4', {metalness: .7}), 8);
}
function ring(parent, radius, tube, material, position = V(), rotation = V()) {
  const m = mesh(new THREE.TorusGeometry(radius, tube, 10, 64), material, parent, position);
  m.rotation.set(rotation.x, rotation.y, rotation.z); return m;
}
function fit(parent, axis = 'x', length = 2) {  parent.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(parent), size = box.getSize(V()), scale = length / size[axis];
  const center = box.getCenter(V());
  parent.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  parent.scale.setScalar(scale);
}
function guide(parent, label, offset = -.95) {
  const a = V(-1, offset, .18), b = V(1, offset, .18);
  const g = new THREE.Group(); g.name = 'device-reference'; g.userData.decorative = true;
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineDashedMaterial({color: '#bddce2', transparent: true, opacity: .64, dashSize: .045, gapSize: .035}));
  line.computeLineDistances(); g.add(line);
  for (const p of [a, b]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().add(V(0, .05, 0)), p.clone().add(V(0, -.05, 0))]), new THREE.LineBasicMaterial({color: '#e3f5f6', transparent: true, opacity: .9})));
  parent.add(g); parent.userData.reference = {axis: 'x', kind: label, length: 2, start: a.toArray(), end: b.toArray()};
}
function extrude(shape, depth, material, parent, position) {
  const geo = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelSize: .012, bevelThickness: .008, bevelSegments: 2, steps: 1});
  geo.center();
  const m = mesh(geo, material, parent, position);
  return m;
}
function shapeFrom(points, closed = true) {
  const s = new THREE.Shape(); points.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); if (closed) s.closePath(); return s;
}

function garment(id, c, body, random) {
  const fabric = mat(c.color, {roughness: .88}), shade = mat(new THREE.Color(c.color).multiplyScalar(.78).getStyle(), {roughness: .9});
  if (id === 'tshirt' || id === 'hoodie') {
    const s = new THREE.Shape();
    s.moveTo(-.42, -.8); s.lineTo(-.62, -.2); s.lineTo(-.95, -.1); s.lineTo(-.8, .15); s.lineTo(-.5, .06);
    s.lineTo(-.48, .55); s.lineTo(-.2, .7); s.lineTo(0, .58); s.lineTo(.2, .7); s.lineTo(.48, .55);
    s.lineTo(.5, .06); s.lineTo(.8, .15); s.lineTo(.95, -.1); s.lineTo(.62, -.2); s.lineTo(.42, -.8); s.lineTo(.28, -.82); s.lineTo(0, -.7); s.lineTo(-.28, -.82); s.closePath();
    const shirt = extrude(s, .055, fabric, body);
    if (id === 'hoodie') {
      const hood = extrude(shapeFrom([[-.24, .5], [-.32, .92], [0, 1.05], [.32, .92], [.24, .5], [0, .6]]), .12, shade, body, V(0, 0, -.05));
      box(.44, .18, .03, shade, body, V(0, -.24, .08));
      for (const x of [-.18, .18]) rod(body, V(x, -.58, .06), V(x, -.74, .06), .012, mat('#d8d2c0'));
    } else {
      tube(body, [V(-.2, .52, .02), V(0, .44, .02), V(.2, .52, .02)], .018, shade, 18);
    }
    const fold = new THREE.LineBasicMaterial({color: '#6b6b62', transparent: true, opacity: .28});
    for (const x of [-.22, .22]) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x, -.65, .04), V(x, .25, .04)]), fold));
  } else if (id === 'jeans') {
    const denim = mat('#4f6680', {roughness: .9});
    const waist = box(.72, .16, .16, denim, body, V(0, .8, 0));
    box(.18, .07, .16, shade, body, V(-.22, .9, 0));
    for (const s of [-1, 1]) {
      const leg = extrude(shapeFrom([[0, .72], [.32 * s, .72], [.3 * s, -.85], [.2 * s, -.98], [.02 * s, -.9]]), .12, denim, body, V(.18 * s, 0, 0));
      leg.rotation.z = -.025 * s;
      for (let i = 0; i < 3; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.02 + .16 * s, .6 - i * .45, .065), V(.2 * s, .56 - i * .45, .065)]), new THREE.LineBasicMaterial({color: '#8aa0b2', transparent: true, opacity: .35})));
    }
    for (const x of [-.3, .3]) box(.04, .62, .02, shade, body, V(x, .75, .08));
  } else if (id === 'sock') {
    const sockMat = mat(c.color, {roughness: .95});
    const leg = mesh(new THREE.CylinderGeometry(.16, .2, .8, 16, 1, true), sockMat, body, V(0, .25));
    const foot = round(body, V(.12, -.2, 0), [.36, .18, .17], sockMat, 20);
    const heel = round(body, V(-.06, -.22, 0), [.18, .18, .17], sockMat, 16);
    for (let i = 0; i < 4; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.16, .5 - i * .18, .17), V(.16, .5 - i * .18, .17)]), new THREE.LineBasicMaterial({color: '#d8cbb5', transparent: true, opacity: .35})));
    tube(body, [V(.28, -.18, 0), V(.45, -.22, 0), V(.5, -.3, 0)], .1, sockMat, 18);
  } else if (id === 'glove') {
    const gloveMat = mat(c.color, {roughness: .82});
    round(body, V(0, 0, 0), [.34, .42, .16], gloveMat, 24);
    for (let i = 0; i < 4; i++) {
      const a = -.55 + i * .35;
      const base = V(.28, .3 - i * .08, .01);
      const tip = base.clone().add(V(Math.cos(a) * .42, Math.sin(a) * .25 - .12, 0));
      rod(body, base, tip, .055, gloveMat, .05, 10);
      round(body, tip, [.055, .06, .05], gloveMat, 10);
    }
    rod(body, V(-.18, .3, .02), V(-.4, .46, .02), .06, gloveMat, .05, 10);
    rod(body, V(-.02, -.36, 0), V(0, -.58, 0), .16, gloveMat, .15, 12);
    for (let i = 0; i < 3; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.12, .12 - i * .12, .17), V(.12, .08 - i * .1, .17)]), new THREE.LineBasicMaterial({color: '#6f655c', transparent: true, opacity: .25})));
  } else if (id === 'scarf') {
    for (let i = 0; i < 12; i++) {
      const y = .95 - i * .16, x = Math.sin(i * .7) * .07;
      const seg = box(.34, .18, .1, i % 2 ? fabric : shade, body, V(x, y, Math.sin(i * 1.2) * .04));
      seg.rotation.z = Math.sin(i * .7) * .06;
    }
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) box(.02, .12, .1, fabric, body, V(s * .2, -.8 - i * .02, 0));
  }
}

function instrument(id, c, body) {
  const wood = mat(id === 'flute' ? '#b9b4a4' : '#8b5a3a', {roughness: .42});
  const dark = mat('#2b211b', {roughness: .5}), string = mat('#e4d8bd', {roughness: .5});
  if (id === 'violin' || id === 'cello') {
    const cello = id === 'cello';
    const s = new THREE.Shape();
    s.moveTo(0, -.95); s.bezierCurveTo(.3, -.85, .42, -.45, .26, -.1); s.bezierCurveTo(.2, .1, .2, .28, .12, .42);
    s.bezierCurveTo(-.1, .55, -.2, .2, -.26, -.1); s.bezierCurveTo(-.4, -.45, -.3, -.85, 0, -.95);
    const bodyMesh = extrude(s, .09, wood, body, V(0, cello ? -.05 : 0, 0));
    for (const x of [-.13, -.04, .05, .14]) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x, -.8, .06), V(x * .5, .5, .06)]), new THREE.LineBasicMaterial({color: '#d8c59c', transparent: true, opacity: .8})));
    rod(body, V(0, .38), V(.04, cello ? .95 : .72), .045, wood, .032);
    const head = round(body, V(.04, cello ? 1.02 : .78), [.11, .13, .07], wood, 14);
    rod(body, V(.04, cello ? 1.05 : .82), V(.14, cello ? 1.12 : .88), .025, dark, .018);
    box(.04, cello ? .14 : .1, .05, dark, body, V(-.02, cello ? 1.08 : .84));
    round(body, V(-.02, cello ? -.25 : -.3, .06), [.12, .03, .04], dark, 10);
    if (cello) {
      rod(body, V(0, -.98), V(0, -1.25), .025, dark, .02);
      for (const x of [-.14, .14]) box(.06, .16, .08, dark, body, V(x, -.98));
    }
  } else if (id === 'guitar') {
    const s = new THREE.Shape();
    s.moveTo(0, -.95);
    s.bezierCurveTo(.44, -.92, .48, -.56, .3, -.3);
    s.bezierCurveTo(.24, -.16, .24, -.06, .23, .02);
    s.bezierCurveTo(.25, .2, .27, .36, .13, .48);
    s.bezierCurveTo(-.02, .52, -.2, .46, -.25, .3);
    s.bezierCurveTo(-.27, .16, -.24, -.04, -.29, -.18);
    s.bezierCurveTo(-.38, -.4, -.44, -.72, -.3, -.88);
    s.bezierCurveTo(-.2, -.97, -.06, -.96, 0, -.95);
    extrude(s, .1, mat('#b07a48', {roughness: .55}), body);
    box(.15, .72, .09, wood, body, V(0, .76));
    box(.24, .2, .06, dark, body, V(0, 1.2));
    for (let i = 0; i < 9; i++) box(.16, .008, .028, mat('#d6c29c'), body, V(0, .56 + i * .075, .052));
    for (const x of [-.06, -.02, .02, .06]) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x * 1.6, 1.12, .06), V(x * .5, -.5, .06)]), new THREE.LineBasicMaterial({color: '#e2d4b4', transparent: true, opacity: .85})));
    round(body, V(0, .06, .07), [.11, .1, .02], basic('#241a12'), 16);
    box(.28, .028, .025, dark, body, V(0, -.48, .07));
    for (const x of [-.1, .1]) for (let i = 0; i < 2; i++) box(.02, .06, .02, dark, body, V(x - .16, 1.14 + i * .06, 0));
  } else if (id === 'flute') {
    const silver = mat('#c8d3d6', {metalness: .82, roughness: .22});
    const pipe = mesh(new THREE.CylinderGeometry(.045, .045, 1.9, 18, 1, true), silver, body, V(0, 0, 0));
    pipe.rotation.z = Math.PI / 2;
    round(body, V(-.96, 0, 0), [.07, .065, .065], silver, 14);
    for (let i = 0; i < 8; i++) {
      const x = -.55 + i * .14;
      const key = mesh(new THREE.CylinderGeometry(.032, .032, .035, 12), silver, body, V(x, .055, 0)); key.rotation.x = Math.PI / 2;
      body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x, .06, .01), V(x, .06, .06)]), new THREE.LineBasicMaterial({color: '#7c8c90'})));
    }
    rod(body, V(.92, 0, 0), V(1.05, -.08, 0), .02, silver, .014);
  } else if (id === 'piano') {
    const ebony = mat('#1c1b1a', {roughness: .22}), ivory = mat('#e8e0ce', {roughness: .4});
    box(2, .32, .95, ebony, body, V(0, -.1, 0));
    box(1.86, .1, .26, ebony, body, V(0, .1, .42));
    box(1.68, .06, .3, ivory, body, V(0, .17, .38));
    for (let i = 0; i < 24; i++) {
      box(.028, .018, .16, ivory, body, V(-.8 + i * .07, .18, .5));
      if (i % 7 !== 2 && i % 7 !== 5) box(.022, .04, .1, ebony, body, V(-.8 + i * .07, .2, .62));
    }
    const lid = box(1.9, .03, .8, mat('#2c2a27', {roughness: .3}), body, V(0, .42, .04)); lid.rotation.x = -.08;
    for (const x of [-.82, .82]) for (const z of [-.32, .32]) rod(body, V(x, -.3, z), V(x, -.92, z), .035, ebony, .028);
    for (let i = 0; i < 4; i++) rod(body, V(.72, .2, -.2 + i * .15), V(.9, .62, -.2 + i * .15), .018, ebony);
  } else if (id === 'drum-kit') {
    const skin = mat('#d8c6a6', {roughness: .85}), shell = mat('#8f3e35', {roughness: .5, metalness: .25}), chromeMat = mat('#b8c2c4', {metalness: .75, roughness: .25});
    body.rotation.x = -.18;
    // Bass drum: a shallow cylinder facing the viewer, with two heads and a rim.
    const bass = mesh(new THREE.CylinderGeometry(.46, .46, .4, 32), shell, body, V(-.35, -.28, 0)); bass.rotation.x = Math.PI / 2;
    for (const z of [-.2, .2]) {
      round(body, V(-.35, -.28, z), [.46, .46, .012], skin, 32);
      ring(body, .46, .018, mat('#c9b490', {metalness: .5}), V(-.35, -.28, z + Math.sign(z) * .002), V(Math.PI / 2, 0, 0));
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; box(.05, .08, .05, chromeMat, body, V(-.35 + Math.cos(a) * .46, -.28 + Math.sin(a) * .46, .2)); }
    // Snare and two rack toms: upright drums, heads readable from above.
    const upright = (x, y, z, r, h) => {
      const d = mesh(new THREE.CylinderGeometry(r, r, h, 26), shell, body, V(x, y, z));
      round(body, V(x, y + h / 2 + .006, z), [r, .012, r], skin, 26);
      ring(body, r, .012, chromeMat, V(x, y + h / 2, z), V(Math.PI / 2, 0, 0));
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; box(.028, .05, .028, chromeMat, body, V(x + Math.cos(a) * r, y + h / 2, z + Math.sin(a) * r)); }
      return d;
    };
    upright(.42, -.35, .32, .2, .22);
    upright(-.62, -.02, -.12, .17, .24);
    upright(.48, .02, -.18, .16, .22);
    for (const [x, y, z] of [[-.62, -.5, -.12], [.48, -.5, -.18], [.42, -.5, .32]]) {
      rod(body, V(x, -.5, z), V(x, y + .02, z), .012, chromeMat, .012, 8);
      rod(body, V(x, -.5, z), V(x + .12, -.48, z + .08), .008, chromeMat, .008, 6);
    }
    // Cymbals sit above the kit on straight stands.
    for (const [x, y, z, r] of [[-.78, .48, -.38, .22], [.7, .5, -.34, .2]]) {
      const cym = mesh(new THREE.CylinderGeometry(r, r, .014, 28), mat('#c8b05c', {metalness: .85, roughness: .22}), body, V(x, y, z));
      cym.rotation.z = -.08;
      rod(body, V(x, -.5, z), V(x, y - .01, z), .011, chromeMat, .011, 8);
      rod(body, V(x, -.5, z), V(x + .16, -.55, z + .12), .008, chromeMat, .008, 6);
    }
  }
}

function kitchen(id, c, body, random) {
  const steel = mat('#b8c2c4', {metalness: .8, roughness: .24});
  const darkSteel = mat('#7e8d91', {metalness: .7, roughness: .3});
  if (['frying-pan', 'wok', 'stock-pot'].includes(id)) {
    const wok = id === 'wok', pan = id === 'frying-pan';
    const radius = .95, depth = wok ? .5 : pan ? .22 : .7;
    const bowl = mesh(new THREE.CylinderGeometry(radius * (wok ? .92 : 1), radius * .72, depth, 36, 1, true), steel, body, V(0, 0));
    mesh(new THREE.CircleGeometry(radius * .72, 36), darkSteel, body, V(0, -depth / 2)).rotation.x = -Math.PI / 2;
    for (const y of [-depth / 2, depth / 2]) {
      const ring = mesh(new THREE.TorusGeometry(radius * (y > 0 ? .98 : .74), .025, 8, 36), steel, body, V(0, y));
      ring.rotation.x = Math.PI / 2;
    }
    if (wok || pan) {
      rod(body, V(radius * .8, 0, 0), V(radius + .75, .05, 0), .06, darkSteel, .045);
      round(body, V(radius + .8, .06, 0), [.09, .06, .06], mat('#3b2d26'), 12);
      if (pan) rod(body, V(radius + .35, 0, 0), V(radius + .4, .4, 0), .025, darkSteel, .02);
    } else {
      for (const s of [-1, 1]) {
        const handle = new THREE.Mesh(new THREE.TorusGeometry(.22, .045, 10, 24, Math.PI), steel);
        handle.position.set(s * radius * .9, .1, 0); handle.rotation.set(Math.PI / 2, 0, s * Math.PI / 2); body.add(handle);
      }
    }
    if (id === 'stock-pot') {
      const lid = mesh(new THREE.SphereGeometry(radius * .82, 28, 12, 0, TAU, 0, Math.PI / 2), steel, body, V(0, depth / 2));
      lid.scale.y = .22;
      round(body, V(0, depth / 2 + .12, 0), [.08, .05, .08], darkSteel, 10);
    }
  } else if (id === 'pressure-cooker') {
    const pot = mesh(new THREE.CylinderGeometry(.82, .78, .9, 32), steel, body, V(0, -.05));
    mesh(new THREE.TorusGeometry(.82, .03, 8, 32), steel, body, V(0, .4)).rotation.x = Math.PI / 2;
    const lid = mesh(new THREE.CylinderGeometry(.8, .82, .12, 32), steel, body, V(0, .46));
    round(body, V(0, .58, 0), [.12, .06, .12], darkSteel, 12);
    for (const s of [-1, 1]) rod(body, V(s * .8, .1, 0), V(s * .95, .1, 0), .05, darkSteel, .045);
    rod(body, V(0, .64, 0), V(0, .82, 0), .04, darkSteel);
    for (const y of [-.38, -.1, .2]) {
      const ring = mesh(new THREE.TorusGeometry(.79, .018, 6, 30), darkSteel, body, V(0, y)); ring.rotation.x = Math.PI / 2;
    }
  } else if (id === 'electric-kettle') {
    const brushed = mat('#cfd6d6', {metalness: .58, roughness: .30});
    const bodyMesh = mesh(new THREE.CylinderGeometry(.40, .53, .92, 40), brushed, body, V(0, 0));
    const shoulder = mesh(new THREE.CylinderGeometry(.38, .41, .10, 40), brushed, body, V(0, .50));
    const lid = mesh(new THREE.SphereGeometry(.38, 32, 14, 0, TAU, 0, Math.PI / 2), mat('#30383c', {roughness: .42}), body, V(0, .55));
    lid.scale.y = .34;
    round(body, V(0, .65, 0), [.10, .045, .10], mat('#20272a', {roughness: .35}), 14);
    const handle = new THREE.Group(); body.add(handle);
    tube(handle, [V(-.40, .28, 0), V(-.72, .18, 0), V(-.76, -.02, 0), V(-.66, -.24, 0), V(-.42, -.34, 0)], .045, mat('#262d30', {roughness: .55}), 30);
    tube(body, [V(.40, -.16, 0), V(.60, -.04, 0), V(.66, .18, 0), V(.62, .27, 0)], .065, brushed, 28);
    round(body, V(.62, .29, 0), [.055, .025, .055], mat('#2b3336', {roughness: .4}), 12);
    // Transparent water-level window with a 1.7 L fill line.
    box(.16, .52, .012, mat('#1f4d63', {transparent: true, opacity: .72, roughness: .18, metalness: .1}), body, V(0, -.08, .505));
    box(.19, .014, .016, mat('#e8ece8', {roughness: .6}), body, V(0, .17, .512));
    for (let i = 0; i < 4; i++) box(.10, .006, .014, mat('#b8c4c5', {roughness: .55}), body, V(-.02, -.30 + i * .13, .512));
    mesh(new THREE.CylinderGeometry(.57, .60, .09, 40), mat('#343c3f', {metalness: .35, roughness: .5}), body, V(0, -.51));
    mesh(new THREE.TorusGeometry(.47, .022, 8, 40), mat('#9fa9aa', {metalness: .7, roughness: .28}), body, V(0, -.44)).rotation.x = Math.PI / 2;
    box(.26, .08, .03, mat('#1d2427', {roughness: .5}), body, V(0, -.52, .56));
    round(body, V(.08, -.52, .578), [.026, .014, .012], mat('#6fb8d2', {emissive: '#6fb8d2', emissiveIntensity: .75}), 10);
    tube(body, [V(-.46, -.54, 0), V(-.52, -.60, .10), V(-.46, -.62, .24)], .018, mat('#252a2b', {roughness: .65}), 18);
  } else if (id === 'rice-cooker') {
    const bodyMesh = mesh(new THREE.SphereGeometry(1, 28, 18, 0, TAU, 0, Math.PI / 2), mat('#d8dce0', {roughness: .4}), body, V(0, -.1));
    bodyMesh.scale.set(.85, .55, .72);
    box(1.5, .55, 1.22, mat('#e0e4e6', {roughness: .35}), body, V(0, -.35));
    const lid = mesh(new THREE.CylinderGeometry(.82, .82, .1, 28), steel, body, V(0, .4));
    round(body, V(0, .52, 0), [.12, .05, .12], darkSteel, 10);
    box(.34, .18, .03, mat('#3d4a50'), body, V(.55, .12, .62));
    for (let i = 0; i < 4; i++) round(body, V(.46 + i * .06, .1, .64), [.018, .018, .01], mat('#d8a24a'), 6);
  } else if (id === 'chopsticks') {
    const bamboo = mat('#c7a36a', {roughness: .55});
    for (const s of [-1, 1]) {
      rod(body, V(-.95, s * .025, s * .02), V(.95, s * .045 + .02, s * .03), .018, bamboo, .012, 8);
    }
    for (let i = 0; i < 5; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.6, i * .012 - .03, .02), V(.6, i * .012 - .01, .02)]), new THREE.LineBasicMaterial({color: '#9d7d4f', transparent: true, opacity: .5})));
  }
}

function stationery(id, c, body) {
  const steel = mat('#b9c6cb', {metalness: .85, roughness: .2});
  const ink = mat(c.color, {roughness: .35});
  if (id === 'paper-clip') {
    const loops = [
      [[-.95, -.2], [.78, -.2], [.93, -.12], [.93, .02], [.93, .16], [.78, .22], [-.86, .22]],
      [[-.62, -.13], [.6, -.13], [.72, -.06], [.72, .06], [.72, .16], [.6, .18], [-.55, .18]],
      [[-.25, -.06], [.42, -.06], [.5, .0], [.5, .07], [.5, .14], [.42, .15], [-.18, .15]],
    ];
    for (const pts of loops) tube(body, pts.map(([x, y]) => V(x, y, .02)), .017, steel, 60);
    tube(body, [V(-.95, -.2, .02), V(-.95, -.03, .02), V(-.95, .1, .02)], .017, steel, 20);
  } else if (id === 'ballpoint-pen') {
    const barrel = mesh(new THREE.CylinderGeometry(.075, .095, 1.35, 18), ink, body, V(0, 0));
    barrel.rotation.z = Math.PI / 2;
    const cap = mesh(new THREE.CylinderGeometry(.1, .1, .42, 18), steel, body, V(.78, 0, 0)); cap.rotation.z = Math.PI / 2;
    cone(body, V(1.0, 0, 0), .06, .14, steel, V(0, 0, -Math.PI / 2));
    round(body, V(-.7, 0, 0), [.1, .1, .1], steel, 12);
    box(.06, .14, .04, steel, body, V(.72, .1, 0));
    for (let i = 0; i < 6; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.5 + i * .18, -.09, .04), V(-.5 + i * .18, -.09, .09)]), new THREE.LineBasicMaterial({color: '#7a8488'})));
  } else if (id === 'stapler') {
    const base = box(1.5, .13, .42, mat('#2f4a55', {roughness: .5}), body, V(0, -.35));
    const top = box(1.5, .12, .35, mat('#406774', {roughness: .42}), body, V(.08, .15, 0)); top.rotation.z = -.12;
    rod(body, V(-.62, -.3, 0), V(-.62, .1, 0), .08, steel);
    box(.3, .04, .22, steel, body, V(.55, -.26, 0));
    for (let i = 0; i < 4; i++) box(.18, .02, .03, steel, body, V(.42 + i * .1, -.32, .16));
  } else if (id === 'a5-notebook') {
    const pages = box(1.25, .13, 1.76, mat('#e9e3d2', {roughness: .85}), body, V(0, -.02, 0));
    const cover = box(1.32, .025, 1.82, mat(c.color, {roughness: .55}), body, V(0, .09, 0));
    const spine = box(.07, .15, 1.82, mat(new THREE.Color(c.color).multiplyScalar(.7).getStyle()), body, V(-.66, 0, 0));
    for (let i = 0; i < 8; i++) {
      body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.52, .01, -.75 + i * .2), V(.52, .01, -.75 + i * .2)]), new THREE.LineBasicMaterial({color: '#8c9ca6', transparent: true, opacity: .35})));
    }
    // Wire binding along the spine and a page-edge contrast so the object
    // reads as a notebook rather than a flat white card.
    for (let i = 0; i < 11; i++) {
      ring(body, .075, .012, steel, V(-.69, .07, -.75 + i * .15), V(0, Math.PI / 2, 0));
    }
    box(.02, .16, 1.72, mat('#cfc6b0', {roughness: .8}), body, V(.63, -.02, 0));
    box(.16, .01, .04, mat('#c8a25a'), body, V(.5, .1, .7));
    // Elastic closure and a small printed cover block give the notebook a
    // product-like finish instead of a plain dark slab.
    box(.035, .008, 1.58, mat('#2f3438', {roughness: .7}), body, V(.49, .106, 0));
    box(.22, .004, .10, mat('#e7e1d2', {roughness: .65}), body, V(-.28, .106, .62));
    box(.15, .003, .014, mat('#74858c'), body, V(-.28, .109, .63));
    box(.11, .003, .012, mat('#74858c'), body, V(-.30, .109, .59));
  } else if (id === 'credit-card') {
    const card = box(1.9, .02, 1.18, mat(c.color, {metalness: .25, roughness: .4}), body); card.rotation.x = -.18;
    box(.28, .012, .22, mat('#d8bf83', {metalness: .95, roughness: .18}), body, V(-.62, .02, .12));
    for (const z of [-.34, -.27]) box(1.72, .008, .06, mat('#263c4d'), body, V(.02, .02, z));
    for (let i = 0; i < 4; i++) box(.06, .006, .06, mat('#d8d4c2'), body, V(.55 + i * .08, .022, -.4));
    for (let i = 0; i < 3; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.8, .024, -.38 + i * .1), V(.8, .024, -.38 + i * .1)]), new THREE.LineBasicMaterial({color: '#6c7f88', transparent: true, opacity: .35})));
  } else if (id === 'glass-pane') {
    const pane = box(1.94, .045, 1.3, mat('#c9e0e4', {transparent: true, opacity: .28, roughness: .05, metalness: .1, depthWrite: false}), body);
    for (const y of [-.025, .025]) {
      for (const z of [-.65, .65]) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.97, y, z), V(.97, y, z)]), new THREE.LineBasicMaterial({color: '#e6f8fa', transparent: true, opacity: .55})));
    }
    for (const x of [-.5, .5]) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x, .026, -.64), V(x, .026, .64)]), new THREE.LineBasicMaterial({color: '#d6f2f4', transparent: true, opacity: .35})));
  } else if (id === 'perovskite-cell') {
    const layers = [[-0.06, '#2f3c44'], [-0.02, '#6d7a80'], [0.02, '#8a5f3a'], [0.055, '#d8b45f'], [0.077, '#9fb7bc']];
    for (const [y, color] of layers) box(1.9, y > .06 ? .022 : .035, 1.1, mat(color, {roughness: .35, metalness: .3}), body, V(0, y, 0));
    for (let i = 0; i < 8; i++) box(.03, .018, 1.12, mat('#d8c27a', {metalness: .8}), body, V(-.85 + i * .24, .102, 0));
    for (const z of [-.5, .5]) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.9, .12, z), V(.9, .12, z)]), new THREE.LineBasicMaterial({color: '#e4d6a6'})));
  }
}

function deskLamp(c, body) {
  const dark = mat('#2c3337', {metalness: .35, roughness: .5});
  const chrome = mat('#b9c3c5', {metalness: .8, roughness: .22});
  const shade = mat('#d8d1c1', {roughness: .55, side: THREE.DoubleSide});
  const glow = basic('#ffd89a', .92);
  // Elliptical weighted base, hinged arm and a real downward-facing shade.
  const base = mesh(new THREE.CylinderGeometry(.34, .38, .07, 32), dark, body, V(0, -.62, 0));
  base.scale.z = .72;
  ring(body, .33, .012, chrome, V(0, -.575, 0), V(Math.PI / 2, 0, 0));
  rod(body, V(0, -.54, 0), V(0, -.05, -.08), .022, chrome);
  rod(body, V(0, -.02, -.08), V(.28, .48, .04), .019, chrome);
  const elbow = round(body, V(0, -.01, -.08), [.045, .045, .045], dark, 12);
  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(.34, .56, .04);
  shadeGroup.rotation.z = -.78;
  body.add(shadeGroup);
  const cone = mesh(new THREE.CylinderGeometry(.15, .31, .26, 28, 1, true), shade, shadeGroup, V(0, -.02, 0));
  const inner = mesh(new THREE.CircleGeometry(.29, 28), glow, shadeGroup, V(0, -.15, 0));
  inner.rotation.x = Math.PI / 2;
  round(shadeGroup, V(0, -.15, 0), [.11, .11, .11], basic('#ffe6b8', .95), 18);
  // Switch, cable and a warm pool of light on the base plane.
  box(.12, .015, .09, mat('#b24d3c', {roughness: .45}), body, V(.08, -.575, .20));
  tube(body, [V(-.12, -.61, .12), V(-.35, -.62, .35), V(-.52, -.635, .55)], .014, dark, 26);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(.48, 32), new THREE.MeshBasicMaterial({color: '#ffd89a', transparent: true, opacity: .13, depthWrite: false}));
  pool.rotation.x = -Math.PI / 2; pool.position.set(.48, -1.16, .18); body.add(pool);
}
function tools(id, c, body) {
  const steel = mat('#aeb9bd', {metalness: .8, roughness: .26});
  const handle = mat(c.color, {roughness: .5});
  if (id === 'screwdriver') {
    rod(body, V(-1, 0, 0), V(-.25, 0, 0), .12, handle, .14, 18);
    for (let i = 0; i < 5; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.9 + i * .12, -.11, .08), V(-.9 + i * .12, .11, .08)]), new THREE.LineBasicMaterial({color: '#2e2b26'})));
    rod(body, V(-.25, 0, 0), V(.55, 0, 0), .028, steel);
    cone(body, V(.88, 0, 0), .055, .3, steel, V(0, 0, -Math.PI / 2));
  } else if (id === 'wrench') {
    rod(body, V(-1, 0, 0), V(.5, 0, 0), .07, steel);
    box(.34, .32, .11, steel, body, V(.65, .02, 0));
    box(.42, .09, .1, steel, body, V(.92, .19, 0));
    box(.34, .075, .1, steel, body, V(.88, -.16, 0));
    box(.18, .2, .11, mat('#7c878a', {metalness: .75, roughness: .3}), body, V(.72, .0, 0));
    const worm = mesh(new THREE.CylinderGeometry(.09, .09, .16, 16), mat('#6d7678', {metalness: .7, roughness: .35}), body, V(.55, -.18, 0)); worm.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(.52, -.23 + i * .025, .05), V(.58, -.23 + i * .025, .05)]), new THREE.LineBasicMaterial({color: '#c8d0d0'})));
    rod(body, V(-.72, 0, 0), V(-1, 0, 0), .1, handle, .11, 12);
    for (let i = 0; i < 4; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.8 + i * .22, -.07, .05), V(-.8 + i * .22, .07, .05)]), new THREE.LineBasicMaterial({color: '#7d878a'})));
  } else if (id === 'hammer') {
    rod(body, V(-1, -.1, 0), V(.35, .15, 0), .06, handle, .08);
    const head = box(.5, .28, .22, steel, body, V(.45, .22, 0));
    head.rotation.z = -.1;
    box(.2, .12, .24, mat('#7c8689', {metalness: .7, roughness: .35}), body, V(.7, .2, 0));
    for (let i = 0; i < 5; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.8 + i * .22, -.1, .065), V(-.8 + i * .22, .1, .065)]), new THREE.LineBasicMaterial({color: '#2e2b26'})));
  } else if (id === 'knife') {
    const s = new THREE.Shape();
    s.moveTo(-.45, -.15); s.lineTo(.9, -.1); s.lineTo(1.0, .12); s.lineTo(.2, .38); s.lineTo(-.1, .28); s.closePath();
    const blade = extrude(s, .05, steel, body);
    blade.rotation.y = -.06;
    rod(body, V(-.95, 0, 0), V(-.45, 0, 0), .11, handle, .12, 14);
    for (let i = 0; i < 4; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.85 + i * .1, -.11, .07), V(-.85 + i * .1, .11, .07)]), new THREE.LineBasicMaterial({color: '#2e2b26'})));
  }
}

function furniture(id, c, body) {
  const wood = mat(c.color, {roughness: .6}), dark = mat('#4a3b2e', {roughness: .62});
  if (id === 'table') {
    const top = box(2, .09, .95, wood, body, V(0, .38));
    for (const x of [-.8, .8]) for (const z of [-.36, .36]) rod(body, V(x, .35, z), V(x, -.92, z), .055, dark, .045);
    box(1.65, .025, .65, wood, body, V(0, -.2));
    for (let i = 0; i < 5; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.7 + i * .35, .43, -.45), V(-.7 + i * .35, .43, .45)]), new THREE.LineBasicMaterial({color: '#8d7d69', transparent: true, opacity: .35})));
  } else if (id === 'bed') {
    const frame = box(2, .18, 1.35, dark, body, V(0, -.45));
    const mattress = box(1.92, .22, 1.25, mat('#ded7c7', {roughness: .92}), body, V(0, -.22));
    const headboard = box(2, .9, .1, wood, body, V(0, .2, -.62));
    box(1.9, .05, .9, mat('#8b6b58', {roughness: .9}), body, V(0, -.08, .18));
    for (const x of [-1, 1]) box(1.0, .02, 1.2, mat('#e8e1d3', {roughness: .9}), body, V(-.45 * x + .45 * (x > 0 ? 1 : 0), -.02, .2));
    for (const x of [-.55, .55]) {
      const pillow = round(body, V(x, .02, -.42), [.42, .12, .25], mat('#ece6d7', {roughness: .95}), 20);
      pillow.rotation.z = -.05;
    }
    for (const x of [-.88, .88]) for (const z of [-.55, .55]) box(.12, .6, .12, dark, body, V(x, -.75, z));
  } else if (id === 'sofa') {
    box(2, .52, .9, wood, body, V(0, -.02));
    box(2, .62, .18, mat(new THREE.Color(c.color).multiplyScalar(.85).getStyle()), body, V(0, .28, -.4));
    for (const s of [-1, 1]) box(.18, .55, .9, mat(c.color), body, V(s * .91, .12, 0));
    for (const x of [-.5, 0, .5]) {
      const cushion = box(.62, .14, .62, mat(new THREE.Color(c.color).multiplyScalar(1.06).getStyle()), body, V(x, .3, .02));
      cushion.rotation.x = -.03;
      box(.6, .04, .02, dark, body, V(x, .2, .35));
    }
    for (const x of [-.88, .88]) for (const z of [-.34, .34]) rod(body, V(x, -.3, z), V(x, -.88, z), .04, dark);
    for (let i = 0; i < 4; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.8, .2, .45), V(.8, .2, .45)]), new THREE.LineBasicMaterial({color: '#8f8072', transparent: true, opacity: .2})));
  }
}

function sport(id, c, body) {
  const steel = mat('#b6c2c6', {metalness: .75, roughness: .25});
  const handle = mat('#3e4f57', {roughness: .55});
  if (id === 'tennis-racket') {
    rod(body, V(-1, 0, 0), V(-.4, 0, 0), .05, handle, .04);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.34, .035, 8, 40), steel);
    hoop.position.set(.05, 0, 0); body.add(hoop);
    for (let i = -5; i <= 5; i++) {
      rod(body, V(.05 + i * .05, -.32, 0), V(.05 + i * .05, .32, 0), .004, mat('#d8d2bb'));
      rod(body, V(-.27, i * .05, .005), V(.37, i * .05, .005), .004, mat('#d8d2bb'));
    }
    for (let i = 0; i < 4; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.92 + i * .1, -.04, .04), V(-.92 + i * .1, .04, .04)]), new THREE.LineBasicMaterial({color: '#d8cbb4'})));
  } else if (id === 'skateboard') {
    const deck = box(2, .07, .46, mat(c.color, {roughness: .5}), body, V(0, .02));
    const nose = deck.clone(); nose.position.set(0, .05, 0);
    for (let i = 0; i < 8; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.9 + i * .24, .055, -.23), V(-.9 + i * .24, .055, .23)]), new THREE.LineBasicMaterial({color: '#2e2b26', transparent: true, opacity: .45})));
    for (const x of [-.62, .62]) {
      box(.1, .1, .38, steel, body, V(x, -.06, 0));
      for (const z of [-.2, .2]) {
        const wheel = mesh(new THREE.CylinderGeometry(.11, .11, .1, 16), mat('#e6d8b4', {roughness: .55}), body, V(x + (x > 0 ? .1 : -.1), -.15, z));
        wheel.rotation.x = Math.PI / 2;
      }
    }
  } else if (id === 'baseball-bat') {
    rod(body, V(-1, 0, 0), V(.78, 0, 0), .09, mat(c.color, {roughness: .5}), .22);
    round(body, V(.9, 0, 0), [.19, .2, .19], mat(c.color), 18);
    round(body, V(-1, 0, 0), [.09, .09, .09], handle, 12);
    for (let i = 0; i < 5; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.7 + i * .12, -.11, .1), V(-.7 + i * .12, .11, .1)]), new THREE.LineBasicMaterial({color: '#7a5b3a', transparent: true, opacity: .3})));
  } else if (id === 'umbrella') {
    const canopy = mesh(new THREE.SphereGeometry(.9, 32, 16, 0, TAU, 0, Math.PI / 2), mat(c.color, {roughness: .7}), body, V(0, .28));
    canopy.scale.y = .48;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      rod(body, V(0, .95, 0), V(Math.cos(a) * .9, .3, Math.sin(a) * .9), .008, steel);
      tube(body, [V(0, .95, 0), V(Math.cos(a) * .5, .5, Math.sin(a) * .5), V(Math.cos(a) * .9, .3, Math.sin(a) * .9)], .008, steel, 20);
    }
    rod(body, V(0, .95, 0), V(0, -1.15, 0), .022, steel);
    tube(body, [V(0, -1.15, 0), V(.16, -1.3, 0), V(0, -1.44, 0), V(-.18, -1.32, 0)], .04, mat('#5d4634'), 24);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, .94, 0), V(Math.cos(a) * .86, .31, Math.sin(a) * .86)]), new THREE.LineBasicMaterial({color: '#efe7d4', transparent: true, opacity: .28})));
    }
  }
}

export function createDevice(g, c, random, entry) {
  const id = String(entry?.id || '').replace('space.', '');
  const body = new THREE.Group(); body.name = id; g.add(body);
  const shell = mat(c.color, {metalness: .4, roughness: .4});
  if (id === 'smartphone' || id === 'laptop' || id === 'keyboard') {
    if (id === 'smartphone') {
      box(2, .94, .075, shell, body, V(0, 0, 0));
      const screen = box(1.86, .8, .012, basic('#05090d'), body, V(0, .0, .045));
      for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
        const colors = ['#70a8c4', '#d9a45f', '#8fa96f', '#b96f62', '#8c7fb0', '#7ab5a4'];
        box(.13, .13, .006, basic(colors[(row * 4 + col) % colors.length], .92), body, V(-.68 + col * .22, .22 - row * .2, .051));
      }
      box(1.3, .035, .006, basic('#27343b', .8), body, V(0, -.4, .051));
      box(.62, .022, .006, basic('#b8d6de', .75), body, V(-.52, .395, .052));
      box(.05, .05, .012, basic('#1a2228'), body, V(-.78, .39, .052));
      box(.16, .008, .018, mat('#2a3438'), body, V(-.99, .18, .02));
      box(.16, .008, .018, mat('#2a3438'), body, V(-.99, -.02, .02));
      box(.02, .14, .018, mat('#2a3438'), body, V(.99, .1, .02));
    } else if (id === 'laptop') {
      box(2, .07, 1.25, shell, body, V(0, -.42, .02));
      box(1.86, .018, 1.1, mat('#5d6b70', {roughness: .8}), body, V(0, -.38, .02));
      for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) box(.125, .012, .1, mat('#26333a'), body, V(-.76 + col * .138, -.372, -.28 + row * .12));
      box(.66, .008, .3, mat('#89989c', {roughness: .5}), body, V(0, -.372, .43));
      box(1.5, .02, .07, mat('#3b464b'), body, V(0, -.44, -.62));
      const screen = box(2, 1.12, .06, shell, body, V(0, .18, -.62)); screen.rotation.x = -.19;
      const display = box(1.86, 1.0, .012, basic('#0b2230'), body, V(0, .2, -.585)); display.rotation.x = -.19;
      for (let i = 0; i < 4; i++) body.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.78, .58 - i * .08, -.55), V(.78, .58 - i * .08, -.55)]), new THREE.LineBasicMaterial({color: '#4e92b5', transparent: true, opacity: .5})));
      box(.5, .016, .016, mat('#8fa1a6'), body, V(0, -.34, -.75));
      const hinge = mesh(new THREE.CylinderGeometry(.04, .04, 2, 18), mat('#6b7a80', {metalness: .6}), body, V(0, -.4, -.62)); hinge.rotation.z = Math.PI / 2;
      body.rotation.set(.22, -.28, 0);
    } else {
      box(2, .55, .16, shell, body, V(0, 0, 0));
      for (let row = 0; row < 5; row++) for (let col = 0; col < 15; col++) {
        box(.1, .12, .07, mat('#25343a'), body, V(-.88 + col * .126, .18 - row * .1, .09));
      }
      box(.5, .06, .02, mat('#9fb0b4'), body, V(.55, -.22, .1));
    }
    fit(body, 'x'); guide(g, 'device-span', -1.0); return;
  }
  if (id === 'desk-lamp' || id === 'table-lamp') { deskLamp(c, body); body.rotation.y = .24; fit(body, 'y'); guide(g, 'lamp-height', -1.0); return; }
  if (['tshirt', 'hoodie', 'jeans', 'sock', 'glove', 'scarf'].includes(id)) { garment(id, c, body, random); fit(body, 'x'); guide(g, 'garment-length', -1.18); return; }
  if (['violin', 'cello', 'guitar', 'flute', 'piano', 'drum-kit'].includes(id)) { instrument(id, c, body); fit(body, 'x'); guide(g, 'instrument-length', -1.2); return; }
  if (['frying-pan', 'wok', 'stock-pot', 'pressure-cooker', 'electric-kettle', 'rice-cooker', 'chopsticks'].includes(id)) { kitchen(id, c, body, random); fit(body, 'x'); guide(g, 'vessel-span', -1.05); return; }
  if (['paper-clip', 'ballpoint-pen', 'stapler', 'a5-notebook', 'credit-card', 'glass-pane', 'perovskite-cell'].includes(id)) { stationery(id, c, body); if (id === 'a5-notebook') body.rotation.set(-.52, .28, .05); fit(body, 'x'); guide(g, 'object-length', -.88); return; }
  if (['screwdriver', 'wrench', 'hammer', 'knife'].includes(id)) { tools(id, c, body); fit(body, 'x'); guide(g, 'tool-length', -1.02); return; }
  if (['table', 'bed', 'sofa'].includes(id)) { furniture(id, c, body); fit(body, 'x'); guide(g, 'furniture-length', -1.12); return; }
  if (['tennis-racket', 'skateboard', 'baseball-bat', 'umbrella'].includes(id)) { sport(id, c, body); fit(body, 'x'); guide(g, 'object-span', -1.22); return; }
  // any unlisted item keeps a proportioned, inspectable placeholder rather than a laptop.
  box(1.8, .7, .5, shell, body); fit(body, 'x'); guide(g, 'object-span', -1.0);
}
