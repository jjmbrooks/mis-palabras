// Audio. Voz PROVISIONAL con speechSynthesis (es-MX); se reemplazará por grabaciones de voz natural.
// Refuerzo sintetizado con WebAudio: suave, corto (< 2 s) y con volumen máximo limitado (§7).
let ctx: AudioContext | null = null;
let volume = Number(globalThis.localStorage?.getItem('mp.volume') ?? '0.6');
export const getVolume = () => volume;
export const setVolume = (v: number) => { volume = Math.min(1, Math.max(0, v)); localStorage.setItem('mp.volume', String(volume)); };
const MAX_GAIN = 0.18; // tope de volumen del refuerzo

function voice(): SpeechSynthesisVoice | undefined {
  const vs = speechSynthesis.getVoices();
  return vs.find(v => v.lang === 'es-MX') ?? vs.find(v => v.lang.startsWith('es'));
}

export function say(text: string): Promise<void> {
  return new Promise(res => {
    if (!('speechSynthesis' in window) || volume === 0) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = 'es-MX'; u.rate = 0.8; u.pitch = 1; u.volume = volume;
    const v = voice(); if (v) u.voice = v;
    u.onend = () => res(); u.onerror = () => res();
    setTimeout(res, 4000);
    speechSynthesis.speak(u);
  });
}

/** Dos notas suaves ascendentes (≈0.7 s), envolvente sin ataques bruscos. */
export function chime() {
  if (volume === 0) return;
  ctx ??= new AudioContext();
  const t0 = ctx.currentTime;
  [523.25, 659.25].forEach((f, i) => {
    const o = ctx!.createOscillator(), g = ctx!.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const s = t0 + i * 0.18;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(MAX_GAIN * volume, s + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
    o.connect(g).connect(ctx!.destination); o.start(s); o.stop(s + 0.55);
  });
}

// Sonidos de animales (mazo Animales, reforzador tras acertar). Sintetizados en el navegador con Web Audio:
// código original de este repositorio (MIT), sin muestras grabadas ni archivos de terceros. Ver docs/mazos-nuevos.md.
type Seg = { at: number; dur: number; f0: number; f1: number; type?: OscillatorType; noise?: boolean; vib?: number; lp?: number; gain?: number };
const tone = (at: number, dur: number, f0: number, f1: number, o: Partial<Seg> = {}): Seg => ({ at, dur, f0, f1, ...o });
export const ANIMAL_SOUNDS: Record<string, Seg[]> = {
  perro: [tone(0, .16, 520, 300, { type: 'sawtooth', lp: 1400 }), tone(.26, .16, 520, 300, { type: 'sawtooth', lp: 1400 })], // guau guau
  gato: [tone(0, .7, 560, 820, { type: 'triangle', vib: 6 }), tone(.35, .4, 820, 480, { type: 'triangle' })], // miau
  vaca: [tone(0, 1.1, 150, 115, { type: 'sawtooth', lp: 700, vib: 3 })], // muuu
  pato: [0, .18, .36].map(t => tone(t, .12, 720, 600, { type: 'square', lp: 2200 })), // cuac cuac cuac
  leon: [tone(0, 1.2, 110, 70, { type: 'sawtooth', lp: 600 }), tone(0, 1.2, 0, 0, { noise: true, lp: 500, gain: .5 })], // rugido
  oso: [tone(0, .8, 120, 95, { type: 'sawtooth', lp: 500, vib: 18 })], // gruñido
  pez: [0, .15, .3, .45].map((t, i) => tone(t, .08, 500 + i * 180, 900 + i * 200, { type: 'sine' })), // burbujas
  mono: [0, .2, .4].map((t, i) => tone(t, .16, 380 + i * 90, 700 + i * 120, { type: 'triangle' })), // uh uh ah
  cerdo: [tone(0, .22, 260, 180, { type: 'square', lp: 900, vib: 30 }), tone(.32, .22, 260, 180, { type: 'square', lp: 900, vib: 30 })], // oinc oinc
  burro: [tone(0, .35, 760, 640, { type: 'sawtooth', lp: 1800 }), tone(.38, .45, 260, 220, { type: 'sawtooth', lp: 900 }), tone(.9, .35, 760, 640, { type: 'sawtooth', lp: 1800 }), tone(1.28, .45, 260, 220, { type: 'sawtooth', lp: 900 })], // ia ia
  tortuga: [tone(0, .35, 0, 0, { noise: true, lp: 1200, gain: .35 })], // resoplido suave (casi no hacen ruido)
  jirafa: [tone(0, 1, 92, 92, { type: 'sine', vib: 4 })], // zumbido grave y suave
  elefante: [tone(0, .9, 420, 640, { type: 'sawtooth', lp: 2600, vib: 7 })], // barrito
  caballo: [tone(0, 1, 900, 480, { type: 'sawtooth', lp: 2000, vib: 9 })], // relincho
  gallina: [0, .14, .28, .5].map((t, i) => tone(t, i === 3 ? .3 : .09, 900, i === 3 ? 1300 : 760, { type: 'square', lp: 2400 })), // co co co coooo
};
export function animalSound(id: string) {
  const segs = ANIMAL_SOUNDS[id];
  if (!segs || volume === 0) return;
  ctx ??= new AudioContext();
  const t0 = ctx.currentTime + 0.45; // después de la campanita
  for (const s of segs) {
    const st = t0 + s.at, g = ctx.createGain(), peak = MAX_GAIN * volume * (s.gain ?? .8);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(peak, st + .03); g.gain.setValueAtTime(peak, st + s.dur * .7); g.gain.linearRampToValueAtTime(0, st + s.dur);
    let src: AudioScheduledSourceNode;
    if (s.noise) {
      const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * s.dur), ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const n = ctx.createBufferSource(); n.buffer = b; src = n;
    } else {
      const o = ctx.createOscillator(); o.type = s.type ?? 'sine';
      o.frequency.setValueAtTime(s.f0, st); o.frequency.linearRampToValueAtTime(s.f1, st + s.dur);
      if (s.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = s.vib; lg.gain.value = s.f0 * .04; l.connect(lg).connect(o.frequency); l.start(st); l.stop(st + s.dur); }
      src = o;
    }
    let node: AudioNode = src;
    if (s.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = s.lp; node = node.connect(f); }
    node.connect(g).connect(ctx.destination); src.start(st); src.stop(st + s.dur + .02);
  }
}
