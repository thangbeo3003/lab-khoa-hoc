// Ô "BÊN TRONG ỐNG" ở bảng trái (define mục 18, đợt A · 27/11): sơ đồ hạt 3D của ống vừa nhỏ, ba nhịp ① Trước khi nhỏ ② Gặp nhau ③ Sau phản ứng.
// Không tự nghĩ ra hạt: mô hình lấy từ kho hoá học qua free/ionmodel.js (phương trình ion thu gọn, ion đứng ngoài), hình do free/process3d.js của Lab 2 dựng.
// Tệp này chỉ quyết định: đang soi ống nào, đang ở cảnh nào (ống trống · chờ nhỏ · đang nhỏ · đã phản ứng · không phản ứng) và lời chú thích từng nhịp.
import { h } from '../../shell/shell.js';
import { newTube, add, DROP_ML } from '../../free/tubechem.js';
import { buildModel, population, entering } from '../../free/ionmodel.js';
import { mountProcess3D } from '../../free/process3d.js';

const PHASE = ['Trước khi nhỏ', 'Gặp nhau', 'Sau phản ứng'], SHORT = ['Trước', 'Gặp nhau', 'Sau']; // nút ghi tên ngắn cho vừa bảng hẹp, tên đầy đủ ở chú thích khi rê chuột
const NUM = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu'], Cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' và ' + a[a.length - 1] : a[0] || '');
const count = (x) => `${NUM[x.n] || x.n} ${x.label}`;

// Thử nhỏ MỘT giọt vào bản sao của ống: có phản ứng thì trả mô hình hạt của phản ứng đó, không thì null. Ống thật không bị đụng tới.
function preview(tube, chem) {
  if (!chem || chem === 'H2O') return null;
  const c = structuredClone(tube), rx = add(c, chem, { mL: DROP_ML, drop: true }).events.find((e) => e.kind === 'reaction' && e.r && e.r.eq);
  try { return rx ? buildModel(rx, c) : null; } catch { return null; }
}
// Ống không có phản ứng: chỉ bày các hạt đang có trong ống (population), không có cặp nào gặp nhau.
function still(tube) {
  const pop = Object.values(population(tube)), species = {}, terms = [];
  pop.forEach((p) => { species[p.label] = { label: p.label, plain: p.plain, kind: p.kind === 'ppt' ? 'solid' : p.kind, color: p.color }; terms.push({ f: p.plain, label: p.label, coef: 1, source: 'in', kind: p.kind, parts: [{ label: p.label, n: p.kind === 'ion' ? 4 : 2 }] }); });
  return pop.length ? { species, terms, prods: [], lhs: [], rhs: [], spect: [], nr: 1, perEq: 0, excess: terms.map(() => 0), ionic: '', usesIons: true, labels: pop.map((p) => p.label) } : null;
}
// Chất nhỏ vào KHÔNG phản ứng với mẫu (đợt B): các ion của mẫu ở trong ống, phân tử chất nhỏ rơi vào, chạm ion âm rồi tách ra, không sinh hạt mới.
// Hạt của mẫu lấy từ một ống sạch chứa đúng mẫu đó (salt), hạt của chất nhỏ lấy từ entering() của kho: không lẫn các ion đi kèm trong dung dịch thuốc thử.
function bounce(salt, chem, reagent, res) {
  const base = newTube(); if (salt && salt !== 'H2O') add(base, salt, { mL: 2 });
  const ins = Object.values(population(base)), X = entering(chem, DROP_ML).find((p) => p.kind === 'mol'); if (!X) return null;
  const species = {}, sp = (p, kind) => { species[p.label] = { label: p.label, plain: p.plain, kind, color: p.color }; return p.label; };
  const terms = ins.map((p) => ({ f: p.plain, label: sp(p, p.kind), coef: 1, source: 'in', kind: p.kind, parts: [{ label: p.label, n: 4 }] }));
  terms.push({ f: X.plain, label: sp(X, 'mol'), coef: 1, source: 'add', kind: 'mol', parts: [{ label: X.label, n: 3 }] });
  const anion = ins.find((p) => /⁻$/.test(p.label)), names = list(ins.map((p) => p.label)), tail = res && res.phenomenon && res.phenomenon !== 'Không đổi.' ? ' ' + res.phenomenon : '';
  const caps = anion
    ? [`Trong ống có ${names}. ${Cap(reagent)} (${X.label}) từ trên nhỏ xuống.`, `${X.label} chạm ${anion.label} rồi tách ra: ${X.label} không lấy được electron của ${anion.label}.`, `Không có hạt mới: ${names} vẫn như cũ. Màu trong ống là màu của chính ${X.label}.${tail}`]
    : [`Trong ống chỉ có nước cất. ${Cap(reagent)} (${X.label}) từ trên nhỏ xuống.`, `${X.label} tan vào nước, không gặp ion nào để phản ứng.`, `Trong ống chỉ có ${X.label}: đây là màu của chính ${reagent}, dùng để so với các ống khác.`];
  return { m: { species, terms, prods: [], lhs: anion ? [{ label: X.label, n: 1 }, { label: anion.label, n: 1 }] : [], rhs: [], spect: [], nr: 1, perEq: anion ? 3 : 0, excess: terms.map(() => 0), ionic: '', usesIons: true, bounce: true, play: true }, caps };
}
// Lời chú thích ba nhịp của một phản ứng, viết từ chính mô hình (không viết cứng theo cặp chất).
function captions(m, reagent, res) {
  const inside = [...new Set(m.terms.filter((t) => t.source !== 'add').flatMap((t) => t.parts.map((p) => p.label)))];
  const mol = m.lhs.find((x) => m.species[x.label].kind === 'mol'), ion = m.lhs.find((x) => m.species[x.label].kind === 'ion');
  const meet = mol && ion ? `${Cap(count(mol))} gặp ${count(ion)} và lấy electron của ${ion.n > 1 ? 'chúng' : 'nó'}.` : `Các hạt gặp nhau theo tỉ lệ: ${m.ionic}.`;
  const out = `Tạo ra ${list(m.rhs.map(count))}.` + (m.spect.length ? ` ${list(m.spect.map((x) => x.label))} không đổi.` : '') + (res && res.phenomenon ? ' ' + res.phenomenon : '');
  return [`Trong ống có ${list(inside)}. ${Cap(reagent)}${mol ? ` (${mol.label})` : ''} từ trên nhỏ xuống.`, meet, out];
}

// live(): ô có đang được dùng không (bước có ô và ô đang nằm trong trang); không dùng thì bộ máy hạt không vẽ gì, không tốn máy.
export function createParticleBox({ live, reagentName, onBig }) {
  const title = h('b'), cap = h('p', { class: 'hg-p3-cap', role: 'status' }), empty = h('div', { class: 'hg-p3-empty' });
  const note = h('small', { class: 'hg-p3-note', text: 'Sơ đồ hạt: không vẽ nước, không theo tỉ lệ' });
  const stage = h('div', { class: 'hg-p3-stage', title: 'Kéo để xoay' }, empty, note); // nút ba nhịp và dòng ghi chú nằm NGAY TRONG khung tối, để ô không cao thêm
  let p3 = null, sig = '', runKey = '', model = null, n = 0;
  const steps = PHASE.map((t, k) => h('button', { type: 'button', title: t, onclick: () => { if (p3 && model && model.play) { p3.pause(k === 0); p3.goto(k + 1); } } }, `${'①②③'[k]} ${SHORT[k]}`));
  const stepRow = h('div', { class: 'hg-p3-steps', role: 'group', 'aria-label': 'Ba nhịp của phản ứng' }, steps);
  const again = h('button', { class: 'hg-p3-again', type: 'button', onclick: () => { if (p3 && model && model.play) { p3.pause(false); p3.goto(2); } } }, 'Xem lại');
  const bigBtn = h('button', { class: 'hg-p3-again hg-p3-big', type: 'button', title: 'Mở ô này lớn hơn ở ngăn dưới bàn', onclick: () => onBig && onBig() }, 'Phóng to');
  const el = h('section', { class: 'hg-p3', 'aria-label': 'Bên trong ống: sơ đồ hạt' },
    h('header', {}, title, h('span', { class: 'hg-p3-btns' }, again, bigBtn)), stage, cap);
  stage.append(stepRow);
  const engine = () => p3 || (p3 = mountProcess3D(stage, { live: () => el.isConnected && live(), onPhase: (k, text) => { steps.forEach((b, i) => b.classList.toggle('is-on', i === k - 1)); cap.textContent = text || ''; } }));
  const put = (m, caps, key) => { model = m; m.key = key; if (m.rhs.length) m.play = true; engine().set(m, caps); el.classList.toggle('is-still', !m.play); stage.dataset.empty = ''; };
  function blank(text) { model = null; if (p3) p3.set(null); stage.dataset.empty = '1'; empty.textContent = text; cap.textContent = ''; el.classList.add('is-still'); }

  // id: mã ống · name: tên ống · tube: sổ sách ống (free/tubechem.js) · salt: mẫu ban đầu của ống · chem: chất sắp nhỏ hoặc đang nhỏ
  // res: kết quả gần nhất CÓ phản ứng của ống này · last: kết quả gần nhất bất kỳ · running: đang nhỏ
  function show({ id, name, tube, salt, chem, res, last, running }) {
    const s = [id, tube ? tube.vol.toFixed(3) : 0, res ? res.n : 0, last ? last.n : 0, running ? 1 : 0, chem].join('|'); if (s === sig) return; sig = s;
    title.textContent = `Bên trong · ${name}`; title.title = `Bên trong ống: ${name}`;
    if (!tube || !(tube.vol > 0)) return blank('Lấy mẫu vào ống này để xem các hạt bên trong.');
    const reagent = reagentName(chem);
    if (running) { // đang nhỏ: hạt của chất nhỏ rơi vào, từng cặp gặp nhau, chạy cùng lúc với cận cảnh trên bàn
      const m = preview(tube, chem); runKey = `${id}|${chem}`;
      if (m) { put(m, captions(m, reagent, null), `run|${id}|${chem}|${++n}`); p3.pause(false); p3.goto(2); return; }
      const b = bounce(salt, chem, reagent, null); if (b) { put(b.m, b.caps, `runb|${id}|${chem}|${++n}`); p3.pause(false); p3.goto(2); return; }
    } else if (res && res.ev) { // đã có phản ứng: giữ nguyên hoạt cảnh đang chạy của đúng lần nhỏ đó, chỉ bổ sung lời hiện tượng; mở lại trang thì đứng ở nhịp ③
      let m = null; try { m = buildModel(res.ev, tube); } catch { m = null; }
      if (m) { const caps = captions(m, reagentName(res.chem), res), cont = runKey === `${id}|${res.chem}` && model && model.rhs.length; runKey = '';
        if (cont) { engine().set(model, caps); return; }
        put(m, caps, `done|${id}|${res.n}`); p3.pause(false); p3.goto(3); return; }
    } else if (last && last.chem !== 'H2O' && last.kind === 'none') { // đã nhỏ mà không phản ứng: giữ hoạt cảnh đang chạy, hoặc đứng ở nhịp ③
      const b = bounce(salt, last.chem, reagentName(last.chem), last), cont = runKey === `${id}|${last.chem}` && model && model.bounce; runKey = '';
      if (b) { if (cont) { engine().set(model, b.caps); return; } put(b.m, b.caps, `doneb|${id}|${last.n}`); p3.pause(false); p3.goto(3); return; }
    } else { // có mẫu, chưa nhỏ: đứng ở nhịp ① (các ion của muối trong ống, phân tử chất sắp nhỏ ở phía trên)
      const m = preview(tube, chem);
      if (m) { put(m, captions(m, reagent, null), `pre|${id}|${chem}|${tube.vol.toFixed(3)}`); p3.goto(1); p3.pause(true); return; }
      const b = chem !== 'H2O' && bounce(salt, chem, reagent, null); if (b) { put(b.m, b.caps, `preb|${id}|${chem}|${tube.vol.toFixed(3)}`); p3.goto(1); p3.pause(true); return; }
    }
    const m = still(tube); if (!m) return blank('Ống này chưa có hạt nào để soi.');
    const text = chem === 'H2O' ? `Chỉ thêm nước cất: ${list(m.labels)} vẫn như cũ, không có hạt mới.` : `Trong ống có ${list(m.labels)}. Không có hạt mới sinh ra.`;
    put(m, [text, text, text], `still|${id}|${tube.vol.toFixed(3)}|${m.labels.join()}`); p3.pause(false);
  }
  return { el, show, reset() { sig = ''; }, setBig(on) { el.classList.toggle('is-big', !!on); bigBtn.textContent = on ? 'Thu lại' : 'Phóng to'; bigBtn.title = on ? 'Đưa ô về bảng bên trái' : 'Mở ô này lớn hơn ở ngăn dưới bàn'; } };
}
