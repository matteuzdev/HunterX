"use client";

import { useState, useEffect } from "react";
import {
  MessageSquareText, Search, Send, QrCode, Bot, UserCheck, Phone, CheckCheck,
  Sparkles, Clock, MoreVertical, Filter, Tag, Zap, ChevronRight, Workflow,
  Plus, Trash2, Edit3, X, Check, Globe, MapPin, Building2, UserPlus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Conversation, ChatMessage, Lead, WhatsAppInstance, LeadStage, ChatLabel, QuickReply } from "@/lib/hunter/types";
import { DEFAULT_LABELS, KANBAN_STAGES, DEFAULT_QUICK_REPLIES } from "@/lib/hunter/omnichannel-config";
import { QRConnectModal } from "./qr-connect-modal";

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    leadName: "Clínica Sorriso & Arte",
    phoneNumber: "5583998765432",
    channel: "whatsapp",
    unreadCount: 1,
    aiHandled: true,
    leadStage: "respondeu",
    city: "Campina Grande, PB",
    niche: "Clínica Odontológica",
    score: 88,
    tags: ["Odonto", "Campina Grande", "Sem Site"],
    labels: [DEFAULT_LABELS[0], DEFAULT_LABELS[1]],
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    lastMessage: {
      id: "msg-101",
      conversationId: "conv-1",
      sender: "lead",
      content: "Olá! Como funciona essa demonstração visual para nossa clínica?",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: "read",
    },
  },
  {
    id: "conv-2",
    leadName: "Barbearia Dom Pedro",
    phoneNumber: "5583991234567",
    channel: "whatsapp",
    unreadCount: 0,
    aiHandled: false,
    leadStage: "negociacao",
    city: "João Pessoa, PB",
    niche: "Barbearia",
    score: 75,
    tags: ["Barbearia", "João Pessoa", "Quente"],
    labels: [DEFAULT_LABELS[1], DEFAULT_LABELS[3]],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    lastMessage: {
      id: "msg-102",
      conversationId: "conv-2",
      sender: "human",
      content: "Combinado Pedro! Te mandei o link com os detalhes da proposta.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: "delivered",
    },
  },
];

export function LiveInbox({
  leads = [],
  onOpenLead,
}: {
  leads?: Lead[];
  onOpenLead?: (lead: Lead) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hunterx-conversations");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_CONVERSATIONS;
  });

  const [selectedId, setSelectedId] = useState<string>("conv-1");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    "conv-1": [
      {
        id: "m1",
        conversationId: "conv-1",
        sender: "agent",
        content: "Olá equipe da Clínica Sorriso & Arte! Aqui é a Sophia. Notei a excelente reputação de vocês no Google em Campina Grande!",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: "read",
        agentName: "Sophia • Hunter Odonto",
      },
      {
        id: "m2",
        conversationId: "conv-1",
        sender: "lead",
        content: "Olá! Como funciona essa demonstração visual para nossa clínica?",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: "read",
      },
    ],
    "conv-2": [
      {
        id: "m4",
        conversationId: "conv-2",
        sender: "human",
        content: "Combinado Pedro! Te mandei o link com os detalhes da proposta.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: "delivered",
      },
    ],
  });

  const [inputText, setInputText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "ai" | "human">("all");
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<WhatsAppInstance | null>(null);
  const [sending, setSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showCRMDrawer, setShowCRMDrawer] = useState(true);

  // --- CRUD STATES ---
  const [labels, setLabels] = useState<ChatLabel[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hunterx-labels");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEFAULT_LABELS;
  });

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hunterx-quick-replies");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEFAULT_QUICK_REPLIES;
  });

  // Modais de Criação
  const [newLabelModalOpen, setNewLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");

  const [newQrModalOpen, setNewQrModalOpen] = useState(false);
  const [newQrShortcut, setNewQrShortcut] = useState("");
  const [newQrTitle, setNewQrTitle] = useState("");
  const [newQrContent, setNewQrContent] = useState("");

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatNiche, setNewChatNiche] = useState("Comércio Local");
  const [newChatCity, setNewChatCity] = useState("Campina Grande, PB");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hunterx-conversations", JSON.stringify(conversations));
      localStorage.setItem("hunterx-labels", JSON.stringify(labels));
      localStorage.setItem("hunterx-quick-replies", JSON.stringify(quickReplies));
    }
  }, [conversations, labels, quickReplies]);

  const activeConversation = conversations.find((c) => c.id === selectedId);
  const currentMessages = activeConversation ? messages[activeConversation.id] || [] : [];

  const filteredConversations = conversations.filter((c) => {
    if (filterType === "unread" && c.unreadCount === 0) return false;
    if (filterType === "ai" && !c.aiHandled) return false;
    if (filterType === "human" && c.aiHandled) return false;
    if (selectedLabelId && !c.labels?.some((l) => l.id === selectedLabelId)) return false;
    if (searchQuery && !c.leadName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // --- CRUD: RESPOSTAS RÁPIDAS ---
  function handleCreateQuickReply() {
    if (!newQrTitle || !newQrContent) return;
    const shortcut = newQrShortcut.startsWith("/") ? newQrShortcut : `/${newQrShortcut || "atalho"}`;
    const newQR: QuickReply = {
      id: `qr-${Date.now()}`,
      shortcut,
      title: newQrTitle,
      category: "abordagem",
      content: newQrContent,
    };
    setQuickReplies([...quickReplies, newQR]);
    setNewQrTitle("");
    setNewQrShortcut("");
    setNewQrContent("");
    setNewQrModalOpen(false);
  }

  function handleDeleteQuickReply(id: string) {
    setQuickReplies(quickReplies.filter((q) => q.id !== id));
  }

  // --- CRUD: ETIQUETAS (LABELS) ---
  function handleCreateLabel() {
    if (!newLabelName) return;
    const newLbl: ChatLabel = {
      id: `lbl-${Date.now()}`,
      name: newLabelName,
      color: newLabelColor,
    };
    setLabels([...labels, newLbl]);
    setNewLabelName("");
    setNewLabelModalOpen(false);
  }

  function handleDeleteLabel(id: string) {
    setLabels(labels.filter((l) => l.id !== id));
    // Remove das conversas
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        labels: c.labels?.filter((l) => l.id !== id),
      }))
    );
  }

  // --- CRUD: NOVA CONVERSA ---
  function handleCreateConversation() {
    if (!newChatName || !newChatPhone) return;
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      leadName: newChatName,
      phoneNumber: newChatPhone.replace(/\D/g, ""),
      channel: "whatsapp",
      unreadCount: 0,
      aiHandled: true,
      leadStage: "novo",
      city: newChatCity,
      niche: newChatNiche,
      score: 80,
      tags: [newChatNiche, newChatCity],
      labels: [],
      updatedAt: new Date().toISOString(),
    };

    setConversations([newConv, ...conversations]);
    setSelectedId(newConv.id);
    setNewChatName("");
    setNewChatPhone("");
    setNewChatModalOpen(false);
  }

  function handleDeleteConversation(id: string) {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (selectedId === id && updated.length > 0) {
      setSelectedId(updated[0].id);
    }
  }

  async function handleSendMessage(overrideText?: string) {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || !activeConversation) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversation.id,
      sender: "human",
      content: textToSend,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    const updated = [...(messages[activeConversation.id] || []), newMsg];
    setMessages({ ...messages, [activeConversation.id]: updated });
    setInputText("");
    setShowQuickReplies(false);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, lastMessage: newMsg, updatedAt: new Date().toISOString(), unreadCount: 0 }
          : c
      )
    );

    try {
      setSending(true);
      await fetch("/api/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: activeConversation.phoneNumber,
          text: newMsg.content,
        }),
      });
    } catch {
      // Mock fallback
    } finally {
      setSending(false);
    }
  }

  function handleStageChange(newStage: LeadStage) {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, leadStage: newStage } : c))
    );
  }

  function toggleLabel(label: ChatLabel) {
    if (!activeConversation) return;
    const currentLabels = activeConversation.labels || [];
    const exists = currentLabels.some((l) => l.id === label.id);
    const updated = exists ? currentLabels.filter((l) => l.id !== label.id) : [...currentLabels, label];

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, labels: updated } : c))
    );
  }

  function applyQuickReply(qr: QuickReply) {
    if (!activeConversation) return;
    let content = qr.content;
    content = content.replace(/{niche}/g, activeConversation.niche || "seu segmento");
    content = content.replace(/{city}/g, activeConversation.city || "sua cidade");
    content = content.replace(/{name}/g, activeConversation.leadName);

    setInputText(content);
    setShowQuickReplies(false);
  }

  function toggleAiHandling() {
    if (!activeConversation) return;
    const newAiState = !activeConversation.aiHandled;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, aiHandled: newAiState } : c))
    );
  }

  return (
    <section className="flex h-[calc(100vh-6rem)] flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-500">
            Omnichannel • Central com Gestão Completa (CRUD de Chats, Tags e Respostas)
          </p>
          <h1 className="text-3xl font-black tracking-[-.045em] text-white">Live Inbox</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setNewChatModalOpen(true)}
            className="bg-blue-600 text-xs text-white hover:bg-blue-500"
          >
            <UserPlus className="mr-1.5 size-3.5" /> Nova Conversa
          </Button>

          <Button
            onClick={() => setQrModalOpen(true)}
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          >
            <QrCode className="mr-2 size-4" /> Conectar WhatsApp
          </Button>
        </div>
      </div>

      <Card className="flex flex-1 overflow-hidden border border-white/10 bg-[#0f172a]">
        {/* Painel Esquerdo: Lista de Conversas & Filtros */}
        <div className="flex w-full flex-col border-r border-white/5 md:w-80 lg:w-96">
          <div className="border-b border-white/5 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversa ou lead..."
                className="w-full rounded-xl border border-white/5 bg-white/[0.03] py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filtros de Status */}
            <div className="mt-3 flex gap-1 overflow-x-auto text-[11px]">
              {(
                [
                  ["all", "Todas"],
                  ["unread", "Não lidas"],
                  ["ai", "IA Ativa"],
                  ["human", "Manual"],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    filterType === type
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Barra de Etiquetas (com botão de criar tag) */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
              <button
                onClick={() => setNewLabelModalOpen(true)}
                className="shrink-0 rounded-full border border-dashed border-white/20 bg-white/[0.02] px-2 py-0.5 font-bold text-slate-400 hover:text-white"
                title="Criar nova etiqueta"
              >
                + Tag
              </button>

              {labels.map((lbl) => {
                const isActive = selectedLabelId === lbl.id;
                return (
                  <button
                    key={lbl.id}
                    onClick={() => setSelectedLabelId(isActive ? null : lbl.id)}
                    className={`shrink-0 rounded-full px-2 py-0.5 font-bold transition ${
                      isActive
                        ? "ring-1 ring-white text-white"
                        : "opacity-70 hover:opacity-100 text-slate-300"
                    }`}
                    style={{ backgroundColor: `${lbl.color}25`, borderColor: lbl.color }}
                  >
                    {lbl.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 divide-y divide-white/[0.03] overflow-y-auto">
            {filteredConversations.length ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                  <div
                    key={conv.id}
                    className={`group relative flex w-full items-start gap-3 p-3.5 text-left transition ${
                      isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedId(conv.id);
                        setConversations((prev) =>
                          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                        );
                      }}
                      className="flex flex-1 items-start gap-3 min-w-0"
                    >
                      <div className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 font-bold text-emerald-400">
                        {conv.leadName.charAt(0)}
                        {conv.aiHandled && (
                          <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-blue-600 text-[9px] text-white">
                            <Bot className="size-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="truncate text-xs font-bold text-white">
                            {conv.leadName}
                          </strong>
                          <span className="text-[10px] text-slate-500">
                            {new Date(conv.updatedAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {conv.lastMessage?.content || "Sem mensagens"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {conv.unreadCount > 0 && (
                            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              {conv.unreadCount}
                            </span>
                          )}
                          {conv.leadStage && (
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 capitalize">
                              {conv.leadStage}
                            </span>
                          )}
                          {conv.labels?.map((l) => (
                            <span
                              key={l.id}
                              className="rounded px-1.5 py-0.5 text-[8px] font-bold text-white"
                              style={{ backgroundColor: `${l.color}40` }}
                            >
                              {l.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDeleteConversation(conv.id)}
                      className="hidden rounded p-1 text-slate-500 hover:text-rose-400 group-hover:block"
                      title="Excluir conversa"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">Nenhuma conversa encontrada.</div>
            )}
          </div>
        </div>

        {/* Painel Central: Chat estilo WhatsApp Web */}
        {activeConversation ? (
          <div className="flex flex-1 flex-col bg-[#0b1120]/40">
            {/* Cabeçalho do Chat */}
            <div className="flex items-center justify-between border-b border-white/5 bg-[#0f172a] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-emerald-500/20 font-bold text-emerald-400">
                  {activeConversation.leadName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeConversation.leadName}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Phone className="size-3 text-emerald-400" />
                    <span>+{activeConversation.phoneNumber}</span>
                    <span>•</span>
                    <span className="text-emerald-400">WhatsApp Ativo</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleAiHandling}
                  size="sm"
                  variant="outline"
                  className={`text-xs ${
                    activeConversation.aiHandled
                      ? "border-blue-500/30 bg-blue-500/15 text-blue-300"
                      : "border-amber-500/30 bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {activeConversation.aiHandled ? (
                    <>
                      <Bot className="mr-1.5 size-3.5 text-blue-400" /> IA Atendendo
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-1.5 size-3.5 text-amber-400" /> Atendimento Manual
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowCRMDrawer(!showCRMDrawer)}
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  title="Exibir CRM e Kanban"
                >
                  <Workflow className="size-4" />
                </Button>
              </div>
            </div>

            {/* Janela de Mensagens */}
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {currentMessages.map((msg) => {
                const isLead = msg.sender === "lead";
                const isAgent = msg.sender === "agent";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isLead ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 text-xs leading-5 shadow-sm ${
                        isLead
                          ? "rounded-tl-sm bg-[#1e293b] text-slate-100"
                          : isAgent
                          ? "rounded-tr-sm bg-gradient-to-r from-blue-700 to-indigo-700 text-white"
                          : "rounded-tr-sm bg-emerald-700 text-white"
                      }`}
                    >
                      {isAgent && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-blue-200">
                          <Bot className="size-3" />
                          <span>{msg.agentName || "Agente IA"}</span>
                        </div>
                      )}

                      <p>{msg.content}</p>

                      <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] opacity-75">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!isLead && <CheckCheck className="size-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Menu Popover de Respostas Rápidas (com CRUD) */}
            {showQuickReplies && (
              <div className="border-t border-white/5 bg-[#0f172a] p-3 animate-in slide-in-from-bottom-2">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-3.5 text-amber-400" /> Respostas Rápidas ({quickReplies.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNewQrModalOpen(true)}
                      className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
                    >
                      + Criar Resposta
                    </button>
                    <button onClick={() => setShowQuickReplies(false)} className="hover:text-white">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {quickReplies.map((qr) => (
                    <div
                      key={qr.id}
                      className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-left transition hover:bg-white/[0.06]"
                    >
                      <button onClick={() => applyQuickReply(qr)} className="w-full text-left pr-5">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-white">{qr.title}</strong>
                          <span className="font-mono text-[10px] text-amber-400">{qr.shortcut}</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-400">{qr.content}</p>
                      </button>

                      <button
                        onClick={() => handleDeleteQuickReply(qr.id)}
                        className="absolute right-1.5 top-1.5 hidden rounded p-1 text-slate-500 hover:text-rose-400 group-hover:block"
                        title="Excluir resposta rápida"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input de Mensagem */}
            <div className="border-t border-white/5 bg-[#0f172a] p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Button
                  type="button"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  variant="outline"
                  className="border-white/10 px-3 text-xs text-amber-300 hover:bg-white/5"
                  title="Respostas Rápidas (/)"
                >
                  <Zap className="size-3.5 mr-1" /> /
                </Button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (e.target.value === "/") setShowQuickReplies(true);
                  }}
                  placeholder="Escreva uma mensagem ou digite / para atalhos..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <Button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="bg-emerald-600 px-4 text-white hover:bg-emerald-500"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
            Selecione uma conversa para iniciar o atendimento.
          </div>
        )}

        {/* Painel Direito: Kanban & Gestão de Etiquetas */}
        {activeConversation && showCRMDrawer && (
          <div className="hidden w-72 flex-col border-l border-white/5 bg-[#0f172a] p-4 xl:flex overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                CRM & Dados do Lead
              </h4>
              <Badge className="bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                Score {activeConversation.score || 80}/100
              </Badge>
            </div>

            {/* Movimentação no Kanban */}
            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-bold uppercase text-slate-400">
                Etapa no Kanban
              </label>
              <div className="space-y-1.5">
                {KANBAN_STAGES.map((stg) => {
                  const isCurrent = activeConversation.leadStage === stg.id;
                  return (
                    <button
                      key={stg.id}
                      onClick={() => handleStageChange(stg.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-2 text-xs font-semibold transition ${
                        isCurrent
                          ? `${stg.color} ring-1 ring-white/20`
                          : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span>{stg.label}</span>
                      {isCurrent && <Check className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gestão de Etiquetas / Labels */}
            <div className="mt-6 border-t border-white/5 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase text-slate-400">
                  Etiquetas da Conversa
                </label>
                <button
                  onClick={() => setNewLabelModalOpen(true)}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  + Nova Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {labels.map((lbl) => {
                  const isTagged = activeConversation.labels?.some((l) => l.id === lbl.id);
                  return (
                    <div key={lbl.id} className="group relative flex items-center">
                      <button
                        onClick={() => toggleLabel(lbl)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                          isTagged
                            ? "text-white ring-1 ring-white"
                            : "text-slate-400 opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: isTagged ? `${lbl.color}40` : "rgba(255,255,255,0.03)",
                          borderColor: lbl.color,
                        }}
                      >
                        {isTagged ? "✓ " : "+ "}
                        {lbl.name}
                      </button>

                      <button
                        onClick={() => handleDeleteLabel(lbl.id)}
                        className="ml-1 hidden text-slate-500 hover:text-rose-400 group-hover:inline-block"
                        title="Deletar etiqueta"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contexto Local */}
            <div className="mt-6 border-t border-white/5 pt-4 text-xs space-y-2">
              <label className="block text-[11px] font-bold uppercase text-slate-400">
                Contexto Local
              </label>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="size-3.5 text-blue-400" />
                <span>{activeConversation.city || "Campina Grande, PB"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="size-3.5 text-indigo-400" />
                <span>{activeConversation.niche || "Clínica Odontológica"}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL: CRIAR NOVA ETIQUETA */}
      {newLabelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm border border-white/10 bg-[#0f172a] p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Criar Nova Etiqueta</h3>
              <button onClick={() => setNewLabelModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Nome da Etiqueta</label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Ex: Sem Site, Urgente, Alto Ticket..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-300">Cor da Tag</label>
                <div className="flex gap-2">
                  {["#ef4444", "#f97316", "#eab308", "#10b981", "#3b82f6", "#a855f7", "#ec4899"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewLabelColor(c)}
                      className={`size-6 rounded-full transition ${newLabelColor === c ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setNewLabelModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateLabel} className="flex-1 bg-blue-600 text-white">
                  Salvar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: CRIAR NOVA RESPOSTA RÁPIDA */}
      {newQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md border border-white/10 bg-[#0f172a] p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Nova Resposta Rápida (Atalho /)</h3>
              <button onClick={() => setNewQrModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Atalho (ex: /pitch, /site)</label>
                <input
                  type="text"
                  value={newQrShortcut}
                  onChange={(e) => setNewQrShortcut(e.target.value)}
                  placeholder="/meu-atalho"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs font-mono text-amber-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-300">Título / Descrição Curta</label>
                <input
                  type="text"
                  value={newQrTitle}
                  onChange={(e) => setNewQrTitle(e.target.value)}
                  placeholder="Ex: Demonstração de Site para Clínicas"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-bold text-slate-300">Conteúdo da Mensagem</label>
                  <span className="text-[10px] text-slate-500">{"{niche}"}, {"{city}"}, {"{name}"}</span>
                </div>
                <textarea
                  rows={4}
                  value={newQrContent}
                  onChange={(e) => setNewQrContent(e.target.value)}
                  placeholder="Escreva a resposta rápida aqui..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setNewQrModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateQuickReply} className="flex-1 bg-amber-600 text-white">
                  Criar Atalho
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: NOVA CONVERSA */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md border border-white/10 bg-[#0f172a] p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Iniciar Nova Conversa</h3>
              <button onClick={() => setNewChatModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-300">Nome do Lead / Empresa</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Ex: Barbearia Elegance"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-300">Número de WhatsApp</label>
                <input
                  type="text"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  placeholder="5583999998888"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-300">Nicho</label>
                  <input
                    type="text"
                    value={newChatNiche}
                    onChange={(e) => setNewChatNiche(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-300">Cidade</label>
                  <input
                    type="text"
                    value={newChatCity}
                    onChange={(e) => setNewChatCity(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setNewChatModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateConversation} className="flex-1 bg-emerald-600 text-white">
                  Iniciar Chat
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <QRConnectModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onConnected={(inst) => setInstanceStatus(inst)}
      />
    </section>
  );
}
