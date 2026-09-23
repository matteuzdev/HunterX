import { NextResponse } from "next/server";
import { AgentEngine, DEFAULT_AGENTS } from "@/lib/hunter/agent-engine";
import { WhatsAppService } from "@/lib/hunter/whatsapp-service";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const event = payload.event;
    const data = payload.data;

    // Processa apenas mensagens recebidas (messages.upsert)
    if (event === "messages.upsert" && data?.key && !data.key.fromMe) {
      const remoteJid = data.key.remoteJid || "";
      const cleanPhone = remoteJid.split("@")[0];
      const messageText =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        "";

      if (messageText && cleanPhone) {
        // Seleciona o agente padrão ou especialista
        const agent = DEFAULT_AGENTS[0];

        // Processa resposta com o motor de IA do HunterX
        const aiResponse = await AgentEngine.processMessage({
          agent,
          userMessage: messageText,
          lead: { phone: cleanPhone },
        });

        // Envia resposta pelo WhatsApp se não for transbordo imediato
        if (aiResponse.reply) {
          await WhatsAppService.sendMessage(cleanPhone, aiResponse.reply);
        }

        return NextResponse.json({
          status: "processed",
          intent: aiResponse.detectedIntent,
          replied: true,
          shouldHandoff: aiResponse.shouldHandoff,
        });
      }
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

