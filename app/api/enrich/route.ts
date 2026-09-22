import { NextResponse } from "next/server";
import { enrichLeadWebsite } from "@/lib/hunter/engine";
import type { Lead } from "@/lib/hunter/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await enrichLeadWebsite(body.website, (body.lead || {}) as Lead);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
