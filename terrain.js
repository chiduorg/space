import * as THREE from 'three';
import {standard as materialStandard} from '/engine/renderer/materials.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const mat = (color, extra = {}) => materialStandard(color, {roughness: .9, ...extra});
const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: opacity === 1});
function mesh(geometry, material, parent, position) {
  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.copy(position);
  if (parent) parent.add(m);
  return m;
}
function box(w, h, d, material, parent, position) { return mesh(new THREE.BoxGeometry(w, h, d), material, parent, position); }
function round(parent, position, scale, material, detail = 18) {
  const m = mesh(new THREE.SphereGeometry(1, detail, Math.max(8, detail * 2 / 3)), material, parent, position);
  m.scale.set(...scale); return m;
}
function rod(parent, a, b, radius, material, radiusB = radius, segments = 10) {
  const dir = b.clone().sub(a), len = dir.length();
  if (!(len > 0)) return null;
  const m = mesh(new THREE.CylinderGeometry(radiusB, radius, len, segments), material, parent, a.clone().add(b).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(V(0, 1), dir.normalize()); return m;
}
function tube(parent, points, radius, material, segments = 28) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false), material, parent);
}
function fit(parent, axis = 'x', length = 2) {
  parent.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(parent), size = b.getSize(V()), scale = length / size[axis];
  const center = b.getCenter(V());
  parent.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  parent.scale.setScalar(scale);
}
function guide(parent, axis, offset) {
  const a = V(), b = V();
  if (axis === 'x') { a.set(-1, offset, .2); b.set(1, offset, .2); }
  else { a.set(offset, -1, .2); b.set(offset, 1, .2); }
  const g = new THREE.Group(); g.name = 'terrain-reference'; g.userData.decorative = true;
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineDashedMaterial({color: '#bddce2', transparent: true, opacity: .64, dashSize: .045, gapSize: .035}));
  l.computeLineDistances(); g.add(l);
  for (const p of [a, b]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().add(V(0, .05, 0)), p.clone().add(V(0, -.05, 0))]), new THREE.LineBasicMaterial({color: '#e3f5f6', transparent: true, opacity: .9})));
  parent.add(g); parent.userData.reference = {axis, kind: 'terrain-span', length: 2, start: a.toArray(), end: b.toArray()};
}
function noise(x, z) {
  return Math.sin(x * 53.13 + z * 21.7) * .5 + Math.sin(x * 19.1 - z * 37.9) * .32 + Math.sin(x * 7.7 + z * 11.3) * .18;
}

function heightfield(group, id, colorBase) {
  const size = 2.2, seg = 110, geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, colors = [], base = new THREE.Color(colorBase);
  const water = ['pacific-ocean', 'mariana-trench', 'great-barrier-reef', 'mid-ocean-ridge'].includes(id);
  const snow = ['everest', 'himalaya', 'alps', 'andes', 'olympus-mons', 'mount-fuji'].includes(id);
  const ice = ['antarctica', 'glacier', 'iceberg', 'greenland'].includes(id);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    let y = 0;
    if (id === 'alps') {
      const arc = .23 * Math.sin((x + 1.05) * 1.45) - .04, d = z - arc;
      const edge = Math.max(0, 1 - (Math.abs(x) / 1.06) ** 8) * Math.max(0, 1 - (Math.abs(z) / 1.06) ** 6);
      const main = Math.exp(-d * d * 19) * (.44 + .30 * Math.sin(x * 5.2 + .8) ** 2 + .12 * Math.sin(x * 11.7));
      const flank = Math.exp(-((d - .23) ** 2) * 56) * .18 + Math.exp(-((d + .21) ** 2) * 46) * .14;
      y = .015 + (main + flank) * edge + noise(x * 8, z * 8) * .018;
    } else if (id === 'grand-canyon') {
      const arc = .24 * Math.sin(x * 2.6) + .04 * Math.sin(x * 5.4), d = z - arc;
      const plateau = .25 + .05 * Math.sin(x * 5.1 + 1.3) + noise(x * 3, z * 3) * .025;
      const canyon = Math.exp(-(d * d) / (.085 + .018 * Math.sin(x * 4.2 + 1.1) ** 2));
      y = plateau - canyon * .52;
      y += Math.max(0, .16 - Math.abs(d)) * .035;
      if (Math.abs(d) > .28) y += .035 * Math.sin(x * 11 + z * 7);
    } else if (id === 'alps' || id === 'andes' || id === 'himalaya') {
      const ridge = Math.sin(x * 4.2) * .16, edge = Math.max(0, 1 - (Math.abs(x) / 1.05) ** 8) * Math.max(0, 1 - (Math.abs(z) / 1.05) ** 8);
      const d = Math.abs(z - ridge);
      y = .06 + (Math.exp(-d * d * 16) * (.55 + .42 * Math.sin(x * 6.4 + 1.2) ** 2) + Math.exp(-(Math.abs(z + .3) ** 2) * 20) * .25) * edge;
      y += noise(x * 3, z * 3) * .05;
    } else if (id === 'everest' || id === 'mount-fuji') {
      const cone = id === 'mount-fuji' ? Math.max(0, 1 - r * 1.15) : Math.exp(-r * r * 2.2);
      y = -.18 + cone * (id === 'mount-fuji' ? .95 : 1.2) + noise(x * 4, z * 4) * .04;
      if (id === 'everest') y += Math.max(0, .3 - r) * .12;
    } else if (id === 'gobi' || id === 'sahara') {
      y = .03 + Math.sin(x * 5.2 + z * 2.1) * .08 + Math.sin(z * 7.3 - x * 1.4) * .05 + noise(x * 2, z * 2) * .02;
    } else if (id === 'grand-canyon') {
      const cut = Math.abs(z - Math.sin(x * 2.7) * .12);
      y = cut < .16 ? -.28 + Math.sin(z * 40) * .04 : .42 + noise(x * 2, z * 2) * .04;
      if (cut < .2 && cut > .13) y = .12;
    } else if (id === 'island') {
      const coast = 1 - (x / 1.04) ** 2 - (z / .4) ** 2;
      const ridge = Math.exp(-(z * z) * 22) * Math.max(0, 1 - (x / 1.02) ** 2);
      const peaks = .1 + .5 * Math.exp(-((x - .55) ** 2) / .065) + .42 * Math.exp(-((x - .02) ** 2) / .085) + .33 * Math.exp(-((x + .62) ** 2) / .09) - .16 * Math.exp(-((x + .25) ** 2) / .035);
      y = -.12 + Math.max(0, coast) * .11 + ridge * Math.max(0, peaks) + noise(x * 5, z * 5) * .025;
    } else if (id === 'greenland') {
      y = .02 + Math.max(0, .68 - r * .9) * (1 - r * .4) + noise(x * 3, z * 3) * .04 - .06;
    } else if (id === 'antarctica' || id === 'glacier' || id === 'iceberg') {
      y = .02 + Math.max(0, .38 - r * .22) * .32 + Math.max(0, noise(x * 3, z * 3)) * .06;
      if (id === 'glacier') y -= Math.max(0, .35 - Math.abs(z)) * .08;
    } else if (id === 'olympus-mons') {
      y = -.2 + Math.exp(-r * r * 2.4) * 1.15 + Math.max(0, .05 - r) * -.25;
    } else if (id === 'volcano') {
      const slope = Math.max(0, 1 - r / 1.12);
      y = -.22 + slope ** 1.42 * 1.02;
      if (r < .17) y -= (.17 - r) * 2.2;
      if (r < .055) y += .03;
      y += noise(x * 7, z * 7) * .025;
    } else if (id === 'mariana-trench') {
      y = -.08 - Math.exp(-(z * z) * 12) * .72;
    } else if (id === 'mid-ocean-ridge') {
      y = -.1 + Math.exp(-(z * z) * 8) * .36 - Math.exp(-(z * z) * 26) * .1;
    } else if (id === 'pacific-ocean') {
      y = -.04 + Math.sin(x * 6 + z * 4) * .025;
    } else if (id === 'great-barrier-reef') {
      y = -.12 + Math.max(0, .55 - r) * .18 + noise(x * 5, z * 5) * .03;
    } else if (id === 'chicxulub-crater') {
      y = .03 - Math.exp(-r * r * 4) * .32 + Math.exp(-((r - .3) ** 2) * 16) * .22;
    } else if (id === 'deccan-traps' || id === 'siberian-traps') {
      y = .04 + Math.floor((.45 + Math.sin(x * 3.4) * .12 + Math.sin(z * 2.7) * .1) * 8) / 8 * .42;
      y += noise(x * 3, z * 3) * .02;
    } else if (id === 'san-andreas-fault') {
      y = .02 + Math.max(0, Math.abs(z + .04) - .12) * .4;
    } else if (id === 'city') {
      y = 0;
    } else {
      y = .06 + Math.max(0, .55 - r) * .25;
    }
    p.setY(i, y);
    let color;
    if (ice) color = new THREE.Color(y > .25 ? '#e8f1f3' : '#b9d4dc');
    else if (water) color = new THREE.Color(y > -.03 ? '#6d958f' : '#7c8e82');
    else if (snow && y > .72) color = new THREE.Color('#eef5f3');
    else if (id === 'alps') {
      if (y > .60) color = new THREE.Color('#edf4f4');
      else if (y > .40) color = new THREE.Color('#858b87');
      else if (y > .18) color = new THREE.Color('#405b48');
      else color = new THREE.Color('#65775d');
    } else if (id === 'grand-canyon') {
      if (y < -.19) color = new THREE.Color('#7d8f83');
      else {
        const palette = ['#6b3d2c', '#8b4e34', '#a96042', '#c78964', '#d8b28b', '#7a4b38'];
        color = new THREE.Color(palette[Math.floor((y + .2) * 12) % palette.length]);
      }
    }
    else if (id === 'island') color = new THREE.Color(y > .38 ? '#8d8f7d' : y > .18 ? '#6f8058' : '#5d7558');
    else if (id === 'volcano') color = new THREE.Color(y > .55 ? '#6d6259' : y > .2 ? '#806550' : '#5f5948');
    else if (y > .38) color = new THREE.Color('#8c918b');
    else if (y > .18) color = new THREE.Color('#a48e70');
    else color = base.clone();
    color.multiplyScalar(.78 + .2 * (.5 + .5 * Math.sin(x * 12 + z * 9)));
    if (id === 'grand-canyon' && Math.abs(z - (.24 * Math.sin(x * 2.6) + .04 * Math.sin(x * 5.4))) < .09) color.lerp(new THREE.Color('#5b4232'), .35);
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  mesh(geo, mat('#ffffff', {vertexColors: true, side: THREE.DoubleSide, roughness: .95}), group);
  if (['alps', 'andes', 'himalaya', 'everest', 'mount-fuji', 'volcano', 'olympus-mons'].includes(id)) {
    box(2.2, .16, 2.2, mat('#514b40', {roughness: 1}), group, V(0, -.08, 0));
  }
  if (id === 'grand-canyon') box(2.2, .10, 2.2, mat('#4b3529', {roughness: 1}), group, V(0, -.31, 0));
  if (id === 'island') {
    box(3.3, .04, 2.5, mat('#2f6f82', {roughness: .35, metalness: .15}), group, V(0, -.17, 0));
    for (let i = 0; i < 12; i++) {
      const x = -1.5 + i * .26, z = (i % 3 - 1) * .6;
      const wave = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x, -.145, z), V(x + .16, -.14, z + .05), V(x + .3, -.148, z)]), new THREE.LineBasicMaterial({color: '#7fb5bf', transparent: true, opacity: .35}));
      group.add(wave);
    }
  }
  if (water) {
    const surface = mesh(new THREE.PlaneGeometry(2.2, 2.2), mat(id === 'great-barrier-reef' ? '#2f7c86' : '#2d6173', {transparent: true, opacity: .32, roughness: .2, metalness: .1, depthWrite: false}), group, V(0, .02, 0));
    surface.rotation.x = -Math.PI / 2;
  }
}

function terrainProps(group, id, random) {
  if (id === 'alps') {
    const pine = mat('#2f4a3b', {roughness: .85});
    for (let i = 0; i < 62; i++) {
      const x = -1.02 + random() * 2.04, arc = .23 * Math.sin((x + 1.05) * 1.45) - .04;
      const z = arc + (random() < .5 ? -.56 : .56) + (random() - .5) * .22;
      const h = .08 + random() * .10;
      const y = .01 + random() * .03;
      const tree = mesh(new THREE.ConeGeometry(.022 + random() * .012, h, 7), pine, group, V(x, y + h / 2, z));
    }
    for (let i = 0; i < 18; i++) {
      const x = -1 + random() * 2, z = -.9 + random() * .5;
      round(group, V(x, .02, z), [.02, .012, .02], mat('#7f847b'), 8);
    }
    return;
  }
  if (id === 'grand-canyon') {
    const riverPoints = [];
    for (let i = 0; i <= 40; i++) {const x = -1 + i / 40 * 2; riverPoints.push(V(x, -.195, .24 * Math.sin(x * 2.6) + .04 * Math.sin(x * 5.4)));}
    tube(group, riverPoints, .035, mat('#3f7b88', {roughness: .28, metalness: .12}), 48);
    for (let i = 0; i < 9; i++) {
      const x = -1 + i / 8 * 2, base = .24 * Math.sin(x * 2.6) + .04 * Math.sin(x * 5.4);
      for (const s of [-1, 1]) round(group, V(x + (random() - .5) * .1, -.20, base + s * .10), [.10, .02, .07], mat(i % 2 ? '#b6764f' : '#8a5138'), 8);
    }
    for (let i = 0; i < 4; i++) {
      const x = -1.1 + i * .62, z = .24 * Math.sin(x * 2.6) + .06;
      const mesa = mesh(new THREE.CylinderGeometry(.13 + (i % 2) * .05, .18, .18, 7), mat(i % 2 ? '#9b5c3d' : '#7e4933'), group, V(x, .20, z - .55));
      mesa.scale.y = .72;
    }
    return;
  }
  if (id === 'city') {
    const concrete = mat('#8d9699', {roughness: .7}), window = basic('#9ac5d8', .62), road = mat('#3c4548');
    box(2.2, .03, 2.2, road, group, V(0, -.02));
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i + j) % 5 === 0) continue;
        const h = .18 + random() * .5, w = .16 + random() * .08;
        box(w, h, w, concrete, group, V(-.85 + i * .27, h / 2, -.85 + j * .27));
        for (let k = 0; k < 4; k++) box(w * .72, .012, .01, window, group, V(-.85 + i * .27, .08 + k * .1, -.85 + j * .27 + w / 2 + .006));
      }
    }
    for (let i = 0; i < 3; i++) box(2.1, .006, .035, mat('#d8d2be'), group, V(0, .01, -.65 + i * .65));
    return;
  }
  if (id === 'road-lane') {
    const asphalt = mat('#343d40', {roughness: .86}), line = basic('#ece4cc', .9);
    box(2.2, .035, .52, asphalt, group);
    for (let i = 0; i < 3; i++) box(.4, .006, .018, line, group, V(-.72 + i * .72, .022, 0));
    for (const z of [-.26, .26]) box(2.2, .02, .025, mat('#cfc6ad'), group, V(0, .028, z));
    for (let i = 0; i < 5; i++) box(.035, .006, .5, mat('#5d686b'), group, V(-.9 + i * .45, .025, 0));
    return;
  }
  if (id === 'great-barrier-reef') {
    for (let i = 0; i < 34; i++) {
      const x = (random() - .5) * 1.8, z = (random() - .5) * 1.8, y = -.12 + random() * .12;
      const coralMat = mat(['#c96f65', '#d8a15f', '#8a9b6c', '#a675a1', '#d8c07a'][i % 5], {roughness: .8});
      const base = V(x, y, z);
      for (let j = 0; j < 3; j++) {
        const tip = base.clone().add(V((random() - .5) * .22, .1 + random() * .2, (random() - .5) * .22));
        tube(group, [base, base.clone().add(V(0, .06, 0)), tip], .022, coralMat, 16);
        round(group, tip, [.035, .035, .035], coralMat, 8);
      }
    }
    return;
  }
  if (id === 'san-andreas-fault') {
    for (const s of [-1, 1]) {
      const block = mesh(new THREE.BoxGeometry(2.1, .38, .9), mat('#8b7b68', {roughness: .9}), group, V(0, -.12, s * .52));
      block.rotation.y = s * .03;
    }
    const crack = [];
    for (let i = 0; i < 30; i++) crack.push(V(-1 + i * .07, .07 + Math.sin(i * .8) * .02, -.03 + Math.sin(i * 1.3) * .03));
    tube(group, crack, .018, mat('#c76b4a', {roughness: .8}), 50);
    for (let i = 0; i < 18; i++) round(group, V(-.9 + random() * 1.8, .06, -.1 + random() * .2), [.03, .02, .03], mat('#6f6154'), 8);
    return;
  }
  if (id === 'chicxulub-crater') {
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU, r = .42 + random() * .12;
      round(group, V(Math.cos(a) * r, .0, Math.sin(a) * r), [.07, .03, .07], mat('#857663'), 8);
    }
    return;
  }
  if (id === 'deccan-traps' || id === 'siberian-traps') {
    for (let i = 0; i < 9; i++) {
      const z = -.8 + i * .2;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-1, .05, z), V(1, .05, z)]), new THREE.LineBasicMaterial({color: '#5a5042', transparent: true, opacity: .45})));
    }
    for (let i = 0; i < 5; i++) {
      const x = -.8 + i * .4;
      tube(group, [V(x, .02, -.9), V(x + .12, .02, -.2), V(x - .05, .02, .6)], .012, basic('#d06b36', .55), 24);
    }
    return;
  }
  if (id === 'antarctica' || id === 'greenland' || id === 'glacier') {
    for (let i = 0; i < 12; i++) {
      const x = -1 + random() * 2, z = -1 + random() * 2;
      const pts = [V(x, .04, z), V(x + .15, .03, z + .2), V(x + .32, .02, z + .22)];
      tube(group, pts, .012, basic('#7fa9bc', .55), 20);
    }
    if (id === 'iceberg') {
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU;
        const tip = mesh(new THREE.ConeGeometry(.22, .55, 5), mat('#b9d4dc', {roughness: .5}), group, V(Math.cos(a) * .4, .18, Math.sin(a) * .4));
      }
    }
    return;
  }
  if (id === 'great-barrier-reef' || id === 'pacific-ocean' || id === 'mariana-trench' || id === 'mid-ocean-ridge') {
    for (let i = 0; i < 6; i++) {
      const x = -1 + random() * 2, z = -1 + random() * 2;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x, .04, z), V(x + .2, .04, z + .08), V(x + .4, .04, z)]), new THREE.LineBasicMaterial({color: '#c8e1e4', transparent: true, opacity: .4})));
    }
    return;
  }
  if (id === 'gobi' || id === 'sahara') {
    for (let i = 0; i < 10; i++) {
      const x = -1 + random() * 2, z = -1 + random() * 2;
      round(group, V(x, .03, z), [.06, .02, .05], mat('#8c7356'), 8);
    }
    return;
  }
  if (id === 'olympus-mons' || id === 'mount-fuji' || id === 'volcano') {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + .2;
      tube(group, [V(Math.cos(a) * .06, .7, Math.sin(a) * .06), V(Math.cos(a) * .2, .5, Math.sin(a) * .2), V(Math.cos(a) * .62, .04, Math.sin(a) * .62)], .015, basic(i % 3 ? '#c9753f' : '#e1a35c', .65), 26);
    }
    for (let i = 0; i < 18; i++) {
      const a = random() * TAU, r = .03 + random() * .12, y = .7 + random() * .5;
      round(group, V(Math.cos(a) * r, y, Math.sin(a) * r), [.03 + random() * .04, .02, .03 + random() * .04], mat(i % 2 ? '#7d7670' : '#a29a90', {transparent: true, opacity: .5}), 8);
    }
    return;
  }
  if (id === 'island') {
    return;
  }
}

export function createTerrain(g, c, random, entry) {
  const id = String(entry?.id || '').replace('space.', '');
  const axis = entry?.visual?.referenceAxis === 'y' ? 'y' : 'x';
  const group = new THREE.Group(); g.add(group);
  heightfield(group, id, c.color);
  terrainProps(group, id, random);
  fit(group, axis);
  guide(g, axis, axis === 'x' ? -.82 : -.86);
}
