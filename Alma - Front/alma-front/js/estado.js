/* ============================================================
   ESTADO DO APP E REGRAS DE NEGÓCIO
   - estado: favoritos, alertas, notificações, buscas… (salvo no navegador)
   - funções de preço: melhor oferta, desconto, histórico, variação
   ============================================================ */

const CHAVE_ARMAZENAMENTO = "alma:estado:v1";

/* localStorage pode não existir (aba anônima, bloqueio). Nesse caso tudo segue só em memória. */
const armazenamento = {
  ler(chave) {
    try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
  },
};

let estado = carregarEstado();

function carregarEstado() {
  const base = estadoDemonstracao();
  const salvo = armazenamento.ler(CHAVE_ARMAZENAMENTO);
  if (salvo && salvo.versao === base.versao) {
    return { ...base, ...salvo, preferencias: { ...base.preferencias, ...(salvo.preferencias || {}) } };
  }
  return base;
}

function salvarEstado() {
  armazenamento.gravar(CHAVE_ARMAZENAMENTO, estado);
}

/* Restaura favoritos, alertas etc. de demonstração, mantendo o usuário logado e o tema. */
function restaurarDemonstracao() {
  const usuario = estado.usuario;
  const tema = estado.preferencias.tema;
  estado = estadoDemonstracao();
  estado.usuario = usuario;
  estado.preferencias.tema = tema; // o modo noturno escolhido continua valendo
  salvarEstado();
}

/* ---------- Formatação ---------- */

const formatoReais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoCompacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** 1150 → "R$ 1.150,00" (o espaço é inquebrável, então "R$" nunca fica sozinho na linha) */
function reais(valor) {
  return formatoReais.format(valor);
}

/** 1200 → "1,2 mil" */
function contagem(n) {
  return n >= 1000 ? formatoCompacto.format(n) : String(n);
}

/** 0.333 → "33%" */
function porcento(fracao) {
  return Math.round(Math.abs(fracao) * 100) + "%";
}

function mesAno(data) {
  const m = MESES[data.getMonth()];
  return m.charAt(0).toUpperCase() + m.slice(1) + " " + data.getFullYear();
}

function diaMes(data) {
  return String(data.getDate()).padStart(2, "0") + "/" + String(data.getMonth() + 1).padStart(2, "0");
}

/** Tempo desde um instante: "Agora", "5 min", "2h", "Ontem", "3 dias", "2 sem" */
function tempoRelativo(instante) {
  const seg = Math.max(0, (Date.now() - instante) / 1000);
  if (seg < 5 * 60) return "Agora";
  if (seg < 60 * 60) return Math.round(seg / 60) + " min";
  if (seg < 24 * 3600) return Math.round(seg / 3600) + "h";
  const dias = Math.floor(seg / 86400);
  if (dias === 1) return "Ontem";
  if (dias < 7) return dias + " dias";
  if (dias < 30) return Math.floor(dias / 7) + " sem";
  return diaMes(new Date(instante));
}

function textoEntrega(entrega) {
  if (entrega === 1) return "Entrega em 1 dia";
  return "Entrega em " + entrega + " dias";
}

/** Evita que texto digitado pelo usuário vire HTML. */
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** "Época  Cosméticos " → "epoca cosmeticos" (para comparar buscas) */
function normalizar(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/* ---------- Produtos e preços ---------- */

const PRODUTO_POR_ID = Object.fromEntries(PRODUTOS.map((p) => [p.id, p]));

function produto(id) {
  return PRODUTO_POR_ID[id] || null;
}

/** Nome com a marca, sem repetir: "Dior Sauvage", "Bleu de Chanel" (e não "Chanel Bleu de Chanel") */
function nomeComMarca(p) {
  return normalizar(p.nome).includes(normalizar(p.marca)) ? p.nome : p.marca + " " + p.nome;
}

/** Nome para listas: "Dior Sauvage EDT", "Tom Ford Oud Wood"… */
function nomeCompleto(p) {
  return p.apelido || nomeComMarca(p);
}

/** Ofertas da mais barata para a mais cara; as indisponíveis vão para o fim. */
function ofertasOrdenadas(p) {
  return [...p.ofertas].sort((a, b) => (a.estoque === false) - (b.estoque === false) || a.preco - b.preco);
}

function melhorOferta(p) {
  return ofertasOrdenadas(p).find((o) => o.estoque !== false) || null;
}

function precoAtual(p) {
  const oferta = melhorOferta(p);
  return oferta ? oferta.preco : null;
}

/** Desconto de uma oferta em relação ao preço cheio ("de"). 0.2 = 20% */
function desconto(oferta) {
  return oferta && oferta.de ? (oferta.de - oferta.preco) / oferta.de : 0;
}

function lojasComEstoque(p) {
  return p.ofertas.filter((o) => o.estoque !== false).length;
}

/** Todas as ofertas com desconto, uma por linha: { produto, oferta, desconto } */
function ofertasEmPromocao() {
  return PRODUTOS.flatMap((p) =>
    p.ofertas
      .filter((o) => o.de && o.estoque !== false)
      .map((o) => ({ produto: p, oferta: o, desconto: desconto(o) }))
  );
}

/* ---------- Histórico de preços ---------- */

const DIAS_HISTORICO = 730; // 2 anos
const PERIODOS = [
  { id: "7D", rotulo: "7D", dias: 7, nome: "7 dias" },
  { id: "30D", rotulo: "30D", dias: 30, nome: "30 dias" },
  { id: "3M", rotulo: "3M", dias: 90, nome: "3 meses" },
  { id: "6M", rotulo: "6M", dias: 180, nome: "6 meses" },
  { id: "1A", rotulo: "1A", dias: 365, nome: "12 meses" },
];
const cacheHistorico = {};

/** Gerador pseudoaleatório com semente: o mesmo perfume gera sempre o mesmo gráfico. */
function geradorAleatorio(semente) {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ancorasAutomaticas(atual, aleatorio) {
  const perfil = [[730, 1.14], [600, 1.22], [480, 1.06], [365, 1.16], [300, 0.97], [240, 1.09], [150, 1.19], [90, 1.11], [45, 1.07], [20, 1.04], [8, 1.02], [0, 1]];
  return perfil.map(([dias, fator]) => [dias, dias === 0 ? atual : atual * (fator + (aleatorio() - 0.5) * 0.06)]);
}

/**
 * Série diária de preços dos últimos 2 anos: [{ data, preco }], o último item é hoje.
 * Liga as âncoras do produto com curvas suaves e um pouco de variação diária.
 */
function historico(p) {
  if (cacheHistorico[p.id]) return cacheHistorico[p.id];
  const atual = precoAtual(p);
  const aleatorio = geradorAleatorio(p.id);
  const ancoras = (p.ancoras || ancorasAutomaticas(atual, aleatorio)).map((a) => [...a]).sort((a, b) => b[0] - a[0]);
  if (ancoras[0][0] < DIAS_HISTORICO) ancoras.unshift([DIAS_HISTORICO, ancoras[0][1]]);
  if (ancoras[ancoras.length - 1][0] > 0) ancoras.push([0, atual]);
  ancoras[ancoras.length - 1][1] = atual;

  const menor = Math.min(...ancoras.map((a) => a[1]));
  const maior = Math.max(...ancoras.map((a) => a[1]));
  const valores = new Array(DIAS_HISTORICO + 1);

  for (let k = 0; k < ancoras.length - 1; k++) {
    const [d0, p0] = ancoras[k];
    const [d1, p1] = ancoras[k + 1];
    for (let d = d0; d >= d1; d--) {
      const t = d0 === d1 ? 1 : (d0 - d) / (d0 - d1);
      const suave = t * t * (3 - 2 * t);
      let valor = p0 + (p1 - p0) * suave;
      const ehAncora = d === d0 || d === d1;
      if (!ehAncora && d > 8) {
        valor = Math.round(valor * (1 + (aleatorio() - 0.5) * 0.018));
        valor = Math.min(maior, Math.max(menor, valor));
      }
      valores[DIAS_HISTORICO - d] = valor;
    }
  }

  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const serie = valores.map((preco, i) => ({
    data: new Date(hoje.getTime() - (DIAS_HISTORICO - i) * 86400000),
    preco: Math.round(preco * 100) / 100,
  }));
  serie[DIAS_HISTORICO].preco = atual;
  cacheHistorico[p.id] = serie;
  return serie;
}

/** Últimos N dias da série (inclui hoje). */
function janelaHistorico(p, dias) {
  return historico(p).slice(-(dias + 1));
}

/** Variação do menor preço nos últimos 7 dias: -0.12 = caiu 12% */
function variacaoSemana(p) {
  const serie = historico(p);
  const antes = serie[serie.length - 8].preco;
  return (serie[serie.length - 1].preco - antes) / antes;
}

/** Menor e maior preço de todo o histórico, com a data em que aconteceram. */
function extremosHistorico(p) {
  const serie = historico(p);
  let menor = serie[0];
  let maior = serie[0];
  for (const ponto of serie) {
    if (ponto.preco < menor.preco) menor = ponto;
    if (ponto.preco > maior.preco) maior = ponto;
  }
  return { menor, maior };
}

/** Diz se o preço de hoje está bom dentro do período escolhido (texto calculado, não fixo). */
function avaliarPreco(p, periodo) {
  const pontos = janelaHistorico(p, periodo.dias);
  const atual = pontos[pontos.length - 1].preco;
  const precos = pontos.map((x) => x.preco);
  const menor = Math.min(...precos);
  const media = precos.reduce((s, v) => s + v, 0) / precos.length;
  if (atual <= menor + 0.009) {
    return { nivel: "otimo", texto: "O preço atual está excelente! É o menor dos últimos " + periodo.nome + "." };
  }
  if (atual < media) {
    return { nivel: "bom", texto: "Bom momento: o preço está abaixo da média dos últimos " + periodo.nome + "." };
  }
  return { nivel: "alto", texto: "O preço está acima da média dos últimos " + periodo.nome + ". Que tal criar um alerta?" };
}

/** true se hoje é o menor preço dos últimos 30 dias. */
function menorEm30Dias(p) {
  return avaliarPreco(p, PERIODOS[1]).nivel === "otimo";
}

/* ---------- Favoritos ---------- */

function ehFavorito(id) {
  return estado.favoritos.includes(id);
}

/** Liga/desliga o favorito. Devolve true se passou a ser favorito. */
function alternarFavorito(id) {
  if (ehFavorito(id)) {
    estado.favoritos = estado.favoritos.filter((f) => f !== id);
    salvarEstado();
    return false;
  }
  estado.favoritos = [id, ...estado.favoritos];
  salvarEstado();
  return true;
}

/* ---------- Alertas ---------- */

function alertaPorId(id) {
  return estado.alertas.find((a) => a.id === id) || null;
}

function alertaDoProduto(produtoId) {
  return estado.alertas.find((a) => a.produtoId === produtoId) || null;
}

/** "atingido", "monitorando" ou "pausado" */
function statusAlerta(alerta) {
  if (!alerta.ativo) return "pausado";
  return precoAtual(produto(alerta.produtoId)) <= alerta.alvo ? "atingido" : "monitorando";
}

function salvarAlerta({ id, produtoId, alvo, canais }) {
  const existente = id ? alertaPorId(id) : null;
  if (existente) {
    Object.assign(existente, { alvo, canais, ativo: true });
  } else {
    estado.alertas.unshift({ id: "a" + Date.now(), produtoId, alvo, canais, ativo: true, criadoEm: Date.now() });
  }
  salvarEstado();
  return existente || estado.alertas[0];
}

function removerAlerta(id) {
  const indice = estado.alertas.findIndex((a) => a.id === id);
  if (indice < 0) return null;
  const [removido] = estado.alertas.splice(indice, 1);
  salvarEstado();
  return { removido, indice };
}

/* ---------- Notificações ---------- */

function notificacoesNaoLidas() {
  return estado.notificacoes.filter((n) => !n.lida).length;
}

function adicionarNotificacao(dados) {
  estado.notificacoes.unshift({ id: "n" + Date.now(), quando: Date.now(), lida: false, ...dados });
  salvarEstado();
}

/* ---------- Busca ---------- */

function textoBuscavel(p) {
  return normalizar([p.marca, p.nome, p.apelido || "", p.tipo, CATEGORIAS[p.categoria], ...p.notas].join(" "));
}

/** Produtos em que todas as palavras da busca aparecem (sem diferenciar acentos). */
function buscarProdutos(consulta) {
  const termos = normalizar(consulta).split(" ").filter(Boolean);
  if (!termos.length) return [];
  return PRODUTOS.filter((p) => {
    const alvo = textoBuscavel(p);
    return termos.every((t) => alvo.includes(t));
  });
}

/** Sugestões enquanto digita: marcas e perfumes cujo nome contém o texto. */
function sugestoesBusca(consulta) {
  const q = normalizar(consulta);
  if (q.length < 2) return [];
  const marcas = [...new Set(PRODUTOS.map((p) => p.marca))]
    .filter((m) => normalizar(m).includes(q))
    .map((m) => ({ tipo: "marca", texto: m }));
  const perfumes = buscarProdutos(consulta).map((p) => ({ tipo: "perfume", texto: nomeCompleto(p), produto: p }));
  return [...marcas, ...perfumes].slice(0, 6);
}

function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = guardado;
    }
  }
  return linha[b.length];
}

/** "Você quis dizer…?" para buscas com erro de digitação (ex.: "dior savage"). */
function voceQuisDizer(consulta) {
  const q = normalizar(consulta);
  if (q.length < 3) return null;
  const candidatos = new Set();
  PRODUTOS.forEach((p) => {
    candidatos.add(p.marca);
    candidatos.add(p.nome);
    candidatos.add(nomeCompleto(p));
    candidatos.add(p.marca + " " + p.nome);
  });
  let melhor = null;
  let menorDist = Infinity;
  candidatos.forEach((c) => {
    const d = distancia(q, normalizar(c));
    if (d < menorDist) { menorDist = d; melhor = c; }
  });
  const limite = Math.max(2, Math.round(q.length * 0.3));
  return menorDist > 0 && menorDist <= limite ? melhor : null;
}

function registrarBusca(texto) {
  const limpo = texto.trim();
  if (!limpo) return;
  estado.buscasRecentes = [limpo, ...estado.buscasRecentes.filter((b) => normalizar(b) !== normalizar(limpo))].slice(0, 6);
  salvarEstado();
}

function registrarVisto(produtoId) {
  estado.vistos = [produtoId, ...estado.vistos.filter((v) => v !== produtoId)].slice(0, 12);
  salvarEstado();
}
