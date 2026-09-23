"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Copy, ExternalLink, Globe2, Loader2, Mail, MapPin,
  MessageCircle, Phone, Sparkles, Star, WandSparkles, X, XCircle
} from "lucide-react";
import type { Lead, LeadCrmRecord, LeadStage } from "@/lib/hunter/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EnrichmentResult = {
  emails?: string[];
  socials?: Record<string, string>;
  scoring?: {
    score: number;
    temperature: Lead["temperature"];
    priority: Lead["priority"];
    reasons: Array<[string, string]>;
  };
};

function opportunityText(lead: Lead) {
  const hasSocial = Object.values(lead.socials || {}).some(Boolean);

  if (!lead.website && lead.rating >= 4.4 && lead.reviews >= 10) {
    return "Boa reputação local sem site próprio. Há uma lacuna clara entre a qualidade percebida no Google e a estrutura de conversão da empresa.";
  }
  if (!lead.website) {
    return "Empresa encontrada no Google sem site próprio. Uma demonstração visual pode transformar essa ausência em uma proposta concreta.";
  }
  if (!hasSocial || !lead.email) {
    return "A empresa já possui presença digital, mas há sinais de contato e distribuição incompletos que podem reduzir conversão.";
  }
  return "Presença digital existente. A oportunidade precisa ser vendida por conversão, prova social, SEO local e experiência — não apenas por ter um site.";
}

function buildApproach(lead: Lead) {
  const hasSocial = Object.values(lead.socials || {}).some(Boolean);
  const gap = !lead.website
    ? "vocês ainda não têm um site próprio para transformar quem encontra a empresa no Google em pedidos de orçamento"
    : !hasSocial
      ? "a presença digital de vocês pode trabalhar melhor junto com a reputação que já construíram"
      : "há espaço para melhorar a conversão de quem já encontra a empresa online";

  return `Olá! Encontrei a ${lead.name} pesquisando empresas em ${lead.city}. Vi que vocês têm ${lead.rating ? `${lead.rating} estrelas no Google` : "presença no Google"} e percebi uma oportunidade: ${gap}. Posso te mostrar uma demonstração rápida do que eu faria para vocês?`;
}

function buildDemoConcept(lead: Lead) {
  const reviewProof = lead.rating && lead.reviews
    ? `${lead.rating} estrelas • ${lead.reviews} avaliações`
    : "prova social do Google";

  return {
    headline: `${lead.name}: transforme visitas do Google em pedidos de orçamento`,
    proof: reviewProof,
    sections: [
      "Hero com CTA direto para WhatsApp",
      "Serviços principais e diferenciais",
      "Galeria / trabalhos realizados",
      "Avaliações e prova social do Google",
      "FAQ para quebrar objeções",
      "Área de atendimento + SEO local",
    ],
  };
}

export function LeadDetailDrawer({
  lead,
  onClose,
  onWhatsApp,
  crmRecord,
  onStageChange,
}: {
  lead: Lead | null;
  onClose: () => void;
  onWhatsApp: (lead: Lead) => void;
  crmRecord?: LeadCrmRecord;
  onStageChange?: (lead: Lead, stage: LeadStage) => void;
}) {
  const [enriching, setEnriching] = useState(false);
  const [enrichment, setEnrichment] = useState<EnrichmentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [enrichError, setEnrichError] = useState("");

  useEffect(() => {
    setEnrichment(null);
    setEnrichError("");
    setCopied(false);
    setDemoOpen(false);
  }, [lead?.id]);

  useEffect(() => {
    if (!lead) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  const effective = useMemo(() => {
    if (!lead || !enrichment) return lead;
    return {
      ...lead,
      email: enrichment.emails?.[0] || lead.email,
      socials: { ...lead.socials, ...(enrichment.socials || {}) },
      ...(enrichment.scoring || {}),
    } as Lead;
  }, [lead, enrichment]);

  if (!lead || !effective) return null;
  const currentLead = effective;

  const hasSocial = Object.values(currentLead.socials || {}).some(Boolean);
  const mapsUrl = currentLead.latitude && currentLead.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${currentLead.latitude},${currentLead.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([currentLead.name, currentLead.address].filter(Boolean).join(" "))}`;

  const insights = [
    ["Website próprio", Boolean(currentLead.website), currentLead.website ? "Encontrado" : "Ausente"],
    ["Redes sociais", hasSocial, hasSocial ? "Encontradas" : "Não detectadas"],
    ["E-mail público", Boolean(currentLead.email), currentLead.email || "Não detectado"],
    ["Telefone", Boolean(currentLead.phone), currentLead.phone || "Não detectado"],
  ] as const;

  const demo = buildDemoConcept(currentLead);

  async function copyApproach() {
    await navigator.clipboard.writeText(buildApproach(currentLead));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function enrich() {
    if (!currentLead.website || enriching) return;
    setEnriching(true);
    setEnrichError("");
    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: currentLead.website, lead: currentLead }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha no enrichment");
      setEnrichment(data);
    } catch (error) {
      setEnrichError(error instanceof Error ? error.message : "Falha no enrichment");
    } finally {
      setEnriching(false);
    }
  }

  return (
    <>
      <button
        aria-label="Fechar detalhes"
        className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge className={currentLead.temperature === "Quente" ? "bg-rose-50 text-rose-700" : currentLead.temperature === "Morno" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}>
                {currentLead.temperature}
              </Badge>
              <Badge className="bg-blue-50 text-blue-700">{currentLead.priority}</Badge>
              <Badge className="bg-slate-100 text-slate-600">{currentLead.source}</Badge>
            </div>
            <h2 className="truncate text-lg font-black tracking-[-.03em] text-slate-950">{currentLead.name}</h2>
            <p className="mt-1 truncate text-xs text-slate-400">{currentLead.category} • {currentLead.city}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X className="size-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Pipeline CRM</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {crmRecord?.seenCount && crmRecord.seenCount > 1 ? `Encontrado em ${crmRecord.seenCount} buscas` : "Primeira aparição registrada"}
                  </p>
                </div>
                <select
                  value={crmRecord?.status || "novo"}
                  onChange={(event) => onStageChange?.(currentLead, event.target.value as LeadStage)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 outline-none"
                >
                  <option value="novo">Novo</option>
                  <option value="analisado">Analisado</option>
                  <option value="demonstracao">Demonstração</option>
                  <option value="contatado">Contatado</option>
                  <option value="respondeu">Respondeu</option>
                  <option value="negociacao">Negociação</option>
                  <option value="cliente">Cliente</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              {crmRecord?.firstSeenAt && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                  <span>Primeira vez<br/><strong className="text-slate-600">{new Date(crmRecord.firstSeenAt).toLocaleDateString("pt-BR")}</strong></span>
                  <span>Última vez<br/><strong className="text-slate-600">{new Date(crmRecord.lastSeenAt).toLocaleDateString("pt-BR")}</strong></span>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.14em] text-blue-600">Oportunidade comercial</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{opportunityText(currentLead)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <strong className="text-3xl font-black tracking-[-.06em] text-blue-700">{currentLead.score}</strong>
                  <span className="text-xs font-bold text-blue-400">/100</span>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${currentLead.score}%` }} />
              </div>

              <div className="mt-4 space-y-2">
                {currentLead.reasons.slice(0, 6).map(([points, reason]) => (
                  <div key={points + reason} className="flex items-center gap-2 text-[11px]">
                    <span className="w-8 rounded-md bg-white px-1.5 py-1 text-center font-black text-blue-700 shadow-sm">{points}</span>
                    <span className="text-slate-600">{reason}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Contato</p>
              <div className="space-y-2 rounded-2xl border border-slate-100 p-3">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span className="text-xs leading-5 text-slate-600">{currentLead.address || "Endereço não informado"}</span>
                </div>
                <div className="flex gap-3">
                  <Phone className="size-4 shrink-0 text-slate-400" />
                  <span className="text-xs text-slate-600">{currentLead.phone || "Telefone não encontrado"}</span>
                </div>
                <div className="flex gap-3">
                  <Mail className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate text-xs text-slate-600">{currentLead.email || "E-mail não encontrado"}</span>
                </div>
                <div className="flex gap-3">
                  <Globe2 className="size-4 shrink-0 text-slate-400" />
                  {currentLead.website ? (
                    <a href={currentLead.website} target="_blank" rel="noreferrer" className="truncate text-xs font-semibold text-blue-600 hover:underline">
                      {currentLead.website}
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600">Sem website próprio</span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button onClick={() => onWhatsApp(currentLead)} disabled={!currentLead.phone}>
                  <MessageCircle className="size-4" /> WhatsApp
                </Button>
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="w-full"><ExternalLink className="size-4" /> Google Maps</Button>
                </a>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Reputação</p>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="size-3.5 fill-current" /> {currentLead.rating || "—"} <span className="font-medium text-slate-400">({currentLead.reviews})</span>
                </span>
              </div>
            </section>

            <section>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Insights</p>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {insights.map(([label, ok, detail]) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-3">
                    {ok ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> : <XCircle className="size-4 shrink-0 text-rose-500" />}
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[11px] text-slate-700">{label}</strong>
                      <small className="mt-0.5 block truncate text-[10px] text-slate-400">{detail}</small>
                    </span>
                  </div>
                ))}
              </div>

              {currentLead.website && (
                <div className="mt-3">
                  <Button variant="secondary" className="w-full" onClick={enrich} disabled={enriching}>
                    {enriching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {enrichment ? "Análise atualizada" : "Analisar website"}
                  </Button>
                  {enrichError && <p className="mt-2 text-[10px] font-semibold text-rose-600">{enrichError}</p>}
                </div>
              )}
            </section>

            <section>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Ação comercial</p>
              <div className="grid gap-2">
                <Button variant="secondary" onClick={copyApproach}>
                  <Copy className="size-4" /> {copied ? "Abordagem copiada" : "Gerar abordagem"}
                </Button>
                <Button onClick={() => setDemoOpen((value) => !value)}>
                  <WandSparkles className="size-4" /> Gerar conceito de demonstração
                </Button>
              </div>

              {demoOpen && (
                <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[.12em] text-violet-600">Conceito recomendado</p>
                  <h3 className="mt-2 text-sm font-black leading-5 text-slate-900">{demo.headline}</h3>
                  <p className="mt-2 text-[11px] font-semibold text-violet-700">{demo.proof}</p>
                  <div className="mt-3 space-y-1.5">
                    {demo.sections.map((item) => (
                      <div key={item} className="flex gap-2 text-[10px] leading-4 text-slate-600">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-violet-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}
