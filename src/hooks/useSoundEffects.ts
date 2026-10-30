import type { DrivetrainLayout } from '../types/automotive';

/* ---------------------------------------------------------------- */
/* Web Audio API Synthesizer — Âm thanh Động cơ & Phản hồi UI        */
/* ---------------------------------------------------------------- */

let ctx: AudioContext | null = null;
let sfxMuted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => undefined);
  }
  return ctx;
}

export function isSfxMuted(): boolean {
  return sfxMuted;
}

export function setSfxMuted(m: boolean): void {
  sfxMuted = m;
}

/** Âm thanh click nhẹ khi bấm nút hoặc phím tắt UI */
export function playUiClick(freq = 660): void {
  if (sfxMuted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.045);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

/** Âm thanh đóng/mở cửa, ca-pô, cốp xe */
export function playLatchSound(opening: boolean): void {
  if (sfxMuted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(opening ? 140 : 210, now);
  osc.frequency.exponentialRampToValueAtTime(opening ? 260 : 95, now + 0.14);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}

/**
 * Phát âm thanh khởi động & rú ga đặc trưng từng dòng xe (~2.6 giây):
 * - 'ev' (VF8): tiếng mô-tơ điện tần số cao + sci-fi turbine hum
 * - 'ice-4wd' (Everest Bi-Turbo Diesel): tiếng gầm trầm mạnh + tiếng rít turbo
 * - 'ice-fwd' / 'ice-awd' (CX-5 SkyActiv / Vios): tiếng đề nổ và tua máy xăng mượt
 */
export function playEngineRev(layout: DrivetrainLayout, onDone?: () => void): () => void {
  const ac = getCtx();
  if (!ac || sfxMuted) {
    const t = window.setTimeout(() => onDone?.(), 1200);
    return () => window.clearTimeout(t);
  }

  const now = ac.currentTime;
  const duration = 2.6;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.001, now);
  master.gain.linearRampToValueAtTime(0.22, now + 0.2);
  master.gain.setValueAtTime(0.24, now + 1.7);
  master.gain.exponentialRampToValueAtTime(0.0008, now + duration);
  master.connect(ac.destination);

  const stopList: AudioScheduledSourceNode[] = [];

  if (layout === 'ev') {
    // EV futuristic dual-motor whine + chord
    const carrier = ac.createOscillator();
    const harmonic = ac.createOscillator();
    const sub = ac.createOscillator();
    carrier.type = 'sine';
    harmonic.type = 'triangle';
    sub.type = 'sine';

    carrier.frequency.setValueAtTime(190, now);
    carrier.frequency.exponentialRampToValueAtTime(780, now + 1.25);
    carrier.frequency.exponentialRampToValueAtTime(320, now + duration);

    harmonic.frequency.setValueAtTime(380, now);
    harmonic.frequency.exponentialRampToValueAtTime(1560, now + 1.25);
    harmonic.frequency.exponentialRampToValueAtTime(640, now + duration);

    sub.frequency.setValueAtTime(65, now);
    sub.frequency.linearRampToValueAtTime(130, now + 1.25);
    sub.frequency.linearRampToValueAtTime(75, now + duration);

    const gH = ac.createGain();
    gH.gain.value = 0.35;
    carrier.connect(master);
    sub.connect(master);
    harmonic.connect(gH).connect(master);

    [carrier, harmonic, sub].forEach((o) => {
      o.start(now);
      o.stop(now + duration);
      stopList.push(o);
    });
  } else {
    const isDiesel = layout === 'ice-4wd';
    const baseFreq = isDiesel ? 44 : 62;
    const peakFreq = isDiesel ? 165 : 240;

    // 2 răng cưa lệch pha + LPF mô phỏng chu kỳ đánh lửa xy-lanh
    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    const filter = ac.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    lfo.type = 'sine';

    // Đề máy (0 - 0.35s) → Không tải (0.35 - 0.7s) → Rú ga (0.7 - 1.65s) → Hạ tua
    [osc1, osc2].forEach((o, idx) => {
      const mul = idx === 0 ? 1 : 0.5;
      o.frequency.setValueAtTime(baseFreq * 0.6 * mul, now);
      o.frequency.linearRampToValueAtTime(baseFreq * mul, now + 0.35);
      o.frequency.exponentialRampToValueAtTime(peakFreq * mul, now + 1.35);
      o.frequency.exponentialRampToValueAtTime(peakFreq * 1.12 * mul, now + 1.65);
      o.frequency.exponentialRampToValueAtTime(baseFreq * 0.95 * mul, now + duration);
    });

    lfo.frequency.setValueAtTime(isDiesel ? 18 : 26, now);
    lfo.frequency.linearRampToValueAtTime(isDiesel ? 48 : 64, now + 1.5);
    lfoGain.gain.value = 14;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(isDiesel ? 950 : 1400, now + 1.5);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);
    filter.Q.value = 3.5;

    lfo.connect(lfoGain).connect(osc1.frequency);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(master);

    [osc1, osc2, lfo].forEach((o) => {
      o.start(now);
      o.stop(now + duration);
      stopList.push(o);
    });

    // Tiếng rít Bi-Turbo cho động cơ Diesel Everest
    if (isDiesel) {
      const whistle = ac.createOscillator();
      const wGain = ac.createGain();
      whistle.type = 'sine';
      whistle.frequency.setValueAtTime(900, now + 0.5);
      whistle.frequency.exponentialRampToValueAtTime(2600, now + 1.6);
      whistle.frequency.exponentialRampToValueAtTime(1100, now + duration);
      wGain.gain.setValueAtTime(0.0001, now);
      wGain.gain.linearRampToValueAtTime(0.18, now + 1.4);
      wGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      whistle.connect(wGain).connect(master);
      whistle.start(now + 0.5);
      whistle.stop(now + duration);
      stopList.push(whistle);
    }
  }

  const timer = window.setTimeout(() => onDone?.(), duration * 1000);
  return () => {
    window.clearTimeout(timer);
    stopList.forEach((s) => {
      try { s.stop(); } catch { /* đã dừng */ }
    });
  };
}

