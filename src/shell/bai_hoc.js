// Trang chọn KHỐI → chọn BÀI của Lab 1 (bai_hoc.html). Chủ 25/11: "chọn khối chọn bài giảng đúng k rồi m sẽ vào bài đó".
// Data chỉ đọc ở src/catalog/hoa.js: LESSONS (78 bài SGK Kết nối tri thức) và READY (bài đã dựng: đường mở + các mode đã có).
// Hai cách xếp: "Theo sách" (khối → chương → bài) và "Theo thứ tự làm" (danh sách phẳng theo order, lọc theo khối hoặc tất cả khối).
// Khối và cách xếp chọn lần trước được nhớ trong localStorage; ?khoi=10 trên địa chỉ (lối "← Chọn bài khác" của bài học) được ưu tiên.
import { h } from './shell.js';
import { icon } from '../free/icons.js';
import { LESSONS, READY } from '../catalog/hoa.js';

const KEY = 'lab_khoa_hoc:bai_hoc';
const GRADES = [10, 11, 12];
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* chế độ riêng tư: không nhớ được thì thôi */ } };

const saved = load(), q = new URLSearchParams(location.search), fromUrl = Number(q.get('khoi'));
const S = {
  grade: GRADES.includes(fromUrl) ? fromUrl : GRADES.includes(saved.grade) || saved.grade === 'all' ? saved.grade : 10,
  sort: saved.sort === 'order' ? 'order' : 'book',
};
if (S.sort === 'book' && S.grade === 'all') S.grade = 10; // "Tất cả khối" chỉ có ở cách xếp theo thứ tự làm

const byGrade = (g) => LESSONS.filter((l) => g === 'all' || l.grade === g);
const ready = (l) => READY[l.code] || null;
const nReady = LESSONS.filter(ready).length;

const root = document.getElementById('app');
const keycap = (ic) => h('span', { class: 'nav-icon' }, icon(ic));
const crumbGrade = h('strong');
const gradeRow = h('div', { class: 'bh-seg', role: 'radiogroup', 'aria-label': 'Chọn khối lớp' });
const sortRow = h('div', { class: 'bh-seg is-sort', role: 'radiogroup', 'aria-label': 'Cách xếp bài' });
const list = h('div', { class: 'bh-list' });

root.replaceChildren(
  h('aside', { class: 'app-sidebar', 'aria-label': 'Lab Khoa Học' },
    h('div', { class: 'brand-row' }, h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, icon('flask-conical')), h('span', { text: 'Lab Khoa Học' })),
      h('button', { class: 'quiet icon-only menu-close', type: 'button', 'aria-label': 'Đóng menu', onclick: () => root.classList.remove('menu-open') }, icon('x'))),
    h('nav', { class: 'app-nav', 'aria-label': 'Điều hướng chính' },
      h('div', { class: 'nav-group', role: 'group', 'aria-label': 'Bài học theo sách' }, h('p', { class: 'nav-caption', 'aria-hidden': 'true', text: 'Bài học theo SGK' }),
        h('button', { type: 'button', 'aria-current': 'page' }, keycap('graduation-cap'), h('span', { text: 'Bài học Hoá' }))),
      h('div', { class: 'nav-group', role: 'group', 'aria-label': 'Thực hành' }, h('p', { class: 'nav-caption', 'aria-hidden': 'true', text: 'Thực hành' }),
        h('button', { type: 'button', onclick: () => { location.href = './thuc_hanh.html'; } }, keycap('test-tube'), h('span', { text: 'Lab tự do' }))))),
  h('button', { class: 'menu-backdrop', type: 'button', 'aria-label': 'Đóng menu', onclick: () => root.classList.remove('menu-open') }),
  h('div', { class: 'app-main' },
    h('header', { class: 'app-header' }, h('button', { class: 'quiet icon-only menu-toggle', type: 'button', 'aria-label': 'Mở menu', onclick: () => root.classList.add('menu-open') }, icon('menu')),
      h('div', { class: 'breadcrumb' }, h('span', { text: 'Lab Khoa Học' }), icon('chevron-right'), h('span', { text: 'Bài học Hoá' }), icon('chevron-right'), crumbGrade)),
    h('main', { class: 'bh-work' },
      h('div', { class: 'bh-head' },
        h('div', { class: 'bh-title' }, h('h1', { text: 'Bài học Hoá theo sách giáo khoa' }),
          h('p', { class: 'bh-sub', text: 'Bộ Kết nối tri thức với cuộc sống · chọn khối, rồi chọn bài để vào học' })),
        h('p', { class: 'bh-count', text: `${nReady} bài dùng được · ${LESSONS.length - nReady} sắp ra mắt` })),
      h('div', { class: 'bh-tools' }, gradeRow, sortRow),
      list)));

function seg(host, items, on, pick) {
  host.replaceChildren(...items.map(([v, label, sub]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === on), class: v === on ? 'is-on' : '', onclick: () => pick(v) },
    h('span', { text: label }), sub != null && h('small', { text: sub }))));
}

function badges(l) {
  const m = (ready(l) || {}).modes || [];
  return h('span', { class: 'bh-modes' }, ['2d', '3d'].map((k) => h('span', { class: 'bh-mode' + (m.includes(k) ? ' is-on' : ''), title: m.includes(k) ? `Có bản ${k.toUpperCase()}` : `Chưa có bản ${k.toUpperCase()}`, text: k.toUpperCase() })));
}

function card(l, withPlace) {
  const r = ready(l);
  return h('li', { class: 'bh-item' + (r ? ' is-ready' : '') },
    withPlace ? h('span', { class: 'bh-no is-order', title: 'Thứ tự làm', text: String(l.order) }) : h('span', { class: 'bh-no', text: `Bài ${l.lesson}` }),
    h('div', { class: 'bh-main' },
      h('b', { class: 'bh-name', text: l.lessonTitle }),
      h('span', { class: 'bh-meta', text: (withPlace ? `Lớp ${l.grade} · Chương ${l.chapter} · Bài ${l.lesson} · ` : '') + `${l.code} · trang ${l.pages}` + (l.kind === 'thi-nghiem' ? ' · có thí nghiệm' : ' · mô hình') }),
      r && r.title && h('span', { class: 'bh-ready-title', text: r.title })),
    badges(l),
    r ? h('a', { class: 'primary bh-go', href: r.href }, 'Vào bài', icon('arrow-right'))
      : h('span', { class: 'bh-soon', text: `Sắp ra mắt · làm thứ ${l.order}` }));
}

function render() {
  save({ grade: S.grade, sort: S.sort });
  const grades = GRADES.map((g) => [g, `Lớp ${g}`, `${byGrade(g).length} bài`]);
  seg(gradeRow, S.sort === 'order' ? [...grades, ['all', 'Tất cả khối', `${LESSONS.length} bài`]] : grades, S.grade, (g) => { S.grade = g; render(); });
  seg(sortRow, [['book', 'Theo sách'], ['order', 'Theo thứ tự làm']], S.sort, (s) => { S.sort = s; if (s === 'book' && S.grade === 'all') S.grade = 10; render(); });
  crumbGrade.textContent = S.grade === 'all' ? 'Tất cả khối' : `Lớp ${S.grade}`;
  const rows = byGrade(S.grade);
  if (S.sort === 'order') {
    list.replaceChildren(h('p', { class: 'bh-note', text: 'Lịch làm bài: bài số 1 làm đầu tiên. Bài đã dựng có nút Vào bài.' }),
      h('ol', { class: 'bh-items is-flat' }, [...rows].sort((a, b) => a.order - b.order).map((l) => card(l, true))));
    return;
  }
  const chapters = [];
  [...rows].sort((a, b) => a.chapter - b.chapter || a.lesson - b.lesson).forEach((l) => {
    let c = chapters[chapters.length - 1]; if (!c || c.no !== l.chapter) chapters.push(c = { no: l.chapter, title: l.chapterTitle, items: [] }); c.items.push(l);
  });
  list.replaceChildren(...chapters.map((c) => h('section', { class: 'bh-chapter', 'aria-label': `Chương ${c.no}` },
    h('h2', {}, h('span', { text: `Chương ${c.no}.` }), ' ', c.title, h('small', { text: `${c.items.length} bài` })),
    h('ul', { class: 'bh-items' }, c.items.map((l) => card(l, false))))));
}
render();
