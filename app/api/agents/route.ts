import { NextResponse } from "next/server";
import { DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";
import { AIAgent } from "@/lib/hunter/types";

// Armazenamento em memória (pode ser sincronizado com Supabase)
let agentsList: AIAgent[] = [...DEFAULT_AGENTS];

export async function GET() {
  return NextResponse.json({ agents: agentsList });
}

export async function POST(req: Request) {
  try {
    const agentData = await req.json();

    if (!agentData.name || !agentData.systemPrompt) {
      return NextResponse.json({ error: "Nome e Prompt do sistema são obrigatórios" }, { status: 400 });
    }

    const existingIndex = agentsList.findIndex((a) => a.id === agentData.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      agentsList[existingIndex] = {
        ...agentsList[existingIndex],
        ...agentData,
        updatedAt: now,
      };
      return NextResponse.json(agentsList[existingIndex]);
    }

    const newAgent: AIAgent = {
      id: agentData.id || `agent-${Date.now()}`,
      name: agentData.name,
      avatar: agentData.avatar || "🤖",
      role: agentData.role || "Especialista em Atendimento",
      tone: agentData.tone || "consultivo",
      provider: agentData.provider || "openai",
      model: agentData.model || "gpt-4o-mini",
      systemPrompt: agentData.systemPrompt,
      knowledgeBase: agentData.knowledgeBase || [],
      fallbackToHuman: agentData.fallbackToHuman ?? true,
      handoffKeywords: agentData.handoffKeywords || ["humano", "atendente"],
      isActive: agentData.isActive ?? true,
      assignedNiches: agentData.assignedNiches || [],
      createdAt: now,
      updatedAt: now,
    };

    agentsList.push(newAgent);
    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

