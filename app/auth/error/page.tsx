import Link from "next/link";
import { AlertTriangle, ArrowRight, Command } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] p-5">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-950/5">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="size-5" /></span>
        <h1 className="mt-5 text-2xl font-black tracking-[-.04em] text-slate-950">Não conseguimos validar esse acesso.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">O link pode ter expirado ou já ter sido utilizado. Solicite um novo acesso na tela de login.</p>
        <Link href="/login" className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white">
          <Command className="size-4" /> Voltar ao login <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
