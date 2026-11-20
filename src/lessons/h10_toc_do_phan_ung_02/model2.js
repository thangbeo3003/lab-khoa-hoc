// Mô hình số của bài "Tốc độ phản ứng" bản 2: bốn núm (nồng độ, nhiệt độ, cỡ hạt, xúc tác) → thời gian phản ứng ở từng trạm.
// Hàm thuần, không đụng tới hình. Dữ kiện và giản lược: facts.md. SỐ MINH HOẠ ghi rõ ở từng hàm; chưa có giáo viên duyệt.
import { simulate, V_MAX, CAT } from '../h10_toc_do_phan_ung_01/model.js';

export const REF = { conc: 0.05, temp: 25, size: 'vien', cat: false }; // mức đối chứng của bốn núm
export const CONC = [0.05, 0.10, 0.30];   // ba nồng độ Na₂S₂O₃ của sách (M)
export const TEMP = { min: 25, max: 65, step: 5 };
export const GAMMA = 2;                    // hệ số Van't Hoff dùng trong mô hình (sách: 2 đến 4)
export const tempFactor = (T) => Math.pow(GAMMA, (T - REF.temp) / 10);

// Trạm Nồng độ (Na₂S₂O₃ + H₂SO₄): thời gian tới lúc không còn thấy chữ X, giây.
// SỐ MINH HOẠ: 120 s ở 0,05 M và 25 °C; tỉ lệ nghịch với nồng độ Na₂S₂O₃; nhanh gấp GAMMA khi tăng 10 °C.
export const tConc = ({ conc, temp }) => (120 * (REF.conc / conc)) / tempFactor(temp);

// Trạm Nhiệt độ (Mg + nước có phenolphthalein): thời gian tới lúc hoá hồng, giây. SỐ MINH HOẠ: 90 s ở 25 °C.
export const tTemp = ({ temp }) => 90 / tempFactor(temp);

// Trạm Bề mặt (CaCO₃ + HCl 0,5 M, 0,30 g đá vôi): lấy trọn một lần chạy từ mô hình bản 1 (đã có kiểm thử).
const surfCache = {};
export const surfRun = (size) => surfCache[size] || (surfCache[size] = simulate({ form: size, conc: 0.5, temp: 25 }));
export const tSurf = ({ size }) => surfRun(size).tHalf; // thời gian thu nửa lượng khí
// Thể tích khí (mL) ở thời điểm t của một lần chạy, nội suy từ các điểm đã tính
export function gasAt(run, t) {
  const p = run.points; if (t <= 0) return 0; if (t >= p[p.length - 1][0]) return p[p.length - 1][1];
  let lo = 0, hi = p.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m][0] <= t) lo = m; else hi = m; }
  return p[lo][1] + (p[hi][1] - p[lo][1]) * ((t - p[lo][0]) / Math.max(p[hi][0] - p[lo][0], 1e-9));
}
export const rateAt = (run, t) => (gasAt(run, t + 0.5) - gasAt(run, Math.max(0, t - 0.5))) / (t < 0.5 ? t + 0.5 : 1); // mL/s
export { V_MAX };

// Trạm Xúc tác (2H₂O₂ → 2H₂O + O₂): phân huỷ bậc 1, hằng số của bản 1. Thời gian thu nửa lượng O₂ = ln2 / k.
export const kCat = ({ cat }) => (cat ? CAT.K_MNO2 : CAT.K_NONE);
export const tCat = (k) => Math.log(2) / kCat(k);

// Vòng kính soi hạt (minh hoạ): bốn núm đổi số hạt, độ nhanh, tỉ lệ hạt đủ năng lượng.
export function lensSetup({ conc, temp, size, cat }) {
  const count = Math.round((conc >= 0.3 ? 46 : conc >= 0.1 ? 30 : 20) * (size === 'vun' ? 1.3 : 1));
  const speed = 1 + (temp - REF.temp) / 40;
  const hot = Math.min(0.85, (0.2 + (temp - REF.temp) / 100) * (cat ? 2.4 : 1));
  return { count, speed, hot };
}
