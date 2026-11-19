// Vỏ bài học dùng chung: tiêu đề, chuỗi nhân quả, thanh bước, thẻ bước, chân trang, lưu tiến độ.
// Bài học cắm vào qua shell.attach(lesson) với: enter(i), renderPanel(i, host), isDone(i).

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
  };
  els.stage.append(els.hud, els.overlay);
  const chain = h('div', { class: 'lk-chain' }, meta.chain.map((c, i) => [i > 0 && h('span', { class: 'lk-arrow', text: '→' }), h('span', { class: 'lk-link' }, h('b', { text: c[0] }), ' ', c[1])]));
  root.replaceChildren(
    h('header', { class: 'lk-top' },
      h('div', { class: 'lk-titlebar' }, h('span', { class: 'lk-grade', text: meta.grade }), h('h1', { class: 'lk-title', text: meta.title }), h('span', { class: 'lk-eq', text: meta.equation }), els.score),
      chain, els.rail),
    h('main', { class: 'lk-main' }, els.stage, els.card, els.panel),
    h('footer', { class: 'lk-foot' }, h('div', { class: 'lk-footbar' }, els.prev, els.count, els.next), els.note),
  );
  steps.forEach((s, i) => els.rail.append(h('button', { type: 'button', 'data-i': i, title: s.short, onclick: () => go(i) }, h('i', { text: String(i + 1) }), h('span', { text: s.short }))));

  function renderCard() {
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
  function renderRail() {
    [...els.rail.children].forEach((b, i) => { b.classList.toggle('is-on', i === state.step); b.classList.toggle('is-done', !!lesson && lesson.isDone(i)); if (i === state.step) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    els.count.textContent = `Bước ${state.step + 1} / ${steps.length}`;
    els.prev.disabled = state.step === 0; els.next.disabled = state.step === steps.length - 1;
  }
  function go(i) {
    if (i < 0 || i >= steps.length) return;
    state.step = i; save();
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
    attach: (l) => { lesson = l; go(state.step); },
  };
  return shell;
}
