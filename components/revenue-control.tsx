"use client";

import { ArrowRight, Bot, Target, Zap } from "lucide-react";
import type { LeadCrmRecord } from "@/lib/hunter/types";
import { rankRevenueQueue } from "@/lib/hunter/revenue-engine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RevenueControl({ records }: { records: LeadCrmRecord[] }) {
  const queue = rankRevenueQueue(records).slice(0, 5);
  const top = queue[0];

  return (
    <section className="space-y-4">
      <Card className="overflow-hidden border-slate-200 p-0">
        <div className="grid gap-0 xl:grid-cols-[1.25fr_.75fr]">
          <div className="p-5 md:p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-600">
              <Zap className="size-3.5" /> Revenue Loop
            </div>
            {top ? (
              <>
                <h2 className="text-2xl font-black tracking-[-.04em] text-slate-950">
                  {top.action.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {top.record.lead.name} · {top.record.lead.city}. {top.action.rationale}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-blue-50 text-blue-700">
                    {top.strategy.label}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700">
                    score {top.record.lead.score}
                  </Badge>
                  {top.action.requiresApproval && (
                    <Badge className="bg-amber-50 text-amber-700">aprovação humana</Badge>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black">Alimente o loop com leads</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Faça uma busca no HunterX. O sistema prioriza a próxima ação automaticamente.
                </p>
              </>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Bot className="size-4 text-violet-600" /> Estratégia padrão atual
            </div>
            <strong className="mt-3 block text-lg tracking-tight text-slate-950">
              Proof-led + consultiva
            </strong>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Prova primeiro, diagnóstico depois e reunião apenas quando ela aumenta a chance de fechar.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Target className="size-4 text-blue-600" /> Próximas ações
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Fila calculada por estágio, urgência e Opportunity Score.
            </p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {queue.map(({ record, action, strategy }) => (
            <div key={record.leadKey} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <strong className="block text-xs text-slate-800">{record.lead.name}</strong>
                <small className="mt-1 block text-[10px] text-slate-400">
                  {action.title} · {strategy.label}
                </small>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-100 text-slate-600">{record.status}</Badge>
                <ArrowRight className="size-3.5 text-slate-300" />
              </div>
            </div>
          ))}
          {!queue.length && <div className="py-8 text-center text-xs text-slate-400">Sem leads na fila.</div>}
        </div>
      </Card>
    </section>
  );
}
