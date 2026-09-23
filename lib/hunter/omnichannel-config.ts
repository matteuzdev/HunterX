import { QuickReply, ChatLabel, LeadStage } from "./types";

export const DEFAULT_LABELS: ChatLabel[] = [
  { id: "lbl-1", name: "Sem Website", color: "#ef4444" },
  { id: "lbl-2", name: "Lead Quente", color: "#f97316" },
  { id: "lbl-3", name: "Presença Fraca", color: "#eab308" },
  { id: "lbl-4", name: "Diagnóstico Enviado", color: "#3b82f6" },
  { id: "lbl-5", name: "Pediu Humano", color: "#a855f7" },
  { id: "lbl-6", name: "Cliente Fechado", color: "#10b981" },
];

export const KANBAN_STAGES: Array<{ id: LeadStage; label: string; color: string }> = [
  { id: "novo", label: "Novo Lead", color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { id: "contatado", label: "Contatado", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { id: "respondeu", label: "Respondeu", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { id: "demonstracao", label: "Demonstração", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { id: "negociacao", label: "Negociação", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  { id: "cliente", label: "Fechado / Ganho", color: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40" },
  { id: "perdido", label: "Perdido", color: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
];

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: "qr-1",
    shortcut: "/site",
    title: "Apresentação Site Elite",
    category: "abordagem",
    content: "Nós desenvolvemos uma página visual de alta velocidade pensada exclusivamente para {niche} em {city}. O objetivo é que qualquer pessoa que busque no Google consiga abrir seu site em menos de 1 segundo e falar direto no WhatsApp.",
  },
  {
    id: "qr-2",
    shortcut: "/diag",
    title: "Diagnóstico de 10 min",
    category: "diagnostico",
    content: "Consigo te mostrar em 10 minutos por chamada de vídeo (ou te mando um vídeo gravado de 3 min) os 3 pontos onde os clientes de {city} estão saindo do perfil de vocês e indo para os concorrentes. Que horário fica bom para você dar uma olhada?",
  },
  {
    id: "qr-3",
    shortcut: "/preco",
    title: "Posicionamento de Preço",
    category: "fechamento",
    content: "Trabalhamos com formatos adaptados para cada estrutura comercial: desde a criação da infraestrutura inicial com agendamento online até planos mensais de geração contínua de novos clientes. Se você puder me adiantar a média de novos clientes que vocês querem atender este mês, já te passo os números exatos!",
  },
  {
    id: "qr-4",
    shortcut: "/obj-insta",
    title: "Quebra: Uso só Instagram",
    category: "objecao",
    content: "O Instagram é ótimo para reforço e relacionamento com quem já conhece vocês! Porém, quem tem dor urgente (ex: emergência odontológica ou compra de serviço na cidade) pesquisa direto no Google Maps. Se vocês não têm um site indexado, estão entregando esses clientes prontos para quem aparece no topo.",
  },
  {
    id: "qr-5",
    shortcut: "/obj-agencia",
    title: "Quebra: Já temos agência",
    category: "objecao",
    content: "Perfeito, muito bom saber que vocês já investem na marca! Nosso foco é 100% no motor de captura do Google Maps e conversão direta para o WhatsApp — não fazemos gestão de posts de redes sociais. Na verdade, nosso trabalho costuma potencializar ainda mais os resultados da agência que já cuida de vocês.",
  },
];

