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
};

function clamp(value: unknown, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

export async function searchHunterDirectory(
  rawKeyword: unknown,
  rawCity: unknown,
  limit = 20,
): Promise<Lead[]> {
  const keyword = clamp(rawKeyword);
  const city = clamp(rawCity);
  if (!keyword || !city) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("search_hunter_directory", {
    p_keyword: keyword,
    p_city: city,
    p_limit: Math.min(Math.max(limit, 1), 50),
  });

  if (error || !Array.isArray(data)) return [];

  return (data as DirectoryRow[]).map((row) => {
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
  });
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
