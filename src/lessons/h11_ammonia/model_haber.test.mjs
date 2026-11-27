// Kiểm mô hình số của sa bàn Haber: khớp bảng K có nguồn, đúng chiều chuyển dịch cân bằng, và chạy được kịch bản "Một ngày ở Đạm Phú Mỹ" của STEMLabs.
import assert from 'node:assert/strict';
import { Kp, xEq, approach, run, REF, TARGET, inBook } from './mo_hinh.js';
const near = (a, b, e) => assert.ok(Math.abs(a - b) <= e, `${a} không gần ${b}`);
for (const [T, K] of [[300, 4.34e-3], [400, 1.64e-4], [450, 4.51e-5], [500, 1.45e-5], [600, 2.25e-6]]) near(Kp(T), K, K * 1e-9); // đi qua đúng các mốc của bảng
assert.ok(Kp(425) < Kp(400) && Kp(425) > Kp(450));
near(xEq(400, 200), 0.35, 0.01); near(xEq(450, 200), 0.245, 0.01); near(xEq(300, 200), 0.62, 0.015); // khớp phép tính tay
for (const T of [200, 300, 450, 600, 700]) for (const p of [50, 150, 250]) assert.ok(xEq(T, p + 100) > xEq(T, p), 'nén thêm thì NH₃ lúc cân bằng tăng');
for (const p of [50, 200, 350]) for (const T of [200, 300, 400, 500, 600]) assert.ok(xEq(T + 100, p) < xEq(T, p), 'nóng thêm thì NH₃ lúc cân bằng giảm');
assert.ok(xEq(450, 200, 3) > xEq(450, 200, 1) && xEq(450, 200, 3) > xEq(450, 200, 5), 'tỉ lệ 3 : 1 cho nhiều NH₃ nhất');
// Xúc tác: không đổi cân bằng, chỉ đổi tốc độ
const a = run({ ...REF, sep: false, rec: 0 }), b = run({ ...REF, sep: false, rec: 0, cat: false });
assert.equal(a.eq, b.eq); assert.ok(a.out > 20 * b.out);
// Kịch bản STEMLabs: lần 1 ở 200 °C, lần 2 ở 450 °C, cùng 200 bar, không tách, không tuần hoàn
const r1 = run({ T: 200, p: 200, r: 3, cat: true, sep: false, rec: 0 }), r2 = run({ T: 450, p: 200, r: 3, cat: true, sep: false, rec: 0 });
assert.ok(r1.eq > r2.eq, '200 °C: cân bằng có lợi hơn'); assert.ok(r2.out > 5 * r1.out, 'nhưng sau 60 s thì 450 °C được nhiều hơn hẳn'); assert.ok(r2.tpd > r1.tpd);
// Lần 3: tách NH₃ + tuần hoàn 90 % thì đạt mục tiêu; thiếu một trong hai thì không
const r3 = run(REF); assert.ok(r3.tpd >= TARGET, `cấu hình tham chiếu phải đạt mục tiêu, đang ra ${r3.tpd}`); assert.equal(r3.cost, 100);
assert.ok(run({ ...REF, rec: 0 }).tpd < TARGET && run({ ...REF, sep: false }).tpd < TARGET);
assert.ok(run({ ...REF, p: 350 }).cost > 100 && run({ ...REF, T: 300 }).cost < 100);
assert.ok(approach(300, true) < approach(450, true) && inBook(450, 200) && !inBook(200, 200));
console.log('ĐẠT: mô hình số sa bàn Haber · tham chiếu', r3.tpd, 't/ngày · 200 °C', r1.tpd, '· 450 °C', r2.tpd);
