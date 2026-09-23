"""
Serviço FastAPI de Agentes HunterX com Agno.
Fornece endpoints para execução de agentes inteligentes, tool calling e RAG.
"""

import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from agent_factory import create_hunter_agent

load_dotenv()

app = FastAPI(
    title="HunterX Agno Agent Service",
    description="Motor de Agentes de IA com Agno para Prospecção e Fechamento no HunterX",
    version="1.0.0",
)

# Habilita CORS para o frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LeadContext(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    score: Optional[int] = None
    phone: Optional[str] = None


class KnowledgeItem(BaseModel):
    id: Optional[str] = None
    title: str
    content: str


class AgentPayload(BaseModel):
    id: Optional[str] = "default"
    name: str = "Agente HunterX"
    tone: Optional[str] = "consultivo"
    provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o-mini"
    systemPrompt: Optional[str] = None
    knowledgeBase: Optional[List[KnowledgeItem]] = []
    fallbackToHuman: Optional[bool] = True
    handoffKeywords: Optional[List[str]] = []


class ChatRequest(BaseModel):
    message: str
    agent: Optional[AgentPayload] = None
    lead: Optional[LeadContext] = None
    chatHistory: Optional[List[Dict[str, Any]]] = []


class ChatResponse(BaseModel):
    reply: str
    detectedIntent: str
    shouldHandoff: bool
    confidence: float
    usedAgno: bool = True


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "framework": "Agno (formerly Phidata)",
        "service": "HunterX AI Agent Engine",
    }


@app.post("/agents/chat", response_model=ChatResponse)
async def chat_with_agent(req: ChatRequest):
    try:
        agent_data = req.agent or AgentPayload()
        lead_data = req.lead or LeadContext()

        # Interpolação de variáveis no prompt se houver lead
        prompt = agent_data.systemPrompt or ""
        if lead_data.name:
            prompt = prompt.replace("{lead_name}", lead_data.name)
        if lead_data.city:
            prompt = prompt.replace("{city}", lead_data.city)
        if lead_data.category:
            prompt = prompt.replace("{niche}", lead_data.category)

        # Transforma knowledge base em dict simples
        kb_dicts = [
            {"title": item.title, "content": item.content}
            for item in (agent_data.knowledgeBase or [])
        ]

        # Cria o agente Agno
        agno_agent = create_hunter_agent(
            name=agent_data.name,
            system_prompt=prompt,
            provider=agent_data.provider or "openai",
            model_name=agent_data.model or "gpt-4o-mini",
            tone=agent_data.tone or "consultivo",
            knowledge_base=kb_dicts,
            fallback_to_human=agent_data.fallbackToHuman or True,
            handoff_keywords=agent_data.handoffKeywords or [],
        )

        # Prepara a mensagem com contexto do lead
        user_input = req.message
        if lead_data.name:
            user_input = f"[Contexto do Lead: Empresa {lead_data.name}, Nicho {lead_data.category or 'Geral'}, Cidade {lead_data.city or 'Brasil'}]\n{user_input}"

        # Executa com o Agno
        run_response = agno_agent.run(user_input)
        reply_text = run_response.content if hasattr(run_response, "content") else str(run_response)

        # Detecta se houve gatilho de handoff
        should_handoff = False
        if "[HUMAN_HANDOFF]" in reply_text:
            should_handoff = True
            reply_text = reply_text.replace("[HUMAN_HANDOFF]", "").strip()

        # Análise básica de intenção
        detected_intent = "interacao_geral"
        lower_msg = req.message.lower()
        if any(w in lower_msg for w in ["preço", "valor", "quanto custa", "orçamento"]):
            detected_intent = "duvida_preco"
        elif any(w in lower_msg for w in ["agenda", "horario", "pode ser", "vamos marcar", "sim"]):
            detected_intent = "aceite_diagnostico"
        elif any(w in lower_msg for w in ["humano", "atendente", "pessoa"]):
            detected_intent = "pedido_humano"
            should_handoff = True

        return ChatResponse(
            reply=reply_text,
            detectedIntent=detected_intent,
            shouldHandoff=should_handoff,
            confidence=0.96,
            usedAgno=True,
        )

    except Exception as e:
        print(f"[AGNO ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
