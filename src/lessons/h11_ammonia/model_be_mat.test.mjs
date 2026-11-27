// Kiểm phần tính của lớp hạt (bề mặt Fe): chạy bằng `node src/lessons/h11_ammonia/model_be_mat.test.mjs`
import assert from 'node:assert/strict';
import { pose, stageOf, U, YS, YTOP, RAD, pSplit, waitSplit, createUnit, mulberry, PATCHES, SLAB_R, HOLD } from './be_mat_fe.js';
import { rel, approach } from './mo_hinh.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const at = (u) => pose(u).atoms, Ns = (u) => at(u).filter((x) => x.el === 'N'), Hs = (u) => at(u).filter((x) => x.el === 'H');
// Bảo toàn nguyên tử: một ô luôn có đúng 2 N và 6 H (1 N₂ + 3 H₂ → 2 NH₃)
for (let u = 0; u <= 1.0001; u += 0.01) { const a = at(u); assert.equal(a.filter((x) => x.el === 'N').length, 2); assert.equal(a.filter((x) => x.el === 'H').length, 6); a.forEach((x) => x.p.forEach((v) => assert.ok(Number.isFinite(v)))); }
// N₂ còn là một cặp cho tới chỗ chờ, rồi mới tách
assert.ok(dist(Ns(0.05)[0].p, Ns(0.05)[1].p) < 2 * RAD.N, 'lúc đi xuống N₂ là một cặp dính nhau');
assert.ok(dist(Ns(U.hold)[0].p, Ns(U.hold)[1].p) < 2 * RAD.N, 'ở chỗ chờ N₂ vẫn chưa tách');
assert.ok(Math.abs(Ns(U.hold)[0].p[1] - YS) < 1e-9, 'N₂ đã nằm trên bề mặt');
assert.ok(dist(Ns(0.51)[0].p, Ns(0.51)[1].p) > 4 * RAD.N, 'sau bước tách hai N đứng xa nhau');
assert.equal(pose(U.hold).split, false); assert.equal(pose(0.51).split, true);
// H₂ tách TRƯỚC N₂: ở chỗ chờ cả sáu H đã rời cặp của mình
for (let m = 0; m < 3; m++) assert.ok(dist(Hs(U.hold)[2 * m].p, Hs(U.hold)[2 * m + 1].p) > 3 * RAD.H, `H₂ thứ ${m + 1} đã tách trước khi N₂ tách`);
for (let m = 0; m < 3; m++) assert.ok(dist(Hs(0.2)[2 * m].p, Hs(0.2)[2 * m + 1].p) < 2 * RAD.H || Hs(0.2)[2 * m].a === 0, 'trước đó H₂ còn là một cặp');
// H gắn vào N lần lượt: số liên kết N–H không giảm, tới 3 + 3
let prev = 0; for (let u = 0; u <= 1; u += 0.005) { const b = pose(u).bonds, n = b[0] + b[1]; assert.ok(n >= prev, 'H đã gắn thì không rời ra'); assert.ok(Math.abs(b[0] - b[1]) <= 1, 'hai N nhận H xen kẽ'); if (u < U.nSplit[1]) assert.equal(n, 0, 'N₂ chưa tách thì chưa H nào gắn vào N'); prev = n; }
assert.deepEqual(pose(0.81).bonds, [3, 3], 'trước khi rời bề mặt mỗi N có đủ ba H');
// NH₃ rời bề mặt nguyên vẹn: ba H của mỗi N đi theo N
const up = pose(0.95), n0 = up.atoms[0], n1 = up.atoms[1];
assert.ok(n0.p[1] > YS + 0.5 * (YTOP - YS), 'NH₃ thứ nhất đã lên cao');
up.atoms.slice(2).forEach((h, j) => { const n = [0, 0, 1, 1, 0, 1][j] ? n1 : n0; assert.ok(dist(h.p, n.p) < 0.12, 'H vẫn dính với N của mình'); });
assert.ok(at(1).every((x) => x.a === 0), 'cuối vòng mọi hạt đã đi khỏi kính soi');
// Không nguyên tử nào chìm vào tấm sắt, không ô nào thò ra ngoài tấm
for (let u = 0; u <= 1; u += 0.01) at(u).forEach((x) => assert.ok(x.p[1] >= YS - 0.03, 'hạt không chìm vào bề mặt'));
PATCHES.forEach(([cx, cz, ry]) => at(0.6).forEach((x) => { const c = Math.cos(ry), s = Math.sin(ry), X = cx + x.p[0] * c + x.p[2] * s, Z = cz - x.p[0] * s + x.p[2] * c; assert.ok(Math.hypot(X, Z) < SLAB_R, 'ô nằm gọn trên tấm bề mặt'); }));
assert.deepEqual(['den', 'bam', 'tach', 'ghep', 'roi'], [0.1, 0.3, 0.45, 0.7, 0.9].map(stageOf));
// Nhịp theo nhiệt độ: cùng hệ số với mô hình tốc độ của bài
assert.ok(Math.abs(rel(450) - 1) < 1e-12); assert.ok(rel(200) < 0.01 && rel(600) > 3);
assert.ok(Math.abs((1 - Math.exp(-0.0384 * rel(300) * 60)) - approach(300, true)) < 1e-9, 'rel() khớp với approach()');
assert.ok(pSplit(200) < 0.03 && pSplit(450) > 0.9 && pSplit(300) > pSplit(200) && pSplit(300) < pSplit(450));
assert.ok(waitSplit(200) === HOLD && waitSplit(450) < 1);
const sim = (T, sec) => { const rng = mulberry(7), us = [0, 1, 2].map((i) => createUnit(rng, i * 1.3)); let made = 0, left = 0; for (let t = 0; t < sec; t += 1 / 30) us.forEach((un) => { made += un.step(1 / 30, T); }); us.forEach((un) => { left += un.left; }); return { made, left }; };
const cold = sim(200, 120), hot = sim(450, 120), mid = sim(300, 120);
assert.ok(cold.made <= 4 && cold.left >= 20, `200 °C: N₂ bám rồi rời, gần như không có NH₃ (${cold.made} NH₃, ${cold.left} lần N₂ rời)`);
assert.ok(hot.made >= 50 && hot.left <= 8, `450 °C: NH₃ ra đều (${hot.made} NH₃)`);
assert.ok(mid.made > cold.made && mid.made < hot.made, '300 °C nằm giữa');
console.log(`ĐẠT: lớp hạt bề mặt Fe · 2 phút ở 200 °C ${cold.made} NH₃ · 300 °C ${mid.made} · 450 °C ${hot.made}`);
