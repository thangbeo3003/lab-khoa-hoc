// Công cụ đo cho bản thử kiểu chữ (21/11, fork L2·UX). Không trang nào nạp tệp này; gọi tay trên thuc_hanh.html:
//   (await import('/src/dev/font_do.js')).default()
// Dựng cùng một trạng thái (CuSO4 2 mL + NaOH 2 mL vào ống A) rồi trả về: font từng vùng, bảng độ đậm, chỗ chữ bị cắt, tràn ngang.
export default async function fontDo() {
  const F = window.__free;
  if (F.S.tubes[0].vol < 0.001) { F.selectChem('CuSO4'); F.addNow('CuSO4', 0, 'mL', 2); F.run(10); F.selectChem('NaOH'); F.addNow('NaOH', 0, 'mL', 2); F.run(20); window.__lens?.run?.(20); }
  await document.fonts.ready; await new Promise((r) => setTimeout(r, 700));
  const vis = (e) => e.offsetParent !== null;
  const hist = {}; let maxW = 0;
  document.querySelectorAll('#app *').forEach((e) => { if (!vis(e)) return; if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const w = getComputedStyle(e).fontWeight; hist[w] = (hist[w] || 0) + 1; maxW = Math.max(maxW, +w); });
  const over = (s) => [...document.querySelectorAll(s)].filter(vis).filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => `${s} «${e.textContent.trim().slice(0, 40)}» ${e.scrollWidth}>${e.clientWidth}`);
  const rect = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const fam = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily.split(',')[0] + ' ' + getComputedStyle(e).fontWeight : null; };
  const faces = [...document.fonts].filter((f) => f.status !== 'unloaded').map((f) => `${f.family} ${f.weight} ${f.status}`);
  const tools = document.querySelector('.tier.tools');
  return {
    url: location.search, attrs: [document.documentElement.dataset.font, document.documentElement.dataset.pt, document.documentElement.dataset.bo],
    faces: [...new Set(faces)], maxW, hist,
    fam: { body: fam('body'), eq: fam('.result .equation'), amount: fam('#amount'), reading: fam('.tube-selector .reading'), em: fam('.hud-it em'), num: fam('.hud-it small .num'), zoom: fam('.lens-zoom button:nth-child(2)'), tool: fam('.tier.tools .tool-bar button'), primary: fam('.primary'), h1: fam('.page-heading h1'), conc: fam('.chem-row .chem-meta'), evt: fam('.hud-evt b') },
    toolRadius: getComputedStyle(document.querySelector('.tier.tools .tool-bar:not(.end) button')).borderRadius,
    pageOverflow: document.documentElement.scrollWidth - innerWidth,
    over: [...over('.result .equation'), ...over('.hud-head h2'), ...over('.hud-it small'), ...over('.hud-evt'), ...over('.dose-bar'), ...over('.tier'), ...over('.dose-chem'), ...over('.tube-selector button'), ...over('.chem-name')],
    eq: document.querySelector('.result .equation')?.textContent, eqRect: rect('.result .equation'), toolsRect: rect('.tier.tools'), toolsRows: tools ? Math.round(tools.getBoundingClientRect().height) : null,
    doseRect: rect('#doseBar'), primaryRect: rect('.primary'), hudRect: rect('#lensHud'), hudScroll: (() => { const h = document.querySelector('#lensHud'); return h ? [h.scrollHeight, h.clientHeight] : null; })(),
  };
}
