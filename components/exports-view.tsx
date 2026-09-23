"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import type { ExportLog } from "@/lib/hunter/exports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ExportsView({ logs }: { logs: ExportLog[] }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-600">Arquivos gerados</p>
        <h1 className="text-3xl font-black tracking-[-.045em]">Exportações</h1>
        <p className="mt-2 text-sm text-slate-500">Registro das listas exportadas do seu workspace.</p>
      </div>

      <Card className="divide-y divide-slate-100 p-2">
        {logs.length ? logs.map((log) => (
          <div key={log.id} className="flex items-center gap-3 rounded-xl p-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs text-slate-800">{log.keyword || "Lista exportada"}</strong>
              <small className="mt-1 block truncate text-[10px] text-slate-400">{log.city} • {new Date(log.createdAt).toLocaleString("pt-BR")}</small>
            </span>
            <Badge className="bg-slate-100 text-slate-600">{log.leadCount} leads</Badge>
            <Download className="size-4 text-slate-300" />
          </div>
        )) : (
          <div className="p-12 text-center">
            <FileSpreadsheet className="mx-auto size-7 text-slate-300" />
            <p className="mt-3 text-sm font-bold">Nenhuma exportação registrada</p>
            <p className="mt-2 text-xs text-slate-400">Quando você exportar uma busca em CSV, ela aparece aqui.</p>
          </div>
        )}
      </Card>
    </section>
  );
}
