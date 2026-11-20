// Mô hình số của bản 3 cho hai bàn đo khí, nhận LƯỢNG làm tham số (bản 1 gắn cứng 0,30 g và 20 mL).
// Hàm thuần, không đụng tới hình. Cùng công thức với mô hình bản 1 (model.js: F3, F4, S2, S4, S5) nên ở 0,30 g + 20 mL cho đúng số của bản 1.
// Số minh hoạ: thang thời gian TAU và hệ số bề mặt SURF. Lượng khí tối đa tính từ phương trình. Chưa có giáo viên duyệt.
import { kCat, CONC, tConc } from '../h10_toc_do_phan_ung_02/model2.js';
export const K3 = { M_CACO3: 100, VM: 24790, TAU: 30, SURF: { vien: 1, vun: 3 }, CONC_HCL: 0.5 };
// Ba mức cố định của bản 20/11 sáng. Giao diện KHÔNG còn dùng (nay học sinh tự chọn trong RANGE3); giữ lại vì bộ kiểm thử còn so với bản 1 ở các mức này.
export const AMOUNT = {
  vAcid: [15, 20, 30],      // mL HCl 0,5 M cho MỖI bình (acid luôn dư với mọi mức đá vôi bên dưới)
  mass: [0.10, 0.20, 0.30], // g đá vôi cho MỖI bình (tối đa 74,4 mL khí, vừa xi-lanh 100 mL)
  vPerox: [10, 20, 25],     // mL dung dịch H₂O₂ cho MỖI bình (tối đa 90 mL O₂)
};
export const REF3 = { vAcid: 20, mass: 0.30, vPerox: 20 }; // mức của bài (KHÁC SÁCH ở số gam đá vôi, xem facts.md)
// Khoảng học sinh tự chọn: sức chứa của dụng cụ trên bàn (ống đong 100 mL chia hai bình, cân đọc 0,01 g), không phải khoảng của bài.
export const RANGE3 = { vAcid: { min: 5, max: 50, step: 1 }, mass: { min: 0.05, max: 2, step: 0.01 }, vPerox: { min: 5, max: 50, step: 1 } };
export const FULL = 100;            // xi-lanh đo khí chỉ đọc được tới 100 mL
export const TEMPS = [35, 45, 55, 65]; // mức nhiệt của bình thí nghiệm ở bàn 1 (bếp điện) và bàn 2 (đèn cồn); đối chứng luôn 25 °C
export const WINDOW_CAT = 26;       // một lần chạy ở bàn Xúc tác dài bao nhiêu giây của mô hình (SỐ MINH HOẠ)
export const WINDOW_SURF_MAX = 260; // một lần chạy ở bàn Bề mặt dài tối đa bao nhiêu giây của mô hình (SỐ MINH HOẠ)
export const DONE_AT = 0.985;       // một bình tính là "xong" khi khí đã đạt 98,5% lượng tính theo phương trình
export const EXAM = { lo: 14, hi: 16 }; // sát hạch: chữ X của bình thí nghiệm phải mất trong khoảng này (giây)

// CaCO₃ + 2HCl: một lần chạy trọn. form = 'vien' | 'vun'; mass (g); vAcid (mL).
export function simulate3({ form, mass, vAcid }, tMax = 2000) {
  const N0 = mass / K3.M_CACO3, VA = vAcid / 1000, kRef = N0 / K3.TAU, h = 0.005, points = [[0, 0]];
  let nS = N0, nA = K3.CONC_HCL * VA, t = 0, done = false;
  while (!done && t < tMax) {
    let dn = kRef * K3.SURF[form] * Math.pow(nS / N0, 2 / 3) * (nA / VA) * h;
    dn = Math.min(dn, nS, nA / 2); nS -= dn; nA -= 2 * dn; t += h;
    if (nS <= N0 * 3e-3) { nS = 0; done = true; } else if (nA <= 1e-9) done = true;
    if (done || t - points[points.length - 1][0] >= 0.1) points.push([t, (N0 - nS) * K3.VM]);
  }
  const vEnd = points[points.length - 1][1];
  let tHalf = null;
  for (let i = 1; i < points.length; i++) if (points[i][1] >= vEnd / 2) { const [t0, v0] = points[i - 1], [t1, v1] = points[i]; tHalf = t0 + ((vEnd / 2 - v0) / Math.max(v1 - v0, 1e-12)) * (t1 - t0); break; }
  return { points, vEnd, tHalf, tEnd: t, vMax: N0 * K3.VM, stoneLeft: nS > 0 };
}
const cache = {};
export const run3 = (form, mass, vAcid) => cache[`${form}|${mass}|${vAcid}`] || (cache[`${form}|${mass}|${vAcid}`] = simulate3({ form, mass, vAcid }));
// Thể tích khí (mL) ở thời điểm t, nội suy từ các điểm đã tính
export function gasAt3(run, t) {
  const p = run.points; if (t <= 0) return 0; if (t >= p[p.length - 1][0]) return p[p.length - 1][1];
  let lo = 0, hi = p.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m][0] <= t) lo = m; else hi = m; }
  return p[lo][1] + (p[hi][1] - p[lo][1]) * ((t - p[lo][0]) / Math.max(p[hi][0] - p[lo][0], 1e-9));
}
export const rateAt3 = (run, t) => (gasAt3(run, t + 0.5) - gasAt3(run, Math.max(0, t - 0.5))) / (t < 0.5 ? t + 0.5 : 1); // mL/s

// 2H₂O₂ → 2H₂O + O₂: 20 mL dung dịch (2 mL H₂O₂ 10% pha thành 20 mL) cho tối đa khoảng 72 mL O₂ (facts.md). Lượng O₂ tỉ lệ với thể tích dung dịch.
export const vO2Max = (vPerox) => 72 * (vPerox / 20);
// Thể tích O₂ (mL) sau t giây: phân huỷ bậc 1, hằng số của bản 1 (SỐ MINH HOẠ, model2.js kCat).
export const gasO2 = (cat, vPerox, t) => vO2Max(vPerox) * (1 - Math.exp(-kCat({ cat }) * t));
// Thời điểm bình có MnO₂ làm xi-lanh đầy 100 mL; lượng H₂O₂ không đủ làm đầy thì trả null.
export const tFullO2 = (vPerox) => (vO2Max(vPerox) >= FULL ? -Math.log(1 - FULL / vO2Max(vPerox)) / kCat({ cat: true }) : null);

// CaCO₃ + 2HCl: lượng khí tính theo PHƯƠNG TRÌNH và chất nào hết trước (không phụ thuộc thang thời gian minh hoạ).
// by: 'da' (acid dư, đá vôi tan hết) · 'acid' (acid hết trước, đá vôi còn thừa) · 'vuadu' (hai chất cùng hết).
export function limit3(mass, vAcid) {
  const nS = mass / K3.M_CACO3, nA = K3.CONC_HCL * vAcid / 1000, d = nA - 2 * nS;
  const by = Math.abs(d) <= 1e-9 * Math.max(nA, 2 * nS) ? 'vuadu' : d < 0 ? 'acid' : 'da';
  return { vEnd: Math.min(nS, nA / 2) * K3.VM, by };
}
// Thời điểm lượng khí của một lần chạy chạm mức v (mL); không tới thì trả null.
export function timeTo(run, v) {
  const p = run.points;
  for (let i = 1; i < p.length; i++) if (p[i][1] >= v) return p[i - 1][0] + ((v - p[i - 1][1]) / Math.max(p[i][1] - p[i - 1][1], 1e-12)) * (p[i][0] - p[i - 1][0]);
  return null;
}
// Cửa sổ đo của bàn Bề mặt (giây của mô hình): dài hơn lần chạy chậm nhất 3%, nhưng không quá WINDOW_SURF_MAX.
export const surfWindow = (runs) => Math.min(WINDOW_SURF_MAX, Math.max(...runs.map((r) => r.tEnd)) * 1.03);
// Một bình ở bàn Bề mặt khi cửa sổ đo đóng lại ở giây w:
//   'full' xi-lanh đã đầy 100 mL · 'done' khí đã đạt DONE_AT lượng tính theo phương trình · 'slow' vẫn còn ra khí chậm (đuôi của đá vôi viên khi acid không dư nhiều).
// v: thể tích đọc được lúc đó (mL). at: thời điểm đầy hoặc thời điểm đạt mốc xong; 'slow' thì null.
export function surfState(run, w, lim) {
  const v = gasAt3(run, w);
  if (v >= FULL) return { state: 'full', v: FULL, at: timeTo(run, FULL) };
  if (v >= lim.vEnd * DONE_AT) return { state: 'done', v, at: timeTo(run, lim.vEnd * DONE_AT) };
  return { state: 'slow', v, at: null };
}
// Sát hạch ở bàn 1: mọi cách chọn (lọ đặc hơn × không làm ấm hoặc một mức bếp điện) và cách nào rơi vào khoảng EXAM.
export const examChoices = () => CONC.slice(1).flatMap((conc) => [25, ...TEMPS].map((temp) => ({ conc, temp, t: tConc({ conc, temp }) })));
export const examPass = (t) => t >= EXAM.lo && t <= EXAM.hi;
