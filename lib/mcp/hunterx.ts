import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { scoreLead, searchLeads } from "@/lib/hunter/engine";
import type { Lead, LeadStage, SegmentInsight } from "@/lib/hunter/types";

export function createMcpSupabaseClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function verifyMcpUser(token: string) {
  const supabase = createMcpSupabaseClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) return null;
  return { user: data.user, supabase };
}

function queryKey(keyword: string, city: string) {
  return `${keyword.trim().toLowerCase()}::${city.trim().toLowerCase()}`;
}

function dedupe(leads: Lead[]) {
  const seen = new Set<string>();
  return leads.filter((lead) => {
    const phone = (lead.phone || "").replace(/\D/g, "");
    const website = (lead.website || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const identity = `${lead.name}|${lead.address}`.toLowerCase().replace(/\s+/g, " ").trim();
    const keys = [
      phone ? `phone:${phone}` : "",
      website ? `site:${website}` : "",
      identity ? `identity:${identity}` : "",
    ].filter(Boolean);

    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

function mapDirectoryRow(row: Record<string, unknown>, keyword: string, city: string): Lead {
  const location = [String(row.city || ""), String(row.state || "")].filter(Boolean).join(", ");
  const base = {
    id: String(row.business_key || ""),
    name: String(row.name || "Empresa"),
    category: String(row.category || keyword),
    city: location || city,
    address: String(row.address || ""),
    phone: String(row.phone || ""),
    website: String(row.website || ""),
    email: String(row.email || ""),
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    businessStatus: String(row.business_status || "OPERATIONAL"),
    socials: (row.socials && typeof row.socials === "object" ? row.socials : {}) as Record<string, string>,
    latitude: row.latitude == null ? undefined : Number(row.latitude),
    longitude: row.longitude == null ? undefined : Number(row.longitude),
    source: "hunter" as const,
  };
  return { ...base, ...scoreLead(base) };
}

export async function getHunterAccount(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("get_hunter_account");
  if (error || !Array.isArray(data) || !data[0]) throw new Error("Não foi possível carregar a conta HunterX.");
  const row = data[0] as Record<string, unknown>;
  return {
    balance: Number(row.balance || 0),
    dailyTarget: Number(row.daily_target || 100),
    batchSize: Number(row.batch_size || 20),
    focusMinutes: Number(row.focus_minutes || 25),
    lofiEnabled: Boolean(row.lofi_enabled),
    planId: String(row.plan_id || "free"),
    planName: String(row.plan_name || "Free"),
    unlimitedTokens: Boolean(row.unlimited_tokens),
  };
}

export async function searchHunterXForUser(
  supabase: SupabaseClient,
  userId: string,
  keywordRaw: string,
  cityRaw: string,
  limitRaw = 20,
) {
  const keyword = keywordRaw.trim().slice(0, 120);
  const city = cityRaw.trim().slice(0, 120);
  const limit = Math.min(Math.max(Math.round(limitRaw || 20), 1), 20);
  if (!keyword || !city) throw new Error("Informe nicho/palavra-chave e cidade.");

  const account = await getHunterAccount(supabase);
  if (!account.unlimitedTokens && account.balance < limit) {
    throw new Error(`Saldo insuficiente: lote de até ${limit} empresas, saldo atual ${account.balance} tokens.`);
  }

  const { data: matchCount, error: countError } = await supabase.rpc("count_hunter_directory_matches", {
    p_keyword: keyword,
    p_city: city,
    p_limit: limit,
  });
  if (countError) throw new Error(countError.message);

  let internal: Lead[] = [];
  let tokenBalance = account.balance;
  const internalCount = Number(matchCount || 0);

  if (internalCount > 0) {
    const { data, error } = await supabase.rpc("search_hunter_directory_metered", {
      p_keyword: keyword,
      p_city: city,
      p_limit: limit,
      p_reference: `mcp:${keyword}:${city}:internal`,
    });
    if (error) throw new Error(error.message);

    const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [];
    internal = rows.map((row) => mapDirectoryRow(row, keyword, city));
    if (rows.length && rows[0].token_balance != null) tokenBalance = Number(rows[0].token_balance);
  }

  let leads = internal.slice(0, limit);
  let provider = internal.length >= limit ? "hunter" : internal.length ? "hunter+fallback" : "fallback";

  if (leads.length < limit) {
    const external = await searchLeads(keyword, city);
    leads = dedupe([...internal, ...external.leads]).slice(0, limit);
    const externalAdded = leads.filter((lead) => lead.source !== "hunter").length;

    if (externalAdded > 0) {
      const { data: nextBalance, error } = await supabase.rpc("consume_tokens", {
        p_amount: externalAdded,
        p_reference: `mcp:${keyword}:${city}:fallback`,
        p_metadata: {
          provider: "fallback",
          count: externalAdded,
          internal_hits: internal.length,
          channel: "mcp",
        },
      });
      if (error) throw new Error(error.message);
      tokenBalance = Number(nextBalance ?? tokenBalance);
    }
  }

  if (leads.length) {
    const { error: snapshotError } = await supabase.from("search_snapshots").insert({
      user_id: userId,
      query_key: queryKey(keyword, city),
      keyword,
      city,
      mode: "live",
      leads,
    });
    if (snapshotError) throw new Error(`Busca concluída, mas falhou ao salvar histórico: ${snapshotError.message}`);

    await supabase.rpc("sync_lead_registry", { p_leads: leads });
  }

  return {
    query: { keyword, city },
    count: leads.length,
    provider,
    tokenCost: account.unlimitedTokens ? 0 : leads.length,
    tokenBalance,
    unlimitedTokens: account.unlimitedTokens,
    leads,
  };
}

export async function listSearchHistory(supabase: SupabaseClient, limit = 30) {
  const { data, error } = await supabase
    .from("search_snapshots")
    .select("query_key,keyword,city,mode,leads,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  return (data || []).flatMap((row) => {
    const key = String(row.query_key || queryKey(String(row.keyword || ""), String(row.city || "")));
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [{
      queryKey: key,
      keyword: String(row.keyword || ""),
      city: String(row.city || ""),
      mode: String(row.mode || "live"),
      count: Array.isArray(row.leads) ? row.leads.length : 0,
      createdAt: String(row.created_at || ""),
    }];
  });
}

export async function getSavedSearch(supabase: SupabaseClient, keyword: string, city: string) {
  const { data, error } = await supabase
    .from("search_snapshots")
    .select("keyword,city,mode,leads,created_at")
    .eq("query_key", queryKey(keyword, city))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    keyword: String(data.keyword || ""),
    city: String(data.city || ""),
    mode: String(data.mode || "live"),
    leads: Array.isArray(data.leads) ? data.leads as Lead[] : [],
    createdAt: String(data.created_at || ""),
  };
}

export async function listPipeline(supabase: SupabaseClient, status?: LeadStage, limit = 100) {
  let query = supabase
    .from("lead_registry")
    .select("lead_key,status,seen_count,first_seen_at,last_seen_at,contacted_at,notes,data")
    .order("last_seen_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    leadKey: String(row.lead_key || ""),
    status: String(row.status || "novo"),
    seenCount: Number(row.seen_count || 1),
    firstSeenAt: String(row.first_seen_at || ""),
    lastSeenAt: String(row.last_seen_at || ""),
    contactedAt: row.contacted_at ? String(row.contacted_at) : null,
    notes: String(row.notes || ""),
    lead: row.data as Lead,
  }));
}

export async function updatePipelineStage(
  supabase: SupabaseClient,
  leadKey: string,
  status: LeadStage,
) {
  const contacted = ["contatado", "respondeu", "negociacao", "cliente"].includes(status);
  const { data, error } = await supabase
    .from("lead_registry")
    .update({
      status,
      contacted_at: contacted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("lead_key", leadKey)
    .select("lead_key,status,seen_count,first_seen_at,last_seen_at,contacted_at,notes,data")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lead não encontrado no teu pipeline.");
  return data;
}

export async function getSegmentInsights(supabase: SupabaseClient, limit = 200): Promise<SegmentInsight[]> {
  const { data, error } = await supabase
    .from("search_snapshots")
    .select("keyword,city,leads,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) throw new Error(error.message);

  const groups = new Map<string, {
    keyword: string;
    searches: number;
    cities: Set<string>;
    leads: Map<string, Lead>;
    lastSeenAt: string;
  }>();

  for (const row of data || []) {
    const keyword = String(row.keyword || "").trim();
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    const group = groups.get(key) || {
      keyword,
      searches: 0,
      cities: new Set<string>(),
      leads: new Map<string, Lead>(),
      lastSeenAt: String(row.created_at || ""),
    };

    group.searches += 1;
    group.cities.add(String(row.city || ""));
    if (String(row.created_at || "") > group.lastSeenAt) group.lastSeenAt = String(row.created_at || "");

    if (Array.isArray(row.leads)) {
      for (const raw of row.leads) {
        const lead = raw as Lead;
        group.leads.set(`${lead.source || "unknown"}:${lead.id}`, lead);
      }
    }
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    const leads = [...group.leads.values()];
    const uniqueLeads = leads.length;
    const percentage = (count: number) => uniqueLeads ? Math.round((count / uniqueLeads) * 100) : 0;
    const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return {
      keyword: group.keyword,
      searches: group.searches,
      cities: group.cities.size,
      uniqueLeads,
      noWebsiteRate: percentage(leads.filter((lead) => !lead.website).length),
      phoneRate: percentage(leads.filter((lead) => Boolean(lead.phone)).length),
      hotRate: percentage(leads.filter((lead) => lead.score >= 80).length),
      avgRating: Number(average(leads.filter((lead) => lead.rating > 0).map((lead) => lead.rating)).toFixed(1)),
      avgScore: Math.round(average(leads.map((lead) => lead.score))),
      lastSeenAt: group.lastSeenAt,
    };
  }).sort((a, b) => b.avgScore - a.avgScore || b.noWebsiteRate - a.noWebsiteRate);
}
