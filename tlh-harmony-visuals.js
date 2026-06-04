/* The Last Human — Harmony path visuals. Warm, optimistic, bright.
   Augments Visuals.prototype; reuses _drawRobot/_drawAnimal/_drawFox. */
(function () {
  "use strict";
  const V = window.Visuals;
  function cir(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2); c.fill(); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill(); }
  function lz(s, k, b) { if (!s._h) s._h = {}; if (!s._h[k]) s._h[k] = b(); return s._h[k]; }

  // -- CAMP: bright arrival, long path, craters, greenery --
  V.prototype.feat_camp = function (a) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t, hz = H * 0.5;
    const clouds = lz(this, "cl", () => Array.from({ length: 6 }, () => ({ x: Math.random(), y: Math.random() * 0.32, s: 0.6 + Math.random() * 0.8, sp: 0.004 + Math.random() * 0.006 })));
    const craters = lz(this, "cr", () => [[0.2, 0.74], [0.8, 0.72], [0.34, 0.9], [0.68, 0.9], [0.5, 0.64]]);
    c.save(); c.globalAlpha = a;
    c.globalCompositeOperation = "screen";
    const sg = c.createRadialGradient(W * 0.74, H * 0.18, 0, W * 0.74, H * 0.18, H * 0.65);
    sg.addColorStop(0, "rgba(255,246,205,0.5)"); sg.addColorStop(1, "rgba(255,246,205,0)");
    c.fillStyle = sg; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over";
    for (const cl of clouds) { const x = ((cl.x + t * cl.sp) % 1.2 - 0.1) * W, y = cl.y * H, s = cl.s * 60; c.fillStyle = "rgba(255,255,255,0.9)"; ell(c, x, y, s, s * 0.5, 0); ell(c, x + s * 0.7, y + 6, s * 0.7, s * 0.4, 0); ell(c, x - s * 0.7, y + 6, s * 0.7, s * 0.4, 0); }
    const mg = c.createLinearGradient(0, hz, 0, H); mg.addColorStop(0, "#7fae46"); mg.addColorStop(1, "#3c6a24"); c.fillStyle = mg; c.fillRect(0, hz, W, H - hz);
    c.fillStyle = "#cdb98a"; c.beginPath(); c.moveTo(W * 0.5 - 13, hz); c.lineTo(W * 0.5 + 13, hz); c.lineTo(W * 0.74, H); c.lineTo(W * 0.26, H); c.closePath(); c.fill();
    for (const [cx, cy] of craters) { const x = cx * W, y = cy * H; c.fillStyle = "#33591f"; ell(c, x, y, 48, 18, 0); c.fillStyle = "#6fa043"; ell(c, x, y - 2, 38, 12, 0); }
    this._drawAnimal(W * 0.4, H * 0.8, H * 0.045, t * 3, a, "deer"); this._drawRobot(W * 0.6, H * 0.82, H * 0.05, t * 3, a);
    c.restore();
  };

  // -- INNOVATIVE FOREST: tech tends nature --
  V.prototype.feat_innoforest = function (a) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t;
    const trees = lz(this, "it", () => Array.from({ length: 9 }, (_, i) => ({ x: 0.08 + i * 0.105 + Math.random() * 0.02, sc: 0.7 + Math.random() * 0.7 })));
    const nodes = lz(this, "in", () => Array.from({ length: 14 }, () => ({ x: Math.random(), y: 0.2 + Math.random() * 0.55, ph: Math.random() * 6.28, r: 6 + Math.random() * 8 })));
    c.save(); c.globalAlpha = a;
    c.globalCompositeOperation = "screen"; const sg = c.createRadialGradient(W * 0.5, H * 0.18, 0, W * 0.5, H * 0.45, H * 0.85); sg.addColorStop(0, "rgba(190,245,160,0.22)"); sg.addColorStop(1, "rgba(190,245,160,0)"); c.fillStyle = sg; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over";
    for (const tr of trees) { const x = tr.x * W, baseY = H * 1.05, topY = H * (0.5 - tr.sc * 0.28), tw = 30 * tr.sc; c.fillStyle = "#234a22"; c.beginPath(); c.moveTo(x - tw * 0.5, baseY); c.lineTo(x - tw * 0.16, topY); c.lineTo(x + tw * 0.16, topY); c.lineTo(x + tw * 0.5, baseY); c.closePath(); c.fill(); c.fillStyle = "#2c5e28"; for (let k = 0; k < 6; k++) cir(c, x + (Math.random() - 0.5) * 120 * tr.sc, topY + (Math.random() - 0.3) * 80 * tr.sc, 40 * tr.sc * (0.5 + Math.random() * 0.3)); }
    c.globalCompositeOperation = "screen";
    for (const n of nodes) { const x = n.x * W, y = n.y * H, pulse = 0.5 + 0.5 * Math.sin(t * 2 + n.ph); c.strokeStyle = `rgba(120,230,220,${0.25 * pulse})`; c.lineWidth = 1; c.beginPath(); c.arc(x, y, n.r + pulse * 4, 0, Math.PI * 2); c.stroke(); const g = c.createRadialGradient(x, y, 0, x, y, n.r * 2); g.addColorStop(0, `rgba(150,255,235,${0.6 * pulse})`); g.addColorStop(1, "rgba(150,255,235,0)"); c.fillStyle = g; c.fillRect(x - n.r * 2, y - n.r * 2, n.r * 4, n.r * 4); c.strokeStyle = "rgba(120,230,220,0.14)"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, Math.min(H, y + 60)); c.stroke(); }
    c.globalCompositeOperation = "source-over";
    const dx = W * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.5))); this._drawRobot(dx, H * 0.5, H * 0.04, t * 3, a);
    c.restore();
  };

  // -- SKY GARDENS: floating gardens, flying pods, towers --
  V.prototype.feat_skygardens = function (a) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t;
    const plats = lz(this, "sg", () => Array.from({ length: 6 }, () => ({ x: Math.random(), y: 0.22 + Math.random() * 0.52, w: 90 + Math.random() * 120, sp: 0.02 + Math.random() * 0.03, ph: Math.random() * 6.28 })));
    const clouds = lz(this, "sc", () => Array.from({ length: 5 }, () => ({ x: Math.random(), y: Math.random() * 0.5, s: 0.7 + Math.random() * 0.9, sp: 0.003 + Math.random() * 0.004 })));
    c.save(); c.globalAlpha = a;
    c.fillStyle = "rgba(180,210,225,0.16)"; for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2), w = 60, h = H * (0.5 + (i % 3) * 0.12); rr(c, x, H - h, w, h, 16); }
    for (const cl of clouds) { const x = ((cl.x + t * cl.sp) % 1.2 - 0.1) * W, y = cl.y * H, s = cl.s * 70; c.fillStyle = "rgba(255,255,255,0.55)"; ell(c, x, y, s, s * 0.45, 0); ell(c, x + s * 0.6, y + 6, s * 0.6, s * 0.34, 0); }
    c.globalCompositeOperation = "screen"; for (let i = 0; i < 4; i++) { const prog = ((t * 0.12 + i * 0.27) % 1), x = prog * W, y = H * (0.22 + i * 0.12); c.fillStyle = "rgba(160,240,255,0.85)"; rr(c, x, y, 18, 6, 3); const g = c.createLinearGradient(x - 44, y, x, y); g.addColorStop(0, "rgba(160,240,255,0)"); g.addColorStop(1, "rgba(160,240,255,0.5)"); c.fillStyle = g; c.fillRect(x - 44, y + 1, 44, 4); } c.globalCompositeOperation = "source-over";
    for (const p of plats) { const x = p.x * W + Math.sin(t * p.sp * 10 + p.ph) * 20, y = p.y * H + Math.sin(t * p.sp * 6 + p.ph) * 10; c.fillStyle = "#6a4a30"; rr(c, x - p.w / 2, y, p.w, 16, 5); c.fillStyle = "#5aa742"; rr(c, x - p.w / 2, y - 8, p.w, 12, 5); c.fillStyle = "#3f7a34"; cir(c, x - p.w * 0.3, y - 14, 12); cir(c, x + p.w * 0.2, y - 16, 14); c.strokeStyle = "rgba(90,150,70,0.6)"; c.lineWidth = 2; for (let v = 0; v < 3; v++) { const vx = x - p.w * 0.3 + v * p.w * 0.3; c.beginPath(); c.moveTo(vx, y + 14); c.lineTo(vx, y + 34 + v * 6); c.stroke(); } }
    c.restore();
  };

  // -- THE GATHERING: celebration that breaks apart (this.quake 0..1) --
  V.prototype.feat_gathering = function (a) {
    const c = this.ctx, W = this.W, H = this.H, t = this.t, q = this.quake || 0;
    const folk = lz(this, "gf", () => Array.from({ length: 9 }, (_, i) => ({ x: 0.16 + i * 0.085, kind: ["rabbit", "deer", "frog", "bird"][i % 4], k: i % 3, ph: Math.random() * 6.28 })));
    const lanterns = lz(this, "gl", () => Array.from({ length: 14 }, () => ({ x: Math.random(), y: 0.2 + Math.random() * 0.4, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.5 })));
    c.save(); c.globalAlpha = a;
    if (q > 0) c.translate((Math.random() - 0.5) * 22 * q, (Math.random() - 0.5) * 22 * q);
    c.globalCompositeOperation = "screen";
    const fg = c.createRadialGradient(W * 0.5, H * 0.78, 0, W * 0.5, H * 0.78, H * 0.5 * (1 - q * 0.6)); fg.addColorStop(0, `rgba(255,180,90,${0.4 * (1 - q)})`); fg.addColorStop(1, "rgba(255,180,90,0)"); c.fillStyle = fg; c.fillRect(0, 0, W, H);
    for (const l of lanterns) { const x = l.x * W, y = (l.y + Math.sin(t * l.sp + l.ph) * 0.02) * H + q * q * H * 0.6, al = (0.5 + 0.5 * Math.sin(t * 2 + l.ph)) * (1 - q); const g = c.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, `rgba(255,200,120,${al})`); g.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = g; c.fillRect(x - 12, y - 12, 24, 24); }
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#1a2418"; c.fillRect(0, H * 0.84, W, H * 0.16);
    for (const f of folk) { const x = f.x * W, bob = Math.sin(t * 4 + f.ph) * (1 - q) * H * 0.01, y = H * 0.82 + q * q * H * 0.5 + bob; c.save(); c.translate(x, y); if (q > 0) c.rotate((Math.random() - 0.5) * q * 0.6); c.translate(-x, -y); if (f.k === 0) this._drawRobot(x, y, H * 0.05, t * 4 + f.ph, a * (1 - q * 0.4)); else this._drawAnimal(x, y, H * 0.045, t * 4 + f.ph, a * (1 - q * 0.4), f.kind); c.restore(); }
    if (q > 0.05) { c.strokeStyle = `rgba(220,255,230,${q})`; c.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const ang = i / 8 * 6.28; let x = W * 0.5, y = H * 0.5; c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 5; s++) { x += Math.cos(ang) * 40 * q + (Math.random() - 0.5) * 30; y += Math.sin(ang) * 40 * q + (Math.random() - 0.5) * 30; c.lineTo(x, y); } c.stroke(); } }
    c.restore();
  };

  window.HARMONY_PRESETS = {
    harmony_camp:       { bgTop: [128, 196, 236], bgBot: [150, 180, 96], mote: [245, 240, 190], moteCount: 28, fog: [200, 220, 150], fogA: 0.07, stars: 0.0, feature: "camp" },
    harmony_cards:      { bgTop: [110, 172, 210], bgBot: [124, 152, 84], mote: [240, 235, 180], moteCount: 24, fog: [180, 205, 140], fogA: 0.07, stars: 0.0, feature: "camp" },
    harmony_meadow:     { bgTop: [128, 196, 236], bgBot: [150, 180, 96], mote: [245, 240, 190], moteCount: 28, fog: [200, 220, 150], fogA: 0.07, stars: 0.0, feature: "camp" },
    harmony_innoforest: { bgTop: [40, 92, 70], bgBot: [10, 30, 18], mote: [175, 240, 165], moteCount: 44, fog: [60, 140, 100], fogA: 0.09, stars: 0.1, feature: "innoforest" },
    harmony_skygardens: { bgTop: [150, 200, 232], bgBot: [96, 156, 176], mote: [215, 240, 230], moteCount: 32, fog: [150, 200, 210], fogA: 0.07, stars: 0.15, feature: "skygardens" },
    harmony_gathering:  { bgTop: [44, 32, 40], bgBot: [12, 10, 14], mote: [255, 200, 130], moteCount: 38, fog: [120, 70, 50], fogA: 0.10, stars: 0.5, feature: "gathering" },
    harmony_choice:     { bgTop: [10, 14, 18], bgBot: [2, 3, 5], mote: [120, 140, 150], moteCount: 14, fog: [30, 40, 50], fogA: 0.05, stars: 0.3, feature: null }
  };
})();
