"use client";

import { useState, useEffect } from "react";
import {
  Bot, Sparkles, Plus, Trash2, Save, Play, BookOpen, ShieldAlert,
  Sliders, MessageSquare, Check, ArrowRight, Copy
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

  // Carrega agentes persistidos no localStorage
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
      name: "Novo Agente Especialista",
      avatar: "🤖",
      role: "Atendimento & Prospecção",
      tone: "consultivo",
      provider: "openai",
      model: "gpt-4o-mini",
      systemPrompt: "Você é um consultor comercial focado em apresentar oportunidades e agendar diagnósticos.",
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
      alert("Você deve manter pelo menos um agente cadastrado.");
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
      title: "Nova Pergunta / Objeção",
      content: "Escreva aqui a resposta padrão que o agente deve usar.",
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-500">
            Studio IA • Estilo GPT Maker / Converza / Zaya
          </p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-white">Agent Studio</h1>
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <Badge className="bg-emerald-500/15 text-emerald-300">
              <Check className="mr-1 size-3" /> Salvo com sucesso!
            </Badge>
          )}

          <Button onClick={handleCreateAgent} variant="outline" className="border-white/10 text-xs">
            <Plus className="mr-1.5 size-3.5" /> Criar Novo Agente
          </Button>

          <Button
            onClick={() => onTestAgent?.(activeAgent)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs text-white"
          >
            <Play className="mr-1.5 size-3.5" /> Testar no Playground
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda: Seletor de Agentes */}
        <div className="space-y-3 lg:col-span-4">
          <Card className="divide-y divide-white/5 border border-white/10 bg-[#0f172a] p-2">
            <div className="p-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Meus Agentes</h2>
            </div>

            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition ${
                    isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/5 text-xl">
                    {agent.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-bold text-white">
                      {agent.name}
                    </strong>
                    <small className="block truncate text-[11px] text-slate-400">{agent.role}</small>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge className="bg-blue-500/10 text-[9px] text-blue-300 capitalize">
                        {agent.tone}
                      </Badge>
                      <Badge className="bg-white/5 text-[9px] text-slate-400">
                        {agent.knowledgeBase.length} docs
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </Card>
        </div>

        {/* Coluna Direita: Editor Completo do Agente */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="border border-white/10 bg-[#0f172a] p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-blue-500/10 text-2xl">
                  {activeAgent.avatar}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">{activeAgent.name}</h2>
                  <p className="text-xs text-slate-400">{activeAgent.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDuplicateAgent(activeAgent)}
                  variant="outline"
                  className="border-white/10 text-xs text-slate-300 hover:text-white"
                  title="Duplicar este agente"
                >
                  <Copy className="mr-1.5 size-3.5" /> Duplicar
                </Button>

                <Button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir o agente "${activeAgent.name}"?`)) {
                      handleDeleteAgent(activeAgent.id);
                    }
                  }}
                  variant="outline"
                  className="border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  title="Excluir este agente"
                >
                  <Trash2 className="mr-1.5 size-3.5" /> Excluir
                </Button>

                <Button onClick={handleSave} className="bg-emerald-600 text-xs text-white hover:bg-emerald-500">
                  <Save className="mr-1.5 size-3.5" /> Salvar Agente
                </Button>
              </div>
            </div>

            {/* Identidade e Parâmetros */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Nome do Agente</label>
                <input
                  type="text"
                  value={activeAgent.name}
                  onChange={(e) => updateActiveAgent({ name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Emoji / Avatar</label>
                <input
                  type="text"
                  value={activeAgent.avatar}
                  onChange={(e) => updateActiveAgent({ avatar: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Tom de Voz</label>
                <select
                  value={activeAgent.tone}
                  onChange={(e) => updateActiveAgent({ tone: e.target.value as AgentTone })}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1120] px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="consultivo">Consultivo (Especialista parceiro)</option>
                  <option value="persuasivo">Persuasivo (Closer / Foco em conversão)</option>
                  <option value="formal">Formal & Institucional</option>
                  <option value="descontraido">Descontraído & Leve</option>
                  <option value="direto">Direto ao Ponto</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Provedor LLM</label>
                <select
                  value={activeAgent.provider}
                  onChange={(e) => updateActiveAgent({ provider: e.target.value as AgentProvider })}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1120] px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI (GPT-4o Mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="gemini">Google Gemini 2.0</option>
                  <option value="groq">Groq (Llama 3 70B Turbo)</option>
                </select>
              </div>
            </div>

            {/* Prompt Mestre */}
            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Prompt Mestre (System Prompt)</label>
                <span className="text-[10px] text-slate-500">
                  Variáveis suportadas: {"{lead_name}"}, {"{city}"}, {"{niche}"}
                </span>
              </div>
              <textarea
                rows={5}
                value={activeAgent.systemPrompt}
                onChange={(e) => updateActiveAgent({ systemPrompt: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Base de Conhecimento (RAG) */}
            <div className="mt-6 border-t border-white/5 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Base de Conhecimento & Objeções ({activeAgent.knowledgeBase.length})
                  </h3>
                </div>
                <Button
                  onClick={handleAddKnowledgeItem}
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-[11px]"
                >
                  <Plus className="mr-1 size-3" /> Adicionar Tópico
                </Button>
              </div>

              <div className="space-y-3">
                {activeAgent.knowledgeBase.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs"
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
                        className="flex-1 font-bold text-white bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleRemoveKnowledgeItem(item.id)}
                        className="text-slate-500 hover:text-rose-400"
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
                      className="mt-2 w-full rounded-lg border border-white/5 bg-white/[0.02] p-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Regras de Transbordo Humano */}
            <div className="mt-6 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Transbordo para Atendente Humano</h4>
                  <p className="text-[11px] text-slate-400">
                    Pausa o robô automaticamente e notifica quando o cliente pedir uma pessoa real.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={activeAgent.fallbackToHuman}
                  onChange={(e) => updateActiveAgent({ fallbackToHuman: e.target.checked })}
                  className="size-4 accent-blue-600"
                />
              </div>

              {activeAgent.fallbackToHuman && (
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] text-slate-400">
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
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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

