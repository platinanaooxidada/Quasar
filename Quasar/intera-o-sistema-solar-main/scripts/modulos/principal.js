import { iniciarExplorador } from "./explorador-solar.js";
import { iniciarInspetor } from "./inspetor-astro.js";
import { iniciarLinhaDoTempo } from "./linha-do-tempo.js";
import { iniciarViagem } from "./viagem-inicial.js";

const telas = new Map();
const janela = document.querySelector("#inspetor");
let pedido = 0;

function renderizar(agora) {
  pedido = 0;
  let ativo = false;
  let principal;
  for (const tela of telas.values()) {
    if (tela.visivel && janela.open === tela.modal && (!principal || tela.area > principal.area)) principal = tela;
  }
  for (const tela of telas.values()) {
    if (!tela.visivel || janela.open !== tela.modal || document.hidden ||
        (tela !== principal && tela.area < principal.area * .25)) {
      tela.anterior = tela.proximo = undefined;
      continue;
    }
    ativo = true;
    const intervalo = tela === principal ? tela.intervalo : Math.max(tela.intervalo, 1000 / 20);
    if (intervalo !== tela.intervaloAtual) tela.proximo = undefined;
    tela.intervaloAtual = intervalo;
    if (tela.proximo !== undefined && agora < tela.proximo - 1.5) continue;
    const duracao = agora - (tela.anterior ?? agora);
    tela.proximo = Math.max((tela.proximo ?? agora) + intervalo, agora + 1);
    tela.anterior = agora;
    tela.desenhar(Math.min(duracao / 1000, .10));
  }
  if (ativo) agendar();
}

function agendar() {
  if (!pedido && !document.hidden) pedido = requestAnimationFrame(renderizar);
}

const observador = new IntersectionObserver(entradas => {
  for (const entrada of entradas) {
    const tela = telas.get(entrada.target);
    tela.visivel = entrada.isIntersecting && entrada.intersectionRatio >= .15;
    tela.area = entrada.intersectionRect.width * entrada.intersectionRect.height;
    if (!tela.visivel) tela.anterior = tela.proximo = undefined;
  }
  agendar();
}, { threshold: [0, .15, .35, .60, .85, 1] });

function registrar(canvas, desenhar, modal = false, frequencia = 30) {
  const intervalo = 1000 / frequencia;
  telas.set(canvas, { desenhar, modal, intervalo, visivel: false });
  observador.observe(canvas);
}

document.addEventListener("visibilitychange", () => {
  for (const tela of telas.values()) tela.anterior = tela.proximo = undefined;
  agendar();
});
janela.addEventListener("close", agendar);

const links = [...document.querySelectorAll(".navegacao a")];
const secoes = links.map(link => document.querySelector(link.hash));
function atualizarNavegacao() {
  const ponto = Math.min(250, innerHeight * .42);
  let indice = secoes.findLastIndex(secao => secao.getBoundingClientRect().top <= ponto);
  if (scrollY > 0 && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) indice = secoes.length - 1;
  links.forEach((link, i) => {
    if (i === Math.max(0, indice)) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
window.addEventListener("scroll", atualizarNavegacao, { passive: true });
window.addEventListener("resize", atualizarNavegacao);
atualizarNavegacao();

const abrirInspetor = iniciarInspetor(registrar);
iniciarViagem(registrar);
iniciarExplorador(registrar, abrirInspetor);
iniciarLinhaDoTempo(registrar);