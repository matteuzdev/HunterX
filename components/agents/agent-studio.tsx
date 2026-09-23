"use client";

import { useState, useEffect } from "react";
import {
  Bot, Sparkles, Plus, Trash2, Save, Play, BookOpen, ShieldAlert,
  Sliders, MessageSquare, Check, ArrowRight, Copy, CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAgent, AgentKnowledgeItem, AgentTone, AgentProvider } from "@/lib/hunter/types";
import { DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";

const AGENTS_STORAGE_KEY = "hunterx-agents";

export function AgentStudio({
  onTestAgent,
}: {
  onTestAgent?: (agent: AIAgent) => void;
}) {
  const [agents, setAgents] = useState<AIAgent[]>(DEFAULT_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  const [savedNotice, setSavedNotice] = useState(false);

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
      name: "Novo Consultor Especialista",
      avatar: "bot",
      role: "Qualificação & Prospecção",
      tone: "consultivo",
      provider: "openai",
      model: "gpt-4o-mini",
      systemPrompt: "Você é um consultor comercial focado em apresentar oportunidades de expansão digital e agendar diagnósticos.",
      knowledgeBase: [],
      fallbackToHuman: true,
      handoffKeywords: ["humano", "atendente", "falar com pessoa"],
      isActive: true,
      assignedNiches: ["Geral"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...agents, newAgent];
    persistAgents(updated);
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
    const updated = [...agents, copy];
    persistAgents(updated);
    setSelectedAgentId(copy.id);
  }

  function handleDeleteAgent(agentId: string) {
    if (agents.length <= 1) {
      alert("É necessário manter pelo menos um agente cadastrado.");
      return;
    }
    const updated = agents.filter((a) => a.id !== agentId);
    persistAgents(updated);
    setSelectedAgentId(updated[0].id);
  }

  function handleAddKnowledgeItem() {
    const newItem: AgentKnowledgeItem = {
      id: `know-${Date.now()}`,
      type: "faq",
      title: "Nova Objeção / Dúvida Comum",
      content: "Escreva aqui a orientação e a resposta que o agente deve usar.",
    };

    updateActiveAgent({
      knowledgeBase: [...activeAgent.knowledgeBase, newItem],
    });
  }

  function handleRemoveKnowledgeItem(id: string) {
    updateActiveAgent({
      knowledgeBase: activeAgent.knowledgeBase.filter((k) => k.id !== id),
    });
  }

  function handleSave() {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  }

  return (
    <section className="space-y-6">
      {/* Cabeçalho no padrão HunterX */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-600">Inteligência Artificial</p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-slate-900">Agentes de IA</h1>
          <p className="mt-2 text-sm text-slate-500">
            Configure a personalidade, prompt mestre, base de conhecimento e regras de transbordo humano.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <Badge className="bg-emerald-50 text-emerald-700">
              <Check className="mr-1 size-3" /> Alterações salvas
            </Badge>
          )}

          <Button onClick={handleCreateAgent} variant="secondary">
            <Plus className="mr-1.5 size-4" /> Novo Agente
          </Button>

          <Button
            onClick={() => onTestAgent?.(activeAgent)}
            variant="primary"
          >
            <Play className="mr-1.5 size-4" /> Testar no Simulador
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Painel Esquerdo: Seletor de Agentes */}
        <div className="space-y-3 lg:col-span-4">
          <Card className="divide-y divide-slate-100 border border-slate-200 bg-white p-2 shadow-sm">
            <div className="p-3">
              <span className="text-[11px] font-black uppercase tracking-[.1em] text-slate-400">Agentes Cadastrados</span>
            </div>

            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition ${
                    isSelected
                      ? "border border-blue-200 bg-blue-50/50 shadow-sm"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
                    <Bot className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-bold text-slate-900">
                      {agent.name}
                    </strong>
                    <small className="block truncate text-[11px] text-slate-500">{agent.role}</small>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge className="bg-blue-50 text-[9px] text-blue-700 capitalize font-medium">
                        {agent.tone}
                      </Badge>
                      <Badge className="bg-slate-100 text-[9px] text-slate-600">
                        {agent.knowledgeBase.length} docs
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </Card>
        </div>

        {/* Painel Direito: Editor do Agente */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <Bot className="size-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{activeAgent.name}</h2>
                  <p className="text-xs text-slate-500">{activeAgent.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDuplicateAgent(activeAgent)}
                  variant="secondary"
                  size="sm"
                  title="Duplicar este agente"
                >
                  <Copy className="mr-1.5 size-3.5" /> Duplicar
                </Button>

                <Button
                  onClick={() => {
                    if (confirm(`Deseja excluir o agente "${activeAgent.name}"?`)) {
                      handleDeleteAgent(activeAgent.id);
                    }
                  }}
                  variant="danger"
                  size="sm"
                  title="Excluir este agente"
                >
                  <Trash2 className="size-4" />
                </Button>

                <Button onClick={handleSave} variant="primary" size="sm">
                  <Save className="mr-1.5 size-3.5" /> Salvar Agente
                </Button>
              </div>
            </div>

            {/* Configurações de Identidade */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Nome do Agente</label>
                <input
                  type="text"
                  value={activeAgent.name}
                  onChange={(e) => updateActiveAgent({ name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Função / Cargo</label>
                <input
                  type="text"
                  value={activeAgent.role}
                  onChange={(e) => updateActiveAgent({ role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Tom de Voz</label>
                <select
                  value={activeAgent.tone}
                  onChange={(e) => updateActiveAgent({ tone: e.target.value as AgentTone })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="consultivo">Consultivo (Especialista e parceiro)</option>
                  <option value="persuasivo">Persuasivo (Foco em conversão e agendamento)</option>
                  <option value="formal">Formal & Institucional</option>
                  <option value="descontraido">Descontraído & Leve</option>
                  <option value="direto">Direto ao Ponto</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Provedor LLM</label>
                <select
                  value={activeAgent.provider}
                  onChange={(e) => updateActiveAgent({ provider: e.target.value as AgentProvider })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="openai">OpenAI (GPT-4o Mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="gemini">Google Gemini 2.0</option>
                  <option value="groq">Groq (Llama 3 70B)</option>
                </select>
              </div>
            </div>

            {/* Prompt Mestre */}
            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Prompt Mestre (System Prompt)</label>
                <span className="text-[10px] text-slate-400">
                  Variáveis: {"{lead_name}"}, {"{city}"}, {"{niche}"}
                </span>
              </div>
              <textarea
                rows={5}
                value={activeAgent.systemPrompt}
                onChange={(e) => updateActiveAgent({ systemPrompt: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Base de Conhecimento e Objeções */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Base de Conhecimento & Objeções ({activeAgent.knowledgeBase.length})
                  </h3>
                </div>
                <Button
                  onClick={handleAddKnowledgeItem}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="mr-1 size-3.5" /> Adicionar Tópico
                </Button>
              </div>

              <div className="space-y-3">
                {activeAgent.knowledgeBase.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = activeAgent.knowledgeBase.map((k) =>
                            k.id === item.id ? { ...k, title: e.target.value } : k
                          );
                          updateActiveAgent({ knowledgeBase: updated });
                        }}
                        className="flex-1 font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleRemoveKnowledgeItem(item.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={item.content}
                      onChange={(e) => {
                        const updated = activeAgent.knowledgeBase.map((k) =>
                          k.id === item.id ? { ...k, content: e.target.value } : k
                        );
                        updateActiveAgent({ knowledgeBase: updated });
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Regras de Transbordo Humano */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Transbordo para Atendente Humano</h4>
                  <p className="text-[11px] text-slate-500">
                    Pausa o robô automaticamente e notifica quando o cliente pedir uma pessoa real.
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
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Palavras de gatilho (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={activeAgent.handoffKeywords.join(", ")}
                    onChange={(e) =>
                      updateActiveAgent({
                        handoffKeywords: e.target.value.split(",").map((s) => s.trim()),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
