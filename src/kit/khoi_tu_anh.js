// KHỐI TRÒN XOAY DỰNG TỪ ẢNH KHO 2D (chủ 27/11: "Làm cách ghép"). Món tròn đều quanh trục (bình khí, tháp, bồn, bộ làm lạnh) dựng bằng LatheGeometry
// theo đúng đường viền của ảnh trong app/assets/flat (meta 'lathe' cho món đứng, 'latheX' cho món nằm, đo bằng tools/lathe_prof.py), rồi dán chính ảnh đó
// lên bề mặt bằng cách chiếu thẳng từ trước. Nhờ vậy bản 3D trông giống bản 2D (cùng một món đồ thật), mà vẫn dựng bằng mã, không cần mô hình 3D ngoài.
// Mặt sau dùng lại ảnh mặt trước (đồ tròn xoay nên gần đúng). rScale > 1 nong bán kính khi khung bài cần món mập hơn ảnh (ảnh giãn ngang tương ứng).
import * as T from 'three';

const META = await (await fetch('./assets/flat/meta.json?' + Date.now())).json();
const loader = new T.TextureLoader(), memo = {};
function texOf(key) {
  if (!memo[key]) { const t = loader.load('./assets/flat/' + META[key].file); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; memo[key] = t; }
  return memo[key];
}
export const coKhoi = (key) => !!(META[key] && (META[key].lathe || META[key].latheX));

// size: chiều cao (món đứng) hoặc chiều dài (món nằm) của CẢ ảnh theo đơn vị bàn.
// Trả { geo, mat, s, r (bán kính thân), y0, y1 (đoạn có thân, món đứng), toY(px), toX(px) } ; món đứng: gốc ở đáy ảnh, trục y. Món nằm: tâm ở giữa, trục x.
export function hinhTuAnh(key, size, { phiStart = 0, phiLength = Math.PI * 2, seg = 56, rScale = 1, mat = {} } = {}) {
  const m = META[key], lying = !m.lathe, P = m.lathe || m.latheX, a0 = lying ? m.left : m.top, a1 = lying ? m.right : m.bottom, s = size / (a1 - a0);
  let pts = P.map(([q, r]) => [lying ? (q - a0) * s : (a1 - q) * s, r * s * rScale]);
  if (!lying) pts.reverse();
  while (pts.length > 2 && pts[0][1] <= 0) pts.shift(); // bỏ phần không có thân (chân đế tách rời) ở hai đầu
  while (pts.length > 2 && pts[pts.length - 1][1] <= 0) pts.pop();
  const y0 = pts[0][0], y1 = pts[pts.length - 1][0];
  const v2 = [new T.Vector2(0.0005, y0), ...pts.map(([h, r]) => new T.Vector2(Math.max(r, 0.0005), h)), new T.Vector2(0.0005, y1)];
  const geo = new T.LatheGeometry(v2, seg, phiStart, phiLength);
  if (lying) geo.rotateZ(-Math.PI / 2); // trục dài của món nằm theo x: x = chiều dài, y = −bán kính cũ
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    if (!lying) uv.setXY(i, (m.cx + x / (s * rScale)) / m.w, 1 - (a1 - y / s) / m.h);
    else uv.setXY(i, (a0 + x / s) / m.w, 1 - (m.cy - y / (s * rScale)) / m.h);
  }
  if (lying) geo.translate(-size / 2, 0, 0);
  geo.computeVertexNormals();
  const material = new T.MeshStandardMaterial({ map: texOf(key), roughness: 0.5, metalness: 0.18, alphaTest: 0.5, envMapIntensity: 0.9, ...mat });
  return { geo, mat: material, s, r: (m.latheBody || 0) * s * rScale, y0, y1, toY: (py) => (a1 - py) * s, toX: (px) => (px - m.cx) * s * rScale };
}

export function khoiTuAnh(key, size, opts = {}) {
  const H = hinhTuAnh(key, size, opts), mesh = new T.Mesh(H.geo, H.mat);
  mesh.castShadow = mesh.receiveShadow = true;
  return Object.assign(H, { mesh });
}

// Vân kim loại sơn: nhiễu nhỏ cho độ nhám và độ gồ, để mặt khối không trơn như nhựa. Dùng chung một tấm cho mọi chất liệu.
let VAN = null;
export function vanKimLoai() {
  if (VAN) return VAN;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), img = x.createImageData(256, 256);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 256 * 256; i++) { const row = Math.floor(i / 256), streak = Math.sin(row * 0.9) * 6, v = 150 + streak + (rnd() - 0.5) * 70; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  VAN = new T.CanvasTexture(c); VAN.wrapS = VAN.wrapT = T.RepeatWrapping; VAN.repeat.set(3, 3);
  return VAN;
}
export function phuVan(mat, { bump = 0.012 } = {}) { const v = vanKimLoai(); mat.roughnessMap = v; mat.bumpMap = v; mat.bumpScale = bump; mat.needsUpdate = true; return mat; }
