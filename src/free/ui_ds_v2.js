// Lớp giao diện V2 (PA1 · Sân khấu kéo dọc tối đa ~80% + Tận dụng 65% trống dưới Sidebar trái).
// Dùng chung toàn bộ engine hoá học, sân khấu 2D, kính lúp hạt, kho dụng cụ và biểu đồ với lab.js.
import { icon } from './icons.js';

export function mountDS(c) {
  const { S, bench, TUBES, Tn, tn, capOf, onBench, isCup, el, put, $, fm, num, cap, low, BY_ID, CAB, OLD, label, isSolid, shortName, concText, chemName, listLabel, pieceUnit, unitOf, pretty, seenShort, indSay, modelOf, ratioText, norm, toast, A } = c;
  const app = $('app');
  const btn = (cls, ic, text, attrs = {}) => el('button', { class: cls, type: 'button', ...attrs }, ic ? icon(ic) : null, text != null ? el('span', {}, text) : null);
  const keycap = (ic) => el('span', { class: 'nav-icon' }, icon(ic));

  // ---------- Hộp thoại dùng chung (Chi tiết, Dọn bàn) ----------
  const layer = $('layer'), layerTitle = el('h2', { id: 'layerTitle' }), layerBody = el('div', { class: 'layer-content' });
  put(layer, el('header', {}, layerTitle, btn('quiet icon-only', 'x', null, { 'aria-label': 'Đóng', onclick: () => layer.close() })), layerBody);
  layer.addEventListener('click', (e) => { if (e.target === layer) layer.close(); });
  layer.addEventListener('keydown', (e) => e.stopPropagation());
  function openLayer(title, ...kids) { layerTitle.textContent = title; put(layerBody, kids); if (!layer.open) layer.showModal(); }
  const sec = (title, ...lines) => el('div', {}, el('h3', {}, title), lines.filter(Boolean).map((t, k) => el('p', { class: k ? 'note' : '' }, t)));

  // ---------- LEFT SIDEBAR: COMPACT NAV + 3-TAB DOCK [THAO TÁC 2x4 | HOÁ CHẤT | KHO BÌNH] ----------
  S.leftTab = S.leftTab || 'chem';
  const bookCount = el('span', { class: 'count' }, '0');
  const bookBtn = el('button', { type: 'button', 'aria-expanded': 'false', onclick: () => { S.book = !S.book; A.renderBook(); app.classList.remove('menu-open'); } },
    keycap('notebook-pen'), el('span', {}, 'Sổ', bookCount));

  const leftTabs = el('div', { class: 'segmented-track left-tabs', role: 'tablist', 'aria-label': 'Ngăn điều khiển bên trái' });
  const paneKeypad = el('div', { class: 'left-dock-pane' });
  const paneChem = el('div', { class: 'left-dock-pane' });
  const paneKho = el('div', { class: 'left-dock-pane' });

  function setLeftTab(tab) {
    S.leftTab = tab;
    put(leftTabs, [
      ['keypad', 'Thao tác'],
      ['chem', 'Hoá chất'],
      ['kho', 'Kho bình']
    ].map(([k, labelText]) => el('button', {
      type: 'button',
      role: 'tab',
      'aria-pressed': String(S.leftTab === k),
      onclick: () => setLeftTab(k)
    }, labelText)));
    paneKeypad.hidden = tab !== 'keypad';
    paneChem.hidden = tab !== 'chem';
    paneKho.hidden = tab !== 'kho';
    if (tab === 'kho') toolList();
  }

  // --- TAB 1: CALCULATOR-STYLE 2x4 TOOL KEYPAD ---
  const K = { needs: [] };
  const need = (b) => { K.needs.push(b); return b; };
  const padKey = (ic, labelText, title, onclick) => el('button', { class: 'calc-key', type: 'button', title, onclick }, icon(ic), el('span', {}, labelText));
  K.view = padKey('scan', 'Cận cảnh', 'Phóng tới bình đang chọn, có nhãn chỉ vào từng lớp', () => A.setView(bench.currentView() === 'tube' ? 'all' : 'tube'));
  put(paneKeypad,
    el('div', { class: 'keypad-wrap' },
      el('div', { class: 'keypad-group' },
        el('p', { class: 'keypad-label' }, 'Thao tác trên bình'),
        el('div', { class: 'keypad-grid' },
          padKey('droplet', 'Nước cất', 'Chọn bình tia nước cất', () => A.selectChem('H2O')),
          need(padKey('wind', 'Lắc bình', 'Lắc bình đang chọn (phím L)', A.shake)),
          need(padKey('stir', 'Khuấy đều', 'Khuấy bình đang chọn bằng đũa thuỷ tinh (phím K)', A.stir)),
          need(padKey('flame', 'Đun nóng', 'Đun bình đang chọn trên đèn cồn', A.doHeat))
        )
      ),
      el('div', { class: 'keypad-group' },
        el('p', { class: 'keypad-label' }, 'Phép thử & Quan sát'),
        el('div', { class: 'keypad-grid' },
          need(padKey('litmus', 'Giấy quỳ', 'Thử dung dịch bằng giấy quỳ', A.doLitmus)),
          padKey('splint', 'Que đóm', 'Đưa que đóm tới miệng bình đang chọn', A.doSplint),
          need(padKey('thermo', 'Nhiệt kế', 'Đo bình đang chọn ấm lên hay không', A.doThermo)),
          K.view
        )
      )
    )
  );

  // --- TAB 2: CHEMICAL CABINET (Column 3 Tonal + Semantic Standard) ---
  const F = { q: '', form: '', group: '' };
  const GROUP = [['', 'Tất cả nhóm'], ['acid', 'Acid'], ['base', 'Base'], ['salt', 'Muối'], ['metal', 'Kim loại'], ['indicator', 'Chỉ thị'], ['other', 'Khác']];
  const groupOf = (id) => { const g = BY_ID[id].group; return g === 'solid' ? (id === 'CaCO3' ? 'salt' : 'other') : g; };
  const colorOf = (id) => BY_ID[id].hex || (isSolid(id) ? '#9ca8ba' : '#dbe7eb');
  const search = el('input', { type: 'search', 'aria-label': 'Tìm hoá chất', placeholder: 'Tên hoặc công thức' });
  search.addEventListener('input', () => { F.q = search.value; cabList(); });
  search.addEventListener('keydown', (e) => e.stopPropagation());
  const formTrack = el('div', { class: 'segmented-track', role: 'group', 'aria-label': 'Dạng hoá chất' });
  const forms = () => put(formTrack, [['', 'Tất cả'], ['liquid', 'Dung dịch'], ['solid', 'Chất rắn']].map(([v, t]) =>
    el('button', { type: 'button', 'aria-pressed': String(F.form === v), onclick: () => { F.form = v; forms(); cabList(); } }, t)));
  const groupSel = el('select', { id: 'groupSel', 'aria-label': 'Nhóm hoá học' }, GROUP.map(([v, t]) => el('option', { value: v }, t)));
  groupSel.addEventListener('change', () => { F.group = groupSel.value; cabList(); });
  groupSel.addEventListener('keydown', (e) => e.stopPropagation());
  const countEl = el('div', { class: 'list-count', 'aria-live': 'polite' }), listEl = el('div', { class: 'chem-list' });
  put(paneChem,
    el('label', { class: 'search-field' }, icon('search'), search),
    el('div', { class: 'filters' }, formTrack, groupSel),
    countEl,
    listEl
  );
  forms();

  const thumbs = !!bench.thumb;
  const row = (id) => {
    const sel = S.chem === id, on = bench.has(id);
    const sw = () => el('i', { class: 'swatch', style: `background:${colorOf(id)}`, 'aria-hidden': 'true' });
    return el('button', {
      class: 'chem-row' + (thumbs ? ' has-thumb' : ''),
      type: 'button',
      'aria-pressed': String(sel),
      onclick: () => { A.selectChem(id); app.classList.remove('menu-open'); }
    },
      thumbs
        ? el('span', { class: 'chem-thumb', 'aria-hidden': 'true' }, el('img', { src: bench.thumb({ chem: id }, 44), alt: '' }), sel ? el('span', { class: 'chem-check' }, icon('check')) : null)
        : (sel ? el('span', { class: 'chem-check', 'aria-hidden': 'true' }, icon('check')) : sw()),
      el('span', { style: 'min-width:0' }, el('b', {}, listLabel(id)), el('span', { class: 'chem-name' }, sel && BY_ID[id].hex && !thumbs ? sw() : null, shortName(id))),
      el('span', { class: 'chem-meta' }, concText(id), on ? el('span', { class: 'on-bench' }, 'Trên bàn', el('span', { class: 'put', role: 'button', title: 'Cất lọ này vào tủ', 'aria-label': `Cất ${label(id)} vào tủ`, onclick: (e) => { e.stopPropagation(); A.putAwayOne(id); } }, icon('x'))) : null)
    );
  };
  function cabList() {
    const q = norm(F.q.trim());
    const ids = CAB.filter((id) => (!F.form || (F.form === 'solid') === isSolid(id)) && (!F.group || groupOf(id) === F.group) && (!q || norm(`${BY_ID[id].f} ${BY_ID[id].name} ${OLD[id] || ''} ${id}`).includes(q)));
    countEl.textContent = `${ids.length} hoá chất`;
    put(listEl, ids.length ? ids.map(row) : el('p', { class: 'list-empty' }, 'Không có chất nào khớp.'));
  }

  // --- TAB 3: KHO BÌNH & DỤNG CỤ PHÒNG LAB ---
  const khoListEl = el('div', { class: 'chem-list tool-list' });
  put(paneKho, khoListEl);
  const KHO = [
    ['Bình phản ứng', [{ v: 'tube', name: 'Ống nghiệm', img: 'tube', sub: `Giá 5 ống A–E · tối đa ${capOf(0)} mL` }, { v: 'beaker', name: 'Cốc thuỷ tinh 100 mL', img: 'beaker' }, { v: 'erlenmeyer', name: 'Bình tam giác 100 mL', img: 'erlenmeyer' }, { v: 'flask', name: 'Bình cầu 100 mL', img: 'flask' }, { name: 'Chén sứ', img: 'dish', soon: 'Để cô cạn dung dịch' }]],
    ['Đo thể tích', [{ v: 'cylinder', name: 'Ống đong 50 mL', img: 'cylinder' }, { name: 'Buret 25 mL', img: 'buret', soon: 'Để chuẩn độ' }]],
    ['Đun & Khuấy', [{ name: 'Đèn cồn + kẹp gỗ', img: 'lamp', use: 'Đun nóng', go: () => A.doHeat(), sub: 'Đun ống nghiệm trên lửa' }, { name: 'Đũa thuỷ tinh', img: 'rod', use: 'Khuấy', go: () => A.stir(), sub: 'Khuấy đều bình đang chọn' }]]
  ];
  const thumb = (it) => {
    const src = it.img && bench.assetOf && bench.assetOf(it.img) && (bench.thumb ? bench.thumb({ img: it.img }, 44) : bench.assetOf(it.img));
    return el('span', { class: 'tool-ic' + (src ? ' pic' : ''), 'aria-hidden': 'true' }, src ? el('img', { src, alt: '' }) : icon(it.ic || 'beaker'));
  };
  function toolList() {
    const kids = [];
    for (const [g, items] of KHO) {
      kids.push(el('p', { class: 'tool-group' }, g));
      for (const it of items) {
        if (it.v === 'tube') {
          kids.push(el('div', { class: 'chem-row tool-row' }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, it.sub)), el('span', { class: 'chem-meta' }, el('span', { class: 'on-bench' }, 'Trên bàn'))));
          continue;
        }
        if (it.v) {
          const all = TUBES.filter((i) => bench.tubes[i].kind === it.v);
          if (!all.length) continue;
          const on = all.filter((i) => bench.tubes[i].on), left = all.length - on.length, capVal = bench.tubes[all[0]].cap;
          kids.push(el('button', { class: 'chem-row tool-row', type: 'button', disabled: !left, onclick: () => A.placeCup(it.v) },
            thumb(it),
            el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, left ? `Đặt lên bàn · tối đa ${capVal} mL` : 'Đã ở trên bàn')),
            el('span', { class: 'chem-meta' }, on.map((i) => el('span', { class: 'on-bench' }, Tn(i), el('span', { class: 'put', role: 'button', title: `Cất ${tn(i)} vào tủ`, onclick: (e) => { e.stopPropagation(); A.stowCup(i); } }, icon('x')))))
          ));
          continue;
        }
        if (it.use) {
          kids.push(el('button', { class: 'chem-row tool-row', type: 'button', onclick: it.go }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, it.sub)), el('span', { class: 'chem-meta' }, el('span', { class: 'use-tag' }, 'Dùng ngay'))));
          continue;
        }
        kids.push(el('div', { class: 'chem-row tool-row soon' }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, it.soon)), el('span', { class: 'chem-meta' }, el('span', { class: 'soon-tag' }, 'Sắp có'))));
      }
    }
    put(khoListEl, kids);
  }

  // Sidebar Footer: Global Sound & Clear Bench
  const soundBtn = btn('quiet', 'volume-2', 'Âm thanh', { onclick: () => { A.toggleSound(); renderTubes(); } });
  const clearBtn = btn('quiet soft-danger', 'trash-2', 'Dọn bàn', { title: 'Cất hết lọ, đổ bỏ mọi bình, xoá nhật ký', onclick: openClear });

  put($('sidebar'),
    el('div', { class: 'brand-row' },
      el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, icon('flask-conical')), el('span', {}, 'Lab Khoa Học')),
      btn('quiet icon-only menu-close', 'x', null, { 'aria-label': 'Đóng menu', onclick: () => app.classList.remove('menu-open') })
    ),
    el('nav', { class: 'nav-strip', 'aria-label': 'Điều hướng chính' },
      el('button', { type: 'button', onclick: () => { location.href = './index.html'; } }, keycap('graduation-cap'), el('span', {}, 'Bài mẫu')),
      el('button', { type: 'button', 'aria-current': 'page' }, keycap('flask-conical'), el('span', {}, 'Thực hành')),
      bookBtn
    ),
    leftTabs,
    paneKeypad,
    paneChem,
    paneKho,
    el('div', { class: 'sidebar-foot' }, soundBtn, clearBtn)
  );
  $('menuBackdrop').addEventListener('click', () => app.classList.remove('menu-open'));

  // ---------- ROW 1: UNIFIED SLIM TITLE + COMMAND BAR ----------
  const D = {}; let doseSig = '';
  const stepOf = (u) => (u === 'mL' ? (capOf(S.tube) >= 50 ? 5 : 0.5) : 1);
  const maxOf = (u) => (u === 'mL' ? capOf(S.tube) : u === 'giot' ? 40 : 3);
  function setAmt(v) { const id = S.chem; if (!id) return; const u = unitOf(id), st = stepOf(u); v = Math.min(maxOf(u), Math.max(st, Math.round(v / st) * st)); S.amount[u] = v; D.inp.value = String(v).replace('.', ','); }
  function openChemTab() { setLeftTab('chem'); app.classList.add('menu-open'); setTimeout(() => search.focus(), 60); }
  {
    D.tube = el('strong', {});
    D.chem = el('button', { class: 'dose-chem', type: 'button', title: 'Mở tab Hoá chất bên trái', onclick: openChemTab });
    D.unit = el('span', {});
    D.hint = el('p', { class: 'dose-hint', 'aria-live': 'polite' });
    D.inp = el('input', { type: 'text', inputmode: 'decimal', id: 'amount' });
    D.inp.addEventListener('change', () => { const id = S.chem; if (id) setAmt(num(D.inp.value) || S.amount[unitOf(id)]); });
    D.inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') D.inp.blur(); e.stopPropagation(); });
    const stepBtn = (ic, name, dir) => el('button', { class: 'step', type: 'button', 'aria-label': name, onclick: () => { const id = S.chem; if (id) setAmt(S.amount[unitOf(id)] + dir * stepOf(unitOf(id))); } }, icon(ic));
    D.repeat = btn('quiet', 'rotate-ccw', 'Lặp lại', { title: 'Thêm đúng chất và lượng vừa dùng (phím cách)', onclick: () => A.repeat(false) });
    D.go = btn('primary', 'pipette', 'Chọn hoá chất', { onclick: () => { const id = S.chem; if (!id) { openChemTab(); return; } const u = unitOf(id); A.addNow(id, S.tube, u, S.amount[u]); } });

    put($('doseBar'),
      el('div', { class: 'dose-brand' },
        btn('quiet icon-only menu-toggle', 'menu', null, { 'aria-label': 'Mở menu', onclick: () => app.classList.add('menu-open') }),
        el('div', { class: 'dose-brand-title' }, el('small', {}, 'Lab Khoa Học › Bàn thực hành'), el('h1', {}, 'Thực hành tự do'))
      ),
      el('div', { class: 'dose-field tube-target' }, el('span', {}, 'Bình đích'), D.tube),
      el('div', { class: 'dose-field reagent' }, el('span', {}, 'Hoá chất'), D.chem),
      el('div', { class: 'dose-field' }, el('label', { for: 'amount' }, 'Lượng'), el('div', { class: 'dose-amount' }, stepBtn('minus', 'Giảm lượng', -1), D.inp, stepBtn('plus', 'Tăng lượng', 1), D.unit)),
      D.hint,
      D.repeat,
      D.go
    );
  }
  function renderDose() {
    const id = S.chem, u = id ? unitOf(id) : 'mL', verb = u === 'piece' ? 'Thả' : u === 'giot' ? 'Nhỏ' : 'Rót';
    D.tube.textContent = Tn(S.tube);
    D.chem.textContent = id ? chemName(id) : 'Chọn bên trái';
    D.chem.classList.toggle('todo', !id);
    D.inp.disabled = !id;
    if (document.activeElement !== D.inp) D.inp.value = String(S.amount[u]).replace('.', ',');
    const both = !!id && u !== 'piece' && id !== 'pp' && id !== 'H2O', sig = `${id}|${u}|${both}`;
    if (sig !== doseSig) {
      doseSig = sig;
      put(D.unit, both
        ? el('span', { class: 'segmented-track', role: 'group', 'aria-label': 'Đơn vị' }, ['mL', 'giot'].map((x) => el('button', { type: 'button', 'aria-pressed': String(u === x), onclick: () => { S.unit = x; A.render(); } }, x === 'mL' ? 'mL' : 'giọt')))
        : u === 'piece' ? pieceUnit(id) : u === 'giot' ? 'giọt' : 'mL');
    }
    D.go.lastChild.textContent = id ? `${verb} vào ${tn(S.tube)}` : 'Chọn hoá chất';
    D.go.replaceChild(icon(id ? 'pipette' : 'beaker'), D.go.firstChild);
    D.repeat.disabled = !S.lastAdd;
    D.hint.textContent = S.queue.length
      ? `Tiếp theo: ${S.queue[0].text}${S.queue.length > 1 ? ` (+${S.queue.length - 1})` : ''}.`
      : !id ? 'Chọn chất ở cột trái hoặc chạm lọ trên bàn.' : `Chạm thẳng vào bình trên bàn để ${low(verb)} ngay.`;
  }

  // ---------- ROW 3A: VESSEL SELECTOR + DISCARD ----------
  const T = { armed: false };
  {
    T.sel = el('div', { class: 'tube-selector', role: 'group', 'aria-label': 'Chọn bình đích' });
    T.dis = btn('quiet soft-danger discard-btn', 'trash-2', 'Đổ bỏ', {
      onclick: () => {
        const t = S.tubes[S.tube], need = t.vol > 0 || Object.keys(t.items).length > 0;
        if (!need || T.armed) { T.armed = false; clearTimeout(T.t); A.discard(); renderTubes(); return; }
        T.armed = true; renderTubes();
        T.t = setTimeout(() => { T.armed = false; renderTubes(); }, 3000);
      }
    });
    put($('tubeRow'), T.sel, T.dis);
  }
  function renderTubes() {
    const vs = onBench();
    T.sel.style.gridTemplateColumns = `repeat(${vs.length}, minmax(0, 1fr))`;
    put(T.sel, vs.map((i) => {
      const t = S.tubes[i], on = S.tube === i, L = S.last[i];
      const sign = !!L && L.events.some((e) => e.kind === 'reaction' || e.kind === 'indicator');
      return el('button', { type: 'button', 'aria-pressed': String(on), title: sign ? `${Tn(i)}: ${seenShort(L.events)}` : null, onclick: () => A.selectTube(i) },
        el('b', {}, Tn(i)),
        el('span', { class: 'reading' }, t.vol > 0.001 ? `${fm(t.vol, t.vol < 1 ? 2 : 1)} mL` : Object.keys(t.items).length ? 'Rắn' : 'Trống'),
        sign ? el('i', { class: 'sign', role: 'img', 'aria-label': 'có hiện tượng' }) : null
      );
    }));
    const cur = S.tubes[S.tube], empty = !(cur.vol > 0) && !Object.keys(cur.items).length;
    const anything = S.log.length > 0 || bench.onBench().length > 0 || S.tubes.some((t) => t.vol > 0 || Object.keys(t.items).length > 0);
    T.dis.lastChild.textContent = T.armed ? 'Bấm nữa' : 'Đổ bỏ';
    T.dis.title = empty ? `${Tn(S.tube)} đang trống` : `Đổ bỏ và rửa ${tn(S.tube)}`;
    T.dis.disabled = empty;
    T.dis.classList.toggle('armed', T.armed);
    clearBtn.disabled = !anything;
    for (const b of K.needs) b.classList.toggle('off', empty);
    const close = bench.currentView() === 'tube';
    K.view.lastChild.textContent = close ? 'Toàn bàn' : 'Cận cảnh';
    K.view.classList.toggle('on', close);
    soundBtn.replaceChild(icon(S.sound ? 'volume-2' : 'volume-x'), soundBtn.firstChild);
    soundBtn.lastChild.textContent = S.sound ? 'Âm thanh' : 'Đã tắt';
  }

  function openClear() {
    openLayer('Dọn bàn',
      el('p', {}, 'Dọn bàn sẽ cất hết lọ và cốc vào tủ, đổ bỏ mọi ống, cốc và xoá nhật ký trong sổ thí nghiệm. Không lấy lại được.'),
      el('div', { style: 'display:flex;gap:8px;justify-content:flex-end' },
        btn('secondary', null, 'Thôi', { onclick: () => layer.close() }),
        btn('primary danger', 'trash-2', 'Dọn cả bàn', { onclick: () => { layer.close(); A.clearAll(); toast('Đã dọn bàn.'); } })
      )
    );
  }

  // ---------- ROW 3B: LIVE OBSERVATION RESULT & SPARKLINE ----------
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs, ...kids) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...kids.filter((x) => x != null)); return n; };
  const mainProduct = (ti) => { const P = Object.entries(S.prod[ti]).filter(([f, q]) => f !== 'H2O' && q.mol > 1e-9); return P.find(([, q]) => q.mark === '↓') || P.find(([, q]) => q.mark === '↑') || P[0] || null; };
  function chart(ti, W, H, big) {
    const mp = mainProduct(ti); if (!mp) return null;
    const [f, q] = mp, pts = [[0, 0], ...S.curve[ti].map((d) => [d.v, d.p[f] || 0])];
    const xm = Math.max(...pts.map((p) => p[0]), 0.001), ym = Math.max(...pts.map((p) => p[1])); if (!(ym > 0)) return null;
    const pl = big ? 46 : 3, pr = big ? 14 : 6, pt = big ? 14 : 5, pb = big ? 34 : 4;
    const X = (v) => pl + (v / xm) * (W - pl - pr), Y = (y) => H - pb - (y / (ym * 1.12)) * (H - pt - pb), last = pts[pts.length - 1];
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
    const txt = (x, y, t, anchor = 'middle') => { const n = sv('text', { x, y, 'text-anchor': anchor, 'font-size': 11, fill: 'var(--muted)' }); n.textContent = t; return n; };
    let up = 0; for (let k = 1; k < pts.length; k++) if (pts[k][1] > pts[k - 1][1] + 1e-9) up = k;
    const flat = up > 0 && last[0] > pts[up][0] + 0.2;
    const svgEl = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Lượng ${pretty(f)} theo thể tích`, style: `width:${W}px;height:${H}px;max-width:100%;flex:none` },
      sv('path', { d: `${d} L${X(last[0]).toFixed(1)},${Y(0)} L${X(0)},${Y(0)} Z`, fill: 'var(--accent-soft)' }),
      sv('line', { x1: X(0), y1: Y(0), x2: X(xm), y2: Y(0), stroke: 'var(--control-border)', 'stroke-width': 1 }),
      big ? sv('line', { x1: X(0), y1: Y(0), x2: X(0), y2: pt - 4, stroke: 'var(--control-border)', 'stroke-width': 1 }) : null,
      big ? sv('line', { x1: X(0), y1: Y(ym), x2: X(xm), y2: Y(ym), stroke: 'var(--border)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }) : null,
      sv('path', { d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': big ? 2.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
      sv('circle', { cx: X(last[0]), cy: Y(last[1]), r: big ? 4 : 3, fill: 'var(--accent)' }),
      big ? txt(pl - 7, Y(ym) + 4, fm(ym, 2), 'end') : null, big ? txt(pl - 7, Y(0) + 4, '0', 'end') : null,
      big ? txt(X(0), H - 18, '0') : null, big ? txt(X(xm), H - 18, `${fm(xm, 1)} mL`, 'end') : null,
      big ? txt((X(0) + X(xm)) / 2, H - 4, 'Tổng thể tích trong bình (mL)') : null, big ? txt(pl - 7, pt - 2, 'mmol', 'end') : null
    );
    return { svg: svgEl, f, mark: q.mark || '', mmol: last[1], flat };
  }

  const R = {};
  {
    R.eye = el('span', { class: 'eyebrow' });
    R.ph = el('strong', {});
    R.eq = el('strong', { class: 'equation' });
    R.det = btn('secondary', null, 'Chi tiết', { onclick: openDetails });
    R.det.append(icon('chevron-right'));
    R.chart = el('div', { class: 'spark', title: 'Lượng sản phẩm theo tổng thể tích trong bình' });
    put($('resultDs'), el('div', { class: 'result-state' }, R.eye, R.ph), R.eq, R.chart, R.det);
  }
  const parts = (ti) => { const L = S.last[ti], ev = (L && L.events) || []; return { L, rx: ev.filter((e) => e.kind === 'reaction'), ind: ev.find((e) => e.kind === 'indicator'), first: ev[0] }; };
  function renderResult() {
    const ti = S.tube, t = S.tubes[ti], N = S.note[ti], { L, rx, ind, first } = parts(ti);
    let text, cls = '', eq = [];
    R.eye.textContent = `Quan sát · ${Tn(ti)}`;
    if (rx.length) { text = cap(seenShort(L.events)); eq = rx.filter((e) => e.r.equation).map((e) => e.r.equation); }
    else if (ind) text = cap(indSay(ind));
    else if (first) { text = first.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu'; cls = first.kind === 'none' ? 'none' : 'na'; eq = [`${label(first.a)} + ${label(first.b)}`]; }
    else if (N) text = N.seen;
    else { text = t.vol > 0.001 || Object.keys(t.items).length ? 'Chưa có hiện tượng' : (isCup(ti) ? `${Tn(ti)} trống` : 'Ống trống'); cls = 'none'; }
    R.ph.textContent = text; R.ph.className = cls;
    const sub = eq.length > 1 ? `+${eq.length - 1} pt nữa` : N && first ? `${N.tag}: ${low(N.seen)}` : '';
    put(R.eq, eq.length ? [eq[0], sub ? el('small', {}, sub) : null] : sub ? el('small', {}, sub) : null);
    R.det.disabled = !first && !N;
    const ch = chart(ti, 92, 34, false);
    put(R.chart, ch ? [ch.svg, el('span', {}, el('b', {}, `${pretty(ch.f)}${ch.mark}`), el('small', {}, `${fm(ch.mmol, 2)} mmol`))] : null);
  }
  function openDetails() {
    const ti = S.tube, N = S.note[ti], { L, rx, ind, first } = parts(ti), out = [];
    if (rx.length) {
      const made = (e) => { const tot = S.sum[ti][e.r.equation] || e.extent; return e.r.eq ? 'Đã tạo ra ' + e.r.eq.rhs.filter((x) => x.f !== 'H2O').map((x) => `${fm(x.coef * tot * 1000, 2)} mmol ${pretty(x.f)}`).join(' · ') : ''; };
      out.push(sec('Quan sát', cap(seenShort(L.events))));
      out.push(el('div', {}, el('h3', {}, 'Phương trình'), rx.filter((e) => e.r.equation).map((e) => el('p', { class: 'eq' }, e.r.equation, el('small', {}, made(e))))));
      const m = modelOf(ti); if (m && m.usesIons) out.push(el('div', {}, el('h3', {}, 'Phương trình ion thu gọn'), el('p', { class: 'eq' }, m.ionic, m.spect.length ? el('small', {}, `Ion không tham gia: ${m.spect.map((x) => x.label).join(', ')}`) : null)));
      const e2 = rx.find((e) => e.r.eq && e.r.eq.lhs.length > 1); if (e2) out.push(sec('Tỉ lệ mol', ratioText(e2)));
      const ch = chart(ti, 440, 190, true); if (ch) out.push(el('div', {}, el('h3', {}, `Lượng ${pretty(ch.f)}${ch.mark} theo thể tích trong bình`), ch.svg, el('p', { class: 'note' }, ch.flat ? 'Đường nằm ngang ở cuối: một chất tham gia đã hết.' : 'Đường còn đi lên: cả hai chất tham gia vẫn còn.')));
      out.push(sec('Vì sao', (L.over ? `${label(L.over.other)} trong bình đã hết. ` : '') + rx[0].r.reason));
    } else if (ind) out.push(sec('Chất chỉ thị', cap(indSay(ind)), `pH khoảng ${fm(ind.pH, 1)}.`));
    else if (first) out.push(sec(first.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu', `${label(first.a)} + ${label(first.b)}`, first.r.reason));
    if (N) out.push(sec(`Phép thử · ${N.tag}`, N.seen, N.why));
    openLayer(`Chi tiết · ${Tn(ti)}`, ...out);
  }

  setLeftTab(S.leftTab);
  return {
    render() { cabList(); if (S.leftTab === 'kho') toolList(); renderDose(); renderTubes(); renderResult(); },
    hint: renderDose,
    view: renderTubes,
    book() { bookCount.textContent = String(S.log.length); bookBtn.setAttribute('aria-expanded', String(!!S.book)); },
  };
}
