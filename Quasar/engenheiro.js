(() => {
  const L = (n) => n.toFixed(2).replace(".", ",");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const NOSE = { pointed: "Ogiva", round: "Cúpula", blunt: "Cápsula", needle: "Agulha" };

  /* ---------- dados do jogo ---------- */
  function lerConfig() {
    // Opcional: se você expôs window.svGame no HTML, ele tem prioridade.
    if (window.svGame?.config) return window.svGame.config();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_CONFIG) || "{}");
      return loadConfiguration(DEFAULT_CONFIG, ROCKET_CONTROLS, saved);
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function avaliar() {
    const cfg = lerConfig();
    const s = window.svGame?.stats ? window.svGame.stats() : computeStats(cfg);
    const checks = [];
    const dicas = [];

    // Decolagem
    const decOk = s.twr >= 1.1;
    checks.push({
      status: decOk ? "ok" : "bad",
      titulo: "Decolagem (Empuxo)",
      metrica: `${L(s.twr)} de mín. 1,10`,
      pct: clamp((s.twr / 1.1) * 100, 8, 100),
      desc: decOk ? "Força suficiente para sair do chão." : "Pesado demais: não sai do chão.",
    });
    if (!decOk) {
      dicas.push(cfg.engine === "ion"
        ? "o Íon Plasma tem pouca força: coloque boosters ou troque para o Falcão"
        : "adicione boosters, use o Tri-Vórtex ou diminua o tamanho do casco");
    }

    // Estabilidade
    const st = s.stability;
    checks.push({
      status: st < 35 ? "bad" : st < 65 ? "warn" : "ok",
      titulo: "Estabilidade",
      metrica: `${Math.round(st)}% (ideal 65%+)`,
      pct: clamp(st, 8, 100),
      desc: st < 35 ? "Vai perder o controle no ar." : st < 65 ? "Voa, mas balança." : "Voo firme e reto.",
    });
    if (st < 65) {
      dicas.push(cfg.finType === "none"
        ? "coloque aletas Varridas, com 3 ou 4 unidades"
        : "use aletas Varridas, mais unidades ou um tamanho maior");
    }

    // Alcance (Δv): destino mais distante que dá para alcançar
    const alcancaveis = DESTINATIONS.filter((d) => d.req <= s.range);
    const destino = alcancaveis.length ? alcancaveis[alcancaveis.length - 1] : null;
    const proximo = DESTINATIONS.find((d) => d.req > s.range);
    const maxReq = DESTINATIONS[DESTINATIONS.length - 1].req;
    checks.push({
      status: !destino ? "bad" : s.range < 3.6 ? "warn" : "ok",
      titulo: "Alcance (Δv)",
      metrica: `Δv ${L(s.range)} disponível`,
      pct: clamp((s.range / maxReq) * 100, 8, 100),
      desc: destino ? `Chega até ${destino.name}.` : "Não alcança nenhum destino.",
    });
    if (decOk && proximo) {
      const partes = [];
      if (cfg.boosters < 4) partes.push("mais boosters");
      if (cfg.length < 280 || cfg.width < 80) partes.push("casco maior (mais combustível)");
      if (cfg.nose === "round" || cfg.nose === "blunt") partes.push("ogiva Agulha");
      if (cfg.engine !== "ion") partes.push("motor Íon Plasma");
      if (partes.length) dicas.push(`para chegar a ${proximo.name}: ${partes.slice(0, 3).join(", ")}`);
    }

    // Aerodinâmica
    const aero = Math.round(s.aero * 100);
    checks.push({
      status: s.aero >= 0.8 ? "ok" : s.aero >= 0.65 ? "warn" : "bad",
      titulo: `Aerodinâmica (${NOSE[cfg.nose] || cfg.nose})`,
      metrica: `${aero}% de eficiência`,
      pct: clamp(aero, 8, 100),
      desc: s.aero >= 0.8 ? "Baixo arrasto na subida." : "Muito arrasto: gasta combustível.",
    });
    if (s.aero < 0.8) dicas.push("troque a coifa para Agulha ou Ogiva e reduza o arrasto");

    // Veredito
    const nomeDestino = destino ? destino.name : "nenhum destino";
    let classe = "is-go";
    let texto = "Pode lançar · Sistemas prontos";
    let fala = `Tudo certo, comandante! Com essa configuração você chega até ${nomeDestino}.`;

    if (!decOk) {
      classe = "is-stop";
      texto = "Não decola · Ajuste o empuxo";
      fala = `Com essa configuração o foguete nem sai do chão. Recomendo: ${dicas[0]}.`;
    } else if (st < 35) {
      classe = "is-stop";
      texto = "Instável · Risco de perder o controle";
      fala = `Esse foguete vai rodopiar no ar. Recomendo: ${dicas[0]}.`;
    } else if (!destino) {
      classe = "is-warn";
      texto = "Decola, mas não chega a nenhum destino";
      fala = `Você decola, mas o combustível não fecha nem para a Lua. ${dicas.length ? "Recomendo: " + dicas[dicas.length - 1] + "." : ""}`;
    } else if (dicas.length) {
      classe = "is-warn";
      texto = "Liberado · Pode render mais";
      fala = `Já dá para lançar até ${nomeDestino}, mas para render mais: ${dicas[0]}.`;
    }

    return { checks, classe, texto, fala, destino: nomeDestino };
  }

  /* ---------- painel do Hangar ---------- */
  function montarPainel() {
    if (document.getElementById("sv-eng-section")) return;
    const hangar = document.querySelector('[data-screen-id="hangar"]');
    if (!hangar) return;
    const sec = document.createElement("section");
    sec.id = "sv-eng-section";
    sec.className = "sv-eng-section";
    sec.innerHTML = `
      <div class="sv-eng-card">
        <h2 class="sv-eng-title">
          <span>Checklist de Lançamento · Telemetria</span>
          <span id="sv-check-count"></span>
        </h2>
        <ul id="sv-check-list" class="sv-check-list"></ul>
      </div>
      <div class="sv-eng-card">
        <h2 class="sv-eng-title">
          <span>Engenheiro-Chefe · Parecer Técnico</span>
          <span>HANGAR 39A</span>
        </h2>
        <div class="sv-eng-coach">
          <div class="sv-eng-avatar-wrap" id="sv-eng-wrap">
            <button type="button" class="sv-eng-help" aria-label="Quem é o engenheiro-chefe?">?</button>
            <div class="sv-eng-tooltip" role="tooltip">
              Esse é o <strong>Charles</strong>, seu engenheiro-chefe. É ele que analisa seu foguete.
            </div>
            <div class="sv-eng-avatar">
              <img src="engenheiro-foguete.jpeg" alt="Charles, Engenheiro-Chefe" onerror="this.onerror=null;this.src='engenheiro-foguete.jpg';">
            </div>
          </div>
          <div class="sv-eng-bubble">
            <span id="sv-eng-verdict" class="sv-eng-verdict is-go">Analisando...</span>
            <p id="sv-eng-speech" class="sv-eng-speech"></p>
            <div id="sv-eng-reach" class="sv-eng-reach"></div>
          </div>
        </div>
      </div>`;
    hangar.insertAdjacentElement("afterend", sec);

    const wrap = document.getElementById("sv-eng-wrap");
    wrap.querySelector(".sv-eng-help").addEventListener("click", (e) => {
      e.stopPropagation();
      wrap.classList.toggle("is-open");
    });
    document.addEventListener("click", () => wrap.classList.remove("is-open"));
  }

  function atualizarPainel() {
    const listEl = document.getElementById("sv-check-list");
    if (!listEl) return;
    const r = avaliar();
    const ok = r.checks.filter((c) => c.status === "ok").length;
    document.getElementById("sv-check-count").textContent = `${ok}/${r.checks.length} OK`;

    listEl.innerHTML = r.checks.map((c) => {
      const cls = c.status === "ok" ? "is-ok" : c.status === "bad" ? "is-bad" : "";
      const icone = c.status === "ok" ? "✓" : c.status === "bad" ? "✕" : "!";
      return `<li class="sv-check-item ${cls}">
        <span class="sv-check-badge">${icone}</span>
        <div class="sv-check-info" style="flex:1;">
          <div class="sv-check-top"><strong>${c.titulo}</strong><span class="sv-check-metric">${c.metrica}</span></div>
          <div class="sv-check-meter"><i style="width:${c.pct}%"></i></div>
          <span>${c.desc}</span>
        </div>
      </li>`;
    }).join("");

    const verd = document.getElementById("sv-eng-verdict");
    verd.className = `sv-eng-verdict ${r.classe}`;
    verd.textContent = r.texto;
    document.getElementById("sv-eng-speech").textContent = r.fala;
    document.getElementById("sv-eng-reach").innerHTML = `<strong>Alcance atual:</strong> ${r.destino}`;
  }

  /* ---------- tela de Missão ---------- */
  function ajustarMissao() {
    const diag = document.querySelector(".rg-mission .rg-diag");
    if (!diag) return;

    // Títulos e texto da ajuda (são estáticos, basta trocar uma vez)
    const titulo = diag.querySelector(".rg-diag__head .rg-panel__title");
    if (titulo) titulo.textContent = "Orientações de voo & ajuda";
    const lead = diag.querySelector(".rg-guide__lead");
    if (lead) lead.innerHTML = lead.innerHTML.replace(/o checklist acima diz/i, "o checklist do hangar diz");

    // Botão voltar: o data-action faz o próprio jogo trocar de tela
    if (document.getElementById("sv-btn-back-hangar")) return;
    const bar = document.createElement("div");
    bar.className = "sv-mission-back-bar";
    bar.innerHTML = `
      <button id="sv-btn-back-hangar" type="button" class="sv-btn-back-hangar" data-action="to-hangar">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
        <span>Voltar ao Hangar</span>
      </button>`;
    diag.insertBefore(bar, diag.firstChild);
  }

  /* ---------- início ---------- */
  function iniciar() {
    montarPainel();
    ajustarMissao();
    atualizarPainel();
    // O listener do jogo roda antes (está em #app); o timeout garante dados já salvos.
    const agendar = () => setTimeout(atualizarPainel, 0);
    document.addEventListener("click", agendar);
    document.addEventListener("input", agendar);
    window.addEventListener("pageshow", agendar);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();