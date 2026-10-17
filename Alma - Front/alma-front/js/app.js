/* ============================================================
   APP — rotas, navegação e ações dos botões
   As telas ficam em telas.js; aqui decidimos qual mostrar
   de acordo com o endereço (#/inicio, #/produto/sauvage-edt…).
   ============================================================ */

const raiz = document.getElementById("app");

/* Rotas: o endereço depois do # decide a tela. "publica" = não precisa estar logado. */
const ROTAS = [
  { padrao: /^\/?$/, tela: "splash", publica: true },
  { padrao: /^\/login$/, tela: "login", publica: true },
  { padrao: /^\/cadastro$/, tela: "cadastro", publica: true },
  { padrao: /^\/inicio$/, tela: "inicio" },
  { padrao: /^\/promocoes$/, tela: "promocoes" },
  { padrao: /^\/busca$/, tela: "busca" },
  { padrao: /^\/resultados$/, tela: "resultados" },
  { padrao: /^\/produto\/([\w-]+)$/, tela: "produto" },
  { padrao: /^\/comparar\/([\w-]+)$/, tela: "comparar" },
  { padrao: /^\/historico$/, tela: "vistos" },
  { padrao: /^\/historico\/([\w-]+)$/, tela: "historico" },
  { padrao: /^\/notificacoes$/, tela: "notificacoes" },
  { padrao: /^\/alertas$/, tela: "alertas" },
  { padrao: /^\/alertas\/novo\/([\w-]+)$/, tela: "novoAlerta" },
  { padrao: /^\/alertas\/editar\/([\w-]+)$/, tela: "editarAlerta" },
  { padrao: /^\/favoritos$/, tela: "favoritos" },
  { padrao: /^\/perfil$/, tela: "perfil" },
  { padrao: /^\/ajuda$/, tela: "ajuda" },
];

/* ---------- Navegação ---------- */

const pilha = [];               // telas visitadas nesta sessão (para o botão Voltar do app)
const rolagens = new Map();     // posição da rolagem de cada tela, para restaurar ao voltar
let modoPendente = null;        // como a próxima troca de endereço deve mexer na pilha
let limpezas = [];              // funções que rodam quando a tela atual sai
let guardaSaida = null;         // tela pode pedir confirmação antes de sair (ex.: alerta não salvo)
let primeiraRenderizacao = true;

/* Se o navegador não deixar mudar o endereço (ex.: página dentro de outra), as rotas ficam só em memória. */
let rotasEmMemoria = Boolean(window.ALMA_ROTAS_EM_MEMORIA);
let rotaEmMemoria = location.hash || "#/";

function aoSairDaTela(fn) {
  limpezas.push(fn);
}

function hashAtual() {
  return rotasEmMemoria ? rotaEmMemoria : location.hash || "#/";
}

function lerRota() {
  const hash = hashAtual().replace(/^#/, "");
  const [caminho, busca = ""] = hash.split("?");
  return { caminho: caminho || "/", consulta: new URLSearchParams(busca) };
}

/**
 * Atualiza a pilha de telas e desenha a nova tela.
 * modo: "empilhar" (tela nova), "substituir" (troca a atual) ou "voltar" (retorna à anterior)
 */
function aoMudarRota(atual, modo) {
  const anterior = pilha[pilha.length - 1];
  if (anterior) rolagens.set(anterior, window.scrollY);
  if (!modo) modo = pilha.length > 1 && pilha[pilha.length - 2] === atual ? "voltar" : "empilhar";
  if (modo === "voltar") pilha.pop();
  else if (modo === "substituir") pilha[pilha.length - 1] = atual;
  else pilha.push(atual);
  pilha[pilha.length - 1] = atual;
  renderizar({ rolagem: modo === "voltar" ? rolagens.get(atual) || 0 : 0 });
}

/**
 * Vai para outra tela.
 * @param {string} destino ex.: "#/produto/sauvage-edt"
 * @param {object} [op] { substituir: true } troca a tela atual (não dá para "voltar" para ela)
 */
function navegar(destino, { substituir = false, modo = null } = {}) {
  modo = modo || (substituir ? "substituir" : "empilhar");
  if (destino === hashAtual()) {
    renderizar();
    return;
  }
  if (!rotasEmMemoria) {
    try {
      modoPendente = modo;
      if (modo === "empilhar") location.hash = destino;
      else location.replace(location.href.split("#")[0] + destino); // endereço completo: não depende de <base>
      if ((location.hash || "#/") === destino) return; // o evento "hashchange" desenha a tela
    } catch (erro) {
      /* endereço bloqueado: segue em memória */
    }
    modoPendente = null;
    rotasEmMemoria = true;
  }
  rotaEmMemoria = destino;
  aoMudarRota(destino, modo);
}

/** Botão Voltar do app: volta para a tela anterior desta sessão (ou para "fallback"). */
function voltar(fallback = "#/inicio") {
  if (pilha.length > 1) navegar(pilha[pilha.length - 2], { modo: "voltar" });
  else navegar(fallback, { substituir: true });
}

window.addEventListener("hashchange", () => {
  if (rotasEmMemoria) return;
  const modo = modoPendente;
  modoPendente = null;
  aoMudarRota(location.hash || "#/", modo);
});

/** Desenha a tela do endereço atual. */
function renderizar({ rolagem = 0, manterRolagem = false } = {}) {
  const yAntes = window.scrollY;
  limpezas.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  limpezas = [];
  guardaSaida = null;
  fecharPainel();

  const { caminho, consulta } = lerRota();
  const rota = ROTAS.find((r) => r.padrao.test(caminho));

  if (rota && !rota.publica && !estado.usuario) {
    navegar("#/login", { substituir: true });
    return;
  }
  if (rota && (rota.tela === "login" || rota.tela === "cadastro") && estado.usuario) {
    navegar("#/inicio", { substituir: true });
    return;
  }

  let tela;
  try {
    tela = rota ? Telas[rota.tela](...caminho.match(rota.padrao).slice(1), consulta) : telaNaoEncontrada();
  } catch (erro) {
    console.error(erro);
    tela = telaNaoEncontrada("Algo deu errado", "Não conseguimos abrir esta tela. Volte ao início e tente de novo.");
  }

  raiz.innerHTML = tela.html;
  document.body.dataset.base = tela.base || "nada";
  if (tela.aoMontar) tela.aoMontar(raiz);

  window.scrollTo(0, manterRolagem ? yAntes : rolagem);

  // Leva o foco para o título da nova tela (ajuda quem usa leitor de tela)
  if (!primeiraRenderizacao && !manterRolagem && !raiz.contains(document.activeElement)) {
    const titulo = raiz.querySelector("h1[tabindex]");
    if (titulo) titulo.focus({ preventScroll: true });
  }
  primeiraRenderizacao = false;
}

/* ---------- Ações dos botões (data-acao="...") ---------- */

async function podeSair() {
  return !guardaSaida || (await guardaSaida());
}

const ACOES = {
  async voltar(el) {
    if (await podeSair()) { guardaSaida = null; voltar(el.dataset.fallback); }
  },
  async fechar(el) {
    if (await podeSair()) { guardaSaida = null; voltar(el.dataset.fallback); }
  },
  "fechar-painel": () => fecharPainel(),
  "alternar-tema"() {
    const escuro = temaEfetivo() !== "escuro";
    definirTema(escuro ? "escuro" : "claro");
    mostrarAviso(escuro ? "Modo noturno ativado." : "Modo claro ativado.");
  },
  "pular-splash": () => sairDaSplash(),

  "mostrar-senha"(el) {
    const entrada = document.getElementById(el.dataset.alvo);
    const mostrar = entrada.type === "password";
    entrada.type = mostrar ? "text" : "password";
    el.setAttribute("aria-pressed", String(mostrar));
    el.setAttribute("aria-label", mostrar ? "Esconder senha" : "Mostrar senha");
    el.innerHTML = icone(mostrar ? "visibility" : "visibility_off");
  },
  "esqueci-senha": () => abrirEsqueciSenha(),
  "login-social"(el) {
    const provedor = el.dataset.provedor;
    entrar({ nome: "Henrico", email: "henrico@example.com" }, provedor === "biometria" ? "Entrou com biometria. Olá, Henrico!" : `Conectado com ${provedor}. Olá, Henrico!`);
  },

  favoritar(el) {
    const id = el.dataset.produto;
    const agora = alternarFavorito(id);
    el.setAttribute("aria-pressed", String(agora));
    el.innerHTML = `${icone("favorite", { preenchido: agora })}<span>${agora ? "Favoritado" : "Favoritar"}</span>`;
    mostrarAviso(agora ? "Adicionado aos favoritos." : "Removido dos favoritos.", {
      acao: agora ? { rotulo: "Ver lista", fn: () => navegar("#/favoritos") } : { rotulo: "Desfazer", fn: () => { alternarFavorito(id); renderizar({ manterRolagem: true }); } },
    });
  },
  "remover-favorito"(el) {
    const id = el.dataset.produto;
    const indice = estado.favoritos.indexOf(id);
    alternarFavorito(id);
    renderizar({ manterRolagem: true });
    mostrarAviso(`${produto(id).nome} saiu dos favoritos.`, {
      acao: {
        rotulo: "Desfazer",
        fn() {
          estado.favoritos.splice(indice, 0, id);
          salvarEstado();
          renderizar({ manterRolagem: true });
        },
      },
    });
  },

  "ir-loja"(el) {
    const p = produto(el.dataset.produto);
    irParaLoja(p, p.ofertas.find((o) => o.loja === el.dataset.loja));
  },
  "selecionar-loja"(el) {
    const id = lerRota().caminho.split("/").pop();
    lojaEscolhida[id] = el.dataset.loja;
    renderizar({ manterRolagem: true });
  },
  compartilhar() {
    // Compartilha a oferta como texto (nome, preço e loja), pronto para colar numa conversa
    const p = produto(lerRota().caminho.split("/").pop());
    if (!p) return;
    const o = melhorOferta(p);
    copiarTexto(`${nomeCompleto(p)} por ${reais(o.preco)} na ${LOJAS[o.loja].nome}. Vi no ALMA.`, "Oferta copiada. É só colar para compartilhar.");
  },

  "categoria-promo"(el) {
    filtrosPromo.categoria = el.dataset.categoria;
    renderizar({ manterRolagem: true });
  },
  "ate-1000"() {
    filtrosPromo.ate1000 = !filtrosPromo.ate1000;
    renderizar({ manterRolagem: true });
  },
  "filtros-promo": () => abrirFiltrosPromo(),
  "limpar-filtros-promo"() {
    filtrosPromo = { categoria: "todas", ate1000: false, ordem: "desconto", lojas: [] };
    renderizar();
  },
  "filtros-resultados": () => abrirFiltrosResultados(),
  "limpar-filtros-resultados"() {
    filtrosResultados.categoria = "todas";
    filtrosResultados.lojas = [];
    renderizar();
  },
  "limpar-buscas"() {
    const antes = [...estado.buscasRecentes];
    estado.buscasRecentes = [];
    salvarEstado();
    renderizar({ manterRolagem: true });
    mostrarAviso("Pesquisas recentes apagadas.", {
      acao: { rotulo: "Desfazer", fn() { estado.buscasRecentes = antes; salvarEstado(); renderizar({ manterRolagem: true }); } },
    });
  },

  periodo(el) {
    periodoHistorico = el.dataset.periodo;
    renderizar({ manterRolagem: true });
    const botao = raiz.querySelector(`[data-periodo="${el.dataset.periodo}"]`);
    if (botao) botao.focus({ preventScroll: true });
  },

  "marcar-lidas"() {
    estado.notificacoes.forEach((n) => (n.lida = true));
    salvarEstado();
    renderizar({ manterRolagem: true });
    mostrarAviso("Todas as notificações foram marcadas como lidas.");
  },
  "abrir-notificacao"(el) {
    const n = estado.notificacoes.find((x) => x.id === el.dataset.id);
    if (!n) return;
    n.lida = true;
    salvarEstado();
    navegar(n.produtoId ? "#/produto/" + n.produtoId : n.link || "#/inicio");
  },

  "menu-alerta": (el) => abrirMenuAlerta(el.dataset.id),
  "novo-alerta": () =>
    escolherPerfume({ titulo: "Criar alerta para…", aoEscolher: (p) => navegar("#/alertas/novo/" + p.id) }),

  premium: () => abrirPremium(),
  preferencias: () => abrirPreferencias(),
  configuracoes: () => abrirConfiguracoes(),
  seguranca: () => abrirSeguranca(),
  async sair() {
    const ok = await confirmar({
      titulo: "Sair da conta?",
      texto: "Seus favoritos e alertas continuam salvos neste navegador para quando você voltar.",
      botao: "Sair",
      perigo: true,
    });
    if (!ok) return;
    estado.usuario = null;
    salvarEstado();
    navegar("#/login", { substituir: true });
    mostrarAviso("Você saiu da conta.");
  },
  "copiar-email": () => copiarTexto(EMAIL_SUPORTE, "E-mail copiado."),
};

document.addEventListener("click", (evento) => {
  // Links internos (#/…) passam pelo roteador: assim o app pede confirmação quando há algo não salvo
  const link = evento.target.closest('a[href^="#/"]');
  const cliqueSimples = evento.button === 0 && !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey;
  if (link && cliqueSimples) {
    evento.preventDefault();
    const destino = link.getAttribute("href");
    podeSair().then((ok) => {
      if (!ok) return;
      guardaSaida = null;
      navegar(destino);
    });
    return;
  }
  // Link "Continuar" para o site da loja: deixa abrir a nova aba e fecha o painel
  const saida = evento.target.closest("[data-saida]");
  if (saida) {
    setTimeout(() => {
      fecharPainel();
      mostrarAviso(`Abrimos a ${saida.dataset.lojaNome} em uma nova aba.`);
    }, 0);
    return;
  }
  const el = evento.target.closest("[data-acao]");
  if (!el || el.getAttribute("aria-disabled") === "true") return;
  const acao = ACOES[el.dataset.acao];
  if (!acao) return;
  evento.preventDefault();
  acao(el, evento);
});

/* Clique no fundo escuro fecha o painel */
document.getElementById("painel").addEventListener("click", (evento) => {
  if (evento.target.id === "painel") fecharPainel();
});

/* Se uma foto não carregar, mostra um frasco genérico no lugar */
document.addEventListener("error", (evento) => {
  const img = evento.target;
  if (img.tagName !== "IMG" || img.dataset.falhou) return;
  img.dataset.falhou = "1";
  const moldura = img.closest(".foto, .produto__heroi");
  if (moldura) moldura.classList.add("sem-imagem");
  img.removeAttribute("src");
}, true);

/* ---------- Início ---------- */

aplicarTema();
pilha.push(hashAtual());
renderizar();
