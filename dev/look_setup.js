// Công cụ thử: dựng cùng một cảnh 5 ống để so sánh các cách nhìn (?look=). Không thuộc app.
// A: Cu(OH)2 xanh lam · B: AgCl trắng · C: CuO đen (đã đun) · D: Zn + HCl đang sủi · E: NaCl không màu.
export function setup() {
  const f = window.__free; f.S.sound = false;
  const add = (id, ti, unit, v, sec = 9) => { f.selectChem(id); f.run(2.5); f.addNow(id, ti, unit, v); f.run(sec); };
  add('CuSO4', 0, 'mL', 2); add('NaOH', 0, 'mL', 1);
  add('CuSO4', 2, 'mL', 2); add('NaOH', 2, 'mL', 1); f.selectTube(2); f.doHeat(); f.run(16);
  add('AgNO3', 1, 'mL', 2); add('NaCl', 1, 'mL', 2); add('NaCl', 4, 'mL', 3); add('HCl', 3, 'mL', 3); f.run(25);
  add('Zn', 3, 'piece', 2, 7); f.selectChem(null); f.selectTube(3); f.run(1.5);
  document.getElementById('toast').classList.remove('on'); f.bench.setFlash(0, '');
  return 'ok';
}
export function medium() { const f = window.__free; f.bench.stage.focus({ target: [0.6, 0.6, 1.5], w: 2.5, h: 1.45, el: 12, az: 0 }, true); f.run(0.1); return 'ok'; }
// Chụp thẳng khung 3D (rộng khoảng 2400 điểm ảnh, không kèm nhãn HTML) rồi gửi về máy chủ thử để lưu lên SSD.
export async function shot(name) {
  const f = window.__free, st = f.bench.stage, r = st.renderer, host = r.domElement.parentElement, old = r.getPixelRatio();
  r.setPixelRatio(2400 / host.clientWidth); st.advance(0.0001);
  const url = r.domElement.toDataURL('image/jpeg', 0.93); r.setPixelRatio(old); st.advance(0.0001);
  const res = await fetch('/__shot?name=' + name, { method: 'POST', body: await (await fetch(url)).blob() });
  return `${name}: ${res.status} ${r.domElement.width}x${r.domElement.height}`;
}
export async function both(tag) { setup(); const a = await shot(tag + '_toan'); medium(); const b = await shot(tag + '_trung'); return a + ' | ' + b; }
