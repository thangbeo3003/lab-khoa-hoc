// Kho dữ liệu của máy phản ứng (luồng 2). Mỗi hoá chất khai báo MỘT lần; các luật đọc bảng chung để suy ra kết quả.
// Trạng thái: bản thử 18/11/2026, ghi theo kiến thức phổ thông. CHƯA có giáo viên Hoá duyệt, chưa đối chiếu nguồn từng dòng.
// Tên gọi theo chương trình 2018.

export const CATIONS = {
  H: { f: 'H', q: 1 }, Na: { f: 'Na', q: 1 }, K: { f: 'K', q: 1 }, NH4: { f: 'NH4', q: 1, poly: true }, Ag: { f: 'Ag', q: 1 },
  Ba: { f: 'Ba', q: 2 }, Ca: { f: 'Ca', q: 2 }, Mg: { f: 'Mg', q: 2 }, Zn: { f: 'Zn', q: 2 }, Cu: { f: 'Cu', q: 2 },
  Fe2: { f: 'Fe', q: 2 }, Fe3: { f: 'Fe', q: 3 }, Al: { f: 'Al', q: 3 }, Pb: { f: 'Pb', q: 2 },
};
export const ANIONS = {
  Cl: { f: 'Cl', q: 1 }, NO3: { f: 'NO3', q: 1, poly: true }, SO4: { f: 'SO4', q: 2, poly: true }, CO3: { f: 'CO3', q: 2, poly: true },
  HCO3: { f: 'HCO3', q: 1, poly: true }, OH: { f: 'OH', q: 1, poly: true }, I: { f: 'I', q: 1 }, CH3COO: { f: 'CH3COO', q: 1, poly: true },
  MnO4: { f: 'MnO4', q: 1, poly: true }, SCN: { f: 'SCN', q: 1, poly: true }, Br: { f: 'Br', q: 1 },
};

// group: acid | base | salt | metal | solid | indicator | other. ions: [cation, số cation, anion, số anion].
// ph: pH gần đúng của chính dung dịch đó ở nồng độ ghi. color: màu nhìn thấy.
const C = (id, f, name, group, extra) => ({ id, f, name, group, ...extra });
// Câu cảnh báo an toàn cho kim loại kiềm (chất có cờ alkali). Sổ ống nghiệm gắn vào r.safety của sự kiện phản ứng để giao diện hiện.
// Không ghi con số. Với nước: Chemguide, "Reactions of the Group 1 elements with water" ("All of these metals react vigorously or even explosively
// with cold water", đọc trực tiếp 21/11). Với acid: kiến thức phổ thông, CHƯA có nguồn đọc trực tiếp, chưa có giáo viên duyệt.
export const ALKALI_SAFETY = {
  water: 'An toàn: kim loại kiềm phản ứng mãnh liệt với nước, toả nhiều nhiệt, khí hydrogen có thể bốc cháy hoặc nổ. Ngoài thật chỉ giáo viên làm, với một mẩu rất nhỏ và có tấm chắn.',
  acid: 'An toàn: kim loại kiềm phản ứng rất mãnh liệt với dung dịch acid, có thể gây nổ. Ngoài thật không làm thí nghiệm này; ở đây chỉ là mô phỏng.',
};
// ---------- nhóm halogen (25/11, bài Hoá 10 · Nhóm halogen, CHEM10-05) ----------
// Nguồn: Chemguide, "Halogens as oxidising agents", https://www.chemguide.co.uk/inorganic/group7/halogensasoas.html (tự tải và dò 25/11),
// trùng bảng dữ kiện D1–D6 của app/src/lessons/h10_nhom_halogen/facts.md.
// Dãy tính oxi hoá của halogen trong dung dịch, mạnh → yếu (D6). Halogen đứng trước lấy electron của ion halide đứng sau: X₂ + 2Y⁻ → 2X⁻ + Y₂.
// F₂ không đưa vào: trong nước F₂ oxi hoá cả nước (D6).
export const HALOGEN_SERIES = ['Cl', 'Br', 'I'];
// I₂ chỉ tan được trong dung dịch còn ion iodide (tạo I₃⁻ màu đỏ); hết iodide thì I₂ tách ra thành chất rắn xám đen (nguồn như trên, D2, D3).
export const IODINE_SOLID = { color: 'xám đen', form: 'tinh thể' };
// Câu cảnh báo an toàn theo loại nguy hiểm của chất (trường hazard). Không ghi con số. Lời theo mục 3 (An toàn) của facts.md.
export const SAFETY = {
  halogen: 'An toàn: Cl₂ và Br₂ rất độc, gây bỏng. Ngoài đời chỉ làm trong tủ hút; ở đây chỉ mô phỏng hiện tượng.',
};
export const CHEMS = [
  C('HCl', 'HCl', 'Hydrochloric acid', 'acid', { conc: 1.0, ions: ['H', 1, 'Cl', 1], strong: true, ph: 0, color: 'không màu' }),
  C('H2SO4', 'H2SO4', 'Sulfuric acid loãng', 'acid', { conc: 0.5, ions: ['H', 2, 'SO4', 1], strong: true, ph: 0, color: 'không màu' }),
  C('HNO3', 'HNO3', 'Nitric acid loãng', 'acid', { conc: 1.0, ions: ['H', 1, 'NO3', 1], strong: true, ph: 0, color: 'không màu', oxidizing: true }),
  C('CH3COOH', 'CH3COOH', 'Acetic acid', 'acid', { conc: 1.0, ions: ['H', 1, 'CH3COO', 1], strong: false, ph: 2.4, color: 'không màu' }),
  C('NaOH', 'NaOH', 'Sodium hydroxide', 'base', { conc: 1.0, ions: ['Na', 1, 'OH', 1], strong: true, ph: 14, color: 'không màu' }),
  C('CaOH2', 'Ca(OH)2', 'Nước vôi trong (calcium hydroxide)', 'base', { conc: 0.02, ions: ['Ca', 1, 'OH', 2], strong: true, ph: 12.4, color: 'không màu' }),
  C('NH3', 'NH3', 'Dung dịch ammonia', 'base', { conc: 1.0, strong: false, ph: 11.6, color: 'không màu' }),
  C('NaCl', 'NaCl', 'Sodium chloride', 'salt', { conc: 0.5, ions: ['Na', 1, 'Cl', 1], ph: 7, color: 'không màu' }),
  C('Na2CO3', 'Na2CO3', 'Sodium carbonate', 'salt', { conc: 0.5, ions: ['Na', 2, 'CO3', 1], ph: 12, color: 'không màu' }),
  C('NaHCO3', 'NaHCO3', 'Sodium hydrogencarbonate', 'salt', { conc: 0.5, ions: ['Na', 1, 'HCO3', 1], ph: 8.3, color: 'không màu' }),
  C('Na2SO4', 'Na2SO4', 'Sodium sulfate', 'salt', { conc: 0.5, ions: ['Na', 2, 'SO4', 1], ph: 7, color: 'không màu' }),
  C('BaCl2', 'BaCl2', 'Barium chloride', 'salt', { conc: 0.5, ions: ['Ba', 1, 'Cl', 2], ph: 7, color: 'không màu' }),
  C('CaCl2', 'CaCl2', 'Calcium chloride', 'salt', { conc: 0.5, ions: ['Ca', 1, 'Cl', 2], ph: 7, color: 'không màu' }),
  C('AgNO3', 'AgNO3', 'Silver nitrate', 'salt', { conc: 0.1, ions: ['Ag', 1, 'NO3', 1], ph: 6, color: 'không màu' }),
  C('CuSO4', 'CuSO4', 'Copper(II) sulfate', 'salt', { conc: 0.1, ions: ['Cu', 1, 'SO4', 1], ph: 4, color: 'xanh lam', hex: '#58b6ee' }),
  C('FeCl3', 'FeCl3', 'Iron(III) chloride', 'salt', { conc: 0.1, ions: ['Fe3', 1, 'Cl', 3], ph: 2, color: 'vàng nâu', hex: '#d9a03b' }),
  C('FeSO4', 'FeSO4', 'Iron(II) sulfate', 'salt', { conc: 0.1, ions: ['Fe2', 1, 'SO4', 1], ph: 3.5, color: 'lục nhạt', hex: '#cfe6cf' }),
  C('AlCl3', 'AlCl3', 'Aluminium chloride', 'salt', { conc: 0.1, ions: ['Al', 1, 'Cl', 3], ph: 3, color: 'không màu' }),
  C('ZnSO4', 'ZnSO4', 'Zinc sulfate', 'salt', { conc: 0.1, ions: ['Zn', 1, 'SO4', 1], ph: 5, color: 'không màu' }),
  C('MgCl2', 'MgCl2', 'Magnesium chloride', 'salt', { conc: 0.5, ions: ['Mg', 1, 'Cl', 2], ph: 6.5, color: 'không màu' }),
  C('KI', 'KI', 'Potassium iodide', 'salt', { conc: 0.1, ions: ['K', 1, 'I', 1], ph: 7, color: 'không màu' }),
  C('NaBr', 'NaBr', 'Sodium bromide', 'salt', { conc: 0.1, ions: ['Na', 1, 'Br', 1], ph: 7, color: 'không màu' }),
  C('KBr', 'KBr', 'Potassium bromide', 'salt', { conc: 0.1, ions: ['K', 1, 'Br', 1], ph: 7, color: 'không màu' }),
  C('PbNO32', 'Pb(NO3)2', 'Lead(II) nitrate', 'salt', { conc: 0.1, ions: ['Pb', 1, 'NO3', 2], ph: 4, color: 'không màu' }),
  C('NH4Cl', 'NH4Cl', 'Ammonium chloride', 'salt', { conc: 0.5, ions: ['NH4', 1, 'Cl', 1], ph: 4.8, color: 'không màu' }),
  C('KMnO4', 'KMnO4', 'Potassium permanganate (thuốc tím)', 'salt', { conc: 0.01, ions: ['K', 1, 'MnO4', 1], ph: 7, color: 'tím', hex: '#8d3a9c', special: true }),
  C('KSCN', 'KSCN', 'Potassium thiocyanate', 'salt', { conc: 0.1, ions: ['K', 1, 'SCN', 1], ph: 7, color: 'không màu' }),
  C('Na', 'Na', 'Sodium', 'metal', { valence: 1, color: 'trắng bạc', alkali: true }), // alkali: kim loại kiềm (luật nước, an toàn: ALKALI_SAFETY)
  C('Mg', 'Mg', 'Magnesium', 'metal', { valence: 2, color: 'trắng bạc' }),
  C('Al', 'Al', 'Aluminium', 'metal', { valence: 3, color: 'trắng bạc' }),
  C('Zn', 'Zn', 'Zinc', 'metal', { valence: 2, color: 'xám' }),
  C('Fe', 'Fe', 'Iron', 'metal', { valence: 2, color: 'xám' }),
  C('Cu', 'Cu', 'Copper', 'metal', { valence: 2, color: 'đỏ' }),
  C('Ag', 'Ag', 'Silver', 'metal', { valence: 1, color: 'trắng bạc' }),
  C('CaCO3', 'CaCO3', 'Calcium carbonate (đá vôi)', 'solid', { color: 'trắng' }),
  C('CuO', 'CuO', 'Copper(II) oxide', 'solid', { color: 'đen' }),
  C('MnO2', 'MnO2', 'Manganese dioxide', 'solid', { color: 'đen' }),
  C('CaO', 'CaO', 'Calcium oxide (vôi sống)', 'solid', { color: 'trắng' }),
  C('H2O', 'H2O', 'Nước cất', 'other', { ph: 7, color: 'không màu' }),
  C('H2O2', 'H2O2', 'Hydrogen peroxide 3%', 'other', { conc: 0.9, color: 'không màu' }),
  // Nước halogen: halogen = nguyên tố trong HALOGEN_SERIES. conc: số MINH HOẠ để sổ ống tính lượng, CHƯA có nguồn (không phải dữ kiện, không phải độ tan).
  // Màu nước chlorine (D9): CHƯA có nguồn đọc trực tiếp. Màu cam của bromine và đỏ nâu của iodine trong dung dịch iodide: nguồn Chemguide như trên.
  // carry: chất đi kèm trong cùng lọ (mol/L, minh hoạ): nước iodine là iodine tan trong dung dịch KI.
  C('Cl2', 'Cl2', 'Nước chlorine', 'other', { conc: 0.05, halogen: 'Cl', hazard: 'halogen', color: 'vàng lục rất nhạt', hex: '#dfeca8' }),
  C('Br2', 'Br2', 'Nước bromine', 'other', { conc: 0.05, halogen: 'Br', hazard: 'halogen', color: 'cam', hex: '#ec8a2b' }),
  C('I2', 'I2', 'Nước iodine (iodine tan trong dung dịch KI)', 'other', { conc: 0.01, halogen: 'I', carry: { KI: 0.1 }, color: 'đỏ nâu', hex: '#9a3412' }),
  C('quy', 'Quỳ tím', 'Quỳ tím', 'indicator', { color: 'tím' }),
  C('pp', 'Phenolphthalein', 'Phenolphthalein', 'indicator', { color: 'không màu' }),
  // Thuốc thử nhận biết một chất (senses), không theo pH. Hồ tinh bột gặp iodine hoá xanh đen (D8): CHƯA có nguồn đọc trực tiếp, kiến thức phổ thông.
  C('tinhbot', 'Hồ tinh bột', 'Hồ tinh bột', 'indicator', { color: 'không màu', senses: 'I2', on: 'xanh đen', onHex: '#1e2550' }),
];
export const BY_ID = Object.fromEntries(CHEMS.map((c) => [c.id, c]));

// Dãy hoạt động hoá học (mạnh → yếu). 'H' là mốc.
export const SERIES = ['K', 'Na', 'Ba', 'Ca', 'Mg', 'Al', 'Zn', 'Fe', 'Pb', 'H', 'Cu', 'Ag'];
export const CATION_METAL = { Na: 'Na', K: 'K', Ba: 'Ba', Ca: 'Ca', Mg: 'Mg', Al: 'Al', Zn: 'Zn', Fe2: 'Fe', Fe3: 'Fe', Pb: 'Pb', Cu: 'Cu', Ag: 'Ag' };
export const METAL_LOOK = { Cu: 'đỏ', Ag: 'trắng xám', Fe: 'xám', Pb: 'xám', Zn: 'xám', Al: 'trắng bạc' };

// Chất không tan tạo thành khi hai ion gặp nhau: 'cation|anion' → màu, dạng.
export const INSOLUBLE = {
  'Ag|Cl': { color: 'trắng', form: 'vón cục' }, 'Ag|I': { color: 'vàng', form: 'vón cục' }, 'Ag|CO3': { color: 'trắng ngả vàng', form: 'bông' }, 'Ag|SCN': { color: 'trắng', form: 'vón cục' },
  'Ba|SO4': { color: 'trắng', form: 'mịn' }, 'Ba|CO3': { color: 'trắng', form: 'mịn' }, 'Ca|CO3': { color: 'trắng', form: 'mịn' },
  'Mg|OH': { color: 'trắng', form: 'keo' }, 'Zn|OH': { color: 'trắng', form: 'keo', amph: 2 }, 'Cu|OH': { color: 'xanh lam', form: 'keo' },
  'Fe2|OH': { color: 'trắng xanh', form: 'keo', note: 'Để ngoài không khí, kết tủa chuyển dần sang nâu đỏ.' }, 'Fe3|OH': { color: 'nâu đỏ', form: 'keo' },
  'Al|OH': { color: 'trắng', form: 'keo', amph: 1 }, 'Pb|OH': { color: 'trắng', form: 'keo', note: 'Kết tủa này tan được trong kiềm dư.' },
  'Pb|I': { color: 'vàng', form: 'tinh thể' }, 'Ag|Br': { color: 'kem rất nhạt', form: 'vón cục' }, // AgBr: Chemguide "Testing for halide ions" ("very pale cream precipitate", đọc 25/11)
  'Pb|SO4': { color: 'trắng', form: 'mịn' }, 'Pb|CO3': { color: 'trắng', form: 'mịn' },
};
// Chất ít tan: chỉ kết tủa khi tích nồng độ ion vượt tích số tan. a, b = số cation, số anion trong công thức.
export const KSP = {
  'Ag|SO4': { ksp: 1.2e-5, a: 2, b: 1, color: 'trắng' }, 'Ca|SO4': { ksp: 4.9e-5, a: 1, b: 1, color: 'trắng' },
  'Ca|OH': { ksp: 5.0e-6, a: 1, b: 2, color: 'trắng' }, 'Pb|Cl': { ksp: 1.7e-5, a: 1, b: 2, color: 'trắng' },
};
// Cặp ion mà luật đơn giản cho kết quả sai hoặc phức tạp hơn mức phổ thông: trả "chưa có dữ liệu".
export const NA_PAIRS = new Set(['Cu|CO3', 'Zn|CO3', 'Mg|CO3', 'Fe2|CO3', 'Cu|HCO3', 'Zn|HCO3', 'Fe2|HCO3', 'Pb|HCO3', 'Ag|HCO3', 'Cu|SCN', 'Pb|SCN', 'Ag|CH3COO', 'Cu|I', 'Fe3|I', 'Fe3|SCN', 'Fe3|CO3', 'Fe3|HCO3', 'Al|CO3', 'Al|HCO3', 'Ag|OH', 'NH4|CO3', 'Pb|Br']); // Pb|Br: PbBr₂ ít tan, chưa có tích số tan có nguồn

// ---------- kết tủa đã tạo gặp chất khác (S1, 21/11). Mỗi dòng có nguồn đã đọc, ghi ở L2_LOGIC_CONG_THUC.md mục 5.2 ----------
// Kết tủa tan trong acid: 'cation|anion' → { weak: true nếu nguồn nêu rõ cả acid yếu (acetic) }. Chỉ áp dụng khi muối tạo ra tan hẳn (máy tự kiểm).
export const PPT_ACID = {
  'Mg|OH': {}, 'Cu|OH': {}, 'Al|OH': {}, 'Zn|OH': {}, // từng chất có câu riêng trong nguồn [L1] [L5] [L6] [L7] [L8]
  'Fe2|OH': {}, 'Fe3|OH': {}, // theo câu chung "hydroxide base tan dễ trong acid" [L1] [L2]; chưa có câu riêng cho hai chất này
  'Ba|CO3': { weak: true }, // "soluble in acid, including dilute acetic acid" [L4]
  'Pb|CO3': {}, 'Ag|CO3': {}, // theo câu chung "even insoluble carbonate salts dissolve in acid" [L3]
};
// Kết tủa KHÔNG tan trong NaOH dư ở nồng độ phòng thí nghiệm [L5] [L9].
export const PPT_BASE_INERT = {
  'Cu|OH': 'Cu(OH)₂ không tan trong NaOH dư ở nồng độ thường dùng (chỉ tan trong kiềm rất đặc).',
  'Fe2|OH': 'Fe(OH)₂ không tan trong NaOH dư.', 'Fe3|OH': 'Fe(OH)₃ không tan trong NaOH dư.',
};
// Kết tủa không tan trong acid (base: cả trong kiềm) [L4] [L10].
export const PPT_INERT = {
  'Ba|SO4': { base: true, why: 'BaSO₄ không tan trong nước, trong acid và trong kiềm. Vì vậy kết tủa trắng BaSO₄ dùng để nhận biết ion sulfate.' },
  'Ag|Cl': { why: 'AgCl không tan trong acid, kể cả nitric acid. Vì vậy kết tủa trắng AgCl dùng để nhận biết ion chloride.' },
};
// Độ tan của Ca(OH)₂ trong nước ở 20 °C: 1,73 g/L [L11]. Phần vượt mức này nằm lại ở dạng rắn (vôi tôi).
export const CAOH2_SAT_G_L = 1.73;

// Khoảng đổi màu của chất chỉ thị.
export const INDICATOR = {
  quy: (ph) => (ph < 5 ? ['đỏ', '#d64545'] : ph > 8 ? ['xanh', '#2f6fd0'] : ['tím (không đổi)', '#8a5ad6']),
  pp: (ph) => (ph > 8.2 ? ['hồng', '#e0489a'] : ['không màu (không đổi)', null]),
};
