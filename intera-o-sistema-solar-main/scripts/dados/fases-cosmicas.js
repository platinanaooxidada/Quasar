export const FASES = [
  { romano: "I", nome: "Colapso", descricao: "Há 4,6 bilhões de anos, uma nuvem gigante de gás e poeira entrou em colapso.", inicio: -4680000000, fim: -4560000000, duracao: 4 },
  { romano: "II", nome: "Ignição", descricao: "O Sol se acende no centro.", inicio: -4560000000, fim: -4520000000, duracao: 3 },
  { romano: "III", nome: "Planetas", descricao: "A poeira remanescente se aglutina formando os planetas.", inicio: -4520000000, fim: 0, duracao: 5 },
  { romano: "IV", nome: "Hoje", descricao: "Posições aproximadas dos oito planetas na data de hoje, em escala ilustrativa.", inicio: 0, fim: 0, duracao: 3 },
  { romano: "V", nome: "Esgotamento", descricao: "Daqui a cerca de 5 bilhões de anos, o Sol começará a esgotar o hidrogênio do núcleo.", inicio: 1, fim: 5000000000, duracao: 3 },
  { romano: "VI", nome: "Gigante Vermelha", descricao: "O Sol se expande drasticamente e se transforma em uma gigante vermelha.", inicio: 5000000000, fim: 7500000000, duracao: 10 },
  { romano: "VII", nome: "Nebulosa", descricao: "Suas camadas externas se desprendem pelo espaço.", inicio: 7500000000, fim: 7800000000, duracao: 6 },
  { romano: "VIII", nome: "Anã Branca", descricao: "O que resta no centro é uma anã branca do tamanho da Terra.", inicio: 7800000000, fim: 7800000000, duracao: 4 },
  { romano: "IX", nome: "Sementes", descricao: "Sua poeira cósmica semeia o espaço para as próximas estrelas.", inicio: 7800000000, fim: 7800000000, duracao: 5 }
];

// NASA/JPL, elementos de 1800 a 2050, referidos à eclíptica de J2000.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html#tables
// Excentricidade, longitude média e longitude do periélio, cada uma com sua taxa secular.
const ELEMENTOS = {
  mercurio: [.20563593, .00001906, 252.25032350, 149472.67411175, 77.45779628, .16047689],
  venus: [.00677672, -.00004107, 181.97909950, 58517.81538729, 131.60246718, .00268329],
  terra: [.01671123, -.00004392, 100.46457166, 35999.37244981, 102.93768193, .32327364],
  marte: [.09339410, .00007882, -4.55343205, 19140.30268499, -23.94362959, .44441088],
  jupiter: [.04838624, -.00013253, 34.39644051, 3034.74612775, 14.72847983, .21252668],
  saturno: [.05386179, -.00050991, 49.95424423, 1222.49362201, 92.59887831, -.41897216],
  urano: [.04725744, -.00004397, 313.23810451, 428.48202785, 170.95427630, .40805281],
  netuno: [.00859048, .00005105, -55.12002969, 218.45945325, 44.96476227, -.32241464]
};

export function longitudesPlanetarias(data = new Date()) {
  const j2000 = Date.UTC(2000, 0, 1, 12);
  const seculos = (+data - j2000) / (36525 * 86400000);
  const graus = Math.PI / 180;
  return Object.fromEntries(Object.entries(ELEMENTOS).map(([id, [e0, de, l0, dl, p0, dp]]) => {
    const e = e0 + de * seculos;
    const perihelio = (p0 + dp * seculos) * graus;
    const anomaliaMedia = ((l0 + dl * seculos) * graus - perihelio) % (2 * Math.PI);
    let eAnomalia = anomaliaMedia;
    for (let i = 0; i < 5; i++) {
      eAnomalia -= (eAnomalia - e * Math.sin(eAnomalia) - anomaliaMedia) / (1 - e * Math.cos(eAnomalia));
    }
    const x = Math.cos(eAnomalia) - e;
    const z = Math.sqrt(1 - e * e) * Math.sin(eAnomalia);
    return [id, Math.atan2(z, x) + perihelio];
  }));
}