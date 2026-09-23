import "server-only";

import type { Lead } from "@/lib/hunter/types";
import { scoreLead } from "@/lib/hunter/engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DirectoryRow = {
  business_key: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  socials: Record<string, string> | null;
  rating: number | string | null;
  reviews: number | string | null;
  business_status: string;
  latitude: number | null;
  longitude: number | null;
  source: string;
  last_seen_at: string;
  last_crawled_at: string | null;
  token_balance?: number | null;
};

function clamp(value: unknown, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

function mapDirectoryRow(row: DirectoryRow, keyword: string, city: string): Lead {
  const location = [row.city, row.state].filter(Boolean).join(", ");
  const base = {
    id: row.business_key,
    name: row.name || "Empresa",
    category: row.category || keyword,
    city: location || city,
    address: row.address || "",
    phone: row.phone || "",
    website: row.website || "",
    email: row.email || "",
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    businessStatus: row.business_status || "OPERATIONAL",
    socials: row.socials || {},
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    source: "hunter" as const,
  };
  return { ...base, ...scoreLead(base) };
}

export async function countHunterDirectoryMatches(rawKeyword: unknown, rawCity: unknown, limit = 20) {
  const keyword = clamp(rawKeyword);
  const city = clamp(rawCity);
  if (!keyword || !city) return 0;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc("count_hunter_directory_matches", {
    p_keyword: keyword,
    p_city: city,
    p_limit: Math.min(Math.max(limit, 1), 20),
  });

  if (error) return 0;
  return Number(data || 0);
}

export async function searchHunterDirectoryMetered(
  rawKeyword: unknown,
  rawCity: unknown,
  limit = 20,
  reference = "",
): Promise<{ leads: Lead[]; tokenBalance: number | null }> {
  const keyword = clamp(rawKeyword);
  const city = clamp(rawCity);
  if (!keyword || !city) return { leads: [], tokenBalance: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { leads: [], tokenBalance: null };

  const { data, error } = await supabase.rpc("search_hunter_directory_metered", {
    p_keyword: keyword,
    p_city: city,
    p_limit: Math.min(Math.max(limit, 1), 20),
    p_reference: reference,
  });

  if (error) {
    if (/INSUFFICIENT_TOKENS/i.test(error.message)) throw new Error("INSUFFICIENT_TOKENS");
    throw new Error(error.message);
  }

  const rows = Array.isArray(data) ? data as DirectoryRow[] : [];
  return {
    leads: rows.map((row) => mapDirectoryRow(row, keyword, city)),
    tokenBalance: rows.length ? Number(rows[0].token_balance ?? 0) : null,
  };
}

export function dedupeLeads(leads: Lead[]) {
  const seen = new Set<string>();

  return leads.filter((lead) => {
    const phone = (lead.phone || "").replace(/\D/g, "");
    const website = (lead.website || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const nameAddress = `${lead.name}|${lead.address}`.toLowerCase().replace(/\s+/g, " ").trim();

    const keys = [
      phone ? `phone:${phone}` : "",
      website ? `site:${website}` : "",
      nameAddress ? `name:${nameAddress}` : "",
    ].filter(Boolean);

    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}
