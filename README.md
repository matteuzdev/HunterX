# HunterX

HunterX é uma plataforma de inteligência comercial para descobrir negócios locais, detectar gaps de presença digital e priorizar oportunidades de prospecção.

## O que já funciona

- Busca por palavra-chave + cidade
- Até 20 leads por busca
- Opportunity Score de 0 a 100
- Classificação Quente / Morno / Frio
- Prioridade Alta / Média / Baixa
- Filtros e ordenação
- Favoritos e histórico local
- Abordagem por WhatsApp com contexto
- Exportação CSV
- Enriquecimento de website
- Modo demo sem credenciais
- Provider real preparado via Outscraper
- APIs serverless prontas para Vercel

## Stack

- Frontend: HTML, CSS e JavaScript
- Backend: Node.js / funções serverless
- Deploy: Vercel
- Dados: provider desacoplado
- Persistência atual: localStorage no frontend
- Próxima camada: Postgres/Supabase + autenticação + créditos + jobs

## Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Dados reais

Copie `.env.example` para `.env` e configure:

```env
DATA_PROVIDER=live
OUTSCRAPER_API_KEY=sua_chave
```

Sem essas variáveis o HunterX roda em modo demonstração.

## APIs

- `GET /api/health`
- `POST /api/search`
- `POST /api/enrich`

## Estrutura

```text
api/        funções serverless
lib/        motor de dados e Opportunity Engine
docs/       arquitetura, pesquisa e roadmap
index.html  aplicação
client.js   comportamento da interface
styles.css  design system
dev/server.mjs  servidor local
```

## Direção

O objetivo não é copiar uma interface. É construir um motor próprio de descoberta, enriquecimento, priorização e operação comercial.
