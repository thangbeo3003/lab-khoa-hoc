// Bài: Tốc độ phản ứng, các yếu tố ảnh hưởng (Hoá 10). Nội dung + điều khiển của bài.
// Dữ kiện và giản lược: facts.md. Bản thử, chưa có giáo viên duyệt.
import { h, fmt, seg, stat } from '../../shell/shell.js';
import { RunGraph } from '../../shell/graph.js';
import { LifeRace } from '../../shell/life.js';
import { createBench } from './scene.js';
import { ParticleView } from './particles.js';
import { V_MAX, CAT, createRun, stepRun, simulate } from './model.js';

export const meta = {
  id: 'h10_toc_do_phan_ung_01',
  grade: 'Hoá 10',
  title: 'Tốc độ phản ứng: nhanh hay chậm do đâu?',
  equation: 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O',
  chain: [
    ['Va chạm', 'hạt phải va vào nhau mới phản ứng'],
    ['Va chạm hiệu quả', 'đủ năng lượng mới tạo chất mới'],
    ['Yếu tố', 'nồng độ, nhiệt độ, bề mặt, xúc tác'],
    ['Kết quả', 'tốc độ đổi, lượng sản phẩm không đổi'],
  ],
  disclaimer: 'Bản thử, chưa có giáo viên duyệt. Dụng cụ và phương trình là thật. Minh hoạ: thời gian phản ứng đã rút ngắn, hệ số bề mặt 1 : 3 : 10, γ = 2, mô hình hạt, màu xanh nhạt của acid. Bỏ qua CO₂ tan trong nước; thể tích khí tính ở 25 °C, 1 bar.',
};

export const steps = [
  { short: 'Câu hỏi', view: 'all', tags: null,
    q: 'Bột mì bay lơ lửng gặp tia lửa có thể nổ, bột mì nằm trong bao thì không. Cùng một chất, vì sao phản ứng lúc nhanh lúc chậm?',
    ctx: 'Trong bài này em dùng đá vôi và acid để tự tìm câu trả lời. Khí sinh ra càng nhanh thì phản ứng càng nhanh.' },
  { short: 'Làm quen', view: 'A', tags: 'A',
    q: 'Muốn biết phản ứng nhanh hay chậm, ta đo cái gì?',
    task: 'Chạm vào 5 dụng cụ trên bàn (hoặc bấm vào tên) để xem nhiệm vụ của từng thứ.',
    conclusion: 'Tốc độ phản ứng cho biết lượng chất biến đổi trong một đơn vị thời gian. Ở đây ta theo dõi thể tích khí CO₂ thu được theo thời gian.',
    points: ['Tốc độ trung bình = lượng chất biến đổi : thời gian.', 'Mỗi lần thí nghiệm chỉ đổi một yếu tố và giữ nguyên các yếu tố còn lại thì mới so sánh được.'],
    tip: 'Đề hay hỏi vai trò từng dụng cụ và vì sao phải đậy kín bình khi đo khí.' },
  { short: 'Đoán trước', view: 'A', tags: 'A',
    q: 'Nghiền viên đá vôi thành bột rồi cho vào cùng lượng acid. Chuyện gì sẽ xảy ra?',
    ctx: 'Chưa có đáp án ngay đâu. Em sẽ tự kiểm tra ở bước 4 và bước 9.',
    task: 'Chọn dự đoán của em cho cả hai câu hỏi.' },
  { short: 'Bề mặt', view: 'A', tags: 'A',
    q: 'Cùng 0,30 g đá vôi, viên nguyên và bột mịn phản ứng khác nhau thế nào?',
    ctx: 'Giữ nguyên: acid 1,0 M, 25 °C. Chỉ đổi dạng đá vôi.',
    task: 'Chạy ít nhất 2 lần với 2 dạng đá vôi khác nhau, rồi so các đường trên đồ thị.',
    conclusion: 'Chất rắn càng chia nhỏ, diện tích bề mặt tiếp xúc càng lớn, phản ứng càng nhanh.',
    points: ['Phản ứng chỉ xảy ra ở bề mặt chất rắn, nơi acid chạm được vào.', 'Đập nhỏ không làm tăng lượng chất, chỉ làm lộ thêm bề mặt.', 'Trên đồ thị, đường dốc hơn là phản ứng nhanh hơn.'],
    tip: 'Câu hỏi thực tế hay gặp: vì sao củi chẻ nhỏ dễ cháy hơn, vì sao than tổ ong có nhiều lỗ.' },
  { short: 'Nồng độ', view: 'A', tags: 'A',
    q: 'Acid đặc hơn thì khí ra nhanh hơn bao nhiêu?',
    ctx: 'Giữ nguyên: đá vôi đập vụn, 25 °C. Chỉ đổi nồng độ acid.',
    task: 'Chạy ít nhất 2 nồng độ khác nhau. Để ý ô "Nửa lượng khí sau".',
    conclusion: 'Nồng độ chất phản ứng càng lớn, tốc độ phản ứng càng lớn.',
    points: ['Nồng độ cao hơn nghĩa là cùng một thể tích có nhiều hạt acid hơn, nên va chạm với đá vôi nhiều hơn.', 'Trong mô hình của bài, gấp đôi nồng độ acid thì tốc độ lúc đầu gấp đôi.', 'Với chất khí, tăng áp suất cũng làm tăng nồng độ nên phản ứng nhanh hơn.'],
    tip: 'Lưu ý: acid dư ở cả ba nồng độ, nên tổng lượng khí vẫn do lượng đá vôi quyết định.' },
  { short: 'Nhiệt độ', view: 'A', tags: 'A',
    q: 'Đun ấm thêm 10 °C thì phản ứng nhanh gấp mấy lần?',
    ctx: 'Giữ nguyên: đá vôi đập vụn, acid 1,0 M. Chỉ đổi nhiệt độ.',
    task: 'Chạy ít nhất 2 nhiệt độ khác nhau, rồi so thời gian thu nửa lượng khí.',
    conclusion: 'Nhiệt độ càng cao, tốc độ phản ứng càng lớn. Với nhiều phản ứng, cứ tăng 10 °C thì tốc độ tăng 2 đến 4 lần.',
    points: ['Số lần tốc độ tăng khi thêm 10 °C gọi là hệ số nhiệt độ Van\'t Hoff, kí hiệu γ.', 'Công thức: v₂ : v₁ = γ^((t₂ − t₁) : 10). Bài này đặt γ = 2.', 'Nóng hơn thì hạt chuyển động nhanh hơn: va chạm nhiều hơn và nhiều va chạm đủ năng lượng hơn.'],
    tip: 'Dạng tính hay gặp: cho γ và hai nhiệt độ, hỏi tốc độ tăng mấy lần. Ví dụ γ = 2, tăng 30 °C thì tăng 2³ = 8 lần.' },
  { short: 'Xúc tác', view: 'B', tags: 'B',
    q: 'Không đun, không pha đặc, chỉ thêm một nhúm bột đen: sao bọt lại trào lên?',
    ctx: 'Hai ống nghiệm cùng chứa dung dịch hydrogen peroxide: 2H₂O₂ → 2H₂O + O₂↑',
    task: 'Thêm manganese dioxide (MnO₂) vào ống 2, rồi so với ống 1.',
    conclusion: 'Chất xúc tác làm tăng tốc độ phản ứng nhưng không bị tiêu hao sau phản ứng.',
    points: ['MnO₂ vẫn còn nguyên khối lượng sau phản ứng, có thể lọc ra dùng lại.', 'Chất xúc tác không làm tăng lượng sản phẩm, chỉ giúp đạt tới đó nhanh hơn.', 'Trong cơ thể, enzyme là chất xúc tác của các phản ứng sinh hoá.'],
    tip: 'Chất xúc tác không có mặt trong phương trình tổng, thường được ghi trên mũi tên.' },
  { short: 'Nhìn vào trong', view: 'A', tags: null,
    q: 'Nếu thu nhỏ bằng một hạt, em sẽ thấy gì quanh mẩu đá vôi?',
    ctx: 'Chấm tròn là ion H⁺ của acid, khối xám là đá vôi. Va chạm đủ mạnh thì loé vòng xanh: đó là va chạm hiệu quả.',
    task: 'Đổi ít nhất 2 trong 3 nút và xem số va chạm hiệu quả mỗi giây.',
    conclusion: 'Phản ứng xảy ra khi các hạt va chạm hiệu quả. Yếu tố nào làm tăng số va chạm hiệu quả thì làm tăng tốc độ phản ứng.',
    points: ['Tăng nồng độ: nhiều hạt hơn, va chạm nhiều hơn.', 'Tăng nhiệt độ: hạt nhanh hơn, va chạm nhiều hơn và mạnh hơn.', 'Chia nhỏ chất rắn: nhiều bề mặt hơn để va vào.'],
    tip: 'Khi giải thích, luôn nối yếu tố với số va chạm hiệu quả, đừng chỉ viết "vì nhanh hơn".' },
  { short: 'Sai lầm hay gặp', view: 'A', tags: 'A',
    q: 'Phản ứng nhanh hơn thì có thu được nhiều khí hơn không?',
    ctx: 'Đồ thị dưới đây gom các lần chạy của em ở bước 4, 5, 6.',
    task: 'Bấm "So với dự đoán của em".',
    conclusion: 'Không. Tốc độ quyết định bao lâu thì xong, còn lượng sản phẩm do lượng chất ban đầu quyết định. Mọi đường đều dừng ở 74,4 mL.',
    points: ['0,30 g CaCO₃ = 0,0030 mol → 0,0030 mol CO₂ = 0,0030 × 24,79 L ≈ 74,4 mL (25 °C, 1 bar).', 'Acid dư ở mọi lần chạy, nên đá vôi là chất quyết định lượng khí.', 'Trên đồ thị: độ dốc là tốc độ, độ cao cuối cùng là lượng sản phẩm.'],
    tip: 'Bẫy quen thuộc trong câu đúng/sai: "phản ứng nhanh hơn thì thu được nhiều sản phẩm hơn" là sai với phản ứng một chiều.' },
  { short: 'Kiểm tra', view: 'all', tags: null,
    q: 'Em đã nắm chắc chưa?',
    ctx: '5 câu theo dạng đề tốt nghiệp: nhiều lựa chọn, đúng/sai, trả lời ngắn, và một thử thách trên bàn thí nghiệm.' },
  { short: 'Đời sống', view: 'all', tags: null,
    q: 'Viên sủi bẻ vụn có tan nhanh hơn viên nguyên không?',
    ctx: 'Trong bếp nhà em: hai cốc và hai viên sủi. Viên sủi gặp nước thì sinh khí CO₂, giống đá vôi gặp acid trong phòng thí nghiệm.',
    task: 'Bấm Thả viên sủi để thả vào hai cốc cùng lúc: cốc 1 viên nguyên, cốc 2 viên bẻ vụn. Xem cốc nào tan hết trước.',
    conclusion: 'Bẻ vụn làm tăng diện tích tiếp xúc với nước nên viên sủi tan nhanh hơn. Lượng khí sinh ra vẫn như nhau vì lượng chất không đổi.',
    points: ['Viên sủi chứa một acid hữu cơ và muối hydrogencarbonate. Gặp nước, hai chất tan ra và phản ứng với nhau, sinh khí CO₂.', 'Đây chính là yếu tố diện tích bề mặt em đã thấy với đá vôi viên và đá vôi bột.', 'Pha bằng nước ấm thì viên sủi tan nhanh hơn nữa: đó là yếu tố nhiệt độ.'],
    tip: 'Đề thi hay lấy tình huống đời sống như viên sủi, than tổ ong, tủ lạnh để hỏi yếu tố nào đang ảnh hưởng tới tốc độ phản ứng.' },
];

const FORMS = [{ v: 'vien', label: 'Viên nguyên' }, { v: 'vun', label: 'Đập vụn' }, { v: 'bot', label: 'Bột mịn' }];
const CONCS = [{ v: 0.5, label: '0,5 M' }, { v: 1.0, label: '1,0 M' }, { v: 2.0, label: '2,0 M' }];
const TEMPS = [{ v: 25, label: '25 °C' }, { v: 35, label: '35 °C' }, { v: 45, label: '45 °C' }];
const OPT = { form: FORMS, conc: CONCS, temp: TEMPS };
const LABEL = { form: 'Dạng đá vôi', conc: 'Nồng độ acid', temp: 'Nhiệt độ' };
const SERIES = ['#1F6FEB', '#F08A24', '#1E9E6A']; // đã chạy bộ kiểm màu; luôn kèm nhãn trực tiếp
const RUN_STEPS = {
  3: { vary: ['form'], base: { form: 'vien', conc: 1.0, temp: 25 } },
  4: { vary: ['conc'], base: { form: 'vun', conc: 0.5, temp: 25 } },
  5: { vary: ['temp'], base: { form: 'vun', conc: 1.0, temp: 25 } },
  9: { vary: ['conc', 'temp'], base: { form: 'vien', conc: 1.0, temp: 25 } },
};
const INFO = {
  flask: ['Bình tam giác', 'Nơi đá vôi gặp acid. Miệng bình đậy nút kín để khí không thoát ra ngoài.'],
  acid: ['Lọ hydrochloric acid (HCl)', 'Mỗi lần dùng 20 mL. Nồng độ đổi được: 0,5 M, 1,0 M, 2,0 M.'],
  sample: ['Đá vôi (calcium carbonate, CaCO₃)', 'Mỗi lần dùng 0,30 g. Có 3 dạng: viên nguyên, đập vụn, bột mịn.'],
  syringe: ['Xi-lanh đo khí', 'Khí CO₂ sinh ra đẩy pit-tông. Đọc thể tích khí theo vạch chia, đơn vị mL.'],
  hotplate: ['Bếp điện', 'Giữ acid ở 25, 35 hoặc 45 °C.'],
};
const QUIZ = [
  { type: 'mc', back: 3, text: 'Nghiền đá vôi thành bột làm phản ứng với acid nhanh hơn vì', answer: 0,
    options: ['tăng diện tích bề mặt tiếp xúc.', 'tăng khối lượng đá vôi.', 'tăng nồng độ acid.', 'bột đá vôi là chất xúc tác.'],
    why: 'Chia nhỏ làm lộ thêm bề mặt để acid chạm vào. Khối lượng đá vôi và nồng độ acid không đổi.' },
  { type: 'tf', back: 8, text: 'Mỗi ý sau đúng hay sai?',
    items: [
      ['Đổi acid 0,5 M thành 2,0 M (acid vẫn dư) thì tổng thể tích CO₂ tăng gấp 4.', false],
      ['Với γ = 2, tăng nhiệt độ thêm 20 °C thì tốc độ phản ứng tăng gấp 4.', true],
      ['Sau phản ứng, khối lượng MnO₂ trong ống nghiệm không đổi.', true],
      ['Chất xúc tác làm tăng lượng O₂ thu được từ cùng một lượng H₂O₂.', false],
    ],
    why: 'Nồng độ và xúc tác chỉ đổi tốc độ. Lượng sản phẩm do lượng chất ban đầu quyết định.' },
  { type: 'num', back: 5, text: 'Một phản ứng có γ = 2. Tăng nhiệt độ từ 25 °C lên 55 °C thì tốc độ tăng gấp mấy lần?', answer: 8, tol: 0, unit: 'lần',
    why: '55 − 25 = 30 °C, tức 3 lần tăng 10 °C, nên tốc độ tăng 2³ = 8 lần.' },
  { type: 'num', back: 8, text: 'Cho 0,50 g CaCO₃ vào dung dịch HCl dư. Thu được bao nhiêu mL khí CO₂ ở 25 °C, 1 bar? (1 mol khí chiếm 24,79 L; làm tròn tới hàng đơn vị)', answer: 124, tol: 1, unit: 'mL',
    why: '0,50 g : 100 g/mol = 0,0050 mol CaCO₃ → 0,0050 mol CO₂ → 0,0050 × 24,79 L ≈ 0,124 L = 124 mL.' },
  { type: 'task', back: 5, text: 'Thử thách: chỉ dùng viên nguyên, không nghiền. Chỉnh nồng độ và nhiệt độ để thu được nửa lượng khí (37,2 mL) trong dưới 6 giây.',
    why: 'Phải kết hợp hai yếu tố: acid 2,0 M từ 35 °C trở lên, hoặc acid 1,0 M ở 45 °C.' },
];
const HALF = V_MAX / 2;
// Dữ liệu màn đời sống của bài này. Bài khác chỉ cần đổi khối dữ liệu này; hình do khuôn vẽ bằng code.
const LIFE = {
  title: 'Trong bếp nhà em: viên sủi', factor: 'diện tích bề mặt', doneText: 'Tan hết', speed: 2, gasLabel: 'Khí CO₂ đã thoát ra',
  sides: [
    { label: 'Viên nguyên', form: 'vien', seconds: 24 },
    { label: 'Viên bẻ vụn', form: 'vun', seconds: 8 },
  ],
};

export function createLesson(shell) {
  const bench = createBench(shell.els.stage);
  const data = shell.state.data;
  data.pred = data.pred || { speed: null, total: null };
  const S = {
    step: 0, setup: { form: 'vun', conc: 1.0, temp: 25 }, speed: 1, run: null, running: false, prep: 0, busy: false,
    runs: { 3: [], 4: [], 5: [], 9: [] }, picks: new Set(), lastPick: null,
    cat: { added: false, t: 0 }, pv: { n: 28, temp: 25, pieces: 1 }, pvTouched: new Set(), compared: false,
    quiz: { i: 0, res: [], finished: false },
  };
  let tick = null, pview = null, life = null;

  const optIndex = (k, v) => OPT[k].findIndex((o) => o.v === v);
  const optLabel = (k, v) => OPT[k][optIndex(k, v)].label;
  const runLabel = (step, setup) => RUN_STEPS[step].vary.map((k) => optLabel(k, setup[k])).join(' · ');
  const runColor = (step, setup) => (RUN_STEPS[step].vary.length === 1 ? SERIES[optIndex(RUN_STEPS[step].vary[0], setup[RUN_STEPS[step].vary[0]])] : SERIES[0]);
  const runKey = (step, setup) => RUN_STEPS[step].vary.map((k) => setup[k]).join('|');
  const catLevel = () => (S.cat.added ? Math.exp(-CAT.K_MNO2 * S.cat.t) * Math.min(1, S.cat.t / 0.6) : 0);

  bench.stage.onFrame((dt) => {
    if (S.running && S.run) { stepRun(S.run, dt * S.speed); if (S.run.done) finishRun(); }
    if (S.cat.added) S.cat.t += dt;
    bench.update(dt, { run: S.run, running: S.running, catLevel: catLevel() });
    if (tick) tick(dt);
  });

  // prep: 0 = bình còn rỗng, 1 = đã rót acid. busy = đang có động tác trên bàn.
  function resetRun() { S.run = null; S.running = false; S.prep = 0; S.busy = false; bench.reset(S.setup, false); }
  function doPour() {
    if (S.busy || S.running || S.prep !== 0) return;
    S.busy = true; bench.setTags(null); shell.rerenderPanel(); // ẩn nhãn để nhìn rõ động tác
    bench.pour(() => { S.busy = false; S.prep = 1; bench.setTags('A'); shell.rerenderPanel(); });
  }
  function doDrop() {
    if (S.busy || S.running || S.prep !== 1 || S.run) return;
    S.busy = true; S.run = createRun(S.setup); bench.setTags(null); shell.rerenderPanel();
    bench.drop(S.run, () => { S.busy = false; S.running = true; bench.setTags('A'); shell.rerenderPanel(); });
  }
  // Xong một lần chạy: mang bình ra vòi nước rửa rồi mới làm lại.
  function doRinse() {
    if (S.busy) return;
    S.busy = true; S.running = false; bench.setTags(null); bench.view('sink'); shell.rerenderPanel();
    bench.rinse(() => { resetRun(); bench.setTags('A'); bench.view('A'); shell.rerenderPanel(); });
  }
  const runStepNow = () => (S.step >= 3 && S.step <= 5) || (S.step === 9 && !S.quiz.finished && QUIZ[S.quiz.i].type === 'task');
  function finishRun() {
    S.running = false;
    const step = S.step, list = S.runs[step]; if (!list) return;
    const rec = { setup: { ...S.setup }, key: runKey(step, S.setup), points: S.run.points.slice(), tHalf: S.run.tHalf, tEnd: S.run.t, vEnd: S.run.vGas };
    const at = list.findIndex((r) => r.key === rec.key);
    if (at >= 0) list[at] = rec; else list.push(rec);
    if (list.length > 6) list.shift();
    shell.rerenderPanel(); shell.refresh();
  }
  const distinct = (step, k) => new Set(S.runs[step].map((r) => r.setup[k])).size;
  const challengePassed = () => S.runs[9].some((r) => r.setup.form === 'vien' && r.tHalf != null && r.tHalf < 6);

  bench.onPick((id) => {
    if (S.step === 1 && INFO[id]) { S.picks.add(id); S.lastPick = id; bench.setTags('A', S.picks, id); shell.rerenderPanel(); shell.refresh(); }
    if (S.step === 6 && (id === 'mno2' || id === 'tube2') && !S.cat.added) addCatalyst();
    if (runStepNow()) { if (id === 'acid') doPour(); else if (id === 'sample' || id === 'flask') doDrop(); }
  });
  function addCatalyst() { S.cat = { added: true, t: 0 }; bench.setCatalyst(true); shell.rerenderPanel(); }

  // ---------- Các bảng điều khiển ----------
  function panelIntro(host) {
    host.append(h('div', { class: 'lk-box lk-hero' },
      h('h3', { text: 'Em sẽ làm gì trong bài' }),
      h('ol', {}, ['Làm quen với bàn thí nghiệm và đoán trước kết quả.', 'Tự tay đổi từng yếu tố: bề mặt, nồng độ, nhiệt độ, xúc tác.', 'Phóng to tới hạt để hiểu vì sao.', 'Kiểm tra bằng 5 câu theo dạng đề thi.', 'Xem một ví dụ ngoài đời: viên sủi trong bếp.'].map((t) => h('li', { text: t }))),
      h('button', { class: 'lk-btn is-pri is-wide', type: 'button', onclick: () => shell.go(1) }, 'Vào phòng thí nghiệm')));
  }
  function panelTour(host) {
    host.append(h('ul', { class: 'lk-list' }, Object.entries(INFO).map(([id, [name, text]]) => {
      const done = S.picks.has(id);
      return h('li', { class: done ? 'is-done' : '', onclick: () => { S.picks.add(id); S.lastPick = id; bench.setTags('A', S.picks, id); shell.rerenderPanel(); shell.refresh(); } },
        h('span', { class: 'lk-ck', text: done ? '✓' : '' }), h('div', {}, h('b', { text: name }), done && h('small', { text: text })));
    })), h('p', { class: 'lk-msg', text: `Đã xem ${S.picks.size} / 5 dụng cụ.` }));
  }
  function choice(title, key, options) {
    return [h('div', { class: 'lk-qtext', text: title }), h('div', { class: 'lk-opts' }, options.map(([v, label]) => h('button', {
      type: 'button', class: 'lk-opt' + (data.pred[key] === v ? ' is-on' : ''), onclick: () => { data.pred[key] = v; shell.save(); shell.rerenderPanel(); shell.refresh(); },
    }, label)))];
  }
  function panelPredict(host) {
    host.append(h('div', { class: 'lk-box' },
      choice('1. Khí thoát ra sẽ', 'speed', [['nhanh', 'nhanh hơn'], ['nhu', 'như cũ'], ['cham', 'chậm hơn']]),
      choice('2. Tổng lượng khí thu được sẽ', 'total', [['nhieu', 'nhiều hơn'], ['bang', 'bằng nhau'], ['it', 'ít hơn']]),
      (data.pred.speed && data.pred.total) && h('p', { class: 'lk-msg is-good', text: 'Đã ghi dự đoán. Sang bước sau để tự kiểm tra.' })));
  }

  function panelRun(host, step, extra) {
    const cfg = RUN_STEPS[step], list = S.runs[step];
    shell.els.hud.replaceChildren();
    const hudT = h('b', { text: '0,0' }), hudV = h('b', { text: '0,0' });
    shell.els.hud.append(h('span', { class: 'lk-chip' }, 't ', hudT, ' s'), h('span', { class: 'lk-chip' }, 'V ', hudV, ' mL'));
    cfg.vary.forEach((k) => host.append(seg({
      label: LABEL[k], options: OPT[k], value: S.setup[k], disabled: S.running || S.busy,
      onChange: (v) => { S.setup[k] = v; resetRun(); bench.setSetup(S.setup); shell.rerenderPanel(); },
    })));
    const finished = S.run && S.run.done;
    const hint = S.busy ? 'Đang thao tác…' : S.running ? 'Đang phản ứng, xem pit-tông và đồ thị' : finished ? 'Xong. Đổi điều kiện rồi làm lại để so sánh' : S.prep === 0 ? 'Chạm vào lọ acid để rót vào bình' : 'Chạm vào đĩa đá vôi để thả vào acid';
    shell.els.hud.append(h('span', { class: 'lk-chip is-hint', text: hint }));
    const main = h('button', { class: 'lk-btn is-pri', type: 'button', disabled: S.running || S.busy, onclick: () => { if (finished) doRinse(); else if (S.prep === 0) doPour(); else doDrop(); } },
      S.busy ? 'Đang thao tác…' : S.running ? 'Đang phản ứng…' : finished ? 'Rửa bình ở vòi nước, làm lại' : S.prep === 0 ? '1. Rót acid vào bình' : '2. Thả đá vôi vào acid');
    const again = null;
    host.append(h('div', { class: 'lk-row' }, main, again),
      seg({ label: 'Tốc độ xem', options: [{ v: 1, label: 'Thật' }, { v: 4, label: 'Tua nhanh ×4' }], value: S.speed, onChange: (v) => { S.speed = v; shell.rerenderPanel(); } }));
    const sT = stat('Thời gian', 's'), sV = stat('Thể tích khí', 'mL'), sR = stat('Tốc độ lúc này', 'mL/s'), sH = stat('Nửa lượng khí sau', 's');
    host.append(h('div', { class: 'lk-stats' }, sT.el, sV.el, sR.el, sH.el));
    if (extra) host.append(extra);
    const gHost = h('div');
    const graph = new RunGraph(gHost, { yMax: 80, yTitle: 'thể tích CO₂ (mL)', ref: V_MAX, refLabel: 'tối đa 74,4 mL' });
    const keys = cfg.vary.length === 1
      ? OPT[cfg.vary[0]].map((o, i) => h('span', {}, h('i', { style: `background:${SERIES[i]}` }), o.label))
      : [h('span', {}, h('i', { style: `background:${SERIES[0]}` }), 'lần đang chạy'), h('span', {}, h('i', { style: 'background:#9aa9b6' }), 'các lần trước')];
    host.append(h('div', { class: 'lk-box' }, h('h3', { text: 'Thể tích khí CO₂ theo thời gian' }), gHost, h('div', { class: 'lk-keys' }, keys),
      list.length > 0 && h('table', { class: 'lk-table' },
        h('thead', {}, h('tr', {}, ['Lần chạy', 'Nửa khí sau (s)', 'Tốc độ TB (mL/s)', 'Tổng khí (mL)'].map((t) => h('th', { text: t })))),
        h('tbody', {}, list.map((r) => h('tr', {}, h('td', {}, h('i', { style: `background:${runColor(step, r.setup)}` }), runLabel(step, r.setup)), h('td', { text: fmt(r.tHalf, 1) }), h('td', { text: fmt(HALF / r.tHalf, 1) }), h('td', { text: fmt(r.vEnd, 1) })))))));
    const multi = cfg.vary.length > 1;
    const series = () => {
      const liveKey = S.run ? runKey(step, S.setup) : null;
      const out = list.filter((r) => !(S.run && r.key === liveKey)).map((r) => ({ points: r.points, color: multi ? '#9aa9b6' : runColor(step, r.setup), label: multi ? '' : runLabel(step, r.setup), thin: multi }));
      if (S.run) out.push({ points: S.run.points, color: runColor(step, S.setup), label: runLabel(step, S.setup), live: S.running });
      return out;
    };
    let acc = 1;
    tick = (dt) => {
      const r = S.run, t = r ? r.t : 0, v = r ? r.vGas : 0;
      const a = fmt(t, 1), b = fmt(v, 1);
      sT.set(a); sV.set(b); hudT.textContent = a; hudV.textContent = b;
      sR.set(r && S.running ? fmt(r.rate, 1) : r ? '0,0' : '–'); sH.set(r && r.tHalf != null ? fmt(r.tHalf, 1) : '–');
      acc += dt; if (acc > 0.12 || !S.running) { if (acc > 0.12) { graph.set(series()); acc = 0; } }
    };
    graph.set(series());
  }

  function panelCatalyst(host) {
    const m1 = h('i'), m2 = h('i'), left = stat('H₂O₂ còn lại ở ống 2', '%'), mass = stat('MnO₂ trong ống 2', 'g');
    host.append(
      h('div', { class: 'lk-row' },
        h('button', { class: 'lk-btn is-pri', type: 'button', disabled: S.cat.added, onclick: addCatalyst }, S.cat.added ? 'Đã thêm MnO₂' : 'Thêm MnO₂ vào ống 2'),
        S.cat.added && h('button', { class: 'lk-btn', type: 'button', onclick: () => { S.cat = { added: false, t: 0 }; bench.setCatalyst(false); shell.rerenderPanel(); shell.refresh(); } }, 'Làm lại')),
      h('div', { class: 'lk-box' }, h('h3', { text: 'Độ mạnh của bọt khí O₂' }),
        h('div', { class: 'lk-label' }, 'Ống 1: chỉ có H₂O₂', h('small', { text: 'gần như không thấy bọt' })), h('div', { class: 'lk-meter' }, m1),
        h('div', { class: 'lk-label', style: 'margin-top:10px' }, 'Ống 2: H₂O₂ + MnO₂', h('small', { text: S.cat.added ? 'sủi mạnh rồi yếu dần' : 'chưa thêm xúc tác' })), h('div', { class: 'lk-meter' }, m2)),
      h('div', { class: 'lk-stats' }, left.el, mass.el),
      h('p', { class: 'lk-msg', text: 'Em cũng có thể chạm thẳng vào lọ manganese dioxide trên bàn để thêm.' }));
    let told = false;
    tick = () => {
      m2.style.width = Math.round(catLevel() * 100) + '%'; m1.style.width = '1%';
      left.set(S.cat.added ? fmt(Math.exp(-CAT.K_MNO2 * S.cat.t) * 100, 0) : '100'); mass.set(S.cat.added ? '0,10' : '0');
      if (!told && S.cat.added && S.cat.t > 4) { told = true; shell.refresh(); }
    };
  }

  function panelParticles(host) {
    const ov = shell.els.overlay; ov.hidden = false;
    const cv = h('canvas');
    ov.replaceChildren(h('h3', { text: 'Kính phóng to: quanh mẩu đá vôi trong acid (minh hoạ)' }), cv,
      h('div', { class: 'lk-legend' }, h('span', {}, h('i', { style: 'background:#fff;border:2px solid #f08a24' }), 'ion H⁺'), h('span', {}, h('i', { style: 'background:#ffe2c2;border:2px solid #f08a24' }), 'H⁺ đủ năng lượng'), h('span', {}, h('i', { style: 'border:2px solid #1e9e6a' }), 'va chạm hiệu quả')));
    pview = new ParticleView(cv); pview.setParams(S.pv); pview.start();
    const set = (k, v) => { S.pv[k] = v; S.pvTouched.add(k); pview.setParams(S.pv); shell.rerenderPanelKeep(); shell.refresh(); };
    host.append(
      seg({ label: 'Nồng độ acid', options: [{ v: 14, label: 'Loãng' }, { v: 28, label: 'Vừa' }, { v: 56, label: 'Đặc' }], value: S.pv.n, onChange: (v) => set('n', v) }),
      seg({ label: 'Nhiệt độ', options: TEMPS, value: S.pv.temp, onChange: (v) => set('temp', v) }),
      seg({ label: 'Đá vôi', options: [{ v: 1, label: '1 khối' }, { v: 4, label: '4 mảnh' }, { v: 16, label: '16 mảnh' }], value: S.pv.pieces, hint: 'cùng một lượng chất', onChange: (v) => set('pieces', v) }));
    const sHit = stat('Va chạm với đá vôi', 'lần/s'), sEff = stat('Va chạm hiệu quả', 'lần/s');
    host.append(h('div', { class: 'lk-stats' }, sHit.el, sEff.el), h('p', { class: 'lk-msg', text: 'Số đếm lấy trung bình 4 giây gần nhất, nên đổi nút xong hãy chờ vài giây.' }));
    let acc = 0;
    tick = (dt) => { if (window.__FILM) pview.step(dt); acc += dt; if (acc < 0.3) return; acc = 0; const s = pview.stats(); sHit.set(fmt(s.hits, 1)); sEff.set(fmt(s.eff, 1)); };
  }

  function panelMisconception(host) {
    const mine = [3, 4, 5].flatMap((st) => S.runs[st].map((r) => ({ points: r.points, color: '#1F6FEB', thin: true })));
    const useRef = mine.length < 3;
    const series = useRef ? ['vien', 'vun', 'bot'].map((form) => ({ points: simulate({ form, conc: 1.0, temp: 25 }).points, color: '#1F6FEB', thin: true })) : mine;
    const gHost = h('div'), graph = new RunGraph(gHost, { yMax: 80, yTitle: 'thể tích CO₂ (mL)', ref: V_MAX, refLabel: 'mọi đường dừng ở 74,4 mL' });
    host.append(h('div', { class: 'lk-box' }, h('h3', { text: useRef ? 'Ba đường mẫu (em chưa chạy đủ 3 lần)' : `${mine.length} lần chạy của em` }), gHost,
      h('div', { class: 'lk-keys' }, h('span', {}, h('i', { style: 'background:#1F6FEB' }), 'mỗi đường là một lần chạy'))));
    graph.set(series);
    const P = data.pred, sp = { nhanh: 'nhanh hơn', nhu: 'như cũ', cham: 'chậm hơn' }, to = { nhieu: 'nhiều hơn', bang: 'bằng nhau', it: 'ít hơn' };
    const line = (label, said, ok, truth) => h('p', { class: 'lk-msg ' + (ok ? 'is-good' : 'is-bad') }, `${label}: em đoán "${said}". ${ok ? 'Đúng.' : `Chưa đúng, thực tế là ${truth}.`}`);
    host.append(h('button', { class: 'lk-btn is-acc is-wide', type: 'button', onclick: () => { S.compared = true; shell.rerenderPanel(); shell.refresh(); } }, 'So với dự đoán của em'));
    if (S.compared) {
      host.append(h('div', { class: 'lk-box' }, (P.speed && P.total)
        ? [line('Khí thoát ra', sp[P.speed], P.speed === 'nhanh', 'nhanh hơn'), line('Tổng lượng khí', to[P.total], P.total === 'bang', 'bằng nhau')]
        : h('p', { class: 'lk-msg', text: 'Em chưa ghi dự đoán ở bước 3. Đáp án: nghiền thành bột thì khí ra nhanh hơn, nhưng tổng lượng khí bằng nhau.' })));
    }
    tick = null;
  }

  // Màn đời sống: khuôn motion HTML dùng chung, phủ lên khung cảnh.
  function panelKitchen(host) {
    if (!life) {
      const box = h('div', { class: 'lf-host' });
      shell.els.overlay.replaceChildren(box); shell.els.overlay.hidden = false;
      life = new LifeRace(box, LIFE);
    }
    host.append(h('button', { class: 'lk-btn is-pri is-wide', type: 'button', disabled: life.playing, onclick: () => { life.play(); shell.rerenderPanel(); } },
      life.playing ? 'Đang sủi…' : life.done ? 'Xem lại' : 'Thả viên sủi'));
    const [a, b] = LIFE.sides;
    if (life.done) host.append(h('p', { class: 'lk-msg is-good', text: `${b.label} tan nhanh gấp ${fmt(a.seconds / b.seconds, 0)} lần ${a.label.toLowerCase()}, vì bề mặt tiếp xúc với nước lớn hơn.` }));
    host.append(h('p', { class: 'lk-msg', text: 'Thời gian tan là số minh hoạ, cùng tỉ lệ bề mặt 1 : 3 như thí nghiệm đá vôi. Ngoài thật tuỳ loại viên sủi và nhiệt độ nước.' }));
    let was = life.playing;
    tick = (dt) => { life.advance(dt); if (was && !life.playing) { was = false; S.lifeDone = true; shell.rerenderPanel(); shell.refresh(); } };
  }

  function panelQuiz(host) {
    const Q = S.quiz, total = QUIZ.length;
    if (!Q.finished && QUIZ[Q.i].type === 'task' && !Q.res[Q.i] && challengePassed()) Q.res[Q.i] = { score: 1 };
    const score = Q.res.reduce((a, r) => a + (r ? r.score : 0), 0);
    shell.setScore(Q.res.length ? `Điểm ${fmt(score, score % 1 ? 2 : 0)} / ${total}` : '');
    if (Q.finished) {
      host.append(h('div', { class: 'lk-box' }, h('h3', { text: 'Xong bài' }),
        h('p', { class: 'lk-qtext', text: `Em được ${fmt(score, score % 1 ? 2 : 0)} / ${total} điểm.` }),
        h('p', { class: 'lk-msg', text: 'Áp dụng ngoài đời: thức ăn để tủ lạnh lâu hỏng hơn vì nhiệt độ thấp làm các phản ứng gây hỏng chậm lại. Bột mì bay lơ lửng dễ nổ vì từng hạt bột đều lộ bề mặt ra không khí.' }),
        h('button', { class: 'lk-btn is-wide', type: 'button', onclick: () => { S.quiz = { i: 0, res: [], finished: false }; S.runs[9] = []; shell.rerenderPanel(); shell.refresh(); } }, 'Làm lại bài kiểm tra')));
      tick = null; return;
    }
    const q = QUIZ[Q.i], res = Q.res[Q.i];
    const box = h('div', { class: 'lk-box' }, h('div', { class: 'lk-qhead', text: `Câu ${Q.i + 1} / ${total}` }), h('div', { class: 'lk-qtext', text: q.text }));
    const answer = (sc, extra = {}) => { Q.res[Q.i] = { score: sc, ...extra }; shell.rerenderPanel(); };
    const after = () => res && [
      h('p', { class: 'lk-msg ' + (res.score >= 1 ? 'is-good' : 'is-bad'), text: res.score >= 1 ? 'Đúng.' : res.score > 0 ? `Đúng ${Math.round(res.score * 4)} / 4 ý.` : 'Chưa đúng.' }),
      h('p', { class: 'lk-msg', text: q.why }),
      h('div', { class: 'lk-row' },
        res.score < 1 && h('button', { class: 'lk-btn', type: 'button', onclick: () => shell.go(q.back) }, `Xem lại bước ${q.back + 1}`),
        h('button', { class: 'lk-btn is-pri', type: 'button', onclick: () => { if (Q.i + 1 >= total) Q.finished = true; else Q.i++; resetRun(); shell.go(9); } }, Q.i + 1 >= total ? 'Xem kết quả' : 'Câu tiếp')),
    ];
    if (q.type === 'mc') {
      box.append(h('div', { class: 'lk-opts' }, q.options.map((o, i) => h('button', {
        type: 'button', disabled: !!res, class: 'lk-opt' + (res ? (i === q.answer ? ' is-right' : res.pick === i ? ' is-wrong' : '') : ''),
        onclick: () => answer(i === q.answer ? 1 : 0, { pick: i }),
      }, h('b', { text: 'ABCD'[i] }), o))));
      box.append(...(after() || []));
    } else if (q.type === 'tf') {
      Q.tf = Q.tf || {};
      const grid = h('div', { class: 'lk-tf' });
      q.items.forEach(([text, truth], i) => {
        const cls = res ? (Q.tf[i] === truth ? 'is-right' : 'is-wrong') : '';
        grid.append(h('div', { class: cls }, `${'abcd'[i]}) ${text}${res ? (truth ? ' (Đúng)' : ' (Sai)') : ''}`),
          h('div', { class: 'lk-seg' }, [[true, 'Đúng'], [false, 'Sai']].map(([v, l]) => h('button', { type: 'button', disabled: !!res, class: Q.tf[i] === v ? 'is-on' : '', onclick: () => { Q.tf[i] = v; shell.rerenderPanel(); } }, l))));
      });
      box.append(grid);
      if (!res) box.append(h('button', { class: 'lk-btn is-pri is-wide', type: 'button', disabled: q.items.some((_, i) => Q.tf[i] === undefined), onclick: () => answer(q.items.filter(([, t], i) => Q.tf[i] === t).length / 4) }, 'Chấm'));
      box.append(...(after() || []));
    } else if (q.type === 'num') {
      const inp = h('input', { class: 'lk-input', inputmode: 'decimal', placeholder: `Nhập số (${q.unit})`, disabled: !!res, value: res ? res.raw : '' });
      const submit = () => { const x = parseFloat(String(inp.value).replace(',', '.')); if (Number.isNaN(x)) return; answer(Math.abs(x - q.answer) <= q.tol ? 1 : 0, { raw: inp.value }); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      box.append(inp);
      if (!res) box.append(h('button', { class: 'lk-btn is-pri is-wide', type: 'button', onclick: submit }, 'Trả lời'));
      else box.append(h('p', { class: 'lk-msg', text: `Đáp án: ${q.answer} ${q.unit}.` }));
      box.append(...(after() || []));
    } else {
      const ok = challengePassed();
      if (ok && !res) Q.res[Q.i] = { score: 1 };
      const tried = S.runs[9].length;
      box.append(h('p', { class: 'lk-msg ' + (ok ? 'is-good' : ''), text: ok ? 'Đạt thử thách.' : tried ? `Chưa đạt. Lần gần nhất: nửa lượng khí sau ${fmt(S.runs[9][tried - 1].tHalf, 1)} s. Thử kết hợp cả hai yếu tố.` : 'Chỉnh nồng độ và nhiệt độ ở dưới rồi thả đá vôi.' }));
      if (ok) box.append(h('p', { class: 'lk-msg', text: q.why }), h('button', { class: 'lk-btn is-pri is-wide', type: 'button', onclick: () => { Q.finished = true; resetRun(); shell.go(9); } }, 'Xem kết quả'));
      else if (tried >= 3) box.append(h('div', { class: 'lk-row' }, h('button', { class: 'lk-btn', type: 'button', onclick: () => shell.go(q.back) }, `Xem lại bước ${q.back + 1}`), h('button', { class: 'lk-btn', type: 'button', onclick: () => { Q.res[Q.i] = { score: 0 }; Q.finished = true; resetRun(); shell.go(9); } }, 'Bỏ qua')));
      host.append(box);
      panelRun(host, 9);
      return;
    }
    host.append(box); tick = null;
  }

  // Vẽ lại bảng điều khiển của bước 8 mà không dựng lại lớp phủ hạt.
  shell.rerenderPanelKeep = () => {
    const keep = pview; shell.els.panel.replaceChildren();
    pview = null; renderPanelInner(S.step, shell.els.panel, keep);
  };
  function renderPanelInner(i, host, keepView) {
    if (i === 7 && keepView) {
      pview = keepView;
      const set = (k, v) => { S.pv[k] = v; S.pvTouched.add(k); pview.setParams(S.pv); shell.rerenderPanelKeep(); shell.refresh(); };
      host.append(
        seg({ label: 'Nồng độ acid', options: [{ v: 14, label: 'Loãng' }, { v: 28, label: 'Vừa' }, { v: 56, label: 'Đặc' }], value: S.pv.n, onChange: (v) => set('n', v) }),
        seg({ label: 'Nhiệt độ', options: TEMPS, value: S.pv.temp, onChange: (v) => set('temp', v) }),
        seg({ label: 'Đá vôi', options: [{ v: 1, label: '1 khối' }, { v: 4, label: '4 mảnh' }, { v: 16, label: '16 mảnh' }], value: S.pv.pieces, hint: 'cùng một lượng chất', onChange: (v) => set('pieces', v) }));
      const sHit = stat('Va chạm với đá vôi', 'lần/s'), sEff = stat('Va chạm hiệu quả', 'lần/s');
      host.append(h('div', { class: 'lk-stats' }, sHit.el, sEff.el), h('p', { class: 'lk-msg', text: 'Số đếm lấy trung bình 4 giây gần nhất, nên đổi nút xong hãy chờ vài giây.' }));
      let acc = 0;
      tick = (dt) => { if (window.__FILM) pview.step(dt); acc += dt; if (acc < 0.3) return; acc = 0; const s = pview.stats(); sHit.set(fmt(s.hits, 1)); sEff.set(fmt(s.eff, 1)); };
      return;
    }
    tick = null;
    if (i === 0) panelIntro(host);
    else if (i === 1) panelTour(host);
    else if (i === 2) panelPredict(host);
    else if (i >= 3 && i <= 5) panelRun(host, i);
    else if (i === 6) panelCatalyst(host);
    else if (i === 7) panelParticles(host);
    else if (i === 8) panelMisconception(host);
    else if (i === 10) panelKitchen(host);
    else panelQuiz(host);
  }

  return {
    bench, state: S,
    enter(i) {
      S.step = i; S.running = false; S.run = null; tick = null;
      if (pview) { pview.stop(); pview = null; }
      const cfg = RUN_STEPS[i];
      const taskNow = i === 9 && !S.quiz.finished && QUIZ[S.quiz.i].type === 'task';
      S.setup = { ...((i !== 9 || taskNow) && cfg ? cfg.base : { form: 'vun', conc: 1.0, temp: 25 }) }; S.speed = 1;
      S.prep = 0; S.busy = false;
      bench.setSetup(S.setup); bench.reset(S.setup, !((i >= 3 && i <= 5) || taskNow));
      if (i !== 6) { S.cat = { added: false, t: 0 }; bench.setCatalyst(false); }
      life = null; shell.els.stage.parentElement.classList.toggle('is-life', i === 10);
      bench.view(taskNow ? 'A' : steps[i].view);
      bench.setTags(taskNow ? 'A' : steps[i].tags, i === 1 ? S.picks : new Set(), i === 1 ? S.lastPick : null);
      if (i !== 9) shell.setScore(S.quiz.res.length ? shell.els.score.textContent : '');
    },
    renderPanel(i, host) { if (i !== 7 && pview) { pview.stop(); pview = null; } renderPanelInner(i, host, null); },
    isDone(i) {
      if (i === 0) return shell.state.step > 0 || S.picks.size > 0;
      if (i === 1) return S.picks.size >= 5;
      if (i === 2) return !!(data.pred.speed && data.pred.total);
      if (i === 3) return distinct(3, 'form') >= 2;
      if (i === 4) return distinct(4, 'conc') >= 2;
      if (i === 5) return distinct(5, 'temp') >= 2;
      if (i === 6) return S.cat.added && S.cat.t > 4;
      if (i === 7) return S.pvTouched.size >= 2;
      if (i === 8) return S.compared;
      if (i === 9) return S.quiz.finished;
      return !!S.lifeDone;
    },
  };
}
