// Audio. Voz PROVISIONAL con speechSynthesis (es-MX); se reemplazará por grabaciones de voz natural.
// Refuerzo sintetizado con WebAudio: suave, corto (< 2 s) y con volumen máximo limitado (§7).
let ctx: AudioContext | null = null;
let volume = Number(localStorage.getItem('mp.volume') ?? '0.6');
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
