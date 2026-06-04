/* The Last Human — Illusion path visuals.
   Augments Visuals.prototype with feat_<scene> renderers and the cartoon
   characters (fox, robots, animals). Registers its presets onto the core. */
(function () {
  "use strict";
  const V = window.Visuals;
  const rgb = V.rgb, clamp = V.clamp, lerpArr = V.lerpArr;

  // ---- tiny shape helpers ----
  function cir(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2); c.fill(); }
  function tri(c, ax, ay, bx, by, dx, dy) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(dx, dy); c.closePath(); c.fill(); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill(); }

  // ===================== CHARACTERS =====================
  V.prototype._drawFox = function (x, y, s, dir, alpha, phase) {
    const c = this.ctx;
    c.save(); c.globalAlpha = alpha; c.translate(x, y); c.scale(dir, 1);
    const o = "#e8843c", od = "#cf6a22", w = "#fbeede", dk = "#241608";
    // tail
    c.fillStyle = od; ell(c, -s * 0.92, -s * 0.05, s * 0.5, s * 0.3, -0.45);
    c.fillStyle = w; ell(c, -s * 1.18, -s * 0.12, s * 0.17, s * 0.15, 0);
    // back legs / front legs with walk bob
    const lp = Math.sin(phase) * s * 0.12;
    c.fillStyle = od;
    rr(c, -s * 0.34 + lp, s * 0.18, s * 0.13, s * 0.34, s * 0.05);
    rr(c, s * 0.12 - lp, s * 0.18, s * 0.13, s * 0.34, s * 0.05);
    // body
    c.fillStyle = o; ell(c, -s * 0.12, 0, s * 0.56, s * 0.4, 0);
    // chest
    c.fillStyle = w; ell(c, s * 0.22, s * 0.06, s * 0.18, s * 0.26, 0);
    // head
    c.fillStyle = o; ell(c, s * 0.42, -s * 0.34, s * 0.34, s * 0.3, 0);
    // ears
    c.fillStyle = o; tri(c, s * 0.18, -s * 0.5, s * 0.36, -s * 0.52, s * 0.27, -s * 0.86);
    tri(c, s * 0.5, -s * 0.52, s * 0.68, -s * 0.5, s * 0.62, -s * 0.88);
    c.fillStyle = dk; tri(c, s * 0.25, -s * 0.55, s * 0.33, -s * 0.55, s * 0.29, -s * 0.76);
    tri(c, s * 0.55, -s * 0.55, s * 0.63, -s * 0.55, s * 0.6, -s * 0.78);
    // snout + nose + eye
    c.fillStyle = w; tri(c, s * 0.55, -s * 0.4, s * 0.84, -s * 0.3, s * 0.56, -s * 0.16);
    c.fillStyle = dk; cir(c, s * 0.82, -s * 0.3, s * 0.05);
    cir(c, s * 0.46, -s * 0.4, s * 0.045);
    c.restore();
  };

  V.prototype._drawRobot = function (x, y, s, phase, alpha) {
    const c = this.ctx; const bob = Math.sin(phase) * s * 0.06;
    c.save(); c.globalAlpha = alpha; c.translate(x, y + bob);
    const body = "#7c9aa6", dark = "#52707c", eye = "#7ef0e0";
    // legs
    c.fillStyle = dark; rr(c, -s * 0.34, s * 0.5, s * 0.22, s * 0.4, s * 0.06); rr(c, s * 0.12, s * 0.5, s * 0.22, s * 0.4, s * 0.06);
    // body
    c.fillStyle = body; rr(c, -s * 0.46, -s * 0.1, s * 0.92, s * 0.66, s * 0.14);
    c.fillStyle = dark; rr(c, -s * 0.28, s * 0.05, s * 0.56, s * 0.3, s * 0.06);
    // arms
    c.fillStyle = body; rr(c, -s * 0.62, -s * 0.02, s * 0.16, s * 0.46, s * 0.06); rr(c, s * 0.46, -s * 0.02, s * 0.16, s * 0.46, s * 0.06);
    // head
    c.fillStyle = body; rr(c, -s * 0.32, -s * 0.62, s * 0.64, s * 0.52, s * 0.12);
    // antenna
    c.strokeStyle = dark; c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(0, -s * 0.86); c.stroke();
    c.fillStyle = eye; cir(c, 0, -s * 0.9, s * 0.08);
    // eyes glow
    c.shadowColor = eye; c.shadowBlur = s * 0.5;
    cir(c, -s * 0.13, -s * 0.36, s * 0.08); cir(c, s * 0.13, -s * 0.36, s * 0.08);
    c.restore();
  };

  V.prototype._drawAnimal = function (x, y, s, phase, alpha, kind) {
    const c = this.ctx; const bob = Math.sin(phase) * s * 0.05;
    c.save(); c.globalAlpha = alpha; c.translate(x, y + bob);
    const pal = { rabbit: ["#d9cfc0", "#bdb1a0"], deer: ["#c98a52", "#a86c39"], frog: ["#86b95a", "#6a9c44"], bird: ["#6fb6c9", "#4f93a6"] }[kind] || ["#cbbfae", "#a89c8b"];
    const body = pal[0], dk = pal[1];
    // body
    c.fillStyle = body; ell(c, 0, s * 0.1, s * 0.42, s * 0.36, 0);
    // head
    c.fillStyle = body; cir(c, s * 0.04, -s * 0.34, s * 0.26);
    // ears
    if (kind === "rabbit") { c.fillStyle = body; ell(c, -s * 0.1, -s * 0.7, s * 0.08, s * 0.26, -0.2); ell(c, s * 0.16, -s * 0.7, s * 0.08, s * 0.26, 0.2); }
    else if (kind === "deer") { c.strokeStyle = dk; c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(-s * 0.05, -s * 0.55); c.lineTo(-s * 0.18, -s * 0.85); c.moveTo(s * 0.14, -s * 0.55); c.lineTo(s * 0.28, -s * 0.85); c.stroke(); c.fillStyle = body; tri(c, -s * 0.18, -s * 0.5, -s * 0.02, -s * 0.5, -s * 0.1, -s * 0.74); }
    else { c.fillStyle = body; cir(c, -s * 0.14, -s * 0.56, s * 0.1); cir(c, s * 0.22, -s * 0.56, s * 0.1); }
    // eye
    c.fillStyle = "#1c150e"; cir(c, s * 0.12, -s * 0.36, s * 0.05);
    c.restore();
  };

  // ===================== SCENE RENDERERS =====================
  function lazy(self, key, build) { if (!self._ill) self._ill = {}; if (!self._ill[key]) self._ill[key] = build(); return self._ill[key]; }

  // -- FOREST (with fox) --
  V.prototype.feat_forest = function (alpha) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t;
    const trees = lazy(this, "trees", () => {
      const a = [];
      for (let i = 0; i < 14; i++) {
        const side = i % 2 ? 1 : -1;
        const edge = side < 0 ? Math.random() * 0.26 : 1 - Math.random() * 0.26;
        const layer = Math.random();
        a.push({ x: edge, layer, sc: 0.7 + layer * 0.9, sway: Math.random() * 6.28 });
      }
      return a.sort((p, q) => p.layer - q.layer);
    });
    const flies = lazy(this, "flies", () => Array.from({ length: 26 }, () => ({ x: Math.random(), y: 0.3 + Math.random() * 0.6, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.8, r: 1 + Math.random() * 2 })));

    c.save(); c.globalAlpha = alpha;
    // central light corridor
    const cg = c.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.5, H * 0.85);
    cg.addColorStop(0, "rgba(140,230,190,0.30)"); cg.addColorStop(0.5, "rgba(60,150,130,0.10)"); cg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = cg; c.fillRect(0, 0, W, H);
    // god rays
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 6; i++) {
      const bx = W * (0.32 + i * 0.075) + Math.sin(t * 0.2 + i) * 18;
      const grd = c.createLinearGradient(bx, 0, bx + 60, H);
      grd.addColorStop(0, "rgba(160,240,200,0.10)"); grd.addColorStop(1, "rgba(160,240,200,0)");
      c.fillStyle = grd; c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx + 30, 0); c.lineTo(bx + 130, H); c.lineTo(bx + 80, H); c.closePath(); c.fill();
    }
    c.globalCompositeOperation = "source-over";
    // trees (framing silhouettes)
    for (const tr of trees) {
      const depth = 0.3 + tr.layer * 0.7;
      const col = lerpArr([4, 22, 18], [14, 46, 38], 1 - tr.layer);
      const x = tr.x * W + Math.sin(t * 0.3 + tr.sway) * 6 * tr.layer;
      const baseY = H * 1.02, topY = H * (0.52 - tr.sc * 0.32), trunkW = 26 * tr.sc;
      c.fillStyle = rgb(col, 1);
      c.beginPath(); c.moveTo(x - trunkW * 0.5, baseY); c.lineTo(x - trunkW * 0.18, topY); c.lineTo(x + trunkW * 0.18, topY); c.lineTo(x + trunkW * 0.5, baseY); c.closePath(); c.fill();
      // canopy
      const cw = 130 * tr.sc;
      for (let k = 0; k < 6; k++) cir(c, x + (Math.random() - 0.5) * cw * 0.7, topY - 20 + (Math.random() - 0.5) * cw * 0.5, cw * (0.3 + Math.random() * 0.25));
    }
    // top canopy band
    const tcg = c.createLinearGradient(0, 0, 0, H * 0.34);
    tcg.addColorStop(0, "rgba(5,20,16,0.95)"); tcg.addColorStop(1, "rgba(5,20,16,0)");
    c.fillStyle = tcg; c.fillRect(0, 0, W, H * 0.34);
    // fireflies
    c.globalCompositeOperation = "screen";
    for (const f of flies) {
      const x = (f.x + Math.sin(t * f.sp + f.ph) * 0.03) * W, y = (f.y + Math.cos(t * f.sp * 0.7 + f.ph) * 0.02) * H;
      const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + f.ph));
      const g = c.createRadialGradient(x, y, 0, x, y, f.r * 4);
      g.addColorStop(0, `rgba(180,255,200,${a})`); g.addColorStop(1, "rgba(180,255,200,0)");
      c.fillStyle = g; c.fillRect(x - f.r * 4, y - f.r * 4, f.r * 8, f.r * 8);
    }
    c.globalCompositeOperation = "source-over";
    c.restore();

    // ground mist
    const mg = c.createLinearGradient(0, H * 0.7, 0, H);
    mg.addColorStop(0, "rgba(80,160,140,0)"); mg.addColorStop(1, `rgba(80,170,150,${0.16 * alpha})`);
    c.fillStyle = mg; c.fillRect(0, H * 0.7, W, H * 0.3);

    // FOX
    const fx = this.fox;
    if (fx.state !== "hidden") {
      let X, Y = H * 0.7, s = H * 0.08, dir = 1, a = alpha, ph = t * 9;
      if (fx.state === "enter") { const p = clamp(fx.t / 2.2, 0, 1); X = W * (-0.12 + 0.62 * p); if (p >= 1) this.setFox("idle"); }
      else if (fx.state === "idle") { X = W * 0.5; ph = t * 2.5; }
      else if (fx.state === "lead") { const p = clamp(fx.t / 2.6, 0, 1); X = W * (0.5 - 0.02 * p); Y = H * (0.7 - 0.18 * p); s = H * 0.08 * (1 - 0.72 * p); a = alpha * (1 - p * p); if (p >= 1) this.setFox("gone"); }
      else { a = 0; }
      if (a > 0.01) { Y += Math.abs(Math.sin(ph)) * s * 0.05; this._drawFox(X, Y, s, dir, a, ph); }
    }
  };

  // -- RESTORATION VALLEY --
  V.prototype.feat_restoration = function (alpha) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t;
    const crew = lazy(this, "rest", () => Array.from({ length: 9 }, (_, i) => ({ x: 0.12 + Math.random() * 0.76, k: i % 3, kind: ["rabbit", "deer", "frog", "bird"][i % 4], ph: Math.random() * 6.28 })));
    c.save(); c.globalAlpha = alpha;
    // sun glow
    const sg = c.createRadialGradient(W * 0.7, H * 0.22, 0, W * 0.7, H * 0.22, H * 0.7);
    sg.addColorStop(0, "rgba(255,225,150,0.34)"); sg.addColorStop(1, "rgba(255,225,150,0)");
    c.globalCompositeOperation = "screen"; c.fillStyle = sg; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over";
    // rolling hills
    const hills = [["#3a5a24", 0.66, 22, 0.4], ["#2c4a1c", 0.74, 30, 0.7], ["#1e3614", 0.84, 26, 1.1]];
    for (const [col, base, amp, freq] of hills) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) c.lineTo(x, H * base + Math.sin(x * 0.004 * freq + freq) * amp);
      c.lineTo(W, H); c.closePath(); c.fill();
    }
    // rising growth sparkles
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 30; i++) {
      const x = ((i * 137.5 + t * 14) % W), y = H * (0.95 - ((t * 0.1 + i * 0.13) % 1) * 0.5);
      const a = 0.5 * (1 - ((t * 0.1 + i * 0.13) % 1));
      const g = c.createRadialGradient(x, y, 0, x, y, 6); g.addColorStop(0, `rgba(190,240,140,${a})`); g.addColorStop(1, "rgba(190,240,140,0)");
      c.fillStyle = g; c.fillRect(x - 6, y - 6, 12, 12);
    }
    c.globalCompositeOperation = "source-over";
    // little planted shoots
    for (let i = 0; i < 18; i++) { const x = (i * 73 % W), y = H * (0.78 + (i % 3) * 0.05); c.strokeStyle = "#7cc24a"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 10 - (i % 4) * 3); c.stroke(); c.fillStyle = "#9ad85f"; cir(c, x, y - 12 - (i % 4) * 3, 3); }
    // crew: robots + animals at work
    for (const m of crew) {
      const x = m.x * W, y = H * (0.7 + (m.x * 1.7 % 0.14));
      if (m.k === 0) this._drawRobot(x, y, H * 0.05, t * 3 + m.ph, alpha);
      else this._drawAnimal(x, y, H * 0.045, t * 3 + m.ph, alpha, m.kind);
    }
    // guiding fox, excited
    this._drawFox(W * 0.5, H * 0.74, H * 0.06, 1, alpha, t * 6);
    c.restore();
  };

  // -- TREEHOUSE CIVILIZATION --
  V.prototype.feat_treehouse = function (alpha) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t;
    c.save(); c.globalAlpha = alpha;
    const cx = W * 0.5, baseY = H * 1.05;
    // big trunk
    c.fillStyle = "#1d2e2a"; c.beginPath(); c.moveTo(cx - 70, baseY); c.lineTo(cx - 26, H * 0.2); c.lineTo(cx + 26, H * 0.2); c.lineTo(cx + 70, baseY); c.closePath(); c.fill();
    // roots
    c.beginPath(); c.moveTo(cx - 70, baseY); c.quadraticCurveTo(cx - 150, H * 0.9, cx - 200, H); c.lineTo(cx + 200, H); c.quadraticCurveTo(cx + 150, H * 0.9, cx + 70, baseY); c.fill();
    // canopy
    c.fillStyle = "#16322b"; for (let k = 0; k < 14; k++) cir(c, cx + (Math.random() - 0.5) * W * 0.5, H * (0.16 + Math.random() * 0.18), 60 + Math.random() * 70);
    // side trees
    c.fillStyle = "#16241f"; for (const sx of [W * 0.16, W * 0.85]) { c.fillRect(sx - 16, H * 0.42, 32, H * 0.6); for (let k = 0; k < 5; k++) cir(c, sx + (Math.random() - 0.5) * 120, H * (0.36 + Math.random() * 0.12), 50 + Math.random() * 40); }
    // platforms + windows
    const plats = [[cx, 0.4, 150], [cx - 120, 0.56, 120], [cx + 130, 0.58, 120], [cx, 0.7, 180]];
    c.fillStyle = "#3a2c1e";
    for (const [px, py, pw] of plats) { rr(c, px - pw / 2, H * py, pw, 18, 5); rr(c, px - pw * 0.32, H * py - 36, pw * 0.64, 40, 6); }
    // windows glow
    c.globalCompositeOperation = "screen";
    for (const [px, py, pw] of plats) { for (let w = 0; w < 3; w++) { const wx = px - pw * 0.2 + w * pw * 0.2, wy = H * py - 22; const a = 0.6 + 0.4 * Math.sin(t * 2 + wx); const g = c.createRadialGradient(wx, wy, 0, wx, wy, 16); g.addColorStop(0, `rgba(255,200,110,${a})`); g.addColorStop(1, "rgba(255,200,110,0)"); c.fillStyle = g; c.fillRect(wx - 16, wy - 16, 32, 32); } }
    c.globalCompositeOperation = "source-over";
    // rope bridges
    c.strokeStyle = "#5a4630"; c.lineWidth = 2.5;
    const bridge = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 26, x2, y2); c.stroke(); };
    bridge(cx - 120, H * 0.56, cx, H * 0.4); bridge(cx + 130, H * 0.58, cx, H * 0.4); bridge(cx - 120, H * 0.56, cx, H * 0.7); bridge(cx + 130, H * 0.58, cx, H * 0.7);
    // figures crossing
    const walk = (this.t * 0.12) % 1;
    this._drawAnimal(cx - 120 + walk * 120, H * 0.55 - Math.sin(walk * Math.PI) * 18, H * 0.04, t * 3, alpha, "rabbit");
    this._drawRobot(cx + 130 - walk * 130, H * 0.57 - Math.sin(walk * Math.PI) * 18, H * 0.045, t * 3, alpha);
    // fireflies
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 18; i++) { const x = (i / 18) * W + Math.sin(t + i) * 20, y = H * (0.3 + (i % 5) * 0.1) + Math.cos(t * 0.8 + i) * 14; const a = 0.4 + 0.5 * Math.sin(t * 2 + i); const g = c.createRadialGradient(x, y, 0, x, y, 7); g.addColorStop(0, `rgba(180,255,210,${a})`); g.addColorStop(1, "rgba(180,255,210,0)"); c.fillStyle = g; c.fillRect(x - 7, y - 7, 14, 14); }
    c.globalCompositeOperation = "source-over";
    c.restore();
  };

  // -- MEMORY LAKE (the destruction) --
  V.prototype.feat_memlake = function (alpha) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t, hz = H * 0.58;
    c.save(); c.globalAlpha = alpha;
    // sickly sky haze
    const sk = c.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, "rgba(70,66,54,0.5)"); sk.addColorStop(1, "rgba(96,92,72,0.2)"); c.fillStyle = sk; c.fillRect(0, 0, W, hz);
    // dim, dirty sun
    c.globalCompositeOperation = "screen";
    const su = c.createRadialGradient(W * 0.5, hz * 0.62, 0, W * 0.5, hz * 0.62, hz * 0.9);
    su.addColorStop(0, "rgba(190,150,90,0.22)"); su.addColorStop(1, "rgba(190,150,90,0)");
    c.fillStyle = su; c.fillRect(0, 0, W, hz); c.globalCompositeOperation = "source-over";
    // smokestacks on horizon
    const stacks = [0.18, 0.3, 0.4, 0.66, 0.8];
    const drawStacks = (yBase, flip) => {
      c.save(); if (flip) { c.translate(0, hz * 2); c.scale(1, -1); c.globalAlpha = alpha * 0.4; }
      c.fillStyle = "#46443a";
      for (const sx of stacks) { const x = sx * W, h = 60 + (sx * 97 % 50); c.fillRect(x, hz - h, 26, h); c.fillRect(x + 34, hz - h * 0.7, 18, h * 0.7); }
      c.restore();
    };
    drawStacks(hz, false);
    // smog plumes rising
    c.globalCompositeOperation = "screen";
    for (const sx of stacks) { for (let k = 0; k < 4; k++) { const prog = ((t * 0.08 + k * 0.25 + sx) % 1); const x = sx * W + 13 + Math.sin(prog * 4 + sx) * 30, y = hz - 60 - prog * 160, r = 24 + prog * 50, a = 0.18 * (1 - prog); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(110,108,96,${a})`); g.addColorStop(1, "rgba(110,108,96,0)"); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } }
    c.globalCompositeOperation = "source-over";
    // reflection of stacks in lake (wobbled)
    drawStacks(hz, true);
    // water
    const wt = c.createLinearGradient(0, hz, 0, H); wt.addColorStop(0, "rgba(28,34,30,0.85)"); wt.addColorStop(1, "rgba(10,14,12,1)"); c.fillStyle = wt; c.fillRect(0, hz, W, H - hz);
    // ripples
    c.strokeStyle = "rgba(120,140,120,0.12)"; c.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const y = hz + 14 + i * (H - hz) / 8; c.beginPath(); for (let x = 0; x <= W; x += 14) c.lineTo(x, y + Math.sin(x * 0.02 + t * 1.5 + i) * 2); c.stroke(); }
    // falling ash
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 40; i++) { const x = (i * 53 + Math.sin(t + i) * 20) % W, y = ((t * 22 + i * 40) % (hz)) ; c.fillStyle = "rgba(150,148,140,0.35)"; c.fillRect(x, y, 1.6, 1.6); }
    c.globalCompositeOperation = "source-over";
    c.restore();
  };

  // -- VOID TREE (the last tree) --
  V.prototype.feat_voidtree = function (alpha) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t, cx = W * 0.5;
    const stickers = lazy(this, "stk", () => Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random() * 0.5, r: 2 + Math.random() * 4, ph: Math.random() * 6.28, type: Math.random() < 0.4 ? 1 : 0 })));
    c.save(); c.globalAlpha = alpha;
    // aurora bands
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 3; i++) { const y = H * (0.22 + i * 0.09) + Math.sin(t * 0.4 + i) * 20; const g = c.createLinearGradient(0, y - 50, 0, y + 50); const hue = [["120,230,180"], ["90,200,230"], ["160,230,140"]][i][0]; g.addColorStop(0, `rgba(${hue},0)`); g.addColorStop(0.5, `rgba(${hue},0.16)`); g.addColorStop(1, `rgba(${hue},0)`); c.fillStyle = g; c.fillRect(0, y - 50, W, 100); }
    c.globalCompositeOperation = "source-over";
    // the colossal tree (glowing rim)
    const baseY = H * 1.02, topY = H * 0.06;
    c.save(); c.shadowColor = "rgba(120,240,190,0.5)"; c.shadowBlur = 40;
    c.fillStyle = "#0c241f"; c.beginPath(); c.moveTo(cx - 90, baseY); c.quadraticCurveTo(cx - 34, H * 0.5, cx - 18, topY); c.lineTo(cx + 18, topY); c.quadraticCurveTo(cx + 34, H * 0.5, cx + 90, baseY); c.closePath(); c.fill();
    // branches
    c.strokeStyle = "#0c241f"; c.lineWidth = 14;
    const br = (y, dir, len) => { c.beginPath(); c.moveTo(cx, H * y); c.quadraticCurveTo(cx + dir * len * 0.5, H * y - 30, cx + dir * len, H * (y - 0.12)); c.stroke(); };
    br(0.42, -1, 180); br(0.4, 1, 200); br(0.3, -1, 150); br(0.28, 1, 160); br(0.55, -1, 150); br(0.53, 1, 170);
    // canopy
    c.fillStyle = "#103029"; for (let k = 0; k < 18; k++) cir(c, cx + (Math.random() - 0.5) * W * 0.6, H * (0.18 + Math.random() * 0.16), 50 + Math.random() * 60);
    c.restore();
    // rim light up the trunk
    c.globalCompositeOperation = "screen";
    const rg = c.createLinearGradient(cx - 90, 0, cx + 90, 0); rg.addColorStop(0, "rgba(120,240,190,0)"); rg.addColorStop(0.5, "rgba(150,255,210,0.10)"); rg.addColorStop(1, "rgba(120,240,190,0)"); c.fillStyle = rg; c.fillRect(cx - 90, topY, 180, baseY - topY);
    // light particles rising along trunk
    for (let i = 0; i < 24; i++) { const prog = ((t * 0.12 + i * 0.08) % 1); const x = cx + Math.sin(prog * 6 + i) * 40 * (1 - prog * 0.5); const y = baseY - prog * (baseY - topY); const a = 0.6 * (1 - prog); const g = c.createRadialGradient(x, y, 0, x, y, 5); g.addColorStop(0, `rgba(170,255,220,${a})`); g.addColorStop(1, "rgba(170,255,220,0)"); c.fillStyle = g; c.fillRect(x - 5, y - 5, 10, 10); }
    // stickers in the sky
    for (const s of stickers) { const x = s.x * W, y = s.y * H, a = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 + s.ph)); c.fillStyle = `rgba(200,255,230,${a})`; if (s.type) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-s.r, -s.r * 0.25, s.r * 2, s.r * 0.5); c.fillRect(-s.r * 0.25, -s.r, s.r * 0.5, s.r * 2); c.restore(); } else cir(c, x, y, s.r); }
    c.globalCompositeOperation = "source-over";
    // figures praying at the base, in an arc
    for (let i = 0; i < 7; i++) { const off = (i - 3); const x = cx + off * 78; const y = H * 0.9 + Math.abs(off) * 6; const s = H * 0.045; if (i % 2) this._drawRobot(x, y, s, t * 1.2 + i, alpha); else this._drawAnimal(x, y, s, t * 1.2 + i, alpha, ["deer", "rabbit", "frog", "bird"][i % 4]); // offering light
      c.globalCompositeOperation = "screen"; const og = c.createRadialGradient(x, y - s * 0.6, 0, x, y - s * 0.6, 14); og.addColorStop(0, "rgba(180,255,220,0.5)"); og.addColorStop(1, "rgba(180,255,220,0)"); c.fillStyle = og; c.fillRect(x - 14, y - s * 0.6 - 14, 28, 28); c.globalCompositeOperation = "source-over"; }
    c.restore();
  };

  // -- THE ROOM (building a human) --
  V.prototype.feat_room = function (alpha) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t, cx = W * 0.5;
    c.save(); c.globalAlpha = alpha;
    // floor + back wall division
    c.fillStyle = "rgba(8,9,14,0.7)"; c.fillRect(0, H * 0.66, W, H * 0.34);
    // overhead light strings (will dim — alpha already drives it)
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 7; i++) { const x = cx + (i - 3) * 60; c.strokeStyle = `rgba(255,220,150,${0.25 * alpha})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 0); c.lineTo(cx + (i - 3) * 26, H * 0.4); c.stroke(); const g = c.createRadialGradient(x, H * 0.04, 0, x, H * 0.04, 30); g.addColorStop(0, `rgba(255,225,160,${0.5})`); g.addColorStop(1, "rgba(255,225,160,0)"); c.fillStyle = g; c.fillRect(x - 30, H * 0.04 - 30, 60, 60); }
    c.globalCompositeOperation = "source-over";
    // workbench / table
    c.fillStyle = "#2a2b33"; rr(c, cx - 200, H * 0.62, 400, 24, 6); c.fillRect(cx - 180, H * 0.64, 16, H * 0.22); c.fillRect(cx + 164, H * 0.64, 16, H * 0.22);
    // the human being assembled — silhouette filled with soft light
    c.save();
    c.shadowColor = "rgba(180,220,255,0.6)"; c.shadowBlur = 30;
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.5);
    c.fillStyle = `rgba(170,210,255,${0.5 + 0.3 * pulse})`;
    const hx = cx, hy = H * 0.6;
    cir(c, hx, hy - 70, 22);                       // head
    rr(c, hx - 26, hy - 46, 52, 70, 14);           // torso
    rr(c, hx - 44, hy - 40, 18, 60, 8); rr(c, hx + 26, hy - 40, 18, 60, 8); // arms
    rr(c, hx - 22, hy + 18, 18, 8, 4); rr(c, hx + 4, hy + 18, 18, 8, 4);     // legs (lying)
    c.restore();
    // assembly light strands connecting down to the figure
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 10; i++) { const a = 0.3 + 0.3 * Math.sin(t * 3 + i); c.strokeStyle = `rgba(150,200,255,${a * alpha})`; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + (i - 5) * 30, H * 0.4); c.lineTo(hx + (Math.random() - 0.5) * 30, hy - 40 + Math.random() * 60); c.stroke(); }
    c.globalCompositeOperation = "source-over";
    // builders around the table
    this._drawRobot(cx - 230, H * 0.78, H * 0.06, t * 3, alpha);
    this._drawRobot(cx + 230, H * 0.78, H * 0.06, t * 3 + 1, alpha);
    this._drawAnimal(cx - 120, H * 0.84, H * 0.05, t * 3 + 2, alpha, "deer");
    this._drawAnimal(cx + 130, H * 0.84, H * 0.05, t * 3 + 0.5, alpha, "rabbit");
    this._drawFox(cx + 60, H * 0.85, H * 0.055, -1, alpha, t * 2);
    c.restore();
  };

  // ===================== PRESETS =====================
  window.ILLUSION_PRESETS = {
    illusion_forest:      { bgTop: [8, 34, 30], bgBot: [2, 10, 10], mote: [120, 215, 175], moteCount: 40, fog: [30, 95, 82], fogA: 0.10, stars: 0.12, feature: "forest" },
    illusion_cards:       { bgTop: [6, 26, 24], bgBot: [1, 8, 8],   mote: [120, 210, 170], moteCount: 36, fog: [25, 82, 72], fogA: 0.12, stars: 0.1, feature: "forest" },
    illusion_restoration: { bgTop: [40, 56, 26], bgBot: [10, 22, 10], mote: [220, 210, 120], moteCount: 50, fog: [120, 140, 60], fogA: 0.08, stars: 0.0, feature: "restoration" },
    illusion_treehouse:   { bgTop: [8, 30, 40], bgBot: [2, 9, 15],  mote: [245, 205, 125], moteCount: 30, fog: [40, 95, 115], fogA: 0.08, stars: 0.5, feature: "treehouse" },
    illusion_memlake:     { bgTop: [30, 32, 28], bgBot: [6, 8, 8],  mote: [130, 130, 118], moteCount: 16, fog: [80, 82, 64], fogA: 0.12, stars: 0.04, feature: "memlake" },
    illusion_voidtree:    { bgTop: [6, 16, 30], bgBot: [1, 4, 10],  mote: [160, 225, 215], moteCount: 44, fog: [30, 84, 112], fogA: 0.09, stars: 1.0, feature: "voidtree" },
    illusion_room:        { bgTop: [14, 16, 22], bgBot: [2, 3, 6],  mote: [205, 190, 160], moteCount: 24, fog: [50, 56, 84], fogA: 0.07, stars: 0.0, feature: "room" },
    illusion_dark:        { bgTop: [2, 3, 5], bgBot: [0, 0, 0],     mote: [40, 40, 50], moteCount: 6, fog: [10, 10, 20], fogA: 0.03, stars: 0.1, feature: null }
  };
})();
