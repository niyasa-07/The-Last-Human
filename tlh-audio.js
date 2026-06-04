/* The Last Human — procedural audio engine (Web Audio API)
   No asset files. Everything synthesized. Must be started from a user gesture. */
(function () {
  "use strict";

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.scene = null;
      this._fxTimer = null;
      this._heart = null;
      this._started = false;
    }

    ensure() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      const ctx = this.ctx;

      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);

      // soft limiter-ish
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -18;
      this.comp.knee.value = 24;
      this.comp.ratio.value = 6;
      this.comp.connect(this.master);

      // shared reverb
      this.verb = ctx.createConvolver();
      this.verb.buffer = this._impulse(2.6, 2.4);
      this.verbGain = ctx.createGain();
      this.verbGain.gain.value = 0.5;
      this.verb.connect(this.verbGain);
      this.verbGain.connect(this.comp);

      this.noiseBuf = this._noise(3);

      // --- BED: two detuned drones ---
      this.bedGain = ctx.createGain();
      this.bedGain.gain.value = 0.0;
      this.bedFilter = ctx.createBiquadFilter();
      this.bedFilter.type = "lowpass";
      this.bedFilter.frequency.value = 420;
      this.bedFilter.Q.value = 4;
      this.bedFilter.connect(this.bedGain);
      this.bedGain.connect(this.comp);
      this.bedGain.connect(this.verb);

      this.oscA = ctx.createOscillator();
      this.oscA.type = "sawtooth";
      this.oscA.frequency.value = 55;
      this.oscB = ctx.createOscillator();
      this.oscB.type = "triangle";
      this.oscB.frequency.value = 55.4;
      this.oscC = ctx.createOscillator(); // a fifth for fuller scenes
      this.oscC.type = "sine";
      this.oscC.frequency.value = 82.5;
      this.oscCGain = ctx.createGain();
      this.oscCGain.gain.value = 0.0;
      this.oscA.connect(this.bedFilter);
      this.oscB.connect(this.bedFilter);
      this.oscC.connect(this.oscCGain);
      this.oscCGain.connect(this.bedFilter);

      // slow filter LFO
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.value = 0.06;
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 120;
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.bedFilter.frequency);

      // --- WIND: filtered noise ---
      this.wind = ctx.createBufferSource();
      this.wind.buffer = this.noiseBuf;
      this.wind.loop = true;
      this.windBP = ctx.createBiquadFilter();
      this.windBP.type = "bandpass";
      this.windBP.frequency.value = 500;
      this.windBP.Q.value = 0.7;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.0;
      this.wind.connect(this.windBP);
      this.windBP.connect(this.windGain);
      this.windGain.connect(this.comp);
      this.windLfo = ctx.createOscillator();
      this.windLfo.frequency.value = 0.08;
      this.windLfoGain = ctx.createGain();
      this.windLfoGain.gain.value = 240;
      this.windLfo.connect(this.windLfoGain);
      this.windLfoGain.connect(this.windBP.frequency);

      // --- SHIMMER: high airy cluster ---
      this.shimGain = ctx.createGain();
      this.shimGain.gain.value = 0.0;
      this.shimGain.connect(this.verb);
      this.shimGain.connect(this.comp);
      [1320, 1760, 1980].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.12 / (i + 1);
        o.connect(g);
        g.connect(this.shimGain);
        o.start();
      });

      [this.oscA, this.oscB, this.oscC, this.lfo, this.wind, this.windLfo].forEach(n => {
        try { n.start(); } catch (e) {}
      });
    }

    start() {
      this.ensure();
      if (this.ctx.state === "suspended") this.ctx.resume();
      this._started = true;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(this.enabled ? 0.85 : 0.0001, t + 1.4);
    }

    setMuted(m) {
      this.enabled = !m;
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(this.enabled ? 0.85 : 0.0001, t + 0.4);
    }

    _ramp(param, val, time) {
      const t = this.ctx.currentTime;
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
      param.linearRampToValueAtTime(val, t + time);
    }

    setScene(name) {
      if (!this.ctx) return;
      this.scene = name;
      const P = {
        blue:     { bed: 0.16, bf: 240, fa: 55,   fifth: 0,   wind: 0.0,  shim: 0.0,  fx: ["glitch", "drip"], fxRate: 4200 },
        loading:  { bed: 0.18, bf: 360, fa: 73,   fifth: 0,   wind: 0.04, shim: 0.05, fx: ["glitch", "drip"], fxRate: 2600 },
        survivor: { bed: 0.13, bf: 200, fa: 55,   fifth: 0,   wind: 0.02, shim: 0.03, fx: ["drip"],            fxRate: 5200 },
        earth:    { bed: 0.20, bf: 520, fa: 110,  fifth: 0.5, wind: 0.05, shim: 0.16, fx: ["drip"],            fxRate: 6000 },
        choice:   { bed: 0.20, bf: 520, fa: 110,  fifth: 0.5, wind: 0.05, shim: 0.16, fx: ["drip"],            fxRate: 6000 },
        illusion_forest:      { bed: 0.18, bf: 480, fa: 98,  fifth: 0.4, wind: 0.08, shim: 0.12, fx: ["chirp", "chirp", "drip"], fxRate: 2600 },
        illusion_cards:       { bed: 0.17, bf: 440, fa: 98,  fifth: 0.3, wind: 0.06, shim: 0.10, fx: ["chirp", "drip"],          fxRate: 3400 },
        illusion_restoration: { bed: 0.19, bf: 560, fa: 110, fifth: 0.6, wind: 0.05, shim: 0.18, fx: ["chirp", "chirp"],        fxRate: 2200 },
        illusion_treehouse:   { bed: 0.20, bf: 520, fa: 104, fifth: 0.6, wind: 0.05, shim: 0.16, fx: ["chirp", "drip"],         fxRate: 3000 },
        illusion_memlake:     { bed: 0.16, bf: 220, fa: 49,  fifth: 0,   wind: 0.10, shim: 0.0,  fx: ["drip", "crash", "drip"], fxRate: 2600 },
        illusion_voidtree:    { bed: 0.22, bf: 620, fa: 110, fifth: 0.7, wind: 0.06, shim: 0.22, fx: ["chirp"],                 fxRate: 5000 },
        illusion_room:        { bed: 0.15, bf: 360, fa: 82,  fifth: 0.3, wind: 0.03, shim: 0.08, fx: ["drip"],                  fxRate: 5200 },
        illusion_dark:        { bed: 0.08, bf: 160, fa: 41,  fifth: 0,   wind: 0.02, shim: 0.0,  fx: ["glitch"],                fxRate: 4200 },
        harmony_camp:         { bed: 0.18, bf: 600, fa: 110, fifth: 0.6, wind: 0.06, shim: 0.20, fx: ["chirp", "chirp"],        fxRate: 2400 },
        harmony_cards:        { bed: 0.17, bf: 540, fa: 110, fifth: 0.4, wind: 0.05, shim: 0.16, fx: ["chirp"],                 fxRate: 3200 },
        harmony_meadow:       { bed: 0.18, bf: 600, fa: 110, fifth: 0.6, wind: 0.06, shim: 0.20, fx: ["chirp", "chirp"],        fxRate: 2400 },
        harmony_innoforest:   { bed: 0.19, bf: 560, fa: 110, fifth: 0.6, wind: 0.05, shim: 0.18, fx: ["chirp", "drip"],         fxRate: 2600 },
        harmony_skygardens:   { bed: 0.20, bf: 640, fa: 110, fifth: 0.7, wind: 0.06, shim: 0.24, fx: ["chirp"],                 fxRate: 3000 },
        harmony_gathering:    { bed: 0.20, bf: 520, fa: 104, fifth: 0.6, wind: 0.05, shim: 0.14, fx: ["drip"],                  fxRate: 3400 },
        harmony_choice:       { bed: 0.12, bf: 300, fa: 55,  fifth: 0,   wind: 0.03, shim: 0.05, fx: ["drip"],                  fxRate: 5000 }
      }[name];
      if (!P) return;
      this._ramp(this.bedGain.gain, P.bed, 2.2);
      this._ramp(this.bedFilter.frequency, P.bf, 2.2);
      this._ramp(this.oscA.frequency, P.fa, 2.2);
      this._ramp(this.oscB.frequency, P.fa + 0.4, 2.2);
      this._ramp(this.oscCGain.gain, P.fifth * 0.5, 2.2);
      this._ramp(this.windGain.gain, P.wind, 2.4);
      this._ramp(this.shimGain.gain, P.shim, 2.6);

      clearInterval(this._fxTimer);
      const schedule = () => {
        if (Math.random() < 0.7) {
          const pick = P.fx[(Math.random() * P.fx.length) | 0];
          this.fx(pick);
        }
      };
      this._fxTimer = setInterval(schedule, P.fxRate + Math.random() * 1500);

      if (name === "survivor") this._startHeart(); else this._stopHeart();
    }

    _startHeart() {
      if (this._heart) return;
      const beat = () => {
        this.fx("heartbeat");
      };
      this._heart = setInterval(beat, 1150);
      beat();
    }
    _stopHeart() { clearInterval(this._heart); this._heart = null; }

    fx(kind) {
      if (!this.ctx || !this._started) return;
      const ctx = this.ctx, t = ctx.currentTime;
      if (kind === "glitch") {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 600 + Math.random() * 2600;
        bp.Q.value = 6;
        const g = ctx.createGain();
        g.gain.value = 0.0;
        src.connect(bp); bp.connect(g); g.connect(this.comp);
        const dur = 0.05 + Math.random() * 0.16;
        g.gain.setValueAtTime(0.0, t);
        // stutter envelope
        for (let i = 0; i < 5; i++) {
          const tt = t + (dur * i) / 5;
          g.gain.setValueAtTime(Math.random() * 0.28, tt);
        }
        g.gain.linearRampToValueAtTime(0.0, t + dur);
        src.start(t); src.stop(t + dur + 0.02);
      } else if (kind === "drip") {
        const o = ctx.createOscillator();
        o.type = "sine";
        const g = ctx.createGain();
        const f0 = 720 + Math.random() * 520;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f0 * 0.32, t + 0.16);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        o.connect(g); g.connect(this.verb); g.connect(this.comp);
        o.start(t); o.stop(t + 0.5);
      } else if (kind === "heartbeat") {
        const thump = (delay, gain) => {
          const o = ctx.createOscillator();
          o.type = "sine";
          const g = ctx.createGain();
          const lp = ctx.createBiquadFilter();
          lp.type = "lowpass"; lp.frequency.value = 120;
          o.frequency.setValueAtTime(85, t + delay);
          o.frequency.exponentialRampToValueAtTime(38, t + delay + 0.16);
          g.gain.setValueAtTime(0.0001, t + delay);
          g.gain.linearRampToValueAtTime(gain, t + delay + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.3);
          o.connect(lp); lp.connect(g); g.connect(this.comp);
          o.start(t + delay); o.stop(t + delay + 0.34);
        };
        thump(0, 0.5); thump(0.22, 0.32);
      } else if (kind === "chirp") {
        // short birdsong: 2-3 quick high notes
        const n = 2 + (Math.random() * 2 | 0);
        const f0 = 1600 + Math.random() * 1400;
        for (let i = 0; i < n; i++) {
          const o = ctx.createOscillator();
          o.type = "sine";
          const g = ctx.createGain();
          const tt = t + i * 0.09;
          const f = f0 * (1 + (Math.random() - 0.3) * 0.4);
          o.frequency.setValueAtTime(f, tt);
          o.frequency.exponentialRampToValueAtTime(f * (1.1 + Math.random() * 0.3), tt + 0.05);
          g.gain.setValueAtTime(0.0001, tt);
          g.gain.linearRampToValueAtTime(0.05, tt + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.08);
          o.connect(g); g.connect(this.verb); g.connect(this.comp);
          o.start(tt); o.stop(tt + 0.1);
        }
      } else if (kind === "whoosh" || kind === "select") {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass"; bp.Q.value = 1.2;
        bp.frequency.setValueAtTime(300, t);
        bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        src.connect(bp); bp.connect(g); g.connect(this.verb); g.connect(this.comp);
        src.start(t); src.stop(t + 0.8);
      } else if (kind === "crash") {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        src.connect(lp); lp.connect(g); g.connect(this.verb); g.connect(this.comp);
        src.start(t); src.stop(t + 1.7);
      }
    }

    // ---- buffer helpers ----
    _noise(seconds) {
      const ctx = this.ctx, len = (ctx.sampleRate * seconds) | 0;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02; // pinkish
        d[i] = clamp(last * 3.2, -1, 1);
      }
      return buf;
    }
    _impulse(seconds, decay) {
      const ctx = this.ctx, len = (ctx.sampleRate * seconds) | 0;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    }
  }

  window.AudioEngine = AudioEngine;
})();
