import { createShell } from './shell/shell.js';

const root = document.getElementById('app');
if (/[?&]film=1/.test(location.search)) { window.__FILM = true; document.documentElement.classList.add('film'); }
// Mặc định mở bài mẫu bản 1 (11 bước). Thêm ?v=2 để mở bản 2 đang dựng: một bàn 3D 4 trạm, 10 bước (LUONG_1_BAI_HOC.md mục 2).
const V2 = /[?&]v=2(?!\d)/.test(location.search); // chấp nhận cả khi link dính ký tự thừa ở cuối (ví dụ ?v=2' do chép kèm dấu nháy)
// ?v=3: bản 3 (20/11), một phòng lab 4 bàn, mỗi bàn một bộ thí nghiệm đầy đủ, tay làm trên dụng cụ (LUONG_1_BAI_HOC.md mục 2.21 đến 2.24).
const V3 = /[?&]v=3(?!\d)/.test(location.search);
// ?bai=<mã bài>: mở bài theo mã của danh mục (src/catalog/hoa.js). Không có ?bai= thì mọi thứ như cũ.
const BAI = { 'CHEM10-05': './lessons/h10_nhom_halogen/lesson.js', 'CHEM11-04': './lessons/h11_ammonia/lesson.js' }[new URLSearchParams(location.search).get('bai')] || null;
// &mode=thuc-te (26/11): mở nhiệm vụ Thực tế của bài (khuôn flat/thuc_te.js) thay cho bài học, cùng khung trang; bài chưa có nhiệm vụ thì như cũ.
const THUC_TE = new URLSearchParams(location.search).get('mode') === 'thuc-te' ? { 'CHEM10-05': './lessons/h10_nhom_halogen/thuc_te.js', 'CHEM11-04': './lessons/h11_ammonia/thuc_te.js' }[new URLSearchParams(location.search).get('bai')] || null : null;
// Kiểu chữ IBM Plex (chủ chốt 21/11) cho bản 3 và các bài mở bằng ?bai=; bản 1 đóng băng, bản 2 giữ nguyên.
if (V3 || BAI) { const fs = document.createElement('script'); fs.src = './src/free/ds_font.js'; document.head.appendChild(fs); }
try {
  const { meta, steps, createLesson } = await import(THUC_TE ? THUC_TE : BAI ? BAI : V3 ? './lessons/h10_toc_do_phan_ung_03/lesson.js' : V2 ? './lessons/h10_toc_do_phan_ung_02/lesson.js' : './lessons/h10_toc_do_phan_ung_01/lesson.js');
  if (meta.book) document.title = `${meta.title} · Lab Khoa Học`; // tab trình duyệt mang tên bài đang mở (bài có meta.book: bản 3 và các bài mở bằng ?bai=)
  const shell = createShell(root, { meta, steps });
  const lesson = createLesson(shell);
  shell.attach(lesson);
  window.__lab = { shell, lesson };
} catch (err) {
  console.error(err);
  root.innerHTML = `<p style="padding:24px">Không mở được phòng thí nghiệm 3D trên máy này. Lỗi: ${String(err && err.message || err)}</p>`;
}
