const RAMPA = " .:-=+*#%@";
const VOLTA = 2 * Math.PI;
const PLANO_PROXIMO = .06;
const CORES_ESTRELAS = ["#334d67", "#496486", "#557b9b", "#a4bed2", "#ddc8a2"];

export const limitar = (valor, min = 0, max = 1) => Math.max(min, Math.min(max, valor));
export const interpolar = (a, b, t) => a + (b - a) * t;
export const suavizar = t => limitar(t) ** 2 * (3 - 2 * limitar(t));
export const somar = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const subtrair = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const escalar = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
export const produto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function normalizar(v) {
  return escalar(v, 1 / (Math.hypot(...v) || 1));
}
function cruzar(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function ruido(i, semente = 0) {
  const n = Math.sin(i * 127.1 + semente * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}
export function cameraOrbital(alvo, distancia, azimute, elevacao, lente) {
  const c = Math.cos(elevacao);
  return {
    posicao: somar(alvo, escalar([Math.sin(azimute) * c, Math.sin(elevacao), Math.cos(azimute) * c], distancia)),
    alvo, lente
  };
}

const NORMAL_ANEL = normalizar([.32, 1, -.19]);
const TERRA = [[55, 143, 244], [132, 185, 172], [240, 242, 231], [255, 196, 71]];
const GAS = [[204, 135, 107], [247, 198, 149], [157, 98, 83], [242, 224, 190]];
const GELO = [220, 229, 231];
const ANEIS = [[197, 162, 109], [243, 218, 165]];
const PALETAS = new WeakMap();

function corGraduada(cor, luz) {
  let tons = PALETAS.get(cor);
  if (!tons) {
    tons = Array.from({ length: 36 }, (_, i) => {
      const intensidade = i / 24;
      return `rgb(${cor.map(v => Math.min(255, Math.round(v * intensidade))).join(",")})`;
    });
    PALETAS.set(cor, tons);
  }
  return tons[Math.round(limitar(luz * 24, 0, 35))];
}

function superficie(astro, nx, ny, nz, luz, tempo) {
  const giro = astro.rotacao ?? 0;
  const longitude = Math.atan2(nz, nx) + giro;
  const veios = Math.sin(longitude * 5 + ny * 8) * Math.cos(ny * 13 - longitude * 3);
  const textura = Math.sin(longitude * 23 + ny * 31) * Math.cos(ny * 57 - longitude * 11);
  let cor = astro.cor;
  let contraste = .84 + veios * .12 + textura * .07;

  if (astro.emissao) {
    const fluxo = Math.sin(longitude * 12 + 4 * veios + tempo * 1.8) * Math.cos(ny * 22 - tempo * 1.1);
    if (astro.paletaEmissiva) {
      const banda = Math.sin(ny * 30 + veios * 1.8 - tempo * .72);
      const calor = limitar(.53 + banda * .23 + fluxo * .23 + textura * .15);
      return [astro.paletaEmissiva[Math.floor(calor * 3.99)], .72 + calor * .43];
    }
    return [cor, limitar(.96 + .22 * fluxo + .13 * textura, .64, 1.35)];
  }
  switch (astro.id) {
    case "terra": {
      const placas = Math.sin(longitude * 2 - ny * 3) + .51 * Math.cos(longitude * 4 + ny * 4) + veios * .48 + textura * .16;
      const terra = placas > .48;
      const nuvem = Math.sin(longitude * 10 + ny * 15 + veios * 2) + textura * .7;
      cor = TERRA[terra ? 1 : 0];
      if (nuvem > 1.23 || Math.abs(ny) > .92) cor = TERRA[2];
      if (terra && luz < .18 && textura + veios * .4 > .75) {
        return [TERRA[3], .58 + .2 * Math.sin(tempo * 5 + longitude * 14 + ny * 8)];
      }
      break;
    }
    case "jupiter": {
      const banda = Math.sin(ny * 34 + veios * .54) + .28 * Math.sin(ny * 77 + longitude);
      cor = GAS[banda > .65 ? 3 : banda > .02 ? 1 : banda > -.65 ? 0 : 2];
      if (Math.cos(longitude - .8) > .93 && Math.abs(ny + .26) < .1) cor = GAS[0];
      contraste = .86 + .12 * textura;
      break;
    }
    case "saturno":
    case "venus":
    case "urano":
    case "netuno":
      contraste = .86 + Math.sin(ny * 28 + veios * 1.2) * .13 + textura * .07;
      break;
    case "marte":
      if (Math.abs(ny) > .87 + veios * .05) cor = GELO;
      break;
    default: {
      const grade = longitude * 10;
      const meridiano = ny * 14;
      const dx = grade - Math.round(grade) + .2 * Math.sin(Math.round(meridiano) * 7.4);
      const dy = meridiano - Math.round(meridiano) + .17 * Math.cos(Math.round(grade) * 4.8);
      const cratera = Math.hypot(dx, dy);
      if (cratera < .31) contraste *= .73;
      if (cratera > .31 && cratera < .4) contraste *= 1.14;
    }
  }
  return [cor, (luz * .9 + .17) * contraste];
}

export class RenderizadorAscii {
  constructor(canvas, tamanho = 9, frequencia = 30) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.brilho = document.createElement("canvas");
    this.ctxBrilho = this.brilho.getContext("2d");
    this.tamanho = tamanho;
    this.densidade = 1;
    this.meta = 1000 / frequencia;
    this.altaFrequencia = frequencia >= 60;
    if (this.altaFrequencia) {
      this.mascara = document.createElement("canvas");
      this.ctxMascara = this.mascara.getContext("2d", { willReadFrequently: true });
      this.glifos = new Map();
      this.cores = new Map();
      document.fonts.ready.then(() => this.glifos.clear());
    }
    this.media = 5;
    this.intervalo = this.meta;
    this.quadros = 0;
    this.quadrosEstaveis = 0;
    this.estrelas = Array.from({ length: 340 }, (_, i) => [
      ruido(i, 2), ruido(i, 3), ruido(i, 4), ruido(i, 5)
    ]);
  }

  iniciar(camera, tempo = 0, centro = [.5, .5]) {
    const inicio = performance.now();
    const intervalo = inicio - (this.inicio ?? inicio);
    this.intervalo = intervalo > 120
      ? this.meta
      : this.intervalo * .85 + Math.max(this.meta, intervalo) * .15;
    this.inicio = inicio;
    this.tempo = tempo;
    const largura = this.canvas.clientWidth;
    const altura = this.canvas.clientHeight;
    if (!largura || !altura) return false;
    const limiteDpr = this.altaFrequencia ? 1.42 / Math.sqrt(this.densidade) : 1.75;
    const dpr = Math.min(devicePixelRatio || 1, limiteDpr);
    if (this.largura !== largura || this.altura !== altura || this.dpr !== dpr) {
      this.largura = largura;
      this.altura = altura;
      this.dpr = dpr;
      this.canvas.width = Math.round(largura * dpr);
      this.canvas.height = Math.round(altura * dpr);
      if (this.altaFrequencia) {
        this.quadroAscii = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        this.fundoAscii = new Uint8ClampedArray(this.quadroAscii.data.length);
        for (let i = 0; i < this.fundoAscii.length; i += 4) {
          this.fundoAscii[i] = 2;
          this.fundoAscii[i + 1] = 3;
          this.fundoAscii[i + 2] = 7;
          this.fundoAscii[i + 3] = 255;
        }
      } else {
        this.brilho.width = this.canvas.width;
        this.brilho.height = this.canvas.height;
      }
    }

    this.passoX = Math.max(2.8, this.tamanho * .64 * this.densidade);
    this.passoY = Math.max(4.4, this.tamanho * 1.06 * this.densidade);
    this.colunas = Math.ceil(largura / this.passoX);
    this.linhas = Math.ceil(altura / this.passoY);
    const total = this.colunas * this.linhas;
    if (this.profundidade?.length !== total) {
      this.profundidade = new Float32Array(total);
      this.amostras = new Array(total);
    }
    this.profundidade.fill(Infinity);
    this.amostras.fill(undefined);
    this.projetados = new Map();
    this.cx = largura * centro[0];
    this.cy = altura * centro[1];
    this.foco = Math.min(largura, altura * 1.46) * (camera.lente ?? 1.02);
    this.frustum = [-this.cx, largura - this.cx, this.cy - altura, this.cy]
      .map(limite => {
        const inclinacao = limite / this.foco;
        return [inclinacao, Math.hypot(1, inclinacao)];
      });
    this.posicao = camera.posicao;
    this.frente = normalizar(subtrair(camera.alvo, camera.posicao));
    this.direita = normalizar(cruzar(this.frente, [0, 1, 0]));
    this.cima = cruzar(this.direita, this.frente);

    const fonte = this.tamanho * this.densidade;
    if (this.altaFrequencia) {
      this.quadroAscii.data.set(this.fundoAscii);
      this.prepararMascara(fonte * dpr);
    } else {
      for (const ctx of [this.ctx, this.ctxBrilho]) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${fonte}px "Space Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
      }
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = "#020307";
      this.ctx.fillRect(0, 0, largura, altura);
      this.ctxBrilho.clearRect(0, 0, largura, altura);
      this.temBrilho = false;
    }
    return true;
  }

  prepararMascara(fonte) {
    if (this.fonteMascara === fonte) return;
    this.fonteMascara = fonte;
    this.mascara.width = Math.ceil(fonte * .7 + 4);
    this.mascara.height = Math.ceil(fonte * 1.24 + 4);
    this.ctxMascara.font = `${fonte}px "Space Mono", monospace`;
    this.ctxMascara.textAlign = "center";
    this.ctxMascara.textBaseline = "middle";
    this.ctxMascara.fillStyle = "#fff";
    this.glifos.clear();
  }

  mascaraDe(letra) {
    if (this.glifos.has(letra)) return this.glifos.get(letra);
    const { width, height } = this.mascara;
    const ctx = this.ctxMascara;
    ctx.clearRect(0, 0, width, height);
    ctx.fillText(letra, width / 2, height / 2);
    const { data } = ctx.getImageData(0, 0, width, height);
    const pontos = [];
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) continue;
      const pixel = (i - 3) / 4;
      pontos.push(pixel % width, Math.floor(pixel / width), data[i]);
    }
    const mascara = Uint16Array.from(pontos);
    this.glifos.set(letra, mascara);
    return mascara;
  }

  corDe(cor) {
    if (this.cores.has(cor)) return this.cores.get(cor);
    const hexadecimal = cor.startsWith("#") ? Number.parseInt(cor.slice(1), 16) : null;
    const canais = hexadecimal === null
      ? cor.match(/[\d.]+/g).slice(0, 3).map(Number)
      : [hexadecimal >> 16, (hexadecimal >> 8) & 255, hexadecimal & 255];
    this.cores.set(cor, canais);
    return canais;
  }

  carimbar(x, y, letra, cor, opacidade) {
    const pontos = this.mascaraDe(letra);
    const [r, g, b] = this.corDe(cor);
    const { data, width, height } = this.quadroAscii;
    const esquerda = Math.round(x * this.dpr - this.mascara.width / 2);
    const topo = Math.round(y * this.dpr - this.mascara.height / 2);
    const intensidade = opacidade / 255;
    for (let i = 0; i < pontos.length; i += 3) {
      const px = esquerda + pontos[i];
      const py = topo + pontos[i + 1];
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const indice = (py * width + px) * 4;
      const alfa = pontos[i + 2] * intensidade;
      data[indice] += (r - data[indice]) * alfa;
      data[indice + 1] += (g - data[indice + 1]) * alfa;
      data[indice + 2] += (b - data[indice + 2]) * alfa;
    }
  }

  paraCamera(posicao) {
    const v = subtrair(posicao, this.posicao);
    return [produto(v, this.direita), produto(v, this.cima), produto(v, this.frente)];
  }

  projetar(posicao) {
    const [x, y, z] = this.paraCamera(posicao);
    if (z < PLANO_PROXIMO) return null;
    return { x: this.cx + this.foco * x / z, y: this.cy - this.foco * y / z, z };
  }

  caractere(x, y, letra, cor, opacidade = 1, brilhar = false) {
    if (x < -16 || y < -16 || x > this.largura + 16 || y > this.altura + 16 || opacidade <= 0) return;
    opacidade = limitar(opacidade);
    if (this.altaFrequencia) {
      this.carimbar(x, y, letra, cor, opacidade);
      return;
    }
    const ctx = this.ctx;
    ctx.globalAlpha = opacidade;
    ctx.fillStyle = cor;
    ctx.fillText(letra, x, y);
    if (brilhar) {
      this.ctxBrilho.globalAlpha = ctx.globalAlpha;
      this.ctxBrilho.fillStyle = cor;
      this.ctxBrilho.fillText(letra, x, y);
      this.temBrilho = true;
    }
    ctx.globalAlpha = 1;
  }

  ponto(posicao, letra, cor, opacidade = 1, brilhar = false) {
    const p = this.projetar(posicao);
    if (p) this.caractere(p.x, p.y, letra, cor, opacidade, brilhar);
  }

  linha(a, b, cor, opacidade, letra = "·", passo = 8) {
    const inicio = this.projetar(a);
    const fim = this.projetar(b);
    if (!inicio || !fim) return;
    const quantidade = limitar(Math.ceil(Math.hypot(fim.x - inicio.x, fim.y - inicio.y) / passo), 1, 220);
    for (let i = 0; i <= quantidade; i++) {
      const t = i / quantidade;
      this.caractere(interpolar(inicio.x, fim.x, t), interpolar(inicio.y, fim.y, t), letra, cor, opacidade);
    }
  }

  estrelasAoFundo(intensidade = 1, passagem = 0) {
    const salto = this.altaFrequencia ? Math.ceil(this.densidade) : 1;
    for (let i = 0; i < this.estrelas.length; i += salto) {
      const [u, v, tipo, fase] = this.estrelas[i];
      const pulsar = .65 + .35 * Math.sin(this.tempo * (1 + fase) + fase * 50);
      const x = ((u + passagem * (tipo + .3)) % 1) * this.largura;
      const y = v * this.altura;
      const cor = CORES_ESTRELAS[Math.floor(tipo * CORES_ESTRELAS.length)];
      this.caractere(x, y, tipo > .96 ? "+" : tipo > .8 ? ":" : ".", cor, intensidade * pulsar);
      if (tipo > .988) {
        this.caractere(x - 8, y, "−", cor, intensidade * .65 * pulsar);
        this.caractere(x + 8, y, "−", cor, intensidade * .65 * pulsar);
        this.caractere(x, y - 8, "|", cor, intensidade * .54 * pulsar);
        this.caractere(x, y + 8, "|", cor, intensidade * .54 * pulsar);
      }
    }
  }

  orbita(centro, raio, cor = "#4ea8ff", opacidade = .32, inclinacao = 0) {
    const origem = this.projetar(centro);
    if (!origem) return;
    const intervalo = this.altaFrequencia ? 8 * this.densidade ** 1.8 : 8;
    const arco = limitar(Math.ceil(VOLTA * raio * this.foco / origem.z / intervalo), 17, 420);
    for (let i = 0; i < arco; i++) {
      const a = VOLTA * i / Math.ceil(arco);
      const z = Math.sin(a) * raio;
      this.ponto([centro[0] + Math.cos(a) * raio, centro[1] + z * inclinacao, centro[2] + z], "·", cor, opacidade);
    }
  }

  asteroides(raio = 17, quantidade = 285, opacidade = .68, tempo = this.tempo) {
    const salto = this.altaFrequencia ? Math.ceil(this.densidade) : 1;
    for (let i = 0; i < quantidade; i += salto) {
      const a = ruido(i, 12) * VOLTA + tempo * .025;
      const r = raio + (ruido(i, 13) - .5) * 3.4;
      const y = (ruido(i, 14) - .5) * .77;
      this.ponto([r * Math.cos(a), y, r * Math.sin(a)], i % 19 ? "." : ":", i % 4 ? "#a67b59" : "#e5a574", opacidade);
    }
  }

  disco(p, raio, cor, opacidade) {
    const gradiente = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, raio);
    gradiente.addColorStop(0, cor);
    gradiente.addColorStop(.42, cor);
    gradiente.addColorStop(1, "transparent");
    this.ctx.globalAlpha = opacidade;
    this.ctx.fillStyle = gradiente;
    this.ctx.fillRect(p.x - raio, p.y - raio, 2 * raio, 2 * raio);
    this.ctx.globalAlpha = 1;
  }

  astro(astro) {
    const [x, y, z] = this.paraCamera(astro.posicao);
    const r = astro.raio;
    const atmosfera = astro.atmosfera;
    const externo = r * (astro.anel ? 2.4 : 1 + (atmosfera?.altitude ?? 0));
    const excessoAtmosferico = atmosfera ? externo * externo - r * r : 0;
    if (z + externo <= PLANO_PROXIMO) return;
    const margem = astro.emissao ? externo * 1.45 : externo;
    const [[minX, normalMinX], [maxX, normalMaxX], [minY, normalMinY], [maxY, normalMaxY]] = this.frustum;
    if (x - z * minX < -margem * normalMinX || x - z * maxX > margem * normalMaxX ||
        y - z * minY < -margem * normalMinY || y - z * maxY > margem * normalMaxY) return;

    let esquerda = 0;
    let direita = this.colunas - 1;
    let topo = 0;
    let base = this.linhas - 1;
    const p = z > r * 1.01
      ? { x: this.cx + this.foco * x / z, y: this.cy - this.foco * y / z, z, raio: this.foco * r / Math.sqrt(z * z - r * r) }
      : null;

    // Ao cruzar o plano da câmera, a projeção pode ocupar qualquer ponto da grade.
    // Nessa situação, as interseções dos raios determinam os limites visíveis.
    if (p && z > externo * 1.01) {
      const seguro = Math.max(z * .20, z - externo);
      const limiteX = p.raio + this.foco * (externo * (1 + Math.abs(x / z)) / seguro - r / z) + this.passoX;
      const limiteY = p.raio + this.foco * (externo * (1 + Math.abs(y / z)) / seguro - r / z) + this.passoY;
      esquerda = Math.max(0, Math.floor((p.x - limiteX) / this.passoX));
      direita = Math.min(this.colunas - 1, Math.ceil((p.x + limiteX) / this.passoX));
      topo = Math.max(0, Math.floor((p.y - limiteY) / this.passoY));
      base = Math.min(this.linhas - 1, Math.ceil((p.y + limiteY) / this.passoY));
      if (direita < esquerda || base < topo) return;
    }

    if (p) this.projetados.set(astro.id, p);
    if (p && (astro.emissao || (astro.halo && !atmosfera))) {
      if (!this.altaFrequencia) {
        const corHalo = astro.halo || `rgb(${astro.cor.join(",")})`;
        this.disco(p, p.raio * (astro.emissao ? 1.87 : 1.13), corHalo, astro.emissao ? .13 : .26);
      }
      if (astro.emissao) this.corona(p, astro.cor);
    }

    const luz = normalizar(astro.luz ?? escalar(astro.posicao, -1));
    const luzCamera = atmosfera && [produto(luz, this.direita), produto(luz, this.cima), produto(luz, this.frente)];
    const n = [produto(NORMAL_ANEL, this.direita), produto(NORMAL_ANEL, this.cima), produto(NORMAL_ANEL, this.frente)];
    const plano = n[0] * x + n[1] * y + n[2] * z;
    const c = x * x + y * y + z * z - r * r;
    let amostrou = false;

    for (let linha = topo; linha <= base; linha++) {
      const dy = (this.cy - (linha + .5) * this.passoY) / this.foco;
      for (let coluna = esquerda; coluna <= direita; coluna++) {
        const dx = ((coluna + .5) * this.passoX - this.cx) / this.foco;
        const indice = linha * this.colunas + coluna;
        const a = dx * dx + dy * dy + 1;
        const b = dx * x + dy * y + z;
        const delta = b * b - a * c;
        let d = Infinity;
        if (delta >= 0) {
          const raiz = Math.sqrt(delta);
          const frente = (b - raiz) / a;
          const verso = (b + raiz) / a;
          if (frente > PLANO_PROXIMO) d = frente;
          else if (verso > PLANO_PROXIMO) d = verso;
        }
        let anel = 0;
        if (astro.anel) {
          const denominador = n[0] * dx + n[1] * dy + n[2];
          const t = plano / denominador;
          if (t > PLANO_PROXIMO && t < d && t < this.profundidade[indice]) {
            const radial = Math.hypot(dx * t - x, dy * t - y, t - z) / r;
            if (radial > 1.26 && radial < 2.33 && (radial < 1.89 || radial > 2.02)) {
              anel = radial;
              d = t;
            }
          }
        }
        if (atmosfera && delta < 0) {
          const deltaExterno = delta + a * excessoAtmosferico;
          if (deltaExterno <= 0 || b <= 0) continue;
          const pontoTangente = b / a;
          if (pontoTangente <= PLANO_PROXIMO) continue;
          const entrada = Math.max(PLANO_PROXIMO, (b - Math.sqrt(deltaExterno)) / a);
          if (entrada >= this.profundidade[indice]) continue;
          const [lx, ly, lz] = luzCamera;
          const luzSolar = Math.max(0, ((dx * pontoTangente - x) * lx + (dy * pontoTangente - y) * ly + (pontoTangente - z) * lz) / externo);
          const espessura = Math.sqrt(deltaExterno / (a * excessoAtmosferico));
          const brilho = espessura * (.23 + .62 * luzSolar);
          this.amostras[indice] = [astro.id, atmosfera.cor, brilho, brilho > .37];
          this.profundidade[indice] = entrada;
          amostrou = true;
          continue;
        }
        if (d >= this.profundidade[indice]) continue;
        if (anel) {
          const bandas = Math.sin(anel * 78);
          this.amostras[indice] = [astro.id, ANEIS[bandas > 0 ? 1 : 0], .5 + bandas * .13, false];
        } else {
          const px = (dx * d - x) / r;
          const py = (dy * d - y) / r;
          const pz = (d - z) / r;
          const nx = px * this.direita[0] + py * this.cima[0] + pz * this.frente[0];
          const ny = px * this.direita[1] + py * this.cima[1] + pz * this.frente[1];
          const nz = px * this.direita[2] + py * this.cima[2] + pz * this.frente[2];
          const iluminacao = Math.max(0, nx * luz[0] + ny * luz[1] + nz * luz[2]);
          const [cor, brilho] = superficie(astro, nx, ny, nz, iluminacao, this.tempo);
          const limbo = atmosfera ? -(px * dx + py * dy + pz) / Math.sqrt(a) : 1;
          if (atmosfera && limbo < .27 && limbo >= 0) {
            const dispersao = (1 - limbo / .27) * (.24 + iluminacao * .46);
            this.amostras[indice] = [astro.id, atmosfera.cor, Math.max(brilho, .25 + dispersao), dispersao > .38];
          } else {
            this.amostras[indice] = [astro.id, cor, brilho, astro.emissao];
          }
        }
        amostrou = true;
        this.profundidade[indice] = d;
      }
    }

    if (!amostrou && p && p.raio < this.passoY) {
      const coluna = Math.floor(p.x / this.passoX);
      const linha = Math.floor(p.y / this.passoY);
      const indice = linha * this.colunas + coluna;
      if (coluna >= 0 && coluna < this.colunas && linha >= 0 && linha < this.linhas && z < this.profundidade[indice]) {
        this.profundidade[indice] = z;
        this.amostras[indice] = [astro.id, astro.cor, .55, astro.emissao];
      }
    }
  }

  corona(p, cor) {
    const corTexto = `rgb(${cor.join(",")})`;
    const pulso = .9 + .1 * Math.sin(this.tempo * 2.4);
    const n = Math.round(limitar(p.raio * 5 / this.densidade, 36, 1250));
    for (let i = 0; i < n; i++) {
      const a = ruido(i, 18) * VOLTA;
      const ondulacao = .74 + Math.sin(a * 12 + this.tempo * 1.3) * .24;
      const afastamento = ruido(i, 19) ** 2 * ondulacao;
      const r = p.raio * (.96 + afastamento * .54 * pulso);
      this.caractere(p.x + r * Math.cos(a), p.y + r * Math.sin(a), i % 7 ? "." : "*", corTexto, .69 * pulso * (1 - afastamento), i % 7 === 0);
    }
  }

  finalizar(opacidade = 1) {
    for (let i = 0; i < this.amostras.length; i++) {
      const amostra = this.amostras[i];
      if (!amostra) continue;
      const [, cor, luz, emissao] = amostra;
      const indice = Math.round(limitar(luz * .81, .065, 1) * (RAMPA.length - 1));
      const x = (i % this.colunas + .5) * this.passoX;
      const y = (Math.floor(i / this.colunas) + .5) * this.passoY;
      this.caractere(x, y, RAMPA[indice], corGraduada(cor, .36 + luz * .88), opacidade, emissao && i % 3 === 0);
    }
    if (this.altaFrequencia) {
      this.ctx.putImageData(this.quadroAscii, 0, 0);
    } else if (this.temBrilho) {   
      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.globalAlpha = .55;
      if ("filter" in this.ctx) this.ctx.filter = this.densidade > 1.4 ? "blur(5px)" : "blur(8px)";
      this.ctx.drawImage(this.brilho, 0, 0, this.largura, this.altura);
      this.ctx.restore();
    }
    const custo = performance.now() - this.inicio;
    this.media = this.media * .83 + custo * .17;
    const sobrecarga = this.altaFrequencia && (this.media > this.meta * 1.25 || this.intervalo > this.meta * 2);
    if (++this.quadros % (sobrecarga ? 4 : 8) !== 0) return;

    if (this.media > this.meta * .72 || this.intervalo > this.meta * 1.23) {
      const limite = this.altaFrequencia ? 2.75 : 1.9;
      this.densidade = Math.min(limite, this.densidade + (sobrecarga ? .38 : .16));
      this.quadrosEstaveis = 0;
    } else if (this.media < this.meta * .46 && this.intervalo < this.meta * 1.08) {
      this.quadrosEstaveis++;
      if (this.quadrosEstaveis >= 4) this.densidade = Math.max(1, this.densidade - .055);
    } else {
      this.quadrosEstaveis = 0;
    }
  }

  selecionar(x, y) {
    const amostra = this.amostras[Math.floor(y / this.passoY) * this.colunas + Math.floor(x / this.passoX)];
    if (amostra) return amostra[0];
    let maisProximo = 19;
    let alvo = null;
    for (const [id, p] of this.projetados) {
      const distancia = Math.hypot(x - p.x, y - p.y);
      if (distancia < maisProximo && distancia < Math.max(9, p.raio)) {
        maisProximo = distancia;
        alvo = id;
      }
    }
    return alvo;
  }
}