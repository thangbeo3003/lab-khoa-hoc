// Phòng thực hành tự do: nối giao diện, sổ sách ống nghiệm (tubechem) và cảnh 3D (bench).
// Bố cục chốt 18/11 đêm: thanh thao tác trên bàn (bước hiện tại · chất đang chọn · lượng), bàn lab là khung to không có chữ đè,
// dải kết quả dưới bàn, tủ hoá chất cố định bên trái trên màn rộng hoặc thành khay trên màn hẹp, khay Dụng cụ, sổ thu gọn.
// Luồng chính: chọn chất → chỉnh lượng → chạm ống → thấy phản hồi ngay trên ống. Rót xong vẫn giữ chất đã chọn để thử ống khác.
import { newTube, add, beginPour, endPour, look, contents, label, isSolid, pptTotal, DROP_ML, MAX_ML, PIECE, litmus, heat, SPLINT } from './tubechem.js';
import { BY_ID, CHEMS } from '../chem/data.js';
import { pretty } from '../chem/formula.js';
import { mountProcess3D } from './process3d.js';
import { buildModel, population, entering } from './ionmodel.js';
import { mountLens } from './lens3d.js';
const { createFreeBench, PPT_HEX } = await import(document.documentElement.dataset.bench === '2d' ? '../flat/bench2d.js' : './bench.js'); // cùng một phần điều khiển cho bàn 2D và bàn 3D

// Tủ hoá chất: cả kho trừ giấy quỳ (giấy quỳ là một dụng cụ thử trong khay Dụng cụ).
const CAB = CHEMS.filter((c) => c.id !== 'quy').map((c) => c.id);
const GROUPS = [['all', 'Tất cả'], ['acid', 'Acid'], ['base', 'Base'], ['salt', 'Muối'], ['metal', 'Kim loại'], ['solid', 'Chất rắn'], ['other', 'Khác'], ['indicator', 'Chỉ thị']];
// Tên cũ (trước chương trình 2018), hiện nhỏ cạnh tên mới để người quen tên cũ vẫn tìm được.
const OLD = { HCl: 'axit clohiđric', H2SO4: 'axit sunfuric loãng', HNO3: 'axit nitric loãng', CH3COOH: 'axit axetic', NaOH: 'natri hiđroxit', CaOH2: 'canxi hiđroxit', NH3: 'amoniac', NaCl: 'natri clorua', Na2CO3: 'natri cacbonat', NaHCO3: 'natri hiđrocacbonat', Na2SO4: 'natri sunfat', BaCl2: 'bari clorua', CaCl2: 'canxi clorua', AgNO3: 'bạc nitrat', CuSO4: 'đồng(II) sunfat', FeCl3: 'sắt(III) clorua', FeSO4: 'sắt(II) sunfat', AlCl3: 'nhôm clorua', ZnSO4: 'kẽm sunfat', MgCl2: 'magie clorua', KI: 'kali iotua', PbNO32: 'chì(II) nitrat', NH4Cl: 'amoni clorua', KMnO4: 'kali pemanganat', KSCN: 'kali thioxianat', Na: 'natri', Mg: 'magie', Al: 'nhôm', Zn: 'kẽm', Fe: 'sắt', Cu: 'đồng', Ag: 'bạc', CaCO3: 'canxi cacbonat', CuO: 'đồng(II) oxit', MnO2: 'mangan đioxit', CaO: 'canxi oxit', H2O: 'nước cất', H2O2: 'hiđro peoxit (oxi già)', pp: 'phenolphtalein' };
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k === 'style') n.style.cssText = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); } n.append(...kids.flat().filter((x) => x != null && x !== false)); return n; };
const put = (host, ...kids) => host.replaceChildren(...kids.flat().filter((x) => x != null && x !== false));
const fm = (x, d = 1) => x.toFixed(d).replace('.', ',');
const num = (v) => parseFloat(String(v).replace(',', '.'));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const low = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const shortName = (id) => BY_ID[id].name.replace(/\s+\([^)]*\)$/, '');
const concText = (id) => { const c = BY_ID[id]; return id === 'H2O' ? 'nước cất' : id === 'H2O2' ? '3%' : c.conc ? `${String(c.conc).replace('.', ',')} M` : isSolid(id) ? 'chất rắn' : 'chỉ thị'; };
const chemName = (id) => `${label(id)}${BY_ID[id].conc && id !== 'H2O' ? ' ' + concText(id) : ''}`;
const listLabel = (id) => (id === 'pp' ? 'PP' : label(id));
const pieceUnit = (id) => (PIECE[id] || { unit: 'mẩu' }).unit;
// Lượng chất (mmol) của MỘT mẩu chất rắn: hỏi thẳng sổ ống (thả thử một mẩu vào ống trống) để khung hạt luôn dùng đúng số của tubechem.js, kể cả chất không có trong PIECE (Na, CaO, CuO, MnO₂… = 0,2 g). Trước 21/11 chỗ này tự lấy 0,3 g nên lệch với sổ.
const PIECE_MMOL = {}, pieceMmol = (id) => PIECE_MMOL[id] ?? (PIECE_MMOL[id] = (() => { const t = newTube(); add(t, id, { piece: true }); return (t.items[id] ? t.items[id].mol0 : 0) * 1000; })());
const GAS_RATE = { 'rất mạnh': 1, 'mạnh': 0.85, 'vừa': 0.6, 'chậm': 0.32, 'nhẹ': 0.3, 'chậm dần rồi dừng': 0.4 };
const FORM_PUFF = { 'keo': 1.7, 'bông': 1.5, 'vón cục': 1.1 };
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* không lưu được thì thôi */ } } };

const bench = createFreeBench($('stage'), { nameOf: chemName, theme: document.documentElement.dataset.ui === 'ds' ? { tagOn: '#eeecff', tagOnInk: '#4d3fdc', tagOnLine: '#6254f4', accent: '98,84,244', chip: 'rgba(98,84,244,0.96)' } : {} });
// Bình trên bàn (đợt 1, 19/11): 5 ống A–E trong giá (luôn có) + cốc thuỷ tinh 100 mL lấy từ tủ Dụng cụ. Mỗi bình có tên và sức chứa riêng (bench.tubes[i].cap).
const TUBES = bench.tubes.map((t) => t.i), LET = 'ABCDE';
bench.tubes.forEach((t, i) => { t.name ??= `Ống ${LET[i]}`; t.cap ??= MAX_ML; t.on ??= true; t.kind ??= 'tube'; }); // bàn 3D cũ (bench.js) chỉ có 5 ống, không mang các trường này
const Tn = (i) => bench.tubes[i].name, tn = (i) => low(bench.tubes[i].name), capOf = (i) => S.tubes[i].cap;
const isOn = (i) => bench.tubes[i].on, onBench = () => TUBES.filter(isOn), isCup = (i) => bench.tubes[i].kind !== 'tube'; // "cốc" ở đây = mọi bình ngoài giá: cốc, bình tam giác, bình cầu, ống đong
const fresh = (i) => newTube(bench.tubes[i].cap);
const S = { tube: 0, chem: null, unit: 'mL', amount: { mL: 2, giot: 5, piece: 1 }, tubes: TUBES.map(fresh), last: TUBES.map(() => null), sum: TUBES.map(() => ({})), prod: TUBES.map(() => ({})), note: TUBES.map(() => null), gasUntil: TUBES.map(() => 0), log: [], curve: TUBES.map(() => []),
  running: false, runId: null, queue: [], lastAdd: null, q: '', group: 'all', drawer: null, dock: true, book: false, sound: store.get('lab_free_sound', '1') === '1' };

const DS = document.documentElement.dataset.ui === 'ds'; let UI = null; // trang theo design system: phần vỏ quanh sân khấu do ui_ds.js dựng, các hàm render cũ bên dưới nhường chỗ

// ---------- âm thanh: chỉ dùng tiếng có cao độ (sóng sin), không tiếng nhiễu, không whoosh ----------
const sfx = (() => {
  let ctx = null; const ac = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  const blip = (f0, f1, dur, gain, at = 0) => { if (!S.sound) return; try { const c = ac(), t = c.currentTime + at, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02); } catch (e) { /* trình duyệt chưa cho phát tiếng */ } };
  return {
    drop: () => blip(1150, 520, 0.09, 0.11),
    trickle: () => { for (let k = 0; k < 4; k++) blip(620 + Math.random() * 520, 420 + Math.random() * 200, 0.05, 0.035, k * 0.025); },
    plop: () => blip(300, 130, 0.14, 0.13),
    fizz: (intensity, dur) => { const n = Math.round(Math.min(dur, 4) * 14 * intensity); for (let k = 0; k < n; k++) blip(1900 + Math.random() * 1500, 2600 + Math.random() * 900, 0.022, 0.014, Math.random() * Math.min(dur, 4)); },
    ding: () => { blip(1318.5, 1318.5, 0.9, 0.09); blip(1975.5, 1975.5, 0.7, 0.045, 0.01); },
  };
})();

// ---------- đưa kết quả hoá học lên hình ----------
function layerH(t) { const mmol = pptTotal(t) * 1000; if (mmol <= 0) return 0; const puff = Math.max(...t.ppt.map((p) => FORM_PUFF[p.form] || 0.8)); return Math.min(0.3, 0.012 + 0.07 * Math.sqrt(mmol) * puff); }
function sync(ti, events = []) {
  const t = S.tubes[ti], V = bench.tubes[ti], L = look(t), slow = events.some((e) => e.slow);
  V.setLook({ mL: t.vol, hex: L.hex, opacity: L.opacity }, slow);
  for (const e of events) { if (e.kind !== 'reaction') continue;
    for (const m of e.made) { if (m.mark === '↓') { const p = t.ppt.find((q) => q.f === m.f);
        // số mol âm = kết tủa tan (21/11, U2): chỉ hạ lớp đáy về mức còn lại, không rắc hạt rơi; màu lớp đáy theo kết tủa còn nhiều nhất. Bàn cũ không có dissolve() thì giữ cách cũ.
        if (m.mol < 0 && V.dissolve) { const left = t.ppt.filter((q) => q.mol > 1e-9).sort((a, b) => b.mol - a.mol)[0]; V.dissolve(layerH(t), left ? PPT_HEX[left.color] ?? 0xeef1f4 : null); }
        else V.precipitate(PPT_HEX[p.color] ?? 0xeef1f4, p.form, m.mol * 1000, layerH(t), e.slow); }
      if (m.mark === '↑') { const g = e.r.effects.find((x) => x.type === 'gas'), mmol = m.mol * 1000, rate = GAS_RATE[g?.rate] ?? 0.6, dur = e.slow ? Math.min(22, 9 + mmol * 10) : Math.min(5, 1.6 + mmol * 3); V.gas(rate, dur); sfx.fizz(rate, dur); S.gasUntil[ti] = performance.now() + dur * 1000; } } }
  for (const it of Object.values(t.items)) if (isSolid(it.id) && it.mol0 > 0) V.setSolid(it.id, it.mol / it.mol0, it.coat);
}
function toast(text) { const n = $('toast'); n.textContent = text; n.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => n.classList.remove('on'), 2600); }
const indSay = (e) => { const n = BY_ID[e.id].name; return e.changed ? `${n} chuyển sang ${e.to}` : e.from && !e.from.includes('không') ? `${n} mất màu ${e.from}, trở lại không màu` : `${n} không đổi màu`; };

// Nhãn dưới chân ống: tên ống và lượng đang có. Phản hồi "thấy gì" hiện 3 giây ngay trên miệng ống vừa làm.
function tubeTag(i) { const t = S.tubes[i]; bench.setTubeTag(i, `${Tn(i)}${t.vol > 0.001 ? `\n${fm(t.vol, t.vol < 1 ? 2 : 1)} mL` : ''}`); }
function flash(i, text, calm = false) { bench.setFlash(i, text, calm); clearTimeout(flash.t); flash.t = setTimeout(() => bench.setFlash(i, ''), 3000); }
function seenShort(events) {
  const rx = events.filter((e) => e.kind === 'reaction'), ind = events.find((e) => e.kind === 'indicator'), out = [], solid = [];
  // Hiệu ứng "tan" của máy (21/11, U1): sự kiện có e.ppt = kết tủa gặp chất tan → nói "kết tủa tan dần" trước tiên, màu đi kèm là màu của dung dịch. Chất rắn khác tan (vôi sống, kim loại…) chỉ nêu khi không còn dấu hiệu nào khác, để không ra "không thấy bằng mắt".
  for (const e of rx) { const tan = !!e.ppt && e.r.effects.some((f) => f.type === 'dissolve');
    for (const f of e.r.effects) { if (f.type === 'ppt') out.push(`kết tủa ${f.color}`); else if (f.type === 'gas') out.push(/mạnh/.test(f.rate || '') ? `sủi khí ${f.rate}` : 'sủi khí'); else if (f.type === 'color') out.push(tan ? `dung dịch ${f.to}` : `chuyển ${f.to}`); else if (f.type === 'coat') out.push('kim loại bám vào'); else if (f.type === 'dissolve') { if (tan) out.unshift('kết tủa tan dần'); else if (f.text) solid.push(low(f.text)); } } }
  if (!out.length) out.push(...solid);
  if (ind) out.push(ind.changed ? `hoá ${ind.to}` : ind.from && !ind.from.includes('không') ? 'mất màu' : 'chỉ thị không đổi màu');
  if (out.length) return [...new Set(out)].join(', ');
  if (rx.length) return 'có phản ứng, không thấy bằng mắt';
  return events[0] ? (events[0].r?.observation || (events[0].kind === 'none' ? 'không có hiện tượng' : 'app chưa có dữ liệu')) : '';
}

// Thêm chất vào ống ti: cập nhật sổ sách, hình, nhãn, sổ thí nghiệm.
function apply(ti, id, amt, how) {
  const t = S.tubes[ti], res = add(t, id, amt);
  if (res.full) { toast(`${Tn(ti)} đã đầy (chứa tối đa ${capOf(ti)} mL). Đổ bỏ hoặc chọn bình khác.`); return false; }
  return absorb(ti, id, amt, how, res);
}
// Nhận sự kiện sổ trả về (của một phần rót, hoặc của endPour khi đóng lần rót: amt = { close: true }) và cập nhật hình, nhãn, dải kết quả, sổ, vòng kính, đồ thị.
function absorb(ti, id, amt, how, res) {
  sync(ti, res.events);
  let fresh = false;
  for (const e of res.events) if (e.kind === 'reaction' && e.r.equation) { if (!S.sum[ti][e.r.equation]) fresh = true; S.sum[ti][e.r.equation] = (S.sum[ti][e.r.equation] || 0) + e.extent; addMade(ti, e); } // cộng dồn theo từng phương trình
  curvePoint(ti);
  // Gom theo lần bấm: acc = mọi sự kiện của cả lần thêm này (một phần rót thì acc chính là phần đó).
  const B = BATCH && BATCH.ti === ti && BATCH.id === id ? BATCH : null;
  const acc = B ? mergeEvents(B.events, res.events) : res.events;
  const prev = B ? B.prev : S.last[ti], live = acc.some((e) => e.kind === 'reaction' || e.kind === 'indicator');
  // "Chất kia đã hết" chỉ khi CẢ lần thêm không có phản ứng nào; trong cùng một lần rót, phần sau im lặng là bình thường.
  const spent = !live && prev && prev.events.find((e) => e.kind === 'reaction' && (e.a === id || e.b === id));
  if (spent) { prev.over = { id, other: spent.a === id ? spent.b : spent.a }; S.last[ti] = prev; }
  else if (acc.length) S.last[ti] = { id, events: acc, at: live ? performance.now() : 0 };
  else if (!prev || !prev.events.length) S.last[ti] = { id, events: [] };
  record(ti, id, amt, how, res.events, B);
  lensFeed(ti, entering(id, amt.mL ? BY_ID[id].conc * amt.mL : amt.piece ? pieceMmol(id) : 0), res.events);
  tubeTag(ti);
  const say = spent ? `${label(spent.a === id ? spent.b : spent.a)} đã hết` : seenShort(acc); // nhãn trên bàn: hiện tượng rõ nhất của cả lần, phần sau không đè phần trước
  if (say) flash(ti, cap(say), !live);
  if (fresh || res.events.some((e) => e.kind === 'indicator')) sfx.ding();
  render(); return true;
}
// Đồ thị ở dải kết quả: sau mỗi lần thêm (hoặc đun) ghi một điểm = tổng thể tích trong ống + số mmol từng sản phẩm đã tạo. Trục ngang là thể tích, KHÔNG phải thời gian.
function curvePoint(ti) { S.curve[ti].push({ v: S.tubes[ti].vol, p: Object.fromEntries(Object.entries(S.prod[ti]).map(([f, q]) => [f, q.mol * 1000])) }); if (S.curve[ti].length > 400) S.curve[ti].splice(1, 1); }
function addMade(ti, e) { for (const m of e.made || []) { const q = S.prod[ti][m.f] || (S.prod[ti][m.f] = { mol: 0, mark: m.mark || '' }); q.mol += m.mol; } }

// ---------- MỘT lần thêm chất = MỘT quan sát (21/11, mục 48 của LUONG_2) ----------
// Trang rót 2 mL thành 8 phần 0,25 mL, nhỏ 5 giọt thành 5 lần, thả 3 mẩu thành 3 lần: mỗi phần gọi apply riêng.
// Trước đây dải kết quả, nhãn trên bàn và sổ chỉ giữ sự kiện của phần CUỐI nên hiện tượng chính ở phần đầu
// (thả Na rồi rót HCl: "sủi khí rất mạnh") bị phần trung hoà sau ("không thấy bằng mắt") đè mất.
// BATCH gom mọi sự kiện của một lần bấm; sự kiện trùng phương trình thì cộng dồn lượng, không kể hai lần.
let BATCH = null;
const SEEN_FX = ['ppt', 'gas', 'color', 'coat', 'dissolve']; // hiệu ứng nhìn thấy được
const visibleFx = (e) => e.kind === 'reaction' && (e.r.effects || []).some((f) => SEEN_FX.includes(f.type));
function mergeEvents(acc, more) {
  for (const e of more) {
    const key = e.kind === 'reaction' ? `rx:${e.r.equation || `${e.a}+${e.b}`}` : `${e.kind}:${e.a}+${e.b}`;
    const old = acc.find((x) => x.mKey === key);
    if (!old) { acc.push({ ...e, mKey: key, extent: e.extent || 0, made: (e.made || []).map((m) => ({ ...m })) }); continue; }
    old.extent += e.extent || 0;
    for (const m of e.made || []) { const q = old.made.find((x) => x.f === m.f); if (q) q.mol += m.mol; else old.made.push({ ...m }); }
    if (e.kind === 'indicator') Object.assign(old, e, { mKey: key }); // chỉ thị: giữ trạng thái mới nhất
    if (e.out) old.out = e.out;
  }
  return acc;
}
// Sổ ống cũng cần biết ranh giới của một lần cho chất (beginPour / endPour của tubechem.js): Na trong ống gặp acid đang rót thì
// phản ứng với acid trước, phần Na dư gặp nước khi đóng lần rót. Sự kiện endPour trả về được gộp vào CÙNG lần (cùng dòng sổ, cùng quan sát).
function beginBatch(ti, id, how) { BATCH = { ti, id, how, events: [], prev: S.last[ti], logged: null }; beginPour(S.tubes[ti], id); }
function endBatch() { const B = BATCH; if (B) { const res = endPour(S.tubes[B.ti]); if (res.events.length) absorb(B.ti, B.id, { close: true }, B.how, res); } BATCH = null; }
// Cảnh báo an toàn do fork Logic gắn vào dữ liệu phản ứng. Đọc được ba dạng để không phụ thuộc cách họ đặt tên:
// hiệu ứng { type: 'safety' | 'warn', text }, trường r.safety (chuỗi hoặc mảng), hoặc r.notes có phần tử { safety: true, text }.
function safetyOf(events) {
  const out = [];
  for (const e of events || []) { const r = e && e.r; if (!r) continue;
    for (const f of r.effects || []) if (f.type === 'safety' || f.type === 'warn') out.push(f.text);
    const s = r.safety; if (typeof s === 'string') out.push(s); else if (Array.isArray(s)) out.push(...s.map((x) => (typeof x === 'string' ? x : x && x.text)));
    for (const n of r.notes || []) if (n && typeof n === 'object' && (n.safety || n.type === 'safety' || n.type === 'warn')) out.push(n.text); }
  return [...new Set(out.filter(Boolean))];
}
// Ghi chú thường của máy (chuỗi trong r.notes): không phải cảnh báo, hiện ở mục "Lưu ý" trong Chi tiết.
function notesOf(events) {
  const out = [];
  for (const e of events || []) for (const n of (e && e.r && e.r.notes) || []) if (typeof n === 'string') out.push(n);
  return [...new Set(out)];
}
// Sổ thí nghiệm: MỘT lần thêm chất = MỘT dòng, ghi đủ các phương trình đã xảy ra trong lần đó (mục 48).
function record(ti, id, amt, how, events, B) {
  const top = S.log[0];
  const same = B ? B.logged && top === B.logged : top && top.ti === ti && top.id === id && top.how === how;
  const e = same ? top : { ti, id, how, mL: 0, n: 0, verdict: null, seen: '', seens: [], eqs: [] };
  if (!same) { S.log.unshift(e); if (B) B.logged = e; }
  e.mL += amt.mL || 0; if (!amt.close) e.n += 1;
  const rx = events.filter((x) => x.kind === 'reaction'), ind = events.find((x) => x.kind === 'indicator'), indText = ind && indSay(ind);
  if (rx.length) { e.verdict = 'reaction';
    for (const x of rx) { const t = x.r.effects.filter((f) => f.type !== 'heat' && f.type !== 'quiet').map((f) => f.text).join('; ');
      if (t && !e.seens.includes(t)) e.seens.push(t);
      if (x.r.equation && !e.eqs.includes(x.r.equation)) e.eqs.push(x.r.equation); }
    if (indText && !e.seens.includes(indText)) e.seens.push(indText);
    e.seen = e.seens.join('; ') || 'Không thấy thay đổi bằng mắt'; e.eq = e.eqs.join(' · '); }
  else if (ind && e.verdict !== 'reaction') { e.verdict = 'indicator'; if (!e.seens.includes(indText)) e.seens.push(indText); e.seen = e.seens.join('; '); }
  else if (events[0] && !e.verdict) { e.verdict = events[0].kind; e.observation = events[0].r.observation; e.seen = e.observation || (events[0].kind === 'none' ? 'Không có hiện tượng' : 'App chưa có dữ liệu cho cặp này'); }
}

// ---------- hàng chờ: không khoá nút; bấm nhanh liên tiếp thì các việc chạy lần lượt theo đúng thứ tự (tối đa 8 việc chờ) ----------
function act(text, run, id = null) {
  if (S.running) { if (S.queue.length >= 8) { toast('Đang còn 8 việc chờ, đợi một chút.'); return; } S.queue.push({ text, run, id }); renderHint(); return; }
  S.running = true; S.runId = id; renderHint();
  run(() => { S.running = false; S.runId = null; const n = S.queue.shift(); if (n) act(n.text, n.run, n.id); else renderHint(); });
}
// Lọ đang rót hoặc đang có việc chờ thì không được tự cất để nhường chỗ.
const inPlay = () => [S.runId, ...S.queue.map((q) => q.id)].filter(Boolean);

// ---------- chọn ----------
let viewBtn = null;
function setView(name) { bench.view(name); if (UI) UI.view(); if (viewBtn) { viewBtn.classList.toggle('on', name === 'tube'); viewBtn.lastChild.textContent = name === 'tube' ? 'Toàn bàn' : 'Cận cảnh'; } }
const unitOf = (id) => (isSolid(id) ? 'piece' : id === 'pp' ? 'giot' : id === 'H2O' ? 'mL' : S.unit);
function selectTube(i) { if (!isOn(i)) return; S.tube = i; bench.setActive(i); render(); }
// Chọn một chất: lọ chưa ở trên bàn thì lấy ra (hết chỗ thì lọ lâu chưa dùng nhất được cất đi). Khay hoá chất tự thu lại.
function selectChem(id) {
  if (id) { const r = bench.bringOut(id, inPlay()); if (r.full) { toast(`Bàn đã đủ ${bench.maxBottles || 5} lọ và đều đang dùng. Đợi rót xong đã.`); return; } if (r.evicted) toast(`Đã cất lọ ${label(r.evicted)} để lấy chỗ cho ${label(id)}.`); }
  S.chem = id; bench.setSelected(id, id ? chemName(id) : ''); bench.setAwait(!!id);
  if (id && S.drawer === 'chem') S.drawer = null;
  render();
}
// Cất riêng một lọ khỏi bàn (không dọn cả bàn): bấm "Cất vào tủ" dưới lọ đang chọn, hoặc chữ "Cất" ở dòng chất đó trong tủ.
function putAwayOne(id) { if (inPlay().includes(id) || !bench.putAway(id)) { toast(`${label(id)} đang được dùng, đợi xong rồi cất.`); return; } if (S.chem === id) { S.chem = null; bench.setSelected(null, ''); bench.setAwait(false); } if (S.lastAdd && S.lastAdd.id === id) S.lastAdd = null; toast(`Đã cất ${label(id)} vào tủ.`); render(); }
// Đặt cốc lên bàn (tủ Dụng cụ): cốc trống đầu tiên còn trong tủ lên chỗ đặt cốc, được chọn làm bình đích. Cất cốc: chỉ khi cốc trống.
function placeCup(kind = 'beaker') { const all = TUBES.filter((k) => bench.tubes[k].kind === kind), i = all.find((k) => !isOn(k)); if (i == null) { toast(all.length ? `${bench.tubes[all[0]].name.replace(/ \d+$/, '')}: trong tủ không còn cái nào.` : 'Tủ chưa có món này.'); return; }
  if (!bench.place(i)) { toast('Bàn đã đủ 4 bình ngoài giá. Cất bớt một bình rồi lấy tiếp.'); return; } S.tubes[i] = fresh(i); S.last[i] = null; S.sum[i] = {}; S.prod[i] = {}; S.curve[i] = []; S.note[i] = null; tubeTag(i); selectTube(i); toast(`Đã đặt ${tn(i)} (${capOf(i)} mL) lên bàn.`); }
function stowCup(i) { const t = S.tubes[i]; if (t.vol > 0.001 || Object.keys(t.items).length) { toast(`${Tn(i)} còn chất. Đổ bỏ trước rồi mới cất.`); return; } if (S.running || inPlay().length) { toast('Đang có thao tác, đợi xong rồi cất.'); return; } if (!bench.stow(i)) return; if (S.tube === i) { const k = onBench().filter((x) => x !== i).pop() ?? 0; S.tube = k; bench.setActive(k); lensTube = -1; } toast(`Đã cất ${tn(i)} vào tủ.`); render(); }
// Bấm thân ống: cho chất đang chọn vào với lượng đang đặt trên thanh thao tác. Bấm nhãn dưới chân ống: chỉ chọn ống.
function pick(pid) {
  const [kind, v] = pid.split(':');
  if (kind === 'chem') { selectChem(v); return; }
  if (kind === 'away') { putAwayOne(v); return; }
  const i = Number(v); selectTube(i);
  if (kind === 'tube' && S.chem) addNow(S.chem, i, unitOf(S.chem), S.amount[unitOf(S.chem)]);
}

// ---------- thêm chất ----------
function check(id, ti, unit, v) { // → [số hợp lệ | null, lời báo]
  const room = capOf(ti) - S.tubes[ti].vol;
  if (unit === 'piece') { const n = Math.round(v); return n >= 1 && n <= 3 ? [n, ''] : [null, 'Mỗi lần thả từ 1 đến 3.']; }
  if (unit === 'giot') { const n = Math.round(v); if (!(n >= 1 && n <= 40)) return [null, 'Số giọt từ 1 đến 40.']; return n * DROP_ML <= room + 1e-9 ? [n, ''] : [null, `${Tn(ti)} chỉ còn chỗ cho ${fm(Math.max(0, room), 1)} mL.`]; }
  if (!(v > 0)) return [null, 'Lượng phải lớn hơn 0, ví dụ 2 hoặc 0,5 mL.'];
  return v <= room + 1e-9 ? [v, ''] : [null, `${Tn(ti)} chỉ còn chỗ cho ${fm(Math.max(0, room), 1)} mL (chứa tối đa ${capOf(ti)} mL).`];
}
function addNow(id, ti, unit, v) {
  const [n, msg] = check(id, ti, unit, v); if (n == null) { toast(msg); return false; }
  if (!bench.has(id)) { const r = bench.bringOut(id, inPlay()); if (r.full) { toast(`Bàn đã đủ ${bench.maxBottles || 5} lọ và đều đang dùng.`); return false; } }
  S.lastAdd = { id, unit, n }; bench.setAwait(false); lensPlan(ti, id, unit, n);
  const what = unit === 'piece' ? `${n} ${pieceUnit(id)}` : unit === 'giot' ? `${n} giọt ${label(id)}` : `${fm(n, 1)} mL ${label(id)}`;
  const gone = (done) => { if (!bench.has(id)) { toast(`Lọ ${label(id)} đã được cất, chọn lại trong tủ.`); done(); return true; } return false; };
  // after: đóng luôn phiên gom của lần thêm này (mục 48) để lần bấm sau bắt đầu một quan sát mới
  const after = (done) => () => { endBatch(); if (S.chem) bench.setAwait(true); done(); };
  if (unit === 'piece') act(`${what} vào ${tn(ti)}`, (done) => { if (gone(done)) return; beginBatch(ti, id, 'solid'); let left = n; const one = () => bench.addSolid(id, ti, () => { apply(ti, id, { piece: true }, 'solid'); sfx.plop(); }, () => { if (--left > 0) one(); else after(done)(); }); one(); }, id);
  else if (unit === 'giot') act(`${what} vào ${tn(ti)}`, (done) => { if (gone(done)) return; beginBatch(ti, id, 'drop'); let left = n;
    const one = () => { if (left <= 0) { after(done)(); return; } left--; if (!bench.dropOne(() => { sfx.drop(); if (!apply(ti, id, { mL: DROP_ML, drop: true }, 'drop')) left = 0; one(); })) after(done)(); };
    const a = bench.armed(); if (a && a.id === id && a.ti === ti) one(); else bench.arm(id, ti, one); }, id);
  else act(`${what} vào ${tn(ti)}`, (done) => { if (gone(done)) return; beginBatch(ti, id, 'pour'); bench.pour(id, ti, { target: n, onChunk: (mL) => { const ok = apply(ti, id, { mL }, 'pour'); if (ok) sfx.trickle(); return ok; }, onDone: after(done) }); }, id);
  return true;
}
// Thêm lần nữa: đúng chất và lượng vừa dùng vào ống đang chọn. one = true (phím cách): đang nhỏ giọt thì chỉ thêm 1 giọt.
function repeat(one) { const a = S.lastAdd; if (!a) { toast('Chưa có lần thêm nào để lặp lại.'); return; } if (S.chem !== a.id) selectChem(a.id); addNow(a.id, S.tube, a.unit, one && a.unit === 'giot' ? 1 : a.n); }
// Khuấy bằng đũa thuỷ tinh (kho LAB-010): khuấy tung kết tủa như lắc, hợp với cốc; bình cổ hẹp, ống thì khuấy nhẹ.
function stir() { const ti = S.tube; if (S.tubes[ti].vol <= 0) { toast(`${Tn(ti)} đang trống.`); return; } if (!bench.stir) { toast('Bàn này chưa có đũa thuỷ tinh.'); return; } act(`khuấy ${tn(ti)}`, (done) => bench.stir(ti, () => { S.log.unshift({ ti, how: 'stir' }); render(); done(); })); }
function shake() { const ti = S.tube; if (S.tubes[ti].vol <= 0) { toast(`${Tn(ti)} đang trống.`); return; } act(`lắc ${tn(ti)}`, (done) => bench.shake(ti, () => { S.log.unshift({ ti, how: 'shake' }); render(); done(); })); }
function discard() { const ti = S.tube; act(`đổ bỏ ${tn(ti)}`, (done) => bench.discard(ti, () => { S.tubes[ti] = fresh(ti); S.last[ti] = null; S.sum[ti] = {}; S.prod[ti] = {}; S.curve[ti] = []; lensTube = -1; lensWhy = `Đổ bỏ ${tn(ti)}`; S.note[ti] = null; S.gasUntil[ti] = 0; S.log.unshift({ ti, how: 'discard' }); tubeTag(ti); render(); done(); })); }
function clearAll() { S.queue.length = 0; bench.disarm(); S.chem = null; bench.setSelected(null, ''); bench.setAwait(false); bench.onBench().forEach((id) => bench.putAway(id));
  bench.tubes.forEach((v) => v.reset()); TUBES.filter(isCup).forEach((i) => bench.stow(i)); S.tube = 0; bench.setActive(0); // dọn bàn: cốc cũng về tủ
  S.tubes = TUBES.map(fresh); S.last = TUBES.map(() => null); S.sum = TUBES.map(() => ({})); S.prod = TUBES.map(() => ({})); S.curve = TUBES.map(() => []); lensTube = -1; lensHard = true; SNAP.length = 0; S.note = TUBES.map(() => null); S.gasUntil = TUBES.map(() => 0); S.log = []; S.lastAdd = null; bench.tubes.forEach((v) => v.reset()); TUBES.forEach(tubeTag); bench.setFlash(0, ''); setView('all'); render(); }

// ---------- phép thử và tác động: giấy quỳ, que đóm, đun nóng ----------
function note(ti, tag, seen, why) { S.note[ti] = { tag, seen, why }; flash(ti, seen); S.log.unshift({ ti, how: 'test', tag, seen }); sfx.ding(); render(); }
function doLitmus() { const ti = S.tube, r = litmus(S.tubes[ti]); if (!r) { toast(`${Tn(ti)} đang trống, chưa có gì để thử.`); return; }
  act(`thử giấy quỳ ${tn(ti)}`, (done) => bench.litmusTest(ti, r.hex, () => { note(ti, 'Giấy quỳ', r.changed ? `Giấy quỳ hoá ${r.color}` : 'Giấy quỳ không đổi màu', `pH trong ống khoảng ${fm(r.pH, 1)}. Quỳ tím hoá đỏ khi pH dưới 5, hoá xanh khi pH trên 8.`); done(); })); }
function doSplint() { const ti = S.tube, t = S.tubes[ti], live = performance.now() < S.gasUntil[ti] && t.lastGas, info = live ? SPLINT[t.lastGas] : null;
  act(`thử que đóm ${tn(ti)}`, (done) => bench.splintTest(ti, info ? info.act : 'none', () => { if (info && info.act === 'pop') sfx.plop();
    note(ti, 'Que đóm', info ? info.seen : 'Que đóm vẫn cháy bình thường', info ? info.why : t.lastGas ? 'Khí đã thoát gần hết nên không còn đủ để thử. Hãy thử ngay lúc ống đang sủi bọt.' : 'Trong ống không có khí thoát ra.'); done(); })); }
function doHeat() { const ti = S.tube, t = S.tubes[ti]; if (bench.tubes[ti].kind === 'cylinder') { toast('Không đun ống đong: thuỷ tinh dày, chia vạch, đun dễ nứt và sai vạch. Rót sang cốc hoặc bình cầu rồi đun.'); return; } // cốc, bình: đặt lên kiềng + lưới (bench2d.heatVessel); ống nghiệm: kẹp gỗ if (t.vol <= 0) { toast(`${Tn(ti)} đang trống, không đun ống khô.`); return; }
  act(`đun nóng ${tn(ti)}`, (done) => { const hot = () => { const ev = heat(t);
    if (ev.length) { sync(ti, ev); for (const e of ev) { S.sum[ti][e.r.equation] = (S.sum[ti][e.r.equation] || 0) + e.extent; addMade(ti, e); } S.last[ti] = { id: 'heat', events: ev }; curvePoint(ti); lensFeed(ti, [], ev); flash(ti, cap(seenShort(ev)));
      S.log.unshift({ ti, how: 'heat', seen: ev.map((e) => e.r.effects.map((f) => f.text).join('; ')).join('; '), eq: ev.map((e) => e.r.equation).join(' · ') }); sfx.ding(); render(); }
    else note(ti, 'Đun nóng', 'Đun nóng: không có phản ứng mới', 'Dung dịch nóng lên. Với các chất đang có trong ống, app không có phản ứng nào cần đun nóng.'); };
    if (bench.twoPhaseHeat) bench.heatTube(ti, hot, done); else bench.heatTube(ti, () => { hot(); done(); }); }); }
// Nhiệt kế: app chưa có số liệu nhiệt nên chỉ báo mức ấm lên (không đổi, nhẹ, mạnh) theo dữ liệu "toả nhiệt" của phản ứng gần nhất trong ống.
function doThermo() { const ti = S.tube, t = S.tubes[ti]; if (t.vol <= 0) { toast(`${Tn(ti)} đang trống, chưa có gì để đo.`); return; }
  const L = S.last[ti], hz = L && L.events.filter((e) => e.kind === 'reaction').flatMap((e) => e.r.effects).find((f) => f.type === 'heat'), lv = !hz ? 0 : /mạnh/.test(hz.level) ? 2 : 1;
  act(`đo nhiệt độ ${tn(ti)}`, (done) => bench.thermoTest(ti, lv, () => { note(ti, 'Nhiệt kế', lv === 2 ? 'Cột nhiệt kế tăng mạnh: ống nóng lên rõ' : lv === 1 ? 'Cột nhiệt kế nhích lên: ống ấm lên nhẹ' : 'Cột nhiệt kế gần như không đổi', hz ? `Phản ứng vừa rồi toả nhiệt ${hz.level}. App mới báo được mức ấm lên, chưa có số độ vì chưa có số liệu nhiệt của từng phản ứng.` : 'Theo dữ liệu của app, phản ứng gần nhất trong ống này (nếu có) không toả nhiệt đáng kể. App chưa có số độ cụ thể.'); done(); })); }
function addWater() { selectChem('H2O'); }
// Nút có hậu quả (đổ bỏ, dọn bàn): bấm lần đầu đổi chữ hỏi lại, bấm lần hai trong 3 giây mới làm.
function twoStep(btn, ask, need, go) { const text = btn.lastChild, base = text.textContent; btn.addEventListener('click', () => { if (!need() || btn.dataset.armed) { delete btn.dataset.armed; text.textContent = base; clearTimeout(btn.t); go(); return; } btn.dataset.armed = '1'; text.textContent = ask; btn.t = setTimeout(() => { delete btn.dataset.armed; text.textContent = base; }, 3000); }); return btn; }

// ---------- tủ hoá chất: cố định bên trái (màn rộng) hoặc mở thành khay dưới bàn (màn hẹp) ----------
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
const cabs = []; // các nơi đang hiện danh sách (cột trái, khay)
function buildCab(host, docked) {
  const search = el('input', { type: 'search', placeholder: 'Tìm tên hoặc công thức', 'aria-label': 'Tìm hoá chất', value: S.q });
  search.addEventListener('input', () => { S.q = search.value; cabs.forEach((c) => c.list()); }); search.addEventListener('keydown', (e) => e.stopPropagation());
  const chips = el('div', { class: 'cab-chips' }), list = el('div', { class: 'cab-list' });
  const me = { host, chips() { put(chips, GROUPS.map(([g, name]) => el('button', { class: S.group === g ? 'on' : '', onclick: () => { S.group = g; cabs.forEach((c) => { c.chips(); c.list(); }); } }, name))); },
    list() { const q = norm(S.q.trim()), ids = CAB.filter((id) => (S.group === 'all' || BY_ID[id].group === S.group) && (!q || norm(`${BY_ID[id].f} ${BY_ID[id].name} ${OLD[id] || ''} ${id}`).includes(q)));
      put(list, ids.length ? ids.map((id) => { const c = BY_ID[id]; return el('button', { class: 'chem' + (S.chem === id ? ' on' : bench.has(id) ? ' out' : ''), onclick: () => selectChem(id) }, el('i', { style: `background:${c.hex || (isSolid(id) ? '#9aa3ab' : '#fff')}` }), el('span', { class: 'nm' }, el('b', {}, listLabel(id)), el('small', {}, `${shortName(id)} · ${OLD[id] || ''}`)), el('em', {}, concText(id)), bench.has(id) ? el('span', { class: 'away', role: 'button', title: 'Cất lọ này vào tủ, các món khác giữ nguyên', onclick: (e) => { e.stopPropagation(); putAwayOne(id); } }, 'Cất') : null); }) : el('p', { class: 'cab-empty' }, 'Không có chất nào khớp.')); } };
  put(host, el('div', { class: 'cab-head' }, el('div', { class: 'ttl' }, el('span', {}, 'Tủ hoá chất'), docked ? el('button', { 'aria-label': 'Thu tủ hoá chất', title: 'Thu tủ lại để bàn rộng hơn', onclick: () => { S.dock = false; layout(); } }, '×') : null), search, chips), list);
  me.chips(); me.list(); return me;
}

// ---------- thanh thao tác: chất đang chọn + lượng mỗi lần thêm ----------
let pickSig = '';
function renderPick() { if (UI) return;
  const id = S.chem, unit = id ? unitOf(id) : 'mL', sig = `${id}|${unit}`; if (sig === pickSig) return; pickSig = sig;
  const chip = id ? el('div', { class: 'pk-chem' }, el('i', { style: `background:${BY_ID[id].hex || (isSolid(id) ? '#9aa3ab' : '#fff')}` }), el('span', {}, el('small', {}, 'Đang chọn'), el('b', {}, chemName(id))), el('button', { 'aria-label': 'Bỏ chọn chất', title: 'Bỏ chọn (Esc)', onclick: () => selectChem(null) }, '×')) : el('div', { class: 'pk-chem none' }, 'Chưa chọn chất');
  if (!id) { put($('pickbar'), chip); return; }
  const step = unit === 'mL' ? 0.5 : 1, max = unit === 'mL' ? capOf(S.tube) : unit === 'giot' ? 40 : 3;
  const inp = el('input', { type: 'text', inputmode: 'decimal', value: String(S.amount[unit]).replace('.', ','), 'aria-label': 'Lượng mỗi lần thêm' });
  const set = (v) => { v = Math.min(max, Math.max(step, Math.round(v / step) * step)); S.amount[unit] = v; inp.value = String(v).replace('.', ','); renderHint(); };
  inp.addEventListener('change', () => set(num(inp.value) || S.amount[unit])); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); e.stopPropagation(); });
  const both = unit !== 'piece' && id !== 'pp' && id !== 'H2O';
  const unitEl = both ? el('span', { class: 'pk-unit' }, ['mL', 'giot'].map((u) => el('button', { class: unit === u ? 'on' : '', onclick: () => { S.unit = u; render(); } }, u === 'mL' ? 'mL' : 'giọt'))) : el('span', { class: 'pk-unit' }, el('span', {}, unit === 'piece' ? pieceUnit(id) : unit === 'giot' ? 'giọt' : 'mL'));
  put($('pickbar'), chip, el('div', { class: 'pk-amt' }, el('button', { 'aria-label': 'Giảm lượng', onclick: () => set(S.amount[unit] - step) }, '−'), inp, unitEl, el('button', { 'aria-label': 'Tăng lượng', onclick: () => set(S.amount[unit] + step) }, '+')));
}
function renderHint() { if (UI) { UI.hint(); return; }
  const id = S.chem, u = id ? unitOf(id) : null, n = id ? S.amount[u] : 0;
  const amount = !id ? '' : u === 'piece' ? `${n} ${pieceUnit(id)}` : u === 'giot' ? `${n} giọt ${label(id)}` : `${fm(n, n % 1 ? 1 : 0)} mL ${label(id)}`;
  $('hint').textContent = S.queue.length ? `Tiếp theo: ${S.queue[0].text}${S.queue.length > 1 ? ` (và ${S.queue.length - 1} việc nữa)` : ''}.` : !id ? (S.dock && wide.matches ? 'Chọn một chất trong tủ hoá chất bên trái.' : 'Mở khay Hoá chất để chọn một chất.') : `Chạm một ống nghiệm để ${u === 'piece' ? 'thả' : u === 'giot' ? 'nhỏ' : 'rót'} ${amount}. Chạm nhãn dưới chân ống nếu chỉ muốn chọn ống.`;
}
// Dải kết quả dưới bàn: thấy gì · phương trình to · vì sao.
function renderResult() { if (UI) return;
  const L = S.last[S.tube], host = $('result');
  if (!L || !L.events.length) { put(host); return; }
  const rx = L.events.filter((e) => e.kind === 'reaction'), ind = L.events.find((e) => e.kind === 'indicator'), first = L.events[0];
  if (rx.length) { const made = (e) => { const tot = S.sum[S.tube][e.r.equation] || e.extent; return e.r.eq ? 'Đã tạo ra ' + e.r.eq.rhs.filter((x) => x.f !== 'H2O').map((x) => `${fm(x.coef * tot * 1000, 2)} mmol ${pretty(x.f)}`).join(' · ') : ''; };
    put(host, el('div', { class: 'seen' }, `${Tn(S.tube)} · ${low(cap(seenShort(L.events)))}`), rx.filter((e) => e.r.equation).map((e) => el('div', { class: 'eq' }, e.r.equation, el('small', {}, made(e)))), el('div', { class: 'why' }, L.over ? `${label(L.over.other)} trong ống đã hết: thêm ${label(L.over.id)} nữa không tạo thêm sản phẩm. ` : '', rx[0].r.reason), el('div', { class: 'line2' }, (() => { const m = modelOf(S.tube); return m && m.usesIons ? el('div', { class: 'ion' }, 'Phương trình ion thu gọn: ', el('b', {}, m.ionic), m.spect.length ? `  ·  ion không tham gia: ${m.spect.map((x) => x.label).join(', ')}` : '') : null; })(), rx.filter((e) => e.r.eq && e.r.eq.lhs.length > 1).slice(0, 1).map((e) => el('div', { class: 'ratio' }, ratioText(e))))); }
  else if (ind) put(host, el('div', { class: 'seen' }, `${Tn(S.tube)} · ${low(indSay(ind))}`), el('div', { class: 'why' }, `pH trong ống khoảng ${fm(ind.pH, 1)}. Phenolphthalein hoá hồng khi pH từ khoảng 8,2 trở lên.`));
  else put(host, el('div', { class: `seen ${first.kind}` }, `${Tn(S.tube)} · ${low(first.r.observation || (first.kind === 'none' ? 'Không có hiện tượng' : 'App chưa có dữ liệu'))}: ${label(first.a)} + ${label(first.b)}`), el('div', { class: 'why' }, first.r.reason));
}
// Hệ số trong phương trình là tỉ lệ số mol, không phải số lần rót: nói rõ bằng số mmol đã thật sự phản ứng trong ống.
function ratioText(e) { const tot = S.sum[S.tube][e.r.equation] || e.extent, L = e.r.eq.lhs; return `Hệ số là tỉ lệ số mol, không phải số lần rót: ${L.map((x) => `${x.coef} ${pretty(x.f)}`).join(' : ')}. Trong ống đã phản ứng ${L.map((x) => `${fm(x.coef * tot * 1000, 2)} mmol ${pretty(x.f)}`).join(' với ')}.`; }
// Trong ống bây giờ có gì và nằm ở đâu: kết tủa ở đáy, chất tan trong dung dịch (kể cả chất còn dư), khí đã bay ra, chất rắn chưa tan hết.
function whereOf(ti) {
  const t = S.tubes[ti], prod = S.prod[ti], reacted = Object.keys(S.sum[ti]).length > 0, seen = new Set();
  const bottom = t.ppt.filter((p) => p.mol > 1e-9).map((p) => `${pretty(p.f)}↓ ${p.color}`), sol = [], solid = [];
  for (const it of Object.values(t.items)) { if (it.mol <= 1e-9 || it.id === 'H2O') continue; const c = BY_ID[it.id]; seen.add(c.f);
    if (isSolid(it.id)) solid.push(`${label(it.id)}${reacted ? ' còn dư' : ''}`); else if (c.group === 'indicator') sol.push(c.name); else sol.push(`${label(it.id)}${reacted && (it.mL > 0 || it.drops > 0) ? ' dư' : ''}`); }
  for (const [f, q] of Object.entries(prod)) if (!q.mark && f !== 'H2O' && !seen.has(f) && q.mol > 1e-9) sol.push(pretty(f));
  const gas = Object.entries(prod).filter(([, q]) => q.mark === '↑' && q.mol > 1e-9).map(([f]) => `${pretty(f)}↑`);
  return { bottom, sol, solid, gas, water: !!prod.H2O };
}
function renderNotes() {
  // Nhãn ngay trên ống (hiện khi bấm Cận cảnh): mỗi lớp trong ống đang chọn một nhãn chỉ vào đúng chỗ
  if (bench.setCallouts) { const ti = S.tube, t = S.tubes[ti], w = whereOf(ti), few = (a) => (a.length > 3 ? a.slice(0, 3).join(', ') + ' …' : a.join(', ')), L = [];
    if (w.gas.length) L.push({ at: 'gas', title: 'Đã bay ra', text: few(w.gas) }); if (w.sol.length) L.push({ at: 'sol', title: 'Trong dung dịch', text: few(w.sol) }); else if (t.vol > 0.001 && !w.bottom.length && !w.solid.length) L.push({ at: 'sol', title: 'Trong ống', text: 'Nước cất' });
    if (w.solid.length) L.push({ at: 'solid', title: 'Chất rắn', text: few(w.solid) }); if (w.bottom.length) L.push({ at: 'bottom', title: 'Ở đáy', text: few(w.bottom) }); bench.setCallouts(L); }
  const host = $('notes'); if (!host) return;
  put(host, onBench().map((i) => { const t = S.tubes[i], list = contents(t), w = whereOf(i), line = (cls, k, arr) => (arr.length ? el('p', { class: cls }, el('i', {}, k), ' ', el('b', {}, arr.join(', '))) : null);
    return el('button', { class: 'nt' + (S.tube === i ? ' on' : ''), title: `Chọn ${tn(i)}`, onclick: () => selectTube(i) }, el('h4', {}, Tn(i), el('small', {}, t.vol > 0.001 ? `${fm(t.vol, t.vol < 1 ? 2 : 1)} mL` : 'trống')),
      !list.length ? el('p', { class: 'emp' }, 'Chưa cho gì vào.') : el('p', {}, el('i', {}, 'Đã cho:'), ' ', list.map((c) => `${c.label} ${c.amount}`).join(' + ')),
      line('dn', 'Ở đáy:', w.bottom), line('', 'Trong dung dịch:', w.sol), t.indShown && t.indicator ? line('', 'Chỉ thị:', [`${BY_ID[t.indicator].name} → ${t.indShown}`]) : null, line('', 'Chất rắn:', w.solid), line('up', 'Đã bay ra:', w.gas)); })); }
// Kính lúp "Bên trong ống" (trang có data-proc="lens"): sống theo ống đang chọn. Rót là hạt chảy vào; phản ứng thì các hạt tìm nhau, diễn chậm; nền kính mang màu dung dịch.
const LENS = document.documentElement.dataset.proc === 'lens';
let lens = null, lensTube = -1, lensWhy = '', lensHard = false; const HUD = {}, SNAP = []; // SNAP: ảnh chụp trạng thái các ống trên bàn theo thời gian của khung hạt, để bàn tua theo
const tints = (t) => Object.fromEntries(t.ppt.map((q) => [pretty(q.f), '#' + (PPT_HEX[q.color] ?? 0xeef1f4).toString(16).padStart(6, '0')]));
const popOf = (ti) => { const P = population(S.tubes[ti], S.prod[ti]), T = tints(S.tubes[ti]); for (const q of Object.values(P)) if (T[q.label]) q.tint = T[q.label]; return P; };
function lensTint(ti) { const t = S.tubes[ti], L = look(t); if (lens) lens.setTint(L.hex, t.vol > 0.01 ? Math.min(0.5, Math.max(0.07, 0.1 + (L.opacity - 0.3) * 0.75)) : 0); }
function lensPlan(ti, id, unit, n) { if (!LENS || !lens || ti !== S.tube || lensTube !== ti) return; try { const c = JSON.parse(JSON.stringify(S.tubes[ti])), prod = JSON.parse(JSON.stringify(S.prod[ti])), amt = unit === 'piece' ? { piece: true } : unit === 'giot' ? { mL: n * DROP_ML, drop: true } : { mL: n };
    for (let k = 0; k < (unit === 'piece' ? n : 1); k++) for (const e of add(c, id, amt).events) if (e.kind === 'reaction') for (const m of e.made || []) { const q = prod[m.f] || (prod[m.f] = { mol: 0, mark: m.mark || '' }); q.mol += m.mol; }
    lens.plan(population(c, prod)); } catch (err) { /* không tính trước được thì thôi, khung sẽ tự chỉnh thang lúc yên */ } }
function lensFeed(ti, added, events) { if (!LENS || !lens || ti !== S.tube || lensTube !== ti) return; const t = S.tubes[ti];
  const evs = events.filter((e) => e.kind === 'reaction' && e.r.eq).map((e) => { try { const m = buildModel(e, t); return { key: e.r.equation, lhs: m.lhs, rhs: m.rhs, species: m.species, mmol: e.extent * 1000 * m.perEq, tint: tints(t) }; } catch (err) { return null; } }).filter(Boolean);
  lens.feed({ added, events: evs, target: popOf(ti) }); lensTint(ti); }
function layoutLens() { const sw = $('stagewrap'), w = sw.clientWidth, h = sw.clientHeight; if (w < 300) return; const narrow = DS && w < 900, hud = narrow ? 0 : 240; sw.classList.toggle('nohud', narrow); // sân khấu hẹp: ẩn bảng đếm để bàn không bị ép nhỏ
  const capOff = DS && !narrow, low = capOff ? 82 : 112; // trang design system: bảng "Bên trong ống" đã nói đủ nên bỏ dòng chữ dưới vòng kính, vòng kính to thêm và thanh tua có khoảng thở
  // Hai cách xếp vòng kính và bảng đếm: (A) bảng đứng bên phải vòng kính; (B) bảng nằm DƯỚI vòng kính thành một cột bên phải.
  // Sân khấu cao (bố cục v2) mà xếp kiểu A thì vòng kính + bảng giữ hơn nửa bề ngang, bàn bị ép nhỏ và phần cao thêm bỏ trống.
  // Chọn B khi sân khấu đủ cao cho vòng kính ≥ 260 px + bảng ≥ 270 px và nhờ đó dụng cụ trên bàn to hơn ít nhất 20%.
  const asp = bench.aspect ? bench.aspect() : 1.6, benchK = (r) => Math.min((w * (1 - r)) / asp, h), HUD_MIN = 270;
  const dA = Math.max(160, Math.min(h - low, (w - hud) * 0.36)), rA = (dA + hud + 70) / w, dB = Math.min(h - 12 - 56 - HUD_MIN - 8, w * 0.3), rB = (dB + 56) / w;
  const stack = DS && !narrow && dB >= 260 && benchK(rB) >= benchK(rA) * 1.2; sw.classList.toggle('stack', stack);
  const d = stack ? dB : dA, left = stack ? w - 22 - d : w - hud - 40 - d, top = stack ? 12 : Math.max(10, (h - d - (low - 28)) / 2), L = $('lens'), C = $('lensCap'), T = $('lvTime'), HU = $('lensHud');
  Object.assign(L.style, { left: left + 'px', top: top + 'px', width: d + 'px', height: d + 'px' }); C.style.display = capOff ? 'none' : ''; Object.assign(C.style, { left: left - 30 + 'px', width: d + 60 + 'px', top: top + d + 10 + 'px' }); if (T) { const tw = Math.max(d, 240), tl = Math.max(8, Math.min(left + (d - tw) / 2, w - 8 - tw)); Object.assign(T.style, { left: tl + 'px', width: tw + 'px', top: top + d + (stack ? 10 : capOff ? 16 : 44) + 'px' }); } // 21/11 (A7·F3): vòng kính nhỏ hơn 240 px thì thanh tua vẫn rộng 240, canh giữa dưới vòng kính và không vượt mép phải sân khấu (trước đây nút "Hiện tại" bị cắt ở 1024 px)
  if (HU) Object.assign(HU.style, stack ? { left: left - 10 + 'px', width: d + 20 + 'px', top: top + d + 10 + 46 + 8 + 'px' } : { left: '', width: '', top: '' });
  // hộp zoom hạt: nằm cạnh tiêu đề bảng "Bên trong ống" (không đè viền vòng kính, không lẫn với hộp zoom bàn); bảng ẩn thì nổi ở góc vòng kính như cũ
  if (LZ.box) { if (narrow) { if (LZ.box.parentElement !== sw) sw.appendChild(LZ.box); LZ.box.classList.remove('in-hud'); Object.assign(LZ.box.style, { left: left + d - 104 + 'px', top: Math.max(4, top - 6) + 'px' }); } else { if (LZ.box.parentElement !== HUD.head) HUD.head.appendChild(LZ.box); LZ.box.classList.add('in-hud'); LZ.box.style.left = LZ.box.style.top = ''; } }
  bench.setReserve(stack ? rB : (d + hud + 70) / w); bench.setLens(null); } // bàn nhường phần bên phải cho vòng tròn hạt; KHÔNG vẽ chùm mờ nối từ ống sang vòng tròn nữa
// Thanh tua thời gian của khung hạt: kéo để xem lại từng lúc, mốc trắng = lúc cho chất vào, mốc xanh = lúc các hạt gặp nhau.
const TL = { info: null, drag: false, n: -1, who: null, ghost: false }, LZ = {};
function buildTimeline() { const host = $('lvTime'); if (!host) return;
  TL.play = el('button', { class: 'tl-play', title: 'Phát lại đợt vừa rồi / dừng', onclick: () => { const i = TL.info; if (!i) return; if (i.playing) { lens.pause(); return; } if (!i.live) { lens.play(); return; } const last = i.marks.filter((m) => m.type === 'add').pop(); if (!lens.play(Math.max(i.t0, (last ? last.t : i.t0) - 0.4))) toast('Chưa có gì để phát lại.'); } }, '▶');
  TL.range = el('input', { type: 'range', min: 0, max: 1000, step: 1, value: 1000, 'aria-label': 'Tua thời gian trong khung hạt' }); TL.marks = el('div', { class: 'tl-marks' }); TL.lab = el('span', { class: 'tl-lab' }, 'Trực tiếp');
  TL.live = el('button', { title: 'Thôi xem lại, trở về lúc này', onclick: () => lens.goLive() }, 'Hiện tại');
  TL.range.addEventListener('input', () => { const i = TL.info; if (!i) return; lens.pause(); lens.seek(i.t0 + (Number(TL.range.value) / 1000) * (i.t1 - i.t0)); });
  TL.range.addEventListener('pointerdown', () => { TL.drag = true; }); addEventListener('pointerup', () => { TL.drag = false; }); TL.range.addEventListener('keydown', (e) => e.stopPropagation());
  put(host, TL.play, el('div', { class: 'tl-track' }, TL.marks, TL.range), TL.lab, TL.live); }
function renderTime(i) { TL.info = i; if (!TL.range) return; const span = Math.max(0.001, i.t1 - i.t0);
  // bàn tua theo: lúc trực tiếp thì chụp trạng thái các ống (5 lần mỗi giây); lúc tua thì bàn vẽ lại đúng bản chụp của thời điểm đó
  if (bench.snap) { if (i.live) { if (!SNAP.length || i.t1 - SNAP[SNAP.length - 1].t >= 0.2) SNAP.push({ t: i.t1, s: bench.snap() }); while (SNAP.length > 2 && SNAP[1].t <= i.t0) SNAP.shift(); if (TL.ghost) { TL.ghost = false; bench.ghost(null); } } else { let k = SNAP.length - 1; while (k > 0 && SNAP[k].t > i.at) k--; if (SNAP[k]) { bench.ghost(SNAP[k].s); TL.ghost = true; } } }
  $('stagewrap').classList.toggle('past', !i.live); $('lensEmpty').style.visibility = i.live ? '' : 'hidden';
  // chưa có gì để tua (chưa rót chất nào, khung không có hạt): ẩn thanh tua và nút xem lại, bàn lúc mới vào sạch hơn
  { const used = i.n > 0 || !i.live || i.marks.some((m) => m.type !== 'cut'); $('lvTime').classList.toggle('idle', !used); HUD.again.style.display = i.marks.some((m) => m.type === 'rx') ? '' : 'none'; }
  { const w = i.who != null ? i.who : S.tube, key = w + (i.live ? 'L' : 'P'); if (TL.who !== key) { TL.who = key; HUD.title.textContent = i.live ? `Bên trong ${tn(w)}` : `${Tn(w)} · trước`; if ($('lensCap')) put($('lensCap'), i.live ? `Kính lúp đang soi ${tn(w)}` : `Đang xem lại ${tn(w)}`, el('small', {}, 'phóng to hàng chục triệu lần (minh hoạ)')); const m = modelOf(w); put(HUD.evt, m ? [el('b', {}, m.ionic), m.spect.length ? `Không tham gia: ${m.spect.map((x) => x.label).join(', ')}.` : ''] : null); } }
  if (LZ.lab) LZ.lab.textContent = `${Math.round((i.zoom || 1) * 100)}%`;
  if (!TL.drag) TL.range.value = Math.round(((i.at - i.t0) / span) * 1000); TL.play.textContent = i.playing ? '❚❚' : '▶'; TL.live.disabled = i.live;
  TL.lab.textContent = i.live ? (i.busy ? (i.warp > 1.5 ? `Tua nhanh ×${Math.round(i.warp)}` : 'Quay chậm') : 'Trực tiếp') : `−${fm(i.t1 - i.at, 1)} s`; TL.lab.title = i.live && i.warp > 1.5 ? 'Các hạt chuyển động hỗn loạn, chưa gặp đúng nhau nên khung tua nhanh thời gian. Không có gì kéo chúng lại.' : ''; TL.lab.classList.toggle('past', !i.live);
  if (TL.n !== i.marks.length) { TL.n = i.marks.length; put(TL.marks, i.marks.map((m) => el('i', { class: m.type, title: m.text }))); }
  [...TL.marks.children].forEach((n, k) => { n.style.left = `${Math.max(0, Math.min(100, ((i.marks[k].t - i.t0) / span) * 100))}%`; }); }
function renderLens() {
  if (!lens) { HUD.title = el('h2', {}); HUD.sub = el('p', { class: 'sub' }); HUD.list = el('div', { class: 'hud-list' }); HUD.evt = el('div', { class: 'hud-evt' }); HUD.again = el('button', { title: 'Tua về ngay trước lúc các hạt gặp nhau rồi phát lại', onclick: () => { const M = (TL.info && TL.info.marks) || [], rx = M.filter((m) => m.type === 'rx'); if (!rx.length) { toast('Chưa có phản ứng nào trong ống này để xem lại.'); return; } const lastAdd = M.filter((m) => m.type === 'add').pop(), first = rx.find((m) => !lastAdd || m.t >= lastAdd.t) || rx[rx.length - 1]; lens.play(first.t - 0.8); } }, 'Xem lại lúc các hạt gặp nhau');
    HUD.head = el('div', { class: 'hud-head' }, HUD.title); put($('lensHud'), HUD.head, HUD.sub, HUD.list, HUD.evt, HUD.again);
    buildTimeline(); lens = mountLens($('lens'), { tintEl: $('lensTint'), onTime: renderTime, onStats: (rows, U, pending, scrub, rescaled) => {
      const description = { ion: 'trong dung dịch', mol: 'trong dung dịch', ppt: 'kết tủa, nằm ở đáy', solid: 'chất rắn chưa tan' };
      const order = { solid: 0, ion: 1, mol: 1, ppt: 2 };
      HUD.sub.textContent = scrub ? 'Số hạt minh hoạ tại thời điểm đang tua.' : `Ion, phân tử và kết tủa: 1 hạt minh hoạ ≈ ${String(U).replace('.', ',')} mmol.${rescaled ? ' Vừa đổi thang hiển thị.' : ''}${pending ? ` Đang quay chậm, còn ${pending} lượt gặp nhau.` : ''}`;
      const made = new Set();
      if (UI && !scrub) {
        for (const event of S.last[S.tube]?.events || []) {
          for (const product of modelFor(event, S.tube)?.rhs || []) made.add(product.label);
        }
      }
      const formed = [], present = [];
      for (const r of rows.sort((a, b) => order[a.kind] - order[b.kind])) {
        const solid = r.kind === 'solid';
        const count = solid ? (r.n ? 'Cụm minh hoạ' : 'Chưa hiện cụm') : r.n ? `${r.n} hạt` : 'Chưa hiện hạt';
        const amount = scrub && solid ? null : el('span', { class: 'num' }, `${scrub ? '≈ ' : ''}${fm(r.mmol, 2)} mmol · `);
        const where = r.kind === 'ppt' && r.note ? `chất rắn${r.form === 'keo' || r.form === 'bông' ? ' dạng ' + r.form : ''} màu ${r.note}, nằm ở đáy` : (description[r.kind] || '') + (r.label === 'H⁺' ? ' (trong nước là H₃O⁺)' : '');
        const detail = el('small', {}, amount, where);
        detail.title = detail.textContent;
        const item = el('div', { class: `hud-it ${r.kind}${r.n ? '' : ' zero'}` }, el('i', { style: `background:${r.color}` }), el('b', {}, r.label + (r.kind === 'ppt' ? '↓' : '')), el('em', {}, count), detail);
        (made.has(r.label) ? formed : present).push(item);
      }
      put(HUD.list, rows.length ? [
        formed.length ? el('p', { class: 'hud-group' }, 'Tạo thành') : null, formed,
        made.size && present.length ? el('p', { class: 'hud-group' }, 'Còn lại') : null, present
      ].flat() : el('p', { class: 'sub' }, 'Chưa có hạt nào.'));
    } });
    LZ.box = el('div', { class: 'lens-zoom' }, el('button', { 'aria-label': 'Thu nhỏ vòng hạt', title: 'Thu nhỏ: thấy nhiều hạt hơn', onclick: () => lens.zoom(1 / 1.3) }, '−'), (LZ.lab = el('button', { title: 'Về cỡ thường', onclick: () => lens.zoom(0) }, '100%')), el('button', { 'aria-label': 'Phóng to vòng hạt', title: 'Phóng to: máy quay bám theo chỗ các hạt đang gặp nhau', onclick: () => lens.zoom(1.3) }, '+')); LZ.box.title = 'Zoom vòng hạt'; HUD.head.appendChild(LZ.box); LZ.box.classList.add('in-hud');
    window.__lens = lens; if ($('lensCap')) { new ResizeObserver(layoutLens).observe($('stagewrap')); layoutLens(); }
  }
  const ti = S.tube, t = S.tubes[ti]; if (lensTube !== ti) { lens.reset(popOf(ti), { who: ti, hard: lensHard, mark: lensWhy || `Chuyển sang ${tn(ti)}` }); lensWhy = ''; lensHard = false; lensTube = ti; lensTint(ti); }
  TL.who = null; // tên ống ở tiêu đề và chú thích do renderTime đặt (lúc tua có thể là ống khác)
  $('lensEmpty').textContent = t.vol > 0.001 || Object.keys(t.items).length ? '' : `${Tn(ti)} đang trống. Rót một chất vào, các hạt của nó sẽ chảy vào đây.`;
  renderTime(lens.timeline()); // phương trình ion của ống đang soi; lý do đã có ở dải kết quả dưới bàn, không lặp lại ở đây
}
// Khung "Bên trong ống" (3D, nằm cạnh bàn): thế giới hạt của ống đang chọn. Ba nhịp: trước khi trộn, các hạt gặp nhau, sau phản ứng.
let p3 = null; const P3 = {};
// Một lần thêm có thể có nhiều phản ứng (mục 48): lấy phản ứng NHÌN THẤY ĐƯỢC đầu tiên làm phản ứng chính
// (phương trình ion thu gọn, bảng đếm hạt, tỉ lệ mol đi theo nó), không có thì lấy phản ứng đầu tiên.
const lastRx = (ti) => { const L = S.last[ti]; if (!L) return null; const rx = L.events.filter((x) => x.kind === 'reaction' && x.r.eq); return rx.find(visibleFx) || rx[0] || null; };
function modelFor(event, ti) {
  if (event?.kind !== 'reaction' || !event.r.eq) return null;
  try { return buildModel(event, S.tubes[ti]); } catch { return null; }
}
const modelOf = (ti) => modelFor(lastRx(ti), ti);
function renderProc() { if (LENS) { renderLens(); return; } const host = $('proc'); if (!host) return;
  if (!p3) {
    P3.title = el('h2', {}); P3.steps = ['Trước khi trộn', 'Gặp nhau', 'Sau phản ứng'].map((t, k) => el('button', { onclick: () => p3.goto(k + 1) }, `${'①②③'[k]} ${t}`));
    P3.big = el('button', { class: 'ghost', title: 'Cho khung này rộng ra, bàn thu về ống đang chọn', onclick: () => { const on = $('split').classList.toggle('big'); P3.big.textContent = on ? 'Thu lại' : 'Phóng to'; setView(on ? 'tube' : 'all'); } }, 'Phóng to');
    P3.legend = el('div', { class: 'p3-legend' }); P3.where = el('div', { class: 'p3-where' }); P3.cap = el('div', { class: 'p3-cap' }); P3.empty = el('div', { class: 'p3-empty' });
    const stage = el('div', { class: 'p3-stage' }, P3.legend, P3.where, P3.empty);
    put(host, el('div', { class: 'p3-head' }, P3.title, el('div', { class: 'p3-steps' }, P3.steps), el('button', { class: 'ghost', onclick: () => p3.replay() }, 'Xem lại'), P3.big), stage, P3.cap);
    p3 = mountProcess3D(stage, { onPhase: (k, text) => { P3.steps.forEach((b, i) => b.classList.toggle('on', i === k - 1)); put(P3.cap, el('b', {}, ['Trước khi trộn', 'Gặp nhau', 'Sau phản ứng'][k - 1] + ':'), text); } });
    window.__p3 = p3;
  }
  const ti = S.tube, t = S.tubes[ti], e = lastRx(ti), m = e && modelOf(ti), w = whereOf(ti);
  put(P3.title, `Bên trong ${tn(ti)}`, el('small', {}, 'Sơ đồ hạt: không vẽ nước của dung môi, không theo tỉ lệ thật. Kéo để xoay.'));
  if (!m) { p3.set(null); put(P3.cap); put(P3.empty, el('div', {}, t.vol > 0 || Object.keys(t.items).length ? 'Ống này chưa có phản ứng nào. Cho thêm một chất khác vào để xem các hạt gặp nhau ra sao.' : 'Ống đang trống. Rót hai chất vào cùng một ống, khung này sẽ cho thấy các hạt bên trong làm gì.')); return; }
  const sp = m.species, dot = (lab) => el('i', { style: `background:${sp[lab].color}` }), reacting = new Set(m.lhs.map((x) => x.label)), spect = new Set(m.spect.map((x) => x.label));
  const first = [...new Set(m.terms.flatMap((tm) => tm.parts.map((q) => q.label)))];
  put(P3.legend, el('h3', {}, 'Ban đầu có'), first.map((lab) => el('div', { class: 'p3-it' }, dot(lab), el('span', {}, el('b', {}, lab), reacting.has(lab) ? 'tham gia phản ứng' : spect.has(lab) ? 'không đổi (đứng ngoài)' : 'có mặt'))));
  const KIND = { ppt: 'chất rắn, chìm xuống đáy', gas: 'chất khí, bay ra khỏi ống', ion: 'tan, ở lại trong dung dịch', mol: 'ở lại trong dung dịch', solid: 'chất rắn' };
  put(P3.where, el('h3', {}, 'Tạo ra'), m.rhs.map((x) => el('div', { class: 'p3-it' }, dot(x.label), el('span', {}, el('b', {}, x.label + (x.kind === 'ppt' ? '↓' : x.kind === 'gas' ? '↑' : '')), x.label === 'H₂O' ? 'nước, hoà vào dung dịch' : KIND[x.kind]))),
    m.spect.length ? el('div', { class: 'p3-it' }, el('span', {}, el('b', {}, m.spect.map((x) => x.label).join(', ')), 'không đổi, vẫn trong dung dịch')) : null);
  const say = (tm) => (tm.kind === 'ions' ? `${tm.label} (tách thành ${tm.parts.map((q) => q.label).join(' và ')})` : tm.label), inn = m.terms.filter((tm) => tm.source === 'in').map(say), add = m.terms.filter((tm) => tm.source === 'add').map(say);
  const c1 = `trong ống có ${inn.join(', ') || 'dung dịch'}${add.length ? `; sắp cho vào ${add.join(', ')}` : ''}.`;
  const c2 = `${m.lhs.map((x) => `${x.n} ${x.label}`).join(' gặp ')} tạo thành ${m.rhs.map((x) => `${x.n > 1 ? x.n + ' ' : ''}${x.label}${x.kind === 'ppt' ? '↓' : x.kind === 'gas' ? '↑' : ''}`).join(' và ')}. ${e.r.reason}`;
  const c3 = [w.bottom.length ? `ở đáy có ${w.bottom.join(', ')}` : '', w.sol.length ? `trong dung dịch còn ${w.sol.join(', ')}` : '', w.solid.length ? `chất rắn: ${w.solid.join(', ')}` : '', w.gas.length ? `${w.gas.join(', ')} đã bay ra` : ''].filter(Boolean).join('; ') + '.';
  m.key = `${ti}|${e.r.equation}|${m.excess.join('')}`; m.liquid = look(t).hex; m.tint = Object.fromEntries(t.ppt.map((q) => [pretty(q.f), '#' + (PPT_HEX[q.color] ?? 0xeef1f4).toString(16).padStart(6, '0')]));
  p3.set(m, [c1, c2, cap(c3)]);
}
// Sổ thí nghiệm: mặc định thu gọn; mở ra có "trong ống", "hiện tượng" chi tiết và nhật ký tự ghi.
const SW = (e) => (e.type === 'ppt' ? '#' + (PPT_HEX[e.color] ?? 0xeeeeee).toString(16).padStart(6, '0') : e.type === 'color' ? e.hex || '#dcecf5' : e.type === 'coat' ? '#b5552e' : e.type === 'heat' ? '#f3a05a' : '#ffffff');
function renderBook() {
  if (UI) UI.book(); else { $('bBook').textContent = `Sổ thí nghiệm${S.log.length ? ` · ${S.log.length}` : ''}`; $('bBook').classList.toggle('on', S.book); } const host = $('book'); host.hidden = !S.book; if (!S.book) return;
  const t = S.tubes[S.tube], list = contents(t), L = S.last[S.tube], N = S.note[S.tube], fx = [];
  if (L && L.events.length) for (const e of L.events) {
    if (e.kind === 'reaction') fx.push(el('div', {}, el('span', { class: 'fr-tag k-reaction' }, 'Có phản ứng'), el('b', {}, e.title || `${label(e.a)} + ${label(e.b)}`)), el('ul', { class: 'fr-fx' }, e.r.effects.map((f) => el('li', {}, el('i', { style: `background:${SW(f)};${f.type === 'gas' ? 'border-radius:50%' : ''}` }), f.text))), el('p', { class: 'fr-why' }, 'Vì sao: ', e.r.reason), e.out ? el('p', { class: 'fr-note' }, `${label(e.out)} đã phản ứng hết.`) : null, e.slow ? el('p', { class: 'fr-note' }, 'Phản ứng với chất rắn diễn ra từ từ.') : null, e.r.notes.map((n) => el('p', { class: 'fr-note' }, n)));
    else if (e.kind === 'indicator') fx.push(el('div', {}, el('span', { class: 'fr-tag k-indicator' }, 'Chất chỉ thị'), el('b', {}, indSay(e))));
    else fx.push(el('div', {}, el('span', { class: `fr-tag k-${e.kind}` }, e.r.observation || (e.kind === 'none' ? 'Không phản ứng' : 'Chưa có dữ liệu')), el('b', {}, `${label(e.a)} + ${label(e.b)}`)), el('p', { class: 'fr-why' }, e.r.reason), e.r.notes.map((n) => el('p', { class: 'fr-note' }, n)));
  }
  if (N) fx.push(el('div', { class: fx.length ? 'fr-test' : '' }, el('span', { class: 'fr-tag k-test' }, N.tag), el('b', {}, N.seen), el('p', { class: 'fr-note' }, N.why)));
  put(host, el('h2', {}, 'Sổ thí nghiệm', el('button', { 'aria-label': 'Đóng sổ', onclick: () => { S.book = false; renderBook(); } }, '×')),
    el('div', { class: 'bk-sec' }, el('h3', {}, `Trong ${tn(S.tube)}`, el('small', {}, `${fm(t.vol, 2)} mL`)), !list.length ? el('p', { class: 'fr-empty' }, `${Tn(S.tube)} đang trống.`) : el('div', { class: 'fr-in' }, list.map((c) => el('div', {}, el('i', { style: `background:${c.hex}` }), el('span', {}, el('b', {}, c.label), c.conc ? ` ${c.conc}` : '', c.status ? el('small', {}, c.status) : null), el('em', {}, c.amount)))), t.ppt.length ? el('p', { class: 'fr-note' }, 'Kết tủa: ', t.ppt.map((p) => `${pretty(p.f)} ${p.color} (${fm(p.mol * 1000, 2)} mmol)`).join(', '), '.') : null),
    el('div', { class: 'bk-sec' }, el('h3', {}, 'Hiện tượng'), fx.length ? fx : el('p', { class: 'fr-empty' }, 'Chưa có gì. Cho hai chất vào cùng một ống để xem chúng có phản ứng không.')),
    el('div', { class: 'bk-sec' }, el('h3', {}, 'Nhật ký', el('small', {}, 'tự ghi')), !S.log.length ? el('p', { class: 'fr-empty' }, 'Mỗi lần thêm chất hay làm một phép thử, sổ ghi lại: làm gì, bao nhiêu, thấy gì, phương trình.') :
      el('div', { class: 'fr-log' }, S.log.map((e, k) => { const n = S.log.length - k;
        if (e.how === 'shake') return el('div', {}, el('b', {}, `${n}. `), `Lắc ${tn(e.ti)}`); if (e.how === 'stir') return el('div', {}, el('b', {}, `${n}. `), `Khuấy ${tn(e.ti)} bằng đũa thuỷ tinh`); if (e.how === 'discard') return el('div', {}, el('b', {}, `${n}. `), `Đổ bỏ và rửa ${tn(e.ti)}`);
        if (e.how === 'test') return el('div', {}, el('b', {}, `${n}. `), `${e.tag}, ${tn(e.ti)}`, el('small', {}, el('span', { class: 'fr-tag k-test' }, 'Phép thử'), e.seen));
        if (e.how === 'heat') return el('div', {}, el('b', {}, `${n}. `), `Đun nóng ${tn(e.ti)}`, el('small', {}, el('span', { class: 'fr-tag k-reaction' }, 'Có phản ứng'), e.seen), el('small', {}, e.eq));
        const what = e.how === 'drop' ? `Nhỏ ${e.n} giọt ${chemName(e.id)}` : e.how === 'solid' ? `Thả ${e.n} ${pieceUnit(e.id)}` : `Rót ${fm(e.mL, 2)} mL ${chemName(e.id)}`;
        return el('div', {}, el('b', {}, `${n}. `), `${what} vào ${tn(e.ti)}`, e.verdict ? el('small', {}, el('span', { class: `fr-tag k-${e.verdict}` }, { reaction: 'Có phản ứng', none: e.observation ? 'Quan sát' : 'Không phản ứng', na: 'Chưa có dữ liệu', indicator: 'Chỉ thị' }[e.verdict]), e.seen) : null, e.eq ? el('small', {}, e.eq) : null); }))));
}
// Khay Dụng cụ: mỗi dụng cụ là một thao tác lên ống đang chọn.
const ICON = { again: 'M5 12a7 7 0 0 1 12-5l2-2v6h-6l2.2-2.2A4.5 4.5 0 0 0 8 12M19 12a7 7 0 0 1-12 5', water: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z', shake: 'M10 4h4M10.5 4v12a1.5 1.5 0 0 0 3 0V4M5 9l-2 2 2 2M19 9l2 2-2 2', heat: 'M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-5 1 2 2 2 3-5zM8 21h8', litmus: 'M9 3h6v18H9zM9 13h6', splint: 'M4 20L15 9M16 8c-1.5-1.5-.5-3 .8-5 .8 1.8 3 2.8 1.6 4.8a1.6 1.6 0 0 1-2.4.2z', thermo: 'M12 4v10M10.5 4h3v10.3a3.4 3.4 0 1 1-3 0z', discard: 'M8 4l9 4-6 11a3 3 0 0 1-5-2zM9 13l6 2M18 17v3', view: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5L20 20M8 10.5h5M10.5 8v5' };
const svg = (d) => { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('aria-hidden', 'true'); const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); n.append(p); return n; };
function buildTools(host) {
  const tool = (icon, text, title, go, soon) => { const b = el('button', { class: 'tool', title, disabled: !!soon }, svg(ICON[icon]), soon ? el('em', {}, 'sắp có') : null, text); if (go) b.addEventListener('click', go); return b; };
  const dis = twoStep(tool('discard', 'Đổ bỏ', 'Đổ bỏ và rửa ống đang chọn'), 'Bấm lần nữa', () => S.tubes[S.tube].vol > 0 || Object.keys(S.tubes[S.tube].items).length > 0, discard);
  viewBtn = tool('view', bench.currentView() === 'tube' ? 'Toàn bàn' : 'Cận cảnh', 'Phóng to ống đang chọn', () => setView(bench.currentView() === 'tube' ? 'all' : 'tube'));
  put(host, el('div', { class: 'tools' }, tool('again', 'Thêm lần nữa', 'Thêm đúng chất và lượng vừa dùng vào ống đang chọn (phím cách)', () => repeat(false)), tool('water', 'Nước cất', 'Chọn bình tia nước cất', addWater), tool('shake', 'Lắc', 'Lắc ống đang chọn (phím L)', shake),
    tool('heat', 'Đun nóng', 'Đun ống đang chọn trên đèn cồn', doHeat), tool('litmus', 'Giấy quỳ', 'Thử dung dịch trong ống đang chọn bằng giấy quỳ', doLitmus), tool('splint', 'Que đóm', 'Đưa que đóm đang cháy tới miệng ống đang chọn', doSplint),
    tool('thermo', 'Nhiệt kế', bench.thermoTest ? 'Đo xem ống đang chọn ấm lên hay không (chưa có số độ)' : 'Chưa làm cho bàn này', bench.thermoTest ? doThermo : null, !bench.thermoTest), dis, viewBtn));
}
let drawerSig = '';
function renderDrawer() { if (UI) return;
  const host = $('drawer'); host.hidden = !S.drawer; $('bChem').classList.toggle('on', S.drawer === 'chem'); $('bTools').classList.toggle('on', S.drawer === 'tools');
  if (drawerSig === S.drawer) return; drawerSig = S.drawer; const k = cabs.findIndex((c) => c.host === host); if (k >= 0) cabs.splice(k, 1); viewBtn = null;
  if (S.drawer === 'chem') cabs.push(buildCab(host, false)); else if (S.drawer === 'tools') buildTools(host); else put(host);
}
// Màn rộng: tủ hoá chất đứng cố định bên trái (phương án B). Màn hẹp hoặc khi đã thu tủ: tủ thành khay (phương án A).
const wide = matchMedia('(min-width:1100px)');
function layout() { const dock = wide.matches && S.dock; $('app').classList.toggle('dock', dock); if (dock && S.drawer === 'chem') S.drawer = null; render(); }
function render() { if (UI) UI.render(); cabs.forEach((c) => c.list()); renderPick(); renderHint(); renderResult(); renderNotes(); renderProc(); renderDrawer(); renderBook(); }

// ---------- nối sự kiện ----------
bench.onPick(pick);
$('stage').addEventListener('dblclick', () => { if (!bench.hovered()) setView('all'); }); // bấm đúp chỗ trống: về góc toàn bàn
if (!DS) {
$('bChem').addEventListener('click', () => { if (wide.matches) { S.dock = true; layout(); } else { S.drawer = S.drawer === 'chem' ? null : 'chem'; render(); } });
$('bTools').addEventListener('click', () => { S.drawer = S.drawer === 'tools' ? null : 'tools'; render(); });
$('bBook').addEventListener('click', () => { S.book = !S.book; renderBook(); });
{ const b = $('bClear'), base = b.textContent; b.addEventListener('click', () => { const need = S.log.length > 0 || bench.onBench().length > 0; if (!need || b.dataset.armed) { delete b.dataset.armed; b.textContent = base; clearTimeout(b.t); clearAll(); return; } b.dataset.armed = '1'; b.textContent = 'Bấm lần nữa để dọn'; b.t = setTimeout(() => { delete b.dataset.armed; b.textContent = base; }, 3000); }); }
const soundBtn = $('bSound'); const soundText = () => { soundBtn.textContent = S.sound ? 'Âm thanh: bật' : 'Âm thanh: tắt'; };
soundBtn.addEventListener('click', () => { S.sound = !S.sound; store.set('lab_free_sound', S.sound ? '1' : '0'); soundText(); if (S.sound) sfx.ding(); }); soundText();
wide.addEventListener('change', layout);
}
addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button'); if (b) b.blur(); }); // nút không giữ tiêu điểm, để phím cách không bấm lại nút vừa bấm
// Phím tắt (không nhận khi đang gõ trong ô số, ô tìm).
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key >= '1' && e.key <= '9') { const v = onBench()[Number(e.key) - 1]; if (v != null) { selectTube(v); e.preventDefault(); } } // phím 1–7: bình thứ mấy đang có trên bàn
  else if (e.key === ' ') { repeat(true); e.preventDefault(); }
  else if (e.key === 'l' || e.key === 'L') shake();
  else if (e.key === 'k' || e.key === 'K') stir();
  else if (e.key === 'Escape') { if (S.drawer) { S.drawer = null; render(); } else selectChem(null); }
});
if (bench.flat) { const fitUI = () => { const k = Math.max(1, innerWidth / (DS ? 1920 : 1760)), n = $('app'); n.style.zoom = k; n.style.width = `calc(100vw / ${k})`; n.style.height = `calc(100dvh / ${k})`; }; addEventListener('resize', fitUI); fitUI(); }
bench.setSide(0); bench.setInset(false); bench.view('all', true);
TUBES.forEach(tubeTag); bench.setActive(0);
if (DS) { const { mountDS } = await import('./ui_ds.js'); // một tệp giao diện cho cả bố cục gốc và v2 (ui_ds.js tự đọc data-layout)
  UI = mountDS({ S, bench, TUBES, Tn, tn, capOf, isOn, onBench, isCup, el, put, $, fm, num, cap, low, BY_ID, CAB, OLD, MAX_ML, label, isSolid, shortName, concText, chemName, listLabel, pieceUnit, unitOf, pretty, seenShort, indSay, modelOf, ratioText, norm, toast, visibleFx, safetyOf, notesOf,
    A: { placeCup, stowCup, stir, selectChem, selectTube, addNow, repeat, shake, discard, clearAll, doLitmus, doSplint, doHeat, doThermo, setView, putAwayOne, render, renderBook, toggleSound() { S.sound = !S.sound; store.set('lab_free_sound', S.sound ? '1' : '0'); if (S.sound) sfx.ding(); } } });
  render(); }
else { cabs.push(buildCab($('cabDock'), true)); if (wide.matches) S.drawer = 'tools'; if (bench.flat && wide.matches) { const foot = $('bSound').parentElement; foot.insertBefore($('drawer'), foot.querySelector('.sp')); $('app').classList.add('toolsin'); } layout(); }

// Cửa cho kiểm thử: chạy từng bước thời gian thay cho đồng hồ thật (khung trình duyệt ẩn không tự chạy hoạt ảnh).
const run = (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) bench.stage.advance(step); };
window.__free = { S, bench, run, placeCup, stowCup, stir, pick, selectTube, selectChem, addNow, repeat, shake, discard, clearAll, setView, doLitmus, doSplint, doHeat, doThermo, render };
