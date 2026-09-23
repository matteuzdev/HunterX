"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; client_name?: string };
  client_name?: string;
  scopes?: string[];
  scope?: string;
  redirect_uri?: string;
};

export function OAuthConsent({ authorizationId }: { authorizationId: string }) {
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"approve" | "deny" | "">("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase não configurado.");
      return;
    }

    void supabase.auth.oauth.getAuthorizationDetails(authorizationId)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setDetails((data || {}) as unknown as AuthorizationDetails);
      });
  }, [authorizationId]);

  async function decide(action: "approve" | "deny") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(action);
    setError("");

    const result = action === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);

    if (result.error) {
      setError(result.error.message);
      setBusy("");
      return;
    }

    const redirectUrl = (result.data as { redirect_url?: string } | null)?.redirect_url;
    if (!redirectUrl) {
      setError("O servidor OAuth não retornou a URL de continuação.");
      setBusy("");
      return;
    }

    window.location.href = redirectUrl;
  }

  const name =
    details?.client?.name ||
    details?.client?.client_name ||
    details?.client_name ||
    "ChatGPT / aplicativo MCP";

  const scopes = Array.isArray(details?.scopes)
    ? details.scopes
    : String(details?.scope || "email").split(/\s+/).filter(Boolean);

  return (
    <main className="grid min-h-screen place-items-center bg-[#07101f] p-5 text-white">
      <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#0d192b] p-7 shadow-2xl shadow-black/30">
        <span className="grid size-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-300">
          <ShieldCheck className="size-5" />
        </span>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[.16em] text-blue-300">
          Conectar ao HunterX
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.05em]">
          Autorizar {name}?
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Este aplicativo poderá usar as ferramentas HunterX em nome da tua conta, respeitando o mesmo acesso e as mesmas regras do teu workspace.
        </p>

        <div className="mt-6 rounded-2xl border border-white/[.08] bg-white/[.035] p-4">
          <strong className="text-xs text-white">O que poderá fazer</strong>
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            {[
              "consultar plano e saldo",
              "buscar e recuperar leads",
              "ler histórico e inteligência de segmentos",
              "consultar o pipeline",
              "mover leads entre estágios do CRM",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400" /> {item}
              </div>
            ))}
          </div>
        </div>

        {!!scopes.length && (
          <p className="mt-4 text-[10px] text-slate-500">
            Escopos OAuth solicitados: {scopes.join(", ")}
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {!details && !error && (
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="size-4 animate-spin" /> Carregando autorização...
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void decide("deny")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/[.05] disabled:opacity-50"
          >
            {busy === "deny" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Negar
          </button>
          <button
            type="button"
            disabled={!!busy || !details}
            onClick={() => void decide("approve")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 text-xs font-black text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {busy === "approve" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Autorizar HunterX
          </button>
        </div>
      </div>
    </main>
  );
}
