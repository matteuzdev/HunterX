"use client";

import { useState } from "react";
import { BarChart3, Crosshair, Database, Workflow } from "lucide-react";

const tabs = [
  {
    id: "discover",
    label: "Descobrir",
    icon: Database,
    title: "Sua própria camada de inteligência comercial.",
    text: "O Hunter Engine consulta o diretório interno primeiro e usa fallback somente quando precisa completar o lote. A mesma empresa pode ser reaproveitada sem redescoberta desnecessária.",
    metric: "20",
    metricLabel: "empresas por bloco",
  },
  {
    id: "qualify",
    label: "Qualificar",
    icon: Crosshair,
    title: "Opportunity Score com motivo, não um número mágico.",
    text: "Website, contato, reputação e presença digital viram sinais explicáveis para colocar as melhores oportunidades no topo da lista.",
    metric: "0–100",
    metricLabel: "score explicável",
  },
  {
    id: "operate",
    label: "Operar",
    icon: Workflow,
    title: "Histórico, CRM e WhatsApp no mesmo fluxo.",
    text: "Uma busca vira ativo comercial: você reabre sem novo consumo, evita empresas duplicadas e acompanha cada lead até contato, negociação ou cliente.",
    metric: "8",
    metricLabel: "estágios de pipeline",
  },
  {
    id: "focus",
    label: "Medir",
    icon: BarChart3,
    title: "Meta diária, Focus e inteligência de segmentos.",
    text: "Defina 100, 200 ou mais empresas por dia e execute em blocos de 20. O HunterX mede progresso real e compara segmentos com os dados que você já coletou.",
    metric: "20×",
    metricLabel: "execução em blocos",
  },
] as const;

export function LandingProductTabs() {
  const [active, setActive] = useState(0);
  const current = tabs[active];
  const Icon = current.icon;

  return (
    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#091426] shadow-[0_35px_100px_rgba(0,0,0,.3)]">
      <div className="flex gap-1 overflow-x-auto border-b border-white/[.07] p-2">
        {tabs.map((tab, index) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(index)}
              className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition ${active === index ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/[.05] hover:text-white"}`}
            >
              <TabIcon className="size-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-[1.35fr_.65fr] md:p-9">
        <div>
          <span className="grid size-11 place-items-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
            <Icon className="size-5" />
          </span>
          <h3 className="mt-6 max-w-xl text-2xl font-black tracking-[-.04em] text-white md:text-3xl">{current.title}</h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">{current.text}</p>
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-3xl border border-white/[.08] bg-white/[.035] p-6">
            <strong className="block text-5xl font-black tracking-[-.07em] text-white">{current.metric}</strong>
            <span className="mt-2 block text-[10px] font-black uppercase tracking-[.16em] text-blue-300">{current.metricLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
