// Kiểm thử mô hình bản 2. Chạy: node model2.test.mjs
import { REF, tConc, tTemp, tSurf, tCat, surfRun, gasAt, V_MAX, lensSetup } from './model2.js';
const near = (a, b, tol, name) => { if (Math.abs(a - b) > tol) { console.error(`SAI ${name}: ${a} khác ${b}`); process.exitCode = 1; } else console.log(`đạt ${name}: ${a.toFixed(3)}`); };
near(tConc(REF), 120, 1e-9, 'nồng độ đối chứng 120 s');
near(tConc({ ...REF, conc: 0.30 }), 20, 1e-9, 'nồng độ 0,30 M nhanh gấp 6');
near(tConc({ conc: 0.10, temp: 45 }), 15, 1e-9, 'nồng độ 0,10 M ở 45 °C = 15 s (bài sát hạch)');
near(tTemp({ temp: 45 }), 22.5, 1e-9, 'nhiệt độ 45 °C nhanh gấp 4');
near(tSurf({ size: 'vien' }) / tSurf({ size: 'vun' }), 3.0, 0.02, 'bề mặt: đập nhỏ nhanh gấp 3');
near(gasAt(surfRun('vien'), 1e6), V_MAX, 0.2, 'bề mặt: viên dừng ở V tối đa');
near(gasAt(surfRun('vun'), 1e6), V_MAX, 0.2, 'bề mặt: đập nhỏ dừng ở V tối đa');
near(tCat({ cat: true }), 5.776, 0.01, 'xúc tác: nửa lượng O₂ sau 5,8 s');
near(tCat({ cat: false }) / 3600, 9.63, 0.05, 'không xúc tác: khoảng 9,6 giờ');
const a = lensSetup(REF), b = lensSetup({ conc: 0.30, temp: 65, size: 'vun', cat: true });
if (!(b.count > a.count && b.speed > a.speed && b.hot > a.hot)) { console.error('SAI vòng kính: núm tăng mà số hạt, độ nhanh, hạt nóng không tăng'); process.exitCode = 1; } else console.log('đạt vòng kính: bốn núm đều làm tăng');
console.log(process.exitCode ? 'CÓ LỖI' : 'ĐẠT: tất cả kiểm thử mô hình bản 2');
