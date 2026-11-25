import * as THREE from 'three';
import {standard as materialStandard} from '/engine/renderer/materials.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const mat = (color, extra = {}) => materialStandard(color, {roughness: .62, ...extra});
const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: false});
const basicInk = (color, opacity = 1) => glow(color, opacity);
const basicNet = (color, opacity = 1) => glow(color, opacity);
function mesh(geometry, material, parent, position) {
  const m = new THREE.Mesh(geometry, material); if (position) m.position.copy(position); if (parent) parent.add(m); return m;
}
const box = (w, h, d, material, parent, position) => mesh(new THREE.BoxGeometry(w, h, d), material, parent, position);
const ball = (r, material, parent, position) => mesh(new THREE.SphereGeometry(r, 30, 22), material, parent, position);
const rod = (a, b, radius, material, parent) => {
  const dir = b.clone().sub(a), len = dir.length(); if (!(len > 0)) return null;
  const m = mesh(new THREE.CylinderGeometry(radius, radius, len, 12), material, parent, a.clone().add(b).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(V(0, 1), dir.normalize()); return m;
};
const ring = (r, t, material, parent, position = V(), rotation = V()) => {
  const m = mesh(new THREE.TorusGeometry(r, t, 10, 72), material, parent, position); m.rotation.set(rotation.x, rotation.y, rotation.z); return m;
};
function line(parent, points, color, opacity = .8) {
  const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({color, transparent: opacity < 1, opacity})); parent.add(m); return m;
}
function dashed(parent, points, color, opacity = .7) {
  const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineDashedMaterial({color, transparent: true, opacity, dashSize: .05, gapSize: .035}));
  m.computeLineDistances(); parent.add(m); return m;
}
function extrude(shape, depth, material, parent, z = 0) {
  const e = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 2, steps: 1});
  e.translate(0, 0, z); return mesh(e, material, parent);
}
function fit(parent, axis = 'x', length = 2) {
  parent.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(parent), size = box.getSize(V()), scale = length / Math.max(1e-6, size[axis]), center = box.getCenter(V());
  parent.position.set(-center.x * scale, -center.y * scale, -center.z * scale); parent.scale.setScalar(scale);
}
function ref(parent, label, offset = -1.04) {
  const a = V(-1, offset, .16), b = V(1, offset, .16);
  dashed(parent, [a, b], '#bddce2', .7);
  for (const p of [a, b]) line(parent, [V(p.x, p.y - .06, p.z), V(p.x, p.y + .06, p.z)], '#bddce2', .7);
  parent.userData.reference = {axis: 'x', kind: label, length: 2, start: a.toArray(), end: b.toArray()};
}
function pointCloud(parent, count, random, color, sample, size = 3) {
  const pos = [], col = [], base = new THREE.Color(color);
  for (let i = 0; i < count; i++) {const p = sample(i); pos.push(p.x, p.y, p.z); const c = base.clone().lerp(new THREE.Color('#fff2da'), random() * .5); col.push(c.r, c.g, c.b);}
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const material = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {pointSize: {value: size}, alpha: {value: .9}},
    vertexShader: 'attribute vec3 color;varying vec3 tint;uniform float pointSize;void main(){tint=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointSize*14./max(2.,-p.z),1.,20.);}',
    fragmentShader: 'varying vec3 tint;uniform float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint,alpha*pow(1.-r,1.7));}'});
  const p = new THREE.Points(geo, material); parent.add(p); return p;
}

const cloudTexture = (() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
  grad.addColorStop(0, 'rgba(255,255,255,.98)'); grad.addColorStop(.3, 'rgba(250,252,250,.9)'); grad.addColorStop(.58, 'rgba(242,247,245,.4)'); grad.addColorStop(.8, 'rgba(235,242,240,.08)'); grad.addColorStop(1, 'rgba(235,242,240,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return tex;
})();

function paperStack(g, c, id, random) {
  const paper = mat('#f2eee2', {roughness: .9}), ink = basicInk('#41515c');
  if (id === 'a4-paper' || id === 'sheet-of-paper') {
    const stack = new THREE.Group(); stack.rotation.set(.46, .05, .02); g.add(stack);
    const count = id === 'sheet-of-paper' ? 90 : 12;
    const topY = count * .009;
    if (id === 'a4-paper') {
      const shadow = mesh(new THREE.PlaneGeometry(2.25, 1.62), mat('#0b1118', {transparent: true, opacity: .30, depthWrite: false}), stack, V(.04, -.016, .04));
      shadow.rotation.x = -Math.PI / 2;
      box(2.03, .006, 1.43, mat('#dfe3e0', {roughness: .95}), stack, V(.045, -.008, .035)).rotation.z = -.012;
    }
    for (let i = 0; i < count; i++) {
      const sheet = box(2, .009, 1.414, paper, stack, V((random() - .5) * .008, i * .009 - count * .0045, (random() - .5) * .008));
      sheet.rotation.z = (random() - .5) * .006;
    }
    const top = box(1.96, .006, 1.37, glow('#fbf8ee'), stack, V(0, topY, 0));
    top.rotation.z = 0;
    // Printed document layout: masthead, section rules and ragged-right body.
    box(.52, .002, .026, basicInk('#334653', .9), stack, V(-.55, topY + .0045, .58));
    box(.78, .002, .006, basicInk('#889da6', .7), stack, V(-.40, topY + .0045, .50));
    box(1.52, .002, .003, basicInk('#9aa9b0', .55), stack, V(-.18, topY + .0045, .46));
    for (let i = 0; i < 22; i++) {
      const w = i % 6 === 5 ? .78 : 1.55;
      box(w, .002, .003, basicInk('#617582', .78), stack, V(-.82 + w / 2, topY + .0045, .30 - i * .026));
    }
    box(.012, .002, 1.3, basicInk('#b85c58', .72), stack, V(-.88, topY + .006, 0));
    box(.24, .002, .006, basicInk('#8b9ba2', .6), stack, V(.64, topY + .006, -.62));
    // Footer rule, page number block and a red editorial stamp.
    box(1.2, .002, .003, basicInk('#a8b4b8', .5), stack, V(-.30, topY + .0045, -.72));
    box(.18, .002, .006, basicInk('#536a76', .7), stack, V(.62, topY + .0045, -.78));
    for (const [x, z, sx] of [[-.45, -.58, .12], [-.30, -.63, .08], [-.18, -.58, .07]]) {
      box(sx, .002, .004, basicInk('#536a76', .65), stack, V(x, topY + .005, z));
    }
    const stamp = mesh(new THREE.TorusGeometry(.11, .010, 8, 40), basicInk('#b85c58', .62), stack, V(.64, topY + .007, .18));
    stamp.scale.set(1, .55, 1); stamp.rotation.x = Math.PI / 2;
    // Paper clip and a fountain pen give the sheet physical scale.
    const clip = mesh(new THREE.TorusGeometry(.115, .011, 8, 32), mat('#aab8c0', {metalness: .75, roughness: .28}), stack, V(-.70, topY + .016, .58));
    clip.scale.set(1, .45, 1); clip.rotation.x = Math.PI / 2; clip.rotation.z = .3;
    const penBarrel = mesh(new THREE.CylinderGeometry(.020, .026, .86, 16), mat('#1d2730', {roughness: .30, metalness: .25}), stack, V(.56, topY + .035, .26));
    penBarrel.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(.023, .023, .18, 16), mat('#b9c6cb', {metalness: .7, roughness: .24}), stack, V(.56, topY + .035, .73)).rotation.x = Math.PI / 2;
    mesh(new THREE.ConeGeometry(.022, .10, 12), mat('#c9b07b', {metalness: .55, roughness: .3}), stack, V(.56, topY + .035, -.26)).rotation.x = Math.PI / 2;
    // Dog-eared lower-right corner.
    const fold = mesh(new THREE.BufferGeometry(), basicInk('#d7d9d2', .45), stack, V(.94, topY + .008, -.64));
    fold.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0,-.11,0,0,0,0,.11], 3));
    fold.geometry.setIndex([0,1,2]); fold.geometry.computeVertexNormals();
  } else if (id === 'sticky-note') {
    const pad = new THREE.Group(); pad.rotation.set(.42, .1, -.02); g.add(pad);
    for (let i = 0; i < 28; i++) box(2, .012, 2, mat(i % 4 ? '#f2df77' : '#eed35d', {roughness: .85}), pad, V(0, i * .012, 0));
    const top = box(2, .006, 2, mat('#f7e58d', {roughness: .8}), pad, V(0, .34, 0));
    const curl = mesh(new THREE.ConeGeometry(.16, .16, 4), mat('#ead06a'), pad, V(.84, .4, -.84)); curl.rotation.set(.5, .4, .2);
    for (let i = 0; i < 5; i++) box(1.2, .002, .008, basicInk('#8a6438', .7), pad, V(0, .345, .52 - i * .12));
    box(.6, .002, .006, basicInk('#b05046', .75), pad, V(.15, .346, .88));
  } else {
    const book = new THREE.Group(); book.rotation.set(.28, .15, 0); g.add(book);
    box(2, .16, 1.45, mat(c.color, {roughness: .7}), book, V(0, 0, 0));
    for (let i = 0; i < 22; i++) box(1.88, .006, 1.34, paper, book, V(.03, .085 + i * .004, 0));
    box(.08, .18, 1.45, mat('#4a3a2c', {roughness: .75}), book, V(-1.0, 0, 0));
    for (let i = 0; i < 4; i++) box(.9, .002, .012, basicInk('#cabfa1'), book, V(.25, .18, .3 - i * .1));
  }
}

function shoe(g, c, id) {
  const shoe = new THREE.Group(); shoe.rotation.set(-.12, -.2, 0); g.add(shoe);
  const soleMat = mat(id === 'running-shoe' ? '#d9dad5' : '#4c4038', {roughness: .7});
  const upperMat = mat(id === 'leather-shoe' ? '#5b4030' : c.color, {roughness: .45, metalness: id === 'leather-shoe' ? .15 : 0});
  const sole = new THREE.Shape();
  sole.moveTo(-1.0, -.28); sole.quadraticCurveTo(-1.06, -.06, -.88, -.06); sole.lineTo(.83, -.02); sole.quadraticCurveTo(1.04, .0, .99, -.16); sole.quadraticCurveTo(.9, -.3, .6, -.3); sole.lineTo(-.8, -.34); sole.quadraticCurveTo(-.98, -.34, -1.0, -.28);
  extrude(sole, .56, soleMat, shoe, -.28);
  if (id === 'slipper') {
    const upper = new THREE.Shape(); upper.moveTo(-.62, -.1); upper.quadraticCurveTo(-.2, .2, .18, -.04); upper.quadraticCurveTo(.4, -.14, .38, -.28); upper.lineTo(-.62, -.28); upper.closePath();
    extrude(upper, .52, upperMat, shoe, -.26);
  } else {
    const upper = new THREE.Shape(); upper.moveTo(-.95, -.08); upper.quadraticCurveTo(-.8, .38, -.35, .5); upper.quadraticCurveTo(.1, .6, .42, .36); upper.quadraticCurveTo(.7, .16, .82, -.02); upper.quadraticCurveTo(.6, .03, .3, .08); upper.quadraticCurveTo(-.2, .16, -.55, .05); upper.quadraticCurveTo(-.78, -.02, -.95, -.08);
    extrude(upper, .5, upperMat, shoe, -.25);
    for (let i = 0; i < 5; i++) box(.28, .012, .012, mat('#efe7d2'), shoe, V(.0 + i * .1, .38 - i * .045, .27));
    for (let i = 0; i < 3; i++) box(.42, .018, .012, mat('#f0eee8'), shoe, V(.25, .08, .27 + i * .02));
  }
  for (let i = 0; i < 5; i++) box(.027, .055, .5, mat('#2b2521'), shoe, V(-.82 + i * .07, -.33, 0));
}

function courtTexture(id) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const bg = id === 'basketball-court' ? '#a8733d' : id === 'tennis-court' ? '#3f7d5d' : '#3f6d4e';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = '#f2f5e8'; ctx.lineWidth = 9;
  if (id === 'tennis-court') {
    ctx.strokeRect(70, 46, 884, 420);
    ctx.strokeRect(120, 78, 784, 356);
    ctx.beginPath(); ctx.moveTo(512, 78); ctx.lineTo(512, 434); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(512, 180); ctx.lineTo(512, 332); ctx.stroke();
    ctx.strokeRect(512 - 170, 180, 170, 152); ctx.strokeRect(512, 180, 170, 152);
    ctx.lineWidth = 5; ctx.strokeRect(512 - 360, 120, 100, 272); ctx.strokeRect(512 + 260, 120, 100, 272);
  } else if (id === 'basketball-court') {
    ctx.strokeRect(64, 42, 896, 428);
    ctx.beginPath(); ctx.moveTo(512, 42); ctx.lineTo(512, 470); ctx.stroke();
    ctx.beginPath(); ctx.arc(512, 256, 62, 0, TAU); ctx.stroke();
    ctx.lineWidth = 7;
    for (const s of [-1, 1]) {
      ctx.strokeRect(512 + s * 330, 130, s * 140, 252);
      ctx.beginPath(); ctx.arc(512 + s * 406, 256, 190, -Math.PI / 2, Math.PI / 2, s < 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(512 + s * 420, 256, 18, 0, TAU); ctx.stroke();
    }
  } else {
    ctx.strokeRect(50, 40, 924, 432);
    ctx.beginPath(); ctx.moveTo(512, 40); ctx.lineTo(512, 472); ctx.stroke();
    ctx.beginPath(); ctx.arc(512, 256, 62, 0, TAU); ctx.stroke();
    ctx.lineWidth = 7;
    for (const s of [-1, 1]) {
      ctx.strokeRect(s < 0 ? 50 : 820, 140, 154, 232);
      ctx.strokeRect(s < 0 ? 50 : 884, 186, 90, 140);
      ctx.beginPath(); ctx.arc(s < 0 ? 140 : 884, 256, 44, -Math.PI / 2, Math.PI / 2, s > 0); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

function court(g, c, id) {
  const court = new THREE.Group(); court.rotation.set(.4, .2, 0); g.add(court);
  const depth = id === 'tennis-court' ? .92 : id === 'basketball-court' ? 1.07 : 1.3;
  const baseColor = id === 'basketball-court' ? '#9c6a35' : id === 'tennis-court' ? '#3e7b5e' : '#3d6b4c';
  box(2, .03, depth, mat(baseColor, {roughness: .95}), court, V(0, 0, 0));
  const top = mesh(new THREE.PlaneGeometry(2, depth), mat('#ffffff', {map: courtTexture(id), roughness: .9}), court, V(0, .017, 0));
  top.rotation.x = -Math.PI / 2;
  const white = mat('#eef3e4', {roughness: .8});
  const h = depth / 2;
  if (id === 'tennis-court') {
    const netMat = new THREE.LineBasicMaterial({color: '#eef3e4', transparent: true, opacity: .62});
    const netGroup = new THREE.Group(); court.add(netGroup);
    for (let i = 0; i <= 8; i++) {
      const z = -depth * .41 + i * depth * .82 / 8;
      netGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, .015, z), V(0, .3, z)]), netMat));
    }
    for (let j = 0; j <= 4; j++) {
      const y = .015 + j * .07;
      netGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, y, -depth * .41), V(0, y, depth * .41)]), netMat));
    }
    box(.025, .025, depth * .84, mat('#eef3e4'), court, V(0, .305, 0));
    for (const z of [-depth * .42, depth * .42]) rod(V(0, 0, z), V(0, .32, z), .012, white, court);
  } else if (id === 'basketball-court') {
    box(1.8, .008, .02, white, court, V(0, .023, -h + .55));
    for (const s of [-1, 1]) {
      const board = box(.06, .38, .46, mat('#e8e5db', {roughness: .4}), court, V(s * .94, .48, 0));
      box(.05, .22, .30, mat('#c9d7de', {transparent: true, opacity: .55, roughness: .18}), court, V(s * .94, .47, 0));
      const hoop = ring(.10, .012, mat('#c46635', {metalness: .5}), court, V(s * .86, .34, 0), V(Math.PI / 2, 0, 0));
      rod(court, V(s * .94, .20, 0), V(s * .9, .36, 0), .012, mat('#aaa9a4'));
      for (let i = 0; i < 9; i++) rod(court, V(s * .86, .34, 0), V(s * (.86 - .07 * Math.cos(i / 8 * TAU)), .10, .08 * Math.sin(i / 8 * TAU)), .003, mat('#dedbd2', {transparent: true, opacity: .55}));
    }
    box(3.35, .07, 2.0, mat('#1b2428', {roughness: .9}), court, V(0, -.045, 0));
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      box(2.8, .10, .16, mat(i === 2 ? '#5e6a70' : '#39454b', {roughness: .8}), court, V(0, .02 + i * .10, s * (.62 + i * .14)));
    }
    const ballMat = mat('#bd5b2b', {roughness: .72});
    const basketball = ball(.075, ballMat, court, V(0, .085, .04));
    for (let i = 0; i < 3; i++) {
      const q = mesh(new THREE.TorusGeometry(.076, .006, 6, 24), mat('#2b201a', {roughness: .7}), court, V(0, .085, .04));
      q.rotation.set(i === 0 ? 0 : Math.PI / 2, i === 1 ? Math.PI / 2 : 0, i * .7);
    }
    for (const x of [-.72, .72]) box(.55, .08, .22, mat('#53453a', {roughness: .8}), court, V(x, .05, -.72));
    for (const x of [-.6, -.2, .2, .6]) {
      rod(court, V(x, .48, -.86), V(x, 1.0, -.64), .010, mat('#6b777d', {metalness: .5}));
      const lamp = box(.18, .04, .12, mat('#eef4e9', {emissive: '#d9eee7', emissiveIntensity: .35}), court, V(x, 1.02, -.62));
      lamp.rotation.x = -.3;
    }
  } else {
    for (const s of [-1, 1]) {
      box(.04, .42, .3, mat('#eef1ec', {metalness: .2}), court, V(s * .98, .22, 0));
      for (let i = 0; i < 6; i++) box(.03, .42, .012, basicNet('#d9e4d8', .28), court, V(s * .98, .22, -.15 + i * .06));
      box(.02, .012, .3, white, court, V(s * .96, .03, 0));
    }
  }
}

function plantTall(g, c, id, random) {
  if (id === 'bamboo') {
    const bamboo = new THREE.Group(); g.add(bamboo);
    const stalk = mat('#708d4c', {roughness: .5}), leaf = mat('#4f7540', {roughness: .6});
    for (let k = 0; k < 7; k++) {
      const x = -.8 + k * .26, z = (random() - .5) * .7, h = 1.5 + random() * .55;
      rod(V(x, -.95, z), V(x * .9 + .06, - .95 + h, z), .035, stalk, bamboo);
      for (let i = 1; i < 9; i++) {
        const y = -.95 + i * h / 9; ring(.038, .008, mat('#556f39'), bamboo, V(x * (1 - i * .01), y, z), V(Math.PI / 2, 0, 0));
        for (const s of [-1, 1]) {
          const leafMesh = mesh(new THREE.SphereGeometry(.22, 12, 8), leaf, bamboo, V(x + s * .2, y + .02, z + .1));
          leafMesh.scale.set(1, .06, .26); leafMesh.rotation.z = s * .5;
        }
      }
    }
  } else {
    const tree = new THREE.Group(); g.add(tree);
    const bark = mat('#76503a', {roughness: .95}), foliage = mat('#4c7351', {roughness: .8});
    rod(V(0, -.95, 0), V(.02, .78, 0), .0, bark, tree);
    const trunk = mesh(new THREE.CylinderGeometry(.075, .2, 2, 20), bark, tree, V(0, 0, 0));
    for (let i = 0; i < 7; i++) {
      const y = -.2 + i * .18, r = .55 - i * .055;
      const crown = mesh(new THREE.ConeGeometry(r, .5, 14), foliage, tree, V(0, y, 0));
      crown.rotation.y = i * .4;
      crown.scale.z = .8;
    }
    for (let i = 0; i < 7; i++) rod(V(.02, -.5 + i * .2, 0), V((i % 2 ? .25 : -.25), -.55 + i * .2, .18), .025, bark, tree);
  }
}

function atmosphere(g, c, id, random) {
  if (id === 'cloud') {
    const cloud = new THREE.Group(); cloud.rotation.set(.08, .2, 0); g.add(cloud);
    const white = mat('#f2f5f2', {roughness: 1, metalness: 0, flatShading: false});
    const grey = mat('#c8d2d1', {roughness: 1, metalness: 0});
    const lobes = [[-.72, .12, .06, .72], [0, .22, -.04, 1], [.72, .14, .08, .76]];
    for (const [cx, cy, cz, s] of lobes) {
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU, r = .12 + (i % 3) * .055, h = .1 + (i % 4) * .035;
        const puff = mesh(new THREE.SphereGeometry(r * s, 22, 14), i === 7 ? grey : white, cloud, V(cx + Math.cos(a) * .2 * s, cy + h, cz + Math.sin(a) * .18 * s));
        puff.scale.set(1.25, .72, .95);
      }
      for (let b = 0; b < 4; b++) {
        const bp = mesh(new THREE.SphereGeometry(.2 * s, 18, 12), b % 2 ? grey : white, cloud, V(cx + (b - 1.5) * .16 * s, cy - .03, cz + (b % 2 ? .1 : -.1)));
        bp.scale.set(1.25, .62, .9);
      }
    }
    const sprite = (x, y, z, size, tint, opacity) => {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({map: cloudTexture, color: tint, transparent: true, opacity, depthWrite: false}));
      m.position.set(x, y, z); m.scale.set(size, size * .7, 1); cloud.add(m);
    };
    for (let i = 0; i < 10; i++) sprite(-.8 + i * .18, .12, .28, .5, '#ffffff', .16);
    for (let i = 0; i < 6; i++) sprite(-.6 + i * .24, -.2, .3, .5, '#c2cdcb', .12);
  } else if (id === 'hurricane') {
    const storm = new THREE.Group(); storm.rotation.set(-1.3, 0, 0); g.add(storm);
    for (let arm = 0; arm < 5; arm++) {
      const pts = [];
      for (let i = 0; i < 42; i++) {const t = i / 41, a = arm * TAU / 5 + t * 2.8, r = .08 + t * .92; pts.push(V(Math.cos(a) * r, Math.sin(a) * r, (random() - .5) * .06));}
      const band = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .035, 8, false), mat('#dfe7e6', {roughness: 1}), storm);
      band.scale.z = .4;
    }
    const eye = ball(.12, mat('#264a58', {roughness: .5}), storm, V(0, 0, -.01));
    for (let i = 0; i < 5; i++) ring(.28 + i * .16, .012, glow('#d6e3e2', .4), storm, V(0, 0, 0));
  } else if (id === 'black-hole-event-horizon') {
    const bh = new THREE.Group(); g.add(bh);
    ball(.32, new THREE.MeshBasicMaterial({color: '#02050a'}), bh, V(0, 0, 0));
    const disk = new THREE.Group(); disk.rotation.set(1.2, .2, 0); bh.add(disk);
    for (let i = 0; i < 9; i++) ring(.55 + i * .06, .012, glow(new THREE.Color(c.color).lerp(new THREE.Color('#e1b184'), i / 12), .4 - i * .02), disk);
    pointCloud(bh, 1700, random, '#e6b77e', () => {const a = random() * TAU, r = .5 + random() * .55; return V(Math.cos(a) * r, (random() - .5) * .035, Math.sin(a) * r);}, 2.2);
    ring(.36, .018, glow('#ffffff', .9), bh, V(0, 0, 0), V(Math.PI / 2, 0, 0));
    ring(.5, .012, glow('#f7d8ae', .7), bh, V(0, 0, 0), V(1.2, .1, 0));
  } else if (id === 'crust') {
    const slab = new THREE.Group(); slab.rotation.set(-.2, .2, 0); g.add(slab);
    const colors = ['#4e5c55', '#5c5446', '#786b55', '#8d7b5d', '#a08b64', '#6f7c55'];
    for (let i = 0; i < 6; i++) box(2, .16, 1.2, mat(colors[i], {roughness: 1}), slab, V(0, -.72 + i * .16, 0));
    for (let i = 0; i < 22; i++) {
      const x = -1 + random() * 2, z = (random() - .5) * 1.1;
      const peak = mesh(new THREE.ConeGeometry(.06 + random() * .08, .1 + random() * .16, 5), mat(i % 2 ? '#7b8a6e' : '#95a081', {roughness: 1}), slab, V(x, .2, z));
      peak.rotation.y = random() * TAU;
    }
    for (let i = 0; i < 5; i++) line(slab, [V(-1, -.66 + i * .16, .61), V(1, -.66 + i * .16, .61)], '#d9d0b8', .25);
  } else if (id === 'jupiter-red-spot' || id === 'solar-flare-size' || id === 'sunspot-group') {
    const body = new THREE.Group(); g.add(body);
    if (id === 'jupiter-red-spot') {
      const planet = ball(.8, mat('#c9a27e', {roughness: .6}), body, V(0, 0, 0));
      for (let i = -5; i <= 5; i++) {
        const lat = i * .16, r = .8 * Math.cos(lat);
        ring(r, .022, mat(i % 2 ? '#d8bb98' : '#a97c5c', {roughness: .7}), body, V(0, Math.sin(lat) * .8, 0), V(Math.PI / 2, 0, 0));
      }
      const spot = mesh(new THREE.SphereGeometry(.17, 20, 14), mat('#b75a43', {roughness: .55}), body, V(.52, -.2, .55));
      spot.scale.set(1.5, .75, .5);
    } else {
      ball(.8, mat(id === 'sunspot-group' ? '#c89a5c' : '#d8a05b', {roughness: .5, emissive: '#ae5e22', emissiveIntensity: .5}), body, V(0, 0, 0));
      if (id === 'sunspot-group') {
        for (let i = 0; i < 9; i++) {const sp = ball(.045 + random() * .06, new THREE.MeshBasicMaterial({color: '#2f2118'}), body, V((random() - .5) * 1.1, (random() - .5) * 1.1, .68)); sp.scale.z = .2;}
      } else {
        for (let i = 0; i < 7; i++) {
          const loop = ring(.24 + i * .05, .015, glow('#f1c27d', .7), body, V(.35, .3, 0), V(.4, .6, i * .2));
          loop.scale.z = .4;
        }
        for (let i = 0; i < 6; i++) rod(V(.2 + i * .06, .25, .6), V(.3 + i * .06, 1.2, .45), .008, glow('#f6d18f', .8), body);
      }
    }
  } else if (id === 'protoplanetary-disk') {
    const disk = new THREE.Group(); disk.rotation.set(1.24, 0, .1); g.add(disk);
    ball(.28, mat('#f0cd92', {emissive: '#c58a3e', emissiveIntensity: .9}), g, V(0, 0, 0));
    for (let i = 0; i < 5; i++) ring(.45 + i * .13, .025, glow(new THREE.Color(c.color).lerp(new THREE.Color('#b48d6d'), i / 8), .35), disk);
    pointCloud(disk, 1400, random, c.color, () => {const a = random() * TAU, r = .4 + random() * .55; return V(Math.cos(a) * r, (random() - .5) * .04, Math.sin(a) * r);}, 2);
    for (let i = 0; i < 5; i++) {const a = i * 1.3, p = ball(.05 + i * .008, mat('#bcae9a'), disk, V(Math.cos(a) * (.55 + i * .09), 0, Math.sin(a) * (.55 + i * .09)));}
  } else if (id === 'cosmic-web' || id === 'local-void' || id === 'boots-void') {
    const web = new THREE.Group(); g.add(web);
    const nodes = [];
    for (let i = 0; i < (id.endsWith('void') ? 7 : 16); i++) nodes.push(V((random() - .5) * 1.7, (random() - .5) * 1.1, (random() - .5) * .9));
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      ball(id.endsWith('void') ? .035 : .06 + random() * .05, glow('#f6dfb5', .8), web, p);
      ring(.1 + random() * .1, .004, glow(c.color, .35), web, p, V(random() * 3, random() * 3, random() * 3));
      for (let j = i + 1; j < nodes.length; j++) if (p.distanceTo(nodes[j]) < .95 && random() > .35) {
        const a = p, b = nodes[j];
        rod(a, b, .008, glow(c.color, .35), web);
        for (let k = 1; k < 3; k++) ball(.015, glow('#fff1d4', .5), web, a.clone().lerp(b, k / 3));
      }
    }
    pointCloud(web, 700, random, c.color, () => {const a = random() * TAU, r = .3 + random() * .7; return V(Math.cos(a) * r, (random() - .5) * 1.2, Math.sin(a) * r);}, 1.8);
    if (id.endsWith('void')) {
      const shell = mesh(new THREE.SphereGeometry(1, 30, 20), new THREE.MeshBasicMaterial({color: '#07131f', transparent: true, opacity: .35, side: THREE.BackSide, depthWrite: false}), web);
    }
  } else {
    const q = new THREE.Group(); g.add(q);
    ball(.38, glow(c.color, .9), q, V(0, 0, 0));
    for (let i = 0; i < 4; i++) ring(.5 + i * .1, .008, glow(c.color, .35), q, V(0, 0, 0), V(i * .5, i * .7, 0));
    pointCloud(q, 400, random, c.color, () => {const a = random() * TAU, y = random() * 2 - 1, r = Math.sqrt(1 - y * y) * (.55 + random() * .35); return V(Math.cos(a) * r, y * .55, Math.sin(a) * r);}, 1.8);
  }
}

function quantumObject(g, c, id, random) {
  if (['tau', 'muon', 'electron-classical-radius'].includes(id)) {
    const p = new THREE.Group(); g.add(p);
    ball(.22, glow(c.color, .95), p, V(0, 0, 0));
    for (let i = 0; i < 5; i++) ring(.38 + i * .12, .008, glow(c.color, .35), p, V(0, 0, 0), V(i * .6, i * .4, 0));
    pointCloud(p, 900, random, c.color, () => {const a = random() * TAU, r = .3 + random() * .7; return V(Math.cos(a) * r, (random() - .5) * .2, Math.sin(a) * r);}, 1.8);
  } else if (id === 'gamma-ray' || id === 'x-ray' || id === 'infrared') {
    const freq = id === 'gamma-ray' ? 26 : id === 'x-ray' ? 14 : 6, amp = id === 'infrared' ? .16 : .08;
    const wave = new THREE.Group(); wave.rotation.set(-.35, .1, 0); g.add(wave);
    for (let k = 0; k < 5; k++) {
      const pts = Array.from({length: 220}, (_, i) => {const x = -1 + i / 219 * 2; return V(x, Math.sin(x * freq) * amp * (1 - Math.abs(x) * .35), -.2 + k * .1);});
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, .01, 6, false), glow(new THREE.Color(c.color).lerp(new THREE.Color('#ffffff'), k * .16), .8), wave);
    }
    pointCloud(wave, 500, random, c.color, () => V((random() - .5) * 2, (random() - .5) * .35, (random() - .5) * .3), 1.5);
  } else if (id === 'quark' || id === 'strong-force' || id === 'gluon-field') {
    const bag = new THREE.Group(); g.add(bag);
    const colors = ['#e0a274', '#8ec3d6', '#c49bd2'];
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3, p = V(Math.cos(a) * .28, Math.sin(a) * .28, 0);
      ball(.13, glow(colors[i], .95), bag, p);
      for (let j = i + 1; j < 3; j++) {
        const b = V(Math.cos(j * TAU / 3) * .28, Math.sin(j * TAU / 3) * .28, 0);
        const mid = p.clone().add(b).multiplyScalar(.5); mid.z = .1;
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p, mid, b]), 40, .018, 6, false), glow('#e3cf9a', .6), bag);
      }
    }
    const shell = mesh(new THREE.SphereGeometry(.55, 24, 18), new THREE.MeshBasicMaterial({color: c.color, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false}), bag);
    if (id === 'gluon-field') {
      for (let i = 0; i < 12; i++) {
        const pts = Array.from({length: 30}, (_, j) => {const t = j / 29; return V((random() - .5) * .9, -.5 + t * 1, (random() - .5) * .9);});
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .008, 4, false), glow(c.color, .45), bag);
      }
    }
  } else if (id === 'superstring') {
    const pts = Array.from({length: 160}, (_, i) => {const a = i / 160 * TAU; return V(Math.cos(a) * .85, Math.sin(a * 3) * .12, Math.sin(a) * .85);});
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 220, .022, 8, true), glow(c.color, .9), g);
    for (let i = 0; i < 4; i++) ring(1 + i * .1, .006, glow(c.color, .2), g, V(0, 0, 0), V(Math.PI / 2, 0, 0));
  } else if (id === 'inflation') {
    const grid = new THREE.Group(); grid.rotation.set(-.4, .1, 0); g.add(grid);
    for (let j = -6; j <= 6; j++) for (const axis of [0, 1]) {
      const pts = Array.from({length: 41}, (_, i) => {const t = i / 40 * 2 - 1; return axis ? V(j * .14, 0, t) : V(t, 0, j * .14);});
      line(grid, pts, c.color, .35);
    }
    for (let i = 0; i < 4; i++) ring(.3 + i * .2, .006, glow(c.color, .25), grid, V(0, 0, 0), V(Math.PI / 2, 0, 0));
  } else if (id === 'quantum-fluctuation' || id === 'quantum-foam-bubble') {
    const foam = new THREE.Group(); g.add(foam);
    for (let i = 0; i < 28; i++) {
      const p = V((random() - .5) * 1.6, (random() - .5) * 1.1, (random() - .5) * .8);
      const b = mesh(new THREE.SphereGeometry(.03 + random() * .09, 12, 10), new THREE.MeshBasicMaterial({color: c.color, transparent: true, opacity: .22 + random() * .3, side: THREE.DoubleSide, depthWrite: false}), foam, p);
      b.scale.set(1, .7, .8);
      if (i % 3 === 0) ring(.04 + random() * .08, .006, glow(c.color, .4), foam, p, V(random() * 3, random() * 3, 0));
    }
  } else if (id === 'neutrino') {
    const det = new THREE.Group(); g.add(det);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const x = -.8 + i * .4, z = -.32 + j * .16;
      rod(V(x, -.8, z), V(x, .5, z), .008, glow(c.color, .35), det);
    }
    const track = line(det, [V(-1, -.7, .2), V(.4, 0, .1), V(1, .55, -.1)], '#f6d8a6', .9);
    ball(.05, glow('#f6d8a6'), det, V(-1, -.7, .2));
  } else {
    const p = new THREE.Group(); g.add(p);
    ball(.3, glow(c.color, .7), p, V(0, 0, 0));
    for (let i = 0; i < 6; i++) ring(.4 + i * .09, .007, glow(c.color, .3), p, V(0, 0, 0), V(i * .5, i * .3, 0));
  }
}

export function createField(root, c, random, entry) {
  const g = new THREE.Group(); root.add(g);
  const id = (entry?.id || '').replace(/^space\./, '');
  const labels = {'sheet-of-paper': 'sheet-thickness', 'a4-paper': 'a4-long-edge', 'sticky-note': 'note-edge', book: 'book-height', 'tennis-court': 'court-length', 'basketball-court': 'court-length', 'football-field': 'pitch-length', cloud: 'cloud-width', 'black-hole-event-horizon': 'event-horizon-diameter', crust: 'crust-thickness', hurricane: 'storm-diameter', 'jupiter-red-spot': 'spot-diameter', 'solar-flare-size': 'flare-span', 'sunspot-group': 'group-span', 'protoplanetary-disk': 'disk-diameter', 'cosmic-web': 'filament-span', 'local-void': 'void-diameter', 'boots-void': 'void-diameter', bamboo: 'culm-height', redwood: 'tree-height'};
  if (['sheet-of-paper', 'a4-paper', 'sticky-note', 'book'].includes(id)) paperStack(g, c, id, random);
  else if (['shoe', 'slipper', 'running-shoe', 'leather-shoe'].includes(id)) shoe(g, c, id);
  else if (['tennis-court', 'basketball-court', 'football-field'].includes(id)) court(g, c, id);
  else if (['bamboo', 'redwood'].includes(id)) plantTall(g, c, id, random);
  else if (['cloud', 'hurricane', 'black-hole-event-horizon', 'crust', 'jupiter-red-spot', 'solar-flare-size', 'sunspot-group', 'protoplanetary-disk', 'cosmic-web', 'local-void', 'boots-void'].includes(id)) atmosphere(g, c, id, random);
  else if (id === 'cutting-board') {
    const board = new THREE.Group(); board.rotation.set(-.5, .15, 0); g.add(board);
    const wood = mat('#a77a4e', {roughness: .7});
    box(2, .12, 1.25, wood, board, V(0, 0, 0));
    for (let i = 0; i < 12; i++) line(board, [V(-.95 + i * .16, .065, -.6), V(-.7 + i * .16, .065, .6)], '#7a5636', .3);
    const hole = ring(.07, .02, mat('#3f3024'), board, V(.82, .065, -.45), V(Math.PI / 2, 0, 0));
    box(.1, .05, 1.1, wood, board, V(-1.02, 0, 0));
  } else quantumObject(g, c, id, random);
  const tall = ['bamboo', 'redwood', 'book'].includes(id);
  fit(g, tall ? 'y' : 'x');
  ref(root, labels[id] || 'reported-span', tall ? -.92 : -1.06);
}
