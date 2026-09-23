import { NextResponse, type NextRequest } from "next/server";
import { searchHunterDirectoryMetered } from "@/lib/hunter/internal-directory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Autenticação indisponível." }, { status: 503 });

  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() || "";
  const city = request.nextUrl.searchParams.get("city")?.trim() || "";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 20), 1), 20);

  if (!keyword || !city) {
    return NextResponse.json({ error: "Use ?keyword=...&city=..." }, { status: 400 });
  }

  try {
    const result = await searchHunterDirectoryMetered(
      keyword,
      city,
      limit,
      `api:${keyword}:${city}`,
    );

    return NextResponse.json({
      api: "hunter-engine",
      source: "internal-directory",
      query: { keyword, city },
      count: result.leads.length,
      tokenCost: result.leads.length,
      tokenBalance: result.tokenBalance,
      leads: result.leads,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    if (/INSUFFICIENT_TOKENS/i.test(message)) {
      return NextResponse.json({ error: "Saldo de tokens insuficiente.", code: "INSUFFICIENT_TOKENS" }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
