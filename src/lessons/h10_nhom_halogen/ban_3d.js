import * as T from 'three';
import { makeTeachingHood } from './tu_hut_3d.js';
import { makeHoodStand, makeHoodFlask, makeHoodFunnel, makeHoodWash, makeHoodTrap } from './dung_cu_tu_hut_3d.js';
import { canvasTexture } from '../../kit/materials.js';
import { makeBeaker } from '../../kit/labware2.js';
import { makeTestTube } from '../../kit/labware.js';
import { SO, khayRong, deRong, cachXep, xepBan3d } from '../../kit/bo_cuc_ban.js';

const palette = { graphite: '#182d39', steel: '#526e79', wood: '#995222', paper: '#fff5dd', amber: '#71330e', clear: '#b5d6d7', teal: '#006569' };
const mat = (color, options) => new T.MeshStandardMaterial({ color, roughness: .48, ...options });
function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const part = new T.Mesh(geometry, material);
  part.position.set(x, y, z);
  part.castShadow = part.receiveShadow = !material.transparent;
  parent.add(part);
  return part;
}
function profile(parent, points, material) {
  return mesh(parent, new T.LatheGeometry(points.map(([x,y]) => new T.Vector2(x,y)), 48), material);
}
function ring(parent, r, width, material, y) {
  const part = mesh(parent, new T.TorusGeometry(r, width, 8, 48), material, 0, y);
  part.rotation.x = Math.PI / 2;
  return part;
}
function bottleLabel(title, name, clear) {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = palette.paper; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = clear ? palette.teal : palette.amber; ctx.fillRect(0, 12, c.width, 16);
  ctx.fillStyle = palette.graphite; ctx.textAlign = 'center';
  ctx.font = 'bold 100px Georgia'; ctx.fillText(title, 384, 143, 700);
  ctx.font = 'bold 42px sans-serif'; ctx.fillText(name, 384, 213, 700);
  const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace;
  return new T.MeshBasicMaterial({ map: texture, toneMapped: false });
}
function makeBenchBottle({ title, name, clear }) {
  const g = new T.Group(), dark = mat(palette.graphite);
  const shell = mat(clear ? palette.clear : palette.amber, { transparent: !!clear, opacity: clear ? .68 : 1, roughness: .24 });
  profile(g, [[0,.018],[.224,.018],[.25,.055],[.25,.56],[.23,.62],[.123,.72],[.12,.86]], shell);
  ring(g,.12,.015,dark,.83);
  mesh(g,new T.CylinderGeometry(.253,.253,.29,48),mat(palette.paper),0,.37);
  const label = mesh(g, new T.CylinderGeometry(.256,.256,.28,48,1,true,-1.21,2.42), bottleLabel(title,name,clear),0,.37);
  const pip = new T.Group(), seat = .86, stemLen = .52;
  pip.position.y = seat; g.add(pip);
  profile(pip, [[.13,0],[.14,.025],[.14,.108],[.085,.13],[.067,.17],[.082,.23],[.073,.322],[.045,.368],[0,.386]], dark);
  ring(pip,.139,.008,mat(palette.steel),.04);
  const stem = profile(pip, [[.009,-stemLen],[.024,-.465],[.033,-.43],[.033,.01]], mat('#90bbbe',{transparent:true,opacity:.7,depthWrite:false}));
  const fill = mesh(pip, new T.CylinderGeometry(.022,.01,1,16), new T.MeshBasicMaterial({color:'#b9dfe2'}),0,-stemLen+.012);
  fill.geometry.translate(0,.5,0); fill.renderOrder = 4;
  const selected = ring(g,.29,.016,new T.MeshBasicMaterial({color:palette.teal}),.022);
  selected.visible = false;
  g.userData = { selected, pip, seat, stemLen, tipY: -stemLen, cap: pip, top: 1.25, label,
    setOut(on) { stem.visible = on; },
    setLoad(k,hex) { fill.visible = k > .02; fill.scale.y = Math.max(.001,k*(stemLen-.05)); if (hex) fill.material.color.set(hex); } };
  g.userData.setOut(false); g.userData.setLoad(0);
  return g;
}

// Lọ xếp hạng ở bước 6 (chặng 3 · 27/11): thuỷ tinh trong để THẤY MÀU dung dịch (màu lấy từ kho hoá học, opts.hex), nhỏ hơn lọ cũ để ít che món phía sau.
function makeRankBottle({ title, sub, hex }) {
  const g = new T.Group(), dark = mat(palette.graphite);
  mesh(g, new T.CylinderGeometry(.196,.196,.46,40), new T.MeshStandardMaterial({ color: hex || '#dcecf5', roughness: .32, transparent: true, opacity: .92 }), 0, .26);
  profile(g, [[0,.018],[.2,.018],[.222,.05],[.222,.5],[.2,.56],[.11,.64],[.108,.74]], mat(palette.clear, { transparent: true, opacity: .3, roughness: .18, depthWrite: false }));
  const label = mesh(g, new T.CylinderGeometry(.226,.226,.17,48,1,true,-1.0,2.0), bottleLabel(title, sub || '', true), 0, .15);
  const cap = mesh(g, new T.CylinderGeometry(.125,.125,.09,32), dark, 0, .78);
  g.userData = { cap, top: .9, label };
  return g;
}

const pitch = .47, tubeRadius = .112;
function makeTube(opts, kind) {
  const tube = makeTestTube({r:tubeRadius,h:1.52}), edge = mat(palette.graphite);
  tube.userData.fullLevel = 1.43;
  const liquid = tube.userData.liquid;
  liquid.material.dispose();
  liquid.material = new T.MeshBasicMaterial({ transparent:true, depthWrite:false, toneMapped:false });
  // Emphasize grazing angles only, so the coloured sample remains visible through the centre.
  const contour = new T.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ ink:{value:new T.Color('#16323c')} },
    vertexShader:`varying vec3 n; varying vec3 eye;
      void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); n=normalMatrix*normal;
        eye=-p.xyz; gl_Position=projectionMatrix*p; }`,
    fragmentShader:`uniform vec3 ink; varying vec3 n; varying vec3 eye;
      void main(){ float facing=abs(dot(normalize(n),normalize(eye)));
        gl_FragColor=vec4(ink,.94*(1.-smoothstep(.05,.62,facing)));
        #include <colorspace_fragment>
      }`
  });
  const sides=mesh(tube,new T.CylinderGeometry(tubeRadius+.001,tubeRadius+.001,1.52-tubeRadius,48,1,true),contour,0,(1.52+tubeRadius)/2);
  sides.renderOrder=6;
  const round=mesh(tube,new T.SphereGeometry(tubeRadius+.001,40,16,0,Math.PI*2,Math.PI/2,Math.PI/2),contour,0,tubeRadius); round.renderOrder=6; // viền cả phần đáy tròn
  ring(tube,tubeRadius+.007,.009,edge,1.52);
  // The meniscus uses the same height as the printed scale. The rounded
  // bottom keeps its shape as the liquid rises in the cylindrical section.
  const meniscus = ring(tube,tubeRadius-.013,.008,new T.MeshBasicMaterial({
    color:'#2c4a55', transparent:true, opacity:.9, depthWrite:false
  }),0);
  meniscus.renderOrder = 4; meniscus.visible = false;
  let restingY;
  tube.userData.fillToHeight = height => {
    const pos = liquid.geometry.attributes.position;
    restingY ??= Float32Array.from({length:pos.count}, (_,i)=>pos.getY(i));
    const bottomScale = Math.min(1,height/tubeRadius);
    for (let i=0;i<pos.count;i++) pos.setY(i,restingY[i] > tubeRadius+.001 ? height : restingY[i]*bottomScale);
    pos.needsUpdate = true;
    meniscus.position.y = height; meniscus.visible = liquid.visible;
  };
  const bottom = .035, top = 1.50, radius = tubeRadius+.003;
  const print = canvasTexture(240,1440,(ctx,w,h)=>{
    ctx.fillStyle = ctx.strokeStyle = palette.graphite;
    ctx.font = 'bold 65px sans-serif'; ctx.textBaseline = 'middle';
    for (let ml=1; ml<kind.ml; ml++) {
      const y = h*(1-(tube.userData.fullLevel*ml/kind.ml-bottom)/(top-bottom));
      const major = [2,5,10].includes(ml);
      ctx.fillRect(20,y-3,major?82:46,major?9:6);
      if (major) ctx.fillText(String(ml),111,y);
    }
    ctx.font = 'bold 52px sans-serif'; ctx.fillText('mL',108,46);
  });
  const scale = mesh(tube,new T.CylinderGeometry(radius,radius,top-bottom,32,1,true,-1.13,2.26),
    new T.MeshBasicMaterial({map:print,transparent:true,depthWrite:false,toneMapped:false}),0,(top+bottom)/2);
  scale.renderOrder = 7;
  return tube;
}
// Chậu rửa dựng khối (27/11, chủ chê "vòi rửa gì mà phẳng thế"): chậu sứ có thành dày, nhìn thấy lòng chậu và lỗ thoát;
// vòi cổ ngỗng đặt chéo từ góc sau bên phải ra giữa chậu để nhìn từ phía trước vẫn thấy dáng cong; van có núm xanh; dòng nước có vệt sáng và vòng toé.
function makeBenchSink({ w = 2.1 } = {}) {
  const g = new T.Group(), W = Math.min(w, 1.8), D = 1.08, wall = .075, hgt = .21;
  const rrect = (S, w, d, r) => {
    const x = -w/2, y = -d/2;
    S.moveTo(x+r, y); S.lineTo(x+w-r, y); S.quadraticCurveTo(x+w, y, x+w, y+r); S.lineTo(x+w, y+d-r); S.quadraticCurveTo(x+w, y+d, x+w-r, y+d);
    S.lineTo(x+r, y+d); S.quadraticCurveTo(x, y+d, x, y+d-r); S.lineTo(x, y+r); S.quadraticCurveTo(x, y, x+r, y); return S;
  };
  const ceramic = mat('#f1f4f3', { roughness: .22 }), floorMat = mat('#d3dcdd', { roughness: .3 });
  const chrome = mat('#cdd5d9', { roughness: .24, metalness: .72 }), dark = mat('#2c3a41', { roughness: .5 });
  const ringShape = rrect(new T.Shape(), W, D, .15); ringShape.holes.push(rrect(new T.Path(), W-2*wall, D-2*wall, .09));
  const body = new T.ExtrudeGeometry(ringShape, { depth: hgt-.03, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 3, curveSegments: 10 });
  body.rotateX(-Math.PI/2); mesh(g, body, ceramic, 0, .015, 0);
  const floor = new T.ShapeGeometry(rrect(new T.Shape(), W-2*wall+.02, D-2*wall+.02, .09), 10); floor.rotateX(-Math.PI/2);
  mesh(g, floor, floorMat, 0, .022, 0);
  mesh(g, new T.CylinderGeometry(.085, .085, .012, 32), chrome, 0, .03, .1);
  mesh(g, new T.CylinderGeometry(.05, .05, .014, 24), dark, 0, .031, .1);
  // Vòi cổ ngỗng: thân đứng ở góc sau phải, cổ uốn nửa vòng chéo về giữa chậu.
  const spout = new T.Vector3(0, 1.6, .04), bx = Math.min(.52, W/2-.3), bz = -D/2-.12, H = spout.y+.08;
  const ux = spout.x-bx, uz = spout.z-bz, L = Math.hypot(ux, uz), R = L/2, Ry = .3, pts = [];
  [.05, .45, .9, 1.3, H-.06].forEach(y => pts.push(new T.Vector3(bx, y, bz)));
  for (let i = 0; i <= 10; i++) { const a = Math.PI*i/10, k = (R-R*Math.cos(a))/L; pts.push(new T.Vector3(bx+ux*k, H+Ry*Math.sin(a), bz+uz*k)); }
  pts.push(spout.clone());
  mesh(g, new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, 'centripetal'), 72, .05, 16), chrome);
  mesh(g, new T.CylinderGeometry(.13, .14, .05, 32), chrome, bx, .025, bz);
  mesh(g, new T.CylinderGeometry(.078, .085, .2, 24), chrome, bx, .15, bz);
  mesh(g, new T.CylinderGeometry(.062, .058, .1, 24), mat('#9aa7ad', { roughness: .3, metalness: .7 }), spout.x, spout.y+.05, spout.z);
  const stub = mesh(g, new T.CylinderGeometry(.034, .034, .2, 16), chrome, bx-.12, .62, bz); stub.rotation.z = Math.PI/2;
  mesh(g, new T.CylinderGeometry(.062, .062, .05, 20), chrome, bx, .62, bz);
  const knob = mesh(g, new T.CylinderGeometry(.085, .085, .06, 8), mat('#1f6fb2', { roughness: .4 }), bx-.24, .62, bz); knob.rotation.z = Math.PI/2;
  // Dòng nước: cột nước xanh nhạt, vệt sáng chạy, vòng toé ở đáy chậu.
  const flow = new T.Group(), y0 = .03, len = spout.y-y0;
  const basic = (color, opacity) => new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const water = mesh(flow, new T.CylinderGeometry(.03, .024, len, 14), basic('#a9d8f3', .82), spout.x, y0+len/2, spout.z);
  const shine = mesh(flow, new T.CylinderGeometry(.009, .008, len, 8), basic('#ffffff', .85), spout.x+.012, y0+len/2, spout.z+.022);
  const splash = mesh(flow, new T.RingGeometry(.05, .15, 32), basic('#d9eefb', .6), spout.x, y0+.006, spout.z); splash.rotation.x = -Math.PI/2;
  [water, shine, splash].forEach(m => { m.renderOrder = 9; });
  water.onBeforeRender = () => {
    const t = performance.now()/1000, k = (t*2.4)%1;
    shine.material.opacity = .5+.35*Math.abs(Math.sin(t*9)); splash.scale.setScalar(.7+.6*k); splash.material.opacity = .65*(1-k);
  };
  flow.visible = false; g.add(flow);
  g.userData = { spout, top: H+Ry, setFlow: on => { flow.visible = !!on; } };
  return g;
}
// BỐ CỤC BÀN ỐNG NGHIỆM (define mục 21.2 · 27/11): bảng vai trò nằm ở giáo án (bench.bo_cuc), cách tính ở kit/bo_cuc_ban.js, bàn 2D đọc cùng bảng.
const B_PITCH = SO.lo, T_PITCH = SO.ong, STAND_X = SO.de_x, TRAY_Y = SO.khay_y, trayW = khayRong, standW = deRong, arrange = xepBan3d;
const cfgOf = (B) => cachXep(B.d.bo_cuc, B.opts.step);
function plate(text) {
  const c = document.createElement('canvas'); c.width = 384; c.height = 104; const x = c.getContext('2d');
  x.fillStyle = '#f4efe2'; x.beginPath(); x.roundRect(0, 0, 384, 104, 22); x.fill();
  x.fillStyle = palette.graphite; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '600 54px "IBM Plex Sans", "Segoe UI", Arial, sans-serif'; x.fillText(text, 192, 56, 350);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return new T.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true });
}
// Đế ống xám: thanh trên có lỗ đỡ ống, hai má, chân đế; mặt trước chân đế nghiêng, gắn bảng tên từng ống.
function makeTubeStand({ n, labels }) {
  const g = new T.Group(), grey = mat('#7a8691', { roughness: .6 }), w = standW(n), xs = labels.map((_, i) => (i - (n - 1) / 2) * T_PITCH);
  const shape = new T.Shape(), hw = w / 2, hd = .27, r = .08;
  shape.moveTo(-hw + r, -hd); shape.lineTo(hw - r, -hd); shape.quadraticCurveTo(hw, -hd, hw, -hd + r); shape.lineTo(hw, hd - r); shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd); shape.quadraticCurveTo(-hw, hd, -hw, hd - r); shape.lineTo(-hw, -hd + r); shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  for (const x of xs) { const hole = new T.Path(); hole.absarc(x, 0, tubeRadius + .03, 0, Math.PI * 2, true); shape.holes.push(hole); }
  const beam = mesh(g, new T.ExtrudeGeometry(shape, { depth: .1, bevelEnabled: false, curveSegments: 24 }), grey, 0, .62, 0); beam.rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) { const leg = mesh(g, new T.BoxGeometry(.14, .6, .54), grey, s * (hw + .05), .34, 0); leg.rotation.z = s * .2; }
  mesh(g, new T.BoxGeometry(w + .4, .09, .66), grey, 0, .045, 0);
  const apron = mesh(g, new T.BoxGeometry(w + .4, .28, .06), grey, 0, .105, .39); apron.rotation.x = -.62;
  xs.forEach((x, i) => { const p = mesh(g, new T.PlaneGeometry(Math.min(.7, T_PITCH - .1), .19), plate(labels[i]), x, .11, .428); p.rotation.x = -.62; p.castShadow = false; p.renderOrder = 2; });
  g.userData = { top: .72 };
  return g;
}
// Khay nông bo góc: mỗi lọ một chỗ, khay mẫu tách khỏi khay thuốc thử.
function makeTray({ n }) {
  const g = new T.Group(), w = trayW(n), d = .78, wall = .06, grey = mat('#9da8b1', { roughness: .55 });
  const rr = (S, w, d, r) => { const x = -w / 2, y = -d / 2; S.moveTo(x + r, y); S.lineTo(x + w - r, y); S.quadraticCurveTo(x + w, y, x + w, y + r); S.lineTo(x + w, y + d - r); S.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    S.lineTo(x + r, y + d); S.quadraticCurveTo(x, y + d, x, y + d - r); S.lineTo(x, y + r); S.quadraticCurveTo(x, y, x + r, y); return S; };
  const ring = rr(new T.Shape(), w, d, .13); ring.holes.push(rr(new T.Path(), w - 2 * wall, d - 2 * wall, .09));
  const body = new T.ExtrudeGeometry(ring, { depth: .1, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, curveSegments: 8 }); body.rotateX(-Math.PI / 2); mesh(g, body, grey, 0, .012, 0);
  const floor = new T.ShapeGeometry(rr(new T.Shape(), w - 2 * wall + .02, d - 2 * wall + .02, .09), 8); floor.rotateX(-Math.PI / 2); mesh(g, floor, mat('#b3bdc5', { roughness: .6 }), 0, TRAY_Y - .004, 0);
  g.userData = { top: .13 };
  return g;
}
function makeWasteCup({h}) {
  const cup = makeBeaker({h,r:.25}), u = cup.userData;
  u.top = h;
  u.setColor = color => u.liquid.material.color.set(color);
  u.setLevel = fraction => u.setVolume(u.max*fraction/.8);
  return cup;
}
export function benchDeclaration(decl) {
  return { ...decl, benches: decl.benches.map(b => {
    if (b.id === 'prep') {
      // Tủ hút của bàn mới thấp và hẹp hơn phòng cũ để bộ dụng cụ chiếm phần lớn khung (27/11); phòng cũ (?ban=phong) giữ cỡ trong giáo án.
      // Các món đứng sát nhau hơn (toạ độ ngang × KX) để cả bộ to lên trong khung; khoảng cách, ống dẫn và chỗ nhấc cốc đều tính lại từ toạ độ mới.
      const KX = .8, HOOD = { w: 5.6, h: 3.1, open: .92 }, at = id => b.items.find(it => it.id === id).at;
      // Đồng hồ "khí độc trong phòng" đứng NGOÀI tủ, sát vách phải (trước đây đứng chắn trước tủ nên khung phải lùi ra xa).
      const near = it => it.id === 'meter' ? {...it, at: [HOOD.w/2 + .72, .25], ry: -.3}
        : ({...it, at: [it.at[0]*KX, ...it.at.slice(1)], ...(it.away ? { away: [it.away[0]*KX, it.away[1]] } : {})});
      const stand = at('stand'), flask = at('flask');
      const solid3d = { stand: makeHoodStand, sideflask: makeHoodFlask, dropfunnel: makeHoodFunnel, gaswash: makeHoodWash };
      return {
        ...b, top:0x384f57, backdrop:0xe1e8e8, view: {...b.view, target: [0.15, 1.5, 0.4], w: 5.6, h: 3.2, el: 10},
        items:b.items.map(it => it.kind === 'hood' ? it : near(it)).map(it => {
          if (it.kind === 'hood') { const opts = {...it.opts, ...HOOD}; return {...it, opts, make3d:makeTeachingHood, tagAt:[opts.w/2-.44,opts.h+.22,opts.d/2+.09]}; }
          if (it.kind === 'stand') return {...it, make3d:makeHoodStand, opts:{...it.opts, grip:[(flask[0]-stand[0])*KX, flask[1]-stand[1]]}};
          if (solid3d[it.kind]) return {...it, make3d:solid3d[it.kind]};
          if (it.id === 'trap') return {...it, make3d:makeHoodTrap};
          return it;
        })
      };
    }
    if (b.id !== 'cl' && b.id !== 'bri') return b;
    // Bàn ống nghiệm: bố cục theo ảnh của chủ (bảng bo_cuc của giáo án). Vị trí từng món do atBy trả theo bước; đế và khay mỗi cách xếp một bộ, bước nào hiện bộ đó.
    const L = b.bo_cuc, keys = Object.keys(L), plan = Object.fromEntries(keys.map(k => [k, arrange(L[k])]));
    const atBy = id => B => plan[cfgOf(B)].pos[id] || null, first = id => plan.macdinh.pos[id] || Object.values(plan).map(p => p.pos[id]).find(Boolean);
    const sets = keys.flatMap(k => [
      { id: 'de_' + k, kind: 'rack', at: [STAND_X, 0], opts: {}, make3d: () => makeTubeStand(plan[k].stand), show: B => String(cfgOf(B)) === k },
      ...plan[k].trays.map((t, n) => ({ id: `khay_${k}_${n}`, kind: 'shelf', at: [t.x, 0], opts: {}, make3d: () => makeTray(t), show: B => String(cfgOf(B)) === k })),
    ]);
    const RANK_X = 3.2, RANK_Z = 2.0; // bước 6: ba lọ xếp hạng và kệ xếp hạng ở dải bàn phía trước chậu rửa, không che ống và khay
    return { ...b, w: 9.2, view: {...b.view, target: [b.view.target[0], 1.3, .2], h: 2.5, swing: 75, elMin: 5, elMax: 60, el: 13, az: 0}, top: 0x697f86, backdrop: 0xe2e9e8, nativeGlass: true,
      steps: b.steps.map(s => /^rank[123]$/.test(s.id) ? {...s, slot: [RANK_X + (+s.id.slice(4) - 2) * .7, RANK_Z]} : s),
      items: [...sets, ...b.items.filter(it => it.kind !== 'rack')].map(it => {
      if (it.kind === 'sink') return {...it, at:[3.2,.45], opts:{...it.opts, photo:false, w:1.56}, make3d:makeBenchSink, tagAt:[.26,2.14,-.3]};
      if (it.id === 'waste') return {...it, at:[1.6,.72], make3d:makeWasteCup}; // cốc thải (trước) và bình tia (sau) gom sát chậu rửa
      if (it.id === 'wash') return {...it, at:[2.14,-.62]};
      if (it.id === 'shelf') return {...it, at:[RANK_X, RANK_Z]};
      if (it.kind === 'dropper' && it.opts?.pip) return {...it, make3d:makeBenchBottle, tagAt:[0,1.33,0], at: first(it.id) || it.at, atBy: atBy(it.id), ringY: TRAY_Y + .012};
      if (it.kind === 'bottle' && /^r(Cl|Br|I)$/.test(it.id)) return {...it, at:[RANK_X + ({ rCl: -1, rBr: 0, rI: 1 })[it.id] * .7, 1.38], make3d:makeRankBottle, tagAt:[0,.98,0]};
      if (it.kind === 'tube') return {...it, make3d:makeTube, at: first(it.id) || it.at, atBy: atBy(it.id)};
      return it;
    }) };
  }) };
}

// A gesture only selects the pair. The lesson engine validates it, animates the
// measured transfer, updates the vessel and persists the action in its usual log.
export function connectBenchHands(lab, tell, canHandle) {
  const { camera, renderer } = lab.stage, canvas = renderer.domElement;
  const ray = new T.Raycaster(), cursor = new T.Vector2(), plane = new T.Plane(), world = new T.Vector3();
  let source = null, drag = null;
  const bench = () => lab.benches[lab.active()];
  const supported = item => item?.kind === 'tube' || !!item?.obj.userData.pip;
  function clearDrag() {
    if (!drag) return;
    const {item, pointer} = drag; drag = null;
    if (item?.obj.userData.pip) {
      const u = item.obj.userData; u.pip.position.set(0,u.seat,0); u.setOut(false);
    }
    if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  }
  function clear() {
    clearDrag();
    if (source) { source.label?.classList.remove('is-held'); source.item.obj.userData.selected.visible = false; }
    source = null;
  }
  function select(B,item) {
    clear();
    source = { item, label:B.tagEls[item.id] };
    source.label?.classList.add('is-held'); item.obj.userData.selected.visible = true;
    tell('Đã chọn ' + item.spec.tag.toLowerCase() + '. Chọn ống nhận.', 4);
  }
  function target(B,item) {
    if (!source) { tell('Chọn lọ trước, rồi chọn ống nhận.',4); return; }
    const spec = B.d.steps.find(s => !B.off.has(s.id) && s.item === source.item.id && s.into?.includes(item.id));
    if (!spec) { tell('Ống này không nhận dung dịch của lọ đang chọn ở bước này. Hãy chọn lại ống hoặc lọ.',5); return; }
    clear();
    if (lab.act(B.id, spec.id)) tell(spec.label + '…', 2);
  }
  function use(B,item) {
    if (B.seq.busy()) { tell('Chờ ống hút về lọ rồi thao tác tiếp.',3); return; }
    if (item.kind === 'tube') target(B,item); else select(B,item);
  }
  function pick(event, tubesOnly=false) {
    const B=bench(); if (!B?.d.nativeGlass) return null;
    const box=canvas.getBoundingClientRect();
    cursor.set((event.clientX-box.left)*2/box.width-1,1-(event.clientY-box.top)*2/box.height);
    ray.setFromCamera(cursor,camera);
    const items=Object.values(B.items).filter(it=>it.obj.visible && supported(it) && (!tubesOnly || it.kind==='tube'));
    // Intersect pick cylinders even above the tube opening and on clear glass.
    let best=null, nearest=Infinity;
    for (const item of items) {
      item.obj.getWorldPosition(world);
      const h=item.kind==='tube'?item.obj.userData.h:1.25;
      const r=item.kind==='tube'?.155:.26;
      const a=world.clone(), b=world.clone(); a.y+=r; b.y+=h-r+.04;
      const onRay = new T.Vector3();
      if (ray.ray.distanceSqToSegment(a,b,onRay) > r*r) continue;
      const dist=ray.ray.origin.distanceToSquared(onRay);
      if (dist<nearest) { nearest=dist; best=item; }
    }
    return best;
  }
  for (const B of Object.values(lab.benches).filter(b=>b.d.nativeGlass)) {
    for (const item of Object.values(B.items).filter(supported)) {
      B.tagEls[item.id]?.addEventListener('click', event=>{
        if (lab.active()!==B.id || !canHandle()) return;
        event.stopImmediatePropagation(); use(B,item);
      },true);
    }
  }
  canvas.addEventListener('pointerdown', event=>{
    if (event.button!==0 || !event.isPrimary || !canHandle() || drag || event.shiftKey) return;
    const item=pick(event); if (!item) return;
    event.stopImmediatePropagation();
    const B=bench();
    if (B.seq.busy()) { tell('Chờ ống hút về lọ rồi thao tác tiếp.',3); return; }
    if (item.obj.userData.pip) select(B,item);
    drag={ item, pointer:event.pointerId, x:event.clientX, y:event.clientY, moved:false };
    canvas.setPointerCapture(event.pointerId);
  },true);
  canvas.addEventListener('pointermove',event=>{
    if (event.pointerId!==drag?.pointer) return;
    event.stopImmediatePropagation();
    if (Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5) drag.moved=true;
    const u=drag.item.obj.userData;
    if (!drag.moved || !u.pip) return;
    const over=pick(event,true);
    if (over) {
      over.obj.getWorldPosition(world); world.y+=over.obj.userData.h+.08-u.tipY;
    } else {
      drag.item.obj.getWorldPosition(world); world.y+=u.seat+u.stemLen+.15;
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new T.Vector3()),world);
      if (!ray.ray.intersectPlane(plane,world)) return;
    }
    u.setOut(true); u.pip.position.copy(drag.item.obj.worldToLocal(world));
  },true);
  canvas.addEventListener('pointerup',event=>{
    if (event.pointerId!==drag?.pointer) return;
    event.stopImmediatePropagation();
    const {item,moved}=drag, B=bench();
    const tag=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-tag]');
    const labelId=tag?.dataset.tag.split('/');
    const underLabel=labelId?.[0]===B.id && B.items[labelId[1]];
    const to=underLabel?.kind==='tube' ? underLabel : pick(event,true);
    clearDrag();
    if (to && (item.obj.userData.pip || !moved)) target(B,to);
    else if (moved) clear();
  },true);
  for (const name of ['lostpointercapture','pointercancel']) canvas.addEventListener(name,event=>{
    if (event.pointerId===drag?.pointer) clear();
  });
  return clear;
}
