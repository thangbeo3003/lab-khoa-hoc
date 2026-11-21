// Sổ sách của một ống nghiệm: trong ống có chất gì, bao nhiêu mol, chất nào hết, chất nào dư,
// kết tủa nào đã tạo, dung dịch màu gì, chất chỉ thị đang ở màu nào. Không có hình: chạy được bằng node để kiểm thử.
// Quy ước: hai chất gặp nhau thì phản ứng xong ngay (coi như đã lắc đều).
// Từ 21/11 (việc S1, S2, S3 của L2 · Logic):
//   S1  kết tủa đã tạo phản ứng tiếp với acid và kiềm dư, theo predictPpt của máy (chỉ những cặp có nguồn);
//   S2  nước cất trong ống là chất phản ứng của chất rắn (Na, CaO); nước coi như luôn dư;
//   S3  sản phẩm tan không có trong tủ (ZnCl₂, FeCl₂…) vẫn nằm trong sổ như một chất "phát sinh" (BY_ID[id].derived) và phản ứng tiếp.
// Sự kiện phản ứng: made liệt kê chất sinh ra; một dòng made có mol ÂM nghĩa là chất do phản ứng trước sinh ra nay bị tiêu hao bấy nhiêu
// (kết tủa tan, sản phẩm tan phản ứng tiếp). Cộng dồn made theo công thức luôn ra đúng lượng sản phẩm đang còn, không bao giờ âm.
import { predict, predictPpt, soluteId, pptId, BY_ID } from '../chem/engine.js';
import { INDICATOR, CAOH2_SAT_G_L } from '../chem/data.js';
import { molarMass, pretty, equation } from '../chem/formula.js';

export const DROP_ML = 0.05, MAX_ML = 12, CLEAR = '#dcecf5'; // MAX_ML: sức chứa mặc định (ống nghiệm). Mỗi bình mang sức chứa riêng t.cap (cốc 100 mL: 100)
export const PIECE = { Zn: { g: 0.3, unit: 'hạt kẽm' }, CaCO3: { g: 0.25, unit: 'mẩu đá vôi' }, Mg: { g: 0.05, unit: 'đoạn dây magnesium' }, Fe: { g: 0.5, unit: 'đinh sắt' }, Cu: { g: 0.3, unit: 'đoạn dây đồng' }, Al: { g: 0.1, unit: 'mảnh nhôm' } };
const PIECE_DEF = { g: 0.2, unit: 'mẩu' };
const STRONG_H = { HCl: 1, H2SO4: 2, HNO3: 1 }, STRONG_OH = { NaOH: 1, CaOH2: 2 };
const LIME_SAT = CAOH2_SAT_G_L / molarMass('Ca(OH)2'); // độ tan của Ca(OH)₂, mol/L
const EPS = 1e-10, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const isSolid = (id) => ['metal', 'solid'].includes(BY_ID[id].group);
const isReagent = (id) => BY_ID[id].group !== 'indicator' && id !== 'H2O';
export const label = (id) => (BY_ID[id].group === 'indicator' ? BY_ID[id].name : pretty(BY_ID[id].f));

export function newTube(cap = MAX_ML) { return { cap, items: {}, order: [], vol: 0, ppt: [], tints: [], indicator: null, indShown: null, gasTotal: 0, lastGas: null }; }
function item(t, id) { if (!t.items[id]) { t.items[id] = { id, mol: 0, mol0: 0, mL: 0, drops: 0, pieces: 0, coat: null }; t.order.push(id); } return t.items[id]; }
// Trừ bớt một chất. Trả về phần "do phản ứng sinh ra" (byRx) vừa mất: phần người dùng tự cho vào coi như mất trước.
function take(it, mol) { const left = Math.max(0, it.mol - mol), lost = Math.max(0, (it.byRx || 0) - left); it.mol = left; if (lost > 0) it.byRx -= lost; return lost; }

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
  else if (id === 'H2O') events.push(...wet(t));
  events.push(...settle(t)); limeEq(t);
  if (['acid', 'base'].includes(c.group) && !events.some((e) => e.kind === 'reaction')) { const q = pptQuiet(t, id, events.length > 0); if (q) events.push(q); }
  const ind = indicatorLook(t);
  if (ind && ind.color !== t.indShown) { events.push({ kind: 'indicator', id: t.indicator, from: t.indShown, to: ind.color, changed: ind.changed, pH: ind.pH, first: t.indShown === null }); t.indShown = ind.color; }
  return { events };
}

// Ghi sản phẩm của một phản ứng vào sổ, trả về danh sách made. skip: hai chất tham gia (không tính là "mới sinh"). solid: chất rắn tham gia (để ghi lớp kim loại bám).
function land(t, r, ext, skip, fresh, solid) {
  const made = [], carriers = []; let loose = false; // carriers: sản phẩm tan có màu đang được sổ theo dõi; loose: có sản phẩm tan mà sổ không theo dõi (I₂, phức chất…)
  for (const p of r.eq.rhs) {
    const mol = p.coef * ext, pid = soluteId(p.f); made.push({ f: p.f, mol, mark: p.mark });
    if (p.mark === '↓') { const fx = r.effects.find((e) => e.type === 'ppt' && e.f === p.f) || {}, old = t.ppt.find((q) => q.f === p.f); if (old) old.mol += mol; else t.ppt.push({ f: p.f, mol, color: fx.color || 'trắng', form: fx.form || '' }); }
    else if (p.mark === '↑') { t.gasTotal += mol; t.lastGas = p.f; }
    else if (pid) { const pi = item(t, pid); pi.mol += mol; pi.byRx = (pi.byRx || 0) + mol; if (!skip.includes(pid)) fresh.push(pid); if (BY_ID[pid].hex) carriers.push(pid); }
    else if (p.f !== 'H2O' && !(pptId(p.f) && isSolid(pptId(p.f)))) loose = true;
  }
  for (const e of r.effects) {
    // Màu mới của dung dịch: nếu do một sản phẩm tan đang được theo dõi mang (Cu²⁺, Fe²⁺, Fe³⁺) thì để chính chất đó giữ màu, hết chất là hết màu.
    // Chỉ khi không quy được cho chất nào (I₂, phức Fe(SCN)₃…) mới ghi thành lớp màu cố định như trước.
    if (e.type === 'color' && e.hex) { if (carriers.length && !loose) { for (const pid of carriers) if (BY_ID[pid].derived) t.items[pid].hex = e.hex; } else { const old = t.tints.find((q) => q.hex === e.hex); if (old) old.mol += ext; else t.tints.push({ hex: e.hex, name: e.to, mol: ext }); } }
    if (e.type === 'coat' && solid) solid.coat = e.color;
  }
  return made;
}

// Hai chất trong sổ gặp nhau: tính lượng phản ứng, cập nhật sổ. Trả về { event } nếu có phản ứng, { quiet } nếu máy trả "không phản ứng" hoặc "chưa có dữ liệu".
function pair(t, id, y, fresh) {
  const A = t.items[id], B = t.items[y], water = y === 'H2O', V = Math.max(t.vol, 1e-6) / 1000;
  const eqVol = (cid, x) => (BY_ID[cid].conc ? x.mol / BY_ID[cid].conc : 1);
  const opts = BY_ID[id].derived || BY_ID[y].derived ? { conc: { [id]: A.mol / V, [y]: B.mol / V } } : { volA: eqVol(id, A), volB: eqVol(y, B) }; // chất phát sinh không có nồng độ trên nhãn: đưa nồng độ thật trong ống
  const r = predict(id, y, opts);
  if (r.kind !== 'reaction' || !r.eq) return { quiet: { kind: r.kind, r, a: id, b: y } };
  const co = (cid) => r.eq.lhs.find((x) => x.f === BY_ID[cid].f)?.coef;
  const ca = co(id), cb = water ? 0 : co(y), ext = Math.min(ca ? A.mol / ca : Infinity, cb ? B.mol / cb : Infinity); // nước cất là dung môi, coi như luôn dư
  if (!isFinite(ext) || ext <= EPS) return {};
  const lostA = ca ? take(A, ca * ext) : 0, lostB = cb ? take(B, cb * ext) : 0;
  const made = land(t, r, ext, [id, y], fresh, isSolid(id) ? A : isSolid(y) ? B : null);
  if (lostA > EPS) made.push({ f: BY_ID[id].f, mol: -lostA, mark: '' }); if (lostB > EPS) made.push({ f: BY_ID[y].f, mol: -lostB, mark: '' });
  const e = { kind: 'reaction', r, a: id, b: y, extent: ext, made, used: { [id]: (ca || 0) * ext, [y]: (cb || 0) * ext }, out: A.mol <= EPS ? id : !water && B.mol <= EPS ? y : null, slow: isSolid(id) || isSolid(y) };
  if (id === 'CaO' && water) limeCap(t, e);
  return { event: e };
}
// CaO + nước: Ca(OH)₂ sinh ra chỉ tan tới mức bão hoà (LIME_SAT); phần vượt nằm lại ở đáy thành vôi tôi (đánh dấu lime).
function limeCap(t, e) {
  const it = t.items.CaOH2, m = e.made.find((x) => x.f === 'Ca(OH)2' && !x.mark && x.mol > 0); if (!it || !m) return;
  const moved = Math.min(m.mol, it.mol - (LIME_SAT * t.vol) / 1000); if (moved <= EPS) return;
  it.mol -= moved; it.byRx = Math.max(0, (it.byRx || 0) - moved); m.mol -= moved;
  const old = t.ppt.find((q) => q.f === 'Ca(OH)2'); if (old) { old.mol += moved; old.lime = true; } else t.ppt.push({ f: 'Ca(OH)2', mol: moved, color: 'trắng', form: 'mịn', lime: true });
  e.made.unshift({ f: 'Ca(OH)2', mol: moved, mark: '↓' }); if (m.mol <= EPS) e.made.splice(e.made.indexOf(m), 1);
}

// Thứ tự khi một chất gặp nhiều chất trong ống: trung hoà acid, base → các chất tan khác (phản ứng ion trong dung dịch) → kết tủa mịn đang có
// → chất rắn dạng mẩu (kim loại, đá vôi: phản ứng trên bề mặt, chậm hơn) → nước cất.// Vôi tôi còn ở đáy thì dung dịch phía trên là nước vôi bão hoà: sau mỗi lần thêm chất (acid lấy bớt OH⁻, rót thêm nước), vôi tôi tan bù cho đủ mức bão hoà.
// Ước lượng: không tính ảnh hưởng của ion Ca²⁺ có sẵn; khi ống còn NaOH thì không bù.
function limeEq(t) {
  const p = t.ppt.find((q) => q.f === 'Ca(OH)2' && q.lime && q.mol > EPS); if (!p || (t.items.NaOH && t.items.NaOH.mol > EPS)) return;
  const it = item(t, 'CaOH2'), moved = Math.min(p.mol, (LIME_SAT * t.vol) / 1000 - it.mol); if (moved <= EPS) return;
  p.mol -= moved; it.mol += moved; it.byRx = (it.byRx || 0) + moved;
}

function react(t, id, depth) {
  const out = [], cx = BY_ID[id], fresh = []; let quiet = null;
  const others = t.order.filter((y) => y !== id && isReagent(y) && t.items[y].mol > EPS);
  const first = (y) => ((cx.group === 'acid' && BY_ID[y].group === 'base') || (cx.group === 'base' && BY_ID[y].group === 'acid') ? 0 : 1); // trung hoà xảy ra trước
  others.sort((a, b) => first(a) - first(b));
  const go = (y) => { if (t.items[id].mol <= EPS) return; const B = t.items[y], res = pair(t, id, y, fresh); if (res.event) out.push(res.event); else if (res.quiet && (B.mL > 0 || B.pieces > 0)) quiet = quiet || res.quiet; };
  for (const y of others) if (!isSolid(y)) go(y);
  if (!isSolid(id) && t.items[id].mol > EPS) out.push(...pptPhase(t, fresh, id));
  for (const y of others) if (isSolid(y)) go(y);
  if (isSolid(id) && t.items.H2O && t.items.H2O.mL > 0) go('H2O');
  if (depth < 2) for (const pid of new Set(fresh)) if (t.items[pid].mol > EPS) out.push(...react(t, pid, depth + 1).filter((e) => e.kind === 'reaction')); // sản phẩm tan gặp chất còn dư trong ống
  if (!out.length && quiet) out.push(quiet);
  return out;
}
// Rót nước cất vào ống đang có chất rắn (Na, CaO): chỉ ghi khi có phản ứng, không báo "không phản ứng" mỗi lần pha loãng.
function wet(t) {
  const out = [], fresh = [];
  for (const y of [...t.order]) { if (!isSolid(y) || t.items[y].mol <= EPS) continue; const res = pair(t, y, 'H2O', fresh); if (res.event) out.push(res.event); }
  for (const pid of new Set(fresh)) if (t.items[pid].mol > EPS) out.push(...react(t, pid, 1).filter((e) => e.kind === 'reaction'));
  return out;
}
// Kết tủa đang có trong ống gặp các chất tan còn lại (acid dư, kiềm dư). Sự kiện: a = chất tan, b = mã của kết tủa.
function pptPhase(t, fresh, only) {
  const out = [];
  for (const p of t.ppt) for (const y of only ? [only] : [...t.order]) {
    if (p.mol <= EPS) break; const B = t.items[y]; if (!isReagent(y) || isSolid(y) || B.mol <= EPS) continue;
    const r = predictPpt(p.f, y); if (!r || r.kind !== 'reaction' || !r.eq) continue;
    const cp = r.eq.lhs.find((x) => x.f === p.f)?.coef, cb = r.eq.lhs.find((x) => x.f === BY_ID[y].f)?.coef; if (!cp) continue;
    const ext = Math.min(p.mol / cp, cb ? B.mol / cb : Infinity); if (!isFinite(ext) || ext <= EPS) continue;
    p.mol = Math.max(0, p.mol - cp * ext); const lostB = cb ? take(B, cb * ext) : 0, made = land(t, r, ext, [y], fresh, null);
    made.push({ f: p.f, mol: -cp * ext, mark: '↓' }); if (lostB > EPS) made.push({ f: BY_ID[y].f, mol: -lostB, mark: '' });
    out.push({ kind: 'reaction', ppt: true, r, a: y, b: pptId(p.f), extent: ext, made, used: { [y]: (cb || 0) * ext, [pptId(p.f)]: cp * ext }, out: p.mol <= EPS ? pptId(p.f) : B.mol <= EPS ? y : null, slow: false });
  }
  return out;
}
function settle(t) {
  const out = [];
  for (let round = 0; round < 3; round++) { const fresh = [], ev = pptPhase(t, fresh); if (!ev.length) break; out.push(...ev);
    for (const pid of new Set(fresh)) if (t.items[pid].mol > EPS) out.push(...react(t, pid, 1).filter((e) => e.kind === 'reaction')); }
  return out;
}
// Vừa thêm acid hoặc base mà không có phản ứng nào: nếu trong ống có kết tủa thì nói rõ kết tủa đó không tan (có nguồn) hoặc app chưa có dữ liệu.
function pptQuiet(t, id, hasOther) {
  let unknown = null;
  for (const p of t.ppt) { if (p.mol <= EPS) continue; const r = predictPpt(p.f, id); if (!r || r.kind === 'reaction') continue; const q = { kind: r.kind, r, a: id, b: pptId(p.f) }; if (r.kind === 'none') return q; unknown = unknown || q; }
  return hasOther ? null : unknown;
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
  for (const it of Object.values(t.items)) { const ch = BY_ID[it.id], hex = it.hex || ch.hex, ref = ch.conc || ch.ref; if (hex && ref && it.mol > 1e-9) blend(hex, clamp(Math.pow(it.mol / V / (ref * 0.7), 0.65), 0, 1)); } // chất phát sinh có màu (CuCl₂, FeCl₂…): mốc đậm nhạt ref lấy theo muối cùng cation trong tủ
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
