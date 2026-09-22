"use client";

import type { Lead } from "@/lib/hunter/types";
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

export async function saveSearchSnapshot(input: {
  keyword: string;
  city: string;
  mode: string;
  leads: Lead[];
}) {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return false;

    const { error } = await supabase.from("search_snapshots").insert({
      user_id: user.id,
      keyword: input.keyword,
      city: input.city,
      mode: input.mode,
      leads: input.leads,
    });

    return !error;
  } catch {
    return false;
  }
}

export async function loadLatestSearchSnapshot() {
  try {
    const { supabase, user } = await ensureUser();
    if (!supabase || !user) return null;

    const { data, error } = await supabase
      .from("search_snapshots")
      .select("keyword,city,mode,leads,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !Array.isArray(data.leads)) return null;

    return {
      keyword: data.keyword as string,
      city: data.city as string,
      mode: data.mode as string,
      leads: data.leads as Lead[],
      createdAt: data.created_at as string,
    };
  } catch {
    return null;
  }
}
