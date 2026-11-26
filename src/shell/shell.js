// Vỏ bài học dùng chung: tiêu đề, chuỗi nhân quả, thanh bước, thẻ bước, chân trang, lưu tiến độ.
// Bài học cắm vào qua shell.attach(lesson) với: enter(i), renderPanel(i, host), isDone(i).
// Trang có <html data-ui="ds">: thêm vỏ app theo DESIGN_SYSTEM.md (sidebar, topbar có breadcrumb); kiểu dáng ở ds.css + shell_ds.css. Logic bước, lưu tiến độ, phím tắt không đổi.
import { icon } from '../free/icons.js';
import { READY } from '../catalog/hoa.js';

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(3)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(String(kid))); }
  return el;
}
export const fmt = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

// Nhóm nút chọn một (dùng cho nồng độ, nhiệt độ...).
export function seg({ label, options, value, onChange, disabled = false, hint }) {
  const row = h('div', { class: 'lk-seg', role: 'radiogroup', 'aria-label': label });
  options.forEach((o) => row.append(h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(o.v === value), class: o.v === value ? 'is-on' : '', disabled,
    onclick: () => onChange(o.v),
  }, o.label)));
  return h('div', { class: 'lk-field' }, h('div', { class: 'lk-label' }, label, hint && h('small', {}, hint)), row);
}
export function stat(label, unit = '') {
  const v = h('b', { text: '–' });
  const el = h('div', { class: 'lk-stat' }, h('span', { text: label }), h('div', {}, v, unit && h('em', { text: ' ' + unit })));
  return { el, set: (t) => { if (v.textContent !== t) v.textContent = t; } };
}

export function createShell(root, { meta, steps }) {
  const KEY = 'lab_khoa_hoc:' + meta.id;
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
  const state = { step: Math.min(saved.step || 0, steps.length - 1), revealed: new Set(saved.revealed || []), data: saved.data || {} };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ step: state.step, revealed: [...state.revealed], data: state.data })); } catch { /* không lưu được thì thôi */ } };
  let lesson = null;

  const els = {
    score: h('span', { class: 'lk-score', text: '' }),
    rail: h('nav', { class: 'lk-rail', 'aria-label': 'Các bước' }),
    stage: h('section', { class: 'lk-stage', 'aria-label': 'Bàn thí nghiệm 3D' }),
    hud: h('div', { class: 'lk-hud' }),
    overlay: h('div', { class: 'lk-overlay', hidden: true }),
    card: h('section', { class: 'lk-card' }),
    panel: h('section', { class: 'lk-panel' }),
    prev: h('button', { class: 'lk-nav', type: 'button', onclick: () => go(state.step - 1) }, '‹ Bước trước'),
    next: h('button', { class: 'lk-nav is-pri', type: 'button', onclick: () => go(state.step + 1) }, 'Bước sau ›'),
    count: h('span', { class: 'lk-count' }),
    note: h('p', { class: 'lk-note', text: meta.disclaimer || '' }),
    actions: h('div', { class: 'lk-actions' }), // nút của bài trên thanh tên bài (bố cục 'full')
  };
  els.stage.append(els.hud, els.overlay);
  const chain = h('div', { class: 'lk-chain' }, meta.chain.map((c, i) => [i > 0 && h('span', { class: 'lk-arrow', text: '→' }), h('span', { class: 'lk-link' }, h('b', { text: c[0] }), ' ', c[1])]));
  const DS = document.documentElement.dataset.ui === 'ds';
  // meta.layout = 'full' (khung gọn theo trang mẫu, LUONG_1_BAI_HOC.md mục 2.17): cảnh 3D phủ kín vùng làm việc, thẻ "Bước này" bên trái và "Bảng điều khiển" bên phải nổi lên trên;
  // đầu trang ba hàng: tên bài + câu hỏi chính + nút của bài · chuỗi nhân quả (mắt xích đang học sáng) · thanh bước; menu trái thành menu trượt dưới 1600 px.
  const FULL = DS && meta.layout === 'full';
  if (FULL) root.classList.add('is-full');
  // BA NÚT MODE trên sân khấu (chủ 26/11: "vào bài chọn mode cho trực quan hơn"): 2D · 3D · Thực tế, chỉ ở bài có meta.book và có trong READY của danh mục.
  // Mode đang xem sáng; mode chưa có mờ, chạm thì báo "Sắp ra mắt". Bấm mode khác: đổi &mode= trên địa chỉ, giữ bước khi đổi giữa hai cách xem cùng hoạt động.
  // Cụm nút nằm trong cảnh; kit/labui.js (zoomBox) đặt nó sát bên trái ô phóng to.
  const Q = new URLSearchParams(location.search), READY_ = FULL && meta.book && READY[meta.book.code];
  if (READY_) {
    // mode đang xem THẬT: theo &mode= trên địa chỉ; không có thì là 3D (bài mở 3D khi không ghi mode), bài chưa có 3D thì mode đầu tiên của danh mục
    const has = READY_.modes || [], ALL = ['2d', '3d', 'thuc-te'], cur = ALL.includes(Q.get('mode')) ? Q.get('mode') : has.includes('3d') ? '3d' : has[0];
    els.modes = h('div', { class: 'lk-modes', role: 'group', 'aria-label': 'Chọn cách xem bài' }, [['2d', '2D'], ['3d', '3D'], ['thuc-te', 'Thực tế']].map(([m, label]) => {
      const ok = has.includes(m), b = h('button', { type: 'button', class: (m === cur ? 'is-on' : '') + (ok ? '' : ' is-soon'), 'aria-pressed': String(m === cur), 'aria-disabled': ok ? null : 'true', title: ok ? (m === cur ? 'Đang xem' : 'Chuyển sang ' + label) : 'Sắp ra mắt' }, label);
      b.addEventListener('click', () => {
        if (!ok) { b.textContent = 'Sắp ra mắt'; clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = label; }, 1600); return; }
        if (m === cur) return;
        const u = new URL(location.href);
        u.searchParams.set('mode', m);
        if (cur === 'thuc-te' || m === 'thuc-te') u.searchParams.delete('buoc');
        else u.searchParams.set('buoc', String(state.step + 1));
        location.href = u.toString();
      });
      return b;
    }));
    els.stage.append(els.modes); els.stage.classList.add('has-modes'); // tự đứng ở góc trên phải sân khấu; có ô phóng to (3D) thì labui.js dời vào sát bên trái ô đó
  }
  const startStep = () => { const b = Number(Q.get('buoc')); return READY_ && Number.isInteger(b) && b >= 1 && b <= steps.length ? b - 1 : state.step; }; // &buoc=N khi vừa đổi mode
  const top = (withScore) => h('header', { class: 'lk-top' },
    h('div', { class: 'lk-titlebar' }, FULL && h('button', { class: 'quiet icon-only lk-menu', type: 'button', 'aria-label': 'Mở menu', onclick: () => root.classList.add('menu-open') }, icon('menu')),
      FULL && meta.book && h('a', { class: 'lk-back', href: `./bai_hoc.html?khoi=${(/CHEM(\d+)-/.exec(meta.book.code) || [])[1] || ''}`, title: 'Về danh sách bài học theo khối' }, '← Chọn bài khác'), // lối về trang chọn khối → chọn bài (bai_hoc.html), chỉ bài có meta.book (bản 3)
      h('span', { class: 'lk-grade', text: FULL && meta.book ? `${meta.grade} · Chương ${meta.book.chapter} · Bài ${meta.book.lesson}` : meta.grade, // bài có khai meta.book (bản 3): ghi rõ khối, chương, bài
        title: FULL && meta.book ? `${meta.book.series} · Chương ${meta.book.chapter}: ${meta.book.chapterTitle} · Bài ${meta.book.lesson}: ${meta.book.lessonTitle} · trang ${meta.book.pages} · mã ${meta.book.code}` : null }), h('h1', { class: 'lk-title', text: meta.title }),
      FULL && meta.mainQuestion ? h('span', { class: 'lk-mainq' }, h('b', { text: 'Câu hỏi chính' }), h('span', { text: meta.mainQuestion })) : h('span', { class: 'lk-eq', text: meta.equation }),
      FULL && els.actions, withScore && els.score),
    FULL ? [h('div', { class: 'lk-chainrow' }, h('span', { class: 'lk-chainlab', text: 'Chuỗi nhân quả' }), chain), els.rail] : [chain, els.rail]);
  const body = [h('main', { class: 'lk-main' }, els.stage, els.card, els.panel), h('footer', { class: 'lk-foot' }, h('div', { class: 'lk-footbar' }, els.prev, els.count, els.next), els.note)];
  if (!DS) root.replaceChildren(top(true), ...body);
  else { root.classList.add('ds'); const keycap = (ic) => h('span', { class: 'nav-icon' }, icon(ic));
    // Giao diện tự phóng theo cửa sổ như trang thực hành (bề ngang thiết kế 1920 px). window.__uiZoom để cảnh 3D và các canvas vẽ đủ nét và đo đúng kích thước.
    const fit = () => { const k = Math.max(1, innerWidth / 1920); window.__uiZoom = k; root.style.zoom = k; root.style.width = `calc(100vw / ${k})`; root.style.height = `calc(100dvh / ${k})`; }; addEventListener('resize', fit); fit();
    // "Khám phá" chưa có trang mở được nên menu mới có hai mục đang chạy thật: bài học mẫu này và bàn thực hành
    root.replaceChildren(
      h('aside', { class: 'app-sidebar', 'aria-label': 'Lab Khoa Học' },
        h('div', { class: 'brand-row' }, h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, icon('flask-conical')), h('span', { text: 'Lab Khoa Học' })), h('button', { class: 'quiet icon-only menu-close', type: 'button', 'aria-label': 'Đóng menu', onclick: () => root.classList.remove('menu-open') }, icon('x'))),
        h('nav', { class: 'app-nav', 'aria-label': 'Điều hướng chính' }, h('div', { class: 'nav-group', role: 'group', 'aria-label': 'Phòng lab' }, h('p', { class: 'nav-caption', 'aria-hidden': 'true', text: 'Phòng lab' }),
          h('button', { type: 'button', 'aria-current': 'page' }, keycap('graduation-cap'), h('span', { text: 'Bài học mẫu' })),
          h('button', { type: 'button', onclick: () => { location.href = './thuc_hanh.html'; } }, keycap('flask-conical'), h('span', { text: 'Bàn thực hành' }))))),
      h('button', { class: 'menu-backdrop', type: 'button', 'aria-label': 'Đóng menu', onclick: () => root.classList.remove('menu-open') }),
      h('div', { class: 'app-main' },
        h('header', { class: 'app-header' }, h('button', { class: 'quiet icon-only menu-toggle', type: 'button', 'aria-label': 'Mở menu', onclick: () => root.classList.add('menu-open') }, icon('menu')),
          h('div', { class: 'breadcrumb' }, h('span', { text: 'Lab Khoa Học' }), icon('chevron-right'), h('span', { text: 'Bài học' }), icon('chevron-right'), h('strong', { text: meta.grade })), h('div', { class: 'heading-actions' }, !FULL && els.score)),
        top(FULL), ...body)); }
  steps.forEach((s, i) => els.rail.append(h('button', { type: 'button', 'data-i': i, title: s.short, onclick: () => go(i) }, h('i', { text: String(i + 1) }), h('span', { text: s.short }))));

  function renderCard() {
    if (lesson && lesson.renderCard) { els.card.replaceChildren(); lesson.renderCard(state.step, els.card); return; } // bài tự dựng thẻ "Bước này"
    const i = state.step, s = steps[i], done = lesson ? lesson.isDone(i) : false;
    const kids = [
      h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short }),
        s.task && h('span', { class: 'lk-status' + (done ? ' is-done' : ''), text: done ? 'Đã làm' : 'Chưa làm' })),
      h('h2', { class: 'lk-q', text: s.q }),
      s.ctx && h('p', { class: 'lk-ctx', text: s.ctx }),
      s.task && h('div', { class: 'lk-task' }, h('b', { text: 'Làm thử' }), h('p', { text: s.task })),
    ];
    if (s.conclusion) {
      if (state.revealed.has(i)) {
        kids.push(h('div', { class: 'lk-concl' }, h('b', { text: 'Kết luận' }), h('p', { text: s.conclusion })),
          s.points && h('div', { class: 'lk-points' }, h('b', { text: 'Ý chính' }), h('ul', {}, s.points.map((p) => h('li', { text: p })))),
          s.tip && h('div', { class: 'lk-tipbox' }, h('b', { text: 'Gợi ý điểm thi' }), h('p', { text: s.tip })));
      } else {
        kids.push(h('button', { class: 'lk-btn' + (done ? ' is-pri' : ''), type: 'button', onclick: () => { state.revealed.add(i); save(); renderCard(); } }, done ? 'Hiện kết luận' : 'Hiện kết luận (em chưa làm thử)'));
      }
    }
    els.card.replaceChildren(...kids.filter(Boolean));
  }
  const canEnter = (i) => !lesson?.canEnter || lesson.canEnter(i);
  function renderRail() {
    [...els.rail.children].forEach((b, i) => { b.disabled = !canEnter(i); b.classList.toggle('is-on', i === state.step); b.classList.toggle('is-done', !!lesson && lesson.isDone(i)); if (i === state.step) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    // Chuỗi nhân quả sáng theo bước: bước nào khai báo link (số thứ tự mắt xích, hoặc mảng) thì mắt xích đó sáng
    const on = [].concat(steps[state.step].link ?? []);
    chain.querySelectorAll('.lk-link').forEach((el, k) => el.classList.toggle('is-on', on.includes(k)));
    els.count.textContent = `Bước ${state.step + 1} / ${steps.length}`;
    els.prev.disabled = state.step === 0; els.next.disabled = state.step === steps.length - 1 || !canEnter(state.step + 1);
  }
  function go(i) {
    if (i < 0 || i >= steps.length || !canEnter(i)) return;
    state.step = i; save();
    if (READY_ && Q.has('buoc')) {
      const url = new URL(location.href);
      url.searchParams.set('buoc', String(i + 1));
      history.replaceState(history.state, '', url);
    }
    els.panel.replaceChildren(); els.hud.replaceChildren(); els.overlay.hidden = true; els.overlay.replaceChildren();
    if (lesson) { lesson.enter(i); lesson.renderPanel(i, els.panel); }
    renderCard(); renderRail();
    root.querySelector('.lk-main').scrollTo({ top: 0 }); els.card.scrollTo({ top: 0 }); els.panel.scrollTo({ top: 0 });
  }
  window.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(state.step + 1); else if (e.key === 'ArrowLeft') go(state.step - 1);
  });

  const shell = {
    els, state, save, go,
    refresh: () => { renderCard(); renderRail(); },
    rerenderPanel: () => { els.panel.replaceChildren(); lesson.renderPanel(state.step, els.panel); },
    setScore: (t) => { els.score.textContent = t; },
    attach(l) {
      lesson = l;
      let i = startStep();
      while (i > 0 && !canEnter(i)) i--;
      go(i);
    },
    full: FULL,
  };
  return shell;
}
