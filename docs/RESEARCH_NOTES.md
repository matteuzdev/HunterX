# Pesquisa funcional — referência Nexar Hunter

## O mecanismo que precisa ser reproduzido

A proposta pública combina descoberta de empresas locais, presença digital, localização e qualificação comercial.

O comportamento observável é compatível com este pipeline:

```text
nicho + cidade
→ descoberta local
→ normalização
→ enrichment
→ identificação de gaps
→ opportunity score
→ prioridade
→ contato/exportação
```

## Observações úteis

Os planos públicos indicam uma relação recorrente de 20 leads por busca. Isso é consistente com providers de busca local que trabalham em páginas/lotes próximos desse tamanho.

Dados básicos de Maps/Places normalmente cobrem nome, endereço, telefone, website, avaliações e geolocalização. E-mails e redes sociais exigem uma camada adicional de enrichment, crawling ou outro fornecedor.

A afirmação comercial de IA/ML não revela publicamente arquitetura de modelo proprietário. Para reproduzir o resultado funcional inicial, um score explicável é suficiente e mais auditável.

## Evolução de inteligência

A vantagem defensável do HunterX deve surgir de dados próprios de outcome:
- lead respondeu?
- reunião/proposta?
- fechamento?
- ticket?
- tempo até resposta?
- qual gap converteu?

Com isso o score deixa de ser apenas heurístico e pode ser calibrado a partir do resultado real da operação.

## Princípio

Separar descoberta, enrichment e scoring permite substituir fontes sem reconstruir o produto.
