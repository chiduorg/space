import * as THREE from 'three';
import {standard as materialStandard} from '/engine/renderer/materials.js';
import {attachExternalModel} from './external-models.js';

const ANIMAL_LAYOUT = {
  eagle: {fit: 1.36},
  penguin: {fit: 1.32},
  rabbit: {fit: 1.5},
  dog: {fit: 1.55},
  cat: {fit: 1.58},
  squirrel: {fit: 1.46, y: .06},
  'gray-squirrel': {fit: 1.46, y: .06},
  horse: {fit: 1.62},
  orca: {fit: 1.62, y: .18},
  'humpback-whale': {fit: 1.62, y: .18},
  gorilla: {rotation: 0, fit: 2.15},
  koala: {rotation: 0},
  beaver: {rotation: 0},
  bat: {rotation: 0, fit: 1.3},
  'fruit-bat': {rotation: 0, fit: 1.3},
  'vampire-bat': {rotation: 0, fit: 1.3},
  walrus: {fit: 1.45},
  hippopotamus: {fit: 2.2},
  pterosaur: {rotation: 0},
  frog: {fit: 1.6},
  chimpanzee: {fit: 2.45},
  'common-toad': {fit: 1.9},
  stingray: {tiltX: .55, fit: 1.72},
  salmon: {rotation: 0, fit: 2.15},
  cod: {rotation: 0, fit: 2.05},
  'harbor-seal': {fit: 1.85, y: .08, tiltX: -.1},
  'blue-whale': {fit: 2.0, y: .12, tiltX: -.42},
  'sperm-whale': {fit: 2.0, y: .12, tiltX: -.42},
  brachiosaurus: {rotation: .95, fit: 2.55, y: .1},
  iguana: {fit: 2.0},
  'komodo-dragon': {fit: 2.45}
};

const ANIMAL_EXTERNAL = {
  lion: 'https://static.chidu.org/media/models/lion-lowpoly.glb',
  tiger: 'https://static.chidu.org/media/models/tiger.glb',
  giraffe: 'https://static.chidu.org/media/models/giraffe.glb',
  'brown-bear': 'https://static.chidu.org/media/models/low-poly-bear.glb',
  'gray-wolf': 'https://static.chidu.org/media/models/low-poly-wolf.glb',
  coyote: 'https://static.chidu.org/media/models/low-poly-wolf.glb',
  'red-fox': 'https://static.chidu.org/media/models/low-poly-fox.glb',
  rabbit: 'https://static.chidu.org/media/models/low-poly-rabbit.glb',
  horse: 'https://static.chidu.org/media/models/low-poly-horse.glb',
  cattle: 'https://static.chidu.org/media/models/low-poly-cow.glb',
  bison: 'https://static.chidu.org/media/models/low-poly-bull.glb',
  sheep: 'https://static.chidu.org/media/models/low-poly-sheep.glb',
  'domestic-pig': 'https://static.chidu.org/media/models/low-poly-pig.glb',
  elephant: 'https://static.chidu.org/media/models/low-poly-elephant.glb',
  rhinoceros: 'https://static.chidu.org/media/models/low-poly-rhino.glb',
  hippopotamus: 'https://static.chidu.org/media/models/real-hippo.glb',
  gorilla: 'https://static.chidu.org/media/models/real-gorilla.glb',
  chimpanzee: 'https://static.chidu.org/media/models/real-chimp.glb',
  'harbor-seal': 'https://static.chidu.org/media/models/real-seal.glb',
  stingray: 'https://static.chidu.org/media/models/real-stingray.glb',
  'sperm-whale': 'https://static.chidu.org/media/models/real-sperm.glb',
  'blue-whale': 'https://static.chidu.org/media/models/real-blue.glb',
  brachiosaurus: 'https://static.chidu.org/media/models/real-brachio.glb',
  iguana: 'https://static.chidu.org/media/models/real-iguana.glb',
  'komodo-dragon': 'https://static.chidu.org/media/models/real-komodo.glb',
  salmon: 'https://static.chidu.org/media/models/real-salmon.glb',
  cod: 'https://static.chidu.org/media/models/real-salmon.glb',
  'common-toad': 'https://static.chidu.org/media/models/real-toad.glb',
  penguin: 'https://static.chidu.org/media/models/low-poly-penguin.glb',
  octopus: 'https://static.chidu.org/media/models/low-poly-octopus.glb',
  shark: 'https://static.chidu.org/media/models/low-poly-great-white-shark.glb',
  megalodon: 'https://static.chidu.org/media/models/low-poly-great-white-shark.glb',
  'bottlenose-dolphin': 'https://static.chidu.org/media/models/low-poly-dolphin.glb',
  'humpback-whale': 'https://static.chidu.org/media/models/low-poly-humpback-whale.glb',
  'king-cobra': 'https://static.chidu.org/media/models/low-poly-snake.glb',
  python: 'https://static.chidu.org/media/models/low-poly-snake.glb',
  anaconda: 'https://static.chidu.org/media/models/low-poly-snake.glb',
  moose: 'https://static.chidu.org/media/models/moose.glb',
  cheetah: 'https://static.chidu.org/media/models/cheetah.glb',
  leopard: 'https://static.chidu.org/media/models/cheetah.glb',
  crocodile: 'https://static.chidu.org/media/models/crocodile.glb',
  eagle: 'https://static.chidu.org/media/models/eagle.glb',
  condor: 'https://static.chidu.org/media/models/eagle.glb',
  axolotl: 'https://static.chidu.org/media/models/axolotl.glb',
  orca: 'https://static.chidu.org/media/models/orca.glb',
  'gray-squirrel': 'https://static.chidu.org/media/models/squirrel.glb',
  cat: 'https://static.chidu.org/media/models/kitten.glb',
  dog: 'https://static.chidu.org/media/models/puppy.glb',
  'tree-frog': null,
  frog: 'https://static.chidu.org/media/models/poly-tree-frog.glb',
  mouse: 'https://static.chidu.org/media/models/poly-mouse.glb',
  'vampire-bat': 'https://static.chidu.org/media/models/poly-bat-front.glb',
  'fruit-bat': 'https://static.chidu.org/media/models/poly-bat-front.glb',
  bat: 'https://static.chidu.org/media/models/poly-bat-front.glb',
  hummingbird: 'https://static.chidu.org/media/models/poly-hummingbird.glb',
  gecko: 'https://static.chidu.org/media/models/poly-gecko.glb',
  hamster: 'https://static.chidu.org/media/models/poly-hamster.glb',
  'fire-salamander': 'https://static.chidu.org/media/models/poly-salamander.glb',
  'giant-salamander': 'https://static.chidu.org/media/models/poly-salamander.glb',
  lobster: 'https://static.chidu.org/media/models/poly-lobster2.glb',
  'rhesus-macaque': 'https://static.chidu.org/media/models/poly-macaque.glb',
  koala: 'https://static.chidu.org/media/models/poly-koala.glb',
  beaver: 'https://static.chidu.org/media/models/poly-beaver.glb',
  'green-sea-turtle': 'https://static.chidu.org/media/models/poly-turtle.glb',
  'domestic-goat': 'https://static.chidu.org/media/models/poly-goat.glb',
  orangutan: 'https://static.chidu.org/media/models/poly-orangutan.glb',
  'red-kangaroo': 'https://static.chidu.org/media/models/poly-kangaroo.glb',
  coelacanth: 'https://static.chidu.org/media/models/poly-coelacanth.glb',
  ostrich: 'https://static.chidu.org/media/models/poly-emu.glb',
  'dromedary-camel': 'https://static.chidu.org/media/models/poly-camel.glb',
  tuna: 'https://static.chidu.org/media/models/poly-tuna.glb',
  walrus: 'https://static.chidu.org/media/models/poly-walrus2.glb',
  tyrannosaurus: 'https://static.chidu.org/media/models/poly-tyrannosaurus.glb',
  triceratops: 'https://static.chidu.org/media/models/poly-triceratops.glb',
  swordfish: 'https://static.chidu.org/media/models/poly-swordfish.glb',
  chameleon: 'https://static.chidu.org/media/models/poly-gecko.glb',
  'saber-toothed-cat': 'https://static.chidu.org/media/models/poly-cougar.glb',
  'woolly-mammoth': 'https://static.chidu.org/media/models/low-poly-elephant.glb'
};

const TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const mat = (color, extra = {}) => materialStandard(color, {roughness: .62, ...extra});

function orb(parent, position, scale, material, detail = 30) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, detail, Math.max(12, Math.round(detail * .66))), material);
  mesh.position.copy(position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
}
function tube(parent, points, radius, material, segments = 40, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, segments), radius, radial, false), material);
  parent.add(mesh); return mesh;
}
function rod(parent, a, b, radius, material, radiusB = radius, segments = 12) {
  const direction = b.clone().sub(a), length = direction.length();
  if (!(length > 0)) return null;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusB, radius, length, segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1), direction.normalize());
  parent.add(mesh); return mesh;
}
function cone(parent, position, radius, height, material, rotation = V()) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 14), material);
  mesh.position.copy(position); mesh.rotation.set(rotation.x, rotation.y, rotation.z); parent.add(mesh); return mesh;
}
function fit(group, axis = 'x', length = 2) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group), extent = box.getSize(V())[axis];
  if (!(extent > 0) || !Number.isFinite(extent)) throw new Error('Empty animal template');
  const scale = length / extent;
  const center = box.getCenter(V());
  group.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  group.scale.setScalar(scale);
}
function guide(parent, axis = 'x', offset = -.78) {
  const a = V(), b = V(); a[axis] = -1; b[axis] = 1;
  if (axis === 'x') {a.y = b.y = offset; a.z = b.z = .19;}
  if (axis === 'y') {a.x = b.x = offset; a.z = b.z = .19;}
  const group = new THREE.Group(); group.name = 'comparison-reference'; group.userData.decorative = true;
  const material = new THREE.LineDashedMaterial({color: '#bddce2', transparent: true, opacity: .62, dashSize: .045, gapSize: .035});
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), material); line.computeLineDistances(); group.add(line);
  const cross = axis === 'x' ? V(0, .05, .03) : V(.05, 0, .03);
  for (const endpoint of [a, b]) {
    const end = new THREE.Line(new THREE.BufferGeometry().setFromPoints([endpoint.clone().sub(cross), endpoint.clone().add(cross)]), new THREE.LineBasicMaterial({color: '#e3f5f6', transparent: true, opacity: .9}));
    group.add(end);
  }
  parent.add(group);
  parent.userData.reference = {axis, kind: 'animal-span', length: 2, start: a.toArray(), end: b.toArray()};
}

const PALETTES = {
  'african-lion': {body: '#c99a5e', dark: '#4b3526', light: '#e8d3a6'}, lion: {body: '#c99a5e', dark: '#4b3526', light: '#e8d3a6'}, tiger: {body: '#c87a36', dark: '#3a2619', light: '#ecd9b2'},
  leopard: {body: '#d4ad73', dark: '#4a3827', light: '#efe0b8'}, cheetah: {body: '#d8a95f', dark: '#3e3024', light: '#f1e1b5'},
  'saber-toothed-cat': {body: '#b58a5d', dark: '#433122', light: '#ddc59a'},
  horse: {body: '#8a5a35', dark: '#2d2119', light: '#c9a06a'}, 'red-kangaroo': {body: '#b56f4a', dark: '#3c2920', light: '#d9b18c'},
  cattle: {body: '#6f6258', dark: '#241e19', light: '#cfc4b4'}, bison: {body: '#5a4636', dark: '#241b15', light: '#a98d6d'},
  sheep: {body: '#d9d3c4', dark: '#4a4036', light: '#f2eee4'}, 'domestic-goat': {body: '#b9aa96', dark: '#3e3429', light: '#ddd2be'},
  'domestic-pig': {body: '#d9a6a0', dark: '#4c332f', light: '#efc9c1'}, 'dromedary-camel': {body: '#c49a66', dark: '#4a3424', light: '#e3c89a'},
  giraffe: {body: '#d8a85c', dark: '#4a3522', light: '#ecd39c'}, elephant: {body: '#8f8d89', dark: '#37332f', light: '#bcb8b1'},
  rhinoceros: {body: '#8a8780', dark: '#37322d', light: '#b4aea5'}, hippopotamus: {body: '#7d7270', dark: '#332b29', light: '#a89b96'},
  'harbor-seal': {body: '#7f8b86', dark: '#343d39', light: '#c6cec8'}, 'blue-whale': {body: '#617885', dark: '#26343e', light: '#b5c4cc'}, 'sperm-whale': {body: '#6a6058', dark: '#2d2723', light: '#b6aaa0'},
  walrus: {body: '#9b8b78', dark: '#3d3126', light: '#cdbda6'}, moose: {body: '#5e4632', dark: '#251a12', light: '#9a7652'},
  'woolly-mammoth': {body: '#7a5e45', dark: '#332319', light: '#b59875'},
  'brown-bear': {body: '#6b4f3d', dark: '#2b1e16', light: '#9d7a5d'}, 'gray-wolf': {body: '#8e918d', dark: '#35393a', light: '#c4c6c1'},
  coyote: {body: '#a8895f', dark: '#3c2c1c', light: '#d4ba91'}, 'red-fox': {body: '#c56a34', dark: '#3b2115', light: '#f0ddc2'},
  dog: {body: '#b58b62', dark: '#3e2b1c', light: '#e0cba9'}, cat: {body: '#a99c8e', dark: '#3c342c', light: '#d8cdbf'},
  rabbit: {body: '#b9a990', dark: '#3e3328', light: '#e4d6c3'}, 'gray-squirrel': {body: '#9a8d80', dark: '#3c332b', light: '#c9bcab'}, squirrel: {body: '#9a8d80', dark: '#3c332b', light: '#c9bcab'},
  beaver: {body: '#7c5a3e', dark: '#2e2117', light: '#b18b62'},
  hamster: {body: '#c8a071', dark: '#3e2b1b', light: '#eed4b6'}, mouse: {body: '#9c8a7a', dark: '#332a24', light: '#c7b8a9'},
  koala: {body: '#9fa5a4', dark: '#333836', light: '#c8ccca'},
  gorilla: {body: '#5c5148', dark: '#211c18', light: '#857a6f'}, chimpanzee: {body: '#6b5540', dark: '#2a2018', light: '#9c8062'},
  orangutan: {body: '#a45f32', dark: '#3a2414', light: '#cf9760'}, 'rhesus-macaque': {body: '#9b7b5c', dark: '#3c2c1e', light: '#c5a681'},
  frog: {body: '#5f8f4a', dark: '#26381d', light: '#9bc17a'}, 'tree-frog': {body: '#4f9a56', dark: '#1f3821', light: '#9ed38e'},
  'common-toad': {body: '#8a7a4e', dark: '#332b1b', light: '#bcae7d'}, 'fire-salamander': {body: '#3b3f3a', dark: '#171b17', light: '#b06a32'},
  axolotl: {body: '#d8b8b0', dark: '#4c3430', light: '#f2dcd6'}, 'giant-salamander': {body: '#6b6b58', dark: '#2b2b20', light: '#9c9a7c'},
  eagle: {body: '#6b4a2e', dark: '#24170e', light: '#cbb68f'}, condor: {body: '#3e3a38', dark: '#161311', light: '#8e7f6f'},
  ostrich: {body: '#5a4a3e', dark: '#241c17', light: '#c9b9a9'}, penguin: {body: '#2c3540', dark: '#141a21', light: '#ece7d8'},
  hummingbird: {body: '#3f7f6a', dark: '#173029', light: '#9ed1bd'},
  bat: {body: '#5a4a42', dark: '#221b17', light: '#9b8474'}, 'vampire-bat': {body: '#6a5448', dark: '#281c15', light: '#a88b76'},
  'fruit-bat': {body: '#7b5d46', dark: '#312217', light: '#bd9a78'},
  shark: {body: '#6f8794', dark: '#26333b', light: '#c7d2d6'}, megalodon: {body: '#6a7c86', dark: '#252f34', light: '#bcc6c9'},
  salmon: {body: '#b86a55', dark: '#40241e', light: '#e7b8a7'}, cod: {body: '#9aa48c', dark: '#343b2f', light: '#d0d5bf'},
  tuna: {body: '#5d7f96', dark: '#22313b', light: '#b2c6cf'}, swordfish: {body: '#7f95a2', dark: '#2b3941', light: '#c4d0d4'},
  coelacanth: {body: '#6f7f86', dark: '#283337', light: '#aeb9bc'}, stingray: {body: '#8b7f6e', dark: '#332c24', light: '#c7bbaa'},
  'green-sea-turtle': {body: '#6f8a6a', dark: '#2a3828', light: '#b6c6a6'}, crocodile: {body: '#5f7048', dark: '#28311d', light: '#98a97a'},
  iguana: {body: '#6f8a4e', dark: '#2a371e', light: '#a9bf7f'}, gecko: {body: '#a89a6a', dark: '#3e3723', light: '#d5c899'},
  chameleon: {body: '#5f9a6a', dark: '#21382a', light: '#a5cf9c'}, 'komodo-dragon': {body: '#6c6750', dark: '#2a271d', light: '#a29a76'},
  'king-cobra': {body: '#7a6a3e', dark: '#2e2817', light: '#b7a56a'}, python: {body: '#8a7a4a', dark: '#332b19', light: '#c4b184'},
  anaconda: {body: '#6f7448', dark: '#2b2d1b', light: '#a7ad76'},
  lobster: {body: '#a34a3a', dark: '#3c1a13', light: '#d98a70'}, octopus: {body: '#a06a6a', dark: '#3d2525', light: '#d19b98'},
  earthworm: {body: '#b06a5a', dark: '#40221c', light: '#d5a092'},
  tyrannosaurus: {body: '#6f7f5f', dark: '#28301f', light: '#a6b08c'}, triceratops: {body: '#8a7a5e', dark: '#352d20', light: '#c0b08c'},
  brachiosaurus: {body: '#7a7f66', dark: '#2e3125', light: '#aeb39a'}, plesiosaur: {body: '#5f7f86', dark: '#25343a', light: '#a4bdc2'},
  pterosaur: {body: '#8d9aa8', dark: '#303a44', light: '#c5ced6'}
};

function palette(id, fallback) {
  if (PALETTES[id]) return PALETTES[id];
  return {body: fallback || '#9bbcd7', dark: '#31373b', light: '#d4d9dc'};
}
function isWinged(id) {
  return ['eagle', 'condor', 'bat', 'vampire-bat', 'fruit-bat', 'pterosaur'].includes(id);
}
function isFish(id) {
  return ['shark', 'megalodon', 'salmon', 'cod', 'tuna', 'swordfish', 'coelacanth', 'stingray'].includes(id);
}
function isWhale(id) {
  return ['blue-whale', 'humpback-whale', 'sperm-whale', 'orca', 'bottlenose-dolphin', 'harbor-seal'].includes(id);
}
function isSnake(id) { return ['king-cobra', 'python', 'anaconda', 'earthworm'].includes(id); }
function isReptile(id) {
  return ['green-sea-turtle', 'crocodile', 'iguana', 'gecko', 'chameleon', 'komodo-dragon'].includes(id);
}
function isAmphibian(id) {
  return ['frog', 'tree-frog', 'common-toad', 'fire-salamander', 'axolotl', 'giant-salamander'].includes(id);
}
function isPrimate(id) { return ['gorilla', 'chimpanzee', 'orangutan', 'rhesus-macaque'].includes(id); }
function isDinosaur(id) { return ['tyrannosaurus', 'triceratops', 'brachiosaurus', 'plesiosaur'].includes(id); }
function isBird(id) { return ['ostrich', 'penguin', 'hummingbird'].includes(id); }

function bodyShell(parent, p, skin) {
  // One tapered, muscle-shaped hull instead of three overlapping ellipsoids.
  // It keeps the chest and haunch, but removes the "balloon" silhouette.
  const geometry = new THREE.SphereGeometry(1, 48, 32);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const base = new THREE.Color(skin.color);
  const top = base.clone().multiplyScalar(.82);
  const belly = base.clone().lerp(new THREE.Color('#f2ddc2'), .18);
  for (let i = 0; i < position.count; i++) {
    const nx = position.getX(i), ny = position.getY(i), nz = position.getZ(i);
    const ends = 1 - .22 * Math.pow(Math.abs(nx), 3);
    const chest = .13 * Math.exp(-Math.pow((nx - .38) / .24, 2));
    const haunch = .1 * Math.exp(-Math.pow((nx + .38) / .28, 2));
    const waist = -.06 * Math.exp(-Math.pow(nx / .28, 2));
    const width = Math.max(.62, ends + chest + haunch + waist);
    const depth = ny < 0 ? .92 : 1.02;
    position.setXYZ(i, nx * p.bl * .5, ny * p.bh * .5 * depth, nz * p.bw * .5 * width);
    const color = belly.clone().lerp(top, (ny + 1) * .5);
    colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const meshMaterial = skin.clone();
  meshMaterial.vertexColors = true;
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  parent.add(mesh);
  return mesh;
}

let furSurfaceCache = null;
function furSurface() {
  if (furSurfaceCache) return furSurfaceCache;
  const size = 128;
  const color = new Uint8Array(size * size * 4);
  const bump = new Uint8Array(size * size * 4);
  const hash = n => {
    let x = n * 374761393 + 668265263;
    x = (x ^ (x >>> 13)) * 1274126177;
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const strand = hash(x * 7 + 11) * .55 + hash(x * 3 + 29) * .25;
    const grain = hash(x * 131 + y * 17 + 7);
    const value = Math.max(0, Math.min(255, Math.round(224 + strand * 18 + grain * 7)));
    const height = Math.max(0, Math.min(255, Math.round(110 + strand * 55 + Math.sin(y / size * TAU * 9 + x * .9) * 7)));
    const i = (y * size + x) * 4;
    color[i] = color[i + 1] = color[i + 2] = value; color[i + 3] = 255;
    bump[i] = bump[i + 1] = bump[i + 2] = height; bump[i + 3] = 255;
  }
  const map = new THREE.DataTexture(color, size, size, THREE.RGBAFormat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(7, 5);
  map.needsUpdate = true;
  const bumpMap = new THREE.DataTexture(bump, size, size, THREE.RGBAFormat);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(7, 5);
  bumpMap.needsUpdate = true;
  furSurfaceCache = {map, bumpMap};
  return furSurfaceCache;
}

function quadruped(ctx, p, id) {
  const {body, skin, dark, light, random} = ctx;
  const torso = bodyShell(body, p, skin);
  const neck0 = V(p.bl * .36, p.bh * .18, 0), neck1 = V(p.bl * .54, p.bh * (p.neck || .58), 0);
  rod(body, neck0, neck1, p.nr, skin, p.nr * 1.3, 16);
  const neckLen = neck0.distanceTo(neck1);
  orb(body, neck0.clone().lerp(neck1, .5), [neckLen * .3, p.nr * 1.25, p.bw * .24], skin, 18);
  const head = V(neck1.x + p.hl * .4, neck1.y + p.hh * .16, 0);
  const skull = orb(body, head, [p.hl, p.hh, p.hw], skin, 32);
  skull.rotation.z = -.05;
  const muzzlePos = head.clone().add(V(p.hl * .82, -p.hh * .3, 0));
  orb(body, muzzlePos, [p.hl * .62, p.hh * .48, p.hw * .58], p.muzzle || skin, 24);
  orb(body, muzzlePos.clone().add(V(p.hl * .46, -p.hh * .06, 0)), [p.hl * .2, p.hh * .17, p.hw * .26], dark, 14);
  const jaw = orb(body, head.clone().add(V(p.hl * .55, -p.hh * .58, 0)), [p.hl * .48, p.hh * .2, p.hw * .46], skin, 20);
  jaw.scale.y *= .86;
  for (const z of [-p.hw * .72, p.hw * .72]) {
    const socket = orb(body, head.clone().add(V(p.hl * .3, p.hh * .22, z)), [p.hl * .17, p.hh * .17, p.hw * .17], light, 14);
    socket.scale.z *= .7;
    const iris = orb(body, head.clone().add(V(p.hl * .37, p.hh * .24, z * 1.02)), [p.hl * .062, p.hh * .065, p.hw * .055], mat('#a8783d'), 10);
    orb(body, head.clone().add(V(p.hl * .39, p.hh * .245, z * 1.03)), [p.hl * .027, p.hh * .03, p.hw * .024], mat('#11100e'), 8);
    orb(body, head.clone().add(V(p.hl * .4, p.hh * .3, z * 1.04)), [p.hl * .015, p.hh * .016, p.hw * .014], mat('#ffffff'), 6);
    const brow = orb(body, head.clone().add(V(p.hl * .32, p.hh * .4, z * .92)), [p.hl * .15, p.hh * .065, p.hw * .15], skin, 10);
    brow.rotation.z = z > 0 ? -.16 : .16;
  }
  // Nose bridge, nose leather and whisker pads make the face readable from
  // the side instead of ending in a smooth muzzle ball.
  const bridge = orb(body, head.clone().add(V(p.hl * .58, p.hh * .02, 0)), [p.hl * .36, p.hh * .11, p.hw * .25], light, 14);
  bridge.rotation.z = -.1;
  orb(body, muzzlePos.clone().add(V(p.hl * .52, p.hh * .02, 0)), [p.hl * .1, p.hh * .065, p.hw * .14], mat('#1c1713'), 10);
  for (const z of [-1, 1]) {
    orb(body, muzzlePos.clone().add(V(p.hl * .24, -p.hh * .08, z * p.hw * .24)), [p.hl * .16, p.hh * .1, p.hw * .18], light, 10);
  }
  const earShape = p.ears || 'round';
  for (const z of [-p.hw * .5, p.hw * .5]) {
    const ear = V(head.x - p.hl * .3, head.y + p.hh * .74, z);
    if (earShape === 'long') {
      const longEar = orb(body, ear.clone().add(V(0, p.hh * .4, z > 0 ? -.02 : .02)), [p.hl * .14, p.hh * .74, p.hw * .11], skin, 16);
      longEar.rotation.z = z > 0 ? -.05 : .05;
      orb(body, longEar.position.clone().add(V(p.hl * .02, 0, 0)), [p.hl * .06, p.hh * .42, p.hw * .05], mat('#d79a91'), 10);
    } else if (earShape === 'point') {
      cone(body, ear, p.hw * .19, p.hh * .7, skin, V(-.12, 0, z > 0 ? -.24 : .24));
      cone(body, ear.clone().add(V(-p.hl * .03, p.hh * .04, z > 0 ? -.03 : .03)), p.hw * .1, p.hh * .36, mat('#8a6253'), V(-.12, 0, z > 0 ? -.24 : .24));
    } else {
      const roundEar = orb(body, ear, [p.hl * .18, p.hh * .22, p.hw * .18], skin, 16);
      roundEar.rotation.z = z > 0 ? -.2 : .2;
      orb(body, ear.clone().add(V(-p.hl * .04, 0, z > 0 ? -.055 : .055)), [p.hl * .1, p.hh * .12, p.hw * .09], mat('#8d6658'), 10);
    }
  }
  const legL = p.legL || .54;
  for (const x of [p.bl * .3, -p.bl * .32]) for (const z of [-p.bw * .34, p.bw * .34]) {
    const hip = V(x, -p.bh * .26, z);
    const knee = V(x + Math.sign(x) * p.knee, -p.bh * .5, z);
    const ankle = V(x + Math.sign(x) * p.knee * .9, -p.bh * .5 - legL * .48, z);
    const foot = V(x + Math.sign(x) * p.knee * .55, -p.bh * .5 - legL, z);
    orb(body, hip, [p.legR * 1.05, p.legR * 1.0, p.legR * 1.0], skin, 14);
    rod(body, hip, knee, p.legR * 1.2, skin, p.legR * .85, 14);
    orb(body, knee, [p.legR * .6, p.legR * .6, p.legR * .56], skin, 12);
    rod(body, knee, ankle, p.legR * .86, skin, p.legR * .6, 12);
    orb(body, ankle, [p.legR * .5, p.legR * .5, p.legR * .46], skin, 10);
    rod(body, ankle, foot, p.legR * .58, skin, p.legR * .44, 8);
    if (p.hoof) {
      const hoof = orb(body, foot, [p.legR * 1.6, p.legR * 1.0, p.legR * 1.35], dark, 14);
      hoof.scale.z *= .9;
    } else {
      const paw = orb(body, foot, [p.legR * 1.75, p.legR * .7, p.legR * 1.28], dark, 14);
      paw.scale.z *= .92;
      for (let i = -1; i <= 1; i++) orb(body, foot.clone().add(V(p.legR * 1.16, -.018, i * p.legR * .52)), [p.legR * .32, p.legR * .18, p.legR * .21], dark, 8);
    }
  }
  if (!p.noTail) {
  const tailBase = V(-p.bl * .48, p.bh * .22, 0);
  const tailMid = V(-p.bl * .48, p.bh * .05 + (p.tailLift || 0) * .2, 0);
  const tailTip = V(-p.bl * .5 - (p.tail || .35), p.bh * .18 + (p.tailLift || 0), 0);
  tube(body, [tailBase, tailMid, tailTip], p.tailR || .055, skin, 32, 8);
  if (p.tailTuft) orb(body, tailTip, [p.tailTuft, p.tailTuft * .8, p.tailTuft * .8], p.tailColor || dark, 14);
  }
  return {torso, head, neck0, neck1, muzzlePos};
}

function decorateMammal(ctx, p, id, parts) {
  const {body, skin, dark, light} = ctx;
  const random = Math.random;
  const head = parts.head;
  if (["lion", "saber-toothed-cat"].includes(id)) {
    const mane = mat(id === 'lion' ? '#714c2c' : '#5f422b', {roughness: .92});
    const maneLight = mat(id === 'lion' ? '#8d6239' : '#76543a', {roughness: .95});
    // A ruff built around the neck rather than a disc in front of the face.
    orb(body, head.clone().add(V(-p.hl * .7, -p.hh * .05, 0)), [p.hl * .5, p.hh * 1.35, p.hw * 1.05], mane, 30);
    for (const z of [-1, 1]) {
      const ruff = orb(body, head.clone().add(V(-p.hl * .52, -p.hh * .18, z * p.hw * .8)), [p.hl * .36, p.hh * .72, p.hw * .3], maneLight, 20);
      ruff.rotation.z = z * .18;
      for (let i = 0; i < 5; i++) {
        const t = (i - 2) / 4;
        const clump = orb(body, head.clone().add(V(-p.hl * .5 + t * p.hl * .22, -p.hh * .55 + Math.abs(t) * p.hh * .35, z * p.hw * (1.15 + Math.abs(t) * .2))), [p.hl * .13, p.hh * .2, p.hw * .15], i % 2 ? mane : maneLight, 10);
        clump.rotation.z = z * .3;
      }
    }
    orb(body, head.clone().add(V(-p.hl * .55, p.hh * .78, 0)), [p.hl * .36, p.hh * .28, p.hw * .5], mane, 18);
    orb(body, head.clone().add(V(-p.hl * .05, -p.hh * .92, 0)), [p.hl * .42, p.hh * .28, p.hw * .5], maneLight, 18);
    // A thick collar behind the jaw reads as a mane from the side view.
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const clump = orb(body, head.clone().add(V(-p.hl * .48, Math.sin(a) * p.hh * .62 - p.hh * .06, Math.cos(a) * p.hw * .92)), [p.hl * .18, p.hh * .26, p.hw * .18], i % 2 ? mane : maneLight, 10);
      clump.rotation.z = Math.sin(a) * .25;
    }
  }
  if (id === 'lion') {
    const root = V(-p.bl * .5, p.bh * .08, 0);
    tube(body, [root, root.clone().add(V(-.04, -.2, 0)), root.clone().add(V(0, -.52, 0))], .025, skin, 24, 7);
    orb(body, root.clone().add(V(0, -.55, 0)), [.07, .1, .07], mat('#714c2c', {roughness: .92}), 12);
  }
  if (id === 'horse') {
    const maneMat = mat('#3b2a1e', {roughness: .92});
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const base = parts.neck0.clone().lerp(parts.neck1, t).add(V(0, p.nr * 1.0, 0));
      const tuft = orb(body, base, [p.nr * .52, p.nr * 1.05, p.nr * .24], maneMat, 10);
      tuft.rotation.z = .25;
    }
    orb(body, parts.head.clone().add(V(-p.hl * .22, p.hh * .75, 0)), [p.hl * .18, p.hh * .42, p.hw * .32], maneMat, 12);
    const tailRoot = V(-p.bl * .66, p.bh * .1, 0);
    for (let i = 0; i < 6; i++) {
      const z = (i - 2.5) * .05, drop = .5 + (i % 3) * .05;
      tube(body, [tailRoot, tailRoot.clone().add(V(-.03, -.12, z * .5)), tailRoot.clone().add(V(-.06 - Math.abs(z) * .2, -drop, z))], .028, maneMat, 22, 6);
    }
  }
  if (id === 'beaver') {
    const flatTail = orb(body, V(-p.bl * .86, -.02, 0), [.34, .055, .26], mat('#5a4030'), 24);
    flatTail.rotation.z = .08;
    for (const z of [-.055, .055]) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(.07, .12, .045), mat('#efe7d0'));
      tooth.position.copy(parts.muzzlePos).add(V(p.hl * .92, -p.hh * .34, z)); body.add(tooth);
    }
  }
  if (id === 'saber-toothed-cat') {
    for (const z of [-.05, .05]) cone(body, head.clone().add(V(p.hl * .95, -p.hh * .65, z)), .035, .28, mat('#e8dcc0'), V(Math.PI, 0, 0));
  }
  if (['tiger', 'leopard', 'cheetah'].includes(id)) {
    if (id === 'tiger') {
      for (let i = 0; i < 6; i++) {
        const x = -p.bl * .3 + i * p.bl * .105;
        for (const side of [-1, 1]) {
          const stripe = orb(body, V(x, p.bh * .04, side * p.bw * .42), [p.bl * .018, p.bh * .2, p.bw * .075], dark, 10);
          stripe.rotation.z = .28;
        }
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const x = -p.bl * .3 + (i % 3) * p.bl * .16, y = p.bh * (-.12 + Math.floor(i / 3) * .13);
        for (const side of [-1, 1]) {
          const spot = orb(body, V(x, y, side * p.bw * .38), [p.bl * .03, p.bh * .035, p.bw * .05], dark, 8);
          spot.rotation.z = .2;
        }
      }
    }
  }
  if (['red-fox', 'gray-wolf', 'coyote', 'dog'].includes(id)) {
    const tip = id === 'red-fox' ? '#f1e7d6' : light;
    const root = V(-p.bl * .46, p.bh * .18, 0), end = V(-p.bl * .5 - (p.tail || .35), p.bh * .18, 0);
    for (let i = 1; i <= 4; i++) {
      const point = root.clone().lerp(end, i / 5);
      const clump = orb(body, point, [p.bh * .07, p.bh * .1, p.bw * .09], i === 4 ? mat(tip) : skin, 12);
      clump.rotation.z = -.25;
    }
  }
  if (id === 'rabbit') orb(body, V(-p.bl * .48, p.bh * .06, 0), [p.bh * .2, p.bh * .18, p.bw * .18], light, 12);
  if (id === 'giraffe') {
    const spotMat = mat('#8d6238', {roughness: .9});
    for (let i = 0; i < 14; i++) {
      const x = -p.bl * .34 + (i % 7) * p.bl * .1, y = p.bh * (-.08 + Math.floor(i / 7) * .18);
      for (const side of [-1, 1]) {
        const spot = orb(body, V(x, y, side * p.bw * .41), [p.bh * .055, p.bh * .08, p.bw * .035], spotMat, 8);
        spot.rotation.z = .2;
      }
    }
  }
  if (id === 'gray-squirrel') {
    for (let i = 0; i < 5; i++) orb(body, V(-p.bl * .5 - i * .07, p.bh * .1 + i * .06, 0), [.14 - i * .012, .16, .12], skin, 14);
  }
  if (id === 'rabbit' || id === 'domestic-goat') {
    // long ears already handled by earShape, nothing else
  }
  if (['giraffe'].includes(id)) {
    for (const z of [-.05, .05]) rod(body, head.clone().add(V(-.02, p.hh * .8, z)), head.clone().add(V(-.02, p.hh * 1.15, z)), .035, dark);
  }
  if (['moose', 'white-tailed-deer'].includes(id)) {
    for (const z of [-.08, .08]) {
      const base = head.clone().add(V(-.02, p.hh * .8, z));
      rod(body, base, base.clone().add(V(-.12, .38, z * 2)), .022, mat('#b9a789'));
      for (const s of [-1, 1]) rod(body, base.clone().add(V(-.04, .18, z)), base.clone().add(V(-.04 + s * .18, .32, z + s * .08)), .015, mat('#b9a789'));
    }
  }
  if (['cattle', 'bison', 'domestic-goat', 'sheep'].includes(id)) {
    for (const z of [-.1, .1]) {
      const base = head.clone().add(V(p.hl * .1, p.hh * .55, z));
      const hornMat = mat('#d8ceb8');
      if (id === 'sheep') {
        tube(body, [base, base.clone().add(V(-.05, .15, z * 1.8)), base.clone().add(V(-.22, .12, z * 2.5))], .026, hornMat, 20, 8);
      } else {
        cone(body, base.clone().add(V(-.02, .12, z * 1.5)), .045, .26, hornMat, V(-.35, 0, z > 0 ? -.6 : .6));
      }
    }
  }
  if (id === 'domestic-pig') {
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(.11, .12, .1, 18), mat('#c98b86'));
    snout.position.copy(parts.muzzlePos).add(V(p.hl * .55, 0, 0)); snout.rotation.z = Math.PI / 2; body.add(snout);
  }
  if (id === 'elephant' || id === 'woolly-mammoth') {
    const trunkMat = mat(id === 'elephant' ? '#8f8d89' : '#7a5e45');
    tube(body, [parts.muzzlePos.clone().add(V(p.hl * .45, 0, 0)), parts.muzzlePos.clone().add(V(p.hl * .85, -.22, 0)), parts.muzzlePos.clone().add(V(p.hl * .9, -.52, 0))], .075, trunkMat, 30, 10);
    for (const z of [-.08, .08]) cone(body, parts.muzzlePos.clone().add(V(p.hl * .55, -.18, z)), .035, .28, mat('#e6ddc8'), V(0, 0, z > 0 ? -.2 : .2));
    for (const z of [-p.hw * 1.2, p.hw * 1.2]) {
      const ear = orb(body, parts.head.clone().add(V(-.05, .02, z)), [p.hl * .38, p.hh * .62, p.hw * .18], skin, 24);
      ear.rotation.x = z > 0 ? -.3 : .3;
    }
  }
  if (id === 'rhinoceros') {
    cone(body, parts.muzzlePos.clone().add(V(p.hl * .55, .08, 0)), .06, .26, mat('#d8ceb8'), V(0, 0, -.18));
    cone(body, parts.muzzlePos.clone().add(V(p.hl * .2, .22, 0)), .045, .16, mat('#d8ceb8'), V(0, 0, -.18));
  }
  if (['dromedary-camel', 'bison'].includes(id)) {
    orb(body, V(-.05, p.bh * .54, 0), [p.bh * .3, p.bh * .34, p.bw * .5], skin, 28);
  }
  if (id === 'bison') orb(body, V(p.bl * .2, p.bh * .58, 0), [p.bh * .4, p.bh * .42, p.bw * .55], skin, 30);
  if (id === 'sheep' || id === 'woolly-mammoth') {
    const wool = id === 'sheep' ? light : skin;
    orb(body, V(0, p.bh * .16, 0), [p.bl * .48, p.bh * .58, p.bw * .62], wool, 26);
    for (let i = 0; i < 10; i++) {
      const x = (i / 9 - .5) * p.bl * .78, y = p.bh * (.2 + (i % 3) * .22), z = (i % 2 ? 1 : -1) * p.bw * .42;
      orb(body, V(x, y, z), [p.bh * .2, p.bh * .2, p.bh * .2], wool, 12);
    }
  }
  if (id === 'hippopotamus') {
    orb(body, V(0, -p.bh * .08, 0), [p.bl * .55, p.bh * .62, p.bw * .65], skin, 40);
  }
}

function quadrupedSpecies(ctx, id, overrides = {}) {
  const defaults = {bl: 1.35, bh: .46, bw: .36, hl: .24, hh: .23, hw: .22, nr: .1, neck: .58, legL: .5, legR: .07, knee: .04, tail: .35, tailR: .05};
  const p = {...defaults, ...overrides};
  const parts = quadruped(ctx, p, id);
  decorateMammal(ctx, p, id, parts);
}

function buildPterosaur(ctx) {
  const {body, skin, dark, light} = ctx;
  const hide = mat('#8a7761', {roughness: .9});
  const membraneMat = mat('#9b8873', {side: THREE.DoubleSide, roughness: .94});
  const membraneEdge = mat('#6d5a48', {side: THREE.DoubleSide, roughness: .96});
  const torso = orb(body, V(0, 0, -.02), [.15, .17, .44], hide, 30);
  torso.rotation.x = .08;
  const neck = tube(body, [V(0, .12, .25), V(0, .2, .4), V(0, .3, .52)], .07, hide, 24, 8);
  const head = orb(body, V(0, .34, .56), [.13, .1, .15], hide, 24);
  // Long toothless beak and a backward crest.
  cone(body, V(0, .33, .72), .055, .34, mat('#b79562'), V(Math.PI / 2, 0, 0));
  const crest = cone(body, V(0, .44, .48), .07, .28, membraneEdge, V(-.7, 0, 0));
  for (const x of [-.07, .07]) {
    orb(body, V(x, .38, .63), [.025, .026, .022], dark, 10);
    orb(body, V(x * 1.04, .388, .637), [.008, .009, .007], mat('#ffffff'), 6);
  }
  // Membranous wings stretched between shoulder, elbow, wingtip and body.
  for (const s of [-1, 1]) {
    const pts = [
      V(0, .14, .06), V(s * .55, .2, .02), V(s * 1.2, .1, -.06),
      V(s * .72, -.16, -.3), V(s * .2, -.14, -.28), V(0, -.04, -.2)
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(p => [p.x, p.y, p.z]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
    geo.computeVertexNormals();
    body.add(new THREE.Mesh(geo, membraneMat));
    // Leading-edge bones and finger struts give the membrane structure.
    tube(body, [pts[0], pts[1], pts[2]], .018, hide, 24, 6);
    tube(body, [pts[1], V(s * .95, .04, -.1), pts[3]], .012, hide, 18, 5);
    rod(body, pts[0], pts[3], .009, membraneEdge, .006, 5);
    for (let i = 0; i < 3; i++) {
      const t = .25 + i * .22;
      rod(body, V(s * .55 * t, .18 - i * .01, .02), V(s * .72 * t, -.1, -.28), .005, membraneEdge, .003, 4);
    }
  }
  for (const x of [-.1, .1]) {
    rod(body, V(x, -.12, -.15), V(x, -.38, -.22), .022, hide, .015, 8);
    orb(body, V(x, -.4, -.25), [.045, .018, .06], hide, 10);
  }
  tube(body, [V(0, -.02, -.45), V(0, -.05, -.65), V(0, -.03, -.8)], .025, hide, 18, 6);
}

function buildWinged(ctx, id) {
  if (id === 'pterosaur') { buildPterosaur(ctx); return; }
  const {body, skin, dark, light} = ctx;
  const bat = id.includes('bat');
  const pter = id === 'pterosaur';
  const span = pter ? 1.3 : bat ? .95 : 1.08;
  const bodyMat = pter ? mat('#8d9aa8') : skin;
  const featherMat = mat(bat ? '#5b4a40' : pter ? '#93a0ac' : '#5a3d26', {side: THREE.DoubleSide, roughness: .86});
  const paleMat = mat(bat ? '#6b574b' : pter ? '#aab6c0' : '#cbb68f', {side: THREE.DoubleSide, roughness: .84});
  const bodyGroup = new THREE.Group(); body.add(bodyGroup);
  const torso = orb(bodyGroup, V(0, 0, 0), [bat ? .16 : .14, bat ? .18 : .17, bat ? .32 : .28], bodyMat, 30);
  torso.rotation.x = -.14;
  const head = V(0, bat ? .16 : .19, bat ? .28 : .3);
  orb(bodyGroup, head, [bat ? .115 : .105, bat ? .105 : .115, .11], bat ? bodyMat : light, 24);
  if (!bat) {
    const beak = cone(bodyGroup, head.clone().add(V(0, -.03, .12)), pter ? .075 : .05, pter ? .35 : .16, mat('#d5a24a'), V(Math.PI / 2, 0, 0));
    cone(bodyGroup, head.clone().add(V(0, -.13, .1)), .022, .08, mat('#b57c2f'), V(Math.PI / 2.3, 0, 0));
  }
  for (const z of [-.07, .07]) {
    orb(bodyGroup, head.clone().add(V(z * 1.35, .028, .07)), [.03, .034, .028], dark, 12);
    orb(bodyGroup, head.clone().add(V(z * 1.4, .042, .086)), [.008, .009, .007], mat('#ffffff'), 6);
  }
  if (bat) {
    for (const z of [-.06, .06]) cone(bodyGroup, head.clone().add(V(z * 1.5, .11, -.01)), .027, .15, skin, V(-.25, 0, z > 0 ? -.4 : .4));
    for (const z of [-.035, .035]) cone(bodyGroup, head.clone().add(V(z, -.04, .12)), .011, .05, mat('#efe7d8'), V(Math.PI, 0, 0));
  } else if (pter) {
    const crest = new THREE.Mesh(new THREE.ConeGeometry(.05, .28, 4), mat('#7f8b98'));
    crest.position.copy(head).add(V(-.02, .13, -.03)); crest.rotation.z = -.5; bodyGroup.add(crest);
  }
  for (const s of [-1, 1]) {
    for (let row = 0; row < 5; row++) {
      const y = .07 - row * .048;
      for (let seg = 0; seg < 3; seg++) {
        const inner = .1 + seg * .25, outer = inner + .34;
        const center = V(s * (inner + outer) / 2, y - seg * .012, -.01 - row * .006);
        const feather = orb(bodyGroup, center, [(outer - inner) / 2, .016, .028], (row + seg) % 3 === 0 ? paleMat : featherMat, 10);
        feather.rotation.z = s * (-.09 + row * .028);
        feather.rotation.y = s * .05;
      }
    }
    const arm = tube(bodyGroup, [V(0, .1, .02), V(s * .35, .08, .01), V(s * .72, .035, .0), V(s * span, .02, -.01)], pter ? .022 : .028, featherMat, 30);
    for (let i = 0; i < 4; i++) {
      const x = s * span * (.22 + i * .2);
      rod(bodyGroup, V(0, .08, .02), V(x, .03 - i * .01, .0), .012, dark, .005, 6);
    }
  }
  const tail = new THREE.Shape();
  tail.moveTo(-.13, 0); tail.lineTo(.13, 0); tail.lineTo(.2, -.3); tail.lineTo(0, -.4); tail.lineTo(-.2, -.3); tail.closePath();
  const tailMesh = new THREE.Mesh(new THREE.ShapeGeometry(tail), mat(bat ? '#4a3a32' : '#5a3d26', {side: THREE.DoubleSide}));
  tailMesh.position.set(0, -.12, -.22); tailMesh.rotation.x = -.2; bodyGroup.add(tailMesh);
  if (!bat) {
    for (const z of [-.055, .055]) {
      rod(bodyGroup, V(0, -.16, .05), V(.02, -.36, .04), .018, mat('#9b7a4f'), 8, 6);
      for (let i = -1; i <= 1; i++) rod(bodyGroup, V(.02, -.36, .04), V(.02 + i * .04, -.4, .04 + i * .02), .005, mat('#c9a25a'), 6, 4);
    }
  }
}

function buildStingray(ctx) {
  const {body, dark} = ctx;
  const pose = new THREE.Group(); pose.position.y = .05; pose.rotation.x = .1; body.add(pose);
  const skin = mat('#625648', {roughness: .76, metalness: 0});
  const underside = mat('#b9aea1', {roughness: .86, side: THREE.DoubleSide});
  // A true diamond-shaped disc: the wingtips are nearly twice as far apart as
  // the nose-to-tail length, with swept leading and trailing edges.
  const wing = new THREE.Shape();
  wing.moveTo(0, .72);
  wing.quadraticCurveTo(.48, .56, 1.02, .04);
  wing.quadraticCurveTo(.62, -.3, .2, -.56);
  wing.lineTo(-.2, -.56);
  wing.quadraticCurveTo(-.62, -.3, -1.02, .04);
  wing.quadraticCurveTo(-.48, .56, 0, .72);
  const disc = new THREE.Mesh(new THREE.ExtrudeGeometry(wing, {depth: .038, bevelEnabled: true, bevelSize: .018, bevelThickness: .016, bevelSegments: 2, curveSegments: 18}), skin);
  disc.rotation.x = Math.PI / 2; disc.position.y = .02; pose.add(disc);
  // Pale underside follows the same outline.
  const belly = new THREE.Mesh(new THREE.ShapeGeometry(wing), underside);
  belly.rotation.x = Math.PI / 2; belly.position.y = -.018; belly.scale.set(.96, .96, 1); pose.add(belly);
  // A low central body rather than a dome.
  orb(pose, V(0, .045, .04), [.2, .055, .27], skin, 32);
  const head = orb(pose, V(0, .05, .56), [.13, .05, .14], skin, 24);
  for (const x of [-.085, .085]) {
    orb(pose, V(x, .093, .63), [.024, .024, .02], mat('#d7b464'), 12);
    orb(pose, V(x, .098, .638), [.012, .012, .01], dark, 8);
    orb(pose, V(x, .101, .642), [.004, .0045, .0035], mat('#ffffff'), 5);
  }
  // Cephalic fins project from the snout like small horns.
  for (const x of [-.1, .1]) {
    const lobe = orb(pose, V(x, .055, .7), [.05, .016, .055], skin, 14);
    lobe.rotation.x = x > 0 ? -.38 : .38;
  }
  tube(pose, [V(-.075, .052, .72), V(0, .048, .74), V(.075, .052, .72)], .007, dark, 20, 4);
  // Gill slits under the disc.
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    rod(pose, V(s * (.12 + i * .016), .015, .3 - i * .045), V(s * (.17 + i * .016), -.02, .3 - i * .045), .004, dark, .003, 5);
  }
  // Long whip tail, barb and a small dorsal fin.
  const tail = [V(0, .025, -.55), V(.02, .02, -.78), V(.08, .03, -1.02), V(.18, .04, -1.28), V(.3, .03, -1.55)];
  for (let i = 0; i < tail.length - 1; i++) {
    const r = .028 - i * .004;
    tube(pose, [tail[i], tail[i + 1]], Math.max(.007, r), skin, 18, 7);
    if (i > 0) orb(pose, tail[i], [r * 1.1, r, r * 1.1], skin, 8);
  }
  cone(pose, V(.18, .09, -.8), .024, .13, mat('#d8d0c2'), V(0, 0, .9));
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(.06, .13, 5), skin);
  dorsal.position.set(0, .105, -.42); dorsal.rotation.x = .35; pose.add(dorsal);
  // Sparse mottling inside the diamond, kept off the thin edges.
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4, r = .12 + (i % 6) * .09;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 1.08;
    if (Math.abs(x) > .82 || z > .5 || z < -.5) continue;
    const spot = orb(pose, V(x, .066, z), [.018 + (i % 3) * .006, .004, .014], mat('#463d33'), 8);
    spot.rotation.y = a * .7;
  }
}


function buildSalmon(ctx) {
  const {body, dark} = ctx;
  const back = mat('#536c78', {roughness: .58, metalness: .05});
  const flank = mat('#b9c0bd', {roughness: .52, metalness: .08});
  const pink = mat('#c77f78', {roughness: .6});
  const finMat = mat('#8e6f64', {roughness: .7});
  // Fusiform body with a distinct head and tail stock.
  const profile = [[.02, -.9], [.08, -.75], [.15, -.55], [.23, -.25], [.26, 0], [.25, .25], [.2, .48], [.12, .62]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const hull = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), back);
  hull.rotation.z = -Math.PI / 2; hull.scale.set(1, 1, .72); body.add(hull);
  orb(body, V(.15, -.14, 0), [.55, .095, .14], flank, 24);
  // Pink lateral stripe.
  for (const z of [-.17, .17]) {
    const stripe = orb(body, V(.12, .015, z), [.52, .024, .007], pink, 22);
    stripe.rotation.x = z > 0 ? -.08 : .08;
  }
  const head = V(.82, .02, 0);
  orb(body, head, [.24, .205, .16], back, 24);
  orb(body, V(1.0, -.02, 0), [.15, .1, .1], flank, 18);
  tube(body, [V(1.1, -.04, -.06), V(1.14, -.04, 0), V(1.1, -.04, .06)], .006, dark, 16, 4);
  for (const z of [-.12, .12]) {
    orb(body, V(.93, .09, z), [.031, .033, .027], mat('#d6d4c6'), 10);
    orb(body, V(.936, .098, z * 1.02), [.017, .018, .014], dark, 8);
    orb(body, V(.942, .102, z * 1.03), [.006, .007, .005], mat('#ffffff'), 5);
    orb(body, V(.86, .02, z * 1.15), [.04, .06, .008], mat('#8fa6aa'), 8);
  }
  // Gill cover line.
  tube(body, [V(1.0, .13, -.12), V(1.0, .18, 0), V(1.0, .13, .12)], .007, dark, 18, 4);
  // Dorsal, adipose, pectoral, pelvic and anal fins.
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.quadraticCurveTo(.03, .12, .1, .2);
  finShape.quadraticCurveTo(.16, .1, .21, 0);
  finShape.closePath();
  const dorsal = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, {depth: .022, bevelEnabled: false}), finMat);
  dorsal.position.set(.12, .22, -.011); body.add(dorsal);
  const adipose = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, {depth: .018, bevelEnabled: false}), finMat);
  adipose.position.set(-.45, .13, -.009); adipose.scale.set(.45, .45, 1); body.add(adipose);
  for (const z of [-.2, .2]) {
    const pectoral = orb(body, V(.46, -.1, z), [.17, .02, .06], finMat, 14); pectoral.rotation.y = z > 0 ? .4 : -.4; pectoral.rotation.z = .25;
    const pelvic = orb(body, V(.1, -.18, z * .7), [.1, .018, .04], finMat, 12); pelvic.rotation.y = z > 0 ? .25 : -.25;
  }
  const anal = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, {depth: .02, bevelEnabled: false}), finMat);
  anal.position.set(-.24, -.18, -.01); anal.scale.set(.7, -.7, 1); body.add(anal);
  // Forked tail.
  const tail = new THREE.Shape();
  tail.moveTo(0, 0); tail.lineTo(-.3, .34); tail.lineTo(-.46, .22); tail.lineTo(-.18, 0); tail.lineTo(-.46, -.22); tail.lineTo(-.3, -.34); tail.closePath();
  const tailMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tail, {depth: .025, bevelEnabled: false}), finMat);
  tailMesh.position.set(-.8, 0, -.012); tailMesh.scale.set(.8, .8, 1); body.add(tailMesh);
  tube(body, [V(-.68, 0, 0), V(-.8, 0, 0)], .07, back, 14, 6);
  // Dark spots on the upper body.
  for (let i = 0; i < 18; i++) {
    const x = -.35 + (i % 9) * .16, z = (i % 2 ? .06 : -.06);
    orb(body, V(x, .2 + Math.sin(i) * .03, z), [.018, .006, .014], mat('#3e4d55'), 7);
  }
}

function buildCod(ctx) {
  const {body, dark} = ctx;
  const skin = mat('#8d8f72', {roughness: .68, metalness: 0});
  const belly = mat('#d0cbb0', {roughness: .72});
  const finMat = mat('#77785f', {roughness: .74});
  // Heavy head, tapering body and round tail.
  orb(body, V(-.05, .01, 0), [.64, .24, .21], skin, 36);
  orb(body, V(-.5, .01, 0), [.3, .18, .13], skin, 24);
  orb(body, V(.2, -.15, 0), [.5, .08, .14], belly, 24);
  const head = V(.82, .04, 0);
  orb(body, head, [.36, .28, .23], skin, 28);
  orb(body, V(1.04, -.01, 0), [.2, .14, .14], belly, 18);
  tube(body, [V(1.16, -.08, -.06), V(1.21, -.09, 0), V(1.16, -.08, .06)], .009, dark, 16, 4);
  for (const z of [-.155, .155]) {
    orb(body, V(.9, .1, z), [.036, .038, .03], mat('#d8d4b8'), 10);
    orb(body, V(.906, .108, z * 1.02), [.02, .021, .016], dark, 8);
    orb(body, V(.912, .112, z * 1.03), [.007, .008, .006], mat('#ffffff'), 5);
  }
  // Barbel under the chin.
  tube(body, [V(1.02, -.14, 0), V(1.03, -.25, .02), V(.99, -.34, .05)], .009, mat('#b6b096'), 16, 5);
  tube(body, [V(1.0, .14, -.15), V(1.0, .2, 0), V(1.0, .14, .15)], .007, dark, 18, 4);
  // Three rounded dorsal fins and two anal fins.
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.quadraticCurveTo(.02, .1, .08, .19);
  finShape.quadraticCurveTo(.16, .11, .2, 0);
  finShape.closePath();
  for (const [x, h] of [[.34, 1], [.04, .9], [-.28, .75]]) {
    const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, {depth: .022, bevelEnabled: false}), finMat);
    fin.position.set(x, .19, -.011); fin.scale.set(1, h, 1); body.add(fin);
  }
  for (const x of [-.02, -.32]) {
    const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, {depth: .022, bevelEnabled: false}), finMat);
    fin.position.set(x, -.18, -.011); fin.scale.set(.8, -.75, 1); body.add(fin);
  }
  for (const z of [-.22, .22]) {
    const pectoral = orb(body, V(.55, -.12, z), [.2, .022, .07], finMat, 14); pectoral.rotation.y = z > 0 ? .4 : -.4; pectoral.rotation.z = .22;
  }
  // Rounded fan tail.
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0); tailShape.lineTo(-.24, .22); tailShape.lineTo(-.36, .16); tailShape.lineTo(-.24, 0); tailShape.lineTo(-.36, -.16); tailShape.lineTo(-.24, -.22); tailShape.closePath();
  const tail = new THREE.Mesh(new THREE.ExtrudeGeometry(tailShape, {depth: .028, bevelEnabled: false}), finMat);
  tail.position.set(-.76, .01, -.014); body.add(tail);
  tube(body, [V(-.68, 0, 0), V(-.8, 0, 0)], .06, skin, 14, 6);
  // Mottled marbling.
  for (let i = 0; i < 24; i++) {
    const x = -.45 + (i % 8) * .16, z = Math.sin(i * 1.8) * .12;
    const patch = orb(body, V(x, .2, z), [.045 + (i % 3) * .015, .006, .03], i % 2 ? mat('#6e7058') : mat('#a09e7e'), 8);
    patch.rotation.y = i * .7;
  }
}

function buildFish(ctx, id) {
  const {body, skin, dark, light} = ctx;
  if (id === 'stingray') { buildStingray(ctx); return; }
  if (id === 'salmon') { buildSalmon(ctx); return; }
  if (id === 'cod') { buildCod(ctx); return; }

  const shark = id === 'shark' || id === 'megalodon';
  const sword = id === 'swordfish';
  const torpedo = shark ? .88 : .72;
  orb(body, V(-.1, 0, 0), [torpedo, shark ? .21 : .24, shark ? .18 : .2], skin, 40);
  orb(body, V(.52, -.01, 0), [.34, shark ? .16 : .18, shark ? .14 : .16], skin, 28);
  orb(body, V(shark ? .92 : .84, -.03, 0), [shark ? .2 : .17, .09, .08], skin, 20);
  if (sword) cone(body, V(1.1, 0, 0), .035, .58, skin, V(0, 0, -Math.PI / 2));
  const eyeX = shark ? .7 : .62, eyeY = shark ? .06 : .08;
  for (const z of [-(shark ? .12 : .13), shark ? .12 : .13]) {
    orb(body, V(eyeX, eyeY, z), [.027, .029, .024], dark, 10);
    orb(body, V(eyeX + .005, eyeY + .008, z * 1.04), [.007, .008, .006], mat('#ffffff'), 5);
  }
  if (shark) {
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(.13, .012, 6, 24, Math.PI), mat('#492c2c'));
    mouth.position.set(.88, -.13, 0); mouth.rotation.set(0, Math.PI / 2, Math.PI * 1.08); body.add(mouth);
    for (let i = 0; i < 5; i++) rod(body, V(.56, .06, -.15 + i * .075), V(.56, -.05, -.15 + i * .075), .0045, dark, .004, 4);
  } else {
    tube(body, [V(.74, -.02, .12), V(.8, -.05, 0), V(.74, -.02, -.12)], .006, dark, 16, 4);
    for (let i = 0; i < 4; i++) rod(body, V(.48, .04, -.1 + i * .065), V(.48, -.04, -.1 + i * .065), .004, dark, .003, 4);
  }
  const pectoral = new THREE.Shape();
  pectoral.moveTo(0, .02); pectoral.lineTo(.34, -.22); pectoral.lineTo(.1, -.1); pectoral.closePath();
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ShapeGeometry(pectoral), mat(ctx.palette.body, {side: THREE.DoubleSide}));
    fin.rotation.y = s * .2; fin.rotation.z = s * .15;
    fin.position.set(.22, -.03, s * .15); body.add(fin);
  }
  const dorsal = new THREE.Shape();
  dorsal.moveTo(-.16, 0); dorsal.lineTo(.02, shark ? .4 : .26); dorsal.lineTo(.14, 0); dorsal.closePath();
  const dorsalMesh = new THREE.Mesh(new THREE.ShapeGeometry(dorsal), mat(ctx.palette.body, {side: THREE.DoubleSide}));
  dorsalMesh.position.set(-.22, .18, 0); body.add(dorsalMesh);
  if (shark) {
    const tail = new THREE.Shape();
    tail.moveTo(0, .02); tail.lineTo(-.34, .42); tail.lineTo(-.22, .06); tail.lineTo(-.25, -.26); tail.lineTo(-.05, -.04); tail.closePath();
    const tailMesh = new THREE.Mesh(new THREE.ShapeGeometry(tail), mat(ctx.palette.body, {side: THREE.DoubleSide}));
    tailMesh.position.set(-.94, 0, 0); body.add(tailMesh);
  } else {
    const tail = new THREE.Shape();
    tail.moveTo(0, 0); tail.lineTo(-.3, .24); tail.lineTo(-.2, 0); tail.lineTo(-.3, -.24); tail.closePath();
    const tailMesh = new THREE.Mesh(new THREE.ShapeGeometry(tail), mat(ctx.palette.body, {side: THREE.DoubleSide}));
    tailMesh.position.set(-.78, 0, 0); body.add(tailMesh);
  }
}

function buildElephant(ctx, id) {
  const {body, skin, dark, light} = ctx;
  const mammoth = id === 'woolly-mammoth';
  const hide = mammoth ? mat('#7b6046', {roughness: .96}) : skin;
  const torso = orb(body, V(-.08, .16, 0), [.74, .4, .43], hide, 44);
  orb(body, V(.42, .2, 0), [.42, .4, .42], hide, 34);
  orb(body, V(-.62, .08, 0), [.34, .36, .38], hide, 30);
  const head = orb(body, V(.9, .44, 0), [.3, .28, .28], hide, 34);
  head.rotation.z = -.12;
  const muzzle = orb(body, V(1.16, .32, 0), [.2, .16, .18], hide, 26);
  for (const z of [-.15, .15]) {
    const eye = orb(body, V(1.0, .46, z), [.035, .032, .032], dark, 12);
    orb(body, V(1.01, .475, z * 1.04), [.01, .011, .01], mat('#f3efe2'), 6);
    const ear = orb(body, V(.76, .44, z * 1.75), [.28, .4, .045], hide, 26);
    ear.rotation.y = z > 0 ? -.3 : .3; ear.rotation.x = z > 0 ? .12 : -.12;
    orb(body, V(.77, .44, z * 1.8), [.18, .27, .018], mammoth ? mat('#6d523b') : mat('#a49c93'), 18);
  }
  // Segmented trunk with a taper and a slight S-curve.
  const trunk = [V(1.24, .22, 0), V(1.4, .1, 0), V(1.5, -.04, 0), V(1.53, -.2, 0), V(1.48, -.38, 0), V(1.38, -.52, 0), V(1.3, -.6, 0)];
  for (let i = 0; i < trunk.length - 1; i++) {
    const r = .1 - i * .009;
    tube(body, [trunk[i], trunk[i + 1]], r, hide, 16, 8);
    if (i > 0) orb(body, trunk[i], [r * 1.15, r * .5, r * 1.15], hide, 10);
  }
  for (const z of [-1, 1]) {
    tube(body, [V(1.18, .16, z * .25), V(1.38, .08, z * .27), V(1.56, -.08, z * .28)], .038, mat('#f3e9d0'), 20, 7);
    tube(body, [V(1.56, -.08, z * .28), V(1.64, -.18, z * .26)], .02, mat('#f3e9d0'), 12, 6);
  }
  const leg = (x, z, r= .19) => {
    const top = V(x, -.22, z), knee = V(x + Math.sign(x) * .02, -.55, z), foot = V(x + .02, -.9, z);
    rod(body, top, knee, r * 1.22, hide, r * 1.02, 14);
    orb(body, knee, [r * 1.02, r * .9, r * 1.0], hide, 12);
    rod(body, knee, foot, r * .95, hide, r * .88, 12);
    orb(body, foot, [r * 1.35, r * .5, r * 1.2], dark, 14);
  };
  for (const x of [.48, -.48]) for (const z of [-.34, .34]) leg(x, z, mammoth ? .2 : .19);
  tube(body, [V(-.94, .14, 0), V(-1.08, 0, 0), V(-1.16, -.12, 0)], .03, hide, 20, 6);
  orb(body, V(-1.16, -.14, 0), [.06, .1, .06], dark, 10);
  if (mammoth) {
    for (let i = 0; i < 16; i++) {
      const x = -.8 + (i % 8) * .16, y = .5 + Math.floor(i / 8) * .12, z = (i % 3 - 1) * .4;
      cone(body, V(x, y, z), .06, .2, mat('#6b5138'), V(0, 0, i % 2 ? .5 : -.5));
    }
  }
}

function buildSeal(ctx) {
  const {body, skin, dark, light} = ctx;
  const wet = mat('#6d7a75', {roughness: .46, metalness: 0, clearcoat: .18});
  // One continuous lathed body: tail, barrel torso, narrow neck, round head and nose.
  // Building this as a single surface avoids the "string of beads" silhouette that
  // stacked spheres produce when the camera is close.
  const profile = [
    [.012, -.98], [.06, -.9], [.14, -.8], [.22, -.62], [.3, -.42],
    [.34, -.15], [.345, .08], [.33, .3], [.27, .46], [.2, .58],
    [.18, .68], [.21, .76], [.185, .84], [.13, .9], [.015, .94]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const lathe = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), wet);
  lathe.rotation.z = -Math.PI / 2;
  lathe.scale.set(1.08, 1, 1.16);
  lathe.position.y = .08;
  body.add(lathe);

  // A pale underside panel, kept just above the body surface.
  const belly = orb(body, V(-.06, -.17, 0), [.5, .045, .2], light, 26);
  belly.scale.x = 1.02;

  // Head details sit on the lathe surface.
  const headX = .78;
  const nose = orb(body, V(.91, .075, 0), [.055, .045, .05], dark, 14);
  for (const z of [-.145, .145]) {
    orb(body, V(headX, .155, z), [.032, .033, .027], light, 10);
    orb(body, V(headX + .006, .16, z * 1.03), [.022, .023, .018], dark, 10);
    orb(body, V(headX + .013, .168, z * 1.04), [.007, .008, .006], mat('#ffffff'), 5);
  }
  // Short whiskers around the muzzle.
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    rod(body, V(.89, .06 + i * .009, s * .035), V(1.03, .05 + i * .015, s * (.075 + i * .012)), .003, light, .002, 5);
  }
  // Mouth line.
  rod(body, V(.84, .025, -.045), V(.95, .025, .045), .004, dark, .002, 5);

  // Front flippers: tapered arm plus a swept-back blade.
  for (const s of [-1, 1]) {
    const shoulder = V(.32, -.12, s * .26);
    const elbow = V(.1, -.22, s * .36);
    const tip = V(-.16, -.28, s * .46);
    rod(body, shoulder, elbow, .058, wet, .045, 12);
    orb(body, elbow, [.06, .042, .052], wet, 10);
    rod(body, elbow, tip, .036, wet, .012, 10);
    const blade = orb(body, V(-.03, -.245, s * .39), [.15, .02, .08], wet, 16);
    blade.rotation.y = s * .55; blade.rotation.z = -.08;
    for (let i = -1; i <= 1; i++) rod(body, tip, V(-.23, -.29, s * .49 + i * .035), .007, dark, .003, 5);
  }
  // Hind flippers fan out behind, with visible toe ridges.
  for (const s of [-1, 1]) {
    const fin = orb(body, V(-.78, -.09, s * .22), [.25, .028, .12], wet, 18);
    fin.rotation.y = s * .35; fin.rotation.z = .06;
    for (let i = -1; i <= 1; i++) rod(body, V(-.68, -.1, s * .18), V(-1.0, -.14, s * .26 + i * .06), .008, dark, .004, 6);
  }
  tube(body, [V(-.68, .02, 0), V(-.86, .04, 0), V(-1.0, .01, 0)], .055, wet, 20, 7);

  // Harbor-seal spotting follows the back curve of the lathe.
  for (let i = 0; i < 28; i++) {
    const x = -.52 + (i % 10) * .1;
    const z = Math.sin(i * 1.9) * .2;
    const r = .345 - Math.abs(x + .1) * .16;
    const y = .08 + r * Math.sqrt(Math.max(.2, 1 - (z / (r * 1.16)) ** 2));
    const spot = orb(body, V(x, y, z), [.017 + (i % 3) * .007, .005, .014 + (i % 2) * .005], dark, 8);
    spot.rotation.y = i * .6;
  }
}

function buildBlueWhale(ctx) {
  const {body, skin, light, dark} = ctx;
  const blue = mat('#5f7785', {roughness: .72, metalness: 0});
  const bellyMat = mat('#b7c4c9', {roughness: .82});
  // Long tapered hull with a broad, blunt head.
  const profile = [[0, .02], [.08, .1], [.22, .23], [.5, .31], [.9, .33], [1.3, .31], [1.7, .25], [2.05, .16], [2.35, .08], [2.52, .02]];
  const hull = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([y, r]) => new THREE.Vector2(r, y)), 36), blue);
  hull.rotation.z = -Math.PI / 2; hull.position.set(-1.26, .0, 0); hull.scale.set(1, 1, .82); body.add(hull);
  // Broad rostrum and lower jaw.
  orb(body, V(1.06, .01, 0), [.28, .2, .22], blue, 32);
  orb(body, V(1.16, -.07, 0), [.22, .1, .18], bellyMat, 24);
  orb(body, V(.98, -.15, 0), [.3, .08, .19], bellyMat, 24);
  // Throat pleats.
  for (let i = 0; i < 12; i++) {
    const z = -.2 + i * .036;
    tube(body, [V(.92, -.1 + Math.abs(z) * .12, z), V(.45, -.23 + Math.abs(z) * .05, z), V(-.05, -.25, z), V(-.5, -.18, z)], .007, mat('#4c6572'), 30, 4);
  }
  // Eyes and blowholes.
  for (const z of [-.17, .17]) {
    orb(body, V(.78, .08, z), [.026, .028, .022], dark, 10);
    orb(body, V(.786, .09, z * 1.03), [.008, .009, .007], mat('#e8eef0'), 5);
  }
  for (const z of [-.045, .045]) orb(body, V(.58, .27, z), [.03, .018, .026], mat('#26343c'), 10);
  // Mottled back patches.
  for (let i = 0; i < 26; i++) {
    const x = -.65 + (i % 9) * .18, z = Math.sin(i * 2.2) * .2;
    const nx = (x + .1) / 1.03, nz = z / .25;
    const y = .33 * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)) + .002;
    const patch = orb(body, V(x, y, z), [.035 + (i % 3) * .012, .004, .025], i % 2 ? mat('#527080') : mat('#76909b'), 8);
    patch.rotation.y = i * .7;
  }
  // Long pectoral flippers.
  for (const s of [-1, 1]) {
    const fin = orb(body, V(.42, -.16, s * .3), [.38, .025, .075], blue, 20);
    fin.rotation.y = s * .35; fin.rotation.z = -.12;
    for (let i = 0; i < 3; i++) rod(body, V(.2 + i * .1, -.17, s * .3), V(.06 + i * .1, -.2, s * .37), .018, blue, .01, 6);
  }
  // Small dorsal fin set far back.
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(.09, .17, 5), blue);
  dorsal.position.set(-.53, .2, 0); dorsal.rotation.z = -.32; body.add(dorsal);
  // Wide fluke.
  const flukeShape = new THREE.Shape();
  flukeShape.moveTo(0, 0); flukeShape.lineTo(-.32, .38); flukeShape.lineTo(-.58, .27); flukeShape.lineTo(-.28, 0); flukeShape.lineTo(-.58, -.27); flukeShape.lineTo(-.32, -.38); flukeShape.closePath();
  const fluke = new THREE.Mesh(new THREE.ExtrudeGeometry(flukeShape, {depth: .045, bevelEnabled: false}), blue);
  fluke.position.set(-1.22, 0, -.022); fluke.scale.set(.72, .7, 1); body.add(fluke);
  tube(body, [V(-1.1, 0, 0), V(-1.28, 0, 0)], .065, blue, 16, 7);
}

function buildSpermWhale(ctx) {
  const {body, dark} = ctx;
  const skin = mat('#514943', {roughness: .82, metalness: 0});
  const belly = mat('#b9ada1', {roughness: .86});
  const wrinkle = mat('#3d3631', {roughness: .92});
  // Tapered lathed body, ending where the huge head begins.
  const profile = [[.02, -1.35], [.12, -1.15], [.2, -.9], [.28, -.5], [.31, -.1], [.27, .28], [.22, .5]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const hull = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), skin);
  hull.rotation.z = -Math.PI / 2; hull.position.y = .02; hull.scale.set(1, 1.08, .9); body.add(hull);
  // The sperm whale's defining feature: a massive, nearly rectangular head
  // that is much taller and wider than the body, with a flat blunt face.
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .55, 8, 26), skin);
  head.rotation.z = Math.PI / 2; head.position.set(.93, .04, 0); head.scale.set(1, 1.14, 1.03); body.add(head);
  const face = new THREE.Mesh(new THREE.BoxGeometry(.1, .66, .68), skin);
  face.position.set(1.27, .04, 0); body.add(face);
  orb(body, V(.82, .27, 0), [.42, .13, .3], skin, 24);
  // Long narrow lower jaw, pale throat and chin.
  const jaw = tube(body, [V(1.28, -.22, 0), V(1.04, -.25, 0), V(.72, -.24, 0), V(.34, -.2, 0), V(.05, -.15, 0)], .07, belly, 30, 8);
  orb(body, V(1.28, -.21, 0), [.11, .06, .1], belly, 18);
  orb(body, V(.48, -.27, 0), [.65, .035, .12], belly, 22);
  // Small eye on each side and a single blowhole on the left of the forehead.
  for (const z of [-.31, .31]) {
    orb(body, V(.98, .13, z), [.03, .032, .024], mat('#d8d1c4'), 10);
    orb(body, V(.985, .136, z * 1.02), [.015, .016, .012], dark, 8);
    orb(body, V(.99, .14, z * 1.03), [.005, .006, .004], mat('#ffffff'), 5);
  }
  orb(body, V(1.18, .35, .08), [.06, .025, .04], mat('#2b2521'), 10);
  // Deep wrinkles across the forehead.
  for (let i = 0; i < 9; i++) {
    const x = .55 + i * .075;
    tube(body, [V(x, .29, -.29), V(x + .015, .33, 0), V(x, .29, .29)], .0055, wrinkle, 18, 4);
  }
  // Pectoral flippers.
  for (const s of [-1, 1]) {
    const fin = orb(body, V(.3, -.18, s * .29), [.25, .022, .07], skin, 18);
    fin.rotation.y = s * .4; fin.rotation.z = -.12;
  }
  // Low dorsal hump and broad fluke.
  const hump = new THREE.Mesh(new THREE.ConeGeometry(.12, .15, 5), skin);
  hump.position.set(-.32, .23, 0); hump.rotation.z = -.18; body.add(hump);
  const flukeShape = new THREE.Shape();
  flukeShape.moveTo(0, 0); flukeShape.lineTo(-.3, .34); flukeShape.lineTo(-.56, .25); flukeShape.lineTo(-.3, 0); flukeShape.lineTo(-.56, -.25); flukeShape.lineTo(-.3, -.34); flukeShape.closePath();
  const fluke = new THREE.Mesh(new THREE.ExtrudeGeometry(flukeShape, {depth: .04, bevelEnabled: false}), skin);
  fluke.position.set(-1.2, .01, -.02); fluke.scale.set(.78, .74, 1); body.add(fluke);
  tube(body, [V(-1.15, .02, 0), V(-1.32, .01, 0)], .05, skin, 16, 7);
  // Mottled scratches on the back.
  for (let i = 0; i < 18; i++) {
    const x = -.7 + (i % 8) * .16, z = Math.sin(i * 2.1) * .2;
    orb(body, V(x, .27, z), [.02 + (i % 3) * .008, .004, .015], i % 2 ? mat('#6b625a') : mat('#423b36'), 7);
  }
}

function buildWhale(ctx, id) {
  const {body, skin, dark, light} = ctx;
  if (id === 'blue-whale') { buildBlueWhale(ctx); return; }
  if (id === 'sperm-whale') { buildSpermWhale(ctx); return; }
  const dolphin = id === 'bottlenose-dolphin';
  const orca = id === 'orca';
  const hump = id === 'humpback-whale';
  const seal = id === 'harbor-seal';
  if (seal) { buildSeal(ctx); return; }
  // A lathed body gives a tapered nose and tail instead of a capsule with two round caps.
  const profile = seal ? [[0, .015], [.12, .12], [.3, .17], [.55, .19], [.9, .18], [1.3, .15], [1.7, .09], [1.9, .03]] : dolphin ? [[0, .015], [.12, .12], [.3, .18], [.55, .2], [.85, .19], [1.25, .16], [1.7, .09], [1.95, .03]] : [[0, .02], [.12, .11], [.3, .19], [.55, .25], [.9, .27], [1.3, .255], [1.65, .19], [1.95, .1], [2.1, .03]];
  const hullPts = profile.map(([y, r]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(hullPts, 30), skin);
  torso.rotation.z = -Math.PI / 2; torso.position.set(-1.02, 0, 0); torso.scale.set(1, seal ? .92 : 1, seal ? .9 : .8); body.add(torso);
  const headPos = V(.92, .0, 0);
  const belly = orb(body, V(-.12, -.21, 0), [.78, .055, .17], light, 26);
  belly.scale.x = 1.02;
  belly.visible = id === 'humpback-whale' || id === 'orca' || id === 'harbor-seal';
  const mouthPoints = [V(.62, -.11, .17), V(.78, -.13, .16), V(.95, -.11, .08)];
  for (const z of [-.19, .19]) {
    tube(body, mouthPoints.map(p => V(p.x, p.y, z)), .006, dark, 20, 4);
  }
  for (const z of [-.16, .16]) {
    const eye = orb(body, V(.68, .015, z), [.024, .026, .023], dark, 12);
    orb(body, V(.69, .025, z * 1.05), [.008, .009, .007], mat('#ffffff'), 6);
  }
  if (!seal) {
    for (const z of [-.045, .045]) orb(body, V(.42, .255, z), [.035, .012, .024], dark, 10);
  }
  if (hump) {
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .52, 6, 12), skin);
      fin.position.set(.2, -.18, s * .24); fin.rotation.set(Math.PI / 2, 0, s * .55); fin.scale.z = .45; body.add(fin);
    }
  } else {
    for (const s of [-1, 1]) {
      const fin = orb(body, V(.14, -.18, s * .24), [.4, .03, .1], skin, 18);
      fin.rotation.x = s * .3; fin.rotation.y = s * .18; fin.rotation.z = -.18;
    }
  }
  const flukeShape = new THREE.Shape();
  flukeShape.moveTo(0, 0); flukeShape.lineTo(-.34, .3); flukeShape.lineTo(-.58, .22); flukeShape.lineTo(-.3, 0); flukeShape.lineTo(-.58, -.22); flukeShape.lineTo(-.34, -.3); flukeShape.closePath();
  const fluke = new THREE.Mesh(new THREE.ExtrudeGeometry(flukeShape, {depth: .035, bevelEnabled: false}), skin);
  fluke.position.set(-1.06, .01, -.018); fluke.scale.set(.72, .62, 1); body.add(fluke);
  tube(body, [V(-1.0, .0, 0), V(-1.14, .01, 0)], .07, skin, 14, 6);
  if (orca) {
    orb(body, V(.25, .27, 0), [.4, .12, .2], mat('#17202a'), 24);
    orb(body, V(.42, .02, 0), [.12, .26, .24], mat('#ece8dc'), 22);
  } else {
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(hump ? .13 : .1, hump ? .2 : .3, 4), skin);
    dorsal.position.set(hump ? -.2 : -.05, hump ? .26 : .3, 0); dorsal.rotation.z = hump ? -.5 : -.25; body.add(dorsal);
  }
  if (dolphin) cone(body, V(1.16, -.05, 0), .055, .2, skin, V(0, 0, -Math.PI / 2));
  if (seal) {
    for (const s of [-1, 1]) {
      const flipper = orb(body, V(.45, -.12, s * .23), [.22, .03, .08], skin, 16); flipper.rotation.y = s * .35;
    }
    for (const z of [-.055, .055]) orb(body, V(.9, -.02, z), [.025, .012, .022], dark, 8);
  }
}

function buildEarthworm(ctx) {
  const {body} = ctx;
  const skin = mat('#9d7a6e', {roughness: .38, metalness: 0, clearcoat: .3});
  const ringMat = mat('#7d5b51', {roughness: .44, metalness: 0, clearcoat: .2});
  const clitellum = mat('#c2a08f', {roughness: .4, metalness: 0, clearcoat: .25});
  const points = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    points.push(V(-1.08 + t * 2.16, .02 + Math.sin(t * TAU * 1.15) * .05, Math.sin(t * Math.PI * 1.6) * .05));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  // Overlapping smooth segments keep the worm continuous under the camera.
  // Radius varies slightly segment to segment instead of using raised rings.
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const p = curve.getPointAt(t);
    const r = (.072 - Math.pow(t - .5, 2) * .02) * (1 + Math.sin(i * Math.PI / 2) * .04);
    orb(body, p, [r, r * .92, r], skin, 18);
  }
  // Clitellum: a pale saddle near the front third, built from overlapping
  // flattened orbs so it reads as a raised band instead of loose bracelets.
  for (let i = 0; i < 7; i++) {
    const t = .255 + i * .012;
    orb(body, curve.getPointAt(t), [.079, .071, .071], clitellum, 12);
  }
  const head = curve.getPointAt(0);
  const headMesh = orb(body, head, [.095, .085, .085], skin, 20);
  orb(body, head.clone().add(V(.035, .03, 0)), [.045, .035, .04], ringMat, 10);
  const tail = curve.getPointAt(1);
  const tailMesh = orb(body, tail, [.08, .05, .05], skin, 16); tailMesh.scale.x *= .8;
  // 舞台背光会在后方投出一条扁平的“第二只蚯蚓”重影；蚯蚓贴地展示不需要投影。
  body.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
  });
}

function buildSnake(ctx, id) {
  if (id === 'earthworm') { buildEarthworm(ctx); return; }
  const {body, skin, dark} = ctx;
  const points = [];
  const n = id === 'earthworm' ? 20 : 26;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = -.95 + t * 1.9;
    points.push(V(x, Math.sin(t * 4.5) * .22, Math.sin(t * 3.2) * .12));
  }
  tube(body, points, id === 'earthworm' ? .055 : .075, skin, 48, 10);
  for (let i = 1; i < n - 1; i += 3) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 6, 18), id === 'earthworm' ? mat('#8d4a3d') : mat('#a8945a'));
    ring.position.copy(points[i]); ring.rotation.y = Math.PI / 2; body.add(ring);
  }
  const head = points[n - 1];
  orb(body, head, [.11, .07, .08], skin, 18);
  for (const z of [-.04, .04]) orb(body, head.clone().add(V(.05, .03, z)), [.02, .022, .02], dark, 8);
}

function buildIguana(ctx) {
  const {body} = ctx;
  const green = mat('#4f7530', {roughness: .82, metalness: 0});
  const greenDark = mat('#345020', {roughness: .88});
  const belly = mat('#a8b06a', {roughness: .86});
  const dewlapMat = mat('#6f7a3e', {roughness: .84});
  // Laterally compressed trunk, high shoulders and a long tail.
  orb(body, V(0, .04, 0), [.52, .12, .14], green, 34);
  orb(body, V(.3, .07, 0), [.24, .13, .14], green, 24);
  orb(body, V(-.28, .02, 0), [.23, .1, .12], green, 22);
  orb(body, V(-.04, -.04, 0), [.4, .06, .1], belly, 24);
  // Head with a long snout, distinct eye and jaw line.
    const head = V(.62, .12, 0);
  orb(body, head, [.2, .12, .105], green, 24);
  orb(body, V(.8, .09, 0), [.13, .075, .07], green, 18);
  for (const z of [-.075, .075]) {
    orb(body, V(.7, .16, z), [.03, .032, .026], greenDark, 10);
    orb(body, V(.706, .168, z * 1.03), [.016, .018, .014], mat('#5a4a1c'), 8);
    orb(body, V(.711, .172, z * 1.04), [.004, .008, .006], mat('#1e1a12'), 5);
    orb(body, V(.714, .176, z * 1.05), [.004, .0045, .0035], mat('#e8d6a8'), 4);
    orb(body, V(.87, .105, z * .55), [.011, .006, .009], greenDark, 5);
  }
  tube(body, [V(.86, .055, -.07), V(.9, .05, 0), V(.86, .055, .07)], .0055, greenDark, 18, 4);
  // Prominent dewlap fan under the throat, with a darker lower edge.
  const dewShape = new THREE.Shape();
  dewShape.moveTo(.36, -.02);
  dewShape.quadraticCurveTo(.42, -.2, .54, -.22);
  dewShape.quadraticCurveTo(.64, -.16, .64, -.02);
  dewShape.lineTo(.36, -.02);
  const dewlap = new THREE.Mesh(new THREE.ExtrudeGeometry(dewShape, {depth: .024, bevelEnabled: true, bevelSize: .008, bevelThickness: .006, bevelSegments: 2}), dewlapMat);
  dewlap.position.z = -.012; body.add(dewlap);
  tube(body, [V(.39, -.03, .02), V(.5, -.21, .02), V(.62, -.12, .02)], .007, mat('#4b552b'), 18, 4);
  // Tall dorsal crest from neck to tail base.
  for (let i = 0; i < 18; i++) {
    const x = .4 - i * .075, h = .15 - Math.abs(i - 3) * .006;
    cone(body, V(x, .15, 0), .017, Math.max(.04, h), greenDark, V(0, 0, -.15));
  }
  // Long banded tail.
  const tail = [V(-.52, .03, 0), V(-.78, .02, .05), V(-1.06, .0, .1), V(-1.34, -.03, .16), V(-1.6, -.06, .22)];
  for (let i = 0; i < tail.length - 1; i++) {
    const r = .105 - i * .02;
    rod(body, tail[i], tail[i + 1], r, green, r * .72, 12);
    orb(body, tail[i + 1], [r * .78, r * .7, r * .78], green, 10);
    if (i > 0) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(r * .97, .0035, 5, 16), greenDark);
      band.position.copy(tail[i + 1]); band.rotation.y = Math.PI / 2; body.add(band);
    }
  }
  // Four splayed legs with long toes.
  for (const [x, z, splay] of [[.28, .2, 1], [.28, -.2, -1], [-.28, .22, 1], [-.28, -.22, -1]]) {
    const hip = V(x, -.02, z), elbow = V(x + .1, -.16, z + splay * .12), foot = V(x + .2, -.26, z + splay * .18);
    rod(body, hip, elbow, .045, green, .032, 10);
    orb(body, elbow, [.04, .035, .035], green, 10);
    rod(body, elbow, foot, .03, green, .022, 10);
    for (let i = -1; i <= 1; i++) rod(body, foot, foot.clone().add(V(.12, -.015, i * .05)), .009, greenDark, .005, 6);
  }
  // Fine dorsal scales.
  for (let i = 0; i < 18; i++) {
    const x = -.4 + (i % 9) * .12, z = (i % 2 ? .05 : -.05);
    orb(body, V(x, .15, z), [.02, .006, .018], greenDark, 6);
  }
}

function buildKomodo(ctx) {
  const {body} = ctx;
  const skin = mat('#4f4b3e', {roughness: .88, metalness: 0});
  const dark = mat('#37342a', {roughness: .93});
  const belly = mat('#8f876c', {roughness: .9});
  // Heavy, low-slung body with a thick neck and huge head.
  orb(body, V(-.02, .02, 0), [.68, .2, .22], skin, 36);
  orb(body, V(.42, .08, 0), [.3, .19, .19], skin, 28);
  orb(body, V(-.38, .01, 0), [.28, .16, .18], skin, 24);
  orb(body, V(-.05, -.1, 0), [.52, .07, .16], belly, 24);
  const head = V(.75, .12, 0);
  orb(body, head, [.28, .16, .16], skin, 26);
  orb(body, V(.98, .08, 0), [.19, .09, .12], skin, 20);
  orb(body, V(1.02, .04, 0), [.16, .045, .1], belly, 14);
  for (const z of [-.09, .09]) {
    orb(body, V(.84, .19, z), [.04, .042, .034], dark, 10);
    orb(body, V(.846, .198, z * 1.03), [.021, .022, .017], mat('#a67f3e'), 8);
    orb(body, V(.851, .202, z * 1.04), [.008, .01, .007], mat('#17140e'), 5);
    orb(body, V(1.04, .09, z * .5), [.014, .007, .011], dark, 5);
  }
  // Slightly open mouth with a long, clearly forked yellow tongue.
  orb(body, V(1.02, -.005, 0), [.17, .028, .105], skin, 16);
  tube(body, [V(1.06, .028, -.11), V(1.1, .025, 0), V(1.06, .028, .11)], .008, dark, 18, 4);
  for (const z of [-.09, .09]) tube(body, [V(1.07, .025, 0), V(1.17, .02, z * .55), V(1.32, .015, z * 1.1)], .011, mat('#b89344'), 14, 5);
  // Loose skin folds along the neck.
  for (let i = 0; i < 4; i++) {
    const x = .25 + i * .08;
    tube(body, [V(x, .12, -.17), V(x + .02, .2, 0), V(x, .12, .17)], .007, dark, 18, 4);
  }
  // Low dorsal ridge and tail.
  for (let i = 0; i < 16; i++) cone(body, V(-.52 + i * .075, .19, 0), .024, .075, dark, V(0, 0, -.2));
  const tail = [V(-.62, .02, 0), V(-.9, 0, .06), V(-1.18, -.02, .12), V(-1.48, -.04, .2), V(-1.75, -.06, .28)];
  for (let i = 0; i < tail.length - 1; i++) {
    const r = .14 - i * .026;
    rod(body, tail[i], tail[i + 1], r, skin, Math.max(.03, r * .7), 12);
    if (i > 0) {
      orb(body, tail[i + 1], [r * .8, r * .72, r * .8], skin, 10);
      const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, .009, 5, 16), dark);
      band.position.copy(tail[i + 1]); band.rotation.y = Math.PI / 2; body.add(band);
    }
  }
  // Strong splayed legs and claws.
  for (const [x, z, splay] of [[.42, .24, 1], [.42, -.24, -1], [-.38, .24, 1], [-.38, -.24, -1]]) {
    const hip = V(x, -.06, z), knee = V(x + .1, -.22, z + splay * .13), foot = V(x + .2, -.34, z + splay * .2);
    rod(body, hip, knee, .085, skin, .065, 12);
    orb(body, knee, [.07, .065, .06], skin, 10);
    rod(body, knee, foot, .055, skin, .04, 10);
    orb(body, foot, [.1, .045, .08], dark, 10);
    for (let i = -1; i <= 1; i++) rod(body, foot, foot.clone().add(V(.12, -.01, i * .05)), .012, dark, .006, 6);
  }
  // Coarse scales across the back.
  for (let i = 0; i < 20; i++) {
    const x = -.5 + (i % 10) * .12, z = (i % 2 ? .09 : -.09);
    orb(body, V(x, .2, z), [.026, .008, .02], dark, 7);
  }
}

function buildReptile(ctx, id) {
  const {body, skin, dark, light, random} = ctx;
  if (id === 'iguana') { buildIguana(ctx); return; }
  if (id === 'komodo-dragon') { buildKomodo(ctx); return; }
  if (id === 'green-sea-turtle') {
    orb(body, V(0, .02, 0), [.58, .2, .48], mat('#4f6b45'), 34);
    orb(body, V(0, -.12, 0), [.5, .08, .4], mat('#c8b892'), 24);
    orb(body, V(.52, .02, 0), [.16, .12, .13], skin, 18);
    for (const z of [-.08, .08]) orb(body, V(.62, .06, z), [.025, .025, .025], dark, 8);
    for (const [x, z] of [[.3, .34], [.3, -.34], [-.3, .34], [-.3, -.34]]) {
      const fin = orb(body, V(x, -.08, z), [.2, .04, .14], skin, 16); fin.rotation.y = z > 0 ? .4 : -.4;
    }
    tube(body, [V(-.55, .02, 0), V(-.72, .04, 0), V(-.82, .02, 0)], .04, skin, 18, 8);
    return;
  }
  if (id === 'crocodile') {
    orb(body, V(0, 0, 0), [.72, .18, .2], skin, 32);
    orb(body, V(.58, .02, 0), [.32, .14, .16], skin, 24);
    orb(body, V(.82, .0, 0), [.3, .07, .1], skin, 20);
    for (let i = 0; i < 10; i++) cone(body, V(-.55 + i * .13, .18, 0), .035, .09, mat('#3b4a2c'), V(0, 0, -.15));
    for (const z of [-.12, .12]) orb(body, V(.55, .1, z), [.03, .035, .03], dark, 8);
    const tail = tube(body, [V(-.65, .02, 0), V(-.95, .02, .08), V(-1.25, 0, .18)], .1, skin, 30, 10);
    for (const x of [.28, -.3]) for (const z of [-.3, .3]) {
      rod(body, V(x, -.08, z), V(x + .12, -.25, z), .055, skin, .04, 10);
      orb(body, V(x + .12, -.25, z), [.09, .04, .06], dark, 10);
    }
    return;
  }
  // lizard / chameleon / gecko / komodo
  const big = id === 'komodo-dragon';
  orb(body, V(0, 0, 0), [big ? .75 : .55, .16, big ? .22 : .16], skin, 32);
  orb(body, V(big ? .68 : .5, .02, 0), [.16, .12, .12], skin, 20);
  for (const z of [-.08, .08]) orb(body, V(big ? .74 : .56, .08, z), [.03, .03, .03], dark, 8);
  for (const x of [.3, -.3]) for (const z of [-.24, .24]) {
    rod(body, V(x, -.03, z), V(x + .16, -.24, z + (z > 0 ? .12 : -.12)), .04, skin, .03, 10);
    orb(body, V(x + .16, -.24, z + (z > 0 ? .12 : -.12)), [.07, .03, .05], dark, 8);
  }
  tube(body, [V(-.5, .02, 0), V(-.8, 0, .1), V(-1.15, -.02, .2)], big ? .06 : .045, skin, 26, 8);
  if (id === 'chameleon') {
    const crest = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 4), mat('#3f7a4f'));
    crest.position.set(-.05, .2, 0); crest.rotation.z = -.35; body.add(crest);
  }
  if (big || id === 'iguana') for (let i = 0; i < 9; i++) {
    const x = -.42 + i * .13, h = id === 'iguana' ? .075 : .05;
    cone(body, V(x, .16, 0), .019, h, mat('#4a4634'), V(0, 0, -.2));
  }
  if (id === 'iguana') {
    const dewlap = orb(body, V(.48, -.08, 0), [.13, .07, .035], mat('#5d8a49'), 16);
    dewlap.rotation.z = -.2;
  }
}

function buildToad(ctx) {
  const {body, dark} = ctx;
  const skin = mat('#5f5c38', {roughness: .9, metalness: 0});
  const belly = mat('#bdb290', {roughness: .92});
  const wart = mat('#474426', {roughness: .96});
  // Compact body, broad head; the head is nearly as wide as the torso.
  orb(body, V(-.08, 0, 0), [.42, .23, .31], skin, 38);
  orb(body, V(.29, .01, 0), [.28, .18, .33], skin, 32);
  orb(body, V(.5, -.005, 0), [.17, .12, .24], skin, 24);
  orb(body, V(-.05, -.16, 0), [.36, .09, .25], belly, 26);
  orb(body, V(.38, -.1, 0), [.17, .07, .18], belly, 20);
  // Eyes: exposed gold irises with horizontal pupils, set high on the skull.
  for (const z of [-.145, .145]) {
    const socket = orb(body, V(.38, .155, z), [.068, .06, .062], skin, 18);
    socket.rotation.x = z > 0 ? .12 : -.12;
    orb(body, V(.405, .178, z * 1.02), [.042, .044, .04], mat('#c7a04b'), 18);
    orb(body, V(.416, .182, z * 1.03), [.018, .013, .028], dark, 10);
    orb(body, V(.425, .188, z * 1.04), [.005, .006, .004], mat('#f7f2e3'), 5);
  }
  // Parotoid glands are modest, not giant balls.
  for (const z of [-.19, .19]) {
    const gland = orb(body, V(.22, .115, z), [.1, .042, .055], mat('#55522f'), 16);
    gland.rotation.y = z > 0 ? -.3 : .3;
  }
  // Wide mouth line, lower lip, nostrils.
  tube(body, [V(.57, .02, -.19), V(.61, .012, 0), V(.57, .02, .19)], .009, dark, 28, 5);
  const lowerLip = orb(body, V(.56, -.015, 0), [.15, .022, .19], belly, 18); lowerLip.scale.z = .86;
  for (const z of [-.052, .052]) orb(body, V(.6, .085, z), [.012, .007, .009], dark, 6);
  // Warts, concentrated on the back and shoulders.
  for (let i = 0; i < 30; i++) {
    const a = i * 2.41, r = .06 + (i % 4) * .065;
    const x = -.3 + Math.cos(a) * r;
    const z = Math.sin(a) * (.13 + (i % 3) * .045);
    const nx = (x + .08) / .42, nz = z / .31;
    const y = .23 * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)) + .002;
    const size = .011 + (i % 3) * .005;
    orb(body, V(x, y, z), [size, size * .55, size], i % 2 ? wart : mat('#746c43'), 7);
  }
  // Front legs, short and splayed.
  for (const z of [-.25, .25]) {
    rod(body, V(.1, -.07, z), V(.2, -.17, z * 1.12), .042, skin, .03, 10);
    orb(body, V(.21, -.18, z * 1.12), [.043, .037, .038], skin, 10);
    for (let i = -1; i <= 1; i++) rod(body, V(.23, -.19, z * 1.12), V(.33, -.205, z * 1.12 + i * .045), .011, skin, .007, 7);
  }
  // Folded hind legs tucked against the body.
  for (const z of [-.27, .27]) {
    const hip = V(-.28, -.06, z), knee = V(-.02, -.1, z * 1.16), ankle = V(-.26, -.18, z * 1.08), toe = V(-.04, -.21, z * 1.16);
    orb(body, hip, [.1, .1, .085], skin, 14);
    rod(body, hip, knee, .085, skin, .07, 14);
    orb(body, knee, [.072, .075, .065], skin, 12);
    rod(body, knee, ankle, .055, skin, .04, 12);
    orb(body, ankle, [.042, .037, .037], skin, 10);
    rod(body, ankle, toe, .035, skin, .022, 10);
    const web = orb(body, V(.02, -.215, z * 1.15), [.12, .016, .07], skin, 14);
    for (let i = -1; i <= 1; i++) rod(body, V(.02, -.218, z * 1.15), V(.16, -.225, z * 1.15 + i * .055), .009, skin, .005, 6);
  }
  // Dorsal blotches.
  for (const [x, z, sx] of [[-.2, .05, .10], [.02, -.08, .08], [-.31, -.05, .06], [.1, .1, .06]]) {
    orb(body, V(x, .215, z), [sx, .011, .055], mat('#514c2c'), 10);
  }
}

function buildAmphibian(ctx, id) {
  const {body, skin, dark, light} = ctx;
  const salamander = id === 'fire-salamander' || id === 'axolotl' || id === 'giant-salamander';
  const toad = id === 'common-toad';
  if (toad) { buildToad(ctx); return; }
  if (salamander) {
    const len = id === 'giant-salamander' ? 1.1 : .85;
    orb(body, V(0, 0, 0), [len, .13, .16], skin, 32);
    orb(body, V(len * .78, .01, 0), [.17, .12, .14], skin, 24);
    for (const z of [-.075, .075]) orb(body, V(len * .9, .06, z), [.028, .030, .026], dark, 10);
    for (const x of [len * .45, -len * .1, -len * .55]) for (const z of [-.2, .2]) {
      rod(body, V(x, -.05, z), V(x + .08, -.18, z + Math.sign(z) * .1), .03, skin, .02, 10);
      orb(body, V(x + .08, -.18, z + Math.sign(z) * .1), [.05, .02, .04], dark, 8);
    }
    tube(body, [V(-len, .01, 0), V(-len * 1.1, .03, .06), V(-len * 1.25, .02, .12)], .07, skin, 26, 8);
    for (const z of [-.10, .10]) {
      const gill = new THREE.Mesh(new THREE.ConeGeometry(.035, .18, 5), mat('#c9736a'));
      gill.position.set(len * .86, .08, z); gill.rotation.z = z > 0 ? -.45 : -.45; gill.rotation.x = z > 0 ? .5 : -.5; body.add(gill);
    }
    return;
  }
  const squat = .94;
  orb(body, V(-.08, 0, 0), [.34 * squat, .19 * squat, .25 * squat], skin, 34);
  orb(body, V(-.1, -.075, 0), [.26, .11, .19], light, 24);
  const head = V(.3 * squat, .035, 0);
  orb(body, head, [.2 * squat, .15 * squat, .19 * squat], skin, 28);
  orb(body, V(head.x + .02, head.y - .015, 0), [.15, .08, .13], light, 22);
  for (const z of [-.105, .105]) {
    orb(body, head.clone().add(V(.03, .13, z)), [.085, .088, .080], skin, 18);
    orb(body, head.clone().add(V(.045, .158, z * 1.02)), [.046, .048, .044], mat(toad ? '#b99b4b' : '#d8b84a'), 14);
    orb(body, head.clone().add(V(.058, .165, z * 1.03)), [.018, .021, .015], dark, 8);
    orb(body, head.clone().add(V(.064, .172, z * 1.04)), [.005, .006, .004], mat('#ffffff'), 5);
  }
  tube(body, [head.clone().add(V(.17, -.04, -.1)), head.clone().add(V(.21, -.055, 0)), head.clone().add(V(.17, -.04, .1))], .007, dark, 22, 4);
  for (const z of [-.13, .13]) {
    const shoulder = V(.18, -.1, z), elbow = V(.27, -.23, z * 1.2), wrist = V(.33, -.3, z * 1.24);
    rod(body, shoulder, elbow, .038, skin, .03, 10);
    orb(body, elbow, [.04, .04, .038], skin, 10);
    rod(body, elbow, wrist, .028, skin, .022, 10);
    for (let i = -1; i <= 1; i++) rod(body, wrist, wrist.clone().add(V(.1, -.01, i * .055)), .012, skin, .008, 6);
  }
  for (const z of [-.18, .18]) {
    const hip = V(-.24, -.1, z), knee = V(-.12, -.24, z * 1.28), ankle = V(-.31, -.29, z * 1.1), foot = V(-.02, -.34, z * 1.18);
    rod(body, hip, knee, .075, skin, .056, 12);
    orb(body, knee, [.075, .078, .068], skin, 12);
    rod(body, knee, ankle, .05, skin, .038, 10);
    orb(body, ankle, [.045, .045, .04], skin, 10);
    rod(body, ankle, foot, .035, skin, .025, 10);
    for (let i = -1; i <= 1; i++) rod(body, foot, foot.clone().add(V(.12, -.012, i * .06)), .013, skin, .008, 6);
  }
  if (toad) {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, pos = V(-.18 + Math.cos(a) * .22, .05 + Math.sin(a) * .12, (i % 2 ? .11 : -.11));
      orb(body, pos, [.025, .02, .025], dark, 8);
    }
  }
  if (id === 'tree-frog') {
    const orange = mat('#d7a24b'), pupil = mat('#10170f');
    for (const z of [-.105, .105]) {
      orb(body, head.clone().add(V(.1, .13, z * 1.03)), [.05, .052, .018], orange, 12);
      orb(body, head.clone().add(V(.118, .138, z * 1.05)), [.024, .026, .009], pupil, 8);
    }
    tube(body, [head.clone().add(V(.184, -.03, -.09)), head.clone().add(V(.192, -.04, 0)), head.clone().add(V(.184, -.03, .09))], .005, pupil, 18, 4);
    for (const z of [-.045, .045]) orb(body, head.clone().add(V(.183, .045, z)), [.008, .006, .007], pupil, 6);
    orb(body, head.clone().add(V(.17, -.08, 0)), [.11, .045, .08], mat('#d8ddb7'), 16);
    for (const [x, z, sx] of [[-.2, .06, .1], [.02, -.07, .08], [-.3, -.03, .07], [.12, .1, .06], [-.08, -.13, .05]]) orb(body, V(x, .19, z), [sx, .012, .05], mat('#6c8f47'), 10);
    for (const z of [-.13, .13]) orb(body, V(.43, -.292, z * 1.25), [.028, .018, .024], orange, 10);
    for (const z of [-.18, .18]) orb(body, V(.105, -.342, z * 1.19), [.032, .018, .026], orange, 10);
    body.rotation.y = .32;
  }
}

function buildBird(ctx, id) {
  const {body, skin, dark, light} = ctx;
  const ostrich = id === 'ostrich', penguin = id === 'penguin', hum = id === 'hummingbird';
  orb(body, V(0, 0, 0), [ostrich ? .6 : .42, ostrich ? .3 : .24, ostrich ? .3 : .2], skin, 30);
  const head = V(ostrich ? .5 : .42, ostrich ? .72 : .3, 0);
  if (ostrich) tube(body, [V(.45, .15, 0), V(.48, .45, 0), head], .05, skin, 24, 8);
  orb(body, head, [.1, .11, .09], skin, 18);
  cone(body, head.clone().add(V(.15, -.02, 0)), .045, ostrich ? .18 : .12, mat('#d3a75b'), V(0, 0, -Math.PI / 2));
  for (const z of [-.05, .05]) orb(body, head.clone().add(V(.04, .04, z)), [.02, .022, .02], dark, 8);
  for (const s of [-1, 1]) {
    const wing = orb(body, V(-.05, .02, s * .28), [.3, .04, .16], skin, 20); wing.rotation.x = s * .2;
    if (penguin) wing.scale.set(.22, .38, .05);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.12, .28, 4), skin); tail.position.set(-.5, .06, 0); tail.rotation.z = Math.PI / 2; body.add(tail);
  if (ostrich) {
    for (const z of [-.12, .12]) { rod(body, V(-.05, -.2, z), V(-.02, -.9, z), .035, skin); orb(body, V(0, -.94, z), [.1, .035, .08], dark); }
    for (let i = 0; i < 6; i++) cone(body, V(-.4, .18 + i * .03, 0), .04, .14, mat('#efe5d2'), V(0, 0, -.5));
  } else if (penguin) {
    orb(body, V(.02, -.16, 0), [.3, .22, .2], mat('#ece7d8'), 22);
    for (const z of [-.1, .1]) { rod(body, V(0, -.36, z), V(.02, -.48, z), .04, mat('#d9a04e'), 8, 8); orb(body, V(.06, -.5, z), [.09, .03, .06], mat('#d9a04e'), 10); }
  } else {
    for (const z of [-.08, .08]) rod(body, V(-.02, -.2, z), V(-.02, -.38, z), .02, mat('#9b7a4f'), 6, 6);
  }
  if (hum) for (let i = 0; i < 3; i++) orb(body, V(-.15 - i * .08, .12, 0), [.06, .02, .1], mat('#4f9a7f'), 10);
}

function buildApe(ctx, id) {
  const {body} = ctx;
  const gorilla = id === 'gorilla';
  const surface = furSurface();
  const fur = mat(gorilla ? '#4a453e' : '#49392b', {roughness: .96, metalness: 0, map: surface.map, bumpMap: surface.bumpMap, bumpScale: .012});
  const furDark = mat(gorilla ? '#332f2b' : '#33261c', {roughness: .98});
  const furLight = mat(gorilla ? '#6f6960' : '#6a523c', {roughness: .95});
  const face = mat(gorilla ? '#262321' : '#b98d68', {roughness: .82});
  const faceDark = mat(gorilla ? '#171514' : '#8e6548', {roughness: .86});
  const eye = mat(gorilla ? '#b18442' : '#8a5a2e', {roughness: .35, metalness: 0});
  if (gorilla) {
    // Heavy barrel torso pitched forward, high shoulders, low hips.
    const torso = orb(body, V(-.02, .12, 0), [.52, .35, .34], fur, 40);
    torso.rotation.z = .2;
    orb(body, V(.27, .33, 0), [.31, .3, .37], fur, 30);
    orb(body, V(-.1, -.1, 0), [.34, .27, .32], fur, 28);
    orb(body, V(.28, .43, 0), [.33, .2, .39], fur, 28);
    // Silverback saddle and shoulder mantle.
    const saddle = orb(body, V(-.04, .44, 0), [.28, .075, .23], mat('#5f5a52'), 20);
    saddle.rotation.z = .16;
    for (let i = 0; i < 7; i++) {
      const a = -.9 + i * .3;
      cone(body, V(.02 + Math.cos(a) * .32, .45 + Math.sin(a) * .1, (i % 2 ? .25 : -.25)), .045, .15, furDark, V(0, 0, -.15 + a * .2));
    }
    // Head sits forward and low, with a sagittal crest, brow, muzzle and ears.
    tube(body, [V(.36, .35, 0), V(.43, .45, 0), V(.5, .52, 0)], .14, fur, 20, 9);
    const head = V(.54, .58, 0);
    orb(body, head, [.215, .2, .185], fur, 30);
    const crest = cone(body, V(.5, .72, 0), .09, .17, furDark, V(0, 0, -.2)); crest.scale.z = .55;
    orb(body, V(.67, .58, 0), [.095, .12, .15], face, 24);
    orb(body, V(.72, .52, 0), [.075, .06, .105], face, 20);
    orb(body, V(.735, .485, 0), [.065, .028, .095], faceDark, 14);
    // Broad, flat gorilla muzzle rather than a dog-like snout.
    orb(body, V(.775, .55, 0), [.035, .025, .065], faceDark, 12);
    // Brow ridge.
    const brow = orb(body, V(.72, .66, 0), [.085, .028, .13], faceDark, 16); brow.rotation.z = -.08;
    for (const z of [-.068, .068]) {
      orb(body, V(.745, .618, z), [.036, .038, .032], faceDark, 10);
      orb(body, V(.762, .624, z * 1.02), [.024, .025, .02], eye, 10);
      orb(body, V(.77, .628, z * 1.03), [.011, .012, .009], mat('#1f140b'), 7);
      orb(body, V(.776, .633, z * 1.04), [.005, .0055, .004], mat('#f7ead0'), 5);
      orb(body, V(.785, .548, z * .62), [.009, .006, .012], mat('#211b17'), 6);
    }
    tube(body, [V(.79, .495, -.085), V(.805, .492, 0), V(.79, .495, .085)], .007, faceDark, 20, 4);
    // Ears.
    for (const z of [-.19, .19]) {
      const ear = orb(body, V(.5, .58, z), [.05, .07, .024], furDark, 12);
      ear.rotation.y = z > 0 ? -.35 : .35;
    }
    // Long, massive arms in a knuckle-walking stance.
    for (const s of [-1, 1]) {
      const shoulder = V(.3, .4, s * .3), elbow = V(.37, .02, s * .36), wrist = V(.43, -.3, s * .31), hand = V(.49, -.47, s * .29);
      rod(body, shoulder, elbow, .105, fur, .08, 14);
      orb(body, elbow, [.085, .09, .08], fur, 12);
      rod(body, elbow, wrist, .07, fur, .052, 12);
      orb(body, wrist, [.058, .052, .052], furDark, 10);
      rod(body, wrist, hand, .048, furDark, .038, 10);
      const fist = orb(body, V(.5, -.49, s * .29), [.075, .055, .07], furDark, 12);
      for (let i = -1; i <= 1; i++) rod(body, V(.52, -.49, s * .29 + i * .033), V(.58, -.5, s * .29 + i * .033), .012, furDark, .007, 5);
      // Shoulder fur tufts.
      for (let i = 0; i < 4; i++) cone(body, V(.22 + i * .05, .45 + (i % 2) * .03, s * .3), .033, .12, furDark, V(0, 0, s * .3));
    }
    // Short bent legs and broad feet.
    for (const s of [-1, 1]) {
      const hip = V(-.28, -.02, s * .19), knee = V(-.07, -.22, s * .25), ankle = V(-.28, -.38, s * .23), foot = V(-.02, -.47, s * .24);
      orb(body, hip, [.125, .135, .115], fur, 14);
      rod(body, hip, knee, .115, fur, .087, 14);
      orb(body, knee, [.08, .085, .075], fur, 12);
      rod(body, knee, ankle, .07, fur, .052, 12);
      orb(body, ankle, [.052, .048, .048], furDark, 10);
      rod(body, ankle, foot, .048, furDark, .033, 10);
      orb(body, V(.02, -.48, s * .24), [.13, .045, .095], furDark, 14);
      for (let i = -1; i <= 1; i++) rod(body, V(.1, -.48, s * .24 + i * .038), V(.19, -.49, s * .24 + i * .043), .011, furDark, .006, 5);
    }
    return;
  }
  // Chimpanzee: upright, slender, with long arms and a pale face.
  const torso = orb(body, V(0, .2, 0), [.2, .42, .22], fur, 32); torso.rotation.z = .1;
  orb(body, V(.11, .48, 0), [.25, .24, .24], fur, 26);
  orb(body, V(-.05, -.04, 0), [.24, .22, .23], fur, 24);
  orb(body, V(-.06, .08, 0), [.18, .16, .17], furDark, 20);
  tube(body, [V(.11, .55, 0), V(.14, .66, 0), V(.16, .73, 0)], .09, fur, 16, 8);
  const head = V(.15, .79, 0);
  orb(body, head, [.16, .18, .15], fur, 28);
  orb(body, V(.27, .79, 0), [.075, .1, .09], face, 22);
  orb(body, V(.34, .72, 0), [.07, .045, .07], face, 16);
  orb(body, V(.35, .695, 0), [.062, .022, .06], faceDark, 12);
  const brow = orb(body, V(.345, .875, 0), [.068, .024, .09], faceDark, 14); brow.rotation.z = -.1;
  for (const z of [-.065, .065]) {
    orb(body, V(.35, .84, z), [.04, .043, .036], faceDark, 12);
    orb(body, V(.368, .847, z * 1.02), [.028, .03, .024], mat('#e4d0b4'), 10);
    orb(body, V(.382, .852, z * 1.03), [.015, .016, .012], mat('#3a2412'), 8);
    orb(body, V(.389, .856, z * 1.04), [.007, .008, .006], mat('#17100a'), 6);
    orb(body, V(.393, .861, z * 1.04), [.0045, .005, .004], mat('#f7ead0'), 4);
    orb(body, V(.375, .707, z * .55), [.008, .005, .008], faceDark, 5);
  }
  tube(body, [V(.405, .682, -.055), V(.415, .678, 0), V(.405, .682, .055)], .0055, faceDark, 16, 4);
  for (const z of [-.165, .165]) {
    const ear = orb(body, V(.16, .79, z), [.062, .078, .02], face, 12);
    ear.rotation.y = z > 0 ? -.4 : .4;
  }
  // Long arms reaching below the knees.
  for (const s of [-1, 1]) {
    const shoulder = V(.14, .58, s * .2), elbow = V(.22, .2, s * .27), wrist = V(.3, -.22, s * .3), hand = V(.35, -.4, s * .2);
    rod(body, shoulder, elbow, .07, fur, .055, 12);
    orb(body, elbow, [.06, .06, .055], fur, 10);
    rod(body, elbow, wrist, .05, fur, .037, 12);
    rod(body, wrist, hand, .035, faceDark, .028, 10);
    const palm = orb(body, V(.36, -.44, s * .2), [.06, .045, .05], faceDark, 10);
    for (let i = -1; i <= 1; i++) rod(body, V(.38, -.44, s * .2 + i * .025), V(.45, -.45, s * .2 + i * .025), .009, faceDark, .005, 5);
  }
  // Long legs and grasping feet.
  for (const s of [-1, 1]) {
    const hip = V(-.08, -.08, s * .14), knee = V(.03, -.3, s * .19), ankle = V(-.02, -.52, s * .17), foot = V(.12, -.6, s * .19);
    rod(body, hip, knee, .085, fur, .065, 12);
    orb(body, knee, [.06, .065, .06], fur, 10);
    rod(body, knee, ankle, .06, fur, .04, 12);
    orb(body, ankle, [.04, .038, .038], furDark, 10);
    rod(body, ankle, foot, .035, furDark, .025, 10);
    orb(body, V(.16, -.62, s * .19), [.11, .04, .07], furDark, 12);
    for (let i = -1; i <= 1; i++) rod(body, V(.21, -.62, s * .19 + i * .03), V(.28, -.62, s * .19 + i * .035), .009, furDark, .005, 5);
  }
  // Shoulder and back fur tufts.
  for (let i = 0; i < 5; i++) cone(body, V(-.08 + i * .05, .62, (i % 2 ? .16 : -.16)), .025, .1, furDark, V(0, 0, .25));
  // Pale chest/belly.
  orb(body, V(.1, .28, 0), [.12, .18, .08], mat('#9a7c60'), 14);
}

function buildPrimate(ctx, id) {
  if (id === 'gorilla' || id === 'chimpanzee') { buildApe(ctx, id); return; }
  const {body, skin, dark} = ctx;
  const big = id === 'gorilla';
  orb(body, V(0, 0, 0), [big ? .48 : .38, .42, .3], skin, 32);
  orb(body, V(.15, .35, 0), [.3, .22, .26], skin, 24);
  orb(body, V(.26, .62, 0), [.22, .22, .2], skin, 28);
  for (const z of [-.1, .1]) orb(body, V(.38, .66, z), [.025, .028, .025], dark, 8);
  for (const z of [-.2, .2]) orb(body, V(.2, .58, z), [.07, .08, .05], skin, 12);
  for (const s of [-1, 1]) {
    rod(body, V(.18, .3, s * .18), V(.35, -.18, s * .24), .09, skin, .07, 12);
    orb(body, V(.35, -.22, s * .24), [.1, .07, .08], skin, 12);
    rod(body, V(-.2, -.18, s * .18), V(-.25, -.6, s * .2), .1, skin, .08, 12);
    orb(body, V(-.28, -.64, s * .2), [.11, .07, .09], dark, 12);
  }
  if (id !== 'gorilla') tube(body, [V(-.4, -.1, 0), V(-.5, .1, .1), V(-.55, .25, .18)], .03, skin, 20, 8);
}

function buildKangaroo(ctx, id) {
  const {body, skin, dark} = ctx;
  orb(body, V(0, 0, 0), [.48, .34, .3], skin, 32);
  orb(body, V(.32, .1, 0), [.2, .3, .22], skin, 22);
  orb(body, V(.38, .52, 0), [.14, .16, .13], skin, 20);
  for (const z of [-.08, .08]) orb(body, V(.48, .56, z), [.025, .028, .025], dark, 8);
  for (const z of [-.17, .17]) cone(body, V(.4, .72, z), .05, .18, skin, V(-.2, 0, z > 0 ? -.3 : .3));
  for (const z of [-.18, .18]) {
    rod(body, V(-.1, -.18, z), V(-.15, -.5, z), .11, skin, .07, 12);
    orb(body, V(.05, -.62, z), [.2, .06, .09], skin, 14);
    rod(body, V(.2, .15, z), V(.3, -.02, z), .035, skin, .025, 8);
  }
  tube(body, [V(-.4, .05, 0), V(-.75, -.15, 0), V(-1.1, -.45, 0)], .09, skin, 30, 10);
}

function buildHorse(ctx) {
  const {body, skin, dark, light} = ctx;
  const mane = mat('#2a1b12', {roughness: .94});
  const hoof = mat('#332720', {roughness: .82});
  const hide = mat('#8a5a35', {roughness: .78});
  // Barrel, chest and rump overlap so the trunk reads as one horse shape.
  orb(body, V(0, .1, 0), [.66, .36, .3], hide, 38);
  orb(body, V(.46, .14, 0), [.36, .34, .3], hide, 32);
  orb(body, V(-.42, .12, 0), [.36, .33, .28], hide, 30);
  // Arched neck: thicker at the shoulder, narrower at the poll.
  tube(body, [V(.46, .2, 0), V(.62, .36, 0), V(.76, .52, 0), V(.86, .62, 0)], .15, hide, 26, 12);
  const head = orb(body, V(.94, .64, 0), [.24, .18, .15], hide, 28);
  head.rotation.z = -.12;
  const muzzle = orb(body, V(1.14, .56, 0), [.25, .105, .1], hide, 24);
  muzzle.rotation.z = -.08;
  for (const z of [-.12, .12]) {
    orb(body, V(1.02, .68, z), [.032, .03, .028], dark, 10);
    orb(body, V(1.02, .69, z * 1.04), [.009, .010, .008], mat('#f2ead8'), 6);
    cone(body, V(.87, .8, z * .42), .042, .14, hide, V(-.12, 0, z > 0 ? -.18 : .18));
  }
  orb(body, V(.95, .78, 0), [.09, .07, .05], mane, 12);
  // Mane: a visible crest strip plus short angled tufts.
  tube(body, [V(.48, .42, 0), V(.62, .56, 0), V(.76, .7, 0), V(.86, .78, 0)], .042, mane, 26, 8);
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const p = V(.48 + t * .38, .44 + t * .34, 0);
    cone(body, p.add(V(0, .08, 0)), .048, .16 - Math.abs(t - .5) * .04, mane, V(0, 0, -.28));
  }
  // Four legs with a slight fore/aft stance and dark hooves.
  for (const x of [.44, -.4]) for (const z of [-.2, .2]) {
    const kneeX = x + (x > 0 ? -.04 : -.08), ankleX = x + (x > 0 ? .02 : .06);
    rod(body, V(x, -.06, z), V(kneeX, -.34, z), .082, hide, .068, 12);
    orb(body, V(kneeX, -.35, z), [.075, .075, .075], hide, 10);
    rod(body, V(kneeX, -.35, z), V(ankleX, -.61, z), .058, hide, .048, 10);
    orb(body, V(ankleX, -.66, z), [.1, .05, .08], hoof, 12);
  }
  // Thick, hanging tail with a hair tuft.
  tube(body, [V(-.74, .2, 0), V(-.88, .02, 0), V(-.94, -.28, 0), V(-.92, -.48, 0)], .055, mane, 24, 8);
  orb(body, V(-.92, -.52, 0), [.09, .17, .09], mane, 12);
}

function buildSheep(ctx) {
  const {body, skin, dark, light} = ctx;
  const wool = mat('#f0ece2', {roughness: .96});
  const face = mat('#4e453b', {roughness: .86});
  const hoof = mat('#3b3129', {roughness: .82});
  // Three overlapping wool masses; no isolated balls floating off the body.
  orb(body, V(0, .22, 0), [.58, .36, .48], wool, 32);
  orb(body, V(.43, .23, 0), [.4, .34, .42], wool, 26);
  orb(body, V(-.42, .2, 0), [.42, .34, .42], wool, 26);
  for (let i = 0; i < 10; i++) {
    const x = (i / 9 - .5) * .9, y = .56 + (i % 2 ? .015 : -.005), z = (i % 3 - 1) * .27;
    orb(body, V(x, y, z), [.15, .07, .14], wool, 10);
  }
  // Short neck and a dark face so the head separates from the fleece.
  tube(body, [V(.5, .26, 0), V(.64, .34, 0)], .11, face, 18, 10);
  orb(body, V(.78, .4, 0), [.21, .17, .16], face, 24);
  orb(body, V(.95, .34, 0), [.17, .09, .1], face, 18);
  for (const z of [-.15, .15]) {
    orb(body, V(.86, .45, z), [.026, .026, .025], mat('#f2eee4'), 6);
    orb(body, V(.87, .455, z * 1.04), [.01, .011, .009], mat('#17130f'), 5);
    const ear = orb(body, V(.7, .47, z * 1.55), [.12, .05, .075], face, 12);
    ear.rotation.z = z > 0 ? -.35 : .35;
  }
  orb(body, V(.74, .55, 0), [.14, .08, .12], wool, 12);
  for (const [x, z] of [[.5, -.22], [.34, .22], [-.34, -.22], [-.5, .22]]) {
    rod(body, V(x, -.02, z), V(x, -.4, z), .085, face, .068, 10);
    orb(body, V(x, -.45, z), [.09, .045, .07], hoof, 8);
  }
  tube(body, [V(-.67, .2, 0), V(-.76, .16, 0)], .06, wool, 12, 8);
  orb(body, V(-.78, .16, 0), [.09, .13, .08], wool, 10);
}

function buildTyrannosaurus(ctx) {
  const {body, skin, dark, light} = ctx;
  const stripe = mat('#4e5a42', {roughness: .9});
  // Horizontal torso: hips high, chest lower, with a deep belly.
  orb(body, V(-.22, .18, 0), [.48, .36, .32], skin, 34);
  orb(body, V(.2, .12, 0), [.46, .32, .3], skin, 32);
  orb(body, V(-.02, -.02, 0), [.42, .25, .27], skin, 26);
  for (let i = 0; i < 5; i++) {
    orb(body, V(.2 - i * .16, .38, 0), [.16, .05, .2], stripe, 10);
  }
  // Thick neck and a head that overlaps it, so it does not float.
  tube(body, [V(.32, .23, 0), V(.48, .36, 0), V(.64, .48, 0)], .18, skin, 24, 12);
  const skull = orb(body, V(.84, .53, 0), [.34, .24, .2], skin, 30);
  skull.rotation.z = -.1;
  const snout = orb(body, V(1.1, .46, 0), [.26, .16, .15], skin, 24);
  const jaw = orb(body, V(1.02, .34, 0), [.26, .075, .14], skin, 20);
  jaw.rotation.z = .08;
  for (const z of [-.175, .175]) {
    const brow = orb(body, V(.93, .64, z), [.09, .07, .06], skin, 12);
    orb(body, V(.96, .65, z), [.028, .026, .025], dark, 8);
    orb(body, V(.97, .66, z * 1.04), [.008, .009, .007], mat('#fff6dc'), 6);
    for (let i = 0; i < 7; i++) {
      cone(body, V(1.0 + i * .032, .35, z * .8), .012, .07, mat('#efe6d2'), V(Math.PI, 0, 0));
    }
  }
  // A continuous, tapering tail instead of a chain of beads.
  tube(body, [V(-.55, .2, 0), V(-.85, .12, 0), V(-1.08, .02, 0)], .15, skin, 30, 10);
  tube(body, [V(-1.0, .05, 0), V(-1.2, -.06, 0), V(-1.38, -.14, 0)], .075, skin, 26, 8);
  orb(body, V(-.58, .18, 0), [.22, .18, .15], skin, 18);
  for (const [sx, sz] of [[-.18, .27], [-.38, -.27]]) {
    const hip = V(sx, .1, sz), knee = V(sx + .02, -.26, sz * 1.05), ankle = V(sx + .18, -.5, sz * 1.1), foot = V(sx + .34, -.62, sz * 1.12);
    rod(body, hip, knee, .15, skin, .11, 14);
    orb(body, knee, [.11, .11, .1], skin, 10);
    rod(body, knee, ankle, .1, skin, .065, 12);
    rod(body, ankle, foot, .055, skin, .04, 10);
    for (let i = -1; i <= 1; i++) cone(body, foot.clone().add(V(.1, -.01, i * .045)), .028, .1, dark, V(0, 0, -Math.PI / 2));
  }
  // Tiny two-fingered arms held close to the chest.
  for (const z of [-.18, .18]) {
    rod(body, V(.36, .28, z), V(.5, .18, z * 1.12), .034, skin, .025, 8);
    rod(body, V(.5, .18, z * 1.12), V(.56, .08, z * 1.2), .025, skin, .017, 8);
    cone(body, V(.58, .06, z * 1.22), .018, .06, dark, V(0, 0, -1.2));
  }
}


function buildDinosaur(ctx, id) {
  const {body, skin, dark, light} = ctx;
  if (id === 'tyrannosaurus') return buildTyrannosaurus(ctx);
  if (id === 'triceratops') {
    const frillMat = mat('#857455', {roughness: .9});
    orb(body, V(-.12, .1, 0), [.62, .33, .36], skin, 36);
    orb(body, V(.34, .14, 0), [.3, .29, .31], skin, 28);
    orb(body, V(-.5, .05, 0), [.3, .28, .3], skin, 24);
    // A broad shield-like frill behind the head.
    const frill = new THREE.Mesh(new THREE.CylinderGeometry(.34, .4, .05, 30), frillMat);
    frill.position.set(.46, .32, 0); frill.rotation.x = Math.PI / 2; frill.scale.set(1.08, 1.16, 1); body.add(frill);
    for (let i = 0; i < 9; i++) {
      const a = -1.2 + i * .3;
      orb(body, V(.46 + Math.cos(a) * .37, .32 + Math.sin(a) * .4, 0), [.035, .035, .035], frillMat, 6);
    }
    orb(body, V(.68, .17, 0), [.27, .22, .22], skin, 26);
    orb(body, V(.9, .1, 0), [.2, .15, .17], skin, 20);
    for (const z of [-.13, .13]) {
      cone(body, V(.8, .36, z), .055, .38, mat('#e7d9bc'), V(0, 0, -1.05));
      orb(body, V(.9, .18, z), [.027, .027, .025], mat('#f4ecd8'), 7);
      orb(body, V(.91, .185, z * 1.04), [.009, .010, .008], mat('#1a1510'), 5);
    }
    cone(body, V(1.0, .02, 0), .045, .17, dark, V(0, 0, -1.1));
    for (const x of [.34, -.35]) for (const z of [-.24, .24]) {
      rod(body, V(x, -.14, z), V(x, -.48, z), .11, skin, .08, 12);
      orb(body, V(x, -.53, z), [.13, .06, .1], dark, 10);
    }
    tube(body, [V(-.7, .08, 0), V(-.95, 0, 0), V(-1.18, -.08, 0)], .07, skin, 26, 8);
    return;
  }
  if (id === 'brachiosaurus') {
    const dino = mat('#7c8168', {roughness: .9, metalness: 0});
    const dinoDark = mat('#5d624d', {roughness: .93});
    const belly = mat('#aeb098', {roughness: .9});
    // Barrel torso with a deep chest and higher shoulders than hips.
    orb(body, V(.05, .12, 0), [.62, .36, .36], dino, 38);
    orb(body, V(.42, .16, 0), [.33, .34, .32], dino, 30);
    orb(body, V(-.4, .05, 0), [.32, .3, .3], dino, 28);
    orb(body, V(-.28, -.15, 0), [.42, .18, .28], belly, 26);
    // Long neck made of overlapping vertebral masses.
    const neck = [V(.44, .26, 0), V(.49, .62, 0), V(.52, 1.02, 0), V(.57, 1.34, 0), V(.64, 1.55, 0)];
    for (let i = 0; i < neck.length - 1; i++) {
      const r = .18 - i * .022;
      rod(body, neck[i], neck[i + 1], r * .85, dino, r * .72, 12);
      orb(body, neck[i + 1], [r * .8, r * .72, r * .76], dino, 12);
    }
    // Small skull with a high dome, long snout and nostrils.
    const head = V(.76, 1.62, 0);
    orb(body, head, [.21, .14, .12], dino, 24);
    orb(body, V(.92, 1.59, 0), [.14, .085, .09], dino, 18);
    orb(body, V(.99, 1.54, 0), [.08, .04, .055], dinoDark, 12);
    const dome = orb(body, V(.78, 1.74, 0), [.12, .055, .08], dinoDark, 14);
    for (const z of [-.075, .075]) {
      orb(body, V(.86, 1.67, z), [.026, .027, .022], dinoDark, 10);
      orb(body, V(.866, 1.676, z * 1.03), [.012, .013, .01], mat('#d7c28a'), 8);
      orb(body, V(.872, 1.68, z * 1.04), [.005, .006, .004], mat('#211b13'), 5);
      orb(body, V(.96, 1.56, z * .5), [.012, .007, .01], dinoDark, 6);
    }
    tube(body, [V(.98, 1.52, -.06), V(1.01, 1.515, 0), V(.98, 1.52, .06)], .006, dinoDark, 18, 4);
    // Four columnar legs; front pair is noticeably longer.
    for (const z of [-.28, .28]) {
      const hip = V(.38, -.05, z), knee = V(.4, -.38, z), ankle = V(.39, -.62, z), foot = V(.39, -.75, z);
      rod(body, hip, knee, .115, dino, .085, 14);
      orb(body, knee, [.08, .085, .075], dino, 12);
      rod(body, knee, ankle, .075, dino, .062, 12);
      orb(body, ankle, [.06, .055, .055], dino, 10);
      rod(body, ankle, foot, .06, dino, .05, 10);
      orb(body, V(.39, -.77, z), [.11, .045, .09], dinoDark, 14);
    }
    for (const z of [-.24, .24]) {
      const hip = V(-.38, .0, z), knee = V(-.34, -.26, z), ankle = V(-.35, -.45, z), foot = V(-.35, -.58, z);
      rod(body, hip, knee, .1, dino, .078, 14);
      orb(body, knee, [.075, .08, .07], dino, 12);
      rod(body, knee, ankle, .068, dino, .055, 12);
      orb(body, ankle, [.052, .05, .05], dino, 10);
      rod(body, ankle, foot, .052, dino, .045, 10);
      orb(body, V(-.35, -.6, z), [.1, .04, .08], dinoDark, 12);
    }
    // Long tail tapering to a whip.
    const tail = [V(-.62, .08, 0), V(-.92, .02, .02), V(-1.22, -.04, .06), V(-1.5, -.1, .1), V(-1.75, -.16, .14)];
    for (let i = 0; i < tail.length - 1; i++) {
      const r = .12 - i * .021;
      rod(body, tail[i], tail[i + 1], r, dino, Math.max(.028, r * .75), 12);
      if (i > 0) orb(body, tail[i + 1], [r * .85, r * .8, r * .85], dino, 10);
    }
    // Dorsal stripe and neck folds.
    for (let i = 0; i < 5; i++) orb(body, V(-.44 + i * .11, .45, 0), [.07, .012, .075], dinoDark, 8);
    for (let i = 0; i < 5; i++) {
      const p = neck[i];
      tube(body, [V(p.x, p.y, -.16), V(p.x + .01, p.y + .03, 0), V(p.x, p.y, .16)], .006, dinoDark, 16, 4);
    }
    return;
  }
  // plesiosaur
  orb(body, V(0, 0, 0), [.55, .26, .32], skin, 32);
  tube(body, [V(.35, .12, 0), V(.5, .4, 0), V(.55, .7, 0), V(.7, .8, 0)], .1, skin, 30, 10);
  orb(body, V(.78, .82, 0), [.13, .1, .1], skin, 18);
  for (const z of [-.06, .06]) orb(body, V(.87, .85, z), [.02, .022, .02], dark, 8);
  for (const [x, z] of [[.3, .3], [.3, -.3], [-.25, .3], [-.25, -.3]]) {
    const fin = orb(body, V(x, -.08, z), [.25, .035, .14], skin, 16); fin.rotation.y = z > 0 ? .5 : -.5;
  }
  tube(body, [V(-.5, .02, 0), V(-.8, 0, 0), V(-1.1, -.05, 0)], .06, skin, 24, 8);
}

function buildLobster(ctx) {
  const {body, skin, dark, light} = ctx;
  for (let i = 0; i < 6; i++) orb(body, V(-.55 + i * .2, 0, 0), [.18 - i * .015, .12 - i * .012, .13 - i * .012], skin, 16);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.15, .35, 6), skin); tail.position.set(-.85, 0, 0); tail.rotation.z = Math.PI / 2; body.add(tail);
  for (const s of [-1, 1]) {
    const claw = new THREE.Mesh(new THREE.TorusGeometry(.12, .05, 8, 14, Math.PI * 1.4), skin);
    claw.position.set(.55, -.02, s * .18); claw.rotation.set(Math.PI / 2, 0, s * .4); body.add(claw);
    for (let i = 0; i < 3; i++) rod(body, V(.2 + i * .12, -.1, s * .14), V(.25 + i * .12, -.3, s * .3), .025, skin, .015, 8);
  }
  for (const s of [-1, 1]) {
    tube(body, [V(.05, .08, s * .1), V(.25, .2, s * .25), V(.55, .32, s * .5)], .012, dark, 18, 6);
    for (const z of [s * .1]) orb(body, V(.5, .06, z), [.025, .025, .025], dark, 8);
  }
}

function buildOctopus(ctx) {
  const {body, skin, dark} = ctx;
  orb(body, V(0, 0, 0), [.42, .46, .42], skin, 34);
  for (const z of [-.12, .12]) orb(body, V(.1, .02, z), [.04, .05, .04], dark, 10);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU, sx = Math.cos(a), sz = Math.sin(a);
    const points = [V(sx * .18, -.2, sz * .18), V(sx * .45, -.55, sz * .45), V(sx * .55, -.9, sz * .55), V(sx * .35, -1.05, sz * .35)];
    tube(body, points, .06, skin, 26, 8);
  }
}

export function createAnimal(g, c, random, entry) {
  const rawId = String(entry?.id || '').replace('space.', '');
  const id = rawId === 'african-lion' ? 'lion' : rawId === 'squirrel' ? 'gray-squirrel' : rawId;
  const pal = palette(id, c.color);
  const fur = furSurface();
  const skin = mat(pal.body, {roughness: .86, metalness: 0});
  skin.bumpMap = fur.bumpMap;
  skin.bumpScale = .008;
  const ctx = {
    body: new THREE.Group(),
    skin,
    dark: mat(pal.dark, {roughness: .9, metalness: 0}),
    light: mat(pal.light, {roughness: .8, metalness: 0}),
    random,
    palette: pal
  };
  g.add(ctx.body);
  if (!isFish(id) && !isWhale(id) && !isSnake(id)) ctx.body.rotation.y = -.24;
  if (isWinged(id)) buildWinged(ctx, id);
  else if (isFish(id)) buildFish(ctx, id);
  else if (isWhale(id)) buildWhale(ctx, id);
  else if (isSnake(id)) buildSnake(ctx, id);
  else if (isReptile(id)) buildReptile(ctx, id);
  else if (isAmphibian(id)) buildAmphibian(ctx, id);
  else if (isBird(id)) buildBird(ctx, id);
  else if (isPrimate(id)) buildPrimate(ctx, id);
  else if (id === 'elephant' || id === 'woolly-mammoth') buildElephant(ctx, id);
  else if (id === 'horse') buildHorse(ctx);
  else if (id === 'sheep') buildSheep(ctx);
  else if (id === 'red-kangaroo') buildKangaroo(ctx, id);
  else if (isDinosaur(id)) buildDinosaur(ctx, id);
  else if (id === 'lobster') buildLobster(ctx);
  else if (id === 'octopus') buildOctopus(ctx);
  else if (id === 'chameleon' || id === 'gecko') buildReptile(ctx, id);
  else {
    const p = {};
    if (id === 'horse') {
      Object.assign(p, {bl: 1.5, bh: .5, bw: .37, legL: .68, legR: .082, hl: .22, hh: .16, hw: .14, nr: .12, neck: .58, knee: .045, hoof: true, ears: 'point', noTail: true, tail: 0, tailR: .05});
    } else if (id === 'lion') {
      Object.assign(p, {bl: 1.42, bh: .54, bw: .4, legL: .46, legR: .1, hl: .215, hh: .185, hw: .175, nr: .145, neck: .62, knee: .048, noTail: true, tail: 0, tailR: .045});
    } else if (['tiger', 'leopard', 'cheetah', 'saber-toothed-cat'].includes(id)) {
      Object.assign(p, {bl: 1.46, bh: .43, bw: .36, legL: .44, legR: .075, hl: .195, hh: .17, hw: .16, nr: .12, neck: .68, knee: .045, tail: .4, tailR: .06, ears: 'round'});
    } else if (['gray-wolf', 'coyote', 'red-fox', 'dog', 'cat'].includes(id)) {
      Object.assign(p, {bl: 1.34, bh: .4, bw: .33, legL: .4, legR: .065, hl: .19, hh: .165, hw: .15, nr: .1, neck: .66, knee: .042, tail: .4, tailR: .065, ears: id === 'cat' ? 'point' : 'point'});
    } else if (id === 'giraffe') {
      Object.assign(p, {bl: 1.45, bh: .58, bw: .42, legL: .82, legR: .08, hl: .22, hh: .2, hw: .18, nr: .14, neck: 1.9, knee: .05, tail: .34, tailR: .045, tailTuft: .07, hoof: true});
    } else if (id === 'moose') {
      Object.assign(p, {bl: 1.4, bh: .52, bw: .4, legL: .62, legR: .085, hl: .27, hh: .24, hw: .22, nr: .12, neck: .75, knee: .05, tail: .2});
    } else if (['moose', 'elephant', 'bison', 'cattle', 'rhinoceros', 'hippopotamus', 'walrus', 'woolly-mammoth', 'dromedary-camel'].includes(id)) {
      Object.assign(p, {bl: 1.5, bh: .58, bw: .42, legL: .6, hl: .26, hh: .24, hw: .23, neck: id === 'elephant' ? .5 : .7, nr: .12, legR: .085, knee: .05, hoof: true});
    } else if (id === 'beaver') {
      Object.assign(p, {bl: 1.05, bh: .4, bw: .4, legL: .22, hl: .22, hh: .2, hw: .2, ears: 'round', legR: .062, tail: .32, tailR: .04});
    } else if (['rabbit', 'hamster', 'mouse', 'koala', 'gray-squirrel'].includes(id)) {
      Object.assign(p, {bl: 1.0, bh: .38, bw: .32, legL: .32, hl: .18, hh: .17, hw: .17, ears: id === 'rabbit' ? 'long' : 'round', legR: .058, noTail: id === 'rabbit', tail: .32, tailR: .05});
    } else if (id === 'brown-bear') {
      Object.assign(p, {bl: 1.45, bh: .58, bw: .45, legL: .48, legR: .105, hl: .26, hh: .24, hw: .23, nr: .13, neck: .6, knee: .05, ears: 'round', tail: .2});
    } else if (id === 'white-tailed-deer') {
      Object.assign(p, {bl: 1.3, bh: .42, bw: .34, legL: .62, legR: .062, hl: .23, hh: .2, hw: .18, nr: .09, neck: .8, knee: .045, tail: .2});
    }
    quadrupedSpecies(ctx, id, p);
  }
  fit(ctx.body, 'x', id === 'earthworm' ? 3.2 : 2);
  const externalURL = ANIMAL_EXTERNAL[id];
  if (externalURL) {
    const layout = ANIMAL_LAYOUT[id] || {};
    const slot = attachExternalModel(g, externalURL, {
      fit: layout.fit ?? 1.72,
      onReady: (model) => {
        ctx.body.visible = false;
        if (id === 'eagle' || id === 'condor') {
          model.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (!material || !material.color) return;
              material.color.set(id === 'condor' ? '#8a7c6a' : '#c49a68');
            });
          });
        }
        if (false && id === 'common-toad') {
          // The tree-frog asset has the right squat silhouette and folded legs;
          // remap its green/cream palette to a toad's olive/buff skin.
          model.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (!material) return;
              if (material.map?.image) {
                const image = material.map.image;
                const canvas = document.createElement('canvas');
                canvas.width = image.width; canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = pixels.data;
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i], g = data[i + 1], b = data[i + 2];
                  let color;
                  if (g > r && g > b) color = [95, 92, 56];
                  else if (r < 45 && g < 45 && b < 45) color = [52, 48, 31];
                  else if (r > 180 && g > 160) color = [189, 178, 144];
                  else color = [116, 106, 68];
                  data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = 255;
                }
                ctx.putImageData(pixels, 0, 0);
                const remapped = new THREE.CanvasTexture(canvas);
                remapped.colorSpace = THREE.SRGBColorSpace;
                remapped.flipY = material.map.flipY; remapped.wrapS = material.map.wrapS; remapped.wrapT = material.map.wrapT;
                material.map = remapped;
              }
              if (material.color) material.color.set('#ffffff');
              if ('roughness' in material) material.roughness = .92;
              if ('metalness' in material) material.metalness = 0;
              material.needsUpdate = true;
            });
          });
        }
        if (false && id === 'hippopotamus') {
          model.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (!material) return;
              if (material.map?.image) {
                const image = material.map.image;
                const canvas = document.createElement('canvas');
                canvas.width = image.width; canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = pixels.data;
                for (let i = 0; i < data.length; i += 4) {
                  const lum = .299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2];
                  const v = lum < 45 ? 48 : lum < 125 ? 108 : 172;
                  data[i] = v + 6; data[i + 1] = v + 2; data[i + 2] = v; data[i + 3] = 255;
                }
                ctx.putImageData(pixels, 0, 0);
                const remapped = new THREE.CanvasTexture(canvas);
                remapped.colorSpace = THREE.SRGBColorSpace;
                remapped.flipY = material.map.flipY; remapped.wrapS = material.map.wrapS; remapped.wrapT = material.map.wrapT;
                material.map = remapped;
              }
              if (material.color) material.color.set('#ffffff');
              if ('roughness' in material) material.roughness = .78;
              if ('metalness' in material) material.metalness = 0;
              if ('flatShading' in material) material.flatShading = false;
              if (object.geometry) object.geometry.computeVertexNormals();
              material.needsUpdate = true;
            });
          });
        }
        if (false && (id === 'gorilla' || id === 'chimpanzee')) {
          // These two assets use a 2×2 palette atlas; the original black ramp
          // disappears against the dark stage. Remap the atlas to a readable
          // fur/skin ramp while keeping the same UV layout.
          model.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (!material) return;
              if (material.map?.image) {
                const image = material.map.image;
                const canvas = document.createElement('canvas');
                canvas.width = image.width; canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = pixels.data;
                for (let i = 0; i < data.length; i += 4) {
                  const lum = .299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2];
                  let color;
                  if (id === 'gorilla') color = lum < 40 ? [48, 44, 40] : lum < 120 ? [92, 84, 76] : [166, 156, 144];
                  else color = lum < 35 ? [62, 46, 32] : lum < 110 ? [126, 88, 58] : [198, 154, 112];
                  data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = 255;
                }
                ctx.putImageData(pixels, 0, 0);
                const remapped = new THREE.CanvasTexture(canvas);
                remapped.colorSpace = THREE.SRGBColorSpace;
                remapped.flipY = material.map.flipY; remapped.wrapS = material.map.wrapS; remapped.wrapT = material.map.wrapT;
                material.map = remapped;
              }
              if (material.color) material.color.set('#ffffff');
              if ('roughness' in material) material.roughness = .94;
              if ('metalness' in material) material.metalness = 0;
              material.needsUpdate = true;
            });
          });
        }
        const tones = {
          'common-toad': {brownScale: '#6b5030', tanScale: '#5c4527'},
          'harbor-seal': {grey: '#5f6d68', cream: '#c6cec8'},
          'blue-whale': {blue: '#4f6b79', cream: '#b9c5c9', dark: '#4a626e'},
          'sperm-whale': {blue: '#4b423d', cream: '#b6aaa0', dark: '#453d37'},
          cod: {navy: '#6d7462', orange: '#77785f', ivory: '#d0cbb0', metal: '#97a08c', rubber: '#2a2d26'},
          brachiosaurus: {olive: '#596b43', cream: '#b9b49a'},
          hippopotamus: {hippoPink: '#8b7b73', hippoGrey: '#77706a'}
        }[id];
        if (tones) {
          model.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (!material?.color) return;
              const tint = tones[material.name];
              if (tint) material.color.set(tint);
              if ('roughness' in material) material.roughness = Math.max(.72, material.roughness ?? .7);
              if ('metalness' in material) material.metalness = 0;
              material.needsUpdate = true;
            });
          });
        }
        // 这套蟾蜍资产的 tanScale 网格是一排独立疣粒，颜色融合后仍像珠子；
        // 直接隐藏它，保留棕色主体的宽体、金眼和四肢，轮廓更像真实蟾蜍。
        if (id === 'common-toad') {
          model.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            if (materials.some((material) => material?.name === 'tanScale')) object.visible = false;
          });
        }
      }
    });
    slot.rotation.y = layout.rotation ?? Math.PI / 2;
    slot.rotation.x = layout.tiltX ?? 0;
    slot.position.y = layout.y ?? .04;
  }
  guide(g, 'x', -.78);
  return g;
}
