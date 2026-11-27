// GIÁO ÁN bài "Nhóm halogen" (Hoá 10 · Chương 7 · Bài 21 · mã CHEM10-05). Nội dung theo DEFINE.md (mục 3, bổ sung 3b ngày 26/11), dữ kiện theo facts.md (D1 đến D12).
// Tệp này CHỈ gọi bảng lệnh B (xem đầu kit/labset.js), không chạm vật thể 3D: bộ máy 2D đọc cùng tệp này.
// Kết quả của từng ống (màu, kết tủa, có phản ứng hay không, phương trình, lời an toàn) lấy từ KHO HOÁ HỌC dùng chung (free/tubechem.js), không viết cứng.
// Bàn 1 (điều chế chlorine) chỉ là hoạt cảnh: KHÔNG hiện khối lượng, thể tích, số giọt hay tỉ lệ pha chế (facts.md mục 3).
// Lệnh B mới 26/11 (pipe, ppt, home, undo, vessel.mL) gọi kiểu ?.( : bộ máy 2D chưa có thì bỏ qua, không vỡ trang.
// Thao tác theo LUAT_THAO_TAC.md (DEFINE 3c): lọ có ống hút (T1, T2), lọ nước cất nhỏ thật vào ống đối chứng (T11), cốc thải và rửa đúng thứ tự (T8), cận cảnh (H1, H2), giá gỗ và chậu như 2D (H7).
// Mỗi bàn đủ 6 chức năng như bài mẫu (DEFINE 3b): 1 Chuẩn bị · 2 Chọn điều kiện · 3 Khởi động · 4 Quan sát · 5 Ghi (lesson.js ghi dòng kết quả từ B.data.last) · 6 Làm lại.
import { newTube, add, look, DROP_ML } from '../../free/tubechem.js';

export const meta = {
  id: 'h10_nhom_halogen',
  grade: 'Hoá 10',
  book: { code: 'CHEM10-05', series: 'Kết nối tri thức', chapter: 7, chapterTitle: 'Nguyên tố nhóm halogen', lesson: 21, lessonTitle: 'Nhóm halogen', pages: '110' },
  title: 'Nhóm halogen: ai đẩy được ai?',
  equation: 'Cl₂ > Br₂ > I₂',
  layout: 'full',
  chain: [
    ['Điều chế', 'Cl₂ trong tủ hút'],
    ['Đẩy ra khỏi muối', 'halogen mạnh đẩy halogen yếu'],
    ['Nhìn vào trong', 'lấy electron'],
    ['An toàn', 'khí độc phải được chặn'],
  ],
  mainQuestion: 'Cùng là halogen, vì sao Cl₂ đẩy được Br₂ và I₂ ra khỏi muối, còn I₂ thì không đẩy được ai?',
  disclaimer: 'Bản thử nghiệm, chưa có giáo viên duyệt. Hiện tượng ở các ống nghiệm do kho hoá học của Lab tính, theo Chemguide "Halogens as oxidising agents". Sắc độ trên màn hình mang tính minh họa. Phần điều chế đang chờ đối chiếu chuyên môn. Phần điều chế chỉ mô phỏng, không ghi lượng hoá chất.',
};

// Lời chốt cuối bài (DEFINE mục 1)
export const SUMMARY = 'Tính oxi hoá giảm dần: Cl₂ > Br₂ > I₂. Halogen mạnh hơn lấy electron của ion halide yếu hơn và đẩy nó ra khỏi muối. Khí Cl₂ độc: chỉ điều chế trong tủ hút, khí thừa cho đi qua dung dịch kiềm.';
// Lời an toàn (facts.md mục 3)
export const SAFETY = 'An toàn: Cl₂ và Br₂ rất độc, gây bỏng; HCl đặc ăn mòn; KMnO₄ là chất oxi hoá mạnh. Ngoài đời chỉ làm trong tủ hút và luôn có cốc NaOH hấp thụ khí thừa. Ở đây chỉ mô phỏng.';

// goal (chặng 2 bố cục v3, 27/11): MỘT câu mục tiêu hiện ở bảng trái, nói đủ điều kiện "Đã làm". todo: cách làm đầy đủ, nằm sau nút "Xem thêm"; danh sách việc đánh số ở bảng phải mới là chỗ dẫn từng thao tác.
export const steps = [
  { short: 'Xem cả phòng', bench: null, link: [0, 1, 2, 3],
    q: 'Cl₂, Br₂ và I₂ cùng thuộc nhóm halogen. Quan sát nào giúp em xếp chúng theo tính oxi hoá?',
    todo: 'Kéo để xoay nhìn quanh phòng, hoặc chạm vào một bàn để tới gần xem bàn đó có gì.',
    goal: 'Xoay nhìn quanh phòng, hoặc chạm một bàn để tới gần.' },
  { short: 'Điều chế Cl₂', bench: 'prep', link: 0,
    bridge: 'Từ toàn cảnh, em đến bàn có tủ hút để quan sát Cl₂ ở trạng thái khí trong mô phỏng.',
    q: 'Khí Cl₂ độc. Muốn có nó để thí nghiệm thì phải làm ở đâu và chặn khí thừa bằng gì?',
    todo: 'Nối ống theo dòng khí: bình cầu → bình rửa khí → bình thu → cốc NaOH. Bật quạt tủ hút, chọn tốc độ nhỏ HCl đặc, mở khoá phễu. Chạy đủ hai tốc độ (giữa hai lần bấm Làm lại).',
    goal: 'Nối ống, bật quạt tủ hút, rồi chạy đủ hai tốc độ nhỏ HCl đặc.' },
  { short: 'Cl₂ gặp NaBr', bench: 'cl', link: 1,
    bridge: 'Bàn trước cho thấy Cl₂ ở dạng khí. Bàn này có sẵn nước Cl₂ để thử với NaBr. Mẫu khí ở bàn trước vẫn ở nguyên đó.',
    q: 'Nhỏ nước Cl₂ vào dung dịch NaBr không màu thì có gì đổi không?',
    todo: 'Lấy 2 mL dung dịch NaBr bằng ống hút vào ống đối chứng và ống thí nghiệm. Chọn số giọt nước Cl₂ rồi nhỏ vào ống thí nghiệm; nhỏ đúng chừng ấy giọt nước cất vào ống đối chứng. So hai ống.',
    goal: 'Nhỏ nước Cl₂ vào ống thí nghiệm, nước cất vào ống đối chứng, rồi so hai ống.' },
  { short: 'Cl₂ gặp KI', bench: 'cl', link: 1,
    bridge: 'Để so với kết quả của NaBr, em tiếp tục dùng nước Cl₂. Lần này, hai ống mới chứa dung dịch KI.',
    q: 'Với KI thì sao, và làm sao chắc chắn chất sinh ra là I₂?',
    todo: 'Lấy 2 mL KI vào hai ống, nhỏ nước Cl₂ vào ống thí nghiệm và nước cất vào ống đối chứng. Chạy ít nhất hai mức: một lần nhỏ ít (dung dịch đỏ nâu), làm lại (đổ vào cốc thải, rửa ở vòi), một lần nhỏ dư (có kết tủa xám đen). Thử hồ tinh bột một lần.',
    goal: 'Chạy hai mức với dung dịch KI: một lần nhỏ ít, một lần nhỏ dư. Rồi thử hồ tinh bột.' },
  { short: 'Br₂ thử sức', bench: 'bri', link: 1,
    bridge: 'Giữ KI làm điểm so sánh với bước trước. Trên bàn mới, em dùng nước Br₂ thay cho nước Cl₂.',
    q: 'Br₂ có đẩy được I₂ ra khỏi KI không? Có đẩy được Cl₂ ra khỏi NaCl không?',
    todo: 'Lấy 2 mL nước cất vào ống so màu, 2 mL KI vào ống 1 và 2 mL NaCl vào ống 2 bằng ống hút. Chọn số giọt nước Br₂ rồi nhỏ vào từng ống, rồi nhỏ cùng số giọt đó vào ống so màu để so: màu giống ống so màu là không phản ứng.',
    goal: 'Nhỏ nước Br₂ vào ống KI và ống NaCl, rồi so từng ống với ống so màu.' },
  { short: 'I₂ thử sức', bench: 'bri', link: 1,
    bridge: 'Hai hàng đầu của bảng dành cho Cl₂ và Br₂. Em thử nước I₂ với các ống mới để điền hàng cuối và so sánh cả ba.',
    q: 'Còn I₂, nó đẩy được ai?',
    todo: 'Lấy 2 mL nước cất vào ống so màu, 2 mL NaBr vào ống 3 và 2 mL NaCl vào ống 4. Nhỏ nước I₂ vào từng ống, rồi cùng số giọt vào ống so màu. Rồi đặt ba lọ Cl₂, Br₂, I₂ lên kệ theo thứ tự mạnh nhất → yếu nhất.',
    goal: 'Nhỏ nước I₂ vào ống NaBr và ống NaCl, rồi xếp ba lọ theo thứ tự mạnh đến yếu.' },
  { short: 'Nhìn vào trong', bench: 'tv', link: 2,
    bridge: 'Dùng hai ô trong bảng kết quả, một có phản ứng và một không đổi. Mô hình hạt giúp em giải thích sự khác nhau đó.',
    q: 'Bên trong ống nghiệm, "đẩy ra khỏi muối" thật ra là chuyện gì?',
    todo: 'Xem lần lượt hai cặp trên tivi: Cl₂ gặp Br⁻, rồi I₂ gặp Br⁻.',
    goal: 'Xem hai cặp trên tivi: Cl₂ gặp Br⁻, rồi I₂ gặp Br⁻.' },
  { short: 'Thao tác sai', bench: 'prep', link: 3,
    bridge: 'Tạm rời mô hình hạt và trở lại tủ hút. Lần này, em quan sát cảnh báo an toàn của hệ thống.',
    q: 'Nếu quên bật tủ hút hoặc bỏ cốc NaOH thì chuyện gì xảy ra?',
    todo: 'Cố tình tắt quạt tủ hút HOẶC nhấc cốc NaOH ra, rồi mở khoá phễu. Xem đồng hồ khí độc. Sau đó bật lại quạt và đặt cốc về chỗ.',
    goal: 'Tắt quạt hoặc nhấc cốc NaOH rồi mở khoá phễu. Xem đồng hồ khí độc, sau đó sửa lại.' },
  { short: 'Sát hạch', bench: 'cl', link: [1, 2],
    bridge: 'Dùng các dấu hiệu đã ghi ở bàn thử muối để nhận biết ba ống mới A, B và C. Mỗi ống cần có một lượt thử riêng.',
    q: 'Ba ống mất nhãn chứa NaCl, NaBr, KI. Tìm ra từng ống.',
    todo: 'Dùng nước Cl₂, nước Br₂, hồ tinh bột (bảng bên phải: chọn ống và lọ), rồi gắn nhãn cho cả 3 ống và bấm Chấm.',
    goal: 'Thử từng ống A, B, C, rồi gắn nhãn cho cả ba và bấm Chấm.' },
];

// ---------- dùng chung cho các ống nghiệm (bàn 2, bàn 3, sát hạch) ----------
// Tên chất ở chỗ THAO TÁC (nút việc, thẻ tên, dòng phương trình, số đọc, lịch sử) ghi bằng CÔNG THỨC, khớp chữ in trên nhãn lọ (chủ 27/11: "sao k thể hiện là kiểu Nguyên tố... t thấy khó hiểu quá").
// Tên gọi theo SGK (sodium bromide, chlorine…) còn ở dòng nhỏ trên nhãn lọ, thẻ tên của lọ và phần lời dẫn, kết luận.
export const SALT_NAME = { NaBr: 'NaBr', KI: 'KI', NaCl: 'NaCl', H2O: 'nước cất' }; // H2O: ống so màu ở bàn 3 (2 mL nước cất)
export const SALT_ION = { NaBr: 'Br', KI: 'I', NaCl: 'Cl' }; // muối chứa ion halide nào (cột của bảng tổng kết)
export const REAGENT = { Cl2: 'nước Cl₂', Br2: 'nước Br₂', I2: 'nước I₂', H2O: 'nước cất', tinhbot: 'hồ tinh bột' };
const G = '#b5d334'; // màu khí chlorine trong hoạt cảnh (vàng lục; facts.md D9)
const clamp = (x) => Math.min(1, Math.max(0, x));
const SALT_ML = 2, EXAM_DROPS = 20;
let SEQ = 0; const nextN = () => ++SEQ; // số thứ tự kết quả tăng mãi, không quay lại khi bàn về đầu (lesson.js nhận ra kết quả mới theo số này)
// Số giọt tự chọn: chỉ bị chặn bởi ống nghiệm (2 mL muối + 80 giọt vẫn dưới sức chứa ống)
const DROPS = { min: 1, max: 80, step: 1, digits: 0, unit: 'giọt', act: 'Nhỏ', limit: 'tối đa 80 giọt (ống nghiệm)' };
// Hai nút gợi ý "Nhỏ ít" / "Nhỏ dư": HỎI KHO số giọt bắt đầu có kết tủa (ví dụ iodine xám đen), rồi lấy một mức dưới hẳn và một mức trên hẳn mốc đó.
// Muối không có mốc kết tủa thì không có gợi ý (null). Không viết cứng ngưỡng.
export function dropHints(salt, chem) {
  const t = newTube(); add(t, salt, { mL: SALT_ML }); let T = null;
  for (let i = 1; i <= DROPS.max && T == null; i++) { add(t, chem, { mL: DROP_ML, drop: true }); if (t.ppt.length) T = i; }
  return T == null ? null : { little: Math.max(1, Math.round(T / 2)), excess: Math.min(DROPS.max, T + Math.max(5, Math.round(T / 4))), at: T };
}
// Mỗi ống ghi lại các lần thêm chất (B.data.hist) để dựng lại một bản sao trong kho hoá học: xem trước màu cuối khi đang nhỏ (đổi màu dần theo giọt, T1)
function replay(B, id) { const c = newTube(); (B.data.hist[id] || []).forEach(([chem, amt, n]) => { for (let i = 0; i < n; i++) add(c, chem, amt); }); return c; }
const histOf = (B, id) => (B.data.hist[id] = B.data.hist[id] || []);
// Dung dịch muối 2 mL vào từng ống của kho hoá học; mực ống theo thể tích thật (B.vessel.mL; bộ máy 2D chưa có thì đặt mức cũ)
function pourSalt(B, ids, salt) {
  ids.forEach((id) => { const t = newTube(); add(t, salt, { mL: SALT_ML }); B.data.tubes[id] = t; B.data.salts[id] = salt; B.data.hist[id] = [[salt, { mL: SALT_ML }, 1]]; const L = look(t), V = B.vessel[id]; V.look(L.hex, L.opacity); if (V.mL) V.mL(t.vol); else V.setFill?.(0.42); });
}
// Nhỏ n giọt một thuốc thử vào một ống của kho hoá học; cất kết quả vào B.data.res và B.data.last (lesson.js ghi thành một dòng của bảng kết quả).
// anim = true: sau khi nhỏ là một lần chạy ngắn (kết tủa lắng xuống, nhãn ống báo XONG). Màu đã đổi dần trong lúc nhỏ (during) thì lần chạy không đổi màu lại.
function drip(B, tubeId, chem, n, anim) {
  const t = B.data.tubes[tubeId]; if (!t || !t.vol) return null;
  const before = look(t), events = []; let safety = null, done = 0;
  for (let i = 0; i < n; i++) { const r = add(t, chem, { mL: DROP_ML, drop: true }); if (r.full) break; done++; events.push(...r.events); if (r.safety) safety = r.safety; }
  histOf(B, tubeId).push([chem, { mL: DROP_ML, drop: true }, done]);
  const last = (k) => events.filter((e) => e.kind === k).pop(), rxs = events.filter((e) => e.kind === 'reaction'), rx = rxs.find((e) => e.r && e.r.equation) || rxs[rxs.length - 1], rxLast = rxs[rxs.length - 1];
  const none = last('none'), ind0 = last('indicator'), ind = ind0 && ind0.changed !== false ? ind0 : null, L = look(t), ppt = t.ppt.length ? t.ppt[t.ppt.length - 1] : null; // hồ tinh bột không đổi màu thì tính là không phản ứng
  const res = { n: nextN(), ev: rx || null /* sự kiện phản ứng của kho: ô "Bên trong ống" dựng mô hình hạt từ đây */, tube: tubeId, chem, drops: done, volume: t.vol, salt: B.data.salts[tubeId], hex: L.hex, op: L.opacity, ppt: ppt ? ppt.color : null,
    kind: rx ? 'reaction' : ind ? 'indicator' : 'none',
    equation: rx ? rx.r.equation : null, ionic: rx ? rx.r.ionic || null : null,
    phenomenon: ppt && rxLast && rxLast !== rx ? `${rx.r.phenomenon} ${rxLast.r.phenomenon}` : rx ? rx.r.phenomenon : ind ? `Hồ tinh bột hoá ${ind.to}.` : ind0 ? `Hồ tinh bột ${ind0.to}.` : none && none.r ? none.r.phenomenon : 'Không đổi.',
    reason: (rx || none) && (rx || none).r ? (rx || none).r.reason || '' : '',
    safety: safety || ((rx || none) && (rx || none).r && (rx || none).r.safety) || null };
  (B.data.res[tubeId] = B.data.res[tubeId] || []).push(res); B.data.last = res;
  const pre = B.data.pre && B.data.pre.tube === tubeId ? B.data.pre : null; B.data.pre = null;
  B.vessel[tubeId].mL?.(t.vol);
  if (anim) B.data.anim = { tube: tubeId, from: pre ? pre.to : before.hex, to: L.hex, op: L.opacity, ppt: !!ppt };
  else { B.vessel[tubeId].look(L.hex, L.opacity); B.vessel[tubeId].ppt?.(ppt ? 0.6 : 0, '#2f2a33'); }
  return res;
}
// Đổi màu dần theo từng giọt (khai during của việc, xem đầu kit/labset.js): hỏi kho màu cuối bằng một bản sao của ống, rồi pha màu đầu và màu cuối theo phần đã nhỏ
const during = (tube, chem, nOf) => (B, o, k) => {
  if (k === 0 || !B.data.pre || B.data.pre.tube !== tube) {
    const t = B.data.tubes[tube]; B.data.pre = null; if (!t || !t.vol) return;
    const c = replay(B, tube), n = nOf(B, o); for (let i = 0; i < n; i++) if (add(c, chem, { mL: DROP_ML, drop: true }).full) break;
    const a = look(t), z = look(c); B.data.pre = { tube, chem, from: a.hex, to: z.hex, op: z.opacity };
  }
  const P = B.data.pre; if (P) B.vessel[tube].look(mix(P.from, P.to, k), P.op);
};
// Màu giọt và dòng chảy của từng thuốc thử: hỏi kho (1 mL thuốc thử trong ống sạch)
const HEX = {}; const hexOf = (chem) => HEX[chem] || (HEX[chem] = (() => { const t = newTube(); add(t, chem, { mL: 1 }); return look(t).hex; })());
const verdict = (r) => (!r ? '' : r.kind === 'reaction' ? (r.ppt ? 'kết tủa ' + r.ppt : 'có phản ứng') : r.kind === 'indicator' ? `hồ tinh bột ${r.phenomenon.replace('Hồ tinh bột hoá ', '').replace('.', '')}` : 'không phản ứng');
const lastOf = (B, id) => { const a = B.data.res && B.data.res[id]; return a && a.length ? a[a.length - 1] : null; };
const nameOf = (B, id, names) => names[id] + (B.data.salts[id] ? ' · ' + SALT_NAME[B.data.salts[id]] : '');
function tubeTags(B, names) { Object.keys(names).forEach((id) => { const r = lastOf(B, id), base = B.opts.exam ? names[id] : nameOf(B, id, names); B.tag(id, r ? `${base} · ${verdict(r)}` : B.data.salts[id] ? base : `${names[id]} · rỗng`); }); }
const mix = (a, b, k) => { const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16); return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0')).join(''); };
// Một lần nhỏ là một lần chạy ngắn: màu ống chuyển dần, có kết tủa thì lắng xuống, xong thì nhãn ống đổi màu, nháy, báo XONG
const TUBE_RUN = {
  frame(B, t) {
    const A = B.data.anim; if (!A) return { done: true, end: true };
    const k = clamp(t / 1.4); B.vessel[A.tube].look(mix(A.from, A.to, k), A.op); B.vessel[A.tube].ppt?.(A.ppt ? 0.6 * clamp((t - 0.6) / 0.8) : 0, '#2f2a33');
    if (t >= 1.5) { B.data.anim = null; this.show(B); return { done: true, end: true }; }
    return { done: false };
  },
  marks(B) { const A = B.data.anim, r = B.data.last; return A && r ? [{ tag: A.tube, ring: A.tube, at: 1.3, say: `XONG: ${r.phenomenon}` }] : []; },
};
// Việc LẤY 2 mL MUỐI bằng ống hút của lọ (T2: không nghiêng lọ rót vào ống nghiệm), việc nhỏ có số giọt tự chọn (một lần chạy), việc nhỏ nước cất vào ống đối chứng (T11), việc nhỏ cố định
const pipStep = (id, label, bottle, tube, salt, extra = {}) => ({ id, role: 'prepare', label, verb: 'drip', item: bottle, into: [tube], ml: SALT_ML, drawMl: 1, drop: hexOf(salt), apply: (B) => pourSalt(B, [tube], salt), ...extra });
const dripRun = (id, label, src, tube, chem, v, extra = {}) => ({ id, role: 'start', label, verb: 'drip', item: src, into: [tube], var: v, range: DROPS, drop: hexOf(chem), during: during(tube, chem, (B, o) => o.v),
  guard: (B) => (B.data.salts[tube] ? null : 'Ống còn rỗng: lấy 2 mL dung dịch muối vào ống trước.'),
  apply: (B, o) => drip(B, tube, chem, o.v, true), ...extra });
const ctrlStep = (id, label, tube, v, after, extra = {}, src = 'dW', chem = 'H2O') => ({ id, label, verb: 'drip', item: src, into: [tube], count: (B) => B.level[v], drop: hexOf(chem), needs: [after], during: during(tube, chem, (B) => B.level[v]),
  apply: (B) => drip(B, tube, chem, B.level[v], false), ...extra });
// Ống so màu (bàn 3): nước bromine, nước iodine tự có màu, nên ống chỉ có nước cất nhận CÙNG số giọt halogen để so (T11). Màu do kho hoá học tính như mọi ống.
const refStep = (id, label, src, chem, v, after) => ctrlStep(id, label, 'tW', v, after, { off: true }, src, chem);
const dripFixed = (id, label, src, tube, chem, n, extra = {}) => ({ id, label, verb: 'drip', item: src, into: [tube], n, drop: hexOf(chem), during: during(tube, chem, () => n), apply: (B) => drip(B, tube, chem, n, false), ...extra });
// BỐ CỤC BÀN theo vai trò (DEFINE_SAP_XEP_BAN.md mục 7, chủ duyệt 27/11): S lọ mẫu · R lọ thuốc thử · T ống trên đế kèm chữ ở bảng tên.
// Khoá = chỉ số bước (0 = bước 1); macdinh = bước không khai. Bàn 2D và bàn 3D đọc CÙNG bảng này (kit/bo_cuc_ban.js).
// Bước 5, 6: một ống so màu với đúng hai ống thử thì ống so màu đứng GIỮA (luật 7.7).
const BO_CUC = {
  cl: {
    2: { S: ['bBr', 'dW'], R: ['dCl'], T: [['tRef', 'Đối chứng'], ['tBr', 'Thí nghiệm']] },
    3: { S: ['bI', 'dW'], R: ['dCl', 'dS'], T: [['tRef', 'Đối chứng'], ['tI', 'Thí nghiệm']] },
    8: { S: [], R: ['dCl', 'dS', 'dBr'], T: [['tRef', 'Ống A'], ['tBr', 'Ống B'], ['tI', 'Ống C']] },
    macdinh: { S: ['bBr', 'dW'], R: ['dCl', 'dS'], T: [['tRef', 'Đối chứng'], ['tBr', 'Thí nghiệm'], ['tI', 'Thí nghiệm']] },
  },
  bri: {
    4: { S: ['bKI', 'bNaCl', 'dW'], R: ['dBr'], T: [['t1', 'Ống 1'], ['tW', 'So màu'], ['t2', 'Ống 2']] },
    5: { S: ['bNaBr', 'bNaCl', 'dW'], R: ['dI'], T: [['t3', 'Ống 3'], ['tW', 'So màu'], ['t4', 'Ống 4']] },
    macdinh: { S: ['dW'], R: ['dBr', 'dI'], T: [['t1', 'Ống 1'], ['t2', 'Ống 2'], ['tW', 'So màu'], ['t3', 'Ống 3'], ['t4', 'Ống 4']] },
  },
};

const PIP = (title, name, clear = false) => ({ pip: true, clear, title, name });
const SINK = { id: 'sink', kind: 'sink', at: [3.1, 0.6], opts: { photo: true, w: 2.1 }, tag: 'Vòi nước: rửa ống', role: 'rửa ống dưới vòi sau khi đã đổ dung dịch vào cốc thải (làm lại)' };
// Hai bình cùng là nước cất nhưng khác việc (chủ 27/11: "h20 cũng là nước cất à- cần rõ ràng ra"): lọ có ống hút để NHỎ vào ống đối chứng hoặc ống so màu, bình tia để TRÁNG ống sau khi rửa. Nhãn và thẻ tên ghi rõ việc của từng bình.
const WASH = { id: 'wash', kind: 'wash', at: [1.25, -1.5], tag: 'Bình tia nước cất: tráng ống', role: 'tráng ống bằng nước cất sau khi rửa ở vòi' };
const WASTE = { id: 'waste', kind: 'beaker', at: [0.8, -0.5], opts: { h: 0.62, fill: 0, sort: 0 }, tag: 'Cốc thải', role: 'dung dịch đã dùng đổ vào đây, không đổ xuống bồn rửa (làm lại)' };
const RINSE = { sink: 'sink', wash: 'wash', waste: 'waste', wasteMl: 50, label: 'Làm lại: đổ vào cốc thải, rửa ở vòi, tráng nước cất' };
// Giá ống nghiệm gỗ (ảnh rack, như 2D): 5 lỗ cách nhau 0,32, lùi vào 0,22 so với tâm giá; đáy ống tựa lên tấm đế cao 0,1
const hole = (rackX, i) => [rackX + (i - 2) * 0.32, 0.1, 0.22];
const TUBE_TAG = [0, 2.05, 0];
const EXAM = ['A', 'B', 'C'], EXAM_TUBES = ['tRef', 'tBr', 'tI'], EXAM_REAG = [['dCl', 'Cl2'], ['dBr', 'Br2'], ['dS', 'tinhbot']];
// Món chỉ hiện ở các bước của bàn khi cần (B.opts.step do lesson.js đặt). Bước không phải của bàn này thì hiện bộ mặc định.
const at = (B, list, steps, fallback = true) => (steps.includes(B.opts.step) ? list.includes(B.opts.step) : fallback);
const CL_STEPS = [2, 3, 8], BRI_STEPS = [4, 5];
const RANKO = [{ v: 'Cl2', item: 'rCl', label: 'Cl₂' }, { v: 'Br2', item: 'rBr', label: 'Br₂' }, { v: 'I2', item: 'rI', label: 'I₂' }];
const SHELF_X = 1.05, SHELF_Z = 1.35, // chặng 3 đợt 2 (27/11): kệ ra hàng trước bên phải để không bị lọ nào che; lọ có ống hút của bàn 3 lùi ra hàng sau
      SLOT = (i) => [SHELF_X + (i - 1) * 0.7, SHELF_Z];
const rankStep = (i, label) => ({ id: 'rank' + (i + 1), role: 'choose', var: 'r' + (i + 1), label, verb: 'slide', slot: SLOT(i), options: RANKO,
  guard: (B, o) => (o && [1, 2, 3].some((j) => j !== i + 1 && B.st['rank' + j] && B.level['r' + j] === o.v) ? 'Lọ này đã nằm trên kệ.' : null),
  apply: i === 2 ? checkRank : undefined });

export const lab = {
  // Phần chỉ có nghĩa ở 3D (kit/labset.js đọc lab.mode3d): căn phòng, đồ tạo không khí, khung toàn cảnh.
  mode3d: {
    // Kéo chuột theo luật chủ chốt 21/11: ở khung chuẩn kéo là XOAY; phóng to từ 130% kéo mới là dời khung (27/11 bỏ panAtAnyZoom, chủ báo "không xoay được").
    room: { photo: './assets/env_v3/', top: 0x1b1e21, dim: 0.72 },
    props: [
      { kind: 'stool', at: [-5.6, 6.6], opts: { color: 0x4b5563 } }, { kind: 'stool', at: [5.8, 6.2], opts: { color: 0x4b5563 } },
      { kind: 'coatstand', at: [-22.0, -17.6], ry: 0.5 },
      { kind: 'trolley', at: [18.6, -17.2], ry: -0.2 },
    ],
    overview: { target: [0, 2.7, -2.5], w: 31.0, h: 22.4, el: 22, az: 0, fov: 40, maxDist: 80, cy: 0.5 },
  },
  benches: [
    // ---------- Bàn 1 · Điều chế chlorine, nằm trong tủ hút ----------
    // 1 Chuẩn bị: nối ống theo dòng khí, bật quạt · 2 Chọn: nhỏ chậm / nhanh · 3 Khởi động: mở khoá phễu · 4 Quan sát: khí, thanh bình thu, đồng hồ · 5 Ghi: dòng mỗi lần chạy · 6 Làm lại
    { id: 'prep', name: 'Bàn 1 · Điều chế Cl₂', short: 'Điều chế', color: '#65a30d', at: [-9.0, -5.9], tagY: 6.6, pipesOff: true, ref: { speed: 'cham' },
      eq: 'KMnO₄ + HCl đặc → khí Cl₂', cond: 'chỉ mô phỏng · làm trong tủ hút · khí thừa vào cốc NaOH',
      text: 'Bình cầu có tinh thể KMnO₄, phễu nhỏ giọt chứa HCl đặc, bình rửa khí, bình thu, cốc NaOH, tất cả trong tủ hút. Dụng cụ chưa nối: nối ống theo đúng dòng khí rồi mới chạy.',
      view: { target: [0.25, 1.3, 0.4], w: 7.4, h: 3.0, el: 12, az: -4 }, // khung của phòng cũ; bàn mới đặt khung riêng ở ban_3d.js
      items: [
        { id: 'hood', kind: 'hood', at: [0, -0.55], opts: { w: 8.0, d: 3.3, h: 4.7 }, tag: 'Tủ hút · quạt tắt', tagAt: [3.3, 2.95, 1.6], role: 'hút khí độc ra ngoài; chạm để bật hoặc tắt quạt' },
        { id: 'stand', kind: 'stand', at: [-2.85, -0.3], opts: { h: 2.9, clampY: 0.95 } },
        { id: 'flask', kind: 'sideflask', at: [-2.35, 0.1], tag: 'Bình cầu: tinh thể KMnO₄', tagAt: [-0.45, 0.55, 0.3], role: 'nơi KMnO₄ gặp HCl đặc, khí Cl₂ sinh ra ở đây' },
        { id: 'funnel', kind: 'dropfunnel', at: [-2.35, 1.3, 0.1], tag: 'Phễu nhỏ giọt: HCl đặc · đang khoá', role: 'chứa HCl đặc; mở khoá để HCl nhỏ xuống bình cầu' },
        { id: 'washer', kind: 'gaswash', at: [-0.55, 0.1], tag: 'Bình rửa khí', role: 'giữ lại hơi HCl lẫn trong khí' },
        { id: 'jar', kind: 'jar', at: [0.95, 0.1], opts: { title: '', fill: 0.02, label: false }, tag: 'Bình thu khí · trống', role: 'thu khí Cl₂; chạm để làm lại (khoá phễu, đậy bình)' },
        { id: 'trap', kind: 'beaker', at: [2.4, 0.3], away: [2.0, 1.75], tag: 'Cốc NaOH: hấp thụ khí thừa', role: 'dung dịch NaOH giữ khí Cl₂ thừa, không cho thoát ra phòng' },
        { id: 'meter', kind: 'gasmeter', at: [3.45, 1.35], ry: -0.35, tag: 'Khí độc trong phòng: An toàn', role: 'đo khí độc trong phòng, tự chạy' },
      ],
      pipes: [['flask', 'washer'], ['washer', 'jar'], ['jar', 'trap']],
      init(B) { Object.assign(B.data, { n: 0, fan: false, trapOut: false, open: false, locked: false, leaked: false, fixed: false, full: false, level: 0.08, fillK: 0, peak: 0.08, phase: null, links: 0 }); B.meter('meter', 0.08); },
      steps: [
        { id: 'c1', role: 'prepare', label: 'Nối ống: bình cầu → bình rửa khí', verb: 'none', items: ['flask', 'washer'], apply(B) { B.pipe?.('flask', 'washer', true); B.data.links = 1; } },
        { id: 'c2', role: 'prepare', label: 'Nối ống: bình rửa khí → bình thu', verb: 'none', items: ['washer', 'jar'], apply(B) { B.pipe?.('washer', 'jar', true); B.data.links = 2; } },
        { id: 'c3', role: 'prepare', label: 'Nối ống: bình thu → cốc NaOH', verb: 'none', items: ['jar', 'trap'], apply(B) { B.pipe?.('jar', 'trap', true); B.data.links = 3; } },
        { id: 'fan', role: 'prepare', label: 'Bật / tắt quạt tủ hút', verb: 'press', item: 'hood', optional: true, repeat: true, free: true,
          apply(B) { B.data.fan = !B.data.fan; B.switch('hood', B.data.fan); fixCheck(B); } },
        { id: 'trap', role: 'prepare', label: 'Nhấc cốc NaOH ra / đặt lại', verb: 'move', item: 'trap', optional: true, repeat: true, free: true, off: true,
          offSay: 'Bước này để cốc NaOH đúng chỗ: nó hấp thụ khí Cl₂ thừa.',
          apply(B) { B.data.trapOut = !B.data.trapOut; fixCheck(B); } },
        { id: 'speed', role: 'choose', var: 'speed', repeat: true, label: 'Tốc độ nhỏ HCl đặc', verb: 'none',
          options: [{ v: 'cham', label: 'Nhỏ chậm' }, { v: 'nhanh', label: 'Nhỏ nhanh' }] },
        { id: 'open', role: 'start', label: 'Mở khoá phễu cho HCl đặc nhỏ xuống', verb: 'press', item: 'funnel', repeat: true,
          guard(B) {
            const D = B.data;
            if (D.locked) return 'Phễu đang bị khoá vì khí thoát ra. Bật quạt tủ hút và đặt cốc NaOH về chỗ trước.';
            if (D.full) return 'Bình thu đã đầy: chạm bình thu (Làm lại) để khoá phễu, đậy bình và chờ đồng hồ về An toàn, rồi chạy lần nữa.';
            if (!B.opts.practice && !D.fan) return 'Khí Cl₂ độc: bật quạt tủ hút trước khi mở khoá phễu.';
            if (B.opts.practice && !D.leaked && D.fan && !D.trapOut) return 'Bước này cố tình làm SAI: tắt quạt tủ hút hoặc nhấc cốc NaOH ra, rồi mới mở khoá phễu.';
            return null;
          },
          apply(B) { Object.assign(B.data, { open: true, phase: 'gas', peak: B.data.level, safeRun: B.data.fan && !B.data.trapOut }); B.switch('funnel', true); } },
        { id: 'clean', role: 'start', label: 'Làm lại: khoá phễu, đậy bình thu, chờ đồng hồ về An toàn', verb: 'press', item: 'jar', optional: true, repeat: true,
          guard(B) { const D = B.data; if (!D.fan) return 'Bật quạt tủ hút để hút hết khí ra rồi mới làm lại.'; if (!D.full && D.level <= 0.09) return 'Bàn đang sạch, chưa cần làm lại.'; return null; },
          apply(B) { Object.assign(B.data, { phase: 'clean', open: false, from: B.data.level, fill0: B.data.fillK }); B.switch('funnel', false); } },
      ],
      chem: {
        speed: 1,
        marks(B) { const D = B.data; return D.phase === 'gas' && D.safeRun ? [{ tag: 'jar', at: 1 + dur(B) - 0.05, say: 'Bình thu XONG: đầy khí Cl₂.' }] : []; },
        frame(B, t) {
          const D = B.data;
          if (D.phase === 'clean') { // làm lại: quạt hút hết khí, đồng hồ về An toàn, bình thu trống
            const k = clamp(t / 3); D.level = D.from + (0.08 - D.from) * k; D.fillK = D.fill0 * (1 - k); B.meter('meter', D.level); B.haze('jar', D.fillK, G); B.haze('hood', 0); B.flow(0); B.fizz('flask', 0); B.fizz('trap', 0);
            if (k >= 1) { Object.assign(D, { full: false, fillK: 0, level: 0.08, phase: null }); this.show(B); return { done: true, end: true }; }
            this.show(B); return { done: false };
          }
          const safe = D.fan && !D.trapOut, T = dur(B);
          B.fizz('flask', clamp(t / 0.8)); B.flow(clamp((t - 0.6) / 0.6), G); B.fizz('washer', t > 1.2 ? 0.7 : 0); B.fizz('trap', !D.trapOut && t > 2.2 ? 0.6 : 0);
          D.fillK = clamp((t - 1) / T); B.haze('jar', D.fillK, G);
          if (safe) {
            D.level = 0.08; B.meter('meter', D.level);
            if (D.fillK >= 1) { stopGas(B); D.full = true; record(B, 'đầy ' + (B.level.speed === 'nhanh' ? 'nhanh' : 'chậm')); this.show(B); return { done: true, end: true }; }
          } else {
            const k = clamp(t / 6); D.level = 0.08 + 0.92 * k; D.peak = Math.max(D.peak, D.level); B.meter('meter', D.level); B.haze('hood', k * (D.fan ? 0.6 : 1), G);
            if (k >= 1) { stopGas(B); Object.assign(D, { locked: true, leaked: true }); record(B, 'chưa đầy: bàn tự khoá phễu'); B.say('Khí Cl₂ thoát ra phòng: đồng hồ lên Nguy hiểm, bàn tự khoá phễu. ' + SAFETY); this.show(B); return { done: true, end: true }; }
          }
          this.show(B);
          return { done: false };
        },
        show(B) {
          const D = B.data;
          B.tag('hood', `Tủ hút · quạt ${D.fan ? 'đang chạy' : 'tắt'}`);
          B.tag('funnel', `Phễu nhỏ giọt: HCl đặc · ${D.open ? 'đang mở' : D.locked ? 'bị khoá' : 'đang khoá'}`);
          B.tag('trap', D.trapOut ? 'Cốc NaOH: đã nhấc ra' : 'Cốc NaOH: hấp thụ khí thừa');
          B.tag('jar', D.full ? 'Bình thu khí · đầy' : D.fillK > 0.01 ? `Bình thu khí · ${Math.round(D.fillK * 100)}%` : D.links < 3 ? 'Bình thu khí · chưa nối' : 'Bình thu khí · trống');
          B.tag('meter', `Khí độc trong phòng: ${zone(D.level)}`);
        },
        read(B) {
          const D = B.data;
          return { label: 'Khí độc trong phòng', big: zone(D.level), unit: '', cells: [['Ống đã nối', `${D.links}/3`], ['Quạt tủ hút', D.fan ? 'đang chạy' : 'tắt'], ['Bình thu khí', D.full ? 'đầy' : Math.round(D.fillK * 100) + '%']] };
        },
      } },

    // ---------- Bàn 2 · Chlorine gặp muối halide (cũng là bàn Sát hạch) ----------
    // 1 Chuẩn bị: rót muối vào hai ống · 2 Chọn: số giọt · 3 Khởi động: chạm lọ nước chlorine · 4 Quan sát: màu, kết tủa, phương trình, hồ tinh bột · 5 Ghi · 6 Làm lại: vòi nước
    { id: 'cl', bo_cuc: BO_CUC.cl, name: 'Bàn 2 · Nước Cl₂ gặp muối halide', short: 'Nước Cl₂', color: '#0e7490', at: [9.0, -5.9], tagY: 3.9, ref: { nCl: 20 }, closeup: true, closeupHold: 2.8 /* giữ cận cảnh sau giọt cuối: kịp nhìn màu vừa đổi (chặng 1, 26/11) */, tagFocus: true,
      eq: 'nước Cl₂ + muối NaBr, KI → ?', cond: 'mỗi ống 2 mL dung dịch muối · số giọt tự chọn',
      text: 'Giá ống nghiệm gỗ: ống đối chứng và ống thí nghiệm, ban đầu rỗng. Lọ muối có ống hút: lấy 2 mL vào mỗi ống. Nhỏ nước Cl₂ vào ống thí nghiệm, nhỏ cùng số giọt nước cất vào ống đối chứng. Hồ tinh bột để nhận ra I₂. Cốc thải, vòi nước, bình tia để làm lại.',
      view: { target: [-0.4, 1.15, 0.4], w: 7.8, h: 3.0, el: 15, az: 4 },
      items: [
        { id: 'rack', kind: 'rack', at: [-1.0, 0], opts: { photo: true } },
        { id: 'tRef', kind: 'tube', at: hole(-1.0, 0), tag: 'Ống đối chứng · rỗng', tagAt: TUBE_TAG, role: 'ống để so: nhận nước cất, cùng số giọt với ống thí nghiệm', show: (B) => at(B, [2, 3, 8], CL_STEPS) },
        { id: 'tBr', kind: 'tube', at: hole(-1.0, 2), tag: 'Ống thí nghiệm · rỗng', tagAt: TUBE_TAG, role: 'ống nhận nước Cl₂', show: (B) => at(B, [2, 8], CL_STEPS) },
        { id: 'tI', kind: 'tube', at: hole(-1.0, 4), tag: 'Ống thí nghiệm · rỗng', tagAt: TUBE_TAG, role: 'ống nhận nước Cl₂', show: (B) => at(B, [3, 8], CL_STEPS) },
        { id: 'bBr', kind: 'dropper', at: [-3.0, 0.55], opts: PIP('NaBr', 'Sodium bromide', true), tag: 'NaBr · sodium bromide', role: 'lọ dung dịch NaBr có ống hút; chạm để lấy 2 mL vào ống', show: (B) => at(B, [2], CL_STEPS, false) },
        { id: 'bI', kind: 'dropper', at: [-3.0, 0.55], opts: PIP('KI', 'Potassium iodide', true), tag: 'KI · potassium iodide', role: 'lọ dung dịch KI có ống hút; chạm để lấy 2 mL vào ống', show: (B) => at(B, [3], CL_STEPS, false) },
        { id: 'dCl', kind: 'dropper', at: [0.35, 1.15], opts: PIP('Cl₂', 'Nước chlorine'), tag: 'Nước Cl₂ · chlorine', role: 'nhỏ vào ống thí nghiệm đúng số giọt đã chọn' },
        { id: 'dS', kind: 'dropper', at: [1.1, 1.15], opts: PIP('Tinh bột', 'Hồ tinh bột'), tag: 'Hồ tinh bột', role: 'gặp I₂ thì hoá xanh đen: dùng để nhận ra I₂', show: (B) => at(B, [3, 8], CL_STEPS, true) },
        { id: 'dW', kind: 'dropper', at: [1.85, -0.8], opts: PIP('Nước cất', 'H₂O · nhỏ ống đối chứng', true), tag: 'Nước cất: nhỏ ống đối chứng', role: 'nhỏ vào ống đối chứng, cùng số giọt với ống thí nghiệm', show: (B) => at(B, [2, 3], CL_STEPS, false) },
        { id: 'dBr', kind: 'dropper', at: [1.85, -0.8], opts: PIP('Br₂', 'Nước bromine'), tag: 'Nước Br₂ · bromine', role: 'dùng ở bước Sát hạch', show: (B) => B.opts.step === 8 },
        { ...SINK }, { ...WASH }, { ...WASTE },
      ],
      init(B) {
        Object.assign(B.data, { tubes: {}, salts: {}, res: {}, hist: {}, n: 0, anim: null, pre: null });
        EXAM_TUBES.forEach((id) => { B.data.tubes[id] = newTube(); });
        const ex = B.opts.exam; if (ex) EXAM_TUBES.forEach((id, i) => pourSalt(B, [id], ex[i])); // Sát hạch: ba ống mất nhãn đã có sẵn 2 mL dung dịch
      },
      touch: (B) => (B.opts.exam ? 'Ở bước Sát hạch: chọn ống và lọ ở bảng bên phải.' : null),
      steps: [
        pipStep('pBrR', 'Lấy 2 mL NaBr vào ống đối chứng', 'bBr', 'tRef', 'NaBr', { off: true }),
        pipStep('pBrE', 'Lấy 2 mL NaBr vào ống thí nghiệm', 'bBr', 'tBr', 'NaBr', { off: true }),
        dripRun('dBrRun', 'Nhỏ nước Cl₂ vào ống thí nghiệm', 'dCl', 'tBr', 'Cl2', 'nCl', { off: true }),
        ctrlStep('wBr', 'Nhỏ nước cất vào ống đối chứng, cùng số giọt', 'tRef', 'nCl', 'dBrRun', { off: true }),
        pipStep('pIR', 'Lấy 2 mL KI vào ống đối chứng', 'bI', 'tRef', 'KI', { off: true }),
        pipStep('pIE', 'Lấy 2 mL KI vào ống thí nghiệm', 'bI', 'tI', 'KI', { off: true }),
        dripRun('dIRun', 'Nhỏ nước Cl₂ vào ống thí nghiệm', 'dCl', 'tI', 'Cl2', 'nCl', { off: true }),
        ctrlStep('wI', 'Nhỏ nước cất vào ống đối chứng, cùng số giọt', 'tRef', 'nCl', 'dIRun', { off: true }),
        dripFixed('starch', 'Nhỏ hồ tinh bột vào ống thí nghiệm', 'dS', 'tI', 'tinhbot', 20, { off: true, optional: true, needs: ['dIRun'] }),
        // Sát hạch: 3 ống × 3 lọ, bấm ở bảng bên phải (lesson.js)
        ...EXAM_TUBES.flatMap((tube, i) => EXAM_REAG.map(([src, chem]) => dripFixed(`x_${tube}_${chem}`, `Nhỏ ${REAGENT[chem]} vào ống ${EXAM[i]}`, src, tube, chem, EXAM_DROPS, { off: true, optional: true, offSay: 'Lọ này dùng ở bước Sát hạch.' }))),
      ],
      rinse: RINSE,
      chem: {
        ...TUBE_RUN,
        show(B) {
          if (B.opts.exam) tubeTags(B, { tRef: 'Ống A', tBr: 'Ống B', tI: 'Ống C' });
          else tubeTags(B, { tRef: 'Ống đối chứng', tBr: 'Ống thí nghiệm', tI: 'Ống thí nghiệm' });
        },
      } },

    // ---------- Bàn 3 · Bromine và iodine thử sức ----------
    // 1 Chuẩn bị: rót muối · 2 Chọn: số giọt (lọ halogen của bước) · 3 Khởi động: chạm lọ · 4 Quan sát · 5 Ghi · 6 Làm lại · bước 6 xếp ba lọ lên kệ
    { id: 'bri', bo_cuc: BO_CUC.bri, name: 'Bàn 3 · Nước Br₂ và nước I₂', short: 'Nước Br₂, I₂', color: '#9a3412', at: [0, 6.6], tagY: 3.9, ref: { nBr: 20, nI: 20 }, closeup: true, closeupHold: 2.8 /* giữ cận cảnh sau giọt cuối: kịp nhìn màu vừa đổi (chặng 1, 26/11) */, tagFocus: true,
      eq: 'nước Br₂, nước I₂ + muối KI, NaCl, NaBr → ?', cond: 'mỗi ống 2 mL dung dịch muối · số giọt tự chọn',
      text: 'Ống nghiệm ban đầu rỗng; ống so màu nhận 2 mL nước cất và cùng số giọt halogen để so màu; lọ KI, NaCl, NaBr, nước cất có ống hút để lấy 2 mL; lọ nước Br₂ (bước 5) và nước I₂ (bước 6). Bước 6 có kệ ba ô để xếp hạng ba halogen. Cốc thải, vòi nước, bình tia để làm lại.',
      view: { target: [-0.2, 1.15, 0.4], w: 7.8, h: 3.0, el: 15, az: 0 },
      items: [
        { id: 'rack', kind: 'rack', at: [-1.0, 0], opts: { photo: true } },
        { id: 't1', kind: 'tube', at: hole(-1.0, 0), tag: 'Ống 1 · rỗng', tagAt: TUBE_TAG, role: 'ống thử với nước Br₂', show: (B) => at(B, [4], BRI_STEPS) },
        { id: 't2', kind: 'tube', at: hole(-1.0, 1), tag: 'Ống 2 · rỗng', tagAt: TUBE_TAG, role: 'ống thử với nước Br₂', show: (B) => at(B, [4], BRI_STEPS) },
        { id: 'tW', kind: 'tube', at: hole(-1.0, 2), tag: 'Ống so màu · rỗng', tagAt: TUBE_TAG, role: 'chỉ có nước cất, nhận cùng số giọt halogen: màu của chính nước halogen, để so', show: (B) => at(B, [4, 5], BRI_STEPS) },
        { id: 't3', kind: 'tube', at: hole(-1.0, 3), tag: 'Ống 3 · rỗng', tagAt: TUBE_TAG, role: 'ống thử với nước I₂', show: (B) => at(B, [5], BRI_STEPS) },
        { id: 't4', kind: 'tube', at: hole(-1.0, 4), tag: 'Ống 4 · rỗng', tagAt: TUBE_TAG, role: 'ống thử với nước I₂', show: (B) => at(B, [5], BRI_STEPS) },
        { id: 'bKI', kind: 'dropper', at: [-3.2, -0.85], opts: PIP('KI', 'Potassium iodide', true), tag: 'KI · potassium iodide', role: 'lọ dung dịch KI có ống hút; chạm để lấy 2 mL', show: (B) => at(B, [4], BRI_STEPS, false) },
        { id: 'bNaCl', kind: 'dropper', at: [-2.4, -0.85], opts: PIP('NaCl', 'Sodium chloride', true), tag: 'NaCl · sodium chloride', role: 'lọ dung dịch NaCl có ống hút; chạm để lấy 2 mL', show: (B) => at(B, [4, 5], BRI_STEPS, false) },
        { id: 'bNaBr', kind: 'dropper', at: [-3.2, -0.85], opts: PIP('NaBr', 'Sodium bromide', true), tag: 'NaBr · sodium bromide', role: 'lọ dung dịch NaBr có ống hút; chạm để lấy 2 mL', show: (B) => at(B, [5], BRI_STEPS, false) },
        { id: 'dBr', kind: 'dropper', at: [0.45, 1.15], opts: PIP('Br₂', 'Nước bromine'), tag: 'Nước Br₂ · bromine', role: 'nhỏ vào ống đang thử, đúng số giọt đã chọn', show: (B) => at(B, [4], BRI_STEPS) },
        { id: 'dI', kind: 'dropper', at: [1.75, -0.7], opts: PIP('I₂', 'Nước iodine'), tag: 'Nước I₂ · iodine', role: 'nhỏ vào ống đang thử, đúng số giọt đã chọn', show: (B) => at(B, [5], BRI_STEPS) },
        { id: 'dW', kind: 'dropper', at: [2.45, -0.7], opts: PIP('Nước cất', 'H₂O · cho ống so màu', true), tag: 'Nước cất: lấy vào ống so màu', role: 'lọ nước cất có ống hút; chạm để lấy 2 mL vào ống so màu', show: (B) => at(B, [4, 5], BRI_STEPS) },
        { id: 'shelf', kind: 'shelf', at: [SHELF_X, SHELF_Z], tag: 'Kệ xếp hạng: mạnh nhất · giữa · yếu nhất', role: 'đặt ba lọ halogen theo thứ tự mạnh nhất tới yếu nhất', show: (B) => B.opts.step === 5 },
        { id: 'rCl', kind: 'bottle', at: [-2.9, 1.25], opts: { title: 'Cl₂', sub: 'nước chlorine', amber: true, hex: hexOf('Cl2') }, tag: 'Lọ nước Cl₂', role: 'chạm để đặt lên ô trống tiếp theo của kệ', show: (B) => B.opts.step === 5 },
        { id: 'rBr', kind: 'bottle', at: [-2.15, 1.25], opts: { title: 'Br₂', sub: 'nước bromine', amber: true, hex: hexOf('Br2') }, tag: 'Lọ nước Br₂', role: 'chạm để đặt lên ô trống tiếp theo của kệ', show: (B) => B.opts.step === 5 },
        { id: 'rI', kind: 'bottle', at: [-1.4, 1.25], opts: { title: 'I₂', sub: 'nước iodine', amber: true, hex: hexOf('I2') }, tag: 'Lọ nước I₂', role: 'chạm để đặt lên ô trống tiếp theo của kệ', show: (B) => B.opts.step === 5 },
        { ...SINK }, { ...WASH }, { ...WASTE },
      ],
      init(B) { Object.assign(B.data, { tubes: {}, salts: {}, res: {}, hist: {}, n: 0, anim: null, pre: null, rankOk: false }); ['t1', 't2', 't3', 't4', 'tW'].forEach((id) => { B.data.tubes[id] = newTube(); }); },
      steps: [
        pipStep('pW', 'Lấy 2 mL nước cất vào ống so màu', 'dW', 'tW', 'H2O', { off: true }),
        pipStep('p1', 'Lấy 2 mL KI vào ống 1', 'bKI', 't1', 'KI', { off: true }),
        pipStep('p2', 'Lấy 2 mL NaCl vào ống 2', 'bNaCl', 't2', 'NaCl', { off: true }),
        dripRun('brI', 'Nhỏ nước Br₂ vào ống 1', 'dBr', 't1', 'Br2', 'nBr', { off: true }),
        dripRun('brCl', 'Nhỏ nước Br₂ vào ống 2', 'dBr', 't2', 'Br2', 'nBr', { off: true }),
        refStep('cBr', 'Nhỏ nước Br₂ vào ống so màu, cùng số giọt', 'dBr', 'Br2', 'nBr', 'brCl'),
        pipStep('p3', 'Lấy 2 mL NaBr vào ống 3', 'bNaBr', 't3', 'NaBr', { off: true }),
        pipStep('p4', 'Lấy 2 mL NaCl vào ống 4', 'bNaCl', 't4', 'NaCl', { off: true }),
        dripRun('iBr', 'Nhỏ nước I₂ vào ống 3', 'dI', 't3', 'I2', 'nI', { off: true }),
        dripRun('iCl', 'Nhỏ nước I₂ vào ống 4', 'dI', 't4', 'I2', 'nI', { off: true }),
        refStep('cI', 'Nhỏ nước I₂ vào ống so màu, cùng số giọt', 'dI', 'I2', 'nI', 'iCl'),
        { ...rankStep(0, 'Đặt lọ mạnh nhất lên ô 1 của kệ'), off: true },
        { ...rankStep(1, 'Đặt lọ ở giữa lên ô 2 của kệ'), off: true },
        { ...rankStep(2, 'Đặt lọ yếu nhất lên ô 3 của kệ'), off: true },
      ],
      rinse: RINSE,
      chem: { ...TUBE_RUN, show(B) { tubeTags(B, { t1: 'Ống 1', t2: 'Ống 2', t3: 'Ống 3', t4: 'Ống 4', tW: 'Ống so màu' }); } } },

    // ---------- Tivi trên tường sau: một cặp chất gặp nhau, phóng tới mức hạt ----------
    { id: 'tv', name: 'Tivi · nhìn vào trong', short: 'Tivi', color: '#3b3d73', at: [0, -19.7], island: false, keep: true, tagY: 11.4,
      eq: 'halogen mạnh hơn lấy electron của ion halide yếu hơn', cond: 'mô hình minh hoạ · nói gọn',
      text: 'Tivi trên tường sau phóng một cặp chất tới mức hạt: phân tử halogen gặp hai ion halide.',
      view: { target: [0, 7.3, 0], w: 13.4, h: 8.4, el: 3, az: 0, maxDist: 60 },
      items: [{ id: 'tv', kind: 'redoxtv', at: [0, 7.3, 0] }],
      steps: [
        { id: 'p1', label: 'Xem cặp Cl₂ gặp Br⁻', verb: 'none', repeat: true, apply: (B) => showPair(B, 'Cl2', 'NaBr', 'Phân tử Cl₂ gặp hai ion Br⁻', 'Nói gọn: nguyên tử Cl nhỏ hơn nguyên tử Br nên hút electron mạnh hơn.') },
        { id: 'p2', label: 'Xem cặp I₂ gặp Br⁻', verb: 'none', optional: true, repeat: true, apply: (B) => showPair(B, 'I2', 'NaBr', 'Phân tử I₂ gặp hai ion Br⁻', 'Nói gọn: nguyên tử I hút electron yếu hơn nguyên tử Br nên I₂ không lấy được electron của Br⁻.') },
      ] },
  ],
};

// Cặp chất trên tivi: hỏi kho hoá học xem có phản ứng không và sản phẩm là gì (lấy từ phương trình ion rút gọn), rồi đặt cảnh.
function showPair(B, chem, salt, title, note) {
  const t = newTube(); add(t, salt, { mL: 2 }); const ev = add(t, chem, { mL: DROP_ML, drop: true }).events, rx = ev.find((e) => e.kind === 'reaction');
  const ionic = rx && rx.r && rx.r.ionic, products = ionic ? ionic.split('→')[1].trim().split(' + ') : [];
  B.screen('tv', { a: chem === 'Cl2' ? 'Cl₂' : chem === 'Br2' ? 'Br₂' : 'I₂', b: SALT_ION[salt] + '⁻', react: !!rx, products, title, note });
  B.data.pairs = { ...(B.data.pairs || {}), [chem]: !!rx };
}
// Xếp hạng trên kệ: đủ 3 ô thì chấm. Đúng thì kệ sáng; sai thì ba lọ về chỗ cũ để xếp lại.
function checkRank(B) {
  const got = [B.level.r1, B.level.r2, B.level.r3];
  if (got.join() === 'Cl2,Br2,I2') { B.data.rankOk = true; B.switch('shelf', true); B.say('Đúng: Cl₂ > Br₂ > I₂. Halogen mạnh hơn đẩy halogen yếu hơn ra khỏi muối.'); }
  else { B.data.rankOk = false; B.home?.('rCl', 'rBr', 'rI'); B.undo?.('rank1', 'rank2', 'rank3'); B.say('Chưa đúng. Nhìn lại bảng tổng kết: halogen nào đẩy được nhiều muối nhất? Ba lọ đã về chỗ, xếp lại.'); }
}
const zone = (k) => (k < 0.4 ? 'An toàn' : k < 0.75 ? 'Cảnh báo' : 'Nguy hiểm');
const dur = (B) => (B.level.speed === 'nhanh' ? 4 : 8); // thời gian đầy bình của hoạt cảnh: chỉ để so nhanh / chậm, không phải số đo
function stopGas(B) { B.data.open = false; B.switch('funnel', false); B.flow(0); B.fizz('flask', 0.1); B.fizz('washer', 0); B.fizz('trap', 0); }
// Một dòng kết quả của bàn điều chế (DEFINE 3b, chức năng 5): không có con số pha chế nào
function record(B, fill) {
  const D = B.data;
  D.last = { n: nextN(), kind: 'run', fan: D.fan ? 'bật' : 'tắt', trap: D.trapOut ? 'không có' : 'có', speed: B.level.speed === 'nhanh' ? 'nhỏ nhanh' : 'nhỏ chậm', fill, peak: zone(D.peak), safe: D.fan && !D.trapOut };
}
// Sau khi khí đã thoát: bật quạt và đặt cốc về chỗ là đã sửa, đồng hồ về An toàn, phễu mở lại được
function fixCheck(B) {
  const D = B.data;
  if (D.leaked && D.fan && !D.trapOut && !D.fixed) { Object.assign(D, { fixed: true, locked: false, level: 0.08 }); B.meter('meter', 0.08); B.haze('hood', 0); B.say('Đã sửa: quạt tủ hút đang chạy, cốc NaOH đã về chỗ. Đồng hồ về An toàn, mở khoá phễu lại được.'); }
  if (B.d.chem && B.d.chem.show) B.d.chem.show(B);
}
