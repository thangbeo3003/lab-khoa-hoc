// Kiểm mô hình hạt: node ionmodel.test.mjs
import { newTube, add, heat } from './tubechem.js';
import { buildModel, population, entering } from './ionmodel.js';
const run = (steps, hot) => { const t = newTube(); let ev = []; for (const [id, amt] of steps) ev = add(t, id, amt).events; if (hot) ev = heat(t); const e = ev.find((x) => x.kind === 'reaction'); return e ? buildModel(e, t) : null; };
const cases = [
  ['CuSO4 + NaOH', [['CuSO4', { mL: 2 }], ['NaOH', { mL: 1 }]], 'Cu²⁺ + 2OH⁻ → Cu(OH)₂↓', ['Na⁺', 'SO₄²⁻']],
  ['AgNO3 + NaCl', [['AgNO3', { mL: 2 }], ['NaCl', { mL: 2 }]], 'Ag⁺ + Cl⁻ → AgCl↓', ['NO₃⁻', 'Na⁺']],
  ['HCl + NaOH', [['HCl', { mL: 2 }], ['NaOH', { mL: 2 }]], 'H⁺ + OH⁻ → H₂O', ['Cl⁻', 'Na⁺']],
  ['Zn + HCl', [['HCl', { mL: 3 }], ['Zn', { piece: true }]], 'Zn + 2H⁺ → Zn²⁺ + H₂↑', ['Cl⁻']],
  ['CaCO3 + HCl', [['CaCO3', { piece: true }], ['HCl', { mL: 3 }]], 'CaCO₃ + 2H⁺ → Ca²⁺ + CO₂↑ + H₂O', ['Cl⁻']],
  ['Na2CO3 + HCl', [['Na2CO3', { mL: 2 }], ['HCl', { mL: 2 }]], '2H⁺ + CO₃²⁻ → CO₂↑ + H₂O', ['Na⁺', 'Cl⁻']],
  ['CH3COOH + NaOH', [['CH3COOH', { mL: 2 }], ['NaOH', { mL: 2 }]], 'CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O', ['Na⁺']],
  ['FeCl3 + KSCN', [['FeCl3', { mL: 2 }], ['KSCN', { mL: 2 }]], 'Fe³⁺ + 3SCN⁻ → Fe(SCN)₃', ['Cl⁻', 'K⁺']],
  ['Fe + CuSO4', [['CuSO4', { mL: 3 }], ['Fe', { piece: true }]], 'Fe + Cu²⁺ → Fe²⁺ + Cu↓', ['SO₄²⁻']],
  // 21/11: kết tủa gặp acid, kiềm dư (S1); nước cất là chất phản ứng (S2); sản phẩm tan ngoài tủ phản ứng tiếp (S3)
  ['Cu(OH)2 + HCl', [['CuSO4', { mL: 2 }], ['NaOH', { mL: 0.4 }], ['HCl', { mL: 1 }]], 'Cu(OH)₂ + 2H⁺ → Cu²⁺ + 2H₂O', ['Cl⁻']],
  ['BaCO3 + HCl', [['BaCl2', { mL: 2 }], ['Na2CO3', { mL: 2 }], ['HCl', { mL: 3 }]], 'BaCO₃ + 2H⁺ → Ba²⁺ + CO₂↑ + H₂O', ['Cl⁻']],
  ['Al(OH)3 + NaOH dư', [['AlCl3', { mL: 2 }], ['NaOH', { mL: 0.6 }], ['NaOH', { mL: 1 }]], 'Al(OH)₃ + Na⁺ + OH⁻ → Na[Al(OH)₄]', []],
  ['Na + H2O', [['H2O', { mL: 5 }], ['Na', { piece: true }]], '2Na + 2H₂O → 2Na⁺ + 2OH⁻ + H₂↑', []],
  ['ZnCl2 + NaOH', [['HCl', { mL: 3 }], ['Zn', { piece: true }], ['NaOH', { mL: 1 }]], 'Zn²⁺ + 2OH⁻ → Zn(OH)₂↓', ['Na⁺', 'Cl⁻']],
  ['Fe + CuCl2', [['HCl', { mL: 3 }], ['CuO', { piece: true }], ['Fe', { piece: true }]], 'Fe + Cu²⁺ → Fe²⁺ + Cu↓', ['Cl⁻']],
];
let bad = 0; const norm = (s) => { const [l, r] = s.split(' → '); return l.split(' + ').sort().join(' + ') + ' → ' + r.split(' + ').sort().join(' + '); };
for (const [name, steps, want, spect] of cases) { const m = run(steps); const ok = m && norm(m.ionic) === norm(want) && spect.every((s) => m.spect.some((x) => x.label === s)) && m.spect.length === spect.length;
  if (!ok) { bad++; console.log('SAI', name, '\n  ra  :', m && m.ionic, '| đứng ngoài:', m && m.spect.map((x) => x.label).join(', '), '\n  muốn:', want, '| đứng ngoài:', spect.join(', ')); } }
const h = run([['CuSO4', { mL: 2 }], ['NaOH', { mL: 1 }]], true); if (!h || norm(h.ionic) !== norm('Cu(OH)₂ → CuO↓ + H₂O')) { bad++; console.log('SAI đun Cu(OH)2:', h && h.ionic); }
{ const t = newTube(); add(t, 'CuSO4', { mL: 2 }); add(t, 'NaOH', { mL: 1 }); const P = population(t), r = (k) => Math.round((P[k] ? P[k].mmol : 0) * 100) / 100;
  const got = [r('Cu²⁺'), r('SO₄²⁻'), r('Na⁺'), r('OH⁻'), r('Cu(OH)₂')].join(' '); if (got !== '0 0.2 1 0.6 0.2') { bad++; console.log('SAI lượng hạt CuSO4 + NaOH:', got, Object.keys(P).join(',')); }
  const e = entering('H2SO4', 1).map((x) => x.label + ':' + x.mmol).join(' '); if (e !== 'H⁺:2 SO₄²⁻:1') { bad++; console.log('SAI hạt đi vào của H2SO4:', e); }
  const z = entering('Zn', 4.6); if (z.length !== 1 || z[0].kind !== 'solid' || z[0].label !== 'Zn') { bad++; console.log('SAI hạt đi vào của Zn:', JSON.stringify(z)); } }
// Lượng hạt lấy thẳng từ sổ ống, không cần sổ sản phẩm riêng của phần hình: ZnCl₂ phát sinh tách thành Zn²⁺ và Cl⁻; kết tủa đã tan hết thì không còn hạt.
{ const r = (P, k) => Math.round((P[k] ? P[k].mmol : 0) * 100) / 100;
  const t = newTube(); add(t, 'HCl', { mL: 3 }); add(t, 'Zn', { piece: true }); let P = population(t); if (r(P, 'Zn²⁺') !== 1.5 || r(P, 'Cl⁻') !== 3 || P['Zn²⁺'].kind !== 'ion') { bad++; console.log('SAI lượng hạt Zn + HCl:', JSON.stringify(P)); }
  P = population(t, { ZnCl2: { mol: 0.0015, mark: '' } }); if (r(P, 'Zn²⁺') !== 1.5) { bad++; console.log('SAI: ZnCl2 bị đếm hai lần khi phần hình đưa thêm sổ sản phẩm:', r(P, 'Zn²⁺')); }
  const c = newTube(); add(c, 'CuSO4', { mL: 2 }); add(c, 'NaOH', { mL: 0.4 }); add(c, 'HCl', { mL: 1 }); P = population(c); if (P['Cu(OH)₂'] || r(P, 'Cu²⁺') !== 0.2 || r(P, 'H⁺') !== 0.6) { bad++; console.log('SAI lượng hạt sau khi Cu(OH)2 tan:', Object.values(P).map((q) => q.label + ':' + q.mmol).join(' ')); } }
console.log(bad ? `CÓ ${bad} LỖI` : 'ĐẠT: mô hình hạt (' + (cases.length + 1) + ' phản ứng)');
