// Kiểm phần tính của đồ thị sa bàn Haber: chạy bằng `node src/lessons/h11_ammonia/model_do_thi.test.mjs`
import assert from 'node:assert/strict';
import { curves, at, same, kText, chartSVG } from './do_thi.js';
import { run, REF } from './mo_hinh.js';

const c = { T: 450, p: 200, r: 3, cat: true, sep: true, rec: 90 }, pts = curves(c);
assert.equal(pts.length, 51, 'mỗi 10 °C một điểm từ 200 tới 700 °C');
for (let i = 1; i < pts.length; i++) assert.ok(pts[i].eq < pts[i - 1].eq, 'đường cân bằng đi xuống khi nóng lên (phản ứng toả nhiệt)');
const pk = pts.reduce((a, p) => (p.out > a.out ? p : a));
assert.ok(pk.T > 300 && pk.T < 600, `đường sau 60 giây có đỉnh ở giữa (đỉnh tại ${pk.T} °C)`);
pts.forEach((p) => assert.ok(p.out <= p.eq + 1e-9, 'sau 60 giây không vượt cân bằng'));
assert.equal(at(pts, 450).out, run(c).out, 'chấm của lần chạy rơi đúng trên đường');
const noFe = curves({ ...c, cat: false });
assert.deepEqual(noFe.map((p) => p.eq), pts.map((p) => p.eq), 'rút xúc tác: đường cân bằng không đổi');
assert.ok(at(noFe, 450).out < at(pts, 450).out / 100, 'rút xúc tác: đường sau 60 giây sụp xuống');
assert.ok(curves({ ...c, p: 300 })[25].eq > pts[25].eq, 'nén mạnh hơn: đường cân bằng nâng lên');
assert.ok(same({ ...c, T: 200 }, c) && !same({ ...c, p: 100 }, c), 'lần chạy cùng cài đặt chỉ khác nhiệt độ');
assert.equal(kText(450), '4,5 × 10⁻⁵');
for (const rate of [true, false]) for (const cfg of [c, { ...c, cat: false }, { ...c, T: 200, p: 50 }, { ...REF, T: 700, p: 350 }]) {
  const svg = chartSVG(cfg, [{ ...c, T: 200, out: 0.01 }, { ...c, p: 100, out: 0.2 }], { rate });
  assert.ok(!/NaN|undefined|Infinity/.test(svg), 'chuỗi SVG không có số hỏng');
  assert.equal((svg.match(/stroke-dasharray="5 3"/g) || []).length, rate ? 1 : 0, 'đường sau 60 giây chỉ vẽ khi được phép');
}
console.log('ĐẠT: phần tính của đồ thị sa bàn Haber');
