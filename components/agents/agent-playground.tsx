"use client";

import { useState, useEffect } from "react";
import {
  Play, Bot, User, Send, RotateCcw, Sparkles, CheckCircle2, ShieldAlert,
  Flame, Terminal, ArrowRight, MessageSquare
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAgent, ChatMessage, Lead } from "@/lib/hunter/types";
import { DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";

const AGENTS_STORAGE_KEY = "hunterx-agents";

export function AgentPlayground({
  initialAgent,
}: {
  initialAgent?: AIAgent;
}) {
  const [agents, setAgents] = useState<AIAgent[]>(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(initialAgent || DEFAULT_AGENTS[0]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAgents(parsed);
          if (initialAgent) {
            const found = parsed.find((a: AIAgent) => a.id === initialAgent.id);
            if (found) setSelectedAgent(found);
          } else {
            setSelectedAgent(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.error("Erro ao carregar agentes no playground:", e);
    }
  }, [initialAgent]);

  // Contexto simulado do Lead
  const [simulatedLead, setSimulatedLead] = useState<Partial<Lead>>({
    name: "Clínica Dental Prime",
    category: "Clínica Odontológica",
    city: "Campina Grande, PB",
    score: 85,
    temperature: "Quente",
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "p1",
      conversationId: "sandbox",
      sender: "agent",
      content: `Olá equipe da ${simulatedLead.name}! Aqui é ${selectedAgent.name}. Notei a excelente reputação de vocês no Google em ${simulatedLead.city}!`,
      timestamp: new Date().toISOString(),
      status: "read",
      agentName: selectedAgent.name,
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

  async function handleSend(customText?: string) {
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

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: selectedAgent,
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
          agentName: selectedAgent.name,
        };

        setMessages((prev) => [...prev, agentReply]);
        setLastDebug({
          detectedIntent: data.detectedIntent,
          shouldHandoff: data.shouldHandoff,
          confidence: data.confidence,
        });
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        id: `p-${Date.now()}`,
        conversationId: "sandbox",
        sender: "agent",
        content: `Olá equipe da ${simulatedLead.name}! Aqui é ${selectedAgent.name}. Analisei o perfil de vocês em ${simulatedLead.city} e percebi oportunidades claras de aumento de captação!`,
        timestamp: new Date().toISOString(),
        status: "read",
        agentName: selectedAgent.name,
      },
    ]);
    setLastDebug({
      detectedIntent: "reset_conversa",
      shouldHandoff: false,
      confidence: 1.0,
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-indigo-400">
            Sandbox • Simulação de Abordagem
          </p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-white">Agent Playground</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgent.id}
            onChange={(e) => {
              const a = agents.find((ag) => ag.id === e.target.value);
              if (a) setSelectedAgent(a);
            }}
            className="rounded-xl border border-white/10 bg-[#0f172a] px-3.5 py-2 text-xs text-white focus:outline-none"
          >
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.avatar} {ag.name}
              </option>
            ))}
          </select>

          <Button onClick={handleReset} variant="outline" className="border-white/10 text-xs">
            <RotateCcw className="mr-1.5 size-3.5" /> Reiniciar Simulação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Painel do Chat do Playground */}
        <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] lg:col-span-8">
          <div className="flex items-center justify-between border-b border-white/5 bg-[#0b1120] px-5 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedAgent.avatar}</span>
              <strong className="text-white">{selectedAgent.name}</strong>
              <Badge className="bg-blue-500/10 text-[9px] text-blue-300">Modo Sandbox</Badge>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span>Simulando:</span>
              <strong className="text-slate-200">{simulatedLead.name}</strong>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.map((m) => {
              const isLead = m.sender === "lead";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isLead ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isLead
                        ? "rounded-tr-sm bg-emerald-700 text-white"
                        : "rounded-tl-sm bg-[#1e293b] text-slate-100"
                    }`}
                  >
                    {!isLead && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-blue-300">
                        <Bot className="size-3" />
                        <span>{m.agentName}</span>
                      </div>
                    )}
                    <p>{m.content}</p>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="size-3.5 animate-spin text-blue-400" />
                <span>O agente está formulando a resposta...</span>
              </div>
            )}
          </div>

          {/* Sugestões Rápidas de Teste */}
          <div className="flex gap-2 overflow-x-auto border-t border-white/5 bg-white/[0.01] p-2.5 text-[11px]">
            <span className="shrink-0 text-slate-500 py-1">Testes Rápidos:</span>
            {[
              "Quanto custa esse serviço?",
              "Nós já temos agência que faz nosso marketing",
              "Não tenho interesse no momento",
              "Quero falar com uma pessoa real",
            ].map((promptText) => (
              <button
                key={promptText}
                onClick={() => void handleSend(promptText)}
                className="shrink-0 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-slate-300 hover:bg-white/10"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/5 bg-[#0b1120] p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite como se fosse o cliente da empresa..."
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="bg-blue-600 px-4 text-white hover:bg-blue-500"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Coluna Direita: Auditoria & Debug do Agente */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-white/10 bg-[#0f172a] p-5 text-slate-100">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Terminal className="size-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Debug do Agente</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Última Intenção Detectada</span>
                <div className="mt-1 flex items-center justify-between">
                  <strong className="text-blue-300 font-mono">{lastDebug.detectedIntent}</strong>
                  <Badge className="bg-emerald-500/10 text-emerald-400">
                    {Math.round(lastDebug.confidence * 100)}% conf
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status de Transbordo</span>
                <div className="mt-1 flex items-center gap-2">
                  {lastDebug.shouldHandoff ? (
                    <Badge className="bg-rose-500/15 text-rose-300">
                      <ShieldAlert className="mr-1 size-3" /> Transbordo Ativado
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="mr-1 size-3" /> Autônomo (Sem Transbordo)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contexto Injetado</span>
                <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                  <div><strong>Empresa:</strong> {simulatedLead.name}</div>
                  <div><strong>Cidade:</strong> {simulatedLead.city}</div>
                  <div><strong>Nicho:</strong> {simulatedLead.category}</div>
                  <div><strong>Docs de RAG:</strong> {selectedAgent.knowledgeBase.length} tópicos</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

