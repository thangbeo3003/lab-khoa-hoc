// Kiểm thử máy phản ứng: chạy `node engine.test.mjs` trong thư mục này.
import { predict, predictPpt, limiting, moles, CHEMS, BY_ID, DERIVED, soluteId, pptId } from './engine.js';
import { PPT_ACID, PPT_BASE_INERT, PPT_INERT } from './data.js';
import { parse } from './formula.js';
let fail = 0; const bad = (m) => { fail++; console.log('  SAI:', m); };
const ids = CHEMS.map((c) => c.id);

// 1) Mọi cặp: không lỗi, đủ trường, phương trình (nếu có) tự cân bằng khi đếm lại nguyên tử, kết quả không phụ thuộc thứ tự.
const count = { reaction: 0, none: 0, na: 0 }; let eqs = 0, pairs = 0; const table = [];
const atoms = (side) => { const t = {}; for (const s of side) for (const [el, n] of Object.entries(parse(s.f))) t[el] = (t[el] || 0) + n * s.coef; return t; };
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  pairs++; let r, r2;
  try { r = predict(ids[i], ids[j]); r2 = predict(ids[j], ids[i]); } catch (e) { bad(`${ids[i]} + ${ids[j]}: ${e.message}`); continue; }
  if (!['reaction', 'none', 'na'].includes(r.kind)) bad(`${r.title}: kind lạ`);
  if (r.bug) bad(`${r.title}: không dựng được phương trình`);
  if (!r.reason) bad(`${r.title}: thiếu lý do`);
  const norm = (x) => (x.eq ? x.eq.lhs.map((t) => t.coef + t.f).sort().join('+') + '→' + x.eq.rhs.map((t) => t.coef + t.f + t.mark).join('+') : '');
  if (r.kind !== r2.kind || norm(r) !== norm(r2) || r.phenomenon !== r2.phenomenon) bad(`${r.title}: đổi thứ tự cho kết quả khác`);
  if (r.kind === 'reaction' && !r.effects.length) bad(`${r.title}: phản ứng mà không có hiệu ứng`);
  count[r.kind]++;
  for (const eq of [r.eq, r.eq2].filter(Boolean)) {
    eqs++; const L = atoms(eq.lhs), R = atoms(eq.rhs);
    for (const el of new Set([...Object.keys(L), ...Object.keys(R)])) if (L[el] !== R[el]) bad(`${r.title}: lệch ${el} trong ${eq.text}`);
    if (eq.lhs.concat(eq.rhs).some((t) => !Number.isInteger(t.coef) || t.coef < 1 || t.coef > 16)) bad(`${r.title}: hệ số lạ ${eq.text}`);
  }
  table.push(r);
}
console.log(`Đã xét ${pairs} cặp: ${count.reaction} có phản ứng, ${count.none} không phản ứng, ${count.na} chưa có dữ liệu. ${eqs} phương trình đều tự cân bằng.`);

// 2) Các trường hợp quen thuộc.
const T = (a, b, kind, test, opts) => { const r = predict(a, b, opts); const ok = r.kind === kind && (!test || test(r)); if (!ok) bad(`${a} + ${b}: mong ${kind}, được ${r.kind} | ${r.equation} | ${r.phenomenon}`); };
const has = (type, re) => (r) => r.effects.some((e) => e.type === type && (!re || re.test(e.text)));
const eqIs = (s) => (r) => r.equation === s;
T('CuSO4', 'NaOH', 'reaction', (r) => eqIs('CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄')(r) && has('ppt', /xanh lam/)(r));
T('AgNO3', 'NaCl', 'reaction', (r) => eqIs('AgNO₃ + NaCl → AgCl↓ + NaNO₃')(r) && has('ppt', /trắng/)(r) && r.ionic === 'Ag⁺ + Cl⁻ → AgCl↓');
T('BaCl2', 'Na2SO4', 'reaction', eqIs('BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl'));
T('BaCl2', 'H2SO4', 'reaction', eqIs('BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl'));
T('FeCl3', 'NaOH', 'reaction', (r) => eqIs('FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl')(r) && has('ppt', /nâu đỏ/)(r));
T('FeSO4', 'NaOH', 'reaction', has('ppt', /trắng xanh/));
T('AlCl3', 'NaOH', 'reaction', (r) => has('ppt', /trắng/)(r) && r.notes.some((n) => /Na\[Al\(OH\)₄\]/.test(n)));
T('KI', 'PbNO32', 'reaction', (r) => eqIs('2KI + Pb(NO₃)₂ → PbI₂↓ + 2KNO₃')(r) && has('ppt', /vàng/)(r));
T('KI', 'AgNO3', 'reaction', has('ppt', /vàng/));
T('Na2CO3', 'HCl', 'reaction', (r) => eqIs('Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O')(r) && has('gas', /carbon dioxide/)(r));
T('NaHCO3', 'HCl', 'reaction', eqIs('NaHCO₃ + HCl → NaCl + CO₂↑ + H₂O'));
T('Na2CO3', 'CaCl2', 'reaction', eqIs('Na₂CO₃ + CaCl₂ → CaCO₃↓ + 2NaCl'));
T('NaHCO3', 'CaCl2', 'none');
T('NH4Cl', 'NaOH', 'reaction', (r) => eqIs('NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O')(r) && has('gas', /khai/)(r));
T('HCl', 'NaOH', 'reaction', (r) => eqIs('HCl + NaOH → NaCl + H₂O')(r) && has('quiet')(r) && r.ionic === 'H⁺ + OH⁻ → H₂O');
T('H2SO4', 'NaOH', 'reaction', eqIs('H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O'));
T('NaCl', 'Na2SO4', 'none'); T('NaCl', 'KI', 'none'); T('NaCl', 'CuSO4', 'none'); T('HCl', 'NaCl', 'none'); T('MgCl2', 'Na2SO4', 'none');
T('Zn', 'HCl', 'reaction', (r) => eqIs('Zn + 2HCl → ZnCl₂ + H₂↑')(r) && has('gas', /hydrogen/)(r));
T('Fe', 'H2SO4', 'reaction', eqIs('Fe + H₂SO₄ → FeSO₄ + H₂↑'));
T('Al', 'HCl', 'reaction', eqIs('2Al + 6HCl → 2AlCl₃ + 3H₂↑'));
T('Mg', 'CH3COOH', 'reaction', eqIs('Mg + 2CH₃COOH → (CH₃COO)₂Mg + H₂↑'));
T('Cu', 'HCl', 'none'); T('Ag', 'H2SO4', 'none'); T('Cu', 'FeSO4', 'none'); T('Ag', 'CuSO4', 'none'); T('Fe', 'ZnSO4', 'none'); T('Zn', 'MgCl2', 'none'); T('Cu', 'NaCl', 'none');
T('Fe', 'CuSO4', 'reaction', (r) => eqIs('Fe + CuSO₄ → FeSO₄ + Cu')(r) && has('coat', /đỏ/)(r) && has('color', /xanh lam sang lục nhạt/)(r));
T('Cu', 'AgNO3', 'reaction', (r) => eqIs('Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag')(r) && has('color', /xanh lam/)(r));
T('Zn', 'CuSO4', 'reaction', eqIs('Zn + CuSO₄ → ZnSO₄ + Cu'));
T('Al', 'CuSO4', 'reaction', eqIs('2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu'));
T('Cu', 'HNO3', 'reaction', eqIs('3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O'));
T('Cu', 'FeCl3', 'reaction', eqIs('Cu + 2FeCl₃ → CuCl₂ + 2FeCl₂'));
T('Na', 'H2O', 'reaction', eqIs('2Na + 2H₂O → 2NaOH + H₂↑'));
T('Na', 'CuSO4', 'reaction', (r) => has('gas', /hydrogen/)(r) && has('ppt', /xanh lam/)(r) && r.equation2 === '2NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄');
T('Al', 'NaOH', 'reaction', eqIs('2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂↑'));
T('CaCO3', 'HCl', 'reaction', eqIs('CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O'));
T('CuO', 'H2SO4', 'reaction', (r) => eqIs('CuO + H₂SO₄ → CuSO₄ + H₂O')(r) && has('color', /xanh lam/)(r));
T('CaO', 'H2O', 'reaction', eqIs('CaO + H₂O → Ca(OH)₂'));
T('H2O2', 'MnO2', 'reaction', (r) => eqIs('2H₂O₂ → 2H₂O + O₂↑')(r) && has('gas', /oxygen/)(r));
T('FeCl3', 'KSCN', 'reaction', has('color', /đỏ máu/));
T('FeCl3', 'KI', 'reaction', eqIs('2FeCl₃ + 2KI → 2FeCl₂ + I₂ + 2KCl'));
T('CuSO4', 'KI', 'reaction', eqIs('2CuSO₄ + 4KI → 2CuI↓ + I₂ + 2K₂SO₄'));
T('AgNO3', 'NaOH', 'reaction', eqIs('2AgNO₃ + 2NaOH → Ag₂O↓ + H₂O + 2NaNO₃'));
T('FeCl3', 'Na2CO3', 'reaction', eqIs('2FeCl₃ + 3Na₂CO₃ + 3H₂O → 2Fe(OH)₃↓ + 3CO₂↑ + 6NaCl'));
T('FeSO4', 'KMnO4', 'na', (r) => r.needs === 'acid');
T('FeSO4', 'KMnO4', 'reaction', eqIs('2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → 5Fe₂(SO₄)₃ + K₂SO₄ + 2MnSO₄ + 8H₂O'), { medium: 'acid' });
T('NH3', 'HCl', 'reaction', eqIs('NH₃ + HCl → NH₄Cl'));
T('NH3', 'AlCl3', 'reaction', eqIs('AlCl₃ + 3NH₃ + 3H₂O → Al(OH)₃↓ + 3NH₄Cl'));
T('quy', 'HCl', 'reaction', has('color', /đỏ/)); T('quy', 'NaOH', 'reaction', has('color', /xanh/)); T('quy', 'NaCl', 'none');
T('pp', 'NaOH', 'reaction', has('color', /hồng/)); T('pp', 'HCl', 'none'); T('pp', 'NH3', 'reaction');
T('MnO2', 'HCl', 'none'); T('Zn', 'Fe', 'na'); T('KMnO4', 'HCl', 'na'); T('Mg', 'HNO3', 'na'); T('Na2CO3', 'CuSO4', 'na');

// 3) Chất hết, chất dư: 5 mL CuSO4 0,1 M + 2 mL NaOH 1 M → CuSO4 hết.
{ const r = predict('CuSO4', 'NaOH'), l = limiting(r, moles('CuSO4', { mL: 5 }), moles('NaOH', { mL: 2 }));
  if (l.limiting !== 'CuSO4' || Math.abs(l.left.NaOH - 0.001) > 1e-9 || Math.abs(l.products[0].mol - 0.0005) > 1e-9) bad('tính chất hết/dư sai: ' + JSON.stringify(l)); }

// 4) Chất phát sinh trong ống (S3, 21/11): sản phẩm tan và kết tủa không có trong tủ.
{ const dIds = DERIVED.map((d) => d.id), salts = DERIVED.filter((d) => d.group === 'salt');
  if (new Set(dIds).size !== dIds.length || dIds.some((id) => ids.includes(id))) bad('mã chất phát sinh bị trùng');
  if (CHEMS.some((c) => c.derived) || CHEMS.length !== 40) bad('chất phát sinh không được lẫn vào tủ (CHEMS)');
  for (const d of DERIVED) { try { parse(d.f); } catch (e) { bad(`chất phát sinh ${d.f}: ${e.message}`); } if (BY_ID[d.id] !== d || !d.name || !d.color) bad(`chất phát sinh ${d.f}: thiếu trường`);
    if (d.group === 'salt' ? soluteId(d.f) !== d.id || !d.ions : pptId(d.f) !== d.id) bad(`chất phát sinh ${d.f}: tra mã sai`); }
  for (const f of ['ZnCl2', 'FeCl2', 'CuCl2', 'Cu(NO3)2', 'Fe(NO3)3', 'Al2(SO4)3', 'CH3COONa', 'CaSO4', 'KNO3']) if (!soluteId(f)) bad(`${f} phải là chất tan được sổ theo dõi`);
  for (const f of ['Fe(SCN)3', 'I2', 'Na[Al(OH)4]', 'K2CO3', 'KOH', 'Cu(OH)2', 'BaSO4']) if (soluteId(f)) bad(`${f} không được coi là chất tan đơn giản`);
  if (soluteId('NaCl') !== 'NaCl' || soluteId('Ca(OH)2') !== 'CaOH2' || pptId('CaCO3') !== 'CaCO3' || pptId('Cu(OH)2') !== 'CuOH2') bad('tra mã chất trong tủ sai');
  // mọi cặp (chất phát sinh tan) × (cả tủ + chất phát sinh tan): không lỗi, phương trình cân bằng, không phụ thuộc thứ tự
  let n = 0, rxn = 0; const all = [...ids, ...salts.map((d) => d.id)];
  for (const d of salts) for (const y of all) { if (y === d.id) continue; n++; const o = { conc: { [d.id]: 0.1, [y]: 0.1 } }; let r, r2;
    try { r = predict(d.id, y, o); r2 = predict(y, d.id, o); } catch (e) { bad(`${d.id} + ${y}: ${e.message}`); continue; }
    if (!['reaction', 'none', 'na'].includes(r.kind) || r.bug || !r.reason || r.kind !== r2.kind) bad(`${r.title}: kết quả lạ`);
    if (r.kind === 'reaction') rxn++;
    for (const eq of [r.eq, r.eq2].filter(Boolean)) { const L = atoms(eq.lhs), R = atoms(eq.rhs); for (const el of new Set([...Object.keys(L), ...Object.keys(R)])) if (L[el] !== R[el]) bad(`${r.title}: lệch ${el} trong ${eq.text}`); } }
  console.log(`Chất phát sinh: ${salts.length} chất tan, ${DERIVED.length - salts.length} kết tủa; đã xét ${n} cặp có chất phát sinh (${rxn} có phản ứng), không lỗi.`);
  T('ZnCl2', 'NaOH', 'reaction', (r) => eqIs('ZnCl₂ + 2NaOH → Zn(OH)₂↓ + 2NaCl')(r) && r.ionic === 'Zn²⁺ + 2OH⁻ → Zn(OH)₂↓');
  T('CuCl2', 'NaOH', 'reaction', has('ppt', /xanh lam/)); T('FeCl2', 'NaOH', 'reaction', has('ppt', /trắng xanh/)); T('CuCl2', 'AgNO3', 'reaction', eqIs('CuCl₂ + 2AgNO₃ → 2AgCl↓ + Cu(NO₃)₂'));
  T('Fe', 'CuCl2', 'reaction', (r) => eqIs('Fe + CuCl₂ → FeCl₂ + Cu')(r) && has('coat', /đỏ/)(r)); T('Cu', 'ZnCl2', 'none'); T('Zn', 'ZnCl2', 'none');
  T('Cu', 'FeNO33', 'na'); T('Fe', 'Fe2SO43', 'na'); T('Zn', 'FeNO33', 'na'); // muối Fe³⁺ ngoài FeCl₃: không áp luật đẩy kim loại
  T('HNO3', 'FeCl2', 'na'); T('HNO3', 'FeNO32', 'na'); T('HNO3', 'KI', 'na'); T('HNO3', 'FeSO4', 'na'); T('HNO3', 'KSCN', 'na'); T('HNO3', 'NaCl', 'none');
  T('CaNO32', 'Na2SO4', 'na'); T('CaNO32', 'Na2SO4', 'reaction', has('ppt'), { conc: { CaNO32: 0.3, Na2SO4: 0.3 } }); T('CaNO32', 'Na2SO4', 'none', null, { conc: { CaNO32: 0.001, Na2SO4: 0.001 } }); // chất ít tan: cần nồng độ thật trong ống
  T('NH3', 'FeCl2', 'reaction', has('ppt')); T('NH3', 'CuCl2', 'na'); T('KMnO4', 'FeCl2', 'na'); T('H2O2', 'FeCl2', 'na'); T('NaNO3', 'KCl', 'none'); }

// 5) Kết tủa đã tạo gặp acid, kiềm (S1, 21/11). Chỉ những cặp có nguồn mới được kết luận.
{ const P = (f, x, kind, test) => { const r = predictPpt(f, x); if (!r || r.kind !== kind || (test && !test(r))) bad(`kết tủa ${f} + ${x}: mong ${kind}, được ${r && r.kind} | ${r && r.equation} | ${r && r.reason}`); };
  P('Cu(OH)2', 'HCl', 'reaction', (r) => eqIs('Cu(OH)₂ + 2HCl → CuCl₂ + 2H₂O')(r) && r.ionic === 'Cu(OH)₂ + 2H⁺ → Cu²⁺ + 2H₂O' && has('dissolve')(r) && has('color', /xanh lam/)(r));
  P('Cu(OH)2', 'H2SO4', 'reaction', eqIs('Cu(OH)₂ + H₂SO₄ → CuSO₄ + 2H₂O')); P('Mg(OH)2', 'HCl', 'reaction', eqIs('Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O'));
  P('Fe(OH)3', 'HCl', 'reaction', eqIs('Fe(OH)₃ + 3HCl → FeCl₃ + 3H₂O')); P('Fe(OH)3', 'H2SO4', 'reaction', eqIs('2Fe(OH)₃ + 3H₂SO₄ → Fe₂(SO₄)₃ + 6H₂O')); P('Fe(OH)2', 'HCl', 'reaction', eqIs('Fe(OH)₂ + 2HCl → FeCl₂ + 2H₂O'));
  P('Al(OH)3', 'HCl', 'reaction', eqIs('Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O')); P('Zn(OH)2', 'HNO3', 'reaction', eqIs('Zn(OH)₂ + 2HNO₃ → Zn(NO₃)₂ + 2H₂O'));
  P('BaCO3', 'HCl', 'reaction', (r) => eqIs('BaCO₃ + 2HCl → BaCl₂ + CO₂↑ + H₂O')(r) && has('gas', /carbon dioxide/)(r)); P('BaCO3', 'CH3COOH', 'reaction', eqIs('BaCO₃ + 2CH₃COOH → (CH₃COO)₂Ba + CO₂↑ + H₂O'));
  P('PbCO3', 'HNO3', 'reaction', eqIs('PbCO₃ + 2HNO₃ → Pb(NO₃)₂ + CO₂↑ + H₂O')); P('Ag2CO3', 'HNO3', 'reaction', eqIs('Ag₂CO₃ + 2HNO₃ → 2AgNO₃ + CO₂↑ + H₂O'));
  P('Al(OH)3', 'NaOH', 'reaction', (r) => eqIs('Al(OH)₃ + NaOH → Na[Al(OH)₄]')(r) && has('dissolve')(r)); P('Zn(OH)2', 'NaOH', 'reaction', eqIs('Zn(OH)₂ + 2NaOH → Na₂[Zn(OH)₄]'));
  P('CaCO3', 'HCl', 'reaction', eqIs('CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O')); P('CuO', 'H2SO4', 'reaction', eqIs('CuO + H₂SO₄ → CuSO₄ + H₂O')); P('Ca(OH)2', 'HCl', 'reaction', eqIs('Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O'));
  P('BaSO4', 'HCl', 'none'); P('BaSO4', 'HNO3', 'none'); P('BaSO4', 'NaOH', 'none'); P('AgCl', 'HNO3', 'none'); P('AgCl', 'HCl', 'none'); P('Cu(OH)2', 'NaOH', 'none'); P('Fe(OH)3', 'NaOH', 'none'); P('Fe(OH)2', 'NaOH', 'none');
  // không có nguồn hoặc phức tạp: phải trả "chưa có dữ liệu", không được đoán
  for (const [f, x] of [['AgI', 'HCl'], ['AgCl', 'NH3'], ['AgCl', 'NaOH'], ['Ag2O', 'HNO3'], ['CuI', 'HCl'], ['PbI2', 'HNO3'], ['PbSO4', 'HCl'], ['Pb(OH)2', 'HNO3'], ['Pb(OH)2', 'NaOH'], ['Mg(OH)2', 'NaOH'], ['Al(OH)3', 'CaOH2'], ['Al(OH)3', 'NH3'],
    ['Cu(OH)2', 'CH3COOH'], ['Al(OH)3', 'CH3COOH'], ['PbCO3', 'CH3COOH'], ['Fe(OH)2', 'HNO3'], ['BaCO3', 'H2SO4'], ['PbCO3', 'HCl'], ['PbCO3', 'H2SO4'], ['Ag2CO3', 'HCl'], ['Ag2CO3', 'CH3COOH'], ['Cu(OH)2', 'NaCl'], ['BaSO4', 'NaCl'], ['Ca(OH)2', 'NaCl']]) P(f, x, 'na');
  if (predictPpt('XyZ', 'HCl') !== null) bad('kết tủa lạ phải trả null');
  // mọi kết tủa × mọi chất trong tủ: không lỗi, phương trình cân bằng, cặp ngoài bảng nguồn không được ra phản ứng
  const ppts = [...new Set([...DERIVED.filter((d) => d.group === 'solid').map((d) => d.f), 'CaCO3', 'CuO', 'Ca(OH)2', 'Ag', 'CaSO4', 'PbCl2'])]; let n = 0, rxn = 0;
  for (const f of ppts) for (const x of ids) { n++; let r; try { r = predictPpt(f, x); } catch (e) { bad(`kết tủa ${f} + ${x}: ${e.message}`); continue; }
    if (!r || !['reaction', 'none', 'na'].includes(r.kind) || r.bug || !r.reason) { bad(`kết tủa ${f} + ${x}: kết quả lạ`); continue; }
    if (r.kind === 'reaction') { rxn++; const L = atoms(r.eq.lhs), R = atoms(r.eq.rhs); for (const el of new Set([...Object.keys(L), ...Object.keys(R)])) if (L[el] !== R[el]) bad(`kết tủa ${f} + ${x}: lệch ${el} trong ${r.eq.text}`);
      const d = BY_ID[pptId(f)]; if (d.derived && !['acid'].includes(BY_ID[x].group) && x !== 'NaOH') bad(`kết tủa ${f} + ${x}: phản ứng ngoài phạm vi có nguồn`); } }
  if (Object.keys(PPT_ACID).length !== 9 || Object.keys(PPT_BASE_INERT).length !== 3 || Object.keys(PPT_INERT).length !== 2) bad('bảng nguồn kết tủa đổi số dòng: cập nhật mục 5.2 của L2_LOGIC_CONG_THUC.md rồi sửa phép kiểm này');
  console.log(`Kết tủa gặp chất tan: đã xét ${n} cặp (${rxn} có phản ứng), phương trình đều cân bằng.`); }

if (process.argv.includes('--table')) for (const r of table) console.log(`${r.kind.padEnd(8)} ${r.title.padEnd(26)} ${r.equation || ''} ${r.equation2 ? ' ; ' + r.equation2 : ''} | ${r.phenomenon} | ${r.reason}${r.notes.length ? ' | GHI CHÚ: ' + r.notes.join(' ') : ''}`);
console.log(fail ? `CẦN SỬA: ${fail} lỗi` : 'ĐẠT: tất cả kiểm thử máy phản ứng');
process.exit(fail ? 1 : 0);
