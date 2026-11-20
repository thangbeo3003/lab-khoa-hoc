// Bài: Tốc độ phản ứng (Hoá 10), BẢN 2: một bàn 3D 4 trạm, 10 bước, một bảng điền dần (LUONG_1_BAI_HOC.md mục 2).
// Khung gọn theo trang mẫu (mục 2.17): thanh trên có câu hỏi chính · hàng chuỗi nhân quả · thanh bước · thẻ "Bước này" liền một khối (câu hỏi → em đoán → làm thử → kết luận)
// · "Bảng điều khiển" bên phải chỉ có số đo, điều khiển và đồ thị của đúng bước đang làm. Bản khung ba nhịp trước đó: backup_L1_ban2_20261119_khung_ba_nhip/.
// Thao tác theo define mục 2.19: MỘT bộ núm chung luôn hiện ở bảng phải; mỗi bước đặt sẵn bàn, cho đúng một thao tác, vặn là thấy ngay, đạt đích thì kết luận tự hiện.
// Dữ kiện và nguồn: facts.md cùng thư mục. Chưa có giáo viên duyệt.
import { h, fmt } from '../../shell/shell.js';
import { RunGraph } from '../../shell/graph.js';
import { LifeRace } from '../../shell/life.js';
import { createBench, STATIONS } from './scene.js';
import { REF, CONC, TEMP, tConc, tTemp, tSurf, tCat, kCat, surfRun, gasAt, rateAt, V_MAX, lensSetup } from './model2.js';

export const meta = {
  id: 'h10_toc_do_phan_ung_02',
  grade: 'Hoá 10',
  title: 'Tốc độ phản ứng: nhanh hay chậm do đâu?',
  equation: 'tốc độ = lượng chất biến đổi : thời gian',
  layout: 'full', // cảnh 3D phủ kín vùng làm việc, thẻ "Bước này" và "Bảng điều khiển" nổi lên trên
  chain: [
    ['Thước đo', 'nhanh chậm thành con số'],
    ['4 núm vặn', 'mỗi lần chỉ vặn một núm'],
    ['Va chạm hiệu quả', 'vì sao nhanh lên'],
    ['Ngoài đời', 'chỉnh được nhanh chậm'],
  ],
  mainQuestion: 'Cùng một chất, muốn phản ứng nhanh lên hay chậm lại thì vặn cái gì?',
  disclaimer: 'Bản dựng thử 19/11. Chưa có giáo viên duyệt. Hoá chất và nồng độ theo bài 19 Hoá 10 Kết nối tri thức, lấy qua trang giải bài, chưa đối chiếu sách in. Thời gian phản ứng là SỐ MINH HOẠ do mô hình tính (thời gian mất chữ X và hoá hồng chưa có số đo có nguồn), đã rút ngắn so với thật. Vòng kính soi hạt là minh hoạ.',
};

// link: mắt xích của chuỗi nhân quả. knob: núm của bước (được viền sáng ở bảng điều khiển). todo: MỘT thao tác của bước.
export const steps = [
  { short: 'Làm quen bàn', station: null, link: [0, 1, 2, 3], knob: [],
    q: 'Bột mì nằm trong bao thì không sao, bụi bột mì bay lơ lửng gặp tia lửa lại có thể nổ. Cùng một chất, sao lúc chậm lúc nhanh?',
    todo: 'Kéo để xoay nhìn quanh bàn, hoặc chạm vào một trạm để tới gần.' },
  { short: 'Thước đo', station: 'gas', link: 0, knob: ['drop'], q: 'Nhìn bình sủi bọt, làm sao nói được nó nhanh hay chậm bằng một con số?',
    todo: 'Gạt núm "Thả đá vôi" rồi nhìn pit-tông của xi-lanh, số mL và đồng hồ.' },
  { short: 'Nồng độ', station: 'conc', link: 1, knob: ['conc'], q: 'Hai bình giống hệt nhau. Pha bình bên phải đặc hơn thì chữ X mất sớm hơn hay muộn hơn?',
    todo: 'Kéo núm Nồng độ từ 0,05 M lên 0,30 M, nhìn bình thí nghiệm và số giây.' },
  { short: 'Nhiệt độ', station: 'temp', link: 1, knob: ['temp'], q: 'Không thêm chất nào, chỉ đun nóng ống bên phải thì nó hoá hồng sớm hơn bao nhiêu?',
    todo: 'Kéo núm Nhiệt độ từ 25 °C lên ít nhất 45 °C, nhìn ống thí nghiệm và số giây.' },
  { short: 'Bề mặt', station: 'surf', link: 1, knob: ['size'], q: 'Cùng một lượng đá vôi, đập nhỏ ra thì khí thoát nhanh hơn không, và có ra nhiều khí hơn không?',
    todo: 'Gạt núm Cỡ hạt sang "đập nhỏ", nhìn bọt trong bình thí nghiệm và hai đường trên đồ thị.' },
  { short: 'Xúc tác', station: 'cat', link: 1, knob: ['cat'], q: 'Giữ nguyên tất cả, chỉ thêm một nhúm bột đen, sao bọt lại trào lên?',
    todo: 'Gạt núm Xúc tác sang "có MnO₂", nhìn bọt trong bình thí nghiệm.' },
  { short: 'Nhìn vào trong', station: 'lens', link: 2, knob: ['conc', 'temp', 'size', 'cat'], q: 'Bốn núm khác hẳn nhau, sao núm nào cũng làm phản ứng nhanh lên?',
    todo: 'Vặn lần lượt ít nhất 3 núm, mỗi lần nhìn vòng kính và số va chạm hiệu quả mỗi giây.' },
  { short: 'Thao tác sai', station: 'conc', link: 1, knob: ['conc', 'temp'], q: 'Vặn hai núm cùng một lúc thì có biết núm nào làm nhanh lên không?',
    todo: 'Cố tình làm sai: tăng cả Nồng độ lẫn Nhiệt độ rồi nhìn số "nhanh gấp".' },
  { short: 'Đời sống', station: null, link: 3, knob: ['life'], q: 'Viên sủi bẻ vụn có tan nhanh hơn viên nguyên không? Từ đó trả lời câu hỏi bột mì.',
    todo: 'Gạt "Thả viên sủi" để thả cùng lúc một viên nguyên và một viên bẻ vụn.' },
  { short: 'Sát hạch', station: 'conc', link: [0, 1, 2, 3], knob: ['conc', 'temp'], q: 'Sát hạch: làm cho chữ X mất sau đúng 15 giây.',
    todo: 'Chỉ dùng núm Nồng độ và Nhiệt độ, đưa thời gian về 14–16 s rồi giữ nguyên 15 giây. Giữa chừng sẽ có một núm bị gạt lệch.' },
];

// Mỗi trạm: sẽ thử gì, phương trình và điều kiện hiện trên cảnh.
const INFO = {
  conc: { eq: 'Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O', cond: 'cùng lượng acid · chỉ khác nồng độ Na₂S₂O₃',
    text: 'Hai bình sodium thiosulfate đặt trên giấy có chữ X, cùng rót sulfuric acid. Bình đục dần tới lúc không còn thấy chữ X.', note: 'Khí SO₂ độc: ngoài thật phải làm ở nơi thoáng.' },
  temp: { eq: 'Mg + 2H₂O → Mg(OH)₂ + H₂↑', cond: 'cùng lượng Mg và nước · chỉ khác nhiệt độ',
    text: 'Hai ống nghiệm có magnesium, nước và vài giọt phenolphthalein. Dung dịch hoá hồng khi phản ứng đã xảy ra.' },
  surf: { eq: 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O', cond: '20 mL HCl 0,5 M · 25 °C · chỉ khác cỡ hạt đá vôi',
    text: 'Hai bình cùng một lượng hydrochloric acid và cùng 0,30 g đá vôi, chỉ khác cỡ hạt.' },
  cat: { eq: '2H₂O₂ → 2H₂O + O₂↑', cond: 'cùng lượng H₂O₂ · chỉ khác có hay không có MnO₂',
    text: 'Hai bình hydrogen peroxide. Bình thí nghiệm có thể thêm một ít bột manganese dioxide.' },
  gas: { eq: 'tốc độ trung bình = lượng chất biến đổi : thời gian', cond: 'đọc thể tích khí theo thời gian',
    text: 'Bình tam giác nối với xi-lanh. Khí sinh ra đẩy pit-tông nên đọc được thể tích khí theo thời gian.' },
  lens: { eq: 'va chạm hiệu quả → phản ứng xảy ra', cond: 'mô hình minh hoạ',
    text: 'Phóng to tới hạt. Hạt sáng là hạt đủ năng lượng; hai hạt sáng chạm nhau thì loé lên: một va chạm hiệu quả.' },
};
const label = (s) => (s.n ? s.n + ' ' : '') + s.name;
const st = (id) => STATIONS.find((x) => x.id === id);
const clamp = (x) => Math.min(1, Math.max(0, x));
const fmtT = (t) => (t >= 3600 ? `${fmt(t / 3600, 1)} giờ` : `${fmt(t, 1)} s`);
const SPEED = { conc: 14, temp: 11, surf: 26, cat: 3, gas: 4 }; // đồng hồ của mỗi trạm chạy nhanh gấp mấy lần thời gian thật
const LIFE = { title: 'Trong bếp nhà em: viên sủi', factor: 'diện tích bề mặt', doneText: 'Tan hết', speed: 2, gasLabel: 'Khí CO₂ đã thoát ra',
  sides: [{ label: 'Viên nguyên', form: 'vien', seconds: 24 }, { label: 'Viên bẻ vụn', form: 'vun', seconds: 8 }] }; // số của bản 1, chưa dẫn nguồn (F13)
const EXAM = { lo: 14, hi: 16, hold: 15, trapAt: 6 };

export function createLesson(shell) {
  const bench = createBench(shell.els.stage), live = bench.live;
  const D = shell.state.data; // phần được lưu lại: vị trí bốn núm, bước đã làm, kết luận đã mở
  D.k = { ...REF, ...(D.k || {}) }; D.done = D.done || {}; D.reveal = D.reveal || {}; D.picks = D.picks || [];
  const K = D.k;
  shell.state.step = 0; // như trang mẫu: mỗi lần mở bài đều bắt đầu ở bước 1 (kết quả đã làm vẫn giữ)
  const S = { step: 0, picks: new Set(D.picks), tour: null, tags: true, clk: { conc: 0, temp: 0, surf: 0, cat: 0 }, gasT: 0, changed: new Set(), hold: 0, trapped: false, life: null, ui: null, acc: 0 };
  const eqCard = h('div', { class: 'lk-eqcard is-bottom', hidden: true }), toastEl = h('div', { class: 'lk-toast', hidden: true, role: 'status' });
  const resetBtn = h('button', { class: 'lk-btn lk-reset', type: 'button', hidden: true, onclick: () => bench.stage.resetView() }, '⟲ Về góc chuẩn');
  shell.els.stage.append(eqCard, toastEl, resetBtn);
  bench.stage.setMoveHandler((moved) => { resetBtn.hidden = !moved; if (moved && S.step === 0) { S.moved = true; check(); } });
  bench.stage.onFrame((dt) => { bench.update(dt); tick(dt); });
  let toastT = 0;
  const toast = (text) => { toastEl.textContent = text; toastEl.hidden = false; toastT = 4.5; };

  // Nút bật tắt tên dụng cụ trên thanh trên
  const tagBtn = h('button', { class: 'lk-btn lk-act is-on', type: 'button', 'aria-pressed': 'true', onclick: () => { S.tags = !S.tags; tagBtn.classList.toggle('is-on', S.tags); tagBtn.setAttribute('aria-pressed', String(S.tags)); syncTags(); } }, 'Tên dụng cụ');
  shell.els.actions.append(tagBtn);

  // ---------- Cảnh: vùng an toàn, tới trạm ----------
  const wide = matchMedia('(min-width:900px)');
  let narrow = false, shown = null; // narrow: vùng trống giữa hai bảng hẹp, toàn cảnh đổi sang góc nhìn chéo. shown: trạm đang xem gần
  function syncInsets() {
    const el = shell.els.stage, s = el.getBoundingClientRect(); if (!s.width || !s.height) return;
    let l = 0, r = 0;
    if (wide.matches) [shell.els.card, shell.els.panel].forEach((box) => {
      const b = box.getBoundingClientRect();
      if (!b.width || b.bottom <= s.top || b.top >= s.bottom || b.right <= s.left || b.left >= s.right) return;
      if (b.left - s.left < s.right - b.right) l = Math.max(l, (b.right - s.left) / s.width); else r = Math.max(r, (s.right - b.left) / s.width);
    });
    el.style.setProperty('--safe-l', (l * 100).toFixed(2) + '%'); el.style.setProperty('--safe-r', (r * 100).toFixed(2) + '%');
    const e = eqCard.hidden ? 0.03 : Math.min(0.26, (eqCard.offsetHeight + 22) / el.clientHeight);
    bench.stage.setInsets({ l: l ? l + 0.01 : 0, r: r ? r + 0.01 : 0, t: 0.07, b: e }); // thẻ phương trình ở đáy, dòng thông báo ở đỉnh vùng trống
    narrow = (s.width * (1 - l - r)) / (s.height * (1 - 0.07 - e)) < 1.1; // chỉ đổi sang góc chéo khi vùng trống gần vuông hoặc dọc
    if (S.vn !== undefined && S.vn !== narrow && S.over) { S.vn = narrow; bench.view(narrow ? 'all2' : 'all'); }
  }
  const ro = new ResizeObserver(syncInsets); [shell.els.stage, shell.els.card, shell.els.panel].forEach((el) => ro.observe(el));
  wide.addEventListener('change', () => { syncInsets(); if (!shown) focus(null); });
  const syncTags = () => bench.setTags(S.tags ? shown || 'all' : null, S.step === 0 ? S.picks : new Set(), null);
  function showEq(id) {
    const info = id && INFO[id]; eqCard.hidden = !info; if (!info) return;
    const s = st(id);
    eqCard.replaceChildren(h('small', {}, h('i', { style: `background:${s.color}` }), label(s)), h('b', { text: info.eq }), info.cond && h('em', { text: info.cond }));
  }
  function focus(id) { shown = id || null; S.over = !id; bench.setActive(id); showEq(id); syncInsets(); S.vn = narrow; bench.view(id || (narrow ? 'all2' : 'all')); syncTags(); }
  function pick(id) {
    if (S.step !== 0 || !INFO[id]) return;
    S.picks.add(id); D.picks = [...S.picks]; shell.save(); S.tour = id; focus(id); check(); shell.refresh();
  }
  bench.onPick(pick);

  // ---------- Bốn núm + núm thả đá vôi: một bộ chung cho cả bài ----------
  const KNOBS = {
    drop: { name: 'Thả đá vôi', where: 'bộ đo khí', kind: 'sw', get: () => !!D.drop, set: (v) => { D.drop = v; S.gasT = 0; }, text: () => (D.drop ? 'đã thả' : 'chưa thả') },
    conc: { name: 'Nồng độ Na₂S₂O₃', where: 'trạm Nồng độ', kind: 'range', min: 0, max: CONC.length - 1, step: 1, get: () => Math.max(0, CONC.indexOf(K.conc)), set: (v) => { K.conc = CONC[v]; S.clk.conc = 0; }, text: () => fmt(K.conc, 2) + ' M', ends: ['0,05 M (đối chứng)', '0,30 M'] },
    temp: { name: 'Nhiệt độ', where: 'trạm Nhiệt độ', kind: 'range', min: TEMP.min, max: TEMP.max, step: TEMP.step, get: () => K.temp, set: (v) => { K.temp = v; S.clk.temp = 0; S.clk.conc = 0; }, text: () => K.temp + ' °C', ends: ['25 °C (đối chứng)', '65 °C'] },
    size: { name: 'Cỡ hạt đá vôi', where: 'trạm Bề mặt', kind: 'sw', get: () => K.size === 'vun', set: (v) => { K.size = v ? 'vun' : 'vien'; S.clk.surf = 0; }, text: () => (K.size === 'vun' ? 'đập nhỏ' : 'viên') },
    cat: { name: 'Xúc tác', where: 'trạm Xúc tác', kind: 'sw', get: () => !!K.cat, set: (v) => { K.cat = v; S.clk.cat = 0; }, text: () => (K.cat ? 'có MnO₂' : 'không có') },
  };
  // Trạm Nồng độ chỉ "ăn" núm Nhiệt độ ở bước Thao tác sai và Sát hạch (hai bước cho vặn hai núm). Ở các bước khác bình thí nghiệm của trạm này luôn ở 25 °C,
  // để bước Nồng độ chỉ khác đối chứng đúng một thứ dù em đã vặn Nhiệt độ ở bước khác.
  const kc = () => ({ conc: K.conc, temp: S.step === 7 || S.step === 9 ? K.temp : REF.temp });
  // Thời gian phản ứng ở trạm của bước: [bình thí nghiệm, bình đối chứng]
  const times = (stn) => (stn === 'conc' ? [tConc(kc()), tConc(REF)] : stn === 'temp' ? [tTemp(K), tTemp(REF)] : stn === 'surf' ? [tSurf(K), tSurf(REF)] : stn === 'cat' ? [tCat(K), tCat(REF)] : null);
  const MEASURE = { conc: 'giây tới khi mất chữ X', temp: 'giây tới khi hoá hồng', surf: 'giây để thu nửa lượng khí', cat: 'để thu nửa lượng O₂' };
  function syncLabels() {
    live.label('conc', `Thí nghiệm · ${fmt(K.conc, 2)} M` + (kc().temp !== REF.temp ? ` · ${K.temp} °C` : '')); live.label('temp', `Thí nghiệm · ${K.temp} °C`);
    live.label('surf', `Thí nghiệm · đá vôi ${K.size === 'vun' ? 'đập nhỏ' : 'viên'}`); live.label('cat', `Thí nghiệm · ${K.cat ? 'H₂O₂ thêm MnO₂' : 'chỉ có H₂O₂'}`);
    live.lens(lensSetup(K));
  }
  function onKnob(id, v) {
    KNOBS[id].set(v); shell.save(); syncLabels(); if (S.step === 6) S.changed.add(id);
    const stn = id === 'temp' && stnOf(S.step) === 'conc' ? 'conc' : { conc: 'conc', temp: 'temp', size: 'surf', cat: 'cat' }[id]; // đang đứng ở trạm Nồng độ mà vặn Nhiệt độ thì báo số của trạm đang xem
    if (id === 'drop') toast(v ? 'Đá vôi đã vào bình: khí CO₂ đẩy pit-tông của xi-lanh.' : 'Đã lấy đá vôi ra, xi-lanh về 0.');
    else { const [te, tr] = times(stn); toast(`${KNOBS[id].name}: ${KNOBS[id].text()}. ${stn === 'cat' ? 'Thu nửa lượng O₂ sau' : stn === 'surf' ? 'Thu nửa lượng khí sau' : stn === 'conc' ? 'Chữ X mất sau' : 'Hoá hồng sau'} ${fmtT(te)}, đối chứng ${fmtT(tr)}.`); }
    if (S.step === 9) S.hold = 0;
    syncPanel(); if (D.done[S.step]) shell.refresh(); else check(); // bước đã làm: viết lại kết luận theo số mới (ví dụ kéo tiếp núm Nhiệt độ)
  }
  // Đặt sẵn bàn cho một bước chưa làm: núm của bước về mức đối chứng, chỉ thiếu đúng một thao tác
  function preset(i) {
    const kn = steps[i].knob;
    if (kn.includes('drop')) { D.drop = false; S.gasT = 0; }
    if (i === 9) Object.assign(K, REF); else kn.forEach((id) => { if (id in REF) K[id] = REF[id]; });
    if (i === 6) S.changed.clear();
    if (i === 9) { S.hold = 0; S.trapped = false; }
    Object.keys(S.clk).forEach((k) => { S.clk[k] = 0; });
    shell.save(); syncLabels();
  }
  const DONE = [
    () => S.moved || S.picks.size > 0,
    () => D.drop && gasAt(surfRun('vien'), S.gasT) >= V_MAX / 2,
    () => K.conc >= 0.3,
    () => K.temp >= 45,
    () => K.size === 'vun',
    () => !!K.cat,
    () => S.changed.size >= 3,
    () => K.conc !== REF.conc && K.temp !== REF.temp,
    () => !!(S.life && S.life.done),
    () => S.hold >= EXAM.hold,
  ];
  function check() {
    const i = S.step; if (D.done[i] || !DONE[i]()) return;
    D.done[i] = true; shell.save(); shell.refresh();
    if (i === 9) toast('ĐẠT: em giữ được 15 giây trong khoảng cho phép.');
  }

  // ---------- Mỗi khung hình: bốn trạm tự chạy lặp theo vị trí núm; bộ đo khí chạy khi đã thả đá vôi ----------
  const r0 = rateAt(surfRun('vun'), 1), r0v = rateAt(surfRun('vien'), 1);
  function tick(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.hidden = true; }
    const loop = (id, len) => { S.clk[id] += dt * SPEED[id]; if (S.clk[id] > len + 1.6 * SPEED[id]) S.clk[id] = 0; return Math.min(S.clk[id], len); };
    { const te = tConc(kc()), tr = tConc(REF), t = loop('conc', Math.max(te, tr) * 1.12); live.conc(0, clamp(t / tr)); live.conc(1, clamp(t / te)); live.timer(Math.min(t, te)); }
    { const te = tTemp(K), tr = tTemp(REF), t = loop('temp', Math.max(te, tr) * 1.12), p = (x, tx) => clamp((x / tx - 0.55) / 0.45); live.temp(0, p(t, tr), false); live.temp(1, p(t, te), K.temp > REF.temp); }
    { const t = loop('surf', 215); ['vien', K.size].forEach((form, k) => { const run = surfRun(form); live.surf(k, form, 1 - gasAt(run, t) / V_MAX, clamp(rateAt(run, t) / r0)); }); }
    { const t = loop('cat', 26); [false, K.cat].forEach((has, k) => { const kk = kCat({ cat: has }); live.cat(k, has, has ? clamp(Math.exp(-kk * t) * 1.05) : 0.03); }); }
    if (D.drop) S.gasT = Math.min(S.gasT + dt * SPEED.gas, 300);
    { const run = surfRun('vien'), v = D.drop ? gasAt(run, S.gasT) : 0; live.gas(!!D.drop, 1 - v / V_MAX, clamp(rateAt(run, S.gasT) / r0v), v); }
    if (S.life) S.life.advance(dt);
    if (S.step === 9 && !D.done[9]) { // sát hạch: giữ thời gian trong khoảng cho phép; giữa chừng một núm bị gạt lệch
      const t = tConc(kc()), ok = t >= EXAM.lo && t <= EXAM.hi; S.hold = ok ? S.hold + dt : 0;
      if (ok && !S.trapped && S.hold >= EXAM.trapAt) { S.trapped = true; K.temp = K.temp >= TEMP.max ? K.temp - 10 : K.temp + 10; S.clk.conc = 0; S.hold = 0; shell.save(); syncLabels(); shell.rerenderPanel(); toast('Có người vừa gạt lệch núm Nhiệt độ. Em chỉnh lại để về 14–16 s.'); }
    }
    if (S.step === 1 || S.step === 8 || S.step === 9) check();
    S.acc += dt; if (S.acc >= 0.1) { S.acc = 0; syncPanel(); }
  }

  // ---------- Bảng điều khiển (phải): số đo to, các ô số nhỏ, đủ mọi núm, đồ thị ----------
  const stnOf = (i) => (steps[i].station && steps[i].station !== 'gas' && steps[i].station !== 'lens' ? steps[i].station : null);
  function readout(i) {
    const stn = stnOf(i);
    if (i === 1) { const run = surfRun('vien'), v = D.drop ? gasAt(run, S.gasT) : 0, half = v >= V_MAX / 2; return { label: 'Thể tích khí CO₂ trong xi-lanh', big: fmt(v, 1), unit: 'mL', cells: [['Đồng hồ', fmt(D.drop ? S.gasT : 0, 1) + ' s'], ['Tốc độ trung bình', half ? fmt(V_MAX / 2 / run.tHalf, 2) + ' mL/s' : '–'], ['Nửa lượng khí sau', half ? fmt(run.tHalf, 1) + ' s' : '–']] }; }
    if (i === 6) { const o = lensSetup(K); return { label: 'Va chạm hiệu quả mỗi giây (vòng kính)', big: fmt(live.lensRate(), 1), unit: 'lần/s', cells: [['Số hạt', String(o.count)], ['Hạt đủ năng lượng', Math.round(o.hot * 100) + '%'], ['Độ nhanh của hạt', '×' + fmt(o.speed, 2)]] }; }
    if (stn) { const [te, tr] = times(stn), x = i === 9; return { label: 'Bình thí nghiệm: ' + MEASURE[stn], big: te >= 3600 ? fmt(te / 3600, 1) : fmt(te, 1), unit: te >= 3600 ? 'giờ' : 's', cells: [['Đối chứng', fmtT(tr)], ['Nhanh gấp', fmt(tr / te, te >= 3600 || tr >= 3600 ? 0 : 1) + ' lần'], x ? ['Đã giữ', `${fmt(Math.min(S.hold, EXAM.hold), 0)}/${EXAM.hold} s`] : ['Đồng hồ trạm', fmt(Math.min(S.clk[stn], Math.max(te, tr)), 0) + ' s']] }; }
    const moved = ['conc', 'temp', 'size', 'cat'].filter((k) => K[k] !== REF[k]).length;
    return { label: 'Số núm đang khác mức đối chứng', big: String(moved), unit: '/ 4 núm', cells: [['Nồng độ', '×' + fmt(tConc({ ...REF }) / tConc({ ...REF, conc: K.conc }), 1)], ['Nhiệt độ', '×' + fmt(tTemp(REF) / tTemp(K), 1)], ['Bề mặt', '×' + fmt(tSurf(REF) / tSurf(K), 1)]] };
  }
  function syncPanel() {
    const ui = S.ui; if (!ui) return;
    const r = readout(S.step); ui.label.textContent = r.label; ui.big.textContent = r.big; ui.unit.textContent = r.unit;
    r.cells.forEach((c, n) => { ui.cells[n][0].textContent = c[0]; ui.cells[n][1].textContent = c[1]; });
    Object.entries(ui.vals).forEach(([id, el]) => { el.textContent = KNOBS[id].text(); });
    if (ui.graph) {
      const cut = (run, t) => [...run.points.filter((p) => p[0] <= t), [t, gasAt(run, t)]];
      if (S.step === 1) ui.graph.set(D.drop ? [{ points: cut(surfRun('vien'), S.gasT), color: '#475569', label: 'đá vôi viên', live: S.gasT < 290 }] : []);
      else { const t = Math.min(S.clk.surf, 215); ui.graph.set(['vien', K.size].map((form, k) => ({ points: cut(surfRun(form), t), color: k ? '#6254f4' : '#475569', label: k ? 'thí nghiệm' : 'đối chứng', live: t < 214 }))); }
    }
  }
  const put = (host, ...kids) => host.append(...kids.flat().filter(Boolean)); // append() biến false/null thành chữ, nên lọc trước
  const ph = (title, hint) => h('div', { class: 'lk-ph' }, h('b', { text: title }), h('span', { text: hint }));
  // off: núm thuộc trạm khác với trạm đang xem → khoá lại. Vặn nó thì thứ đổi nằm ngoài khung hình, người học không thấy gì (chủ bắt lỗi 19/11: đang ở trạm Xúc tác mà báo pit-tông).
  function knobRow(id, now, off) {
    const k = KNOBS[id], val = h('b', { class: 'lk-kv', text: k.text() });
    const input = k.kind === 'sw'
      ? h('input', { type: 'checkbox', class: 'lk-sw', role: 'switch', 'aria-label': k.name, checked: k.get() || null, disabled: off || null, onchange: (e) => onKnob(id, e.target.checked) })
      : h('input', { type: 'range', class: 'lk-range', 'aria-label': k.name, min: k.min, max: k.max, step: k.step, value: k.get(), disabled: off || null, oninput: (e) => onKnob(id, Number(e.target.value)) });
    if (k.kind === 'sw') input.checked = k.get(); else input.value = k.get();
    return [h('div', { class: 'lk-knob' + (now ? ' is-now' : '') + (off ? ' is-off' : '') + (k.kind === 'range' ? ' is-range' : ''), title: off ? `Núm này thuộc ${k.where}. Sang bước của trạm đó để vặn.` : null },
      now && h('i', { class: 'lk-nowtag', text: 'Bước này' }),
      h('div', { class: 'lk-knob-h' }, h('span', {}, k.name, h('small', { text: ' · ' + k.where + (off ? ' (đang khoá)' : '') })), val, k.kind === 'sw' && input),
      k.kind === 'range' && input, k.kind === 'range' && h('div', { class: 'lk-knob-ends' }, h('span', { text: k.ends[0] }), h('span', { text: k.ends[1] }))), val];
  }
  function renderPanel(i, host) {
    const now = steps[i].knob, cells = [0, 1, 2].map(() => [h('span'), h('b')]), label = h('span'), big = h('b'), unit = h('em'), vals = {};
    const hasGraph = i === 1 || i === 4, gHost = hasGraph && h('div');
    put(host, ph('Bảng điều khiển', i === 0 ? 'Các núm của cả bài' : 'Chỉ núm của trạm đang xem được mở'),
      h('div', { class: 'lk-read' }, label, h('div', {}, big, unit)),
      h('div', { class: 'lk-big' }, cells.map(([a, b]) => h('div', {}, a, b))),
      Object.keys(KNOBS).map((id) => { const [row, val] = knobRow(id, now.includes(id), i !== 0 && !now.includes(id)); vals[id] = val; return row; }), // bước 1 nhìn cả bàn nên mở hết; các bước khác chỉ mở núm của trạm đang xem
      i === 8 && h('div', { class: 'lk-knob is-now' }, h('i', { class: 'lk-nowtag', text: 'Bước này' }),
        h('div', { class: 'lk-knob-h' }, h('span', {}, 'Thả viên sủi', h('small', { text: ' · trong bếp' })), h('b', { class: 'lk-kv', text: S.life && S.life.done ? 'tan hết' : S.life && S.life.playing ? 'đang sủi' : 'chưa thả' }),
          h('input', { type: 'checkbox', class: 'lk-sw', role: 'switch', 'aria-label': 'Thả viên sủi', checked: (S.life && (S.life.playing || S.life.done)) || null, onchange: (e) => { if (e.target.checked && S.life) { S.life.play(); toast('Hai viên cùng xuống nước: viên bẻ vụn sủi mạnh hơn hẳn.'); } shell.rerenderPanel(); } }))),
      hasGraph && h('div', { class: 'lk-box' }, h('h3', { text: 'Thể tích khí CO₂ theo thời gian' }), gHost));
    S.ui = { label, big, unit, cells, vals, graph: hasGraph ? new RunGraph(gHost, { yMax: 80, yTitle: 'mL', ref: V_MAX, refLabel: `tối đa ${fmt(V_MAX, 0)} mL` }) : null };
    syncPanel();
  }

  // ---------- Thẻ "Bước này" (trái): câu hỏi → trạm → Làm thử (một thao tác) → Kết luận tự hiện khi đạt đích ----------
  const where = (id) => { const s = st(id), info = INFO[id]; return h('p', { class: 'lk-where' }, h('i', { class: 'lk-dot', style: `background:${s.color}` }), h('span', {}, h('b', { text: 'Trạm ' + label(s) + '. ' }), info.text, info.note ? ' ' + info.note : '')); };
  // Kết luận của từng bước: [câu kết luận sinh từ số đang có, các ý chính, "bỏ bước này thì…"]
  function conclusion(i) {
    const k = (a, b) => fmt(a / b, 1);
    switch (i) {
      case 0: return ['Bàn có 4 trạm ứng với 4 núm em vặn được: nồng độ, nhiệt độ, bề mặt tiếp xúc, chất xúc tác. Mỗi trạm có một bình đối chứng và một bình thí nghiệm.', ['Bộ đo khí là thước đo chung của bài.', 'Vòng kính để nhìn tới mức hạt.'], 'các bước sau không biết đang đứng ở đâu trên bàn.'];
      case 1: { const run = surfRun('vien'); return [`Thu được ${fmt(V_MAX / 2, 1)} mL khí trong ${fmt(run.tHalf, 1)} s, tức trung bình ${fmt(V_MAX / 2 / run.tHalf, 2)} mL mỗi giây. Tốc độ phản ứng = lượng chất biến đổi : thời gian.`, ['Đường đồ thị càng dốc thì phản ứng càng nhanh.', 'Càng về sau khí ra càng chậm, vì chất phản ứng vơi dần.'], 'chỉ nói được bình nào nhanh hơn, không nói được nhanh gấp mấy.']; }
      case 2: { const a = tConc({ ...REF }), b = tConc({ ...REF, conc: 0.3 }); return [`Tăng nồng độ từ 0,05 M lên 0,30 M: chữ X mất sau ${fmtT(b)} thay vì ${fmtT(a)}, nhanh gấp ${k(a, b)} lần. Nồng độ chất phản ứng càng lớn thì tốc độ phản ứng càng lớn.`, ['Chỉ đổi nồng độ, giữ nguyên nhiệt độ và lượng acid.', 'Với chất khí, tăng áp suất cũng là tăng nồng độ.'], 'không giải thích được vì sao ở bước 2 khí ra chậm dần.']; }
      case 3: { const a = tTemp(REF), b = tTemp({ temp: Math.max(45, K.temp) }); return [`Đun từ 25 °C lên ${Math.max(45, K.temp)} °C: hoá hồng sau ${fmtT(b)} thay vì ${fmtT(a)}, nhanh gấp ${k(a, b)} lần. Nhiệt độ càng cao thì tốc độ phản ứng càng lớn.`, ['Hệ số Van\'t Hoff γ: tăng 10 °C thì nhanh gấp 2 đến 4 lần (mô hình này dùng γ = 2).', 'Không thêm chất nào: chỉ có hạt chuyển động nhanh hơn.'], 'tưởng muốn nhanh thì chỉ có cách pha đặc, không hiểu vì sao tủ lạnh giữ được thức ăn.']; }
      case 4: { const a = tSurf({ size: 'vien' }), b = tSurf({ size: 'vun' }); return [`Đá vôi đập nhỏ thu nửa lượng khí sau ${fmtT(b)}, đá vôi viên sau ${fmtT(a)}: nhanh gấp ${k(a, b)} lần. Hai bình vẫn dừng ở cùng ${fmt(V_MAX, 0)} mL. Diện tích bề mặt tiếp xúc càng lớn thì tốc độ càng lớn.`, ['Nhanh hơn không có nghĩa là nhiều hơn: lượng đá vôi như nhau nên lượng khí như nhau.', 'Chỉ lớp ngoài của chất rắn chạm được dung dịch.'], 'không trả lời được câu bột mì, và giữ nguyên hiểu lầm "nhanh thì nhiều".']; }
      case 5: { const a = tCat({ cat: false }), b = tCat({ cat: true }); return [`Thêm MnO₂: nửa lượng O₂ thoát ra sau ${fmtT(b)}; không có thì mất khoảng ${fmtT(a)}. Chất xúc tác làm tăng tốc độ phản ứng.`, ['Sau phản ứng MnO₂ vẫn còn nguyên, không bị tiêu hao.', 'Xúc tác không làm tăng lượng sản phẩm.'], 'thiếu núm thứ tư; không hiểu vai trò của enzyme trong cơ thể.']; }
      case 6: return ['Cả bốn núm đều làm tăng số va chạm hiệu quả mỗi giây, nên phản ứng nhanh lên.', ['Nồng độ: nhiều hạt hơn nên va nhau nhiều hơn.', 'Nhiệt độ: hạt nhanh hơn và nhiều hạt đủ năng lượng hơn.', 'Bề mặt: nhiều chỗ để va hơn. Xúc tác: va chạm cần ít năng lượng hơn.'], 'bốn kết luận phải học thuộc rời nhau.'];
      case 7: { const a = tConc(REF), b = tConc(kc()); return [`Em vặn cả hai núm: nhanh gấp ${k(a, b)} lần, nhưng không tách được phần của Nồng độ và phần của Nhiệt độ. Muốn biết một yếu tố ảnh hưởng thế nào thì mỗi lần chỉ đổi một yếu tố.`, ['Bình đối chứng tồn tại để so: nó chỉ khác bình thí nghiệm đúng một thứ.'], 'gặp đề hỏi "yếu tố nào" sẽ kết luận sai.']; }
      case 8: return ['Viên sủi bẻ vụn tan nhanh gấp khoảng 3 lần viên nguyên vì bề mặt tiếp xúc với nước lớn hơn. Bột mì cũng vậy: bụi lơ lửng có bề mặt tiếp xúc với không khí rất lớn nên cháy rất nhanh, có thể nổ; bột nén trong bao thì không.', ['Ngoài đời: thái nhỏ thức ăn cho mau chín, để tủ lạnh cho lâu hỏng, dùng men (xúc tác) để ủ.'], 'bài dừng ở phòng thí nghiệm, câu hỏi mở đầu bị bỏ lửng.'];
      default: return ['Sát hạch không có nội dung mới: em vừa dùng đúng hai núm, đọc số đo và giữ điều kiện ổn định.', ['Có nhiều cách về 15 s: ví dụ 0,10 M ở 45 °C, hoặc 0,30 M ở 30 °C.'], ''];
    }
  }
  function renderCard(i, host) {
    const s = steps[i], done = !!D.done[i], open = done || D.reveal[i];
    put(host, ph('Bước này', `Bước ${i + 1}/${steps.length} · Câu hỏi → Làm thử → Kết luận`),
      h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short })),
      h('h2', { class: 'lk-q', text: s.q }),
      (i === 0 ? S.tour : s.station) && where(i === 0 ? S.tour : s.station),
      i === 0 && S.tour && h('div', { class: 'lk-cardfoot' }, h('button', { class: 'lk-btn', type: 'button', onclick: () => { S.tour = null; focus(null); shell.refresh(); } }, '‹ Về toàn cảnh')),
      h('div', { class: 'lk-task' }, h('b', {}, 'Làm thử', h('span', { class: 'lk-status' + (done ? ' is-done' : ''), text: done ? 'Đã làm' : 'Chưa làm' })), h('p', { text: s.todo })));
    if (open) {
      const [main, points, without] = conclusion(i);
      put(host, h('div', { class: 'lk-concl' }, h('b', { text: 'Kết luận' }), h('p', { text: main })),
        h('ul', { class: 'lk-ideas' }, points.map((t) => h('li', { text: t })), without && h('li', { class: 'is-without', text: 'Bỏ bước này thì ' + without })));
    }
    put(host, h('div', { class: 'lk-cardfoot' },
      !open && h('button', { class: 'lk-btn is-pri', type: 'button', onclick: () => { D.reveal[i] = true; shell.save(); shell.refresh(); } }, 'Hiện kết luận'),
      h('button', { class: 'lk-btn', type: 'button', onclick: () => { D.done[i] = false; D.reveal[i] = false; if (i === 0) { S.picks.clear(); D.picks = []; S.moved = false; S.tour = null; focus(null); } if (i === 8 && S.life) startLife(); preset(i); shell.refresh(); shell.rerenderPanel(); toast('Đã đặt lại bước: bàn về trạng thái đầu của bước này.'); } }, 'Đặt lại bước này'),
      done && i < steps.length - 1 && h('button', { class: 'lk-btn', type: 'button', onclick: () => shell.go(i + 1) }, `Sang bước ${i + 2} ›`)));
    requestAnimationFrame(syncInsets);
  }
  function startLife() {
    const box = h('div', { class: 'lf-host' });
    shell.els.overlay.replaceChildren(box); shell.els.overlay.hidden = false;
    S.life = new LifeRace(box, LIFE);
  }

  syncLabels();
  return {
    bench, state: S, knobs: K, onKnob,
    enter(i) {
      S.step = i; S.ui = null; S.life = null; toastT = 0; toastEl.hidden = true; // dòng thông báo của bước trước không theo sang bước này
      if (!D.done[i]) preset(i);
      if (i === 8) startLife();
      focus(i === 0 ? S.tour : steps[i].station);
    },
    renderCard, renderPanel,
    isDone(i) { return !!D.done[i]; },
  };
}
