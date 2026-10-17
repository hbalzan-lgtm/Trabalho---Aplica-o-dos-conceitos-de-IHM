/* ============================================================
   TELAS DO APP
   Cada tela é uma função que devolve:
   { html: "...", base: "nav" | "barra" | "nada", aoMontar(raiz) }
   - html: o conteúdo da tela
   - base: o que fica preso no rodapé (barra de navegação, barra de ação ou nada)
   - aoMontar: código que roda depois que o HTML entra na página (eventos, gráfico…)
   ============================================================ */

const Telas = {};

/* Filtros guardados enquanto o app está aberto */
let filtrosPromo = { categoria: "todas", ate1000: false, ordem: "desconto", lojas: [] };
let filtrosResultados = { consulta: null, ordem: "preco", categoria: "todas", lojas: [] };
let periodoHistorico = "30D";
const lojaEscolhida = {};

/* ============================================================
   ABERTURA (SPLASH)
   ============================================================ */

function sairDaSplash() {
  navegar(estado.usuario ? "#/inicio" : "#/login", { substituir: true });
}

Telas.splash = () => ({
  base: "nada",
  html: `<main class="splash" data-acao="pular-splash">
    <div class="splash__centro">
      <h1 class="splash__logo" tabindex="-1">ALMA</h1>
    </div>
    <p class="splash__slogan">A essência da economia inteligente</p>
    <button class="sr-only" type="button" data-acao="pular-splash">Entrar no app</button>
  </main>`,
  aoMontar() {
    const t = setTimeout(sairDaSplash, 1900);
    aoSairDaTela(() => clearTimeout(t));
  },
});

/* ============================================================
   LOGIN E CADASTRO
   ============================================================ */

function nomeDoEmail(email) {
  const base = email.split("@")[0].split(/[._\-+0-9]/)[0] || "Você";
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

function entrar(usuario, mensagem) {
  estado.usuario = usuario;
  salvarEstado();
  navegar("#/inicio", { substituir: true });
  mostrarAviso(mensagem || `Olá, ${usuario.nome}! Bom te ver por aqui.`);
}

function carregando(botao, texto) {
  botao.disabled = true;
  botao.classList.add("is-carregando");
  botao.innerHTML = `<span class="girando" aria-hidden="true"></span>${texto}`;
}

function limparErroAoDigitar(raiz) {
  raiz.addEventListener("input", (e) => {
    if (e.target.matches(".campo__entrada")) marcarErro(raiz, e.target.id, "");
  });
}

/** Botão lua/sol que liga e desliga o modo noturno. */
function botaoTema(classe) {
  const escuro = temaEfetivo() === "escuro";
  return `<button class="${classe}" type="button" data-acao="alternar-tema" aria-pressed="${escuro}" aria-label="Modo noturno">${icone(escuro ? "light_mode" : "dark_mode")}</button>`;
}

Telas.login = () => ({
  base: "nada",
  html: `<main class="auth">
    ${botaoTema("botao-icone auth__tema")}
    <div class="auth__marca">
      <h1 class="auth__logo" tabindex="-1">ALMA</h1>
      <p class="auth__sub">Encontre seu perfume pelo melhor preço</p>
    </div>
    <form class="auth__form" id="form-login" novalidate>
      ${campo({ id: "login-email", rotulo: "E-mail", tipo: "email", autocomplete: "email", extra: 'inputmode="email" autocapitalize="off" spellcheck="false"' })}
      ${campo({ id: "login-senha", rotulo: "Senha", tipo: "password", autocomplete: "current-password" })}
      <button class="link-sutil auth__esqueci" type="button" data-acao="esqueci-senha">Esqueci minha senha</button>
      <button class="btn btn--primario btn--grande btn--bloco" type="submit" id="botao-entrar">Entrar</button>
      <a class="btn btn--texto btn--bloco" href="#/cadastro">Criar conta</a>
    </form>
    <div class="divisor"><span>Ou continuar com</span></div>
    <div class="auth__social">
      <button class="social" type="button" data-acao="login-social" data-provedor="biometria" aria-label="Entrar com biometria">${icone("fingerprint")}</button>
      <button class="social" type="button" data-acao="login-social" data-provedor="Google" aria-label="Entrar com a conta Google">${icone("language")}</button>
    </div>
    <p class="auth__nota">Protótipo acadêmico: entre com qualquer e-mail e uma senha de 6 ou mais caracteres.</p>
  </main>`,
  aoMontar(raiz) {
    const form = raiz.querySelector("#form-login");
    limparErroAoDigitar(raiz);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("#login-email").value.trim();
      const senha = form.querySelector("#login-senha").value;
      const erroEmail = !email ? "Digite seu e-mail." : !EMAIL_VALIDO.test(email) ? "Digite um e-mail válido, como nome@exemplo.com." : "";
      const erroSenha = !senha ? "Digite sua senha." : senha.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : "";
      marcarErro(raiz, "login-email", erroEmail);
      marcarErro(raiz, "login-senha", erroSenha);
      if (erroEmail || erroSenha) {
        raiz.querySelector(erroEmail ? "#login-email" : "#login-senha").focus();
        return;
      }
      carregando(raiz.querySelector("#botao-entrar"), "Entrando…");
      setTimeout(() => entrar({ nome: nomeDoEmail(email), email }), 650);
    });
  },
});

Telas.cadastro = () => ({
  base: "nada",
  html: `${cabecalho({ esquerda: "voltar", direita: "nada", voltarPara: "#/login" })}
  <main class="auth auth--cadastro">
    <div class="auth__intro">
      <h1 class="titulo" tabindex="-1">Criar conta</h1>
      <p class="subtitulo">Leva menos de um minuto. Depois é só favoritar perfumes e criar alertas.</p>
    </div>
    <form class="auth__form" id="form-cadastro" novalidate>
      ${campo({ id: "cad-nome", rotulo: "Nome", autocomplete: "given-name" })}
      ${campo({ id: "cad-email", rotulo: "E-mail", tipo: "email", autocomplete: "email", extra: 'inputmode="email" autocapitalize="off" spellcheck="false"' })}
      ${campo({ id: "cad-senha", rotulo: "Senha", tipo: "password", autocomplete: "new-password", dica: "Use 6 ou mais caracteres." })}
      ${campo({ id: "cad-confirma", rotulo: "Confirmar senha", tipo: "password", autocomplete: "new-password" })}
      <button class="btn btn--primario btn--grande btn--bloco" type="submit" id="botao-cadastrar">Criar conta</button>
      <p class="auth__rodape">Já tem conta? <a href="#/login">Entrar</a></p>
    </form>
  </main>`,
  aoMontar(raiz) {
    const form = raiz.querySelector("#form-cadastro");
    limparErroAoDigitar(raiz);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const valor = (id) => form.querySelector("#" + id).value;
      const nome = valor("cad-nome").trim();
      const email = valor("cad-email").trim();
      const senha = valor("cad-senha");
      const confirma = valor("cad-confirma");
      const erros = {
        "cad-nome": nome ? "" : "Digite seu nome.",
        "cad-email": !email ? "Digite seu e-mail." : EMAIL_VALIDO.test(email) ? "" : "Digite um e-mail válido, como nome@exemplo.com.",
        "cad-senha": senha.length >= 6 ? "" : "A senha precisa ter pelo menos 6 caracteres.",
        "cad-confirma": !confirma ? "Repita a senha." : confirma === senha ? "" : "As senhas não são iguais.",
      };
      Object.entries(erros).forEach(([id, msg]) => marcarErro(raiz, id, msg));
      const primeiro = Object.keys(erros).find((id) => erros[id]);
      if (primeiro) {
        raiz.querySelector("#" + primeiro).focus();
        return;
      }
      carregando(raiz.querySelector("#botao-cadastrar"), "Criando conta…");
      setTimeout(() => entrar({ nome: nome.split(" ")[0], email }, `Conta criada! Boas-vindas, ${nome.split(" ")[0]}.`), 700);
    });
  },
});

/* ============================================================
   INÍCIO
   ============================================================ */

function cardDestaque({ produto: p, oferta: o, desconto: d }) {
  return `<a class="card-destaque" href="#/produto/${p.id}">
    <span class="selo-desconto">-${porcento(d)}</span>
    ${fotoProduto(p, "card-destaque__foto")}
    <span class="card-destaque__corpo">
      <span class="rotulo">${esc(LOJAS[o.loja].nome)}</span>
      <span class="card-destaque__nome">${esc(nomeComMarca(p))}</span>
      <span class="card-destaque__tipo">${esc(p.tipo)}, ${p.ml}ml</span>
      <span class="card-destaque__precos"><strong>${reais(o.preco)}</strong><s>${reais(o.de)}</s></span>
    </span>
  </a>`;
}

function itemQueda({ p, v }) {
  const o = melhorOferta(p);
  return `<li><a class="item-lista" href="#/produto/${p.id}">
    ${fotoProduto(p, "foto--58")}
    <span class="item-lista__info">
      <span class="item-lista__nome">${esc(nomeCompleto(p))}</span>
      <span class="item-lista__sub">${esc(LOJAS[o.loja].nome)}</span>
    </span>
    <span class="item-lista__preco"><strong>${reais(o.preco)}</strong>${textoQueda(v)}</span>
  </a></li>`;
}

Telas.inicio = () => {
  const nome = estado.usuario ? estado.usuario.nome : "Henrico";
  const preferidas = estado.preferencias.categorias;
  const destaques = ofertasEmPromocao()
    .sort((a, b) => preferidas.includes(b.produto.categoria) - preferidas.includes(a.produto.categoria) || b.desconto - a.desconto)
    .slice(0, 6);
  const quedas = PRODUTOS.map((p) => ({ p, v: variacaoSemana(p) }))
    .filter((x) => x.v <= -0.03)
    .sort((a, b) => a.v - b.v);

  return {
    base: "nav",
    html: `${cabecalho()}
    <main class="conteudo conteudo--nav">
      <section class="saudacao">
        <h1 class="titulo" tabindex="-1">Olá, ${esc(nome)}</h1>
        <p class="subtitulo">Descubra sua próxima assinatura olfativa.</p>
        <a class="busca busca--clara busca--link" href="#/busca">${icone("search")}<span>Pesquisar perfumes...</span></a>
      </section>

      <section class="secao" aria-labelledby="titulo-destaques">
        <div class="secao__topo">
          <h2 class="secao__titulo" id="titulo-destaques">Promoções em destaque</h2>
          <a class="link-mais" href="#/promocoes">Ver todas</a>
        </div>
        <div class="carrossel">${destaques.map(cardDestaque).join("")}</div>
      </section>

      ${quedas.length ? `<section class="secao" aria-labelledby="titulo-quedas">
        <h2 class="secao__titulo" id="titulo-quedas">Preços que caíram</h2>
        <p class="secao__apoio">Na última semana</p>
        <ul class="lista-cartoes">${quedas.map(itemQueda).join("")}</ul>
      </section>` : ""}
    </main>
    ${navInferior("inicio")}`,
  };
};

/* ============================================================
   PROMOÇÕES
   ============================================================ */

function filtrarPromocoes(filtros) {
  let itens = ofertasEmPromocao();
  if (filtros.categoria !== "todas") itens = itens.filter((i) => i.produto.categoria === filtros.categoria);
  if (filtros.ate1000) itens = itens.filter((i) => i.oferta.preco <= 1000);
  if (filtros.lojas.length) itens = itens.filter((i) => filtros.lojas.includes(i.oferta.loja));
  const ordens = {
    desconto: (a, b) => b.desconto - a.desconto,
    menor: (a, b) => a.oferta.preco - b.oferta.preco,
    maior: (a, b) => b.oferta.preco - a.oferta.preco,
  };
  return itens.sort(ordens[filtros.ordem]);
}

function cardPromo({ produto: p, oferta: o, desconto: d }) {
  const loja = LOJAS[o.loja];
  return `<article class="card-promo">
    <a class="card-promo__link" href="#/produto/${p.id}">
      <div class="foto foto--${p.foto} card-promo__foto">
        <img src="${p.img}" alt="" loading="lazy" decoding="async">
        <span class="selo-loja">${esc(loja.curto)}</span>
      </div>
      <div class="card-promo__corpo">
        <p class="rotulo">${esc(p.marca)}</p>
        <h2 class="card-promo__nome">${esc(p.nome)} ${esc(p.tipo)} ${p.ml}ml</h2>
        <p class="card-promo__de"><s><span class="sr-only">De </span>${reais(o.de)}</s>${textoQueda(d)}</p>
        <p class="card-promo__preco"><span class="sr-only">Por </span>${reais(o.preco)}</p>
      </div>
    </a>
    <button class="botao-carrinho" type="button" data-acao="ir-loja" data-produto="${p.id}" data-loja="${o.loja}" aria-label="Comprar ${esc(nomeCompleto(p))} na ${esc(loja.nome)}">${icone("shopping_cart", { preenchido: true })}</button>
  </article>`;
}

Telas.promocoes = () => {
  const itens = filtrarPromocoes(filtrosPromo);
  const categorias = [["todas", "Todas"], ...Object.entries(CATEGORIAS)];
  const extras = filtrosPromo.lojas.length + (filtrosPromo.ordem !== "desconto" ? 1 : 0);
  const chip = (id, rotulo) => {
    const ativo = filtrosPromo.categoria === id;
    return `<button class="chip${ativo ? " is-ativo" : ""}" type="button" data-acao="categoria-promo" data-categoria="${id}" aria-pressed="${ativo}">${rotulo}</button>`;
  };
  const vazio = estadoVazio({
    icone: "sell",
    titulo: "Nenhuma promoção com esses filtros",
    texto: "Tente outra categoria ou limpe os filtros para ver todas as ofertas.",
    acoes: `<button class="btn btn--primario" type="button" data-acao="limpar-filtros-promo">Limpar filtros</button>`,
  });
  return {
    base: "nav",
    html: `${cabecalho()}
    <main class="conteudo conteudo--nav">
      <div class="titulo-linha">
        <h1 class="titulo" tabindex="-1">Promoções</h1>
        <button class="botao-icone botao-icone--fundo" type="button" data-acao="filtros-promo" aria-label="Ordenar e filtrar${extras ? ` (${extras} ativo${extras > 1 ? "s" : ""})` : ""}">
          ${icone("tune")}${extras ? `<span class="contador" aria-hidden="true">${extras}</span>` : ""}
        </button>
      </div>
      <div class="chips chips--rolagem" role="group" aria-label="Filtrar por categoria">
        ${categorias.map(([id, r]) => chip(id, r)).join("")}
        <button class="chip${filtrosPromo.ate1000 ? " is-ativo" : ""}" type="button" data-acao="ate-1000" aria-pressed="${filtrosPromo.ate1000}">Até R$ 1.000</button>
      </div>
      <p class="contagem" role="status">${itens.length} oferta${itens.length === 1 ? "" : "s"} em promoção</p>
      <div class="lista-promos">${itens.length ? itens.map(cardPromo).join("") : vazio}</div>
    </main>
    ${navInferior("promocoes")}`,
  };
};

function abrirFiltrosPromo() {
  const ordens = [["desconto", "Maior desconto"], ["menor", "Menor preço"], ["maior", "Maior preço"]];
  abrirPainel({
    titulo: "Ordenar e filtrar",
    corpo: `<form id="form-filtros">
      <fieldset class="grupo">
        <legend class="grupo__titulo">Ordenar por</legend>
        ${ordens.map(([id, r]) => `<label class="opcao"><input type="radio" name="ordem" value="${id}" ${filtrosPromo.ordem === id ? "checked" : ""}><span>${r}</span></label>`).join("")}
      </fieldset>
      <fieldset class="grupo">
        <legend class="grupo__titulo">Lojas</legend>
        <div class="chips chips--quebra">
          ${Object.entries(LOJAS).map(([id, l]) => `<label class="chip chip--marcavel"><input type="checkbox" name="loja" value="${id}" ${filtrosPromo.lojas.includes(id) ? "checked" : ""}><span>${l.nome}</span></label>`).join("")}
        </div>
      </fieldset>
      <div class="painel__acoes">
        <button class="btn btn--secundario" type="button" data-limpar>Limpar</button>
        <button class="btn btn--primario" type="submit" data-aplicar>Mostrar ofertas</button>
      </div>
    </form>`,
    aoMontar(painel) {
      const form = painel.querySelector("#form-filtros");
      const ler = () => ({
        ...filtrosPromo,
        ordem: form.querySelector("[name=ordem]:checked").value,
        lojas: [...form.querySelectorAll("[name=loja]:checked")].map((c) => c.value),
      });
      const atualizar = () => {
        const n = filtrarPromocoes(ler()).length;
        form.querySelector("[data-aplicar]").textContent = n ? `Mostrar ${n} oferta${n > 1 ? "s" : ""}` : "Nenhuma oferta";
      };
      form.addEventListener("change", atualizar);
      form.querySelector("[data-limpar]").addEventListener("click", () => {
        form.querySelector("[value=desconto]").checked = true;
        form.querySelectorAll("[name=loja]").forEach((c) => (c.checked = false));
        atualizar();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        filtrosPromo = ler();
        fecharPainel();
        renderizar();
      });
      atualizar();
    },
  });
}

/* ============================================================
   BUSCA E RESULTADOS
   ============================================================ */

function destacar(texto, consulta) {
  const q = normalizar(consulta);
  const i = normalizar(texto).indexOf(q);
  if (!q || i < 0) return esc(texto);
  return esc(texto.slice(0, i)) + "<mark>" + esc(texto.slice(i, i + q.length)) + "</mark>" + esc(texto.slice(i + q.length));
}

function linkResultados(texto) {
  return "#/resultados?q=" + encodeURIComponent(texto);
}

Telas.busca = () => ({
  base: "nav",
  html: `${cabecalho({ esquerda: "voltar" })}
  <main class="conteudo conteudo--nav">
    <h1 class="titulo" tabindex="-1">O que você está procurando?</h1>
    <form class="busca-bloco" id="form-busca" role="search">
      <div class="busca">
        ${icone("search")}
        <label class="sr-only" for="campo-busca">Pesquisar perfumes, marcas ou notas</label>
        <input id="campo-busca" type="search" placeholder="Pesquise por perfumes, marcas, notas…" autocomplete="off"
          enterkeyhint="search" role="combobox" aria-autocomplete="list" aria-controls="sugestoes" aria-expanded="false">
        <button class="botao-icone busca__limpar" type="button" aria-label="Apagar o texto" hidden>${icone("close")}</button>
      </div>
      <ul class="sugestoes" id="sugestoes" role="listbox" aria-label="Sugestões" hidden></ul>
    </form>

    <section class="secao" aria-labelledby="titulo-recentes">
      <div class="secao__topo">
        <h2 class="secao__titulo" id="titulo-recentes">Pesquisas recentes</h2>
        ${estado.buscasRecentes.length ? `<button class="link-caps" type="button" data-acao="limpar-buscas">Limpar</button>` : ""}
      </div>
      ${estado.buscasRecentes.length
        ? `<div class="chips chips--quebra">${estado.buscasRecentes.map((b) => `<a class="chip chip--historico" href="${linkResultados(b)}">${icone("history")}${esc(b)}</a>`).join("")}</div>`
        : `<p class="texto-apoio">Suas últimas pesquisas aparecem aqui.</p>`}
    </section>

    <section class="secao" aria-labelledby="titulo-marcas">
      <h2 class="secao__titulo" id="titulo-marcas">Marcas populares</h2>
      <div class="grade-marcas">
        ${MARCAS_POPULARES.map((m) => `<a class="card-marca" href="${linkResultados(m)}">${esc(m)}</a>`).join("")}
      </div>
    </section>
  </main>
  ${navInferior("inicio")}`,
  aoMontar(raiz) {
    const form = raiz.querySelector("#form-busca");
    const entrada = raiz.querySelector("#campo-busca");
    const lista = raiz.querySelector("#sugestoes");
    const limpar = raiz.querySelector(".busca__limpar");
    let itens = [];
    let ativo = -1;

    const desenhar = () => {
      itens = sugestoesBusca(entrada.value);
      limpar.hidden = !entrada.value;
      const aberta = itens.length > 0;
      lista.hidden = !aberta;
      entrada.setAttribute("aria-expanded", String(aberta));
      if (!aberta) { entrada.removeAttribute("aria-activedescendant"); return; }
      lista.innerHTML = itens.map((s, i) => `<li class="sugestao${i === ativo ? " is-ativa" : ""}" id="sug-${i}" role="option" aria-selected="${i === ativo}" data-i="${i}">
          ${icone(s.tipo === "marca" ? "storefront" : "search")}
          <span class="sugestao__texto">${destacar(s.texto, entrada.value.trim())}</span>
          <span class="sugestao__extra">${s.tipo === "marca" ? "Marca" : reais(precoAtual(s.produto))}</span>
        </li>`).join("");
      if (ativo >= 0) entrada.setAttribute("aria-activedescendant", "sug-" + ativo);
      else entrada.removeAttribute("aria-activedescendant");
    };
    const buscar = (texto) => {
      if (!texto.trim()) { entrada.focus(); return; }
      navegar(linkResultados(texto.trim()));
    };
    const escolher = (s) => {
      if (s.tipo === "perfume") { registrarBusca(s.texto); navegar("#/produto/" + s.produto.id); }
      else buscar(s.texto);
    };

    entrada.addEventListener("input", () => { ativo = -1; desenhar(); });
    entrada.addEventListener("keydown", (e) => {
      if (!itens.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); ativo = (ativo + 1) % itens.length; desenhar(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); ativo = (ativo - 1 + itens.length) % itens.length; desenhar(); }
      else if (e.key === "Escape") { ativo = -1; itens = []; lista.hidden = true; entrada.setAttribute("aria-expanded", "false"); }
    });
    lista.addEventListener("mousedown", (e) => e.preventDefault());
    lista.addEventListener("click", (e) => {
      const li = e.target.closest("[data-i]");
      if (li) escolher(itens[Number(li.dataset.i)]);
    });
    limpar.addEventListener("click", () => { entrada.value = ""; ativo = -1; desenhar(); entrada.focus(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (ativo >= 0 && itens[ativo]) escolher(itens[ativo]);
      else buscar(entrada.value);
    });
    entrada.focus();
  },
});

function ofertaVisivel(p, lojas) {
  return ofertasOrdenadas(p).find((o) => o.estoque !== false && (!lojas.length || lojas.includes(o.loja))) || null;
}

function cardResultado({ p, o }, melhor) {
  const loja = LOJAS[o.loja];
  return `<article class="card-resultado${melhor ? " card-resultado--melhor" : ""}">
    ${melhor ? `<span class="selo-melhor">${icone("star", { preenchido: true })}Melhor preço</span>` : ""}
    <a class="card-resultado__link" href="#/produto/${p.id}">
      ${fotoProduto(p, "foto--86x115")}
      <div class="card-resultado__info">
        <p class="rotulo">${esc(p.tipo)} • ${p.ml}ml</p>
        <h2 class="card-resultado__nome">${esc(nomeCompleto(p))}</h2>
        ${avaliacao(p)}
        ${o.de ? `<p class="preco-de"><s><span class="sr-only">De </span>${reais(o.de)}</s></p>` : ""}
        <p class="card-resultado__preco"><strong>${reais(o.preco)}</strong>${o.de ? textoQueda(desconto(o)) : ""}</p>
        ${melhor ? "" : `<p class="card-resultado__loja">em ${esc(loja.nome)}</p>`}
      </div>
    </a>
    ${melhor ? `<button class="btn btn--primario btn--bloco card-resultado__botao" type="button" data-acao="ir-loja" data-produto="${p.id}" data-loja="${o.loja}">Ver oferta na ${esc(loja.nome)}</button>` : ""}
  </article>`;
}

Telas.resultados = (consulta) => {
  const q = (consulta.get("q") || "").trim();
  if (filtrosResultados.consulta !== q) filtrosResultados = { consulta: q, ordem: "preco", categoria: "todas", lojas: [] };
  const f = filtrosResultados;
  const encontrados = buscarProdutos(q);

  let linhas = encontrados
    .filter((p) => f.categoria === "todas" || p.categoria === f.categoria)
    .map((p) => ({ p, o: ofertaVisivel(p, f.lojas) }))
    .filter((x) => x.o);
  const ordens = {
    preco: (a, b) => a.o.preco - b.o.preco,
    desconto: (a, b) => desconto(b.o) - desconto(a.o),
    nota: (a, b) => b.p.nota - a.p.nota || b.p.avaliacoes - a.p.avaliacoes,
  };
  linhas.sort(ordens[f.ordem]);

  const ofertas = linhas.flatMap(({ p }) => p.ofertas.filter((o) => o.estoque !== false && (!f.lojas.length || f.lojas.includes(o.loja))));
  const nLojas = new Set(ofertas.map((o) => o.loja)).size;
  const idMelhor = linhas.length ? linhas.reduce((m, x) => (x.o.preco < m.o.preco ? x : m)).p.id : null;
  const nFiltros = f.lojas.length + (f.categoria !== "todas" ? 1 : 0);

  let corpo;
  if (!encontrados.length) {
    const sugestao = voceQuisDizer(q);
    corpo = estadoVazio({
      icone: "search_off",
      titulo: `Nenhum resultado para “${esc(q)}”`,
      texto: sugestao
        ? `Você quis dizer <a href="${linkResultados(sugestao)}">${esc(sugestao)}</a>?`
        : "Confira se o nome está escrito certo ou tente buscar só pela marca. Algumas lojas podem ter tirado o perfume do ar.",
      acoes: `<a class="btn btn--primario" href="#/busca">Nova busca</a><a class="btn btn--secundario" href="#/promocoes">Ver promoções</a>`,
    });
  } else if (!linhas.length) {
    corpo = estadoVazio({
      icone: "filter_list",
      titulo: "Nenhuma oferta com esses filtros",
      texto: "Existem resultados para essa busca, mas nenhum combina com os filtros escolhidos.",
      acoes: `<button class="btn btn--primario" type="button" data-acao="limpar-filtros-resultados">Limpar filtros</button>`,
    });
  } else {
    corpo = `<div class="lista-resultados">${linhas.map((x) => cardResultado(x, x.p.id === idMelhor)).join("")}</div>`;
  }

  return {
    base: "nav",
    html: `${cabecalho({ esquerda: "voltar", voltarPara: "#/busca" })}
    <main class="conteudo conteudo--nav">
      <h1 class="titulo" tabindex="-1">Resultados para ${esc(q)}</h1>
      <p class="subtitulo">${encontrados.length
        ? `Encontramos ${ofertas.length} oferta${ofertas.length === 1 ? "" : "s"} em ${nLojas} loja${nLojas === 1 ? "" : "s"}.`
        : "Não encontramos ofertas para essa busca."}</p>
      ${encontrados.length ? `<div class="barra-filtros">
        <button class="btn-filtro" type="button" data-acao="filtros-resultados">${icone("tune")}Filtros${nFiltros ? `<span class="contador">${nFiltros}</span>` : ""}</button>
        <label class="ordenar">
          <span class="sr-only">Ordenar por</span>
          <select id="ordem-resultados">
            <option value="preco" ${f.ordem === "preco" ? "selected" : ""}>Menor preço</option>
            <option value="desconto" ${f.ordem === "desconto" ? "selected" : ""}>Maior desconto</option>
            <option value="nota" ${f.ordem === "nota" ? "selected" : ""}>Melhor avaliação</option>
          </select>
          ${icone("keyboard_arrow_down")}
        </label>
      </div>` : ""}
      ${corpo}
    </main>
    ${navInferior("inicio")}`,
    aoMontar(raiz) {
      if (q) registrarBusca(q);
      const select = raiz.querySelector("#ordem-resultados");
      if (select) select.addEventListener("change", () => { filtrosResultados.ordem = select.value; renderizar({ manterRolagem: true }); });
    },
  };
};

function abrirFiltrosResultados() {
  const f = filtrosResultados;
  const categorias = [["todas", "Todas"], ...Object.entries(CATEGORIAS)];
  abrirPainel({
    titulo: "Filtros",
    corpo: `<form id="form-filtros-res">
      <fieldset class="grupo">
        <legend class="grupo__titulo">Categoria</legend>
        <div class="chips chips--quebra">
          ${categorias.map(([id, r]) => `<label class="chip chip--marcavel"><input type="radio" name="categoria" value="${id}" ${f.categoria === id ? "checked" : ""}><span>${r}</span></label>`).join("")}
        </div>
      </fieldset>
      <fieldset class="grupo">
        <legend class="grupo__titulo">Lojas</legend>
        <div class="chips chips--quebra">
          ${Object.entries(LOJAS).map(([id, l]) => `<label class="chip chip--marcavel"><input type="checkbox" name="loja" value="${id}" ${f.lojas.includes(id) ? "checked" : ""}><span>${l.nome}</span></label>`).join("")}
        </div>
      </fieldset>
      <div class="painel__acoes">
        <button class="btn btn--secundario" type="button" data-limpar>Limpar</button>
        <button class="btn btn--primario" type="submit">Aplicar filtros</button>
      </div>
    </form>`,
    aoMontar(painel) {
      const form = painel.querySelector("#form-filtros-res");
      form.querySelector("[data-limpar]").addEventListener("click", () => {
        form.querySelector("[name=categoria][value=todas]").checked = true;
        form.querySelectorAll("[name=loja]").forEach((c) => (c.checked = false));
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        filtrosResultados.categoria = form.querySelector("[name=categoria]:checked").value;
        filtrosResultados.lojas = [...form.querySelectorAll("[name=loja]:checked")].map((c) => c.value);
        fecharPainel();
        renderizar();
      });
    },
  });
}

/* ============================================================
   PRODUTO
   ============================================================ */

Telas.produto = (id) => {
  const p = produto(id);
  if (!p) return telaNaoEncontrada("Perfume não encontrado", "Esse perfume pode ter saído do catálogo. Que tal buscar outro?");
  const o = melhorOferta(p);
  const d = desconto(o);
  const fav = ehFavorito(p.id);
  const alerta = alertaDoProduto(p.id);
  const oncas = (p.ml / 29.5735).toFixed(1).replace(".", ",");
  const legenda = menorEm30Dias(p)
    ? "Menor preço dos últimos 30 dias nas lojas selecionadas."
    : `Melhor oferta entre ${lojasComEstoque(p)} lojas hoje.`;

  return {
    base: "barra",
    html: `${cabecalho({ esquerda: "voltar", direita: "compartilhar" })}
    <main class="produto conteudo--barra">
      <div class="produto__heroi produto__heroi--${p.heroiLargo ? "larga" : p.foto}">
        <img src="${p.img}" alt="${esc(nomeCompleto(p))}" decoding="async">
      </div>
      <section class="produto__folha">
        <div class="produto__cabeca">
          <div>
            <p class="rotulo">${esc(p.marca)}</p>
            <h1 class="produto__nome" tabindex="-1">${esc(p.nome)}</h1>
          </div>
          <p class="pilula-nota" aria-label="Nota ${p.nota.toFixed(1).replace(".", ",")} de 5, ${p.avaliacoes.toLocaleString("pt-BR")} avaliações">${icone("star")}${p.nota.toFixed(1).replace(".", ",")}</p>
        </div>
        <p class="pilula-tamanho">${p.ml}ml / ${oncas} oz</p>
        <p class="produto__descricao">${esc(p.descricao)}</p>
        <p class="produto__notas"><span>Notas:</span> ${p.notas.map(esc).join(" · ")}</p>

        <div class="card-preco">
          ${o.de ? `<s class="card-preco__de"><span class="sr-only">De </span>${reais(o.de)}</s>` : ""}
          <div class="card-preco__linha">
            <p class="card-preco__valor"><span class="sr-only">Por </span>${reais(o.preco)}</p>
            ${o.de ? `<span class="pilula-desconto">${icone("trending_down")}-${porcento(d)}</span>` : ""}
          </div>
          <p class="card-preco__legenda">${legenda} Melhor preço na ${esc(LOJAS[o.loja].nome)}.</p>
          <a class="card-preco__link" href="#/historico/${p.id}">${icone("history")}Ver histórico de preços${icone("chevron_right")}</a>
        </div>
      </section>
    </main>
    <div class="barra-acoes">
      <button class="btn btn--contorno btn--empilhado" type="button" data-acao="favoritar" data-produto="${p.id}" aria-pressed="${fav}">
        ${icone("favorite", { preenchido: fav })}<span>${fav ? "Favoritado" : "Favoritar"}</span>
      </button>
      <a class="btn btn--ouro btn--empilhado" href="${alerta ? `#/alertas/editar/${alerta.id}` : `#/alertas/novo/${p.id}`}">
        ${icone("notifications_active")}<span>${alerta ? "Editar alerta" : "Criar alerta"}</span>
      </a>
      <a class="btn btn--primario btn--empilhado" href="#/comparar/${p.id}">
        ${icone("shopping_cart")}<span>Ver ofertas</span>
      </a>
    </div>`,
    aoMontar() {
      registrarVisto(p.id);
    },
  };
};

/* ============================================================
   COMPARAR PREÇOS
   ============================================================ */

function cardLoja(o, ehMelhor, selecionada) {
  const loja = LOJAS[o.loja];
  const indisponivel = o.estoque === false;
  return `<button class="card-loja${selecionada ? " is-selecionada" : ""}${indisponivel ? " is-indisponivel" : ""}" type="button"
      role="radio" aria-checked="${selecionada}" ${indisponivel ? 'aria-disabled="true"' : ""} data-acao="selecionar-loja" data-loja="${o.loja}">
    ${ehMelhor ? `<span class="selo-canto">Melhor preço</span>` : ""}
    <span class="card-loja__topo">
      <span class="card-loja__nome">${esc(loja.nome)}</span>
      <span class="card-loja__preco">${indisponivel ? `<s>${reais(o.preco)}</s>` : reais(o.preco)}</span>
    </span>
    <span class="card-loja__meio">
      <span class="card-loja__entrega">${indisponivel ? icone("info") + "Indisponível" : icone("local_shipping") + textoEntrega(o.entrega)}</span>
      ${o.de && !indisponivel ? `<span class="card-loja__economia">${icone("arrow_downward")}${porcento(desconto(o))} hoje</span>` : ""}
    </span>
    ${indisponivel ? "" : `<span class="card-loja__estoque"><span class="ponto" aria-hidden="true"></span>Em estoque</span>`}
  </button>`;
}

Telas.comparar = (id) => {
  const p = produto(id);
  if (!p) return telaNaoEncontrada("Perfume não encontrado", "Não achamos esse perfume para comparar preços.");
  const ofertas = ofertasOrdenadas(p);
  const melhor = melhorOferta(p);
  const disponiveis = ofertas.filter((o) => o.estoque !== false);
  const escolhida = disponiveis.find((o) => o.loja === lojaEscolhida[p.id]) || melhor;
  const maisCara = disponiveis[disponiveis.length - 1];
  const economia = maisCara && maisCara.preco > escolhida.preco ? maisCara.preco - escolhida.preco : 0;

  return {
    base: "barra",
    html: `${cabecalho({ esquerda: "voltar", titulo: "Comparar preços", direita: "compartilhar", voltarPara: "#/produto/" + p.id })}
    <main class="conteudo conteudo--barra">
      <a class="resumo-produto" href="#/produto/${p.id}">
        ${fotoProduto(p, "foto--86")}
        <span class="resumo-produto__info">
          <span class="rotulo">${esc(p.tipo)} • ${p.ml}ml</span>
          <span class="resumo-produto__nome">${esc(p.apelido || p.nome)}</span>
          ${avaliacao(p, true).replace("<p", "<span").replace("</p>", "</span>")}
        </span>
      </a>
      <p class="texto-apoio">Toque em uma loja para escolher onde comprar.</p>
      <div class="lista-lojas" role="radiogroup" aria-label="Lojas com este perfume">
        ${ofertas.map((o) => cardLoja(o, o === melhor, o === escolhida)).join("")}
      </div>
      ${economia ? `<p class="nota-economia">${icone("check_circle", { preenchido: true })}Comprando na ${esc(LOJAS[escolhida.loja].nome)} você economiza ${reais(economia)} em relação à ${esc(LOJAS[maisCara.loja].nome)}.</p>` : ""}
    </main>
    <div class="barra-fixa">
      <button class="btn btn--primario btn--grande btn--bloco" type="button" data-acao="ir-loja" data-produto="${p.id}" data-loja="${escolhida.loja}">
        Ir para ${esc(LOJAS[escolhida.loja].nome)}${icone("open_in_new")}
      </button>
    </div>`,
  };
};

/* ============================================================
   HISTÓRICO DE PREÇOS
   ============================================================ */

function passoBonito(bruto) {
  const potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * potencia >= bruto) return m * potencia;
  return 10 * potencia;
}

function rotuloEixo(v) {
  if (v >= 1000) return (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " mil";
  return Math.round(v).toLocaleString("pt-BR");
}

/** Curva suave que não "passa do ponto" (interpolação monotônica). */
function caminhoSuave(pts) {
  const n = pts.length;
  if (n < 2) return "";
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  const f = (v) => v.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f(pts[i][0] + h)},${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)},${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`;
  }
  return d;
}

/** Desenha o gráfico de linha em SVG dentro de "caixa". */
function desenharGrafico(caixa, pontosOriginais, periodo) {
  // Períodos longos: um ponto a cada alguns dias para a curva ficar legível
  const salto = Math.max(1, Math.ceil(pontosOriginais.length / 90));
  const pontos = pontosOriginais.filter((_, i) => i % salto === 0 || i === pontosOriginais.length - 1);

  const largura = Math.max(260, Math.round(caixa.clientWidth));
  const altura = 230;
  const m = { esq: 50, dir: 12, topo: 34, base: 30 };
  const precos = pontos.map((x) => x.preco);
  let min = Math.min(...precos);
  let max = Math.max(...precos);
  if (max - min < 1) { min -= 50; max += 50; }
  const passo = passoBonito((max - min) / 3);
  const y0 = Math.floor(min / passo) * passo;
  const y1 = Math.ceil(max / passo) * passo;
  const X = (i) => m.esq + (i / (pontos.length - 1)) * (largura - m.esq - m.dir);
  const Y = (v) => m.topo + (1 - (v - y0) / (y1 - y0)) * (altura - m.topo - m.base);
  const pts = pontos.map((x, i) => [X(i), Y(x.preco)]);
  const linha = caminhoSuave(pts);
  const fundoY = altura - m.base;
  const area = `${linha} L${pts[pts.length - 1][0].toFixed(1)},${fundoY} L${pts[0][0].toFixed(1)},${fundoY} Z`;

  let grade = "";
  for (let v = y0; v <= y1 + passo / 1000; v += passo) {
    grade += `<line x1="${m.esq}" x2="${largura - m.dir}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grafico__grade"/>`;
    grade += `<text x="${m.esq - 10}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" class="grafico__eixo">${rotuloEixo(v)}</text>`;
  }
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (pontos.length - 1)));
  marcas.forEach((i, k) => {
    const x = X(i);
    const ancora = k === 0 ? "start" : k === marcas.length - 1 ? "end" : "middle";
    const texto = k === marcas.length - 1 ? "Hoje" : periodo.dias > 180 ? MESES[pontos[i].data.getMonth()] : diaMes(pontos[i].data);
    grade += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${m.topo - 6}" y2="${fundoY}" class="grafico__grade grafico__grade--v"/>`;
    grade += `<text x="${x.toFixed(1)}" y="${altura - 8}" text-anchor="${ancora}" class="grafico__eixo">${texto}</text>`;
  });

  const ultimo = pontos[pontos.length - 1];
  caixa.innerHTML = `<svg viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" class="grafico__svg"
      role="img" aria-label="Preço nos últimos ${periodo.nome}: mínimo ${reais(Math.min(...precos))}, máximo ${reais(Math.max(...precos))}, hoje ${reais(ultimo.preco)}.">
    <defs>
      <linearGradient id="grafico-area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#D3AF37" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#D3AF37" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grade}
    <path d="${area}" fill="url(#grafico-area)"/>
    <path class="grafico__linha" d="${linha}"/>
    <g class="grafico__marcador">
      <line class="grafico__guia" y1="${m.topo - 6}" y2="${fundoY}"/>
      <circle class="grafico__ponto" r="5.5"/>
      <rect class="grafico__etiqueta" rx="6" height="24"/>
      <text class="grafico__etiqueta-texto" text-anchor="middle"></text>
    </g>
  </svg>`;

  const svg = caixa.querySelector("svg");
  const guia = svg.querySelector(".grafico__guia");
  const ponto = svg.querySelector(".grafico__ponto");
  const etiqueta = svg.querySelector(".grafico__etiqueta");
  const texto = svg.querySelector(".grafico__etiqueta-texto");

  const marcar = (i, mostrarData) => {
    const [x, y] = pts[i];
    const rotulo = reais(pontos[i].preco) + (mostrarData ? " · " + diaMes(pontos[i].data) : "");
    const larg = rotulo.length * 6.9 + 18;
    const cx = Math.min(Math.max(x, m.esq + larg / 2), largura - m.dir - larg / 2);
    const ey = y - 36 < 2 ? y + 12 : y - 36;
    guia.setAttribute("x1", x); guia.setAttribute("x2", x);
    guia.style.opacity = mostrarData ? 1 : 0;
    ponto.setAttribute("cx", x); ponto.setAttribute("cy", y);
    etiqueta.setAttribute("x", cx - larg / 2); etiqueta.setAttribute("y", ey); etiqueta.setAttribute("width", larg);
    texto.setAttribute("x", cx); texto.setAttribute("y", ey + 16.5);
    texto.textContent = rotulo;
  };
  const indicePara = (evento) => {
    const r = svg.getBoundingClientRect();
    const x = ((evento.clientX - r.left) / r.width) * largura;
    const i = Math.round(((x - m.esq) / (largura - m.esq - m.dir)) * (pontos.length - 1));
    return Math.min(pontos.length - 1, Math.max(0, i));
  };
  svg.addEventListener("pointermove", (e) => marcar(indicePara(e), true));
  svg.addEventListener("pointerdown", (e) => marcar(indicePara(e), true));
  svg.addEventListener("pointerleave", () => marcar(pontos.length - 1, false));
  marcar(pontos.length - 1, false);
}

Telas.historico = (id) => {
  const p = produto(id);
  if (!p) return telaNaoEncontrada("Perfume não encontrado", "Não achamos o histórico desse perfume.");
  const periodo = PERIODOS.find((x) => x.id === periodoHistorico) || PERIODOS[1];
  const aval = avaliarPreco(p, periodo);
  const { menor, maior } = extremosHistorico(p);
  const atual = precoAtual(p);
  const iconeAval = { otimo: "check_circle", bom: "check_circle", alto: "info" }[aval.nivel];

  return {
    base: "barra",
    html: `${cabecalho({ esquerda: "voltar-circulo", voltarPara: "#/produto/" + p.id })}
    <main class="conteudo conteudo--barra">
      <h1 class="titulo" tabindex="-1">Histórico de preços</h1>
      <p class="subtitulo">Análise detalhada de mercado</p>

      <a class="card-mini" href="#/produto/${p.id}">
        ${fotoProduto(p, "foto--72")}
        <span class="card-mini__info">
          <span class="rotulo">${esc(p.tipo)}</span>
          <span class="card-mini__nome">${esc(nomeComMarca(p))}</span>
          <span class="card-mini__preco">${reais(atual)}</span>
        </span>
      </a>

      <section class="card-grafico" aria-label="Gráfico de preços">
        <div class="segmentado" role="group" aria-label="Período do gráfico">
          ${PERIODOS.map((x) => `<button type="button" class="segmentado__opcao${x.id === periodo.id ? " is-ativo" : ""}" data-acao="periodo" data-periodo="${x.id}" aria-pressed="${x.id === periodo.id}" aria-label="${x.nome}">${x.rotulo}</button>`).join("")}
        </div>
        <p class="avaliacao-preco avaliacao-preco--${aval.nivel}">${icone(iconeAval, { preenchido: true })}<span>${aval.texto}</span></p>
        <div class="grafico" id="grafico"></div>
        ${aval.nivel === "alto" ? `<a class="link-seta" href="#/alertas/novo/${p.id}">Criar alerta de preço${icone("chevron_right")}</a>` : ""}
      </section>

      <div class="extremos">
        <div class="extremo">
          <p class="extremo__rotulo">${icone("arrow_downward")}<span>Menor preço histórico</span></p>
          <p class="extremo__valor">${reais(menor.preco)}</p>
          <p class="extremo__data">${mesAno(menor.data)}</p>
        </div>
        <div class="extremo">
          <p class="extremo__rotulo">${icone("arrow_upward")}<span>Maior preço histórico</span></p>
          <p class="extremo__valor">${reais(maior.preco)}</p>
          <p class="extremo__data">${mesAno(maior.data)}</p>
        </div>
      </div>
    </main>
    <div class="barra-fixa">
      <a class="btn btn--primario btn--grande btn--bloco" href="#/comparar/${p.id}">Comprar agora</a>
    </div>`,
    aoMontar(raiz) {
      registrarVisto(p.id);
      const caixa = raiz.querySelector("#grafico");
      const pontos = janelaHistorico(p, periodo.dias);
      const desenhar = () => desenharGrafico(caixa, pontos, periodo);
      desenhar();
      let espera;
      const aoRedimensionar = () => { clearTimeout(espera); espera = setTimeout(desenhar, 120); };
      window.addEventListener("resize", aoRedimensionar);
      aoSairDaTela(() => window.removeEventListener("resize", aoRedimensionar));
    },
  };
};

/* Perfil › Histórico: perfumes vistos recentemente */
Telas.vistos = () => {
  const lista = estado.vistos.map(produto).filter(Boolean);
  const linha = (p) => `<li><a class="item-lista" href="#/historico/${p.id}">
      ${fotoProduto(p, "foto--58")}
      <span class="item-lista__info">
        <span class="item-lista__nome">${esc(nomeCompleto(p))}</span>
        <span class="item-lista__sub">${esc(p.tipo)} • ${p.ml}ml</span>
      </span>
      <span class="item-lista__preco"><strong>${reais(precoAtual(p))}</strong>${pilulaVariacao(variacaoSemana(p))}</span>
    </a></li>`;
  return {
    base: "nav",
    html: `${cabecalho({ esquerda: "voltar", voltarPara: "#/perfil" })}
    <main class="conteudo conteudo--nav">
      <h1 class="titulo" tabindex="-1">Histórico</h1>
      <p class="subtitulo">Perfumes que você viu recentemente. Toque em um para ver o gráfico de preços.</p>
      ${lista.length
        ? `<ul class="lista-cartoes">${lista.map(linha).join("")}</ul>`
        : estadoVazio({ icone: "history", titulo: "Nada por aqui ainda", texto: "Os perfumes que você abrir vão aparecer nesta lista.", acoes: `<a class="btn btn--primario" href="#/promocoes">Ver promoções</a>` })}
    </main>
    ${navInferior("perfil")}`,
  };
};

/* ============================================================
   NOTIFICAÇÕES
   ============================================================ */

const ICONE_NOTIFICACAO = {
  queda: "sell",
  historico: "trending_down",
  promocao: "shopping_bag",
  alerta: "notifications_active",
  boasvindas: "campaign",
};

function itemNotificacao(n) {
  return `<li><button class="notificacao${n.lida ? "" : " is-nova"}" type="button" data-acao="abrir-notificacao" data-id="${n.id}">
    <span class="notificacao__icone notificacao__icone--${n.tipo}">${icone(ICONE_NOTIFICACAO[n.tipo] || "notifications")}</span>
    <span class="notificacao__corpo">
      <span class="notificacao__titulo">${n.lida ? "" : '<span class="sr-only">Nova: </span>'}${esc(n.titulo)}</span>
      <span class="notificacao__texto">${esc(n.texto)}</span>
    </span>
    <span class="notificacao__quando">${tempoRelativo(n.quando)}</span>
  </button></li>`;
}

Telas.notificacoes = () => {
  const n = notificacoesNaoLidas();
  return {
    base: "nav",
    html: `${cabecalho({ esquerda: "voltar", sinoAtivo: true })}
    <main class="conteudo conteudo--nav">
      <h1 class="titulo" tabindex="-1">Notificações</h1>
      <div class="titulo-apoio">
        <p class="subtitulo">${n ? `Você tem ${n} nova${n > 1 ? "s" : ""} atualizaç${n > 1 ? "ões" : "ão"} de mercado.` : "Você está em dia: nenhuma notificação nova."}</p>
        ${n ? `<button class="link-caps" type="button" data-acao="marcar-lidas">Marcar como lidas</button>` : ""}
      </div>
      ${estado.notificacoes.length
        ? `<ul class="lista-notificacoes">${estado.notificacoes.map(itemNotificacao).join("")}</ul>`
        : estadoVazio({ icone: "notifications", titulo: "Sem notificações", texto: "Quando um preço cair, avisamos você aqui." })}
    </main>
    ${navInferior("alertas")}`,
  };
};

/* ============================================================
   ALERTAS
   ============================================================ */

function cardAlerta(a) {
  const p = produto(a.produtoId);
  const o = melhorOferta(p);
  const status = statusAlerta(a);
  const selo = {
    atingido: `<span class="status status--ok">${icone("check_circle")}Preço atingido!</span>`,
    monitorando: `<span class="status status--monitorando">${icone("visibility")}Monitorando</span>`,
    pausado: `<span class="status status--pausado">${icone("pause")}Pausado</span>`,
  }[status];
  const diferenca = a.alvo - o.preco;
  const detalhe = status === "pausado"
    ? "Você não será avisado enquanto estiver pausado."
    : status === "atingido"
      ? (diferenca > 0 ? `${reais(diferenca)} abaixo do alvo` : "Exatamente no alvo")
      : `Faltam ${reais(-diferenca)} para o alvo`;
  const canais = [a.canais.app && "app", a.canais.email && "e-mail"].filter(Boolean).join(" e ");

  return `<li class="card-alerta${status === "pausado" ? " is-pausado" : ""}">
    <div class="card-alerta__topo">
      <a class="card-alerta__produto" href="#/produto/${p.id}">
        ${fotoProduto(p, "foto--58")}
        <span class="card-alerta__textos">
          <span class="card-alerta__nome">${esc(p.nome)}</span>
          <span class="card-alerta__marca">${esc(p.marca)}</span>
        </span>
      </a>
      <button class="botao-icone" type="button" data-acao="menu-alerta" data-id="${a.id}" aria-label="Opções do alerta de ${esc(p.nome)}">${icone("more_vert")}</button>
    </div>
    ${selo}
    <div class="card-alerta__base">
      <div class="card-alerta__agora">
        <p class="card-alerta__preco">${reais(o.preco)}${o.de ? `<s>${reais(o.de)}</s>` : ""}</p>
        <p class="card-alerta__detalhe">${detalhe}</p>
      </div>
      <div class="card-alerta__alvo">
        <p>Alvo estabelecido</p>
        <strong>${reais(a.alvo)}</strong>
      </div>
    </div>
    <p class="card-alerta__canais">${icone(a.canais.email ? "mail" : "notifications")}Aviso por ${canais}</p>
  </li>`;
}

Telas.alertas = () => ({
  base: "nav",
  html: `${cabecalho()}
  <main class="conteudo conteudo--nav conteudo--fab">
    <h1 class="titulo" tabindex="-1">Meus alertas</h1>
    <p class="subtitulo">Monitore o preço de suas fragrâncias favoritas.</p>
    ${estado.alertas.length
      ? `<ul class="lista-alertas">${estado.alertas.map(cardAlerta).join("")}</ul>`
      : estadoVazio({
          icone: "notifications_active",
          titulo: "Você ainda não tem alertas",
          texto: "Crie um alerta e avisamos quando o perfume chegar ao preço que você quer pagar.",
          acoes: `<button class="btn btn--ouro" type="button" data-acao="novo-alerta">Criar alerta</button>`,
        })}
  </main>
  <button class="fab" type="button" data-acao="novo-alerta" aria-label="Criar novo alerta">${icone("add")}</button>
  ${navInferior("alertas")}`,
});

function abrirMenuAlerta(id) {
  const a = alertaPorId(id);
  if (!a) return;
  const p = produto(a.produtoId);
  abrirPainel({
    titulo: esc(p.nome),
    corpo: `<ul class="menu-acoes">
      <li><a class="menu-acoes__item" href="#/alertas/editar/${a.id}">${icone("edit")}Editar preço-alvo</a></li>
      <li><button class="menu-acoes__item" type="button" data-opcao="pausar">${icone(a.ativo ? "pause" : "play_arrow")}${a.ativo ? "Pausar alerta" : "Retomar alerta"}</button></li>
      <li><a class="menu-acoes__item" href="#/historico/${p.id}">${icone("history")}Ver histórico de preços</a></li>
      <li><button class="menu-acoes__item menu-acoes__item--perigo" type="button" data-opcao="excluir">${icone("delete")}Excluir alerta</button></li>
    </ul>`,
    aoMontar(painel) {
      painel.querySelector("[data-opcao=pausar]").addEventListener("click", () => {
        a.ativo = !a.ativo;
        salvarEstado();
        fecharPainel();
        renderizar({ manterRolagem: true });
        mostrarAviso(a.ativo ? "Alerta retomado." : "Alerta pausado. Você pode retomar quando quiser.");
      });
      painel.querySelector("[data-opcao=excluir]").addEventListener("click", () => {
        const { removido, indice } = removerAlerta(a.id);
        fecharPainel();
        renderizar({ manterRolagem: true });
        mostrarAviso("Alerta excluído.", {
          acao: {
            rotulo: "Desfazer",
            fn() {
              estado.alertas.splice(indice, 0, removido);
              salvarEstado();
              renderizar({ manterRolagem: true });
            },
          },
        });
      });
    },
  });
}

/* ---------- Criar / editar alerta ---------- */

function formatarValor(valor) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function telaFormularioAlerta(p, alerta, veioDeNovo = false) {
  const o = melhorOferta(p);
  const editando = Boolean(alerta);
  const canais = alerta ? alerta.canais : { app: true, email: false };
  const sugestoes = [0.05, 0.1, 0.2].map((f) => ({ f, valor: Math.round(o.preco * (1 - f)) }));

  return {
    base: "barra",
    html: `${cabecalho({ esquerda: "voltar", direita: "fechar", voltarPara: "#/produto/" + p.id })}
    <main class="conteudo conteudo--barra form-alerta">
      <div class="form-alerta__produto">
        ${fotoProduto(p, "foto--128")}
        <h1 class="form-alerta__nome" tabindex="-1">${esc(nomeComMarca(p))}</h1>
        <p class="form-alerta__atual">Preço atual: ${reais(o.preco)}</p>
        ${editando ? `<p class="nota-info">${icone("info")}${veioDeNovo ? "Você já tem um alerta para este perfume. Ajuste o valor abaixo." : "Você está editando um alerta existente."}</p>` : ""}
      </div>

      <form id="form-alerta" novalidate>
        <h2 class="form-alerta__titulo" id="rotulo-alvo">Definir preço-alvo</h2>
        <p class="form-alerta__ajuda" id="ajuda-alvo">Avisaremos quando o produto atingir este valor ou menos.</p>
        <div class="caixa-valor" id="caixa-valor">
          <span class="caixa-valor__moeda" aria-hidden="true">R$</span>
          <input class="caixa-valor__entrada" id="valor-alvo" type="text" inputmode="numeric" autocomplete="off" placeholder="0,00"
            aria-labelledby="rotulo-alvo" aria-describedby="ajuda-alvo msg-alvo" value="${alerta ? formatarValor(alerta.alvo) : ""}">
        </div>
        <p class="form-alerta__msg" id="msg-alvo" aria-live="polite"></p>
        <div class="chips chips--quebra sugestoes-alvo" role="group" aria-label="Sugestões de preço-alvo">
          ${sugestoes.map((s) => `<button class="chip" type="button" data-sugestao="${s.valor}" aria-label="${Math.round(s.f * 100)}% abaixo: ${reais(s.valor)}">-${Math.round(s.f * 100)}% · R$ ${s.valor.toLocaleString("pt-BR")}</button>`).join("")}
        </div>

        <fieldset class="canais">
          <legend class="form-alerta__titulo">Como deseja ser avisado?</legend>
          <label class="canal">
            <input type="checkbox" name="canal" value="app" ${canais.app ? "checked" : ""}>
            <span class="canal__caixa" aria-hidden="true">${icone("check")}</span>
            ${icone("notifications")}<span>Notificação no app</span>
          </label>
          <label class="canal">
            <input type="checkbox" name="canal" value="email" ${canais.email ? "checked" : ""}>
            <span class="canal__caixa" aria-hidden="true">${icone("check")}</span>
            ${icone("mail")}<span>E-mail</span>
          </label>
          <p class="form-alerta__msg" id="msg-canal" aria-live="polite"></p>
        </fieldset>
      </form>
    </main>
    <div class="barra-fixa">
      <button class="btn btn--ouro btn--grande btn--bloco" type="submit" form="form-alerta">${editando ? "Salvar alterações" : "Criar alerta"}</button>
    </div>`,
    aoMontar(raiz) {
      const form = raiz.querySelector("#form-alerta");
      const entrada = raiz.querySelector("#valor-alvo");
      const caixa = raiz.querySelector("#caixa-valor");
      const msgAlvo = raiz.querySelector("#msg-alvo");
      const msgCanal = raiz.querySelector("#msg-canal");
      let alterado = false;

      const lerValor = () => {
        const digitos = entrada.value.replace(/\D/g, "");
        return digitos ? parseInt(digitos, 10) / 100 : 0;
      };
      const mensagem = (el, texto, tipo) => {
        el.className = "form-alerta__msg" + (tipo ? " form-alerta__msg--" + tipo : "");
        el.innerHTML = texto ? icone(tipo === "erro" ? "error" : tipo === "aviso" ? "warning" : "info", { preenchido: true }) + `<span>${texto}</span>` : "";
      };
      const avaliar = (valor) => {
        caixa.classList.remove("is-erro");
        if (!valor) return mensagem(msgAlvo, "");
        if (valor >= o.preco) return mensagem(msgAlvo, `Esse valor é igual ou maior que o preço atual (${reais(o.preco)}). Você será avisado na hora.`, "aviso");
        if (valor < o.preco * 0.5) return mensagem(msgAlvo, "Esse valor está bem abaixo do preço atual. Confira se digitou certo.", "aviso");
        mensagem(msgAlvo, `${porcento((o.preco - valor) / o.preco)} abaixo do preço atual.`, "info");
      };
      const definir = (valor) => {
        entrada.value = valor ? formatarValor(valor) : "";
        alterado = true;
        avaliar(valor);
      };

      entrada.addEventListener("input", () => {
        const digitos = entrada.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
        definir(digitos ? parseInt(digitos, 10) / 100 : 0);
      });
      raiz.querySelectorAll("[data-sugestao]").forEach((b) =>
        b.addEventListener("click", () => { definir(Number(b.dataset.sugestao)); entrada.focus(); })
      );
      form.addEventListener("change", (e) => {
        if (e.target.name === "canal") { alterado = true; mensagem(msgCanal, ""); }
      });
      if (alerta) avaliar(alerta.alvo);

      guardaSaida = async () => {
        if (!alterado) return true;
        return confirmar({
          titulo: "Descartar alterações?",
          texto: "O alerta ainda não foi salvo. Se sair agora, o que você preencheu será perdido.",
          botao: "Descartar",
          cancelar: "Continuar editando",
          perigo: true,
        });
      };

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const valor = lerValor();
        const escolhidos = {
          app: form.querySelector("[value=app]").checked,
          email: form.querySelector("[value=email]").checked,
        };
        let ok = true;
        if (!valor) {
          caixa.classList.add("is-erro");
          mensagem(msgAlvo, "Digite o preço-alvo. Exemplo: 350,00.", "erro");
          ok = false;
        }
        if (!escolhidos.app && !escolhidos.email) {
          mensagem(msgCanal, "Escolha pelo menos uma forma de aviso.", "erro");
          ok = false;
        }
        if (!ok) {
          (valor ? form.querySelector("[name=canal]") : entrada).focus();
          return;
        }
        salvarAlerta({ id: alerta && alerta.id, produtoId: p.id, alvo: valor, canais: escolhidos });
        alterado = false;
        guardaSaida = null;
        const jaAtingiu = valor >= o.preco;
        if (jaAtingiu) {
          adicionarNotificacao({
            tipo: "alerta",
            produtoId: p.id,
            titulo: `Alerta de preço atingido: ${p.nome}`,
            texto: `O preço já está em ${reais(o.preco)} na ${LOJAS[o.loja].nome}, dentro do seu alvo de ${reais(valor)}.`,
          });
        }
        navegar("#/alertas", { substituir: true });
        mostrarAviso(jaAtingiu
          ? "Alerta salvo. O preço já está no seu alvo!"
          : editando ? "Alerta atualizado." : `Alerta criado! Avisaremos quando chegar a ${reais(valor)}.`);
      });
    },
  };
}

Telas.novoAlerta = (produtoId) => {
  const p = produto(produtoId);
  if (!p) return telaNaoEncontrada("Perfume não encontrado", "Não dá para criar alerta para um perfume que não existe no catálogo.");
  const existente = alertaDoProduto(p.id);
  return telaFormularioAlerta(p, existente, Boolean(existente));
};

Telas.editarAlerta = (alertaId) => {
  const a = alertaPorId(alertaId);
  if (!a) return telaNaoEncontrada("Alerta não encontrado", "Esse alerta pode ter sido excluído.");
  return telaFormularioAlerta(produto(a.produtoId), a);
};

/* ============================================================
   FAVORITOS
   ============================================================ */

function cardFavorito(p) {
  return `<li class="card-favorito">
    <a class="card-favorito__link" href="#/produto/${p.id}">
      ${fotoProduto(p, "foto--72x88")}
      <span class="card-favorito__info">
        <span class="card-favorito__nome">${esc(p.nome)}</span>
        <span class="card-favorito__marca">${esc(p.marca)} • ${p.ml}ml</span>
        <span class="card-favorito__preco"><strong>${reais(precoAtual(p))}</strong>${pilulaVariacao(variacaoSemana(p))}</span>
      </span>
    </a>
    <button class="botao-icone botao-coracao" type="button" data-acao="remover-favorito" data-produto="${p.id}" aria-label="Remover ${esc(p.nome)} dos favoritos">${icone("favorite", { preenchido: true })}</button>
  </li>`;
}

Telas.favoritos = () => {
  const lista = estado.favoritos.map(produto).filter(Boolean);
  return {
    base: "nav",
    html: `${cabecalho()}
    <main class="conteudo conteudo--nav">
      <h1 class="titulo" tabindex="-1">Meus favoritos</h1>
      <p class="subtitulo">Sua coleção de fragrâncias favoritas.</p>
      ${lista.length
        ? `<ul class="lista-favoritos">${lista.map(cardFavorito).join("")}</ul>`
        : estadoVazio({
            icone: "favorite",
            titulo: "Nenhum favorito ainda",
            texto: "Toque em “Favoritar” na página de um perfume para acompanhar o preço dele aqui.",
            acoes: `<a class="btn btn--primario" href="#/promocoes">Ver promoções</a>`,
          })}
    </main>
    ${navInferior("favoritos")}`,
  };
};

/* ============================================================
   PERFIL
   ============================================================ */

function itemMenu({ href, acao, icone: nome, rotulo }) {
  const conteudo = `${icone(nome)}<span>${rotulo}</span>${icone("chevron_right", { classe: "menu-lista__seta" })}`;
  return href
    ? `<li><a class="menu-lista__item" href="${href}">${conteudo}</a></li>`
    : `<li><button class="menu-lista__item" type="button" data-acao="${acao}">${conteudo}</button></li>`;
}

Telas.perfil = () => {
  const u = estado.usuario || { nome: "Henrico", email: "henrico@example.com" };
  return {
    base: "nav",
    html: `${cabecalho()}
    <main class="conteudo conteudo--nav perfil">
      <section class="perfil__topo">
        <div class="perfil__foto">${avatar("g", "Foto de perfil de " + u.nome)}</div>
        <h1 class="perfil__nome" tabindex="-1">${esc(u.nome)}</h1>
        <p class="perfil__email">${esc(u.email)}</p>
        ${estado.premium ? `<p class="selo-premium">${icone("workspace_premium")}Membro Premium</p>` : ""}
      </section>

      <div class="numeros">
        <a class="numero" href="#/favoritos"><strong>${estado.favoritos.length}</strong><span>Favoritos</span></a>
        <a class="numero" href="#/alertas"><strong>${estado.alertas.length}</strong><span>Alertas</span></a>
      </div>

      ${estado.premium ? "" : `<section class="premium">
        <h2 class="premium__titulo">ALMA Premium</h2>
        <p class="premium__texto">Acesso antecipado a quedas de preços de fragrâncias exclusivas.</p>
        <button class="botao-premium" type="button" data-acao="premium">Fazer upgrade</button>
      </section>`}

      <ul class="menu-lista">
        ${itemMenu({ href: "#/favoritos", icone: "favorite", rotulo: "Favoritos" })}
        ${itemMenu({ href: "#/alertas", icone: "notifications", rotulo: "Alertas" })}
        ${itemMenu({ href: "#/historico", icone: "history", rotulo: "Histórico" })}
        ${itemMenu({ acao: "preferencias", icone: "tune", rotulo: "Preferências" })}
      </ul>
      <ul class="menu-lista">
        <li><label class="menu-lista__item menu-lista__item--interruptor" for="tema-rapido">
          ${icone("dark_mode")}<span>Modo noturno</span>
          <input type="checkbox" role="switch" id="tema-rapido" ${temaEfetivo() === "escuro" ? "checked" : ""}>
          <span class="interruptor__trilho" aria-hidden="true"></span>
        </label></li>
        ${itemMenu({ acao: "configuracoes", icone: "settings", rotulo: "Configurações" })}
        ${itemMenu({ acao: "seguranca", icone: "shield", rotulo: "Segurança" })}
        ${itemMenu({ href: "#/ajuda", icone: "help", rotulo: "Ajuda" })}
      </ul>
      <button class="btn btn--sair btn--bloco" type="button" data-acao="sair">${icone("logout")}Sair da conta</button>
      <p class="versao">ALMA 1.0 · Price Watch · protótipo acadêmico</p>
    </main>
    ${navInferior("perfil")}`,
    aoMontar(raiz) {
      raiz.querySelector("#tema-rapido").addEventListener("change", (e) => {
        definirTema(e.target.checked ? "escuro" : "claro");
        mostrarAviso(e.target.checked ? "Modo noturno ativado." : "Modo claro ativado.");
      });
    },
  };
};

function abrirPremium() {
  abrirPainel({
    titulo: "ALMA Premium",
    corpo: `<ul class="lista-beneficios">
        <li>${icone("check_circle", { preenchido: true })}Alertas antes de todo mundo nas quedas de preço</li>
        <li>${icone("check_circle", { preenchido: true })}Alertas ilimitados e por e-mail</li>
        <li>${icone("check_circle", { preenchido: true })}Histórico completo de 2 anos</li>
      </ul>
      <p class="preco-plano"><strong>R$ 14,90</strong>/mês · cancele quando quiser</p>
      <p class="painel__texto painel__texto--pequeno">Protótipo: nenhuma cobrança é feita.</p>
      <div class="painel__acoes">
        <button class="btn btn--secundario" type="button" data-acao="fechar-painel">Agora não</button>
        <button class="btn btn--ouro" type="button" data-assinar>Assinar Premium</button>
      </div>`,
    aoMontar(painel) {
      painel.querySelector("[data-assinar]").addEventListener("click", () => {
        estado.premium = true;
        salvarEstado();
        fecharPainel();
        renderizar({ manterRolagem: true });
        mostrarAviso("Pronto! Você agora é Premium (demonstração).");
      });
    },
  });
}

function interruptor(id, rotulo, descricao, ligado) {
  return `<label class="interruptor" for="${id}">
    <span class="interruptor__textos"><span class="interruptor__rotulo">${rotulo}</span>${descricao ? `<span class="interruptor__desc">${descricao}</span>` : ""}</span>
    <input type="checkbox" role="switch" id="${id}" ${ligado ? "checked" : ""}>
    <span class="interruptor__trilho" aria-hidden="true"></span>
  </label>`;
}

function abrirPreferencias() {
  const prefs = estado.preferencias;
  abrirPainel({
    titulo: "Preferências",
    corpo: `<form id="form-prefs">
      <fieldset class="grupo">
        <legend class="grupo__titulo">Categorias que você mais usa</legend>
        <p class="painel__texto painel__texto--pequeno">Mostramos primeiro as promoções dessas categorias no Início.</p>
        <div class="chips chips--quebra">
          ${Object.entries(CATEGORIAS).map(([id, r]) => `<label class="chip chip--marcavel"><input type="checkbox" name="cat" value="${id}" ${prefs.categorias.includes(id) ? "checked" : ""}><span>${r}</span></label>`).join("")}
        </div>
      </fieldset>
      ${interruptor("pref-resumo", "Resumo semanal por e-mail", "As maiores quedas da semana, toda segunda-feira.", prefs.resumoEmail)}
      <div class="painel__acoes"><button class="btn btn--primario btn--bloco" type="submit">Salvar preferências</button></div>
    </form>`,
    aoMontar(painel) {
      painel.querySelector("#form-prefs").addEventListener("submit", (e) => {
        e.preventDefault();
        prefs.categorias = [...painel.querySelectorAll("[name=cat]:checked")].map((c) => c.value);
        prefs.resumoEmail = painel.querySelector("#pref-resumo").checked;
        salvarEstado();
        fecharPainel();
        mostrarAviso("Preferências salvas.");
      });
    },
  });
}

const OPCOES_TEMA = [
  { id: "claro", icone: "light_mode", rotulo: "Claro" },
  { id: "escuro", icone: "dark_mode", rotulo: "Escuro" },
  { id: "auto", icone: "contrast", rotulo: "Automático" },
];

function abrirConfiguracoes() {
  const prefs = estado.preferencias;
  const temaAtual = prefs.tema || "claro";
  abrirPainel({
    titulo: "Configurações",
    corpo: `<fieldset class="grupo">
        <legend class="grupo__titulo">Aparência</legend>
        <div class="aparencia">
          ${OPCOES_TEMA.map((t) => `<label class="aparencia__opcao"><input type="radio" name="tema" value="${t.id}" ${temaAtual === t.id ? "checked" : ""}>${icone(t.icone)}<span>${t.rotulo}</span></label>`).join("")}
        </div>
        <p class="painel__texto painel__texto--pequeno aparencia__ajuda">Automático segue o tema do seu celular ou computador.</p>
      </fieldset>
      ${interruptor("cfg-app", "Notificações no app", "Quedas de preço e alertas atingidos.", prefs.notificacoesApp)}
      ${interruptor("cfg-emails", "E-mails com ofertas", "Promoções selecionadas das lojas parceiras.", prefs.emailsOfertas)}
      <dl class="info-lista">
        <div><dt>Idioma</dt><dd>Português (Brasil)</dd></div>
        <div><dt>Moeda</dt><dd>Real (R$)</dd></div>
      </dl>
      <button class="btn btn--secundario btn--bloco" type="button" data-restaurar>${icone("history")}Restaurar dados de demonstração</button>`,
    aoMontar(painel) {
      painel.querySelectorAll("[name=tema]").forEach((opcao) =>
        opcao.addEventListener("change", () => {
          definirTema(opcao.value);
          const nomes = { claro: "Modo claro ativado.", escuro: "Modo noturno ativado.", auto: "Tema automático: segue o seu dispositivo." };
          mostrarAviso(nomes[opcao.value]);
        })
      );
      painel.querySelector("#cfg-app").addEventListener("change", (e) => { prefs.notificacoesApp = e.target.checked; salvarEstado(); mostrarAviso(e.target.checked ? "Notificações ativadas." : "Notificações desativadas."); });
      painel.querySelector("#cfg-emails").addEventListener("change", (e) => { prefs.emailsOfertas = e.target.checked; salvarEstado(); mostrarAviso(e.target.checked ? "E-mails com ofertas ativados." : "E-mails com ofertas desativados."); });
      painel.querySelector("[data-restaurar]").addEventListener("click", async () => {
        const ok = await confirmar({
          titulo: "Restaurar demonstração?",
          texto: "Favoritos, alertas, notificações e buscas voltam ao estado inicial. Você continua conectado.",
          botao: "Restaurar",
        });
        if (!ok) return;
        restaurarDemonstracao();
        filtrosPromo = { categoria: "todas", ate1000: false, ordem: "desconto", lojas: [] };
        renderizar();
        mostrarAviso("Dados de demonstração restaurados.");
      });
    },
  });
}

function abrirSeguranca() {
  abrirPainel({
    titulo: "Segurança",
    corpo: `<form id="form-senha" novalidate>
      <p class="painel__texto">Troque sua senha. Use pelo menos 6 caracteres.</p>
      ${campo({ id: "senha-atual", rotulo: "Senha atual", tipo: "password", autocomplete: "current-password" })}
      ${campo({ id: "senha-nova", rotulo: "Nova senha", tipo: "password", autocomplete: "new-password" })}
      ${campo({ id: "senha-confirma", rotulo: "Confirmar nova senha", tipo: "password", autocomplete: "new-password" })}
      <div class="painel__acoes"><button class="btn btn--primario btn--bloco" type="submit">Alterar senha</button></div>
    </form>`,
    aoMontar(painel) {
      const form = painel.querySelector("#form-senha");
      limparErroAoDigitar(painel);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = (id) => form.querySelector("#" + id).value;
        const erros = {
          "senha-atual": v("senha-atual") ? "" : "Digite sua senha atual.",
          "senha-nova": v("senha-nova").length >= 6 ? (v("senha-nova") === v("senha-atual") ? "A nova senha precisa ser diferente da atual." : "") : "A nova senha precisa ter pelo menos 6 caracteres.",
          "senha-confirma": v("senha-confirma") === v("senha-nova") && v("senha-confirma") ? "" : "As senhas não são iguais.",
        };
        Object.entries(erros).forEach(([id, msg]) => marcarErro(painel, id, msg));
        const primeiro = Object.keys(erros).find((id) => erros[id]);
        if (primeiro) { form.querySelector("#" + primeiro).focus(); return; }
        fecharPainel();
        mostrarAviso("Senha alterada com sucesso.");
      });
    },
  });
}

function abrirEsqueciSenha() {
  const digitado = document.querySelector("#login-email");
  abrirPainel({
    titulo: "Recuperar senha",
    corpo: `<form id="form-recuperar" novalidate>
      <p class="painel__texto">Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
      ${campo({ id: "recuperar-email", rotulo: "E-mail", tipo: "email", autocomplete: "email", valor: digitado ? digitado.value.trim() : "", extra: 'inputmode="email" autocapitalize="off" spellcheck="false" autofocus' })}
      <div class="painel__acoes"><button class="btn btn--primario btn--bloco" type="submit">Enviar link</button></div>
    </form>`,
    aoMontar(painel) {
      limparErroAoDigitar(painel);
      painel.querySelector("#form-recuperar").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = painel.querySelector("#recuperar-email").value.trim();
        const erro = !email ? "Digite seu e-mail." : EMAIL_VALIDO.test(email) ? "" : "Digite um e-mail válido, como nome@exemplo.com.";
        marcarErro(painel, "recuperar-email", erro);
        if (erro) { painel.querySelector("#recuperar-email").focus(); return; }
        fecharPainel();
        mostrarAviso(`Enviamos um link para ${email}. Confira sua caixa de entrada.`, { duracao: 5500 });
      });
    },
  });
}

/* ============================================================
   AJUDA
   ============================================================ */

const EMAIL_SUPORTE = "suporte@alma.example";

Telas.ajuda = () => ({
  base: "nav",
  html: `${cabecalho({ esquerda: "voltar", voltarPara: "#/perfil" })}
  <main class="conteudo conteudo--nav">
    <h1 class="titulo" tabindex="-1">Central de ajuda</h1>
    <p class="subtitulo">Respostas rápidas sobre preços, alertas e favoritos.</p>
    <div class="busca busca--clara busca--ajuda">
      ${icone("search")}
      <label class="sr-only" for="busca-ajuda">Buscar na ajuda</label>
      <input id="busca-ajuda" type="search" placeholder="Buscar na ajuda (ex.: alerta)" autocomplete="off">
    </div>
    <div class="faq" id="faq">
      ${PERGUNTAS_AJUDA.map((q) => `<details class="faq__item" data-busca="${esc(normalizar(q.p + " " + q.r))}">
        <summary>${esc(q.p)}${icone("keyboard_arrow_down")}</summary>
        <p>${esc(q.r)}</p>
      </details>`).join("")}
    </div>
    <p class="texto-apoio faq__vazio" hidden>Nenhuma resposta encontrada. Tente outra palavra, como “alerta” ou “loja”.</p>
    <section class="contato">
      <h2 class="secao__titulo">Ainda precisa de ajuda?</h2>
      <p>Escreva para <strong class="selecionavel">${EMAIL_SUPORTE}</strong>. Respondemos em até 1 dia útil.</p>
      <button class="btn btn--secundario" type="button" data-acao="copiar-email">${icone("mail")}Copiar e-mail</button>
    </section>
  </main>
  ${navInferior("perfil")}`,
  aoMontar(raiz) {
    const entrada = raiz.querySelector("#busca-ajuda");
    const itens = [...raiz.querySelectorAll(".faq__item")];
    const vazio = raiz.querySelector(".faq__vazio");
    entrada.addEventListener("input", () => {
      const termos = normalizar(entrada.value).split(" ").filter(Boolean);
      let visiveis = 0;
      itens.forEach((item) => {
        const mostra = termos.every((t) => item.dataset.busca.includes(t));
        item.hidden = !mostra;
        if (mostra) visiveis++;
        item.open = termos.length > 0 && mostra && visiveis === 1;
      });
      vazio.hidden = visiveis > 0;
    });
  },
});

/* ============================================================
   PÁGINA NÃO ENCONTRADA
   ============================================================ */

function telaNaoEncontrada(titulo = "Página não encontrada", texto = "O endereço pode estar errado ou o conteúdo saiu do ar.") {
  return {
    base: "nav",
    html: `${cabecalho({ esquerda: "voltar" })}
    <main class="conteudo conteudo--nav">
      <h1 class="sr-only" tabindex="-1">${titulo}</h1>
      ${estadoVazio({ icone: "search_off", titulo, texto, acoes: `<a class="btn btn--primario" href="#/inicio">Ir para o início</a>` })}
    </main>
    ${navInferior("")}`,
  };
}
