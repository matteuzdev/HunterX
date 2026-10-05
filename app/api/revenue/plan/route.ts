import { NextResponse } from "next/server";
import { nextRevenueAction, selectSalesStrategy } from "@/lib/hunter/revenue-engine";
import type { LeadCrmRecord } from "@/lib/hunter/types";

export async function POST(req: Request) {
  try {
    const record = (await req.json()) as LeadCrmRecord;

    if (!record?.lead || !record?.status) {
      return NextResponse.json({ error: "LeadCrmRecord inválido." }, { status: 400 });
    }

    return NextResponse.json({
      strategy: selectSalesStrategy(record.lead),
      nextAction: nextRevenueAction(record),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
