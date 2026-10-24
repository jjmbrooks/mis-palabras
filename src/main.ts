import './style.css';
import { DECK, wordById, svgFor } from './deck';
import { Session, wordStates, nextHelp, toCSV, Help, TrialSpec, TrialRecord, LEVELS } from './engine';
import { say, chime, getVolume, setVolume } from './audio';
import { Store, Child, demoStore, familyStore, signIn, onUser, newId } from './store';

const app = document.getElementById('app')!;
const h = (html: string) => { app.innerHTML = html; app.focus(); };
const $ = <T extends HTMLElement>(sel: string) => app.querySelector(sel) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const settings = {
  get helpDelay() { return Number(localStorage.getItem('mp.helpDelay') ?? '4'); },
  set helpDelay(v: number) { localStorage.setItem('mp.helpDelay', String(v)); },
  get reduceMotion() { return localStorage.getItem('mp.reduceMotion') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches; },
  set reduceMotion(v: boolean) { localStorage.setItem('mp.reduceMotion', v ? '1' : '0'); },
  get minutes() { return Number(localStorage.getItem('mp.minutes') ?? '8'); },
  set minutes(v: number) { localStorage.setItem('mp.minutes', String(v)); },
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
  $('#d').onclick = () => { store = demoStore(); child = null; home(); };
}

async function home() {
  if (!store) return login();
  const kids = await store.children();
  if (!child && kids.length === 1) child = kids[0];
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
    <button class="btn primary big" id="start" ${child ? '' : 'disabled'}>Empezar sesión</button>
    <p class="small center-t">Mazo: Abejas y jardín · ${settings.minutes} min</p>
    <button class="btn ghost" id="adult">Mantén presionado para ajustes del tutor</button>
  </main>`);
  app.querySelectorAll<HTMLButtonElement>('.kid').forEach(b => b.onclick = () => { child = kids.find(k => k.id === b.dataset.id)!; home(); });
  $<HTMLFormElement>('#add').onsubmit = async e => {
    e.preventDefault(); const v = $<HTMLInputElement>('#nick').value;
    if (v.trim()) { child = await store!.addChild(v); home(); }
  };
  $('#start').onclick = () => child && session();
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
  const st = wordStates(ts);
  const lvl = ['imagen + texto', 'emparejar letras', 'solo texto'];
  h(`<main class="screen">
    <header class="bar"><button class="btn small-b" id="back">← Volver</button><strong>Tutor</strong></header>
    <section class="panel"><h2>Ajustes</h2>
      <label>Volumen <input type="range" id="vol" min="0" max="1" step="0.1" value="${getVolume()}"></label>
      <label>Espera antes de ayudar: <output id="hdv">${settings.helpDelay}</output> s <input type="range" id="hd" min="3" max="5" step="1" value="${settings.helpDelay}"></label>
      <label>Duración de la sesión: <output id="mnv">${settings.minutes}</output> min <input type="range" id="mn" min="5" max="10" step="1" value="${settings.minutes}"></label>
      <label class="check"><input type="checkbox" id="rm" ${settings.reduceMotion ? 'checked' : ''}> Reducir movimiento</label>
    </section>
    <section class="panel"><h2>Progreso${child ? ` de ${esc(child.nickname)}` : ''}</h2>
      <table><thead><tr><th>Palabra</th><th>Nivel</th><th>Ensayos</th></tr></thead><tbody>
      ${DECK.map(w => { const x = st.get(w.id)!; const n = ts.filter(t => t.word === w.id).length;
        return `<tr><td>${w.text}</td><td>${x.mastered ? '✓ dominada' : lvl[x.level]}</td><td>${n}</td></tr>`; }).join('')}
      </tbody></table>
    </section>
    <section class="panel"><h2>Tus datos</h2>
      <div class="row"><button class="btn" id="xj">Exportar JSON</button><button class="btn" id="xc">Exportar CSV</button></div>
      ${s.demo ? '' : '<button class="btn" id="out">Cerrar sesión</button>'}
      <button class="btn danger" id="del">${s.demo ? 'Borrar datos de prueba' : 'Borrar todos los datos y la cuenta'}</button>
      <p class="small">Se guardan solo: palabra, tipo de carta, ayuda, acierto, tiempo de respuesta y fecha. El niño se identifica con un apodo.</p>
    </section>
  </main>`);
  $('#back').onclick = home;
  $<HTMLInputElement>('#vol').oninput = e => setVolume(Number((e.target as HTMLInputElement).value));
  $<HTMLInputElement>('#hd').oninput = e => { settings.helpDelay = Number((e.target as HTMLInputElement).value); $('#hdv').textContent = String(settings.helpDelay); };
  $<HTMLInputElement>('#mn').oninput = e => { settings.minutes = Number((e.target as HTMLInputElement).value); $('#mnv').textContent = String(settings.minutes); };
  $<HTMLInputElement>('#rm').onchange = e => { settings.reduceMotion = (e.target as HTMLInputElement).checked; applyMotion(); };
  const dl = (name: string, body: string, type: string) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type })); a.download = name; a.click();
  };
  $('#xj').onclick = async () => dl('mis-palabras.json', JSON.stringify(await s.exportAll(), null, 2), 'application/json');
  $('#xc').onclick = async () => dl('mis-palabras.csv', toCSV((await s.exportAll()).trials), 'text/csv');
  $('#out') && ($('#out').onclick = async () => { await s.signOut(); store = null; child = null; login(); });
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

async function session() {
  const s = store!, c = child!;
  const history = await s.trials(c.id);
  const sess = new Session(wordStates(history));
  const sessionId = newId();
  const started = Date.now(), limit = settings.minutes * 60_000;
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

  function trial(spec: TrialSpec): Promise<{ help: Help; correct: boolean; latency: number }> {
    return new Promise(resolve => {
      const w = wordById(spec.word);
      const optMode = spec.cardType === 'imagen_texto' ? 'both' : 'text';
      let help: Help = 'ninguna', firstTap = 0, timer: number | undefined, enabled = false;
      const t0 = Date.now();
      stage().innerHTML = `<p class="instr">Toca <b>${w.text}</b></p>
        <div id="model" class="model" ${spec.cardType === 'emparejar' ? '' : 'hidden'}>${card(spec.word, 'both')}</div>
        <p id="tutor" class="note" hidden>Tutor: guía al niño hacia la carta correcta (señala o acerca la carta).</p>
        <div class="opts n${spec.options.length}">${spec.options.map(o =>
          `<button class="card opt" data-id="${o}" disabled aria-label="${optMode === 'both' ? '' : 'Opción de texto '}${wordById(o).text}">${card(o, optMode)}</button>`).join('')}</div>`;
      const buttons = [...app.querySelectorAll<HTMLButtonElement>('.opt')];
      const correctBtn = buttons.find(b => b.dataset.id === spec.word)!;
      const escalate = () => {
        help = nextHelp(help);
        correctBtn.classList.add('hint');
        if (help === 'B' || help === 'C') $('#model').hidden = false;
        if (help === 'C') { $('#tutor').hidden = false; buttons.forEach(b => { if (b !== correctBtn) b.disabled = true; }); }
        arm();
      };
      const arm = () => { clearTimeout(timer); if (help !== 'C') timer = window.setTimeout(escalate, settings.helpDelay * 1000); };
      say(`Toca ${w.text}`).then(() => sleep(1000 - Math.min(1000, Date.now() - t0))).then(() => {
        enabled = true; buttons.forEach(b => (b.disabled = false)); arm();
      });
      buttons.forEach(b => b.onclick = async () => {
        if (!enabled) return;
        firstTap ||= Date.now();
        const id = b.dataset.id!;
        if (id !== spec.word) { // sin sonido negativo: solo se inicia/escala la ayuda
          say(wordById(id).text);
          escalate(); return;
        }
        clearTimeout(timer); enabled = false;
        buttons.forEach(x => (x.disabled = true));
        b.classList.add('ok');
        const correct = help === 'ninguna';
        coins++; $('#coins').textContent = String(coins);
        chime(); await say(`¡${w.text}, muy bien!`);
        resolve({ help, correct, latency: firstTap - t0 });
      });
      $('#end').addEventListener('click', () => { clearTimeout(timer); resolve({ help, correct: false, latency: -1 }); }, { once: true });
    });
  }

  let spec: TrialSpec | null;
  while (!stop && Date.now() - started < limit && (spec = sess.next())) {
    if (spec.presentFirst) { await present(spec.word); if (stop) break; }
    const r = await trial(spec);
    if (r.latency < 0) break;
    sess.record(spec, r.correct);
    const rec: TrialRecord = { childId: c.id, sessionId, word: spec.word, cardType: spec.cardType, help: r.help,
      correct: r.correct, latencyMs: Math.max(0, Math.min(600000, r.latency)), at: Date.now() };
    await s.addTrial(rec);
  }
  clearInterval(tick);
  speechSynthesis?.cancel();
  h(`<main class="screen center">
    <div class="hero sleep">${BEE}</div>
    <h1>¡Terminamos!</h1>
    <p class="lead">La abeja se va a descansar. Ganaste <b>${coins}</b> 🪙</p>
    <button class="btn primary" id="home">Listo</button>
  </main>`);
  say('¡Terminamos! Muy bien.');
  $('#home').onclick = home;
}

void LEVELS;
login();
onUser(u => {
  if (u) { store = familyStore(u); child = null; home(); }
  else if (!store?.demo) { store = null; login(); }
});
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
