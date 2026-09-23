"use client";

import type { Lead, LeadCrmRecord, LeadStage } from "@/lib/hunter/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

async function ensureUser() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { supabase: null, user: null };

  const { data } = await supabase.auth.getUser();
  if (data.user) return { supabase, user: data.user };

  const { data: anonymous, error } = await supabase.auth.signInAnonymously();
  if (error || !anonymous.user) return { supabase, user: null };

  return { supabase, user: anonymous.user };
}

export function makeLeadKey(lead: Lead) {
  return `${lead.source || "unknown"}:${lead.id}`;
}

function rowToRecord(row: Record<string, unknown>): LeadCrmRecord {
  return {
    leadKey: String(row.lead_key || ""),
    status: String(row.status || "novo") as LeadStage,
    seenCount: Number(row.seen_count || 1),
    firstSeenAt: String(row.first_seen_at || ""),
    lastSeenAt: String(row.last_seen_at || ""),
    contactedAt: row.contacted_at ? String(row.contacted_at) : null,
    notes: String(row.notes || ""),
    lead: (row.data || {}) as Lead,
  };
}

export async function syncLeadsToRegistry(leads: Lead[]) {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user || !leads.length) return [] as LeadCrmRecord[];

    const { error } = await supabase.rpc("sync_lead_registry", { p_leads: leads });
    if (error) return [] as LeadCrmRecord[];

    return await loadLeadRegistry();
  } catch {
    return [] as LeadCrmRecord[];
  }
}

export async function loadLeadRegistry(limit = 500) {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return [] as LeadCrmRecord[];

    const { data, error } = await supabase
      .from("lead_registry")
      .select("lead_key,status,seen_count,first_seen_at,last_seen_at,contacted_at,notes,data")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [] as LeadCrmRecord[];
    return data.map((row) => rowToRecord(row as Record<string, unknown>));
  } catch {
    return [] as LeadCrmRecord[];
  }
}

export async function updateLeadStage(lead: Lead, status: LeadStage) {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return null;

    const leadKey = makeLeadKey(lead);
    const contacted = ["contatado","respondeu","negociacao","cliente"].includes(status);

    const { data, error } = await supabase
      .from("lead_registry")
      .update({
        status,
        contacted_at: contacted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("lead_key", leadKey)
      .select("lead_key,status,seen_count,first_seen_at,last_seen_at,contacted_at,notes,data")
      .maybeSingle();

    if (error || !data) return null;
    return rowToRecord(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
