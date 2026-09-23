"use client";

import type { Lead, SegmentInsight } from "@/lib/hunter/types";
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

export async function loadSegmentInsights(limit = 200): Promise<SegmentInsight[]> {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return [];

    const { data, error } = await supabase
      .from("search_snapshots")
      .select("keyword,city,leads,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const groups = new Map<string, {
      keyword: string;
      searches: number;
      cities: Set<string>;
      leads: Map<string, Lead>;
      lastSeenAt: string;
    }>();

    for (const row of data) {
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
      const avg = (values: number[]) => values.length ? values.reduce((a,b) => a + b, 0) / values.length : 0;

      return {
        keyword: group.keyword,
        searches: group.searches,
        cities: group.cities.size,
        uniqueLeads,
        noWebsiteRate: percentage(leads.filter((lead) => !lead.website).length),
        phoneRate: percentage(leads.filter((lead) => Boolean(lead.phone)).length),
        hotRate: percentage(leads.filter((lead) => lead.score >= 80).length),
        avgRating: Number(avg(leads.filter((lead) => lead.rating > 0).map((lead) => lead.rating)).toFixed(1)),
        avgScore: Math.round(avg(leads.map((lead) => lead.score))),
        lastSeenAt: group.lastSeenAt,
      } satisfies SegmentInsight;
    }).sort((a,b) => b.avgScore - a.avgScore || b.noWebsiteRate - a.noWebsiteRate);
  } catch {
    return [];
  }
}
