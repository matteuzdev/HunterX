import { NextResponse } from "next/server";
import { searchLeads } from "@/lib/hunter/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await searchLeads(body.keyword, body.city);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    const status = /Informe/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
