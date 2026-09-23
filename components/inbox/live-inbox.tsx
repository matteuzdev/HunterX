"use client";

import { useState, useEffect } from "react";
import {
  MessageSquareText, Search, Send, QrCode, Bot, UserCheck, Phone, CheckCheck,
  Sparkles, Clock, MoreVertical, Filter, Tag, Zap, ChevronRight, Workflow,
  Plus, Trash2, Edit3, X, Check, Globe, MapPin, Building2, UserPlus, Sliders
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
        content: "Olá equipe da Clínica Sorriso & Arte! Aqui é o consultor comercial da agência. Notei a excelente reputação de vocês no Google em Campina Grande!",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: "read",
        agentName: "Consultor HunterX",
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
        id: "m3",
        conversationId: "conv-2",
        sender: "human",
        content: "Combinado Pedro! Te mandei o link com os detalhes da proposta.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: "delivered",
      },
    ],
  });

  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "ai" | "human">("all");
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);

  // Estados dos CRUDs de Etiquetas e Respostas Rápidas
  const [labels, setLabels] = useState<ChatLabel[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hunterx-labels");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_LABELS;
  });

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hunterx-quick-replies");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_QUICK_REPLIES;
  });

  // Modais de Criação
  const [newLabelModalOpen, setNewLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#2563eb");

  const [newQuickReplyModalOpen, setNewQuickReplyModalOpen] = useState(false);
  const [newQrShortcut, setNewQrShortcut] = useState("/");
  const [newQrTitle, setNewQrTitle] = useState("");
  const [newQrContent, setNewQrContent] = useState("");

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatInitialMessage, setNewChatInitialMessage] = useState("");

  // Persistência
  useEffect(() => {
    try {
      localStorage.setItem("hunterx-conversations", JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem("hunterx-labels", JSON.stringify(labels));
    } catch {}
  }, [labels]);

  useEffect(() => {
    try {
      localStorage.setItem("hunterx-quick-replies", JSON.stringify(quickReplies));
    } catch {}
  }, [quickReplies]);

  const activeConversation = conversations.find((c) => c.id === selectedId) || conversations[0];
  const activeMessages = activeConversation ? messages[activeConversation.id] || [] : [];

  function handleSendMessage(customText?: string) {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeConversation) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversation.id,
      sender: "human",
      content: textToSend,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessage: newMsg,
              updatedAt: newMsg.timestamp,
              unreadCount: 0,
            }
          : c
      )
    );

    setInputText("");
    setQuickRepliesOpen(false);

    // Se estiver com IA ativa, dispara inferência em background
    if (activeConversation.aiHandled) {
      setTimeout(() => {
        void triggerAIReply(activeConversation, textToSend);
      }, 1000);
    }
  }

  async function triggerAIReply(conv: Conversation, userText: string) {
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: conv.assignedAgentId || "default",
          message: userText,
          lead: {
            name: conv.leadName,
            city: conv.city,
            category: conv.niche,
            phone: conv.phoneNumber,
          },
          chatHistory: messages[conv.id] || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          conversationId: conv.id,
          sender: "agent",
          content: data.reply,
          timestamp: new Date().toISOString(),
          status: "delivered",
          agentName: "Consultor HunterX",
        };

        setMessages((prev) => ({
          ...prev,
          [conv.id]: [...(prev[conv.id] || []), aiMsg],
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id
              ? {
                  ...c,
                  lastMessage: aiMsg,
                  updatedAt: aiMsg.timestamp,
                  leadStage: data.shouldHandoff ? "respondeu" : c.leadStage,
                  aiHandled: data.shouldHandoff ? false : c.aiHandled,
                }
              : c
          )
        );
      }
    } catch (e) {
      console.error("Erro na inferência da IA:", e);
    }
  }

  function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    const newLbl: ChatLabel = {
      id: `lbl-${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor,
    };
    setLabels([...labels, newLbl]);
    setNewLabelName("");
    setNewLabelModalOpen(false);
  }

  function handleDeleteLabel(labelId: string) {
    setLabels(labels.filter((l) => l.id !== labelId));
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        labels: (c.labels || []).filter((l) => l.id !== labelId),
      }))
    );
  }

  function handleToggleLabelInConv(label: ChatLabel) {
    if (!activeConversation) return;
    const currentLabels = activeConversation.labels || [];
    const hasLabel = currentLabels.some((l) => l.id === label.id);
    const updatedLabels = hasLabel
      ? currentLabels.filter((l) => l.id !== label.id)
      : [...currentLabels, label];

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, labels: updatedLabels } : c))
    );
  }

  function handleCreateQuickReply() {
    if (!newQrTitle.trim() || !newQrContent.trim()) return;
    let shortcut = newQrShortcut.trim();
    if (!shortcut.startsWith("/")) shortcut = `/${shortcut}`;

    const newQr: QuickReply = {
      id: `qr-${Date.now()}`,
      title: newQrTitle.trim(),
      shortcut,
      content: newQrContent.trim(),
      category: "abordagem",
    };

    setQuickReplies([...quickReplies, newQr]);
    setNewQrShortcut("/");
    setNewQrTitle("");
    setNewQrContent("");
    setNewQuickReplyModalOpen(false);
  }

  function handleDeleteQuickReply(qrId: string) {
    setQuickReplies(quickReplies.filter((q) => q.id !== qrId));
  }

  function handleSelectQuickReply(qr: QuickReply) {
    if (!activeConversation) return;
    let text = qr.content;
    text = text.replace("{name}", activeConversation.leadName);
    text = text.replace("{city}", activeConversation.city || "sua região");
    text = text.replace("{niche}", activeConversation.niche || "seu segmento");
    handleSendMessage(text);
  }

  function handleCreateNewChat() {
    if (!newChatName.trim() || !newChatPhone.trim()) return;
    const cleanPhone = newChatPhone.replace(/\D/g, "");
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      leadName: newChatName.trim(),
      phoneNumber: cleanPhone,
      channel: "whatsapp",
      unreadCount: 0,
      aiHandled: true,
      leadStage: "novo",
      city: "Brasil",
      niche: "Geral",
      score: 70,
      tags: ["Prospecção Direta"],
      labels: [labels[0]],
      updatedAt: new Date().toISOString(),
    };

    setConversations([newConv, ...conversations]);
    setSelectedId(newConv.id);

    if (newChatInitialMessage.trim()) {
      const firstMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: newConv.id,
        sender: "human",
        content: newChatInitialMessage.trim(),
        timestamp: new Date().toISOString(),
        status: "sent",
      };
      setMessages((prev) => ({
        ...prev,
        [newConv.id]: [firstMsg],
      }));
      newConv.lastMessage = firstMsg;
    }

    setNewChatName("");
    setNewChatPhone("");
    setNewChatInitialMessage("");
    setNewChatModalOpen(false);
  }

  function handleChangeStage(newStage: LeadStage) {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, leadStage: newStage } : c))
    );
  }

  function handleToggleAI() {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, aiHandled: !c.aiHandled } : c))
    );
  }

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery) ||
      (c.niche && c.niche.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === "unread" && c.unreadCount === 0) return false;
    if (filterType === "ai" && !c.aiHandled) return false;
    if (filterType === "human" && c.aiHandled) return false;
    if (selectedLabelId && !(c.labels || []).some((l) => l.id === selectedLabelId)) return false;
    return true;
  });

  return (
    <>
      <div className="relative flex h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Coluna 1: Lista de Conversas e Filtros */}
      <div className="flex h-full w-full flex-col border-r border-slate-200 md:w-80 lg:w-96 shrink-0">
        {/* Barra Superior Compacta de Ações (Sem títulos externos) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Conversas</span>
            <Badge className="bg-slate-200 text-[10px] text-slate-700 font-semibold">{conversations.length}</Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => setNewChatModalOpen(true)}
              variant="secondary"
              size="sm"
              className="h-8 px-2.5 text-xs"
              title="Nova Conversa"
            >
              <UserPlus className="mr-1 size-3.5" /> Nova
            </Button>

            <Button
              onClick={() => setQrModalOpen(true)}
              variant="primary"
              size="sm"
              className="h-8 px-2.5 text-xs"
              title="Conectar WhatsApp"
            >
              <QrCode className="mr-1 size-3.5" /> Conectar
            </Button>
          </div>
        </div>

        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversa ou lead..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
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
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    filterType === type
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Barra de Etiquetas */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
              <button
                onClick={() => setNewLabelModalOpen(true)}
                className="shrink-0 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-500 hover:border-slate-400 hover:text-slate-700"
                title="Criar nova etiqueta"
              >
                + Nova Tag
              </button>

              {labels.map((lbl) => {
                const isActive = selectedLabelId === lbl.id;
                return (
                  <button
                    key={lbl.id}
                    onClick={() => setSelectedLabelId(isActive ? null : lbl.id)}
                    className={`shrink-0 rounded-full px-2.5 py-1 font-bold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {lbl.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Chats */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {filteredConversations.length ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`group relative flex cursor-pointer items-start gap-3 p-4 transition ${
                      isSelected
                        ? "border-l-4 border-l-blue-600 bg-blue-50/50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                      {conv.leadName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="truncate text-xs font-bold text-slate-900">
                          {conv.leadName}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                        {conv.lastMessage?.content || "Nenhuma mensagem ainda"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-slate-100 text-[9px] text-slate-600 capitalize">
                          {conv.leadStage}
                        </Badge>

                        {conv.aiHandled ? (
                          <Badge className="bg-blue-50 text-[9px] text-blue-700">
                            IA Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-[9px] text-amber-700">
                            Humano
                          </Badge>
                        )}

                        {(conv.labels || []).slice(0, 2).map((l) => (
                          <span
                            key={l.id}
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600"
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Nenhuma conversa encontrada.
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Janela de Conversa Ativa */}
        {activeConversation ? (
          <div className="flex flex-1 flex-col bg-slate-50/40">
            {/* Header do Chat */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                  {activeConversation.leadName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{activeConversation.leadName}</h2>
                  <p className="text-[11px] text-slate-400">
                    +{activeConversation.phoneNumber} • {activeConversation.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleToggleAI}
                  variant="secondary"
                  size="sm"
                >
                  <Bot className="mr-1.5 size-3.5" />
                  {activeConversation.aiHandled ? "Pausar IA" : "Ativar IA"}
                </Button>

                <Button
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  variant="secondary"
                  size="sm"
                >
                  <Sliders className="size-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {activeMessages.map((msg) => {
                const isSentByMe = msg.sender === "human";
                const isAgent = msg.sender === "agent";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSentByMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-sm ${
                        isSentByMe
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : isAgent
                          ? "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm"
                          : "bg-white border border-slate-200 text-slate-900 rounded-tl-sm"
                      }`}
                    >
                      {isAgent && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-blue-600">
                          <Bot className="size-3" /> Resposta Automática (IA)
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                          isSentByMe ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isSentByMe && <CheckCheck className="size-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Painel de Respostas Rápidas Pop-up */}
            {quickRepliesOpen && (
              <div className="border-t border-slate-200 bg-white p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Respostas Rápidas (Atalhos)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNewQuickReplyModalOpen(true)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      + Novo Atalho
                    </button>
                    <button onClick={() => setQuickRepliesOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">
                  {quickReplies.map((qr) => (
                    <div
                      key={qr.id}
                      className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:border-blue-400 hover:bg-blue-50/50"
                    >
                      <button
                        onClick={() => handleSelectQuickReply(qr)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <strong className="block truncate text-[11px] font-bold text-slate-800">
                          {qr.shortcut} • {qr.title}
                        </strong>
                        <p className="truncate text-[10px] text-slate-500">{qr.content}</p>
                      </button>
                      <button
                        onClick={() => handleDeleteQuickReply(qr.id)}
                        className="ml-2 text-slate-400 hover:text-red-600"
                        title="Excluir atalho"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de Digitação */}
            <div className="border-t border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setQuickRepliesOpen(!quickRepliesOpen)}
                  variant="secondary"
                  size="sm"
                  title="Respostas Rápidas"
                >
                  <Zap className="size-4 text-amber-500" />
                </Button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (e.target.value === "/") setQuickRepliesOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Digite uma mensagem ou '/' para atalhos rápidos..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />

                <Button
                  onClick={() => handleSendMessage()}
                  variant="primary"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center text-center text-xs text-slate-400">
            Selecione uma conversa para visualizar o histórico.
          </div>
        )}

        {/* Coluna 3: Gaveta Lateral do Lead & Pipeline */}
        {showRightDrawer && activeConversation && (
          <div className="w-80 border-l border-slate-200 bg-white p-5 overflow-y-auto">
            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Lead Intelligence</span>
              <h3 className="mt-1 text-base font-bold text-slate-900">{activeConversation.leadName}</h3>
              <p className="text-xs text-slate-500">{activeConversation.niche} • {activeConversation.city}</p>
            </div>

            {/* Estágio no Pipeline */}
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">
                Estágio no Pipeline
              </label>
              <select
                value={activeConversation.leadStage}
                onChange={(e) => handleChangeStage(e.target.value as LeadStage)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {KANBAN_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Etiquetas da Conversa */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Etiquetas</span>
                <button
                  onClick={() => setNewLabelModalOpen(true)}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  + Nova
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {labels.map((lbl) => {
                  const isChecked = (activeConversation.labels || []).some((l) => l.id === lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      onClick={() => handleToggleLabelInConv(lbl)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                        isChecked
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {lbl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Telefone</span>
                <strong className="text-slate-900">+{activeConversation.phoneNumber}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Score de Potencial</span>
                <Badge className="bg-emerald-50 text-emerald-700">{activeConversation.score || 80}/100</Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Canal</span>
                <span className="font-semibold text-slate-900 capitalize">{activeConversation.channel}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova Conversa */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Iniciar Nova Conversa</h3>
              <button onClick={() => setNewChatModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Nome da Empresa / Contato</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Ex: Clínica Odontológica Prime"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Número de WhatsApp (com DDD)</label>
                <input
                  type="text"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  placeholder="Ex: 5583999998888"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Mensagem Inicial (Opcional)</label>
                <textarea
                  rows={3}
                  value={newChatInitialMessage}
                  onChange={(e) => setNewChatInitialMessage(e.target.value)}
                  placeholder="Olá! Analisei sua empresa no Google e tenho uma oportunidade para apresentar."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setNewChatModalOpen(false)} variant="secondary" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleCreateNewChat} variant="primary" size="sm">
                Iniciar Conversa
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Nova Etiqueta */}
      {newLabelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Criar Etiqueta</h3>
              <button onClick={() => setNewLabelModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="size-4" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Nome da Etiqueta</label>
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Ex: Lead Quente, Sem Website..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setNewLabelModalOpen(false)} variant="secondary" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleCreateLabel} variant="primary" size="sm">
                Salvar Etiqueta
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Novo Atalho de Resposta Rápida */}
      {newQuickReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Novo Atalho de Resposta</h3>
              <button onClick={() => setNewQuickReplyModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Atalho (inicie com /)</label>
                <input
                  type="text"
                  value={newQrShortcut}
                  onChange={(e) => setNewQrShortcut(e.target.value)}
                  placeholder="/site, /preco, /diag..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Título / Assunto</label>
                <input
                  type="text"
                  value={newQrTitle}
                  onChange={(e) => setNewQrTitle(e.target.value)}
                  placeholder="Ex: Apresentação de Site Rápido"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Conteúdo do Script</label>
                  <span className="text-[10px] text-slate-400">Variáveis: {"{name}"}, {"{city}"}</span>
                </div>
                <textarea
                  rows={4}
                  value={newQrContent}
                  onChange={(e) => setNewQrContent(e.target.value)}
                  placeholder="Escreva a resposta padrão aqui..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setNewQuickReplyModalOpen(false)} variant="secondary" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleCreateQuickReply} variant="primary" size="sm">
                Salvar Atalho
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal QR Code */}
      <QRConnectModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </>
  );
}
