// Lớp giao diện theo DESIGN_SYSTEM.md v0.10 (Soft Tech · Tím Pod), dùng cho trang có <html data-ui="ds">.
// Chỉ dựng phần vỏ quanh sân khấu: sidebar, topbar, thanh thao tác, bộ chọn ống, dụng cụ, dải kết quả, tủ hoá chất, hộp thoại.
// Sân khấu (bàn 2D + vòng kính + thanh tua) vẫn do lab.js, bench2d.js, lens3d.js lo. Hoá học và hàng chờ dùng chung qua đối tượng c (ngữ cảnh) và A (hành động).
import { icon } from './icons.js';

export function mountDS(c) {
  const { S, bench, TUBES, Tn, tn, el, put, $, fm, num, cap, low, BY_ID, CAB, OLD, MAX_ML, label, isSolid, shortName, concText, chemName, listLabel, pieceUnit, unitOf, pretty, seenShort, indSay, modelOf, ratioText, norm, toast, A } = c;
  const app = $('app'), ws = $('workspace'), wide = matchMedia('(min-width:1600px)'); // mốc tủ cố định, xem ghi chú trong ds.css
  const btn = (cls, ic, text, attrs = {}) => el('button', { class: cls, type: 'button', ...attrs }, ic ? icon(ic) : null, text != null ? el('span', {}, text) : null);
  const keycap = (ic) => el('span', { class: 'nav-icon' }, icon(ic));

  // ---------- sidebar + topbar ----------
  // "Khám phá" chưa có trang mở được nên chưa đưa vào điều hướng chính (design system mục 2).
  const bookCount = el('span', { class: 'count' }, '0');
  const bookBtn = el('button', { type: 'button', 'aria-expanded': 'false', onclick: () => { S.book = !S.book; A.renderBook(); app.classList.remove('menu-open'); } }, keycap('notebook-pen'), el('span', {}, 'Sổ thí nghiệm'), bookCount);
  put($('sidebar'),
    el('div', { class: 'brand-row' }, el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, icon('flask-conical')), el('span', {}, 'Lab Khoa Học')), btn('quiet icon-only menu-close', 'x', null, { 'aria-label': 'Đóng menu', onclick: () => app.classList.remove('menu-open') })),
    el('nav', { class: 'app-nav', 'aria-label': 'Điều hướng chính' },
      el('div', { class: 'nav-group', role: 'group', 'aria-label': 'Phòng lab' }, el('p', { class: 'nav-caption', 'aria-hidden': 'true' }, 'Phòng lab'), el('button', { type: 'button', 'aria-current': 'page' }, keycap('flask-conical'), el('span', {}, 'Bàn thực hành'))),
      el('div', { class: 'nav-group', role: 'group', 'aria-label': 'Ghi chép' }, el('p', { class: 'nav-caption', 'aria-hidden': 'true' }, 'Ghi chép'), bookBtn)));
  $('menuBackdrop').addEventListener('click', () => app.classList.remove('menu-open'));
  const showChem = btn('secondary', 'beaker', 'Hoá chất', { 'aria-controls': 'cabinet', onclick: () => { if (wide.matches) S.dock = true; else S.cabOpen = !S.cabOpen; cabState(); } });
  put($('appHeader'), btn('quiet icon-only menu-toggle', 'menu', null, { 'aria-label': 'Mở menu', onclick: () => app.classList.add('menu-open') }),
    el('div', { class: 'breadcrumb' }, el('span', {}, 'Lab Khoa Học'), icon('chevron-right'), el('strong', {}, 'Bàn thực hành')), el('div', { class: 'heading-actions' }, showChem));

  // ---------- hộp thoại dùng chung (Chi tiết, Thêm) ----------
  const layer = $('layer'), layerTitle = el('h2', { id: 'layerTitle' }), layerBody = el('div', { class: 'layer-content' });
  put(layer, el('header', {}, layerTitle, btn('quiet icon-only', 'x', null, { 'aria-label': 'Đóng', onclick: () => layer.close() })), layerBody);
  layer.addEventListener('click', (e) => { if (e.target === layer) layer.close(); });
  layer.addEventListener('keydown', (e) => e.stopPropagation()); // phím tắt của bàn (phím cách, L, 1–5) không chạy khi đang ở trong hộp thoại
  function openLayer(title, ...kids) { layerTitle.textContent = title; put(layerBody, kids); if (!layer.open) layer.showModal(); }
  const sec = (title, ...lines) => el('div', {}, el('h3', {}, title), lines.filter(Boolean).map((t, k) => el('p', { class: k ? 'note' : '' }, t)));

  // ---------- tủ hoá chất (bên phải): tìm · dạng (dung dịch / chất rắn) · nhóm hoá học ----------
  const F = { q: '', form: '', group: '' };
  const GROUP = [['', 'Tất cả nhóm'], ['acid', 'Acid'], ['base', 'Base'], ['salt', 'Muối'], ['metal', 'Kim loại'], ['indicator', 'Chỉ thị'], ['other', 'Khác']];
  const groupOf = (id) => { const g = BY_ID[id].group; return g === 'solid' ? (id === 'CaCO3' ? 'salt' : 'other') : g; }; // "chất rắn" là dạng, không phải nhóm: CaCO₃ về Muối, các oxide về Khác
  const colorOf = (id) => BY_ID[id].hex || (isSolid(id) ? '#9ca8ba' : '#dbe7eb'); // không màu: xám băng; kim loại, chất rắn chưa có màu riêng: xám bạc
  const search = el('input', { type: 'search', 'aria-label': 'Tìm hoá chất', placeholder: 'Tên hoặc công thức' });
  search.addEventListener('input', () => { F.q = search.value; cabList(); }); search.addEventListener('keydown', (e) => e.stopPropagation());
  const formTrack = el('div', { class: 'segmented-track', role: 'group', 'aria-label': 'Dạng hoá chất' });
  const forms = () => put(formTrack, [['', 'Tất cả'], ['liquid', 'Dung dịch'], ['solid', 'Chất rắn']].map(([v, t]) => el('button', { type: 'button', 'aria-pressed': String(F.form === v), onclick: () => { F.form = v; forms(); cabList(); } }, t)));
  const groupSel = el('select', { id: 'groupSel' }, GROUP.map(([v, t]) => el('option', { value: v }, t)));
  groupSel.addEventListener('change', () => { F.group = groupSel.value; cabList(); }); groupSel.addEventListener('keydown', (e) => e.stopPropagation());
  const countEl = el('div', { class: 'list-count', 'aria-live': 'polite' }), listEl = el('div', { class: 'chem-list' });
  put($('cabinet'), el('div', { class: 'cab-header' },
    el('div', { class: 'cab-heading' }, el('h2', {}, keycap('beaker'), 'Tủ hoá chất'), btn('quiet icon-only', 'x', null, { 'aria-label': 'Thu tủ hoá chất', title: 'Thu tủ lại để bàn rộng hơn', onclick: () => { if (wide.matches) S.dock = false; else S.cabOpen = false; cabState(); } })),
    el('label', { class: 'search-field' }, icon('search'), search),
    el('div', { class: 'filters' }, el('div', {}, el('span', { class: 'lbl' }, 'Dạng hoá chất'), formTrack), el('div', {}, el('label', { class: 'lbl', for: 'groupSel' }, 'Nhóm hoá học'), groupSel))), countEl, listEl);
  forms();
  const row = (id) => { const sel = S.chem === id, on = bench.has(id), sw = () => el('i', { class: 'swatch', style: `background:${colorOf(id)}`, 'aria-hidden': 'true' });
    return el('button', { class: 'chem-row', type: 'button', 'aria-pressed': String(sel), onclick: () => { A.selectChem(id); if (!wide.matches) { S.cabOpen = false; cabState(); } } },
      sel ? el('span', { class: 'chem-check', 'aria-hidden': 'true' }, icon('check')) : sw(),
      el('span', { style: 'min-width:0' }, el('b', {}, listLabel(id)), el('span', { class: 'chem-name' }, sel && BY_ID[id].hex ? sw() : null, shortName(id))),
      el('span', { class: 'chem-meta' }, concText(id), on ? el('span', { class: 'on-bench' }, 'Trên bàn', el('span', { class: 'put', role: 'button', title: 'Cất lọ này vào tủ, các món khác giữ nguyên', 'aria-label': `Cất ${label(id)} vào tủ`, onclick: (e) => { e.stopPropagation(); A.putAwayOne(id); } }, icon('x'))) : null)); };
  function cabList() { const q = norm(F.q.trim()), ids = CAB.filter((id) => (!F.form || (F.form === 'solid') === isSolid(id)) && (!F.group || groupOf(id) === F.group) && (!q || norm(`${BY_ID[id].f} ${BY_ID[id].name} ${OLD[id] || ''} ${id}`).includes(q)));
    countEl.textContent = `${ids.length} hoá chất`; put(listEl, ids.length ? ids.map(row) : el('p', { class: 'list-empty' }, 'Không có chất nào khớp.')); }
  function cabState() { const w = wide.matches; ws.classList.toggle('cab-closed', w && !S.dock); ws.classList.toggle('cab-open', !w && !!S.cabOpen); showChem.hidden = w && S.dock; showChem.setAttribute('aria-expanded', String(w ? !!S.dock : !!S.cabOpen)); }
  $('cabBackdrop').addEventListener('click', () => { S.cabOpen = false; cabState(); }); wide.addEventListener('change', cabState);

  // ---------- thanh thao tác: ống đích · hoá chất · lượng · thêm lần nữa · nút chính theo ngữ cảnh ----------
  const D = {}; let doseSig = '';
  const stepOf = (u) => (u === 'mL' ? 0.5 : 1), maxOf = (u) => (u === 'mL' ? MAX_ML : u === 'giot' ? 40 : 3);
  function setAmt(v) { const id = S.chem; if (!id) return; const u = unitOf(id), st = stepOf(u); v = Math.min(maxOf(u), Math.max(st, Math.round(v / st) * st)); S.amount[u] = v; D.inp.value = String(v).replace('.', ','); }
  // Mở tủ hoá chất và đặt con trỏ vào ô tìm: dùng cho nút chính khi chưa chọn chất và cho ô "Hoá chất" trên thanh thao tác
  function openCab() { if (wide.matches) S.dock = true; else S.cabOpen = true; cabState(); setTimeout(() => search.focus(), 60); }
  { D.tube = el('strong', {}); D.chem = el('button', { class: 'dose-chem', type: 'button', title: 'Mở tủ hoá chất để chọn hoặc đổi chất', onclick: openCab }); D.unit = el('span', {}); D.hint = el('p', { class: 'dose-hint', 'aria-live': 'polite' });
    D.inp = el('input', { type: 'text', inputmode: 'decimal', id: 'amount' });
    D.inp.addEventListener('change', () => { const id = S.chem; if (id) setAmt(num(D.inp.value) || S.amount[unitOf(id)]); }); D.inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') D.inp.blur(); e.stopPropagation(); });
    const stepBtn = (ic, name, dir) => el('button', { class: 'step', type: 'button', 'aria-label': name, onclick: () => { const id = S.chem; if (id) setAmt(S.amount[unitOf(id)] + dir * stepOf(unitOf(id))); } }, icon(ic));
    D.repeat = btn('quiet', 'rotate-ccw', 'Thêm lần nữa', { title: 'Thêm đúng chất và lượng vừa dùng vào ống đang chọn (phím cách)', onclick: () => A.repeat(false) });
    D.go = btn('primary', 'pipette', 'Chọn hoá chất', { onclick: () => { const id = S.chem; if (!id) { openCab(); return; } const u = unitOf(id); A.addNow(id, S.tube, u, S.amount[u]); } });
    put($('doseBar'), el('div', { class: 'dose-field tube-target' }, el('span', {}, 'Ống đích'), D.tube), el('div', { class: 'dose-field reagent' }, el('span', {}, 'Hoá chất'), D.chem),
      el('div', { class: 'dose-field' }, el('label', { for: 'amount' }, 'Lượng'), el('div', { class: 'dose-amount' }, stepBtn('minus', 'Giảm lượng', -1), D.inp, stepBtn('plus', 'Tăng lượng', 1), D.unit)), D.hint, D.repeat, D.go); }
  function renderDose() { const id = S.chem, u = id ? unitOf(id) : 'mL', verb = u === 'piece' ? 'Thả' : u === 'giot' ? 'Nhỏ' : 'Rót';
    D.tube.textContent = Tn(S.tube); D.chem.textContent = id ? chemName(id) : 'Chọn trong tủ'; D.chem.classList.toggle('todo', !id);
    D.inp.disabled = !id; if (document.activeElement !== D.inp) D.inp.value = String(S.amount[u]).replace('.', ',');
    const both = !!id && u !== 'piece' && id !== 'pp' && id !== 'H2O', sig = `${id}|${u}|${both}`;
    if (sig !== doseSig) { doseSig = sig; put(D.unit, both ? el('span', { class: 'segmented-track', role: 'group', 'aria-label': 'Đơn vị' }, ['mL', 'giot'].map((x) => el('button', { type: 'button', 'aria-pressed': String(u === x), onclick: () => { S.unit = x; A.render(); } }, x === 'mL' ? 'mL' : 'giọt'))) : u === 'piece' ? pieceUnit(id) : u === 'giot' ? 'giọt' : 'mL'); }
    D.go.lastChild.textContent = id ? `${verb} vào ${tn(S.tube)}` : 'Chọn hoá chất'; D.go.replaceChild(icon(id ? 'pipette' : 'beaker'), D.go.firstChild); D.repeat.disabled = !S.lastAdd;
    D.hint.textContent = S.queue.length ? `Tiếp theo: ${S.queue[0].text}${S.queue.length > 1 ? ` (và ${S.queue.length - 1} việc nữa)` : ''}.` : !id ? 'Chọn một chất trong tủ hoá chất, hoặc chạm một lọ đang ở trên bàn.' : `Hoặc chạm thẳng vào một ống trên bàn để ${low(verb)} ngay.`; }

  // ---------- hàng dưới sân khấu: bộ chọn ống A–E · hành động của ống đang chọn · dụng cụ ----------
  const T = { armed: false };
  { T.sel = el('div', { class: 'tube-selector', role: 'group', 'aria-label': 'Chọn ống nghiệm' });
    T.view = btn('quiet', 'scan', 'Cận cảnh', { title: 'Nhấc ống đang chọn lên xem, có nhãn chỉ vào từng lớp', onclick: () => A.setView(bench.currentView() === 'tube' ? 'all' : 'tube') });
    // Đổ bỏ là hành động của riêng ống đang chọn; có chất thì hỏi lại một lần (bấm lần nữa trong 3 giây)
    T.dis = btn('quiet soft-danger', 'trash-2', 'Đổ bỏ', { onclick: () => { const t = S.tubes[S.tube], need = t.vol > 0 || Object.keys(t.items).length > 0; if (!need || T.armed) { T.armed = false; clearTimeout(T.t); A.discard(); renderTubes(); return; } T.armed = true; renderTubes(); T.t = setTimeout(() => { T.armed = false; renderTubes(); }, 3000); } });
    const sep = () => el('span', { class: 'sep', 'aria-hidden': 'true' });
    // Hai tầng (chủ dặn 19/11): tầng 1 = bộ chọn ống + hành động của riêng ống đang chọn; tầng 2 = MỌI dụng cụ và phép thử đều hiện sẵn, không giấu trong "Thêm".
    T.needs = []; const need = (b) => { T.needs.push(b); return b; };
    T.sound = btn('quiet', 'volume-2', 'Âm thanh', { onclick: () => { A.toggleSound(); renderTubes(); } });
    put($('tubeRow'),
      el('div', { class: 'tier' }, T.sel, el('div', { class: 'tool-bar', role: 'group', 'aria-label': 'Hành động của ống đang chọn' }, T.view, T.dis)),
      el('div', { class: 'tier tools' }, el('span', { class: 'tier-label' }, 'Dụng cụ'),
        el('div', { class: 'tool-bar', role: 'group', 'aria-label': 'Dụng cụ và phép thử' },
          btn('quiet', 'droplet', 'Nước cất', { title: 'Chọn bình tia nước cất', onclick: () => A.selectChem('H2O') }), sep(),
          need(btn('quiet', 'wind', 'Lắc', { title: 'Lắc ống đang chọn (phím L)', onclick: A.shake })), need(btn('quiet', 'flame', 'Đun nóng', { title: 'Đun ống đang chọn trên đèn cồn', onclick: A.doHeat })), sep(),
          need(btn('quiet', 'litmus', 'Giấy quỳ', { title: 'Thử dung dịch trong ống đang chọn bằng giấy quỳ', onclick: A.doLitmus })), btn('quiet', 'splint', 'Que đóm', { title: 'Đưa que đóm đang cháy tới miệng ống đang chọn', onclick: A.doSplint }),
          need(btn('quiet', 'thermo', 'Nhiệt kế', { title: 'Đo xem ống đang chọn ấm lên hay không (chưa có số độ)', onclick: A.doThermo }))),
        el('div', { class: 'tool-bar end', role: 'group', 'aria-label': 'Bàn' }, T.sound, (T.clear = btn('quiet soft-danger', 'trash-2', 'Dọn bàn', { title: 'Cất hết lọ, đổ bỏ cả 5 ống, xoá nhật ký', onclick: openClear }))))); }
  function renderTubes() {
    put(T.sel, TUBES.map((i) => { const t = S.tubes[i], on = S.tube === i, L = S.last[i], sign = !!L && L.events.some((e) => e.kind === 'reaction' || e.kind === 'indicator');
      return el('button', { type: 'button', 'aria-pressed': String(on), title: sign ? `${Tn(i)}: ${seenShort(L.events)}` : null, onclick: () => A.selectTube(i) }, el('b', {}, Tn(i)), on ? icon('check') : null,
        el('span', { class: 'reading' }, t.vol > 0.001 ? `${fm(t.vol, t.vol < 1 ? 2 : 1)} mL` : Object.keys(t.items).length ? 'Chất rắn' : 'Trống'), sign ? el('i', { class: 'sign', role: 'img', 'aria-label': 'có hiện tượng' }) : null); }));
    const cur = S.tubes[S.tube], empty = !(cur.vol > 0) && !Object.keys(cur.items).length, anything = S.log.length > 0 || bench.onBench().length > 0 || S.tubes.some((t) => t.vol > 0 || Object.keys(t.items).length > 0);
    T.dis.lastChild.textContent = T.armed ? 'Bấm lần nữa' : `Đổ bỏ ${tn(S.tube)}`; T.dis.title = empty ? `${Tn(S.tube)} đang trống` : `Đổ bỏ và rửa ${tn(S.tube)}`; T.dis.disabled = empty; T.dis.classList.toggle('armed', T.armed); T.clear.disabled = !anything;
    for (const b of T.needs) b.classList.toggle('off', empty); // ống trống: các phép thử cần có chất mờ đi (vẫn bấm được để hiện lời nhắc)
    const close = bench.currentView() === 'tube'; T.view.lastChild.textContent = close ? 'Toàn bàn' : 'Cận cảnh'; T.view.classList.toggle('on', close);
    T.sound.replaceChild(icon(S.sound ? 'volume-2' : 'volume-x'), T.sound.firstChild); T.sound.lastChild.textContent = S.sound ? 'Âm thanh: bật' : 'Âm thanh: tắt'; }
  // Dọn bàn là việc không lấy lại được: hỏi lại trong hộp thoại, ghi rõ phạm vi sẽ xoá.
  function openClear() { openLayer('Dọn bàn', el('p', {}, 'Dọn bàn sẽ cất hết lọ vào tủ, đổ bỏ cả 5 ống và xoá nhật ký trong sổ thí nghiệm. Không lấy lại được.'),
    el('div', { style: 'display:flex;gap:8px;justify-content:flex-end' }, btn('secondary', null, 'Thôi', { onclick: () => layer.close() }), btn('primary danger', 'trash-2', 'Dọn cả bàn', { onclick: () => { layer.close(); A.clearAll(); toast('Đã dọn bàn.'); } }))); }

  // ---------- đồ thị lượng sản phẩm theo thể tích trong ống (mẫu 19/11): nhỏ ở dải kết quả, to trong hộp Chi tiết ----------
  // Trục ngang là tổng thể tích trong ống (mL), không phải thời gian: đường đi lên khi còn đủ hai chất, nằm ngang khi một chất đã hết.
  const NS = 'http://www.w3.org/2000/svg', sv = (tag, attrs, ...kids) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...kids.filter((x) => x != null)); return n; };
  const mainProduct = (ti) => { const P = Object.entries(S.prod[ti]).filter(([f, q]) => f !== 'H2O' && q.mol > 1e-9); return P.find(([, q]) => q.mark === '↓') || P.find(([, q]) => q.mark === '↑') || P[0] || null; };
  function chart(ti, W, H, big) { const mp = mainProduct(ti); if (!mp) return null; const [f, q] = mp, pts = [[0, 0], ...S.curve[ti].map((d) => [d.v, d.p[f] || 0])], xm = Math.max(...pts.map((p) => p[0]), 0.001), ym = Math.max(...pts.map((p) => p[1])); if (!(ym > 0)) return null;
    const pl = big ? 46 : 3, pr = big ? 14 : 6, pt = big ? 14 : 5, pb = big ? 34 : 4, X = (v) => pl + (v / xm) * (W - pl - pr), Y = (y) => H - pb - (y / (ym * 1.12)) * (H - pt - pb), last = pts[pts.length - 1];
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' '), txt = (x, y, t, anchor = 'middle') => { const n = sv('text', { x, y, 'text-anchor': anchor, 'font-size': 11, fill: 'var(--muted)' }); n.textContent = t; return n; };
    let up = 0; for (let k = 1; k < pts.length; k++) if (pts[k][1] > pts[k - 1][1] + 1e-9) up = k; const flat = up > 0 && last[0] > pts[up][0] + 0.2;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Lượng ${pretty(f)} theo thể tích trong ống`, style: `width:${W}px;height:${H}px;max-width:100%;flex:none` },
      sv('path', { d: `${d} L${X(last[0]).toFixed(1)},${Y(0)} L${X(0)},${Y(0)} Z`, fill: 'var(--accent-soft)' }), sv('line', { x1: X(0), y1: Y(0), x2: X(xm), y2: Y(0), stroke: 'var(--control-border)', 'stroke-width': 1 }),
      big ? sv('line', { x1: X(0), y1: Y(0), x2: X(0), y2: pt - 4, stroke: 'var(--control-border)', 'stroke-width': 1 }) : null, big ? sv('line', { x1: X(0), y1: Y(ym), x2: X(xm), y2: Y(ym), stroke: 'var(--border)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }) : null,
      sv('path', { d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': big ? 2.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }), sv('circle', { cx: X(last[0]), cy: Y(last[1]), r: big ? 4 : 3, fill: 'var(--accent)' }),
      big ? txt(pl - 7, Y(ym) + 4, fm(ym, 2), 'end') : null, big ? txt(pl - 7, Y(0) + 4, '0', 'end') : null, big ? txt(X(0), H - 18, '0') : null, big ? txt(X(xm), H - 18, `${fm(xm, 1)} mL`, 'end') : null,
      big ? txt((X(0) + X(xm)) / 2, H - 4, 'Tổng thể tích trong ống (mL)') : null, big ? txt(pl - 7, pt - 2, 'mmol', 'end') : null);
    return { svg, f, mark: q.mark || '', mmol: last[1], flat }; }

  // ---------- dải kết quả: quan sát · phương trình · đồ thị nhỏ · Chi tiết ----------
  const R = {};
  { R.eye = el('span', { class: 'eyebrow' }); R.ph = el('strong', {}); R.eq = el('strong', { class: 'equation' }); R.det = btn('secondary', null, 'Chi tiết', { onclick: openDetails }); R.det.append(icon('chevron-right'));
    R.chart = el('div', { class: 'spark', title: 'Lượng sản phẩm theo tổng thể tích trong ống. Bấm Chi tiết để xem bản to.' });
    put($('resultDs'), el('div', { class: 'result-state' }, R.eye, R.ph), R.eq, R.chart, R.det); }
  const parts = (ti) => { const L = S.last[ti], ev = (L && L.events) || []; return { L, rx: ev.filter((e) => e.kind === 'reaction'), ind: ev.find((e) => e.kind === 'indicator'), first: ev[0] }; };
  function renderResult() { const ti = S.tube, t = S.tubes[ti], N = S.note[ti], { L, rx, ind, first } = parts(ti); let text, cls = '', eq = [];
    R.eye.textContent = `Quan sát · ${Tn(ti)}`;
    if (rx.length) { text = cap(seenShort(L.events)); eq = rx.filter((e) => e.r.equation).map((e) => e.r.equation); }
    else if (ind) text = cap(indSay(ind));
    else if (first) { text = first.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu'; cls = first.kind === 'none' ? 'none' : 'na'; eq = [`${label(first.a)} + ${label(first.b)}`]; }
    else if (N) text = N.seen;
    else { text = t.vol > 0.001 || Object.keys(t.items).length ? 'Chưa có hiện tượng' : 'Ống trống'; cls = 'none'; }
    R.ph.textContent = text; R.ph.className = cls;
    const sub = eq.length > 1 ? `và ${eq.length - 1} phương trình nữa, xem Chi tiết` : N && first ? `${N.tag}: ${low(N.seen)}` : '';
    put(R.eq, eq.length ? [eq[0], sub ? el('small', {}, sub) : null] : sub ? el('small', {}, sub) : null); R.det.disabled = !first && !N;
    const c = chart(ti, 150, 44, false); put(R.chart, c ? [c.svg, el('span', {}, el('b', {}, `${pretty(c.f)}${c.mark}`), `${fm(c.mmol, 2)} mmol`, el('small', {}, c.flat ? 'đã ngừng tăng' : 'theo mL trong ống'))] : null); }
  function openDetails() { const ti = S.tube, N = S.note[ti], { L, rx, ind, first } = parts(ti), out = [];
    if (rx.length) { const made = (e) => { const tot = S.sum[ti][e.r.equation] || e.extent; return e.r.eq ? 'Đã tạo ra ' + e.r.eq.rhs.filter((x) => x.f !== 'H2O').map((x) => `${fm(x.coef * tot * 1000, 2)} mmol ${pretty(x.f)}`).join(' · ') : ''; };
      out.push(sec('Quan sát', cap(seenShort(L.events))));
      out.push(el('div', {}, el('h3', {}, 'Phương trình'), rx.filter((e) => e.r.equation).map((e) => el('p', { class: 'eq' }, e.r.equation, el('small', {}, made(e))))));
      const m = modelOf(ti); if (m && m.usesIons) out.push(el('div', {}, el('h3', {}, 'Phương trình ion thu gọn'), el('p', { class: 'eq' }, m.ionic, m.spect.length ? el('small', {}, `Ion không tham gia: ${m.spect.map((x) => x.label).join(', ')}`) : null)));
      const e2 = rx.find((e) => e.r.eq && e.r.eq.lhs.length > 1); if (e2) out.push(sec('Tỉ lệ mol', ratioText(e2)));
      const c = chart(ti, 440, 190, true); if (c) out.push(el('div', {}, el('h3', {}, `Lượng ${pretty(c.f)}${c.mark} theo thể tích trong ống`), c.svg, el('p', { class: 'note' }, c.flat ? 'Đường nằm ngang ở cuối: một chất tham gia đã hết, thêm chất kia nữa không tạo thêm sản phẩm.' : 'Đường còn đi lên: cả hai chất tham gia vẫn còn. Trục ngang là thể tích trong ống, không phải thời gian.')));
      out.push(sec('Vì sao', (L.over ? `${label(L.over.other)} trong ống đã hết: thêm ${label(L.over.id)} nữa không tạo thêm sản phẩm. ` : '') + rx[0].r.reason)); }
    else if (ind) out.push(sec('Chất chỉ thị', cap(indSay(ind)), `pH trong ống khoảng ${fm(ind.pH, 1)}. Phenolphthalein hoá hồng khi pH từ khoảng 8,2 trở lên.`));
    else if (first) out.push(sec(first.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu', `${label(first.a)} + ${label(first.b)}`, first.r.reason));
    if (N) out.push(sec(`Phép thử · ${N.tag}`, N.seen, N.why));
    openLayer(`Chi tiết · ${Tn(ti)}`, ...out); }

  cabState();
  return {
    render() { cabList(); renderDose(); renderTubes(); renderResult(); cabState(); },
    hint: renderDose,
    view: renderTubes,
    book() { bookCount.textContent = String(S.log.length); bookBtn.setAttribute('aria-expanded', String(!!S.book)); },
  };
}
