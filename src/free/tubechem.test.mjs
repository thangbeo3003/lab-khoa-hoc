import { newTube, add, look, pH, indicatorLook, contents, pptTotal, DROP_ML, litmus, heat, SPLINT, beginPour, endPour } from './tubechem.js';
import { ALKALI_SAFETY } from '../chem/data.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('  SAI:', m); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
// 1) CuSO4 2 mL rồi nhỏ NaOH từng giọt: kết tủa tăng dần, tới khi Cu2+ hết thì NaOH dư.
{ const t = newTube(); add(t, 'CuSO4', { mL: 2 }); ok(look(t).hex !== '#dcecf5', 'CuSO4 phải có màu');
  let ev; for (let i = 0; i < 6; i++) ev = add(t, 'NaOH', { mL: DROP_ML, drop: true }).events;
  ok(ev[0].kind === 'reaction' && ev[0].r.equation === '2NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄', 'phương trình CuSO4+NaOH: ' + ev[0].r?.equation);
  ok(near(pptTotal(t), 0.00015), 'Cu(OH)2 sau 6 giọt = 0,15 mmol, được ' + pptTotal(t));
  ok(near(t.items.CuSO4.mol, 0.00005), 'CuSO4 còn 0,05 mmol'); ok(ev[0].out === 'NaOH', 'NaOH hết trước');
  for (let i = 0; i < 4; i++) ev = add(t, 'NaOH', { mL: DROP_ML, drop: true }).events;
  ok(near(pptTotal(t), 0.0002) && t.items.CuSO4.mol < 1e-9 && near(t.items.NaOH.mol, 0.0001), 'sau 10 giọt: Cu hết, NaOH dư 0,1 mmol');
  ok(look(t).hex === '#dcecf5', 'hết Cu2+ thì dung dịch không màu, được ' + look(t).hex);
  const c = contents(t); ok(c[0].status === 'đã hết' && c[1].amount === '10 giọt · 0,50 mL', 'bảng trong ống: ' + JSON.stringify(c)); 
  ev = add(t, 'BaCl2', { mL: 1 }).events; ok(ev.some((e) => e.kind === 'reaction' && /BaSO₄↓/.test(e.r.equation)), 'Na2SO4 sinh ra phải tạo BaSO4 với BaCl2'); }
// 2) Chuẩn độ: NaOH + phenolphthalein hồng, thêm HCl tới dư thì mất màu.
{ const t = newTube(); add(t, 'NaOH', { mL: 1 }); let ev = add(t, 'pp', { mL: DROP_ML, drop: true }).events;
  ok(ev[0].kind === 'indicator' && ev[0].to === 'hồng', 'pp trong NaOH phải hồng: ' + JSON.stringify(ev[0])); ok(pH(t) > 13, 'pH NaOH');
  ev = add(t, 'HCl', { mL: 0.5 }).events; ok(indicatorLook(t).color === 'hồng' && !ev.some((e) => e.kind === 'indicator'), 'HCl chưa đủ: vẫn hồng');
  ev = add(t, 'HCl', { mL: 0.6 }).events; ok(ev.some((e) => e.kind === 'indicator' && !e.changed), 'HCl dư: mất màu hồng'); ok(pH(t) < 2, 'pH sau khi dư acid ' + pH(t)); }
// 3) Kẽm + HCl: có khí, kẽm mòn dần; thêm tiếp HCl thì tan tiếp.
{ const t = newTube(); add(t, 'Zn', { piece: true }); const ev = add(t, 'HCl', { mL: 2 }).events;
  ok(ev[0].kind === 'reaction' && ev[0].slow && near(t.gasTotal, 0.001) && t.items.HCl.mol < 1e-9, 'Zn + 2 mL HCl: 1 mmol H2, HCl hết');
  ok(t.items.Zn.mol < t.items.Zn.mol0 && t.items.Zn.mol > 0, 'kẽm còn lại một phần'); }
// 4) FeCl3 + KSCN đỏ máu; NaCl + CuSO4 không phản ứng; ống đầy.
{ const t = newTube(); add(t, 'FeCl3', { mL: 2 }); const a = look(t).hex; add(t, 'KSCN', { mL: DROP_ML, drop: true }); const b = look(t).hex; ok(a !== b && parseInt(b.slice(1, 3), 16) > 150 && parseInt(b.slice(3, 5), 16) < 110, 'màu đỏ máu: ' + a + ' → ' + b);
  const t2 = newTube(); add(t2, 'CuSO4', { mL: 2 }); const ev = add(t2, 'NaCl', { mL: 1 }).events; ok(ev.length === 1 && ev[0].kind === 'none', 'CuSO4 + NaCl: không phản ứng');
  ok(add(t2, 'H2O', { mL: 10 }).full === true, 'quá 12 mL thì báo đầy'); }
// 5) Trung hoà trước, kết tủa sau: ống có HCl và CuSO4, thêm NaOH ít thì chưa có kết tủa.
{ const t = newTube(); add(t, 'HCl', { mL: 1 }); add(t, 'CuSO4', { mL: 2 }); add(t, 'NaOH', { mL: 0.5 }); ok(pptTotal(t) === 0, 'NaOH bị acid trung hoà trước, chưa có kết tủa');
  add(t, 'NaOH', { mL: 1 }); ok(pptTotal(t) > 0, 'NaOH dư sau trung hoà thì có kết tủa'); }
// 6) Giấy quỳ, que đóm, đun nóng.
{ const t = newTube(); ok(litmus(t) === null, 'ống trống: không thử quỳ được'); add(t, 'HCl', { mL: 2 }); ok(litmus(t).color === 'đỏ', 'HCl làm quỳ hoá đỏ'); add(t, 'NaOH', { mL: 3 }); ok(litmus(t).color === 'xanh', 'NaOH dư làm quỳ hoá xanh');
  const z = newTube(); add(z, 'Zn', { piece: true }); add(z, 'HCl', { mL: 2 }); ok(z.lastGas === 'H2' && SPLINT.H2.act === 'pop', 'Zn + HCl: khí cuối là H2, que đóm nổ pốp');
  const c = newTube(); add(c, 'CuSO4', { mL: 2 }); add(c, 'NaOH', { mL: 1 }); const hv = heat(c); ok(hv.length === 1 && c.ppt.length === 1 && c.ppt[0].f === 'CuO' && near(c.ppt[0].mol, 0.0002) && hv[0].r.equation.startsWith('Cu(OH)₂ → CuO + H₂O'), 'đun Cu(OH)2 ra CuO đen: ' + JSON.stringify(c.ppt) + ' ' + hv[0]?.r.equation);
  ok(hv[0].made.some(({ f, mol }) => f === 'Cu(OH)2' && near(mol, -0.0002)), 'đun: sổ ghi lượng kết tủa Cu(OH)₂ đã mất');
  const n = newTube(); add(n, 'NaHCO3', { mL: 2 }); const e0 = add(n, 'CaCl2', { mL: 2 }).events; ok(e0[0].kind === 'none', 'NaHCO3 + CaCl2 nguội: không phản ứng'); const hn = heat(n); ok(hn.length === 1 && n.ppt[0].f === 'CaCO3' && near(n.ppt[0].mol, 0.0005) && n.lastGas === 'CO2' && hn[0].r.equation.startsWith('2NaHCO₃ + CaCl₂ → CaCO₃↓ + 2NaCl + CO₂↑ + H₂O'), 'đun NaHCO3 + CaCl2: ' + hn[0]?.r.equation);
  ok(heat(newTube()).length === 0, 'đun ống không có gì đặc biệt: không có phản ứng mới'); }
// Sức chứa theo từng bình (đợt 1, 19/11): ống 12 mL, cốc 100 mL
{ const o = newTube(); ok(o.cap === 12 && add(o, 'NaCl', { mL: 12 }).events && add(o, 'NaCl', { mL: 0.5 }).full, 'ống nghiệm: tối đa 12 mL');
  const k = newTube(100); add(k, 'CuSO4', { mL: 40 }); const ev = add(k, 'NaOH', { mL: 40 }).events; ok(k.vol === 80 && ev.some((e) => e.kind === 'reaction') && k.ppt[0].f === 'Cu(OH)2', 'cốc 100 mL: 40 + 40 mL vẫn rót được, ra Cu(OH)2');
  ok(add(k, 'NaOH', { mL: 21 }).full && !add(k, 'NaOH', { mL: 20 }).full && k.vol === 100, 'cốc 100 mL: quá 100 mL thì báo đầy'); }
// ===== 21/11: S1 kết tủa phản ứng tiếp · S2 nước cất là chất phản ứng · S3 sản phẩm tan ngoài tủ vẫn nằm trong sổ =====
const mm = (x) => Math.round(x * 1e6) / 1000; // mol → mmol, 3 chữ số
const rx = (ev) => ev.filter((e) => e.kind === 'reaction');
const ppt = (t, f) => mm(t.ppt.find((p) => p.f === f)?.mol || 0), it = (t, id) => mm(t.items[id]?.mol || 0);
// Cộng dồn made như phần hiển thị (lab.js) vẫn làm: lượng sản phẩm đang còn, không bao giờ âm.
const ledger = () => { const P = {}; return { P, feed(ev) { for (const e of rx(ev)) for (const m of e.made) P[m.f] = (P[m.f] || 0) + m.mol; for (const [f, v] of Object.entries(P)) ok(v > -1e-9, `cộng dồn made của ${f} bị âm: ${v}`); return ev; } }; };
// S1.1) Cu(OH)2 gặp HCl: tan theo đúng tỉ lệ 1 : 2, dung dịch xanh lại; thêm NaOH thì kết tủa trở lại.
{ const t = newTube(), L = ledger(); L.feed(add(t, 'CuSO4', { mL: 2 }).events); L.feed(add(t, 'NaOH', { mL: 0.4 }).events); ok(ppt(t, 'Cu(OH)2') === 0.2 && look(t).hex === '#dcecf5', 'có 0,2 mmol Cu(OH)2, dung dịch không màu');
  let ev = L.feed(add(t, 'HCl', { mL: 0.2 }).events); ok(rx(ev).length === 1 && ev[0].ppt && ev[0].a === 'HCl' && ev[0].b === 'CuOH2' && ev[0].r.equation === 'Cu(OH)₂ + 2HCl → CuCl₂ + 2H₂O', 'HCl hoà tan Cu(OH)2: ' + ev[0]?.r?.equation);
  ok(ppt(t, 'Cu(OH)2') === 0.1 && it(t, 'CuCl2') === 0.1 && it(t, 'HCl') === 0 && ev[0].out === 'HCl', '0,2 mmol HCl hoà tan đúng 0,1 mmol Cu(OH)2'); ok(look(t).hex !== '#dcecf5', 'Cu2+ trở lại dung dịch: phải có màu xanh');
  ok(ev[0].made.some((m) => m.f === 'Cu(OH)2' && m.mark === '↓' && near(m.mol, -0.0001)), 'made phải báo Cu(OH)2 mất 0,1 mmol'); ok(near(L.P['Cu(OH)2'], 0.0001), 'cộng dồn made: còn 0,1 mmol Cu(OH)2');
  ev = L.feed(add(t, 'HCl', { mL: 1 }).events); ok(ppt(t, 'Cu(OH)2') === 0 && pptTotal(t) < 1e-12 && it(t, 'HCl') === 0.8 && it(t, 'CuCl2') === 0.2 && ev[0].out === 'CuOH2', 'HCl dư: kết tủa tan hết, HCl còn 0,8 mmol'); ok(t.ppt.some((p) => p.f === 'Cu(OH)2'), 'dòng kết tủa giữ lại trong sổ (lượng 0) để phần hình còn tra được màu');
  ev = L.feed(add(t, 'HCl', { mL: 1 }).events); ok(ev.length === 0, 'kết tủa đã hết: thêm HCl không có sự kiện');
  ev = L.feed(add(t, 'NaOH', { mL: 3 }).events); ok(rx(ev).length === 2 && ev[0].r.equation === 'NaOH + HCl → NaCl + H₂O' && ev[1].r.equation === '2NaOH + CuCl₂ → Cu(OH)₂↓ + 2NaCl', 'NaOH: trung hoà trước, rồi CuCl2 ra kết tủa: ' + ev.map((e) => e.r?.equation).join(' | '));
  ok(ppt(t, 'Cu(OH)2') === 0.2 && it(t, 'CuCl2') === 0 && it(t, 'NaOH') === 0.8 && look(t).hex === '#dcecf5' && near(L.P.CuCl2, 0), 'Cu(OH)2 trở lại 0,2 mmol, dung dịch hết màu, CuCl2 về 0'); }
// S1.2) BaCO3 gặp HCl: tan, sủi CO2. BaSO4, AgCl gặp acid: không tan (có lý do). AgI gặp HCl: chưa có dữ liệu.
{ const t = newTube(), L = ledger(); L.feed(add(t, 'BaCl2', { mL: 2 }).events); L.feed(add(t, 'Na2CO3', { mL: 2 }).events); const ev = L.feed(add(t, 'HCl', { mL: 3 }).events);
  ok(rx(ev).length === 1 && ev[0].r.equation === 'BaCO₃ + 2HCl → BaCl₂ + CO₂↑ + H₂O' && ppt(t, 'BaCO3') === 0 && it(t, 'BaCl2') === 1 && it(t, 'HCl') === 1 && t.lastGas === 'CO2' && near(t.gasTotal, 0.001), 'BaCO3 + HCl: tan hết, 1 mmol CO2');
  const b = newTube(); add(b, 'BaCl2', { mL: 1 }); add(b, 'Na2SO4', { mL: 1 }); const eb = add(b, 'HCl', { mL: 1 }).events; ok(eb.length === 1 && eb[0].kind === 'none' && eb[0].b === 'BaSO4' && /không tan/.test(eb[0].r.reason) && ppt(b, 'BaSO4') === 0.5, 'BaSO4 + HCl: không tan, có lý do');
  const a = newTube(); add(a, 'AgNO3', { mL: 2 }); add(a, 'NaCl', { mL: 0.4 }); const ea = add(a, 'HNO3', { mL: 1 }).events; ok(ea.length === 1 && ea[0].kind === 'none' && ea[0].b === 'AgCl' && ppt(a, 'AgCl') === 0.2, 'AgCl + HNO3: không tan');
  const i = newTube(); add(i, 'AgNO3', { mL: 2 }); add(i, 'KI', { mL: 2 }); const ei = add(i, 'HCl', { mL: 1 }).events; ok(ei.length === 1 && ei[0].kind === 'na' && ppt(i, 'AgI') === 0.2, 'AgI + HCl: chưa có dữ liệu, kết tủa giữ nguyên');
  const s = newTube(); add(s, 'BaCl2', { mL: 1 }); add(s, 'Na2SO4', { mL: 1 }); ok(add(s, 'KI', { mL: 1 }).events.every((e) => e.b !== 'BaSO4'), 'thêm muối vào ống có kết tủa: không báo gì về kết tủa'); }
// S1.3) Al(OH)3, Zn(OH)2 tan trong NaOH dư (tỉ lệ Al : OH = 1 : 4); Cu(OH)2 thì không.
{ const t = newTube(), L = ledger(); L.feed(add(t, 'AlCl3', { mL: 2 }).events); L.feed(add(t, 'NaOH', { mL: 0.6 }).events); ok(ppt(t, 'Al(OH)3') === 0.2 && it(t, 'NaOH') === 0, 'NaOH vừa đủ: 0,2 mmol Al(OH)3');
  let ev = L.feed(add(t, 'NaOH', { mL: 0.1 }).events); ok(rx(ev).length === 1 && ev[0].r.equation === 'Al(OH)₃ + NaOH → Na[Al(OH)₄]' && ppt(t, 'Al(OH)3') === 0.1, 'thêm 0,1 mmol NaOH: tan 0,1 mmol Al(OH)3');
  ev = L.feed(add(t, 'NaOH', { mL: 1 }).events); ok(ppt(t, 'Al(OH)3') === 0 && it(t, 'NaOH') === 0.9 && near(L.P['Al(OH)3'], 0) && near(L.P['Na[Al(OH)4]'], 0.0002), 'NaOH dư: Al(OH)3 tan hết');
  const o = newTube(); add(o, 'AlCl3', { mL: 2 }); ev = add(o, 'NaOH', { mL: 3 }).events; ok(rx(ev).length === 2 && ppt(o, 'Al(OH)3') === 0 && it(o, 'NaOH') === 2.2 && o.ppt.some((p) => p.f === 'Al(OH)3'), 'rót NaOH dư một lần: kết tủa tạo ra rồi tan ngay, NaOH còn 2,2 mmol');
  const c = newTube(); add(c, 'CuSO4', { mL: 2 }); add(c, 'NaOH', { mL: 0.4 }); ev = add(c, 'NaOH', { mL: 2 }).events; ok(ppt(c, 'Cu(OH)2') === 0.2 && ev.length === 1 && ev[0].kind === 'none' && ev[0].b === 'CuOH2', 'Cu(OH)2 không tan trong NaOH dư'); }
// S1.4) Thứ tự cho chất vào không đổi kết quả cuối; đun ra CuO rồi CuO vẫn tan trong acid; kết tủa trùng chất rắn trong tủ dùng luật sẵn có.
{ const t = newTube(); add(t, 'BaCl2', { mL: 1 }); add(t, 'HCl', { mL: 2 }); const ev = add(t, 'Na2CO3', { mL: 1 }).events; ok(ppt(t, 'BaCO3') === 0 && it(t, 'HCl') === 1 && it(t, 'BaCl2') === 0.5 && near(t.gasTotal, 0.0005), 'acid dư trong ống: BaCO3 vừa tạo tan ngay, kết quả cuối như khi acid gặp carbonate trước: ' + ev.map((e) => e.r?.equation).join(' | '));
  const h = newTube(); add(h, 'CuSO4', { mL: 2 }); add(h, 'NaOH', { mL: 0.4 }); heat(h); const eh = add(h, 'H2SO4', { mL: 1 }).events; ok(eh[0].r.equation === 'CuO + H₂SO₄ → CuSO₄ + H₂O' && ppt(h, 'CuO') === 0 && it(h, 'CuSO4') === 0.2 && look(h).hex !== '#dcecf5', 'CuO sau khi đun tan trong H2SO4, dung dịch xanh');
  const k = newTube(); add(k, 'CaCl2', { mL: 1 }); add(k, 'Na2CO3', { mL: 1 }); const ek = add(k, 'HCl', { mL: 2 }).events; ok(ek[0].r.equation === 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O' && ppt(k, 'CaCO3') === 0 && it(k, 'CaCl2') === 0.5, 'CaCO3 kết tủa tan trong HCl'); }
// S2.1) Sodium và nước cất, cả hai thứ tự; chất rắn không phản ứng với nước thì báo "không phản ứng" một lần, pha loãng thì im lặng.
{ const nNa = 0.2 / 22.99; const t = newTube(); add(t, 'H2O', { mL: 5 }); add(t, 'pp', { mL: DROP_ML, drop: true }); const ev = add(t, 'Na', { piece: true }).events;
  ok(rx(ev).length === 1 && ev[0].r.equation === '2Na + 2H₂O → 2NaOH + H₂↑' && ev[0].a === 'Na' && ev[0].b === 'H2O' && ev[0].out === 'Na' && ev[0].slow, 'Na vào nước cất: ' + ev[0]?.r?.equation);
  ok(near(t.items.NaOH.mol, nNa) && t.items.Na.mol < 1e-12 && near(t.gasTotal, nNa / 2) && t.lastGas === 'H2' && pH(t) > 13, 'Na hết, NaOH = số mol Na, H2 bằng một nửa'); ok(ev.some((e) => e.kind === 'indicator' && e.to === 'hồng'), 'phenolphthalein hoá hồng');
  const u = newTube(); add(u, 'Na', { piece: true }); const eu = add(u, 'H2O', { mL: 5 }).events; ok(rx(eu).length === 1 && near(u.items.NaOH.mol, nNa) && u.items.Na.mol < 1e-12, 'rót nước cất vào ống đang có Na: cũng phản ứng');
  const z = newTube(); add(z, 'H2O', { mL: 3 }); const ez = add(z, 'Zn', { piece: true }).events; ok(ez.length === 1 && ez[0].kind === 'none' && ez[0].b === 'H2O', 'Zn vào nước cất: không phản ứng'); ok(add(z, 'H2O', { mL: 1 }).events.length === 0, 'pha loãng thêm: không có sự kiện');
  const s = newTube(); add(s, 'H2O', { mL: 3 }); ok(add(s, 'NaCl', { mL: 1 }).events.length === 0 && add(s, 'HCl', { mL: 1 }).events.length === 1, 'dung dịch gặp nước cất: không sinh sự kiện về nước');
  const c = newTube(); add(c, 'H2O', { mL: 3 }); add(c, 'CuSO4', { mL: 2 }); const ec = add(c, 'Na', { piece: true }).events; ok(rx(ec).length === 2 && ppt(c, 'Cu(OH)2') === 0.2, 'Na vào nước có CuSO4: sủi H2 rồi NaOH tạo Cu(OH)2'); }
// Mg gặp nước lạnh: cùng một nhận xét định tính ở hai thứ tự, không ghi lượng phản ứng tức thời.
for (const order of [['Mg', 'H2O'], ['H2O', 'Mg']]) {
  const t = newTube();
  const apply = (id) => add(t, id, id === 'Mg' ? { piece: true } : { mL: 2 });
  apply(order[0]);
  const { events } = apply(order[1]);
  ok(events.length === 1 && events[0].r.observation === 'Phản ứng rất chậm', `Mg và nước lạnh (${order[0]} trước): có quan sát định tính`);
  ok(t.items.Mg.mol > 0 && t.gasTotal === 0, 'quan sát chậm: giữ nguyên lượng Mg và khí ở thời điểm trộn');
  ok(add(t, 'H2O', { mL: 0.5 }).events.length === 0, 'pha loãng Mg thêm: không lặp lại quan sát');
}
// S2.2) Vôi sống và nước cất: Ca(OH)2 tan tới mức bão hoà 1,73 g/L, phần còn lại là vôi tôi ở đáy; acid hoà tan hết.
{ const nCa = 0.2 / 56.077, sat = 1.73 / 74.092; const t = newTube(50), L = ledger(); L.feed(add(t, 'H2O', { mL: 5 }).events); let ev = L.feed(add(t, 'CaO', { piece: true }).events);
  ok(rx(ev).length === 1 && ev[0].r.equation === 'CaO + H₂O → Ca(OH)₂' && t.items.CaO.mol < 1e-12, 'CaO vào nước cất: ' + ev[0]?.r?.equation);
  const dis = t.items.CaOH2.mol, sol = t.ppt.find((p) => p.f === 'Ca(OH)2').mol; ok(near(dis, sat * 0.005, 1e-7) && near(dis + sol, nCa, 1e-7) && sol > dis, `phần tan = độ tan × thể tích, phần còn lại ở đáy: tan ${mm(dis)}, đáy ${mm(sol)}`);
  ok(pH(t) > 12.3 && pH(t) < 12.9, 'nước vôi bão hoà: pH khoảng 12,7, được ' + pH(t)); ok(ev[0].made[0].mark === '↓' && near(L.P['Ca(OH)2'], nCa, 1e-7), 'made báo phần vôi tôi là chất rắn');
  ev = L.feed(add(t, 'HCl', { mL: 3 }).events); ok(near(t.items.CaCl2.mol, 0.0015) && it(t, 'HCl') === 0 && near(t.items.CaOH2.mol, sat * 0.008, 1e-7) && pH(t) > 12, 'HCl thiếu: vôi tôi còn dư nên dung dịch vẫn là nước vôi bão hoà');
  ev = L.feed(add(t, 'HCl', { mL: 5 }).events); ok(near(t.items.CaCl2.mol, nCa, 1e-7) && pptTotal(t) < 1e-9 && t.items.CaOH2.mol < 1e-9 && pH(t) < 1.5 && near(L.P['Ca(OH)2'], 0, 1e-7), 'HCl dư (8 mmol cho 3,57 mmol vôi): vôi tan hết thành CaCl2, pH ' + pH(t));
  const w = newTube(); add(w, 'CaO', { piece: true }); const ew = add(w, 'H2O', { mL: 10 }).events; ok(rx(ew).length === 1 && near(w.items.CaOH2.mol, sat * 0.01, 1e-7), 'rót nước cất vào vôi sống: cũng phản ứng'); const d0 = w.items.CaOH2.mol; add(w, 'H2O', { mL: 2 }); ok(w.items.CaOH2.mol > d0, 'thêm nước: vôi tôi tan thêm cho đủ bão hoà'); }
// S3.1) Zn + HCl ra ZnCl2 (không có trong tủ) vẫn nằm trong sổ; thêm NaOH ra Zn(OH)2 trước khi NaOH kịp tác dụng với kẽm dư; NaOH dư thì kết tủa tan.
{ const t = newTube(), L = ledger(); L.feed(add(t, 'HCl', { mL: 3 }).events); L.feed(add(t, 'Zn', { piece: true }).events); ok(it(t, 'ZnCl2') === 1.5 && it(t, 'HCl') === 0 && near(L.P.ZnCl2, 0.0015), 'ZnCl2 1,5 mmol nằm trong sổ');
  const zn = t.items.Zn.mol; let ev = L.feed(add(t, 'NaOH', { mL: 1 }).events); ok(rx(ev).length === 1 && ev[0].r.equation === '2NaOH + ZnCl₂ → Zn(OH)₂↓ + 2NaCl' && ppt(t, 'Zn(OH)2') === 0.5 && it(t, 'ZnCl2') === 1 && near(t.items.Zn.mol, zn), 'NaOH gặp ZnCl2 trước: 0,5 mmol Zn(OH)2, kẽm dư chưa bị đụng tới: ' + ev[0]?.r?.equation);
  ok(near(L.P.ZnCl2, 0.001) && ev[0].made.some((m) => m.f === 'ZnCl2' && near(m.mol, -0.0005)), 'made báo ZnCl2 mất 0,5 mmol');
  ev = L.feed(add(t, 'NaOH', { mL: 2 }).events); ok(ppt(t, 'Zn(OH)2') === 1.5 && it(t, 'ZnCl2') === 0 && it(t, 'NaCl') === 3 && near(L.P.ZnCl2, 0), 'đủ NaOH: toàn bộ Zn2+ thành 1,5 mmol Zn(OH)2');
  ev = L.feed(add(t, 'NaOH', { mL: 4 }).events); ok(ppt(t, 'Zn(OH)2') === 0 && ev[0].r.equation === 'Zn(OH)₂ + 2NaOH → Na₂[Zn(OH)₄]' && t.items.Zn.mol < zn, 'NaOH dư: Zn(OH)2 tan trước, phần còn lại mới tác dụng với kẽm'); }
// S3.2) Màu đi theo ion đang có trong ống: Cu2+ đổi anion vẫn xanh, hết Cu2+ thì hết màu; chất phát sinh phản ứng được với kim loại.
{ const t = newTube(); add(t, 'CuSO4', { mL: 3 }); add(t, 'BaCl2', { mL: 0.6 }); ok(it(t, 'CuSO4') === 0 && it(t, 'CuCl2') === 0.3 && look(t).hex !== '#dcecf5', 'CuSO4 + BaCl2: Cu2+ còn trong dung dịch (CuCl2) nên vẫn xanh');
  add(t, 'NaOH', { mL: 1 }); ok(ppt(t, 'Cu(OH)2') === 0.3 && ppt(t, 'BaSO4') === 0.3 && look(t).hex === '#dcecf5', 'NaOH kết tủa hết Cu2+: hết màu');
  const c = newTube(); add(c, 'HCl', { mL: 3 }); add(c, 'CuO', { piece: true }); const blue = look(c).hex; ok(it(c, 'CuCl2') === 1.5 && blue === '#58b6ee' && c.tints.length === 0, 'CuO + HCl: CuCl2 giữ màu xanh, không ghi lớp màu cố định');
  const ev = add(c, 'Fe', { piece: true }).events; ok(ev[0].r.equation === 'Fe + CuCl₂ → FeCl₂ + Cu' && it(c, 'CuCl2') === 0 && it(c, 'FeCl2') === 1.5 && c.items.Fe.coat === 'đỏ' && look(c).hex === '#cfe6cf', 'đinh sắt đẩy đồng khỏi CuCl2: dung dịch chuyển lục nhạt, đồng bám đỏ');
  const f = newTube(); add(f, 'FeCl3', { mL: 2 }); const ef = add(f, 'Zn', { piece: true }).events; ok(rx(ef).length === 2 && ef[1].r.equation === 'Zn + FeCl₂ → ZnCl₂ + Fe' && it(f, 'FeCl2') === 0 && it(f, 'ZnCl2') === 0.3, 'Zn dư + FeCl3: Fe3+ về Fe2+ rồi Fe2+ bị đẩy ra thành sắt');
  const g = newTube(); add(g, 'HCl', { mL: 2 }); add(g, 'Fe', { piece: true }); const fe = g.items.Fe.mol, eg = add(g, 'AgNO3', { mL: 2 }).events; ok(eg[0].r.equation === '2AgNO₃ + FeCl₂ → 2AgCl↓ + Fe(NO₃)₂' && ppt(g, 'AgCl') === 0.2 && near(g.items.Fe.mol, fe), 'AgNO3 gặp Cl- trong dung dịch trước khi gặp đinh sắt: ' + eg[0]?.r?.equation);
  const i = newTube(); add(i, 'FeCl3', { mL: 2 }); add(i, 'KI', { mL: 2 }); ok(i.tints.length === 1, 'FeCl3 + KI: màu nâu của I2 (sổ không theo dõi I2) vẫn ghi thành lớp màu'); }
// S3.3) Sổ vẫn là dữ liệu thuần (phần hình sao chép bằng JSON để tính trước): bản sao chạy tiếp cho cùng kết quả.
{ const t = newTube(); add(t, 'HCl', { mL: 3 }); add(t, 'Zn', { piece: true }); add(t, 'CuSO4', { mL: 1 }); const c = JSON.parse(JSON.stringify(t)); add(t, 'NaOH', { mL: 2 }); add(c, 'NaOH', { mL: 2 }); ok(JSON.stringify(t) === JSON.stringify(c), 'bản sao JSON của ống phải chạy tiếp giống hệt ống gốc'); }

// ---------- Na (kim loại kiềm) gặp acid: một lần rót = một lần cho chất vào (21/11, mục 48 LUONG_2_TRAI_NGHIEM.md) ----------
{ const mm = (x) => Math.round(x * 1e6) / 1e3, rx = (ev) => ev.filter((e) => e.kind === 'reaction'), eqs = (ev) => rx(ev).map((e) => e.r.equation);
  const pour = (t, id, mL, n) => { const all = []; beginPour(t, id); for (let i = 0; i < n; i++) all.push(...add(t, id, { mL: mL / n }).events); all.push(...endPour(t).events); return all; };
  const NA = (() => { const t = newTube(); add(t, 'Na', { piece: true }); return t.items.Na.mol; })(), NA_HCL = '2Na + 2HCl → 2NaCl + H₂↑', NA_H2O = '2Na + 2H₂O → 2NaOH + H₂↑';
  // N1) Na dư: thả 1 mẩu Na rồi rót 2 mL HCl chia 8 phần. Chỉ có Na + HCl trong lúc rót, Na + H₂O khi đóng lần rót, KHÔNG có trung hoà.
  { const t = newTube(); add(t, 'Na', { piece: true }); const ev = pour(t, 'HCl', 2, 8), q = eqs(ev);
    ok(q.length === 9 && q.slice(0, 8).every((x) => x === NA_HCL) && q[8] === NA_H2O, 'N1 thứ tự: 8 lần Na + HCl rồi Na + H₂O, được ' + q.join(' | '));
    ok(!q.some((x) => /NaOH \+ HCl|HCl \+ NaOH/.test(x)), 'N1 không được có phản ứng trung hoà');
    ok(near(t.items.NaCl.mol, 0.002) && near(t.items.NaOH.mol, NA - 0.002) && near(t.gasTotal, NA / 2) && t.items.Na.mol < 1e-9 && t.items.HCl.mol < 1e-9, `N1 lượng cuối: NaCl ${mm(t.items.NaCl.mol)}, NaOH ${mm(t.items.NaOH.mol)}, H₂ ${mm(t.gasTotal)} mmol`);
    ok(rx(ev).every((e) => e.r.effects.some((x) => x.type === 'gas' && x.f === 'H2')), 'N1 mọi phản ứng của Na đều có hiệu ứng sủi khí H₂');
    ok(rx(ev).slice(0, 8).every((e) => e.r.safety === ALKALI_SAFETY.acid) && rx(ev)[8].r.safety === ALKALI_SAFETY.water && typeof ALKALI_SAFETY.acid === 'string' && ALKALI_SAFETY.acid.length > 20, 'N1 có câu cảnh báo r.safety (acid, nước)');
    ok(t.pour === null && pH(t) > 13, 'N1 đóng lần rót xong: dung dịch kiềm, pH ' + pH(t)); }
  // N2) Lượng cuối không phụ thuộc cách chia phần, và giống hệt khi không gọi beginPour/endPour.
  { const end = (n, wrap) => { const t = newTube(); add(t, 'Na', { piece: true }); if (wrap) pour(t, 'HCl', 2, n); else for (let i = 0; i < n; i++) add(t, 'HCl', { mL: 2 / n }); return [t.items.NaCl.mol, t.items.NaOH.mol, t.gasTotal, t.items.Na.mol, t.items.HCl.mol]; };
    const a = end(8, true); for (const [n, w] of [[1, true], [3, true], [8, false], [1, false]]) ok(end(n, w).every((x, i) => near(x, a[i])), `N2 chia ${n} phần${w ? '' : ', không begin/end'}: lượng cuối phải như chia 8 phần`); }
  // N3) Acid dư: Na rồi rót 12 mL HCl. Chỉ có Na + HCl; không sinh NaOH; đóng lần rót không có sự kiện.
  { const t = newTube(); add(t, 'Na', { piece: true }); beginPour(t, 'HCl'); const ev = []; for (let i = 0; i < 8; i++) ev.push(...add(t, 'HCl', { mL: 1.5 }).events); const close = endPour(t).events;
    ok(eqs(ev).length > 0 && eqs(ev).every((x) => x === NA_HCL) && close.length === 0, 'N3 acid dư: chỉ Na + HCl, đóng lần rót im lặng; được ' + eqs(ev).concat(eqs(close)).join(' | '));
    ok(near(t.items.NaCl.mol, NA) && near(t.items.HCl.mol, 0.012 - NA) && !(t.items.NaOH && t.items.NaOH.mol > 1e-9) && near(t.gasTotal, NA / 2) && pH(t) < 1, `N3 lượng cuối: NaCl ${mm(t.items.NaCl.mol)}, HCl dư ${mm(t.items.HCl.mol)} mmol`); }
  // N4) HCl có sẵn rồi thả Na (một lần add): Na dư → Na + HCl rồi Na + H₂O; acid dư → chỉ Na + HCl.
  { const t = newTube(); add(t, 'HCl', { mL: 2 }); const ev = add(t, 'Na', { piece: true }).events, q = eqs(ev);
    ok(q.length === 2 && q[0] === NA_HCL && q[1] === NA_H2O && ev[0].r.safety === ALKALI_SAFETY.acid && ev[1].r.safety === ALKALI_SAFETY.water, 'N4 HCl rồi Na (Na dư): ' + q.join(' | '));
    ok(near(t.items.NaCl.mol, 0.002) && near(t.items.NaOH.mol, NA - 0.002) && near(t.gasTotal, NA / 2), 'N4 lượng cuối như N1');
    const u = newTube(); add(u, 'HCl', { mL: 10 }); const q2 = eqs(add(u, 'Na', { piece: true }).events); ok(q2.length === 1 && q2[0] === NA_HCL && near(u.items.HCl.mol, 0.01 - NA) && !u.items.NaOH, 'N4 HCl dư rồi Na: chỉ Na + HCl, được ' + q2.join(' | ')); }
  // N5) Na vào nước cất: có r.safety. Zn + HCl (không phải kim loại kiềm): không có r.safety.
  { const t = newTube(); add(t, 'H2O', { mL: 3 }); const ev = add(t, 'Na', { piece: true }).events; ok(eqs(ev).length === 1 && eqs(ev)[0] === NA_H2O && ev[0].r.safety === ALKALI_SAFETY.water, 'N5 Na + nước cất có cảnh báo');
    const z = newTube(); add(z, 'Zn', { piece: true }); ok(rx(add(z, 'HCl', { mL: 2 }).events).every((e) => e.r.safety === undefined), 'N5 Zn + HCl không mang cảnh báo kim loại kiềm'); }
  // N6) Phần hình quên đóng lần rót: thêm chất khác thì sổ tự đóng; mở lại cùng chất khi chưa đóng thì vẫn giữ phần đang chờ.
  { const t = newTube(); add(t, 'Na', { piece: true }); beginPour(t, 'HCl'); add(t, 'HCl', { mL: 1 }); ok(t.items.Na.mol > 1e-9 && !t.items.NaOH, 'N6 đang rót: Na dư chưa gặp nước');
    const q = eqs(add(t, 'NaCl', { mL: 1 }).events); ok(q[0] === NA_H2O && t.items.Na.mol < 1e-9 && near(t.items.NaOH.mol, NA - 0.001), 'N6 thêm chất khác: tự đóng lần rót, Na + H₂O; được ' + q.join(' | '));
    const u = newTube(); add(u, 'Na', { piece: true }); beginPour(u, 'HCl'); add(u, 'HCl', { mL: 1 }); beginPour(u, 'HCl'); const q2 = eqs(endPour(u).events); ok(q2.length === 1 && q2[0] === NA_H2O && u.items.Na.mol < 1e-9, 'N6 mở lại cùng chất rồi đóng: Na dư vẫn phản ứng với nước'); }
  // N7) H₂SO₄ và acetic acid dùng chung cách này; HNO₃ + Na máy chưa có dữ liệu: không được đoán qua đường nước + trung hoà.
  { const t = newTube(); add(t, 'Na', { piece: true }); const q = eqs(pour(t, 'H2SO4', 2, 4)); ok(q.length === 5 && q.slice(0, 4).every((x) => x === '2Na + H₂SO₄ → Na₂SO₄ + H₂↑') && q[4] === NA_H2O && near(t.items.Na2SO4.mol, 0.001) && near(t.items.NaOH.mol, NA - 0.002), 'N7 Na + H₂SO₄: ' + q.join(' | '));
    for (const first of ['Na', 'HNO3']) { const u = newTube(); const ev = first === 'Na' ? (add(u, 'Na', { piece: true }), pour(u, 'HNO3', 2, 4)) : (add(u, 'HNO3', { mL: 2 }), add(u, 'Na', { piece: true }).events);
      ok(rx(ev).length === 0 && ev.some((e) => e.kind === 'na') && near(u.items.Na.mol, NA) && near(u.items.HNO3.mol, 0.002) && u.gasTotal === 0, `N7 ${first} trước, Na + HNO₃: chưa có dữ liệu, sổ giữ nguyên`); } }
}
console.log(fail ? `CẦN SỬA: ${fail} lỗi` : 'ĐẠT: sổ sách ống nghiệm');
process.exit(fail ? 1 : 0);
