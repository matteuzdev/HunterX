"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Eye, EyeOff, KeyRound, Loader2,
  LockKeyhole, Mail, ShieldCheck, Sparkles
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
}

export function AuthPanel({
  initialMode = "login",
  nextPath = "/app",
}: {
  initialMode?: Mode;
  nextPath?: string;
}) {
  const router = useRouter();
  const destination = safeNext(nextPath);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legacySession, setLegacySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setLegacySession(Boolean(data.user?.is_anonymous));
      if (data.user && !data.user.is_anonymous) router.replace(destination);
    });
  }, [router, destination]);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();

    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase não configurado.");

      if (mode === "login") {
        const { data: current } = await supabase.auth.getUser();
        if (current.user?.is_anonymous) await supabase.auth.signOut();

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        window.location.href = destination;
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !publishableKey) throw new Error("Configuração de cadastro indisponível.");

      const signupResponse = await fetch(`${supabaseUrl}/functions/v1/hunter-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publishableKey,
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
        }),
      });

      const signup = await signupResponse.json().catch(() => ({}));
      if (!signupResponse.ok) {
        throw new Error(signup.error || "Não foi possível criar a conta.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      window.location.href = destination;
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : "Não foi possível concluir o acesso.";
      setError(/Invalid login credentials/i.test(text) ? "E-mail ou senha incorretos." : text);
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    clearFeedback();
    if (!email.trim()) {
      setError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase não configurado.");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("Enviamos um link para redefinir sua senha.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a recuperação.");
    }
  }

  return (
    <div className="w-full max-w-[460px]">
      <div className="mb-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-blue-700">
          <LockKeyhole className="size-3.5" /> Acesso seguro
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-[-.05em] text-slate-950">
          {mode === "login" ? "Entre no seu workspace." : "Crie seu workspace HunterX."}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "login"
            ? "Seu histórico, pipeline e inteligência comercial continuam no mesmo lugar."
            : "Crie a conta e entre imediatamente. Não há etapa de confirmação por e-mail."}
        </p>
      </div>

      {legacySession && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <strong className="block text-xs text-amber-900">Detectamos dados salvos neste navegador</strong>
              <p className="mt-1 text-[11px] leading-5 text-amber-700">
                Ao criar a conta, o HunterX transfere os dados preservados para o novo workspace sem consultar a Apify novamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => { setMode("login"); clearFeedback(); }} className={`h-10 rounded-xl text-xs font-bold transition ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
          Entrar
        </button>
        <button type="button" onClick={() => { setMode("signup"); clearFeedback(); }} className={`h-10 rounded-xl text-xs font-bold transition ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
          Criar conta
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Seu nome</span>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
              <Sparkles className="size-4 text-slate-400" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar?" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </div>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">E-mail</span>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
            <Mail className="size-4 text-slate-400" />
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        <label className="block">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Senha</span>
            {mode === "login" && (
              <button type="button" onClick={() => void forgotPassword()} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">
                Esqueci minha senha
              </button>
            )}
          </div>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
            <KeyRound className="size-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 hover:text-slate-600" aria-label="Mostrar ou ocultar senha">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-700">{message}</div>}
        {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-[11px] leading-5 text-rose-700">{error}</div>}

        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-70">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {loading ? "Processando..." : mode === "login" ? "Entrar no HunterX" : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
