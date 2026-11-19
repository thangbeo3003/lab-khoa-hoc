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
];
let bad = 0; const norm = (s) => { const [l, r] = s.split(' → '); return l.split(' + ').sort().join(' + ') + ' → ' + r.split(' + ').sort().join(' + '); };
for (const [name, steps, want, spect] of cases) { const m = run(steps); const ok = m && norm(m.ionic) === norm(want) && spect.every((s) => m.spect.some((x) => x.label === s)) && m.spect.length === spect.length;
  if (!ok) { bad++; console.log('SAI', name, '\n  ra  :', m && m.ionic, '| đứng ngoài:', m && m.spect.map((x) => x.label).join(', '), '\n  muốn:', want, '| đứng ngoài:', spect.join(', ')); } }
const h = run([['CuSO4', { mL: 2 }], ['NaOH', { mL: 1 }]], true); if (!h || norm(h.ionic) !== norm('Cu(OH)₂ → CuO↓ + H₂O')) { bad++; console.log('SAI đun Cu(OH)2:', h && h.ionic); }
{ const t = newTube(); add(t, 'CuSO4', { mL: 2 }); add(t, 'NaOH', { mL: 1 }); const P = population(t), r = (k) => Math.round((P[k] ? P[k].mmol : 0) * 100) / 100;
  const got = [r('Cu²⁺'), r('SO₄²⁻'), r('Na⁺'), r('OH⁻'), r('Cu(OH)₂')].join(' '); if (got !== '0 0.2 1 0.6 0.2') { bad++; console.log('SAI lượng hạt CuSO4 + NaOH:', got, Object.keys(P).join(',')); }
  const e = entering('H2SO4', 1).map((x) => x.label + ':' + x.mmol).join(' '); if (e !== 'H⁺:2 SO₄²⁻:1') { bad++; console.log('SAI hạt đi vào của H2SO4:', e); }
  const z = entering('Zn', 4.6); if (z.length !== 1 || z[0].kind !== 'solid' || z[0].label !== 'Zn') { bad++; console.log('SAI hạt đi vào của Zn:', JSON.stringify(z)); } }
console.log(bad ? `CÓ ${bad} LỖI` : 'ĐẠT: mô hình hạt (' + (cases.length + 1) + ' phản ứng)');
