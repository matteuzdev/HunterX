import { NextResponse } from "next/server";
import { AgentEngine, DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";
import { AIAgent } from "@/lib/hunter/types";

const AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const { agentId, agent: providedAgent, message, lead, chatHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 });
    }

    const agent: AIAgent =
      providedAgent ||
      DEFAULT_AGENTS.find((a) => a.id === agentId) ||
      DEFAULT_AGENTS[0];

    // 1. Tenta delegar o raciocínio para o microsserviço Python + Agno
    if (AGNO_SERVICE_URL) {
      try {
        const agnoController = new AbortController();
        const timeoutId = setTimeout(() => agnoController.abort(), 4000);

        const agnoRes = await fetch(`${AGNO_SERVICE_URL}/agents/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            agent,
            lead,
            chatHistory,
          }),
          signal: agnoController.signal,
        });

        clearTimeout(timeoutId);

        if (agnoRes.ok) {
          const agnoData = await agnoRes.json();
          return NextResponse.json(agnoData);
        }
      } catch (agnoErr) {
        // Se o Agno estiver offline (ex: deploy na Vercel sem o microsserviço local), usa o engine nativo
        console.warn("[HunterX] Agno Python offline ou indisponível, usando motor TypeScript nativo:", agnoErr);
      }
    }

    // 2. Fallback resiliente: Motor TypeScript nativo
    const result = await AgentEngine.processMessage({
      agent,
      userMessage: message,
      lead,
      chatHistory,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

