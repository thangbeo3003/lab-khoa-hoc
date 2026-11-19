// Chạy: node model.test.mjs
import assert from 'node:assert/strict';
import { K, N0, V_MAX, simulate, createRun, stepRun, avgRate, tempFactor } from './model.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);
const out = [];
const base = { form: 'vun', conc: 1.0, temp: 25 };

// F5: 0,30 g -> 74,4 mL
near(V_MAX, 74.37, 0.01, 'V_MAX');
near(N0, 0.003, 1e-12, 'N0');

// Lượng khí cuối không phụ thuộc điều kiện (acid luôn dư)
for (const form of ['vien', 'vun', 'bot'])
  for (const conc of [0.5, 1.0, 2.0])
    for (const temp of [25, 35, 45]) {
      const r = simulate({ form, conc, temp });
      assert.ok(r.done, `xong ${form} ${conc} ${temp}`);
      near(r.vGas, V_MAX, 0.02, `V cuối ${form} ${conc} ${temp}`);
      assert.ok(r.nAcid > 0, 'acid dư');
      out.push(`${form.padEnd(4)} ${conc.toFixed(1)} M ${temp} °C: xong ${r.t.toFixed(1)} s, nửa ${r.tHalf.toFixed(2)} s`);
    }

// Tốc độ đầu: gấp đôi nồng độ -> gấp đôi; +10 °C -> gấp đôi; bề mặt 1:3:10
const r0 = (s) => { const r = createRun(s); stepRun(r, 0.005); return r.vGas / 0.005; };
near(r0({ ...base, conc: 2.0 }) / r0(base), 2, 0.02, 'nồng độ x2');
near(r0({ ...base, temp: 35 }) / r0(base), 2, 0.02, 'nhiệt +10');
near(r0({ ...base, temp: 45 }) / r0(base), 4, 0.04, 'nhiệt +20');
near(r0({ ...base, form: 'bot' }) / r0({ ...base, form: 'vien' }), 10, 0.1, 'bề mặt 10');
near(tempFactor(55), 8, 1e-9, 'γ^3');

// Thử thách bước 9: viên nguyên, nửa lượng khí dưới 6 s
const ch = (conc, temp) => simulate({ form: 'vien', conc, temp }).tHalf;
assert.ok(ch(1.0, 25) > 6, 'mặc định phải trượt');
assert.ok(ch(2.0, 25) > 6, 'chỉ tăng nồng độ phải trượt');
assert.ok(ch(1.0, 35) > 6, 'chỉ +10 °C phải trượt');
assert.ok(ch(2.0, 35) < 6, '2 M + 35 °C phải đạt');
assert.ok(ch(1.0, 45) < 6, '1 M + 45 °C phải đạt');
out.push(`thử thách: 1M25=${ch(1, 25).toFixed(2)} 2M25=${ch(2, 25).toFixed(2)} 1M35=${ch(1, 35).toFixed(2)} 2M35=${ch(2, 35).toFixed(2)} 1M45=${ch(1, 45).toFixed(2)} 2M45=${ch(2, 45).toFixed(2)}`);

// Đường cong luôn tăng
const r = simulate(base);
for (let i = 1; i < r.points.length; i++) assert.ok(r.points[i][1] >= r.points[i - 1][1], 'đơn điệu');
assert.ok(avgRate(r) > 0);

console.log(out.join('\n'));
console.log('ĐẠT: tất cả kiểm thử mô hình');
