"use client";

import { useState, useEffect } from "react";
import {
  Play, Bot, User, Send, RotateCcw, Sparkles, CheckCircle2, ShieldAlert,
  Terminal, MessageSquare
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
      console.error("Erro ao carregar agentes no simulador:", e);
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
      content: `Olá equipe da ${simulatedLead.name}! Aqui é o consultor comercial da agência. Notei a excelente reputação de vocês no Google em ${simulatedLead.city}!`,
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
    } catch (e) {
      console.error("Erro no playground:", e);
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
        content: `Olá equipe da ${simulatedLead.name}! Aqui é o ${selectedAgent.name}. Analisei o perfil de vocês em ${simulatedLead.city} e percebi oportunidades claras de aumento de captação!`,
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
      {/* Cabeçalho no padrão HunterX */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-600">Ambiente de Simulação</p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-slate-900">Simulador de IA</h1>
          <p className="mt-2 text-sm text-slate-500">
            Valide as respostas e quebras de objeção do seu agente antes de publicar no WhatsApp real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgent.id}
            onChange={(e) => {
              const a = agents.find((ag) => ag.id === e.target.value);
              if (a) setSelectedAgent(a);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.role})
              </option>
            ))}
          </select>

          <Button onClick={handleReset} variant="secondary">
            <RotateCcw className="mr-1.5 size-3.5" /> Reiniciar Conversa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Painel Central: Chat Interativo de Teste */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header do Chat */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedAgent.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedAgent.provider.toUpperCase()} • Modelo: {selectedAgent.model}
                  </p>
                </div>
              </div>

              <Badge className="bg-emerald-50 text-emerald-700 font-semibold">
                Simulação Ativa
              </Badge>
            </div>

            {/* Mensagens do Simulador */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
              {messages.map((m) => {
                const isUser = m.sender === "lead";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
                      {isUser ? (
                        <>
                          <span>Você (como {simulatedLead.name})</span>
                          <User className="size-3" />
                        </>
                      ) : (
                        <>
                          <Bot className="size-3 text-blue-600" />
                          <span className="font-semibold text-slate-700">{selectedAgent.name}</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs shadow-sm ${
                        isUser
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-white border border-slate-200 text-slate-900 rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Bot className="size-4 animate-spin text-blue-600" />
                  <span>{selectedAgent.name} está formulando a resposta...</span>
                </div>
              )}
            </div>

            {/* Sugestões Rápidas de Teste */}
            <div className="border-t border-slate-100 bg-white px-4 py-2">
              <span className="mr-2 text-[10px] font-bold text-slate-400">Testar Objeções Rápidas:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[
                  "Quanto custa esse serviço?",
                  "Já temos perfil no Instagram, não precisamos de site.",
                  "Não tenho tempo agora, me chame semana que vem.",
                  "Quero falar com uma pessoa real, transfere por favor.",
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
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
                    if (e.key === "Enter") void handleSend();
                  }}
                  placeholder="Digite sua resposta simulando o cliente..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <Button onClick={() => void handleSend()} disabled={loading} variant="primary">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Painel Lateral: Telemetria & Contexto do Lead */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Contexto Simulado</span>
            <h3 className="mt-1 text-sm font-bold text-slate-900">Lead em Teste</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">Nome da Empresa</label>
                <input
                  type="text"
                  value={simulatedLead.name || ""}
                  onChange={(e) => setSimulatedLead({ ...simulatedLead, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">Nicho / Categoria</label>
                <input
                  type="text"
                  value={simulatedLead.category || ""}
                  onChange={(e) => setSimulatedLead({ ...simulatedLead, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">Cidade / Região</label>
                <input
                  type="text"
                  value={simulatedLead.city || ""}
                  onChange={(e) => setSimulatedLead({ ...simulatedLead, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Telemetria de Intenção e Handoff */}
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnóstico da IA</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Intenção Detectada</span>
                <Badge className="bg-blue-50 text-blue-700 font-semibold">{lastDebug.detectedIntent}</Badge>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Confiança do Modelo</span>
                <span className="font-bold text-slate-900">{(lastDebug.confidence * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-500">Gatilho de Transbordo</span>
                {lastDebug.shouldHandoff ? (
                  <Badge className="bg-red-50 text-red-700 font-bold">Transferir p/ Humano</Badge>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-700 font-medium">IA em Controle</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
