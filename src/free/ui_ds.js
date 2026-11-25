// Lớp giao diện theo DESIGN_SYSTEM.md v0.10 (Soft Tech · Tím Pod), dùng cho trang có <html data-ui="ds">.
// Chỉ dựng phần vỏ quanh sân khấu: sidebar, topbar, thanh thao tác, bộ chọn ống, dụng cụ, dải kết quả, tủ hoá chất, hộp thoại.
// Sân khấu (bàn 2D + vòng kính + thanh tua) vẫn do lab.js, bench2d.js, lens3d.js lo. Hoá học và hàng chờ dùng chung qua đối tượng c (ngữ cảnh) và A (hành động).
import { icon } from './icons.js';

export function mountDS(c) {
  const { S, bench, TUBES, Tn, tn, capOf, onBench, isCup, el, put, $, fm, cap, low, BY_ID, CAB, OLD, MAX_ML, label, isSolid, shortName, concText, chemName, listLabel, pieceUnit, unitOf, pretty, seenShort, indSay, modelOf, ratioText, norm, toast, visibleFx, safetyOf, notesOf, canFilter, filtrationIssue, A } = c;
  const V2 = document.documentElement.dataset.layout === 'v2'; // bố cục v2 (thuc_hanh_v2.html, 21/11): sân khấu cao hết cỡ, tủ + cụm dụng cụ nằm ở cột trái, một thanh đáy. Cùng một tệp giao diện, chỉ khác chỗ đặt.
  const app = $('app'), ws = $('workspace'), wide = matchMedia('(min-width:1600px)'); // mốc tủ cố định, xem ghi chú trong ds.css
  const btn = (cls, ic, text, attrs = {}) => el('button', { class: cls, type: 'button', ...attrs }, ic ? icon(ic) : null, text != null ? el('span', {}, text) : null);
  const keycap = (ic) => el('span', { class: 'nav-icon' }, icon(ic));

  // ---------- sidebar + topbar ----------
  // "Khám phá" chưa có trang mở được nên chưa đưa vào điều hướng chính (design system mục 2).
  const bookCount = el('span', { class: 'count' }, '0');
  const bookBtn = el('button', { type: 'button', 'aria-expanded': 'false', onclick: () => { S.book = !S.book; A.renderBook(); app.classList.remove('menu-open'); } }, keycap('notebook-pen'), V2 ? el('span', {}, 'Sổ', bookCount) : el('span', {}, 'Sổ thí nghiệm'), V2 ? null : bookCount);
  const brandRow = el('div', { class: 'brand-row' }, el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, icon('flask-conical')), el('span', {}, 'Lab Khoa Học')), btn('quiet icon-only menu-close', 'x', null, { 'aria-label': 'Đóng menu', onclick: () => app.classList.remove('menu-open') }));
  const railDock = el('div', { class: 'rail-dock' }); // v2: chỗ đặt tủ + cụm dụng cụ + Âm thanh, Dọn bàn (gắn vào sau khi dựng xong)
  if (V2) put($('sidebar'), brandRow,
    el('nav', { class: 'nav-strip', 'aria-label': 'Điều hướng chính' }, el('button', { type: 'button', onclick: () => { location.href = './index.html?v=3'; } }, keycap('graduation-cap'), el('span', {}, 'Bài mẫu')), el('button', { type: 'button', 'aria-current': 'page' }, keycap('flask-conical'), el('span', {}, 'Thực hành')), bookBtn), railDock);
  else put($('sidebar'), brandRow,
    el('nav', { class: 'app-nav', 'aria-label': 'Điều hướng chính' },
      el('div', { class: 'nav-group', role: 'group', 'aria-label': 'Phòng lab' }, el('p', { class: 'nav-caption', 'aria-hidden': 'true' }, 'Phòng lab'), el('button', { type: 'button', onclick: () => { location.href = './index.html?v=3'; } }, keycap('graduation-cap'), el('span', {}, 'Bài học mẫu')), el('button', { type: 'button', 'aria-current': 'page' }, keycap('flask-conical'), el('span', {}, 'Bàn thực hành'))),
      el('div', { class: 'nav-group', role: 'group', 'aria-label': 'Ghi chép' }, el('p', { class: 'nav-caption', 'aria-hidden': 'true' }, 'Ghi chép'), bookBtn)));
  $('menuBackdrop').addEventListener('click', () => app.classList.remove('menu-open'));
  const showChem = btn('secondary', 'beaker', 'Hoá chất', { 'aria-controls': 'cabinet', onclick: () => { setTab('chem'); if (wide.matches) S.dock = true; else S.cabOpen = !S.cabOpen; cabState(); } });
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
  // Tủ có hai ngăn (đợt 1, 19/11): Hoá chất | Dụng cụ. Tủ = thứ ĐẶT LÊN BÀN (chất, bình); hàng Dụng cụ dưới sân khấu = việc LÀM VỚI bình đang chọn.
  S.cabTab = S.cabTab || 'chem';
  const tabTrack = el('div', { class: 'segmented-track cab-tabs', role: 'group', 'aria-label': 'Ngăn tủ' }), cabTitle = el('span', {}), cabIcon = el('span', { class: 'nav-icon' });
  const chemPane = el('div', { class: 'cab-pane' }), toolPane = el('div', { class: 'cab-pane chem-list tool-list' }), chemHead = el('div', { class: 'cab-chemhead' });
  function setTab(v) { S.cabTab = v; put(tabTrack, [['chem', 'Hoá chất'], ['tools', 'Dụng cụ']].map(([k, t]) => el('button', { type: 'button', 'aria-pressed': String(S.cabTab === k), onclick: () => setTab(k) }, t)));
    cabTitle.textContent = v === 'chem' ? 'Tủ hoá chất' : 'Tủ dụng cụ'; put(cabIcon, icon(v === 'chem' ? 'beaker' : 'test-tube')); chemHead.hidden = chemPane.hidden = v !== 'chem'; toolPane.hidden = v === 'chem'; if (v !== 'chem') toolList(); }
  put($('cabinet'), el('div', { class: 'cab-header' },
    el('div', { class: 'cab-heading' }, el('h2', {}, cabIcon, cabTitle), btn('quiet icon-only', 'x', null, { 'aria-label': 'Thu tủ hoá chất', title: 'Thu tủ lại để bàn rộng hơn', onclick: () => { if (wide.matches) S.dock = false; else S.cabOpen = false; cabState(); } })),
    tabTrack, put(chemHead, el('label', { class: 'search-field' }, icon('search'), search),
    el('div', { class: 'filters' }, el('div', {}, el('span', { class: 'lbl' }, 'Dạng hoá chất'), formTrack), el('div', {}, el('label', { class: 'lbl', for: 'groupSel' }, 'Nhóm hoá học'), groupSel))) || chemHead), put(chemPane, countEl, listEl) || chemPane, toolPane);
  forms();
  // Ngăn Dụng cụ: nhóm "Bình phản ứng". Ống nghiệm luôn ở trong giá; cốc 100 mL bấm để đặt lên bàn (tối đa 2), dấu × trên nhãn "Trên bàn" để cất cốc trống.
  // Ngăn Dụng cụ = cả kho của phòng thí nghiệm (chủ 19/11: "chuẩn bị 1 kho tủ vẫn hợp lý hơn chứ"). Ba kiểu món:
  //  bình (v): bấm là đặt lên bàn, thành bình đích, × trên nhãn để cất (bình phải trống);
  //  dụng cụ đã dùng được (use): bấm là làm luôn việc đó với bình đang chọn (giống hàng Dụng cụ dưới bàn);
  //  món chưa làm thao tác (soon): hiện trong kho, ghi rõ "chưa dùng được" và để làm gì.
  const KHO = [
    ['Bình phản ứng', [{ v: 'tube', name: 'Ống nghiệm', img: 'tube', sub: `Giá 5 ống A–E · mỗi ống chứa tối đa ${capOf(0)} mL` }, { v: 'beaker', name: 'Cốc thuỷ tinh 100 mL', img: 'beaker' }, { v: 'erlenmeyer', name: 'Bình tam giác 100 mL', img: 'erlenmeyer' }, { v: 'flask', name: 'Bình cầu đáy bằng 100 mL', img: 'flask' }, { name: 'Chén sứ', img: 'dish', soon: 'Để cô cạn dung dịch' }]],
    ['Đo thể tích', [{ v: 'cylinder', name: 'Ống đong 50 mL', img: 'cylinder' }, { name: 'Buret 25 mL', img: 'buret', soon: 'Để chuẩn độ (lắp trên giá sắt)' }]],
    ['Lọ đựng', [{ name: 'Lọ nhỏ giọt (quả bóp đỏ)', img: 'dropbottle', use: 'Có sẵn', sub: 'Chất chỉ thị (phenolphthalein) đựng lọ này, nhỏ thẳng từng giọt' }, { name: 'Lọ thuỷ tinh nâu', img: 'bottle_amber', use: 'Có sẵn', sub: 'Chất nhạy sáng: AgNO₃, KMnO₄, H₂O₂, KI' }, { name: 'Lọ hoá chất', img: 'bottle', use: 'Có sẵn', sub: 'Chọn chất trong ngăn Hoá chất, lọ tự ra bàn' }]],
    ['Đun nóng', [{ name: 'Đèn cồn + kẹp gỗ', img: 'lamp', use: 'Đun nóng', go: () => A.doHeat(), sub: 'Đun ống nghiệm: kẹp gỗ giữ ống trên lửa' }, { name: 'Kiềng ba chân + lưới', img: 'tripod', use: 'Đun nóng', go: () => A.doHeat(), sub: 'Đun cốc, bình cầu, bình tam giác: đặt lên lưới trên đèn cồn' }]],
    ['Giá đỡ', [{ name: 'Giá sắt', img: 'stand', soon: 'Giữ buret, phễu, bình' }, { name: 'Kẹp', img: 'clamp', soon: 'Kẹp buret, bình lên giá sắt' }, { name: 'Vòng sắt', img: 'ring', soon: 'Đỡ phễu khi lọc' }]],
    ['Chuyển, lọc, khuấy', [{ name: 'Ống nhỏ giọt', img: 'dropper', use: 'Nhỏ giọt', sub: 'Chọn đơn vị "giọt" ở thanh thao tác' }, { name: 'Bình tia nước cất', img: 'washbottle', use: 'Nước cất', go: () => A.selectChem('H2O'), sub: 'Thêm nước cất vào bình đang chọn' }, { name: 'Thìa inox', img: 'spoon', use: 'Có sẵn', sub: 'Tự dùng khi lấy chất bột' }, { name: 'Kẹp gắp inox', img: 'tongs', use: 'Có sẵn', sub: 'Tự dùng khi gắp hạt, mẩu kim loại' }, { name: 'Phễu thuỷ tinh', img: 'funnel', soon: 'Để lọc tách kết tủa' }, { name: 'Giấy lọc', img: 'filterpaper', soon: 'Gấp nón đặt trong phễu khi lọc' }, { name: 'Cối chày sứ', img: 'mortar', soon: 'Nghiền chất rắn' }, { name: 'Đũa thuỷ tinh', img: 'rod', use: 'Khuấy', go: () => A.stir(), sub: 'Khuấy bình đang chọn, kết tủa bị khuấy tung lên' }]],
    ['Thu khí', [{ name: 'Ống dẫn khí có nút cao su', img: 'delivery', soon: 'Dẫn khí sang ống thu' }, { name: 'Chậu thuỷ tinh', img: 'trough', soon: 'Thu khí bằng cách đẩy nước' }, { name: 'Ống cao su', img: 'rubbertube', soon: 'Nối các dụng cụ trong bộ lắp' }]],
    ['Phép thử', [{ name: 'Giấy quỳ', img: 'litmus', ic: 'litmus', use: 'Giấy quỳ', go: () => A.doLitmus(), sub: 'Thử dung dịch trong bình đang chọn' }, { name: 'Que đóm', img: 'splint', ic: 'splint', use: 'Que đóm', go: () => A.doSplint(), sub: 'Đưa tới miệng bình đang chọn' }, { name: 'Nhiệt kế', img: 'thermometer', ic: 'thermo', use: 'Nhiệt kế', go: () => A.doThermo(), sub: 'Đo bình đang chọn ấm lên hay không' }]],
  ];
  const filterKit = ['stand', 'ring', 'funnel', 'filterpaper'];
  function openFilter() {
    if (S.running) { toast('Đợi thao tác trên bàn hoàn tất rồi lọc.'); return; }
    const sources = onBench().filter((i) => canFilter(S.tubes[i]));
    if (!sources.length) {
      openLayer('Lọc mẫu', el('p', {}, 'Tạo kết tủa hoặc cho chất rắn chưa tan vào một bình có dung dịch. Sau đó mở lại Lọc mẫu.'));
      return;
    }
    const source = el('select', { id: 'filterSource' }, sources.map((i) => el('option', { value: i }, `${Tn(i)} · ${fm(S.tubes[i].vol, 2)} mL`)));
    const receiver = el('select', { id: 'filterReceiver', 'aria-describedby': 'filterHelp' });
    const help = el('p', { id: 'filterHelp', role: 'status' });
    const start = btn('primary', null, 'Lắp bộ lọc và lọc', { onclick: () => {
      if (A.filterSample(Number(source.value), Number(receiver.value))) layer.close();
    } });
    function updateReceivers() {
      const from = Number(source.value);
      const empty = onBench().filter((i) => !filtrationIssue(S.tubes[from], S.tubes[i]));
      receiver.replaceChildren(...empty.map((i) => el('option', { value: i }, `${Tn(i)} · tối đa ${capOf(i)} mL`)));
      receiver.disabled = start.disabled = !empty.length;
      help.textContent = empty.length
        ? 'Dịch lọc chảy sang bình hứng. Chất rắn được giữ trên giấy.'
        : 'Đặt một cốc hoặc bình trống đủ sức chứa lên bàn rồi mở lại Lọc mẫu.';
    }
    if (sources.includes(S.tube)) source.value = String(S.tube);
    source.addEventListener('change', updateReceivers);
    updateReceivers();
    openLayer('Lọc mẫu',
      el('div', { class: 'filter-fields' }, el('label', {}, 'Bình nguồn', source), el('label', {}, 'Bình hứng', receiver)),
      help, el('div', { class: 'filter-actions' }, start));
  }
  const thumb = (it) => { const src = it.img && bench.assetOf && bench.assetOf(it.img) && (bench.thumb ? bench.thumb({ img: it.img }, 44) : bench.assetOf(it.img)); return el('span', { class: 'tool-ic' + (src ? ' pic' : ''), 'aria-hidden': 'true' }, src ? el('img', { src, alt: '' }) : icon(it.ic || 'beaker')); }; // ảnh nhỏ kiểu B: vẽ bằng mã bàn, ô tông mặt bàn
  function toolList() {
    const entry = { name: 'Lọc mẫu', img: 'funnel', use: 'Lọc', go: openFilter, sub: 'Phễu, giấy lọc, giá sắt và vòng sắt' };
    const groups = bench.filter ? [['Bộ lọc', [entry]], ...KHO] : KHO;
    const kids = []; for (const [g, items] of groups) { kids.push(el('p', { class: 'tool-group' }, g));
      for (const item of items) {
        const it = bench.filter && item.soon && filterKit.includes(item.img)
          ? { ...item, use: 'Bộ lọc', badge: 'Đã có', sub: 'Tự lắp cùng bộ lọc' }
          : item;
        if (it.v === 'tube') { kids.push(el('div', { class: 'chem-row tool-row' }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, it.sub)), el('span', { class: 'chem-meta' }, el('span', { class: 'on-bench' }, 'Trên bàn')))); continue; }
        if (it.v) { const all = TUBES.filter((i) => bench.tubes[i].kind === it.v); if (!all.length) { kids.push(el('div', { class: 'chem-row tool-row soon' }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, 'Đang chuẩn bị ảnh')), el('span', { class: 'chem-meta' }, el('span', { class: 'soon-tag' }, 'Chưa dùng được')))); continue; }
          const on = all.filter((i) => bench.tubes[i].on), left = all.length - on.length, cap = bench.tubes[all[0]].cap;
          kids.push(el('button', { class: 'chem-row tool-row', type: 'button', disabled: !left, title: left ? 'Đặt lên bàn, thành bình đích' : 'Đã ở trên bàn', onclick: () => A.placeCup(it.v) }, thumb(it),
            el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, left ? `Bấm để đặt lên bàn · chứa tối đa ${cap} mL${all.length > 1 ? ` · còn ${left} cái` : ''}` : 'Đã ở trên bàn')),
            el('span', { class: 'chem-meta' }, on.map((i) => el('span', { class: 'on-bench' }, Tn(i), el('span', { class: 'put', role: 'button', title: `Cất ${tn(i)} vào tủ (bình phải trống)`, 'aria-label': `Cất ${tn(i)} vào tủ`, onclick: (e) => { e.stopPropagation(); A.stowCup(i); } }, icon('x'))))))); continue; }
        if (it.use) { kids.push(el(it.go ? 'button' : 'div', { class: 'chem-row tool-row', type: it.go ? 'button' : null, title: it.go ? `${it.use} với ${tn(S.tube)}` : null, onclick: it.go || null }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, it.sub)), el('span', { class: 'chem-meta' }, el('span', { class: 'use-tag' }, it.badge || 'Dùng được')))); continue; }
        kids.push(el('div', { class: 'chem-row tool-row soon', title: 'Món này đã có trong kho nhưng bàn chưa làm thao tác cho nó' }, thumb(it), el('span', { style: 'min-width:0' }, el('b', {}, it.name), el('span', { class: 'chem-name' }, it.soon)), el('span', { class: 'chem-meta' }, el('span', { class: 'soon-tag' }, 'Chưa dùng được'))));
      } }
    kids.push(el('p', { class: 'tool-note' }, 'Bình ngoài giá: tối đa 4 cái trên bàn cùng lúc. Lắc, khuấy, đun, giấy quỳ, que đóm, nhiệt kế cũng có ở hàng Dụng cụ dưới bàn.'));
    put(toolPane, kids); }
  // Hàng hoá chất (chủ 20/11 "B + D"): ô đầu là ảnh nhỏ đúng cái lọ sẽ đứng trên bàn (màu dung dịch, lọ nâu, lọ rộng miệng có mẩu chất, lọ nhỏ giọt), thay vạch màu; chọn thì dấu ✓ nằm ở góc ảnh.
  const thumbs = !!bench.thumb;
  const row = (id) => { const sel = S.chem === id, on = bench.has(id), sw = () => el('i', { class: 'swatch', style: `background:${colorOf(id)}`, 'aria-hidden': 'true' });
    return el('button', { class: 'chem-row' + (thumbs ? ' has-thumb' : ''), type: 'button', 'aria-pressed': String(sel), onclick: () => { A.selectChem(id); if (V2) app.classList.remove('menu-open'); else if (!wide.matches) { S.cabOpen = false; cabState(); } } },
      thumbs ? el('span', { class: 'chem-thumb', 'aria-hidden': 'true' }, el('img', { src: bench.thumb({ chem: id }, 44), alt: '' }), sel ? el('span', { class: 'chem-check' }, icon('check')) : null) : sel ? el('span', { class: 'chem-check', 'aria-hidden': 'true' }, icon('check')) : sw(),
      el('span', { style: 'min-width:0' }, el('b', {}, listLabel(id)), el('span', { class: 'chem-name' }, sel && BY_ID[id].hex && !thumbs ? sw() : null, shortName(id))),
      el('span', { class: 'chem-meta' }, concText(id), on ? el('span', { class: 'on-bench' }, 'Trên bàn', el('span', { class: 'put', role: 'button', title: 'Cất lọ này vào tủ, các món khác giữ nguyên', 'aria-label': `Cất ${label(id)} vào tủ`, onclick: (e) => { e.stopPropagation(); A.putAwayOne(id); } }, icon('x'))) : null)); };
  function cabList() { const q = norm(F.q.trim()), ids = CAB.filter((id) => (!F.form || (F.form === 'solid') === isSolid(id)) && (!F.group || groupOf(id) === F.group) && (!q || norm(`${BY_ID[id].f} ${BY_ID[id].name} ${OLD[id] || ''} ${id}`).includes(q)));
    if (q) {
      const exact = ids.findIndex((id) => norm(BY_ID[id].f) === q || norm(id) === q);
      if (exact > 0) ids.unshift(...ids.splice(exact, 1));
    }
    countEl.textContent = `${ids.length} hoá chất`; put(listEl, ids.length ? ids.map(row) : el('p', { class: 'list-empty' }, 'Không có chất nào khớp.')); }
  function cabState() { if (V2) return; const w = wide.matches; ws.classList.toggle('cab-closed', w && !S.dock); ws.classList.toggle('cab-open', !w && !!S.cabOpen); showChem.hidden = w && S.dock; showChem.setAttribute('aria-expanded', String(w ? !!S.dock : !!S.cabOpen)); }
  $('cabBackdrop').addEventListener('click', () => { S.cabOpen = false; cabState(); }); wide.addEventListener('change', cabState);

  // ---------- thanh thao tác: ống đích · hoá chất · lượng · thêm lần nữa · nút chính theo ngữ cảnh ----------
  const D = {}; let doseSig = '';
  const stepOf = (u) => (u === 'mL' ? (capOf(S.tube) >= 50 ? 5 : 0.5) : 1), maxOf = (u) => (u === 'mL' ? capOf(S.tube) : u === 'giot' ? 40 : 3); // cốc 100 mL: bước 5 mL
  const minOf = (u) => u === 'mL' ? 0.1 : 1;
  function setDoseError(message) {
    D.error.textContent = message;
    D.error.hidden = !message;
    D.inp.setAttribute('aria-invalid', String(!!message));
  }
  function readDose({ focus = false, format = false } = {}) {
    const u = unitOf(S.chem), raw = D.inp.value.trim();
    const n = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(raw) ? Number(raw.replace(',', '.')) : NaN;
    const min = minOf(u), max = maxOf(u), unit = u === 'giot' ? 'giọt' : u === 'piece' ? 'mẩu' : 'mL';
    const valid = Number.isFinite(n) && n >= min && n <= max && (u === 'mL' || Number.isInteger(n));
    setDoseError(valid ? '' : u === 'mL' ? `Nhập từ 0,1 đến ${max} mL.` : `Nhập số nguyên từ 1 đến ${max} ${unit}.`);
    if (!valid) {
      if (focus) D.inp.focus();
      return null;
    }
    S.amount[u] = n;
    if (format) D.inp.value = String(n).replace('.', ',');
    return n;
  }
  // Mở tủ hoá chất và đặt con trỏ vào ô tìm: dùng cho nút chính khi chưa chọn chất và cho ô "Hoá chất" trên thanh thao tác
  function openCab() { setTab('chem'); if (V2) app.classList.add('menu-open'); else if (wide.matches) S.dock = true; else S.cabOpen = true; cabState(); setTimeout(() => search.focus(), 60); }
  { D.tube = el('strong', {}); D.chem = el('button', { class: 'dose-chem', type: 'button', title: 'Mở tủ hoá chất để chọn hoặc đổi chất', onclick: openCab }); D.unit = el('span', {}); D.hint = el('p', { class: 'dose-hint', 'aria-live': 'polite' });
    D.inp = el('input', { type: 'text', inputmode: 'decimal', id: 'amount', 'aria-describedby': 'doseError' });
    D.error = el('p', { id: 'doseError', class: 'dose-error', 'aria-live': 'polite', hidden: true });
    D.inp.addEventListener('input', () => { if (S.chem) readDose(); });
    D.inp.addEventListener('change', () => { if (S.chem) readDose({ format: true }); });
    D.inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && S.chem) readDose({ format: true }); e.stopPropagation(); });
    const stepBtn = (ic, name, dir) => el('button', { class: 'step', type: 'button', 'aria-label': name, onclick: () => {
      if (!S.chem) return;
      const u = unitOf(S.chem), n = Number((S.amount[u] + dir * stepOf(u)).toPrecision(12));
      D.inp.value = String(Math.min(maxOf(u), Math.max(minOf(u), n)));
      readDose({ format: true });
    } }, icon(ic));
    D.repeat = btn('quiet', 'rotate-ccw', 'Thêm lần nữa', { title: 'Thêm đúng chất và lượng vừa dùng vào bình đang chọn (phím cách)', onclick: () => A.repeat(false) });
    D.go = btn('primary', 'pipette', 'Chọn hoá chất', { onclick: () => {
      const id = S.chem;
      if (!id) { openCab(); return; }
      const n = readDose({ focus: true, format: true });
      if (n !== null) A.addNow(id, S.tube, unitOf(id), n);
    } });
    put($('doseBar'), V2 ? el('div', { class: 'dose-brand' }, btn('quiet icon-only menu-toggle', 'menu', null, { 'aria-label': 'Mở menu', onclick: () => app.classList.add('menu-open') }), el('div', { class: 'dose-brand-title' }, el('small', {}, 'Lab Khoa Học › Bàn thực hành'), el('h1', {}, 'Thực hành tự do'))) : null, el('div', { class: 'dose-field tube-target' }, el('span', {}, 'Bình đích'), D.tube), el('div', { class: 'dose-field reagent' }, el('span', {}, 'Hoá chất'), D.chem),
      el('div', { class: 'dose-field' }, el('label', { for: 'amount' }, 'Lượng'), el('div', { class: 'dose-amount' }, stepBtn('minus', 'Giảm lượng', -1), D.inp, stepBtn('plus', 'Tăng lượng', 1), D.unit), D.error), D.hint, D.repeat, D.go); }
  function renderDose() { const id = S.chem, u = id ? unitOf(id) : 'mL', verb = u === 'piece' ? 'Thả' : u === 'giot' ? 'Nhỏ' : 'Rót';
    D.tube.textContent = Tn(S.tube); D.chem.textContent = id ? chemName(id) : 'Chọn trong tủ'; D.chem.classList.toggle('todo', !id);
    D.inp.disabled = !id;
    const both = !!id && u !== 'piece' && id !== 'pp' && id !== 'H2O', sig = `${id}|${u}|${both}`;
    if (sig !== doseSig) {
      doseSig = sig;
      setDoseError('');
      D.inp.value = String(S.amount[u]).replace('.', ',');
      put(D.unit, both ? el('span', { class: 'segmented-track', role: 'group', 'aria-label': 'Đơn vị' }, ['mL', 'giot'].map((x) => el('button', { type: 'button', 'aria-pressed': String(u === x), onclick: () => { S.unit = x; A.render(); } }, x === 'mL' ? 'mL' : 'giọt'))) : u === 'piece' ? pieceUnit(id) : u === 'giot' ? 'giọt' : 'mL'); }
    D.go.lastChild.textContent = id ? `${verb} vào ${tn(S.tube)}` : 'Chọn hoá chất'; D.go.replaceChild(icon(id ? 'pipette' : 'beaker'), D.go.firstChild); D.repeat.disabled = !S.lastAdd;
    D.hint.textContent = S.queue.length ? `Tiếp theo: ${S.queue[0].text}${S.queue.length > 1 ? ` (và ${S.queue.length - 1} việc nữa)` : ''}.` : !id ? 'Chọn một chất trong tủ hoá chất, hoặc chạm một lọ đang ở trên bàn.' : `Hoặc chạm thẳng vào một bình trên bàn để ${low(verb)} ngay.`; }

  // ---------- hàng dưới sân khấu: bộ chọn ống A–E · hành động của ống đang chọn · dụng cụ ----------
  const T = { armed: null };
  function cancelDiscard() {
    T.armed = null;
    clearTimeout(T.t);
  }
  { T.sel = el('div', { class: 'tube-selector', role: 'group', 'aria-label': 'Chọn bình đích' });
    T.view = btn('quiet', 'scan', 'Cận cảnh', { title: 'Phóng tới bình đang chọn, có nhãn chỉ vào từng lớp', onclick: () => A.setView(bench.currentView() === 'tube' ? 'all' : 'tube') });
    // Đổ bỏ là hành động của riêng ống đang chọn; có chất thì hỏi lại một lần (bấm lần nữa trong 3 giây)
    T.dis = btn('quiet soft-danger discard-btn', 'trash-2', 'Đổ bỏ', { onclick: () => {
      const vessel = S.tubes[S.tube];
      if (T.armed === vessel) {
        cancelDiscard();
        A.discard();
      } else {
        cancelDiscard();
        T.armed = vessel;
        T.t = setTimeout(() => { cancelDiscard(); renderTubes(); }, 3000);
      }
      renderTubes();
    } });
    const sep = () => el('span', { class: 'sep', 'aria-hidden': 'true' });
    // Hai tầng (chủ dặn 19/11): tầng 1 = bộ chọn ống + hành động của riêng ống đang chọn; tầng 2 = MỌI dụng cụ và phép thử đều hiện sẵn, không giấu trong "Thêm".
    T.needs = []; const need = (b) => { T.needs.push(b); return b; };
    const tool = (ic, text, attrs) => (V2 ? el('button', { class: 'calc-key', type: 'button', ...attrs }, icon(ic), el('span', {}, text)) : btn('quiet', ic, text, attrs));
    T.sound = btn(V2 ? 'quiet icon-only' : 'quiet', 'volume-2', V2 ? null : 'Âm thanh', { 'aria-label': 'Âm thanh', onclick: () => { A.toggleSound(); renderTubes(); } });
    T.clear = btn(V2 ? 'quiet icon-only soft-danger' : 'quiet soft-danger', 'trash-2', V2 ? null : 'Dọn bàn', { 'aria-label': 'Dọn bàn', title: 'Dọn bàn: cất hết lọ và cốc, đổ bỏ mọi bình, xoá nhật ký', onclick: openClear });
    const K = { water: tool('droplet', 'Nước cất', { title: 'Chọn bình tia nước cất', onclick: () => A.selectChem('H2O') }), shake: need(tool('wind', 'Lắc', { title: 'Lắc bình đang chọn (phím L)', onclick: A.shake })), stir: need(tool('stir', 'Khuấy', { title: 'Khuấy bình đang chọn bằng đũa thuỷ tinh (phím K)', onclick: A.stir })),
      heat: need(tool('flame', 'Đun nóng', { title: 'Đun bình đang chọn: ống nghiệm cầm bằng kẹp gỗ, cốc và bình đặt lên kiềng + lưới (không đun ống đong)', onclick: A.doHeat })), litmus: need(tool('litmus', 'Giấy quỳ', { title: 'Thử dung dịch trong bình đang chọn bằng giấy quỳ', onclick: A.doLitmus })),
      splint: tool('splint', 'Que đóm', { title: 'Đưa que đóm đang cháy tới miệng bình đang chọn', onclick: A.doSplint }), thermo: need(tool('thermo', 'Nhiệt kế', { title: 'Đo xem bình đang chọn ấm lên hay không (chưa có số độ)', onclick: A.doThermo })) };
    if (V2) { // v2: dụng cụ LUÔN hiện (chủ 19/11: đủ các action), ghim thành cụm phím 4 × 2 ở cuối cột trái, không nằm sau tab; thanh đáy chỉ còn bộ chọn bình + Đổ bỏ
      T.view = tool('scan', 'Cận cảnh', { title: 'Phóng tới bình đang chọn, có nhãn chỉ vào từng lớp', onclick: () => A.setView(bench.currentView() === 'tube' ? 'all' : 'tube') });
      const cab = $('cabinet'); cab.hidden = false; cab.classList.add('in-rail');
      put(railDock, cab, el('div', { class: 'keypad', role: 'group', 'aria-label': 'Dụng cụ và phép thử' }, el('p', { class: 'keypad-label' }, 'Dụng cụ · dùng cho bình đang chọn'), el('div', { class: 'keypad-grid' }, K.water, K.shake, K.stir, K.heat, K.litmus, K.splint, K.thermo, T.view))
      );
      brandRow.insertBefore(el('div', { class: 'brand-tools' }, T.sound, T.clear), brandRow.lastChild); // Âm thanh, Dọn bàn: hai nút biểu tượng cạnh tên app, nhường chiều cao cho danh sách hoá chất
      put($('tubeRow'), T.sel, T.dis);
    } else put($('tubeRow'),
      el('div', { class: 'tier' }, T.sel, el('div', { class: 'tool-bar', role: 'group', 'aria-label': 'Hành động của ống đang chọn' }, T.view, T.dis)),
      el('div', { class: 'tier tools' }, el('span', { class: 'tier-label' }, 'Dụng cụ'),
        el('div', { class: 'tool-bar', role: 'group', 'aria-label': 'Dụng cụ và phép thử' }, K.water, sep(), K.shake, K.stir, K.heat, sep(), K.litmus, K.splint, K.thermo),
        el('div', { class: 'tool-bar end', role: 'group', 'aria-label': 'Bàn' }, T.sound, T.clear))); }
  function renderTubes() {
    const vs = onBench(); T.sel.style.gridTemplateColumns = `repeat(${vs.length},minmax(0,1fr))`; T.sel.classList.toggle('many', vs.length > 6 || V2);
    const vesselScroll = T.sel.scrollLeft, previous = [...T.sel.children];
    const buttons = vs.map((i) => {
      const t = S.tubes[i], on = S.tube === i, L = S.last[i], sign = !!L && L.events.some((e) => e.kind === 'reaction' || e.kind === 'indicator');
      const button = previous.find((item) => item.dataset.vessel === String(i)) ||
        el('button', { type: 'button', 'data-vessel': i, onclick: () => A.selectTube(i) });
      button.setAttribute('aria-pressed', String(on));
      if (sign) button.title = `${Tn(i)}: ${seenShort(L.events)}`;
      else button.removeAttribute('title');
      put(button, el('b', {}, Tn(i)), on ? icon('check') : null,
        el('span', { class: 'reading' }, t.vol > 0.001 ? `${fm(t.vol, t.vol < 1 ? 2 : 1)} mL` : Object.keys(t.items).length ? 'Chất rắn' : 'Trống'),
        sign ? el('i', { class: 'sign', role: 'img', 'aria-label': 'có hiện tượng' }) : null);
      return button;
    });
    if (previous.length !== buttons.length || buttons.some((button, i) => button !== previous[i])) {
      const focused = document.activeElement;
      put(T.sel, buttons);
      if (V2) T.sel.scrollLeft = vesselScroll;
      if (previous.includes(focused)) (buttons.includes(focused) ? focused : buttons.find((item) => item.dataset.vessel === String(S.tube)))?.focus({ preventScroll: true });
    }
    const cur = S.tubes[S.tube], empty = !(cur.vol > 0) && !Object.keys(cur.items).length, anything = S.log.length > 0 || bench.onBench().length > 0 || S.tubes.some((t) => t.vol > 0 || Object.keys(t.items).length > 0);
    if (T.armed && (T.armed !== cur || empty)) cancelDiscard();
    const armed = T.armed === cur;
    T.dis.lastChild.textContent = armed ? 'Bấm lần nữa' : V2 ? 'Đổ bỏ' : `Đổ bỏ ${tn(S.tube)}`;
    T.dis.setAttribute('aria-label', armed ? `Xác nhận đổ bỏ ${tn(S.tube)}` : `Đổ bỏ ${tn(S.tube)}`);
    T.dis.title = empty ? `${Tn(S.tube)} đang trống` : `Đổ bỏ và rửa ${tn(S.tube)}`;
    T.dis.disabled = empty; T.dis.classList.toggle('armed', armed); T.clear.disabled = !anything;
    for (const b of T.needs) b.classList.toggle('off', empty); // ống trống: các phép thử cần có chất mờ đi (vẫn bấm được để hiện lời nhắc)
    const close = bench.currentView() === 'tube'; T.view.lastChild.textContent = close ? 'Toàn bàn' : 'Cận cảnh'; T.view.classList.toggle('on', close);
    if (V2) T.view.setAttribute('aria-pressed', String(close));
    T.sound.replaceChild(icon(S.sound ? 'volume-2' : 'volume-x'), T.sound.firstChild); if (V2) T.sound.title = S.sound ? 'Âm thanh đang bật, bấm để tắt' : 'Âm thanh đang tắt, bấm để bật'; else T.sound.lastChild.textContent = S.sound ? 'Âm thanh: bật' : 'Âm thanh: tắt'; }
  // Dọn bàn là việc không lấy lại được: hỏi lại trong hộp thoại, ghi rõ phạm vi sẽ xoá.
  function openClear() { openLayer('Dọn bàn', el('p', {}, 'Dọn bàn sẽ cất hết lọ và cốc vào tủ, đổ bỏ mọi ống, cốc và xoá nhật ký trong sổ thí nghiệm. Không lấy lại được.'),
    el('div', { style: 'display:flex;gap:8px;justify-content:flex-end' }, btn('secondary', null, 'Thôi', { onclick: () => layer.close() }), btn('primary danger', 'trash-2', 'Dọn cả bàn', { onclick: () => { layer.close(); if (A.clearAll() !== false) toast('Đã dọn bàn.'); } }))); }

  // ---------- đồ thị lượng sản phẩm theo thể tích trong ống (mẫu 19/11): nhỏ ở dải kết quả, to trong hộp Chi tiết ----------
  // Trục ngang là tổng thể tích trong ống (mL), không phải thời gian: đường đi lên khi còn đủ hai chất, nằm ngang khi một chất đã hết.
  const NS = 'http://www.w3.org/2000/svg', sv = (tag, attrs, ...kids) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...kids.filter((x) => x != null)); return n; };
  const mainProduct = (ti) => {
    const consumed = S.last[ti]?.events
      .filter((event) => event.kind === 'reaction')
      .flatMap((event) => event.made || [])
      .find(({ f, mol, mark }) => mark === '↓' && mol < 0 && S.curve[ti].some(({ p }) => p[f] > 1e-6));
    if (consumed) return [consumed.f, S.prod[ti][consumed.f]];
    const products = Object.entries(S.prod[ti]).filter(([f, q]) => f !== 'H2O' && q.mol > 1e-9);
    return products.find(([, q]) => q.mark === '↓') || products.find(([, q]) => q.mark === '↑') || products[0] || null;
  };
  function chart(ti, W, H, big) { const mp = mainProduct(ti); if (!mp) return null; const [f, q] = mp, pts = [[0, 0], ...S.curve[ti].map((d) => [d.v, d.p[f] || 0])], xm = Math.max(...pts.map((p) => p[0]), 0.001), ym = Math.max(...pts.map((p) => p[1])); if (!(ym > 0)) return null;
    const pl = big ? 46 : 3, pr = big ? 14 : 6, pt = big ? 14 : 5, pb = big ? 34 : 4, X = (v) => pl + (v / xm) * (W - pl - pr), Y = (y) => H - pb - (y / (ym * 1.12)) * (H - pt - pb), last = pts[pts.length - 1];
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' '), txt = (x, y, t, anchor = 'middle') => { const n = sv('text', { x, y, 'text-anchor': anchor, 'font-size': 11, fill: 'var(--muted)' }); n.textContent = t; return n; };
    let up = 0; for (let k = 1; k < pts.length; k++) if (pts[k][1] > pts[k - 1][1] + 1e-9) up = k; const flat = up > 0 && last[0] > pts[up][0] + 0.2;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Lượng ${pretty(f)} theo thể tích trong bình`, width: W, height: H, style: 'max-width:100%;flex:none' },
      sv('path', { d: `${d} L${X(last[0]).toFixed(1)},${Y(0)} L${X(0)},${Y(0)} Z`, fill: 'var(--accent-soft)' }), sv('line', { x1: X(0), y1: Y(0), x2: X(xm), y2: Y(0), stroke: 'var(--control-border)', 'stroke-width': 1 }),
      big ? sv('line', { x1: X(0), y1: Y(0), x2: X(0), y2: pt - 4, stroke: 'var(--control-border)', 'stroke-width': 1 }) : null, big ? sv('line', { x1: X(0), y1: Y(ym), x2: X(xm), y2: Y(ym), stroke: 'var(--border)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }) : null,
      sv('path', { d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': big ? 2.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }), sv('circle', { cx: X(last[0]), cy: Y(last[1]), r: big ? 4 : 3, fill: 'var(--accent)' }),
      big ? txt(pl - 7, Y(ym) + 4, fm(ym, 2), 'end') : null, big ? txt(pl - 7, Y(0) + 4, '0', 'end') : null, big ? txt(X(0), H - 18, '0') : null, big ? txt(X(xm), H - 18, `${fm(xm, 1)} mL`, 'end') : null,
      big ? txt((X(0) + X(xm)) / 2, H - 4, 'Tổng thể tích trong bình (mL)') : null, big ? txt(pl - 7, pt - 2, 'mmol', 'end') : null);
    const decreased = last[1] + 1e-9 < ym;
    return { svg, f, mark: q.mark || '', mmol: last[1], flat, decreased }; }

  // ---------- dải kết quả: quan sát · phương trình · đồ thị nhỏ · Chi tiết ----------
  const R = {};
  let viewingHistory = false;
  function renderResultTime() {
    R.eye.textContent = `${viewingHistory ? 'Kết quả hiện tại' : 'Quan sát'} · ${Tn(S.tube)}`;
  }
  { R.eye = el('span', { class: 'eyebrow' }); R.ph = el('strong', {}); R.eq = el('strong', { class: 'equation' }); R.det = btn('secondary', null, 'Chi tiết', { onclick: openDetails }); R.det.append(icon('chevron-right'));
    R.chart = el('div', { class: 'spark', title: 'Lượng sản phẩm theo tổng thể tích trong ống. Bấm Chi tiết để xem bản to.' });
    R.safe = el('p', { class: 'safety-note', role: 'note', hidden: true, style: 'flex:1 1 100%;order:9;margin:0;padding:5px 10px;border-radius:8px;background:#fdf3e2;color:var(--warning);font-size:12.5px;line-height:1.35;font-weight:600' }); // cảnh báo an toàn do máy phản ứng trả về (mục 48): một dòng ở dải kết quả, đủ câu trong Chi tiết
    put($('resultDs'), el('div', { class: 'result-state' }, R.eye, R.ph), R.eq, R.safe, R.chart, R.det); }
  const parts = (ti) => { const L = S.last[ti], ev = (L && L.events) || []; return { L, rx: ev.filter((e) => e.kind === 'reaction'), ind: ev.find((e) => e.kind === 'indicator'), first: ev[0] }; };
  function renderResult() { const ti = S.tube, t = S.tubes[ti], N = S.note[ti], { L, rx, ind, first } = parts(ti); let text, cls = '', eq = [];
    renderResultTime();
    // Một lần thêm có thể có nhiều phản ứng (mục 48): dải kết quả hiện phương trình đầu tiên CÓ HIỆN TƯỢNG,
    // các phương trình còn lại giữ nguyên thứ tự xảy ra và xem đủ trong Chi tiết.
    if (rx.length) { const withEq = rx.filter((e) => e.r.equation); text = cap(seenShort(L.events)); eq = [...withEq.filter(visibleFx), ...withEq.filter((e) => !visibleFx(e))].map((e) => e.r.equation); }
    else if (ind) text = cap(indSay(ind));
    else if (first) { text = first.r.observation || (first.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu'); cls = first.kind === 'none' ? 'none' : 'na'; eq = [`${label(first.a)} + ${label(first.b)}`]; }
    else if (N) text = N.seen;
    else { text = t.vol > 0.001 || Object.keys(t.items).length ? 'Chưa có hiện tượng' : (isCup(ti) ? `${Tn(ti)} trống` : 'Ống trống'); cls = 'none'; }
    R.ph.textContent = text; R.ph.className = cls;
    const sub = eq.length > 1 ? `và ${eq.length - 1} phương trình nữa, xem Chi tiết` : N && first ? `${N.tag}: ${low(N.seen)}` : '';
    put(R.eq, eq.length ? [eq[0], sub ? el('small', {}, sub) : null] : sub ? el('small', {}, sub) : null); R.det.disabled = !first && !N;
    const warn = safetyOf((L && L.events) || []); R.safe.hidden = !warn.length;
    $('resultDs').style.flexWrap = warn.length ? 'wrap' : ''; $('resultDs').style.rowGap = warn.length ? '6px' : ''; // câu cảnh báo nằm thành một dòng riêng dưới phương trình, trong dải kết quả (không đè lên bàn)
    if (warn.length) { R.safe.title = warn.join(' '); R.safe.textContent = /^an toàn/i.test(warn[0]) ? warn[0] : `An toàn: ${warn[0]}`; }
    const c = chart(ti, 150, 44, false); put(R.chart, c ? [c.svg, el('span', {}, el('b', {}, `${pretty(c.f)}${c.mark}`), `${fm(c.mmol, 2)} mmol`, el('small', {}, c.decreased ? 'lượng còn lại sau phản ứng' : c.flat ? 'đã ngừng tăng' : 'theo mL trong ống'))] : null); }
  function openDetails() { const ti = S.tube, N = S.note[ti], { L, rx, ind, first } = parts(ti), out = [];
    if (rx.length) { const made = (e) => { const tot = S.sum[ti][e.r.equation] || e.extent; return e.r.eq ? 'Đã tạo ra ' + e.r.eq.rhs.filter((x) => x.f !== 'H2O').map((x) => `${fm(x.coef * tot * 1000, 2)} mmol ${pretty(x.f)}`).join(' · ') : ''; };
      out.push(sec('Quan sát', cap(seenShort(L.events))));
      const warn = safetyOf(L.events); if (warn.length) out.push(el('div', { style: 'padding:8px 12px;border-radius:10px;background:#fdf3e2;color:var(--warning)' }, el('h3', { style: 'color:inherit' }, 'An toàn'), warn.map((w) => el('p', {}, cap(w.replace(/^an toàn:\s*/i, ''))))));
      out.push(el('div', {}, el('h3', {}, 'Phương trình'), rx.filter((e) => e.r.equation).map((e) => el('p', { class: 'eq' }, e.r.equation, el('small', {}, made(e))))));
      const m = modelOf(ti); if (m && m.usesIons) out.push(el('div', {}, el('h3', {}, 'Phương trình ion thu gọn'), el('p', { class: 'eq' }, m.ionic, m.spect.length ? el('small', {}, `Ion không tham gia: ${m.spect.map((x) => x.label).join(', ')}`) : null)));
      const e2 = rx.find((e) => e.r.eq && e.r.eq.lhs.length > 1); if (e2) out.push(sec('Tỉ lệ mol', ratioText(e2)));
      const c = chart(ti, 440, 190, true); if (c) out.push(el('div', {}, el('h3', {}, `Lượng ${pretty(c.f)}${c.mark} theo thể tích trong ống`), c.svg, el('p', { class: 'note' }, c.decreased ? 'Lượng chất giảm khi bị tiêu hao trong phản ứng.' : c.flat ? 'Lượng chất giữ nguyên ở cuối lần đo.' : 'Trục ngang là tổng thể tích trong ống.')));
      out.push(sec('Vì sao', (L.over ? `${label(L.over.other)} trong ống đã hết: thêm ${label(L.over.id)} nữa không tạo thêm sản phẩm. ` : '') + rx[0].r.reason)); }
    else if (ind) out.push(sec('Chất chỉ thị', cap(indSay(ind)), `pH trong ống khoảng ${fm(ind.pH, 1)}. Phenolphthalein hoá hồng khi pH từ khoảng 8,2 trở lên.`));
    else if (first) out.push(sec(first.r.observation || (first.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu'), `${label(first.a)} + ${label(first.b)}`, first.r.reason));
    if (N) out.push(sec(N.tag === 'Lọc mẫu' ? N.tag : `Phép thử · ${N.tag}`, N.seen, N.why));
    openLayer(`Chi tiết · ${Tn(ti)}`, ...out); }

  setTab(S.cabTab); cabState();
  return {
    render() { cabList(); if (S.cabTab === 'tools') toolList(); renderDose(); renderTubes(); renderResult(); cabState(); },
    hint: renderDose,
    view: renderTubes,
    dose: () => readDose({ focus: true, format: true }),
    replay(active) { viewingHistory = active; renderResultTime(); },
    book() { bookCount.textContent = String(S.log.length); bookBtn.setAttribute('aria-expanded', String(!!S.book)); },
  };
}
