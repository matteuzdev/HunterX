"use client";

import { BarChart3, Globe2, Phone, Flame, Star } from "lucide-react";
import type { SegmentInsight } from "@/lib/hunter/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SegmentIntelligenceView({ insights }: { insights: SegmentInsight[] }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Decisão por dados</p>
        <h1 className="text-3xl font-black tracking-[-.045em]">Inteligência de segmentos</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Compara os nichos usando somente buscas que você já pagou. Nenhuma consulta nova à Apify é feita aqui.
        </p>
      </div>

      {!insights.length ? (
        <Card className="grid min-h-[260px] place-items-center p-8 text-center">
          <div>
            <BarChart3 className="mx-auto size-7 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold">Ainda não há dados suficientes</h3>
            <p className="mt-2 text-xs text-slate-400">Faça buscas reais e o HunterX começa a comparar os segmentos automaticamente.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {insights.map((item) => (
            <Card key={item.keyword} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900">{item.keyword}</h2>
                  <p className="mt-1 text-[10px] text-slate-400">{item.searches} buscas • {item.cities} cidades • {item.uniqueLeads} leads únicos</p>
                </div>
                <Badge className={item.avgScore >= 80 ? "bg-rose-50 text-rose-700" : item.avgScore >= 60 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}>
                  score médio {item.avgScore}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <Globe2 className="size-4 text-blue-600" />
                  <strong className="mt-2 block text-lg">{item.noWebsiteRate}%</strong>
                  <small className="text-[9px] text-slate-400">sem website</small>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <Phone className="size-4 text-emerald-600" />
                  <strong className="mt-2 block text-lg">{item.phoneRate}%</strong>
                  <small className="text-[9px] text-slate-400">com telefone</small>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <Flame className="size-4 text-rose-600" />
                  <strong className="mt-2 block text-lg">{item.hotRate}%</strong>
                  <small className="text-[9px] text-slate-400">score 80+</small>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <Star className="size-4 text-amber-500" />
                  <strong className="mt-2 block text-lg">{item.avgRating || "—"}</strong>
                  <small className="text-[9px] text-slate-400">rating médio</small>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
