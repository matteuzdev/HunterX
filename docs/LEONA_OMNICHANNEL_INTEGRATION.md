# 🦁 Integração Omnichannel & Engenharia Leona Flow no HunterX

> Inspirado diretamente na arquitetura de alta conversão da **Leona Solutions** para vendas x1 no WhatsApp, adaptado cirurgicamente para a **prospecção e venda de websites e marketing local** da agência.

---

## 🎯 O Que Foi Extraído da Leona e Aplicado no HunterX

### 1. 📊 Kanban Acoplado Diretamente às Conversas
- Na Leona, cada conversa pertence a uma coluna do CRM (`Lead`, `Em Análise`, `Consentimento`, `Contrato Pago`).
- **No HunterX**:
  - A janela do chat agora possui uma barra lateral retrátil com as etapas do CRM: `Novo Lead`, `Contatado`, `Respondeu`, `Demonstração`, `Negociação`, `Fechado`, `Perdido`.
  - Mudar a etapa com 1 clique atualiza a conversa e o Pipeline comercial em tempo real.

### 2. 🏷️ Etiquetas Coloridas (Labels)
- Sistema visual de tags para segmentar o tipo de oportunidade:
  - 🔴 `Sem Website`: Empresa com nota alta no Google mas sem site indexado.
  - 🟠 `Lead Quente`: Lead que demonstrou interesse ou pediu proposta.
  - 🟡 `Presença Fraca`: Perfil do Google desatualizado ou mal configurado.
  - 🔵 `Diagnóstico Enviado`: Vídeo ou pitch enviado.
  - 🟣 `Pediu Humano`: Transbordo ativado para fechamento.
  - 🟢 `Cliente Fechado`: Venda concluída.
- Filtro rápido no topo da lista de conversas para puxar apenas os leads com determinada tag.

### 3. ⚡ Respostas Rápidas (Atalhos `/`)
- Para agilizar o atendimento manual ou semi-automático, o operador digita `/` e o HunterX abre o catálogo de scripts:
  - `/site`: Apresentação rápida da página de alta performance.
  - `/diag`: Convite para chamada rápida de diagnóstico de 10 min.
  - `/preco`: Enquadramento de valor e planos de atração de clientes.
  - `/obj-insta`: Quebra de objeção "já uso Instagram".
  - `/obj-agencia`: Quebra de objeção "já tenho agência".
- Substituição automática das variáveis `{niche}`, `{city}` e `{name}` no texto final.

### 4. 🌊 Fluxos Cadenciados de Prospecção (Leona Flow Engine)
- Aba exclusiva **Fluxos / Leona** no HunterX:
  1. **Disparo inicial**: Inicia com delay humanizado (3s a 7s) com simulação de "digitando...".
  2. **Elogio de Reputação**: Cita a nota e os elogios reais da empresa no Google.
  3. **Áudio Gravado na Hora (PTT)**: Formato de áudio que aparece como gravado ao vivo pelo WhatsApp (aumenta resposta em mais de 300%).
  4. **Menu de Triagem**: Botões rápidos de interesse.
  5. **Auto-Tagging e Movimentação no Kanban**: O próprio fluxo move o lead para a coluna certa.
  6. **Notificação de Transbordo**: Alerta o vendedor humano para assumir o x1 no momento exato do fechamento.

