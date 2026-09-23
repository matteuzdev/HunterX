# Hunter Engine Worker

Worker próprio de crawling do HunterX.

## Papel

1. Consome `crawl_jobs` do Supabase usando `service_role`.
2. Faz crawling HTTP/Cheerio primeiro.
3. Usa Chromium/Playwright apenas como fallback quando a página depende de JavaScript.
4. Extrai sinais públicos do website: e-mail, redes sociais, metadados e páginas visitadas.
5. Atualiza `business_directory`.
6. Nunca expõe `SUPABASE_SERVICE_ROLE_KEY` ao frontend.

## Segurança e comportamento

- Respeita `robots.txt`.
- Possui limite de requisições por minuto.
- Retry limitado e backoff.
- A fila usa claim atômico com `FOR UPDATE SKIP LOCKED`.
- Não faz scraping do Google Maps.
- O diretório será alimentado principalmente por dados públicos permitidos (ex.: CNPJ aberto) e crawling de sites públicos.

## Rodar

```bash
cd services/hunter-engine
cp .env.example .env
npm install
npm start
```

Para processar um lote e sair:

```bash
npm run once
```

## Próxima camada

Ingestor mensal dos dados abertos do CNPJ -> normalização CNAE/município -> `business_directory` -> descoberta de website -> `crawl_jobs`.
