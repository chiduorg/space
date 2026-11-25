import * as THREE from 'three';
import {standard as materialStandard} from '/engine/renderer/materials.js';
import {createAnimal} from './animals.js';
import {createDevice} from './devices.js';
import {createVehicle} from './vehicles.js';
import {createTerrain} from './terrain.js';
import {createField} from './fields.js';

// The reference segment, never a decorative halo's bounding box, represents q.
const TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const standard = (color, extra = {}) => materialStandard(color, extra);
const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: opacity === 1});
const mesh = (geometry, material, parent, position) => {  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.copy(position);
  if (parent) parent.add(m);
  return m;
};
const boxPlain = (w, h, d, material, parent, position) => mesh(new THREE.BoxGeometry(w, h, d), material, parent, position);
function instances(parent, geometry, material, transforms) {
  const batch = new THREE.InstancedMesh(geometry, material, transforms.length), dummy = new THREE.Object3D();
  transforms.forEach((t, i) => {
    dummy.position.copy(t.position); dummy.scale.set(...(t.scale || [1, 1, 1])); dummy.quaternion.copy(t.quaternion || new THREE.Quaternion()); dummy.updateMatrix(); batch.setMatrixAt(i, dummy.matrix);
    if (t.color) batch.setColorAt(i, new THREE.Color(t.color));
  });
  batch.instanceMatrix.needsUpdate = true; batch.computeBoundingBox(); batch.computeBoundingSphere(); parent.add(batch); return batch;
}
function rodInstances(parent, material, segments, radius) {
  const transforms = segments.map(([a, b]) => ({position: a.clone().add(b).multiplyScalar(.5), scale: [1, a.distanceTo(b), 1], quaternion: new THREE.Quaternion().setFromUnitVectors(V(0, 1), b.clone().sub(a).normalize())}));
  return instances(parent, new THREE.CylinderGeometry(radius, radius, 1, 8), material, transforms);
}
function ellipsoid(parent, position, scale, material, detail = 48) {
  const m = mesh(new THREE.SphereGeometry(1, detail, Math.max(24, Math.round(detail * .62))), material, parent, position);
  m.scale.set(...scale); return m;
}
function rod(parent, a, b, radius, material, radiusB = radius) {
  const direction = b.clone().sub(a), length = direction.length();
  if (!(length > 0)) return null;
  const m = mesh(new THREE.CylinderGeometry(radiusB, radius, length, 14), material, parent, a.clone().add(b).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(V(0, 1), direction.normalize()); return m;
}
function line(parent, points, color = '#769fac', opacity = .65, dashed = false) {
  const material = dashed ? new THREE.LineDashedMaterial({color, transparent: true, opacity, dashSize: .045, gapSize: .035}) : new THREE.LineBasicMaterial({color, transparent: true, opacity});
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
  if (dashed) l.computeLineDistances(); parent.add(l); return l;
}
function curve(parent, points, radius, material, closed = false) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(56, points.length * 10), radius, 10, closed), material, parent);
}
const tube = curve;
function ring(parent, radius, tube, material, position = V(), rotation = V(Math.PI / 2)) {
  const m = mesh(new THREE.TorusGeometry(radius, tube, 12, 120), material, parent, position);
  m.rotation.set(rotation.x, rotation.y, rotation.z); return m;
}
function rng(key) {
  let seed = [...key].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
}
function fit(group, axis = 'x', length = 2) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group, true), extent = box.getSize(V())[axis];
  if (!(extent > 0) || !Number.isFinite(extent)) throw new Error('Empty spatial template');
  group.position.sub(box.getCenter(V())); group.scale.setScalar(length / extent);
  // Position must be scaled too: local geometry is centered before scaling.
  group.position.multiplyScalar(length / extent);
  return group;
}
function reference(group, axis, kind, offset = 0) {
  const a = V(), b = V(); a[axis] = -1; b[axis] = 1;
  if (axis === 'x') {a.y = b.y = offset; a.z = b.z = .19;}
  if (axis === 'y') {a.x = b.x = offset; a.z = b.z = .19;}
  const guide = new THREE.Group(); guide.name = 'comparison-reference';
  guide.userData.decorative = true;
  line(guide, [a, b], '#bddce2', .62, true);
  const cross = axis === 'x' ? V(0, .055) : V(.055);
  for (const endpoint of [a, b]) line(guide, [endpoint.clone().sub(cross), endpoint.clone().add(cross)], '#e3f5f6', .9);
  group.add(guide);
  group.userData.reference = {axis, kind, length: 2, start: a.toArray(), end: b.toArray()};
}
function halo(parent, radius, color, opacity = .12, position = V()) {
  const m = mesh(new THREE.SphereGeometry(radius, 36, 24), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: {tint: {value: new THREE.Color(color)}, alpha: {value: opacity}},
    vertexShader: 'varying vec3 n;varying vec3 p;void main(){n=normalize(mat3(modelMatrix)*normal);p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
    fragmentShader: 'uniform vec3 tint;uniform float alpha;varying vec3 n;varying vec3 p;void main(){float r=pow(1.-abs(dot(normalize(n),normalize(cameraPosition-p))),2.3);gl_FragColor=vec4(tint,r*alpha);}'
  }), parent, position);
  m.userData.decorative = true; return m;
}
function points(parent, positions, colors, size = 3.2, opacity = .85) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {pointSize: {value: size}, alpha: {value: opacity}},
    vertexShader: 'attribute vec3 color;varying vec3 tint;uniform float pointSize;void main(){tint=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointSize*14./max(2.,-p.z),1.,18.);}',
    fragmentShader: 'varying vec3 tint;uniform float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint,alpha*pow(1.-r,1.7));}'
  });
  const result = new THREE.Points(geometry, material); parent.add(result); return result;
}
function pointCloud(parent, count, random, color, sample, size = 3) {
  const positions = [], colors = [], base = new THREE.Color(color);
  for (let i = 0; i < count; i++) {
    const p = sample(i); positions.push(p.x, p.y, p.z);
    const c = base.clone().lerp(new THREE.Color('#fff0db'), random() * .55).multiplyScalar(.55 + random() * .6);
    colors.push(c.r, c.g, c.b);
  }
  return points(parent, positions, colors, size);
}

function architecture(g, c, random, entry) {
  const id = String(entry?.id || '').replace('space.', '');
  const stone = standard(c.color, {roughness: .72});
  const metal = standard('#9aafb8', {metalness: .72, roughness: .28});
  const darkMetal = standard('#33414a', {metalness: .68, roughness: .3});
  const wood = standard(c.color, {roughness: .62});
  const leaf = standard(c.color, {roughness: .86});
  if (c.variant === 'bridge' || id === 'golden-gate-bridge') {
    architectureBridge(g, c, stone, metal);
    return;
  }
  if (c.variant === 'pyramid' || id === 'great-pyramid') {
    const step = new THREE.Group(); step.rotation.y = .34;
    const pyramid = mesh(new THREE.CylinderGeometry(.1, 1.48, 2, 4).rotateY(Math.PI / 4), standard(c.color, {roughness: .78}), step, V(0, 0));
    for (let i = 0; i < 14; i++) {
      const y = -.82 + i * .13, width = .16 + 1.92 * (1 - (y + 1) / 2);
      const course = standard(i % 2 ? '#cdb38b' : '#bfa37a', {roughness: .8});
      for (const [dx, dz, sx, sz] of [[0, width / 2, width, .008], [0, -width / 2, width, .008], [width / 2, 0, .008, width], [-width / 2, 0, .008, width]]) {
        if (width > .1) boxPlain(sx, .009, sz, course, step, V(dx, y, dz));
      }
    }
    boxPlain(.16, .014, .16, standard('#d8c49a', {roughness: .7}), step, V(0, .995, 0));
    boxPlain(.18, .12, .12, standard('#5a4634', {roughness: .9}), step, V(.6, -.62, .78));
    for (const s of [-1, 1]) line(step, [V(0, 1.0, 0), V(s * 1.04, -1, s * 1.04)], '#e2cfab', .38);
    fit(step, 'y'); g.add(step); reference(g, 'y', 'original-height', .56);
    return;
  }
  if (id === 'iss') {
    const station = new THREE.Group();
    const truss = mesh(new THREE.BoxGeometry(1.85, .06, .06), metal, station);
    for (let i = 0; i < 11; i++) {
      const x = -.9 + i * .18;
      rod(station, V(x, 0, 0), V(x, .08, .08), .008, metal, .006, 6);
      rod(station, V(x, 0, 0), V(x, .08, -.08), .008, metal, .006, 6);
    }
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const panel = mesh(new THREE.BoxGeometry(.34, .7, .02), standard('#2f5c8a', {metalness: .35, roughness: .42}), station, V(s * (.25 + i * .38), .2, 0));
        panel.rotation.z = s * .02;
        for (let j = 1; j < 5; j++) line(station, [V(s * (.25 + i * .38) - .17, -.14 + j * .14, .011), V(s * (.25 + i * .38) + .17, -.14 + j * .14, .011)], '#8fb6d4', .25);
      }
      const radiator = mesh(new THREE.BoxGeometry(.5, .42, .02), standard('#d8d5ca', {roughness: .5}), station, V(s * .78, -.28, .16));
      radiator.rotation.x = s * .2;
    }
    const modules = [['#d9d6cb', .95, .2], ['#d9d6cb', .0, .18], ['#c8c4b8', -.38, .2], ['#b7b3a8', -.75, .16]];
    for (const [col, x, r] of modules) {
      const cyl = mesh(new THREE.CylinderGeometry(r, r, .34, 18), standard(col, {roughness: .5, metalness: .35}), station, V(x, .02, 0));
      cyl.rotation.z = Math.PI / 2;
      for (const z of [-r * .48, r * .48]) mesh(new THREE.CylinderGeometry(.035, .035, .36, 10), metal, station, V(x, .02, z)).rotation.z = Math.PI / 2;
    }
    mesh(new THREE.CylinderGeometry(.09, .09, .32, 14), standard('#e7e3d6'), station, V(.95, -.02, 0)).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) rod(station, V(-.9, .1, s * .12), V(-1.08, .32, s * .38), .012, metal, .007, 8);
    fit(station, 'y'); g.add(station); reference(g, 'y', 'integrated-truss-length', .72);
    return;
  }
  if (['eiffel-tower', 'taipei-101', 'shanghai-tower', 'burj-khalifa'].includes(id)) {
    architectureTower(g, id, metal, stone); return;
  }
  if (id === 'statue-of-liberty') {
    architectureStatue(g, metal); return;
  }
  if (['oak-tree', 'sequoia', 'ginkgo', 'palm-tree', 'baobab', 'cactus', 'sunflower', 'rose', 'fern', 'moss'].includes(id)) {
    architecturePlant(g, id, leaf, c); return;
  }
  architectureFurniture(g, id, wood, metal, stone, c); return;
}
function architectureBridge(g, c, stone, metal) {
  const orange = standard(c.color || '#ad6249', {roughness: .42, metalness: .4});
  mesh(new THREE.BoxGeometry(2.1, .05, .22), standard('#6d7a80', {roughness: .78}), g, V(0, -.24));
  for (const z of [-.11, .11]) {
    for (const x of [-.98, .98]) {
      mesh(new THREE.BoxGeometry(.08, .22, .08), stone, g, V(x, -.12, z));
    }
    mesh(new THREE.BoxGeometry(1.9, .035, .045), orange, g, V(0, -.02, z));
    mesh(new THREE.BoxGeometry(1.9, .02, .025), orange, g, V(0, -.075, z));
    for (let i = 0; i < 16; i++) {
      const x = -.9 + i * .12;
      rod(g, V(x, -.08, z), V(x, -.02, z), .004, orange, .004);
    }
  }
  const towerX = (c.parameters?.mainSpanM ?? 1280) / (c.parameters?.totalLengthM ?? 2737) * .9;
  for (const x of [-towerX, towerX]) {
    for (const z of [-.13, .13]) {
      mesh(new THREE.BoxGeometry(.05, .7, .045), orange, g, V(x, .1, z));
      rod(g, V(x, -.2, z), V(x, .42, z), .01, orange);
    }
    for (const y of [-.14, .08, .3]) {
      mesh(new THREE.BoxGeometry(.11, .035, .3), orange, g, V(x, y, 0));
      for (const z of [-.145, .145]) rod(g, V(x, y - .02, z), V(x + .35, y + .08, z), .006, orange);
    }
  }
  for (const z of [-.13, .13]) {
    const cable = [];
    for (let i = 0; i <= 80; i++) {
      const x = -1.02 + i / 40, ax = Math.abs(x);
      const y = ax < towerX ? .34 - .5 * (1 - (x / towerX) ** 2) : .34 - .55 * (ax - towerX) / (1.02 - towerX);
      cable.push(V(x, y, z));
      if (i % 2 === 0) rod(g, V(x, -.11, z), V(x, Math.min(y, .34), z), .003, metal);
    }
    curve(g, cable, .007, orange);
  }
  for (let i = 0; i < 24; i++) {
    const x = -.95 + i * .083;
    rod(g, V(x, -.2, -.11), V(x, -.09, .11), .004, orange);
    rod(g, V(x, -.2, .11), V(x, -.09, -.11), .004, orange);
  }
  reference(g, 'x', 'abutment-to-abutment', -.42);
}

function architectureTower(g, id, metal, stone) {
  const tower = new THREE.Group();
  if (id === 'eiffel-tower') {
    const iron = standard('#5d4a3b', {roughness: .46, metalness: .55});
    const levels = [[-.98, .52], [-.55, .38], [-.1, .26], [.4, .13], [.88, .055]];
    for (let i = 0; i < levels.length - 1; i++) {
      const [y0, w0] = levels[i], [y1, w1] = levels[i + 1];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        rod(tower, V(sx * w0, y0, sz * w0), V(sx * w1, y1, sz * w1), .025, iron, .016);
        if (i < 2) rod(tower, V(sx * w0, y0, sz * w0), V(sx * w1 * .5, y1, sz * w1 * .5), .014, iron, .010);
      }
      for (const y of [y0 + .12, (y0 + y1) / 2]) {
        const w = w0 * (1 - (y - y0) / (y1 - y0) * .5);
        line(tower, [V(-w, y, -w), V(w, y, -w), V(w, y, w), V(-w, y, w), V(-w, y, -w)], '#9a7658', .72);
        line(tower, [V(-w, y, -w), V(w, y, w)], '#9a7658', .55);
        line(tower, [V(w, y, -w), V(-w, y, w)], '#9a7658', .55);
      }
      if (i < 3) mesh(new THREE.BoxGeometry(w1 * 2.25, .022, w1 * 2.25), stone, tower, V(0, y1));
    }
    for (const s of [-1, 1]) {
      line(tower, [V(s * .52, -.98, 0), V(s * .16, -.1, 0), V(s * .05, .88, 0)], '#8f6f54', .8);
    }
    rod(tower, V(0, .88), V(0, 1.36), .018, iron, .004);
    rod(tower, V(0, 1.2), V(0, 1.46), .007, iron, .001);
    for (const y of [1.0, 1.2]) ring(tower, .05, .006, metal, V(0, y, 0), V(Math.PI / 2, 0, 0));
  } else if (id === 'taipei-101') {
    const glass = standard('#6f9a9a', {metalness: .45, roughness: .22});
    const green = standard('#4e7d74', {metalness: .35, roughness: .3});
    const base = mesh(new THREE.BoxGeometry(.7, .35, .7), stone, tower, V(0, -.82));
    for (let i = 0; i < 8; i++) {
      const y = -.62 + i * .155, w = .46 - i * .018;
      const tier = mesh(new THREE.CylinderGeometry(w * 1.15, w * .82, .14, 4), i % 2 ? glass : green, tower, V(0, y));
      tier.rotation.y = Math.PI / 4;
      mesh(new THREE.BoxGeometry(w * 2.0, .015, w * 2.0), metal, tower, V(0, y + .07));
    }
    for (let i = 0; i < 4; i++) {
      const y = -.1 + i * .16, w = .28 - i * .04;
      const tier = mesh(new THREE.CylinderGeometry(w * 1.2, w * .8, .14, 4), glass, tower, V(0, y));
      tier.rotation.y = Math.PI / 4;
    }
    rod(tower, V(0, .72), V(0, 1.4), .035, metal, .006);
    for (const y of [.82, 1.02, 1.22]) ring(tower, .06, .008, metal, V(0, y, 0), V(Math.PI / 2, 0, 0));
  } else if (id === 'shanghai-tower') {
    const glass = standard('#7fa8b2', {metalness: .5, roughness: .18});
    const band = standard('#b7d4d6', {metalness: .3, roughness: .3});
    for (let i = 0; i < 12; i++) {
      const t = i / 11, y = -.95 + t * 1.75, w = .48 * (1 - t * .78);
      const seg = mesh(new THREE.CylinderGeometry(w * .9, w, .16, 24, 1, true), glass, tower, V(0, y));
      seg.rotation.y = t * 1.2;
      const ribbon = mesh(new THREE.TorusGeometry(w * .92, .012, 6, 40, Math.PI * 1.2), band, tower, V(0, y + .08));
      ribbon.rotation.x = Math.PI / 2; ribbon.rotation.z = t * 1.2;
    }
    const crown = mesh(new THREE.CylinderGeometry(.06, .2, .18, 16, 1, true), band, tower, V(0, .94));
    crown.rotation.y = .5;
    rod(tower, V(0, .98), V(0, 1.22), .018, metal, .003);
  } else {
    // Burj Khalifa: a Y-shaped, three-winged glass tower with setback tiers,
    // podium, tapered crown and stepped spire. The old stacked boxes read as a
    // generic skyscraper and lost the building's silhouette.
    const glass = standard('#8fb4c2', {metalness: .55, roughness: .18});
    const glassDark = standard('#638c9e', {metalness: .45, roughness: .24});
    const silver = standard('#d1dcdd', {metalness: .5, roughness: .24});
    const warm = standard('#dfb77f', {emissive: '#b98248', emissiveIntensity: .28, roughness: .5});
    const slab = standard('#273844', {roughness: .9});
    const pool = standard('#3f788f', {metalness: .3, roughness: .16});
    mesh(new THREE.CylinderGeometry(.96, 1.08, .10, 40), standard('#4b606c', {roughness: .55, metalness: .25}), tower, V(0, -1.03));
    mesh(new THREE.CylinderGeometry(.78, .84, .05, 40), pool, tower, V(0, -.96));
    for (const [x, z, w, d, h] of [[-.52,.72,.38,.22,.16],[.55,.65,.34,.2,.14],[-.62,-.58,.3,.2,.12],[.62,-.55,.26,.18,.11]]) {
      mesh(new THREE.BoxGeometry(w, h, d), stone, tower, V(x, -.96 + h / 2, z));
    }
    // Three wings rotate around the core every tier; the footprint shrinks
    // smoothly while alternating facade tones suggest the curtain-wall bands.
    for (let i = 0; i < 13; i++) {
      const t = i / 12, y = -.83 + t * 1.15, w = .108 * (1 - .72 * t);
      const core = mesh(new THREE.BoxGeometry(w * .98, .155, w * .98), [glass, glass, slab, slab, glass, glass], tower, V(0, y));
      core.rotation.y = t * .16;
      for (let k = 0; k < 3; k++) {
        const a = k * TAU / 3 + t * .15;
        const wing = mesh(new THREE.BoxGeometry(w * 2.32, .132, w * .21), [glass, glass, slab, slab, glass, glass], tower, V(Math.cos(a) * w * .82, y, Math.sin(a) * w * .82));
        wing.rotation.y = -a;
        mesh(new THREE.BoxGeometry(w * .024, .036, w * .225), warm, tower, V(Math.cos(a) * w * 1.96, y + .00, Math.sin(a) * w * 1.96)).rotation.y = -a;
        // Four recessed curtain-wall bands per tier make the floors readable
        // even when the tower is fitted to the station's height.
        for (let f = 0; f < 4; f++) {
          const fy = y - .058 + f * .040;
          mesh(new THREE.BoxGeometry(w * 2.34, .006, w * .215), silver, tower, V(Math.cos(a) * w * .82, fy, Math.sin(a) * w * .82)).rotation.y = -a;
          mesh(new THREE.BoxGeometry(w * 1.00, .005, w * 1.00), silver, tower, V(0, fy, 0)).rotation.y = t * .16;
        }
        for (const u of [-.55, .55]) {
          const px = Math.cos(a) * w * .76 + Math.cos(a + Math.PI / 2) * w * .075 * u;
          const pz = Math.sin(a) * w * .76 + Math.sin(a + Math.PI / 2) * w * .075 * u;
          mesh(new THREE.BoxGeometry(w * .010, .132, w * .010), silver, tower, V(px, y, pz));
        }
      }
      for (let k = 0; k < 3; k++) {
        const a = k * TAU / 3 + t * .15;
        mesh(new THREE.BoxGeometry(w * .024, .105, w * .024), silver, tower, V(Math.cos(a) * w * 1.58, y, Math.sin(a) * w * 1.58)).rotation.y = -a;
      }
    }
    // Crown: three converging tips, a lantern, the main spire and aircraft mast.
    for (let k = 0; k < 3; k++) {
      const a = k * TAU / 3;
      const tip = mesh(new THREE.ConeGeometry(.075, .22, 4), glassDark, tower, V(Math.cos(a) * .105, .52, Math.sin(a) * .105));
      tip.rotation.y = -a + Math.PI / 4;
    }
    mesh(new THREE.CylinderGeometry(.075, .13, .16, 10), glassDark, tower, V(0, .62));
    mesh(new THREE.CylinderGeometry(.007, .055, .58, 12), silver, tower, V(0, .99));
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(.006 + i * .004, .01 + i * .004, .018, 10), silver, tower, V(0, .78 + i * .13));
    mesh(new THREE.CylinderGeometry(.0015, .004, .34, 8), silver, tower, V(0, 1.44));
    // Podium, fountain and a low-rise downtown ring give the tower a human
    // and urban scale instead of floating as a solitary needle.
    mesh(new THREE.CylinderGeometry(.68, .80, .12, 56), standard('#425965', {roughness: .62, metalness: .2}), tower, V(0, -1.18));
    mesh(new THREE.CylinderGeometry(.58, .64, .04, 56), pool, tower, V(0, -1.10));
    const fountain = ring(tower, .34, .022, standard('#b7e2ea', {transparent: true, opacity: .55, roughness: .16, depthWrite: false}), V(0, -1.08, 0), V(Math.PI / 2, 0, 0));
    const waterJet = mesh(new THREE.CylinderGeometry(.014, .045, .30, 10), standard('#c8f1f5', {transparent: true, opacity: .5, roughness: .12, depthWrite: false}), tower, V(0, -1.03));
    const waterGlow = mesh(new THREE.SphereGeometry(.10, 18, 12), basic('#95dceb', .34), tower, V(0, -1.00, 0));
    g.userData.update = (d, t) => { waterJet.scale.y = 1 + Math.sin(t * .9) * .10; waterGlow.material.opacity = .28 + .06 * Math.sin(t * 1.2); };
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU, r = .56 + (i % 3) * .045, h = .09 + (i % 5) * .030;
      mesh(new THREE.BoxGeometry(.075 + (i % 4) * .016, h, .070 + (i % 3) * .016), standard(i % 3 ? '#6d8490' : '#536b78', {roughness: .6, metalness: .15}), tower, V(Math.cos(a) * r, -1.12 + h / 2, Math.sin(a) * r));
      if (i % 4 === 0) mesh(new THREE.BoxGeometry(.035, .022, .035), warm, tower, V(Math.cos(a) * r, -1.12 + h - .03, Math.sin(a) * r + .04));
    }
    tower.scale.set(1.06, 1, 1.06);
    tower.rotation.y = .52;
    mesh(new THREE.CylinderGeometry(.004, .008, .26, 8), silver, tower, V(0, 1.57));
  }
  fit(tower, 'y'); g.add(tower); reference(g, 'y', id === 'eiffel-tower' ? 'total-height' : 'architectural-height', .46);
}

function architectureStatue(g, metal) {
  const statue = new THREE.Group();
  const copper = standard('#6f9f8a', {metalness: .3, roughness: .5});
  const stoneBase = standard('#a99a80', {roughness: .82});
  for (let i = 0; i < 3; i++) {
    const w = .75 - i * .12;
    mesh(new THREE.BoxGeometry(w, .15, w), i % 2 ? stoneBase : standard('#bead91', {roughness: .8}), statue, V(0, -1 + i * .15));
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    mesh(new THREE.ConeGeometry(.08, .16, 4), stoneBase, statue, V(Math.cos(a) * .45, -.78, Math.sin(a) * .45));
  }
  mesh(new THREE.CylinderGeometry(.18, .24, .35, 8), stoneBase, statue, V(0, -.55));
  const body = mesh(new THREE.CylinderGeometry(.22, .3, .85, 8, 1, true), copper, statue, V(0, -.15));
  body.rotation.y = Math.PI / 8;
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU, fold = mesh(new THREE.BoxGeometry(.03, .7, .04), copper, statue, V(Math.cos(a) * .22, -.12, Math.sin(a) * .22));
    fold.rotation.z = Math.cos(a) * .12;
  }
  ellipsoid(statue, V(0, .32, 0), [.14, .16, .14], copper, 24);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU;
    const crownSpike = mesh(new THREE.ConeGeometry(.028, .2, 6), copper, statue, V(Math.cos(a) * .16, .42, Math.sin(a) * .16)); crownSpike.rotation.set(-.25, 0, -Math.cos(a) * .4);
  }
  const arm = tube(statue, [V(-.18, .14, 0), V(-.3, .4, .04), V(-.3, .72, .08)], .055, copper, 24, 8);
  tube(statue, [V(.18, .14, 0), V(.26, .26, .05), V(.3, .34, .08)], .055, copper, 20, 8);
  mesh(new THREE.CylinderGeometry(.035, .035, .18, 8), copper, statue, V(-.3, .82, .08));
  const flame = mesh(new THREE.ConeGeometry(.06, .18, 8), standard('#d9a24c', {metalness: .5, roughness: .3}), statue, V(-.3, .96, .08));
  flame.rotation.z = .15;
  const tablet = mesh(new THREE.BoxGeometry(.1, .24, .03), copper, statue, V(.31, .2, .06));
  tablet.rotation.z = -.3;
  fit(statue, 'y'); g.add(statue); reference(g, 'y', 'statue-height', .58);
}

function architecturePlant(g, id, leaf, c) {
  const plant = new THREE.Group();
  const bark = standard(id === 'baobab' ? '#8d6f4d' : '#5d4634', {roughness: .9});
  const darkLeaf = standard(new THREE.Color(c.color).multiplyScalar(.62).getStyle(), {roughness: .9});
  const lightLeaf = standard(new THREE.Color(c.color).multiplyScalar(1.14).getStyle(), {roughness: .85});
  if (id === 'moss') {
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * TAU, r = Math.random() * .5;
      ellipsoid(plant, V(Math.cos(a) * r, -.03 + Math.random() * .06, Math.sin(a) * r * .6), [.08 + Math.random() * .12, .05, .08], i % 3 ? darkLeaf : leaf, 8);
      rod(plant, V(Math.cos(a) * r, .02, Math.sin(a) * r * .6), V(Math.cos(a) * r, .18 + Math.random() * .16, Math.sin(a) * r * .6), .008, standard('#6f8a4a'));
    }
  } else if (id === 'fern') {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, base = V(0, -.85, 0);
      const pts = [base, V(Math.cos(a) * .35, -.45, Math.sin(a) * .35), V(Math.cos(a) * .7, .05, Math.sin(a) * .7), V(Math.cos(a) * .55, .55, Math.sin(a) * .55)];
      tube(plant, pts, .012, standard('#557a4f'), 30, 6);
      for (let j = 1; j < 7; j++) {
        const p = pts[1].clone().lerp(pts[3], j / 7);
        const side = V(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(.18 * (1 - j / 9));
        for (const s of [-1, 1]) {
          const leaflet = ellipsoid(plant, p.clone().add(side.clone().multiplyScalar(s)), [.16, .025, .05], j % 2 ? leaf : darkLeaf, 12);
          leaflet.rotation.y = a + s * .5; leaflet.rotation.z = s * .25;
        }
      }
    }
  } else if (id === 'rose') {
    rod(plant, V(0, -.9, 0), V(.02, .1, 0), .035, standard('#4d6b42'));
    for (let i = 0; i < 4; i++) {
      const y = -.7 + i * .22, a = i * 1.7;
      rod(plant, V(0, y, 0), V(Math.cos(a) * .3, y + .08, Math.sin(a) * .3), .018, standard('#4d6b42'));
      ellipsoid(plant, V(Math.cos(a) * .32, y + .1, Math.sin(a) * .32), [.16, .03, .09], darkLeaf, 14).rotation.y = a;
    }
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU;
      const petal = ellipsoid(plant, V(Math.cos(a) * .06, .18 + Math.sin(a) * .02, Math.sin(a) * .06), [.12, .07, .1], i % 2 ? leaf : standard('#a83f55'), 12);
      petal.rotation.z = Math.cos(a) * .5;
    }
    ellipsoid(plant, V(0, .2, 0), [.05, .05, .05], standard('#7a2c3b'), 10);
  } else if (id === 'sunflower') {
    tube(plant, [V(0, -.95, 0), V(.02, -.3, 0), V(-.02, .55, 0), V(0, .8, 0)], .035, standard('#5d7d3f'), 24, 8);
    for (let i = 0; i < 5; i++) {
      const y = -.55 + i * .26, a = i * 2.2;
      const leafMesh = ellipsoid(plant, V(Math.cos(a) * .3, y, Math.sin(a) * .3), [.28, .025, .13], i % 2 ? leaf : darkLeaf, 16);
      leafMesh.rotation.y = a; leafMesh.rotation.z = .25;
    }
    const disk = mesh(new THREE.CylinderGeometry(.22, .22, .07, 24), standard('#4a3520'), plant, V(0, .8, 0));
    disk.rotation.x = Math.PI / 2;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU;
      const petal = ellipsoid(plant, V(Math.cos(a) * .28, .8 + Math.sin(a) * .28, .03), [.14, .055, .03], i % 2 ? leaf : standard('#e6c35a'), 10);
      petal.rotation.z = a - Math.PI / 2;
    }
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * TAU, r = Math.random() * .17;
      ellipsoid(plant, V(Math.cos(a) * r, .8 + Math.sin(a) * r, .045), [.012, .012, .006], standard('#2e2417'), 5);
    }
  } else if (id === 'cactus') {
    const trunk = mesh(new THREE.CylinderGeometry(.13, .17, 1.65, 12), standard('#5d7f4e'), plant, V(0, -.1));
    for (const [x, y, h] of [[.22, -.05, .55], [-.24, -.25, .45]]) {
      rod(plant, V(0, y, 0), V(x, y, 0), .07, standard('#5d7f4e'), .07);
      mesh(new THREE.CylinderGeometry(.08, .09, h, 10), standard('#638a54'), plant, V(x, y + h / 2));
    }
    for (let i = 0; i < 18; i++) {
      const y = -.85 + i * .095, a = i * 2.4;
      for (const s of [-1, 1]) rod(plant, V(s * .16 * Math.cos(a), y, s * .16 * Math.sin(a)), V(s * .22 * Math.cos(a), y + .02, s * .22 * Math.sin(a)), .006, standard('#d8d0b0'));
    }
  } else if (id === 'palm-tree') {
    const pts = [V(0, -.95, 0), V(.08, -.6, .03), V(-.03, -.2, -.02), V(.12, .35, .02), V(.04, .8, 0)];
    tube(plant, pts, .09, bark, 30, 10);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, tip = V(Math.cos(a) * .85, .9 + Math.sin(i) * .08, Math.sin(a) * .85);
      const mid = V(Math.cos(a) * .5, 1.08, Math.sin(a) * .5);
      tube(plant, [V(.04, .8, 0), mid, tip], .018, standard('#4f7a45'), 26, 6);
      for (let j = 1; j < 8; j++) {
        const p = mid.clone().lerp(tip, j / 8);
        for (const s of [-1, 1]) {
          const leaflet = ellipsoid(plant, p.clone().add(V(-Math.sin(a) * .12 * s, -.03, Math.cos(a) * .12 * s)), [.1, .025, .04], j % 2 ? leaf : darkLeaf, 8);
          leaflet.rotation.y = a + s * .3;
        }
      }
    }
    for (let i = 0; i < 4; i++) ellipsoid(plant, V(.04 + Math.random() * .04, .72 + i * .03, .05), [.035, .035, .035], standard('#6b4d2e'), 8);
  } else if (id === 'oak-tree') {
    const trunk = mesh(new THREE.CylinderGeometry(.11, .22, 1.5, 18), bark, plant, V(0, -.2, 0));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + .2, y = -.1 + (i % 3) * .2;
      tube(plant, [V(0, y, 0), V(Math.cos(a) * .42, y + .28, Math.sin(a) * .42), V(Math.cos(a) * .72, y + .5, Math.sin(a) * .62)], .035, bark, 22, 8);
    }
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996, r = .25 + (i % 5) * .15;
      const cluster = mesh(new THREE.IcosahedronGeometry(.2 + (i % 4) * .05, 1), i % 2 ? leaf : lightLeaf, plant, V(Math.cos(a) * r, .45 + (i % 6) * .11, Math.sin(a) * r * .75));
      cluster.scale.set(1.2, .8, 1.1);
      if (i % 3 === 0) tube(plant, [V(0, .05, 0), V(Math.cos(a) * r * .7, .4 + (i % 6) * .08, Math.sin(a) * r * .7), cluster.position.clone()], .018, bark, 16, 6);
    }
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      ellipsoid(plant, V(Math.cos(a) * .2, -.94, Math.sin(a) * .2), [.16, .05, .16], bark, 10);
    }
  } else {
    const tall = id === 'sequoia' ? 1 : 0;
    const baobab = id === 'baobab';
    const trunkH = baobab ? .55 : tall ? 1.6 : .75;
    tube(plant, [V(0, -.96, 0), V(.02, -.7, 0), V(-.03, -.2, 0), V(.02, .2 + trunkH, 0)], baobab ? .32 : .11, bark, 30, 10);
    if (baobab) {
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU;
        tube(plant, [V(0, .1, 0), V(Math.cos(a) * .42, .3, Math.sin(a) * .42), V(Math.cos(a) * .65, .55, Math.sin(a) * .65)], .025, bark, 20, 6);
        for (let j = 0; j < 3; j++) ellipsoid(plant, V(Math.cos(a) * (.42 + j * .15), .55 + j * .04, Math.sin(a) * (.42 + j * .15)), [.12, .08, .12], j % 2 ? leaf : lightLeaf, 10);
      }
    } else if (tall) {
      for (let i = 0; i < 9; i++) {
        const y = -.55 + i * .18, w = .48 * (1 - i / 12);
        const tier = mesh(new THREE.ConeGeometry(w, .35, 9), i % 2 ? leaf : darkLeaf, plant, V(0, y));
        tier.rotation.y = i * .35;
      }
    } else {
      const gold = id === 'ginkgo';
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU, r = .3 + (i % 3) * .09;
        const cluster = ellipsoid(plant, V(Math.cos(a) * r, .42 + (i % 4) * .12, Math.sin(a) * r * .7), [.22, .16, .22], gold ? (i % 2 ? standard('#c9a543') : standard('#d9bd59')) : i % 2 ? leaf : lightLeaf, 14);
        cluster.rotation.z = Math.sin(a) * .2;
        if (!gold) tube(plant, [V(0, .2, 0), V(Math.cos(a) * r * .6, .28, Math.sin(a) * r * .4), cluster.position.clone()], .018, bark, 18, 6);
      }
      if (gold) for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU;
        const fan = ellipsoid(plant, V(Math.cos(a) * .34, .25 + i * .03, Math.sin(a) * .34), [.18, .02, .12], leaf, 10);
        fan.rotation.y = a;
      }
    }
  }
  fit(plant, 'y'); g.add(plant); reference(g, 'y', 'overall-height', .55);
}

function architectureFurniture(g, id, wood, metal, stone, c) {
  const piece = new THREE.Group();
  const dark = standard('#4a3b2e', {roughness: .6});
  if (id === 'chair' || id === 'office-chair') {
    const fabric = standard(id === 'office-chair' ? '#34464f' : '#a98f6f', {roughness: .78});
    if (id === 'office-chair') {
      // Ergonomic task chair: five-star base, gas lift, tilting mechanism,
      // shaped seat, mesh back with lumbar support, headrest and armrests.
      const black=standard('#20282c',{roughness:.52});
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * TAU;
        rod(piece, V(0, -.92, 0), V(Math.cos(a) * .44, -.96, Math.sin(a) * .44), .042, black, .025);
        const caster = ellipsoid(piece, V(Math.cos(a) * .48, -.98, Math.sin(a) * .48), [.055, .038, .055], black, 10);
        caster.rotation.y = a;
      }
      mesh(new THREE.CylinderGeometry(.06, .09, .10, 12), metal, piece, V(0, -.86));
      mesh(new THREE.CylinderGeometry(.045, .045, .40, 12), metal, piece, V(0, -.58));
      mesh(new THREE.BoxGeometry(.46, .10, .38), black, piece, V(0, -.36));
      const seatShape = new THREE.Shape();
      seatShape.moveTo(-.26, -.31); seatShape.quadraticCurveTo(-.34, -.29, -.34, -.20); seatShape.lineTo(-.34, .18); seatShape.quadraticCurveTo(-.34, .30, -.26, .32);
      seatShape.lineTo(.26, .32); seatShape.quadraticCurveTo(.34, .30, .34, .18); seatShape.lineTo(.34, -.20); seatShape.quadraticCurveTo(.34, -.29, .26, -.31); seatShape.lineTo(-.26, -.31);
      const seat = mesh(new THREE.ExtrudeGeometry(seatShape, {depth: .09, bevelEnabled: true, bevelSize: .025, bevelThickness: .015, bevelSegments: 2}), fabric, piece, V(0, -.34, .02));
      seat.rotation.x = -Math.PI / 2;
      const backShape = new THREE.Shape();
      backShape.moveTo(-.27, -.42); backShape.quadraticCurveTo(-.34, -.38, -.33, -.28); backShape.lineTo(-.31, .26); backShape.quadraticCurveTo(-.30, .42, -.02, .44); backShape.quadraticCurveTo(.30, .42, .30, .26); backShape.lineTo(.32, -.28); backShape.quadraticCurveTo(.34, -.38, .27, -.42); backShape.lineTo(-.27, -.42);
      const back = mesh(new THREE.ExtrudeGeometry(backShape, {depth: .06, bevelEnabled: true, bevelSize: .018, bevelThickness: .012, bevelSegments: 2}), fabric, piece, V(0, .02, -.30));
      back.rotation.x = -.12;
      for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(.44 - i * .010, .008, .010), standard('#62777e', {roughness: .55}), piece, V(0, -.24 + i * .070, -.238));
      mesh(new THREE.BoxGeometry(.52, .045, .07), black, piece, V(0, -.34, -.33));
      for (const s of [-1, 1]) rod(piece, V(s*.30,-.30,-.33), V(s*.30,.34,-.33), .018, black);
      const head = ellipsoid(piece, V(0, .46, -.35), [.32, .10, .07], fabric, 18);
      head.rotation.x = -.18;
      rod(piece, V(0, .37, -.35), V(0, .52, -.36), .020, metal);
      for (const s of [-1, 1]) {
        rod(piece, V(s * .31, -.30, -.24), V(s * .35, -.14, -.21), .022, metal);
        mesh(new THREE.BoxGeometry(.11, .045, .34), black, piece, V(s * .35, -.11, -.06));
        rod(piece, V(s * .34, -.11, -.04), V(s * .38, .12, -.09), .018, metal);
        mesh(new THREE.BoxGeometry(.12, .045, .22), fabric, piece, V(s * .38, .14, -.10));
      }
    } else {
      // Dining chair with tapered legs, woven seat, curved back slats and side
      // stretchers. Shown at a three-quarter angle so the frame has depth.
      const woodDark = standard('#7f6750', {roughness: .62});
      const cushion = standard('#c2a887', {roughness: .9});
      piece.rotation.y = -.58;
      for (const x of [-.39, .39]) for (const z of [-.33, .33]) {
        const leg = mesh(new THREE.CylinderGeometry(.026, .044, .82, 10), wood, piece, V(x * .93, -.61, z * .93));
        leg.rotation.z = x > 0 ? -.035 : .035; leg.rotation.x = z > 0 ? .035 : -.035;
      }
      for (const z of [-.33, .33]) mesh(new THREE.BoxGeometry(.83, .035, .035), woodDark, piece, V(0, -.83, z * .92));
      mesh(new THREE.BoxGeometry(.035, .035, .67), woodDark, piece, V(-.39, -.7, 0));
      mesh(new THREE.BoxGeometry(.035, .035, .67), woodDark, piece, V(.39, -.7, 0));
      mesh(new THREE.BoxGeometry(.91, .07, .78), woodDark, piece, V(0, -.43));
      mesh(new THREE.BoxGeometry(.84, .04, .72), wood, piece, V(0, -.38));
      const seatShape = new THREE.Shape();
      seatShape.moveTo(-.32, -.38); seatShape.quadraticCurveTo(-.12, -.40, 0, -.40); seatShape.quadraticCurveTo(.12, -.40, .32, -.38);
      seatShape.quadraticCurveTo(.39, -.34, .39, -.24); seatShape.lineTo(.39, .24); seatShape.quadraticCurveTo(.39, .34, .32, .38);
      seatShape.quadraticCurveTo(.12, .40, 0, .40); seatShape.quadraticCurveTo(-.12, .40, -.32, .38);
      seatShape.quadraticCurveTo(-.39, .34, -.39, .24); seatShape.lineTo(-.39, -.24); seatShape.quadraticCurveTo(-.39, -.34, -.32, -.38);
      const seat = mesh(new THREE.ExtrudeGeometry(seatShape, {depth: .07, bevelEnabled: true, bevelSize: .020, bevelThickness: .012, bevelSegments: 2}), cushion, piece, V(0, -.30, 0));
      seat.rotation.x = -Math.PI / 2;
      const seatWelt = mesh(new THREE.ExtrudeGeometry(seatShape, {depth: .012, bevelEnabled: false}), standard('#d4bd9e', {roughness: .7}), piece, V(0, -.227, 0));
      seatWelt.rotation.x = -Math.PI / 2; seatWelt.scale.set(.94, .94, 1);
      mesh(new THREE.BoxGeometry(.86, .025, .72), woodDark, piece, V(0, -.275));
      for (const x of [-.39, .39]) {
        const post = mesh(new THREE.CylinderGeometry(.025, .036, .78, 10), wood, piece, V(x, .02, -.38));
        post.rotation.x = -.08;
      }
      // Upholstered back panel and a curved crest rail: the old five slats read
      // as a garden chair, not a dining chair with any weight or comfort.
      const backShape = new THREE.Shape();
      backShape.moveTo(-.34, -.26); backShape.quadraticCurveTo(-.36, -.32, -.28, -.32);
      backShape.lineTo(.28, -.32); backShape.quadraticCurveTo(.36, -.32, .34, -.26);
      backShape.quadraticCurveTo(.37, 0, .34, .26); backShape.quadraticCurveTo(.36, .32, .27, .32);
      backShape.lineTo(-.27, .32); backShape.quadraticCurveTo(-.36, .32, -.34, .26); backShape.quadraticCurveTo(-.37, 0, -.34, -.26);
      const backPad = mesh(new THREE.ExtrudeGeometry(backShape, {depth: .055, bevelEnabled: true, bevelSize: .018, bevelThickness: .012, bevelSegments: 2}), cushion, piece, V(0, .23, -.43));
      backPad.rotation.x = -.08;
      for (const [x, y] of [[-.17, .32], [0, .34], [.17, .32], [-.17, .10], [0, .12], [.17, .10]]) {
        ellipsoid(piece, V(x, y, -.368), [.020, .020, .010], standard('#8d7258', {roughness: .8}), 8);
      }
      curve(piece, [V(-.40, .55, -.43), V(-.24, .60, -.44), V(0, .61, -.445), V(.24, .60, -.44), V(.40, .55, -.43)], .026, wood, false);
      curve(piece, [V(-.39, -.30, -.335), V(0, -.315, -.345), V(.39, -.30, -.335)], .012, standard('#d4bd9e', {roughness: .65}), false);
      for (const x of [-.39, .39]) for (const z of [-.33, .33]) {
        mesh(new THREE.CylinderGeometry(.021, .021, .045, 10), standard('#b08d57', {metalness: .6, roughness: .3}), piece, V(x * .93, -.96, z * .93));
      }
      const shadow = mesh(new THREE.PlaneGeometry(1.35, 1.10), standard('#050a10', {transparent: true, opacity: .35, depthWrite: false}), piece, V(0, -.985, .02));
      shadow.rotation.x = -Math.PI / 2;
    }
  } else if (id === 'coffee-table') {
    // Low walnut coffee table with a lipped top, tapered legs, a magazine
    // shelf, stacked art books and a ceramic bowl.
    const walnut = standard('#7a583d', {roughness: .58});
    const top = mesh(new THREE.BoxGeometry(2.15, .085, 1.10), walnut, piece, V(0, -.20));
    mesh(new THREE.BoxGeometry(2.20, .022, 1.15), standard('#5f412d', {roughness: .5}), piece, V(0, -.145));
    mesh(new THREE.BoxGeometry(1.95, .055, .96), walnut, piece, V(0, -.50));
    for (const x of [-.92, .92]) for (const z of [-.46, .46]) {
      const leg = mesh(new THREE.CylinderGeometry(.035, .055, .78, 10), dark, piece, V(x, -.61, z));
      leg.rotation.z = x > 0 ? -.025 : .025; leg.rotation.x = z > 0 ? .025 : -.025;
    }
    for (const [x,z,w,h,d,mat] of [[-.72,-.20,.44,.045,.30,'#2f4a56'],[-.68,-.19,.40,.040,.27,'#a56d47'],[.58,.22,.34,.05,.24,'#d4c1a2']]) {
      const b = mesh(new THREE.BoxGeometry(w,h,d), standard(mat,{roughness:.7}), piece, V(x,-.10,z));
      b.rotation.y = (x<0?-.12:.18);
    }
    const bowlMat = standard('#b7a58c',{roughness:.45});
    mesh(new THREE.CylinderGeometry(.21,.15,.085,24), bowlMat, piece, V(.28,-.03,0));
    const bowlRim = mesh(new THREE.TorusGeometry(.21,.014,8,40), standard('#cabb9f',{roughness:.4}), piece, V(.28,.015,0));
    bowlRim.rotation.x = Math.PI / 2;
    const fruit = mesh(new THREE.SphereGeometry(.065,14,10), standard('#c46b3f',{roughness:.65}), piece, V(.24,.07,.02));
  } else if (id === 'nightstand' || id === 'dresser') {
    const h = id === 'dresser' ? 1.65 : .85, w = id === 'dresser' ? 1.3 : .62, d = .50;
    const caseMat = standard('#6d4f38', {roughness: .6});
    const drawerMat = standard('#8c6b4e', {roughness: .55});
    const top = mesh(new THREE.BoxGeometry(w + .06, .07, d + .06), standard('#4b3526', {roughness: .48}), piece, V(0, h / 2 - .06));
    mesh(new THREE.BoxGeometry(w, h, d), caseMat, piece, V(0, -.1));
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.035, h - .08, d + .01), standard('#5d412e', {roughness: .6}), piece, V(s * (w / 2 - .005), -.1));
    const drawers = id === 'dresser' ? 5 : 2;
    for (let i = 0; i < drawers; i++) {
      const y = (id === 'dresser' ? .58 : .14) - i * (h / (drawers + .4)), dh = h / drawers - .07;
      mesh(new THREE.BoxGeometry(w * .86, dh, .025), drawerMat, piece, V(0, y, d / 2 + .012));
      mesh(new THREE.BoxGeometry(w * .79, dh - .035, .012), standard('#3f2e22', {roughness: .75}), piece, V(0, y, d / 2 + .028));
      for (const x of [-w * .20, w * .20]) rod(piece, V(x, y, d / 2 + .035), V(x, y, d / 2 + .085), .012, metal, .006);
    }
    for (const x of [-w * .42, w * .42]) for (const z of [-d * .38, d * .38]) {
      const leg = mesh(new THREE.CylinderGeometry(.022, .030, .46, 10), dark, piece, V(x, -.80, z));
      leg.rotation.z = x > 0 ? -.03 : .03;
    }
    if (id === 'dresser') mesh(new THREE.BoxGeometry(w * 1.02, .04, d * 1.02), dark, piece, V(0, .72));
    else {
      // Bedside still life: a small banker's lamp, a book and a wind-up clock.
      mesh(new THREE.CylinderGeometry(.10, .13, .05, 14), metal, piece, V(-.17, .40, -.02));
      rod(piece, V(-.17, .42, -.02), V(-.17, .62, -.02), .018, metal);
      const shade = mesh(new THREE.ConeGeometry(.18, .17, 18, 1, true), standard('#c9b58f', {roughness: .7}), piece, V(-.17, .71, -.02));
      shade.rotation.x = Math.PI;
      mesh(new THREE.BoxGeometry(.24, .035, .17), standard('#34505d', {roughness: .7}), piece, V(.14, .43, .06));
      mesh(new THREE.BoxGeometry(.10, .055, .08), dark, piece, V(.15, .43, .06));
      mesh(new THREE.CylinderGeometry(.075, .075, .035, 18), standard('#d8cbb3', {roughness: .5}), piece, V(.17, .52, -.12));
      mesh(new THREE.BoxGeometry(.10, .06, .04), metal, piece, V(.17, .56, -.12));
    }
  } else if (id === 'bookshelf') {
    const w = 1.12, h = 1.94, d = .38;
    mesh(new THREE.BoxGeometry(w, h, .035), standard('#2e241c', {roughness: .7}), piece, V(0, -.02, -d / 2));
    for (const x of [-w / 2, w / 2]) mesh(new THREE.BoxGeometry(.055, h, d), wood, piece, V(x, -.02, 0));
    mesh(new THREE.BoxGeometry(w + .08, .06, d + .04), dark, piece, V(0, h / 2 - .01));
    mesh(new THREE.BoxGeometry(w + .08, .06, d + .04), dark, piece, V(0, -h / 2 + .01));
    for (let s = 0; s < 5; s++) {
      const y = -.92 + s * .385;
      mesh(new THREE.BoxGeometry(w, .035, d), s % 2 ? standard('#6d4f37', {roughness:.6}) : dark, piece, V(0, y, 0));
      // Six upright volumes with varied spine colours, plus a leaning book.
      for (let j = 0; j < 6; j++) {
        const bw = .065 + ((j * 7) % 5) * .012, bh = .24 + ((j * 11) % 6) * .025;
        const book = mesh(new THREE.BoxGeometry(bw, bh, d * .62), standard(['#7a4b3a','#355663','#8c7a4a','#52644c','#8f6750','#3c4a5c'][j % 6]), piece, V(-w / 2 + .08 + j * .115, y + bh / 2 + .02, .02));
        book.rotation.z = (j === 5 ? -.12 : 0);
        for (let k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(bw * .72, .006, d * .63), standard('#d9c79e', {roughness:.4}), piece, V(book.position.x, book.position.y - bh / 2 + .06 + k * .055, .02));
      }
      // A small horizontal stack anchors the composition.
      const stackY = y + .10;
      mesh(new THREE.BoxGeometry(.23, .045, .24), standard('#6e4938'), piece, V(w / 2 - .17, stackY, .03));
      mesh(new THREE.BoxGeometry(.20, .04, .22), standard('#c2aa7b'), piece, V(w / 2 - .17, stackY + .045, .03));
    }
    // Ceramic vase and trailing plant on the top shelf.
    mesh(new THREE.CylinderGeometry(.055, .08, .16, 14), standard('#b9c8c1', {roughness:.45}), piece, V(-.18, h / 2 + .06, 0));
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      ellipsoid(piece, V(-.18 + Math.cos(a) * .10, h / 2 + .12 + (i % 2) * .06, Math.sin(a) * .08), [.09, .035, .06], standard('#5d7a4f', {roughness:.85}), 10);
    }
  } else if (id === 'refrigerator') {
    const body = mesh(new THREE.BoxGeometry(1.05, 2, .72), standard('#b7c3c6', {metalness: .35, roughness: .3}), piece, V(0, -.02));
    mesh(new THREE.BoxGeometry(1.02, .02, .74), dark, piece, V(0, .3, .02));
    for (const y of [.72, -.38]) {
      mesh(new THREE.BoxGeometry(1.01, y === .72 ? .7 : 1.0, .02), standard('#c6d0d2', {metalness: .4, roughness: .25}), piece, V(0, y, .37));
      for (const x of [-.38, .38]) rod(piece, V(x, y, .4), V(x, y, .44), .016, metal, .012);
    }
    for (let i = 0; i < 5; i++) line(piece, [V(-.45, -.8 + i * .18, .39), V(.45, -.8 + i * .18, .39)], '#8d9a9e', .25);
  } else if (id === 'mattress') {
    const mat = standard('#d9d4c4', {roughness: .92});
    const bed = mesh(new THREE.BoxGeometry(2, .28, 1.6), mat, piece, V(0, 0));
    bed.geometry = new THREE.BoxGeometry(2, .28, 1.6, 10, 1, 10);
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 7; j++) {
        const q = mesh(new THREE.SphereGeometry(.018, 8, 6), standard('#b9b4a5', {roughness: .9}), piece, V(-.9 + i * .225, .15, -.65 + j * .215));
      }
    }
    for (let i = 0; i < 3; i++) line(piece, [V(-.95 + i * .62, .16, -.7), V(-.95 + i * .62, .16, .7)], '#a9a395', .22);
  } else if (id === 'wardrobe') {
    const body = mesh(new THREE.BoxGeometry(1.3, 2, .6), wood, piece, V(0, -.02));
    mesh(new THREE.BoxGeometry(1.26, .04, .62), dark, piece, V(0, .98));
    for (const x of [-.33, .33]) {
      mesh(new THREE.BoxGeometry(.62, 1.86, .02), standard('#c4b39a', {roughness: .6}), piece, V(x, -.02, .31));
      rod(piece, V(x * .75, -.1, .34), V(x * .75, .1, .34), .012, metal, .009);
    }
    for (const x of [-.55, .55]) rod(piece, V(x, -.98, 0), V(x, -.72, 0), .02, dark, .016);
  } else if (id === 'door') {
    const panel = mesh(new THREE.BoxGeometry(1.0, 2, .08), wood, piece, V(0, -.02));
    for (const y of [-.5, .5]) {
      mesh(new THREE.BoxGeometry(.72, .7, .02), standard('#c9b9a0', {roughness: .55}), piece, V(0, y, .05));
      mesh(new THREE.BoxGeometry(.6, .58, .025), standard('#b7a58b', {roughness: .6}), piece, V(0, y, .06));
    }
    for (const x of [-.52, .52]) mesh(new THREE.BoxGeometry(.06, 2.06, .12), dark, piece, V(x, 0, 0));
    ellipsoid(piece, V(.36, -.02, .09), [.045, .045, .035], metal, 10);
  } else if (id === 'backpack') {
    const fabric = standard(c.color, {roughness: .84});
    const trim = standard(new THREE.Color(c.color).multiplyScalar(.58).getStyle(), {roughness: .7});
    const accent = standard('#c9a45f', {roughness: .62});
    const metal = standard('#c4ced0', {metalness: .75, roughness: .28});
    // Structured daypack: rounded extruded body, padded back, top lid, front
    // pocket, side bottle pockets, curved shoulder straps and metal hardware.
    const bagShape = new THREE.Shape();
    const bw = .90, bh = 1.00, br = .13;
    bagShape.moveTo(-bw / 2 + br, -bh / 2);
    bagShape.lineTo(bw / 2 - br, -bh / 2);
    bagShape.quadraticCurveTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + br);
    bagShape.lineTo(bw / 2, bh / 2 - br);
    bagShape.quadraticCurveTo(bw / 2, bh / 2, bw / 2 - br, bh / 2);
    bagShape.lineTo(-bw / 2 + br, bh / 2);
    bagShape.quadraticCurveTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - br);
    bagShape.lineTo(-bw / 2, -bh / 2 + br);
    bagShape.quadraticCurveTo(-bw / 2, -bh / 2, -bw / 2 + br, -bh / 2);
    const bagGeo = new THREE.ExtrudeGeometry(bagShape, {depth: .42, bevelEnabled: true, bevelThickness: .07, bevelSize: .06, bevelSegments: 3, curveSegments: 12});
    bagGeo.translate(0, 0, -.21);
    const bag = mesh(bagGeo, fabric, piece, V(0, .34, 0));
    piece.rotation.y = -2.15;
    piece.rotation.x = .04;
    mesh(new THREE.BoxGeometry(.98, .18, .50), trim, piece, V(0, .90, 0));
    mesh(new THREE.BoxGeometry(.94, .08, .46), trim, piece, V(0, -.18, 0));
    mesh(new THREE.BoxGeometry(.84, .86, .10), standard('#9caa99', {roughness: .9, emissive: '#3f4a40', emissiveIntensity: .35}), piece, V(0, .38, -.26));
    mesh(new THREE.BoxGeometry(.80, .84, .012), basic('#929f8c'), piece, V(0, .38, -.325));
    // Horizontal lumbar cushions stand proud of the padded back panel, visible
    // in the rear three-quarter view used to show the shoulder straps.
    for (const y of [.50, .24, -.02]) {
      const pad = mesh(new THREE.CylinderGeometry(.065, .065, .66, 14), standard('#7d8b78', {roughness: .95, emissive: '#35402f', emissiveIntensity: .3}), piece, V(0, y, -.355));
      pad.rotation.z = Math.PI / 2;
    }
    for (const x of [-.34, .34]) {
      mesh(new THREE.BoxGeometry(.14, .58, .08), standard('#7d867d', {roughness: .9}), piece, V(x, .29, -.30));
    }
    const pocket = mesh(new THREE.BoxGeometry(.58, .38, .12), accent, piece, V(0, .22, .30));
    mesh(new THREE.BoxGeometry(.62, .12, .035), trim, piece, V(0, .42, .37));
    mesh(new THREE.BoxGeometry(.66, .025, .02), metal, piece, V(0, .07, .37));
    for (const x of [-.21, .21]) mesh(new THREE.BoxGeometry(.035, .08, .02), metal, piece, V(x, .25, .371));
    for (const x of [.50]) {
      const bottle = mesh(new THREE.CylinderGeometry(.07, .07, .32, 14), standard('#7d8f78', {roughness: .7}), piece, V(x, .22, .02));
      const cap = mesh(new THREE.CylinderGeometry(.045, .045, .05, 12), trim, piece, V(x, .40, .02));
    }
    for (const x of [-.26, .26]) {
      mesh(new THREE.BoxGeometry(.04, .62, .018), trim, piece, V(x, .42, .312));
      mesh(new THREE.BoxGeometry(.07, .05, .03), metal, piece, V(x, .16, .322));
    }
    mesh(new THREE.BoxGeometry(.18, .10, .012), standard('#d8d2c4', {roughness: .6}), piece, V(0, .66, .305));
    mesh(new THREE.BoxGeometry(.54, .028, .012), basic('#dfe4da', .85), piece, V(0, .53, .307));
    // Shoulder straps wrap behind the pack and end in adjustable buckles.
    for (const x of [-.33, .33]) {
      tube(piece, [V(x, .84, -.22), V(x * .90, .48, -.48), V(x * .72, -.06, -.46), V(x * .52, -.22, -.16)], .048, standard('#59645a', {roughness: .9}), 28, 8);
      mesh(new THREE.BoxGeometry(.09, .07, .05), metal, piece, V(x * .54, -.10, -.30));
      mesh(new THREE.BoxGeometry(.06, .16, .02), trim, piece, V(x * .54, -.22, -.29));
    }
    ring(piece, .12, .022, trim, V(0, 1.03, -.04), V());
    // A side bottle pocket with a visible bottle; no bedroll balanced on top.
    const bottle = mesh(new THREE.CylinderGeometry(.085, .085, .36, 16), standard('#9aa9a0', {roughness: .55}), piece, V(-.52, .42, .04));
    mesh(new THREE.CylinderGeometry(.055, .055, .07, 14), trim, piece, V(-.52, .64, .04));
    mesh(new THREE.BoxGeometry(.16, .30, .20), standard('#4f5d52', {roughness: .9}), piece, V(-.52, .25, .04));
  } else {
    const h = .55, w = 1.0;
    mesh(new THREE.BoxGeometry(w, h, .5), wood, piece, V(0, -.2));
    mesh(new THREE.BoxGeometry(w * .9, .18, .02), dark, piece, V(0, .02, .26));
    rod(piece, V(0, .02, .29), V(0, .02, .34), .015, metal, .01);
    for (const x of [-.4, .4]) for (const z of [-.18, .18]) rod(piece, V(x, -.98, z), V(x, -.5, z), .022, dark, .018);
  }
  fit(piece, 'y'); g.add(piece); reference(g, 'y', 'overall-height', .56);
}
function terrain(g, c, random, entry) {
  return createTerrain(g, c, random, entry);
}
function field(g, c, random, entry) {
  return createField(g, c, random, entry);
}
function coin(g, c, random, entry) {
  const id = String(entry?.id || '').replace(/^space\./, '');
  if (id === 'coffee-cup') {
    const ceramic = standard(c.color || '#9aa4a4', {roughness: .34, metalness: .08}), coffee = standard('#3d2a20', {roughness: .28, side: THREE.DoubleSide});
    mesh(new THREE.CylinderGeometry(.68, .54, 1.25, 48, 1, true), ceramic, g, V(0, 0, 0));
    mesh(new THREE.CircleGeometry(.55, 48), ceramic, g, V(0, -.62, 0)).rotation.x = Math.PI / 2;
    mesh(new THREE.CircleGeometry(.65, 48), coffee, g, V(0, .56, 0)).rotation.x = -Math.PI / 2;
    ring(g, .68, .028, ceramic, V(0, .6, 0), V(Math.PI / 2, 0, 0));
    const handle = ring(g, .32, .07, ceramic, V(.72, .08, 0), V(0, Math.PI / 2, 0));
    mesh(new THREE.CylinderGeometry(1.12, 1.0, .06, 64), ceramic, g, V(0, -.68, 0));
    for (let i = 0; i < 3; i++) curve(g, [V(-.3 + i * .18, .72, 0), V(-.42 + i * .2, 1.02, .1), V(-.25 + i * .2, 1.32, -.02)], .012, basic('#f4efe6', .28));
    reference(g, 'x', 'mug-diameter', -1.15);
    return;
  }
  if (id === 'lhc') {
    const metal = standard('#9aa8b0', {metalness: .72, roughness: .3, side: THREE.DoubleSide}), beam = basic('#4f8fc4', .38), dark = standard('#31424c', {metalness: .5, roughness: .4});
    const assembly = new THREE.Group(); assembly.rotation.set(.3, -.12, 0); g.add(assembly);
    const colliderRing = mesh(new THREE.TorusGeometry(1.18, .075, 16, 120), metal, assembly);
    mesh(new THREE.TorusGeometry(.98, .018, 8, 100), beam, assembly);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU, x = Math.cos(a) * 1.18, y = Math.sin(a) * 1.18;
      const magnet = boxPlain(.16, .3, .18, dark, assembly, V(x, y, 0)); magnet.rotation.z = a;
      const cryo = boxPlain(.1, .18, .12, metal, assembly, V(Math.cos(a) * 1.03, Math.sin(a) * 1.03, 0)); cryo.rotation.z = a;
    }
    rod(assembly, V(-1.0, 0, 0), V(1.0, 0, 0), .018, beam);
    rod(assembly, V(0, -1.0, 0), V(0, 1.0, 0), .018, beam);
    mesh(new THREE.CylinderGeometry(.28, .28, .5, 24), metal, assembly, V(0, 0, 0));
    ring(assembly, .36, .026, dark, V(0, .3, 0), V(Math.PI / 2, 0, 0));
    reference(g, 'x', 'collider-circumference', -1.25);
    return;
  }
  const metal = standard(c.color, {metalness: .85, roughness: .3});
  const disk = mesh(new THREE.CylinderGeometry(1, 1, .085, 96), metal, g); disk.rotation.x = Math.PI / 2;
  for (const z of [-.048, .048]) {
    ring(g, .91, .012, metal, V(0, 0, z), V());
    ring(g, .97, .009, metal, V(0, 0, z), V());
  }
  for (let i = 0; i < 80; i++) {const a = i / 80 * TAU; rod(g, V(Math.cos(a), Math.sin(a), -.035), V(Math.cos(a), Math.sin(a), .035), .004, metal);}
  mesh(new THREE.BoxGeometry(.075, .67, .025), metal, g, V(.07, 0, .056));
  reference(g, 'x', 'coin-diameter', -1.13);
}
function pencil(g, c) {
  const paint = standard(c.color, {roughness: .4, metalness: .05, flatShading: true}), metal = standard('#c9d2d3', {metalness: .8, roughness: .22}), eraser = standard('#d88b83', {roughness: .75});
  const body = mesh(new THREE.CylinderGeometry(.043, .043, 1.72, 6), paint, g, V(-.09)); body.rotation.z = -Math.PI / 2;
  const wood = mesh(new THREE.ConeGeometry(.043, .22, 6), standard('#cba778', {roughness: .86}), g, V(.88)); wood.rotation.z = -Math.PI / 2;
  const tip = mesh(new THREE.ConeGeometry(.012, .055, 10), standard('#343c43'), g, V(.9925)); tip.rotation.z = -Math.PI / 2;
  const ferrule = mesh(new THREE.CylinderGeometry(.047, .047, .11, 32), metal, g, V(-.955)); ferrule.rotation.z = -Math.PI / 2;
  for (const x of [-.995, -.965, -.935]) ring(g, .046, .008, metal, V(x, 0, 0), V(0, Math.PI / 2, 0));
  const eraserMesh = mesh(new THREE.CylinderGeometry(.041, .043, .13, 32), eraser, g, V(-1.055)); eraserMesh.rotation.z = -Math.PI / 2;
  const b = new THREE.Group(); while (g.children.length) b.add(g.children[0]); fit(b, 'x'); g.add(b);
  reference(g, 'x', 'pencil-total-length', -.17);
}
function grain(root, c, random, entry) {
  const g = new THREE.Group(); root.add(g);
  const id = String(entry?.id || '').replace(/^space\./, '');
  const metalIds = ['aluminum-alloy', 'bronze-grain', 'steel-grain', 'titanium-alloy'];
  if (metalIds.includes(id) || id === 'concrete-aggregate') {
    const body = new THREE.Group(); g.add(body);
    const palette = id === 'bronze-grain' ? ['#b98a55', '#a97b4a', '#c99a62'] : id === 'steel-grain' ? ['#9ba8ad', '#8a969b', '#adb8bc'] : id === 'titanium-alloy' ? ['#a9adb0', '#979b9e', '#b8bbbc'] : ['#b9c0c3', '#a8b0b3', '#c9ced0'];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996, r = .22 + (i % 3) * .16;
      const crystal = mesh(new THREE.DodecahedronGeometry(.18 + (i % 4) * .06, 0), standard(palette[i % 3], {metalness: .72, roughness: .3}), body, V(Math.cos(a) * r, (i % 3 - 1) * .08, Math.sin(a) * r));
      crystal.rotation.set(random() * .8, random() * .8, random() * .8); crystal.scale.y = .72;
    }
    for (let i = 0; i < 6; i++) {
      const pts = [];
      for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; pts.push(V(Math.cos(a) * (.3 + i * .05), -.2 + Math.sin(i * 2) * .03, Math.sin(a) * (.24 + i * .03))); }
      line(body, pts, '#6c7477', .35);
    }
    fit(body, 'x'); g.add(body); reference(root, 'x', 'grain-diameter', -.52); return;
  }
  if (id === 'sand-grain') {
    const body = new THREE.Group(); g.add(body);
    const sandMat = standard('#cbb083', {roughness: .38, metalness: .04, flatShading: true});
    const edgeMat = new THREE.LineBasicMaterial({color: '#f0dfc0', transparent: true, opacity: .55});
    const shapes = [[-1.08, -.08, .1, .22, '#d7bd91'], [-.64, .12, -.16, .18, '#c1a577'], [-.2, -.06, .2, .27, '#dcc59b'], [.3, .14, -.12, .19, '#b79a6d'], [.74, -.1, .14, .24, '#d2b78b'], [1.1, .18, -.2, .15, '#cbb083']];
    for (const [x, y, z, r, color] of shapes) {
      const geo = new THREE.DodecahedronGeometry(r, 0);
      const crystal = mesh(geo, standard(color, {roughness: .38, metalness: .04, flatShading: true}), body, V(x, y, z));
      crystal.rotation.set(random() * 2, random() * 2, random() * 2); crystal.scale.set(1.1, .78, .92);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat); crystal.add(edges);
    }
    for (let i = 0; i < 10; i++) { const a = random() * TAU, r = .35 + random() * .5; mesh(new THREE.TetrahedronGeometry(.05 + random() * .04, 0), sandMat, body, V(Math.cos(a) * r, (random() - .5) * .3, Math.sin(a) * r)); }
    fit(body, 'x'); g.add(body); reference(root, 'x', 'sand-grain-diameter', -.55); return;
  }
  if (id === 'leaf') {
    const leafGroup = new THREE.Group(); g.add(leafGroup);
    const leafShape = new THREE.Shape();
    leafShape.moveTo(-.95, 0);
    leafShape.bezierCurveTo(-.8, .38, -.45, .52, -.1, .46);
    leafShape.bezierCurveTo(.28, .42, .72, .24, .98, 0);
    leafShape.bezierCurveTo(.72, -.24, .28, -.42, -.1, -.46);
    leafShape.bezierCurveTo(-.45, -.52, -.8, -.38, -.95, 0);
    const leafMesh = mesh(new THREE.ExtrudeGeometry(leafShape, {depth: .04, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2}), standard('#5b8a52', {roughness: .7}), leafGroup);
    const veinMat = standard('#9fc286', {roughness: .8}), midMat = standard('#7ba66a', {roughness: .8});
    curve(leafGroup, [V(-.88, 0, .055), V(-.45, .012, .085), V(0, .015, .095), V(.45, .008, .08), V(.9, 0, .045)], .018, midMat);
    for (let i = 0; i < 6; i++) {
      const x = -.55 + i * .14, half = .25 * Math.sqrt(Math.max(.08, 1 - (x / .8) ** 2));
      for (const s of [-1, 1]) curve(leafGroup, [V(x, 0, .075), V(x + .06, s * half * .55, .078), V(x + .12, s * half, .064)], .005, veinMat);
    }
    curve(leafGroup, [V(-.97, 0, .018), V(-1.1, 0, .012), V(-1.24, 0, .004)], .016, standard('#6d9857', {roughness: .85}));
    leafGroup.rotation.set(-.35, .06, .02);
    fit(g, 'x'); reference(root, 'x', 'leaf-length', -.55); return;
  }
  if (id === 'rice-grain') {
    const grainGroup = new THREE.Group(); g.add(grainGroup);
    const riceShape = new THREE.Shape();
    riceShape.moveTo(-1, 0);
    riceShape.bezierCurveTo(-.62, .12, -.3, .2, 0, .22);
    riceShape.bezierCurveTo(.35, .2, .72, .1, 1, 0);
    riceShape.bezierCurveTo(.7, -.11, .35, -.19, 0, -.21);
    riceShape.bezierCurveTo(-.4, -.18, -.7, -.1, -1, 0);
    mesh(new THREE.ExtrudeGeometry(riceShape, {depth: .22, bevelEnabled: true, bevelSize: .055, bevelThickness: .045, bevelSegments: 2}), standard('#ece5ce', {roughness: .7}), grainGroup, V(0, 0, -.11));
    for (let i = 0; i < 3; i++) {
      const z = -.045 + i * .045, pts = [];
      for (let j = 0; j <= 8; j++) { const x = -.72 + j * .18; pts.push(V(x, .1 - .06 * x * x, z)); }
      curve(grainGroup, pts, .007, standard('#b9ab8e', {roughness: .82}));
    }
    ellipsoid(grainGroup, V(.55, .055, .11), [.13, .055, .025], standard('#cbb99b', {roughness: .62}), 16);
    ellipsoid(grainGroup, V(-.62, -.02, .1), [.09, .025, .018], standard('#c0ad8a', {roughness: .7}), 12);
    grainGroup.rotation.set(.2, -.1, .12);
    reference(root, 'x', 'rice-kernel-length', -.4); return;
  }
  if (id === 'seed') {
    const seedMat = standard('#966143', {roughness: .6, metalness: .02});
    const shape = new THREE.Shape();
    shape.moveTo(-.9, 0);
    shape.bezierCurveTo(-.72, .38, -.35, .55, -.05, .32);
    shape.bezierCurveTo(.3, .58, .82, .34, 1, 0);
    shape.bezierCurveTo(.8, -.32, .35, -.55, -.1, -.42);
    shape.bezierCurveTo(-.5, -.55, -.85, -.3, -.9, 0);
    mesh(new THREE.ExtrudeGeometry(shape, {depth: .58, bevelEnabled: true, bevelSize: .1, bevelThickness: .08, bevelSegments: 3}), seedMat, g, V(0, 0, -.29));
    ellipsoid(g, V(-.31, .17, .39), [.22, .1, .045], standard('#e7dcc6', {roughness: .72}), 20);
    ellipsoid(g, V(-.31, .17, .43), [.09, .04, .02], standard('#bca98c', {roughness: .8}), 12);
    ellipsoid(g, V(.48, -.13, .39), [.035, .025, .018], standard('#5c3c2a', {roughness: .7}), 10);
    for (let i = 0; i < 14; i++) {
      const x = -.72 + random() * 1.5, y = -.32 + random() * .7;
      if (Math.abs(x) > .82) continue;
      ellipsoid(g, V(x, y, .39), [.025 + random() * .025, .012, .01], standard('#6f4632', {roughness: .8}), 8);
    }
    reference(root, 'x', 'seed-length', -.48); return;
  }
  // Default organic grain: rounded kernel with a surface groove.
  const body = ellipsoid(g, V(), [1, .32, .26], standard(c.color, {roughness: .83}));
  const p = body.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) * (1 - .13 * x)); } body.geometry.computeVertexNormals();
  curve(g, [V(-.91, -.07, .105), V(-.5, -.08, .24), V(.1, -.065, .253), V(.75, -.035, .17), V(.95, 0, .06)], .009, standard('#aa997a'));
  reference(root, 'x', 'grain-length', -.4);
}
function hand(g, c) {
  const body = new THREE.Group(), skin = standard(c.color, {roughness: .68});
  ellipsoid(body, V(0, -.28), [.37, .55, .12], skin);
  ellipsoid(body, V(0, -.77), [.24, .24, .1], skin);
  for (const [x, top, width] of [[-.27, .64, .08], [-.09, .98, .088], [.095, .89, .083], [.26, .62, .07]]) {
    const y0 = .02, mid = (y0 + top) / 2;
    rod(body, V(x, y0), V(x, top - width), width, skin, width * .81);
    ellipsoid(body, V(x, top - width), [width * .81, width, width * .75], skin);
    mesh(new THREE.CapsuleGeometry(width * .5, .055, 4, 10), standard('#d5bcb1', {roughness: .45}), body, V(x, top - .11, .067));
    line(body, [V(x - width * .6, mid, .08), V(x + width * .6, mid, .08)], '#887466', .35);
  }
  rod(body, V(-.23, -.38), V(-.57, .01), .105, skin, .085);
  ellipsoid(body, V(-.57, .01), [.085, .105, .08], skin);
  fit(body, 'y'); g.add(body); reference(g, 'y', 'whole-hand-length', .61);
}
function arthropod(g, c, random, entry) {
  const kind = c.variant || String(entry?.id || '').replace('space.', '');
  const bodyTint = {
    'fruit-fly': '#8a5a36', honeybee: '#b58a3e', butterfly: '#2d241b', moth: '#8b7455', dragonfly: '#4f6d62',
    mosquito: '#5f5142', termite: '#c8b69a', cicada: '#5b4a36', spider: '#3b2b23', scorpion: '#4a3223',
    crab: '#a75238', beetle: '#3a2b21', trilobite: '#6f5b46', grasshopper: '#5b6b3a', mantis: '#5e7a45'
  }[kind] || c.color;
  const body = new THREE.Group(), shell = standard(bodyTint, {roughness: .48, metalness: .08});
  if (kind === 'mite') {
    ellipsoid(body, V(), [1, .63, .48], shell);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const x = -.6 + i * .4; curve(g, [V(x, .2 * s), V(x - .25, .8 * s, .12), V(x - .4, 1.1 * s, -.15)], .022, shell);
    }
    for (let i = 0; i < 24; i++) {const x = (random() - .5) * 1.7, a = random() * TAU; rod(body, V(x, Math.cos(a) * .5, Math.sin(a) * .37), V(x + .03, Math.cos(a) * .62, Math.sin(a) * .49), .003, shell);}
  } else if (kind === 'ant') {
    const chitin = standard('#80522f', {roughness: .62, metalness: .03});
    const amber = standard('#b07a43', {roughness: .52, metalness: .05});
    const dark = standard('#26190f', {roughness: .34});
    // Head, thorax and gaster are joined through a visible two-node waist.
    ellipsoid(body, V(-.58, .08, 0), [.27, .23, .21], chitin);
    ellipsoid(body, V(-.74, -.03, 0), [.11, .055, .06], standard('#9c6c40', {roughness: .5}));
    ellipsoid(body, V(-.06, .04, 0), [.40, .18, .17], chitin);
    ellipsoid(body, V(-.14, .10, 0), [.17, .11, .15], standard('#8d5f38', {roughness: .55}));
    ellipsoid(body, V(.28, .03, 0), [.065, .065, .058], dark);
    ellipsoid(body, V(.37, .03, 0), [.09, .085, .072], chitin);
    ellipsoid(body, V(.72, .03, 0), [.44, .27, .23], amber);
    for (const [x, r] of [[.55, .24], [.72, .265], [.89, .24]]) {
      const band = mesh(new THREE.TorusGeometry(r, .006, 8, 36), dark, body, V(x, .03, 0));
      band.rotation.y = Math.PI / 2; band.scale.z = .86;
    }
    for (const s of [-1, 1]) {
      ellipsoid(body, V(-.76, .17, s * .145), [.052, .045, .040], dark);
      curve(body, [V(-.78, -.02, s * .04), V(-.90, -.10, s * .09), V(-1.00, -.13, s * .13)], .013, dark);
      curve(body, [V(-.68, .20, s * .10), V(-.82, .38, s * .18), V(-.98, .33, s * .27), V(-1.08, .20, s * .32)], .014, chitin);
      for (let i = 0; i < 3; i++) {
        const x = -.18 + i * .17, dx = (i - 1) * .27;
        curve(body, [V(x, .04, s * .12), V(x + dx * .45, .23, s * .20), V(x + dx * .95, -.06, s * .24), V(x + dx * 1.35, -.37, s * .21)], .021, dark);
      }
    }
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU, x = .55 + (i % 3) * .15, r = .24 - Math.abs(i % 3 - 1) * .02;
      rod(body, V(x, .03 + Math.sin(a) * r, Math.cos(a) * .20), V(x + .015, .03 + Math.sin(a) * (r + .06), Math.cos(a) * .26), .003, chitin);
    }
    // Compound-eye sheen, mandible teeth, tarsal claws and setae.
    for (const s of [-1, 1]) {
      const eye = ellipsoid(body, V(-.68, .16, s * .155), [.070, .058, .045], standard('#201812', {roughness: .28, metalness: .35}), 18);
      eye.rotation.z = .15;
      ellipsoid(body, V(-.655, .18, s * .165), [.020, .016, .010], standard('#b6a48a', {roughness: .3}), 8);
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * TAU;
        ellipsoid(body, V(-.70 + Math.cos(a) * .035, .16 + Math.sin(a) * .030, s * .19), [.008, .006, .003], standard('#5b452d', {roughness: .5}), 5);
      }
      const mand = curve(body, [V(-.77, -.10, s * .045), V(-.94, -.16, s * .075), V(-1.10, -.12, s * .10)], .012, dark);
      for (let k = 0; k < 2; k++) ellipsoid(body, V(-.98 - k * .045, -.15 + k * .012, s * (.07 + k * .015)), [.022, .012, .010], standard('#c9a36b', {roughness: .4}), 6);
      const legTip = V(-.18 + 2 * .17 + (1 - 1) * .27, -.06, s * .24);
      const tarsus = curve(body, [V(-.18 + 2 * .17 + .27, -.37, s * .21), V(-.10 + 2 * .17 + .27, -.42, s * .20), V(.00 + 2 * .17 + .27, -.40, s * .18)], .009, dark);
      ellipsoid(body, V(.03 + 2 * .17 + .27, -.40, s * .18), [.018, .008, .012], dark, 6);
    }
    for (let i = 0; i < 34; i++) {
      const a = i / 34 * TAU, x = .42 + (i % 4) * .16, rr = .20 - (i % 3) * .02;
      rod(body, V(x, .03 + Math.cos(a) * rr, Math.sin(a) * .17), V(x + .02, .03 + Math.cos(a) * (rr + .05), Math.sin(a) * .22), .0025, standard('#c79a64', {roughness: .5}));
    }
    // A leaf substrate and raking light give the ant a readable scale and
    // a contrasting background instead of floating in empty space.
    const leafBase = new THREE.Group(); leafBase.position.set(.02, -.47, .02); leafBase.rotation.set(-.12, .18, -.04); g.add(leafBase);
    const leafShape = new THREE.Shape(); leafShape.moveTo(-1.30, 0); leafShape.quadraticCurveTo(-.55, .54, 0, .63); leafShape.quadraticCurveTo(.62, .52, 1.30, 0); leafShape.quadraticCurveTo(.58, -.48, 0, -.55); leafShape.quadraticCurveTo(-.55, -.48, -1.30, 0);
    const leafSurface = mesh(new THREE.ShapeGeometry(leafShape), standard('#4f7c48', {roughness: .84}), leafBase); leafSurface.rotation.x = -Math.PI / 2 + .16; leafSurface.scale.set(1, .92, 1);
    const leafUnder = mesh(new THREE.ShapeGeometry(leafShape), standard('#355b36', {roughness: .9}), leafBase); leafUnder.rotation.x = Math.PI / 2 - .16; leafUnder.scale.set(1, .92, 1);
    const leafRib = curve(leafBase, [V(-1.18, .015, 0), V(-.44, .018, 0), V(.32, .018, 0), V(1.14, .015, 0)], .012, standard('#86a36a', {roughness: .7}));
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) curve(leafBase, [V(-.58 + i * .30, .016, 0), V(-.44 + i * .34, .018, s * .28), V(-.28 + i * .38, .014, s * .40)], .006, standard('#86a36a', {roughness: .7}));
    const antLight = new THREE.PointLight('#ffe0b0', 1.5, 5, 1.4); antLight.position.set(.4, 1.4, 1.2); g.add(antLight);
  } else {
    const arachnid = kind === 'spider' || kind === 'scorpion';
    const winged = ['fruit-fly', 'honeybee', 'butterfly', 'moth', 'dragonfly', 'mosquito', 'termite', 'cicada'].includes(kind);
    const abdomen = ellipsoid(body, V(.58, .03, 0), [.58, kind === 'spider' ? .34 : .30, .26], shell);
    ellipsoid(body, V(-.65, .06, 0), [.27, .23, .21], shell);
    ellipsoid(body, V(-.16, .04, 0), [.42, .19, .18], shell);
    for (const s of [-1, 1]) ellipsoid(body, V(-.82, .14, s * .15), [.055, .048, .045], standard('#101820', {roughness: .2}));
    if (winged) {
      const wingTint = kind === 'butterfly' ? '#c8763d' : kind === 'moth' ? '#a58d6b' : '#c9d8df';
      const wingMat = standard(wingTint, {transparent: true, opacity: kind === 'butterfly' ? .92 : .30, roughness: .28, metalness: .05, side: THREE.DoubleSide, depthWrite: false});
      const pairs = kind === 'butterfly' ? [[.18, .35, .52, .34], [-.26, .22, .40, .27]] : kind === 'dragonfly' ? [[.08, .34, .62, .13], [-.12, .26, .52, .11]] : [[.12, .28, kind === 'honeybee' ? .42 : .58, .16]];
      const vein = kind === 'butterfly' ? '#3b2417' : '#f0f6f4';
      for (const s of [-1, 1]) for (const [wx, wy, sx, sy] of pairs) {
        rod(body, V(.02, .14 * s, .10), V(wx - sx * .78, wy * s, .16), .010, standard(bodyTint, {roughness: .55}));
        const wing = ellipsoid(body, V(wx, wy * s, .18), [sx, sy, .012], wingMat, 26);
        wing.rotation.z = s * (kind === 'butterfly' ? .30 : .18);
        wing.rotation.x = -.10;
        for (let v = 0; v < 3; v++) line(wing, [V(-sx * .8, 0), V(sx * .75, (v - 1) * sy * .55, 0)], vein, kind === 'butterfly' ? .55 : .3);
      }
      if (kind === 'honeybee' || kind === 'fruit-fly') for (const x of [.42, .66, .9]) {
        const band = mesh(new THREE.TorusGeometry(.27, .007, 8, 30), standard('#241b12', {roughness: .4}), body, V(x, .03, 0));
        band.rotation.y = Math.PI / 2; band.scale.z = .86;
      }
    }
    if (arachnid) {
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
        const x = -.26 + i * .22, dx = (i - 1.5) * .24;
        curve(body, [V(x, .04, s * .13), V(x + dx * .48, .08 + s * .20, s * .19), V(x + dx * .92, .02 + s * .33, s * .21), V(x + dx * 1.28, -.02 + s * .44, s * .17)], .020, shell);
      }
      if (kind === 'spider') {
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) ellipsoid(body, V(-.88 + (i % 2) * .06, .12 + Math.floor(i / 2) * .07, s * .10), [.022, .022, .02], standard('#090d10', {roughness: .15}), 8);
        for (const s of [-1, 1]) curve(body, [V(-.78, -.02, s * .06), V(-.94, -.10, s * .07), V(-1.02, -.04, s * .05)], .018, standard('#2b1f19'));
      }
      if (kind === 'scorpion') {
        for (const s of [-1, 1]) {
          curve(body, [V(-.55, .02, s * .16), V(-.82, .18, s * .26), V(-1.0, .12, s * .18)], .035, shell);
          ellipsoid(body, V(-1.00, .12, s * .18), [.11, .065, .06], standard('#5c3a28', {roughness: .45}), 14);
          for (const z of [-.055, .055]) curve(body, [V(-1.02, .12, s * .18 + z), V(-1.15, .16, s * .18 + z), V(-1.24, .08, s * .18 + z * 1.3)], .022, standard('#3d2a1c', {roughness: .4}));
        }
        const tail = [V(.95, .12, 0), V(1.22, .26, 0), V(1.36, .58, 0), V(1.28, .88, 0), V(1.02, 1.02, 0)];
        curve(body, tail, .08, shell);
        for (const p of tail.slice(1)) ellipsoid(body, p, [.09, .09, .09], standard('#3d2a1c', {roughness: .45}), 14);
        curve(body, [V(1.02, 1.02, 0), V(.92, 1.14, .04), V(.84, 1.20, .08)], .035, standard('#241b13'));
      }
    } else if (kind === 'crab') {
      ellipsoid(body, V(.12, .02, 0), [.62, .22, .34], standard('#b45c3d', {roughness: .55}));
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) curve(body, [V(-.05 + i * .18, .02, s * .15), V(-.10 + i * .18, -.16, s * .34), V(-.18 + i * .18, -.38, s * .55)], .022, standard('#9d4e35'));
        curve(body, [V(-.55, .05, s * .18), V(-.80, .12, s * .34), V(-1.0, .04, s * .22)], .045, standard('#a95138'));
        ellipsoid(body, V(-1.02, .04, s * .22), [.16, .07, .10], standard('#c46a46'), 14);
      }
    } else {
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const x = -.30 + i * .18, dx = (i - 1) * .24;
          curve(body, [V(x, .04, s * .12), V(x + dx * .45, .22, s * .19), V(x + dx * .92, -.04, s * .22), V(x + dx * 1.3, -.34, s * .19)], .020, shell);
        }
        curve(body, [V(-.74, .19, s * .08), V(-.93, .35, s * .22), V(-1.10, .26, s * .28)], .014, shell);
      }
      if (kind === 'beetle') for (const s of [-1, 1]) ellipsoid(body, V(.55, .13, s * .13), [.52, .08, .16], standard('#3b2a20', {roughness: .32}), 20);
      if (kind === 'trilobite') {
        ellipsoid(body, V(.05, .02, 0), [.72, .13, .34], shell);
        for (let i = 0; i < 8; i++) line(body, [V(-.6 + i * .18, .12, -.30), V(-.58 + i * .18, .12, .30)], '#5f4a38', .3);
        for (const s of [-1, 1]) for (let i = 0; i < 8; i++) rod(body, V(-.5 + i * .14, 0, s * .22), V(-.52 + i * .14, -.14, s * .33), .012, shell);
      }
      if (kind === 'grasshopper' || kind === 'mantis') {
        for (const s of [-1, 1]) {
          curve(body, [V(.28, -.02, s * .12), V(.55, -.05, s * .30), V(.82, -.42, s * .36)], .026, shell);
          if (kind === 'mantis') curve(body, [V(-.45, .08, s * .12), V(-.72, .38, s * .18), V(-.92, .30, s * .12)], .030, shell);
        }
      }
      if (kind === 'mosquito') rod(body, V(-.86, .02, 0), V(-1.55, -.02, 0), .008, standard('#2a2118', {roughness: .4}));
    }
  }
  // Body, excluding legs/antennae/wings, owns the comparison axis.
  fit(body, 'x'); g.add(body); reference(g, 'x', 'body-length-excluding-appendages', -1.16);
}
function whale(g, c, random, entry) {
  return createAnimal(g, c, random, entry);
}
function microbe(g, c, random, entry) {
  if (c.variant === 'rbc') {
    const geo = new THREE.SphereGeometry(1, 80, 56), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {const x = p.getX(i), y = p.getY(i), rr = Math.min(1, x * x + y * y); p.setZ(i, Math.sign(p.getZ(i)) * .38 * Math.sqrt(1 - rr) * (.207 + 2.003 * rr - 1.123 * rr * rr));}
    geo.computeVertexNormals(); mesh(geo, standard(c.color, {roughness: .38, metalness: .06}), g);
    reference(g, 'x', 'disc-face-diameter', -1.14); return;
  }
  const body = new THREE.Group();
  if (c.variant === 'virus') {
    mesh(new THREE.IcosahedronGeometry(.88, 3), standard(c.color, {roughness: .5}), body);
    const stems = [], heads = [];
    for (let i = 0; i < 68; i++) {const y = 1 - (i + .5) * 2 / 68, a = i * 2.399963, r = Math.sqrt(1 - y * y), n = V(Math.cos(a) * r, y, Math.sin(a) * r); stems.push([n.clone().multiplyScalar(.85), n.clone().multiplyScalar(.97)]); heads.push({position: n.clone().multiplyScalar(.99)});}
    rodInstances(body, standard('#82b8b7'), stems, .014); instances(body, new THREE.SphereGeometry(.035, 12, 8), standard('#bf9ea6'), heads);
  } else if (entry?.id === 'space.amoeba' || c.variant === 'amoeba') {
    // Irregular live amoeba: deformed membrane with three pseudopod lobes,
    // granular cytoplasm, nucleus, food vacuoles and two contractile vacuoles.
    const membrane = standard('#94bfd2', {transparent: true, opacity: .40, roughness: .22, depthWrite: false, side: THREE.DoubleSide});
    const cytoplasm = standard('#b6d0d3', {transparent: true, opacity: .22, roughness: .35, depthWrite: false});
    const nucleusMat = standard('#8e7fa8', {roughness: .42, transparent: true, opacity: .82});
    const foodMat = standard('#b99a72', {roughness: .55});
    const geo = new THREE.SphereGeometry(1, 72, 48), pos = geo.attributes.position, n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      const az = Math.atan2(n.z, n.x), el = Math.asin(n.y);
      let r = 1 + .10 * Math.sin(3 * az + .7) * Math.cos(el) + .07 * Math.sin(5 * el + az * 2) + .035 * Math.cos(9 * az - 3 * el);
      r += .30 * Math.pow(Math.max(0, n.x), 4) + .26 * Math.pow(Math.max(0, -n.z), 5) + .14 * Math.pow(Math.max(0, -n.y), 6);
      pos.setXYZ(i, n.x * r, n.y * r, n.z * r);
    }
    geo.computeVertexNormals();
    const shell = mesh(geo, membrane, body); shell.scale.set(1.18, .82, .76);
    ellipsoid(body, V(), [1.0, .68, .62], cytoplasm);
    ellipsoid(body, V(.14, .07, .0), [.29, .23, .17], nucleusMat, 28);
    ellipsoid(body, V(.20, .12, .05), [.085, .085, .07], standard('#6e5f8b', {roughness: .5}), 20);
    for (const [x, y, z, r] of [[-.34, .12, -.13, .105], [.42, -.18, .12, .085], [-.08, -.02, .32, .075], [.62, .20, -.16, .06]]) {
      ellipsoid(body, V(x, y, z), [r, r, r], foodMat, 18);
      ring(body, r * .85, .006, standard('#7f9a8b'), V(x, y, z), V(0, Math.PI / 2, 0));
    }
    for (const x of [-.54, .55]) {
      ellipsoid(body, V(x, -.02, .12), [.12, .12, .10], standard('#cfe8e7', {transparent: true, opacity: .35, roughness: .2, depthWrite: false}), 18);
      ring(body, .12, .007, standard('#8fb9c2'), V(x, -.02, .12), V(0, Math.PI / 2, 0));
    }
    const granules = [];
    for (let i = 0; i < 110; i++) {
      const a = random() * TAU, e = (random() - .5) * 1.2, rr = Math.sqrt(Math.max(0, 1 - e * e));
      granules.push({position: V(Math.cos(a) * rr * .86, e * .58, Math.sin(a) * rr * .62), color: i % 4 ? '#d4e3de' : '#9fbdb6'});
    }
    instances(body, new THREE.SphereGeometry(.018, 8, 6), standard('#ffffff'), granules);
    ellipsoid(body, V(1.03, .02, -.10), [.33, .22, .24], membrane, 24);
    ellipsoid(body, V(-.55, -.02, -.72), [.22, .20, .26], membrane, 24);
    // Engulfed diatom and a third advancing pseudopod make the cell read as a
    // living, feeding organism rather than a decorative translucent blob.
    const diatom = new THREE.Group(); diatom.position.set(.86, .00, -.14); diatom.rotation.set(.2, .35, .1); body.add(diatom);
    const diatomBody = ellipsoid(diatom, V(), [.28, .12, .14], standard('#c9a65e', {roughness: .35, metalness: .08}), 24);
    for (let i = 0; i < 7; i++) {
      const z = -.11 + i * .037;
      ellipsoid(diatom, V(.0, .0, z), [.27, .11, .010], standard('#f0d79a', {roughness: .28}), 10);
      rod(diatom, V(-.27, 0, z), V(.27, 0, z), .003, standard('#8d6b3b', {roughness: .5}));
    }
    for (const s of [-1, 1]) ellipsoid(diatom, V(0, s * .13, 0), [.29, .018, .15], standard('#7f6338', {roughness: .5}), 12);
    const feedLobe = ellipsoid(body, V(1.16, .03, -.15), [.24, .17, .19], standard('#9acbd9', {transparent: true, opacity: .52, roughness: .2, depthWrite: false}), 24);
    const lobeRim = ring(body, .28, .006, standard('#b7e0e8', {transparent: true, opacity: .55}), V(1.14, .03, -.15), V(0, Math.PI / 2, 0));
    const advLobe = ellipsoid(body, V(-.92, .05, .18), [.20, .16, .25], membrane, 20);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      curve(body, [V(.14, .07, 0), V(.14 + Math.cos(a) * .45, .07 + Math.sin(a) * .28, .05), V(.14 + Math.cos(a) * .78, .07 + Math.sin(a) * .42, .02)], .004, standard('#a9cfda', {transparent: true, opacity: .35}));
    }
    const vacs = [];
    for (const [x, z, r] of [[-.56, .12, .13], [.56, .12, .12]]) {
      const vac = ellipsoid(body, V(x, -.02, z), [r, r, r * .88], standard('#d9f0ef', {transparent: true, opacity: .30, roughness: .18, depthWrite: false}), 18);
      vacs.push(vac); ring(body, r, .007, standard('#8fb9c2'), V(x, -.02, z), V(0, Math.PI / 2, 0));
    }
    g.userData.update = (d, t) => {body.rotation.y = Math.sin(t * .08) * .10; body.scale.set(1 + Math.sin(t * .17) * .012, 1 + Math.cos(t * .13) * .008, 1); vacs[0].scale.setScalar(1 + Math.sin(t * .7) * .06); vacs[1].scale.setScalar(1 + Math.cos(t * .8) * .05);};
  } else {
    ellipsoid(body, V(), [1, .68, .68], standard(c.color, {transparent: true, opacity: .66, roughness: .3, depthWrite: false}));
    curve(body, Array.from({length: 45}, (_, i) => {const a = i / 44 * TAU * 3; return V((i / 44 - .5) * 1.2, Math.sin(a) * .25, Math.cos(a) * .25);}), .018, standard('#ccb789'));
    for (let i = 0; i < 22; i++) ellipsoid(body, V((random() - .5) * 1.35, (random() - .5) * .7, (random() - .5) * .7), [.035, .035, .035], standard('#aacac1'), 10);
  }
  fit(body, 'x'); g.add(body); reference(g, 'x', 'selected-overview-length', -1.15);
}
function organelle(g, c, random) {
  const body = new THREE.Group(), translucent = standard(c.color, {transparent: true, opacity: .24, side: THREE.DoubleSide, depthWrite: false, roughness: .25});
  if (c.variant === 'pollen') {
    mesh(new THREE.SphereGeometry(.96, 64, 40), standard(c.color, {roughness: .82}), body);
    const ornaments = [];
    for (let i = 0; i < 190; i++) {const y = 1 - 2 * (i + .5) / 190, a = i * 2.399963, n = V(Math.cos(a) * Math.sqrt(1 - y * y), y, Math.sin(a) * Math.sqrt(1 - y * y)); ornaments.push({position: n.multiplyScalar(.96)});}
    instances(body, new THREE.IcosahedronGeometry(.025, 1), standard('#c4ae71'), ornaments);
    ring(body, .19, .025, standard('#a18a50'), V(.12, .1, .94), V());
    ellipsoid(body, V(.12, .1, .941), [.16, .16, .016], standard('#b69a5d'));
  } else if (c.variant === 'ribosome') {
    ellipsoid(body, V(.05, -.22), [.95, .62, .58], standard(c.color));
    ellipsoid(body, V(-.11, .47), [.73, .35, .5], standard('#b4c5ad'));
    const beads = [];
    for (let i = 0; i < 100; i++) {const a = random() * TAU, y = (random() - .5) * 1.2, rr = Math.sqrt(Math.max(0, 1 - y * y)); beads.push({position: V(Math.cos(a) * rr * .84, y, Math.sin(a) * rr * .52), color: i % 3 ? c.color : '#d1b78e'});}
    instances(body, new THREE.IcosahedronGeometry(.06, 1), standard('#ffffff'), beads);
    curve(body, [V(-1.1, .17, .3), V(-.3, .12, .43), V(.4, .17, .48), V(1.1, .3, .3)], .026, standard('#e2b87d'));
  } else {
    ellipsoid(body, V(), [1, .47, .42], translucent);
    const outline = ring(body, 1, .012, standard(c.color), V(), V()); outline.scale.y = .47;
    if (c.variant === 'chloroplast') {
      for (const x of [-.65, -.23, .23, .65]) for (let j = 0; j < 5; j++) {
        const disk = mesh(new THREE.CylinderGeometry(.17, .17, .025, 24), standard('#649b7a'), body, V(x, -.12 + j * .06));
        ring(body, .17, .009, standard('#91b58e'), disk.position);
      }
      for (const y of [-.07, .1]) curve(body, [V(-.75, y), V(-.4, y + .07), V(.3, y - .05), V(.75, y)], .015, standard('#8cb68a'));
    } else {
      for (let i = 0; i < 9; i++) {const x = -.77 + i * .19; curve(body, [V(x, -.25, -.14), V(x + .07, .2, -.1), V(x, .26, .12), V(x + .08, -.25, .15)], .026, standard('#b69a91'));}
    }
  }
  fit(body, 'x'); g.add(body); reference(g, 'x', c.variant === 'pollen' ? 'hydrated-pollen-diameter' : 'specified-overview-length', -.83);
}
function membrane(g, c, random) {
  const gap = c.variant === 'synapse', lipid = standard(c.color, {roughness: .38}), tail = standard('#839f9e');
  // Head outer surfaces bound thickness; head inner surfaces bound the cleft.
  const surfaces = gap ? [-1.055, 1.055] : [-.945, .945];
  const heads = [], tails = [];
  for (const y of surfaces) {
    mesh(new THREE.BoxGeometry(1.9, gap ? .08 : .035, .95), standard(c.color, {transparent: true, opacity: .15, depthWrite: false}), g, V(0, y + (gap ? Math.sign(y) * .04 : 0)));
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
      const x = -.86 + i * .156, z = -.4 + j * .16;
      heads.push({position: V(x, y, z)});
      if (!gap) for (const dx of [-.016, .016]) tails.push([V(x + dx, y - Math.sign(y) * .055, z), V(x + dx, Math.sign(y) * .05, z + .012)]);
    }
  }
  instances(g, new THREE.SphereGeometry(.055, 10, 8), lipid, heads);
  if (tails.length) rodInstances(g, tail, tails, .012);
  if (gap) {
    const transmitters = [];
    for (let i = 0; i < 14; i++) transmitters.push(ellipsoid(g, V((random() - .5) * 1.4, (random() - .5) * 1.45, (random() - .5) * .6), [.035, .035, .035], standard('#e7bf7f'), 10));
    g.userData.update = (_d, time) => {transmitters.forEach((p, i) => {p.position.y = -.725 + ((i / 14 + time * .08) % 1) * 1.45;});};
  }
  reference(g, 'y', gap ? 'intermembrane-gap' : 'membrane-thickness', 1.19);
}
function motor(g, c) {
  const rail = standard('#7a9caa'), foot = standard(c.color), walking = new THREE.Group();
  for (const z of [-.09, .09]) rod(g, V(-1.25, -.32, z), V(1.25, -.32, z), .038, rail);
  for (let i = 0; i < 17; i++) rod(g, V(-1.2 + i * .15, -.32, -.09), V(-1.2 + i * .15, -.32, .09), .018, rail);
  for (const s of [-1, 1]) {ellipsoid(walking, V(s * .11, -.19), [.1, .075, .08], foot); curve(walking, [V(s * .11, -.13), V(s * .17, .12), V(0, .34)], .027, foot);}
  ellipsoid(walking, V(0, .47), [.16, .14, .13], standard('#c3b38a')); g.add(walking);
  reference(g, 'x', 'kinesin-step-displacement', -.58);
  g.userData.update = (_delta, time) => {walking.position.x = -1 + ((time * .22) % 1) * 2; walking.rotation.z = Math.sin(time * 3) * .03;};
}
function molecule(g, c, random, entry) {
  const body = new THREE.Group(), material = standard(c.color, {roughness: .34, metalness: .2});
  if ((c.variant === '-' || !c.variant) && (entry?.id === 'space.graphene' || entry?.id === 'space.carbon-nanotube')) {
    // sp2 carbon sheet: real hexagons, shared vertices and three-coordinated
    // bonds rather than four decorative spheres.
    const carbon = standard('#39434b', {roughness: .38, metalness: .18});
    const bondMat = standard('#c3d1d4', {roughness: .3, metalness: .55});
    const atomR = .042, bondR = .011;
    const atoms = [], add = (p) => { if (!atoms.some(q => q.distanceTo(p) < .045)) atoms.push(p); };
    if (entry.id === 'space.graphene') {
      const a = .17, cols = 7, rows = 5;
      for (let j = 0; j < cols; j++) for (let i = 0; i < rows; i++) {
        const cx = 1.5 * a * j, cy = Math.sqrt(3) * a * (i + (j % 2) * .5);
        for (let k = 0; k < 6; k++) add(V(cx + Math.cos(Math.PI / 6 + k * Math.PI / 3) * a, cy + Math.sin(Math.PI / 6 + k * Math.PI / 3) * a, 0));
      }
      for (const p of atoms) ellipsoid(body, p, [atomR, atomR, atomR], carbon, 14);
      for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) if (atoms[i].distanceTo(atoms[j]) < a * 1.04) rod(body, atoms[i], atoms[j], bondR, bondMat, bondR, 6);
      body.rotation.set(-.42, .08, .02);
      fit(body, 'x'); g.add(body); reference(g, 'x', 'sheet-width', -.9); return;
    }
    // Armchair nanotube: a rolled hexagonal sheet with open ends.
    const radius = .48, rings = 11, around = 12;
    for (let k = 0; k < rings; k++) for (let j = 0; j < around; j++) {
      const a = j / around * TAU + (k % 2) * Math.PI / around;
      add(V(-1 + k * .19, Math.cos(a) * radius, Math.sin(a) * radius));
    }
    for (const p of atoms) ellipsoid(body, p, [atomR, atomR, atomR], carbon, 12);
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const d = atoms[i].distanceTo(atoms[j]); if (d > .01 && d < .25) rod(body, atoms[i], atoms[j], bondR, bondMat, bondR, 6); }
    for (const x of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(radius, .012, 8, 48), bondMat, body, V(x * 1.0, 0, 0)); r.rotation.y = Math.PI / 2; }
    body.rotation.set(.12, -.08, -.1);
    fit(body, 'x'); g.add(body); reference(g, 'x', 'tube-length', -1.0); return;
  }
  if (c.variant === 'water') {
    const hydrogen = standard('#e2e6e1'), oxygen = standard('#bb6e65'), hh = c.parameters?.hydrogenDistanceAngstrom ?? 1.5144, oh = c.parameters?.oxygenHydrogenDistanceAngstrom ?? .9578, height = Math.sqrt((2 * oh / hh) ** 2 - 1);
    ellipsoid(body, V(0, height - .3), [.27, .27, .27], oxygen);
    for (const x of [-1, 1]) {ellipsoid(body, V(x, -.3), [.16, .16, .16], hydrogen); rod(body, V(0, height - .3), V(x, -.3), .055, material);}
    g.add(body); reference(g, 'x', 'hydrogen-nucleus-separation', -.3); return;
  }
  if (c.variant === 'amino-acid') {
    // Alanine ball-and-stick: amino group, carboxyl group and methyl side
    // chain around one alpha carbon. CPK colours and double bonds make the
    // molecular structure legible without pretending to be a crystal model.
    const C = standard('#59616b', {roughness: .32, metalness: .15});
    const N = standard('#4769c8', {roughness: .3, metalness: .1});
    const O = standard('#cf4f43', {roughness: .3, metalness: .1});
    const H = standard('#e6ebe8', {roughness: .45});
    const bondMat = standard('#aeb8ba', {metalness: .5, roughness: .32});
    const atom = (p, r, m) => ellipsoid(body, V(...p), [r, r, r], m, 18);
    const bond = (a, b, r = .045, m = bondMat) => rod(body, V(...a), V(...b), r, m);
    const alpha = [-.08, .06, 0], carb = [.57, .20, .03], oxy1 = [.98, .50, .08], oxy2 = [.78, -.18, -.05];
    atom(alpha, .15, C); atom(carb, .14, C); atom(oxy1, .12, O); atom(oxy2, .115, O); atom([1.09, -.28, -.10], .075, H);
    atom([-.74, .38, .06], .135, N); atom([-1.02, .64, .10], .075, H); atom([-.96, .08, .13], .075, H);
    atom([-.43, -.57, -.04], .14, C);
    atom([-.22, -.88, .18], .075, H); atom([-.78, -.84, -.02], .075, H); atom([-.60, -.70, -.31], .075, H);
    atom([-.02, .38, -.35], .075, H);
    bond(alpha, carb); bond(alpha, [-.74, .38, .06]); bond(alpha, [-.43, -.57, -.04]); bond(alpha, [-.02, .38, -.35]);
    bond(carb, oxy1, .04); bond([.57, .20, .08], [.98, .50, .13], .04);
    bond(carb, oxy2); bond(oxy2, [1.09, -.28, -.10]);
    bond([-.74, .38, .06], [-1.02, .64, .10]); bond([-.74, .38, .06], [-.96, .08, .13]);
    bond([-.43, -.57, -.04], [-.22, -.88, .18]); bond([-.43, -.57, -.04], [-.78, -.84, -.02]); bond([-.43, -.57, -.04], [-.60, -.70, -.31]);
    // Carboxyl C=O is drawn as two parallel bonds.
    bond([.57, .16, -.02], [.98, .46, -.03], .028);
    body.rotation.set(.14, -.32, .04);
    fit(body, 'x'); g.add(body); reference(g, 'x', 'alanine-linear-span', -1.02); return;
  }
  if (c.variant === 'antibody') {
    // IgG is a flexible Y: two Fab arms, a hinge and an Fc stem, each built
    // from paired heavy/light-chain domains rather than four decorative blobs.
    const heavy = standard('#77948f', {roughness: .42, metalness: .12});
    const light = standard('#c7b596', {roughness: .45});
    const fc = standard('#5e7d7a', {roughness: .4});
    const gold = standard('#d2ae67', {metalness: .65, roughness: .3});
    const hinge = V(0, -.18, 0);
    const domains = (a, b, r, mat, sx = 1, sz = 1) => {
      const mid = a.clone().add(b).multiplyScalar(.5), len = a.distanceTo(b);
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
      const d = ellipsoid(body, mid, [r * sx, Math.max(.06, len / 2 - .02), r * sz], mat, 20);
      d.quaternion.copy(q); return d;
    };
    const arm = (side) => {
      const tip = V(side * .78, .58, side * .10);
      const mid = V(side * .40, .28, side * .05);
      for (const off of [-.09, .09]) {
        const a = hinge.clone().add(V(0, 0, off)), b = tip.clone().add(V(0, 0, off));
        domains(a, mid.clone().add(V(0, 0, off)), .12, off < 0 ? heavy : light, 1, 1.05);
        domains(mid.clone().add(V(0, 0, off)), b, .105, off < 0 ? heavy : light, 1, 1);
      }
      // Variable domains at the antigen-binding tip.
      for (const off of [-.12, .12]) ellipsoid(body, tip.clone().add(V(0, .04, off)), [.13, .13, .10], off < 0 ? heavy : light, 18);
      rod(body, hinge.clone().add(V(0, 0, -.08)), hinge.clone().add(V(0, 0, .08)), .035, gold);
    };
    arm(-1); arm(1);
    for (const x of [-.10, .10]) {
      const top = hinge.clone().add(V(x, 0, 0)), bottom = V(x, -1.05, .02);
      domains(top, V(x * 1.4, -.55, .02), .115, fc, 1, 1.05);
      domains(V(x * 1.4, -.55, .02), bottom, .13, fc, 1, 1);
      ellipsoid(body, bottom.clone().add(V(0, -.08, 0)), [.14, .12, .13], fc, 18);
    }
    for (const y of [-.38, -.78]) rod(body, V(-.12, y, .06), V(.12, y, .06), .028, gold);
    body.rotation.set(.08, .24, 0);
    fit(body, 'x'); g.add(body); reference(g, 'x', 'igg-antibody-span', -1.02); return;
  }
  if (c.variant === 'fullerene') {
    const ico = new THREE.IcosahedronGeometry(1, 0), unique = [];
    for (let i = 0; i < ico.attributes.position.count; i++) {const p = V().fromBufferAttribute(ico.attributes.position, i); if (!unique.some(q => q.distanceTo(p) < 1e-5)) unique.push(p);}
    let side = Infinity; for (let i = 0; i < unique.length; i++) for (let j = i + 1; j < unique.length; j++) side = Math.min(side, unique[i].distanceTo(unique[j]));
    const vertices = []; for (const a of unique) for (const b of unique) if (Math.abs(a.distanceTo(b) - side) < 1e-4) vertices.push(a.clone().multiplyScalar(2 / 3).add(b.clone().multiplyScalar(1 / 3)));
    let bond = Infinity; for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) bond = Math.min(bond, vertices[i].distanceTo(vertices[j]));
    const bonds = [];
    for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) if (vertices[i].distanceTo(vertices[j]) < bond * 1.02) bonds.push([vertices[i], vertices[j]]);
    instances(body, new THREE.SphereGeometry(.036, 10, 8), material, vertices.map(position => ({position})));
    rodInstances(body, material, bonds, .012);
    ico.dispose();
  } else if (c.variant === 'trna') {
    const path = [V(-.8, -.6), V(-.76, -.05, .04), V(-.72, .59), V(-.2, .63, .03), V(.8, .6)];
    for (const side of [-1, 1]) {const strand = path.map((p, i) => p.clone().add(V(Math.sin(i * 1.2) * .05, side * .065, side * .035))); curve(body, strand, .027, standard(side > 0 ? c.color : '#c3b388'));}
    for (let i = 0; i < 19; i++) {const t = i / 18, p = t < .5 ? V(-.78, -.6 + t * 2.4) : V(-.72 + (t - .5) * 3.04, .61); ellipsoid(body, p, [.046, .046, .046], material, 10);}
    g.add(body);
    const a = V(-.8, -.6, .15), b = V(.8, .6, .15); line(g, [a, b], '#c3dce3', .7, true);
    g.userData.reference = {axis: 'diagonal', kind: 'structure-maximum-span', length: 2, start: a.toArray(), end: b.toArray()}; return;
  } else {
    for (const [i, x, y] of [[0, -.43, -.32], [1, .4, -.32], [2, -.42, .34], [3, .4, .34]]) {
      ellipsoid(body, V(x, y), [.55, .43, .43], standard(i % 2 ? '#b69894' : c.color));
      const p = Array.from({length: 45}, (_, j) => {const t = j / 44; return V(x + (t - .5) * .75, y + Math.cos(t * TAU * 2) * .16, Math.sin(t * TAU * 2) * .16 + .39);});
      curve(body, p, .025, standard(i % 2 ? '#dec7a3' : '#9ec5c6'));
    }
  }
  fit(body, 'x'); g.add(body); reference(g, 'x', 'specified-molecule-width', -1.02);
}
function atom(g, c) {
  if (c.variant === 'positronium') {
    for (const x of [-1, 1]) {ellipsoid(g, V(x), [.065, .065, .065], standard(x < 0 ? '#90bad5' : '#d6a4a0')); halo(g, .25, x < 0 ? '#81bee6' : '#eeb6b2', .2, V(x));}
    curve(g, [V(-1), V(-.5, .32), V(.5, -.32), V(1)], .008, standard('#8caebd'));
    reference(g, 'x', 'relative-coordinate-bohr-length', -.25);
  } else {
    ellipsoid(g, V(), [.055, .055, .055], standard('#e0c395'));
    for (const r of [.68, .85, 1]) halo(g, r, c.color, .12);
    reference(g, 'x', 'twice-nonbonded-radius', -1.12);
  }
}
function nucleus(g, c, random) {
  // The distribution has no sharp edge; the two-unit segment is ONE rms radius.
  const center = V(-1), positions = [], colors = [], samples = [];
  for (let i = 0; i < 600; i++) {
    const u = Math.max(1e-7, random()), a = random() * TAU, y = random() * 2 - 1, r = Math.min(2.5, Math.sqrt(-2 * Math.log(u)) * .95), v = Math.sqrt(1 - y * y);
    samples.push(V(Math.cos(a) * v * r, y * r, Math.sin(a) * v * r));
    const color = new THREE.Color(i % 2 ? c.color : '#d1a791'); colors.push(color.r, color.g, color.b);
  }
  const centroid = samples.reduce((sum, p) => sum.add(p), V()).multiplyScalar(1 / samples.length);
  samples.forEach(p => p.sub(centroid));
  const rms = Math.sqrt(samples.reduce((sum, p) => sum + p.lengthSq(), 0) / samples.length);
  for (const p of samples) {p.multiplyScalar(2 / rms).add(center); positions.push(p.x, p.y, p.z);}
  points(g, positions, colors, 2.7, .55); ellipsoid(g, center, [.035, .035, .035], basic('#e2e9e8'));
  reference(g, 'x', 'rms-charge-radius-not-boundary', 0); halo(g, 1.5, c.color, .05, center);
  g.userData.chargeRmsReference = 2;
}
function wave(g, c, random, entry) {
  const light = entry?.id === 'space.blue-light';
  const material = standard(c.color, {emissive: c.color, emissiveIntensity: light ? .85 : .3});
  const reduced = c.variant === 'reduced', span = reduced ? 1 : TAU;
  const amp = light ? .34 : .25;
  const positions = [], positionsB = [];
  for (let i = 0; i <= 128; i++) {const t = i / 128; positions.push(V(-1 + 2 * t, Math.sin(t * span) * amp, Math.cos(t * span) * (light ? .14 : .09))); if (light) positionsB.push(V(-1 + 2 * t, 0, Math.sin(t * span) * .18));}
  const waveMesh = curve(g, positions, light ? .018 : .015, material);
  if (light) {
    const bMat = standard('#7fd1ff', {emissive: '#4fb6ef', emissiveIntensity: .58, transparent: true, opacity: .62});
    curve(g, positionsB, .010, bMat);
    const ribbonGeo = new THREE.BufferGeometry(), verts = [];
    for (const p of positions) verts.push(p.x, 0, 0, p.x, p.y, p.z);
    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const ribbon = mesh(ribbonGeo, new THREE.MeshBasicMaterial({color: c.color, transparent: true, opacity: .055, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}), g);
    for (let i = 0; i < 18; i++) {
      const x = -1 + i / 17 * 2, a = Math.sin((x + 1) / 2 * span) * amp;
      line(g, [V(x, 0, 0), V(x, a, 0)], c.color, .22);
    }
    // Visible-spectrum strip with the 470 nm blue band marked.
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 32;
      const ctx = cvs.getContext('2d'), grd = ctx.createLinearGradient(0, 0, 512, 0);
      for (let i = 0; i <= 12; i++) {const nm = 400 + i / 12 * 300; grd.addColorStop(i / 12, `hsl(${270 - (nm - 400) * .47}, 96%, 56%)`);}
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 32);
      ctx.fillStyle = 'rgba(5,10,16,.82)'; ctx.fillRect(512 * (70 / 300), 0, 512 * 60 / 300, 32);
      ctx.fillStyle = '#eaf8ff'; ctx.fillRect(512 * (70 / 300), 0, 2, 32); ctx.fillRect(512 * (130 / 300), 0, 2, 32);
      const tex = new THREE.CanvasTexture(cvs); tex.colorSpace = THREE.SRGBColorSpace;
      const strip = mesh(new THREE.PlaneGeometry(2.0, .10), new THREE.MeshBasicMaterial({map: tex, transparent: true, opacity: .92, depthWrite: false}), g, V(0, -.40, .04));
    }
    line(g, [V(-1, -.50, .05), V(-1, -.56, .05), V(1, -.56, .05), V(1, -.50, .05)], '#dff2ff', .55);
  }
  for (const x of [-1, 1]) line(g, [V(x, -.37), V(x, .39)], c.color, .28, true);
  reference(g, 'x', reduced ? 'reduced-compton-one-radian' : c.variant === 'light' ? 'defined-vacuum-light-distance' : 'ordinary-compton-one-cycle', -.45);
  const pulse = ellipsoid(g, V(-1, 0, 0), [.035, .035, .035], basic('#ebffff'), 12);
  g.userData.phaseSpan = span;
  g.userData.update = (_d, time) => {const t = (time * .16) % 1; pulse.position.set(-1 + t * 2, Math.sin(t * span) * amp, Math.cos(t * span) * (light ? .14 : .09)); waveMesh.material.emissiveIntensity = light ? .95 + .12 * Math.sin(time * 2.2) : .25 + .08 * Math.sin(time);};
}
function sphereObject(g, c, random) {
  const luminous = c.variant === 'star' || c.variant === 'neutron';
  const geo = new THREE.SphereGeometry(1, 64, 48), p = geo.attributes.position, colors = [], base = new THREE.Color(c.color);
  for (let i = 0; i < p.count; i++) {const x = p.getX(i), y = p.getY(i), z = p.getZ(i), pattern = .78 + .22 * Math.sin(x * 15 + z * 8) * Math.sin(y * 22 - x * 4); const col = base.clone().multiplyScalar(pattern); colors.push(col.r, col.g, col.b);}
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  mesh(geo, luminous ? new THREE.MeshBasicMaterial({vertexColors: true}) : standard('#ffffff', {vertexColors: true, roughness: c.variant === 'ball' ? .85 : .64}), g);
  if (luminous) halo(g, 1.12, c.color, .22);
  if (c.variant === 'ball') ring(g, 1.001, .002, standard('#b7c3c6'), V(), V(.4, .3));
  reference(g, 'x', 'specified-object-diameter', -1.17);
  g.userData.update = (_d, time) => {g.children[0].rotation.y = time * .025;};
}
function mirror(g, c) {
  const body = mesh(new THREE.CylinderGeometry(1, 1, .08, 80), standard(c.color, {metalness: .98, roughness: .12}), g); body.rotation.x = Math.PI / 2;
  ring(g, 1, .023, standard('#7b96a6', {metalness: .8}), V(0, 0, .04), V());
  ellipsoid(g, V(0, 0, .19), [.12, .12, .04], standard('#263e4c'));
  for (let i = 0; i < 4; i++) {const a = i / 4 * TAU; rod(g, V(0, 0, .18), V(Math.cos(a) * .94, Math.sin(a) * .94, .05), .008, standard('#809da9'));}
  reference(g, 'x', 'primary-mirror-diameter', -1.16);
}
function filament(g, c) {
  const cylinder = mesh(new THREE.CylinderGeometry(1, 1, 3.1, 72, 8), standard(c.color, {roughness: .48}), g); cylinder.rotation.x = Math.PI / 2;
  for (let i = 0; i < 11; i++) ring(g, 1.002, .007, standard('#8c7360'), V(0, 0, -1.5 + i * .3), V());
  reference(g, 'x', 'hair-cross-section-width', -1.13);
}
function galaxy(g, c, random) {
  const dust = new THREE.Group(), positions = [], colors = [];
  for (let i = 0; i < 5600; i++) {
    const r = Math.sqrt(random()), a = i % 3 / 3 * TAU + r * 5 + (random() - .5) * (.2 + r * .5), z = (random() - .5) * .075 * (1 - r);
    positions.push(Math.cos(a) * r, Math.sin(a) * r * .6, z);
    const color = new THREE.Color().setHSL(.58 - (1 - r) ** 4 * .45, .3, .4 + random() * .35); colors.push(color.r, color.g, color.b);
  }
  const stars = points(dust, positions, colors, 3.1); halo(dust, .22, '#ffd5a1', .2); g.add(dust);
  reference(g, 'x', 'stellar-disc-overview-span', -.79);
  g.userData.update = (_d, time) => {stars.material.uniforms.alpha.value = .82 + Math.sin(time * .6) * .035;};
}
const galaxyTexture = (() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 3, 128, 128, 124);
  grad.addColorStop(0, 'rgba(255,255,255,.98)'); grad.addColorStop(.12, 'rgba(255,246,222,.9)'); grad.addColorStop(.42, 'rgba(229,214,184,.35)'); grad.addColorStop(.8, 'rgba(180,168,150,.08)'); grad.addColorStop(1, 'rgba(170,160,145,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  ctx.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 45; i++) {
    const t = i / 44, a = arm * Math.PI + t * 3.4, r = 14 + t * 92;
    ctx.fillStyle = `rgba(255,244,220,${(.32 - t * .25).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r * .58, 1.4 + (1 - t) * 2.6, 0, TAU); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; return tex;
})();

function cluster(g, c, random, entry) {
  const id = String(entry?.id || '').replace(/^space\./, '');
  const kind = c.variant || (id.includes('wall') ? 'wall' : id.includes('supercluster') || id === 'shapley-supercluster' ? 'supercluster' : id === 'local-group' ? 'group' : id === 'omega-centauri' ? 'globular' : id.includes('open') ? 'open' : 'cluster');
  const field = new THREE.Group();
  const sprite = (x, y, z, size, tint = c.color, opacity = .8) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: galaxyTexture, color: tint, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending}));
    s.position.set(x, y, z); s.scale.set(size, size * .66, 1); field.add(s); return s;
  };
  if (kind === 'wall') {
    for (let i = 0; i < 34; i++) {
      const x = random() * 2 - 1, y = Math.sin(x * 3) * .15 + (random() - .5) * .2, z = (random() - .5) * .24;
      const s = sprite(x, y, z, .1 + random() * .16); s.material.rotation = random() * 3;
    }
    for (let i = 0; i < 6; i++) {
      const pts = []; for (let j = 0; j <= 18; j++) { const x = -1 + j / 18 * 2; pts.push(V(x, Math.sin(x * 3 + i * .2) * .15 + Math.sin(i * 1.7) * .06, .02)); }
      curve(field, pts, .004, basic('#b9a67d', .4));
    }
    pointCloud(field, 1200, random, c.color, () => V(random() * 2 - 1, (random() - .5) * .32, (random() - .5) * .2), 2.4);
  } else if (kind === 'supercluster') {
    const nodes = [[-.55, .1, .1], [0, -.16, -.1], [.58, .12, .08], [-.18, .24, -.05], [.3, -.22, .12]];
    for (const [nx, ny, nz] of nodes) {
      for (let i = 0; i < 16; i++) { const a = random() * TAU, r = .12 + random() * .22; sprite(nx + Math.cos(a) * r, ny + Math.sin(a) * r * .6, nz + (random() - .5) * .12, .07 + random() * .12); }
      sprite(nx, ny, nz, .3, '#ffe6bb', .9);
    }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; curve(field, [V(Math.cos(a) * .62, Math.sin(a) * .26, .02), V(Math.cos(a + .5) * .25, Math.sin(a + .5) * .1, .01), V(0, 0, 0)], .004, basic('#b9a67d', .35)); }
    pointCloud(field, 1300, random, c.color, () => { const a = random() * TAU, r = Math.cbrt(random()) * .9; return V(Math.cos(a) * r, Math.sin(a) * r * .35, (random() - .5) * .2); }, 2.6);
  } else if (kind === 'globular') {
    for (let i = 0; i < 70; i++) {
      const a = random() * TAU, y = random() * 2 - 1, r = random() ** 2.2 * .7;
      sprite(Math.cos(a) * Math.sqrt(1 - y * y) * r, y * r, Math.sin(a) * Math.sqrt(1 - y * y) * r * .7, .02 + random() * .05, i % 7 ? '#f1e6ce' : '#cfd9e3', .7);
    }
    pointCloud(field, 2600, random, c.color, () => { const a = random() * TAU, y = random() * 2 - 1, r = random() ** 2.4; return V(Math.cos(a) * Math.sqrt(1 - y * y) * r, y * r, Math.sin(a) * Math.sqrt(1 - y * y) * r * .8); }, 4.2);
  } else {
    for (let i = 0; i < (kind === 'group' ? 26 : 40); i++) {
      const a = random() * TAU, r = Math.cbrt(random()) * .82;
      sprite(Math.cos(a) * r, (random() - .5) * .36, Math.sin(a) * r * .56, .05 + random() * .13);
    }
    pointCloud(field, 1800, random, c.color, () => { const a = random() * TAU, y = random() * 2 - 1, r = Math.cbrt(random()); return V(Math.cos(a) * Math.sqrt(1 - y * y) * r, y * r * .48, Math.sin(a) * Math.sqrt(1 - y * y) * r * .7); }, 3.1);
    for (let i = 0; i < 5; i++) { const y = (i - 2) * .14; ring(field, .12 + i * .1, .005, basic('#cdbb96', .5), V(0, y, 0), V(.5, 0, 0)); }
  }
  g.add(field); reference(g, 'x', kind === 'wall' ? 'reported-structure-length' : 'reported-overview-span', -1.16);
  g.userData.update = (_d, time) => { field.rotation.y = Math.sin(time * .025) * .025; };
}
function nebula(g, c, random) {
  const cloud = new THREE.Group();
  pointCloud(cloud, 4200, random, c.color, i => {
    const x = random() * 2 - 1, a = random() * TAU;
    if (c.variant === 'pillars') {const column = i % 3, y = random() * 2 - 1, w = .12 * (1 - (y + 1) * .24); return V((column - 1) * .47 + Math.cos(a) * w, y * (1 - column * .12), Math.sin(a) * w);}
    const radius = Math.sqrt(Math.max(0, 1 - x * x)) * (c.variant === 'crab' ? .65 : .45), t = random() ** .4;
    return V(x, Math.cos(a) * radius * t, Math.sin(a) * radius * t * .6);
  }, 4.8);
  if (c.variant !== 'pillars') for (let i = 0; i < 16; i++) {const a = i / 16 * TAU; curve(cloud, [V(Math.cos(a) * .12, Math.sin(a) * .1), V(Math.cos(a + .15) * .55, Math.sin(a + .15) * .4, .08), V(Math.cos(a) * .96, Math.sin(a) * .52)], .003, standard('#bda1a1'));}
  g.add(cloud);
  reference(g, c.variant === 'pillars' ? 'y' : 'x', c.variant === 'pillars' ? 'tallest-pillar-span' : 'reported-emission-span', c.variant === 'pillars' ? .9 : -.9);
  g.userData.update = (_d, time) => {cloud.rotation.y = Math.sin(time * .035) * .035;};
}
function spiralGalaxyNode(g, x, rotation, tint, random) {
  const node = new THREE.Group(); node.position.x = x; node.rotation.set(.55, 0, rotation); g.add(node);
  const positions = [], colors = [], core = new THREE.Color(tint), armTint = new THREE.Color('#b9d4e6');
  for (let i = 0; i < 1400; i++) {
    const arm = i % 2, t = Math.pow(random(), .72), a = arm * Math.PI + t * 4.4 + (random() - .5) * (.28 + t * .42);
    const r = .025 + t * .21, y = (random() - .5) * .022 * (1 - t * .7);
    positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
    const c = core.clone().lerp(armTint, .25 + t * .55).multiplyScalar(.55 + random() * .65);
    colors.push(c.r, c.g, c.b);
  }
  points(node, positions, colors, .070, .96);
  ellipsoid(node, V(), [.060, .048, .036], new THREE.MeshBasicMaterial({color: '#fff0cd'}), 22);
  halo(node, .20, tint, .26);
  for (let i = 0; i < 36; i++) {
    const a = random() * TAU, r = .045 + random() * .18;
    ellipsoid(node, V(Math.cos(a) * r, (random() - .5) * .012, Math.sin(a) * r), [.006, .003, .006], basic(i % 3 ? '#e8f2fb' : '#ffd9a6'), 8);
  }
  node.scale.setScalar(1.55); return node;
}
function distance(g, c, random) {
  const radial = ['radius', 'orbit', 'belt', 'cloud', 'heliopause'].includes(c.variant);
  if (radial) {
    const eccentricity = c.parameters?.eccentricity ?? .2056;
    // One radius/semimajor axis is q: center=-1, selected outer point=+1.
    const center = V(-1); ellipsoid(g, center, [.045, .045, .045], basic('#f1d19a')); halo(g, .16, '#e7b775', .18, center);
    const orbit = new THREE.Group();
    if (c.variant === 'orbit') {const b = Math.sqrt(1 - eccentricity * eccentricity); const ps = Array.from({length: 161}, (_, i) => {const a = i / 160 * TAU; return V(-1 + 2 * Math.cos(a), 2 * b * Math.sin(a), -.05);}); line(orbit, ps, c.color, .5);}
    else {for (let i = 0; i < (c.variant === 'belt' ? 7 : 3); i++) ring(orbit, 2 - i * (c.variant === 'belt' ? .11 : .015), .003, basic(c.color, .22), center, V());}
    if (c.variant === 'cloud' || c.variant === 'heliopause') {
      const shell = halo(orbit, 2, c.color, .08, center); shell.scale.set(1, c.variant === 'heliopause' ? .66 : 1, 1);
      pointCloud(orbit, 650, random, c.color, () => {const a = random() * TAU, y = random() * 2 - 1, rr = 1.7 + random() * .3, v = Math.sqrt(1 - y * y); return V(-1 + Math.cos(a) * rr * v, y * rr, Math.sin(a) * rr * v);}, 1.8);
    }
    g.add(orbit); line(g, [V(-1, -.1, .16), V(1, -.1, .16)], '#e0d2aa', .9);
    reference(g, 'x', c.variant === 'orbit' ? 'orbital-semimajor-axis' : 'heliocentric-radial-distance', -.1);
    if (c.variant === 'orbit') {
      // Cross marks are an ellipse's geometric center, not the Sun/focus.
      line(g, [V(-1, -.08, .18), V(-1, .08, .18)], '#e0d2aa', .9);
      const focus = V(-1 - 2 * eccentricity); g.children[0].position.copy(focus); g.children[1].position.copy(focus);
      g.userData.orbit = {eccentricity, semimajorAxis: 2, center: [-1, 0, 0], focus: focus.toArray()};
    }
    return;
  }
  if (c.variant === 'galaxy') {
    spiralGalaxyNode(g, -1, -.55, '#cdbb96', random);
    spiralGalaxyNode(g, 1, .50, '#a7c4dc', random);
    for (let i = 0; i < 26; i++) {
      const x = -1 + (i + .5) / 26 * 2;
      line(g, [V(x, -.16, .05), V(x + .028, -.16, .05)], c.color, .45);
    }
    line(g, [V(-1, -.22, .06), V(1, -.22, .06)], '#dce9f0', .22);
    const signal = ellipsoid(g, V(-1, -.16, .06), [.020, .020, .020], basic('#e9fbff'), 10);
    g.userData.update = (_d, time) => {signal.position.x = -1 + ((time * .13) % 1) * 2;};
    reference(g, 'x', 'endpoint-center-distance', -.30);
    return;
  }
  for (const [i, x] of [[0, -1], [1, 1]]) {
    const node = new THREE.Group();
    if (c.variant === 'galaxy') {ellipsoid(node, V(), [.13, .055, .025], standard(i ? '#a5b8cf' : '#d5c59f')); ring(node, .17, .003, basic(c.color, .4), V(), V());}
    else ellipsoid(node, V(), [i ? .055 : .085, i ? .055 : .085, i ? .055 : .085], standard(i ? c.color : '#8faec3'));
    node.position.x = x; g.add(node); halo(node, .15, c.color, .1);
  }
  reference(g, 'x', 'endpoint-center-distance', -.23);
  line(g, [V(-1), V(1)], c.color, .45, true);
  const signal = ellipsoid(g, V(-1), [.025, .025, .025], basic('#ddf6f7'), 10);
  g.userData.update = (_d, time) => {signal.position.x = -1 + ((time * .13) % 1) * 2;};
}

function device(g, c, random, entry) {
  return createDevice(g, c, random, entry);
}
function vehicle(g, c, random, entry) {
  return createVehicle(g, c, random, entry);
}
function tissueSection(g, c) {
  const tone = standard(c.color, {roughness: .85}), tubeMat = standard('#b57c72', {roughness: .75}), body = new THREE.Group();
  g.add(body);
  if (c.variant === 'capillary') {
    const wall = new THREE.MeshPhysicalMaterial({color: '#d3a197', roughness: .32, metalness: .02, transparent: true, opacity: .24, side: THREE.DoubleSide, depthWrite: false});
    const tube = mesh(new THREE.CylinderGeometry(.34, .34, 2.5, 36, 1, true), wall, body); tube.rotation.z = Math.PI / 2;
    const rim = basic('#f0cfc8', .5);
    for (let i = 0; i < 6; i++) ring(body, .345, .013, rim, V(-.95 + i * .38, 0, 0), V(0, Math.PI / 2, 0));
    for (let i = 0; i < 5; i++) {
      const x = -.72 + i * .36, a = i * 2.2, r = .335;
      ellipsoid(body, V(x, Math.cos(a) * r, Math.sin(a) * r), [.098, .035, .062], standard('#e3b2a7', {roughness: .65}), 12);
      ellipsoid(body, V(x, Math.cos(a + .3) * r, Math.sin(a + .3) * r), [.034, .018, .03], basic('#9c655f', .45), 10);
    }
    for (let i = 0; i < 4; i++) ellipsoid(body, V(-.62 + i * .43, Math.sin(i * 1.7) * .1, Math.cos(i * 1.7) * .1), [.155, .065, .15], standard('#a94c48', {roughness: .5}), 20);
    for (let i = 0; i < 3; i++) ellipsoid(body, V(-.38 + i * .38, -.12, .17), [.045, .022, .045], basic('#e7b7a4', .8), 12);
    reference(g, 'x', 'vessel-bore-span', -.5);
  } else if (c.variant === 'tastebud') {
    mesh(new THREE.BoxGeometry(2, .3, .9), tone, body, V(0, -.35));
    ellipsoid(body, V(0, .05, 0), [.26, .42, .22], standard('#c99a94', {roughness: .8}), 22);
    ellipsoid(body, V(0, .48, 0), [.08, .06, .08], basic('#e8c6bc'));
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; rod(body, V(0, .05, 0), V(Math.cos(a) * .3, .42, Math.sin(a) * .22), .008, tubeMat); }
    for (let i = 0; i < 6; i++) ellipsoid(body, V(-.75 + i * .3, -.24, .34), [.1, .06, .08], standard('#d8a79e'), 14);
    reference(g, 'x', 'taste-pore-groove-span', -.62);
  } else if (c.variant === 'tooth') {
    const enamel = standard('#efe9dc', {roughness: .42, metalness: .02}), gum = standard('#c98f86', {roughness: .72});
    ellipsoid(body, V(0, .42, 0), [.52, .4, .47], enamel, 28);
    for (const [x, z] of [[-.22, -.2], [.22, -.2], [-.22, .2], [.22, .2]]) ellipsoid(body, V(x, .76, z), [.2, .16, .18], enamel, 18);
    ellipsoid(body, V(0, .05, 0), [.36, .13, .33], gum, 22);
    rod(body, V(-.1, .02, 0), V(-.28, -.95, .03), .14, enamel, .075);
    rod(body, V(.1, .02, 0), V(.28, -.95, -.03), .14, enamel, .075);
    reference(g, 'x', 'molar-height', .62);
  } else if (c.variant === 'eye') {
    const sclera = standard('#e9edeb', {roughness: .45}), iris = standard(c.color, {roughness: .42}), pupil = basic('#10161a', .95);
    ellipsoid(body, V(0, 0, 0), [.66, .66, .66], sclera, 32);
    ellipsoid(body, V(0, 0, .58), [.32, .32, .06], iris, 26);
    ellipsoid(body, V(0, 0, .64), [.14, .14, .025], pupil, 16);
    mesh(new THREE.SphereGeometry(.7, 28, 20), new THREE.MeshPhysicalMaterial({color: '#dfeff2', roughness: .1, transparent: true, opacity: .18, clearcoat: .6}), body);
    ring(body, .33, .012, basic('#b7d0d4', .5), V(0, 0, .6), V(0, 0, 0));
    rod(body, V(0, 0, -.58), V(-.08, -.12, -1.2), .13, standard('#d8c6ae', {roughness: .6}));
    for (const [a, b] of [[[-.55, .3, 0], [-1.05, .45, .1]], [[.55, .3, 0], [1.05, .45, .1]], [[-.5, -.3, 0], [-.95, -.45, -.1]], [[.5, -.3, 0], [.95, -.45, -.1]]]) rod(body, V(...a), V(...b), .045, standard('#b97d73', {roughness: .65}));
    reference(g, 'x', 'eyeball-diameter', .62);
  } else if (c.variant === 'kidney') {
    const cortex = standard(c.color, {roughness: .58}), hilum = standard('#754d49', {roughness: .7}), ureter = standard('#d8c3a8', {roughness: .6});
    ellipsoid(body, V(-.24, .06, 0), [.64, .46, .38], cortex, 30);
    ellipsoid(body, V(.3, -.04, 0), [.52, .56, .38], cortex, 30);
    ellipsoid(body, V(.62, .12, .08), [.16, .24, .16], hilum, 18);
    curve(body, [V(.55, -.2, .02), V(.72, -.52, .05), V(.7, -.92, .0), V(.55, -1.15, .02)], .055, ureter);
    rod(body, V(.56, .18, -.14), V(1.05, .4, -.16), .05, standard('#a9534d', {roughness: .55}));
    rod(body, V(.55, .08, .13), V(1.03, .22, .18), .045, standard('#526f91', {roughness: .55}));
    reference(g, 'x', 'kidney-length', .7);
  } else if (c.variant === 'heart') {
    const muscle = standard(c.color, {roughness: .56}), artery = standard('#b4534f', {roughness: .52}), vein = standard('#536f92', {roughness: .55});
    const vent = ellipsoid(body, V(-.02, -.16, 0), [.5, .68, .43], muscle, 30); vent.rotation.z = -.34;
    ellipsoid(body, V(.25, .02, -.02), [.34, .44, .32], muscle, 24);
    ellipsoid(body, V(-.2, .42, -.02), [.28, .25, .26], muscle, 20);
    ellipsoid(body, V(.31, .42, .02), [.25, .23, .24], muscle, 20);
    curve(body, [V(.06, .48, 0), V(.08, .98, .02), V(.52, 1.1, .02), V(.68, .72, .02)], .11, artery);
    curve(body, [V(-.1, .45, .02), V(-.32, .9, .08), V(-.62, .78, .12)], .1, vein);
    for (const z of [-.36, .36]) curve(body, [V(-.32, .22, z), V(-.45, -.2, z * .9), V(-.12, -.66, z * .7)], .018, artery);
    reference(g, 'x', 'heart-length', .62);
  } else if (c.variant === 'brain') {
    const brainMat = standard(c.color, {roughness: .72}), fold = standard('#8a718b', {roughness: .8});
    for (const s of [-1, 1]) {
      ellipsoid(body, V(s * .37, .34, 0), [.53, .47, .57], brainMat, 30);
      ellipsoid(body, V(s * .52, -.1, .22), [.28, .3, .36], brainMat, 22);
      for (let i = 0; i < 5; i++) {
        const lat = -.45 + i * .2, pts = [];
        for (let j = 0; j <= 8; j++) {
          const lon = -1.15 + j * .29;
          pts.push(V(s * .37 + Math.cos(lat) * Math.cos(lon) * .5, .34 + Math.sin(lat) * .44, Math.cos(lat) * Math.sin(lon) * .55));
        }
        curve(body, pts, .016, fold);
      }
    }
    ellipsoid(body, V(-.24, -.42, -.25), [.3, .22, .28], brainMat, 22);
    ellipsoid(body, V(.24, -.42, -.25), [.3, .22, .28], brainMat, 22);
    rod(body, V(0, -.35, -.12), V(0, -.95, -.15), .14, standard('#c8aaa0', {roughness: .65}));
    reference(g, 'x', 'brain-length', .72);
  } else if (c.variant === 'liver') {
    const liverMat = standard(c.color, {roughness: .52}), gallbladder = standard('#839a62', {roughness: .55});
    ellipsoid(body, V(.24, -.08, 0), [.82, .49, .51], liverMat, 30);
    ellipsoid(body, V(-.55, .1, .02), [.6, .32, .4], liverMat, 26);
    curve(body, [V(.02, .38, .4), V(.02, .05, .42), V(.02, -.3, .25)], .012, standard('#7d5149', {roughness: .7}));
    ellipsoid(body, V(.18, -.34, .3), [.14, .22, .14], gallbladder, 18);
    rod(body, V(-.1, -.32, -.3), V(.38, -.34, -.18), .05, standard('#9e6a55', {roughness: .55}));
    reference(g, 'x', 'liver-span', .7);
  } else if (c.variant === 'lung') {
    const lungMat = standard(c.color, {roughness: .68}), airway = standard('#d9c6b1', {roughness: .55});
    ellipsoid(body, V(.46, -.12, 0), [.43, .78, .4], lungMat, 28);
    ellipsoid(body, V(-.46, -.12, 0), [.43, .78, .4], lungMat, 28);
    rod(body, V(0, .98, 0), V(0, .48, 0), .1, airway);
    rod(body, V(0, .52, 0), V(.39, .24, .02), .07, airway);
    rod(body, V(0, .52, 0), V(-.39, .24, .02), .07, airway);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) rod(body, V(s * .22, .12 - i * .22, 0), V(s * .5, -.04 - i * .24, .12 - i * .1), .025, airway);
    reference(g, 'x', 'lung-height', .7);
  } else if (c.variant === 'femur') {
    const bone = standard(c.color, {roughness: .62}), joint = standard('#f0e9da', {roughness: .5});
    rod(body, V(0, -.95, 0), V(0, .52, 0), .14, bone, .18);
    rod(body, V(0, .52, 0), V(.26, .78, 0), .12, bone, .1);
    ellipsoid(body, V(.3, .9, 0), [.23, .23, .22], joint, 22);
    ellipsoid(body, V(-.16, .62, 0), [.18, .22, .16], joint, 18);
    ellipsoid(body, V(-.18, -1.02, 0), [.22, .16, .24], joint, 20);
    ellipsoid(body, V(.18, -1.02, 0), [.22, .16, .24], joint, 20);
    reference(g, 'x', 'femur-length', .72);
  } else {
    for (const [x, y, z, r] of [[-.6, .18, 0, .42], [0, .34, .1, .45], [.55, .12, -.12, .4], [-.3, -.32, .15, .38], [.4, -.28, .2, .36], [.05, -.02, -.38, .3]]) {
      ellipsoid(body, V(x, y, z), [r, r, r], new THREE.MeshStandardMaterial({color: '#cf9d92', roughness: .85, transparent: true, opacity: .62, side: THREE.DoubleSide}), 26);
      ellipsoid(body, V(x, y, z), [r * .78, r * .78, r * .78], basic('#f0ded9', .18), 22);
    }
    const cap = mesh(new THREE.CylinderGeometry(.07, .07, 1.9, 14), tubeMat, body, V(.1, -.7, .2)); cap.rotation.z = Math.PI / 2;
    for (let i = 0; i < 4; i++) ellipsoid(body, V(-.55 + i * .38, -.7, .2), [.05, .03, .05], standard('#a84d47'), 12);
    reference(g, 'x', 'alveolar-cluster-span', -.95);
  }
}
function crystalLattice(g, c) {
  const atom = standard(c.color, {metalness: .55, roughness: .3}), bond = standard('#b9c8cf', {metalness: .6, roughness: .35}), body = new THREE.Group();
  g.add(body);
  if (c.variant === 'snowflake') {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, dir = V(Math.cos(a), Math.sin(a), 0);
      rod(body, V(), dir.clone().multiplyScalar(.95), .035, bond);
      for (const t of [.45, .7]) { const p = dir.clone().multiplyScalar(t); for (const s of [-1, 1]) { const q = dir.clone().multiplyScalar(t + .18); const side = V(-dir.y, dir.x, 0).multiplyScalar(s * .22); rod(body, p, q.add(side), .018, bond); } }
      ellipsoid(body, dir.clone().multiplyScalar(.95), [.08, .08, .08], atom, 14);
    }
    ellipsoid(body, V(), [.14, .14, .06], atom);
  } else if (c.variant === 'dot') {
    ellipsoid(body, V(), [.5, .5, .5], standard('#c9a45c', {metalness: .6, roughness: .25}), 28);
    for (let i = 0; i < 26; i++) { const a = i * 2.39996, y = (i % 5 - 2) * .22, r = .62; ellipsoid(body, V(Math.cos(a) * r, y, Math.sin(a) * r), [.05, .05, .05], atom, 12); }
  } else {
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const p = V(x * .42, y * .42, z * .42);
      ellipsoid(body, p, [.07, .07, .07], atom, 14);
      if (x < 1) rod(body, p, V((x + 1) * .42, y * .42, z * .42), .012, bond);
      if (y < 1) rod(body, p, V(x * .42, (y + 1) * .42, z * .42), .012, bond);
      if (z < 1) rod(body, p, V(x * .42, y * .42, (z + 1) * .42), .012, bond);
    }
  }
  reference(g, 'x', 'lattice-period-span', -.72);
}
function hydrology(g, c) {
  const land = standard('#6f7f68', {roughness: 1}), water = standard('#3f7f96', {roughness: .25, metalness: .15}), body = new THREE.Group();
  g.add(body);
  if (c.variant === 'lake') {
    mesh(new THREE.BoxGeometry(2, .18, 1.4), land, body, V(0, -.12));
    ellipsoid(body, V(0, -.02, 0), [.72, .03, .42], water, 30);
    ring(body, .74, .018, basic('#9fc4cc', .6), V(0, .01, 0), V(Math.PI / 2, 0, 0));
    mesh(new THREE.BoxGeometry(.5, .32, .6), standard('#5f6f58'), body, V(-.75, .06, -.42));
  } else {
    mesh(new THREE.BoxGeometry(2, .16, 1.3), land, body, V(0, -.1));
    const pts = Array.from({length: 40}, (_, i) => { const t = i / 39; return V(-.95 + t * 1.9, .005 + Math.sin(t * 5.2) * .05, Math.sin(t * 3.1) * .22); });
    curve(body, pts, .06, water);
    for (let i = 0; i < 4; i++) curve(body, pts.map(p => p.clone().add(V(0, .01, -.25 + i * .13))), .008, basic('#9fc4cc', .3));
  }
  reference(g, 'x', 'hydrological-span', -.42);
}
function orbitalSystem(g, c) {
  const sat = standard('#d9b37e', {metalness: .7, roughness: .3}), center = V(-1), belt = c.variant === 'belt';
  ellipsoid(g, center, [.16, .16, .16], standard('#3f6f96', {roughness: .55}), 24);
  halo(g, .3, '#79b6d9', .12, center);
  for (let i = 0; i < (belt ? 4 : 2); i++) ring(g, 2 - i * .18, .004, basic(c.color, .35), center, V(Math.PI / 2, 0, 0));
  for (let i = 0; i < (belt ? 14 : 4); i++) {
    const a = i * 2.399 + i % 2 * .3, r = belt ? 1.55 + (i % 4) * .12 : 1.7 + (i % 2) * .2;
    if (belt) ellipsoid(g, V(center.x + Math.cos(a) * r, Math.sin(i) * .06, Math.sin(a) * r), [.018, .018, .018], basic('#b9a98d'), 8);
    else mesh(new THREE.BoxGeometry(.12, .09, .08), sat, g, V(center.x + Math.cos(a) * r, Math.sin(i) * .06, Math.sin(a) * r));
  }
  reference(g, 'x', 'orbital-radius', -.32);
}
const builders = {architecture, terrain, field, coin, pencil, grain, hand, arthropod, whale, microbe, organelle, membrane, motor, molecule, atom, nucleus, wave, sphere: sphereObject, mirror, filament, galaxy, cluster, nebula, distance, device, vehicle, 'tissue-section': tissueSection, 'crystal-lattice': crystalLattice, hydrology, 'orbital-system': orbitalSystem};
export const SPATIAL_TEMPLATES = Object.freeze(Object.keys(builders));

// These subjects read as small props on the default orthographic stage. Give
// them a slightly tighter authored framing without changing their measured
// reference length; users can still zoom out with the stage controls.
const FOCUS_FRAME_PADDING = Object.freeze({
  'burj-khalifa': .19,
  chair: .18,
  'a4-paper': .30,
  ant: .28,
  amoeba: .50,
  'office-chair': .17,
  'coffee-table': .24,
  nightstand: .10,
  bookshelf: .11,
});

/** Builds q=2 world units on the explicitly named reference segment. */
export function createSpatialObject(entry, config = entry?.visual) {
  if (!Number.isFinite(entry?.quantity?.value) || entry.quantity.value <= 0) throw new RangeError('Spatial object requires a finite positive comparison length');
  if (!config || !builders[config.template]) throw new Error(`Missing spatial template for ${entry?.id}`);
  if (!config.caption || !config.note || !config.referenceAxis || !config.color) throw new Error(`Incomplete visual configuration: ${entry.id}`);
  if (config.sourceMeasure && config.sourceMeasure !== entry.quantity.measure) throw new Error(`Spatial measurement configuration is stale: ${entry.id}`);
  const group = new THREE.Group(); group.name = entry.id;
  builders[config.template](group, config, rng(entry.id), entry);
  if (!group.userData.reference) throw new Error(`Template has no comparison reference: ${config.template}`);
  if (group.userData.reference.axis !== config.referenceAxis) throw new Error(`Spatial reference axis mismatch: ${entry.id}`);
  group.userData.template = config.template;
  group.userData.caption = config.caption;
  group.userData.note = config.note;
  group.userData.referenceAxis = config.referenceAxis;
  const subject = String(entry.id || '').replace(/^space\./, '');
  group.userData.framePadding = FOCUS_FRAME_PADDING[subject] ?? config.framePadding ?? .26;
  group.userData.quantity = {value: entry.quantity.value, measure: entry.quantity.measure, normalizedLength: 2};
  group.userData.parameters = {...config};
  const update = group.userData.update;
  group.userData.update = (delta = 0, time = 0) => {if (Number.isFinite(delta) && Number.isFinite(time)) update?.(Math.min(Math.max(delta, 0), .1), Math.max(time, 0));};
  return group;
}
