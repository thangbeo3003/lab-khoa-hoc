// Công thức hoá học: đọc công thức, viết chỉ số dưới, tính khối lượng mol, cân bằng phương trình.
// Bộ cân bằng dùng phân số chính xác, nên cũng là bộ kiểm tra: phương trình nào không cân bằng được thì bị loại.

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = { '+': '⁺', '-': '⁻', 1: '', 2: '²', 3: '³', 4: '⁴' };
export const MASS = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.99, Mg: 24.305, Al: 26.982, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Mn: 54.938, Fe: 55.845, Cu: 63.546, Zn: 65.38, Ag: 107.868, I: 126.904, Ba: 137.327, Pb: 207.2 };

export const pretty = (f) => f.replace(/\d/g, (d) => SUB[d]);
export const prettyIon = (f, q) => pretty(f) + (SUP[Math.abs(q)] ?? '') + SUP[q > 0 ? '+' : '-'];

// 'Fe2(SO4)3' -> { Fe: 2, S: 3, O: 12 }
export function parse(formula) {
  let i = 0;
  const read = (close) => {
    const acc = {};
    while (i < formula.length && formula[i] !== close) {
      const c = formula[i];
      let part;
      if (c === '(' || c === '[') { i++; part = read(c === '(' ? ')' : ']'); i++; }
      else if (/[A-Z]/.test(c)) { let el = c; i++; while (i < formula.length && /[a-z]/.test(formula[i])) el += formula[i++]; part = { [el]: 1 }; }
      else throw new Error(`Công thức lạ: ${formula} tại ${i}`);
      let n = ''; while (i < formula.length && /\d/.test(formula[i])) n += formula[i++];
      const k = n ? Number(n) : 1;
      for (const [el, v] of Object.entries(part)) acc[el] = (acc[el] || 0) + v * k;
    }
    return acc;
  };
  const out = read(null);
  for (const el of Object.keys(out)) if (!(el in MASS)) throw new Error(`Nguyên tố chưa có khối lượng: ${el} trong ${formula}`);
  return out;
}
export const molarMass = (f) => Object.entries(parse(f)).reduce((s, [el, n]) => s + MASS[el] * n, 0);

// ----- phân số -----
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; };
const fr = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
const mul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
const subf = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const divf = (a, b) => fr(a[0] * b[1], a[1] * b[0]);

// Cân bằng: lhs, rhs là mảng { f, q? } (q = điện tích nếu là ion). Trả về mảng hệ số nguyên dương hoặc null.
export function balance(lhs, rhs) {
  const sp = [...lhs.map((s) => ({ ...s, side: 1 })), ...rhs.map((s) => ({ ...s, side: -1 }))];
  const counts = sp.map((s) => parse(s.f));
  const els = [...new Set(counts.flatMap((c) => Object.keys(c)))];
  const rows = els.map((el) => sp.map((s, j) => fr(BigInt((counts[j][el] || 0) * s.side))));
  if (sp.some((s) => s.q)) rows.push(sp.map((s) => fr(BigInt((s.q || 0) * s.side))));
  const n = sp.length; const piv = []; let r = 0;
  for (let c = 0; c < n && r < rows.length; c++) {
    const p = rows.findIndex((row, k) => k >= r && row[c][0] !== 0n); if (p < 0) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    const d = rows[r][c]; rows[r] = rows[r].map((x) => divf(x, d));
    for (let k = 0; k < rows.length; k++) if (k !== r && rows[k][c][0] !== 0n) { const m = rows[k][c]; rows[k] = rows[k].map((x, j) => subf(x, mul(m, rows[r][j]))); }
    piv.push(c); r++;
  }
  const free = [...Array(n).keys()].filter((c) => !piv.includes(c));
  if (free.length !== 1) return null; // không cân bằng được, hoặc có nhiều cách: không dùng
  const sol = Array(n).fill(null); sol[free[0]] = fr(1n);
  piv.forEach((c, k) => { sol[c] = fr(-rows[k][free[0]][0], rows[k][free[0]][1]); });
  const lcm = sol.reduce((l, x) => (l * x[1]) / gcd(l, x[1]), 1n);
  let ints = sol.map((x) => (x[0] * lcm) / x[1]);
  if (ints.every((x) => x < 0n)) ints = ints.map((x) => -x);
  if (ints.some((x) => x <= 0n)) return null;
  const g = ints.reduce((a, b) => gcd(a, b));
  return ints.map((x) => Number(x / g));
}

// Dựng phương trình đã cân bằng. marks: { 'Cu(OH)2': '↓', CO2: '↑' }
export function equation(lhs, rhs, marks = {}) {
  const L = lhs.map((s) => (typeof s === 'string' ? { f: s } : s)), R = rhs.map((s) => (typeof s === 'string' ? { f: s } : s));
  const co = balance(L, R); if (!co) return null;
  const side = (arr, off) => arr.map((s, i) => ({ coef: co[off + i], f: s.f, q: s.q || 0, mark: marks[s.f] || '' }));
  const lhsT = side(L, 0), rhsT = side(R, L.length);
  const show = (t) => (t.coef > 1 ? t.coef : '') + (t.q ? prettyIon(t.f, t.q) : pretty(t.f)) + t.mark;
  return { lhs: lhsT, rhs: rhsT, text: `${lhsT.map(show).join(' + ')} → ${rhsT.map(show).join(' + ')}` };
}
