# Lab Khoa Học

Phòng thực hành Hoá học ảo chạy trên trình duyệt (bản thử). Chọn hoá chất, rót vào ống nghiệm, xem hiện tượng trên bàn và xem các hạt gặp nhau trong vòng kính.

## Xem trên web

- [Bàn thực hành desktop](https://thangbeo3003.github.io/lab-khoa-hoc/thuc_hanh.html)
- [Bố cục bàn thực hành trước](https://thangbeo3003.github.io/lab-khoa-hoc/thuc_hanh.html?layout=classic)
- [Bài mẫu Tốc độ phản ứng · bản 3](https://thangbeo3003.github.io/lab-khoa-hoc/index.html?v=3)

## Chạy trên máy

Không cần cài gì ngoài Python 3:

```bash
python3 serve.py 5183
```

Rồi mở http://localhost:5183/thuc_hanh.html. Từ 1024 px, trang mở bố cục v2.

## Kiểm thử phần hoá học

```bash
node src/chem/engine.test.mjs
node src/free/tubechem.test.mjs
node src/free/ionmodel.test.mjs
```

## Ghi chú

- Mã thuần JavaScript (ES modules), không có bước đóng gói. Three.js 0.160 nằm sẵn trong `vendor/`.
- Font Inter (giấy phép OFL) và icon Lucide (giấy phép ISC): xem `assets/ds/`.
- Ảnh nền và ảnh dụng cụ là ảnh tạo bằng AI, không phải ảnh chụp.
- Nội dung hoá học chưa có giáo viên duyệt.
