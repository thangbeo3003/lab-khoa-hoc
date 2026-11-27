// CHUẨN CHẤT LIỆU 3D DÙNG CHUNG cho CẢ Lab 1 và Lab 2, mọi sân khấu (bàn thí nghiệm, sa bàn, mô hình hạt). Define: DEFINE_CHAT_LIEU.md (chủ 27/11: "define chuẩn kiểu chất liệu vậy liệu nhé").
// Đối chiếu sa bàn Haber của Lab-SML (27/11): mọi thiết bị dựng bằng mã từ MỘT bảng chất liệu, không dán ảnh chụp lên khối 3D. Ảnh chụp chỉ dùng ở bản 2D.
// Dùng: import { vatLieu } from '../../kit/chat_lieu.js'; const M = vatLieu(); add(g, geo, M.son) …  · Tên chất liệu là VAI TRÒ, không phải màu: đổi bảng ở đây thì mọi bài đổi theo.
// Đồ thuỷ tinh và chất lỏng của bàn thí nghiệm vẫn dùng kit/materials.js (glassMat, liquidMat): chuẩn này không thay chúng, chỉ ghi lại thông số ở define.
import * as T from 'three';
import { vanSon, vanKimLoai } from './khoi_tu_anh.js';

// Bảng chất liệu: [màu, độ nhám, độ kim loại, có vân sơn bẩn nhẹ]. Thứ tự từ sáng tới tối, rồi tới màu nhấn.
export const BANG = {
  son:      ['#eceae4', 0.55, 0.10, true],  // sơn trắng ngà: thân thiết bị, tháp, bồn, tủ
  son2:     ['#e3e7e8', 0.60, 0.10, true],  // sơn xám nhạt: bình khí, bộ trao đổi nhiệt, vỏ phụ
  betong:   ['#c4c0b7', 0.92, 0.00, false], // bê tông: bệ, móng
  sonToi:   ['#8d9296', 0.55, 0.30, false], // sơn xám tối: thùng, hộp kĩ thuật
  thep:     ['#878d93', 0.45, 0.60, false], // thép: ống nhánh, trục, mặt bích, bu lông lớn
  toi:      ['#3e4348', 0.60, 0.40, false], // xám đậm: chân, bệ máy, khung đỡ
  vang:     ['#d6a42a', 0.55, 0.20, false], // vàng an toàn: CHỈ lan can, thang, sàn thao tác, tay nắm
  xanh:     ['#3d6590', 0.45, 0.30, true],  // nhấn xanh trầm: động cơ điện
  luc:      ['#6c8a77', 0.50, 0.25, true],  // nhấn lục trầm: bơm, khối máy nén
  do:       ['#b3473c', 0.60, 0.00, false], // nhấn đỏ trầm: tay van, chỏm bình H₂, nút dừng
  dong:     ['#b08d48', 0.40, 0.70, false], // đồng thau: viền đồng hồ, khớp nối nhỏ
  kinhToi:  ['#33454f', 0.15, 0.30, false], // kính quan sát tối (ống thuỷ, cửa sổ máy)
};
// Ánh sáng và không khí của sân khấu có cảnh (sa bàn): đọc ở kit/boi_canh.js và lessons/*/sa_ban.js
export const ANH_SANG = { phoiSang: 0.98, moiTruong: 0.75, suong: '#f3f2f0', dat: '#ece8e1', troi: ['#bfd9ff', '#dce9ff', '#f2f6ff'] };
// Màu theo chức năng (không dùng cho thân máy): ống công nghệ, ống phụ trợ, ống tuần hoàn, núm đang cho chỉnh
export const CHUC_NANG = { ongCongNghe: '#3b7bff', ongPhuTro: '#13b8c6', ongTuanHoan: '#e07b2a', numChinh: '#6254f4' };

// Tạo bộ chất liệu (mỗi lần gọi một bộ mới, để bài sửa riêng một món không ảnh hưởng bài khác). Vân sơn và vân kim loại dùng chung một tấm.
export function vatLieu() {
  const son = vanSon(), van = vanKimLoai(), M = {};
  Object.entries(BANG).forEach(([k, [color, roughness, metalness, dirty]]) => {
    M[k] = new T.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: ANH_SANG.moiTruong, ...(dirty ? { map: son } : {}) });
    if (metalness >= 0.3 && !dirty) { M[k].roughnessMap = van; M[k].bumpMap = van; M[k].bumpScale = 0.006; }
  });
  M.vo = M.son2.clone(); M.vo.side = T.DoubleSide; // vỏ mở được (nửa vỏ tháp): thấy được cả mặt trong
  return M;
}
