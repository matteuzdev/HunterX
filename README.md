# HunterX

HunterX é um SaaS de inteligência comercial para descobrir negócios locais, identificar gaps de presença digital e priorizar oportunidades de prospecção.

## Stack

- Next.js 16 — App Router
- React 19
- TypeScript
- Tailwind CSS 4
- componentes no padrão shadcn/ui
- Route Handlers do Next.js
- Supabase SSR preparado para autenticação/persistência
- Vercel

## O que já funciona

- Busca por nicho + cidade
- até 20 leads por busca
- Opportunity Score 0–100
- Quente / Morno / Frio
- prioridade Alta / Média / Baixa
- filtros
- favoritos
- histórico
- WhatsApp contextual
- exportação CSV
- modo demo
- provider Outscraper preparado
- enrichment de website
- dashboard SaaS responsivo

## Rodar

```bash
npm install
npm run dev
```

## Dados reais

```env
DATA_PROVIDER=live
OUTSCRAPER_API_KEY=sua_chave
```

## Supabase

Quando habilitarmos autenticação e persistência:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Arquitetura

```text
app/
  api/
  globals.css
  layout.tsx
  page.tsx
components/
  hunterx-app.tsx
  lead-table.tsx
  metric-card.tsx
  sidebar.tsx
  ui/
lib/
  hunter/
  supabase/
```

A interface antiga em HTML/CSS/JS puro foi substituída. O produto agora está estruturado para evoluir como SaaS.
