"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type HunterAccount = {
  balance: number;
  dailyTarget: number;
  batchSize: number;
  focusMinutes: number;
  lofiEnabled: boolean;
  contactedToday: number;
  planId: string;
  planName: string;
  unlimitedTokens: boolean;
};

export type TokenPackage = {
  id: string;
  name: string;
  tokens: number;
  bonusTokens: number;
  priceCents: number;
  currency: string;
  checkoutUrl: string;
};

async function clientAndUser() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function loadHunterAccount(): Promise<HunterAccount | null> {
  try {
    const { supabase, user } = await clientAndUser();
    if (!supabase || !user) return null;

    const { data, error } = await supabase.rpc("get_hunter_account");
    if (error || !Array.isArray(data) || !data[0]) return null;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("lead_registry")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("contacted_at", start.toISOString());

    const row = data[0] as Record<string, unknown>;
    return {
      balance: Number(row.balance || 0),
      dailyTarget: Number(row.daily_target || 100),
      batchSize: Math.min(20, Number(row.batch_size || 20)),
      focusMinutes: Number(row.focus_minutes || 25),
      lofiEnabled: Boolean(row.lofi_enabled),
      contactedToday: Number(count || 0),
      planId: String(row.plan_id || "free"),
      planName: String(row.plan_name || "Free"),
      unlimitedTokens: Boolean(row.unlimited_tokens),
    };
  } catch {
    return null;
  }
}

export async function updateFocusSettings(input: {
  dailyTarget: number;
  batchSize: number;
  focusMinutes: number;
  lofiEnabled: boolean;
}) {
  const { supabase, user } = await clientAndUser();
  if (!supabase || !user) return false;

  const { error } = await supabase.from("focus_settings").upsert({
    user_id: user.id,
    daily_target: Math.min(Math.max(Math.round(input.dailyTarget), 20), 5000),
    batch_size: Math.min(Math.max(Math.round(input.batchSize), 5), 20),
    focus_minutes: Math.min(Math.max(Math.round(input.focusMinutes), 5), 120),
    lofi_enabled: input.lofiEnabled,
    updated_at: new Date().toISOString(),
  });

  return !error;
}

export async function loadTokenPackages(): Promise<TokenPackage[]> {
  const { supabase, user } = await clientAndUser();
  if (!supabase || !user) return [];

  const { data, error } = await supabase
    .from("token_packages")
    .select("id,name,tokens,bonus_tokens,price_cents,currency,checkout_url")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    tokens: Number(row.tokens),
    bonusTokens: Number(row.bonus_tokens || 0),
    priceCents: Number(row.price_cents),
    currency: String(row.currency || "BRL"),
    checkoutUrl: String(row.checkout_url || ""),
  }));
}
