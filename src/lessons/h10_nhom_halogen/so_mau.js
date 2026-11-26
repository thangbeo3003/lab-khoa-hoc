// Hai ảnh cận cảnh lấy trực tiếp từ các ống trên bàn, cùng camera, cùng tỉ lệ và nguồn sáng.
import * as T from 'three';
import { h } from '../../shell/shell.js';

const frameHeight = 1.74, centreY = .76;
const formatMl = value => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' mL';

function drawTube(stage, vessel, canvas, frame) {
  const { scene, renderer } = stage, source = renderer.domElement;
  const ratio = source.width / source.height, half = (frame ? frame.height : frameHeight) / 2;
  const camera = new T.OrthographicCamera(-half*ratio, half*ratio, half, -half, .1, 12);
  vessel.o.getWorldPosition(camera.position);
  camera.position.y += frame ? frame.centre : centreY;
  camera.position.z += 4;
  // A private camera layer isolates the existing meshes for this synchronous render.
  const layer = 29, touched = [];
  camera.layers.set(layer);
  const include = obj => {
    if (!obj.layers.isEnabled(layer)) { touched.push(obj); obj.layers.enable(layer); }
  };
  vessel.o.traverseVisible(include);
  scene.traverseVisible(obj => { if (obj.isLight) include(obj); });
  const background = scene.background, autoShadow = renderer.shadowMap.autoUpdate;
  try {
    scene.background = new T.Color('#edf2f1');
    renderer.shadowMap.autoUpdate = false;
    renderer.render(scene,camera);
    const width = source.height * canvas.width / canvas.height;
    canvas.getContext('2d').drawImage(source,(source.width-width)/2,0,width,source.height,0,0,canvas.width,canvas.height);
  } finally {
    touched.forEach(obj => obj.layers.disable(layer));
    renderer.shadowMap.autoUpdate = autoShadow;
    scene.background = background;
    renderer.render(scene,stage.camera);
  }
}

// VÙNG QUAN SÁT ở bảng phải (define bố cục v3): hai ống cạnh nhau, CẮT SÁT phần dung dịch, cùng một khung cho cả hai ống để so được.
export function drawWatch(stage, B, ids, canvases) {
  const tops = ids.map(id => { const v = B.vessel[id], t = B.data.tubes[id]; return v && t ? v.level * t.vol / v.item.K.ml : 0; });
  const top = Math.max(.34, ...tops) + .17, bottom = -.07, frame = { height: top - bottom, centre: (top + bottom) / 2 };
  ids.forEach((id, n) => { const v = B.vessel[id]; if (v && canvases[n]) drawTube(stage, v, canvases[n], frame); });
}

// host: nếu có thì mở thành NGĂN DƯỚI BÀN trong sân khấu (dialog không khoá màn hình, bấm lại nút thì đóng) và cắt sát phần dung dịch (chặng 1, việc sót · 27/11).
export function openComparison(lab, choices, names, reagents, host) {
  const B = lab.benches[lab.active()];
  if (!B || B.seq.busy() || (B.run && !B.run.done)) return;
  const old = host && host.querySelector('dialog.hg-dock'); if (old) { old.close(); return; }
  const dialog = h('dialog', { class:'hg-compare' + (host ? ' hg-dock' : ''), 'aria-label':'So màu hai ống' });
  const grid = h('div',{class:'hg-pair'});
  const selected = choices[0].slice();
  const available = [...new Set(choices.flat())];
  function refresh() {
    grid.replaceChildren();
    const tops = selected.map(id => B.vessel[id].level * B.data.tubes[id].vol / B.vessel[id].item.K.ml);
    const top = Math.max(.34, ...tops) + .2, low = -.08, frame = host ? { height: top - low, centre: (top + low) / 2 } : null;
    const fh = frame ? frame.height : frameHeight, cy = frame ? frame.centre : centreY;
    selected.forEach((id,index) => {
      const alternatives = index === 0 && choices.every(pair=>pair[0]===choices[0][0])
        ? [id] : available.filter(candidate => choices.some(pair => pair[index]===candidate));
      const label = alternatives.length === 1 ? h('strong',{text:names[id]}) : h('select',{
        'aria-label':index===0?'Ống bên trái':'Ống bên phải',
        onchange(event) {
          const value=event.target.value;
          const pair=choices.find(pair=>pair[index]===value && pair[1-index]===selected[1-index])
            || choices.find(pair=>pair[index]===value);
          selected.splice(0,2,...pair); refresh(); grid.querySelectorAll('figure')[index].querySelector('select')?.focus();
        }
      }, alternatives.map(key=>h('option',{value:key,selected:key===id,text:names[key]})));
      const vessel=B.vessel[id], tube=B.data.tubes[id], last=B.data.res[id]?.at(-1);
      const canvas=h('canvas',{width:host?440:450,height:host?300:600,'aria-label':'Cận cảnh '+names[id]});
      const ruler=h('div',{class:'hg-ruler','aria-label':'Thể tích mẫu'});
      const y = vessel.level * tube.vol / vessel.item.K.ml;
      ruler.append(h('span',{style:'top:'+((cy+fh/2-y)/fh*100)+'%',text:formatMl(tube.vol)}));
      const caption=h('figcaption',{},label);
      const detail=last ? reagents[last.chem]+' · '+last.drops+' giọt' : tube.vol ? 'Mẫu ban đầu' : 'Ống rỗng';
      grid.append(h('figure',{},caption,h('div',{class:'hg-glass'},canvas,ruler),h('p',{text:detail})));
      drawTube(lab.stage,vessel,canvas,frame);
    });
  }
  const close = h('button',{type:'button',class:'lk-btn',onclick:()=>dialog.close()},'Về bàn');
  dialog.append(h('header',{},h('h2',{text:'So màu hai ống'}),close),grid);
  dialog.addEventListener('keydown',event=>{ event.stopPropagation(); if (host && event.key === 'Escape') dialog.close(); });
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  if (host) { host.append(dialog); dialog.show(); } else { document.body.append(dialog); dialog.showModal(); }
  refresh();
}
