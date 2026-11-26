// Bài: Tốc độ phản ứng (Hoá 10), BẢN 3: một phòng lab 4 bàn, mỗi bàn một bộ thí nghiệm đầy đủ, tay làm trên dụng cụ (LUONG_1_BAI_HOC.md mục 2.21 đến 2.24).
// Tệp này nối 10 bước của bài với phòng lab: bước nào đứng ở bàn nào, khi nào tính là "Đã làm", thẻ "Bước này" và "Bảng điều khiển" hiện gì.
// Món đồ, vị trí, việc của từng bàn: giao_an.js. Bộ máy dùng chung: kit/labset.js (phòng, bàn, động tác) và shell/labui.js (nút sinh đôi, bảng kết quả).
// Bản 1 (index.html) và bản 2 (?v=2) giữ nguyên.
import { h, fmt } from '../../shell/shell.js';
import { RunGraph } from '../../shell/graph.js';
import { LifeRace } from '../../shell/life.js';
import { procList, resultTable, bindSafeArea, vcard, benchCard, tuckHandles, zoomBox } from '../../shell/labui.js';
import { createLab } from '../../kit/labset.js';
import { meta, steps, lab as DECL, REF, REF3, WINDOW_CAT, lensSetup, tConc, tTemp, tCat, run3, gasAt3, fmtT, g2 } from './giao_an.js';
import { examPass } from './model3.js';

export { meta, steps };

const LIFE = { title: 'Trong bếp nhà em: viên sủi', factor: 'diện tích bề mặt', doneText: 'Tan hết', speed: 2, gasLabel: 'Khí CO₂ đã thoát ra',
  sides: [{ label: 'Viên nguyên', form: 'vien', seconds: 24 }, { label: 'Viên bẻ vụn', form: 'vun', seconds: 8 }] }; // số của bản 1, chưa dẫn nguồn (F13)
const LENS = [['conc', 'Nồng độ cao hơn', 'như bàn 1'], ['temp', 'Nóng hơn', 'như bàn 2'], ['size', 'Đập nhỏ hơn', 'như bàn 3'], ['cat', 'Có xúc tác', 'như bàn 4']];
const BENCH = Object.fromEntries(DECL.benches.map((b) => [b.id, b]));
const TOUR = DECL.benches.map((b) => b.id);

export function createLesson(shell) {
  // Phòng mặc định là căn phòng ảnh thật khai trong giao_an.js (chủ 20/11: "Lấy làm mặc định"). Thêm &room=tron vào link để xem lại phòng trơn.
  if (/[?&]room=tron(?![\w])/.test(location.search)) delete (DECL.mode3d || DECL).room;
  // Kiểu thuỷ tinh: chủ 20/11 chốt "Kiểu E" làm mặc định (chai, lọ, bình, ống đong dùng ảnh dụng cụ của trang Thực hành, kit/glasslook.js).
  // Xem lại kiểu khác: &kinh=a (kính 3D cũ), b (ánh sáng viền), c (khúc xạ), d (b + c).
  { const k = /[?&]kinh=([a-e])(?![\w])/.exec(location.search), g = k ? k[1] : 'e'; if (g !== 'a') DECL.glass = g; }
  const lab = createLab(shell.els.stage, DECL), stage = lab.stage;
  shell.els.stage.closest('.lk').classList.add('is-v3'); // để khoanh kiểu dáng riêng của bản 3 (màu "xong" dùng xanh lime của logo)
  const D = shell.state.data; // phần được lưu: bước đã làm, kết luận đã mở, bảng kết quả của từng bước, bàn đã xem
  D.done = D.done || {}; D.reveal = D.reveal || {}; D.picks = D.picks || []; D.rows = D.rows || {};
  shell.state.step = 0; // mỗi lần mở bài đều bắt đầu ở bước 1 (kết quả đã làm vẫn giữ)
  const S = { step: 0, picks: new Set(D.picks), tour: null, tags: true, at: {}, lens: { conc: false, temp: false, size: false, cat: false }, changed: new Set(), life: null, ui: null, acc: 0, moved: false };
  const rows = (i) => D.rows[i] || (D.rows[i] = []);
  // Ảnh nhỏ của từng bàn cho thẻ hình ở bước 1: chụp ngay trong cảnh 3D khi đang ở toàn cảnh và người học chưa xoay máy quay.
  S.thumbs = {};
  function makeThumbs() {
    if (S.step !== 0 || shown || cam0) return;
    const ins = syncInsets.insets(); TOUR.forEach((id) => { S.thumbs[id] = lab.snapshot(id, ins); });
    lab.view('all', true); shell.rerenderPanel();
  }
  setTimeout(makeThumbs, 1500); setTimeout(makeThumbs, 4500); // lần hai: khi ảnh tường đã tải xong

  const eqCard = h('div', { class: 'lk-eqcard is-bottom', hidden: true }), toastEl = h('div', { class: 'lk-toast', hidden: true, role: 'status' });
  const resetBtn = h('button', { class: 'lk-btn lk-reset', type: 'button', hidden: true, onclick: () => stage.resetView() }, '⟲ Về góc chuẩn');
  shell.els.stage.append(eqCard, toastEl, resetBtn);
  // Chạm vào một món cũng làm máy quay báo "đã chạm"; chỉ khi góc nhìn đổi thật mới hiện nút về góc chuẩn (và mới tính là đã xoay ở bước 1)
  let cam0 = null;
  stage.setMoveHandler((moved) => { cam0 = moved ? stage.camera.position.clone() : null; resetBtn.hidden = true; });
  stage.onFrame((dt) => { lab.update(dt); tick(dt); });
  let toastT = 0;
  const toast = (text) => { toastEl.textContent = text; toastEl.hidden = false; toastT = 5; };
  const tagBtn = h('button', { class: 'lk-btn lk-act is-on', type: 'button', 'aria-pressed': 'true', onclick: () => { S.tags = !S.tags; tagBtn.classList.toggle('is-on', S.tags); tagBtn.setAttribute('aria-pressed', String(S.tags)); lab.setNames(S.tags); } }, 'Tên dụng cụ');
  shell.els.actions.append(tagBtn);

  // ---------- Cảnh: vùng an toàn, tới bàn ----------
  const syncInsets = bindSafeArea(shell, stage, () => (eqCard.hidden ? 0 : eqCard.offsetHeight));
  tuckHandles(shell, () => requestAnimationFrame(() => syncInsets())); // nút thu gọn hai bảng nổi: bảng thu vào thì cảnh 3D lấy lại chỗ
  zoomBox(lab, shell.els.stage); // thanh mức zoom − 100% + ở góc trên của cảnh
  let shown = null;
  function showEq(id) {
    const b = id && BENCH[id]; eqCard.hidden = !b; if (!b) return;
    const cond = typeof b.cond === 'function' ? b.cond(lab.benches[id]) : b.cond; // điều kiện có thể đổi theo lượng đang đong, cân
    eqCard.replaceChildren(h('small', {}, h('i', { style: `background:${b.color}` }), b.name), h('b', { text: b.eq }), cond && h('em', { text: cond }));
  }
  function focus(id) { shown = id || null; lab.setActive(shown); showEq(shown); syncInsets(); lab.view(shown || 'all'); }
  function pick(id) {
    if (S.step !== 0 || !BENCH[id]) return;
    S.picks.add(id); D.picks = [...S.picks]; shell.save(); S.tour = id; focus(id); check(); shell.refresh(); shell.rerenderPanel();
  }
  lab.on('pick', pick);
  lab.on('say', toast);
  lab.on('mark', (bid, m) => { if (m.say) toast(m.say); }); // một bình vừa phản ứng xong: nhãn của bình đổi màu và nháy (bộ máy làm), kèm lời báo
  lab.on('change', (bid) => { if (shown === bid) showEq(bid); if (S.ui && S.ui.bench === bid) syncProc(); });
  lab.on('done', (bid, row) => {
    const i = S.step; if (steps[i].bench !== bid || !row) return;
    row.at = Date.now(); // thời điểm chạy: chạy lại một mức cũ thì dòng giữ chỗ trong bảng, nhưng kết luận vẫn biết đó là lần gần nhất
    const list = rows(i), at = list.findIndex((r) => r.key === row.key);
    if (at >= 0) list[at] = row; else list.push(row); if (list.length > 6) list.shift();
    const was = !!D.done[i];
    shell.save(); syncTable(); check(); if (was) shell.refresh(); // bước đã làm rồi: viết lại kết luận theo lần chạy mới
    toast(doneSay(bid, row));
  });
  const vHalf = (r) => r.vHalf ?? r.vEnd / 2; // nửa lượng khí mà "nửa khí sau" nói tới (dòng lưu từ trước 21/11 chưa có vHalf)
  // Lời báo khi một lần chạy xong. Bàn 3 hết giờ đo mà khí còn ra chậm (r.slow): nói đúng số đang đọc được, không nói "dừng ở".
  const doneSay = (bid, r) => (bid === 'cat' ? (r.over ? `Xi-lanh của bình có MnO₂ ĐẦY ở 100 mL trước khi hết ${WINDOW_CAT} s: lượng H₂O₂ này sinh nhiều khí hơn sức chứa của xi-lanh. Bình không có MnO₂ vẫn gần như chưa có khí.` : `Xong: sau ${WINDOW_CAT} s bình có MnO₂ cho ${r.exp} khí, bình không có MnO₂ cho ${r.ref}.`)
    : r.over ? 'Xi-lanh ĐẦY ở 100 mL nên không đo tiếp được: lượng đá vôi này sinh nhiều khí hơn sức chứa của xi-lanh. Rửa bình và cân ít đá vôi hơn.'
      : r.solo ? (r.slow ? `Hết ${fmt(r.w, 0)} s đo, xi-lanh mới được ${fmt(r.vEnd, 1)} mL và khí vẫn còn ra chậm. Nửa lượng khí tính theo phương trình (${fmt(vHalf(r), 1)} mL) đã thu được sau ${r.ref}.` + (r.left ? ' Acid ít hơn mức cần nên đá vôi sẽ còn thừa.' : '')
        : `Xong: thu nửa lượng khí (${fmt(vHalf(r), 1)} mL) sau ${r.ref}.` + (r.left ? ' Acid hết trước nên đá vôi còn thừa dưới đáy.' : ''))
        : bid === 'surf' ? (r.slow ? `Hết ${fmt(r.w, 0)} s đo: đập nhỏ được ${fmt(r.vEnd, 1)} mL, viên mới được ${fmt(r.vRef, 1)} mL và vẫn còn ra khí chậm. Nửa lượng khí: đập nhỏ sau ${r.exp}, viên sau ${r.ref}, nhanh gấp ${r.ratio}.` + (r.left ? ' Acid ít hơn mức cần nên đá vôi sẽ còn thừa.' : '')
          : `Xong: đập nhỏ thu nửa lượng khí sau ${r.exp}, viên sau ${r.ref}, nhanh gấp ${r.ratio}. Cả hai dừng ở khoảng ${fmt(r.vEnd, 0)} mL.` + (r.left ? ' Acid hết trước nên đá vôi còn thừa: lượng khí lần này do lượng acid quyết định.' : ''))
        : `Xong: bình thí nghiệm ${r.exp}, đối chứng ${r.ref}, nhanh gấp ${r.ratio}.`);

  // ---------- Khi nào một bước tính là "Đã làm" ----------
  const distinct = (i) => new Set(rows(i).map((r) => r.key)).size;
  const DONE = [
    () => S.moved || S.picks.size > 0,
    () => rows(1).length >= 1,
    () => distinct(2) >= 2, () => distinct(3) >= 2, () => rows(4).length >= 1, () => rows(5).length >= 1,
    () => S.changed.size >= 3,
    () => rows(7).some((r) => r.level.temp !== REF.temp), // nồng độ của bình thí nghiệm luôn khác đối chứng; thêm nhiệt độ là thành hai thứ
    () => !!(S.life && S.life.done),
    () => rows(9).some((r) => examPass(r.te)), // khoảng 14 đến 16 s: model3.js EXAM
  ];
  function check() {
    const i = S.step; if (D.done[i] || !DONE[i]()) return;
    D.done[i] = true; shell.save(); shell.refresh();
    if (i === 9) toast('ĐẠT: chữ X của bình thí nghiệm mất trong khoảng 14 đến 16 giây.');
  }

  // ---------- Mỗi khung hình ----------
  const lensObj = lab.benches.lens.items.lens.obj.userData;
  const lensK = () => ({ conc: S.lens.conc ? 0.3 : REF.conc, temp: S.lens.temp ? 55 : REF.temp, size: S.lens.size ? 'vun' : 'vien', cat: S.lens.cat });
  function tick(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.hidden = true; }
    if (cam0 && resetBtn.hidden && stage.camera.position.distanceTo(cam0) > 0.08) { resetBtn.hidden = false; if (S.step === 0) { S.moved = true; check(); } }
    if (S.life) { S.life.advance(dt); if (S.step === 8) check(); }
    S.acc += dt; if (S.acc >= 0.1) { S.acc = 0; syncRead(); }
  }

  // ---------- Bảng điều khiển (phải) ----------
  function readout(i) {
    const b = steps[i].bench;
    if (i === 0) return { label: 'Phòng lab hôm nay có', big: '4', unit: 'bàn thí nghiệm', cells: [['Mỗi bàn', '2 bình'], ['Đo bằng', 'đồng hồ'], ['Đã xem', `${TOUR.filter((id) => S.picks.has(id)).length}/${TOUR.length}`]] };
    if (b === 'lens') { const o = lensSetup(lensK()); return { label: 'Va chạm hiệu quả mỗi giây (trên tivi)', big: fmt(lensObj.rate(), 1), unit: 'lần/s', cells: [['Số hạt', String(o.count)], ['Hạt đủ năng lượng', Math.round(o.hot * 100) + '%'], ['Độ nhanh của hạt', '×' + fmt(o.speed, 2)]] }; }
    if (b) return BENCH[b].chem.read(lab.benches[b]);
    const L = S.life, st = L && L.done ? 'tan hết' : L && L.playing ? 'đang sủi' : 'chưa thả';
    return { label: 'Hai viên sủi trong hai cốc nước', big: st, unit: '', cells: [['Viên nguyên', L && L.done ? '24 s' : '–'], ['Viên bẻ vụn', L && L.done ? '8 s' : '–'], ['Nhanh gấp', L && L.done ? '3 lần' : '–']] };
  }
  function syncRead() {
    const ui = S.ui; if (!ui) return;
    const r = readout(S.step); ui.label.textContent = r.label; ui.big.textContent = r.big; ui.unit.textContent = r.unit;
    r.cells.forEach((c, n) => ui.cells[n].set(c[0], c[1]));
    if (ui.graph) {
      const B = lab.benches.surf, C = BENCH.surf.chem, t = B.run ? Math.min(B.run.t, C.window(B)) : 0, cut = (run) => [...run.points.filter((p) => p[0] <= t), [t, gasAt3(run, t)]];
      const vEnd = C.runs(B)[1].vEnd, full = vEnd >= 100; // đường tham chiếu: lượng khí cuối tính được, hoặc vạch 100 mL nếu xi-lanh sẽ đầy
      ui.graph.o.yMax = vEnd > 76 ? 120 : 80; ui.graph.o.ref = full ? 100 : vEnd; ui.graph.o.refLabel = full ? 'xi-lanh đầy ở 100 mL' : `tối đa ${fmt(vEnd, 0)} mL`;
      ui.graph.set(B.run ? C.series(B).map((x) => ({ points: cut(x.run).map(([a, v]) => [a, Math.min(v, 100)]), color: x.color, label: x.label, live: !B.run.done })) : []);
    }
  }
  const put = (host, ...kids) => host.append(...kids.flat(3).filter(Boolean)); // append() biến false/null thành chữ, nên lọc trước
  const ph = (title, hint) => h('div', { class: 'lk-ph' }, h('b', { text: title }), h('span', { text: hint }));
  function syncProc() { const ui = S.ui; if (ui && ui.proc) { ui.proc.replaceChildren(); put(ui.proc, procList(lab, ui.bench)); } }
  function syncTable() { const ui = S.ui; if (ui && ui.table) ui.table.replaceChildren(resultTable(rows(S.step), BENCH[ui.bench].cols)); }
  function sw(name, sub, text, checked, onchange) {
    return h('div', { class: 'lk-knob is-now' }, h('div', { class: 'lk-knob-h' }, h('span', {}, name, h('small', { text: ' · ' + sub })), h('b', { class: 'lk-kv', text }),
      h('input', { type: 'checkbox', class: 'lk-sw', role: 'switch', 'aria-label': name, checked: checked || null, onchange })));
  }
  function renderPanel(i, host) {
    const b = steps[i].bench, real = b && b !== 'lens', cells = [0, 1, 2].map(() => vcard()), label = h('span'), big = h('b'), unit = h('em'); // ba THẺ HÌNH số đo: icon + nhãn + giá trị
    const hasGraph = b === 'surf', gHost = hasGraph && h('div'), proc = real && h('div'), table = real && h('div');
    put(host, ph('Bảng điều khiển', real ? 'Tay làm trên bàn, hoặc bấm nút cùng số' : i === 0 ? 'Chạm một bàn để tới gần' : 'Điều khiển của bước này'),
      h('div', { class: 'lk-read' }, label, h('div', {}, big, unit)),
      h('div', { class: 'lk-vcards' }, cells.map((c) => c.el)),
      i === 0 && h('ul', { class: 'lk-blist' }, TOUR.map((id) => benchCard({ name: BENCH[id].name, color: BENCH[id].color, done: S.picks.has(id), on: S.tour === id, thumb: S.thumbs[id], onPick: () => pick(id),
        text: typeof BENCH[id].cond === 'function' ? BENCH[id].cond(lab.benches[id]) : BENCH[id].cond }))), // thẻ hình: mỗi bàn một ảnh chụp thật trong cảnh 3D
      real && [h('h3', { class: 'lk-sub', text: 'Việc của bàn này' }), proc, h('div', { class: 'lk-box' }, h('h3', { text: 'Bảng kết quả' }), table)],
      b === 'lens' && LENS.map(([id, name, sub]) => sw(name, sub, S.lens[id] ? 'bật' : 'tắt', S.lens[id], (e) => { S.lens[id] = e.target.checked; S.changed.add(id); lensObj.set(lensSetup(lensK())); toast(`${name}: ${S.lens[id] ? 'bật' : 'tắt'}. Nhìn tivi: số va chạm hiệu quả mỗi giây.`); shell.rerenderPanel(); check(); })),
      i === 8 && sw('Thả viên sủi', 'trong bếp', S.life && S.life.done ? 'tan hết' : S.life && S.life.playing ? 'đang sủi' : 'chưa thả', S.life && (S.life.playing || S.life.done), (e) => { if (e.target.checked && S.life) { S.life.play(); toast('Hai viên cùng xuống nước: viên bẻ vụn sủi mạnh hơn hẳn.'); } shell.rerenderPanel(); }),
      hasGraph && h('div', { class: 'lk-box' }, h('h3', { text: 'Thể tích khí CO₂ theo thời gian' }), gHost));
    S.ui = { label, big, unit, cells, bench: real ? b : null, proc, table, graph: hasGraph ? new RunGraph(gHost, { yMax: 80, yTitle: 'mL', ref: 74.4, refLabel: '' }) : null };
    syncRead(); syncProc(); syncTable();
  }

  // ---------- Thẻ "Bước này" (trái): câu hỏi → bàn → Làm thử → Kết luận tự hiện khi đạt đích ----------
  const where = (id) => { const b = BENCH[id]; return h('p', { class: 'lk-where' }, h('i', { class: 'lk-dot', style: `background:${b.color}` }), h('span', {}, h('b', { text: b.name + '. ' }), b.text, b.note ? ' ' + b.note : '')); };
  const best = (i, f, fallback) => { const r = rows(i).filter(f).sort((a, c) => a.te - c.te)[0]; return r || fallback; };
  // Lần chạy GẦN NHẤT của bước i (thoả f): theo thời điểm chạy; dòng cũ chưa có thời điểm thì theo thứ tự trong bảng.
  const latest = (i, f = () => true) => rows(i).map((r, n) => [r.at || 0, n, r]).filter((x) => f(x[2])).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map((x) => x[2]).pop() || null;
  // Kết luận của từng bước: [câu kết luận viết từ số vừa đo, các ý chính, "bỏ bước này thì…"]
  function conclusion(i) {
    const k = (a, c) => fmt(a / c, 1);
    switch (i) {
      case 0: return ['Phòng có 4 bàn, mỗi bàn đổi đúng một thứ: nồng độ, nhiệt độ, bề mặt tiếp xúc, chất xúc tác. Bàn nào cũng có đủ dụng cụ của riêng nó: một bình đối chứng, một bình thí nghiệm, hoá chất và dụng cụ đo.', ['Bình đối chứng để so: nó chỉ khác bình thí nghiệm đúng một thứ.', 'Tivi trên tường sau chiếu mô hình phóng to tới mức hạt.'], 'các bước sau không biết đang đứng ở đâu trong phòng.'];
      case 1: {
        // HAI bình (chủ 25/11: "thiếu bình so sánh này"): đá vôi viên và đá vôi đập nhỏ, cùng 20 mL acid, cùng 0,30 g. Viết từ lần chạy gần nhất; chưa chạy thì nói rõ là số của mức bài.
        // Bình thường: cùng nửa lượng khí, mỗi bình cần bao lâu, tốc độ trung bình mL/s của từng bình. Xi-lanh bình đập nhỏ đầy: tính trên 100 mL và thời gian tới lúc đầy.
        const E = run3('vun', REF3.mass, REF3.vAcid), R = run3('vien', REF3.mass, REF3.vAcid), mine = latest(1);
        const r = mine || { te: E.tHalf, tr: R.tHalf, vHalf: E.vEnd / 2 }, head = mine ? '' : `Ở mức của bài (mỗi bình ${g2(REF3.mass)} đá vôi · ${REF3.vAcid} mL acid), mô hình tính ra: `;
        const extra = r.slow ? ' Lần này hết giờ đo mà bình đá viên vẫn còn ra khí chậm.' : r.left ? ' Lần này acid hết trước nên đá vôi còn thừa.' : '';
        const main = r.over ? `Xi-lanh bình đá vôi đập nhỏ đầy 100 mL sau ${fmt(r.te, 1)} s, tức trung bình ${fmt(100 / r.te, 2)} mL mỗi giây; lần này không đọc được nửa lượng khí của bình đập nhỏ.`
          : `Cùng thu ${fmt(vHalf(r), 1)} mL khí (nửa lượng khí): bình đá vôi đập nhỏ cần ${fmt(r.te, 1)} s, trung bình ${fmt(vHalf(r) / r.te, 2)} mL mỗi giây; bình đá vôi viên cần ${fmt(r.tr, 1)} s, chỉ ${fmt(vHalf(r) / r.tr, 2)} mL mỗi giây. Bình đập nhỏ nhanh gấp ${k(r.tr, r.te)} lần.`;
        return [head + main + ' Tốc độ phản ứng = lượng chất biến đổi : thời gian.' + extra, ['Đo được nhờ hai dụng cụ: xi-lanh cho biết lượng khí, đồng hồ cho biết thời gian.', 'Càng về sau khí ra càng chậm, vì chất phản ứng vơi dần.'], 'chỉ nói được bình nào nhanh hơn, không nói được nhanh gấp mấy.'];
      }
      case 2: { const r = best(2, (x) => x.level.conc !== REF.conc, { te: tConc({ ...REF, conc: 0.3 }), tr: tConc(REF), cond: '0,30 M' }); return [`Bình thí nghiệm ${r.cond}: chữ X mất sau ${fmtT(r.te)}, bình đối chứng 0,05 M mất sau ${fmtT(r.tr)}, nhanh gấp ${k(r.tr, r.te)} lần. Nồng độ chất phản ứng càng lớn thì tốc độ phản ứng càng lớn.`, ['Chỉ đổi nồng độ, giữ nguyên nhiệt độ và lượng acid.', 'Với chất khí, tăng áp suất cũng là tăng nồng độ.'], 'không giải thích được vì sao ở bước 2 khí ra chậm dần.']; }
      case 3: { const r = best(3, (x) => x.level.temp !== REF.temp, { te: tTemp({ temp: 45 }), tr: tTemp(REF), cond: '45 °C' }); return [`Ống thí nghiệm ${r.cond}: hoá hồng sau ${fmtT(r.te)}, ống đối chứng 25 °C sau ${fmtT(r.tr)}, nhanh gấp ${k(r.tr, r.te)} lần. Nhiệt độ càng cao thì tốc độ phản ứng càng lớn.`, ['Hệ số Van\'t Hoff γ: tăng 10 °C thì nhanh gấp 2 đến 4 lần (mô hình này dùng γ = 2).', 'Không thêm chất nào: chỉ có hạt chuyển động nhanh hơn.'], 'tưởng muốn nhanh thì chỉ có cách pha đặc, không hiểu vì sao tủ lạnh giữ được thức ăn.']; }
      case 4: {
        // Kết luận viết từ lần chạy "sạch" gần nhất (đá tan hết, xi-lanh không đầy, cả hai bình xong trong giờ đo); chưa có thì dùng số của mức bài.
        const last = latest(4), E = run3('vun', REF3.mass, REF3.vAcid), R = run3('vien', REF3.mass, REF3.vAcid);
        const mine = latest(4, (x) => !x.over && !x.left && !x.slow), r = mine || { te: E.tHalf, tr: R.tHalf, vEnd: R.vEnd, cond: `${g2(REF3.mass)} · ${REF3.vAcid} mL` };
        const head = mine ? `Mỗi bình ${r.cond} acid: ` : `Ở mức của bài (mỗi bình ${r.cond} acid), mô hình tính ra: `; // chưa có lần chạy sạch thì nói rõ đây là số của mức bài, không phải số em vừa đo
        const extra = last && last.over ? ' Lần em vừa làm, xi-lanh đầy ở 100 mL nên không đọc được lượng khí cuối: dụng cụ đo cũng có giới hạn.'
          : last && last.slow ? ` Lần em vừa làm (${last.cond}), hết giờ đo mà khí vẫn còn ra chậm: càng về cuối đá vôi và acid đều vơi nên phản ứng chậm dần.`
            : last && last.left ? ' Lần em vừa làm, acid hết trước nên đá vôi còn thừa và lượng khí do acid quyết định.' : '';
        return [head + `đá vôi đập nhỏ thu nửa lượng khí sau ${fmtT(r.te)}, đá vôi viên sau ${fmtT(r.tr)}, nhanh gấp ${k(r.tr, r.te)} lần. Hai xi-lanh vẫn dừng ở cùng khoảng ${fmt(r.vEnd, 0)} mL. Diện tích bề mặt tiếp xúc càng lớn thì tốc độ càng lớn.` + extra, ['Nhanh hơn không có nghĩa là nhiều hơn: cùng số gam đá vôi thì cùng lượng khí.', 'Muốn nhiều khí hơn thì phải cân nhiều đá vôi hơn (và đủ acid): rửa bình, đổi con số rồi thử lại.', 'Chỉ lớp ngoài của chất rắn chạm được dung dịch.'], 'không trả lời được câu bột mì, và giữ nguyên hiểu lầm "nhanh thì nhiều".'];
      }
      case 5: {
        // Không viết thời gian chờ khi không có MnO₂: hằng số tốc độ của bình đối chứng là số minh hoạ, chưa có nguồn (facts.md). Chỉ nói điều xi-lanh cho thấy trong giờ đo.
        const c = tCat({ cat: true }), r = latest(5);
        const seen = !r ? '' : r.over ? `Bình có MnO₂ làm xi-lanh đầy 100 mL trước khi hết ${WINDOW_CAT} s, bình không có MnO₂ cho ${r.ref}. ` : `Sau ${WINDOW_CAT} s bình có MnO₂ cho ${r.exp} khí O₂, bình không có MnO₂ cho ${r.ref}. `;
        return [seen + `Có MnO₂ thì nửa lượng O₂ thoát ra sau ${fmtT(c)} (số của mô hình). Không có MnO₂ thì trong ${WINDOW_CAT} s xi-lanh gần như chưa nhích: phản ứng vẫn xảy ra nhưng rất chậm. Chất xúc tác làm tăng tốc độ phản ứng.`, ['Sau phản ứng MnO₂ vẫn còn nguyên, không bị tiêu hao.', 'Xúc tác không làm tăng lượng sản phẩm.'], 'thiếu yếu tố thứ tư; không hiểu vai trò của enzyme trong cơ thể.'];
      }
      case 6: return ['Cả bốn cách đều làm tăng số va chạm hiệu quả mỗi giây, nên phản ứng nhanh lên.', ['Nồng độ: nhiều hạt hơn nên va nhau nhiều hơn.', 'Nhiệt độ: hạt nhanh hơn và nhiều hạt đủ năng lượng hơn.', 'Bề mặt: nhiều chỗ để va hơn. Xúc tác: va chạm cần ít năng lượng hơn.'], 'bốn kết luận phải học thuộc rời nhau.'];
      case 7: { const r = best(7, (x) => x.level.temp !== REF.temp, null); return [(r ? `Em đổi cả hai thứ (${r.cond}): nhanh gấp ${k(r.tr, r.te)} lần, ` : 'Đổi cả hai thứ thì phản ứng nhanh lên, ') + 'nhưng không tách được phần của nồng độ và phần của nhiệt độ. Muốn biết một yếu tố ảnh hưởng thế nào thì mỗi lần chỉ đổi một yếu tố.', ['Bình đối chứng tồn tại để so: nó chỉ khác bình thí nghiệm đúng một thứ.'], 'gặp đề hỏi "yếu tố nào" sẽ kết luận sai.']; }
      case 8: return ['Viên sủi bẻ vụn tan nhanh gấp khoảng 3 lần viên nguyên vì bề mặt tiếp xúc với nước lớn hơn. Bột mì cũng vậy: bụi lơ lửng có bề mặt tiếp xúc với không khí rất lớn nên cháy rất nhanh, có thể nổ; bột nén trong bao thì không.', ['Ngoài đời: thái nhỏ thức ăn cho mau chín, để tủ lạnh cho lâu hỏng, dùng men (xúc tác) để ủ.'], 'bài dừng ở phòng thí nghiệm, câu hỏi mở đầu bị bỏ lửng.'];
      default: { const r = best(9, (x) => examPass(x.te), null); return [(r ? `Em chọn ${r.cond}: chữ X mất sau ${fmtT(r.te)}. ` : '') + 'Sát hạch không có nội dung mới: em vừa tự chọn điều kiện, làm đủ một vòng thí nghiệm và đọc số đo.', ['Một cách về 15 s: lọ 0,10 M và làm ấm tới 45 °C.'], '']; }
    }
  }
  function resetStep(i) {
    D.done[i] = false; D.reveal[i] = false; D.rows[i] = [];
    if (i === 0) { S.picks.clear(); D.picks = []; S.moved = false; S.tour = null; focus(null); }
    if (i === 6) { Object.keys(S.lens).forEach((id) => { S.lens[id] = false; }); S.changed.clear(); lensObj.set(lensSetup(lensK())); }
    if (i === 8 && S.life) startLife();
    setBench(i, true);
    shell.save(); shell.refresh(); shell.rerenderPanel(); toast('Đã đặt lại bước: bàn về trạng thái đầu của bước này.');
  }
  function renderCard(i, host) {
    const s = steps[i], done = !!D.done[i], open = done || D.reveal[i], at = i === 0 ? S.tour : s.bench;
    put(host, ph('Bước này', `Bước ${i + 1}/${steps.length} · Câu hỏi → Làm thử → Kết luận`),
      h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short })),
      h('h2', { class: 'lk-q', text: s.q }),
      at && where(at),
      i === 0 && S.tour && h('div', { class: 'lk-cardfoot' }, h('button', { class: 'lk-btn', type: 'button', onclick: () => { S.tour = null; focus(null); shell.refresh(); shell.rerenderPanel(); } }, '‹ Về toàn cảnh')),
      h('div', { class: 'lk-task' }, h('b', {}, 'Làm thử', h('span', { class: 'lk-status' + (done ? ' is-done' : ''), text: done ? 'Đã làm' : 'Chưa làm' })), h('p', { text: s.todo })));
    if (open) {
      const [main, points, without] = conclusion(i);
      put(host, h('div', { class: 'lk-concl' }, h('b', { text: 'Kết luận' }), h('p', { text: main })),
        h('ul', { class: 'lk-ideas' }, points.map((t) => h('li', { text: t })), without && h('li', { class: 'is-without', text: 'Bỏ bước này thì ' + without })));
    }
    put(host, h('div', { class: 'lk-cardfoot' },
      !open && h('button', { class: 'lk-btn is-pri', type: 'button', onclick: () => { D.reveal[i] = true; shell.save(); shell.refresh(); } }, 'Hiện kết luận'),
      h('button', { class: 'lk-btn', type: 'button', onclick: () => resetStep(i) }, 'Đặt lại bước này'),
      done && i < steps.length - 1 && h('button', { class: 'lk-btn', type: 'button', onclick: () => shell.go(i + 1) }, `Sang bước ${i + 2} ›`)));
    requestAnimationFrame(syncInsets);
  }
  function startLife() {
    const box = h('div', { class: 'lf-host' });
    shell.els.overlay.replaceChildren(box); shell.els.overlay.hidden = false;
    S.life = new LifeRace(box, LIFE);
  }
  // Đặt bàn cho một bước: bàn được dọn sạch khi bước khác vừa dùng nó (hoặc khi bấm đặt lại).
  function setBench(i, force) {
    const b = steps[i].bench; if (!b || b === 'lens') return;
    if (!force && S.at[b] === i) return;
    S.at[b] = i;
    if (b === 'surf') lab.solo('surf', null); // cả hai bình luôn có mặt, kể cả bước Thước đo (chủ 25/11: "thiếu bình so sánh này")
    if (i === 1) lab.preset('surf', [['vol', REF3.vAcid], ['fill'], ['mass', REF3.mass]]); else lab.reset(b); // bước Thước đo: đã đong 20 mL mỗi bình, rót và cân 0,30 g mỗi đĩa sẵn
  }

  lensObj.set(lensSetup(lensK()));
  return {
    lab, state: S,
    enter(i) {
      S.step = i; S.ui = null; S.life = null; toastT = 0; toastEl.hidden = true;
      lab.enable('conc', 'temp', i === 7 || i === 9); // bếp điện của bàn 1 chỉ mở ở bước Thao tác sai và Sát hạch
      lensObj.setLive(i === 6 || i === 0); // mô hình hạt trên tivi chỉ chuyển động ở bước xem phòng và bước Nhìn vào trong; lúc làm thí nghiệm tivi đứng yên, mờ đi
      lab.setHands(i !== 0, 'Bước 1 chỉ xem phòng. Sang bước của bàn này để tự tay làm thí nghiệm.');
      setBench(i);
      if (i === 8) startLife();
      focus(i === 0 ? S.tour : steps[i].bench);
      if (i === 0 && !Object.keys(S.thumbs).length) setTimeout(makeThumbs, 400);
    },
    renderCard, renderPanel,
    isDone(i) { return !!D.done[i]; },
  };
}
