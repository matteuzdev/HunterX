"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2,
  LockKeyhole, Mail, ShieldCheck, Sparkles
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthPanel({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
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
      if (data.user && !data.user.is_anonymous) router.replace("/app");
    });
  }, [router]);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  async function leaveLegacySessionIfNeeded() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data } = await supabase.auth.getUser();
    if (data.user?.is_anonymous) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    return supabase;
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
      const supabase = await leaveLegacySessionIfNeeded();

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        window.location.href = "/app";
        return;
      }

      const callback = `${window.location.origin}/auth/callback?next=/app`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callback,
          data: { full_name: name.trim() || undefined },
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        window.location.href = "/app";
        return;
      }

      setMessage("Conta criada. Confira seu e-mail para confirmar o acesso e depois entre no HunterX.");
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : "Não foi possível concluir o acesso.";
      setError(
        /Invalid login credentials/i.test(text)
          ? "E-mail ou senha incorretos."
          : /Email not confirmed/i.test(text)
            ? "Confirme seu e-mail antes de entrar."
            : text
      );
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    clearFeedback();
    if (!email.trim()) {
      setError("Digite seu e-mail primeiro.");
      return;
    }
    try {
      const supabase = await leaveLegacySessionIfNeeded();
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
          shouldCreateUser: true,
        },
      });
      if (magicError) throw magicError;
      setMessage("Link de acesso enviado. Abra o e-mail neste dispositivo para entrar.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o link.");
    } finally {
      // Feedback is shown inline.
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
    } finally {
      // Feedback is shown inline.
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
            : "Crie sua conta para manter buscas, leads e pipeline vinculados ao seu acesso."}
        </p>
      </div>

      {legacySession && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <strong className="block text-xs text-amber-900">Detectamos dados salvos neste navegador</strong>
              <p className="mt-1 text-[11px] leading-5 text-amber-700">
                Ao entrar ou criar sua conta, o HunterX importa as buscas locais preservadas para o seu workspace sem consultar a Apify novamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button
          onClick={() => { setMode("login"); clearFeedback(); }}
          className={`h-10 rounded-xl text-xs font-bold transition ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          Entrar
        </button>
        <button
          onClick={() => { setMode("signup"); clearFeedback(); }}
          className={`h-10 rounded-xl text-xs font-bold transition ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
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

        {message && (
          <div className="flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-700">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {message}
          </div>
        )}
        {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-[11px] leading-5 text-rose-700">{error}</div>}

        <button
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {loading ? "Processando..." : mode === "login" ? "Entrar no HunterX" : "Criar conta"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        disabled={magicLoading}
        onClick={() => void magicLink()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {magicLoading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        Receber link de acesso por e-mail
      </button>

      <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
        Ao continuar, você concorda em usar o HunterX para prospecção responsável e respeitar os termos das plataformas consultadas.
      </p>
    </div>
  );
}
