"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type ExportLog = {
  id: string;
  keyword: string;
  city: string;
  leadCount: number;
  createdAt: string;
};

async function ensureUser() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  if (data.user) return { supabase, user: data.user };
  const { data: anonymous, error } = await supabase.auth.signInAnonymously();
  if (error || !anonymous.user) return { supabase, user: null };
  return { supabase, user: anonymous.user };
}

export async function logExport(input: { keyword: string; city: string; leadCount: number }) {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return false;
    const { error } = await supabase.from("export_logs").insert({
      user_id: user.id,
      keyword: input.keyword,
      city: input.city,
      lead_count: input.leadCount,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function loadExportLogs(limit = 100): Promise<ExportLog[]> {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return [];
    const { data, error } = await supabase
      .from("export_logs")
      .select("id,keyword,city,lead_count,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id),
      keyword: String(row.keyword || ""),
      city: String(row.city || ""),
      leadCount: Number(row.lead_count || 0),
      createdAt: String(row.created_at || ""),
    }));
  } catch {
    return [];
  }
}
