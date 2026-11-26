# ĐỊNH NGHĨA BÀI · Hoá 10 · Chương 7 · Bài 21 "Nhóm halogen" · mã CHEM10-05

HUB soạn 25/11/2026 để các fork dựng theo. Chủ (nguyên văn): "cần define kĩ cho các frok hiểu và làm cho chuẩn nhé".
Tệp này là NGUỒN DUY NHẤT về nội dung bài. Dữ kiện khoa học và nguồn: `facts.md` cùng thư mục (D1 đến D12). Trạng thái: chủ duyệt 26/11 ("Duyệt, giao dựng"); đang dựng lượt b.

## 0. Người dùng thấy gì
1. Mở `bai_hoc.html` → Lớp 10 → Chương 7 → **Bài 21. Nhóm halogen** → bấm "Vào bài".
2. Ba nút mode **2D · 3D · Thực tế** nằm NGAY TRÊN SÂN KHẤU, góc trên bên phải, cạnh ô phóng to thu nhỏ "− 100% +" (chủ 26/11: "sao k để chỗ chọn mode ở đây nhỉ - vào bài chọn mode cho trực quan hơn"). Mode đang xem thì sáng; mode chưa có thì mờ, ghi "Sắp ra mắt".
3. Mode 2D và 3D: CÙNG 9 bước, cùng câu hỏi, cùng việc phải làm, cùng kết quả. Khác nhau chỉ ở hình: 2D là bàn phẳng với ảnh dụng cụ, 3D là phòng lab đi lại được. Đổi mode giữ nguyên bước đang đứng.
4. Mode Thực tế: một nhiệm vụ riêng 6 phần (mục 5), dùng lại bàn 2D.

## 1. Mục tiêu và lời chốt (tự soạn, không chép SGK)
- Câu hỏi chính: "Cùng là halogen, vì sao chlorine đẩy được bromine và iodine ra khỏi muối, còn iodine thì không đẩy được ai?"
- Lời chốt cuối bài: "Tính oxi hoá giảm dần: chlorine > bromine > iodine. Halogen mạnh hơn lấy electron của ion halide yếu hơn và đẩy nó ra khỏi muối. Khí chlorine độc: chỉ điều chế trong tủ hút, khí thừa cho đi qua dung dịch kiềm."
- Cách viết tên chất: chlorine, bromine, iodine, sodium bromide, potassium iodide (theo chương trình 2018). Số thập phân dùng dấu phẩy.

## 2. Ba bàn và tủ đồ
Tên `kind` đã có ở bài mẫu thì dùng lại; `kind` MỚI ghi (mới) và phải thêm vào tủ đồ dùng chung, không vẽ riêng cho bài.

**Bàn 1 · Điều chế chlorine (nằm trong tủ hút)** · id `prep`
| id | kind | Chứa gì | Ảnh 2D (`assets/flat`) |
|---|---|---|---|
| hood | hood (mới) | khung tủ hút có cửa kính và công tắc quạt | vẽ bằng code (khung + kính mờ + đèn công tắc) |
| stand | stand (mới) | giá sắt + kẹp giữ bình cầu | `stand`, `clamp` |
| flask | sideflask (mới) | bình cầu có nhánh, bên trong có tinh thể tím KMnO₄ | `distill_flask` |
| funnel | dropfunnel (mới) | phễu nhỏ giọt chứa HCl đặc, có khoá | `dropping_funnel` |
| washer | gaswash (mới) | bình rửa khí | `gas_wash_bottle` |
| jar | jar | bình thu khí, miệng có tấm kính che | `jar` |
| trap | beaker (mới ở 3D) | cốc dung dịch NaOH hấp thụ khí thừa | `beaker` |
| meter | gasmeter (mới) | đồng hồ "khí độc trong phòng", ba mức: An toàn · Cảnh báo · Nguy hiểm | vẽ bằng code (mặt đồng hồ `meter` + kim) |
Ống dẫn khí nối flask → washer → jar → trap: vẽ bằng code (đường ống), khí vàng lục chạy trong ống.

**Bàn 2 · Chlorine gặp muối halide** · id `cl`
| id | kind | Chứa gì |
|---|---|---|
| rack | rack | giá 3 ống nghiệm |
| tRef, tBr, tI | tube | ống đối chứng (NaBr) · ống NaBr · ống KI, mỗi ống đã có sẵn dung dịch không màu |
| dCl | dropper | lọ nhỏ giọt "Nước chlorine" (lọ nâu) |
| dW | dropper | lọ nhỏ giọt "Nước cất" |
| dS | dropper | lọ nhỏ giọt "Hồ tinh bột" |
| sink, wash | sink, wash | vòi nước, bình nước cất (như bài mẫu) |

**Bàn 3 · Bromine và iodine gặp muối halide** · id `bri`
| id | kind | Chứa gì |
|---|---|---|
| rack | rack | giá 4 ống nghiệm |
| t1, t2 | tube | ống KI · ống NaCl (dùng với nước bromine) |
| t3, t4 | tube | ống NaBr · ống NaCl (dùng với nước iodine) |
| dBr | dropper | lọ nhỏ giọt "Nước bromine" (lọ nâu) |
| dI | dropper | lọ nhỏ giọt "Nước iodine" (lọ nâu) |
| sink, wash | sink, wash | như bàn 2 |

Tivi hạt (`tv`) treo tường dùng ở bước 7, như bài mẫu.

## 3. Chín bước của mode 2D và 3D
Mỗi bước có: tên ngắn · bàn · câu hỏi (`q`) · việc phải làm (`todo`) · người học thấy gì · điều kiện "Đã làm".

| # | Tên ngắn | Bàn | Câu hỏi | Việc phải làm | Thấy gì | Đã làm khi |
|---|---|---|---|---|---|---|
| 1 | Xem cả phòng | cả phòng | "Chlorine, bromine và iodine cùng thuộc nhóm halogen. Quan sát nào giúp em xếp chúng theo tính oxi hoá?" | Nhìn quanh phòng (3D: kéo xoay; 2D: bấm từng thẻ bàn) | Ba bàn, tủ hút, tivi | đã mở xem ít nhất 1 bàn |
| 2 | Điều chế chlorine | prep | "Khí chlorine độc. Muốn có nó để thí nghiệm thì phải làm ở đâu và chặn khí thừa bằng gì?" | (a) bật quạt tủ hút, (b) mở khoá phễu cho HCl đặc nhỏ xuống | bọt trong bình cầu; khí vàng lục chạy theo ống, qua bình rửa khí, đầy dần bình thu; bong bóng trong cốc NaOH; đồng hồ khí độc đứng ở "An toàn" | bình thu đầy khí |
| 3 | Chlorine gặp bromide | cl | "Nhỏ nước chlorine vào muối bromide không màu thì có gì đổi không?" | nhỏ nước cất vào ống đối chứng; nhỏ nước chlorine vào ống NaBr | ống đối chứng không đổi; ống NaBr hoá **cam** (D1); hiện phương trình Cl₂ + 2NaBr → 2NaCl + Br₂ | đã nhỏ cả 2 ống |
| 4 | Chlorine gặp iodide | cl | "Với muối iodide thì sao, và làm sao chắc chắn chất sinh ra là iodine?" | nhỏ nước chlorine vào ống KI; rồi nhỏ hồ tinh bột | ống KI hoá **đỏ nâu** (D2); thêm hồ tinh bột hoá **xanh đen** (D8) | đã nhỏ đủ 2 thứ |
| 5 | Bromine thử sức | bri | "Bromine có đẩy được iodine không? Có đẩy được chlorine không?" | nhỏ nước bromine vào ống KI và ống NaCl | ống KI hoá đỏ nâu (D3); ống NaCl chỉ có màu cam nhạt của chính nước bromine, không có chất mới (D4), ghi "không phản ứng" | đã nhỏ cả 2 ống |
| 6 | Iodine thử sức | bri | "Còn iodine, nó đẩy được ai?" | nhỏ nước iodine vào ống NaBr và ống NaCl; rồi kéo ba thẻ Cl₂, Br₂, I₂ vào thứ tự mạnh → yếu | hai ống chỉ có màu của nước iodine, "không phản ứng" (D5); xếp đúng thì bảng tổng kết hiện đủ 6 ô | xếp đúng thứ tự |
| 7 | Nhìn vào trong | tv | "Bên trong ống nghiệm, 'đẩy ra khỏi muối' thật ra là chuyện gì?" | chọn lần lượt 2 cặp: Cl₂ + Br⁻ và I₂ + Br⁻ | cặp đầu: phân tử Cl₂ lấy electron của 2 ion Br⁻, thành 2 Cl⁻ và 1 Br₂; cặp sau: va chạm nhưng không đổi. Chú thích ghi "nói gọn: nguyên tử nhỏ hơn hút electron mạnh hơn" (theo D7, không khẳng định là nguyên nhân duy nhất) | đã xem cả 2 cặp |
| 8 | Thao tác sai | prep | "Nếu quên bật tủ hút hoặc bỏ cốc NaOH thì chuyện gì xảy ra?" | cố tình tắt quạt HOẶC nhấc cốc NaOH ra, rồi mở khoá phễu | khí vàng lục thoát ra ngoài; đồng hồ khí độc lên "Cảnh báo" rồi "Nguy hiểm"; bàn tự khoá phễu, hiện lời an toàn; phải bật quạt + đặt lại cốc mới làm tiếp | đã gây lỗi và đã sửa |
| 9 | Sát hạch | cl + bri | "Ba ống mất nhãn chứa muối chloride, bromide, iodide. Tìm ra từng ống." | được dùng nước chlorine, nước bromine, hồ tinh bột; gắn nhãn cho 3 ống | hiện tượng do kho hoá học tính, thứ tự ống xáo ngẫu nhiên mỗi lần | gắn đúng cả 3 nhãn |

**Bảng tổng kết** (hiện dần từ bước 3 đến 6, thay cho bảng thời gian của bài mẫu): hàng = nước chlorine, nước bromine, nước iodine; cột = muối chloride, bromide, iodide; ô = "đẩy được" (kèm màu) hoặc "không phản ứng"; ô cùng nguyên tố để trống.

### Mạch nối giữa hai bước

Khi soạn bài mới, ghi ở đầu bước sau điều học sinh mang theo từ bước trước (mẫu, kết quả hay câu hỏi), vật liệu dùng ở bàn hiện tại và mục đích so sánh. Khi có mẫu mới, gọi tên mẫu mới. Cho phép đọc lời nối cả khi học sinh vào thẳng bước bằng thanh điều hướng. Trong Halogen, lời nối nằm ở trường `bridge` của giáo án dùng chung cho 2D và 3D.

| Sang bước | Điều được tiếp nối |
|---|---|
| 2 · Điều chế chlorine | Từ toàn cảnh, em đến bàn có tủ hút để quan sát chlorine ở trạng thái khí trong mô phỏng. |
| 3 · Chlorine gặp bromide | Bàn trước cho thấy chlorine ở dạng khí. Bàn này có sẵn nước chlorine để thử với bromide. Mẫu khí ở bàn trước vẫn ở nguyên đó. |
| 4 · Chlorine gặp iodide | Để so với kết quả của bromide, em tiếp tục dùng nước chlorine. Lần này, hai ống mới chứa muối iodide. |
| 5 · Bromine thử sức | Giữ iodide làm điểm so sánh với bước trước. Trên bàn mới, em dùng nước bromine thay cho nước chlorine. |
| 6 · Iodine thử sức | Hai hàng đầu của bảng dành cho chlorine và bromine. Em thử nước iodine với các ống mới để điền hàng cuối và so sánh cả ba. |
| 7 · Nhìn vào trong | Dùng hai ô trong bảng kết quả, một có phản ứng và một không đổi. Mô hình hạt giúp em giải thích sự khác nhau đó. |
| 8 · Thao tác sai | Tạm rời mô hình hạt và trở lại tủ hút. Lần này, em quan sát cảnh báo an toàn của hệ thống. |
| 9 · Sát hạch | Dùng các dấu hiệu đã ghi ở bàn thử muối để nhận biết ba ống mới A, B và C. Mỗi ống cần có một lượt thử riêng. |

Sau khi đạt sát hạch, học sinh có thể mở nhiệm vụ nước máy từ thẻ kết quả. Nhiệm vụ có mẫu và tiến độ riêng.

## 3b. BỔ SUNG 26/11: mỗi bàn đủ 6 chức năng như bài mẫu (chủ: "Bổ sung cho đủ")
HUB đối chiếu với chuẩn bài mẫu (`LUONG_1_BAI_HOC.md` mục 2.22) thấy bản đầu thiếu. Mục này GHI ĐÈ lên phần "việc phải làm" ở mục 3 khi hai bên khác nhau. Sáu chức năng: 1 Chuẩn bị (tay) · 2 Chọn điều kiện (tay) · 3 Khởi động (tay) · 4 Quan sát, đo · 5 Ghi · 6 Làm lại (tay).

**Luật chung cho cả 3 bàn (giữ đúng như bài mẫu):**
- Mỗi thao tác tay có nút sinh đôi đánh số ở bảng phải; nút kế tiếp sáng; món đến lượt có vòng sáng; chạm sai thứ tự chỉ hiện dòng nhắc việc phải làm trước.
- Món nào nằm trên bàn ở bước đó cũng phải có việc; món chỉ dùng ở bước khác thì cất đi (ví dụ lọ nước bromine ở bàn 2 chỉ hiện ở bước Sát hạch).
- Chạm vào bất kì món nào cũng hiện tên và vai trò của nó trong một dòng.
- Xong một ống, một bình thì nhãn đổi màu, nháy và có lời báo "XONG" (cơ chế `marks` của bài mẫu).
- Nạp lại trang: bước đã làm giữ dấu "Đã làm" VÀ bàn dựng lại đúng trạng thái đã làm, không để bàn trắng cạnh kết luận cũ.

**Bàn 2 `cl` · Chlorine gặp muối halide**
| Chức năng | Việc |
|---|---|
| 1 Chuẩn bị | Ống nghiệm ban đầu RỖNG. Chạm lọ dung dịch muối (thêm 2 lọ `bottle`: sodium bromide, potassium iodide) để rót vào ống: một lần rót chia cho ống đối chứng và ống thí nghiệm, 2 mL mỗi ống |
| 2 Chọn điều kiện | Số giọt nước chlorine do người học TỰ CHỌN: thanh kéo + ô nhập số, 1 đến 80 giọt, bị chặn bởi sức chứa ống nghiệm (cơ chế lượng tự chọn của bài mẫu). Có 2 nút gợi ý nhanh: "Nhỏ ít" và "Nhỏ dư" |
| 3 Khởi động | Chạm lọ nhỏ giọt: nhỏ đúng số giọt đã chọn vào ống thí nghiệm; ống đối chứng nhận cùng số giọt nước cất |
| 4 Quan sát | Màu ống, kết tủa nếu có, phương trình; nhỏ hồ tinh bột để nhận ra iodine |
| 5 Ghi | Mỗi lần nhỏ thành 1 dòng trong bảng kết quả của bàn: ống · chất nhỏ · số giọt · hiện tượng · phương trình; đồng thời điền ô tương ứng ở bảng tổng kết 3 × 3 |
| 6 Làm lại | Chạm vòi nước: rửa ống, tráng nước cất, ống về rỗng |
- Bước 3 "Đã làm" khi: đã nhỏ ống đối chứng và ống NaBr. Bước 4 "Đã làm" khi: ống KI đã chạy ÍT NHẤT 2 MỨC giọt khác nhau, trong đó một lần ít (dung dịch đỏ nâu) và một lần dư (có kết tủa xám đen, `facts.md` D2), và đã thử hồ tinh bột một lần. Ít hay dư do KHO tính ra, bài không viết cứng ngưỡng; hai nút gợi ý lấy số giọt sao cho kho cho ra đúng hai hiện tượng đó.

**Bàn 3 `bri` · Bromine và iodine thử sức**
| Chức năng | Việc |
|---|---|
| 1 Chuẩn bị | Ống rỗng; chạm lọ muối (thêm lọ `bottle`: potassium iodide, sodium chloride, sodium bromide) để rót 2 mL vào ống |
| 2 Chọn điều kiện | Chọn lọ halogen sẽ nhỏ (nước bromine hoặc nước iodine) và số giọt tự chọn như bàn 2 |
| 3 Khởi động | Chạm lọ nhỏ giọt: nhỏ vào ống đang chọn |
| 4 Quan sát | Màu, kết tủa, phương trình hoặc "không phản ứng" |
| 5 Ghi | Như bàn 2 |
| 6 Làm lại | Rửa ống ở vòi |
- Bước 6 xếp hạng làm NGAY TRÊN BÀN: ba lọ chlorine, bromine, iodine đặt lên một kệ 3 ô ghi "mạnh nhất · giữa · yếu nhất"; chạm một lọ rồi chạm ô để đặt (bảng phải có 3 nút sinh đôi). Xếp đúng thì kệ sáng và bảng tổng kết hiện đủ.

**Bàn 1 `prep` · Điều chế chlorine**
| Chức năng | Việc |
|---|---|
| 1 Chuẩn bị | Bộ dụng cụ ban đầu CHƯA NỐI. Người học nối theo đúng thứ tự dòng khí: bình cầu → bình rửa khí → bình thu → cốc NaOH (chạm lần lượt hai món để nối một đoạn ống). Nối sai thứ tự: dòng nhắc, không nối. Rồi bật quạt tủ hút |
| 2 Chọn điều kiện | Tốc độ nhỏ HCl đặc: "Nhỏ chậm" hoặc "Nhỏ nhanh" (chỉ là hai mức, KHÔNG hiện số giọt, thể tích hay khối lượng) |
| 3 Khởi động | Mở khoá phễu nhỏ giọt |
| 4 Quan sát, đo | Khí vàng lục chạy theo ống; thanh "bình thu: trống → đầy"; đồng hồ khí độc của phòng |
| 5 Ghi | Mỗi lần chạy 1 dòng: quạt bật hay tắt · cốc NaOH có hay không · nhỏ chậm hay nhanh · bình thu đầy nhanh hay chậm · mức khí độc cao nhất |
| 6 Làm lại | Khoá phễu, đậy bình thu, để quạt chạy tới khi đồng hồ về "An toàn", bộ dụng cụ về trạng thái đầu (vẫn nối sẵn) |
- Bước 2 "Đã làm" khi: đã nối đủ, đã chạy cả hai tốc độ (2 dòng). Bước 8 dùng lại bàn này: tắt quạt hoặc nhấc cốc NaOH thì cảnh báo và khoá như đã định nghĩa.
- Vẫn giữ luật an toàn: không con số pha chế nào ở bàn này.

## 3c. SỬA THEO LUẬT THAO TÁC 26/11 (chủ: "Duyệt, sửa bài")
Mọi động tác của bài phải đúng `lab_khoa_hoc_20261118/LUAT_THAO_TAC.md` (T1 đến T11, H1 đến H8). Mục này GHI ĐÈ mục 3 và 3b khi khác nhau. Việc cụ thể cho bài này:
| # | Sửa | Theo luật |
|---|---|---|
| 1 | Nhỏ giọt: lọ ĐỨNG YÊN, chỉ ống hút được rút ra, giữ thẳng đứng trên miệng ống, không chạm; thấy từng giọt rơi, có bộ đếm "7/20 giọt"; trả ống hút về đúng lọ | T1 |
| 2 | Bàn 2 và bàn 3 thêm lọ nhỏ giọt **Nước cất**. Ống đối chứng được nhỏ THẬT bằng lọ đó, cùng số giọt, thành một động tác riêng nhìn thấy được (trước hoặc sau ống thí nghiệm) | T11 |
| 3 | Chuẩn bị: KHÔNG nghiêng lọ rót thẳng vào ống nghiệm. Dung dịch muối đựng trong lọ có ống hút; lấy 2 mL bằng chính ống hút đó (hai lần hút), mực ống dâng dần, hiện "1 mL", "2 mL" | T2 |
| 4 | Mỗi bàn có ống nghiệm thêm **cốc thải** (ảnh `beaker`, nhãn "Cốc thải"). Làm lại = đổ dung dịch vào cốc thải (mực cốc thải dâng, có màu) → rửa dưới vòi, thấy nước chảy → tráng nước cất bằng bình tia → đặt lại lên giá | T8 |
| 5 | Cận cảnh: khi đang thao tác, khung tự phóng tới cụm đang dùng để ống nghiệm và lọ cao ít nhất 35% sân khấu; vùng dung dịch đổi màu cao ít nhất 40 điểm ảnh ở bề ngang 1440; xong thì lùi ra. Không sửa thể tích cho to | H1, H2, H3 |
| 6 | 2D và 3D cùng bộ đồ: giá ống nghiệm gỗ, lọ nhỏ giọt nâu bóp cao su đỏ, vòi nước và chậu như ảnh trong kho `assets/flat`. Bản 3D đổi cho giống | H7 |
| 7 | Bàn 1 giữ nguyên các việc; chỉ kiểm lại T9, T10 và H1 (bộ điều chế đủ to) | T9, T10 |
| 8 | Nhịp: mỗi thao tác 1,5 đến 4 giây; 5 giọt đầu rơi chậm đủ đếm, sau đó nhanh dần | H6 |
Nghiệm thu: chạy `tools/kiem_thao_tac.py` cho bước 3, 4, 5 ở cả hai mode; HUB xem tấm tổng mới đánh "Xong".

## 4. Luật bắt buộc về hoá học
- Màu, kết tủa, phương trình ở bàn 2, bàn 3 và sát hạch KHÔNG viết cứng trong bài: giáo án hỏi kho hoá học dùng chung (`free/tubechem.js`: tạo ống, thêm chất, nhận sự kiện) rồi hiện đúng cái kho trả về. Fork Logic đang thêm luật "halogen mạnh đẩy halogen yếu" và các chất.
- Bàn 1 (điều chế) chỉ diễn hoạt cảnh, không tính lượng. KHÔNG hiện khối lượng, thể tích, tỉ lệ pha chế (yêu cầu an toàn của danh mục). Phương trình điều chế chỉ hiện khi D10 có nguồn độc lập; chưa có thì ghi lời "KMnO₄ tác dụng với HCl đặc sinh ra khí chlorine".
- Lời an toàn (bàn 1 và mọi lúc có nước chlorine, nước bromine): lấy theo mục 3 của `facts.md`.

## 5. Mode Thực tế · nhiệm vụ "Nước máy nhà mình còn đủ clo không?"
Dựa ý tưởng nhiệm vụ trong tài liệu STEMLabs; lời tự viết lại. Dùng bàn 2D. Sửa 26/11 cho KHỚP ĐÚNG 6 PHẦN của tài liệu (đặc tả mục 7.1), để sau này ghép sang không phải viết lại. Tên trường trong `giao_an.js` đặt theo tài liệu: `application: { missionTitle, hook, context, facts[], textbookLink, mission{ simPreset, goal, hiddenReadouts, success }, questions{ predict, compute, extend }, answers[], solutionSteps[], media[], sources[] }`.
| Phần | Nội dung | Người học làm gì, thấy gì |
|---|---|---|
| 1 Tên nhiệm vụ + hình | "Nước máy nhà mình còn đủ clo không?" + ảnh bối cảnh `assets/life13/CHEM10-05` (vòi nước) | xem |
| 2 Câu hỏi mồi | "Muốn biết mẫu nước có đạt chỉ tiêu clo dư tự do, em dựa vào đâu?" | chọn A/B, chưa hiện đáp án |
| 3 Bối cảnh thật, số liệu có nguồn | khoảng clo dư cho phép 0,2 đến 1,0 mg/L (D11); số nào chưa có nguồn thì gắn nhãn "giả định" | đọc, bấm xem nguồn |
| 4 Liên hệ SGK | chỉ ghi vị trí: Hoá 10, Bài 21 (không chép nội dung) | xem |
| 5 Nhiệm vụ trong mô phỏng | mẫu nước có lượng clo ẨN (một trong 0,1 · 0,2 · 0,5 · 1,0 · 2,0 mg/L, ngẫu nhiên); mục tiêu: xác định mẫu đạt hay không | nhỏ KI rồi hồ tinh bột, mẫu hoá xanh đậm nhạt theo lượng clo; so với dãy 5 ống chuẩn; chọn ống gần nhất và kết luận; đúng thì hiện "Hoàn thành" và lộ số ẩn |
| 6 Câu hỏi bậc thang + lời giải hiện dần | (a) dự đoán: thay KI bằng KBr thì phép thử có nhạy bằng không? (b) tính: 0,50 mg/L Cl₂ tạo bao nhiêu mg/L I₂ (đáp số 1,79, D12) (c) mở rộng: vì sao quy chuẩn đặt cả mức dưới 0,2 mg/L? | trả lời từng câu, bấm để hiện lời giải từng bước |
- Độ đậm của màu xanh theo nồng độ là HÌNH MINH HOẠ để so sánh, không phải số đo thật: ghi rõ dòng này dưới dãy ống chuẩn.
- Hoàn thành khi chọn đúng ống chuẩn, kết luận đúng, tính đúng (sai số 0,02).

## 5b. Giữ khớp với STEMLabs (để ghép sau)
- `giao_an.js` xuất thêm khối `content` theo tên trường của tài liệu: `objectives[]`, `safety[]`, `equipment[]`, `guidedSteps[]` (chính là 9 bước), `discussionQuestions[]`, `presentation.predictions[]` (mỗi bước có câu hỏi dự đoán thì khai ở đây), `application` (mục 5), `source` (sách, chương, bài, trang, ngày kiểm).
- Phần tính toán là hàm thuần, không chạm màn hình (kho hoá học và mô hình số đã như vậy).
- Màu và chữ lấy qua biến của hệ thiết kế, không viết mã màu cứng trong bài.

## 6. Chia việc và phạm vi tệp (mỗi lần một fork, xong báo thẳng HUB)
| Thứ tự | Fork | Việc | Tệp |
|---|---|---|---|
| a | L2·Logic (đang làm) | chất + luật đẩy halogen + kiểm thử | `chem/data.js`, `free/tubechem.js`, test |
| b | L1·UX | `giao_an.js` của bài theo đúng mục 2, 3, 4; thêm vào tủ đồ 3D các kind mới (hood, stand, sideflask, dropfunnel, gaswash, beaker, gasmeter) và thao tác mới (bật tắt, mở khoá, nhỏ giọt, xếp thẻ); mode 3D chạy đủ 9 bước | `lessons/h10_nhom_halogen/giao_an.js`, `lesson.js`, `kit/labset.js`, `kit/labware_l1.js` |
| c | L2·UX | bộ máy 2D đọc cùng giáo án: thêm các kind mới bằng ảnh `assets/flat`, ống dẫn khí, tủ hút, đồng hồ khí độc; mode 2D chạy đủ 9 bước | `flat/labset2d.js` |
| d | L2·UX | mode Thực tế theo mục 5 | tệp mới `flat/thuc_te.js` + khai nhiệm vụ trong `giao_an.js` |
| e | L1·UX | ba nút mode ở đầu trang bài; khai bài vào `catalog/hoa.js` (`READY`) | `shell/**`, `catalog/hoa.js` |

## 7. Điều kiện nghiệm thu (HUB kiểm từng mục, báo chủ Đạt / Cần sửa / Chưa kiểm)
1. Từ menu vào được bài; ba nút mode đổi qua lại không mất bước đang đứng.
2. 2D và 3D: cùng 9 bước, cùng lời, cùng kết quả ở từng ống; bảng tổng kết giống nhau.
3. Kết quả từng ống đúng với `facts.md` D1 đến D5; sát hạch xáo ống mỗi lần và chấm đúng.
4. Bước 8: tắt quạt hoặc bỏ cốc NaOH thì có cảnh báo và bị khoá; sửa xong làm tiếp được.
5. Không chỗ nào hiện tỉ lệ pha chế của phần điều chế chlorine.
6. Chữ không đè dụng cụ; bề ngang 1440 và 375 không cuộn ngang; không lỗi console.
7. Mọi bộ kiểm thử in ĐẠT; bài mẫu Tốc độ phản ứng và trang Thực hành không đổi hành vi.
8. Trước khi gắn nhãn “dùng được”, rà từng dữ kiện trong facts.md và ghi nhận giáo viên duyệt. D8, D9 và D11 đã có nguồn. D10 cần đối chiếu độc lập.
