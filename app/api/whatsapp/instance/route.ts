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

    if (action === "simulate-scan") {
      const result = await WhatsAppService.simulateScanSuccess(
        body.phoneNumber || "5583999998888",
        body.profileName || "WhatsApp HunterX"
      );
      return NextResponse.json(result);
    }

    const instance = await WhatsAppService.connectInstance();
    return NextResponse.json(instance);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  const result = await WhatsAppService.disconnectInstance();
  return NextResponse.json(result);
}

