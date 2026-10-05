import type { Lead, LeadCrmRecord, LeadStage } from "./types";

export type SalesMotion =
  | "proof_led_consultative"
  | "spin_discovery"
  | "meddic_lite"
  | "account_based"
  | "transactional";

export type StrategyDecision = {
  motion: SalesMotion;
  label: string;
  confidence: number;
  reasons: string[];
  opening: string;
  qualification: string[];
  proof: string;
  meetingThreshold: string;
};

export type RevenueActionType =
  | "enrich"
  | "qualify"
  | "prepare_contact"
  | "send_message"
  | "follow_up"
  | "create_proof"
  | "send_proposal"
  | "negotiate"
  | "handoff"
  | "stop";

export type RevenueAction = {
  type: RevenueActionType;
  title: string;
  rationale: string;
  requiresApproval: boolean;
  priority: number;
  nextStage?: LeadStage;
};

function hasStrongProofGap(lead: Lead) {
  return !lead.website || !lead.email || lead.score >= 80;
}

export function selectSalesStrategy(lead: Lead): StrategyDecision {
  const reasons: string[] = [];

  if (!lead.website) reasons.push("Não possui website: a prova visual pode ser demonstrada antes da reunião.");
  if (lead.score >= 80) reasons.push("Opportunity Score alto: vale abordagem personalizada.");
  if (lead.reviews >= 20) reasons.push("Há evidência de operação real e reputação pública.");
  if (lead.phone) reasons.push("Existe canal direto para prospecção.");

  // Default for local SMB site sales:
  // show value first, then diagnose, then qualify only as much as needed.
  return {
    motion: "proof_led_consultative",
    label: "Proof-led + consultiva",
    confidence: Math.min(95, 68 + reasons.length * 6),
    reasons,
    opening:
      "Comece por uma observação real do negócio e por uma hipótese de ganho; evite abrir pedindo reunião.",
    qualification: [
      "Quem decide sobre presença digital/site?",
      "Existe alguma prioridade comercial que o site deveria apoiar?",
      "Como chegam novos clientes hoje?",
      "Há prazo, campanha ou momento específico para melhorar isso?",
    ],
    proof: hasStrongProofGap(lead)
      ? "Mockup/demo personalizada + explicação curta do ganho esperado."
      : "Mini-auditoria de conversão + melhoria demonstrável.",
    meetingThreshold:
      "Peça reunião apenas quando houver interesse real, necessidade de diagnóstico mais profundo ou múltiplos decisores.",
  };
}

export function nextRevenueAction(record: LeadCrmRecord): RevenueAction {
  const { lead, status } = record;

  switch (status) {
    case "novo":
      return {
        type: "enrich",
        title: "Enriquecer e validar lead",
        rationale: "Antes de abordar, confirme presença digital, canal, contexto e evidência mínima.",
        requiresApproval: false,
        priority: 90,
        nextStage: "analisado",
      };
    case "analisado":
      return {
        type: "prepare_contact",
        title: "Preparar abordagem personalizada",
        rationale: "O lead já foi analisado; agora transforme evidência em mensagem curta e específica.",
        requiresApproval: true,
        priority: 95,
        nextStage: "contatado",
      };
    case "demonstracao":
      return {
        type: "create_proof",
        title: "Finalizar prova personalizada",
        rationale: "Reduza a incerteza do comprador antes de pedir compromisso.",
        requiresApproval: false,
        priority: 98,
        nextStage: "contatado",
      };
    case "contatado":
      return {
        type: "follow_up",
        title: "Aguardar resposta ou executar follow-up",
        rationale: "Não avance sem sinal real. Use tempo e resposta como eventos do loop.",
        requiresApproval: true,
        priority: 80,
      };
    case "respondeu":
      return {
        type: "qualify",
        title: "Qualificar necessidade e próximo passo",
        rationale: "A resposta é um sinal real. Descubra dor, decisão e valor antes de propor.",
        requiresApproval: true,
        priority: 100,
        nextStage: "negociacao",
      };
    case "negociacao":
      return {
        type: "send_proposal",
        title: "Gerar business case e proposta",
        rationale: "Converta problema, prova e valor em uma decisão comercial clara.",
        requiresApproval: true,
        priority: 100,
      };
    case "cliente":
    case "perdido":
      return {
        type: "stop",
        title: status === "cliente" ? "Converter para entrega" : "Registrar perda e aprendizado",
        rationale:
          status === "cliente"
            ? "A venda terminou; o próximo loop é produção e recorrência."
            : "A perda deve virar evidência para ICP, mensagem, estratégia e oferta.",
        requiresApproval: false,
        priority: 20,
      };
    default:
      return {
        type: "qualify",
        title: "Revisar estado comercial",
        rationale: "O estado atual requer reavaliação antes da próxima ação.",
        requiresApproval: true,
        priority: 50,
      };
  }
}

export function rankRevenueQueue(records: LeadCrmRecord[]) {
  return records
    .map((record) => ({
      record,
      strategy: selectSalesStrategy(record.lead),
      action: nextRevenueAction(record),
    }))
    .sort((a, b) => {
      if (b.action.priority !== a.action.priority) return b.action.priority - a.action.priority;
      return b.record.lead.score - a.record.lead.score;
    });
}
