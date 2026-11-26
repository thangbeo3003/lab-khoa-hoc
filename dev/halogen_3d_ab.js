import * as T from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { newTube, add, look, DROP_ML } from '../src/free/tubechem.js';

const $ = id => document.getElementById(id);
const pane = $('scene'), canvas = pane.querySelector('canvas');
const scene = new T.Scene();
scene.background = new T.Color('#f1f3ef');
scene.fog = new T.Fog(scene.background, 16, 38);
const renderer = new T.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
const camera = new T.PerspectiveCamera(33, 1, .1, 90);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, {
  enablePan: false, enableDamping: true, dampingFactor: .16, rotateSpeed: .66, zoomSpeed: .72,
  minPolarAngle: .24, maxPolarAngle: 1.52,
});
controls.mouseButtons.RIGHT = T.MOUSE.ROTATE;
controls.addEventListener('start',()=>canvas.style.cursor='grabbing');
controls.addEventListener('end',()=>canvas.style.removeProperty('cursor'));
const homeTarget = new T.Vector3(0, 2.05, 0);
const homeDirection = new T.Vector3(.30, .34, 1).normalize();
let homeDistance = 10;
function homeView() {
  // Consume any residual orbit motion before restoring the exact front view.
  controls.enableDamping = false;
  controls.update();
  controls.target.copy(homeTarget);
  camera.position.copy(homeDirection).multiplyScalar(homeDistance).add(homeTarget);
  controls.update();
  controls.enableDamping = true;
}
homeView();
scene.add(new T.HemisphereLight(0xf8fbff,0xb9c1be,1.8));
const sun = new T.DirectionalLight(0xfff6ea,1.85);
sun.position.set(-4,9,6); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-8,right:8,top:6,bottom:-6});
sun.shadow.normalBias=.018;scene.add(sun);
const mat=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.57,...options});
const metal=mat('#4a626d',{metalness:.32}), edge=mat('#283943'), wood=mat('#995222'), ivory=mat('#fcfaf3');
const glass=mat('#bad9df',{transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide});
function mesh(parent,geo,material,x=0,y=0,z=0){
  const obj=new T.Mesh(geo,material);obj.position.set(x,y,z);obj.castShadow=!material.transparent;obj.receiveShadow=!material.transparent;parent.add(obj);return obj;
}
function cylinder(group,rt,rb,height,m,x,y,z){
  return mesh(group,new T.CylinderGeometry(rt,rb,height,48),m,x,y,z);
}
function ring(group,r,thickness,m,x,y,z){
  const obj=mesh(group,new T.TorusGeometry(r,thickness,10,64),m,x,y,z);obj.rotation.x=Math.PI/2;return obj;
}
function profile(group,points,m){
  return mesh(group,new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),64),m);
}
const floor=mesh(scene,new T.PlaneGeometry(100,100),mat('#d8dfdb'));floor.rotation.x=-Math.PI/2;
const grid=new T.GridHelper(40,80,0x9daeb1,0xadbdbb);grid.position.y=.004;grid.material.transparent=true;grid.material.opacity=.30;scene.add(grid);
const anchors=[], hitObjects=[];
function anchor(text,x,y,z){
  const el=document.createElement('span');el.className='anchor';el.textContent=text;el.dataset.part=String(anchors.length+1).padStart(2,'0');$('anchors').append(el);
  const leader = document.createElement('i');
  leader.className = 'leader';
  $('anchors').append(leader);
  anchors.push({el,leader,point:new T.Vector3(x,y,z),projected:new T.Vector3()});return el;
}
function hitArea(key,x,y,z,r,h){
  const hit=cylinder(scene,r,r,h,new T.MeshBasicMaterial({visible:false}),x,y,z);
  hit.castShadow=hit.receiveShadow=false;hit.userData.key=key;hitObjects.push(hit);
}
const refX=-.59, expX=.65, rackZ=.32;
function plate(y,holes){
  const path=new T.Shape();
  const w=1.38,h=.49,c=.08;
  path.moveTo(-w+c,-h);path.lineTo(w-c,-h);path.quadraticCurveTo(w,-h,w,-h+c);
  path.lineTo(w,h-c);path.quadraticCurveTo(w,h,w-c,h);path.lineTo(-w+c,h);path.quadraticCurveTo(-w,h,-w,h-c);
  path.lineTo(-w,-h+c);path.quadraticCurveTo(-w,-h,-w+c,-h);
  if(holes) for(const x of [refX,expX]){const hole=new T.Path();hole.absarc(x,0,.31,0,Math.PI*2,true);path.holes.push(hole);}
  const obj=mesh(scene,new T.ExtrudeGeometry(path,{depth:.09,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:2,curveSegments:28}),wood,0,y,rackZ);obj.rotation.x=-Math.PI/2;
  const rim = new T.LineSegments(new T.EdgesGeometry(obj.geometry, 36),
    new T.LineBasicMaterial({color:'#4d524e',transparent:true,opacity:.58}));
  obj.add(rim);
}
plate(.12,false);plate(1.17,true);
for(const x of [-1.23,1.23])for(const z of [rackZ-.34,rackZ+.34])cylinder(scene,.045,.045,1.15,metal,x,.67,z);
const tubes={}, bottles={};
function makeTube(key,x,title){
  const g=new T.Group();g.position.set(x,.27,rackZ);scene.add(g);
  profile(g,[[.012,0],[.14,.045],[.225,.16],[.247,.27],[.247,2.55]],glass).renderOrder=3;
  ring(g,.248,.018,metal,0,2.55,0);
  ring(g,.233,.010,metal,0,2.50,0);
  cylinder(g,.009,.009,2.18,new T.MeshBasicMaterial({color:'#ebf8fa'}),-.19,1.36,.145);
  for(let i=0;i<6;i++){
    const tick=mesh(g,new T.BoxGeometry(i%2?.085:.135,.012,.008),edge,.07,.52+i*.31,.229);
    tick.rotation.y=.25;
  }
  const liquid=profile(g,[[.003,0],[.135,.045],[.221,.16],[.232,.26],[.232,1]],new T.MeshBasicMaterial({color:'#dae7e6',transparent:true,opacity:.75,depthWrite:false}));
  const meniscus=cylinder(g,.232,.232,.013,liquid.material,0,1,0);
  const selection=ring(g,.335,.024,mat('#168589'),0,2.56,0);selection.visible=false;
  hitArea(key,x,1.56,rackZ,.37,2.92);
  tubes[key]={liquid,meniscus,selection,x,label:anchor(title,x,1.98,rackZ+.247)};
}
makeTube('ref',refX,'Ống đối chứng');makeTube('exp',expX,'Ống thí nghiệm');
function makeBottle(key,x,name,color){
  const g=new T.Group();g.position.set(x,.02,-.10);scene.add(g);
  const isWater=key==='H2O';
  const body=mat(color,{roughness:.26,metalness:.12,transparent:isWater,opacity:isWater?.70:1,depthWrite:!isWater});
  profile(g,[[.01,.08],[.50,.08],[.56,.16],[.57,1.35],[.55,1.50],[.43,1.64],[.27,1.78],[.27,2.03]],body);
  ring(g,.27,.035,edge,0,1.95,0);
  const paper=cylinder(g,.576,.576,.72,ivory,0,.89,0);
  const sheet=document.createElement('canvas');sheet.width=512;sheet.height=256;
  const c=sheet.getContext('2d');c.fillStyle='#fff7df';c.fillRect(0,0,512,256);
  c.fillStyle=isWater?'#355f7e':'#79501f';c.fillRect(0,14,512,16);
  c.textAlign='center';c.font='bold 72px Georgia';c.fillText(isWater?'H₂O':'Cl₂',256,144);
  c.font='30px sans-serif';c.fillText(isWater?'NƯỚC CẤT':'NƯỚC CHLORINE',256,196);
  const tex=new T.CanvasTexture(sheet);tex.colorSpace=T.SRGBColorSpace;
  mesh(g,new T.CylinderGeometry(.58,.58,.70,48,1,true,-1.03,2.06),new T.MeshBasicMaterial({map:tex}),0,paper.position.y,0);
  const pip=new T.Group();g.add(pip);pip.position.y=1.98;
  profile(pip,[[.065,-1.3],[.07,-1.19],[.10,-1.10],[.10,-.12],[.13,0]],mat('#b8d2ce',{transparent:true,opacity:.78}));
  cylinder(pip,.315,.315,.27,edge,0,.09,0);
  for(let i=0;i<32;i++){const a=i*Math.PI/16;cylinder(pip,.012,.012,.22,metal,.314*Math.sin(a),.09,.314*Math.cos(a));}
  profile(pip,[[.20,.20],[.21,.31],[.15,.41],[.18,.56],[.17,.78],[.11,.90],[.002,.94]],edge);
  const outline=ring(g,.67,.022,mat('#117b80'),0,.045,0);
  hitArea(key,x,1.48,-.10,.64,2.94);
  bottles[key]={g,pip,outline,home:pip.position.clone(),name};
  anchor(name,x,.89,.48);
}
makeBottle('Cl2',-2.62,'Nước chlorine','#71330e');makeBottle('H2O',2.65,'Nước cất','#cededc');

let selected='Cl2', motion=null, drag=null, orbitOnly=false;
const ray=new T.Raycaster(), mouse=new T.Vector2();
const status=$('status');
function select(key){
  selected=key;
  for(const [id,b] of Object.entries(bottles))b.outline.visible=id===key;
  for(const btn of document.querySelectorAll('[data-source]'))btn.setAttribute('aria-pressed',String(btn.dataset.source===key));
}
function reset(){
  motion=null;drag=null;
  for(const bottle of Object.values(bottles))bottle.pip.position.copy(bottle.home);
  for(const tube of Object.values(tubes)){
    tube.data=newTube();add(tube.data,'NaBr',{mL:2});tube.count={Cl2:0,H2O:0};tube.selection.visible=false;tube.label.classList.remove('warn');
  }
  droplet.visible=false;select('Cl2');$('dose').value=20;$('amount').value=20;
  status.classList.remove('warn');
  status.textContent='Chọn lọ rồi chọn ống nhận.';renderValues();
}
const fmt=new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
function renderValues(){
  for(const [key,tube] of Object.entries(tubes)){
    const {hex,opacity}=look(tube.data),level=.29+.145*tube.data.vol;
    tube.liquid.scale.y=level;tube.meniscus.position.y=level;
    tube.liquid.material.color.set(hex);
    tube.liquid.material.opacity=.48+.50*opacity;
    $(key+'Value').textContent=fmt.format(tube.data.vol)+' mL · '+(tube.count.Cl2+tube.count.H2O)+' giọt';
  }
}
const droplet=mesh(scene,new T.SphereGeometry(.072,16,12),mat('#dcecf5',{roughness:.18}));
function reagentColor(id) {
  const sample=newTube();
  add(sample,id,{mL:DROP_ML,drop:true});
  return look(sample).hex;
}
function deliver(target){
  if(motion)return;
  const tube=tubes[target],b=bottles[selected],n=Number($('dose').value);
  if(tube.data.vol+n*DROP_ML>tube.data.cap+1e-9){status.textContent='Ống không còn đủ chỗ cho lượng đã chọn.';b.pip.position.copy(b.home);return;}
  const dest=new T.Vector3(tube.x,4.39,rackZ).sub(b.g.position);
  droplet.material.color.set(reagentColor(selected));
  motion={source:selected,target,n,b,from:b.pip.position.clone(),dest,elapsed:0,added:0};
  tube.selection.visible=true;
  status.textContent='Đang nhỏ '+b.name.toLowerCase()+' vào '+tube.label.textContent.toLowerCase()+'…';
}
function animateDose(dt){
  if(!motion)return;
  const m=motion,t=tubes[m.target];
  m.elapsed+=dt;
  const pourDuration=.25+.078*m.n,elapsed=m.elapsed-.6;
  if(elapsed<0){const k=Math.min(1,m.elapsed/.6);m.b.pip.position.lerpVectors(m.from,m.dest,k);m.b.pip.position.y+=.68*Math.sin(Math.PI*k);return;}
  const k=Math.min(1,elapsed/pourDuration);m.b.pip.position.copy(m.dest);
  const count=Math.floor(k*m.n);
  while(m.added<count){
    add(t.data,m.source,{mL:DROP_ML,drop:true});t.count[m.source]++;m.added++;
  }
  renderValues();
  droplet.visible=k<1;droplet.position.set(t.x,3.08-(k*m.n%1)*.48,rackZ);
  if(k<1)return;
  const back=Math.min(1,(elapsed-pourDuration)/.45);
  m.b.pip.position.lerpVectors(m.dest,m.b.home,back);m.b.pip.position.y+=.45*Math.sin(Math.PI*back);
  if(back<1)return;
  t.selection.visible=false;
  const ref=tubes.ref.count, exp=tubes.exp.count;
  const wrong=(m.target==='ref')!==(m.source==='H2O');
  status.classList.toggle('warn', Boolean(ref.Cl2||exp.H2O));
  if(wrong){t.label.classList.add('warn');status.textContent='Đã nhỏ vào '+t.label.textContent.toLowerCase()+'. Mẫu này đã nhận sai lọ. Bấm Làm lại để so sánh từ đầu.';}
  else if(ref.Cl2||exp.H2O)status.textContent='Có ống đã nhận sai lọ. Bấm Làm lại để lập cặp đối chứng mới.';
  else if(ref.H2O&&ref.H2O===exp.Cl2)status.textContent='Hai ống đã nhận cùng số giọt. Hãy so màu của ống thí nghiệm với ống đối chứng.';
  else status.textContent='Đã nhỏ '+m.n+' giọt vào '+t.label.textContent.toLowerCase()+'. Đối chiếu số giọt giữa hai ống.';
  motion=null;
}
function pick(e){
  const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
  ray.setFromCamera(mouse,camera);return ray.intersectObjects(hitObjects,false)[0]?.object.userData.key;
}
// Capture only a left-hand action on a reagent or tube. OrbitControls receives all camera gestures.
canvas.addEventListener('pointerdown',e=>{
  if (orbitOnly || motion || e.button!==0 || !e.isPrimary || drag) return;
  const key=pick(e);
  if (!key) return;
  e.stopImmediatePropagation();
  if (bottles[key]) select(key);
  drag={key,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
  canvas.setPointerCapture(e.pointerId);
},true);
canvas.onpointermove=e=>{
  if(!drag || e.pointerId!==drag.id)return;
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;
  if(!drag.moved || !bottles[drag.key])return;
  const target=pick(e),b=bottles[drag.key];
  const pos=new T.Vector3();const plane=new T.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new T.Vector3()),new T.Vector3(0,3.1,rackZ));
  ray.ray.intersectPlane(plane,pos);pos.y=T.MathUtils.clamp(pos.y+1.3,3.05,4.8);
  if(tubes[target])pos.set(tubes[target].x,4.39,rackZ);
  b.pip.position.copy(pos).sub(b.g.position);
  for(const [id,t] of Object.entries(tubes))t.selection.visible=id===target;
};
function cancelDrag(){
  if(drag && bottles[drag.key])bottles[drag.key].pip.position.copy(bottles[drag.key].home);
  for(const t of Object.values(tubes))t.selection.visible=false;drag=null;
}
canvas.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)cancelDrag();});
canvas.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)cancelDrag();});
canvas.onpointerup=e=>{
  if(drag?.id!==e.pointerId)return;
  const key=pick(e),was=drag;drag=null;
  if(tubes[key]&&(bottles[was.key]||(!was.moved&&was.key===key))){deliver(key);return;}
  if(bottles[was.key]){bottles[was.key].pip.position.copy(bottles[was.key].home);status.textContent='Đã chọn '+bottles[was.key].name.toLowerCase()+'. Chọn ống nhận.';}
  for(const t of Object.values(tubes))t.selection.visible=false;
};
for(const btn of document.querySelectorAll('[data-source]'))btn.onclick=()=>{if(!motion)select(btn.dataset.source);};
for(const btn of document.querySelectorAll('[data-target]'))btn.onclick=()=>deliver(btn.dataset.target);
$('reset').onclick=reset;$('dose').oninput=()=>{$('amount').value=$('dose').value;};
function interactionMode(orbit) {
  cancelDrag();
  orbitOnly=orbit;
  $('orbitMode').setAttribute('aria-pressed',String(orbit));
  $('actionMode').setAttribute('aria-pressed',String(!orbit));
  $('gestureHint').textContent=orbit
    ? 'Kéo ngay trên lọ, ống hoặc nền để xoay. Cuộn để phóng. Chọn Thao tác để nhỏ giọt.'
    : 'Kéo lọ tới ống. Giữ chuột phải để xoay từ bất kỳ vị trí nào. Cuộn để phóng.';
}
$('actionMode').onclick=()=>interactionMode(false);
$('orbitMode').onclick=()=>interactionMode(true);
$('camera').onclick=homeView;
$('labels').onclick=()=>{const on=$('anchors').hidden;$('anchors').hidden=!on;$('labels').setAttribute('aria-pressed',String(on));};
const frameA=$('versionA').querySelector('iframe');
function version(a){
  if(a&&!frameA.hasAttribute('src'))frameA.src='../index.html?bai=CHEM10-05&mode=3d&ban=phong&buoc=3';
  $('versionA').hidden=!a;$('versionB').hidden=a;$('showA').setAttribute('aria-pressed',String(a));$('showB').setAttribute('aria-pressed',String(!a));
}
$('showA').onclick=()=>version(true);$('showB').onclick=()=>version(false);
function resize(){
  const w=pane.clientWidth,h=pane.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);
  const ratio=camera.position.distanceTo(controls.target)/homeDistance;
  camera.aspect=w/h;
  homeDistance=Math.max(5.45,8.65/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
  controls.minDistance=homeDistance*.68; controls.maxDistance=homeDistance*1.65;
  camera.position.sub(controls.target).normalize().multiplyScalar(homeDistance*ratio).add(controls.target);
  camera.updateProjectionMatrix();controls.update();
}
function updateLabels(){
  if($('anchors').hidden)return;
  const w=pane.clientWidth,h=pane.clientHeight;
  for(const a of anchors)a.projected.copy(a.point).project(camera);
  const ordered=[...anchors].sort((a,b)=>a.projected.x-b.projected.x);
  for(let side=0;side<2;side++){
    const group=ordered.slice(side*2,side*2+2).sort((a,b)=>b.projected.y-a.projected.y);
    for(const [i,a] of group.entries()){
      const px=(1+a.projected.x)*w/2,py=(1-a.projected.y)*h/2;
      const top=T.MathUtils.clamp(py+(i===0?-30:28),24,h-24);
      const y=i===1?Math.min(h-14,Math.max(top,group[0].row+34)):Math.min(top,h-50);
      a.row=y;
      const x=side?w-12-a.el.offsetWidth:12;
      a.el.style.transform='translate('+x+'px,'+(y-a.el.offsetHeight/2)+'px)';
      const start=side?x:x+a.el.offsetWidth;
      a.leader.style.width=Math.hypot(px-start,py-y)+'px';
      a.leader.style.transform='translate('+start+'px,'+y+'px) rotate('+Math.atan2(py-y,px-start)+'rad)';
    }
  }
}
new ResizeObserver(resize).observe(pane);resize();reset();
let previous=performance.now();
renderer.setAnimationLoop(now=>{
  const dt=Math.min(.1,(now-previous)/1000);previous=now;if($('versionB').hidden)return;
  animateDose(dt);controls.update();renderer.render(scene,camera);updateLabels();
});
