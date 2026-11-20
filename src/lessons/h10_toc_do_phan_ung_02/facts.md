# Bảng dữ kiện: Tốc độ phản ứng, bản 2 (một bàn 4 trạm)

Trạng thái: bản dựng thử 19/11/2026, mới có bàn và bước 1. **Chưa có giáo viên Hoá duyệt. Chưa đối chiếu sách in và văn bản chương trình 2018.**

## Dữ kiện đang hiện trên màn hình

| # | Dữ kiện | Nguồn | Mức |
|---|---|---|---|
| G1 | Trạm Nồng độ: Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O; bấm giờ tới lúc không thấy chữ X dưới đáy bình | Bài 19 Hoá 10 Kết nối tri thức, qua trang giải bài loigiaihay | Phương trình đúng. Cách làm theo nguồn thứ cấp |
| G2 | Nhãn lọ ở trạm Nồng độ: Na₂S₂O₃ 0,05 M và 0,30 M, H₂SO₄ 0,5 M | Như trên (sách dùng ba nồng độ 0,05 · 0,10 · 0,30 M; bàn bày hai đầu mút) | Nguồn thứ cấp, chưa đối chiếu sách in |
| G3 | SO₂ là khí độc | Hoá học phổ thông; sách có lưu ý an toàn ở thí nghiệm này | Đúng |
| G4 | Trạm Nhiệt độ: Mg + 2H₂O → Mg(OH)₂ + H₂↑, có phenolphthalein, một ống đun nóng, so thời gian hoá hồng | Như G1 | Phương trình đúng. Cách làm theo nguồn thứ cấp |
| G5 | Trạm Bề mặt: CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O, đá vôi viên và đập nhỏ, HCl 0,5 M | Như G1 | Như trên |
| G6 | Trạm Xúc tác: 2H₂O₂ → 2H₂O + O₂↑, một bình thêm MnO₂; nhãn lọ H₂O₂ 10% | Như G1 | Như trên |
| G7 | Tốc độ trung bình = lượng chất biến đổi chia cho khoảng thời gian | Mục I của bài 19; cũng là F9 của bản 1 | Đúng |
| G8 | Bụi bột mì lơ lửng gặp nguồn lửa có thể nổ | F12 của bản 1 | Đúng về hiện tượng, **cần dẫn một nguồn cụ thể trước khi phát hành** |

## Minh hoạ (ghi ở chân màn hình)

| # | Minh hoạ | Lý do |
|---|---|---|
| M1 | Vòng kính soi hạt: số hạt, cỡ hạt, tốc độ đều không theo tỉ lệ thật; hạt sáng là hạt đủ năng lượng | Mô hình để hình dung va chạm hiệu quả |
| M2 | Đồng hồ trên bàn đang đứng ở 0,0 s | Bước thí nghiệm chưa dựng; chưa có số thời gian nào được đưa lên màn hình |

## Chưa có, phải bổ sung trước khi dựng bước 2 đến 10

- Thời gian mất chữ X và thời gian hoá hồng: sách chỉ kết luận định tính. Hoặc lấy số đo có nguồn, hoặc ghi rõ là số minh hoạ.
- Lượng trong sách (khoảng 2 g đá vôi, 20 mL HCl 0,5 M): acid hết trước, đá vôi dư. Khí tối đa do acid quyết định: 0,010 mol HCl → 0,0050 mol CO₂ ≈ 124 mL (25 °C, 1 bar). Khác bản 1 (acid dư).
- Nguồn: https://loigiaihay.com/giai-hoa-10-bai-19-trang-92-93-94-95-96-97-98-99-100-ket-noi-tri-thuc-a107739.html (mở 19/11; trang có chỗ ghi nhầm "Na₂SO₃", hiểu là Na₂S₂O₃ theo phương trình).

## Bước 5 Bề mặt (dựng 19/11 khuya)
- Dùng lại mô hình của bản 1 (`../h10_toc_do_phan_ung_01/model.js`, đã có kiểm thử): mỗi bình 0,30 g đá vôi, 20 mL HCl 0,5 M, 25 °C, acid dư. Hệ số bề mặt: viên 1, đập nhỏ 3 (giản lược S2 của bản 1, số minh hoạ).
- Kết quả mô hình: nửa lượng khí sau 44,8 s (viên) và 14,9 s (đập nhỏ), tỉ lệ 3,0; cả hai dừng ở 74,4 mL CO₂ (0,003 mol × 24,79 L/mol).
- KHÁC SÁCH: sách Kết nối tri thức dùng khoảng 2 g đá vôi với 20 mL HCl 0,5 M (acid hết trước) và chỉ quan sát định tính. Bản dựng này dùng 0,30 g để đá vôi tan hết và hai đường dừng cùng mức. Màn hình có ghi "số do mô hình tính, thời gian đã rút ngắn". Chờ giáo viên duyệt lượng nào nên dùng.

## Mô hình bốn núm (model2.js, dựng 19/11 đêm) — SỐ MINH HOẠ, chờ giáo viên duyệt
- Trạm Nồng độ: thời gian mất chữ X = 120 s ở 0,05 M và 25 °C; tỉ lệ nghịch với nồng độ Na₂S₂O₃ (0,10 M: 60 s; 0,30 M: 20 s). KHÔNG có số đo có nguồn; sách chỉ kết luận định tính.
- Trạm Nhiệt độ: thời gian hoá hồng = 90 s ở 25 °C; nhanh gấp γ = 2 mỗi 10 °C (sách: γ từ 2 đến 4). KHÔNG có số đo có nguồn.
- Trạm Bề mặt: như mục "Bước 5" ở trên (mô hình bản 1).
- Trạm Xúc tác: phân huỷ H₂O₂ bậc 1, hằng số của bản 1 (có MnO₂ 0,12 /s; không có 0,00002 /s) → nửa lượng O₂ sau 5,8 s và khoảng 9,6 giờ. Số minh hoạ.
- Trạm Nồng độ chỉ chịu núm Nhiệt độ ở bước 8 (Thao tác sai) và bước 10 (Sát hạch).
- Vòng kính: số hạt, độ nhanh, tỉ lệ hạt đủ năng lượng đổi theo núm (minh hoạ, không theo tỉ lệ thật).
- Kiểm thử: `node model2.test.mjs` (10 phép, ĐẠT).
