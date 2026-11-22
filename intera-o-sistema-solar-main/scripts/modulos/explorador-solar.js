import { CORPOS_CELESTES, PLANETAS, ESCALA_LOGARITMICA, calcularSistema, distanciaOrbitalComprimida } from "../dados/dados-celestes.js";
import { criarControlesCamera } from "../motor/controles-camera.js";
import { RenderizadorAscii, escalar, limitar, normalizar, somar, subtrair } from "../motor/renderizador-ascii.js";

export function iniciarExplorador(registrar, abrirInspetor) {
  const canvas = document.querySelector("#mapa-solar");
  const motor = new RenderizadorAscii(canvas, 7.5, 60);
  const barra = document.querySelector("#selecao-astros");
  const barraLuas = document.querySelector("#selecao-luas");
  const rotulos = document.querySelector("#rotulos-astros");
  const nomeAlvo = document.querySelector("#alvo-atual");
  const inspecionar = document.querySelector("#inspecionar");
  const rotacao = document.querySelector("#alternar-orbitas");
  const seletor = document.querySelector("#velocidade-orbital");
  const mostrarOrbitas = document.querySelector("#mostrar-orbitas");
  const mostrarRotulos = document.querySelector("#mostrar-rotulos");
  const vooLivre = document.querySelector("#voo-livre");
  const direcaoVoo = document.querySelector("#direcao-voo");
  const mira = document.querySelector("#mira");
  const alvoMira = document.querySelector("#alvo-mira");
  const ajuda = document.querySelector("#ajuda-mapa");
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let alvo = null;
  let naMira = null;
  let tempo = 0;
  let astros = calcularSistema(tempo, true, ESCALA_LOGARITMICA);
  let tempoVisual = 0;
  let rodando = !reduzido;

  function selecionar(x, y) {
    const id = motor.selecionar(x, y);
    if (id) abrirInspetor(id);
  }

  function moverVoo(posicao, direcao, passo) {
    let folga = Infinity;
    for (const astro of astros) {
      folga = Math.min(folga, Math.hypot(...subtrair(posicao, astro.posicao)) - astro.raio);
    }
    const velocidade = limitar(Math.max(0, folga) * 1.5, .36, 38);
    let destino = somar(posicao, escalar(direcao, velocidade * passo));
    for (const astro of astros) {
      const radial = subtrair(destino, astro.posicao);
      const limite = astro.raio * 1.08 + .08;
      const distancia = Math.hypot(...radial);
      if (distancia < limite) {
        const normal = distancia > 0 ? escalar(radial, 1 / distancia) : escalar(direcao, -Math.sign(passo));
        destino = somar(astro.posicao, escalar(normal, limite));
      }
    }
    const alcance = Math.hypot(...destino);
    return alcance > 210 ? escalar(destino, 210 / alcance) : destino;
  }

  const distanciaGeral = () => canvas.clientWidth < 620 ? 122 : 109;
  const camera = criarControlesCamera(canvas, {
    distancia: distanciaGeral(), minimo: 4.5, maximo: 235, azimute: .18, elevacao: .53, lente: 1.06, selecionar, moverVoo
  });

  function botaoAstro(id, acao, classe) {
    const botao = document.createElement("button");
    botao.className = classe;
    botao.type = "button";
    botao.textContent = id ? CORPOS_CELESTES[id].nome : "Visão geral";
    botao.addEventListener("click", () => acao(id));
    return botao;
  }

  function atualizarVoo(ativo) {
    vooLivre.setAttribute("aria-pressed", String(ativo));
    mira.hidden = !ativo;
    naMira = null;
    alvoMira.textContent = "";
    mira.setAttribute("aria-label", "Mira sem astro");
    mira.setAttribute("aria-disabled", "true");
    direcaoVoo.hidden = !ativo;
    ajuda.textContent = ativo
      ? "Arraste para mirar · Voe com WASD, setas ou botões · Enter ou toque na mira para inspecionar"
      : "Arraste ou use as setas para orbitar · Role, faça pinça ou use +/− para ajustar a aproximação";
  }

  const botoes = new Map();
  for (const id of [null, "sol", ...PLANETAS]) {
    const botao = botaoAstro(id, focar, "botao-discreto");
    botoes.set(id, botao);
    barra.append(botao);
  }

  const botoesLuas = new Map();
  const rotulosAstros = new Map();
  for (const [id, astro] of Object.entries(CORPOS_CELESTES)) {
    const botao = botaoAstro(id, abrirInspetor, "rotulo-astro");
    botao.setAttribute("aria-label", "Inspecionar " + astro.nome);
    botao.hidden = true;
    rotulosAstros.set(id, botao);
    rotulos.append(botao);
    if (astro.pai) botoesLuas.set(id, botaoAstro(id, focar, "botao-discreto"));
  }

  function focar(id) {
    alvo = id;
    const astro = id && CORPOS_CELESTES[id];
    const planeta = astro?.pai ?? id;
    const luas = CORPOS_CELESTES[planeta]?.luas ?? [];
    if (luas.length && !luas.some(lua => botoesLuas.get(lua).parentElement === barraLuas)) {
      barraLuas.replaceChildren(...luas.map(lua => botoesLuas.get(lua)));
    }
    barraLuas.hidden = !luas.length;
    for (const [opcao, botao] of botoes) botao.setAttribute("aria-pressed", String(opcao === planeta));
    for (const lua of luas) botoesLuas.get(lua).setAttribute("aria-pressed", String(lua === id));

    inspecionar.hidden = !astro;
    nomeAlvo.textContent = astro?.nome ?? "Visão geral";
    const visual = ESCALA_LOGARITMICA[id];
    const alcance = !astro?.pai && luas.length ? Math.max(...luas.map(lua => ESCALA_LOGARITMICA[lua].orbita)) * 2.1 : 1.4;
    const distancia = id ? Math.max(alcance, visual.raio * (visual.anel ? 7.2 : 5.2)) : distanciaGeral();
    camera.focar([0, 0, 0], distancia, visual ? visual.raio * (visual.anel ? 2.52 : 1.14) : 4.5);
    atualizarVoo(false);
  }

  function atualizarRotacao() {
    rotacao.setAttribute("aria-pressed", String(rodando));
    rotacao.textContent = "Rotação orbital: " + (rodando ? "ativa" : "pausada");
  }

  rotacao.addEventListener("click", () => {
    rodando = !rodando;
    atualizarRotacao();
  });
  vooLivre.addEventListener("click", () => {
    atualizarVoo(camera.alternarVooLivre());
    nomeAlvo.textContent = camera.emVoo ? "Voo livre" : CORPOS_CELESTES[alvo]?.nome ?? "Visão geral";
    if (camera.emVoo) canvas.focus({ preventScroll: true });
  });
  for (const botao of direcaoVoo.querySelectorAll("button")) {
    const direcao = botao.dataset.direcao;
    const soltar = () => camera.mudarDirecao(direcao, false);
    botao.addEventListener("pointerdown", evento => {
      if (evento.button !== 0) return;
      botao.setPointerCapture(evento.pointerId);
      camera.mudarDirecao(direcao, true);
    });
    for (const tipo of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) {
      botao.addEventListener(tipo, soltar);
    }
    botao.addEventListener("keydown", evento => {
      if (evento.key === " " || evento.key === "Enter") {
        evento.preventDefault();
        camera.mudarDirecao(direcao, true);
      }
    });
    botao.addEventListener("keyup", evento => {
      if (evento.key === " " || evento.key === "Enter") soltar();
    });
  }
  inspecionar.addEventListener("click", () => abrirInspetor(alvo));
  mira.addEventListener("click", () => { if (naMira) abrirInspetor(naMira); });
  atualizarRotacao();
  focar(null);

  function posicionarRotulos(astros) {
    const caixas = [];
    const visiveis = new Set();
    const planeta = CORPOS_CELESTES[alvo]?.pai ?? alvo;
    const porPrioridade = [...astros].sort((a, b) => Number(b.id === alvo) - Number(a.id === alvo));
    for (const astro of porPrioridade) {
      const pai = CORPOS_CELESTES[astro.id].pai;
      const p = motor.projetados.get(astro.id);
      if (!mostrarRotulos.checked || !p || (pai && pai !== planeta && p.raio < 5)) continue;
      const x = p.x;
      const y = p.y + p.raio + 5;
      const metade = CORPOS_CELESTES[astro.id].nome.length * 3.4 + 5;
      if (x < metade + 4 || y < 52 || x > motor.largura - metade - 4 || y > motor.altura - 46) continue;
      const colisao = caixas.some(c => Math.abs(c.x - x) < c.metade + metade && Math.abs(c.y - y) < 19);
      if (colisao) continue;
      caixas.push({ x, y, metade });
      const botao = rotulosAstros.get(astro.id);
      const posicao = `${Math.round(x)}px ${Math.round(y)}px`;
      if (botao.style.getPropertyValue("--posicao") !== posicao) botao.style.setProperty("--posicao", posicao);
      visiveis.add(astro.id);
    }
    for (const [id, botao] of rotulosAstros) {
      const oculto = !visiveis.has(id);
      if (botao.hidden !== oculto) botao.hidden = oculto;
    }
  }

  registrar(canvas, dt => {
    if (rodando) tempo += dt * Number(seletor.value);
    if (!reduzido) tempoVisual += dt;
    astros = calcularSistema(tempo, true, ESCALA_LOGARITMICA);
    const foco = astros.find(astro => astro.id === alvo);
    if (!motor.iniciar(camera.quadro(foco?.posicao ?? [0, 0, 0], dt), tempoVisual)) return;

    motor.estrelasAoFundo(.88);
    if (mostrarOrbitas.checked) {
      const porId = new Map(astros.map(astro => [astro.id, astro]));
      for (const astro of astros) {
        if (!astro.orbita) continue;
        const pai = CORPOS_CELESTES[astro.id].pai;
        if (!pai) motor.orbita([0, 0, 0], astro.orbita, "#8fd3ff", .52);
        else if (alvo === pai || CORPOS_CELESTES[alvo]?.pai === pai) {
          motor.orbita(porId.get(pai).posicao, astro.orbita, "#84b9ac", .46, .16);
        }
      }
    }
    motor.asteroides(distanciaOrbitalComprimida(2.8));
    for (const astro of astros) motor.astro(astro);
    motor.finalizar();
    posicionarRotulos(astros);

    if (camera.emVoo) {
      naMira = motor.selecionar(motor.largura / 2, motor.altura / 2);
      const nome = naMira ? CORPOS_CELESTES[naMira].nome : "";
      if (alvoMira.textContent !== nome) {
        alvoMira.textContent = nome;
        mira.setAttribute("aria-label", nome ? "Inspecionar " + nome : "Mira sem astro");
        mira.setAttribute("aria-disabled", String(!naMira));
      }
    }
  }, false, 60);
}