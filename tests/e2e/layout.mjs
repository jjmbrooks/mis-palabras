// D15: prueba de maquetación. Sin scroll en la pantalla de ensayo y ninguna palabra cortada
// (MARIPOSA incluida) en 360×640 y 412×915. Usa el servidor de desarrollo con ?semilla (solo DEV).
// Uso: npm run test:layout  (CHROME=/ruta/a/chrome; SHOTS=/carpeta/prefijo- para guardar capturas)
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const VIEWPORTS = [[360, 640], [412, 915]];
const server = await createServer({ server: { port: 5181, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const fails = [];
const check = async (p, label) => {
  const r = await p.evaluate(() => ({
    scroll: document.documentElement.scrollHeight - innerHeight,
    cut: [...document.querySelectorAll('.word')].filter(e => e.offsetParent && (e.scrollWidth > e.clientWidth + 1 ||
      e.getBoundingClientRect().right > e.closest('.card,.model,main').getBoundingClientRect().right + 1)).map(e => e.textContent),
    off: [...document.querySelectorAll('.stage button, .stage .stim')].filter(e => e.offsetParent && e.getBoundingClientRect().bottom > innerHeight + 1).map(e => e.id || e.className),
  }));
  if (r.scroll > 1 || r.cut.length || r.off.length) fails.push(`${label}: scroll=${r.scroll} cortadas=${r.cut} fuera=${r.off}`);
};
try {
  for (const [width, height] of VIEWPORTS) {
    const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.addInitScript(() => { if (window.speechSynthesis) window.speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 20); });
    p.on('pageerror', e => fails.push(`error JS: ${e.message}`));
    await p.goto(`http://localhost:5181/?semilla`);
    await p.click('#d'); await p.waitForSelector('#start'); await p.click('#start');
    const seen = new Set(); let n = 0;
    while (n++ < 200 && !['leer', 'dibujo2', 'dibujo3', 'sin-dibujo3'].every(k => seen.has(k))) {
      await p.waitForSelector('#go, #again:not([disabled]), #home', { timeout: 20000 });
      if (await p.$('#home')) { await p.click('#home'); await p.waitForSelector('#start'); await p.click('#start'); continue; }
      if (await p.$('#go')) { await p.click('#go'); continue; }
      // D16: N1 = dibujo + 2 opciones, N2/N3 = dibujo + 3, N4 = sin dibujo + 3, N5 = leer.
      const kind = await p.evaluate(() => document.querySelector('#rok') ? 'leer' : `${document.querySelector('.stim') ? 'dibujo' : 'sin-dibujo'}${document.querySelectorAll('.opt').length}`);
      const label = `${width}x${height} ${kind}`;
      await check(p, label);
      if (!seen.has(kind)) {
        seen.add(kind);
        if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}${width}x${height}-${kind}.png` });
        if (kind !== 'leer') {
          // Peor caso: la palabra más larga del mazo en cada opción.
          await p.evaluate(() => document.querySelectorAll('.opt .word').forEach(e => { e.textContent = 'MARIPOSA'; e.style.setProperty('--n', '8'); }));
          await check(p, `${label} MARIPOSA`);
          if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}${width}x${height}-${kind}-mariposa.png` });
          // Con la Ayuda visible (dibujo + palabra modelo) también debe caber.
          // Corrección sin error: un error resalta la correcta como modelo, deja solo esa activa y muestra dibujo + palabra.
          const wrong = await p.$$eval('.opt', (bs, w) => bs.findIndex(b => b.getAttribute('aria-label') !== w), await p.$eval('#model .word', e => e.textContent));
          await p.locator('.opt').nth(wrong).click(); await p.waitForTimeout(200);
          const fix = await p.evaluate(() => ({ active: [...document.querySelectorAll('.opt:not([disabled])')].map(b => b.className),
            pic: !!document.querySelector('#model:not([hidden]) .pic svg') }));
          if (fix.active.length !== 1 || !fix.active[0].includes('modelo') || !fix.pic) fails.push(`${label} corrección sin error: ${JSON.stringify(fix)}`);
          await check(p, `${label} ayuda`);
          if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}${width}x${height}-${kind}-ayuda.png` });
          await p.reload(); await p.click('#d'); await p.waitForSelector('#start'); await p.click('#start'); continue;
        }
      }
      const word = await p.$eval('#model .word', e => e.textContent);
      if (kind === 'leer') { await p.click('#rok'); await p.waitForSelector('#model.feedback:not([hidden])'); await check(p, `${label} retroalimentación`); }
      else {
        await p.click(`.opt[aria-label="${word}"]`);
        await p.waitForSelector('.opt.ok');
        await check(p, `${label} retroalimentación`);
        if (process.env.SHOTS && !seen.has('fb' + kind)) { seen.add('fb' + kind); await p.screenshot({ path: `${process.env.SHOTS}${width}x${height}-${kind}-acierto.png` }); }
      }
      await p.waitForTimeout(300);
    }
    for (const k of ['leer', 'dibujo2', 'dibujo3', 'sin-dibujo3']) if (!seen.has(k)) fails.push(`${width}x${height}: no se llegó a ${k}`);
    await p.close();
  }
} finally { await browser.close(); await server.close(); }
assert.deepEqual(fails, [], fails.join('\n'));
console.log(`ok: sin scroll ni palabras cortadas en ${VIEWPORTS.map(v => v.join('×')).join(' y ')}`);
