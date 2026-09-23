import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Command, History, Radar, ShieldCheck, Workflow } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims as { is_anonymous?: boolean } | undefined;
    if (claims && !claims.is_anonymous) redirect("/app");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="grid min-h-screen lg:grid-cols-[.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#07101f] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute left-[-10rem] top-[-8rem] h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-violet-600/15 blur-[100px]" />

          <Link href="/" className="relative z-10 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500"><Command className="size-5" /></span>
            <span><strong className="block text-base">HunterX</strong><small className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Lead intelligence</small></span>
          </Link>

          <div className="relative z-10 my-auto max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-blue-300"><Radar className="size-3.5" /> Seu workspace comercial</span>
            <h2 className="mt-6 text-5xl font-black leading-[1.02] tracking-[-.06em]">Prospecção que não começa do zero todo dia.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">Entre para acessar buscas salvas, leads únicos, pipeline e inteligência de segmentos em um só lugar.</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {[
                [History, "Histórico persistente"],
                [ShieldCheck, "Dados isolados por conta"],
                [Workflow, "Pipeline de prospecção"],
                [BarChart3, "Inteligência de nichos"],
              ].map(([Icon, text]) => (
                <div key={String(text)} className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.035] p-4 text-xs font-semibold text-slate-300">
                  {(() => { const I = Icon as typeof History; return <I className="size-4 text-blue-300" />; })()}
                  {String(text)}
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[10px] text-slate-600">HunterX • Lead intelligence para prospecção local</p>
        </section>

        <section className="flex min-h-screen flex-col">
          <div className="flex h-20 items-center px-5 lg:px-10">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
              <ArrowLeft className="size-3.5" /> Voltar
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-5 pb-16 lg:px-10">
            <AuthPanel initialMode={params.mode === "signup" ? "signup" : "login"} />
          </div>
        </section>
      </div>
    </main>
  );
}
