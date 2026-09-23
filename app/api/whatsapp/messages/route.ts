import { NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/hunter/whatsapp-service";

export async function POST(req: Request) {
  try {
    const { phoneNumber, text } = await req.json();

    if (!phoneNumber || !text) {
      return NextResponse.json({ error: "phoneNumber e text são obrigatórios" }, { status: 400 });
    }

    const message = await WhatsAppService.sendMessage(phoneNumber, text);
    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

