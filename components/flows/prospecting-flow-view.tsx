"use client";

import { useState, useEffect } from "react";
import {
  Workflow, Play, Clock, MessageSquare, Mic,
  Sliders, Bell, Plus, Trash2, ArrowDown, ArrowUp, Check,
  CheckCircle2, AlertCircle, Sparkles, FileText, ChevronRight,
  ZoomIn, ZoomOut, RotateCcw, X, Edit3, Settings, ShieldCheck,
  Bot, HelpCircle, Layers, ArrowRight, CornerDownRight, CheckCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FlowNodeType =
  | "trigger"
  | "delay"
  | "message"
  | "audio_ptt"
  | "menu"
  | "kanban_move"
  | "ai_agent";

export type FlowNode = {
  id: string;
  name: string;
  type: FlowNodeType;
  config: Record<string, any>;
};

export type AutomationFlow = {
  id: string;
  name: string;
  description: string;
  targetNiche: string;
  isActive: boolean;
  nodes: FlowNode[];
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_FLOWS: AutomationFlow[] = [
  {
    id: "flow-1",
    name: "Abordagem Inicial: Negócios Sem Website",
    description: "Sequência no estilo ManyChat com intervalo humanizado, áudio gravado e qualificação no WhatsApp.",
    targetNiche: "Geral",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "node-0",
        name: "Gatilho de Disparo",
        type: "trigger",
        config: {
          event: "lead_discovered",
          description: "Quando um lead sem website for marcado para contato",
        },
      },
      {
        id: "node-1",
        name: "Intervalo Inteligente (Digitando)",
        type: "delay",
        config: { seconds: 4, simulate_typing: true },
      },
      {
        id: "node-2",
        name: "Mensagem de Abertura WhatsApp",
        type: "message",
        config: {
          text: "Olá, equipe da {lead_name}! Tudo bem?\n\nVi a excelente reputação de vocês no Google em {city} e achei o trabalho incrível.",
        },
      },
      {
        id: "node-3",
        name: "Áudio Gravado de Diagnóstico (PTT)",
        type: "audio_ptt",
        config: {
          audio_url: "https://assets.hunterx.app/audios/diagnostico-site-v2.mp3",
          duration_seconds: 22,
          caption: "Áudio humanizado com análise rápida da presença digital.",
        },
      },
      {
        id: "node-4",
        name: "Menu Interativo de Resposta Rápida",
        type: "menu",
        config: {
          question: "Faria sentido apresentarmos esse diagnóstico de 10 minutos para sua equipe?",
          buttons: ["Sim, pode enviar", "Já temos agência", "Me chame depois"],
        },
      },
      {
        id: "node-5",
        name: "Mover Status no Pipeline CRM",
        type: "kanban_move",
        config: {
          target_column: "contatado",
        },
      },
    ],
  },
  {
    id: "flow-2",
    name: "Follow-up 24h: Proposta Sem Resposta",
    description: "Reativação sutil para leads que receberam o diagnóstico e não responderam.",
    targetNiche: "Geral",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "node-200",
        name: "Gatilho de Disparo",
        type: "trigger",
        config: {
          event: "no_reply_24h",
          description: "Quando o lead não responder após 24 horas do primeiro contato",
        },
      },
      {
        id: "node-201",
        name: "Aguardar 24 horas",
        type: "delay",
        config: { seconds: 86400, simulate_typing: false },
      },
      {
        id: "node-202",
        name: "Lembrete Curto com Pergunta Aberta",
        type: "message",
        config: {
          text: "Olá! Conseguiram ver os pontos que apontei no site de vocês ontem? Se fizer sentido, posso mostrar como aplicar em 10 min.",
        },
      },
      {
        id: "node-203",
        name: "Mover para Negociação",
        type: "kanban_move",
        config: {
          target_column: "negociacao",
        },
      },
    ],
  },
];

const FLOWS_STORAGE_KEY = "hunterx-automation-flows";

const NODE_DEFINITIONS: Record<
  FlowNodeType,
  { label: string; icon: any; headerBg: string; textColor: string; badgeBg: string; borderTheme: string; description: string }
> = {
  trigger: {
    label: "Gatilho Inicial",
    icon: Play,
    headerBg: "bg-emerald-600 text-white",
    textColor: "text-emerald-700",
    badgeBg: "bg-emerald-50 text-emerald-700",
    borderTheme: "border-emerald-500",
    description: "Define o evento que inicia esta automação no WhatsApp.",
  },
  delay: {
    label: "Atraso / Intervalo",
    icon: Clock,
    headerBg: "bg-amber-500 text-white",
    textColor: "text-amber-700",
    badgeBg: "bg-amber-50 text-amber-700",
    borderTheme: "border-amber-400",
    description: "Aguarda segundos/horas e simula status 'digitando...' no WhatsApp.",
  },
  message: {
    label: "Mensagem WhatsApp",
    icon: MessageSquare,
    headerBg: "bg-blue-600 text-white",
    textColor: "text-blue-700",
    badgeBg: "bg-blue-50 text-blue-700",
    borderTheme: "border-blue-400",
    description: "Envia balão de texto com variáveis como {lead_name} e {city}.",
  },
  audio_ptt: {
    label: "Áudio Gravado (PTT)",
    icon: Mic,
    headerBg: "bg-purple-600 text-white",
    textColor: "text-purple-700",
    badgeBg: "bg-purple-50 text-purple-700",
    borderTheme: "border-purple-400",
    description: "Envia mensagem de voz simulando gravação ao vivo no WhatsApp.",
  },
  menu: {
    label: "Menu de Botões",
    icon: Sliders,
    headerBg: "bg-indigo-600 text-white",
    textColor: "text-indigo-700",
    badgeBg: "bg-indigo-50 text-indigo-700",
    borderTheme: "border-indigo-400",
    description: "Apresenta opções interativas com ramificações de resposta.",
  },
  kanban_move: {
    label: "Ação no CRM",
    icon: Workflow,
    headerBg: "bg-teal-600 text-white",
    textColor: "text-teal-700",
    badgeBg: "bg-teal-50 text-teal-700",
    borderTheme: "border-teal-400",
    description: "Atualiza automaticamente o estágio do lead no pipeline.",
  },
  ai_agent: {
    label: "Transferir para Agente IA",
    icon: Bot,
    headerBg: "bg-violet-600 text-white",
    textColor: "text-violet-700",
    badgeBg: "bg-violet-50 text-violet-700",
    borderTheme: "border-violet-400",
    description: "Passa o controle da conversa para um agente do GPT Maker.",
  },
};

export function ProspectingFlowView() {
  const [flows, setFlows] = useState<AutomationFlow[]>(DEFAULT_FLOWS);
  const [selectedFlowId, setSelectedFlowId] = useState<string>(DEFAULT_FLOWS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Carrega fluxos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FLOWS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFlows(parsed);
          setSelectedFlowId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar fluxos de automação:", e);
    }
  }, []);

  const activeFlow = flows.find((f) => f.id === selectedFlowId) || flows[0];
  const selectedNode = activeFlow.nodes.find((n) => n.id === selectedNodeId) || null;

  function persistFlows(updatedFlows: AutomationFlow[]) {
    setFlows(updatedFlows);
    try {
      localStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error("Erro ao salvar fluxos:", e);
    }
  }

  function handleCreateFlow() {
    const newFlow: AutomationFlow = {
      id: `flow-${Date.now()}`,
      name: "Novo Fluxo de Abordagem",
      description: "Sequência visual personalizada para automação no WhatsApp.",
      targetNiche: "Geral",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: `node-${Date.now()}-0`,
          name: "Gatilho de Disparo",
          type: "trigger",
          config: {
            event: "lead_discovered",
            description: "Quando um novo lead for inserido no pipeline",
          },
        },
        {
          id: `node-${Date.now()}-1`,
          name: "Intervalo Humanizado",
          type: "delay",
          config: { seconds: 3, simulate_typing: true },
        },
        {
          id: `node-${Date.now()}-2`,
          name: "Mensagem de Apresentação",
          type: "message",
          config: {
            text: "Olá {lead_name}, notei oportunidades claras de expansão digital para sua empresa em {city}.",
          },
        },
      ],
    };

    const next = [...flows, newFlow];
    persistFlows(next);
    setSelectedFlowId(newFlow.id);
    setSelectedNodeId(null);
  }

  function handleDeleteFlow(flowId: string) {
    if (flows.length <= 1) {
      alert("É necessário manter pelo menos um fluxo configurado.");
      return;
    }
    if (confirm(`Deseja excluir o fluxo "${activeFlow.name}"?`)) {
      const next = flows.filter((f) => f.id !== flowId);
      persistFlows(next);
      setSelectedFlowId(next[0].id);
      setSelectedNodeId(null);
    }
  }

  function handleUpdateActiveFlow(patch: Partial<AutomationFlow>) {
    const updated = flows.map((f) =>
      f.id === activeFlow.id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f
    );
    persistFlows(updated);
  }

  function handleAddNode(type: FlowNodeType) {
    const def = NODE_DEFINITIONS[type];
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      name: def.label,
      type,
      config:
        type === "delay"
          ? { seconds: 5, simulate_typing: true }
          : type === "message"
          ? { text: "Olá {lead_name}, como posso te ajudar hoje?" }
          : type === "audio_ptt"
          ? { audio_url: "", duration_seconds: 15, caption: "Áudio explicativo" }
          : type === "menu"
          ? { question: "Como prefere prosseguir?", buttons: ["Quero diagnóstico", "Já temos agência", "Falar depois"] }
          : type === "kanban_move"
          ? { target_column: "contatado" }
          : type === "ai_agent"
          ? { agent_name: "Lucas • Closer Comercial" }
          : { event: "manual", description: "Disparo sob demanda" },
    };

    const nextNodes = [...activeFlow.nodes, newNode];
    handleUpdateActiveFlow({ nodes: nextNodes });
    setIsAddingNode(false);
    setSelectedNodeId(newNode.id);
  }

  function handleDeleteNode(nodeId: string) {
    if (activeFlow.nodes.length <= 1) {
      alert("O fluxo precisa ter pelo menos um passo.");
      return;
    }
    const nextNodes = activeFlow.nodes.filter((n) => n.id !== nodeId);
    handleUpdateActiveFlow({ nodes: nextNodes });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }

  function handleMoveNode(index: number, direction: "up" | "down") {
    const nextNodes = [...activeFlow.nodes];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextNodes.length) return;

    const temp = nextNodes[index];
    nextNodes[index] = nextNodes[targetIndex];
    nextNodes[targetIndex] = temp;

    handleUpdateActiveFlow({ nodes: nextNodes });
  }

  function handleUpdateNodeConfig(nodeId: string, patch: Record<string, any>) {
    const nextNodes = activeFlow.nodes.map((n) =>
      n.id === nodeId ? { ...n, config: { ...n.config, ...patch } } : n
    );
    handleUpdateActiveFlow({ nodes: nextNodes });
  }

  function handleUpdateNodeName(nodeId: string, name: string) {
    const nextNodes = activeFlow.nodes.map((n) => (n.id === nodeId ? { ...n, name } : n));
    handleUpdateActiveFlow({ nodes: nextNodes });
  }

  return (
    <section className="flex h-[calc(100vh-5rem)] flex-col space-y-4">
      {/* Barra de Ferramentas Superior do ManyChat */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
        {/* Seletor do Fluxo e Título */}
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Workflow className="size-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedFlowId}
                onChange={(e) => {
                  setSelectedFlowId(e.target.value);
                  setSelectedNodeId(null);
                }}
                className="font-black text-slate-900 border-none bg-transparent text-sm focus:outline-none focus:ring-0 cursor-pointer"
              >
                {flows.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.nodes.length} passos)
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleUpdateActiveFlow({ isActive: !activeFlow.isActive })}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                  activeFlow.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {activeFlow.isActive ? "Ativo no WhatsApp" : "Pausado"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              {activeFlow.description}
            </p>
          </div>
        </div>

        {/* Controles de Canvas e Ações */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge className="bg-emerald-50 text-emerald-700 text-xs font-bold">
              <Check className="mr-1 size-3" /> Salvo
            </Badge>
          )}

          {/* Ferramentas de Zoom */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs text-slate-600">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
              className="rounded-lg p-1.5 hover:bg-white transition"
              title="Diminuir Zoom"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 140))}
              className="rounded-lg p-1.5 hover:bg-white transition"
              title="Aumentar Zoom"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="rounded-lg p-1.5 hover:bg-white transition"
              title="Resetar Zoom"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          <Button
            onClick={() => setIsAddingNode(!isAddingNode)}
            variant="primary"
            size="sm"
            className="text-xs"
          >
            <Plus className="mr-1.5 size-3.5" /> Adicionar Bloco
          </Button>

          <Button onClick={handleCreateFlow} variant="secondary" size="sm" className="text-xs">
            Novo Fluxo
          </Button>

          <Button
            onClick={() => handleDeleteFlow(activeFlow.id)}
            variant="secondary"
            size="sm"
            className="text-xs text-rose-600 hover:bg-rose-50"
            title="Excluir fluxo atual"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Menu Flutuante para Adicionar Bloco no Canvas */}
      {isAddingNode && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-900">Selecione o bloco para conectar ao fluxo:</span>
            <button onClick={() => setIsAddingNode(false)} className="text-slate-400 hover:text-slate-600">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {(Object.keys(NODE_DEFINITIONS) as FlowNodeType[])
              .filter((type) => type !== "trigger")
              .map((type) => {
                const def = NODE_DEFINITIONS[type];
                const Icon = def.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-500 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`size-4 ${def.textColor}`} />
                      <strong className="text-xs font-bold text-slate-900">{def.label}</strong>
                    </div>
                    <small className="line-clamp-2 text-[10px] text-slate-400">{def.description}</small>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* ÁREA PRINCIPAL: CANVAS VISUAL DO MANYCHAT + INSPECTOR LATERAL */}
      <div className="relative flex flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {/* Canvas com Grid ManyChat */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-8 transition-transform"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div
            className="mx-auto flex flex-col items-center space-y-6 transition-all"
            style={{
              maxWidth: "680px",
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
            }}
          >
            {activeFlow.nodes.map((node, index) => {
              const def = NODE_DEFINITIONS[node.type] || NODE_DEFINITIONS.message;
              const Icon = def.icon;
              const isSelected = selectedNodeId === node.id;
              const isLast = index === activeFlow.nodes.length - 1;

              return (
                <div key={node.id} className="relative w-full flex flex-col items-center">
                  {/* Bloco do Canvas (Nó ManyChat) */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`group relative w-full cursor-pointer rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                      isSelected
                        ? "ring-2 ring-blue-600 border-blue-600 shadow-blue-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Porta de Entrada (Input Handle do ManyChat) */}
                    {index > 0 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="grid size-5 place-items-center rounded-full border-2 border-white bg-slate-400 shadow-xs" />
                      </div>
                    )}

                    {/* Header do Card ManyChat */}
                    <div className={`flex items-center justify-between rounded-t-2xl px-4 py-2.5 ${def.headerBg}`}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-white" />
                        <span className="text-xs font-black tracking-wide uppercase">{node.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <span className="text-[10px] font-bold text-white/80">Etapa {index + 1}</span>
                      </div>
                    </div>

                    {/* Corpo do Card: Prévia Visual de WhatsApp */}
                    <div className="p-4">
                      {/* Caso: Gatilho Inicial */}
                      {node.type === "trigger" && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs">
                          <strong className="text-emerald-900 font-bold block">Condição de Início:</strong>
                          <p className="mt-1 text-emerald-700 text-[11px]">
                            {node.config.description || "Quando o lead for inserido na cadência comercial."}
                          </p>
                        </div>
                      )}

                      {/* Caso: Mensagem WhatsApp */}
                      {node.type === "message" && (
                        <div className="rounded-xl bg-slate-100/70 p-3">
                          <div className="relative rounded-xl bg-[#d9fdd3] p-3 text-xs leading-relaxed text-slate-900 shadow-xs">
                            <p className="whitespace-pre-line text-[11px] font-medium">
                              {node.config.text || "Escreva uma mensagem..."}
                            </p>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-500">
                              <span>10:42</span>
                              <CheckCheck className="size-3 text-blue-500" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Caso: Áudio Gravado PTT */}
                      {node.type === "audio_ptt" && (
                        <div className="rounded-xl bg-slate-100/70 p-3">
                          <div className="flex items-center gap-3 rounded-xl bg-[#d9fdd3] p-3 shadow-xs">
                            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                              <Play className="size-3.5 fill-white ml-0.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              {/* Onda sonora simulada */}
                              <div className="flex items-center gap-0.5 h-4">
                                {[4, 10, 14, 8, 16, 20, 12, 18, 22, 14, 8, 12, 16, 10, 6].map((h, i) => (
                                  <span
                                    key={i}
                                    className="w-1 bg-slate-500 rounded-full"
                                    style={{ height: `${h}px` }}
                                  />
                                ))}
                              </div>
                              <span className="mt-1 block text-[10px] text-slate-500">
                                0:{String(node.config.duration_seconds || 15).padStart(2, "0")} • Áudio WhatsApp (PTT)
                              </span>
                            </div>
                            <Mic className="size-4 text-emerald-600" />
                          </div>
                        </div>
                      )}

                      {/* Caso: Menu de Botões */}
                      {node.type === "menu" && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-800">
                            {node.config.question || "Pergunta do menu..."}
                          </p>
                          <div className="space-y-1.5 pt-1">
                            {(node.config.buttons || ["Opção 1", "Opção 2"]).map((btn: string, bIdx: number) => (
                              <div
                                key={bIdx}
                                className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-2xs"
                              >
                                <span>{btn}</span>
                                <span className="size-2.5 rounded-full border-2 border-indigo-600 bg-white" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Caso: Delay / Intervalo */}
                      {node.type === "delay" && (
                        <div className="flex items-center gap-3 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-800">
                          <Clock className="size-4 text-amber-600 shrink-0" />
                          <div>
                            <strong className="block font-bold">
                              Aguardar {node.config.seconds || 5} segundos
                            </strong>
                            <span className="text-[11px] text-amber-600">
                              {node.config.simulate_typing ? "Simulando digitação no WhatsApp..." : "Pausa silenciosa"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Caso: CRM Move */}
                      {node.type === "kanban_move" && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-teal-50/70 p-3 text-xs text-teal-800">
                          <Workflow className="size-4 text-teal-600 shrink-0" />
                          <span>
                            Mover lead para etapa:{" "}
                            <strong className="font-bold uppercase tracking-wider text-teal-900">
                              {node.config.target_column || "contatado"}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Caso: Agente IA */}
                      {node.type === "ai_agent" && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-violet-50/70 p-3 text-xs text-violet-800">
                          <Bot className="size-4 text-violet-600 shrink-0" />
                          <span>
                            Iniciar conversa com agente:{" "}
                            <strong className="font-bold text-violet-900">
                              {node.config.agent_name || "Closer Comercial"}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barra de Ações Rápidas no Hover */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px]">
                      <span className="text-slate-400">Clique para configurar</span>
                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveNode(index, "up");
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            title="Subir passo"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                        )}
                        {!isLast && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveNode(index, "down");
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            title="Descer passo"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        )}
                        {node.type !== "trigger" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Excluir bloco"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Porta de Saída (Output Handle do ManyChat) */}
                    {!isLast && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                        <span className="grid size-5 place-items-center rounded-full border-2 border-white bg-blue-600 shadow-xs" />
                      </div>
                    )}
                  </div>

                  {/* Linha Conectora ManyChat com Seta */}
                  {!isLast && (
                    <div className="flex flex-col items-center my-2">
                      <div className="h-6 w-0.5 bg-blue-400" />
                      <ArrowDown className="size-4 text-blue-500 -mt-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* INSPECTOR LATERAL DIREITO (PAINEL DE EDIÇÃO DO BLOCO MANYCHAT) */}
        {selectedNode && (
          <div className="w-80 shrink-0 border-l border-slate-200 bg-white p-5 shadow-lg flex flex-col justify-between animate-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                    <Edit3 className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">Configurar Bloco</h3>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {selectedNode.id}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Nome do Bloco */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Título do Bloco</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => handleUpdateNodeName(selectedNode.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Configurações específicas por tipo */}
              {selectedNode.type === "message" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Texto da Mensagem WhatsApp
                  </label>
                  <textarea
                    rows={6}
                    value={selectedNode.config.text || ""}
                    onChange={(e) =>
                      handleUpdateNodeConfig(selectedNode.id, { text: e.target.value })
                    }
                    placeholder="Digite a mensagem..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {["{lead_name}", "{city}", "{category}"].map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() =>
                          handleUpdateNodeConfig(selectedNode.id, {
                            text: (selectedNode.config.text || "") + " " + variable,
                          })
                        }
                        className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 hover:bg-slate-100"
                      >
                        +{variable}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.type === "delay" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Tempo de Espera</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="86400"
                        value={selectedNode.config.seconds || 5}
                        onChange={(e) =>
                          handleUpdateNodeConfig(selectedNode.id, {
                            seconds: parseInt(e.target.value) || 5,
                          })
                        }
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">segundos</span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedNode.config.simulate_typing)}
                      onChange={(e) =>
                        handleUpdateNodeConfig(selectedNode.id, {
                          simulate_typing: e.target.checked,
                        })
                      }
                      className="size-4 rounded accent-blue-600"
                    />
                    <span>Simular status 'digitando...'</span>
                  </label>
                </div>
              )}

              {selectedNode.type === "audio_ptt" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">URL do Áudio (MP3/OGG)</label>
                    <input
                      type="text"
                      value={selectedNode.config.audio_url || ""}
                      onChange={(e) =>
                        handleUpdateNodeConfig(selectedNode.id, { audio_url: e.target.value })
                      }
                      placeholder="https://assets.hunterx.app/audio.mp3"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Duração (segundos)</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedNode.config.duration_seconds || 15}
                      onChange={(e) =>
                        handleUpdateNodeConfig(selectedNode.id, {
                          duration_seconds: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "menu" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Pergunta do Menu</label>
                    <input
                      type="text"
                      value={selectedNode.config.question || ""}
                      onChange={(e) =>
                        handleUpdateNodeConfig(selectedNode.id, { question: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Botões de Resposta</label>
                    <div className="space-y-1.5">
                      {(selectedNode.config.buttons || []).map((btn: string, i: number) => (
                        <div key={i} className="flex gap-1.5">
                          <input
                            type="text"
                            value={btn}
                            onChange={(e) => {
                              const nextBtns = [...selectedNode.config.buttons];
                              nextBtns[i] = e.target.value;
                              handleUpdateNodeConfig(selectedNode.id, { buttons: nextBtns });
                            }}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const nextBtns = selectedNode.config.buttons.filter(
                                (_: any, idx: number) => idx !== i
                              );
                              handleUpdateNodeConfig(selectedNode.id, { buttons: nextBtns });
                            }}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-[11px] mt-1"
                        onClick={() => {
                          const nextBtns = [...(selectedNode.config.buttons || []), "Nova Opção"];
                          handleUpdateNodeConfig(selectedNode.id, { buttons: nextBtns });
                        }}
                      >
                        + Adicionar Botão
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === "kanban_move" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Coluna Alvo no Pipeline</label>
                  <select
                    value={selectedNode.config.target_column || "contatado"}
                    onChange={(e) =>
                      handleUpdateNodeConfig(selectedNode.id, { target_column: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="novo">Novo Lead</option>
                    <option value="qualificado">Qualificado</option>
                    <option value="contatado">Contatado</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="ganho">Negócio Ganho</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              onClick={() => setSelectedNodeId(null)}
              variant="primary"
              size="sm"
              className="w-full text-xs mt-4"
            >
              Concluir Edição do Bloco
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
