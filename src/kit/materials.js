// Bảng màu và vật liệu dùng chung. Visual style S2 "phòng lab hiện đại" (chủ chốt 18/11):
// trắng, xám lạnh, mặt bàn đen mờ, inox, thuỷ tinh trong và nâu, đúng MỘT màu nhấn là xanh lam.
import * as THREE from 'three';

export const PAL = {
  wall: 0xf2f4f5, floor: 0xd3d7da, ceiling: 0xffffff,
  benchTop: 0x1b1e21, cabinet: 0xf5f6f7, cabinetFront: 0xdde1e4, plinth: 0x2a2d31,
  steel: 0xb9c0c7, metalDark: 0x30343a, plastic: 0xf1f2f3,
  accent: 0x2f6fd0, // màu nhấn duy nhất: nắp lọ, mặt ghế
  water: 0xd9edf6, amber: 0x7a4a1c, rubber: 0x8c4a3c, stone: 0xf1eee6, ink: 0x16324f,
};

// Màu hạt cố định cho mọi bài (quy ước CPK).
export const ATOM = { H: '#ffffff', C: '#3a3f47', O: '#e03a3a', N: '#3b6fe0', Cl: '#3fae4a', Ca: '#9fb8b0', pos: '#f08a24', neg: '#8a5ad6' };

export const QUALITY = { mobile: false };
// IBM Plex (chủ chốt 21/11): trang thực hành có data-font=plex; bài học bản 3 nạp ds_font.js sau khi module này đã chạy nên xét thẳng ?v=3. Bản 1, bản 2 không đổi.
const PLEX = document.documentElement.dataset.font === 'plex' || (/[?&]v=3(?!\d)/.test(location.search) && !/[?&]font=(inter|inter2|bevn)\b/.test(location.search));
export const FONT = (PLEX ? '"IBM Plex Sans", ' : '') + '"Be Vietnam Pro", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Thuỷ tinh: mặt ngoài bắt phản chiếu, mặt trong mờ hơn để thấy độ dày thành.
export function glassMat(color = 0xffffff, opacity = 0.16, side = THREE.FrontSide) {
  const m = new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity, roughness: 0.02, metalness: 0, clearcoat: QUALITY.mobile ? 0 : 1,
    specularIntensity: 1, envMapIntensity: 2.4, side, depthWrite: false,
  });
  // Thuỷ tinh thật: nhìn thẳng thì gần như trong suốt, nhìn xiên ở mép thì đậm và sáng. Chỉ bật khi QUALITY.fresnel.
  // QUALITY.edge (bản thử ?look=g): giữa thân trong hơn để không phủ mờ thứ bên trong, mép ngả xám xanh sẫm để còn đọc được trên nền sáng.
  const edge = !!QUALITY.edge;
  if (QUALITY.fresnel) { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'float lkF = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2); ' + (edge ? 'float lkE = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.35); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.11, 0.14), smoothstep(0.12, 0.7, lkE)); diffuseColor.a = clamp(diffuseColor.a * mix(0.12, 4.2, lkE), 0.0, 0.96);' : 'diffuseColor.a = clamp(diffuseColor.a * mix(0.4, 3.2, lkF), 0.0, 0.95);') + '\n#include <opaque_fragment>'); }; m.customProgramCacheKey = () => 'lkglass' + (edge ? 1 : 0); }
  return m;
}
// Một vật thuỷ tinh = 2 lưới cùng hình: mặt sau (thành trong) + mặt trước (thành ngoài).
export function glassPair(geometry, color = 0xd3e3e8, opacity = 0.3) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(geometry, glassMat(color, opacity * 0.6, THREE.BackSide)); back.renderOrder = 2;
  const front = new THREE.Mesh(geometry, glassMat(color, opacity, THREE.FrontSide)); front.renderOrder = 4;
  g.add(back, front);
  return g;
}
export function liquidMat(color = PAL.water, opacity = 0.5) {
  return new THREE.MeshPhysicalMaterial({ color, transparent: opacity < 1, opacity, roughness: 0.05, metalness: 0, envMapIntensity: 1.2, depthWrite: opacity >= 1 });
}
export function solidMat(color, roughness = 0.75, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
}
export const steelMat = () => new THREE.MeshStandardMaterial({ color: PAL.steel, roughness: 0.28, metalness: 0.9 });

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  return t;
}

// Thuỷ tinh có độ dày thật: thành ngoài + thành trong là hai mặt tròn xoay riêng (dày ~2 mm), đáy dày hơn.
export function glassShell(outerGeo, innerGeo, color = 0xd3e3e8, opacity = 0.3) {
  const g = new THREE.Group();
  const inner = new THREE.Mesh(innerGeo, glassMat(color, opacity * 0.75, THREE.BackSide)); inner.renderOrder = 2;
  const outerBack = new THREE.Mesh(outerGeo, glassMat(color, opacity * 0.45, THREE.BackSide)); outerBack.renderOrder = 2;
  const outer = new THREE.Mesh(outerGeo, glassMat(color, opacity, THREE.FrontSide)); outer.renderOrder = 4;
  g.add(outerBack, inner, outer);
  return g;
}

// Nhãn lọ hoá chất theo cấu trúc nhãn thật: tên chất, công thức, nồng độ hoặc dạng, dòng lô. Vẽ ở độ phân giải cao cho nét.
export function labelTexture(title, sub, name = '', foot = '250 mL  ·  phòng thí nghiệm') {
  return canvasTexture(1024, 680, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f6fd0'; g.fillRect(0, 0, w, 40);
    g.fillStyle = '#16324f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (name) { g.font = `600 78px ${FONT}`; g.fillText(name, w / 2, 130, w - 80); }
    g.font = `700 ${name ? 210 : 250}px ${FONT}`; g.fillText(title, w / 2, name ? 320 : 290, w - 90);
    if (sub) { g.font = `600 110px ${FONT}`; g.fillStyle = '#34495e'; g.fillText(sub, w / 2, 500, w - 90); }
    g.strokeStyle = '#9aa7b3'; g.lineWidth = 4; g.beginPath(); g.moveTo(70, 590); g.lineTo(w - 70, 590); g.stroke();
    g.fillStyle = '#7c8b9a'; g.font = `500 44px ${FONT}`; g.fillText(foot, w / 2, 634, w - 90);
    g.strokeStyle = '#c9d0d6'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
}

let _shadowTex = null;
export function contactShadow(radius, strength = 0.5) {
  if (!_shadowTex) {
    _shadowTex = canvasTexture(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    });
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: _shadowTex, transparent: true, opacity: strength, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2; m.position.y = 0.006; m.renderOrder = 0;
  return m;
}
