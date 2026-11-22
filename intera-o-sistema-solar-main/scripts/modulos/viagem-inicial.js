import { criarAstro } from "../dados/dados-celestes.js";
import { RenderizadorAscii, cameraOrbital, interpolar, limitar, ruido, suavizar } from "../motor/renderizador-ascii.js";

const ETAPAS = [
  [0, "Plataforma e ignição"], [3, "Ascensão e inclinação orbital"], [7, "Separação de estágios"],
  [10, "Órbita da Terra e da Lua"], [16, "Travessia pelo Sistema Solar"], [23, "Espiral da Via Láctea"]
];
const VOLTA = Math.PI * 2;
const PLUMA = ["#80251c", "#e85724", "#eb8928", "#ffc83a", "#f2eee4"];
const METAL = ["#58656e", "#909a9b", "#cbd1c8", "#fff4d7"];
const PINTURA = ["#773822", "#a8462b", "#d36644", "#f78b56"];
const FOGUETE = [
  [-3.7, -3.22, .77, .75, "base"], [-3.22, -.45, .75, .75, "principal"],
  [-.45, .22, .75, .71, "faixa"], [.22, 1.6, .71, .71, "principal"],
  [1.6, 2.12, .71, .49, "faixa"], [2.12, 2.93, .49, .49, "principal"],
  [2.93, 3.42, .49, .22, "principal"], [3.42, 3.76, .22, .09, "faixa"], [3.76, 4.37, .065, .028, "torre"]
];
const GALAXIA = ["#344d85", "#4b82b5", "#8fd3ff", "#a5bbdd", "#eb8928", "#f2dfb4"];

function transformar(x, y, z, origem, angulo) {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return [origem[0] + x * c + y * s, origem[1] + y * c - x * s, origem[2] + z];
}

function desenharFoguete(motor, origem, angulo, faixa, amostra = 1) {
  const pontos = [];
  amostra /= Math.sqrt(motor.densidade);
  for (const [baixo, alto, raioBaixo, raioAlto, pintura] of faixa) {
    const niveis = Math.max(2, Math.ceil((alto - baixo) * 11 * amostra));
    for (let nivel = 0; nivel < niveis; nivel++) {
      const t = nivel / niveis;
      const altura = interpolar(baixo, alto, t);
      const raio = interpolar(raioBaixo, raioAlto, t);
      const colunas = Math.max(7, Math.round(raio * 43 * amostra));
      for (let i = 0; i < colunas; i++) {
        const anguloFace = i * VOLTA / colunas;
        const seno = Math.sin(anguloFace);
        const cosseno = Math.cos(anguloFace);
        const p = motor.projetar(transformar(cosseno * raio, altura, seno * raio, origem, angulo));
        if (!p) continue;
        const luz = limitar(.56 + .30 * seno + .27 * cosseno);
        const faixaEscura = pintura === "faixa" || (pintura === "base" && i % 5 < 3) ||
          (pintura === "principal" && baixo < 0 && (t < .10 || (t > .78 && i % 7 < 2)));
        const pintado = pintura === "principal" && baixo > 0 && t > .54 && t < .68;
        const cor = faixaEscura ? (luz > .62 ? "#8094a9" : "#3e4f63") : (pintado ? PINTURA : METAL)[Math.floor(luz * 3.99)];
        const glifo = ["0", "H", "=", "+"][Math.floor(ruido(nivel, i + 30) * 4)];
        const letra = faixaEscura ? (i % 3 ? ":" : "=") : (luz > .42 ? glifo : "+");
        pontos.push({ ...p, letra, cor });
      }
    }
  }
  pontos.sort((a, b) => b.z - a.z);
  for (const p of pontos) {
    motor.caractere(p.x, p.y, p.letra, p.cor, luzDoFoguete(p.z), p.cor === METAL[3] && p.letra === "0");
  }
  for (const altura of [-2.5, -2, .95, 1.2, 2.6]) {
    if (faixa.some(([baixo, alto]) => altura >= baixo && altura <= alto)) {
      const raio = altura > 2 ? .50 : .72;
      motor.ponto(transformar(.16, altura, raio, origem, angulo), "+", "#dd6b3d", .97);
    }
  }
}

function luzDoFoguete(profundidade) {
  return limitar(18 / profundidade, .33, 1);
}

function exaustao(motor, origem, angulo, base, comprimento, tempo, potencia) {
  const bocal = motor.projetar(transformar(0, base - .25, 0, origem, angulo));
  if (bocal) motor.disco(bocal, Math.max(motor.altura * .08, 28), "#eb8928", .24 * potencia);
  const quantidade = Math.round(1050 * potencia / motor.densidade);
  for (let i = 0; i < quantidade; i++) {
    const vida = (ruido(i, 1) + tempo * (.51 + ruido(i, 2) * .22)) % 1;
    const abertura = .26 + vida * 1.04;
    const a = ruido(i, 4) * VOLTA + 3 * vida;
    const amplitude = (ruido(i, 5) ** .8) * abertura;
    const x = Math.cos(a) * amplitude + Math.sin(vida * 10 - tempo * 6) * vida * .27;
    const z = Math.sin(a) * amplitude;
    const y = base - vida * comprimento * (.66 + .34 * ruido(i, 6));
    const cor = PLUMA[Math.min(4, Math.floor((1 - vida) * 5))];
    motor.ponto(transformar(x, y, z, origem, angulo), vida < .24 ? (i % 2 ? "#" : "@") : vida < .58 ? "*" : ".", cor, (1 - vida) ** .73, i % 4 === 0);
  }
}

function plataforma(motor, subida, tempo) {
  const solo = -4.12 - subida;
  for (let i = 0; i < 44; i++) {
    const z = i * .67 - 21;
    motor.linha([-19, solo, z], [15, solo, z], "#c87740", .32, "·", 14);
  }
  for (let x = -18; x <= 14; x += 1.5) motor.linha([x, solo, -22], [x, solo, 5], "#c87740", .27, "·", 13);

  const esquerda = -3.05;
  const direita = -2.0;
  for (const x of [esquerda, direita]) {
    motor.linha([x, solo, .2], [x, solo + 8.45, .2], "#cf915e", .76, "¦", 5);
    motor.linha([x, solo, -1.16], [x, solo + 8.45, -1.16], "#a96e4c", .63, "|", 6);
  }
  for (let i = 0; i < 10; i++) {
    const y = solo + i * .82;
    motor.linha([esquerda, y, .2], [direita, y, .2], "#d19261", .70, "=", 5);
    motor.linha([esquerda, y, .19], [direita, y + .81, .19], "#8c5945", .86, "/", 5);
    if (i % 3 === 1) motor.linha([direita, y, .16], [-.62, y + .11, .16], "#c18350", .72, "=", 5);
  }
  motor.ponto([-2.56, solo + 8.55, .15], "*", "#ff6b4a", .65 + .35 * Math.sin(tempo * 5), true);

  for (let i = 0; i < 16; i++) {
    const x = (i - 7.5) * 1.65;
    const z = -5 - ruido(i, 7) * 8;
    const alto = .19 + ruido(i, 8) * .79;
    for (let faixa = 0; faixa < 7; faixa++) {
      const y = solo + alto * faixa / 7;
      const largura = .54 * Math.sqrt(1 - (faixa / 7) ** 4);
      motor.linha([x - largura, y, z], [x + largura, y, z], faixa % 3 ? "#995430" : "#df8c48", .55, "=", 7);
    }
    motor.ponto([x, solo + .33, z + .08], "+", "#ffc073", .69);
  }

  for (let i = 0; i < 530; i++) {
    const a = ruido(i, 18) * VOLTA;
    const distancia = ((tempo * .48 + ruido(i, 19)) % 1) ** .64 * (2.0 + ruido(i, 21) * 5);
    const x = Math.cos(a) * distancia;
    const z = Math.sin(a) * distancia;
    motor.ponto([x, solo + ruido(i, 20) * .5, z], i % 3 ? "." : ":", PLUMA[i % 4], .65 * (1 - distancia / 7), i % 9 === 0);
  }
}

function horizonte(motor, intensidade, subida = 0) {
  const ctx = motor.ctx;
  const centro = { x: motor.largura * .83, y: motor.altura * (1.39 + subida) };
  const raio = motor.altura * .78;
  const gradiente = ctx.createRadialGradient(centro.x, centro.y, raio * .55, centro.x, centro.y, raio * 1.2);
  gradiente.addColorStop(0, "#030611");
  gradiente.addColorStop(.59, "#071226");
  gradiente.addColorStop(.70, "#143b55");
  gradiente.addColorStop(.73, "#346786");
  gradiente.addColorStop(.83, "#0b203a");
  gradiente.addColorStop(1, "transparent");
  ctx.globalAlpha = intensidade * .85;
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, motor.largura, motor.altura);
  ctx.globalAlpha = 1;

  for (let anel = 0; anel < 6; anel++) {
    const r = raio * (.99 + anel * .10);
    for (let i = 0; i < 220; i++) {
      const a = Math.PI * (1.01 + i / 214);
      const cor = anel > 1 ? "#875632" : "#5d9cbb";
      motor.caractere(centro.x + r * Math.cos(a), centro.y + r * Math.sin(a), i % 19 ? "·" : "+", cor, intensidade * (anel > 1 ? .43 : .80));
    }
  }
}

function lancamento(motor, tempo, centro) {
  const subida = suavizar((tempo - 2.7) / 4.3);
  const separar = suavizar((tempo - 7) / 3);
  const inclinacao = .78 * suavizar((tempo - 4.5) / 3);
  const altura = 2.45 * subida + .85 * separar;
  const origem = [.42 * subida + .65 * separar, altura, 0];
  const afastamento = 13.85 + 5.35 * suavizar((tempo - 1.1) / 5.9) + 4 * separar;
  const camera = cameraOrbital([.5 * subida, altura * .62, 0], afastamento, .27 - .47 * subida, .02 + .23 * subida, .93);
  if (!motor.iniciar(camera, tempo, centro)) return;
  horizonte(motor, interpolar(.48, 1, subida), .055 * subida);
  motor.estrelasAoFundo(.82, subida * .05);
  if (tempo < 6.8) plataforma(motor, 12 * subida, tempo);

  if (tempo < 7) {
    exaustao(motor, origem, inclinacao, -3.5, 1.65 + 5.6 * subida, tempo, .56 + .36 * subida);
    desenharFoguete(motor, origem, inclinacao, FOGUETE);
  } else {
    const primeiroEstagio = [origem[0] - 3.7 * separar, altura - 5.1 * separar, -2 * separar];
    exaustao(motor, origem, inclinacao, -.64, 2.5 + separar * 2.4, tempo, .78);
    desenharFoguete(motor, primeiroEstagio, inclinacao - .47 * separar, FOGUETE.slice(0, 2), .76);
    desenharFoguete(motor, origem, inclinacao, FOGUETE.slice(2));
  }
}

function orbitaTerrestre(motor, tempo, centro) {
  const fase = suavizar((tempo - 10) / 6);
  const camera = cameraOrbital([0, 0, 0], interpolar(10.8, 23, fase), -.27 + fase * .61, .13 + fase * .12, 1);
  if (!motor.iniciar(camera, tempo, centro)) return;
  motor.estrelasAoFundo(.92, fase * .1);
  motor.orbita([0, 0, 0], 6.85, "#8fd3ff", .45, .22);
  motor.orbita([0, 0, 0], 9.35, "#eb8928", .22, -.16);
  motor.astro(criarAstro("terra", [.25, -.4, 0], { raio: 3.45, rotacao: tempo * .26, luz: [-.87, .39, -.27], halo: "#4ea8ff" }));
  motor.astro(criarAstro("lua", [-4.1 + fase, 2.65 + fase * .2, .9], { raio: .84, luz: [-.8, .56, .28], rotacao: .21 * fase }));
}

function travessia(motor, tempo, centro) {
  const fase = suavizar((tempo - 16) / 7);
  const camera = cameraOrbital([.5 - fase * 5, 0, 0], 29 + fase * 17, -.27 + fase * .94, .35, .84);
  if (!motor.iniciar(camera, tempo, centro)) return;
  motor.estrelasAoFundo(1, (tempo - 16) * .021);
  for (const raio of [7, 10, 13, 16, 20, 26, 33]) motor.orbita([-5, 0, 0], raio, "#c8935b", .38);
  motor.asteroides(10.45, 310, .8);
  const corpos = [
    criarAstro("sol", [-5, 0, 0], { raio: 4.2 }),
    criarAstro("jupiter", [4, 1.15, 4], { raio: 2.3, rotacao: tempo * .4, luz: [-.7, .35, .70] }),
    criarAstro("saturno", [9, -.39, -5], { raio: 1.9, rotacao: tempo * .35, luz: [-.7, .35, .7] }),
    criarAstro("urano", [13, 2.3, -9], { raio: 1.07, luz: [-.6, .35, .68] }),
    criarAstro("netuno", [-11, -1.5, -10], { raio: 1.16, luz: [-.57, .35, .65] })
  ];
  for (const astro of corpos) motor.astro(astro);
}

function viaLactea(motor, tempo, centro) {
  const fase = suavizar((tempo - 23.75) / 6.25);
  const entrada = suavizar((tempo - 23.75) / 2.3);
  const camera = cameraOrbital([0, 0, 0], 18 + fase * 13, -.49 + fase * .7, .20 + fase * .56, .94);
  if (!motor.iniciar(camera, tempo, centro)) return;
  motor.estrelasAoFundo(1, (tempo - 23) * .033);
  for (let i = 0; i < 165 && entrada < 1; i++) {
    const angulo = ruido(i, 89) * VOLTA;
    const distancia = motor.altura * (.11 + ruido(i, 91) * .64);
    const passagem = (ruido(i, 93) + (tempo - 23) * .55) % 1;
    const x = motor.cx + Math.cos(angulo) * distancia * passagem ** 1.6;
    const y = motor.cy + Math.sin(angulo) * distancia * passagem ** 1.6;
    motor.caractere(x, y, i % 6 ? "·" : "+", GALAXIA[i % 4], (1 - entrada) * passagem);
  }

  motor.disco({ x: motor.cx, y: motor.cy }, motor.altura * .36, "#204071", .23 * entrada);
  const n = Math.round(5200 / motor.densidade);
  for (let i = 0; i < n; i++) {
    const braco = (i % 4) * VOLTA / 4;
    const raio = 15.3 * ruido(i, 30) ** 1.14;
    const espessura = (.69 + 2.7 / (1 + raio)) * (ruido(i, 31) - .5);
    const a = braco + raio * .31 + espessura + tempo * .105;
    const altura = (ruido(i, 32) - .5) * (1.45 / (1 + raio * .17));
    const cor = raio < 2.7 ? GALAXIA[4 + i % 2] : GALAXIA[i % 4];
    const letra = raio < 2.7 ? (i % 6 ? "+" : "#") : (i % 8 ? ":" : "+");
    motor.ponto([raio * Math.cos(a), altura, raio * Math.sin(a)], letra, cor, entrada * (.35 + ruido(i, 34) * .6), i % 13 === 0 || raio < 1.34);
  }
}

export function iniciarViagem(registrar) {
  const canvas = document.querySelector("#viagem");
  const etapa = document.querySelector("#etapa-viagem");
  const relogio = document.querySelector("#tempo-viagem");
  const progresso = document.querySelector("#progresso-viagem");
  const botao = document.querySelector("#pausar-viagem");
  const motor = new RenderizadorAscii(canvas, 8.7);
  let pausado = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tempo = pausado ? 11.2 : 0;
  let ultimo = -1;
  let larguraAnterior;
  let alturaAnterior;

  function atualizarBotao() {
    botao.textContent = pausado ? ">" : "||";
    botao.setAttribute("aria-label", pausado ? "Reproduzir viagem" : "Pausar viagem");
  }
  botao.disabled = false;
  atualizarBotao();
  botao.addEventListener("click", () => {
    pausado = !pausado;
    atualizarBotao();
  });

  registrar(canvas, dt => {
    if (pausado && ultimo === tempo && larguraAnterior === canvas.clientWidth && alturaAnterior === canvas.clientHeight) return;
    if (!pausado) tempo = (tempo + dt) % 30;
    ultimo = tempo;
    larguraAnterior = canvas.clientWidth;
    alturaAnterior = canvas.clientHeight;
    const estreito = larguraAnterior < 710;
    const centro = estreito ? [.73, .30] : [.745, .46];
    if (tempo < 10) lancamento(motor, tempo, centro);
    else if (tempo < 16) orbitaTerrestre(motor, tempo, centro);
    else if (tempo < 23) travessia(motor, tempo, centro);
    else viaLactea(motor, tempo, centro);
    motor.finalizar();

    const indice = ETAPAS.findLastIndex(([inicio]) => tempo >= inicio);
    const [inicio, rotulo] = ETAPAS[indice];
    const fim = ETAPAS[indice + 1]?.[0] ?? 30;
    if (indice === 2 || indice >= 3) {
      const opacidade = Math.max(indice >= 3 ? 1 - (tempo - inicio) / .32 : 0, 1 - (fim - tempo) / .40, 0);
      if (opacidade > 0) {
        motor.ctx.fillStyle = `rgba(2, 3, 7, ${opacidade})`;
        motor.ctx.fillRect(0, 0, motor.largura, motor.altura);
      }
    }
    if (etapa.textContent !== rotulo) etapa.textContent = rotulo;
    relogio.textContent = "T+" + String(Math.floor(tempo)).padStart(2, "0") + " s";
    progresso.style.width = tempo / 30 * 100 + "%";
  });
}