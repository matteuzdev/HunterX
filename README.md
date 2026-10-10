# HunterX — Lead & Opportunity Intelligence

HunterX é uma ferramenta de inteligência comercial para **descobrir empresas, priorizar oportunidades e exportar leads qualificados**.

## Escopo do produto
- Descoberta de empresas por nicho e cidade (Apify Google Maps; Outscraper como alternativa).
- Enriquecimento e identificação de lacunas de presença digital.
- Opportunity Score explicável para priorização.
- Histórico de buscas com recuperação de resultados salvos.
- Favoritos, segmentos, exportação CSV e gerenciamento de tokens.
- Acesso contextual ao contato da empresa (sem inbox ou automação de mensagens).

## Fora do escopo
- Inbox próprio de WhatsApp e conexão de mensageria.
- Sequências de automação e construtores de fluxos.
- Estúdio, orquestração e simulador de agentes de IA.

A análise de oportunidades de **software sob medida** é uma evolução planejada, não uma funcionalidade já implementada. Sinais encontrados em fontes externas devem ser tratados como indícios e hipóteses, nunca como necessidade confirmada do lead.

## Stack
- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4
- Supabase para identidade e persistência
- Apify / Outscraper para descoberta
- Vercel para hospedagem

## Desenvolvimento
```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Nota sobre a redução de escopo
Esta etapa retira as telas de mensageria, automações e agentes da navegação e da aplicação principal. Os arquivos internos e rotas legados **ainda precisam ser inventariados e removidos com segurança** após análise de dependências, para evitar impactos nos recursos de busca, autenticação, histórico e exportação.
