"use client";

import {
  BellRing,
  Clock3,
  Command,
  CreditCard,
  Gauge,
  Heart,
  MessageSquareText,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewName = "dashboard" | "search" | "history" | "favorites" | "messages" | "settings";

const items = [
  { id: "dashboard" as const, label: "Visão geral", icon: Gauge },
  { id: "search" as const, label: "Buscar leads", icon: Search },
  { id: "history" as const, label: "Histórico", icon: Clock3 },
  { id: "favorites" as const, label: "Favoritos", icon: Heart },
  { id: "messages" as const, label: "Mensagens", icon: MessageSquareText },
];

export function Sidebar({
  view,
  onChange,
  favorites,
  searches,
}: {
  view: ViewName;
  onChange: (view: ViewName) => void;
  favorites: number;
  searches: number;
}) {
  return (
    <aside className="hidden h-screen w-[270px] shrink-0 border-r border-white/5 bg-[#0b1120] p-4 text-slate-300 lg:flex lg:flex-col">
      <button className="mb-5 flex items-center gap-3 rounded-2xl px-2 py-2 text-left" onClick={() => onChange("dashboard")}>
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-950/30">
          <Command className="size-5" strokeWidth={2.4} />
        </span>
        <span>
          <strong className="block text-[17px] tracking-tight text-white">HunterX</strong>
          <small className="block text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Lead intelligence</small>
        </span>
      </button>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active ? "bg-white/[.08] text-white shadow-inner shadow-white/[.03]" : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              {item.id === "favorites" && favorites > 0 && (
                <span className="ml-auto rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">{favorites}</span>
              )}
            </button>
          );
        })}
        <div className="my-3 h-px bg-white/[.06]" />
        <button
          onClick={() => onChange("settings")}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
            view === "settings" ? "bg-white/[.08] text-white" : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200",
          )}
        >
          <Settings2 className="size-4" /> Configurações
        </button>
      </nav>

      <div className="mt-auto rounded-2xl border border-white/[.08] bg-white/[.04] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-blue-300">
            <Sparkles className="size-3.5" /> Plano Pro
          </span>
          <CreditCard className="size-4 text-slate-500" />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-slate-400">Buscas usadas</span>
          <strong className="text-sm text-white">{searches}/100</strong>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.08]">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.min(100, searches)}%` }} />
        </div>
        <button className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/[.08] text-xs font-semibold text-slate-300 hover:bg-white/[.04]">
          <BellRing className="size-3.5" /> Gerenciar plano
        </button>
      </div>
    </aside>
  );
}
