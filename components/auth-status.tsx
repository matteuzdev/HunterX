"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AuthStatus() {
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || "");
      setAnonymous(Boolean(data.user?.is_anonymous));
    });
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (anonymous) {
    return (
      <a href="/login?mode=signup" className="hidden h-9 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[10px] font-bold text-amber-700 transition hover:bg-amber-100 sm:flex">
        <ShieldCheck className="size-3.5" /> Proteger meus dados
      </a>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600">
        <UserRound className="size-3.5" />
        <span className="max-w-[150px] truncate">{email || "Conta"}</span>
      </span>
      <Button variant="ghost" size="icon" title="Sair" onClick={() => void signOut()}>
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
}
