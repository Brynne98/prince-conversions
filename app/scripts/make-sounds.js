// Generate two short PCM WAV files: a "done" chime and a "shake" alert.
// Mono, 22050 Hz, 16-bit signed PCM.

const fs = require('fs');
const path = require('path');

const SR = 22050;

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16-bit mono
  const buf = Buffer.alloc(44 + dataSize);
  let o = 0;
  buf.write('RIFF', o); o += 4;
  buf.writeUInt32LE(36 + dataSize, o); o += 4;
  buf.write('WAVE', o); o += 4;
  buf.write('fmt ', o); o += 4;
  buf.writeUInt32LE(16, o); o += 4;
  buf.writeUInt16LE(1, o); o += 2;          // PCM
  buf.writeUInt16LE(1, o); o += 2;          // mono
  buf.writeUInt32LE(SR, o); o += 4;
  buf.writeUInt32LE(SR * 2, o); o += 4;     // byte rate
  buf.writeUInt16LE(2, o); o += 2;          // block align
  buf.writeUInt16LE(16, o); o += 2;         // bits per sample
  buf.write('data', o); o += 4;
  buf.writeUInt32LE(dataSize, o); o += 4;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
  console.log('wrote', filePath, `(${(buf.length / 1024).toFixed(1)} kB, ${(numSamples / SR).toFixed(2)}s)`);
}

// Soft-attack, exponential-decay pluck.
function pluck(freq, durSec, { gain = 0.6, decay = 4.5, attackSec = 0.005 } = {}) {
  const n = Math.floor(durSec * SR);
  const attack = Math.floor(attackSec * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Sine + a touch of 2nd/3rd harmonic for warmth
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 0.78 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.18 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.06;
    const envAttack = i < attack ? i / attack : 1;
    const envDecay = Math.exp(-decay * t);
    out[i] = wave * envAttack * envDecay * gain;
  }
  return out;
}

function mixAt(dest, src, offsetSec) {
  const o = Math.floor(offsetSec * SR);
  for (let i = 0; i < src.length; i++) {
    if (o + i >= dest.length) break;
    dest[o + i] += src[i];
  }
}

// ─── Done: warm three-note arpeggio C5 → E5 → G5 ──────────────────────
function makeDone() {
  const totalSec = 1.4;
  const out = new Float32Array(Math.floor(totalSec * SR));
  // Major chord arpeggio with overlap for a bell-like effect.
  mixAt(out, pluck(523.25, 1.1, { gain: 0.55, decay: 3.2 }), 0.00); // C5
  mixAt(out, pluck(659.25, 1.0, { gain: 0.55, decay: 3.2 }), 0.16); // E5
  mixAt(out, pluck(783.99, 1.0, { gain: 0.60, decay: 3.0 }), 0.32); // G5
  // Soft cap to prevent clipping
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.tanh(out[i] * 1.1) * 0.92;
  }
  return out;
}

// ─── Shake: two quick bright dings, A5 + E6, slightly playful ─────────
function makeShake() {
  const totalSec = 0.75;
  const out = new Float32Array(Math.floor(totalSec * SR));
  mixAt(out, pluck(880.00, 0.55, { gain: 0.55, decay: 6.0 }), 0.00); // A5
  mixAt(out, pluck(1318.51, 0.55, { gain: 0.45, decay: 6.0 }), 0.13); // E6
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.tanh(out[i] * 1.1) * 0.90;
  }
  return out;
}

const out = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

writeWav(path.join(out, 'done.wav'), makeDone());
writeWav(path.join(out, 'shake.wav'), makeShake());
