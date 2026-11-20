import { simulate3, run3, gasAt3, AMOUNT, REF3, vO2Max, RANGE3, FULL, TEMPS, WINDOW_CAT, WINDOW_SURF_MAX, DONE_AT, EXAM, gasO2, tFullO2, limit3, timeTo, surfWindow, surfState, examChoices, examPass } from './model3.js';
import { TEMP, tCat } from '../h10_toc_do_phan_ung_02/model2.js';
import { simulate, V_MAX } from '../h10_toc_do_phan_ung_01/model.js';
let fail = 0; const ok = (name, cond, info = '') => { console.log((cond ? 'đạt  ' : 'HỎNG ') + name + (info ? '  ' + info : '')); if (!cond) fail++; };
const near = (a, b, e) => Math.abs(a - b) <= e;
['vien', 'vun'].forEach((form) => {
  const a = simulate3({ form, ...REF3 }), b = simulate({ form, conc: 0.5, temp: 25 });
  ok(`khớp bản 1 (${form}): nửa khí`, near(a.tHalf, b.tHalf, 0.1), `${a.tHalf.toFixed(2)} vs ${b.tHalf.toFixed(2)}`);
  ok(`khớp bản 1 (${form}): khí cuối`, near(a.vEnd, V_MAX, 0.3), `${a.vEnd.toFixed(1)} vs ${V_MAX.toFixed(1)}`);
});
AMOUNT.mass.forEach((m) => AMOUNT.vAcid.forEach((v) => {
  const a = run3('vien', m, v), c = run3('vun', m, v);
  ok(`${m} g + ${v} mL: acid dư, đá tan hết, khí = lượng tính`, !a.stoneLeft && !c.stoneLeft && near(a.vEnd, m / 100 * 24790, 0.3), `${a.vEnd.toFixed(1)} mL`);
  ok(`${m} g + ${v} mL: đập nhỏ nhanh hơn viên, cùng lượng khí`, c.tHalf < a.tHalf && near(a.vEnd, c.vEnd, 0.3), `${c.tHalf.toFixed(1)} s < ${a.tHalf.toFixed(1)} s`);
  ok(`${m} g + ${v} mL: vừa xi-lanh 100 mL`, a.vEnd <= 100);
}));
ok('nhiều đá vôi hơn thì nhiều khí hơn', run3('vien', 0.30, 20).vEnd > run3('vien', 0.10, 20).vEnd * 2.9);
ok('nội suy khí: 0 lúc đầu, đủ lúc cuối', gasAt3(run3('vien', 0.30, 20), 0) === 0 && near(gasAt3(run3('vien', 0.30, 20), 1e4), 74.4, 0.3));
ok('O₂ tối đa tỉ lệ với thể tích H₂O₂ và vừa xi-lanh', vO2Max(20) === 72 && AMOUNT.vPerox.every((v) => vO2Max(v) <= 100));

// ---------- Thêm 21/11: phần giao diện bản 3 ĐANG dùng (lượng tự chọn, cửa sổ đo, xi-lanh đầy, bàn 4, sát hạch) ----------
// Trạng thái hai bình [thí nghiệm đập nhỏ, đối chứng viên] lúc cửa sổ đo đóng, đúng như giao_an.js tính
const ends = (mass, vAcid) => { const e = run3('vun', mass, vAcid), r = run3('vien', mass, vAcid), w = surfWindow([e, r]), lim = limit3(mass, vAcid); return { e, r, w, lim, se: surfState(e, w, lim), sr: surfState(r, w, lim) }; };
ok('lượng khí theo phương trình ở mức của bài = V tối đa của bản 1', near(limit3(REF3.mass, REF3.vAcid).vEnd, V_MAX, 1e-9) && limit3(REF3.mass, REF3.vAcid).by === 'da', `${limit3(REF3.mass, REF3.vAcid).vEnd.toFixed(2)} mL`);
// Bốn góc của khoảng tự chọn: mô hình dừng đúng ở lượng khí tính theo phương trình
[RANGE3.mass.min, RANGE3.mass.max].forEach((m) => [RANGE3.vAcid.min, RANGE3.vAcid.max].forEach((v) => ['vien', 'vun'].forEach((form) => {
  const a = run3(form, m, v), lim = limit3(m, v);
  ok(`góc ${m} g + ${v} mL (${form}): chạy xong, khí cuối = lượng tính (${lim.by === 'acid' ? 'acid hết trước' : 'đá tan hết'})`, a.tEnd < 2000 && near(a.vEnd, lim.vEnd, 0.05) && a.stoneLeft === (lim.by === 'acid'), `${a.vEnd.toFixed(1)} mL`);
})));
{ const x = ends(0.30, 5);
  ok('acid hết trước (0,30 g + 5 mL): khí dừng ở 31,0 mL, đá vôi còn thừa, hai bình cùng lượng khí', x.lim.by === 'acid' && near(x.lim.vEnd, 30.99, 0.01) && near(x.e.vEnd, x.r.vEnd, 0.01) && x.e.stoneLeft && x.r.stoneLeft, `${x.r.vEnd.toFixed(1)} mL`);
  ok('acid hết trước: cả hai bình xong trong cửa sổ đo', x.se.state === 'done' && x.sr.state === 'done'); }
{ const x = ends(2.00, 20);
  ok('lượng của sách (2,00 g + 20 mL): theo phương trình 124 mL, vượt xi-lanh', x.lim.by === 'acid' && near(x.lim.vEnd, 123.95, 0.01) && x.lim.vEnd > FULL, `${x.lim.vEnd.toFixed(1)} mL`);
  ok('lượng của sách: cả hai xi-lanh ĐẦY trong cửa sổ đo, đập nhỏ đầy trước', x.se.state === 'full' && x.sr.state === 'full' && x.se.at < x.sr.at && x.sr.at <= x.w, `${x.se.at.toFixed(1)} s < ${x.sr.at.toFixed(1)} s`); }
{ const x = ends(REF3.mass, REF3.vAcid);
  ok('mức của bài: cả hai bình xong trong cửa sổ đo', x.se.state === 'done' && x.sr.state === 'done' && x.sr.at <= x.w, `viên đạt ${(DONE_AT * 100).toFixed(1)}% sau ${x.sr.at.toFixed(0)} s, cửa sổ ${x.w.toFixed(0)} s`); }
{ const x = ends(0.30, 12);
  ok('vừa đủ (0,30 g + 12 mL): không chất nào dư', x.lim.by === 'vuadu' && near(x.lim.vEnd, 74.37, 0.01));
  ok('vừa đủ: hết cửa sổ đo bình viên vẫn còn ra khí chậm, KHÔNG được báo xong', x.sr.state === 'slow' && x.sr.at === null && x.sr.v < x.lim.vEnd * DONE_AT, `${x.sr.v.toFixed(1)} trên ${x.lim.vEnd.toFixed(1)} mL`); }
{ const x = ends(0.42, 17);
  ok('0,42 g + 17 mL: đập nhỏ đầy trong cửa sổ, viên CHƯA đầy thì không được báo đầy', x.se.state === 'full' && x.sr.state === 'slow' && x.sr.v < FULL && timeTo(x.r, FULL) > x.w, `viên ${x.sr.v.toFixed(1)} mL lúc ${x.w.toFixed(0)} s; mô hình chạm 100 mL sau ${timeTo(x.r, FULL).toFixed(0)} s`); }
{ const x = ends(0.41, 17);
  ok('0,41 g + 17 mL: theo phương trình 101,6 mL nhưng trong cửa sổ đo CHƯA bình nào đầy thì không được báo đầy', x.lim.vEnd > FULL && x.se.state === 'slow' && x.sr.state === 'slow' && x.se.v < FULL, `đập nhỏ ${x.se.v.toFixed(2)} mL, viên ${x.sr.v.toFixed(1)} mL lúc ${x.w.toFixed(0)} s`); }
ok('cửa sổ đo bàn Bề mặt không vượt mức tối đa', [[0.30, 20], [0.30, 12], [0.05, 50], [2.00, 5]].every(([m, v]) => ends(m, v).w <= WINDOW_SURF_MAX + 1e-9));
ok('timeTo: không tới mức thì trả null', timeTo(run3('vien', 0.30, 20), 90) === null && near(timeTo(run3('vien', 0.30, 20), 74.37 / 2), run3('vien', 0.30, 20).tHalf, 0.05));

// Bàn Xúc tác
ok(`bàn 4, mức của bài: sau ${WINDOW_CAT} s có MnO₂ được 68,8 mL, không MnO₂ gần 0`, near(gasO2(true, REF3.vPerox, WINDOW_CAT), 68.82, 0.01) && gasO2(false, REF3.vPerox, WINDOW_CAT) < 0.05, `${gasO2(true, REF3.vPerox, WINDOW_CAT).toFixed(2)} và ${gasO2(false, REF3.vPerox, WINDOW_CAT).toFixed(3)} mL`);
ok('bàn 4: thời gian thu nửa lượng O₂ không đổi theo thể tích', [RANGE3.vPerox.min, REF3.vPerox, RANGE3.vPerox.max].every((v) => near(gasO2(true, v, tCat({ cat: true })), vO2Max(v) / 2, 1e-9)));
ok('bàn 4: 27 mL không bao giờ đầy; 28 mL chỉ đầy SAU cửa sổ đo; 50 mL đầy trong cửa sổ', tFullO2(27) === null && tFullO2(28) > WINDOW_CAT && gasO2(true, 28, WINDOW_CAT) < FULL && tFullO2(RANGE3.vPerox.max) < WINDOW_CAT && gasO2(true, RANGE3.vPerox.max, WINDOW_CAT) >= FULL, `28 mL: ${gasO2(true, 28, WINDOW_CAT).toFixed(1)} mL lúc ${WINDOW_CAT} s; 50 mL đầy sau ${tFullO2(50).toFixed(1)} s`);

// Bàn Nồng độ: mức nhiệt và bài sát hạch
ok('mức nhiệt của bình thí nghiệm nằm trong khoảng của mô hình bản 2 và khác đối chứng', TEMPS.every((t) => t > TEMP.min && t <= TEMP.max));
{ const all = examChoices(), pass = all.filter((c) => examPass(c.t));
  ok(`sát hạch: ${all.length} cách chọn, đúng MỘT cách cho ${EXAM.lo} đến ${EXAM.hi} s (0,10 M ở 45 °C)`, all.length === 10 && pass.length === 1 && pass[0].conc === 0.10 && pass[0].temp === 45 && near(pass[0].t, 15, 1e-9), all.map((c) => +c.t.toFixed(2)).sort((a, b) => a - b).join(' · ') + ' s'); }
console.log(fail ? `HỎNG ${fail} phép` : 'ĐẠT: tất cả kiểm thử mô hình bản 3'); process.exit(fail ? 1 : 0);
