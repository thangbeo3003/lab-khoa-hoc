// ĐỒ THỊ "% NH₃ theo nhiệt độ" của sa bàn Haber (CHEM11-04). Tài liệu STEMLabs yêu cầu có biểu đồ theo K(T) (docs/research/hoa-hoc.md, mục "Đại lượng hiển thị").
// Hai đường cùng một trục phần trăm: "lúc cân bằng" (tính từ K(T), nét liền) và "sau 60 giây" (mô hình tốc độ của bài, nét đứt). Chấm = từng lần chạy của học sinh.
// Đường "sau 60 giây" có một đỉnh ở khoảng giữa: đó là lời đáp cho câu hỏi của bài (lạnh thì lợi cân bằng nhưng chậm, nóng thì nhanh nhưng cân bằng kém).
// Phần tính và phần vẽ ra chuỗi SVG không đụng trang (chạy được bằng Node); createChart mới gắn vào trang.
import { run, Kp, RANGE, BOOK, RUN_S, pct } from './mo_hinh.js';

export const COLOR = { eq: '#6254f4', out: '#c2620a' }; // cặp màu đã qua bộ kiểm mù màu (nền trắng); đường thứ hai còn khác bằng nét đứt
const INK = '#090a2b', MUTED = '#666878', GRID = '#e7e6ee';
// Khung vẽ lấy đúng bề ngang thật của thẻ (một đơn vị = một điểm ảnh) để chữ không bị co nhỏ khi thẻ hẹp
const H = 140, L = 37, R = 12, TOP = 12, BOT = 24, PH = H - TOP - BOT;
const [T0, T1] = RANGE.T;
const Y = (v) => TOP + (1 - Math.max(0, Math.min(1, v))) * PH;
const geo = (W) => { const PW = W - L - R; return { W, PW, X: (T) => L + ((T - T0) / (T1 - T0)) * PW }; };
const n1 = (v) => v.toFixed(1);
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

// Một lần chạy nằm đúng trên đường đang vẽ khi mọi cài đặt khác nhiệt độ đều giống cài đặt hiện tại
export const same = (row, c) => row.p === c.p && row.r === c.r && !!row.cat === !!c.cat && !!row.sep === !!c.sep && row.rec === c.rec;
// Hai đường: mỗi 10 °C một điểm, dùng đúng hàm run() của mô hình nên chấm của lần chạy luôn rơi trên đường
export function curves(c) { const pts = []; for (let T = T0; T <= T1; T += 10) { const r = run({ ...c, T }); pts.push({ T, eq: r.eq, out: r.out }); } return pts; }
export const at = (pts, T) => pts[Math.max(0, Math.min(pts.length - 1, Math.round((T - T0) / 10)))];
export function kText(T) { const k = Kp(T), e = Math.floor(Math.log10(k)), m = k / 10 ** e; return `${m.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} × 10${String(e).split('').map((ch) => SUP[ch]).join('')}`; }

const path = (pts, key, X) => pts.map((p, i) => `${i ? 'L' : 'M'}${n1(X(p.T))} ${n1(Y(p[key]))}`).join('');
const text = (x, y, s, o = '') => `<text x="${n1(x)}" y="${n1(y)}" ${o}>${s}</text>`;

// c = cài đặt đang đặt { T, p, r, cat, sep, rec }; rows = các lần chạy; rate = có vẽ đường "sau 60 giây" hay chưa (bước đầu để học sinh tự chạy ra rồi mới hiện)
export function chartSVG(c, rows, { rate = true, width = 300 } = {}) {
  const { W, X } = geo(Math.max(200, Math.round(width))), pts = curves(c), now = at(pts, c.T), out = [];
  out.push(`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Đồ thị phần trăm NH₃ theo nhiệt độ ở ${c.p} bar" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="10.5" fill="${MUTED}">`);
  out.push(`<rect x="${n1(X(BOOK.T[0]))}" y="${TOP}" width="${n1(X(BOOK.T[1]) - X(BOOK.T[0]))}" height="${PH}" fill="#157347" opacity="0.09"/>`);
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => { out.push(`<line x1="${L}" x2="${W - R}" y1="${n1(Y(v))}" y2="${n1(Y(v))}" stroke="${GRID}" stroke-width="1"/>`, text(L - 5, Y(v) + 3.5, v === 1 ? '100 %' : String(v * 100), 'text-anchor="end"')); });
  for (let T = T0; T <= T1; T += 100) out.push(text(X(T), H - 8, T === T1 ? `${T} °C` : String(T), `text-anchor="${T === T1 ? 'end' : 'middle'}"${T === T1 ? ` dx="${R - 2}"` : ''}`));
  out.push(text((X(BOOK.T[0]) + X(BOOK.T[1])) / 2, TOP + 10, 'sách', 'text-anchor="middle" fill="#157347" font-weight="600"'));
  out.push(`<path d="${path(pts, 'eq', X)}" fill="none" stroke="${COLOR.eq}" stroke-width="2" stroke-linejoin="round"/>`);
  if (rate) out.push(`<path d="${path(pts, 'out', X)}" fill="none" stroke="${COLOR.out}" stroke-width="2" stroke-dasharray="5 3" stroke-linejoin="round"/>`);
  // Tên đường ghi ngay cạnh đường, mực chữ thường. Tên đường cân bằng né phía vạch nhiệt độ đang đặt.
  const eT = c.T < 420 ? 540 : 250, eP = at(pts, eT);
  out.push(text(X(eT) + 5, Math.max(TOP + 9, Y(eP.eq) - 7), 'lúc cân bằng', `fill="${INK}" font-weight="600"`));
  if (rate) {
    // Đỉnh cao thì ghi tên dưới đỉnh (trong lòng đường cong). Đỉnh thấp (áp suất thấp, hoặc đã rút Fe) thì ghi ở góc trái dưới, ngay trên đoạn đường còn nằm sát trục.
    const pk = pts.reduce((a, p) => (p.out > a.out ? p : a), pts[0]), room = TOP + PH - Y(pk.out), lo = at(pts, 240);
    if (room >= 34) out.push(text(Math.max(L + 34, Math.min(W - R - 34, X(pk.T))), Y(pk.out) + 17, `sau ${RUN_S} giây`, `text-anchor="middle" fill="${INK}" font-weight="600"`));
    else out.push(text(X(228), Y(lo.out) - 8, `sau ${RUN_S} giây`, `fill="${INK}" font-weight="600"`));
  }
  out.push(`<line x1="${n1(X(c.T))}" x2="${n1(X(c.T))}" y1="${TOP}" y2="${TOP + PH}" stroke="${INK}" stroke-opacity="0.38" stroke-width="1" stroke-dasharray="2 3"/>`);
  rows.forEach((r) => { const on = same(r, c); out.push(`<circle cx="${n1(X(r.T))}" cy="${n1(Y(r.out))}" r="${on ? 4.5 : 3.6}" fill="${on ? COLOR.out : '#fff'}" stroke="${on ? '#fff' : COLOR.out}" stroke-width="2"/>`); });
  out.push(`<circle cx="${n1(X(c.T))}" cy="${n1(Y(now.eq))}" r="4.5" fill="${COLOR.eq}" stroke="#fff" stroke-width="2"/>`);
  out.push(`<line class="sb-cross" x1="0" x2="0" y1="${TOP}" y2="${TOP + PH}" stroke="${INK}" stroke-width="1" visibility="hidden"/>`);
  out.push('</svg>');
  return out.join('');
}

// Gắn vào trang. get() trả về { c, rows, rate }. draw() rẻ: chỉ vẽ lại khi cài đặt, số lần chạy hoặc chế độ đổi.
export function createChart(get) {
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const el = mk('figure', 'sb-chart'), title = mk('figcaption', 'sb-chart-title'), legend = mk('div', 'sb-chart-legend'), plot = mk('div', 'sb-chart-plot'), tip = mk('div', 'sb-chart-tip'), cap = mk('p', 'sb-note');
  tip.hidden = true; plot.append(tip); el.append(title, legend, plot, cap);
  let sig = '', pts = [], st = null, svg = null, G = geo(300);
  const swatch = (color, dash) => { const i = mk('i'); i.style.cssText = `border-top:2px ${dash ? 'dashed' : 'solid'} ${color}`; return i; };
  const dot = (fill, ring) => { const i = mk('i', 'is-dot'); i.style.cssText = `background:${fill};box-shadow:0 0 0 2px ${ring}`; return i; };
  const item = (mark, label) => { const s = mk('span'); s.append(mark, label); return s; };
  function draw() {
    st = get(); const { c, rows, rate } = st, width = plot.clientWidth || 300, k = JSON.stringify([c, rows.length, rate, width]); if (k === sig) return; sig = k;
    G = geo(Math.max(200, Math.round(width))); pts = curves(c); if (svg) svg.remove(); plot.insertAdjacentHTML('afterbegin', chartSVG(c, rows, { rate, width })); svg = plot.querySelector('svg');
    title.textContent = `% NH₃ theo nhiệt độ · ${c.p} bar${c.cat ? '' : ' · không có Fe'}`;
    legend.replaceChildren(item(swatch(COLOR.eq), 'lúc cân bằng'), rate ? item(swatch(COLOR.out, true), `sau ${RUN_S} giây`) : '', rows.length ? item(dot(COLOR.out, '#fff'), rate ? 'em đã chạy' : `em đã chạy (sau ${RUN_S} giây)`) : '', rows.some((r) => !same(r, c)) ? item(dot('#fff', COLOR.out), 'chạy ở cài đặt khác') : '');
    cap.textContent = rate ? `Hằng số cân bằng K ở ${c.T} °C = ${kText(c.T)}` : `Hằng số cân bằng K ở ${c.T} °C = ${kText(c.T)}`;
  }
  // Rê chuột hoặc chạm: vạch dọc và ô số ở nhiệt độ đó
  const move = (e) => {
    if (!svg || !st) return; const { W, PW, X } = G, b = svg.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W;
    const T = Math.max(T0, Math.min(T1, Math.round((T0 + ((x - L) / PW) * (T1 - T0)) / 10) * 10)), p = at(pts, T), cross = svg.querySelector('.sb-cross');
    cross.setAttribute('x1', n1(X(T))); cross.setAttribute('x2', n1(X(T))); cross.setAttribute('visibility', 'visible');
    const hit = st.rows.filter((r) => r.T === T).pop();
    tip.replaceChildren(mk('b', '', `${T} °C`), mk('span', '', `cân bằng ${pct(p.eq)}`), st.rate ? mk('span', '', `sau ${RUN_S} giây ${pct(p.out, p.out < 0.02 ? 1 : 0)}`) : hit ? mk('span', '', `em đã chạy: ${pct(hit.out, hit.out < 0.02 ? 1 : 0)}`) : '');
    tip.hidden = false; const left = (X(T) / W) * b.width; tip.style.left = `${Math.max(4, Math.min(b.width - tip.offsetWidth - 4, left + (T > 480 ? -tip.offsetWidth - 8 : 8)))}px`;
  };
  const leave = () => { tip.hidden = true; const cross = svg && svg.querySelector('.sb-cross'); if (cross) cross.setAttribute('visibility', 'hidden'); };
  plot.addEventListener('pointermove', move); plot.addEventListener('pointerdown', move); plot.addEventListener('pointerleave', leave);
  draw();
  return { el, draw };
}

export const CHART_CSS = `
.sb-chart { margin:8px 0 0; max-width:440px; } .sb-chart .sb-note { margin-top:2px; }
.sb-chart-title { font-size:12px; line-height:16px; font-weight:600; color:var(--text,#090a2b); }
.sb-chart-legend { display:flex; flex-wrap:wrap; gap:2px 10px; margin:3px 0 2px; font-size:11px; line-height:15px; color:var(--muted,#666878); }
.sb-chart-legend span { display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
.sb-chart-legend i { display:inline-block; width:16px; height:0; }
.sb-chart-legend i.is-dot { width:7px; height:7px; border-radius:50%; margin:0 3px; }
.sb-chart-plot { position:relative; touch-action:pan-y; }
.sb-chart .sb-chart-plot svg { display:block; width:100%; height:auto; }
.sb-chart-tip { position:absolute; top:2px; display:grid; gap:0; padding:4px 7px; border-radius:6px; background:#090a2be8; color:#fff; font-size:11px; line-height:15px; pointer-events:none; white-space:nowrap; font-variant-numeric:tabular-nums; }
.sb-chart-tip b { font-weight:600; }
@media (min-width:900px) { .sb-card .lk-cardfoot { position:sticky; bottom:-12px; z-index:1; margin:8px -12px -12px; padding:8px 12px 10px; background:var(--card,#fff); border-top:1px solid var(--border,#e7e6ee); flex-wrap:nowrap; gap:6px; }
  .ds .sb-card .lk-cardfoot .lk-btn { min-height:32px; height:32px; padding:0 10px; font-size:12.5px; white-space:nowrap; } }
.sb-seg { display:inline-flex; margin:8px 0 0; border:1px solid var(--border,#e7e6ee); border-radius:8px; overflow:hidden; }
.sb-seg button { border:0; background:transparent; padding:4px 10px; font:600 12px/16px inherit; font-family:inherit; color:var(--muted,#666878); cursor:pointer; }
.sb-seg button[aria-pressed="true"] { background:var(--accent,#6254f4); color:#fff; }
`;
