// Mô hình tính của bài Tốc độ phản ứng. Hàm thuần, không đụng tới hình.
// Dữ kiện và giản lược: xem facts.md (F1..F12, S1..S8).

export const K = {
  M_CACO3: 100,        // g/mol (F3)
  VM: 24790,           // mL/mol ở 25 °C, 1 bar (F4)
  MASS: 0.30,          // g đá vôi
  V_ACID: 0.020,       // L acid
  GAMMA: 2,            // hệ số Van't Hoff (S4)
  T_REF: 25,
  TAU: 30,             // s, thang thời gian đã rút ngắn (S5)
  SURF: { vien: 1, vun: 3, bot: 10 }, // hệ số bề mặt (S2)
};

export const N0 = K.MASS / K.M_CACO3;          // mol CaCO3 ban đầu
export const V_MAX = N0 * K.VM;                // mL CO2 tối đa (F5)
const K_REF = N0 / (K.TAU * 1.0);              // mol/s ứng với viên, 1,0 M, 25 °C

export function tempFactor(temp) {
  return Math.pow(K.GAMMA, (temp - K.T_REF) / 10);
}

export function createRun({ form, conc, temp }) {
  return {
    form, conc, temp,
    t: 0,
    nSolid: N0,
    nAcid: conc * K.V_ACID,
    vGas: 0,
    rate: 0,          // mL/s tức thời
    done: false,
    tHalf: null,      // s để thu được nửa lượng khí
    points: [[0, 0]], // [t, V]
  };
}

function rateMol(run) {
  if (run.nSolid <= 0 || run.nAcid <= 0) return 0;
  const surf = K.SURF[run.form] * Math.pow(run.nSolid / N0, 2 / 3);
  const c = run.nAcid / K.V_ACID;
  return K_REF * tempFactor(run.temp) * surf * c;
}

// Tiến mô hình thêm dt giây (tự chia bước nhỏ để ổn định).
export function stepRun(run, dt) {
  if (run.done) return run;
  const h = 0.005;
  let left = dt;
  while (left > 1e-9 && !run.done) {
    const d = Math.min(h, left);
    left -= d;
    let dn = rateMol(run) * d;
    dn = Math.min(dn, run.nSolid, run.nAcid / 2);
    run.nSolid -= dn;
    run.nAcid -= 2 * dn;
    run.t += d;
    const vPrev = run.vGas;
    run.vGas = (N0 - run.nSolid) * K.VM;
    if (run.tHalf === null && run.vGas >= V_MAX / 2) {
      const f = (V_MAX / 2 - vPrev) / Math.max(run.vGas - vPrev, 1e-12);
      run.tHalf = run.t - d + f * d;
    }
    if (run.nSolid <= N0 * 3e-3 || run.nAcid <= 1e-9) {
      if (run.nSolid <= N0 * 3e-3) run.nSolid = 0; // phần đuôi rất chậm, coi như xong
      run.vGas = (N0 - run.nSolid) * K.VM;
      run.done = true;
    }
  }
  run.rate = run.done ? 0 : rateMol(run) * K.VM;
  const last = run.points[run.points.length - 1];
  if (run.done || run.t - last[0] >= 0.1) run.points.push([run.t, run.vGas]);
  return run;
}

// Chạy trọn một lần (dùng cho kiểm thử và cho đường tham chiếu).
export function simulate(setup, tMax = 2000) {
  const run = createRun(setup);
  while (!run.done && run.t < tMax) stepRun(run, 0.05);
  return run;
}

// Tốc độ trung bình khi thu nửa lượng khí đầu, mL/s (F9).
export function avgRate(run) {
  return run.tHalf ? (V_MAX / 2) / run.tHalf : null;
}

// Xúc tác: phân huỷ H2O2 bậc 1. k tính theo 1/s.
export const CAT = { K_NONE: 0.00002, K_MNO2: 0.12 };
export function peroxideLeft(k, t) { return Math.exp(-k * t); }
