import { newTube, add, look, pH, indicatorLook, contents, pptTotal, DROP_ML, litmus, heat, SPLINT } from './tubechem.js';
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
  const n = newTube(); add(n, 'NaHCO3', { mL: 2 }); const e0 = add(n, 'CaCl2', { mL: 2 }).events; ok(e0[0].kind === 'none', 'NaHCO3 + CaCl2 nguội: không phản ứng'); const hn = heat(n); ok(hn.length === 1 && n.ppt[0].f === 'CaCO3' && near(n.ppt[0].mol, 0.0005) && n.lastGas === 'CO2' && hn[0].r.equation.startsWith('2NaHCO₃ + CaCl₂ → CaCO₃↓ + 2NaCl + CO₂↑ + H₂O'), 'đun NaHCO3 + CaCl2: ' + hn[0]?.r.equation);
  ok(heat(newTube()).length === 0, 'đun ống không có gì đặc biệt: không có phản ứng mới'); }
console.log(fail ? `CẦN SỬA: ${fail} lỗi` : 'ĐẠT: sổ sách ống nghiệm');
process.exit(fail ? 1 : 0);
