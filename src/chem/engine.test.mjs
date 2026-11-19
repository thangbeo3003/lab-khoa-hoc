// Kiểm thử máy phản ứng: chạy `node engine.test.mjs` trong thư mục này.
import { predict, limiting, moles, CHEMS } from './engine.js';
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

if (process.argv.includes('--table')) for (const r of table) console.log(`${r.kind.padEnd(8)} ${r.title.padEnd(26)} ${r.equation || ''} ${r.equation2 ? ' ; ' + r.equation2 : ''} | ${r.phenomenon} | ${r.reason}${r.notes.length ? ' | GHI CHÚ: ' + r.notes.join(' ') : ''}`);
console.log(fail ? `CẦN SỬA: ${fail} lỗi` : 'ĐẠT: tất cả kiểm thử máy phản ứng');
process.exit(fail ? 1 : 0);
