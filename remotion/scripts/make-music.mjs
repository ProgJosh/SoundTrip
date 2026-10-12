// Original soundtrack for the SoundTrip showreel, synthesized from scratch.
// 120 BPM in F minor, 30 seconds. At 30 fps one beat is exactly 15 frames.
// Writes public/showreel-music.wav and src/showreel/beats.json, so every cut
// in the video can key off the hits that are actually in the audio.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const S16 = BEAT / 4;
const LENGTH = 30;
const FPS = 30;
const N = SR * LENGTH;

// Buses: drums stay dry, music is ducked by the kick, and both feed the reverb.
const dryL = new Float32Array(N);
const dryR = new Float32Array(N);
const musL = new Float32Array(N);
const musR = new Float32Array(N);
const revL = new Float32Array(N);
const revR = new Float32Array(N);
const arpBus = new Float32Array(N);
const duck = new Float32Array(N).fill(1);

let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const at = (t) => Math.round(t * SR);
const saw = (ph) => (ph % 1) * 2 - 1;

function put(bus, i, l, r, send = 0) {
  if (i < 0 || i >= N) return;
  const [a, b] = bus === "mus" ? [musL, musR] : [dryL, dryR];
  a[i] += l;
  b[i] += r;
  revL[i] += l * send;
  revR[i] += r * send;
}

class Biquad {
  constructor(type, f, q = 0.707) {
    this.type = type;
    this.q = q;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(f);
  }
  set(f) {
    const w = (2 * Math.PI * Math.min(Math.max(f, 20), SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const a = Math.sin(w) / (2 * this.q);
    let b0, b1, b2;
    if (this.type === "lp") [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (this.type === "hp")
      [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [b0, b1, b2] = [a, 0, -a];
    const a0 = 1 + a;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cs) / a0;
    this.a2 = (1 - a) / a0;
  }
  run(x) {
    const y =
      this.b0 * x +
      this.b1 * this.x1 +
      this.b2 * this.x2 -
      this.a1 * this.y1 -
      this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

// ---------- Instruments ----------

function kick(t0, g = 1) {
  const s = at(t0);
  let ph = 0;
  for (let n = 0; n < 0.5 * SR; n++) {
    const t = n / SR;
    ph += (2 * Math.PI * (44 + 120 * Math.exp(-t * 30))) / SR;
    const v =
      Math.sin(ph) * Math.exp(-t * 6.5) + noise() * Math.exp(-t * 400) * 0.25;
    const out = Math.tanh(v * 1.7) * 0.85 * g;
    put("dry", s + n, out, out);
  }
  for (let n = 0; n < 0.45 * SR && s + n < N; n++) {
    const t = n / SR;
    const d = 1 - 0.72 * Math.min(1, t * 200) * Math.exp(-t * 7);
    duck[s + n] = Math.min(duck[s + n], d);
  }
}

// Two soft low thumps: the "heartbeat" that matches the pulse logo.
function heartbeat(t0, g = 1) {
  for (const [o, amp] of [
    [0, 1],
    [0.17, 0.6],
  ]) {
    const s = at(t0 + o);
    let ph = 0;
    for (let n = 0; n < 0.35 * SR; n++) {
      const t = n / SR;
      ph += (2 * Math.PI * (52 + 40 * Math.exp(-t * 25))) / SR;
      const v = Math.sin(ph) * Math.exp(-t * 9) * 0.75 * amp * g;
      put("dry", s + n, v, v, 0.15);
    }
  }
}

function clap(t0, g = 1, send = 0.28) {
  const s = at(t0);
  const bp = new Biquad("bp", 1500, 0.8);
  for (let n = 0; n < 0.5 * SR; n++) {
    const t = n / SR;
    let env = 0;
    for (const o of [0, 0.011, 0.023])
      if (t >= o) env = Math.max(env, Math.exp(-(t - o) * 150));
    if (t > 0.023) env += 0.5 * Math.exp(-(t - 0.023) * 15);
    const v =
      (bp.run(noise()) * env * 2.4 +
        Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 32) * 0.3) *
      0.62 *
      g;
    put("dry", s + n, v * 0.94, v, send);
  }
}

function hat(t0, open = false, g = 1) {
  const s = at(t0);
  const hp = new Biquad("hp", 7500, 0.9);
  const len = open ? 0.32 : 0.06;
  const pan = open ? 0.15 : -0.12;
  for (let n = 0; n < len * SR; n++) {
    const t = n / SR;
    const v = hp.run(noise()) * Math.exp(-t * (open ? 11 : 75)) * 0.26 * g;
    put("dry", s + n, v * (1 - pan), v * (1 + pan), open ? 0.12 : 0.04);
  }
}

function tick(t0, g = 1) {
  const s = at(t0);
  const bp = new Biquad("bp", 3200, 3);
  for (let n = 0; n < 0.08 * SR; n++) {
    const t = n / SR;
    const v = bp.run(noise()) * Math.exp(-t * 60) * 0.9 * g;
    put("dry", s + n, v, v, 0.3);
  }
}

function bass(t0, dur, midi, g = 1) {
  const s = at(t0);
  const f = mtof(midi);
  const lp = new Biquad("lp", 400, 1.1);
  let ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const t = n / SR;
    ph += f / SR;
    lp.set(160 + 1100 * Math.exp(-t * 11));
    const env = Math.min(1, t * 200) * Math.min(1, (dur - t) * 60);
    const v =
      (lp.run(saw(ph) * 0.7) + Math.sin(2 * Math.PI * ph) * 0.55) * env * g;
    put("mus", s + n, v * 0.55, v * 0.55);
  }
}

function pad(t0, dur, notes, g = 1, cutoff = () => 1600) {
  const s = at(t0);
  const lpL = new Biquad("lp", 1600, 0.9);
  const lpR = new Biquad("lp", 1600, 0.9);
  const voices = notes.flatMap((m) =>
    [-0.09, 0, 0.09].map((d, k) => ({
      f: mtof(m + d),
      ph: (noise() + 1) / 2,
      k,
    })),
  );
  for (let n = 0; n < (dur + 0.5) * SR; n++) {
    const t = n / SR;
    if (n % 64 === 0) {
      const f = cutoff(t0 + t);
      lpL.set(f);
      lpR.set(f);
    }
    let l = 0;
    let r = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      const x = saw(v.ph);
      if (v.k === 0) l += x;
      else if (v.k === 2) r += x;
      else {
        l += x * 0.6;
        r += x * 0.6;
      }
    }
    const env =
      Math.min(1, t / 0.18) * (t > dur ? Math.exp(-(t - dur) * 9) : 1);
    const k = (0.07 * env * g) / notes.length;
    put("mus", s + n, lpL.run(l) * k * 2.2, lpR.run(r) * k * 2.2, 0.4);
  }
}

function pluck(t0, midi, g = 1, cutoff = 3200) {
  const s = at(t0);
  const lp = new Biquad("lp", cutoff, 1.4);
  const f = mtof(midi);
  let ph = 0;
  for (let n = 0; n < 0.3 * SR; n++) {
    const t = n / SR;
    ph += f / SR;
    const x = (ph % 1 < 0.32 ? 1 : -1) * 0.5 + saw(ph * 1.003) * 0.5;
    lp.set(cutoff * (0.35 + 0.65 * Math.exp(-t * 18)));
    const v = lp.run(x) * Math.exp(-t * 15) * 0.13 * g;
    if (s + n < N) arpBus[s + n] += v;
  }
}

function stab(t0, notes, g = 1, len = 0.7) {
  const s = at(t0);
  const lpL = new Biquad("lp", 5200, 0.8);
  const lpR = new Biquad("lp", 5200, 0.8);
  const voices = notes.flatMap((m) =>
    [-0.14, -0.05, 0.05, 0.14].map((d, k) => ({
      f: mtof(m + d),
      ph: (noise() + 1) / 2,
      left: k % 2 === 0,
    })),
  );
  for (let n = 0; n < len * SR; n++) {
    const t = n / SR;
    let l = 0;
    let r = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      if (v.left) l += saw(v.ph);
      else r += saw(v.ph);
    }
    const env = Math.min(1, t * 300) * Math.exp(-t * (4.5 / len));
    const k = (0.11 * env * g) / notes.length;
    put("dry", s + n, lpL.run(l) * k, lpR.run(r) * k, 0.45);
  }
}

function riser(t0, dur, g = 1) {
  const s = at(t0);
  const bp = new Biquad("bp", 400, 1.2);
  let ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const t = n / SR;
    const p = t / dur;
    if (n % 32 === 0) bp.set(300 * 30 ** p);
    ph += (180 * 6 ** p) / SR;
    const v =
      (bp.run(noise()) * 0.5 + Math.sin(2 * Math.PI * ph) * 0.06) *
      p ** 2.2 *
      g;
    put("dry", s + n, v, v * 0.9, 0.35);
  }
}

function impact(t0, g = 1) {
  const s = at(t0);
  const hp = new Biquad("hp", 2500, 0.7);
  let ph = 0;
  for (let n = 0; n < 2.6 * SR; n++) {
    const t = n / SR;
    ph += (2 * Math.PI * (34 + 30 * Math.exp(-t * 6))) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 2.4) * 0.8;
    const crash = hp.run(noise()) * Math.exp(-t * 2.2) * 0.22;
    const v = (boom + crash) * g;
    put("dry", s + n, v, v * 0.97, 0.5);
  }
}

// ---------- Arrangement ----------

const chords = [
  [53, 56, 60], // Fm
  [49, 53, 56], // Db
  [56, 60, 63], // Ab
  [51, 55, 58], // Eb
];
const roots = [41, 37, 44, 39];
const hits = {
  kicks: [],
  claps: [],
  heartbeats: [],
  impacts: [],
  stabs: [],
  roll: [],
  ticks: [],
};
const frame = (t) => Math.round(t * FPS);
const mark = (k, t) => hits[k].push(frame(t));

const section = (bar) =>
  bar < 2
    ? "intro"
    : bar < 6
      ? "drop1"
      : bar < 8
        ? "break"
        : bar < 13
          ? "drop2"
          : bar < 14
            ? "build"
            : "final";

const STOP = 27.75; // the silent half-beat before the final hit

for (let bar = 0; bar < 15; bar++) {
  const t = bar * BAR;
  const sec = section(bar);
  const ch = chords[bar % 4];
  const root = roots[bar % 4];

  // Pads
  if (sec === "intro")
    pad(t, BAR, ch, 0.9, (x) => 300 + 2200 * (x / (2 * BAR)) ** 1.5);
  else if (sec === "build")
    pad(t, BAR - BEAT / 2, ch, 1, (x) => 900 + 5000 * ((x - t) / BAR) ** 2);
  else if (sec === "final") pad(t, BAR * 0.8, chords[0], 0.9, () => 2600);
  else
    pad(t, BAR, ch, sec === "break" ? 1.15 : 1, () =>
      sec === "break" ? 2400 : 1800,
    );

  // Arpeggio: chord tones over two octaves, 16ths
  const arpNotes = [...ch, ...ch.map((m) => m + 12), ch[2] + 12, ch[1] + 12];
  for (let i = 0; i < 16; i++) {
    const ti = t + i * S16;
    if (sec === "final") break;
    if (sec === "intro" && bar === 0 && i < 8) continue;
    if (sec === "build" && ti >= STOP) break;
    const cutoff =
      sec === "intro"
        ? 700 + 2400 * (ti / (2 * BAR))
        : sec === "break"
          ? 1400
          : sec === "drop2"
            ? 4200
            : 3400;
    const up = sec === "drop2" && i % 4 === 2 ? 12 : 0;
    pluck(
      ti,
      arpNotes[(i * 3) % arpNotes.length] + 12 + up,
      sec === "break" ? 0.8 : 1,
      cutoff,
    );
  }

  // Intro heartbeat and ticks
  if (sec === "intro") {
    for (let b = 0; b < 4; b += 2) {
      heartbeat(t + b * BEAT, 0.9 + bar * 0.1);
      mark("heartbeats", t + b * BEAT);
    }
    for (let b = 1; b < 4; b += 2) {
      tick(t + b * BEAT, 0.5);
      mark("ticks", t + b * BEAT);
    }
    if (bar === 1) {
      riser(t, BAR, 1);
      for (let i = 0; i < 4; i++) {
        clap(t + 3 * BEAT + i * S16, 0.35 + i * 0.15, 0.2);
        mark("roll", t + 3 * BEAT + i * S16);
      }
    }
  }

  // Drops
  if (sec === "drop1" || sec === "drop2") {
    const fill = bar === 5 || bar === 12;
    for (let b = 0; b < 4; b++) {
      const tb = t + b * BEAT;
      if (!(fill && b === 3)) {
        kick(tb);
        mark("kicks", tb);
      }
      if (b === 1 || (b === 3 && !fill)) {
        clap(tb);
        mark("claps", tb);
      }
      for (let i = 0; i < 4; i++) hat(tb + i * S16, false, i === 2 ? 1 : 0.55);
      hat(tb + BEAT / 2, true, sec === "drop2" ? 0.9 : 0.6);
      // Bass on the offbeat 8ths, octave pop on the last 16th
      bass(tb + BEAT / 2, S16 * 1.6, root, 1);
      bass(tb + BEAT / 2 + S16 * 1.5 + 0.0, S16 * 0.4, root + 12, 0.6);
    }
    if (fill)
      for (let i = 0; i < 4; i++) {
        clap(t + 3 * BEAT + i * S16, 0.5 + i * 0.15);
        mark("roll", t + 3 * BEAT + i * S16);
      }
    if (bar === 2 || bar === 8) {
      impact(t, 1);
      mark("impacts", t);
    }
    if (bar === 2 || bar === 4 || sec === "drop2") {
      stab(
        t,
        ch.map((m) => m + 12),
        1.1,
      );
      mark("stabs", t);
    }
    if (sec === "drop2") {
      stab(
        t + BEAT * 1.5,
        ch.map((m) => m + 12),
        0.6,
        0.35,
      );
      mark("stabs", t + BEAT * 1.5);
    }
  }

  // Breakdown: half-time clap, long bass, soft hats, riser into drop 2
  if (sec === "break") {
    clap(t + 2 * BEAT, 1, 0.55);
    mark("claps", t + 2 * BEAT);
    bass(t, BAR * 0.95, root, 0.7);
    for (let i = 0; i < 8; i++) hat(t + (i * BEAT) / 2, false, 0.35);
    if (bar === 7) {
      riser(t, BAR, 1.1);
      for (let i = 0; i < 4; i++) {
        clap(t + 3 * BEAT + i * S16, 0.4 + i * 0.18);
        mark("roll", t + 3 * BEAT + i * S16);
      }
    }
  }

  // Build: kick on 1 and 2, then an accelerating clap roll and a hard stop
  if (sec === "build") {
    kick(t);
    kick(t + BEAT);
    mark("kicks", t);
    mark("kicks", t + BEAT);
    riser(t, STOP - t, 1.2);
    const roll = [];
    for (let x = t; x < t + 2 * BEAT; x += BEAT / 2) roll.push(x);
    for (let x = t + 2 * BEAT; x < t + 3 * BEAT; x += S16) roll.push(x);
    for (let x = t + 3 * BEAT; x < STOP - 1e-6; x += S16 / 2) roll.push(x);
    roll.forEach((x, i) => {
      clap(x, 0.35 + (0.65 * i) / roll.length, 0.15);
      mark("roll", x);
    });
  }

  // Final hit, then one last heartbeat as the reverb rings out
  if (sec === "final") {
    impact(t, 1.15);
    kick(t, 1.1);
    stab(t, [...chords[0], ...chords[0].map((m) => m + 12)], 1.3, 1.6);
    bass(t, 1.4, roots[0], 1);
    mark("impacts", t);
    mark("kicks", t);
    mark("stabs", t);
    heartbeat(t + 1.0, 0.7);
    mark("heartbeats", t + 1.0);
  }
}

// Ping-pong delay on the arpeggio (3/16 note), then into the ducked music bus.
{
  const d = at(S16 * 3);
  const wL = new Float32Array(N);
  const wR = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const j = i - d;
    wL[i] = j >= 0 ? arpBus[j] * 0.5 + wR[j] * 0.45 : 0;
    wR[i] = j >= 0 ? wL[j] * 0.6 : 0;
    put("mus", i, arpBus[i] + wL[i] * 0.55, arpBus[i] + wR[i] * 0.55, 0.15);
  }
}

// Hard stop before the final hit: silence the dry and music buses.
for (let i = at(STOP); i < at(28); i++) {
  const fade = Math.max(0, 1 - (i - at(STOP)) / (SR * 0.01));
  dryL[i] *= fade;
  dryR[i] *= fade;
  musL[i] *= fade;
  musR[i] *= fade;
  revL[i] *= fade;
  revR[i] *= fade;
}

// Small Freeverb-style reverb on the send bus.
function reverb(input, offset) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491].map((n) => ({
    buf: new Float32Array(n + offset),
    i: 0,
    store: 0,
  }));
  const allpasses = [556, 441, 341].map((n) => ({
    buf: new Float32Array(n + offset),
    i: 0,
  }));
  const out = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const x = input[n] * 0.12;
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.store = o * 0.72 + c.store * 0.28;
      c.buf[c.i] = x + c.store * 0.86;
      c.i = (c.i + 1) % c.buf.length;
      y += o;
    }
    for (const a of allpasses) {
      const b = a.buf[a.i];
      a.buf[a.i] = y + b * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = b - y;
    }
    out[n] = y;
  }
  return out;
}
const wetL = reverb(revL, 0);
const wetR = reverb(revR, 23);

// Mixdown and master.
const outL = new Float32Array(N);
const outR = new Float32Array(N);
const hpL = new Biquad("hp", 28);
const hpR = new Biquad("hp", 28);
let peak = 0;
for (let i = 0; i < N; i++) {
  const gate = i >= at(STOP) && i < at(28) ? 0.03 : 1;
  let l = dryL[i] + musL[i] * duck[i] + wetL[i] * 0.9 * gate;
  let r = dryR[i] + musR[i] * duck[i] + wetR[i] * 0.9 * gate;
  l = Math.tanh(hpL.run(l) * 1.25);
  r = Math.tanh(hpR.run(r) * 1.25);
  const tail = i > N - SR * 0.6 ? (N - i) / (SR * 0.6) : 1;
  outL[i] = l * tail;
  outR[i] = r * tail;
  peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
}

const gain = 0.93 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write("RIFF", 0);
pcm.writeUInt32LE(36 + N * 4, 4);
pcm.write("WAVEfmt ", 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write("data", 36);
pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(outL[i] * gain * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(outR[i] * gain * 32767), 46 + i * 4);
}
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "showreel-music.wav"), pcm);

for (const k of Object.keys(hits)) hits[k].sort((a, b) => a - b);
const beats = {
  fps: FPS,
  bpm: BPM,
  framesPerBeat: BEAT * FPS,
  durationInFrames: LENGTH * FPS,
  sections: {
    intro: 0,
    drop1: frame(2 * BAR),
    break: frame(6 * BAR),
    drop2: frame(8 * BAR),
    build: frame(13 * BAR),
    stop: frame(STOP),
    final: frame(14 * BAR),
  },
  ...hits,
};
mkdirSync(join(root, "src", "showreel"), { recursive: true });
writeFileSync(
  join(root, "src", "showreel", "beats.json"),
  JSON.stringify(beats, null, 1) + "\n",
);
console.log(
  `Wrote showreel-music.wav (${LENGTH}s, peak gain ${gain.toFixed(2)}) and beats.json`,
);
