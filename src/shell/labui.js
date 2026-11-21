// Phần giao diện dùng chung cho bài học kiểu "một phòng, nhiều bàn" (kit/labset.js):
// danh sách việc của một bàn với NÚT SINH ĐÔI (mỗi việc tay làm trên bàn có một nút cùng số), bảng kết quả, vùng an toàn của cảnh 3D.
import { h, fmt } from './shell.js';
import { icon } from '../free/icons.js';

// Danh sách việc của bàn bid. Việc kế tiếp sáng lên; việc chưa tới lượt bị khoá; việc có lựa chọn thì hiện các lựa chọn.
export function procList(lab, bid) {
  const P = lab.proc(bid), box = h('ol', { class: 'lk-proc' });
  P.steps.forEach((s) => {
    const cls = 'lk-pstep' + (s.done ? ' is-done' : '') + (s.next ? ' is-next' : '') + (!s.can && !s.done ? ' is-lock' : '');
    box.append(h('li', { class: cls }, h('span', { class: 'lk-pn', text: s.done ? '✓' : String(s.n) }),
      s.range ? amount(lab, bid, s) : s.options
        ? h('div', { class: 'lk-pb' }, h('span', { class: 'lk-pl', text: s.label }),
          h('div', { class: 'lk-seg', role: 'radiogroup', 'aria-label': s.label }, s.options.map((o) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(o.on), class: o.on ? 'is-on' : '', disabled: !s.can || null, onclick: () => lab.act(bid, s.id, o.k) }, o.label))))
        : h('div', { class: 'lk-pb' }, h('button', { class: 'lk-btn' + (s.next ? ' is-pri' : ''), type: 'button', disabled: !s.can || null, onclick: () => lab.act(bid, s.id) }, s.label))));
  });
  if (P.rinse) box.append(h('li', { class: 'lk-pstep is-rinse' + (P.rinse.next ? ' is-next' : '') + (P.rinse.can ? '' : ' is-lock') }, h('span', { class: 'lk-pn', text: '↺' }),
    h('div', { class: 'lk-pb' }, h('button', { class: 'lk-btn' + (P.rinse.next ? ' is-pri' : ''), type: 'button', disabled: !P.rinse.can || null, onclick: () => lab.rinse(bid) }, P.rinse.label))));
  const state = P.busy ? 'Đang thao tác trên bàn…' : P.run && !P.run.done ? 'Đang phản ứng: nhìn dụng cụ đo.' : P.run ? 'Xong một lần chạy. Rửa dụng cụ để thử điều kiện khác.' : '';
  return [box, state && h('p', { class: 'lk-pstate', text: state })];
}

// ---------- THẺ HÌNH (visual card): mỗi thẻ có một hình (icon nét Lucide trong ô bo góc, hoặc ảnh chụp cảnh 3D) + nhãn + giá trị. Không dùng ô chỉ có chữ. ----------
// Icon bổ sung theo cùng lưới 24 × 24, nét 2, đầu tròn (bộ icon chung chưa có đồng hồ bấm giây).
const EXTRA = { timer: '<path d="M10 2h4" /><path d="M12 14l3-3" /><circle cx="12" cy="14" r="8" />' };
export function uiIcon(name, size) { const s = icon(name, size); if (!s.innerHTML && EXTRA[name]) s.innerHTML = EXTRA[name]; return s; }
// Chọn icon theo nhãn của thẻ: [mẫu chữ, tên icon, lớp phụ]
const ICON_BY = [[/thí nghiệm/i, 'flask-conical', 'is-exp'], [/đối chứng/i, 'flask-conical', 'is-ref'], [/nhanh gấp/i, 'sparkles'], [/đồng hồ|đo bằng/i, 'timer'], [/tốc độ|độ nhanh/i, 'sliders-horizontal'],
  [/nửa|khí|O₂/i, 'wind'], [/số hạt/i, 'circle-dot'], [/năng lượng/i, 'flame'], [/viên/i, 'droplet'], [/mỗi bàn/i, 'flask-conical'], [/đã xem|tới gần/i, 'scan']];
// Thẻ số đo: ô icon + nhãn ở hàng trên, giá trị đậm ở hàng dưới. set(nhãn, giá trị) chỉ vẽ lại phần đổi.
export function vcard() {
  const ic = h('span', { class: 'lk-vic' }), label = h('span', { class: 'lk-vl' }), value = h('b', { class: 'lk-vv' }), el = h('div', { class: 'lk-vcard' }, h('div', { class: 'lk-vh' }, ic, label), value);
  let last = null;
  return { el, set(l, v) {
    if (l !== last) { last = l; label.textContent = l; const m = ICON_BY.find(([re]) => re.test(l)) || [0, 'info']; ic.replaceChildren(uiIcon(m[1])); el.className = 'lk-vcard' + (m[2] ? ' ' + m[2] : ''); }
    if (value.textContent !== v) value.textContent = v;
  } };
}
// Thẻ một bàn (bước xem cả phòng): ảnh chụp bàn trong cảnh 3D + tên + điều kiện + dấu đã xem
// on = bàn đang được chọn (chỉ thẻ này sáng lên); done = bàn đã xem (chỉ còn dấu tích nhỏ, thẻ không sáng). Chủ 20/11: "tích vào cái nào cái ấy sáng thôi".
export function benchCard({ name, text, color, done, on, thumb, onPick }) {
  return h('li', { class: 'lk-bcard' + (done ? ' is-done' : '') + (on ? ' is-on' : '') }, h('button', { type: 'button', onclick: onPick, 'aria-label': 'Tới gần ' + name, 'aria-pressed': on ? 'true' : 'false' },
    thumb ? h('img', { class: 'lk-bthumb', src: thumb, alt: '' }) : h('span', { class: 'lk-bthumb' }),
    h('span', { class: 'lk-btext' }, h('b', {}, h('i', { style: `background:${color}` }), name), h('small', { text })),
    h('span', { class: 'lk-bck', text: done ? '✓' : '' })));
}

// Việc có LƯỢNG TỰ CHỌN: thanh kéo + ô nhập số (dấu phẩy hay dấu chấm đều được) + nút làm việc đó với đúng con số đang đặt + nút về mức của bài.
// Con số chỉ bị chặn bởi sức chứa của dụng cụ (range.min, range.max do giáo án khai theo dụng cụ trên bàn).
function amount(lab, bid, s) {
  const R = s.range, show = (v) => fmt(v, R.digits || 0), off = !s.can || null;
  const btn = h('button', { class: 'lk-btn' + (s.next ? ' is-pri' : ''), type: 'button', disabled: off, onclick: () => lab.act(bid, s.id) });
  const range = h('input', { type: 'range', class: 'lk-range', min: R.min, max: R.max, step: R.step, value: R.want, 'aria-label': s.label, disabled: off });
  const num = h('input', { type: 'text', inputmode: 'decimal', class: 'lk-amt-num', value: show(R.want), 'aria-label': s.label + ', nhập số', disabled: off });
  const back = h('button', { class: 'lk-amt-back', type: 'button', disabled: off, onclick: () => set(R.ref) }, `Về mức của bài: ${show(R.ref)} ${R.unit}`);
  function set(v, from) {
    const w = lab.setWant(bid, s.id, v);
    if (from !== 'range') range.value = w; if (from !== 'num') num.value = show(w);
    btn.textContent = `${R.act || 'Lấy'} ${show(w)} ${R.unit}${R.per || ''}`; back.hidden = w === R.ref;
  }
  range.addEventListener('input', () => set(Number(range.value), 'range'));
  num.addEventListener('change', () => { const v = Number(String(num.value).trim().replace(',', '.')); set(Number.isFinite(v) ? v : R.want); });
  num.addEventListener('keydown', (e) => { if (e.key === 'Enter') num.blur(); });
  set(R.want);
  return h('div', { class: 'lk-pb' }, h('span', { class: 'lk-pl', text: s.label + (R.value != null ? ` (đang có ${show(R.value)} ${R.unit})` : '') }),
    h('div', { class: 'lk-amt' }, range, num, h('em', { text: R.unit })),
    h('div', { class: 'lk-amt-ends' }, h('span', { text: `${show(R.min)} ${R.unit}` }), h('span', { text: R.limit || `tối đa ${show(R.max)} ${R.unit}` })),
    btn, back);
}

// Bảng kết quả: mỗi lần chạy một dòng. cols = 4 tiêu đề cột; rows = [{ cond, exp, ref, ratio }]
export function resultTable(rows, cols) {
  if (!rows.length) return h('p', { class: 'lk-msg', text: 'Chưa có lần chạy nào. Mỗi lần chạy xong sẽ thành một dòng ở đây.' });
  return h('table', { class: 'lk-table' }, h('thead', {}, h('tr', {}, cols.map((c) => h('th', { text: c })))),
    h('tbody', {}, rows.map((r) => h('tr', {}, h('td', { text: r.cond }), h('td', { text: r.exp }), h('td', { text: r.ref }), h('td', { text: r.ratio })))));
}

// Vùng an toàn: phần cảnh 3D không bị thẻ "Bước này" và "Bảng điều khiển" che. bottom() = số điểm ảnh bị thẻ ở đáy che.
// Trả về hàm sync() để gọi lại khi thẻ đổi cỡ.
export function bindSafeArea(shell, stage, bottom = () => 0) {
  const wide = matchMedia('(min-width:900px)'), el = shell.els.stage;
  // BA CỘT (bản 3, từ 1200 px; chủ duyệt mockup 21/11): cảnh chỉ nằm ở cột giữa nên không còn bảng nào nằm trên cảnh (shell_ds.css). Thẻ phương trình rời khỏi cảnh,
  // thành một dải ngay dưới cảnh (lớp is-strip); dưới 1200 px thẻ trở lại nằm trong cảnh như trước. Bản 2 không có lớp is-v3 nên không đổi gì.
  const cols = matchMedia('(min-width:1200px)'), main = el.parentElement, v3 = !!el.closest('.ds.is-v3');
  function placeEq() {
    const eq = v3 && main.querySelector('.lk-eqcard'); if (!eq) return false;
    const out = cols.matches; if (out !== (eq.parentElement === main)) { (out ? main : el).append(eq); eq.classList.toggle('is-strip', out); }
    return out;
  }
  function sync() {
    const eqOut = placeEq(); // thẻ phương trình đang nằm ngoài cảnh thì cảnh không phải chừa đáy cho thẻ
    const s = el.getBoundingClientRect(); if (!s.width || !s.height) return;
    let l = 0, r = 0;
    if (wide.matches) [shell.els.card, shell.els.panel].forEach((box) => {
      const b = box.getBoundingClientRect();
      if (!b.width || b.bottom <= s.top || b.top >= s.bottom || b.right <= s.left || b.left >= s.right) return;
      if (b.left - s.left < s.right - b.right) l = Math.max(l, (b.right - s.left) / s.width); else r = Math.max(r, (s.right - b.left) / s.width);
    });
    el.style.setProperty('--safe-l', (l * 100).toFixed(2) + '%'); el.style.setProperty('--safe-r', (r * 100).toFixed(2) + '%');
    // Đang phóng to (lớp is-zoomed do zoomBox đặt) thì thẻ ở đáy thu gọn: giữ nguyên phần đáy đã dành, để khung hình không giật khi thẻ đổi cỡ
    const zoomed = !eqOut && el.classList.contains('is-zoomed') && last.b, px = zoomed || eqOut ? 0 : bottom();
    const e = zoomed ? last.b : px ? Math.min(0.26, Math.ceil(((px + 22) / el.clientHeight) * 25) / 25) : 0.03; // làm tròn lên theo nấc 4%: thẻ ở đáy đổi cao vài điểm ảnh thì khung hình không nhúc nhích
    // Lề bên cạnh bảng nổi: SIDE điểm ảnh (tay nắm thu gọn thò ra 13 px + khoảng thở), để món ở mép bàn (lọ hoá chất phải chạm đầu tiên) không nằm sát hay chui dưới bảng.
    // Đỉnh: dải TOP điểm ảnh dành cho cụm zoom và dòng báo; nhãn dụng cụ không lên dải này.
    const side = SIDE / s.width;
    last = { l: l ? l + side : 0, r: r ? r + side : 0, t: Math.max(0.07, TOP / el.clientHeight), b: e };
    stage.insets = last; // kit/labset.js đọc để xếp nhãn dụng cụ trong đúng phần cảnh không bị che
    stage.setInsets(last);
  }
  const SIDE = 28, TOP = 48;
  let last = { l: 0, r: 0, t: 0, b: 0 }; sync.insets = () => ({ ...last }); // vùng an toàn hiện tại, để cắt ảnh chụp cảnh cho đúng phần không bị thẻ che
  const ro = new ResizeObserver(sync); [el, shell.els.card, shell.els.panel].forEach((x) => ro.observe(x));
  wide.addEventListener('change', sync); cols.addEventListener('change', sync);
  return sync;
}

// NÚT THU GỌN hai bảng nổi (chủ 20/11: "bên cạnh cần có kiểu nút cuộn vào ở 2 bảng này"). Mỗi bảng một tay nắm ở mép trong; bấm thì bảng thu vào mép,
// cảnh 3D lấy lại chỗ (vùng an toàn tự tính lại vì bảng ẩn không còn bề rộng), bấm lần nữa thì bảng hiện lại. Chỉ có ở màn từ 900 px.
export function tuckHandles(shell, onChange = () => {}) {
  const main = shell.els.stage.parentElement;
  const mk = (side, box, name) => {
    const b = h('button', { class: 'lk-tuck is-' + side, type: 'button', onclick: () => set(!box.classList.contains('is-tucked')) });
    function set(on) {
      box.classList.toggle('is-tucked', on); b.classList.toggle('is-on', on); main.classList.toggle('is-tuck-' + side, on); // lớp trên khung chính: bố cục ba cột thu cột đó thành dải hẹp b.textContent = (side === 'l') === on ? '›' : '‹';
      const t = (on ? 'Mở bảng ' : 'Thu gọn bảng ') + name; b.title = t; b.setAttribute('aria-label', t); b.setAttribute('aria-expanded', String(!on)); onChange();
    }
    set(false); main.append(b); return set;
  };
  return { left: mk('l', shell.els.card, 'Bước này'), right: mk('r', shell.els.panel, 'Bảng điều khiển') };
}

// THANH MỨC ZOOM (chủ 21/11: "thêm cái hiển thị zoom ... các mức độ như bên lap 2"): − · số phần trăm · +. 100% = khung chuẩn của bàn đang xem;
// bấm vào con số thì về khung chuẩn. Cuộn chuột phóng vào đúng chỗ con trỏ; Shift + kéo (hoặc kéo chuột phải, hai ngón) để dời khung.
export function zoomBox(lab, host) {
  const pct = h('button', { class: 'lk-zm-pct', type: 'button', title: 'Về khung chuẩn (100%)', 'aria-label': 'Mức phóng, bấm để về khung chuẩn', onclick: () => lab.zoomReset() }, '100%');
  const box = h('div', { class: 'lk-zm', role: 'group', 'aria-label': 'Phóng to, thu nhỏ', title: 'Cuộn chuột: phóng vào chỗ con trỏ · Shift + kéo: dời khung' },
    h('button', { type: 'button', 'aria-label': 'Thu nhỏ', title: 'Thu nhỏ', onclick: () => lab.zoomBy(1 / 1.35) }, '−'), pct,
    h('button', { type: 'button', 'aria-label': 'Phóng to', title: 'Phóng to', onclick: () => lab.zoomBy(1.35) }, '+'));
  const hint = h('span', { class: 'lk-zm-hint' }); // kéo chuột lúc này làm gì: đổi theo mức zoom
  // MỘT CỤM ở góc trên phải của phần cảnh không bị bảng che (21/11): dòng nhắc · nút "Về góc chuẩn" · thanh zoom, nằm gọn trong dải đỉnh mà nhãn dụng cụ không lên tới.
  // Nút "Về góc chuẩn" do bài học tạo sẵn trong cảnh (lớp lk-reset): chỉ dời nó vào cụm, bài học vẫn tự bật tắt như cũ. Dưới 900 px cụm không có khung riêng (display: contents), ba món nằm như trước.
  const bar = h('div', { class: 'lk-zmbar' }, hint, box), reset = host.querySelector('.lk-reset');
  if (reset) { reset.title = 'Về khung chuẩn của bàn đang xem'; bar.insertBefore(reset, box); }
  host.append(bar);
  const sizeBar = () => host.style.setProperty('--zmbar-w', bar.offsetWidth + 'px'); // dòng báo ở đỉnh cảnh chừa đúng bề ngang của cụm
  new ResizeObserver(sizeBar).observe(bar); sizeBar();
  let shown = '', mode = '';
  lab.stage.onFrame(() => {
    const t = lab.zoomPct() + '%'; if (t !== shown) { shown = t; pct.textContent = t; }
    const m = lab.dragMode(); if (m !== mode) {
      mode = m; hint.textContent = m === 'pan' ? 'Kéo để dời khung · Shift + kéo để xoay' : 'Kéo để xoay · cuộn để phóng to';
      host.classList.toggle('is-zoomed', m === 'pan'); // đã phóng từ 130%: thẻ phương trình ở đáy thu thành một dòng (shell_ds.css), trả chỗ cho dụng cụ
    }
  });
  host.addEventListener('selectstart', (e) => e.preventDefault()); // kéo xoay cảnh không bôi đen chữ ở hai bảng bên cạnh
  return box;
}

