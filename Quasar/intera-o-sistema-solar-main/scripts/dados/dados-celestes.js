// Gravidade aproximada das luas menores calculada com GM e raio médio da NASA/JPL.
// https://ssd.jpl.nasa.gov/sats/phys_par/
export const CORPOS_CELESTES = {
  sol: {
    nome: "Sol",
    categoria: "Estrela · Anã amarela",
    descricao:
      "Estrela central do nosso Sistema Solar. Composto principalmente de hidrogênio e hélio, concentra cerca de 99,86% de toda a massa do sistema e fornece a luz e o calor que sustentam a vida na Terra.",
    diametro: "1.392.700 km",
    distanciaSol: "0 km (Centro do Sistema)",
    rotacao: "25,4 dias (no equador)",
    translacao: "~230 milhões de anos (órbita galáctica)",
    gravidade: "274 m/s²",
    temperatura: "~5.500 °C (fotosfera)",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  mercurio: {
    nome: "Mercúrio",
    categoria: "1º planeta · Rochoso",
    descricao:
      "O menor e mais interno planeta do Sistema Solar. Sua superfície é marcada por crateras de impacto semelhantes às da Lua e sofre variações extremas de temperatura por quase não possuir atmosfera.",
    diametro: "4.879 km",
    distanciaSol: "57,9 milhões km (0,39 UA)",
    rotacao: "58,6 dias terrestres",
    translacao: "88 dias terrestres",
    gravidade: "3,7 m/s²",
    temperatura: "~167 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  venus: {
    nome: "Vênus",
    categoria: "2º planeta · Rochoso",
    descricao:
      "Segundo planeta a partir do Sol e o mais quente do Sistema Solar devido ao intenso efeito estufa de sua densa atmosfera de dióxido de carbono. Gira em sentido retrógrado (de leste para oeste).",
    diametro: "12.104 km",
    distanciaSol: "108,2 milhões km (0,72 UA)",
    rotacao: "243 dias terrestres (retrógrada)",
    translacao: "224,7 dias terrestres",
    gravidade: "8,87 m/s²",
    temperatura: "~465 °C (média)",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  terra: {
    nome: "Terra",
    categoria: "3º planeta · Rochoso",
    descricao:
      "Nosso planeta natal, o terceiro a partir do Sol e o maior entre os planetas rochosos. É o único mundo conhecido até hoje por abrigar água líquida estável em sua superfície e vida.",
    diametro: "12.742 km",
    distanciaSol: "149,6 milhões km (1,00 UA)",
    rotacao: "23h 56min",
    translacao: "365,25 dias",
    gravidade: "9,807 m/s²",
    temperatura: "~15 °C (média global)",
    luas: ["lua"],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  lua: {
    nome: "Lua",
    categoria: "Satélite Natural · Órbita da Terra",
    pai: "terra",
    descricao:
      "Único satélite natural da Terra e o quinto maior do Sistema Solar. Foi o primeiro corpo celeste além da Terra visitado por seres humanos, durante as missões Apollo impulsionadas pelo foguete Saturn V.",
    diametro: "3.474 km",
    distanciaDoPlaneta: "384.400 km (distância média da Terra)",
    rotacao: "27,3 dias (rotação sincronizada)",
    translacao: "27,3 dias ao redor da Terra",
    gravidade: "1,62 m/s²",
    temperatura: "≈ −23 °C (média no equador)",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  marte: {
    nome: "Marte",
    categoria: "4º planeta · Rochoso",
    descricao:
      "Conhecido como Planeta Vermelho devido ao óxido de ferro em seu solo. Abriga o Monte Olimpo, o maior vulcão conhecido do Sistema Solar, e possui calotas polares de gelo de água e dióxido de carbono.",
    diametro: "6.779 km",
    distanciaSol: "227,9 milhões km (1,52 UA)",
    rotacao: "24h 37min",
    translacao: "687 dias terrestres",
    gravidade: "3,721 m/s²",
    temperatura: "~-65 °C (média)",
    luas: ["fobos", "deimos"],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  fobos: {
    nome: "Fobos",
    categoria: "Satélite Natural · Órbita de Marte",
    pai: "marte",
    descricao:
      "A maior e mais interna das duas pequenas luas de Marte, com formato irregular e repleta de crateras, incluindo a grande cratera Stickney.",
    diametro: "22,2 km (médio)",
    distanciaDoPlaneta: "9.376 km (de Marte)",
    rotacao: "7h 39min (sincronizada)",
    translacao: "7h 39min ao redor de Marte",
    gravidade: "≈ 0,0058 m/s²",
    temperatura: "~-40 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  deimos: {
    nome: "Deimos",
    categoria: "Satélite Natural · Órbita de Marte",
    pai: "marte",
    descricao:
      "A menor e mais externa das duas luas de Marte, com superfície mais lisa coberta por uma espessa camada de regolito.",
    diametro: "12,6 km (médio)",
    distanciaDoPlaneta: "23.463 km (de Marte)",
    rotacao: "30h 18min (sincronizada)",
    translacao: "30h 18min ao redor de Marte",
    gravidade: "≈ 0,0025 m/s²",
    temperatura: "~-40 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  jupiter: {
    nome: "Júpiter",
    categoria: "5º planeta · Gigante gasoso",
    descricao:
      "O maior planeta do Sistema Solar, com massa mais que duas vezes superior à de todos os outros planetas juntos. Famoso por suas faixas de nuvens e pela Grande Mancha Vermelha, uma tempestade anticiclônica gigante.",
    diametro: "139.820 km",
    distanciaSol: "778,5 milhões km (5,20 UA)",
    rotacao: "9h 55min",
    translacao: "11,86 anos terrestres",
    gravidade: "24,79 m/s²",
    temperatura: "~-110 °C (topo das nuvens)",
    luas: ["io", "europa", "ganimedes", "calisto"],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  io: {
    nome: "Io",
    categoria: "Satélite Galileano · Órbita de Júpiter",
    pai: "jupiter",
    descricao:
      "A mais interna das quatro luas galileanas de Júpiter e o corpo geologicamente mais ativo do Sistema Solar, com centenas de vulcões ativos.",
    diametro: "3.643 km",
    distanciaDoPlaneta: "421.700 km (de Júpiter)",
    rotacao: "1,77 dia terrestre",
    translacao: "1,77 dia ao redor de Júpiter",
    gravidade: "≈ 1,80 m/s²",
    temperatura: "~-130 °C (superfície média)",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  europa: {
    nome: "Europa",
    categoria: "Satélite Galileano · Órbita de Júpiter",
    pai: "jupiter",
    descricao:
      "Lua gelada de Júpiter com superfície lisa cortada por fraturas avermelhadas. Evidências científicas apontam para um vasto oceano de água líquida sob sua crosta de gelo.",
    diametro: "3.122 km",
    distanciaDoPlaneta: "671.034 km (de Júpiter)",
    rotacao: "3,55 dias terrestres",
    translacao: "3,55 dias ao redor de Júpiter",
    gravidade: "≈ 1,31 m/s²",
    temperatura: "~-160 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  ganimedes: {
    nome: "Ganimedes",
    categoria: "Satélite Galileano · Órbita de Júpiter",
    pai: "jupiter",
    descricao:
      "O maior satélite natural do Sistema Solar, sendo maior até mesmo que o planeta Mercúrio, e a única lua conhecida por possuir seu próprio campo magnético.",
    diametro: "5.268 km",
    distanciaDoPlaneta: "1.070.400 km (de Júpiter)",
    rotacao: "7,15 dias terrestres",
    translacao: "7,15 dias ao redor de Júpiter",
    gravidade: "≈ 1,43 m/s²",
    temperatura: "~-163 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  calisto: {
    nome: "Calisto",
    categoria: "Satélite Galileano · Órbita de Júpiter",
    pai: "jupiter",
    descricao:
      "A mais distante das quatro luas galileanas de Júpiter, possuindo uma das superfícies mais antigas e densamente crateradas do Sistema Solar.",
    diametro: "4.821 km",
    distanciaDoPlaneta: "1.882.700 km (de Júpiter)",
    rotacao: "16,69 dias terrestres",
    translacao: "16,69 dias ao redor de Júpiter",
    gravidade: "≈ 1,24 m/s²",
    temperatura: "~-139 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  saturno: {
    nome: "Saturno",
    categoria: "6º planeta · Gigante gasoso",
    descricao:
      "Segundo maior planeta do Sistema Solar, reconhecido pelo seu complexo e brilhante sistema de anéis compostos principalmente por partículas de gelo e poeira cósmica.",
    diametro: "116.460 km",
    distanciaSol: "1,43 bilhão km (9,58 UA)",
    rotacao: "10h 33min",
    translacao: "29,45 anos terrestres",
    gravidade: "10,44 m/s²",
    temperatura: "~-140 °C (topo das nuvens)",
    luas: ["tita", "encelado"],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  tita: {
    nome: "Titã",
    categoria: "Satélite Natural · Órbita de Saturno",
    pai: "saturno",
    descricao:
      "A maior lua de Saturno e a segunda maior do Sistema Solar. É o único satélite natural conhecido por possuir uma atmosfera densa e lagos estáveis de metano e etano líquidos na superfície.",
    diametro: "5.149 km",
    distanciaDoPlaneta: "1.221.870 km (de Saturno)",
    rotacao: "15,95 dias terrestres",
    translacao: "15,95 dias ao redor de Saturno",
    gravidade: "≈ 1,35 m/s²",
    temperatura: "~-179 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  encelado: {
    nome: "Encélado",
    categoria: "Satélite Natural · Órbita de Saturno",
    pai: "saturno",
    descricao:
      "Pequena lua gelada e altamente reflexiva de Saturno, famosa por seus gêiseres no polo sul que expelem plumas de vapor d'água e gelo para o espaço.",
    diametro: "504 km",
    distanciaDoPlaneta: "238.020 km (de Saturno)",
    rotacao: "1,37 dia terrestre",
    translacao: "1,37 dia ao redor de Saturno",
    gravidade: "≈ 0,113 m/s²",
    temperatura: "~-198 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  urano: {
    nome: "Urano",
    categoria: "7º planeta · Gigante de gelo",
    descricao:
      "Gigante de gelo de tonalidade azul-esverdeada causada pelo gás metano em sua atmosfera. Destaca-se por girar praticamente deitado em sua órbita, com inclinação axial de cerca de 98 graus.",
    diametro: "50.724 km",
    distanciaSol: "2,87 bilhões km (19,2 UA)",
    rotacao: "17h 14min (retrógrada)",
    translacao: "84 anos terrestres",
    gravidade: "8,69 m/s²",
    temperatura: "~-195 °C",
    luas: ["titania", "miranda"],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  titania: {
    nome: "Titânia",
    categoria: "Satélite Natural · Órbita de Urano",
    pai: "urano",
    descricao:
      "A maior das luas de Urano, composta por quantidades aproximadamente iguais de gelo e rocha, marcada por grandes cânions e escarpas.",
    diametro: "1.578 km",
    distanciaDoPlaneta: "435.910 km (de Urano)",
    rotacao: "8,71 dias terrestres",
    translacao: "8,71 dias ao redor de Urano",
    gravidade: "≈ 0,36 m/s²",
    temperatura: "~-203 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  miranda: {
    nome: "Miranda",
    categoria: "Satélite Natural · Órbita de Urano",
    pai: "urano",
    descricao:
      "A menor e mais interna das cinco principais luas de Urano, conhecida por seu relevo acidentado que inclui falésias gigantescas como Verona Rupes.",
    diametro: "471 km",
    distanciaDoPlaneta: "129.390 km (de Urano)",
    rotacao: "1,41 dia terrestre",
    translacao: "1,41 dia ao redor de Urano",
    gravidade: "≈ 0,077 m/s²",
    temperatura: "~-213 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  netuno: {
    nome: "Netuno",
    categoria: "8º planeta · Gigante de gelo",
    descricao:
      "O planeta mais distante do Sol no Sistema Solar. Possui ventos supersônicos que podem ultrapassar 2.000 km/h e foi o primeiro planeta descoberto por meio de cálculos matemáticos antes da observação direta.",
    diametro: "49.244 km",
    distanciaSol: "4,50 bilhões km (30,1 UA)",
    rotacao: "16h 06min",
    translacao: "164,8 anos terrestres",
    gravidade: "11,15 m/s²",
    temperatura: "~-200 °C",
    luas: ["tritao"],
    fontes: ["NASA", "Wikipédia em Português"]
  },
  tritao: {
    nome: "Tritão",
    categoria: "Satélite Natural · Órbita de Netuno",
    pai: "netuno",
    descricao:
      "A maior lua de Netuno e o único grande satélite do Sistema Solar com órbita retrógrada, indicando que provavelmente foi capturado do Cinturão de Kuiper.",
    diametro: "2.707 km",
    distanciaDoPlaneta: "354.759 km (de Netuno)",
    rotacao: "5,88 dias terrestres (retrógrada)",
    translacao: "5,88 dias ao redor de Netuno",
    gravidade: "≈ 0,78 m/s²",
    temperatura: "~-235 °C",
    luas: [],
    fontes: ["NASA", "Wikipédia em Português"]
  }
};

// Raios e órbitas em unidades ilustrativas para manter os astros legíveis.
// A ficha acima conserva as medidas astronômicas do documento de referência.
export const PLANETAS = ["mercurio", "venus", "terra", "marte", "jupiter", "saturno", "urano", "netuno"];

export const VISUAIS = {
  sol:      { raio: 3.35, cor: [255, 163, 53], emissao: true },
  mercurio: { raio: .34, orbita: 5.6, fase: 1.45, periodo: .241, cor: [184, 165, 153] },
  venus:    { raio: .54, orbita: 8.2, fase: 3.8, periodo: .615, cor: [233, 185, 122], giro: -.12, atmosfera: { altitude: .16, cor: [255, 198, 119] } },
  terra:    { raio: .65, orbita: 11, fase: .45, periodo: 1, cor: [74, 154, 241], atmosfera: { altitude: .12, cor: [107, 192, 255] } },
  lua:      { raio: .22, orbita: 1.66, fase: 1.4, periodo: .075, cor: [211, 210, 204] },
  marte:    { raio: .45, orbita: 14.4, fase: 2.4, periodo: 1.88, cor: [220, 106, 65] },
  fobos:    { raio: .13, orbita: 1.10, fase: 2, periodo: .025, cor: [168, 145, 121] },
  deimos:   { raio: .10, orbita: 1.71, fase: 4.6, periodo: .045, cor: [174, 158, 145] },
  jupiter:  { raio: 1.65, orbita: 20, fase: 5.68, periodo: 11.86, cor: [240, 191, 143] },
  io:       { raio: .23, orbita: 2.4, fase: .7, periodo: .038, cor: [237, 202, 99] },
  europa:   { raio: .22, orbita: 3.1, fase: 2.4, periodo: .052, cor: [221, 207, 179] },
  ganimedes:{ raio: .29, orbita: 3.86, fase: 4.2, periodo: .071, cor: [188, 169, 147] },
  calisto:  { raio: .26, orbita: 4.65, fase: 5.7, periodo: .109, cor: [148, 137, 124] },
  saturno:  { raio: 1.28, orbita: 26.8, fase: 2.96, periodo: 29.45, cor: [235, 203, 144], anel: true },
  tita:     { raio: .28, orbita: 3.48, fase: .7, periodo: .106, cor: [229, 177, 105] },
  encelado: { raio: .15, orbita: 2.77, fase: 4.2, periodo: .033, cor: [205, 225, 232] },
  urano:    { raio: .92, orbita: 34.5, fase: 1.05, periodo: 84, cor: [131, 217, 224], giro: -.4 },
  titania:  { raio: .17, orbita: 2.0, fase: 4, periodo: .080, cor: [184, 166, 158] },
  miranda:  { raio: .13, orbita: 1.36, fase: 2, periodo: .035, cor: [191, 195, 202] },
  netuno:   { raio: .88, orbita: 43, fase: 3.95, periodo: 164.8, cor: [106, 151, 255] },
  tritao:   { raio: .22, orbita: 1.89, fase: 5, periodo: -.064, cor: [205, 185, 161] }
};

// Diâmetros em quilômetros. Distâncias em UA para planetas e em km para luas.
const MEDIDAS_ORBITAIS = {
  sol: [1392700, 0],
  mercurio: [4879, 0.39],
  venus: [12104, 0.72],
  terra: [12742, 1],
  lua: [3474, 384400],
  marte: [6779, 1.52],
  fobos: [22.2, 9376],
  deimos: [12.6, 23463],
  jupiter: [139820, 5.2],
  io: [3643, 421700],
  europa: [3122, 671034],
  ganimedes: [5268, 1070400],
  calisto: [4821, 1882700],
  saturno: [116460, 9.58],
  tita: [5149, 1221870],
  encelado: [504, 238020],
  urano: [50724, 19.2],
  titania: [1578, 435910],
  miranda: [471, 129390],
  netuno: [49244, 30.1],
  tritao: [2707, 354759],
};

export function distanciaOrbitalComprimida(unidadesAstronomicas) {
  return 1.1 + 12.3 * Math.log1p(unidadesAstronomicas / .85);
}

const escala = {};
for (const [id, [diametro, distancia]] of Object.entries(MEDIDAS_ORBITAIS)) {
  const pai = CORPOS_CELESTES[id].pai;
  const raio = pai ? .10 + .17 * Math.log1p(diametro / 1100) : .22 + .49 * Math.log1p(diametro / 5800);
  let orbita = id === "sol" ? 0 : distanciaOrbitalComprimida(distancia);
  if (pai) {
    const limite = escala[pai].raio * (VISUAIS[pai].anel ? 2.52 : 1.15);
    orbita = limite + raio + .22 + .78 * Math.log1p(distancia / 80000);
  }
  escala[id] = { ...VISUAIS[id], raio, orbita };
}

export const ESCALA_LOGARITMICA = escala;

export function criarAstro(id, posicao = [0, 0, 0], opcoes = {}) {
  return { id, posicao, ...VISUAIS[id], ...opcoes };
}

export function calcularSistema(tempo, comLuas = true, visuais = VISUAIS) {
  const astros = [criarAstro("sol", [0, 0, 0], visuais.sol)];
  for (const id of PLANETAS) {
    const planeta = visuais[id];
    const angulo = planeta.fase + tempo * .24 / Math.sqrt(planeta.periodo);
    const posicao = [Math.cos(angulo) * planeta.orbita, 0, Math.sin(angulo) * planeta.orbita];
    astros.push(criarAstro(id, posicao, { ...planeta, rotacao: tempo * (planeta.giro ?? .45) }));
    if (!comLuas) continue;
    for (const lua of CORPOS_CELESTES[id].luas) {
      const visual = visuais[lua];
      const fase = visual.fase + tempo * .17 / (Math.sign(visual.periodo) * Math.sqrt(Math.abs(visual.periodo)));
      astros.push(criarAstro(lua, [
        posicao[0] + Math.cos(fase) * visual.orbita,
        Math.sin(fase) * visual.orbita * .16,
        posicao[2] + Math.sin(fase) * visual.orbita
      ], { ...visual, rotacao: fase }));
    }
  }
  return astros;
}