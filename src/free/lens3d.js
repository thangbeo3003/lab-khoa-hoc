// Khung hạt "Bên trong ống": một giọt dung dịch phóng to, SỐNG theo ống đang chọn, có thanh tua thời gian.
// - Trạng thái là real time: rót chất nào thì hạt của chất đó chảy vào ngay; số hạt tỉ lệ với số mmol thật (1 hạt ≈ U mmol).
// - Biến cố thì quay chậm: phản ứng trên bàn xong trong chưa tới 1 giây, ở đây các hạt lần lượt tìm nhau theo đúng phương trình ion thu gọn.
// - Sau mỗi đợt, khung tự đối chiếu lại với lượng chất thật trong ống để không lệch.
// - Mọi diễn biến được ghi lại 15 hình mỗi giây (tối đa khoảng 90 giây gần nhất) để tua tới, tua lui, phát lại; lúc đang tua thì mô phỏng đứng yên.
// Sơ đồ minh hoạ: không vẽ nước dung môi, không theo tỉ lệ thật.
import * as THREE from 'three';
import { cluster, tag } from './process3d.js';

const RS = 7.0, UNITS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5], rnd = (a, b) => a + Math.random() * (b - a), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const SPH = new THREE.SphereGeometry(1, 20, 14), REC = 1 / 15, KEEP = 1400;

export function mountLens(host, { onStats, onTime, tintEl } = {}) {
  const cv = document.createElement('canvas'); host.prepend(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100), world = new THREE.Group(); scene.add(world);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x18263a, 1.3)); const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(5, 12, 10); scene.add(sun);
  let parts = [], queue = [], meta = {}, target = {}, U = 0.05, time = 0, idle = 0, nextEvt = 0, rest = 0, tagged = {}, UID = 0, OBJ = {}, REG = {};
  let hist = [], marks = [], mode = 'live', head = 0, playing = false, tintNow = ['#dcecf5', 0], recT = 0, whoNow = null, headWho = null, headW = 1, warp = 1, zoomK = 1; const foc = V3(0, -0.2, 0);
  const acc = { enter: {}, evt: {} }, par = { x: 0, y: 0, tx: 0, ty: 0 };
  const inside = () => { for (;;) { const p = V3(rnd(-1, 1), rnd(-0.72, 0.9), rnd(-1, 1)); if (p.length() < 1) return p.multiplyScalar(RS - 1.4); } };
  const countOf = (q) => (q.kind === 'solid' ? Math.min(12, Math.max(1, Math.round(q.mmol / U))) : Math.max(q.mmol > 0.3 * U ? 1 : 0, Math.round(q.mmol / U)));
  const alive = (label) => parts.filter((p) => p.label === label && p.state !== 'fade' && p.state !== 'gone' && p.state !== 'bound');
  const colorOf = (label) => (meta[label] && meta[label].color) || '#ffffff';
  function add(label, kind, o, r, state, g) { const p = { uid: ++UID, label, kind, q: /⁺$/.test(label) ? 1 : /⁻$/.test(label) ? -1 : 0, o, g: g || new THREE.Group(), r, state, v: V3(rnd(-0.5, 0.5), rnd(-0.4, 0.4), rnd(-0.5, 0.5)), spin: V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)), born: time, s: 0 }; OBJ[p.uid] = o; REG[p.uid] = { label, kind }; world.add(o); parts.push(p); return p; }
  const halo = (o, r, label) => { const h = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: colorOf(label), transparent: true, opacity: 0.3, depthWrite: false })); h.scale.setScalar(r + 0.14); o.add(h); };
  function label3d(p, mark, max) { if ((tagged[p.label] = (tagged[p.label] || 0) + 1) <= max) { const t = tag(p.label + mark); t.position.y = p.r + 0.62; p.o.add(t); p.tag = t; } }
  // Một đơn vị kết tủa dựng sẵn (khi đổi về ống đã có kết tủa): các ion của nó xếp gọn quanh nhau, giống hệt lúc chúng vừa dính lại.
  function unit(parts) { const g = new THREE.Group(), items = []; for (const [plain, n] of parts) for (let k = 0; k < n; k++) items.push(cluster(plain, true)); const sorted = items.slice().sort((a, b) => a.r - b.r), core = items.length > 2 ? sorted[0] : null, ring = items.filter((x) => x !== core), DIR = { 1: [[1, 0, 0]], 2: [[1, 0, 0], [-1, 0, 0]], 3: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]], 4: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] }[ring.length] || ring.map((_, k) => [Math.cos(k * 2.4), 0, Math.sin(k * 2.4)]); let r = 0.4;
    ring.forEach((x, k) => { const d = core ? (core.r + x.r) * 0.86 : ring.length === 2 ? (ring[0].r + ring[1].r) * 0.45 : x.r; x.g.position.set(DIR[k][0] * d, 0, DIR[k][2] * d); g.add(x.g); r = Math.max(r, d + x.r * 0.75); }); if (core) g.add(core.g); return { g, r }; }
  function spawn(label, pos, state) { const m = meta[label]; if (!m) return null; const { g, r } = m.kind === 'ppt' && m.parts ? unit(m.parts) : cluster(m.plain, m.kind === 'ion'), o = new THREE.Group(); o.add(g); o.position.copy(pos); const p = add(label, m.kind, o, r, state, g);
    label3d(p, m.kind === 'ppt' ? '↓' : m.kind === 'gas' ? '↑' : '', 1);
    if (m.kind === 'gas') { const b = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false })); b.scale.setScalar(r + 0.45); o.add(b); }
    if (m.kind === 'ppt') { m.unitR = m.unitR || r; } return p; }
  const kill = (p) => { if (p.state === 'gone') return; p.state = 'gone'; world.remove(p.o); if (p.tag) tagged[p.label] = Math.max(0, (tagged[p.label] || 1) - 1); };
  const LAT = {}; // Khối kết tủa: các đơn vị công thức xếp sát nhau theo lưới lục giác xếp chặt, lấp lớp đáy trước rồi chồng dần lên thành ụ (sơ đồ mạng tinh thể, không phải cấu trúc thật của từng chất).
  const latPos = (k, r, form) => { if (form === 'keo' || form === 'bông') { const c = latPos(k, r * 1.16), j = (n) => ((Math.sin((k + 1) * 12.9898 * n) * 43758.5453) % 1) * 0.34; return V3(c.x + j(1), c.y + Math.abs(j(2)) * 0.9, c.z + j(3)); } const sp = Math.max(0.9, 2 * r * 0.9), key = sp.toFixed(2); let L = LAT[key]; if (!L) { L = []; for (let l = 0; l < 3; l++) for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const x = (i + (Math.abs(j) % 2) * 0.5 + l * 0.5) * sp, z = (j * 0.866 + l * 0.289) * sp, q = Math.hypot(x, z); if (q > 4.1 - l * 0.9 * sp) continue; L.push({ x: x + 0.7, y: -RS * 0.8 + l * sp * 0.816, z: z * 0.8, w: q * q + (l * sp * 2.1) ** 2 + (z < 0 ? 0.3 : 0) }); } L.sort((a, b) => a.w - b.w); LAT[key] = L; } const c = L[Math.min(k, L.length - 1)]; return V3(c.x, c.y, c.z); };
  const restPos = (k) => { const ring = k === 0 ? 0 : k <= 6 ? 1 : k <= 16 ? 2 : 3, i = ring === 0 ? 0 : ring === 1 ? k - 1 : ring === 2 ? k - 7 : k - 17, n = [1, 6, 10, 14][ring], a = (i / n) * 6.283 + ring * 0.7, q = ring * 1.25; return V3(Math.cos(a) * q + 0.8, -Math.sqrt(Math.max(0.3, (RS - 1.1) ** 2 - (q + 0.8) ** 2)) + ring * 0.12, Math.sin(a) * q * 0.7); };
  const lumpPos = (k) => { const a = k * 2.4, q = 0.62 * Math.sqrt(k); return V3(-2.6 + Math.cos(a) * q, -RS + 1.75 + (k > 6 ? 0.75 : 0), Math.sin(a) * q); };
  const fitU = () => { const tot = Object.values(target).reduce((s, q) => s + (q.kind === 'solid' ? 0 : q.mmol), 0); U = UNITS.find((u) => tot / u <= 38) || 10; };
  function learn(list) { for (const q of list) if (q && q.label) { const m = meta[q.label] || (meta[q.label] = {}); m.plain = q.plain; m.kind = q.kind; m.color = q.color; if (q.tint) m.tint = q.tint; if (q.parts) m.parts = q.parts; if (q.form) m.form = q.form; } }
  const free = (o) => o.traverse((c) => { if (c.isMesh && c.material && c.material.transparent && c.geometry === SPH) c.material.dispose(); });

  // ---------- đặt lại theo một ống (đổi ống, đổ bỏ): không diễn hoạt. Phần đã ghi GIỮ LẠI, chỉ thêm một mốc cắt, nên tua lùi được qua lúc đổi ống. hard = dọn bàn: xoá hết. ----------
  function reset(pop = {}, { hard = false, who = null, mark = null } = {}) { goLive();
    if (hard) { Object.values(OBJ).forEach(free); world.clear(); OBJ = {}; REG = {}; hist = []; marks = []; } else { if (hist.length) record(); for (const p of parts) world.remove(p.o); if (hist.length) { time += REC * 2; if (mark) marks.push({ t: time, type: 'cut', text: mark }); } }
    whoNow = who; parts = []; queue = []; cxs = []; tagged = {}; rest = 0; lull = 0; acc.enter = {}; acc.evt = {}; target = pop; learn(Object.values(pop)); fitU(); let solid = 0;
    for (const q of Object.values(pop)) for (let k = 0, n = countOf(q); k < n; k++) { if (q.kind === 'ppt') { const p = spawn(q.label, V3(0, 0, 0), 'rest'); p.slot = rest++; p.o.position.copy(latPos(p.slot, meta[q.label].unitR || p.r, q.form)); } else if (q.kind === 'solid') spawn(q.label, lumpPos(solid++), 'solid'); else spawn(q.label, inside(), 'free'); }
    parts.forEach((p) => { p.s = 1; p.o.scale.setScalar(1); }); idle = 0; record(); stats(); }
  // ---------- một lần thêm chất hoặc một tác động (đun): hạt mới chảy vào từ trên, các phản ứng xếp hàng để diễn chậm ----------
  function feed({ added = [], events = [], target: pop = {} }) { goLive(); target = pop; learn(Object.values(pop)); learn(added);
    let k = 0; for (const a of added) { if (a.kind === 'solid') { const have = alive(a.label).length, n = Math.min(12 - have, Math.max(1, Math.round(a.mmol / U))); for (let i = 0; i < n; i++) { const p = spawn(a.label, V3(-2.6 + rnd(-0.6, 0.6), RS + 1.2 + i * 0.3, rnd(-0.6, 0.6)), 'enter'); p.to = lumpPos(have + i); p.from = p.o.position.clone(); p.t = -0.03 * i; p.s = 1; p.after = 'solid'; } continue; } // chất rắn rơi xuống thành một khối ở đáy
      const x = (acc.enter[a.label] || 0) + a.mmol / U, n = Math.floor(x + 1e-6); acc.enter[a.label] = x - n; for (let i = 0; i < n && parts.length < 110; i++) { const p = spawn(a.label, V3(rnd(-1.4, 1.4), RS + 1.2 + (k++) * 0.42, rnd(-1.4, 1.4)), 'enter'); p.to = inside(); p.from = p.o.position.clone(); p.t = -0.04 * i; p.s = 1; } }
    if (added.length && (!marks.length || marks[marks.length - 1].type !== 'add' || time - marks[marks.length - 1].t > 2.5)) marks.push({ t: time, type: 'add', text: 'Cho vào: ' + added.map((a) => a.label).join(', ') });
    for (const e of events) { learn(Object.values(e.species)); for (const [lab, col] of Object.entries(e.tint || {})) if (meta[lab]) meta[lab].tint = col; const x = (acc.evt[e.key] || 0) + e.mmol / U, n = Math.min(8, Math.floor(x + 1e-6)); acc.evt[e.key] = x - n; for (let i = 0; i < n && queue.length < 16; i++) queue.push({ e, wait: 0 }); }
    idle = 0; if (!nextEvt || nextEvt < time) nextEvt = time + 0.9; stats(); }
  // ---------- va chạm ngẫu nhiên (define mục 22, quy tắc 8): không hạt nào "biết đường" tìm nhau ----------
  // Mọi hạt tự do chuyển động nhiệt hỗn loạn. Hai hạt chạm nhau: nếu chúng là một cặp của phản ứng đang chờ thì dính lại thành cụm, cụm trôi tiếp
  // và nhận thêm hạt còn thiếu cho đủ hệ số (Cu²⁺ + OH⁻ rồi thêm OH⁻ nữa); đủ thì thành sản phẩm. Không phải cặp phản ứng thì bật ra (ion đứng ngoài chỉ chạm rồi rời).
  // Ion trái dấu của cặp phản ứng hút nhau ở tầm gần (lực tĩnh điện); chờ lâu quá thì tầm hút nới dần để phản ứng không kẹt.
  let cxs = [], soloT = 0, lull = 0, scaled = -99; const needOf = (e) => e.need || (e.need = Object.fromEntries(e.lhs.map((x) => [x.label, x.n])));
  const pend = (key) => queue.reduce((n, q) => n + (q.e.key === key ? 1 : 0), 0), inProg = (key) => cxs.reduce((n, c) => n + (c.e.key === key ? 1 : 0), 0);
  const isFree = (p) => p.state === 'free' && !p.cx && !p.claim, canHost = (p) => (p.state === 'free' || p.state === 'solid' || p.state === 'rest') && !p.claim;
  function active() { const seen = new Set(), out = []; for (const q of queue) if (!seen.has(q.e.key)) { seen.add(q.e.key); out.push({ e: q.e, need: needOf(q.e), cap: Math.min(pend(q.e.key) - inProg(q.e.key), (queue.length > 6 ? 3 : 2) - cxs.length) }); } return out; }
  function compat(a, b, act) { if (a.cx) return isFree(b) && (a.cx.need[b.label] || 0) > (a.cx.have[b.label] || 0); if (b.cx) return isFree(a) && (b.cx.need[a.label] || 0) > (b.cx.have[a.label] || 0);
    if (!(isFree(a) || isFree(b)) || !canHost(a) || !canHost(b) || a.label === b.label) return false; for (const v of act) if (v.cap > 0 && v.need[a.label] && v.need[b.label]) return v; return false; }
  function bind(cx, p, anchor) { lull = Math.min(lull, 1.2); p.state = 'bound'; p.host = anchor || cx.host; p.cxm = cx; p.claim = true; p.off = p.o.position.clone().sub(p.host.o.position); p.offTo = p.off.clone().setLength((p.host.r + p.r) * 0.84); cx.members.push(p); cx.have[p.label] = (cx.have[p.label] || 0) + 1; if (p.tag) { p.o.remove(p.tag); p.tag = null; tagged[p.label] = Math.max(0, (tagged[p.label] || 1) - 1); } }
  function collide(a, b, act) { let cx = a.cx || b.cx;
    // Bề mặt một khối rắn là chung (kim loại: electron chạy khắp khối): ion chạm BẤT KỲ hạt nào của khối đang phản ứng dở cũng được tính, không cần tìm đúng hạt chủ.
    if (!cx) { const sol = a.state !== 'free' ? a : b.state !== 'free' ? b : null, ion = sol === a ? b : a; if (sol && isFree(ion)) { const c2 = cxs.find((c) => c.host.state !== 'free' && c.host.label === sol.label && (c.need[ion.label] || 0) > (c.have[ion.label] || 0)); if (c2) { bind(c2, ion, sol); if (Object.keys(c2.need).every((k) => (c2.have[k] || 0) >= c2.need[k])) finish(c2); return true; } } }
    if (!cx) { const v = compat(a, b, act); if (!v) return false; const host = a.state !== 'free' ? a : b.state !== 'free' ? b : v.need[a.label] <= v.need[b.label] ? a : b, other = host === a ? b : a; if (!isFree(other)) return false;
      cx = { e: v.e, need: v.need, host, members: [], have: { [host.label]: 1 }, t: time }; host.cx = cx; host.claim = host.state !== 'free'; cxs.push(cx); bind(cx, other); }
    else { const p = a.cx ? b : a; if (!compat(a, b, act)) return false; bind(cx, p); }
    if (Object.keys(cx.need).every((k) => (cx.have[k] || 0) >= cx.need[k])) finish(cx); return true; }
  function finish(cx) { lull = 0; cxs = cxs.filter((c) => c !== cx); const pick = [cx.host, ...cx.members], at = cx.host.o.position.clone(); pick.forEach((p) => { p.cx = null; p.cxm = null; }); const k = queue.findIndex((q) => q.e.key === cx.e.key); if (k >= 0) queue.splice(k, 1);
    product({ pick, at, e: cx.e }); for (const q of Object.values(target)) if (q.kind === 'solid') for (let k = alive(q.label).length; k < countOf(q); k++) spawn(q.label, lumpPos(k), 'solid'); if (!marks.length || marks[marks.length - 1].type !== 'rx' || time - marks[marks.length - 1].t > 0.25) marks.push({ t: time, type: 'rx', text: 'Các hạt gặp nhau' }); }
  function dissolve(cx) { cxs = cxs.filter((c) => c !== cx); cx.host.cx = null; if (cx.host.state !== 'free') cx.host.claim = false; for (const p of cx.members) { p.state = 'free'; p.host = null; p.cxm = null; p.claim = false; p.offTo = null; } }
  function chemistry(dt) { cxs.filter((c) => c.host.state === 'fade' || c.host.state === 'gone').forEach(dissolve); if (!queue.length) { if (cxs.length) cxs.slice().forEach(dissolve); return; } queue[0].wait += dt;
    { const e = queue[0].e, nd = needOf(e); if (queue[0].wait > 0.6 && Object.keys(nd).some((k) => parts.filter((p) => p.label === k && p.state !== 'fade' && p.state !== 'gone' && (p.state !== 'bound' || p.cxm || (p.host && p.host.cx))).length < nd[k])) { queue = queue.filter((q) => q.e.key !== e.key); cxs.filter((c) => c.e.key === e.key).forEach(dissolve); if (!queue.length) return; } }
    const act = active();
    // phản ứng chỉ có một hạt tham gia (phân huỷ khi đun): không cần va chạm, lần lượt từng hạt biến đổi
    soloT -= dt; for (const v of act) { const ks = Object.keys(v.need); if (ks.length === 1 && v.need[ks[0]] === 1 && soloT <= 0) { const c = parts.find((p) => p.label === ks[0] && canHost(p) && !p.cx); if (c) { soloT = 0.7; c.cx = { e: v.e, need: v.need, host: c, members: [], have: { [c.label]: 1 } }; cxs.push(c.cx); finish(c.cx); return; } } }
    lull += dt; const body = parts.filter((p) => (p.state === 'free' || p.state === 'solid' || p.state === 'rest') && p.kind !== 'gas'), EL = 3.4;
    for (let i = 0; i < body.length; i++) for (let j = i + 1; j < body.length; j++) { const a = body[i], b = body[j]; if (a.state !== 'free' && b.state !== 'free') continue; const A = a.o.position, B = b.o.position, dx = A.x - B.x, dy = A.y - B.y, dz = A.z - B.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz), touch = (a.r + b.r) * 1.1;
      if (d < touch) { if (collide(a, b, act)) return; if (d > 1e-3) { const f = ((touch - d) / d) * 0.5; if (a.state === 'free') { A.x += dx * f; A.y += dy * f; A.z += dz * f; a.v.x += dx * f * 3; a.v.y += dy * f * 3; a.v.z += dz * f * 3; } if (b.state === 'free') { B.x -= dx * f; B.y -= dy * f; B.z -= dz * f; b.v.x -= dx * f * 3; b.v.y -= dy * f * 3; b.v.z -= dz * f * 3; } } continue; } // không phải cặp phản ứng: chạm rồi bật ra
      if (d < EL && a.q && b.q) { const f = ((a.q * b.q < 0 ? 2.2 : -1.3) * (1 - d / EL) * dt) / d; if (a.state === 'free') { a.v.x -= dx * f; a.v.y -= dy * f; a.v.z -= dz * f; } if (b.state === 'free') { b.v.x += dx * f; b.v.y += dy * f; b.v.z += dz * f; } }
    } // KHÔNG còn lực kéo riêng cho cặp phản ứng: hạt chỉ gặp nhau do chuyển động hỗn loạn + lực điện chung. Chờ lâu thì khung tua nhanh thời gian (warp), không dắt hạt.
    if (queue[0].wait > 45) { const key = queue[0].e.key; queue.shift(); if (!pend(key)) cxs.filter((c) => c.e.key === key).forEach(dissolve); } }
  function product({ pick, at, e }) { const ions = pick.every((p) => p.kind === 'ion'), one = e.rhs.length === 1 && e.rhs[0].kind === 'ppt' && e.rhs[0].n === 1;
    if (one && ions) { // kết tủa: chính các ion vừa gặp nhau dính lại thành một hạt rắn rồi chìm xuống (từng ion vẫn là một vật riêng, đi theo hạt rắn)
      const lab = e.rhs[0].label, o = new THREE.Group(); o.position.copy(at); const big = pick.slice().sort((a, b) => a.r - b.r), core = pick.length > 2 ? big[0] : null, ring = pick.filter((p) => p !== core), DIR = { 1: [[1, 0, 0]], 2: [[1, 0, 0], [-1, 0, 0]], 3: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]], 4: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] }[ring.length] || ring.map((_, k) => [Math.cos(k * 2.4), 0, Math.sin(k * 2.4)]);
      let r = 0.4; ring.forEach((p, k) => { const d = core ? (core.r + p.r) * 0.86 : ring.length === 2 ? (ring[0].r + ring[1].r) * 0.45 : p.r; p.offTo = V3(...DIR[k]).multiplyScalar(d); r = Math.max(r, d + p.r * 0.75); }); if (core) core.offTo = V3(0, 0, 0);
      const P = add(lab, 'ppt', o, r, 'sink'); P.s = 1; P.slot = rest++; if (meta[lab]) meta[lab].unitR = meta[lab].unitR || r; label3d(P, '↓', 1);
      pick.forEach((p) => { if (p.tag) { p.o.remove(p.tag); p.tag = null; tagged[p.label] = Math.max(0, (tagged[p.label] || 1) - 1); } p.off = p.o.position.clone().sub(at); p.host = P; p.state = 'bound'; }); return; }
    pick.forEach((p) => { p.cx = null; kill(p); }); let k = 0;
    for (const x of e.rhs) for (let i = 0; i < x.n; i++) { const a = (k++) * 2.1, p = spawn(x.label, at.clone().add(V3(Math.cos(a) * 0.5, 0.2 * i, Math.sin(a) * 0.5)), x.kind === 'ppt' ? 'sink' : x.kind === 'gas' ? 'rise' : 'free'); if (!p) continue; if (x.kind === 'ppt') p.slot = rest++; p.v.set(Math.cos(a) * 1.3, 0.5, Math.sin(a) * 1.3); } }
  // Đối chiếu với lượng thật: thiếu thì hiện thêm, thừa thì mờ dần đi. Chỉ làm khi không còn phản ứng nào đang diễn.
  function reconcile() { const labels = new Set([...Object.keys(target), ...parts.filter((p) => p.state !== 'bound').map((p) => p.label)]);
    for (const lab of labels) { const q = target[lab], want = q ? countOf(q) : 0, have = alive(lab).filter((p) => p.state !== 'rise'), kind = (q || meta[lab] || {}).kind; if (kind === 'gas') continue;
      for (let k = have.length; k < want; k++) { if (kind === 'ppt') { const p = spawn(lab, inside().multiplyScalar(0.5), 'sink'); if (p) p.slot = rest++; } else if (kind === 'solid') spawn(lab, lumpPos(alive(lab).length), 'solid'); else spawn(lab, inside(), 'free'); }
      const spare = have.filter((p) => !p.cx && !p.claim).concat(have.filter((p) => p.cx || p.claim)); for (let k = 0; k < have.length - want; k++) spare[k].state = 'fade'; } }
  // Trước khi bắt đầu một lần thêm chất: biết trước lượng sẽ có trong ống thì chốt thang ngay lúc khung còn yên, để trong lúc rót không hạt nào tự mờ đi.
  function plan(pop) { if (queue.length || parts.some((p) => p.state === 'enter')) return; const tot = Object.values(pop).reduce((a, q) => a + (q.kind === 'solid' ? 0 : q.mmol), 0), u = UNITS.find((x) => tot / x <= 38) || 10; if (u > U) { U = u; acc.enter = {}; acc.evt = {}; scaled = time; reconcile(); stats(); } }
  function stats() { if (!onStats || mode !== 'live') return; onStats(Object.values(target).map((q) => ({ label: q.label, kind: q.kind, color: colorOf(q.label), mmol: q.mmol, n: alive(q.label).length, note: q.note, form: q.form })), U, queue.length, false, time - scaled < 5); }
  let statT = 0;
  function sim(dt) { time += dt;
    chemistry(dt);
    const busy = queue.length || parts.some((p) => p.state === 'enter'); idle = busy ? 0 : idle + dt; if (idle > 0.7) { const u0 = U; fitU(); if (U !== u0) { acc.enter = {}; acc.evt = {}; scaled = time; } reconcile(); idle = -1.2; }
    for (const p of parts) { if (p.state === 'gone') continue; const P = p.o.position;
      if (p.state === 'bound') { if (p.host.state === 'gone') { kill(p); continue; } if (p.offTo) p.off.lerp(p.offTo, Math.min(1, dt * 6)); P.copy(p.host.o.position).add(p.off); p.s = p.host.s; p.o.scale.setScalar(Math.max(0.01, p.s)); continue; }
      if (p.kind !== 'ppt') { p.g.rotation.x += p.spin.x * dt * 0.6; p.g.rotation.y += p.spin.y * dt * 0.6; }
      if (p.state === 'fade') { p.s -= dt * 2.4; if (p.s <= 0) { kill(p); continue; } } else if (p.s < 1) p.s = Math.min(1, p.s + dt * 3.2); p.o.scale.setScalar(Math.max(0.01, p.s));
      if (p.state === 'enter') { p.t += dt / 1.05; if (p.t > 0) { const k = Math.min(1, p.t); P.lerpVectors(p.from, p.to, k * k * (3 - 2 * k)); if (k >= 1) p.state = p.after || 'free'; } }
      else if (p.state === 'free' || p.state === 'fade') { if (p.kind === 'ppt' || p.kind === 'solid') continue; const hot = (queue.length ? 4.2 + Math.min(3, lull * 0.7) : 1.4) * Math.sqrt(dt) * (p.label === 'H⁺' ? 1.7 : 1); /* H⁺ là ion linh động nhất trong nước nên cho chạy nhanh hơn (hệ số chọn cho hình, không phải số đo) */ p.v.x += rnd(-1, 1) * hot; p.v.y += rnd(-1, 1) * hot * 0.85; p.v.z += rnd(-1, 1) * hot; p.v.multiplyScalar(Math.max(0, 1 - dt * 1.3)); P.addScaledVector(p.v, dt); const lim = RS - 0.9 - p.r * 0.4, d = P.length(); if (d > lim) { P.multiplyScalar(lim / d); p.v.addScaledVector(P, (-1.2 * p.v.dot(P)) / (lim * lim)); } if (P.y < -RS * 0.8) { P.y = -RS * 0.8; p.v.y = Math.abs(p.v.y); } }
      else if (p.state === 'sink') { const to = latPos(p.slot || 0, (meta[p.label] && meta[p.label].unitR) || p.r, meta[p.label] && meta[p.label].form); P.x += (to.x - P.x) * dt * 1.1; P.z += (to.z - P.z) * dt * 1.1; P.y -= dt * 1.7; if (P.y <= to.y) { P.y = to.y; p.state = 'rest'; } }
      else if (p.state === 'rise') { P.y += dt * 2.5; P.x += Math.sin(time * 4 + p.born * 7) * dt * 0.5; if (P.y > RS + 1.5) kill(p); } }
    const fr = parts.filter((p) => p.state === 'free' && p.kind !== 'ppt' && p.kind !== 'solid'); for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) { const a = fr[i], b = fr[j], dx = a.o.position.x - b.o.position.x, dy = a.o.position.y - b.o.position.y, dz = a.o.position.z - b.o.position.z, d2 = dx * dx + dy * dy + dz * dz, m = (a.r + b.r) * 1.25; if (d2 < m * m && d2 > 1e-4) { if (queue.length) continue; const d = Math.sqrt(d2), f = ((m - d) / d) * 2.2 * dt * 8; a.v.x += dx * f; a.v.y += dy * f; a.v.z += dz * f; b.v.x -= dx * f; b.v.y -= dy * f; b.v.z -= dz * f; } }
    parts = parts.filter((p) => p.state !== 'gone'); statT += dt; if (statT > 0.25) { statT = 0; stats(); }
    recT += dt / Math.max(1, warp); if (recT >= REC) { recT = 0; record(); } }

  // ---------- ghi lại và tua ----------
  function record() { const a = new Float32Array(parts.length * 6); let k = 0; for (const p of parts) { if (p.state === 'gone') continue; const P = p.o.position; a[k++] = p.uid; a[k++] = P.x; a[k++] = P.y; a[k++] = P.z; a[k++] = Math.max(0.01, p.s); a[k++] = p.state === 'bound' ? 1 : p.state === 'rise' ? 2 : 0; }
    hist.push({ t: time, a: a.subarray(0, k), U, tint: tintNow, who: whoNow, w: warp });
    if (hist.length > KEEP) { hist.splice(0, 200); const keep = new Set(parts.map((p) => p.uid)); for (const f of hist) for (let j = 0; j < f.a.length; j += 6) keep.add(f.a[j]); for (const id of Object.keys(OBJ)) if (!keep.has(Number(id))) { free(OBJ[id]); delete OBJ[id]; delete REG[id]; } marks = marks.filter((m) => m.t >= hist[0].t); } }
  function applyTint(t) { if (!tintEl) return; tintEl.style.backgroundColor = t[0]; tintEl.style.opacity = t[1]; }
  function show(tp) { if (!hist.length) return; let lo = 0, hi = hist.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (hist[mid].t <= tp) lo = mid; else hi = mid - 1; }
    const A = hist[lo], B = hist[Math.min(lo + 1, hist.length - 1)]; headWho = A.who; headW = A.w || 1; const k = B.t > A.t ? Math.min(1, Math.max(0, (tp - A.t) / (B.t - A.t))) : 0; if (!B.map) { B.map = new Map(); for (let j = 0; j < B.a.length; j += 6) B.map.set(B.a[j], j); }
    for (const o of world.children) o.visible = false; const cnt = {};
    for (let j = 0; j < A.a.length; j += 6) { const uid = A.a[j], o = OBJ[uid]; if (!o) continue; if (o.parent !== world) world.add(o); const jb = B.map.get(uid); let x = A.a[j + 1], y = A.a[j + 2], z = A.a[j + 3], s = A.a[j + 4]; if (jb != null) { x += (B.a[jb + 1] - x) * k; y += (B.a[jb + 2] - y) * k; z += (B.a[jb + 3] - z) * k; s += (B.a[jb + 4] - s) * k; } else s *= 1 - k;
      o.position.set(x, y, z); o.scale.setScalar(Math.max(0.01, s)); o.visible = true; const g = REG[uid]; if (g && A.a[j + 5] === 0 && s > 0.5) cnt[g.label] = (cnt[g.label] || 0) + 1; }
    applyTint(A.tint); if (onStats) onStats(Object.entries(cnt).map(([label, n]) => ({ label, kind: meta[label] ? meta[label].kind : 'ion', color: colorOf(label), mmol: n * A.U, n })).filter((r) => r.kind !== 'gas'), A.U, 0, true); }
  function seek(t) { if (hist.length < 2) return; if (mode === 'live') { mode = 'scrub'; for (const p of parts) p.live = p.o.position.clone(); } head = Math.max(hist[0].t, Math.min(time, t)); show(head); }
  function goLive() { if (mode === 'live') return; mode = 'live'; playing = false; const liveSet = new Set(parts.map((p) => p.o)); for (const o of [...world.children]) if (!liveSet.has(o)) world.remove(o);
    for (const p of parts) { if (p.o.parent !== world) world.add(p.o); p.o.visible = true; if (p.live) p.o.position.copy(p.live); p.o.scale.setScalar(Math.max(0.01, p.s)); } applyTint(tintNow); stats(); }
  const timeline = () => ({ t0: hist.length ? hist[0].t : time, t1: time, at: mode === 'live' ? time : head, live: mode === 'live', playing, marks, busy: queue.length, who: mode === 'live' ? whoNow : headWho, warp, zoom: zoomK, n: parts.length });
  // Chờ lâu mà các hạt chưa gặp nhau thì tua nhanh thời gian (tối đa 16 lần); phát lại cũng nhanh đúng như lúc xem trực tiếp, chia nhỏ bước để va chạm vẫn đúng. Bản ghi vẫn theo thời gian mô phỏng nên phát lại thì đều tốc độ.
  function step(dt) { if (mode !== 'live') { if (playing) { head += dt * headW; if (head >= time) goLive(); else show(head); } return; } const want = queue.length ? 1 + Math.max(0, Math.min(15, (lull - 1.2) * 2.2)) : 1; warp += (want - warp) * Math.min(1, dt * 4); const n = Math.max(1, Math.ceil(warp - 0.05)); for (let k = 0; k < n; k++) sim((dt * warp) / n); }

  function size() { const r = host.getBoundingClientRect(); if (r.width < 20) return false; const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(r.width * d), h = Math.round(r.height * d); if (cv.width !== w || cv.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); } return true; }
  function render() { if (!size()) return; par.x += (par.tx - par.x) * 0.06; par.y += (par.ty - par.y) * 0.06; const c = mode === 'live' && zoomK > 1.15 && cxs.length ? cxs[0].host.o.position : null, k = 1 - 1 / Math.max(1, zoomK); if (c) foc.lerp(V3(c.x * k, c.y * k, c.z * k), 0.05); else foc.lerp(V3(0, -0.2, 0), zoomK > 1.15 ? 0.008 : 0.08); // phóng to thì máy quay bám theo cụm hạt đang gặp nhau
    camera.position.set(foc.x + par.x * 2.6 + Math.sin(time * 0.25) * 0.9, foc.y + 0.2 + par.y * 1.8 + 0.6, foc.z + (31 * Math.max(1, 1.12 / camera.aspect)) / zoomK); camera.lookAt(foc.x, foc.y, foc.z); renderer.render(scene, camera); }
  const zoom = (f) => { zoomK = f === 0 ? 1 : Math.max(0.7, Math.min(2.6, zoomK * f)); if (Math.abs(zoomK - 1) < 0.04) zoomK = 1; if (onTime) onTime(timeline()); return zoomK; };
  host.addEventListener('wheel', (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); par.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width)); par.ty = Math.max(-1, Math.min(1, -(e.clientY - (r.top + r.height / 2)) / r.height)); });
  let prev = 0, uiT = 0; const loop = (now) => { const dt = Math.min(0.1, (now - prev) / 1000 || 0); prev = now;
    step(dt);
    render(); uiT += dt; if (uiT > 0.1) { uiT = 0; if (onTime) onTime(timeline()); } requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  return { reset, feed, plan, seek, goLive, timeline, zoom, play(from) { if (hist.length < 2) return false; if (from != null || mode === 'live') seek(from != null ? from : hist[0].t); playing = true; return true; }, pause() { playing = false; },
    setTint(hex, op) { tintNow = [hex, op]; if (mode === 'live') applyTint(tintNow); },
    run: (sec) => { for (let t = 0; t < sec; t += 1 / 30) step(1 / 30); render(); if (onTime) onTime(timeline()); }, unit: () => U, busy: () => queue.length };
}
