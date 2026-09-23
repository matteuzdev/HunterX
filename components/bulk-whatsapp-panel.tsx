"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, MessageCircle, Phone, X } from "lucide-react";
import type { Lead } from "@/lib/hunter/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function normalizePhone(phone: string) {
  let value = phone.replace(/\D/g, "");
  if (!value) return "";
  if (!value.startsWith("55")) value = "55" + value;
  return value;
}

export function BulkWhatsAppPanel({
  open,
  leads,
  onClose,
  onContacted,
}: {
  open: boolean;
  leads: Lead[];
  onClose: () => void;
  onContacted: (lead: Lead) => void;
}) {
  const eligible = useMemo(() => leads.filter((lead) => Boolean(normalizePhone(lead.phone))), [leads]);
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const current = eligible[index];
  const done = Object.keys(completed).length;

  function openCurrent() {
    if (!current) return;
    const phone = normalizePhone(current.phone);
    const gap = !current.website
      ? "um site profissional"
      : !Object.values(current.socials || {}).some(Boolean)
        ? "uma presença digital mais forte"
        : "melhor conversão da presença online";
    const message =
      "Olá! Encontrei a " + current.name + " pesquisando empresas em " + current.city +
      ". Notei uma oportunidade relacionada a " + gap +
      ". Posso te mostrar uma demonstração rápida do que eu faria para vocês?";
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    setCompleted((state) => ({ ...state, [current.id]: true }));
    onContacted(current);
  }

  function next() {
    if (index < eligible.length - 1) setIndex((value) => value + 1);
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-600">Fila de prospecção</p>
            <h2 className="mt-1 text-lg font-black tracking-tight">Campanha WhatsApp</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">{eligible.length} leads com telefone</span>
            <Badge className="bg-emerald-50 text-emerald-700">{done} contatados</Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: eligible.length ? `${Math.round((done / eligible.length) * 100)}%` : "0%" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!current ? (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <MessageCircle className="mx-auto size-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold">Nenhum telefone disponível</h3>
                <p className="mt-2 text-xs text-slate-400">Essa lista não possui leads com telefone utilizável.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Lead {index + 1} de {eligible.length}</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">{current.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{current.city} • score {current.score}</p>
                  </div>
                  {completed[current.id] && <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="size-4" /></span>}
                </div>

                <div className="mt-5 grid gap-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <Phone className="size-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">{current.phone}</span>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[.1em] text-blue-600">Mensagem sugerida</p>
                    <p className="mt-2 text-xs leading-6 text-blue-950/75">
                      Olá! Encontrei a {current.name} pesquisando empresas em {current.city}. Notei uma oportunidade na presença digital de vocês. Posso te mostrar uma demonstração rápida?
                    </p>
                  </div>
                </div>

                <Button className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700" onClick={openCurrent}>
                  <MessageCircle className="size-4" /> Abrir conversa no WhatsApp
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button variant="secondary" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>Anterior</Button>
                <Button variant="secondary" onClick={next} disabled={index >= eligible.length - 1}>
                  Próximo <ChevronRight className="size-4" />
                </Button>
              </div>

              <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
                O HunterX organiza a fila; o envio continua sob seu controle para evitar duplicidade e disparos acidentais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
