import { cameraOrbital, escalar, limitar, normalizar, somar, subtrair } from "./renderizador-ascii.js";

const SETAS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const MOVIMENTO = { ...SETAS, a: SETAS.ArrowLeft, d: SETAS.ArrowRight, w: SETAS.ArrowUp, s: SETAS.ArrowDown };

export function criarControlesCamera(canvas, configuracao) {
  const {
    distancia, minimo, maximo, azimute = .15, elevacao = .65,
    lente = 1, selecionar = () => {}, zoom = () => {},
    moverVoo = (posicao, direcao, passo) => somar(posicao, escalar(direcao, passo * 24))
  } = configuracao;
  const ponteiros = new Map();
  const teclas = new Set();
  const direcoes = new Set();
  const estado = {
    alvo: [0, 0, 0], distancia, azimute, elevacao, minimo, voo: null,
    azimuteDesejado: azimute, elevacaoDesejada: elevacao, distanciaDesejada: distancia
  };
  let gesto;
  let deslocamento = 0;

  function girar(x, y) {
    estado.azimuteDesejado -= x * .008;
    estado.elevacaoDesejada = limitar(estado.elevacaoDesejada + y * .008, -1.50, 1.50);
  }

  function aproximar(fator) {
    if (estado.voo) {
      const direcao = normalizar(subtrair(estado.voo, calcular([0, 0, 0]).alvo));
      estado.voo = moverVoo(estado.voo, direcao, Math.log(fator) * .46);
    } else {
      estado.distanciaDesejada = limitar(estado.distanciaDesejada * fator, estado.minimo, maximo);
    }
    zoom();
  }

  function calcular(alvo) {
    if (!estado.voo) return cameraOrbital(alvo, estado.distancia, estado.azimute, estado.elevacao, lente);
    const direcao = cameraOrbital([0, 0, 0], -1, estado.azimute, estado.elevacao, lente).posicao;
    return { posicao: estado.voo, alvo: somar(estado.voo, direcao), lente };
  }

  function quadro(alvo, dt) {
    const mistura = 1 - Math.exp(-dt * 9);
    estado.azimute += (estado.azimuteDesejado - estado.azimute) * mistura;
    estado.elevacao += (estado.elevacaoDesejada - estado.elevacao) * mistura;
    estado.distancia *= Math.exp(Math.log(estado.distanciaDesejada / estado.distancia) * mistura);
    estado.alvo = estado.alvo.map((valor, i) => valor + (alvo[i] - valor) * mistura);
    if (estado.voo && (teclas.size || direcoes.size)) {
      const frente = normalizar(subtrair(calcular(alvo).alvo, estado.voo));
      const lado = [Math.cos(estado.azimute), 0, -Math.sin(estado.azimute)];
      const movimento = [...new Set([...teclas, ...direcoes])].reduce((vetor, tecla) => {
        const [x, y] = MOVIMENTO[tecla];
        return somar(vetor, somar(escalar(lado, x), escalar(frente, -y)));
      }, [0, 0, 0]);
      estado.voo = moverVoo(estado.voo, normalizar(movimento), dt);
    }
    return calcular(estado.alvo);
  }

  canvas.addEventListener("pointerdown", evento => {
    if (evento.button !== 0) return;
    if (evento.pointerType === "mouse") canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(evento.pointerId);
    ponteiros.set(evento.pointerId, [evento.clientX, evento.clientY]);
    if (ponteiros.size === 1) {
      gesto = "toque";
      deslocamento = 0;
    } else {
      gesto = "pinca";
    }
  });
  canvas.addEventListener("pointermove", evento => {
    const anterior = ponteiros.get(evento.pointerId);
    if (!anterior) return;
    const atual = [evento.clientX, evento.clientY];
    ponteiros.set(evento.pointerId, atual);
    const x = atual[0] - anterior[0];
    const y = atual[1] - anterior[1];
    if (ponteiros.size === 1) {
      deslocamento += Math.hypot(x, y);
      if (deslocamento > 5) {
        gesto = "arraste";
        girar(x, y);
      }
    } else {
      const outro = [...ponteiros].find(([id]) => id !== evento.pointerId)[1];
      const nova = Math.hypot(atual[0] - outro[0], atual[1] - outro[1]);
      const antiga = Math.hypot(anterior[0] - outro[0], anterior[1] - outro[1]);
      if (nova > 4 && antiga > 4) aproximar(antiga / nova);
    }
  });
  canvas.addEventListener("pointerup", evento => {
    if (ponteiros.delete(evento.pointerId) && gesto === "toque") {
      const caixa = canvas.getBoundingClientRect();
      selecionar(evento.clientX - caixa.left, evento.clientY - caixa.top);
    }
  });
  for (const tipo of ["pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(tipo, evento => ponteiros.delete(evento.pointerId));
  }

  canvas.addEventListener("wheel", evento => {
    evento.preventDefault();
    const unidade = evento.deltaMode === 1 ? 16 : evento.deltaMode === 2 ? canvas.clientHeight : 1;
    aproximar(Math.exp(limitar(evento.deltaY * unidade * .0017, -.55, .55)));
  }, { passive: false });
  canvas.addEventListener("keydown", evento => {
    const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;
    if (tecla === "+" || tecla === "=" || tecla === "-") {
      evento.preventDefault();
      aproximar(tecla === "-" ? 1.22 : .82);
    } else if (estado.voo && Object.hasOwn(MOVIMENTO, tecla)) {
      evento.preventDefault();
      teclas.add(tecla);
    } else if (Object.hasOwn(SETAS, tecla)) {
      evento.preventDefault();
      const [x, y] = SETAS[tecla];
      girar(x * 15, y * 15);
    } else if (tecla === "Enter") {
      evento.preventDefault();
      selecionar(canvas.clientWidth / 2, canvas.clientHeight / 2);
    }
  });
  window.addEventListener("keyup", evento => teclas.delete(evento.key.length === 1 ? evento.key.toLowerCase() : evento.key));
  canvas.addEventListener("blur", () => teclas.clear());
  window.addEventListener("blur", () => {
    teclas.clear();
    direcoes.clear();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      teclas.clear();
      direcoes.clear();
    }
  });

  return {
    quadro,
    mudarDirecao(direcao, ativa) {
      if (ativa && estado.voo) direcoes.add(direcao);
      else direcoes.delete(direcao);
    },
    focar(alvo, distanciaFoco, limite, imediato = false) {
      estado.voo = null;
      teclas.clear();
      direcoes.clear();
      estado.minimo = limite;
      estado.distanciaDesejada = distanciaFoco;
      if (imediato) {
        estado.alvo = [...alvo];
        estado.distancia = distanciaFoco;
        estado.azimute = estado.azimuteDesejado = azimute;
        estado.elevacao = estado.elevacaoDesejada = elevacao;
      }
    },
    alternarVooLivre() {
      estado.voo = estado.voo ? null : calcular(estado.alvo).posicao;
      teclas.clear();
      direcoes.clear();
      return Boolean(estado.voo);
    },
    get emVoo() { return Boolean(estado.voo); }
  };
}