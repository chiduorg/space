import * as THREE from 'three';
import {createTextureStore} from '/engine/renderer/assets.js';
import {entryKey} from '/engine/content/presentation.js';
import {currentTheme,watchTheme} from '/engine/renderer/theme.js';
import {createSpatialObject} from './object-templates.js';
import {createFeaturedOverride} from './featured-overrides.js';
import {attachExternalModel} from './external-models.js';
import {createEarth,createPlanet,createSun,createSaturnRing,radialTexture} from '/engine/renderer/astro.js';
import {standard,organic,metal} from '/engine/renderer/materials.js';
let seed=74;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const sphere=new THREE.SphereGeometry(1,128,96);
const textures=createTextureStore({invalidate:()=>invalidate()});
let invalidate=()=>{};
export function setModelInvalidation(callback){invalidate=callback;}
function texture(name,color=true){return textures.load(name,{color});}
const mat=(color,extra={})=>standard(color,extra);
const mesh=(geo,material)=>new THREE.Mesh(geo,material);
const sunDirection=new THREE.Vector3(-.9,.6,1.5).normalize();
const load=(name,color=true)=>texture(name,color);
function earth(){const root=createEarth(load,{sunDirection,radius:1,detail:1.15});root.rotation.set(0,-.8,.12);return root;}
const softDot=radialTexture(128)||null;
function glow(color,size,opacity=.4){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:softDot,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(size,size,1);return s;}
function galaxy(){
  // 四旋臂 + 中央棒状核球 + 尘埃带的三层点云；用加性软点代替硬像素点。
  const root=new THREE.Group(),positions=[],colors=[];
  for(let i=0;i<18000;i++){
    const r=Math.pow(random(),1.18),arm=(i%4)/4*Math.PI*2+r**.58*6.0;
    const scatter=(random()+random()+random()-1.5)*(.20+r*.34);
    const angle=arm+scatter+(i%13===0?(random()-.5)*1.8:0);
    positions.push(Math.cos(angle)*r,(random()-.5)*.045*(1-r*.8),Math.sin(angle)*r);
    const color=new THREE.Color().setHSL(.60-(1-r)**3*.44,.30+random()*.28,.36+random()*.34);
    colors.push(color.r,color.g,color.b);
  }
  // 核球：略扁的椭球，偏暖黄，和旋臂分开。
  for(let i=0;i<2600;i++){
    const a=random()*Math.PI*2,u=random()*2-1,r=Math.pow(random(),.62)*.24,v=Math.sqrt(1-u*u);
    positions.push(Math.cos(a)*v*r*.9,u*r*.4,Math.sin(a)*v*r*.9);
    const color=new THREE.Color().setHSL(.10+random()*.03,.48,.46+random()*.3);
    colors.push(color.r,color.g,color.b);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const core=glow(0xffd9a2,.9,.5);core.position.y=.02;
  root.add(
    new THREE.Points(geo,new THREE.PointsMaterial({map:softDot,size:1.35,vertexColors:true,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending})),
    new THREE.Points(geo,new THREE.PointsMaterial({map:softDot,size:5.8,vertexColors:true,transparent:true,opacity:.028,depthWrite:false,blending:THREE.AdditiveBlending})),
    core
  );
  // 棒状核球：三个叠加暖光把中心从「空洞」填成银河的黄色核心。
  for(const x of [-.22,0,.22]){const bar=glow(0xffc978,.42,.42);bar.position.set(x,.01,0);root.add(bar);}
  const tilted=new THREE.Group();root.rotation.x=.92;root.rotation.z=.18;tilted.add(root);return tilted;
}
export function createObject(entry){
  if(!Number.isFinite(entry.quantity?.value)||entry.quantity.value<=0)throw new Error('该条目没有可比较的空间长度');
  const override=createFeaturedOverride(entry);if(override)return override;
  if(entry.visual?.scene==='space.object')return createSpatialObject(entry,entry.visual);
  if(entryKey(entry)==='sand-grain')return createSpatialObject(entry,entry.visual);
  const group=new THREE.Group(),id=entryKey(entry);
  if(id==='earth')group.add(earth());
  else if(['moon','jupiter','saturn','mercury','venus','mars','uranus','neptune'].includes(id)){
    group.add(createPlanet(id,load,{detail:1.2}));
    if(id==='saturn')group.add(createSaturnRing(load,{inner:1.24,outer:1.9}));
    group.userData.framePadding=id==='saturn'?.62:id==='jupiter'?.44:id==='moon'?.45:.36;
    group.userData.frameSize={x:2,y:2,z:2};
  }
  else if(id==='sun'){group.add(createSun({radius:1,hot:'#ffb43c',cool:'#c22600',intensity:1.0,map:load('sun.jpg'),tint:'#fff2d8'}),glow(0xff7624,3.4,.55),glow(0xffac54,2.4,.32));group.userData.framePadding=.46;group.userData.frameSize={x:2,y:2,z:2};}
  else if(id==='milky-way')group.add(galaxy());
  else if(id==='observable-universe'){const positions=[],colors=[];for(let i=0;i<7500;i++){const a=random()*Math.PI*2,u=random()*2-1,r=Math.cbrt(random()),v=Math.sqrt(1-u*u);positions.push(Math.cos(a)*v*r,u*r,Math.sin(a)*v*r);const c=new THREE.Color().setHSL(.52+random()*.16,.3,.5+random()*.4);colors.push(c.r,c.g,c.b);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));group.add(new THREE.Points(g,new THREE.PointsMaterial({map:softDot,size:1.9,transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending})),mesh(sphere,new THREE.MeshBasicMaterial({color:0x6085a6,transparent:true,opacity:.025,wireframe:true})));}
  else if(id==='solar-system'){group.add(mesh(new THREE.SphereGeometry(.025,24,24),new THREE.MeshBasicMaterial({color:0xffd497})),glow(0xffc56d,.2,.8));for(let i=1;i<9;i++){const points=[],r=(i/9)**1.3;for(let j=0;j<180;j++){const a=j/180*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r));}group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x57687f,transparent:true,opacity:.55})));const a=i*1.75,p=mesh(new THREE.SphereGeometry(i<5?.008:.016,16,12),mat(i<5?'#b9aa92':'#beb09f'));p.position.set(Math.cos(a)*r,0,Math.sin(a)*r);group.add(p);}const tilted=new THREE.Group();group.rotation.x=.5;group.rotation.z=.15;tilted.add(group);return tilted;}
  else if(id==='dna'){
    // B-DNA 双螺旋的分子尺度重建：2 nm 直径、10.5 个碱基对/圈、0.34 nm 上升距离。
    // 骨架用糖-磷酸链的管状轮廓，碱基对按 A–T / G–C 双色分开，保留大沟和小沟的节奏。
    const radius=.34,bp=14,rise=.116,twist=Math.PI*2/10.5,height=(bp-1)*rise;
    const strands=[[],[]],nodes=[];
    for(let i=0;i<bp;i++){
      const angle=i*twist,y=i*rise-height/2;
      for(let side=0;side<2;side++){
        const a=angle+side*Math.PI;
        const p=new THREE.Vector3(Math.cos(a)*radius,y,Math.sin(a)*radius);
        strands[side].push(p);
        if(side===0)nodes.push(p);
      }
    }
    const strandColors=['#79c6cf','#d8ab7d'];
    const backboneMaterial=[0x79c6cf,0xd8ab7d].map(color=>new THREE.MeshPhysicalMaterial({color,roughness:.32,metalness:.18,clearcoat:.4,clearcoatRoughness:.35,envMapIntensity:1.1}));
    strands.forEach((points,i)=>group.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),220,.019,10,false),backboneMaterial[i])));
    // 每个核苷酸的磷酸-糖节点，给骨架真实的“串珠”质感。
    strands.forEach((points,side)=>points.forEach((p,i)=>{
      const bead=mesh(new THREE.SphereGeometry(.015,12,8),backboneMaterial[(i+side)%2]);
      bead.position.copy(p);group.add(bead);
    }));
    // 碱基对：两条链之间分成两半，靠中间留一条很窄的氢键缝；颜色区分嘌呤/嘧啶。
    const baseColors=[0xc9a8ce,0xd9c096];
    for(let i=0;i<bp;i++){
      const a=strands[0][i],b=strands[1][i],mid=a.clone().add(b).multiplyScalar(.5),dir=b.clone().sub(a),half=dir.clone().multiplyScalar(.5);
      for(const side of [-1,1]){
        const end=mid.clone().add(half.clone().multiplyScalar(side));
        const start=mid.clone().add(half.clone().multiplyScalar(side*.2));
        const length=start.distanceTo(end);
        const rung=mesh(new THREE.CylinderGeometry(.011,.011,length,8),new THREE.MeshPhysicalMaterial({color:baseColors[side>0?0:1],roughness:.4,metalness:.06,clearcoat:.25,clearcoatRoughness:.4}));
        rung.position.copy(start).add(end).multiplyScalar(.5);
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());
        group.add(rung);
      }
    }
    group.userData.framePadding=.5;group.userData.frameSize={x:.78,y:1.9,z:.78};group.userData.offsetY=-.1;
  }
  else if(id==='cell'){
    // CC0 解剖教学模型：切片式细胞，含核、线粒体、高尔基体与内质网。
    // 运行时把教材式高饱和贴图降饱和并压暗，得到更接近显微制样/医学影像的细胞配色。
    const placeholder=mesh(new THREE.SphereGeometry(1,32,24),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    group.add(placeholder,glow(0x9db9c4,2.2,.03));
    attachExternalModel(group,'https://static.chidu.org/media/models/cell-real.glb',{fit:2.15,onReady:(model)=>{
      group.remove(placeholder);
      model.traverse(object=>{
        if(!object.isMesh) return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        materials.forEach(material=>{
          if(!material) return;
          if(material.map?.image){
            const source=material.map,image=source.image;
            const width=image.width||1024,height=image.height||1024;
            const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
            const ctx=canvas.getContext('2d');
            ctx.drawImage(image,0,0,width,height);
            // 把教材原画的糖果色按 H&E/显微制样口径重映射为低饱和的灰蓝、赭红、灰紫与灰绿，
            // 同时保留原贴图的明暗，避免简单去饱和后脏器颜色混成一片。
            const pixels=ctx.getImageData(0,0,width,height),data=pixels.data;
            const palette={orange:[142,90,76],yellow:[168,155,128],green:[126,143,131],blue:[158,168,170],purple:[105,89,108],red:[140,92,92],gray:[184,180,170]};
            for(let i=0;i<data.length;i+=4){
              const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
              const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
              const s=max===0?0:delta/max;
              let key='gray';
              if(s>=.12){
                let h;
                if(delta===0) h=0;
                else if(max===r) h=((g-b)/delta)%6;
                else if(max===g) h=(b-r)/delta+2;
                else h=(r-g)/delta+4;
                h*=60;if(h<0)h+=360;
                if(h<15||h>=345)key='red';
                else if(h<45)key='orange';
                else if(h<80)key='yellow';
                else if(h<165)key='green';
                else if(h<255)key='blue';
                else key='purple';
              }
              const tint=palette[key],lum=.299*r+.587*g+.114*b,k=.34+.92*lum;
              data[i]=Math.min(255,tint[0]*k);data[i+1]=Math.min(255,tint[1]*k);data[i+2]=Math.min(255,tint[2]*k);
            }
            ctx.putImageData(pixels,0,0);
            const graded=new THREE.CanvasTexture(canvas);
            graded.colorSpace=THREE.SRGBColorSpace;
            graded.flipY=source.flipY;graded.wrapS=source.wrapS;graded.wrapT=source.wrapT;
            graded.repeat.copy(source.repeat);graded.offset.copy(source.offset);
            graded.center.copy(source.center);graded.rotation=source.rotation;
            graded.anisotropy=4;graded.needsUpdate=true;
            material.map=graded;
          }
          if('roughness' in material) material.roughness=.7;
          if('metalness' in material) material.metalness=0;
          if('clearcoat' in material){material.clearcoat=.06;material.clearcoatRoughness=.7;}
          if('envMapIntensity' in material) material.envMapIntensity=.35;
          material.needsUpdate=true;
        });
      });
    }});
    group.userData.framePadding=.642;group.userData.motionRate=.012;
  }
  else if(id==='virus'){
    // 流感病毒颗粒的拟真重建：致密脂质包膜 + 血凝素 HA / 神经氨酸酶 NA / M2 三类表面糖蛋白，
    // 内部保留 8 段核糖核蛋白复合物（RNP），但只在包膜下留下很淡的暗纹。
    // 尺度按 100 nm 典型流感病毒颗粒拟合；蛋白冠呈短棒状、密集分布，不是装饰化的长钉。
    const group=new THREE.Group();
    // 脂质包膜的微观斑驳纹理：低对比的膜蛋白/脂筏色块，避免纯色塑料球。
    const surfaceTexture=(()=>{
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#3f4b47';ctx.fillRect(0,0,1024,512);
      let seed=9137;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<820;i++){
        const x=rnd()*1024,y=rnd()*512,r=6+rnd()*34,light=rnd()>.52;
        const g=ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,light?'rgba(150,162,155,.09)':'rgba(34,44,41,.12)');
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      }
      for(let i=0;i<2600;i++){
        const x=rnd()*1024,y=rnd()*512,s=1+rnd()*2.2,light=rnd()>.55;
        ctx.fillStyle=light?'rgba(164,174,166,.13)':'rgba(28,38,35,.14)';
        ctx.fillRect(x,y,s,s);
      }
      const tex=new THREE.CanvasTexture(canvas);
      tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;
      return tex;
    })();
    const envelopeGeo=new THREE.SphereGeometry(1,160,112),pos=envelopeGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const n=.010*Math.sin(x*7.3+y*5.1)*Math.sin(z*6.2-y*3.7)+.004*Math.sin(x*19+y*15+z*13);
      const len=Math.sqrt(x*x+y*y+z*z)||1;pos.setXYZ(i,x*(1+n)/len,y*(1+n)/len,z*(1+n)/len);
    }
    envelopeGeo.computeVertexNormals();
    const envelopeMaterial=new THREE.MeshPhysicalMaterial({
      map:surfaceTexture,color:0xffffff,roughness:.78,metalness:.02,transparent:false,opacity:1,
      side:THREE.DoubleSide,depthWrite:true,clearcoat:.04,clearcoatRoughness:.8,
      bumpMap:surfaceTexture,bumpScale:.03,envMapIntensity:.45
    });
    const envelope=mesh(envelopeGeo,envelopeMaterial);
    envelope.renderOrder=3;group.add(envelope);
    // 包膜内侧的基质蛋白薄层，让包膜有真实厚度；内部 RNP 只留暗影。
    const matrixLayer=mesh(new THREE.SphereGeometry(.925,128,90),new THREE.MeshStandardMaterial({color:0x394743,roughness:.8,metalness:.01,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
    matrixLayer.renderOrder=2;group.add(matrixLayer);
    const rnpColors=['#4b4447','#414d4e','#554a41','#45514a'];
    for(let i=0;i<8;i++){
      const pts=[];const phase=i/8*Math.PI*2;
      for(let j=0;j<36;j++){
        const t=j/35,r=.13+.36*Math.sin(Math.PI*t),a=phase+t*7.2;
        pts.push(new THREE.Vector3(Math.cos(a)*r, -.37+t*.74, Math.sin(a)*r*.66));
      }
      group.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),80,.008,7,false),new THREE.MeshStandardMaterial({color:rnpColors[i%rnpColors.length],roughness:.78,metalness:.01,transparent:true,opacity:.34})));
    }
    // 包膜表面细密颗粒，打破光滑塑料感。
    const bumps=new THREE.InstancedMesh(new THREE.SphereGeometry(.0065,8,6),new THREE.MeshStandardMaterial({color:0x4c5a55,roughness:.74,metalness:.02}),980),matrix=new THREE.Matrix4();
    for(let i=0;i<980;i++){
      const a=Math.PI*(3-Math.sqrt(5))*i,y=1-(i/979)*2,r=Math.sqrt(1-y*y);
      const p=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
      matrix.makeTranslation(p.x*1.006,p.y*1.006,p.z*1.006);bumps.setMatrixAt(i,matrix);
    }
    group.add(bumps);
    // HA / NA / M2：短棒状糖蛋白，头部沿径向拉长，颜色低饱和，随机高度与朝向制造真实蛋白冠的蓬松感。
    const haCount=700,naCount=130,m2Count=72,up=new THREE.Vector3(0,1,0);
    const haStems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0036,.006,.095,7),new THREE.MeshStandardMaterial({color:0x6b635b,roughness:.7,metalness:.02}),haCount);
    const haHeads=new THREE.InstancedMesh(new THREE.SphereGeometry(.015,12,8),new THREE.MeshStandardMaterial({color:0x8d7b6e,roughness:.7,metalness:.02}),haCount);
    const naStems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.004,.007,.075,6),new THREE.MeshStandardMaterial({color:0x99845f,roughness:.52,metalness:.06}),naCount);
    const naHeads=new THREE.InstancedMesh(new THREE.BoxGeometry(.032,.013,.030),new THREE.MeshStandardMaterial({color:0x817868,roughness:.7,metalness:.07}),naCount);
    const m2Stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.003,.005,.05,6),new THREE.MeshStandardMaterial({color:0x6f837f,roughness:.6,metalness:.03}),m2Count);
    const q=new THREE.Quaternion(),tilt=new THREE.Quaternion(),euler=new THREE.Euler(),posV=new THREE.Vector3(),scaleV=new THREE.Vector3(),headV=new THREE.Vector3();
    const rand=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);};
    const placeSpike=(idx,count,stems,heads,baseLength,stemGeometryLength,headScale,phaseOffset,flat)=>{
      const a=Math.PI*(3-Math.sqrt(5))*(idx+phaseOffset),y=1-(idx/(count-1))*2,r=Math.sqrt(1-y*y);
      const p=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
      q.setFromUnitVectors(up,p);
      euler.set((rand(idx)-.5)*.26,(rand(idx+count)-.5)*.26,(rand(idx+count*2)-.5)*.26);
      tilt.setFromEuler(euler);q.multiply(tilt);
      const stemLength=baseLength*(.82+rand(idx+37)*.38);
      posV.copy(p).multiplyScalar(1.018+stemLength*.5);
      matrix.compose(posV,q,scaleV.set(1,stemLength/stemGeometryLength,1));stems.setMatrixAt(idx,matrix);
      headV.copy(p).multiplyScalar(1.018+stemLength);
      const hs=headScale*(.78+rand(idx+191)*.30);
      matrix.compose(headV,q,scaleV.set(hs*(flat?.9:.8),hs*(flat?.34:1.35),hs*(flat?.9:.8)));heads.setMatrixAt(idx,matrix);
    };
    for(let i=0;i<haCount;i++)placeSpike(i,haCount,haStems,haHeads,.112,.105,.7,0,false);
    for(let i=0;i<naCount;i++)placeSpike(i,naCount,naStems,naHeads,.035,.035,.86,haCount*.37,true);
    for(let i=0;i<m2Count;i++){
      const a=Math.PI*(3-Math.sqrt(5))*(i+naCount*.71),y=1-(i/(m2Count-1))*2,r=Math.sqrt(1-y*y);
      const p=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);q.setFromUnitVectors(up,p);
      matrix.compose(p.clone().multiplyScalar(1.008),q,scaleV.set(1,1,1));m2Stems.setMatrixAt(i,matrix);
    }
    group.add(haStems,haHeads,naStems,naHeads,m2Stems);
    group.userData.framePadding=.58;group.userData.motionRate=.012;
    group.userData.spinPath=[];group.userData.kind='virus';
    group.userData.reference={start:[-1,0,0],end:[1,0,0],length:2,axis:'x',kind:'virion-diameter'};
    return group;
  }
  else if(id==='atom'){
    // 氢原子基态：单个质子 + 1s 球对称电子概率云。1s 没有瓣状结构，
    // 因此不画常见的 2p 哑铃形“轨道图标”；点云只表达径向概率密度和量子涨落。
    const group=new THREE.Group();
    const nucleus=mesh(new THREE.SphereGeometry(.018,40,30),new THREE.MeshPhysicalMaterial({color:0xff8d6b,roughness:.3,metalness:.12,clearcoat:.55,clearcoatRoughness:.3,emissive:0xff5a30,emissiveIntensity:.5,envMapIntensity:1.1,depthTest:false}));
    nucleus.renderOrder=8;
    group.add(nucleus,glow(0xff9d7a,.09,.2),glow(0xffc4a8,.26,.055));
    const cloudPoints=[],cloudColors=[],cloudSizes=[];
    const baseColor=new THREE.Color(0x83c6ea);
    // 24,000 个采样点：径向按 1s 的 exp(-r/a0) 概率衰减，方向在球面上均匀分布。
    for(let i=0;i<24000;i++){
      const u=random()*2-1,a=random()*Math.PI*2,r=Math.min(1.58,-.52*Math.log(random()+.0001)),v=Math.sqrt(1-u*u);
      const c=baseColor.clone().offsetHSL((random()-.5)*.03,(random()-.5)*.06,(random()-.5)*.10);
      cloudPoints.push(Math.cos(a)*v*r,u*r,Math.sin(a)*v*r);
      cloudColors.push(c.r,c.g,c.b);
      cloudSizes.push(.9+random()*2.0);
    }
    function quantumPoints(position,color,size,opacity){
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
      geo.setAttribute('aColor',new THREE.Float32BufferAttribute(color,3));
      geo.setAttribute('aSize',new THREE.Float32BufferAttribute(size,1));
      const material=new THREE.ShaderMaterial({
        uniforms:{map:{value:softDot},opacity:{value:opacity},pixelRatio:{value:Math.min((typeof window!=='undefined'?window.devicePixelRatio:1)||1,2)}},
        vertexShader:`attribute vec3 aColor; attribute float aSize; varying vec3 vColor; uniform float pixelRatio;
          void main(){vColor=aColor;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*pixelRatio;gl_Position=projectionMatrix*mv;}`,
        fragmentShader:`uniform sampler2D map; uniform float opacity; varying vec3 vColor;
          void main(){vec4 t=texture2D(map,gl_PointCoord);float soft=1.0-smoothstep(.28,.5,length(gl_PointCoord-vec2(.5)));gl_FragColor=vec4(vColor,t.a*soft*opacity);}`,
        transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending
      });
      const points=new THREE.Points(geo,material);points.renderOrder=5;return points;
    }
    const cloud=quantumPoints(cloudPoints,cloudColors,cloudSizes,.62);
    const halo=quantumPoints(cloudPoints,cloudColors,cloudSizes.map(v=>v*4.2),.05);
    group.add(cloud,halo);
    group.userData.framePadding=.56;group.userData.frameSize={x:3.15,y:3.15,z:3.15};
    group.userData.update=(delta,elapsed)=>{cloud.rotation.y=elapsed*.055;halo.rotation.y=elapsed*.055;nucleus.rotation.y=elapsed*.15;};
    return group;
  }
  else if(id==='human'){
    // Grab3D 全质量 CC0 人体：262,348 三角面，源贴图 4K、网页版压到 2K，1.80 m A-pose。
    // 直接使用真实感 PBR 材质，不做单色雕塑化处理；按条目口径缩放到 1.70 m。
    const group=new THREE.Group();
    const placeholder=mesh(new THREE.BoxGeometry(.62,1.7,.34),new THREE.MeshBasicMaterial({visible:false}));
    group.add(placeholder);
    attachExternalModel(group,'https://static.chidu.org/media/models/human-real.glb',{fit:1.7,axis:'y',onReady:()=>{
      group.remove(placeholder);
      const shadow=new THREE.Mesh(
        new THREE.PlaneGeometry(1.05,.58),
        new THREE.MeshBasicMaterial({map:softDot,color:0x000000,transparent:true,opacity:.26,depthWrite:false})
      );
      shadow.rotation.x=-Math.PI/2;
      shadow.position.y=-.848;
      shadow.renderOrder=1;
      group.add(shadow);
    }});
    group.userData.framePadding=.36;
    group.userData.reference={start:[0,-.85,0],end:[0,.85,0],length:1.7,axis:'y',kind:'chosen-reference-height'};
    return group;
  }
  else{group.add(mesh(id==='sand-grain'?new THREE.IcosahedronGeometry(1,2):sphere,mat(id==='sand-grain'?'#d1bda0':'#92a9c7',{roughness:id==='sand-grain'?.95:.3,metalness:.15})));if(id==='planck'||id==='proton')group.add(glow(0x9db6ff,2.8,.3));}
  const wrapper=new THREE.Group();wrapper.add(group);
  wrapper.userData.motionRate=id==='earth'?.045:id==='sun'?.012:id==='jupiter'?.055:id==='saturn'?.035:id==='milky-way'?.009:.018;
  wrapper.userData.framePadding=group.userData.framePadding;
  wrapper.userData.offsetY=group.userData.offsetY;
  wrapper.userData.frameSize=group.userData.frameSize;
  wrapper.userData.reference=group.userData.reference;
  if(id==='atom'&&typeof window!=='undefined')window.__atomWrapper=wrapper;
  wrapper.userData.spinPath=id==='earth'?[0,0]:[0];
  wrapper.userData.kind=id;
  wrapper.userData.update=group.userData.update;
  wrapper.userData.parameters=group.userData.parameters;
  return wrapper;
}
export function animateObject(model,delta){
  if(model.userData.update){model.userData.elapsed=(model.userData.elapsed||0)+delta;model.userData.update(delta,model.userData.elapsed);return;}
  if(!model.userData.motionRate)return;
  let target=model;
  for(const index of model.userData.spinPath)target=target.children[index];
  target.rotation.y+=delta*model.userData.motionRate;
  if(model.userData.kind==='earth'&&target.children[1])target.children[1].rotation.y+=delta*.008;
}
export function decorateScene(scene){
  const ambient=new THREE.AmbientLight(0x94a7cb,.32);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xfff5e7,3.1);key.position.copy(sunDirection.clone().multiplyScalar(10));scene.add(key);
  const fill=new THREE.DirectionalLight(0x6e95e5,.12);fill.position.set(5,-2,-7);scene.add(fill);
  const p=[],colors=[];for(let i=0;i<1200;i++){p.push((random()-.5)*65,(random()-.5)*65,-18-random()*15);const c=new THREE.Color().setHSL(.56+random()*.1,.1+random()*.2,.25+random()*.55);colors.push(c.r,c.g,c.b);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const dust=new THREE.Points(g,new THREE.PointsMaterial({map:softDot,vertexColors:true,size:1.25,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);
  const apply=theme=>{
    const light=theme==='light';
    ambient.color.set(light?0xffffff:0x94a7cb);ambient.intensity=light?.72:.32;
    key.color.set(light?0xffe9cf:0xfff5e7);key.intensity=light?2.35:3.1;
    fill.color.set(light?0xcfe2f2:0x6e95e5);fill.intensity=light?1.1:.12;
    dust.material.blending=light?THREE.NormalBlending:THREE.AdditiveBlending;
    dust.material.opacity=light?.2:.6;dust.material.color.set(light?0x61798a:0xffffff);
  };
  apply(currentTheme());
  const stop=watchTheme(apply);
  scene.userData.stopSpaceTheme=stop;
  return apply;
}


