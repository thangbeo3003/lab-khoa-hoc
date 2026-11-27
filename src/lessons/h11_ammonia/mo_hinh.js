// MÔ HÌNH SỐ của sa bàn Haber (CHEM11-04). Chỉ tính, không đụng trang: chạy được bằng Node.
// Tham số, đại lượng hiển thị và kiểu mô hình theo tài liệu STEMLabs (docs/research/hoa-hoc.md mục CHEM11-04):
//   nhiệt độ, áp suất, tỉ lệ H₂ : N₂, xúc tác, tách NH₃, tuần hoàn → % NH₃ lúc cân bằng, % NH₃ đạt được sau thời gian chạy, sản lượng (tấn/ngày), chi phí năng lượng tương đối.
// Phần CÓ NGUỒN: hằng số cân bằng K(T) (facts.md H6). Phần MÔ HÌNH NỘI BỘ (chỉ để thấy chiều hướng, không phải số đo): tốc độ, sản lượng, chi phí (facts.md mục 3).
export const RANGE = { T: [200, 700, 10], p: [50, 350, 10], r: [1, 5, 0.5], rec: [0, 95, 5] }; // °C · bar · H₂ : N₂ · % tuần hoàn (200 °C có trong kịch bản "Đạm Phú Mỹ")
export const BOOK = { T: [400, 450], p: [150, 200] };   // điều kiện công nghiệp theo sách (facts.md H2)
export const REF = { T: 450, p: 200, r: 3, cat: true, sep: true, rec: 90 }; // cấu hình tham chiếu của nhà máy
export const RUN_S = 60;                                 // thời gian một lần chạy (kịch bản STEMLabs: "sản lượng sau 60 s")
export const TARGET = 1479;                              // tấn NH₃/ngày = 540.000 tấn/năm ÷ 365 (đáp số đã kiểm của STEMLabs)

const KT = [[300, 4.34e-3], [400, 1.64e-4], [450, 4.51e-5], [500, 1.45e-5], [550, 5.38e-6], [600, 2.25e-6]].map(([t, k]) => [1 / (t + 273.15), Math.log(k)]); // atm⁻²
// K(T): ln K đi thẳng theo 1/T giữa hai mốc của bảng (dạng van't Hoff); ngoài bảng thì kéo dài đoạn gần nhất.
export function Kp(T) {
  const x = 1 / (T + 273.15); let i = KT.findIndex(([u]) => u <= x); if (i <= 0) i = i === 0 ? 1 : KT.length - 1;
  const [x0, y0] = KT[i - 1], [x1, y1] = KT[i];
  return Math.exp(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
}
// Phần mol NH₃ lúc cân bằng, khí nạp N₂ : H₂ = 1 : r, coi khí là lí tưởng. Giải ξ bằng chia đôi: (2ξ)²(1+r−2ξ)² = K·P²·(1−ξ)(r−3ξ)³
export function xEq(T, bar, r = 3) {
  const K = Kp(T), P = bar / 1.01325, lim = Math.min(1, r / 3), f = (z) => (2 * z) ** 2 * (1 + r - 2 * z) ** 2 - K * P * P * (1 - z) * (r - 3 * z) ** 3;
  let a = 0, b = lim; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; }
  const z = (a + b) / 2; return (2 * z) / (1 + r - 2 * z);
}
// MÔ HÌNH NỘI BỘ về tốc độ: phần đường tới cân bằng đi được sau t giây. Dạng Arrhenius, mốc ở 450 °C có xúc tác; không xúc tác thì chậm hơn hai nghìn lần.
const EA = 60000, R = 8.314, K450 = 0.0384;
export const rel = (T) => Math.exp((-EA / R) * (1 / (T + 273.15) - 1 / 723.15)); // tốc độ so với 450 °C (cùng hệ số với approach; lớp hạt dùng để đặt nhịp)
export const approach = (T, cat, t = RUN_S) => 1 - Math.exp(-K450 * (cat ? 1 : 1 / 2000) * Math.exp((-EA / R) * (1 / (T + 273.15) - 1 / 723.15)) * t);
const CAP = 1800; // tấn NH₃/ngày nếu chuyển hoá hết khí nạp (đặt để cấu hình tham chiếu ra xấp xỉ sản lượng thật của Đạm Phú Mỹ)
// Một lần chạy: c = { T, p, r, cat, sep, rec }
export function run(c) {
  const eq = xEq(c.T, c.p, c.r), f = approach(c.T, c.cat), Rr = c.rec / 100;
  const xin = c.sep ? 0 : 1;                                    // không tách NH₃ thì khí quay lại mang theo NH₃
  const out = c.sep ? eq * f : (eq * f) / (1 - Rr * (1 - f));   // NH₃ ở cửa ra tháp (không tách: quay vòng chỉ đưa hỗn hợp tới gần cân bằng hơn)
  const lim = Math.min(1, c.r / 3), s = ((out * (1 + c.r)) / (1 + out)) / (2 * lim); // phần chất hết trước đã chuyển hoá sau một lượt
  const use = c.sep ? s / (1 - Rr * (1 - s)) : s;               // mức dùng nguyên liệu (có tách NH₃ thì khí quay vòng mới được dùng tiếp)
  const cost = 100 * (0.55 * (Math.log(c.p) / Math.log(REF.p)) + 0.35 * ((c.T - 25) / (REF.T - 25)) + 0.10 * (Rr / (REF.rec / 100)));
  return { eq, f, out, pass: s, use, tpd: Math.round(CAP * use * lim), cost: Math.round(cost), reached: f > 0.9, speed: f < 0.05 ? 'rất chậm' : f < 0.4 ? 'chậm' : f < 0.9 ? 'vừa' : 'nhanh', xin };
}
export const inBook = (T, p) => T >= BOOK.T[0] && T <= BOOK.T[1] && p >= BOOK.p[0] && p <= BOOK.p[1];
export const pct = (x, d = 0) => (x == null ? '—' : (x * 100).toLocaleString('vi-VN', { maximumFractionDigits: d }) + ' %');
