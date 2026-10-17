/* ============================================================
   DADOS DE DEMONSTRAÇÃO
   Catálogo de perfumes, lojas e o estado inicial do usuário.
   Num app real, isso viria de uma API; aqui fica tudo no front.
   ============================================================ */

/* Lojas parceiras (os links abrem a página inicial de cada loja). */
const LOJAS = {
  sephora:     { nome: "Sephora",          curto: "Sephora",       site: "https://www.sephora.com.br/" },
  belezanaweb: { nome: "Beleza na Web",    curto: "Beleza na Web", site: "https://www.belezanaweb.com.br/" },
  epoca:       { nome: "Época Cosméticos", curto: "Época",         site: "https://www.epocacosmeticos.com.br/" },
  amazon:      { nome: "Amazon",           curto: "Amazon",        site: "https://www.amazon.com.br/" },
};

/* Categorias usadas nos filtros. */
const CATEGORIAS = {
  masculino: "Masculino",
  feminino: "Feminino",
  unissex: "Unissex",
};

/*
  Cada perfume tem:
  - ofertas: preço em cada loja ("de" = preço cheio, quando está em promoção;
    "entrega" = prazo em dias; "estoque: false" = indisponível)
  - foto: "ampla" (foto de ambiente, ocupa o card todo) ou "produto" (frasco recortado)
  - ancoras: pontos do histórico de preços [dias atrás, preço]. O app liga os pontos
    e gera o gráfico. Quem não tem âncoras recebe um histórico automático.
*/
const PRODUTOS = [
  {
    id: "sauvage-edt",
    marca: "Dior", nome: "Sauvage", apelido: "Dior Sauvage EDT",
    tipo: "Eau de Toilette", ml: 100, categoria: "masculino",
    nota: 4.9, avaliacoes: 1200,
    img: "img/sauvage-edt.jpg", foto: "ampla", heroi: true,
    descricao: "Uma composição radicalmente fresca, com nome de manifesto. Foi assim que François Demachy, perfumista-criador da Dior, a imaginou: crua e nobre ao mesmo tempo. Uma overdose de frescor.",
    notas: ["Bergamota", "Pimenta de Sichuan", "Ambroxan"],
    ofertas: [
      { loja: "sephora", preco: 399.90, de: 599.90, entrega: 2 },
      { loja: "belezanaweb", preco: 429.90, entrega: 3 },
      { loja: "epoca", preco: 459.00, entrega: 4 },
      { loja: "amazon", preco: 489.90, entrega: 1 },
    ],
    ancoras: [[730, 629.9], [600, 599.9], [480, 559.9], [365, 589.9], [250, 499.9], [160, 569.9], [90, 549.9], [45, 579.9], [30, 589.9], [9, 599.9], [1, 599.9], [0, 399.9]],
  },
  {
    id: "sauvage-edp",
    marca: "Dior", nome: "Sauvage", apelido: "Dior Sauvage EDP",
    tipo: "Eau de Parfum", ml: 100, categoria: "masculino",
    nota: 4.8, avaliacoes: 850,
    img: "img/aurum-noctis.jpg", foto: "ampla",
    descricao: "A versão Eau de Parfum de Sauvage mantém o frescor da bergamota e ganha um fundo mais quente e ambarado, com baunilha e especiarias.",
    notas: ["Bergamota", "Noz-moscada", "Baunilha"],
    ofertas: [
      { loja: "sephora", preco: 759.20, de: 949.00, entrega: 2 },
      { loja: "belezanaweb", preco: 779.00, entrega: 3 },
      { loja: "amazon", preco: 819.90, entrega: 1 },
      { loja: "epoca", preco: 849.00, entrega: 4, estoque: false },
    ],
  },
  {
    id: "sauvage-elixir",
    marca: "Dior", nome: "Sauvage Elixir", apelido: "Dior Sauvage Elixir",
    tipo: "Elixir", ml: 60, categoria: "masculino",
    nota: 5.0, avaliacoes: 420,
    img: "img/aurora.jpg", foto: "ampla",
    descricao: "A concentração mais intensa da linha: especiarias, lavanda e madeiras em uma assinatura densa e de longa duração.",
    notas: ["Canela", "Lavanda", "Alcaçuz"],
    ofertas: [
      { loja: "epoca", preco: 1110.00, de: 1250.00, entrega: 4 },
      { loja: "sephora", preco: 1149.00, entrega: 2 },
      { loja: "belezanaweb", preco: 1189.90, entrega: 3 },
    ],
  },
  {
    id: "coco-mademoiselle",
    marca: "Chanel", nome: "Coco Mademoiselle",
    tipo: "Eau de Parfum", ml: 50, categoria: "feminino",
    nota: 4.8, avaliacoes: 2100,
    img: "img/aurelia.jpg", foto: "ampla",
    descricao: "Oriental fresco e elegante, com laranja, rosa e jasmim sobre um fundo de patchouli e vetiver.",
    notas: ["Laranja", "Rosa", "Patchouli"],
    ofertas: [
      { loja: "belezanaweb", preco: 977.50, de: 1150.00, entrega: 3 },
      { loja: "sephora", preco: 1029.00, entrega: 2 },
      { loja: "amazon", preco: 1099.00, entrega: 1 },
    ],
  },
  {
    id: "ombre-leather",
    marca: "Tom Ford", nome: "Ombré Leather",
    tipo: "Eau de Parfum", ml: 100, categoria: "unissex",
    nota: 4.7, avaliacoes: 640,
    img: "img/aura.jpg", foto: "ampla",
    descricao: "Couro macio e flor de jasmim sobre um fundo de âmbar e musgo. Intenso, sensual e marcante.",
    notas: ["Cardamomo", "Couro", "Âmbar"],
    ofertas: [
      { loja: "epoca", preco: 1417.50, de: 1890.00, entrega: 4 },
      { loja: "sephora", preco: 1590.00, entrega: 2 },
      { loja: "amazon", preco: 1649.00, entrega: 1 },
    ],
  },
  {
    id: "bleu-de-chanel",
    marca: "Chanel", nome: "Bleu de Chanel",
    tipo: "Eau de Parfum", ml: 100, categoria: "masculino",
    nota: 4.8, avaliacoes: 1500,
    img: "img/nocturnal.jpg", foto: "ampla", heroiLargo: true,
    descricao: "Aromático amadeirado com cítricos, incenso e sândalo. Clássico e versátil para o dia a dia.",
    notas: ["Toranja", "Incenso", "Sândalo"],
    ofertas: [
      { loja: "sephora", preco: 849.00, de: 999.00, entrega: 2 },
      { loja: "belezanaweb", preco: 879.90, entrega: 3 },
      { loja: "epoca", preco: 899.00, entrega: 4 },
    ],
  },
  {
    id: "oud-wood",
    marca: "Tom Ford", nome: "Oud Wood",
    tipo: "Eau de Parfum", ml: 50, categoria: "unissex",
    nota: 4.8, avaliacoes: 980,
    img: "img/oud-wood.jpg", foto: "produto",
    descricao: "Madeira de oud rara combinada a sândalo, pimenta e cardamomo. Sofisticado, quente e discreto.",
    notas: ["Oud", "Sândalo", "Cardamomo"],
    ofertas: [
      { loja: "amazon", preco: 1150.00, de: 1307.00, entrega: 1 },
      { loja: "sephora", preco: 1249.00, entrega: 2 },
      { loja: "epoca", preco: 1290.00, entrega: 4 },
    ],
    ancoras: [[730, 1390], [560, 1349], [420, 1420], [300, 1310], [200, 1380], [120, 1329], [60, 1360], [20, 1320], [2, 1307], [1, 1307], [0, 1150]],
  },
  {
    id: "baccarat-rouge",
    marca: "Maison Francis Kurkdjian", nome: "Baccarat Rouge 540",
    tipo: "Eau de Parfum", ml: 70, categoria: "unissex",
    nota: 4.9, avaliacoes: 3100,
    img: "img/baccarat-rouge.jpg", foto: "produto",
    descricao: "Jasmim, açafrão e âmbar-gris formam um rastro luminoso e mineral, reconhecível à distância.",
    notas: ["Jasmim", "Açafrão", "Âmbar-gris"],
    ofertas: [
      { loja: "sephora", preco: 2450.00, de: 2800.00, entrega: 2 },
      { loja: "amazon", preco: 2590.00, entrega: 1 },
      { loja: "epoca", preco: 2699.00, entrega: 4 },
    ],
    ancoras: [[730, 2890], [500, 2790], [365, 2850], [200, 2690], [100, 2750], [40, 2600], [20, 2520], [9, 2450], [0, 2450]],
  },
  {
    id: "aventus",
    marca: "Creed", nome: "Aventus",
    tipo: "Eau de Parfum", ml: 100, categoria: "masculino",
    nota: 4.7, avaliacoes: 2400,
    img: "img/aventus.jpg", foto: "produto",
    descricao: "Abacaxi, bétula e almíscar em uma composição frutada e esfumaçada, símbolo de força e sucesso.",
    notas: ["Abacaxi", "Bétula", "Almíscar"],
    ofertas: [
      { loja: "sephora", preco: 3100.00, entrega: 2 },
      { loja: "amazon", preco: 3249.00, entrega: 1 },
      { loja: "belezanaweb", preco: 3290.00, entrega: 3, estoque: false },
    ],
    ancoras: [[730, 3350], [500, 3290], [300, 3190], [150, 3250], [60, 3150], [20, 3090], [8, 3050], [7, 3050], [0, 3100]],
  },
  {
    id: "santal-33",
    marca: "Le Labo", nome: "Santal 33",
    tipo: "Eau de Parfum", ml: 100, categoria: "unissex",
    nota: 4.6, avaliacoes: 760,
    img: "img/santal-33.jpg", foto: "produto",
    descricao: "Sândalo australiano, cardamomo e couro em uma fragrância amadeirada e unissex, com ar de viagem.",
    notas: ["Sândalo", "Cardamomo", "Couro"],
    ofertas: [
      { loja: "sephora", preco: 1250.00, de: 1390.00, entrega: 2 },
      { loja: "amazon", preco: 1299.00, entrega: 1 },
    ],
    ancoras: [[730, 1390], [600, 1360], [480, 1290], [400, 1310], [318, 1150], [290, 1260], [226, 1550], [180, 1420], [120, 1380], [60, 1340], [30, 1290], [22, 1330], [18, 1310], [12, 1390], [9, 1420], [5, 1300], [2, 1270], [0, 1250]],
  },
  {
    id: "oud-santal",
    marca: "Atelier Oriens", nome: "Oud Santal Intense",
    tipo: "Eau de Parfum", ml: 100, categoria: "unissex",
    nota: 4.9, avaliacoes: 128,
    img: "img/oud-santal.jpg", foto: "produto",
    descricao: "Oud e sândalo cremoso com um toque de rosa e especiarias. Profundo e envolvente.",
    notas: ["Oud", "Sândalo", "Rosa"],
    ofertas: [
      { loja: "belezanaweb", preco: 890.00, de: 1049.00, entrega: 2 },
      { loja: "sephora", preco: 950.00, entrega: "3-5" },
      { loja: "epoca", preco: 1050.00, entrega: 4, estoque: false },
    ],
  },
  {
    id: "chanel-n5",
    marca: "Chanel", nome: "Nº 5",
    tipo: "Eau de Parfum", ml: 100, categoria: "feminino",
    nota: 4.7, avaliacoes: 1900,
    img: "img/chanel-n5.jpg", foto: "produto",
    descricao: "O floral aldeídico mais famoso do mundo: rosa, jasmim e ylang-ylang com um toque de baunilha.",
    notas: ["Aldeídos", "Rosa", "Baunilha"],
    ofertas: [
      { loja: "sephora", preco: 1089.00, de: 1249.00, entrega: 2 },
      { loja: "belezanaweb", preco: 1119.00, entrega: 3 },
      { loja: "amazon", preco: 1149.00, entrega: 1 },
    ],
  },
  {
    id: "la-vie-est-belle",
    marca: "Lancôme", nome: "La Vie Est Belle",
    tipo: "Eau de Parfum", ml: 100, categoria: "feminino",
    nota: 4.8, avaliacoes: 2700,
    img: "img/la-vie-est-belle.jpg", foto: "produto",
    descricao: "Íris, praliné e baunilha em um floral gourmand doce e luminoso.",
    notas: ["Íris", "Praliné", "Baunilha"],
    ofertas: [
      { loja: "belezanaweb", preco: 529.90, de: 689.90, entrega: 3 },
      { loja: "sephora", preco: 569.00, entrega: 2 },
      { loja: "epoca", preco: 589.90, entrega: 4 },
    ],
  },
];

/* Marcas que aparecem em "Marcas populares" na busca. */
const MARCAS_POPULARES = ["Dior", "Chanel", "Tom Ford", "Creed"];

/* Perguntas da Central de ajuda. */
const PERGUNTAS_AJUDA = [
  {
    p: "Como o ALMA encontra os preços?",
    r: "Comparamos as ofertas de lojas parceiras (Sephora, Beleza na Web, Época Cosméticos e Amazon) e mostramos o menor preço disponível para cada perfume.",
  },
  {
    p: "Como criar um alerta de preço?",
    r: "Abra um perfume e toque em “Criar alerta”. Digite o preço-alvo, escolha se quer ser avisado no app ou por e-mail e confirme. Você também pode usar o botão + na tela Alertas.",
  },
  {
    p: "O que significa “Melhor preço”?",
    r: "É a oferta mais barata entre as lojas que têm o perfume em estoque naquele momento.",
  },
  {
    p: "Como funciona o histórico de preços?",
    r: "O gráfico mostra como o menor preço do perfume variou no período escolhido (7 dias a 1 ano). A mensagem acima do gráfico diz se o preço de hoje está bom em relação ao período.",
  },
  {
    p: "O ALMA vende perfumes?",
    r: "Não. Mostramos onde está mais barato e levamos você ao site da loja para finalizar a compra. O ALMA não cobra nada por isso.",
  },
  {
    p: "Como remover um favorito ou um alerta?",
    r: "Em Favoritos, toque no coração dourado. Em Alertas, toque nos três pontinhos do alerta e escolha “Excluir alerta”. Nos dois casos dá para desfazer logo em seguida.",
  },
  {
    p: "Posso receber alertas por e-mail?",
    r: "Sim. Ao criar ou editar um alerta, marque a opção “E-mail”. Você pode escolher app, e-mail ou os dois.",
  },
  {
    p: "Meus dados ficam salvos?",
    r: "Neste protótipo, favoritos, alertas e buscas ficam salvos só no seu navegador. Em Perfil › Configurações você pode restaurar os dados de demonstração.",
  },
];

/* Estado inicial do usuário (usado no primeiro acesso ou ao restaurar a demonstração). */
function estadoDemonstracao() {
  const agora = Date.now();
  const hora = 60 * 60 * 1000;
  const dia = 24 * hora;
  return {
    versao: 1,
    usuario: null,
    favoritos: ["oud-wood", "baccarat-rouge", "aventus", "sauvage-edt", "coco-mademoiselle", "santal-33"],
    alertas: [
      { id: "a1", produtoId: "baccarat-rouge", alvo: 2500, canais: { app: true, email: false }, ativo: true, criadoEm: agora - 12 * dia },
      { id: "a2", produtoId: "aventus", alvo: 2900, canais: { app: true, email: true }, ativo: true, criadoEm: agora - 9 * dia },
      { id: "a3", produtoId: "oud-wood", alvo: 1100, canais: { app: true, email: false }, ativo: true, criadoEm: agora - 6 * dia },
      { id: "a4", produtoId: "coco-mademoiselle", alvo: 900, canais: { app: true, email: false }, ativo: true, criadoEm: agora - 4 * dia },
      { id: "a5", produtoId: "santal-33", alvo: 1200, canais: { app: true, email: true }, ativo: true, criadoEm: agora - 2 * dia },
    ],
    notificacoes: [
      {
        id: "n1", tipo: "queda", lida: false, quando: agora - 2 * 60 * 1000, produtoId: "sauvage-edt",
        titulo: "Queda de preço: Dior Sauvage agora por R$ 399,90!",
        texto: "Uma das suas fragrâncias favoritas atingiu o menor preço dos últimos 30 dias na Sephora.",
      },
      {
        id: "n2", tipo: "historico", lida: false, quando: agora - 2 * hora, produtoId: "oud-wood",
        titulo: "Menor preço histórico atingido!",
        texto: "Tom Ford Oud Wood registrou uma queda de 12% nas últimas 24 horas. Agora custa R$ 1.150,00 na Amazon.",
      },
      {
        id: "n3", tipo: "promocao", lida: true, quando: agora - 1 * dia, produtoId: "bleu-de-chanel",
        titulo: "Nova promoção: Coleção Chanel",
        texto: "Descubra os novos descontos na linha Bleu de Chanel. Exclusivo para quem usa o ALMA.",
      },
      {
        id: "n4", tipo: "alerta", lida: true, quando: agora - 3 * dia, produtoId: "baccarat-rouge",
        titulo: "Alerta de preço atingido: Baccarat Rouge 540",
        texto: "O preço chegou a R$ 2.450,00 na Sephora, abaixo do seu alvo de R$ 2.500,00.",
      },
      {
        id: "n5", tipo: "boasvindas", lida: true, quando: agora - 7 * dia, link: "#/ajuda",
        titulo: "Boas-vindas ao ALMA",
        texto: "Favorite perfumes e crie alertas para ser avisado quando o preço cair.",
      },
    ],
    buscasRecentes: ["Dior Sauvage", "212 VIP", "Tom Ford Oud Wood"],
    vistos: ["santal-33", "sauvage-edt", "oud-wood"],
    preferencias: { categorias: [], resumoEmail: true, notificacoesApp: true, emailsOfertas: false, tema: "claro" },
    premium: false,
  };
}
