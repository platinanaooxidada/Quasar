//monta a ficha e o globo ampliado do astro selecionado
import { CORPOS_CELESTES, criarAstro, VISUAIS } from "../dados/dados-celestes.js";
import { criarControlesCamera } from "../motor/controles-camera.js";
import { RenderizadorAscii, cameraOrbital, limitar, suavizar } from "../motor/renderizador-ascii.js";

const ASTROS = Object.keys(CORPOS_CELESTES);
const CENTRO = [0, 0, 0];
const LUZ = [-.57, .48, .88];
const NASA = {
  sol: "sun", mercurio: "mercury", venus: "venus", terra: "earth", lua: "moon", marte: "mars",
  jupiter: "jupiter", saturno: "saturn", urano: "uranus", netuno: "neptune"
};

function botao(texto, classe) {
  const elemento = document.createElement("button");
  elemento.type = "button";
  elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

function distanciaDaCamera(id) {
  return VISUAIS[id].anel ? 5.7 : 3.32;
}

export function iniciarInspetor(registrar) {
  const janela = document.querySelector("#inspetor");
  const modelo = document.querySelector("#modelo-vitrine");
  const movimentoReduzido = matchMedia("(prefers-reduced-motion: reduce)");
  const miniaturas = new Map();
  const observarMiniaturas = new IntersectionObserver(entradas => {
    for (const { target, isIntersecting } of entradas) {
      if (!isIntersecting || !target.clientWidth || !target.clientHeight) continue;
      const id = target.dataset.astro;
      const pronta = miniaturas.get(id);
      if (pronta) {
        target.width = pronta.width;
        target.height = pronta.height;
        target.getContext("2d").drawImage(pronta, 0, 0);
      } else {
        const motor = new RenderizadorAscii(target, 4.6);
        const camera = cameraOrbital(CENTRO, distanciaDaCamera(id) + .15, .27, .37, .92);
        motor.iniciar(camera);
        motor.astro(criarAstro(id, CENTRO, { raio: 1, luz: LUZ }));
        motor.finalizar();
        miniaturas.set(id, target);
      }
      observarMiniaturas.unobserve(target);
    }
  }, { rootMargin: "30px" });
  let origem;

  function criarVitrine(raiz, modal) {
    raiz.append(modelo.content.cloneNode(true));
    const campo = nome => raiz.querySelector(`[data-ficha="${nome}"]`);
    const canvas = campo("globo");
    const titulo = campo("titulo");
    const categoria = campo("categoria");
    const descricao = campo("descricao");
    const metricas = campo("metricas");
    const nasa = campo("nasa");
    const wikipedia = campo("wikipedia");
    const acao = campo("acao");
    const indicadores = campo("indicadores");
    const galeria = campo("galeria");
    const ajuda = campo("ajuda");
    const instrucao = campo("instrucao");
    const anuncio = campo("anuncio");
    const motor = new RenderizadorAscii(canvas, 6.5, 60);
    const camera = criarControlesCamera(canvas, { distancia: distanciaDaCamera("sol"), minimo: 1.35, maximo: 12, azimute: .24, elevacao: .32, lente: .88 });
    const cartoes = new Map();
    const pontos = new Map();
    let atual;
    let anterior;
    let transicao = 1;
    let tempo = 0;
    let ultimaCamera;
    let ultimoQuadro;
    let posicaoGaleria;

    const sufixo = modal ? "" : "-vitrine";
    canvas.id = "globo" + sufixo;
    titulo.id = "nome-astro" + sufixo;
    metricas.id = "metricas-astro" + sufixo;
    ajuda.id = "ajuda-globo" + sufixo;
    instrucao.id = "instrucao-galeria" + sufixo;
    canvas.setAttribute("aria-describedby", ajuda.id);
    galeria.setAttribute("aria-describedby", instrucao.id);
    if (modal) {
      acao.id = "fechar-inspetor";
      acao.textContent = "← Voltar ao Sistema Solar";
      acao.autofocus = true;
      acao.addEventListener("click", () => janela.close());
    } else {
      acao.textContent = "Tela cheia ↗";
      acao.addEventListener("click", () => abrir(atual, acao));
    }

    for (const id of ASTROS) {
      const nome = CORPOS_CELESTES[id].nome;
      const ponto = botao("", "vitrine__indicador");
      ponto.title = nome;
      ponto.setAttribute("aria-label", nome);
      ponto.addEventListener("click", () => selecionar(id, true));
      pontos.set(id, ponto);
      indicadores.append(ponto);

      const cartao = botao("", "botao-discreto vitrine__cartao");
      const miniatura = document.createElement("canvas");
      miniatura.dataset.astro = id;
      miniatura.setAttribute("aria-hidden", "true");
      cartao.append(miniatura, nome);
      cartao.addEventListener("click", () => selecionar(id));
      cartoes.set(id, cartao);
      galeria.append(cartao);
      observarMiniaturas.observe(miniatura);
    }

    function identificarLinhas() {
      const linhas = [];
      let topo = -Infinity;
      for (const cartao of cartoes.values()) {
        if (cartao.offsetTop !== topo) {
          topo = cartao.offsetTop;
          linhas.push([]);
        }
        linhas.at(-1).push(cartao);
      }
      return linhas;
    }

    function alinharElemento(controle, elemento) {
      if (!controle.clientHeight) return;
      const posicao = elemento.getBoundingClientRect().top - controle.getBoundingClientRect().top + controle.scrollTop;
      const topo = limitar(posicao - (controle.clientHeight - elemento.offsetHeight) / 2, 0, controle.scrollHeight - controle.clientHeight);
      if (Math.abs(topo - controle.scrollTop) < 1) return;
      controle.scrollTop = topo;
      if (controle === galeria) posicaoGaleria = controle.scrollTop;
    }

    function mudarAoRolar() {
      if (posicaoGaleria !== undefined && Math.abs(posicaoGaleria - galeria.scrollTop) < 1) {
        posicaoGaleria = undefined;
        return;
      }
      posicaoGaleria = undefined;
      const maximo = galeria.scrollHeight - galeria.clientHeight;
      if (maximo < 1) return;
      const linhas = identificarLinhas();
      const indice = Math.round(limitar(galeria.scrollTop / maximo) * (linhas.length - 1));
      const cartaoAtivo = cartoes.get(atual);
      const coluna = linhas.find(linha => linha.includes(cartaoAtivo))?.indexOf(cartaoAtivo) ?? 0;
      const cartao = linhas[indice][Math.min(coluna, linhas[indice].length - 1)];
      selecionar(cartao.querySelector("canvas").dataset.astro);
    }

    indicadores.addEventListener("keydown", evento => {
      const direcoes = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
      let indice = ASTROS.indexOf(atual);
      if (Object.hasOwn(direcoes, evento.key)) indice = limitar(indice + direcoes[evento.key], 0, ASTROS.length - 1);
      else if (evento.key === "Home") indice = 0;
      else if (evento.key === "End") indice = ASTROS.length - 1;
      else return;
      evento.preventDefault();
      const id = ASTROS[indice];
      selecionar(id, true);
      pontos.get(id).focus({ preventScroll: true });
    });

    galeria.addEventListener("scroll", mudarAoRolar, { passive: true });
    galeria.addEventListener("keydown", evento => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(evento.key)) return;
      evento.preventDefault();
      const salto = Math.max(1, identificarLinhas()[0].length);
      const passos = { ArrowUp: -salto, ArrowDown: salto, ArrowLeft: -1, ArrowRight: 1 };
      const id = ASTROS[limitar(ASTROS.indexOf(atual) + passos[evento.key], 0, ASTROS.length - 1)];
      selecionar(id, true);
      cartoes.get(id).focus({ preventScroll: true });
    });

    function adicionarMetrica(rotulo, valor, complemento) {
      const bloco = document.createElement("div");
      const termo = document.createElement("dt");
      const definicao = document.createElement("dd");
      termo.textContent = rotulo;
      definicao.append(valor);
      if (complemento) definicao.append(complemento);
      bloco.append(termo, definicao);
      metricas.append(bloco);
      return definicao;
    }

    function alimentarFicha(id) {
      const astro = CORPOS_CELESTES[id];
      const pai = CORPOS_CELESTES[astro.pai];
      const distanciaLocal = pai ? document.createElement("small") : null;
      if (distanciaLocal) {
        distanciaLocal.textContent = astro.distanciaDoPlaneta;
        distanciaLocal.className = "ficha__distancia-local";
      }

      titulo.textContent = astro.nome;
      categoria.textContent = astro.categoria;
      descricao.textContent = astro.descricao;
      canvas.setAttribute("aria-label", "Globo ASCII de " + astro.nome);
      metricas.replaceChildren();
      adicionarMetrica("Distância do Sol", pai ? "≈ " + pai.distanciaSol : astro.distanciaSol, distanciaLocal);
      adicionarMetrica("Diâmetro", astro.diametro);
      adicionarMetrica("Gravidade", astro.gravidade);
      adicionarMetrica("Temperatura média", astro.temperatura);
      adicionarMetrica("Período orbital", astro.translacao);

      const links = document.createElement("span");
      links.className = "ficha__luas";
      for (const lua of astro.luas) {
        const link = botao(CORPOS_CELESTES[lua].nome, "ficha__link");
        link.addEventListener("click", () => {
          selecionar(lua, true);
          pontos.get(lua).focus({ preventScroll: true });
        });
        links.append(link);
      }
      if (!astro.luas.length) {
        links.append("Sem luas");
        if (pai) {
          const link = botao("Voltar a " + pai.nome, "ficha__link");
          link.addEventListener("click", () => {
            selecionar(astro.pai, true);
            pontos.get(astro.pai).focus({ preventScroll: true });
          });
          links.append(link);
        }
      }
      adicionarMetrica("Luas", links);

      nasa.href = NASA[id] ? `https://science.nasa.gov/${NASA[id]}/` : "https://ssd.jpl.nasa.gov/sats/phys_par/";
      const verbete = astro.pai && id !== "lua" ? astro.nome + " (satélite)" : astro.nome;
      wikipedia.href = "https://pt.wikipedia.org/wiki/" + encodeURIComponent(verbete.replaceAll(" ", "_"));
    }

    function selecionar(id, alinharCartao = false, imediato = false) {
      if (!cartoes.has(id)) return;
      if (id !== atual || imediato) {
        anterior = atual;
        atual = id;
        transicao = anterior && !imediato && !movimentoReduzido.matches ? 0 : 1;
        if (transicao === 1) anterior = null;
        camera.focar(CENTRO, distanciaDaCamera(id), VISUAIS[id].anel ? 2.52 : 1.33, true);
        alimentarFicha(id);
        anuncio.textContent = CORPOS_CELESTES[id].nome;
        for (const [opcao, cartao] of cartoes) {
          const ativo = String(opcao === id);
          cartao.setAttribute("aria-pressed", ativo);
          const ponto = pontos.get(opcao);
          ponto.setAttribute("aria-pressed", ativo);
          ponto.tabIndex = opcao === id ? 0 : -1;
        }
      }
      alinharElemento(indicadores, pontos.get(id));
      if (alinharCartao) alinharElemento(galeria, cartoes.get(id));
    }

    registrar(canvas, dt => {
      if (!atual) return;
      const enquadramento = camera.quadro(CENTRO, dt);
      if (movimentoReduzido.matches && transicao >= 1 &&
          ultimoQuadro === atual && canvas.clientWidth === motor.largura && canvas.clientHeight === motor.altura &&
          ultimaCamera?.every((valor, i) => Math.abs(valor - enquadramento.posicao[i]) < .0001)) return;
      ultimaCamera = enquadramento.posicao;
      ultimoQuadro = atual;
      if (!movimentoReduzido.matches) tempo += dt;

      transicao = limitar(transicao + dt / .36);
      const retirada = anterior && transicao < .30;
      const id = retirada ? anterior : atual;
      const abertura = retirada ? 1 - suavizar(transicao / .30) : suavizar((transicao - .30) / .70);
      if (transicao === 1) anterior = null;
      if (!motor.iniciar(enquadramento, tempo, [.49, .49])) return;
      motor.estrelasAoFundo(.59);
      if (abertura > .025) {
        const astro = criarAstro(id, CENTRO, { raio: .68 + .32 * abertura, rotacao: tempo * .29, luz: LUZ });
        motor.astro(astro);
      }
      motor.finalizar(abertura);
    }, modal, 60);

    return { selecionar, acao };
  }

  function abrir(id, disparador = document.activeElement) {
    if (!Object.hasOwn(CORPOS_CELESTES, id)) return;
    const novaAbertura = !janela.open;
    if (novaAbertura) origem = disparador;
    expandida.selecionar(id, false, novaAbertura);
    if (novaAbertura) {
      janela.showModal();
      janela.scrollTop = 0;
      expandida.acao.focus({ preventScroll: true });
    }
    expandida.selecionar(id, true);
  }

  const expandida = criarVitrine(janela, true);
  const aberta = criarVitrine(document.querySelector("[data-vitrine-aberta]"), false);
  aberta.selecionar("sol", false, true);
  janela.addEventListener("close", () => origem?.focus({ preventScroll: true }));
  return abrir;
}