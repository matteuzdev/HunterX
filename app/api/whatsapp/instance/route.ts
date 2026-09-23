import { NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/hunter/whatsapp-service";

export async function GET() {
  const status = await WhatsAppService.getInstanceStatus();
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "connect";


    if (action === "connect") {
      const instance = await WhatsAppService.connectInstance();
      return NextResponse.json(instance);
    }

    if (action === "status") {
      const status = await WhatsAppService.getInstanceStatus();
      return NextResponse.json(status);
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  const result = await WhatsAppService.disconnectInstance();
  return NextResponse.json(result);
}
