import { createShell } from './shell/shell.js';
import { meta, steps, createLesson } from './lessons/h10_toc_do_phan_ung_01/lesson.js';

const root = document.getElementById('app');
if (/[?&]film=1/.test(location.search)) { window.__FILM = true; document.documentElement.classList.add('film'); }
try {
  const shell = createShell(root, { meta, steps });
  const lesson = createLesson(shell);
  shell.attach(lesson);
  window.__lab = { shell, lesson };
} catch (err) {
  console.error(err);
  root.innerHTML = `<p style="padding:24px">Không mở được phòng thí nghiệm 3D trên máy này. Lỗi: ${String(err && err.message || err)}</p>`;
}
