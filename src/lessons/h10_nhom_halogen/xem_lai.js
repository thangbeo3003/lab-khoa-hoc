// XEM LẠI MỘT LẦN THỬ (chặng 4 · 27/11): từ một dòng lịch sử, dựng lại ống nghiệm đúng lần đó và tính màu sau TỪNG GIỌT
// bằng chính kho hoá học (free/tubechem.js), không lưu ảnh, không viết cứng màu. Tệp này chỉ tính, không đụng trang: chạy được bằng Node.
import { newTube, add, look, DROP_ML } from '../../free/tubechem.js';

const DROP = { mL: DROP_ML, drop: true };
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const colourGap = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
export const GAP = 40; // hai màu cách nhau từ mức này thì đặt cạnh ống đối chứng là thấy khác ngay (thang 0–441; 26 còn quá nhạt trên màn hình)
const sameTube = (a, b) => a.tubeId === b.tubeId && (a.round || 1) === (b.round || 1) && !a.run;
const snap = (t, drop) => { const L = look(t); return { drop, vol: t.vol, hex: L.hex, opacity: L.opacity, ppt: t.ppt.length ? '#2f2a33' : null }; };

// rows: các dòng lịch sử của bước (lesson.js, D.rows[i]); k: dòng cần xem.
// Trả về { frames: [trạng thái sau 0, 1, … n giọt], change: giọt đầu tiên thấy đổi (hoặc null), ok: dựng lại có khớp dòng đã ghi không }.
export function framesOf(rows, k) {
  const r = rows[k]; if (!r || r.run || !r.salt) return null;
  const before = rows.slice(0, k).filter((x) => sameTube(x, r)), used = before.reduce((s, x) => s + x.drops, 0) + r.drops;
  const base = Number.isFinite(r.volume) ? Math.max(0.1, +(r.volume - used * DROP_ML).toFixed(4)) : 2; // lượng mẫu ban đầu = thể tích đã ghi trừ các giọt đã nhỏ
  const t = newTube(); add(t, r.salt, { mL: base });
  before.forEach((x) => { for (let i = 0; i < x.drops; i++) add(t, x.chem, DROP); });
  const frames = [snap(t, 0)];
  for (let i = 1; i <= r.drops; i++) { add(t, r.chem, DROP); frames.push(snap(t, i)); }
  const f0 = frames[0], hit = frames.find((f) => f.drop > 0 && ((f.ppt && !f0.ppt) || colourGap(f.hex, f0.hex) >= GAP));
  const last = frames[frames.length - 1];
  return { frames, change: hit ? hit.drop : null, ok: last.hex === r.hex && (!Number.isFinite(r.volume) || Math.abs(last.vol - r.volume) < 1e-6) };
}
// Ống đem so với dòng k: ống đối chứng (hoặc ống so màu) trong cặp của nó, lấy lần nhỏ CÙNG CHẤT cùng lượt nếu có.
// pairs: [[ống đối chứng, ống thí nghiệm], …] của bước. Trả về { id, k } (k = dòng của ống đối chứng, hoặc -1 nếu chưa có dòng nào hợp).
export function partnerOf(rows, k, pairs) {
  const r = rows[k], pair = (pairs || []).find((p) => p[1] === r.tubeId); if (!pair) return null;
  const mine = rows.map((x, j) => [x, j]).filter(([x]) => !x.run && x.tubeId === pair[0] && (x.round || 1) === (r.round || 1));
  const same = mine.filter(([x]) => x.chem === r.chem).pop() || mine.filter(([x]) => x.chem === 'H2O').pop();
  return { id: pair[0], k: same ? same[1] : -1 };
}
