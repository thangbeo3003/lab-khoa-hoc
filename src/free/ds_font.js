// Bản thử kiểu chữ của Bàn thực hành (21/11, fork L2·UX). Chủ: "Dựng bản so sánh".
// 21/11 03:50 chủ chốt "IBM Plex": không tham số thì mặc định plex. ?font=inter (một mình) = Inter cũ, không nạp thêm tệp nào.
// Trang nạp tệp này: thuc_hanh.html, thuc_hanh_v2.html, và bài học bản 3 (main.js nạp khi ?v=3). Bản 1, bản 2 bài học KHÔNG nạp.
//   ?font=inter | inter2 | plex | bevn    kiểu chữ (inter = đang chạy)
//   &pt=mono                              phương trình hoá học cũng dùng font mono
//   &bo=10                                phím dụng cụ bo 10 px thay vì dạng viên
// Mọi luật nằm ở ds_font.css, chọn theo html[data-font], html[data-pt], html[data-bo]. Nạp bằng thẻ <script> thường (không module) ngay sau ds.css để gắn thuộc tính trước khi trang vẽ.
(function () {
  var q = new URLSearchParams(location.search), d = document.documentElement;
  var font = (q.get('font') || '').toLowerCase();
  if (['inter', 'inter2', 'plex', 'bevn'].indexOf(font) < 0) font = 'plex'; // chủ chốt IBM Plex 21/11; xem lại font cũ bằng ?font=inter
  var pt = q.get('pt') === 'mono', bo = q.get('bo') === '10';
  if ((!font || font === 'inter') && !pt && !bo) return;
  if (font && font !== 'inter') d.setAttribute('data-font', font);
  if (pt) d.setAttribute('data-pt', 'mono');
  if (bo) d.setAttribute('data-bo', '10');
  var me = document.currentScript, l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = me ? me.src.replace(/ds_font\.js(\?.*)?$/, 'ds_font.css') : './src/free/ds_font.css';
  document.head.appendChild(l);
})();
