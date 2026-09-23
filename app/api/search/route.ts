import { NextResponse } from "next/server";
import { searchLeads } from "@/lib/hunter/engine";
import { dedupeLeads, searchHunterDirectory } from "@/lib/hunter/internal-directory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function internalThreshold() {
  const configured = Number(process.env.HUNTER_INTERNAL_MIN_RESULTS || 12);
  return Number.isFinite(configured) ? Math.min(Math.max(configured, 1), 20) : 12;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Autenticação indisponível." }, { status: 503 });

    const { data: auth } = await supabase.auth.getClaims();
    if (!auth?.claims) {
      return NextResponse.json({ error: "Faça login para buscar leads." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const keyword = String(body.keyword || "").trim();
    const city = String(body.city || "").trim();

    if (!keyword || !city) {
      return NextResponse.json({ error: "Informe palavra-chave e cidade." }, { status: 400 });
    }

    const internal = await searchHunterDirectory(keyword, city, 20);
    const threshold = internalThreshold();

    if (internal.length >= threshold) {
      return NextResponse.json({
        query: { keyword, city },
        count: internal.length,
        mode: "live",
        provider: "hunter",
        costPath: "internal",
        leads: internal.slice(0, 20),
      }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const external = await searchLeads(keyword, city);
    const merged = dedupeLeads([...internal, ...external.leads]).slice(0, 20);

    return NextResponse.json({
      ...external,
      count: merged.length,
      provider: internal.length ? "hunter+fallback" : "fallback",
      costPath: "external",
      internalHits: internal.length,
      leads: merged,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    const status = /Informe/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
