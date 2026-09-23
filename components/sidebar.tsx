"use client";

import {
  Clock3, Coins, Command, CreditCard, Crosshair, FileSpreadsheet, Gauge,
  Heart, MessageSquareText, Search, Settings2, Sparkles, Workflow, BarChart3, Crown,
  Bot, Play, Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewName =
  | "dashboard"
  | "focus"
  | "search"
  | "history"
  | "history-detail"
  | "pipeline"
  | "segments"
  | "favorites"
  | "exports"
  | "tokens"
  | "messages"
  | "inbox"
  | "flows"
  | "agent-studio"
  | "agent-playground"
  | "settings";

const items = [
  { id: "dashboard" as const, label: "Visão geral", icon: Gauge },
  { id: "search" as const, label: "Buscar leads", icon: Search },
  { id: "pipeline" as const, label: "Pipeline", icon: Workflow },
  { id: "inbox" as const, label: "Mensagens", icon: MessageSquareText },
  { id: "flows" as const, label: "Automações", icon: Sparkles },
  { id: "agent-studio" as const, label: "Agentes de IA", icon: Bot },
  { id: "agent-playground" as const, label: "Simulador de IA", icon: Play },
  { id: "focus" as const, label: "Focus", icon: Crosshair },
  { id: "segments" as const, label: "Segmentos", icon: BarChart3 },
  { id: "history" as const, label: "Histórico", icon: Clock3 },
  { id: "favorites" as const, label: "Favoritos", icon: Heart },
  { id: "exports" as const, label: "Exportações", icon: FileSpreadsheet },
  { id: "tokens" as const, label: "Tokens", icon: Coins },
];



export function Sidebar({
  view,
  onChange,
  favorites,
  exportsCount = 0,
  tokens = 0,
  unlimitedTokens = false,
  planName = "Free",
}: {
  view: ViewName;
  onChange: (view: ViewName) => void;
  favorites: number;
  exportsCount?: number;
  tokens?: number;
  unlimitedTokens?: boolean;
  planName?: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[270px] shrink-0 self-start overflow-y-auto border-r border-white/5 bg-[#0b1120] p-4 text-slate-300 lg:flex lg:flex-col">
      <button className="mb-5 flex items-center gap-3 rounded-2xl px-2 py-2 text-left" onClick={() => onChange("dashboard")}>
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-950/30">
          <Command className="size-5" strokeWidth={2.4} />
        </span>
        <span><strong className="block text-[17px] tracking-tight text-white">HunterX</strong><small className="block text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Lead intelligence</small></span>
      </button>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id)} className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
              active ? "bg-white/[.08] text-white shadow-inner shadow-white/[.03]" : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200",
            )}>
              <Icon className="size-4" /><span>{item.label}</span>
              {item.id === "favorites" && favorites > 0 && <span className="ml-auto rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">{favorites}</span>}
              {item.id === "exports" && exportsCount > 0 && <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{exportsCount}</span>}
              {item.id === "tokens" && <span className="ml-auto rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black text-amber-200">{unlimitedTokens ? "∞" : tokens}</span>}
            </button>
          );
        })}
        <div className="my-3 h-px bg-white/[.06]" />
        <button onClick={() => onChange("settings")} className={cn(
          "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
          view === "settings" ? "bg-white/[.08] text-white" : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200",
        )}><Settings2 className="size-4" /> Configurações</button>
      </nav>

      <div className="mt-auto rounded-2xl border border-white/[.08] bg-white/[.04] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] ${unlimitedTokens ? "text-violet-300" : "text-amber-300"}`}>
            {unlimitedTokens ? <Crown className="size-3.5" /> : <Coins className="size-3.5" />}
            {unlimitedTokens ? "OWNER" : planName}
          </span>
          <CreditCard className="size-4 text-slate-500" />
        </div>

        {unlimitedTokens ? (
          <>
            <strong className="block text-xl font-black text-white">ILIMITADO</strong>
            <div className="mt-1 text-[10px] leading-4 text-slate-500">Sem débito de tokens no engine.</div>
          </>
        ) : (
          <>
            <div className="flex items-end justify-between"><span className="text-xs text-slate-400">Tokens disponíveis</span><strong className="text-lg text-white">{tokens}</strong></div>
            <div className="mt-2 text-[10px] text-slate-500">≈ {Math.floor(tokens / 20)} lotes de 20 empresas</div>
            <button onClick={() => onChange("tokens")} className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/[.08] text-xs font-semibold text-slate-300 hover:bg-white/[.04]">
              <Sparkles className="size-3.5" /> Comprar tokens
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
