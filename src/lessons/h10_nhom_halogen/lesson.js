// Bài "Nhóm halogen" (Hoá 10 · Chương 7 · Bài 21 · CHEM10-05). Khuôn theo lesson.js của bài mẫu Tốc độ phản ứng (bản 3):
// nối 9 bước của DEFINE.md với phòng lab, điều kiện "Đã làm", thẻ "Bước này" (trái) và "Bảng điều khiển" (phải).
// Món đồ, vị trí, việc của từng bàn (đủ 6 chức năng, DEFINE 3b): giao_an.js. Kết quả ống nghiệm do kho hoá học tính (giao_an.js gọi free/tubechem.js), tệp này chỉ hiện lại.
// Ghi (chức năng 5): mỗi kết quả mới của bàn (B.data.last) thành một dòng trong bảng kết quả của bước. Nạp lại trang: các việc đã làm của bước được lưu (D.log) và dựng lại bằng lab.preset.
import { h } from '../../shell/shell.js';
import { look } from '../../free/tubechem.js';
import { framesOf, partnerOf } from './xem_lai.js';
import { createParticleBox } from './hat_trong_ong.js';
import { procList, bindSafeArea, vcard, benchCard, tuckHandles, zoomBox } from '../../shell/labui.js';
import { createLab } from '../../kit/labset.js';
// Mode 2D (26/11): ?mode=2d dựng cùng giáo án bằng bộ máy 2D (flat/labset2d.js: cùng tên hàm, cùng sự kiện, lab.stage là sân khấu giả). Không có thì như cũ (3D).
const MODE2D = /[?&]mode=2d(?![\w])/.test(location.search);
const { createLab2d } = MODE2D ? await import('../../flat/labset2d.js') : {};
import { meta, steps, lab as DECL, SUMMARY, SAFETY, SALT_ION, SALT_NAME, REAGENT, dropHints } from './giao_an.js';

const bench3D = !MODE2D && new URLSearchParams(location.search).get('ban') !== 'phong'
  ? await import('./ban_3d.js') : null;

const compareView = bench3D ? await import('./so_mau.js') : null;

export { meta, steps };

const BENCH = Object.fromEntries(DECL.benches.map((b) => [b.id, b]));
const TOUR = DECL.benches.map((b) => b.id);
const ROWS = [['Cl2', 'Nước Cl₂'], ['Br2', 'Nước Br₂'], ['I2', 'Nước I₂']], COLS = [['Cl', 'NaCl'], ['Br', 'NaBr'], ['I', 'KI']]; // hàng = nước halogen, cột = muối halide (tên ngắn cho vừa bảng hẹp)
const SAME = { Cl2: 'Cl', Br2: 'Br', I2: 'I' };
const EXAM = [['tRef', 'A'], ['tBr', 'B'], ['tI', 'C']], EXAM_REAG = ['Cl2', 'Br2', 'tinhbot'], SALTS = ['NaCl', 'NaBr', 'KI'];
const SALT_WORD = { NaCl: 'NaCl', NaBr: 'NaBr', KI: 'KI' };
const TUBE_NAME = { tRef: 'Đối chứng', tBr: 'Thí nghiệm', tI: 'Thí nghiệm', t1: 'Ống 1', t2: 'Ống 2', t3: 'Ống 3', t4: 'Ống 4', tW: 'Ống so màu' }; // tên ngắn cho cột hẹp của bảng kết quả
const SALT_SHORT = { NaBr: 'NaBr', KI: 'KI', NaCl: 'NaCl', H2O: 'nước cất' };
// Việc bật ở từng bước (các việc khác của bàn tắt)
const ON = { cl: { 2: ['pBrR', 'pBrE', 'dBrRun', 'wBr'], 3: ['pIR', 'pIE', 'dIRun', 'wI', 'starch'], 8: EXAM.flatMap(([t]) => EXAM_REAG.map((c) => `x_${t}_${c}`)) },
  bri: { 4: ['pW', 'p1', 'p2', 'brI', 'brCl', 'cBr'], 5: ['pW', 'p3', 'p4', 'iBr', 'iCl', 'cI', 'rank1', 'rank2', 'rank3'] }, prep: { 7: ['trap'] } };
const PREP_READY = [['c1'], ['c2'], ['c3'], ['fan'], ['speed', 0]]; // bước Thao tác sai: dụng cụ đã nối sẵn, quạt đang chạy

export function createLesson(shell) {
  if (/[?&]room=tron(?![\w])/.test(location.search)) delete DECL.mode3d.room; // &room=tron: phòng trơn thay cho phòng ảnh
  { const k = /[?&]kinh=([a-e])(?![\w])/.exec(location.search), g = k ? k[1] : 'e'; if (g !== 'a') DECL.glass = g; } // kiểu thuỷ tinh E (ảnh dụng cụ) như bài mẫu
  const lab = (MODE2D ? createLab2d : createLab)(shell.els.stage, bench3D ? bench3D.benchDeclaration(DECL) : DECL), stage = lab.stage;
  shell.els.stage.closest('.lk').classList.add('is-v3'); // dùng chung kiểu dáng bài học bản 3 (thanh zoom, nút thu gọn bảng, màu "xong")
  const D = shell.state.data; // phần được lưu: bước đã làm, kết luận đã mở, bàn đã xem, ô bảng tổng kết, dòng kết quả, việc đã làm của từng bước
  D.done = D.done || {}; D.reveal = D.reveal || {}; D.picks = D.picks || []; D.cells = D.cells || {}; D.rows = D.rows || {}; D.log = D.log || {}; D.pairs = D.pairs || {};
  D.round ??= {};
  function recordCell(row) {
    const col = SALT_ION[row.salt];
    if (!col || !SAME[row.chem] || SAME[row.chem] === col) return;
    const key = row.chem + '|' + col;
    D.cells[key] = {kind:row.kind, hex:row.hex, phen:row.phen, eq:row.eq, drops:row.drops, count:(D.cells[key]?.count || 0)+1};
  }
  function rebuildCells() {
    D.cells = {};
    for (let step=2; step<=5; step++) (D.rows[step] || []).forEach(recordCell);
  }
  rebuildCells();
  const tested = (tube, label) => (D.rows[8] || []).some((row) => row.tubeId === tube || row.tube === 'Ống ' + label);
  if (!D.examPlan || !EXAM.every(([tube, label]) => tested(tube, label))) D.examOk = false;
  D.done[8] = !!D.examOk;
  D.examLabel ??= D.examOk ? Object.fromEntries(EXAM.map(([tube], i) => [tube, D.examPlan[i]])) : {};
  const S = { step: 0, picks: new Set(D.picks), tour: null, tags: true, at: {}, ui: null, acc: 0, moved: false, seen: {}, thumbs: {}, safetyShown: false, replaying: false, hints: {} };

  function makeThumbs() {
    if (S.step !== 0 || shown || cam0) return;
    const ins = syncInsets.insets(); TOUR.forEach((id) => { S.thumbs[id] = lab.snapshot(id, ins); });
    lab.view('all', true); shell.rerenderPanel();
  }
  setTimeout(makeThumbs, 1500); setTimeout(makeThumbs, 4500);

  const eqCard = h('div', { class: 'lk-eqcard is-bottom', hidden: true }), toastEl = h('div', { class: 'lk-toast', hidden: true, role: 'status' });
  const resetBtn = h('button', { class: 'lk-btn lk-reset', type: 'button', hidden: true, onclick: () => stage.resetView() }, '⟲ Về góc chuẩn');
  // DẢI DƯỚI BÀN (define bố cục v3, chủ chốt 26/11 "để dưới bàn"): dòng "lần ghi gần nhất" nằm trong thẻ phương trình dưới bàn;
  // bấm thì mở ngăn lịch sử (bảng kết quả + bảng tổng kết) phủ phần dưới của bàn, bấm lại hoặc bấm Đóng thì thu.
  const logBtn = h('button', { class: 'hg-logbtn', type: 'button', hidden: true, onclick: () => { shell.els.stage.querySelector('dialog.hg-dock')?.close(); if (S.p3Big) setP3Big(false); S.logOpen = !S.logOpen; syncLog(S.step); } });
  const logDrawer = h('div', { class: 'hg-drawer', hidden: true, role: 'region', 'aria-label': 'Lịch sử các lần thử' });
  shell.els.stage.append(eqCard, toastEl, resetBtn, logDrawer);
  let cam0 = null, toastT = 0;
  stage.setMoveHandler((moved) => { cam0 = moved ? stage.camera.position.clone() : null; resetBtn.hidden = true; });
  stage.onFrame((dt) => { lab.update(dt); tick(dt); });
  const toast = (text, sec = 6, note) => { if (S.replaying) return; toastEl.replaceChildren(text, note ? h('small', { text: note }) : ''); toastEl.hidden = false; toastT = sec; }; // note: cảnh báo an toàn thành dòng nhỏ riêng, không trộn vào câu phương trình
  const clearHand = bench3D?.connectBenchHands(lab, toast, () => S.step > 0);
  const tagBtn = h('button', { class: 'lk-btn lk-act is-on', type: 'button', 'aria-pressed': 'true', onclick: () => { S.tagMode = ((S.tagMode || 0) + 1) % 3; S.tags = S.tagMode !== 2; tagBtn.classList.toggle('is-on', S.tags); tagBtn.setAttribute('aria-pressed', String(S.tags)); tagBtn.textContent = ['Tên: theo việc', 'Tên: tất cả', 'Tên: tắt'][S.tagMode]; lab.setNames(S.tags, S.tagMode === 0); } }, 'Tên: theo việc');
  lab.setNames(true, true); // mặc định: thẻ tên theo việc (chỉ lọ, ống của việc kế tiếp); bấm nút để hiện tất cả hoặc tắt
  shell.els.actions.append(tagBtn);

  const syncInsets = bindSafeArea(shell, stage, () => (eqCard.hidden ? 0 : eqCard.offsetHeight));
  tuckHandles(shell, () => requestAnimationFrame(() => syncInsets()));
  if (!MODE2D) zoomBox(lab, shell.els.stage); // 2D không xoay, không phóng: không hiện thanh zoom
  let shown = null;
  function showEq(id) {
    const b = id && BENCH[id]; eqCard.hidden = !b; if (!b) return;
    const last = lab.benches[id].data.last, eq = last && last.kind !== 'run' ? last.equation || `${REAGENT[last.chem]} + ${last.salt}: ${last.kind === 'indicator' ? last.phenomenon.replace('.', '') : 'không phản ứng'}` : b.eq;
    eqCard.replaceChildren(h('small', {}, h('i', { style: `background:${b.color}` }), b.name), h('b', { text: eq }), b.cond && h('em', { text: b.cond }), logBtn);
  }
  function focus(id) { shown = id || null; lab.setActive(shown); showEq(shown); syncInsets(); lab.view(shown || 'all'); }
  function pick(id) { if (S.step !== 0 || !BENCH[id]) return; S.picks.add(id); D.picks = [...S.picks]; shell.save(); S.tour = id; focus(id); check(); shell.refresh(); shell.rerenderPanel(); }
  lab.on('pick', pick);
  lab.on('say', (t) => toast(t, 8));
  // Lưu việc đã làm của bước (để dựng lại bàn khi nạp lại trang); rửa ống thì bàn về đầu nên xoá nhật ký của bước
  lab.on('act', (bid, sid, k) => { clearHand?.(); if (S.replaying || steps[S.step].bench !== bid) return; (D.log[S.step] = D.log[S.step] || []).push(k === undefined ? [sid] : [sid, k]); shell.save(); });
  lab.on('rinse', (bid) => { clearHand?.(); if (S.replaying || steps[S.step].bench !== bid) return; D.log[S.step] = []; D.round[S.step] = (D.round[S.step] || 1) + 1; shell.save(); });
  lab.on('change', (bid) => {
    const B = lab.benches[bid];
    if (shown === bid) showEq(bid);
    const fresh = newResults(B, S.seen[bid]); // mọi kết quả mới từ lần trước (một lần nhỏ có thể cho hai kết quả: ống thí nghiệm và ống đối chứng)
    if (fresh.length) { S.seen[bid] = fresh[fresh.length - 1].n; if (!S.replaying) fresh.forEach(onResult); }
    if (steps[S.step].bench === bid && !S.replaying) {
      if (bid === 'bri' && B.data.rankOk && !D.rankOk) { D.rankOk = true; shell.save(); }
      if (bid === 'tv' && B.data.pairs) { D.pairs = { ...D.pairs, ...B.data.pairs }; shell.save(); }
      if (bid === 'prep' && S.step === 7 && B.data.leaked && B.data.fixed && !D.leakFixed) { D.leakFixed = true; shell.save(); }
    }
    if (S.ui && S.ui.bench === bid) syncProc();
    check();
  });
  const newResults = (B, seen) => { const all = [...Object.values(B.data.res || {}).flat(), ...(B.data.last && B.data.last.kind === 'run' ? [B.data.last] : [])]; return all.filter((r) => r && r.n > (seen ?? 0)).sort((a, c) => a.n - c.n); };
  // Một kết quả mới: một dòng ở bảng kết quả của bước (chức năng 5), ô bảng tổng kết (bước 3 đến 6), lời báo hiện tượng, lời an toàn lần đầu
  function onResult(r) {
    const rows = D.rows[S.step] = D.rows[S.step] || [];
    if (!S.replaying && r.tube) { S.p3Live = r.tube; S.p3Tube = null; }
    if (r.kind === 'run') { rows.push({ run: true, fan: r.fan, trap: r.trap, speed: r.speed, fill: r.fill, peak: r.peak, safe: r.safe }); shell.save(); shell.rerenderPanel(); shell.refresh(); return; }
    const exam = S.step === 8, name = exam ? 'Ống ' + (EXAM.find(([t]) => t === r.tube) || [])[1] : `${TUBE_NAME[r.tube] || r.tube} (${SALT_SHORT[r.salt] || ''})`;
    const row = { round:D.round[S.step] || 1, volume:r.volume, tubeId: r.tube, tube: name, chem: r.chem, salt: r.salt, drops: r.drops, phen: r.phenomenon, eq: r.equation, hex: r.hex, kind: r.kind, ppt: r.ppt };
    rows.push(row);
    if (S.step >= 2 && S.step <= 5) recordCell(row);
    if (r.chem === 'tinhbot' && S.step === 3) D.starch = r.phenomenon;
    shell.save();
    if (r.chem !== 'H2O') { let t = (r.equation ? r.equation + ' · ' : '') + r.phenomenon; let note = null; if (r.safety && !S.safetyShown) { S.safetyShown = true; note = r.safety; } toast(t, 7, note); }
    shell.rerenderPanel(); shell.refresh();
  }

  // ---------- Khi nào một bước tính là "Đã làm" (DEFINE 3 và 3b) ----------
  const rowsOf = (i) => D.rows[i] || [];
  const has = (i, f) => rowsOf(i).some(f);
  const DONE = [
    () => S.moved || S.picks.size > 0,
    () => new Set(rowsOf(1).filter((r) => r.run && r.safe).map((r) => r.speed)).size >= 2, // đã nối đủ, đã chạy cả hai tốc độ
    () => has(2, (r) => r.chem === 'Cl2' && r.salt === 'NaBr') && has(2, (r) => r.chem === 'H2O'),
    () => has(3, (r) => r.chem === 'Cl2' && r.salt === 'KI' && r.kind === 'reaction' && !r.ppt) && has(3, (r) => r.chem === 'Cl2' && r.salt === 'KI' && !!r.ppt) && has(3, (r) => r.chem === 'tinhbot'),
    () => has(4, (r) => r.chem === 'Br2' && r.salt === 'KI') && has(4, (r) => r.chem === 'Br2' && r.salt === 'NaCl') && has(4, (r) => r.chem === 'Br2' && r.salt === 'H2O'), // H2O: đã nhỏ ống so màu
    () => has(5, (r) => r.chem === 'I2' && r.salt === 'NaBr') && has(5, (r) => r.chem === 'I2' && r.salt === 'NaCl') && has(5, (r) => r.chem === 'I2' && r.salt === 'H2O') && !!D.rankOk,
    () => 'Cl2' in D.pairs && 'I2' in D.pairs,
    () => !!D.leakFixed,
    () => !!D.examOk,
  ];
  function check() { const i = S.step; if (S.replaying || D.done[i] || !DONE[i]()) return; D.done[i] = true; shell.save(); shell.refresh(); if (i === 8) toast('ĐẠT: gắn đúng cả ba nhãn.'); }

  // Ô "BÊN TRONG ỐNG" ở bảng trái (define mục 18, đợt A: bước 3 và 4). Soi ống đang nhỏ; không thì ống học sinh chọn ở vùng hai ống, ống vừa nhỏ, hoặc ống thí nghiệm của bước.
  const P3_STEP = { 2: 'Cl2', 3: 'Cl2', 4: 'Br2', 5: 'I2' }; // bước có ô và thuốc thử của bước (đợt A: bước 3, 4; đợt B thêm bước 5, 6)
  const pbox = createParticleBox({ live: () => S.step in P3_STEP, reagentName: (c) => REAGENT[c] || c, onBig: () => setP3Big(!S.p3Big) });
  // Phóng to: ô rời bảng trái xuống ngăn dưới bàn (cùng chỗ ngăn lịch sử, ngăn so màu); bảng trái để lại một nút Thu lại.
  function setP3Big(on) {
    S.p3Big = !!on && S.step in P3_STEP; pbox.setBig(S.p3Big);
    if (S.p3Big) { shell.els.stage.querySelector('dialog.hg-dock')?.close(); if (S.logOpen) { S.logOpen = false; syncLog(S.step); } shell.els.stage.append(pbox.el); } else if (!(S.step in P3_STEP)) pbox.el.remove();
    shell.refresh();
  }
  function syncP3() {
    const i = S.step; if (!(i in P3_STEP)) return; const B = lab.benches[steps[i].bench]; if (!B || !B.data.tubes) return;
    const pair = pairsOf(i)[0], pre = B.data.pre, busy = B.seq.busy(), going = busy && pre && B.data.tubes[pre.tube] ? pre : null;
    if (going) S.p3Tube = null;
    const id = (going && going.tube) || S.p3Tube || S.p3Live || pair[1]; // ống đang nhỏ · ống học sinh chọn · ống vừa nhỏ trong phiên này · mặc định ống thí nghiệm
    const rs = (B.data.res && B.data.res[id]) || [];
    // Bàn 2: ống đối chứng chỉ nhận nước cất. Bàn 3: ống so màu (nước cất) nhận chính nước halogen của bước.
    const chem = going ? going.chem : steps[i].bench === 'cl' && id === pair[0] ? 'H2O' : P3_STEP[i];
    pbox.show({ id, name: namesOf(i)[id] || id, tube: B.data.tubes[id], salt: B.data.salts && B.data.salts[id], chem, res: rs.filter((r) => r.ev).at(-1) || null, last: rs.at(-1) || null, running: !!going });
  }
  function tick(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.hidden = true; }
    if (cam0 && resetBtn.hidden && stage.camera.position.distanceTo(cam0) > 0.08) { resetBtn.hidden = false; if (S.step === 0) { S.moved = true; check(); } }
    S.acc += dt; if (S.acc >= 0.15) { S.acc = 0; syncRead(); syncP3(); }
  }

  // ---------- Bảng điều khiển (phải) ----------
  function readout(i) {
    const b = steps[i].bench, B = b && lab.benches[b];
    if (i === 0) return { label: 'Phòng lab hôm nay có', big: '3', unit: 'bàn thí nghiệm', cells: [['Mỗi bàn', 'đủ dụng cụ'], ['Đo bằng', 'màu ống'], ['Đã xem', `${TOUR.filter((id) => S.picks.has(id)).length}/${TOUR.length}`]] };
    if (b === 'prep') return BENCH.prep.chem.read(B);
    if (b === 'tv') { const p = D.pairs, w = (k) => (k in p ? (p[k] ? 'lấy được electron' : 'không đổi') : '–'); return { label: 'Cặp chất trên tivi', big: Object.keys(p).length + '/2', unit: 'cặp đã xem', cells: [['Cl₂ gặp Br⁻', w('Cl2')], ['I₂ gặp Br⁻', w('I2')], ['Mô hình', 'nói gọn']] }; }
    const all = rowsOf(i).filter((r) => r.chem !== 'H2O'), last = B.data.last;
    return { label: 'Ống vừa nhỏ', big: last && last.kind !== 'run' ? (last.kind === 'reaction' ? (last.ppt ? 'kết tủa' : 'có phản ứng') : last.kind === 'indicator' ? 'đổi màu' : 'không phản ứng') : 'chưa nhỏ', unit: last && last.kind !== 'run' ? `${REAGENT[last.chem]} · ${last.drops} giọt` : '',
      cells: [['Đã nhỏ', `${all.length} lần`], ['Có phản ứng', String(all.filter((r) => r.kind === 'reaction').length)], ['Không phản ứng', String(all.filter((r) => r.kind === 'none').length)]] };
  }
  function syncRead() {
    const ui = S.ui; if (!ui) return; const r = readout(S.step); ui.label.textContent = r.label; ui.big.textContent = r.big; ui.unit.textContent = r.unit; r.cells.forEach((c, n) => ui.cells[n].set(c[0], c[1]));
    if (ui.compare) { const B = lab.benches[steps[S.step].bench]; ui.compare.disabled = B.seq.busy() || !!(B.run && !B.run.done); }
    drawWatch();
    if (ui.bar) { const k = lab.benches.prep.data.fillK || 0; ui.bar.style.width = Math.round(k * 100) + '%'; }
  }
  const put = (host, ...kids) => host.append(...kids.flat(3).filter(Boolean));
  const ph = (title, hint) => h('div', { class: 'lk-ph' }, h('b', { text: title }), h('span', { text: hint }));
  function syncProc() { const ui = S.ui; if (ui && ui.proc) { ui.proc.replaceChildren(); put(ui.proc, procList(lab, ui.bench), hintBtns(ui.bench)); } }
  const dot = (hex) => h('i', { style: `display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle;background:${hex};box-shadow:0 0 0 1px #0002` });
  // Nút gợi ý "Nhỏ ít" / "Nhỏ dư" cho việc nhỏ đang tới lượt: số giọt do kho tính (giao_an.js dropHints), chỉ đặt con số, không tự nhỏ
  function hintBtns(bid) {
    if (!bid || bid === 'prep' || bid === 'tv' || S.step === 8) return null;
    const B = lab.benches[bid], P = lab.proc(bid), s = P.steps.find((x) => x.range && !x.done); if (!s) return null;
    const spec = B.d.steps.find((x) => x.id === s.id), tube = spec.into[0], salt = B.data.salts[tube], chem = { dCl: 'Cl2', dBr: 'Br2', dI: 'I2' }[spec.item]; if (!salt || !chem) return null;
    const key = salt + chem, hnt = key in S.hints ? S.hints[key] : (S.hints[key] = dropHints(salt, chem)); if (!hnt) return null;
    const set = (v) => { lab.setWant(bid, s.id, v); syncProc(); };
    return h('div', { class: 'lk-cardfoot' }, h('button', { class: 'lk-btn', type: 'button', onclick: () => set(hnt.little) }, `Nhỏ ít (${hnt.little} giọt)`), h('button', { class: 'lk-btn', type: 'button', onclick: () => set(hnt.excess) }, `Nhỏ dư (${hnt.excess} giọt)`));
  }
  // Bảng tổng kết 3 × 3: hàng = nước halogen, cột = muối; ô cùng nguyên tố để trống
  function summary() {
    return h('table', { class: 'lk-table', style: 'table-layout:fixed;width:100%' }, h('thead', {}, h('tr', {}, h('th', { text: 'muối →', style: 'width:22%;padding:6px 4px' }), COLS.map(([, n]) => h('th', { text: n, style: 'width:26%;padding:6px 3px;font-size:11px;text-align:left' })))),
      h('tbody', {}, ROWS.map(([chem, name]) => h('tr', {}, h('td', { text: name, style: 'padding:6px 4px' }), COLS.map(([col]) => {
        if (SAME[chem] === col) return h('td', { text: '—' });
        const c = D.cells[`${chem}|${col}`];
        return h('td', { style: 'white-space:normal;text-align:left;font-size:11.5px;line-height:15px;padding:6px 3px' }, c ? [dot(c.hex), c.kind === 'reaction' ? 'đẩy được' : 'không phản ứng', h('small',{class:'hg-evidence',text:c.count+' lần thử · lần cuối '+c.drops+' giọt'})] : 'Chưa thử');
      })))));
  }
  // Bảng kết quả của bàn (chức năng 5): mỗi lần nhỏ hoặc mỗi lần chạy là một dòng
  const TD = 'white-space:normal;text-align:left;font-size:11.5px;line-height:15px;padding:5px 4px;vertical-align:top';
  function resultRows(i) {
    const rows = rowsOf(i); if (!rows.length) return h('p', { class: 'lk-msg', text: 'Chưa có lần nào. Mỗi lần nhỏ hoặc chạy xong sẽ thành một dòng ở đây.' });
    if (rows[0].run) return h('table', { class: 'lk-table', style: 'table-layout:fixed;width:100%' },
      h('thead', {}, h('tr', {}, ['Quạt · cốc NaOH', 'Tốc độ', 'Bình thu · khí độc'].map((t) => h('th', { text: t, style: 'padding:5px 4px;font-size:11px;text-align:left' })))),
      h('tbody', {}, rows.map((r) => h('tr', {}, h('td', { style: TD, text: `quạt ${r.fan} · cốc ${r.trap}` }), h('td', { style: TD, text: r.speed }), h('td', { style: TD, text: `${r.fill} · ${r.peak}` })))));
    return h('table', { class: 'lk-table', style: 'table-layout:fixed;width:100%' },
      h('thead', {}, h('tr', {}, h('th', { text: 'Ống · chất nhỏ', style: 'width:36%;padding:5px 4px;font-size:11px;text-align:left' }), h('th', { text: 'Giọt', style: 'width:13%;padding:5px 4px;font-size:11px;text-align:left' }), h('th', { text: 'Màu cuối · hiện tượng', style: 'padding:5px 4px;font-size:11px;text-align:left' }))),
      h('tbody', {}, rows.map((r, k) => h('tr', { class: S.replay && S.replay.step === i && S.replay.k === k ? 'is-sel' : '' }, h('td', { style: TD }, r.tube, h('br'), REAGENT[r.chem], r.round > 1 && h('small',{class:'hg-evidence',text:'Lượt '+r.round}),
        r.salt && h('button', { class: 'hg-rp-open', type: 'button', title: 'Xem lại hai ống ở đúng lần thử này, kéo theo từng giọt', onclick: () => { S.replay = { step: i, k }; S.logOpen = true; syncLog(i); logDrawer.scrollTop = 0; } }, 'Xem lại')), h('td', { style: TD, text: String(r.drops) }), h('td', { style: TD }, h('div',{class:'hg-sample'}, h('i',{class:'hg-sample-chip',style:'background:'+r.hex,role:'img','aria-label':'Màu dung dịch '+r.hex,title:r.hex}), Number.isFinite(r.volume) && r.volume.toLocaleString('vi-VN',{maximumFractionDigits:2})+' mL'), phenOf(rows, r), r.eq && [h('br'), h('b', { text: r.eq })])))));
  }
  // Ống không phản ứng ở bàn 3: so mã màu (kho hoá học) với ống so màu đã nhận cùng chất (nước cất + cùng số giọt halogen)
  function phenOf(rows, r) {
    const ref = r.kind === 'none' && r.salt !== 'H2O' && rows.find((x) => x.salt === 'H2O' && x.chem === r.chem && x.drops === r.drops && (x.round || 1) === (r.round || 1));
    return ref ? `${r.phen} Màu ${ref.hex === r.hex ? 'giống' : 'khác'} ống so màu.` : r.phen;
  }
  // Bước 9: ba ống mất nhãn, 3 lọ; bấm ô để nhỏ, chọn nhãn rồi Chấm
  function examUI() {
    const B = lab.benches.cl, res = (tube, chem) => (B.data.res && B.data.res[tube] || []).find((r) => r.chem === chem);
    const cell = (tube, chem) => { const r = res(tube, chem); return h('td', { style: 'white-space:normal' }, r ? [dot(r.hex), r.kind === 'reaction' ? (r.ppt ? 'kết tủa' : 'đổi màu') : r.kind === 'indicator' ? r.phenomenon.replace('Hồ tinh bột hoá ', '').replace('.', '') : 'không đổi']
      : h('button', { class: 'lk-btn', type: 'button', onclick: () => { if (!lab.act('cl', `x_${tube}_${chem}`)) toast('Chờ một chút: tay đang thao tác.'); } }, 'Nhỏ')); };
    const sel = (tube) => h('select', { 'aria-label': 'Nhãn của ống', onchange: (e) => { D.examLabel[tube] = e.target.value;
      D.examOk = false; D.done[8] = false;
      shell.save(); shell.refresh(); } },
      h('option', { value: '', text: 'chọn nhãn' }), SALTS.map((s) => h('option', { value: s, selected: D.examLabel[tube] === s || null, text: 'muối ' + SALT_WORD[s] })));
    return h('div', { class: 'lk-box' }, h('h3', { text: 'Thử từng ống rồi gắn nhãn' }),
      h('table', { class: 'lk-table hg-exam', style: 'table-layout:fixed;width:100%' }, h('thead', {}, h('tr', {}, h('th', { text: 'Ống', style: 'width:15%' }), EXAM_REAG.map((c) => h('th', { text: REAGENT[c] })))),
        h('tbody', {}, EXAM.map(([tube, L]) => h('tr', {}, h('td', { text: L }), EXAM_REAG.map((c) => cell(tube, c)))))),
      h('div', { class: 'lk-cardfoot' }, EXAM.map(([tube, L]) => h('label', { class: 'lk-msg' }, `Ống ${L} `, sel(tube)))),
      h('div', { class: 'lk-cardfoot' }, h('button', { class: 'lk-btn is-pri', type: 'button', onclick: grade }, 'Chấm'),
        h('button', { class: 'lk-btn', type: 'button', onclick: () => newExam(true) }, 'Đổi bộ ống khác')));
  }
  function grade() {
    const plan = D.examPlan || [], wrong = EXAM.filter(([tube], n) => D.examLabel[tube] !== plan[n]).map(([, L]) => L);
    const missing = EXAM.filter(([tube, label]) => !tested(tube, label)).map(([, label]) => label);
    if (missing.length) return toast(`Cần thử ống ${missing.join(', ')} trước khi chấm.`);
    if (EXAM.some(([tube]) => !D.examLabel[tube])) return toast('Gắn nhãn cho cả ba ống trước khi chấm.');
    if (!wrong.length) { D.examOk = true; shell.save(); check(); shell.refresh(); shell.rerenderPanel(); return; }
    toast(`Chưa đúng ở ống ${wrong.join(', ')}. Gợi ý: nước Cl₂ làm ống NaBr hoá cam, ống KI hoá đỏ nâu; nước Br₂ chỉ làm ống KI đổi màu.`, 9);
  }
  function newExam(user) {
    clearHand?.();
    const p = [...SALTS]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } // xáo ngẫu nhiên mỗi lần
    if (D.examPlan?.every((salt, i) => salt === p[i])) p.push(p.shift());
    D.examPlan = p; delete D.round[8]; D.log[8] = []; D.rows[8] = []; D.examLabel = {}; S.replay = null;
    D.examOk = false; D.done[8] = false; D.reveal[8] = false;
    if (user) {
      setBench(8, true);
      toast('Đã đổi sang bộ ống mới.'); shell.refresh(); shell.rerenderPanel();
    }
    shell.save();
  }

  function pairsOf(i) {
    const exam = EXAM.map(([tube])=>tube);
    return ({
      2:[['tRef','tBr']], 3:[['tRef','tI']],
      4:[['tW','t1'],['tW','t2']], 5:[['tW','t3'],['tW','t4']],
      8:exam.flatMap(a=>exam.filter(b=>b!==a).map(b=>[a,b]))
    })[i];
  }
  const namesOf = (i) => i===8 ? Object.fromEntries(EXAM.map(([id,label])=>[id,'Ống '+label])) : TUBE_NAME;
  function compareTubes(i) { if (S.p3Big) setP3Big(false); S.logOpen = false; syncLog(S.step); compareView.openComparison(lab,pairsOf(i),namesOf(i),REAGENT,shell.els.stage); } // mở ngăn so màu dưới bàn; ngăn lịch sử nhường chỗ
  // VÙNG QUAN SÁT (define bố cục v3, chặng 1 · 26/11): hai ống cạnh nhau ngay ở bảng phải, cắt sát phần dung dịch; tự vẽ lại khi một thao tác vừa xong.
  // Ống bên phải là ống vừa nhận thuốc thử; ống bên trái là ống đối chứng (hoặc ống so màu) của nó.
  function watchPair(i, B) { const ps = pairsOf(i) || [], t = B.data.last && B.data.last.tube; return ps.find((p) => p[1] === t) || ps.find((p) => p.includes(t)) || ps[0]; }
  function drawWatch(force) {
    const ui = S.ui, W = ui && ui.watch; if (!W) return; const i = S.step, B = lab.benches[steps[i].bench]; if (!B || !B.vessel || !B.data.tubes) return;
    if (B.seq.busy() || (B.run && !B.run.done)) return;
    const pair = watchPair(i, B); if (!pair) return;
    const lastOf = (id) => (B.data.res && B.data.res[id] || []).at(-1);
    const sig = pair.map((id) => { const t = B.data.tubes[id], r = lastOf(id); return id + ':' + (t ? t.vol : 0) + ':' + (r ? r.n + r.hex : ''); }).join('|');
    if (!force && sig === W.sig) return; W.sig = sig;
    const names = namesOf(i);
    W.pair = pair;
    pair.forEach((id, n) => { const t = B.data.tubes[id], r = lastOf(id), F = W.figs[n];
      F.name.textContent = names[id] || id; F.note.replaceChildren();
      put(F.note, r && h('i', { class: 'hg-chip', style: 'background:' + r.hex }), r ? `${REAGENT[r.chem]} · ${r.drops} giọt` : t && t.vol ? 'mẫu ban đầu' : 'ống rỗng', t && t.vol ? ` · ${t.vol.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} mL` : null); });
    if (compareView) compareView.drawWatch(lab.stage, B, pair, W.figs.map((f) => f.canvas));
    else { const top = Math.max(5.5, ...pair.map((id) => (B.data.tubes[id] ? B.data.tubes[id].vol : 0) + 1.6)); pair.forEach((id, n) => drawTube2d(W.figs[n].canvas, B.data.tubes[id], top)); }
  }
  // Bản 2D không có cảnh 3D để chụp ống: vẽ phẳng đáy ống, mực theo thể tích thật, màu và độ trong lấy từ kho hoá học (look).
  function drawTube2d(cv, t, topMl, snap) { // snap: trạng thái đã tính sẵn của một giọt (xem lại lần thử), không có thì đọc từ ống t
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, w = 86, x0 = (W - w) / 2, base = H - 16, k = (base - 18) / topMl, r = w / 2;
    c.clearRect(0, 0, W, H); c.fillStyle = '#edf2f1'; c.fillRect(0, 0, W, H);
    const shape = () => { c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0, base - r); c.arc(x0 + r, base - r, r, Math.PI, 0, true); c.lineTo(x0 + w, 0); };
    const vol = snap ? snap.vol : t && t.vol;
    if (vol) { const L = snap || look(t), y = base - vol * k; c.save(); shape(); c.clip(); c.globalAlpha = Math.max(0.3, Math.min(1, L.opacity == null ? 0.6 : L.opacity)); c.fillStyle = L.hex || '#dcecf5'; c.fillRect(x0, y, w, base - y); if (snap && snap.ppt) { c.globalAlpha = 0.8; c.fillStyle = snap.ppt; c.fillRect(x0, base - 13, w, 13); } c.globalAlpha = 1; c.fillStyle = '#16324f66'; c.fillRect(x0, y - 1, w, 2); c.restore(); }
    c.strokeStyle = '#23333d'; c.lineWidth = 2.5; shape(); c.stroke();
    c.fillStyle = '#23333d'; c.font = '600 15px "IBM Plex Mono", ui-monospace, monospace'; c.textBaseline = 'middle';
    for (let m = 1; m <= topMl; m++) { const y = base - m * k, big = m === 2 || m % 5 === 0; c.fillRect(x0 + w + 4, y - (big ? 1 : 0.5), big ? 14 : 8, big ? 2 : 1); if (big) c.fillText(String(m), x0 + w + 22, y); }
  }
  // XEM LẠI MỘT LẦN THỬ (chặng 4 · 27/11): bấm "Xem lại" ở một dòng lịch sử → hai ống của đúng lần đó (ống vừa nhỏ + ống đối chứng của nó),
  // thanh kéo theo số giọt để thấy màu đổi dần, nút Chạy tự dừng ở giọt màu vừa đổi. Màu từng giọt do xem_lai.js tính lại bằng kho hoá học.
  let replayT = 0;
  function replayBox(i, rows, k) {
    const r = rows[k], R = framesOf(rows, k); if (!R) return null;
    const P = partnerOf(rows, k, pairsOf(i)), RP = P && P.k >= 0 ? framesOf(rows, P.k) : null, names = namesOf(i), N = r.drops;
    const figs = [RP && { name: names[P.id] || P.id, chem: rows[P.k].chem, at: (d) => RP.frames[Math.min(d, RP.frames.length - 1)] }, { name: r.tube, chem: r.chem, at: (d) => R.frames[d] }].filter(Boolean)
      .map((f) => ({ ...f, canvas: h('canvas', { width: 250, height: 172 }), note: h('span') }));
    const top = Math.max(5.5, ...figs.map((f) => f.at(N).vol + 1.6));
    const big = h('b', { class: 'hg-rp-n' }), msg = h('p', { class: 'hg-rp-msg', role: 'status' }), range = h('input', { type: 'range', min: 0, max: N, step: 1, value: N, 'aria-label': 'Số giọt đã nhỏ' });
    const play = h('button', { class: 'lk-btn is-pri', type: 'button' }), jump = R.change != null && h('button', { class: 'lk-btn', type: 'button' }, `Tới giọt ${R.change}: màu vừa đổi`);
    let d = N, paused = false;
    const stop = () => { clearInterval(replayT); replayT = 0; };
    const show = (v) => {
      d = v; range.value = v; big.textContent = `Giọt ${v} / ${N}`;
      figs.forEach((f) => { const s = f.at(v); drawTube2d(f.canvas, null, top, s); f.note.replaceChildren(); put(f.note, h('i', { class: 'hg-chip', style: 'background:' + s.hex }), `${REAGENT[f.chem]} · ${s.drop} giọt`); });
      msg.textContent = R.change == null ? (v === N ? r.phen : 'Nhỏ tới đây màu chưa đổi.') : v < R.change ? `Chưa đổi màu. Màu đổi ở giọt ${R.change}.` : v === R.change ? `Giọt ${v}: màu vừa đổi.` : v === N ? r.phen : `Màu đã đổi từ giọt ${R.change}, đậm dần.`;
      msg.classList.toggle('is-hit', v === R.change);
      play.textContent = replayT ? 'Tạm dừng' : v >= N ? 'Chạy lại từ đầu' : paused ? 'Chạy tiếp' : 'Chạy';
    };
    const run = () => { stop(); if (d >= N) d = 0; paused = false;
      replayT = setInterval(() => { const n = d + 1; if (n >= N) { stop(); show(N); return; } if (n === R.change) { stop(); paused = true; } show(n); }, 130); // tới giọt màu vừa đổi thì tự dừng
      show(d); };
    play.onclick = () => { if (replayT) { stop(); paused = true; show(d); } else run(); };
    range.oninput = () => { stop(); paused = false; show(+range.value); };
    if (jump) jump.onclick = () => { stop(); paused = true; show(R.change); };
    const box = h('section', { class: 'hg-replay', 'aria-label': 'Xem lại một lần thử' },
      h('header', {}, h('h3', { text: `Xem lại: ${r.tube} · ${REAGENT[r.chem]}${r.round > 1 ? ' · lượt ' + r.round : ''}` }), h('button', { class: 'lk-btn', type: 'button', onclick: () => { S.replay = null; syncLog(S.step); } }, 'Đóng xem lại')),
      h('div', { class: 'hg-rp-body' },
        h('div', { class: 'hg-watch' }, figs.map((f) => h('figure', {}, f.canvas, h('figcaption', {}, h('b', { text: f.name }), f.note)))),
        h('div', { class: 'hg-rp-ctl' }, big, range, h('div', { class: 'hg-rp-btns' }, play, jump), msg,
          P && !RP && h('p', { class: 'lk-msg', text: `${names[P.id] || P.id} chưa có lần nhỏ nào để đem so.` }),
          !R.ok && h('p', { class: 'lk-msg', text: 'Dựng lại không khớp hẳn dòng đã ghi: màu ở đây tính theo kho hoá học hiện tại.' }))));
    show(N); return box;
  }
  function syncLog(i) {
    clearInterval(replayT); replayT = 0;
    const b = steps[i].bench, on = b === 'cl' || b === 'bri' || b === 'prep', rows = on ? rowsOf(i) : [], r = rows[rows.length - 1];
    logBtn.hidden = !on; if (!on) { logDrawer.hidden = true; return; }
    logBtn.replaceChildren(); logBtn.setAttribute('aria-expanded', String(!!S.logOpen));
    put(logBtn, r && !r.run && h('i', { class: 'hg-chip', style: 'background:' + r.hex }),
      h('span', { text: r ? (r.run ? `Lần gần nhất: ${r.speed} · bình thu ${r.fill}` : `Lần gần nhất: ${REAGENT[r.chem]} · ${r.drops} giọt`) : 'Chưa có lần thử nào' }),
      h('em', { text: `Lịch sử (${rows.length}) ${S.logOpen ? '▾' : '▴'}` }));
    logDrawer.hidden = !S.logOpen; // nội dung ngăn luôn được dựng (kể cả khi đang đóng) để bảng kết quả và bảng tổng kết luôn có trong trang cho bộ kiểm thử
    logDrawer.replaceChildren();
    const rp = S.replay && S.replay.step === i && rows[S.replay.k] ? replayBox(i, rows, S.replay.k) : null; if (!rp) S.replay = null;
    put(logDrawer, h('header', {}, h('b', { text: 'Lịch sử các lần thử' }), h('button', { class: 'lk-btn', type: 'button', onclick: () => { S.logOpen = false; syncLog(S.step); } }, 'Đóng')), rp,
      h('div', { class: 'hg-drawer-grid' }, h('section', {}, h('h3', { text: 'Bảng kết quả' }), resultRows(i)), i >= 2 && i <= 5 && h('section', {}, h('h3', { text: 'Bảng tổng kết' }), summary())));
  }
  function renderPanel(i, host) {
    const b = steps[i].bench, cells = [0, 1, 2].map(() => vcard()), label = h('span'), big = h('b'), unit = h('em');
    const tubes = b === 'cl' || b === 'bri', proc = b && i !== 8 && h('div', { class: 'hg-compact' }), bar = b === 'prep' && h('i', { style: 'display:block;height:100%;width:0;border-radius:6px;background:#b5d334;transition:width .2s' });
    const compare = tubes && compareView && h('button',{type:'button',class:'lk-btn hg-compare-open',onclick:()=>compareTubes(i)},'So màu hai ống');
    // Vùng quan sát thay ba ô đếm ở các bàn ống nghiệm (3D: chụp từ cảnh; 2D và phòng cũ: vẽ phẳng); ba ô đếm vẫn dùng ở tủ hút, tivi, bước 1
    const watch = tubes && { sig: null, figs: [0, 1].map(() => ({ canvas: h('canvas', { width: 250, height: 172 }), name: h('b'), note: h('span') })) };
    put(host, ph('Bảng điều khiển', b ? (bench3D && tubes ? 'Kéo lọ tới ống, hoặc bấm nút cùng số.' : i === 8 ? 'Bấm ô để nhỏ, rồi gắn nhãn' : 'Tay làm trên bàn, hoặc bấm nút cùng số') : 'Chạm một bàn để tới gần'),
      h('div', { class: 'lk-read' }, label, h('div', {}, big, unit)),
      !watch && h('div', { class: 'lk-vcards' }, cells.map((c) => c.el)),
      watch && h('div', { class: 'hg-watch', role: 'group', 'aria-label': 'Hai ống đang so' }, watch.figs.map((f, n) => h('figure', { title: i in P3_STEP ? 'Bấm để soi hạt bên trong ống này (ô ở bảng trái)' : null, style: i in P3_STEP ? 'cursor:pointer' : null, onclick: () => { if (i in P3_STEP && watch.pair) { S.p3Tube = watch.pair[n]; syncP3(); } } }, f.canvas, h('figcaption', {}, f.name, f.note)))), compare,
      bar && h('div', { class: 'lk-box' }, h('h3', { text: 'Bình thu: trống → đầy' }), h('div', { style: 'height:12px;border-radius:6px;background:#e7e6ee;overflow:hidden' }, bar)),
      i === 0 && h('ul', { class: 'lk-blist' }, TOUR.map((id) => benchCard({ name: BENCH[id].name, color: BENCH[id].color, done: S.picks.has(id), on: S.tour === id, thumb: S.thumbs[id], onPick: () => pick(id), text: BENCH[id].cond }))),
      proc && [h('h3', { class: 'lk-sub', text: b === 'tv' ? 'Chọn cặp chất' : 'Việc của bàn này' }), proc],
      i === 8 && examUI(),
      (b === 'prep' || (tubes && i !== 8)) && h('p', { class: 'lk-msg', text: SAFETY }));
    S.ui = { label, big, unit, cells, compare, watch, bench: b && i !== 8 ? b : null, proc, bar };
    syncRead(); syncProc(); syncLog(i);
  }

  // ---------- Thẻ "Bước này" (trái) ----------
  const where = (id) => { const b = BENCH[id]; return h('p', { class: 'lk-where' }, h('i', { class: 'lk-dot', style: `background:${b.color}` }), h('span', {}, h('b', { text: b.name + '. ' }), b.text)); };
  const cellText = (k, fb) => { const c = D.cells[k]; return c ? c.phen : fb; };
  function conclusion(i) {
    switch (i) {
      case 0: return ['Phòng có ba bàn và một tivi. Bàn 1 nằm trong tủ hút để điều chế khí Cl₂. Bàn 2 và Bàn 3 cho từng halogen gặp muối của halogen khác. Tivi phóng tới mức hạt.', ['Mỗi bàn đủ dụng cụ của riêng nó: giá ống, lọ có ống hút, cốc thải, vòi nước, bình tia.', 'Ống đối chứng nhận nước cất, cùng số giọt, để có cái so.'], 'các bước sau không biết đang đứng ở đâu trong phòng.'];
      case 1: return ['KMnO₄ tác dụng với HCl đặc sinh ra khí Cl₂ màu vàng lục. Khí đi theo ống đã nối: qua bình rửa khí, vào bình thu, khí thừa bị dung dịch NaOH trong cốc giữ lại. Nhỏ nhanh thì bình thu đầy nhanh hơn. Tủ hút kéo khí ra ngoài nên đồng hồ khí độc đứng ở An toàn.', ['Phần điều chế chỉ mô phỏng, không ghi lượng hoá chất.', 'Nối sai thứ tự thì khí không tới được bình thu và cốc kiềm.'], 'không có Cl₂ cho các bước sau, và không biết vì sao phải làm trong tủ hút.'];
      case 2: { const c = D.cells['Cl2|Br']; return [`Ống đối chứng chỉ nhận nước cất nên không đổi. Ống NaBr: ${cellText('Cl2|Br', 'chưa nhỏ.')} Cl₂ lấy electron của ion Br⁻, Br₂ được giải phóng.`, [c && c.eq ? `Phương trình (kho hoá học): ${c.eq}.` : 'Lấy muối bằng ống hút, rồi nhỏ nước Cl₂ để xem phương trình.', 'Màu cam là màu của Br₂ vừa sinh ra.'], 'không có ống để so, không chắc màu cam là do phản ứng hay do chính nước Cl₂.']; }
      case 3: { const c = D.cells['Cl2|I'], ki = rowsOf(3).filter((r) => r.chem === 'Cl2' && r.salt === 'KI'), few = ki.find((r) => !r.ppt), many = ki.find((r) => r.ppt);
        return [`Ống KI, nhỏ ít${few ? ` (${few.drops} giọt)` : ''}: ${few ? few.phen : 'chưa làm.'} Nhỏ dư${many ? ` (${many.drops} giọt)` : ''}: ${many ? many.phen : 'chưa làm.'} Thêm hồ tinh bột: ${D.starch || 'chưa nhỏ.'} Hồ tinh bột hoá xanh đen là dấu hiệu nhận ra I₂: Cl₂ đẩy được I₂ ra khỏi KI.`, [c && c.eq ? `Phương trình (kho hoá học): ${c.eq}.` : 'Nhỏ nước Cl₂ trước, hồ tinh bột sau.', 'Lượng thuốc thử đổi thì hiện tượng đổi: đó là lý do phải ghi số giọt.'], 'không chắc chất màu nâu là I₂, và không thấy I₂ tách ra khi dư Cl₂.']; }
      case 4: return ['Br₂ đẩy được I₂ (ống KI đổi màu) nhưng không đẩy được Cl₂: ống NaCl có màu giống ống so màu (nước cất nhận cùng số giọt nước Br₂): đó chỉ là màu của chính nước Br₂, không có chất mới. Br₂ đứng giữa.', [`Ống KI: ${cellText('Br2|I', 'chưa nhỏ.')}`, `Ống NaCl: ${cellText('Br2|Cl', 'chưa nhỏ.')}`], 'không biết Br₂ đứng ở đâu so với Cl₂ và I₂.'];
      case 5: return ['I₂ không đẩy được ai: hai ống có màu giống ống so màu (nước cất nhận cùng số giọt nước I₂), tức chỉ là màu của chính nước I₂. Thứ tự từ mạnh tới yếu trên kệ: Cl₂ > Br₂ > I₂.', [SUMMARY], 'chỉ có các kết quả rời, chưa thành một quy luật.'];
      case 6: return ['Cl₂ lấy electron của hai ion Br⁻, thành hai ion Cl⁻ và một phân tử Br₂. I₂ gặp Br⁻ thì va chạm rồi bật ra, không đổi gì.', ['Nói gọn: nguyên tử nhỏ hơn hút electron mạnh hơn. Nguyên nhân đầy đủ còn liên quan tới năng lượng khi ion được các phân tử nước bao quanh.'], 'các kết quả ống nghiệm phải học thuộc rời nhau.'];
      case 7: return ['Tắt quạt hoặc bỏ cốc NaOH thì khí Cl₂ thoát ra phòng: đồng hồ khí độc lên Cảnh báo rồi Nguy hiểm. Ngoài đời đó là tai nạn. Luôn bật tủ hút và đặt cốc kiềm trước khi cho HCl đặc nhỏ xuống.', [SAFETY], 'không thấy vì sao hai món "phụ" là tủ hút và cốc NaOH lại bắt buộc.'];
      default: return ['Nước Cl₂ làm ống NaBr hoá cam, ống KI hoá đỏ nâu (thêm hồ tinh bột thì xanh đen); ống NaCl không đổi. Nước Br₂ chỉ làm ống KI đổi màu. Ghép lại là tìm ra cả ba ống.', [SUMMARY], ''];
    }
  }
  function resetStep(i) {
    clearHand?.();
    D.done[i] = false; D.reveal[i] = false; D.log[i] = []; D.rows[i] = []; delete D.round[i]; S.replay = null; S.p3Tube = S.p3Live = null;
    if (i >= 2 && i <= 5) rebuildCells();
    if (i === 3) delete D.starch;
    if (i === 0) { S.picks.clear(); D.picks = []; S.moved = false; S.tour = null; focus(null); }
    if (i === 5) D.rankOk = false;
    if (i === 6) D.pairs = {};
    if (i === 7) D.leakFixed = false;
    if (i === 8) { D.examOk = false; D.examLabel = {}; }
    setBench(i, true); shell.save(); shell.refresh(); shell.rerenderPanel(); toast('Đã đặt lại bước: bàn về trạng thái đầu của bước này.');
  }
  function renderCard(i, host) {
    const s = steps[i], done = !!D.done[i], open = done || D.reveal[i], at = i === 0 ? S.tour : s.bench;
    host.classList.add('hg-card');
    put(host, ph('Bước này', `Bước ${i + 1}/${steps.length} · Câu hỏi → Làm thử → Kết luận`),
      h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short })),
      h('h2', { class: 'lk-q', text: s.q }),
      !open && s.bridge && h('p', { class: 'lk-ctx lk-bridge', text: s.bridge }),
      i === 0 && at && where(at),
      i === 0 && S.tour && h('div', { class: 'lk-cardfoot' }, h('button', { class: 'lk-btn', type: 'button', onclick: () => { S.tour = null; focus(null); shell.refresh(); shell.rerenderPanel(); } }, '‹ Về toàn cảnh')),
      // Chặng 2 (bố cục v3): bảng trái chỉ còn MỘT câu mục tiêu; làm xong thì kết luận THAY chỗ câu nối và câu mục tiêu, không nối dài thêm
      !done && h('div', { class: 'lk-task' }, h('b', {}, 'Việc bước này', h('span', { class: 'lk-status', text: 'Chưa làm' })), h('p', { text: s.goal || s.todo })));
    if (open) {
      const [main, points, without] = conclusion(i);
      put(host, h('div', { class: 'lk-concl' }, h('b', { class: 'hg-concl-head' }, 'Kết luận', done && h('span', { class: 'lk-status is-done', text: 'Đã làm' })), h('p', { text: main })),
        h('ul', { class: 'lk-ideas' }, !(i in P3_STEP) && points.map((t) => h('li', { text: t })), without && h('li', { class: 'is-without', text: 'Bỏ bước này thì ' + without })));
    }
    const extra = open && i in P3_STEP ? conclusion(i)[1] : null; // bước có ô hạt: hai ý phụ đã có ở dải phương trình và chú thích của ô, dời vào "Xem thêm" cho bảng khỏi phải cuộn
    // Phần chữ dài (bàn có gì, cách làm đầy đủ) nằm sau nút Xem thêm: cần thì mở, không chiếm chỗ lúc làm
    put(host, (s.goal || (i !== 0 && at)) && h('details', { class: 'hg-more' }, h('summary', { text: 'Xem thêm: bàn này có gì, làm thế nào' }), i !== 0 && at && where(at), s.goal && h('p', { class: 'lk-ctx', text: s.todo }), extra && h('ul', { class: 'lk-ideas' }, extra.map((t) => h('li', { text: t })))));
    put(host, h('div', { class: 'lk-cardfoot' },
      !open && h('button', { class: 'lk-btn is-pri', type: 'button', onclick: () => { D.reveal[i] = true; shell.save(); shell.refresh(); } }, 'Hiện kết luận'),
      h('button', { class: 'lk-btn', type: 'button', onclick: () => resetStep(i) }, 'Đặt lại bước này'),
      done && i < steps.length - 1 && h('button', { class: 'lk-btn', type: 'button', onclick: () => shell.go(i + 1) }, `Sang bước ${i + 2} ›`)));
    if (i in P3_STEP) { if (S.p3Step !== i) { S.p3Step = i; S.p3Tube = S.p3Live = null; }
      if (S.p3Big) put(host, h('button', { class: 'hg-p3-stub', type: 'button', onclick: () => setP3Big(false) }, 'Ô "Bên trong ống" đang mở lớn dưới bàn · Thu lại')); else put(host, pbox.el);
      pbox.reset(); syncP3(); }
    else if (S.p3Big || pbox.el.isConnected) { S.p3Big = false; pbox.setBig(false); pbox.el.remove(); }
    if (done && i === steps.length - 1) {
      const mission = new URL(location.href);
      mission.searchParams.set('mode', 'thuc-te');
      mission.searchParams.delete('buoc');
      put(host, h('a', { class: 'lk-btn is-pri', href: mission.href }, 'Vận dụng với mẫu nước máy ›'));
    }
    requestAnimationFrame(syncInsets);
  }

  // Đặt bàn cho một bước: bàn dọn sạch khi bước khác vừa dùng nó (hoặc khi bấm đặt lại), rồi DỰNG LẠI các việc đã làm của bước (nạp lại trang không để bàn trắng)
  function setBench(i, force) {
    const b = steps[i].bench; if (!b) return;
    if (!force && S.at[b] === i) return;
    S.at[b] = i;
    const log = D.log[i] || [];
    S.replaying = true;
    if (b === 'tv') lab.preset('tv', log);
    else if (b === 'prep') { lab.setup('prep', { step: i, practice: i === 7 }); lab.preset('prep', [...(i === 7 ? PREP_READY : []), ...log]); }
    else if (b === 'cl' && i === 8) { if (!D.examPlan) newExam(false); lab.setup('cl', { step: 8, exam: D.examPlan }); lab.preset('cl', log); }
    else { lab.setup(b, { step: i }); lab.preset(b, log); }
    S.seen[b] = Math.max(S.seen[b] || 0, ...newResults(lab.benches[b], 0).map((r) => r.n)); // các kết quả có được khi dựng lại không ghi thành dòng mới
    S.replaying = false;
  }
  function enableFor(i) {
    Object.entries(ON).forEach(([bid, by]) => { const all = new Set(Object.values(by).flat()), on = new Set(by[i] || []); all.forEach((sid) => lab.enable(bid, sid, on.has(sid))); });
  }

  return {
    lab, state: S,
    enter(i) {
      clearHand?.();
      // An accepted transfer belongs to the step where the student released the pipette.
      if (i !== S.step) lab.benches[steps[S.step].bench]?.seq.flush();
      S.step = i; S.ui = null; toastT = 0; toastEl.hidden = true;
      enableFor(i);
      lab.setHands(i !== 0, 'Bước 1 chỉ xem phòng. Sang bước của bàn này để tự tay làm thí nghiệm.');
      setBench(i);
      focus(i === 0 ? S.tour : steps[i].bench);
      if (i === 1 || i === 7) toast(SAFETY, 7);
      if (i === 0 && !Object.keys(S.thumbs).length) setTimeout(makeThumbs, 400);
    },
    renderCard, renderPanel,
    isDone(i) { return !!D.done[i]; },
  };
}
