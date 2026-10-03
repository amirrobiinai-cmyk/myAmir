// Synthesises the soundtrack: 808 beat, metallic whooshes, data clicks @4.5s, gold impact @8.8s.
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 48000, DUR = 10, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 1; const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const add = (i, l, r = l) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

const BPM = 120, beat = 60 / BPM;
// 808 kick + sub
function kick808(t0, note = 45, len = 0.45, gain = 0.9) {
  let ph = 0;
  for (let n = 0; n < len * SR; n++) {
    const tt = n / SR;
    const f = note + 110 * Math.exp(-tt * 30);
    ph += 2 * Math.PI * f / SR;
    const env = Math.exp(-tt * (3.2 / len)) * Math.min(1, n / 40);
    const s = Math.tanh(Math.sin(ph) * 2.2) * env * gain;
    add(Math.round(t0 * SR) + n, s);
  }
}
function clap(t0, gain = 0.35) {
  let lp = 0;
  for (let n = 0; n < 0.18 * SR; n++) {
    const tt = n / SR;
    const env = (Math.exp(-tt * 28) + 0.6 * Math.exp(-Math.max(0, tt - 0.012) * 40) * (tt > 0.012)) ;
    const x = noise(); lp += 0.45 * (x - lp);
    const s = (x - lp) * env * gain;
    add(Math.round(t0 * SR) + n, s * 0.9, s);
  }
}
function hat(t0, gain = 0.12, open = false) {
  let prev = 0;
  for (let n = 0; n < (open ? 0.2 : 0.05) * SR; n++) {
    const tt = n / SR;
    const x = noise(); const hp = x - prev; prev = x;
    const s = hp * Math.exp(-tt * (open ? 18 : 70)) * gain;
    add(Math.round(t0 * SR) + n, s * 0.7, s);
  }
}
// metallic whoosh: band-swept noise + ringing partials
function whoosh(tc, len = 0.55, gain = 0.32, dir = 1) {
  const start = tc - len * 0.7;
  let b0 = 0, b1 = 0;
  for (let n = 0; n < len * SR; n++) {
    const k = n / (len * SR);
    const env = Math.sin(Math.PI * Math.pow(k, 0.8)) ** 2;
    const fc = 300 + 5000 * (dir > 0 ? k : 1 - k);
    const q = 2 * Math.sin(Math.PI * fc / SR);
    const x = noise();
    b0 += q * (x - b0 - 0.3 * b1); b1 += q * b0;
    const metal = 0.08 * (Math.sin(2 * Math.PI * 1830 * n / SR) + Math.sin(2 * Math.PI * 2717 * n / SR));
    const s = (b1 * 0.8 + metal) * env * gain;
    const pan = Math.cos(k * Math.PI * dir);
    add(Math.round(start * SR) + n, s * (1 - pan) * 0.7, s * (1 + pan) * 0.7);
  }
}
function blip(t0, f, gain = 0.12) {
  for (let n = 0; n < 0.035 * SR; n++) {
    const tt = n / SR;
    const s = Math.sign(Math.sin(2 * Math.PI * f * tt)) * Math.exp(-tt * 90) * gain;
    add(Math.round(t0 * SR) + n, s, s * 0.8);
  }
}
function impact(t0) {
  // deep boom
  kick808(t0, 38, 1.6, 1.0);
  // bright bell-like gold hit (inharmonic partials)
  const parts = [[523, 1], [1318, 0.6], [2093, 0.45], [2794, 0.3], [3729, 0.2], [5274, 0.12]];
  for (let n = 0; n < 1.2 * SR; n++) {
    const tt = n / SR;
    let s = 0;
    for (const [f, a] of parts) s += a * Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * (2 + f / 900));
    s *= 0.11;
    // transient crack
    s += noise() * Math.exp(-tt * 60) * 0.5;
    add(Math.round(t0 * SR) + n, s, s);
  }
  // reverse-ish shimmer tail
  for (let n = 0; n < 1.1 * SR; n++) {
    const tt = n / SR;
    const s = noise() * 0.05 * Math.exp(-tt * 3) * Math.sin(2 * Math.PI * 7 * tt) ** 2;
    add(Math.round((t0 + 0.05) * SR) + n, s, -s);
  }
}

// --- arrangement ---
// 808 bass line (root notes in Hz), one per beat
const bassNotes = [43.65, 43.65, 51.91, 43.65, 38.89, 38.89, 46.25, 43.65];
for (let b = 0; b * beat < 8.8; b++) {
  const t = b * beat;
  kick808(t, bassNotes[b % 8], 0.48, b % 2 ? 0.7 : 0.9);
  if (b % 2 === 1) clap(t);
  hat(t + beat / 2, 0.1, b % 4 === 3);
  hat(t + beat / 4, 0.05);
  hat(t + 3 * beat / 4, 0.05);
}
// drop-out lift into the final hit
for (let i = 0; i < 8; i++) hat(8.4 + i * 0.05, 0.04 + i * 0.01);
// transitions
whoosh(2.0, 0.5, 0.34, 1);
whoosh(4.5, 0.6, 0.34, -1);
whoosh(7.0, 0.5, 0.34, 1);
whoosh(8.8, 0.7, 0.3, -1);
whoosh(9.05, 0.45, 0.22, 1);
// digital data clicks at 4.5
for (let i = 0; i < 16; i++) blip(4.5 + i * 0.045 + (i % 3) * 0.008, 1200 + ((i * 7) % 5) * 380, 0.1 * (1 - i / 20));
// gold impact
impact(8.8);
// gentle closing 808 on the end card
kick808(9.8, 43.65, 0.2, 0.3);

// --- master: soft clip + normalise + short fade-out ---
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.1); R[i] = Math.tanh(R[i] * 1.1); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (0.08 * SR));
  buf.writeInt16LE(Math.round(L[i] * g * fade * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * g * fade * 32767), 46 + i * 4);
}
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/audio.wav", import.meta.url), buf);
console.log("wrote out/audio.wav");
