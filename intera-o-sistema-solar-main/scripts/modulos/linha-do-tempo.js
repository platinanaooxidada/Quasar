import { CORPOS_CELESTES, calcularSistema, criarAstro } from "../dados/dados-celestes.js";
import { FASES, longitudesPlanetarias } from "../dados/fases-cosmicas.js";
import { RenderizadorAscii, cameraOrbital, escalar, interpolar, limitar, ruido, suavizar } from "../motor/renderizador-ascii.js";

const VOLTA = Math.PI * 2;
const TOTAL = FASES.length * 1000;
const NUMERO = new Intl.NumberFormat("pt-BR");
const DATA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });
const POEIRA = ["#a16037", "#eb8928", "#d5a45e", "#ffc83a", "#f2eee4"];
const NEBULOSA = ["#51438a", "#7361ba", "#4ea8ff", "#8fd3ff", "#87b8ad", "#eabc67"];
const QUENTE = [255, 105, 55];
const VERMELHO = [255, 108, 51];
const SUPERFICIE_GIGANTE = [[177, 56, 32], VERMELHO, [255, 176, 80], [255, 218, 148]];
const PLUMA_COR = ["#b54f2f", "#eb7637", "#ffc07f"];
const BRANCO = [207, 242, 255];
const CIFRA = "*/!+%0#?:><[]";
const LONGITUDES_ATUAIS = longitudesPlanetarias();

function discoEmEspiral(motor, tempo, quantidade, raio, altura, opacidade) {
  for (let i = 0; i < quantidade; i++) {
    const r = ruido(i, 41) ** 1.16 * raio;
    const a = i % 4 * VOLTA / 4 + r * .17 + ruido(i, 42) * 1.65 + tempo * (.09 + .8 / (r + 4));
    const y = (ruido(i, 43) - .5) * altura * (.2 + .8 * r / raio);
    const letra = i % 13 === 0 ? "+" : i % 5 === 0 ? ":" : ".";
    const cor = POEIRA[(i + (r < raio * .2 ? 2 : 0)) % POEIRA.length];
    motor.ponto([r * Math.cos(a), y, r * Math.sin(a)], letra, cor, opacidade * (.35 + ruido(i, 40) * .65), i % 13 === 0);
  }
}

function clarao(motor, progresso, escala) {
  const pulso = Math.max(0, 1 - progresso * 3.8) ** 1.35;
  if (pulso <= .008) return;
  const centro = motor.projetar([0, 0, 0]);
  if (!centro) return;

  const raioBase = motor.altura * escala;
  motor.disco(centro, raioBase * .34, "#eb8928", pulso * .25);
  motor.disco(centro, raioBase * .15, "#fff1cc", pulso * .76);
  for (let i = 0; i < 38; i++) {
    const a = (i + ruido(i, 59) * .65) * VOLTA / 38;
    const raio = raioBase * (.23 + ruido(i, 60) * .59);
    const cor = i % 5 ? "#ffdfa0" : "#fff8e4";
    const glifo = Math.abs(Math.sin(a)) < .27 ? "-" : Math.abs(Math.cos(a)) < .27 ? "|" : Math.sin(2 * a) > 0 ? "\\" : "/";
    for (let r = motor.passoY; r < raio; r += motor.passoY * .7) {
      const x = centro.x + r * Math.cos(a);
      const y = centro.y + r * Math.sin(a);
      const luz = pulso * (1 - r / raio) ** .77;
      motor.caractere(x, y, glifo, cor, luz, i % 3 === 0);
      if (i % 3 === 0) motor.caractere(x + motor.passoX, y, "·", "#ffc27a", luz * .52);
    }
  }
}

function plumas(motor, tempo, raio, progresso) {
  const intensidade = suavizar(progresso * 1.5);
  const quantidade = Math.round(300 / motor.densidade);
  for (let braco = 0; braco < 5; braco++) {
    const direcao = .54 + braco * VOLTA / 5;
    for (let i = 0; i < quantidade; i++) {
      const t = (ruido(i, braco + 65) + tempo * .12) % 1;
      const abertura = (ruido(i, braco + 70) - .5) * (.59 - t * .29);
      const a = direcao + Math.sin(t * 4 - tempo * .8) * .13 + abertura;
      const x = Math.cos(a) * raio * (.89 + t * (1.08 + progresso * .61));
      const y = Math.sin(a) * raio * (.89 + t * (.88 + progresso * .49));
      const luminosidade = intensidade * .81 * (1 - t) ** 1.5;
      const cor = PLUMA_COR[t < .25 ? 2 : t < .59 ? 1 : 0];
      motor.ponto([x, y, (ruido(i, 76) - .5) * 9], i % 5 ? ":" : "#", cor, luminosidade, i % 5 === 0);
    }
  }
}

function nebulosaBipolar(motor, tempo, expansao, opacidade) {
  const n = Math.round(3100 / motor.densidade);
  for (let i = 0; i < n; i++) {
    const lado = i % 2 ? 1 : -1;
    const t = ruido(i, 81);
    const a = ruido(i, 82) * VOLTA + tempo * .16;
    const r = (3.1 + Math.sin(t * Math.PI) * 14.5) * expansao * (.60 + ruido(i, 83) * .40);
    const y = lado * (t * 39 + ruido(i, 84) * 3) * expansao;
    const cor = NEBULOSA[Math.floor(ruido(i, 85) * NEBULOSA.length)];
    const letra = i % 11 === 0 ? "0" : i % 5 === 0 ? "+" : i % 3 === 0 ? ":" : ".";
    motor.ponto([r * Math.cos(a), y, r * Math.sin(a)], letra, cor, opacidade * (.33 + .65 * (1 - t)), i % 10 === 0);
  }

  const quantidade = Math.round(560 / motor.densidade);
  for (let i = 0; i < quantidade; i++) {
    const a = ruido(i, 86) * VOLTA + tempo * .07;
    const raio = (6.2 + ruido(i, 87) * 3.2) * expansao;
    const x = raio * Math.cos(a);
    const z = raio * Math.sin(a);
    const altura = .29 * z - .18 * x + (ruido(i, 88) - .5) * 3;
    const cor = i % 7 === 0 ? "#f2eee4" : i % 3 ? "#dba952" : "#8fd3ff";
    motor.ponto([x, altura, z], i % 8 ? "." : "+", cor, opacidade * (.43 + ruido(i, 89) * .51), i % 8 === 0);
  }
}

function cometa(motor, tempo) {
  for (let i = 0; i < 27; i++) {
    const a = tempo * .34 - i * .016 + 1.8;
    motor.ponto([35 * Math.cos(a), 4 + Math.sin(a * 2) * 6, 31 * Math.sin(a)], i < 2 ? "+" : ".", "#8fd3ff", .84 * (1 - i / 27), i === 0);
  }
}

function planetasDaFase(motor, fase, progresso, tempo, opacidade) {
  const astros = calcularSistema(tempo * .55, false).slice(1);
  const gigantes = fase >= 5;
  const entrada = fase === 2 ? suavizar(progresso * 1.25 + .09) : 1;
  const raioSolar = 3.7 + suavizar(progresso) * 21.9;
  const visiveis = [];
  for (const [i, astro] of astros.entries()) {
    if (gigantes && i < 4 && (fase > 5 || raioSolar > astro.orbita + astro.raio)) continue;
    const angulo = LONGITUDES_ATUAIS[astro.id] + progresso * .12 / Math.sqrt(astro.periodo);
    const posicao = fase === 3
      ? [astro.orbita * Math.cos(angulo), 0, astro.orbita * Math.sin(angulo)]
      : astro.posicao;
    const afastamento = i >= 4 && gigantes ? (fase === 5 ? 1 + progresso * .61 : 1.61) : 1;
    const corOrbita = gigantes ? "#8293a3" : "#a9a79e";
    motor.orbita([0, 0, 0], astro.orbita * afastamento, corOrbita, opacidade * entrada * (i < 4 ? .34 : .48));
    visiveis.push({
      ...astro, posicao: escalar(posicao, afastamento), raio: astro.raio * (1.12 + i * .02) * entrada
    });
  }
  if (!gigantes) {
    motor.asteroides(17, 320, .72 * entrada, tempo);
    if (fase === 2) cometa(motor, tempo);
  }
  return visiveis;
}

function rotular(motor, astros) {
  const caixas = [];
  const ctx = motor.ctx;
  ctx.save();
  ctx.font = '9px "Space Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillStyle = "#a2b8cb";
  const sol = motor.projetados.get("sol");
  for (const { id } of astros) {
    const p = motor.projetados.get(id);
    if (!p) continue;
    const nome = CORPOS_CELESTES[id].nome.toLocaleUpperCase("pt-BR");
    const largura = ctx.measureText(nome).width;
    const y = p.y + 3;
    if (y < 100 || y > motor.altura - 93) continue;
    const x = [p.x + p.raio + 6, p.x - p.raio - largura - 6].find(inicio => {
      const fim = inicio + largura;
      if (inicio < 8 || fim > motor.largura - 8) return false;
      if (sol && Math.hypot(sol.x - limitar(sol.x, inicio, fim), sol.y - y) < sol.raio + 7) return false;
      return !caixas.some(c => Math.abs(c.y - y) < 12 && inicio < c.x + c.largura + 5 && fim + 5 > c.x);
    });
    if (x === undefined) continue;
    ctx.fillText(nome, x, y);
    caixas.push({ x, y, largura });
  }
  ctx.restore();
}

function desenharCena(motor, fase, progresso, tempo) {
  const largura = motor.canvas.clientWidth;
  const lente = largura < 640 ? .86 : 1.04;
  const expande = fase === 5 ? suavizar(progresso) : Number(fase > 5);
  const distancia = interpolar(101, 143, expande);
  const camera = cameraOrbital([0, 0, 0], distancia, .26 + .11 * Math.sin(tempo * .19), .49, lente);
  if (!motor.iniciar(camera, tempo, [.5, .52])) return;
  motor.estrelasAoFundo(fase === 8 ? 1 - progresso * .45 : .88);
  const raios = [1.25 + progresso * 1.5, 2.9 + progresso * .45, 3.35, 3.35, 3.35,
    3.7 + expande * 21.9, 2.3 - progresso * 1.25, .95, .91];
  const sol = criarAstro("sol", [0, 0, 0], { raio: raios[fase], rotacao: tempo * .31 });
  const opacidade = fase === 8 ? 1 - suavizar(progresso) : 1;
  const planetas = fase < 2 ? [] : planetasDaFase(motor, fase, progresso, tempo, opacidade);

  switch (fase) {
    case 0:
      motor.disco({ x: motor.cx, y: motor.cy }, motor.altura * .43, "#794f27", .18);
      discoEmEspiral(motor, tempo, Math.round(2840 / motor.densidade), 55 - progresso * 23, 28 - progresso * 23, .94);
      break;
    case 1:
      discoEmEspiral(motor, tempo, 1400, 29 + progresso * 13, 3.0, .84);
      for (const raio of [7, 12, 18, 26, 36]) motor.orbita([0, 0, 0], raio, "#ffc83a", .31 + .24 * progresso);
      clarao(motor, progresso, .84);
      break;
    case 2:
      discoEmEspiral(motor, tempo, 1000, 44, 2.1, .68 * (1 - progresso));
      break;
    case 4:
      sol.cor = QUENTE;
      sol.raio += progresso * .56 + Math.sin(tempo * (2 + progresso * 2)) * .24 * progresso;
      break;
    case 5:
      sol.cor = VERMELHO;
      sol.paletaEmissiva = SUPERFICIE_GIGANTE;
      plumas(motor, tempo, sol.raio, progresso);
      break;
    case 6:
      sol.cor = BRANCO;
      nebulosaBipolar(motor, tempo, .40 + progresso * .79, suavizar(progresso * 3.7) * (.99 - progresso * .33));
      clarao(motor, progresso, 1.68);
      break;
    case 7:
      sol.cor = BRANCO;
      nebulosaBipolar(motor, tempo, 1.19 + progresso * .38, .66 * (1 - progresso * .74));
      motor.orbita([0, 0, 0], 13.7, "#8fd3ff", .38);
      break;
    case 8:
      sol.cor = BRANCO;
      nebulosaBipolar(motor, tempo, 1.57 + progresso * 1.5, .17 * opacidade);
      discoEmEspiral(motor, tempo, 1500, 27 + progresso * 90, 8 + progresso * 18, .52 * opacidade);
      sol.raio *= .25 + .75 * opacidade;
      break;
  }

  for (const planeta of planetas) motor.astro(planeta);
  if (opacidade > .02) motor.astro(sol);
  motor.finalizar(opacidade);
  if (fase < 8) rotular(motor, planetas);
}

function marcarTempo(fase, progresso) {
  if (fase === 3) {
    const legenda = DATA.formatToParts(new Date()).filter(parte => parte.type !== "literal")
      .map(parte => parte.value.replace(".", "")).join(" ");
    return ["hoje", legenda];
  }
  const atual = FASES[fase];
  const t = fase === 2 ? 1 - (1 - progresso) ** 5.4 : progresso;
  const anos = Math.round(interpolar(atual.inicio, atual.fim, t));
  return [NUMERO.format(Math.abs(anos)), fase < 3 ? "anos atrás" : "anos no futuro"];
}

export function iniciarLinhaDoTempo(registrar) {
  const canvas = document.querySelector("#cena-temporal");
  const motor = new RenderizadorAscii(canvas, 8);
  const romano = document.querySelector("#numero-fase");
  const titulo = document.querySelector("#nome-fase");
  const descricao = document.querySelector("#descricao-fase");
  const anuncio = document.querySelector("#anuncio-fase");
  const numero = document.querySelector("#contador-cosmico");
  const unidade = document.querySelector("#unidade-cosmica");
  const barra = document.querySelector("#barra-temporal");
  const reproducao = document.querySelector("#reproduzir-tempo");
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let reproduzindo = !reduzido;
  let cursor = 0;
  let fase = -1;
  let decodificar = 1;
  let tempoVisual = 0;
  let anterior = -1;
  let larguraAnterior = 0;
  let alturaAnterior = 0;

  function atualizarBotao() {
    const icone = document.createElement("span");
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = reproduzindo ? "||" : ">";
    reproducao.replaceChildren(icone, reproduzindo ? " Pausar" : " Reproduzir");
  }

  function selecionar(valor) {
    reproduzindo = false;
    cursor = limitar(valor, 0, TOTAL);
    atualizarBotao();
  }

  function passo(direcao) {
    const atual = Math.min(FASES.length - 1, Math.floor(cursor / 1000));
    selecionar(((atual + direcao + FASES.length) % FASES.length) * 1000);
  }

  for (const marco of document.querySelectorAll("#marcos-temporais button")) {
    const valor = Number(marco.dataset.tempo);
    marco.style.left = valor / TOTAL * 100 + "%";
    marco.addEventListener("click", () => selecionar(valor));
  }
  barra.addEventListener("input", () => selecionar(Number(barra.value)));
  document.querySelector("#fase-anterior").addEventListener("click", () => passo(-1));
  document.querySelector("#proxima-fase").addEventListener("click", () => passo(1));
  reproducao.addEventListener("click", () => {
    reproduzindo = !reproduzindo;
    if (reproduzindo && cursor >= TOTAL) cursor = 0;
    atualizarBotao();
  });
  atualizarBotao();

  registrar(canvas, dt => {
    if (reproduzindo) {
      tempoVisual += dt;
      const atual = FASES[Math.min(FASES.length - 1, Math.floor(cursor / 1000))];
      cursor = (cursor + (dt * 1000) / atual.duracao) % TOTAL;
    }
    const novaFase = Math.min(FASES.length - 1, Math.floor(cursor / 1000));
    const progresso = (cursor - novaFase * 1000) / 1000;
    const dados = FASES[novaFase];
    if (fase !== novaFase) {
      decodificar = fase < 0 || reduzido ? 1 : 0;
      fase = novaFase;
      romano.textContent = dados.romano;
      descricao.textContent = dados.descricao;
      anuncio.textContent = dados.romano + " · " + dados.nome;
      titulo.textContent = dados.nome;
    }
    if (decodificar < 1) {
      decodificar = limitar(decodificar + dt / .35);
      const limite = Math.ceil(decodificar * dados.nome.length);
      titulo.textContent = [...dados.nome].map((letra, i) =>
        i < limite || letra === " " ? letra : CIFRA[(Math.floor(decodificar * 21) + i * 7) % CIFRA.length]
      ).join("");
    }
    if (anterior === cursor && larguraAnterior === canvas.clientWidth && alturaAnterior === canvas.clientHeight) return;
    anterior = cursor;
    larguraAnterior = canvas.clientWidth;
    alturaAnterior = canvas.clientHeight;
    const [valor, legenda] = marcarTempo(fase, progresso);
    numero.textContent = valor;
    unidade.textContent = legenda;
    barra.value = String(Math.round(cursor));
    barra.style.setProperty("--progresso", cursor / TOTAL * 100 + "%");
    barra.setAttribute("aria-valuetext", dados.nome + " · " + (fase === 3 ? legenda : valor + " " + legenda));
    desenharCena(motor, fase, progresso, tempoVisual + fase * 2.5 + progresso * 3);
  });
}