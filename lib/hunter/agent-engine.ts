import { AIAgent, ChatMessage, Lead } from "./types";

export const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: "agent-sophia",
    name: "Sophia • Hunter Odonto",
    avatar: "👩‍⚕️",
    role: "Prospecção & Qualificação para Clínicas",
    tone: "consultivo",
    provider: "openai",
    model: "gpt-4o-mini",
    systemPrompt: `Você é Sophia, consultora sênior de posicionamento digital para clínicas e profissionais da saúde.
Seu objetivo é iniciar contato cordial, apontar sutilmente oportunidades no Google Maps e agendar um diagnóstico de 10 minutos.
Regras fundamentais:
1. Nunca pareça um robô de spam; seja natural e respeitosa.
2. Mencione a cidade ({city}) e os elogios dos clientes que a clínica já tem.
3. Se o lead perguntar preço, explique que varia por estrutura e convide para um tour visual rápido de 10min.
4. Se o lead pedir para falar com um humano, transfira imediatamente.`,
    knowledgeBase: [
      {
        id: "faq-1",
        type: "text",
        title: "Diagnóstico de Presença Local",
        content: "Análise gratuita de como a clínica aparece nas buscas locais em comparação aos 3 maiores concorrentes do bairro.",
        charCount: 125,
        status: "trained",
      },
      {
        id: "faq-2",
        type: "faq",
        title: "Já temos agência / marketing",
        content: "Excelente! Nosso diagnóstico foca especificamente no motor de conversão do Google Maps para WhatsApp, algo que a maioria das agências de branding não otimiza.",
        charCount: 167,
        status: "trained",
      },
      {
        id: "faq-3",
        type: "website",
        title: "Link de Agendamento Rápido",
        content: "https://cal.com/hunterx-diagnostico/10min",
        charCount: 42,
        status: "trained",
      },
    ],
    fallbackToHuman: true,
    handoffKeywords: ["falar com atendente", "humano", "pessoa real", "ligar", "atendente", "falar com alguém"],
    isActive: true,
    assignedNiches: ["Clínica odontológica", "Dentista", "Consultório"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "agent-lucas",
    name: "Lucas • Closer Comercial",
    avatar: "bot",
    role: "Fechamento & Geração de Sites de Alta Conversão",
    tone: "persuasivo",
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    systemPrompt: `Você é Lucas, especialista em conversão comercial e novos clientes para negócios locais.
Seu objetivo é mostrar para o dono da empresa que a falta de um site profissional ou canal direto está fazendo ele perder clientes diários para concorrentes.
Regras fundamentais:
1. Comunicação ágil, assertiva e focada em retorno financeiro (ROI).
2. Conduza sempre a conversa com perguntas abertas que façam o lead refletir.
3. Use gatilhos de escassez e exclusividade regional na cidade ({city}).`,
    knowledgeBase: [
      {
        id: "faq-4",
        type: "text",
        title: "Site Elite com Agendamento WhatsApp",
        content: "Desenvolvimento de página de alta velocidade (nota 95+ no Google), carregamento em 1s e integração direta ao WhatsApp do comercial.",
        charCount: 147,
        status: "trained",
      },
      {
        id: "faq-5",
        type: "faq",
        title: "Não preciso de site, uso só Instagram",
        content: "O Instagram é ótimo para relacionamento, mas 74% dos clientes locais com urgência buscam primeiro no Google. Sem um site rápido, você entrega esse cliente de bandeja para quem está ranqueado.",
        charCount: 188,
        status: "trained",
      },
    ],
    fallbackToHuman: true,
    handoffKeywords: ["falar com humano", "humano", "atendente", "proposta formal", "ligação"],
    isActive: true,
    assignedNiches: ["Barbearia", "Restaurante", "Oficina", "Academia", "Advocacia"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class AgentEngine {
  /**
   * Processa uma mensagem recebida e gera a resposta do agente
   */
  static async processMessage({
    agent,
    userMessage,
    lead,
    chatHistory = [],
  }: {
    agent: AIAgent;
    userMessage: string;
    lead?: Partial<Lead>;
    chatHistory?: ChatMessage[];
  }): Promise<{
    reply: string;
    shouldHandoff: boolean;
    detectedIntent: string;
    confidence: number;
  }> {
    const lowerMessage = userMessage.toLowerCase().trim();

    // 1. Checagem de Transbordo Humano
    const isHandoffRequested = agent.handoffKeywords.some((kw) =>
      lowerMessage.includes(kw.toLowerCase())
    );

    if (isHandoffRequested && agent.fallbackToHuman) {
      return {
        reply: "Com certeza! Estou pausando meu atendimento agora e transferindo nossa conversa para um de nossos especialistas humanos. Só um instante que alguém da equipe já vai te responder por aqui!",
        shouldHandoff: true,
        detectedIntent: "transbordo_humano",
        confidence: 0.99,
      };
    }

    // 2. Detecção de Objeções e Conhecimento
    let matchedKnowledge = "";
    for (const item of agent.knowledgeBase) {
      const matchWords = item.title.toLowerCase().split(" ");
      const matches = matchWords.filter((w) => w.length > 3 && lowerMessage.includes(w));
      if (matches.length >= 1) {
        matchedKnowledge = item.content;
        break;
      }
    }

    // 3. Montagem de Prompt com Variáveis Injetadas
    const city = lead?.city || "sua região";
    const name = lead?.name || "vocês";
    const niche = lead?.category || "seu segmento";

    // 4. Resposta contextual do agente
    let reply = "";
    let detectedIntent = "conversa_geral";

    if (lowerMessage.includes("preço") || lowerMessage.includes("quanto custa") || lowerMessage.includes("valor")) {
      detectedIntent = "duvida_preco";
      reply = `Excelente pergunta! Nosso formato é personalizado conforme a demanda de ${niche} em ${city}. Conseguimos estruturar desde soluções ágeis de entrada até projetos completos de captação. Você teria 5 minutos hoje ou prefere que eu te envie uma prévia rápida direto por aqui?`;
    } else if (lowerMessage.includes("agência") || lowerMessage.includes("já temos") || lowerMessage.includes("já tenho")) {
      detectedIntent = "objecao_ja_tem";
      reply = matchedKnowledge || `Que ótimo saber que vocês já investem nisso! Nosso trabalho não concorre com agências de posts ou redes sociais. Nós focamos cirurgicamente no mecanismo de captura no Google para clientes que estão procurando seu serviço em ${city} exatamente agora.`;
    } else if (lowerMessage.includes("não tenho interesse") || lowerMessage.includes("não quero")) {
      detectedIntent = "desinteresse";
      reply = `Perfeito, compreendo perfeitamente! Agradeço a atenção e o retorno rápido. Vou deixar nosso contato salvo aqui caso no futuro vocês queiram acelerar novos agendamentos para ${name}. Um abraço e ótimos negócios!`;
    } else if (lowerMessage.includes("como funciona") || lowerMessage.includes("o que é") || lowerMessage.includes("me explica")) {
      detectedIntent = "duvida_servico";
      reply = `Basicamente, nós mapeamos o mercado de ${city} e encontramos pontos onde ${name} pode captar mais clientes qualificados que hoje estão indo para os concorrentes. Nós montamos uma demonstração visual sem compromisso para você ver na prática. O que acha de dar uma olhada?`;
    } else {
      reply = `Olá! Que bom falar com vocês da ${name}. Analisei o perfil de vocês em ${city} e percebi oportunidades claras de aumentar a conversão de novos clientes. Vocês estão conseguindo atender novas demandas de pacientes/clientes este mês?`;
    }

    return {
      reply,
      shouldHandoff: false,
      detectedIntent,
      confidence: 0.92,
    };
  }
}

