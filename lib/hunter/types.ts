export type LeadTemperature = "Quente" | "Morno" | "Frio";
export type LeadPriority = "Alta" | "Média" | "Baixa";

export type Lead = {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  rating: number;
  reviews: number;
  businessStatus: string;
  socials: Record<string, string>;
  source: "mock" | "outscraper" | "apify" | "hunter";
  score: number;
  temperature: LeadTemperature;
  priority: LeadPriority;
  reasons: Array<[string, string]>;
  latitude?: number;
  longitude?: number;
};

export type SearchResult = {
  query: { keyword: string; city: string };
  count: number;
  mode: "mock" | "live";
  leads: Lead[];
};

export type HistoryItem = {
  keyword: string;
  city: string;
  count: number;
  mode?: string;
  at: string;
};


export type LeadStage =
  | "novo"
  | "analisado"
  | "demonstracao"
  | "contatado"
  | "respondeu"
  | "negociacao"
  | "cliente"
  | "perdido";

export type LeadCrmRecord = {
  leadKey: string;
  status: LeadStage;
  seenCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  contactedAt?: string | null;
  notes?: string;
  lead: Lead;
};

export type SegmentInsight = {
  keyword: string;
  searches: number;
  cities: number;
  uniqueLeads: number;
  noWebsiteRate: number;
  phoneRate: number;
  hotRate: number;
  avgRating: number;
  avgScore: number;
  lastSeenAt: string;
};

// ==========================================
// MENSAGERIA & WHATSAPP OMNICHANNEL
// ==========================================

export type WhatsAppConnectionStatus = "disconnected" | "connecting" | "qrcode" | "connected" | "error";

export type WhatsAppInstance = {
  instanceName: string;
  status: WhatsAppConnectionStatus;
  qrcode?: string | null;
  phoneNumber?: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  pairingCode?: string | null;
  apiUrl?: string;
  isRealConnection?: boolean;
  updatedAt: string;
  error?: string | null;
};

export type WhatsAppApiConfig = {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  autoConnect?: boolean;
};

export type MessageSenderType = "lead" | "agent" | "human";
export type MessageDeliveryStatus = "pending" | "sent" | "delivered" | "read";

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: MessageSenderType;
  content: string;
  timestamp: string;
  status: MessageDeliveryStatus;
  mediaUrl?: string;
  mediaType?: "image" | "audio" | "document";
  agentName?: string;
};

export type ChatLabel = {
  id: string;
  name: string;
  color: string; // hex ou tailwind class
};

export type QuickReply = {
  id: string;
  shortcut: string; // ex: "/site", "/diag", "/preco"
  title: string;
  content: string;
  category: "abordagem" | "diagnostico" | "objecao" | "fechamento";
};

export type Conversation = {
  id: string;
  leadId?: string;
  leadName: string;
  phoneNumber: string;
  channel: "whatsapp" | "instagram" | "telegram";
  unreadCount: number;
  lastMessage?: ChatMessage;
  aiHandled: boolean;
  assignedAgentId?: string;
  leadStage?: LeadStage;
  tags: string[];
  labels?: ChatLabel[];
  city?: string;
  niche?: string;
  score?: number;
  updatedAt: string;
};


// ==========================================
// AGENT STUDIO (GPT Maker / Converza / Zaya)
// ==========================================

export type AgentTone = "consultivo" | "persuasivo" | "formal" | "descontraido" | "direto";
export type AgentProvider = "openai" | "anthropic" | "gemini" | "groq" | "ollama";

export type KnowledgeSourceType = "text" | "website" | "document" | "faq";

export type AgentKnowledgeItem = {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  content: string;
  charCount?: number;
  status?: "trained" | "training" | "failed";
  updatedAt?: string;
};

export type AgentIntent = {
  id: string;
  name: string;
  description: string;
  samplePhrases: string[];
  actionType: "move_kanban" | "handoff_human" | "send_quick_reply" | "webhook";
  actionPayload?: Record<string, any>;
  isActive: boolean;
};

export type AIAgent = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  tone: AgentTone;
  provider: AgentProvider;
  model: string;
  temperature?: number; // 0.0 a 1.0
  welcomeMessage?: string;
  systemPrompt: string;
  rulesShouldDo?: string[];
  rulesNeverDo?: string[];
  enableKanbanTool?: boolean;
  enableWebSearchTool?: boolean;
  knowledgeBase: AgentKnowledgeItem[];
  intents?: AgentIntent[];
  fallbackToHuman: boolean;
  handoffKeywords: string[];
  handoffMessage?: string;
  isActive: boolean;
  assignedNiches: string[];
  createdAt: string;
  updatedAt: string;
};

