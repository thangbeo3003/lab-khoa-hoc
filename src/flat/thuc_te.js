// KHUÔN MODE THỰC TẾ (26/11, dùng chung cho mọi bài): một nhiệm vụ gắn đời sống, chạy trong CÙNG khung trang bài học (thanh bước, thẻ "Bước này",
// sân khấu, "Bảng điều khiển") và dùng bộ máy 2D flat/labset2d.js. Bài chỉ khai dữ liệu theo đúng tên trường của tài liệu STEMLabs:
//   application = { missionTitle, hook{ q, options[{k,text}], answer, why }, context, facts[{ text, source, sourceUrl?, status: 'ok'|'checking'|'assumed', assumed }],
//                   textbookLink{ ref, kind }, mission{ simPreset{ bench, samples[], standards[] }, goal, hiddenReadouts[], success{ range[lo,hi], rangeStatus, unit, need[] } },
//                   questions{ predict{ q, options, answer }, compute{ q, unit, answer, tol }, extend{ q } }, answers[{ value, method }] (thứ tự predict, compute, extend),
//                   solutionSteps[] (lời giải câu tính, hiện dần), media[{ file, license, credit, alt }], sources[{ text, url? }] }
//   bench = một bàn theo cùng hợp đồng giáo án (items, steps, init, chem.show), đọc B.opts.sample = mức ẩn của mẫu, có việc var 'match' (chọn ống chuẩn).
// Khuôn sinh ĐÚNG 6 phần theo thứ tự: 1 Tên nhiệm vụ + ảnh bối cảnh · 2 Câu hỏi mồi (chọn A/B, chưa hiện đáp án) · 3 Bối cảnh thật (từng số liệu có nút xem nguồn,
// nhãn "giả định" / "đang kiểm nguồn") · 4 Liên hệ SGK (chỉ vị trí bài) · 5 Nhiệm vụ trong mô phỏng (mẫu có số ẩn, so dãy chuẩn, kết luận Đạt / Không đạt;
// đúng thì "Hoàn thành" và lộ số ẩn, sai thì thử lại với mẫu mới) · 6 Ba câu hỏi bậc thang, lời giải hiện dần.
import { h } from '../shell/shell.js';
import { procList, bindSafeArea, tuckHandles, vcard } from '../shell/labui.js';
import { createLab2d } from './labset2d.js';

const fmt = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const BADGE = { ok: ['có nguồn', 'var(--positive)', 'var(--positive-soft)'], checking: ['đang kiểm nguồn', 'var(--warning)', '#fdf3e2'], assumed: ['giả định', 'var(--warning)', '#fdf3e2'] };
const badge = (st) => { const b = BADGE[st] || BADGE.assumed; return h('span', { style: `display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:600;color:${b[1]};background:${b[2]};white-space:nowrap`, text: b[0] }); };

export function createMission({ lessonMeta, application: A, bench }) {
  const M = A.mission, SAMPLES = M.simPreset.samples, [LO, HI] = M.success.range, UNIT = M.success.unit || '';
  const meta = { ...lessonMeta, id: lessonMeta.id + '_thuc_te', title: 'Thực tế: ' + A.missionTitle, mainQuestion: A.hook.q, equation: '', layout: 'full',
    chain: [['Câu hỏi mồi', 'đời sống'], ['Bối cảnh', 'số liệu có nguồn'], ['Mô phỏng', 'làm nhiệm vụ'], ['Giải thích', 'câu hỏi bậc thang']],
    disclaimer: (lessonMeta.disclaimer || '') + ' Mode Thực tế: nhiệm vụ mô phỏng; độ đậm màu chỉ để so sánh, không phải số đo thật.' };
  const steps = [
    { short: 'Nhiệm vụ', bench: null, link: [0, 1, 2, 3], q: A.missionTitle, todo: 'Đọc nhiệm vụ và nhìn ảnh bối cảnh.' },
    { short: 'Câu hỏi mồi', bench: null, link: 0, q: A.hook.q, todo: 'Chọn A hoặc B. Đáp án hiện ở phần Bối cảnh thật.' },
    { short: 'Bối cảnh thật', bench: null, link: 1, q: 'Số liệu thật nói gì, và con số nào có nguồn?', todo: 'Đọc từng số liệu, bấm "Xem nguồn" để biết số đó lấy từ đâu.' },
    { short: 'Liên hệ SGK', bench: null, link: 1, q: 'Bài nào trong sách giúp làm nhiệm vụ này?', todo: 'Xem vị trí bài trong sách.' },
    { short: 'Làm trong mô phỏng', bench: bench.id, link: 2, q: M.goal, todo: 'Nhỏ KI rồi hồ tinh bột vào mẫu (chạm lọ trên bàn hoặc bấm nút cùng số), chạm ống chuẩn có màu gần mẫu nhất, chọn Đạt hay Không đạt, rồi bấm Kiểm tra.' },
    { short: 'Câu hỏi bậc thang', bench: null, link: 3, q: 'Ba câu hỏi: dự đoán, tính, mở rộng.', todo: 'Trả lời từng câu; bấm "Xem lời giải" để hiện lời giải từng bước.' },
  ];

  function createLesson(shell) {
    const stageEl = shell.els.stage; stageEl.closest('.lk').classList.add('is-v3'); // cùng kiểu dáng bài học bản 3
    const D = shell.state.data;
    D.done = D.done || {}; D.src = D.src || {}; D.log = D.log || []; D.q = D.q || {}; D.rev = D.rev || {}; D.tries = D.tries || 0;
    if (A.hook.revision && D.hookRevision !== A.hook.revision) {
      D.hookRevision = A.hook.revision;
      delete D.hook;
      delete D.done[1];
    }
    D.done[5] = Boolean(D.q.predict && D.q.computeOk);
    if (!SAMPLES.includes(D.sample)) {
      D.sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
      D.log = []; D.verdict = null; D.result = null;
    }
    D.done[4] = D.result === 'ok';
    const canEnter = (i) => i !== 5 || D.done[4];
    const S = { step: 0, replaying: false, ui: null, built: false };
    const photo = h('img', { class: 'lk-tt-photo', src: (A.media[0] || {}).file || '', alt: (A.media[0] || {}).alt || '', style: 'position:absolute;left:16px;right:16px;top:60px;bottom:16px;width:calc(100% - 32px);height:calc(100% - 76px);object-fit:contain;border-radius:16px;z-index:1' });
    const toastEl = h('div', { class: 'lk-toast', hidden: true, role: 'status', style: 'top:58px' }); // dưới cụm nút 2D · 3D · Thực tế ở góc trên
    stageEl.append(photo, toastEl);
    const lab = createLab2d(stageEl, { benches: [bench] }, { bench: bench.id });
    const B = lab.benches[bench.id];
    let toastT = 0; const toast = (t, sec = 7) => { if (S.replaying || !t) return; toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, sec * 1000); };
    lab.on('say', (t) => toast(t));
    function clearGrade() {
      D.result = null;
      D.done[4] = false;
    }
    lab.on('act', (bid, sid, k) => {
      if (S.replaying) return;
      if (sid === 'match' && D.result) {
        clearGrade();
        shell.refresh();
      }
      D.log.push(k === undefined ? [sid] : [sid, k]);
      shell.save();
    });
    lab.on('change', () => { if (S.ui && S.ui.sync) S.ui.sync(); });
    const syncInsets = bindSafeArea(shell, lab.stage, () => 0);
    tuckHandles(shell, () => requestAnimationFrame(() => syncInsets()));
    const save = () => shell.save();
    const markDone = (i) => { if (D.done[i]) return; D.done[i] = true; save(); shell.refresh(); };
    // Dựng bàn đúng mẫu đang làm; các việc đã làm của mẫu này làm lại ngay (nạp lại trang không mất)
    function setupBench() { S.replaying = true; lab.setup(bench.id, { sample: D.sample }); lab.preset(bench.id, D.log); S.replaying = false; S.built = true; }
    function newSample() {
      const pool = SAMPLES.filter((x) => x !== D.sample);
      D.sample = pool.length ? pool[Math.floor(Math.random() * pool.length)] : SAMPLES[0];
      D.log = []; D.verdict = null;
      clearGrade();
      save(); setupBench(); shell.rerenderPanel(); shell.refresh();
      toast('Đã lấy mẫu mới. Hãy làm lại phép thử và chấm mẫu này.');
    }
    function check() {
      const need = (M.success.need || []).filter((sid) => sid !== 'match' && !B.st[sid]);
      if (need.length) return toast('Chưa xong: ' + need.map((sid) => (bench.steps.find((s) => s.id === sid) || {}).label).join(', ') + '.');
      if (!B.st.match) return toast('Chạm ống chuẩn có màu gần mẫu nhất trước.');
      if (!D.verdict) return toast('Chọn Đạt hay Không đạt trước khi kiểm tra.');
      const c = D.sample, okPick = B.level.match === c, okVerdict = (D.verdict === 'dat') === (c >= LO && c <= HI);
      D.tries += 1; D.done[4] = okPick && okVerdict;
      if (okPick && okVerdict) { D.result = 'ok'; toast(`Hoàn thành: mẫu có ${fmt(c)} ${UNIT} clo dư, ${c >= LO && c <= HI ? 'đạt' : 'không đạt'} ${M.success.criterion || 'chỉ tiêu của nhiệm vụ'}.`, 9); }
      else D.result = !okPick ? 'pick' : 'verdict';
      save(); shell.refresh(); shell.rerenderPanel();
    }

    // ---------- Thẻ "Bước này" (trái) ----------
    const put = (host, ...kids) => host.append(...kids.flat(3).filter(Boolean));
    const ph = (title, hint) => h('div', { class: 'lk-ph' }, h('b', { text: title }), h('span', { text: hint }));
    const btn = (text, onclick, pri) => h('button', { class: 'lk-btn' + (pri ? ' is-pri' : ''), type: 'button', onclick }, text);
    function choice(opts, value, onPick, answer) { // nút A/B; answer (tuỳ chọn) đánh dấu đáp án sau khi đã lộ
      return h('div', { class: 'lk-cardfoot', style: 'flex-direction:column;align-items:stretch' }, opts.map((o) => h('button', { class: 'lk-btn' + (value === o.k ? ' is-pri' : ''), type: 'button', style: 'text-align:left;justify-content:flex-start;white-space:normal;height:auto;padding:8px 12px', 'aria-pressed': String(value === o.k), onclick: () => onPick(o.k) },
        h('b', { text: o.k + '. ' }), o.text, answer && answer === o.k ? ' ✓' : '')));
    }
    function card(i, host) {
      const s = steps[i], done = !!D.done[i];
      put(host, ph('Bước này', `Phần ${i + 1}/6 · Nhiệm vụ thực tế`),
        h('div', { class: 'lk-step-head' }, h('span', { class: 'lk-num', text: String(i + 1) }), h('span', { class: 'lk-short', text: s.short })),
        h('h2', { class: 'lk-q', text: s.q }),
        h('div', { class: 'lk-task' }, h('b', {}, 'Làm thử', h('span', { class: 'lk-status' + (done ? ' is-done' : ''), text: done ? 'Đã làm' : 'Chưa làm' })), h('p', { text: s.todo })));
      if (i === 0) put(host, h('p', { class: 'lk-msg', text: 'Nhiệm vụ của em: ' + M.goal }), A.media[0] && h('p', { class: 'lk-msg', style: 'font-size:12px;color:var(--muted)', text: `Ảnh: ${A.media[0].credit} · giấy phép: ${A.media[0].license}` }));
      if (i === 1) put(host, choice(A.hook.options, D.hook, (k) => { D.hook = k; save(); markDone(1); shell.refresh(); }), D.hook && h('p', { class: 'lk-msg', text: `Em chọn ${D.hook}. Đáp án hiện ở phần Bối cảnh thật.` }));
      if (i === 2) {
        // S3 (define 21.1): thẻ trái không phải cuộn ở 1440×900. Bối cảnh hiện câu đầu, phần còn lại sau "Đọc thêm"; nút nguồn nằm cùng dòng với số liệu.
        const cut = A.context.indexOf('. ') + 1, lead = cut > 0 ? A.context.slice(0, cut) : A.context, rest = cut > 0 ? A.context.slice(cut).trim() : '';
        put(host, h('p', { class: 'lk-msg', text: lead }), rest && h('details', { class: 'hg-more tt-more' }, h('summary', { text: 'Đọc thêm bối cảnh' }), h('p', { class: 'lk-msg', text: rest })),
          D.hook && h('div', { class: 'lk-concl' }, h('b', { text: `Câu hỏi mồi: em chọn ${D.hook}, đáp án ${A.hook.answer}` }), h('p', { text: A.hook.why })),
          h('ul', { class: 'lk-ideas' }, A.facts.map((f, n) => h('li', {}, f.text, badge(f.status || (f.assumed ? 'assumed' : 'ok')), ' ',
            h('button', { class: 'lk-btn tt-src', type: 'button', 'aria-expanded': String(!!D.src[n]), onclick: () => { D.src = D.src[n] ? {} : { [n]: true }; save(); markDone(2); shell.refresh(); } }, D.src[n] ? 'Ẩn nguồn' : 'Xem nguồn'),
            D.src[n] && h('p', { class: 'lk-msg', style: 'font-size:12.5px' }, 'Nguồn: ', f.sourceUrl ? h('a', { href: f.sourceUrl, target: '_blank', rel: 'noopener noreferrer', text: f.source }) : f.source)))));
      }
      if (i === 3) put(host, h('div', { class: 'lk-concl' }, h('b', { text: 'Vị trí trong sách' }), h('p', { text: A.textbookLink.ref })), h('p', { class: 'lk-msg', style: 'color:var(--muted)', text: 'Chỉ ghi vị trí: ' + A.textbookLink.kind + '.' }));
      if (i === 4 && D.result === 'ok') put(host, h('div', { class: 'lk-concl' }, h('b', { text: 'Hoàn thành' }), h('p', { text: `Mẫu nước có ${fmt(D.sample)} ${UNIT} clo dư: ${D.sample >= LO && D.sample <= HI ? 'đạt' : 'không đạt'} ${M.success.criterion || 'chỉ tiêu của nhiệm vụ'} (${fmt(LO)} đến ${fmt(HI)} ${UNIT}).` }), M.success.source && h('a', { href: M.success.source.url, text: M.success.source.text, target: '_blank', rel: 'noopener noreferrer' })));
      if (i === 5) put(host, questionsUI());
      put(host, h('div', { class: 'lk-cardfoot' }, done && i < steps.length - 1 && btn(`Sang phần ${i + 2} ›`, () => shell.go(i + 1))));
    }
    // Phần 6: dự đoán (A/B), tính (ô số, dấu phẩy), mở rộng; mỗi câu có lời giải hiện dần
    function questionsUI() {
      const Q = A.questions, [ansP, ansC, ansE] = A.answers, rev = (k, n) => { D.rev[k] = Math.max(D.rev[k] || 0, n); save(); shell.refresh(); };
      // S3: mỗi lần mở MỘT câu, hai câu kia thu thành một dòng bấm được. Mặc định mở câu dự đoán khi chưa chọn, sau đó là câu tính.
      const open = S.qOpen ?? (D.q.predict ? 1 : 0), mark = [!!D.q.predict, !!D.q.computeOk, !!D.rev.e];
      let qn = 0; const box = (title, ...kids) => { const k = qn++; return k === open ? h('div', { class: 'lk-box' }, h('h3', { text: title }), ...kids)
        : h('button', { class: 'lk-box tt-qfold', type: 'button', 'aria-expanded': 'false', onclick: () => { S.qOpen = k; shell.refresh(); } }, h('span', { text: title }), h('em', { text: mark[k] ? '✓' : 'Mở' })); };
      const input = h('input', { type: 'text', inputmode: 'decimal', 'aria-label': 'Đáp số (' + Q.compute.unit + ')', value: D.q.compute ?? '', style: 'width:110px;padding:6px 8px;border:1px solid var(--control-border);border-radius:10px;font:inherit' });
      const parse = (s) => Number(String(s).trim().replace(/\s/g, '').replace(',', '.'));
      const doCheck = () => { D.q.compute = input.value; const v = parse(input.value); D.q.computeOk = Number.isFinite(v) && Math.abs(v - Q.compute.answer) <= Q.compute.tol; D.done[5] = Boolean(D.q.predict && D.q.computeOk); save(); shell.refresh(); };
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
    function panel(i, host) {
      if (i !== 4) {
        host.classList.remove('tt-compact'); host.classList.add('tt-list');
        put(host, ph('Bảng điều khiển', 'Tiến độ nhiệm vụ'),
          h('ol', { class: 'lk-proc' }, steps.map((s, n) => h('li', { class: 'lk-pstep' + (D.done[n] ? ' is-done' : '') + (n === i ? ' is-next' : '') }, h('span', { class: 'lk-pn', text: D.done[n] ? '✓' : String(n + 1) }), h('div', { class: 'lk-pb' }, h('button', { class: 'lk-btn' + (n === i ? ' is-pri' : ''), type: 'button', disabled: !canEnter(n), onclick: () => shell.go(n) }, s.short))))),
          i === 2 && h('div', { class: 'lk-box' }, h('h3', { text: 'Nguồn của nhiệm vụ' }), h('ul', { class: 'lk-ideas' }, A.sources.map((x) => h('li', {}, x.url ? h('a', { href: x.url, target: '_blank', rel: 'noopener noreferrer', text: x.text }) : x.text)))));
        S.ui = null; return;
      }
      const label = h('span'), big = h('b'), unit = h('em'), cells = [0, 1, 2].map(() => vcard()), proc = h('div', { class: 'hg-compact' }), res = h('div'); // việc đã xong thu thành một dòng (S4)
      const verdictBtns = h('div', { class: 'lk-seg', role: 'radiogroup', 'aria-label': 'Kết luận' }, [['dat', `Đạt (${fmt(LO)} đến ${fmt(HI)} ${UNIT})`], ['khong', 'Không đạt']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(D.verdict === v), class: D.verdict === v ? 'is-on' : '', onclick: () => { if (D.verdict !== v) { clearGrade(); shell.refresh(); } D.verdict = v; save(); shell.rerenderPanel(); } }, t)));
      host.classList.remove('tt-list'); host.classList.add('tt-compact'); // S4: bảng phải không cuộn ở 1440×900
      put(host, ph('Bảng điều khiển', 'Tay làm trên bàn, hoặc bấm nút cùng số'),
        h('div', { class: 'lk-read' }, label, h('div', {}, big, unit)), h('div', { class: 'lk-vcards' }, cells.map((c) => c.el)),
        h('h3', { class: 'lk-sub', text: 'Việc trên bàn' }), proc,
        h('h3', { class: 'lk-sub', text: 'Kết luận' }), verdictBtns, M.success.rangeStatus === 'checking' && h('p', { class: 'lk-msg' }, `Khoảng ${fmt(LO)} đến ${fmt(HI)} ${UNIT}`, badge('checking')),
        h('div', { class: 'lk-cardfoot' }, btn('Kiểm tra', check, true), btn('Lấy mẫu mới', newSample)), res);
      function sync() {
        label.textContent = M.hiddenReadouts[0] || 'Số ẩn'; big.textContent = D.result === 'ok' ? fmt(D.sample) : 'ẩn'; unit.textContent = D.result === 'ok' ? UNIT : '';
        cells[0].set('Đã nhỏ KI', B.st.ki ? 'rồi' : 'chưa'); cells[1].set('Hồ tinh bột', B.data.starch || 'chưa'); cells[2].set('Ống chuẩn đã chọn', B.st.match ? `${fmt(B.level.match)} ${UNIT}` : 'chưa');
        proc.replaceChildren(); put(proc, procList(lab, bench.id));
        res.replaceChildren(); put(res, D.result === 'ok' ? h('div', { class: 'lk-concl' }, h('b', { text: 'Hoàn thành' }), h('p', { text: `Số ẩn: ${fmt(D.sample)} ${UNIT}.` }))
          : D.result ? h('div', { class: 'lk-box' }, h('p', { class: 'lk-msg', style: 'color:var(--warning)', text: D.result === 'pick' ? 'Chưa đúng: màu mẫu chưa khớp ống chuẩn đã chọn.' : 'Chưa đúng: ống chuẩn đúng nhưng kết luận Đạt / Không đạt chưa đúng.' }), btn('Thử lại với mẫu mới', newSample, true)) : null);
      }
      S.ui = { sync }; sync();
    }

    return {
      lab, state: S, canEnter,
      enter(i) {
        S.step = i; S.ui = null;
        const sim = steps[i].bench === bench.id; photo.style.display = sim ? 'none' : ''; lab.canvas.style.display = sim ? '' : 'none';
        if (sim && !S.built) setupBench();
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
