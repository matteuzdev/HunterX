"use client";

import { useState, useEffect } from "react";
import {
  Workflow, Play, Sparkles, Clock, MessageSquare, Mic, Tag,
  ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Settings2, Bell,
  Plus, Trash2, Edit3, Copy, Save, ArrowDown, ArrowUp, X, Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FlowNodeType = "delay" | "message" | "audio_ptt" | "menu" | "kanban_move" | "notification";

export type FlowNode = {
  id: string;
  name: string;
  type: FlowNodeType;
  icon: string;
  color: string;
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
    name: "Abordagem Inicial: Negócios Sem Site",
    description: "Sequência automatizada com atraso humano, áudio gravado e qualificação no WhatsApp.",
    targetNiche: "Geral",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "node-1",
        name: "Simulação de Digitação",
        type: "delay",
        icon: "⏳",
        color: "from-amber-600 to-orange-600",
        config: { seconds: 4, simulate_typing: true },
      },
      {
        id: "node-2",
        name: "Mensagem de Elogio & Gancho",
        type: "message",
        icon: "💬",
        color: "from-emerald-600 to-teal-600",
        config: {
          text: "👋 Olá, equipe da {lead_name}! Tudo bem?\n\nVi as excelentes avaliações de vocês no Google em {city} e achei o trabalho incrível.",
        },
      },
      {
        id: "node-3",
        name: "Áudio Gravado na Hora (PTT)",
        type: "audio_ptt",
        icon: "🎙️",
        color: "from-purple-600 to-indigo-600",
        config: {
          duration_seconds: 22,
          file_name: "audio_apresentacao.ogg",
          description: "Áudio explicativo informal sobre os clientes perdidos por falta de site rápido.",
        },
      },
      {
        id: "node-4",
        name: "Menu com Opções de Resposta",
        type: "menu",
        icon: "🔘",
        color: "from-blue-600 to-cyan-600",
        config: {
          question: "Gostaria de ver uma demonstração de como ficaria a nova página rápida de vocês?",
          options: ["Sim, quero ver a prévia", "Qual é a média de valor?", "Já temos agência"],
        },
      },
      {
        id: "node-5",
        name: "Mover no Kanban: 'Demonstração'",
        type: "kanban_move",
        icon: "📊",
        color: "from-violet-600 to-purple-600",
        config: {
          target_column: "demonstracao",
          add_tags: ["Interesse Demonstração", "Lead Quente"],
        },
      },
      {
        id: "node-6",
        name: "Notificação de Transbordo",
        type: "notification",
        icon: "🔔",
        color: "from-rose-600 to-pink-600",
        config: {
          notify_phone: "5583999999999",
          message: "🔥 Lead respondeu positivamente! Assumir conversa agora.",
        },
      },
    ],
  },
  {
    id: "flow-2",
    name: "Follow-up 24h: Lead Não Respondeu",
    description: "Reativação sutil para leads que receberam o contato inicial mas não responderam no dia.",
    targetNiche: "Geral",
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "node-201",
        name: "Delay de 24 Horas",
        type: "delay",
        icon: "⏳",
        color: "from-amber-600 to-orange-600",
        config: { seconds: 86400, simulate_typing: false },
      },
      {
        id: "node-202",
        name: "Mensagem de Checagem Rápida",
        type: "message",
        icon: "💬",
        color: "from-emerald-600 to-teal-600",
        config: {
          text: "Passando só para confirmar se você conseguiu ver a mensagem anterior sobre a presença da {lead_name} no Google! Se preferir, posso te enviar um print rápido direto por aqui.",
        },
      },
    ],
  },
];

export function ProspectingFlowView() {
  const [flows, setFlows] = useState<AutomationFlow[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hunterx-automation-flows");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_FLOWS;
  });

  const [selectedFlowId, setSelectedFlowId] = useState<string>(flows[0]?.id || "flow-1");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const activeFlow = flows.find((f) => f.id === selectedFlowId) || flows[0];
  const selectedNode = activeFlow?.nodes.find((n) => n.id === selectedNodeId) || activeFlow?.nodes[0] || null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hunterx-automation-flows", JSON.stringify(flows));
    }
  }, [flows]);

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  }

  // --- CRUD DE FLUXOS ---
  function handleCreateFlow() {
    const newFlow: AutomationFlow = {
      id: `flow-${Date.now()}`,
      name: "Novo Fluxo de Automação",
      description: "Descreva o objetivo deste funil de mensagens.",
      targetNiche: "Geral",
      isActive: true,
      nodes: [
        {
          id: `node-${Date.now()}-1`,
          name: "Simulação de Digitação",
          type: "delay",
          icon: "⏳",
          color: "from-amber-600 to-orange-600",
          config: { seconds: 3, simulate_typing: true },
        },
        {
          id: `node-${Date.now()}-2`,
          name: "Primeira Mensagem",
          type: "message",
          icon: "💬",
          color: "from-emerald-600 to-teal-600",
          config: { text: "Olá! Tudo bem com vocês da {lead_name}?" },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFlows([...flows, newFlow]);
    setSelectedFlowId(newFlow.id);
    setSelectedNodeId(newFlow.nodes[0].id);
    showNotice("Novo fluxo criado com sucesso!");
  }

  function handleDeleteFlow(id: string) {
    if (flows.length <= 1) {
      alert("Você deve manter pelo menos um fluxo.");
      return;
    }
    const updated = flows.filter((f) => f.id !== id);
    setFlows(updated);
    setSelectedFlowId(updated[0].id);
    showNotice("Fluxo excluído.");
  }

  function updateActiveFlow(patch: Partial<AutomationFlow>) {
    setFlows((prev) =>
      prev.map((f) => (f.id === activeFlow.id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f))
    );
  }

  // --- CRUD DE NÓS DO FLUXO ---
  function handleAddNode(type: FlowNodeType) {
    const typeTemplates: Record<FlowNodeType, { name: string; icon: string; color: string; config: any }> = {
      delay: {
        name: "Atraso / Digitando...",
        icon: "⏳",
        color: "from-amber-600 to-orange-600",
        config: { seconds: 5, simulate_typing: true },
      },
      message: {
        name: "Mensagem de Texto",
        icon: "💬",
        color: "from-emerald-600 to-teal-600",
        config: { text: "Mensagem personalizada com {lead_name} e {city}." },
      },
      audio_ptt: {
        name: "Áudio Gravado (PTT)",
        icon: "🎙️",
        color: "from-purple-600 to-indigo-600",
        config: { duration_seconds: 20, file_name: "audio_novo.ogg", description: "Áudio de diagnóstico." },
      },
      menu: {
        name: "Menu com Botões",
        icon: "🔘",
        color: "from-blue-600 to-cyan-600",
        config: { question: "Selecione uma opção:", options: ["Opção 1", "Opção 2", "Falar com Atendente"] },
      },
      kanban_move: {
        name: "Mover no Kanban",
        icon: "📊",
        color: "from-violet-600 to-purple-600",
        config: { target_column: "respondeu", add_tags: ["Interesse"] },
      },
      notification: {
        name: "Alerta de Transbordo",
        icon: "🔔",
        color: "from-rose-600 to-pink-600",
        config: { notify_phone: "5583999999999", message: "Aviso de transbordo urgente!" },
      },
    };

    const template = typeTemplates[type];
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      name: template.name,
      type,
      icon: template.icon,
      color: template.color,
      config: { ...template.config },
    };

    updateActiveFlow({
      nodes: [...activeFlow.nodes, newNode],
    });

    setSelectedNodeId(newNode.id);
    setAddNodeModalOpen(false);
    showNotice(`Bloco "${template.name}" adicionado!`);
  }

  function handleUpdateNodeConfig(patch: Record<string, any>) {
    if (!selectedNode) return;
    const updatedNodes = activeFlow.nodes.map((n) =>
      n.id === selectedNode.id ? { ...n, config: { ...n.config, ...patch } } : n
    );
    updateActiveFlow({ nodes: updatedNodes });
  }

  function handleUpdateNodeName(name: string) {
    if (!selectedNode) return;
    const updatedNodes = activeFlow.nodes.map((n) =>
      n.id === selectedNode.id ? { ...n, name } : n
    );
    updateActiveFlow({ nodes: updatedNodes });
  }

  function handleDeleteNode(nodeId: string) {
    if (activeFlow.nodes.length <= 1) {
      alert("O fluxo deve ter pelo menos 1 bloco.");
      return;
    }
    const updatedNodes = activeFlow.nodes.filter((n) => n.id !== nodeId);
    updateActiveFlow({ nodes: updatedNodes });
    setSelectedNodeId(updatedNodes[0].id);
    showNotice("Bloco removido do fluxo.");
  }

  function handleMoveNode(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeFlow.nodes.length) return;

    const newNodes = [...activeFlow.nodes];
    const temp = newNodes[index];
    newNodes[index] = newNodes[targetIndex];
    newNodes[targetIndex] = temp;

    updateActiveFlow({ nodes: newNodes });
  }

  return (
    <section className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-purple-400">
            Flow Builder • Automação Visual Totalmente Editável
          </p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-white">Fluxos de Automação</h1>
        </div>

        <div className="flex items-center gap-3">
          {notice && (
            <Badge className="bg-emerald-500/15 text-emerald-300">
              <Check className="mr-1 size-3" /> {notice}
            </Badge>
          )}

          <Button onClick={handleCreateFlow} variant="outline" className="border-white/10 text-xs">
            <Plus className="mr-1.5 size-3.5" /> Novo Fluxo
          </Button>

          <Button
            onClick={() => updateActiveFlow({ isActive: !activeFlow.isActive })}
            className={`text-xs ${
              activeFlow.isActive
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {activeFlow.isActive ? "● Fluxo Ativo" : "○ Fluxo Pausado"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Painel 1: Lista de Fluxos (CRUD de Fluxos) */}
        <div className="space-y-3 lg:col-span-3">
          <Card className="divide-y divide-white/5 border border-white/10 bg-[#0f172a] p-2">
            <div className="flex items-center justify-between p-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Meus Funis ({flows.length})</h2>
            </div>

            {flows.map((fl) => {
              const isSelected = fl.id === selectedFlowId;
              return (
                <div
                  key={fl.id}
                  className={`group relative rounded-xl p-3 transition ${
                    isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedFlowId(fl.id);
                      setSelectedNodeId(fl.nodes[0]?.id || null);
                    }}
                    className="flex w-full flex-col text-left"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="truncate text-xs font-bold text-white">{fl.name}</strong>
                      <span className={`size-2 rounded-full ${fl.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                    </div>
                    <small className="mt-1 line-clamp-1 text-[11px] text-slate-400">{fl.description}</small>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge className="bg-white/5 text-[9px] text-slate-400">{fl.nodes.length} blocos</Badge>
                      <Badge className="bg-purple-500/10 text-[9px] text-purple-300">{fl.targetNiche}</Badge>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDeleteFlow(fl.id)}
                    className="absolute right-2 top-2 hidden rounded p-1 text-slate-500 hover:text-rose-400 group-hover:block"
                    title="Excluir fluxo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Painel 2: Canvas e Nós do Fluxo (CRUD de Nós) */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="border border-white/10 bg-[#0f172a] p-5 text-slate-100">
            {/* Metadados do Fluxo Editáveis */}
            <div className="border-b border-white/5 pb-4">
              <input
                type="text"
                value={activeFlow.name}
                onChange={(e) => updateActiveFlow({ name: e.target.value })}
                className="w-full text-base font-bold text-white bg-transparent border-b border-transparent focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                value={activeFlow.description}
                onChange={(e) => updateActiveFlow({ description: e.target.value })}
                placeholder="Descrição do fluxo..."
                className="mt-1 w-full text-xs text-slate-400 bg-transparent border-b border-transparent focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Lista Vertical de Blocos / Nós */}
            <div className="mt-5 space-y-2.5">
              {activeFlow.nodes.map((node, idx) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div key={node.id} className="relative">
                    <div
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                        isSelected
                          ? "border-purple-500/60 bg-white/[0.07] shadow-lg shadow-purple-950/20"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${node.color} text-sm shadow`}>
                          {node.icon}
                        </span>
                        <div>
                          <strong className="block text-xs font-bold text-white">{node.name}</strong>
                          <span className="block text-[10px] text-slate-400 capitalize">{node.type.replace("_", " ")}</span>
                        </div>
                      </div>

                      {/* Ações de Reordenação e Exclusão do Nó */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveNode(idx, "up")}
                          className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          disabled={idx === activeFlow.nodes.length - 1}
                          onClick={() => handleMoveNode(idx, "down")}
                          className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="rounded p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {idx < activeFlow.nodes.length - 1 && (
                      <div className="my-1 flex justify-center">
                        <div className="h-2 w-px bg-white/10" />
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                onClick={() => setAddNodeModalOpen(true)}
                variant="outline"
                className="mt-4 w-full border-dashed border-white/20 py-5 text-xs text-slate-300 hover:bg-white/5"
              >
                <Plus className="mr-1.5 size-4" /> Adicionar Bloco ao Fluxo
              </Button>
            </div>
          </Card>
        </div>

        {/* Painel 3: Propriedades e Edição do Bloco Selecionado */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-white/10 bg-[#0f172a] p-5 text-slate-100">
            {selectedNode ? (
              <>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedNode.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Editor do Bloco</h4>
                      <span className="text-[10px] text-slate-400 capitalize">{selectedNode.type.replace("_", " ")}</span>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-300 text-[10px]">ID: {selectedNode.id.slice(-6)}</Badge>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="mb-1 block font-bold text-slate-300">Título do Bloco</label>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) => handleUpdateNodeName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Configuração específica por tipo de nó */}
                  {selectedNode.type === "delay" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Atraso (segundos)</label>
                        <input
                          type="number"
                          value={selectedNode.config.seconds || 3}
                          onChange={(e) => handleUpdateNodeConfig({ seconds: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedNode.config.simulate_typing ?? true}
                          onChange={(e) => handleUpdateNodeConfig({ simulate_typing: e.target.checked })}
                          className="size-4 accent-purple-600"
                        />
                        <span className="text-slate-300">Simular status "Digitando..." no WhatsApp</span>
                      </label>
                    </div>
                  )}

                  {selectedNode.type === "message" && (
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="font-bold text-slate-300">Texto da Mensagem</label>
                        <span className="text-[10px] text-slate-500">{"{lead_name}"}, {"{city}"}</span>
                      </div>
                      <textarea
                        rows={6}
                        value={selectedNode.config.text || ""}
                        onChange={(e) => handleUpdateNodeConfig({ text: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {selectedNode.type === "audio_ptt" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Nome do Arquivo de Áudio</label>
                        <input
                          type="text"
                          value={selectedNode.config.file_name || ""}
                          onChange={(e) => handleUpdateNodeConfig({ file_name: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Duração Simulada (segundos)</label>
                        <input
                          type="number"
                          value={selectedNode.config.duration_seconds || 15}
                          onChange={(e) => handleUpdateNodeConfig({ duration_seconds: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Script / Observação do Áudio</label>
                        <textarea
                          rows={3}
                          value={selectedNode.config.description || ""}
                          onChange={(e) => handleUpdateNodeConfig({ description: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === "menu" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Pergunta do Menu</label>
                        <input
                          type="text"
                          value={selectedNode.config.question || ""}
                          onChange={(e) => handleUpdateNodeConfig({ question: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Opções de Botão (uma por linha)</label>
                        <textarea
                          rows={4}
                          value={(selectedNode.config.options || []).join("\n")}
                          onChange={(e) =>
                            handleUpdateNodeConfig({
                              options: e.target.value.split("\n").filter((s) => s.trim().length > 0),
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === "kanban_move" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Mover para Coluna do CRM</label>
                        <select
                          value={selectedNode.config.target_column || "contatado"}
                          onChange={(e) => handleUpdateNodeConfig({ target_column: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-[#0b1120] p-2.5 text-xs text-white"
                        >
                          <option value="novo">Novo Lead</option>
                          <option value="contatado">Contatado</option>
                          <option value="respondeu">Respondeu</option>
                          <option value="demonstracao">Demonstração</option>
                          <option value="negociacao">Negociação</option>
                          <option value="cliente">Cliente Fechado</option>
                          <option value="perdido">Perdido</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedNode.type === "notification" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Telefone para Notificação (WhatsApp)</label>
                        <input
                          type="text"
                          value={selectedNode.config.notify_phone || ""}
                          onChange={(e) => handleUpdateNodeConfig({ notify_phone: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-bold text-slate-300">Texto do Alerta</label>
                        <input
                          type="text"
                          value={selectedNode.config.message || ""}
                          onChange={(e) => handleUpdateNodeConfig({ message: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">Selecione um bloco para editar suas propriedades.</div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal para Escolher Tipo de Novo Bloco */}
      {addNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md border border-white/10 bg-[#0f172a] p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Escolha o Tipo de Bloco</h3>
              <button onClick={() => setAddNodeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-2.5">
              {[
                { type: "delay" as const, title: "Atraso & Digitação Humana", icon: "⏳", desc: "Espera X segundos e simula digitando..." },
                { type: "message" as const, title: "Mensagem de Texto", icon: "💬", desc: "Dispara texto personalizado com variáveis." },
                { type: "audio_ptt" as const, title: "Áudio Gravado na Hora (PTT)", icon: "🎙️", desc: "Áudio que aparece como gravado ao vivo." },
                { type: "menu" as const, title: "Menu Interativo com Botões", icon: "🔘", desc: "Pergunta com opções de resposta rápida." },
                { type: "kanban_move" as const, title: "Mover Etapa no Kanban", icon: "📊", desc: "Avança o lead no funil do CRM." },
                { type: "notification" as const, title: "Alerta de Transbordo Humano", icon: "🔔", desc: "Avisa o vendedor por WhatsApp." },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddNode(item.type)}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.06]"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <strong className="block text-xs font-bold text-white">{item.title}</strong>
                    <small className="block text-[11px] text-slate-400">{item.desc}</small>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
