// MODE THỰC TẾ của bài "Ammonia. Muối ammonium" (CHEM11-04): nhiệm vụ "Một ngày ở Đạm Phú Mỹ" (STEMLabs docs/catalog/ung-dung-thuc-te-hoa-sinh.md mục CHEM11-04;
// DEFINE_SA_BAN.md mục 9.2; chủ 27/11 "Duyệt, giữ tên"). Khuôn: flat/nhiem_vu_muc_tieu.js (kiểu "đặt thông số cho đạt mục tiêu"). Ca trực chạy trên sơ đồ nhà máy 2D (so_do_2d.js).
// Số liệu và nguồn: facts.md mục 6. Lời tự viết, không chép tài liệu STEMLabs hay SGK. Không dùng ảnh hay logo của nhà máy: phần 1 là sơ đồ khối tự vẽ.
import { createTargetMission } from '../../flat/nhiem_vu_muc_tieu.js';
import { createLab2d } from '../../flat/labset2d.js';
import { declaration2d } from './so_do_2d.js';
import { meta as LESSON, lab as DECL, cfgOf } from './giao_an.js';
import { pct, TARGET } from './mo_hinh.js';

const BID = 'haber', ALL = ['valve', 'cut', 'near', 'cat', 'sep', 'loop', 'run'];
const num = (v, d = 0) => Number(v).toLocaleString('vi-VN', { maximumFractionDigits: d });
const p0 = (x) => (x == null ? '—' : pct(x, x < 0.02 ? 1 : 0));
const DPM = { text: 'Đạm Phú Mỹ, Báo cáo thường niên 2024, mục Giới thiệu Tổng công ty', url: 'https://dpm.vn/BCTN-DPM-2024/gioi-thieu-tong-cong-ty.html' };
const WIKI = { text: 'Wikipedia, "Haber process"', url: 'https://en.wikipedia.org/wiki/Haber_process' };
const SGK = { text: 'SGK Hoá học 11 Kết nối tri thức, Bài 5, Hoạt động trang 35 (theo lời giải của VietJack)', url: 'https://www.vietjack.com/hoa-hoc-11-kn/ly-thuyet-bai-5-ammonia-muoi-ammonium.jsp' };

export const application = {
  missionTitle: 'Một ngày ở Đạm Phú Mỹ',
  hook: { q: 'Nhiệt độ thấp cho nhiều NH₃ hơn lúc cân bằng. Vậy sao nhà máy không chạy ở 200 °C cho rẻ?',
    options: [{ k: 'A', text: 'Vì ở 200 °C phản ứng quá chậm: khí đi qua tháp mà gần như chưa kịp thành NH₃' }, { k: 'B', text: 'Vì ở 200 °C lúc cân bằng lại có ít NH₃ hơn ở 450 °C' }],
    answer: 'A', why: 'Lạnh thì cân bằng có lợi cho NH₃ (ý B sai), nhưng phản ứng quá chậm: khí qua tháp mà chưa kịp thành NH₃.' },
  context: 'Em là kĩ sư trực ca ở nhà máy Đạm Phú Mỹ. Nhà máy làm NH₃ từ N₂ và H₂, rồi dùng NH₃ và CO₂ để làm phân urea. Sản lượng NH₃ cả năm chia đều cho các ngày là chỉ tiêu của ca em. Tháp tổng hợp chỉ chuyển hoá một phần khí mỗi lượt, nên nhà máy phải chọn nhiệt độ, áp suất và đưa khí chưa phản ứng quay lại.',
  facts: [
    { text: 'Đạm Phú Mỹ (Bà Rịa – Vũng Tàu) làm 540.000 tấn NH₃ và 800.000 tấn urea mỗi năm; 540.000 ÷ 365 ≈ 1.479 tấn NH₃ mỗi ngày là chỉ tiêu của ca.', source: DPM.text + ' (số 1.479 tấn/ngày do bài tự chia)', sourceUrl: DPM.url, status: 'ok' },
    { text: 'Công nghiệp chạy ở 400–450 °C, 150–200 bar, xúc tác Fe.', source: SGK.text, sourceUrl: SGK.url, status: 'ok' },
    { text: 'Mỗi lượt qua tháp chỉ khoảng 15 % khí thành NH₃; nhờ tuần hoàn, cuối cùng đạt khoảng 97 %.', source: WIKI.text, sourceUrl: WIKI.url, status: 'ok' },
  ],
  textbookLink: { ref: `Hoá học 11 · ${LESSON.book.series} · Bài 1 "Khái niệm về cân bằng hoá học" (câu hỏi 6, 7 trang 10) và Bài ${LESSON.book.lesson} "${LESSON.book.lessonTitle}" (hoạt động trang 35, mục "Em có thể" trang 37)`, kind: 'vị trí bài trong sách (không chép nội dung)' },
  mission: {
    goal: `Đạt ít nhất ${num(TARGET)} tấn NH₃ mỗi ngày với chi phí năng lượng thấp, rồi giải thích vì sao chọn cấu hình đó.`,
    target: { value: TARGET, unit: 'tấn/ngày', label: 'Sản lượng' },
    knobs: [
      { key: 'T', name: 'Nhiệt độ tháp', unit: '°C', range: [200, 700, 10], hint: 'theo sách 400–450 °C' },
      { key: 'p', name: 'Áp suất', unit: 'bar', range: [50, 350, 10], hint: 'theo sách 150–200 bar' },
      { key: 'r', name: 'Tỉ lệ H₂ : N₂', unit: ': 1', range: [1, 5, 0.5], hint: '', dec: 1 },
      { key: 'rec', name: 'Mức tuần hoàn', unit: '%', range: [0, 95, 5], hint: '' },
    ],
    // Kịch bản của tài liệu STEMLabs: lần 1 ở 200 °C, lần 2 ở 450 °C (cùng 200 bar, có Fe, chưa tách, chưa tuần hoàn), lần 3 bật tách NH₃ và tuần hoàn 90 % rồi tự tìm cấu hình
    runs: [
      { short: 'Lần 1 · 200 °C', label: 'Chạy ở 200 °C', cfg: { T: 200, p: 200, r: 3, rec: 0 }, tog: { valve: true }, enable: ['run'],
        note: 'Nhà máy chạy ở 200 °C, 200 bar, có xúc tác Fe, chưa tách NH₃, chưa tuần hoàn. Đoán trước ở bảng phải, rồi bấm Chạy 60 giây.',
        predict: { q: 'Sau 60 giây, lần nào được nhiều NH₃ hơn?', options: [{ k: 'A', text: '200 °C' }, { k: 'B', text: '450 °C' }], answer: 'B',
          why: 'Ở 200 °C sau 60 giây mới được khoảng 1 % NH₃; ở 450 °C đã được khoảng 22 %, dù cân bằng kém hơn.' } },
      { short: 'Lần 2 · 450 °C', label: 'Chạy ở 450 °C', cfg: { T: 450, p: 200, r: 3, rec: 0 }, tog: { valve: true }, enable: ['run'],
        note: 'Giữ mọi thứ như lần 1, chỉ tăng nhiệt độ lên 450 °C. Bấm Chạy 60 giây rồi so với lần 1 trong bảng các lần chạy.' },
      { short: 'Lần 3 · tự chỉnh', label: 'Tách NH₃, tuần hoàn, tự chỉnh', cfg: { T: 450, p: 200, r: 3, rec: 90 }, tog: { valve: true, sep: true, loop: true }, enable: ['sep', 'loop', 'run'], free: ['T', 'p', 'r', 'rec'],
        note: `Làm lạnh đã bật để tách NH₃ lỏng, van tuần hoàn đã mở 90 %. Tự chỉnh nhiệt độ, áp suất, mức tuần hoàn để đạt ít nhất ${num(TARGET)} tấn mỗi ngày, chi phí càng thấp càng tốt.` },
    ],
    // Thành công theo STEMLabs: đạt mục tiêu bằng cấu hình 400–500 °C có tuần hoàn khí, và giải thích được sự đánh đổi giữa cân bằng và tốc độ
    pass: (r) => r.tpd >= TARGET && r.T >= 400 && r.T <= 500 && !!r.sep && r.rec > 0,
    miss: (r) => (r.tpd < TARGET ? `Mới được ${num(r.tpd)} tấn mỗi ngày, còn thiếu ${num(TARGET - r.tpd)} tấn.` : r.T < 400 || r.T > 500 ? `Đủ sản lượng, nhưng ${r.T} °C nằm ngoài khoảng 400–500 °C mà nhiệm vụ yêu cầu.` : 'Đủ sản lượng, nhưng chưa tách NH₃ và tuần hoàn khí.'),
    explain: { q: 'Vì sao cấu hình đạt của em chạy ở 400–500 °C?',
      options: [{ k: 'A', text: 'Chịu thiệt một ít về cân bằng để phản ứng đủ nhanh; khí dư được tuần hoàn' }, { k: 'B', text: 'Nóng hơn thì lúc cân bằng có nhiều NH₃ hơn' }, { k: 'C', text: 'Nóng hơn thì máy nén đỡ tốn năng lượng' }],
      answer: 'A', why: 'Toả nhiệt nên nóng thì cân bằng kém đi, nhưng 200 °C quá chậm. 400–500 °C có Fe đủ nhanh; tách NH₃ và tuần hoàn bù phần thiệt về cân bằng.' },
    readout: (r, k, hide) => (k < 2
      ? { label: 'NH₃ ở cửa ra tháp sau 60 giây', big: hide ? 'ẩn' : r ? p0(r.out) : 'chưa chạy', unit: hide ? 'đoán trước rồi mới chạy' : r ? `${r.T} °C · ${r.p} bar · phản ứng ${r.speed}` : 'bấm Chạy 60 giây' }
      : { label: 'Sản lượng của ca (mô hình)', big: r ? `${num(r.tpd)} t/ngày` : 'chưa chạy', unit: `mục tiêu ${num(TARGET)} t/ngày` }),
    cells: (r) => [['Lúc cân bằng', r ? p0(r.eq) : '—'], ['Sau 60 giây', r ? p0(r.out) : '—'], ['Chi phí năng lượng', r ? String(r.cost) : '—']],
    cols: ['Lần', '°C · bar', 'Sau 60 s', 't/ngày', 'Chi phí'],
    row: (r) => [String(r.run + 1), `${r.T} · ${r.p}${r.rec ? ` · ⟲${r.rec}%` : ''}`, p0(r.out), num(r.tpd), String(r.cost)],
    line: (r) => `${num(r.tpd)} tấn/ngày ở ${r.T} °C, ${r.p} bar, tuần hoàn ${r.rec} %, chi phí ${r.cost}`,
  },
  questions: {
    predict: { q: 'Ở 200 °C so với 450 °C (cùng 200 bar): lúc cân bằng và sau 60 giây, bên nào nhiều NH₃ hơn?',
      options: [{ k: 'A', text: 'Lúc cân bằng 200 °C nhiều hơn; sau 60 giây 450 °C nhiều hơn' }, { k: 'B', text: '200 °C nhiều hơn ở cả hai' }, { k: 'C', text: '450 °C nhiều hơn ở cả hai' }], answer: 'A' },
    compute: { q: 'Làm 800.000 tấn urea mỗi năm cần bao nhiêu tấn NH₃? Phương trình: 2NH₃ + CO₂ → (NH₂)₂CO + H₂O.', unit: 'tấn/năm', answer: 453700, tol: 1500 },
    extend: { q: 'H₂ của nhà máy lấy từ khí thiên nhiên. Việc này thải ra gì, và "ammonia xanh" là gì?' },
  },
  answers: [
    { value: 'A', method: 'Phản ứng toả nhiệt nên lạnh thì cân bằng có nhiều NH₃ hơn. Nhưng lạnh thì phản ứng rất chậm, nên sau 60 giây ở 450 °C lại được nhiều hơn hẳn (lần 1 và lần 2 của ca trực).' },
    { value: 'khoảng 453.700 tấn NH₃ mỗi năm', method: 'Hoá lượng theo tỉ lệ mol của phương trình. Phần NH₃ còn lại dùng cho phân bón khác hoặc bán.' },
    { value: 'Thải CO₂', method: 'Lấy H₂ từ khí thiên nhiên thì sinh ra CO₂, một khí nhà kính (một phần CO₂ này được dùng lại để làm urea). "Ammonia xanh" là NH₃ làm từ H₂ điện phân nước bằng điện mặt trời, điện gió, nên gần như không thải CO₂; khó ở chỗ giá điện và giá thiết bị điện phân.' },
  ],
  solutionSteps: [
    'Khối lượng mol: NH₃ = 17,03 g/mol, urea (NH₂)₂CO = 60,06 g/mol.',
    'Theo phương trình, 2 mol NH₃ cho 1 mol urea, tức 2 × 17,03 = 34,06 tấn NH₃ cho 60,06 tấn urea.',
    'NH₃ cần = 800.000 × 34,06 ÷ 60,06 ≈ 453.700 tấn mỗi năm.',
    'So với 540.000 tấn NH₃ nhà máy làm ra: còn dư khoảng 86.300 tấn.',
    'Tính thêm: 540.000 tấn NH₃ cần khoảng 95.900 tấn H₂ và 444.100 tấn N₂ mỗi năm (theo tỉ lệ 3 H₂ : 1 N₂ : 2 NH₃).',
    'Mỗi lượt qua tháp chuyển hoá khoảng 15 %, nên khí đi qua tháp khoảng 1 ÷ 0,15 ≈ 6,7 lượt mới hết.',
  ],
  media: [{ file: './src/lessons/h11_ammonia/so_do_khoi.svg', license: 'Lab tự vẽ', credit: 'sơ đồ khối do Lab tự vẽ, không phải ảnh nhà máy', alt: 'Sơ đồ khối nhà máy đạm: khí thiên nhiên, H₂, tháp tổng hợp, ngưng tụ, urea, có vòng tuần hoàn khí' }],
  sources: [DPM, WIKI, SGK, { text: 'Bài toán gốc: STEMLabs, "Bài toán ứng dụng thực tế: Hoá học và Sinh học", mục CHEM11-04' }],
};

// Phần mô phỏng: sơ đồ nhà máy 2D của bài, chỉ một bàn. Lần chạy nào đọc từ B.data.last khi số lần chạy tăng.
const sim = {
  create(stageEl) {
    const lab = createLab2d(stageEl, declaration2d(DECL), { bench: BID }), B = lab.benches[BID], U = (id) => B.items[id].obj.userData;
    let seen = 0, rowCb = null, hold = false;
    const run = B.d.steps.find((s) => s.id === 'run'); run.offSay = 'Đoán trước ở bảng phải rồi mới chạy.';
    lab.setActive(BID); lab.setHands(true);
    lab.stage.onFrame(() => {
      const d = B.data, c = cfgOf(B);
      U('sep').setLevel(d.liq || 0);
      U('lens').set({ on: !!d.cut, cat: c.cat, T: c.T, gas: !!d.valve });
      if (d.cut) B.tag('lens', !d.valve ? 'Kính soi · chưa có khí' : `Kính soi · bề mặt Fe ở ${c.T} °C · ${U('lens').made()} NH₃ đã rời đi`);
      if (!hold && d.n > seen && d.last) { seen = d.n; if (rowCb) rowCb({ ...d.last }); }
    });
    return {
      lab, bid: BID, canvas: lab.canvas,
      set({ cfg, tog, enable, hide, target, last }) {
        hold = true;
        ALL.forEach((sid) => lab.enable(BID, sid, true)); // đặt sẵn công tắc trước khi khoá việc (việc đang khoá thì không đặt sẵn được)
        lab.setup(BID, { step: 6, cfg: { ...cfg }, target, lastRow: last, hide });
        lab.preset(BID, [tog.valve && ['valve'], tog.sep && ['sep'], tog.loop && ['loop']].filter(Boolean));
        ALL.forEach((sid) => lab.enable(BID, sid, enable.includes(sid) && !(hide && sid === 'run')));
        seen = B.data.n || 0; hold = false;
        if (B.d.chem.show) B.d.chem.show(B);
      },
      cfg(cfg) { B.opts.cfg = { ...cfg }; if (B.d.chem.show) B.d.chem.show(B); },
      onRow(f) { rowCb = f; },
      live() { const d = B.data; return d.live ? { label: `Đang chạy · giây thứ ${Math.round((d.prog || 0) * 60)}`, big: p0(d.live.r.out * (d.prog || 0)), unit: 'NH₃ ở cửa ra tháp' } : null; },
    };
  },
};

export const { meta, steps, createLesson } = createTargetMission({ lessonMeta: LESSON, application, sim });
