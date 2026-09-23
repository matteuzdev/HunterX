"""
HunterX Agent Factory - Powered by Agno (formerly Phidata)
Microsserviço de inteligência artificial de alta performance para agentes de prospecção e vendas.
"""

from typing import Optional, List, Dict, Any
import os
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.models.anthropic import Claude
from agno.tools.duckduckgo import DuckDuckGoTools


def tool_mover_kanban(lead_id: str, nova_coluna: str) -> str:
    """
    Move o lead para uma nova coluna no CRM/Kanban do HunterX quando ele demonstrar interesse,
    pedir diagnóstico ou fechar negócio. Colunas válidas: 'demonstracao', 'negociacao', 'cliente', 'perdido'.
    """
    print(f"[HUNTERX KANBAN TOOL] Lead {lead_id} movido para a coluna: {nova_coluna}")
    return f"Status do lead {lead_id} atualizado com sucesso no Kanban para '{nova_coluna}'."


def create_hunter_agent(
    name: str = "HunterX Closer",
    system_prompt: Optional[str] = None,
    provider: str = "openai",
    model_name: str = "gpt-4o-mini",
    tone: str = "consultivo",
    knowledge_base: Optional[List[Dict[str, str]]] = None,
    fallback_to_human: bool = True,
    handoff_keywords: Optional[List[str]] = None,
) -> Agent:
    """
    Instancia um Agente Agno configurado com os parâmetros comerciais do HunterX.
    """
    # 1. Seleciona o modelo LLM
    if provider == "anthropic" and os.getenv("ANTHROPIC_API_KEY"):
        model = Claude(id="claude-3-5-sonnet-20241022")
    else:
        model = OpenAIChat(id=model_name or "gpt-4o-mini")

    # 2. Constrói as instruções do sistema
    instructions = [
        "Você é um consultor estratégico de vendas e prospecção de uma agência de elite.",
        "Seu foco exclusivo é prospectar e qualificar donos de negócios locais (médicos, clínicas, advogados, imobiliárias, serviços) para serviços de sites de alta conversão e marketing.",
        f"Seu tom de voz obrigatório é: {tone.upper()}.",
        "Regras essenciais:",
        "1. Nunca seja invasivo ou robótico; converse como um profissional humano de negócios.",
        "2. Identifique dores como: site lento, sem botão de WhatsApp, reputação fraca no Google ou falta de posicionamento local.",
        "3. Seu objetivo número 1 é agendar um 'Diagnóstico Rápido de 10 minutos' sem custo.",
        "4. Sempre que o lead aceitar agendar, use a ferramenta 'tool_mover_kanban' com a coluna 'demonstracao'.",
    ]

    if system_prompt:
        instructions.insert(0, system_prompt)

    if knowledge_base:
        instructions.append("\n--- BASE DE CONHECIMENTO E RESPOSTAS A OBJEÇÕES ---")
        for item in knowledge_base:
            title = item.get("title", "")
            content = item.get("content", "")
            instructions.append(f"Pergunta/Objeção: {title}\nOrientação de resposta: {content}\n")

    if fallback_to_human:
        keywords_str = ", ".join(handoff_keywords or ["humano", "atendente", "falar com pessoa"])
        instructions.append(
            f"Se o cliente expressar o desejo de falar com um atendente humano usando termos como ({keywords_str}), "
            "responda educadamente informando que vai transferir a conversa agora mesmo e inclua a flag [HUMAN_HANDOFF]."
        )

    # 3. Cria a instância do Agente Agno
    agent = Agent(
        name=name,
        model=model,
        instructions=instructions,
        tools=[tool_mover_kanban, DuckDuckGoTools()],
        show_tool_calls=True,
        markdown=False,
    )

    return agent

