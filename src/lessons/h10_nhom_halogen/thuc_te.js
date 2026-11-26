// MODE THỰC TẾ của bài "Nhóm halogen" (CHEM10-05): nhiệm vụ "Nước máy nhà mình còn đủ clo không?" (DEFINE.md mục 5, 5b; facts.md D2, D8, D11, D12).
// Tệp này CHỈ KHAI dữ liệu nhiệm vụ theo đúng tên trường của tài liệu STEMLabs (application: missionTitle, hook, context, facts, textbookLink, mission,
// questions, answers, solutionSteps, media, sources) và bàn 2D của phần 5. Khuôn 6 phần, giao diện, chấm điểm: flat/thuc_te.js (dùng chung cho mọi bài).
// Lời tự viết, không chép tài liệu STEMLabs hay SGK. Không có con số nào ngoài DEFINE.md và facts.md. Không tên nhà máy, thương hiệu.
import { newTube, add, look, DROP_ML } from '../../free/tubechem.js';
import { createMission } from '../../flat/thuc_te.js';
import { meta as LESSON } from './giao_an.js';

const STD = [0.1, 0.2, 0.5, 1.0, 2.0]; // mg/L clo dư: mẫu ẩn lấy một trong các mức này, dãy ống chuẩn cũng đúng các mức này (DEFINE mục 5)
const fmt = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const SAMPLE_ML = 5, KI_DROPS = 10, STARCH_DROPS = 10;

// ---------- Kho hoá học: mẫu nước có c mg/L clo, nhỏ KI rồi hồ tinh bột ----------
// Nước chlorine của kho là 0,05 M: lượng cần cho c mg/L trong 5 mL mẫu = (c : 70,9 mmol/L) × 5 mL : 0,05 M
function sampleTube(c) { const t = newTube(); add(t, 'H2O', { mL: SAMPLE_ML }); add(t, 'Cl2', { mL: ((c / 70.9 / 1000) * SAMPLE_ML) / 0.05 }); return t; }
function dripN(t, id, n) { const ev = []; for (let i = 0; i < n; i++) ev.push(...add(t, id, { mL: DROP_ML, drop: true }).events); return ev; }
// HÌNH MINH HOẠ (không phải số đo): độ đậm màu xanh theo lượng clo, thang log từ 0,1 tới 2,0 mg/L. Chỉ để so sánh mẫu với dãy chuẩn.
const shade = (c) => Math.min(0.95, Math.max(0.12, 0.18 + (0.75 * (Math.log10(c) + 1)) / (Math.log10(2) + 1)));
const mix = (a, b, k) => { const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16); return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0')).join(''); };
const CLEAR = '#dcecf5';
// Màu của một ống sau KI + hồ tinh bột: màu xanh đen LẤY TỪ KHO (hồ tinh bột gặp iodine), độ đậm theo shade(c) là minh hoạ
function testedLook(c) {
  const t = sampleTube(c), rx = dripN(t, 'KI', KI_DROPS).find((e) => e.kind === 'reaction'), ind = dripN(t, 'tinhbot', STARCH_DROPS).find((e) => e.kind === 'indicator'), L = look(t);
  return { hex: ind && ind.changed !== false ? mix(CLEAR, L.hex, shade(c)) : L.hex, op: 0.5 + 0.45 * shade(c), equation: rx ? rx.r.equation : null, starch: ind ? ind.to : null };
}
const hole = (rackX, i) => [rackX + (i - 2) * 0.32, 0.025, 0.22];
// Màu giọt của thuốc thử: hỏi kho (1 mL thuốc thử trong ống sạch), như hexOf của giáo án
const dropHex = (id) => { const t = newTube(); add(t, id, { mL: 1 }); return look(t).hex; };

// ---------- Bàn 2D của phần 5 ----------
const bench = {
  id: 'mau', name: 'Bàn kiểm tra clo dư', short: 'Mẫu nước', color: '#0e7490', at: [0, 0], tagY: 3.9, closeup: true, // cận cảnh khi ống hút làm việc (LUAT_THAO_TAC H1)
  eq: 'Cl₂ + 2KI → 2KCl + I₂ · I₂ làm hồ tinh bột hoá xanh đen', cond: 'mẫu 5 mL · lượng clo trong mẫu đang ẩn',
  text: 'Một ống mẫu nước máy (lượng clo ẩn), dãy 5 ống chuẩn đã thử sẵn, lọ dung dịch KI và lọ hồ tinh bột.',
  view: { target: [0, 1.15, 0.4], w: 7.8, h: 3.0, el: 15, az: 0 },
  items: [
    { id: 'rackS', kind: 'rack', at: [-2.6, 0] },
    { id: 'tS', kind: 'tube', at: hole(-2.6, 2), tag: 'Mẫu nước máy', role: 'mẫu cần kiểm: lượng clo trong mẫu đang ẩn' },
    { id: 'dKI', kind: 'dropper', at: [-1.35, 1.1], opts: { pip: true, clear: true, title: 'KI', name: 'Potassium iodide' }, tag: 'Dung dịch KI', role: 'clo trong mẫu đẩy I₂ ra khỏi KI' },
    { id: 'dS', kind: 'dropper', at: [-0.75, 1.1], opts: { pip: true, title: 'Tinh bột', name: 'Hồ tinh bột' }, tag: 'Hồ tinh bột', role: 'gặp I₂ thì hoá xanh đen' },
    { id: 'rackC', kind: 'rack', at: [0.9, 0], tag: 'Dãy ống chuẩn · độ đậm màu chỉ để so sánh, không phải số đo thật', role: 'năm ống đã thử sẵn ở năm mức clo, để so màu' },
    ...STD.map((c, i) => ({ id: 's' + (i + 1), kind: 'tube', at: hole(0.9, i), tag: fmt(c), role: `ống chuẩn ${fmt(c)} mg/L clo dư, đã nhỏ KI và hồ tinh bột` })),
  ],
  init(B) {
    Object.assign(B.data, { tube: null, ki: false, starch: false });
    STD.forEach((c, i) => { const L = testedLook(c), v = B.vessel['s' + (i + 1)]; v.setFill(1); v.look(L.hex, L.op); });
    const c = B.opts.sample ?? STD[0]; B.data.tube = sampleTube(c); const L = look(B.data.tube); B.vessel.tS.setFill(1); B.vessel.tS.look(L.hex, L.opacity);
  },
  steps: [
    { id: 'ki', role: 'prepare', label: 'Nhỏ dung dịch KI vào mẫu nước', verb: 'drip', item: 'dKI', into: ['tS'], n: KI_DROPS, drop: dropHex('KI'), // ống hút rời lọ, từng giọt có bộ đếm (T1)
      apply(B) { const rx = dripN(B.data.tube, 'KI', KI_DROPS).find((e) => e.kind === 'reaction'); const L = look(B.data.tube); B.vessel.tS.look(L.hex, L.opacity); B.data.ki = true; B.data.equation = rx ? rx.r.equation : null; } },
    { id: 'starch', role: 'prepare', label: 'Nhỏ hồ tinh bột vào mẫu nước', verb: 'drip', item: 'dS', into: ['tS'], n: STARCH_DROPS, drop: dropHex('tinhbot'),
      apply(B) { const ind = dripN(B.data.tube, 'tinhbot', STARCH_DROPS).find((e) => e.kind === 'indicator'), c = B.opts.sample ?? STD[0], L = look(B.data.tube);
        B.data.starch = ind ? ind.to : 'không đổi màu'; const on = ind && ind.changed !== false; B.vessel.tS.look(on ? mix(CLEAR, L.hex, shade(c)) : L.hex, on ? 0.5 + 0.45 * shade(c) : L.opacity); } },
    { id: 'match', role: 'choose', var: 'match', repeat: true, label: 'Chạm ống chuẩn có màu gần mẫu nhất', verb: 'none',
      options: STD.map((c, i) => ({ v: c, item: 's' + (i + 1), label: fmt(c) + ' mg/L' })) },
  ],
  chem: {
    show(B) {
      B.tag('tS', B.data.starch ? `Mẫu nước máy · hồ tinh bột ${B.data.starch}` : B.data.ki ? 'Mẫu nước máy · đã nhỏ KI' : 'Mẫu nước máy');
      STD.forEach((c, i) => B.tag('s' + (i + 1), B.st.match && B.level.match === c ? `${fmt(c)} · đang chọn` : fmt(c)));
    },
  },
};

// ---------- Dữ liệu nhiệm vụ: đúng tên trường của tài liệu ----------
const waterSource = 'https://vbpl.moj.gov.vn/boyte/Pages/vbpq-toanvan.aspx?ItemID=174190';
const waterRef = 'QCVN 01-1:2024/BYT, Điều 4, nhóm A, thông số 8 và chú thích (*).';
const starchSource = 'https://doi.org/10.3390/molecules27248974';
const starchRef = 'Nghiên cứu quang phổ về phức iodine–iodide–tinh bột, Molecules (2022).';
const disinfectionSource = 'https://www.cdc.gov/drinking-water/about/about-water-disinfection-with-chlorine-and-chloramine.html';
export const application = {
  missionTitle: 'Nước máy nhà mình còn đủ clo không?',
  hook: { revision: 2, q: 'Muốn biết mẫu nước có đạt chỉ tiêu clo dư tự do, em dựa vào đâu?', options: [{ k: 'A', text: 'Đo lượng clo dư tự do rồi so với khoảng quy định' }, { k: 'B', text: 'Kết luận ngay từ mùi của nước' }], answer: 'A',
    why: 'Chỉ tiêu được quy định bằng mg/L. Muốn kết luận, em cần một kết quả đo để so với khoảng cho phép.' },
  context: 'Nước máy được khử trùng bằng clo. Trên đường ống tới nhà, một phần clo vẫn còn lại trong nước, gọi là clo dư. Quy chuẩn nước sạch sinh hoạt đặt một khoảng clo dư mà nước cần có. Phép thử ở trường: clo (Cl₂) đẩy I₂ ra khỏi KI, I₂ làm hồ tinh bột hoá xanh; càng nhiều clo, màu càng đậm.',
  facts: [
    { text: 'Đối với đơn vị cấp nước khử trùng bằng clo, khoảng cho phép của clo dư tự do trong nước sạch sinh hoạt là 0,2–1,0 mg/L.', source: waterRef, sourceUrl: waterSource, status: 'ok', assumed: false },
    { text: 'Cl₂ đẩy I₂ ra khỏi muối KI: Cl₂ + 2I⁻ → 2Cl⁻ + I₂.', sourceUrl: 'https://www.chemguide.co.uk/inorganic/group7/halogensasoas.html', source: 'Chemguide, "Halogens as oxidising agents".', status: 'ok', assumed: false },
    { text: 'Khi mẫu chứa I₂ và I⁻, hồ tinh bột cho màu xanh đậm.', source: starchRef, sourceUrl: starchSource, status: 'ok', assumed: false },
  ],
  textbookLink: { ref: `Hoá học 10 · ${LESSON.book.series} · Chương ${LESSON.book.chapter} · Bài ${LESSON.book.lesson} "${LESSON.book.lessonTitle}" · trang ${LESSON.book.pages}`, kind: 'vị trí bài trong sách (không chép nội dung)' },
  mission: {
    simPreset: { bench: 'mau', samples: STD, standards: STD },
    goal: 'Xác định mẫu nước máy này có đạt chỉ tiêu clo dư tự do hay không: nhỏ KI rồi hồ tinh bột vào mẫu, so màu với dãy ống chuẩn, chọn ống gần nhất, rồi kết luận Đạt hay Không đạt.',
    hiddenReadouts: ['Lượng clo dư trong mẫu (mg/L)'],
    success: { range: [0.2, 1.0], rangeStatus: 'ok', criterion: 'chỉ tiêu clo dư tự do', source: { text: waterRef, url: waterSource }, unit: 'mg/L', need: ['ki', 'starch', 'match'] },
  },
  questions: {
    predict: { q: 'Nếu thay dung dịch KI bằng KBr thì phép thử còn dễ nhìn như vậy không?', options: [{ k: 'A', text: 'Vẫn rõ như cũ' }, { k: 'B', text: 'Kém rõ hơn' }], answer: 'B' },
    compute: { q: 'Mẫu có 0,50 mg/L clo (Cl₂). Phản ứng với KI tạo ra bao nhiêu mg/L I₂?', unit: 'mg/L', answer: 1.79, tol: 0.02 },
    extend: { q: 'Vì sao quy chuẩn đặt cả mức thấp nhất 0,2 mg/L, chứ không chỉ mức cao nhất?' },
  },
  answers: [
    { value: 'Kém rõ hơn', method: 'Cl₂ vẫn đẩy được Br₂ ra khỏi KBr, nhưng hồ tinh bột chỉ đổi màu khi gặp I₂ (kho hoá học của Lab cũng chỉ cho hồ tinh bột nhận I₂), nên mất bước làm màu xanh rõ.' },
    { value: '1,79 mg/L', method: 'Theo tỉ lệ mol 1 : 1 của phương trình Cl₂ + 2KI → 2KCl + I₂.' },
    { value: 'Để nước còn được bảo vệ tới vòi', method: 'Clo còn lại giúp kiểm soát vi sinh vật khi nước đi qua mạng lưới cấp nước. Bài chỉ xét chỉ tiêu clo dư tự do.' },
  ],
  solutionSteps: [
    'Đổi ra số mol: 0,50 mg/L : 70,90 g/mol = 0,00705 mmol/L Cl₂.',
    'Phương trình Cl₂ + 2KI → 2KCl + I₂: 1 mol Cl₂ tạo 1 mol I₂, nên có 0,00705 mmol/L I₂.',
    'Đổi ra khối lượng: 0,00705 mmol/L × 253,8 g/mol ≈ 1,79 mg/L I₂.',
  ],
  media: [{ file: './assets/life13/CHEM10-05.webp', license: 'Ảnh do Lab tạo bằng công cụ sinh ảnh, không chụp nơi hay người thật', credit: 'Lab Khoa Học', alt: 'Vòi nước máy' }],
  sources: [
    { text: 'Chemguide, "Halogens as oxidising agents"', url: 'https://www.chemguide.co.uk/inorganic/group7/halogensasoas.html' },
    { text: waterRef, url: waterSource },
    { text: starchRef, url: starchSource },
    { text: 'CDC · Khử trùng nước trong hệ thống cấp nước', url: disinfectionSource },
  ],
};

// Khuôn chung sinh 6 phần; chấm: ống chuẩn đúng là ống bằng đúng mức ẩn, kết luận Đạt / Không đạt theo khoảng success.range
export const { meta, steps, createLesson } = createMission({ lessonMeta: LESSON, application, bench });
