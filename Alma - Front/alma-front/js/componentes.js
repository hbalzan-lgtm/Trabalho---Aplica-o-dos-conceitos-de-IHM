/* ============================================================
   COMPONENTES REUTILIZÁVEIS
   Pedaços de interface usados em várias telas: cabeçalho, barra de
   navegação, cards, avisos (toast), painéis (bottom sheet) e confirmação.
   Cada função devolve uma string de HTML.
   ============================================================ */

/* ---------- Tema: claro, escuro (modo noturno) ou automático ---------- */

const consultaTemaEscuro = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const consultaMenosMovimento = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
let temporizadorTema = null;

/** Tema que está valendo agora: "claro" ou "escuro". */
function temaEfetivo() {
  const escolha = estado.preferencias.tema || "claro";
  if (escolha !== "auto") return escolha;
  // "Automático": segue a página onde o app está aberto (se ela informar) ou o sistema
  const temaDaPagina = document.documentElement.getAttribute("data-theme");
  if (temaDaPagina === "dark") return "escuro";
  if (temaDaPagina === "light") return "claro";
  return consultaTemaEscuro && consultaTemaEscuro.matches ? "escuro" : "claro";
}

/** Coloca data-tema="claro|escuro" no <html>; o CSS troca as cores a partir disso. */
function aplicarTema({ animar = false } = {}) {
  const html = document.documentElement;
  const tema = temaEfetivo();
  if (animar && !(consultaMenosMovimento && consultaMenosMovimento.matches)) {
    html.classList.add("trocando-tema");
    clearTimeout(temporizadorTema);
    temporizadorTema = setTimeout(() => html.classList.remove("trocando-tema"), 400);
  }
  html.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", tema === "escuro" ? "#131211" : "#FBF9FA");
  // Mantém os controles de tema da tela atual em sincronia (ex.: o sistema mudou no modo automático)
  const escuro = tema === "escuro";
  const interruptorTema = document.getElementById("tema-rapido");
  if (interruptorTema) interruptorTema.checked = escuro;
  document.querySelectorAll('[data-acao="alternar-tema"]').forEach((botao) => {
    botao.setAttribute("aria-pressed", String(escuro));
    botao.innerHTML = icone(escuro ? "light_mode" : "dark_mode");
  });
}

/** Salva a escolha ("claro", "escuro" ou "auto") e aplica na hora. */
function definirTema(escolha) {
  estado.preferencias.tema = escolha;
  salvarEstado();
  aplicarTema({ animar: true });
}

// No modo automático, acompanha mudanças do sistema enquanto o app está aberto
if (consultaTemaEscuro && consultaTemaEscuro.addEventListener) {
  consultaTemaEscuro.addEventListener("change", () => {
    if (estado.preferencias.tema === "auto") aplicarTema({ animar: true });
  });
}
if (window.MutationObserver) {
  new MutationObserver(() => {
    if (estado.preferencias.tema === "auto") aplicarTema();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

/* ---------- Cabeçalho ---------- */

/**
 * @param {object} op
 *  esquerda: "avatar" | "voltar" | "voltar-circulo" | "nada"
 *  direita:  "sino" | "fechar" | "compartilhar" | "nada"
 *  titulo:   texto no lugar da marca ALMA (ex.: "Comparar preços")
 *  voltarPara: rota usada se não houver página anterior
 */
function cabecalho({ esquerda = "avatar", direita = "sino", titulo = null, voltarPara = "#/inicio", sinoAtivo = false } = {}) {
  const lados = {
    avatar: `<a class="botao-icone botao-avatar" href="#/perfil" aria-label="Abrir perfil">${avatar("p")}</a>`,
    voltar: `<button class="botao-icone" type="button" data-acao="voltar" data-fallback="${voltarPara}" aria-label="Voltar">${icone("arrow_back")}</button>`,
    "voltar-circulo": `<button class="botao-icone botao-icone--fundo" type="button" data-acao="voltar" data-fallback="${voltarPara}" aria-label="Voltar">${icone("arrow_back")}</button>`,
    sino: botaoSino(sinoAtivo),
    fechar: `<button class="botao-icone" type="button" data-acao="fechar" data-fallback="${voltarPara}" aria-label="Fechar">${icone("close")}</button>`,
    compartilhar: `<button class="botao-icone" type="button" data-acao="compartilhar" aria-label="Compartilhar">${icone("share")}</button>`,
    nada: `<span class="botao-icone botao-icone--vazio" aria-hidden="true"></span>`,
  };
  const centro = titulo
    ? `<h1 class="topo__titulo" tabindex="-1">${titulo}</h1>`
    : `<a class="logo" href="#/inicio" aria-label="ALMA, ir para o início">ALMA</a>`;
  return `<header class="topo${titulo ? " topo--titulo" : ""}">${lados[esquerda]}${centro}${lados[direita]}</header>`;
}

/** Foto do usuário de demonstração (Henrico) ou as iniciais de quem entrou com outro e-mail. */
function avatar(tamanho, alt = "") {
  const u = estado.usuario;
  if (!u || u.email === "henrico@example.com") {
    return `<img class="avatar avatar--${tamanho}" src="img/avatar.jpg" alt="${esc(alt)}">`;
  }
  const iniciais = u.nome.split(" ").map((parte) => parte.charAt(0)).join("").slice(0, 2).toUpperCase();
  return `<span class="avatar avatar--${tamanho} avatar--iniciais"${alt ? ` role="img" aria-label="${esc(alt)}"` : ' aria-hidden="true"'}>${esc(iniciais)}</span>`;
}

function botaoSino(ativo = false) {
  const n = notificacoesNaoLidas();
  const rotulo = n ? `Notificações: ${n} não lida${n > 1 ? "s" : ""}` : "Notificações";
  return `<a class="botao-icone sino${ativo ? " is-ativo" : ""}" href="#/notificacoes" aria-label="${rotulo}">
    ${icone("notifications", { preenchido: ativo })}${n ? `<span class="sino__ponto" aria-hidden="true"></span>` : ""}
  </a>`;
}

/* ---------- Barra de navegação inferior ---------- */

const ABAS = [
  { id: "inicio", rotulo: "Início", icone: "home", href: "#/inicio" },
  { id: "promocoes", rotulo: "Promos", icone: "sell", href: "#/promocoes" },
  { id: "favoritos", rotulo: "Favoritos", icone: "favorite", href: "#/favoritos" },
  { id: "alertas", rotulo: "Alertas", icone: "notifications_active", href: "#/alertas" },
  { id: "perfil", rotulo: "Perfil", icone: "person", href: "#/perfil" },
];

function navInferior(ativa) {
  const itens = ABAS.map((aba) => {
    const eh = aba.id === ativa;
    return `<a class="nav__item${eh ? " is-ativo" : ""}" href="${aba.href}"${eh ? ' aria-current="page"' : ""}>
      ${icone(aba.icone, { preenchido: eh })}<span>${aba.rotulo}</span>
    </a>`;
  }).join("");
  return `<nav class="nav" aria-label="Navegação principal">${itens}</nav>`;
}

/* ---------- Pedaços de produto ---------- */

/** Foto do perfume. "ampla" = foto de ambiente; "produto" = frasco em fundo claro. */
function fotoProduto(p, classe = "") {
  return `<div class="foto foto--${p.foto}${classe ? " " + classe : ""}">
    <img src="${p.img}" alt="${esc(nomeCompleto(p))}" loading="lazy" decoding="async">
  </div>`;
}

function avaliacao(p, completa = false) {
  const qtd = completa ? `${p.avaliacoes.toLocaleString("pt-BR")} avaliações` : contagem(p.avaliacoes);
  return `<p class="avaliacao"><span class="avaliacao__estrela">${icone("star", { preenchido: true })}</span>${p.nota.toFixed(1).replace(".", ",")} <span class="avaliacao__qtd">(${qtd})</span></p>`;
}

/** Selo verde "↓ 20%" */
function textoQueda(fracao) {
  return `<span class="queda">${icone("arrow_downward")}${porcento(fracao)}</span>`;
}

/** Pílula de tendência da semana: "↓ 12%", "— Estável" ou "↑ 2%" */
function pilulaVariacao(v) {
  if (v <= -0.01) return `<span class="pilula pilula--queda" title="Variação em 7 dias">${icone("arrow_downward")}${porcento(v)}</span>`;
  if (v >= 0.01) return `<span class="pilula pilula--alta" title="Variação em 7 dias">${icone("arrow_upward")}${porcento(v)}</span>`;
  return `<span class="pilula pilula--estavel" title="Variação em 7 dias">${icone("remove")}Estável</span>`;
}

function estadoVazio({ icone: nomeIcone, titulo, texto, acoes = "" }) {
  return `<div class="vazio">
    <div class="vazio__icone">${icone(nomeIcone)}</div>
    <h2 class="vazio__titulo">${titulo}</h2>
    <p class="vazio__texto">${texto}</p>
    ${acoes ? `<div class="vazio__acoes">${acoes}</div>` : ""}
  </div>`;
}

/* ---------- Campos de formulário ---------- */

/** Campo com rótulo flutuante e espaço para mensagem de erro. */
function campo({ id, rotulo, tipo = "text", autocomplete = "off", valor = "", dica = "", extra = "" }) {
  const senha = tipo === "password";
  return `<div class="campo" data-campo="${id}">
    <div class="campo__caixa">
      <input class="campo__entrada" id="${id}" name="${id}" type="${tipo}" placeholder=" " autocomplete="${autocomplete}"
        value="${esc(valor)}" aria-describedby="${id}-msg" ${extra}>
      <label class="campo__rotulo" for="${id}">${rotulo}</label>
      ${senha ? `<button class="campo__olho" type="button" data-acao="mostrar-senha" data-alvo="${id}" aria-label="Mostrar senha" aria-pressed="false">${icone("visibility_off")}</button>` : ""}
    </div>
    <p class="campo__msg" id="${id}-msg">${dica}</p>
  </div>`;
}

function marcarErro(raiz, id, mensagem) {
  const entrada = raiz.querySelector("#" + id);
  const msg = raiz.querySelector("#" + id + "-msg");
  const bloco = entrada.closest(".campo");
  if (mensagem) {
    bloco.classList.add("is-erro");
    entrada.setAttribute("aria-invalid", "true");
    msg.dataset.dica = msg.dataset.dica ?? msg.textContent;
    msg.innerHTML = icone("error", { preenchido: true }) + " " + esc(mensagem);
  } else {
    bloco.classList.remove("is-erro");
    entrada.removeAttribute("aria-invalid");
    if (msg.dataset.dica !== undefined) msg.textContent = msg.dataset.dica;
  }
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- Aviso rápido (toast) ---------- */

let temporizadorAviso = null;

/**
 * Mostra uma mensagem curta no rodapé.
 * @param {string} texto
 * @param {object} [op] { acao: { rotulo, fn }, duracao }
 */
function mostrarAviso(texto, { acao = null, duracao = 4200 } = {}) {
  const el = document.getElementById("aviso");
  el.innerHTML = `<span class="aviso__texto">${esc(texto)}</span>${acao ? `<button type="button" class="aviso__acao">${esc(acao.rotulo)}</button>` : ""}`;
  if (acao) {
    el.querySelector(".aviso__acao").addEventListener("click", () => {
      esconderAviso();
      acao.fn();
    });
  }
  // Com a API "popover", o aviso aparece por cima até de um painel aberto
  if (typeof el.showPopover === "function") {
    try { el.hidePopover(); } catch (e) { /* já estava fechado */ }
    try { el.showPopover(); } catch (e) { /* navegador sem suporte completo */ }
  }
  el.classList.remove("is-visivel");
  void el.offsetWidth; // reinicia a animação de entrada
  el.classList.add("is-visivel");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(esconderAviso, duracao);
}

function esconderAviso() {
  const el = document.getElementById("aviso");
  el.classList.remove("is-visivel");
  if (typeof el.hidePopover === "function") {
    try { el.hidePopover(); } catch (e) { /* já estava fechado */ }
  }
}

/* ---------- Painel inferior (bottom sheet) ---------- */

/**
 * Abre um painel modal que sobe do rodapé.
 * @param {object} op { titulo, corpo (HTML), aoMontar(painel), aoFechar() }
 */
function abrirPainel({ titulo, corpo, aoMontar = null, aoFechar = null }) {
  const painel = document.getElementById("painel");
  painel.innerHTML = `<div class="painel__interno">
    <div class="painel__alca" aria-hidden="true"></div>
    <div class="painel__topo">
      <h2 class="painel__titulo" id="painel-titulo">${titulo}</h2>
      <button class="botao-icone" type="button" data-acao="fechar-painel" aria-label="Fechar">${icone("close")}</button>
    </div>
    <div class="painel__corpo">${corpo}</div>
  </div>`;
  painel.onclose = () => { if (aoFechar) aoFechar(); };
  if (!painel.open) {
    if (typeof painel.showModal === "function") painel.showModal();
    else painel.setAttribute("open", "");
  }
  if (aoMontar) aoMontar(painel);
  const primeiro = painel.querySelector(".painel__corpo [autofocus]");
  if (primeiro) primeiro.focus();
}

function fecharPainel() {
  const painel = document.getElementById("painel");
  if (!painel.open) return;
  if (typeof painel.close === "function") painel.close();
  else { painel.removeAttribute("open"); painel.onclose && painel.onclose(); }
}

/** Pergunta de confirmação (substitui o confirm() do navegador). Devolve uma Promise<boolean>. */
function confirmar({ titulo, texto, botao = "Confirmar", cancelar = "Cancelar", perigo = false }) {
  return new Promise((resolver) => {
    let respondeu = false;
    abrirPainel({
      titulo,
      corpo: `<p class="painel__texto">${texto}</p>
        <div class="painel__acoes">
          <button class="btn btn--secundario" type="button" data-resposta="nao">${cancelar}</button>
          <button class="btn ${perigo ? "btn--perigo" : "btn--primario"}" type="button" data-resposta="sim">${botao}</button>
        </div>`,
      aoMontar(painel) {
        painel.querySelectorAll("[data-resposta]").forEach((b) =>
          b.addEventListener("click", () => {
            respondeu = true;
            resolver(b.dataset.resposta === "sim");
            fecharPainel();
          })
        );
      },
      aoFechar() { if (!respondeu) resolver(false); },
    });
  });
}

/** Painel "Ir para a loja": explica que o usuário sai do ALMA e abre o site em nova aba. */
function irParaLoja(p, oferta) {
  const loja = LOJAS[oferta.loja];
  abrirPainel({
    titulo: `Comprar na ${loja.nome}`,
    corpo: `<div class="resumo-loja">
        ${fotoProduto(p, "foto--64")}
        <div>
          <p class="rotulo">${esc(p.marca)}</p>
          <p class="resumo-loja__nome">${esc(p.nome)} · ${p.ml}ml</p>
          <p class="resumo-loja__preco">${reais(oferta.preco)}</p>
        </div>
      </div>
      <p class="painel__texto">Você vai abrir o site da ${loja.nome} em uma nova aba para finalizar a compra. O ALMA não cobra nada por isso.</p>
      <div class="painel__acoes">
        <button class="btn btn--secundario" type="button" data-acao="fechar-painel">Cancelar</button>
        <a class="btn btn--primario" href="${loja.site}" target="_blank" rel="noopener noreferrer" data-saida="loja" data-loja-nome="${loja.nome}">Continuar ${icone("open_in_new")}</a>
      </div>`,
  });
}

/** Lista de perfumes para escolher (usada no botão + de Alertas). */
function escolherPerfume({ titulo, aoEscolher }) {
  const linha = (p) => `<li><button type="button" class="linha-escolha" data-id="${p.id}">
      ${fotoProduto(p, "foto--48")}
      <span class="linha-escolha__info"><span class="linha-escolha__nome">${esc(nomeCompleto(p))}</span>
      <span class="linha-escolha__preco">${reais(precoAtual(p))}${alertaDoProduto(p.id) ? " · já tem alerta" : ""}</span></span>
      ${icone("chevron_right")}
    </button></li>`;
  abrirPainel({
    titulo,
    corpo: `<div class="busca busca--painel">
        ${icone("search")}
        <label class="sr-only" for="filtro-perfume">Filtrar perfumes</label>
        <input id="filtro-perfume" type="search" placeholder="Filtrar por nome ou marca" autocomplete="off" autofocus>
      </div>
      <ul class="lista-escolha" id="lista-escolha">${PRODUTOS.map(linha).join("")}</ul>`,
    aoMontar(painel) {
      const lista = painel.querySelector("#lista-escolha");
      painel.querySelector("#filtro-perfume").addEventListener("input", (e) => {
        const achados = e.target.value.trim() ? buscarProdutos(e.target.value) : PRODUTOS;
        lista.innerHTML = achados.length ? achados.map(linha).join("") : `<li class="lista-escolha__vazio">Nenhum perfume encontrado.</li>`;
      });
      lista.addEventListener("click", (e) => {
        const botao = e.target.closest("[data-id]");
        if (!botao) return;
        fecharPainel();
        aoEscolher(produto(botao.dataset.id));
      });
    },
  });
}

/** Copia um texto; se o navegador não deixar, mostra o texto selecionado para copiar à mão. */
function copiarTexto(texto, mensagemOk) {
  const mostrarManual = () =>
    abrirPainel({
      titulo: "Copie o texto",
      corpo: `<p class="painel__texto">O navegador não deixou copiar sozinho. Selecione e copie o texto abaixo:</p>
        <label class="sr-only" for="campo-copia">Texto para copiar</label>
        <input class="campo-copia" id="campo-copia" type="text" readonly value="${esc(texto)}">`,
      aoMontar(painel) {
        const campoCopia = painel.querySelector("#campo-copia");
        campoCopia.focus();
        campoCopia.select();
      },
    });
  try {
    navigator.clipboard.writeText(texto).then(() => mostrarAviso(mensagemOk), mostrarManual);
  } catch (e) {
    mostrarManual();
  }
}
