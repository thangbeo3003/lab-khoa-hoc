// Kiểm phần tính của "Xem lại một lần thử": dựng lại từ dòng lịch sử phải ra đúng màu và thể tích đã ghi.
import assert from 'node:assert/strict';
import { newTube, add, look, DROP_ML } from '../../free/tubechem.js';
import { framesOf, partnerOf, colourGap, GAP } from './xem_lai.js';

const DROP = { mL: DROP_ML, drop: true };
function trial(salt, steps) { // làm thật như bàn: 2 mL mẫu, rồi từng chất × số giọt; trả về các dòng lịch sử
  const t = newTube(); add(t, salt, { mL: 2 }); const rows = [];
  steps.forEach(([tubeId, chem, drops]) => { for (let i = 0; i < drops; i++) add(t, chem, DROP); const L = look(t); rows.push({ round: 1, tubeId, salt, chem, drops, volume: t.vol, hex: L.hex }); });
  return rows;
}
// 1. Nước chlorine vào sodium bromide: dựng lại khớp, có giọt đổi màu
let rows = trial('NaBr', [['tBr', 'Cl2', 20]]);
let R = framesOf(rows, 0);
assert.equal(R.frames.length, 21); assert.ok(R.ok, 'dựng lại phải khớp màu và thể tích đã ghi');
assert.equal(R.frames[0].vol, 2); assert.ok(R.change >= 1 && R.change <= 20, 'phải có giọt đổi màu');
assert.ok(colourGap(R.frames[R.change].hex, R.frames[0].hex) >= GAP);
if (R.change > 1) assert.ok(colourGap(R.frames[R.change - 1].hex, R.frames[0].hex) < GAP, 'giọt ngay trước chưa đổi');
// 2. Hai lần nhỏ nối tiếp vào cùng một ống (chlorine rồi hồ tinh bột): dòng 2 bắt đầu từ trạng thái sau dòng 1
rows = trial('KI', [['tI', 'Cl2', 20], ['tI', 'tinhbot', 5]]);
R = framesOf(rows, 1); assert.ok(R.ok); assert.equal(R.frames[0].hex, rows[0].hex); assert.equal(R.frames.length, 6);
// 3. Ống đối chứng chỉ nhận nước cất: không có giọt đổi màu
rows = trial('NaBr', [['tRef', 'H2O', 20]]);
R = framesOf(rows, 0); assert.ok(R.ok); assert.equal(R.change, null);
// 4. Tìm ống đem so: cùng lượt, ưu tiên cùng chất, không thì lần nhỏ nước cất
const all = [...trial('NaBr', [['tRef', 'H2O', 20]]), ...trial('NaBr', [['tBr', 'Cl2', 20]])];
assert.deepEqual(partnerOf(all, 1, [['tRef', 'tBr']]), { id: 'tRef', k: 0 });
assert.equal(partnerOf(all, 0, [['tRef', 'tBr']]), null); // ống đối chứng tự nó không có ống đem so
assert.deepEqual(partnerOf([all[1]], 0, [['tRef', 'tBr']]), { id: 'tRef', k: -1 });
// 5. Dòng của tủ hút (run) không xem lại được
assert.equal(framesOf([{ run: true }], 0), null);
console.log('ĐẠT: xem lại một lần thử (dựng lại theo từng giọt)');
