// GIÁO ÁN của bài "Tốc độ phản ứng" (Hoá 10), bản 3: MỘT phòng lab, BỐN bàn, mỗi bàn một bộ thí nghiệm đầy đủ (LUONG_1_BAI_HOC.md mục 2.21 đến 2.25).
// Tệp này chỉ KHAI: món nào từ tủ đồ lên bàn nào, đứng ở đâu, giữ vai gì trong các việc (đong, cân, chuẩn bị, chọn điều kiện, khởi động), phản ứng hiện ra sao, đo gì, ghi gì.
// Bộ máy dựng phòng, hoạt cảnh tay và nút sinh đôi nằm ở kit/labset.js và shell/labui.js, dùng chung cho mọi bài.
// LUẬT của bài (chủ duyệt 20/11): bình thí nghiệm LUÔN khác bình đối chứng đúng MỘT thứ, không có lựa chọn trùng đối chứng.
//   Lượng chất (mL, gam) ở bàn 3 và bàn 4 do học sinh TỰ CHỌN con số (kéo thanh hoặc nhập số), chỉ bị chặn bởi sức chứa của dụng cụ, và áp CHUNG cho cả hai bình.
//   Lần đầu lấy mức của bài (REF3). Chọn quá tay thì bàn vẫn chạy và hiện đúng hậu quả (acid hết trước, xi-lanh đầy).
// Dữ kiện và nguồn: facts.md cùng thư mục. Chưa có giáo viên duyệt.
import { fmt } from '../../shell/shell.js';
import { REF, CONC, tConc, tTemp, tCat, kCat, lensSetup } from '../h10_toc_do_phan_ung_02/model2.js';
import { REF3, RANGE3, FULL, TEMPS, WINDOW_CAT, run3, gasAt3, rateAt3, gasO2, tFullO2, limit3, surfWindow, surfState } from './model3.js';

// Con số của mô hình (mức nhiệt, cửa sổ đo, sức chứa xi-lanh, lượng khí) nằm ở model3.js và có kiểm thử; tệp này chỉ dùng lại.
export { REF, REF3, WINDOW_CAT, lensSetup, tConc, tTemp, tCat, run3, gasAt3 };
const clamp = (x) => Math.min(1, Math.max(0, x)), sm = (p) => p * p * (3 - 2 * p);
export const fmtT = (t) => (t >= 3600 ? `${fmt(t / 3600, 1)} giờ` : `${fmt(t, 1)} s`);
export const g2 = (m) => fmt(m, 2) + ' g';
const STONE = 0x8d8676;
const R0 = rateAt3(run3('vun', REF3.mass, REF3.vAcid), 1);
// Mặt số đồng hồ trên bàn chỉ đổi tối đa khoảng 5 lần mỗi giây (đổi ở mọi khung hình thì số nhảy loạn, nhìn như nháy); lần cuối luôn hiện đúng số chốt.
const setT = (B, t, last = false) => { const now = performance.now(); if (!last && B._tAt && now - B._tAt < 190) return; B._tAt = now; B.clock(t); };
// Nhãn ống đong: đang chứa bao nhiêu, và đó là mấy phần bằng nhau (để không lẫn tổng với lượng của mỗi bình)
const cylTag = (B, what, per) => { const mL = Math.round(B.read('cyl')), n = B.solo ? 1 : 2; return `Ống đong · ${mL} mL ${what}` + (mL > 0 && n > 1 && mL === n * per ? ` (${n} bình × ${per} mL)` : ''); };
// Bình tam giác: mực chất lỏng theo thể tích rót vào (5 mL thấp, 50 mL cao nhất)
const fillOf = (mL) => 0.35 + 0.65 * clamp((mL - 5) / 45);

export const meta = {
  id: 'h10_toc_do_phan_ung_03',
  grade: 'Hoá 10',
  // Bài này thuộc đâu trong sách (chủ 25/11: "phải ghi rõ ra nó thuộc khối nào, bài nào"), theo danh mục STEMLabs catalog/hoa-hoc.csv
  book: { code: 'CHEM10-04', series: 'Kết nối tri thức', chapter: 6, chapterTitle: 'Tốc độ phản ứng', lesson: 19, lessonTitle: 'Tốc độ phản ứng', pages: '95–99' },
  title: 'Tốc độ phản ứng: nhanh hay chậm do đâu?',
  equation: 'tốc độ = lượng chất biến đổi : thời gian',
  layout: 'full',
  chain: [
    ['Thước đo', 'nhanh chậm thành con số'],
    ['4 bàn thí nghiệm', 'mỗi lần chỉ đổi một thứ'],
    ['Va chạm hiệu quả', 'vì sao nhanh lên'],
    ['Ngoài đời', 'chỉnh được nhanh chậm'],
  ],
  mainQuestion: 'Cùng một chất, muốn phản ứng nhanh lên hay chậm lại thì đổi cái gì?',
  disclaimer: 'Bản dựng thử, chưa có giáo viên duyệt. Thí nghiệm và nồng độ theo bài 19 Hoá 10 Kết nối tri thức (lấy qua trang giải bài, chưa đối chiếu sách in). KHÁC SÁCH: đá vôi 0,30 g thay cho khoảng 2 g, H₂O₂ đã pha loãng, để khí vừa xi-lanh 100 mL. Lượng khí tối đa tính từ phương trình. Thời gian ở cả bốn bàn là SỐ MINH HOẠ do mô hình tính, đã rút ngắn so với thật. Mô hình hạt trên tivi là minh hoạ.',
};

// bench: bàn của bước. link: mắt xích của chuỗi nhân quả. todo: việc của bước.
export const steps = [
  { short: 'Xem cả phòng', bench: null, link: [0, 1, 2, 3],
    q: 'Bột mì nằm trong bao thì không sao, bụi bột mì bay lơ lửng gặp tia lửa lại có thể nổ. Cùng một chất, sao lúc chậm lúc nhanh?',
    todo: 'Kéo để xoay nhìn quanh phòng, hoặc chạm vào một bàn để tới gần xem bàn đó có gì.' },
  { short: 'Thước đo', bench: 'surf', link: 0, q: 'Hai bình cùng sủi bọt: một bình đá vôi viên, một bình đá vôi đập nhỏ. Làm sao nói được bình nào nhanh hơn, nhanh gấp mấy lần, bằng con số?',
    todo: 'Bàn đã đong sẵn 20 mL acid mỗi bình và cân sẵn 0,30 g đá vôi mỗi đĩa: bình trái đá vôi viên, bình phải đá vôi đập nhỏ. Chạm vào bình (hoặc bấm nút số 4) để thả đá vôi vào cả hai bình, rồi nhìn hai pit-tông, số mL khí và đồng hồ.' },
  { short: 'Nồng độ', bench: 'conc', link: 1, q: 'Hai bình giống hệt nhau. Rót vào bình bên phải dung dịch đặc hơn thì chữ X mất sớm hơn hay muộn hơn?',
    todo: 'Làm đủ một vòng: rót, chọn lọ đặc hơn cho bình thí nghiệm, rót acid, đọc đồng hồ, rửa bình. Làm 2 lần với 2 lọ khác nhau (0,10 M và 0,30 M).' },
  { short: 'Nhiệt độ', bench: 'temp', link: 1, q: 'Không thêm chất nào, chỉ đun nóng ống bên phải thì nó hoá hồng sớm hơn bao nhiêu?',
    todo: 'Làm 2 lần với 2 nhiệt độ khác nhau cho ống thí nghiệm. Chạm đèn cồn: mỗi lần chạm nóng thêm 10 °C.' },
  { short: 'Bề mặt', bench: 'surf', link: 1, q: 'Cùng một lượng đá vôi, đập nhỏ ra thì khí thoát nhanh hơn không, và có ra nhiều khí hơn không?',
    todo: 'Bình trái nhận đá vôi viên, bình phải nhận đá vôi đập nhỏ, cùng số gam, cùng lượng acid. Đong acid, rót, cân đá vôi, thả, rồi so hai xi-lanh và hai đường trên đồ thị.' },
  { short: 'Xúc tác', bench: 'cat', link: 1, q: 'Giữ nguyên tất cả, chỉ thêm một thìa bột đen vào bình bên phải, sao bọt lại trào lên?',
    todo: 'Đong H₂O₂, rót vào hai bình, xúc một thìa MnO₂ cho bình thí nghiệm, đậy nút. So hai xi-lanh sau ' + WINDOW_CAT + ' giây.' },
  { short: 'Nhìn vào trong', bench: 'lens', link: 2, q: 'Bốn bàn đổi bốn thứ khác hẳn nhau, sao thứ nào cũng làm phản ứng nhanh lên?',
    todo: 'Bật lần lượt ít nhất 3 công tắc, mỗi lần nhìn tivi trên tường và số va chạm hiệu quả mỗi giây.' },
  { short: 'Thao tác sai', bench: 'conc', link: 1, q: 'Đổi hai thứ cùng một lúc thì có biết thứ nào làm nhanh lên không?',
    todo: 'Cố tình làm sai: ngoài việc chọn lọ đặc hơn, còn làm ấm bình thí nghiệm trên bếp điện, rồi chạy thử.' },
  { short: 'Đời sống', bench: null, link: 3, q: 'Viên sủi bẻ vụn có tan nhanh hơn viên nguyên không? Từ đó trả lời câu hỏi bột mì.',
    todo: 'Gạt "Thả viên sủi" để thả cùng lúc một viên nguyên và một viên bẻ vụn.' },
  { short: 'Sát hạch', bench: 'conc', link: [0, 1, 2, 3], q: 'Sát hạch: làm một lần chạy mà chữ X của bình thí nghiệm mất sau 14 đến 16 giây.',
    todo: 'Tự chọn lọ Na₂S₂O₃ và nhiệt độ trên bếp điện, chạy thử, đọc đồng hồ. Chưa trúng thì rửa bình và chỉnh lại.' },
];

const SINK = { id: 'sink', kind: 'sink', at: [3.35, 1.5], tag: 'Vòi nước: rửa dụng cụ' };
// Bình tia nước cất: bàn nào cũng có, để tráng dụng cụ sau khi rửa ở vòi (chủ 20/11: "trên bàn phải có nước cất để tráng cốc nữa chứ")
const WASH = { id: 'wash', kind: 'wash', at: [2.55, 0.25], tag: 'Nước cất: tráng dụng cụ' };
// Món có "of" thuộc về một bình: bước chỉ dùng một bình thì món của bình kia được cất đi.
const PAIR = [{ id: 'ref', kind: 'flask', at: [-0.62, 0], of: 'ref' }, { id: 'exp', kind: 'flask', at: [0.62, 0], of: 'exp' }];
const RIGS = [
  { id: 'rigRef', kind: 'gasrig', at: [-0.62, 0], of: 'ref', opts: { dir: -1 }, tag: 'Đối chứng · khí 0,0 mL', tagAt: [-1.1, 2.55, 0] },
  { id: 'rigExp', kind: 'gasrig', at: [0.62, 0], of: 'exp', opts: { dir: 1 }, tag: 'Thí nghiệm · khí 0,0 mL', tagAt: [1.1, 2.55, 0] },
];
const CYL = { id: 'cyl', kind: 'cylinder', at: [-2.35, 1.0], opts: { h: 1.6, r: 0.17 }, tag: 'Ống đong · 0 mL', tagAt: [0, 1.62, 0] }; // ống đong 100 mL loại thấp: đỉnh và nhãn nằm dưới xi-lanh, không che thang chia
const TIMER = { id: 'timer', kind: 'timer', at: [-1.5, 1.6], ry: 0.2, tag: 'Đồng hồ' };
const TIMER_SAY = 'Đồng hồ tự chạy khi phản ứng bắt đầu.';
const VIEW_GAS = { target: [0.12, 1.2, 0.35], w: 8.0, h: 3.2, el: 13 };
// LƯỢNG TỰ CHỌN: khoảng dưới đây là sức chứa của dụng cụ trên bàn, không phải khoảng "cho phép" của bài.
// Ống đong 100 mL chia cho hai bình nên mỗi bình tối đa 50 mL; cân đọc tới 0,01 g.
const RANGE = {
  vAcid: { ...RANGE3.vAcid, unit: 'mL', per: ' mỗi bình', act: 'Đong', limit: 'tối đa 50 mL (ống đong 100 mL)' },
  mass: { ...RANGE3.mass, digits: 2, unit: 'g', per: ' mỗi bình', act: 'Cân', limit: 'tối đa 2,00 g' },
  vPerox: { ...RANGE3.vPerox, unit: 'mL', per: ' mỗi bình', act: 'Đong', limit: 'tối đa 50 mL (ống đong 100 mL)' },
};
const gasTag = (v) => (v >= FULL ? 'khí 100 mL, xi-lanh ĐẦY' : `khí ${fmt(v, 1)} mL`);

export const lab = {
  // Phần chỉ có nghĩa ở 3D (kit/labset.js đọc lab.mode3d): căn phòng, đồ tạo không khí, khung toàn cảnh. view của bàn và at của món vẫn nằm ở chỗ cũ.
  mode3d: {
    // Căn phòng: ảnh phòng lab thật trên bốn bức tường (bộ ảnh của bản 1), mặt bàn đen như bàn phòng lab; tường tối đi khi áp sát một bàn (dim) để dụng cụ nổi lên.
    // Ảnh tường lấy ở assets/env_v3/: như bộ ảnh của bản 1 nhưng tường sau đã bỏ kệ chai lọ cho gọn (chủ 20/11: "gọn hơn xíu, bỏ vài cái dư thừa").
    room: { photo: './assets/env_v3/', top: 0x1b1e21, dim: 0.72 },
    // Đồ tạo không khí: chỉ đặt quanh phòng, không chạm được, không nằm trên bàn thí nghiệm. at = [x, z] trên sàn.
    props: [
      // Vị trí chọn sao cho KHÔNG món nào lọt vào sau lưng dụng cụ ở bốn khung cận: cây treo áo và xe đẩy ở hai góc xa của tường sau,
      // hai ghế đẩu đứng ở lối giữa, cạnh hai bàn hàng trước (toàn cảnh thấy ghế; bốn khung cận và khung tivi đều không chiếu tới).
      { kind: 'stool', at: [-2.2, 5.2], opts: { color: 0x4b5563 } }, { kind: 'stool', at: [2.3, 4.6], opts: { color: 0x4b5563 } },
      { kind: 'coatstand', at: [-22.0, -17.6], ry: 0.5 }, // lùi sát góc trái: ở khung chuẩn của bàn 1 cây treo áo không còn đứng thẳng sau lọ hoá chất
      { kind: 'trolley', at: [18.6, -17.2], ry: -0.2 },
    ],
    // 20/11 khuya, chủ: "cho khoảng cách các bàn cách nhau xa hơn 1 xíu": tâm bàn (±9,0; ±5,9) thay cho (±7,7; ±4,8)
    // Bốn bàn kéo giãn ra bốn phía (không sát hẳn góc phòng, để ở toàn cảnh mỗi bàn còn đủ to); giữa phòng trống, nhìn thẳng tới tivi trên tường sau
    overview: { target: [0, 2.7, -2.5], w: 31.0, h: 22.4, el: 22, az: 0, fov: 40, maxDist: 80, cy: 0.5 }, // máy quay thấp hơn trước để thấy trọn tivi trên tường sau
  },
  benches: [
    // ---------- Bàn 1 · Nồng độ: Na₂S₂O₃ + H₂SO₄ trên giấy chữ X ----------
    { id: 'conc', name: 'Bàn 1 · Nồng độ', short: 'Nồng độ', color: '#087b91', at: [-9.0, -5.9], ref: { conc: REF.conc, temp: REF.temp },
      eq: 'Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O',
      cond: (B) => (B.level.temp !== REF.temp ? 'cùng lượng acid · ĐANG KHÁC HAI THỨ: nồng độ và nhiệt độ' : 'cùng lượng acid · cùng 25 °C · chỉ khác nồng độ Na₂S₂O₃'),
      text: 'Hai bình đặt trên giấy có chữ X. Rót sodium thiosulfate rồi rót sulfuric acid: bình đục dần tới lúc không còn thấy chữ X.', note: 'Khí SO₂ độc: ngoài thật phải làm ở nơi thoáng.',
      view: { target: [0.3, 0.95, 0.25], w: 8.5, h: 2.7, el: 17, az: -5 },
      items: [
        { id: 'pRef', kind: 'xpaper', at: [-0.62, 0.05], opts: { s: 1.12 } }, { id: 'pExp', kind: 'xpaper', at: [0.62, 0.05], opts: { s: 1.12 } },
        { id: 'ref', kind: 'flask', at: [-0.62, 0.012, 0.05], tag: 'Đối chứng · bình rỗng' }, { id: 'exp', kind: 'flask', at: [0.62, 0.012, 0.05], tag: 'Thí nghiệm · bình rỗng' },
        ...CONC.map((c, n) => ({ id: 'b' + n, kind: 'bottle', at: [-3.4 + n * 0.85, -0.85], opts: { title: 'Na₂S₂O₃', sub: fmt(c, 2) + ' M', name: 'Sodium thiosulfate' }, tag: `Na₂S₂O₃ ${fmt(c, 2)} M` + (n ? '' : ' (đối chứng)') })),
        { id: 'acid', kind: 'bottle', at: [1.7, -0.85], opts: { title: 'H₂SO₄', sub: '0,5 M', name: 'Sulfuric acid' }, tag: 'H₂SO₄ 0,5 M' },
        { id: 'timer', kind: 'timer', at: [-1.95, 1.05], ry: 0.2, tag: 'Đồng hồ', say: TIMER_SAY },
        { id: 'plate', kind: 'hotplate', at: [3.05, -0.95], tag: 'Bếp điện' },
        SINK, { ...WASH, at: [2.1, 1.55] }, // bàn này có bếp điện phía sau nên bình nước cất đứng phía trước, cạnh chậu
      ],
      steps: [
        { id: 'ref', role: 'prepare', label: 'Rót Na₂S₂O₃ 0,05 M vào bình đối chứng', verb: 'pour', item: 'b0', into: ['ref'], fill: [0, 0.7] },
        { id: 'conc', role: 'choose', var: 'conc', label: 'Chọn lọ đặc hơn, rót vào bình thí nghiệm', verb: 'pour', into: ['exp'], fill: [0, 0.7],
          options: CONC.slice(1).map((c, n) => ({ v: c, item: 'b' + (n + 1), label: fmt(c, 2) + ' M' })) },
        { id: 'temp', role: 'choose', var: 'temp', optional: true, off: true, repeat: true, needs: ['conc'], label: 'Làm ấm bình thí nghiệm trên bếp điện', verb: 'warm', item: 'plate', vessel: 'exp',
          offSay: 'Bếp điện chỉ dùng ở bước Thao tác sai và Sát hạch. Ở bước này mỗi lần chỉ đổi một thứ: nồng độ.',
          options: TEMPS.map((t) => ({ v: t, label: t + ' °C' })), show: (B, t) => B.tag('exp', `Thí nghiệm · ${fmt(B.level.conc, 2)} M · ${Math.round(t)} °C`) },
        { id: 'go', role: 'start', label: 'Rót H₂SO₄ vào cả hai bình (đồng hồ chạy)', verb: 'pour', item: 'acid', into: ['ref', 'exp'], fill: [0.7, 1] },
      ],
      rinse: { sink: 'sink', wash: 'wash', label: 'Rửa ở vòi, tráng nước cất, làm lại' },
      cols: ['Bình thí nghiệm', 'Mất chữ X sau', 'Đối chứng', 'Nhanh gấp'],
      chem: {
        speed: 14,
        times: (B) => [tConc(B.level), tConc(REF)],
        // Mốc báo XONG của từng bình: tag = nhãn đổi màu và nháy, ring = vòng sáng nháy, at = thời điểm (giây của mô hình), say = lời báo
        marks(B) { const [te, tr] = this.times(B); return [{ tag: 'exp', ring: 'exp', at: te, say: `Bình thí nghiệm XONG: chữ X đã mất sau ${fmtT(te)}.` }, { tag: 'ref', ring: 'ref', at: tr, say: `Bình đối chứng XONG: chữ X đã mất sau ${fmtT(tr)}.` }]; },
        show(B) {
          const [te, tr] = this.times(B), t = B.run ? B.run.t : -1, hot = B.level.temp !== REF.temp ? ` · ${B.level.temp} °C` : '';
          B.tag('ref', t >= tr ? `Đối chứng · mất chữ X sau ${fmtT(tr)}` : B.st.ref ? 'Đối chứng · 0,05 M · 25 °C' : 'Đối chứng · bình rỗng');
          B.tag('exp', t >= te ? `Thí nghiệm · mất chữ X sau ${fmtT(te)}` : B.st.conc ? `Thí nghiệm · ${fmt(B.level.conc, 2)} M${hot || ' · 25 °C'}` : 'Thí nghiệm · bình rỗng');
        },
        frame(B, t) {
          const [te, tr] = this.times(B);
          [[B.vessel.ref, tr], [B.vessel.exp, te]].forEach(([v, tx]) => v.tint(0xd8c56a, sm(clamp(t / tx)), { opacity: 1, rough: 0.85 })); // lưu huỳnh làm dung dịch đục vàng nhạt
          const fin = t >= Math.max(te, tr) * 1.02; setT(B, Math.min(t, Math.max(te, tr)), fin); this.show(B);
          return { done: fin };
        },
        row(B) { const [te, tr] = this.times(B); return { key: `${B.level.conc}|${B.level.temp}`, level: { ...B.level }, te, tr, cond: fmt(B.level.conc, 2) + ' M' + (B.level.temp !== REF.temp ? ` · ${B.level.temp} °C` : ''), exp: fmtT(te), ref: fmtT(tr), ratio: fmt(tr / te, 1) + ' lần' }; },
        read(B) {
          const [te, tr] = this.times(B), t = B.run ? Math.min(B.run.t, Math.max(te, tr)) : 0, go = !!B.run;
          return { label: 'Đồng hồ: giây từ lúc rót acid', big: fmt(t, 1), unit: 's', cells: [['Thí nghiệm', go && t >= te ? fmtT(te) : 'chưa mất'], ['Đối chứng', go && t >= tr ? fmtT(tr) : 'chưa mất'], ['Nhanh gấp', go && B.run.done ? fmt(tr / te, 1) + ' lần' : '–']] };
        },
      } },

    // ---------- Bàn 2 · Nhiệt độ: Mg + nước có phenolphthalein, ống thí nghiệm kẹp trên đèn cồn ----------
    { id: 'temp', name: 'Bàn 2 · Nhiệt độ', short: 'Nhiệt độ', color: '#c2410c', at: [9.0, -5.9], ref: { temp: REF.temp }, prefill: true, tagY: 3.9,
      eq: 'Mg + 2H₂O → Mg(OH)₂ + H₂↑', cond: 'cùng lượng Mg và nước · chỉ khác nhiệt độ',
      text: 'Hai ống nghiệm đựng nước: ống đối chứng trên giá, ống thí nghiệm kẹp phía trên đèn cồn. Nhỏ phenolphthalein, thả magnesium: dung dịch hoá hồng khi phản ứng đã xảy ra.',
      view: { target: [0.25, 1.6, 0.4], w: 7.6, h: 3.9, el: 12, az: 5 },
      items: [
        { id: 'rack', kind: 'rack', at: [-1.3, 0] },
        { id: 'ref', kind: 'tube', at: [-1.3, 0.025, 0.22], tag: 'Đối chứng · 25 °C', tagAt: [0, 2.05, 0], pick: false },
        { id: 'thRef', kind: 'thermo', in: 'ref', at: [0.02, 0.12, 0] },
        { id: 'clamp', kind: 'clamp', at: [0.7, 0.2], opts: { y: 2.6 } },
        { id: 'exp', kind: 'tube', at: [0.7, 1.42, 0.2], tag: 'Thí nghiệm · chưa đun', tagAt: [0, 2.05, 0], pick: false, fixed: true },
        { id: 'thExp', kind: 'thermo', in: 'exp', at: [0.02, 0.12, 0] },
        { id: 'lamp', kind: 'lamp', at: [0.7, 0.2], tag: 'Đèn cồn' },
        { id: 'pp', kind: 'dropper', at: [-2.9, 0.9], opts: { title: 'PP', name: 'Phenolphthalein' }, tag: 'Phenolphthalein' },
        { id: 'mg', kind: 'dish', at: [-0.35, 1.3], opts: { chem: 'Mg', n: 2 }, tag: 'Dây magnesium (2 đoạn bằng nhau)' },
        { id: 'timer', kind: 'timer', at: [2.15, 1.0], ry: -0.2, tag: 'Đồng hồ', say: TIMER_SAY },
        { ...SINK, tag: 'Vòi nước: rửa ống' }, { ...WASH, at: [2.95, 0.15] },
      ],
      steps: [
        { id: 'pp', role: 'prepare', label: 'Nhỏ phenolphthalein vào hai ống nước', verb: 'pour', thin: true, item: 'pp', into: ['ref', 'exp'], fill: [1, 1] },
        { id: 'temp', role: 'choose', var: 'temp', repeat: true, label: 'Đun ống thí nghiệm bằng đèn cồn tới', verb: 'heat', item: 'lamp', thermo: 'thExp',
          options: TEMPS.map((t) => ({ v: t, label: t + ' °C' })), show: (B, t) => B.tag('exp', `Thí nghiệm · ${Math.round(t)} °C`) },
        { id: 'go', role: 'start', label: 'Thả dây Mg vào cả hai ống (đồng hồ chạy)', verb: 'drop', item: 'mg', pieces: [['mg', 'ref'], ['mg', 'exp']],
          solid: { chem: 'Mg', scale: 0.36, rot: { z: 1.25 } } },
      ],
      rinse: { sink: 'sink', wash: 'wash', label: 'Rửa ở vòi, tráng nước cất, làm lại' },
      cols: ['Ống thí nghiệm', 'Hoá hồng sau', 'Đối chứng', 'Nhanh gấp'],
      chem: {
        speed: 11,
        times: (B) => [tTemp(B.level), tTemp(REF)],
        marks(B) { const [te, tr] = this.times(B); return [{ tag: 'exp', ring: 'lamp', at: te, say: `Ống thí nghiệm XONG: đã hoá hồng sau ${fmtT(te)}.` }, { tag: 'ref', at: tr, say: `Ống đối chứng XONG: đã hoá hồng sau ${fmtT(tr)}.` }]; },
        show(B) {
          const [te, tr] = this.times(B), t = B.run ? B.run.t : -1;
          B.tag('ref', t >= tr ? `Đối chứng · hồng sau ${fmtT(tr)}` : 'Đối chứng · 25 °C');
          B.tag('exp', t >= te ? `Thí nghiệm · hồng sau ${fmtT(te)}` : B.st.temp ? `Thí nghiệm · ${B.level.temp} °C` : 'Thí nghiệm · chưa đun');
        },
        frame(B, t) {
          const [te, tr] = this.times(B), p = (tx) => clamp((t / tx - 0.55) / 0.45);
          [[B.vessel.ref, tr], [B.vessel.exp, te]].forEach(([v, tx]) => { v.tint(0xff5c9f, p(tx), { opacity: 0.85 }); v.bubbles = 0.25; });
          const fin = t >= Math.max(te, tr) * 1.02; setT(B, Math.min(t, Math.max(te, tr)), fin); this.show(B);
          return { done: fin };
        },
        row(B) { const [te, tr] = this.times(B); return { key: String(B.level.temp), level: { ...B.level }, te, tr, cond: B.level.temp + ' °C', exp: fmtT(te), ref: fmtT(tr), ratio: fmt(tr / te, 1) + ' lần' }; },
        read(B) {
          const [te, tr] = this.times(B), t = B.run ? Math.min(B.run.t, Math.max(te, tr)) : 0, go = !!B.run;
          return { label: 'Đồng hồ: giây từ lúc thả Mg', big: fmt(t, 1), unit: 's', cells: [['Thí nghiệm', go && t >= te ? fmtT(te) : 'chưa hồng'], ['Đối chứng', go && t >= tr ? fmtT(tr) : 'chưa hồng'], ['Nhanh gấp', go && B.run.done ? fmt(tr / te, 1) + ' lần' : '–']] };
        },
      } },

    // ---------- Bàn 3 · Bề mặt: CaCO₃ + HCl. Bình trái đá vôi viên, bình phải đá vôi đập nhỏ; cùng số gam, cùng lượng acid; mỗi bình một xi-lanh đo khí ----------
    { id: 'surf', name: 'Bàn 3 · Bề mặt', short: 'Bề mặt', color: '#6254f4', at: [-9.0, 5.9], ref: { vAcid: REF3.vAcid, mass: REF3.mass },
      eq: 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O',
      cond: (B) => `${B.solo ? 'trong bình:' : 'mỗi bình'} ${B.st.vol ? B.level.vAcid + ' mL' : 'chưa đong'} HCl 0,5 M · ${B.st.mass ? g2(B.level.mass) : 'chưa cân'} đá vôi · 25 °C` + (B.solo ? '' : ' · chỉ khác cỡ hạt'),
      text: 'Hai bình cùng lượng hydrochloric acid và cùng số gam đá vôi: bình trái đá vôi viên, bình phải đá vôi đập nhỏ. Mỗi bình nối một xi-lanh: khí sinh ra đẩy pit-tông nên đọc được thể tích khí.',
      view: { ...VIEW_GAS, az: -5 }, viewSolo: { target: [-1.35, 1.2, 0.35], w: 5.6, h: 3.2, el: 13, az: -5 },
      items: [
        ...PAIR, ...RIGS,
        { id: 'hcl', kind: 'bottle', at: [-3.3, 0.35], opts: { title: 'HCl', sub: '0,5 M', name: 'Hydrochloric acid' }, tag: 'HCl 0,5 M' },
        CYL, { ...TIMER, say: TIMER_SAY },
        { id: 'dRef', kind: 'dish', at: [-0.62, 1.2], of: 'ref', opts: { form: 'vien' }, tag: 'Đá vôi viên' },
        { id: 'dExp', kind: 'dish', at: [0.62, 1.2], of: 'exp', opts: { form: 'vun' }, tag: 'Đá vôi đập nhỏ' },
        { id: 'scale', kind: 'balance', at: [1.95, 1.4], tag: 'Cân' },
        SINK, WASH,
      ],
      steps: [
        { id: 'vol', role: 'choose', var: 'vAcid', repeat: true, until: 'fill', label: 'Đong HCl vào ống đong: tự chọn lượng', verb: 'measure', item: 'hcl', tool: 'cyl', range: RANGE.vAcid },
        { id: 'fill', role: 'prepare', label: 'Rót từ ống đong vào bình, chia đều', verb: 'pour', item: 'cyl', into: ['ref', 'exp'], front: true, drain: true, fill: (B) => [0, fillOf(B.level.vAcid)] },
        { id: 'mass', role: 'choose', var: 'mass', repeat: true, label: 'Cân đá vôi: tự chọn số gam', verb: 'weigh', item: 'scale', dishes: ['dRef', 'dExp'], range: RANGE.mass },
        { id: 'go', role: 'start', label: 'Thả đá vôi vào bình, đậy nút', verb: 'drop', items: ['ref', 'exp', 'dRef', 'dExp'], ring: ['ref', 'exp'], rigs: ['rigRef', 'rigExp'],
          pieces: [['dRef', 'ref', 'vien'], ['dExp', 'exp', 'vun']], solid: { color: STONE, size: (B) => 0.95 * Math.min(1.3, Math.cbrt(B.level.mass / REF3.mass)) } },
      ],
      rinse: { sink: 'sink', wash: 'wash', rigs: ['rigRef', 'rigExp'], label: 'Rửa ở vòi, tráng nước cất, làm lại' },
      cols: ['Lượng mỗi bình', 'Đập nhỏ: nửa khí sau', 'Viên', 'Nhanh gấp'],
      chem: {
        runs: (B) => [run3('vun', B.level.mass, B.level.vAcid), run3('vien', B.level.mass, B.level.vAcid)], // [thí nghiệm, đối chứng]
        window(B) { const [e, r] = this.runs(B); return surfWindow(B.solo ? [r] : [e, r]); }, // tối đa 260 s của mô hình (model3.js)
        speed(B) { return this.window(B) / 8.5; }, // mọi lần chạy dài khoảng 8,5 giây thật
        // Hai bình lúc cửa sổ đo đóng: w (giây), lim (lượng khí theo phương trình, chất hết trước), se và sr = { state: 'full' | 'done' | 'slow', v, at } của bình thí nghiệm và bình đối chứng.
        // Chỉ nói "XONG" hay "ĐẦY" cho điều đã hiện trên đồng hồ trong cửa sổ; bình còn ra khí chậm khi hết giờ đo ('slow') thì nói đúng như vậy.
        ends(B) { const [e, r] = this.runs(B), w = this.window(B), lim = limit3(B.level.mass, B.level.vAcid); return { w, lim, se: surfState(e, w, lim), sr: surfState(r, w, lim) }; },
        marks(B) {
          const { w, lim, se, sr } = this.ends(B), why = lim.by === 'acid' ? 'acid đã hết' : lim.by === 'vuadu' ? 'acid và đá vôi cùng hết' : 'đá vôi đã tan hết';
          const one = (s, tag, ring, who) => (s.state === 'slow' ? { tag, ring, at: null } // chưa xong trong cửa sổ đo: không báo XONG (lời báo nằm ở dòng kết quả)
            : { tag, ring, at: Math.min(w * 0.995, s.at ?? w * 0.995), say: s.state === 'full' ? `${who}: xi-lanh ĐẦY ở 100 mL sau ${fmtT(s.at)}, không đo tiếp được.` : `${who} XONG: ${why}, khí ngừng ra ở ${fmt(lim.vEnd, 1)} mL.` });
          return B.solo ? [one(sr, 'rigRef', 'ref', 'Bình')] : [one(se, 'rigExp', 'exp', 'Bình thí nghiệm (đập nhỏ)'), one(sr, 'rigRef', 'ref', 'Bình đối chứng (viên)')];
        },
        show(B) {
          const [e, r] = this.runs(B), t = B.run ? B.run.t : 0, m = B.st.mass ? ' ' + g2(B.level.mass) : '';
          B.tag('rigRef', `${B.solo ? 'Xi-lanh' : 'Đối chứng'} · ${gasTag(gasAt3(r, t))}`); B.tag('rigExp', `Thí nghiệm · ${gasTag(gasAt3(e, t))}`);
          B.tag('dRef', 'Đá vôi viên' + m); B.tag('dExp', 'Đá vôi đập nhỏ' + m);
          B.tag('cyl', cylTag(B, 'HCl', B.level.vAcid)); B.tag('scale', B.st.mass ? `Cân · ${g2(B.level.mass)} mỗi đĩa` : 'Cân');
        },
        frame(B, t) {
          const [e, r] = this.runs(B);
          [['ref', r, 'rigRef'], ['exp', e, 'rigExp']].forEach(([k, run, rig]) => {
            if (B.solo && k !== B.solo) return;
            const vol = gasAt3(run, t), v = B.vessel[k], left = 1 - vol / run.vMax;
            B.gas(rig, vol); v.solid(left); v.bubbles = clamp(rateAt3(run, t) / R0);
          });
          const w = this.window(B); setT(B, Math.min(t, w), t >= w); this.show(B);
          return { done: t >= w };
        },
        // Một dòng kết quả. Bốn trường hợp: bình thường (đá tan hết) · acid hết trước (left: đá còn thừa) · khí vượt 100 mL (over: xi-lanh đầy, không đọc được lượng khí cuối)
        // · hết giờ đo mà khí còn ra chậm (slow). vEnd, vRef: thể tích đọc được lúc cửa sổ đóng (thí nghiệm, đối chứng); vHalf: nửa lượng khí mà "nửa khí sau" nói tới; w: độ dài cửa sổ đo.
        row(B) {
          const [e, r] = this.runs(B), { w, lim, se, sr } = this.ends(B), cond = `${g2(B.level.mass)} · ${B.level.vAcid} mL`, base = { key: cond, level: { ...B.level }, cond, w }, left = lim.by === 'acid';
          if (B.solo) return sr.state === 'full' ? { ...base, solo: true, over: true, te: sr.at, tr: sr.at, vEnd: FULL, exp: '(không dùng)', ref: `đầy sau ${fmtT(sr.at)}`, ratio: '–' }
            : { ...base, solo: true, left, slow: sr.state === 'slow', te: r.tHalf, tr: r.tHalf, vEnd: sr.v, vHalf: r.vEnd / 2, exp: '(không dùng)', ref: fmtT(r.tHalf), ratio: '–' };
          if (se.state === 'full') { const tr = sr.state === 'full' ? sr.at : null; // bình viên chưa đầy trong cửa sổ đo thì ghi số mL đọc được, không ghi thời gian chưa từng hiện trên đồng hồ
            return { ...base, over: true, te: se.at, tr: tr || se.at, vEnd: FULL, vRef: sr.v, exp: `đầy sau ${fmtT(se.at)}`, ref: tr ? `đầy sau ${fmtT(tr)}` : `${fmt(sr.v, 1)} mL sau ${fmt(w, 0)} s`, ratio: tr ? fmt(tr / se.at, 1) + ' lần' : '–' }; }
          return { ...base, left, slow: se.state === 'slow' || sr.state === 'slow', te: e.tHalf, tr: r.tHalf, vEnd: se.v, vHalf: e.vEnd / 2, vRef: sr.v, exp: fmtT(e.tHalf), ref: fmtT(r.tHalf), ratio: fmt(r.tHalf / e.tHalf, 1) + ' lần' };
        },
        series(B) { const [e, r] = this.runs(B); return B.solo ? [{ run: r, color: '#475569', label: 'đá vôi viên' }] : [{ run: r, color: '#475569', label: 'viên' }, { run: e, color: '#6254f4', label: 'đập nhỏ' }]; },
        read(B) {
          const [e, r] = this.runs(B), t = B.run ? Math.min(B.run.t, this.window(B)) : 0, go = !!B.run, ve = gasAt3(e, t), vr = gasAt3(r, t), { se, sr } = this.ends(B);
          // Bình sẽ làm xi-lanh đầy trong giờ đo thì KHÔNG có "nửa lượng khí" để đọc (lượng khí cuối vượt 100 mL): thẻ để trống tới lúc đầy, rồi ghi thời điểm đầy.
          // Tốc độ trung bình khi đó tính trên 100 mL và thời gian tới lúc đầy, khớp với kết luận bước Thước đo.
          const mid = (run, s) => (s.state === 'full' ? (go && t >= s.at ? ['Khí đầy sau', fmtT(s.at)] : ['Nửa khí sau', '–']) : ['Nửa khí sau', go && t >= run.tHalf ? fmtT(run.tHalf) : '–']);
          if (B.solo) return { label: 'Khí CO₂ trong xi-lanh', big: fmt(Math.min(vr, FULL), 1), unit: vr >= FULL ? 'mL (đầy)' : 'mL', cells: [['Đồng hồ', fmt(t, 1) + ' s'], mid(r, sr),
            ['Tốc độ TB', sr.state === 'full' ? (go && t >= sr.at ? fmt(FULL / sr.at, 2) + ' mL/s' : '–') : go && t >= r.tHalf ? fmt(r.vEnd / 2 / r.tHalf, 2) + ' mL/s' : '–']] };
          return { label: 'Khí CO₂ trong xi-lanh thí nghiệm (đập nhỏ)', big: fmt(Math.min(ve, FULL), 1), unit: ve >= FULL ? 'mL (đầy)' : 'mL', cells: [['Đồng hồ', fmt(t, 1) + ' s'], ['Đối chứng', fmt(Math.min(vr, FULL), 1) + ' mL'], mid(e, se)] };
        },
      } },

    // ---------- Bàn 4 · Xúc tác: H₂O₂ ở cả hai bình, bình thí nghiệm thêm một thìa MnO₂ ----------
    { id: 'cat', name: 'Bàn 4 · Xúc tác', short: 'Xúc tác', color: '#14624f', at: [9.0, 5.9], ref: { vPerox: REF3.vPerox },
      eq: '2H₂O₂ → 2H₂O + O₂↑', cond: (B) => `mỗi bình ${B.st.vol ? B.level.vPerox + ' mL' : 'chưa đong'} dung dịch H₂O₂ · 25 °C · chỉ khác có hay không có MnO₂`,
      text: 'Hai bình cùng lượng hydrogen peroxide, mỗi bình nối một xi-lanh đo khí oxygen. Bình trái để nguyên, bình phải thêm một thìa bột manganese dioxide.',
      view: { ...VIEW_GAS, az: 5 },
      items: [
        ...PAIR, ...RIGS,
        { id: 'h2o2', kind: 'bottle', at: [-3.3, 0.35], opts: { title: 'H₂O₂', sub: 'dung dịch', name: 'Hydrogen peroxide', amber: true }, tag: 'H₂O₂' },
        CYL, TIMER,
        { id: 'mno2', kind: 'jar', at: [2.0, 1.25], opts: { title: 'MnO₂', sub: 'bột', name: 'Manganese dioxide', content: 0x1a1a1c }, tag: 'Bột MnO₂ (xúc tác)' },
        { id: 'spatula', kind: 'spatula', at: [1.25, 1.55], ry: Math.PI - 0.12, tag: 'Thìa xúc' },
        SINK, { ...WASH, at: [2.95, 0.15] }, // bình tia lệch hẳn sang phải lọ MnO₂: hai món có nhãn không đứng thẳng hàng trước sau (chủ 21/11)
      ],
      steps: [
        { id: 'vol', role: 'choose', var: 'vPerox', repeat: true, until: 'fill', label: 'Đong H₂O₂ vào ống đong: tự chọn lượng', verb: 'measure', item: 'h2o2', tool: 'cyl', range: RANGE.vPerox },
        { id: 'fill', role: 'prepare', label: 'Rót từ ống đong vào hai bình, chia đều', verb: 'pour', item: 'cyl', into: ['ref', 'exp'], front: true, drain: true, fill: (B) => [0, fillOf(B.level.vPerox)] },
        { id: 'scoop', role: 'prepare', label: 'Xúc một thìa MnO₂ cho bình thí nghiệm', verb: 'scoop', item: 'mno2', tool: 'spatula', powder: 'MnO2' },
        { id: 'go', role: 'start', label: 'Đổ bột vào bình thí nghiệm, đậy nút, bấm đồng hồ', verb: 'tip', items: ['spatula', 'timer', 'ref', 'exp'], ring: ['spatula', 'timer'], tool: 'spatula', into: 'exp', rigs: ['rigRef', 'rigExp'] },
      ],
      rinse: { sink: 'sink', wash: 'wash', rigs: ['rigRef', 'rigExp'], label: 'Rửa ở vòi, tráng nước cất, làm lại' },
      cols: ['Lượng mỗi bình', `Có MnO₂: O₂ sau ${WINDOW_CAT} s`, 'Không MnO₂', 'Nửa O₂ sau'],
      chem: {
        speed: 3,
        vols: (B, t) => [gasO2(true, B.level.vPerox, t), gasO2(false, B.level.vPerox, t)],
        marks(B) {
          const k = kCat({ cat: true }), tf = tFullO2(B.level.vPerox), full = tf != null && tf <= WINDOW_CAT, at = Math.min(WINDOW_CAT * 0.99, full ? tf : 3 / k); // đầy SAU cửa sổ đo thì không báo đầy
          return [{ tag: 'rigExp', ring: 'exp', at, say: full ? `Bình có MnO₂: xi-lanh ĐẦY ở 100 mL sau ${fmtT(at)}.` : `Bình có MnO₂ gần XONG: đã thoát ${fmt(gasO2(true, B.level.vPerox, at), 1)} mL O₂ sau ${fmtT(at)}.` },
            { tag: 'rigRef', ring: 'ref', at: WINDOW_CAT * 0.995, say: `Bình không có MnO₂: sau ${WINDOW_CAT} s gần như chưa có khí.` }];
        },
        show(B) {
          const [ve, vr] = B.run ? this.vols(B, B.run.t) : [0, 0];
          B.tag('rigRef', `Đối chứng (không MnO₂) · ${gasTag(vr)}`); B.tag('rigExp', `Thí nghiệm (${B.run ? 'có MnO₂' : 'sẽ thêm MnO₂'}) · ${gasTag(ve)}`);
          B.tag('cyl', cylTag(B, 'H₂O₂', B.level.vPerox));
        },
        frame(B, t) {
          const [ve, vr] = this.vols(B, t), k = kCat({ cat: true });
          B.gas('rigExp', ve); B.gas('rigRef', vr);
          B.vessel.exp.bubbles = clamp(Math.exp(-k * t) * 1.05); B.vessel.ref.bubbles = 0.03;
          setT(B, Math.min(t, WINDOW_CAT), t >= WINDOW_CAT); this.show(B);
          return { done: t >= WINDOW_CAT };
        },
        row(B) { const [ve, vr] = this.vols(B, WINDOW_CAT), te = tCat({ cat: true }); return { key: String(B.level.vPerox), level: { ...B.level }, te, tr: tCat({ cat: false }), over: ve >= FULL, cond: B.level.vPerox + ' mL H₂O₂', exp: ve >= FULL ? 'đầy 100 mL' : fmt(ve, 1) + ' mL', ref: fmt(vr, 1) + ' mL', ratio: fmtT(te) }; },
        read(B) {
          const t = B.run ? Math.min(B.run.t, WINDOW_CAT) : 0, [ve, vr] = this.vols(B, t), te = tCat({ cat: true });
          return { label: 'Khí O₂ trong xi-lanh thí nghiệm (có MnO₂)', big: fmt(Math.min(ve, FULL), 1), unit: ve >= FULL ? 'mL (đầy)' : 'mL', cells: [['Đồng hồ', fmt(t, 1) + ' s'], ['Đối chứng', fmt(vr, 1) + ' mL'], ['Nửa O₂ sau', B.run && t >= te ? fmtT(te) : '–']] };
        },
      } },

    // ---------- Tường sau: TIVI chiếu mô hình hạt (minh hoạ, không có việc tay làm). Thay vòng kính đứng giữa phòng (chủ 20/11) ----------
    { id: 'lens', name: 'Tivi · mô hình hạt', short: 'Mô hình hạt', color: '#3b3d73', at: [0, -19.7], island: false, keep: true, tagY: 11.4,
      eq: 'va chạm hiệu quả → phản ứng xảy ra', cond: 'mô hình minh hoạ',
      text: 'Tivi trên tường sau chiếu mô hình phóng to tới hạt. Hạt sáng là hạt đủ năng lượng; hai hạt sáng chạm nhau thì loé lên: một va chạm hiệu quả.',
      view: { target: [0, 7.3, 0], w: 13.4, h: 8.4, el: 3, az: 0, maxDist: 60 },
      items: [{ id: 'lens', kind: 'tv', at: [0, 7.3, 0] }], steps: [] },
  ],
};
