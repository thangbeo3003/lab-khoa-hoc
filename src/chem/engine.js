// Máy phản ứng (luồng 2): hỏi hai chất, trả về một trong ba kiểu:
//   'reaction' có phản ứng (phương trình đã cân bằng + danh sách hiệu ứng + lý do)
//   'none'     không phản ứng (kèm lý do, chỉ nói khi luật chứng minh được)
//   'na'       chưa có dữ liệu (không đoán)
// Thứ tự xét: bảng ngoại lệ viết tay → các luật → mặc định 'na'.
// Bản thử 18/11/2026. CHƯA có giáo viên Hoá duyệt.
import { CATIONS, ANIONS, CHEMS, BY_ID, SERIES, CATION_METAL, METAL_LOOK, INSOLUBLE, KSP, NA_PAIRS, INDICATOR, PPT_ACID, PPT_BASE_INERT, PPT_INERT, HALOGEN_SERIES } from './data.js';
import { equation, pretty, prettyIon, parse, molarMass } from './formula.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const ACID_OF = { Cl: 'HCl', NO3: 'HNO3', SO4: 'H2SO4', CO3: 'H2CO3', HCO3: 'H2CO3', CH3COO: 'CH3COOH', OH: 'H2O', I: 'HI', SCN: 'HSCN', MnO4: 'HMnO4', Br: 'HBr' };
const METAL_CATION = { Na: 'Na', Mg: 'Mg', Al: 'Al', Zn: 'Zn', Fe: 'Fe2', Cu: 'Cu', Ag: 'Ag' };
const VN = { Na: 'sodium', Mg: 'magnesium', Al: 'nhôm', Zn: 'kẽm', Fe: 'sắt', Cu: 'đồng', Ag: 'bạc', Pb: 'chì' };
const rank = (m) => SERIES.indexOf(m);

// Công thức của hợp chất tạo từ một cation và một anion.
export function compound(catId, anId) {
  if (catId === 'H') return ACID_OF[anId];
  const c = CATIONS[catId], a = ANIONS[anId], g = gcd(c.q, a.q), nc = a.q / g, na = c.q / g;
  if (anId === 'CH3COO') return (na > 1 ? `(CH3COO)${na}` : 'CH3COO') + c.f;
  const cp = nc > 1 ? (c.poly ? `(${c.f})${nc}` : c.f + nc) : c.f;
  const ap = na > 1 ? (a.poly ? `(${a.f})${na}` : a.f + na) : a.f;
  return cp + ap;
}

// ---------- chất phát sinh trong ống (không có trong tủ) ----------
// Sản phẩm tan (ZnCl₂, FeCl₂, Cu(NO₃)₂…) và kết tủa (Cu(OH)₂, BaSO₄…) được ghi vào BY_ID với derived: true để sổ ống nghiệm
// theo dõi và cho phản ứng tiếp bằng CHÍNH các bảng ion của máy. Không nằm trong CHEMS nên không hiện trong tủ và không đổi 780 cặp của bài kiểm.
// Không tự sinh muối của OH⁻, CO₃²⁻, HCO₃⁻, MnO₄⁻ (pH và tính oxi hoá chưa có dữ liệu) và các cặp ion trong NA_PAIRS.
const CAT_NAME = { Na: 'Sodium', K: 'Potassium', NH4: 'Ammonium', Ag: 'Silver', Ba: 'Barium', Ca: 'Calcium', Mg: 'Magnesium', Zn: 'Zinc', Cu: 'Copper(II)', Fe2: 'Iron(II)', Fe3: 'Iron(III)', Al: 'Aluminium', Pb: 'Lead(II)' };
const AN_NAME = { Cl: 'chloride', NO3: 'nitrate', SO4: 'sulfate', CO3: 'carbonate', HCO3: 'hydrogencarbonate', OH: 'hydroxide', I: 'iodide', CH3COO: 'acetate', MnO4: 'permanganate', SCN: 'thiocyanate', Br: 'bromide' };
// Màu của cation trong dung dịch: lấy đúng màu đã khai cho muối cùng cation trong tủ (không thêm màu mới).
const ION_LOOK = { Cu: BY_ID.CuSO4, Fe2: BY_ID.FeSO4, Fe3: BY_ID.FeCl3 };
const STOCK_F = Object.fromEntries(CHEMS.filter((c) => c.group !== 'indicator').map((c) => [c.f, c.id]));
const SOLUTE_ID = Object.fromEntries(CHEMS.filter((c) => c.conc && (c.ions || c.halogen)).map((c) => [c.f, c.id])), PPT_ID = { ...STOCK_F }; // halogen sinh ra (Br₂, I₂) là chất tan sổ ống theo dõi được
export const PAIR_OF = {}, DERIVED = [];
const derive = (f, extra) => { const id = f.replace(/[()[\]]/g, ''); if (BY_ID[id]) throw new Error(`Trùng mã chất phát sinh: ${id}`); const c = { id, f, derived: true, ...extra }; BY_ID[id] = c; DERIVED.push(c); return id; };
for (const c of Object.keys(CATIONS)) { if (c === 'H') continue; for (const a of Object.keys(ANIONS)) {
  const k = `${c}|${a}`, f = compound(c, a), g = gcd(CATIONS[c].q, ANIONS[a].q), name = `${CAT_NAME[c]} ${AN_NAME[a]}`, lk = ION_LOOK[c]; PAIR_OF[f] = [c, a];
  if (STOCK_F[f]) continue;
  if (INSOLUBLE[k]) PPT_ID[f] = derive(f, { name, group: 'solid', color: INSOLUBLE[k].color });
  else if (!NA_PAIRS.has(k) && !['OH', 'CO3', 'HCO3', 'MnO4'].includes(a)) PPT_ID[f] = SOLUTE_ID[f] = derive(f, { name, group: 'salt', ions: [c, ANIONS[a].q / g, a, CATIONS[c].q / g], color: lk ? lk.color : 'không màu', ...(lk ? { hex: lk.hex, ref: lk.conc } : {}) });
} }
PPT_ID.Ag2O = derive('Ag2O', { name: 'Silver oxide', group: 'solid', color: 'nâu đen' }); PPT_ID.CuI = derive('CuI', { name: 'Copper(I) iodide', group: 'solid', color: 'trắng' });
export const soluteId = (f) => SOLUTE_ID[f] || null; // sản phẩm tan này ứng với chất nào trong sổ (trong tủ hoặc phát sinh)
export const pptId = (f) => PPT_ID[f] || null; // kết tủa này ứng với mã chất nào

// ---------- hiệu ứng: mỗi phản ứng được diễn bằng tổ hợp các dạng này ----------
const E = {
  ppt: (f, color, form = '') => ({ type: 'ppt', f, color, form, text: `Xuất hiện kết tủa ${color}${form ? ', dạng ' + form : ''} (${pretty(f)})` }),
  gas: (f, name, o = {}) => ({ type: 'gas', f, name, color: o.color || 'không màu', rate: o.rate || 'vừa', text: `Sủi bọt khí ${o.color || 'không màu'} (${name})${o.smell ? ', mùi ' + o.smell : ''}${o.rate ? ', ' + o.rate : ''}` }),
  color: (from, to, hex) => ({ type: 'color', from, to, hex, text: `Dung dịch chuyển từ ${from} sang ${to}` }),
  dissolve: (what) => ({ type: 'dissolve', what, text: `${what} tan dần` }),
  heat: (level = 'nhẹ') => ({ type: 'heat', level, text: `Toả nhiệt ${level}` }),
  coat: (metal, color) => ({ type: 'coat', metal, color, text: `Lớp ${VN[metal] || metal} màu ${color} bám lên bề mặt kim loại` }),
  quiet: () => ({ type: 'quiet', text: 'Không thấy thay đổi bằng mắt thường' }),
};
const FX_ORDER = ['ppt', 'gas', 'color', 'coat', 'dissolve', 'quiet', 'heat'];
const base = (a, b) => ({ a: a.id, b: b.id, title: `${pretty(a.f)} + ${pretty(b.f)}` });
function rx(a, b, lhs, rhs, marks, effects, reason, extra = {}) {
  const eq = lhs ? equation(lhs, rhs, marks) : null;
  if (lhs && !eq) return { ...base(a, b), kind: 'na', reason: 'Chưa dựng được phương trình cân bằng cho cặp này.', bug: true };
  return { ...base(a, b), kind: 'reaction', eq, equation: eq ? eq.text : null, effects, phenomenon: effects.map((e) => e.text).join('. ') + '.', reason, notes: [], ...extra };
}
const none = (a, b, reason, observation) => ({ ...base(a, b), kind: 'none', equation: null, effects: [], phenomenon: observation || 'Không có hiện tượng gì.', reason, notes: [], observation });
const na = (a, b, reason = 'App chưa có dữ liệu cho cặp này.') => ({ ...base(a, b), kind: 'na', equation: null, effects: [], phenomenon: 'Chưa có dữ liệu.', reason, notes: [] });
const note = (r, ...t) => { r.notes.push(...t); return r; };

// ---------- bảng ngoại lệ viết tay (xét trước mọi luật) ----------
const key = (x, y) => [x, y].sort().join('+');
const EXC = {};
const ex = (x, y, fn) => { EXC[key(x, y)] = fn; };
const P = { '↓': (...fs) => Object.fromEntries(fs.map((f) => [f, '↓'])), '↑': (...fs) => Object.fromEntries(fs.map((f) => [f, '↑'])) };

ex('AgNO3', 'NaOH', (a, b) => rx(a, b, ['AgNO3', 'NaOH'], ['Ag2O', 'H2O', 'NaNO3'], P['↓']('Ag2O'), [E.ppt('Ag2O', 'nâu đen')], 'AgOH không bền, phân huỷ ngay thành Ag₂O.'));
ex('AgNO3', 'CaOH2', (a, b) => rx(a, b, ['AgNO3', 'Ca(OH)2'], ['Ag2O', 'H2O', 'Ca(NO3)2'], P['↓']('Ag2O'), [E.ppt('Ag2O', 'nâu đen')], 'AgOH không bền, phân huỷ ngay thành Ag₂O.'));
ex('FeCl3', 'KSCN', (a, b) => rx(a, b, ['FeCl3', 'KSCN'], ['Fe(SCN)3', 'KCl'], {}, [E.color('vàng nâu', 'đỏ máu', '#b3121d')], 'Ion Fe³⁺ kết hợp với SCN⁻ tạo phức màu đỏ máu. Phản ứng rất nhạy, dùng để nhận biết Fe³⁺.', { ionic: 'Fe³⁺ + 3SCN⁻ → Fe(SCN)₃' }));
ex('FeCl3', 'KI', (a, b) => rx(a, b, ['FeCl3', 'KI'], ['FeCl2', 'I2', 'KCl'], {}, [E.color('vàng nâu', BY_ID.I2.color, BY_ID.I2.hex)], 'Fe³⁺ oxi hoá I⁻ thành I₂ (màu nâu), bản thân bị khử về Fe²⁺.', { ionic: '2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂' }));
ex('CuSO4', 'KI', (a, b) => rx(a, b, ['CuSO4', 'KI'], ['CuI', 'I2', 'K2SO4'], P['↓']('CuI'), [E.ppt('CuI', 'trắng'), E.color('xanh lam', BY_ID.I2.color, BY_ID.I2.hex)], 'Cu²⁺ oxi hoá I⁻ thành I₂ (màu nâu), bản thân bị khử thành CuI không tan.'));
ex('FeCl3', 'Na2CO3', (a, b) => rx(a, b, ['FeCl3', 'Na2CO3', 'H2O'], ['Fe(OH)3', 'CO2', 'NaCl'], { ...P['↓']('Fe(OH)3'), ...P['↑']('CO2') }, [E.ppt('Fe(OH)3', 'nâu đỏ', 'keo'), E.gas('CO2', 'carbon dioxide')], 'Muối carbonate của Fe³⁺ không tồn tại trong nước: bị thuỷ phân hoàn toàn thành hydroxide và CO₂.'));
ex('AlCl3', 'Na2CO3', (a, b) => rx(a, b, ['AlCl3', 'Na2CO3', 'H2O'], ['Al(OH)3', 'CO2', 'NaCl'], { ...P['↓']('Al(OH)3'), ...P['↑']('CO2') }, [E.ppt('Al(OH)3', 'trắng', 'keo'), E.gas('CO2', 'carbon dioxide')], 'Muối carbonate của Al³⁺ không tồn tại trong nước: bị thuỷ phân hoàn toàn thành hydroxide và CO₂.'));
ex('FeCl3', 'NaHCO3', (a, b) => rx(a, b, ['FeCl3', 'NaHCO3'], ['Fe(OH)3', 'CO2', 'NaCl'], { ...P['↓']('Fe(OH)3'), ...P['↑']('CO2') }, [E.ppt('Fe(OH)3', 'nâu đỏ', 'keo'), E.gas('CO2', 'carbon dioxide')], 'Fe³⁺ và HCO₃⁻ thuỷ phân tương hỗ, tạo hydroxide không tan và CO₂.'));
ex('AlCl3', 'NaHCO3', (a, b) => rx(a, b, ['AlCl3', 'NaHCO3'], ['Al(OH)3', 'CO2', 'NaCl'], { ...P['↓']('Al(OH)3'), ...P['↑']('CO2') }, [E.ppt('Al(OH)3', 'trắng', 'keo'), E.gas('CO2', 'carbon dioxide')], 'Al³⁺ và HCO₃⁻ thuỷ phân tương hỗ, tạo hydroxide không tan và CO₂.'));
ex('NaHCO3', 'NaOH', (a, b) => rx(a, b, ['NaHCO3', 'NaOH'], ['Na2CO3', 'H2O'], {}, [E.quiet()], 'HCO₃⁻ tác dụng với OH⁻ tạo CO₃²⁻ và nước. Có phản ứng nhưng không nhìn thấy.', { ionic: 'HCO₃⁻ + OH⁻ → CO₃²⁻ + H₂O' }));
ex('NaHCO3', 'CaOH2', (a, b) => rx(a, b, ['NaHCO3', 'Ca(OH)2'], ['CaCO3', 'NaOH', 'H2O'], P['↓']('CaCO3'), [E.ppt('CaCO3', 'trắng', 'mịn')], 'OH⁻ biến HCO₃⁻ thành CO₃²⁻, ion này gặp Ca²⁺ tạo CaCO₃ không tan.'));
ex('AgNO3', 'FeSO4', (a, b) => rx(a, b, ['AgNO3', 'FeSO4'], ['Ag', 'Fe(NO3)3', 'Fe2(SO4)3'], P['↓']('Ag'), [E.ppt('Ag', 'xám'), E.color('lục nhạt', 'vàng nhạt', '#e3c877')], 'Ag⁺ oxi hoá Fe²⁺ thành Fe³⁺, bản thân bị khử thành bạc kim loại.', { ionic: 'Fe²⁺ + Ag⁺ → Fe³⁺ + Ag↓' }));
ex('CuSO4', 'NH3', (a, b) => note(rx(a, b, ['CuSO4', 'NH3', 'H2O'], ['Cu(OH)2', '(NH4)2SO4'], P['↓']('Cu(OH)2'), [E.ppt('Cu(OH)2', 'xanh lam', 'keo')], 'Dung dịch ammonia có OH⁻, gặp Cu²⁺ tạo Cu(OH)₂ không tan.'), 'Nếu cho ammonia tới dư, kết tủa tan lại thành dung dịch màu xanh thẫm (tạo phức).'));
ex('Cu', 'HNO3', (a, b) => note(rx(a, b, ['Cu', 'HNO3'], ['Cu(NO3)2', 'NO', 'H2O'], P['↑']('NO'), [E.gas('NO', 'nitrogen monoxide'), E.dissolve('Đồng'), E.color('không màu', 'xanh lam', '#58b6ee')], 'Nitric acid có tính oxi hoá mạnh nên hoà tan được cả đồng, nhưng không sinh khí hydrogen.'), 'Khí NO không màu, gặp không khí hoá nâu đỏ (NO₂).', 'Ở nồng độ loãng này phản ứng chậm, nhanh hơn khi đun nhẹ.'));
ex('Ag', 'HNO3', (a, b) => note(rx(a, b, ['Ag', 'HNO3'], ['AgNO3', 'NO', 'H2O'], P['↑']('NO'), [E.gas('NO', 'nitrogen monoxide'), E.dissolve('Bạc')], 'Nitric acid có tính oxi hoá mạnh nên hoà tan được cả bạc, nhưng không sinh khí hydrogen.'), 'Khí NO không màu, gặp không khí hoá nâu đỏ (NO₂).', 'Ở nồng độ loãng này phản ứng chậm, nhanh hơn khi đun nhẹ.'));
ex('Fe', 'HNO3', (a, b) => note(rx(a, b, ['Fe', 'HNO3'], ['Fe(NO3)3', 'NO', 'H2O'], P['↑']('NO'), [E.gas('NO', 'nitrogen monoxide'), E.dissolve('Sắt'), E.color('không màu', 'vàng nhạt', '#e3c877')], 'Nitric acid oxi hoá sắt lên Fe³⁺ và không sinh khí hydrogen.'), 'Khí NO không màu, gặp không khí hoá nâu đỏ (NO₂).'));
for (const m of ['Na', 'Mg', 'Al', 'Zn']) ex(m, 'HNO3', (a, b) => na(a, b, 'Kim loại mạnh tác dụng với nitric acid loãng cho sản phẩm khử khác nhau tuỳ nồng độ (NO, N₂O, NH₄NO₃). App chưa mô phỏng trường hợp này.'));
ex('Al', 'NaOH', (a, b) => rx(a, b, ['Al', 'NaOH', 'H2O'], ['Na[Al(OH)4]', 'H2'], P['↑']('H2'), [E.gas('H2', 'hydrogen'), E.dissolve('Nhôm')], 'Nhôm tan được trong dung dịch kiềm vì lớp oxide và hydroxide của nhôm có tính lưỡng tính.'));
ex('Zn', 'NaOH', (a, b) => rx(a, b, ['Zn', 'NaOH', 'H2O'], ['Na2[Zn(OH)4]', 'H2'], P['↑']('H2'), [E.gas('H2', 'hydrogen', { rate: 'chậm' }), E.dissolve(BY_ID.Zn.name)], 'Kẽm tan được trong dung dịch kiềm vì hydroxide của kẽm có tính lưỡng tính.'));
ex('Cu', 'FeCl3', (a, b) => rx(a, b, ['Cu', 'FeCl3'], ['CuCl2', 'FeCl2'], {}, [E.dissolve('Đồng'), E.color('vàng nâu', 'xanh lục nhạt', '#9fd0b4')], 'Fe³⁺ oxi hoá được đồng thành Cu²⁺, bản thân bị khử về Fe²⁺.', { ionic: 'Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺' }));
ex('Fe', 'FeCl3', (a, b) => rx(a, b, ['Fe', 'FeCl3'], ['FeCl2'], {}, [E.dissolve('Sắt'), E.color('vàng nâu', 'lục nhạt', '#cfe6cf')], 'Sắt khử Fe³⁺ về Fe²⁺.', { ionic: 'Fe + 2Fe³⁺ → 3Fe²⁺' }));
for (const m of ['Zn', 'Mg', 'Al']) ex(m, 'FeCl3', (a, b) => note(rx(a, b, [m, 'FeCl3'], [compound(METAL_CATION[m], 'Cl'), 'FeCl2'], {}, [E.dissolve(BY_ID[m].name), E.color('vàng nâu', 'lục nhạt', '#cfe6cf')], 'Kim loại mạnh hơn khử Fe³⁺ về Fe²⁺ trước.'), 'Nếu kim loại còn dư, Fe²⁺ tiếp tục bị khử thành sắt bám lên bề mặt.'));
ex('Ag', 'FeCl3', (a, b) => none(a, b, 'Bạc không khử được Fe³⁺.'));
ex('H2O2', 'MnO2', (a, b) => note(rx(a, b, ['H2O2'], ['H2O', 'O2'], P['↑']('O2'), [E.gas('O2', 'oxygen', { rate: 'mạnh' }), E.heat('nhẹ')], 'MnO₂ là chất xúc tác: làm hydrogen peroxide phân huỷ nhanh thành nước và oxygen.'), 'Sau phản ứng MnO₂ còn nguyên, có thể lọc ra dùng lại.'));
ex('H2O2', 'FeCl3', (a, b) => note(rx(a, b, ['H2O2'], ['H2O', 'O2'], P['↑']('O2'), [E.gas('O2', 'oxygen', { rate: 'chậm' })], 'Ion Fe³⁺ xúc tác cho hydrogen peroxide phân huỷ thành nước và oxygen.'), 'FeCl₃ chỉ là chất xúc tác, không có trong phương trình.'));
// Ba phản ứng sinh I₂ ở trên lấy màu của iodine trong dung dịch iodide từ lọ nước iodine (25/11), để sổ ống gán màu cho đúng chất I₂.
// Phản ứng oxi hoá khử cần môi trường acid (thêm H2SO4 loãng).
const NEED_ACID = 'Cần thêm môi trường acid (vài giọt H₂SO₄ loãng) thì phản ứng mới xảy ra rõ.';
const fixed = (a, b, lhs, rhs, marks, effects, reason, opts) => (opts.medium === 'acid' ? rx(a, b, lhs, rhs, marks, effects, reason, { medium: 'acid' }) : { ...na(a, b, NEED_ACID), needs: 'acid' });
ex('FeSO4', 'KMnO4', (a, b, o) => fixed(a, b, ['KMnO4', 'FeSO4', 'H2SO4'], ['Fe2(SO4)3', 'K2SO4', 'MnSO4', 'H2O'], {}, [E.color('tím', 'vàng rất nhạt', '#f2e6b8')], 'Trong môi trường acid, MnO₄⁻ (tím) oxi hoá Fe²⁺ thành Fe³⁺ và bị khử về Mn²⁺ gần như không màu.', o));
ex('H2O2', 'KI', (a, b, o) => fixed(a, b, ['H2O2', 'KI', 'H2SO4'], ['I2', 'K2SO4', 'H2O'], {}, [E.color('không màu', BY_ID.I2.color, BY_ID.I2.hex)], 'Trong môi trường acid, hydrogen peroxide oxi hoá I⁻ thành I₂ (màu nâu).', o));
ex('FeSO4', 'H2O2', (a, b, o) => fixed(a, b, ['FeSO4', 'H2O2', 'H2SO4'], ['Fe2(SO4)3', 'H2O'], {}, [E.color('lục nhạt', 'vàng nâu', '#d9a03b')], 'Trong môi trường acid, hydrogen peroxide oxi hoá Fe²⁺ thành Fe³⁺.', o));
ex('CaCO3', 'H2SO4', (a, b) => note(rx(a, b, ['CaCO3', 'H2SO4'], ['CaSO4', 'CO2', 'H2O'], P['↑']('CO2'), [E.gas('CO2', 'carbon dioxide', { rate: 'chậm dần rồi dừng' })], 'Acid mạnh đẩy CO₂ ra khỏi muối carbonate.'), 'CaSO₄ ít tan bám quanh viên đá vôi, ngăn acid tiếp xúc, nên phản ứng chậm dần rồi dừng.'));
ex('HCl', 'MnO2', (a, b) => none(a, b, 'Với HCl loãng ở nhiệt độ thường thì không phản ứng. Cần HCl đặc và đun nóng mới sinh khí chlorine.'));
// Santamaria và cộng sự, Electrochimica Acta (2007), doi:10.1016/j.electacta.2007.03.019 · lớp hydroxide trên Mg trong nước tinh khiết.
ex('H2O', 'Mg', (a, b) => none(a, b, 'Magnesium phản ứng rất chậm với nước lạnh. Lớp magnesium hydroxide hình thành trên bề mặt làm phản ứng chậm thêm. Bàn thực hành chỉ mô tả hiện tượng gần như chưa thấy ngay sau khi trộn.', 'Phản ứng rất chậm'));
for (const x of ['AgNO3', 'ZnSO4']) ex('NH3', x, (a, b) => na(a, b, 'Với dung dịch ammonia, kết tủa tạo ra rồi tan lại do tạo phức. App chưa mô phỏng trường hợp này.'));
ex('CH3COOH', 'CuO', (a, b) => na(a, b, 'Phản ứng xảy ra chậm, cần đun nóng. App chưa mô phỏng trường hợp này.'));

ex('FeSO4', 'KSCN', (a, b) => note(none(a, b, 'Fe²⁺ không tạo phức màu với SCN⁻.'), 'Chỉ Fe³⁺ mới cho màu đỏ máu với SCN⁻. Vì vậy KSCN dùng để phân biệt Fe²⁺ với Fe³⁺.'));

// ---------- các luật ----------
function indicatorRule(ind, x) {
  if (ind.senses) { // thuốc thử nhận biết một chất (hồ tinh bột nhận biết iodine), không theo pH
    if (x.group === 'indicator' || x.group === 'metal' || x.group === 'solid') return na(ind, x);
    if (x.f === ind.senses) return rx(ind, x, null, null, {}, [E.color('không màu', ind.on, ind.onHex)], `${ind.name} gặp ${pretty(x.f)} thì hoá ${ind.on}. Đây là cách nhận biết iodine.`);
    return none(ind, x, `Trong dung dịch này không có ${pretty(ind.senses)} nên ${ind.name.toLowerCase()} không đổi màu.`, 'Không đổi màu.');
  }
  if (x.group === 'indicator' || x.group === 'metal' || x.group === 'solid' || x.id === 'H2O2' || x.id === 'KMnO4' || typeof x.ph !== 'number') return na(ind, x);
  let [col, hex] = INDICATOR[ind.id](x.ph); if (ind.id === 'pp' && x.ph > 8.2 && x.ph < 9) [col, hex] = ['hồng rất nhạt', '#f3b6d6']; const changed = !col.includes('không đổi');
  const why = `Dung dịch ${pretty(x.f)} có pH khoảng ${String(x.ph).replace('.', ',')}.`;
  if (!changed) return none(ind, x, `${why} ${ind.name} không đổi màu trong khoảng này.`);
  const r = rx(ind, x, null, null, {}, [E.color(ind.id === 'quy' ? 'tím' : 'không màu', col, hex)], `${why} ${ind.id === 'quy' ? 'Quỳ tím hoá đỏ khi pH dưới 5, hoá xanh khi pH trên 8.' : 'Phenolphthalein hoá hồng khi pH từ khoảng 8,2 trở lên.'}`);
  if (x.hex) note(r, 'Dung dịch vốn có màu nên màu chỉ thị khó nhìn hơn.');
  return r;
}

// Chất ít tan chỉ coi là "thấy kết tủa" khi tích nồng độ vượt tích số tan 100 lần: ở dung dịch đặc ion hoạt động kém hơn
// nồng độ ghi trên nhãn và mầm tinh thể hình thành chậm, nên sát ngưỡng thì mắt thường chưa thấy gì.
const VISIBLE = 100;
// Hai chất điện li trong dung dịch: xét hai cặp ion ghép chéo.
function ionRule(A, B, opts = {}) {
  const [c1, n1, a1, m1] = A.ions, [c2, n2, a2, m2] = B.ions;
  if (c1 === c2 || a1 === a2) return none(A, B, 'Hai chất có chung một loại ion nên không có phản ứng trao đổi.');
  const vA = opts.volA ?? 1, vB = opts.volB ?? 1, fA = vA / (vA + vB), fB = vB / (vA + vB);
  const cA = opts.conc?.[A.id] ?? A.conc * fA, cB = opts.conc?.[B.id] ?? B.conc * fB; // opts.conc: nồng độ thật trong ống (mol/L), sổ ống nghiệm đưa vào khi có chất phát sinh
  const conc = { [c1]: cA * n1, [a1]: cA * m1, [c2]: cB * n2, [a2]: cB * m2 };
  const lhs = [A.f, B.f], rhs = [], marks = {}, effects = [], reasons = [], notes = []; let ionic = null, any = false;
  const weak = (!A.strong && A.group === 'acid') || (!B.strong && B.group === 'acid');
  for (const [c, a] of [[c1, a2], [c2, a1]]) {
    const k = `${c}|${a}`;
    if (NA_PAIRS.has(k)) return na(A, B, `Cặp ion ${prettyIon(CATIONS[c].f, CATIONS[c].q)} và ${prettyIon(ANIONS[a].f, -ANIONS[a].q)} phản ứng phức tạp hơn mức phổ thông. App chưa mô phỏng.`);
    const f = compound(c, a), ci = { f: CATIONS[c].f, q: CATIONS[c].q }, ai = { f: ANIONS[a].f, q: -ANIONS[a].q };
    if (c === 'H' && a === 'OH') {
      any = true; rhs.push('H2O'); effects.push(E.quiet(), E.heat('nhẹ')); reasons.push('H⁺ của acid kết hợp với OH⁻ của base tạo thành nước (phản ứng trung hoà).');
      ionic = ionic || (weak ? 'CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O' : 'H⁺ + OH⁻ → H₂O');
    } else if (c === 'H' && (a === 'CO3' || a === 'HCO3')) {
      any = true; rhs.push('CO2', 'H2O'); marks.CO2 = '↑'; effects.push(E.gas('CO2', 'carbon dioxide')); reasons.push('Acid mạnh hơn đẩy carbonic acid ra khỏi muối; carbonic acid không bền nên phân huỷ thành CO₂ và nước.');
      ionic = ionic || (weak ? null : equation([{ f: 'H', q: 1 }, ai], ['CO2', 'H2O'], marks)?.text);
    } else if (c === 'NH4' && a === 'OH') {
      any = true; rhs.push('NH3', 'H2O'); marks.NH3 = '↑'; effects.push(E.gas('NH3', 'ammonia', { smell: 'khai', rate: 'nhẹ' })); reasons.push('NH₄⁺ gặp OH⁻ giải phóng khí ammonia.'); notes.push('Khí thoát ra rõ hơn khi đun nhẹ. Giấy quỳ ẩm đặt ở miệng ống hoá xanh.');
      ionic = ionic || 'NH₄⁺ + OH⁻ → NH₃↑ + H₂O';
    } else if (INSOLUBLE[k]) {
      const s = INSOLUBLE[k]; any = true; rhs.push(f); marks[f] = '↓'; effects.push(E.ppt(f, s.color, s.form)); reasons.push(`${pretty(f)} không tan trong nước nên tách ra thành kết tủa.`);
      if (s.note) notes.push(s.note);
      if (s.amph && (A.id === 'NaOH' || B.id === 'NaOH')) notes.push(`Nếu cho NaOH tới dư, kết tủa tan lại: ${equation([f, 'NaOH'], [s.amph === 1 ? 'Na[Al(OH)4]' : 'Na2[Zn(OH)4]']).text}.`);
      ionic = ionic || (weak ? null : equation([ci, ai], [f], marks)?.text);
    } else if (KSP[k]) {
      const s = KSP[k], Q = Math.pow(conc[c], s.a) * Math.pow(conc[a], s.b);
      if (!Number.isFinite(Q)) return na(A, B, `${pretty(f)} ít tan; chưa biết nồng độ trong ống nên app chưa kết luận được có kết tủa hay không.`);
      if (Q > s.ksp * VISIBLE) { any = true; rhs.push(f); marks[f] = '↓'; effects.push(E.ppt(f, s.color, 'vẩn đục nhẹ')); reasons.push(`${pretty(f)} ít tan; ở nồng độ này lượng tạo ra vượt mức hoà tan nên dung dịch vẩn đục.`); ionic = ionic || equation([ci, ai], [f], marks)?.text; } else { rhs.push(f); notes.push(Q > s.ksp ? `${pretty(f)} ít tan. Ở nồng độ này mới sát ngưỡng bão hoà nên thường chưa thấy kết tủa; dung dịch đặc hơn thì vẩn đục.` : `${pretty(f)} ít tan, nhưng ở nồng độ loãng này chưa đủ để tạo kết tủa.`); }
    } else { rhs.push(f); if (a === 'HCO3' && (c === 'Ca' || c === 'Ba')) notes.push(`Ở nhiệt độ thường không thấy gì. Nếu đun nóng, xuất hiện kết tủa trắng ${pretty(c + 'CO3')} và có khí CO₂.`); }
  }
  if (!any) { const r = none(A, B, 'Các ion cùng tồn tại trong dung dịch: không tạo chất kết tủa, chất khí hay nước.'); r.notes.push(...notes); return r; }
  // Thứ tự vế phải cố định: kết tủa, muối/acid tan, khí, nước. Vế trái giữ đúng thứ tự người dùng cho chất vào.
  const ord = (f) => (marks[f] === '↓' ? 0 : marks[f] === '↑' ? 2 : f === 'H2O' ? 3 : 1);
  const out = [...new Set(rhs)].sort((x, y) => ord(x) - ord(y) || (x < y ? -1 : 1));
  const r = rx(A, B, lhs, out, marks, effects.filter((e, i, arr) => !(e.type === 'quiet' && arr.some((x) => x.type === 'ppt' || x.type === 'gas'))).sort((x, y) => FX_ORDER.indexOf(x.type) - FX_ORDER.indexOf(y.type) || (x.text < y.text ? -1 : 1)), reasons.join(' '), { ionic });
  r.notes.push(...notes); return r;
}

const WATER_NA = (m, x) => rx(m, x, ['Na', 'H2O'], ['NaOH', 'H2'], { H2: '↑' }, [E.gas('H2', 'hydrogen', { rate: 'rất mạnh' }), E.dissolve('Sodium'), E.heat('mạnh')], 'Sodium là kim loại kiềm, phản ứng mãnh liệt với nước trong dung dịch.');
function metalRule(M, X, opts) {
  const m = M.id;
  if (X.group === 'metal' || X.group === 'solid') return na(M, X, 'Phòng thực hành này chưa mô phỏng phản ứng giữa hai chất rắn.');
  if (X.group === 'indicator' || X.id === 'H2O2' || X.id === 'KMnO4') return na(M, X);
  if (X.id === 'H2O') {
    if (m === 'Na') return note(WATER_NA(M, X), 'Dung dịch sau phản ứng là kiềm: làm phenolphthalein hoá hồng.', 'Ngoài thật chỉ dùng mẩu sodium bằng hạt đậu, có kính bảo hộ.');
    return none(M, X, `${M.name} không tác dụng với nước ở nhiệt độ thường.`);
  }
  if (X.group === 'acid') {
    if (rank(m) > rank('H')) return none(M, X, `${M.name} đứng sau H trong dãy hoạt động hoá học nên không đẩy được hydrogen ra khỏi acid loãng.`);
    const cat = METAL_CATION[m], salt = compound(cat, X.ions[2]);
    const rate = { Na: 'rất mạnh', Mg: 'mạnh', Al: 'vừa', Zn: 'vừa', Fe: 'chậm' }[m];
    const fx = [E.gas('H2', 'hydrogen', { rate: X.strong ? rate : 'chậm' }), E.dissolve(M.name), E.heat(m === 'Na' ? 'mạnh' : 'nhẹ')];
    if (m === 'Fe') fx.push(E.color('không màu', 'lục nhạt', '#cfe6cf'));
    const r = rx(M, X, [M.f, X.f], [salt, 'H2'], { H2: '↑' }, fx, `${M.name} đứng trước H trong dãy hoạt động hoá học nên đẩy được hydrogen ra khỏi acid.`);
    if (m === 'Na') note(r, 'Phản ứng rất mãnh liệt, ngoài thật không làm thí nghiệm này.');
    if (m === 'Al') note(r, 'Lúc đầu chậm vì nhôm có lớp oxide mỏng bảo vệ.');
    if (!X.strong) note(r, 'Acetic acid là acid yếu nên khí thoát ra chậm hơn so với HCl cùng nồng độ.');
    return r;
  }
  if (m === 'Na') { // sodium gặp dung dịch nào cũng phản ứng với nước trước
    const r = WATER_NA(M, X);
    if (X.ions && X.group === 'salt') {
      const second = ionRule(BY_ID.NaOH, X, opts);
      if (second.kind === 'reaction') { r.eq2 = second.eq; r.equation2 = second.equation; r.effects.push(...second.effects.filter((e) => e.type !== 'quiet' && e.type !== 'heat')); r.phenomenon = r.effects.map((e) => e.text).join('. ') + '.'; r.reason += ` NaOH vừa sinh ra phản ứng tiếp với ${pretty(X.f)}.`; } else if (second.kind === 'na') note(r, 'NaOH sinh ra có thể phản ứng tiếp với muối này; app chưa có dữ liệu cho bước đó.');
    }
    return note(r, 'Sodium không đẩy kim loại ra khỏi dung dịch muối, vì nó phản ứng với nước trước.');
  }
  if (X.id === 'NaOH' || X.id === 'CaOH2') return X.id === 'CaOH2' && (m === 'Al' || m === 'Zn') ? na(M, X) : none(M, X, `${M.name} không tác dụng với dung dịch kiềm.`);
  if (X.id === 'NH3') return na(M, X);
  if (X.group === 'salt') {
    const [cc, , an] = X.ions, T = CATION_METAL[cc];
    if (!T) return na(M, X); // muối ammonium
    if (cc === 'Fe3') return na(M, X, 'Ion Fe³⁺ là chất oxi hoá: với kim loại, nó bị khử về Fe²⁺ trước chứ không theo luật đẩy kim loại đơn giản. App mới có dữ liệu cho FeCl₃.'); // FeCl₃ đã nằm trong bảng ngoại lệ; dòng này chặn Fe(NO₃)₃, Fe₂(SO₄)₃ phát sinh trong ống
    if (['Na', 'K', 'Ba', 'Ca'].includes(T)) return ['Na2CO3', 'NaHCO3'].includes(X.id) && ['Mg', 'Al', 'Zn'].includes(m) ? na(M, X) : none(M, X, `${M.name} yếu hơn ${T} nên không đẩy được ${T} ra khỏi muối.`);
    if (m === T) return none(M, X, 'Kim loại và muối của chính kim loại đó không phản ứng với nhau.');
    if (rank(m) > rank(T)) return none(M, X, `${M.name} đứng sau ${T} trong dãy hoạt động hoá học nên không đẩy được ${T} ra khỏi muối.`);
    const salt = compound(METAL_CATION[m], an), fx = [E.coat(T, METAL_LOOK[T] || 'xám'), E.dissolve(M.name)];
    const after = m === 'Fe' ? ['lục nhạt', '#cfe6cf'] : m === 'Cu' ? ['xanh lam', '#58b6ee'] : ['không màu', null];
    if (X.color !== after[0]) fx.push(E.color(X.color, after[0], after[1]));
    const r = rx(M, X, [M.f, X.f], [salt, T], {}, fx, `${M.name} đứng trước ${T} trong dãy hoạt động hoá học nên đẩy được ${T} ra khỏi dung dịch muối.`);
    if (m === 'Al') note(r, 'Lúc đầu chậm vì nhôm có lớp oxide mỏng bảo vệ.');
    return r;
  }
  return na(M, X);
}

function solidRule(S, X) {
  const s = S.id;
  if (X.group === 'solid' || X.group === 'metal') return na(S, X, 'Phòng thực hành này chưa mô phỏng phản ứng giữa hai chất rắn.');
  if (X.group === 'indicator' || X.id === 'H2O2' || X.id === 'KMnO4') return na(S, X);
  if (X.id === 'H2O') {
    if (s === 'CaO') return note(rx(S, X, ['CaO', 'H2O'], ['Ca(OH)2'], {}, [E.heat('mạnh'), E.dissolve('Vôi sống')], 'Calcium oxide là oxide base, tác dụng với nước tạo calcium hydroxide (tôi vôi).'), 'Ca(OH)₂ ít tan: phần tan là nước vôi trong, phần còn lại là vôi tôi lắng xuống.');
    return none(S, X, `${S.name} không tan trong nước.`);
  }
  if (X.group === 'acid') {
    const an = X.ions[2];
    if (s === 'MnO2') return none(S, X, 'Manganese dioxide không tan trong acid loãng ở nhiệt độ thường.');
    if (s === 'CaCO3') { const r = rx(S, X, ['CaCO3', X.f], [compound('Ca', an), 'CO2', 'H2O'], { CO2: '↑' }, [E.gas('CO2', 'carbon dioxide', { rate: X.strong ? 'mạnh' : 'chậm' }), E.dissolve('Đá vôi')], 'Acid mạnh hơn carbonic acid nên đẩy được CO₂ ra khỏi muối carbonate.'); return r; }
    if (s === 'CuO') return rx(S, X, ['CuO', X.f], [compound('Cu', an), 'H2O'], {}, [E.dissolve('Bột đen CuO'), E.color('không màu', 'xanh lam', '#58b6ee')], 'Copper(II) oxide là oxide base, tác dụng với acid tạo muối và nước.');
    if (s === 'CaO') { const r = rx(S, X, ['CaO', X.f], [compound('Ca', an), 'H2O'], {}, [E.dissolve('Vôi sống'), E.heat('mạnh')], 'Calcium oxide là oxide base, tác dụng với acid tạo muối và nước.'); if (an === 'SO4') note(r, 'CaSO₄ ít tan nên dung dịch có thể vẩn đục.'); return r; }
  }
  if (s === 'CaO') return na(S, X);
  if (X.group === 'base') return s === 'CuO' && X.id === 'NH3' ? na(S, X) : none(S, X, `${S.name} không tác dụng với dung dịch kiềm.`);
  if (X.group === 'salt') return X.ph >= 6.5 && X.ph <= 7.5 ? none(S, X, `${S.name} không tan và không tác dụng với dung dịch muối trung tính này.`) : na(S, X);
  return na(S, X);
}

function ammoniaRule(N, X) {
  if (X.id === 'H2O') return none(N, X, 'Chỉ pha loãng dung dịch.');
  if (X.group === 'acid') return rx(N, X, ['NH3', X.f], [compound('NH4', X.ions[2])], {}, [E.quiet(), E.heat('nhẹ')], 'Ammonia là base, nhận H⁺ của acid tạo muối ammonium.', { ionic: X.strong ? 'NH₃ + H⁺ → NH₄⁺' : null });
  if (X.group === 'base') return none(N, X, 'Hai dung dịch đều là base, không phản ứng với nhau.');
  if (X.group === 'salt' && X.ions) {
    const [cc, , an] = X.ions, k = `${cc}|OH`;
    if (X.id === 'NaHCO3' || X.special) return na(N, X);
    if (['Mg', 'Fe2', 'Fe3', 'Al', 'Pb'].includes(cc)) { const f = compound(cc, 'OH'), s = INSOLUBLE[k]; const r = rx(N, X, [X.f, 'NH3', 'H2O'], [f, compound('NH4', an)], { [f]: '↓' }, [E.ppt(f, s.color, s.form)], `Dung dịch ammonia có OH⁻; ${pretty(f)} không tan nên tách ra thành kết tủa.`); if (s.note) note(r, s.note); if (cc === 'Al') note(r, 'Khác với NaOH, ammonia dư không hoà tan được Al(OH)₃.'); return r; }
    if (['Na', 'K', 'Ba', 'Ca', 'NH4'].includes(cc)) return none(N, X, 'Không tạo chất kết tủa hay chất khí nên không có phản ứng.');
  }
  return na(N, X);
}

// ---------- halogen gặp ion halide (25/11). Một luật cho mọi cặp, theo dãy HALOGEN_SERIES của data.js ----------
const HAL_NAME = { Cl: 'chlorine', Br: 'bromine', I: 'iodine' }, halRank = (h) => HALOGEN_SERIES.indexOf(h);
const HAL_LOOK = Object.fromEntries(CHEMS.filter((c) => c.halogen).map((c) => [c.halogen, c])); // màu của halogen trong dung dịch: lấy từ lọ nước halogen trong tủ
const HAL_BUSY = ['Fe2', 'NH4']; // cation mà chính halogen cũng phản ứng được (Fe²⁺ bị oxi hoá; NH₄⁺ phức tạp): chưa có dữ liệu
function halogenRule(X, Y) {
  const h = X.halogen;
  if (Y.halogen) return na(X, Y, 'Hai halogen gặp nhau phản ứng phức tạp hơn mức phổ thông. App chưa mô phỏng.');
  const an = Y.ions && Y.ions[2], cat = Y.ions && Y.ions[0];
  if (!isElectrolyte(Y) || halRank(an) < 0) return na(X, Y);
  if (HAL_BUSY.includes(cat)) return na(X, Y, `Halogen còn phản ứng với ion ${prettyIon(CATIONS[cat].f, CATIONS[cat].q)}. App chưa mô phỏng.`);
  const ion = (e) => prettyIon(ANIONS[e].f, -1);
  if (an === h) return note(none(X, Y, `${pretty(X.f)} và ion ${ion(an)} là cùng một halogen nên không đẩy nhau.`, 'Không đổi, chỉ pha loãng.'), ...(h === 'I' ? ['Iodine tan trong dung dịch có ion iodide (tạo ion I₃⁻ màu đỏ nâu).'] : []));
  if (halRank(h) > halRank(an)) return none(X, Y, `Tính oxi hoá giảm dần Cl₂ > Br₂ > I₂. ${pretty(X.f)} yếu hơn ${pretty(an + '2')} nên không lấy được electron của ion ${ion(an)}.`, 'Không đổi, chỉ pha loãng.');
  const y2 = an + '2', look = HAL_LOOK[an], fx = [E.color(Y.color || 'không màu', look.color, look.hex)];
  const r = rx(X, Y, [X.f, Y.f], [compound(cat, h), y2], {}, fx, `Tính oxi hoá giảm dần Cl₂ > Br₂ > I₂. ${HAL_NAME[h][0].toUpperCase() + HAL_NAME[h].slice(1)} mạnh hơn ${HAL_NAME[an]} nên lấy electron của ion ${ion(an)}, đẩy ${HAL_NAME[an]} ra khỏi muối.`,
    { ionic: equation([{ f: X.f }, { f: an, q: -1 }], [{ f: h, q: -1 }, { f: y2 }])?.text });
  if (an === 'I') note(r, `Iodine sinh ra tan trong ion iodide còn lại nên dung dịch màu đỏ nâu. Nếu ${HAL_NAME[h]} dư so với iodide, iodine tách ra thành kết tủa xám đen.`);
  return r;
}

const isElectrolyte = (x) => x.ions && !x.special && (x.group === 'acid' || x.group === 'base' || x.group === 'salt');
const REDUCING = ['Fe2', 'I', 'SCN'], oxNa = (A, B) => [[A, B], [B, A]].some(([x, y]) => x.id === 'HNO3' && y.ions && (REDUCING.includes(y.ions[0]) || REDUCING.includes(y.ions[2]))); // trong tủ: đúng 3 cặp HNO₃ + KI, FeSO₄, KSCN như trước

// Hàm chính. opts: { medium: 'acid', volA, volB }
export function predict(idA, idB, opts = {}) {
  const A = BY_ID[idA], B = BY_ID[idB];
  if (!A || !B) throw new Error(`Không có chất ${idA} hoặc ${idB}`);
  if (idA === idB) return none(A, B, 'Hai phần của cùng một chất.');
  const e = EXC[key(idA, idB)]; if (e) return e(A, B, opts);
  const pick = (test) => (test(A) ? [A, B] : test(B) ? [B, A] : null);
  let p;
  if ((p = pick((x) => x.group === 'indicator'))) return indicatorRule(p[0], p[1]);
  if ((p = pick((x) => x.group === 'metal'))) return metalRule(p[0], p[1], opts);
  if ((p = pick((x) => x.group === 'solid'))) return solidRule(p[0], p[1]);
  if ((p = pick((x) => x.id === 'KMnO4'))) return ['H2O', 'Na2SO4', 'H2SO4', 'HNO3'].includes(p[1].id) ? none(p[0], p[1], p[1].id === 'H2SO4' ? 'Không phản ứng; H₂SO₄ chỉ tạo môi trường acid cho thuốc tím.' : 'Không có phản ứng, dung dịch chỉ nhạt màu do pha loãng.') : na(p[0], p[1], 'Thuốc tím là chất oxi hoá mạnh, phản ứng tuỳ môi trường. App chưa có dữ liệu cho cặp này.');
  if ((p = pick((x) => x.id === 'H2O2'))) return p[1].id === 'H2O' ? none(p[0], p[1], 'Chỉ pha loãng dung dịch.') : na(p[0], p[1]);
  if ((p = pick((x) => x.id === 'H2O'))) return none(p[0], p[1], 'Chỉ pha loãng dung dịch.');
  if ((p = pick((x) => x.id === 'NH3'))) return ammoniaRule(p[0], p[1]);
  if ((p = pick((x) => x.halogen))) return halogenRule(p[0], p[1]);
  if (oxNa(A, B)) return na(A, B, 'Nitric acid có tính oxi hoá, phản ứng với chất khử này phức tạp hơn mức phổ thông. App chưa mô phỏng.');
  if (isElectrolyte(A) && isElectrolyte(B)) return ionRule(A, B, opts);
  return na(A, B);
}

// Kết tủa (hoặc chất rắn sinh ra) đang nằm trong ống gặp một chất tan idB. f: công thức kết tủa.
// Chỉ kết luận những gì có nguồn (bảng PPT_ACID, PPT_BASE_INERT, PPT_INERT trong data.js và cờ amph của INSOLUBLE); còn lại trả 'na'.
// Kết tủa trùng với một chất rắn trong tủ (CaCO₃, CuO, Ag) hoặc Ca(OH)₂ gặp acid thì dùng lại luật sẵn có của predict.
export function predictPpt(f, idB) {
  const X = BY_ID[idB], S = BY_ID[PPT_ID[f]]; if (!X || !S) return null;
  if (!S.derived) return S.group === 'solid' || S.group === 'metal' || (S.id === 'CaOH2' && X.group === 'acid') ? predict(S.id, idB) : na(S, X, 'App chưa có dữ liệu cho kết tủa này với chất vừa thêm.');
  const pair = PAIR_OF[f], k = pair ? pair.join('|') : f, c = pair && pair[0], a = pair && pair[1], tan = E.dissolve(`Kết tủa ${pretty(f)}`);
  if (X.group === 'acid' && PPT_ACID[k] && (X.strong || PPT_ACID[k].weak)) {
    const an = X.ions[2], ks = `${c}|${an}`, salt = compound(c, an), lk = ION_LOOK[c];
    if (INSOLUBLE[ks] || KSP[ks] || NA_PAIRS.has(ks)) return na(S, X, `Muối tạo ra (${pretty(salt)}) không tan hoặc ít tan, bám lên kết tủa cũ nên diễn biến phức tạp hơn mức phổ thông. App chưa mô phỏng.`);
    if (X.oxidizing && c === 'Fe2') return na(S, X, 'Nitric acid còn oxi hoá Fe²⁺ lên Fe³⁺, phức tạp hơn mức phổ thông. App chưa mô phỏng.');
    const gas = a === 'CO3', marks = gas ? { CO2: '↑' } : {}, ion = { f: CATIONS[c].f, q: CATIONS[c].q };
    const fx = [...(gas ? [E.gas('CO2', 'carbon dioxide', X.strong ? {} : { rate: 'chậm' })] : []), ...(lk ? [E.color('không màu', lk.color, lk.hex)] : []), tan];
    return rx(X, S, [f, X.f], gas ? [salt, 'CO2', 'H2O'] : [salt, 'H2O'], marks, fx, gas ? `Muối carbonate không tan vẫn tác dụng với acid mạnh hơn carbonic acid: tạo muối tan ${pretty(salt)}, khí CO₂ và nước, nên kết tủa tan dần.` : `${pretty(f)} là base không tan: tác dụng với acid tạo muối tan ${pretty(salt)} và nước, nên kết tủa tan dần.`,
      { ionic: X.strong ? equation([{ f }, { f: 'H', q: 1 }], gas ? [ion, { f: 'CO2' }, { f: 'H2O' }] : [ion, { f: 'H2O' }], { ...marks })?.text : null });
  }
  if (X.id === 'NaOH' && INSOLUBLE[k]?.amph) { const p = INSOLUBLE[k].amph === 1 ? 'Na[Al(OH)4]' : 'Na2[Zn(OH)4]';
    return rx(X, S, [f, 'NaOH'], [p], {}, [tan], `${pretty(f)} là hydroxide lưỡng tính: tan trong dung dịch kiềm dư, tạo ${pretty(p)} tan trong nước.`, { ionic: INSOLUBLE[k].amph === 1 ? 'Al(OH)₃ + OH⁻ → [Al(OH)₄]⁻' : 'Zn(OH)₂ + 2OH⁻ → [Zn(OH)₄]²⁻' }); }
  if (X.id === 'NaOH' && PPT_BASE_INERT[k]) return none(S, X, PPT_BASE_INERT[k]);
  if (PPT_INERT[k] && (X.group === 'acid' || (PPT_INERT[k].base && (X.id === 'NaOH' || X.id === 'CaOH2')))) return none(S, X, PPT_INERT[k].why);
  return na(S, X, 'App chưa có dữ liệu cho kết tủa này với chất vừa thêm.');
}

// Lượng chất: đổi mL (dung dịch) hoặc gam (chất rắn) ra mol, rồi tìm chất hết trước.
export function moles(id, amount) { const c = BY_ID[id]; return amount.mL != null ? (c.conc * amount.mL) / 1000 : amount.g / molarMass(c.f); }
export function limiting(result, molA, molB) {
  if (!result.eq) return null;
  const co = (id) => result.eq.lhs.find((t) => t.f === BY_ID[id].f)?.coef;
  const ca = co(result.a), cb = co(result.b); if (!ca || !cb) return null;
  const xa = molA / ca, xb = molB / cb, x = Math.min(xa, xb);
  return { extent: x, limiting: Math.abs(xa - xb) < 1e-12 ? null : xa < xb ? result.a : result.b, products: result.eq.rhs.map((t) => ({ f: t.f, mol: t.coef * x })), left: { [result.a]: molA - ca * x, [result.b]: molB - cb * x } };
}
export { CHEMS, BY_ID, parse };
