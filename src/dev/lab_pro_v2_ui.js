// Giao diện UX/UI nâng tầm cho Lab L1 Pro v2 (10 bước · 3 cột nổi kính mờ · tương tác 2 chiều UI ↔ 3D).
import { createProLabEngine, REF, REF3, tConc, tTemp, tCat, lensSetup, run3, gasAt3 } from './lab_pro_v2_3d.js';
import { sfx } from './lab_pro_v2_sfx.js';

const fmt = (n, d = 1) => Number(n).toFixed(d).replace('.', ',');
const fmtT = (t) => (t >= 3600 ? `${fmt(t / 3600, 1)} giờ` : `${fmt(t, 1)} s`);
const g2 = (m) => fmt(m, 2) + ' g';

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'text') el.textContent = v;
    else if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'checked' || k === 'disabled' || k === 'hidden') el[k] = !!v;
    else el.setAttribute(k, String(v));
  });
  kids.flat(3).filter((x) => x != null && x !== false).forEach((x) => el.append(typeof x === 'string' ? document.createTextNode(x) : x));
  return el;
}

const CHAIN = [
  ['Thước đo', 'nhanh chậm thành con số'],
  ['4 bàn thí nghiệm', 'mỗi lần chỉ đổi một thứ'],
  ['Va chạm hiệu quả', 'vì sao nhanh lên'],
  ['Ngoài đời', 'chỉnh được nhanh chậm'],
];

const STEPS = [
  { short: 'Xem cả phòng', bench: null, link: [0, 1, 2, 3],
    q: 'Bột mì nằm trong bao thì không sao, bụi bột mì bay lơ lửng gặp tia lửa lại có thể nổ. Cùng một chất, sao lúc chậm lúc nhanh?',
    todo: 'Kéo xoay nhìn quanh phòng lab 3D, hoặc chạm trực tiếp vào một bàn thí nghiệm để bay tới gần.' },
  { short: 'Thước đo', bench: 'surf', link: 0,
    q: 'Nhìn bình sủi bọt, làm sao nói được phản ứng nhanh hay chậm bằng một con số cụ thể?',
    todo: 'Bước này dùng MỘT bình (đã đong sẵn 20 mL HCl và cân sẵn 0,30 g đá vôi). Chạm vào đĩa đá vôi (hoặc bấm nút số 4) để thả, rồi xem xi-lanh và đồng hồ.' },
  { short: 'Nồng độ', bench: 'conc', link: 1,
    q: 'Hai bình giống hệt nhau. Rót dung dịch đặc hơn vào bình bên phải thì chữ X dưới đáy mất sớm hơn bao nhiêu?',
    todo: 'Chạm từng lọ đang phát sáng trên bàn (hoặc nút cùng số bên phải): rót 0,05 M → chọn lọ 0,10 M hoặc 0,30 M → rót H₂SO₄ → đọc đồng hồ → rửa bình làm thêm 1 mức nữa.' },
  { short: 'Nhiệt độ', bench: 'temp', link: 1,
    q: 'Không thêm chất nào, chỉ đun nóng ống bên phải bằng đèn cồn thì nước hoá hồng sớm hơn bao nhiêu?',
    todo: 'Nhỏ phenolphthalein → chạm đèn cồn để mở nắp & đun nóng (làm 2 mức nhiệt độ khác nhau) → thả dây Mg → quan sát màu hồng và đồng hồ.' },
  { short: 'Bề mặt', bench: 'surf', link: 1,
    q: 'Cùng một lượng đá vôi, đập nhỏ ra thì khí thoát nhanh hơn không, và có ra nhiều khí hơn không?',
    todo: 'Tự chọn số mL HCl và số gam đá vôi bằng thanh kéo, rồi đong → rót → cân trên cân điện tử → thả đồng thời vào hai bình và so hai đường đồ thị.' },
  { short: 'Xúc tác', bench: 'cat', link: 1,
    q: 'Giữ nguyên tất cả, chỉ xúc thêm một thìa bột đen MnO₂ vào bình bên phải, sao bọt khí lại trào lên dữ dội?',
    todo: 'Chọn lượng H₂O₂ → đong vào ống đong → rót chia đều → xúc 1 thìa MnO₂ → đổ vào bình thí nghiệm & đậy nút, so 2 xi-lanh sau 26 giây.' },
  { short: 'Nhìn vào trong', bench: 'lens', link: 2,
    q: 'Bốn bàn đổi bốn yếu tố khác hẳn nhau, vì sao yếu tố nào cũng làm phản ứng nhanh lên?',
    todo: 'Bật lần lượt ít nhất 3 công tắc bên phải và quan sát hạt sáng va chạm trong vòng kính 3D.' },
  { short: 'Thao tác sai', bench: 'conc', link: 1,
    q: 'Nếu đổi hai yếu tố cùng một lúc thì có tách được yếu tố nào làm phản ứng nhanh lên không?',
    todo: 'Cố tình làm sai: vừa chọn lọ nồng độ đặc hơn, vừa đưa bình thí nghiệm lên bếp điện làm ấm, rồi rót H₂SO₄ chạy thử.' },
  { short: 'Đời sống', bench: 'life', link: 3,
    q: 'Viên sủi bẻ vụn có tan nhanh hơn viên nguyên không? Từ đó giải thích câu hỏi bụi bột mì mở bài.',
    todo: 'Chạm trực tiếp vào đĩa viên sủi trên khay 3D (hoặc bấm nút "Thả viên sủi" bên phải) để so 2 cốc nước cùng lúc.' },
  { short: 'Sát hạch', bench: 'conc', link: [0, 1, 2, 3],
    q: 'Sát hạch: hãy chỉnh thí nghiệm ở Bàn 1 sao cho chữ X của bình thí nghiệm mất đúng trong khoảng 14 đến 16 giây.',
    todo: 'Tự kết hợp nồng độ Na₂S₂O₃ và nhiệt độ bếp điện, chạy thử rồi đọc đồng hồ. Chưa đạt thì chạm vòi nước rửa bình làm lại.' },
];

const LENS_SWITCHES = [
  ['conc', 'Nồng độ cao hơn', 'Bàn 1'],
  ['temp', 'Nhiệt độ cao hơn', 'Bàn 2'],
  ['size', 'Đập nhỏ hơn', 'Bàn 3'],
  ['cat', 'Có chất xúc tác', 'Bàn 4'],
];

const TOUR_IDS = ['conc', 'temp', 'surf', 'cat', 'lens'];
const BENCH_TO_STEP = { conc: 2, temp: 3, surf: 4, cat: 5, lens: 6 };
const BENCH_SHORT = { conc: '① Nồng độ', temp: '② Nhiệt độ', surf: '③ Bề mặt', cat: '④ Xúc tác', lens: 'Vòng kính' };

// ---------- ĐỒ THỊ SVG SẮC NÉT CÓ CHỐNG ĐÈ NHÃN ----------
function makeLiveGraph(host) {
  const W = 286, H = 152, P = { l: 34, r: 12, t: 14, b: 24 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (t, a = {}) => { const n = document.createElementNS(svgNS, t); Object.entries(a).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'p2-svg' });
  host.append(svg);

  function render({ series = [], yMax = 80, ref = 74.4, refLabel = '' }) {
    svg.replaceChildren();
    const xMax = Math.max(30, ...series.flatMap((s) => s.points.map((p) => p[0])));
    const sx = (x) => P.l + (x / xMax) * iw;
    const sy = (y) => P.t + ih - (Math.min(y, yMax) / yMax) * ih;

    // Lưới ngang nhẹ
    for (let i = 0; i <= 4; i++) {
      const yv = (yMax / 4) * i, y = sy(yv);
      svg.append(el('line', { x1: P.l, y1: y, x2: W - P.r, y2: y, stroke: '#e2e8f0', 'stroke-width': 1 }));
      const tx = el('text', { x: P.l - 5, y: y + 3, 'text-anchor': 'end', fill: '#64748b', 'font-size': 9.5, 'font-weight': 600 });
      tx.textContent = Math.round(yv); svg.append(tx);
    }
    // Trục
    svg.append(el('line', { x1: P.l, y1: P.t, x2: P.l, y2: P.t + ih, stroke: '#94a3b8', 'stroke-width': 1.2 }));
    svg.append(el('line', { x1: P.l, y1: P.t + ih, x2: W - P.r, y2: P.t + ih, stroke: '#94a3b8', 'stroke-width': 1.2 }));

    // Đường tham chiếu tối đa / đầy xi-lanh
    if (ref > 0 && ref <= yMax) {
      const ry = sy(ref);
      svg.append(el('line', { x1: P.l, y1: ry, x2: W - P.r, y2: ry, stroke: ref >= 100 ? '#dc2626' : '#94a3b8', 'stroke-dasharray': '4 3', 'stroke-width': 1 }));
      if (refLabel) {
        const rt = el('text', { x: W - P.r - 2, y: ry - 4, 'text-anchor': 'end', fill: ref >= 100 ? '#dc2626' : '#64748b', 'font-size': 9, 'font-weight': 700 });
        rt.textContent = refLabel; svg.append(rt);
      }
    }

    // Nhãn trục
    const xl = el('text', { x: W - P.r, y: H - 5, 'text-anchor': 'end', fill: '#64748b', 'font-size': 9.5, 'font-weight': 600 });
    xl.textContent = 'Thời gian (s)'; svg.append(xl);
    const yl = el('text', { x: P.l + 4, y: 10, fill: '#64748b', 'font-size': 9.5, 'font-weight': 600 });
    yl.textContent = 'mL CO₂'; svg.append(yl);

    if (!series.length) {
      const empty = el('text', { x: P.l + iw / 2, y: P.t + ih / 2 + 4, 'text-anchor': 'middle', fill: '#94a3b8', 'font-size': 11, 'font-weight': 600 });
      empty.textContent = 'Đồ thị sẽ vẽ trực tiếp khi thả đá vôi'; svg.append(empty);
      return;
    }

    // Vẽ đường & chống đè nhãn đầu đường
    const placedY = [];
    series.forEach((s) => {
      if (!s.points.length) return;
      const d = s.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ');
      svg.append(el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      const [lx, ly] = s.points[s.points.length - 1];
      const cx = sx(lx), cy = sy(ly);
      if (s.live) svg.append(el('circle', { cx, cy, r: 6.5, fill: s.color, opacity: 0.22 }));
      svg.append(el('circle', { cx, cy, r: 3.2, fill: s.color, stroke: '#fff', 'stroke-width': 1.2 }));

      // Chống đè nhãn: nếu gần nhãn đã đặt trong vòng 13px thì tách lên/xuống
      let ty = cy - 6;
      placedY.forEach((py) => { if (Math.abs(ty - py) < 13) ty = py + 14; });
      ty = Math.max(P.t + 10, Math.min(P.t + ih - 4, ty));
      placedY.push(ty);
      const anchor = cx > W - 75 ? 'end' : 'start';
      const tx = el('text', { x: anchor === 'end' ? cx - 6 : cx + 6, y: ty, 'text-anchor': anchor, fill: s.color, 'font-size': 10, 'font-weight': 700 });
      tx.textContent = s.label; svg.append(tx);
    });
  }
  return { render };
}

// ---------- KHỞI TẠO TOÀN BỘ ỨNG DỤNG LAB L1 PRO V2 ----------
export function mountProV2(root) {
  const stageHost = h('div', { class: 'p2-stage' });
  const eqCard = h('div', { class: 'p2-eq', hidden: true });
  const toastEl = h('div', { class: 'p2-toast', hidden: true });
  const quickBar = h('div', { class: 'p2-quickbar' });
  const resetCamBtn = h('button', { class: 'p2-reset-cam', type: 'button', hidden: true, onclick: () => { sfx.click(); lab.resetView(); renderQuickBar(); } }, '⟲ Về góc chuẩn');
  const statsEl = h('div', { class: 'p2-stats', text: '60 FPS' });

  const leftCard = h('aside', { class: 'p2-panel p2-left' });
  const rightPanel = h('aside', { class: 'p2-panel p2-right' });
  const leftToggle = h('button', { class: 'p2-collapse p2-col-l', type: 'button', title: 'Thu gọn / mở thẻ Bước này' }, '‹');
  const rightToggle = h('button', { class: 'p2-collapse p2-col-r', type: 'button', title: 'Thu gọn / mở Bảng điều khiển' }, '›');

  // Header 2 hàng gọn gàng
  const stepNav = h('nav', { class: 'p2-steps', 'aria-label': 'Các bước bài học' });
  const chainEl = h('div', { class: 'p2-chain' });
  const btnTags = h('button', { class: 'p2-tbtn is-on', type: 'button' }, 'Nhãn 3D');
  const btnSfx = h('button', { class: 'p2-tbtn is-on', type: 'button' }, 'Âm thanh: Bật');
  const btnTheme = h('button', { class: 'p2-tbtn', type: 'button' }, 'Mặt bàn: Epoxy S2');

  const header = h('header', { class: 'p2-head' },
    h('div', { class: 'p2-head-top' },
      h('div', { class: 'p2-brand' },
        h('span', { class: 'p2-logo', text: '⚗' }),
        h('div', {},
          h('div', { class: 'p2-btitle' }, h('span', { class: 'p2-grade', text: 'Hoá 10' }), 'Tốc độ phản ứng: nhanh hay chậm do đâu?'),
          h('div', { class: 'p2-mainq' }, h('b', { text: 'Câu hỏi chính' }), 'Cùng một chất, muốn phản ứng nhanh lên hay chậm lại thì đổi cái gì?'),
        ),
      ),
      h('div', { class: 'p2-tools' },
        btnTags, btnSfx, btnTheme,
        h('a', { class: 'p2-tbtn', href: './thu_3d_pro.html', target: '_blank' }, 'Pro v1 ↗'),
        h('a', { class: 'p2-tbtn', href: './index.html?v=3', target: '_blank' }, 'So bản v3 ↗'),
      ),
    ),
    h('div', { class: 'p2-head-sub' }, stepNav, chainEl),
  );

  // Footer điều hướng bước gọn
  const btnPrev = h('button', { class: 'p2-fbtn', type: 'button' }, '‹ Bước trước');
  const stepCounter = h('span', { class: 'p2-fcount' });
  const btnNext = h('button', { class: 'p2-fbtn is-pri', type: 'button' }, 'Bước sau ›');
  const footer = h('footer', { class: 'p2-foot' },
    btnPrev,
    h('div', { class: 'p2-fmid' }, stepCounter, h('span', { class: 'p2-fnote', text: 'Bản dựng thử UX/UI · Motion · LookDev 3D (độc lập, không sửa bản gốc)' })),
    btnNext,
  );

  const workspace = h('main', { class: 'p2-work' }, stageHost, quickBar, eqCard, toastEl, resetCamBtn, statsEl, leftCard, leftToggle, rightPanel, rightToggle);
  root.replaceChildren(header, workspace, footer);

  const lab = createProLabEngine(stageHost);

  // ---------- TRẠNG THÁI BÀI HỌC ----------
  const S = {
    step: 0, done: {}, reveal: {}, rows: {}, picks: new Set(), tour: null, at: {}, peekingRoom: false,
    lens: { conc: false, temp: false, size: false, cat: false }, lensChanged: new Set(),
    moved: false, names: true, ui: null, leftOpen: true, rightOpen: true,
  };
  const rowsOf = (i) => S.rows[i] || (S.rows[i] = []);
  const distinct = (i) => new Set(rowsOf(i).map((r) => r.key)).size;

  let toastTimer = null;
  function toast(msg, tone = 'info') {
    toastEl.textContent = msg; toastEl.dataset.tone = tone; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4800);
  }

  // Đồng bộ vùng an toàn 3 cột vào camera 3D
  function syncInsets() {
    const w = workspace.clientWidth, hPx = workspace.clientHeight;
    if (!w || !hPx) return;
    const wide = w >= 960;
    const l = wide && S.leftOpen ? (leftCard.offsetWidth + 24) / w : 0.02;
    const r = wide && S.rightOpen ? (rightPanel.offsetWidth + 24) / w : 0.02;
    const b = eqCard.hidden ? 0.06 : Math.min(0.24, (eqCard.offsetHeight + 28) / hPx);
    const t = quickBar.childElementCount ? 0.14 : 0.08;
    lab.setInsets({ l, r, t, b });
    workspace.style.setProperty('--safe-l', (l * 100).toFixed(2) + '%');
    workspace.style.setProperty('--safe-r', (r * 100).toFixed(2) + '%');
  }
  new ResizeObserver(syncInsets).observe(workspace);

  leftToggle.addEventListener('click', () => {
    sfx.click(); S.leftOpen = !S.leftOpen;
    leftCard.classList.toggle('is-closed', !S.leftOpen);
    leftToggle.classList.toggle('is-closed', !S.leftOpen);
    leftToggle.textContent = S.leftOpen ? '‹' : '›';
    setTimeout(syncInsets, 50);
  });
  rightToggle.addEventListener('click', () => {
    sfx.click(); S.rightOpen = !S.rightOpen;
    rightPanel.classList.toggle('is-closed', !S.rightOpen);
    rightToggle.classList.toggle('is-closed', !S.rightOpen);
    rightToggle.textContent = S.rightOpen ? '›' : '‹';
    setTimeout(syncInsets, 50);
  });

  btnTags.addEventListener('click', () => { sfx.click(); S.names = !S.names; btnTags.classList.toggle('is-on', S.names); lab.setNames(S.names); });
  btnSfx.addEventListener('click', () => { const on = sfx.toggle(); btnSfx.classList.toggle('is-on', on); btnSfx.textContent = on ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'; });
  btnTheme.addEventListener('click', () => {
    sfx.click(); const next = lab.getBenchTheme() === 'dark' ? 'light' : 'dark';
    lab.setBenchTheme(next); btnTheme.textContent = next === 'dark' ? 'Mặt bàn: Epoxy S2' : 'Mặt bàn: Đá sáng';
  });

  // ---------- ĐIỀU KIỆN ĐẠT TỪNG BƯỚC & KẾT LUẬN ----------
  const DONE_FN = [
    () => S.moved || S.picks.size > 0,
    () => rowsOf(1).length >= 1,
    () => distinct(2) >= 2,
    () => distinct(3) >= 2,
    () => rowsOf(4).length >= 1,
    () => rowsOf(5).length >= 1,
    () => S.lensChanged.size >= 3,
    () => rowsOf(7).some((r) => r.level.temp !== REF.temp),
    () => lab.lifeStation.state.done,
    () => rowsOf(9).some((r) => r.te >= 14 && r.te <= 16),
  ];

  function checkDone() {
    const i = S.step;
    if (S.done[i] || !DONE_FN[i]()) return;
    S.done[i] = true;
    renderHeader(); renderLeft();
    if (i === 9) toast('🎉 ĐẠT SÁT HẠCH: chữ X mất đúng trong khoảng 14 đến 16 giây!', 'success');
  }

  function bestRow(i, pred, fallback) {
    return rowsOf(i).filter(pred).sort((a, b) => a.te - b.te)[0] || fallback;
  }

  function conclusionOf(i) {
    const k = (a, b) => fmt(a / b, 1);
    switch (i) {
      case 0: return ['Phòng lab có 4 bàn thí nghiệm độc lập cho 4 yếu tố: nồng độ, nhiệt độ, diện tích bề mặt và chất xúc tác. Mỗi bàn có 1 bình đối chứng + 1 bình thí nghiệm và bộ đo riêng.', ['Bình đối chứng luôn chỉ khác bình thí nghiệm đúng MỘT yếu tố.', 'Vòng kính ở giữa phòng giúp phóng to tới mức va chạm hạt.'], 'các bước sau không hình dung được cấu trúc toàn bài.'];
      case 1: { const r = rowsOf(1)[0] || { tr: run3('vien', REF3.mass, REF3.vAcid).tHalf, vEnd: run3('vien', REF3.mass, REF3.vAcid).vEnd }; return [`Thu được nửa lượng khí (${fmt(r.vEnd / 2, 1)} mL) trong ${fmt(r.tr, 1)} s, tức tốc độ trung bình ${fmt(r.vEnd / 2 / r.tr, 2)} mL/s. Công thức: Tốc độ = lượng chất biến đổi : thời gian.`, ['Đo định lượng bằng 2 dụng cụ: xi-lanh đo thể tích khí và đồng hồ đo thời gian.', 'Càng về sau khí thoát càng chậm do chất phản ứng vơi dần.'], 'chỉ nói được cảm tính nhanh/chậm mà không biết nhanh gấp bao nhiêu lần.']; }
      case 2: { const r = bestRow(2, (x) => x.level.conc !== REF.conc, { te: tConc({ ...REF, conc: 0.3 }), tr: tConc(REF), cond: '0,30 M' }); return [`Bình thí nghiệm ${r.cond}: chữ X mất sau ${fmtT(r.te)}, đối chứng 0,05 M mất sau ${fmtT(r.tr)}, nhanh gấp ${k(r.tr, r.te)} lần. Nồng độ chất phản ứng càng lớn thì tốc độ phản ứng càng lớn.`, ['Giữ nguyên lượng acid và nhiệt độ 25 °C.', 'Với chất khí, tăng áp suất cũng chính là tăng nồng độ.'], 'không giải thích được vì sao phản ứng tự chậm dần theo thời gian.']; }
      case 3: { const r = bestRow(3, (x) => x.level.temp !== REF.temp, { te: tTemp({ temp: 45 }), tr: tTemp(REF), cond: '45 °C' }); return [`Ống thí nghiệm ${r.cond}: hoá hồng sau ${fmtT(r.te)}, đối chứng 25 °C sau ${fmtT(r.tr)}, nhanh gấp ${k(r.tr, r.te)} lần. Nhiệt độ càng cao thì tốc độ phản ứng càng lớn.`, ['Hệ số Van\'t Hoff γ: tăng thêm 10 °C, tốc độ tăng từ 2 đến 4 lần.', 'Không thêm chất nào — chỉ làm hạt chuyển động nhanh hơn.'], 'không giải thích được vì sao bảo quản thực phẩm trong tủ lạnh lại lâu hỏng.']; }
      case 4: {
        const clean = rowsOf(4).filter((x) => !x.over && !x.left), last = rowsOf(4)[rowsOf(4).length - 1];
        const E = run3('vun', REF3.mass, REF3.vAcid), R = run3('vien', REF3.mass, REF3.vAcid);
        const r = clean[clean.length - 1] || { te: E.tHalf, tr: R.tHalf, vEnd: R.vEnd, cond: `${g2(REF3.mass)} · ${REF3.vAcid} mL` };
        const extra = last?.over ? ' (Lưu ý: lần vừa chạy xi-lanh đã đầy 100 mL — dụng cụ đo cũng có giới hạn sức chứa.)' : last?.left ? ' (Lần vừa chạy acid hết trước nên đá vôi còn thừa dưới đáy.)' : '';
        return [`Mỗi bình ${r.cond}: đá vôi đập nhỏ thu nửa khí sau ${fmtT(r.te)}, đá vôi viên sau ${fmtT(r.tr)}, nhanh gấp ${k(r.tr, r.te)} lần. Cả hai vẫn dừng ở cùng ${fmt(r.vEnd, 0)} mL.${extra}`, ['Diện tích bề mặt tiếp xúc càng lớn → tốc độ càng lớn.', 'Nhanh hơn KHÔNG đồng nghĩa với nhiều sản phẩm hơn!'], 'không trả lời được câu bụi bột mì và giữ hiểu lầm "nhanh thì nhiều".'];
      }
      case 5: { const r = rowsOf(5)[rowsOf(5).length - 1]; return [`${r ? `Sau 26 s: bình có MnO₂ tạo ${r.exp} O₂, bình không có MnO₂ chỉ ${r.ref}. ` : ''}Chất xúc tác làm tăng mạnh tốc độ phản ứng mà không bị tiêu hao sau phản ứng.`, ['Bột đen MnO₂ vẫn lắng lại nguyên vẹn dưới đáy bình.', 'Xúc tác không làm tăng tổng lượng sản phẩm tạo thành.'], 'thiếu yếu tố thứ 4 và không hiểu vai trò của enzyme trong cơ thể.']; }
      case 6: return ['Cả 4 yếu tố đều quy về một nguyên nhân duy nhất: làm tăng số VA CHẠM HIỆU QUẢ giữa các hạt trong mỗi giây.', ['Nồng độ: tăng mật độ hạt · Nhiệt độ: hạt chạy nhanh & nhiều hạt đủ năng lượng.', 'Bề mặt: mở rộng vùng tiếp xúc · Xúc tác: hạ hàng rào năng lượng hoạt hoá.'], 'phải học thuộc lòng rời rạc 4 kết luận không liên kết.'];
      case 7: { const r = bestRow(7, (x) => x.level.temp !== REF.temp, null); return [`${r ? `Khi đổi cùng lúc hai yếu tố (${r.cond}), phản ứng nhanh gấp ${k(r.tr, r.te)} lần, ` : 'Đổi hai yếu tố cùng lúc làm phản ứng nhanh hơn, '}nhưng KHÔNG tách được phần đóng góp của nồng độ hay nhiệt độ. Luật thí nghiệm: mỗi lần chỉ đổi đúng MỘT biến.`, ['Bình đối chứng luôn cần thiết để so sánh công bằng.'], 'dễ kết luận sai nguyên nhân khi làm bài thực hành và đề thi.']; }
      case 8: return ['Viên sủi bẻ vụn tan hết trong 8 s (nhanh gấp 3 lần viên nguyên 24 s) nhờ diện tích tiếp xúc với nước lớn hơn. Tương tự, bụi bột mì lơ lửng tiếp xúc rất lớn với O₂ không khí nên cháy cực nhanh gây nổ, còn bột nén trong bao thì không!', ['Ứng dụng: thái nhỏ thức ăn khi nấu, dùng tủ lạnh giảm nhiệt độ, dùng men (xúc tác) ủ thực phẩm.'], 'bài học dừng ở phòng lab, chưa trả lời câu hỏi lớn mở bài.'];
      default: { const r = bestRow(9, (x) => x.te >= 14 && x.te <= 16, null); return [`${r ? `Bạn đã chọn ${r.cond} → chữ X mất sau ${fmtT(r.te)} (đạt mục tiêu 14–16 s). ` : ''}Sát hạch tổng hợp lại toàn bộ quy trình: chọn biến, thao tác tay và kiểm chứng bằng số đo.`, ['Gợi ý chuẩn: Na₂S₂O₃ 0,10 M + làm ấm 45 °C cho kết quả đúng 15,0 s.'], '']; }
    }
  }

  // ---------- RENDER HEADER (10 BƯỚC + CHUỖI NHÂN QUẢ) ----------
  function renderHeader() {
    stepNav.replaceChildren(...STEPS.map((st, idx) =>
      h('button', {
        type: 'button',
        class: 'p2-step' + (idx === S.step ? ' is-cur' : '') + (S.done[idx] ? ' is-done' : ''),
        onclick: () => { sfx.click(680); goStep(idx); },
      }, h('i', { text: S.done[idx] ? '✓' : String(idx + 1) }), h('span', { text: st.short })),
    ));
    const curLinks = [].concat(STEPS[S.step].link);
    chainEl.replaceChildren(...CHAIN.map(([title, sub], idx) =>
      h('span', { class: 'p2-link' + (curLinks.includes(idx) ? ' is-on' : ''), title: sub }, title),
    ));
    stepCounter.textContent = `Bước ${S.step + 1} / ${STEPS.length} · ${STEPS[S.step].short}`;
    btnPrev.disabled = S.step === 0;
    btnNext.disabled = S.step === STEPS.length - 1;
  }

  function showEq(id) {
    const B = id && lab.benches[id];
    if (!B) {
      if (id === 'life') {
        eqCard.hidden = false;
        eqCard.classList.remove('is-warn');
        eqCard.replaceChildren(
          h('small', {}, h('i', { style: 'background:#ea580c' }), 'Trong bếp · Ứng dụng đời sống'),
          h('b', { text: 'Viên sủi nguyên (24 s)  vs  Viên sủi bẻ vụn (8 s)' }),
          h('em', { text: 'cùng lượng nước · cùng nhiệt độ · chỉ khác diện tích bề mặt tiếp xúc' }),
        );
      } else eqCard.hidden = true;
      syncInsets(); return;
    }
    const cond = typeof B.cond === 'function' ? B.cond(B) : B.cond;
    const isWarn = typeof cond === 'string' && cond.includes('ĐANG KHÁC HAI THỨ');
    eqCard.hidden = false;
    eqCard.classList.toggle('is-warn', isWarn);
    eqCard.replaceChildren(
      h('small', {}, h('i', { style: `background:${B.color}` }), B.name),
      h('b', { text: B.eq }),
      cond && h('em', { text: cond }),
    );
    syncInsets();
  }

  // Thanh điều khiển nhanh trên đỉnh vùng 3D:
  // - Bước 1: tích chọn trực tiếp Toàn cảnh + 4 bàn + Vòng kính (có dấu ✓)
  // - Bước 2–10: nút Soi thẳng chữ X (Bàn 1), Tua nhanh ×3 (khi đang chạy), Xem toàn phòng
  function renderQuickBar() {
    const i = S.step, b = STEPS[i].bench;
    if (i === 0) {
      quickBar.replaceChildren(
        h('button', {
          type: 'button', class: 'p2-qbtn' + (!S.tour ? ' is-on' : ''),
          onclick: () => { sfx.click(640); S.tour = null; focusStation(null); renderLeft(); renderRight(); renderQuickBar(); },
        }, 'Toàn cảnh'),
        ...TOUR_IDS.map((id) => {
          const B = lab.benches[id], done = S.picks.has(id);
          return h('button', {
            type: 'button',
            class: 'p2-qbtn' + (S.tour === id ? ' is-on' : '') + (done ? ' is-done' : ''),
            onmouseenter: () => lab.highlightBenchFromUI(id),
            onmouseleave: () => lab.highlightBenchFromUI(null),
            onclick: () => pickBench(id),
          }, h('i', { style: `background:${done ? '#16a34a' : B.color}` }), done ? `✓ ${BENCH_SHORT[id]}` : BENCH_SHORT[id]);
        }),
      );
      return;
    }
    const B = b && lab.benches[b];
    const items = [];
    if (b === 'conc') {
      const topOn = lab.isTopView();
      items.push(h('button', {
        type: 'button', class: 'p2-qbtn' + (topOn ? ' is-on' : ''),
        onclick: () => { sfx.click(780); lab.toggleTopView('conc'); renderQuickBar(); },
      }, topOn ? '⟲ Góc nghiêng chuẩn' : '👁 Soi thẳng chữ X'));
    }
    if (B && B.run && !B.run.done) {
      const fast = lab.getSpeedMul() > 1;
      items.push(h('button', {
        type: 'button', class: 'p2-qbtn' + (fast ? ' is-on' : ''),
        onclick: () => { sfx.click(860); lab.setSpeedMul(fast ? 1 : 3); renderQuickBar(); },
      }, fast ? '⚡ Đang tua ×3' : '⚡ Tua nhanh ×3'));
    }
    if (b && b !== 'life') {
      items.push(h('button', {
        type: 'button', class: 'p2-qbtn' + (S.peekingRoom ? ' is-on' : ''),
        onclick: () => {
          sfx.click(680); S.peekingRoom = !S.peekingRoom;
          focusStation(S.peekingRoom ? null : b);
          renderQuickBar();
        },
      }, S.peekingRoom ? `← Về ${B?.name || 'bàn đang làm'}` : '⊞ Xem toàn phòng'));
    }
    quickBar.replaceChildren(...items);
  }

  // ---------- RENDER CỘT TRÁI ("BƯỚC NÀY") ----------
  function renderLeft() {
    const i = S.step, st = STEPS[i], done = !!S.done[i], open = done || !!S.reveal[i];
    const atId = i === 0 ? S.tour : st.bench;
    const B = atId && lab.benches[atId];
    const [conclMain, points, without] = open ? conclusionOf(i) : [];

    leftCard.replaceChildren(
      h('div', { class: 'p2-phead' }, h('b', { text: 'Bước này' }), h('span', { text: `Bước ${i + 1}/10` })),
      h('div', { class: 'p2-scroll' },
        h('div', { class: 'p2-sbadge' }, h('span', { class: 'p2-snum', text: String(i + 1) }), h('span', { class: 'p2-stitle', text: st.short })),
        h('h2', { class: 'p2-q', text: st.q }),
        B && h('div', { class: 'p2-where' },
          h('i', { style: `background:${B.color}` }),
          h('p', {}, h('b', { text: B.name + '. ' }), B.text, B.note ? ' ' + B.note : ''),
        ),
        i === 0 && S.tour && h('div', { style: 'display:flex;gap:6px;margin-bottom:10px' },
          h('button', {
            class: 'p2-btn', type: 'button', style: 'flex:1',
            onclick: () => { sfx.click(); S.tour = null; focusStation(null); renderLeft(); renderRight(); renderQuickBar(); },
          }, '‹ Toàn cảnh'),
          BENCH_TO_STEP[S.tour] != null && h('button', {
            class: 'p2-btn is-pri', type: 'button', style: 'flex:1.4',
            onclick: () => { sfx.click(860); goStep(BENCH_TO_STEP[S.tour]); },
          }, '▶ Thực hành bàn này'),
        ),
        h('div', { class: 'p2-task' + (done ? ' is-done' : '') },
          h('div', { class: 'p2-task-h' }, h('b', { text: 'Thực hành thử' }), h('span', { class: 'p2-pill' + (done ? ' is-done' : ''), text: done ? '✓ Đã làm' : 'Chưa làm' })),
          h('p', { text: st.todo }),
        ),
        open && h('div', { class: 'p2-concl' },
          h('b', { text: 'Kết luận rút ra' }),
          h('p', { text: conclMain }),
          h('ul', { class: 'p2-ideas' },
            points.map((pt) => h('li', { text: pt })),
            without && h('li', { class: 'is-without', text: 'Bỏ bước này thì ' + without }),
          ),
        ),
      ),
      h('div', { class: 'p2-pfoot' },
        !open && h('button', { class: 'p2-btn is-pri', type: 'button', onclick: () => { sfx.click(); S.reveal[i] = true; renderLeft(); } }, 'Hiện kết luận'),
        h('button', { class: 'p2-btn', type: 'button', onclick: () => resetStep(i) }, 'Đặt lại bước'),
        done && i < STEPS.length - 1 && h('button', { class: 'p2-btn is-go', type: 'button', onclick: () => { sfx.click(880); goStep(i + 1); } }, `Bước ${i + 2} ›`),
      ),
    );
  }

  // ---------- RENDER CỘT PHẢI ("BẢNG ĐIỀU KHIỂN" + CROSS-HIGHLIGHT 3D) ----------
  function readout(i) {
    const b = STEPS[i].bench;
    if (i === 0) return { label: 'Phòng thí nghiệm hôm nay', big: '4', unit: 'bàn + 1 vòng kính', cells: [['Mỗi bàn', '2 bình'], ['Dụng cụ đo', 'đồng hồ'], ['Đã tới xem', `${TOUR_IDS.filter((id) => S.picks.has(id)).length}/${TOUR_IDS.length}`]] };
    if (b === 'lens') {
      const o = lensSetup(lensParams());
      return { label: 'Va chạm hiệu quả mỗi giây', big: fmt(lab.benches.lens.lensObj.rate(), 1), unit: 'lần/s', cells: [['Số hạt', String(o.count)], ['Đủ năng lượng', Math.round(o.hot * 100) + '%'], ['Tốc độ hạt', '×' + fmt(o.speed, 2)]] };
    }
    if (b === 'life') {
      const L = lab.lifeStation.state;
      return { label: 'Hai viên sủi trong 2 cốc nước 3D', big: L.done ? 'Tan hết' : L.playing ? fmt(L.t, 1) : 'Sẵn sàng', unit: L.playing && !L.done ? 's' : '', cells: [['Viên nguyên', L.done ? '24,0 s' : '–'], ['Viên bẻ vụn', L.t >= 8 ? '8,0 s' : '–'], ['Nhanh gấp', L.done ? '3,0 lần' : '–']] };
    }
    return lab.benches[b].read();
  }

  function makeRangeControl(bid, s) {
    const R = s.range, show = (v) => fmt(v, R.digits || 0), off = !s.can;
    const btn = h('button', { class: 'p2-btn' + (s.next ? ' is-pri' : ''), type: 'button', disabled: off, onclick: () => lab.act(bid, s.id) });
    const range = h('input', { type: 'range', class: 'p2-range', min: R.min, max: R.max, step: R.step, value: R.want, disabled: off });
    const num = h('input', { type: 'text', inputmode: 'decimal', class: 'p2-num', value: show(R.want), disabled: off });
    const back = h('button', { class: 'p2-back', type: 'button', disabled: off, onclick: () => set(R.ref) }, `Về mức bài: ${show(R.ref)} ${R.unit}`);
    function set(v, from) {
      const w = lab.setWant(bid, s.id, v);
      if (from !== 'range') range.value = w; if (from !== 'num') num.value = show(w);
      btn.textContent = `${R.act} ${show(w)} ${R.unit}${R.per}`; back.hidden = w === R.ref;
    }
    range.addEventListener('input', () => set(Number(range.value), 'range'));
    num.addEventListener('change', () => { const v = Number(String(num.value).trim().replace(',', '.')); set(Number.isFinite(v) ? v : R.want); });
    set(R.want);
    return h('div', { class: 'p2-pb' },
      h('span', { class: 'p2-pl', text: s.label + (R.value != null ? ` (đang có ${show(R.value)} ${R.unit})` : '') }),
      h('div', { class: 'p2-amt' }, range, num, h('em', { text: R.unit })),
      h('div', { class: 'p2-ends' }, h('span', { text: `${show(R.min)} ${R.unit}` }), h('span', { text: R.limit })),
      btn, back,
    );
  }

  function renderProc(bid, host) {
    const P = lab.proc(bid); if (!P) return;
    const ol = h('ol', { class: 'p2-proc' });
    P.steps.forEach((s) => {
      const li = h('li', {
        class: 'p2-pstep' + (s.done ? ' is-done' : '') + (s.next ? ' is-next' : '') + (!s.can && !s.done ? ' is-lock' : ''),
        'data-items': (s.itemIds || []).join(','),
        onmouseenter: () => lab.highlightFromUI(bid, s.itemIds || []),
        onmouseleave: () => lab.highlightFromUI(bid, []),
      },
      h('span', { class: 'p2-pn', text: s.done ? '✓' : String(s.n) }),
      s.range ? makeRangeControl(bid, s)
        : s.options
          ? h('div', { class: 'p2-pb' }, h('span', { class: 'p2-pl', text: s.label }),
            h('div', { class: 'p2-seg' }, s.options.map((o) => h('button', {
              type: 'button', class: o.on ? 'is-on' : '', disabled: !s.can,
              onmouseenter: () => o.item && lab.highlightFromUI(bid, [o.item]),
              onclick: () => lab.act(bid, s.id, o.k),
            }, o.label))))
          : h('div', { class: 'p2-pb' }, h('button', { class: 'p2-btn' + (s.next ? ' is-pri' : ''), type: 'button', disabled: !s.can, onclick: () => lab.act(bid, s.id) }, s.label)));
      ol.append(li);
    });
    if (P.rinse) {
      ol.append(h('li', {
        class: 'p2-pstep is-rinse' + (P.rinse.next ? ' is-next' : '') + (P.rinse.can ? '' : ' is-lock'),
        'data-items': 'sink',
        onmouseenter: () => lab.highlightFromUI(bid, ['sink']),
        onmouseleave: () => lab.highlightFromUI(bid, []),
      }, h('span', { class: 'p2-pn', text: '↺' }),
      h('div', { class: 'p2-pb' }, h('button', { class: 'p2-btn' + (P.rinse.next ? ' is-pri' : ''), type: 'button', disabled: !P.rinse.can, onclick: () => lab.rinse(bid) }, P.rinse.label))));
    }
    const statusMsg = P.busy ? 'Đang thao tác trực quan trên bàn 3D…' : P.run && !P.run.done ? 'Phản ứng đang chạy — quan sát dụng cụ đo!' : P.run ? 'Xong 1 lần chạy. Rửa bình để thử điều kiện khác.' : '';
    host.replaceChildren(ol, statusMsg && h('p', { class: 'p2-pstate', text: statusMsg }));
  }

  function renderTable(bid, host) {
    const list = rowsOf(S.step), cols = lab.benches[bid]?.cols || [];
    if (!list.length) { host.replaceChildren(h('p', { class: 'p2-empty', text: 'Chưa có lần chạy nào. Mỗi lần chạy xong sẽ tự ghi 1 dòng vào đây.' })); return; }
    host.replaceChildren(h('table', { class: 'p2-table' },
      h('thead', {}, h('tr', {}, cols.map((c) => h('th', { text: c })))),
      h('tbody', {}, list.map((r, idx) => h('tr', { class: idx === list.length - 1 ? 'is-new' : '' },
        h('td', { text: r.cond }), h('td', { text: r.exp }), h('td', { text: r.ref }), h('td', { text: r.ratio })))),
    ));
  }

  const lensParams = () => ({ conc: S.lens.conc ? 0.3 : REF.conc, temp: S.lens.temp ? 55 : REF.temp, size: S.lens.size ? 'vun' : 'vien', cat: S.lens.cat });

  function renderRight() {
    const i = S.step, b = STEPS[i].bench, real = b && b !== 'lens' && b !== 'life';
    const label = h('span'), big = h('b'), unit = h('em');
    const cells = [0, 1, 2].map(() => [h('span'), h('b')]);
    const procHost = real && h('div'), tableHost = real && h('div'), graphHost = b === 'surf' && h('div');

    rightPanel.replaceChildren(
      h('div', { class: 'p2-phead' }, h('b', { text: 'Bảng điều khiển' }), h('span', { text: real ? 'Chạm trên 3D hoặc bấm nút cùng số' : 'Tương tác bước này' })),
      h('div', { class: 'p2-scroll' },
        h('div', { class: 'p2-read' }, label, h('div', { class: 'p2-read-v' }, big, unit)),
        h('div', { class: 'p2-cells' }, cells.map(([a, c]) => h('div', { class: 'p2-cell' }, a, c))),
        i === 0 && h('div', { class: 'p2-sec' },
          h('h3', { text: 'Tích chọn từng bàn trong phòng (5 điểm)' }),
          h('ul', { class: 'p2-tour' }, TOUR_IDS.map((id) => {
            const B = lab.benches[id], visited = S.picks.has(id);
            return h('li', {
              'data-bench': id,
              class: (visited ? 'is-done' : '') + (S.tour === id ? ' is-cur' : ''),
              onmouseenter: () => lab.highlightBenchFromUI(id),
              onmouseleave: () => lab.highlightBenchFromUI(null),
              onclick: () => pickBench(id),
            },
            h('span', { class: 'p2-tck', style: `--c:${B.color}`, text: visited ? '✓' : '○' }),
            h('div', {}, h('b', { text: B.name }), h('small', { text: typeof B.cond === 'function' ? B.cond(B) : B.cond })),
            );
          })),
        ),
        real && [
          h('div', { class: 'p2-sec' }, h('h3', { text: 'Việc của bàn này' }), procHost),
          b === 'surf' && h('div', { class: 'p2-sec' }, h('h3', { text: 'Đồ thị thể tích khí CO₂' }), graphHost),
          h('div', { class: 'p2-sec' }, h('h3', { text: 'Bảng kết quả đo' }), tableHost),
        ],
        b === 'lens' && h('div', { class: 'p2-sec' },
          h('h3', { text: 'Bật công tắc yếu tố để soi va chạm' }),
          ...LENS_SWITCHES.map(([id, title, sub]) => h('label', { class: 'p2-swrow' + (S.lens[id] ? ' is-on' : '') },
            h('div', {}, h('b', { text: title }), h('small', { text: sub })),
            h('input', {
              type: 'checkbox', checked: S.lens[id],
              onchange: (e) => {
                sfx.click(e.target.checked ? 840 : 580);
                S.lens[id] = e.target.checked; S.lensChanged.add(id);
                lab.benches.lens.lensObj.set(lensSetup(lensParams()));
                toast(`${title}: ${S.lens[id] ? 'BẬT' : 'TẮT'} — quan sát số va chạm hiệu quả/giây!`);
                renderRight(); checkDone();
              },
            }),
          )),
        ),
        b === 'life' && h('div', { class: 'p2-sec' },
          h('h3', { text: 'Thí nghiệm viên sủi 3D' }),
          h('button', {
            class: 'p2-btn is-pri is-full', type: 'button',
            disabled: (lab.lifeStation.state.playing || lab.lifeStation.state.seq.busy()) && !lab.lifeStation.state.done,
            onclick: () => { lab.lifeStation.play(); toast('Hai viên sủi thả cùng lúc: viên bẻ vụn sủi mạnh và tan nhanh gấp 3 lần!'); renderRight(); },
          }, lab.lifeStation.state.done ? '↺ Thả lại 2 viên sủi' : (lab.lifeStation.state.playing || lab.lifeStation.state.seq.busy()) ? 'Đang sủi bọt…' : '▶ Thả 2 viên sủi vào cốc nước'),
        ),
      ),
    );
    S.ui = { label, big, unit, cells, bench: real ? b : null, procHost, tableHost, graph: graphHost ? makeLiveGraph(graphHost) : null };
    syncLiveReadout();
    if (real) { renderProc(b, procHost); renderTable(b, tableHost); }
  }

  function syncLiveReadout() {
    const ui = S.ui; if (!ui) return;
    const r = readout(S.step);
    ui.label.textContent = r.label; ui.big.textContent = r.big; ui.unit.textContent = r.unit;
    r.cells.forEach((c, idx) => { ui.cells[idx][0].textContent = c[0]; ui.cells[idx][1].textContent = c[1]; });
    if (ui.graph) {
      const B = lab.benches.surf, [eRun, rRun] = B.runs();
      const t = B.run ? Math.min(B.run.t, B.window()) : 0;
      const cut = (run) => [...run.points.filter((p) => p[0] <= t), [t, gasAt3(run, t)]].map(([x, v]) => [x, Math.min(v, 100)]);
      const vEnd = rRun.vEnd, full = vEnd >= 100;
      const series = !B.run ? [] : B.solo
        ? [{ points: cut(rRun), color: '#475569', label: 'đá vôi viên', live: !B.run.done }]
        : [{ points: cut(rRun), color: '#475569', label: 'đá viên', live: !B.run.done }, { points: cut(eRun), color: '#6366f1', label: 'đập nhỏ', live: !B.run.done }];
      ui.graph.render({ series, yMax: vEnd > 76 ? 120 : 80, ref: full ? 100 : vEnd, refLabel: full ? 'đầy 100 mL' : `tối đa ${fmt(vEnd, 0)} mL` });
    }
  }
  setInterval(syncLiveReadout, 110);

  // ---------- ĐIỀU HƯỚNG & SỰ KIỆN TỪ 3D ----------
  function focusStation(id, immediate = false) {
    lab.setActive(id, immediate); showEq(id);
  }
  function pickBench(id) {
    if (!lab.benches[id]) return;
    if (S.step === 0) {
      sfx.click(720); S.picks.add(id); S.tour = id;
      focusStation(id); checkDone(); renderHeader(); renderLeft(); renderRight(); renderQuickBar();
      return;
    }
    // Ở các bước 2–10: khi người dùng bấm trực tiếp vào một bàn khác trong 3D → chuyển mượt sang đúng bước thực hành của bàn đó!
    if (S.peekingRoom || STEPS[S.step].bench !== id) {
      const targetStep = BENCH_TO_STEP[id];
      if (targetStep != null) {
        sfx.click(760);
        goStep(targetStep);
        toast(`Đã chuyển sang Bước ${targetStep + 1} · ${lab.benches[id].name}`);
      }
    }
  }
  function setupBenchForStep(i, force = false) {
    const b = STEPS[i].bench;
    if (!b || b === 'lens') return;
    if (b === 'life') { lab.lifeStation.reset(); return; }
    if (!force && S.at[b] === i) return;
    S.at[b] = i;
    if (b === 'surf') lab.solo('surf', i === 1 ? 'ref' : null);
    if (i === 1) lab.preset('surf', [['vol', REF3.vAcid], ['fill'], ['mass', REF3.mass]]);
    else lab.resetBench(b);
  }
  function resetStep(i) {
    sfx.click(540); S.done[i] = false; S.reveal[i] = false; S.rows[i] = []; S.peekingRoom = false;
    lab.setSpeedMul(1);
    if (i === 0) { S.picks.clear(); S.moved = false; S.tour = null; focusStation(null); }
    if (i === 6) { Object.keys(S.lens).forEach((k) => { S.lens[k] = false; }); S.lensChanged.clear(); lab.benches.lens.lensObj.set(lensSetup(lensParams())); }
    setupBenchForStep(i, true);
    renderHeader(); renderLeft(); renderRight(); renderQuickBar();
    toast('Đã đặt lại bước về trạng thái ban đầu.');
  }
  function goStep(i) {
    S.step = Math.max(0, Math.min(STEPS.length - 1, i));
    S.peekingRoom = false; lab.setSpeedMul(1);
    const needTemp = S.step === 7 || S.step === 9;
    lab.enable('conc', 'temp', needTemp);
    lab.setStepOptional('conc', 'temp', !needTemp); // Bước 8 & 10: Bếp điện là bước chính bắt buộc, tự bật vòng định vị!
    lab.setHands(S.step !== 0, 'Bước 1 chỉ xem phòng. Bấm "▶ Thực hành bàn này" để bắt đầu làm thí nghiệm!');
    setupBenchForStep(S.step);
    focusStation(S.step === 0 ? S.tour : STEPS[S.step].bench);
    renderHeader(); renderLeft(); renderRight(); renderQuickBar();
  }

  btnPrev.addEventListener('click', () => { sfx.click(640); goStep(S.step - 1); });
  btnNext.addEventListener('click', () => { sfx.click(760); goStep(S.step + 1); });

  lab.on('pick', pickBench);
  lab.on('say', (msg) => toast(msg));
  lab.on('moved', (m) => {
    resetCamBtn.hidden = !m;
    if (m && S.step === 0) { S.moved = true; checkDone(); }
  });
  lab.on('hover', (pid) => {
    const [bid, iid] = pid ? pid.split('/') : [null, null];
    // Highlight ngược lại dòng việc ở bảng phải (Bước 2–10) HOẶC dòng bàn tương ứng (Bước 1)!
    rightPanel.querySelectorAll('.p2-pstep').forEach((li) => {
      const items = (li.dataset.items || '').split(',');
      li.classList.toggle('is-3d-hover', !!iid && items.includes(iid));
    });
    rightPanel.querySelectorAll('.p2-tour li').forEach((li) => {
      li.classList.toggle('is-3d-hover', !!bid && li.dataset.bench === bid);
    });
  });
  lab.on('change', (bid) => {
    if (STEPS[S.step].bench === bid || S.tour === bid) showEq(bid);
    if (S.ui && S.ui.bench === bid && S.ui.procHost) renderProc(bid, S.ui.procHost);
    if (bid === 'life') renderRight();
    renderQuickBar();
  });
  lab.on('done', (bid, row) => {
    const i = S.step; if (STEPS[i].bench !== bid || !row) return;
    const list = rowsOf(i), idx = list.findIndex((x) => x.key === row.key);
    if (idx >= 0) list[idx] = row; else list.push(row);
    if (list.length > 6) list.shift();
    if (S.ui && S.ui.tableHost) renderTable(bid, S.ui.tableHost);
    const msg = bid === 'surf'
      ? (row.solo ? `Xong: thu nửa khí sau ${row.ref}.` : `Xong: đập nhỏ ${row.exp}, viên ${row.ref} — nhanh gấp ${row.ratio}!`)
      : bid === 'cat' ? `Xong sau 26 s: có MnO₂ tạo ${row.exp} O₂, không MnO₂ tạo ${row.ref}.`
      : `Xong: bình thí nghiệm ${row.exp}, đối chứng ${row.ref} — nhanh gấp ${row.ratio}!`;
    toast(msg, 'success');
    checkDone();
    if (S.done[i]) renderLeft();
  });
  lab.on('lifeDone', () => { toast('Xong: viên bẻ vụn tan hết sau 8 s, viên nguyên sau 24 s (nhanh gấp 3 lần)!', 'success'); checkDone(); renderRight(); });
  lab.on('stats', ({ fps, calls, tris }) => { statsEl.textContent = `${fps} FPS · ${calls} draws · ${(tris / 1000).toFixed(0)}k tris`; });

  lab.benches.lens.lensObj.set(lensSetup(lensParams()));
  goStep(0);
  setTimeout(syncInsets, 80);
}
