(() => {
  "use strict";

  /* ======================================================================
     Biblioteca Quasar — busca unificada em acervos de agências espaciais.

     Fontes ao vivo (todas aceitam chamadas diretas do navegador / CORS):
       • NASA Image and Video Library .......... imagens e vídeos da NASA
       • Wikimedia Commons ..................... imagens e vídeos de ESA, CNSA,
                                                 ISRO, Roscosmos, JAXA, INPE, AEB,
                                                 CSA, DLR, CNES, ASI, KARI
       • OpenAlex .............................. artigos científicos, filtrados
                                                 pela instituição de cada agência
       • JAXA Earth catalog .................... coleções de dados de observação
     Fontes estáticas (curadoria): portais e arquivos oficiais de cada agência
     e os conjuntos de dados abertos da AEB.
     ====================================================================== */

  const API = {
    nasa: "https://images-api.nasa.gov/search",
    jaxa: "https://data.earth.jaxa.jp/app/mcp/catalog.v2.md",
    openAlex: "https://api.openalex.org/works",
    openAlexInstitutions: "https://api.openalex.org/institutions",
    commons: "https://commons.wikimedia.org/w/api.php"
  };

  const PAGE_SIZE = 18;        // itens por página (fontes locais e papers)
  const NASA_PAGE_SIZE = 24;
  const COMMONS_PAGE_SIZE = 24;
  const COMMONS_PAGE_SIZE_ALL = 5; // por agência, na aba "Todas"
  const PAPERS_PAGE_SIZE = 12;
  const TIMEOUT_MS = 12000;

  const state = {
    query: "",
    agency: "ALL",
    media: "all",
    loading: false,
    firstDone: false,
    sources: [],
    ctx: null,
    controller: null,
    lastRequest: 0,
    jaxaCatalog: null,
    institutions: new Map()
  };

  const form = document.getElementById("lib-search-form");
  const searchInput = document.getElementById("lib-search");
  const grid = document.getElementById("lib-grid");
  const status = document.getElementById("lib-status");
  const count = document.getElementById("lib-count");
  const loadMore = document.getElementById("lib-load-more");

  if (!form || !searchInput || !grid || !status || !count || !loadMore) return;

  /* ---------------------------------------------------------------------
     Agências: nome, termos de busca no Commons, instituição no OpenAlex
     e portais oficiais. `main: true` marca o portal principal.
     `types` indica em quais filtros "Tipo" o portal aparece (vazio = só em "Todos").
     --------------------------------------------------------------------- */
  const AGENCIES = {
    NASA: {
      name: "NASA",
      full: "National Aeronautics and Space Administration",
      institution: { query: "National Aeronautics and Space Administration", match: /national aeronautics/i },
      portals: [
        { main: true, title: "NASA Science", description: "Missões, descobertas e conteúdo científico da NASA sobre Terra, Sol, planetas, astrofísica e biologia espacial.", url: "https://science.nasa.gov/", types: [] },
        { title: "NASA Technical Reports Server (NTRS)", description: "Relatórios técnicos, artigos e documentos de pesquisa e engenharia da NASA.", url: "https://ntrs.nasa.gov/", types: ["publication"], keywords: "relatorios reports technical papers documentos" },
        { title: "NASA Open Data Portal", description: "Conjuntos de dados abertos publicados pela NASA.", url: "https://data.nasa.gov/", types: ["dataset"], keywords: "dados data datasets open" },
        { title: "NASA Earthdata", description: "Dados de observação da Terra: clima, oceanos, atmosfera, gelo e superfície.", url: "https://www.earthdata.nasa.gov/", types: ["dataset"], keywords: "terra earth clima climate satelite satellite oceano ocean" },
        { title: "MAST · Mikulski Archive for Space Telescopes", description: "Arquivo de observações de telescópios espaciais como Hubble, JWST, TESS e Kepler.", url: "https://archive.stsci.edu/", types: ["dataset", "image"], keywords: "hubble webb jwst tess kepler telescopio telescope" },
        { title: "NASA Exoplanet Archive", description: "Catálogo e dados de exoplanetas confirmados e candidatos.", url: "https://exoplanetarchive.ipac.caltech.edu/", types: ["dataset"], keywords: "exoplaneta exoplanet planeta planet" },
        { title: "Planetary Data System (PDS)", description: "Arquivo oficial dos dados de missões planetárias da NASA.", url: "https://pds.nasa.gov/", types: ["dataset"], keywords: "marte mars lua moon jupiter saturno saturn missao mission" },
        { title: "Astronomy Picture of the Day (APOD)", description: "A imagem astronômica do dia, com explicação de astrônomos profissionais.", url: "https://apod.nasa.gov/apod/", types: ["image"], keywords: "astronomia astronomy imagem image" }
      ]
    },
    ESA: {
      name: "ESA",
      full: "European Space Agency",
      commons: '("European Space Agency" OR ESA)',
      inAll: true,
      institution: { query: "European Space Agency", match: /european space agency/i },
      portals: [
        { main: true, title: "ESA Science & Exploration", description: "Missões científicas e de exploração da Agência Espacial Europeia.", url: "https://www.esa.int/Science_Exploration", types: [] },
        { title: "ESA Multimedia · Imagens", description: "Galeria oficial de imagens da ESA: missões, lançamentos, Terra e Universo.", url: "https://www.esa.int/ESA_Multimedia/Images", types: ["image"], keywords: "imagens images fotos galeria" },
        { title: "ESA Multimedia · Vídeos", description: "Vídeos oficiais da ESA sobre missões, astronautas e ciência.", url: "https://www.esa.int/ESA_Multimedia/Videos", types: ["video"], keywords: "videos filmes" },
        { title: "ESA/Hubble", description: "Imagens e notícias do Telescópio Espacial Hubble, publicadas pela ESA.", url: "https://esahubble.org/images/", types: ["image"], keywords: "hubble galaxia galaxy nebulosa nebula telescopio" },
        { title: "ESA/Webb", description: "Imagens e ciência do Telescópio Espacial James Webb, publicadas pela ESA.", url: "https://esawebb.org/images/", types: ["image"], keywords: "webb jwst infravermelho infrared telescopio" },
        { title: "ESASky", description: "Explorador interativo do céu com dados de dezenas de missões astronômicas.", url: "https://sky.esa.int/", types: ["dataset"], keywords: "ceu sky astronomia astronomy mapa" },
        { title: "ESA Science Data Centre (ESDC)", description: "Arquivos científicos da ESA: XMM-Newton, Gaia, Herschel, Planck, Rosetta e outros.", url: "https://www.cosmos.esa.int/web/esdc", types: ["dataset"], keywords: "gaia xmm herschel planck rosetta arquivo archive" },
        { title: "Gaia Archive", description: "Catálogo do Gaia com posições, movimentos e propriedades de bilhões de estrelas.", url: "https://gea.esac.esa.int/archive/", types: ["dataset"], keywords: "gaia estrelas stars catalogo catalog" },
        { title: "ESA Earth Online (EO Gateway)", description: "Portal de dados de observação da Terra da ESA.", url: "https://earth.esa.int/eogateway", types: ["dataset"], keywords: "terra earth observacao observation satelite satellite" },
        { title: "Copernicus Data Space Ecosystem", description: "Acesso aberto aos dados dos satélites Sentinel do programa Copernicus.", url: "https://dataspace.copernicus.eu/", types: ["dataset"], keywords: "sentinel copernicus terra earth clima" },
        { title: "ESA Publications", description: "Publicações oficiais da ESA: relatórios, boletins e documentos técnicos.", url: "https://www.esa.int/About_Us/ESA_Publications", types: ["publication"], keywords: "publicacoes publications relatorios reports" }
      ]
    },
    JAXA: {
      name: "JAXA",
      full: "Japan Aerospace Exploration Agency",
      commons: '(JAXA OR "Japan Aerospace Exploration Agency" OR Hayabusa OR Kaguya)',
      inAll: true,
      institution: { query: "Japan Aerospace Exploration Agency", match: /japan aerospace/i },
      portals: [
        { main: true, title: "DARTS / Astro Query System", description: "Arquivo astronômico da JAXA para pesquisar observações, catálogos e propostas de missões como AKARI, ASCA, Suzaku e XRISM.", url: "https://darts.isas.jaxa.jp/app/astroquery/", types: ["dataset"], keywords: "astronomy astrophysics infrared x-ray radio asteroid akari asca xrism suzaku observation observations" },
        { title: "JAXA · Portal global", description: "Notícias, missões e pesquisa da Agência de Exploração Aeroespacial do Japão.", url: "https://global.jaxa.jp/", types: [] },
        { title: "JAXA Digital Archives", description: "Acervo de imagens e vídeos da JAXA.", url: "https://jda.jaxa.jp/en/", types: ["image", "video"], keywords: "imagens images videos galeria" },
        { title: "G-Portal", description: "Portal de dados de satélites de observação da Terra da JAXA.", url: "https://gportal.jaxa.jp/", types: ["dataset"], keywords: "terra earth satelite satellite observacao observation" },
        { title: "JAXA Earth", description: "Visualização e acesso a dados de observação da Terra da JAXA.", url: "https://earth.jaxa.jp/en/", types: ["dataset"], keywords: "terra earth clima climate" }
      ]
    },
    AEB: {
      name: "AEB",
      full: "Agência Espacial Brasileira",
      commons: '("Agência Espacial Brasileira" OR "Brazilian Space Agency" OR Alcântara)',
      institution: { query: "Agência Espacial Brasileira", match: /ag[eê]ncia espacial brasileira|brazilian space agency/i },
      portals: [
        { main: true, title: "Agência Espacial Brasileira", description: "Portal oficial da AEB: programa espacial brasileiro, missões, parcerias e notícias.", url: "https://www.gov.br/aeb/pt-br", types: [] },
        { title: "AEB · Dados abertos", description: "Todos os conjuntos de dados abertos publicados pela Agência Espacial Brasileira.", url: "https://www.gov.br/aeb/pt-br/acesso-a-informacao/dados-abertos", types: ["dataset"], keywords: "dados abertos open data" }
      ]
    },
    INPE: {
      name: "INPE",
      full: "Instituto Nacional de Pesquisas Espaciais",
      commons: '(INPE OR "Instituto Nacional de Pesquisas Espaciais" OR CBERS)',
      inAll: true,
      institution: { query: "Instituto Nacional de Pesquisas Espaciais", match: /pesquisas espaciais|national institute for space research/i },
      portals: [
        { main: true, title: "INPE · Instituto Nacional de Pesquisas Espaciais", description: "Portal oficial do INPE: satélites, observação da Terra, meteorologia, clima espacial e pesquisa.", url: "https://www.gov.br/inpe/pt-br", types: [] },
        { title: "Catálogo de Imagens do INPE (DGI)", description: "Imagens de satélite CBERS, Amazonia-1, Landsat e outros, disponíveis gratuitamente.", url: "https://www.dgi.inpe.br/catalogo/", types: ["dataset", "image"], keywords: "cbers amazonia landsat satelite satellite imagens images" },
        { title: "BDQueimadas", description: "Banco de dados de focos de queimadas e incêndios detectados por satélites.", url: "https://terrabrasilis.dpi.inpe.br/queimadas/bdqueimadas/", types: ["dataset"], keywords: "queimadas incendios fogo wildfire fire focos" },
        { title: "TerraBrasilis", description: "Dados geográficos de monitoramento ambiental, como desmatamento na Amazônia e no Cerrado.", url: "https://terrabrasilis.dpi.inpe.br/", types: ["dataset"], keywords: "desmatamento deforestation amazonia cerrado ambiente" },
        { title: "Brazil Data Cube", description: "Cubos de dados de observação da Terra para o território brasileiro.", url: "https://brazildatacube.org/", types: ["dataset"], keywords: "terra earth cubo data cube satelite" },
        { title: "INPE · Clima Espacial", description: "Monitoramento do clima espacial: atividade solar, ionosfera e campo magnético.", url: "https://www2.inpe.br/climaespacial/portal/pt/", types: ["dataset"], keywords: "sol sun solar clima espacial space weather ionosfera" },
        { title: "CPTEC/INPE", description: "Previsão de tempo e clima, imagens de satélite meteorológico.", url: "https://www.cptec.inpe.br/", types: ["dataset", "image"], keywords: "tempo clima weather meteorologia previsao" }
      ]
    },
    CNSA: {
      name: "CNSA",
      full: "China National Space Administration",
      commons: '("China National Space Administration" OR CNSA OR "Chang\'e" OR Tianwen OR Tiangong)',
      inAll: true,
      institution: { query: "China National Space Administration", match: /china national space/i },
      portals: [
        { main: true, title: "China National Space Administration", description: "Portal oficial da CNSA: missões lunares, exploração planetária, estações espaciais e programa espacial chinês.", url: "https://www.cnsa.gov.cn/", types: [] },
        { title: "CNSA · Versão em inglês", description: "Notícias e informações da CNSA em inglês.", url: "https://www.cnsa.gov.cn/english/", types: [] },
        { title: "China Lunar and Planetary Exploration Data", description: "Sistema de publicação de dados dos programas chineses de exploração lunar e planetária (Chang'e, Tianwen).", url: "https://moon.bao.ac.cn/", types: ["dataset"], keywords: "lua moon chang'e change tianwen marte mars dados data" },
        { title: "China Manned Space (CMSA)", description: "Programa espacial tripulado chinês: Shenzhou e estação Tiangong.", url: "http://www.cmse.gov.cn/", types: [], keywords: "tiangong shenzhou estacao station astronauta" }
      ]
    },
    ISRO: {
      name: "ISRO",
      full: "Indian Space Research Organisation",
      commons: '(ISRO OR "Indian Space Research Organisation" OR Chandrayaan OR Mangalyaan)',
      inAll: true,
      institution: { query: "Indian Space Research Organisation", match: /indian space research/i },
      portals: [
        { main: true, title: "ISRO · Portal oficial", description: "Missões, lançadores, satélites e notícias da Organização Indiana de Pesquisa Espacial.", url: "https://www.isro.gov.in/", types: [] },
        { title: "Bhoonidhi · ISRO / NRSC", description: "Catálogo de dados de observação da Terra, imagens e produtos de sensoriamento remoto.", url: "https://bhoonidhi.nrsc.gov.in/bhoonidhi/home.html", types: ["dataset", "image"], keywords: "terra earth sensoriamento remote sensing satelite" },
        { title: "ISSDC · Indian Space Science Data Centre", description: "Arquivo oficial de dados científicos das missões da ISRO (Chandrayaan, Mangalyaan, AstroSat).", url: "https://www.issdc.gov.in/", types: ["dataset"], keywords: "chandrayaan mangalyaan astrosat lua moon marte mars" },
        { title: "MOSDAC", description: "Dados meteorológicos e oceanográficos de satélites indianos.", url: "https://www.mosdac.gov.in/", types: ["dataset"], keywords: "meteorologia weather oceano ocean clima climate" },
        { title: "NRSC · National Remote Sensing Centre", description: "Centro nacional indiano de sensoriamento remoto.", url: "https://www.nrsc.gov.in/", types: [], keywords: "sensoriamento remote sensing terra earth" }
      ]
    },
    ROSCOSMOS: {
      name: "ROSCOSMOS",
      full: "Roscosmos",
      commons: '(Roscosmos OR "Russian Federal Space Agency" OR Soyuz OR Роскосмос)',
      inAll: true,
      institution: { query: "Roscosmos", match: /roscosmos|russian space agency|russian federal space/i },
      portals: [
        { main: true, title: "Roscosmos · Portal oficial", description: "Missões, satélites, lançamentos e informações do programa espacial russo.", url: "https://www.roscosmos.ru/", types: [] },
        { title: "Roscosmos · Versão em inglês", description: "Notícias e informações da Roscosmos em inglês.", url: "https://en.roscosmos.ru/", types: [] },
        { title: "Geoportal Roscosmos", description: "Geoportal de dados de sensoriamento remoto da Terra da Roscosmos.", url: "https://gptl.ru/", types: ["dataset"], keywords: "terra earth sensoriamento remote sensing satelite" }
      ]
    },
    CSA: {
      name: "CSA",
      full: "Canadian Space Agency",
      commons: '("Canadian Space Agency" OR "Agence spatiale canadienne")',
      institution: { query: "Canadian Space Agency", match: /canadian space agency/i },
      portals: [
        { main: true, title: "Canadian Space Agency", description: "Agência Espacial Canadense: astronautas, Canadarm, observação da Terra e exploração.", url: "https://www.asc-csa.gc.ca/eng/", types: [] },
        { title: "Canadian Astronomy Data Centre (CADC)", description: "Arquivo canadense de dados astronômicos.", url: "https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/", types: ["dataset"], keywords: "astronomia astronomy telescopio telescope" }
      ]
    },
    DLR: {
      name: "DLR",
      full: "German Aerospace Center",
      commons: '("German Aerospace Center" OR "Deutsches Zentrum für Luft- und Raumfahrt" OR DLR)',
      institution: { query: "German Aerospace Center", match: /german aerospace|deutsches zentrum f/i },
      portals: [
        { main: true, title: "DLR · Centro Aeroespacial Alemão", description: "Pesquisa em aeronáutica, espaço, energia e transporte do centro aeroespacial da Alemanha.", url: "https://www.dlr.de/en", types: [] },
        { title: "DLR Geoservice", description: "Dados de observação da Terra do DLR, como TerraSAR-X e TanDEM-X.", url: "https://geoservice.dlr.de/", types: ["dataset"], keywords: "terra earth radar terrasar tandem satelite" }
      ]
    },
    CNES: {
      name: "CNES",
      full: "Centre National d'Études Spatiales",
      commons: '(CNES OR "Centre national d\'études spatiales")',
      institution: { query: "Centre National d'Études Spatiales", match: /centre national d.[eé]tudes spatiales|^cnes/i },
      portals: [
        { main: true, title: "CNES · Agência Espacial Francesa", description: "Programa espacial francês: Ariane, observação da Terra, ciência e exploração.", url: "https://cnes.fr/en", types: [] }
      ]
    },
    ASI: {
      name: "ASI",
      full: "Italian Space Agency",
      commons: '("Italian Space Agency" OR "Agenzia Spaziale Italiana")',
      institution: { query: "Italian Space Agency", match: /italian space agency|agenzia spaziale italiana/i },
      portals: [
        { main: true, title: "ASI · Agência Espacial Italiana", description: "Programa espacial italiano: ciência, lançadores, observação da Terra e exploração.", url: "https://www.asi.it/en/", types: [] },
        { title: "ASI Space Science Data Center (SSDC)", description: "Centro de dados científicos da ASI com acesso a arquivos de várias missões.", url: "https://www.ssdc.asi.it/", types: ["dataset"], keywords: "astronomia astronomy dados data missao mission" }
      ]
    },
    KARI: {
      name: "KARI",
      full: "Korea Aerospace Research Institute",
      commons: '(KARI OR "Korea Aerospace Research Institute" OR Danuri)',
      institution: { query: "Korea Aerospace Research Institute", match: /korea aerospace research/i },
      portals: [
        { main: true, title: "KARI · Instituto Coreano de Pesquisa Aeroespacial", description: "Satélites, lançadores (Nuri) e missão lunar Danuri da Coreia do Sul.", url: "https://www.kari.re.kr/eng/", types: [] }
      ]
    }
  };

  const ALL_ORDER = ["NASA", "ESA", "JAXA", "AEB", "INPE", "CNSA", "ISRO", "ROSCOSMOS", "CSA", "DLR", "CNES", "ASI", "KARI"];

  const AEB_DATASETS = [
    {
      title: "Objetos Espaciais Brasileiros 2025 · JSON",
      description: "Registro nacional de objetos espaciais brasileiros disponibilizado pela Agência Espacial Brasileira em pacote JSON.",
      url: "https://www.gov.br/aeb/pt-br/acesso-a-informacao/dados-abertos/dados/objetos-espaciais-brasileiros-2025_json.zip/view",
      kind: "CONJUNTO DE DADOS · JSON",
      keywords: "satélite satelites objetos orbitais brasil brasileiro registro resbra",
      date: "2025", source: "AEB", mediaType: "dataset"
    },
    {
      title: "Objetos Espaciais Brasileiros 2025 · CSV",
      description: "Versão tabular do registro nacional de objetos espaciais brasileiros, publicada pela AEB.",
      url: "https://www.gov.br/aeb/pt-br/acesso-a-informacao/dados-abertos/dados/objetos_espaciais_brasileiros_csv_2025.zip/view",
      kind: "CONJUNTO DE DADOS · CSV",
      keywords: "satélite satelites objetos orbitais brasil brasileiro registro resbra",
      date: "2025", source: "AEB", mediaType: "dataset"
    },
    {
      title: "Catálogo das Indústrias Espaciais Brasileiras 2025 · JSON",
      description: "Dados abertos sobre empresas e organizações que integram o setor industrial espacial brasileiro.",
      url: "https://www.gov.br/aeb/pt-br/acesso-a-informacao/dados-abertos/dados/catalogo_das_industrias_espaciais_brasileiras-2025-json.zip/view",
      kind: "CONJUNTO DE DADOS · JSON",
      keywords: "indústria empresas setor espacial brasil tecnologia",
      date: "2025", source: "AEB", mediaType: "dataset"
    },
    {
      title: "Catálogo das Indústrias Espaciais Brasileiras 2025 · CSV",
      description: "Versão CSV do catálogo de indústrias espaciais brasileiras publicado pela AEB.",
      url: "https://www.gov.br/aeb/pt-br/acesso-a-informacao/dados-abertos/dados/catalogo_das_industrias_espaciais_brasileiras-2025-csv.zip/view",
      kind: "CONJUNTO DE DADOS · CSV",
      keywords: "indústria empresas setor espacial brasil tecnologia",
      date: "2025", source: "AEB", mediaType: "dataset"
    }
  ];

  /* ---------------------------------------------------------------------
     Tradução PT → EN dos termos de busca (as APIs indexam em inglês)
     --------------------------------------------------------------------- */
  const PHRASES = {
    "sistema solar": "solar system", "buraco negro": "black hole", "buracos negros": "black holes",
    "via lactea": "milky way", "estacao espacial": "space station", "materia escura": "dark matter",
    "energia escura": "dark energy", "ondas gravitacionais": "gravitational waves",
    "clima espacial": "space weather", "cinturao de asteroides": "asteroid belt"
  };

  const WORDS = {
    marte: "Mars", lua: "Moon", terra: "Earth", sol: "Sun", jupiter: "Jupiter", saturno: "Saturn",
    mercurio: "Mercury", venus: "Venus", urano: "Uranus", netuno: "Neptune", plutao: "Pluto",
    asteroide: "asteroid", asteroides: "asteroids", cometa: "comet", cometas: "comets",
    nebulosa: "nebula", nebulosas: "nebulae", galaxia: "galaxy", galaxias: "galaxies",
    estrela: "star", estrelas: "stars", planeta: "planet", planetas: "planets",
    foguete: "rocket", foguetes: "rockets", satelite: "satellite", satelites: "satellites",
    astronauta: "astronaut", astronautas: "astronauts", telescopio: "telescope", telescopios: "telescopes",
    espaco: "space", universo: "universe", gravidade: "gravity", orbita: "orbit",
    lancamento: "launch", missao: "mission", missoes: "missions", estacao: "station",
    exoplaneta: "exoplanet", exoplanetas: "exoplanets", queimada: "wildfire", queimadas: "wildfires",
    desmatamento: "deforestation", amazonia: "Amazon", oceano: "ocean", oceanos: "oceans",
    floresta: "forest", clima: "climate", aurora: "aurora", eclipse: "eclipse", supernova: "supernova",
    cratera: "crater", crateras: "craters", gelo: "ice", vulcao: "volcano", vulcoes: "volcanoes"
  };

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }

  function translateQuery(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const whole = normalize(raw);
    if (PHRASES[whole]) return PHRASES[whole];
    return raw.split(/\s+/).map(word => WORDS[normalize(word)] || word).join(" ");
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function safeUrl(value) {
    return /^https?:\/\//i.test(String(value || "")) ? String(value) : "#";
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function shorten(text, max) {
    const t = String(text || "").trim();
    return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
  }

  function dateLabel(value) {
    if (value === undefined || value === null || value === "") return "DATA NÃO INFORMADA";
    const text = String(value).trim();
    if (/^\d{4}$/.test(text)) return text; // só o ano (evita virar 1970)
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return escapeHTML(text);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "UTC"
    }).format(date).toUpperCase();
  }

  function updatePressed(selector, attribute, selected) {
    document.querySelectorAll(selector).forEach(element => {
      element.setAttribute("aria-pressed", String(element.getAttribute(attribute) === selected));
    });
  }

  function setLoading(on) {
    state.loading = on;
    loadMore.disabled = on;
    loadMore.textContent = on ? "CARREGANDO…" : "CARREGAR MAIS RESULTADOS ↓";
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  /* ---------------------------------------------------------------------
     Rede: timeout, nova tentativa em falhas transitórias (rede, 429, 5xx)
     e cancelamento quando uma nova pesquisa começa.
     --------------------------------------------------------------------- */
  async function fetchWithTimeout(url, options = {}, { timeout = TIMEOUT_MS, retries = 1, signal } = {}) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (signal?.aborted) throw new DOMException("Pesquisa substituída.", "AbortError");

      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
      const onAbort = () => controller.abort();
      signal?.addEventListener("abort", onAbort, { once: true });

      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (response.ok) return response;

        const error = new Error(`A fonte respondeu com HTTP ${response.status}.`);
        error.status = response.status;
        if (response.status === 429 || response.status >= 500) lastError = error;
        else throw error;
      } catch (error) {
        if (signal?.aborted) throw error;
        if (error.status && error.status < 500 && error.status !== 429) throw error;
        if (timedOut) lastError = new Error(`A conexão excedeu ${Math.round(timeout / 1000)} segundos.`);
        else if (error.status) lastError = error;
        else lastError = new Error("Não foi possível conectar à fonte (rede indisponível ou acesso bloqueado).");
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }

      if (attempt < retries) await sleep(600 * (attempt + 1));
    }

    throw lastError;
  }

  /* ---------------------------------------------------------------------
     Cartões e renderização
     --------------------------------------------------------------------- */

  // Imagem usada nos cartões que não têm imagem própria (ou cuja imagem não carrega).
  // Coloque este arquivo na mesma pasta do biblioteca.html.
  const FALLBACK_IMAGE = "praarquivosemimagem.png";

  // Marcador de texto: último recurso, se até a imagem padrão estiver ausente.
  function placeholder(agency, kind) {
    return `<div class="lib-card-placeholder" aria-hidden="true"><span>${escapeHTML(agency)}</span><small>${escapeHTML(kind)}</small></div>`;
  }

  function fallbackImage(agency, kind) {
    return `<img src="${FALLBACK_IMAGE}" alt="" loading="lazy" data-fallback="1" data-agency="${escapeHTML(agency)}" data-kind="${escapeHTML(kind)}">`;
  }

  function card(item) {
    const title = escapeHTML(item.title || "Registro sem título");
    const description = escapeHTML(item.description || "Descrição não disponibilizada pela fonte.");
    const url = escapeHTML(safeUrl(item.url));
    const agencyRaw = item.source || "ACERVO";
    const kindRaw = item.kind || "REGISTRO CIENTÍFICO";
    const agency = escapeHTML(agencyRaw);
    const kind = escapeHTML(kindRaw);
    const date = dateLabel(item.date);
    const image = item.image && safeUrl(item.image) !== "#"
      ? `<img src="${escapeHTML(item.image)}" alt="${title}" loading="lazy" referrerpolicy="no-referrer" data-agency="${agency}" data-kind="${kind}">`
      : fallbackImage(agencyRaw, kindRaw);

    return `<article class="lib-card">
      <a class="lib-card-media" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${title}">
        ${image}<span class="lib-card-type">${kind}</span>
      </a>
      <div class="lib-card-body">
        <div class="lib-card-meta"><span>${agency} · FONTE</span><span>${kind}</span></div>
        <h3>${title}</h3><p>${description}</p>
        <div class="lib-card-footer"><span class="lib-card-date">${date}</span>
          <a class="lib-card-link" href="${url}" target="_blank" rel="noopener noreferrer">Abrir registro ↗</a>
        </div>
      </div>
    </article>`;
  }

  // Imagem que não carrega (link quebrado, bloqueio): troca pela imagem padrão.
  // Se a própria imagem padrão não carregar, usa o marcador de texto (evita loop).
  grid.addEventListener("error", event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.closest(".lib-card-media")) return;
    const agency = img.dataset.agency || "ACERVO";
    const kind = img.dataset.kind || "REGISTRO CIENTÍFICO";
    img.outerHTML = img.dataset.fallback ? placeholder(agency, kind) : fallbackImage(agency, kind);
  }, true);

  function render(items, emptyMessage) {
    if (!items.length) {
      grid.innerHTML = `<div class="lib-empty"><strong>Nenhum registro encontrado.</strong>${escapeHTML(emptyMessage || "Tente outro termo ou altere os filtros.")}</div>`;
      return;
    }
    grid.innerHTML = items.map(card).join("");
  }

  /* ---------------------------------------------------------------------
     Filtros e busca local
     --------------------------------------------------------------------- */
  function matchesQuery(item, query) {
    const variants = [normalize(query), normalize(translateQuery(query))].filter(Boolean);
    if (!variants.length) return true;

    const haystack = normalize(`${item.title || ""} ${item.description || ""} ${item.keywords || ""} ${item.source || ""}`);
    return variants.some(q => haystack.includes(q) || q.split(/\s+/).filter(Boolean).every(term => haystack.includes(term)));
  }

  function typesOf(item) {
    return item.types || [item.mediaType];
  }

  function passesMedia(item) {
    return state.media === "all" || typesOf(item).includes(state.media);
  }

  /* ---------------------------------------------------------------------
     Fontes
     Cada fonte devolve { items, hasMore, cursor, warning? } por página.
     --------------------------------------------------------------------- */
  function makeSource(id, label, fetchPage) {
    return { id, label, fetchPage, items: [], cursor: null, hasMore: true, loaded: false, failed: false };
  }

  function localSource(id, label, getItems) {
    return makeSource(id, label, async (cursor, ctx) => {
      const { items, warning } = await getItems(ctx);
      const start = cursor?.start || 0;
      return {
        items: items.slice(start, start + PAGE_SIZE),
        hasMore: start + PAGE_SIZE < items.length,
        cursor: { start: start + PAGE_SIZE },
        warning
      };
    });
  }

  // --- Portais oficiais (curadoria) -------------------------------------
  function portalItem(key, portal) {
    return {
      title: portal.title,
      description: portal.description,
      url: portal.url,
      date: "ACESSO AO ACERVO",
      source: AGENCIES[key].name,
      kind: "PORTAL OFICIAL",
      keywords: portal.keywords || "",
      types: portal.types || [],
      mediaType: (portal.types || [])[0] || "portal",
      main: Boolean(portal.main)
    };
  }

  function portalSource(keys) {
    return localSource("portals", "Portais oficiais", async ctx => {
      const everything = keys.flatMap(key => AGENCIES[key].portals.map(portal => portalItem(key, portal)));
      let items = everything;
      if (ctx.agency === "ALL") {
        items = ctx.query.trim()
          ? everything.filter(item => matchesQuery(item, ctx.query))
          : everything.filter(item => item.main);
      }
      return { items: items.filter(item => ctx.media === "all" || typesOf(item).includes(ctx.media)) };
    });
  }

  // --- NASA Image and Video Library -------------------------------------
  function nasaSource() {
    return makeSource("nasa", "NASA", async (cursor, ctx) => {
      const page = cursor?.page || 1;
      const size = ctx.agency === "ALL" ? PAGE_SIZE : NASA_PAGE_SIZE;
      const params = new URLSearchParams({
        q: translateQuery(ctx.query) || "space",
        page: String(page),
        page_size: String(size),
        media_type: ctx.media === "video" ? "video" : ctx.media === "image" ? "image" : "image,video"
      });

      const response = await fetchWithTimeout(`${API.nasa}?${params}`, { headers: { Accept: "application/json" } }, { signal: ctx.signal });
      const payload = await response.json();
      const collection = payload?.collection || {};

      const items = (collection.items || []).map(item => {
        const data = item?.data?.[0] || {};
        const imageLink = item?.links?.find(link => link.render === "image")?.href ||
          item?.links?.find(link => link.rel === "preview")?.href || "";
        const isVideo = data.media_type === "video";

        return {
          title: data.title || "Registro NASA",
          description: shorten(cleanText(data.description || data.description_508), 320),
          date: data.date_created,
          image: imageLink,
          url: data.nasa_id
            ? `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`
            : "https://images.nasa.gov/",
          source: "NASA",
          kind: isVideo ? "VÍDEO" : "IMAGEM",
          mediaType: isVideo ? "video" : "image"
        };
      });

      const total = Number(collection.metadata?.total_hits || 0);
      return {
        items,
        hasMore: page * size < Math.min(total, 10000),
        cursor: { page: page + 1 }
      };
    });
  }

  // --- Wikimedia Commons: acervo de imagens/vídeos publicado por agências ---
  function commonsQuery(key, ctx) {
    const filetype = ctx.media === "video" ? "filetype:video" : ctx.media === "image" ? "filetype:bitmap" : "filetype:bitmap|video";
    return [AGENCIES[key].commons, translateQuery(ctx.query), filetype].filter(Boolean).join(" ");
  }

  function commonsItem(page, agency) {
    const info = page?.imageinfo?.[0];
    if (!info || !info.descriptionurl) return null;

    const type = String(info.mediatype || "").toUpperCase();
    if (!["BITMAP", "DRAWING", "VIDEO"].includes(type)) return null;

    const meta = info.extmetadata || {};
    const val = name => cleanText(meta[name]?.value);
    const fileName = String(page.title || "").replace(/^[^:]+:/, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
    const title = val("ObjectName") || fileName || "Arquivo do Wikimedia Commons";
    const credit = shorten(val("Artist") || val("Credit"), 90);
    const license = val("LicenseShortName");
    const parts = [
      shorten(val("ImageDescription") || title, 260),
      credit && `Crédito: ${credit}.`,
      license && `Licença: ${license}.`
    ].filter(Boolean);
    const rawDate = val("DateTimeOriginal");
    const date = rawDate && !Number.isNaN(new Date(rawDate).getTime()) ? rawDate : val("DateTime");
    const isVideo = type === "VIDEO";

    return {
      title,
      description: `${parts.join(" ")} Arquivo hospedado no Wikimedia Commons.`,
      date,
      image: info.thumburl || (isVideo ? "" : info.url),
      url: info.descriptionurl,
      source: agency.name,
      kind: isVideo ? "VÍDEO · COMMONS" : "IMAGEM · COMMONS",
      mediaType: isVideo ? "video" : "image"
    };
  }

  function commonsSource(key) {
    const agency = AGENCIES[key];
    return makeSource(`commons:${key}`, `${agency.name} (Commons)`, async (cursor, ctx) => {
      const offset = cursor?.offset || 0;
      const size = ctx.agency === "ALL" ? COMMONS_PAGE_SIZE_ALL : COMMONS_PAGE_SIZE;
      const params = new URLSearchParams({
        action: "query", format: "json", formatversion: "2", origin: "*",
        generator: "search", gsrnamespace: "6", gsrsearch: commonsQuery(key, ctx),
        gsrlimit: String(size), gsroffset: String(offset),
        prop: "imageinfo", iiprop: "url|mime|mediatype|extmetadata", iiurlwidth: "480",
        iiextmetadatafilter: "ObjectName|ImageDescription|Artist|Credit|LicenseShortName|DateTimeOriginal|DateTime"
      });

      const response = await fetchWithTimeout(`${API.commons}?${params}`, { headers: { Accept: "application/json" } }, { signal: ctx.signal });
      const data = await response.json();
      if (data.error) throw new Error(data.error.info || "Erro na API do Wikimedia Commons.");

      const pages = (data.query?.pages || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0));
      const next = data.continue?.gsroffset;

      return {
        items: pages.map(page => commonsItem(page, agency)).filter(Boolean),
        hasMore: typeof next === "number",
        cursor: { offset: next }
      };
    });
  }

  // --- OpenAlex: artigos, filtrados pela instituição da agência ----------
  function resolveInstitution(key) {
    if (!state.institutions.has(key)) {
      const config = AGENCIES[key].institution;
      const promise = (async () => {
        if (!config) return null;
        const params = new URLSearchParams({ search: config.query, "per-page": "5", select: "id,display_name,works_count" });
        const response = await fetchWithTimeout(`${API.openAlexInstitutions}?${params}`, { headers: { Accept: "application/json" } });
        const data = await response.json();
        const hit = (data.results || [])
          .filter(entry => config.match.test(entry.display_name || ""))
          .sort((a, b) => (b.works_count || 0) - (a.works_count || 0))[0];
        return hit ? String(hit.id).split("/").pop() : null;
      })().catch(error => {
        state.institutions.delete(key); // permite tentar de novo depois
        console.warn(`Quasar: não foi possível localizar ${key} no OpenAlex.`, error);
        return null;
      });
      state.institutions.set(key, promise);
    }
    return state.institutions.get(key);
  }

  function abstractText(inverted) {
    if (!inverted || typeof inverted !== "object") return "";
    const words = [];
    for (const [word, positions] of Object.entries(inverted)) {
      for (const position of positions) words[position] = word;
    }
    return words.filter(Boolean).join(" ");
  }

  function papersSource(key) {
    const label = key ? `${AGENCIES[key].name} (artigos)` : "Artigos";
    return makeSource(`papers:${key || "all"}`, label, async (cursor, ctx) => {
      const page = cursor?.page || 1;
      const translated = translateQuery(ctx.query);
      const params = new URLSearchParams({
        "per-page": String(PAPERS_PAGE_SIZE),
        page: String(page),
        select: "id,doi,title,display_name,publication_year,publication_date,authorships,primary_location,open_access,type,abstract_inverted_index"
      });

      let search = translated;
      if (key) {
        const institution = await resolveInstitution(key);
        if (institution) params.set("filter", `authorships.institutions.lineage:${institution}`);
        else search = `"${AGENCIES[key].full}"${translated ? ` ${translated}` : ""}`;
      } else if (!search) {
        search = "astronomy";
      }

      if (search) {
        params.set("search", search);
        params.set("sort", "relevance_score:desc");
      } else {
        params.set("sort", "cited_by_count:desc");
      }

      const response = await fetchWithTimeout(`${API.openAlex}?${params}`, { headers: { Accept: "application/json" } }, { signal: ctx.signal });
      const payload = await response.json();

      const items = (payload.results || []).map(work => {
        const authors = (work.authorships || []).slice(0, 3)
          .map(author => author.author?.display_name).filter(Boolean).join(", ");
        const doi = String(work.doi || "").replace(/^https?:\/\/doi\.org\//i, "");
        const url = work.primary_location?.landing_page_url ||
          (doi ? `https://doi.org/${doi}` : `https://openalex.org/${String(work.id || "").split("/").pop()}`);
        const summary = shorten(abstractText(work.abstract_inverted_index), 260);

        return {
          title: work.title || work.display_name || "Publicação sem título",
          description: [
            authors && `Autores: ${authors}.`,
            summary,
            work.open_access?.is_oa && "Acesso aberto.",
            !summary && "Registro bibliográfico indexado no OpenAlex."
          ].filter(Boolean).join(" "),
          date: work.publication_date || work.publication_year,
          url,
          source: key ? AGENCIES[key].name : "PUBLICAÇÕES",
          kind: "ARTIGO CIENTÍFICO",
          mediaType: "publication"
        };
      });

      const total = Number(payload.meta?.count || 0);
      const perPage = Number(payload.meta?.per_page || PAPERS_PAGE_SIZE);
      return {
        items,
        hasMore: page * perPage < Math.min(total, 10000),
        cursor: { page: page + 1 }
      };
    });
  }

  // --- JAXA Earth catalog ---------------------------------------------------
  // Lê campos do catálogo JAXA em Markdown sem depender de uma regex gerada dinamicamente.
  function jaxaParse(markdown) {
    const text = String(markdown || "");
    const datasetSection = text.split(/^# Dataset List\s*$/im)[1] || "";
    const blocks = datasetSection.split(/^##\s+/m).slice(1);

    return blocks.map(block => {
      const lines = block.split(/\r?\n/);
      const heading = (lines.shift() || "").trim();
      const fields = {};

      for (const line of lines) {
        const match = line.match(/^\s*\*\s*([^:]+):\s*(.*?)\s*$/);
        if (match) fields[match[1].trim().toLowerCase()] = match[2].trim();
      }

      const title = cleanText(fields.title) || cleanText(heading);
      let collection = fields.collection || "";
      const markdownLink = collection.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (markdownLink) collection = markdownLink[2];
      collection = collection.replace(/[)>\]]+$/, "").trim();
      if (!title || !/^https?:\/\//i.test(collection)) return null;

      const viewer = new URL("https://data.earth.jaxa.jp/app/stac/v2/");
      viewer.searchParams.set("url", collection);

      return {
        title,
        description: shorten(cleanText(fields.description), 320) || `Coleção ${fields.id || ""} do catálogo JAXA Earth.`,
        url: viewer.toString(),
        date: fields.startdate || "",
        source: "JAXA",
        kind: "DADOS DE OBSERVAÇÃO",
        keywords: cleanText(fields.keywords || ""),
        mediaType: "dataset"
      };
    }).filter(Boolean);
  }

  async function getJaxaCatalog(signal) {
    if (!state.jaxaCatalog) {
      state.jaxaCatalog = fetchWithTimeout(API.jaxa, { headers: { Accept: "text/markdown,text/plain,*/*" } }, { signal })
        .then(response => response.text())
        .then(jaxaParse)
        .catch(error => {
          state.jaxaCatalog = null; // tenta de novo na próxima pesquisa
          throw error;
        });
    }
    return state.jaxaCatalog;
  }

  function jaxaSource() {
    return localSource("jaxa-catalog", "JAXA (catálogo)", async ctx => {
      try {
        const collections = await getJaxaCatalog(ctx.signal);
        return { items: collections.filter(item => matchesQuery(item, ctx.query)) };
      } catch (error) {
        if (ctx.signal?.aborted) throw error;
        console.warn("Quasar: catálogo JAXA Earth indisponível.", error);
        // Não derruba a pesquisa: os portais oficiais da JAXA continuam disponíveis.
        return { items: [], warning: "o catálogo JAXA Earth não respondeu (os portais oficiais da JAXA continuam listados)" };
      }
    });
  }

  // --- AEB: dados abertos ---------------------------------------------------
  function aebSource() {
    return localSource("aeb-data", "AEB (dados abertos)", async ctx => ({
      items: AEB_DATASETS.filter(item => matchesQuery(item, ctx.query))
    }));
  }

  /* ---------------------------------------------------------------------
     Planejamento: quais fontes consultar para (agência × tipo)
     --------------------------------------------------------------------- */
  function planSources(ctx) {
    const { agency, media } = ctx;
    const keys = agency === "ALL" ? ALL_ORDER : [agency];
    const wantsVisual = media === "all" || media === "image" || media === "video";
    const wantsData = media === "all" || media === "dataset";
    const wantsPapers = media === "all" || media === "publication";
    const sources = [];

    if (AGENCIES[agency] || agency === "ALL") sources.push(portalSource(keys));
    if (wantsVisual && (agency === "ALL" || agency === "NASA")) sources.push(nasaSource());
    if (wantsVisual) {
      keys.filter(key => AGENCIES[key].commons && (agency !== "ALL" || AGENCIES[key].inAll))
        .forEach(key => sources.push(commonsSource(key)));
    }
    if (wantsData && (agency === "ALL" || agency === "JAXA")) sources.push(jaxaSource());
    if (wantsData && (agency === "ALL" || agency === "AEB")) sources.push(aebSource());
    if (wantsPapers) sources.push(papersSource(agency === "ALL" ? null : agency));

    return sources;
  }

  /* ---------------------------------------------------------------------
     Execução, mesclagem e mensagens
     --------------------------------------------------------------------- */
  function interleave(lists) {
    const seen = new Set();
    const merged = [];
    const longest = Math.max(0, ...lists.map(list => list.length));
    for (let i = 0; i < longest; i++) {
      for (const list of lists) {
        const item = list[i];
        if (!item) continue;
        const key = item.url;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }

  async function loadSource(source, requestId) {
    try {
      const result = await source.fetchPage(source.cursor, state.ctx);
      if (requestId !== state.lastRequest) return;
      source.items.push(...result.items);
      source.cursor = result.cursor;
      source.hasMore = Boolean(result.hasMore);
      if (result.warning) source.warning = result.warning;
    } catch (error) {
      if (requestId !== state.lastRequest || state.ctx?.signal?.aborted) return;
      source.failed = true;
      source.hasMore = false;
      source.error = error;
      console.warn(`Quasar: falha ao consultar ${source.label}.`, error);
    } finally {
      if (requestId === state.lastRequest) {
        source.loaded = true;
        refresh();
      }
    }
  }

  function describeScope() {
    return state.agency === "ALL"
      ? "NASA, JAXA, AEB, INPE, ESA, CNSA, ISRO, Roscosmos e outras agências"
      : AGENCIES[state.agency]?.name || state.agency;
  }

  function refresh() {
    const lists = state.sources.map(source => source.items.filter(passesMedia));
    const merged = interleave(lists);
    const pending = state.sources.filter(source => !source.loaded).length;
    const failed = state.sources.filter(source => source.failed);
    const warnings = state.sources.map(source => source.warning).filter(Boolean);
    const withResults = new Set(merged.map(item => item.source));
    const anyMore = state.sources.some(source => source.hasMore && !source.failed);

    if (merged.length || !pending) {
      render(merged, "Nenhuma fonte retornou resultados para esta combinação. Tente outro termo ou remova o filtro de tipo.");
    }

    count.textContent = pending
      ? `${merged.length} RESULTADOS · CONSULTANDO ${pending} FONTE${pending > 1 ? "S" : ""}…`
      : `${merged.length} RESULTADOS · ${withResults.size} ${withResults.size === 1 ? "FONTE" : "FONTES"}`;

    status.classList.remove("error");
    if (pending) {
      status.textContent = `Pesquisando em ${describeScope()}… ${state.sources.length - pending} de ${state.sources.length} fontes responderam.`;
    } else if (failed.length || warnings.length) {
      status.classList.add("error");
      const notes = [];
      if (failed.length) notes.push(`${failed.map(source => source.label).join(", ")} não respondeu ou está indisponível`);
      warnings.forEach(note => notes.push(note));
      status.textContent = `Pesquisa parcial: ${notes.join("; ")}. Os resultados das outras fontes foram mantidos.`;
    } else {
      status.textContent = `${merged.length} resultados de ${describeScope()}. Cada registro mantém a identificação da fonte original.`;
    }

    loadMore.hidden = !(state.firstDone && anyMore);
  }

  async function runSearch({ append = false } = {}) {
    const requestId = ++state.lastRequest;

    if (append) {
      setLoading(true);
      await Promise.all(state.sources.filter(source => source.hasMore && !source.failed).map(source => loadSource(source, requestId)));
      if (requestId === state.lastRequest) { setLoading(false); refresh(); }
      return;
    }

    state.controller?.abort();
    state.controller = new AbortController();
    state.ctx = { query: state.query, agency: state.agency, media: state.media, signal: state.controller.signal };
    state.sources = planSources(state.ctx);
    state.firstDone = false;

    status.classList.remove("error");
    status.textContent = `Pesquisando em ${describeScope()}…`;
    count.textContent = "CONSULTANDO ACERVOS…";
    loadMore.hidden = true;
    setLoading(true);

    await Promise.all(state.sources.map(source => loadSource(source, requestId)));
    if (requestId !== state.lastRequest) return;

    state.firstDone = true;
    setLoading(false);
    refresh();
  }

  /* ---------------------------------------------------------------------
     Eventos
     --------------------------------------------------------------------- */
  form.addEventListener("submit", event => {
    event.preventDefault();
    state.query = searchInput.value.trim();
    runSearch();
  });

  document.querySelectorAll("[data-agency]").forEach(button => {
    button.addEventListener("click", () => {
      state.agency = button.dataset.agency || "ALL";
      state.query = searchInput.value.trim();
      updatePressed("[data-agency]", "data-agency", state.agency);
      runSearch();
    });
  });

  document.querySelectorAll("[data-media]").forEach(button => {
    button.addEventListener("click", () => {
      state.media = button.dataset.media || "all";
      state.query = searchInput.value.trim();
      updatePressed("[data-media]", "data-media", state.media);
      runSearch();
    });
  });

  loadMore.addEventListener("click", () => {
    if (state.loading || !state.sources.some(source => source.hasMore && !source.failed)) return;
    runSearch({ append: true });
  });

  status.textContent = "Digite um termo e clique em Pesquisar para consultar os acervos científicos.";
  count.textContent = "PRONTO PARA PESQUISAR";
})();