import { NextResponse, type NextRequest } from "next/server";
import { searchHunterDirectory } from "@/lib/hunter/internal-directory";
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
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 20), 1), 50);

  if (!keyword || !city) {
    return NextResponse.json({ error: "Use ?keyword=...&city=..." }, { status: 400 });
  }

  const leads = await searchHunterDirectory(keyword, city, limit);

  return NextResponse.json({
    api: "hunter-engine",
    source: "internal-directory",
    query: { keyword, city },
    count: leads.length,
    leads,
  }, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
