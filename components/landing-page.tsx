import Link from "next/link";
import {
  ArrowRight, BarChart3, Check, Command, Database, Fingerprint,
  History, Layers3, MapPinned, MessageCircle, Radar, Search,
  ShieldCheck, Sparkles, Target, Workflow
} from "lucide-react";

export function LandingPage({ hasSession = false }: { hasSession?: boolean }) {
  const features = [
    {
      icon: MapPinned,
      title: "Leads locais com contexto",
      text: "Pesquise nicho + cidade e transforme empresas do Google Maps em uma lista comercial priorizada.",
    },
    {
      icon: Target,
      title: "Opportunity Score explicável",
      text: "Website, reputação, contato e presença digital viram sinais claros para decidir quem abordar primeiro.",
    },
    {
      icon: History,
      title: "Histórico que protege créditos",
      text: "Buscas já feitas são recuperadas do cache e do Supabase antes de qualquer nova consulta paga.",
    },
    {
      icon: Fingerprint,
      title: "Deduplicação por empresa",
      text: "O HunterX reconhece o mesmo negócio em pesquisas diferentes e evita prospecção duplicada.",
    },
    {
      icon: Workflow,
      title: "Pipeline comercial",
      text: "Novo, analisado, demonstração, contato, resposta, negociação e cliente no mesmo workspace.",
    },
    {
      icon: BarChart3,
      title: "Inteligência de segmentos",
      text: "Compare nichos usando somente os dados que você já coletou e descubra onde existe mais oportunidade.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#07101f] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-22rem] h-[44rem] w-[58rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute right-[-14rem] top-[28rem] h-[34rem] w-[34rem] rounded-full bg-violet-600/10 blur-[110px]" />
      </div>

      <nav className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
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
          {!hasSession && (
            <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[.05] hover:text-white sm:block">
              Entrar
            </Link>
          )}
          <Link
            href={hasSession ? "/app" : "/login?mode=signup"}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-blue-50"
          >
            {hasSession ? "Abrir HunterX" : "Começar agora"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-blue-300">
            <Radar className="size-3.5" /> Prospecção local orientada por dados
          </span>
          <h1 className="mt-7 text-balance text-5xl font-black leading-[.98] tracking-[-.065em] text-white md:text-7xl">
            Encontre empresas.
            <span className="block bg-gradient-to-r from-blue-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Saiba quem abordar primeiro.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-slate-400 md:text-lg">
            O HunterX transforma buscas locais em inteligência comercial: encontra negócios, identifica lacunas digitais, prioriza oportunidades e organiza toda a prospecção sem desperdiçar consultas já pagas.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={hasSession ? "/app" : "/login?mode=signup"}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 text-sm font-black shadow-2xl shadow-blue-600/20 transition hover:bg-blue-400 sm:w-auto"
            >
              {hasSession ? "Ir para o dashboard" : "Criar minha conta"} <ArrowRight className="size-4" />
            </Link>
            <a href="#produto" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-6 text-sm font-bold text-slate-300 transition hover:bg-white/[.08] sm:w-auto">
              Ver como funciona
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> Histórico persistente</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> CRM integrado</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> Score explicável</span>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl">
          <div className="absolute inset-x-24 -top-10 h-36 rounded-full bg-blue-500/20 blur-[80px]" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1628] p-2 shadow-[0_40px_120px_rgba(0,0,0,.55)]">
            <div className="rounded-[22px] border border-white/[.06] bg-[#f7f9fc] p-3 text-slate-900 md:p-5">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white"><Command className="size-4" /></span>
                  <div><strong className="block text-xs">HunterX</strong><small className="text-[9px] text-slate-400">Lead intelligence workspace</small></div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-bold text-emerald-700">dados reais • online</span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_.6fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-500">Marmoraria</div>
                    <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-500">Campina Grande, PB</div>
                    <div className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-[10px] font-bold text-white">Buscar / abrir salvo</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      ["Empresa local A", "Sem website", "Alta"],
                      ["Empresa local B", "Boa reputação • contato", "Alta"],
                      ["Empresa local C", "Presença digital incompleta", "Média"],
                    ].map(([name, gap, priority], index) => (
                      <div key={name} className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 px-3 py-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-[9px] font-bold text-white">{index + 1}</span>
                        <span><strong className="block text-[10px]">{name}</strong><small className="mt-1 block text-[9px] text-slate-400">{gap}</small></span>
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-700">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl bg-[#101a2d] p-5 text-white">
                    <span className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-300">Opportunity Engine</span>
                    <strong className="mt-4 block text-3xl font-black tracking-[-.06em]">0–100</strong>
                    <p className="mt-2 text-[10px] leading-5 text-slate-400">Pontuação baseada em sinais comerciais visíveis e explicáveis.</p>
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-500 to-violet-400" /></div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <span className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Memória comercial</span>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-blue-50 p-3"><History className="size-4 text-blue-600" /><strong className="mt-2 block text-[10px]">Histórico</strong></div>
                      <div className="rounded-xl bg-violet-50 p-3"><Workflow className="size-4 text-violet-600" /><strong className="mt-2 block text-[10px]">Pipeline</strong></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[9px] text-slate-400">Visual ilustrativo da experiência do produto.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="relative z-10 border-y border-white/[.06] bg-white/[.025] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-[11px] font-black uppercase tracking-[.18em] text-blue-400">Do mapa ao fechamento</span>
            <h2 className="mt-4 text-4xl font-black tracking-[-.05em]">Uma central de aquisição, não só um scraper.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">O HunterX guarda contexto, reduz trabalho repetido e transforma pesquisa em processo comercial.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group rounded-3xl border border-white/[.08] bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[.055]">
                <span className="grid size-11 place-items-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[.18em] text-violet-400">Fluxo HunterX</span>
            <h2 className="mt-4 text-4xl font-black tracking-[-.05em]">Cada busca vira patrimônio comercial.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">Pesquisas pagas não deveriam desaparecer quando você fecha uma aba. O HunterX trata cada resultado como um ativo reutilizável.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [Search, "01", "Pesquisar", "Nicho + cidade iniciam a descoberta."],
              [Sparkles, "02", "Qualificar", "Score e sinais explicam a oportunidade."],
              [Database, "03", "Memorizar", "Histórico, cache e Supabase preservam a busca."],
              [MessageCircle, "04", "Prospectar", "CRM acompanha o lead até a venda."],
            ].map(([Icon, num, title, text]) => (
              <div key={String(num)} className="rounded-3xl border border-white/[.08] bg-[#0b1526] p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/[.06] text-blue-300">
                    {(() => { const I = Icon as typeof Search; return <I className="size-4" />; })()}
                  </span>
                  <span className="text-xs font-black text-slate-600">{String(num)}</span>
                </div>
                <h3 className="mt-5 text-sm font-black">{String(title)}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{String(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-blue-400/15 bg-gradient-to-br from-blue-500/15 via-[#0c1729] to-violet-500/10 p-8 text-center md:p-14">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-950/30"><Layers3 className="size-5" /></span>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-[-.055em]">Sua prospecção local em um único sistema.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">Descubra oportunidades, preserve suas pesquisas e conduza cada empresa até o próximo passo comercial.</p>
          <Link href={hasSession ? "/app" : "/login?mode=signup"} className="mt-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-blue-50">
            {hasSession ? "Abrir meu workspace" : "Criar conta"} <ArrowRight className="size-4" />
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
