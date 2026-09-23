"use client";

import { useState, useEffect } from "react";
import {
  Bot, Sparkles, Plus, Trash2, Save, Play, BookOpen, ShieldAlert,
  Sliders, MessageSquare, Check, ArrowRight, Copy, CheckCircle2,
  Settings, Database, Cpu, Send, RotateCcw, User, Terminal,
  HelpCircle, Link as LinkIcon, FileText, CheckCheck, Zap, Shield, Search,
  Globe, FileUp, AlertCircle, RefreshCw, Layers, ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AIAgent,
  AgentKnowledgeItem,
  KnowledgeSourceType,
  AgentIntent,
  AgentTone,
  AgentProvider,
  ChatMessage,
  Lead
} from "@/lib/hunter/types";
import { DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";

const AGENTS_STORAGE_KEY = "hunterx-agents";

type StudioTab = "identity" | "training" | "intents" | "instructions" | "handoff";

export function AgentStudio() {
  const [agents, setAgents] = useState<AIAgent[]>(DEFAULT_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  const [currentTab, setCurrentTab] = useState<StudioTab>("training");
  const [savedNotice, setSavedNotice] = useState(false);
  const [kbSearchQuery, setKbSearchQuery] = useState("");

  // Modal para Adicionar Fonte de Conhecimento (Padrão GPT Maker)
  const [newSourceModalOpen, setNewSourceModalOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<KnowledgeSourceType>("text");
  const [newSourceTitle, setNewSourceTitle] = useState("");
  const [newSourceContent, setNewSourceContent] = useState("");

  // Modal para Adicionar Nova Intenção (Padrão GPT Maker)
  const [newIntentModalOpen, setNewIntentModalOpen] = useState(false);
  const [newIntentName, setNewIntentName] = useState("");
  const [newIntentDescription, setNewIntentDescription] = useState("");
  const [newIntentSamplePhrases, setNewIntentSamplePhrases] = useState("");
  const [newIntentActionType, setNewIntentActionType] = useState<"move_kanban" | "handoff_human" | "send_quick_reply" | "webhook">("move_kanban");

  // Carrega agentes do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAgents(parsed);
          setSelectedAgentId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar agentes:", e);
    }
  }, []);

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  function persistAgents(updated: AIAgent[]) {
    setAgents(updated);
    try {
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(updated));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (e) {
      console.error("Erro ao salvar agentes:", e);
    }
  }

  function updateActiveAgent(patch: Partial<AIAgent>) {
    const updated = agents.map((a) =>
      a.id === activeAgent.id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
    );
    persistAgents(updated);
  }

  function handleCreateAgent() {
    const newAgent: AIAgent = {
      id: `agent-${Date.now()}`,
      name: "Novo Consultor HunterX",
      avatar: "bot",
      role: "Prospecção & Venda de Sites",
      tone: "consultivo",
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
      welcomeMessage: "Olá equipe da {lead_name}! Analisei a presença de vocês no Google em {city} e encontrei oportunidades para atrair mais clientes.",
      systemPrompt: "Você é um consultor comercial da agência focado em qualificar donos de negócios e agendar diagnósticos visuais de 10 minutos.",
      rulesShouldDo: [
        "Foque em entender se a empresa já possui site e se o site atual gera vendas pelo WhatsApp.",
        "Seja empático, direto e use linguagem profissional e acessível.",
        "Apresente sempre a oportunidade de realizar um diagnóstico visual sem custo de 10 minutos.",
      ],
      rulesNeverDo: [
        "Nunca passe valores fixos fechados sem antes realizar o diagnóstico da empresa.",
        "Nunca critique agressivamente a estrutura do cliente; posicione como melhoria de oportunidade.",
        "Não continue insistindo se o cliente recusar expressamente por 2 vezes.",
      ],
      enableKanbanTool: true,
      enableWebSearchTool: true,
      knowledgeBase: [
        {
          id: `kb-${Date.now()}-1`,
          type: "text",
          title: "Diferenciais do Site Rápido (PageSpeed 95+)",
          content: "Nossos websites carregam em menos de 1 segundo e atingem notas 95+ no Google PageSpeed Insights. Isso reduz o custo de anúncios e aumenta em até 3x a taxa de mensagens recebidas no WhatsApp.",
          charCount: 215,
          status: "trained",
          updatedAt: new Date().toISOString(),
        },
        {
          id: `kb-${Date.now()}-2`,
          type: "faq",
          title: "Qual o prazo de entrega de um projeto de site?",
          content: "O prazo padrão de entrega de uma landing page ou site institucional é de 7 a 10 dias úteis após a aprovação da estrutura.",
          charCount: 120,
          status: "trained",
          updatedAt: new Date().toISOString(),
        },
        {
          id: `kb-${Date.now()}-3`,
          type: "website",
          title: "Portfólio & Casos de Sucesso da Agência",
          content: "https://agencia-exemplo.com.br/cases-de-sucesso",
          charCount: 48,
          status: "trained",
          updatedAt: new Date().toISOString(),
        },
      ],
      intents: [
        {
          id: `int-${Date.now()}-1`,
          name: "agendar_diagnostico",
          description: "Quando o lead aceita agendar uma reunião ou diagnóstico de 10 minutos",
          samplePhrases: ["pode ser amanhã", "quero marcar", "vamos agendar", "qual horário você tem?", "pode me ligar"],
          actionType: "move_kanban",
          actionPayload: { target_column: "demonstracao" },
          isActive: true,
        },
        {
          id: `int-${Date.now()}-2`,
          name: "duvida_preco",
          description: "Quando o lead pergunta diretamente o valor ou pede uma tabela de preços",
          samplePhrases: ["quanto custa?", "qual o preço?", "quanto é para fazer?", "me passa o orçamento"],
          actionType: "send_quick_reply",
          actionPayload: { quickReplyId: "qr-preco" },
          isActive: true,
        },
        {
          id: `int-${Date.now()}-3`,
          name: "solicitar_humano",
          description: "Quando o lead pede explicitamente para falar com uma pessoa real",
          samplePhrases: ["falar com atendente", "quero um humano", "você é um robô?", "chama uma pessoa"],
          actionType: "handoff_human",
          isActive: true,
        },
      ],
      fallbackToHuman: true,
      handoffKeywords: ["humano", "atendente", "falar com pessoa", "ligação", "atendimento"],
      handoffMessage: "Perfeito! Vou transferir nossa conversa agora mesmo para um especialista humano da nossa equipe. Um instante!",
      isActive: true,
      assignedNiches: ["Geral"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextAgents = [...agents, newAgent];
    persistAgents(nextAgents);
    setSelectedAgentId(newAgent.id);
  }

  function handleDuplicateAgent(agent: AIAgent) {
    const copy: AIAgent = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `${agent.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextAgents = [...agents, copy];
    persistAgents(nextAgents);
    setSelectedAgentId(copy.id);
  }

  function handleDeleteAgent(agentId: string) {
    if (agents.length <= 1) {
      alert("É necessário manter pelo menos um agente cadastrado.");
      return;
    }
    const nextAgents = agents.filter((a) => a.id !== agentId);
    persistAgents(nextAgents);
    setSelectedAgentId(nextAgents[0].id);
  }

  // Adicionar Fonte de Conhecimento (Padrão GPT Maker)
  function handleAddKnowledgeSource() {
    if (!newSourceTitle.trim() || !newSourceContent.trim()) return;

    const newItem: AgentKnowledgeItem = {
      id: `kb-${Date.now()}`,
      type: newSourceType,
      title: newSourceTitle.trim(),
      content: newSourceContent.trim(),
      charCount: newSourceContent.trim().length,
      status: "trained",
      updatedAt: new Date().toISOString(),
    };

    updateActiveAgent({
      knowledgeBase: [...(activeAgent.knowledgeBase || []), newItem],
    });

    setNewSourceTitle("");
    setNewSourceContent("");
    setNewSourceModalOpen(false);
  }

  function handleRemoveKnowledgeItem(id: string) {
    updateActiveAgent({
      knowledgeBase: (activeAgent.knowledgeBase || []).filter((k) => k.id !== id),
    });
  }

  // Adicionar Intenção (Padrão GPT Maker)
  function handleAddIntent() {
    if (!newIntentName.trim() || !newIntentSamplePhrases.trim()) return;

    const phrases = newIntentSamplePhrases
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const newIntent: AgentIntent = {
      id: `int-${Date.now()}`,
      name: newIntentName.trim().toLowerCase().replace(/\s+/g, "_"),
      description: newIntentDescription.trim(),
      samplePhrases: phrases,
      actionType: newIntentActionType,
      actionPayload:
        newIntentActionType === "move_kanban"
          ? { target_column: "demonstracao" }
          : {},
      isActive: true,
    };

    updateActiveAgent({
      intents: [...(activeAgent.intents || []), newIntent],
    });

    setNewIntentName("");
    setNewIntentDescription("");
    setNewIntentSamplePhrases("");
    setNewIntentModalOpen(false);
  }

  function handleToggleIntent(intentId: string) {
    const updated = (activeAgent.intents || []).map((i) =>
      i.id === intentId ? { ...i, isActive: !i.isActive } : i
    );
    updateActiveAgent({ intents: updated });
  }

  function handleDeleteIntent(intentId: string) {
    updateActiveAgent({
      intents: (activeAgent.intents || []).filter((i) => i.id !== intentId),
    });
  }

  function handleAddRule(type: "should" | "never") {
    if (type === "should") {
      const current = activeAgent.rulesShouldDo || [];
      updateActiveAgent({ rulesShouldDo: [...current, "Nova diretriz de conduta"] });
    } else {
      const current = activeAgent.rulesNeverDo || [];
      updateActiveAgent({ rulesNeverDo: [...current, "Nova restrição estrita"] });
    }
  }

  function handleRemoveRule(type: "should" | "never", index: number) {
    if (type === "should") {
      const current = [...(activeAgent.rulesShouldDo || [])];
      current.splice(index, 1);
      updateActiveAgent({ rulesShouldDo: current });
    } else {
      const current = [...(activeAgent.rulesNeverDo || [])];
      current.splice(index, 1);
      updateActiveAgent({ rulesNeverDo: current });
    }
  }

  // ==========================================
  // PLAYGROUND AO VIVO ACOPLADO (LADO DIREITO)
  // ==========================================
  const [simulatedLead, setSimulatedLead] = useState<Partial<Lead>>({
    name: "Clínica Dental Prime",
    category: "Clínica Odontológica",
    city: "Campina Grande, PB",
    score: 85,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "p1",
      conversationId: "sandbox",
      sender: "agent",
      content: (activeAgent.welcomeMessage || "Olá equipe da {lead_name}! Analisei a presença de vocês no Google em {city} e identifiquei oportunidades para atrair mais clientes.")
        .replace("{lead_name}", simulatedLead.name || "")
        .replace("{city}", simulatedLead.city || ""),
      timestamp: new Date().toISOString(),
      status: "read",
      agentName: activeAgent.name,
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastDebug, setLastDebug] = useState<{
    detectedIntent: string;
    shouldHandoff: boolean;
    confidence: number;
    sourcesUsed?: string[];
  }>({
    detectedIntent: "apresentacao_inicial",
    shouldHandoff: false,
    confidence: 0.96,
    sourcesUsed: ["Diferenciais do Site Rápido"],
  });

  useEffect(() => {
    setChatMessages([
      {
        id: `p-${Date.now()}`,
        conversationId: "sandbox",
        sender: "agent",
        content: (activeAgent.welcomeMessage || "Olá equipe da {lead_name}! Analisei a presença de vocês no Google em {city} e identifiquei oportunidades para atrair mais clientes.")
          .replace("{lead_name}", simulatedLead.name || "")
          .replace("{city}", simulatedLead.city || ""),
        timestamp: new Date().toISOString(),
        status: "read",
        agentName: activeAgent.name,
      },
    ]);
  }, [activeAgent.id]);

  async function handleSendSimulatedMessage(customText?: string) {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      conversationId: "sandbox",
      sender: "lead",
      content: textToSend,
      timestamp: new Date().toISOString(),
      status: "read",
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: activeAgent,
          message: textToSend,
          lead: simulatedLead,
          chatHistory: newHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const agentReply: ChatMessage = {
          id: `agt-${Date.now()}`,
          conversationId: "sandbox",
          sender: "agent",
          content: data.reply,
          timestamp: new Date().toISOString(),
          status: "read",
          agentName: activeAgent.name,
        };

        setChatMessages((prev) => [...prev, agentReply]);

        // Simula fontes acionadas com base no conteúdo
        const matchedSources: string[] = [];
        (activeAgent.knowledgeBase || []).forEach((kb) => {
          if (textToSend.toLowerCase().includes("site") || textToSend.toLowerCase().includes("preço") || textToSend.toLowerCase().includes("prazo")) {
            matchedSources.push(kb.title);
          }
        });

        setLastDebug({
          detectedIntent: data.detectedIntent || "interacao_geral",
          shouldHandoff: data.shouldHandoff,
          confidence: data.confidence || 0.95,
          sourcesUsed: matchedSources.length ? matchedSources.slice(0, 2) : ["Base de Conhecimento Geral"],
        });
      }
    } catch (e) {
      console.error("Erro no teste:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleResetChat() {
    setChatMessages([
      {
        id: `p-${Date.now()}`,
        conversationId: "sandbox",
        sender: "agent",
        content: (activeAgent.welcomeMessage || "Olá equipe da {lead_name}! Analisei a presença de vocês no Google em {city} e identifiquei oportunidades para atrair mais clientes.")
          .replace("{lead_name}", simulatedLead.name || "")
          .replace("{city}", simulatedLead.city || ""),
        timestamp: new Date().toISOString(),
        status: "read",
        agentName: activeAgent.name,
      },
    ]);
    setLastDebug({
      detectedIntent: "reset_conversa",
      shouldHandoff: false,
      confidence: 1.0,
      sourcesUsed: [],
    });
  }

  const filteredKb = (activeAgent.knowledgeBase || []).filter((item) =>
    item.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(kbSearchQuery.toLowerCase())
  );

  const totalChars = (activeAgent.knowledgeBase || []).reduce((acc, item) => acc + (item.charCount || item.content.length), 0);

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top Cockpit Bar (Padrão GPT Maker) */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Bot className="size-5" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeAgent.id}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.role})
                </option>
              ))}
            </select>

            <Button
              onClick={handleCreateAgent}
              variant="secondary"
              size="sm"
              className="h-8 px-2.5 text-xs"
              title="Criar novo agente"
            >
              <Plus className="mr-1 size-3.5" /> Novo
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <Badge className="bg-emerald-50 text-emerald-700 text-xs">
              <Check className="mr-1 size-3" /> Alterações salvas
            </Badge>
          )}

          <Button
            onClick={() => handleDuplicateAgent(activeAgent)}
            variant="secondary"
            size="sm"
            className="h-8 px-2.5 text-xs"
            title="Duplicar agente"
          >
            <Copy className="mr-1 size-3.5" /> Duplicar
          </Button>

          <Button
            onClick={() => {
              if (confirm(`Deseja excluir o agente "${activeAgent.name}"?`)) {
                handleDeleteAgent(activeAgent.id);
              }
            }}
            variant="danger"
            size="sm"
            className="h-8 px-2.5 text-xs"
            title="Excluir agente"
          >
            <Trash2 className="size-3.5" />
          </Button>

          <Button
            onClick={() => persistAgents(agents)}
            variant="primary"
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <Save className="mr-1 size-3.5" /> Publicar Agente
          </Button>
        </div>
      </div>

      {/* Corpo Split-Screen: Esquerda = Configurações GPT Maker | Direita = Simulador Sandbox */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* ========================================================= */}
        {/* COLUNA ESQUERDA (60%): CONFIGURAÇÕES ESTILO GPT MAKER     */}
        {/* ========================================================= */}
        <div className="flex flex-col border-r border-slate-200 lg:col-span-7 overflow-hidden">
          {/* Abas Estruturadas conforme GPT Maker Docs */}
          <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 overflow-x-auto">
            <button
              onClick={() => setCurrentTab("training")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition shrink-0 ${
                currentTab === "training"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Database className="size-3.5" /> Treinamento & Fontes ({activeAgent.knowledgeBase?.length || 0})
            </button>

            <button
              onClick={() => setCurrentTab("intents")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition shrink-0 ${
                currentTab === "intents"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Zap className="size-3.5 text-amber-500" /> Intenções & Ações ({activeAgent.intents?.length || 0})
            </button>

            <button
              onClick={() => setCurrentTab("instructions")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition shrink-0 ${
                currentTab === "instructions"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <MessageSquare className="size-3.5" /> Instruções & Regras
            </button>

            <button
              onClick={() => setCurrentTab("identity")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition shrink-0 ${
                currentTab === "identity"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Settings className="size-3.5" /> Identidade & Modelo
            </button>

            <button
              onClick={() => setCurrentTab("handoff")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition shrink-0 ${
                currentTab === "handoff"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Shield className="size-3.5" /> Transbordo Humano
            </button>
          </div>

          {/* Conteúdo da Aba */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ============================================================== */}
            {/* ABA 1: TREINAMENTO & FONTES (BASE DE CONHECIMENTO GPT MAKER)  */}
            {/* ============================================================== */}
            {currentTab === "training" && (
              <div className="space-y-5">
                {/* Banner com a Dica Oficial do GPT Maker */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Como funciona o Treinamento no GPT Maker:
                      </strong>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                        Alimente o cérebro do agente com <strong>afirmações claras e fatos objetivos</strong> sobre serviços, prazos e diferenciais. A IA responde com máxima precisão quando aprende fatos diretos em vez de roteiros fictícios.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas de Treinamento */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total de Fontes</span>
                    <strong className="mt-1 block text-lg font-black text-slate-900">{activeAgent.knowledgeBase?.length || 0}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Caracteres Indexados</span>
                    <strong className="mt-1 block text-lg font-black text-slate-900">{totalChars.toLocaleString()}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status do RAG</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="size-3.5" /> 100% Sincronizado
                    </span>
                  </div>
                </div>

                {/* Seleção de Novas Fontes (Texto, Website, Documento, FAQ) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold text-slate-800">Adicionar Nova Fonte de Conhecimento:</span>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      onClick={() => {
                        setNewSourceType("text");
                        setNewSourceTitle("Fato Comercial: Diferenciais");
                        setNewSourceContent("");
                        setNewSourceModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-blue-400 hover:shadow-sm"
                    >
                      <FileText className="size-5 text-blue-600" />
                      <strong className="mt-1.5 text-xs font-bold text-slate-900">Texto / Fato</strong>
                      <small className="text-[10px] text-slate-400">Afirmações diretas</small>
                    </button>

                    <button
                      onClick={() => {
                        setNewSourceType("website");
                        setNewSourceTitle("Link da Landing Page");
                        setNewSourceContent("https://");
                        setNewSourceModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-blue-400 hover:shadow-sm"
                    >
                      <Globe className="size-5 text-emerald-600" />
                      <strong className="mt-1.5 text-xs font-bold text-slate-900">Website / Link</strong>
                      <small className="text-[10px] text-slate-400">Rastrear URL</small>
                    </button>

                    <button
                      onClick={() => {
                        setNewSourceType("document");
                        setNewSourceTitle("Catálogo de Serviços em PDF");
                        setNewSourceContent("Conteúdo extraído da proposta comercial...");
                        setNewSourceModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-blue-400 hover:shadow-sm"
                    >
                      <FileUp className="size-5 text-violet-600" />
                      <strong className="mt-1.5 text-xs font-bold text-slate-900">Documento / PDF</strong>
                      <small className="text-[10px] text-slate-400">Upload de arquivo</small>
                    </button>

                    <button
                      onClick={() => {
                        setNewSourceType("faq");
                        setNewSourceTitle("Dúvida Frequente");
                        setNewSourceContent("");
                        setNewSourceModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-blue-400 hover:shadow-sm"
                    >
                      <HelpCircle className="size-5 text-amber-600" />
                      <strong className="mt-1.5 text-xs font-bold text-slate-900">FAQ / Dúvida</strong>
                      <small className="text-[10px] text-slate-400">Pergunta e resposta</small>
                    </button>
                  </div>
                </div>

                {/* Lista de Fontes Indexadas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Fontes Ativas no Agente ({filteredKb.length})</span>
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={kbSearchQuery}
                        onChange={(e) => setKbSearchQuery(e.target.value)}
                        placeholder="Filtrar fontes..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {filteredKb.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {item.type === "text" && <FileText className="size-4 text-blue-600" />}
                          {item.type === "website" && <Globe className="size-4 text-emerald-600" />}
                          {item.type === "document" && <FileUp className="size-4 text-violet-600" />}
                          {item.type === "faq" && <HelpCircle className="size-4 text-amber-600" />}
                          <strong className="text-xs font-bold text-slate-900">{item.title}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {(item.charCount || item.content.length)} caracteres
                          </span>
                          <Badge className="bg-emerald-50 text-[9px] text-emerald-700">
                            Indexado
                          </Badge>
                          <button
                            onClick={() => handleRemoveKnowledgeItem(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remover fonte"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ABA 2: INTENÇÕES & AÇÕES (O DIFERENCIAL DO GPT MAKER)          */}
            {/* ============================================================== */}
            {currentTab === "intents" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        O que são Intenções no GPT Maker?
                      </strong>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                        Intenções permitem que o agente reconheça o objetivo do cliente e execute ações práticas de negócios: <strong>mover no Pipeline do CRM</strong>, <strong>disparar transbordo</strong> ou <strong>acionar webhook</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Intenções Cadastradas</span>
                  <Button onClick={() => setNewIntentModalOpen(true)} variant="secondary" size="sm" className="h-8 text-xs">
                    <Plus className="mr-1 size-3.5" /> Nova Intenção
                  </Button>
                </div>

                <div className="space-y-3">
                  {(activeAgent.intents || []).map((intent) => (
                    <div
                      key={intent.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className={`size-4 ${intent.isActive ? "text-amber-500" : "text-slate-300"}`} />
                          <strong className="text-xs font-bold text-slate-900">{intent.name}</strong>
                          <Badge className="bg-slate-100 text-[10px] text-slate-600 capitalize">
                            Ação: {intent.actionType.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={intent.isActive}
                              onChange={() => handleToggleIntent(intent.id)}
                              className="size-4 rounded accent-blue-600"
                            />
                            <span>{intent.isActive ? "Ativa" : "Pausada"}</span>
                          </label>
                          <button
                            onClick={() => handleDeleteIntent(intent.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remover intenção"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">{intent.description}</p>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400">Frases de Gatilho:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {intent.samplePhrases.map((phrase, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                            >
                              &ldquo;{phrase}&rdquo;
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ABA 3: INSTRUÇÕES & REGRAS                                     */}
            {/* ============================================================== */}
            {currentTab === "instructions" && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Objetivo & Prompt Mestre</label>
                  <textarea
                    rows={4}
                    value={activeAgent.systemPrompt}
                    onChange={(e) => updateActiveAgent({ systemPrompt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Regras O que DEVE fazer */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-800">Diretrizes de Conduta (O que DEVE Fazer)</strong>
                    <Button onClick={() => handleAddRule("should")} variant="secondary" size="sm" className="h-7 text-[11px]">
                      <Plus className="mr-1 size-3" /> Regra
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(activeAgent.rulesShouldDo || []).map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => {
                            const updated = [...(activeAgent.rulesShouldDo || [])];
                            updated[idx] = e.target.value;
                            updateActiveAgent({ rulesShouldDo: updated });
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleRemoveRule("should", idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restrições Estritas (Guardrails) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-800">Restrições Estritas (O que NUNCA Fazer)</strong>
                    <Button onClick={() => handleAddRule("never")} variant="secondary" size="sm" className="h-7 text-[11px]">
                      <Plus className="mr-1 size-3" /> Restrição
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(activeAgent.rulesNeverDo || []).map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => {
                            const updated = [...(activeAgent.rulesNeverDo || [])];
                            updated[idx] = e.target.value;
                            updateActiveAgent({ rulesNeverDo: updated });
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleRemoveRule("never", idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ABA 4: IDENTIDADE & MODELO                                     */}
            {/* ============================================================== */}
            {currentTab === "identity" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Nome do Agente</label>
                    <input
                      type="text"
                      value={activeAgent.name}
                      onChange={(e) => updateActiveAgent({ name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Função Comercial</label>
                    <input
                      type="text"
                      value={activeAgent.role}
                      onChange={(e) => updateActiveAgent({ role: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Provedor LLM</label>
                    <select
                      value={activeAgent.provider}
                      onChange={(e) => updateActiveAgent({ provider: e.target.value as AgentProvider })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Modelo</label>
                    <input
                      type="text"
                      value={activeAgent.model}
                      onChange={(e) => updateActiveAgent({ model: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Mensagem de Boas-Vindas</label>
                  <textarea
                    rows={2}
                    value={activeAgent.welcomeMessage || ""}
                    onChange={(e) => updateActiveAgent({ welcomeMessage: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ABA 5: TRANSBORDO HUMANO (HANDOFF)                             */}
            {/* ============================================================== */}
            {currentTab === "handoff" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <strong className="block text-xs font-bold text-slate-900">Transferência Automática para Humano</strong>
                    <p className="text-[11px] text-slate-500">Pausa o agente quando o cliente pedir atendimento real.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeAgent.fallbackToHuman}
                    onChange={(e) => updateActiveAgent({ fallbackToHuman: e.target.checked })}
                    className="size-4 rounded accent-blue-600"
                  />
                </div>

                {activeAgent.fallbackToHuman && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">Palavras-chave de Gatilho (separadas por vírgula)</label>
                      <input
                        type="text"
                        value={activeAgent.handoffKeywords?.join(", ") || ""}
                        onChange={(e) =>
                          updateActiveAgent({
                            handoffKeywords: e.target.value.split(",").map((s) => s.trim()),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">Mensagem de Transferência</label>
                      <input
                        type="text"
                        value={activeAgent.handoffMessage || ""}
                        onChange={(e) => updateActiveAgent({ handoffMessage: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUNA DIREITA (40%): SIMULADOR AO VIVO COM TELEMETRIA    */}
        {/* ========================================================= */}
        <div className="flex flex-col bg-slate-50/50 lg:col-span-5 overflow-hidden">
          {/* Header do Chat */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Bot className="size-4" />
              </div>
              <div>
                <strong className="block text-xs font-bold text-slate-900">{activeAgent.name}</strong>
                <p className="text-[10px] text-slate-400">Preview ao Vivo • WhatsApp Sandbox</p>
              </div>
            </div>

            <Button onClick={handleResetChat} variant="secondary" size="sm" className="h-7 px-2 text-xs" title="Limpar conversa">
              <RotateCcw className="size-3.5" />
            </Button>
          </div>

          {/* Contexto do Lead Simulado */}
          <div className="border-b border-slate-200 bg-white px-4 py-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Testando como:</span>
            <input
              type="text"
              value={simulatedLead.name || ""}
              onChange={(e) => setSimulatedLead({ ...simulatedLead, name: e.target.value })}
              className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 text-right focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Janela de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === "lead";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-900 rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span
                      className={`mt-1 block text-right text-[9px] ${
                        isUser ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Bot className="size-3.5 animate-spin text-blue-600" />
                <span>{activeAgent.name} está formulando resposta com o Agno...</span>
              </div>
            )}
          </div>

          {/* Botões de Objeções Rápidas */}
          <div className="border-t border-slate-200 bg-white px-3 py-2">
            <span className="text-[10px] font-bold text-slate-400">Testar Gatilhos Rápidos:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {[
                "Qual o preço de um site?",
                "Vocês parcelam no cartão?",
                "Qual o prazo de entrega?",
                "Pode me ligar amanhã?",
                "Quero falar com humano",
              ].map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendSimulatedMessage(sug)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Input de Envio */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSendSimulatedMessage();
                }}
                placeholder="Simule a resposta do cliente..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              <Button onClick={() => void handleSendSimulatedMessage()} disabled={loading} variant="primary" size="sm" className="h-9 px-3">
                <Send className="size-3.5" />
              </Button>
            </div>

            {/* Painel de Telemetria / Diagnóstico estilo GPT Maker */}
            <div className="mt-2.5 rounded-lg border border-slate-200 bg-white p-2 text-[10px] text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Intenção Ativada:</span>
                <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">{lastDebug.detectedIntent}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Fontes RAG Consultadas:</span>
                <span className="text-slate-700 truncate max-w-[200px]">{lastDebug.sourcesUsed?.join(", ") || "Base Geral"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status Handoff:</span>
                <strong className={lastDebug.shouldHandoff ? "text-red-600" : "text-emerald-600"}>
                  {lastDebug.shouldHandoff ? "Disparado (Transferir)" : "IA Respondendo"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Fonte de Conhecimento (Padrão GPT Maker) */}
      {newSourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Adicionar Fonte de Treinamento • {newSourceType.toUpperCase()}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Insira dados objetivos para alimentar o modelo RAG do agente.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Título / Referência da Fonte</label>
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="Ex: Tabela de Preços, Política de Prazos..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {newSourceType === "website" ? "URL do Site para Rastrear" : "Conteúdo Factual / Informações"}
                </label>
                {newSourceType === "website" ? (
                  <input
                    type="url"
                    value={newSourceContent}
                    onChange={(e) => setNewSourceContent(e.target.value)}
                    placeholder="https://minhaagencia.com.br/servicos"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <textarea
                    rows={5}
                    value={newSourceContent}
                    onChange={(e) => setNewSourceContent(e.target.value)}
                    placeholder="Escreva afirmações claras e fatos diretos sobre sua empresa..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setNewSourceModalOpen(false)} variant="secondary" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleAddKnowledgeSource} variant="primary" size="sm">
                Indexar no Agente
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Adicionar Nova Intenção (Padrão GPT Maker) */}
      {newIntentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Configurar Nova Intenção Comercial</h3>
            <p className="mt-1 text-xs text-slate-500">
              Defina o gatilho da conversa e a ação automatizada que o agente executará.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Nome da Intenção</label>
                <input
                  type="text"
                  value={newIntentName}
                  onChange={(e) => setNewIntentName(e.target.value)}
                  placeholder="Ex: pedir_desconto, agendar_visita"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Descrição do Objetivo</label>
                <input
                  type="text"
                  value={newIntentDescription}
                  onChange={(e) => setNewIntentDescription(e.target.value)}
                  placeholder="Ex: Quando o cliente pede desconto ou negocia prazo"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Ação a Executar</label>
                <select
                  value={newIntentActionType}
                  onChange={(e) => setNewIntentActionType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="move_kanban">Mover Etapa no CRM / Pipeline</option>
                  <option value="handoff_human">Transferir para Atendente Humano</option>
                  <option value="send_quick_reply">Disparar Script de Resposta Rápida</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Frases de Exemplo do Cliente (uma por linha)
                </label>
                <textarea
                  rows={4}
                  value={newIntentSamplePhrases}
                  onChange={(e) => setNewIntentSamplePhrases(e.target.value)}
                  placeholder={"tem desconto à vista?\nconsegue fazer mais barato?\nqual o menor valor?"}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setNewIntentModalOpen(false)} variant="secondary" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleAddIntent} variant="primary" size="sm">
                Criar Intenção
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
