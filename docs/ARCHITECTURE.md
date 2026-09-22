# Arquitetura — HunterX

## Fluxo principal

1. Usuário informa nicho e cidade.
2. `/api/search` chama o provider de descoberta.
3. O provider devolve negócios normalizados.
4. O Opportunity Engine calcula score, temperatura e prioridade.
5. O frontend permite filtrar, favoritar, exportar e iniciar abordagem.
6. `/api/enrich` pode visitar o website público do lead e extrair sinais adicionais.

## Camadas

### Interface
Arquivos estáticos na raiz. Não existe dependência de framework nesta fase, reduzindo custo e complexidade de deploy.

### API
Funções em `/api` foram desenhadas para Vercel Functions:
- `health.js`: estado do runtime/provider.
- `search.js`: descoberta e score.
- `enrich.js`: enrichment de website.

### Engine
`lib/engine.js` concentra regras de negócio e providers. Isso impede que a interface fique acoplada a Outscraper, Google Maps ou qualquer fonte específica.

## Opportunity Score v0.2

- Sem website: +35
- Sem redes detectadas: +15
- Sem e-mail: +10
- Telefone disponível: +15
- Rating >= 4.5: +10
- Rating >= 4.0: +7
- 20+ avaliações: +10
- 5+ avaliações: +5
- Negócio aparentemente ativo: +5
- Limite: 100

Temperatura:
- 80–100: Quente
- 60–79: Morno
- 0–59: Frio

O score é explicável. Cada lead mantém os motivos que geraram sua pontuação.

## Providers

`DATA_PROVIDER=mock` roda sem custo.
`DATA_PROVIDER=live` usa o provider configurado e exige credencial.

A interface não precisa mudar quando o provider for trocado.

## Segurança

O enrichment bloqueia hosts locais e redes privadas para reduzir risco de SSRF. Requests externos possuem timeout e limite de conteúdo.

## Próxima arquitetura de produção

- Supabase/Postgres
- autenticação
- workspaces
- controle de créditos
- jobs assíncronos de enrichment
- deduplicação persistente
- histórico de contatos
- outcomes comerciais
- analytics de conversão por score
