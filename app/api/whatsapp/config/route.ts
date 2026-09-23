import { NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/hunter/whatsapp-service";

export async function GET() {
  const config = WhatsAppService.getConfig();
  // Não expõe a chave completa, apenas mascarada para segurança
  const maskedKey = config.apiKey
    ? config.apiKey.length > 8
      ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}`
      : "••••••••"
    : "";

  return NextResponse.json({
    apiUrl: config.apiUrl,
    instanceName: config.instanceName,
    hasApiKey: Boolean(config.apiKey),
    maskedApiKey: maskedKey,
    autoConnect: config.autoConnect,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "test") {
      const result = await WhatsAppService.testApiConnection({
        apiUrl: body.apiUrl,
        apiKey: body.apiKey,
        instanceName: body.instanceName,
      });
      return NextResponse.json(result);
    }

    // Salva as novas credenciais
    const updated = WhatsAppService.setConfig({
      apiUrl: body.apiUrl,
      apiKey: body.apiKey,
      instanceName: body.instanceName,
      autoConnect: body.autoConnect,
    });

    return NextResponse.json({
      success: true,
      apiUrl: updated.apiUrl,
      instanceName: updated.instanceName,
      hasApiKey: Boolean(updated.apiKey),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao processar configuração" }, { status: 500 });
  }
}
