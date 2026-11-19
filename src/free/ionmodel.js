// Từ một phản ứng đã cân bằng → mô hình hạt cho khung "Bên trong ống": chất điện li mạnh tách thành ion, chất rắn, khí, nước, acid yếu giữ nguyên phân tử;
// ion có mặt ở cả hai vế là ion "đứng ngoài" (không đổi), phần còn lại là phương trình ion thu gọn. Chỉ là lô-gic, không vẽ gì: chạy được bằng node để kiểm.
import { BY_ID, CHEMS, CATIONS, ANIONS } from '../chem/data.js';
import { compound } from '../chem/engine.js';
import { pretty, prettyIon } from '../chem/formula.js';

// Màu nguyên tử theo quy ước mô hình phân tử (H trắng, O đỏ, N lam, S vàng, C xám, Cl lục); kim loại mỗi thứ một màu dễ phân biệt.
export const ATOM = { H: ['#f4f6f9', 0.3], O: ['#e5484d', 0.5], N: ['#3d6fe0', 0.5], C: ['#555b66', 0.5], S: ['#f2c744', 0.62], Cl: ['#3fbf5f', 0.62], I: ['#8a4fc7', 0.74], Na: ['#b294f0', 0.6], K: ['#8f5fd6', 0.7], Ca: ['#e9cf8f', 0.64], Ba: ['#ec8fb4', 0.74], Mg: ['#6fd0c4', 0.56], Al: ['#c6ccd6', 0.54], Zn: ['#8fa3b8', 0.56], Fe: ['#e08a3c', 0.56], Cu: ['#2f8fe6', 0.56], Ag: ['#e3e8ef', 0.64], Pb: ['#737a86', 0.7], Mn: ['#a455bd', 0.56] };
// Bán kính ion Shannon, số phối trí 6, đơn vị pm (LibreTexts, Saito, bảng 2.2). Dùng để ion đơn nguyên tử có cỡ đúng tương quan với nhau (Cl⁻ to gần gấp đôi Na⁺).
// Cu²⁺, Ag⁺, Zn²⁺, Fe²⁺, Pb²⁺, Mn²⁺ lấy từ bảng bán kính hiệu dụng Shannon trên Wikipedia "Ionic radius" (phối trí 6). H⁺ và ion nhiều nguyên tử chưa có số đã đối chiếu.
export const ION_PM = { Na: 102, K: 138, Mg: 72, Ca: 100, Ba: 135, Al: 54, Cl: 181, I: 220, Cu: 73, Ag: 115, Zn: 74, Fe: 78, Pb: 119, Mn: 83 }; // Fe lấy theo Fe²⁺ spin cao (Fe³⁺ là 64,5, vẽ chung một cỡ)
const COMP = {}; for (const c of Object.keys(CATIONS)) for (const a of Object.keys(ANIONS)) { try { COMP[compound(c, a)] = [c, a]; } catch (e) { /* cặp không ghép được thì bỏ */ } }
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Công thức thường → danh sách nguyên tử, ví dụ Cu(OH)2 → [Cu, O, H, O, H]
export function atomsOf(f) { let s = f; while (/\(([^()]+)\)(\d*)/.test(s)) s = s.replace(/\(([^()]+)\)(\d*)/, (m, g, n) => g.repeat(Number(n) || 1)); const out = []; for (const m of s.matchAll(/([A-Z][a-z]?)(\d*)/g)) for (let k = 0; k < (Number(m[2]) || 1); k++) out.push(m[1]); return out; }
const mainAtom = (f) => { const a = atomsOf(f); return a.find((x) => x !== 'H' && x !== 'O') || a.find((x) => x === 'O') || a[0]; };
export const colorOf = (plain) => (ATOM[mainAtom(plain)] || ['#9fb3c8'])[0];

// e: sự kiện phản ứng của tubechem (e.r.eq đã cân bằng, e.a = chất vừa cho vào, e.b = chất có sẵn). t: sổ sách ống (để biết chất nào còn dư).
export function buildModel(e, t) {
  const eq = e.r.eq, keep = new Set(); // phân tử mà phương trình ion của máy phản ứng giữ nguyên (acid yếu, phức chất…)
  if (e.r.ionic) for (const tok of e.r.ionic.replace('→', '+').split('+')) { const x = tok.trim().replace(/^\d+/, '').replace(/[↓↑]$/, ''); if (!/[⁺⁻]$/.test(x)) keep.add(x); }
  const chemOf = (f) => [e.a, e.b].map((id) => id && BY_ID[id]).find((c) => c && c.f === f) || CHEMS.find((c) => c.f === f);
  const species = {}, sp = (label, plain, kind) => (species[label] || (species[label] = { label, plain, kind, color: colorOf(plain) })).label;
  const ionsOf = ([c, nc, a, na], coef) => [{ label: sp(prettyIon(CATIONS[c].f, CATIONS[c].q), CATIONS[c].f, 'ion'), n: nc * coef }, { label: sp(prettyIon(ANIONS[a].f, -ANIONS[a].q), ANIONS[a].f, 'ion'), n: na * coef }];
  const mk = Object.fromEntries((e.made || []).map((m) => [m.f, m.mark || '']));
  const split = (x, reactant) => { const f = x.f, lab = pretty(f), c = chemOf(f), mark = reactant ? '' : x.mark || mk[f] || (c && ['metal', 'solid'].includes(c.group) ? '↓' : ''); // kim loại, chất rắn sinh ra cũng là chất rắn tách khỏi dung dịch
    if (mark === '↓' || mark === '↑') return { kind: 'mol', parts: [{ label: sp(lab, f, mark === '↓' ? 'ppt' : 'gas'), n: x.coef }] };
    if (f === 'H2O' || keep.has(lab)) return { kind: 'mol', parts: [{ label: sp(lab, f, 'mol'), n: x.coef }] };
    if (reactant) { if (c && ['metal', 'solid'].includes(c.group)) return { kind: 'solid', parts: [{ label: sp(lab, f, 'solid'), n: x.coef }] };
      if (c && c.ions && c.strong !== false) return { kind: 'ions', parts: ionsOf(c.ions, x.coef) };
      return { kind: t.ppt.some((p) => p.f === f) || !c ? 'solid' : 'mol', parts: [{ label: sp(lab, f, t.ppt.some((p) => p.f === f) || !c ? 'solid' : 'mol'), n: x.coef }] }; }
    if (COMP[f]) { const [ca, an] = COMP[f], qc = CATIONS[ca].q, qa = ANIONS[an].q, g = gcd(qc, qa); return { kind: 'ions', parts: ionsOf([ca, qa / g, an, qc / g], x.coef) }; }
    return { kind: 'mol', parts: [{ label: sp(lab, f, 'mol'), n: x.coef }] }; };
  const exist = e.b ? BY_ID[e.b].f : null;
  const terms = eq.lhs.map((x) => ({ f: x.f, label: pretty(x.f), coef: x.coef, source: !e.a || x.f === exist || eq.lhs.length === 1 ? 'in' : 'add', ...split(x, true) }));
  const prods = eq.rhs.map((x) => ({ f: x.f, label: pretty(x.f), coef: x.coef, mark: x.mark || '', ...split(x, false) }));
  const sum = (list) => { const m = {}; for (const tm of list) for (const p of tm.parts) m[p.label] = (m[p.label] || 0) + p.n; return m; };
  const L = sum(terms), R = sum(prods), spect = [];
  for (const k of Object.keys(L)) { const c = Math.min(L[k], R[k] || 0); if (c > 0) { spect.push({ label: k, n: c }); L[k] -= c; R[k] -= c; } }
  let lhs = Object.entries(L).filter(([, n]) => n > 0).map(([label, n]) => ({ label, n })), rhs = Object.entries(R).filter(([, n]) => n > 0).map(([label, n]) => ({ label, n, kind: species[label].kind }));
  const g = [...lhs, ...rhs].reduce((a, x) => gcd(a, x.n), 0) || 1; lhs = lhs.map((x) => ({ ...x, n: x.n / g })); rhs = rhs.map((x) => ({ ...x, n: x.n / g }));
  const per = terms.reduce((s, tm) => s + tm.parts.reduce((q, p) => q + p.n, 0), 0), nr = Math.max(1, Math.min(4, Math.round(30 / per)));
  // chất tham gia còn dư trong ống: thêm vài hạt không phản ứng để thấy "dư"
  const excess = terms.map((tm) => { const c = chemOf(tm.f), it = c && t.items[c.id]; return it && it.mol > 1e-9 ? 2 : 0; });
  const show = (x) => (x.n > 1 ? x.n : '') + x.label + (species[x.label].kind === 'ppt' ? '↓' : species[x.label].kind === 'gas' ? '↑' : '');
  return { species, terms, prods, lhs, rhs, spect, nr, perEq: g, excess, ionic: `${lhs.map(show).join(' + ')} → ${rhs.map(show).join(' + ')}`, usesIons: terms.some((tm) => tm.kind === 'ions') };
}

// Ống đang có những hạt gì, bao nhiêu mmol (để kính lúp "sống theo ống"): chất điện li mạnh tính theo ion, kết tủa và chất rắn tính riêng, không tính nước dung môi và chất chỉ thị.
// prod = sổ sản phẩm của ống (những sản phẩm tan mà sổ sách ống nghiệm không theo dõi như một chất trong tủ, ví dụ ZnCl2).
export function population(t, prod = {}) {
  const pop = {}, seen = new Set(), put = (label, plain, kind, mmol) => { if (mmol <= 1e-6) return; const q = pop[label] || (pop[label] = { label, plain, kind, mmol: 0, color: colorOf(plain) }); q.mmol += mmol; };
  const ions = ([c, nc, a, na], mm) => { put(prettyIon(CATIONS[c].f, CATIONS[c].q), CATIONS[c].f, 'ion', mm * nc); put(prettyIon(ANIONS[a].f, -ANIONS[a].q), ANIONS[a].f, 'ion', mm * na); };
  for (const it of Object.values(t.items)) { if (it.mol <= 1e-9 || it.id === 'H2O') continue; const c = BY_ID[it.id], mm = it.mol * 1000; seen.add(c.f);
    if (['metal', 'solid'].includes(c.group)) put(pretty(c.f), c.f, 'solid', mm); else if (c.group === 'indicator') continue; else if (c.ions && c.strong !== false) ions(c.ions, mm); else put(pretty(c.f), c.f, 'mol', mm); }
  for (const [f, q] of Object.entries(prod)) { if (q.mark || f === 'H2O' || seen.has(f) || q.mol <= 1e-9) continue; const mm = q.mol * 1000;
    if (COMP[f] && !(f.includes('SCN') && f.includes('Fe'))) { const [ca, an] = COMP[f], qc = CATIONS[ca].q, qa = ANIONS[an].q, g = gcd(qc, qa); ions([ca, qa / g, an, qc / g], mm); } else put(pretty(f), f, 'mol', mm); }
  for (const p of t.ppt) { put(pretty(p.f), p.f, 'ppt', p.mol * 1000); const q = pop[pretty(p.f)]; if (q) { q.note = p.color; q.form = p.form; if (COMP[p.f]) { const [ca, an] = COMP[p.f], qc = CATIONS[ca].q, qa = ANIONS[an].q, g = gcd(qc, qa); q.parts = [[CATIONS[ca].f, qa / g], [ANIONS[an].f, qc / g]]; } } } // parts: kết tủa gồm những ion nào, để vẽ thành một đơn vị mạng
  return pop;
}
// Một chất vừa cho vào ống thì đem theo những hạt nào (để chúng đi vào khung hạt): chất tan tách thành ion, chất rắn vào thành khối; nước và chỉ thị không tính.
export function entering(id, mmol) { const c = BY_ID[id], out = []; if (!c || id === 'H2O' || c.group === 'indicator' || !(mmol > 0)) return out;
  if (['metal', 'solid'].includes(c.group)) return [{ label: pretty(c.f), plain: c.f, kind: 'solid', mmol, color: colorOf(c.f) }]; // chất rắn: vào thành một khối nằm ở đáy
  if (c.ions && c.strong !== false) { const [ca, nc, an, na] = c.ions; out.push({ label: prettyIon(CATIONS[ca].f, CATIONS[ca].q), plain: CATIONS[ca].f, kind: 'ion', mmol: mmol * nc }, { label: prettyIon(ANIONS[an].f, -ANIONS[an].q), plain: ANIONS[an].f, kind: 'ion', mmol: mmol * na }); }
  else out.push({ label: pretty(c.f), plain: c.f, kind: 'mol', mmol }); return out.map((x) => ({ ...x, color: colorOf(x.plain) })); }
