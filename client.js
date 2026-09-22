const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const state = {
  leads: [],
  lastQuery: null,
  mode: "mock",
  searches: Number(localStorage.getItem("hunterx-search-count") || 7),
  history: JSON.parse(localStorage.getItem("hunterx-history") || "[]"),
  favorites: JSON.parse(localStorage.getItem("hunterx-favorites") || "{}"),
  contacted: JSON.parse(localStorage.getItem("hunterx-contacted") || "{}")
};

const labels = {
  dashboard: "Visão geral",
  search: "Buscar leads",
  history: "Histórico",
  favorites: "Favoritos",
  messages: "Mensagens",
  settings: "Configurações"
};

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[c]));
}

function go(view) {
  $$(".view").forEach(el => el.classList.toggle("active", el.id === "view-" + view));
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  $("#breadcrumb").textContent = labels[view] || view;
  $(".sidebar").classList.remove("open");
  if (view === "history") renderHistory();
  if (view === "favorites") renderFavorites();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function persist() {
  localStorage.setItem("hunterx-history", JSON.stringify(state.history.slice(0, 30)));
  localStorage.setItem("hunterx-favorites", JSON.stringify(state.favorites));
  localStorage.setItem("hunterx-contacted", JSON.stringify(state.contacted));
  localStorage.setItem("hunterx-search-count", String(state.searches));
  updateCounters();
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2200);
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(x => x[0] || "").join("").toUpperCase() || "HX";
}

function phoneLabel(value = "") {
  const d = String(value).replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return "(" + d.slice(0,2) + ") " + d.slice(2,7) + "-" + d.slice(7);
  if (d.length === 10) return "(" + d.slice(0,2) + ") " + d.slice(2,6) + "-" + d.slice(6);
  return value || "—";
}

function waPhone(value = "") {
  let d = String(value).replace(/\D/g, "");
  if (d && !d.startsWith("55")) d = "55" + d;
  return d;
}

function tempClass(value) {
  return value === "Quente" ? "hot" : value === "Morno" ? "warm" : "cold";
}

function priorityClass(value) {
  return value === "Alta" ? "high" : value === "Média" ? "medium" : "low";
}

function gapText(lead) {
  const gaps = [];
  if (!lead.website) gaps.push("sem website");
  if (!lead.email) gaps.push("sem e-mail");
  if (!Object.values(lead.socials || {}).some(Boolean)) gaps.push("sem redes detectadas");
  return gaps.length ? gaps.join(" • ") : "presença digital detectada";
}

function updateCounters() {
  const favCount = Object.keys(state.favorites).length;
  $("#favCount").textContent = favCount;
  $("#planSearches").textContent = state.searches + " / 100";
  $("#planBar").style.width = Math.min(100, state.searches) + "%";
  $("#kpiSearches").textContent = state.searches;
}

async function health() {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    const data = await res.json();
    state.mode = data.provider || "mock";
    $("#providerDot").classList.add("ready");
    $("#providerLabel").textContent = state.mode === "live" ? "Dados reais conectados" : "Modo demonstração";
    $("#settingsProvider").textContent = state.mode === "live" ? "Outscraper / dados reais" : "Dados simulados";
    $("#settingsStatus").textContent = state.mode === "live" ? (data.liveReady ? "Conectado" : "Falta API key") : "Demo ativo";
  } catch {
    $("#providerLabel").textContent = "Servidor indisponível";
  }
}

function renderDashboard() {
  const fallback = [
    { keyword: "Clínica odontológica", city: "Campina Grande, PB", count: 20 },
    { keyword: "Barbearia", city: "João Pessoa, PB", count: 20 },
    { keyword: "Oficina mecânica", city: "Patos, PB", count: 20 },
    { keyword: "Academia", city: "Natal, RN", count: 20 }
  ];
  const rows = state.history.length ? state.history.slice(0, 4) : fallback;
  $("#recentSearches").innerHTML = rows.map(h =>
    '<div class="recent-item"><div class="recent-icon">⌕</div><div><strong>' + esc(h.keyword) +
    '</strong><span>' + esc(h.city) + ' • ' + (h.count || 20) +
    ' leads</span></div><button data-retry-key="' + esc(h.keyword) +
    '" data-retry-city="' + esc(h.city) + '">Repetir</button></div>'
  ).join("");

  $$("[data-retry-key]").forEach(btn => btn.onclick = () => {
    go("search");
    $("#keywordInput").value = btn.dataset.retryKey;
    $("#cityInput").value = btn.dataset.retryCity;
    performSearch();
  });

  const leads = state.leads.length
    ? [...state.leads].sort((a,b) => b.score - a.score).slice(0,4)
    : [
      {name:"Clínica Sorriso Prime", city:"Campina Grande, PB", score:95, temperature:"Quente"},
      {name:"Odonto Ideal", city:"Campina Grande, PB", score:90, temperature:"Quente"},
      {name:"Clínica Central", city:"Campina Grande, PB", score:85, temperature:"Quente"},
      {name:"Odontologia Boa Vista", city:"Campina Grande, PB", score:80, temperature:"Quente"}
    ];

  $("#recentLeads").innerHTML = leads.map(l =>
    '<div class="mini-lead"><div class="company-logo">' + esc(initials(l.name)) +
    '</div><div><strong>' + esc(l.name) + '</strong><span>' + esc(l.city || "") +
    ' • ' + esc(l.temperature || "") + '</span></div><div class="mini-score">' + Number(l.score || 0) + '</div></div>'
  ).join("");

  const hot = state.leads.filter(l => l.score >= 80).length;
  if (state.leads.length) {
    $("#kpiLeads").textContent = state.leads.length;
    $("#kpiHot").textContent = hot;
  }
}

function progressSequence() {
  const box = $("#searchProgress");
  const bar = $("#progressBar");
  const pct = $("#progressPct");
  const title = $("#progressTitle");
  const text = $("#progressText");
  box.classList.remove("hidden");
  const stages = [
    [18, "Localizando empresas…", "Consultando negócios por nicho e região."],
    [42, "Normalizando dados…", "Padronizando contatos e removendo ruído."],
    [68, "Analisando presença digital…", "Website, reputação e sinais comerciais."],
    [86, "Calculando oportunidades…", "Aplicando o Opportunity Engine."]
  ];
  let i = 0;
  const timer = setInterval(() => {
    if (i >= stages.length) return;
    const s = stages[i++];
    bar.style.width = s[0] + "%";
    pct.textContent = s[0] + "%";
    title.textContent = s[1];
    text.textContent = s[2];
  }, 230);
  return () => {
    clearInterval(timer);
    bar.style.width = "100%";
    pct.textContent = "100%";
    title.textContent = "Busca concluída";
    text.textContent = "Leads priorizados e prontos para abordagem.";
    setTimeout(() => box.classList.add("hidden"), 500);
  };
}

async function performSearch() {
  const keyword = $("#keywordInput").value.trim();
  const city = $("#cityInput").value.trim();
  if (!keyword || !city) return toast("Informe palavra-chave e cidade.");

  const btn = $("#searchBtn");
  btn.disabled = true;
  btn.querySelector("span").textContent = "Buscando…";
  $("#resultsBlock").classList.add("hidden");
  const finish = progressSequence();

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, city })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha na busca");

    state.leads = data.leads || [];
    state.lastQuery = { keyword, city };
    state.mode = data.mode || state.mode;
    state.searches += 1;
    state.history.unshift({ keyword, city, count: state.leads.length, mode: state.mode, at: new Date().toISOString() });
    state.history = state.history.filter((x, i, a) =>
      a.findIndex(y => y.keyword === x.keyword && y.city === x.city) === i
    ).slice(0,30);

    persist();
    renderResults();
    renderDashboard();
    finish();
    setTimeout(() => $("#resultsBlock").scrollIntoView({ behavior:"smooth", block:"start" }), 150);
  } catch (err) {
    finish();
    toast(err.message || "Erro na busca.");
  } finally {
    btn.disabled = false;
    btn.querySelector("span").textContent = "Buscar leads";
  }
}

function filteredLeads() {
  let list = [...state.leads];
  const q = $("#tableSearch").value.trim().toLowerCase();
  const filter = $("#opportunityFilter").value;
  const sort = $("#sortSelect").value;

  if (q) list = list.filter(l =>
    [l.name,l.address,l.phone,l.website,l.email].join(" ").toLowerCase().includes(q)
  );
  if (filter === "hot") list = list.filter(l => l.score >= 80);
  if (filter === "warm") list = list.filter(l => l.score >= 60 && l.score < 80);
  if (filter === "cold") list = list.filter(l => l.score < 60);
  if (filter === "no-site") list = list.filter(l => !l.website);

  if (sort === "score") list.sort((a,b) => b.score - a.score);
  if (sort === "rating") list.sort((a,b) => (b.rating||0) - (a.rating||0));
  if (sort === "reviews") list.sort((a,b) => (b.reviews||0) - (a.reviews||0));
  if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));
  return list;
}

function renderResults() {
  const leads = state.leads;
  $("#resultsBlock").classList.remove("hidden");
  $("#resultsTitle").textContent = leads.length + " oportunidades encontradas";
  $("#resultsLocation").textContent =
    state.lastQuery.keyword + " em " + state.lastQuery.city +
    " • fonte: " + (state.mode === "live" ? "dados reais" : "demonstração");

  $("#sumTotal").textContent = leads.length;
  $("#sumWebsite").textContent = leads.filter(l => l.website).length;
  $("#sumEmail").textContent = leads.filter(l => l.email).length;
  $("#sumPhone").textContent = leads.filter(l => l.phone).length;
  $("#sumHot").textContent = leads.filter(l => l.score >= 80).length;
  renderLeadTable();
}

function renderLeadTable() {
  const list = filteredLeads();
  $("#tableCount").textContent = list.length + " lead" + (list.length === 1 ? "" : "s");
  $("#leadTable").innerHTML = list.map(l => {
    const cls = tempClass(l.temperature);
    const fav = Boolean(state.favorites[l.id]);
    const contacted = Boolean(state.contacted[l.id]);
    return '<tr>' +
      '<td><div class="company-cell"><div class="company-logo">' + esc(initials(l.name)) +
      '</div><div><strong>' + esc(l.name) + '</strong><span>' + esc(l.address || l.category || "") +
      '</span></div></div></td>' +
      '<td class="phone-cell">' + esc(phoneLabel(l.phone)) + '</td>' +
      '<td>' + (l.website ? '<a class="site-link" href="' + esc(l.website) +
      '" target="_blank" rel="noreferrer">Abrir site ↗</a>' : '<span class="muted">Sem website</span>') + '</td>' +
      '<td><span class="rating"><b>★</b>' + esc(l.rating || "—") +
      (l.rating ? ' <small>(' + Number(l.reviews || 0) + ')</small>' : '') + '</span></td>' +
      '<td><div class="score"><strong>' + Number(l.score || 0) +
      '</strong><span class="score-bar"><i class="' + cls + '" style="width:' + Number(l.score || 0) + '%"></i></span></div></td>' +
      '<td><span class="pill ' + cls + '">' + esc(l.temperature) + '</span>' +
      (contacted ? '<span class="contacted">✓ abordado</span>' : '') + '</td>' +
      '<td><span class="priority ' + priorityClass(l.priority) + '">' + esc(l.priority) + '</span></td>' +
      '<td><div class="actions"><button class="action whatsapp" data-wa="' + esc(l.id) + '" title="WhatsApp">W</button>' +
      '<button class="action favorite ' + (fav ? "on" : "") + '" data-fav="' + esc(l.id) + '" title="Favoritar">' +
      (fav ? "★" : "☆") + '</button><button class="action" data-detail="' + esc(l.id) + '" title="Detalhes">⋯</button></div></td>' +
      '</tr>';
  }).join("") || '<tr><td colspan="8"><div class="empty">Nenhum lead corresponde aos filtros.</div></td></tr>';

  $$("[data-wa]").forEach(btn => btn.onclick = () => openWhatsApp(findLead(btn.dataset.wa)));
  $$("[data-fav]").forEach(btn => btn.onclick = () => toggleFavorite(findLead(btn.dataset.fav)));
  $$("[data-detail]").forEach(btn => btn.onclick = () => openDetail(findLead(btn.dataset.detail)));
}

function findLead(id) {
  return state.leads.find(l => String(l.id) === String(id)) || state.favorites[id];
}

function openWhatsApp(lead) {
  if (!lead || !lead.phone) return toast("Este lead não possui telefone.");
  state.contacted[lead.id] = true;
  persist();
  renderLeadTable();
  const gap = !lead.website ? "um site profissional" :
    (!Object.values(lead.socials || {}).some(Boolean) ? "uma presença digital mais forte" : "melhor conversão da presença online");
  const msg = "Olá! Encontrei a " + lead.name + " pesquisando empresas em " + (lead.city || "sua região") +
    ". Notei uma oportunidade relacionada a " + gap +
    ". Posso te mostrar uma demonstração rápida do que eu faria para vocês?";
  window.open("https://wa.me/" + waPhone(lead.phone) + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
}

function toggleFavorite(lead) {
  if (!lead) return;
  if (state.favorites[lead.id]) {
    delete state.favorites[lead.id];
    toast("Removido dos favoritos.");
  } else {
    state.favorites[lead.id] = lead;
    toast("Lead salvo nos favoritos.");
  }
  persist();
  renderLeadTable();
  if ($("#view-favorites").classList.contains("active")) renderFavorites();
}

function openDetail(lead) {
  if (!lead) return;
  const socials = Object.entries(lead.socials || {}).filter(([,v]) => v).map(([k]) => k).join(", ") || "Nenhuma detectada";
  const reasons = (lead.reasons || []).map(r =>
    '<div class="reason"><span>' + esc(r[1]) + '</span><b>' + esc(r[0]) + '</b></div>'
  ).join("") || '<div class="reason"><span>Score calculado pelo motor</span><b>' + Number(lead.score || 0) + '</b></div>';

  $("#modalContent").innerHTML =
    '<p class="eyebrow blue">OPORTUNIDADE • SCORE ' + Number(lead.score || 0) + '</p>' +
    '<h2>' + esc(lead.name) + '</h2><div class="modal-sub">' + esc(lead.address || lead.city || "") + '</div>' +
    '<div class="detail-grid">' +
      '<div class="detail"><span>Telefone</span><strong>' + esc(phoneLabel(lead.phone)) + '</strong></div>' +
      '<div class="detail"><span>Website</span><strong>' + esc(lead.website || "Não encontrado") + '</strong></div>' +
      '<div class="detail"><span>E-mail</span><strong>' + esc(lead.email || "Não encontrado") + '</strong></div>' +
      '<div class="detail"><span>Avaliação</span><strong>' + esc(lead.rating || "—") + ' ★ • ' + Number(lead.reviews || 0) + ' avaliações</strong></div>' +
      '<div class="detail"><span>Redes</span><strong>' + esc(socials) + '</strong></div>' +
      '<div class="detail"><span>Leitura</span><strong>' + esc(gapText(lead)) + '</strong></div>' +
    '</div><div class="score-explain"><h3>Por que recebeu ' + Number(lead.score || 0) + ' pontos</h3>' + reasons + '</div>' +
    '<div class="modal-actions"><button class="primary" id="modalWa">Abrir WhatsApp</button>' +
    (lead.website ? '<button class="secondary" id="modalEnrich">Enriquecer website</button>' : '') + '</div>';

  $("#modalBackdrop").classList.remove("hidden");
  $("#modalWa").onclick = () => openWhatsApp(lead);
  if ($("#modalEnrich")) $("#modalEnrich").onclick = () => enrichLead(lead);
}

async function enrichLead(lead) {
  const btn = $("#modalEnrich");
  btn.disabled = true;
  btn.textContent = "Analisando…";
  try {
    const res = await fetch("/api/enrich", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ website:lead.website, lead })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha no enriquecimento");
    lead.email = (data.emails && data.emails[0]) || lead.email;
    lead.socials = Object.assign({}, lead.socials || {}, data.socials || {});
    Object.assign(lead, data.scoring || {});
    if (state.favorites[lead.id]) state.favorites[lead.id] = lead;
    persist();
    renderResults();
    openDetail(lead);
    toast("Website enriquecido.");
  } catch (err) {
    toast(err.message || "Falha no enriquecimento.");
    btn.disabled = false;
    btn.textContent = "Enriquecer website";
  }
}

function renderHistory() {
  const el = $("#historyList");
  el.innerHTML = state.history.length ? state.history.map((h,i) =>
    '<div class="history-row"><div class="recent-icon">⌕</div><div><strong>' + esc(h.keyword) +
    '</strong><span>' + esc(h.city) + ' • ' + new Date(h.at || Date.now()).toLocaleString("pt-BR") +
    '</span></div><span class="history-badge">' + Number(h.count || 20) +
    ' leads</span><button class="secondary" data-history="' + i + '">Buscar novamente</button></div>'
  ).join("") : '<div class="empty">Faça sua primeira busca para criar o histórico.</div>';

  $$("[data-history]").forEach(btn => btn.onclick = () => {
    const h = state.history[Number(btn.dataset.history)];
    go("search");
    $("#keywordInput").value = h.keyword;
    $("#cityInput").value = h.city;
    performSearch();
  });
}

function renderFavorites() {
  const list = Object.values(state.favorites).sort((a,b) => b.score - a.score);
  $("#favoriteTable").innerHTML = list.length ? list.map(l =>
    '<tr><td><div class="company-cell"><div class="company-logo">' + esc(initials(l.name)) +
    '</div><div><strong>' + esc(l.name) + '</strong><span>' + esc(l.address || l.city || "") +
    '</span></div></div></td><td>' + esc(phoneLabel(l.phone)) + '</td><td>' + esc(gapText(l)) +
    '</td><td><strong>' + Number(l.score || 0) + '</strong> <span class="pill ' + tempClass(l.temperature) +
    '">' + esc(l.temperature) + '</span></td><td><div class="actions"><button class="action whatsapp" data-fav-wa="' +
    esc(l.id) + '">W</button><button class="action" data-fav-detail="' + esc(l.id) +
    '">⋯</button><button class="action favorite on" data-fav-remove="' + esc(l.id) +
    '">★</button></div></td></tr>'
  ).join("") : '<tr><td colspan="5"><div class="empty">Nenhum favorito ainda. Use ☆ na tabela de leads.</div></td></tr>';

  $$("[data-fav-wa]").forEach(b => b.onclick = () => openWhatsApp(state.favorites[b.dataset.favWa]));
  $$("[data-fav-detail]").forEach(b => b.onclick = () => openDetail(state.favorites[b.dataset.favDetail]));
  $$("[data-fav-remove]").forEach(b => b.onclick = () => toggleFavorite(state.favorites[b.dataset.favRemove]));
}

function csvEsc(v) {
  const s = String(v == null ? "" : v);
  return /[",\n;]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s;
}

function exportCsv() {
  if (!state.leads.length) return toast("Faça uma busca antes de exportar.");
  const cols = ["Nome","Categoria","Cidade","Endereço","Telefone","Website","Email","Rating","Avaliações","Score","Status","Prioridade"];
  const rows = state.leads.map(l => [l.name,l.category,l.city,l.address,l.phone,l.website,l.email,l.rating,l.reviews,l.score,l.temperature,l.priority]);
  const content = "\uFEFF" + [cols,...rows].map(r => r.map(csvEsc).join(";")).join("\n");
  const blob = new Blob([content], { type:"text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hunterx-leads.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV exportado.");
}

$$(".nav-item").forEach(btn => btn.onclick = () => go(btn.dataset.view));
$$("[data-go-search]").forEach(btn => btn.onclick = () => go("search"));
$$("[data-view-link]").forEach(btn => btn.onclick = () => go(btn.dataset.viewLink));
$$(".suggestions button").forEach(btn => btn.onclick = () => {
  $("#keywordInput").value = btn.textContent;
  $("#keywordInput").focus();
});
$("#mobileMenu").onclick = () => $(".sidebar").classList.toggle("open");
$("#searchBtn").onclick = performSearch;
$("#keywordInput").addEventListener("keydown", e => { if (e.key === "Enter") performSearch(); });
$("#cityInput").addEventListener("keydown", e => { if (e.key === "Enter") performSearch(); });
$("#tableSearch").oninput = renderLeadTable;
$("#opportunityFilter").onchange = renderLeadTable;
$("#sortSelect").onchange = renderLeadTable;
$("#exportBtn").onclick = exportCsv;
$("#saveSearchBtn").onclick = () => toast("Busca salva no histórico.");
$("#modalClose").onclick = () => $("#modalBackdrop").classList.add("hidden");
$("#modalBackdrop").onclick = e => { if (e.target === $("#modalBackdrop")) $("#modalBackdrop").classList.add("hidden"); };

updateCounters();
renderDashboard();
renderHistory();
renderFavorites();
health();
