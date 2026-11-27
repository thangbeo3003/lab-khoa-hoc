// KHUÔN MODE THỰC TẾ, KIỂU "ĐẶT THÔNG SỐ CHO ĐẠT MỤC TIÊU" (27/11, cho các bài sa bàn: Haber, lò cao, mưa acid…). DEFINE_SA_BAN.md mục 9.2, 9.3.
// Cùng 6 phần, cùng tên trường STEMLabs, cùng kiểu dáng với khuôn flat/thuc_te.js (kiểu "mẫu có số ẩn, so dãy chuẩn"), chỉ khác phần 5:
//   thay vì chấm một mẫu, học sinh chạy mô phỏng qua các LẦN CHẠY theo kịch bản của tài liệu (simPreset), lần đầu phải đoán trước khi kết quả lộ ra,
//   lần cuối tự chỉnh thông số cho đạt mục tiêu, rồi chọn lời giải thích. Tách tệp riêng để không đụng khuôn của bài Halogen.
// Bài khai:
//   application = { missionTitle, hook{ q, options, answer, why }, context, facts[{ text, source, sourceUrl?, status }], textbookLink{ ref, kind },
//     mission{ goal, target{ value, unit, label }, knobs[{ key, name, unit, range[min,max,step], hint, dec? }], runs[{ short, label, cfg, tog, free[], enable[], note, predict? }],
//              pass(row, cfg) → bool, passWhy, explain{ q, options, answer, why }, readout(row, run) → { label, big, unit }, cells(row) → [[nhãn, giá trị]×3], line(row) → chuỗi },
//     questions{ predict, compute{ q, unit, answer, tol }, extend }, answers[3], solutionSteps[], media[{ file, credit, license, alt }], sources[{ text, url }] }
//   sim = { create(stageEl) → { lab, bid, canvas, set({ cfg, tog, enable, hide, target, last }), cfg(cfg), onRow(f), live() } }: phần mô phỏng riêng của bài (bàn 2D, sơ đồ…).
//   lab.on('change') và lab.on('say') thuộc khuôn; phần mô phỏng của bài không đăng kí hai sự kiện này (bộ máy chỉ giữ một hàm cho mỗi sự kiện).
import { h } from '../shell/shell.js';
import { procList, bindSafeArea, tuckHandles, vcard } from '../shell/labui.js';

const BADGE = { ok: ['có nguồn', 'var(--positive)', 'var(--positive-soft)'], calc: ['tính từ số trên', 'var(--accent-hover,#4d3fdc)', '#eeedfe'], checking: ['đang kiểm nguồn', 'var(--warning)', '#fdf3e2'], assumed: ['giả định', 'var(--warning)', '#fdf3e2'] };
const badge = (st) => { const b = BADGE[st] || BADGE.assumed; return h('span', { style: `display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:600;color:${b[1]};background:${b[2]};white-space:nowrap`, text: b[0] }); };
const num = (v, d = 0) => Number(v).toLocaleString('vi-VN', { maximumFractionDigits: d });
// Đọc số kiểu Việt Nam: "453.700", "453 700", "453700", "6,7" đều đọc được
export function parseVN(s) {
  let t = String(s ?? '').trim().replace(/\s/g, '');
  if (!t) return NaN;
  if (t.includes('.') && t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  else t = t.replace(',', '.');
  return Number(t);
}
const CSS = `
.nv-runs { display:flex; gap:6px; margin:0 0 8px; } .nv-runs button { flex:1; min-height:30px; padding:4px 6px; border:1px solid var(--border,#e7e6ee); border-radius:9px; background:#fff; font:600 12px/15px inherit; font-family:inherit; color:var(--muted,#666878); cursor:pointer; }
.nv-runs button.is-on { border-color:var(--accent,#6254f4); color:var(--accent-hover,#4d3fdc); background:#f2f1ff; } .nv-runs button.is-done::before { content:"✓ "; color:var(--positive,#157347); } .nv-runs button:disabled { opacity:.45; cursor:default; }
.nv-knob { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0 8px; align-items:baseline; margin:0 0 3px; } .nv-knob label { font-size:12.5px; font-weight:600; } .nv-knob output { font:600 13.5px/17px "IBM Plex Mono",ui-monospace,monospace; }
.nv-knob input { grid-column:1 / -1; width:100%; margin:0; accent-color:var(--accent,#6254f4); } .nv-knob small { grid-column:1 / -1; font-size:11px; color:var(--muted,#666878); } .nv-knob.is-off label, .nv-knob.is-off output { color:var(--muted,#666878); }
.nv-tbl { width:100%; border-collapse:collapse; table-layout:fixed; margin:6px 0 0; font-size:11.5px; line-height:15px; } .nv-tbl td, .nv-tbl th { padding:3px; border-bottom:1px solid var(--border,#e7e6ee); text-align:left; font-variant-numeric:tabular-nums; } .nv-tbl th { color:var(--muted,#666878); font-weight:600; } .nv-tbl tr.is-hit td { background:#eaf7ee; }
`;

export function createTargetMission({ lessonMeta, application: A, sim }) {
  const M = A.mission, RUNS = M.runs, LAST = RUNS.length - 1;
  const meta = { ...lessonMeta, id: lessonMeta.id + '_thuc_te', title: 'Thực tế: ' + A.missionTitle, mainQuestion: A.hook.q, equation: lessonMeta.equation || '', layout: 'full',
    chain: [['Câu hỏi mồi', 'đời sống'], ['Bối cảnh', 'số liệu có nguồn'], ['Mô phỏng', 'ca trực'], ['Giải thích', 'câu hỏi bậc thang']],
    disclaimer: (lessonMeta.disclaimer || '') + ' Mode Thực tế: ca trực là mô phỏng; sản lượng và chi phí là mô hình của bài, chỉ để thấy chiều hướng.' };
  const steps = [
    { short: 'Nhiệm vụ', bench: null, link: [0, 1, 2, 3], q: A.missionTitle, todo: 'Đọc nhiệm vụ và nhìn sơ đồ bối cảnh.' },
    { short: 'Câu hỏi mồi', bench: null, link: 0, q: A.hook.q, todo: 'Chọn một ý. Đáp án hiện ở phần Bối cảnh thật.' },
    { short: 'Bối cảnh thật', bench: null, link: 1, q: 'Số liệu thật nói gì, và con số nào có nguồn?', todo: 'Đọc từng số liệu, bấm "Xem nguồn" để biết số đó lấy từ đâu.' },
    { short: 'Liên hệ SGK', bench: null, link: 1, q: 'Bài nào trong sách giúp làm nhiệm vụ này?', todo: 'Xem vị trí bài trong sách.' },
    { short: 'Ca trực', bench: 'sim', link: 2, q: M.goal, todo: `Chạy ${RUNS.length} lần theo bảng phải (lần đầu đoán trước), lần cuối tự chỉnh cho đạt mục tiêu.` },
    { short: 'Câu hỏi bậc thang', bench: null, link: 3, q: 'Ba câu hỏi: dự đoán, tính, mở rộng.', todo: 'Trả lời từng câu; bấm "Xem lời giải" để hiện lời giải từng bước.' },
  ];

  function createLesson(shell) {
    const stageEl = shell.els.stage; stageEl.closest('.lk').classList.add('is-v3');
    if (!document.getElementById('nv-css')) document.head.append(h('style', { id: 'nv-css', text: CSS }));
    const D = shell.state.data;
    D.done = D.done || {}; D.src = D.src || {}; D.q = D.q || {}; D.rev = D.rev || {}; D.rows = D.rows || []; D.run = D.run ?? 0;
    D.cfg = { ...RUNS[LAST].cfg, ...(D.cfg || {}) };
    D.done[4] = !!D.explainOk && D.rows.some((r) => r.run === LAST && M.pass(r));
    D.done[5] = Boolean(D.q.predict && D.q.computeOk);
    const canEnter = (i) => i !== 5 || D.done[4];
    const S = { step: 0, ui: null };
    const photo = h('img', { class: 'lk-tt-photo', src: (A.media[0] || {}).file || '', alt: (A.media[0] || {}).alt || '', style: 'position:absolute;left:16px;right:16px;top:60px;bottom:16px;width:calc(100% - 32px);height:calc(100% - 76px);object-fit:contain;border-radius:16px;z-index:1;background:#fff' });
    const toastEl = h('div', { class: 'lk-toast', hidden: true, role: 'status', style: 'top:58px' });
    stageEl.append(photo, toastEl);
    const X = sim.create(stageEl), lab = X.lab;
    let toastT = 0; const toast = (t, sec = 7) => { if (!t) return; toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, sec * 1000); };
    lab.on('say', (t) => { if (!hidden()) toast(t, 8); });
    const syncInsets = bindSafeArea(shell, lab.stage, () => 0);
    tuckHandles(shell, () => requestAnimationFrame(() => syncInsets()));
    const save = () => shell.save();
    const markDone = (i) => { if (D.done[i]) return; D.done[i] = true; save(); shell.refresh(); };
    const runOf = (k) => RUNS[k], rowsOf = (k) => D.rows.filter((r) => r.run === k);
    const hidden = () => !!runOf(D.run).predict && !D.pred; // lần có câu đoán: chưa đoán thì kết quả bị che (STEMLabs: "đồng hồ sản lượng bị che đến khi học sinh dự đoán xong")
    const canRun = (k) => k === 0 || rowsOf(k - 1).length > 0;
    const cfgNow = () => { const R = runOf(D.run); return D.run === LAST ? { ...R.cfg, ...D.cfg } : { ...R.cfg }; };
    function setBench() { X.set({ cfg: cfgNow(), tog: runOf(D.run).tog, enable: runOf(D.run).enable, hide: hidden(), target: M.target.value, last: rowsOf(D.run).slice(-1)[0] || null }); }
    X.onRow((row) => {
      const r = { ...row, run: D.run }; D.rows.push(r); if (D.rows.length > 40) D.rows.splice(0, D.rows.length - 40);
      if (D.run === LAST && M.pass(r) && !D.explainOk) toast(`Đạt mục tiêu: ${M.line(r)}. Chọn lời giải thích ở thẻ bên trái để hoàn thành.`, 9);
      else if (D.run === LAST && !M.pass(r) && M.miss) toast(M.miss(r), 9); // chưa đạt: nói rõ thiếu gì
      save(); shell.refresh(); shell.rerenderPanel(); // thẻ trái có bảng các lần chạy: vẽ lại
    });

    // ---------- Thẻ "Bước này" (trái): như khuôn flat/thuc_te.js ----------
    const put = (host, ...kids) => host.append(...kids.flat(3).filter(Boolean));
    const ph = (title, hint) => h('div', { class: 'lk-ph' }, h('b', { text: title }), h('span', { text: hint }));
    const btn = (text, onclick, pri) => h('button', { class: 'lk-btn' + (pri ? ' is-pri' : ''), type: 'button', onclick }, text);
    function choice(opts, value, onPick, answer) {
      return h('div', { class: 'lk-cardfoot', style: 'flex-direction:column;align-items:stretch' }, opts.map((o) => h('button', { class: 'lk-btn' + (value === o.k ? ' is-pri' : ''), type: 'button', style: 'text-align:left;justify-content:flex-start;white-space:normal;height:auto;padding:8px 12px', 'aria-pressed': String(value === o.k), onclick: () => onPick(o.k) },
        h('b', { text: o.k + '. ' }), o.text, answer && answer === o.k ? ' ✓' : '')));
    }
    function card(i, host) {
      const s = steps[i], done = !!D.done[i];
      put(host, ph('Bước này', `Phần ${i + 1}/6 · Nhiệm vụ thực tế`),
        h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short })),
        h('h2', { class: 'lk-q', text: s.q }),
        !(i === 4 && D.rows.length) && h('div', { class: 'lk-task' }, h('b', {}, 'Làm thử', h('span', { class: 'lk-status' + (done ? ' is-done' : ''), text: done ? 'Đã làm' : 'Chưa làm' })), h('p', { text: s.todo }))); // ca trực đã chạy: bảng phải dẫn việc, thẻ trái nhường chỗ cho lời và bảng các lần chạy
      if (i === 0) put(host, h('p', { class: 'lk-msg', text: 'Nhiệm vụ của em: ' + M.goal }), A.media[0] && h('p', { class: 'lk-msg', style: 'font-size:12px;color:var(--muted)', text: `Hình: ${A.media[0].credit}` }));
      if (i === 1) put(host, choice(A.hook.options, D.hook, (k) => { D.hook = k; save(); markDone(1); shell.refresh(); }), D.hook && h('p', { class: 'lk-msg', text: `Em chọn ${D.hook}. Đáp án hiện ở phần Bối cảnh thật.` }));
      if (i === 2) {
        const cut = A.context.indexOf('. ') + 1, lead = cut > 0 ? A.context.slice(0, cut) : A.context, rest = cut > 0 ? A.context.slice(cut).trim() : '';
        put(host, h('p', { class: 'lk-msg', text: lead }), rest && h('details', { class: 'hg-more tt-more' }, h('summary', { text: 'Đọc thêm bối cảnh' }), h('p', { class: 'lk-msg', text: rest })),
          D.hook && h('div', { class: 'lk-concl' }, h('b', { text: `Câu hỏi mồi: em chọn ${D.hook}, đáp án ${A.hook.answer}` }), h('p', { text: A.hook.why })),
          h('ul', { class: 'lk-ideas' }, A.facts.map((f, n) => h('li', {}, f.text, badge(f.status || 'ok'), ' ',
            h('button', { class: 'lk-btn tt-src', type: 'button', 'aria-expanded': String(!!D.src[n]), onclick: () => { D.src = D.src[n] ? {} : { [n]: true }; save(); markDone(2); shell.refresh(); } }, D.src[n] ? 'Ẩn nguồn' : 'Xem nguồn'),
            D.src[n] && h('p', { class: 'lk-msg', style: 'font-size:12.5px' }, 'Nguồn: ', f.sourceUrl ? h('a', { href: f.sourceUrl, target: '_blank', rel: 'noopener noreferrer', text: f.source }) : f.source)))));
      }
      if (i === 3) put(host, h('div', { class: 'lk-concl' }, h('b', { text: 'Vị trí trong sách' }), h('p', { text: A.textbookLink.ref })), h('p', { class: 'lk-msg', style: 'color:var(--muted)', text: 'Chỉ ghi vị trí: ' + A.textbookLink.kind + '.' }));
      if (i === 4) {
        // Thẻ trái phần 5 (vừa khung 1440×900): lời của lần đang chạy, hoặc lời giải lời đoán (lần 2), hoặc câu giải thích (lần cuối đã đạt), hoặc kết luận khi xong; dưới cùng là bảng các lần chạy
        const R = runOf(D.run), E = M.explain, hit = D.run === LAST && rowsOf(LAST).some((r) => M.pass(r));
        if (D.done[4]) put(host, h('div', { class: 'lk-concl' }, h('b', { text: 'Hoàn thành ca trực' }), h('p', { text: E.why })));
        else if (hit) put(host, h('div', { class: 'lk-box' }, h('h3', { text: E.q }), choice(E.options, D.explain, (k) => { D.explain = k; D.explainOk = k === E.answer; D.done[4] = D.explainOk; save(); toast(D.explainOk ? 'Hoàn thành ca trực. Sang phần 6: câu hỏi bậc thang.' : 'Chưa đúng. Nhìn lại bảng các lần chạy rồi chọn lại.', 8); shell.refresh(); shell.rerenderPanel(); })));
        else if (D.run === 1 && D.pred && rowsOf(1).length && RUNS[0].predict) { const P = RUNS[0].predict; put(host, h('div', { class: 'lk-concl' }, h('b', { text: `Em đoán ${D.pred}, đáp án ${P.answer}` }), h('p', { text: P.why }))); }
        else put(host, h('div', { class: 'lk-box' }, h('h3', { text: `Lần ${D.run + 1}/${RUNS.length} · ${R.label}` }), h('p', { class: 'lk-msg', text: R.note })));
        if (D.rows.length) put(host, h('table', { class: 'nv-tbl' }, h('caption', { text: 'Các lần chạy của ca', style: 'caption-side:top;text-align:left;font-size:12px;font-weight:600;padding:0 0 3px' }), h('thead', {}, h('tr', {}, M.cols.map((c) => h('th', { text: c })))), h('tbody', {}, D.rows.slice(-3).map((r) => h('tr', { class: r.run === LAST && M.pass(r) ? 'is-hit' : '' }, M.row(r).map((c) => h('td', { text: c })))))));
      }
      if (i === 5) put(host, questionsUI());
      put(host, h('div', { class: 'lk-cardfoot' }, done && i < steps.length - 1 && btn(`Sang phần ${i + 2} ›`, () => shell.go(i + 1))));
    }
    function questionsUI() {
      const Q = A.questions, [ansP, ansC, ansE] = A.answers, rev = (k, n) => { D.rev[k] = Math.max(D.rev[k] || 0, n); save(); shell.refresh(); };
      const open = S.qOpen ?? (D.q.predict ? 1 : 0), mark = [!!D.q.predict, !!D.q.computeOk, !!D.rev.e];
      let qn = 0; const box = (title, ...kids) => { const k = qn++; return k === open ? h('div', { class: 'lk-box' }, h('h3', { text: title }), ...kids)
        : h('button', { class: 'lk-box tt-qfold', type: 'button', 'aria-expanded': 'false', onclick: () => { S.qOpen = k; shell.refresh(); } }, h('span', { text: title }), h('em', { text: mark[k] ? '✓' : 'Mở' })); };
      const input = h('input', { type: 'text', inputmode: 'decimal', 'aria-label': 'Đáp số (' + Q.compute.unit + ')', value: D.q.compute ?? '', style: 'width:120px;padding:6px 8px;border:1px solid var(--control-border);border-radius:10px;font:inherit' });
      const doCheck = () => { D.q.compute = input.value; const v = parseVN(input.value); D.q.computeOk = Number.isFinite(v) && Math.abs(v - Q.compute.answer) <= Q.compute.tol; D.done[5] = Boolean(D.q.predict && D.q.computeOk); save(); shell.refresh(); };
      return [
        box('1. Dự đoán · ' + Q.predict.q, choice(Q.predict.options, D.q.predict, (k) => { D.q.predict = k; save(); if (D.q.computeOk) markDone(5); shell.refresh(); }, D.rev.p ? Q.predict.answer : null),
          D.q.predict && (D.rev.p ? h('p', { class: 'lk-msg' }, h('b', { text: `Đáp án: ${ansP.value}. ` }), ansP.method) : btn('Xem lời giải', () => rev('p', 1)))),
        box('2. Tính · ' + Q.compute.q, h('div', { class: 'lk-cardfoot', style: 'align-items:center' }, input, h('span', { text: Q.compute.unit }), btn('Kiểm tra', doCheck, true)),
          D.q.compute != null && D.q.compute !== '' && h('p', { class: 'lk-msg', style: `color:${D.q.computeOk ? 'var(--positive)' : 'var(--warning)'}`, text: D.q.computeOk ? `Đúng: ${ansC.value}.` : 'Chưa đúng. Thử lại, hoặc xem lời giải từng bước.' }),
          A.solutionSteps.slice(0, D.rev.c || 0).map((t, n) => h('p', { class: 'lk-msg', text: `Bước ${n + 1}. ${t}` })),
          (D.rev.c || 0) < A.solutionSteps.length && btn((D.rev.c || 0) ? 'Hiện bước tiếp' : 'Xem lời giải', () => rev('c', (D.rev.c || 0) + 1)),
          (D.rev.c || 0) >= A.solutionSteps.length && h('p', { class: 'lk-msg', style: 'color:var(--muted)', text: ansC.method })),
        box('3. Mở rộng · ' + Q.extend.q, D.rev.e ? h('p', { class: 'lk-msg' }, h('b', { text: ansE.value + '. ' }), ansE.method) : btn('Xem lời giải', () => rev('e', 1))),
      ];
    }

    // ---------- Bảng điều khiển (phải) ----------
    function goRun(k) { if (!canRun(k)) return; D.run = k; save(); setBench(); shell.refresh(); shell.rerenderPanel(); }
    function knob(K, can) {
      const [min, max, stepv] = K.range, out = h('output'), el = h('div', { class: 'nv-knob' + (can ? '' : ' is-off') }), v = () => cfgNow()[K.key];
      const show = () => { out.textContent = `${num(v(), K.dec || 0)} ${K.unit}`; };
      const input = h('input', { type: 'range', min, max, step: stepv, value: v(), disabled: !can || null, 'aria-label': K.name, oninput: (e) => { D.cfg[K.key] = Number(e.target.value); show(); save(); if (X.cfg) X.cfg(cfgNow()); else setBench(); } }); // kéo thanh: chỉ đổi số, không dựng lại bàn
      el.append(h('label', { text: K.name }), out, input, ...((K.hint || !can) ? [h('small', { text: can ? K.hint : 'lần này giữ nguyên theo kịch bản' })] : [])); show(); return el;
    }
    function panel(i, host) {
      if (i !== 4) {
        host.classList.remove('tt-compact'); host.classList.add('tt-list');
        put(host, ph('Bảng điều khiển', 'Tiến độ nhiệm vụ'),
          h('ol', { class: 'lk-proc' }, steps.map((s, n) => h('li', { class: 'lk-pstep' + (D.done[n] ? ' is-done' : '') + (n === i ? ' is-next' : '') }, h('span', { class: 'lk-pn', text: D.done[n] ? '✓' : String(n + 1) }), h('div', { class: 'lk-pb' }, h('button', { class: 'lk-btn' + (n === i ? ' is-pri' : ''), type: 'button', disabled: !canEnter(n), onclick: () => shell.go(n) }, s.short))))),
          i === 2 && h('div', { class: 'lk-box' }, h('h3', { text: 'Nguồn của nhiệm vụ' }), h('ul', { class: 'lk-ideas' }, A.sources.map((x) => h('li', {}, x.url ? h('a', { href: x.url, target: '_blank', rel: 'noopener noreferrer', text: x.text }) : x.text)))));
        S.ui = null; return;
      }
      host.classList.remove('tt-list'); host.classList.add('tt-compact');
      const R = runOf(D.run), last = rowsOf(D.run).slice(-1)[0], label = h('span'), big = h('b'), unit = h('em'), cells = [0, 1, 2].map(() => vcard()), proc = h('div', { class: 'hg-compact' });
      const tabs = h('div', { class: 'nv-runs', role: 'group', 'aria-label': 'Các lần chạy' }, RUNS.map((r, k) => h('button', { type: 'button', class: (k === D.run ? 'is-on' : '') + (rowsOf(k).length ? ' is-done' : ''), disabled: !canRun(k) || null, onclick: () => goRun(k) }, r.short)));
      const pred = R.predict && h('div', { class: 'lk-box' }, h('h3', { text: 'Đoán trước · ' + R.predict.q }), h('div', { class: 'lk-seg', role: 'radiogroup', 'aria-label': 'Đoán trước' }, R.predict.options.map((o) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(D.pred === o.k), class: D.pred === o.k ? 'is-on' : '', onclick: () => { D.pred = o.k; save(); setBench(); shell.rerenderPanel(); } }, o.text))));
      put(host, ph('Bảng điều khiển', 'Chạy theo kịch bản'), tabs,
        h('div', { class: 'lk-read' }, label, h('div', {}, big, unit)), h('div', { class: 'lk-vcards' }, cells.map((c) => c.el)), pred,
        D.run === LAST ? M.knobs.map((K) => knob(K, (R.free || []).includes(K.key))) : h('p', { class: 'lk-msg', style: 'font-size:12px', text: 'Cài đặt lần này: ' + M.knobs.map((K) => `${num(cfgNow()[K.key], K.dec || 0)} ${K.unit}`).join(' · ') }),
        h('h3', { class: 'lk-sub', text: 'Việc trên sơ đồ' }), proc,
        D.run < LAST && rowsOf(D.run).length > 0 && h('div', { class: 'lk-cardfoot' }, btn(`Sang lần ${D.run + 2} ›`, () => goRun(D.run + 1), true)));
      function sync() {
        const rd = (X.live && X.live()) || M.readout(last, D.run, hidden()); label.textContent = rd.label; big.textContent = rd.big; unit.textContent = rd.unit || ''; // đang chạy: phần mô phỏng của bài trả lời thay
        M.cells(hidden() ? null : last).forEach(([a, b], n) => cells[n].set(a, b));
        proc.replaceChildren(); put(proc, procList(lab, X.bid));
      }
      S.ui = { sync }; sync();
    }
    lab.on('change', () => { if (S.ui) S.ui.sync(); });
    let acc = 0; lab.stage.onFrame((dt) => { acc += dt || 0; if (acc > 0.25 && S.ui && X.live && X.live()) { acc = 0; S.ui.sync(); } }); // số đang chạy nhảy theo

    return {
      lab, state: S, canEnter,
      enter(i) {
        S.step = i; S.ui = null;
        const on = steps[i].bench === 'sim'; photo.style.display = on ? 'none' : ''; X.canvas.style.display = on ? '' : 'none';
        if (on) setBench();
        if (i === 0 || i === 3) markDone(i);
        requestAnimationFrame(syncInsets);
      },
      renderCard: (i, host) => card(i, host),
      renderPanel: (i, host) => panel(i, host),
      isDone: (i) => !!D.done[i],
    };
  }
  return { meta, steps, createLesson };
}
