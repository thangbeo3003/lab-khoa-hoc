// GIÁO ÁN bài "Ammonia. Muối ammonium" (Hoá 11 · Chương 2 · Bài 5 · CHEM11-04), mode 3D = SA BÀN nhà máy tổng hợp NH₃ (quá trình Haber).
// Nội dung theo tài liệu STEMLabs: catalog/hoa-hoc.csv (desc_3d: "Tháp tổng hợp 3D: dòng N₂, H₂ qua lớp xúc tác, NH₃ ngưng tụ, khí dư quay vòng"),
// docs/research/hoa-hoc.md mục CHEM11-04 (dụng cụ ảo, tham số, đại lượng hiển thị) và docs/catalog/ung-dung-thuc-te-hoa-sinh.md (kịch bản "Một ngày ở Đạm Phú Mỹ").
// Số liệu: mo_hinh.js (K có nguồn; tốc độ, sản lượng, chi phí là mô hình nội bộ). Dữ kiện và nguồn: facts.md. Tệp này không chạm vật thể 3D: hình do sa_ban.js dựng.
import { run, REF, RANGE, BOOK, TARGET, RUN_S, pct } from './mo_hinh.js';
import { AT } from './sa_ban.js';

export const meta = {
  id: 'h11_ammonia',
  grade: 'Hoá 11',
  book: { code: 'CHEM11-04', series: 'Kết nối tri thức', chapter: 2, chapterTitle: 'Nitrogen – sulfur', lesson: 5, lessonTitle: 'Ammonia. Muối ammonium', pages: '35' },
  title: 'Tổng hợp ammonia: vì sao nhà máy không chạy lạnh cho được nhiều?',
  equation: 'N₂ + 3H₂ ⇌ 2NH₃',
  layout: 'full',
  chain: [
    ['Cân bằng', 'lạnh và nén thì được nhiều NH₃'],
    ['Tốc độ', 'nóng và có Fe thì nhanh'],
    ['Dung hoà', '400–450 °C · 150–200 bar'],
    ['Tuần hoàn', 'khí chưa phản ứng quay lại'],
  ],
  mainQuestion: 'Nhiệt độ thấp cho nhiều NH₃ hơn lúc cân bằng. Vậy sao nhà máy không chạy ở 200 °C?',
  disclaimer: 'Bản thử nghiệm, chưa có giáo viên duyệt. Sa bàn là sơ đồ dạy học, không theo bản vẽ nhà máy nào. Phần trăm NH₃ lúc cân bằng là số tính từ hằng số cân bằng, coi khí là lí tưởng. Tốc độ, sản lượng và chi phí là mô hình của bài, chỉ để thấy chiều hướng.',
};

export const SUMMARY = 'Phản ứng toả nhiệt và làm giảm số mol khí: lạnh và nén thì cân bằng có nhiều NH₃ hơn. Nhưng lạnh thì phản ứng quá chậm, nén quá cao thì tốn năng lượng và thiết bị. Nhà máy chọn 400–450 °C, 150–200 bar, dùng xúc tác Fe cho nhanh, tách NH₃ lỏng ra và đưa khí chưa phản ứng quay lại.';
export const SAFETY = 'An toàn: H₂ dễ cháy nổ, NH₃ độc, thiết bị chịu áp suất rất cao. Thí nghiệm này không làm được ở trường, ở đây chỉ mô phỏng.';
export { REF, RANGE, BOOK, TARGET, RUN_S };

export const steps = [
  { short: 'Xem sa bàn', bench: 'haber', link: [0, 1, 2, 3],
    q: 'Từ hai bình khí N₂ và H₂, khí đi qua những đâu để thành NH₃ lỏng?',
    todo: 'Kéo để xoay quanh sa bàn. Đi theo đường ống từ trái sang phải: bình khí, máy nén, tháp tổng hợp, thiết bị làm lạnh, bình chứa NH₃ lỏng. Đường ống vòng phía sau là đường tuần hoàn.',
    goal: 'Xoay nhìn quanh sa bàn và đi theo đường ống từ trái sang phải.',
    todo2d: 'Chạm từng khối trên sơ đồ để biết tên và việc của nó. Đi theo đường ống từ trái sang phải: bình khí, máy nén, tháp tổng hợp, làm lạnh, bình chứa NH₃ lỏng. Đường màu cam phía trên là đường tuần hoàn.',
    goal2d: 'Chạm một khối trên sơ đồ để biết tên và việc của nó, rồi đi theo đường ống từ trái sang phải.' },
  { short: 'Chạy ở 200 °C', bench: 'haber', link: [0],
    bridge: 'Lạnh thì cân bằng có lợi cho NH₃. Em thử cho nhà máy chạy thật lạnh xem được bao nhiêu.',
    q: 'Ở 200 °C, lúc cân bằng có rất nhiều NH₃. Chạy 60 giây thì thu được bao nhiêu?',
    todo: 'Mở van khí N₂ và H₂. Để nhiệt độ 200 °C, áp suất 200 bar, rồi bấm nút Chạy trên tủ điều khiển. So con số "lúc cân bằng" với con số "sau 60 giây".',
    goal: 'Mở van khí, để 200 °C rồi chạy tháp 60 giây.' },
  { short: 'Chạy ở 450 °C', bench: 'haber', link: [0, 1],
    bridge: 'Ở 200 °C gần như chưa có NH₃ sau 60 giây. Em tăng nhiệt độ lên như nhà máy thật rồi chạy lại.',
    q: 'Nóng lên thì cân bằng kém đi. Vậy sau 60 giây, 450 °C hay 200 °C được nhiều NH₃ hơn?',
    todo: 'Kéo nhiệt độ lên 450 °C, giữ 200 bar, chạy lại 60 giây. So hai dòng trong bảng các lần chạy.',
    goal: 'Kéo nhiệt độ lên 450 °C rồi chạy lại để so với lần 200 °C.' },
  { short: 'Nén khí', bench: 'haber', link: [0, 2],
    bridge: 'Nhiệt độ đã chọn xong. Còn áp suất: bốn phân tử khí thành hai, nên nén sẽ có lợi.',
    q: 'Nén mạnh hơn thì được thêm bao nhiêu NH₃, và phải trả giá gì?',
    todo: 'Giữ 450 °C. Chạy một lần ở áp suất thấp, một lần ở áp suất cao. Xem phần trăm NH₃ và ô chi phí năng lượng cùng đổi.',
    goal: 'Chạy ở hai mức áp suất khác nhau, xem NH₃ và chi phí cùng đổi.' },
  { short: 'Xúc tác Fe', bench: 'haber', link: [1],
    bridge: 'Trong tháp có ba tầng hạt sắt. Em mở vỏ tháp xem rồi thử rút chúng ra.',
    q: 'Xúc tác Fe làm đổi lượng NH₃ lúc cân bằng, hay chỉ làm phản ứng nhanh hơn?',
    todo2d: 'Chạm tháp để mở kính soi hạt: xem N₂ và H₂ làm gì trên bề mặt sắt. Chạm thùng Fe để rút xúc tác ra, nhìn lại kính soi, rồi chạy 60 giây. So con số lúc cân bằng và con số sau 60 giây với lần có xúc tác.',
    goal2d: 'Chạm tháp để mở kính soi hạt, rút xúc tác Fe ra rồi chạy thử một lần.',
    todo: 'Chạm tháp để mở vỏ, nhìn ba tầng xúc tác. Kính soi hạt hiện ra bên cạnh: xem N₂ và H₂ làm gì trên bề mặt sắt. Chạm thùng Fe để rút xúc tác ra, nhìn lại kính soi, rồi chạy 60 giây. So con số lúc cân bằng và con số sau 60 giây với lần có xúc tác.',
    goal: 'Mở vỏ tháp, xem kính soi hạt, rút xúc tác Fe ra rồi chạy thử một lần.' },
  { short: 'Tách và tuần hoàn', bench: 'haber', link: [3],
    bridge: 'Mỗi lượt qua tháp chỉ một phần khí thành NH₃. Phần khí còn lại không thể bỏ đi.',
    q: 'Mỗi lượt chỉ chuyển hoá một phần. Làm sao nhà máy dùng gần hết khí nguyên liệu?',
    todo: 'Bật làm lạnh để NH₃ ngưng tụ thành lỏng và tách ra. Mở van tuần hoàn để khí chưa phản ứng quay lại máy nén. Chạy rồi xem ô "mức dùng nguyên liệu" và sản lượng.',
    goal: 'Bật làm lạnh tách NH₃, mở van tuần hoàn, rồi chạy.' },
  { short: 'Trưởng ca', bench: 'haber', link: [0, 1, 2, 3],
    bridge: 'Nhà máy Đạm Phú Mỹ làm 540.000 tấn NH₃ mỗi năm, tức khoảng 1.479 tấn mỗi ngày. Hôm nay em trực ca.',
    q: 'Đặt nhà máy thế nào để đạt 1.479 tấn NH₃ mỗi ngày mà tốn ít năng lượng nhất?',
    todo: 'Tự chỉnh nhiệt độ, áp suất, tỉ lệ H₂ : N₂, xúc tác, tách NH₃ và mức tuần hoàn. Mỗi lần chạy ghi một dòng. Tìm cấu hình đạt mục tiêu với chi phí thấp nhất.',
    goal: 'Đạt ít nhất 1.479 tấn NH₃ mỗi ngày, chi phí càng thấp càng tốt.' },
];

const clamp = (x) => Math.max(0, Math.min(1, x));
// Cấu hình đang đặt: bốn con số do thanh kéo ở bảng phải (lesson.js giữ trong B.opts.cfg), ba công tắc do việc làm bằng tay trên sa bàn.
export const cfgOf = (B) => { const c = (B.opts && B.opts.cfg) || REF, D = B.data; return { T: c.T, p: c.p, r: c.r, rec: D.loop ? c.rec : 0, cat: !!D.cat, sep: !!D.sep }; };
const DUR = 6; // một lần chạy 60 giây của nhà máy diễn trong 6 giây thật
const toggle = (id, label, item, key, extra = {}) => ({ id, role: 'prepare', label, verb: 'press', item, optional: true, repeat: true, apply(B) { B.data[key] = !B.data[key]; if (extra.sw) B.switch(item, extra.sw(B)); }, ...extra });

export const lab = {
  mode3d: {
    room: { photo: './assets/env_v3/', top: 0x1b1e21, dim: 0.72 },
    props: [{ kind: 'stool', at: [-6.4, 4.6], opts: { color: 0x4b5563 } }, { kind: 'stool', at: [6.6, 4.2], opts: { color: 0x4b5563 } }],
    overview: { target: [0, 1.9, 0], w: 13.5, h: 7.2, el: 22, az: 0, fov: 34, maxDist: 60, cy: 0.5 },
  },
  benches: [
    { id: 'haber', name: 'Sa bàn · Nhà máy tổng hợp NH₃', short: 'Nhà máy NH₃', color: '#0e7490', at: [0, 0], w: 10.4, d: 5.0, tagY: 4.6, tagFocus: true,
      eq: 'N₂ + 3H₂ ⇌ 2NH₃', cond: 'phản ứng toả nhiệt · xúc tác Fe · số trên bảng là số tính của bài',
      text: 'Sa bàn một dây chuyền tổng hợp ammonia: hai bình khí N₂ và H₂, máy nén, tháp tổng hợp có ba tầng xúc tác sắt, thiết bị làm lạnh, bình chứa NH₃ lỏng. Ống vòng phía sau đưa khí chưa phản ứng quay lại máy nén.',
      view: { target: [0, 1.6, 0], w: 9.9, h: 4.6, el: 24, az: -8, swing: 80, elMin: 5, elMax: 62 },
      items: [
        { id: 'base', kind: 'stand', at: AT.base },
        { id: 'pipes', kind: 'gaswash', at: AT.pipes, role: 'ống trong suốt để thấy dòng khí: chấm xanh dương là N₂, chấm trắng là H₂, chấm xanh ngọc là NH₃' },
        { id: 'feed', kind: 'dropfunnel', at: AT.feed, tag: 'N₂ + H₂ · van đóng', tagAt: [0, 2.05, 0], role: 'hai bình khí nguyên liệu; chạm để mở hoặc đóng van' },
        { id: 'comp', kind: 'gaswash', at: AT.comp, tag: 'Máy nén', tagAt: [0, 1.25, 0], role: 'nén hỗn hợp khí tới áp suất đã đặt; kim đồng hồ chỉ số bar' },
        { id: 'tower', kind: 'dropfunnel', at: AT.tower, tag: 'Tháp', tagAt: [0, 3.95, 0], role: 'nơi N₂ và H₂ gặp nhau trên bề mặt hạt sắt; chạm để mở hoặc đóng vỏ tháp' },
        { id: 'catbox', kind: 'dropfunnel', at: AT.catbox, tag: 'Xúc tác Fe · trong tháp', tagAt: [0, 0.62, 0], role: 'hạt sắt làm xúc tác; chạm để rút ra hoặc đặt lại vào tháp' },
        { id: 'cool', kind: 'dropfunnel', at: AT.cool, tag: 'Làm lạnh · tắt', tagAt: [0, 1.35, 0], role: 'làm lạnh hỗn hợp cho NH₃ ngưng tụ thành lỏng; chạm để bật hoặc tắt' },
        { id: 'sep', kind: 'gaswash', at: AT.sep, tag: 'NH₃ lỏng', tagAt: [0, 2.0, 0], role: 'NH₃ lỏng đọng ở đây; khí chưa phản ứng thoát ra ở đỉnh bình' },
        { id: 'loop', kind: 'dropfunnel', at: AT.loop, tag: 'Tuần hoàn · đóng', tagAt: [0.2, 1.0, 0], role: 'đưa khí chưa phản ứng quay lại máy nén; chạm để mở hoặc đóng' },
        { id: 'lensfoot', kind: 'stand', at: AT.lens, pick: false },
        { id: 'lens', kind: 'gaswash', at: AT.lens, tag: 'Kính soi · bề mặt hạt Fe', tagAt: [0, 1.1, 0], role: 'kính soi hạt: bề mặt một hạt sắt phóng to (sơ đồ, không theo tỉ lệ); hiện ra khi vỏ tháp mở; chạm để nhìn gần hoặc lùi ra' },
        { id: 'panel', kind: 'dropfunnel', at: AT.panel, ry: -0.35, tag: 'Tủ điều khiển', tagAt: [0, 1.0, 0], role: 'chạm để cho tháp chạy 60 giây với cấu hình đang đặt' },
      ],
      init(B) { Object.assign(B.data, { valve: false, cat: true, cut: false, near: false, sep: false, loop: false, n: 0, res: [], last: null, live: null, prog: 0, liq: 0 }); B.switch('catbox', true); },
      steps: [
        toggle('valve', 'Mở / đóng van khí N₂ và H₂', 'feed', 'valve', { sw: (B) => B.data.valve }),
        { ...toggle('cut', 'Mở / đóng vỏ tháp để nhìn bên trong', 'tower', 'cut'), apply(B) { B.data.cut = !B.data.cut; if (!B.data.cut) B.data.near = false; } }, // đóng vỏ thì kính soi cất đi, máy quay lùi ra
        toggle('near', 'Nhìn gần kính soi hạt / lùi ra', 'lens', 'near', { guard: (B) => (B.data.cut ? null : 'Kính soi hạt hiện ra khi vỏ tháp mở: mở vỏ tháp trước.') }),
        toggle('cat', 'Rút / đặt lại xúc tác Fe', 'catbox', 'cat', { sw: (B) => B.data.cat }),
        toggle('sep', 'Bật / tắt làm lạnh để tách NH₃ lỏng', 'cool', 'sep', { sw: (B) => B.data.sep }),
        toggle('loop', 'Mở / đóng van tuần hoàn', 'loop', 'loop', { sw: (B) => B.data.loop }),
        { id: 'run', role: 'start', label: 'Chạy tháp 60 giây', verb: 'press', item: 'panel', repeat: true,
          guard(B) { return B.data.valve ? null : 'Chưa có khí vào: mở van khí N₂ và H₂ trước.'; },
          apply(B) { const c = cfgOf(B); B.data.live = { c, r: run(c) }; B.data.prog = 0; } },
      ],
      chem: {
        speed: 1,
        frame(B, t) {
          const D = B.data, L = D.live; if (!L) return { done: true, end: true };
          D.prog = clamp(t / DUR);
          if (t < DUR) { this.show(B); return { done: false }; }
          const res = { n: ++D.n, kind: 'run', ...L.c, ...L.r }; D.res.push(res); D.last = res; D.live = null; D.prog = 0; D.liq = L.c.sep ? clamp(D.liq + 0.12 + 0.4 * L.r.use) : D.liq;
          B.say(L.r.f < 0.05 ? `Sau ${RUN_S} giây gần như chưa có NH₃ (${pct(L.r.out, 1)}), dù lúc cân bằng có thể tới ${pct(L.r.eq)}. Phản ứng quá chậm.` : `Sau ${RUN_S} giây: ${pct(L.r.out)} NH₃ ở cửa ra tháp. Lúc cân bằng: ${pct(L.r.eq)}.`);
          this.show(B); return { done: true, end: true };
        },
        show(B) {
          const D = B.data, c = cfgOf(B);
          B.tag('feed', `N₂ + H₂ · van ${D.valve ? 'mở' : 'đóng'}`);
          B.tag('comp', `Máy nén · ${c.p} bar`);
          B.tag('tower', `Tháp · ${c.T} °C · ${D.cat ? 'có Fe' : 'không có Fe'}`);
          B.tag('catbox', `Xúc tác Fe · ${D.cat ? 'trong tháp' : 'đã rút ra'}`);
          B.tag('cool', `Làm lạnh · ${D.sep ? 'tách NH₃' : 'tắt'}`);
          B.tag('loop', `Tuần hoàn · ${D.loop ? 'mở ' + ((B.opts && B.opts.cfg) || REF).rec + ' %' : 'đóng'}`);
        },
      },
    },
  ],
};
