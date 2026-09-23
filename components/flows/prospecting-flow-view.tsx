"use client";

import { useState, useEffect } from "react";
import {
  Workflow, Play, Clock, MessageSquare, Mic,
  Sliders, Bell, Plus, Trash2, ArrowDown, ArrowUp, Check,
  CheckCircle2, AlertCircle, Sparkles, FileText, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FlowNodeType = "delay" | "message" | "audio_ptt" | "menu" | "kanban_move" | "notification";

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
    name: "Abordagem Inicial: Empresas Sem Website",
    description: "Sequência cadenciada com intervalo humanizado, áudio gravado e qualificação no WhatsApp.",
    targetNiche: "Geral",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "node-1",
        name: "Intervalo Inteligente (Digitando)",
        type: "delay",
        config: { seconds: 4, simulate_typing: true },
      },
      {
        id: "node-2",
        name: "Apresentação & Elogio de Entrada",
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
          caption: "Áudio personalizado com análise rápida da presença digital.",
        },
      },
      {
        id: "node-4",
        name: "Menu de Qualificação Rápida",
        type: "menu",
        config: {
          question: "Faria sentido apresentarmos esse diagnóstico de 10 minutos para sua equipe?",
          buttons: ["Sim, pode enviar", "Já temos agência", "Me chame depois"],
        },
      },
      {
        id: "node-5",
        name: "Atualizar Status no Pipeline",
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
  { label: string; icon: any; iconColor: string; bgBadge: string; textBadge: string; description: string }
> = {
  delay: {
    label: "Atraso Inteligente",
    icon: Clock,
    iconColor: "text-amber-600",
    bgBadge: "bg-amber-50",
    textBadge: "text-amber-700",
    description: "Aguarda alguns segundos e simula status 'digitando...' no WhatsApp.",
  },
  message: {
    label: "Mensagem de Texto",
    icon: MessageSquare,
    iconColor: "text-blue-600",
    bgBadge: "bg-blue-50",
    textBadge: "text-blue-700",
    description: "Mensagem persuasiva com interpolação de {lead_name} e {city}.",
  },
  audio_ptt: {
    label: "Áudio Gravado (PTT)",
    icon: Mic,
    iconColor: "text-violet-600",
    bgBadge: "bg-violet-50",
    textBadge: "text-violet-700",
    description: "Envia mensagem de voz simulando gravação ao vivo.",
  },
  menu: {
    label: "Menu de Opções",
    icon: Sliders,
    iconColor: "text-indigo-600",
    bgBadge: "bg-indigo-50",
    textBadge: "text-indigo-700",
    description: "Apresenta botões de resposta rápida para triagem do lead.",
  },
  kanban_move: {
    label: "Ação no CRM",
    icon: Workflow,
    iconColor: "text-emerald-600",
    bgBadge: "bg-emerald-50",
    textBadge: "text-emerald-700",
    description: "Move o lead automaticamente para a coluna de estágio no Pipeline.",
  },
  notification: {
    label: "Alerta de Equipe",
    icon: Bell,
    iconColor: "text-rose-600",
    bgBadge: "bg-rose-50",
    textBadge: "text-rose-700",
    description: "Dispara notificação push ou e-mail para o atendente comercial.",
  },
};

export function ProspectingFlowView() {
  const [flows, setFlows] = useState<AutomationFlow[]>(DEFAULT_FLOWS);
  const [selectedFlowId, setSelectedFlowId] = useState<string>(DEFAULT_FLOWS[0].id);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Carrega fluxos persistidos do localStorage
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
      console.error("Erro ao carregar fluxos:", e);
    }
  }, []);

  const activeFlow = flows.find((f) => f.id === selectedFlowId) || flows[0];

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
      description: "Sequência automatizada personalizada para qualificação de leads.",
      targetNiche: "Geral",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: `node-${Date.now()}-1`,
          name: "Intervalo Inicial",
          type: "delay",
          config: { seconds: 3, simulate_typing: true },
        },
        {
          id: `node-${Date.now()}-2`,
          name: "Mensagem de Contato",
          type: "message",
          config: { text: "Olá {lead_name}, notei oportunidades claras de expansão digital para sua empresa em {city}." },
        },
      ],
    };

    const nextFlows = [...flows, newFlow];
    persistFlows(nextFlows);
    setSelectedFlowId(newFlow.id);
  }

  function handleDeleteFlow(flowId: string) {
    if (flows.length <= 1) {
      alert("É necessário manter pelo menos um fluxo de automação.");
      return;
    }
    const nextFlows = flows.filter((f) => f.id !== flowId);
    persistFlows(nextFlows);
    setSelectedFlowId(nextFlows[0].id);
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
          ? { text: "Escreva aqui a mensagem para o lead." }
          : type === "audio_ptt"
          ? { audio_url: "", duration_seconds: 15, caption: "Áudio explicativo" }
          : type === "menu"
          ? { question: "Como prefere prosseguir?", buttons: ["Quero diagnóstico", "Não tenho interesse"] }
          : type === "kanban_move"
          ? { target_column: "contatado" }
          : { alert_message: "Lead interagiu com o fluxo" },
    };

    const nextNodes = [...activeFlow.nodes, newNode];
    handleUpdateActiveFlow({ nodes: nextNodes });
    setIsAddingNode(false);
    setEditingNodeId(newNode.id);
  }

  function handleDeleteNode(nodeId: string) {
    const nextNodes = activeFlow.nodes.filter((n) => n.id !== nodeId);
    handleUpdateActiveFlow({ nodes: nextNodes });
    if (editingNodeId === nodeId) setEditingNodeId(null);
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
    <section className="space-y-6">
      {/* Cabeçalho no padrão HunterX */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-600">Automações</p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-slate-900">Sequências & Fluxos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Crie sequências de abordagem e qualificação no WhatsApp com gatilhos, mensagens e ações de CRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <Badge className="bg-emerald-50 text-emerald-700">
              <Check className="mr-1 size-3" /> Salvo no sistema
            </Badge>
          )}

          <Button onClick={handleCreateFlow} variant="primary">
            <Plus className="mr-1.5 size-4" /> Novo Fluxo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Painel Esquerdo: Lista de Fluxos */}
        <div className="space-y-3 lg:col-span-4">
          <Card className="divide-y divide-slate-100 border border-slate-200 bg-white p-2 shadow-sm">
            <div className="p-3">
              <span className="text-[11px] font-black uppercase tracking-[.1em] text-slate-400">Fluxos Criados</span>
            </div>

            {flows.map((flow) => {
              const isSelected = flow.id === selectedFlowId;
              return (
                <button
                  key={flow.id}
                  onClick={() => {
                    setSelectedFlowId(flow.id);
                    setEditingNodeId(null);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition ${
                    isSelected
                      ? "border border-blue-200 bg-blue-50/50 shadow-sm"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
                    <Workflow className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-bold text-slate-900">{flow.name}</strong>
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{flow.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="bg-slate-100 text-[10px] text-slate-600 font-medium">
                        {flow.nodes.length} passos
                      </Badge>
                      <Badge className={flow.isActive ? "bg-emerald-50 text-[10px] text-emerald-700" : "bg-slate-100 text-[10px] text-slate-500"}>
                        {flow.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </Card>
        </div>

        {/* Painel Direito: Construtor Sequencial de Passos (Estilo ManyChat) */}
        <div className="space-y-5 lg:col-span-8">
          {/* Header do Fluxo Ativo */}
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={activeFlow.name}
                  onChange={(e) => handleUpdateActiveFlow({ name: e.target.value })}
                  className="w-full text-lg font-black text-slate-900 border-none bg-transparent focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  value={activeFlow.description}
                  onChange={(e) => handleUpdateActiveFlow({ description: e.target.value })}
                  className="mt-1 w-full text-xs text-slate-500 border-none bg-transparent focus:outline-none focus:ring-0"
                  placeholder="Descrição da finalidade deste fluxo..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleUpdateActiveFlow({ isActive: !activeFlow.isActive })}
                  variant="secondary"
                  size="sm"
                >
                  {activeFlow.isActive ? "Pausar Fluxo" : "Ativar Fluxo"}
                </Button>

                <Button
                  onClick={() => {
                    if (confirm(`Deseja excluir o fluxo "${activeFlow.name}"?`)) {
                      handleDeleteFlow(activeFlow.id);
                    }
                  }}
                  variant="danger"
                  size="sm"
                  title="Excluir fluxo"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* Sequência Conectada de Passos */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[.1em] text-slate-400">
                  Etapas da Sequência ({activeFlow.nodes.length})
                </span>

                <Button
                  onClick={() => setIsAddingNode(!isAddingNode)}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="mr-1 size-3.5" /> Adicionar Passo
                </Button>
              </div>

              {/* Seletor para adicionar novo passo */}
              {isAddingNode && (
                <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                  <p className="mb-3 text-xs font-bold text-slate-800">Escolha o tipo de etapa para adicionar:</p>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {(Object.keys(NODE_DEFINITIONS) as FlowNodeType[]).map((type) => {
                      const def = NODE_DEFINITIONS[type];
                      const Icon = def.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => handleAddNode(type)}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-400 hover:shadow-sm"
                        >
                          <Icon className={`mt-0.5 size-4 shrink-0 ${def.iconColor}`} />
                          <div className="min-w-0 flex-1">
                            <strong className="block text-xs font-bold text-slate-900">{def.label}</strong>
                            <small className="block line-clamp-1 text-[10px] text-slate-500">{def.description}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista dos Passos Verticais Conectados */}
              <div className="relative space-y-4 border-l-2 border-slate-200 ml-4 pl-6">
                {activeFlow.nodes.map((node, index) => {
                  const def = NODE_DEFINITIONS[node.type] || NODE_DEFINITIONS.message;
                  const Icon = def.icon;
                  const isEditing = editingNodeId === node.id;

                  return (
                    <div key={node.id} className="relative">
                      {/* Indicador de Conexão na linha vertical */}
                      <span className="absolute -left-[33px] top-4 grid size-4 place-items-center rounded-full border-2 border-white bg-slate-300 text-[9px] font-bold text-slate-700">
                        {index + 1}
                      </span>

                      <Card className={`border bg-white p-4 shadow-sm transition ${
                        isEditing ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300"
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div
                            onClick={() => setEditingNodeId(isEditing ? null : node.id)}
                            className="flex cursor-pointer items-center gap-3 min-w-0 flex-1"
                          >
                            <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${def.bgBadge}`}>
                              <Icon className={`size-4 ${def.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Passo {index + 1} • {def.label}
                              </span>
                              <strong className="block truncate text-sm font-bold text-slate-900">
                                {node.name}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveNode(index, "up")}
                              disabled={index === 0}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                              title="Subir passo"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveNode(index, "down")}
                              disabled={index === activeFlow.nodes.length - 1}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                              title="Descer passo"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Remover passo"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Editor de Propriedades do Passo Selecionado */}
                        {isEditing && (
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <label className="mb-1 block text-xs font-bold text-slate-700">Título da Etapa</label>
                            <input
                              type="text"
                              value={node.name}
                              onChange={(e) => handleUpdateNodeName(node.id, e.target.value)}
                              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                            />

                            {/* Configuração específica por tipo de nó */}
                            {node.type === "delay" && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-bold text-slate-700">Duração do Atraso (segundos)</label>
                                  <input
                                    type="number"
                                    value={node.config.seconds || 4}
                                    onChange={(e) => handleUpdateNodeConfig(node.id, { seconds: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                  <input
                                    type="checkbox"
                                    id={`sim-typing-${node.id}`}
                                    checked={node.config.simulate_typing ?? true}
                                    onChange={(e) => handleUpdateNodeConfig(node.id, { simulate_typing: e.target.checked })}
                                    className="size-4 rounded accent-blue-600"
                                  />
                                  <label htmlFor={`sim-typing-${node.id}`} className="text-xs text-slate-700 font-medium">
                                    Simular status &ldquo;digitando...&rdquo;
                                  </label>
                                </div>
                              </div>
                            )}

                            {node.type === "message" && (
                              <div>
                                <div className="mb-1 flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-700">Texto da Mensagem WhatsApp</label>
                                  <span className="text-[10px] text-slate-400">Variáveis: {"{lead_name}"}, {"{city}"}</span>
                                </div>
                                <textarea
                                  rows={4}
                                  value={node.config.text || ""}
                                  onChange={(e) => handleUpdateNodeConfig(node.id, { text: e.target.value })}
                                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {node.type === "audio_ptt" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-xs font-bold text-slate-700">URL do Áudio Gravado (MP3/OGG)</label>
                                  <input
                                    type="text"
                                    value={node.config.audio_url || ""}
                                    onChange={(e) => handleUpdateNodeConfig(node.id, { audio_url: e.target.value })}
                                    placeholder="https://sua-empresa.com/audios/audio.mp3"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Duração estimada (segundos)</label>
                                    <input
                                      type="number"
                                      value={node.config.duration_seconds || 15}
                                      onChange={(e) => handleUpdateNodeConfig(node.id, { duration_seconds: Number(e.target.value) })}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Legenda opcional</label>
                                    <input
                                      type="text"
                                      value={node.config.caption || ""}
                                      onChange={(e) => handleUpdateNodeConfig(node.id, { caption: e.target.value })}
                                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {node.type === "menu" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-xs font-bold text-slate-700">Pergunta do Menu</label>
                                  <input
                                    type="text"
                                    value={node.config.question || ""}
                                    onChange={(e) => handleUpdateNodeConfig(node.id, { question: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-bold text-slate-700">Opções de Botões (separados por vírgula)</label>
                                  <input
                                    type="text"
                                    value={(node.config.buttons || []).join(", ")}
                                    onChange={(e) =>
                                      handleUpdateNodeConfig(node.id, {
                                        buttons: e.target.value.split(",").map((s) => s.trim()),
                                      })
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {node.type === "kanban_move" && (
                              <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Coluna de Destino no Pipeline</label>
                                <select
                                  value={node.config.target_column || "contatado"}
                                  onChange={(e) => handleUpdateNodeConfig(node.id, { target_column: e.target.value })}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="novo">Novos Leads</option>
                                  <option value="contatado">Contatados</option>
                                  <option value="respondeu">Respondeu</option>
                                  <option value="demonstracao">Demonstração / Diagnóstico</option>
                                  <option value="negociacao">Negociação</option>
                                  <option value="cliente">Clientes Fechados</option>
                                  <option value="perdido">Perdidos</option>
                                </select>
                              </div>
                            )}

                            {node.type === "notification" && (
                              <div>
                                <label className="mb-1 block text-xs font-bold text-slate-700">Mensagem do Alerta Interno</label>
                                <input
                                  type="text"
                                  value={node.config.alert_message || ""}
                                  onChange={(e) => handleUpdateNodeConfig(node.id, { alert_message: e.target.value })}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            )}

                            <div className="mt-3 flex justify-end">
                              <Button
                                onClick={() => setEditingNodeId(null)}
                                variant="secondary"
                                size="sm"
                              >
                                Concluir Edição
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
