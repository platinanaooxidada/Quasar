(() => {
  // Nova tela de carregamento do hangar
  const DESTINO_HANGAR = "jogo_2.html";

  const CURIOSIDADES = [
    "Velocidade orbital: Para entrar em órbita ao redor da Terra, um foguete precisa atingir cerca de 28.000 km/h, completando uma volta a cada 90 minutos.",
    "A maior estrutura já descoberta no universo é a Grande Muralha Hércules-Corona Borealis, um filamento galáctico com cerca de 10 bilhões de anos-luz de comprimento.",
    "A expansão acelerada: O universo não está parado; ele se expande em ritmo acelerado, ganhando cerca de 1,6 bilhão de quilômetros a cada hora.",
    "Composição misteriosa: Apenas cerca de 4% do universo é composto por matéria normal (estrelas, planetas e nós). O restante é formado por 23% de matéria escura e 73% de energia escura."
  ];

  let rafId = null;
  let cleanupResize = null;

  function iniciarCanvas(canvas) {
    if (!canvas) return;
    if (rafId) cancelAnimationFrame(rafId);
    if (cleanupResize) cleanupResize();

    const ctx = canvas.getContext("2d");
    const lo = document.createElement("canvas");
    const lx = lo.getContext("2d", { willReadFrequently: true });

    let W, H, DPR, CW, CH, COLS, ROWS, CX, CY, stars = [];

    const CONFIG = {
      colunas: 82,
      alturaDoSol: 0.40,
      alturaTitulo: 0.88,
      inclinacao: -0.12,
      achatamento: 0.32,
      velocidade: 0.6
    };

    const PLANETS = [
      { nome: "mercurio", a: 0.13, r: 1.1, s: 1.9, col: [190, 175, 160], trail: 4,  delay: 3.6, ph: 0.4 },
      { nome: "venus",    a: 0.20, r: 1.9, s: 1.4, col: [235, 175, 95],  trail: 4,  delay: 4.2, ph: 2.2 },
      { nome: "terra",    a: 0.27, r: 2.1, s: 1.0, col: [55, 120, 255],  trail: 4,  delay: 4.8, ph: 4.0, verde: true },
      { nome: "marte",    a: 0.35, r: 1.6, s: 0.8, col: [255, 60, 40],   trail: 4,  delay: 5.4, ph: 1.0 },
      { nome: "jupiter",  a: 0.45, r: 4.0, s: 0.5, col: [255, 185, 70],  trail: 5,  delay: 6.0, ph: 3.2, faixas: true },
      { nome: "saturno",  a: 0.58, r: 3.3, s: 0.38, col: [240, 200, 60], trail: 5,  delay: 6.6, ph: 5.3, anel: true },
      { nome: "urano",    a: 0.72, r: 2.3, s: 0.30, col: [130, 205, 255],trail: 20, delay: 7.2, ph: 0.2 },
      { nome: "netuno",   a: 0.84, r: 2.2, s: 0.22, col: [50, 85, 255],  trail: 6,  delay: 7.8, ph: 2.6 }
    ];
    PLANETS.forEach((p) => { p.hist = []; p.lastPush = 0; });

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
    const hash = (i, k) => {
      const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const mul = (c, k) => [(c[0] * k) | 0, (c[1] * k) | 0, (c[2] * k) | 0];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = Math.max(300, Math.round(rect.width || 500));
      H = Math.max(200, Math.round(rect.height || 312));
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      CW = Math.max(5, Math.round(W / CONFIG.colunas));
      CH = Math.round(CW * 1.25);
      COLS = Math.ceil(W / CW);
      ROWS = Math.ceil(H / CH);
      lo.width = COLS;
      lo.height = ROWS;
      lx.setTransform(1, 0, 0, 1, 0, 0);
      lx.fillStyle = "#000";
      lx.fillRect(0, 0, COLS, ROWS);
      CX = (W / 2) / CW;
      CY = (H * CONFIG.alturaDoSol) / CW;
      stars = Array.from({ length: 90 }, () => ({
        x: rnd(W),
        y: rnd(H),
        t: rnd(6.28),
        v: rnd(0.4, 1.4),
        c: [".", ".", "+", "*"][rnd(4) | 0]
      }));
    }

    window.addEventListener("resize", resize);
    cleanupResize = () => window.removeEventListener("resize", resize);
    resize();

    function drawSun(t, k) {
      const R = COLS * 0.07 * (0.92 + 0.08 * Math.min(1, t / 2));
      const g = lx.createRadialGradient(CX, CY, 0, CX, CY, R * 1.35);
      g.addColorStop(0.00, "rgba(255,248,200,1)");
      g.addColorStop(0.30, "rgba(255,215,60,1)");
      g.addColorStop(0.65, "rgba(255,135,15,1)");
      g.addColorStop(0.88, "rgba(255,60,10,0.75)");
      g.addColorStop(1.00, "rgba(200,20,0,0)");
      lx.globalAlpha = k;
      lx.fillStyle = g;
      lx.beginPath();
      lx.arc(CX, CY, R * 1.35, 0, 6.283);
      lx.fill();

      for (let i = 0; i < 7; i++) {
        const a = rnd(6.283), d = rnd(R * 0.6);
        const x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d, rr = R * rnd(0.2, 0.45);
        const b = lx.createRadialGradient(x, y, 0, x, y, rr);
        b.addColorStop(0, "rgba(255,255,210,0.55)");
        b.addColorStop(1, "rgba(255,200,60,0)");
        lx.fillStyle = b;
        lx.beginPath();
        lx.arc(x, y, rr, 0, 6.283);
        lx.fill();
      }
      for (let i = 0; i < 5; i++) {
        const a = rnd(6.283), d = rnd(R * 0.9);
        lx.fillStyle = "rgba(120,20,0,0.45)";
        lx.beginPath();
        lx.arc(CX + Math.cos(a) * d, CY + Math.sin(a) * d, rnd(0.5, 1.2), 0, 6.283);
        lx.fill();
      }
      for (let i = 0; i < 26; i++) {
        const a = rnd(6.283), d = R * rnd(1.0, 1.7);
        lx.fillStyle = rgba([255, rnd(40, 120) | 0, 10], rnd(0.5, 1));
        lx.fillRect(CX + Math.cos(a) * d, CY + Math.sin(a) * d, 1, 1);
      }
      lx.globalAlpha = 1;
    }

    function planetPos(p, t) {
      const ang = p.ph + t * p.s * CONFIG.velocidade;
      const A = p.a * COLS, B = A * CONFIG.achatamento;
      const ex = Math.cos(ang) * A, ey = Math.sin(ang) * B;
      const c = Math.cos(CONFIG.inclinacao), s = Math.sin(CONFIG.inclinacao);
      return { x: CX + ex * c - ey * s, y: CY + ex * s + ey * c, depth: Math.sin(ang) };
    }

    function drawPlanet(p, pos, alpha) {
      const sc = 1 + 0.28 * pos.depth;
      const r = p.r * sc;

      const n = p.hist.length;
      p.hist.forEach((h, i) => {
        const f = (i + 1) / n;
        lx.fillStyle = rgba(p.col, alpha * f * 0.55);
        lx.beginPath();
        lx.arc(h.x, h.y, h.r * (0.35 + 0.55 * f), 0, 6.283);
        lx.fill();
      });
      lx.globalAlpha = alpha;

      const ringRot = -0.35;
      if (p.anel) {
        lx.strokeStyle = rgba(mul(p.col, 0.7), 0.85);
        lx.lineWidth = r * 0.45;
        lx.beginPath();
        lx.ellipse(pos.x, pos.y, r * 2.2, r * 0.7, ringRot, Math.PI, Math.PI * 2);
        lx.stroke();
      }

      let dx = CX - pos.x, dy = CY - pos.y;
      const L = Math.hypot(dx, dy) || 1;
      dx /= L;
      dy /= L;
      const g = lx.createRadialGradient(pos.x + dx * r * 0.45, pos.y + dy * r * 0.45, r * 0.05, pos.x, pos.y, r);
      g.addColorStop(0, rgba(p.col.map((v) => Math.min(255, v + 60)), 1));
      g.addColorStop(0.55, rgba(p.col, 1));
      g.addColorStop(1, rgba(mul(p.col, 0.22), 1));
      lx.fillStyle = g;
      lx.beginPath();
      lx.arc(pos.x, pos.y, r, 0, 6.283);
      lx.fill();

      if (p.faixas) {
        lx.save();
        lx.beginPath();
        lx.arc(pos.x, pos.y, r, 0, 6.283);
        lx.clip();
        lx.fillStyle = "rgba(150,70,20,0.45)";
        lx.fillRect(pos.x - r, pos.y - r * 0.35, r * 2, r * 0.3);
        lx.fillRect(pos.x - r, pos.y + r * 0.25, r * 2, r * 0.22);
        lx.restore();
      }
      if (p.verde) {
        lx.fillStyle = "rgba(60,220,110,0.8)";
        lx.beginPath();
        lx.arc(pos.x - r * 0.2, pos.y + r * 0.15, r * 0.4, 0, 6.283);
        lx.fill();
      }
      if (p.anel) {
        lx.strokeStyle = rgba(p.col, 0.95);
        lx.lineWidth = r * 0.45;
        lx.beginPath();
        lx.ellipse(pos.x, pos.y, r * 2.2, r * 0.7, ringRot, 0, Math.PI);
        lx.stroke();
      }
      lx.globalAlpha = 1;
    }

    function drawOrbits(k) {
      lx.strokeStyle = `rgba(255,255,255,${0.07 * k})`;
      lx.lineWidth = 0.6;
      PLANETS.forEach((p) => {
        const A = p.a * COLS, B = A * CONFIG.achatamento;
        lx.beginPath();
        lx.ellipse(CX, CY, A, B, CONFIG.inclinacao, 0, 6.283);
        lx.stroke();
      });
    }

    function charFor(lum, h) {
      if (lum < 0.10) return ".";
      if (lum < 0.20) return h < 0.5 ? "-" : "~";
      if (lum < 0.32) return h < 0.4 ? "~" : h < 0.7 ? "=" : "-";
      if (lum < 0.48) return h < 0.34 ? "+" : h < 0.67 ? "*" : "%";
      return h < 0.30 ? "@" : h < 0.52 ? "#" : h < 0.72 ? "0" : h < 0.86 ? "O" : "%";
    }

    const TITLE = "SISTEMA SOLAR";
    const TCOL = ["#ff8a1a", "#ff3b2f", "#ffc83a", "#ff8a1a", "#4da3ff", "#7fd8ff", "#ff3b2f", "#4da3ff", "#ffc83a", "#ff8a1a", "#7fd8ff", "#4da3ff"];

    function drawTitle(t) {
      const k = clamp((t - 8.2) / 2.0);
      if (k <= 0) return;
      const gap = W * 0.032, y = H * CONFIG.alturaTitulo;
      const x0 = W / 2 - ((TITLE.length - 1) * gap) / 2;
      ctx.font = `bold ${Math.max(9, CW * 1.1)}px "Courier New", monospace`;
      for (let i = 0; i < TITLE.length; i++) {
        const ch = TITLE[i];
        if (ch === " ") continue;
        const x = x0 + i * gap;
        ctx.globalAlpha = k * 0.95;
        ctx.fillStyle = TCOL[i];
        ctx.shadowColor = TCOL[i];
        ctx.shadowBlur = 8;
        ctx.fillText(ch, x, y);

        ctx.globalAlpha = k * 0.22;
        ctx.shadowBlur = 14;
        ctx.fillText(".", x, y + CH * 1.4);
        ctx.fillText(".", x, y + CH * 2.0);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    const t0 = performance.now();
    const glowOK = ctx.filter !== undefined;

    function frame(now) {
      const t = (now - t0) / 1000;

      lx.setTransform(1, 0, 0, 1, 0, 0);
      lx.fillStyle = "rgba(0,0,0,0.55)";
      lx.fillRect(0, 0, COLS, ROWS);
      lx.setTransform(1, 0, 0, CW / CH, 0, 0);

      drawOrbits(clamp((t - 3) / 2));

      const items = [{ sun: true, y: CY }];
      PLANETS.forEach((p) => {
        const k = clamp((t - p.delay) / 1.4);
        if (k <= 0) return;
        const pos = planetPos(p, t);
        if (t - p.lastPush > 0.05) {
          const sc = 1 + 0.28 * pos.depth;
          p.hist.push({ x: pos.x, y: pos.y, r: p.r * sc });
          if (p.hist.length > p.trail) p.hist.shift();
          p.lastPush = t;
        }
        items.push({ p, pos, k, y: pos.y });
      });
      items.sort((a, b) => a.y - b.y);
      items.forEach((it) => (it.sun ? drawSun(t, clamp(t / 1.2)) : drawPlanet(it.p, it.pos, it.k)));

      lx.setTransform(1, 0, 0, 1, 0, 0);
      const data = lx.getImageData(0, 0, COLS, ROWS).data;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${CW}px "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      stars.forEach((s) => {
        ctx.globalAlpha = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t * s.v + s.t));
        ctx.fillStyle = "#9fb4d0";
        ctx.fillText(s.c, s.x, s.y);
      });
      ctx.globalAlpha = 1;

      if (glowOK) {
        ctx.save();
        ctx.filter = "blur(9px)";
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.5;
        ctx.drawImage(lo, 0, 0, COLS * CW, ROWS * CH);
        ctx.restore();
      }

      ctx.font = `${Math.round(CW * 1.15)}px "Courier New", monospace`;
      const slot = Math.floor(t * 3);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const i = (y * COLS + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const m = Math.max(r, g, b);
          if (m < 8) continue;
          const lum = m / 255;
          const h = hash(y * COLS + x, slot);
          const px = x * CW + CW / 2, py = y * CH + CH / 2;
          if (lum < 0.10) {
            ctx.globalAlpha = clamp(lum * 5);
            ctx.fillStyle = "#7d8aa3";
            ctx.shadowBlur = 0;
            ctx.fillText(".", px, py);
            continue;
          }
          const k = (255 / m) * (0.45 + 0.55 * lum);
          const col = `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;
          ctx.globalAlpha = clamp(0.35 + lum * 0.9);
          ctx.fillStyle = col;
          if (lum > 0.4) {
            ctx.shadowColor = col;
            ctx.shadowBlur = 4 + lum * 8;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fillText(charFor(lum, h), px, py);
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      drawTitle(t);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
  }

  function abrirLoader(destino) {
    let root = document.getElementById("sv-loader");
    if (!root) {
      root = document.createElement("div");
      root.id = "sv-loader";
      root.className = "sv-loader";
      document.body.appendChild(root);
    }

    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "18px",
      background: "radial-gradient(circle at 50% 30%, rgba(90, 185, 255, 0.14), #04060c 68%)",
      color: "#f2eee4"
    });

    root.hidden = false;
    root.innerHTML = `
      <div class="sv-loader__panel" style="width:100%;max-width:500px;padding:18px 16px 20px;border-radius:18px;border:1.5px solid rgba(132,185,172,0.35);background:rgba(8,11,19,0.94);display:flex;flex-direction:column;align-items:center;gap:12px;">
        <canvas id="sv-solar-cv" class="sv-loader__canvas" style="display:block;width:100%;aspect-ratio:16/10;border-radius:12px;background:#000;" aria-hidden="true"></canvas>
        <div class="sv-loader__row" style="width:100%;display:flex;justify-content:space-between;font-family:monospace;font-size:12px;">
          <p id="sv-ld-st" class="sv-loader__status" style="margin:0;color:#8fd3ff;text-transform:uppercase;">Carregando hangar...</p>
          <span id="sv-ld-pct" class="sv-loader__pct" style="font-weight:700;">0%</span>
        </div>
        <div class="sv-loader__track" style="width:100%;height:14px;padding:2px;border-radius:999px;background:rgba(125,205,255,0.1);border:1.5px solid rgba(143,211,255,0.45);overflow:hidden;">
          <div id="sv-ld-bar" class="sv-loader__fill" style="width:0%;height:100%;border-radius:999px;background:linear-gradient(90deg,#4ea8ff,#8fd3ff 55%,#eb8928);"></div>
        </div>
        <div id="sv-ld-box" class="sv-loader__box" style="width:100%;padding:12px 14px;border-radius:12px;background:rgba(125,205,255,0.06);border:1px solid rgba(125,205,255,0.2);text-align:left;cursor:pointer;">
          <span class="sv-loader__tag" style="display:block;margin-bottom:4px;font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#eb8928;">Arquivo cósmico · Curiosidade</span>
          <p id="sv-ld-txt" class="sv-loader__text" style="margin:0;min-height:54px;font-size:13.5px;line-height:1.45;"></p>
        </div>
        <button id="sv-ld-go" class="sv-start sv-loader__enter" type="button" hidden style="align-self:center;margin-top:4px;">
          <span>Entrar no hangar</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path></svg>
        </button>
      </div>`;

    try {
      iniciarCanvas(document.getElementById("sv-solar-cv"));
    } catch (err) {
      console.error("Erro no canvas:", err);
    }

    const st = document.getElementById("sv-ld-st");
    const pct = document.getElementById("sv-ld-pct");
    const bar = document.getElementById("sv-ld-bar");
    const txt = document.getElementById("sv-ld-txt");
    const go = document.getElementById("sv-ld-go");

    let cIdx = 0, prog = 0;
    txt.textContent = CURIOSIDADES[0];

    const trocar = () => {
      cIdx = (cIdx + 1) % CURIOSIDADES.length;
      txt.textContent = CURIOSIDADES[cIdx];
    };
    document.getElementById("sv-ld-box").onclick = trocar;
    const tCurio = setInterval(trocar, 2400);

   const FASES_COR = [
      { p: 0,   c1: [255, 60, 10],  c2: [255, 145, 20], c3: [255, 240, 160] },
      { p: 36,  c1: [255, 110, 25], c2: [240, 175, 80], c3: [255, 215, 110] },
      { p: 56,  c1: [255, 75, 45],  c2: [55, 150, 255], c3: [95, 225, 175]  },
      { p: 78,  c1: [240, 200, 60], c2: [65, 125, 255], c3: [130, 215, 255] },
      { p: 100, c1: [255, 138, 26], c2: [255, 200, 58], c3: [127, 216, 255] }
    ];

    function atualizarCorBarra(p) {
      let i = 0;
      while (i < FASES_COR.length - 2 && p > FASES_COR[i + 1].p) i++;
      const a = FASES_COR[i];
      const b = FASES_COR[i + 1];
      const t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p || 1)));
      const mix = (x, y) => Math.round(x + (y - x) * t);
      const rgb = (k) => `rgb(${mix(a[k][0], b[k][0])},${mix(a[k][1], b[k][1])},${mix(a[k][2], b[k][2])})`;
      const ponta = rgb("c3");

      bar.style.background = `linear-gradient(90deg, ${rgb("c1")}, ${rgb("c2")} 55%, ${ponta})`;
      bar.style.boxShadow = `0 0 14px ${ponta}`;
      pct.style.color = ponta;
    }

    atualizarCorBarra(0);

    const tProg = setInterval(() => {
      prog = Math.min(100, prog + 1.1);
      const p = Math.floor(prog);
      bar.style.width = p + "%";
      pct.textContent = p + "%";
      atualizarCorBarra(p);
      if (p >= 100) {
        clearInterval(tProg);
        st.textContent = "Tudo pronto!";
        st.style.color = "#84b9ac";
        go.hidden = false;
        go.style.display = "inline-flex";
      }
    }, 105);
    go.onclick = () => {
      clearInterval(tProg);
      clearInterval(tCurio);
      if (rafId) cancelAnimationFrame(rafId);
      if (cleanupResize) cleanupResize();
      window.location.href = destino;
    };
  }

  function conectarBotao() {
    const btn = document.getElementById("sv-start");
    if (!btn || btn.dataset.loaderBound) return;
    btn.dataset.loaderBound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      abrirLoader(btn.getAttribute("href") || btn.dataset.href || DESTINO_HANGAR);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", conectarBotao);
  } else {
    conectarBotao();
  }
})();