// Bài "Ammonia. Muối ammonium" (Hoá 11 · Bài 5 · CHEM11-04), mode 3D = SA BÀN quá trình Haber. Bài thử đầu tiên của loại sân khấu sa bàn (DEFINE_SA_BAN.md).
// Khung bài như các bài khác của Lab 1: thẻ "Bước này" (trái), "Bảng điều khiển" (phải), thanh bước. Phần giữa là mô hình trưng bày đặt trên bàn trong phòng lab.
// Tay làm trên sa bàn (mở van, mở vỏ tháp, rút xúc tác, bật làm lạnh, mở tuần hoàn, bấm chạy) đều có nút sinh đôi ở bảng phải. Bốn con số (nhiệt độ, áp suất, tỉ lệ, mức tuần hoàn) đặt bằng thanh kéo.
import { h } from '../../shell/shell.js';
import { procList, bindSafeArea, vcard, tuckHandles, zoomBox } from '../../shell/labui.js';
import { createLab } from '../../kit/labset.js';
import { meta, steps, lab as DECL, SUMMARY, SAFETY, cfgOf, REF, RANGE, BOOK, TARGET, RUN_S } from './giao_an.js';
import { declaration, LEGEND, connectDials, datCanh } from './sa_ban.js';
import { xEq, pct, inBook } from './mo_hinh.js';
import { createChart, CHART_CSS } from './do_thi.js';
import { MECH } from './be_mat_fe.js';
// Mode 2D (?mode=2d): cùng giáo án, phần giữa là SƠ ĐỒ NHÀ MÁY PHẲNG do so_do_2d.js vẽ trên bộ máy 2D (DEFINE_SA_BAN.md mục 9.1). Không có thì là sa bàn 3D.
const MODE2D = /[?&]mode=2d(?![\w])/.test(location.search);
const { createLab2d } = MODE2D ? await import('../../flat/labset2d.js') : {};
const { declaration2d } = MODE2D ? await import('./so_do_2d.js') : {};

export { meta, steps };

const BID = 'haber';
// Việc bật ở từng bước, và thanh kéo nào chỉnh được ở từng bước (các thanh khác chỉ hiện số)
const ON = { 0: [], 1: ['valve', 'run'], 2: ['valve', 'run'], 3: ['valve', 'run'], 4: ['valve', 'cut', 'near', 'cat', 'run'], 5: ['valve', 'sep', 'loop', 'run'], 6: ['valve', 'cut', 'near', 'cat', 'sep', 'loop', 'run'] };
const SLIDE = { 0: [], 1: ['T'], 2: ['T'], 3: ['p'], 4: [], 5: ['rec'], 6: ['T', 'p', 'r', 'rec'] };
const ALL = ['valve', 'cut', 'near', 'cat', 'sep', 'loop', 'run'];
const NEAR = [['lens'], { az: -6, el: 10 }]; // nhìn gần kính soi hạt: khung chỉ ôm quả cầu
// Con số mà bước giữ nguyên (thanh kéo bị khoá): mỗi lần vào bước đều đặt lại đúng theo kịch bản, kể cả khi quay lại từ một bước sau đã đổi nó.
const LOCK = { 1: { p: 200, r: 3 }, 2: { p: 200, r: 3 }, 3: { T: 450, r: 3 }, 4: { T: 450, p: 200, r: 3 }, 5: { T: 450, p: 200, r: 3 } };
// MÁY QUAY THEO BƯỚC: vào bước nào khung chuẩn ôm khu mà bước đó nói tới (món phải ôm trọn + hướng nhìn). Bước không khai = cả sa bàn.
// Bước 2 (lần chạy đầu) cần cả van khí bên trái lẫn tủ điều khiển bên phải nên giữ khung cả sa bàn. Việc nằm ngoài khung vẫn làm được bằng nút sinh đôi ở bảng phải.
const FRAME = {
  2: [['tower', 'panel'], { az: -4, el: 20 }],
  3: [['feed', 'comp'], { az: -16, el: 20 }],
  4: [['tower', 'catbox', 'lens', 'lensfoot'], { az: -6, el: 18 }], // kính soi hạt chỉ hiện khi vỏ tháp mở; món đang ẩn thì khung tự bỏ qua
  5: [['cool', 'sep', 'loop', 'panel'], { az: -20, el: 30 }],
};
const KNOB = { T: ['Nhiệt độ tháp', '°C', `theo sách ${BOOK.T[0]}–${BOOK.T[1]} °C`], p: ['Áp suất', 'bar', `theo sách ${BOOK.p[0]}–${BOOK.p[1]} bar`], r: ['Tỉ lệ H₂ : N₂', ': 1', 'phương trình cần 3 : 1'], rec: ['Mức tuần hoàn', '%', 'phần khí chưa phản ứng được đưa quay lại'] };
const num = (v, d = 0) => v.toLocaleString('vi-VN', { maximumFractionDigits: d });
const CSS = `
.sb-knobs { display:grid; gap:7px; margin:0 0 10px; }
.sb-knob { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:1px 8px; align-items:baseline; }
.sb-knob label { font-size:12.5px; line-height:17px; font-weight:600; color:var(--text,#090a2b); }
.sb-knob output { font:600 14px/17px "IBM Plex Mono",ui-monospace,monospace; }
.sb-knob input { grid-column:1 / -1; width:100%; margin:0; accent-color:var(--accent,#6254f4); }
.sb-knob small { grid-column:1 / -1; font-size:11px; line-height:14px; color:var(--muted,#666878); }
.sb-knob.is-off label, .sb-knob.is-off output { color:var(--muted,#666878); }
.sb-knob.is-book output { color:#157347; }
.sb-target { display:grid; grid-template-columns:minmax(0,1fr) 76px auto; gap:6px; align-items:center; margin:0 0 10px; font-size:12px; line-height:16px; }
.sb-target input { width:76px; height:30px; padding:0 6px; border:1px solid var(--control-border,#8b89a1); border-radius:8px; font:600 13px/1 "IBM Plex Mono",ui-monospace,monospace; text-align:right; }
.sb-target em { font-style:normal; color:var(--muted,#666878); }
.sb-fixed { margin:0 0 10px; padding:7px 9px; border-radius:8px; background:var(--surface-2,#f4f4f8); font-size:12px; line-height:16px; color:var(--text,#090a2b); }
.lk-eqcard.is-lens em { display:block !important; text-align:center; }
.sb-legend { display:flex; flex-wrap:wrap; gap:4px 12px; margin:0 0 8px; font-size:11.5px; color:var(--muted,#666878); }
.sb-legend i { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:4px; vertical-align:middle; box-shadow:0 0 0 1px #0003; }
.sb-runs { width:100%; border-collapse:collapse; table-layout:fixed; margin:8px 0 0; font-size:11.5px; line-height:15px; }
.sb-runs th { padding:3px 3px; text-align:left; font-weight:600; color:var(--muted,#666878); border-bottom:1px solid var(--border,#e7e6ee); }
.sb-runs td { padding:4px 3px; vertical-align:top; border-bottom:1px solid var(--border,#e7e6ee); font-variant-numeric:tabular-nums; }
.sb-runs tr.is-hit td { background:#eaf7ee; }
.sb-runs caption { caption-side:top; text-align:left; font-size:12px; font-weight:600; padding:0 0 3px; }
.sb-note { margin:6px 0 0; font-size:11px; line-height:15px; color:var(--muted,#666878); }
.lk-panel .sb-read em { display:block; margin:0; }
`;

export function createLesson(shell) {
  const lab = MODE2D ? createLab2d(shell.els.stage, declaration2d(DECL)) : createLab(shell.els.stage, declaration(DECL)), stage = lab.stage;
  shell.els.stage.closest('.lk').classList.add('is-v3');
  let dials3d = null; // núm kéo trên sa bàn 3D (gán ở dưới, sau khi có setKnob)
  if (!MODE2D) datCanh(stage); // sa bàn có cảnh: phông xa, sương, độ sáng 0,98 // sa bàn: hạ độ sáng (mặc định 1,3) để mặt thép còn tương phản, không lì như nhựa (27/11)
  if (!document.getElementById('sb-css')) document.head.append(h('style', { id: 'sb-css', text: CSS + CHART_CSS }));
  const D = shell.state.data; // phần được lưu
  D.done = D.done || {}; D.reveal = D.reveal || {}; D.rows = D.rows || []; D.entered = D.entered || {};
  D.cfg = { T: REF.T, p: REF.p, r: REF.r, rec: REF.rec, ...(D.cfg || {}) };
  const goalOf = () => (Number.isFinite(D.target) && D.target > 0 ? D.target : TARGET); // mục tiêu sản lượng của bước Trưởng ca: giáo viên đổi được (STEMLabs: "GV đặt mục tiêu sản lượng")
  D.tog = { valve: false, cut: false, cat: true, sep: false, loop: false, ...(D.tog || {}) };
  const S = { step: 0, ui: null, acc: 0, replaying: false, seenN: 0, moved: false };
  const B = () => lab.benches[BID], U = (id) => B().items[id].obj.userData;

  const eqCard = h('div', { class: 'lk-eqcard is-bottom', hidden: true }), toastEl = h('div', { class: 'lk-toast', hidden: true, role: 'status' });
  const resetBtn = h('button', { class: 'lk-btn lk-reset', type: 'button', hidden: true, onclick: () => stage.resetView() }, '⟲ Về góc chuẩn');
  shell.els.stage.append(eqCard, toastEl, resetBtn);
  let cam0 = null, toastT = 0;
  const toast = (text, sec = 7) => { if (S.replaying) return; toastEl.textContent = text; toastEl.hidden = false; toastT = sec; };
  stage.setMoveHandler((moved) => { cam0 = moved ? stage.camera.position.clone() : null; resetBtn.hidden = true; });
  stage.onFrame((dt) => { lab.update(dt); tick(dt); });
  // Thẻ tên: màn rộng hiện tất cả; khung hẹp (dưới 900 px) sa bàn nhỏ nên chỉ hiện thẻ của việc kế tiếp, tên khu đã có trên dải nghiêng của đế. Nút ở thanh tên bài để tự đổi.
  const NAMES = ['Tên: tất cả', 'Tên: theo việc', 'Tên: tắt'];
  const applyNames = () => { const m = S.tagMode ?? (innerWidth < 900 ? 1 : 0); lab.setNames(m !== 2 && !S.near, m === 1); tagBtn.textContent = NAMES[m]; tagBtn.setAttribute('aria-pressed', String(m !== 2)); };
  const tagBtn = h('button', { class: 'lk-btn lk-act is-on', type: 'button', onclick: () => { S.tagMode = ((S.tagMode ?? (innerWidth < 900 ? 1 : 0)) + 1) % 3; applyNames(); } });
  // Nút đổi khung: ở bước có khung riêng, bấm để lùi ra xem cả sa bàn rồi bấm lại để về khu của bước
  const applyFrame = () => { const f = S.near ? NEAR : !S.whole && FRAME[S.step]; lab.frame(BID, f ? f[0] : null, f ? f[1] : null); frameBtn.hidden = !FRAME[S.step]; frameBtn.textContent = S.whole ? 'Khung: cả sa bàn' : 'Khung: khu của bước'; };
  const frameBtn = h('button', { class: 'lk-btn lk-act is-on', type: 'button', hidden: true, onclick: () => { S.whole = !S.whole; applyFrame(); lab.view(BID); } });
  if (!MODE2D) shell.els.actions.append(frameBtn, tagBtn); // sơ đồ phẳng không có máy quay, tên khối luôn hiện
  const syncInsets = bindSafeArea(shell, stage, () => (eqCard.hidden ? 0 : eqCard.offsetHeight));
  tuckHandles(shell, () => requestAnimationFrame(() => syncInsets()));
  if (!MODE2D) zoomBox(lab, shell.els.stage);

  const lastRow = () => D.rows[D.rows.length - 1] || null;
  const rowsOf = (i) => D.rows.filter((r) => r.step === i);
  function showEq() {
    const b = DECL.benches[0], r = lastRow(); eqCard.hidden = false; eqCard.classList.toggle('is-lens', !!(S.near && S.lensTxt)); // nhìn gần kính soi: dòng lời của kính soi hiện cả ở khung hẹp
    eqCard.replaceChildren(h('small', {}, h('i', { style: `background:${b.color}` }), MODE2D ? b.name.replace('Sa bàn', 'Sơ đồ') : b.name), h('b', { text: b.eq }), h('em', { text: S.near && S.lensTxt ? `${S.lensTxt} · quả xanh dương là N, trắng là H${/không có Fe/.test(S.lensTxt) ? '' : ', nâu là Fe'}` : r ? `lần chạy gần nhất: ${r.T} °C · ${r.p} bar · sau ${RUN_S} giây được ${pct(r.out, r.out < 0.02 ? 1 : 0)} NH₃` : b.cond }));
  }
  // ---------- Khi nào một bước tính là "Đã làm" ----------
  const DONE = [
    () => S.moved || !!D.moved,
    () => D.rows.some((r) => r.T <= 250),
    () => D.rows.some((r) => r.T <= 250) && D.rows.some((r) => r.T >= 400 && r.cat),
    () => new Set(rowsOf(3).map((r) => r.p)).size >= 2,
    () => !!D.cutSeen && rowsOf(4).some((r) => !r.cat),
    () => D.rows.some((r) => r.sep && r.rec > 0),
    () => rowsOf(6).some((r) => r.tpd >= goalOf()),
  ];
  function check() { const i = S.step; if (S.replaying || D.done[i] || !DONE[i]()) return; D.done[i] = true; shell.save(); shell.refresh(); if (i === 6) toast(`ĐẠT mục tiêu sản lượng của ca: ít nhất ${num(goalOf())} tấn mỗi ngày.`); }

  lab.on('say', (t) => { toast(t, 9); if (MODE2D && S.step === 0 && !S.moved) { S.moved = true; D.moved = true; shell.save(); check(); } }); // 2D: bước 1 xong khi đã chạm một khối để đọc tên và việc của nó
  lab.on('act', () => { if (S.replaying) return; const d = B().data; D.tog = { valve: !!d.valve, cut: !!d.cut, cat: !!d.cat, sep: !!d.sep, loop: !!d.loop }; if (d.cut && !D.cutSeen) D.cutSeen = true; shell.save(); });
  lab.on('change', () => {
    const d = B().data;
    if (d.n > S.seenN && d.last) { S.seenN = d.n; if (!S.replaying) onResult(d.last); }
    syncProc(); sync3D(); check();
  });
  function onResult(r) {
    D.rows.push({ step: S.step, T: r.T, p: r.p, r: r.r, cat: r.cat, sep: r.sep, rec: r.rec, eq: r.eq, out: r.out, f: r.f, use: r.use, tpd: r.tpd, cost: r.cost, speed: r.speed });
    if (D.rows.length > 40) D.rows.splice(0, D.rows.length - 40);
    B().opts.lastRow = lastRow(); // sơ đồ 2D đọc cùng lần chạy gần nhất với bảng phải
    shell.save(); showEq(); check(); shell.refresh(); shell.rerenderPanel();
  }

  // ---------- Đưa trạng thái lên sa bàn (hình): gọi đều, rẻ ----------
  function sync3D() {
    const b = B(); if (!b || !b.items.tower) return; const d = b.data, c = cfgOf(b), live = d.live ? d.live.r : null, last = lastRow(), running = !!live;
    U('tower').set({ T: c.T, cat: c.cat, cut: !!d.cut, run: running });
    U('comp').set({ p: c.p, run: running }); if (U('loop').setRec) U('loop').setRec(D.cfg.rec);
    U('panel').set({ run: running, prog: d.prog || 0 });
    U('sep').setLevel(d.liq || 0);
    // Kính soi hạt: hiện khi vỏ tháp mở. Thẻ tên của món ẩn phải được dựng lại, và lần đầu hiện thì có một lời dẫn.
    const lensOn = !!d.cut; U('lens').set({ on: lensOn, cat: c.cat, T: c.T, gas: !!d.valve }); U('lensfoot').set({ on: lensOn });
    if (!!d.near !== !!S.near) { S.near = !!d.near; applyFrame(); applyNames(); showEq(); if (!S.replaying) lab.view(BID); } // nhìn gần: thẻ tên các khu cất đi (không đè lên quả cầu), lời của kính soi chuyển xuống thẻ dưới cảnh
    if (lensOn !== S.lensOn) { S.lensOn = lensOn; applyNames(); if (lensOn && !S.replaying && !S.lensTold) { S.lensTold = true; toast(MODE2D ? 'Kính soi hạt: bề mặt một hạt sắt phóng to. Chạm kính soi để phóng to.' : 'Kính soi hạt hiện ra bên phải tháp: bề mặt một hạt sắt phóng to. Chạm vào kính soi để nhìn gần.', 9); } }
    if (lensOn) { const made = U('lens').made(), txt = !d.valve ? 'Kính soi · chưa có khí (van đóng)' : !c.cat ? 'Kính soi · không có Fe: va nhau rồi bật ra' : `Kính soi · bề mặt Fe ở ${c.T} °C · ${made} NH₃ đã rời đi`; if (txt !== S.lensTxt) { S.lensTxt = txt; b.tag('lens', txt); if (S.near) showEq(); } }
    U('pipes').set({ on: !!d.valve, flow: running ? 1 : 0.22, nh3: running ? live.out * (d.prog || 0) : d.valve && last ? last.out : 0, rec: d.loop ? c.rec / 100 : 0, sep: c.sep, r: c.r });
  }
  function tick(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.hidden = true; }
    if (cam0 && resetBtn.hidden && stage.camera.position.distanceTo(cam0) > 0.08) { resetBtn.hidden = false; if (S.step === 0 && !S.moved) { S.moved = true; D.moved = true; shell.save(); check(); } }
    S.acc += dt; if (S.acc >= 0.12) { S.acc = 0; sync3D(); syncRead(); if (S.chart && S.chart.el.isConnected) S.chart.draw(); }
  }

  // ---------- Bảng điều khiển (phải) ----------
  const put = (host, ...kids) => host.append(...kids.flat(3).filter(Boolean));
  const ph = (title, hint) => h('div', { class: 'lk-ph' }, h('b', { text: title }), h('span', { text: hint }));
  function syncProc() { const ui = S.ui; if (ui && ui.proc) { ui.proc.replaceChildren(); put(ui.proc, procList(lab, BID)); } }
  function syncRead() {
    const ui = S.ui; if (!ui) return; const b = B(), d = b.data, c = cfgOf(b), r = lastRow(), live = d.live;
    ui.label.textContent = live ? `Đang chạy · giây thứ ${Math.round((d.prog || 0) * RUN_S)}` : `NH₃ ở cửa ra tháp sau ${RUN_S} giây`;
    ui.big.textContent = live ? pct(live.r.out * (d.prog || 0), 1) : r ? pct(r.out, r.out < 0.02 ? 1 : 0) : 'chưa chạy';
    ui.unit.textContent = live ? '' : r ? `${r.T} °C · ${r.p} bar · phản ứng ${r.speed}` : 'mở van khí rồi bấm Chạy';
    ui.cells[0].set('Lúc cân bằng', pct(xEq(c.T, c.p, c.r)));
    ui.cells[1].set('Sản lượng', r ? `${num(r.tpd)} t/ngày` : '—');
    ui.cells[2].set('Chi phí năng lượng', r ? String(r.cost) : '—');
  }
  // ĐẶT MỘT CON SỐ CỦA NHÀ MÁY: cùng một đường cho thanh kéo ở bảng và núm ngay trên máy (27/11, chủ: "thao tác các nút ở màn hình chính chứ k phải panel").
  // Bước nào không cho chỉnh số đó thì nhắc một lần; van tuần hoàn đang đóng thì nhắc mở van trước.
  const KUI = {}; let toldAt = 0, toldKey = '';
  const hintOnce = (k, text) => { const now = performance.now(); if (toldKey === k && now - toldAt < 4000) return; toldKey = k; toldAt = now; toast(text, 5); };
  function setKnob(key, v) {
    if (S.replaying || !RANGE[key]) return false; const i = S.step, b = B();
    if (!SLIDE[i].includes(key)) { hintOnce(key, `Bước này giữ nguyên ${KNOB[key][0].toLowerCase()}.`); return false; }
    if (key === 'rec' && !b.data.loop) { hintOnce('loop', 'Van tuần hoàn đang đóng: chạm van để mở, rồi xoay để đặt phần trăm khí quay lại.'); return false; }
    const [min, max, step] = RANGE[key]; v = Math.max(min, Math.min(max, Math.round(v / step) * step)); if (v === D.cfg[key]) return true;
    D.cfg[key] = v; if (KUI[key]) KUI[key](); shell.save(); if (b.d.chem) b.d.chem.show(b); sync3D(); syncRead(); return true;
  }
  lab.on('knob', (bid, key, v) => setKnob(key, v)); // bàn 2D: kéo núm trên sơ đồ
  dials3d = MODE2D ? null : connectDials(lab, BID, { set: setKnob, get: (k) => D.cfg[k], range: (k) => RANGE[k] }); // bàn 3D: kéo kim đồng hồ, vặn vô lăng ngay trên sa bàn
  function knob(key, i) {
    const [name, unit, hint] = KNOB[key], [min, max, step] = RANGE[key], can = SLIDE[i].includes(key);
    const out = h('output'), el = h('div', { class: 'sb-knob' + (can ? '' : ' is-off') });
    const show = () => { const v = D.cfg[key]; out.textContent = key === 'r' ? `${num(v, 1)} ${unit}` : `${num(v)} ${unit}`; el.classList.toggle('is-book', (key === 'T' && v >= BOOK.T[0] && v <= BOOK.T[1]) || (key === 'p' && v >= BOOK.p[0] && v <= BOOK.p[1])); };
    const input = h('input', { type: 'range', min, max, step, value: D.cfg[key], disabled: !can || null, 'aria-label': name,
      oninput: (e) => { D.cfg[key] = Number(e.target.value); show(); shell.save(); const b = B(); if (b.d.chem) b.d.chem.show(b); sync3D(); syncRead(); } });
    KUI[key] = () => { input.value = D.cfg[key]; show(); }; // núm trên máy đổi số thì thanh kéo chạy theo
    put(el, h('label', { text: name }), out, input, h('small', { text: can ? hint : hint + ' · bước này giữ nguyên' })); show();
    return el;
  }
  function renderPanel(i, host) {
    const cells = [0, 1, 2].map(() => vcard()), label = h('span'), big = h('b'), unit = h('em'), proc = h('div', { class: 'hg-compact' });
    put(host, ph('Bảng điều khiển', i === 0 ? (MODE2D ? 'Bước này chỉ xem sơ đồ' : 'Bước này chỉ xem sa bàn') : `Kéo kim đồng hồ, vặn van ngay trên ${MODE2D ? 'sơ đồ' : 'sa bàn'}, hoặc kéo thanh ở đây`),
      h('div', { class: 'lk-read sb-read' }, label, h('div', {}, big, unit)),
      h('div', { class: 'lk-vcards' }, cells.map((c) => c.el)),
      // Bước không chỉnh con số nào (xem sa bàn, xúc tác): ghi cài đặt thành một dòng, nhường chỗ cho danh sách việc
      SLIDE[i].length ? h('div', { class: 'sb-knobs', role: 'group', 'aria-label': 'Đặt nhà máy' }, ['T', 'p', 'r', 'rec'].filter((k) => i === 6 || k !== 'r').map((k) => knob(k, i)))
        : h('p', { class: 'sb-fixed', text: `Cài đặt bước này giữ nguyên: ${D.cfg.T} °C · ${D.cfg.p} bar · H₂ : N₂ = ${num(D.cfg.r, 1)} : 1` }),
      h('div', { class: 'sb-legend' }, LEGEND.map(([name, color]) => h('span', {}, h('i', { style: `background:${color}` }), name)), h('span', { text: 'chấm trong ống = phân tử khí' })),
      // Bước Trưởng ca: ô để giáo viên đổi mục tiêu sản lượng của ca
      i === 6 && h('label', { class: 'sb-target' }, h('span', { text: 'Mục tiêu của ca (giáo viên đổi được)' }), h('input', { type: 'number', min: 200, max: 1700, step: 1, value: goalOf(), 'aria-label': 'Mục tiêu sản lượng, tấn mỗi ngày',
        onchange: (e) => { const v = Math.round(Number(e.target.value)); D.target = v >= 200 && v <= 1700 ? v : TARGET; e.target.value = goalOf(); D.done[6] = false; shell.save(); B().opts.target = goalOf(); check(); shell.refresh(); } }), h('em', { text: 'tấn/ngày' })),
      i > 0 && [h('h3', { class: 'lk-sub', text: MODE2D ? 'Việc trên sơ đồ' : 'Việc trên sa bàn' }), proc],
      h('p', { class: 'sb-note', text: 'Lúc cân bằng: số tính từ hằng số cân bằng, coi khí là lí tưởng. Sản lượng, chi phí: mô hình của bài (100 = cấu hình 450 °C · 200 bar · tuần hoàn 90 %).' }));
    S.ui = { label, big, unit, cells, proc: i > 0 ? proc : null };
    syncRead(); syncProc();
  }

  // ---------- Thẻ "Bước này" (trái) ----------
  function conclusion(i) {
    const lo = D.rows.find((r) => r.T <= 250), hi = D.rows.find((r) => r.T >= 400 && r.cat), nocat = rowsOf(4).find((r) => !r.cat), best = rowsOf(6).filter((r) => r.tpd >= goalOf()).sort((a, b) => a.cost - b.cost)[0];
    switch (i) {
      case 0: return ['Khí N₂ và H₂ từ hai bình đi qua máy nén, vào đỉnh tháp tổng hợp, đi qua ba tầng hạt sắt, rồi tới thiết bị làm lạnh. NH₃ ngưng tụ thành lỏng và đọng ở bình chứa. Khí chưa phản ứng theo ống vòng phía sau quay lại máy nén.', 'không biết con số ở các bước sau thuộc về chỗ nào của nhà máy.'];
      case 1: return [`Ở 200 °C lúc cân bằng có tới ${lo ? pct(lo.eq) : 'rất nhiều'} NH₃, nhưng sau ${RUN_S} giây mới được ${lo ? pct(lo.out, 1) : 'gần như không'}. Cân bằng có lợi mà phản ứng quá chậm thì nhà máy vẫn không có sản phẩm.`, 'tưởng rằng cứ lạnh là được nhiều NH₃.'];
      case 2: return [`Ở 450 °C lúc cân bằng chỉ còn ${hi ? pct(hi.eq) : 'ít hơn'} NH₃, nhưng sau ${RUN_S} giây đã được ${hi ? pct(hi.out) : 'nhiều hơn hẳn'}${lo ? `, so với ${pct(lo.out, 1)} ở 200 °C` : ''}. Nhà máy chịu thiệt về cân bằng để được tốc độ: đó là lí do chọn 400–450 °C.`, 'không giải thích được vì sao nhà máy chạy nóng dù phản ứng toả nhiệt.'];
      case 3: return ['Bốn phân tử khí thành hai phân tử, nên nén thì cân bằng dịch về phía NH₃: áp suất càng cao, phần trăm NH₃ càng lớn. Nhưng chi phí năng lượng cũng tăng theo và thiết bị phải chịu áp. Nhà máy dừng ở 150–200 bar.', 'không thấy cái giá của việc nén.'];
      case 4: return [`Rút xúc tác Fe ra, con số lúc cân bằng vẫn y nguyên, nhưng sau ${RUN_S} giây chỉ còn ${nocat ? pct(nocat.out, 2) : 'gần như không'} NH₃. Xúc tác không làm đổi cân bằng, nó chỉ giúp phản ứng tới cân bằng nhanh hơn.`, 'nhầm rằng xúc tác làm tăng lượng NH₃ lúc cân bằng.'];
      case 5: return ['Làm lạnh thì NH₃ ngưng tụ thành lỏng và tách khỏi hỗn hợp; N₂ và H₂ chưa phản ứng vẫn là khí, theo ống tuần hoàn quay lại tháp. Nhờ vậy mỗi lượt chỉ chuyển hoá một phần mà nhà máy vẫn dùng gần hết khí nguyên liệu.', 'tưởng rằng phần khí chưa phản ứng bị bỏ đi.'];
      default: return [best ? `Em đã đạt ${num(best.tpd)} tấn NH₃ mỗi ngày ở ${best.T} °C, ${best.p} bar, tuần hoàn ${best.rec} %, chi phí ${best.cost}. ${inBook(best.T, best.p) ? 'Cấu hình này nằm trong vùng sách giáo khoa nêu.' : 'Cấu hình này nằm ngoài vùng 400–450 °C, 150–200 bar của sách: mô hình của bài đơn giản hơn nhà máy thật.'}` : 'Nhà máy thật chọn 400–450 °C, 150–200 bar, có xúc tác Fe, tách NH₃ lỏng và tuần hoàn khí.', ''];
    }
  }
  function runsTable(i) {
    const rows = (i === 2 ? D.rows.filter((r) => r.step === 1 || r.step === 2) : rowsOf(i)).slice(-5); if (!rows.length) return null;
    return h('table', { class: 'sb-runs' }, h('caption', { text: 'Các lần chạy của bước này' }),
      h('thead', {}, h('tr', {}, ['°C · bar', 'Cân bằng', `Sau ${RUN_S} s`, 't/ngày', 'Chi phí'].map((t) => h('th', { text: t })))),
      h('tbody', {}, rows.map((r) => h('tr', { class: r.tpd >= goalOf() ? 'is-hit' : '' }, h('td', { text: `${r.T} · ${r.p}${r.cat ? '' : ' · không Fe'}${r.rec ? ` · ⟲${r.rec}%` : ''}` }), h('td', { text: pct(r.eq) }), h('td', { text: pct(r.out, r.out < 0.02 ? 1 : 0) }), h('td', { text: num(r.tpd) }), h('td', { text: String(r.cost) })))));
  }
  function resetStep(i) {
    D.rows = D.rows.filter((r) => r.step !== i); D.done[i] = false; D.reveal[i] = false; D.entered[i] = false;
    if (i === 0) { S.moved = false; D.moved = false; } if (i === 4) D.cutSeen = false;
    setBench(i); shell.save(); showEq(); shell.refresh(); shell.rerenderPanel(); toast(`Đã đặt lại bước: ${MODE2D ? 'sơ đồ' : 'sa bàn'} về trạng thái đầu của bước này.`, 5);
  }
  function renderCard(i, host) {
    const s0 = steps[i], goalTxt = (t) => (i === 6 ? t.replace('1.479', num(goalOf())) : t), s = { ...s0, q: goalTxt(s0.q), goal: goalTxt((MODE2D && s0.goal2d) || s0.goal), todo: goalTxt((MODE2D && s0.todo2d) || s0.todo) }, done = !!D.done[i], open = done || D.reveal[i];
    host.classList.add('hg-card', 'sb-card');
    put(host, ph('Bước này', `Bước ${i + 1}/${steps.length} · Câu hỏi → Làm thử → Kết luận`),
      h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short })),
      h('h2', { class: 'lk-q', text: s.q }),
      !open && s.bridge && h('p', { class: 'lk-ctx lk-bridge', text: s.bridge }),
      !done && h('div', { class: 'lk-task' }, h('b', {}, 'Việc bước này', h('span', { class: 'lk-status', text: 'Chưa làm' })), h('p', { text: s.goal })));
    // Bước có đồ thị (từ bước 2): ý "bỏ bước này thì…" nằm trong "Xem thêm" để kết luận và đồ thị cùng nằm gọn trong thẻ
    const [main, without] = open ? conclusion(i) : ['', ''];
    if (open) put(host, h('div', { class: 'lk-concl' }, h('b', { class: 'hg-concl-head' }, 'Kết luận', done && h('span', { class: 'lk-status is-done', text: 'Đã làm' })), h('p', { text: main })),
      i === 0 && without && h('ul', { class: 'lk-ideas' }, h('li', { class: 'is-without', text: 'Bỏ bước này thì ' + without })));
    // Đồ thị và bảng các lần chạy dùng chung một chỗ: mặc định là đồ thị, bấm để đổi sang bảng
    S.chart = null;
    if (i > 0) {
      const tab = S.tab || 'chart', table = runsTable(i);
      const seg = h('div', { class: 'sb-seg', role: 'group', 'aria-label': 'Cách xem kết quả' }, [['chart', 'Đồ thị'], ['table', 'Bảng các lần chạy']].map(([k, t]) => h('button', { type: 'button', 'aria-pressed': String(tab === k), onclick: () => { S.tab = k; shell.refresh(); } }, t)));
      if (tab === 'chart') { S.chart = createChart(() => ({ c: cfgOf(B()), rows: D.rows, rate: i >= 3 || (i === 2 && !!D.done[2]) })); put(host, seg, S.chart.el); }
      else put(host, seg, table || h('p', { class: 'sb-note', text: 'Chưa có lần chạy nào ở bước này.' }));
    }
    put(host,
      h('details', { class: 'hg-more' }, h('summary', { text: MODE2D ? 'Xem thêm: sơ đồ có gì, làm thế nào' : 'Xem thêm: sa bàn có gì, làm thế nào' }), h('p', { class: 'lk-ctx', text: MODE2D ? DECL.benches[0].text.replace('Sa bàn một', 'Sơ đồ một') : DECL.benches[0].text }), h('p', { class: 'lk-ctx', text: s.todo }), (i === 4 || i === 6) && h('p', { class: 'lk-ctx', text: MECH }), i > 0 && without && h('p', { class: 'lk-ctx', text: 'Bỏ bước này thì ' + without }), i === 6 && h('p', { class: 'lk-ctx', text: SUMMARY }), i === 6 && h('p', { class: 'lk-ctx', text: SAFETY })),
      h('div', { class: 'lk-cardfoot' },
        !open && h('button', { class: 'lk-btn is-pri', type: 'button', onclick: () => { D.reveal[i] = true; shell.save(); shell.refresh(); } }, 'Hiện kết luận'),
        h('button', { class: 'lk-btn', type: 'button', onclick: () => resetStep(i) }, 'Đặt lại bước này'),
        done && i < steps.length - 1 && h('button', { class: 'lk-btn', type: 'button', onclick: () => shell.go(i + 1) }, `Sang bước ${i + 2} ›`)));
    requestAnimationFrame(syncInsets);
  }

  // Vào một bước: lần đầu thì đặt sẵn cấu hình mở đầu của bước (theo kịch bản STEMLabs), rồi dựng lại các công tắc đã lưu
  function setBench(i) {
    if (!D.entered[i]) { D.entered[i] = true;
      if (i === 1) { Object.assign(D.cfg, { T: 200, p: 200, r: 3 }); Object.assign(D.tog, { valve: false, cut: false, cat: true, sep: false, loop: false }); }
      if (i === 2) { Object.assign(D.cfg, { p: 200, r: 3 }); D.tog.valve = true; }
      if (i === 3) { Object.assign(D.cfg, { T: 450, p: 100, r: 3 }); D.tog.valve = true; }
      if (i === 4) { Object.assign(D.cfg, { T: 450, p: 200, r: 3 }); Object.assign(D.tog, { valve: true, cat: true, cut: false }); }
      if (i === 5) { Object.assign(D.cfg, { T: 450, p: 200, r: 3, rec: 90 }); Object.assign(D.tog, { valve: true, cat: true, sep: false, loop: false }); }
      if (i === 6) { Object.assign(D.tog, { valve: true, cat: true }); }
      shell.save();
    }
    Object.assign(D.cfg, LOCK[i] || {});
    S.replaying = true;
    lab.setup(BID, { step: i, cfg: D.cfg, slide: SLIDE[i], target: goalOf(), lastRow: lastRow() }); if (dials3d) dials3d.sync(SLIDE[i]);
    const t = D.tog; lab.preset(BID, [t.valve && ['valve'], t.cut && ['cut'], !t.cat && ['cat'], t.sep && ['sep'], t.loop && ['loop']].filter(Boolean));
    S.seenN = 0; S.replaying = false;
    const b = B(); if (b.d.chem) b.d.chem.show(b);
    sync3D();
  }

  return {
    lab, state: S,
    enter(i) {
      const b = B(); if (b) b.seq.flush();
      S.step = i; S.ui = null; S.whole = false; S.lensOn = null; S.lensTxt = ''; S.lensTold = false; S.near = false; toastT = 0; toastEl.hidden = true;
      ALL.forEach((sid) => lab.enable(BID, sid, ON[i].includes(sid)));
      lab.setHands(i !== 0, MODE2D ? 'Bước 1 chỉ xem sơ đồ. Sang bước 2 để tự tay vận hành.' : 'Bước 1 chỉ xem sa bàn. Sang bước 2 để tự tay vận hành.');
      setBench(i);
      lab.setActive(BID); applyNames(); showEq(); syncInsets(); applyFrame(); lab.view(BID);
      if (i === 1 && !rowsOf(1).length) toast(SAFETY, 7);
    },
    renderCard, renderPanel,
    isDone(i) { return !!D.done[i]; },
  };
}
