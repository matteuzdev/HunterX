import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function payload() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const issuer = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/auth/v1`
    : "https://gohunterx.vercel.app";

  return {
    resource: "https://gohunterx.vercel.app/api/mcp",
    authorization_servers: [issuer],
    scopes_supported: ["email", "profile"],
    bearer_methods_supported: ["header"],
  };
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export async function GET() {
  return NextResponse.json(payload(), {
    headers: {
      ...cors,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}
