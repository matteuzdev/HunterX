"use client";

import { useState, useEffect } from "react";
import {
  Bot, Sparkles, Plus, Play, Edit3, Trash2, Copy, BookOpen,
  Layers, CheckCircle2, Sliders, ExternalLink, Power, Zap, ShieldCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAgent } from "@/lib/hunter/types";
import { DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";
import { AgentEditModal } from "./agent-edit-modal";

const AGENTS_STORAGE_KEY = "hunterx-agents";

// Templates comerciais prontos para clonar com 1 clique
const COMMUNITY_TEMPLATES: AIAgent[] = [
  {
    id: "tpl-sdr-outbound",
    name: "SDR Outbound • Google Maps",
    avatar: "bot",
    role: "Abordagem Fria & Qualificação de Negócios Locais",
    tone: "consultivo",
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    welcomeMessage:
      "Olá equipe da {lead_name}! Tudo bem? Vi a reputação de vocês no Google em {city} e identifiquei oportunidades para aumentar o fluxo de clientes.",
    systemPrompt:
      "Você é um consultor SDR focado em qualificar donos de comércios e clínicas para um diagnóstico gratuito de 10 minutos.",
    rulesShouldDo: [
      "Pergunte se eles já possuem site e se o site atual gera contatos no WhatsApp.",
      "Ofereça o diagnóstico gratuito como próximo passo natural.",
    ],
    rulesNeverDo: [
      "Nunca passe valores fechados antes do diagnóstico.",
      "Não insista se o lead recusar duas vezes consecutivas.",
    ],
    knowledgeBase: [
      {
        id: "tpl-kb-1",
        type: "text",
        title: "Diagnóstico Digital Gratuito",
        content: "Análise comparativa da empresa em relação aos 3 concorrentes mais bem posicionados no Google Maps.",
        charCount: 110,
        status: "trained",
      },
      {
        id: "tpl-kb-2",
        type: "faq",
        title: "Tem algum custo o diagnóstico?",
        content: "Não, o diagnóstico de 10 minutos é 100% gratuito e sem compromisso comercial.",
        charCount: 92,
        status: "trained",
      },
    ],
    intents: [
      {
        id: "tpl-int-1",
        name: "interesse_em_diagnostico",
        description: "Quando o lead aceita receber o diagnóstico",
        samplePhrases: ["pode mandar", "como funciona?", "quero ver", "pode ser"],
        actionType: "move_kanban",
        isActive: true,
      },
    ],
    fallbackToHuman: true,
    handoffKeywords: ["humano", "atendente", "falar com pessoa"],
    isActive: true,
    assignedNiches: ["Negócios Locais"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl-closer-sites",
    name: "Closer • Venda de Sites de Alta Conversão",
    avatar: "zap",
    role: "Negociação & Fechamento de Projetos Web",
    tone: "persuasivo",
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    temperature: 0.6,
    welcomeMessage:
      "Olá! Sou consultor de presença digital. Percebi que sua empresa não possui uma página otimizada para capturar clientes direto no WhatsApp.",
    systemPrompt:
      "Você é um Closer especializado em apresentar o valor de websites rápidos (PageSpeed 95+) e converter interesse em fechamento.",
    rulesShouldDo: [
      "Destaque que 70% das buscas com urgência no Google vão direto para empresas com site veloz.",
      "Mostre exemplos de retorno sobre o investimento.",
    ],
    rulesNeverDo: ["Nunca desvalorize o trabalho anterior do cliente."],
    knowledgeBase: [
      {
        id: "tpl-kb-3",
        type: "text",
        title: "Especificações do Site Elite",
        content: "Carregamento em 1 segundo, integração direta ao WhatsApp, formulário de captura e painel administrativo.",
        charCount: 124,
        status: "trained",
      },
    ],
    intents: [
      {
        id: "tpl-int-2",
        name: "pedir_proposta",
        description: "Quando o lead quer ver valores e formas de pagamento",
        samplePhrases: ["quanto fica?", "qual o valor?", "tem desconto?", "qual o preço?"],
        actionType: "move_kanban",
        isActive: true,
      },
    ],
    fallbackToHuman: true,
    handoffKeywords: ["humano", "atendente", "desconto especial"],
    isActive: true,
    assignedNiches: ["Serviços & B2B"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl-reativacao-leads",
    name: "Reativação • Base Antiga de Clientes",
    avatar: "sparkles",
    role: "Reengajamento de Propostas Enviadas e Sem Resposta",
    tone: "direto",
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.5,
    welcomeMessage:
      "Olá {lead_name}! Passando para saber se você conseguiu analisar a demonstração do novo site que te enviei.",
    systemPrompt:
      "Você é um especialista em follow-up humanizado para reativar conversas paradas sem parecer vendedor chato.",
    rulesShouldDo: ["Faça perguntas curtas e abertas que exijam resposta simples."],
    rulesNeverDo: ["Não mande textos longos ou áudios não solicitados."],
    knowledgeBase: [],
    intents: [],
    fallbackToHuman: true,
    handoffKeywords: ["humano", "falar agora"],
    isActive: true,
    assignedNiches: ["Follow-up"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

import {
  fetchAgentsFromSupabase,
  saveAgentToSupabase,
  deleteAgentFromSupabase,
} from "@/lib/hunter/supabase-store";

export function AgentsCatalogView({
  onSelectAgentForTest,
}: {
  onSelectAgentForTest?: (agent: AIAgent) => void;
}) {
  const [agents, setAgents] = useState<AIAgent[]>(DEFAULT_AGENTS);
  const [activeCatalogTab, setActiveCatalogTab] = useState<"my_agents" | "templates">("my_agents");
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carrega agentes reais do Supabase
  useEffect(() => {
    async function loadAgents() {
      const data = await fetchAgentsFromSupabase();
      if (data && data.length > 0) {
        setAgents(data);
      } else {
        // Se ainda não houver nenhum agente no banco, persiste os agentes base
        for (const defaultAgent of DEFAULT_AGENTS) {
          void saveAgentToSupabase(defaultAgent);
        }
      }
    }
    void loadAgents();
  }, []);

  function handleCreateNewAgent() {
    setEditingAgent(null);
    setIsModalOpen(true);
  }

  function handleEditAgent(agent: AIAgent) {
    setEditingAgent(agent);
    setIsModalOpen(true);
  }

  async function handleSaveAgent(saved: AIAgent) {
    const exists = agents.some((a) => a.id === saved.id);
    let next: AIAgent[];
    if (exists) {
      next = agents.map((a) => (a.id === saved.id ? saved : a));
    } else {
      next = [saved, ...agents];
    }
    setAgents(next);
    await saveAgentToSupabase(saved);
  }

  async function handleDeleteAgent(agentId: string) {
    if (agents.length <= 1) {
      alert("É necessário manter pelo menos um agente configurado no sistema.");
      return;
    }
    if (confirm("Deseja realmente remover este agente?")) {
      const next = agents.filter((a) => a.id !== agentId);
      setAgents(next);
      await deleteAgentFromSupabase(agentId);
    }
  }

  async function handleToggleActive(agentId: string) {
    const target = agents.find((a) => a.id === agentId);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive, updatedAt: new Date().toISOString() };
    const next = agents.map((a) => (a.id === agentId ? updated : a));
    setAgents(next);
    await saveAgentToSupabase(updated);
  }

  async function handleCloneTemplate(template: AIAgent) {
    const cloned: AIAgent = {
      ...template,
      id: `agent-${Date.now()}`,
      name: `${template.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgents([cloned, ...agents]);
    await saveAgentToSupabase(cloned);
    setActiveCatalogTab("my_agents");
  }

  async function handleDuplicateAgent(agent: AIAgent) {
    const duplicated: AIAgent = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `${agent.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgents([duplicated, ...agents]);
    await saveAgentToSupabase(duplicated);
  }

  const activeAgentsCount = agents.filter((a) => a.isActive).length;
  const totalKbCount = agents.reduce((acc, a) => acc + (a.knowledgeBase?.length || 0), 0);
  const totalIntentsCount = agents.reduce((acc, a) => acc + (a.intents?.length || 0), 0);

  return (
    <section className="space-y-6">
      {/* Header Corporativo HunterX */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-600">
            Inteligência Comercial
          </p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-slate-900">Agentes de IA</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerencie seus assistentes de prospecção, closer e atendimento com arquitetura baseada no GPT Maker.
          </p>
        </div>

        <Button onClick={handleCreateNewAgent} variant="primary">
          <Plus className="mr-1.5 size-4" /> Novo Agente
        </Button>
      </div>

      {/* Métricas dos Agentes */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Agentes</span>
            <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Bot className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{agents.length}</p>
          <small className="text-[11px] text-slate-500">Configurados no workspace</small>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agentes Ativos</span>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Power className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-emerald-600">{activeAgentsCount}</p>
          <small className="text-[11px] text-slate-500">Respondendo no WhatsApp</small>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fontes RAG</span>
            <span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <BookOpen className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{totalKbCount}</p>
          <small className="text-[11px] text-slate-500">Documentos e regras indexadas</small>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Intenções Ativas</span>
            <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
              <Layers className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{totalIntentsCount}</p>
          <small className="text-[11px] text-slate-500">Gatilhos automáticos mapeados</small>
        </Card>
      </div>

      {/* Seletor de Abas: Meus Agentes vs Templates */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCatalogTab("my_agents")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeCatalogTab === "my_agents"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Meus Agentes ({agents.length})
          </button>
          <button
            onClick={() => setActiveCatalogTab("templates")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeCatalogTab === "templates"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Modelos Prontos & Comunidade ({COMMUNITY_TEMPLATES.length})
          </button>
        </div>
      </div>

      {/* Grade de Cards: Meus Agentes */}
      {activeCatalogTab === "my_agents" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="flex flex-col justify-between overflow-hidden border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
            >
              <div className="p-5">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                      <Bot className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">{agent.name}</h3>
                      <p className="line-clamp-1 text-[11px] text-slate-500">{agent.role}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(agent.id)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                      agent.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {agent.isActive ? "Ativo" : "Inativo"}
                  </button>
                </div>

                {/* Métricas e Tags do Agente */}
                <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                  <Badge className="bg-slate-100 text-slate-700 font-mono">
                    {agent.model || "gpt-4o-mini"}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 font-semibold">
                    {agent.tone}
                  </Badge>
                  <Badge className="bg-amber-50 text-amber-700 font-semibold">
                    {agent.knowledgeBase?.length || 0} fontes RAG
                  </Badge>
                  <Badge className="bg-indigo-50 text-indigo-700 font-semibold">
                    {agent.intents?.length || 0} intenções
                  </Badge>
                </div>

                {/* Prévia da Mensagem de Abertura */}
                {agent.welcomeMessage && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Mensagem de Abertura
                    </span>
                    <p className="mt-1 line-clamp-2">“{agent.welcomeMessage}”</p>
                  </div>
                )}
              </div>

              {/* Barra de Ações do Card */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => onSelectAgentForTest?.(agent)}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    title="Testar agente no simulador"
                  >
                    <Play className="mr-1 size-3.5" /> Testar
                  </Button>
                  <Button
                    onClick={() => handleEditAgent(agent)}
                    variant="primary"
                    size="sm"
                    className="text-xs"
                  >
                    <Edit3 className="mr-1 size-3.5" /> Editar
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateAgent(agent)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                    title="Duplicar agente"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Excluir agente"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Grade de Cards: Templates da Comunidade */}
      {activeCatalogTab === "templates" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="flex flex-col justify-between overflow-hidden border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Sparkles className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">{template.name}</h3>
                      <p className="line-clamp-1 text-[11px] text-slate-500">{template.role}</p>
                    </div>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                    Template
                  </Badge>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {template.systemPrompt}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                  <Badge className="bg-slate-100 text-slate-700 font-mono">
                    {template.model}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700">
                    {template.knowledgeBase.length} fontes RAG
                  </Badge>
                  <Badge className="bg-indigo-50 text-indigo-700">
                    {template.intents?.length || 0} intenções
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  onClick={() => handleCloneTemplate(template)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Plus className="mr-1.5 size-3.5" /> Clonar para Meus Agentes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição GPT Maker */}
      <AgentEditModal
        open={isModalOpen}
        agent={editingAgent}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAgent}
      />
    </section>
  );
}
