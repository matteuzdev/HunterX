"use client";

import { ArrowRight, Building2 } from "lucide-react";
import type { LeadCrmRecord, LeadStage } from "@/lib/hunter/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stages: Array<{id: LeadStage; label: string}> = [
  { id: "novo", label: "Novos" },
  { id: "analisado", label: "Analisados" },
  { id: "demonstracao", label: "Demonstração" },
  { id: "contatado", label: "Contatados" },
  { id: "respondeu", label: "Respondeu" },
  { id: "negociacao", label: "Negociação" },
  { id: "cliente", label: "Clientes" },
  { id: "perdido", label: "Perdidos" },
];

export function PipelineView({
  records,
  onOpen,
}: {
  records: LeadCrmRecord[];
  onOpen: (record: LeadCrmRecord) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">CRM de prospecção</p>
        <h1 className="text-3xl font-black tracking-[-.045em]">Pipeline</h1>
        <p className="mt-2 text-sm text-slate-500">Um lead por empresa. Veja onde cada oportunidade está e evite abordagem duplicada.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {stages.map((stage) => {
          const list = records.filter((record) => record.status === stage.id);
          return (
            <Card key={stage.id} className="min-h-[230px] p-4">
              <div className="mb-3 flex items-center justify-between">
                <strong className="text-xs text-slate-800">{stage.label}</strong>
                <Badge className="bg-slate-100 text-slate-600">{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.slice(0, 5).map((record) => (
                  <button
                    key={record.leadKey}
                    onClick={() => onOpen(record)}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[11px] text-slate-800">{record.lead.name}</strong>
                        <small className="mt-1 block truncate text-[10px] text-slate-400">
                          {record.lead.city} • score {record.lead.score}
                        </small>
                        {record.seenCount > 1 && (
                          <small className="mt-1 block text-[9px] font-bold text-amber-600">Visto em {record.seenCount} buscas</small>
                        )}
                      </span>
                      <ArrowRight className="size-3.5 text-slate-300" />
                    </div>
                  </button>
                ))}
                {!list.length && <div className="py-8 text-center text-[10px] text-slate-300">Nenhum lead aqui.</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
