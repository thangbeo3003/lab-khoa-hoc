// BỐ CỤC BÀN ỐNG NGHIỆM dùng chung cho bàn 2D (flat/labset2d.js) và bàn 3D (lessons/*/ban_3d.js). Luật: DEFINE_SAP_XEP_BAN.md mục 7 (chủ duyệt 27/11: "Duyệt 6A").
// Giáo án KHAI VAI TRÒ, không gõ toạ độ: bench.bo_cuc = { <chỉ số bước>: cách xếp, macdinh: cách xếp }, mỗi cách xếp gồm
//   S: [id lọ mẫu] (khay ngoài cùng bên trái) · R: [id lọ thuốc thử] (khay sát đế) · T: [[id ống, chữ ở bảng tên], …] (đế ống ở giữa, trái → phải).
// Món không có trong cách xếp (cốc thải, bình tia, chậu, kệ…) giữ chỗ cố định của cụm. Không phụ thuộc Three.js, không phụ thuộc canvas.

// Con số chuẩn theo ảnh mẫu chủ duyệt 27/11 (đơn vị bàn 3D, 1 ≈ 10 cm)
export const SO = { lo: .57, ong: .86, de_x: -.05, khay_y: .03, khay_sau: .78, khay_cach: .14, de_cach: .3 };
export const khayRong = (n) => (n - 1) * SO.lo + .72;
export const deRong = (n) => (n - 1) * SO.ong + .64;

// Cách xếp của bước đang làm: khoá là chỉ số bước (0 = bước 1); bước không khai dùng 'macdinh'
export function cachXep(boCuc, step) { return boCuc && boCuc[step] ? String(step) : 'macdinh'; }

// Một cách xếp → toạ độ 3D từng món + khay + đế. pos[id] = [x, y, z]
export function xepBan3d(cfg) {
  const pos = {}, nT = cfg.T.length, sw = deRong(nT) + .36;
  cfg.T.forEach(([id], i) => { pos[id] = [SO.de_x + (i - (nT - 1) / 2) * SO.ong, .1, 0]; });
  let x = SO.de_x - sw / 2 - SO.de_cach; const trays = [];
  for (const ids of [cfg.R, cfg.S]) {
    if (!ids.length) continue;
    const w = khayRong(ids.length), c = x - w / 2;
    ids.forEach((id, i) => { pos[id] = [c + (i - (ids.length - 1) / 2) * SO.lo, SO.khay_y, 0]; });
    trays.push({ x: c, n: ids.length }); x -= w + SO.khay_cach;
  }
  return { pos, trays, stand: { n: nT, labels: cfg.T.map((t) => t[1]) } };
}

// Thứ tự trái → phải cho bàn 2D (bàn 2D tự tính bề ngang từ ảnh thật): các nhóm khay, rồi đế
export function xepBan2d(cfg) {
  return { khay: [cfg.S, cfg.R].filter((ids) => ids.length), ong: cfg.T.map(([id]) => id), bang: cfg.T.map(([id, chu]) => ({ id, chu })) };
}
