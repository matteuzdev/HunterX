"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, Building2, Download, Filter, Flame, Globe2,
  Mail, Menu, MessageSquareText, Phone, Search, ShieldCheck, Sparkles,
  Target, UsersRound, WandSparkles, RefreshCw
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HistoryItem, Lead } from "@/lib/hunter/types";
import { Sidebar, type ViewName } from "@/components/sidebar";
import { MetricCard } from "@/components/metric-card";
import { LeadTable } from "@/components/lead-table";
import { LeadDetailDrawer } from "@/components/lead-detail-drawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  loadLatestSearchSnapshot,
  loadSearchHistorySnapshots,
  loadSearchSnapshotByQuery,
  makeQueryKey,
  saveSearchSnapshot,
} from "@/lib/hunter/persistence";

type RuntimeStatus = {
  ok: boolean;
  provider: string;
  liveReady: boolean;
  version: string;
};

function parse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function whatsapp(lead: Lead) {
  let phone = (lead.phone || "").replace(/\D/g, "");
  if (!phone) return;
  if (!phone.startsWith("55")) phone = "55" + phone;
  const gap = !lead.website
    ? "um site profissional"
    : !Object.values(lead.socials || {}).some(Boolean)
      ? "uma presença digital mais forte"
      : "melhor conversão da presença online";
  const message =
    "Olá! Encontrei a " + lead.name + " pesquisando empresas em " + lead.city +
    ". Notei uma oportunidade relacionada a " + gap +
    ". Posso te mostrar uma demonstração rápida do que eu faria para vocês?";
  window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
}

function exportCsv(leads: Lead[]) {
  if (!leads.length) return;
  const headers = ["Nome","Categoria","Cidade","Endereço","Telefone","Website","Email","Rating","Avaliações","Score","Temperatura","Prioridade"];
  const rows = leads.map((lead) => [
    lead.name, lead.category, lead.city, lead.address, lead.phone, lead.website,
    lead.email, lead.rating, lead.reviews, lead.score, lead.temperature, lead.priority
  ]);
  const esc = (value: unknown) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hunterx-leads.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function Dashboard({
  searches, leads, history, onSearch,
}: {
  searches: number;
  leads: Lead[];
  history: HistoryItem[];
  onSearch: () => void;
}) {
  const hot = leads.filter((lead) => lead.score >= 80).length;
  const noSite = leads.filter((lead) => !lead.website).length;
  const noEmail = leads.filter((lead) => !lead.email).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Central de prospecção</p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-slate-950 md:text-4xl">Seu radar comercial.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Encontre negócios com dor digital, entenda o motivo e priorize quem merece sua abordagem primeiro.
          </p>
        </div>
        <Button onClick={onSearch}><Search className="size-4" /> Nova busca <ArrowRight className="size-4" /></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Buscas realizadas" value={searches} helper="plano atual" icon={Search} />
        <MetricCard label="Leads carregados" value={leads.length} helper="resultado atual" icon={UsersRound} accent="emerald" />
        <MetricCard label="Oportunidades quentes" value={hot} helper="score ≥ 80" icon={Flame} accent="rose" />
        <MetricCard label="Média por busca" value="20" helper="empresas" icon={Target} accent="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_.85fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Oportunidades para atacar agora</h2>
              <p className="mt-1 text-xs text-slate-400">Problemas simples de demonstrar e monetizar.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onSearch}>Ver leads <ArrowRight className="size-3.5" /></Button>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {[
              [Globe2, "Empresas sem website", "Ótima porta de entrada para mockup demonstrativo.", noSite, "bg-rose-50 text-rose-600"],
              [Mail, "Contato digital incompleto", "Sem e-mail ou sinais claros de aquisição.", noEmail, "bg-amber-50 text-amber-600"],
              [Phone, "Score alto + telefone", "Dor identificada com canal direto disponível.", leads.filter((lead) => lead.score >= 80 && lead.phone).length, "bg-emerald-50 text-emerald-600"],
            ].map(([Icon, title, text, value, color]) => (
              <div key={String(title)} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-4">
                <span className={"grid size-10 place-items-center rounded-xl " + color}>
                  {createElement(Icon as LucideIcon, { className: "size-4" })}
                </span>
                <span>
                  <strong className="block text-xs text-slate-800">{String(title)}</strong>
                  <small className="mt-1 block text-[10px] leading-4 text-slate-400">{String(text)}</small>
                </span>
                <strong className="text-xl tracking-tight">{String(value)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold">Opportunity Engine</h2>
          <p className="mt-1 text-xs text-slate-400">Score explicável, não caixa-preta.</p>
          <div className="mx-auto mt-7 grid size-40 place-items-center rounded-full bg-[conic-gradient(#2563eb_0_58%,#60a5fa_58%_79%,#cbd5e1_79%)]">
            <div className="grid size-28 place-items-center rounded-full bg-white text-center">
              <span><strong className="block text-3xl font-black tracking-[-.05em]">0–100</strong><small className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">score</small></span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
            <span className="rounded-xl bg-rose-50 p-2 text-rose-700">Quente 80+</span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-700">Morno 60+</span>
            <span className="rounded-xl bg-slate-100 p-2 text-slate-600">Frio &lt;60</span>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold">Buscas recentes</h2>
          <p className="mt-1 text-xs text-slate-400">Memória de prospecção no workspace.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {(history.length ? history.slice(0,4) : [
            { keyword:"Clínica odontológica", city:"Campina Grande, PB", count:20, at:new Date().toISOString() },
            { keyword:"Barbearia", city:"João Pessoa, PB", count:20, at:new Date().toISOString() },
          ]).map((item, index) => (
            <div key={item.keyword + index} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Search className="size-4" /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.keyword}</strong><small className="mt-1 block truncate text-[10px] text-slate-400">{item.city}</small></span>
              <Badge className="bg-slate-100 text-slate-600">{item.count} leads</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function HunterXApp() {
  const [view, setView] = useState<ViewName>("dashboard");
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [favorites, setFavorites] = useState<Record<string, Lead>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searches, setSearches] = useState(7);
  const [keyword, setKeyword] = useState("Clínica odontológica");
  const [city, setCity] = useState("Campina Grande, PB");
  const [query, setQuery] = useState("");
  const [temperature, setTemperature] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchCache, setSearchCache] = useState<Record<string, Lead[]>>({});
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const localFavorites = parse<Record<string, Lead>>(localStorage.getItem("hunterx-favorites"), {});
    const localHistory = parse<HistoryItem[]>(localStorage.getItem("hunterx-history"), []);
    const localLeads = parse<Lead[]>(localStorage.getItem("hunterx-current-leads"), []);
    const localKeyword = localStorage.getItem("hunterx-current-keyword") || "Clínica odontológica";
    const localCity = localStorage.getItem("hunterx-current-city") || "Campina Grande, PB";
    const localCache = parse<Record<string, Lead[]>>(localStorage.getItem("hunterx-search-cache"), {});

    setFavorites(localFavorites);
    setHistory(localHistory);
    setSearches(Number(localStorage.getItem("hunterx-search-count") || localHistory.length || 0));
    setLeads(localLeads);
    setKeyword(localKeyword);
    setCity(localCity);
    setSearchCache(localCache);
    setHydrated(true);

    void Promise.all([
      loadSearchHistorySnapshots(),
      localLeads.length ? Promise.resolve(null) : loadLatestSearchSnapshot(),
    ]).then(([remoteHistory, latest]) => {
      if (remoteHistory.length) {
        setHistory((current) => {
          const merged = [...remoteHistory, ...current];
          const seen = new Set<string>();
          return merged.filter((item) => {
            const key = makeQueryKey(item.keyword, item.city);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).slice(0, 50);
        });
      }

      if (latest?.leads?.length) {
        const cacheKey = makeQueryKey(latest.keyword, latest.city);
        setLeads(latest.leads);
        setKeyword(latest.keyword);
        setCity(latest.city);
        setSearchCache((current) => ({ ...current, [cacheKey]: latest.leads }));
      }
    });

    fetch("/api/health", { cache: "no-store" }).then((r) => r.json()).then(setRuntime).catch(() => null);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hunterx-favorites", JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hunterx-history", JSON.stringify(history));
    localStorage.setItem("hunterx-search-count", String(searches));
  }, [history, searches, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hunterx-current-leads", JSON.stringify(leads));
  }, [leads, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hunterx-current-keyword", keyword);
    localStorage.setItem("hunterx-current-city", city);
  }, [keyword, city, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hunterx-search-cache", JSON.stringify(searchCache));
  }, [searchCache, hydrated]);

  const visibleLeads = useMemo(() => {
    const q = query.toLowerCase().trim();
    return [...leads]
      .filter((lead) => !q || [lead.name, lead.address, lead.phone, lead.website, lead.email].join(" ").toLowerCase().includes(q))
      .filter((lead) => temperature === "all" || lead.temperature.toLowerCase() === temperature)
      .sort((a,b) => b.score - a.score);
  }, [leads, query, temperature]);

  async function runSearch(forceRefresh = false) {
    if (!keyword.trim() || !city.trim()) return;
    setLoading(true);
    setError("");
    setNotice("");

    const cacheKey = makeQueryKey(keyword, city);

    try {
      if (!forceRefresh) {
        const local = searchCache[cacheKey];
        if (local?.length) {
          setLeads(local);
          setNotice("Resultado salvo aberto sem consumir uma nova busca da Apify.");
          setView("search");
          return;
        }

        const remote = await loadSearchSnapshotByQuery(keyword, city);
        if (remote?.leads?.length) {
          setLeads(remote.leads);
          setSearchCache((current) => ({ ...current, [cacheKey]: remote.leads }));
          setHistory((current) => [
            { keyword: remote.keyword, city: remote.city, count: remote.leads.length, mode: remote.mode, at: remote.createdAt },
            ...current.filter((item) => makeQueryKey(item.keyword, item.city) !== cacheKey),
          ].slice(0, 50));
          setNotice("Resultado recuperado do Supabase sem consumir uma nova busca da Apify.");
          setView("search");
          return;
        }
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, city }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha na busca");

      const freshLeads = (data.leads || []) as Lead[];
      setLeads(freshLeads);
      setSearchCache((current) => {
        const entries = Object.entries({ ...current, [cacheKey]: freshLeads });
        return Object.fromEntries(entries.slice(-50));
      });
      setSearches((value) => value + 1);

      const now = new Date().toISOString();
      setHistory((current) => [
        { keyword, city, count: freshLeads.length, mode: data.mode, at: now },
        ...current.filter((item) => makeQueryKey(item.keyword, item.city) !== cacheKey),
      ].slice(0, 50));

      const saved = await saveSearchSnapshot({
        keyword,
        city,
        mode: data.mode || "live",
        leads: freshLeads,
      });

      setNotice(saved
        ? "Nova busca realizada e salva no Supabase."
        : "Nova busca realizada. Cópia local salva; Supabase indisponível nesta sessão."
      );
      setView("search");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha na busca");
    } finally {
      setLoading(false);
    }
  }

  function toggleFavorite(lead: Lead) {
    setFavorites((current) => {
      const next = { ...current };
      if (next[lead.id]) delete next[lead.id];
      else next[lead.id] = lead;
      return next;
    });
  }

  async function reopenHistory(item: HistoryItem) {
    setKeyword(item.keyword);
    setCity(item.city);
    setError("");
    setNotice("");
    const cacheKey = makeQueryKey(item.keyword, item.city);

    const cached = searchCache[cacheKey];
    if (cached?.length) {
      setLeads(cached);
      setNotice("Busca histórica aberta do cache local. Zero crédito Apify consumido.");
      setView("search");
      return;
    }

    setLoading(true);
    const remote = await loadSearchSnapshotByQuery(item.keyword, item.city);
    setLoading(false);

    if (remote?.leads?.length) {
      setLeads(remote.leads);
      setSearchCache((current) => ({ ...current, [cacheKey]: remote.leads }));
      setNotice("Busca histórica recuperada do Supabase. Zero crédito Apify consumido.");
      setView("search");
      return;
    }

    setError("Os dados desta busca antiga não foram encontrados. Use Atualizar dados somente se quiser consumir uma nova busca da Apify.");
    setView("search");
  }

  const title: Record<ViewName, string> = {
    dashboard: "Visão geral",
    search: "Buscar leads",
    history: "Histórico",
    favorites: "Favoritos",
    messages: "Mensagens",
    settings: "Configurações",
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fc] text-slate-900">
      <Sidebar view={view} onChange={setView} favorites={Object.keys(favorites).length} searches={searches} />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-7">
          <div className="flex items-center gap-3">
            <button className="grid size-9 place-items-center rounded-xl border border-slate-200 lg:hidden"><Menu className="size-4" /></button>
            <span className="text-xs font-bold text-slate-700">{title[view]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 sm:flex">
              <span className={"size-1.5 rounded-full " + (runtime?.ok ? "bg-emerald-500" : "bg-slate-300")} />
              {runtime?.provider && runtime.provider !== "mock" ? `Dados reais • ${runtime.provider}` : "Modo demo"}
            </span>
            <Button size="sm" onClick={() => setView("search")}><Search className="size-3.5" /> Nova busca</Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1540px] p-4 md:p-7 xl:p-8">
          {view === "dashboard" && (
            <Dashboard searches={searches} leads={leads} history={history} onSearch={() => setView("search")} />
          )}

          {view === "search" && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Busca inteligente</p>
                <h1 className="text-3xl font-black tracking-[-.045em]">Encontre empresas. Priorize a dor.</h1>
                <p className="mt-2 text-sm text-slate-500">Nicho + cidade entram. O HunterX devolve empresas ordenadas por oportunidade.</p>
              </div>

              <Card className="p-4 md:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <label className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Palavra-chave</span>
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                      <Search className="size-4 text-slate-400" />
                      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">Cidade</span>
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                      <Building2 className="size-4 text-slate-400" />
                      <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </label>
                  <Button className="mt-auto" onClick={() => void runSearch(false)} disabled={loading}>
                    {loading ? <><WandSparkles className="size-4 animate-pulse" /> Carregando…</> : <><Search className="size-4" /> Buscar / abrir salvo <ArrowRight className="size-4" /></>}
                  </Button>
                </div>
                {notice && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{notice}</div>}
                {error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</div>}
              </Card>

              {!!leads.length && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                      ["Total", leads.length, UsersRound, "bg-blue-50 text-blue-600"],
                      ["Com website", leads.filter((l) => l.website).length, Globe2, "bg-indigo-50 text-indigo-600"],
                      ["Com e-mail", leads.filter((l) => l.email).length, Mail, "bg-violet-50 text-violet-600"],
                      ["Com telefone", leads.filter((l) => l.phone).length, Phone, "bg-emerald-50 text-emerald-600"],
                      ["Quentes", leads.filter((l) => l.score >= 80).length, Flame, "bg-rose-50 text-rose-600"],
                    ].map(([label,value,Icon,color]) => (
                      <Card key={String(label)} className="flex items-center gap-3 p-4">
                        <span className={"grid size-9 place-items-center rounded-xl " + color}>{createElement(Icon as LucideIcon, { className: "size-4" })}</span>
                        <span><strong className="block text-xl font-black tracking-tight">{String(value)}</strong><small className="text-[10px] font-semibold text-slate-400">{String(label)}</small></span>
                      </Card>
                    ))}
                  </div>

                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="flex flex-1 gap-2">
                      <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 md:max-w-sm">
                        <Search className="size-3.5 text-slate-400" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nesta lista…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
                      </div>
                      <div className="relative">
                        <Filter className="pointer-events-none absolute left-3 top-3 size-3.5 text-slate-400" />
                        <select value={temperature} onChange={(e) => setTemperature(e.target.value)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none">
                          <option value="all">Todos</option><option value="quente">Quentes</option><option value="morno">Mornos</option><option value="frio">Frios</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => void runSearch(true)} disabled={loading}>
                        <RefreshCw className="size-3.5" /> Atualizar dados
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => exportCsv(leads)}><Download className="size-3.5" /> Exportar CSV</Button>
                    </div>
                  </div>

                  <LeadTable leads={visibleLeads} favorites={favorites} onFavorite={toggleFavorite} onWhatsApp={whatsapp} onDetails={setSelectedLead} />
                </>
              )}

              {!leads.length && !loading && (
                <Card className="grid min-h-[280px] place-items-center p-8 text-center">
                  <div>
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Sparkles className="size-6" /></span>
                    <h3 className="mt-4 text-sm font-bold">Pronto para caçar oportunidades</h3>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">Faça uma busca para trazer até 20 empresas, calcular o score e ordenar quem merece atenção primeiro.</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {view === "history" && (
            <section className="space-y-5">
              <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Memória comercial</p><h1 className="text-3xl font-black tracking-[-.045em]">Histórico</h1></div>
              <Card className="divide-y divide-slate-100 p-2">
                {history.length ? history.map((item,index) => (
                  <button key={makeQueryKey(item.keyword, item.city) + index} onClick={() => void reopenHistory(item)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Search className="size-4" /></span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.keyword}</strong><small className="mt-1 block text-[10px] text-slate-400">{item.city} • {new Date(item.at).toLocaleString("pt-BR")}</small></span>
                    <Badge className="bg-slate-100 text-slate-600">{item.count} leads</Badge>
                  </button>
                )) : <div className="p-12 text-center text-sm text-slate-400">Nenhuma busca ainda.</div>}
              </Card>
            </section>
          )}

          {view === "favorites" && (
            <section className="space-y-5">
              <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Carteira</p><h1 className="text-3xl font-black tracking-[-.045em]">Favoritos</h1></div>
              <LeadTable leads={Object.values(favorites)} favorites={favorites} onFavorite={toggleFavorite} onWhatsApp={whatsapp} onDetails={setSelectedLead} />
            </section>
          )}

          {view === "messages" && (
            <section className="space-y-5">
              <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Abordagem</p><h1 className="text-3xl font-black tracking-[-.045em]">Mensagens</h1></div>
              <div className="grid gap-4 xl:grid-cols-3">
                {[
                  ["Sem website","Demonstração visual","Encontrei sua empresa no Google e percebi uma oportunidade simples de melhorar como vocês aparecem online."],
                  ["Presença fraca","Diagnóstico local","Analisei rapidamente como sua empresa aparece para quem procura seu serviço na cidade e encontrei alguns pontos claros."],
                  ["Reputação forte","Converter reputação","Vocês já têm boas avaliações. A oportunidade é fazer essa reputação trabalhar melhor para gerar contatos e pedidos."],
                ].map(([tag,heading,text]) => (
                  <Card key={tag} className="p-5">
                    <Badge className="bg-blue-50 text-blue-700">{tag}</Badge>
                    <h3 className="mt-4 text-sm font-bold">{heading}</h3>
                    <p className="mt-3 text-xs leading-6 text-slate-500">“{text}”</p>
                    <Button variant="secondary" size="sm" className="mt-5"><MessageSquareText className="size-3.5" /> Usar template</Button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {view === "settings" && (
            <section className="space-y-5">
              <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Sistema</p><h1 className="text-3xl font-black tracking-[-.045em]">Configurações</h1></div>
              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="p-5">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Activity className="size-4" /></span><div><h2 className="text-sm font-bold">Motor de dados</h2><p className="text-xs text-slate-400">Status do backend.</p></div></div>
                  <div className="mt-5 divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-3"><span className="text-slate-500">Provider</span><strong>{runtime?.provider === "apify" ? "Apify • Google Maps" : runtime?.provider === "outscraper" || runtime?.provider === "live" ? "Outscraper" : "Mock / demo"}</strong></div>
                    <div className="flex justify-between py-3"><span className="text-slate-500">Status</span><Badge className="bg-emerald-50 text-emerald-700">{runtime?.ok ? "Online" : "Verificando"}</Badge></div>
                    <div className="flex justify-between py-3"><span className="text-slate-500">Versão</span><strong>{runtime?.version || "0.3.0"}</strong></div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><ShieldCheck className="size-4" /></span><div><h2 className="text-sm font-bold">Arquitetura SaaS</h2><p className="text-xs text-slate-400">Base pronta para persistência.</p></div></div>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                    {["Next.js App Router","TypeScript strict","Tailwind CSS 4","Supabase SSR","Route Handlers","Vercel nativo"].map((item) => <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-3">{item}</div>)}
                  </div>
                </Card>
              </div>
            </section>
          )}
        </div>
      </main>

      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onWhatsApp={whatsapp}
      />
    </div>
  );
}
