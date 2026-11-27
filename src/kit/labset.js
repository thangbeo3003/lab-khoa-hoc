// BỘ MÁY CHUNG của Luồng 1 (LUONG_1_BAI_HOC.md mục 2.21 đến 2.23): MỘT phòng lab, NHIỀU bàn.
// Mỗi bàn là một bộ thí nghiệm đầy đủ, dựng từ TỦ ĐỒ theo tệp khai của bài (giao_an.js). Bài mới không viết lại gì ở đây.
// Ba lớp: TỦ ĐỒ (hình của từng món + động tác của chính món đó: rót, thả, xúc, châm, làm ấm, rửa)
//         → GIÁO ÁN (món nào lên bàn nào, giữ vai gì trong các việc: chuẩn bị, chọn điều kiện, khởi động, đo, ghi, làm lại)
//         → BỘ MÁY (tệp này: dựng phòng và bàn, vòng sáng cho món đến lượt, hoạt cảnh tay, trạng thái từng bàn, đồng hồ của lần chạy).
// Toạ độ của món tính theo bàn (gốc ở giữa mặt bàn). Đơn vị: 1 = 10 cm.
//
// BẢNG LỆNH B (25/11): giáo án (chem.frame, chem.show, các việc) chỉ được gọi những lệnh dưới đây, KHÔNG chạm vật thể 3D (obj, userData, scale...).
// Bộ máy 2D sau này dựng lại đúng bảng lệnh này là chạy được cùng một tệp giáo án.
//   B.tag(id, chữ)            đổi chữ trên nhãn của món id
//   B.clock(giây)             đặt số trên đồng hồ bấm giây của bàn
//   B.read(id)                đọc lượng đang có trong món đo id (ống đong: mL), 0 nếu chưa có
//   B.gas(id, mL)             đặt lượng khí trong bộ thu khí id (xi-lanh đo khí)
//   B.vessel[id].tint(màu, k, { opacity, rough })  màu dung dịch: k = 0 nước trong, k = 1 đúng màu. opacity, rough là gợi ý riêng của 3D (độ đục, độ nhám), bộ máy 2D được bỏ qua
//   B.vessel[id].solid(k)     phần chất rắn còn lại trong bình, k từ 0 tới 1 (gần 0 thì ẩn hẳn)
//   B.vessel[id].bubbles = k  độ sủi bọt, k từ 0 tới 1
//   B.vessel[id].look(hex, opacity)  đặt thẳng màu dung dịch theo mã màu chuỗi (ví dụ kết quả look(t).hex của kho hoá học free/tubechem.js)
//   B.switch(id, bật)         bật/tắt một món có công tắc: quạt tủ hút (hood), khoá phễu nhỏ giọt (dropfunnel)
//   B.fizz(id, k)             sủi bọt trong bình cầu, bình rửa khí, cốc (k từ 0 tới 1)
//   B.haze(id, k, hex)        khí có màu đầy trong một món (bình thu khí, cả tủ hút khi khí thoát ra), k từ 0 tới 1
//   B.flow(k, hex)            khí chạy trong các ống dẫn khí của bàn (bàn khai pipes), k từ 0 tới 1
//   B.meter(id, k)            kim đồng hồ khí độc (gasmeter) từ 0 tới 1: dưới 0,4 An toàn, tới 0,75 Cảnh báo, trên nữa Nguy hiểm
//   B.screen(id, cảnh)        cảnh của tivi phản ứng (redoxtv): { a, b, react, products, title, note }, null = chờ chọn
//   B.say(chữ)                hiện một dòng báo ở đỉnh cảnh
//   B.pipe(từ, tới, nối)      hiện hoặc cất đoạn ống dẫn khí giữa hai món (bàn khai pipesOff: true thì ban đầu chưa nối đoạn nào)
//   B.vessel[id].ppt(k, hex)  lớp kết tủa dưới đáy ống (k từ 0 tới 1, 0 = không có)
//   B.home(id, ...)           đặt các món về chỗ cũ ngay
//   B.undo(việc, ...)         bỏ dấu "đã làm" của các việc (để làm lại, ví dụ xếp hạng sai)
//   B.data                    chỗ giáo án tự cất trạng thái của bàn (ống nghiệm của kho hoá học, quạt bật hay tắt...); xoá sạch mỗi lần bàn về đầu
//   B.level, B.st, B.run, B.solo, B.opts   chỉ đọc: mức đang đặt, việc đã làm, lần chạy, chế độ một bình, tuỳ chọn bài học đặt cho bàn (lab.setup)
// KHAI (không phải lệnh):
//   việc 'drop' khai chất rắn được thả bằng solid: { chem, form, size, color, scale, rot } (chem = mã chất trong kho, ví dụ 'Mg'; không có chem thì là đá vôi theo form
//   'vien' | 'vun' ghi ở pieces; size là số hoặc hàm (B) => số; scale, rot = { x, y, z } là gợi ý riêng của 3D). Bộ máy tự dựng, giáo án không gọi hàm dựng hình.
//   bàn khai init(B) (chạy mỗi lần bàn về đầu: đổ sẵn dung dịch vào ống của kho hoá học...), touch(B, id) (chạm món: trả về lời nhắc thì chặn), pipes: [[từ, tới], ...] ống dẫn khí giữa hai món.
//   món khai thêm (26/11): role (một dòng vai trò, hiện khi chạm món), show(B) (món chỉ hiện khi hàm trả về true; tính lại mỗi lần bàn về đầu, theo B.opts.step của bài).
//   guard(B, o) nhận thêm lựa chọn o (ví dụ lọ nào đang được đặt lên kệ). Thứ tự khi việc xong: đánh dấu đã làm, ghi mức (B.level), rồi mới chạy apply.
//   lab.preset chạy xong ngay cả các lần chạy (role 'start'), để dựng lại bàn khi nạp lại trang. lab.on('act', (bàn, việc, k)) báo mỗi việc vừa xong (k = số thứ tự lựa chọn hoặc con số tự chọn); lab.on('rinse', bàn).
//   việc khai thêm: apply(B, o) chạy khi việc xong (gọi kho hoá học, đặt màu, cất kết quả); guard(B) trả về lời nhắc thì chặn việc; free: true làm được cả khi đang chạy;
//   verb mới: 'press' (bấm công tắc), 'drip' (lọ nhỏ giọt tới miệng ống, nhỏ vài giọt: into = [id ống]), 'move' (nhấc món ra chỗ away [x, z] rồi đặt lại), 'none' (không hoạt cảnh).
//   chem.frame trả về { done: true, end: true } thì lần chạy KẾT THÚC hẳn (bàn làm tiếp được, không cần rửa).
//   lab.mode3d = { room, props, overview }: phần chỉ có nghĩa ở 3D (căn phòng ảnh, đồ tạo không khí, khung toàn cảnh). view của bàn và at của món vẫn nằm ở chỗ cũ.
// LUẬT THAO TÁC 26/11 (lab_khoa_hoc_20261118/LUAT_THAO_TAC.md, T1 đến T11, H1 đến H8). Lệnh mới và khai mới, bộ máy 2D theo cùng nghĩa:
//   B.vessel[id].mL(x)        đặt mực dung dịch theo thể tích thật x mL (CABINET.tube.ml = 15 mL ở mức đầy của hình). Không phóng to thể tích (H2): thấy rõ nhờ cận cảnh.
//   món 'dropper' khai opts.pip: true = lọ có ỐNG HÚT rút ra được (lọ đứng yên, chỉ ống hút đi); opts.clear: true = lọ thuỷ tinh trong (dung dịch muối), không có thì lọ nâu.
//   việc verb 'drip' với nguồn là lọ opts.pip (T1, T2): rút ống hút thẳng lên, đưa tới ngay trên miệng ống into[0], thẳng đứng, đầu ống hút cách miệng 0,7 cm, không chạm;
//     nhỏ giọt: số giọt = o.v (việc có range) hoặc count(B) (khai) hoặc n; 5 giọt đầu cách 0,28 s, sau nhanh dần, cả loạt giọt sau giọt 6 gói trong 1 s;
//       mỗi giọt dropMl mL (khai, mặc định 0,05 = DROP_ML của kho); bộ đếm "Tên lọ · 7/20 giọt" cạnh ống; mực ống dâng theo từng giọt; giọt có màu drop (khai, mã màu chuỗi).
//     ml: x (khai) = lấy x mL bằng ống hút, mỗi lần hút drawMl mL (mặc định 1): hút trong lọ, đưa tới, bóp thành dòng nhỏ, bộ đếm "1 mL", "2 mL", trả về lọ, hút lần nữa.
//     during(B, o, k) (khai): gọi mỗi khi lượng trong ống đổi, k từ 0 tới 1, để giáo án đổi màu dần theo kho hoá học (chỉ gọi lệnh B). Xong luôn trả ống hút về ĐÚNG lọ.
//   bàn khai rinse.waste = id cốc thải (món 'beaker', opts.sort để xếp thứ tự vẽ): Làm lại theo T8: đổ dung dịch vào cốc thải (dòng đúng màu, mực cốc thải dâng, màu hoà theo
//     thể tích; cốc thải giữ qua các lần làm lại, sức chứa rinse.wasteMl mặc định 50 mL) → ra vòi, nước máy chảy, hứng rồi đổ đi 2 lần → tráng nước cất bằng bình tia → về giá.
//   bàn khai closeup: true = CẬN CẢNH (H1, H2): lúc ống hút đang làm việc hoặc lúc làm lại, khung tự phóng tới cụm món đang dùng (lọ, ống, đỉnh ống hút; hoặc ống, cốc thải,
//     vòi, bình tia), xong (và hết lần chạy ngắn sau đó) thì lùi về khung chuẩn. Người dùng tự xoay hoặc phóng thì thôi. Chỉ màn từ 900 px (màn hẹp chưa có, xem H8).
//   món 'rack' và 'sink' khai opts.photo: true = giá gỗ và chậu có vòi theo ảnh assets/flat (H7, cùng bộ đồ với 2D). Món 'beaker' khai opts.h (cỡ cốc), opts.fill (mực ban đầu).
import * as THREE from 'three';
import { createStage } from './stage.js';
import { makeRoom, makeIsland } from './room.js';
import { QUALITY, PAL, solidMat, liquidMat } from './materials.js';
import { makeFlask, makeTestTube, makeBottle, makeWatchGlass, makeSolid, makeHotplate, makeTube } from './labware.js';
import { makeSchoolRack, makeAlcoholLamp, makeDropperBottle, makeSpatula, makeChemSolid, makeTubeHolder, makeWashBottle, makeBeaker } from './labware2.js';
import { makeHood, makeStand, makeSideFlask, makeDropFunnel, makeGasWash, makeBeakerPhoto, makeGasMeter, makeRedoxTV, makeShelf, makeDropPip, makeRackPhoto, makeSinkPhoto } from './labware_l1.js';
import { makeXPaper, makeTimer, makeFocusRing, makeParticleLens, makeGasSyringe, makeSink, makeThermometer, makePost, makeMeasuringCylinder, makeBalance, makeStool, makeCoatStand, makeTrolley, makeParticleTV } from './labware_l1.js';
import { Bubbles } from './fx.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const ease = (k) => k * k * (3 - 2 * k), lin = (k) => k;
const STONE = 0x8d8676; // đá vôi xám be: trên mặt bàn sáng và trong dung dịch đều thấy rõ
const WATER = new THREE.Color(PAL.water), TMP = new THREE.Color();
const SY = 2.25; // độ cao trục xi-lanh đo khí

// ---------- Món ghép sẵn ----------
// Bộ đo khí của MỘT bình: xi-lanh nằm ngang trên trụ đỡ + nút cao su có ống dẫn. Đặt cùng chỗ với bình. dir = phía xi-lanh chìa ra.
function makeGasRig({ dir = 1 } = {}) {
  const g = new THREE.Group(), dark = solidMat(PAL.metalDark, 0.55);
  const syringe = put(makeGasSyringe({ dir }), dir * 0.45, SY, 0);
  const post = put(makePost({ h: SY + 0.45 }), dir * 1.15, 0, -0.42);
  const arm = put(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.3), dark), dir * 1.15, SY, -0.28);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.026, 10, 28), dark); ring.rotation.y = Math.PI / 2; put(ring, dir * 1.15, SY, 0);
  const P = V3(dir * 0.13, SY, 0), plug = put(new THREE.Group(), P.x, P.y, P.z); // nút + ống dẫn xoay quanh đầu vòi xi-lanh để mở miệng bình
  const stopper = put(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.26, 28), solidMat(PAL.rubber, 0.85)), -P.x, 1.49 - SY, 0); stopper.castShadow = true;
  plug.add(stopper, makeTube([[0, 1.58], [0, SY - 0.34], [dir * 0.04, SY - 0.1], [dir * 0.13, SY]].map(([x, y]) => [x - P.x, y - P.y, 0]), 0.028));
  g.add(syringe, post, arm, ring, plug);
  g.userData = { setVolume: syringe.userData.setVolume, setOpen: (k) => { plug.rotation.z = dir * 0.8 * k; g.userData.open = k; }, open: 0 };
  return g;
}
// Kẹp gỗ giữ một ống nghiệm thẳng đứng phía trên đèn cồn, cán kẹp gác lên trụ đỡ phía sau. y = độ cao chỗ kẹp.
function makeClamp({ y = 2.55 } = {}) {
  const g = new THREE.Group(), holder = makeTubeHolder(), wrap = new THREE.Group();
  holder.rotation.x = Math.PI / 2; wrap.rotation.y = Math.PI / 2; wrap.position.y = y; wrap.add(holder);
  g.add(put(makePost({ h: y + 0.45 }), 0.22, 0, -1.0), wrap, put(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.12), solidMat(PAL.metalDark, 0.55)), 0.1, y, -1.0));
  return g;
}
// Mặt kính đồng hồ có sẵn chất rắn: form = 'vien' | 'vun' (đá vôi) hoặc chem = mã chất trong kho (ví dụ 'Mg'), n = số mẩu.
function makeDish({ form = null, chem = null, n = 1 } = {}) {
  const d = makeWatchGlass(), U = d.userData;
  U.setContent = (on) => {
    U.holder.clear(); if (!on) return;
    if (form) U.holder.add(makeSolid(form, { color: STONE }));
    if (chem) for (let i = 0; i < n; i++) { const m = makeChemSolid(chem); m.position.set((i - (n - 1) / 2) * 0.2, 0, (i % 2) * 0.12 - 0.06); m.rotation.y = 0.3 + i * 0.7; U.holder.add(m); }
  };
  U.setContent(true);
  return d;
}

// ---------- TỦ ĐỒ ----------
// make: dựng hình. r: bán kính vòng sáng dưới chân món (có r = chạm được). top: độ cao đặt nhãn. vessel: món chứa phản ứng.
import { applyGlassLook } from './glasslook.js';
export const CABINET = {
  flask: { make: () => makeFlask(), r: 0.6, top: 1.5, vessel: true },
  tube: { make: () => makeTestTube({ h: 1.6, r: 0.08 }), r: 0.34, top: 1.66, vessel: true, ml: 15 }, // ml: số mL khi dung dịch tới mức đầy của hình (lòng ống Ø 14 mm: 1 mL cao 6,5 mm)
  bottle: { make: (o) => makeBottle(o), r: 0.5, top: 1.3 },
  jar: { make: (o) => makeBottle({ h: 0.8, r: 0.33, fill: 0.5, wide: true, contentOpacity: 1, ...o }), r: 0.48, top: 1.05 },
  dropper: { make: (o) => (o.pip ? makeDropPip(o) : makeDropperBottle(o)), r: 0.42, top: 1.05 }, // opts.pip: lọ có ống hút rút ra được (luật thao tác T1, T2); opts.clear: lọ thuỷ tinh trong
  dish: { make: (o) => makeDish(o), r: 0.55, top: 0.26 },
  spatula: { make: () => makeSpatula(), r: 0.42, top: 0.2 },
  lamp: { make: () => makeAlcoholLamp(), r: 0.5, top: 1.3 },
  hotplate: { make: () => { const p = makeHotplate(); p.scale.setScalar(0.7); return p; }, r: 0.95, top: 0.5 },
  timer: { make: () => makeTimer(), r: 0.5, top: 0.58 },
  sink: { make: (o) => (o.photo ? makeSinkPhoto(o) : makeSink(o)), r: 0.95, top: 1.9 }, // opts.photo: chậu và vòi theo ảnh assets/flat (như 2D)
  wash: { make: () => makeWashBottle(), r: 0.42, top: 1.72 }, // bình tia nước cất: tráng dụng cụ sau khi rửa
  cylinder: { make: (o) => makeMeasuringCylinder({ r: 0.15, h: 2.1, max: 100, ...o }), r: 0.42, top: 2.15 }, // ống đong 100 mL
  balance: { make: () => makeBalance(), r: 0.82, top: 0.42 }, // cân điện tử
  xpaper: { make: (o) => makeXPaper(o) },
  rack: { make: (o) => (o.photo ? makeRackPhoto(o) : makeSchoolRack()) }, // opts.photo: giá gỗ theo ảnh assets/flat (như 2D)
  thermo: { make: (o) => makeThermometer(o) },
  gasrig: { make: (o) => makeGasRig(o), top: SY + 0.27 },
  clamp: { make: (o) => makeClamp(o) },
  lens: { make: (o) => makeParticleLens(o), tick: true, top: 3.7 },
  tv: { make: (o) => makeParticleTV(o), tick: true, top: 3.6 }, // tivi treo tường chiếu mô hình hạt
  // thêm 26/11 cho bài Nhóm halogen (đồ thuỷ tinh dùng ảnh assets/flat, xem labware_l1.js)
  hood: { make: (o) => makeHood(o), r: 0.6, top: 5.9, tick: true }, // tủ hút: chạm để bật/tắt quạt
  stand: { make: (o) => makeStand(o) },
  sideflask: { make: (o) => makeSideFlask(o), r: 0.5, top: 1.5, tick: true }, // bình cầu có nhánh (chạm được: nối ống)
  dropfunnel: { make: (o) => makeDropFunnel(o), r: 0.36, top: 1.4, tick: true }, // phễu nhỏ giọt: chạm để mở/khoá
  gaswash: { make: (o) => makeGasWash(o), r: 0.42, top: 1.2, tick: true }, // bình rửa khí (chạm được: nối ống)
  beaker: { make: (o) => makeBeakerPhoto(o), r: 0.5, top: 0.95, tick: true }, // cốc
  gasmeter: { make: (o) => makeGasMeter(o), top: 1.8 }, // đồng hồ khí độc trong phòng
  redoxtv: { make: (o) => makeRedoxTV(o), tick: true, top: 3.6 }, // tivi chiếu một cặp chất gặp nhau
  shelf: { make: (o) => makeShelf(o), top: 0.3 }, // kệ xếp hạng 3 ô (sáng lime khi xếp đúng: B.switch)
};

// ĐỒ TẠO KHÔNG KHÍ: đặt quanh phòng, không chạm được, không thuộc bàn nào (giáo án khai ở mode3d.props = [{ kind, at: [x, z], ry }]).
export const PROPS = { stool: makeStool, coatstand: makeCoatStand, trolley: makeTrolley };
const FLOOR_Y = -9; // độ cao sàn so với mặt bàn (room.js)

// Chuỗi động tác chạy theo thời gian của khung hình (không dùng hẹn giờ). flush(): làm xong ngay phần còn lại.
function makeSeq() {
  let q = null;
  const api = {
    play(steps, onDone) { q = { steps, i: 0, t: 0, onDone }; if (steps[0].start) steps[0].start(); },
    tick(dt) {
      while (q) {
        const st = q.steps[q.i]; q.t += dt;
        const k = Math.min(1, q.t / st.dur); if (st.fn) st.fn((st.ease || ease)(k));
        if (k < 1) break;
        dt = q.t - st.dur; q.i++; q.t = 0;
        if (q.i >= q.steps.length) { const d = q.onDone; q = null; if (d) d(); break; }
        if (q.steps[q.i].start) q.steps[q.i].start();
      }
    },
    flush() { let n = 0; while (q && n++ < 50) api.tick(1e3); },
    busy: () => !!q,
  };
  return api;
}

export function createLab(host, decl) {
  QUALITY.fresnel = true; QUALITY.edge = true; // thuỷ tinh: giữa thân trong, mép đậm
  const M3 = decl.mode3d || decl; // phần chỉ có nghĩa ở 3D (room, props, overview); giáo án cũ khai thẳng ở decl vẫn đọc được
  const stage = createStage(host, { leader: true, oversample: decl.oversample ?? 1.75, smooth: true, maxRatio: 1.75 }), { scene } = stage; // vẽ dày gấp 1,75 lần điểm ảnh thật: thuỷ tinh nét hơn, bớt lấp lánh
  const WALL = decl.wall ?? 0x768297, TOP = (M3.room && M3.room.top) ?? decl.top ?? 0x929dab; // nền tối hơn dụng cụ một bậc (chủ 19/11)
  scene.background.set(WALL);
  // mode3d.room = { photo: thư mục ảnh bốn bức tường } thì phòng dùng ảnh phòng lab thật (như bản 1); không khai thì phòng trơn.
  const ROOM = M3.room || {}, room = makeRoom({ kind: 'plain', wall: WALL, photo: ROOM.photo || null, hd: !stage.mobile });
  scene.add(room);
  // Tường ảnh hơi tối lại khi áp sát một bàn, để dụng cụ thuỷ tinh nổi lên trên nền nhiều chi tiết
  const wallMats = []; if (ROOM.photo) room.traverse((o) => { if (o.material && o.material.isMeshBasicMaterial && o.material.map) wallMats.push(o.material); });
  let wallK = 1;
  stage.setEnvironment('./assets/env/pano_lab.jpg');

  const benches = {}, list = [], updaters = [], cb = {};
  let active = null, names = true, hands = true, handsMsg = '', tagFocus = false, tagT = 0;
  const say = (t) => { if (cb.say) cb.say(t); };
  const emit = (B) => { syncRings(B); if (B.d.chem && B.d.chem.show) B.d.chem.show(B); if (cb.change) cb.change(B.id); };

  // ---------- Món chứa phản ứng (bình, ống nghiệm) ----------
  function makeVessel(item) {
    const o = item.obj, U = o.userData, flask = item.kind === 'flask', liquid = U.liquid;
    if (!flask) U.setLevel(U.fullLevel ?? 0.62);
    const level = U.level, H = flask ? U.H : U.h, R = flask ? U.RN : U.r;
    liquid.material.transparent = true; liquid.renderOrder = 3;
    const solids = new THREE.Group(); solids.position.y = flask ? 0.055 : 0.12; o.add(solids);
    const pptM = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.6, flask ? 0.08 : 0.16, 20), solidMat(0x2f2a33, 0.9)); pptM.geometry.translate(0, (flask ? 0.08 : 0.16) / 2, 0); pptM.position.y = flask ? 0.05 : 0.07; pptM.visible = false; pptM.renderOrder = 4; o.add(pptM);
    const powder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.035, 24), solidMat(0x1c1c1e, 1)); powder.position.y = 0.065; powder.visible = false; o.add(powder);
    const n = flask ? 54 : 24, bub = new Bubbles(stage.mobile ? Math.round(n * 0.6) : n, flask ? { y0: 0.08, y1: level - 0.01, radius: U.rAt } : { y0: 0.12, y1: level - 0.01, radius: () => R * 0.75 }, { size: flask ? 0.03 : 0.016 });
    bub.mesh.renderOrder = 5; bub.mesh.material.opacity = 0.95; o.add(bub.mesh);
    const v = {
      item, o, liquid, solids, powder, H, R, level, fill: 0, bubbles: 0,
      setFill(k) {
        v.fill = k; liquid.visible = k > 0.01;
        if (U.fillToHeight) U.fillToHeight(level * k);
        else liquid.scale.y = Math.max(k, 0.01);
      },
      mL(x) { v.setFill(x / (item.K.ml || 15)); }, // đặt mực theo thể tích thật (mL): không phóng to thể tích (luật hiển thị H2)
      mouth: () => V3(o.position.x, o.position.y + H, o.position.z),
      surfaceY: () => o.position.y + level * Math.max(v.fill, 0.06),
      // k: 0 = nước trong, 1 = đúng màu color. opacity, rough: độ đục và độ nhám ở k = 1 (gợi ý riêng của 3D)
      tint(color, k, { opacity = 0.5, rough = 0.05 } = {}) { const m = liquid.material; m.color.copy(WATER).lerp(TMP.set(color), k); m.opacity = 0.5 + (opacity - 0.5) * k; m.roughness = 0.05 + (rough - 0.05) * k; m.envMapIntensity = rough > 0.4 ? 1.2 - k : 1.2; },
      // Phần chất rắn còn lại trong bình (k từ 0 tới 1): mẩu rắn nhỏ dần theo căn bậc ba của lượng còn lại, gần hết thì ẩn hẳn
      solid(k) { solids.visible = k > 0.004; solids.scale.setScalar(Math.max(0.08, Math.cbrt(Math.max(k, 0)))); },
      look(hex, opacity = 0.5) { const m = liquid.material; m.color.set(hex); m.opacity = Math.max(0.35, Math.min(0.92, opacity)); m.roughness = 0.05; m.envMapIntensity = 1.2; }, // màu theo kho hoá học (mã màu chuỗi)
      ppt(k, hex) { pptM.visible = k > 0.01; pptM.scale.y = Math.max(0.05, Math.min(1, k)); if (hex) pptM.material.color.set(hex); }, // lớp kết tủa dưới đáy
      clear() { v.tint(0xffffff, 0); solids.clear(); solids.scale.setScalar(1); solids.visible = true; powder.visible = false; v.bubbles = 0; v.ppt(0); },
    };
    updaters.push((dt) => bub.update(dt, v.fill > 0.5 ? v.bubbles : 0));
    return v;
  }

  // ---------- Dựng một bàn từ tệp khai ----------
  function build(d) {
    const root = put(new THREE.Group(), d.at[0], 0, d.at[1]); scene.add(root);
    // d.island === false: chỗ này không có bàn (ví dụ tivi treo tường); cả cụm vẫn chạm được để tới gần
    if (d.island === false) stage.pickable(root, d.id); else { const island = makeIsland({ w: d.w || 8.4, d: d.d || 4.6, top: d.top ?? TOP }); root.add(island); stage.pickable(island, d.id); }
    const g = new THREE.Group(); root.add(g); // dụng cụ của bàn (mờ đi khi đang xem bàn khác)
    const B = { id: d.id, d, root, g, items: {}, vessel: {}, rings: {}, tags: [], st: {}, level: { ...(d.ref || {}) }, off: new Set((d.steps || []).filter((s) => s.off).map((s) => s.id)), run: null, seq: makeSeq(), loaded: false, rinsing: false, picks: true, solo: null, want: {}, tagEls: {}, pulse: {} }; // want: con số học sinh đang đặt cho các việc có lượng tự chọn (giữ qua lần rửa)
    B.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 1, 10), liquidMat(PAL.water, 0.75)); B.stream.visible = false; B.stream.renderOrder = 3; g.add(B.stream);
    const shownText = {}; B.tag = (itemId, text) => { if (shownText[itemId] !== text) { shownText[itemId] = text; stage.setTag(d.id + '/' + itemId, { text }); } }; // chỉ ghi lại khi chữ đổi
    // BẢNG LỆNH B (xem đầu tệp): đồng hồ, đọc món đo, bộ thu khí
    B.clock = (t) => { const it = Object.values(B.items).find((x) => x.kind === 'timer'); if (it) it.obj.userData.setTime(t); };
    B.read = (id) => { const it = B.items[id]; return (it && it.obj.userData.mL) || 0; };
    B.gas = (id, mL) => { const it = B.items[id]; if (it) it.obj.userData.setVolume(mL); };
    const U_ = (id) => (B.items[id] ? B.items[id].obj.userData : {});
    B.switch = (id, on) => { const U = U_(id); if (U.setOn) U.setOn(!!on); };
    B.fizz = (id, k) => { const U = U_(id); if (U.setFizz) U.setFizz(k); };
    B.meter = (id, k) => { const U = U_(id); if (U.set) U.set(k); };
    B.screen = (id, sc) => { const U = U_(id); if (U.setScene) U.setScene(sc); };
    B.haze = (id, k, hex) => { const it = B.items[id]; if (it) hazeOf(it).set(k, hex); };
    B.flow = (k, hex) => B.pipes.forEach((p) => p.set(k, hex));
    B.say = (t) => say(t); B.data = {}; B.opts = {}; B.pipes = [];
    B.pipe = (a, b, on) => { const p = B.pipes.find((x) => x.key === a + '>' + b); if (p) p.show(on); };
    B.home = (...ids) => ids.forEach((id) => { const it = B.items[id]; if (it) { it.obj.position.copy(it.home); it.obj.rotation.set(0, it.spec.ry || 0, 0); } });
    B.undo = (...sids) => sids.forEach((sid) => { delete B.st[sid]; });
    d.items.forEach((it) => {
      const K = CABINET[it.kind], obj = (it.make3d || K.make)(it.opts || {}, K), a = it.at, pos = a.length === 3 ? V3(a[0], a[1], a[2]) : V3(a[0], 0, a[1]);
      obj.position.copy(pos); if (it.ry) obj.rotation.y = it.ry;
      if (it.opts && it.opts.label === false && obj.userData.label) obj.userData.label.visible = false; // lọ không nhãn (bình thu khí: để thấy khí bên trong)
      (it.in ? B.items[it.in].obj : g).add(obj);
      const touch = !!K.r && it.pick !== false, item = { id: it.id, kind: it.kind, K, obj, home: pos.clone(), spec: it, touch, pickOn: touch };
      B.items[it.id] = item;
      if (it.kind === 'spatula') { // chủ 21/11 ("thìa k ai để ở bàn cả"): thìa không nằm trên mặt bàn mà cắm trong một cốc thuỷ tinh khô: lòng thìa ở đáy cốc, cán tựa miệng cốc
        const dir = V3(Math.cos(it.ry || 0), 0, -Math.sin(it.ry || 0)), cup = makeBeaker(); // dir: hướng cán thìa trên mặt bàn
        cup.position.copy(pos).addScaledVector(dir, 0.13); cup.rotation.y = (it.ry || 0) + Math.PI; g.add(cup); stage.pickable(cup, d.id + '/' + it.id); // mỏ cốc quay về phía ngược cán
        item.home.y = 0.045; item.up = item.home.clone().setY(0.95); item.rest = 1.05; obj.position.copy(item.home); obj.rotation.z = item.rest; // up: điểm nhấc thìa ra khỏi cốc; rest: góc dựng cán (rad)
        updaters.push((dt) => { // ở trong cốc thì cán dựng lên; mang đi thì thìa ngả gần ngang để giữ bột
          const dx = obj.position.x - item.home.x, dz = obj.position.z - item.home.z, goal = dx * dx + dz * dz < 0.0025 ? item.rest : 0.3;
          if (obj.rotation.z !== goal) { obj.rotation.z += (goal - obj.rotation.z) * Math.min(1, dt * 10); if (Math.abs(goal - obj.rotation.z) < 0.004) obj.rotation.z = goal; }
        });
      }
      if (K.vessel) B.vessel[it.id] = makeVessel(item);
      if (touch) { stage.pickable(obj, d.id + '/' + it.id); const ring = put(makeFocusRing(d.color, K.r), pos.x, it.ringY ?? 0.014 /* ringY: món đứng trên giá nâng thì vòng sáng nằm ở mặt giá */, pos.z); g.add(ring); B.rings[it.id] = ring; }
      if (it.tag) {
        const off = it.tagAt ? V3(...it.tagAt) : item.rest ? V3(Math.cos(it.ry || 0) * 0.5, 1.5, -Math.sin(it.ry || 0) * 0.5) : V3(0, K.top || 1, 0), w = V3(), id = d.id + '/' + it.id; // thìa dựng trong cốc: nhãn ở phía trên cán
        const el = stage.addTag(id, it.tag, () => obj.getWorldPosition(w).add(off), { color: d.color, onClick: touch ? () => hand(B, it.id) : undefined });
        el.classList.add('is-part'); if (!touch) el.tabIndex = -1;
        B.tags.push([id, it.id]); B.tagEls[it.id] = el; item.tagOff = off;
      }
      if ((K.tick || it.opts?.photo) && obj.userData.update) updaters.push((dt) => obj.userData.update(dt));
      if (it.kind === 'lamp') { let tt = 0; updaters.push((dt) => { tt += dt; obj.userData.flicker(tt); }); }
    });
    (d.pipes || []).forEach(([a, b]) => { if (B.items[a] && B.items[b]) { const p = makePipe(B, B.items[a], B.items[b]); p.key = a + '>' + b; B.pipes.push(p); } }); // ống dẫn khí nối hai món
    const vs = Object.values(B.vessel); B.cx = vs.length ? vs.reduce((s, v) => s + v.item.home.x, 0) / vs.length : 0;
    // Nhãn tên bàn cho toàn cảnh
    stage.addTag(d.id, d.name, V3(d.at[0], d.tagY || 3.3, d.at[1]), { color: d.color, onClick: () => cb.pick && cb.pick(d.id) });
    const mkView = (v) => ({ swing: 38, elMin: 5, elMax: 58, ...v, target: [d.at[0] + v.target[0], v.target[1], d.at[1] + v.target[2]], fov: v.fov || 28 });
    B.view = mkView(d.view); B.viewSolo = d.viewSolo ? mkView(d.viewSolo) : B.view;
    benches[d.id] = B; list.push(B);
    reset(B);
  }

  // ---------- Trạng thái một bàn ----------
  function reset(B) {
    // atBy(B) (27/11): món đổi chỗ theo bước của bài (cùng một ống đứng ở lỗ khác nhau giữa các bước); trả [x, z] hoặc [x, y, z], trả null thì giữ chỗ cũ
    Object.values(B.items).forEach((it) => { const p = it.spec.atBy && it.spec.atBy(B); if (p) { it.home.set(p[0], p.length === 3 ? p[1] : 0, p[p.length - 1]); it.obj.position.copy(it.home); } });
    B.st = {}; B.level = { ...(B.d.ref || {}) }; B.run = null; B.loaded = false; B.rinsing = false; B.stream.visible = false; B.pulse = {}; if (B.counter) count(B, null); (B.streams || []).forEach((st) => { st.visible = false; });
    Object.entries(B.tagEls).forEach(([id, el]) => { stage.setTag(B.id + '/' + id, { done: false }); el.classList.remove('is-pop'); });
    Object.values(B.vessel).forEach((v) => { v.o.position.copy(v.item.home); v.o.rotation.z = 0; v.clear(); v.setFill(B.d.prefill ? 1 : 0); });
    Object.values(B.items).forEach((it) => {
      const U = it.obj.userData;
      if (!it.K.vessel) it.obj.position.copy(it.home);
      if (it.kind === 'spatula') { it.obj.rotation.x = 0; if (it.rest) it.obj.rotation.z = it.rest; }
      if (it.kind === 'bottle' || it.kind === 'jar' || it.kind === 'dropper') { it.obj.rotation.z = 0; U.cap.visible = true; if (U.shadow) U.shadow.visible = true; }
      if (U.pip) { U.pip.position.set(0, U.seat, 0); U.setOut(false); U.setLoad(0); } // ống hút về đúng lọ của nó
      if (it.kind === 'dish') { U.setContent(true); U.holder.scale.setScalar(1); }
      if (it.kind === 'cylinder') { it.obj.rotation.x = 0; U.setVolume(0); }
      if (it.kind === 'balance') U.setValue(null);
      if (it.kind === 'spatula') U.holder.clear();
      if (it.kind === 'lamp') U.capOn();
      if (it.kind === 'gasrig') { U.setVolume(0); U.setOpen(1); }
      if (it.kind === 'timer') U.setTime(0);
      if (it.kind === 'thermo' || it.kind === 'hotplate') U.setTemp(25);
      if (it.kind === 'sink') U.setFlow(false);
      if (U.setOn) U.setOn(false); if (U.setFizz) U.setFizz(0); if (it.kind === 'gasmeter') U.set(0); if (U.setScene) U.setScene(null); if (it.haze) it.haze.set(0);
    });
    B.pipes.forEach((p) => { p.show(!B.d.pipesOff); p.set(0); }); B.data = {}; if (B.d.init) B.d.init(B);
    Object.values(B.items).forEach((it) => { if (it.spec.show) it.obj.visible = !!it.spec.show(B); }); // món chỉ dùng ở bước khác thì cất đi
  }
  // Khí có màu đầy trong một món: khối trụ (hoặc hộp) mờ nằm gọn trong hình của món, dựng lúc cần lần đầu.
  function hazeOf(it) {
    if (it.haze) return it.haze;
    const o = it.obj, box = new THREE.Box3(), tmp = new THREE.Box3(), p = o.getWorldPosition(V3()); o.updateWorldMatrix(true, true);
    o.traverse((m) => { if (!m.isMesh || !m.visible || m.renderOrder === 0 || m.renderOrder >= 7) return; m.geometry.computeBoundingBox(); box.union(tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); });
    if (box.isEmpty()) box.set(V3(-0.3, 0, -0.3).add(p), V3(0.3, 0.8, 0.3).add(p));
    const sz = box.getSize(V3()), c = box.getCenter(V3()).sub(p), round = Math.abs(sz.x - sz.z) < 0.25 * Math.max(sz.x, sz.z) && sz.x < 1.5;
    const geo = round ? new THREE.CylinderGeometry(Math.min(sz.x, sz.z) * 0.36, Math.min(sz.x, sz.z) * 0.36, sz.y * 0.7, 28) : new THREE.BoxGeometry(sz.x * 0.86, sz.y * 0.8, sz.z * 0.8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xb5d334, transparent: true, opacity: 0, depthWrite: false }), m = new THREE.Mesh(geo, mat);
    m.position.set(c.x, round ? box.min.y - p.y + sz.y * 0.4 : c.y, c.z); m.renderOrder = 5; m.visible = false; o.add(m);
    m.renderOrder = 60; // vẽ sau tấm ảnh dụng cụ (kiểu E xếp từ 20 trở lên) để khí màu không bị lớp kính nuốt mất
    it.haze = { set(k, hex) { m.visible = k > 0.01; mat.opacity = Math.min(0.72, k * 0.72); if (hex) mat.color.set(hex); } };
    return it.haze;
  }
  // Ống dẫn khí từ món a (đầu nhánh port, hoặc miệng) tới miệng món b; khí chạy thành từng cụm theo ống khi set(k, hex) với k > 0.
  function makePipe(B, a, b) {
    const pa = a.home.clone().add(a.obj.userData.port ? a.obj.userData.port.clone() : V3(0, a.K.top || 1, 0)), pb = b.home.clone().add(V3(0, (b.K.top || 1) - 0.08, 0));
    const hy = Math.max(pa.y, pb.y) + 0.35, pts = [pa, V3(pa.x + (pb.x - pa.x) * 0.15, hy, pa.z), V3(pb.x - (pb.x - pa.x) * 0.15, hy, pb.z), pb];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const GLASS = new THREE.Color(0xd9e4ea), wm = new THREE.MeshStandardMaterial({ color: 0xd9e4ea, roughness: 0.25, transparent: true, opacity: 0.55, depthWrite: false }), wall = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.035, 10, false), wm);
    wall.renderOrder = 4; B.g.add(wall);
    const pm = new THREE.MeshBasicMaterial({ color: 0xb5d334, transparent: true, opacity: 0.9, depthWrite: false }), puffs = [];
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), pm); m.renderOrder = 61; m.visible = false; B.g.add(m); puffs.push(m); }
    let k = 0, t = 0;
    updaters.push((dt) => { if (k <= 0.01) return; t = (t + dt * 0.45) % 1; puffs.forEach((m, i) => { m.visible = true; m.position.copy(curve.getPointAt((t + i / puffs.length) % 1)); }); });
    let on = true;
    return { show(v) { on = !!v; wall.visible = on; if (!on) { k = 0; puffs.forEach((m) => { m.visible = false; }); } }, set(v, hex) { if (!on) return; k = v || 0; if (hex) pm.color.set(hex); pm.opacity = 0.35 + 0.6 * k; wm.color.copy(GLASS).lerp(pm.color, Math.min(1, k) * 0.7); wm.opacity = 0.55 + 0.35 * Math.min(1, k); if (k <= 0.01) puffs.forEach((m) => { m.visible = false; }); } }; // ống ngả màu khí khi có khí chạy qua
  }
  const optsOf = (s) => s.options || [{ v: true, item: s.item }];
  // Việc có LƯỢNG TỰ CHỌN (s.range = { min, max, step, digits, unit }): con số do học sinh đặt, chỉ bị chặn bởi sức chứa của dụng cụ.
  // Chưa đặt thì lấy mức của bài (B.d.ref).
  const snap = (r, v) => +Math.min(r.max, Math.max(r.min, Math.round(v / r.step) * r.step)).toFixed(r.digits || 0);
  const wantOf = (B, s) => snap(s.range, B.want[s.var] ?? (B.d.ref || {})[s.var] ?? s.range.min);
  const pickOpt = (B, s, k) => (s.options ? s.options[k ?? 0] : s.range ? { v: k ?? wantOf(B, s) } : null);
  // Một việc làm được khi: bàn đang rảnh, chưa khởi động, mọi việc bắt buộc đứng trước đã xong, và việc này chưa làm (hoặc được làm lại).
  function can(B, s) {
    if (B.seq.busy() || (B.run && !s.free) || B.off.has(s.id)) return false; // free: việc làm được cả khi đang chạy (bật/tắt quạt, nhấc cốc)
    if ((s.needs || []).some((id) => !B.st[id]) || (s.until && B.st[s.until])) return false; // until: việc được làm lại cho tới khi việc kia xong
    for (const p of B.d.steps) { if (p === s) break; if (!p.optional && !B.off.has(p.id) && !B.st[p.id]) return false; }
    return !B.st[s.id] || !!s.repeat;
  }
  const nextStep = (B) => (B.run ? null : B.d.steps.find((s) => !s.optional && !B.off.has(s.id) && !B.st[s.id]) || null);
  function act(B, s, opt, instant) {
    if (!can(B, s)) return false;
    const o = opt || optsOf(s)[0];
    if (s.guard) { const m = s.guard(B, o); if (m) { if (!instant) say(m); return false; } } // giáo án chặn việc kèm lời nhắc
    const seq = VERBS[s.verb](B, s, o);
    const fin = () => { B.st[s.id] = true; if (s.var) B.level[s.var] = o.v; if (s.apply) s.apply(B, o); if (cb.act) cb.act(B.id, s.id, s.options ? s.options.indexOf(o) : s.range ? o.v : undefined); if (s.role === 'start') B.run = { t: 0, done: false, row: null, marks: B.d.chem && B.d.chem.marks ? B.d.chem.marks(B).filter((m) => m.at != null) : [] }; emit(B); };
    if (!seq.length) { fin(); return true; }
    B.seq.play(seq, fin); if (instant) B.seq.flush(); else emit(B);
    return true;
  }
  // Chạm một món trên bàn: tìm việc mà món này tham gia, làm việc đầu tiên đang làm được; không thì nói việc cần làm trước.
  function hand(B, itemId) {
    if (active !== B.id) { if (cb.pick) cb.pick(B.id); return; }
    const sp = B.items[itemId] && B.items[itemId].spec, info = sp && sp.role ? `${sp.tag || sp.id}: ${sp.role}` : '';
    const tell = (t) => say(info && t ? `${info}. ${t}` : t || info); // chạm món nào cũng hiện tên và vai trò của nó (DEFINE 3b)
    if (!hands) return tell(handsMsg);
    if (B.seq.busy()) return tell('Đang thao tác, chờ một chút.');
    if (B.d.rinse && (itemId === B.d.rinse.sink || itemId === B.d.rinse.wash || itemId === B.d.rinse.waste)) return void rinse(B); // chạm vòi, bình tia hoặc cốc thải: làm lại
    if (B.d.touch) { const m = B.d.touch(B, itemId); if (m) return tell(m); } // giáo án tự nhắc khi chạm món này (ví dụ bước dùng bảng bên phải)
    if (B.run && !B.d.steps.some((s) => s.free && (s.item === itemId || (s.items || []).includes(itemId)) && can(B, s))) return tell(B.run.done ? 'Thí nghiệm đã xong. Chạm vòi nước để rửa dụng cụ, rồi làm lại với điều kiện khác.' : 'Đang phản ứng: nhìn dụng cụ đo và số ở bảng bên phải.');
    const hits = [];
    B.d.steps.forEach((s) => {
      (s.options || []).forEach((o) => { if (o.item === itemId) hits.push([s, o]); });
      if (s.item === itemId || (s.items || []).includes(itemId)) hits.push([s, s.options ? cycle(B, s) : s.range ? { v: wantOf(B, s) } : null]);
    });
    const ok = hits.find(([s, o]) => can(B, s) && !(o && s.var && B.st[s.id] && B.level[s.var] === o.v));
    if (ok) { if (info) say(info); return void act(B, ok[0], ok[1]); }
    const same = hits.find(([s]) => s.range && can(B, s)); // đã làm đúng con số đang đặt
    if (same) return tell(`Đang có đúng ${String(same[1].v).replace('.', ',')} ${same[0].range.unit}. Muốn đổi thì kéo thanh hoặc nhập số khác ở bảng bên phải, rồi chạm lại.`);
    const it = B.items[itemId];
    if (!hits.length) return tell(it.spec.say || 'Món này không cần chạm: nó tự làm việc khi thí nghiệm chạy.');
    const s = hits[0][0], n = nextStep(B);
    if (B.off.has(s.id)) return tell(s.offSay || 'Món này chưa dùng ở bước này.');
    tell(n && n !== s && !B.st[n.id] && B.d.steps.indexOf(n) < B.d.steps.indexOf(s) ? `Làm việc này trước: ${n.label}.` : `Việc "${s.label}" đã làm. Muốn đổi thì chạm vòi nước để rửa dụng cụ trước.`);
  }
  // Món không gắn với từng lựa chọn (đèn cồn, lọ bột): mỗi lần chạm chuyển sang lựa chọn kế tiếp
  // Lần chạm đầu lấy mức mặc định (mức chuẩn nếu có trong các lựa chọn, không thì lựa chọn đầu); các lần sau chuyển tiếp.
  function cycle(B, s) { const i = s.options.findIndex((o) => o.v === B.level[s.var]); return !B.st[s.id] ? s.options[Math.max(i, 0)] : s.options[(i + 1) % s.options.length]; }

  // ---------- ĐỘNG TÁC của món đồ (dùng chung cho mọi bài) ----------
  // Rót: nhấc lọ, nghiêng, rót thành dòng vào từng bình, trả lọ về chỗ. Lọ luôn nghiêng từ phía ngoài cặp bình.
  // opt.front: nghiêng từ phía trước mặt (dùng cho ống đong, để không vướng xi-lanh hai bên). opt.drain: nguồn là ống đong, vơi dần và chia đều cho các bình.
  function pourSeq(B, bi, targets, [f0, f1], { thin = false, front = false, drain = false } = {}) {
    const bo = bi.obj, U = bo.userData, REST = bi.home, ML = U.top - 0.03, seq = [], st = B.stream, cap = (on) => { if (U.cap) U.cap.visible = on; if (U.shadow) U.shadow.visible = on; };
    let prev = REST;
    targets.forEach((v, n) => {
      const m = v.mouth(), dx = m.x < B.cx - 0.01 ? -1 : m.x > B.cx + 0.01 ? 1 : (REST.x <= m.x ? -1 : 1), tilt = front ? -1.75 : 1.75 * dx, from = prev;
      const POUR = front ? V3(m.x, m.y + 0.2, m.z + 0.35 * v.R) : V3(m.x + 0.35 * v.R * dx, m.y + 0.2, m.z);
      const HOVER = front ? V3(POUR.x, POUR.y - ML * Math.cos(tilt), POUR.z - ML * Math.sin(tilt)) : V3(POUR.x + ML * Math.sin(tilt), POUR.y - ML * Math.cos(tilt), m.z);
      const setTilt = (a) => { if (front) bo.rotation.x = a; else bo.rotation.z = a; };
      let v0 = 0, share = 0;
      seq.push(
        { dur: 0.5, start() { cap(false); }, fn: (k) => { bo.position.lerpVectors(from, HOVER, k); bo.position.y += Math.sin(Math.PI * k) * 0.35; } },
        { dur: 0.35, fn: (k) => setTilt(tilt * k) },
        { dur: thin ? 0.6 : 0.9, ease: lin, start() { st.visible = true; st.scale.x = st.scale.z = thin ? 0.4 : 1; if (drain) { v0 = U.mL; share = v0 / (targets.length - n); } },
          fn: (k) => { if (!thin) v.setFill(f0 + (f1 - f0) * k); if (drain) U.setVolume(v0 - share * k); const yb = v.surfaceY(), len = Math.max(0.05, POUR.y - yb); st.position.set(POUR.x, yb + len / 2, POUR.z); st.scale.y = len; } },
        { dur: 0.3, start() { st.visible = false; }, fn: (k) => setTilt(tilt * (1 - k)) });
      prev = HOVER;
    });
    const last = prev;
    seq.push({ dur: 0.5, fn: (k) => { bo.position.lerpVectors(last, REST, k); bo.position.y += Math.sin(Math.PI * k) * 0.35; } }, { dur: 0.02, fn: () => cap(true) });
    return seq;
  }
  // Dựng mẩu chất rắn được thả theo khai solid của việc 'drop' (xem đầu tệp): chất trong kho (chem) hoặc đá vôi theo form của từng mẩu
  function dropSolid(S, form, B) {
    const size = typeof S.size === 'function' ? S.size(B) : S.size, o = {};
    if (size != null) o.size = size; if (S.color != null) o.color = S.color;
    const m = S.chem ? makeChemSolid(S.chem) : makeSolid(form || S.form, o);
    if (S.scale != null) m.scale.setScalar(S.scale);
    if (S.rot) Object.entries(S.rot).forEach(([ax, a]) => { m.rotation[ax] = a; });
    return m;
  }
  // Chế độ một bình (B.solo = 'ref' hoặc 'exp'): chỉ bình đó và đồ của nó (món khai of: ...) tham gia.
  const inPlay = (B, key) => !B.solo || key === B.solo;
  const vesselsOf = (B, keys) => keys.filter((k) => inPlay(B, k)).map((k) => B.vessel[k]);
  const rigsOf = (B, ids) => (ids || []).filter((id) => inPlay(B, B.items[id].spec.of)).map((id) => B.items[id].obj.userData);
  // ---------- LUẬT THAO TÁC 26/11 (LUAT_THAO_TAC.md): ống hút, bộ đếm, cận cảnh, rửa đúng thứ tự ----------
  // Thời điểm từng giọt rời đầu ống hút (giây): 5 giọt đầu cách nhau 0,28 s (đủ đếm), sau đó nhanh dần; các giọt sau giọt thứ 6 gói trong 1 s (H6: thao tác 1,5 đến 4 s)
  function dropTimes(n) {
    const T = []; let t = 0;
    for (let i = 0; i < n; i++) { T.push(t); t += i < 4 ? 0.28 : Math.max(0.04, 0.28 * Math.pow(0.8, i - 3)); }
    if (n > 6 && T[n - 1] - T[5] > 1) { const t5 = T[5], sc = 1 / (T[n - 1] - t5); for (let i = 6; i < n; i++) T[i] = t5 + (T[i] - t5) * sc; }
    return T;
  }
  // Bộ đếm cạnh ống đang nhận chất ("Nước chlorine · 7/20 giọt", "Sodium bromide · 1 mL"); v = null thì cất đi
  function count(B, v, text, tip = null) {
    const id = B.id + '/__dem';
    if (!B.counter) { // đặt bên phải ống, cách thân ống đúng nửa bề ngang chữ trên màn hình (không đè ống, không đè dung dịch)
      const w = V3(), cam = stage.camera, el = stage.addTag(id, '', () => {
        const c = B.counter.v; if (!c) return w.set(0, -99, 0);
        if (B.counter.tip) return B.counter.tip();
        c.o.getWorldPosition(w); const d = Math.max(0.5, cam.position.distanceTo(w)), px = host.clientHeight / (2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
        return w.add(V3((el.offsetWidth / 2 + 18) / px + c.R, c.H * 0.32, 0));
      }, { color: B.d.color });
      B.counter = { v: null }; stage.setTag(id, { visible: false });
    }
    B.counter.v = v; B.counter.tip = tip; stage.setTag(id, v ? { text, visible: true, active: true } : { visible: false });
  }
  // CẬN CẢNH (H1, H2): bàn khai closeup thì lúc đang thao tác khung tự phóng tới cụm món đang dùng (ids + các điểm extra, toạ độ phòng), xong thì lùi ra (xem fitPoints, fitUpdate)
  function setFocus(B, ids, extra = []) { if (!B.d.closeup) return; B.focusN = (B.focusN || 0) + 1; B.focus = { ids: ids.filter((id) => B.items[id]), extra, key: B.focusN }; B.focusHold = B.d.closeupHold || 0.8; FIT.slow = 1.6; glide(); }
  const fmtMl = (x) => (Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1).replace('.', ','));
  // Ống hút của lọ (opts.pip): lọ ĐỨNG YÊN; rút ống hút thẳng lên khỏi lọ, đưa tới ngay trên miệng ống (thẳng đứng, đầu ống hút cách miệng 0,7 cm, không chạm), rồi:
  //   việc nhỏ giọt: từng giọt rơi (dropTimes), bộ đếm "7/20 giọt", mực dâng theo từng giọt (dropMl mL mỗi giọt, mặc định 0,05);
  //   việc khai ml: hút rồi bóp từng lần drawMl mL (mặc định 1), bộ đếm "1 mL", "2 mL", mực dâng đúng lượng;
  //   xong trả ống hút về ĐÚNG lọ của nó. Mỗi khi lượng trong ống đổi gọi during(B, o, k) của việc (k từ 0 tới 1) để giáo án đổi màu dần theo kho hoá học.
  function pipSeq(B, s, o) {
    const src = B.items[s.item], so = src.obj, U = so.userData, P = U.pip, v = B.vessel[s.into[0]], hex = s.drop || '#dcecf5', label = src.spec.tag || '';
    so.updateWorldMatrix(true, false); B.g.updateWorldMatrix(true, false);
    const toLocal = (p) => so.worldToLocal(B.g.localToWorld(p.clone())), m = v.mouth(), tipW = V3(m.x, m.y + 0.07, m.z);
    const seat = V3(0, U.seat, 0), lift = V3(0, U.seat + U.stemLen + 0.12, 0), over = toLocal(V3(m.x, tipW.y - U.tipY, m.z));
    const arc = (a, b, hop) => (k) => { P.position.lerpVectors(a, b, k); P.position.y += Math.sin(Math.PI * k) * hop; };
    const wTop = B.g.localToWorld(V3(m.x, tipW.y - U.tipY + 0.32, m.z)); // đỉnh bóp cao su khi ống hút ở trên miệng ống: cụm cận cảnh gồm cả nó
    setFocus(B, [s.item, s.into[0]], [wTop]); // nấc rộng: thấy lọ đứng yên và ống hút được rút ra, đưa tới
    const tight = () => setFocus(B, [s.into[0]], [B.g.localToWorld(V3(m.x, tipW.y + 0.12, m.z))]); // nấc sát: ống nghiệm và đầu ống hút, để giọt rơi và màu đổi thấy rõ (H1, H2)
    const ML = v.item.K.ml || 15;
    if (s.ml) {
      const per = s.drawMl || 1, draws = Math.max(1, Math.round(s.ml / per)), dF = per / ML, st = B.stream, seq = [];
      let f0 = 0;
      for (let d = 0; d < draws; d++) seq.push(
        { dur: 0.2, start() { U.setLoad(0.6, hex); if (!d) count(B, v, `${label} · 0 mL`); } }, // bóp rồi thả bóp cao su khi đầu ống hút trong dung dịch: dung dịch vào ống hút
        { dur: 0.3, start() { U.setOut(true); }, fn: (k) => P.position.lerpVectors(seat, lift, k) },
        { dur: 0.35, fn: arc(lift, over, 0.1) },
        { dur: 0.5, ease: lin, start() { f0 = v.fill; st.visible = true; st.scale.x = st.scale.z = 0.35; },
          fn: (k) => { v.setFill(f0 + dF * k); U.setLoad(0.6 * (1 - k)); const yb = v.surfaceY(), len = Math.max(0.05, tipW.y - yb); st.position.set(m.x, yb + len / 2, m.z); st.scale.y = len; count(B, v, `${label} · ${fmtMl((d + k) * per)} mL`); if (s.during) s.during(B, o, (d + k) / draws); } },
        { dur: 0.35, start() { st.visible = false; count(B, v, `${label} · ${fmtMl((d + 1) * per)} mL`); }, fn: arc(over, lift, 0.1) },
        { dur: 0.25, fn: (k) => P.position.lerpVectors(lift, seat, k) },
        { dur: 0.02, fn: () => U.setOut(false) });
      seq.push({ dur: 0.3, fn: (k) => { if (k >= 1) count(B, null); } });
      return seq;
    }
    const n = Math.max(1, Math.round(s.range ? o.v : s.count ? s.count(B) : s.n || 3)), T = dropTimes(n), FALL = 0.22, Td = T[n - 1] + FALL + 0.12;
    const followTip = B.d.nativeGlass ? () => P.localToWorld(V3(0, U.tipY, 0)) : null;
    const per = (s.dropMl ?? 0.05) / ML, drops = [];
    const dropMesh = () => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), liquidMat(hex, 0.9)); d.scale.y = 1.3; d.renderOrder = 61; d.visible = false; B.g.add(d); return d; };
    let f0 = 0, landed = -1;
    return [
      { dur: 0.4, start() { U.setOut(true); U.setLoad(1, hex); }, fn: (k) => P.position.lerpVectors(seat, lift, k) },
      { dur: 0.5, fn: arc(lift, over, 0.12) },
      { dur: Td, ease: lin, start() { f0 = v.fill; landed = -1; tight(); },
        fn: (k) => {
          const t = k * Td, yb = v.surfaceY(); let L = 0, j = 0;
          for (let i = 0; i < n; i++) {
            const q = (t - T[i]) / FALL; if (q >= 1) { L++; continue; } if (q < 0) continue;
            const d = drops[j] || (drops[j] = dropMesh()); j++; d.visible = true; d.position.set(tipW.x, tipW.y - 0.03 - q * q * (tipW.y - 0.03 - yb), tipW.z);
          }
          for (; j < drops.length; j++) drops[j].visible = false;
          if (L !== landed) { landed = L; v.setFill(f0 + per * L); U.setLoad(1 - 0.75 * (L / n)); count(B, v, `${label} · ${L}/${n} giọt`, followTip); if (s.during) s.during(B, o, L / n); }
        } },
      { dur: 0.45, start() { if (followTip) count(B, null); drops.forEach((d) => { B.g.remove(d); d.geometry.dispose(); }); }, fn: arc(over, lift, 0.12) },
      { dur: 0.35, fn: (k) => P.position.lerpVectors(lift, seat, k) },
      { dur: 0.02, fn: () => { U.setOut(false); U.setLoad(0); } },
      { dur: 0.6, fn: (k) => { if (k >= 1) count(B, null); } }, // bộ đếm đứng thêm một chút cho kịp đọc
    ];
  }
  // LÀM LẠI theo T8 (bàn khai rinse.waste = id cốc thải): (1) nhấc các ống có dung dịch, đổ vào CỐC THẢI (dòng đúng màu, mực cốc thải dâng, màu hoà);
  // (2) mang ra vòi, mở nước, hứng nước máy rồi đổ đi hai lần (thấy dòng nước chảy); (3) tráng nước cất bằng bình tia, đổ đi; (4) đặt lại lên giá. Không đổ hoá chất xuống bồn rửa.
  function rinseT8(B, done) {
    const R = B.d.rinse, sink = B.items[R.sink], SU = sink.obj.userData, waste = B.items[R.waste], WU = waste.obj.userData, wash = R.wash && B.items[R.wash];
    const mv = Object.values(B.vessel).filter((v) => inPlay(B, v.item.id) && v.item.obj.visible && !v.item.spec.fixed && v.fill > 0.004);
    if (!mv.length) { done(); return true; }
    B.rinsing = true;
    const N = mv.length, W0 = waste.obj.position, sgn = mv[0].item.home.x < W0.x ? -1 : 1; // sgn < 0: ống ở bên trái cốc, miệng ngả sang phải
    const P = mv.map((v, i) => ({ v, f0: v.fill, hex: '#' + v.liquid.material.color.getHexString(), off: i - (N - 1) / 2, m: v.mouth(), a: 0 }));
    // Đặt ống theo MIỆNG ống: miệng ở điểm m, ống nghiêng góc a quanh trục z (gốc ống ở đáy)
    const pose = (p, m, a) => { p.m = m.clone(); p.a = a; p.v.o.rotation.z = a; p.v.o.position.set(m.x + Math.sin(a) * p.v.H, m.y - Math.cos(a) * p.v.H, m.z); };
    const go = (to, a1, hop = 0) => { let from = null; return { start() { from = P.map((p) => [p.m.clone(), p.a]); }, fn: (k) => P.forEach((p, i) => { const t = to(p), m = from[i][0].clone().lerp(t, k); m.y += Math.sin(Math.PI * k) * hop; const a = from[i][1] + ((typeof a1 === 'function' ? a1(p) : a1) - from[i][1]) * k; p.v.o.rotation.z = a; p.v.o.position.set(m.x + Math.sin(a) * p.v.H, m.y - Math.cos(a) * p.v.H, m.z); if (k >= 1) { p.m = m; p.a = a; } }) }; };
    const streams = P.map((p, i) => { if (!B.streams) B.streams = [B.stream]; if (!B.streams[i]) { const st = new THREE.Mesh(B.stream.geometry, liquidMat(PAL.water, 0.75)); st.visible = false; st.renderOrder = 3; B.g.add(st); B.streams[i] = st; } return B.streams[i]; });
    const flow = (st, top, yb, thin) => { const len = Math.max(0.05, top.y - yb); st.visible = true; st.scale.x = st.scale.z = thin; st.position.set(top.x, yb + len / 2, top.z); st.scale.y = len; };
    const wm = (p) => V3(W0.x + p.off * 0.1, W0.y + (WU.top || 0.6) + 0.05, W0.z + p.off * 0.05), wA = (p) => wm(p).add(V3(0, 0.18, 0));
    const sp = sink.obj.position.clone().add(SU.spout || V3(0, 1.6, 0)), tm = (p) => sp.clone().add(V3(p.off * 0.11, -0.16, 0.06 + p.off * 0.04));
    const hm = (p) => sink.obj.position.clone().add(V3(0.45 + p.off * 0.22, 1.25, 0.15)); // chỗ tráng nước cất: nửa phải lòng chậu, xa các lọ trên bàn
    const AT = sgn * 1.1, AH = sgn * 0.9, AD = sgn * 2.1, H0 = mv[0].H; // góc nghiêng: hứng nước vòi, cầm tráng, đổ đi (đáy ống luôn trên mặt bàn)
    const bot = (m, a) => V3(m.x + Math.sin(a) * H0, m.y - Math.cos(a) * H0, m.z), W = (q) => B.g.localToWorld(q.clone());
    const tubeIds = mv.map((v) => v.item.id);
    // Cận cảnh đi theo từng chặng (H1): cốc thải → vòi → bình tia → giá. Mỗi chặng canh theo các món của chặng và các điểm ống sẽ đi qua.
    const stage_ = (ids, pts) => ({ dur: 0.01, start() { setFocus(B, ids, pts.map(W)); } });
    const wst = B.waste || (B.waste = { mL: 0, rgb: [0.86, 0.92, 0.96] }), C = new THREE.Color();
    const seq = [
      stage_([R.waste, ...tubeIds], P.flatMap((p) => [p.m.clone().add(V3(0, 1.1, 0)), wA(p), bot(wm(p), sgn * 2.0)])),
      { dur: 0.4, ...go((p) => p.m.clone().add(V3(0, 1.1, 0)), 0) },                      // nhấc ống khỏi giá
      { dur: 0.6, ...go(wA, sgn * 0.6, 0.15) },                                           // tới trên cốc thải
      { dur: 0.3, ...go(wm, sgn * 2.0) },                                                 // nghiêng đổ
      { dur: 0.8, ease: lin, start() { // (1) dung dịch vào cốc thải: mực dâng, màu hoà theo lượng
        const vol = (p) => p.f0 * (p.v.item.K.ml || 15), add = P.reduce((a, p) => a + vol(p), 0), tot = wst.mL + add, sum = wst.rgb.map((x) => x * wst.mL);
        P.forEach((p) => { C.set(p.hex); [C.r, C.g, C.b].forEach((x, j) => { sum[j] += x * vol(p); }); });
        if (tot > 0) wst.rgb = sum.map((x) => x / tot); this.k0 = wst.mL; wst.mL = tot; WU.setColor(C.setRGB(...wst.rgb)); P.forEach((p, i) => streams[i].material.color.set(p.hex)); },
        fn(k) { const lvl = (x) => Math.min(0.8, (0.8 * x) / (R.wasteMl || 50)); WU.setLevel(lvl(this.k0 + (wst.mL - this.k0) * k)); P.forEach((p, i) => { p.v.setFill(p.f0 * (1 - k)); flow(streams[i], p.m, W0.y + 0.06 + (WU.top || 0.6) * lvl(wst.mL), 0.5); }); } },
      { dur: 0.01, start() { streams.forEach((st) => { st.visible = false; }); P.forEach((p) => p.v.clear()); } }, // ống đã cạn: hết màu, hết dòng
      { dur: 0.25, ...go(wA, sgn * 0.6) },
      stage_([R.sink], P.flatMap((p) => [tm(p), bot(tm(p), AT), bot(tm(p), AD), sp])),
      { dur: 0.35, ...go((p) => wA(p).add(V3(0, 0.75, 0)), 0) },                          // dựng ống, nhấc cao khỏi các lọ trên bàn
      { dur: 0.7, ...go((p) => tm(p).add(V3(0, 0.6, 0)), 0, 0.1) },                        // (2) mang ra trên vòi nước
      { dur: 0.35, ...go(tm, AT) },                                                       // hạ xuống dưới miệng vòi, nghiêng ống
      { dur: 0.25, start() { SU.setFlow(true); } },
    ];
    for (let r = 0; r < 2; r++) seq.push(
      { dur: 0.45, ease: lin, fn: (k) => P.forEach((p) => p.v.setFill(0.3 * k)) },       // hứng nước máy
      { dur: 0.35, ...go((p) => tm(p).add(V3(0, -0.06, 0)), AD) },                        // đổ nước đi (xuống chậu)
      { dur: 0.02, fn: () => P.forEach((p) => p.v.setFill(0)) },
      { dur: 0.3, ...go(tm, AT) });
    seq.push({ dur: 0.2, start() { SU.setFlow(false); } }, stage_([R.sink], P.flatMap((p) => [hm(p).add(V3(0, 0.5, 0)), bot(hm(p), AH), bot(hm(p), AD), hm(p).add(V3(-0.5, -1.2, 0))])), { dur: 0.5, ...go(hm, AH) });
    if (wash) { // (3) tráng nước cất: bình tia tới từng ống, tia nước cất vào lòng ống
      const Wo = wash.obj, tip = Wo.userData.tip || V3(); let from = wash.home.clone();
      P.forEach((p) => {
        let at = null, a = null;
        seq.push(
          { dur: 0.4, start() { a = from.clone(); at = V3(p.m.x - tip.x - 0.05, p.m.y + 0.3 - tip.y, p.m.z); from = at; }, fn: (k) => { Wo.position.lerpVectors(a, at, k); Wo.position.y += Math.sin(Math.PI * k) * 0.25; } },
          { dur: 0.45, ease: lin, start() { B.stream.material.color.set(PAL.water); }, fn: (k) => { p.v.setFill(0.12 * k); flow(B.stream, V3(p.m.x - 0.05, p.m.y + 0.3, p.m.z), p.m.y - 0.6, 0.35); } },
          { dur: 0.02, fn: () => { B.stream.visible = false; } });
      });
      seq.push({ dur: 0.4, start() { this.a = Wo.position.clone(); }, fn(k) { Wo.position.lerpVectors(this.a, wash.home, k); Wo.position.y += Math.sin(Math.PI * k) * 0.25; } },
        { dur: 0.35, ...go((p) => p.m.clone(), AD) }, { dur: 0.02, fn: () => P.forEach((p) => p.v.setFill(0)) }, { dur: 0.25, ...go((p) => p.m.clone(), AH) });
    }
    seq.push(stage_(tubeIds, P.map((p) => p.v.item.home.clone().add(V3(0, p.v.H + 1.1, 0)))), { dur: 0.9, ...go((p) => p.v.item.home.clone().add(V3(0, p.v.H + 1.1, 0)), 0, 0.15) }, // (4) về giá
      { dur: 0.6, ...go((p) => p.v.item.home.clone().add(V3(0, p.v.H, 0)), 0) });
    B.seq.play(seq, done); emit(B);
    return true;
  }
  const VERBS = {
    none: () => [],
    // Bấm công tắc của món (quạt tủ hút, khoá phễu): món lún xuống một chút rồi trở lại; giáo án đổi trạng thái trong apply
    press(B, s) { const o = B.items[s.item].obj, y0 = B.items[s.item].home.y; return [{ dur: 0.18, fn: (k) => { o.position.y = y0 - 0.03 * Math.sin(Math.PI * k); } }]; },
    // Nhấc món ra chỗ away ([x, z] của bàn) hoặc đặt lại chỗ cũ
    move(B, s) {
      const it = B.items[s.item], o = it.obj, a = it.spec.away || [it.home.x + 1.2, it.home.z + 0.6], out = o.position.distanceTo(it.home) < 0.05;
      const from = o.position.clone(), to = out ? V3(a[0], it.home.y, a[1]) : it.home.clone();
      return [{ dur: 0.6, fn: (k) => { o.position.lerpVectors(from, to, k); o.position.y += Math.sin(Math.PI * k) * 0.45; } }];
    },
    // Nhỏ giọt. Lọ có ống hút (opts.pip): theo luật thao tác T1, T2 (pipSeq ở trên). Lọ nhỏ giọt cũ: cả lọ bay tới trên miệng ống, ba giọt rơi, lọ về chỗ (bài cũ giữ nguyên).
    drip(B, s, o) {
      if (B.items[s.item].obj.userData.pip) return pipSeq(B, s, o);
      const src = B.items[s.item], ob = src.obj, v = B.vessel[s.into[0]], m = v.mouth(), home = src.home.clone(), over = V3(m.x, m.y + 0.42, m.z);
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), liquidMat(PAL.water, 0.85)); drop.visible = false; drop.renderOrder = 6; B.g.add(drop);
      return [
        { dur: 0.55, fn: (k) => { ob.position.lerpVectors(home, over, k); ob.position.y += Math.sin(Math.PI * k) * 0.3; } },
        { dur: 0.9, ease: lin, start() { drop.visible = true; }, fn: (k) => { const q = (k * 3) % 1; drop.position.set(m.x, over.y - 0.02 - q * (over.y - v.surfaceY()), m.z); } },
        { dur: 0.5, start() { B.g.remove(drop); }, fn: (k) => { ob.position.lerpVectors(over, home, k); ob.position.y += Math.sin(Math.PI * k) * 0.3; } },
      ];
    },
    pour: (B, s, o) => pourSeq(B, B.items[(o && o.item) || s.item], vesselsOf(B, s.into), typeof s.fill === 'function' ? s.fill(B) : s.fill || [0, 1], { thin: s.thin, front: s.front, drain: s.drain }),
    // Đong: rót từ lọ vào ống đong tới đủ lượng cho các bình (mỗi bình o.v mL). Chọn lại mức thấp hơn thì đổ bớt.
    measure(B, s, o) {
      const cyl = B.items[s.tool], C = cyl.obj.userData, from = C.mL || 0, to = o.v * (B.solo ? 1 : s.n || 2);
      if (to <= from) return [{ dur: 0.3, ease: lin, fn: (k) => C.setVolume(from + (to - from) * k) }];
      const target = { R: 0.15, mouth: () => cyl.obj.position.clone().add(V3(0, C.top, 0)), setFill: (k) => C.setVolume(from + (to - from) * k), surfaceY: () => cyl.obj.position.y + 0.22 + (C.h - 0.5) * Math.min(1, (C.mL || 0) / 100) };
      return pourSeq(B, B.items[s.item], [target], [0, 1]);
    },
    // Cân: từng đĩa lên cân, màn hình hiện số gam, rồi về chỗ. Lượng trên đĩa đổi theo mức đã chọn.
    weigh(B, s, o) {
      const sc = B.items[s.item], SU = sc.obj.userData, pan = sc.obj.position.clone().add(SU.panTop), ref = (B.d.ref || {})[s.var] || o.v, seq = [];
      const hop = (obj, p, q) => (k) => { obj.position.lerpVectors(p, q, k); obj.position.y += Math.sin(Math.PI * k) * 0.3; };
      s.dishes.filter((id) => inPlay(B, B.items[id].spec.of)).forEach((id) => {
        const d = B.items[id], here = d.obj.position.clone();
        seq.push({ dur: 0.45, fn: hop(d.obj, here, pan) },
          { dur: 0.35, start() { SU.setValue(o.v); d.obj.userData.holder.scale.setScalar(Math.min(1.45, Math.cbrt(o.v / ref))); } },
          { dur: 0.45, fn: hop(d.obj, pan, here) });
      });
      return seq;
    },
    // Thả: các mẩu chất rắn bay theo đường cong vào miệng từng bình cùng một lúc, rơi xuống đáy; có bộ đo khí thì đậy nút lại.
    drop(B, s) {
      const fl = (typeof s.pieces === 'function' ? s.pieces(B) : s.pieces).filter(([, into]) => inPlay(B, into)).map(([from, into, form]) => {
        const src = B.items[from], v = B.vessel[into], obj = dropSolid(s.solid || {}, form, B), m = v.mouth(); obj.visible = false; B.g.add(obj);
        return { src, v, obj, a: src.obj.position.clone().add(V3(0, 0.1, 0)), m: m.clone().add(V3(0, 0.25, 0)), b: V3(m.x, v.o.position.y + v.solids.position.y, m.z) };
      });
      const rigs = rigsOf(B, s.rigs);
      const seq = [
        { dur: 0.9, start() { fl.forEach((p) => { p.obj.visible = true; p.src.obj.userData.setContent(false); }); }, fn: (k) => fl.forEach((p) => { p.obj.position.lerpVectors(p.a, p.m, k); p.obj.position.y += Math.sin(Math.PI * k) * 0.5; }) },
        { dur: 0.4, ease: (k) => k * k, fn: (k) => fl.forEach((p) => p.obj.position.lerpVectors(p.m, p.b, k)) },
        { dur: 0.02, fn: () => fl.forEach((p) => { p.obj.position.set(0, 0, 0); p.v.solids.clear(); p.v.solids.add(p.obj); }) },
      ];
      if (rigs.length) seq.push({ dur: 0.5, fn: (k) => rigs.forEach((r) => r.setOpen(1 - k)) });
      return seq;
    },
    // Chọn bằng cách kéo món tới chỗ bình thí nghiệm; món được chọn trước đó trở về chỗ cũ.
    slide(B, s, o) {
      const it = B.items[o.item], pv = B.st[s.id] ? B.items[optsOf(s).find((x) => x.v === B.level[s.var]).item] : null, prev = pv !== it ? pv : null;
      const slot = V3(s.slot[0], 0, s.slot[1]), a = it.obj.position.clone(), pa = prev && prev.obj.position.clone();
      const hop = (obj, p, q, k) => { obj.position.lerpVectors(p, q, k); obj.position.y = Math.sin(Math.PI * k) * 0.25; };
      return [{ dur: 0.55, fn: (k) => { hop(it.obj, a, slot, k); if (prev) hop(prev.obj, pa, prev.home, k); } }];
    },
    // Xúc: thìa tới lọ chất rắn, xúc một thìa rồi về chỗ (v = true), hoặc trả bột lại lọ (v = false).
    scoop(B, s, o) {
      if (!!o.v === B.loaded) return [];
      const tool = B.items[s.tool], T = tool.obj, jar = B.items[s.item], U = jar.obj.userData, top = jar.obj.position.clone().add(V3(0, jar.K.top + 0.3, 0)), dip = top.clone().add(V3(0, -0.5, 0));
      const arc = (p, q) => (k) => { T.position.lerpVectors(p, q, k); T.position.y += Math.sin(Math.PI * k) * 0.25; };
      // Thìa cắm trong cốc (tool.up): nhấc thẳng lên khỏi cốc rồi mới đi, lúc về thì hạ thẳng xuống cốc
      const park = tool.up || tool.home, lift = tool.up ? [{ dur: 0.25, fn: (k) => T.position.lerpVectors(tool.home, tool.up, k) }] : [], lower = tool.up ? [{ dur: 0.25, fn: (k) => T.position.lerpVectors(tool.up, tool.home, k) }] : [];
      return [
        ...lift,
        { dur: 0.6, start() { U.cap.visible = false; }, fn: arc(park, top) },
        { dur: 0.3, fn: (k) => T.position.lerpVectors(top, dip, k) },
        { dur: 0.3, start() { T.userData.holder.clear(); if (o.v) { const p = makeChemSolid(s.powder || 'MnO2'); p.scale.set(0.55, 0.9, 0.3); T.userData.holder.add(p); } B.loaded = !!o.v; }, fn: (k) => T.position.lerpVectors(dip, top, k) },
        { dur: 0.6, fn: arc(top, park) },
        ...lower,
        { dur: 0.02, fn: () => { U.cap.visible = true; } },
      ];
    },
    // Đổ thìa bột (nếu đã xúc) vào một bình rồi đậy nút cả các bình.
    tip(B, s) {
      const rigs = rigsOf(B, s.rigs), seq = [];
      if (B.loaded) {
        const tool = B.items[s.tool], T = tool.obj, v = B.vessel[s.into], m = v.mouth().add(V3(0, 0.22, 0)), bottom = v.o.position.y + 0.1;
        const grain = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), solidMat(0x1c1c1e, 1)); grain.visible = false; B.g.add(grain);
        const arc = (p, q) => (k) => { T.position.lerpVectors(p, q, k); T.position.y += Math.sin(Math.PI * k) * 0.4; };
        const park = tool.up || tool.home;
        if (tool.up) seq.push({ dur: 0.25, fn: (k) => T.position.lerpVectors(tool.home, tool.up, k) });
        seq.push(
          { dur: 0.7, fn: arc(park, m) },
          { dur: 0.3, fn: (k) => { T.rotation.x = 1.2 * k; } },
          { dur: 0.4, ease: (k) => k * k, start() { T.userData.holder.clear(); B.loaded = false; grain.visible = true; }, fn: (k) => grain.position.set(m.x, m.y + (bottom - m.y) * k, m.z) },
          { dur: 0.3, start() { B.g.remove(grain); v.powder.visible = true; }, fn: (k) => { T.rotation.x = 1.2 * (1 - k); } },
          { dur: 0.6, fn: arc(m, park) });
        if (tool.up) seq.push({ dur: 0.25, fn: (k) => T.position.lerpVectors(tool.up, tool.home, k) });
      }
      if (rigs.length) seq.push({ dur: 0.5, fn: (k) => rigs.forEach((r) => r.setOpen(1 - k)) });
      return seq.length ? seq : [{ dur: 0.05 }];
    },
    // Châm đèn cồn và đun tới mức đã chọn (nhiệt kế chạy theo); chọn mức đối chứng thì tắt đèn.
    heat(B, s, o) {
      const lamp = B.items[s.item].obj.userData, th = s.thermo && B.items[s.thermo].obj.userData, ref = (B.d.ref || {})[s.var] ?? 25, from = B.st[s.id] ? B.level[s.var] : ref, to = o.v, hot = to > ref;
      return [
        { dur: 0.3, start() { if (hot && !lamp.lit) { lamp.capOff(0.62); lamp.setLit(true); } } },
        { dur: 0.8, ease: lin, fn: (k) => { const t = from + (to - from) * k; if (th) th.setTemp(t); if (s.show) s.show(B, t); } },
        { dur: 0.02, fn: () => { if (!hot) lamp.capOn(); } },
      ];
    },
    // Làm ấm: đưa bình lên bếp điện tới mức đã chọn rồi đặt lại chỗ cũ.
    warm(B, s, o) {
      const v = B.vessel[s.vessel], plate = B.items[s.item], P = plate.obj, PU = P.userData, home = v.item.home, ref = (B.d.ref || {})[s.var] ?? 25, from = B.st[s.id] ? B.level[s.var] : ref, to = o.v;
      if (to <= from) return [{ dur: 0.05, fn: () => { if (s.show) s.show(B, to); } }];
      const on = P.position.clone().add(V3(0, PU.top * P.scale.y, PU.plateZ * P.scale.z)), arc = (p, q) => (k) => { v.o.position.lerpVectors(p, q, k); v.o.position.y += Math.sin(Math.PI * k) * 0.6; };
      return [
        { dur: 0.8, fn: arc(home, on) },
        { dur: 1.0, ease: lin, start() { PU.setTemp(to); }, fn: (k) => { if (s.show) s.show(B, from + (to - from) * k); } },
        { dur: 0.8, start() { PU.setTemp(25); }, fn: arc(on, home) },
      ];
    },
  };
  // Làm lại: mở nút (nếu có), mang bình ra chậu, đổ bỏ dưới vòi nước, đặt lại; bàn về trạng thái đầu.
  function rinse(B, instant) {
    if (B.seq.busy()) return false;
    if (!B.run && !Object.keys(B.st).length) { if (!instant) say('Dụng cụ đang sạch, chưa cần rửa.'); return false; }
    const done = () => { reset(B); emit(B); };
    if (cb.rinse) cb.rinse(B.id);
    if (instant || !B.d.rinse) { done(); return true; }
    if (B.d.rinse.waste) return rinseT8(B, done); // làm lại đúng luật T8 (cốc thải → vòi → bình tia → giá)
    B.rinsing = true;
    const sink = B.items[B.d.rinse.sink], S = sink.obj.position, rigs = rigsOf(B, B.d.rinse.rigs).filter((r) => r.open < 0.5), all = Object.values(B.vessel).filter((v) => inPlay(B, v.item.id)).map((v) => ({ v, f0: v.fill }));
    const mv = all.filter((p) => !p.v.item.spec.fixed).map((p, n, arr) => ({ ...p, home: p.v.item.home, up: p.v.item.home.clone().add(p.v.item.kind === 'tube' ? V3(0, 1.0, 0) : V3(0, 0.5, 0.9)), over: V3(S.x - 1.1 + (n - (arr.length - 1) / 2) * 0.5, 0.78, S.z + 0.15) })); // thân bình nằm bên trái chậu, nghiêng miệng vào lòng chậu
    const seq = [], st = B.stream, tilt = (a, b2) => (k) => mv.forEach((p) => { p.v.o.rotation.z = -1.75 * (a + (b2 - a) * k); });
    if (rigs.length) seq.push({ dur: 0.4, fn: (k) => rigs.forEach((r) => r.setOpen(k)) });
    seq.push(
      { dur: 0.4, fn: (k) => mv.forEach((p) => p.v.o.position.lerpVectors(p.home, p.up, k)) },
      { dur: 0.7, fn: (k) => mv.forEach((p) => { p.v.o.position.lerpVectors(p.up, p.over, k); p.v.o.position.y += Math.sin(Math.PI * k) * 0.3; }) },
      { dur: 0.4, start() { sink.obj.userData.setFlow(true); }, fn: tilt(0, 1) },
      { dur: 0.5, ease: lin, fn: (k) => all.forEach((p) => p.v.setFill(p.f0 * (1 - k))) },
      { dur: 0.35, start() { all.forEach((p) => p.v.clear()); sink.obj.userData.setFlow(false); }, fn: tilt(1, 0) });
    // Tráng nước cất: bình tia tới từng bình, tia một ít nước cất, rồi đổ bỏ lần nữa
    const wash = B.d.rinse.wash && B.items[B.d.rinse.wash];
    if (wash && mv.length) {
      const W = wash.obj, tip = W.userData.tip;
      let from = wash.home;
      mv.forEach((p) => {
        const m = V3(p.over.x, p.over.y + p.v.H, p.over.z), at = V3(m.x - tip.x, m.y + 0.28 - tip.y, m.z), a = from;
        seq.push(
          { dur: 0.4, fn: (k) => { W.position.lerpVectors(a, at, k); W.position.y += Math.sin(Math.PI * k) * 0.25; } },
          { dur: 0.4, ease: lin, start() { st.visible = true; st.scale.x = st.scale.z = 0.4; }, fn: (k) => { p.v.setFill(0.14 * k); const yb = p.over.y + 0.1, len = Math.max(0.05, m.y + 0.28 - yb); st.position.set(m.x, yb + len / 2, m.z); st.scale.y = len; } },
          { dur: 0.02, fn: () => { st.visible = false; } });
        from = at;
      });
      const last = from;
      seq.push({ dur: 0.4, fn: (k) => { W.position.lerpVectors(last, wash.home, k); W.position.y += Math.sin(Math.PI * k) * 0.25; } },
        { dur: 0.35, fn: tilt(0, 1) }, { dur: 0.35, ease: lin, fn: (k) => mv.forEach((p) => p.v.setFill(0.14 * (1 - k))) }, { dur: 0.3, fn: tilt(1, 0) });
    }
    seq.push(
      { dur: 0.7, fn: (k) => mv.forEach((p) => { p.v.o.position.lerpVectors(p.over, p.up, k); p.v.o.position.y += Math.sin(Math.PI * k) * 0.3; }) },
      { dur: 0.4, fn: (k) => mv.forEach((p) => p.v.o.position.lerpVectors(p.up, p.home, k)) });
    B.seq.play(seq, done); emit(B);
    return true;
  }

  // ---------- Vòng sáng: món đang đến lượt ----------
  function syncRings(B) {
    const on = new Set();
    if (hands && active === B.id && !B.seq.busy() && B.d.steps && B.d.steps.length) {
      if (B.run) { if (B.run.done && B.d.rinse) on.add(B.d.rinse.sink); }
      else { const n = nextStep(B); if (n) (n.ring || n.items || [n.item, ...(n.options || []).map((o) => o.item)]).filter(Boolean).forEach((id) => on.add(id)); }
    }
    Object.keys(B.pulse).forEach((id) => on.add(id)); // bình vừa phản ứng xong: vòng sáng nháy vài giây
    Object.entries(B.rings).forEach(([id, r]) => r.userData.show(on.has(id) && B.items[id].obj.visible)); // món đã cất (chế độ một bình) thì không sáng vòng
  }

  (decl.benches || []).forEach(build);
  const scenery = new THREE.Group(); scene.add(scenery);
  (M3.props || []).forEach((p) => { const o = PROPS[p.kind](p.opts || {}); o.position.set(p.at[0], FLOOR_Y, p.at[1]); if (p.ry) o.rotation.y = p.ry; scenery.add(o); });

  if (decl.glass) applyGlassLook(decl.glass, { stage, list: list.filter(B => !B.d.nativeGlass) }); // bản thử kiểu thuỷ tinh (&kinh=b|c|d|e), mặc định không chạy

  // ---------- Bàn khác mờ dần khi áp sát một bàn; món của bàn đang mờ không bắt chạm (tia chạm không bị chặn) ----------
  const seen = new Map();
  list.forEach((B) => B.g.traverse((o) => [].concat(o.material || []).forEach((m) => { seen.set(m, seen.has(m) && seen.get(m) !== B.id ? null : B.id); })));
  list.forEach((B) => { B.fade = { k: 1, goal: 1, mats: [...seen].filter(([, id]) => id === B.id).map(([m]) => ({ m, o: m.opacity, tr: m.transparent })) }; });
  function applyFade(B) {
    const f = B.fade, k = f.k, full = k > 0.995;
    B.g.visible = k > 0.02;
    f.mats.forEach((e) => { e.m.opacity = e.o * k; const tr = e.tr || !full; if (e.m.transparent !== tr) { e.m.transparent = tr; e.m.needsUpdate = true; } });
    if (full) { Object.values(B.vessel).forEach((v) => v.tint(0xffffff, 0)); if (B.run && B.d.chem) B.d.chem.frame(B, B.run.t); } // trả lại màu và độ đục của dung dịch sau khi hiện lại
  }
  const TMPV = new THREE.Vector3(), CTRL = stage.controls, clamp = (v, a, b) => Math.min(b, Math.max(a, v)); let zoomGoal = null;
  const stopZoom = () => { zoomGoal = null; }; host.addEventListener('wheel', stopZoom, { passive: true, capture: true }); host.addEventListener('pointerdown', stopZoom, { capture: true });
  // KÉO CHUỘT ở một bàn (chủ 21/11, L1 tự thử rồi chốt): ở khung chuẩn kéo là XOAY quanh bàn; đã phóng to (từ 130%) thì kéo là DỜI khung như bản đồ,
  // giữ Shift mới xoay; thu về dưới 110% thì kéo lại là xoay. Một ngón tay trên màn cảm ứng theo cùng luật.
  let dragPan = false;
  const setDrag = (pan) => { dragPan = pan; CTRL.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE; CTRL.touches.ONE = pan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE; };
  const panAtAnyZoom = M3.panAtAnyZoom && matchMedia('(pointer: fine)').matches;
  const usualRight = CTRL.mouseButtons.RIGHT;
  const camMode = () => {
    CTRL.mouseButtons.RIGHT = panAtAnyZoom || benches[active]?.d.nativeGlass ? THREE.MOUSE.ROTATE : usualRight;
    CTRL.enablePan = !!active || !!panAtAnyZoom;
    CTRL.zoomToCursor = !!active;
    CTRL.screenSpacePanning = true;
    if (panAtAnyZoom) setDrag(true);
    else if (!active) setDrag(false);
  };
  // Chạy xong ngay một lần chạy (dùng khi dựng lại bàn): tua thời gian của bàn tới khi giáo án báo xong, bật các mốc XONG
  function finishRun(B) {
    for (let n = 0; B.run && !B.run.done && n < 400; n++) {
      B.run.t += 0.25; const r = B.d.chem.frame(B, B.run.t);
      (B.run.marks || []).forEach((m) => { if (!m.fired && B.run.t >= m.at) { m.fired = true; stage.setTag(B.id + '/' + m.tag, { done: true }); } });
      if (r && r.done) { if (r.end) B.run = null; else { B.run.done = true; B.run.row = B.d.chem.row ? B.d.chem.row(B) : null; } }
    }
  }
  // THẺ TÊN THEO VIỆC (chặng 3 · 27/11): khi bật (setNames(true, true)) và bàn khai tagFocus, chỉ hiện thẻ của các bình chứa (ống, bình)
  // và của những món thuộc việc kế tiếp hoặc đang thao tác; các món khác ẩn thẻ cho bàn đỡ rối. Bàn không khai tagFocus thì như cũ.
  function focusSet(B) {
    if (!tagFocus || !B.d.tagFocus) return null;
    const set = new Set(Object.keys(B.vessel)), n = nextStep(B);
    if (n) { [n.item].concat(n.into || []).forEach((id) => id && set.add(id)); (n.options || []).forEach((o) => o.item && set.add(o.item)); if (n.slot && B.items.shelf) set.add('shelf'); }
    if (B.focus) B.focus.ids.forEach((id) => set.add(id));
    if (B.run && B.run.done && B.d.rinse) ['sink', 'wash', 'waste'].forEach((id) => B.items[id] && set.add(id));
    return set;
  }
  function syncTags(B) { const fs = focusSet(B); B.tagKey = fs ? [...fs].sort().join() : ''; B.tags.forEach(([id, itemId]) => stage.setTag(id, { visible: names && active === B.id && B.items[itemId].obj.visible && (!fs || fs.has(itemId)) })); }
  function syncScene() {
    const backdrop = benches[active]?.d.backdrop;
    room.visible = scenery.visible = backdrop == null;
    scene.background.set(backdrop ?? WALL);
    list.forEach((B) => {
      B.root.visible = backdrop == null || B.id === active;
      B.fade.goal = !active || active === B.id || B.d.keep ? 1 : 0; // đang ở bàn nào thì CHỈ dụng cụ bàn đó hiện, phóng to thu nhỏ thế nào cũng vậy (chủ 21/11). keep: món gắn với căn phòng (tivi trên tường) không mờ đi
      const picks = !active || active === B.id;
      B.picks = picks;
      Object.values(B.items).forEach((it) => { const want = it.touch && picks && it.obj.visible; if (want !== it.pickOn) { it.pickOn = want; if (want) stage.pickable(it.obj, B.id + '/' + it.id); else stage.unpickable(it.obj); } });
      stage.setTag(B.id, { visible: names && !active });
      syncTags(B);
      syncRings(B);
    });
  }
  stage.setPickHandler((id) => { const [b, it] = String(id).split('/'); const B = benches[b]; if (!B) return; if (it && active === b) hand(B, it); else if (cb.pick) cb.pick(b); });
  stage.setHoverHandler(() => {}); // để con trỏ đổi thành bàn tay khi rê lên món chạm được

  // ---------- NHÃN NÉ DỤNG CỤ (21/11; chủ: nhãn món sau không đè món trước, chữ không đè hình). Chỉ màn từ 900 px, chỉ bàn đang xem. ----------
  // stage.js vẫn đặt nhãn ngay trên điểm neo (đỉnh món), không sửa gì ở đó nên bản 1 và bản 2 không đổi. Ở đây mỗi khung hình đo lại: chỗ đó có nằm trên thân
  // một dụng cụ, trên nhãn khác hay trên thẻ ở đáy không; có thì thử các chỗ khác quanh món (dưới chân món, cao hơn, chếch hai bên) và lấy chỗ che dụng cụ ít nhất.
  // Kết quả ghi lên nhãn thành độ dời --ox/--oy và đường dẫn --lx/--ly/--len/--rot (shell_ds.css, lớp is-av). Chỗ đang dùng được ưu tiên giữ để nhãn không nhảy qua lại.
  const WIDE = matchMedia('(min-width:900px)'), AV = { boxes: new Map(), keep: {}, age: 0, on: false, eq: null }, BX = new THREE.Box3(), PV = V3();
  const toScreen = (v, w, h) => { PV.copy(v).project(stage.camera); return [(PV.x * 0.5 + 0.5) * w, (-PV.y * 0.5 + 0.5) * h]; };
  // Hộp bao của từng phần của một món, tính so với gốc của món (đo lại sau mỗi 1,5 giây: ảnh dụng cụ tải xong, nắp vừa mở...). Bỏ phần dẹt sát mặt bàn (bóng đổ).
  const partBoxes = (it) => {
    let c = AV.boxes.get(it); if (c) return c;
    const o = it.obj, p = o.getWorldPosition(V3()); c = []; o.updateWorldMatrix(true, true);
    o.children.forEach((ch) => { if (!ch.visible || ch.userData.noFit) return; /* noFit (27/11): phần bối cảnh của sa bàn (đất, cây, đường) không kéo khung máy quay ra xa */ BX.setFromObject(ch); if (BX.isEmpty() || BX.max.y - BX.min.y < 0.05) return; c.push([BX.min.clone().sub(p), BX.max.clone().sub(p)]); });
    AV.boxes.set(it, c); return c;
  };
  const boxRect = (p, a, b, w, h) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      PV.set(p.x + (i & 1 ? b.x : a.x), p.y + (i & 2 ? b.y : a.y), p.z + (i & 4 ? b.z : a.z)).project(stage.camera); if (PV.z > 1) return null;
      const x = (PV.x * 0.5 + 0.5) * w, y = (-PV.y * 0.5 + 0.5) * h; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return [x0, y0, x1, y1];
  };
  const overlap = (l, t, r, b, o) => Math.max(0, Math.min(r, o[2]) - Math.max(l, o[0])) * Math.max(0, Math.min(b, o[3]) - Math.max(t, o[1]));
  function avoidTags(dt) {
    const B = active && benches[active], on = !!B && names && WIDE.matches && B.tags.length > 0;
    if (!on) { if (AV.on) { AV.on = false; list.forEach((b) => Object.values(b.tagEls).forEach((el) => el.classList.remove('is-av'))); } return; }
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    AV.on = true; AV.age += dt; if (AV.age > 1.5 && !B.seq.busy()) { AV.age = 0; AV.boxes.clear(); }
    const ins = stage.insets || { l: 0, r: 0, t: 0.07, b: 0 }, X0 = ins.l * w + 4, X1 = w - ins.r * w - 4, Y0 = ins.t * h + 2, Y1 = h - 4;
    const obs = []; // vật cản: hộp bao trên màn hình của từng phần của từng món đang hiện trên bàn
    Object.values(B.items).forEach((it) => { if (!it.obj.visible) return; const p = it.obj.getWorldPosition(V3()); partBoxes(it).forEach(([a, b]) => { const r = boxRect(p, a, b, w, h); if (r) { r.push(it.id); obs.push(r); } }); });
    Object.values(B.items).forEach((it) => { const U = it.obj.userData, P = U.pip; if (!P || !it.obj.visible || P.position.y - U.seat < 0.02) return; BX.setFromObject(P); if (BX.isEmpty()) return; const r = boxRect(V3(), BX.min, BX.max, w, h); if (r) { r.push('pip:' + it.id); obs.push(r); } }); // ống hút đang được cầm: nhãn né nó
    AV.eq = AV.eq || host.querySelector('.lk-eqcard'); // thẻ phương trình ở đáy cảnh: nhãn không nằm lên thẻ
    const eq = AV.eq && !AV.eq.hidden && host.contains(AV.eq) ? [ /* bố cục ba cột: thẻ nằm ngoài cảnh thì không còn là vật cản */AV.eq.offsetLeft - 6, AV.eq.offsetTop - 6, AV.eq.offsetLeft + AV.eq.offsetWidth + 6, h] : null;
    const todo = [];
    B.tags.forEach(([, itemId]) => {
      const el = B.tagEls[itemId], it = B.items[itemId]; if (el.style.display === 'none') return;
      const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform); if (!m) return;
      const p = it.obj.getWorldPosition(V3()), base = toScreen(p, w, h), top = toScreen(p.add(it.tagOff), w, h);
      todo.push({ el, id: itemId, X: +m[1], Y: +m[2], bw: el.offsetWidth, th: el.offsetHeight, ax: top[0], ay: top[1], bx: base[0], by: base[1] });
    });
    const placed = [];
    todo.sort((a, b) => b.ay - a.ay).forEach((t) => {
      const { ax, ay, bx, by, bw, th } = t, up = ay - 22 - th, sx = bw / 2 + 14, cs = [];
      const add = (cx, top, A, pen) => cs.push({ l: clamp(cx - bw / 2, X0, Math.max(X0, X1 - bw)), t: Math.max(Y0, top), A, pen });
      add(ax, up, [ax, ay], 0); // 0: ngay trên món (chỗ quen thuộc)
      add(bx, by + 16, [bx, by], 300); add(bx, by + 36, [bx, by], 420); // 1, 2: dưới chân món
      add(ax, up - (th + 8), [ax, ay], 360); add(ax, up - 2 * (th + 8), [ax, ay], 520); // 3, 4: cao hơn
      add(ax - sx, up, [ax, ay], 380); add(ax + sx, up, [ax, ay], 380); // 5, 6: chếch trên trái, phải
      add(ax - sx - 12, ay - th / 2 - 4, [ax, ay], 460); add(ax + sx + 12, ay - th / 2 - 4, [ax, ay], 460); // 7, 8: ngang hai bên điểm neo
      add(bx - sx, by + 20, [bx, by], 500); add(bx + sx, by + 20, [bx, by], 500); // 9, 10: chếch dưới
      add(ax - sx, up - (th + 8), [ax, ay], 600); add(ax + sx, up - (th + 8), [ax, ay], 600); // 11, 12: chếch trên, cao hơn
      const key = B.id + '/' + t.id, prev = AV.keep[key]; let best = 0, bk = Infinity;
      cs.forEach((c, i) => {
        const l = c.l, tp = c.t, r = l + bw, b = tp + th; let k = c.pen - (i === prev ? 260 : 0);
        if (b > Y1) k += 1e6;
        placed.forEach((q) => { const a = overlap(l - 4, tp - 4, r + 4, b + 4, q); if (a) k += 2e5 + a; });
        if (eq) { const a = overlap(l, tp, r, b, eq); if (a) k += 1e5 + a; }
        const per = {}; obs.forEach((o) => { const a = overlap(l + 2, tp + 2, r - 2, b - 2, o); if (a > (per[o[4]] || 0)) per[o[4]] = a; }); // mỗi món tính phần bị che lớn nhất
        for (const id in per) k += per[id];
        if (k < bk) { bk = k; best = i; }
      });
      AV.keep[key] = best;
      const c = cs[best], l = c.l, tp = c.t, r = l + bw, b = tp + th, [qx, qy] = c.A; placed.push([l, tp, r, b]);
      // Đường dẫn: từ mép nhãn gần điểm neo nhất tới điểm neo (đỉnh món khi nhãn ở trên hoặc bên cạnh, chân món khi nhãn ở dưới)
      let px, py;
      if (qy >= b) { px = clamp(qx, l + 10, r - 10); py = b; } else if (qy <= tp) { px = clamp(qx, l + 10, r - 10); py = tp; } else { px = qx < l ? l : r; py = clamp(qy, tp + 5, b - 5); }
      const inside = qx > l && qx < r && qy > tp && qy < b, vx = qx - px, vy = qy - py;
      const css = `${Math.round(l - t.X)}|${Math.round(tp - t.Y)}|${Math.round(px - l - 1)}|${Math.round(py - tp - 1)}|${inside ? 0 : Math.round(Math.hypot(vx, vy))}|${Math.atan2(-vx, vy).toFixed(3)}`;
      if (t.el._av !== css) {
        t.el._av = css; const v = css.split('|'), s = t.el.style;
        s.setProperty('--ox', v[0] + 'px'); s.setProperty('--oy', v[1] + 'px'); s.setProperty('--lx', v[2] + 'px'); s.setProperty('--ly', v[3] + 'px'); s.setProperty('--len', v[4] + 'px'); s.setProperty('--rot', v[5] + 'rad');
      }
      t.el.classList.add('is-av');
    });
  }

  // ---------- KHUNG TỰ CANH THEO BỘ DỤNG CỤ (21/11; chủ: "từng set trong bàn thí nghiệm bị 2 bảng info che, góc xoay gần như vẫn bị che") ----------
  // Trước đây khung của một bàn canh theo bề ngang w đặt tay trong giáo án và chỉ đúng ở góc nhìn thẳng: món nằm ngoài w (cân, bình tia, vòi nước ở bước một bình)
  // chui dưới bảng phải; xoay sang bên thì đầu bàn gần máy quay phình ra, lại lọt dưới bảng. Giờ khung chuẩn được GIẢI từ hộp bao thật của mọi món đang hiện trên bàn:
  // máy quay đứng ở chỗ gần nhất mà mọi góc hộp vẫn nằm trong phần cảnh không bị bảng che (stage.insets), ở đúng hướng đang nhìn. Người dùng xoay thì giải lại
  // mỗi khung hình, nên xoay góc nào bộ dụng cụ cũng nằm giữa hai bảng. Tự phóng to hoặc dời khung (cuộn, nút +, Shift + kéo) thì thôi canh, tới khi về khung chuẩn.
  // Chỉ màn từ 900 px (màn hẹp không có bảng nổi). Giáo án vẫn quyết hướng nhìn (az, el), ống kính (fov) và chiều cao khung (h).
  const FIT = { on: false, pend: 0, moved: false, sig: '', ref: 0, pts: [], ext: [], age: 9, key: '', slow: 0, cam: new THREE.PerspectiveCamera(), last: V3(), ctr: V3(), g: null, drag: false, hold: 0 };
  // Chuyển động máy quay (27/11, đối chiếu Lab-SML). glide: vào hoặc ra cận cảnh đi theo kiểu rời chậm, hãm trước đích trong dur giây.
  // drag / hold: đang kéo xoay thì khung KHÔNG tự canh (xoay quanh một tâm, vật không to nhỏ theo góc); thả tay, chờ quán tính lắng rồi mới lia về khung vừa.
  function glide(dur = 0.9) { FIT.g = { p: stage.camera.position.clone(), t: stage.controls.target.clone(), u: 0, dur }; }
  const D2R = THREE.MathUtils.degToRad, FIT_X = 6, FIT_T = 44, FIT_B = 10; // lề thêm (điểm ảnh): hai bên, phía trên (chỗ cho nhãn nằm trên món cao nhất), phía dưới
  // KHUNG THEO BƯỚC (sa bàn · 27/11): bài học gọi api.frame(bid, ids, view) để khung chuẩn của bàn chỉ canh theo một nhóm món (một khu của sa bàn), có thể kèm hướng nhìn riêng (az, el).
  // Khác cận cảnh (B.focus, tạm thời lúc tay đang làm): khung theo bước giữ nguyên tới khi bài học đổi. Bàn không gọi frame thì mọi thứ như cũ.
  // Màn hẹp không có bảng nổi nên stage.insets trống: bàn đang có khung theo bước thì dùng lề cố định (chừa thanh chế độ ở trên, thẻ phương trình ở dưới).
  const INS0 = { l: 0, r: 0, t: 0.17, b: 0.15 }, insOf = (B) => stage.insets || (B && B.frame ? INS0 : null);
  const fitBase = (B) => { const v = B.solo ? B.viewSolo : B.view; return B.frame && B.frame.view ? { ...v, ...B.frame.view } : v; };
  const fitSig = (id, B) => { const i = stage.insets || {}; return [host.clientWidth, host.clientHeight, i.l, i.r, i.t, i.b].map((v) => (+v || 0).toFixed(4)).join('|') + '|' + id + '|' + (B.solo || ''); };
  function fitPoints(B) { // góc hộp bao (toạ độ phòng) của mọi món đang hiện; đo lại mỗi 0,3 giây, đứng yên khi tay đang cầm món di chuyển
    const F = B.focus, FR = !F && B.frame ? B.frame : null, key = B.id + '|' + (B.solo || '') + '|' + (F ? F.key : 0) + '|' + (FR ? FR.key : 0); // F: cụm cận cảnh đang thao tác (setFocus): chỉ canh theo các món đó
    if (key === FIT.key && FIT.pts.length && (FIT.age < 0.3 || B.seq.busy() || F)) return;
    FIT.key = key; FIT.age = 0; const pts = FIT.pts = [];
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    Object.values(B.items).forEach((it) => {
      if (!it.obj.visible || (F && !F.ids.includes(it.id)) || (FR && !FR.ids.includes(it.id))) return; const p = it.obj.getWorldPosition(V3()); pts.push(p);
      partBoxes(it).forEach(([a, b]) => { for (let i = 0; i < 8; i++) pts.push(V3(p.x + (i & 1 ? b.x : a.x), p.y + (i & 2 ? b.y : a.y), p.z + (i & 4 ? b.z : a.z))); });
    });
    if (F) F.extra.forEach((p) => pts.push(p.clone()));
    pts.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
    const v = fitBase(B), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; FIT.ctr.set(cx, v.target[1], cz);
    FIT.ext = F || FR ? [] : [V3(cx, v.target[1] - v.h / 2, cz), V3(cx, v.target[1] + v.h / 2, cz)]; // chiều cao khung theo giáo án: chỉ tính cho chiều dọc (cận cảnh thì chỉ theo cụm món)
  }
  // Giải vị trí máy quay cho hướng nhìn và ống kính của cam: gần nhất mà mọi điểm vẫn nằm trong phần cảnh không bị che, bộ dụng cụ nằm giữa phần đó.
  function fitSolve(cam) {
    const w = host.clientWidth, h = host.clientHeight, ins = insOf(active && benches[active]); if (!w || !h || !ins || !FIT.pts.length) return null;
    const e = cam.projectionMatrix.elements, q = cam.quaternion, r = V3(1, 0, 0).applyQuaternion(q), u = V3(0, 1, 0).applyQuaternion(q), f = V3(0, 0, -1).applyQuaternion(q);
    const X0 = Math.max(ins.l * w + FIT_X, 22), X1 = w - Math.max(ins.r * w + FIT_X, 22), Y0 = ins.t * h + FIT_T, Y1 = h - ins.b * h - FIT_B; // không có bảng bên cạnh (ba cột) vẫn chừa 22 px tới mép cảnh
    const A = (2 * X0 / w - 1 + e[8]) / e[0], Bq = (2 * X1 / w - 1 + e[8]) / e[0], C = (1 - 2 * Y1 / h + e[9]) / e[5], D = (1 - 2 * Y0 / h + e[9]) / e[5]; // mép trái, phải, dưới, trên tính theo tang góc nhìn
    if (Bq - A < 0.02 || D - C < 0.02) return null;
    let MA = Infinity, MB = -Infinity, MC = Infinity, MD = -Infinity;
    const each = (p, side) => { const xr = p.dot(r), xu = p.dot(u), xf = p.dot(f); if (side) { MA = Math.min(MA, xr - A * xf); MB = Math.max(MB, xr - Bq * xf); } MC = Math.min(MC, xu - C * xf); MD = Math.max(MD, xu - D * xf); };
    FIT.pts.forEach((p) => each(p, true)); FIT.ext.forEach((p) => each(p, false));
    const pf = Math.min((MA - MB) / (Bq - A), (MC - MD) / (D - C)), pr = (MB + Bq * pf + MA + A * pf) / 2, pu = (MD + D * pf + MC + C * pf) / 2;
    const pos = r.multiplyScalar(pr).addScaledVector(u, pu).addScaledVector(f, pf);
    return { pos, f, depth: FIT.ctr.dot(f) - pf }; // depth: từ máy quay tới giữa bộ dụng cụ, dọc theo hướng nhìn (tâm xoay đặt ở đó)
  }
  // Khung chuẩn của một bàn, đưa cho stage.focus: cùng hướng nhìn với giáo án, nhưng tâm và khoảng cách lấy từ lời giải ở trên.
  // Khung tự canh và cận cảnh chạy ở màn rộng (từ 900 px). Bàn khai closeup thì chạy cả ở màn hẹp: lúc nhỏ giọt, lúc phản ứng máy quay vẫn tới gần ống
  // (chủ 27/11 xem ở khung 850 px: "sao lúc xảy ra phản ứng k mô tả hay zoom gần vào nhỉ"). Bàn không khai closeup giữ nguyên cách cũ.
  const fitOK = (B) => WIDE.matches || !!(B && (B.d.closeup || B.frame));
  function fitView(B) {
    const base = fitBase(B), w = host.clientWidth, h = host.clientHeight, real = stage.insets, ins = insOf(B);
    if (!fitOK(B) || !ins || !w || !h) return base;
    FIT.age = 9; fitPoints(B);
    const c = FIT.cam, az = D2R(base.az || 0), el = D2R(base.el ?? 16), cyv = base.cy ?? 0.5;
    c.fov = base.fov || 28; c.aspect = w / h;
    const ox = real ? ((ins.r - ins.l) / 2) * w : 0, oy = real ? (0.5 - ins.t - (1 - ins.t - ins.b) * cyv) * h : 0; // cùng cách dời tâm chiếu với stage.js (applyInsets); màn hẹp không dời
    if (Math.abs(ox) > 0.5 || Math.abs(oy) > 0.5) c.setViewOffset(w, h, ox, oy, w, h); else c.clearViewOffset();
    c.updateProjectionMatrix(); c.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); c.up.set(0, 1, 0); c.lookAt(0, 0, 0);
    const s = fitSolve(c); if (!s || !(s.depth > 0.5)) return base;
    const d = s.depth, T = s.pos.clone().addScaledVector(s.f, d), t = Math.tan(D2R(c.fov / 2)), fw = Math.max(0.2, 1 - ins.l - ins.r);
    FIT.ref = d;
    return { ...base, target: [T.x, T.y, T.z], w: (2 * d * t * c.aspect * fw) / 1.04, h: 0.001, maxDist: Math.max(base.maxDist || 16.5, d * 1.3) }; // w chọn sao cho stage.js (solve) ra đúng khoảng cách d
  }
  const zoomNow = () => (active && fitOK(benches[active]) && FIT.ref ? (FIT.on ? 1 : stage.camera.position.distanceTo(CTRL.target) / FIT.ref) : stage.zoom()); // 1 = đúng khung chuẩn, lớn hơn 1 = đã lùi ra
  CTRL.addEventListener('start', () => { FIT.moved = true; FIT.pend = 0; FIT.drag = true; FIT.g = null; });
  CTRL.addEventListener('end', () => { FIT.drag = false; FIT.hold = 0.45; });
  host.addEventListener('wheel', () => { FIT.on = false; }, { passive: true, capture: true });
  let fitTouch = 0; // số ngón tay đang đặt trên cảnh: từ hai ngón là dời hoặc phóng
  host.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') fitTouch++;
    if (!panAtAnyZoom && (dragPan || e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey || fitTouch > 1)) FIT.on = false;
  }, { capture: true });
  if (panAtAnyZoom) {
    // Wait for a camera drag. Clicking a bench label or handling the pipette still allows automatic close-ups.
    stage.renderer.domElement.addEventListener('pointermove', e => {
      if (e.buttons && (e.movementX || e.movementY)) FIT.on = false;
    });
  }
  ['pointerup', 'pointercancel'].forEach((n) => window.addEventListener(n, (e) => { if (e.pointerType === 'touch') fitTouch = Math.max(0, fitTouch - 1); }));
  function fitUpdate(dt) {
    const B = active && benches[active]; if (!B || !fitOK(B) || !insOf(B)) return;
    const cam = stage.camera, sig = fitSig(active, B), mv = cam.position.distanceTo(FIT.last); FIT.last.copy(cam.position); FIT.age += dt;
    // Bảng thu gọn, cửa sổ đổi cỡ, đổi chế độ một bình: khung chuẩn cũ không còn đúng. Chưa ai đụng vào máy quay thì lia tới khung chuẩn mới.
    if (sig !== FIT.sig) { FIT.sig = sig; if (!FIT.moved && FIT.on) { stage.focus(fitView(B)); FIT.pend = 3; return; } }
    if (FIT.pend > 0) { FIT.pend -= dt; if (FIT.pend < 2.8 && mv < 1e-5) FIT.pend = 0; return; } // stage.js đang tự lia tới khung chuẩn: chờ tới nơi
    if (!FIT.on) return;
    if (FIT.drag) return;
    if (FIT.hold > 0) { FIT.hold -= dt; if (FIT.hold > 0) return; glide(0.5); }
    fitPoints(B); const s = fitSolve(cam); if (!s) return;
    if (FIT.slow > 0) FIT.slow -= dt; // vào hoặc ra cận cảnh: lia chậm hơn để mắt theo kịp
    const d = clamp(s.depth, CTRL.minDistance * 1.02, CTRL.maxDistance * 0.98), T = TMPV.copy(s.pos).addScaledVector(s.f, d), k = Math.min(1, dt * (FIT.slow > 0 ? 2.6 : 8));
    if (FIT.g) { const g = FIT.g; g.u = Math.min(1, g.u + dt / g.dur); const e = g.u < 0.5 ? 2 * g.u * g.u : 1 - Math.pow(-2 * g.u + 2, 2) / 2;
      cam.position.lerpVectors(g.p, s.pos, e); CTRL.target.lerpVectors(g.t, T, e); FIT.last.copy(cam.position); if (g.u >= 1) FIT.g = null; }
    else if (cam.position.distanceToSquared(s.pos) > 1e-8 || CTRL.target.distanceToSquared(T) > 1e-8) { cam.position.lerp(s.pos, k); CTRL.target.lerp(T, k); FIT.last.copy(cam.position); }
    FIT.ref = d;
  }

  const VIEWS = { all: { swing: 38, elMin: 8, elMax: 62, ...M3.overview } };
  list.forEach((B) => { VIEWS[B.id] = B.view; });
  syncScene();

  const api = {
    stage, benches, CABINET,
    view: (id, immediate) => {
      const B = benches[id]; FIT.on = !!B; FIT.moved = false; FIT.pend = B && !immediate ? 3 : 0;
      const v = B ? fitView(B) : VIEWS.all; if (B) FIT.sig = fitSig(id, B);
      stage.focus(v, immediate);
    },
    // Khung theo bước: ids = các món khung chuẩn phải ôm trọn (null = cả bàn), view = { az, el } nếu bước cần hướng nhìn riêng. Gọi xong thì gọi view(bid) để máy quay lia tới.
    frame(bid, ids, view) { const B = benches[bid]; if (!B) return; const k = ids && ids.filter((id) => B.items[id]); B.frame = k && k.length ? { ids: k, view: view || null, key: (B.frameN = (B.frameN || 0) + 1) } : null; FIT.age = 9; },
    // Tới gần một bàn (id) hoặc về toàn cảnh (null). Rời bàn nào thì động tác đang dở của bàn đó được làm xong ngay.
    setActive(id) { if (active && active !== id && benches[active]) benches[active].seq.flush(); active = id && benches[id] ? id : null; zoomGoal = null; if (!active) FIT.on = false; camMode(); syncScene(); },
    // THANH MỨC ZOOM: 100% = khung chuẩn của bàn (hoặc của cả phòng). zoomBy(1.35) = tới gần hơn một nấc, zoomBy(1 / 1.35) = lùi ra một nấc; trong giới hạn của khung đang xem.
    zoomPct: () => Math.round(100 / zoomNow() / 5) * 5,
    zoomBy(f) { const d = zoomGoal ?? stage.camera.position.distanceTo(CTRL.target); CTRL.dispatchEvent({ type: 'start' }); FIT.on = false; zoomGoal = clamp(d / f, CTRL.minDistance, CTRL.maxDistance); },
    zoomReset() { zoomGoal = null; stage.resetView(); },
    dragMode: () => (dragPan ? 'pan' : 'rotate'), // kéo chuột lúc này dời khung hay xoay
    active: () => active,
    setNames(on, focus = false) { names = on; tagFocus = !!focus; syncScene(); }, // focus = true: thẻ tên theo việc (xem focusSet)
    setHands(on, msg = '') { hands = on; handsMsg = msg; syncScene(); }, // on = false: chỉ xem, chạm vào món thì hiện lời msg
    on(name, f) { cb[name] = f; }, // 'change' (bàn đổi trạng thái), 'say' (lời nhắc), 'pick' (chạm một bàn), 'done' (một lần chạy xong: id bàn, dòng kết quả)
    hand: (bid, itemId) => hand(benches[bid], itemId),
    // Nút sinh đôi: làm việc sid của bàn bid (k = số thứ tự lựa chọn nếu có)
    act(bid, sid, k) {
      const B = benches[bid], s = B.d.steps.find((x) => x.id === sid); if (!s) return false;
      if (active !== bid || !hands) return false;
      const g = s.guard && can(B, s) && s.guard(B, pickOpt(B, s, s.range ? undefined : k) || optsOf(s)[0]); if (g) { say(g); return false; } // giáo án chặn việc: chỉ nói lời của giáo án
      if (act(B, s, pickOpt(B, s, s.range ? undefined : k))) return true;
      if (!B.seq.busy()) { const n = nextStep(B); say(B.run ? 'Thí nghiệm đã chạy. Rửa dụng cụ rồi mới làm lại được.' : n && n !== s ? `Làm việc này trước: ${n.label}.` : `Việc "${s.label}" đã làm.`); }
      return false;
    },
    rinse: (bid, instant) => rinse(benches[bid], instant),
    reset(bid) { const B = benches[bid]; B.seq.flush(); reset(B); syncScene(); emit(B); },
    // Đặt sẵn bàn: làm ngay (không hoạt cảnh) một số việc đầu. todo = [[id việc, số thứ tự lựa chọn], ...]
    preset(bid, todo) { const B = benches[bid]; B.seq.flush(); reset(B); todo.forEach(([sid, k]) => { if (sid === 'rinse') { reset(B); return; } const s = B.d.steps.find((x) => x.id === sid); if (!s) return; act(B, s, pickOpt(B, s, k), true); finishRun(B); }); B.focus = null; syncScene(); emit(B); }, // dựng lại trạng thái đã lưu thì không vào cận cảnh (cận cảnh chỉ dành cho lúc tay đang làm)
    // Chế độ một bình: key = 'ref' | 'exp' | null. Món khai of khác key thì ẩn đi. Bàn được dọn sạch khi đổi chế độ.
    solo(bid, key) { const B = benches[bid]; B.seq.flush(); B.solo = key || null; Object.values(B.items).forEach((it) => { if (it.spec.of) it.obj.visible = !B.solo || it.spec.of === B.solo; }); reset(B); syncScene(); emit(B); },
    // Đặt con số cho một việc có lượng tự chọn (chưa làm gì trên bàn). Trả về con số sau khi làm tròn và chặn theo dụng cụ.
    setWant(bid, sid, v) { const B = benches[bid], s = B.d.steps.find((x) => x.id === sid); if (!s || !s.range || !Number.isFinite(v)) return s && s.range ? wantOf(B, s) : null; B.want[s.var] = snap(s.range, v); return B.want[s.var]; },
    // Chụp ảnh nhỏ của một bàn (hoặc toàn cảnh) ngay trong cảnh 3D, để làm THẺ HÌNH. crop = vùng an toàn (phần khung không bị thẻ che).
    // Máy quay nhảy tới khung của bàn, vẽ một khung hình, chép ra ảnh; nơi gọi tự đưa máy quay về chỗ cũ.
    snapshot(id, { l = 0, r = 0, t = 0, b = 0 } = {}, tw = 312, th = 198) {
      const B = benches[id]; stage.focus(B ? (B.solo ? B.viewSolo : B.view) : VIEWS.all, true); stage.renderOnce();
      const src = stage.renderer.domElement, W = src.width, H = src.height, sx = l * W, sy = t * H, sw = W * (1 - l - r), sh = H * (1 - t - b);
      let cw = sw, ch = (sw * th) / tw; if (ch > sh) { ch = sh; cw = (sh * tw) / th; }
      const c = document.createElement('canvas'); c.width = tw; c.height = th;
      c.getContext('2d').drawImage(src, sx + (sw - cw) / 2, sy + (sh - ch) / 2, cw, ch, 0, 0, tw, th);
      return c.toDataURL('image/jpeg', 0.86);
    },
    setup(bid, opts) { const B = benches[bid]; B.seq.flush(); B.opts = { ...(opts || {}) }; reset(B); syncScene(); emit(B); }, // tuỳ chọn bài học đặt cho bàn (ví dụ thứ tự ống ở bước Sát hạch), bàn về đầu
    enable(bid, sid, yes) { const B = benches[bid]; if (yes) B.off.delete(sid); else B.off.add(sid); syncRings(B); },
    // Trạng thái các việc của một bàn, để vẽ nút sinh đôi
    proc(bid) {
      const B = benches[bid], n = nextStep(B), busy = B.seq.busy();
      return {
        busy, run: B.run, level: B.level,
        steps: B.d.steps.filter((s) => !B.off.has(s.id)).map((s, i) => ({ id: s.id, n: i + 1, label: s.label, role: s.role, done: !!B.st[s.id], next: n === s && !busy, can: can(B, s),
          options: s.options ? s.options.map((o, k) => ({ k, label: o.label, on: !!B.st[s.id] && B.level[s.var] === o.v })) : null,
          range: s.range ? { ...s.range, want: wantOf(B, s), ref: (B.d.ref || {})[s.var], value: B.st[s.id] ? B.level[s.var] : null } : null })),
        rinse: B.d.rinse ? { label: B.d.rinse.label || 'Rửa dụng cụ, làm lại', can: !busy && (!!B.run || Object.keys(B.st).length > 0), next: !!(B.run && B.run.done) && !busy } : null,
      };
    },
    update(dt) {
      if (active && tagFocus && benches[active].d.tagFocus && (tagT += dt) > 0.25) { tagT = 0; const B0 = benches[active], fs = focusSet(B0), k = fs ? [...fs].sort().join() : ''; if (k !== B0.tagKey) syncTags(B0); } // việc kế tiếp đổi thì đổi theo bộ thẻ đang hiện
      // Máy quay ở một bàn: tâm nhìn (dời bằng Shift + kéo, kéo chuột phải, hai ngón, hoặc cuộn vào chỗ con trỏ) không rời khỏi bàn đang xem
      if (active) {
        const t = CTRL.target, v = benches[active].view.target, isl = benches[active].d.island !== false, hx = isl ? 3.3 : 5.5, hz = isl ? 1.8 : 0.6, y0 = isl ? 0.15 : v[1] - 3.2, y1 = isl ? 3.4 : v[1] + 3.2;
        const nx = clamp(t.x, v[0] - hx, v[0] + hx), ny = clamp(t.y, y0, y1), nz = clamp(t.z, v[2] - hz, v[2] + hz);
        if (nx !== t.x || ny !== t.y || nz !== t.z) { stage.camera.position.x += nx - t.x; stage.camera.position.y += ny - t.y; stage.camera.position.z += nz - t.z; t.set(nx, ny, nz); }
      }
      fitUpdate(dt); // khung tự canh: bộ dụng cụ của bàn đang xem nằm gọn giữa hai bảng nổi, xoay góc nào cũng vậy
      if (active && !panAtAnyZoom) { const z = 1 / zoomNow(); if (!dragPan && z >= 1.3) setDrag(true); else if (dragPan && z <= 1.1) setDrag(false); }
      if (zoomGoal != null) { // nút + và − của thanh mức zoom: máy quay trượt tới khoảng cách mới
        const cam = stage.camera, v = TMPV.copy(cam.position).sub(CTRL.target), d = v.length(), nd = Math.abs(zoomGoal - d) < 0.02 ? zoomGoal : d + (zoomGoal - d) * Math.min(1, dt * 10);
        cam.position.copy(CTRL.target).add(v.setLength(nd)); if (nd === zoomGoal) zoomGoal = null;
      }
      list.forEach((B) => {
        const was = B.seq.busy(); B.seq.tick(dt); if (was && !B.seq.busy()) syncRings(B);
        if (B.focus) { if (B.seq.busy() || (B.run && !B.run.done)) B.focusHold = B.d.closeupHold || 0.8; else if ((B.focusHold -= dt) <= 0) { B.focus = null; FIT.slow = 1.6; glide(); } } // xong thao tác (và lần chạy ngắn sau nó) thì lùi ra
        if (B.run && !B.run.done && !B.rinsing && !B.seq.busy()) {
          const sp = B.d.chem.speed; B.run.t += dt * (typeof sp === 'function' ? B.d.chem.speed(B) : sp || 1);
          const r = B.d.chem.frame(B, B.run.t);
          // TÍN HIỆU PHẢN ỨNG XONG của từng bình: nhãn của bình đổi sang màu "xong" + nháy, vòng sáng dưới bình nháy, và báo cho bài học
          B.run.marks.forEach((m) => { if (m.fired || B.run.t < m.at) return; m.fired = true; stage.setTag(B.id + '/' + m.tag, { done: true }); const el = B.tagEls[m.tag]; if (el) { el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop'); } if (m.ring) B.pulse[m.ring] = 2.4; syncRings(B); if (cb.mark) cb.mark(B.id, m); });
          if (r && r.done && r.end) { B.run = null; emit(B); } // lần chạy kết thúc hẳn (ví dụ bàn tự khoá phễu khi khí thoát ra): làm tiếp được, không cần rửa
          else if (r && r.done) { B.run.done = true; B.run.row = B.d.chem.row ? B.d.chem.row(B) : null; emit(B); if (cb.done) cb.done(B.id, B.run.row); }
        }
        const pk = Object.keys(B.pulse); if (pk.length) { pk.forEach((id) => { B.pulse[id] -= dt; if (B.pulse[id] <= 0) delete B.pulse[id]; }); if (Object.keys(B.pulse).length !== pk.length) syncRings(B); }
        Object.entries(B.rings).forEach(([id, r]) => { const p = B.items[id].obj.position; r.position.x = p.x; r.position.z = p.z; r.userData.update(dt); });
        const f = B.fade; if (f.k !== f.goal) { f.k += (f.goal - f.k) * Math.min(1, dt * 7); if (Math.abs(f.goal - f.k) < 0.01) f.k = f.goal; applyFade(B); }
      });
      updaters.forEach((f) => f(dt));
      avoidTags(dt);
      if (wallMats.length) { const goal = active ? (ROOM.dim ?? 0.72) : 1; if (Math.abs(goal - wallK) > 0.002) { wallK += (goal - wallK) * Math.min(1, dt * 5); wallMats.forEach((m) => m.color.setScalar(0.95 * wallK)); } }
    },
  };
  // "Về góc chuẩn" và bấm con số phần trăm: ở một bàn thì về khung chuẩn vừa giải lại (bộ dụng cụ có thể đã đổi từ lần lia trước), không dùng lại khung cũ.
  let warm = 0; stage.onFrame(() => { if (warm >= 0 && ++warm === 4) { warm = -1; stage.precompile(); } }); // sau vài khung đầu: biên dịch sẵn shader, kể cả món đang ẩn
  const reset0 = stage.resetView; stage.resetView = () => { if (active && fitOK(benches[active])) api.view(active); else reset0(); };
  return api;
}
