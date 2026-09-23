"use client";

import { useState, useEffect } from "react";
import {
  Bot, Sparkles, Plus, Trash2, Save, Play, BookOpen, ShieldAlert,
  Sliders, MessageSquare, Check, ArrowRight, Copy, CheckCircle2,
  Settings, Database, Cpu, Send, RotateCcw, User, Terminal,
  HelpCircle, Link, FileText, CheckCheck, Zap, Shield, Search
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAgent, AgentKnowledgeItem, AgentTone, AgentProvider, ChatMessage, Lead } from "@/lib/hunter/types";
import { DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";

const AGENTS_STORAGE_KEY = "hunterx-agents";

type StudioTab = "identity" | "instructions" | "knowledge" | "tools";

export function AgentStudio() {
  const [agents, setAgents] = useState<AIAgent[]>(DEFAULT_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  const [currentTab, setCurrentTab] = useState<StudioTab>("identity");
  const [savedNotice, setSavedNotice] = useState(false);
  const [kbSearchQuery, setKbSearchQuery] = useState("");

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
      name: "Novo Especialista Comercial",
      avatar: "bot",
      role: "Prospecção & Qualificação de Sites",
      tone: "consultivo",
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
      welcomeMessage: "Olá! Analisei a presença digital da {lead_name} em {city} e identifiquei oportunidades para aumentar o fluxo de clientes.",
      systemPrompt: "Você é um consultor comercial sênior focado em qualificar donos de empresas e agendar diagnósticos rápidos de presença digital.",
      rulesShouldDo: [
        "Foque em gerar curiosidade sobre oportunidades de melhoria no posicionamento da empresa.",
        "Seja empático, direto e use linguagem profissional e acessível.",
        "Proponha sempre um diagnóstico sem custo de 10 minutos para apresentar a análise visual.",
      ],
      rulesNeverDo: [
        "Nunca passe valores fixos sem antes realizar o diagnóstico e entender a necessidade.",
        "Nunca critique agressivamente o site atual do cliente; aponte como oportunidade de crescimento.",
        "Não continue insistindo se o cliente recusar expressamente 2 vezes.",
      ],
      enableKanbanTool: true,
      enableWebSearchTool: true,
      knowledgeBase: [
        {
          id: `know-${Date.now()}-1`,
          type: "faq",
          title: "Por que minha empresa precisa de um site novo?",
          content: "Sites rápidos e modernos com notas 90+ no Google convertem até 3x mais visitantes em contatos no WhatsApp do que páginas lentas ou perfis de redes sociais.",
        },
        {
          id: `know-${Date.now()}-2`,
          type: "objection",
          title: "Já usamos Instagram, não precisamos de site",
          content: "O Instagram é ótimo para relacionamento, mas 80% das buscas de intenção de compra imediata acontecem no Google. Sem um site com carregamento instantâneo, você perde clientes para concorrentes.",
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

  function handleAddKnowledgeItem(type: "faq" | "service" | "objection" | "link" = "faq") {
    const newItem: AgentKnowledgeItem = {
      id: `know-${Date.now()}`,
      type,
      title: type === "objection" ? "Nova Quebra de Objeção" : "Nova Pergunta / Informação",
      content: "Insira aqui as instruções detalhadas que o agente deve usar como fonte oficial de verdade.",
    };
    updateActiveAgent({
      knowledgeBase: [...(activeAgent.knowledgeBase || []), newItem],
    });
  }

  function handleRemoveKnowledgeItem(id: string) {
    updateActiveAgent({
      knowledgeBase: (activeAgent.knowledgeBase || []).filter((k) => k.id !== id),
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

  function handleInsertVariable(tag: string) {
    updateActiveAgent({
      systemPrompt: `${activeAgent.systemPrompt} ${tag}`,
    });
  }

  // ==========================================
  // PLAYGROUND ACOPLADO (LADO DIREITO)
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
      content: (activeAgent.welcomeMessage || "Olá equipe da {lead_name}! Analisei a presença de vocês em {city} e identifiquei pontos para aumentar a captação.")
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
  }>({
    detectedIntent: "apresentacao_inicial",
    shouldHandoff: false,
    confidence: 0.95,
  });

  // Atualiza mensagem inicial do chat se mudar o agente ativo
  useEffect(() => {
    setChatMessages([
      {
        id: `p-${Date.now()}`,
        conversationId: "sandbox",
        sender: "agent",
        content: (activeAgent.welcomeMessage || "Olá equipe da {lead_name}! Analisei a presença de vocês em {city} e identifiquei pontos para aumentar a captação.")
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
        setLastDebug({
          detectedIntent: data.detectedIntent,
          shouldHandoff: data.shouldHandoff,
          confidence: data.confidence || 0.95,
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
        content: (activeAgent.welcomeMessage || "Olá equipe da {lead_name}! Analisei a presença de vocês em {city} e identifiquei pontos para aumentar a captação.")
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
    });
  }

  const filteredKb = (activeAgent.knowledgeBase || []).filter((item) =>
    item.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(kbSearchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Barra de Cockpit Superior no estilo GPT Maker / Converza */}
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
              <Check className="mr-1 size-3" /> Salvo no sistema
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
            <Save className="mr-1 size-3.5" /> Publicar
          </Button>
        </div>
      </div>

      {/* Corpo Split-Screen: Esquerda = Configurações com Abas | Direita = Simulador Interativo */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* ========================================================= */}
        {/* COLUNA ESQUERDA (60%): CONFIGURADOR COMPLETO COM ABAS     */}
        {/* ========================================================= */}
        <div className="flex flex-col border-r border-slate-200 lg:col-span-7 overflow-hidden">
          {/* Navegação por Abas Profissionais */}
          <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 overflow-x-auto">
            <button
              onClick={() => setCurrentTab("identity")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition ${
                currentTab === "identity"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Settings className="size-3.5" /> Identidade & Modelo
            </button>

            <button
              onClick={() => setCurrentTab("instructions")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition ${
                currentTab === "instructions"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <MessageSquare className="size-3.5" /> Instruções & Regras
            </button>

            <button
              onClick={() => setCurrentTab("knowledge")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition ${
                currentTab === "knowledge"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Database className="size-3.5" /> Base de Conhecimento ({activeAgent.knowledgeBase?.length || 0})
            </button>

            <button
              onClick={() => setCurrentTab("tools")}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 transition ${
                currentTab === "tools"
                  ? "border-blue-600 text-blue-600 font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Cpu className="size-3.5" /> Ações & Transbordo
            </button>
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ABA 1: IDENTIDADE & MODELO */}
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
                    <label className="mb-1 block text-xs font-bold text-slate-700">Papel / Função Comercial</label>
                    <input
                      type="text"
                      value={activeAgent.role}
                      onChange={(e) => updateActiveAgent({ role: e.target.value })}
                      placeholder="Ex: Closer Especialista de Sites"
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
                      <option value="groq">Groq (Ultra Rápido)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Modelo de Inteligência</label>
                    <select
                      value={activeAgent.model}
                      onChange={(e) => updateActiveAgent({ model: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      {activeAgent.provider === "openai" && (
                        <>
                          <option value="gpt-4o-mini">GPT-4o Mini (Recomendado • Rápido & Econômico)</option>
                          <option value="gpt-4o">GPT-4o (Máxima Capacidade de Raciocínio)</option>
                        </>
                      )}
                      {activeAgent.provider === "anthropic" && (
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Altíssima Persuasão)</option>
                      )}
                      {activeAgent.provider === "gemini" && (
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Baixa Latência)</option>
                      )}
                      {activeAgent.provider === "groq" && (
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Velocidade Extrema)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Slider de Temperatura / Criatividade */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs font-bold text-slate-800">Temperatura (Criatividade)</strong>
                      <p className="text-[11px] text-slate-500">Valores baixos tornam o robô mais preciso e focado nas regras.</p>
                    </div>
                    <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                      {activeAgent.temperature ?? 0.7}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={activeAgent.temperature ?? 0.7}
                    onChange={(e) => updateActiveAgent({ temperature: parseFloat(e.target.value) })}
                    className="mt-3 w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.0 (Fiel e Preciso)</span>
                    <span>0.7 (Equilibrado Comercial)</span>
                    <span>1.0 (Muito Criativo)</span>
                  </div>
                </div>

                {/* Tom de Voz */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">Tom de Voz Comercial</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { id: "consultivo", label: "Consultivo", desc: "Especialista parceiro que orienta" },
                      { id: "persuasivo", label: "Persuasivo", desc: "Closer com foco em conversão" },
                      { id: "formal", label: "Formal", desc: "Institucional e corporativo" },
                      { id: "descontraido", label: "Descontraído", desc: "Leve e amigável" },
                      { id: "direto", label: "Direto ao Ponto", desc: "Objetivo e sem rodeios" },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => updateActiveAgent({ tone: tone.id as AgentTone })}
                        className={`rounded-xl border p-2.5 text-left transition ${
                          activeAgent.tone === tone.id
                            ? "border-blue-600 bg-blue-50/60 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <strong className="block text-xs font-bold text-slate-900">{tone.label}</strong>
                        <small className="block text-[10px] text-slate-500">{tone.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensagem de Boas-Vindas */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Mensagem de Abertura Automática</label>
                    <span className="text-[10px] text-slate-400">Disparada no início do fluxo</span>
                  </div>
                  <textarea
                    rows={3}
                    value={activeAgent.welcomeMessage || ""}
                    onChange={(e) => updateActiveAgent({ welcomeMessage: e.target.value })}
                    placeholder="Olá equipe da {lead_name}! Analisei a presença de vocês em {city}..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ABA 2: INSTRUÇÕES & REGRAS */}
            {currentTab === "instructions" && (
              <div className="space-y-5">
                {/* Variáveis Dinâmicas */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-bold text-slate-700">Variáveis Dinâmicas Disponíveis (Clique para inserir):</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["{lead_name}", "{city}", "{niche}", "{phone}"].map((variable) => (
                      <button
                        key={variable}
                        onClick={() => handleInsertVariable(variable)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:border-blue-500 hover:bg-blue-50"
                      >
                        + {variable}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Mestre */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Instrução Mestre de Comportamento</label>
                  <textarea
                    rows={5}
                    value={activeAgent.systemPrompt}
                    onChange={(e) => updateActiveAgent({ systemPrompt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* O que o Agente DEVE Fazer */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <strong className="text-xs font-bold text-slate-800">Regras de Conduta (O que DEVE Fazer)</strong>
                    </div>
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

                {/* O que o Agente NUNCA Deve Fazer (Guardrails) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="size-4 text-rose-600" />
                      <strong className="text-xs font-bold text-slate-800">Restrições Estritas (O que NUNCA Fazer)</strong>
                    </div>
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

            {/* ABA 3: BASE DE CONHECIMENTO (RAG) */}
            {currentTab === "knowledge" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={kbSearchQuery}
                      onChange={(e) => setKbSearchQuery(e.target.value)}
                      placeholder="Pesquisar documentos..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-1.5">
                    <Button onClick={() => handleAddKnowledgeItem("faq")} variant="secondary" size="sm" className="h-8 text-xs">
                      + FAQ
                    </Button>
                    <Button onClick={() => handleAddKnowledgeItem("objection")} variant="secondary" size="sm" className="h-8 text-xs">
                      + Objeção
                    </Button>
                    <Button onClick={() => handleAddKnowledgeItem("service")} variant="secondary" size="sm" className="h-8 text-xs">
                      + Serviço
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredKb.length ? (
                    filteredKb.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = (activeAgent.knowledgeBase || []).map((k) =>
                                k.id === item.id ? { ...k, title: e.target.value } : k
                              );
                              updateActiveAgent({ knowledgeBase: updated });
                            }}
                            className="flex-1 font-bold text-xs text-slate-900 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none"
                          />
                          <Badge className="bg-slate-200 text-[9px] text-slate-700 capitalize font-medium">
                            {item.type}
                          </Badge>
                          <button
                            onClick={() => handleRemoveKnowledgeItem(item.id)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={item.content}
                          onChange={(e) => {
                            const updated = (activeAgent.knowledgeBase || []).map((k) =>
                              k.id === item.id ? { ...k, content: e.target.value } : k
                            );
                            updateActiveAgent({ knowledgeBase: updated });
                          }}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      Nenhum tópico na base de conhecimento. Adicione FAQs ou quebras de objeções.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: AÇÕES & TRANSBORDO */}
            {currentTab === "tools" && (
              <div className="space-y-5">
                {/* Ferramentas Autônomas do Agno */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Ações & Ferramentas Nativas (Tool Calling)
                  </h4>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">Mover Lead no CRM Automaticamente</strong>
                      <p className="text-[11px] text-slate-500">
                        Quando o lead aceitar agendar ou pedir proposta, move a etapa no Pipeline sem intervenção humana.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeAgent.enableKanbanTool ?? true}
                      onChange={(e) => updateActiveAgent({ enableKanbanTool: e.target.checked })}
                      className="size-4 rounded accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">Pesquisa Web em Tempo Real (DuckDuckGo)</strong>
                      <p className="text-[11px] text-slate-500">
                        Permite ao agente investigar o site, redes sociais e notícias da empresa do lead na hora.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeAgent.enableWebSearchTool ?? true}
                      onChange={(e) => updateActiveAgent({ enableWebSearchTool: e.target.checked })}
                      className="size-4 rounded accent-blue-600"
                    />
                  </div>
                </div>

                {/* Regras de Transbordo Humano (Handoff) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">Transbordo para Atendente Humano</strong>
                      <p className="text-[11px] text-slate-500">
                        Pausa a IA e transfere a conversa para um atendente real se o cliente solicitar.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeAgent.fallbackToHuman}
                      onChange={(e) => updateActiveAgent({ fallbackToHuman: e.target.checked })}
                      className="size-4 rounded accent-blue-600"
                    />
                  </div>

                  {activeAgent.fallbackToHuman && (
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Palavras-chave de Gatilho (separadas por vírgula)
                        </label>
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
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Mensagem de Transferência Humana
                        </label>
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
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUNA DIREITA (40%): PLAYGROUND AO VIVO EM TEMPO REAL     */}
        {/* ========================================================= */}
        <div className="flex flex-col bg-slate-50/50 lg:col-span-5 overflow-hidden">
          {/* Header do Chat de Testes */}
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
                <span>{activeAgent.name} está digitando...</span>
              </div>
            )}
          </div>

          {/* Botões de Objeções Rápidas de Teste */}
          <div className="border-t border-slate-200 bg-white px-3 py-2">
            <span className="text-[10px] font-bold text-slate-400">Testar Gatilhos Rápidos:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {[
                "Quanto custa um site?",
                "Já tenho Instagram",
                "Quero falar com um humano",
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

          {/* Input de Envio do Teste */}
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

            {/* Painel de Diagnóstico em tempo real */}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100/70 px-2.5 py-1 text-[10px] text-slate-600">
              <span>Intenção: <strong>{lastDebug.detectedIntent}</strong></span>
              <span>Handoff: <strong>{lastDebug.shouldHandoff ? "Sim (Disparado)" : "Não"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
