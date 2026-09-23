"use client";

import { useState, useEffect } from "react";
import {
  X, Bot, Sparkles, BookOpen, Layers, Shield, Sliders, MessageSquare,
  Plus, Trash2, Globe, FileText, HelpCircle, CheckCircle2, AlertCircle,
  ExternalLink, Check, Copy, UserCheck, Cpu, Search, Hash
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
} from "@/lib/hunter/types";

type ModalTab = "identity" | "training" | "intents" | "rules" | "handoff";

export function AgentEditModal({
  open,
  agent,
  onClose,
  onSave,
}: {
  open: boolean;
  agent?: AIAgent | null;
  onClose: () => void;
  onSave: (agent: AIAgent) => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>("identity");

  // Dados do Agente em edição
  const [formData, setFormData] = useState<AIAgent>(() => {
    return (
      agent || {
        id: `agent-${Date.now()}`,
        name: "Novo Agente HunterX",
        avatar: "bot",
        role: "Prospecção & Fechamento de Vendas",
        tone: "consultivo",
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        welcomeMessage:
          "Olá equipe da {lead_name}! Analisei a presença de vocês no Google em {city} e encontrei oportunidades para atrair mais clientes.",
        systemPrompt:
          "Você é um consultor comercial da agência focado em qualificar donos de negócios e agendar diagnósticos visuais de 10 minutos.",
        rulesShouldDo: [
          "Foque em entender se a empresa já possui site e se o site atual gera vendas pelo WhatsApp.",
          "Apresente sempre a oportunidade de realizar um diagnóstico visual sem custo de 10 minutos.",
        ],
        rulesNeverDo: [
          "Nunca passe valores fixos sem antes realizar o diagnóstico da empresa.",
          "Nunca critique agressivamente a estrutura do cliente; posicione como melhoria de oportunidade.",
        ],
        enableKanbanTool: true,
        enableWebSearchTool: true,
        knowledgeBase: [],
        intents: [],
        fallbackToHuman: true,
        handoffKeywords: ["humano", "atendente", "falar com pessoa", "processo", "advogado"],
        handoffMessage:
          "Com certeza! Estou transferindo seu atendimento para nosso consultor sênior humano agora mesmo.",
        isActive: true,
        assignedNiches: ["Geral"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  });

  // Estado para adicionar nova fonte de conhecimento (GPT Maker Standard)
  const [newSourceModalOpen, setNewSourceModalOpen] = useState(false);
  const [newSourceType, setNewSourceType] = useState<KnowledgeSourceType>("text");
  const [newSourceTitle, setNewSourceTitle] = useState("");
  const [newSourceContent, setNewSourceContent] = useState("");
  const [kbFilter, setKbFilter] = useState<string>("all");

  // Estado para adicionar nova intenção comercial
  const [newIntentModalOpen, setNewIntentModalOpen] = useState(false);
  const [newIntentName, setNewIntentName] = useState("");
  const [newIntentDescription, setNewIntentDescription] = useState("");
  const [newIntentSamplePhrases, setNewIntentSamplePhrases] = useState("");
  const [newIntentActionType, setNewIntentActionType] = useState<
    "move_kanban" | "handoff_human" | "send_quick_reply" | "webhook"
  >("move_kanban");

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    }
  }, [agent]);

  if (!open) return null;

  function updateField<K extends keyof AIAgent>(field: K, value: AIAgent[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Ações de Base de Conhecimento
  function handleAddKnowledgeSource() {
    if (!newSourceTitle.trim() || !newSourceContent.trim()) {
      alert("Informe o título e o conteúdo da fonte.");
      return;
    }

    const newSource: AgentKnowledgeItem = {
      id: `kb-${Date.now()}`,
      type: newSourceType,
      title: newSourceTitle.trim(),
      content: newSourceContent.trim(),
      charCount: newSourceContent.trim().length,
      status: "trained",
      updatedAt: new Date().toISOString(),
    };

    setFormData((prev) => ({
      ...prev,
      knowledgeBase: [newSource, ...prev.knowledgeBase],
    }));

    setNewSourceTitle("");
    setNewSourceContent("");
    setNewSourceModalOpen(false);
  }

  function handleDeleteKnowledgeSource(sourceId: string) {
    setFormData((prev) => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.filter((k) => k.id !== sourceId),
    }));
  }

  // Ações de Intenções Comerciais
  function handleAddIntent() {
    if (!newIntentName.trim()) {
      alert("Informe o nome da intenção.");
      return;
    }

    const phrases = newIntentSamplePhrases
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const newIntent: AgentIntent = {
      id: `intent-${Date.now()}`,
      name: newIntentName.trim(),
      description: newIntentDescription.trim(),
      samplePhrases: phrases.length > 0 ? phrases : ["frase de exemplo"],
      actionType: newIntentActionType,
      isActive: true,
    };

    setFormData((prev) => ({
      ...prev,
      intents: [...(prev.intents || []), newIntent],
    }));

    setNewIntentName("");
    setNewIntentDescription("");
    setNewIntentSamplePhrases("");
    setNewIntentModalOpen(false);
  }

  function handleDeleteIntent(intentId: string) {
    setFormData((prev) => ({
      ...prev,
      intents: (prev.intents || []).filter((i) => i.id !== intentId),
    }));
  }

  // Ações de Regras
  function handleAddShouldRule(rule: string) {
    if (!rule.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rulesShouldDo: [...(prev.rulesShouldDo || []), rule.trim()],
    }));
  }

  function handleDeleteShouldRule(index: number) {
    setFormData((prev) => ({
      ...prev,
      rulesShouldDo: (prev.rulesShouldDo || []).filter((_, i) => i !== index),
    }));
  }

  function handleAddNeverRule(rule: string) {
    if (!rule.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rulesNeverDo: [...(prev.rulesNeverDo || []), rule.trim()],
    }));
  }

  function handleDeleteNeverRule(index: number) {
    setFormData((prev) => ({
      ...prev,
      rulesNeverDo: (prev.rulesNeverDo || []).filter((_, i) => i !== index),
    }));
  }

  function handleSubmit() {
    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  }

  const filteredKnowledge = formData.knowledgeBase.filter((item) => {
    if (kbFilter === "all") return true;
    return item.type === kbFilter;
  });

  const totalCharacters = formData.knowledgeBase.reduce(
    (acc, item) => acc + (item.charCount || item.content.length),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
      <Card className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Bot className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900">
                {agent ? `Editar Agente: ${formData.name}` : "Criar Novo Agente de IA"}
              </h2>
              <p className="text-xs text-slate-500">
                Padrão GPT Maker: Identidade, Base de Conhecimento RAG, Intenções e Handoff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Abas Superiores Estilo GPT Maker */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
          {[
            { id: "identity" as const, label: "Identidade & Modelo", icon: Bot },
            { id: "training" as const, label: "Base de Conhecimento (RAG)", icon: BookOpen },
            { id: "intents" as const, label: "Intenções Comerciais", icon: Layers },
            { id: "rules" as const, label: "Regras de Conduta", icon: Shield },
            { id: "handoff" as const, label: "Transbordo Humano", icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
                {tab.id === "training" && formData.knowledgeBase.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] text-blue-700 font-bold">
                    {formData.knowledgeBase.length}
                  </span>
                )}
                {tab.id === "intents" && (formData.intents || []).length > 0 && (
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] text-indigo-700 font-bold">
                    {(formData.intents || []).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conteúdo com rolagem */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700">
          {/* ABA 1: IDENTIDADE & MODELO */}
          {activeTab === "identity" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Nome do Agente</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Ex: Lucas • Closer Comercial"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Papel / Função Comercial</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    placeholder="Ex: Qualificação de Leads & Agendamento de Demonstração"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Provedor de IA</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => updateField("provider", e.target.value as AgentProvider)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq (Llama 3)</option>
                    <option value="ollama">Agno / Local</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Modelo LLM</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    placeholder="gpt-4o-mini ou claude-3-5-sonnet"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Tom de Voz</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => updateField("tone", e.target.value as AgentTone)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="consultivo">Consultivo & Estratégico</option>
                    <option value="persuasivo">Persuasivo & Closer</option>
                    <option value="formal">Corporativo & Formal</option>
                    <option value="descontraido">Descontraído & Ágil</option>
                    <option value="direto">Direto ao Ponto</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-bold text-slate-700">Criatividade / Temperatura</label>
                  <span className="font-mono text-slate-500 font-bold">{formData.temperature ?? 0.7}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.temperature ?? 0.7}
                  onChange={(e) => updateField("temperature", parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.0 (Mais preciso e fatual)</span>
                  <span>1.0 (Mais criativo e fluido)</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Prompt do Sistema (Personalidade & Regras Principais)</label>
                <textarea
                  rows={4}
                  value={formData.systemPrompt}
                  onChange={(e) => updateField("systemPrompt", e.target.value)}
                  placeholder="Defina quem é o agente, seu objetivo comercial e como ele deve conduzir as conversas..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Mensagem de Boas-Vindas (Gatilho Inicial)
                </label>
                <textarea
                  rows={2}
                  value={formData.welcomeMessage || ""}
                  onChange={(e) => updateField("welcomeMessage", e.target.value)}
                  placeholder="Olá equipe da {lead_name}! Analisei a presença de vocês no Google em {city}..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Variáveis automáticas disponíveis: <code>{"{lead_name}"}</code>, <code>{"{city}"}</code>, <code>{"{category}"}</code>.
                </p>
              </div>
            </div>
          )}

          {/* ABA 2: BASE DE CONHECIMENTO RAG (PADRÃO GPT MAKER) */}
          {activeTab === "training" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div>
                  <h4 className="font-bold text-slate-900">Documentação & Treinamento da Empresa</h4>
                  <p className="text-[11px] text-slate-500">
                    O agente consultará essas fontes para tirar dúvidas com precisão cirúrgica sem alucinar.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Total Indexado</span>
                    <strong className="text-slate-800 font-mono">{totalCharacters.toLocaleString()} caracteres</strong>
                  </div>
                  <Button
                    onClick={() => setNewSourceModalOpen(true)}
                    variant="primary"
                    size="sm"
                  >
                    <Plus className="mr-1 size-3.5" /> Adicionar Fonte
                  </Button>
                </div>
              </div>

              {/* Filtros de Tipos de Fonte do GPT Maker */}
              <div className="flex gap-2">
                {[
                  { id: "all", label: "Todas as Fontes" },
                  { id: "text", label: "Texto / Fatos" },
                  { id: "website", label: "Websites / URLs" },
                  { id: "document", label: "Documentos" },
                  { id: "faq", label: "Perguntas & Respostas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setKbFilter(f.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      kbFilter === f.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lista de Fontes */}
              {filteredKnowledge.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <BookOpen className="size-8 text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-700">Nenhuma fonte cadastrada nesta categoria</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Adicione textos, links ou perguntas frequentes para enriquecer a IA.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredKnowledge.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              item.type === "text"
                                ? "bg-blue-50 text-blue-700"
                                : item.type === "website"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.type === "faq"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {item.type}
                          </span>
                          <strong className="truncate font-bold text-slate-900">{item.title}</strong>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          {item.content}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                          <span>{item.charCount || item.content.length} caracteres</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Treinado no Agente
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteKnowledgeSource(item.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: INTENÇÕES COMERCIAIS (GPT MAKER INTENTS) */}
          {activeTab === "intents" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div>
                  <h4 className="font-bold text-slate-900">Intenções Comerciais & Ações Automáticas</h4>
                  <p className="text-[11px] text-slate-500">
                    O agente detecta frases de exemplo do lead e executa automações como mover no CRM ou chamar humano.
                  </p>
                </div>
                <Button
                  onClick={() => setNewIntentModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  <Plus className="mr-1 size-3.5" /> Nova Intenção
                </Button>
              </div>

              {(formData.intents || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <Layers className="size-8 text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-700">Nenhuma intenção comercial configurada</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Crie intenções como "pedir_desconto", "agendar_reuniao" ou "duvida_preco".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(formData.intents || []).map((intent) => (
                    <div
                      key={intent.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">#{intent.name}</span>
                            <Badge className="bg-slate-100 text-[10px] text-slate-700 font-semibold">
                              Ação: {intent.actionType.replace("_", " ")}
                            </Badge>
                          </div>
                          {intent.description && (
                            <p className="mt-1 text-xs text-slate-500">{intent.description}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteIntent(intent.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Frases de Exemplo Reconhecidas:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {intent.samplePhrases.map((phrase, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700"
                            >
                              “{phrase}”
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: REGRAS DE CONDUTA */}
          {activeTab === "rules" && (
            <div className="space-y-6">
              {/* O que DEVE fazer */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900">Diretrizes Obrigatórias (O que o Agente DEVE Fazer)</h4>
                </div>
                <div className="mt-3 space-y-2">
                  {(formData.rulesShouldDo || []).map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-emerald-200/60">
                      <span className="text-xs text-slate-800">{rule}</span>
                      <button
                        onClick={() => handleDeleteShouldRule(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      id="input-should-rule"
                      placeholder="Adicionar nova diretriz..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddShouldRule((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById("input-should-rule") as HTMLInputElement;
                        if (el) {
                          handleAddShouldRule(el.value);
                          el.value = "";
                        }
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {/* O que NUNCA fazer */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-rose-600" />
                  <h4 className="font-bold text-slate-900">Linhas Vermelhas (O que o Agente NUNCA Deve Fazer)</h4>
                </div>
                <div className="mt-3 space-y-2">
                  {(formData.rulesNeverDo || []).map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-rose-200/60">
                      <span className="text-xs text-slate-800">{rule}</span>
                      <button
                        onClick={() => handleDeleteNeverRule(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      id="input-never-rule"
                      placeholder="Adicionar restrição rigorosa..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddNeverRule((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById("input-never-rule") as HTMLInputElement;
                        if (el) {
                          handleAddNeverRule(el.value);
                          el.value = "";
                        }
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 5: TRANSBORDO HUMANO */}
          {activeTab === "handoff" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Transbordo Automático para Atendente Humano</h4>
                    <p className="text-[11px] text-slate-500">
                      Quando ativado, o agente pausa suas respostas e alerta o painel do WhatsApp.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.fallbackToHuman}
                    onChange={(e) => updateField("fallbackToHuman", e.target.checked)}
                    className="size-4 rounded accent-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Palavras-Chave de Escape (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.handoffKeywords.join(", ")}
                  onChange={(e) =>
                    updateField(
                      "handoffKeywords",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="humano, atendente, falar com pessoa, processo, advogado"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Mensagem Automática de Transição
                </label>
                <textarea
                  rows={3}
                  value={formData.handoffMessage || ""}
                  onChange={(e) => updateField("handoffMessage", e.target.value)}
                  placeholder="Com certeza! Estou transferindo seu atendimento para nosso especialista humano agora mesmo."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                formData.isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            <span className="text-xs font-semibold text-slate-600">
              {formData.isActive ? "Agente Ativo" : "Agente Pausado"}
            </span>
            <button
              onClick={() => updateField("isActive", !formData.isActive)}
              className="ml-2 text-[11px] font-bold text-blue-600 hover:underline"
            >
              Alternar
            </button>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary" size="sm">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} variant="primary" size="sm">
              Salvar Agente
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Interno: Adicionar Nova Fonte RAG (GPT Maker) */}
      {newSourceModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Indexar Nova Fonte de Conhecimento</h3>
            <p className="mt-1 text-xs text-slate-500">
              Selecione o tipo de fonte segundo o padrão oficial do GPT Maker:
            </p>

            <div className="mt-4 flex gap-2">
              {[
                { type: "text" as const, label: "Texto / Fatos", icon: FileText },
                { type: "website" as const, label: "Website", icon: Globe },
                { type: "faq" as const, label: "FAQ", icon: HelpCircle },
                { type: "document" as const, label: "Documento", icon: BookOpen },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    onClick={() => setNewSourceType(t.type)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition ${
                      newSourceType === t.type
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Título de Identificação</label>
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="Ex: Política de Garantia, Valores dos Serviços, Link do Site"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {newSourceType === "website" ? "URL Completa da Página" : "Conteúdo da Fonte"}
                </label>
                {newSourceType === "website" ? (
                  <input
                    type="url"
                    value={newSourceContent}
                    onChange={(e) => setNewSourceContent(e.target.value)}
                    placeholder="https://suaempresa.com.br/sobre"
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
                Indexar Fonte
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Interno: Adicionar Nova Intenção Comercial */}
      {newIntentModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
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
