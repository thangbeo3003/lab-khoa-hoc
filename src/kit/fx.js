// Hiện tượng dùng chung: bọt khí. Số bọt và độ nhanh đi theo đúng tốc độ phản ứng.
import * as THREE from 'three';

export class Bubbles {
  // region: { y0, y1, radius(y) } trong hệ toạ độ của vật chứa
  constructor(count, region, { size = 0.035 } = {}) {
    this.count = count; this.region = region; this.size = size;
    this.mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }),
      count,
    );
    this.mesh.renderOrder = 2; this.mesh.frustumCulled = false;
    this.seed = Array.from({ length: count }, (_, i) => ({
      a: (i * 2.399963) % (Math.PI * 2), d: Math.sqrt(((i * 0.6180339) % 1)), p: (i * 0.37) % 1, v: 0.7 + ((i * 0.73) % 1) * 0.7, s: 0.6 + ((i * 0.41) % 1) * 0.8,
    }));
    this.level = 0; this._m = new THREE.Matrix4(); this._t = 0;
    this.update(0, 0);
  }
  update(dt, intensity) {
    this.level += (intensity - this.level) * Math.min(1, dt * 6 + (dt === 0 ? 1 : 0));
    this._t += dt;
    const { y0, y1, radius } = this.region, active = Math.ceil(this.level * this.count);
    for (let i = 0; i < this.count; i++) {
      const b = this.seed[i];
      b.p = (b.p + dt * b.v * (0.9 + 2.2 * this.level)) % 1;
      const y = y0 + b.p * (y1 - y0), r = radius(y) * 0.85 * b.d;
      const wob = Math.sin(this._t * 5 + i) * 0.015;
      let s = i < active ? this.size * b.s * (0.55 + 0.6 * b.p) : 0;
      if (b.p > 0.92) s *= (1 - b.p) / 0.08;
      this._m.makeScale(s, s, s).setPosition(Math.cos(b.a) * r + wob, y, Math.sin(b.a) * r);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
