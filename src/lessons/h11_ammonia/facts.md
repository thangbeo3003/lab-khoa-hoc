# Bài "Ammonia. Muối ammonium" (Hoá 11, Chương 2, Bài 5) · mã CHEM11-04 · DỮ KIỆN và NGUỒN cho mode 3D (sa bàn Haber)

Lead tk1 (phiên fork) soạn 27/11/2026, cập nhật 27/11/2026 10:22. Bài THỬ đầu tiên của sân khấu sa bàn (`DEFINE_SA_BAN.md`). CHƯA có giáo viên duyệt. CHƯA mở sách giấy.

## 1. Đặc tả lấy từ tài liệu STEMLabs (chủ 27/11: "data thì bên gitlap tài liệu bên steam cấp")
Bản chỉ xem: `/Volumes/KINGSTON/DINO_render/lab_khoa_hoc/gitlab_stemlabs_xem/xem_dev/`.
| Mục | Tài liệu | Bài đã theo thế nào |
|---|---|---|
| Tên, mô tả 3D "Tháp tổng hợp 3D: dòng N₂, H₂ qua lớp xúc tác, NH₃ ngưng tụ, khí dư quay vòng" | `catalog/hoa-hoc.csv` | Sa bàn có đúng các phần đó |
| Dụng cụ ảo: bình N₂, bình H₂, máy nén, tháp có xúc tác Fe, làm lạnh ngưng tụ NH₃, đường tuần hoàn | `docs/research/hoa-hoc.md` mục CHEM11-04 | Đủ sáu phần, thêm tủ điều khiển và thùng xúc tác để có chỗ làm bằng tay |
| Tham số: 300–700 °C, 50–350 bar, H₂ : N₂ 1:1 tới 5:1, xúc tác, tách NH₃, tuần hoàn 0–95 % | như trên | Đủ; nhiệt độ mở xuống 200 °C vì kịch bản ứng dụng chạy ở 200 °C |
| Đại lượng: % NH₃ lúc cân bằng, % NH₃ sau thời gian chạy, sản lượng tấn/ngày, chi phí năng lượng tương đối | như trên | Đủ bốn; "biểu đồ Kp(T)" CHƯA làm |
| Kịch bản "Một ngày ở Đạm Phú Mỹ": lần 1 ở 200 °C, lần 2 ở 450 °C, lần 3 bật tách NH₃ và tuần hoàn 90 %, mục tiêu ≥ 1.479 t/ngày | `docs/catalog/ung-dung-thuc-te-hoa-sinh.md` mục CHEM11-04 | Bước 2, 3, 6, 7 của bài. Câu hỏi bậc thang và các đáp số (453.700 t, 95.900 t, 6,7 lượt) CHƯA đưa vào: để dành cho mode Thực tế |
| An toàn: H₂ dễ cháy nổ, NH₃ độc, thiết bị áp suất cao, chỉ mô phỏng | `catalog/hoa-hoc.csv` | Có lời an toàn |

## 2. Dữ kiện hoá học và nguồn
| # | Dữ kiện | Nguồn | Mức |
|---|---|---|---|
| H1 | N₂ + 3H₂ ⇌ 2NH₃, toả nhiệt (ΔrH° = −91,8 kJ) | Lời giải Hoạt động trang 35 SGK Hoá 11 Kết nối tri thức (vietjack.com/hoa-hoc-11-kn/hoat-dong-trang-35-hoa-hoc-11-1.jsp), đọc 27/11 | nguồn thứ cấp |
| H2 | Công nghiệp: 400–450 °C, 150–200 bar, xúc tác Fe | như H1 | nguồn thứ cấp |
| H3 | Tăng nhiệt độ: cân bằng dịch chiều nghịch; nhiệt độ quá thấp thì phản ứng chậm | như H1 | nguồn thứ cấp |
| H4 | Giảm áp suất: cân bằng dịch chiều nghịch; áp suất cao hơn thì tốn năng lượng, thiết bị phải chịu áp | như H1 | nguồn thứ cấp |
| H5 | Bột sắt làm phản ứng nhanh đạt cân bằng | như H1 | nguồn thứ cấp |
| H6 | K theo nhiệt độ: 300 °C 4,34×10⁻³ · 400 °C 1,64×10⁻⁴ · 450 °C 4,51×10⁻⁵ · 500 °C 1,45×10⁻⁵ · 550 °C 5,38×10⁻⁶ · 600 °C 2,25×10⁻⁶ | Wikipedia "Haber–Bosch process", bảng K(T), đọc 27/11 | có nguồn; chưa đối chiếu sách gốc |
| H7 | Mỗi lượt qua tháp khoảng 15 % chuyển hoá; nhờ tuần hoàn, tổng chuyển hoá khoảng 97–98 % | STEMLabs (dẫn Wikipedia) ghi 97 %; LibreTexts "The Haber Process" ghi 98 %, đọc 27/11 | có nguồn |
| H8 | Đạm Phú Mỹ: 540.000 t NH₃/năm → 1.479 t/ngày | STEMLabs, dẫn dpm.vn; đáp số đã kiểm của STEMLabs | theo STEMLabs, Lead chưa tự mở dpm.vn |

## 3. Số do bài TỰ TÍNH (`mo_hinh.js`, kiểm bằng `model_haber.test.mjs`)
- **Có gốc từ nguồn:** % NH₃ lúc cân bằng tính từ K (H6), ln K đi thẳng theo 1/T giữa các mốc, kéo dài ra ngoài bảng cho 200 °C và 700 °C; coi khí là lí tưởng. Ở áp suất cao số thật lệch vài phần trăm. Ví dụ: 400 °C, 200 bar khoảng 35 %; 450 °C, 200 bar khoảng 25 %; 200 °C, 200 bar khoảng 86 %.
- **MÔ HÌNH NỘI BỘ, chỉ để thấy chiều hướng** (STEMLabs cũng ghi phần này là "mô hình nội bộ, chỉ trình bày định tính"):
  - Tốc độ: phần đường tới cân bằng đi được sau 60 giây, dạng Arrhenius, mốc 450 °C có xúc tác đạt khoảng 90 %; không xúc tác chậm hơn hai nghìn lần. Các hằng số do Lead đặt.
  - Sản lượng tấn/ngày: 1.800 × mức dùng nguyên liệu. Số 1.800 do Lead đặt để cấu hình tham chiếu (450 °C, 200 bar, tách NH₃, tuần hoàn 90 %) ra 1.530 t/ngày, sát mục tiêu 1.479.
  - Chi phí năng lượng: chỉ số tương đối, 100 = cấu hình tham chiếu; trọng số nén 0,55, gia nhiệt 0,35, tuần hoàn 0,10 do Lead đặt.
- Hệ quả đã thấy khi thử: mô hình cho phép đạt mục tiêu rẻ hơn ở 400 °C, 250 bar, tức ngoài vùng 150–200 bar của sách. Bài đã ghi rõ điều này ở kết luận bước 7. Cần giáo viên xem có chấp nhận không.

## 4. Chưa có nguồn hoặc chưa làm
- Bảng % NH₃ đo thật theo nhiệt độ và áp suất (đã tìm 27/11, chưa thấy trang đọc được).
- Yêu cầu cần đạt của chương trình cho bài này (STEMLabs cũng ghi "chưa trích được").
- Nhiệt độ từng tầng xúc tác, khí lạnh chen giữa các tầng, chất làm hỏng xúc tác.
- Biểu đồ K(T) riêng (mới ghi số K dưới đồ thị % NH₃ theo nhiệt độ).
- Chiều ngược trên bề mặt (NH₃ tách lại thành N₂ và H₂): kính soi chưa vẽ, mới ghi bằng lời.

## 5. Lớp hạt "kính soi" trên bề mặt Fe (27/11, `be_mat_fe.js`, kiểm bằng `model_be_mat.test.mjs`)
STEMLabs chỉ ghi một câu: "Lớp vi mô: phân tử N₂ và H₂ hấp phụ trên bề mặt Fe". Các bước chi tiết lấy từ mục Mechanism của trang Wikipedia "Haber process" (trang STEMLabs dẫn), đọc 27/11:

| # | Dữ kiện | Nguồn | Bài vẽ thế nào |
|---|---|---|---|
| H9 | Sáu bước: N₂ (khí) → N₂ (bám) · N₂ (bám) → 2 N (bám) · H₂ (khí) → H₂ (bám) · H₂ (bám) → 2 H (bám) · N + 3 H → NH₃ (bám) · NH₃ (bám) → NH₃ (khí) | Wikipedia, mục Mechanism | Một "ô phản ứng" = 1 N₂ + 3 H₂ → 2 NH₃, đủ sáu bước |
| H10 | Bước N + 3 H đi qua ba nấc: NH, NH₂, NH₃ | như trên | Sáu nguyên tử H nhảy tới hai N lần lượt, xen kẽ |
| H11 | Bước chậm nhất, quyết định tốc độ: N₂ tách thành 2 N. Bước này phá liên kết ba của nitrogen, liên kết bền nhất phải phá trong cả quá trình | như trên | Ô dừng chờ ở đúng bước này; H₂ đã tách xong từ trước |
| H12 | Không có xúc tác thì phản ứng trong pha khí không thực hiện được; xúc tác hạ rất mạnh năng lượng hoạt hoá của việc cắt liên kết ba | như trên | Rút Fe: N₂ và H₂ bay tự do, va nhau rồi bật ra |

**Phần do bài tự đặt (mô hình nội bộ, không phải số đo):**
- Nhịp theo nhiệt độ dùng chung hệ số Arrhenius với `mo_hinh.js` (`rel(T)`). Xác suất N₂ tách kịp trong lúc còn bám: 450 °C khoảng 92 %, 300 °C khoảng 17 %, 200 °C khoảng 1 %. Không tách kịp thì N₂ rời bề mặt.
- Chạy thử 2 phút: 200 °C ra 2 NH₃, 300 °C ra 12, 450 °C ra 66. Con số chỉ để so chiều hướng.
- Hình là sơ đồ: không theo tỉ lệ, số nguyên tử Fe và cách xếp chỉ để thấy "một bề mặt kim loại". N₂ vẽ nằm ngang trên bề mặt (trang nguồn ghi lúc đầu N₂ bám theo kiểu dựng đứng).
- Trang nguồn ghi thêm: bước chậm là do hệ số trước hàm mũ bất lợi chứ không chủ yếu do năng lượng hoạt hoá. Bài chỉ nói "bước chậm nhất", không đi vào ý này.
- Câu "sắt còn nguyên sau mỗi vòng" và "chiều ngược cũng xảy ra trên chính bề mặt này" là kiến thức chung về xúc tác (xúc tác không bị tiêu hao, tăng tốc cả hai chiều); trang nguồn không ghi rõ hai câu đó. Cần giáo viên duyệt.

## 6. Mode Thực tế "Một ngày ở Đạm Phú Mỹ" (27/11, `thuc_te.js`): số liệu đã tự mở nguồn kiểm lại

| # | Dữ kiện | Nguồn (đọc 27/11) | Ghi chú |
|---|---|---|---|
| T1 | Công suất 800.000 tấn urê/năm, 540.000 tấn NH₃/năm; nhà máy ở Khu công nghiệp Phú Mỹ 1, Bà Rịa – Vũng Tàu; vận hành năm 2004; công nghệ NH₃ của Haldor Topsoe | dpm.vn, Báo cáo thường niên 2024, mục Giới thiệu Tổng công ty | có nguồn (nguồn chính thức của doanh nghiệp) |
| T2 | Năm 2010 nâng urê từ 740.000 lên 800.000 tấn/năm; năm 2018 mở rộng phân xưởng NH₃ thêm 90.000 tấn/năm (tăng 20 %) | dpm.vn, Lịch sử phát triển | Trang này không ghi tổng NH₃; báo cáo 2024 vẫn ghi 540.000. Bài dùng 540.000 theo báo cáo 2024 và theo STEMLabs. Cần hỏi lại nếu muốn dùng số sau mở rộng |
| T3 | Mỗi lượt qua tháp khoảng 15 %; cuối cùng chuyển hoá khoảng 97 % (một chú thích trên cùng trang ghi khoảng 98 %); áp suất 150–250 bar | Wikipedia "Haber process" | có nguồn |
| T4 | 400–450 °C, 150–200 bar, xúc tác Fe | như H1, H2 (SGK qua VietJack) | nguồn thứ cấp |

Đáp số câu tính (tự tính lại 27/11, khớp đáp số đã kiểm của STEMLabs): NH₃ cho 800.000 t urea = 800.000 × 34,06 ÷ 60,06 ≈ 453.680 (STEMLabs làm tròn 453.700) · dư ≈ 86.300 · H₂ ≈ 95.900 · N₂ ≈ 444.100 · 1 ÷ 0,15 ≈ 6,7 lượt · 540.000 ÷ 365 ≈ 1.479 t/ngày. Ô đáp số nhận sai lệch ± 1.500 tấn.

Điều kiện hoàn thành phần ca trực (theo STEMLabs): lần 3 đạt ít nhất 1.479 t/ngày bằng cấu hình 400–500 °C, có tách NH₃ và tuần hoàn, và chọn đúng lời giải thích về sự đánh đổi cân bằng và tốc độ. Sản lượng, chi phí là mô hình nội bộ (mục 3).

