/* The Last Human — Illusion path: scene definitions (templates + flow).
   Consumed by the controller, which merges these into its SCENE registry
   and passes an `api` { goTo, glitch, fadeTo, audio, viz, state, setHint,
   hideHint, el, resetStage } to each enter/advance hook. */
(function () {
  "use strict";

  const cards = [
    { go: "illusion_restoration", n: "01", t: "Restoration Valley", s: "machine & beast, planting the world anew", cls: "warm" },
    { go: "illusion_treehouse",   n: "02", t: "Treehouse Civilization", s: "a city grown, not built", cls: "cool" },
    { go: "illusion_memlake",     n: "03", t: "Memory Lake", s: "the water remembers what we did", cls: "dim" },
    { go: "illusion_voidtree",    n: "04", t: "Sky Forest", s: "the last tree we could not fell", cls: "cool" }
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
      group: "ILLUSION",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">${kicker}</div>
          <div class="title glow-${cls}" style="font-size:clamp(28px,4.6vw,56px)">${title}</div>
        </div>
        <div class="scene-caption">${caption}</div>`,
      enter: (el, api) => { api.state.visited.add(go); api.setHint("click to return to the memories"); },
      advance: (api) => api.goTo("illusion_cards")
    };
  }

  window.TLH_ILLUSION = {
    // 1 — the forest + the fox
    illusion_forest: {
      group: "ILLUSION",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">illusion · the threshold</div>
          <div class="title glow-cool" style="font-size:clamp(30px,5vw,60px)">THE&nbsp;FOREST</div>
        </div>
        <div class="fox-tip" id="foxtip">↳ follow</div>`,
      enter: (el, api) => {
        api.viz.setFox("hidden");
        el._t1 = setTimeout(() => api.viz.setFox("enter"), 1400);
        el._watch = setInterval(() => {
          if (api.viz.fox.state === "idle") {
            const tip = el.querySelector("#foxtip");
            if (tip && !tip.classList.contains("show")) { tip.classList.add("show"); api.setHint("click to follow the fox"); }
          }
        }, 250);
      },
      leave: (el) => { clearTimeout(el._t1); clearInterval(el._watch); },
      advance: (api) => {
        const el = api.el;
        if (!el || el._busy) return;
        if (api.viz.fox.state !== "idle") return; // wait for the fox to arrive
        el._busy = true;
        api.viz.setFox("lead");
        api.audio.fx("whoosh");
        api.hideHint();
        const tip = el.querySelector("#foxtip"); if (tip) tip.classList.remove("show");
        setTimeout(() => api.goTo("illusion_cards"), 2500);
      }
    },

    // 2 — the four memories (hub)
    illusion_cards: {
      group: "ILLUSION",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">the illusion remembers</div>
          <div class="title glow-cool" style="font-size:clamp(26px,4vw,46px)">FOUR&nbsp;MEMORIES</div>
        </div>
        <div class="memcards">${cardsHtml()}</div>
        <div class="deeper" id="deeper">↓ go deeper</div>`,
      enter: (el, api) => {
        let any = false;
        el.querySelectorAll(".memcard").forEach(card => {
          const go = card.dataset.go;
          if (api.state.visited.has(go)) card.classList.add("visited");
          card.addEventListener("mouseenter", () => api.audio.fx("chirp"));
          card.addEventListener("click", () => api.goTo(go));
        });
        if (api.state.visited.size >= cards.length) {
          el.querySelector("#deeper").classList.add("show");
          api.setHint("click to go deeper");
        } else {
          api.setHint("choose a memory");
        }
      },
      advance: (api) => { if (api.state.visited.size >= cards.length) api.goTo("illusion_room"); }
    },

    illusion_restoration: memScene("illusion_restoration", "memory · 01", "RESTORATION VALLEY", "machine and beast plant the world anew — and the fox leads them, laughing", "warm"),
    illusion_treehouse:   memScene("illusion_treehouse", "memory · 02", "TREEHOUSE CIVILIZATION", "a vast city grown from a single tree · bridges, lanterns, belonging", "cool"),
    illusion_memlake:     memScene("illusion_memlake", "memory · 03", "MEMORY LAKE", "the water remembers the smoke, the choices, the silence we left", "dim"),
    illusion_voidtree:    memScene("illusion_voidtree", "sky forest · 04", "THE VOID TREE", "the last tree they could not fell · they vanished before the cut, and it still stands", "cool"),

    // 3 — the room: building a human
    illusion_room: {
      group: "ILLUSION",
      tmpl: () => `
        <div class="scene-title">
          <div class="kicker">illusion · genesis</div>
          <div class="title glow-cool" style="font-size:clamp(28px,4.6vw,56px)">THE&nbsp;MAKING</div>
        </div>
        <div class="scene-caption">they build a maker, as they once were built — and the light begins to fade</div>`,
      enter: (el, api) => { api.setHint("click to let the light fade"); },
      advance: (api) => api.goTo("illusion_dark")
    },

    // 4 — fade to black, glitch, return home
    illusion_dark: {
      group: "ILLUSION",
      tmpl: () => "",
      enter: (el, api) => {
        api.hideHint();
        api.fadeTo(true);
        el._t1 = setTimeout(() => api.audio.fx("glitch"), 2600);
        el._t2 = setTimeout(() => api.audio.fx("glitch"), 2900);
        el._t3 = setTimeout(() => {
          api.state.visited.clear();
          api.goTo("earth");
          setTimeout(() => api.fadeTo(false), 240);
        }, 3300);
      },
      leave: (el) => { clearTimeout(el._t1); clearTimeout(el._t2); clearTimeout(el._t3); },
      advance: () => {}
    }
  };
})();
