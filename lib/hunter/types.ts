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
  source: "mock" | "outscraper" | "apify";
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
