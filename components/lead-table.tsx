"use client";

import { ExternalLink, Heart, MoreHorizontal, PhoneCall } from "lucide-react";
import type { Lead, LeadCrmRecord } from "@/lib/hunter/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function temperatureClass(value: Lead["temperature"]) {
  if (value === "Quente") return "bg-rose-50 text-rose-700";
  if (value === "Morno") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function priorityClass(value: Lead["priority"]) {
  if (value === "Alta") return "text-rose-600";
  if (value === "Média") return "text-amber-600";
  return "text-slate-500";
}

export function LeadTable({
  leads,
  favorites,
  onFavorite,
  onWhatsApp,
  onDetails,
  crmRecords = {},
}: {
  leads: Lead[];
  favorites: Record<string, Lead>;
  onFavorite: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  onDetails: (lead: Lead) => void;
  crmRecords?: Record<string, LeadCrmRecord>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-[.08em] text-slate-500">
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Reputação</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Temperatura</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 text-xs transition last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                      {lead.name.split(/\s+/).slice(0,2).map(x => x[0]).join("").toUpperCase()}
                    </span>
                    <span>
                      <strong className="block max-w-[240px] truncate text-[12px] text-slate-900">{lead.name}</strong>
                      <small className="mt-1 block max-w-[240px] truncate text-[10px] text-slate-400">{lead.address || lead.category}</small>
                      {crmRecords[`${lead.source}:${lead.id}`] && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          <Badge className="bg-blue-50 text-[9px] text-blue-700">{crmRecords[`${lead.source}:${lead.id}`].status}</Badge>
                          {crmRecords[`${lead.source}:${lead.id}`].seenCount > 1 && (
                            <Badge className="bg-amber-50 text-[9px] text-amber-700">visto {crmRecords[`${lead.source}:${lead.id}`].seenCount}x</Badge>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-slate-600">{lead.phone || "—"}</td>
                <td className="px-4 py-4">
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
                      Abrir <ExternalLink className="size-3" />
                    </a>
                  ) : <span className="text-slate-400">Sem website</span>}
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-slate-800">{lead.rating || "—"}</span>
                  <small className="ml-1 text-slate-400">({lead.reviews})</small>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <strong className="w-7 text-sm text-slate-950">{lead.score}</strong>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${lead.score}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4"><Badge className={temperatureClass(lead.temperature)}>{lead.temperature}</Badge></td>
                <td className={`px-4 py-4 text-[11px] font-bold ${priorityClass(lead.priority)}`}>{lead.priority}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="secondary" size="icon" onClick={() => onWhatsApp(lead)} title="WhatsApp"><PhoneCall className="size-3.5" /></Button>
                    <Button variant="secondary" size="icon" onClick={() => onFavorite(lead)} title="Favoritar">
                      <Heart className={`size-3.5 ${favorites[lead.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" title="Detalhes" onClick={() => onDetails(lead)}><MoreHorizontal className="size-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!leads.length && <div className="p-12 text-center text-sm text-slate-400">Nenhum lead corresponde aos filtros.</div>}
    </div>
  );
}
