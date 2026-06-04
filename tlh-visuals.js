/* The Last Human — procedural canvas visuals (core).
   Background fog + drifting motes + starfield, a feature-crossfade layer
   (earth, survivor, and any scenes registered by path modules), plus the
   rotating dual-world Earth. Path modules augment Visuals.prototype with
   feat_<name>() renderers and register presets via registerScenes(). */
(function () {
  "use strict";

  const lerp = (a, b, t) => a + (b - a) * t;
  function lerpArr(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  const rgb = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  const PRESETS = {
    blue:     { bgTop: [12, 44, 120], bgBot: [3, 9, 34],  mote: [130, 175, 255], moteCount: 55, fog: [30, 70, 170], fogA: 0.12, stars: 0.0, feature: null },
    loading:  { bgTop: [7, 22, 56],   bgBot: [2, 6, 22],  mote: [110, 205, 215], moteCount: 80, fog: [25, 90, 110], fogA: 0.11, stars: 0.25, feature: null },
    survivor: { bgTop: [7, 11, 18],   bgBot: [0, 0, 0],   mote: [190, 190, 210], moteCount: 36, fog: [40, 50, 75],  fogA: 0.08, stars: 0.55, feature: "survivor" },
    earth:    { bgTop: [4, 10, 16],   bgBot: [0, 2, 7],   mote: [150, 210, 180], moteCount: 64, fog: [25, 70, 70],  fogA: 0.06, stars: 1.0, feature: "earth" },
    choice:   { bgTop: [4, 10, 16],   bgBot: [0, 2, 7],   mote: [150, 210, 180], moteCount: 64, fog: [25, 70, 70],  fogA: 0.06, stars: 1.0, feature: "earth" }
  };

  class Visuals {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.t = 0;
      this.rot = 0;
      this.cur = JSON.parse(JSON.stringify(PRESETS.blue));
      this.tar = PRESETS.blue;
      this.featureNames = new Set(["earth", "survivor"]);
      this.featAlpha = {};
      this.fox = { state: "hidden", x: -0.25, t: 0 };
      this._initParticles();
      this._initEarth();
      this.resize();
      window.addEventListener("resize", () => this.resize());
      if (window.ResizeObserver) {
        try { new ResizeObserver(() => this.resize()).observe(document.documentElement); } catch (e) {}
      }
    }

    // Path modules call this to add their scene presets + feature names.
    registerScenes(presets) {
      for (const k in presets) {
        PRESETS[k] = presets[k];
        if (presets[k].feature) this.featureNames.add(presets[k].feature);
      }
    }

    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.W = w; this.H = h;
      this.canvas.width = w * this.dpr;
      this.canvas.height = h * this.dpr;
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    _syncSize() { if (this.W !== window.innerWidth || this.H !== window.innerHeight) this.resize(); }

    setScene(name) { if (PRESETS[name]) { this.tar = PRESETS[name]; this.curName = name; } }
    setFox(s) { if (this.fox.state !== s) { this.fox.state = s; this.fox.t = 0; } }

    _initParticles() {
      this.motes = [];
      for (let i = 0; i < 120; i++) {
        this.motes.push({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 2.2, sp: 0.002 + Math.random() * 0.01, ph: Math.random() * Math.PI * 2, drift: (Math.random() - 0.5) * 0.0006 });
      }
      this.stars = [];
      for (let i = 0; i < 160; i++) this.stars.push({ x: Math.random(), y: Math.random() * 0.85, r: Math.random() * 1.4 + 0.2, tw: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 2 });
      this.fogBlobs = [];
      for (let i = 0; i < 5; i++) this.fogBlobs.push({ x: Math.random(), y: Math.random(), r: 0.3 + Math.random() * 0.35, ax: Math.random() * Math.PI * 2, ay: Math.random() * Math.PI * 2, sx: 0.1 + Math.random() * 0.15, sy: 0.08 + Math.random() * 0.12 });
    }

    _initEarth() {
      this.earthPts = [];
      for (let c = 0; c < 9; c++) {
        const clon = Math.random() * Math.PI * 2, clat = (Math.random() - 0.5) * 2.2;
        const n = 10 + (Math.random() * 14 | 0);
        for (let i = 0; i < n; i++) this.earthPts.push({ lon: clon + (Math.random() - 0.5) * 0.9, lat: clamp(clat + (Math.random() - 0.5) * 0.7, -1.45, 1.45), r: 0.05 + Math.random() * 0.10, seed: Math.random() });
      }
    }

    start() {
      let last = performance.now();
      this._lastTick = last;
      const step = (dt) => {
        this._syncSize();
        this.t += dt;
        this.rot += dt * 0.10;
        this.fox.t += dt;
        this._ease();
        this._draw(dt);
        this._lastTick = performance.now();
      };
      const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
      this._fallback = setInterval(() => { if (performance.now() - this._lastTick > 220) { last = performance.now(); step(0.05); } }, 200);
    }
    kick(n) { for (let i = 0; i < (n || 30); i++) this._ease(); this._draw(0.016); }

    _ease() {
      const k = 0.045, c = this.cur, t = this.tar;
      c.bgTop = lerpArr(c.bgTop, t.bgTop, k);
      c.bgBot = lerpArr(c.bgBot, t.bgBot, k);
      c.mote = lerpArr(c.mote, t.mote, k);
      c.fog = lerpArr(c.fog, t.fog, k);
      c.fogA = lerp(c.fogA, t.fogA, k);
      c.moteCount = lerp(c.moteCount, t.moteCount, k);
      c.stars = lerp(c.stars, t.stars, k);
      const tf = t.feature;
      for (const n of this.featureNames) {
        const cur = this.featAlpha[n] || 0;
        this.featAlpha[n] = cur + ((n === tf ? 1 : 0) - cur) * 0.05;
      }
    }

    _draw(dt) {
      const ctx = this.ctx, W = this.W, H = this.H, c = this.cur;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgb(c.bgTop, 1)); g.addColorStop(1, rgb(c.bgBot, 1));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      if (c.stars > 0.01) {
        for (const s of this.stars) {
          const a = c.stars * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.t * s.sp + s.tw)));
          ctx.fillStyle = `rgba(200,225,255,${a})`;
          ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
        }
      }

      ctx.globalCompositeOperation = "screen";
      for (const f of this.fogBlobs) {
        const fx = (0.5 + 0.5 * Math.sin(this.t * f.sx + f.ax)) * W;
        const fy = (0.5 + 0.5 * Math.sin(this.t * f.sy + f.ay)) * H;
        const rr = f.r * Math.min(W, H);
        const rgg = ctx.createRadialGradient(fx, fy, 0, fx, fy, rr);
        rgg.addColorStop(0, rgb(c.fog, c.fogA)); rgg.addColorStop(1, rgb(c.fog, 0));
        ctx.fillStyle = rgg; ctx.fillRect(fx - rr, fy - rr, rr * 2, rr * 2);
      }
      ctx.globalCompositeOperation = "source-over";

      // feature crossfade layer
      for (const n of this.featureNames) {
        const a = this.featAlpha[n] || 0;
        if (a > 0.01) { const fn = this["feat_" + n]; if (fn) fn.call(this, a); }
      }

      // motes
      ctx.globalCompositeOperation = "screen";
      const cnt = c.moteCount | 0;
      for (let i = 0; i < cnt; i++) {
        const m = this.motes[i];
        m.y -= m.sp * dt * 12; m.x += m.drift;
        if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(this.t * 1.5 + m.ph));
        const x = m.x * W, y = m.y * H, rr = m.r * 2.4;
        const rgg = ctx.createRadialGradient(x, y, 0, x, y, rr);
        rgg.addColorStop(0, rgb(c.mote, a)); rgg.addColorStop(1, rgb(c.mote, 0));
        ctx.fillStyle = rgg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      ctx.globalCompositeOperation = "source-over";

      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    feat_survivor(alpha) {
      const ctx = this.ctx, W = this.W, H = this.H, cx = W / 2, cy = H * 0.5;
      const beat = Math.pow(0.5 + 0.5 * Math.sin(this.t * 5.0), 6);
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++) {
        const rr = ((this.t * 40 + i * 70) % 220) + 20, a = alpha * (1 - rr / 240) * 0.5;
        ctx.strokeStyle = `rgba(120,200,210,${a})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      }
      const r = 14 + beat * 10;
      const rgg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 5);
      rgg.addColorStop(0, `rgba(180,235,235,${alpha * (0.7 + beat * 0.3)})`);
      rgg.addColorStop(0.4, `rgba(90,180,200,${alpha * 0.4})`);
      rgg.addColorStop(1, "rgba(90,180,200,0)");
      ctx.fillStyle = rgg; ctx.fillRect(cx - r * 5, cy - r * 5, r * 10, r * 10);
      ctx.globalCompositeOperation = "source-over";
    }

    feat_earth(alpha) {
      const ctx = this.ctx, W = this.W, H = this.H;
      const cx = W / 2, cy = H * 0.52, R = Math.min(W, H) * 0.27;
      ctx.save(); ctx.globalAlpha = alpha;
      const ag = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R * 1.55);
      ag.addColorStop(0, "rgba(90,210,180,0.22)"); ag.addColorStop(1, "rgba(90,210,180,0)");
      ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2); ctx.fill();
      const og = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, R * 0.1, cx, cy, R);
      og.addColorStop(0, "#0c3530"); og.addColorStop(1, "#03141a");
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      const warm = [168, 206, 78], warmHi = [232, 196, 96], cool = [54, 208, 184], coolHi = [90, 230, 230];
      for (const p of this.earthPts) {
        const lon = p.lon + this.rot;
        const X = Math.cos(p.lat) * Math.sin(lon), Y = Math.sin(p.lat), Z = Math.cos(p.lat) * Math.cos(lon);
        if (Z <= 0) continue;
        const sx = cx + R * X, sy = cy - R * Y, depth = 0.35 + 0.65 * Z, rr = p.r * R * depth;
        const m = clamp((X + 0.12) / 0.24, 0, 1);
        const base = lerpArr(warm, cool, m), hi = lerpArr(warmHi, coolHi, m), col = lerpArr(base, hi, p.seed * 0.5), sh = depth;
        const rgg = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
        rgg.addColorStop(0, rgb([col[0] * sh, col[1] * sh, col[2] * sh], 0.95));
        rgg.addColorStop(1, rgb([col[0] * sh, col[1] * sh, col[2] * sh], 0));
        ctx.fillStyle = rgg; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.fill();
      }
      const seam = ctx.createLinearGradient(cx - R * 0.16, 0, cx + R * 0.16, 0);
      seam.addColorStop(0, "rgba(255,255,255,0)"); seam.addColorStop(0.5, "rgba(220,255,240,0.16)"); seam.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = seam; ctx.fillRect(cx - R * 0.16, cy - R, R * 0.32, R * 2);
      ctx.restore();
      const lg = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
      lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      const hg = ctx.createRadialGradient(cx - R * 0.36, cy - R * 0.36, 0, cx - R * 0.36, cy - R * 0.36, R * 0.95);
      hg.addColorStop(0, "rgba(255,255,255,0.16)"); hg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // shared math helpers exposed for path modules
  Visuals.lerp = lerp;
  Visuals.lerpArr = lerpArr;
  Visuals.rgb = rgb;
  Visuals.clamp = clamp;
  window.Visuals = Visuals;
})();
