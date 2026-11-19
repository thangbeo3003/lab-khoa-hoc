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
  MnO4: { f: 'MnO4', q: 1, poly: true }, SCN: { f: 'SCN', q: 1, poly: true },
};

// group: acid | base | salt | metal | solid | indicator | other. ions: [cation, số cation, anion, số anion].
// ph: pH gần đúng của chính dung dịch đó ở nồng độ ghi. color: màu nhìn thấy.
const C = (id, f, name, group, extra) => ({ id, f, name, group, ...extra });
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
  C('PbNO32', 'Pb(NO3)2', 'Lead(II) nitrate', 'salt', { conc: 0.1, ions: ['Pb', 1, 'NO3', 2], ph: 4, color: 'không màu' }),
  C('NH4Cl', 'NH4Cl', 'Ammonium chloride', 'salt', { conc: 0.5, ions: ['NH4', 1, 'Cl', 1], ph: 4.8, color: 'không màu' }),
  C('KMnO4', 'KMnO4', 'Potassium permanganate (thuốc tím)', 'salt', { conc: 0.01, ions: ['K', 1, 'MnO4', 1], ph: 7, color: 'tím', hex: '#8d3a9c', special: true }),
  C('KSCN', 'KSCN', 'Potassium thiocyanate', 'salt', { conc: 0.1, ions: ['K', 1, 'SCN', 1], ph: 7, color: 'không màu' }),
  C('Na', 'Na', 'Sodium', 'metal', { valence: 1, color: 'trắng bạc' }),
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
  C('quy', 'Quỳ tím', 'Quỳ tím', 'indicator', { color: 'tím' }),
  C('pp', 'Phenolphthalein', 'Phenolphthalein', 'indicator', { color: 'không màu' }),
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
  'Pb|I': { color: 'vàng', form: 'tinh thể' }, 'Pb|SO4': { color: 'trắng', form: 'mịn' }, 'Pb|CO3': { color: 'trắng', form: 'mịn' },
};
// Chất ít tan: chỉ kết tủa khi tích nồng độ ion vượt tích số tan. a, b = số cation, số anion trong công thức.
export const KSP = {
  'Ag|SO4': { ksp: 1.2e-5, a: 2, b: 1, color: 'trắng' }, 'Ca|SO4': { ksp: 4.9e-5, a: 1, b: 1, color: 'trắng' },
  'Ca|OH': { ksp: 5.0e-6, a: 1, b: 2, color: 'trắng' }, 'Pb|Cl': { ksp: 1.7e-5, a: 1, b: 2, color: 'trắng' },
};
// Cặp ion mà luật đơn giản cho kết quả sai hoặc phức tạp hơn mức phổ thông: trả "chưa có dữ liệu".
export const NA_PAIRS = new Set(['Cu|CO3', 'Zn|CO3', 'Mg|CO3', 'Fe2|CO3', 'Cu|HCO3', 'Zn|HCO3', 'Fe2|HCO3', 'Pb|HCO3', 'Ag|HCO3', 'Cu|SCN', 'Pb|SCN', 'Ag|CH3COO', 'Cu|I', 'Fe3|I', 'Fe3|SCN', 'Fe3|CO3', 'Fe3|HCO3', 'Al|CO3', 'Al|HCO3', 'Ag|OH', 'NH4|CO3']);

// Khoảng đổi màu của chất chỉ thị.
export const INDICATOR = {
  quy: (ph) => (ph < 5 ? ['đỏ', '#d64545'] : ph > 8 ? ['xanh', '#2f6fd0'] : ['tím (không đổi)', '#8a5ad6']),
  pp: (ph) => (ph > 8.2 ? ['hồng', '#e0489a'] : ['không màu (không đổi)', null]),
};
