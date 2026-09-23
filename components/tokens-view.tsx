"use client";

import { Coins, CreditCard, Crown, Gift, Infinity as InfinityIcon, ShieldCheck, Zap } from "lucide-react";
import type { HunterAccount, TokenPackage } from "@/lib/hunter/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

export function TokensView({ account, packages }: { account: HunterAccount; packages: TokenPackage[] }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-amber-600">Uso do engine</p>
        <h1 className="text-3xl font-black tracking-[-.045em]">Tokens HunterX</h1>
        <p className="mt-2 text-sm text-slate-500">1 token = 1 empresa liberada em uma nova coleta. Histórico e cache não consomem novamente.</p>
      </div>

      <Card className="overflow-hidden bg-slate-950 p-6 text-white">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-amber-300">
              {account.unlimitedTokens ? <Crown className="size-4" /> : <Coins className="size-4" />}
              {account.unlimitedTokens ? "OWNER • ILIMITADO" : account.planName}
            </span>
            {account.unlimitedTokens ? (
              <>
                <strong className="mt-3 flex items-center gap-2 text-5xl font-black tracking-[-.07em]"><InfinityIcon className="size-10" /> ILIMITADO</strong>
                <p className="mt-2 text-xs text-slate-400">A tua conta não sofre débito de tokens no Hunter Engine nem no fallback.</p>
              </>
            ) : (
              <>
                <strong className="mt-3 block text-5xl font-black tracking-[-.07em]">{account.balance}</strong>
                <p className="mt-2 text-xs text-slate-400">≈ {Math.floor(account.balance / 20)} lotes completos de 20 empresas</p>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4 text-xs text-slate-300">
            <ShieldCheck className="mb-2 size-5 text-emerald-300" />
            Histórico e cache não consomem tokens novamente.
          </div>
        </div>
      </Card>

      {!account.unlimitedTokens && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="relative p-5">
                {pkg.bonusTokens > 0 && <Badge className="absolute right-4 top-4 bg-emerald-50 text-emerald-700">+{pkg.bonusTokens} bônus</Badge>}
                <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Zap className="size-4" /></span>
                <h2 className="mt-4 text-lg font-black">{pkg.name}</h2>
                <strong className="mt-2 block text-3xl font-black tracking-tight">{pkg.tokens + pkg.bonusTokens}<span className="ml-1 text-xs font-semibold text-slate-400">tokens</span></strong>
                <div className="mt-5 text-2xl font-black">{money(pkg.priceCents, pkg.currency)}</div>
                {pkg.checkoutUrl ? (
                  <a href={pkg.checkoutUrl} target="_blank" rel="noreferrer"><Button className="mt-5 w-full"><CreditCard className="size-4" /> Comprar tokens</Button></a>
                ) : (
                  <Button className="mt-5 w-full" variant="secondary" disabled><CreditCard className="size-4" /> Checkout em configuração</Button>
                )}
              </Card>
            ))}
          </div>
          <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
            <Gift className="mt-0.5 size-5 shrink-0 text-blue-600" />
            <span>Novas contas recebem <strong>100 tokens de boas-vindas</strong>, suficientes para até cinco lotes de 20 empresas.</span>
          </div>
        </>
      )}
    </section>
  );
}
