import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://gohunterx.vercel.app",
  "http://localhost:3000",
]);

function cors(origin: string | null) {
  const allowed = origin && (allowedOrigins.has(origin) || origin.endsWith(".vercel.app")) ? origin : "https://gohunterx.vercel.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const legacyService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const secretSet = Deno.env.get("SUPABASE_SECRET_KEYS");
    let serviceKey = legacyService;

    if (!serviceKey && secretSet) {
      const parsed = JSON.parse(secretSet);
      serviceKey = parsed.default || Object.values(parsed)[0] || "";
    }
    if (!url || !serviceKey) throw new Error("Server auth configuration missing");

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.name || "").trim().slice(0, 120);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Informe um e-mail válido." }), { status: 400, headers });
    }
    if (password.length < 8 || password.length > 128) {
      return new Response(JSON.stringify({ error: "A senha deve ter entre 8 e 128 caracteres." }), { status: 400, headers });
    }

    const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const ip = forwarded.split(",")[0].trim();
    const [ipHash, emailHash] = await Promise.all([sha256(ip), sha256(email)]);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: ipCount }, { count: emailCount }] = await Promise.all([
      admin.from("signup_rate_limits").select("*", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", oneHourAgo),
      admin.from("signup_rate_limits").select("*", { count: "exact", head: true }).eq("email_hash", emailHash).gte("created_at", oneDayAgo),
    ]);

    if ((ipCount || 0) >= 8 || (emailCount || 0) >= 4) {
      return new Response(JSON.stringify({ error: "Muitas tentativas de cadastro. Tente novamente mais tarde." }), { status: 429, headers });
    }

    await admin.from("signup_rate_limits").insert({ ip_hash: ipHash, email_hash: emailHash });

    let oldAnonymousId = "";
    const authorization = req.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (token) {
      const { data: oldAuth } = await admin.auth.getUser(token);
      if (oldAuth.user?.is_anonymous) oldAnonymousId = oldAuth.user.id;
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });

    if (createError || !created.user) {
      const message = createError?.message || "Não foi possível criar a conta.";
      const status = /already|registered|exists/i.test(message) ? 409 : 400;
      return new Response(JSON.stringify({
        error: status === 409 ? "Já existe uma conta com este e-mail. Use Entrar." : message,
      }), { status, headers });
    }

    if (oldAnonymousId && oldAnonymousId !== created.user.id) {
      const transferable = [
        "search_snapshots",
        "lead_registry",
        "export_logs",
        "token_ledger",
      ];

      for (const table of transferable) {
        const { error } = await admin.from(table).update({ user_id: created.user.id }).eq("user_id", oldAnonymousId);
        if (error) console.error("transfer", table, error.message);
      }

      const { data: oldWallet } = await admin.from("token_wallets").select("*").eq("user_id", oldAnonymousId).maybeSingle();
      if (oldWallet) {
        await admin.from("token_wallets").delete().eq("user_id", oldAnonymousId);
        await admin.from("token_wallets").upsert({
          user_id: created.user.id,
          balance: oldWallet.balance,
          lifetime_granted: oldWallet.lifetime_granted,
          lifetime_purchased: oldWallet.lifetime_purchased,
          lifetime_spent: oldWallet.lifetime_spent,
          updated_at: new Date().toISOString(),
        });
      }

      const { data: oldFocus } = await admin.from("focus_settings").select("*").eq("user_id", oldAnonymousId).maybeSingle();
      if (oldFocus) {
        await admin.from("focus_settings").delete().eq("user_id", oldAnonymousId);
        await admin.from("focus_settings").upsert({
          user_id: created.user.id,
          daily_target: oldFocus.daily_target,
          batch_size: oldFocus.batch_size,
          focus_minutes: oldFocus.focus_minutes,
          lofi_enabled: oldFocus.lofi_enabled,
          updated_at: new Date().toISOString(),
        });
      }

      await admin.auth.admin.deleteUser(oldAnonymousId).catch(() => null);
    }

    return new Response(JSON.stringify({
      ok: true,
      emailConfirmed: true,
      migratedAnonymousData: Boolean(oldAnonymousId),
    }), { status: 200, headers });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erro interno no cadastro.",
    }), { status: 500, headers });
  }
});