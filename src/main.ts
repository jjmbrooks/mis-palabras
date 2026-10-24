import './style.css';
import { DECK, wordById, svgFor } from './deck';
import { Session, IndependentSession, wordStates, nextHelp, toCSV, isIndependent, progress, clampIndepMinutes, DECK_ID, Help, Mode, TrialSpec, TrialRecord } from './engine';
import { rewardFact } from './facts';
import { say, chime, getVolume, setVolume } from './audio';
import { Store, Child, demoStore, familyStore, signIn, onUser, newId } from './store';

const app = document.getElementById('app')!;
const h = (html: string) => { app.innerHTML = html; app.focus(); };
const $ = <T extends HTMLElement>(sel: string) => app.querySelector(sel) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const settings = {
  get helpDelay() { return Number(localStorage.getItem('mp.helpDelay') ?? '5'); },
  set helpDelay(v: number) { localStorage.setItem('mp.helpDelay', String(v)); },
  get reduceMotion() { return localStorage.getItem('mp.reduceMotion') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches; },
  set reduceMotion(v: boolean) { localStorage.setItem('mp.reduceMotion', v ? '1' : '0'); },
  get indepMinutes() { return clampIndepMinutes(Number(localStorage.getItem('mp.indepMinutes') ?? '4')); },
  set indepMinutes(v: number) { localStorage.setItem('mp.indepMinutes', String(clampIndepMinutes(v))); },
  get minutes() { return Number(localStorage.getItem('mp.minutes') ?? '8'); },
  set minutes(v: number) { localStorage.setItem('mp.minutes', String(v)); },
  // D12.5: «ya conoce los dibujos», por mazo y por niño (el ajuste del niño, si existe, manda).
  get deckKnowsPictures() { return localStorage.getItem('mp.knowsPics.deck') === '1'; },
  set deckKnowsPictures(v: boolean) { localStorage.setItem('mp.knowsPics.deck', v ? '1' : '0'); },
  childKnowsPictures(id: string): boolean | null { const v = localStorage.getItem(`mp.knowsPics.${id}`); return v === null ? null : v === '1'; },
  setChildKnowsPictures(id: string, v: boolean | null) { const k = `mp.knowsPics.${id}`; v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v ? '1' : '0'); },
  knowsPictures(id: string) { return settings.childKnowsPictures(id) ?? settings.deckKnowsPictures; },
};
const applyMotion = () => document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
applyMotion();

let store: Store | null = null;
let child: Child | null = null;

const BEE = svgFor(DECK[0]);

function login(msg = '') {
  h(`<main class="screen center">
    <div class="hero">${BEE}</div>
    <h1>Mis Palabras</h1>
    <p class="lead">Práctica de lectura con cartas, para hacer junto a un adulto.</p>
    <button class="btn primary" id="g">Entrar con Google</button>
    <button class="btn" id="d">Probar sin cuenta</button>
    <p class="small">Cada familia tiene su propia cuenta. Nadie más ve sus datos. Sin anuncios ni analítica.
    «Probar sin cuenta» no guarda nada.</p>
    ${msg ? `<p class="note" role="alert">${esc(msg)}</p>` : ''}
  </main>`);
  $('#g').onclick = async () => {
    try { await signIn(); } catch (e: any) { login(e?.code === 'auth/unauthorized-domain' ? 'Este dominio aún no está autorizado en Firebase.' : 'No se pudo iniciar sesión. Intenta de nuevo.'); }
  };
  $('#d').onclick = async () => {
    store = demoStore(); child = null;
    // Solo en desarrollo (se elimina del build): ?semilla siembra palabras dominadas para capturas locales.
    if (import.meta.env.DEV && location.search.includes('semilla')) await seedDemo(store);
    home();
  };
}

async function home() {
  if (!store) return login();
  const kids = await store.children();
  if (!child && kids.length === 1) child = kids[0];
  const soloOk = !!child && new IndependentSession(wordStates(await store.trials(child.id))).available;
  h(`<main class="screen">
    <header class="bar"><strong>Mis Palabras</strong>${store.demo ? '<span class="tag">prueba</span>' : ''}</header>
    <section class="panel">
      <h2>¿Quién practica?</h2>
      <div class="kids">${kids.map(k => `<button class="btn kid ${child?.id === k.id ? 'sel' : ''}" data-id="${k.id}" aria-pressed="${child?.id === k.id}">${esc(k.nickname)}</button>`).join('')}</div>
      <form id="add" class="row">
        <label class="sr" for="nick">Apodo</label>
        <input id="nick" maxlength="20" autocomplete="off" placeholder="Apodo (no el nombre real)">
        <button class="btn" type="submit">Agregar</button>
      </form>
    </section>
    <button class="btn primary big" id="start" ${child ? '' : 'disabled'}>Empezar sesión con tutor</button>
    ${child ? (soloOk ? `<button class="btn big" id="solo">Practicar solo (${settings.indepMinutes} min)</button>`
      : '<p class="small center-t">«Practicar solo» se abre cuando haya palabras dominadas con el tutor.</p>') : ''}
    <p class="small center-t">Mazo: Abejas y jardín · ${settings.minutes} min</p>
    <button class="btn ghost" id="adult">Mantén presionado para ajustes del tutor</button>
  </main>`);
  app.querySelectorAll<HTMLButtonElement>('.kid').forEach(b => b.onclick = () => { child = kids.find(k => k.id === b.dataset.id)!; home(); });
  $<HTMLFormElement>('#add').onsubmit = async e => {
    e.preventDefault(); const v = $<HTMLInputElement>('#nick').value;
    if (v.trim()) { child = await store!.addChild(v); home(); }
  };
  $('#start').onclick = () => child && session('tutor');
  $('#solo') && ($('#solo').onclick = () => child && session('independiente'));
  adultLock($('#adult'), tutorPanel);
}

/** Candado para adultos (D6): mantener presionado 2 s. */
function adultLock(el: HTMLElement, go: () => void) {
  let t: number | undefined;
  const start = (e: Event) => { e.preventDefault(); el.classList.add('holding'); t = window.setTimeout(go, 2000); };
  const stop = () => { el.classList.remove('holding'); clearTimeout(t); };
  el.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, stop));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') start(e); });
  el.addEventListener('keyup', stop);
}

async function tutorPanel() {
  const s = store!;
  const ts = child ? await s.trials(child.id) : [];
  const prog = child ? progress(await s.sessions(child.id), ts) : [];
  const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`;
  const st = wordStates(ts);
  const lvl = ['dibujo → palabra', 'elegir palabra', 'leer sola'];
  const ck = child ? settings.childKnowsPictures(child.id) : null;
  h(`<main class="screen">
    <header class="bar"><button class="btn small-b" id="back">← Volver</button><strong>Tutor</strong></header>
    <section class="panel"><h2>Ajustes</h2>
      <label>Volumen <input type="range" id="vol" min="0" max="1" step="0.1" value="${getVolume()}"></label>
      <label>Espera antes de ayudar: <output id="hdv">${settings.helpDelay}</output> s <input type="range" id="hd" min="3" max="5" step="1" value="${settings.helpDelay}"></label>
      <label>Duración de la sesión: <output id="mnv">${settings.minutes}</output> min <input type="range" id="mn" min="5" max="10" step="1" value="${settings.minutes}"></label>
      <label>Práctica sola: <output id="imv">${settings.indepMinutes}</output> min (se cierra sola) <input type="range" id="im" min="3" max="5" step="1" value="${settings.indepMinutes}"></label>
      <label class="check"><input type="checkbox" id="rm" ${settings.reduceMotion ? 'checked' : ''}> Reducir movimiento</label>
      <label class="check"><input type="checkbox" id="kpd" ${settings.deckKnowsPictures ? 'checked' : ''}> Mazo «Abejas y jardín»: ya conoce los dibujos (saltar la enseñanza imagen + texto)</label>
      ${child ? `<label>Para ${esc(child.nickname)}: <select id="kpc">
        <option value="" ${ck === null ? 'selected' : ''}>como el mazo</option>
        <option value="1" ${ck === true ? 'selected' : ''}>ya conoce los dibujos</option>
        <option value="0" ${ck === false ? 'selected' : ''}>enseñar con imagen + texto</option></select></label>` : ''}
    </section>
    <section class="panel"><h2>Progreso${child ? ` de ${esc(child.nickname)}` : ''}</h2>
      <table><thead><tr><th>Palabra</th><th>Nivel</th><th>Ensayos</th></tr></thead><tbody>
      ${DECK.map(w => { const x = st.get(w.id)!; const n = ts.filter(t => t.word === w.id).length;
        return `<tr><td>${w.text}</td><td>${x.mastered ? '✓ dominada' : lvl[x.level]}</td><td>${n}</td></tr>`; }).join('')}
      </tbody></table>
    </section>
    <section class="panel"><h2>Sesiones</h2>
      ${prog.length ? `<table><thead><tr><th>Fecha</th><th>Modo</th><th>Duración</th><th>1.er intento</th></tr></thead><tbody>
      ${prog.map(p => `<tr><td>${new Date(p.session.startedAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td>${p.session.mode === 'tutor' ? 'tutor' : 'solo'}</td><td>${mmss(p.session.durationMs)}</td><td>${p.pct} %</td></tr>
        <tr class="sub"><td colspan="4">${p.words.map(w => `${wordById(w.word).text} ${w.pct} %${w.helps ? ` · ${w.helps} ayuda${w.helps > 1 ? 's' : ''}` : ''}`).join(' · ')}</td></tr>`).join('')}
      </tbody></table>` : '<p class="small">Aún no hay sesiones.</p>'}
      <p class="small">Dominada = ≥ 90 % al primer intento sin ayuda en 2 sesiones seguidas con tutor. La práctica sola no cuenta para el dominio.</p>
    </section>
    <section class="panel"><h2>Tus datos</h2>
      <div class="row"><button class="btn" id="xj">Exportar JSON</button><button class="btn" id="xc">Exportar CSV</button></div>
      ${s.demo ? '' : '<button class="btn" id="out">Cerrar sesión</button>'}
      ${child ? `<button class="btn danger" id="delkid">Borrar este perfil (${esc(child.nickname)})</button>` : ''}
      <button class="btn danger" id="del">${s.demo ? 'Borrar datos de prueba' : 'Borrar todos los datos y la cuenta'}</button>
      <p class="small">Se guardan solo: palabra, tipo de carta, ayuda, acierto, tiempo de respuesta y fecha. El niño se identifica con un apodo.</p>
    </section>
  </main>`);
  $('#back').onclick = home;
  $<HTMLInputElement>('#vol').oninput = e => setVolume(Number((e.target as HTMLInputElement).value));
  $<HTMLInputElement>('#hd').oninput = e => { settings.helpDelay = Number((e.target as HTMLInputElement).value); $('#hdv').textContent = String(settings.helpDelay); };
  $<HTMLInputElement>('#im').oninput = e => { settings.indepMinutes = Number((e.target as HTMLInputElement).value); $('#imv').textContent = String(settings.indepMinutes); };
  $<HTMLInputElement>('#mn').oninput = e => { settings.minutes = Number((e.target as HTMLInputElement).value); $('#mnv').textContent = String(settings.minutes); };
  $<HTMLInputElement>('#rm').onchange = e => { settings.reduceMotion = (e.target as HTMLInputElement).checked; applyMotion(); };
  $<HTMLInputElement>('#kpd').onchange = e => { settings.deckKnowsPictures = (e.target as HTMLInputElement).checked; };
  $('#kpc') && ($<HTMLSelectElement>('#kpc').onchange = e => { const v = (e.target as HTMLSelectElement).value; settings.setChildKnowsPictures(child!.id, v === '' ? null : v === '1'); });
  const dl = (name: string, body: string, type: string) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type })); a.download = name; a.click();
  };
  $('#xj').onclick = async () => dl('mis-palabras.json', JSON.stringify(await s.exportAll(), null, 2), 'application/json');
  $('#xc').onclick = async () => dl('mis-palabras.csv', toCSV((await s.exportAll()).trials), 'text/csv');
  $('#out') && ($('#out').onclick = async () => { await s.signOut(); store = null; child = null; login(); });
  $('#delkid') && ($('#delkid').onclick = async () => {
    const k = child!;
    if (!confirm(`Se borrará el perfil «${k.nickname}» con todos sus ensayos y su progreso. Los demás perfiles y la cuenta no se tocan. No se puede deshacer. ¿Continuar?`)) return;
    try {
      $('#delkid').textContent = 'Borrando…';
      await s.deleteChild(k.id);
      child = null; home();
    } catch { alert('No se pudo borrar el perfil. Revisa tu conexión e intenta de nuevo.'); tutorPanel(); }
  });
  $('#del').onclick = async () => {
    if (!confirm(s.demo ? '¿Borrar los datos de prueba?' : 'Se borrarán todos los datos de tu familia y tu cuenta. No se puede deshacer. ¿Continuar?')) return;
    try {
      $('#del').textContent = 'Borrando…';
      await s.deleteEverything();
      if (s.demo) return tutorPanel();
      store = null; child = null; login('Se borraron todos los datos y la cuenta.');
    } catch { alert('No se pudo borrar. Revisa tu conexión e intenta de nuevo.'); tutorPanel(); }
  };
}

async function session(mode: Mode) {
  const s = store!, c = child!;
  const solo = mode === 'independiente';
  const history = await s.trials(c.id);
  const states = wordStates(history);
  const sess = solo ? null : new Session(states, Math.random, undefined, [], { knowsPictures: settings.knowsPictures(c.id) });
  const indep = solo ? new IndependentSession(states, Math.random, settings.indepMinutes) : null;
  if (indep && !indep.available) return home();
  const sessionId = newId();
  const started = Date.now(), limit = indep ? indep.limitMs : settings.minutes * 60_000;
  const practiced = new Set<string>();
  let coins = 0, stop = false;

  h(`<main class="screen play">
    <header class="bar"><span class="coins" aria-live="polite">🪙 <b id="coins">0</b></span>
      <div class="time" aria-hidden="true"><div id="tbar"></div></div>
      <button class="btn small-b" id="end">Terminar</button></header>
    <p id="warn" class="note" hidden>Ya casi terminamos.</p>
    <div id="stage" class="stage"></div>
  </main>`);
  $('#end').onclick = () => { stop = true; };
  const tick = setInterval(() => {
    const left = 1 - (Date.now() - started) / limit;
    $('#tbar') && ($('#tbar').style.width = `${Math.max(0, left) * 100}%`);
    if (left < 0.2 && $('#warn')) $('#warn').hidden = false;
  }, 500);

  const stage = () => $('#stage');
  const card = (id: string, mode: 'both' | 'text' | 'img') => {
    const w = wordById(id);
    return `${mode !== 'text' ? `<div class="pic">${svgFor(w)}</div>` : ''}${mode !== 'img' ? `<div class="word">${w.text}</div>` : ''}`;
  };

  async function present(word: string) {
    stage().innerHTML = `<button class="card present" id="pc" aria-label="Escuchar ${wordById(word).text}">${card(word, 'both')}</button>
      <button class="btn primary" id="go">Seguir</button>`;
    $('#pc').onclick = () => say(wordById(word).text);
    say(wordById(word).text);
    await new Promise<void>(r => { $('#go').onclick = () => r(); $('#end').addEventListener('click', () => r(), { once: true }); });
  }

  /**
   * Ensayo D12: por defecto solo texto. La imagen + texto aparece únicamente como ayuda
   * (botón «Ayuda», ≈5 s sin respuesta o tras un error). El audio suena solo después de responder.
   */
  // Práctica sola: la sesión se cierra sola al cumplirse el tiempo (D13).
  const autoClose = indep ? window.setTimeout(() => { stop = true; $('#end')?.click(); }, limit) : undefined;

  function trial(spec: TrialSpec): Promise<{ help: Help; helps: number; correct: boolean; latency: number }> {
    return new Promise(resolve => {
      const w = wordById(spec.word);
      let helps = 0;
      let help: Help = 'ninguna', firstTry = true, firstTap = 0, timer: number | undefined, enabled = false;
      const t0 = Date.now();
      const reading = spec.cardType === 'leer';
      const stim = spec.cardType === 'imagen_estimulo'
        ? `<div class="stim" aria-label="Dibujo">${card(spec.word, 'img')}</div><p class="instr">¿Qué palabra es?</p>`
        : reading
          ? `<p class="instr">Lee la palabra</p>`
          : `<p class="instr">Escucha al tutor y toca la palabra</p>
             <button class="btn ghost cue" id="cue">Tutor: mantén presionado para ver qué decir</button>`;
      stage().innerHTML = `${stim}
        <div id="model" class="model" hidden aria-live="polite">${card(spec.word, 'both')}</div>
        <p id="tutor" class="note" hidden>Tutor: guía al niño hacia la palabra correcta (señala o acerca la carta).</p>
        ${reading
          ? `<div class="card read" id="readw">${card(spec.word, 'text')}</div>
             <div class="row"><button class="btn primary" id="rok" disabled>Leyó bien</button><button class="btn" id="rno" disabled>Aún no</button></div>`
          : `<div class="opts n${spec.options.length}">${spec.options.map(o =>
              `<button class="card opt" data-id="${o}" disabled aria-label="${wordById(o).text}">${card(o, 'text')}</button>`).join('')}</div>`}
        <button class="btn help-b" id="help" disabled>Ayuda</button>`;
      if (!reading && spec.cardType === 'elegir_texto') {
        const cue = $('#cue');
        const show = (e: Event) => { e.preventDefault(); cue.textContent = `Di: «${w.text.toLowerCase()}»`; };
        const hide = () => { cue.textContent = 'Tutor: mantén presionado para ver qué decir'; };
        cue.addEventListener('pointerdown', show); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => cue.addEventListener(ev, hide));
      }
      const buttons = [...app.querySelectorAll<HTMLButtonElement>('.opt')];
      const escalate = () => {
        help = solo ? 'B' : nextHelp(help); helps++;
        if (solo) buttons.forEach(b => { if (b.dataset.id !== spec.word) b.disabled = true; }); // sin tutor: ayuda sin error
        $('#model').hidden = false; $('#help').hidden = true; // ayuda = carta imagen + texto
        if (help === 'C') {
          $('#tutor').hidden = false; $('#help').hidden = true;
          buttons.forEach(b => { if (b.dataset.id !== spec.word) b.disabled = true; });
        }
        arm();
      };
      const arm = () => { clearTimeout(timer); if (help !== 'C' && !(solo && help === 'B')) timer = window.setTimeout(escalate, settings.helpDelay * 1000); };
      const finish = async (ok: boolean) => {
        clearTimeout(timer); enabled = false;
        app.querySelectorAll<HTMLButtonElement>('.stage button').forEach(x => (x.disabled = true));
        const correct = isIndependent(firstTry && ok, help);
        if (ok) { coins++; $('#coins').textContent = String(coins); chime(); }
        await say(ok ? `¡${w.text}, muy bien!` : w.text); // el audio solo llega después de responder
        resolve({ help, helps, correct, latency: firstTap - t0 });
      };
      sleep(1000).then(() => { // breve demora antes de habilitar; sin audio previo
        enabled = true; app.querySelectorAll<HTMLButtonElement>('.stage button').forEach(b => (b.disabled = false)); arm();
      });
      $('#help').onclick = () => { if (enabled && help === 'ninguna') escalate(); };
      if (reading) {
        $('#rok').onclick = () => { if (!enabled) return; firstTap ||= Date.now(); void finish(true); };
        $('#rno').onclick = () => { if (!enabled) return; firstTap ||= Date.now(); firstTry = false; if (help === 'C') void finish(false); else escalate(); };
      }
      buttons.forEach(b => b.onclick = async () => {
        if (!enabled) return;
        firstTap ||= Date.now();
        if (b.dataset.id !== spec.word) { firstTry = false; escalate(); return; } // sin sonido negativo
        b.classList.add('ok'); void finish(true);
      });
      $('#end').addEventListener('click', () => { clearTimeout(timer); resolve({ help, helps, correct: false, latency: -1 }); }, { once: true });
    });
  }

  let spec: TrialSpec | null, n = 0;
  const nextSpec = () => (indep ? indep.next(Date.now() - started) : sess!.next());
  while (!stop && Date.now() - started < limit && (spec = nextSpec())) {
    if (spec.presentFirst) { await present(spec.word); if (stop) break; }
    const r = await trial(spec);
    if (r.latency < 0) break;
    indep ? indep.record(spec, r.correct) : sess!.record(spec, r.correct);
    practiced.add(spec.word); n++;
    const rec: TrialRecord = { childId: c.id, sessionId, word: spec.word, cardType: spec.cardType, help: r.help,
      correct: r.correct, latencyMs: Math.max(0, Math.min(600000, r.latency)), at: Date.now(), mode, helps: Math.min(10, r.helps) };
    await s.addTrial(rec);
  }
  clearTimeout(autoClose);
  clearInterval(tick);
  speechSynthesis?.cancel();
  const ended = Date.now();
  if (n > 0) await s.addSession({ id: sessionId, childId: c.id, mode, deck: DECK_ID, startedAt: started, endedAt: ended,
    durationMs: Math.min(3600000, ended - started), trials: Math.min(100, n) });
  if (indep) return reward([...practiced], coins);
  h(`<main class="screen center">
    <div class="hero sleep">${BEE}</div>
    <h1>¡Terminamos!</h1>
    <p class="lead">La abeja se va a descansar. Ganaste <b>${coins}</b> 🪙</p>
    <button class="btn primary" id="home">Listo</button>
  </main>`);
  say('¡Terminamos! Muy bien.');
  $('#home').onclick = home;
}

/** Premio del modo independiente (D13): un dato curioso, como en un libro interactivo. */
function reward(words: string[], coins: number) {
  const r = rewardFact(words.length ? words : DECK.map(w => w.id));
  const w = r ? wordById(r.word) : DECK[0];
  h(`<main class="screen center">
    <h1>¡Premio!</h1>
    <button class="card present" id="fact" aria-label="Escuchar el dato curioso">${`<div class="pic">${svgFor(w)}</div><div class="word">${w.text}</div>`}</button>
    <p class="lead">${r ? esc(r.fact) : ''}</p>
    <p class="small">Ganaste <b>${coins}</b> 🪙 · Toca la carta para escucharlo.</p>
    <button class="btn primary" id="home">Listo</button>
  </main>`);
  chime();
  $('#fact').onclick = () => { chime(); if (r) say(r.fact); };
  $('#home').onclick = home;
}


async function seedDemo(s: Store) {
  const kinds = ['imagen_estimulo', 'imagen_estimulo', 'elegir_texto', 'elegir_texto', 'leer', 'leer'] as const;
  const t0 = Date.now() - 6 * 86400000;
  for (let i = 0; i < kinds.length; i++) {
    const id = `semilla${i}`, at = t0 + i * 86400000;
    for (const w of ['sol', 'miel', 'flor', 'abeja']) for (let k = 0; k < 3; k++)
      await s.addTrial({ childId: 'demo', sessionId: id, word: w, cardType: kinds[i], help: k === 2 && i < 2 ? 'B' : 'ninguna',
        correct: !(k === 2 && i < 2) || w !== 'flor', latencyMs: 1500, at: at + k, mode: 'tutor', helps: 0 });
    await s.addSession({ id, childId: 'demo', mode: 'tutor', deck: DECK_ID, startedAt: at, endedAt: at + 420000, durationMs: 420000, trials: 12 });
  }
}

login();
onUser(u => {
  if (u) { store = familyStore(u); child = null; home(); }
  else if (!store?.demo) { store = null; login(); }
});
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
