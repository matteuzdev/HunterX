import { NextResponse } from "next/server";
import { searchLeads } from "@/lib/hunter/engine";
import {
  countHunterDirectoryMatches,
  dedupeLeads,
  searchHunterDirectoryMetered,
} from "@/lib/hunter/internal-directory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const limit = Math.min(Math.max(Number(body.limit || 20), 1), 20);

    if (!keyword || !city) {
      return NextResponse.json({ error: "Informe palavra-chave e cidade." }, { status: 400 });
    }

    const { data: accountData, error: accountError } = await supabase.rpc("get_hunter_account");
    if (accountError || !Array.isArray(accountData) || !accountData[0]) {
      return NextResponse.json({ error: "Não foi possível validar seu plano." }, { status: 503 });
    }

    const balance = Number(accountData[0].balance || 0);
    const unlimitedTokens = Boolean(accountData[0].unlimited_tokens);
    if (!unlimitedTokens && balance < limit) {
      return NextResponse.json({
        error: `Saldo insuficiente para um lote de ${limit}. Seu saldo é ${balance} tokens.`,
        code: "INSUFFICIENT_TOKENS",
        balance,
      }, { status: 402 });
    }

    const internalCount = await countHunterDirectoryMatches(keyword, city, limit);
    let internalLeads = [] as Awaited<ReturnType<typeof searchHunterDirectoryMetered>>["leads"];
    let tokenBalance = balance;

    if (internalCount > 0) {
      const internal = await searchHunterDirectoryMetered(
        keyword,
        city,
        limit,
        `search:${keyword}:${city}:internal`,
      );
      internalLeads = internal.leads;
      if (internal.tokenBalance !== null) tokenBalance = internal.tokenBalance;
    }

    if (internalLeads.length >= limit) {
      return NextResponse.json({
        query: { keyword, city },
        count: internalLeads.length,
        mode: "live",
        provider: "hunter",
        costPath: "internal",
        tokenCost: unlimitedTokens ? 0 : internalLeads.length,
        tokenBalance,
        leads: internalLeads.slice(0, limit),
      }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const external = await searchLeads(keyword, city);
    const leads = dedupeLeads([...internalLeads, ...external.leads]).slice(0, limit);
    const externalAdded = leads.filter((lead) => lead.source !== "hunter").length;

    if (externalAdded > 0) {
      const { data: nextBalance, error: tokenError } = await supabase.rpc("consume_tokens", {
        p_amount: externalAdded,
        p_reference: `search:${keyword}:${city}:fallback`,
        p_metadata: {
          provider: "fallback",
          count: externalAdded,
          internal_hits: internalLeads.length,
        },
      });
      if (tokenError) {
        return NextResponse.json({ error: "Não foi possível debitar os tokens complementares desta busca." }, { status: 409 });
      }
      tokenBalance = Number(nextBalance);
    }

    return NextResponse.json({
      ...external,
      count: leads.length,
      provider: internalLeads.length ? "hunter+fallback" : "fallback",
      costPath: internalLeads.length ? "hybrid" : "external",
      internalHits: internalLeads.length,
      tokenCost: unlimitedTokens ? 0 : leads.length,
      tokenBalance,
      leads,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    if (/INSUFFICIENT_TOKENS/i.test(message)) {
      return NextResponse.json({ error: "Saldo de tokens insuficiente.", code: "INSUFFICIENT_TOKENS" }, { status: 402 });
    }
    const status = /Informe/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
