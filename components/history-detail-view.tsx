"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, Filter, MessageCircle, Search, Sparkles } from "lucide-react";
import type { HistoryItem, Lead, LeadCrmRecord } from "@/lib/hunter/types";
import { LeadTable } from "@/components/lead-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type FilterMode = "best" | "all" | "no-site" | "phone" | "uncontacted";

export function HistoryDetailView({
  item,
  leads,
  favorites,
  crmRecords,
  onBack,
  onFavorite,
  onWhatsApp,
  onDetails,
  onExport,
  onBulkWhatsApp,
}: {
  item: HistoryItem;
  leads: Lead[];
  favorites: Record<string, Lead>;
  crmRecords: Record<string, LeadCrmRecord>;
  onBack: () => void;
  onFavorite: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  onDetails: (lead: Lead) => void;
  onExport: (leads: Lead[]) => void;
  onBulkWhatsApp: (leads: Lead[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("best");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return [...leads]
      .filter((lead) => !q || [lead.name, lead.phone, lead.website, lead.address, lead.category].join(" ").toLowerCase().includes(q))
      .filter((lead) => {
        if (mode === "best") return lead.score >= 80;
        if (mode === "no-site") return !lead.website;
        if (mode === "phone") return Boolean(lead.phone);
        if (mode === "uncontacted") {
          const crm = crmRecords[`${lead.source}:${lead.id}`];
          return !crm || ["novo","analisado","demonstracao"].includes(crm.status);
        }
        return true;
      })
      .sort((a,b) => b.score - a.score);
  }, [leads, query, mode, crmRecords]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="flex items-start gap-3">
          <Button variant="secondary" size="icon" onClick={onBack}><ArrowLeft className="size-4" /></Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-blue-600">Busca salva</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-.04em] text-slate-950">{item.keyword} em {item.city}</h1>
            <p className="mt-1 text-[11px] text-slate-400">{new Date(item.at).toLocaleString("pt-BR")} • {leads.length} leads preservados</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onExport(filtered)}><Download className="size-4" /> Exportar CSV</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onBulkWhatsApp(filtered)}>
            <MessageCircle className="size-4" /> Campanha WhatsApp
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 lg:max-w-sm">
              <Search className="size-3.5 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar nos resultados..." className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-3 size-3.5 text-slate-400" />
              <select value={mode} onChange={(e) => setMode(e.target.value as FilterMode)} className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-bold text-slate-600 outline-none">
                <option value="best">Melhores oportunidades</option>
                <option value="all">Todos os leads</option>
                <option value="no-site">Sem website</option>
                <option value="phone">Com telefone</option>
                <option value="uncontacted">Ainda não contatados</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Sparkles className="size-3.5 text-blue-500" />
            <span>{filtered.length} resultados nesta visão</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge className="bg-slate-100 text-slate-600">{leads.filter((lead) => lead.score >= 80).length} score 80+</Badge>
        <Badge className="bg-slate-100 text-slate-600">{leads.filter((lead) => !lead.website).length} sem website</Badge>
        <Badge className="bg-slate-100 text-slate-600">{leads.filter((lead) => lead.phone).length} com telefone</Badge>
      </div>

      <LeadTable
        leads={filtered}
        favorites={favorites}
        crmRecords={crmRecords}
        onFavorite={onFavorite}
        onWhatsApp={onWhatsApp}
        onDetails={onDetails}
      />
    </section>
  );
}
