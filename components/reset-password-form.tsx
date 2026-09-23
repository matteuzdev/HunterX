"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase não configurado.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      window.location.href = "/app";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-950/5">
      <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><KeyRound className="size-5" /></span>
      <h1 className="mt-5 text-2xl font-black tracking-[-.04em] text-slate-950">Defina uma nova senha</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Escolha uma senha forte para continuar usando seu workspace.</p>
      <div className="mt-6 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
        <KeyRound className="size-4 text-slate-400" />
        <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <button type="button" onClick={() => setShow((v) => !v)} className="text-slate-400">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
      </div>
      {error && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] text-rose-700">{error}</div>}
      <button disabled={loading} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Atualizar senha
      </button>
    </form>
  );
}
