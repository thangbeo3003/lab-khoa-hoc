// LỚP HẠT của sa bàn Haber (CHEM11-04): điều gì xảy ra trên BỀ MẶT một hạt sắt. STEMLabs ghi: "Lớp vi mô: phân tử N₂ và H₂ hấp phụ trên bề mặt Fe".
// Các bước theo mục Mechanism của trang Wikipedia "Haber process" (trang STEMLabs dẫn; facts.md H9–H12):
//   1) N₂ bám lên bề mặt  2) N₂ tách thành 2 N (BƯỚC CHẬM NHẤT)  3) H₂ bám lên  4) H₂ tách thành 2 H
//   5) N nhận lần lượt ba H: NH, NH₂, NH₃  6) NH₃ rời bề mặt.
// Tệp này CHỈ TÍNH (chạy được bằng Node): vị trí 2 N và 6 H của một "ô phản ứng" theo tiến độ u, và nhịp chạy theo nhiệt độ. Hình do sa_ban.js (makeLens) dựng.
// Đơn vị: bán kính quả cầu kính = 1, trục y hướng lên. Một ô phản ứng = 1 N₂ + 3 H₂ → 2 NH₃, đúng tỉ lệ của phương trình.
import { rel } from './mo_hinh.js';

export const YS = -0.30, YTOP = 0.70;        // độ cao tâm nguyên tử N khi nằm trên bề mặt · độ cao phân tử đi vào, đi ra
export const RAD = { Fe: 0.07, N: 0.068, H: 0.045 };
export const YFE = YS - RAD.N - RAD.Fe;       // tâm lớp nguyên tử Fe trên cùng
const BN = 0.075, BH = 0.05;                  // khoảng cách hai tâm trong N₂ và H₂ (vẽ cho thấy là một cặp dính nhau, không theo tỉ lệ)
const NX = 0.15, SITE = 0.16, ATT = 0.085;    // chỗ đứng của hai N sau khi tách · vòng chỗ đứng của H quanh N · khoảng N–H trong NH₃
const D = Math.PI / 180;
const FAN = [[100, 180, 260], [80, 0, -80]];  // ba hướng của H quanh N bên trái, bên phải (hai quạt không giẫm nhau)
// Sáu nguyên tử H: j → [N nào, hướng nào]. Ba phân tử H₂ là các cặp (0,1) (2,3) (4,5).
const HMAP = [[0, 0], [0, 1], [1, 0], [1, 1], [0, 2], [1, 2]];
const HOP = [0, 2, 1, 3, 4, 5];               // thứ tự H nhảy tới N: xen kẽ trái, phải
export const U = { nLand: [0, 0.14], hLand: [0.06, 0.14, 0.04], hSplit: [0.22, 0.08, 0.03], hold: 0.38, nSplit: [0.38, 0.5], hop: [0.52, 0.05, 0.045], lift: [0.82, 0.96], end: 1 };

const cl = (x) => Math.max(0, Math.min(1, x));
const ss = (a, b, u) => { const k = cl((u - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
const nSite = (i) => [(i ? 1 : -1) * NX, YS, 0];
const dir = (i, s) => [Math.cos(FAN[i][s] * D), Math.sin(FAN[i][s] * D)];
const hSite = (j) => { const [i, s] = HMAP[j], n = nSite(i), [c, z] = dir(i, s); return [n[0] + c * SITE, YS - 0.022, z * SITE]; };
const hAtt = (j, n, spin = 0) => { const [i, s] = HMAP[j], a = FAN[i][s] * D + spin; return [n[0] + Math.cos(a) * ATT, n[1] + 0.03, n[2] + Math.sin(a) * ATT]; };

// Vị trí 8 nguyên tử của một ô ở tiến độ u (0 → 1), toạ độ của ô (trục x nối hai N). a = độ hiện (0 ẩn, 1 hiện đủ). bonds = số H đã gắn vào từng N.
export function pose(u) {
  u = cl(u);
  const out = [], got = [0, 0];
  // Hai N: rơi xuống thành một cặp, nằm trên bề mặt, tách ra hai chỗ, rồi rời bề mặt cùng ba H của mình
  const kLand = ss(...U.nLand, u), kSplit = ss(...U.nSplit, u), N = [0, 1].map((i) => {
    const pair = [(i ? 1 : -1) * BN / 2, YTOP + (YS - YTOP) * kLand, 0], p = mix(pair, nSite(i), kSplit);
    const kUp = ss(U.lift[0] + i * 0.04, U.lift[1] + i * 0.04, u);
    return [p[0] + (i ? 1 : -1) * 0.1 * kUp, p[1] + (YTOP - YS) * kUp, p[2] + 0.12 * kUp];
  });
  const fade = (i) => cl(u / 0.03) * (1 - ss(U.lift[1] + i * 0.04 - 0.04, U.lift[1] + i * 0.04, u));
  N.forEach((p, i) => out.push({ el: 'N', p, a: fade(i) }));
  for (let j = 0; j < 6; j++) {
    const m = j >> 1, mate = j ^ 1, [i] = HMAP[j], sj = hSite(j), sm = hSite(mate), mid = mix(sj, sm, 0.5), len = Math.hypot(sj[0] - sm[0], sj[2] - sm[2]) || 1;
    const t0 = U.hLand[0] + m * U.hLand[2], kL = ss(t0, t0 + U.hLand[1], u);
    const bonded = [mid[0] + ((sj[0] - sm[0]) / len) * BH / 2, YTOP + (sj[1] - YTOP) * kL, mid[2] + ((sj[2] - sm[2]) / len) * BH / 2]; // còn là phân tử H₂
    const s0 = U.hSplit[0] + m * U.hSplit[2], onSite = mix(bonded, sj, ss(s0, s0 + U.hSplit[1], u));                                  // tách thành hai nguyên tử H
    const h0 = U.hop[0] + HOP.indexOf(j) * U.hop[2], kH = ss(h0, h0 + U.hop[1], u);                                                    // nhảy tới N của mình
    const kUp = ss(U.lift[0] + i * 0.04, U.lift[1] + i * 0.04, u), att = hAtt(j, N[i], kUp * 2.2), p = mix(onSite, att, kH);
    p[1] += 0.05 * Math.sin(Math.PI * kH) * (1 - kUp);
    if (kH >= 1) got[i]++;
    out.push({ el: 'H', p, a: cl((u - t0) / 0.03) * (1 - ss(U.lift[1] + i * 0.04 - 0.04, U.lift[1] + i * 0.04, u)) });
  }
  return { atoms: out, bonds: got, split: kSplit >= 1 };
}
// Ô đang ở chặng nào (để ghi lời): 'den' N₂, H₂ đang tới · 'bam' đã bám, H₂ đã tách · 'tach' N₂ đang tách · 'ghep' H đang gắn vào N · 'roi' NH₃ rời bề mặt
export const stageOf = (u) => (u < U.hSplit[0] ? 'den' : u < U.nSplit[0] + 1e-9 ? 'bam' : u < U.nSplit[1] ? 'tach' : u < U.lift[0] ? 'ghep' : 'roi');

// NHỊP theo nhiệt độ. rel(T) = tốc độ so với 450 °C, CÙNG hệ số Arrhenius với mo_hinh.js (mô hình nội bộ của bài).
// Tới chỗ N₂ phải tách: có tách kịp trong lúc còn bám hay không là chuyện may rủi, lạnh thì hầu như không. Không tách được thì N₂ rời bề mặt, các H cũng ghép lại rồi đi.
export const HOLD = 2.5, CYCLE = 8;
export const pSplit = (T) => 1 - Math.exp(-HOLD * rel(T));
export const waitSplit = (T) => Math.min(HOLD, 0.6 / rel(T));
export const pace = (T) => (0.75 + 0.5 * cl((T - 200) / 500)) / CYCLE; // phân tử nóng thì đi nhanh hơn một chút
export const mulberry = (seed) => () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// Một ô phản ứng chạy lặp. step(dt, T) trả về số phân tử NH₃ vừa rời bề mặt trong bước này (0 hoặc 2).
export function createUnit(rng, delay = 0) {
  const S = { u: 0, mode: 'wait', t: delay, ok: false, made: 0, left: 0 };
  S.step = (dt, T) => {
    const v = pace(T);
    if (S.mode === 'wait') { S.t -= dt; if (S.t <= 0) { S.mode = 'fwd'; S.u = 0; } return 0; }
    if (S.mode === 'fwd') { S.u += v * dt; if (S.u >= U.hold) { S.u = U.hold; S.ok = rng() < pSplit(T); S.t = S.ok ? waitSplit(T) : HOLD; S.mode = 'hold'; } return 0; }
    if (S.mode === 'hold') { S.t -= dt; if (S.t <= 0) S.mode = S.ok ? 'go' : 'back'; return 0; }
    if (S.mode === 'go') { S.u += v * dt; if (S.u >= 1) { S.u = 0; S.mode = 'wait'; S.t = 0.3 + rng() * 0.8; S.made += 2; return 2; } return 0; }
    S.u -= 1.6 * v * dt; if (S.u <= 0) { S.u = 0; S.mode = 'wait'; S.t = 0.3 + rng() * 0.8; S.left++; } // 'back': N₂ không tách được, rời bề mặt
    return 0;
  };
  S.shown = () => S.mode !== 'wait';
  return S;
}

// Ba ô nằm quanh tâm tấm bề mặt; trục dài của ô đặt theo tiếp tuyến cho vừa tấm. Trả về [x, z, góc quay quanh trục y].
export const PATCHES = [90, 210, 330].map((a) => [0.33 * Math.cos(a * D), 0.33 * Math.sin(a * D), -(a + 90) * D]);
export const SLAB_R = 0.66;

export const MECH = 'Trong kính soi (sơ đồ, không theo tỉ lệ; nguyên tử N xanh dương, H trắng, Fe nâu): N₂ và H₂ bám lên bề mặt sắt. H₂ tách thành hai nguyên tử H gần như ngay. N₂ có liên kết ba rất bền nên tách chậm nhất: đây là bước quyết định tốc độ của cả phản ứng, lạnh thì hầu như không phân tử nào tách kịp. Khi N₂ đã tách, từng nguyên tử H gắn vào N: NH, NH₂ rồi NH₃, và NH₃ rời bề mặt. Sắt còn nguyên sau mỗi vòng. Kính soi chỉ vẽ chiều tạo NH₃; chiều ngược lại cũng xảy ra trên chính bề mặt này.';
