// Efectos de sonido sintetizados con WebAudio (sin archivos externos)
let ctx = null;
const ensure = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* sin audio */ } } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; };
function noise(dur, vol, cutoff) {
  const c = ensure(); if (!c) return; const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.value = vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
}
function tone(freq, dur, vol, type = 'sine', slide = 0) {
  const c = ensure(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime); g.gain.linearRampToValueAtTime(0, c.currentTime + dur); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
}
export const audio = {
  init: ensure,
  shot: (id) => (id === 'escopeta' ? (noise(0.35, 0.9, 1400), tone(70, 0.2, 0.5, 'square', -30)) : (noise(0.16, 0.6, 3200), tone(160, 0.08, 0.3, 'square', -80))),
  empty: () => tone(900, 0.04, 0.15, 'square'),
  hit: (killed) => (killed ? (tone(120, 0.25, 0.4, 'sawtooth', -60), noise(0.2, 0.3, 700)) : tone(300, 0.08, 0.25, 'triangle')),
  pickup: () => { tone(520, 0.1, 0.25, 'triangle'); setTimeout(() => tone(780, 0.14, 0.25, 'triangle'), 90); },
  over: () => { tone(200, 0.9, 0.5, 'sawtooth', -150); noise(0.5, 0.5, 500); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 0.3, 'triangle'), i * 140)),
};
