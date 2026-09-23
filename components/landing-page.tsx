import Link from "next/link";
import {
  ArrowRight, BarChart3, Check, Coins, Command, Crosshair, Database,
  Fingerprint, History, Radar, Search, ShieldCheck, Sparkles, Target, Workflow
} from "lucide-react";
import { LandingProductTabs } from "@/components/landing-product-tabs";

export type LandingPlan = {
  id: string;
  name: string;
  tagline: string;
  priceCents: number;
  monthlyTokens: number;
  features: string[];
};

function price(cents: number) {
  if (!cents) return "Grátis";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function LandingPage({
  hasSession = false,
  plans = [],
}: {
  hasSession?: boolean;
  plans?: LandingPlan[];
}) {
  const cta = hasSession ? "/app" : "/login?mode=signup";

  return (
    <main className="min-h-screen overflow-hidden bg-[#06101f] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-28rem] h-[52rem] w-[70rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute right-[-16rem] top-[35rem] h-[38rem] w-[38rem] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <nav className="relative z-30 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-950/40">
            <Command className="size-5" strokeWidth={2.5} />
          </span>
          <span>
            <strong className="block text-[17px] tracking-tight">HunterX</strong>
            <small className="block text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">Lead intelligence</small>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <a href="#produto" className="hidden px-3 py-2 text-xs font-bold text-slate-400 hover:text-white md:block">Produto</a>
          <a href="#planos" className="hidden px-3 py-2 text-xs font-bold text-slate-400 hover:text-white md:block">Planos</a>
          {!hasSession && <Link href="/login" className="hidden px-3 py-2 text-xs font-bold text-slate-300 sm:block">Entrar</Link>}
          <Link href={cta} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-950 transition hover:bg-blue-50">
            {hasSession ? "Abrir workspace" : "Começar grátis"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-blue-300">
            <Radar className="size-3.5" /> Hunter Engine • prospecção orientada por dados
          </span>

          <h1 className="mt-7 text-balance text-5xl font-black leading-[.95] tracking-[-.07em] md:text-7xl lg:text-[82px]">
            Pare de procurar empresas
            <span className="block font-serif font-normal italic tracking-[-.045em] text-blue-300">no escuro.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-slate-400 md:text-lg">
            Descubra negócios locais, entenda quem tem mais oportunidade comercial e transforme cada busca em uma lista de prospecção que você pode trabalhar, medir e reutilizar.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={cta} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 text-sm font-black shadow-2xl shadow-blue-600/20 transition hover:bg-blue-400 sm:w-auto">
              {hasSession ? "Ir para o HunterX" : "Criar conta • 100 tokens"} <ArrowRight className="size-4" />
            </Link>
            <a href="#produto" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] px-6 text-sm font-bold text-slate-300 transition hover:bg-white/[.08] sm:w-auto">
              Ver o sistema
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl">
          <div className="absolute inset-x-20 -top-14 h-44 rounded-full bg-blue-500/20 blur-[90px]" />

          <div className="relative overflow-visible rounded-[34px] border border-white/10 bg-[#0a1628] p-2 shadow-[0_45px_130px_rgba(0,0,0,.55)]">
            <div className="overflow-hidden rounded-[28px] border border-white/[.06] bg-[#f6f8fc] p-3 text-slate-900 md:p-5">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white"><Command className="size-4" /></span>
                  <div><strong className="block text-xs">HunterX</strong><small className="text-[9px] text-slate-400">Lead intelligence workspace</small></div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black text-emerald-700">Hunter Engine online</span>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.45fr_.55fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="rounded-xl border border-slate-200 px-3 py-3 text-[10px] text-slate-500">Marmoraria</div>
                    <div className="rounded-xl border border-slate-200 px-3 py-3 text-[10px] text-slate-500">Campina Grande, PB</div>
                    <div className="rounded-xl bg-blue-600 px-4 py-3 text-center text-[10px] font-black text-white">Buscar</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      ["01","Empresa local A","Sem website • telefone disponível","92"],
                      ["02","Empresa local B","Reputação forte • presença incompleta","87"],
                      ["03","Empresa local C","Website fraco • oportunidade clara","81"],
                    ].map(([n,name,gap,score]) => (
                      <div key={n} className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 px-3 py-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-[9px] font-black text-white">{n}</span>
                        <span><strong className="block text-[10px]">{name}</strong><small className="mt-1 block text-[9px] text-slate-400">{gap}</small></span>
                        <strong className="text-sm text-rose-600">{score}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl bg-[#101a2d] p-5 text-white">
                    <span className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Opportunity Score</span>
                    <strong className="mt-4 block text-4xl font-black tracking-[-.07em]">0–100</strong>
                    <p className="mt-2 text-[10px] leading-5 text-slate-400">Sinais comerciais visíveis e explicáveis.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4"><History className="size-4 text-blue-600" /><strong className="mt-3 block text-[10px]">Histórico</strong><small className="text-[9px] text-slate-400">zero consumo ao reabrir</small></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4"><Workflow className="size-4 text-violet-600" /><strong className="mt-3 block text-[10px]">Pipeline</strong><small className="text-[9px] text-slate-400">do novo ao cliente</small></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-3 top-[38%] hidden w-48 rounded-2xl border border-white/15 bg-[#101b2e]/90 p-4 shadow-2xl backdrop-blur-xl md:block">
              <Database className="size-4 text-emerald-300" />
              <strong className="mt-2 block text-[11px]">Base própria primeiro</strong>
              <small className="mt-1 block text-[9px] leading-4 text-slate-400">Fallback só quando o Hunter Directory ainda não completa o lote.</small>
            </div>

            <div className="absolute -right-3 bottom-[18%] hidden w-48 rounded-2xl border border-white/15 bg-[#101b2e]/90 p-4 shadow-2xl backdrop-blur-xl md:block">
              <Coins className="size-4 text-amber-300" />
              <strong className="mt-2 block text-[11px]">20 empresas por bloco</strong>
              <small className="mt-1 block text-[9px] leading-4 text-slate-400">Histórico e cache não gastam tokens novamente.</small>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="relative z-10 border-y border-white/[.06] bg-white/[.02] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[.18em] text-blue-400">Do discovery ao fechamento</span>
            <h2 className="mt-4 text-4xl font-black tracking-[-.055em] md:text-5xl">Uma busca deixa de ser uma lista.<br/><span className="font-serif font-normal italic text-slate-400">Vira operação.</span></h2>
          </div>

          <div className="mt-12 grid auto-rows-[190px] gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-gradient-to-br from-blue-500/15 to-white/[.03] p-6 lg:col-span-2 lg:row-span-2">
              <Search className="size-5 text-blue-300" />
              <h3 className="mt-5 max-w-md text-2xl font-black tracking-[-.04em]">Descoberta com memória comercial.</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">O mesmo resultado não precisa ser comprado duas vezes. Busca salva, deduplicação e diretório próprio reduzem redescoberta.</p>
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-2">
                {["Hunter Directory","Cache persistente","Fallback híbrido"].map((label) => <div key={label} className="rounded-xl border border-white/[.07] bg-white/[.04] p-3 text-[9px] font-bold text-slate-300">{label}</div>)}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[.08] bg-white/[.035] p-6 lg:col-span-2">
              <Target className="size-5 text-rose-300" />
              <h3 className="mt-4 text-lg font-black">Opportunity Score</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">Priorização explicável por presença digital, contato e reputação.</p>
            </div>

            <div className="rounded-[28px] border border-white/[.08] bg-white/[.035] p-6">
              <Fingerprint className="size-5 text-violet-300" />
              <h3 className="mt-4 text-base font-black">Deduplicação</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">Reconhece a mesma empresa em buscas diferentes.</p>
            </div>

            <div className="rounded-[28px] border border-white/[.08] bg-white/[.035] p-6">
              <Crosshair className="size-5 text-emerald-300" />
              <h3 className="mt-4 text-base font-black">Focus Mode</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">Meta diária, timer e execução em blocos de 20.</p>
            </div>
          </div>

          <div className="mt-12">
            <LandingProductTabs />
          </div>
        </div>
      </section>

      <section id="planos" className="relative z-10 mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Planos HunterX</span>
          <h2 className="mt-4 text-4xl font-black tracking-[-.055em] md:text-5xl">Volume previsível.<br/><span className="font-serif font-normal italic text-slate-400">Sem pagar duas vezes pelo histórico.</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">1 token libera 1 empresa em uma nova coleta. Resultados já salvos continuam disponíveis sem novo consumo.</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <div key={plan.id} className={`relative rounded-[28px] border p-6 ${index === 2 ? "border-blue-400/30 bg-blue-500/[.08] shadow-[0_25px_80px_rgba(37,99,235,.12)]" : "border-white/[.08] bg-white/[.03]"}`}>
              {index === 2 && <span className="absolute right-5 top-5 rounded-full bg-blue-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em]">Pro</span>}
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">{plan.name}</p>
              <h3 className="mt-4 text-3xl font-black tracking-[-.05em]">{price(plan.priceCents)}</h3>
              {plan.priceCents > 0 && <span className="text-[10px] text-slate-500">/mês</span>}
              <p className="mt-3 min-h-10 text-xs leading-5 text-slate-400">{plan.tagline}</p>
              <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
                <strong className="text-xl">{plan.monthlyTokens.toLocaleString("pt-BR")}</strong>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-[.1em] text-amber-300">tokens</span>
              </div>
              <div className="mt-5 space-y-3">
                {plan.features.map((feature) => <div key={feature} className="flex gap-2 text-[11px] leading-5 text-slate-400"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />{feature}</div>)}
              </div>
              <Link href={cta} className={`mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black ${index === 2 ? "bg-blue-500 text-white" : "bg-white text-slate-950"}`}>
                {hasSession ? "Abrir workspace" : plan.id === "free" ? "Começar grátis" : "Escolher plano"} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[10px] text-slate-600">Checkout será conectado na próxima etapa. Os planos já estão estruturados no produto.</p>
      </section>

      <section className="relative z-10 px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-blue-400/15 bg-gradient-to-br from-blue-500/15 via-[#0c1729] to-violet-500/10 p-8 text-center md:p-14">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-500"><Sparkles className="size-5" /></span>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-[-.055em]">Sua próxima lista já pode nascer organizada.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">Comece com 100 tokens, salve cada busca e transforme descoberta em rotina comercial.</p>
          <Link href={cta} className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-slate-950">
            {hasSession ? "Abrir HunterX" : "Criar conta agora"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="flex items-center gap-2 font-bold text-slate-400"><Command className="size-4" /> HunterX</span>
          <span>Lead intelligence para prospecção local.</span>
        </div>
      </footer>
    </main>
  );
}
