/* The Last Human — Harmony path: scene definitions (templates + flow). */
(function () {
  "use strict";

  const cards = [
    { go: "harmony_meadow",     n: "01", t: "Crater Meadow", s: "five craters, endless green, a long road home", cls: "warm" },
    { go: "harmony_innoforest", n: "02", t: "Innovative Forest", s: "technology that tends, never takes", cls: "warm" },
    { go: "harmony_skygardens", n: "03", t: "Sky Gardens", s: "gardens afloat, cities that breathe", cls: "cool" }
  ];

  function cardsHtml() {
    return cards.map(c => `
      <div class="memcard" data-go="${c.go}">
        <div class="mn glow-${c.cls}">${c.n}</div>
        <div class="mt glow-${c.cls}">${c.t}</div>
        <div class="ms">${c.s}</div>
      </div>`).join("");
  }

  function memScene(go, kicker, title, caption, cls) {
    return {
      group: "HARMONY",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">${kicker}</div>
          <div class="title glow-${cls}" style="font-size:clamp(28px,4.6vw,56px)">${title}</div>
        </div>
        <div class="scene-caption">${caption}</div>`,
      enter: (el, api) => { api.state.visited.add(go); api.setHint("click to return to the horizons"); },
      advance: (api) => api.goTo("harmony_cards")
    };
  }

  window.TLH_HARMONY = {
    // entry — the camp / arrival
    harmony_camp: {
      group: "HARMONY",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">harmony · the arrival</div>
          <div class="title glow-warm" style="font-size:clamp(30px,5vw,60px)">THE&nbsp;CAMP</div>
        </div>
        <div class="scene-caption">no engines, no smoke — only a long bright road, and somewhere to belong</div>`,
      enter: (el, api) => { api.setHint("click to walk the road"); },
      advance: (api) => api.goTo("harmony_cards")
    },

    // hub — three horizons
    harmony_cards: {
      group: "HARMONY",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">the world they healed</div>
          <div class="title glow-warm" style="font-size:clamp(26px,4vw,46px)">THREE&nbsp;HORIZONS</div>
        </div>
        <div class="memcards three">${cardsHtml()}</div>
        <div class="deeper" id="deeper">↓ join the gathering</div>`,
      enter: (el, api) => {
        el.querySelectorAll(".memcard").forEach(card => {
          const go = card.dataset.go;
          if (api.state.visited.has(go)) card.classList.add("visited");
          card.addEventListener("mouseenter", () => api.audio.fx("chirp"));
          card.addEventListener("click", () => api.goTo(go));
        });
        if (api.state.visited.size >= cards.length) { el.querySelector("#deeper").classList.add("show"); api.setHint("click to go deeper"); }
        else api.setHint("choose a horizon");
      },
      advance: (api) => { if (api.state.visited.size >= cards.length) api.goTo("harmony_gathering"); }
    },

    harmony_meadow:     memScene("harmony_meadow", "horizon · 01", "CRATER MEADOW", "five soft craters, a road through endless green · the world breathes easy", "warm"),
    harmony_innoforest: memScene("harmony_innoforest", "horizon · 02", "INNOVATIVE FOREST", "machines that water, shelter, mend — technology that tends and never takes", "warm"),
    harmony_skygardens: memScene("harmony_skygardens", "horizon · 03", "SKY GARDENS", "gardens afloat between the clouds, quiet vessels, cities that breathe", "cool"),

    // climax — the gathering breaks apart
    harmony_gathering: {
      group: "HARMONY",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">harmony · the gathering</div>
          <div class="title glow-warm" style="font-size:clamp(28px,4.6vw,56px)">THE&nbsp;GATHERING</div>
        </div>
        <div class="scene-caption">families, beasts and machines together under the lanterns — and then the ground begins to shake</div>`,
      enter: (el, api) => { api.viz.quake = 0; api.setHint("click when you are ready"); },
      advance: (api) => {
        const el = api.el;
        if (!el || el._busy) return;
        el._busy = true;
        api.hideHint();
        api.audio.fx("crash");
        let q = 0;
        el._iv = setInterval(() => { q += 0.06; api.viz.quake = Math.min(1, q); if (Math.random() < 0.5) api.audio.fx("crash"); if (q >= 1) clearInterval(el._iv); }, 90);
        el._to = setTimeout(() => { api.viz.quake = 0; api.goTo("harmony_choice"); }, 2700);
      },
      leave: (el) => { clearInterval(el._iv); clearTimeout(el._to); }
    },

    // the final question — auto-returns home after 10s
    harmony_choice: {
      group: "HARMONY",
      tmpl: () => `
        <div class="pane">
          <div class="kicker">the dream collapses</div>
          <div class="title glow-cool" style="font-size:clamp(30px,5vw,62px);line-height:1.1">WHICH&nbsp;WORLD<br/>WILL&nbsp;YOU&nbsp;CHOOSE?</div>
          <div class="qworlds"><span class="glow-warm">HARMONY</span><span class="qsep">/</span><span class="glow-cool">ILLUSION</span></div>
        </div>`,
      enter: (el, api) => { api.hideHint(); el._t = setTimeout(() => { api.state.visited.clear(); api.goTo("earth"); }, 10000); },
      leave: (el) => clearTimeout(el._t),
      advance: () => {}
    }
  };
})();
