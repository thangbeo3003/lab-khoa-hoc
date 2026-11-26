import * as T from 'three';
import { canvasTexture } from '../../kit/materials.js';

const finish = (color, metalness = .1) => new T.MeshStandardMaterial({ color, metalness, roughness:.56 });

function fascia() {
  const map = canvasTexture(1792,128,(ctx,w,h)=>{
    ctx.fillStyle='#1e3c48'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#e4efee'; ctx.font='600 67px sans-serif'; ctx.textBaseline='middle';
    ctx.fillText('TỦ HÚT',66,h/2);
    ctx.fillStyle='#122b35';
    for (let i=0;i<19;i++) {
      ctx.beginPath(); ctx.roundRect(w-440+i*19,33,7,62,3); ctx.fill();
    }
  });
  return new T.MeshBasicMaterial({map,toneMapped:false});
}

function liner() {
  const map=canvasTexture(512,320,(ctx,w,h)=>{
    const light=ctx.createLinearGradient(0,0,0,h);
    light.addColorStop(0,'#b3c8cd'); light.addColorStop(.17,'#e3ebe9');
    light.addColorStop(.65,'#cbd9d9'); light.addColorStop(1,'#9db0b4');
    ctx.fillStyle=light; ctx.fillRect(0,0,w,h);
    const edges=ctx.createLinearGradient(0,0,w,0);
    edges.addColorStop(0,'#42606b55'); edges.addColorStop(.12,'#42606b00');
    edges.addColorStop(.88,'#42606b00'); edges.addColorStop(1,'#42606b55');
    ctx.fillStyle=edges; ctx.fillRect(0,0,w,h);
  });
  return new T.MeshBasicMaterial({map,toneMapped:false});
}

export function makeTeachingHood({w,d,h,open=.67}) { // open: cửa kính kéo lên tới phần nào của chiều cao tủ
  const g=new T.Group(), frame=finish('#546e77'), dark=finish('#193440'), trim=finish('#a3b7bd',.48);
  const front=d/2, rear=-d/2, opening=h*open;
  function panel(width,height,depth,x,y,z,material) {
    const m=new T.Mesh(new T.BoxGeometry(width,height,depth),material);
    m.position.set(x,y,z); g.add(m); return m;
  }
  function face(width,height,x,y,z,material) {
    const m=new T.Mesh(new T.PlaneGeometry(width,height),material);
    m.position.set(x,y,z); g.add(m); return m;
  }
  panel(w,h,.10,0,h/2,rear,frame);
  face(w-.12,h-.04,0,h/2,rear+.055,liner());
  for (const s of [-1,1]) {
    const x=s*(w/2-.08);
    panel(.16,h,d,x,h/2,0,frame);
    panel(.18,h,.13,x,h/2,front,dark);
    panel(.032,h-.06,.035,x-s*.066,h/2,front+.075,trim);
  }
  panel(w+.08,.51,d+.10,0,h+.22,0,frame);
  face(w+.065,.47,0,h+.22,front+.065,fascia());
  panel(w+.06,.055,d+.10,0,h+.49,0,dark);
  const light=new T.MeshBasicMaterial({color:0xf3f9ef,toneMapped:false});
  panel(w-.42,.034,.11,0,h-.065,front-.13,light);
  const glass=new T.MeshPhysicalMaterial({color:0x8dbabe,transparent:true,opacity:.14,
    depthWrite:false,metalness:.06,roughness:.16,side:T.DoubleSide});
  const sash=face(w-.29,h-opening,0,(h+opening)/2,front-.01,glass);
  sash.renderOrder=2;
  const reflection=canvasTexture(512,128,(ctx,width,height)=>{
    const gleam=ctx.createLinearGradient(0,0,width,height*.9);
    gleam.addColorStop(0,'#ffffff00'); gleam.addColorStop(.20,'#ffffff00');
    gleam.addColorStop(.23,'#ffffff3b'); gleam.addColorStop(.33,'#ffffff0b');
    gleam.addColorStop(.35,'#ffffff2a'); gleam.addColorStop(.37,'#ffffff00');
    gleam.addColorStop(1,'#ffffff00'); ctx.fillStyle=gleam; ctx.fillRect(0,0,width,height);
  });
  const highlight=face(w-.31,h-opening-.02,0,(h+opening)/2,front+.001,
    new T.MeshBasicMaterial({map:reflection,transparent:true,depthWrite:false,toneMapped:false}));
  highlight.renderOrder=3;
  highlight.raycast=()=>{};
  // Khối lòng tủ (không vẽ ra): kit/labset.js đo hộp bao các lớp có renderOrder 1–6 để dựng lớp khí màu khi khí thoát ra.
  // Cửa kính kéo cao thì dải kính còn rất mỏng, nên khai thêm khối này để khí màu phủ cả lòng tủ chứ không chỉ một dải sát nóc.
  const volume=panel(w-.4,h-.12,d-.3,0,h/2,0,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
  volume.renderOrder=1; volume.raycast=()=>{};

  panel(w-.28,.075,.105,0,opening,front,dark);
  panel(1.12,.085,.16,0,opening-.025,front+.065,trim);
  const indicatorX=w/2-.44, indicatorY=h+.22;
  panel(.64,.30,.042,indicatorX,indicatorY,front+.065,dark);
  const lens=new T.MeshBasicMaterial({color:0x87979e,toneMapped:false});
  const lamp=new T.Mesh(new T.CircleGeometry(.080,32),lens);
  lamp.position.set(indicatorX,indicatorY,front+.09); g.add(lamp);
  g.userData={w,d,h,on:false,setOn(value){
    this.on=!!value;
    lens.color.set(this.on ? '#67f1b2' : '#87979e');
  }};
  return g;
}
