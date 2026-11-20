// Sổ sách của một ống nghiệm: trong ống có chất gì, bao nhiêu mol, chất nào hết, chất nào dư,
// kết tủa nào đã tạo, dung dịch màu gì, chất chỉ thị đang ở màu nào. Không có hình: chạy được bằng node để kiểm thử.
// Quy ước của bản thử: hai chất gặp nhau thì phản ứng xong ngay (coi như đã lắc đều); kết tủa đã tạo không phản ứng tiếp.
import { predict, BY_ID, CHEMS } from '../chem/engine.js';
import { INDICATOR } from '../chem/data.js';
import { molarMass, pretty, equation } from '../chem/formula.js';

export const DROP_ML = 0.05, MAX_ML = 12, CLEAR = '#dcecf5'; // MAX_ML: sức chứa mặc định (ống nghiệm). Mỗi bình mang sức chứa riêng t.cap (cốc 100 mL: 100)
export const PIECE = { Zn: { g: 0.3, unit: 'hạt kẽm' }, CaCO3: { g: 0.25, unit: 'mẩu đá vôi' }, Mg: { g: 0.05, unit: 'đoạn dây magnesium' }, Fe: { g: 0.5, unit: 'đinh sắt' }, Cu: { g: 0.3, unit: 'đoạn dây đồng' }, Al: { g: 0.1, unit: 'mảnh nhôm' } };
const PIECE_DEF = { g: 0.2, unit: 'mẩu' };
const STRONG_H = { HCl: 1, H2SO4: 2, HNO3: 1 }, STRONG_OH = { NaOH: 1, CaOH2: 2 };
const BY_F = Object.fromEntries(CHEMS.filter((c) => c.conc && c.ions).map((c) => [c.f, c.id])); // sản phẩm tan trùng với chất trong kho thì theo dõi tiếp
const EPS = 1e-10, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const isSolid = (id) => ['metal', 'solid'].includes(BY_ID[id].group);
const isReagent = (id) => BY_ID[id].group !== 'indicator' && id !== 'H2O';
export const label = (id) => (BY_ID[id].group === 'indicator' ? BY_ID[id].name : pretty(BY_ID[id].f));

export function newTube(cap = MAX_ML) { return { cap, items: {}, order: [], vol: 0, ppt: [], tints: [], indicator: null, indShown: null, gasTotal: 0, lastGas: null }; }
function item(t, id) { if (!t.items[id]) { t.items[id] = { id, mol: 0, mol0: 0, mL: 0, drops: 0, pieces: 0, coat: null }; t.order.push(id); } return t.items[id]; }

// Thêm một chất. amt: { mL, drop?: true } cho chất lỏng, { piece: true } cho chất rắn. Trả về { full } hoặc { events }.
export function add(t, id, amt) {
  const c = BY_ID[id];
  if (amt.mL && t.vol + amt.mL > (t.cap ?? MAX_ML) + 1e-9) return { full: true, events: [] };
  const it = item(t, id), events = [];
  if (amt.mL) { t.vol += amt.mL; it.mL += amt.mL; if (amt.drop) it.drops += 1; }
  if (c.group === 'indicator') t.indicator = id;
  else if (isSolid(id)) { const m = (PIECE[id] || PIECE_DEF).g / molarMass(c.f); it.mol += m; it.mol0 += m; it.pieces += 1; }
  else if (id !== 'H2O') { const m = (c.conc * amt.mL) / 1000; it.mol += m; it.mol0 += m; }
  if (isReagent(id)) events.push(...react(t, id, 0));
  const ind = indicatorLook(t);
  if (ind && ind.color !== t.indShown) { events.push({ kind: 'indicator', id: t.indicator, from: t.indShown, to: ind.color, changed: ind.changed, pH: ind.pH, first: t.indShown === null }); t.indShown = ind.color; }
  return { events };
}

function react(t, id, depth) {
  const out = [], A = t.items[id], cx = BY_ID[id]; let quiet = null; const fresh = [];
  const others = t.order.filter((y) => y !== id && isReagent(y) && t.items[y].mol > EPS);
  const first = (y) => ((cx.group === 'acid' && BY_ID[y].group === 'base') || (cx.group === 'base' && BY_ID[y].group === 'acid') ? 0 : 1); // trung hoà xảy ra trước
  others.sort((a, b) => first(a) - first(b));
  for (const y of others) {
    const B = t.items[y]; if (A.mol <= EPS) break;
    const eqVol = (cid, x) => (BY_ID[cid].conc ? x.mol / BY_ID[cid].conc : 1);
    const r = predict(id, y, { volA: eqVol(id, A), volB: eqVol(y, B) });
    if (r.kind !== 'reaction' || !r.eq) { if (B.mL > 0 || B.pieces > 0) quiet = quiet || { kind: r.kind, r, a: id, b: y }; continue; }
    const co = (cid) => r.eq.lhs.find((x) => x.f === BY_ID[cid].f)?.coef;
    const ca = co(id), cb = co(y), ext = Math.min(ca ? A.mol / ca : Infinity, cb ? B.mol / cb : Infinity);
    if (!isFinite(ext) || ext <= EPS) continue;
    if (ca) A.mol = Math.max(0, A.mol - ca * ext); if (cb) B.mol = Math.max(0, B.mol - cb * ext);
    const made = [];
    for (const p of r.eq.rhs) {
      const mol = p.coef * ext; made.push({ f: p.f, mol, mark: p.mark });
      if (p.mark === '↓') { const fx = r.effects.find((e) => e.type === 'ppt' && e.f === p.f) || {}, old = t.ppt.find((q) => q.f === p.f); if (old) old.mol += mol; else t.ppt.push({ f: p.f, mol, color: fx.color || 'trắng', form: fx.form || '' }); }
      else if (p.mark === '↑') { t.gasTotal += mol; t.lastGas = p.f; }
      else if (BY_F[p.f]) { const pid = BY_F[p.f], pi = item(t, pid); pi.mol += mol; if (pid !== id && pid !== y) fresh.push(pid); }
    }
    for (const e of r.effects) {
      if (e.type === 'color' && e.hex) { const old = t.tints.find((q) => q.hex === e.hex); if (old) old.mol += ext; else t.tints.push({ hex: e.hex, name: e.to, mol: ext }); }
      if (e.type === 'coat') { const s = isSolid(id) ? A : B; s.coat = e.color; }
    }
    out.push({ kind: 'reaction', r, a: id, b: y, extent: ext, made, used: { [id]: (ca || 0) * ext, [y]: (cb || 0) * ext }, out: A.mol <= EPS ? id : B.mol <= EPS ? y : null, slow: isSolid(id) || isSolid(y) });
  }
  if (depth < 2) for (const pid of new Set(fresh)) if (t.items[pid].mol > EPS) out.push(...react(t, pid, depth + 1).filter((e) => e.kind === 'reaction')); // sản phẩm tan gặp chất còn dư trong ống
  if (!out.length && quiet) out.push(quiet);
  return out;
}

// pH ước lượng: acid mạnh và base mạnh tính theo lượng dư; chất yếu lấy pH ghi trong kho, pha loãng 10 lần lệch nửa đơn vị.
export function pH(t) {
  if (t.vol <= 0) return 7; const V = t.vol / 1000; let h = 0, oh = 0;
  for (const [id, n] of Object.entries(STRONG_H)) h += (t.items[id]?.mol || 0) * n;
  for (const [id, n] of Object.entries(STRONG_OH)) oh += (t.items[id]?.mol || 0) * n;
  if (h - oh > 1e-9) return clamp(-Math.log10((h - oh) / V), 0, 7);
  if (oh - h > 1e-9) return clamp(14 + Math.log10((oh - h) / V), 7, 14);
  let hi = 7, lo = 7;
  for (const it of Object.values(t.items)) { const c = BY_ID[it.id]; if (it.mol <= 1e-9 || typeof c.ph !== 'number' || !c.conc || STRONG_H[it.id] || STRONG_OH[it.id]) continue;
    const dil = Math.log10(Math.max(c.conc / (it.mol / V), 1)); if (c.ph > 7.5) hi = Math.max(hi, c.ph - 0.5 * dil); if (c.ph < 6.5) lo = Math.min(lo, c.ph + 0.5 * dil); }
  return hi > 7.5 ? hi : lo;
}
export function indicatorLook(t) {
  if (!t.indicator || t.vol <= 0) return null; const p = pH(t); let [color, hex] = INDICATOR[t.indicator](p);
  if (t.indicator === 'pp' && p > 8.2 && p < 9) [color, hex] = ['hồng rất nhạt', '#f3b6d6'];
  return { color, hex, pH: p, changed: !color.includes('không đổi') };
}

// Màu và độ đục của phần dung dịch.
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function look(t) {
  const V = Math.max(t.vol, 1e-6) / 1000; let c = rgb(CLEAR), op = 0.3; // dung dịch không màu để thật trong, cho lớp kết tủa bên dưới giữ đúng màu
  const blend = (hex, k) => { const d = rgb(hex); c = c.map((v, i) => v + (d[i] - v) * k); op = Math.max(op, 0.45 + 0.42 * k); };
  for (const it of Object.values(t.items)) { const ch = BY_ID[it.id]; if (ch.hex && ch.conc && it.mol > 1e-9) blend(ch.hex, clamp(Math.pow(it.mol / V / (ch.conc * 0.7), 0.65), 0, 1)); }
  for (const tn of t.tints) blend(tn.hex, clamp(Math.pow(tn.mol / V / 0.004, 0.6), 0, 1));
  const ind = indicatorLook(t); if (ind && ind.hex && (ind.changed || t.indicator === 'quy')) blend(ind.hex, ind.color === 'hồng rất nhạt' ? 0.35 : t.indicator === 'quy' && !ind.changed ? 0.3 : 0.8);
  return { hex: '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''), opacity: op };
}
export const pptTotal = (t) => t.ppt.reduce((s, p) => s + p.mol, 0);

// Danh sách hiển thị "Trong ống": những gì người dùng đã cho vào, kèm tình trạng còn hay hết.
export function contents(t) {
  const fm = (x, d = 1) => x.toFixed(d).replace('.', ',');
  return t.order.filter((id) => t.items[id].mL > 0 || t.items[id].pieces > 0).map((id) => { const it = t.items[id], c = BY_ID[id];
    const amount = it.pieces ? `${it.pieces} ${(PIECE[id] || PIECE_DEF).unit}` : it.drops && Math.abs(it.drops * DROP_ML - it.mL) < 1e-6 ? `${it.drops} giọt · ${fm(it.mL, 2)} mL` : `${fm(it.mL, it.drops ? 2 : 1)} mL`;
    const status = !isReagent(id) ? '' : it.mol <= 1e-9 ? 'đã hết' : it.mol < it.mol0 - 1e-9 ? `còn ${fm(it.mol * 1000, 2)} mmol` : '';
    return { id, label: label(id), conc: c.conc && id !== 'H2O' ? (id === 'H2O2' ? '3%' : `${String(c.conc).replace('.', ',')} M`) : '', hex: c.hex || (isSolid(id) ? '#9aa3ab' : '#ffffff'), amount, status, mL: it.mL }; });
}

// ---------- các phép thử và tác động lên ống ----------
// Giấy quỳ: lấy đũa thuỷ tinh chấm dung dịch lên giấy. Đổi màu theo pH ước lượng của dung dịch trong ống.
export function litmus(t) { if (t.vol <= 0) return null; const p = pH(t), [color, hex] = INDICATOR.quy(p); return { color, hex, pH: p, changed: !color.includes('không đổi') }; }
// Que đóm đang cháy đưa lại miệng ống: kết quả tuỳ khí đang thoát ra.
export const SPLINT = {
  H2: { act: 'pop', seen: 'Có tiếng nổ nhẹ "pốp" ở miệng ống', why: 'Hydrogen lẫn không khí cháy rất nhanh khi gặp lửa. Đây là cách nhận biết khí hydrogen.' },
  O2: { act: 'flare', seen: 'Que đóm cháy bùng sáng hơn', why: 'Oxygen duy trì sự cháy và làm ngọn lửa mạnh lên. Đây là cách nhận biết khí oxygen.' },
  CO2: { act: 'out', seen: 'Que đóm tắt ngay', why: 'Carbon dioxide không duy trì sự cháy và nặng hơn không khí nên đọng ở miệng ống.' },
  NH3: { act: 'out', seen: 'Que đóm tắt', why: 'Ammonia ở điều kiện này không duy trì sự cháy. Nhận biết ammonia bằng mùi khai và giấy quỳ ẩm hoá xanh.' },
  NO: { act: 'out', seen: 'Que đóm tắt', why: 'Nitrogen monoxide không duy trì sự cháy của que đóm.' },
};
// Đun nóng ống nghiệm trên đèn cồn. Chỉ có hai trường hợp viết tay, đều là thí nghiệm phổ thông quen thuộc; còn lại: không có phản ứng mới.
export function heat(t) {
  const out = [];
  const cu = t.ppt.find((p) => p.f === 'Cu(OH)2' && p.mol > EPS);
  if (cu) { const mol = cu.mol, eq = equation(['Cu(OH)2'], ['CuO', 'H2O']); t.ppt = t.ppt.filter((p) => p !== cu); const old = t.ppt.find((p) => p.f === 'CuO'); if (old) old.mol += mol; else t.ppt.push({ f: 'CuO', mol, color: 'đen', form: 'mịn' });
    out.push({ kind: 'reaction', heat: true, title: 'Đun nóng Cu(OH)₂', extent: mol, made: [{ f: 'CuO', mol, mark: '↓' }], r: { eq, equation: eq.text + '  (đun nóng)', effects: [{ type: 'ppt', f: 'CuO', color: 'đen', form: 'mịn', text: 'Kết tủa xanh lam chuyển dần thành chất rắn màu đen (CuO)' }], reason: 'Copper(II) hydroxide không bền với nhiệt: khi đun nóng bị phân huỷ thành copper(II) oxide màu đen và nước.', notes: [] } }); }
  for (const [sid, carb] of [['CaCl2', 'CaCO3'], ['BaCl2', 'BaCO3']]) { const a = t.items.NaHCO3, b = t.items[sid]; if (!a || !b || a.mol <= EPS || b.mol <= EPS) continue;
    const ext = Math.min(a.mol / 2, b.mol), eq = equation(['NaHCO3', BY_ID[sid].f], [carb, 'NaCl', 'CO2', 'H2O'], { [carb]: '↓', CO2: '↑' }); a.mol -= 2 * ext; b.mol -= ext;
    const nacl = item(t, 'NaCl'); nacl.mol += 2 * ext; t.ppt.push({ f: carb, mol: ext, color: 'trắng', form: 'mịn' }); t.gasTotal += ext; t.lastGas = 'CO2';
    out.push({ kind: 'reaction', heat: true, title: `Đun nóng ${pretty(BY_ID[sid].f)} + NaHCO₃`, extent: ext, made: [{ f: carb, mol: ext, mark: '↓' }, { f: 'CO2', mol: ext, mark: '↑' }], r: { eq, equation: eq.text + '  (đun nóng)', effects: [{ type: 'ppt', f: carb, color: 'trắng', form: 'mịn', text: `Xuất hiện kết tủa trắng (${pretty(carb)})` }, { type: 'gas', f: 'CO2', name: 'carbon dioxide', rate: 'vừa', text: 'Sủi bọt khí không màu (carbon dioxide)' }], reason: 'Ở nhiệt độ thường hai chất này không phản ứng. Khi đun nóng, ion HCO₃⁻ bị phân huỷ thành CO₃²⁻, CO₂ và nước; CO₃²⁻ gặp ion kim loại tạo kết tủa.', notes: [] } }); }
  return out;
}
