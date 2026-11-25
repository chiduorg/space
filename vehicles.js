import * as THREE from 'three';
import {standard as materialStandard} from '/engine/renderer/materials.js';
import {attachExternalModel} from './external-models.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const mat = (color, extra = {}) => materialStandard(color, {roughness: .52, ...extra});
const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: opacity === 1});
function mesh(geometry, material, parent, position) {
  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.copy(position);
  if (parent) parent.add(m);
  return m;
}
function box(w, h, d, material, parent, position) { return mesh(new THREE.BoxGeometry(w, h, d), material, parent, position); }
function round(parent, position, scale, material, detail = 24) {
  const m = mesh(new THREE.SphereGeometry(1, detail, Math.max(10, detail * 2 / 3)), material, parent, position);
  m.scale.set(...scale); return m;
}
function rod(parent, a, b, radius, material, radiusB = radius, segments = 12) {
  const dir = b.clone().sub(a), len = dir.length();
  if (!(len > 0)) return null;
  const m = mesh(new THREE.CylinderGeometry(radiusB, radius, len, segments), material, parent, a.clone().add(b).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(V(0, 1), dir.normalize()); return m;
}
function tube(parent, points, radius, material, segments = 40) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false), material, parent);
}
function wheel(parent, x, z, radius, material, rim) {
  const tire = mesh(new THREE.TorusGeometry(radius, radius * .18, 10, 28), material, parent, V(x, 0, z));
  tire.rotation.y = Math.PI / 2;
  const hub = mesh(new THREE.CylinderGeometry(radius * .48, radius * .48, .08, 18), rim, parent, V(x, 0, z));
 hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    rod(parent, V(x, 0, z), V(x, Math.cos(a) * radius * .38, z + Math.sin(a) * radius * .38), .012, rim);
  }
}
function fit(parent, axis = 'x', length = 2) {
  parent.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(parent), size = box.getSize(V()), scale = length / size[axis];
  const center = box.getCenter(V());
  parent.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  parent.scale.setScalar(scale);
}
function guide(parent, label, offset = -.95) {
  const a = V(-1, offset, .18), b = V(1, offset, .18), g = new THREE.Group(); g.name = 'vehicle-reference'; g.userData.decorative = true;
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineDashedMaterial({color: '#bddce2', transparent: true, opacity: .64, dashSize: .045, gapSize: .035}));
  line.computeLineDistances(); g.add(line);
  for (const p of [a, b]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().add(V(0, .05, 0)), p.clone().add(V(0, -.05, 0))]), new THREE.LineBasicMaterial({color: '#e3f5f6', transparent: true, opacity: .9})));
  parent.add(g); parent.userData.reference = {axis: 'x', kind: label, length: 2, start: a.toArray(), end: b.toArray()};
}

function carLike(parent, c, kind) {
  const paint = mat(c.color, {metalness: .45, roughness: .28}), glass = mat('#9ec6d4', {metalness: .2, roughness: .12, transparent: true, opacity: .68});
  const dark = mat('#1a2228', {roughness: .5}), chrome = mat('#c7d1d4', {metalness: .85, roughness: .22});
  const normalized = kind === 'car' ? 'sedan' : kind.replace('-car', '');
  const bus = normalized === 'bus', truck = normalized === 'truck', subway = normalized === 'subway', train = normalized === 'train';
  if (normalized === 'sedan') {
    box(1.9, .34, .72, paint, parent, V(0, .04));
    const cabin = box(1.05, .4, .62, paint, parent, V(-.02, .34));
    cabin.scale.z = .92;
    box(.95, .3, .012, glass, parent, V(-.02, .36, .32));
    box(.95, .3, .012, glass, parent, V(-.02, .36, -.32));
    box(.36, .28, .6, glass, parent, V(-.5, .35, 0));
    box(.32, .26, .6, glass, parent, V(.46, .35, 0));
    for (const x of [-.62, .62]) for (const z of [-.34, .34]) wheel(parent, x, z, .2, dark, chrome);
    for (const x of [-.92, .92]) {
      box(.03, .1, .16, mat('#e9e2c4', {metalness: .2, roughness: .3}), parent, V(x, .06, .25));
      box(.03, .1, .16, mat('#a53a35'), parent, V(x, .06, -.25));
    }
    box(.7, .03, .34, dark, parent, V(0, -.2, 0));
  } else if (bus) {
    box(2.05, .78, .62, paint, parent, V(0, .12));
    box(1.9, .2, .64, dark, parent, V(0, .52));
    for (let i = 0; i < 7; i++) {
      box(.19, .26, .01, glass, parent, V(-.82 + i * .27, .3, .32));
      box(.19, .26, .01, glass, parent, V(-.82 + i * .27, .3, -.32));
    }
    box(.2, .6, .02, glass, parent, V(.92, .15, .32));
    for (const x of [-.68, .62]) for (const z of [-.34, .34]) wheel(parent, x, z, .23, dark, chrome);
    box(2.0, .08, .5, dark, parent, V(0, -.28));
    box(.28, .1, .04, mat('#e8dfbd'), parent, V(.98, .36, .28));
  } else if (truck) {
    box(.72, .72, .62, paint, parent, V(.62, .18, 0));
    box(.55, .36, .58, paint, parent, V(.55, .57, 0));
    box(.5, .25, .012, glass, parent, V(.55, .6, .29));
    box(1.22, .62, .62, mat('#c9c4b7', {roughness: .55}), parent, V(-.32, .22, 0));
    for (let i = 0; i < 4; i++) box(.24, .12, .012, mat('#9a9588'), parent, V(-.85 + i * .28, .42, .31));
    for (const x of [-.82, .6]) for (const z of [-.34, .34]) wheel(parent, x, z, .21, dark, chrome);
    box(.1, .3, .08, dark, parent, V(.96, .3, 0));
  } else if (subway || train) {
    const metro = subway;
    box(2, .68, .55, paint, parent, V(0, .18));
    box(1.94, .25, .57, paint, parent, V(0, .55));
    for (let i = 0; i < 5; i++) {
      box(.24, .22, .012, glass, parent, V(-.82 + i * .4, .3, .28));
      box(.24, .22, .012, glass, parent, V(-.82 + i * .4, .3, -.28));
    }
    for (const x of [-.55, .55]) box(.16, .42, .02, mat('#5a6d76'), parent, V(x, .08, .3));
    for (const x of [-.72, .62]) for (const z of [-.28, .28]) wheel(parent, x, z, .13, dark, chrome);
    box(1.98, .04, .5, dark, parent, V(0, -.15));
    if (train) {
      rod(parent, V(0, .68), V(0, .9), .018, chrome);
      for (const x of [-.3, .3]) rod(parent, V(x, .9), V(x * .5, .98), .012, chrome);
    }
    if (metro) for (const x of [-.9, .9]) box(.08, .16, .5, mat('#d8d2c4'), parent, V(x, .05));
  }
}

function aircraft(parent, c, kind) {
  const hull = mat(c.color, {metalness: .45, roughness: .3}), glass = basic('#24465c', .72), engineMat = mat('#8b9aa0', {metalness: .55, roughness: .32});
  const a380 = kind === 'a380', jumbo = kind === 'boeing-747';
  const len = 2.05, r = a380 ? .17 : jumbo ? .145 : .13;
  const fuse = mesh(new THREE.CapsuleGeometry(r, len - 2 * r - .08, 12, 28), hull, parent, V(-.02, 0, 0)); fuse.rotation.z = Math.PI / 2;
  // 747 upper-deck hump and A380 full-length upper deck.
  if (jumbo || a380) {
    const upperLen = a380 ? 1.25 : .62, upperX = a380 ? -.04 : .42;
    const upper = mesh(new THREE.CylinderGeometry(r * .68, r * .7, upperLen, 18), hull, parent, V(upperX, r * .6, 0)); upper.rotation.z = Math.PI / 2;
    const upperNose = mesh(new THREE.ConeGeometry(r * .66, .22, 18), hull, parent, V(upperX + upperLen / 2 + .1, r * .58, 0)); upperNose.rotation.z = -Math.PI / 2;
  }
  for (let i = 0; i < 18; i++) box(.028, .022, .012, glass, parent, V(.82 - i * .09, .055, r * .96));
  for (let i = 0; i < 5; i++) box(.03, .03, .012, glass, parent, V(-.52 + i * .035, .11, r * .88));
  // Swept wings in three chordwise steps, with four engine pods.
  for (const s of [-1, 1]) {
    const span = a380 ? 1.02 : .92;
    for (const [x, chord, z0, z1] of [[.2, .54, 0, .3], [.04, .43, .27, .56], [-.14, .31, .52, span]]) {
      const seg = box(chord, .042, (z1 - z0) * s, hull, parent, V(x, -.025, s * (z0 + z1) / 2));
      seg.rotation.x = -s * .045; seg.rotation.z = .015;
    }
    for (const [ex, ez, er] of [[.27, .34, .085], [.12, .6, .075]]) {
      const engine = mesh(new THREE.CylinderGeometry(er, er * 1.12, .4, 16), engineMat, parent, V(ex, -.13, s * ez)); engine.rotation.z = Math.PI / 2;
      const fan = mesh(new THREE.CircleGeometry(er * .88, 16), mat('#d4dde0', {metalness: .65, roughness: .2}), parent, V(ex + .205, -.13, s * ez)); fan.rotation.y = Math.PI / 2;
      box(.3, .055, .035, hull, parent, V(ex - .055, -.055, s * ez));
    }
  }
  // Horizontal stabilizers, vertical fin, and a row of cargo doors.
  for (const s of [-1, 1]) {
    const stab = box(.28, .025, .34, hull, parent, V(-.92, .06, s * .18)); stab.rotation.y = s * .28;
  }
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(-.1, .46); finShape.lineTo(-.26, .46); finShape.lineTo(-.19, 0); finShape.closePath();
  const fin = mesh(new THREE.ExtrudeGeometry(finShape, {depth: .035, bevelEnabled: false}), hull, parent, V(-.86, .02, -.018));
  fin.rotation.z = -.06;
  box(.13, .12, .028, mat('#c7d0cd', {metalness: .4}), parent, V(-1.06, .43, 0));
  for (const s of [-1, 1]) {
    const door = box(.06, .09, .012, mat('#9aa9a8', {metalness: .3}), parent, V(-.42, -.01, s * r * .92));
  }
  parent.rotation.y = .58; parent.rotation.x = .07;
}

export function createVehicle(g, c, random, entry) {
  const id = String(entry?.id || '').replace('space.', '');
  const body = new THREE.Group(); g.add(body);
  if (id === 'bicycle') {
    const frame = mat(c.color, {metalness: .55, roughness: .3}), dark = mat('#1f282d', {roughness: .5}), chrome = mat('#c9d3d5', {metalness: .85, roughness: .22});
    for (const x of [-.62, .64]) wheel(body, x, 0, .34, dark, chrome);
    tube(body, [V(-.62, 0, 0), V(-.1, .28, 0), V(.42, .28, 0), V(.64, 0, 0)], .026, frame, 30);
    tube(body, [V(-.1, .28, 0), V(.2, -.05, 0), V(.64, 0, 0)], .022, frame, 26);
    tube(body, [V(-.1, .28, 0), V(-.15, -.15, 0), V(-.62, 0, 0)], .022, frame, 24);
    rod(body, V(.42, .28, 0), V(.55, .46, 0), .022, frame);
    box(.18, .05, .08, dark, body, V(.5, .5, 0));
    for (const z of [-.24, .24]) rod(body, V(.55, .46, 0), V(.58, .48, z), .012, chrome);
    rod(body, V(-.15, .28, 0), V(-.22, .32, 0), .02, frame);
    box(.3, .05, .16, dark, body, V(-.3, .36, 0));
    rod(body, V(-.3, .32, 0), V(-.3, .38, 0), .012, chrome);
    box(.05, .06, .34, dark, body, V(.55, .46, 0));
    rod(body, V(.22, -.05, 0), V(.22, -.05, .12), .012, chrome);
    for (const z of [-.12, .12]) box(.03, .02, .12, dark, body, V(.22, -.2, z));
    fit(body, 'x'); guide(g, 'bicycle-length', -1.02); return;
  } else if (['sedan', 'car', 'bus', 'truck', 'subway', 'subway-car', 'train', 'train-car'].includes(id)) {
    carLike(body, c, id); fit(body, 'x'); guide(g, 'vehicle-length', -1.08); referenceName(g, id); return;
  } else if (id === 'sailboat') {
    const white = mat('#e4e0d4', {roughness: .55}), wood = mat('#8a6544', {roughness: .6}), sail = mat('#eee9d9', {roughness: .8, side: THREE.DoubleSide});
    const hull = mesh(new THREE.CylinderGeometry(.22, .48, 1.9, 18, 1, false, 0, Math.PI), white, body, V(0, -.1)); hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2;
    box(1.9, .12, .45, wood, body, V(0, -.2));
    rod(body, V(0, -.1, 0), V(0, 1.25, 0), .035, wood);
    const main = new THREE.Shape(); main.moveTo(0, 0); main.lineTo(0, 1.0); main.lineTo(-.75, .05); main.closePath();
    const mainSail = mesh(new THREE.ShapeGeometry(main), sail, body, V(.03, .25, .01)); mainSail.rotation.y = .02;
    const jib = new THREE.Shape(); jib.moveTo(0, 0); jib.lineTo(0, .82); jib.lineTo(.55, .05); jib.closePath();
    mesh(new THREE.ShapeGeometry(jib), sail, body, V(-.03, .25, -.01)).rotation.y = Math.PI;
    for (let i = 0; i < 5; i++) rod(body, V(-.9 + i * .45, .0, .23), V(-.9 + i * .45, .0, -.23), .015, wood);
    fit(body, 'x'); guide(g, 'overall-length', -1.25); return;
  } else if (id === 'aircraft-carrier') {
    // HMS Queen Elizabeth (R08), 284 m. Real CC-BY Sketchfab hull, cleaned
    // materials, a readable flight deck, F-35B wing and RN deck crew.
    const hullMat = mat('#7a8588', {metalness: .2, roughness: .54});
    const deckMat = mat('#5b676a', {metalness: .1, roughness: .84});
    const deckEdge = mat('#647074', {metalness: .25, roughness: .58});
    const markMat = mat('#e4dfca', {roughness: .68});
    const glassMat = mat('#6fa6b7', {metalness: .18, roughness: .18, emissive: '#102d3a', emissiveIntensity: .38});
    const planeMat = mat('#b3bdbf', {metalness: .22, roughness: .4});
    const planeDark = mat('#2a3439', {metalness: .18, roughness: .5});
    const blackMat = mat('#141a1d', {roughness: .58});
    const redMat = mat('#6d302a', {roughness: .6});
    const foamMat = new THREE.MeshBasicMaterial({color: '#cfdfe2', transparent: true, opacity: .3, depthWrite: false});
    const sea = mesh(new THREE.PlaneGeometry(4.8, 2.2), new THREE.MeshBasicMaterial({color: '#102b38', transparent: true, opacity: .5, depthWrite: false}), g, V(0, -.37, 0));
    sea.rotation.x = -Math.PI / 2;

    const carrier = new THREE.Group(); g.add(carrier);
    carrier.rotation.x = .22;
    attachExternalModel(carrier, 'https://static.chidu.org/media/models/hms-queen-elizabeth.glb', {
      fit: 2.0,
      onReady: (model) => {
        model.rotation.y = -Math.PI / 2;
        model.position.y -= .105;
        let meshIndex = 0;
        model.traverse((object) => {
          if (!object.isMesh) return;
          if (meshIndex === 0) {
            object.material = hullMat;
          } else if (meshIndex === 1) {
            object.material = new THREE.MeshBasicMaterial({color: '#657277', side: THREE.DoubleSide});
          } else {
            object.visible = false;
          }
          object.castShadow = false;
          object.receiveShadow = false;
          meshIndex += 1;
        });
      }
    });

    // A clean, opaque flight-deck sheet over the source mesh hides its broken
    // UV atlas while keeping the authentic hull and twin-island silhouette.
    const deckCanvas = document.createElement('canvas'); deckCanvas.width = 2048; deckCanvas.height = 720;
    const dc = deckCanvas.getContext('2d');
    dc.fillStyle = '#586568'; dc.fillRect(0, 0, deckCanvas.width, deckCanvas.height);
    dc.globalAlpha = .22;
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * deckCanvas.width, y = Math.random() * deckCanvas.height;
      dc.fillStyle = i % 3 ? '#202a2d' : '#7c8585'; dc.fillRect(x, y, 2 + Math.random() * 5, 1 + Math.random() * 2);
    }
    dc.globalAlpha = 1;
    // Plate seams and runway joints.
    dc.strokeStyle = 'rgba(7,11,13,.55)'; dc.lineWidth = 4;
    for (let x = 0; x < 2048; x += 128) { dc.beginPath(); dc.moveTo(x, 0); dc.lineTo(x, 720); dc.stroke(); }
    for (let y = 0; y < 720; y += 90) { dc.beginPath(); dc.moveTo(0, y); dc.lineTo(2048, y); dc.stroke(); }
    // Yellow taxi lanes and white centreline.
    dc.strokeStyle = '#d3b35f'; dc.lineWidth = 13; dc.setLineDash([36, 26]);
    for (const y of [235, 485]) { dc.beginPath(); dc.moveTo(60, y); dc.lineTo(1530, y); dc.stroke(); }
    dc.setLineDash([]);
    dc.strokeStyle = '#f1ead4'; dc.lineWidth = 13; dc.setLineDash([42, 28]);
    dc.beginPath(); dc.moveTo(40, 360); dc.lineTo(1510, 360); dc.stroke();
    dc.setLineDash([]);
    // Landing circle and touchdown marks.
    dc.strokeStyle = 'rgba(240,234,216,.96)'; dc.lineWidth = 13;
    dc.beginPath(); dc.arc(320, 360, 128, 0, Math.PI * 2); dc.stroke();
    dc.beginPath(); dc.arc(320, 360, 88, 0, Math.PI * 2); dc.stroke();
    dc.beginPath(); dc.moveTo(250, 360); dc.lineTo(390, 360); dc.stroke();
    dc.beginPath(); dc.moveTo(320, 290); dc.lineTo(320, 430); dc.stroke();
    // Elevator outlines along the deck edges.
    dc.strokeStyle = 'rgba(226,220,199,.8)'; dc.lineWidth = 9;
    for (const [x, y] of [[530, 135], [530, 545], [820, 135], [820, 545]]) dc.strokeRect(x - 88, y - 52, 176, 104);
    // Stern pennant number and bow landing chevrons.
    dc.fillStyle = '#e6e1cd'; dc.font = '700 108px Arial, sans-serif'; dc.textAlign = 'center'; dc.textBaseline = 'middle';
    dc.fillText('R08', 125, 360);
    dc.strokeStyle = 'rgba(230,225,205,.9)'; dc.lineWidth = 12;
    for (let i = 0; i < 5; i++) {
      const x = 1240 + i * 62;
      dc.beginPath(); dc.moveTo(x, 300); dc.lineTo(x + 40, 360); dc.lineTo(x, 420); dc.stroke();
    }
    // Deck boundary lines run the full length.
    dc.strokeStyle = 'rgba(232,226,208,.8)'; dc.lineWidth = 8;
    for (const y of [16, 704]) { dc.beginPath(); dc.moveTo(0, y); dc.lineTo(2048, y); dc.stroke(); }
    // Rust and tyre streaks keep the deck from looking like a clean template.
    dc.globalAlpha = .22; dc.strokeStyle = '#181f22'; dc.lineWidth = 4;
    for (let i = 0; i < 28; i++) {
      const x = 210 + Math.random() * 420, y = 330 + Math.random() * 120;
      dc.beginPath(); dc.moveTo(x, y); dc.lineTo(x + 90 + Math.random() * 120, y + (Math.random() - .5) * 26); dc.stroke();
    }
    dc.globalAlpha = 1;
    const deckTex = new THREE.CanvasTexture(deckCanvas); deckTex.colorSpace = THREE.SRGBColorSpace; deckTex.anisotropy = 8;
    const deckShape = new THREE.Shape();
    deckShape.moveTo(-.96, -.255); deckShape.lineTo(-.96, .255); deckShape.lineTo(.60, .255); deckShape.lineTo(.60, -.255); deckShape.closePath();
    const deckSheet = mesh(new THREE.ShapeGeometry(deckShape), new THREE.MeshBasicMaterial({map: deckTex}), carrier, V(0, -.137, 0));
    deckSheet.rotation.x = -Math.PI / 2;
    // Fill any deck elevator wells with a dark hangar floor below the deck sheet.
    box(.46, .004, .46, mat('#1f292c', {roughness: .7}), carrier, V(-.35, -.152, 0));
    // Deck-edge rails and a few visible tie-down points.
    for (const z of [-.262, .262]) box(1.56, .008, .01, deckEdge, carrier, V(-.18, -.133, z));
    for (let i = 0; i < 16; i++) for (const z of [-.225, .225]) box(.004, .006, .004, markMat, carrier, V(-.9 + i * .1, -.131, z));
    // Geometry-level deck markings stay legible at the default camera distance.
    const lineMat = new THREE.MeshBasicMaterial({color: '#efe8d2'});
    const laneMat = new THREE.MeshBasicMaterial({color: '#d3b35f'});
    for (let i = 0; i < 13; i++) box(.045, .002, .012, lineMat, carrier, V(-.88 + i * .1, -.130, 0));
    for (const z of [-.095, .095]) box(1.24, .002, .008, laneMat, carrier, V(-.22, -.130, z));
    const ring = mesh(new THREE.RingGeometry(.055, .076, 32), lineMat, carrier, V(-.56, -.130, 0)); ring.rotation.x = -Math.PI / 2;
    for (const x of [-.78, -.34]) for (const z of [-.19, .19]) box(.20, .002, .004, lineMat, carrier, V(x, -.130, z));
    for (let i = 0; i < 6; i++) {
      const y = -.131 + i * .011, x = .58 + i * .07;
      box(.045, .002, .012, lineMat, carrier, V(x, y, -.07));
      box(.045, .002, .012, lineMat, carrier, V(x, y, .07));
    }
    // Strong red antifouling stripe and black boot-top along both sides.
    for (const z of [-.205, .205]) {
      box(1.86, .028, .012, redMat, carrier, V(-.02, -.300, z));
      box(1.86, .018, .012, blackMat, carrier, V(-.02, -.278, z));
    }
    // Hull plate seams follow the flare in three bands.
    for (const [z, y] of [[.262, -.158], [.255, -.188], [.245, -.218], [.232, -.248], [.215, -.278], [.195, -.308]]) {
      box(1.78, .004, .004, blackMat, carrier, V(-.03, y, z));
      box(1.78, .004, .004, blackMat, carrier, V(-.03, y, -z));
    }
    for (let i = 0; i < 5; i++) for (const z of [.258, -.258]) box(.004, .13, .004, deckEdge, carrier, V(-.78 + i * .28, -.205, z));
    // Stern and starboard R08 markings on the hull; both sides read from outside.
    const numberCanvas = document.createElement('canvas'); numberCanvas.width = 512; numberCanvas.height = 256;
    const nc = numberCanvas.getContext('2d'); nc.clearRect(0, 0, 512, 256); nc.fillStyle = '#eee9d8'; nc.font = '700 150px Arial, sans-serif'; nc.textAlign = 'center'; nc.textBaseline = 'middle'; nc.fillText('R08', 256, 128);
    const numberTex = new THREE.CanvasTexture(numberCanvas); numberTex.colorSpace = THREE.SRGBColorSpace; numberTex.anisotropy = 8;
    for (const [z, flip] of [[.272, false], [-.272, true]]) {
      const plate = mesh(new THREE.PlaneGeometry(.27, .135), new THREE.MeshBasicMaterial({map: numberTex, transparent: true, depthWrite: false}), carrier, V(-.52, -.09, z));
      if (flip) plate.rotation.y = Math.PI;
    }
    // Hangar-bay doors and hull-side vents.
    for (const [x, z] of [[-.74, .266], [-.35, .266], [-.74, -.266], [-.35, -.266]]) {
      const face = box(.20, .055, .006, blackMat, carrier, V(x, -.115, z));
      for (let i = 0; i < 4; i++) box(.19, .004, .004, deckEdge, carrier, V(x, -.126 + i * .011, z * 1.02));
    }
    // Twin Queen Elizabeth islands rebuilt over the clean hull: layered
    // bridges, starboard windows, funnel and radar mast.
    const islandMat = mat('#7d898d', {metalness: .24, roughness: .5});
    box(.17, .10, .11, islandMat, carrier, V(-.36, -.087, .16));
    box(.15, .055, .10, islandMat, carrier, V(-.36, -.015, .16));
    box(.12, .04, .08, islandMat, carrier, V(-.36, .03, .16));
    box(.13, .09, .10, islandMat, carrier, V(.405, -.092, .16));
    box(.11, .05, .09, islandMat, carrier, V(.405, -.022, .16));
    box(.085, .035, .075, islandMat, carrier, V(.405, .018, .16));
    for (const [x, ys] of [[-.36, [-.105, -.075, -.045]], [.405, [-.085, -.052, -.020]]]) {
      for (const y of ys) box(.125, .014, .005, glassMat, carrier, V(x, y, .216));
    }
    box(.055, .075, .06, blackMat, carrier, V(-.36, .088, .16));
    box(.06, .014, .065, deckEdge, carrier, V(-.36, .13, .16));
    box(.013, .12, .013, blackMat, carrier, V(.405, .095, .16));
    box(.095, .009, .016, mat('#b8c2c2', {metalness: .35, roughness: .35}), carrier, V(.405, .16, .16));
    // F-35B-style aircraft; folded wings on two parked jets, one on the ramp.
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-.045, 0); wingShape.lineTo(.012, .105); wingShape.lineTo(-.022, .115); wingShape.lineTo(-.072, .018); wingShape.closePath();
    const jet = (x, y, z, heading = 0, folded = false, scale = .72, pitch = 0) => {
      const a = new THREE.Group(); a.position.set(x, y, z); a.rotation.y = heading; a.rotation.z = pitch; a.scale.setScalar(scale); carrier.add(a);
      const fuselage = mesh(new THREE.CylinderGeometry(.028, .04, .145, 10), planeMat, a, V(0, .038, 0)); fuselage.rotation.z = -Math.PI / 2;
      const nose = mesh(new THREE.ConeGeometry(.029, .07, 10), planeMat, a, V(.104, .038, 0)); nose.rotation.z = -Math.PI / 2;
      round(a, V(.02, .068, 0), [.042, .022, .026], glassMat, 12);
      const nozzle = mesh(new THREE.CylinderGeometry(.027, .034, .035, 10), planeDark, a, V(-.095, .038, 0)); nozzle.rotation.z = -Math.PI / 2;
      for (const s of [-1, 1]) {
        const wing = new THREE.Group(); wing.position.set(-.012, .035, s * .008); wing.rotation.x = folded ? -s * 1.02 : 0; a.add(wing);
        const wm = mesh(new THREE.ShapeGeometry(wingShape), planeDark, wing, V(0, 0, 0)); wm.rotation.x = -Math.PI / 2; if (s < 0) wm.scale.z = -1;
        box(.045, .075, .006, planeDark, a, V(-.078, .09, s * .025)).rotation.x = s * .18;
        box(.06, .008, .07, planeDark, a, V(-.082, .045, 0));
      }
      for (const sx of [-.028, .028]) box(.02, .018, .016, blackMat, a, V(-.007, .012, sx));
      return a;
    };
    jet(-.64, -.134, -.07, 0, true, .8);
    jet(-.52, -.134, .13, .03, false, .8);
    jet(-.86, -.134, .10, 0, true, .76);
    jet(.79, -.070, .02, 0, false, .76, .38);
    // A Merlin-size helicopter adds a second aircraft type and scale cue.
    const heli = new THREE.Group(); heli.position.set(.06, -.128, .145); carrier.add(heli);
    round(heli, V(0, .026, 0), [.06, .022, .026], planeMat, 14);
    box(.065, .018, .026, planeMat, heli, V(.045, .03, 0));
    rod(heli, V(-.035, .03, 0), V(-.13, .028, 0), .007, planeMat, .004, 8);
    box(.012, .022, .004, planeDark, heli, V(-.13, .04, 0));
    rod(heli, V(0, .05, 0), V(0, .075, 0), .004, planeDark, .004, 6);
    box(.15, .002, .008, planeDark, heli, V(0, .078, 0)).rotation.y = .3;
    box(.15, .002, .008, planeDark, heli, V(0, .078, 0)).rotation.y = 1.87;
    for (const x of [-.038, .038]) box(.018, .008, .018, blackMat, heli, V(x, .004, .018));
    for (const x of [-.038, .038]) box(.018, .008, .018, blackMat, heli, V(x, .004, -.018));
    // Deck crew, CIWS mounts and tie-down tractors.
    const crewColors = ['#e2be59', '#4d9b6a', '#d77a5b', '#6fa8c2'];
    for (let i = 0; i < 16; i++) round(carrier, V(-.9 + (i % 8) * .14, -.132, (i % 3 === 0 ? -.16 : i % 3 === 1 ? .14 : .02)), [.006, .011, .006], mat(crewColors[i % 4]), 6);
    for (const [x, z] of [[.46, .22], [-.95, .22], [-.95, -.22]]) {
      box(.028, .026, .028, blackMat, carrier, V(x, -.132, z));
      round(carrier, V(x, -.108, z), [.022, .024, .022], mat('#d7dbd6', {roughness: .4}), 10);
    }
    // Wake: spreading foam trail, bow wave and propeller wash.
    for (const [z, rot, len] of [[0, 0, 2.1], [-.06, .035, 1.9], [.06, -.035, 1.9]]) {
      const p = mesh(new THREE.PlaneGeometry(len, .07), foamMat, g, V(-2.2, -.362, z)); p.rotation.x = -Math.PI / 2; p.rotation.z = rot;
    }
    for (let i = 0; i < 6; i++) { const p = mesh(new THREE.PlaneGeometry(.5 + i * .12, .05), foamMat, g, V(-1.3 - i * .28, -.362, -.18 - i * .07)); p.rotation.x = -Math.PI / 2; p.rotation.z = -.16; }
    for (const z of [-.18, .18]) { const p = mesh(new THREE.PlaneGeometry(.42, .06), foamMat, g, V(1.16, -.362, z)); p.rotation.x = -Math.PI / 2; p.rotation.z = z > 0 ? .45 : -.45; }
    // On a narrow phone viewport the 2.0-unit hull becomes only ~80 px wide,
    // so the flight deck and aircraft are unreadable. A mobile-only group
    // scale preserves the desktop composition while filling the stage.
    if (typeof window !== 'undefined' && window.innerWidth < 700) {
      carrier.scale.setScalar(2.3);
      carrier.position.y += .10;
    }
    guide(g, 'carrier-length', -1.25);
    return;
  } else if (id === 'cruise-ship') {
    const white = mat('#eeeae0', {roughness: .46}), navy = mat('#1d3547', {metalness: .25, roughness: .38});
    const blue = mat('#2f6a8c', {metalness: .2, roughness: .4}), dark = mat('#202a30');
    const glass = basic('#8ac1d4', .55), orange = mat('#d9823f', {roughness: .5});
    // A clean silhouette against the comparison stage reads better than a
    // translucent sea slab cutting across the dark lower hull.
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.12, -.34); hullShape.lineTo(.92, -.34);
    hullShape.quadraticCurveTo(1.26, -.32, 1.38, -.04);
    hullShape.quadraticCurveTo(1.24, .10, .96, .10);
    hullShape.lineTo(-1.12, .10); hullShape.closePath();
    const hull = mesh(new THREE.ExtrudeGeometry(hullShape, {depth: .56, bevelEnabled: false}), navy, body, V(0, 0, -.28));
    const boot = box(2.18, .045, .57, blue, body, V(.02, -.015, 0));
    for (let i = 0; i < 26; i++) {
      const x = -1.02 + i * .078;
      box(.028, .028, .012, mat('#f0d59a', {emissive: '#f0d59a', emissiveIntensity: .35}), body, V(x, -.12, .284));
      box(.028, .028, .012, mat('#f0d59a', {emissive: '#f0d59a', emissiveIntensity: .35}), body, V(x, -.12, -.284));
    }
    box(2.12, .16, .56, white, body, V(-.02, .10, 0));
    for (let i = 0; i < 22; i++) {
      box(.035, .025, .012, glass, body, V(-1.04 + i * .095, .10, .283));
    }
    const deckSpecs = [
      [2.02, .20, .54, .27],
      [1.88, .18, .50, .46],
      [1.70, .18, .47, .64],
      [1.44, .16, .43, .81],
      [1.10, .15, .40, .96],
    ];
    for (const [w, h, d, y] of deckSpecs) {
      box(w, h, d, white, body, V(-.05, y, 0));
      const row = Math.floor(w / .09);
      for (let i = 0; i < row; i++) {
        const x = -w / 2 + .05 + i * .09;
        box(.052, .055, .012, glass, body, V(x, y + .01, d / 2 + .006));
        box(.052, .055, .012, glass, body, V(x, y + .01, -d / 2 - .006));
      }
    }
    // Promenade, lifeboats, funnel, radar mast and pool.
    box(1.98, .035, .018, mat('#d8cbb4'), body, V(-.05, .37, .285));
    for (let i = 0; i < 6; i++) {
      const boat = mesh(new THREE.CylinderGeometry(.052, .052, .20, 12), orange, body, V(-.72 + i * .28, .42, .305));
      boat.rotation.z = Math.PI / 2;
      const boat2 = mesh(new THREE.CylinderGeometry(.052, .052, .20, 12), orange, body, V(-.72 + i * .28, .42, -.305));
      boat2.rotation.z = Math.PI / 2;
    }
    for (let i = 0; i < 16; i++) {
      box(.012, .06, .012, mat('#d3ccbd'), body, V(-.92 + i * .12, .54, .255));
    }
    const funnel = mesh(new THREE.CylinderGeometry(.105, .13, .42, 18), navy, body, V(-.28, 1.12, 0));
    box(.29, .035, .29, mat('#c9563f'), body, V(-.28, 1.27, 0));
    box(.27, .05, .27, dark, body, V(-.28, 1.34, 0));
    for (const x of [-.48, .48]) {
      rod(body, V(x, 1.02, -.02), V(x, 1.28, -.02), .012, mat('#c7cfd1', {metalness: .7}));
      box(.18, .025, .02, white, body, V(x, 1.20, -.02));
    }
    const pool = box(.36, .018, .22, mat('#4f9fbd', {metalness: .2, roughness: .3}), body, V(.28, 1.045, .02));
    box(.42, .035, .28, white, body, V(.28, 1.05, .02));
    box(.36, .022, .22, mat('#4f9fbd', {metalness: .2, roughness: .3}), body, V(.28, 1.055, .02));
    rod(body, V(.68, 1.04, 0), V(.68, 1.32, 0), .012, mat('#c7cfd1'));
    box(.03, .12, .03, dark, body, V(.68, 1.30, 0));
    fit(body, 'x'); guide(g, 'overall-length', -1.3); return;
  } else if (id === 'boeing-747' || id === 'airbus-a380') {
    aircraft(body, c, id); fit(body, 'x'); guide(g, 'wingspan-length', -1.2); return;
  } else if (id === 'motorcycle') {
    const paint = mat(c.color, {metalness: .5, roughness: .28}), dark = mat('#161b1e', {roughness: .45});
    for (const x of [-.62, .64]) wheel(body, x, 0, .32, dark, mat('#b9c1c1', {metalness: .8}));
    box(1.1, .26, .26, paint, body, V(0, .05));
    box(.45, .2, .38, paint, body, V(.3, .3));
    box(.42, .1, .3, dark, body, V(-.3, .28));
    rod(body, V(.55, .25, 0), V(.68, .48, 0), .02, mat('#aeb8ba'));
    for (const z of [-.22, .22]) rod(body, V(.58, .48, 0), V(.6, .5, z), .012, dark);
    rod(body, V(-.1, -.1, 0), V(-.45, -.05, 0), .05, dark);
    for (const z of [-.16, .16]) wheel(body, -.5, z, .16, dark, mat('#9a9a90'));
    fit(body, 'x'); guide(g, 'motorcycle-length', -1.1); return;
  }
  fit(body, 'x'); guide(g, 'vehicle-length', -1.1);
}
function referenceName() {}



