/* =========================================================================
   VOYAGER · AUDIO  — everything synthesized with the Web Audio API.
   No files, no network. Starts only after a user gesture (the launch click).
   window.VoyagerAudio = { init, resume, countdownBeep, launch, whoosh, dive,
                           blip, ambientStart, ambientStop, setEnabled, toggle,
                           isEnabled }
   ========================================================================= */
window.VoyagerAudio = (function () {
  "use strict";

  let ctx = null, master = null, reverb = null, ambient = null, started = false;
  let enabled = (localStorage.getItem("voyager-sound") !== "off");

  function impulse(dur, decay) {
    const len = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function init() {
    if (started) return started;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0.0;
    master.connect(ctx.destination);
    // spatial reverb send → gives everything a deep-space tail
    reverb = ctx.createConvolver(); reverb.buffer = impulse(2.6, 2.4);
    const rg = ctx.createGain(); rg.gain.value = 0.32; reverb.connect(rg).connect(master);
    started = true;
    return true;
  }
  // route a source gain to both the dry master and the reverb send
  function out(g) { g.connect(master); if (reverb) g.connect(reverb); }
  function resume() { if (ctx && ctx.state === "suspended") ctx.resume(); }

  function noiseBuffer(dur) {
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /* ---- short tone ---- */
  function tone(freq, dur, type, vol, glideTo) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g); o.start(t); o.stop(t + dur + 0.03);
  }

  function countdownBeep(final) {
    if (final) { launch(); return; }
    tone(440, 0.16, "square", 0.22);
    tone(880, 0.16, "sine", 0.12);       // harmonic sparkle
  }

  function blip(up) { tone(up ? 620 : 500, 0.07, "triangle", 0.08, up ? 900 : 380); }
  function chime() { tone(659.25, 0.5, "sine", 0.13); setTimeout(() => tone(987.77, 0.6, "sine", 0.1), 90); }
  function wish() { tone(1046, 0.12, "sine", 0.1, 1568); setTimeout(() => tone(1568, 0.16, "sine", 0.08), 80); setTimeout(() => tone(2093, 0.22, "sine", 0.06), 160); }
  function alien() {
    if (!ctx || !enabled) return; const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const o = ctx.createOscillator(); o.type = "sine"; const f = 320 + Math.random() * 560;
      o.frequency.setValueAtTime(f, t + i * 0.13); o.frequency.linearRampToValueAtTime(f * 1.6, t + i * 0.13 + 0.1);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + i * 0.13); g.gain.exponentialRampToValueAtTime(0.13, t + i * 0.13 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.13 + 0.13);
      o.connect(g); out(g); o.start(t + i * 0.13); o.stop(t + i * 0.13 + 0.15);
    }
  }

  /* ---- rocket launch rumble ---- */
  function launch() {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime, dur = 3.6;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(dur);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(180, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + 1.1);
    lp.frequency.exponentialRampToValueAtTime(110, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.6, t + 0.35);
    g.gain.linearRampToValueAtTime(0.5, t + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g); out(g); src.start(t); src.stop(t + dur);
    // sub-bass weight
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(28, t + dur);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.42, t + 0.4); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og).connect(master); o.start(t); o.stop(t + dur);
  }

  /* ---- travel / jump whoosh ---- */
  function whoosh(dur, vol) {
    if (!ctx || !enabled) return;
    dur = dur || 0.7;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(dur);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.5);
    bp.frequency.exponentialRampToValueAtTime(240, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.22, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g); out(g); src.start(t); src.stop(t + dur);
  }

  /* ---- black-hole dive: deep descending roar ---- */
  function dive() {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime, dur = 3.0;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(dur);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g); out(g); src.start(t); src.stop(t + dur);
    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(24, t + dur);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.3, t + 0.4); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og).connect(master); o.start(t); o.stop(t + dur);
  }

  /* ---- ambient space drone (loops) ---- */
  function ambientStart() {
    if (!ctx || ambient) return;
    const t = ctx.currentTime;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 4); g.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 620; lp.connect(g);
    const parts = [];
    [55, 82.41, 110, 164.81].forEach((f) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = 0.22; o.connect(og).connect(lp); o.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.04 + Math.random() * 0.08;
      const lg = ctx.createGain(); lg.gain.value = 2.5; lfo.connect(lg).connect(o.detune); lfo.start();
      parts.push(o, lfo);
    });
    const flfo = ctx.createOscillator(); flfo.frequency.value = 0.03;
    const flg = ctx.createGain(); flg.gain.value = 240; flfo.connect(flg).connect(lp.frequency); flfo.start(); parts.push(flfo);
    ambient = { g, parts };
  }
  function ambientStop() {
    if (!ambient) return;
    const t = ctx.currentTime; ambient.g.gain.cancelScheduledValues(t);
    ambient.g.gain.setValueAtTime(ambient.g.gain.value, t); ambient.g.gain.linearRampToValueAtTime(0.0001, t + 1.5);
    const a = ambient; ambient = null;
    setTimeout(() => { a.parts.forEach((n) => { try { n.stop(); } catch (e) {} }); }, 1700);
  }

  function setEnabled(b) {
    enabled = b; localStorage.setItem("voyager-sound", b ? "on" : "off");
    if (master && ctx) { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.linearRampToValueAtTime(b ? 0.55 : 0.0, t + 0.25); }
  }
  function toggle() { setEnabled(!enabled); resume(); return enabled; }
  function isEnabled() { return enabled; }

  return { init, resume, countdownBeep, launch, whoosh, dive, blip, chime, wish, alien, ambientStart, ambientStop, setEnabled, toggle, isEnabled };
})();
